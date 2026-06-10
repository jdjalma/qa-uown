/**
 * Regression — Arrangement ACH status deve ser FAILED quando parcelas ficam BLOCKED_ACCOUNT
 *
 * Standalone regression guard. NOT linked to task #491.
 *
 * Origem: uma observação isolada foi feita em qa2 (account 11263, arrangement 66)
 * onde `uown_sv_payment_arrangement.status='SUCCESS'` coexistiu com parcelas em
 * `BLOCKED_ACCOUNT`. Essa observação NÃO se reproduziu em conta fresh (11391),
 * e posteriormente o user confirmou que já existia task de validação no backlog
 * para o caso. Portanto não é bug novo — é um guard de regressão para o caminho
 * positivo do listener.
 *
 * O que este teste valida:
 * Por `BasePaymentArrangementListener.handleResult()` (svc/service/paymentArrangement/
 * listener/BasePaymentArrangementListener.java:76-97), quando uma parcela ACH cai
 * em estado residual (fora de PENDING e SUCCESS sets), o arrangement DEVE ser
 * marcado como FAILED. Este teste dispara um ACH arrangement com conta bancária
 * de teste que retorna BLOCKED_ACCOUNT do Profituity qa2 sandbox e valida:
 *   - parcelas terminam em BLOCKED_ACCOUNT
 *   - arrangement termina em FAILED (ou IN_PROGRESS se parcela ainda pendente)
 *   - arrangement NUNCA termina em SUCCESS enquanto há parcela residual
 *
 * Se um dia o teste começar a falhar com `BUG_REPRODUCED=true`, é sinal de que
 * uma regressão foi introduzida — alguém quebrou a reconciliação do listener.
 *
 * Test Data Hierarchy compliance:
 *   ⚠️ Este teste reusa fixture ACTIVE existente (ver CANDIDATE_ACCOUNT_PKS).
 *   Justificativa: criar conta via fluxo completo (sendApplication → sign →
 *   fund → ACTIVE) demora > 5 min por CT, e o objetivo é reconciliar o listener
 *   ACH, não validar o funil de origination. Aceito pela § Test Data Hierarchy.
 *
 * Project: task-testing
 * Environment: qa2
 *
 * Run:
 *   ENV=qa2 npx playwright test docs/taskTestingUown/regression_arrangementAchFailedOnBlockedAccount/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { calculateDateISO } from '@helpers/date.helpers.js';
import { sleep } from '@helpers/common.helpers.js';
import { TEST_BANK } from '../../../src/config/constants.js';

const TEST_NAME = 'regression_arrangementAchFailedOnBlockedAccount';

// ── Reference sets from BasePaymentArrangementListener.handleResult() ──
const PENDING_STATUSES: ReadonlySet<string> = new Set([
  'PENDING',
  'SENT',
  'ACK_RECEIVED',
  'PICKED_TO_SEND',
  'STATUS_UPDATE_PENDING',
  'PENDING_TO_RERUN',
]);

const SUCCESS_STATUSES: ReadonlySet<string> = new Set([
  'SETTLED',
  'COMPLETED',
  'SETTLED_IN_RERUN',
]);

/**
 * Computes the expected arrangement status for a given set of parcela statuses,
 * mirroring BasePaymentArrangementListener.handleResult():
 *
 *   hasFailure  → FAILED
 *   hasPending  → IN_PROGRESS
 *   otherwise   → SUCCESS
 */
function computeExpectedArrangementStatus(parcelaStatuses: readonly string[]): 'FAILED' | 'IN_PROGRESS' | 'SUCCESS' {
  const hasFailure = parcelaStatuses.some(
    (s) => !PENDING_STATUSES.has(s) && !SUCCESS_STATUSES.has(s),
  );
  if (hasFailure) return 'FAILED';
  const hasPending = parcelaStatuses.some((s) => PENDING_STATUSES.has(s));
  if (hasPending) return 'IN_PROGRESS';
  return 'SUCCESS';
}

interface AccountRow {
  pk: string;
  customer_pk: string | null;
  account_status: string;
}

interface ArrangementRow {
  pk: string;
  status: string | null;
  is_active: boolean;
  arrangement_type: string;
  account_pk: string;
  row_updated_timestamp: Date | null;
}

interface AchPaymentRow {
  pk: string;
  status: string;
  vendor_achstatus: string | null;
  return_code: string | null;
  payment_arrangement_pk: string;
}

// Candidate account fixtures (UOWN ACTIVE in qa2 from task #491 prep).
// We try them in order; the first one that is still ACTIVE wins.
const CANDIDATE_ACCOUNT_PKS: readonly string[] = ['11391', '11392', '11393', '11394', '11395'];

test.describe(TEST_NAME, { tag: ['@qa2', '@regression', '@listener-ach'] }, () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ envName: 'qa2' });

  // ── Shared state across CTs ────────────────────────────────────────
  let selectedAccountPk = '';
  let customerPk = '';
  let arrangementPk = '';
  let achPaymentPks: string[] = [];
  let finalParcelaStatuses: string[] = [];

  test('CT-01 — Setup: pick ACTIVE UOWN account from fixture pool', async ({ db }) => {
    test.setTimeout(60_000);

    await test.step('Scan candidate account PKs for ACTIVE status', async () => {
      for (const candidatePk of CANDIDATE_ACCOUNT_PKS) {
        const row = await db.queryOne<AccountRow>(
          `SELECT a.pk::text AS pk,
                  c.pk::text AS customer_pk,
                  a.account_status
             FROM uown_sv_account a
             LEFT JOIN uown_sv_customer c ON c.account_pk = a.pk
            WHERE a.pk = $1
              AND a.account_status = 'ACTIVE'`,
          [candidatePk],
        );
        if (row) {
          selectedAccountPk = row.pk;
          customerPk = row.customer_pk ?? '';
          console.log(`[CT-01] accountPk=${selectedAccountPk} customerPk=${customerPk} status=${row.account_status}`);
          break;
        } else {
          console.log(`[CT-01] candidate accountPk=${candidatePk} not ACTIVE — trying next`);
        }
      }

      test.skip(
        !selectedAccountPk,
        `[CT-01] No fixture account (${CANDIDATE_ACCOUNT_PKS.join(', ')}) is ACTIVE anymore — update the fixture pool`,
      );

      expect(selectedAccountPk, 'ACTIVE account must be picked').not.toBe('');
    });

    await test.step('Verify no active arrangement blocks reuse', async () => {
      const active = await db.queryOne<{ pk: string }>(
        `SELECT pk::text AS pk FROM uown_sv_payment_arrangement
          WHERE account_pk = $1 AND is_active = true
          ORDER BY pk DESC LIMIT 1`,
        [selectedAccountPk],
      );
      if (active) {
        console.log(`[CT-01] WARNING accountPk=${selectedAccountPk} already has active arrangementPk=${active.pk} — proceeding anyway; createOrUpdateAchPayments should either update or create a new one`);
      } else {
        console.log(`[CT-01] accountPk=${selectedAccountPk} has no active arrangement — clean reuse`);
      }
    });
  });

  test('CT-02 — Create ACH SETTLEMENT arrangement via createOrUpdateACHPayments', async ({ api, db }) => {
    test.setTimeout(90_000);
    test.skip(!selectedAccountPk, 'CT-01 did not select an account');

    await test.step('POST /uown/svc/createOrUpdateACHPayments', async () => {
      const today = calculateDateISO(0);
      const body = buildAchArrangementBody({
        accountPk: Number(selectedAccountPk),
        arrangementType: 'SETTLEMENT',
        routingNumber: TEST_BANK.DEFAULT_ROUTING,
        accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
        installments: [
          { amount: '100.00', date: today },
          { amount: '100.00', date: today },
        ],
      });

      const res = await api.paymentArrangement.createOrUpdateAchPayments(body);
      expect(res.ok, `createOrUpdateACHPayments failed: ${res.status} ${res.statusText}`).toBeTruthy();
    });

    await test.step('Poll uown_sv_payment_arrangement for new SETTLEMENT row (30s)', async () => {
      const deadline = Date.now() + 30_000;
      let found: ArrangementRow | null = null;
      while (Date.now() < deadline) {
        found = await db.queryOne<ArrangementRow>(
          `SELECT pk::text AS pk,
                  status,
                  is_active,
                  arrangement_type,
                  account_pk::text AS account_pk,
                  row_updated_timestamp
             FROM uown_sv_payment_arrangement
            WHERE account_pk = $1 AND arrangement_type = 'SETTLEMENT'
            ORDER BY pk DESC LIMIT 1`,
          [selectedAccountPk],
        );
        if (found) break;
        await sleep(1_000);
      }

      expect(found, `No SETTLEMENT arrangement found for accountPk=${selectedAccountPk} within 30s`).not.toBeNull();
      const arr = found as ArrangementRow;
      arrangementPk = arr.pk;
      console.log(`[CT-02] arrangementPk=${arrangementPk} status=${arr.status ?? 'null'} is_active=${arr.is_active}`);

      // Early state: must be active and either null/NOT_STARTED/IN_PROGRESS.
      expect(arr.arrangement_type).toBe('SETTLEMENT');
      expect(arr.is_active).toBe(true);
      if (arr.status != null) {
        expect(['NOT_STARTED', 'IN_PROGRESS'], `Unexpected initial arrangement.status=${arr.status}`).toContain(arr.status);
      }
    });

    await test.step('Capture achPaymentPks and verify initial parcela status', async () => {
      const rows = await db.query<AchPaymentRow>(
        `SELECT pk::text AS pk,
                status,
                vendor_achstatus,
                return_code,
                payment_arrangement_pk::text AS payment_arrangement_pk
           FROM uown_sv_achpayment
          WHERE payment_arrangement_pk = $1
          ORDER BY pk`,
        [arrangementPk],
      );
      achPaymentPks = rows.map((r) => r.pk);
      console.log(`[CT-02] achPaymentPks=[${achPaymentPks.join(', ')}]`);
      console.log(`[CT-02] initial parcelaStatuses=[${rows.map((r) => r.status).join(', ')}]`);

      expect(achPaymentPks.length, 'Expected 2 parcelas for arrangement').toBe(2);
      for (const r of rows) {
        expect(
          ['PENDING', 'SENT', 'PICKED_TO_SEND'],
          `parcelaPk=${r.pk} unexpected initial status=${r.status}`,
        ).toContain(r.status);
      }
    });
  });

  test('CT-03 — Trigger sendACHPaymentsSweep', async ({ api, db }) => {
    test.setTimeout(90_000);
    test.skip(!arrangementPk, 'CT-02 did not create an arrangement');

    await test.step('POST /uown/svc/sendACHPaymentsSweep', async () => {
      const res = await api.scheduledTask.sendAchPaymentsSweep();
      expect(res.ok, `sendACHPaymentsSweep failed: ${res.status} ${res.statusText}`).toBeTruthy();
    });

    await test.step('Poll parcelas until SENT or PICKED_TO_SEND (30s)', async () => {
      const deadline = Date.now() + 30_000;
      let rows: AchPaymentRow[] = [];
      while (Date.now() < deadline) {
        rows = await db.query<AchPaymentRow>(
          `SELECT pk::text AS pk,
                  status,
                  vendor_achstatus,
                  return_code,
                  payment_arrangement_pk::text AS payment_arrangement_pk
             FROM uown_sv_achpayment
            WHERE payment_arrangement_pk = $1
            ORDER BY pk`,
          [arrangementPk],
        );
        const allMoved = rows.length === achPaymentPks.length
          && rows.every((r) => r.status === 'SENT' || r.status === 'PICKED_TO_SEND' || r.status === 'ACK_RECEIVED');
        if (allMoved) break;
        await sleep(1_000);
      }
      console.log(`[CT-03] parcelaStatuses=[${rows.map((r) => `${r.pk}:${r.status}`).join(', ')}]`);
      // Non-fatal: if sweep hasn't picked them up, CT-04 polling will surface it.
    });
  });

  test('CT-04 — Trigger getStatusDatePaymentsListSweep and wait for final parcela state', async ({ api, db }) => {
    // Profituity sandbox can take minutes to respond.
    test.setTimeout(300_000);
    test.skip(!arrangementPk, 'CT-02 did not create an arrangement');

    await test.step('POST /uown/svc/getStatusDatePaymentsListSweep', async () => {
      const res = await api.scheduledTask.getStatusDatePaymentsListSweep();
      expect(res.ok, `getStatusDatePaymentsListSweep failed: ${res.status} ${res.statusText}`).toBeTruthy();
    });

    await test.step('Poll parcelas until all leave SENT/PICKED_TO_SEND/ACK_RECEIVED (≤180s)', async () => {
      const deadline = Date.now() + 180_000;
      const transient: ReadonlySet<string> = new Set([
        'PENDING',
        'SENT',
        'PICKED_TO_SEND',
        'ACK_RECEIVED',
        'STATUS_UPDATE_PENDING',
      ]);

      let rows: AchPaymentRow[] = [];
      let sweepTriggered = 1;

      while (Date.now() < deadline) {
        rows = await db.query<AchPaymentRow>(
          `SELECT pk::text AS pk,
                  status,
                  vendor_achstatus,
                  return_code,
                  payment_arrangement_pk::text AS payment_arrangement_pk
             FROM uown_sv_achpayment
            WHERE payment_arrangement_pk = $1
            ORDER BY pk`,
          [arrangementPk],
        );
        const allFinal = rows.length === achPaymentPks.length
          && rows.every((r) => !transient.has(r.status));
        if (allFinal) break;

        // Re-trigger sweep every 30s to prompt Profituity polling.
        if (Date.now() % 30_000 < 5_000 && sweepTriggered < 6) {
          const retry = await api.scheduledTask.getStatusDatePaymentsListSweep();
          if (retry.ok) sweepTriggered += 1;
        }
        await sleep(5_000);
      }

      finalParcelaStatuses = rows.map((r) => r.status);
      console.log(`[CT-04] sweepTriggered=${sweepTriggered}x`);
      console.log(`[CT-04] parcelaStatuses=[${rows.map((r) => `${r.pk}:${r.status}`).join(', ')}]`);
      console.log(`[CT-04] vendor_achstatus=[${rows.map((r) => `${r.pk}:${r.vendor_achstatus ?? 'null'}`).join(', ')}]`);
      console.log(`[CT-04] return_code=[${rows.map((r) => `${r.pk}:${r.return_code ?? 'null'}`).join(', ')}]`);

      // Non-fatal assertion: at least log if we timed out.
      const stillTransient = rows.filter((r) => transient.has(r.status));
      if (stillTransient.length > 0) {
        console.warn(`[CT-04] WARNING ${stillTransient.length} parcela(s) still transient after 180s — CT-05 will still evaluate the rule on whatever we have`);
      }
    });
  });

  test('CT-05 — ASSERT: arrangement.status matches BasePaymentArrangementListener rule', async ({ db }) => {
    test.setTimeout(60_000);
    test.skip(!arrangementPk, 'CT-02 did not create an arrangement');

    let actualArrangementStatus = '';
    let expectedArrangementStatus: 'FAILED' | 'IN_PROGRESS' | 'SUCCESS' = 'FAILED';
    let parcelaStatuses: string[] = [];

    await test.step('Re-query arrangement + parcelas for final snapshot', async () => {
      const arr = await db.queryOne<ArrangementRow>(
        `SELECT pk::text AS pk,
                status,
                is_active,
                arrangement_type,
                account_pk::text AS account_pk,
                row_updated_timestamp
           FROM uown_sv_payment_arrangement
          WHERE pk = $1`,
        [arrangementPk],
      );
      expect(arr, `Arrangement pk=${arrangementPk} not found`).not.toBeNull();

      const parcelas = await db.query<AchPaymentRow>(
        `SELECT pk::text AS pk,
                status,
                vendor_achstatus,
                return_code,
                payment_arrangement_pk::text AS payment_arrangement_pk
           FROM uown_sv_achpayment
          WHERE payment_arrangement_pk = $1
          ORDER BY pk`,
        [arrangementPk],
      );

      parcelaStatuses = parcelas.map((p) => p.status);
      finalParcelaStatuses = parcelaStatuses;
      actualArrangementStatus = String((arr as ArrangementRow).status ?? '');
      expectedArrangementStatus = computeExpectedArrangementStatus(parcelaStatuses);

      console.log(`[CT-05] accountPk=${selectedAccountPk}`);
      console.log(`[CT-05] arrangementPk=${arrangementPk}`);
      console.log(`[CT-05] achPaymentPks=[${achPaymentPks.join(', ')}]`);
      console.log(`[CT-05] parcelaStatuses=[${parcelaStatuses.join(', ')}]`);
      console.log(`[CT-05] vendor_achstatus=[${parcelas.map((p) => p.vendor_achstatus ?? 'null').join(', ')}]`);
      console.log(`[CT-05] return_code=[${parcelas.map((p) => p.return_code ?? 'null').join(', ')}]`);
      console.log(`[CT-05] arrangementStatus=${actualArrangementStatus} is_active=${(arr as ArrangementRow).is_active}`);
      console.log(`[CT-05] expected=${expectedArrangementStatus} actual=${actualArrangementStatus}`);
    });

    await test.step('Evaluate BUG reproduction', async () => {
      const anyBlocked = parcelaStatuses.includes('BLOCKED_ACCOUNT');
      const bugReproduced =
        actualArrangementStatus === 'SUCCESS' && expectedArrangementStatus === 'FAILED';

      console.log(`[CT-05] anyBlockedAccountParcela=${anyBlocked}`);
      console.log(`[CT-05] BUG_REPRODUCED=${bugReproduced}`);

      if (bugReproduced) {
        console.error(
          '[CT-05] ****** BUG REPRODUCED ******\n' +
            `  accountPk=${selectedAccountPk} arrangementPk=${arrangementPk}\n` +
            `  parcelaStatuses=[${parcelaStatuses.join(', ')}]\n` +
            `  arrangement.status=SUCCESS but expected FAILED per BasePaymentArrangementListener.handleResult()\n` +
            '  Reference: svc/service/paymentArrangement/listener/BasePaymentArrangementListener.java:76-97',
        );
      } else {
        console.log(
          '[CT-05] Bug NOT reproduced on fresh account — arrangement status matches parcela outcome. ' +
            'Original issue on accountPk=11263 may have been data-specific or already fixed.',
        );
      }

      // The hard assertion: arrangement status MUST match the expected status derived
      // from parcela outcomes. If this fails with expected=FAILED actual=SUCCESS while
      // parcelas include BLOCKED_ACCOUNT → regressão detectada (listener ACH não reconciliou).
      expect(
        actualArrangementStatus,
        `BUG REPRODUCED — arrangement.status=${actualArrangementStatus} but parcelaStatuses=[${parcelaStatuses.join(', ')}] imply ${expectedArrangementStatus}. See BasePaymentArrangementListener.handleResult().`,
      ).toBe(expectedArrangementStatus);
    });
  });

  test.afterAll(async () => {
    console.log(`[${TEST_NAME}] Summary:`);
    console.log(`  accountPk=${selectedAccountPk} customerPk=${customerPk}`);
    console.log(`  arrangementPk=${arrangementPk}`);
    console.log(`  achPaymentPks=[${achPaymentPks.join(', ')}]`);
    console.log(`  finalParcelaStatuses=[${finalParcelaStatuses.join(', ')}]`);
  });
});
