---
name: qa2 e-sign routing reality (2026-04-28)
description: In qa2 today only CA has a GowSign template. Every other state falls back to merchant.esign_client (default SIGNWELL). NJ/VT/MN/ME blocked by stateCheck. Use to design state-parameterized signing tests.
type: project
---

In qa2 (confirmed by dev 2026-04-28, captured in `.claude/rules/testing.md § E-sign Provider Routing`):

- E-sign provider is decided by **template availability for the lead's state**, not a global merchant flag.
- Today only **CA** has a GowSign template → `uown_esign_document.esign_client = 'GOWSIGN'`.
- All other allowed states → fallback to `merchant.esign_client` (default `'SIGNWELL'`).
- Blocked states (4): **NJ, VT, MN, ME** → `sendApplication` denied by `stateCheck`, no `uown_esign_document` row.
- Empirical evidence (TireAgent OW90218-0001 qa2): leads 15741–15745, 15748+ CA = GOWSIGN; leads 15746–15747 CO = SIGNWELL; merchant.esign_client = SIGNWELL throughout.

**Why:** designing a "GoSign-only" test suite is wrong; a state-parameterized signing suite asserts the correct provider per state. When product distributes more GowSign templates the matrix changes — tests stay.

**How to apply:** any signing-regression spec spanning multiple states must (a) pull provider from a state→provider matrix that lives in test data, not from a hardcoded "use GowSign" flag; (b) skip the 4 blocked states from signing rows and instead assert denial; (c) treat AK as a special row because lessor differs ("KW-Choice Alaska LLC" vs default "Mollie, LLC, dba Uown" per US-DOC-03).
