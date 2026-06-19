<!-- GERADO por scripts/docs-tooling.mjs — NÃO editar à mão. Rode: node scripts/docs-tooling.mjs index -->
# Índice — docs/business-rules

> Manifesto gerado a partir do frontmatter (ver `docs/_docs-conventions.md`). 19 arquivos.
> Consumidores: leia este índice primeiro para localizar o arquivo canônico por tópico antes de abrir os docs.

| Arquivo | Título | Status | Volatilidade | Verificado | Cobre |
|---------|--------|--------|--------------|------------|-------|
| [01-fundamentos.md](01-fundamentos.md) | Fundamentos e Visão Geral | stable | volatile | 2026-06-18 | business-model, merchant-types, programs, merchant-config, kornerstone, epo |
| [02-originacao-pipeline.md](02-originacao-pipeline.md) | Originação e Pipeline de Aplicação | stable | volatile | 2026-06-18 | pipeline, underwriting, fraud-vendors, neuroid, kount, state-check, geolocation |
| [03-contratos-esign.md](03-contratos-esign.md) | Contratos e Assinatura Eletrônica | stable | volatile | 2026-06-18 | esign, signwell, gowsign, pandadoc, contracts, signing-fee, state-routing |
| [04-calculos-financeiros.md](04-calculos-financeiros.md) | Cálculos e Fórmulas Financeiras | stable | stable | 2026-06-18 | payment-calculator, epo, payoff, money-factor, payment-frequency, state-rules |
| [05-pagamentos.md](05-pagamentos.md) | Processamento de Pagamentos | stable | volatile | 2026-06-18 | credit-card, ach, cc-peek, refunds, payment-arrangements, nsf, sweeps |
| [06-conta-ciclo-vida.md](06-conta-ciclo-vida.md) | Gestão do Ciclo de Vida da Conta | stable | volatile | 2026-06-18 | receivables, auto-pay, rating-letters, delinquency, account-status, cancellation, paid-out, sweeps |
| [07-modificacoes-conta.md](07-modificacoes-conta.md) | Modificações e Ajustes de Conta | stable | volatile | 2026-06-18 | rewind-replay, settlement, invoice-modification, frequency-change, due-date, fpd-adjustment, additional-lease, sweeps, modification-report-agent-attribution |
| [08-funding-merchants.md](08-funding-merchants.md) | Funding e Gestão de Merchants | stable | volatile | 2026-06-18 | funding, merchants, webhooks, ssn, los-svc-import, integration-api |
| [09-integracoes-externas.md](09-integracoes-externas.md) | Integracoes com Terceiros | stable | volatile | 2026-06-18 | buddy-insurance, taxcloud, taxjar, five9, kornerstone, proget, skit-ai, vendor-health |
| [10-portal-comunicacoes.md](10-portal-comunicacoes.md) | Portal, Comunicacoes e Atendimento | stable | stable | 2026-06-18 | tms, portal-cliente, correspondencia, email, sms, consentimento, contato |
| [11-administracao.md](11-administracao.md) | Administracao e Operacoes | stable | volatile | 2026-06-18 | blacklist, item-split, second-opportunity, sweeps, data-cleanup, api-auth, admin-panel |
| [12-produto-lease-deep-dive.md](12-produto-lease-deep-dive.md) | Produto Lease — Deep Dive Tecnico | stable | stable | 2026-03-20 | formulas-financeiras, calculator, contrato, parcelas, money-factor, tax, epo |
| [appendix-a-integracoes.md](appendix-a-integracoes.md) | Apendice A: Integracoes com Terceiros | stable | stable | 2026-06-18 | integracoes, vendors, sentilink, neustar, lexisnexis, seon, plaid, taxcloud, sweeps |
| [appendix-b-endpoints.md](appendix-b-endpoints.md) | Apendice B: Referencia Rapida de Endpoints | stable | volatile | 2026-06-18 | endpoints, sweeps, pagamentos, contas, administracao, config |
| [appendix-c-tabelas-banco.md](appendix-c-tabelas-banco.md) | Apendice C: Tabelas de Banco Importantes | stable | volatile | 2026-06-18 | tabelas, schema, postgres, indexes, troubleshooting, merchant-snapshot |
| [appendix-d-constantes-enums.md](appendix-d-constantes-enums.md) | Apendice D: Constantes de Negocio e Enumeracoes | stable | volatile | 2026-06-18 | enums, constantes, status, funding-queue, lead-status, approval-status |
| [appendix-e-campanhas-uw.md](appendix-e-campanhas-uw.md) | Apendice E: Referencia de Campanhas de Underwriting | stable | stable | 2026-06-18 | campanhas, underwriting, client-type, peak, off-peak, campaign-id |
| [appendix-f-sql-reference.md](appendix-f-sql-reference.md) | Apendice F: Referencia de Consultas SQL Operacionais | stable | volatile | 2026-06-18 | sql, queries, troubleshooting, los, svc, sweeps, fraude, ams |
| [appendix-g-cenarios-risco.md](appendix-g-cenarios-risco.md) | Apêndice G: Cenários de Risco de Lease | stable | volatile | 2026-06-18 | risco, lease, rto, estados, merchant-routing, online, instore, blocked-states, ssn |
