# Application Lifecycle - Canonical Sequence Detail

> Para visao geral e regras, ver [SKILL.md](../SKILL.md).

---

## Sequencia completa (happy path end-to-end)

Para criar uma conta partindo do zero ate `ACTIVE` (ou `SETTLED_IN_FULL` via SETTLEMENT):

| # | Chamada | Resultado | Exige |
|---|---------|-----------|-------|
| 1 | `buildTestData({ env, state, merchant, orderTotal })` | `applicant.email` unico, SSN aprovado | NAO passar `emailOverride` (pitfall #1) |
| 2 | `api.application.sendApplication(merchant, applicant, order)` | retorna `leadPk`, `leadUuid`, `paymentDetailsList` | Para Kornerstone: `body.mainBankRoutingNumber` + `body.mainBankAccountNumber` obrigatorios (pitfall #5) |
| 3 | `sleep(5000)` + `api.application.getApplicationStatus(merchant, leadUuid)` | status contem `"approved"` + `approvedAmount > 0` | SSN nao-terminando-em-9 + merchant nao bloqueado no estado |
| 4 | `api.invoice.sendInvoice(merchant, leadUuid, { orderTotal })` | retorna `paymentDetailsList[0].redirectUrl` com `shortCode` + `planId` | sendApplication aprovado antes |
| 5 | Extrair `shortCode` + `planId` de `invoiceResp.body.paymentDetailsList[0].redirectUrl` | `shortCode = url.pathname.split('/')[1]`, `planId = url.searchParams.get('planId')` | - |
| 6 | `api.application.getMissingFields(shortCode, { planId })` | seta `merchantProgramPk` no lead | Passo 5 ok |
| 7 | `api.application.submitApplication(leadPk, firstName, lastName, { planId, ccNumber, ccType, ccExp, cvc })` | lead transita para CC_AUTH_PASSED/CONTRACT_CREATED | **ccNumber = `TEST_CARDS.MASTERCARD_APPROVED.number` (BIN 5500)** (pitfall #3) |
| 8 | `api.lead.changeLeadStatus(merchant, leadPk, 'SIGNED', 'Automated')` | lead - SIGNED | submitApplication ok |
| 9 | `api.settlement.settleApplication(merchant, leadUuid)` | lead - SETTLED | Lead em SIGNED |
| 10 | `sleep(3000)` + `api.lead.updateFundingStatus([leadPk], 'FUNDING')` | lead - FUNDING | Lead em SETTLED |
| 11 | `api.lead.updateFundingStatus([leadPk], 'FUNDED')` | lead - FUNDED, cria `uown_sv_account` | Lead em FUNDING |
| 12 | `db.waitForAccountByLeadPk(leadPk, 60_000)` | retorna `accountPk` | Passo 11 ok |
| 13 | `db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000)` | account ACTIVE | Account criado |

## Para chegar em `SETTLED_IN_FULL` (email de Settled in Full depende disso)

| # | Chamada | Resultado |
|---|---------|-----------|
| 14 | `api.paymentArrangement.makeCreditCardPayments(buildCcArrangementBody({ accountPk, arrangementType: 'SETTLEMENT', ccNumber, ccExp, cvc, installments }))` | payment processa sincrono (CC), listener transiciona account |
| 15 | `db.waitForPaymentArrangementStatus(accountPk, 'SUCCESS', 60_000)` | arrangement SUCCESS |
| 16 | `db.waitForAccountStatus(accountPk, 'SETTLED_IN_FULL', 60_000)` | account SETTLED_IN_FULL + `uown_sv_payment(PAID)` populado |

## Para trocar primary email (testes de email template)

| # | Chamada | Quando |
|---|---------|--------|
| 17 | `api.svcEmail.getContactInfo(accountPk)` - extrair `emailPK` + `customerPK` da entry PRIMARY | Apos ACTIVE (ou SETTLED_IN_FULL) |
| 18 | `api.svcEmail.createOrUpdateEmail({ emailPK, customerPK, emailAddress: INBOX, emailType: 'PRIMARY', doNotEmail: false })` | - |

---

## Helpers que ja implementam a sequencia completa

| Helper | Completo ate | Notas |
|--------|--------------|-------|
| `setupApplicationViaApi` (`src/helpers/api-setup.helpers.ts`) | Passo 7 (submitApplication via `submitPaymentInfoViaApi: true`) | Inclui `getMissingFields` - pode encadear `driveLeadToFunding` depois |
| `createPreQualifiedApplication` (idem) | Passo 7 | Agora inclui `getMissingFields`. Aceita `bankData` para Kornerstone |
| `driveLeadToSigned(api, merchant, ctx)` | Passo 8 | Chama `changeLeadStatus('SIGNED')` |
| `driveLeadToFunding(api, merchant, ctx)` | Passo 10 | Inclui SIGNED - settle - FUNDING |

## Para ir de FUNDING - FUNDED - ACTIVE - SETTLED_IN_FULL

Encadear manualmente no spec:
```typescript
await driveLeadToFunding(api, merchant, ctx); // passos 8-10
const fundedResp = await api.lead.updateFundingStatus([leadPk], 'FUNDED'); // passo 11
const accountPk = await db.waitForAccountByLeadPk(leadPk, 60_000); // passo 12
await db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000); // passo 13
// Para SETTLED_IN_FULL:
const ccBody = buildCcArrangementBody({ accountPk, arrangementType: 'SETTLEMENT', ... });
await api.paymentArrangement.makeCreditCardPayments(ccBody); // passo 14
await db.waitForPaymentArrangementStatus(accountPk, 'SUCCESS', 60_000); // passo 15
await db.waitForAccountStatus(accountPk, 'SETTLED_IN_FULL', 60_000); // passo 16
```
