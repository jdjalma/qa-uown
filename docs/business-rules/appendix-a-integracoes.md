---
title: "Appendix A: Third-Party Integrations"
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-06-23
sources:
  - code: src/data/merchant-config-contract.ts#offerInsurance
  - svc-source: config/rightfoot/RightFootConfig.java
  - external-doc: https://documenter.getpostman.com/view/28884504/2sBXcEizW5
  - env: qa2
covers: [integracoes, vendors, sentilink, neustar, lexisnexis, seon, plaid, taxcloud, sweeps, rightfoot, gowsign-routing]
---

# Appendix A: Third-Party Integrations
## UOwn Leasing - SVC Platform

Complete reference for all of the system's external integrations.

---

## Appendix A: Third-Party Integrations

| Service | Function | When Used | How to Enable/Configure |
|---------|--------|---------------|----------------------|
| **Sentilink** | Synthetic identity detection | Application (UW engine step 1) | Thresholds per merchant |
| **Neustar** | Contact data verification | Application (UW engine step 2) | Checks enablable per merchant |
| **LexisNexis** | Risk score via public records | Application (UW engine step 3) | Threshold per merchant |
| **SEON** | Digital fraud engine (email/phone/IP) | Application (UW engine step 4) | 4 thresholds per merchant |
| **NeuroID** | Behavioral biometrics | Form completion | `useNeuroIdCheck` per merchant |
| **Intellicheck** | ID document authentication | Application submission | `isIntellicheckRequired` per merchant |
| **Kount** | Credit card fraud | Payment | Automatic on all CC transactions |
| **Plaid** | Bank and income verification | Second chance (UW_REVIEW) | `isPlaidVerificationRequired` per merchant |
| **GDS / Taktile / ABB** | Underwriting engines | Credit decision | Selection via config per merchant |
| **TaxCloud** | Tax calculation + compliance | Every transaction | `useTaxCloudApi = true` (default) |
| **TaxJar** | Tax calculation (alternative) | TaxCloud backup | `useTaxCloudApi = false` |
| **Buddy Insurance** | Protection plan | Signing or portal | `offerInsurance = true` on the merchant + allowed states |
| **Five9** | Call center / IVR | Phone calls | Header `Username: Five9` |
| **Skit.ai** | Automated collections bot | Calls via TMS | Sweeps `createSkitDelinquent*` generate files |
| **SignWell / PandaDoc** | Electronic signature | Contract | Config per merchant |
| **GowSign** | Electronic signature (new vendor) | Contract | API `https://api.gowsign.com`, auth `x-api-key` + IP allowlist (see GowSign Vendor API section) |
| **Profituity** | ACH processing | Bank payments | Automatic via ACH sweeps |
| **RightFoot** (R1.53.0) | Bank balance verification before (re)running delinquent ACH | Before ACH rerun (daily sweep 15:00 + Thu 09:00) | Config prefix `com.uownleasing.svc.rightfoot.*`; sweeps `DailyAchBalanceCheckSweep` / `RerunAchBalanceCheckSweep` (svc#540). Does NOT replace Profituity -- it's a pre-check layer, not a processor. Details in [09-integracoes-externas.md](09-integracoes-externas.md) section 48 |
| **Channel Payments / USAePay** | CC gateway | Card payments | Automatic via CC sweeps |
| **SendGrid** | Email sending | Correspondence | Automatic |
| **Twilio** | SMS sending | Correspondence | Automatic |
| **SharePoint** | Document storage | Reports and account sales | Report sweeps |
| **Zendesk** | Support tickets | Customer portal | Automatic via portal |
| **RTR** | RTO/Kornerstone data import | Portfolio migration | Sweep `kornerstoneDailyImportSweep` |
| **PayWallet** | Payroll deduction | Payments | Sweep `processPayWalletPaymentsSweep` |
| **TrustPilot** | Customer reviews | Post-servicing | Sweep `refreshTrustPilotAccessKeySweep` |
| **Proget** | IoT/GPS device locking | Delinquency | Sweep `progetDeviceLockingSweep` |
| **Vervent** | Lease documents for the bank | Funding | Sweep `generateVerventOnBoardingFileSweep` |
| **PayPair** | Financing marketplace (widget) | Origination via external merchant | Public portal `dw93bg.paypair.com`, iframe `#llapp-iframe` |

---

## GowSign Vendor API

External contract of the GowSign e-sign vendor (new provider, in rollout vs the legacy SignWell). How to **test** signing → [[gowsign-knowledge]]; routing by state and single source in [`03-contratos-esign.md`](03-contratos-esign.md) (do NOT duplicate here).

> **Primary (authoritative) source:** Postman published doc `GOWSIGN API - UOWN` — `https://documenter.getpostman.com/view/28884504/2sBXcEizW5` (captured 2026-06-23). `[external-doc:postman/gowsign-api,2026-06-23]`

**Base URL:** `https://api.gowsign.com` (host varies by env — in sandbox/dev the iframe runs on `gowsign-app-dev-uown.azurewebsites.net`; see pitfall in [[gowsign-knowledge]]).

**Auth:** header `x-api-key: YOUR_API_KEY` + IP allowlist (401 if key is invalid/inactive/expired OR IP is not allowed).

**3 document creation flows** (`POST /api/document`):
1. **DOCX:** `document.documentBase64` (DOCX → PDF server-side); fields via `document.fields` (objects `{term, type, required, signer, width, height}`).
2. **Custom HTML:** `document.customTemplate` + `customTitle`; inline fields in bracket syntax; `{{var}}` variables from `document.variables`.
3. **Strapi Template:** `document.templateId` + `document.environment` (must match an environment of the template); content/title come from the Strapi CMS.

**Document status (enum):** `CREATED` → `OUTSTANDING` → `SIGNED` → `COMPLETED` (+ `EXPIRED`, `CANCELED`).

**pdfStatus (enum):** `CREATED_PENDING`, `CREATED_GENERATED`, `SIGNED_PENDING`, `SIGNED_GENERATED`, `AUDIT_TRAIL_PENDING`, `AUDIT_TRAIL_GENERATED`.

**Webhook callback enrichment** (Strapi flow — fields added to the `callback`): `event_hash` (SHA-256 of timestamp + integration key), `event_time`, `event_type` = `document_created`, `Provider` = `GOWSign`, `Meta.related_document_hash` = document ID.

**Inline field bracket-syntax (summary):**

| Syntax | Field |
|---------|-------|
| `[sig\|REQUIRED\|SIGNER\|W\|H]` / `[sign:ID\|...]` | Signature (`sig`/`sign` aliases; default 200×50px) |
| `[initials\|...]` / `[initials:ID\|...]` | Initials (default 100×40px; positional gotcha: use `||` for dimensions only) |
| `[date\|SIGNER\|FIELD]` | Signing date (auto, read-only) |
| `[text\|REQ\|SIGNER\|NAME\|INIT\|PLACEHOLDER\|W]` | Text input |
| `[radio_button\|REQ\|SIGNER\|GROUP\|INIT\|(label;name)...]` | Radio |
| `[checkbox\|REQ_SPEC\|SIGNER\|GROUP\|(label;name;bool)...]` | Checkbox (`req2/5` = min 2 max 5) |
| `[table\|ID]` | Dynamic table from `document.variables[ID]` (`{headers, rows}`) |

- **Explicit `:ID`** is required to target the field in the `document.hidden` map (`{"sig:ID": true}`); without an ID the fields are auto-numbered.
- **Header/footer** (`document.headerTemplate`/`footerTemplate`): support `{{page}}` and `{{pageCount}}` (resolved per page at render) + the same bracket syntax (common pattern: per-page initials in the footer).

---

