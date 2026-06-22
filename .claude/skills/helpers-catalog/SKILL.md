---
name: helpers-catalog
description: Carregue ao precisar de helper (auth, navigation, OTP, IMAP, DB query, network intercept). Catálogo do que já existe em src/helpers/ — não duplicar. Antes de criar helper novo, conferir se equivalente existe.
disable-model-invocation: true
---

# Helpers Catalog

> Catalogo de helpers em `src/helpers/` com localizacao, proposito e signatures-chave.
> Detailed method signatures, parameters, return types: [references/methods.md](references/methods.md)

## Principles

1. **Never duplicate** — always check this catalog before creating a new helper
2. **Import via barrel** — `import { helperFn } from '@helpers/index.js';`
3. **DB helpers are SELECT-only** unless explicitly authorized (CLAUDE.md Exception 3)
4. **Re-export** — new helpers must be re-exported via the barrel in `src/helpers/index.ts`

## Helper Index

| Helper | Location | Purpose |
|--------|----------|---------|
| `api-setup.helpers.ts` | `src/helpers/` | API client setup for tests |
| `auth.helpers.ts` | `src/helpers/` | Authentication helpers |
| `common.helpers.ts` | `src/helpers/` | Shared utilities (sleep, retry, etc.) |
| `database.helpers.ts` | `src/helpers/` | DB queries, polling, waitForRecord |
| `date.helpers.ts` | `src/helpers/` | Date formatting/parsing |
| `downloads.helpers.ts` | `src/helpers/` | File download verification + CSV parse + PII-safe cleanup (`waitForDownload`, `saveDownload`, `downloadAndReadContent`, `getLastDownloadedFile`, `parseCsv`, `deleteDownloadedFile`) |
| `email.helpers.ts` | `src/helpers/` | IMAP email reading (Gmail) — OTP/link extraction with UID-watermark freshness filter (`snapshotInboxUid` + `getVerificationCode(..., { sinceUid })`) |
| `navigation.helpers.ts` | `src/helpers/` | Page navigation patterns |
| `signwell.helpers.ts` | `src/helpers/` | Signwell e-sign helpers |
| `table.helpers.ts` | `src/helpers/` | Table interaction patterns |
| `template-engine.ts` | `src/helpers/` | JSON template interpolation |
| `test-artifact.helpers.ts` | `src/helpers/` | Test artifact management |
| `test-data.helpers.ts` | `src/helpers/` | `buildTestData` — unified data builder |
| `worker-id.helper.ts` | `src/helpers/` | Worker-scoped unique IDs (PID + worker index) |
| `network-intercept.helper.ts` | `src/helpers/` | HTTP traffic capture (NeuroID, endpoint call counter) |
| `program-test-data.helper.ts` | `src/helpers/` | Test data lifecycle for merchant programs |
| `correspondence.helpers.ts` | `src/helpers/` | DB queries for approval email template routing |
| `gowsign-template-db.helpers.ts` | `src/helpers/` | DB queries for GowSign template routing |
| `redirect.helpers.ts` | `src/helpers/` | URL-redirect assertions for `/getApplication/{code}` |
| `settled-in-full.helpers.ts` | `src/helpers/` | DB queries for Settled In Full email sweep |
| `settlement.helpers.ts` | `src/helpers/` | Settlement Amount calculation oracle |
| `account-aging.helpers.ts` | `src/helpers/` | Artificial delinquency aging for boundary-value CTs |
| `recording.helpers.ts` | `src/helpers/` | DB + browser assertions for Sentry Session Replay |
| `servicing-dialogs.helpers.ts` | `src/helpers/` | Dismissal helpers for Servicing portal auto-rendering dialogs |
| `sticky.helpers.ts` | `src/helpers/` | DB poll + introspection for StickyRecoverSweep |
| `datetime.helpers.ts` | `src/helpers/` | TZ-tolerant assertion for Java LocalDateTime vs DB timestamptz |
| `search-sql-explain.helpers.ts` | `src/helpers/` | EXPLAIN ANALYZE runner for SQLs in `uown_sv_sql_config` |

## INFRA — `database.helpers.ts` pg.Pool hardening (svc#546, 2026-06-22)

> **Benefits ALL tests** — not domain-specific. Catalogued so future DB flakiness isn't misdiagnosed as a browser crash.

The `pg.Pool` in `database.helpers.ts` (`new Pool({...})`, ~line 145) was hardened with:
- `keepAlive: true` — keeps idle pooled connections alive across the qa2 SSH/`kubectl port-forward` tunnel.
- a **non-throwing** `pool.on('error', (err) => {...})` listener (~line 162) — swallows/logs the error instead of letting it propagate as `uncaughtException`.

**WHY:** an idle pooled connection dropped by the qa2 tunnel emitted an unhandled `'error'` event that crashed the Playwright **worker** mid-test. It surfaced as a **bogus** `"Target page/context/browser has been closed"` — which looks like a UI/browser failure but is actually a DB-tunnel drop. Without the listener, node treats the pool 'error' as fatal. Related to app-lifecycle pitfall #113 (qa2 tunnel transience) and #130 (port reuse) — same root infra, different symptom. If you see a sudden "browser has been closed" with no preceding UI step, suspect the DB tunnel first.

## CSV export helpers — `downloads.helpers.ts`

For asserting a downloaded CSV's column SET and row count against the portal total ([[check-points]] consequence oracle) — not just "a file arrived".

| Function | Signature → Purpose |
|----------|---------------------|
| `parseCsv(content)` | `(string) → { headers: string[]; dataRowCount: number }` — RFC-4180-aware: respects double-quoted fields with embedded commas/newlines so quoted multi-line cells don't inflate the row count. Strips BOM. Does NOT log cell content (Leads CSV carries SSN — PII hygiene) |
| `deleteDownloadedFile(filePath)` | `(string \| null) → void` — best-effort cleanup of a downloaded artifact (Leads CSV contains SSN). No-ops on null/missing; never logs content. Call after assertions on any download that may carry PII |

> Pair with `waitForDownload` (capture) → `saveDownload` (persist) → `parseCsv` (assert) → `deleteDownloadedFile` (cleanup). The `FilteredCsvDownloadControls` component ([[page-object-pattern]]) returns the `Download` from `downloadCsv()` for this chain.

## Key database.helpers.ts Functions (quick reference)

| Function | Purpose |
|----------|---------|
| `recalculateArrangementStatus(arrangementPk)` | CC arrangement status from payments |
| `recalculateAchArrangementStatus(arrangementPk)` | ACH arrangement status (MR !1368) |
| `simulateCcSweepForArrangement(arrangementPk)` | Approve PENDING CC tx with `posting_date <= today` (date-gated sweep stand-in) |
| `approveAllPendingCcSalesForArrangement(arrangementPk)` | Approve ALL PENDING CC SALEs (no date gate) — multi-installment stand-in for env w/o processor (Exception 3) |
| `getNeuroIdVerification(leadPk)` | Latest NeuroID verification row |
| `waitForNeuroIdRecord(leadPk, timeout?)` | Poll for NeuroID row |
| `countNeuroIdCalls(leadPk)` | `COUNT(*)` of `uown_neuro_id_verification WHERE lead_pk=$1` — source of truth for NeuroID-call assertions in signing-retry tests. NOT `uown_sv_outbound_api_log` (no `lead_pk` correlation for pre-funding leads — see fraud-vendors-knowledge) |
| `getMerchantByRefCode(refCode)` | Merchant by ref_merchant_code |
| `countMerchantByRefCode(refCode)` | Count for absence assertions |
| `getAccountAutoPayTypes(accountPk)` | Auto-pay type records |
| `get/waitFor BankAccount*(...)` | Bank account CRUD queries |
| `getMerchantPrograms(merchantPk)` | All programs via junction table |
| `updateMerchantProgramDates(pk, dates, authorizedBy)` | Authorized date mutation |
| `waitForProgramActiveState(pk, expected, timeout?)` | Poll is_active flag |
| `waitForValueChange(sql, params, oldValue, timeout?)` | Poll until value changes |
| `getUwScoresByLeadPk(leadPk)` | Read-only projection of `npm_segment, tam_score, decided_by_agent, eligible_terms, uw_status` from `uown_los_uwdata` (latest). #1313. **Guard `decided_by_agent='GDS'` + `eligible_terms~'16'` before asserting the GDS-snapshot fields, else false-bug.** |
| `getSvUwScoresByAccountPk(accountPk)` | Same projection from Servicing-side `uown_sv_uwdata` by `account_pk` (#1313 CT-04, funded lead → account snapshot) |
| `waitForUwNpmSegment(leadPk, timeout?)` | Poll-with-backoff until the UW decision row exists AND `npm_segment` is non-null (the GDS snapshot write is async). Read-only. #1313 |

> Full signatures and detailed usage: [references/methods.md](references/methods.md)

## Token Row Types

| Type | Table | Pitfall |
|------|-------|---------|
| `KountTokenRow` | `uown_kount_token` | `timestamp WITHOUT time zone` — pg-node TZ-dependent |
| `GdsTokenRow` | `uown_gds_token` | `timestamp WITH time zone` — safe for JS comparison |

## Test Data Sources

| Source | Location |
|--------|----------|
| Merchants | `src/data/merchants.ts` |
| Test programs | `src/data/test-programs.ts` |
| Test cards | `src/data/test-cards.ts` |
| Addresses (static fixture) | `src/data/state-address-mapper.ts` (`STATE_ADDRESSES`) |
| Realistic random-data factory | `src/data/realistic/` — see subsection below |
| Constants | `src/config/constants.ts` |

### Realistic data factory — `src/data/realistic/` (added 2026-06)

Generates real-looking, **unique-per-call** fresh data (people, names, addresses,
products, both cart shapes). REUSES — does not duplicate — `generateTestSSN`/
`generateTestPhone` (`@config/constants`), the env email alias, and the PayPair
builders + `TireAgentProduct`/`PayPairPersonalInfo` (`src/data/tire-agent.data.ts`).
High-level API imports from `@data/index.js`; RNG primitives (`int`, `pick`,
`splitAmount`, …) stay namespaced under `@data/realistic`.

| Function | Purpose (signature) |
|----------|---------------------|
| `randomApplicant(opts)` | `(RandomPersonOptions) → ApplicantInfo` — name + valid unique address + test SSN + phone + adult DOB |
| `randomPerson(opts)` | `→ RandomPerson` (ApplicantInfo + `annualIncome`) |
| `randomPayPairPersonalInfo(opts)` | `→ PayPairPersonalInfo` (partner-portal) |
| `resolveSsn(strategy)` | `'approve' \| 'deny' \| 'sticky16m'(082390916) \| literal` |
| `randomLineItems(opts)` | `→ InvoiceLineItem[]` (UOWN sendApplication/sendInvoice) |
| `randomPayPairCart(opts)` | `→ TireAgentProduct[]` (PayPair Cart) |
| `randomCart` / `cartToLineItems` / `cartToPayPair` / `cartTotal` | neutral `CartLine[]` model + adapters |
| `categoryForMerchant(clientType)` | merchant `client_type` → catalog category (DANIELS_JEWELERS→Jewelry, TIREAGENT→Tires, KORNERSTONE→Furniture) — keeps cart items coherent with the MERCHANT |
| `randomAddress(state)` | real (city,ZIP) per state + random house#/unit ⇒ **unique street every call (blacklist-immune)** |
| `randomFullName` / `PRODUCT_CATALOG` | name pool (120 first / 112 last) / 52-item catalog across ~15 categories (each item's category matches its description); real (city,ZIP) for ~24 states |

`RandomCartOptions`: `{ count, total, maxQuantity, category }`. Shortcut:
`buildTestData({ realistic: true, ssn })` → realistic name + valid unique address + adult DOB in one call.

```ts
const applicant = randomApplicant({ state: 'OH', ssn: 'sticky16m' });
const lineItems = randomLineItems({ category: categoryForMerchant('DANIELS_JEWELERS'), total: 900 });
const ppCart    = randomPayPairCart({ category: 'Tires', total: 800 });
```

**When NOT to use:** a test that must pin a deterministic SSN/address for a routing
assertion (use a literal `SsnStrategy` / static `STATE_ADDRESSES`).

## Helpers ainda não detalhados aqui (existem — NÃO recriar)

Listados para fechar o gap da Regra #2 (auditoria 2026-06-18). Leia o `src/helpers/<arquivo>` para a assinatura antes de usar:

| Helper | Propósito |
|--------|-----------|
| `contract-pdf.helper.ts` | Extração/validação de conteúdo do PDF de contrato |
| `esign-db.helpers.ts` | Queries de `uown_esign_document` (status, client GOWSIGN/SIGNWELL) — 22 imports |
| `gowsign-signing.helper.ts` | `signGowSignInFrame` — assinatura no iframe GowSign — 19 imports |
| `merchant-config.helper.ts` | Leitura/preflight de config de merchant |
| `merchant-location-report.helper.ts` | `MerchantLocationReportControls` — filtro Merchant/Location + paginação + leitura de coluna compartilhados (composição). NOTA: a página `FundingPage` (`src/pages/origination/funding.page.ts`) NÃO usa o componente compartilhado `MerchantLocationFilters` — tem DOM custom (labels `<div>` + IDs estáveis). Sua API pública de filtro (`listAvailableLocations()`, `filterByLocations`, `filterByStatuses`, …) vive no page object, catalogada em [[page-object-pattern]] `FundingPage`. NÃO usar `MerchantLocationFilterPO` no Funding Queue. |
| `merchant-program-toggle.helpers.ts` | Toggle de programas 13m/16m do merchant |
| `svc-payoff.helpers.ts` | Cálculo/parse de EPO/payoff (`parseEpoBreakdown`) |
| `svc-servicing-info.helpers.ts` | Leitura de info da conta no Servicing |
| `sweep-fixture.helpers.ts` | Finders de registros idle + restores + `sweepLogBaseline`/`triggerAndWaitSweepLog` |

## When to Create a New Helper

1. Check this catalog — does an equivalent already exist?
2. Check `src/helpers/index.ts` barrel for unlisted exports
3. If truly new: create in `src/helpers/`, re-export via barrel, update this catalog
4. DB helpers: SELECT-only by default; mutations require `authorizedBy` parameter
