---
title: Origination Lead Detail — E-Sign / Sign Section (Modify Lease)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-26
sources:
  - code: src/pages/origination/customer.page.ts
  - test: tests/e2e/origination/modify-lease.spec.ts
  - test: tests/e2e/gowsign/gowsign-modify-lease-qa2.spec.ts
  - live-inspection: sandbox leads 98093/98094/98095 (MCP Playwright, 2026-06-26)
covers: [esign-section, lead-detail, modify-lease, lease-mod, contract-created, esign-provider, chargeProcessingFeeBeforeEsign, documents-panel, activity-log, action-bar]
promoted_to: []
---

# Origination Lead Detail — E-Sign / Sign Section (Modify Lease)

> **Charter:** document the E-Sign / Sign section of the Lead Detail action bar in the context of a lease modification that increases the invoice value (LEASE_MOD contract type). Covers button visibility per status, selector, label variants, `chargeProcessingFeeBeforeEsign` checkbox, Documents panel cascade, activity log expectations, and known pitfalls.
> **Companion docs:** [`origination-lead-detail-actions-and-invoice.md`](origination-lead-detail-actions-and-invoice.md) (modals + action-bar mechanics) · [`origination-customer-lead-detail-page.md`](origination-customer-lead-detail-page.md) (read view / panels) · [`16m-lease-and-gowsign-signwell-routing-qa2.md`](16m-lease-and-gowsign-signwell-routing-qa2.md) (provider routing).

---

## 1. Context: when does the E-Sign section become relevant?

After an agent increases a signed lease's invoice value via **Modify Lease**, the backend:

1. Transitions the lead internal status from `SIGNED` → `CONTRACT_CREATED`.
2. Auto-generates a `LEASE_MOD` contract (contract type) via `ContractService`.
3. Writes `"Sent Contract to customer"` to the activity log (backend auto-dispatch).

At this point the **E-Sign / Sign** section of the Lead Detail action bar becomes the agent's handle to re-trigger or monitor the signing flow.

**Key fact:** the backend sends the contract automatically on Modify Lease completion. The agent's E-Sign button is a **re-trigger / explicit dispatch** action, not the sole mechanism that sends the contract.

---

## 2. Button: label variants and selector

| Context | Label rendered in DOM | Evidence |
|---|---|---|
| Agent-initiated E-Sign on a freshly created CONTRACT_CREATED lead (non-embedded, after Modify Lease increase) | `E-Sign` | `customer.page.ts:54` [confirmed code] |
| Re-trigger when the e-sign was already auto-sent (e.g. embedded flow) | `Resend E-sign` | live MCP inspection 2026-06-26 sandbox |
| Lead status is `SIGNED` (contract already signed) | **Button absent** from the action bar | live MCP inspection 2026-06-26 sandbox leads 98094/98095 |

### Existing page-object getter (narrow regex)

```typescript
// customer.page.ts:54 — matches "E-Sign" only; does NOT match "Resend E-sign"
signContractButton = this.page.getByRole('button', { name: /^E[-\s]?Sign$/i });
```

### Recommended getter for new tests (broader regex)

```typescript
// Use this in new test methods — covers both label variants
isESignVisible = () =>
  this.page.getByRole('button', { name: /^(resend\s+)?e[-\s]?sign$/i }).isVisible();

clickESign = async () => {
  const btn = this.page.getByRole('button', { name: /^(resend\s+)?e[-\s]?sign$/i });
  await btn.scrollIntoViewIfNeeded();
  await this.page.evaluate(el => el.click(), await btn.elementHandle());
};
```

> **Why JS-dispatch?** Action bar buttons are off-screen-right at 1440×900 (render past x=1413). `scrollIntoViewIfNeeded` + `element.click()` via `page.evaluate` is the only reliable trigger. See the shared action-bar mechanics in [`origination-lead-detail-actions-and-invoice.md`](origination-lead-detail-actions-and-invoice.md) §Shared action-bar mechanics.

---

## 3. Button visibility per lead internal status

| Lead internal status | E-Sign button visible? | Source |
|---|---|---|
| `SIGNED` | **No** | live DOM 2026-06-26 sandbox lead 98095 [confirmed] |
| `CONTRACT_CREATED` (after Modify Lease increase) | **Yes** | live DOM 2026-06-26 sandbox lead 98094 [confirmed] |
| `UW_APPROVED` / `INVOICE_CREATED` / `CC_AUTH_PASSED` (no modification) | Not applicable — no LEASE_MOD contract exists | code + BR |
| Other statuses | `[HYPOTHESIS]` — not directly inspected | needs follow-up |

---

## 4. `chargeProcessingFeeBeforeEsign` checkbox

### What it controls

When `true`, the processing fee is charged as part of the signing trigger. This maps to the signing fee hierarchy (MAX of: `amountChargedAtSigning`, `processingFee`, `securityDeposit`, `protectionPlanFee`). Source: `docs/business-rules/03-contratos-esign.md §55` · `docs/business-rules/12-produto-lease-deep-dive.md §3.2`.

### Page-object selector

```typescript
// customer.page.ts:61 — declared but not exercised in any existing test as of 2026-06-26
chargeProcessingFee = this.page.locator("input[name='chargeProcessingFeeBeforeEsign']");
```

### Merchant-level flag

`chargeProcessingFeeBeforeEsign` is `false` by default. Standard UOWN merchants used in preflight have it set to `true` via `createOrUpdateMerchant`. This means:

- On standard test merchants: the checkbox is likely pre-checked / irrelevant to the agent's choice.
- The checkbox UI **may only appear for non-embedded merchants** where the agent manually triggers the E-Sign.

### [HYPOTHESIS] Render conditions

**Live DOM inspection (2026-06-26, sandbox leads 98093/98094):** the checkbox was **NOT found in the DOM** for `CONTRACT_CREATED` leads that went through the embedded (`WE_GET_FINANCING` API) flow. The processing fee was handled automatically inside the e-sign iframe.

**Current hypothesis:** the checkbox appears only when:
1. The lead is in `CONTRACT_CREATED` status after a **Modify Lease increase**.
2. The merchant has the `chargeProcessingFeeBeforeEsign` config flag enabled.
3. The flow is **not embedded** (agent manually triggers E-Sign from action bar).

> **Scenarios AC-05 / AC-06 remain `@pending`** until a follow-up `/discovery` confirms checkbox render in the correct context. Trigger: complete a full Modify Lease increase on a non-embedded merchant (including Invoice # field), navigate to the resulting `CONTRACT_CREATED` lead, inspect the E-Sign section.

---

## 5. `Get Document Status` button

| Attribute | Value | Evidence |
|---|---|---|
| Selector | `this.page.getByText('Get Document Status', { exact: true })` | `customer.page.ts:58` [confirmed code] |
| Purpose | Polls the e-sign provider for the latest document status and updates `esign_document.status` in DB | observed behavior |
| When to call in tests | After `clickESign()` — gives the backend time to process and reflects current status in the Documents panel | test pattern |

---

## 6. Documents → Lease panel cascade

After a Modify Lease increase and E-Sign trigger, the **Documents → Lease panel** in Lead Detail shows both contracts:

| Contract type | Expected status after E-Sign click | Expected status after customer signs |
|---|---|---|
| `LEASE` (original) | `SIGNED` | `SIGNED` (unchanged) |
| `LEASE_MOD` (modification) | `SENT` | `SIGNED` |

The `getLeasePanelContracts()` method (`customer.page.ts:1181-1254`) returns an array of `LeasePanelContract` objects. Use `.find(c => c.type === 'LEASE_MOD')` to assert the LEASE_MOD entry specifically.

---

## 7. Activity log expectations (Rule #13)

Every signing-related business action **MUST** have a corresponding entry in `uown_los_lead_notes` (activity log). The UI selector `activityLogEntry` does **not** match the Origination Lead Detail DOM — validate via DB only.

### Dispatch activity log (after E-Sign click)

Expected log pattern after the agent clicks E-Sign (contract dispatched to customer):

```sql
SELECT note FROM uown_los_lead_notes
WHERE lead_pk = :leadPk
  AND note ILIKE '%Sent Contract to customer%'
ORDER BY created_at DESC LIMIT 5;
```

Alternative patterns observed: `[EsignRedirectService]`, `[ContractService]`, `"Sent Contract to customer"`.

### Signing activity log (after customer signs)

Expected log pattern after `esign_document.status` transitions to `SIGNED`:

```sql
SELECT note FROM uown_los_lead_notes
WHERE lead_pk = :leadPk
  AND (note ILIKE '%signed%' OR note ILIKE '%isLeaseOrLeaseModSigned%')
ORDER BY created_at DESC LIMIT 5;
```

Expected patterns: `[EsignRedirectService][updateSignStatus]`, `[ContractService][isLeaseOrLeaseModSigned]`, status transition to `SIGNED`.

---

## 8. Post-signing lead status cascade

After the customer signs the LEASE_MOD contract:

1. `esign_document.status` → `SIGNED`.
2. Lead internal status → `SIGNED`.
3. Lead external status (displayed in UI) → `"Signed"`.
4. Documents panel: LEASE_MOD contract → `SIGNED`.

Source: `gowsign-modify-lease-qa2.spec.ts §MOD-01.1` · `docs/knowledge-base/alabama-gowsign-template.md §post-SIGNED LEASE_MOD cascade` [confirmed via existing specs].

---

## 9. Known pitfalls

### P1 — Invoice # field is REQUIRED in Modify Lease form

The Modify Lease form has a required `#invoiceNumber` field. If the `modifyLease()` callback does not fill it, the Save button silently does nothing (no error toast, no transition). Always fill Invoice # in any `modifyLease()` callback:

```typescript
await page.clickActionButton('Modify Lease');
await page.modifyLease(async () => {
  await page.fillInput('invoiceNumber', 'INV-TEST-001');  // REQUIRED
  await page.fillInput('invoiceAmount', '1500');
});
```

Source: `modify-lease.spec.ts:280-311` [confirmed] · live DOM 2026-06-26.

### P2 — `signContractButton` regex is too narrow for Resend E-sign

The existing `signContractButton` getter (`customer.page.ts:54`) uses `/^E[-\s]?Sign$/i` and will **not** match `Resend E-sign`. New tests that need to handle both states must use a broader regex (see §2 above).

### P3 — Action bar off-screen at 1440×900

All action bar buttons render past `x=1413` at the standard `1440×900` Origination viewport. Never use `page.click()` directly on these. Use the `scrollIntoView + element.click()` JS-dispatch pattern via `clickActionButton()` or equivalent. Source: `customer.page.ts:80-114` [confirmed].

### P4 — `chargeProcessingFeeBeforeEsign` checkbox may be absent in embedded flows

The checkbox was not rendered in the DOM for embedded-flow leads (2026-06-26 inspection). Do not assert it as `visible` without first confirming the merchant is non-embedded. Scenarios AC-05/AC-06 remain `@pending`.

### P5 — Backend auto-dispatches LEASE_MOD on Modify Lease save

The backend writes `"Sent Contract to customer"` to the activity log and sets the contract status to `SENT` automatically when Modify Lease saves (not when the agent clicks E-Sign). Asserting this state transition as an E-Sign action result can lead to false positives. Frame the assertion as "after E-Sign click, the LEASE_MOD contract is SENT" — correct regardless of which mechanism sent it.

---

## 10. Test coverage (as of 2026-06-26)

| Scenario | File | Status |
|---|---|---|
| E-Sign absent in SIGNED status (S1) | `tests/e2e/origination/lead-detail-esign-modify-lease.spec.ts` | NEW (wip/transfer) |
| E-Sign visible in CONTRACT_CREATED (S2) | `tests/e2e/origination/lead-detail-esign-modify-lease.spec.ts` | NEW (wip/transfer) |
| Click E-Sign → LEASE_MOD SENT + activity log (S3) | `tests/e2e/origination/lead-detail-esign-modify-lease.spec.ts` | NEW (wip/transfer) |
| chargeProcessingFee checkbox checked → fee charged (S4) | `tests/e2e/origination/lead-detail-esign-modify-lease.spec.ts` | `@pending` — needs follow-up discovery |
| chargeProcessingFee checkbox unchecked → no fee (S5) | `tests/e2e/origination/lead-detail-esign-modify-lease.spec.ts` | `@pending` — needs follow-up discovery |
| Customer signs LEASE_MOD → lead → SIGNED (S6) | `tests/e2e/origination/lead-detail-esign-modify-lease.spec.ts` | NEW (wip/transfer) |
| Modify Lease increase → CONTRACT_CREATED (existing) | `tests/e2e/origination/modify-lease.spec.ts` | existing |
| GowSign embedded signing of LEASE_MOD (existing) | `tests/e2e/gowsign/gowsign-modify-lease-qa2.spec.ts` | existing |
