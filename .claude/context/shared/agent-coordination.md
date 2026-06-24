# Agent Coordination — Lock Protocol

> Referenced by CLAUDE.md §Parallel execution limits. Read this before editing any shared file when another agent may be running in parallel.

## Shared files (require lock check before edit)

- `src/pages/**` — page objects
- `src/helpers/**` — helpers
- `src/selectors/common.selectors.ts` — shared selectors
- `src/api/clients/**` — API clients

## Lock protocol

### Before editing a shared file

1. Check for an active lock: `ls .claude/locks/<filename>.lock 2>/dev/null`
2. If lock exists → **wait or abort** — do NOT edit. Report to orchestrator that there is a conflict.
3. If no lock → create lock: `echo $$ > .claude/locks/<filename>.lock`
4. Edit the file.
5. Release lock: `rm -f .claude/locks/<filename>.lock`

### Lock file naming

Use the basename of the file: `common.selectors.ts.lock`, `fundingPage.ts.lock`, etc.

Lock files live in `.claude/locks/` (gitignored).

### Stale locks

A lock older than 10 minutes is stale (agent died without cleanup). Safe to remove:

```bash
find .claude/locks/ -name "*.lock" -mmin +10 -delete
```

## Serialization rule

If two parallel `qa-implementer` agents need the same shared file, the orchestrator MUST serialize them:
- Agent A creates + completes the shared file.
- Agent B is launched after A finishes (or only reads the already-created file).

## Parallel execution limits (from CLAUDE.md)

- Max 3 agents simultaneously.
- Parallel agents MUST NOT edit the same file.
- Lock protocol is the enforcement mechanism for accidental collisions.
