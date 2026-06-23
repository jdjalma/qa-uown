/**
 * RU06.26.1.53.0_improveMultiSelectOnMerchantLocationFields
 *
 * Improve Multi-select on Merchant/Location Fields — Origination.
 * Follow-up to #1292 (R1.52.0): #1292 shipped the multi-select Merchant/Location
 * filter with CLOSE-ON-PICK UX. This task INVERTS that — the dropdown now STAYS OPEN
 * after a pick, supports multi-pick WITHOUT reopening, and floats selected options
 * to the TOP (most-recent-first).
 *
 * SPEC (authoritative):
 *   docs/taskTestingUown/RU06.26.1.53.0_improveMultiSelectOnMerchantLocationFields/
 *   RU06.26.1.53.0_improveMultiSelectOnMerchantLocationFields-spec.md
 *
 * NOTE — this file is EXECUTION CODE. The execution record/report lives in the
 * sibling `-report.md` (owned by qa-validator), NOT here.
 *
 * Strategy: UI-first E2E, no API, no DB (Rule #14). Open-state and option order
 * are observable ONLY in the rendered DOM — a backend log cannot prove the dropdown
 * stayed open or that selected options floated to the top. This is the canonical
 * "rendering/interaction → UI obligatory" case.
 *
 * Rule exceptions (justified per SPEC §"Rule exceptions"):
 *   - Rule #12 (merchant preflight) SKIPPED — no application/lead/merchant created
 *     or mutated; the test only READS the existing merchant roster in a dropdown.
 *     Running preflight would mutate out-of-scope merchant config (a side effect).
 *   - Rule #13 (activity log) N/A — filtering a list view is a navigation/read
 *     action, not a business action (no signing/payment/status-transition). No
 *     `uown_los_lead_notes` assertion applies. (Documented exception in
 *     [[activity-log-validation]], reaffirmed by the #1292 spec.)
 *   - Rule #9 (Test Data Hierarchy) — existing-data consumption is the EXCEPTION,
 *     justified: the feature is a READ-ONLY filter over the live merchant roster.
 *     There is no "fresh" equivalent of the production roster to create, and
 *     creating leads would not exercise the dropdown behavior. Consumption is
 *     read-only (no mutation) → the inherited-mutated-state risk does not apply to
 *     the behavior under test (dropdown open-state/order is a function of the
 *     component, not of row data). Hence runId/email are intentionally omitted.
 *
 * Environment: stg (user-mandated, DoD-grade). The SPEC §0 gate proved the feature IS
 * deployed in stg. CTs `test.skip` outside stg (the 6885-roster + deployment are
 * stg-specific; mirrors the #1292 env-guard pattern).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import {
  LeadsPage,
  OpenToBuyPage,
  MerchantLocationFilterPO,
} from '@pages/origination/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';

const TEST_NAME = 'RU06.26.1.53.0_improveMultiSelectOnMerchantLocationFields';

// Existing-data consumption (Rule #9 exception — justified in the file header):
// read-only filtering over the live stg merchant roster. No application created →
// runId/email intentionally omitted. env is stg per the SPEC (user override of the
// milestone env to DoD-grade stg).
const testData = {
  env: 'stg' as const,
  // `@origination` is required by the task-testing-origination Playwright project
  // (grep: /@origination/) so this spec loads the Origination baseURL + storageState.
  tag: `${buildTags(TestTag.REGRESSION, TestTag.STG)} @origination`,
};

// ── Narrow strategy (F-001 fix, DOM-proven stg 2026-06-23, 1440×900) ───────────
//
// The Merchant combobox narrows by matching the typed term against the option TEXT
// (prefix/substring), NOT by a leading-character scan. DOM-first measurement on stg:
//   - A single short char ('a' / 'A' / 'Fu') matches ZERO options — react-select's
//     filter requires the term to appear in a merchant name and very short fragments
//     surface nothing. The previous adaptive seed ('a' + char-append) therefore
//     returned an EMPTY set and `pickFirstNDistinct` produced 0 picks (the spec then
//     failed at `distinct.length >= 2`). It was never the per-element read that the
//     report saw last — that read-loop bug is fixed in the page object; this is the
//     SECOND test-code defect: the seed itself.
//   - A stable CATEGORY word that is dominant in the lease roster matches THOUSANDS of
//     merchants with a DETERMINISTIC leading order: 'Furniture'→2249, 'Mattress'→998,
//     'Tire'→532, each with identical lead-5 across repeated narrows.
//   - The page object's `narrowTo`/`getRenderedOptionOrder` cap the batched
//     `allInnerTexts()` read at a leading window (default 50/20), so even a 2249-node
//     match is a single ~60ms round-trip sliced to the leading window — no timeout.
//
// We therefore narrow with a SMALL ORDERED LIST of stable category terms (robust to
// single-term roster drift — F-002), taking the first one that surfaces ≥ `count`
// distinct options. No hardcoded merchant NAMES — only category words that are
// structurally guaranteed to be present in a furniture/mattress/tire lease roster.
const NARROW_TERMS = ['Furniture', 'Mattress', 'Tire'] as const;

/**
 * Narrow the dropdown to the first stable category term that surfaces ≥ `count`
 * DISTINCT options, then return those picks. Keeps the dropdown OPEN (`narrowTo` does
 * not close). Returns the term used + the picks so the caller can re-narrow to the
 * SAME set later for the selected-on-top read (AC3). No hardcoded merchant names; the
 * category terms are roster-structural and drift-resilient (tries the next on miss).
 */
async function pickFirstNDistinct(
  filter: MerchantLocationFilterPO,
  label: string,
  count: number,
): Promise<{ term: string; distinct: string[] }> {
  let lastTerm = NARROW_TERMS[0];
  for (const term of NARROW_TERMS) {
    lastTerm = term;
    const visible = await filter.narrowTo(label, term);
    const distinct: string[] = [];
    for (const t of visible) {
      if (!distinct.includes(t)) distinct.push(t);
      if (distinct.length >= count) break;
    }
    if (distinct.length >= count) return { term, distinct };
  }
  // No stable term surfaced enough distinct options — return what the last term gave
  // (the caller's `expect(distinct.length).toBeGreaterThanOrEqual(2)` will surface it).
  const visible = await filter.narrowTo(label, lastTerm);
  const distinct: string[] = [];
  for (const t of visible) {
    if (!distinct.includes(t)) distinct.push(t);
    if (distinct.length >= count) break;
  }
  return { term: lastTerm, distinct };
}

/** Asserts that every `selected` text occupies one of the leading indices of `order`. */
function assertSelectedOnTop(order: string[], selected: string[]): void {
  const topWindow = order.slice(0, selected.length);
  for (const sel of selected) {
    expect(
      topWindow,
      `Selected option "${sel}" must be in the leading ${selected.length} rendered ` +
        `options (selected-on-top, AC3). Got top window: ${JSON.stringify(topWindow)}`,
    ).toContain(sel);
  }
}

test.describe(`${TEST_NAME} - ${testData.env}`, { tag: splitTags(testData.tag) }, () => {
  test.use({ envName: testData.env });

  test.beforeEach(({ testEnv }) => {
    test.skip(
      testEnv.env !== 'stg',
      'stay-open multi-select is deployed + roster-proven in stg only — skip elsewhere',
    );
  });

  // ───────────────────────────────────────────────────────────────────────
  //  CT-01 — Leads: stay-open, multi-pick without reopen, selected-on-top (P0)
  // ───────────────────────────────────────────────────────────────────────
  test('CT-01 — Leads: dropdown stays open, multi-pick no reopen, selected-on-top @smoke @regression', async ({ page, testEnv }) => {
    test.setTimeout(120_000);
    const leads = new LeadsPage(page);
    const filter = new MerchantLocationFilterPO(page);
    const picked: string[] = [];
    let narrowTerm: string = NARROW_TERMS[0];

    await test.step('Navigate to Leads and open the filter panel', async () => {
      await leads.navigateAndWaitForTable(testEnv.originationUrl);
      await filter.openFilterPanel();
    });

    await test.step('Open Merchant dropdown — it is open (AC1 baseline)', async () => {
      await filter.openDropdown('Merchant');
      expect(await filter.isDropdownOpen(), 'Merchant dropdown should be open after openDropdown').toBe(true);
    });

    await test.step('Pick 2 distinct merchants by selective type-to-narrow — menu STAYS OPEN (AC1/AC2), options checked (AC4)', async () => {
      // Selective progressive narrow → first 2 distinct from a SMALL set (F-001 fix:
      // never read/scroll the 5166-node broad roster). `narrowTerm` is the small term
      // that surfaced these picks; re-used below to read the reordered set.
      const { term, distinct } = await pickFirstNDistinct(filter, 'Merchant', 2);
      narrowTerm = term;
      expect(distinct.length, 'stg roster must surface ≥2 distinct narrowed merchants').toBeGreaterThanOrEqual(2);
      const [first, second] = distinct;

      // Pick #1 — menu must stay open + option checked (asserted internally too).
      await filter.selectOptionsKeepingOpen('Merchant', [first!]);
      picked.push(first!);
      expect(await filter.isDropdownOpen(), 'Menu must stay open after pick #1 (AC1)').toBe(true);
      expect(await filter.isOptionChecked('Merchant', first!), `"${first}" must be checked (AC4)`).toBe(true);

      // Pick #2 WITHOUT reopening — menu must still be open before AND after (AC2).
      expect(await filter.isDropdownOpen(), 'Menu must still be open before pick #2 (no reopen, AC2)').toBe(true);
      await filter.selectOptionsKeepingOpen('Merchant', [second!]);
      picked.push(second!);
      expect(await filter.isDropdownOpen(), 'Menu must stay open after pick #2 (AC2)').toBe(true);
      expect(await filter.isOptionChecked('Merchant', second!), `"${second}" must be checked (AC4)`).toBe(true);
    });

    await test.step('Both selected merchants float to the TOP of the rendered list (AC3)', async () => {
      // F-003 fix: do NOT re-narrow here. `narrowTo` does `input.fill('')`+retype,
      // and react-select CLEARS the committed multi-selection on search-input reset
      // (DOM-proven stg 2026-06-23) — re-narrowing would wipe both picks and the
      // count assertion below would read 0. The menu is ALREADY open with the narrowed
      // "Furniture" list still rendered and the 2 picks floated to the top, so we read
      // the CURRENT rendered order directly (capped leading window — no full-roster read).
      void narrowTerm; // retained for symmetry; intentionally not re-typed (F-003)
      const order = await filter.getRenderedOptionOrder('Merchant');
      // Order-insensitive within the selected block (SPEC OQ-01 [ASSUNÇÃO]).
      assertSelectedOnTop(order, picked);
    });

    await test.step('Selected count reflects 2 picks', async () => {
      expect(await filter.getMerchantSelectedCount(), 'Two merchants should be selected').toBe(2);
    });

    // DB: none (read-only filter — see file-header Rule #9 exception).
    // Activity log: N/A (navigation/read action, not a business action — Rule #13 exception).
  });

  // ───────────────────────────────────────────────────────────────────────
  //  CT-02 — Open To Buy (REACTIVE-apply): stay-open + reorder (P0)
  // ───────────────────────────────────────────────────────────────────────
  test('CT-02 — Open To Buy: stay-open + selected-on-top on the reactive-apply variant @regression', async ({ page, testEnv }) => {
    test.setTimeout(120_000);
    const otb = new OpenToBuyPage(page);
    const filter = new MerchantLocationFilterPO(page);
    const picked: string[] = [];
    let narrowTerm: string = NARROW_TERMS[0];

    await test.step('Navigate to Open To Buy and open the filter panel', async () => {
      await otb.navigateToOpenToBuy(testEnv.originationUrl);
      await filter.openFilterPanel();
    });

    await test.step('Open Merchant dropdown — it is open', async () => {
      await filter.openDropdown('Merchant');
      expect(await filter.isDropdownOpen(), 'OTB Merchant dropdown should be open').toBe(true);
    });

    await test.step('Pick 2 distinct merchants keeping the menu open (AC1/AC2)', async () => {
      // Selective progressive narrow (F-001 fix) → first 2 distinct from a SMALL set.
      const { term, distinct } = await pickFirstNDistinct(filter, 'Merchant', 2);
      narrowTerm = term;
      expect(distinct.length, 'OTB Merchant dropdown must surface ≥2 distinct options').toBeGreaterThanOrEqual(2);

      // selectOptionsKeepingOpen opens ONCE and picks both without reopening,
      // asserting menu-open + checked after EACH pick internally.
      await filter.selectOptionsKeepingOpen('Merchant', distinct);
      picked.push(...distinct);

      expect(await filter.isDropdownOpen(), 'Menu must stay open across both OTB picks (AC1/AC2)').toBe(true);
    });

    await test.step('Both selected merchants float to the TOP (AC3)', async () => {
      // F-003 fix: do NOT re-narrow (it would wipe the committed picks — react-select
      // clears values on search-input reset). The menu is already open with the
      // narrowed list rendered and the picks floated to the top — read it directly.
      void narrowTerm; // retained for symmetry; intentionally not re-typed (F-003)
      const order = await filter.getRenderedOptionOrder('Merchant');
      assertSelectedOnTop(order, picked);
    });

    await test.step('Reactive-apply settles without a server error (OTB has no Search button)', async () => {
      // OTB applies reactively on dropdown interaction; the #1292 history shows this
      // close/settle path is where the widget broke twice. Close the menu to let the
      // reactive apply fire, then confirm no Internal Server Error banner.
      await filter.applySearch(); // no-op on reactive pages except the settle wait
      const noServerError = await page.locator('text=Internal Server Error')
        .isVisible({ timeout: 500 })
        .catch(() => false);
      expect(noServerError, 'No server error after reactive apply with stay-open flow').toBe(false);
    });

    // DB: none. Activity log: N/A (read action).
  });

  // ───────────────────────────────────────────────────────────────────────
  //  CT-03 — Leads: applied multi-filter results match selection + deselect-open (P1)
  // ───────────────────────────────────────────────────────────────────────
  test('CT-03 — Leads: applied multi-filter results match selection + deselect-while-open @regression', async ({ page, testEnv }) => {
    test.setTimeout(120_000);
    const leads = new LeadsPage(page);
    const filter = new MerchantLocationFilterPO(page);
    const picked: string[] = [];

    await test.step('Navigate to Leads and open the filter panel', async () => {
      await leads.navigateAndWaitForTable(testEnv.originationUrl);
      await filter.openFilterPanel();
    });

    await test.step('Pick 2 distinct merchants keeping the menu open', async () => {
      await filter.openDropdown('Merchant');
      const { distinct } = await pickFirstNDistinct(filter, 'Merchant', 2);
      expect(distinct.length, 'Leads Merchant dropdown must surface ≥2 distinct options').toBeGreaterThanOrEqual(2);

      await filter.selectOptionsKeepingOpen('Merchant', distinct);
      picked.push(...distinct);
      expect(await filter.getMerchantSelectedCount(), 'Two merchants selected').toBe(2);
    });

    await test.step('Toggle ONE merchant OFF while the menu stays open (AC4 deselect path)', async () => {
      const toRemove = picked[picked.length - 1]!;
      // F-003 fix: do NOT re-narrow to surface the option — it would wipe BOTH committed
      // picks (react-select clears values on search-input reset, DOM-proven). Both picks
      // came from the SAME "Furniture" narrow and are STILL rendered in the open menu, so
      // we click the option to deselect directly from the current list (no re-type).
      const optionLocator = page
        .locator(`${SELECTORS.filterMenuPortal} ${SELECTORS.filterOption}`)
        .filter({ hasText: toRemove })
        .first();
      await optionLocator.waitFor({ state: 'visible', timeout: 5_000 });
      await optionLocator.click();

      // Menu must remain open after the deselect (AC4 deselect-while-open).
      expect(await filter.isDropdownOpen(), 'Menu must stay open after deselect (AC4)').toBe(true);
      // The deselected option's checkbox is no longer checked.
      expect(
        await filter.isOptionChecked('Merchant', toRemove),
        `Deselected merchant "${toRemove}" must be unchecked (AC4)`,
      ).toBe(false);
      picked.pop();
      expect(await filter.getMerchantSelectedCount(), 'One merchant remains selected').toBe(1);
    });

    await test.step('Apply Search — submitted criteria carry the still-selected merchant (AC5)', async () => {
      // F-003 follow-on (DOM/XHR-proven stg 2026-06-23, qa-debugger): the
      // stay-open deliverable (AC1-AC4) is validated above. AC5 ("applied results
      // match selection") depends on the Leads Search button actually re-fetching
      // `getLeadsByCriteria` WITH the selected merchant in the payload — and that
      // submit path is the discriminator between "filter applied" and "stale list".
      //
      // We therefore assert on the SUBMITTED CRITERIA, not on the rendered rows.
      // Capturing the request body is the primary oracle: if the POST carries
      // `merchantNames:["<picked>"]`, the front-end committed react-select's value to
      // the form (AC5 met at the contract boundary, regardless of how many stg leads
      // happen to match today). If NO new POST fires, or it fires with an EMPTY
      // `merchantNames`, the selection did not reach the form state on submit — a
      // distinct finding from F-003 (the value-container DOES read the picks; see
      // count assertions above) that the debugger flagged [HIPÓTESE] product-vs-FE
      // for the validator. We surface it explicitly instead of masking it behind a
      // row-content check that a same-day empty roster could pass for the wrong reason.
      const selected = picked[0] ?? '';
      const submitPromise = page.waitForRequest(
        (req) => /getLeadsByCriteria/i.test(req.url()) && req.method() === 'POST',
        { timeout: 15_000 },
      ).catch(() => null);

      await filter.applySearch();
      const submit = await submitPromise;
      const body = submit?.postData() ?? '';
      const merchantNamesMatch = /"merchantNames":\[([^\]]*)\]/.exec(body);
      const submittedMerchants = merchantNamesMatch?.[1] ?? '';

      expect(
        submit,
        '[AC5] clicking Search must fire a getLeadsByCriteria POST so the filter is ' +
          're-applied. No request fired → the Leads Search submit did not re-query ' +
          '(distinct from F-003 selection-commit, which is fixed). See debug report.',
      ).not.toBeNull();
      expect(
        submittedMerchants,
        `[AC5] the submitted getLeadsByCriteria must carry the still-selected merchant ` +
          `"${selected}" in merchantNames, but merchantNames was [${submittedMerchants}]. ` +
          `The react-select value (value-container reads it — see count==1 above) did ` +
          `not propagate to the Search form payload. Debugger flagged [HIPÓTESE] ` +
          `product/FE form-state, not a test-code defect.`,
      ).toContain(selected);

      // Defensive cross-check on the rendered rows ONLY when the filter was applied.
      const rows = await leads.getAllVisibleRows();
      for (const row of rows) {
        const m = (row['Merchant'] ?? '').trim();
        if (!m) continue;
        const matched = picked.some((sel) => m === sel || m.includes(sel) || sel.includes(m));
        expect(
          matched,
          `Row merchant "${m}" should be in the selected set ${JSON.stringify(picked)} (AC5)`,
        ).toBe(true);
      }
    });

    // DB: none (AC5 is a UI listing assertion; #1292 already validated the backend
    // payload shape — out of scope here). Activity log: N/A (read action).
  });
});
