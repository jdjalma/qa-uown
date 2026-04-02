/**
 * Task #477 — New TireAgent Flow (return 16-month) and (second look)
 * Milestone: RU03.26.1.50.0
 * Labels: dev::backend, priority::high, type::development
 *
 * Steps to Reproduce (updated from meeting with Priyanka/Sowjanya/Fernando):
 *
 * Pre-condition: GDS enabled, Taktile disabled in DevOps configuration (Ticket #419 pattern)
 *   use.taktile.for.decision: "false"
 *   use.gds.for.decision: "true"
 *   send.request.to.taktile: "false"
 *
 * Step 1 — Config GDS (pre-condition, not a test)
 * Step 2 — Pick TireAgent merchant with 16-month program (must be configured per env)
 * Step 3 — First submission WITHOUT bank data → DECLINED + isEligibleForExtraInfo=true
 *           + paymentDetailsList with 16-month preview + eligible_terms=NULL in DB
 * Step 4 — Second submission WITH bank data (same SSN) → APPROVED $1000 on 16-month
 * Step 5 — Merchant with ONLY 13-month program (no 16m) → paymentDetailsList empty
 * Step 6 — Second look eligible but DENIED on 16-month too (blocked: needs SSN from Becky)
 *
 * Business context:
 * - 13-month program is always preferred (shorter term). 16-month only offered when NOT eligible for 13.
 * - When denied on 13m, eligible_terms comes NULL from GDS.
 * - Backend logic: if eligible_terms=null AND isEligibleForExtraInfo=true → fetch 16m program → return paymentDetailsList
 * - Payment details for 16m are calculated by backend, NOT by GDS.
 * - EPO: 13m has 90-day special offer; 16m does NOT — always normal calculation.
 *
 * GitLab: https://gitlab.com/uown/backend/svc/-/work_items/477
 * Pipeline: new-api
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { MERCHANTS } from '@data/merchants.js';
import {
  generateRunId,
  generateTestPhone,
} from '@config/constants.js';
import { calculateDate } from '@helpers/date.helpers.js';
import type { SendApplicationBody } from '@api/bodies/application.body.js';

// ── Constants ─────────────────────────────────────────────────────────

const TEST_NAME = 'RU03.26.1.50.0_newTireAgentFlowReturn16MonthAndSecondLook_477';

/**
 * SSN for GDS second-look scenario — must return is_eligible_for_extra_info=true.
 * In stg, SSN 100000053 has been used for this scenario in manual validation.
 */
const SECOND_LOOK_SSN = process.env.TIRE_AGENT_SECOND_LOOK_SSN || '100000053';

// ── Test data ─────────────────────────────────────────────────────────

const testData = [
  {
    env: 'stg',
    state: 'CA',
    merchant: 'TireAgent',
    orderTotal: '1000.00',
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.STG),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

/** Build a sendApplication body for TireAgent */
function buildTireAgentBody(
  merchant: { username: string; password: string; number: string },
  opts: {
    runId: string;
    email: string;
    state: string;
    orderTotal: string;
    includeBankData?: boolean;
  },
): SendApplicationBody {
  const nextPayDate = calculateDate(7).replace(/\//g, '');
  const lastPayDate = calculateDate(-7).replace(/\//g, '');

  // Use a consistent applicant profile for a fixed SSN scenario.
  // IMPORTANT: Reusing the same SSN with varying address triggers DataMismatchStep
  // (ADDRESS_MISMATCH: same SSN + different zip/state from an existing APPROVED lead → denied before GDS).
  // If ADDRESS_MISMATCH occurs, cancel the conflicting APPROVED lead in the portal first.
  // This address (Columbus/92821/CA) produces DECLINED + isEligibleForExtraInfo=true in stg.
  const applicantProfile = {
    firstName: 'Brian',
    lastName: 'hayden',
    dob: '02241987',
    address1: '135 Buckeye Blvd',
    city: 'Columbus',
    zip: '92821',
    employer: 'Costco Wholesale',
    phone: '7653072625',
  } as const;

  // Use invoice breakdown aligned with the ticket reproduction example ($1000 total).
  const merchandiseSubtotal = 890.00;
  const deliveryCharge = 25.00;
  const salesTax = 85.00;
  const total = parseFloat(opts.orderTotal);

  const body: SendApplicationBody = {
    userName: merchant.username,
    setupPassword: merchant.password,
    merchantNumber: merchant.number,
    mainFirstName: applicantProfile.firstName,
    mainLastName: applicantProfile.lastName,
    mainDOB: applicantProfile.dob,
    mainSSN: SECOND_LOOK_SSN,
    mainAddress1: applicantProfile.address1,
    mainCity: applicantProfile.city,
    mainStateOrProvince: opts.state,
    mainPostalCode: applicantProfile.zip,
    mainCellPhone: generateTestPhone(),
    emailAddress: opts.email,
    mainEmployerName: applicantProfile.employer,
    mainPastBankruptcy: false,
    mainCurrentOrFutureBankruptcy: false,
    languagePreference: 'E',
    iovationFingerprintText: 'fingerPrintText',
    ipaddress: '192.168.0.2',
    desiredPaymentFrequency: 'WEEKLY',
    mainAnnualIncome: 56000,
    mainPayFrequency: 'WEEKLY',
    mainNextPayDate: nextPayDate,
    mainLastPayDate: lastPayDate,
    mainEmploymentDuration: '_1_TO_2_YEARS',
    shipToSameAsConsumer: true,
    merchandiseSubtotal: merchandiseSubtotal.toFixed(2),
    discountAmount: '0.00',
    deliveryCharge: deliveryCharge.toFixed(2),
    installationCharge: '0.00',
    salesTax: salesTax.toFixed(2),
    miscellaneousFees: '0.00',
    depositAmount: '0.00',
    orderTotal: total.toFixed(2),
    invoiceNumber: `R${10000 + Math.floor(Math.random() * 90000)}`,
    lineItem: [{
      lineItemLineNumber: '1',
      lineItemSerialNumber: `SKU-${Date.now()}`,
      lineItemProductNumber: 'TIRE-001',
      lineItemProductDescription: 'Test Tire Set',
      lineItemProductCategory: 'TIRES_&_WHEELS',
      lineItemType: 'D',
      lineItemQuantityOrdered: '1',
      lineItemUnitPrice: (merchandiseSubtotal + salesTax).toFixed(2), // 975.00
      lineItemBasePrice: merchandiseSubtotal.toFixed(2),
      lineItemTaxAmount: salesTax.toFixed(2),
      lineItemExtendedPrice: (merchandiseSubtotal + salesTax).toFixed(2),
    }],
  };

  if (opts.includeBankData) {
    body.mainBankAccountNumber = '8461956957777';
    body.mainBankRoutingNumber = '888777999';
  }

  return body;
}

/**
 * Resolve active program term_months for a merchant ref code.
 * Different environments may have different schemas, so we try multiple queries.
 */
async function getActiveMerchantProgramTerms(db: { getSingleString: (sql: string, params?: unknown[]) => Promise<string | null> }, merchantRefCode: string): Promise<string[]> {
  const attempts = [
    {
      name: 'uown_merchant_to_program/uown_merchant_program',
      sql: `SELECT string_agg(DISTINCT mp.term_months::text, ',' ORDER BY mp.term_months::text)
            FROM uown_merchant_to_program mtp
            JOIN uown_merchant m ON m.pk = mtp.merchant_pk
            JOIN uown_merchant_program mp ON mp.pk = mtp.program_pk
            WHERE m.ref_merchant_code = $1`,
    },
    {
      name: 'uown_los_merchant_program',
      sql: `SELECT string_agg(DISTINCT mp.term_months::text, ',' ORDER BY mp.term_months::text)
            FROM uown_los_merchant_program mp
            JOIN uown_merchant m ON m.pk = mp.merchant_pk
            WHERE m.ref_merchant_code = $1 AND mp.is_active = true`,
    },
  ] as const;

  for (const attempt of attempts) {
    try {
      const programs = await db.getSingleString(attempt.sql, [merchantRefCode]);
      if (!programs) continue;
      console.log(`[Setup] Program lookup via ${attempt.name}: ${programs}`);
      return programs.split(',').map(s => s.trim()).filter(Boolean);
    } catch (err) {
      console.log(`[Setup] Program lookup failed via ${attempt.name}: ${(err as Error).message}`);
    }
  }
  return [];
}

function maskKeepLast4(value?: string): string | undefined {
  if (!value) return undefined;
  const v = String(value);
  const last4 = v.slice(-4);
  return `${'*'.repeat(Math.max(0, v.length - 4))}${last4}`;
}

function sanitizeSendApplicationBody(body: SendApplicationBody): Partial<SendApplicationBody> {
  return {
    ...body,
    setupPassword: body.setupPassword ? '***' : body.setupPassword,
    mainSSN: body.mainSSN ? maskKeepLast4(String(body.mainSSN)) : body.mainSSN,
    mainCellPhone: body.mainCellPhone ? maskKeepLast4(String(body.mainCellPhone)) : body.mainCellPhone,
    emailAddress: body.emailAddress ? String(body.emailAddress).replace(/(.{2}).+(@.+)/, '$1***$2') : body.emailAddress,
    mainBankAccountNumber: body.mainBankAccountNumber ? maskKeepLast4(String(body.mainBankAccountNumber)) : body.mainBankAccountNumber,
    mainBankRoutingNumber: body.mainBankRoutingNumber ? maskKeepLast4(String(body.mainBankRoutingNumber)) : body.mainBankRoutingNumber,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────

for (const data of testData) {
  // ── Steps 3 & 4: Second look flow (serial — CT-02 depends on CT-01) ──

  test.describe(`${TEST_NAME} - ${data.env}/${data.merchant} — second look flow`, { tag: splitTags(data.tag) }, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ envName: data.env });

    // Shared state across serial CTs
    let deniedLeadUuid: string;
    let deniedLeadPk: string;
    let isEligible: boolean;
    let approvedLeadPk: string;
    const runId = generateRunId();
    const expectedInvoiceAmount = parseFloat(data.orderTotal);

    let merchantHas16mProgram = false;

    test.beforeAll(async ({ db }) => {
      // Important: db fixture is worker-scoped and reads process.env.ENV (not envName override).
      // Ensure ENV is aligned with the target environment to avoid querying the wrong DB.
      expect(process.env.ENV || 'sandbox', 'Set ENV to match the test environment (e.g. ENV=stg)').toBe(data.env);

      const m = MERCHANTS[data.merchant];
      expect(m, `Merchant ${data.merchant} not found`).toBeDefined();

      const terms = await getActiveMerchantProgramTerms(db, m.number);
      merchantHas16mProgram = terms.includes('16');
      console.log(`[Setup] Active terms for ${m.number}: ${terms.join(',') || '(none found)'}`);
    });

    test.beforeEach(() => {
      test.skip(!merchantHas16mProgram, `Blocked: merchant ${data.merchant} is not configured with an active 16-month program in ${data.env}.`);
    });

    // ── CT-01 (Step 3): sendApplication WITHOUT bank data ────────

    test('CT-01: Negativa + Second Look + Preview 16 meses — sendApplication SEM bank data', async ({ api, testEnv, db }, testInfo) => {
      const m = MERCHANTS[data.merchant];
      expect(m, `Merchant ${data.merchant} not found`).toBeDefined();

      const email = testEnv.generateUniqueEmailAlias();

      await test.step('Cleanup: expire previous approved leads for SSN (prevent DataMismatchStep / reapproval)', async () => {
        // Query leads that would trigger ADDRESS_MISMATCH or reapproval:
        // same SSN + UW APPROVED + non-expired + active lead status
        const conflictingLeads = await db.query<{ pk: string }>(
          `SELECT l.pk
           FROM uown_los_customer c
           JOIN uown_los_lead l ON l.pk = c.lead_pk
           JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk
           WHERE c.ssn = $1
             AND uw.uw_status = 'APPROVED'
             AND uw.approval_expiration_date >= CURRENT_DATE
             AND l.lead_status IN ('UW_APPROVED', 'CONTRACT_CREATED', 'SIGNED', 'FUNDING', 'FUNDED')`,
          [SECOND_LOOK_SSN],
        );

        if (conflictingLeads.length === 0) {
          console.log('[Cleanup] No conflicting approved leads found — clean environment.');
        }

        for (const row of conflictingLeads) {
          const leadPk = Number(row.pk);
          console.log(`[Cleanup] Expiring previously approved lead ${leadPk}`);
          const res = await api.lead.changeLeadStatus(m, leadPk, 'EXPIRED', 'Test cleanup — prevent DataMismatchStep / reapproval');
          console.log(`[Cleanup] Lead ${leadPk}: ${res.status} → ${JSON.stringify(res.body)}`);
        }
      });

      await test.step('Send application without bank data', async () => {
        const body = buildTireAgentBody(m, {
          runId,
          email,
          state: data.state,
          orderTotal: data.orderTotal,
          includeBankData: false,
        });

        await testInfo.attach('CT-01 payload (sanitized)', {
          body: JSON.stringify(sanitizeSendApplicationBody(body), null, 2),
          contentType: 'application/json',
        });

        // Step 3 requirement: first submission WITHOUT bank data
        expect(body.mainBankAccountNumber, 'mainBankAccountNumber must be absent in CT-01').toBeUndefined();
        expect(body.mainBankRoutingNumber, 'mainBankRoutingNumber must be absent in CT-01').toBeUndefined();

        const res = await api.application.sendApplication(body);
        const rawBody = res.body as Record<string, unknown>;

        await testInfo.attach('CT-01 response', {
          body: JSON.stringify(res.body, null, 2),
          contentType: 'application/json',
        });

        console.log(`[CT-01] status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}`);
        console.log(`[CT-01] isEligibleForExtraInfo=${res.body.isEligibleForExtraInfo}`);
        console.log(`[CT-01] accountNumber=${res.body.accountNumber}, authorizationNumber=${res.body.authorizationNumber}`);
        console.log(`[CT-01] paymentDetailsList=${JSON.stringify(res.body.paymentDetailsList)}`);
        console.log(`[CT-01] transactionMessage=${rawBody['transactionMessage']}`);

        // API contract — field must exist
        expect(res.status, 'HTTP 200').toBe(200);
        expect(res.body.appApprovalStatus, 'Should be DECLINED (denied on 13-month program)').toBe('DECLINED');
        expect('isEligibleForExtraInfo' in rawBody, 'isEligibleForExtraInfo field must be present in response').toBe(true);

        // Store lead identifiers
        deniedLeadUuid = res.body.accountNumber ?? '';
        deniedLeadPk = res.body.authorizationNumber ?? '';
        isEligible = res.body.isEligibleForExtraInfo === true;
        expect(deniedLeadUuid, 'accountNumber (leadUuid) should be present').toBeTruthy();
        expect(deniedLeadPk, 'authorizationNumber (leadPk) should be present').toBeTruthy();

        // DB evidence (best-effort, 15s timeout — outbound_api_log can be slow in STG)
        let leadRow: Record<string, unknown> | null = null;
        let uwData: Record<string, unknown> | null = null;
        let gdsLog: Record<string, unknown> | null = null;
        try {
          const dbTimeout = Promise.race([
            Promise.all([
              db.getLeadByPk(deniedLeadPk),
              db.getUwDataByLeadPk(deniedLeadPk),
              db.getGdsOutboundLogForLead(deniedLeadPk),
            ]),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DB evidence timeout (15s)')), 15_000)),
          ]);
          [leadRow, uwData, gdsLog] = await dbTimeout;
        } catch (e) {
          console.log(`[CT-01] DB evidence skipped: ${(e as Error).message}`);
        }

        await testInfo.attach('CT-01 DB lead', {
          body: JSON.stringify({ leadPk: deniedLeadPk, lead: leadRow }, null, 2),
          contentType: 'application/json',
        });
        await testInfo.attach('CT-01 DB uwData', {
          body: JSON.stringify({ leadPk: deniedLeadPk, uwData }, null, 2),
          contentType: 'application/json',
        });
        await testInfo.attach('CT-01 DB gdsOutboundLog', {
          body: JSON.stringify({ leadPk: deniedLeadPk, gdsOutboundLog: gdsLog }, null, 2),
          contentType: 'application/json',
        });

        // Step 3: isEligibleForExtraInfo must be true (second look flag)
        expect(res.body.isEligibleForExtraInfo, 'isEligibleForExtraInfo should be true — eligible for second look / 16-month program').toBe(true);

        // Step 3: paymentDetailsList must contain 16-month plan preview
        expect(res.body.paymentDetailsList, 'paymentDetailsList should be defined when eligible').toBeDefined();
        expect(res.body.paymentDetailsList!.length, 'paymentDetailsList should have entries (16-month preview)').toBeGreaterThan(0);
        const has16Month = res.body.paymentDetailsList!.some(pd => pd.termInMonths === 16);
        expect(has16Month, 'paymentDetailsList should contain a 16-month plan').toBe(true);

        console.log(`[CT-01] leadPk=${deniedLeadPk}, leadUuid=${deniedLeadUuid}, isEligible=${isEligible}`);
      });
    });

    // ── CT-02 (Step 3 DB): eligible_terms NULL in DB ─────────────

    test('CT-02: DB — eligible_terms nulo após negativa no programa de 13 meses', async ({ db }, testInfo) => {
      expect(deniedLeadPk, 'CT-01 must have set deniedLeadPk').toBeTruthy();

      await test.step('Query UW data for denied lead', async () => {
        const uwData = await db.getUwDataByLeadPk(deniedLeadPk);

        await testInfo.attach('CT-02 DB uwData', {
          body: JSON.stringify({ leadPk: deniedLeadPk, uwData }, null, 2),
          contentType: 'application/json',
        });

        console.log(`[CT-02] leadPk=${deniedLeadPk}`);
        console.log(`[CT-02] uw_status=${uwData?.['uw_status']}`);
        console.log(`[CT-02] is_eligible_for_extra_info=${uwData?.['is_eligible_for_extra_info']}`);
        console.log(`[CT-02] eligible_terms=${uwData?.['eligible_terms']}`);
        console.log(`[CT-02] lambda_segment=${uwData?.['lambda_segment']}`);

        expect(uwData, 'UW data should exist for the lead').toBeDefined();

        // Step 3 DB: is_eligible_for_extra_info must be true
        expect(
          uwData!['is_eligible_for_extra_info'],
          'is_eligible_for_extra_info should be true in DB',
        ).toBe(true);

        // Step 3 DB: eligible_terms must be NULL (denied on 13-month)
        // When eligible_terms is null AND isEligibleForExtraInfo=true → backend fetches 16m program
        expect(
          uwData!['eligible_terms'],
          'eligible_terms should be NULL (denied on 13-month program — backend uses this + isEligible flag to fetch 16m program)',
        ).toBeNull();
      });
    });

    // ── CT-03 (Step 4): sendApplication WITH bank data → APPROVED ─

    test('CT-03: Aprovação com dados bancários — sendApplication COM bank data (mesmo SSN)', async ({ api, testEnv, db }, testInfo) => {
      expect(deniedLeadPk, 'CT-01 must have set deniedLeadPk').toBeTruthy();
      expect(isEligible, 'CT-01 must have confirmed isEligibleForExtraInfo=true').toBe(true);

      const m = MERCHANTS[data.merchant];
      const email = testEnv.generateUniqueEmailAlias();

      await test.step('Send application with bank data and different address', async () => {
        const body = buildTireAgentBody(m, {
          runId,
          email,
          state: data.state,
          orderTotal: data.orderTotal,
          includeBankData: true,
        });

        await testInfo.attach('CT-03 payload (sanitized)', {
          body: JSON.stringify(sanitizeSendApplicationBody(body), null, 2),
          contentType: 'application/json',
        });

        expect(body.mainBankAccountNumber, 'mainBankAccountNumber must be present in CT-03').toBeTruthy();
        expect(body.mainBankRoutingNumber, 'mainBankRoutingNumber must be present in CT-03').toBeTruthy();

        const res = await api.application.sendApplication(body);
        const rawBody = res.body as Record<string, unknown>;

        await testInfo.attach('CT-03 response', {
          body: JSON.stringify(res.body, null, 2),
          contentType: 'application/json',
        });

        console.log(`[CT-03] status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}`);
        console.log(`[CT-03] creditLimit=${res.body.creditLimit}, isEligibleForExtraInfo=${res.body.isEligibleForExtraInfo}`);
        console.log(`[CT-03] accountNumber=${res.body.accountNumber}, authorizationNumber=${res.body.authorizationNumber}`);
        console.log(`[CT-03] paymentDetailsList=${JSON.stringify(res.body.paymentDetailsList)}`);
        console.log(`[CT-03] transactionMessage=${rawBody['transactionMessage']}`);

        expect(res.status, 'HTTP 200').toBe(200);

        // Step 4: resubmission with bank data should be APPROVED on 16-month program
        expect(res.body.appApprovalStatus, 'Should be APPROVED when resubmitting with bank data (16-month program)').toBe('APPROVED');

        // Step 4: creditLimit is the GDS-approved amount (may exceed invoice amount)
        expect(res.body.creditLimit, 'creditLimit must be present on approval').toBeDefined();
        expect(Number(res.body.creditLimit), 'creditLimit should be >= invoice amount').toBeGreaterThanOrEqual(expectedInvoiceAmount);

        // Validate term_months = 16 in paymentDetailsList
        const pdl = res.body.paymentDetailsList ?? [];
        expect(pdl.length, 'paymentDetailsList should have entries').toBeGreaterThan(0);
        const has16Month = pdl.some(pd => pd.termInMonths === 16);
        expect(has16Month, 'paymentDetailsList should contain 16-month plan').toBe(true);

        approvedLeadPk = res.body.authorizationNumber ?? '';
        console.log(`[CT-03] approvedLeadPk=${approvedLeadPk}`);

        // DB evidence (best-effort, 15s timeout — outbound_api_log can be slow in STG)
        if (approvedLeadPk) {
          let leadRow: Record<string, unknown> | null = null;
          let uwData: Record<string, unknown> | null = null;
          let gdsLog: Record<string, unknown> | null = null;
          try {
            const dbTimeout = Promise.race([
              Promise.all([
                db.getLeadByPk(approvedLeadPk),
                db.getUwDataByLeadPk(approvedLeadPk),
                db.getGdsOutboundLogForLead(approvedLeadPk),
              ]),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DB evidence timeout (15s)')), 15_000)),
            ]);
            [leadRow, uwData, gdsLog] = await dbTimeout;
          } catch (e) {
            console.log(`[CT-03] DB evidence skipped: ${(e as Error).message}`);
          }
          await testInfo.attach('CT-03 DB lead', {
            body: JSON.stringify({ leadPk: approvedLeadPk, lead: leadRow }, null, 2),
            contentType: 'application/json',
          });
          await testInfo.attach('CT-03 DB uwData', {
            body: JSON.stringify({ leadPk: approvedLeadPk, uwData }, null, 2),
            contentType: 'application/json',
          });
          await testInfo.attach('CT-03 DB gdsOutboundLog', {
            body: JSON.stringify({ leadPk: approvedLeadPk, gdsOutboundLog: gdsLog }, null, 2),
            contentType: 'application/json',
          });
        }
      });
    });
  });

  // ── Step 5: Merchant with ONLY 13-month program (no 16m) ───────

  test.describe(`${TEST_NAME} - ${data.env}/${data.merchant} — merchant sem programa 16 meses`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('CT-04: Merchant sem programa 16m — paymentDetailsList deve retornar vazio', async ({ api, testEnv, db }, testInfo) => {
      const merchantWithout16m = MERCHANTS[data.merchant];
      const runId = generateRunId();
      const email = testEnv.generateUniqueEmailAlias();

      await test.step('Cleanup: expire previous approved leads for SSN', async () => {
        const conflictingLeads = await db.query<{ pk: string }>(
          `SELECT l.pk
           FROM uown_los_customer c
           JOIN uown_los_lead l ON l.pk = c.lead_pk
           JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk
           WHERE c.ssn = $1
             AND uw.uw_status = 'APPROVED'
             AND uw.approval_expiration_date >= CURRENT_DATE
             AND l.lead_status IN ('UW_APPROVED', 'CONTRACT_CREATED', 'SIGNED', 'FUNDING', 'FUNDED')`,
          [SECOND_LOOK_SSN],
        );
        for (const row of conflictingLeads) {
          const leadPk = Number(row.pk);
          console.log(`[CT-04 Cleanup] Expiring previously approved lead ${leadPk}`);
          await api.lead.changeLeadStatus(merchantWithout16m, leadPk, 'EXPIRED', 'CT-04 cleanup');
        }
      });

      await test.step('Verify merchant has only 13-month program', async () => {
        const terms = await getActiveMerchantProgramTerms(db, merchantWithout16m.number);
        console.log(`[CT-04] Active programs for ${merchantWithout16m.number}: ${terms.join(',') || '(none)'}`);
        expect(terms, 'Merchant should have active programs').not.toHaveLength(0);
        expect(terms, 'Merchant should NOT have 16-month program').not.toContain('16');
      });

      await test.step('Send application without bank data', async () => {
        const body = buildTireAgentBody(merchantWithout16m, {
          runId,
          email,
          state: data.state,
          orderTotal: data.orderTotal,
          includeBankData: false,
        });

        const res = await api.application.sendApplication(body);

        await testInfo.attach('CT-04 response', {
          body: JSON.stringify(res.body, null, 2),
          contentType: 'application/json',
        });

        console.log(`[CT-04] status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}`);
        console.log(`[CT-04] isEligibleForExtraInfo=${res.body.isEligibleForExtraInfo}`);
        console.log(`[CT-04] paymentDetailsList=${JSON.stringify(res.body.paymentDetailsList)}`);

        expect(res.status, 'HTTP 200').toBe(200);
        expect(res.body.appApprovalStatus, 'Should be DECLINED').toBe('DECLINED');

        // GDS still marks as eligible for second look
        expect(res.body.isEligibleForExtraInfo, 'isEligibleForExtraInfo should still be true from GDS').toBe(true);

        // Step 5: No 16-month program → paymentDetailsList must be empty
        const pdl = res.body.paymentDetailsList ?? [];
        expect(pdl.length, 'paymentDetailsList should be empty — no 16-month program exists for this merchant').toBe(0);
      });
    });
  });

  // ── CT-05: Merchant with ONLY 16-month program (no 13m) ────────

  test.describe(`${TEST_NAME} - ${data.env}/${data.merchant} — merchant apenas programa 16 meses`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('CT-05: Merchant só com programa 16m — comportamento do second look sem programa 13m', async ({ api, testEnv, db }, testInfo) => {
      const m = MERCHANTS[data.merchant];
      const runId = generateRunId();
      const email = testEnv.generateUniqueEmailAlias();

      await test.step('Cleanup: expire previous approved leads for SSN', async () => {
        const conflictingLeads = await db.query<{ pk: string }>(
          `SELECT l.pk
           FROM uown_los_customer c
           JOIN uown_los_lead l ON l.pk = c.lead_pk
           JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk
           WHERE c.ssn = $1
             AND uw.uw_status = 'APPROVED'
             AND uw.approval_expiration_date >= CURRENT_DATE
             AND l.lead_status IN ('UW_APPROVED', 'CONTRACT_CREATED', 'SIGNED', 'FUNDING', 'FUNDED')`,
          [SECOND_LOOK_SSN],
        );
        for (const row of conflictingLeads) {
          const leadPk = Number(row.pk);
          console.log(`[CT-05 Cleanup] Expiring previously approved lead ${leadPk}`);
          await api.lead.changeLeadStatus(m, leadPk, 'EXPIRED', 'CT-05 cleanup');
        }
      });

      await test.step('Verify merchant has only 16-month program', async () => {
        const terms = await getActiveMerchantProgramTerms(db, m.number);
        console.log(`[CT-05] Active programs for ${m.number}: ${terms.join(',') || '(none)'}`);
        expect(terms, 'Merchant should have active programs').not.toHaveLength(0);
        expect(terms, 'Merchant should NOT have 13-month program').not.toContain('13');
        expect(terms, 'Merchant should have 16-month program').toContain('16');
      });

      await test.step('Send application without bank data', async () => {
        const body = buildTireAgentBody(m, {
          runId,
          email,
          state: data.state,
          orderTotal: data.orderTotal,
          includeBankData: false,
        });

        const res = await api.application.sendApplication(body);

        await testInfo.attach('CT-05 response', {
          body: JSON.stringify(res.body, null, 2),
          contentType: 'application/json',
        });

        console.log(`[CT-05] status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}`);
        console.log(`[CT-05] isEligibleForExtraInfo=${res.body.isEligibleForExtraInfo}`);
        console.log(`[CT-05] paymentDetailsList=${JSON.stringify(res.body.paymentDetailsList)}`);
        console.log(`[CT-05] creditLimit=${res.body.creditLimit}`);

        expect(res.status, 'HTTP 200').toBe(200);

        // Log the behavior for analysis — merchant has only 16m, no 13m
        const pdl = res.body.paymentDetailsList ?? [];
        const termMonths = pdl.map(p => p.termInMonths);
        console.log(`[CT-05] termMonths in paymentDetailsList: ${JSON.stringify(termMonths)}`);

        // Attach evidence for report
        await testInfo.attach('CT-05 analysis', {
          body: JSON.stringify({
            appApprovalStatus: res.body.appApprovalStatus,
            isEligibleForExtraInfo: res.body.isEligibleForExtraInfo,
            creditLimit: res.body.creditLimit,
            paymentDetailsCount: pdl.length,
            termMonths,
          }, null, 2),
          contentType: 'application/json',
        });
      });
    });
  });

  // ── CT-06: Merchant with NO active programs ───────────────────

  test.describe(`${TEST_NAME} - ${data.env}/${data.merchant} — merchant sem programas ativos`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('CT-06: Merchant sem nenhum programa ativo — comportamento esperado', async ({ api, testEnv, db }, testInfo) => {
      const m = MERCHANTS[data.merchant];
      const runId = generateRunId();
      const email = testEnv.generateUniqueEmailAlias();

      await test.step('Cleanup: expire previous approved leads for SSN', async () => {
        const conflictingLeads = await db.query<{ pk: string }>(
          `SELECT l.pk
           FROM uown_los_customer c
           JOIN uown_los_lead l ON l.pk = c.lead_pk
           JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk
           WHERE c.ssn = $1
             AND uw.uw_status = 'APPROVED'
             AND uw.approval_expiration_date >= CURRENT_DATE
             AND l.lead_status IN ('UW_APPROVED', 'CONTRACT_CREATED', 'SIGNED', 'FUNDING', 'FUNDED')`,
          [SECOND_LOOK_SSN],
        );
        for (const row of conflictingLeads) {
          const leadPk = Number(row.pk);
          console.log(`[CT-06 Cleanup] Expiring previously approved lead ${leadPk}`);
          await api.lead.changeLeadStatus(m, leadPk, 'EXPIRED', 'CT-06 cleanup');
        }
      });

      await test.step('Verify merchant has no active programs', async () => {
        const terms = await getActiveMerchantProgramTerms(db, m.number);
        console.log(`[CT-06] Active programs for ${m.number}: ${terms.join(',') || '(none)'}`);
        expect(terms, 'Merchant should have NO active programs').toHaveLength(0);
      });

      await test.step('Send application without bank data', async () => {
        const body = buildTireAgentBody(m, {
          runId,
          email,
          state: data.state,
          orderTotal: data.orderTotal,
          includeBankData: false,
        });

        const res = await api.application.sendApplication(body);

        await testInfo.attach('CT-06 response', {
          body: JSON.stringify(res.body, null, 2),
          contentType: 'application/json',
        });

        console.log(`[CT-06] status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}`);
        console.log(`[CT-06] isEligibleForExtraInfo=${res.body.isEligibleForExtraInfo}`);
        console.log(`[CT-06] paymentDetailsList=${JSON.stringify(res.body.paymentDetailsList)}`);
        console.log(`[CT-06] transactionMessage=${(res.body as Record<string, unknown>)['transactionMessage']}`);

        expect(res.status, 'HTTP 200').toBe(200);

        const pdl = res.body.paymentDetailsList ?? [];
        const termMonths = pdl.map(p => p.termInMonths);
        console.log(`[CT-06] termMonths in paymentDetailsList: ${JSON.stringify(termMonths)}`);

        await testInfo.attach('CT-06 analysis', {
          body: JSON.stringify({
            appApprovalStatus: res.body.appApprovalStatus,
            isEligibleForExtraInfo: res.body.isEligibleForExtraInfo,
            creditLimit: res.body.creditLimit,
            paymentDetailsCount: pdl.length,
            termMonths,
          }, null, 2),
          contentType: 'application/json',
        });
      });
    });
  });
}
