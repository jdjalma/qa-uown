<!-- PT-BR: Decisão de implementar custom JSON reporter para integração com CI. -->

# ADR-010: Custom JSON Reporter for CI

## Status
Accepted

## Date
2025-02-15

## Context
Playwright includes HTML and list reporters, but CI pipelines need structured data for dashboards, alerts, and trend analysis (flakiness, duration, success rate). The HTML reporter is visual, not programmatic.

Options considered:
- **Playwright HTML reporter only**: visual, but not parseable by CI
- **JUnit XML**: CI standard, but limited in custom metadata
- **Custom JSON reporter**: flexible, includes project-specific fields

## Decision
Implement custom reporter in `src/support/custom-reporter.ts` that generates `reports/test-summary.json`:

```json
{
  "timestamp": "2025-02-15T10:30:00Z",
  "environment": "sandbox",
  "total": 45,
  "passed": 42,
  "failed": 2,
  "skipped": 1,
  "flaky": 0,
  "duration": 180000,
  "errors": [{ "test": "...", "message": "...", "snippet": "..." }]
}
```

Used in parallel with HTML reporter (visual) and list reporter (terminal).

## Consequences

**Positive:**
- CI can parse results and generate alerts
- Custom fields (environment, flaky count, error snippets)
- Complements HTML reporter without replacing it
- Allure optional for rich dashboards

**Negative:**
- Custom reporter maintenance

**Mitigations:**
- Reporter is simple (~100 lines)
- Stable format (doesn't change frequently)

## References
- `src/support/custom-reporter.ts`
- `reports/test-summary.json`
