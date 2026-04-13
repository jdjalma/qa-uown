<!-- PT-BR: Decisão de centralizar todos os seletores CSS/XPath no objeto SELECTORS. -->

# ADR-004: Centralized Selectors in SELECTORS Const

## Status
Accepted

## Date
2025-01-20

## Context
CSS/XPath selectors scattered across tests and page objects create maintenance problems: when the UI changes, selectors must be found and updated in dozens of files. Duplicated and inconsistent selectors are a source of flakiness.

Options considered:
- **Inline in page objects**: simple, but duplication between pages and hard to audit
- **Constants per page object**: less duplication, but still fragmented
- **Global centralized object**: a single source of truth for all selectors

## Decision
All selectors live in `src/selectors/common.selectors.ts` in the `SELECTORS` object, organized by portal/context:

```typescript
export const SELECTORS = {
  common: { spinner: '...', toast: '...', modal: '...' },
  origination: { customerName: '...', statusBadge: '...' },
  servicing: { paymentTable: '...', achHistory: '...' },
  website: { otpInput: '...', paymentForm: '...' },
  ams: { userTable: '...' },
};
```

Absolute rule: **never** hardcode selectors in tests or page objects.

## Consequences

**Positive:**
- UI change = update a single file
- Selector auditing possible (`subagent-audit (selectors mode)`)
- Consistency: all tests use the same selectors
- Dead selectors easily identifiable

**Negative:**
- File may grow large with many portals/pages
- Indirection: reading a selector requires going to the selectors file

**Mitigations:**
- Organization by portal within the object
- `subagent-audit (selectors mode)` agent for periodic maintenance
- IDE autocomplete resolves the indirection

## References
- `src/selectors/common.selectors.ts`
- ADR-003 (Page Object Model)
