---
name: api-client-pattern
description: Carregue ao criar API client em src/api/clients/. Define padrao BaseClient + typed request bodies + typed responses, catalogo de clients existentes (nao duplicar), convencoes de error handling.
disable-model-invocation: true
---

# API Client Pattern

> Padrao BaseClient + typed bodies/responses. Para catalogo completo de metodos por client, ver [references/catalog.md](references/catalog.md).

## Quando aplicar

Ao criar ou modificar API clients em `src/api/clients/`. NAO aplicar para page objects, helpers, ou test files diretamente.

## Convencao

- **Location:** `src/api/clients/` — todos extendem `BaseClient`
- **Bodies:** `src/api/bodies/` — typed request bodies
- **Responses:** `src/api/responses/` — typed response interfaces
- **Templates:** `src/fixtures/api-templates/` — JSON templates for request bodies
- **Selectors:** centralizados em `src/selectors/common.selectors.ts`, typed em `src/selectors/selector.types.ts`. **Nunca** hardcode selectors em tests.

## BaseClient pattern

Every client extends `BaseClient` which provides:
- `get<T>(path)`, `post<T>(path, body)`, `put<T>(path, body)`, `patch<T>(path, body)`, `delete<T>(path)`
- Host resolution (`los`, `svc`, `tms`) via constructor
- Auth headers (API key / bearer token) injected automatically
- `postWithOverride<T>(path, body, extraHeaders)` for header-versioned endpoints

## Typed bodies + responses convention

1. **Request body** — interface in `src/api/bodies/{domain}.body.ts` + `build*Body(overrides)` builder function
2. **Response** — interface in `src/api/responses/{domain}.response.ts`
3. **Return type** — always `Promise<ApiResponse<T>>` where `T` is the response interface

Example structure:
```typescript
// src/api/bodies/bank-account.body.ts
export interface CreateBankAccountBody { accountPk: number; routingNumber: string; /* ... */ }
export function buildCreateBankAccountBody(overrides?: Partial<CreateBankAccountBody>): CreateBankAccountBody { /* ... */ }

// src/api/responses/bank-account.response.ts
export interface BankAccountResponse { pk: number; routingNumber: string; /* ... */ }

// src/api/clients/bank-account.client.ts
export class BankAccountClient extends BaseClient {
 async createOrUpdateBankAccount(body: CreateBankAccountBody): Promise<ApiResponse<BankAccountResponse>> {
 return this.post('/uown/svc/createOrUpdateBankAccount', body);
 }
}
```

## Header-versioned endpoints pattern

Some controllers require `X-API-Version` header. Use defaulted parameter with `null` meaning "omit":

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
 '/uown/los/merchant/applications/search', body ?? {}, extraHeaders,
);
}
```

Canonical example: `src/api/clients/los-partner-application.client.ts` (WI-525).

## When NOT to create a new client

- **Method already exists** — check catalog first: [references/catalog.md](references/catalog.md)
- **Endpoint is one-off** — use inline `api.request.get/post` in the test
- **Endpoint belongs to existing domain** — add method to the existing client (e.g., new payment method goes in `PaymentArrangementClient`)

## Existing clients (quick index)

| Client | Fixture | Host | Domain |
|--------|---------|------|--------|
| `AccountClient` | `api.account` | svc | Account ops, due dates, podium |
| `ApplicationClient` | `api.application` | los | sendApplication, submitApplication, getMissingFields |
| `BankAccountClient` | `api.bankAccount` | svc | Bank account CRUD |
| `CreditCardClient` | `api.creditCard` | los/svc | CC auth, tokenize, transactions |
| `CustomersClient` | `api.customers` | tms | Customer search v1/v2 |
| `GowSignTemplateClient` | `api.gowSignTemplate` | svc | Template CRUD |
| `MerchantClient` | `api.merchant` | los | Merchant config, programs, error logs |
| `PaymentArrangementClient` | `api.paymentArrangement` | svc | CC/ACH payment arrangements |
| `ScheduledTaskClient` | `api.scheduledTask` | svc | Sweep triggers, task metadata |
| `SimpleSearchClient` | `api.simpleSearch` | los/svc | LOS + Servicing search |
| `SvcContactClient` | `api.svcContact` | svc | Contact info CRUD |
| `SvcEmailClient` | `api.svcEmail` | svc | Email CRUD |
| `SvcPayoffClient` | `api.svcPayoff` | svc | Payoff, settlement, servicing info |
| `SvcPhoneClient` | `api.svcPhone` | svc | Opt-out/DNC/DNT flags |
| `TmsAuditClient` | `api.tmsAudit` | tms | Account summary (v1 + legacy) |
| `LosPartnerApplicationClient` | `api.losPartnerApp` | los | Partner app search (X-API-Version) |
| `CorrespondenceClient` | `api.correspondence` | los | Email queue triggers |

> Catalogo completo com metodos, signatures, response interfaces, e notas por client: [references/catalog.md](references/catalog.md)

## Anti-patterns

1. **Duplicating an existing client** — always `grep -r 'class.*Client extends BaseClient'` first
2. **Untyped responses** — never use `Promise<ApiResponse<unknown>>` for production endpoints; create a response interface
3. **Hardcoded headers** — use `postWithOverride` pattern, not manual `fetch` calls
4. **Missing builder** — every non-trivial body must have a `build*Body(overrides)` function
5. **Capital letter drift** — some Java DTOs use `PK` (capital): `phonePK`, `customerPK`, `emailPK`. Check the backend DTO before typing.

## Cross-links

- [[application-lifecycle]] — pitfall #31 (LosExternalMerchantController auth model)
- [[common-operations]] — reusable API call patterns
- [[merchant-preflight]] — `ensureMerchantReady` before application creation
- [[helpers-catalog]] — `buildCcPaymentDetails`, `buildCcArrangementBody`, etc.
