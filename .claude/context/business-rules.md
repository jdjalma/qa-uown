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
| E-sign | Auto-detects PandaDocs vs Signwell via iframe polling (3s × 12) |
| Allocation | `Payment/EPO` (default), `Payment`, `EPO Only` |
| Payment Arrangement | Entity `uown_sv_payment_arrangement` with types `NORMAL`/`SETTLEMENT` and statuses `NOT_STARTED`/`IN_PROGRESS`/`SUCCESS`/`FAILED`. SETTLEMENT type transitions account to `SETTLED_IN_FULL` on success. FK `payment_arrangement_pk` in CC/ACH transaction tables |
| Program routing | Banking data + BIN eligible → Kornerstone flow (16m first, fallback 13m); otherwise → UOWN flow (13m only) |
| planId format | Frequency abbreviation + term months: `WK13`, `BWK16`, `SM13`, `MN16` |
| missing-fields | Accepts both `selectedPaymentFrequency` (legacy) and `planId` (new) |

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

Always consult `docs/business-rules/` before creating tests for business flows.

## Reference Sources

| Source | Path | Cross-references |
|--------|------|-----------------|
| **Postman collection** | `docs/UOWN Leasing API Documentation (FULL API).postman_collection.json` | Endpoint contracts, request/response shapes |
| **DB schema (QA2)** | `docs/database-schema-qa2.md` | Table structure, columns, FK relationships |
| **Application source** | `.claude/context/app-repos.md` | Controllers, migrations, entities, frontend components |
| **Appendix C** | `docs/business-rules/appendix-c-tabelas-banco.md` | DB table documentation |
| **Appendix F** | `docs/business-rules/appendix-f-sql-reference.md` | SQL query patterns |
