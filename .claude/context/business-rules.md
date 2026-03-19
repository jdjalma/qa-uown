<!-- PT-BR: Resumo das regras de negócio. Documentação completa em docs/business-rules/ (PT-BR, 11 capítulos + 6 apêndices). -->

# Business Rules — Summary

Full documentation in `docs/business-rules/` (PT-BR, 11 chapters + 6 appendices).

## State Machine — Lead Lifecycle

```
UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

## Critical Rules for Tests

| Rule | Detail |
|------|--------|
| SSN approval | Does not end in 9 → `UW_APPROVED`; ends in 9 → `UW_DENIED` |
| Contract URL | `paymentDetailsList[idx].redirectUrl` (idx=1 if >1 entry, else 0) |
| **submitApplication valid states** | `CC_AUTH_PASSED` and `CONTRACT_CREATED` are VALID states for `submitApplication` — they can proceed to generate a contract. Only `SIGNED`, `FUNDED`, `SETTLED_IN_FULL`, and `FUNDING` are truly invalid. Sending `submitApplication` on a `SIGNED` lead returns `"Invalid lead status Contract Signed"` error logged to `uown_submit_application_error_log` (Task #1240) |
| E-sign | Auto-detects PandaDocs vs Signwell via iframe polling (3s × 12) |
| Allocation | `Payment/EPO` (default), `Payment`, `EPO Only` |
| Payment Arrangement | Entity `uown_sv_payment_arrangement` with types `NORMAL`/`SETTLEMENT` and statuses `NOT_STARTED`/`IN_PROGRESS`/`SUCCESS`/`FAILED`. SETTLEMENT type transitions account to `SETTLED_IN_FULL` on success. FK `payment_arrangement_pk` in CC/ACH transaction tables |
| Program routing | Banking data + BIN eligible → Kornerstone flow (16m first, fallback 13m); otherwise → UOWN flow (13m only) |
| planId format | Frequency abbreviation + term months: `WK13`, `BWK16`, `SM13`, `MN16` |
| missing-fields | Accepts both `selectedPaymentFrequency` (legacy) and `planId` (new) |
| **Risk tier in testData** | Every application test MUST declare `riskTier` — drives SSN, state, merchant, amount. See `Appendix G` |
| **State → tax + EPO** | ONLINE merchant uses customer state; CA/NY/HI/WV use proportional EPO; NC last payment ≥ 11% baseCost; NJ/VT/MN/ME blocked |
| **Term Month display** | `uown_los_sched_summary.term_in_months` — populated during `submitApplication` with the `planId`-selected term. Shown in Origination Overview + Leads tables. Blank if no `submitApplication` (LEFT JOIN). `SubmitApplicationResponseBody.termInMonths` confirms the selected term |
| **16-month non-MONTHLY config gap** | Backend lacks `number.of.payments.16.WEEKLY/BI_WEEKLY/SEMI_MONTHLY` config — those paths throw `SvcException`. MONTHLY uses a fallback (`return numberOfMonths=16`) and works. For qa1 16-month tests: DB-patch `eligible_terms='16'` + `merchant_program_pk=207`, then `sendInvoice(MONTHLY)` → `planId=MN16`. See ch. 02 for full details (Task #1242) |
| **MissingPaymentProgram screen** | When `/{shortCode}/complete` is accessed without `planId` query param, a card-based program selection screen renders (Task #1233). With `planId`, skips directly to CC/bank form. Test pattern: `stripPlanId(redirectUrl)` to force the screen |

## Business Rules Chapters

| Ch | Topic |
|----|-------|
| 01 | Fundamentals |
| 02 | Origination Pipeline |
| 03 | Contracts and E-Sign |
| 04 | Financial Calculations |
| 05 | Payments |
| 06 | Account Lifecycle |
| 07 | Account Modifications |
| 08 | Funding and Merchants |
| 09 | External Integrations |
| 10 | Portal and Communications |
| 11 | Administration |
| A-F | Appendices (integrations, endpoints, tables, constants, campaigns, SQL) |
| G | Risk Scenarios — real-world US lease risk tiers mapped to UOWN system behaviors |

Always consult `docs/business-rules/` before creating tests for business flows.

## Reference Sources

| Source | Path | Cross-references |
|--------|------|-----------------|
| **Postman collection** | `docs/UOWN Leasing API Documentation (FULL API).postman_collection.json` | Endpoint contracts, request/response shapes |
| **DB schema (QA2)** | `docs/database-schema-qa2.md` | Table structure, columns, FK relationships |
| **Application source** | `.claude/context/app-repos.md` | Controllers, migrations, entities, frontend components |
| **Appendix C** | `docs/business-rules/appendix-c-tabelas-banco.md` | DB table documentation |
| **Appendix F** | `docs/business-rules/appendix-f-sql-reference.md` | SQL query patterns |
| **Appendix G** | `docs/business-rules/appendix-g-cenarios-risco.md` | Risk scenarios (low/medium/high) mapped to UOWN — use when parametrizing test data |
