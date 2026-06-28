---
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc
covers:
  - src/api/clients/settlement.client.ts
  - src/api/bodies/settlement.body.ts
  - src/api/responses/settlement.response.ts
  - src/api/clients/lead.client.ts
  - src/helpers/api-setup.helpers.ts
  - src/pages/origination/funding.page.ts
  - src/pages/origination/customer.page.ts
  - src/selectors/common.selectors.ts
  - src/types/enums.ts
---

# Funding — Transição da Aplicação de SIGNED para FUNDING

> Operação que leva um lease **assinado** (`SIGNED`) para o processo de **funding**
> (UOwn paga o merchant). É o passo seguinte ao e-sign (`signwell-signing.md` /
> `gowsign-signing.md`): o contrato está assinado, o merchant entregou a mercadoria,
> e a aplicação entra na **Funding Queue** aguardando o desembolso.
>
> **Três gatilhos levam SIGNED → FUNDING (mesmo estado observável, caminhos diferentes):**
> 1. **`settleApplication` (partner API — canônico):** `POST /uown/los/settleApplication`.
>    O merchant solicita o settlement após a entrega. Caminho **SIGNED → READY_TO_FUND → FUNDING**
>    (o settle persiste o intermediário `READY_TO_FUND`). Live-proven (banner abaixo).
> 2. **Auto-move (`merchant.is_signed_to_funding = true`):** no momento da assinatura o SYSTEM
>    move **SIGNED → FUNDING** direto (sem settle explícito). Nota da fila:
>    `"SYSTEM changed status from SIGNED to FUNDING"`. Live-doc: KB lead 7218178 (2026-06-25).
> 3. **`updateFundingStatus` (interno/ops):** `POST /uown/los/updateFundingStatus {leadPks, status:'FUNDING'}`.
>    Flip de status usado por ferramentas internas (`driveLeadToFunding` o usa como passo final).
>
> **Pré-condição dura:** o lead PRECISA estar em `SIGNED` (ou `READY_TO_FUND`). `settleApplication`
> sobre `UW_APPROVED` retorna `A0` + `transactionMessage: "LeadStatus UW_APPROVED is not eligible for
> settlement"` (business-rule §51.4). Valor mínimo do lease = **$250** (todos os envs).
>
> **Resposta da partner API é XML** (`<ApplicationSettleResponse>` / `<ApplicationStatusResponse>`),
> NÃO JSON — `<faults>false</faults>` = sucesso. Os clients tipados
> (`SettleApplicationResponseBody`) assumem JSON; ao validar via `curl`/`fetch` cru, parsear XML.
>
> **Fontes primárias:**
> `docs/business-rules/08-funding-merchants.md` §9 (Funding Queue + Status Transitions),
> §10 (LOS→SVC Import), §28 (Webhooks), §51.3/§51.4 (getApplicationStatus / settleApplication),
> §67 (Funding Modification Audit) ·
> `src/api/clients/settlement.client.ts` + `src/api/bodies/settlement.body.ts` ·
> `src/api/clients/lead.client.ts` (`updateFundingStatus`, `changeLeadStatus`) ·
> `src/helpers/api-setup.helpers.ts` (`driveLeadToFunding`) ·
> `src/pages/origination/funding.page.ts` (Funding Queue UI) ·
> `src/types/enums.ts` (`LeadStatus.READY_TO_FUND/FUNDING`, `FundingQueueStatus`) ·
> `docs/knowledge-base/origination-funding-queue-page.md` (superfície UI) ·
> `docs/knowledge-base/funding-signed-to-funding.md` (discovery desta operação).

> ### ✅ VALIDADO LIVE — stg 2026-06-28, lead 7218271 (settleApplication path)
> Disparado via `pg` direto + `fetch` à partner API stg (este box é whitelisted, não sofre o WAF 403).
> **Pré-estado:** lead 7218271 `SIGNED`, `account_pk=null`, **0** linhas em `uown_funding_transaction`;
> merchant pk 566 = **OW90218-0001 (Tire Agent, ONLINE, esign SIGNWELL)** com
> `is_signed_to_funding=FALSE` (→ NÃO auto-fundou; exigiu settle explícito) e `use_webhook=FALSE`.
> **Gatilho:** `POST /uown/los/settleApplication` {userName, setupPassword, merchantNumber, localeString,
> accountNumber=uuid} → **200**, `<ApplicationSettleResponse><faults>false</faults>
> <accountNumber>5ffdc1f7…</accountNumber><authorizationNumber>7218271</authorizationNumber>`.
> **Caminho observado (lead_notes, cronológico):** `validateApplicationSettleRequest` →
> `Merchant requested settlement through API` → `Lead starting status SIGNED` →
> `[UOwnClient][settleApplication] Lead set to READY_TO_FUND` → `End. LeadStatus : READY_TO_FUND` →
> `[LeadFundingService][updateFundingStatus] Update Lead Status to FUNDING` →
> `[updateFundingStatus] OldLeadStatus : READY_TO_FUND New LeadStatus : FUNDING`.
> **Pós-estado:** `uown_los_lead.lead_status=FUNDING`, `account_pk=622660` (account SVC criada, import LOS→SVC);
> nova `uown_funding_transaction` pk 756264 (`funding_queue_status=FUNDING`, `funding_status=FULL_FUNDING`,
> `status=ACTIVE`, `amount_to_be_funded=2201.22`, `invoice_amount=2341.50`, `total_contract_amount=5623.89`,
> `funding_request_date_time` setado, `fund_date_time=NULL`,
> `user_notes="06/28/2026 : SYSTEM changed status from READY_TO_FUND to FUNDING"`);
> **`uown_funding_modification`: 0 linhas** (a entrada inicial SIGNED→FUNDING NÃO é auditada ali — §67 audita
> só transições posteriores da fila). **API** `getApplicationStatus` → `currentStatus=FUNDING`,
> `hasSignedLease=true`, `fundRequestDateTime=2026-06-28T05:01:10`, `fundedDateTime=(vazio)`,
> `amountToBeFunded=2201.22`, `paymentDueDate=2026-07-05`.
> **UI live (CT-08 + CT-05b):** após renovar `.auth/origination.json` (login manager `jmndes.gow`, sem OTP),
> a **Funding Queue** mostrou o lead 7218271 com `Status=FUNDING` + `Funding Queue Status=FUNDING` (1-1 of 1), e o
> card **"Notes"** em `/customers/7218271` renderizou `STATUS_CHANGE / SYSTEM / "Merchant requested settlement :
> SIGNED -> FUNDING"` + o welcome email (`CORRESPONDENCE "Created Welcome to be sent as EMAIL"`).
> **Achado:** o card de notas chama-se "Notes" (não "Activity") → `SELECTORS.activityLogEntry` não casa esta página.

## Critérios de Aceitação

| ID | Critério | Oracle | Fonte |
|---|---|---|---|
| AC-01 | A transição só ocorre a partir de `SIGNED` (ou `READY_TO_FUND`). `settleApplication` sobre lead não-elegível retorna `A0` + `"LeadStatus {X} is not eligible for settlement"` (live: CONTRACT_CREATED). Lease ≥ $250 | CT-01 | live stg ✓ |
| AC-02 | Pós-transição `uown_los_lead.lead_status='FUNDING'`. No path **settle** o intermediário `READY_TO_FUND` é persistido (SIGNED→READY_TO_FUND→FUNDING); no path **auto** vai SIGNED→FUNDING direto | CT-02 | live stg ✓ |
| AC-03 | É criada UMA linha em `uown_funding_transaction`: `funding_queue_status='FUNDING'`, `funding_status='FULL_FUNDING'` (settle total), `status='ACTIVE'`, `amount_to_be_funded>0`, `funding_request_date_time` setado, `fund_date_time` NULL (ainda não FUNDED) | CT-03 | live stg ✓ |
| AC-04 | Import LOS→SVC já no **FUNDING**: uma **account** de servicing (`uown_sv_account`, `account_status='ACTIVE'`) é criada e `uown_los_lead.account_pk` passa de NULL para o pk dela (§10). A account já está ACTIVE antes do FUNDED | CT-04 | live stg ✓ |
| AC-05 | Activity log (rule #13): a trilha do settle é registrada em `uown_los_lead_notes` + `user_notes` na `funding_transaction` (`"SYSTEM changed status from {READY_TO_FUND\|SIGNED} to FUNDING"`). Sem log = nada aconteceu | CT-05 | live stg ✓ |
| AC-05b | **UI (rule #14):** a nota da transição é visível no card **"Notes"** da página do cliente (`/customers/{leadPk}`, colunas Date/Type/User ID/Notes) — linha `STATUS_CHANGE / SYSTEM / "Merchant requested settlement : SIGNED -> FUNDING"`. Ler o log no DB NÃO substitui ver onde o usuário olha | CT-05b | live stg ✓ |
| AC-06 | `uown_funding_modification` **NÃO** registra a entrada inicial SIGNED→FUNDING (0 linhas). O audit (§67) cobre só transições posteriores da fila (FUNDING→FUNDED, FUNDED→FUNDING, REQUEST_REFUND→REFUNDED) | CT-06 | live stg ✓ |
| AC-07 | `getApplicationStatus` reflete: `currentStatus='FUNDING'`, `hasSignedLease=true`, `applicationFound=true`, `fundRequestDateTime` setado, `fundedDateTime` vazio, `amountToBeFunded>0` | CT-07 | live stg ✓ |
| AC-08 | A aplicação aparece na **Funding Queue** (`/funding`, Origination) com `Status=FUNDING` e `Funding Queue Status=FUNDING` (1 linha, Reference # = leadPk, Customer Name = applicant) | CT-08 | live stg ✓ |
| AC-09 | Webhook é **config-gated**: se `merchant.use_webhook=true`, a transição para `FUNDING` dispara um webhook ao merchant (FUNDING está na lista default de status que disparam webhook — §28). Com `use_webhook=false` nenhum webhook é enviado | CT-09 | business rule §28 + live (use_webhook=false) |
| AC-10 | Auto-path: `merchant.is_signed_to_funding=true` → o SYSTEM move SIGNED→FUNDING no momento da assinatura, sem `settleApplication`. `user_notes="SYSTEM changed status from SIGNED to FUNDING"`, `created_from` = origem (ex: `TIRE_AGENT_API`) | CT-10 | KB live lead 7218178 (2026-06-25) |

## Cenários

```gherkin
Feature: Funding — transição da aplicação de SIGNED para FUNDING

  Background:
    # Pré-condições (cada uma tem seu próprio oracle):
    #   (1) Lead criado e aprovado — ver send-application.md / new-application.md
    #   (2) CC/ACH submetidos — ver cc-ach.md
    #   (3) Contrato assinado (lease_status=SIGNED) — ver signwell-signing.md / gowsign-signing.md
    Given um lead com lease assinado (uown_los_lead.lead_status = 'SIGNED')
    And o lease é >= $250
    And o merchant entregou a mercadoria (pré-condição de negócio para o settle)

  Scenario: [negative] CT-01 — Só SIGNED/READY_TO_FUND é elegível para settle
    Given um lead em uown_los_lead.lead_status = 'UW_APPROVED' (ainda não assinado)
    When o merchant chama POST /uown/los/settleApplication para esse accountNumber
    Then a resposta tem transactionStatus = 'A0'
    And transactionMessage contém "is not eligible for settlement"
    And o lead permanece em UW_APPROVED (não avança para FUNDING)

  Scenario: [positive] CT-02 — SIGNED → FUNDING (path settle persiste READY_TO_FUND)
    Given um lead em SIGNED e o merchant chama settleApplication
    When o settle é processado
    Then o lead passa por READY_TO_FUND e termina em uown_los_lead.lead_status = 'FUNDING'
    And as notas registram "Lead set to READY_TO_FUND" e depois "New LeadStatus : FUNDING"
    # NOTA: no path auto (is_signed_to_funding=true) a transição é SIGNED→FUNDING direto (CT-10)

  Scenario: [side-effect] CT-03 — funding_transaction criada
    Given a transição para FUNDING concluiu
    When uown_funding_transaction é consultada por lead_pk
    Then existe exatamente 1 linha nova
    And funding_queue_status = 'FUNDING'
    And funding_status = 'FULL_FUNDING' (settlement total)
    And status = 'ACTIVE'
    And amount_to_be_funded > 0 (invoice menos discount/fees/platform fee)
    And funding_request_date_time está preenchido
    And fund_date_time é NULL (ainda não foi FUNDED)

  Scenario: [side-effect] CT-04 — Account de servicing criada (import LOS→SVC)
    Given a transição para FUNDING concluiu
    When uown_los_lead é consultado por pk
    Then account_pk deixou de ser NULL (uma account SVC foi criada)
    # §10: dados (customers, addresses, bank, CC APPROVED, receivables, PP) importados ao SVC

  Scenario: [side-effect] CT-05 — Activity log da transição (rule #13)
    Given o merchant solicitou o settlement
    When uown_los_lead_notes é consultado por lead_pk (ordem cronológica)
    Then existe nota "Merchant requested settlement through API"
    And existe nota "[UOwnClient][settleApplication] Lead set to READY_TO_FUND"
    And existe nota "[LeadFundingService][updateFundingStatus] Update Lead Status to FUNDING"
    And existe nota "[updateFundingStatus] OldLeadStatus : ... New LeadStatus : FUNDING"
    And user_notes na funding_transaction contém "SYSTEM changed status from ... to FUNDING"

  Scenario: [positive] CT-05b — Nota da transição visível no card "Notes" do cliente (UI — rule #13 + #14)
    # Ponto de verificação UI obrigatório: o agente de ops vê a nota no portal, não só no DB.
    # ⚠️ O card chama-se "Notes" (NÃO "Activity") — colunas Date | Type | User ID | Notes.
    Given o lead foi movido para FUNDING (CT-02 concluído)
    When o agente navega para {originationUrl}/customers/{leadPk}
    And o card "Notes" carrega
    Then existe uma linha Type=STATUS_CHANGE / User ID=SYSTEM com nota "Merchant requested settlement : SIGNED -> FUNDING"
    And existe uma linha Type=STATUS_CHANGE / SYSTEM com nota "Funding Status is updated from READY_TO_FUND ..."
    And existe uma linha Type=CORRESPONDENCE / SYSTEM "Created Welcome to be sent as EMAIL" (welcome email — §10)
    # Ler o backend log no DB (CT-05) NÃO substitui ver a nota renderizada onde o usuário olha (rule #14)

  Scenario: [negative] CT-06 — funding_modification NÃO audita a entrada inicial
    Given a transição SIGNED → FUNDING concluiu
    When uown_funding_modification é consultada por lead_pk
    Then NÃO há linha para a entrada inicial (0 linhas)
    # §67: o audit registra só transições posteriores (FUNDING→FUNDED, FUNDED→FUNDING, REQUEST_REFUND→REFUNDED)

  Scenario: [positive] CT-07 — getApplicationStatus reflete FUNDING
    Given a transição para FUNDING concluiu
    When o merchant chama POST /uown/los/getApplicationStatus para o accountNumber
    Then currentStatus = 'FUNDING'
    And hasSignedLease = true
    And fundRequestDateTime está preenchido
    And fundedDateTime está vazio
    And amountToBeFunded > 0

  Scenario: [positive] CT-08 — Aplicação visível na Funding Queue (Origination)
    Given um agente abre /funding no portal Origination com Status=Funding (default)
    When ele filtra pelo merchant/lead e clica Search
    Then a linha do lead aparece com Status = 'FUNDING'
    And a coluna Funding Queue Status = 'FUNDING'
    And a coluna User Notes mostra "SYSTEM changed status ... to FUNDING"
    # A ação em massa "Send to FUNDED" daqui é a PRÓXIMA transição (FUNDING→FUNDED), fora deste oracle

  Scenario: [side-effect] CT-09 — Webhook FUNDING (config-gated por use_webhook)
    Given o merchant tem use_webhook = true e webhook_url configurado
    When o lead transita para FUNDING (FUNDING está na lista default de gatilhos — §28)
    Then um POST é enviado ao webhook_url do merchant com o status FUNDING
    # Com use_webhook = false (ex: TireAgent stg) NENHUM webhook é enviado — comportamento esperado

  Scenario: [positive] CT-10 — Auto-move (is_signed_to_funding=true) move SIGNED→FUNDING na assinatura
    Given um merchant com is_signed_to_funding = true
    And um lead desse merchant acabou de ser assinado (SIGNED)
    When a assinatura conclui
    Then o SYSTEM move o lead direto SIGNED → FUNDING (sem settleApplication explícito)
    And user_notes na funding_transaction = "SYSTEM changed status from SIGNED to FUNDING"
    And created_from reflete a origem da aplicação (ex: TIRE_AGENT_API)
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> ```bash
> git log ff4f0fc..HEAD -- src/api/clients/settlement.client.ts src/api/bodies/settlement.body.ts src/api/responses/settlement.response.ts src/api/clients/lead.client.ts src/helpers/api-setup.helpers.ts src/pages/origination/funding.page.ts src/pages/origination/customer.page.ts src/selectors/common.selectors.ts src/types/enums.ts
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

> **Nota de validação live:** CT-02..CT-07 validados ao vivo em stg 2026-06-28 (lead 7218271, settleApplication
> path) via `pg` direto + partner API; CT-01 (rejeição de não-elegível) no lead 7218270 (`CONTRACT_CREATED` → A0).
> **CT-05b** (card "Notes" em `/customers/{leadPk}`) e **CT-08** (Funding Queue) validados ao vivo via Playwright +
> login manager (`.auth/origination.json` renovado) — screenshots no scratchpad. Assim **CT-01..CT-08 estão todos
> live-provados**. CT-09 (webhook) é config-gated: este merchant tem `use_webhook=false` (nenhum webhook esperado —
> confirmado). CT-10 (auto-move `is_signed_to_funding=true`) ancorado na KB live (lead 7218178, 2026-06-25) — exige
> um merchant com o flag ligado, não exercido neste run.

### Oracle: CT-01 — Elegibilidade do settle  `[CONFIRMADO live stg 2026-06-28 lead 7218270]`

> Live: `settleApplication` sobre lead 7218270 (`CONTRACT_CREATED`) → HTTP 200, `transactionStatus=A0`,
> `transactionMessage="LeadStatus CONTRACT_CREATED is not eligible for settlement"`, `faults=false`.
> Rejeição limpa — não muta o lead.

| Checkpoint | Como verificar | Live (lead 7218270) |
|---|---|---|
| settle exige SIGNED/READY_TO_FUND | `settleApplication` sobre lead não-elegível (`UW_APPROVED`/`CC_AUTH_PASSED`/`CONTRACT_CREATED`) → `transactionStatus='A0'` + `transactionMessage` casa `/LeadStatus .* is not eligible for settlement/` | `A0` / "CONTRACT_CREATED is not eligible" ✓ |
| lease ≥ $250 | invoice/order < $250 não aprova (regra de valor mínimo, todos os envs) | business rule |
| lead permanece | `getEsignLeadStatus(db, leadPk)` inalterado após um settle rejeitado | sem mutação ✓ |

### Oracle: CT-02 — lead_status → FUNDING (path settle persiste READY_TO_FUND)  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| pré-estado SIGNED | `SELECT lead_status, account_pk FROM uown_los_lead WHERE pk=:lead` → `SIGNED`, `account_pk` NULL | `SIGNED` / `null` ✓ |
| settle 200 faults=false | `POST /uown/los/settleApplication` → XML `<faults>false</faults>` + `<authorizationNumber>{leadPk}</authorizationNumber>` | 200, faults=false, auth=7218271 ✓ |
| intermediário READY_TO_FUND | nota `[UOwnClient][settleApplication] Lead set to READY_TO_FUND` presente | ✓ |
| pós-estado FUNDING | `waitForLeadStatus(db, leadPk, 'FUNDING')` → `lead_status='FUNDING'` | `FUNDING` ✓ |

### Oracle: CT-03 — funding_transaction criada  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> Live: `uown_funding_transaction` pk 756264.

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| 1 linha nova | `SELECT * FROM uown_funding_transaction WHERE lead_pk=:lead ORDER BY pk DESC` → 1 row | pk 756264 ✓ |
| funding_queue_status | `= 'FUNDING'` | `FUNDING` ✓ |
| funding_status | `= 'FULL_FUNDING'` (settlement total) | `FULL_FUNDING` ✓ |
| status | `= 'ACTIVE'` | `ACTIVE` ✓ |
| amount_to_be_funded | `> 0` (= invoice − dealer discount − platform fee − CC fee + rebate, §9) | `2201.22` (invoice 2341.50) ✓ |
| funding_request_date_time | não nulo | `2026-06-28T08:01:10Z` ✓ |
| fund_date_time | NULL (ainda não FUNDED) | `null` ✓ |
| user_notes | casa `SYSTEM changed status from (READY_TO_FUND\|SIGNED) to FUNDING` | `… from READY_TO_FUND to FUNDING` ✓ |

### Oracle: CT-04 — Account de servicing criada (import LOS→SVC) JÁ no FUNDING  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> **Achado (rule #16):** a account de servicing (`uown_sv_account`) é criada já na transição para
> **FUNDING** (via `settleApplication`), NÃO no FUNDED. Live: ao virar FUNDING, `uown_sv_account` pk 622660
> já existe com `account_status='ACTIVE'`. → corrige a atribuição "uown_sv_account criado no FUNDED" do
> `funded.md` (a account já está ACTIVE quando o lead chega no FUNDED).

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| account_pk preenchido | `SELECT account_pk FROM uown_los_lead WHERE pk=:lead` → não nulo (era NULL pré-settle) | `622660` (era `null`) ✓ |
| uown_sv_account ACTIVE | `SELECT pk, lead_pk, account_status FROM uown_sv_account WHERE lead_pk=:lead` → 1 row, `account_status='ACTIVE'`, `pk = lead.account_pk` | pk 622660 / `ACTIVE` ✓ |
| import §10 | account/customers/addresses/bank/CC APPROVED/receivables/PP importados ao SVC | account criada ✓ |

### Oracle: CT-05 — Activity log da transição (rule #13)  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| settlement solicitado | `findLeadNoteContaining(db, leadPk, 'Merchant requested settlement through API')` | nota 84564868 ✓ |
| set READY_TO_FUND | `findLeadNoteContaining(db, leadPk, 'Lead set to READY_TO_FUND')` | nota 84564870 ✓ |
| update para FUNDING | `findLeadNoteContaining(db, leadPk, '[LeadFundingService][updateFundingStatus] Update Lead Status to FUNDING')` | nota 84564872 ✓ |
| transição auditada na nota | `findLeadNoteContaining(db, leadPk, 'New LeadStatus : FUNDING')` casa `OldLeadStatus : ... New LeadStatus : FUNDING` | nota 84564873 (`Old=READY_TO_FUND`) ✓ |
| user_notes da fila | `funding_transaction.user_notes` casa `SYSTEM changed status .* to FUNDING` | ✓ |

### Oracle: CT-05b — Card "Notes" na página do cliente (UI)  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> CT-05 (DB) NÃO substitui esta verificação UI (rule #14): o agente de ops VÊ a nota renderizada no card,
> não lê o `uown_los_lead_notes`. Re-drive live via login manager (`.auth/origination.json` renovado).
>
> **✅ Selector endurecido (2026-06-28):** na página `/customers/{leadPk}` o card é **"Notes"** (NÃO "Activity"),
> um **react-data-table** (`.rdt_Table[role=table]`, linhas `.rdt_TableRow`) com colunas **Date | Type | User ID |
> Notes** + Filters + paginação (10/página, Date DESC). O `SELECTORS.activityLogEntry` antigo (ancorado em
> `text='Activity'`) retornava `[]`; foi reescrito para ancorar no título "Notes" e pegar as `rdt_TableRow` do
> corpo (DOM-first live: 10 linhas, sem duplicatas). `getActivityLogEntries()` agora faz scroll+wait do card
> (lazy-render) antes de ler. ⚠️ O card paginação por Date DESC: cada abertura de `/customers/{pk}` grava uma nota
> `REVIEW "Lead has been reviewed"` no topo → numa execução de teste, ler a nota da transição logo após a ação
> (antes que REVIEWs a empurrem para a página 2) ou filtrar por `Type=STATUS_CHANGE`.
>
> **Tipos de nota observados:** `STATUS_CHANGE`, `CORRESPONDENCE`, `DATA_CHANGE`, `INTERNAL`, `REVIEW`.
> (As linhas `REVIEW / jmndes.gow / "Lead has been reviewed"` são efeito de abrir a página — não da transição.)

**URL:** `{originationUrl}/customers/{leadPk}` · **Card:** header `text='Notes'`

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| card Notes carrega | header "Notes" + tabela Date/Type/User ID/Notes visível | ✓ (1-10 of 36) |
| nota da transição | linha `STATUS_CHANGE` / `SYSTEM` casa `Merchant requested settlement : SIGNED -> FUNDING` | ✓ @ 05:01:10 EST |
| nota do funding status | linha `STATUS_CHANGE` / `SYSTEM` casa `Funding Status is updated from READY_TO_FUND` | ✓ @ 05:01:12 EST |
| welcome email (§10) | linha `CORRESPONDENCE` / `SYSTEM` `Created Welcome to be sent as EMAIL` (+ `ActivationNotice`) | ✓ @ 05:01:12-13 EST |

### Oracle: CT-06 — funding_modification NÃO audita a entrada inicial  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| audit vazio na entrada | `SELECT COUNT(*) FROM uown_funding_modification WHERE lead_pk=:lead` → 0 logo após SIGNED→FUNDING | `0` ✓ |
| audit cobre transições posteriores | §67: linhas surgem em FUNDING→FUNDED / FUNDED→FUNDING / REQUEST_REFUND→REFUNDED (campos `old_lead_status`/`new_lead_status`/`old_funding_queue_status`/`new_funding_queue_status`) | n/a (não houve FUNDED neste run) |

### Oracle: CT-07 — getApplicationStatus reflete FUNDING  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> Resposta XML `<ApplicationStatusResponse>` (não JSON). `transactionStatus=I0` (informacional).

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| currentStatus | `<currentStatus>` = `FUNDING` | `FUNDING` ✓ |
| hasSignedLease | `<hasSignedLease>` = `true` | `true` ✓ |
| applicationFound | `<applicationFound>` = `true` | `true` ✓ |
| fundRequestDateTime | `<fundRequestDateTime>` não vazio | `2026-06-28T05:01:10.779771` ✓ |
| fundedDateTime | `<fundedDateTime/>` vazio (ainda não FUNDED) | vazio ✓ |
| amountToBeFunded | `<amountToBeFunded>` > 0 (casa funding_transaction) | `2201.22` ✓ |

### Oracle: CT-08 — Aplicação visível na Funding Queue  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> Re-drive live via Playwright headless + login manager (`jmndes.gow`, sem OTP) → `.auth/origination.json`
> renovado. Funding Queue mostrou EXATAMENTE 1 linha (`1-1 of 1`): Reference # **7218271**, **Status FUNDING**,
> **Funding Queue Status FUNDING**, Customer **Mark Griffin**, Two Day Funding Exception **False**. Botão de ação
> em massa "Send to FUNDED" presente (próxima transição → `funded.md`).

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| navegar Funding Queue | `FundingPage.navigateToFundingQueue(originationUrl)` → `/funding` (Status default = "Funding") | carregou ✓ |
| linha do lead presente | Reference # = leadPk na grade | `7218271` (1-1 of 1) ✓ |
| coluna Status | a linha mostra `Status = FUNDING` (`getStatusColumnValues()`) | `FUNDING` ✓ |
| coluna Funding Queue Status | `Funding Queue Status = FUNDING` (coluna distinta de Status — RN-01 da KB) | `FUNDING` ✓ |
| coluna Customer Name | nome do applicant | `Mark Griffin` ✓ |
| coluna User Notes | trilha da transição (satisfaz rule #13 — RN-04 da KB); ver também CT-05b (card Notes) | nota presente ✓ |

### Oracle: CT-09 — Webhook FUNDING (config-gated)  `[BUSINESS RULE §28 + live use_webhook=false]`

| Checkpoint | Como verificar | Live (merchant 566) |
|---|---|---|
| FUNDING é gatilho default | §28: status que disparam webhook incluem `FUNDING` (e `FUNDED, SIGNED, CONTRACT_CREATED, EXPIRED, CANCELLED_DUP_SSN`) | doc ✓ |
| gate por merchant | `SELECT use_webhook, webhook_url FROM uown_merchant WHERE pk=:merchantPk` — webhook só dispara se `use_webhook=true` | `use_webhook=false`, url vazia → nenhum webhook ✓ (esperado) |
| auth OAuth se exigida | se o merchant exige auth, o sistema obtém um token OAuth antes do POST (§28) | n/a |

### Oracle: CT-10 — Auto-move is_signed_to_funding  `[KB live lead 7218178 (2026-06-25)]`

| Checkpoint | Como verificar | Evidência |
|---|---|---|
| flag do merchant | `SELECT is_signed_to_funding FROM uown_merchant WHERE pk=:merchantPk` = `true` | merchant 566 = `false` (→ não auto-fundou; settle explícito) |
| transição direta | sem `settleApplication`, o lead vai SIGNED→FUNDING ao assinar | KB lead 7218178 ✓ |
| user_notes da fila | `funding_transaction.user_notes` = `"SYSTEM changed status from SIGNED to FUNDING"` (vs `READY_TO_FUND` no path settle) | KB lead 7218178 ✓ |
| created_from | reflete a origem da aplicação | KB lead 7218178 = `TIRE_AGENT_API` ✓ |

## Notas de fonte primária

- **Gatilho settle (CT-01/CT-02)**: `docs/business-rules/08-funding-merchants.md` §51.4
  (`settleApplication` — "Triggers the funding process"; `A0` "not eligible for settlement").
  Client tipado: `src/api/clients/settlement.client.ts` → `POST /uown/los/settleApplication`;
  body em `src/api/bodies/settlement.body.ts` (`buildSettleApplicationBody`). Intermediário
  `READY_TO_FUND` em `src/types/enums.ts:14`.
- **Status FUNDING + funding_transaction (CT-03)**: §9 (Status Transitions, "→ FUNDING | Lead imported
  into SVC, account created, fundRequestDateTime recorded"). Colunas em
  `docs/taskTestingUown/database-schema.md` (`uown_funding_transaction`, 50 colunas).
  Enum `FundingQueueStatus` em `src/types/enums.ts:91`.
- **Import LOS→SVC (CT-04)**: §10 (LOS to SVC Import — account/customers/bank/CC APPROVED/receivables/PP).
- **Activity log (CT-05)**: CLAUDE.md rule #13. Helpers: `findLeadNoteContaining`, `waitForLeadStatus`
  (`src/helpers/esign-db.helpers.ts`). Padrão de transição `OldLeadStatus : X New LeadStatus : Y`
  já reconhecido em `esign-db.helpers.ts` (`TRANSITION_PATTERNS`).
- **Funding Modification Audit (CT-06)**: §67 (`getFundingModifications`, tabela `uown_funding_modification`
  — `old/new_lead_status`, `old/new_funding_queue_status`). Live: 0 linhas para a entrada inicial.
- **getApplicationStatus (CT-07)**: §51.3 (campos `currentStatus`, `hasSignedLease`, `fundRequestDateTime`,
  `fundedDateTime`, `amountToBeFunded`). Resposta XML `<ApplicationStatusResponse>`.
- **Funding Queue UI (CT-08)**: `src/pages/origination/funding.page.ts` (navegação, filtros react-select,
  bulk "Send to FUNDED" = próxima transição). Superfície: `docs/knowledge-base/origination-funding-queue-page.md`.
- **Webhooks (CT-09)**: §28 (status gatilho incluem FUNDING; gate `use_webhook`; OAuth opcional; payload por
  SQL configurável por merchant).
- **Auto-move (CT-10)**: `merchant.is_signed_to_funding` (`src/data/merchant-config-contract.ts:59`
  `isSignedToFunding`; coluna DB `is_signed_to_funding`). Perfil `signedToFunding` em
  `src/support/merchant-configurator.ts`. Evidência: `docs/knowledge-base/origination-funding-queue-page.md`
  (lead 7218178, User Notes "SYSTEM changed status from SIGNED to FUNDING", Created from TIRE_AGENT_API).
