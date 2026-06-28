# API Clients Catalog — per-client method reference

> Extracted from SKILL.md. This is the detailed per-client catalog. For patterns and conventions, see [../SKILL.md](../SKILL.md).

## AccountClient — methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getNextReceivable` | `getNextReceivable(accountPk)` | GET `/uown/svc/getNextReceivable/{pk}` — returns `SvcReceivableResponse` |
| `getDueDateMoves` | `getDueDateMoves(accountPk, page?, size?)` | GET `/uown/svc/accounts/{pk}/due-date-moves` — returns `DueDateMovesPage` |
| `moveDueDatesByDays` | `moveDueDatesByDays(accountPk, moveNumberOfDays)` | POST `/uown/svc/moveDueDatesByDays/{pk}` — moves future due dates by N days; returns `DueDateMoveRecord` |
| `adjustNextDueDate` | `adjustNextDueDate(accountPk, body)` | POST `/uown/tms/v1/accounts/{pk}/next-due-date/adjustments` — TMS/IVR endpoint; uses **TMS API key** (`env.tmsApiKey`); returns `DueDateAdjustmentResponse` |
| `sendPodiumLink` | `sendPodiumLink(accountPk)` | POST `/uown/svc/accounts/{pk}/podium-link` — sends Podium review invite; returns `PodiumInvitationResponse` |
| `sendCustomerPortalLink` | `sendCustomerPortalLink(accountPk)` | POST `/uown/svc/sendCustomerPortalLink/{accountPk}` — sends Customer Portal Reminder email + SMS; returns `PortalInvitationResponse` |

**Response interfaces (`src/api/responses/account.response.ts`):**

| Interface | Fields |
|-----------|--------|
| `SvcReceivableResponse` | `pk`, `accountPk`, `dueDate`, `amount`, `status`, ... |
| `DueDateMoveRecord` | `pk`, `accountPk`, `moveNumberOfDays`, `isFpdChange`, `agent`, `rowCreatedTimestamp`, `nextReceivable` |
| `DueDateMovesPage` | `content: DueDateMoveRecord[]`, `totalElements`, `totalPages`, `number`, `size` |
| `NextDueDateAdjustmentBody` | `dueDate: string \| null`, `offset: number` |
| `DueDateAdjustmentResponse` | `accountPk: number`, `originalDueDate: string`, `newDueDate: string` |
| `PortalInvitationResponse` | `message?`, `errorMessage?` |

## MerchantClient — program activation/deactivation scheduling (2026-04-22)

| Method | Signature | Description |
|--------|-----------|-------------|
| `createOrUpdateProgram` | `createOrUpdateProgram(body: ProgramInfoBody): Promise<ApiResponse<MerchantProgram>>` | POST `/uown/createOrUpdateProgram` — creates or updates a program (creates when `programPk` is null/0). **Does NOT** associate program with merchant — chain with `addProgramsToMerchant` for creation flow |

**Key discoveries (Phase 5 Round 1):**
- DTO `ProgramInfo` has NO `merchantPk` field — merchant association is separate (use `addProgramsToMerchant(merchantPk, [programPk])`)
- Backend **always overwrites** `active` flag via `ProgramActivationUtils.isActiveOnDate(activationDate, deactivationDate, today)` — dates are Source of Truth
- Response is `MerchantProgram` wrapper: access via `response.body.programInfo.*` (not flat)
- Validation: `activationDate > deactivationDate` -> 400 `"activationDate must be before or equal to deactivationDate"` (backend actually returns 500 in qa2 — [CONFIRMADO] BUG-01)
- `states` and `allowedFrequencyOverride` are comma-separated String in Java, not arrays

**Request body:** `ProgramInfoBody` in `src/api/bodies/program-info.body.ts` + `buildProgramInfoBody(overrides)` builder
**Response:** `ProgramInfo` in `src/api/responses/merchant.response.ts` — extended with `activationDate`, `deactivationDate` + 16 financial fields (all optional, backward-compatible)

**Related scheduled task:**

| Endpoint | Notes |
|----------|-------|
| `api.scheduledTask.triggerScheduledTask('ProgramActivationDeactivationSweep')` | Canonical task name is `ProgramActivationDeactivationSweep` (NOT `merchantProgramActivation...` as initial scope assumed). Reconciles `is_active` based on dates via `MerchantProgramRepo.reconcileMerchantProgramActiveFlags` |

## MerchantClient — error log methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getSubmitApplicationErrorLogs` | `getSubmitApplicationErrorLogs(from, to, options?)` | GET `/uown/getSubmitApplicationErrorLogs` — from `uown_submit_application_error_log` (includes CC fields) |
| `getMerchantApiErrorLogs` | `getMerchantApiErrorLogs(from, to, options?)` | GET `/uown/getMerchantApiErrorLogs` — from `uown_merchant_api_error_log` (no CC fields) |

**Response interfaces (`src/api/responses/merchant.response.ts`):**

| Interface | Fields |
|-----------|--------|
| `SubmitApplicationErrorLog` | `pk`, `message`, `leadPk`, `merchantPk`, `refMerchantCode`, `merchantName`, `locationName`, `firstName`, `lastName`, `last4ssn`, `first5Cc`, `last4Cc`, `rowCreatedTimestamp`, `rowUpdatedTimestamp`, `tenantId`, `webUserId`, `agent` |
| `SubmitApplicationErrorLogSearchResults` | `logs: SubmitApplicationErrorLog[]`, `totalCount`, `moreResults` |
| `MerchantApiErrorLog` | same as above minus `first5Cc`/`last4Cc` |
| `MerchantApiErrorLogSearchResults` | `logs: MerchantApiErrorLog[]`, `totalCount`, `moreResults` |

## ApplicationClient — authorizeCreditCard + getMissingFields flow

| Method | Signature | Description |
|--------|-----------|-------------|
| `authorizeCreditCard` | `authorizeCreditCard(body: AuthorizeCreditCardBody)` | POST `/uown/los/authorizeCreditCard` — errors caught by `CustomExceptionHandler` and logged to `uown_submit_application_error_log`; **requires** `getMissingFields` first |

**Notes:**
- `AuthorizeCreditCardResponseBody` includes `creditCardTransactionPk?`, `authorizationCode`, `preAuthStatus`
- `SubmitApplicationOptions` includes `ccLastName?: string` — allows overriding CC cardholder last name independently from `lastName`; defaults to `lastName`

**Full flow (sendApplication -> submitApplication):**

```typescript
// 1. sendApplication -> get redirectUrl -> extract planId + shortCode
const sendRes = await api.application.sendApplication(merchant, applicant, order);
const option13 = sendRes.body!.paymentDetailsList!.find(p => p.termInMonths === 13);
const planId = extractPlanId(option13!.redirectUrl!); // e.g., 'WK13'
const shortCode = extractShortCode(option13!.redirectUrl!); // e.g., 'ABC123'

// 2. getMissingFields — REQUIRED: sets merchantProgramPk on the lead
await api.application.getMissingFields(shortCode, { planId });

// 3. submitApplication — planId selects the payment option
await api.application.submitApplication(leadPk, firstName, lastName, {
 planId, ccNumber: card.number, cvc: card.cvv, ccType: 'VISA', ccExp: card.expirationDate,
});
```

**CC last name match:** `CCCheckService.checkCCLastNameMatch` validates CC cardholder's last name matches customer's last name from `sendApplication`. Always reuse exact `firstName`/`lastName` from applicant data.

## BankAccountClient — bank account management

Location: `src/api/clients/bank-account.client.ts`. Host: `svc`. Fixture: `api.bankAccount`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createOrUpdateBankAccount` | `createOrUpdateBankAccount(body)` | POST `/uown/svc/createOrUpdateBankAccount` |
| `removeBankAccount` | `removeBankAccount(body)` | POST `/uown/svc/removeBankAccount` |
| `getBankAccounts` | `getBankAccounts(accountPk)` | GET `/uown/svc/getBankAccounts/{accountPk}` — returns all bank accounts |
| `createBankAccount` | helper | creates a bank account and returns its PK |
| `deleteBankAccount` | helper | removes a bank account by PK |

Bodies: `src/api/bodies/bank-account.body.ts` | Responses: `src/api/responses/bank-account.response.ts`

## ScheduledTaskClient — token sweep methods + getScheduledTaskByName + resumeScheduledTask

| Method | Signature | Description |
|--------|-----------|-------------|
| `refreshKountAccessTokenSweep` | `refreshKountAccessTokenSweep: Promise<ApiResponse<unknown>>` | POST `/uown/svc/refreshKountAccessTokenSweep` — triggers Kount token refresh sweep |
| `refreshGdsAccessTokenSweep` | `refreshGdsAccessTokenSweep: Promise<ApiResponse<unknown>>` | POST `/uown/svc/refreshGdsAccessTokenSweep` — triggers GDS token refresh sweep |
| `getScheduledTaskByName` | `getScheduledTaskByName(taskName)` | GET `/uown/svc/getScheduledTaskByName/{taskName}` — returns `ScheduledTaskMetadataResponseBody` |
| `resumeScheduledTask` | `resumeScheduledTask(taskName: string): Promise<ApiResponse<unknown>>` | POST `/uown/svc/resumeScheduledTask/{taskName}` — resumes a paused scheduled task by name |
| `createOrUpdateScheduledTask` | `createOrUpdateScheduledTask(body: CreateOrUpdateScheduledTaskBody): Promise<ApiResponse<ScheduledTaskMetadataResponseBody>>` | POST `/uown/svc/createOrUpdateScheduledTask` — UPSERTs the `ScheduledTask` JPA entity (same camelCase shape `getScheduledTaskByName` returns). Canonical use: read → mutate `sqlToPickAccounts` → write, to **narrow a sweep to one row** before triggering. **`pk` MUST be preserved** or the backend INSERTs a duplicate. Heavy suite-wide side effect → `try/finally` restore the original SQL; opt-in destructive CTs only. Added (live-verified sandbox 2026-06-21). Body: `CreateOrUpdateScheduledTaskBody extends ScheduledTaskMetadataResponseBody`; builder `buildCreateOrUpdateScheduledTaskBody(snapshot, overrides?)` (`src/api/bodies/scheduled-task.body.ts`) preserves `pk` + all columns, overriding only provided fields |

> **Pitfall (CT-06):** The `uown_scheduled_task` table columns are `scheduled_task_name` and `cron_trigger` — NOT `name` and `cron_expression`. Use these exact column names in any raw SQL against this table.

**Response interface:**

| Interface | Fields |
|-----------|--------|
| `ScheduledTaskMetadataResponseBody` | `scheduledTaskName`, `cronTrigger`, `sqlToPickAccounts`, `isActive`, `templateName`, plus other backend fields. **Backend Jackson serialization uses camelCase**, not snake_case. |

## SvcPhoneClient — opt-out / DNC / DNT flags

Location: `src/api/clients/svc-phone.client.ts`. Fixture: `api.svcPhone`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `updateOptOutAi` | `updateOptOutAi(body: UpdateOptOutAiBody)` | POST `/uown/svc/updateOptOutAi` — sets `optOutAi` flag; `optOutAiReason` optional |
| `updateDnc` | `updateDnc(body: UpdateDncBody)` | POST `/uown/svc/updateDnc` — sets `doNotCall` flag; `reasonForDnc` optional |
| `updateDnt` | `updateDnt(body: UpdateDntBody)` | POST `/uown/svc/updateDnt` — sets `doNotText` flag; `reasonForDnt` optional |

**Request bodies:**

| Interface | Fields |
|-----------|--------|
| `UpdateOptOutAiBody` | `phonePK: number`, `optOutAi: boolean`, `optOutAiReason?: string` |
| `UpdateDncBody` | `phonePK: number`, `doNotCall: boolean`, `reasonForDnc?: string` |
| `UpdateDntBody` | `phonePK: number`, `doNotText: boolean`, `reasonForDnt?: string` |

**Response interfaces:**

| Interface | Fields |
|-----------|--------|
| `PhoneInfoResponse` | `phonePK`, `customerPK`, `phoneType`, `areaCode`, `phoneNumber`, `phoneExtension`, `doNotCall`, `reasonForDnc`, `doNotText`, `reasonForDnt`, `lastContactTimestamp`, `optOutAi?`, `optOutAiReason?` |
| `SvPhoneResponse` | `pk: number`, `phoneInfo: PhoneInfoResponse` |

**Notes:** `optOutAi`/`optOutAiReason` are `null` until backend R1.50.0 deploys (Flyway migration V20260318174113).

## SvcContactClient — phone contact info updates

Location: `src/api/clients/svc-contact.client.ts`. Fixture: `api.svcContact`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getContactInfo` | `getContactInfo(accountPk)` | GET `/uown/svc/getPrimaryCustomerContactInfo/{accountPk}` — re-exports `ContactInformationResponse` |
| `createOrUpdateContactInfo` | `createOrUpdateContactInfo(body)` | POST `/uown/svc/createOrUpdatePrimaryCustomerContactInfo` |
| `sendVerificationCode` | `sendVerificationCode(phoneOrEmail, company?)` | POST `/uown/svc/sendVerificationCode/{phoneOrEmail}?company={company}` — `company` default `'UOWN'` |

**Request bodies (`src/api/bodies/svc-contact.body.ts`):**

| Interface | Fields |
|-----------|--------|
| `ContactPhoneInfo` | `phonePK: number` (capital K), `customerPK: number` (capital K), `phoneType: string`, `areaCode: string`, `phoneNumber: number` (Java Long), `phoneExtension?`, `doNotCall?`, `doNotText?` |
| `ContactEmailInfo` | `emailPK: number`, `customerPK: number`, `emailAddress: string`, `emailType: string`, `doNotEmail?: boolean` |
| `CreateOrUpdateContactInfoBody` | `accountPk: number`, `phones?: ContactPhoneInfo[]`, `emails?: ContactEmailInfo[]` |

**Notes:**
- Field names use **capital K** — `phonePK`, `customerPK`, `emailPK` (not `phonePk`)
- `phoneNumber` is `number` (Java Long), not `string`
- Fix confirmed: `sendVerificationCode` returns 200 after a phone is saved via `createOrUpdateContactInfo`

## CustomersClient — customer search v1/v2 with Origination fallback

Location: `src/api/clients/customers.client.ts`. Host: TMS (via private `postTms` helper). Fixture: `api.customers`.

Auth: uses `FIVE9_TMS_API_KEY` via `postTms` — same pattern as `AccountClient.adjustNextDueDate`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `searchCustomersV2` | `searchCustomersV2(body: FindCustomerBody)` | POST `/uown/tms/v2/customers/search` — new endpoint; returns `FindCustomerResponse`; includes `customerAccountDomain` (`'SERVICING'` or `'ORIGINATION'`) for fallback routing |
| `searchAccountsV1` | `searchAccountsV1(body: FindCustomerBody)` | POST `/uown/tms/v1/accounts/search` — **@Deprecated** legacy endpoint; returns `LegacyAccountSearchResponse` (opaque `Record<string, unknown>`) |

**When to use:** Use `searchCustomersV2` for all new tests. Use `searchAccountsV1` only to validate backward-compatibility or to test the deprecation boundary explicitly.

**Request body (`src/api/bodies/customer.body.ts`):**

| Interface | Fields |
|-----------|--------|
| `FindCustomerBody` | `phone?: string`, `last4SSN?: string`, `dob?: string` — all optional; at least one must be provided |

**Response interfaces (`src/api/responses/customer.response.ts`):**

| Interface | Fields |
|-----------|--------|
| `CustomerAccountDomain` | `'SERVICING' \| 'ORIGINATION'` |
| `FindCustomerResponse` | `leadPk`, `leadStatus`, `customerAccountDomain: CustomerAccountDomain`, `profile?: CustomerProfile`, plus backend-added fields |
| `CustomerProfile` | permissive shape with `[key: string]: unknown` escape hatch — fields vary by domain |
| `LegacyAccountSearchResponse` | `Record<string, unknown>` — opaque; /v1 shape not typed |

**Known backend issue:** `/v2/customers/search` on qa2 returns 500 (`leadStatus` SQL grammar error — column not projected by mapper). Confirmed bug in . Tests that run against qa2 should expect potential 500 and skip rather than fail.

## SvcEmailClient — contact info / email updates

Location: `src/api/clients/svc-email.client.ts`. Fixture: `api.svcEmail`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getContactInfo` | `getContactInfo(accountPk)` | GET `/uown/svc/getPrimaryCustomerContactInfo/{accountPk}` — returns full contact info (email list + phone list) |
| `createOrUpdateEmail` | `createOrUpdateEmail(body: CreateOrUpdateEmailBody)` | POST `/uown/svc/createOrUpdateEmail` |

**Request body:**

| Interface | Fields |
|-----------|--------|
| `CreateOrUpdateEmailBody` | `emailPK: number`, `customerPK: number`, `emailAddress: string`, `emailType: string` (`'PRIMARY'`, `'SECONDARY'`, `'WORK'`, `'OTHER'`), `doNotEmail: boolean`, `reasonForDnc?: string` |

**Response interfaces:**

| Interface | Fields |
|-----------|--------|
| `EmailInfoResponse` | `emailPK`, `customerPK`, `emailAddress`, `emailType`, `doNotEmail`, `reasonForDnc?` |
| `SvEmailResponse` | `pk: number`, `emailInfo: EmailInfoResponse` |
| `SvEmailUpdateResponse` | alias for `SvEmailResponse` |
| `SvPhoneInContactResponse` | `pk: number`, `phoneInfo: PhoneInfoResponse` |
| `ContactInformationResponse` | `accountPk: number`, `leadPk?: number`, `emailList: SvEmailResponse[]`, `phoneList: SvPhoneInContactResponse[]` |

**Notes:** `ContactInformationResponse` returns BOTH email and phone lists in a single call — prefer over separate phone/email lookups when both are needed.

## GowSignTemplateClient — template CRUD

Location: `src/api/clients/gowsign-template.client.ts`. Host: `svc`. Fixture: `api.gowSignTemplate`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createTemplate` | `createTemplate(body: GowSignTemplateCreateBody): Promise<ApiResponse<GowSignTemplate>>` | POST `/uown/svc/gowsign-templates` — creates a new GowSign template |
| `getTemplate` | `getTemplate(templateId: string): Promise<ApiResponse<GowSignTemplate>>` | GET `/uown/svc/gowsign-templates/{templateId}` — retrieves a template by ID |
| `updateTemplate` | `updateTemplate(templateId: string, body: GowSignTemplatePatchBody): Promise<ApiResponse<GowSignTemplate>>` | PATCH `/uown/svc/gowsign-templates/{templateId}` — partial update |
| `deleteTemplate` | `deleteTemplate(templateId: string): Promise<ApiResponse<unknown>>` | DELETE `/uown/svc/gowsign-templates/{templateId}` |

**Bodies (`src/api/bodies/gowsign-template.body.ts`):**

| Interface | Fields |
|-----------|--------|
| `GowSignTemplateCreateBody` | `templateId: string`, `name: string`, `state: string`, `clientType?: string` |
| `GowSignTemplatePatchBody` | `name?: string`, `state?: string`, `clientType?: string` |

**Response interface (`src/api/responses/gowsign-template.response.ts`):**

| Interface | Fields |
|-----------|--------|
| `GowSignTemplate` | `pk: number`, `templateId: string`, `name: string`, `state: string`, `clientType: string \| null` |

**Template routing logic:** Backend selects template per `(state, clientType)`. When `clientType` is NULL on a template, it acts as the default fallback for that state. When a lead's merchant has a specific `clientType`, the backend prefers templates matching that `clientType` over the NULL-fallback. JSON path for selected template in esign request: `request.document.templateId` (verified: `CreateRequestBuilder.java:90-92` + `DocumentDispatchService.java:67-77`).

## Header-versioned endpoints (WI-525, 2026-05-20)

Some `svc` controllers gate behavior by header instead of URL path — most notably `LosExternalMerchantController` (base `/uown/los/merchant/applications`), which **requires `X-API-Version: 2`** at the controller class level. Calls without the header are rejected before reaching the controller, so the AOP audit log row is also missing — the request looks invisible.

**Canonical pattern (overload with optional version):** expose `apiVersion` as a defaulted parameter with `null` meaning "omit", so callers can opt-in to the version that matters and opt-out for negative tests (e.g. forcing a 4xx by stripping the header).

```typescript
async searchApplicationStatus(
 body?: Record<string, unknown>,
 apiVersion: string | null = '2',
): Promise<ApiResponse<LosPartnerApplicationResponse>> {
 const extraHeaders: Record<string, string> = {};
 if (apiVersion !== null) {
 extraHeaders['X-API-Version'] = apiVersion;
 }
 return this.postWithOverride<LosPartnerApplicationResponse>(
 '/uown/los/merchant/applications/search',
 body ?? {},
 extraHeaders,
);
}
```

**Canonical example in repo:** [`src/api/clients/los-partner-application.client.ts`](../../../../src/api/clients/los-partner-application.client.ts) — `searchApplicationStatus` (added WI-525). Apply the same overload shape when wrapping other header-versioned endpoints.

> See [[application-lifecycle]] pitfall #31 for the auth model of `LosExternalMerchantController` (body-field credentials, not bearer token).

## SvcPayoffClient — getProrateAmount (added 2026-06-26)

| Method | Signature | Description |
|--------|-----------|-------------|
| `getProrateAmount` | `getProrateAmount(accountPk: number, onDate: string): Promise<ApiResponse<number>>` | GET `/uown/svc/getProrateAmount/{accountPk}?onDate={YYYY-MM-DD}` — returns the prorated payoff amount as a plain `number` (USD). `onDate` must be ISO format `YYYY-MM-DD`. **Read-only** — does NOT create an `uown_sv_activity_log` entry. Cross-check oracle for CT-02/CT-03 (displayed value must match response within $0.01). |

**Usage note:** Always convert the MM/DD/YYYY displayed date to `YYYY-MM-DD` before calling. Float comparison: `Math.abs(displayed - api) < 0.01`. No body needed — pure GET. Confirmed sandbox account 17307: `?onDate=2026-07-26` → `705.39`; `?onDate=2026-08-25` → `1410.77`.

---

## SvcPayoffClient — response extension (2026-05-22)

**Response interface extension:** `src/api/responses/svc-payoff.response.ts`

Two new optional fields added to the payoff/servicing-info response shape:

| Field | Type | Description |
|-------|------|-------------|
| `settlementAmount` | `number \| undefined` | Settlement Amount in USD — computed by backend `getSettlementAmount.sql` (sql_name `GETSETTLEMENTAMOUNT`). Present when account is delinquent and eligible for a settlement offer. Absent or `undefined` when no settlement offer applies (e.g. not delinquent, rating B, CANCELLED). |
| `settlementAmountBreakdown` | `(string[] \| null)[] \| undefined` | Ordered breakdown rows as `[label, value]` string pairs. Backend returns an array of 2-element arrays. Null elements can appear for rows with missing data (defensive parse required). |

**Usage notes:**
- Both fields are optional — always guard with `?? undefined` before asserting.
- `settlementAmount` is the oracle to compare against UI rendered value (formatted as `$X,XXX.XX`).
- `settlementAmountBreakdown` mirrors what `SettlementBreakdownModal.getBreakdownRows` reads from the DOM — divergence between API and UI is a rendering bug, not a data bug.
- `calculateSettlement` from `settlement.helpers.ts` is the independent correctness oracle — compare all three: API response, UI modal, helper formula.

## TmsAuditClient — full method catalog (updated 2026-06-28 vs readme.io)

Location: `src/api/clients/tms-audit.client.ts`. Host: TMS (auth: `env.tmsApiKey` via `tmsHeaders`). Fixture: `api.tmsAudit`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAccountSummary` | `getAccountSummary(accountId)` | GET `/uown/tms/v1/accounts/{id}/summary` — full `TmsAccountSummaryResponse` including balance/status/EPO fields. |
| `getAccountSummaryLegacy` | `getAccountSummaryLegacy(accountPk)` | GET `/uown/tms/getAccountSummary/{pk}` — legacy `TmsController`. Same shape. Backward-compat CTs only. |
| `getPayoffAmount` | `getPayoffAmount(accountId)` | GET `/uown/tms/v1/accounts/{id}/payoff` — returns `TmsPayoffResponse { accountPk, amount }`. |
| `getPayoffAmountLegacy` | `getPayoffAmountLegacy(accountPk)` | GET `/uown/tms/getPayoffAmount/{pk}` — legacy endpoint. |
| `getBankAccounts` | `getBankAccounts(accountId)` | GET `/uown/tms/v1/accounts/{id}/payment-methods/bank-accounts` — returns `TmsBankAccountOnFileItem[]`. |
| `getCreditCards` | `getCreditCards(accountId)` | GET `/uown/tms/v1/accounts/{id}/payment-methods/credit-cards` — returns `TmsCreditCardOnFileItem[]`. |
| `getAutopayCreditCard` | `getAutopayCreditCard(accountId)` | GET `/uown/tms/v1/accounts/{id}/payment-methods/credit-cards/autopay` — single autopay card or 404. |
| `getBankAccountsLegacy` | `getBankAccountsLegacy(accountPk)` | GET `/uown/tms/getBankAccounts/{pk}` — legacy. |
| `moveDueDates` | `moveDueDates(accountId, moveNumberOfDays, fromDueDate?)` | POST `/uown/tms/v1/accounts/{id}/due-dates/move?moveNumberOfDays=N` — external TMS endpoint (no body; query params only). Different from `AccountClient.moveDueDatesByDays` (SVC internal). Returns `TmsMoveDueDatesResponse`. |
| `sendPayNearMePaymentLink` | `sendPayNearMePaymentLink(accountId, deliveryChannel[], amountOverride?)` | POST `/uown/tms/v1/accounts/{id}/paynearme/send` — query params only (`deliveryChannel=SMS\|EMAIL`). Returns `TmsPayNearMeDeliveryResult[]`. |
| `updateContactPreferences` | `updateContactPreferences(accountId, body: TmsContactPreferencesBody)` | POST `/uown/tms/v1/accounts/{id}/contactPreferences` — TCPA/AI opt-out. Returns `TmsContactPreferencesResponse`. |
| `addActivityLog` | `addActivityLog(accountId, body: AddActivityLogBody)` | POST `/uown/tms/v1/accounts/{id}/activity-logs` — appends to `uown_sv_activity_log`. |
| `addLogNoteLegacy` | `addLogNoteLegacy(body: AddLogNoteLegacyBody)` | POST `/uown/tms/addLogNote` — legacy. |

**Response interfaces (`src/api/responses/tms-audit.response.ts`):**

| Interface | Key fields |
|-----------|-----------|
| `TmsAccountSummaryResponse` | `accountPk`, `customerFullName`, `accountStatus`, `nextPaymentDueAmount`, `nextDueDate`, `contractBalance`, `pastDueAmount`, `epoBalance`, `customerPaymentFrequency`, `eligibleForPromotionalPayOff`, `numberOfDueDateMoves`, `lastScheduleMovedDate` |
| `TmsBankAccountOnFileItem` | `id`, `maskedAccountNumber`, `maskedRoutingNumber`, `bankName`, `bankAccountType` (CHECKING/SAVINGS), `isActive`, `lastUsedDate` |
| `TmsCreditCardOnFileItem` | `id`, `maskedCardNumber`, `cardType`, `expirationDate`, `isAutoPay`, `isValidCard`, `lastUsedDate` |
| `TmsPayoffResponse` | `accountPk`, `amount` |
| `TmsMoveDueDatesResponse` | `accountPk`, `adjustedFromDate`, `offset`, `adjustedToDate`, `adjustedDues` |
| `TmsPayNearMeDeliveryResult` | `smartLink`, `deliveryChannel`, `recipientAddress`, `deliveryReferenceId`, `amountDue` |
| `TmsContactPreferencesResponse` | `accountPk`, `phoneNumber`, `doNotCall`, `doNotText`, `optOutAi`, `optOutAiReason` |

**Body interfaces (`src/api/bodies/tms-audit.body.ts`):**

| Interface | Fields |
|-----------|--------|
| `AddActivityLogBody` | `uuid: string`, `logType?: string`, `logNote: string` |
| `AddLogNoteLegacyBody` | `uuid: string`, `accountPk: number\|string`, `logType?: string`, `logNote: string` |
| `TmsContactPreferencesBody` | `phoneNumber: number`, `doNotCall?`, `doNotText?`, `optOutAi?`, `optOutReason?` |

**Key field notes:**
- `lastScheduleMovedDate` spelling is canonical (trailing "d") — per dev Marcos 2026-05-22; do NOT "fix".
- `lastScheduleMovedDate` serializes as Java `LocalDateTime` without TZ offset. Compare against DB via `expectWithinTzWindow`.
- `moveDueDates` vs `AccountClient.moveDueDatesByDays`: the former hits `/uown/tms/v1/...` (Five9/IVR external surface, TMS key); the latter hits `/uown/svc/...` (internal, LOS key). Both mutate future receivables.
- `sendPayNearMePaymentLink`: all parameters go in the URL query string — there is no request body.

## TmsPaymentClient — payment endpoints (svc#509, updated 2026-06-28 vs readme.io)

Location: `src/api/clients/tms-payment.client.ts`. Host: TMS (auth: `env.tmsApiKey`). Fixture: `api.tmsPayment`.

Auth: `injectAuth: false / injectApiKey: false` — TMS key injected per-request via `tmsHeaders` / `postRawTms`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `postCreditCardPayment` | `postCreditCardPayment(accountId, body: TmsCreditCardPaymentRequest)` | POST `/uown/tms/v1/accounts/{id}/payments/credit-card` — typed happy-path. |
| `postCreditCardPaymentRaw` | `postCreditCardPaymentRaw(accountId, body: unknown)` | Same URL, opaque body — for CT-7/CT-8a/CT-8b negatives. |
| `postAchPayment` | `postAchPayment(accountId, body: TmsAchPaymentRequest)` | POST `/uown/tms/v1/accounts/{id}/payments/ach` — typed happy-path. |
| `postAchPaymentRaw` | `postAchPaymentRaw(accountId, body: unknown)` | Same URL, opaque body — for CT-9 negatives. |
| `postPaymentArrangement` | `postPaymentArrangement(accountId, body: TmsLegacyPaymentArrangementRequest)` | POST `/uown/tms/v1/accounts/{id}/paymentArrangements` — **legacy shape** (post-revert commit 56b878299). New shape (`creditLines[]`/`achLines[]`) = HTTP 200 + 0 transactions (silent no-op; CT-10). |
| `postPaymentArrangementRaw` | `postPaymentArrangementRaw(accountId, body: unknown)` | Same URL, opaque — CT-10. |

**Request body interfaces (`src/api/bodies/tms-payment.body.ts`):**

| Interface | Key fields |
|-----------|-----------|
| `TmsCreditCardPaymentRequest` | `amount`, `postingDate`, `allocationStrategy?` (DEFAULT/REGULAR_RECEIVABLES/EPO_ONLY), `chargeFee?` (default true), `comment?`, `card?: TmsCardDetails` |
| `TmsCardDetails` | `creditCardId?` OR keyed: `ccNumber`, `ccExp` (MM/YY), `cvc`, `ccFirstName?`, `ccLastName?`, `billingAddress?`, `autoPay?`, `exclusiveCardMode?` |
| `TmsAchPaymentRequest` | `amount`, `postingDate`, `allocationStrategy?`, `comments?`, `bankAccount?: TmsBankAccountDetails` |
| `TmsBankAccountDetails` | `bankAccountId?` OR keyed: `routingNumber`, `accountNumber`, `bankName?`, `accountHolderFirstName?`, `accountHolderLastName?`, `designateAutoPay?`, `exclusiveBankInstrument?` |
| `TmsLegacyPaymentArrangementRequest` | `creditCardTransactions?: TmsLegacyCcLine[]`, `achPayments?: TmsLegacyAchLine[]`, `arrangementType?`, `paymentArrangement?` |

**Wire-contract pitfalls (svc#509):**
- `card` field on CC request accepts both `"card"` and `"ccInfo"` aliases (`@JsonAlias`). Internal `CardDetails` fields have NO aliases — sending `creditCardPk` = silent ignore + 400.
- `comments` (ACH) vs `comment` (CC) — note the plural; swapping causes a silent null (OBSERVATION-3).
- `chargeFee` defaults to `true` server-side (`@Builder.Default`) — omitting it is safe; sending `false` is a fee-waiver.
- `exclusiveCardMode` / `exclusiveBankInstrument` — `@AssertTrue` bean-validation; the server evaluates, callers rarely send explicitly.

**Response interfaces (`src/api/responses/tms-payment.response.ts`):**

| Interface | Key fields |
|-----------|-----------|
| `TmsCreditCardPaymentResponseBody` | `creditCardTransactionPk?`, `gatewayTransactionId?`, `ccNumber?`, `error?`, `amount?`, `status?`, `postingDate?` |
| `TmsAchPaymentResponseBody` | `id?` (wire), `achPaymentPk?` (alias), `amount?`, `status?`, `customerFirstName?`, `customerLastName?`, `bankAccountType?`, `achProcessType?`, `returnCode?`, `returnCodeDescription?`, `settlementId?`, `settlementTimestamp?`, `maskedAccountNumber?`, `maskedRoutingNumber?` |
| `TmsPaymentArrangementResponseBody` | `paymentArrangementPk?`, `creditCardTransactions?`, `achPayments?` |
| `TmsValidationErrorBody` | `status?`, `error?`, `message?`, `errors[]?`, `timestamp?`, `path?` |

**Builders:**

| Function | Purpose |
|----------|---------|
| `buildTmsCcOnFileBody(opts)` | CC payment with card-on-file (`creditCardId`) |
| `buildTmsCcKeyedBody(opts)` | CC payment with PAN + exp + cvc |
| `buildTmsAchKeyedBody(opts)` | ACH with keyed routing + account number |
| `buildTmsAchOnFileBody(opts)` | ACH with bank-account-on-file (`bankAccountId`) |

## AMS Merchants endpoint — GET /uown/merchants (2026-05-22)

**Endpoint:** `GET /uown/merchants?page=&size=&search=&isActive=`

This endpoint replaced the legacy `POST /uown/getMerchantsByCriteria` for the AMS Merchants page (MR!1430, R1.52.0). It is served by `AmsController`, NOT `LosController`.

**Query parameters:**

| Param | Type | Behavior |
|-------|------|----------|
| `search` | string | Case-insensitive `LIKE %search%` over 6 columns: `refMerchantCode`, `merchantName`, `locationName`, `legalName`, `zipCode`, `primaryContactName`. `city` and `state` are NOT search targets. |
| `isActive` | boolean | `true` -> active only; `false` -> inactive only; omit -> all. Rows with `is_deleted=true` are always excluded. |
| `page` | integer | Spring page index (0-based) |
| `size` | integer | Page size |
| `sort` | string | Default sort: `refMerchantCode ASC` |

**Response shape — `Page<BasicMerchantInfo>` (Spring envelope):**

```json
{
 "content": [
 {
 "merchantPk": 123,
 "rowCreatedTimestamp": "...",
 "rowUpdatedTimestamp": "...",
 "merchantName": "FifthAveFurnitureNY",
 "merchantLocation": "New York",
 "merchantCode": "KS3015",
 "acceptsNewApps": true,
 "clientType": "KORNERSTONE",
 "state": "NY",
 "city": "New York",
 "isActive": true,
 "lastAccessTime": null
 }
 ],
 "totalElements": 1124,
 "totalPages": 113,
 "number": 0,
 "size": 10
}
```

**Critical field name mapping (JPA query columns differ from response JSON):**

| Response JSON field | DB column | Note |
|--------------------|-----------|------|
| `merchantLocation` | `location_name` | NOT `locationName` in the JSON |
| `merchantCode` | `ref_merchant_code` | NOT `refMerchantCode` in the JSON |
| `lastAccessTime` | `last_access_time` | Enriched by `searchMerchants` — NULL when no recorded login |

**Known observation (F-004 — [OBSERVACAO]):** `lastAccessTime` is `null` for all merchants tested in qa1 (2026-05-22). Not confirmed as a bug — could be legitimate (no agent has logged in to any merchant portal in qa1). Requires Marcos Silvano confirmation (AC-6 pending).

**Legacy endpoint:** `POST /uown/getMerchantsByCriteria` is preserved for non-AMS consumers (e.g., Origination `/merchant` page) but no longer accepts `includeLastLogin` and does NOT enrich `lastAccessTime` (intentional per MR!1430).

**Sibling endpoint preserved:** `GET /uown/getAllAvailableMerchants` (moved from `LosController` to `AmsController` — path unchanged at `/uown/getAllAvailableMerchants`). The old path `/uown/los/getAllAvailableMerchants` no longer exists. Used by AMS Users "Add User" modal (lazy-loaded on click, not on page load — per MR!170).

---

**qa2 template seed snapshot (as of 2026-05-06) — state=CA:**

| pk | template_id | name | client_type |
|----|-------------|------|-------------|
| 1 | `lkdu73w7dctuj7kxhc6omwvf` | California Lease Agreement | NULL (default fallback) |
| 2 | `mu97ag8wkchj1icvn5amz5s6` | CA_2025_SAC_jewelry | `'DANIELS_JEWELERS,JEWELRY'` |

## SimpleSearchClient — (added 2026-05-24)

- **Path:** `src/api/clients/simple-search.client.ts`
- **Purpose:** Wraps the two simple-search endpoints audited by : `POST /uown/los/simpleSearch/{term}` (Origination) and `GET /uown/svc/simpleSearch/{term}` (Servicing regression).

| Method | Signature | Description |
|--------|-----------|-------------|
| `searchLos` | `searchLos(input: string, opts?: SearchLosOptions): Promise<ApiResponse<SimpleSearchResponseBody>>` | POST `/uown/los/simpleSearch/{input}` — LOS multi-tenant search with `searchType` in query-string and `merchantRefCodes` in body |
| `searchSvc` | `searchSvc(input: string, opts?: SearchSvcOptions): Promise<ApiResponse<...>>` | GET `/uown/svc/simpleSearch/{input}` — Servicing regression endpoint; no body (query-string only) |

**Special options in `SearchLosOptions`:**

| Option | Default | Purpose |
|--------|---------|---------|
| `searchType` | `undefined` | Omit/null -> backend pre-detect (FreeText). String -> `?searchType=X` in query-string |
| `sendBody` | `true` | `false` -> sends POST without body (covers API-EDGE-01 anomaly #4) |
| `contentType` | inherited | `null` -> removes Content-Type header entirely (covers API-EDGE-02) |
| `rawBody` | `undefined` | Sends a raw string as body (covers API-EDGE-03 invalid JSON) |

**Critical contract rules (see Pitfall #54):**
- LOS endpoint REQUIRES BFF session cookie (`merchant.sid`) when called via `origination-{env}.uownleasing.com`. Use `host='svc'` bypass or browser `page.evaluate(fetch(..., {credentials:'include'}))`.
- `pageNumber`/`maxResults` go in **query string** (they are `@RequestParam` in Spring), NOT in the body.
- Response is a **WRAPPER** `{ searchResults: [...], count, moreResults }`, NOT a flat array. Parser will return `body=[]` silently if declared as flat.
- `searchType=null` triggers FreeText pre-detect path.

**When NOT to use:** Do not call `searchLos` via the BFF host without a valid session — API key alone yields 401 from `MerchantCodeAspect`. Use the svc bypass or UI page context instead.
