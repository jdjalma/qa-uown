/**
 * SVC-07 DISCOVERY (Sessão 7, dev3) — contact flags activity-log COMPLIANCE + Send Podium Link.
 *
 * Tests two recon hypotheses against dev3 runtime + real DB (UI-first, rule #15/#18):
 *   H1 (compliance, rule #14): does toggling Opt Out AI (svc-common PhoneService.updateOptOutAI)
 *       write a REAL row to uown_sv_activity_log? Recon (code grep) says NO — PhoneService only
 *       fires Hibernate Envers (*_history), and the #505 report's "activity log" assertion was a
 *       false-positive (it read the API JSON echoed in the DOM, not a log row). If confirmed:
 *       "opt-out without activity log" = the charter's P0 compliance bug-bar. DNC/DNT share the
 *       identical PhoneService path → the finding generalizes.
 *   H2 (Podium 404): FE calls POST /uown/svc/accounts/{pk}/podium-link, which has NO controller
 *       in svc (grep=0). Capture the real network status — expect 404 → BUG candidate.
 *
 * Conservative (rule #10): observations logged with watermark-diffed DB evidence; not asserted as
 * bugs. Reversible: opt-out AI is toggled back OFF at the end (product flow, not DB mutation).
 *
 * Account: 224 (dev3, unique mobile phone 246-9239868 → no multi-account DNC/DNT propagation).
 */
import { test, expect } from '@support/base-test.js';
import { ServicingCustomerPage } from '@pages/servicing/index.js';
import { loginToPortalWithOptions } from '@helpers/index.js';

const ACCOUNT_PK = '224';

test.describe('SVC-07 discovery — contact compliance + Podium', () => {
  test('Opt Out AI activity-log compliance + Send Podium Link network status', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);

    const wmRows = await db.query(
      'SELECT COALESCE(max(pk),0) AS max_pk FROM uown_sv_activity_log WHERE account_pk = $1', [ACCOUNT_PK],
    );
    const watermark = Number((wmRows[0] as { max_pk: number | string }).max_pk);
    console.log(`[SVC07] activity_log watermark for account ${ACCOUNT_PK}: max_pk=${watermark}`);

    // Capture every /podium-link/ network response (H2).
    const podiumResponses: Array<{ url: string; status: number }> = [];
    page.on('response', (r) => {
      if (/podium/i.test(r.url())) podiumResponses.push({ url: r.url(), status: r.status() });
    });

    const cust = new ServicingCustomerPage(page);

    await test.step('Login + open customer-information + Primary Contact', async () => {
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      await page.goto(`${testEnv.servicingUrl}customer-information/${ACCOUNT_PK}`);
      await cust.navigateToPrimaryContact();
    });

    await test.step('H1 — Opt Out AI ON via UI, then check REAL activity log', async () => {
      const toast = await cust.setOptOutAi(true);
      console.log(`[SVC07][H1] optOutAi ON toast: "${toast}"`);

      const phone = await db.query(
        'SELECT opt_out_ai, opt_out_ai_reason FROM uown_sv_phone WHERE account_pk = $1', [ACCOUNT_PK],
      );
      console.log(`[SVC07][H1] uown_sv_phone after ON: ${JSON.stringify(phone[0])}`);

      const newLogs = await db.query(
        'SELECT pk, log_type, left(notes, 100) AS notes FROM uown_sv_activity_log WHERE account_pk = $1 AND pk > $2 ORDER BY pk',
        [ACCOUNT_PK, watermark],
      );
      console.log(`[SVC07][H1] NEW activity_log rows after opt-out ON: ${newLogs.length}`);
      newLogs.forEach((l) => console.log(`[SVC07][H1][log] pk=${(l as any).pk} type=${(l as any).log_type} notes=${(l as any).notes}`));
      const optOutLog = newLogs.find((l) => /opt.?out|do not|ai/i.test(String((l as any).notes)));
      console.log(`[SVC07][H1][VERDICT] opt-out-related activity_log row present? ${optOutLog ? 'YES: ' + (optOutLog as any).notes : 'NO — compliance gap candidate (charter P0 bug-bar)'}`);
    });

    await test.step('H2 — Send Podium Link, capture network status', async () => {
      let podiumToast = '';
      try {
        podiumToast = await cust.sendPodiumLink();
      } catch (e) {
        podiumToast = `[threw] ${(e as Error).message.slice(0, 120)}`;
      }
      console.log(`[SVC07][H2] sendPodiumLink toast: "${podiumToast}"`);
      console.log(`[SVC07][H2] podium-link network responses: ${JSON.stringify(podiumResponses)}`);
      const got404 = podiumResponses.some((r) => r.status === 404);
      console.log(`[SVC07][H2][VERDICT] podium-link endpoint 404? ${got404 ? 'YES — confirms missing svc controller (BUG candidate)' : podiumResponses.length === 0 ? 'NO REQUEST CAPTURED (button gated or flow changed)' : 'NO (status=' + podiumResponses.map(r => r.status).join(',') + ')'}`);
    });

    await test.step('Restore: Opt Out AI OFF', async () => {
      const toast = await cust.setOptOutAi(false).catch((e) => `[restore failed] ${(e as Error).message.slice(0, 80)}`);
      const phone = await db.query('SELECT opt_out_ai FROM uown_sv_phone WHERE account_pk = $1', [ACCOUNT_PK]);
      console.log(`[SVC07][restore] opt-out OFF toast="${toast}" finalFlag=${JSON.stringify(phone[0])}`);
    });
  });
});
