# Convenções de Documentação — UOWN Leasing QA

> **Fonte única** do schema de frontmatter, do protocolo de promoção e do protocolo de carga para `docs/business-rules/` e `docs/knowledge-base/`. Consumido por agentes (`qa-planner`, `qa-doc-keeper`), skills (`discovery`, `test-scenarios`, `volatile-knowledge-registry`) e pelo tooling (`scripts/docs-tooling.mjs`).
>
> Mudou o schema aqui? Atualize `scripts/docs-tooling.mjs` (validação) e re-rode `node scripts/docs-tooling.mjs index`.

---

## 1. As duas pastas — modelo mental

| | `docs/business-rules/` | `docs/knowledge-base/` |
|---|---|---|
| **O que é** | Base consolidada e estável do produto | Investigações pontuais por feature (snapshots datados) |
| **Granularidade** | Domínio completo (capítulos `NN-*.md` + `appendix-*`) | 1 arquivo por feature/entidade (`<topic>.md`, kebab-case) |
| **Quem escreve** | Curadoria via `qa-doc-keeper` (promoção a partir do KB) | Skill `/discovery` automaticamente |
| **Volatilidade típica** | `stable` | `snapshot` (capturado num ponto no tempo) |
| **Confiabilidade** | Fonte de verdade que se cita | Caderno de campo — exige cross-check (Regra #16) |

Fluxo: `/discovery` investiga (UI→API→DB) → escreve em `knowledge-base/` → quando o achado vira verdade estável → **promovido** para `business-rules/` pelo `qa-doc-keeper` (ver §4).

---

## 2. Schema de frontmatter (YAML)

Todo arquivo `.md` nas duas pastas — **exceto** `_index.md` (gerado) e este arquivo — começa com um bloco frontmatter. Ele vai **acima** de qualquer conteúdo existente (título, Charter block etc. permanecem intactos logo abaixo).

```yaml
---
title: Funding e Gestão de Merchants        # humano, curto
domain: business-rules                       # business-rules | knowledge-base
status: stable                               # stable | snapshot | hypothesis
volatility: volatile                         # stable | volatile  → dirige o staleness budget
last_verified: 2026-06-18                     # YYYY-MM-DD — data da última verificação contra fonte primária
sources:                                      # fontes primárias que embasam as claims do doc
  - code: src/data/merchant-config-contract.ts
  - code: src/config/constants.ts#generateTestSSN
  - db: uown_scheduled_task
  - env: qa2
  - lead: 16651
covers: [funding, merchants, webhooks]        # tópicos — alimenta o _index.md e busca de relevância
# --- só em business-rules/ (proveniência da promoção): ---
derived_from: [underwriting-and-funding-test-data-paths]
# --- só em knowledge-base/ (para onde graduou, se já promovido): ---
promoted_to: [appendix-c-tabelas-banco, appendix-f-sql-reference]
---
```

### Campos

| Campo | Obrigatório | Valores | Significado |
|-------|-------------|---------|-------------|
| `title` | sim | string | Nome humano curto |
| `domain` | sim | `business-rules` \| `knowledge-base` | Pasta de origem (sanity check) |
| `status` | sim | `stable` \| `snapshot` \| `hypothesis` | Confiança epistêmica. `snapshot` = válido no momento da captura; `hypothesis` = não confirmado em fresh data |
| `volatility` | sim | `stable` \| `volatile` | `volatile` se cai numa categoria do `volatile-knowledge-registry` (merchant config, sweep SQL, rating letters, env provisioning, vendor health, activity log schema, portal naming, selectors recém-refatorados) |
| `last_verified` | sim | `YYYY-MM-DD` | Última vez que o conteúdo foi conferido contra fonte primária |
| `sources` | sim (≥1) | lista de `{tipo: valor}` | Ver §3 |
| `covers` | sim | lista de slugs | Tópicos cobertos — para índice/relevância |
| `derived_from` | não (só BR) | lista de slugs de KB | Quais arquivos de KB foram promovidos para cá |
| `promoted_to` | não (só KB) | lista de slugs de BR | Para onde este KB graduou (vazio = ainda não promovido) |

---

## 3. `sources` — semântica de proveniência (o que o drift-check valida)

Cada entrada é um par `tipo: valor`. Tipos:

| Tipo | Exemplo | Auto-verificável? | O que o `check` faz |
|------|---------|-------------------|---------------------|
| `code` | `src/data/state-merchant-matrix.ts` | **sim** | Arquivo deve existir |
| `code` (com token) | `src/config/constants.ts#generateTestSSN` | **sim** | Arquivo existe **e** o token (`#...`) aparece nele |
| `db` | `uown_scheduled_task` | parcial | Registra a tabela citada (re-query exige credenciais — só no `check --db`) |
| `env` | `qa2` | não | Contexto. Conta para o staleness budget |
| `lead` / `account` | `16651` | não | Evidência rastreável (reprodução manual) |
| `gitlab` / `flyway` | `20260609155406` | não | Referência externa |

**Regra de ouro:** toda claim técnica que **espelha código** (matriz de estado, constantes, enums, SQL de sweep) DEVE ter uma `source: code` com token — é o que permite pegar drift automaticamente. Foi exatamente o gap que deixou `state-merchant-matrix.ts` (NY/OH) divergir do KB sem ninguém notar.

### Staleness budget

`check` emite WARN quando `last_verified` está mais velho que:

- `volatility: volatile` → **30 dias**
- `volatility: stable` → **180 dias**

`status: snapshot` é informativo (não expira sozinho), mas se também for `volatile`, o budget de 30 dias se aplica.

---

## 4. Protocolo de promoção (`knowledge-base` → `business-rules`)

Owner: **`qa-doc-keeper`** (roda por último em todo pipeline).

### Gatilho (todos os critérios)

Um achado de KB está pronto para promoção quando:
1. **`status: stable`** — confirmado em **fresh data** (não observação isolada em registro pré-existente);
2. Reproduzido em **≥2 ambientes** OU confirmado contra **código/DDL** (não só UI);
3. Não é mais `snapshot` de uma feature em rollout (a feature está deployada de forma estável).

### Mecânica

1. Migrar/sintetizar o conteúdo para o subordinado de `business-rules/` correto (não copiar o caderno inteiro — destilar a regra).
2. No arquivo de `business-rules/`: adicionar o slug do KB em `derived_from:`.
3. No arquivo de `knowledge-base/`: adicionar o slug do BR em `promoted_to:`.
4. Atualizar `last_verified` do BR para a data da promoção.

Link bidirecional = rastreabilidade: dá pra ir do fato consolidado até a investigação que o originou e vice-versa.

> Exemplo real (2026-06-18): a feature **Merchant Settings Snapshot** vivia só em `underwriting-and-funding-test-data-paths.md`. Foi destilada para `appendix-c-tabelas-banco.md` (tabelas) e `appendix-f-sql-reference.md` (queries). `derived_from` / `promoted_to` registram o vínculo.

---

## 5. Protocolo de carga (consumidores)

Todo agente/skill que precisa de conhecimento de produto carrega **nesta ordem**:

1. **`node scripts/docs-tooling.mjs resolve <tópico>`** — preferível: resolve o tópico no arquivo canônico + seção (deep-link) + frescor + KB relacionado, sem ler nada especulativamente. Fallback: ler o `_index.md` da pasta.
2. **`docs/business-rules/`** primeiro (base consolidada) — abra a seção que o `resolve` apontou, não o capítulo inteiro.
3. **`docs/knowledge-base/`** depois (investigações específicas, mais frescas — cross-check obrigatório).

Regras:
- **Nunca** responder de memória sobre categoria `volatile` — cross-check contra a `source` primária (Regra #16 + `volatile-knowledge-registry`).
- Achou divergência doc-vs-código? É um finding: corrija a `source` e atualize `last_verified` (ou abra task se for bug de produto).
- `business-rules/` ganha de `knowledge-base/` em caso de conflito **só se** o `last_verified` do BR for mais recente; senão, o KB (mais fresco) vence e deve disparar promoção.

---

## 6. Tooling

```bash
node scripts/docs-tooling.mjs check          # valida frontmatter + code anchors + staleness + vocabulário
node scripts/docs-tooling.mjs index          # (re)gera _index.md + _index.json por pasta
                                             # + atualiza bloco gerado no volatile-knowledge-registry
node scripts/docs-tooling.mjs resolve <tema> # resolve um tópico → arquivo canônico + seção + frescor
```

Atalhos npm: `npm run docs:check` · `npm run docs:index` · `npm run docs:resolve <tema>`.

`check` sai com código ≠ 0 se houver **code-anchor quebrado** ou **arquivo sem frontmatter** — pronto para CI/pre-commit. Staleness e tópico não-canônico são **WARN** (não falham o build).

### Vocabulário controlado (`docs/_topics.json`)

`covers:` aceita apenas tópicos **canônicos** (chaves de `_topics.json`) ou **aliases** declarados lá. Slug fora do vocabulário → WARN no `check`. **Para adicionar um termo, registre-o como alias do canônico existente** em `_topics.json` — não crie slug novo solto (foi assim que `gowsign` / `gowsign-routing` / `esign-provider` driftaram). PT-BR é absorvido por alias (ex.: `reembolso` → `refund`).

### `resolve` — o resolvedor de consumo

`resolve <tema>` é como agentes/skills **localizam a fonte** em vez de `Glob`+ler-tudo:
1. Normaliza o tema (alias → canônico).
2. Retorna o(s) arquivo(s) **canônico(s) de business-rules** com deep-link de seção (`arquivo.md#anchor`), `last_verified` e flag **STALE** se volatile fora do budget.
3. Lista o **KB relacionado** (mais fresco, exige cross-check).
4. Emite o lembrete de fonte primária para categoria `volatile`.

Lê os `_index.json` gerados — rode `index` antes. Consumidores devem preferir `resolve` à navegação manual (ver §5).

---

## 7. Fronteira de autoridade — skill ↔ business-rules ↔ knowledge-base

Três camadas falam dos mesmos temas (ex.: GowSign vive em `gowsign-knowledge` skill + `03-contratos-esign.md` + 3 KBs). Para o consumidor não escolher fonte no olho nem repetir conteúdo, cada camada tem **um papel exclusivo**:

| Camada | Responde | NÃO contém |
|--------|----------|------------|
| **Skill** (`.claude/skills/`) | **Como testar** — procedimentos, patterns, catálogo de suites, regressão obrigatória, helpers | Comportamento canônico do produto (routing, regras, matriz de estado) |
| **business-rules** | **O que o produto faz** — comportamento canônico, regras, enums, fórmulas | Como dirigir o teste; observações pontuais de uma run |
| **knowledge-base** | **O que observamos recentemente** — investigação datada, fresca, `volatile` | Regra estabelecida (isso é promoção → business-rules, §4) |

**Regra de não-repetição:** uma camada **aponta** para a fonte canônica em vez de reescrevê-la. Um skill que precisa de um fato de comportamento (qual estado roteia para qual provider) linka `business-rules` / diz "rode `resolve <tópico>`" — não mantém uma segunda cópia que vai driftar. Fato de comportamento duplicado em skill = mesma classe de bug que o master monolítico (§1).

Ao consumir: pergunta de **comportamento** → `resolve` → business-rules; "**como dirijo o teste**" → skill; "**tem gotcha recente**" → knowledge-base.
