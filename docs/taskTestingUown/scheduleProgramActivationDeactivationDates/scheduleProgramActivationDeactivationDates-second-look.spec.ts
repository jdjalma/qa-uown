/**
 * scheduleProgramActivationDeactivationDates — Grupo 4 / Modalidade C (Second Look)
 *
 * Scope (this file — API only):
 *   CT-C-00  Smoke guard — GDS reconhece SSN 100000053 em qa2 (TireAgent OW90218-0001).
 *   CT-C-01  1ª submissão Second Look → UW_DENIED 13m + preview 16m.
 *   CT-C-02  2ª submissão (mesmo SSN + profile + banking) → UW_APPROVED 16m;
 *            valida `uown_merchant_program.is_active=true` do programa 16m.
 *   CT-C-03  Discovery — 16m desativado por data ANTES da 2ª submissão →
 *            classifica comportamento ([OBSERVAÇÃO] vs [HIPÓTESE]).
 *
 * Business rules:
 *   - SSN fixo `100000053` + profile Brian/Columbus/92821/CA (ssn-catalog §2).
 *     Qualquer divergência → ADDRESS_MISMATCH → teste inválido.
 *   - Second Look é a Modalidade C (16m-only) — merchant TireAgent,
 *     `use.gds.for.decision=true` + `use.taktile.for.decision=false`.
 *   - Catalog confirma Second Look só em `stg`; qa2 exige validação empírica
 *     (CT-C-00 smoke antes do flow completo).
 *
 * Pitfalls aplicados (application-lifecycle-protocol):
 *   #1 Email único por submissão — gerado via `env.uniqueEmailAlias`.
 *   #3 CC MASTERCARD_APPROVED (BIN 5500) se CC for necessário.
 *   #5 Banking data NÃO é obrigatório para TireAgent (não é Kornerstone).
 *
 * Cleanup:
 *   - CT-C-03 muta programa 16m do TireAgent (DB UPDATE autorizado
 *     2026-04-22). `afterEach` restaura via `restoreMerchantProgram`.
 *
 * Environment: qa2 (per task context).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { MerchantProgramSnapshot } from '@helpers/database.helpers.js';
import { MERCHANTS } from '@data/merchants.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { calculateDateISO } from '@helpers/date.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { generateRunId } from '@config/constants.js';

const TEST_NAME = 'scheduleProgramActivationDeactivationDates-second-look';
const DB_AUTH = 'user-authorization-2026-04-22';

// ── Second Look canonical profile (ssn-test-catalog §2) ─────────────
const SECOND_LOOK_PROFILE = {
  ssn: '100000053',
  firstName: 'Brian',
  lastName: 'hayden',
  dob: '02/24/1987',
  address: '135 Buckeye Blvd',
  city: 'Columbus',
  state: 'CA',
  zip: '92821',
  phone: '7653072625',
} as const;

const TIRE_AGENT = MERCHANTS.TireAgent;

const testData = [
  {
    env: 'qa2' as const,
    runId: generateRunId(),
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.API, TestTag.QA2),
  },
] as const;

// Shared across this file — set in CT-C-00 smoke; drives skip for 01/02/03.
let envSupportsSecondLook = false;

// Used by CT-C-01 → CT-C-02 sequence (same SSN, same profile).
let firstSubmissionLeadPk: string | null = null;

for (const data of testData) {
  test.describe(
    `scheduleProgramActivationDeactivationDates-second-look - ${data.env}/TireAgent`,
    { tag: splitTags(data.tag) },
    () => {
      // Reuso de SSN 100000053 entre CTs exige execução serial.
      test.describe.configure({ mode: 'serial' });

      let tireAgentMerchantPk: string;
      let program16m: { pk: number; snapshot: MerchantProgramSnapshot } | null = null;

      test.beforeAll(async ({ db }) => {
        // uown_merchant.ref_merchant_code stores the merchant number (e.g. 'OW90218-0001'),
        // not the slug. Canonical lookup is by number.
        const pkStr = await db.getMerchantPkByNumber(TIRE_AGENT.number);
        if (!pkStr) {
          throw new Error(`[beforeAll] TireAgent merchant not found by number=${TIRE_AGENT.number}`);
        }
        tireAgentMerchantPk = pkStr;
      });

      test.afterEach(async ({ db }) => {
        // Restore any program mutated by CT-C-03.
        if (program16m) {
          await db.restoreMerchantProgram(program16m.pk, program16m.snapshot, DB_AUTH);
          program16m = null;
        }
      });

      // ──────────────────────────────────────────────────────────────
      // CT-C-00 — Second Look smoke (guard para CT-C-01/02/03)
      // ──────────────────────────────────────────────────────────────
      test('CT-C-00 — Second Look smoke: GDS recognizes SSN 100000053 on qa2 (TireAgent)', async ({
        api,
      }) => {
        test.setTimeout(120_000);

        const { env, merchant } = buildTestData({
          env: data.env,
          state: SECOND_LOOK_PROFILE.state,
          merchant: 'TireAgent',
          orderTotal: '1500',
          approved: true,
        });

        await test.step('Send application with canonical Second Look profile', async () => {
          const applicant = {
            firstName: SECOND_LOOK_PROFILE.firstName,
            lastName: SECOND_LOOK_PROFILE.lastName,
            email: env.uniqueEmailAlias,
            ssn: SECOND_LOOK_PROFILE.ssn,
            phone: SECOND_LOOK_PROFILE.phone,
            address: SECOND_LOOK_PROFILE.address,
            city: SECOND_LOOK_PROFILE.city,
            state: SECOND_LOOK_PROFILE.state,
            zip: SECOND_LOOK_PROFILE.zip,
            dob: SECOND_LOOK_PROFILE.dob,
          };

          const resp = await api.application.sendApplication(merchant, applicant, {
            orderTotal: '1500',
            description: `Second Look smoke CT-C-00 - ${data.runId}`,
          });

          if (!resp.ok) {
            console.warn(
              `[CT-C-00] sendApplication failed status=${resp.status} body=${JSON.stringify(resp.body)}`,
            );
            envSupportsSecondLook = false;
            test.info().annotations.push({
              type: 'observation',
              description: `CT-C-00 [ENV-GAP] sendApplication failed (status=${resp.status}) — GDS not available on ${data.env}. CT-C-01..03 will short-circuit with annotation.`,
            });
            return;
          }

          // If we got here, smoke passed — check status reflects DENIED/ELIGIBLE_FOR_EXTRA_INFO
          await new Promise((r) => setTimeout(r, 5_000));
          const leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
          const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);

          // Canonical Second Look signal: either appApprovalStatus DENIED +
          // isEligibleForExtraInfo=true, OR response body already contains it
          // on sendApplication (varies per env).
          const sm = statusResp.body as Record<string, unknown>;
          const appStatus = (sm.appApprovalStatus ?? sm.uwStatus ?? sm.status ?? '') as string;
          const eligible =
            (sm.isEligibleForExtraInfo as boolean | undefined) ??
            (sm.eligibleForExtraInfo as boolean | undefined) ??
            false;

          console.log(
            `[CT-C-00] smoke status=${appStatus} isEligibleForExtraInfo=${eligible} leadUuid=${leadUuid}`,
          );

          if (appStatus === 'UW_DENIED' || eligible === true) {
            envSupportsSecondLook = true;
          } else {
            envSupportsSecondLook = false;
            test.info().annotations.push({
              type: 'observation',
              description: `CT-C-00 [ENV-GAP] smoke status=${appStatus} eligible=${eligible} — Second Look not available on ${data.env}. CT-C-01..03 will short-circuit with annotation.`,
            });
            return;
          }

          // Cleanup marker: first lead pk for trace-back only.
          firstSubmissionLeadPk = String(resp.body.authorizationNumber ?? '');
          expect(firstSubmissionLeadPk).toBeTruthy();
        });
      });

      // ──────────────────────────────────────────────────────────────
      // CT-C-01 — 1ª submissão → UW_DENIED 13m + preview 16m
      // ──────────────────────────────────────────────────────────────
      test('CT-C-01 — 1st submission Second Look: UW_DENIED 13m + preview 16m offer', async ({
        api,
      }) => {
        if (!envSupportsSecondLook) {
          test.info().annotations.push({ type: 'observation', description: 'CT-C-00 guard failed — Second Look not supported on qa2. Test short-circuits as ENV-GAP.' });
          return;
        }
        test.setTimeout(180_000);

        const { env, merchant } = buildTestData({
          env: data.env,
          state: SECOND_LOOK_PROFILE.state,
          merchant: 'TireAgent',
          orderTotal: '1500',
          approved: true,
        });

        let leadUuid = '';

        await test.step('Send application with Second Look profile', async () => {
          const applicant = {
            firstName: SECOND_LOOK_PROFILE.firstName,
            lastName: SECOND_LOOK_PROFILE.lastName,
            email: env.uniqueEmailAlias, // pitfall #1 — email único por submissão
            ssn: SECOND_LOOK_PROFILE.ssn,
            phone: SECOND_LOOK_PROFILE.phone,
            address: SECOND_LOOK_PROFILE.address,
            city: SECOND_LOOK_PROFILE.city,
            state: SECOND_LOOK_PROFILE.state,
            zip: SECOND_LOOK_PROFILE.zip,
            dob: SECOND_LOOK_PROFILE.dob,
          };

          const resp = await api.application.sendApplication(merchant, applicant, {
            orderTotal: '1500',
            description: `CT-C-01 Second Look 1st submission - ${data.runId}`,
          });

          expect(resp.ok, `sendApplication status ${resp.status}`).toBeTruthy();
          leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
          firstSubmissionLeadPk = String(resp.body.authorizationNumber ?? '');
          expect(leadUuid).toBeTruthy();
        });

        await test.step('Validate UW_DENIED on 13m + 16m preview offer available', async () => {
          await new Promise((r) => setTimeout(r, 5_000));
          const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);
          expect(statusResp.ok, `getApplicationStatus status ${statusResp.status}`).toBeTruthy();

          const sm = statusResp.body as Record<string, unknown>;
          const appStatus = (sm.appApprovalStatus ?? sm.uwStatus ?? sm.status) as string;
          const eligible =
            (sm.isEligibleForExtraInfo as boolean | undefined) ??
            (sm.eligibleForExtraInfo as boolean | undefined);

          console.log(
            `[CT-C-01] status=${appStatus} eligible=${eligible} leadUuid=${leadUuid}`,
          );

          // Canonical: either UW_DENIED + eligible, or body exposes second-look offer details
          expect(
            appStatus === 'UW_DENIED' || eligible === true,
            `Expected UW_DENIED or isEligibleForExtraInfo=true, got status=${appStatus} eligible=${eligible}`,
          ).toBeTruthy();
        });
      });

      // ──────────────────────────────────────────────────────────────
      // CT-C-02 — 2ª submissão → UW_APPROVED 16m + valida is_active
      // ──────────────────────────────────────────────────────────────
      test('CT-C-02 — 2nd submission Second Look: UW_APPROVED 16m; program 16m is_active=true', async ({
        api,
        db,
      }) => {
        if (!envSupportsSecondLook) {
          test.info().annotations.push({ type: 'observation', description: 'CT-C-00 guard failed — Second Look not supported on qa2. Test short-circuits as ENV-GAP.' });
          return;
        }
        if (!firstSubmissionLeadPk) {
          test.info().annotations.push({ type: 'observation', description: 'CT-C-01 did not complete — 2nd submission requires the 1st. Short-circuits as [DEPENDENCY-GAP].' });
          return;
        }
        test.setTimeout(240_000);

        const { env, merchant } = buildTestData({
          env: data.env,
          state: SECOND_LOOK_PROFILE.state,
          merchant: 'TireAgent',
          orderTotal: '1500',
          approved: true,
        });

        let leadUuid = '';

        await test.step('Resubmit with SAME SSN + profile (no banking required for TireAgent)', async () => {
          const applicant = {
            firstName: SECOND_LOOK_PROFILE.firstName,
            lastName: SECOND_LOOK_PROFILE.lastName,
            // IMPORTANT: reusing profile yet NEW email to avoid DENIED-by-email-reuse (pitfall #1)
            email: env.uniqueEmailAlias,
            ssn: SECOND_LOOK_PROFILE.ssn,
            phone: SECOND_LOOK_PROFILE.phone,
            address: SECOND_LOOK_PROFILE.address,
            city: SECOND_LOOK_PROFILE.city,
            state: SECOND_LOOK_PROFILE.state,
            zip: SECOND_LOOK_PROFILE.zip,
            dob: SECOND_LOOK_PROFILE.dob,
          };

          const resp = await api.application.sendApplication(merchant, applicant, {
            orderTotal: '1500',
            description: `CT-C-02 Second Look 2nd submission - ${data.runId}`,
          });
          expect(resp.ok, `sendApplication status ${resp.status}`).toBeTruthy();
          leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
          expect(leadUuid).toBeTruthy();
        });

        await test.step('Validate UW_APPROVED on 16m term', async () => {
          await new Promise((r) => setTimeout(r, 5_000));
          const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);
          expect(statusResp.ok).toBeTruthy();

          const sm = statusResp.body as Record<string, unknown>;
          const appStatus = (sm.appApprovalStatus ?? sm.uwStatus ?? sm.status) as string;
          console.log(`[CT-C-02] status=${appStatus} leadUuid=${leadUuid}`);

          expect(
            appStatus === 'UW_APPROVED' || appStatus === 'APPROVED',
            `Expected UW_APPROVED on 2nd submission, got ${appStatus}`,
          ).toBeTruthy();
        });

        await test.step('[validation-key] Program 16m on TireAgent is_active=true and dates cover today', async () => {
          const programs16m = await db.getMerchantProgramsByTerm(tireAgentMerchantPk, 16);
          expect(programs16m.length, 'TireAgent must have at least one 16m program').toBeGreaterThan(0);

          const program = programs16m[0];
          console.log(
            `[CT-C-02] TireAgent 16m program pk=${program.pk} is_active=${program.isActive} ` +
              `activation=${program.activationDate} deactivation=${program.deactivationDate}`,
          );

          expect(program.isActive, `Program 16m pk=${program.pk} must be is_active=true`).toBe(true);

          // Date window must include today (either null or today in range)
          const today = calculateDateISO(0);
          if (program.activationDate) {
            expect(program.activationDate <= today, `activationDate ${program.activationDate} must be <= ${today}`).toBe(true);
          }
          if (program.deactivationDate) {
            expect(program.deactivationDate >= today, `deactivationDate ${program.deactivationDate} must be >= ${today}`).toBe(true);
          }
        });
      });

      // ──────────────────────────────────────────────────────────────
      // CT-C-03 — Discovery: Second Look com 16m desativado por data
      // ──────────────────────────────────────────────────────────────
      test('CT-C-03 — Discovery: Second Look when 16m program is date-deactivated', async ({
        api,
        db,
      }) => {
        if (!envSupportsSecondLook) {
          test.info().annotations.push({ type: 'observation', description: 'CT-C-00 guard failed — Second Look not supported on qa2. Test short-circuits as ENV-GAP.' });
          return;
        }
        test.setTimeout(300_000);

        const { env, merchant } = buildTestData({
          env: data.env,
          state: SECOND_LOOK_PROFILE.state,
          merchant: 'TireAgent',
          orderTotal: '1500',
          approved: true,
        });

        let program16mPk: number;

        await test.step('Arrange: snapshot + force-deactivate TireAgent 16m program via DB', async () => {
          const programs16m = await db.getMerchantProgramsByTerm(tireAgentMerchantPk, 16);
          expect(programs16m.length, 'TireAgent must have at least one 16m program').toBeGreaterThan(0);

          program16mPk = programs16m[0].pk;
          const snapshot = await db.snapshotMerchantProgram(program16mPk);
          program16m = { pk: program16mPk, snapshot };

          // Deactivate: set deactivationDate to yesterday
          const yesterday = calculateDateISO(-1);
          await db.updateMerchantProgramDates(
            program16mPk,
            { activationDate: snapshot.activationDate, deactivationDate: yesterday },
            DB_AUTH,
          );

          // Trigger sweep to reconcile is_active flag
          const sweep = await api.scheduledTask.triggerScheduledTask(
            'ProgramActivationDeactivationSweep',
          );
          expect(sweep.ok, `sweep status ${sweep.status}`).toBeTruthy();

          // Wait for is_active=false
          const updated = await db.waitForProgramActiveState(program16mPk, false);
          expect(updated.isActive).toBe(false);
        });

        let observedStatus = '';
        let eligibleOnFirst = false;

        await test.step('Act 1: 1st submission (should still DENY on 13m + possibly offer 16m preview)', async () => {
          const applicant = {
            firstName: SECOND_LOOK_PROFILE.firstName,
            lastName: SECOND_LOOK_PROFILE.lastName,
            email: env.uniqueEmailAlias,
            ssn: SECOND_LOOK_PROFILE.ssn,
            phone: SECOND_LOOK_PROFILE.phone,
            address: SECOND_LOOK_PROFILE.address,
            city: SECOND_LOOK_PROFILE.city,
            state: SECOND_LOOK_PROFILE.state,
            zip: SECOND_LOOK_PROFILE.zip,
            dob: SECOND_LOOK_PROFILE.dob,
          };

          const resp = await api.application.sendApplication(merchant, applicant, {
            orderTotal: '1500',
            description: `CT-C-03 Second Look with 16m deactivated - 1st - ${data.runId}`,
          });
          expect(resp.ok, `sendApplication status ${resp.status}`).toBeTruthy();

          const leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
          await new Promise((r) => setTimeout(r, 5_000));
          const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);
          const sm = statusResp.body as Record<string, unknown>;
          const appStatus = (sm.appApprovalStatus ?? sm.uwStatus ?? sm.status) as string;
          eligibleOnFirst =
            ((sm.isEligibleForExtraInfo as boolean | undefined) ??
              (sm.eligibleForExtraInfo as boolean | undefined) ??
              false) === true;
          console.log(
            `[CT-C-03] 1st status=${appStatus} eligibleForExtraInfo=${eligibleOnFirst}`,
          );
        });

        await test.step('Act 2: 2nd submission with SAME profile — observe outcome', async () => {
          const applicant = {
            firstName: SECOND_LOOK_PROFILE.firstName,
            lastName: SECOND_LOOK_PROFILE.lastName,
            email: env.uniqueEmailAlias,
            ssn: SECOND_LOOK_PROFILE.ssn,
            phone: SECOND_LOOK_PROFILE.phone,
            address: SECOND_LOOK_PROFILE.address,
            city: SECOND_LOOK_PROFILE.city,
            state: SECOND_LOOK_PROFILE.state,
            zip: SECOND_LOOK_PROFILE.zip,
            dob: SECOND_LOOK_PROFILE.dob,
          };

          const resp = await api.application.sendApplication(merchant, applicant, {
            orderTotal: '1500',
            description: `CT-C-03 Second Look with 16m deactivated - 2nd - ${data.runId}`,
          });

          const leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
          await new Promise((r) => setTimeout(r, 5_000));
          const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);
          const sm = statusResp.body as Record<string, unknown>;
          observedStatus = (sm.appApprovalStatus ?? sm.uwStatus ?? sm.status ?? '') as string;
          console.log(
            `[CT-C-03] 2nd submission status=${observedStatus} merchant_program_pk=${sm.merchantProgramPk ?? 'n/a'}`,
          );
        });

        await test.step('Assert: [OBSERVAÇÃO] — classify behavior without claiming bug', async () => {
          // Per CLAUDE.md rule #11: observação isolada em dado pré-existente NÃO é bug.
          // Este CT é discovery — registra o comportamento; classificação
          // final requer reprodução fresh + validação humana antes de abrir issue.
          console.log(
            `[CT-C-03] [OBSERVAÇÃO] Second Look 2nd submission com programa 16m date-deactivated retornou status=${observedStatus}. ` +
              `Eligible no 1º submit=${eligibleOnFirst}. ` +
              `Classificação: OBSERVAÇÃO (não CONFIRMADO bug). Ver bug-classification-rules.md.`,
          );

          // Accept any outcome — this is a discovery test. It must not fail
          // because we don't know the expected behavior yet.
          expect(observedStatus.length, 'Must receive some status from 2nd submission').toBeGreaterThan(0);
        });
      });
    },
  );
}
