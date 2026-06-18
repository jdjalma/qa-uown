/**
 * SCRATCH / THROWAWAY — svc#544 "Add New York GowSign Template".
 *
 * Purpose: create ONE New York (NY) 13-month lease application driven to the
 * signing stage via API and capture (a) the provider chosen by backend routing
 * (esignClient) and (b) the embedded signing URL, so a human / Playwright MCP
 * can open it and read the rendered GowSign contract (title + dynamic values).
 *
 * NOT a regression test — DELETE after the URL + provider are captured.
 *
 * How to run:
 *   ENV=qa2 npx playwright test tests/api/__scratch_ny_signing_url_svc544.spec.ts --project=api-only
 *
 * Recipe (svc#544 discovery, 2026-06-18):
 *   - Merchant: TireAgent (OW90218-0001), ONLINE → customer state NY drives template lookup.
 *   - TireAgent caps at 13m in qa2 (Kornerstone gives 16m) — we WANT 13m: NY only has
 *     the GowSign template NY_2025_SAC (pk=16, term_months=null = base/13m), no 16m row.
 *   - Expectation: NY 13m → GOWSIGN / NY_2025_SAC (template created 2026-05-28; no NY lead
 *     has exercised it yet — all NY esign history pre-dates it and is SIGNWELL).
 *   - No merchant preflight: do NOT mutate shared TireAgent config (rule #12 side-effect).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

const ENV = process.env.ENV ?? 'qa2';

// Capture the CONSUMER signing-flow URL (redirectUrl). The API-only
// submitApplication path is blocked by NeuroID ("Neuro Id verification Failed"),
// so the contract can only be rendered by driving this URL in a real browser
// (Playwright MCP), which generates the behavioural signals NeuroID needs.
test('svc#544 — capture NY consumer signing URL [qa2]', async ({ api, testEnv }) => {
  test.setTimeout(180_000);

  const td = buildTestData({
    state: 'NY',
    merchant: 'TireAgent',
    orderTotal: '1200',
    orderDescription: 'svc#544 NY 13m GowSign routing capture',
    approved: true,
    uniqueAddress: true,
  });
  const { merchant, applicant } = td;

  let leadUuid = '';
  let leadPk = '';
  let approvedAmount = 0;
  let redirectUrl = '';
  let resolvedTerm = 0;

  await test.step('sendApplication (NY, TireAgent, 13m)', async () => {
    const resp = await api.application.sendApplication(merchant, applicant, td.order);
    expect(resp.ok, `sendApplication ${resp.status}`).toBeTruthy();
    leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
    leadPk = String(resp.body.authorizationNumber ?? '');
    console.log(`[svc544] leadPk=${leadPk} leadUuid=${leadUuid} email=${applicant.email}`);
  });

  await test.step('getApplicationStatus → APPROVED', async () => {
    await sleep(5_000);
    const resp = await api.application.getApplicationStatus(merchant, leadUuid);
    expect(resp.ok, `getApplicationStatus ${resp.status}`).toBeTruthy();
    const status = extractApprovalStatus(resp.body);
    expect(status?.toLowerCase(), `expected APPROVED, got ${status}`).toContain('approved');
    if (resp.body.leadPk) leadPk = String(resp.body.leadPk);
    approvedAmount = resp.body.approvedAmount ?? 0;
    console.log(`[svc544] approvedAmount=${approvedAmount} leadPk=${leadPk}`);
  });

  await test.step('sendInvoice → capture consumer redirectUrl', async () => {
    const resp = await api.invoice.sendInvoice(merchant, leadUuid, {
      orderTotal: String(approvedAmount || 1200),
    });
    expect(resp.ok, `sendInvoice ${resp.status}`).toBeTruthy();
    const list = resp.body.paymentDetailsList ?? [];
    console.log(`[svc544] paymentDetailsList terms: ${JSON.stringify(list.map((d) => d.termInMonths))}`);
    const entry = list[0];
    redirectUrl = entry?.redirectUrl ?? '';
    resolvedTerm = entry?.termInMonths ?? 0;
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[svc544] ENV=${ENV}  svcApiUrl=${testEnv.svcApiUrl}`);
  console.log(`[svc544] merchant=TireAgent (OW90218-0001) ONLINE, customer state=NY`);
  console.log(`[svc544] leadPk=${leadPk} leadUuid=${leadUuid}`);
  console.log(`[svc544] applicant=${applicant.firstName} ${applicant.lastName}`);
  console.log(`[svc544] resolvedTerm=${resolvedTerm}`);
  console.log(`[svc544] CONSUMER redirectUrl: ${redirectUrl}`);
  console.log('═══════════════════════════════════════════════════════════');

  expect(redirectUrl, 'redirectUrl captured').toBeTruthy();
});
