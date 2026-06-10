# Relatório de Teste Exploratório -- QA1

> **Disclaimer (regra #16 + #17):** Este arquivo e registro de execucao, NAO fonte de padrao. Gerado em 2026-06-10 como status parcial das sessoes S0-S9 (bateria em andamento; S10+ pendentes). NAO e evidencia de pipeline fechado -- e documento de progresso para visibilidade de stakeholder.

---

## TL;DR

Bateria exploratoria multi-sessao em **qa1** iniciada em 2026-06-10, replicando a metodologia da bateria dev3. Dez sessoes concluidas (S0-S9): conectividade, UI dos 3 portais, sweeps, Payment Arrangement, Move Due Date, Frequency Change, Settlement, Banking, Contact Opt-Out, signing inventory, sticky, criacao de aplicacao (API + UI), e investigacao de configuracao por client type.

**4 bugs confirmados**, 6+ observacoes/hipoteses. O bloqueador critico e o **portal Origination 100% inutilizavel** (BUG-001, regressao de deploy). Os demais portais (Servicing, Customer Portal) funcionam com achados de PII e UX. A API partner `sendApplication` funciona normalmente.

**Agenda pendente de alto valor:** Signing E2E fresh (leads prontos), criacao de Payment Arrangement fresh, operacoes bancarias, sweeps de delinquencia.

---

## Indice

1. [Resumo das sessoes](#1-resumo-das-sessoes)
2. [Bugs confirmados](#2-bugs-confirmados)
3. [Observacoes e hipoteses](#3-observacoes-e-hipoteses)
4. [Achados positivos (diferenciais qa1 vs dev3)](#4-achados-positivos-diferenciais-qa1-vs-dev3)
5. [Agenda pendente](#5-agenda-pendente)

---

## 1. Resumo das sessoes

| Sessao | Escopo | Status | Principal achado |
|---|---|---|---|
| S0 | Preflight: DB, API, Quartz, gap-probe vs dev3 | CONCLUIDA | qa1 tem CC processor real (366 tx APPROVED/30d); SB 2.x confirmado |
| S1 | UI ampla: 3 portais | CONCLUIDA | BUG-001 (Origination); BUG-002 (Due Amounts stale); OTP E2E PASS |
| S2 | Sweeps: 14 ativos inventariados | CONCLUIDA | SW-BUG-001 dev3 NAO reproduz em qa1; token TrustPilot exposto em log |
| S3 | Payment Arrangement lifecycle | CONCLUIDA | Sem Edit/Cancel (replica O-NEW-001); audit chain completa; arrangement organico SUCCESS |
| S4 | Move Due Date | CONCLUIDA | MDD-001 exclusivo SB3 confirmado; qa1 aceita trailing slash (200); cap=6d WEEKLY |
| S5 | Frequency Change + Make Payment | CONCLUIDA | BUG-003 (Frequency history vazio); Make Payment modal mapeado |
| S6 | Settlement / Banking / Contact Opt-Out | CONCLUIDA | BANK-OBS-QA1-001 (routing+account sem mascara); SETTLE-OBS-QA1-001 (label invertido) |
| S7 | Signing inventory, /documents, /responses, PP, sticky | CONCLUIDA | BUG-004 (Customer Portal /documents derruba sessao); 981 UW_APPROVED disponiveis |
| S8 | sendApplication (API) + wizard new-application (UI) | CONCLUIDA | Leads 12272 (13m) e 12274 (16m) APPROVED; recipe 916-16m confirmado; BUG-001 causa raiz localizada |
| S9 | Config DANIELS_JEWELERS -- required fields | CONCLUIDA | createOrUpdateConfig NAO afeta validator (2 sistemas desacoplados); config requer cherry-pick no YAML |

---

## 2. Bugs confirmados

<details>
<summary><strong>BUG-001 [CONFIRMADO S1] -- Portal Origination inutilizavel (Severity S1 -- Bloqueador)</strong></summary>

**Sintoma:** todas as chamadas autenticadas `/uown/*` do portal Origination retornam HTTP 400 com corpo vazio (`content-length: 0`, `x-powered-by: Express`). UI exibe "Unexpected Server Error" em todas as paginas pos-login.

**Causa raiz (refinada em S8):** o BFF/proxy do portal Origination em qa1 roteia `/uown/*` para upstream LOS incorreto ou mal-configurado. Prova por A/B: os mesmos endpoints com os mesmos headers `username`/`usertoken` retornam 200 via `svc-qa1.uownleasing.com` e 400 vazio via `origination-qa1.uownleasing.com`. Descartados: backend LOS (vivo), token (valido, tamanho equivalente ao qa2 que funciona), frontend release (qa2 com mesmo release funciona), header-size.

**Impacto:** portal interno do agente 100% inutilizavel -- overview, leads, merchants, programs, groups, rebate, blacklist, open-to-buy, new application. Link de cross-portal do Servicing para o lead no Origination tambem afetado.

**Reproducao minima:** login no portal Origination qa1 -> qualquer pagina pos-login. Ou: `POST https://origination-qa1.uownleasing.com/uown/getApplicationCountDetails` com headers `username`/`usertoken` de sessao ativa.

**Acao:** escalar a dev/infra com evidencia "200 via svc-qa1 / 400 vazio via origination-qa1, mesmos headers de auth". Comparar env var de target host LOS no deploy qa1 vs qa2.

**Nota:** funcional em 2026-05-24 (task #1304) -- regressao de deploy recente.

</details>

<details>
<summary><strong>BUG-002 [HIPOTESE forte S1] -- Servicing: Due Amounts renderiza dados da conta anterior (stale store)</strong></summary>

**Sintoma:** navegacao sequencial entre contas no Servicing faz a tabela "Due Amounts" (`/scheduled-payments/{pk}`) renderizar os dados da conta visitada anteriormente:
1. Load `/scheduled-payments/4452` -- API retorna 56 receivables -- UI exibe "There are no records".
2. Load `/scheduled-payments/3992` -- API retorna 29 receivables de 3992 -- UI renderiza os dados da 4452.
3. Reload frio de 3992 -- renderiza correto.

**Mecanismo provavel:** store MobX populado apos mount sem re-render. 13 erros `[mobx] uncaught error in 'Reaction': [serializr] this value is not primitive` no console durante navegacao (Reaction quebrada para de propagar updates).

**Risco:** agente le schedule financeiro de outra conta -- dado incorreto em tela.

**Classificacao:** `[HIPOTESE]` por ser timing-dependent. Reproducao deterministica pendente.

</details>

<details>
<summary><strong>BUG-003 [CONFIRMADO S5] -- Frequency Changes history renderiza vazio (Severity S2)</strong></summary>

**Sintoma:** a tela de historico "Frequency Changes" no Servicing renderiza vazia mesmo quando a API retorna 200 com dados. Apos executar uma mudanca de frequencia (confirmada por API 200 + registros em `uown_frequency_mods` + log `FREQUENCY_CHANGE`), o historico na UI continua exibindo "no records".

**Causa raiz:** shape aninhado da resposta (`frequencyModInfo`) nao e corretamente desserializado pelo frontend. Bug de frontend, nao endpoint vazio.

**Diferencial vs dev3:** eleva e refina SW-OBS-009 de dev3 -- la a causa era menos clara; qa1 tem dados reais que provam o mismatch entre API response e render.

</details>

<details>
<summary><strong>BUG-004 [CONFIRMADO S7] -- Customer Portal /documents derruba a sessao do cliente (Severity S2)</strong></summary>

**Sintoma:** cliente autenticado via OTP navega para `/documents` -- o app redireciona de volta ao login ("Sign in to your account"), perdendo a sessao.

**Causa raiz (rede):** `GET /uown/svc/getFilesForAccount?accountPk=...` retorna **403** e o app trata o 403 como sessao invalida, forcando logout. Confirmado em qa1 S1 + S7 e em dev3 BUG-S10-001. Tres ambientes afetados -- bug de codigo do endpoint, nao provisioning de dado.

**Impacto:** cliente autenticado nao consegue ver seus documentos e ainda perde a sessao.

</details>

---

## 3. Observacoes e hipoteses

<details>
<summary>SW-OBS-QA1-001 -- Token TrustPilot em plaintext no log de sweep (seguranca)</summary>

O sweep `refreshTrustPilotAccessKeySweep` grava o Bearer token de acesso em plaintext no campo `error` de `uown_sweep_logs` (ex.: `Bearer tpa-b42d4f24259dca3bb9989a2e7eda`, ~15 dias de historico). O campo `error` deveria conter mensagem de erro, nao credencial. Token rotaciona diariamente (mitiga janela de exposicao), mas e uso indevido do campo. Sugerido: mascarar/remover do log.

</details>

<details>
<summary>BANK-OBS-QA1-001 [CONFIRMADO] -- Routing number e account number expostos sem mascara (PII, Severity S2)</summary>

No card "Bank Account" da Customer Information no Servicing, tanto o **routing number** quanto o **account number** sao exibidos 100% em plaintext. Conta 3992: routing `123456780`, account `160781900000`. Inconsistencia de masking: o modal Make Payment mascara o bank account, mas o card de Customer Information expoe ambos os campos completos. Routing + account juntos permitem debito ACH.

</details>

<details>
<summary>SETTLE-OBS-QA1-001 [HIPOTESE] -- Label "Offer Percent" semanticamente invertido no modal Settlement (UX)</summary>

O modal "Settlement Breakdown" exibe "Offer Percent" como o complemento do `offer_percent` do DB (`ROUND((1-offer_percent)*100)%`). Uma conta com `offer_percent=0.70` (desconto de 30%, cliente paga 70%) exibe "Offer Percent = 30%". Agente pode interpretar como "cliente paga 30%". A matematica do valor final esta correta; o problema e semantico no rotulo. Fonte primaria: SQL config `GETSETTLEMENTAMOUNT`. Confirmar com produto se "Offer Percent" deve representar oferta (o que cliente paga) ou desconto.

</details>

<details>
<summary>PP-OBS-QA1-001 [HIPOTESE] -- Protection Plan COMPLETED, mas log repete "No protection plan" (inconsistencia)</summary>

Conta 3992 tem 1 row em `uown_sv_protection_plan` (status COMPLETED, `enrollment_date=null`), mas `uown_sv_activity_log` repete "No protection plan on this account: Offering protection plan" (5+ ocorrencias). Possivel dessincronizacao entre a tabela SV de PP e a engine de oferta. Exige reproducao em fresh account para distinguir bug de sync vs semantica esperada de COMPLETED.

</details>

<details>
<summary>SEND-CFG-QA1-001 [CONFIRMADO] -- createOrUpdateConfig nao aplica chaves do system.config YAML (arquitetura de config)</summary>

Investigacao em S9: o endpoint `POST /ConfigurationManagement/createOrUpdateConfig` grava na tabela DB `uown_configuration_management`, mas o validator `LosRequestMessageConstraintValidator` le via `ConfigurationUtility` -> `configurationMap` que e re-hidratado exclusivamente do `SystemConfigurationProperties` (YAML `system.config.*`). Sao dois sistemas desacoplados. Para aplicar required-fields por client type, o unico caminho efetivo e o `application.yaml` do repo `configuration` + restart de pod. Nao e bug; e arquitetura de config. Documento para evitar a mesma armadilha em futuras sessoes.

</details>

<details>
<summary>FREQ-OBS-QA1-001 [OBSERVACAO] -- uown_los_sched_summary nao sincroniza com mudancas de frequencia feitas pelo Servicing</summary>

Apos mudanca de frequencia via Servicing (grava em `uown_sv_sched_summary` + `uown_frequency_mods`), a tabela LOS-side `uown_los_sched_summary` permanece inalterada. As duas tabelas representam o schedule de lados diferentes (LOS vs Servicing); mudancas de frequencia no Servicing nao propagam para o LOS. Pode ser by-design (LOS e imutavel pos-funding) -- confirmar com produto.

</details>

---

## 4. Achados positivos (diferenciais qa1 vs dev3)

| Item | dev3 | qa1 | Valor |
|---|---|---|---|
| CC processor real | ausente (404) | ATIVO (366 tx APPROVED/30d) | Sweeps de pagamento validaveis com outcome real; arrangement SUCCESS organico |
| Leads UW_APPROVED | 0 (bloqueava signing) | **981 UW_APPROVED** | Signing E2E desbloqueado (maior gap da bateria dev3) |
| Move Due Date (MDD-001) | QUEBRADO (SB3 trailing slash 404) | **FUNCIONA** (SB 2.x, 200) | Confirma regressao exclusiva do upgrade SB3 |
| sendApplication | NPE SB3 sem bank/phone/email | **funcional** (SB 2.x) | API partner confiavel em qa1 |
| SW-BUG-001 (CreateScheduledCC alias) | falha, 0 processados | **nao reproduz** (processa normalmente) | Bug confinado ao deploy dev3 |
| Recipe 16m (SSN suffix 916) | nao confirmado | **CONFIRMADO fresh repro** (leads 12272/12274) | Recipe portavel documentado |
| Arrangement SUCCESS organico | precisava stand-in sintetico | **presente organicamente** (pk31/pk34, created_by=SYSTEM) | Log `Arrangement finalized as SUCCESS` pode virar HARD assertion |

---

## 5. Agenda pendente

### Alta prioridade

**S10 -- Signing E2E fresh (regra #14, UI-first):**
Leads 12272 (13m, TerraceFinance/NY) e 12274 (16m) estao UW_APPROVED sem `uown_esign_document` criado. O proximo passo natural e navegar o `redirectUrl` capturado em S8 via Customer Portal, exercer o fluxo de signing (SignWell ou GowSign conforme routing), e validar:
- render do PDF (placeholders preenchidos, nao `{{token}}` vazio -- cacar o BUG-01 Daniel's Jewelers que API-only mascarava)
- esign_document criado com status correto
- audit chain completa (regra #13): `[ContractService]` + status transitions
- Lead progredindo de UW_APPROVED para SIGNED

Esta sessao e a de maior valor da bateria -- qa1 desbloqueou o que dev3 nunca conseguiu exercer.

### Media prioridade

- **S11** -- Payment Arrangement criacao fresh: submit real, regras de negocio, IN_PROGRESS/FAILED
- **S12** -- Banking ADD/DELETE + compliance log (hipotese routing exposto no log)
- **S13** -- Contact opt-out toggle (hipotese H1 dev3: toggle sem activity log = compliance gap)
- **S14** -- Settlement empty-modal BUG-1 svc#512: testar com conta rating B/C
- **S15** -- Delinquency/email sweeps: criar conta test fintechgroup777+* delinquente
- **S16** -- Sticky Recover retry real (conta com cc DENIED + posting_date=hoje-7)

### Acao de infra pendente

**BUG-001 escalada a dev/infra:** evidencia pronta -- "200 via svc-qa1 / 400 vazio via origination-qa1, mesmos `username`/`usertoken`". Solicitar verificacao da env var de target host LOS no deploy BFF Origination qa1, comparando com deploy qa2 (que funciona com o mesmo release de frontend).

---

> Fonte primaria de todos os achados: DB qa1 via `src/scripts/env-query.mjs`, DOM real via Playwright headless chromium, respostas HTTP de rede (listener `page.on('response')` + curl), e codigo svc/common (leitura direta de `.java`). Nenhuma inferencia a partir de report anterior. Categoria volatil: contagens de leads/contas/sweeps mudam continuamente com o ambiente qa1 compartilhado.
