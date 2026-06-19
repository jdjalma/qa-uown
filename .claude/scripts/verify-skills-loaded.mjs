#!/usr/bin/env node
// SubagentStop hook — mechanical enforcement of the skill loading protocol.
//
// Blocks a qa-* subagent from stopping when:
//   (a) it never Read any .claude/skills/{slug}/SKILL.md in its transcript, OR
//   (b) its final output lacks the `Skills loaded:` declaration line.
//
// Non-qa agents (Explore, general-purpose, ...) are always allowed.
// Blocks at most once per stop cycle (stop_hook_active guard — no infinite loop).
// Decisions are logged to .claude/logs/skills-hook.log.

import { readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_DIR =
  process.env.CLAUDE_PROJECT_DIR || join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LOG_FILE = join(PROJECT_DIR, ".claude", "logs", "skills-hook.log");

const QA_AGENTS = ["qa-planner", "qa-implementer", "qa-debugger", "qa-validator", "qa-doc-keeper"];

function log(msg) {
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {
    /* logging must never break the hook */
  }
}

function allow(reason) {
  log(`ALLOW — ${reason}`);
  process.exit(0);
}

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch (e) {
  allow(`stdin not parseable (${e.message})`);
}

// Already blocked once this cycle — let it stop, but leave an audit trail.
if (input.stop_hook_active) {
  allow(`stop_hook_active=true (agent=${input.agent_name ?? input.subagent_type ?? "?"}) — second pass, not re-blocking`);
}

// ---- 1. Identify the agent (input fields vary across Claude Code versions) ----
let agent =
  [input.agent_name, input.agent_type, input.subagent_type, input.agentName].find(
    (v) => typeof v === "string" && QA_AGENTS.includes(v)
  ) || null;

const transcriptPath = input.agent_transcript_path || input.transcript_path;
if (!transcriptPath || !existsSync(transcriptPath)) {
  allow(`no readable transcript (${transcriptPath ?? "undefined"}) — cannot verify, not blocking`);
}

let rawLines;
try {
  rawLines = readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
} catch (e) {
  allow(`transcript read failed (${e.message})`);
}

const entries = [];
for (const line of rawLines) {
  try {
    entries.push(JSON.parse(line));
  } catch {
    /* skip malformed lines */
  }
}

// If the transcript mixes main session + sidechains, scope to sidechain entries.
const sidechain = entries.filter((e) => e.isSidechain === true);
const scope = sidechain.length > 0 ? sidechain : entries;

// Fallback agent detection: scan transcript text for qa-* agent markers.
if (!agent) {
  const blob = rawLines.join("\n");
  agent =
    QA_AGENTS.find(
      (a) => blob.includes(`${a} —`) || blob.includes(`"name":"${a}"`) || blob.includes(`name: ${a}`)
    ) || null;
}
if (!agent) {
  allow(`not a qa-* agent (keys: ${Object.keys(input).join(",")})`);
}

// ---- 2. Collect SKILL.md Reads + final assistant text ----
const readSkills = new Set();
let lastText = "";
let consultedCanonical = false; // leu business-rules OU rodou `resolve` OU leu _index
for (const entry of scope) {
  const msg = entry.message;
  if (!msg) continue;
  const content = Array.isArray(msg.content) ? msg.content : [];
  for (const block of content) {
    if (block.type === "tool_use" && block.name === "Read") {
      const fp = String(block.input?.file_path ?? "");
      const m = fp.match(/\.claude\/skills\/([a-z0-9-]+)\/SKILL\.md$/);
      if (m) readSkills.add(m[1]);
      if (/docs\/business-rules\/|docs\/.*_index\./.test(fp)) consultedCanonical = true;
    }
    if (block.type === "tool_use" && block.name === "Bash") {
      const cmd = String(block.input?.command ?? "");
      if (/docs-tooling\.mjs\s+resolve/.test(cmd)) consultedCanonical = true;
    }
    if (msg.role === "assistant" && block.type === "text" && block.text?.trim()) {
      lastText = block.text;
    }
  }
}

const declared = /\*{0,2}skills loaded:?\*{0,2}/i.test(lastText);

// ---- Advisory (NÃO bloqueia): claim [CONFIRMADO] sem consulta à fonte canônica ----
// Sinaliza no log quando o agente afirma [CONFIRMADO]/[CONFIRMED] mas não leu
// business-rules nem rodou `resolve`. Pura auditoria — control flow inalterado.
if (/\[CONFIRMAD[OA]\]|\[CONFIRMED\]/i.test(lastText) && !consultedCanonical) {
  log(
    `ADVISORY — agent=${agent} fez claim [CONFIRMADO] sem consultar fonte canônica ` +
    `(nenhum docs/business-rules lido, nenhum 'resolve' rodado). Regra #16: cross-check contra source primária.`
  );
}

// ---- 3. Verdict ----
if (readSkills.size > 0 && declared) {
  allow(`agent=${agent} read=[${[...readSkills].join(", ")}] declared=yes`);
}

const problems = [];
if (readSkills.size === 0)
  problems.push("nenhum `.claude/skills/*/SKILL.md` foi lido via Read nesta sessão");
if (!declared) problems.push("o output final não contém a linha `**Skills loaded:**`");

log(
  `BLOCK — agent=${agent} read=[${[...readSkills].join(", ") || "(nenhuma)"}] declared=${declared}`
);

console.log(
  JSON.stringify({
    decision: "block",
    reason:
      `[hook verify-skills-loaded] Protocolo de carga de skills não cumprido: ${problems.join("; ")}. ` +
      `Antes de encerrar: (1) faça Read dos SKILL.md do seu grupo "Always" em .claude/skills/{slug}/SKILL.md ` +
      `e dos condicionais cujo trigger se aplica à task; (2) termine o output com a linha **Skills loaded:** ` +
      `listando exatamente os arquivos lidos. ` +
      `Skills já lidas nesta sessão: ${[...readSkills].join(", ") || "(nenhuma)"}.`,
  })
);
process.exit(0);
