#!/usr/bin/env node
// SubagentStop / Stop hook — BDD oracle enforcement (rule #19).
//
// If the agent used any mcp__playwright__browser_* tool (portal interaction),
// it MUST have read docs/scenarios/_index.md before stopping.
//
// If it also read a docs/scenarios/*.md BDD file (oracle content), the final
// output MUST contain "Oracle:" confirming the checkpoints were validated.
//
// Blocks at most once per stop cycle (stop_hook_active guard — no infinite loop).
// Decisions are logged to .claude/logs/bdd-oracle-hook.log.

import { readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_DIR =
  process.env.CLAUDE_PROJECT_DIR || join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LOG_FILE = join(PROJECT_DIR, ".claude", "logs", "bdd-oracle-hook.log");

const PLAYWRIGHT_TOOLS = [
  "mcp__playwright__browser_navigate",
  "mcp__playwright__browser_click",
  "mcp__playwright__browser_fill_form",
  "mcp__playwright__browser_type",
  "mcp__playwright__browser_press_key",
  "mcp__playwright__browser_select_option",
  "mcp__playwright__browser_file_upload",
];

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

// Already blocked once this cycle — let it stop.
if (input.stop_hook_active) {
  allow(`stop_hook_active=true — second pass, not re-blocking`);
}

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

const sidechain = entries.filter((e) => e.isSidechain === true);
const scope = sidechain.length > 0 ? sidechain : entries;

// ---- Scan transcript ----
let usedPlaywright = false;
let readIndex = false;
let readBddFile = false;
let lastText = "";

for (const entry of scope) {
  const msg = entry.message;
  if (!msg) continue;
  const content = Array.isArray(msg.content) ? msg.content : [];

  for (const block of content) {
    // Playwright tool calls
    if (block.type === "tool_use" && PLAYWRIGHT_TOOLS.includes(block.name)) {
      usedPlaywright = true;
    }

    // Read tool calls
    if (block.type === "tool_use" && block.name === "Read") {
      const fp = String(block.input?.file_path ?? "");
      if (/docs\/scenarios\/_index\.md$/.test(fp)) readIndex = true;
      if (/docs\/scenarios\/[^/]+\.md$/.test(fp) && !/_index\.md$/.test(fp)) readBddFile = true;
    }

    // Final assistant text
    if (msg.role === "assistant" && block.type === "text" && block.text?.trim()) {
      lastText = block.text;
    }
  }
}

// No portal interaction → nothing to enforce
if (!usedPlaywright) {
  allow(`no playwright tools used — BDD oracle not required`);
}

// ---- Verdict ----
const problems = [];

if (!readIndex) {
  problems.push(
    `docs/scenarios/_index.md was NOT read — the oracle index is required after any portal interaction`
  );
}

if (readBddFile && !/Oracle:/i.test(lastText)) {
  problems.push(
    `a BDD scenario file was read but the output does not contain "Oracle:" — ` +
    `validate the oracle checkpoints and include "Oracle: CT-XX — PASS/FAIL" in the response`
  );
}

if (problems.length === 0) {
  allow(
    `playwright used; index read=${readIndex}; bdd file read=${readBddFile}; oracle declared=${/Oracle:/i.test(lastText)}`
  );
}

log(
  `BLOCK — playwright=true; indexRead=${readIndex}; bddRead=${readBddFile}; oracleDeclared=${/Oracle:/i.test(lastText)}`
);

console.log(
  JSON.stringify({
    decision: "block",
    reason:
      `[hook verify-bdd-oracle] BDD oracle protocol not fulfilled (rule #19): ${problems.join("; ")}. ` +
      `Required steps: ` +
      `(1) Read docs/scenarios/_index.md to check if the operation is listed. ` +
      `(2) If listed: read the BDD file, run the staleness check (git log command in each Oracle section), ` +
      `validate every checkpoint, and include "Oracle: CT-XX — PASS/FAIL" in the response. ` +
      `(3) If NOT listed: append "[UNVALIDATED — no BDD oracle registered for this operation]" to the response. ` +
      `Do this before stopping.`,
  })
);
process.exit(0);
