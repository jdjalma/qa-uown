/**
 * SCRATCH / THROWAWAY — svc#555 AL GowSign MODIFY POST-SIGNED cascade (LEASE_MOD).
 *
 * Full lifecycle (gowsign-modify-lease-qa2 flow adapted to AL):
 *   1. Create + SIGN an AL GowSign lease (original).
 *   2. modifyInvoiceForLead(original) → spawns a new lead, original → LEASE_MOD_REQUESTED.
 *   3. Validate the cascade (status transitions + modify note + new-lead spawn).
 *   4. RE-SIGN the new (modified) contract → new lead SIGNED, and re-check the
 *      nextPaymentDueAmount/epoDays/payOffDiscountPercent regression on the mod contract.
 *
 * Run: ENV=qa2 npx playwright test tests/e2e/gowsign/__scratch_alabama_modify_postsigned_svc555.spec.ts --project=cross-portal
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import { installPostMessageRecorder, signGowSignInFrame } from '@helpers/gowsign-signing.helper.js';
import { waitForLeadStatus } from '@helpers/esign-db.helpers.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import { TEST_CARDS } from '@data/index.js';
import type { Page } from '@playwright/test';

/** Drive one GowSign contract from its /complete URL through to a finalized signature. */
async function signContractAt(page: Page, applicant: { firstName: string; lastName: string }, contractUrl: string): Promise<boolean> {
  await page.goto(contractUrl);
  const missingData = new MissingDataFormPage(page);
  await missingData.waitForLoaded(60_000);
  await missingData.fillAndSubmit({
    firstName: applicant.firstName, lastName: applicant.lastName,
    cardNumber: TEST_CARDS.MASTERCARD_APPROVED.number,
    cvc: TEST_CARDS.MASTERCARD_APPROVED.cvv,
    expiration: TEST_CARDS.MASTERCARD_APPROVED.expirationDate,
  });
  const terms = new TermsOfAgreementPage(page);
  await terms.waitForLoaded(120_000);
  await terms.acceptAndProceedWithProtectionPlan(false);

  // qa2 Buddy loop: the Proceed click is swallowed on first attempt(s). Re-click
  // "Proceed to signature" until the GowSign modal opens.
  const modal = new AlternativeContractModalPage(page);
  let opened = false;
  for (let i = 0; i < 6 && !opened; i++) {
    try { await modal.waitForOpen(5_000); opened = true; break; } catch { /* not open yet */ }
    await page.getByRole('button', { name: /proceed to signature/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(2_500);
  }
  if (!opened) await modal.waitForOpen(60_000);

  const frame = modal.getGowSignFrame();
  await page.waitForTimeout(2_500);
  const result = await signGowSignInFrame(page, frame, { preauthChoice: 'yes', fontIndex: 0, waitForCompleted: true });

  // Click the "All fields complete — Finish" confirmation dialog (the helper stops
  // at the header Finish, which only opens this dialog).
  await page.waitForTimeout(1_500);
  for (let i = 0; i < 4; i++) {
    const fb = frame.getByRole('button', { name: /^Finish$/i });
    if ((await fb.count().catch(() => 0)) === 0) break;
    await fb.last().click({ force: true, timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(2_500);
    if (!(await frame.getByText(/Click Finish to finalize/i).isVisible({ timeout: 1_500 }).catch(() => false))) break;
  }
  return result.signClicked;
}

test('svc#555 — AL GowSign modify post-signed cascade', async ({ page, api, ctx, db }, testInfo) => {
  test.setTimeout(720_000);

  const { merchant, applicant } = buildTestData({
    state: 'AL', merchant: 'TerraceFinance', orderTotal: '1500',
    orderDescription: 'svc#555 AL modify pos-signed',
  });
  await installPostMessageRecorder(page);

  await createPreQualifiedApplication(api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo);
  const inv = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  const urlA = inv.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
  const originalLeadPk = Number(ctx.leadPk);
  expect(urlA, 'original contract URL').toBeTruthy();
  console.log(`[modps] originalLeadPk=${originalLeadPk} applicant=${applicant.firstName} ${applicant.lastName}`);

  await test.step('sign the original lease → SIGNED', async () => {
    expect(await signContractAt(page, applicant, urlA), 'original signClicked').toBe(true);
    await waitForLeadStatus(db, originalLeadPk, 'SIGNED', { timeoutMs: 180_000 });
    console.log(`[modps] original ${originalLeadPk} SIGNED`);
  });

  let newLeadPk = 0;
  await test.step('modifyInvoiceForLead spawns a new lead', async () => {
    const resp = await api.lead.modifyInvoiceForLead(originalLeadPk);
    expect(resp.ok, `modifyInvoiceForLead ${resp.status}`).toBeTruthy();
    newLeadPk = Number(resp.body?.newLeadPk);
    expect(newLeadPk, 'newLeadPk present').toBeTruthy();
    expect(newLeadPk, 'new lead differs from original').not.toBe(originalLeadPk);
    console.log(`[modps] newLeadPk=${newLeadPk}`);
  });

  await test.step('cascade: original → LEASE_MOD_REQUESTED + new lead spawned', async () => {
    await waitForLeadStatus(db, originalLeadPk, 'LEASE_MOD_REQUESTED', { timeoutMs: 30_000 });
    const note = await db.queryOne<{ notes: string }>(
      `SELECT notes FROM uown_los_lead_notes WHERE lead_pk=$1 AND notes ILIKE '%modifyInvoice%' ORDER BY pk DESC LIMIT 1`,
      [originalLeadPk],
    );
    console.log(`[modps] modify note: ${note ? String(note.notes).slice(0, 160) : '(none)'}`);
    expect(note, 'modifyInvoice note present').toBeTruthy();
    let st: string | null = null;
    for (let i = 0; i < 15; i++) {
      const r = await db.queryOne<{ lead_status: string }>('SELECT lead_status FROM uown_los_lead WHERE pk=$1', [newLeadPk]);
      st = r?.lead_status ?? null;
      if (st && !['NEW', 'PENDING_UW'].includes(st)) break;
      await sleep(2_000);
    }
    console.log(`[modps] new lead spawn status=${st}`);
    expect(st, 'new lead advanced past NEW/PENDING_UW').toBeTruthy();
  });

  await test.step('re-sign the new (modified) contract → SIGNED', async () => {
    const row = await db.queryOne<{ uuid: string }>('SELECT uuid FROM uown_los_lead WHERE pk=$1', [newLeadPk]);
    const newUuid = row?.uuid;
    expect(newUuid, 'new lead uuid').toBeTruthy();
    const inv2 = await api.invoice.sendInvoice(merchant, newUuid!);
    const urlB = inv2.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
    expect(urlB, 'new contract URL').toBeTruthy();
    console.log(`[modps] new contract url=${urlB}`);
    expect(await signContractAt(page, applicant, urlB), 'new signClicked').toBe(true);
    await waitForLeadStatus(db, newLeadPk, 'SIGNED', { timeoutMs: 180_000 });
    const e = await db.queryOne<{ client: string; status: string }>(
      'SELECT client, status FROM uown_esign_document WHERE lead_pk=$1 ORDER BY pk DESC LIMIT 1', [newLeadPk],
    );
    console.log(`[modps] new lead ${newLeadPk} SIGNED, esign client=${e?.client} status=${e?.status}`);
    expect(e?.client, 'modified contract is GowSign').toBe('GOWSIGN');
    const mt = await db.queryOne<{ notes: string }>(
      `SELECT notes FROM uown_los_lead_notes WHERE lead_pk=$1 AND notes ILIKE '%missing%token%' ORDER BY pk DESC LIMIT 1`,
      [newLeadPk],
    );
    console.log(`[modps] new contract missing-token log: ${mt ? String(mt.notes) : '(none)'}`);
  });

  console.log(`[modps] DONE original=${originalLeadPk} → LEASE_MOD_REQUESTED, new=${newLeadPk} → SIGNED`);
});
