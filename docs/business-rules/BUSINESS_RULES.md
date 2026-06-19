# UOwn Leasing — SVC (Servicing) Platform · Regras de Negócio

**Plataforma:** Sistema de Lease-to-Own (Aluguel com Opção de Compra)
**Stack:** Java 17, Spring Boot, PostgreSQL, Hazelcast

> **Este arquivo é um ÍNDICE, não fonte de conteúdo.** As regras canônicas vivem nos capítulos temáticos e appendices abaixo. Até 2026-06-18 este arquivo era um master monolítico de ~4.800 linhas que **duplicava** os subordinados e drift­ava (estava parado em 2026-02-20 enquanto os capítulos avançavam). Foi convertido em índice: cada fato agora tem **uma** fonte.
>
> **Frescor e volatilidade** de cada doc: ver o manifesto gerado [`_index.md`](_index.md) (campos `last_verified` / `volatility`, produzidos por `scripts/docs-tooling.mjs index`).
> **Convenções** (frontmatter, proveniência, promoção KB→business-rules): [`../_docs-conventions.md`](../_docs-conventions.md).

---

## Capítulos temáticos

| # | Arquivo | Cobre |
|---|---------|-------|
| 01 | [01-fundamentos.md](01-fundamentos.md) | Visão geral do negócio · conceitos financeiros (money factor, security deposit, processing/buyout fee) · programas de merchant · configuration management |
| 02 | [02-originacao-pipeline.md](02-originacao-pipeline.md) | Pipeline de aplicação (17 steps) · verificação de fraude · underwriting · valores aprovados por segmento · validação pré-assinatura |
| 03 | [03-contratos-esign.md](03-contratos-esign.md) | Fluxo e-sign · routing GowSign/Signwell · taxa de assinatura · redirect · telas pós-assinatura |
| 04 | [04-calculos-financeiros.md](04-calculos-financeiros.md) | Calculadora de pagamentos · EPO (Early Pay Off) · cálculo de payoff · regras EPO por estado |
| 05 | [05-pagamentos.md](05-pagamentos.md) | CC · CC Peek · cheque · ACH · alocação · PayWallet · idempotência · reembolso · payment arrangement · NSF por estado · overpayment prevention |
| 06 | [06-conta-ciclo-vida.md](06-conta-ciclo-vida.md) | Recebíveis · auto-pay · rating letters · inadimplência · status de conta/lead · cancelamento · auto paid-out |
| 07 | [07-modificacoes-conta.md](07-modificacoes-conta.md) | Rewind/replay · settlement · modificação de invoice · frequência · due date · alteração de aprovação · lease adicional · FPD · reset Kornerstone |
| 08 | [08-funding-merchants.md](08-funding-merchants.md) | Fila de financiamento · importação LOS→SVC · webhooks · gestão de merchants/leads · API de integração (endpoints detalhados) · regras sandbox SSN |
| 09 | [09-integracoes-externas.md](09-integracoes-externas.md) | Buddy Insurance · TaxCloud/TaxJar · Five9 · RTR · Proget · Skit.ai · PayPair · Podium |
| 10 | [10-portal-comunicacoes.md](10-portal-comunicacoes.md) | TMS · portal do cliente · correspondência · consentimento · preferências de contato · convite ao portal |
| 11 | [11-administracao.md](11-administracao.md) | Blacklist · item split · second opportunity · sweeps (catálogo) · cleanup · autenticação de API · painel administrativo |
| 12 | [12-produto-lease-deep-dive.md](12-produto-lease-deep-dive.md) | Fórmulas e regras extraídas do código-fonte (suplementar) |

## Appendices (referência)

| Appendix | Arquivo | Cobre |
|----------|---------|-------|
| A | [appendix-a-integracoes.md](appendix-a-integracoes.md) | Integrações com terceiros — referência rápida |
| B | [appendix-b-endpoints.md](appendix-b-endpoints.md) | Endpoints ops/admin — referência rápida |
| C | [appendix-c-tabelas-banco.md](appendix-c-tabelas-banco.md) | Tabelas de banco para verificação · indexes de performance · Merchant Settings Snapshot |
| D | [appendix-d-constantes-enums.md](appendix-d-constantes-enums.md) | Constantes e enumerações · disambiguation E0 (AppApprovalStatus vs transactionStatus) |
| E | [appendix-e-campanhas-uw.md](appendix-e-campanhas-uw.md) | Campanhas de underwriting (Peak/Off-Peak) |
| F | [appendix-f-sql-reference.md](appendix-f-sql-reference.md) | Consultas SQL operacionais por domínio · queries de snapshot |
| G | [appendix-g-cenarios-risco.md](appendix-g-cenarios-risco.md) | Cenários de risco de lease — base para parametrização de testes |

---

## Como consumir (agentes e skills)

Ordem de carga (ver [`../_docs-conventions.md`](../_docs-conventions.md) §5):
1. [`_index.md`](_index.md) — localize o arquivo canônico por tópico e veja `last_verified`/`volatility` sem ler tudo.
2. O capítulo/appendix específico acima.
3. `docs/knowledge-base/` — investigações pontuais (mais frescas, exigem cross-check).

Nunca responda de memória sobre categoria `volatile` — cross-check contra a `source` primária (Regra #16 + [[volatile-knowledge-registry]]).
