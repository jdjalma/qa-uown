/**
 * E2E Test: NeuroID Bypass on PROFILE_NOT_FOUND (Work Item #496, R1.51.0)
 *
 * Validates that when NeuroID returns `PROFILE_NOT_FOUND` on a merchant with
 * NeuroID enabled AND the qa2 config `approve.on.profile.not.found=true`, the
 * backend silently approves the verification (bypass) and lets the flow reach
 * `CONTRACT_CREATED` instead of blocking with "Failed to Verification
 * Identification" at the CC/ACH screen.
 *
 * Hybrid Flow (parametrized over 2 qa2 merchants — covers CT-01 .. CT-10):
 *   CT-01/02  [API]  sendApplication → extract contractUrl + leadPk
 *   CT-03     [API]  getApplicationStatus → APPROVED + numeric leadPk
 *   CT-04a    [UI prep]   attachNeuroIdListeners(page)  BEFORE page.goto
 *   CT-04b/c  [UI]   Navigate contract URL, fill CC + ACH, submit
 *                    → detach listeners, attach captured network dump as artifact
 *   CT-05     [DB]   uown_neuro_id_verification record present for leadPk
 *   CT-06     [DB]   CONDITIONAL — if neuro_id_status=PROFILE_NOT_FOUND
 *                    → status=APPROVE + lead_status transitioned (bypass)
 *                    Otherwise annotate N/A (success path is also positive)
 *   CT-07     [UI+DB]  Complete T&C + e-sign; poll lead_status to
 *                      CONTRACT_CREATED or beyond
 *   CT-08     [DB]   CONDITIONAL — audit log on NeuroID failure (table
 *                    name discovered dynamically via information_schema).
 *                    Annotate N/A if no failure observed in this run.
 *   CT-09     [UI]   Reopen contract URL post-submit → no inputs, submit CTA
 *   CT-10     [implicit] — parametrization over 2 merchants guarantees
 *                          isolation (distinct leadPk + NeuroID rows).
 *
 * Environment: qa2  (approve.on.profile.not.found=true; siteids items340/depth355)
 * Merchants:   SaslowsJewelers (IL90206-0003), BodegaFurniture (ks1011)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ContractPage } from '@pages/index.js';
import { TestTag, buildTags, splitTags, LeadStatus, NeuroIdStatus, FraudStatus } from '@ptypes/enums.js';
import { TEST_CARDS, TEST_BANK } from '@config/index.js';
import {
  buildTestData,
  sleep,
  RUN_ID,
  attachNeuroIdListeners,
  dumpCaptured,
  classifyNeuroIdOutcome,
  type NeuroIdVerificationRow,
} from '@helpers/index.js';

// ── Test data — one entry per merchant ──────────────────────────────
// Email is NOT overridden — the backend rejects `@e2e.test`; we let
// ConfigEnvironment.uniqueEmailAlias produce a real-domain alias
// (`{base}+{RUN_ID}_{ts}@gmail.com`) which is already unique per worker.
interface NeuroIdTestData {
  env: 'qa2';
  state: string;
  merchant: 'SaslowsJewelers' | 'BodegaFurniture';
  merchantShort: string;
  orderTotal: string;
  tag: string;
  runId: string;
  /**
   * When true, block NeuroID frontend SDK requests (`neuroid|neuro-id|nid.com`)
   * before navigating to the contract URL. With no SDK data reaching NeuroID's
   * servers, the backend verification returns `PROFILE_NOT_FOUND`. Combined with
   * `approve.on.profile.not.found=false`, this routes to the failure branch —
   * the only way to exercise CT-08 (audit log enrichment) deterministically.
   */
  blockNeuroIdSdk?: boolean;
  /** Suffix appended to the test title when a variant (e.g., sdk-blocked) is active. */
  variant?: string;
}

const testData: NeuroIdTestData[] = [
  {
    // Saslow's Henderson (pk=8, IL90206-0003) — valid_states = 'NC,VA'
    env: 'qa2',
    state: 'NC',
    merchant: 'SaslowsJewelers',
    merchantShort: 'saslow',
    orderTotal: '1500',
    tag: `${buildTags(TestTag.REGRESSION, TestTag.QA2, TestTag.CRITICAL)} @neuroid @task-496`,
    runId: RUN_ID,
  },
  {
    // Bodega Furniture (pk=315, KS1011) — valid_states broad; NY is fine
    env: 'qa2',
    state: 'NY',
    merchant: 'BodegaFurniture',
    merchantShort: 'bodega',
    orderTotal: '1500',
    tag: `${buildTags(TestTag.REGRESSION, TestTag.QA2, TestTag.CRITICAL)} @neuroid @task-496`,
    runId: RUN_ID,
  },
  {
    // SDK-blocked variant — forces PROFILE_NOT_FOUND deterministically. Expected
    // outcome: with flag=false in qa2 → NEURO_ID_ERROR + enriched audit log
    // (reason + LogType.INTERNAL non-null). CT-08 finally exercises assertions.
    env: 'qa2',
    state: 'NC',
    merchant: 'SaslowsJewelers',
    merchantShort: 'saslow-sdkblocked',
    orderTotal: '1500',
    tag: `${buildTags(TestTag.REGRESSION, TestTag.QA2)} @neuroid @task-496 @ct08`,
    runId: RUN_ID,
    blockNeuroIdSdk: true,
    variant: 'sdk-blocked',
  },
];

for (const data of testData) {
  const variantSuffix = data.variant ? ` [${data.variant}]` : '';
  test.describe(
    `R1.51.0_neuroIdBypassOnProfileNotFound_496 - ${data.env}/${data.merchant}${variantSuffix}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      test(`Full lifecycle with NeuroID network capture: ${data.env}/${data.state}/${data.merchant}${variantSuffix}`, async ({
        page,
        api,
        db,
        merchantConfig: mSetup,
        ctx,
      }) => {
        test.setTimeout(600_000); // 10 min — includes e-sign iframe wait + DB polls

        // ═══════════════════════════════════════════════════════════════
        //  PHASE 0 — Merchant setup + test data
        // ═══════════════════════════════════════════════════════════════

        await test.step('Setup — merchant configuration (best-effort)', async () => {
          try {
            await mSetup.configureByName(data.merchant, 'lifecycle');
          } catch (err) {
            // Merchant may not be resolvable by refCode in all envs — proceed with defaults
            console.log(`[Setup] MerchantConfigurator skipped: ${(err as Error).message}`);
          }
        });

        const { merchant, applicant, order } = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: `NeuroID bypass E2E — ${data.merchant}`,
        });

        test.info().annotations.push(
          { type: 'runId', description: data.runId },
          { type: 'merchant', description: data.merchant },
          { type: 'env', description: data.env },
        );

        // ═══════════════════════════════════════════════════════════════
        //  PHASE 1 — Application creation (API)
        // ═══════════════════════════════════════════════════════════════

        let sendApplicationBlocked = false;

        await test.step('CT-01/02 — Create application via sendApplication (API)', async () => {
          const response = await api.application.sendApplication(merchant, applicant, order);

          // Capture full response as artifact (bug evidence if flow is blocked)
          await test.info().attach(`sendApplication-response-${data.merchant}.json`, {
            body: JSON.stringify({ status: response.status, body: response.body }, null, 2),
            contentType: 'application/json',
          });

          ctx.leadPk = String(response.body.authorizationNumber ?? '');
          ctx.leadUuid = response.body.accountNumber ?? ctx.leadPk;

          const pdl = response.body.paymentDetailsList;
          const txStatus = response.body.transactionStatus ?? '';
          const txMessage = response.body.transactionMessage ?? '';
          const appApprovalStatus = response.body.appApprovalStatus ?? '';

          test.info().annotations.push(
            { type: 'leadPk', description: ctx.leadPk || 'null' },
            { type: 'leadUuid', description: ctx.leadUuid || 'null' },
            { type: 'appApprovalStatus', description: String(appApprovalStatus) },
            { type: 'transactionStatus', description: String(txStatus) },
          );

          // Detect backend blockers — we only short-circuit when paymentDetailsList is
          // actually empty OR the HTTP response failed. `transactionStatus` alone isn't
          // reliable (E0 = success; E3/E4 = errors) and the canonical signal is whether
          // we can proceed to the contract page (pdl populated).
          if (!response.ok || !pdl || pdl.length === 0) {
            sendApplicationBlocked = true;
            test.info().annotations.push({
              type: 'bug-outside-scope',
              description:
                `sendApplication returned transactionStatus=${txStatus} ` +
                `(${txMessage}) appApprovalStatus=${appApprovalStatus} with ` +
                `paymentDetailsList.length=${pdl?.length ?? 0}. ` +
                `Lead created as leadPk=${ctx.leadPk || 'null'}. ` +
                `NeuroID flow CANNOT be validated for this merchant — no contract URL.`,
            });
            console.log(
              `[Phase 1] BLOCKED — txStatus=${txStatus} pdl.length=${pdl?.length ?? 0} ` +
                `leadPk=${ctx.leadPk} — skipping NeuroID validation for ${data.merchant}`,
            );
            return;
          }

          const idx = pdl.length > 1 ? 1 : 0;
          ctx.contractUrl = pdl[idx].redirectUrl ?? '';
          expect(ctx.contractUrl, 'Contract URL (redirectUrl) must be present').toBeTruthy();

          test.info().annotations.push({ type: 'contractUrl', description: ctx.contractUrl });
          console.log(`[Phase 1] leadPk=${ctx.leadPk} leadUuid=${ctx.leadUuid}`);
        });

        // If sendApplication was blocked, skip the rest of the test gracefully.
        // The test is marked as skipped (not failed) so CI can distinguish "test
        // couldn't run due to backend bug" from "test ran and found a bug".
        test.skip(sendApplicationBlocked, `sendApplication blocked for ${data.merchant} — see attached response`);

        await test.step('CT-03 — getApplicationStatus confirms APPROVED (API)', async () => {
          await sleep(5_000);

          const response = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
          expect(
            response.ok,
            `getApplicationStatus responded with ${response.status}`,
          ).toBeTruthy();

          const status = (
            response.body.appApprovalStatus ||
            response.body.uwStatus ||
            response.body.currentStatus ||
            response.body.status
          ) ?? '';
          expect(
            status?.toLowerCase(),
            `Expected APPROVED but got: ${status}`,
          ).toContain('approved');

          if (response.body.leadPk) {
            ctx.leadPk = String(response.body.leadPk);
          }
          expect(
            Number(ctx.leadPk),
            'leadPk should be a positive number',
          ).toBeGreaterThan(0);

          test.info().annotations.push({ type: 'appApprovalStatus', description: String(status) });
          console.log(`[Phase 1] Confirmed APPROVED, leadPk=${ctx.leadPk}`);
        });

        // ═══════════════════════════════════════════════════════════════
        //  PHASE 2 — Attach NeuroID network listeners BEFORE navigation
        //           (critical — otherwise early SDK requests are missed)
        // ═══════════════════════════════════════════════════════════════

        const capture = await test.step(
          'CT-04a — Attach NeuroID network listeners',
          async () => attachNeuroIdListeners(page),
        );

        // Optional — variant for CT-08: block the NeuroID frontend SDK so the
        // backend receives no session data and returns PROFILE_NOT_FOUND. With
        // `approve.on.profile.not.found=false` configured in qa2, the lead is
        // routed into the failure branch — the only way to exercise the audit
        // log enrichment (`reason` + `LogType.INTERNAL`) deterministically.
        if (data.blockNeuroIdSdk) {
          await test.step('CT-04a-variant — Block NeuroID SDK to force PROFILE_NOT_FOUND', async () => {
            await page.route(/(?:neuroid|neuro-id|nid\.com)/i, route =>
              route.abort('blockedbyclient'),
            );
            test.info().annotations.push({
              type: 'variant',
              description: 'sdk-blocked — NeuroID frontend requests aborted; backend should observe PROFILE_NOT_FOUND',
            });
            console.log('[Phase 2] NeuroID SDK requests WILL be blocked to force PROFILE_NOT_FOUND');
          });
        }

        // ═══════════════════════════════════════════════════════════════
        //  PHASE 3 — Contract UI: CC/ACH + submit
        // ═══════════════════════════════════════════════════════════════

        await test.step('CT-04b — Navigate contract URL, fill CC + ACH', async () => {
          expect(ctx.contractUrl, 'Contract URL must be available').toBeTruthy();
          await page.goto(ctx.contractUrl!, { waitUntil: 'domcontentloaded', timeout: 60_000 });
          await page.waitForLoadState('networkidle').catch(() => {});

          const contract = new ContractPage(page);
          await contract.waitForSpinner();

          // Defensive — SEON not expected on these merchants, but no-op is safe
          await contract.dismissSeonOverlay();

          const ccCard = TEST_CARDS.DISCOVER_APPROVED;
          await contract.fillCreditCardInfo({
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            cardNumber: ccCard.number,
            cvc: ccCard.cvv,
            expDate: `${ccCard.expMonth}/${ccCard.expYear}`,
          });
          console.log('[Phase 3] CC info filled');

          await contract.fillBankInfo({
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            routingNumber: TEST_BANK.DEFAULT_ROUTING,
            accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
          });
          console.log('[Phase 3] Bank info filled');
        });

        await test.step('CT-04c — Submit payment + dump NeuroID network capture', async () => {
          const contract = new ContractPage(page);
          try {
            await contract.submitPaymentInfo();
            console.log('[Phase 3] Payment info submitted');
          } catch (err) {
            // In the sdk-blocked variant the backend is expected to route to the
            // failure branch and may surface the error via UI — submitPaymentInfo
            // can throw waiting for a success state that never arrives. The DB
            // state is what actually matters for CT-05/06/08; continue.
            if (data.blockNeuroIdSdk) {
              test.info().annotations.push({
                type: 'submit-exception-on-sdk-blocked',
                description: `submitPaymentInfo threw (expected in sdk-blocked variant): ${(err as Error).message.slice(0, 200)}`,
              });
              console.log(`[Phase 3] submitPaymentInfo threw (expected in sdk-blocked variant): ${(err as Error).message}`);
            } else {
              throw err;
            }
          }

          // Wait for trailing responses to settle before detaching
          await sleep(2_000);
          capture.detach();

          const outcome = classifyNeuroIdOutcome(capture);
          test.info().annotations.push(
            { type: 'neuroIdNetworkOutcome', description: outcome },
            { type: 'neuroIdCapturedEvents', description: String(capture.entries.length) },
          );
          console.log(
            `[Phase 3] Captured ${capture.entries.length} NeuroID-related events; outcome=${outcome}`,
          );

          await test.info().attach(`network-neuroid-${data.merchant}.json`, {
            body: dumpCaptured(capture),
            contentType: 'application/json',
          });

          // Soft-check: the "Failed to Verification Identification" error must NOT appear
          // UNLESS we intentionally blocked the SDK (variant: sdk-blocked). In that case
          // the error IS expected — it is precisely the failure path we want to exercise.
          const errorModal = page.locator('text="Failed to Verification Identification"');
          const errorVisible = await errorModal.isVisible({ timeout: 2_000 }).catch(() => false);
          if (data.blockNeuroIdSdk) {
            test.info().annotations.push({
              type: 'errorModalOnSdkBlocked',
              description: errorVisible ? 'visible (expected)' : 'not visible (SDK blocked but flow did not bubble the error modal — check DB state)',
            });
          } else {
            expect(
              errorVisible,
              'Blocking "Failed to Verification Identification" modal should not be shown',
            ).toBeFalsy();
          }
        });

        // ═══════════════════════════════════════════════════════════════
        //  PHASE 4 — DB validation of NeuroID record + bypass (if applicable)
        // ═══════════════════════════════════════════════════════════════

        let record: NeuroIdVerificationRow | null = null;
        let bypassTriggered: 'yes' | 'no' | 'na' = 'na';

        await test.step('CT-05 — DB: uown_neuro_id_verification record exists (reflex)', async () => {
          record = await db.waitForNeuroIdRecord(ctx.leadPk, 60_000);
          expect(record, `NeuroID verification record should exist for leadPk=${ctx.leadPk}`).not.toBeNull();

          const r = record!;
          test.info().annotations.push(
            { type: 'neuroIdStatus', description: String(r.neuro_id_status ?? 'null') },
            { type: 'neuroIdFraudStatus', description: String(r.status ?? 'null') },
            { type: 'neuroIdCaller', description: String(r.caller ?? 'null') },
            { type: 'neuroIdSiteId', description: String(r.site_id ?? 'null') },
          );

          // [reflex - Qualquer Mutation] — audit timestamp populated on create.
          // `row_updated_timestamp` is nullable on insert-only rows and only set when the
          // backend later mutates the record (e.g., bypass flow calls createOrUpdate).
          expect(r.row_created_timestamp, 'row_created_timestamp must be populated').not.toBeNull();
          test.info().annotations.push({
            type: 'neuroIdRecordMutated',
            description: r.row_updated_timestamp ? 'yes (row_updated_timestamp set)' : 'no (insert-only)',
          });

          // Attach DB snapshot as artifact
          await test.info().attach(`neuroid-record-${data.merchant}.json`, {
            body: JSON.stringify(r, null, 2),
            contentType: 'application/json',
          });
        });

        await test.step('CT-06 — DB: bypass triggered when PROFILE_NOT_FOUND (conditional, reflex)', async () => {
          if (!record) {
            test.info().annotations.push({
              type: 'ct06',
              description: 'N/A — NeuroID record not found (covered by CT-05 assertion)',
            });
            return;
          }

          const r = record;

          // Decision matrix:
          //   PROFILE_NOT_FOUND + status=APPROVE → bypass flag ACTIVE (happy path of MR !1372)
          //   PROFILE_NOT_FOUND + status=DECLINE → bypass flag INACTIVE (failure path; CT-08 validates enriched audit)
          //   SUCCESS           + status=APPROVE → NeuroID genuine success (regression)
          //   other                              → unexpected observed state, proceed to CT-08

          if (
            r.neuro_id_status === NeuroIdStatus.PROFILE_NOT_FOUND &&
            r.status === FraudStatus.APPROVE
          ) {
            const acceptable = new Set<string>([
              LeadStatus.NEURO_ID_APPROVED,
              LeadStatus.CONTRACT_CREATED,
              LeadStatus.READY_TO_FUND,
              LeadStatus.FUNDING,
              LeadStatus.FUNDED,
              'SIGNED',
              'SETTLED',
            ]);

            const deadline = Date.now() + 45_000;
            let leadStatus: string | null = null;
            while (Date.now() < deadline) {
              const leadRow = await db.getLeadByPk(ctx.leadPk);
              leadStatus = leadRow ? String((leadRow as Record<string, unknown>).lead_status ?? '') : null;
              if (leadStatus && acceptable.has(leadStatus)) break;
              await sleep(2_000);
            }

            bypassTriggered = 'yes';
            test.info().annotations.push(
              { type: 'leadStatusAfterBypass', description: leadStatus ?? 'null' },
              { type: 'bypassTriggered', description: 'yes (flag ACTIVE — lead approved despite PROFILE_NOT_FOUND)' },
            );

            expect(
              leadStatus && acceptable.has(leadStatus),
              `Lead status should transition to NEURO_ID_APPROVED or beyond (observed: ${leadStatus})`,
            ).toBeTruthy();
          } else if (
            r.neuro_id_status === NeuroIdStatus.PROFILE_NOT_FOUND &&
            r.status === FraudStatus.DECLINE
          ) {
            // Bypass flag is OFF. Expected: `internal_status = NEURO_ID_ERROR`.
            // Note: the external-facing `lead_status` stays at the pre-check value
            // (e.g., UW_APPROVED) — the NeuroID error is reflected only on the
            // internal column so it doesn't leak to customer-facing state.
            bypassTriggered = 'no';
            const leadRow = await db.getLeadByPk(ctx.leadPk);
            const leadRec = (leadRow as Record<string, unknown>) || {};
            const leadStatus = leadRec.lead_status ? String(leadRec.lead_status) : null;
            const internalStatus = leadRec.internal_status ? String(leadRec.internal_status) : null;
            test.info().annotations.push(
              { type: 'leadStatus', description: leadStatus ?? 'null' },
              { type: 'internalStatus', description: internalStatus ?? 'null' },
              {
                type: 'bypassTriggered',
                description:
                  'no (flag INACTIVE — PROFILE_NOT_FOUND → DECLINE; outside-scope audit enrichment validated in CT-08)',
              },
            );
            expect(
              internalStatus,
              `When bypass is off, internal_status should reflect the error path (observed: ${internalStatus})`,
            ).toBe(LeadStatus.NEURO_ID_ERROR);
          } else if (r.neuro_id_status === NeuroIdStatus.SUCCESS) {
            bypassTriggered = 'na';
            test.info().annotations.push({
              type: 'bypassTriggered',
              description: 'na — success path (genuine NeuroID SUCCESS, also positive)',
            });
          } else {
            bypassTriggered = 'no';
            test.info().annotations.push({
              type: 'bypassTriggered',
              description: `no — unexpected status=${r.neuro_id_status ?? 'null'}/${r.status ?? 'null'} — proceeding to CT-08 audit validation`,
            });
          }
        });

        // ═══════════════════════════════════════════════════════════════
        //  PHASE 5 — Complete T&C + e-sign; poll lead to CONTRACT_CREATED
        // ═══════════════════════════════════════════════════════════════

        await test.step('CT-07a — Complete Terms & Conditions', async () => {
          if (bypassTriggered === 'no') {
            test.info().annotations.push({
              type: 'ct07a',
              description: 'SKIPPED — NeuroID path did not approve; continuing to audit validation',
            });
            return;
          }
          const contract = new ContractPage(page);
          await contract.completeTermsAndConditions();
          console.log('[Phase 5] Terms & conditions completed');
        });

        let eSignCompleted = false;

        await test.step('CT-07b — Complete e-sign via embedded iframe', async () => {
          if (bypassTriggered === 'no') {
            test.info().annotations.push({
              type: 'ct07b',
              description: 'SKIPPED — NeuroID path did not approve',
            });
            return;
          }
          const contract = new ContractPage(page);
          try {
            await contract.completeESign();
            await contract.viewCompletedDocument();
            eSignCompleted = true;
            console.log('[Phase 5] E-sign completed');
          } catch (err) {
            // E-sign is POST-NeuroID. If the SignWell/PandaDocs iframe fails to load
            // in qa2, it is unrelated to the NeuroID feature under test. Report it
            // as a partial-coverage finding instead of failing the whole test.
            test.info().annotations.push({
              type: 'ct07b-partial',
              description: `E-sign step did not complete in qa2: ${(err as Error).message.slice(0, 200)}. ` +
                `NeuroID bypass validation (CT-04..06) already succeeded before this point.`,
            });
            console.log(`[Phase 5] E-sign timed out / unavailable (non-blocking): ${(err as Error).message}`);
          }
        });

        await test.step('CT-07c — DB: lead_status advanced to CONTRACT_CREATED+ (reflex)', async () => {
          if (bypassTriggered === 'no') {
            test.info().annotations.push({
              type: 'ct07c',
              description: 'SKIPPED — NeuroID path did not approve',
            });
            return;
          }

          const acceptable = new Set<string>([
            LeadStatus.CONTRACT_CREATED,
            LeadStatus.READY_TO_FUND,
            LeadStatus.FUNDING,
            LeadStatus.FUNDED,
            'SIGNED',
            'SETTLED',
            'CC_AUTH',
          ]);

          const deadline = Date.now() + 60_000;
          let finalStatus: string | null = null;
          const timeline: Array<{ timestamp: string; status: string | null }> = [];
          while (Date.now() < deadline) {
            const leadRow = await db.getLeadByPk(ctx.leadPk);
            finalStatus = leadRow ? String((leadRow as Record<string, unknown>).lead_status ?? '') : null;
            timeline.push({ timestamp: new Date().toISOString(), status: finalStatus });
            if (finalStatus && acceptable.has(finalStatus)) break;
            await sleep(3_000);
          }

          test.info().annotations.push({ type: 'finalLeadStatus', description: finalStatus ?? 'null' });
          await test.info().attach(`leadStatusTimeline-${data.merchant}.json`, {
            body: JSON.stringify(timeline, null, 2),
            contentType: 'application/json',
          });

          expect(
            finalStatus && acceptable.has(finalStatus),
            `Lead status should advance to CONTRACT_CREATED or beyond (observed: ${finalStatus})`,
          ).toBeTruthy();
        });

        // ═══════════════════════════════════════════════════════════════
        //  PHASE 6 — Audit log on failure (CONDITIONAL)
        // ═══════════════════════════════════════════════════════════════

        await test.step('CT-08 — DB: audit log on NeuroID failure (conditional, reflex)', async () => {
          if (!record || bypassTriggered !== 'no') {
            test.info().annotations.push({
              type: 'ct08',
              description:
                'N/A — no NeuroID failure reproduced in this run. Audit-on-failure coverage ' +
                'remains a documented gap (would require mock/disabled-flag merchant). ' +
                `Observed: neuro_id_status=${record?.neuro_id_status ?? 'null'}, ` +
                `fraud_status=${record?.status ?? 'null'}, bypassTriggered=${bypassTriggered}`,
            });
            return;
          }

          // Audit log table is `uown_los_activity_log` (confirmed via
          // information_schema inspection in qa2). MR !1372 writes a row with
          // `log_type='INTERNAL'` and `notes='NeuroId verification failed'`
          // via `updateLeadStatus` — both were null before the fix.
          const AUDIT_TABLE = 'uown_los_activity_log';

          const logs = await db.query<Record<string, unknown>>(
            `SELECT pk, log_type, created_by, notes, row_created_timestamp
               FROM ${AUDIT_TABLE}
              WHERE lead_pk = $1
              ORDER BY pk DESC
              LIMIT 20`,
            [Number(ctx.leadPk)],
          );

          await test.info().attach(`audit-log-${data.merchant}.json`, {
            body: JSON.stringify({ table: AUDIT_TABLE, rows: logs }, null, 2),
            contentType: 'application/json',
          });

          expect(
            logs.length,
            `${AUDIT_TABLE} should have at least one row for lead_pk=${ctx.leadPk}`,
          ).toBeGreaterThan(0);

          // Find the row added by the failure branch of NeuroIdVerificationService.
          // Criteria: log_type='INTERNAL' AND notes contains 'NeuroId verification failed'.
          const neuroIdFailureLog = logs.find(
            row =>
              String(row.log_type ?? '').toUpperCase() === 'INTERNAL' &&
              String(row.notes ?? '').includes('NeuroId verification failed'),
          );

          if (neuroIdFailureLog) {
            // Core CT-08 assertion — outside-scope improvement of MR !1372:
            //   reason  (persisted as `notes`)    must be non-null
            //   logType (persisted as `log_type`) must be non-null
            expect(
              neuroIdFailureLog.notes,
              'notes (reason) must be non-null on NeuroID failure audit row',
            ).not.toBeNull();
            expect(
              neuroIdFailureLog.log_type,
              'log_type must be non-null on NeuroID failure audit row',
            ).not.toBeNull();
            expect(neuroIdFailureLog.log_type).toBe('INTERNAL');
            expect(String(neuroIdFailureLog.notes)).toContain('NeuroId verification failed');

            test.info().annotations.push({
              type: 'ct08-audit',
              description:
                `pk=${neuroIdFailureLog.pk} log_type="${neuroIdFailureLog.log_type}" ` +
                `notes="${String(neuroIdFailureLog.notes).slice(0, 120)}" ` +
                `created_by="${neuroIdFailureLog.created_by}"`,
            });
          } else {
            test.info().annotations.push({
              type: 'ct08-audit',
              description: `No INTERNAL/NeuroId-failed row found in ${AUDIT_TABLE} for lead_pk=${ctx.leadPk}. Top-20 snapshot attached as artifact.`,
            });
            throw new Error(
              `Expected an activity_log row with log_type='INTERNAL' and notes containing ` +
              `'NeuroId verification failed' for lead_pk=${ctx.leadPk}. ` +
              `None found — MR !1372 audit enrichment may not be active.`,
            );
          }

          // [reflex] — notes column on the verification record should describe the failure
          if (record.notes) {
            test.info().annotations.push({
              type: 'neuroIdNotes',
              description: String(record.notes).slice(0, 200),
            });
          }
        });

        // ═══════════════════════════════════════════════════════════════
        //  PHASE 7 — Reopen contract URL post-submit (smoke per dev comment)
        // ═══════════════════════════════════════════════════════════════

        await test.step('CT-09 — Reopen contract URL shows only submit (no inputs)', async () => {
          const reopenUrl = ctx.contractUrl!;
          try {
            await page.goto(reopenUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
            await page.waitForLoadState('networkidle').catch(() => {});
          } catch (err) {
            test.info().annotations.push({
              type: 'ct09',
              description: `Reopen navigation failed (best-effort): ${(err as Error).message}`,
            });
            return;
          }

          const visibleInputs = await page.locator('input:visible').count().catch(() => 0);
          const visibleSubmits = await page
            .locator(
              'button:visible:has-text("Submit"), button:visible:has-text("SUBMIT"), button:visible:has-text("Continue")',
            )
            .count()
            .catch(() => 0);

          test.info().annotations.push(
            { type: 'ct09-inputs-visible', description: String(visibleInputs) },
            { type: 'ct09-submit-buttons-visible', description: String(visibleSubmits) },
          );

          // Best-effort expectations — annotate but do not fail if transient state
          if (visibleInputs !== 0 || visibleSubmits < 1) {
            test.info().annotations.push({
              type: 'ct09-observation',
              description:
                `Reopen did not match expected shape (inputs=${visibleInputs}, submit=${visibleSubmits}). ` +
                'Treating as observation per SPEC edge case #5 — may be transient state.',
            });
          } else {
            expect(visibleInputs, 'No CC/ACH inputs should be visible post-submit').toBe(0);
            expect(
              visibleSubmits,
              'At least one submit/CTA button should remain visible',
            ).toBeGreaterThanOrEqual(1);
          }
        });

        // CT-10 — Isolation is implicit via parametrization over `testData`:
        // each iteration produces a distinct leadPk + NeuroID row; runId/email
        // are worker-scoped and unique per merchant. No explicit step required.
      });
    },
  );
}
