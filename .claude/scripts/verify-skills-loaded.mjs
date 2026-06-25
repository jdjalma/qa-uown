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

// Fallback agent detection: scan structured JSON fields only — never raw text blob.
// Blob scanning caused false positives when agents Read .claude/agents/*.md files
// (those files contain `name: qa-planner` in their content, matching non-qa agents).
if (!agent) {
  for (const entry of entries) {
    const msg = entry.message;
    if (!msg) continue;
    // Check structured message-level fields
    const candidate = [
      entry.agent_name,
      entry.agent_type,
      entry.subagent_type,
      msg.agent_name,
      msg.agent_type,
    ].find((v) => typeof v === "string" && QA_AGENTS.includes(v));
    if (candidate) { agent = candidate; break; }
  }
}
if (!agent) {
  allow(`not a qa-* agent (input keys: ${Object.keys(input).join(",")})`);
}

// ---- 2. Collect SKILL.md Reads + final assistant text ----
const readSkills = new Set();
let lastText = "";
let consultedCanonical = false; // read business-rules OR ran `resolve` OR read _index
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

// ---- Advisory (does NOT block): [CONFIRMED] claim without consulting canonical source ----
// Signals in the log when an agent asserts [CONFIRMED] but did not read
// business-rules or run `resolve`. Audit only — control flow unchanged.
if (/\[CONFIRMAD[OA]\]|\[CONFIRMED\]/i.test(lastText) && !consultedCanonical) {
  log(
    `ADVISORY — agent=${agent} made a [CONFIRMED] claim without consulting a canonical source ` +
    `(no docs/business-rules read, no 'resolve' run). Rule #16: cross-check against primary source.`
  );
}

// ---- 3. Verdict ----
if (readSkills.size > 0 && declared) {
  allow(`agent=${agent} read=[${[...readSkills].join(", ")}] declared=yes`);
}

const problems = [];
if (readSkills.size === 0)
  problems.push("no `.claude/skills/*/SKILL.md` was read via Read in this session");
if (!declared) problems.push("the final output does not contain the `**Skills loaded:**` line");

log(
  `BLOCK — agent=${agent} read=[${[...readSkills].join(", ") || "(none)"}] declared=${declared}`
);

console.log(
  JSON.stringify({
    decision: "block",
    reason:
      `[hook verify-skills-loaded] Skill loading protocol not fulfilled: ${problems.join("; ")}. ` +
      `Before stopping: (1) Read the SKILL.md files from your "Always" group at .claude/skills/{slug}/SKILL.md ` +
      `and any conditional ones whose trigger applies to this task; (2) end the output with the **Skills loaded:** line ` +
      `listing exactly the files read. ` +
      `Skills already read in this session: ${[...readSkills].join(", ") || "(none)"}.`,
  })
);
process.exit(0);
