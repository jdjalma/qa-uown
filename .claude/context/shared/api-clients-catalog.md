<!-- PT-BR: Catálogo de API clients e métodos por task/domínio. Consolidado de e2e-agent-responsibilities.md §5 (API parts). -->

# API Clients Catalog

> Catálogo de clients em `src/api/clients/` com métodos adicionados por task. Todos extendem `BaseClient`.

## Convenção

- **Location:** `src/api/clients/` — todos extendem `BaseClient`
- **Bodies:** `src/api/bodies/` — typed request bodies
- **Responses:** `src/api/responses/` — typed response interfaces
- **Templates:** `src/fixtures/api-templates/` — JSON templates for request bodies
- **Selectors:** (não é de API, mas importante) — centralizados em `src/selectors/common.selectors.ts`, typed em `src/selectors/selector.types.ts`. **Nunca** hardcode selectors em tests.

## AccountClient — methods (Task #502, #442, #448, #490)

| Method | Signature | Description |
|--------|-----------|-------------|
| `getNextReceivable` | `getNextReceivable(accountPk)` | GET `/uown/svc/getNextReceivable/{pk}` — returns `SvcReceivableResponse` |
| `getDueDateMoves` | `getDueDateMoves(accountPk, page?, size?)` | GET `/uown/svc/accounts/{pk}/due-date-moves` — returns `DueDateMovesPage` |
| `moveDueDatesByDays` | `moveDueDatesByDays(accountPk, moveNumberOfDays)` | POST `/uown/svc/moveDueDatesByDays/{pk}` — moves future due dates by N days; returns `DueDateMoveRecord` |
| `adjustNextDueDate` | `adjustNextDueDate(accountPk, body)` | POST `/uown/tms/v1/accounts/{pk}/next-due-date/adjustments` — TMS/IVR endpoint; uses **TMS API key** (`env.tmsApiKey`); returns `DueDateAdjustmentResponse` (Task #448) |
| `sendPodiumLink` | `sendPodiumLink(accountPk)` | POST `/uown/svc/accounts/{pk}/podium-link` — sends Podium review invite; returns `PodiumInvitationResponse` (Task #442) |
| `sendCustomerPortalLink` | `sendCustomerPortalLink(accountPk)` | POST `/uown/svc/sendCustomerPortalLink/{accountPk}` — sends Customer Portal Reminder email + SMS; returns `PortalInvitationResponse` (Task #490) |

**Response interfaces (`src/api/responses/account.response.ts`):**

| Interface | Fields |
|-----------|--------|
| `SvcReceivableResponse` | `pk`, `accountPk`, `dueDate`, `amount`, `status`, … |
| `DueDateMoveRecord` | `pk`, `accountPk`, `moveNumberOfDays`, `isFpdChange`, `agent`, `rowCreatedTimestamp`, `nextReceivable` |
| `DueDateMovesPage` | `content: DueDateMoveRecord[]`, `totalElements`, `totalPages`, `number`, `size` |
| `NextDueDateAdjustmentBody` | `dueDate: string \| null`, `offset: number` (Task #448) |
| `DueDateAdjustmentResponse` | `accountPk: number`, `originalDueDate: string`, `newDueDate: string` (Task #448) |
| `PortalInvitationResponse` | `message?`, `errorMessage?` (Task #490) |

## MerchantClient — program activation/deactivation scheduling (scheduleProgramActivationDeactivationDates, 2026-04-22)

| Method | Signature | Description |
|--------|-----------|-------------|
| `createOrUpdateProgram` | `createOrUpdateProgram(body: ProgramInfoBody): Promise<ApiResponse<MerchantProgram>>` | POST `/uown/createOrUpdateProgram` — creates or updates a program (creates when `programPk` is null/0). **Does NOT** associate program with merchant — chain with `addProgramsToMerchant` for creation flow |

**Key discoveries (Phase 5 Round 1):**
- DTO `ProgramInfo` has NO `merchantPk` field — merchant association is separate (use `addProgramsToMerchant(merchantPk, [programPk])`)
- Backend **always overwrites** `active` flag via `ProgramActivationUtils.isActiveOnDate(activationDate, deactivationDate, today)` — dates are Source of Truth
- Response is `MerchantProgram` wrapper: access via `response.body.programInfo.*` (not flat)
- Validation: `activationDate > deactivationDate` → 400 `"activationDate must be before or equal to deactivationDate"` (backend actually returns 500 in qa2 — [CONFIRMADO] BUG-01)
- `states` and `allowedFrequencyOverride` are comma-separated String in Java, not arrays

**Request body:** `ProgramInfoBody` in `src/api/bodies/program-info.body.ts` + `buildProgramInfoBody(overrides)` builder
**Response:** `ProgramInfo` in `src/api/responses/merchant.response.ts` — extended with `activationDate`, `deactivationDate` + 16 financial fields (all optional, backward-compatible)

**Related scheduled task:**

| Endpoint | Notes |
|----------|-------|
| `api.scheduledTask.triggerScheduledTask('ProgramActivationDeactivationSweep')` | Canonical task name is `ProgramActivationDeactivationSweep` (NOT `merchantProgramActivation...` as initial scope assumed). Reconciles `is_active` based on dates via `MerchantProgramRepo.reconcileMerchantProgramActiveFlags` |

## MerchantClient — error log methods (Task #1240)

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

## ApplicationClient — authorizeCreditCard (Task #1240) + getMissingFields flow (Task #1242)

| Method | Signature | Description |
|--------|-----------|-------------|
| `authorizeCreditCard` | `authorizeCreditCard(body: AuthorizeCreditCardBody)` | POST `/uown/los/authorizeCreditCard` — errors caught by `CustomExceptionHandler` and logged to `uown_submit_application_error_log`; **requires** `getMissingFields` first |

**Notes:**
- `AuthorizeCreditCardResponseBody` includes `creditCardTransactionPk?`, `authorizationCode`, `preAuthStatus`
- `SubmitApplicationOptions` includes `ccLastName?: string` — allows overriding CC cardholder last name independently from `lastName`; defaults to `lastName`

**Full flow (sendApplication → submitApplication):**

```typescript
// 1. sendApplication → get redirectUrl → extract planId + shortCode
const sendRes = await api.application.sendApplication(merchant, applicant, order);
const option13 = sendRes.body!.paymentDetailsList!.find(p => p.termInMonths === 13);
const planId = extractPlanId(option13!.redirectUrl!);     // e.g., 'WK13'
const shortCode = extractShortCode(option13!.redirectUrl!); // e.g., 'ABC123'

// 2. getMissingFields — REQUIRED: sets merchantProgramPk on the lead
await api.application.getMissingFields(shortCode, { planId });

// 3. submitApplication — planId selects the payment option
await api.application.submitApplication(leadPk, firstName, lastName, {
  planId, ccNumber: card.number, cvc: card.cvv, ccType: 'VISA', ccExp: card.expirationDate,
});
```

**CC last name match:** `CCCheckService.checkCCLastNameMatch` validates CC cardholder's last name matches customer's last name from `sendApplication`. Always reuse exact `firstName`/`lastName` from applicant data.

## BankAccountClient — bank account management (Task #497)

Location: `src/api/clients/bank-account.client.ts`. Host: `svc`. Fixture: `api.bankAccount`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createOrUpdateBankAccount` | `createOrUpdateBankAccount(body)` | POST `/uown/svc/createOrUpdateBankAccount` |
| `removeBankAccount` | `removeBankAccount(body)` | POST `/uown/svc/removeBankAccount` |
| `getBankAccounts` | `getBankAccounts(accountPk)` | GET `/uown/svc/getBankAccounts/{accountPk}` — returns all bank accounts |
| `createBankAccount` | helper | creates a bank account and returns its PK |
| `deleteBankAccount` | helper | removes a bank account by PK |

Bodies: `src/api/bodies/bank-account.body.ts` | Responses: `src/api/responses/bank-account.response.ts`

## ScheduledTaskClient — token sweep methods (Task #502) + getScheduledTaskByName (Task #491) + resumeScheduledTask (Task #505)

| Method | Signature | Description |
|--------|-----------|-------------|
| `refreshKountAccessTokenSweep` | `refreshKountAccessTokenSweep(): Promise<ApiResponse<unknown>>` | POST `/uown/svc/refreshKountAccessTokenSweep` — triggers Kount token refresh sweep |
| `refreshGdsAccessTokenSweep` | `refreshGdsAccessTokenSweep(): Promise<ApiResponse<unknown>>` | POST `/uown/svc/refreshGdsAccessTokenSweep` — triggers GDS token refresh sweep |
| `getScheduledTaskByName` | `getScheduledTaskByName(taskName)` | GET `/uown/svc/getScheduledTaskByName/{taskName}` — returns `ScheduledTaskMetadataResponseBody` |
| `resumeScheduledTask` | `resumeScheduledTask(taskName: string): Promise<ApiResponse<unknown>>` | POST `/uown/svc/resumeScheduledTask/{taskName}` — resumes a paused scheduled task by name (Task #505) |

> **Pitfall (Task #502 CT-06):** The `uown_scheduled_task` table columns are `scheduled_task_name` and `cron_trigger` — NOT `name` and `cron_expression`. Use these exact column names in any raw SQL against this table.

**Response interface:**

| Interface | Fields |
|-----------|--------|
| `ScheduledTaskMetadataResponseBody` | `scheduledTaskName`, `cronTrigger`, `sqlToPickAccounts`, `isActive`, `templateName`, plus other backend fields. **Backend Jackson serialization uses camelCase**, not snake_case. |

## SvcPhoneClient — opt-out / DNC / DNT flags (Task #505)

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

**Notes:** `optOutAi`/`optOutAiReason` são `null` até backend R1.50.0 deployar (Flyway migration V20260318174113).

## SvcContactClient — phone contact info updates (Task #146)

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
- Fix confirmed (Task #146): `sendVerificationCode` returns 200 after a phone is saved via `createOrUpdateContactInfo`

## CustomersClient — customer search v1/v2 with Origination fallback (Task #510)

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

**Known backend issue:** `/v2/customers/search` on qa2 returns 500 (`leadStatus` SQL grammar error — column not projected by mapper). Confirmed bug in Task #510. Tests that run against qa2 should expect potential 500 and skip rather than fail.

## SvcEmailClient — contact info / email updates (Task #442)

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

## GowSignTemplateClient — template CRUD (Task #505 / hotfix R1.51.1)

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

**qa2 template seed snapshot (as of 2026-05-06) — state=CA:**

| pk | template_id | name | client_type |
|----|-------------|------|-------------|
| 1 | `lkdu73w7dctuj7kxhc6omwvf` | California Lease Agreement | NULL (default fallback) |
| 2 | `mu97ag8wkchj1icvn5amz5s6` | CA_2025_SAC_jewelry | `'DANIELS_JEWELERS,JEWELRY'` |
