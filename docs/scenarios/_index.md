# BDD Scenarios Index

> **Oracle index** — maps named operations to their BDD files.
> Used by rule #19 in CLAUDE.md: after performing any listed operation, read the
> corresponding file's `### Oracle` sections and validate every checkpoint.

| Operation | Trigger keywords | BDD file | Last reviewed |
|---|---|---|---|
| login | login, authenticate, log in, sign in, fazer login, enter credentials, access portal, open origination, open servicing, open ams, navigate to dashboard, open website portal | [login.md](login.md) | 2026-06-26 |
| new-application | new application, create application, nova aplicação, criar aplicação, new app form, origination form, send application, submit application, customer application form, invite link, application link, fill application, preencher aplicação, customer submits application | [new-application.md](new-application.md) | 2026-06-26 |
| prorated-amount | prorated amount, calculator, prorated, prorate, getProrateAmount, AS OF, payoff amount calculator, calculadora proporcional | [prorated-amount.md](prorated-amount.md) | 2026-06-26 |
| commit | git commit, commit files, stage and commit, criar commit, fazer commit, commit message, git add + commit | [commit.md](commit.md) | 2026-06-27 |
| push | git push, push to remote, push branch, enviar para o remote, push origin, fazer push | [push.md](push.md) | 2026-06-27 |

---

## Protocol: operation not listed here

If the requested operation has no entry in this table:
- **Ad-hoc request (user or orchestrator):** proceed with the action, then append `[UNVALIDATED — no BDD oracle registered for this operation. Consider adding one.]` to the response.
- **QA pipeline context (qa-planner / qa-implementer writing or modifying a test):** STOP. Create the BDD file via the `test-scenarios` skill before implementing. No test code is written without an oracle.

## Protocol: staleness check (run before every oracle)

Before executing any oracle, run:

```bash
git log --after="<last-reviewed from BDD frontmatter>" -- <each file in covers>
```

- **No output** → BDD is current. Proceed.
- **Output (commits exist)** → prepend `[BDD MAY BE STALE — <file> changed after last review on <date>]` to the oracle report. Still run the oracle, but flag all PASS results as unconfirmed until the BDD is re-reviewed.

## Protocol: oracle checkpoint fails

When any checkpoint in the oracle table returns FAIL:

1. **Inspect the real DOM** (via MCP Playwright snapshot) to confirm the behavior is what the portal actually shows.
2. **Check git log** for the `covers` files — was this file changed intentionally after `last-reviewed`?
   - Yes, intentional change → BDD is stale. Update the BDD and `last-reviewed` before reporting.
   - No change or unintentional → report as `[BUG]` following the bug-classification rules.
3. Never report a FAIL as a confirmed bug without ruling out BDD staleness first.

## Adding a new BDD file

1. Create `docs/scenarios/<operation>.md` with frontmatter `last-reviewed` + `covers`.
2. Add a row to this table.
3. The operation is now covered by rule #19 for all agents.
