# UOwn Leasing — SVC (Servicing) Platform · Business Rules

**Platform:** Lease-to-Own System
**Stack:** Java 17, Spring Boot, PostgreSQL, Hazelcast

> **This file is an INDEX, not a source of content.** The canonical rules live in the thematic chapters and appendices below. Until 2026-06-18 this file was a monolithic master of ~4,800 lines that **duplicated** its subordinates and drifted (it was frozen at 2026-02-20 while the chapters moved ahead). It has been converted into an index: every fact now has **one** source.

>
> **Freshness and volatility** of each doc: see the generated manifest [`_index.md`](_index.md) (`last_verified` / `volatility` fields, produced by `scripts/docs-tooling.mjs index`).
> **Conventions** (frontmatter, provenance, KB→business-rules promotion): [`../_docs-conventions.md`](../_docs-conventions.md).

---

## Thematic chapters

| # | File | Covers |
|---|---------|-------|
| 01 | [01-fundamentos.md](01-fundamentos.md) | Business overview · financial concepts (money factor, security deposit, processing/buyout fee) · merchant programs · configuration management |
| 02 | [02-originacao-pipeline.md](02-originacao-pipeline.md) | Application pipeline (17 steps) · fraud verification · underwriting · approved amounts by segment · pre-signing validation |
| 03 | [03-contratos-esign.md](03-contratos-esign.md) | E-sign flow · GowSign/Signwell routing · signing fee · redirect · post-signing screens |
| 04 | [04-calculos-financeiros.md](04-calculos-financeiros.md) | Payment calculator · EPO (Early Pay Off) · payoff calculation · EPO rules by state |
| 05 | [05-pagamentos.md](05-pagamentos.md) | CC · CC Peek · check · ACH · allocation · PayWallet · idempotency · refund · payment arrangement · NSF by state · overpayment prevention |
| 06 | [06-conta-ciclo-vida.md](06-conta-ciclo-vida.md) | Receivables · auto-pay · rating letters · delinquency · account/lead status · cancellation · auto paid-out |
| 07 | [07-modificacoes-conta.md](07-modificacoes-conta.md) | Rewind/replay · settlement · invoice modification · frequency · due date · approval change · additional lease · FPD · Kornerstone reset |
| 08 | [08-funding-merchants.md](08-funding-merchants.md) | Funding queue · LOS→SVC import · webhooks · merchant/lead management · integration API (detailed endpoints) · sandbox SSN rules |
| 09 | [09-integracoes-externas.md](09-integracoes-externas.md) | Buddy Insurance · TaxCloud/TaxJar · Five9 · RTR · Proget · Skit.ai · PayPair · Podium |
| 10 | [10-portal-comunicacoes.md](10-portal-comunicacoes.md) | TMS · customer portal · correspondence · consent · contact preferences · portal invitation |
| 11 | [11-administracao.md](11-administracao.md) | Blacklist · item split · second opportunity · sweeps (catalog) · cleanup · API authentication · admin panel |
| 12 | [12-produto-lease-deep-dive.md](12-produto-lease-deep-dive.md) | Formulas and rules extracted from source code (supplementary) |

## Appendices (reference)

| Appendix | File | Covers |
|----------|---------|-------|
| A | [appendix-a-integracoes.md](appendix-a-integracoes.md) | Third-party integrations — quick reference |
| B | [appendix-b-endpoints.md](appendix-b-endpoints.md) | Ops/admin endpoints — quick reference |
| C | [appendix-c-tabelas-banco.md](appendix-c-tabelas-banco.md) | Database tables for verification · performance indexes · Merchant Settings Snapshot |
| D | [appendix-d-constantes-enums.md](appendix-d-constantes-enums.md) | Constants and enumerations · disambiguation E0 (AppApprovalStatus vs transactionStatus) |
| E | [appendix-e-campanhas-uw.md](appendix-e-campanhas-uw.md) | Underwriting campaigns (Peak/Off-Peak) |
| F | [appendix-f-sql-reference.md](appendix-f-sql-reference.md) | Operational SQL queries by domain · snapshot queries |
| G | [appendix-g-cenarios-risco.md](appendix-g-cenarios-risco.md) | Lease risk scenarios — basis for test parameterization |

---

## How to consume (agents and skills)

Loading order (see [`../_docs-conventions.md`](../_docs-conventions.md) §5):
1. [`_index.md`](_index.md) — locate the canonical file by topic and check `last_verified`/`volatility` without reading everything.
2. The specific chapter/appendix above.
3. `docs/knowledge-base/` — point investigations (fresher, require cross-check).

Never answer from memory about a `volatile` category — cross-check against the primary `source` (Rule #16 + [[volatile-knowledge-registry]]).
