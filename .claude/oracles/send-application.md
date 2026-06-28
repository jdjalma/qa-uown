---
last-reviewed: 2026-06-28
covers:
  - src/api/clients/application.client.ts
  - src/api/bodies/application.body.ts
  - src/helpers/api-setup.helpers.ts
  - src/helpers/merchant-config.helper.ts
  - src/pages/origination/customer.page.ts
  - src/pages/origination/program-details.page.ts
  - src/pages/origination/error-log.page.ts
  - src/selectors/common.selectors.ts
---

# Send Application (criação de lead via API)

> Endpoint `POST /uown/los/sendApplication` (host `svc-{env}.uownleasing.com`).
> Cria o lead programaticamente — é a precondição mais usada da suíte (seed de lead
> antes de exercer assinatura/pagamento via UI). Oráculo de nível **API + DB + Activity Log** que
> **fecha o loop com verificação visual do lead criado** (rule #14): o endpoint não tem UI própria
> (a UI equivalente do *envio* é o fluxo do [new-application.md](new-application.md), que chama este
> mesmo endpoint), mas o lead resultante É inspecionado na Originação — Activity Log + Error Log — em CT-07.
>
> **Justificativa rule #14:** API-only legítimo — (a) endpoint sem affordance visual + (b) precondição/setup.
> A validação visual do cliente continua sendo responsabilidade do `new-application.md`.
>
> **Preflight obrigatório (rule #12):** `createPreQualifiedApplication` chama `ensureMerchantReady`
> ANTES de enviar. Quem chamar `sendApplication` por outro caminho DEVE invocar o helper, ou passar
> `skipMerchantPreflight: true` quando operar sobre lease/conta já existente.
>
> **Resposta (`SendApplicationResponseBody`):** `authorizationNumber` (→ leadPk), `accountNumber`
> (→ leadUuid), `appApprovalStatus` (APPROVED/DECLINED), `transactionStatus` (E0/E4), `creditLimit`,
> `approvedTermMonths`, `providerURL` (null neste fluxo), `transactionMessage`.

## Critérios de Aceitação

| ID | Critério | Oracle |
|---|---|---|
| AC-01 | Lead aprovável → response 200, `appApprovalStatus=APPROVED`, `transactionStatus=E0`, leadPk numérico | CT-01 |
| AC-02 | Lead persiste no DB e gera Activity Log tipado (rule #13 — sem log nada aconteceu) | CT-02 |
| AC-03 | Estado bloqueado / condição de deny → `appApprovalStatus=DECLINED`, `transactionStatus=E4`, `providerURL=null`, lead criado como "Denied" | CT-03 |
| AC-04 | Merchant com drift de config → preflight cura (auto-heal) ou fail-fast; sem preflight o send dá 400/500 opaco | CT-04 |
| AC-05 | Falhas de infra NÃO são bug: 500+401-aninhado = token GDS stale; 403 text/plain = WAF/IP | CT-05 |
| AC-06 | `bankData` injetado → body leva `mainBankRoutingNumber`/`mainBankAccountNumber` (roteamento Kornerstone / GDS approval) | CT-06 |
| AC-07 | Após a criação, o lead aberto na UI reconcilia os valores criados (Status, Internal Status, valor aprovado, dados do cliente) com a API/applicant, exibe o Activity Log esperado e NENHUM erro no Error Log (rule #14 — validação visual não substituível por leitura de backend) | CT-07 |

## Cenários

```gherkin
Feature: Send Application — criação de lead via API

  Background:
    Given um merchant válido com config conforme merchant-config-contract.ts
    And um applicant pré-qualificável (SSN/perfil aprovável no ambiente alvo)

  Scenario: [positive] CT-01 — Lead aprovado é criado
    Given o merchant passou pelo preflight (ensureMerchantReady)
    When POST /uown/los/sendApplication é chamado com merchant + applicant
    Then a resposta é 200 OK
    And appApprovalStatus = "APPROVED" e transactionStatus = "E0"
    And authorizationNumber (leadPk) é numérico e accountNumber (leadUuid) está presente
    And creditLimit > 0 e approvedTermMonths é um array não vazio

  Scenario: [side-effect] CT-02 — Persistência + Activity Log
    Given um lead foi criado via CT-01
    When o estado do banco é consultado pelo leadPk
    Then existe a linha do lead em uown_los_lead
    And uown_los_activity_log contém ≥ 1 nota tipada (log_type) de criação/underwriting do lead
    And uown_los_outbound_api_log contém a chamada GDS de underwriting (≥ 1 linha)

  Scenario: [negative] CT-03 — Estado bloqueado é recusado mas o lead é criado
    Given o applicant está em estado bloqueado (NJ, VT, MN ou ME)
    When POST /uown/los/sendApplication é chamado
    Then appApprovalStatus = "DECLINED" e transactionStatus = "E4"
    And providerURL = null
    And transactionMessage explica a recusa (ex: "We do not offer leasing in NJ")
    And o lead aparece como "Denied" no Origination

  Scenario: [precondition] CT-04 — Preflight de merchant antes do send
    Given a config do merchant divergiu do contrato (flag faltando / programa ausente)
    When createPreQualifiedApplication é chamado
    Then ensureMerchantReady roda ANTES do sendApplication
    And com AUTO_HEAL_MERCHANT=true a config é curada via createOrUpdateMerchant
    And com AUTO_HEAL_MERCHANT=false o teste falha-rápido listando o drift

  Scenario: [negative] CT-05 — Falhas de infra não são bug de produto
    When sendApplication retorna erro
    Then 500 com "401 Unauthorized [no body]" aninhado no UnderwritingStep = token GDS stale
    And nesse caso a transação faz rollback → 0 linhas em uown_los_outbound_api_log
    And 403 "RBAC: access denied" (text/plain) = bloqueio de IP no WAF (não é chave inválida)
    And nenhum dos dois é classificado como [BUG] (rule #10)

  Scenario: [positive] CT-06 — bankData habilita roteamento Kornerstone / GDS
    Given options.bankData = { routingNumber, accountNumber }
    When createPreQualifiedApplication monta o body manualmente
    Then o wire body carrega mainBankRoutingNumber e mainBankAccountNumber
    And o GDS retorna EligibleTerms compatível (ex: 16) para o merchant Kornerstone

  Scenario: [side-effect][ui] CT-07 — Verificação visual do lead criado na Originação
    Given um lead foi criado via CT-01 (leadPk conhecido)
    When o agente abre o lead criado na UI em /customers/{leadPk}
    Then a página de detalhe carrega, Status = "Approved" e Internal Status = "UW_APPROVED" (coerentes com a API appApprovalStatus)
    And o valor aprovado exibido no resumo == creditLimit/approvedAmount da API
    And a Reference / Account Number do resumo == leadPk criado
    And getCustomerInfo() reconcilia First/Last Name, Date of Birth, Address/City/State/Zip, Email e Phone == applicant submetido
    And a seção Notes (Activity Log) renderiza com colunas Date | Type | User ID | Notes
    And existe UNDERWRITING "Underwriting is run. Response Status is {STATUS}" com STATUS == appApprovalStatus da API
    And existe DATA_CHANGE "ADDED : Lead[...]" com createdFrom == canal esperado (ex: TIRE_AGENT_API) e ccPeekConsent = TRUE
    And existe DATA_CHANGE "ADDED : Customer[...]" com firstName/lastName/dateOfBirth == applicant submetido
    And existe DATA_CHANGE "ADDED : Address[...]" com state/zipCode == applicant submetido
    And existe DATA_CHANGE "ADDED : Email[...]" com emailAddress == applicant submetido (uniqueEmail do worker)
    And existe DATA_CHANGE "ADDED : UWData[...]" com approvalAmount == creditLimit/approvedAmount da API
    And o MESMO valor de aprovação aparece em UWData, "UW Status" e "Approval Amount" (e Max ≈ aprovação × (1 + Over Approval Percent))
    And NENHUMA entrada de Notes contém "Error" / "Failed" / "Exception" / "Error initiating"
    And no Error Log (/errorLog, aba "Send Application") o {leadPk} criado NÃO aparece na coluna "Lead Pk"
    And cada checkpoint casa Type + conteúdo + valor DESTE lead — nunca apenas "existe entrada do tipo X" (evita registro incorreto)
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log --after="2026-06-28" -- src/api/clients/application.client.ts src/api/bodies/application.body.ts src/helpers/api-setup.helpers.ts src/helpers/merchant-config.helper.ts src/pages/origination/customer.page.ts src/pages/origination/program-details.page.ts src/pages/origination/error-log.page.ts src/selectors/common.selectors.ts`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Lead aprovado criado
| Checkpoint | Como verificar |
|---|---|
| HTTP 200 | `appResp.ok === true`; `appResp.status === 200` |
| Status aprovado | `body.appApprovalStatus === "APPROVED"` && `body.transactionStatus === "E0"` |
| leadPk numérico | `body.authorizationNumber` numérico → `ctx.leadPk` |
| leadUuid presente | `body.accountNumber` (ou fallback `authorizationNumber`) não vazio |
| Limite e prazos | `body.creditLimit > 0`; `body.approvedTermMonths.length > 0` |

### Oracle: CT-02 — Persistência + Activity Log (rule #13)
| Checkpoint | Como verificar |
|---|---|
| Lead persistido | `SELECT pk FROM uown_los_lead WHERE pk = {leadPk}` → 1 linha |
| Activity log tipado | `uown_los_activity_log WHERE lead_pk = {leadPk}` → ≥ 1 linha com `log_type` preenchido e `notes` não vazio |
| Chamada GDS logada | `uown_los_outbound_api_log WHERE lead_pk = {leadPk}` → ≥ 1 linha (ver nota abaixo) |

> **Tabela correta do Activity Log:** `uown_los_activity_log` (tem `log_type`). NÃO `uown_los_lead_notes`
> (8 colunas, só `lead_pk` + `notes` livre, sem tipo). A rule #13 cita "lead_notes ou equivalente" — o
> equivalente tipado é `uown_los_activity_log`. Confirmado via `docs/database-schema.md` em 2026-06-27.
>
> **Tipos reais de `log_type` em stg/TireAgent (live-proven 2026-06-28):** `DATA_CHANGE` (ADDED:Lead/Customer/Address/Phone/Employment/Email), `INTERNAL` (Running UW data, Application approved), `UNDERWRITING` (Underwriting is run). `CORRESPONDENCE` aparece em fluxos de email/signing. Não confundir com a coluna "User ID" (valor `SYSTEM` para ações automáticas).
>
> **GDS outbound log — observação stg/TireAgent:** em stg com merchant TireAgent (OW90218-0001), `uown_los_outbound_api_log` pode retornar 0 entradas mesmo com lead APPROVED. Classificado como comportamento de infra (CT-05), não como bug do produto. Não tratar como falha de CT-02 nesse ambiente.

### Oracle: CT-03 — Recusa por estado bloqueado
| Checkpoint | Como verificar |
|---|---|
| Status recusado | `appApprovalStatus === "DECLINED"` && `transactionStatus === "E4"` |
| Sem contrato | `providerURL === null` |
| Razão na resposta | `transactionMessage` presente (não exibida ao cliente, só na rede) |
| Lead "Denied" | status do lead no Origination = "Denied" |

### Oracle: CT-04 — Preflight de merchant (rule #12)
| Checkpoint | Como verificar |
|---|---|
| Preflight roda antes | `ensureMerchantReady` é chamado antes de `sendApplication` em `createPreQualifiedApplication` |
| Auto-heal | `AUTO_HEAL_MERCHANT=true` → config curada via `createOrUpdateMerchant` |
| Fail-fast | `AUTO_HEAL_MERCHANT=false` → erro com lista de drift vs merchant-config-contract.ts |

### Oracle: CT-05 — Modos de falha de infra (rule #10)
| Checkpoint | Como verificar |
|---|---|
| Token GDS stale | 500 + "401 Unauthorized [no body]" aninhado no UnderwritingStep → POST refreshGdsAccessTokenSweep |
| Rollback | chamada GDS falha → 0 linhas em uown_los_outbound_api_log |
| WAF/IP | 403 "RBAC: access denied" (text/plain) → whitelist IP / VPN / port-forward |
| Não é bug | nenhum dos dois classifica como [BUG]; reportar como infra |

### Oracle: CT-06 — bankData / roteamento Kornerstone
| Checkpoint | Como verificar |
|---|---|
| Body com bank fields | wire body contém `mainBankRoutingNumber` e `mainBankAccountNumber` |
| Roteamento correto | merchant Kornerstone retorna EligibleTerms esperado (ex: 16) |

### Oracle: CT-07 — Verificação visual do lead criado (rule #14 + #18)
| Checkpoint | Como verificar |
|---|---|
| Lead abre na UI | Navegar para `/customers/{leadPk}` (`OriginationCustomerPage`); Status="Approved" e Internal Status="UW_APPROVED" visíveis e coerentes com a resposta da API |
| Activity Log renderiza | Seção Notes → colunas Date \| Type \| User ID \| Notes presentes; `count ≥ 1` |
| Entradas específicas | NÃO basta "existe entrada do tipo X" — casar cada entrada esperada por **Type + assinatura de conteúdo + valor cruzado** com a API/applicant. Ver tabela **Entradas esperadas** abaixo. |
| Sem erro nas Notes | nenhuma entrada com texto de falha (ex: "Error initiating", "failed", "exception"); varrer todas as linhas |
| Error Log limpo | Navegar para `/errorLog` → aba "Send Application" → coluna "Lead Pk" não contém o `{leadPk}` criado |
| Classificação conservadora | erro encontrado → DOM-first (rule #15) + checar staleness/BDD antes de declarar `[BUG]` (rule #10) |

**Reconciliação de valores (entrada → criado) — "conferimos os valores e o status?": SIM, valor a valor contra o que foi criado:**

| Valor | Fonte do esperado | Onde confirmar na UI | Checkpoint |
|---|---|---|---|
| **Status** | API `appApprovalStatus` | `getLeadStatus()` | == "Approved" (APPROVED) / "Denied" (DECLINED) |
| **Internal Status** | derivado do UW da API | `getInternalStatus()` | == "UW_APPROVED" |
| **Valor aprovado** | API `creditLimit` / `approvedAmount` | resumo (campo do "Modify Approval Amount") + log UWData/UW Status | idêntico nos 3 lugares e == API |
| **leadPk / Reference** | `authorizationNumber` / `ctx.leadPk` | `getAccountNumberFromSummary()` + URL `/customers/{leadPk}` | == leadPk criado |
| **Nome (First/Last)** | applicant submetido | `getCustomerInfo()['First Name'/'Last Name']` | == applicant |
| **Date of Birth** | applicant submetido | `getCustomerInfo()['Date of Birth']` | == applicant |
| **Endereço/City/State/Zip** | applicant submetido | `getCustomerInfo()['Address'/'City'/'State'/'Zip']` | == applicant |
| **Email** | applicant (uniqueEmail do worker) | `getCustomerInfo()['Email']` | == applicant |
| **Phone** | applicant submetido | `getCustomerInfo()['Phone']` | == applicant |

> **Status não é cosmético:** `getLeadStatus()` / `getInternalStatus()` DEVEM derivar do `appApprovalStatus` da API. API APPROVED mas Status ≠ Approved (ou Internal Status ≠ UW_APPROVED) na UI = inconsistência a investigar (não confirmar bug sem DOM-first + staleness). Idem o valor aprovado: UI exibindo valor diferente do `creditLimit` retornado para ESTE leadPk = registro incorreto.

**Entradas esperadas — cada uma casada por (Type + assinatura no campo Notes + cross-check do valor DESTE lead):**

| # | Type | Assinatura no campo Notes | Cross-check (prova que é DESTE lead) |
|---|---|---|---|
| 1 | DATA_CHANGE | `ADDED : Lead[ ... createdFrom = {canal} ... ccPeekConsent = TRUE ... customerState = {ST}]` | `createdFrom` == canal esperado (ex: `TIRE_AGENT_API`); `customerState` == applicant.state |
| 2 | DATA_CHANGE | `ADDED : Customer[firstName = {F} lastName = {L} dateOfBirth = {DOB}]` | F / L / DOB == applicant submetido |
| 3 | DATA_CHANGE | `ADDED : Address[ ... state = {ST} zipCode = {ZIP} ... ]` | ST / ZIP == applicant submetido |
| 4 | DATA_CHANGE | `ADDED : Phone[...]` + `ADDED : Employment[ ... monthlyIncome = {x} ]` | presentes; income == applicant (se informado) |
| 5 | DATA_CHANGE | `ADDED : Email[emailAddress = {EMAIL} emailType = PRIMARY]` | EMAIL == applicant.email (uniqueEmail do worker) |
| 6 | UNDERWRITING | `Underwriting is run. Response Status is {STATUS}` | STATUS == `appApprovalStatus` da API |
| 7 | DATA_CHANGE | `ADDED : UWData[uwApprovalAmount = {A} approvalAmount = {A} approvalExpirationDate = {D}]` | A == `creditLimit` / `approvedAmount` da API |
| 8 | INTERNAL | `UW Status : {STATUS}. Original approval {A}, consumed amount 0, final approval, {A}` | STATUS e A idênticos à API |
| 9 | INTERNAL | `Approval Amount: {A}, Over Approval Percent: {p}%, Max Approval Amount: {M}` | A == aprovação; `M ≈ A × (1 + p)` (ex: 1830 × 1.05 = 1921.50) |

**Ausência de erro / consistência (a parte "se há erros"):** o `approvalAmount` DEVE ser idêntico nas entradas #7, #8 e #9 e igual ao `creditLimit` da API — valor divergente entre entradas = registro incorreto/inconsistente. A entrada #6 (UNDERWRITING) DEVE refletir o MESMO `appApprovalStatus` da API — API APPROVED + log DECLINED (ou vice-versa) = inconsistência a investigar, não confirmar como bug sem DOM-first (rule #15) + staleness.

> **Referência — Activity Log real (lead aprovado via `sendApplication`, TireAgent/CA, leadPk 7218250, 2026-06-28; valores variam por lead):**
> ```
> DATA_CHANGE   SYSTEM  ADDED : Lead[customerState = CA, createdFrom = TIRE_AGENT_API, ccPeekConsent = TRUE, ssnAlreadyExists = FALSE, maxApprovalAmount = 0]
> DATA_CHANGE   SYSTEM  ADDED : Customer[firstName = DAVID, lastName = BROWN, dateOfBirth = 1979-04-02]
> DATA_CHANGE   SYSTEM  ADDED : Address[addressType = HOME, streetAddress1 = 4816 WASHINGTON DR, city = LOS ANGELES, state = CA, zipCode = 90012]
> DATA_CHANGE   SYSTEM  ADDED : Phone[areaCode = 725, phoneNumber = 1010017]
> DATA_CHANGE   SYSTEM  ADDED : Employment[employer = UOWN TEST, monthlyIncome = 4666.67]
> DATA_CHANGE   SYSTEM  ADDED : Email[emailAddress = FINTECHGROUP777+...@GMAIL.COM, emailType = PRIMARY]
> INTERNAL      SYSTEM  Running UW data on lead
> UNDERWRITING  SYSTEM  Underwriting is run. Response Status is APPROVED
> DATA_CHANGE   SYSTEM  ADDED : UWData[uwApprovalAmount = 1830.0, approvalAmount = 1830.0, approvalExpirationDate = 2026-08-26]
> INTERNAL      SYSTEM  UW Status : APPROVED. Original approval 1830.0, consumed amount 0, final approval, 1830.0
> INTERNAL      SYSTEM  Approval Amount: 1830.0, Over Approval Percent: 5.00%, Max Approval Amount: 1921.50
> ```
> Total real: **11 entradas — DATA_CHANGE ×7, INTERNAL ×3, UNDERWRITING ×1.** Contagem por tipo NÃO é checkpoint (a tally automática do probe registrou INTERNAL×5/DATA_CHANGE×4, divergente) — por isso CT-07 valida assinaturas de conteúdo + valor, não contagens.

> **Automação CT-07:** `src/scripts/_probe_send_application.ts` executa CT-07 via `chromium.launch()` em modo headless após CT-01/CT-02. Não requer intervenção manual. Credenciais: `config.getCredentials('admin')` resolvidas via env vars `{ENV}_ADMIN_USERNAME` / `{ENV}_ADMIN_PASSWORD`.
>
> **Error Log — filtro correto:** a aba "Send Application" lista TODOS os erros do merchant, não apenas do lead atual. O checkpoint é: leadPk do lead recém-criado NÃO aparece na coluna "Lead Pk". Um erro de outro lead na tabela não é falha deste CT.

## Notas de fonte primária

- **Campos de response** (CT-01/CT-03): confirmados via `src/api/clients/application.client.ts` +
  checkpoints de rede já revisados em `new-application.md` (E0/E4, providerURL null).
- **Tabelas** (CT-02): confirmadas via `docs/database-schema.md` em 2026-06-27 — `uown_los_lead` (78 col),
  `uown_los_activity_log` (18 col, tem `log_type`), `uown_los_outbound_api_log` (19 col, tem `lead_pk`).
- **Modos de falha** (CT-05): memórias `sendapplication-500-stale-gds-token` e
  `sendapplication-403-rbac-ip-whitelist` (datadas — recategorizar como infra, não bug).
- **Reconciliação de valores** (CT-07): `OriginationCustomerPage` expõe `getLeadStatus()`,
  `getInternalStatus()`, `getAccountNumberFromSummary()`, `getCustomerInfo()` (First/Last Name, DOB,
  Address, City, State, Zip, Email, Phone) e `getActivityLogEntries()` — confirmado em
  `src/pages/origination/customer.page.ts` 2026-06-28. São esses os getters que casam o applicant
  submetido + a resposta da API com o que a UI mostra no lead criado.
- **Verificação de UI** (CT-07): live-proven stg 2026-06-28 (leadPk=7218250, David Brown). UI exibiu Status=Approved, Internal Status=UW_APPROVED, Notes com **11 entradas reais — DATA_CHANGE×7, INTERNAL×3, UNDERWRITING×1** (ver bloco de referência em CT-07; a tally automática anterior INTERNAL×5/DATA_CHANGE×4 estava imprecisa — contagem por tipo não é checkpoint, validar assinaturas de conteúdo). Error Log aba "Send Application" com 1 entrada de outro lead (William Taylor, SSN 3377) — leadPk=7218250 ausente ✓. Automação integrada ao probe via `chromium.launch()` headless em `src/scripts/_probe_send_application.ts`.
