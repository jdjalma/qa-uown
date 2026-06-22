# SPEC — Ohio GowSign Scenario 3: Contract Validation

> This file is a planning artifact (test SPEC), NOT an execution report and NOT a source of selector/helper patterns. Source of pattern = skills (`.claude/skills/`) + code (`src/`, `tests/`).

## Source

- **GitLab task:** `uown/backend` — "Add Ohio GowSign Template"
- **Scenario in scope:** Scenario 3 — Contract Validation (AC2, AC3, AC4; touches Scenario 4 state validation = OH)
- **Context primary sources (do not re-derive):** Fernando's OH 16-month SAC copy spec; confirmed defect on lead 16643 (Charles Miller, $662, MONTHLY); value oracle in `tests/api/__scratch_oh_item4_4a_oracle_svc546.spec.ts`; KB `docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md`
- **Sibling SPEC:** `docs/scenarios/ohio-gowsign-template.md` (overall task), `docs/scenarios/542-georgia-gowsign-template.md` (GA precedent)

---

## Scope

This scenario validates that the **rendered OH GowSign contract** (`OH_2025_SAC_16_MONTHS`) is correct in content, computed values, and dynamic-data population — for a 16-month SAC lease driven end-to-end to a signed state via the UOWN customer signing flow.

**IN:**

- **AC2 — content parity vs Signwell baseline.** Item 4 "Promotional-Payoff Option", Item 4a "Lease-Purchase Ownership", footnote `*with a Promotional Payoff option`, line "Early Purchase Option Available Off Unpaid Balance", and Appendix "EARLY PURCHASE OPTION" (16-month formula + brand phone) must be present and match Fernando's required OH 16m copy. *Why:* AC2 is the literal contract-text requirement; OH copy differs from GA/other states.
- **AC3 — calculated values / variable logic.** The 5 dynamic tokens (`{{costPriceWithFeeNoTax}}`, `{{totalNumberOfPayments}}`, `{{nextPaymentDueAmount}}`, `{{salesTax}}`, `{{contractAmount}}`) render the **oracle-computed** values within $0.01. *Why:* AC3 is the math correctness requirement; this is where the confirmed defect lives.
- **AC4 — dynamic contract data populated (no raw token leak).** No `{{...}}` placeholder survives un-substituted in the rendered PDF/iframe; every token resolves to a value. *Why:* AC4 is the "populated" requirement; the defect is a *blank* render of a token whose substitution returns empty — the inverse failure mode of a leaked `{{token}}`.
- **The confirmed-defect regression gate (heart of this test).** `{{nextPaymentDueAmount}}` must render **non-blank AND equal the oracle value** in Item 3 ("Regular MONTHLY lease rate is $___ plus tax") AND Item 4a ("16 payments of $___ plus $6.90"). Designed **across WEEKLY / BI_WEEKLY / MONTHLY** because the defect is suspected frequency-specific (observed MONTHLY blank; Signwell baseline = $11.28 on the reference lead). *Why:* this assertion is the entire reason the task exists — without it the test passes while the customer sees a blank rate.
- **State validation (Scenario 4 overlap).** Confirm the lead actually renders the OH template via `assertSelectedTemplateForLead(db, leadPk, 'OH_2025_SAC_16_MONTHS')`, and that no other state's copy/phone/EPO formula leaks in. *Why:* a wrong-template render would make every AC2/3/4 assertion test the wrong document.
- **Activity log of the signing event (Rule #13).** Signing completion produces a `uown_los_lead_notes` row. *Why:* no log = nothing happened.

**OUT (explicitly excluded):**

- **Scenario 1 — signing through the Origination portal (agent-driven).** Out: this SPEC drives the **customer** UOWN signing flow (`secure-qa2.uownleasing.com`). *Why:* Scenario 1 is a distinct entry path; mixing it here doubles the matrix and dilutes the value-render focus. Flag for a parallel `qa-implementer` if combined coverage is wanted.
- **Scenario 2 — partner portals (Kornerstone OMNIFUND `/complete` CC page).** Out: KS16775 OH renders the OH template but its CC page is kaptcha-blocked — not signable end-to-end with a standard card. *Why:* infra wall, not a content question; covering it here would force a non-deterministic UI.
- **SignWell→GowSign provider regression suite at large** (`tests/e2e/signing-regression/multi-state-signing.spec.ts`). *Why:* this SPEC is single-state (OH) content/value validation; full provider-parity regression is its own task. Noted as a downstream dependency below.
- **13-month program / non-16m terms.** Out: OH template in scope is the 16-month SAC. *Why:* the merchant recipe forces EligibleTerms 16 (sticky SSN `082390916`); 13m is not the artifact under test.
- **Email template / OTP rendering content.** Out: only the *signing-event activity log* is asserted, not email body parity. *Why:* email content is a separate AC family not listed for Scenario 3.

**AMBIGUOUS / Questions for PO — see "Open questions" at the end.**

---

## AC Coverage

| AC | Requirement | Covered by |
|----|-------------|------------|
| AC2 | Contract content vs Signwell baseline (Item 4, 4a, footnote, EPO line, Appendix EPO + phone) | CT-04 (content presence/copy), CT-06 (state-specific EPO formula/phone), dependency note on baseline parity |
| AC3 | Calculated values / variable logic correct | CT-02 (5 vars vs oracle), CT-03 (consistency invariant), CT-01 (per-frequency render) |
| AC4 | Dynamic contract data populated (no raw token) | CT-05 (no `{{...}}` leak), CT-01 (`{{nextPaymentDueAmount}}` non-blank regression) |
| Scn 4 (overlap) | State = OH | CT-00 (template-selection confirmation), CT-06 (no cross-state leak) |
| Rule #13 | Signing-event activity log | CT-07 (activity log presence + content) |

---

## Risk Analysis

| Area | Risk | Why | Coverage |
|------|------|-----|----------|
| `{{nextPaymentDueAmount}}` blank render | **CRITICAL** | Confirmed defect (lead 16643): renders blank in Item 3 + Item 4a on MONTHLY while Signwell baseline = $11.28. Customer signs a contract with a blank monthly rate — legal/compliance exposure. Suspected frequency-specific. | CT-01 (non-blank + oracle equality across WEEKLY/BI_WEEKLY/MONTHLY) — **gating** |
| Template routing (INSTORE/CA clone rendering OH) | **HIGH** | Clone is INSTORE/state=CA yet lead 16643 rendered the OH (customer-state) template — contradicts the documented "INSTORE routes by merchant state" rule. If routing is non-deterministic, every content assertion may test the wrong PDF. | CT-00 (assert selected template before trusting any render) |
| Value-math correctness (Item 4/4a) | **HIGH** | New template = new token bindings; a wrong binding (e.g. tax included where it shouldn't be) is invisible without computing the expected value from the backend invoice. | CT-02, CT-03 (oracle + consistency invariant) |
| Content parity vs Signwell baseline | **MEDIUM** | qa2 OH is *always* GowSign → no live Signwell OH to diff against; true parity depends on a stg Signwell OH or a captured baseline PDF (dependency). Copy drift (footnote wording, EPO formula) is the residual risk. | CT-04, CT-06 (vs Fernando's spec text), parity dependency noted |
| Raw-token leak (AC4 inverse) | **MEDIUM** | A binding that fails could leak `{{token}}` literally (vs blank). UI-first render is the only detector. | CT-05 |
| Cross-state leak (wrong EPO formula/phone) | **MEDIUM** | OH Appendix has a 16-month-specific formula + `{{companyInfoBrandPhone}}`; a generic template could render another state's phone/formula. | CT-06 |
| Signing-event observability | **MEDIUM** | Rule #13 — absent log = silent failure even if UI shows "signed". | CT-07 |
| Float comparison false-positive | LOW | `11.28` vs `11.2799999` is IEEE-754, not a bug (gowsign-knowledge pitfall #3). | All money asserts use `$0.01` tolerance / `toBeCloseTo(…, 2)` |

---

## Test Strategy

- **Approach:** **Hybrid** — API setup (fast, deterministic) → **UI customer signing** (real render) → **PDF/iframe read** (the decisive content+value check) → DB validation (template selection + activity log).
- **Justification (Rule #14, UI-first):** the feature has a customer-facing render. The confirmed defect is precisely a *rendering* bug — `{{nextPaymentDueAmount}}` resolves on the backend invoice (the oracle proves the value exists) but renders **blank** in the PDF. This is the exact failure class that API-only/log-only testing hides (origin of Rule #14: BUG-01, Daniel's CA empty placeholders). **The decisive check is opening the rendered PDF and reading Item 3 / Item 4 / Item 4a — never backend logs or DB status alone.** API is restricted to: (a) lead setup via the application lifecycle, (b) the value oracle (`sendInvoice.paymentDetailsList`), (c) DB assertion queries (template selection, activity log).
- **Test-data hierarchy:** fresh lead per run via the realistic factory — `randomApplicant({ state: 'OH', ssn: 'sticky16m' })` + `randomLineItems({ category: categoryForMerchant('DANIELS_JEWELERS'), total })`, proven-good Bucyrus OH address. No reuse of lead 16643 (that lead is the *reference observation*, not the *test fixture*). Single approved lead + a loop of `sendInvoice` across subtotals/frequencies avoids the velocity/blacklist DENIED of creating many leads (pattern proven in the oracle scratch).
- **Environment:** **qa2** — required. qa2 forces the OH GowSign route on the Daniel's clone and its UOWN signing page accepts `MASTERCARD_APPROVED` (no Kornerstone kaptcha wall). Per memory `qa2-16m-eligibility-kornerstone-route`, sticky SSN `082390916` forces EligibleTerms 16 on this recipe.
- **Suites to (potentially) activate downstream:** `gowsign-contract-content*` + `gowsign-signature-fields` per gowsign-knowledge ("Mudança em template → todo `gowsign-contract-content*`"); `signing-regression/multi-state-signing` if PO wants OH added to the multi-state matrix. These are **out of scope for this SPEC** but listed for the orchestrator.
- **Money comparison rule:** all monetary asserts use `$0.01` tolerance (`toBeCloseTo(value, 2)` or `Math.abs(a-b) <= 0.01`) — gowsign-knowledge pitfall #3 (never `toEqual` on float).

### Oracle (how expected values are computed — NOT by re-implementing the formula)

From `api.invoice.sendInvoice(...).paymentDetailsList[freq]` (confirmed mapping in `tests/api/__scratch_oh_item4_4a_oracle_svc546.spec.ts`):

| Token | Oracle source |
|-------|---------------|
| `{{costPriceWithFeeNoTax}}` (Item 4) | `merchandiseSubtotal + processingFee` (≈ subtotal + `paymentDueToday`) |
| `{{totalNumberOfPayments}}` (Item 4a) | `numberOfPayments` |
| `{{nextPaymentDueAmount}}` (Item 3 + 4a) | `firstPaymentWithFeesNoTax` |
| `{{salesTax}}` (Item 4a) | `regularPaymentWithTax − nextPaymentDueAmount` |
| `{{contractAmount}}` (Item 4a) | `totalContractAmountWithTax` |

Consistency invariant: `numberOfPayments × regularPaymentWithTax + processingFee ≈ contractAmount (±$0.01)`.
Verified reference ($662 MONTHLY): costPrice=711, 16 payments, nextPayment=95.16, salesTax=6.90, contractAmount=1681.99 — matches Charles' rendered contract. (Note: the $11.28 blank is the per-payment monthly *rate* token in Item 3 copy "Regular MONTHLY lease rate is $___"; assert it resolves to its oracle value, non-blank.)

---

## Preconditions

1. **Merchant config (Rule #12 preflight).** The Daniel's clone `OL90205-0079_clone` (user `danielsJewelers` / `U0wn_danielsJewelers_CnRKhJ`) must match `src/data/merchant-config-contract.ts` for the 16m program. Because this test **creates a new application**, preflight applies. Use the standard `ensureMerchantReady` path (or `createPreQualifiedApplication` which calls it). Do NOT pass `skipMerchantPreflight` — we are originating, not mutating an existing lease.
2. **Template-selection confirmation (BLOCKING — gates trust in routing).** Before reading any contract content, assert `assertSelectedTemplateForLead(db, leadPk, 'OH_2025_SAC_16_MONTHS')` (`src/helpers/gowsign-template-db.helpers.ts`). This resolves the INSTORE open question: the clone is INSTORE/state=CA yet the reference lead rendered the OH (customer-state) template, contradicting the documented "INSTORE routes by merchant state" rule. **If the assertion fails, STOP and report** — the routing premise is broken and content assertions would test the wrong document.
3. **Customer state = OH** with a **fresh randomized OH address** (`randomApplicant({ state: 'OH' })` / `randomAddress('OH')`) + a fresh approving SSN. **⚠️ STALE (2026-06-22):** the once-pinned "proven-good Bucyrus OH address `1875 N Sandusky Ave, Bucyrus, 44820`" was **manually blacklisted** (`uown_los_black_list` pk 2191/2196, 2026-06-19) → pre-UW denial at the blacklist step. NEVER hard-pin it. Note also (svc#546, 2026-06-22): on this 16m-only clone (Route B) EligibleTerms 16 comes from the **merchant program**, not the SSN suffix — any approving SSN yields 16m; the sticky `082390916` is NOT required (and a SIGNED run on a fixed SSN triggers FutureFpdCheckStep denial on the next run — use a fresh SSN per signing run). See [[application-lifecycle]] #132/#133/#134, [[ssn-test-modalities]] Route B.
4. **Signing environment = qa2 UOWN portal** (`secure-qa2.uownleasing.com`), which accepts `MASTERCARD_APPROVED`. Avoid Kornerstone KS16775 (kaptcha `/complete` wall).
5. **Baseline source for AC2 parity (dependency — see Open Questions).** qa2 OH is always GowSign, so there is no live Signwell OH to diff against. True content parity needs **either** a stg Signwell OH render **or** the captured baseline PDF (the Signwell $11.28 reference). Until one is provided, AC2 is validated against **Fernando's required OH 16m copy spec** (text presence/wording), not a byte/visual diff vs a live Signwell render.

---

## Test Design — techniques applied

- **Equivalence Partitioning + seeded regression — payment frequency.** Partitions = {WEEKLY, BI_WEEKLY, MONTHLY}. The system computes values per frequency; the defect is *suspected frequency-specific* (MONTHLY observed blank). Therefore MONTHLY is not just a partition representative — it is a **seeded regression case** (known historical bug → explicit case, per test-design-techniques heuristic). All three frequencies are exercised for `{{nextPaymentDueAmount}}` render.
- **Decision Table (lightweight) — template routing.** Causes: merchant origination type (INSTORE), merchant state (CA), customer state (OH), EligibleTerms (16). Effect: selected template. The observed effect (`OH_2025_SAC_16_MONTHS`) contradicts the documented rule → CT-00 verifies the actual effect rather than the documented one.
- **Use Case + consequence oracle (check-points) — the render.** Each "Then" lands where the *customer* actually reads the value (Item 3 rate, Item 4 promo payoff, Item 4a payments) — not a generic "contract looks fine". An action (signing) is complete only when the consequence (correct rendered values + persisted signing log) is confirmed at the user's check point.
- **Error Guessing — float repr, raw-token leak, cross-state leak.** Seeded as CT-03/CT-05/CT-06.

---

## Test Cases (prioritized)

### CT-00 — Template-selection confirmation (PRECONDITION GATE) `[reflex: routing]`
- **Technique:** Decision table (verify actual routing effect).
- **Persona:** N/A (setup integrity).
- **Setup:** API lifecycle to a CONTRACT_CREATED/signable state on `OL90205-0079_clone`, customer OH, sticky SSN, EligibleTerms 16.
- **Steps:** 1) Drive lead to signable. 2) `assertSelectedTemplateForLead(db, leadPk, 'OH_2025_SAC_16_MONTHS')`.
- **Validations (consequence oracle):**
  - DB: `uown_esign_document` selected template_name = `OH_2025_SAC_16_MONTHS` for `leadPk`, `client` = expected GowSign client.
- **Gate:** if NOT OH template → **STOP / report** (resolves INSTORE open question; routing premise broken).
- **Pitfalls considered:** `uown_gow_sign_template` vs `uown_gowsign_template` (use helper); esign status enum `STORED`/`SENT_TO_CUSTOMER`/`COMPLETED` not `SENT`/`SIGNED`.

### CT-01 — `{{nextPaymentDueAmount}}` non-blank + oracle equality across 3 frequencies (CRITICAL REGRESSION GATE) `[reflex: document]`
- **Technique:** EP (3 frequency partitions) + seeded regression (MONTHLY).
- **Persona:** returning/new customer signing on the UOWN customer portal.
- **Setup:** one approved lead; per frequency, `sendInvoice` to capture oracle `firstPaymentWithFeesNoTax`; drive the signing flow that renders the OH contract for that frequency.
- **Steps:** 1) For each freq ∈ {WEEKLY, BI_WEEKLY, MONTHLY}: open the rendered GowSign PDF/iframe via the customer signing flow. 2) Read Item 3 ("Regular {FREQ} lease rate is $___ plus tax") and Item 4a ("N payments of $___ plus $X.XX").
- **Validations (consequence oracle — UI render is decisive, Rule #14):**
  - **UI/PDF:** the `{{nextPaymentDueAmount}}` slot in **Item 3** is non-empty AND `toBeCloseTo(oracle.firstPaymentWithFeesNoTax, 2)`.
  - **UI/PDF:** the same slot in **Item 4a** is non-empty AND equals the same oracle value (±$0.01).
  - **Negative anchor:** the slot text is NOT empty/whitespace and NOT a literal `{{nextPaymentDueAmount}}`.
  - MONTHLY reference cross-check: matches the Signwell baseline value ($11.28 on the reference cart) when the baseline PDF is available.
- **Edge cases covered:** frequency-specific divergence (the suspected root cause); blank-vs-leaked-token distinction.
- **Pitfalls considered:** iframe detection by class `alternative-contract-vendor_iframe__nSb3A` / substring `gowsign` (host varies by env — gowsign-knowledge pitfall #7); float tolerance; reuse `signGowSignInFrame` (do not recreate ceremony).

### CT-02 — The 5 dynamic variables vs oracle (Item 4 / 4a) `[reflex: document]`
- **Technique:** EP per token + oracle comparison (AC3).
- **Persona:** customer reading the contract before signing.
- **Setup:** the same lead/invoice; capture oracle for all 5 tokens at one representative subtotal (e.g. $662) and frequency.
- **Steps:** 1) Open rendered PDF. 2) Read Item 4 (`costPriceWithFeeNoTax`) and Item 4a (`totalNumberOfPayments`, `nextPaymentDueAmount`, `salesTax`, `contractAmount`).
- **Validations:**
  - UI/PDF: each of the 5 rendered values `toBeCloseTo` (money) / `===` (count, for `totalNumberOfPayments`) its oracle value.
  - Reference anchor ($662 MONTHLY): costPrice≈711, payments=16, nextPayment≈95.16, salesTax≈6.90, contractAmount≈1681.99.
- **Edge cases covered:** wrong tax binding (tax included where it shouldn't be), count off-by-one.
- **Pitfalls considered:** float repr; `salesTax` is a derived diff, not a direct field — compute via oracle formula.

### CT-03 — Value consistency invariant `[reflex: document]`
- **Technique:** Cross-field invariant (cause-effect, lightweight).
- **Setup:** oracle values from CT-02.
- **Steps:** assert `numberOfPayments × regularPaymentWithTax + processingFee ≈ contractAmount (±$0.01)`.
- **Validations:** invariant holds on the rendered values (not only on the backend oracle) — proves the rendered numbers are internally coherent, not just individually plausible.
- **Why:** catches a token-binding swap that keeps each value "reasonable" but breaks the sum.

### CT-04 — OH 16m content presence / copy parity vs Fernando's spec (AC2) `[reflex: document]`
- **Technique:** Use-case content checklist.
- **Persona:** customer / compliance reviewer.
- **Steps:** open rendered PDF; assert presence + wording of:
  - Item 4 "Promotional-Payoff Option" (contains `{{costPriceWithFeeNoTax}}` resolved).
  - Item 4a "Lease-Purchase Ownership" (the 4 tokens resolved).
  - Footnote `*with a Promotional Payoff option`.
  - Line "Early Purchase Option Available Off Unpaid Balance".
  - Appendix "EARLY PURCHASE OPTION" header present.
- **Validations:** each string present and matching Fernando's OH 16m copy (exact wording where specified).
- **Dependency:** byte/visual diff vs a live Signwell OH is **not** possible on qa2 (always GowSign) — see parity dependency. This CT validates against the spec text; full Signwell visual diff is gated on a baseline source.

### CT-05 — No raw-token leak (AC4) `[reflex: document]`
- **Technique:** Error guessing (inverse failure of the defect).
- **Steps:** scan the full rendered PDF/iframe text for any surviving `{{...}}` pattern.
- **Validations:** zero matches of `/\{\{[^}]+\}\}/` in the rendered document.
- **Why:** AC4 "dynamic data populated" fails two ways — blank (CT-01) and literal-leak (this CT).

### CT-06 — State-specific EPO formula + brand phone, no cross-state leak (AC2 + Scn 4) `[reflex: document]`
- **Technique:** Decision table (state → EPO formula/phone).
- **Steps:** read Appendix "EARLY PURCHASE OPTION" (16-month formula) and the `{{companyInfoBrandPhone}}` slot.
- **Validations:**
  - The 16-month EPO formula matches the OH spec.
  - `{{companyInfoBrandPhone}}` resolves to the correct brand phone (non-blank, not a placeholder).
  - No other state's phone/formula/copy appears (cross-state leak guard).
- **Why:** a generic template would render the wrong state's EPO appendix while still passing CT-04.

### CT-07 — Signing-event activity log (Rule #13) `[reflex: signing]`
- **Technique:** State transition side-effect.
- **Steps:** complete the signing ceremony (`signGowSignInFrame`); after `completed` postMessage, poll the log.
- **Validations:**
  - DB: `uown_los_lead_notes` row for `lead_pk`, `row_created_timestamp >= triggerTs`, `notes ILIKE '%[ContractService]%'` (signing/contract service prefix) — presence **and** content.
  - DB: `uown_esign_document.status = 'COMPLETED'` (NOT `SIGNED`/`document_status`).
  - **Negative:** if signing did NOT reach `completed`, the COMPLETED row must be absent (no false-green).
- **Pitfalls considered:** async log latency (use `waitForRecord` with backoff); esign status enum; TZ drift on timestamp filter (prefer PK-monotonic / `AT TIME ZONE`).

---

## Out-of-scope decisions

- **Scenario 1 (Origination-portal agent signing)** — excluded; different entry path. If combined coverage is desired, dispatch a parallel `qa-implementer` reusing CT-02..CT-06 against the Origination signing render.
- **Scenario 2 (partner/Kornerstone portals)** — excluded; KS16775 `/complete` is kaptcha-blocked, not signable end-to-end with a standard card.
- **Full SignWell→GowSign provider-parity regression** — excluded; this is single-state OH content/value validation. Downstream dependency, not this SPEC.
- **13m program / non-16m terms** — excluded; recipe forces 16m.
- **Email/OTP body content** — excluded; only the signing-event log is asserted.

---

## Dependencies

- **Signwell-baseline parity (BLOCKING for a true AC2 visual diff).** qa2 OH always routes GowSign → no live Signwell OH to diff against. A genuine content-parity diff requires **either** a stg Signwell OH render **or** the captured Signwell baseline PDF (the $11.28 reference). Until provided, AC2 is validated against Fernando's OH 16m copy spec (text), and CT-01's MONTHLY reference cross-check against $11.28 uses the captured baseline value, not a live render.
- **Merchant config preflight** must pass on `OL90205-0079_clone` (16m program) before origination.
- **qa2 DB tunnel stability** (application-lifecycle pitfall #113 — transient infra; re-probe before classifying a DB-read failure as drift/bug).

---

## Open questions

- **Q1 — INSTORE routing contradiction. ✅ RESOLVED (svc#546, qa2, 2026-06-22).** The clone routes the template by **CUSTOMER state**, not the store state CA: customer OH → `OH_2025_SAC_16_MONTHS`. `[CONFIRMADO]` across leads 16865/16866/16867 — this is the intended effect, not an artifact of lead 16643. The older "INSTORE routes by merchant state" note is stale for this clone and has been corrected in [[ssn-test-modalities]] (Route B / customer-state routing) and [[volatile-knowledge-registry]] §17 (Rule #11 satisfied). CT-00 remains the gate that asserts the actual selected template.
- **Q2 — Baseline source for AC2.** Will PO provide a stg Signwell OH environment or the captured Signwell baseline PDF for a true visual/byte parity diff? Without it, AC2 is text-spec validation only.
- **Q3 — Defect scope: frequency-specific vs global.** Is `{{nextPaymentDueAmount}}` blank only on MONTHLY (as observed) or also on WEEKLY/BI_WEEKLY? CT-01 answers empirically across all three; PO should confirm the expected fix covers all frequencies.
- **Q4 — `{{nextPaymentDueAmount}}` in Item 3 vs Item 4a.** Confirm both slots bind the same token/value (the SPEC assumes they do; the oracle is single-valued per frequency). If Item 3 is the per-period *rate* ($11.28) and Item 4a is the *payment* ($95.16), they bind different oracle fields — clarify the token mapping for Item 3 specifically.

---

**Ready for:** `qa-implementer`

**Skills loaded:** `.claude/skills/gowsign-knowledge/SKILL.md`, `.claude/skills/ui-first-principle/SKILL.md`, `.claude/skills/application-lifecycle/SKILL.md`, `.claude/skills/test-design-techniques/SKILL.md`, `.claude/skills/check-points/SKILL.md`, `.claude/skills/qa-domain-reflexes/SKILL.md`, `.claude/skills/acceptance-criteria-review/SKILL.md`, `.claude/skills/activity-log-validation/SKILL.md`
