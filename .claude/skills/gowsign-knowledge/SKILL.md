---
name: gowsign-knowledge
description: Load when planning/implementing/debugging a test that involves signing — GowSign, SignWell, contract content, iframe events, post-signing, recovery, multi-state. Covers the GoSign rollout, mandatory SignWell regression, visual diff.
disable-model-invocation: true
---

# GowSign / SignWell Knowledge

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO TEST** signing — suites, mandatory regression, visual diff, helpers. The **canonical product behavior** (GowSign/SignWell routing by state, provider matrix, template content) does NOT live here — it is the single source in `docs/business-rules/03-contratos-esign.md` and `src/data/state-merchant-matrix.ts`. To resolve "which provider for state X", run `node scripts/docs-tooling.mjs resolve gowsign-routing` (returns the canonical + fresh KB). Recent investigations by state: `docs/knowledge-base/*gowsign*`. **Do not duplicate routing facts here** — they drift (it was the NY/OH case).

## Rollout status (2026-05-20)

The project is migrating from **SignWell** (legacy provider) to **GoSign/GowSign** (new provider). Critical rules:

1. **SignWell regression is MANDATORY** in any task that touches signing — validating GoSign alone is not enough.
2. **Visual diff SignWell vs GoSign** is necessary — the Daniel's Jewelers CA bug (missing columns on page 1 of the PDF) confirmed on 2026-05-06 that API-only does not detect rendering regression.
3. **"Items Purchased" standardization** entered scope on 2026-05-14 — tests covering contract content must validate that section in both providers.

Memory: `project_gosign_rollout`.

## Existing suites

### `tests/e2e/gowsign/` (20+ specs)

Coverage by dimension:

| Spec | Focus |
|------|------|
| `gowsign-smoke-flow.spec.ts` | General sanity of the signing flow |
| `gowsign-create-contract.spec.ts` | Contract creation |
| `gowsign-contract-content.spec.ts` + `-qa2.spec.ts` | Validation of rendered content (PDF, iframe) |
| `gowsign-iframe-events.spec.ts` + `-qa2.spec.ts` | GowSign iframe JS events |
| `gowsign-signing-completion.spec.ts` | Flow through to signed |
| `gowsign-signature-fields.spec.ts` | Signature fields (placeholders, signers) |
| `gowsign-operations-and-fields.spec.ts` | Post-creation operations |
| `gowsign-post-signing.spec.ts` | Post-signature events |
| `gowsign-lease-status.spec.ts` | Lease status transition |
| `gowsign-modify-and-recovery.spec.ts` + `gowsign-modify-lease-qa2.spec.ts` | Modify lease + recovery flow |
| `gowsign-recovery-qa2.spec.ts` | Recovery in isolation |
| `gowsign-cross-role-consistency-qa2.spec.ts` | Customer vs Agent vs Admin views |
| `gowsign-edge-and-accessibility-qa2.spec.ts` | Edge cases + a11y |
| `gowsign-servicing-portal-qa2.spec.ts` | Servicing-side of the signing |
| `gowsign-provider-lifecycle-qa2.spec.ts` | Provider lifecycle |

### `tests/e2e/signing-regression/`

- `multi-state-signing.spec.ts` — covers multiple US states (CA, NY, etc.) — template diff by state/locale.

## When to run the whole suite

- **Template change** → all of `gowsign-contract-content*` + `gowsign-signature-fields` + SignWell visual diff.
- **Provider config change** → `gowsign-provider-lifecycle` + `gowsign-iframe-events`.
- **Status transition change** → `gowsign-lease-status` + `gowsign-post-signing`.
- **Admin endpoint change** (e.g., `PATCH /uown/svc/gowsign-templates/{id}`) → API-only OK for that endpoint, but then run `gowsign-contract-content` in the UI to confirm the render.

## Specific pitfalls

### 1. Daniel's Jewelers CA bug (empty placeholders in the PDF)
Discovered manually on 2026-05-06. Root cause: API-only tests read logs without rendering the PDF. **Forced inviolable rule #14 (UI-first)** and rule #15 (DOM investigation).

### 2. Items Purchased (2026-05-14)
Section standardized across providers — validate presence + order + values in both SignWell and GoSign.

### 3. Float representation in monetary values
`"18.46"` vs `"18.459999999999997"` is IEEE 754 rounding, not a functional bug. Compare with `toBeCloseTo`, not `toEqual` (memory `feedback_float_repr_not_bug`).

### 4. Iframe content is hard to inspect
GowSign renders inside an iframe. Use Playwright's `frameLocator`, not a direct `locator`. For a snapshot, capture the whole frame.

### 5. qa2 routing vs other envs
Agent memory `project_qa2_esign_routing` (in `.claude/agent-memory/qa-planner/`) has env-specific routing details. Consult it before assuming the endpoint is the same across envs.

### 6. Servicing portal sweep timing
Sweeps of scheduled tasks (post-signing, recovery) can take a while — don't hit a short timeout.

### 7. The GowSign iframe host varies by environment — selector `src*="gowsign.com"` breaks in sandbox (discovered 2026-06-12, lead 97457)
The selector `iframe[src*="gowsign.com"]` (formerly `signingGowSignIframeByUrl`) **does not match in sandbox**: the real vendor host is `gowsign-app-dev-uown.azurewebsites.net` (full URL observed: `https://gowsign-app-dev-uown.azurewebsites.net/document/{uuid}?embedMode=true`), NOT `*.gowsign.com`. The selector was **broadened to `iframe[src*="gowsign"]`** (substring `gowsign`) — it matches both the sandbox/dev azurewebsites host and the prod `*.gowsign.com`.

**Rule:**
- GowSign iframe detection → prefer the **class** selector `iframe.alternative-contract-vendor_iframe__nSb3A` (`SELECTORS.signingGowSignIframe`) or the modal container `.alternative-contract-vendor_iframeContainer__yAn5c` — they are stable across envs (UOwn frontend CSS-module hash, not the vendor's). Verified MATCH on the live DOM 2026-06-12.
- Detection by URL → use the substring `gowsign` (not `gowsign.com`). Never assume the vendor host by env.
- The class `alternative-contract-vendor_iframe__nSb3A` is a CSS-module hash (fragile if the frontend rebuilds — see pitfall #26 in [[application-lifecycle]]), but today it is the GowSign vs SignWell discriminator.

### 8. `ContractPage.completeESign` needs the GowSign branch (gap fixed 2026-06-12)
`completeESign` (consumer contract page, `src/pages/origination/contract.page.ts`) auto-detects the provider by polling the iframe. Before, it only had a PandaDocs + SignWell branch → when the backend routed the lead to GowSign (e.g., NY with template `NY_2025_SAC`), the method fell into the SignWell fallback and threw `TimeoutError` on `#SignWell-Embedded-Iframe`. **It wasn't timing — it was an unsupported provider.**

**Canonical implementation of the GowSign branch (reuse, do not recreate):**
- `AlternativeContractModalPage.waitForOpen` + `.getGowSignFrame` → the iframe's `FrameLocator`.
- The helper `signGowSignInFrame(page, frame, { preauthChoice: 'yes', waitForCompleted: true })` from `src/helpers/gowsign-signing.helper.ts` drives the entire ceremony: Start → adopt signature/initials in Type mode (1st font) → "Sign All" → "Finish" → wait for the `completed` postMessage.
- Internal button sequence validated on the live DOM 2026-06-12 (lead 97457): **Start → [font] → Next → [font] → Save → Sign All → Finish** → redirect `/appComplete?...document_status=completed`. PreAuth "Yes" already comes checked by default.
- The internal IDs (`#startSignatureButton`, `#signAllButton`, `#finishSignatureButton`) are not visible cross-origin, but the accessible names ("Start", "Sign All", "Finish", "Close document") match what the helper expects.

## Templates known to have historical problems

- `KORNERSTONE_FinalizePurchaseEmail` — technical display name in the log; the spec in `example.md` (deleted, but it was in the scope of 2026-05-19) proposes a rename to "Finalize Purchase Email".
- Daniel's Jewelers CA template — empty placeholders on page 1.

## Canonical GowSign templates table

The GowSign templates table in the svc DB is **`uown_gow_sign_template`** (snake_case with 3 parts: `gow_sign`), NOT `uown_gowsign_template` (2 parts). An inline query with the wrong name returns 0 rows silently and triggers a false `[OBSERVATION]`.

**Rule:**
- Always use the helper `getGowSignTemplatesForState(db, state)` from `src/helpers/gowsign-template-db.helpers.ts:148` — it points to the correct table.
- Do NOT write an inline SELECT with `uown_gowsign_template` — wrong name, zero rows.
- To list existing templates: `SELECT * FROM uown_gow_sign_template WHERE state = $1 AND (is_active IS NULL OR is_active = true)`.

Source: `src/helpers/gowsign-template-db.helpers.ts:148` + DB introspection qa1 `information_schema.tables WHERE table_name ILIKE '%gowsign%'` → 0 rows; `uown_gow_sign_template` found via `information_schema.tables WHERE table_name ILIKE '%gow_sign%'`.

## e-sign document status enum (`uown_esign_document.status`) — discovered S7 qa1 2026-06-10

The status column of the signature document is **`status`** (varchar 255, schema doc col 37) — NOT `document_status`. Real enum values:

| Value | Meaning |
|-------|------------|
| `STORED` | document generated/stored, not yet sent |
| `SENT_TO_CUSTOMER` | sent to the customer for signature (NOT `SENT`) |
| `COMPLETED` | signature completed (NOT `SIGNED`) |
| `ERROR` | processing failure |
| `CANCELLED` | canceled |

**Rule:**
- In e-sign assertions, use `status='SENT_TO_CUSTOMER'` for sending and `status='COMPLETED'` for completion.
- Do NOT use `SENT` (that is a value of `uown_email_queue`, a different table).
- Authoritative schema: [`docs/database-schema.md`](../../../docs/database-schema.md) section `uown_esign_document`. Cross-link: app-lifecycle pitfall #96.

### CORRECTION (qa2, 2026-06-22): `SIGNED` and `STORED` EXIST in the post-signature progression

The old note "`SENT_TO_CUSTOMER`/`COMPLETED`, NOT `SIGNED`" was derived from **unsigned** leads (up to sending). A **genuinely signed** lead reaches **`SIGNED` and then `STORED`** — the real progression observed in qa2 (leads 16865/16866/16867) is:

**`SENT_TO_CUSTOMER` → `SIGNED` → `STORED` → (`COMPLETED`)**

- When it reaches `STORED`, the `document_name` becomes `*_signed.pdf`.
- Therefore: do NOT claim that `SIGNED` "doesn't exist in this enum" — it exists for leads that actually signed. The old caveat applies only to pre-signature leads.

### Post-signature GOTCHA: the `request` field is OVERWRITTEN to the string `getDocumentStatus`

After the lead signs, the dispatch row in `uown_esign_document` has the **`request` field overwritten** — from a dispatch JSON `{...}` to the **raw string `getDocumentStatus`**. Consequence: a helper that filters `request LIKE '{%'` (e.g., `getEsignDocumentByLeadAndClient`) **does NOT find the post-signature row** (it no longer starts with `{`).

**Rule:**
- For **post-signature** status, query by **lead + client directly** (`WHERE lead_pk=$1 AND client='GOWSIGN'`), NOT by `request LIKE '{%'`.
- Pre-signature, the authoritative row is still `uown_esign_document` with the dispatch JSON.

### Signature activity log (Rule #13)

The signature emits notes in `uown_los_lead_notes`:
- `[ContractService]...Updating lead status to SIGNED`
- `[EsignRedirectService][updateSignStatus]`
- `[ESIGNSERVICE]`

So Rule #13 is satisfied via `uown_los_lead_notes` AFTER the signature; BEFORE the signature, the authoritative record is `uown_esign_document` (not `lead_notes`).

## OH template — render facts (qa2, 2026-06-22 — primary-source)

The template `OH_2025_SAC_16_MONTHS` (16m SAC, Ohio) — BUG-01 (`{{nextPaymentDueAmount}}` blank in Item 3/4a) is **FIXED/validated** (renders 95.16/22.07/43.50; zero "variables map missing" dispatch notes). Render facts confirmed in the PDF flatten:

- **Header token = `AGREEMENT-OH`** — the literal word **"Ohio" does NOT appear** in the PDF flatten. A copy-check for the string "Ohio" gives a **false negative**; anchor on `AGREEMENT-OH`.
- **EPO Appendix** renders `"For a 16-\nmonth lease, the EPO price is calculated as:"` — note the **line break inside "16-month"** (`16-\nmonth`); an exact match for `"16-month"` fails because of the `\n`.
- **Brand phone** resolves to **(877)357-5474**.

## Anti-patterns

- ❌ Validating signing only via DB (it doesn't render)
- ❌ Asserting `status='SENT'` in `uown_esign_document` — `SENT` belongs to `uown_email_queue`; use `SENT_TO_CUSTOMER` (sending) in the `status` column
- ❌ Claiming that `SIGNED`/`STORED` "don't exist" in the enum — they exist for actually-signed leads (progression `SENT_TO_CUSTOMER → SIGNED → STORED → COMPLETED`)
- ❌ Looking up the post-signature row by `request LIKE '{%'` — the `request` becomes the string `getDocumentStatus`; query by lead+client directly
- ❌ Copy-check of the OH contract by the word "Ohio" — it doesn't appear in the flatten; use `AGREEMENT-OH`
- ❌ Forgetting SignWell regression when GoSign changes
- ❌ Not validating the visual diff when a template changes
- ❌ Using `toEqual` on a monetary float value
- ❌ Writing an inline SELECT with `uown_gowsign_template` — wrong table; use the helper `getGowSignTemplatesForState`
- ❌ Detecting the GowSign iframe by `src*="gowsign.com"` — the host varies by env (sandbox = `gowsign-app-dev-uown.azurewebsites.net`); use the class `alternative-contract-vendor_iframe__nSb3A` or the substring `gowsign`
- ❌ Assuming `completeESign` covers only PandaDocs/SignWell — when the state has a GowSign template (e.g., NY), the lead routes to GowSign and requires the dedicated branch; don't confuse the resulting `TimeoutError` with timing flakiness

## Correlation of GowSign vendor enum ↔ `uown_esign_document.status` (vendor API ref 2026-06-23)

The GowSign vendor API (external contract in [`appendix-a-integracoes.md`](../../../docs/business-rules/appendix-a-integracoes.md) §GowSign Vendor API) exposes two vendor-specific enums that are NOT the internal `uown_esign_document.status` column — they belong to the vendor side:

- **vendor `status`:** `CREATED → OUTSTANDING → SIGNED → COMPLETED` (+ `EXPIRED`/`CANCELED`)
- **vendor `pdfStatus`:** `CREATED_PENDING/CREATED_GENERATED/SIGNED_PENDING/SIGNED_GENERATED/AUDIT_TRAIL_PENDING/AUDIT_TRAIL_GENERATED`

Correlation (`[HYPOTHESIS]` — name alignment, not confirmed by a cross-system trace):
- vendor `SIGNED`/`COMPLETED` ↔ internal progression `SIGNED → STORED → COMPLETED` (documented above). The internal `STORED` (`*_signed.pdf`) is the UOwn post-signature state; there is no `STORED` value in the vendor enum.
- Do not assert direct name equality between the vendor enum and the internal column — they live in different systems; use `uown_esign_document.status` (internal column) for test assertions, and the vendor `status`/`pdfStatus` only when inspecting the vendor API directly.

Source of the vendor enum: `[external-doc:postman/gowsign-api,2026-06-23]`. Canonical routing/template behavior does NOT live here (authority boundary) → see business-rules.

## Cross-links

- EPO 16-month templates registry (contract content by state) → [`appendix-h-epo-template-registry.md`](../../../docs/business-rules/appendix-h-epo-template-registry.md)
- GowSign vendor API (external contract: status/pdfStatus, bracket syntax, webhook) → [`appendix-a-integracoes.md`](../../../docs/business-rules/appendix-a-integracoes.md) §GowSign Vendor API
- Memory: `project_gosign_rollout`, `feedback_float_repr_not_bug`
- Skill [[ui-first-principle]] — basis of rule #14
- Skill [[dom-investigation]] — use MCP Playwright on the iframe
- Skill [[regression-suites-map]] — when to expand to the full suite
- Agent memory: `.claude/agent-memory/qa-planner/project_qa2_esign_routing.md` (if relevant)
