#!/usr/bin/env node
// docs-tooling.mjs — validação de frontmatter e geração de índices para
// docs/business-rules/ e docs/knowledge-base/.
//
// Schema e semântica definidos em docs/_docs-conventions.md (fonte única).
// Zero dependências externas (o projeto não tem yaml/glob) — parser próprio.
//
// Uso:
//   node scripts/docs-tooling.mjs check    # valida frontmatter + code anchors + staleness
//   node scripts/docs-tooling.mjs index    # (re)gera _index.md + bloco volatile
//
// Exit code != 0 em check quando há ERRO (frontmatter ausente, campo obrigatório
// faltando, code-anchor quebrado). Staleness é WARN (não falha o build).

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, basename } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const FOLDERS = [
  { dir: 'docs/business-rules', domain: 'business-rules' },
  { dir: 'docs/knowledge-base', domain: 'knowledge-base' },
];

// Arquivos que NÃO carregam frontmatter (gerados, meta ou índice curado).
// BUSINESS_RULES.md é um hub de navegação sem claims técnicas próprias (ver §2).
const EXEMPT = new Set(['_index.md', '_docs-conventions.md', 'BUSINESS_RULES.md']);

const REQUIRED_FIELDS = ['title', 'domain', 'status', 'volatility', 'last_verified', 'sources', 'covers'];
const STATUS_VALUES = new Set(['stable', 'snapshot', 'hypothesis']);
const VOLATILITY_VALUES = new Set(['stable', 'volatile']);

// Staleness budget (dias) por volatilidade.
const STALENESS_DAYS = { volatile: 30, stable: 180 };

const VOLATILE_BLOCK_BEGIN = '<!-- BEGIN generated:volatile-docs -->';
const VOLATILE_BLOCK_END = '<!-- END generated:volatile-docs -->';
const VOLATILE_REGISTRY = '.claude/skills/volatile-knowledge-registry/SKILL.md';

// ── Frontmatter parser (subset YAML suficiente p/ o schema de §2) ───────────

/**
 * Extrai e parseia o bloco frontmatter. Retorna { data, hasFrontmatter }.
 * Suporta: escalares, inline arrays `[a, b]`, block lists de strings e
 * block lists de mapas single-key (sources: - code: x).
 */
function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {}, hasFrontmatter: false };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: {}, hasFrontmatter: false };
  const block = raw.slice(3, end).replace(/^\n/, '');
  const lines = block.split('\n');
  const data = {};
  let currentKey = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const itemMatch = line.match(/^\s+-\s+(.*)$/);
    if (itemMatch && currentKey) {
      const item = itemMatch[1].trim();
      const kv = item.match(/^(\w+):\s*(.*)$/);
      if (kv) {
        // item-mapa: { type, value }  (ex.: - code: src/x.ts)
        data[currentKey].push({ type: kv[1], value: stripQuotes(kv[2]) });
      } else {
        data[currentKey].push(stripQuotes(item));
      }
      continue;
    }

    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === '') {
        // header de block list
        data[key] = [];
        currentKey = key;
      } else if (val.startsWith('[') && val.endsWith(']')) {
        // inline array
        data[key] = val.slice(1, -1).split(',').map((s) => stripQuotes(s.trim())).filter(Boolean);
        currentKey = null;
      } else {
        data[key] = stripQuotes(val);
        currentKey = null;
      }
    }
  }
  return { data, hasFrontmatter: true };
}

function stripQuotes(s) {
  return s.replace(/^["']|["']$/g, '').trim();
}

// ── Vocabulário controlado (docs/_topics.json) ──────────────────────────────

let _topicMaps = null;
function topicMaps() {
  if (_topicMaps) return _topicMaps;
  const path = join(ROOT, 'docs/_topics.json');
  const canonical = new Set();
  const aliasToCanonical = new Map();
  if (existsSync(path)) {
    const { topics } = JSON.parse(readFileSync(path, 'utf8'));
    for (const [canon, aliases] of Object.entries(topics)) {
      canonical.add(canon);
      for (const a of aliases) aliasToCanonical.set(a, canon);
    }
  }
  _topicMaps = { canonical, aliasToCanonical };
  return _topicMaps;
}

/** Normaliza um slug para o tópico canônico, ou null se desconhecido. */
function normalizeTopic(t) {
  const { canonical, aliasToCanonical } = topicMaps();
  if (canonical.has(t)) return t;
  if (aliasToCanonical.has(t)) return aliasToCanonical.get(t);
  return null;
}

// ── Parser de seções (## / ### → anchors estilo GitHub) ─────────────────────

/** Slug de anchor compatível com GitHub para um heading. */
function githubAnchor(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\sÀ-ɏ-]/g, '')
    .replace(/\s+/g, '-');
}

/** Extrai seções (## e ###) do corpo, ignorando o frontmatter. */
function parseSections(raw) {
  let body = raw;
  if (raw.startsWith('---')) {
    const end = raw.indexOf('\n---', 3);
    if (end !== -1) body = raw.slice(end + 4);
  }
  const sections = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (m) sections.push({ level: m[1].length, heading: m[2], anchor: githubAnchor(m[2]) });
  }
  return sections;
}

// ── Coleta de arquivos ──────────────────────────────────────────────────────

function docFiles(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.endsWith('.md') && !EXEMPT.has(f))
    .sort()
    .map((f) => ({ name: f, rel: join(dir, f), abs: join(abs, f) }));
}

function daysBetween(isoDate, now) {
  const d = new Date(isoDate + 'T00:00:00Z');
  if (isNaN(d.getTime())) return null;
  return Math.floor((now - d.getTime()) / 86_400_000);
}

// ── Comando: check ───────────────────────────────────────────────────────────

function runCheck() {
  const now = Date.now();
  const errors = [];
  const warns = [];
  let checked = 0;

  for (const { dir, domain } of FOLDERS) {
    for (const file of docFiles(dir)) {
      checked++;
      const raw = readFileSync(file.abs, 'utf8');
      const { data, hasFrontmatter } = parseFrontmatter(raw);

      if (!hasFrontmatter) {
        errors.push(`${file.rel}: sem frontmatter (ver docs/_docs-conventions.md §2)`);
        continue;
      }

      for (const field of REQUIRED_FIELDS) {
        if (data[field] === undefined || (Array.isArray(data[field]) && data[field].length === 0)) {
          errors.push(`${file.rel}: campo obrigatório ausente/vazio: '${field}'`);
        }
      }

      if (data.domain && data.domain !== domain) {
        errors.push(`${file.rel}: domain='${data.domain}' não bate com a pasta ('${domain}')`);
      }
      if (data.status && !STATUS_VALUES.has(data.status)) {
        errors.push(`${file.rel}: status inválido '${data.status}' (esperado: ${[...STATUS_VALUES].join('|')})`);
      }
      if (data.volatility && !VOLATILITY_VALUES.has(data.volatility)) {
        errors.push(`${file.rel}: volatility inválido '${data.volatility}' (esperado: ${[...VOLATILITY_VALUES].join('|')})`);
      }

      // Code anchors — a parte auto-verificável (§3).
      const sources = Array.isArray(data.sources) ? data.sources : [];
      for (const src of sources) {
        if (!src || src.type !== 'code') continue;
        const [path, token] = String(src.value).split('#');
        const codeAbs = join(ROOT, path);
        if (!existsSync(codeAbs)) {
          errors.push(`${file.rel}: code anchor inexistente → ${path}`);
          continue;
        }
        if (token) {
          const codeRaw = readFileSync(codeAbs, 'utf8');
          if (!codeRaw.includes(token)) {
            errors.push(`${file.rel}: token '${token}' não encontrado em ${path}`);
          }
        }
      }

      // Vocabulário controlado: covers deve ser canônico ou alias conhecido (WARN).
      const covers = Array.isArray(data.covers) ? data.covers : [];
      for (const c of covers) {
        if (normalizeTopic(c) === null) {
          warns.push(`${file.rel}: tópico não-canônico em covers: '${c}' — adicione como alias em docs/_topics.json ou use o canônico`);
        }
      }

      // Staleness budget (WARN).
      if (data.last_verified && data.volatility) {
        const age = daysBetween(data.last_verified, now);
        if (age === null) {
          errors.push(`${file.rel}: last_verified inválido '${data.last_verified}' (YYYY-MM-DD)`);
        } else {
          const budget = STALENESS_DAYS[data.volatility];
          if (budget && age > budget) {
            warns.push(`${file.rel}: ${data.volatility} verificado há ${age}d (budget ${budget}d) — re-verificar contra fonte primária`);
          }
        }
      }
    }
  }

  console.log(`\n📋 docs-tooling check — ${checked} arquivos\n`);
  if (warns.length) {
    console.log(`⚠️  ${warns.length} WARN (staleness):`);
    for (const w of warns) console.log(`   - ${w}`);
    console.log('');
  }
  if (errors.length) {
    console.log(`❌ ${errors.length} ERRO:`);
    for (const e of errors) console.log(`   - ${e}`);
    console.log('');
    process.exitCode = 1;
  } else {
    console.log('✅ Sem erros de frontmatter ou code-anchor.\n');
  }
}

// ── Comando: index ───────────────────────────────────────────────────────────

function collectMeta(dir) {
  const rows = [];
  for (const file of docFiles(dir)) {
    const raw = readFileSync(file.abs, 'utf8');
    const { data, hasFrontmatter } = parseFrontmatter(raw);
    const sections = parseSections(raw);
    const coversCanonical = (Array.isArray(data.covers) ? data.covers : [])
      .map((c) => normalizeTopic(c))
      .filter(Boolean);
    rows.push({ name: file.name, rel: file.rel, hasFrontmatter, data, sections, coversCanonical });
  }
  return rows;
}

/** Estrutura machine-readable de um doc para o _index.json. */
function jsonRow(dir, r) {
  return {
    file: r.name,
    path: r.rel,
    title: r.data.title || null,
    domain: r.data.domain || null,
    status: r.data.status || null,
    volatility: r.data.volatility || null,
    last_verified: r.data.last_verified || null,
    covers: r.coversCanonical,
    sources: Array.isArray(r.data.sources) ? r.data.sources : [],
    sections: r.sections.map((s) => ({ heading: s.heading, anchor: s.anchor })),
  };
}

function fmtCovers(covers) {
  if (!Array.isArray(covers) || !covers.length) return '—';
  return covers.join(', ');
}

function buildIndex(dir, domain, rows) {
  const lines = [];
  lines.push('<!-- GERADO por scripts/docs-tooling.mjs — NÃO editar à mão. Rode: node scripts/docs-tooling.mjs index -->');
  lines.push(`# Índice — ${dir}`);
  lines.push('');
  lines.push(`> Manifesto gerado a partir do frontmatter (ver \`docs/_docs-conventions.md\`). ${rows.length} arquivos.`);
  lines.push('> Consumidores: leia este índice primeiro para localizar o arquivo canônico por tópico antes de abrir os docs.');
  lines.push('');
  lines.push('| Arquivo | Título | Status | Volatilidade | Verificado | Cobre |');
  lines.push('|---------|--------|--------|--------------|------------|-------|');
  for (const r of rows.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!r.hasFrontmatter) {
      lines.push(`| [${r.name}](${r.name}) | ⚠️ sem frontmatter | — | — | — | — |`);
      continue;
    }
    const d = r.data;
    lines.push(
      `| [${r.name}](${r.name}) | ${d.title || '—'} | ${d.status || '—'} | ${d.volatility || '—'} | ${d.last_verified || '—'} | ${fmtCovers(d.covers)} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function buildVolatileBlock(allRows) {
  const volatile = allRows.filter((r) => r.hasFrontmatter && r.data.volatility === 'volatile');
  const lines = [];
  lines.push(VOLATILE_BLOCK_BEGIN);
  lines.push('');
  lines.push('## Docs marcados `volatility: volatile` (gerado)');
  lines.push('');
  lines.push('> Gerado por `scripts/docs-tooling.mjs index` a partir do frontmatter. Estes docs caem em categorias drift-prone — cross-check contra a `source` primária antes de afirmar.');
  lines.push('');
  if (!volatile.length) {
    lines.push('_(nenhum doc marcado volatile ainda)_');
  } else {
    lines.push('| Doc | Verificado | Fontes primárias |');
    lines.push('|-----|------------|------------------|');
    for (const r of volatile.sort((a, b) => a.rel.localeCompare(b.rel))) {
      const srcs = (Array.isArray(r.data.sources) ? r.data.sources : [])
        .map((s) => (s && s.type ? `${s.type}:${s.value}` : String(s)))
        .join('; ') || '—';
      lines.push(`| \`${r.rel}\` | ${r.data.last_verified || '—'} | ${srcs} |`);
    }
  }
  lines.push('');
  lines.push(VOLATILE_BLOCK_END);
  return lines.join('\n');
}

function runIndex() {
  const allRows = [];
  for (const { dir, domain } of FOLDERS) {
    const rows = collectMeta(dir);
    allRows.push(...rows);
    const out = buildIndex(dir, domain, rows);
    writeFileSync(join(ROOT, dir, '_index.md'), out);
    console.log(`✅ ${join(dir, '_index.md')} (${rows.length} arquivos)`);
    // Artefato machine-readable consumido por `resolve`.
    const jsonOut = { generated_by: 'scripts/docs-tooling.mjs', domain, docs: rows.map((r) => jsonRow(dir, r)) };
    writeFileSync(join(ROOT, dir, '_index.json'), JSON.stringify(jsonOut, null, 2) + '\n');
    console.log(`✅ ${join(dir, '_index.json')}`);
  }

  // Atualiza bloco gerado no volatile-knowledge-registry (idempotente).
  const regAbs = join(ROOT, VOLATILE_REGISTRY);
  if (existsSync(regAbs)) {
    const block = buildVolatileBlock(allRows);
    let content = readFileSync(regAbs, 'utf8');
    const b = content.indexOf(VOLATILE_BLOCK_BEGIN);
    const e = content.indexOf(VOLATILE_BLOCK_END);
    if (b !== -1 && e !== -1) {
      content = content.slice(0, b) + block + content.slice(e + VOLATILE_BLOCK_END.length);
    } else {
      content = content.replace(/\s*$/, '') + '\n\n---\n\n' + block + '\n';
    }
    writeFileSync(regAbs, content);
    console.log(`✅ ${VOLATILE_REGISTRY} (bloco volatile regenerado)`);
  } else {
    console.log(`⚠️  ${VOLATILE_REGISTRY} não encontrado — bloco volatile não gerado`);
  }
}

// ── Comando: resolve ─────────────────────────────────────────────────────────

function loadIndexJson(dir) {
  const path = join(ROOT, dir, '_index.json');
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Melhor anchor de seção para o tópico (match de palavras no heading). */
function bestSection(doc, canonical) {
  const words = canonical.split('-').filter((w) => w.length > 2);
  let best = null;
  let bestScore = 0;
  for (const s of doc.sections || []) {
    const h = s.heading.toLowerCase();
    const score = words.reduce((n, w) => n + (h.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore > 0 ? best : null;
}

function isStale(doc, now) {
  if (!doc.last_verified || !doc.volatility) return false;
  const age = daysBetween(doc.last_verified, now);
  const budget = STALENESS_DAYS[doc.volatility];
  return age !== null && budget && age > budget;
}

function runResolve() {
  const raw = process.argv[3];
  if (!raw) {
    console.log('Uso: node scripts/docs-tooling.mjs resolve <tópico>');
    process.exitCode = 2;
    return;
  }
  const canonical = normalizeTopic(raw);
  if (!canonical) {
    const { canonical: set } = topicMaps();
    const guess = [...set].filter((t) => t.includes(raw) || raw.includes(t)).slice(0, 5);
    console.log(`\n❓ Tópico desconhecido: '${raw}'`);
    if (guess.length) console.log(`   Você quis dizer: ${guess.join(', ')}?`);
    console.log('   Tópicos canônicos: docs/_topics.json\n');
    process.exitCode = 1;
    return;
  }

  const now = Date.now();
  const br = loadIndexJson('docs/business-rules');
  const kb = loadIndexJson('docs/knowledge-base');
  if (!br || !kb) {
    console.log('⚠️  _index.json ausente — rode `node scripts/docs-tooling.mjs index` primeiro.');
    process.exitCode = 1;
    return;
  }

  const match = (idx) => (idx ? idx.docs.filter((d) => (d.covers || []).includes(canonical)) : []);
  const brHits = match(br);
  const kbHits = match(kb);

  console.log(`\n🎯 resolve '${raw}' → tópico canônico: ${canonical}\n`);

  if (!brHits.length && !kbHits.length) {
    console.log('   Nenhum doc cobre este tópico ainda (covers vazio para ele).\n');
    return;
  }

  if (brHits.length) {
    console.log('📘 CANÔNICO (business-rules — o que o produto faz):');
    for (const d of brHits) {
      const sec = bestSection(d, canonical);
      const link = sec ? `${d.path}#${sec.anchor}` : d.path;
      const stale = isStale(d, now) ? '  ⚠️ STALE — re-verificar contra fonte primária' : '';
      console.log(`   → ${link}`);
      console.log(`     verificado ${d.last_verified} · ${d.volatility}${stale}`);
      if (sec) console.log(`     seção: "${sec.heading}"`);
    }
    console.log('');
  }

  if (kbHits.length) {
    console.log('📗 RELACIONADO (knowledge-base — observação recente, CROSS-CHECK obrigatório):');
    for (const d of kbHits) {
      const stale = isStale(d, now) ? '  ⚠️ STALE' : '';
      console.log(`   → ${d.path}  (${d.status}, verificado ${d.last_verified})${stale}`);
    }
    console.log('');
  }

  const anyVolatile = [...brHits, ...kbHits].some((d) => d.volatility === 'volatile');
  if (anyVolatile) {
    console.log('🔒 Categoria volatile — NÃO afirme de memória. Leia o canônico acima e cite a source primária (Regra #16).\n');
  }
}

// ── Entry ────────────────────────────────────────────────────────────────────

const cmd = process.argv[2];
if (cmd === 'check') runCheck();
else if (cmd === 'index') runIndex();
else if (cmd === 'resolve') runResolve();
else {
  console.log('Uso: node scripts/docs-tooling.mjs <check|index|resolve <tópico>>');
  process.exitCode = 2;
}
