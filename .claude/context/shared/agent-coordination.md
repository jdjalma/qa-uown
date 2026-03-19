# Agent Coordination — Lock File Protocol

> Protocol for multiple Claude Code terminals editing the same repository concurrently.

## Why Locks?

Multiple agents editing the same file simultaneously causes overwrites. This protocol uses PID-based locks (not TTL) because:
- PID is precise: if the process died, the lock is abandoned — regardless of elapsed time.
- TTL kills locks for long-running work (2h+).

## Lock File Structure

```
.claude/locks/
  .gitkeep          # Versioned
  *.lock            # NOT versioned (.gitignore)
```

### Lock file naming

Replace `/` with `_` in the file path:
```
src/pages/origination/customer.page.ts
→ .claude/locks/src_pages_origination_customer.page.ts.lock
```

### Lock file content

```json
{
  "pid": 12345,
  "since": "2026-03-16T10:30:00Z",
  "file": "src/pages/origination/customer.page.ts"
}
```

## Protocol (MUST follow before editing any shared file)

```bash
# 1. Check if lock exists
ls .claude/locks/<name>.lock

# 2. If exists, check if process is alive
kill -0 <PID>   # exit 0 = alive → wait | exit 1 = dead → delete lock

# 3. Create lock before editing
echo '{"pid": '$$', "since": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "file": "<file>"}' \
  > .claude/locks/<name>.lock

# 4. Delete lock when done
rm -f .claude/locks/<name>.lock
```

## When to Use Locks

| Scenario | Lock required? |
|----------|:-:|
| Editing a page object or helper | Yes |
| Editing a test spec | Yes |
| Reading a file (no edits) | No |
| Creating a NEW file (no conflicts) | No |
| Editing CLAUDE.md or agent files | Yes |

## Rules

1. **Always delete your lock** when finished (even if the edit failed).
2. **Never force-delete** another agent's lock if its PID is alive.
3. **Dead PID → safe to delete** the lock and proceed.
4. **One lock per file** — not per directory.
