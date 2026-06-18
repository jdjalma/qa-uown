/**
 * SCRATCH — svc#546: gera dois redirect-URLs para comparação visual de contratos.
 *
 * Lead A → GowSign OH  : OL90205-0079_clone + sticky SSN 082390916 + customer OH → 16m → template OH_2025_SAC_16_MONTHS
 * Lead B → Signwell OH : TerraceFinance (OL90202-0001, ONLINE) + approved SSN + customer OH → ABB resolve term
 *   Se OH template filtra por 16m e TerFin devolve 13m → esign_client=SIGNWELL (fallback)
 *   Se TerFin também devolve 16m → GowSign também; neste caso usar estado sem template (KY)
 *
 * Run: ENV=qa2 npx playwright test tests/api/__scratch_url_gen_two_providers_svc546.spec.ts \
 *        --project=api-only --timeout=180000
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { randomApplicant, randomLineItems, categoryForMerchant } from '@data/index.js';
import { buildSendApplicationBody, type MerchantInfo } from '@api/bodies/application.body.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

const GOWSIGN_OH: MerchantInfo = {
  username: 'danielsJewelers',
  password: 'U0wn_danielsJewelers_CnRKhJ',
  number: 'OL90205-0079_clone',
};
// TireAgent (ONLINE, ABB caps at 13 for OH → no 13m GowSign OH template → Signwell)
const TIREAGENT: MerchantInfo = {
  username: 'tireAgent',
  password: 'U0wn_tireAgent_G4eDIH',
  number: 'OW90218-0001',
};
const SUBTOTAL = 800;

const OH_ADDRESS = { address: '1875 N Sandusky Ave', city: 'Bucyrus', zip: '44820' };

async function createLead(
  api: any,
  merchant: MerchantInfo,
  opts: { state: string; ssn?: 'sticky16m' | 'approve'; income?: number },
): Promise<{ leadPk: number; redirectUrl: string; term: number; payList: any[] }> {
  const base = randomApplicant({ state: opts.state, ssn: opts.ssn ?? 'approve' });
  // Override with known-valid OH address (randomAddress may include '#unit' which backend rejects)
  const applicant = { ...base, ...OH_ADDRESS };

  const body = buildSendApplicationBody(merchant, applicant, undefined, {
    state: opts.state,
    mainAnnualIncome: opts.income ?? 80_000,
  });
  // Kornerstone-style bank data not needed for OL90202/OL90205

  const resp = await api.application.sendApplication(body);
  if (!resp.ok) throw new Error(`sendApplication ${resp.status}: ${JSON.stringify(resp.body)}`);
  const leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
  let leadPk = Number(resp.body.authorizationNumber ?? 0);

  await sleep(5_000);
  const st = await api.application.getApplicationStatus(merchant, leadUuid);
  if (!st.ok) throw new Error(`getApplicationStatus ${st.status}`);
  const status = extractApprovalStatus(st.body);
  if (!status?.toLowerCase().includes('approved')) throw new Error(`lead not approved: ${status}`);
  if (st.body.leadPk) leadPk = Number(st.body.leadPk);
  const approvedAmount = st.body.approvedAmount ?? SUBTOTAL;

  const subtotal = 662;
  const lineItems = randomLineItems({ category: categoryForMerchant('DANIELS_JEWELERS'), total: subtotal, count: 1 });
  const inv = await api.invoice.sendInvoice(merchant, leadUuid, {
    orderTotal: String(subtotal),
    merchandiseSubtotal: String(subtotal),
    salesTax: '0.00',
    deliveryCharge: '0.00',
    installationCharge: '0.00',
    miscellaneousFees: '0.00',
    lineItems,
  });
  if (!inv.ok) throw new Error(`sendInvoice ${inv.status}: ${JSON.stringify(inv.body)}`);

  const payList: any[] = inv.body.paymentDetailsList ?? [];
  const entry16 = payList.find((d: any) => d.termInMonths === 16);
  const entry = entry16 ?? payList[0];
  return {
    leadPk,
    redirectUrl: String(entry?.redirectUrl ?? ''),
    term: Number(entry?.termInMonths ?? 0),
    payList,
  };
}

test('URL gen — GowSign OH + Signwell OH (svc#546 comparison)', async ({ api, db }) => {
  test.setTimeout(180_000);

  // ── Confirm DB: which OH templates exist (term-filter visibility) ──
  let templateRows: Array<{ pk: number; name: string; state: string; plan_type: string }> = [];
  await test.step('DB: list active GowSign templates for OH', async () => {
    templateRows = await db.query<{ pk: number; name: string; state: string }>(
      `SELECT pk, name, state
       FROM uown_gow_sign_template
       WHERE state = 'OH'
       ORDER BY pk`,
      [],
    );
    console.log(`[url-gen] OH templates (${templateRows.length}):`, JSON.stringify(templateRows));
  });

  // ── Lead A: GowSign OH (16m, sticky SSN) ─────────────────────────
  let leadA: Awaited<ReturnType<typeof createLead>> | null = null;
  await test.step('Lead A: GowSign OH (OL90205-0079_clone, sticky SSN, 16m)', async () => {
    leadA = await createLead(api, GOWSIGN_OH, { state: 'OH', ssn: 'sticky16m', income: 80_000 });
    console.log(`[url-gen] Lead A pk=${leadA.leadPk} term=${leadA.term}`);
    console.log(`[url-gen] Lead A redirectUrl=${leadA.redirectUrl}`);
  });

  // ── Lead B: Signwell OH (TerraceFinance, approved SSN) ───────────
  let leadB: Awaited<ReturnType<typeof createLead>> | null = null;
  let leadBProvider = '';
  await test.step('Lead B: Signwell OH attempt (TireAgent ONLINE, ABB→13m OH, no 13m template → Signwell)', async () => {
    leadB = await createLead(api, TIREAGENT, { state: 'OH', income: 80_000 });
    console.log(`[url-gen] Lead B pk=${leadB.leadPk} term=${leadB.term}`);
    console.log(`[url-gen] Lead B available terms: ${leadB.payList.map((d: any) => d.termInMonths).join(',')}`);
    console.log(`[url-gen] Lead B redirectUrl=${leadB.redirectUrl}`);
  });

  // DB: confirm providers
  await test.step('DB: confirm esign provider for both leads', async () => {
    const checkLead = async (pk: number, label: string) => {
      const row = await db.queryOne<{ client: string; template_name: string; status: string }>(
        `SELECT client, template_name, status FROM uown_esign_document
         WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
        [pk],
      );
      const provider = row?.client ?? '(none)';
      const tmpl = row?.template_name ?? '(none)';
      console.log(`[url-gen] ${label} pk=${pk} → esign_client=${provider} template=${tmpl} status=${row?.status ?? '-'}`);
      return provider;
    };
    await checkLead(leadA!.leadPk, 'Lead A (GowSign OH)');
    leadBProvider = await checkLead(leadB!.leadPk, 'Lead B (Signwell? OH)');
  });

  // ── Summary ──────────────────────────────────────────────────────
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('RESULT SUMMARY (svc#546 URL comparison)');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`GowSign OH  (Lead A pk=${leadA!.leadPk}, term=${leadA!.term}m):`);
  console.log(`  ${leadA!.redirectUrl}`);
  console.log('');
  console.log(`Signwell? OH (Lead B pk=${leadB!.leadPk}, term=${leadB!.term}m, client=${leadBProvider}):`);
  console.log(`  ${leadB!.redirectUrl}`);
  if (leadBProvider !== 'SIGNWELL') {
    console.log('  ⚠️  Lead B não é SIGNWELL — OH templates cobre todos os termos ou TerFin deu 16m.');
    console.log('  Alternativa: usar estado sem template GowSign (ex: KY, CO, TX)');
  }
  console.log('════════════════════════════════════════════════════════════');

  expect(leadA!.redirectUrl, 'Lead A redirect URL').toBeTruthy();
  expect(leadB!.redirectUrl, 'Lead B redirect URL').toBeTruthy();
});
