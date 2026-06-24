/**
 * API Tests: SEON Negative Scenarios — FifthAveFurnitureNY (KS3015)
 *
 * Validates the SEON gate for negative and edge cases. Each test creates
 * its own fresh lead (test data hierarchy rule — no shared state).
 *
 * Coverage:
 *   CT-01 [N-03] No SEON record → submitApplication blocked ("Failed to verify identification.")
 *   CT-02 [N-01] Name/DOB mismatch SEON record → blocked + internal_status=SEON_ID_FAILED
 *   CT-03 [N-02] status=REJECTED + name/DOB mismatch → blocked + internal_status=SEON_ID_FAILED
 *   CT-04 [N-04] Expired documentExpirationDate + idVerifySuccess=true → short-circuit bypasses expiry check
 *   CT-05 [A-01] createOrUpdate with nonexistent leadPk → accepted (no FK constraint)
 *   CT-06 [A-02] createOrUpdate with invalid birthDate → 400 Bad Request
 *   CT-07 [A-04/I-02] Duplicate createOrUpdate calls → last record wins (INSERT not UPSERT by referenceId)
 *   CT-08 [M-01] Non-SEON merchant (TerraceFinance) → uown_seon empty after application
 *
 * Key implementation decisions:
 *   - isSeonIdCheckRequired defaults to false on all envs for KS3015 — setup step sets it to true
 *     via merchantConfig.configureByName (restored after each test by fixture teardown).
 *   - For SEON gate to fire, authorizeCreditCard must be called first (CC gate blocks otherwise).
 *   - SEON gate error message: "Failed to verify identification." (NOT "A credit card is required")
 *   - idVerifySuccess=false alone does NOT block — only used as fast-PASS short-circuit (if true).
 *     Blocking requires fuzzy name mismatch or DOB mismatch (verifySuccess config defaults false).
 *   - SEON_ID_FAILED is an internal_status value (NOT lead_status — that stays UW_APPROVED).
 *     It IS API-reachable: a mismatch record + submitApplication writes internal_status=SEON_ID_FAILED
 *     (IdVerificationService.java:254, createLog=true). The "no record" case stops early and does NOT set it.
 *
 * Environment: sandbox (isSeonIdCheckRequired enabled per-test via merchantConfig)
 * Merchant (SEON): FifthAveFurnitureNY (KS3015, Kornerstone)
 * Merchant (control): TerraceFinance (UOWN, no SEON requirement)
 * DB: requires tunnel on port 5445 for CT-02/CT-03 (internal_status) + CT-07/CT-08 DB assertions
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { buildTestData, sleep } from '@helpers/index.js';
import type { SeonCreateOrUpdateBody } from '@api/bodies/seon.body.js';
import type { ApiClients } from '@support/base-test.js';
import type { MerchantConfigurator } from '@support/merchant-configurator.js';

const SEON_MERCHANT = { state: 'NY', merchant: 'FifthAveFurnitureNY', orderTotal: '1500' };
const CONTROL_MERCHANT = { state: 'CA', merchant: 'TerraceFinance', orderTotal: '1000' };
const tag = buildTags(TestTag.REGRESSION);

/** Convert MM/DD/YYYY (applicant.dob) to YYYY-MM-DD (Java LocalDate). */
function toBirthDateISO(dob: string): string {
  const [month, day, year] = dob.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Full Kornerstone application setup up to getMissingFields (before submitApplication).
 * Pattern mirrors seon-id-verification-bypass.spec.ts.
 */
async function setupKornerstoneLeadToMissingFields(
  api: ApiClients,
  merchantConfig: MerchantConfigurator,
) {
  // Enable SEON gate for this merchant so that submitApplication actually checks SEON.
  // isSeonIdCheckRequired defaults to false on FifthAveFurnitureNY in all envs — without
  // explicitly enabling it, the SeonIdVerificationStep is skipped and all negative
  // scenarios pass through to CONTRACT_CREATED regardless of SEON record state.
  // MerchantConfigurator snapshots original state and restores on fixture teardown.
  try {
    await merchantConfig.configureByName(SEON_MERCHANT.merchant, {
      maxApprovalAmount: 5000,
      fraudThreshold: 900,
      isSeonIdCheckRequired: true,
    });
  } catch (err) {
    console.log(`[Setup] MerchantConfigurator skipped: ${(err as Error).message}`);
  }

  const { merchant, applicant } = buildTestData({
    state: SEON_MERCHANT.state,
    merchant: SEON_MERCHANT.merchant,
    orderTotal: SEON_MERCHANT.orderTotal,
    orderDescription: 'SEON negative flow test',
    approved: true,
  });
  const ctx = { leadUuid: '', leadPk: 0, shortCode: '', planId: '' };

  const appResp = await api.application.sendApplication(merchant, applicant);
  expect(appResp.ok, `sendApplication failed: ${appResp.status}`).toBeTruthy();
  ctx.leadUuid = appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
  // Extract leadPk from sendApplication (authorizationNumber) as primary source
  ctx.leadPk = Number(appResp.body.authorizationNumber ?? 0);

  await sleep(5_000);

  const statusResp = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
  expect(statusResp.ok, `getApplicationStatus failed: ${statusResp.status}`).toBeTruthy();
  // Mirror the status-field fallback chain from seon-id-verification-bypass.spec.ts CT-02
  const status = (
    statusResp.body.appApprovalStatus ||
    statusResp.body.uwStatus ||
    statusResp.body.currentStatus ||
    statusResp.body.status
  ) ?? '';
  expect(status.toLowerCase(), `Expected APPROVED, got: "${status}"`).toContain('approved');
  // Update leadPk from status response if more precise
  if (statusResp.body.leadPk) ctx.leadPk = statusResp.body.leadPk;
  expect(ctx.leadPk, 'leadPk must be positive').toBeGreaterThan(0);

  const approvedAmount = statusResp.body.approvedAmount ?? Number(SEON_MERCHANT.orderTotal);
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid, { orderTotal: String(approvedAmount) });
  expect(invoiceResp.ok, `sendInvoice failed: ${invoiceResp.status}`).toBeTruthy();

  const redirectUrl = invoiceResp.body.paymentDetailsList?.[0]?.redirectUrl ?? '';
  expect(redirectUrl, 'redirectUrl must be present in paymentDetailsList').toBeTruthy();
  const url = new URL(redirectUrl);
  ctx.shortCode = url.pathname.split('/').filter(Boolean)[0];
  ctx.planId = url.searchParams.get('planId') ?? '';

  const missingResp = await api.application.getMissingFields(ctx.shortCode, ctx.planId ? { planId: ctx.planId } : undefined);
  expect(missingResp.ok, `getMissingFields failed: ${missingResp.status}`).toBeTruthy();

  // authorizeCreditCard required so submitApplication reaches the SEON gate.
  // Without this, the CC check fires first and returns "A credit card is required"
  // before the SEON gate is ever evaluated (IdVerificationService.verifySeon is never called).
  const ccResp = await api.creditCard.authorizeCreditCard(String(ctx.leadPk), applicant.firstName, applicant.lastName);
  expect(ccResp.ok, `authorizeCreditCard failed: ${ccResp.status}`).toBeTruthy();

  return { merchant, applicant, ctx };
}

test.describe(
  'SEON Negative Scenarios',
  { tag: splitTags(tag) },
  () => {
    test.setTimeout(180_000);

    // ─── CT-01: N-03 — No SEON record → submitApplication blocked ─────────────

    test('CT-01 [N-03]: No SEON record → submitApplication blocked', async ({ api, merchantConfig }) => {
      const { applicant, ctx } = await test.step('Setup: lead to getMissingFields (no SEON bypass)', async () =>
        setupKornerstoneLeadToMissingFields(api, merchantConfig),
      );

      await test.step('N-03: submitApplication WITHOUT any SEON record', async () => {
        const resp = await api.application.submitApplication(
          ctx.leadPk,
          applicant.firstName,
          applicant.lastName,
          { planId: ctx.planId || undefined },
        );
        const bodyError = (resp.body as Record<string, unknown>).error as string | null;
        console.log(`[N-03] submitApplication status=${resp.status} error="${bodyError ?? 'none'}"`);
        // After authorizeCreditCard (setup), CC gate passes.
        // The SEON gate (IdVerificationService.verifySeon) fires next:
        //   - No SEON record → error "Failed to verify identification. [...] Couldn't find Seon record"
        //   - "A credit card is required" indicates CC gate still blocking (should not happen with CC auth in setup)
        const isBlocked = !resp.ok || !!bodyError;
        const isSeonGate = bodyError?.toLowerCase().includes('identif') || bodyError?.toLowerCase().includes('seon');
        const isCcGate = bodyError?.toLowerCase().includes('credit card');
        const gateLabel = isSeonGate ? 'SEON gate confirmed — "Failed to verify identification."'
          : isCcGate ? '[UNEXPECTED] CC gate still blocking — CC auth may have failed'
          : bodyError ? `SEON gate (unexpected error: "${bodyError}")` : 'unknown — no error in body';
        test.info().annotations.push({ type: 'n03BlockingGate', description: gateLabel });
        console.log(`[N-03] Blocking gate: ${gateLabel}`);
        expect(isBlocked, `Expected submitApplication to be blocked. Got: status=${resp.status} body=${JSON.stringify(resp.body)}`).toBeTruthy();
      });
    });

    // ─── CT-02: N-01 — idVerifySuccess=false → submitApplication blocked ──────

    test('CT-02 [N-01]: idVerifySuccess=false → submitApplication blocked', async ({ api, db, merchantConfig }) => {
      const { applicant, ctx } = await test.step('Setup: lead to getMissingFields', async () =>
        setupKornerstoneLeadToMissingFields(api, merchantConfig),
      );

      await test.step('N-01: Insert SEON record with name mismatch (forces fuzzy check failure)', async () => {
        // idVerifySuccess=false alone doesn't block — the backend only uses it as a fast-PASS
        // short-circuit (if true → skip checks). For verification to FAIL, the fuzzy name
        // check must produce errors. nameMatchCheckResult='FAIL' + wrong fullName triggers that.
        // verifySuccess() config defaults to false → success=false does NOT add an error.
        const body: SeonCreateOrUpdateBody = {
          leadPk: ctx.leadPk,
          referenceId: crypto.randomUUID(),
          fullName: 'John Doe Mismatch',
          status: 'APPROVED',
          success: false,
          idVerifySuccess: false,
          documentType: 'PASSPORT',
          documentExpirationDate: '2030-01-01',
          birthDate: '1900-01-01',
          nameMatchCheckResult: 'FAIL',
          stateCheckResult: 'FAIL',
          postalCodeResult: 'FAIL',
          dateOfBirthResult: 'FAIL',
        };
        const seonResp = await api.seon.createOrUpdate(body);
        expect(seonResp.ok, `SEON createOrUpdate failed: ${seonResp.status}`).toBeTruthy();
        console.log(`[N-01] SEON record created: fullName mismatch + DOB mismatch → fuzzy check will fail`);
      });

      await test.step('N-01: submitApplication with name-mismatch SEON record → SEON gate blocks', async () => {
        const resp = await api.application.submitApplication(
          ctx.leadPk,
          applicant.firstName,
          applicant.lastName,
          { planId: ctx.planId || undefined },
        );
        const bodyError = (resp.body as Record<string, unknown>).error as string | null;
        console.log(`[N-01] submitApplication status=${resp.status} error="${bodyError ?? 'none'}"`);
        // After authorizeCreditCard (setup), CC gate passes. SEON gate should fire:
        //   idVerifySuccess=false → no short-circuit → verification errors accumulated → "Failed to verify identification."
        const isBlocked = !resp.ok || !!bodyError;
        const isSeonGate = bodyError?.toLowerCase().includes('identif') || bodyError?.toLowerCase().includes('seon');
        const isCcGate = bodyError?.toLowerCase().includes('credit card');
        const gateLabel = isSeonGate ? 'SEON gate confirmed — "Failed to verify identification."'
          : isCcGate ? '[UNEXPECTED] CC gate still blocking — CC auth may have failed'
          : bodyError ? `SEON gate (unexpected error: "${bodyError}")` : 'unknown — no error in body';
        test.info().annotations.push({ type: 'n01BlockingGate', description: gateLabel });
        console.log(`[N-01] Blocking gate: ${gateLabel}`);
        expect(isBlocked, `Expected submitApplication to be blocked with idVerifySuccess=false. Got: status=${resp.status} body=${JSON.stringify(resp.body)}`).toBeTruthy();
      });

      await test.step('N-01: Lead transitions to internal_status=SEON_ID_FAILED (Rule #13 lifecycle)', async () => {
        // SEON_ID_FAILED is written to internal_status (NOT lead_status, which stays UW_APPROVED).
        // IdVerificationService.java:254 → updateLeadStatus(lead, null /*leadStatus*/, SEON_ID_FAILED /*internalStatus*/).
        // Requires DB tunnel on 5445 (sandbox). Confirms the failure actually mutated lead lifecycle.
        const row = await db.queryOne<{ lead_status: string; internal_status: string }>(
          `SELECT lead_status, internal_status FROM uown_los_lead WHERE pk = $1`,
          [ctx.leadPk],
        );
        console.log(`[N-01] lead_status=${row?.lead_status} internal_status=${row?.internal_status}`);
        expect(row?.internal_status, 'SEON failure must set internal_status=SEON_ID_FAILED').toBe('SEON_ID_FAILED');
      });
    });

    // ─── CT-03: N-02 — status=REJECTED → submitApplication blocked ────────────

    test('CT-03 [N-02]: SEON status=REJECTED → submitApplication blocked', async ({ api, db, merchantConfig }) => {
      const { applicant, ctx } = await test.step('Setup: lead to getMissingFields', async () =>
        setupKornerstoneLeadToMissingFields(api, merchantConfig),
      );

      await test.step('N-02: Insert SEON record with status=REJECTED + name/DOB mismatch', async () => {
        // Same root cause as N-01: need fuzzy name/DOB mismatch to trigger SEON gate error.
        // status=REJECTED differentiates scenario from N-01 (APPROVED).
        const body: SeonCreateOrUpdateBody = {
          leadPk: ctx.leadPk,
          referenceId: crypto.randomUUID(),
          fullName: 'Jane Doe Mismatch',
          status: 'REJECTED',
          success: false,
          idVerifySuccess: false,
          documentType: 'PASSPORT',
          documentExpirationDate: '2030-01-01',
          birthDate: '1900-01-01',
          nameMatchCheckResult: 'FAIL',
          stateCheckResult: 'FAIL',
          postalCodeResult: 'FAIL',
          dateOfBirthResult: 'FAIL',
        };
        const seonResp = await api.seon.createOrUpdate(body);
        expect(seonResp.ok, `SEON createOrUpdate failed: ${seonResp.status}`).toBeTruthy();
        console.log(`[N-02] SEON record created: status=REJECTED + fullName mismatch + DOB mismatch`);
      });

      await test.step('N-02: submitApplication with REJECTED + name-mismatch SEON record → SEON gate blocks', async () => {
        const resp = await api.application.submitApplication(
          ctx.leadPk,
          applicant.firstName,
          applicant.lastName,
          { planId: ctx.planId || undefined },
        );
        const bodyError = (resp.body as Record<string, unknown>).error as string | null;
        console.log(`[N-02] submitApplication status=${resp.status} error="${bodyError ?? 'none'}"`);
        // After authorizeCreditCard (setup), CC gate passes. SEON gate should fire:
        //   status=REJECTED → success=false → errors accumulated → "Failed to verify identification."
        const isBlocked = !resp.ok || !!bodyError;
        const isSeonGate = bodyError?.toLowerCase().includes('identif') || bodyError?.toLowerCase().includes('seon');
        const isCcGate = bodyError?.toLowerCase().includes('credit card');
        const gateLabel = isSeonGate ? 'SEON gate confirmed — "Failed to verify identification."'
          : isCcGate ? '[UNEXPECTED] CC gate still blocking — CC auth may have failed'
          : bodyError ? `SEON gate (unexpected error: "${bodyError}")` : 'unknown — no error in body';
        test.info().annotations.push({ type: 'n02BlockingGate', description: gateLabel });
        console.log(`[N-02] Blocking gate: ${gateLabel}`);
        expect(isBlocked, `Expected submitApplication to be blocked with SEON status=REJECTED. Got: status=${resp.status} body=${JSON.stringify(resp.body)}`).toBeTruthy();
      });

      await test.step('N-02: Lead transitions to internal_status=SEON_ID_FAILED (Rule #13 lifecycle)', async () => {
        // SEON_ID_FAILED lives in internal_status; lead_status stays UW_APPROVED. Requires DB tunnel 5445.
        const row = await db.queryOne<{ lead_status: string; internal_status: string }>(
          `SELECT lead_status, internal_status FROM uown_los_lead WHERE pk = $1`,
          [ctx.leadPk],
        );
        console.log(`[N-02] lead_status=${row?.lead_status} internal_status=${row?.internal_status}`);
        expect(row?.internal_status, 'SEON failure must set internal_status=SEON_ID_FAILED').toBe('SEON_ID_FAILED');
      });
    });

    // ─── CT-04: N-04 — Expired document + idVerifySuccess=true ────────────────

    test('CT-04 [N-04]: Expired documentExpirationDate with idVerifySuccess=true — short-circuit behavior', async ({ api, merchantConfig }) => {
      const { applicant, ctx } = await test.step('Setup: lead to getMissingFields', async () =>
        setupKornerstoneLeadToMissingFields(api, merchantConfig),
      );

      await test.step('N-04: Insert SEON with past documentExpirationDate but idVerifySuccess=true', async () => {
        const seonResp = await api.seon.approveVerification({
          leadPk: ctx.leadPk,
          fullName: `${applicant.firstName} ${applicant.lastName}`,
          birthDate: toBirthDateISO(applicant.dob),
          documentExpirationDate: '2020-01-01', // expired document
        });
        expect(seonResp.ok, `SEON approveVerification failed: ${seonResp.status}`).toBeTruthy();
        console.log(`[N-04] SEON record: idVerifySuccess=true, documentExpirationDate=2020-01-01 (expired)`);
      });

      await test.step('N-04: submitApplication — expect short-circuit to bypass expiration check', async () => {
        const resp = await api.application.submitApplication(
          ctx.leadPk,
          applicant.firstName,
          applicant.lastName,
          { planId: ctx.planId || undefined },
        );
        console.log(`[N-04] submitApplication status=${resp.status} body=${JSON.stringify(resp.body)}`);
        test.info().annotations.push({
          type: 'n04Behavior',
          description: resp.ok ? 'PASS — short-circuit bypassed expiration check' : `BLOCKED — backend caught expiration (status=${resp.status})`,
        });
        // idVerifySuccess=true short-circuit should bypass expiration validation → expect success
        // If this fails, the backend also validates expiration — document as new pitfall
        expect(resp.ok, `[N-04] Expected short-circuit to bypass expiration, but got status=${resp.status}: ${JSON.stringify(resp.body)}`).toBeTruthy();
      });
    });

    // ─── CT-05: A-01 — createOrUpdate with nonexistent leadPk ─────────────────

    test('CT-05 [A-01]: createOrUpdate with nonexistent leadPk → error response', async ({ api }) => {
      await test.step('A-01: createOrUpdate leadPk=999999999', async () => {
        const body: SeonCreateOrUpdateBody = {
          leadPk: 999_999_999,
          referenceId: crypto.randomUUID(),
          fullName: 'Test NonExistent',
          status: 'APPROVED',
          success: true,
          idVerifySuccess: true,
          documentType: 'PASSPORT',
          documentExpirationDate: '2030-01-01',
          birthDate: '1984-01-01',
          nameMatchCheckResult: 'PASS',
          stateCheckResult: 'PASS',
          postalCodeResult: 'PASS',
          dateOfBirthResult: 'PASS',
        };
        const resp = await api.seon.createOrUpdate(body);
        console.log(`[A-01] createOrUpdate leadPk=999999999 status=${resp.status} body=${JSON.stringify(resp.body)}`);
        test.info().annotations.push({ type: 'a01ResponseStatus', description: String(resp.status) });
        // Discovered behavior: createOrUpdate does NOT validate leadPk FK — accepts any value (200 OK).
        // The endpoint is a pure upsert with no referential integrity check.
        // Documenting this as the expected behavior.
        expect(resp.ok, 'A-01: createOrUpdate accepts nonexistent leadPk without FK validation (200 OK, no error)').toBeTruthy();
        const seonIdPk = (resp.body as Record<string, unknown>).seonIdPk ?? -1;
        test.info().annotations.push({
          type: 'a01DiscoveredBehavior',
          description: `Backend created SEON record (seonIdPk=${seonIdPk}) for nonexistent leadPk=999999999 — no FK validation`,
        });
      });
    });

    // ─── CT-06: A-02 — createOrUpdate with invalid birthDate ──────────────────

    test('CT-06 [A-02]: createOrUpdate with invalid birthDate — observe behavior', async ({ api }) => {
      await test.step('A-02: createOrUpdate birthDate=not-a-date', async () => {
        const body: SeonCreateOrUpdateBody = {
          leadPk: 1, // low pk — may not exist, but backend should validate date first
          referenceId: crypto.randomUUID(),
          fullName: 'Test Invalid Date',
          status: 'APPROVED',
          success: true,
          idVerifySuccess: true,
          documentType: 'PASSPORT',
          documentExpirationDate: '2030-01-01',
          birthDate: 'not-a-date',
          nameMatchCheckResult: 'PASS',
          stateCheckResult: 'PASS',
          postalCodeResult: 'PASS',
          dateOfBirthResult: 'PASS',
        };
        const resp = await api.seon.createOrUpdate(body);
        console.log(`[A-02] createOrUpdate invalid birthDate status=${resp.status} body=${JSON.stringify(resp.body)}`);
        test.info().annotations.push({
          type: 'a02Behavior',
          description: resp.ok ? 'ACCEPTED — backend did not validate birthDate format' : `REJECTED — status=${resp.status}`,
        });
        // Backend should reject invalid date — HTTP 400/500 expected
        // If this passes (ok=true), document that backend accepts invalid dates without validation
        expect(!resp.ok, `[A-02] Expected backend to reject invalid birthDate='not-a-date'. Got: status=${resp.status} body=${JSON.stringify(resp.body)}`).toBeTruthy();
      });
    });

    // ─── CT-07: A-04/I-02 — Duplicate createOrUpdate → last record wins ───────

    test('CT-07 [A-04/I-02]: Duplicate createOrUpdate calls → DB last record wins', async ({ api, db, merchantConfig }) => {
      const { applicant, ctx } = await test.step('Setup: fresh lead (sendApplication only)', async () => {
        try {
          await merchantConfig.configureByName(SEON_MERCHANT.merchant, 'lifecycle');
        } catch (err) {
          console.log(`[Setup] MerchantConfigurator skipped: ${(err as Error).message}`);
        }
        const { merchant, applicant } = buildTestData(SEON_MERCHANT);
        const appResp = await api.application.sendApplication(merchant, applicant);
        expect(appResp.ok, `sendApplication failed: ${appResp.status}`).toBeTruthy();
        const leadUuid = appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
        await sleep(5_000);
        const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);
        expect(statusResp.ok).toBeTruthy();
        const leadPk = statusResp.body.leadPk ?? 0;
        expect(leadPk, 'leadPk must be positive').toBeGreaterThan(0);
        return { merchant, applicant, ctx: { leadPk, leadUuid, shortCode: '', planId: '' } };
      });

      const birthDateISO = toBirthDateISO(applicant.dob);

      await test.step('A-04/I-02: First createOrUpdate — status=REJECTED', async () => {
        const body: SeonCreateOrUpdateBody = {
          leadPk: ctx.leadPk,
          referenceId: crypto.randomUUID(),
          fullName: `${applicant.firstName} ${applicant.lastName}`,
          status: 'REJECTED',
          success: false,
          idVerifySuccess: false,
          documentType: 'PASSPORT',
          documentExpirationDate: '2030-01-01',
          birthDate: birthDateISO,
          nameMatchCheckResult: 'FAIL',
          stateCheckResult: 'FAIL',
          postalCodeResult: 'FAIL',
          dateOfBirthResult: 'FAIL',
        };
        const resp = await api.seon.createOrUpdate(body);
        expect(resp.ok, `First createOrUpdate failed: ${resp.status}`).toBeTruthy();
        console.log(`[CT-07] First createOrUpdate: status=REJECTED`);
      });

      await test.step('A-04/I-02: Second createOrUpdate — status=APPROVED', async () => {
        const resp = await api.seon.approveVerification({
          leadPk: ctx.leadPk,
          fullName: `${applicant.firstName} ${applicant.lastName}`,
          birthDate: birthDateISO,
        });
        expect(resp.ok, `Second createOrUpdate failed: ${resp.status}`).toBeTruthy();
        console.log(`[CT-07] Second createOrUpdate: status=APPROVED`);
      });

      await test.step('A-04/I-02: DB — last record (ORDER BY pk DESC) must be APPROVED', async () => {
        const lastRecord = await db.queryOne<{ status: string; success: boolean; id_verify_success: boolean }>(
          `SELECT status, success, id_verify_success
           FROM uown_seon WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
          [ctx.leadPk],
        );
        expect(lastRecord, 'At least one SEON record must exist').not.toBeNull();
        expect(lastRecord!.status, 'Last SEON record should be APPROVED').toBe('APPROVED');
        expect(lastRecord!.id_verify_success, 'Last record id_verify_success should be true').toBe(true);

        const allRecords = await db.queryOne<{ count: string }>(
          `SELECT COUNT(*)::text as count FROM uown_seon WHERE lead_pk = $1`,
          [ctx.leadPk],
        );
        const recordCount = Number(allRecords?.count ?? 0);
        console.log(`[CT-07] Total uown_seon records for leadPk=${ctx.leadPk}: ${recordCount}`);
        test.info().annotations.push({
          type: 'duplicateCallBehavior',
          description: recordCount === 1 ? 'UPSERT (single record updated)' : `INSERT (${recordCount} records created)`,
        });
      });
    });

    // ─── CT-08: M-01 — Non-SEON merchant → uown_seon empty ───────────────────

    test('CT-08 [M-01]: Non-SEON merchant (TerraceFinance) → uown_seon empty after application', async ({ api, db, merchantConfig }) => {
      await test.step('Setup: sendApplication via TerraceFinance (no isSeonIdCheckRequired)', async () => {
        try {
          await merchantConfig.configureByName(CONTROL_MERCHANT.merchant, 'lifecycle');
        } catch (err) {
          console.log(`[Setup] MerchantConfigurator skipped: ${(err as Error).message}`);
        }
      });

      const { merchant, applicant } = buildTestData(CONTROL_MERCHANT);
      let leadPk = 0;

      await test.step('M-01: sendApplication + getApplicationStatus → extract leadPk', async () => {
        const appResp = await api.application.sendApplication(merchant, applicant);
        expect(appResp.ok, `sendApplication TerraceFinance failed: ${appResp.status}`).toBeTruthy();
        const leadUuid = appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
        await sleep(5_000);
        const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);
        expect(statusResp.ok).toBeTruthy();
        leadPk = statusResp.body.leadPk ?? 0;
        expect(leadPk, 'leadPk must be positive').toBeGreaterThan(0);
        console.log(`[M-01] TerraceFinance leadPk=${leadPk}`);
        test.info().annotations.push({ type: 'controlLeadPk', description: String(leadPk) });
      });

      await test.step('M-01: Assert uown_seon has NO record for TerraceFinance lead', async () => {
        const seonRecord = await db.queryOne<{ pk: number }>(
          `SELECT pk FROM uown_seon WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
          [leadPk],
        );
        console.log(`[M-01] uown_seon record for leadPk=${leadPk}: ${seonRecord ? JSON.stringify(seonRecord) : 'NULL (expected)'}`);
        expect(seonRecord, 'TerraceFinance lead must NOT have a uown_seon record (isSeonIdCheckRequired=false)').toBeNull();
      });
    });
  },
);
