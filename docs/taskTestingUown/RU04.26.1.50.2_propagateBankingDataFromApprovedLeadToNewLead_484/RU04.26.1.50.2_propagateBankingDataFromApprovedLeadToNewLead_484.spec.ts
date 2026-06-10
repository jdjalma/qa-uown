/**
 * Task #484 — Propagate Banking Data from Approved Lead to New Lead
 * Milestone: RU04.26.1.50.2
 *
 * Feature: New BankDataStep added after underwritingCheck in sendApplication pipeline.
 * When a returning customer applies WITHOUT banking data, and their previous approved lead
 * had banking data (source=SEND_APP) and was eligible for 16-month terms, the banking data
 * is automatically propagated to the new lead in uown_los_bank_account.
 *
 * BankDataStep propagates ONLY when ALL conditions are met:
 *   1. Config flag saveBankDataFromPreviousLead = true (default)
 *   2. UW status = APPROVED
 *   3. eligibleTerms contains "16" (16-month eligible merchant)
 *   4. previousUW is not blank (returning customer with prior UW)
 *   5. Request does NOT include banking data (mainBankAccountNumber absent)
 *   6. Previous lead has at least one bank account with source = SEND_APP
 *
 * Run: npx playwright test tests/taskTestingUown/RU04.26.1.50.2_propagateBankingDataFromApprovedLeadToNewLead_484/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/index.js';
import { buildSendApplicationBody } from '@api/bodies/index.js';
import { generateRunId } from '@config/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const TEST_NAME = 'RU04.26.1.50.2_propagateBankingDataFromApprovedLeadToNewLead_484';

// ── Banking data fixtures ─────────────────────────────────────────────────────

/** Used in setup lead — will be propagated to CT-01 lead */
const BANK_DATA_SETUP = {
  mainBankAccountNumber: '111000025',
  mainBankRoutingNumber: '021000021',  // JPMorgan Chase
};

/** Provided explicitly in CT-02 request — should NOT be replaced by propagation */
const BANK_DATA_CT02 = {
  mainBankAccountNumber: '987654321',
  mainBankRoutingNumber: '011000015',  // Bank of America
};

/** Used in CT-03 setup — TerraceFinance (13m), banking data exists but not propagated */
const BANK_DATA_CT03_SETUP = {
  mainBankAccountNumber: '222000025',
  mainBankRoutingNumber: '021000021',
};

// ── SQL ───────────────────────────────────────────────────────────────────────

const SQL_GET_BANK_ACCOUNT = `
  SELECT pk, lead_pk, customer_pk, account_number, routing_number,
         bank_name, bank_account_type, bank_account_duration, auto_pay, source
  FROM uown_los_bank_account
  WHERE lead_pk = $1::bigint
    AND is_deleted = false
  ORDER BY pk DESC
  LIMIT 1
`;

// ── Test data ─────────────────────────────────────────────────────────────────

const testData = [
  {
    env: 'qa2' as const,
    state: 'FL',
    /** KS3015 — 5th Ave Furniture (NY), programs: 13m + 16m (Kornerstone). Banking data + BIN → 16m eligible */
    merchant16m: 'FifthAveFurnitureNY',
    /** OL90202-0001 — TerraceFinance, programs: 13m only. eligibleTerms never contains "16" */
    merchant13m: 'TerraceFinance',
    orderTotal: '1000',
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION),
  },
  {
    env: 'qa1' as const,
    state: 'FL',
    /** KS3015 — 5th Ave Furniture (NY), programs: 13m + 16m (KW-16-2, KWC-2.3) */
    merchant16m: 'FifthAveFurnitureNY',
    /** OL90202-0001 — TerraceFinance, programs: 13m only */
    merchant13m: 'TerraceFinance',
    orderTotal: '1000',
    tag: buildTags(TestTag.QA1, TestTag.REGRESSION),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a fresh applicant with a given SSN (to reuse same customer across CTs) */
function buildApplicantWithSsn(ssn: string, state: string) {
  return {
    firstName: `TestFN${generateRunId()}`,
    lastName: `TestLN${generateRunId()}`,
    email: `test-484-${generateRunId()}@test.com`,
    ssn,
    phone: '4075551234',
    address: '200 E Las Olas Blvd',
    city: 'Fort Lauderdale',
    state,
    zip: '33301',
    dob: '01/01/1984',
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

for (const td of testData) {
  test.describe(`${TEST_NAME} - ${td.env}`, { tag: splitTags(td.tag) }, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ envName: td.env });

    /**
     * Shared state between CTs — populated in CT-00 (setup)
     * Shared SSN is reused by CT-01, CT-02, CT-03 so that previousLeadsCheck
     * finds the prior lead and underwritingCheck reuses previous UW (setting previousUW).
     */
    let sharedSsn = '';
    let setupLeadPk = '';  // Lead from CT-00: Kornerstone, HAS banking data (source=SEND_APP)
    let dbAvailable = false;

    // ─────────────────────────────────────────────────────────────────────────
    // CT-00 (Setup): Create the "previous approved lead" with banking data
    // This is the lead whose banking data should be propagated in CT-01.
    // DB assertions skip gracefully when SSH tunnel to qa2 is not available.
    // ─────────────────────────────────────────────────────────────────────────
    test('CT-00: Setup — criar lead anterior aprovado com banking data (Kornerstone, SEND_APP)', async ({ api, db }) => {
      test.setTimeout(120_000);

      const { merchant, applicant } = buildTestData({
        env: td.env,
        state: td.state,
        merchant: td.merchant16m,
        orderTotal: td.orderTotal,
        orderDescription: 'Setup 484: previous lead with banking data',
        approved: true,
      });

      sharedSsn = applicant.ssn;

      const body = {
        ...buildSendApplicationBody(merchant, applicant),
        ...BANK_DATA_SETUP,
      };

      const resp = await api.application.sendApplication(body);
      expect(resp.ok, `Setup sendApplication failed: ${resp.status} — ${JSON.stringify(resp.body)}`).toBeTruthy();

      setupLeadPk = String(resp.body.authorizationNumber ?? '');
      expect(setupLeadPk, 'Setup: authorizationNumber (leadPk) deve estar presente').toBeTruthy();
      expect(Number(setupLeadPk), 'Setup: leadPk deve ser > 0 (UW_APPROVED)').toBeGreaterThan(0);

      // Check DB availability (qa2 requires SSH tunnel)
      try {
        await db.queryOne('SELECT 1', []);
        dbAvailable = true;
      } catch {
        console.warn('[CT-00] DB não disponível — validações de DB serão ignoradas (SSH tunnel necessário para qa2)');
      }

      await test.step('Verificar banking data salvo no setup lead (source=SEND_APP)', async () => {
        if (!dbAvailable) {
          console.warn('[CT-00] DB skip: uown_los_bank_account não verificado');
          return;
        }
        const bankRow = await db.queryOne(SQL_GET_BANK_ACCOUNT, [setupLeadPk]);
        expect(bankRow, 'Setup lead deve ter registro em uown_los_bank_account').not.toBeNull();
        expect(bankRow!.source).toBe('SEND_APP');
        expect(bankRow!.account_number).toBe(BANK_DATA_SETUP.mainBankAccountNumber);
        expect(bankRow!.routing_number).toBe(BANK_DATA_SETUP.mainBankRoutingNumber);
      });

      test.info().annotations.push(
        { type: 'setup_leadPk', description: setupLeadPk },
        { type: 'sharedSsn_masked', description: `***${sharedSsn.slice(-4)}` },
        { type: 'dbAvailable', description: String(dbAvailable) },
      );
      console.log(`[CT-00] setupLeadPk=${setupLeadPk} dbAvailable=${dbAvailable}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CT-01: Happy path — banking data propagado para novo lead
    // Conditions met: UW_APPROVED, eligibleTerms contains "16" (KS3015),
    // previousUW set (returning customer), NO banking data in request,
    // previous lead has SEND_APP bank account.
    // ─────────────────────────────────────────────────────────────────────────
    test('CT-01: banking data deve ser propagado do lead anterior (KS3015, sem banking no request)', async ({ api, db }) => {
      test.setTimeout(120_000);

      const { merchant } = buildTestData({
        env: td.env,
        state: td.state,
        merchant: td.merchant16m,
        orderTotal: td.orderTotal,
        approved: true,
      });

      // Same SSN as setup — triggers previousLeadsCheck + UW reuse (previousUW set)
      const applicant = buildApplicantWithSsn(sharedSsn, td.state);
      const body = buildSendApplicationBody(merchant, applicant);
      // Deliberately NO mainBankAccountNumber / mainBankRoutingNumber in body

      const resp = await api.application.sendApplication(body);
      expect(resp.ok, `CT-01 sendApplication failed: ${resp.status} — ${JSON.stringify(resp.body)}`).toBeTruthy();

      const newLeadPk = String(resp.body.authorizationNumber ?? '');
      expect(newLeadPk, 'CT-01: authorizationNumber (leadPk) deve estar presente').toBeTruthy();
      expect(Number(newLeadPk), 'CT-01: leadPk > 0 confirma UW_APPROVED').toBeGreaterThan(0);

      test.info().annotations.push({ type: 'ct01_newLeadPk', description: newLeadPk });
      console.log(`[CT-01] newLeadPk=${newLeadPk} (setup was ${setupLeadPk})`);

      await test.step('CT-01: Verificar banking data propagado no DB (uown_los_bank_account)', async () => {
        if (!dbAvailable) {
          console.warn('[CT-01] DB skip: uown_los_bank_account não verificado — SSH tunnel necessário');
          return;
        }
        const bankRow = await db.queryOne(SQL_GET_BANK_ACCOUNT, [newLeadPk]);
        expect(
          bankRow,
          'BankDataStep deve ter criado registro em uown_los_bank_account para o novo lead',
        ).not.toBeNull();
        expect(bankRow!.source, 'source deve ser SEND_APP (propagado do lead anterior)').toBe('SEND_APP');
      });

      await test.step('CT-06: Verificar integridade — campos propagados == campos do lead anterior', async () => {
        if (!dbAvailable) {
          console.warn('[CT-06] DB skip: integridade de campos não verificada — SSH tunnel necessário');
          return;
        }
        const prevBank = await db.queryOne(SQL_GET_BANK_ACCOUNT, [setupLeadPk]);
        const newBank = await db.queryOne(SQL_GET_BANK_ACCOUNT, [newLeadPk]);

        expect(prevBank, 'Lead anterior deve ter banking data para comparação').not.toBeNull();
        expect(newBank, 'Novo lead deve ter banking data propagado').not.toBeNull();

        expect(newBank!.account_number, 'account_number deve ser idêntico ao do lead anterior').toBe(
          prevBank!.account_number,
        );
        expect(newBank!.routing_number, 'routing_number deve ser idêntico ao do lead anterior').toBe(
          prevBank!.routing_number,
        );
        expect(Number(newBank!.lead_pk), 'lead_pk deve ser diferente (novo lead)').not.toBe(
          Number(prevBank!.lead_pk),
        );
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CT-02: Banking data NÃO propagado quando request inclui banking data
    // BankDataStep condition: "BankAccountInfo provided in request. Skipping copy."
    // ─────────────────────────────────────────────────────────────────────────
    test('CT-02: banking data nao deve ser propagado quando request inclui banking data', async ({ api, db }) => {
      test.setTimeout(120_000);

      const { merchant } = buildTestData({
        env: td.env,
        state: td.state,
        merchant: td.merchant16m,
        orderTotal: td.orderTotal,
        approved: true,
      });

      const applicant = buildApplicantWithSsn(sharedSsn, td.state);
      const body = {
        ...buildSendApplicationBody(merchant, applicant),
        ...BANK_DATA_CT02,  // Explicit banking data in request → propagation skipped
      };

      const resp = await api.application.sendApplication(body);
      expect(resp.ok, `CT-02 sendApplication failed: ${resp.status}`).toBeTruthy();

      const newLeadPk = String(resp.body.authorizationNumber ?? '');
      expect(Number(newLeadPk)).toBeGreaterThan(0);

      test.info().annotations.push({ type: 'ct02_newLeadPk', description: newLeadPk });

      await test.step('CT-02: Verificar que banking data do REQUEST foi usado (não propagado)', async () => {
        if (!dbAvailable) {
          console.warn('[CT-02] DB skip: uown_los_bank_account não verificado — SSH tunnel necessário');
          return;
        }
        const bankRow = await db.queryOne(SQL_GET_BANK_ACCOUNT, [newLeadPk]);
        expect(bankRow, 'Novo lead deve ter banking data do request').not.toBeNull();
        expect(
          bankRow!.account_number,
          'account_number deve ser o do request atual (CT02), não o do lead anterior',
        ).toBe(BANK_DATA_CT02.mainBankAccountNumber);
        expect(
          bankRow!.account_number,
          'account_number NÃO deve ser o do setup lead (propagação não ocorreu)',
        ).not.toBe(BANK_DATA_SETUP.mainBankAccountNumber);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CT-03: Banking data NÃO propagado quando eligibleTerms não contém "16"
    // Uses a fresh customer with TerraceFinance (13m only) — eligibleTerms = "13"
    // BankDataStep condition: "Conditions not met for copying bank data"
    //
    // Setup: Apply with TerraceFinance + banking data (creates previous lead without 16m)
    // Test: Apply same SSN + TerraceFinance + no banking data → no propagation
    // ─────────────────────────────────────────────────────────────────────────
    test('CT-03: banking data nao deve ser propagado quando eligibleTerms nao contem "16" (TerraceFinance)', async ({ api, db }) => {
      test.setTimeout(120_000);

      const { merchant: merchant13m, applicant: applicant13m } = buildTestData({
        env: td.env,
        state: td.state,
        merchant: td.merchant13m,
        orderTotal: td.orderTotal,
        orderDescription: 'CT-03 setup: TerraceFinance lead com banking data',
        approved: true,
      });

      // Step 1: Create first TerraceFinance lead WITH banking data
      const ct03Ssn = applicant13m.ssn;
      const setupBody = {
        ...buildSendApplicationBody(merchant13m, applicant13m),
        ...BANK_DATA_CT03_SETUP,
      };
      const setupResp = await api.application.sendApplication(setupBody);
      expect(setupResp.ok, `CT-03 setup sendApplication failed: ${setupResp.status}`).toBeTruthy();

      const ct03SetupLeadPk = String(setupResp.body.authorizationNumber ?? '');
      expect(Number(ct03SetupLeadPk)).toBeGreaterThan(0);

      // Verify previous lead HAS banking data (SEND_APP) — skip if DB unavailable
      if (dbAvailable) {
        const prevBank = await db.queryOne(SQL_GET_BANK_ACCOUNT, [ct03SetupLeadPk]);
        expect(prevBank, 'CT-03 setup: lead anterior deve ter banking data').not.toBeNull();
        expect(prevBank!.source).toBe('SEND_APP');
      }

      // Step 2: New application — same SSN, TerraceFinance, NO banking data
      const applicantSameSsn = buildApplicantWithSsn(ct03Ssn, td.state);
      const body = buildSendApplicationBody(merchant13m, applicantSameSsn);

      const resp = await api.application.sendApplication(body);
      expect(resp.ok, `CT-03 sendApplication failed: ${resp.status}`).toBeTruthy();

      const newLeadPk = String(resp.body.authorizationNumber ?? '');
      expect(Number(newLeadPk)).toBeGreaterThan(0);

      test.info().annotations.push(
        { type: 'ct03_setupLeadPk', description: ct03SetupLeadPk },
        { type: 'ct03_newLeadPk', description: newLeadPk },
      );

      await test.step('CT-03: Verificar que banking data NAO foi propagado (13m merchant)', async () => {
        if (!dbAvailable) {
          console.warn('[CT-03] DB skip: uown_los_bank_account não verificado — SSH tunnel necessário');
          return;
        }
        const bankRow = await db.queryOne(SQL_GET_BANK_ACCOUNT, [newLeadPk]);
        expect(
          bankRow,
          'BankDataStep NÃO deve criar banking data para merchant 13m (eligibleTerms sem "16")',
        ).toBeNull();
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CT-04: Banking data NÃO propagado quando lead anterior não tem bank accounts
    // BankDataStep condition: "No bank accounts found on previous lead"
    // ─────────────────────────────────────────────────────────────────────────
    test('CT-04: banking data nao deve ser propagado quando lead anterior nao tem bank accounts', async ({ api, db }) => {
      test.setTimeout(120_000);

      const { merchant, applicant } = buildTestData({
        env: td.env,
        state: td.state,
        merchant: td.merchant16m,
        orderTotal: td.orderTotal,
        orderDescription: 'CT-04 setup: KS3015 lead sem banking data',
        approved: true,
      });

      const ct04Ssn = applicant.ssn;

      // Step 1: Create first lead WITHOUT banking data (previous lead has no bank accounts)
      const setupBody = buildSendApplicationBody(merchant, applicant);
      const setupResp = await api.application.sendApplication(setupBody);
      expect(setupResp.ok, `CT-04 setup sendApplication failed: ${setupResp.status}`).toBeTruthy();

      const ct04SetupLeadPk = String(setupResp.body.authorizationNumber ?? '');
      expect(Number(ct04SetupLeadPk)).toBeGreaterThan(0);

      // Verify previous lead has NO banking data (skip if DB unavailable)
      if (dbAvailable) {
        const prevBank = await db.queryOne(SQL_GET_BANK_ACCOUNT, [ct04SetupLeadPk]);
        expect(prevBank, 'CT-04 setup: lead anterior NÃO deve ter banking data').toBeNull();
      }

      // Step 2: New application — same SSN, KS3015, NO banking data
      const applicantSameSsn = buildApplicantWithSsn(ct04Ssn, td.state);
      const body = buildSendApplicationBody(merchant, applicantSameSsn);

      const resp = await api.application.sendApplication(body);
      expect(resp.ok, `CT-04 sendApplication failed: ${resp.status}`).toBeTruthy();

      const newLeadPk = String(resp.body.authorizationNumber ?? '');
      expect(Number(newLeadPk)).toBeGreaterThan(0);

      test.info().annotations.push(
        { type: 'ct04_setupLeadPk', description: ct04SetupLeadPk },
        { type: 'ct04_newLeadPk', description: newLeadPk },
      );

      await test.step('CT-04: Verificar que banking data NAO foi propagado (lead anterior sem bank accounts)', async () => {
        if (!dbAvailable) {
          console.warn('[CT-04] DB skip: uown_los_bank_account não verificado — SSH tunnel necessário');
          return;
        }
        const bankRow = await db.queryOne(SQL_GET_BANK_ACCOUNT, [newLeadPk]);
        expect(
          bankRow,
          'BankDataStep NÃO deve propagar quando o lead anterior não tem bank accounts',
        ).toBeNull();
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CT-05: Banking data NÃO propagado em primeira aplicação (sem previousUW)
    // BankDataStep condition: "Conditions not met for copying bank data"
    // (previousUW is blank — no prior UW record exists for this customer)
    // ─────────────────────────────────────────────────────────────────────────
    test('CT-05: banking data nao deve ser propagado em primeira aplicacao (sem previousUW)', async ({ api, db }) => {
      test.setTimeout(120_000);

      // Brand new customer — no previous leads, no previous UW
      const { merchant, applicant } = buildTestData({
        env: td.env,
        state: td.state,
        merchant: td.merchant16m,
        orderTotal: td.orderTotal,
        orderDescription: 'CT-05: primeira aplicacao sem historico',
        approved: true,
      });

      const body = buildSendApplicationBody(merchant, applicant);
      // No banking data in request

      const resp = await api.application.sendApplication(body);
      expect(resp.ok, `CT-05 sendApplication failed: ${resp.status}`).toBeTruthy();

      const newLeadPk = String(resp.body.authorizationNumber ?? '');
      expect(Number(newLeadPk)).toBeGreaterThan(0);

      test.info().annotations.push({ type: 'ct05_newLeadPk', description: newLeadPk });

      await test.step('CT-05: Verificar que banking data NAO foi propagado (primeira aplicacao, sem previousUW)', async () => {
        if (!dbAvailable) {
          console.warn('[CT-05] DB skip: uown_los_bank_account não verificado — SSH tunnel necessário');
          return;
        }
        const bankRow = await db.queryOne(SQL_GET_BANK_ACCOUNT, [newLeadPk]);
        expect(
          bankRow,
          'BankDataStep NÃO deve propagar em primeira aplicação (previousUW está em branco)',
        ).toBeNull();
      });
    });
  });
}
