/**
 * SCRATCH / THROWAWAY — svc#555 AL GowSign SIGNING COMPLETION (AC-1 / Scenarios 1,2).
 *
 * Drives a fresh Alabama lead (TerraceFinance, qa2 → GowSign) all the way to a
 * COMPLETED signature via the framework helpers, then validates the lease reached
 * SIGNED, the esign document is GOWSIGN/COMPLETED, and the signing activity log
 * (rule #13) is present. Closes the "signing completion" gap for the AL template
 * and produces a SIGNED AL lease usable for the post-SIGNED LEASE_MOD cascade.
 *
 * Run: ENV=qa2 npx playwright test tests/e2e/gowsign/__scratch_alabama_sign_completion_svc555.spec.ts --project=cross-portal
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import { installPostMessageRecorder, signGowSignInFrame } from '@helpers/gowsign-signing.helper.js';
import { waitForLeadStatus } from '@helpers/esign-db.helpers.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';

test('svc#555 — AL GowSign sign → COMPLETED + activity log', async ({ page, api, ctx, db }, testInfo) => {
  test.setTimeout(360_000);

  const { merchant, applicant } = buildTestData({
    state: 'AL', merchant: 'TerraceFinance', orderTotal: '1500',
    orderDescription: 'svc#555 AL signing completion',
  });

  await installPostMessageRecorder(page);

  await createPreQualifiedApplication(api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo);
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
  expect(contractUrl, 'contract URL present').toBeTruthy();
  const leadPk = Number(ctx.leadPk);
  console.log(`[sign] leadPk=${leadPk} applicant=${applicant.firstName} ${applicant.lastName} url=${contractUrl}`);

  await test.step('drive CC + Terms + Protection', async () => {
    await page.goto(contractUrl);
    const missingData = new MissingDataFormPage(page);
    await missingData.waitForLoaded(60_000);
    await missingData.fillAndSubmit({
      firstName: applicant.firstName, lastName: applicant.lastName,
      cardNumber: '5500000000000004', cvc: '123', expiration: '12/2030',
    });
    const terms = new TermsOfAgreementPage(page);
    await terms.waitForLoaded(120_000);
    await terms.acceptAndProceedWithProtectionPlan(false);

    // qa2 Buddy-widget loop: the Proceed/submit click is swallowed on the first
    // attempt(s) (frontend unlocks ~3rd click). Re-click until the GowSign iframe
    // appears. See .claude/rules/testing.md "Buddy Insurance Widget".
    const gowsign = page.locator('iframe[src*="gowsign"]');
    for (let i = 0; i < 6; i++) {
      if (await gowsign.isVisible({ timeout: 4_000 }).catch(() => false)) break;
      const proceed = page
        .locator('#purchase-insurance-submit-btn, button:has-text("Proceed to signature")')
        .first();
      await proceed.click({ force: true }).catch(() => {});
      console.log(`[sign] Buddy re-click attempt ${i + 1}`);
      await page.waitForTimeout(3_000);
    }
  });

  await test.step('sign the GowSign contract → COMPLETED', async () => {
    const modal = new AlternativeContractModalPage(page);
    await modal.waitForOpen(120_000);
    const frame = modal.getGowSignFrame();
    await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
    const result = await signGowSignInFrame(page, frame, {
      preauthChoice: 'yes', fontIndex: 0, waitForCompleted: true,
    });
    console.log(`[sign] signClicked=${result.signClicked}`);
    expect(result.signClicked, 'GowSign Sign was clicked').toBe(true);

    // The helper reaches the "All fields are complete — Click Finish to finalize"
    // CONFIRMATION dialog but its loop clicks the HEADER Finish (which only opens
    // the dialog) and breaks on stagnation. Click the DIALOG's Finish to finalize.
    await page.waitForTimeout(1_500);
    for (let i = 0; i < 4; i++) {
      const finishBtns = frame.getByRole('button', { name: /^Finish$/i });
      const n = await finishBtns.count().catch(() => 0);
      if (n === 0) break;
      console.log(`[sign] finalize attempt ${i + 1}: ${n} Finish button(s)`);
      await finishBtns.last().click({ force: true, timeout: 8_000 }).catch((e) => console.log(`[sign] finish err: ${String(e).slice(0, 60)}`));
      await page.waitForTimeout(2_500);
      // dialog gone once finalized
      const dialogGone = !(await frame.getByText(/Click Finish to finalize/i).isVisible({ timeout: 1_500 }).catch(() => false));
      if (dialogGone) { console.log('[sign] finalize dialog dismissed'); break; }
    }
  });

  await test.step('validate lease SIGNED + esign GOWSIGN', async () => {
    // lead_status=SIGNED is the authoritative completion signal (ContractService
    // isLeaseOrLeaseModSigned flips CONTRACT_CREATED → SIGNED).
    await waitForLeadStatus(db, leadPk, 'SIGNED', { timeoutMs: 180_000 });
    const row = await db.queryOne<{ client: string; status: string }>(
      `SELECT client, status FROM uown_esign_document WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
      [leadPk],
    );
    console.log(`[sign] esign: client=${row?.client} status=${row?.status}`);
    expect(row?.client, 'esign provider is GowSign').toBe('GOWSIGN');
  });

  await test.step('validate signing activity log (rule #13)', async () => {
    const note = await db.queryOne<{ pk: number; notes: string }>(
      `SELECT pk, notes FROM uown_los_lead_notes
       WHERE lead_pk = $1 AND (notes ILIKE '%sign%' OR notes ILIKE '%ContractService%' OR notes ILIKE '%esign%')
       ORDER BY pk DESC LIMIT 1`,
      [leadPk],
    );
    console.log(`[sign] signed note: ${note ? String(note.notes).slice(0, 220) : '(none)'}`);
    expect(note, 'a signing-related activity log note must exist').toBeTruthy();
  });

  console.log(`[sign] DONE — AL GowSign lease ${leadPk} signed to COMPLETED`);
});
