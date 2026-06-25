<!-- GERADO por scripts/docs-tooling.mjs — NÃO editar à mão. Rode: node scripts/docs-tooling.mjs index -->
# Índice — docs/business-rules

> Manifesto gerado a partir do frontmatter (ver `docs/_docs-conventions.md`). 21 arquivos.
> Consumidores: leia este índice primeiro para localizar o arquivo canônico por tópico antes de abrir os docs.

| Arquivo | Título | Status | Volatilidade | Verificado | Cobre |
|---------|--------|--------|--------------|------------|-------|
| [01-fundamentos.md](01-fundamentos.md) | Fundamentals and Overview | stable | volatile | 2026-06-18 | business-model, merchant-types, programs, merchant-config, kornerstone, epo |
| [02-originacao-pipeline.md](02-originacao-pipeline.md) | Origination and Application Pipeline | stable | volatile | 2026-06-23 | pipeline, underwriting, fraud-vendors, neuroid, kount, state-check, geolocation, customer-journey, segment-limits |
| [03-contratos-esign.md](03-contratos-esign.md) | Contracts and Electronic Signature | stable | volatile | 2026-06-18 | esign, signwell, gowsign, pandadoc, contracts, signing-fee, state-routing |
| [04-calculos-financeiros.md](04-calculos-financeiros.md) | Financial Calculations and Formulas | stable | stable | 2026-06-23 | payment-calculator, epo, payoff, money-factor, payment-frequency, state-rules |
| [05-pagamentos.md](05-pagamentos.md) | Payment Processing | stable | volatile | 2026-06-23 | credit-card, ach, cc-peek, refunds, payment-arrangements, nsf, sweeps, rightfoot, sticky |
| [06-conta-ciclo-vida.md](06-conta-ciclo-vida.md) | Account Lifecycle Management | stable | volatile | 2026-06-18 | receivables, auto-pay, rating-letters, delinquency, account-status, cancellation, paid-out, sweeps |
| [07-modificacoes-conta.md](07-modificacoes-conta.md) | Account Modifications and Adjustments | stable | volatile | 2026-06-18 | rewind-replay, settlement, invoice-modification, frequency-change, due-date, fpd-adjustment, additional-lease, sweeps, modification-report-agent-attribution |
| [08-funding-merchants.md](08-funding-merchants.md) | Funding and Merchant Management | stable | volatile | 2026-06-18 | funding, merchants, webhooks, ssn, los-svc-import, integration-api |
| [09-integracoes-externas.md](09-integracoes-externas.md) | Third-Party Integrations | stable | volatile | 2026-06-23 | buddy-insurance, taxcloud, taxjar, five9, kornerstone, proget, skit-ai, vendor-health, rightfoot |
| [10-portal-comunicacoes.md](10-portal-comunicacoes.md) | Portal, Communications and Support | stable | stable | 2026-06-18 | tms, portal-cliente, correspondencia, email, sms, consentimento, contato |
| [11-administracao.md](11-administracao.md) | Administration and Operations | stable | volatile | 2026-06-18 | blacklist, item-split, second-opportunity, sweeps, data-cleanup, api-auth, admin-panel |
| [12-produto-lease-deep-dive.md](12-produto-lease-deep-dive.md) | Lease Product — Technical Deep Dive | stable | stable | 2026-03-20 | formulas-financeiras, calculator, contrato, parcelas, money-factor, tax, epo |
| [appendix-a-integracoes.md](appendix-a-integracoes.md) | Appendix A: Third-Party Integrations | stable | stable | 2026-06-23 | integracoes, vendors, sentilink, neustar, lexisnexis, seon, plaid, taxcloud, sweeps, rightfoot, gowsign-routing |
| [appendix-b-endpoints.md](appendix-b-endpoints.md) | Appendix B: Endpoints Quick Reference | stable | volatile | 2026-06-23 | endpoints, sweeps, pagamentos, contas, administracao, config, rightfoot, customer-journey |
| [appendix-c-tabelas-banco.md](appendix-c-tabelas-banco.md) | Appendix C: Important Database Tables | stable | volatile | 2026-06-23 | tabelas, schema, postgres, indexes, troubleshooting, merchant-snapshot, rightfoot, customer-journey |
| [appendix-d-constantes-enums.md](appendix-d-constantes-enums.md) | Appendix D: Business Constants and Enumerations | stable | volatile | 2026-06-23 | enums, constantes, status, funding-queue, lead-status, approval-status, magwitch, rightfoot, customer-journey |
| [appendix-e-campanhas-uw.md](appendix-e-campanhas-uw.md) | Appendix E: Underwriting Campaigns Reference | stable | stable | 2026-06-23 | campanhas, underwriting, client-type, peak, off-peak, campaign-id, segment-limits |
| [appendix-f-sql-reference.md](appendix-f-sql-reference.md) | Appendix F: Operational SQL Queries Reference | stable | volatile | 2026-06-18 | sql, queries, troubleshooting, los, svc, sweeps, fraude, ams |
| [appendix-g-cenarios-risco.md](appendix-g-cenarios-risco.md) | Appendix G: Lease Risk Scenarios | stable | volatile | 2026-06-18 | risco, lease, rto, estados, merchant-routing, online, instore, blocked-states, ssn |
| [appendix-h-epo-template-registry.md](appendix-h-epo-template-registry.md) | Appendix H: 16-Month EPO Template Registry | stable | volatile | 2026-06-23 | epo, template-rendering, gowsign-routing, 16m-lease, state-rules |
| [appendix-i-merchant-leasing-api.md](appendix-i-merchant-leasing-api.md) | Appendix I: Merchant Integration API (UOWN Leasing Full API) | stable | volatile | 2026-06-23 | integration-api, settlement, additional-lease, fraud-vendors, enums, webhooks |
