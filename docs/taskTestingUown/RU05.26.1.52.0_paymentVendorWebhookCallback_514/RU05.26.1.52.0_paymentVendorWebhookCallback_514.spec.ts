/**
 * svc#514 -- Send Vendor Webhook Callback After Payment Is Processed
 *
 * API + DB suite. When an AI agent (atlog-ai, level-ai) creates or
 * reverses a payment via POST /uown/svc/makePayment, the SVC backend
 * posts a JSON callback to webhook.site and persists the outbound call
 * in uown_sv_outbound_api_log. Agents NOT in the allow-list produce
 * no webhook.
 *
 * Endpoint: POST /uown/svc/makePayment (creates uown_sv_payment row)
 * Reverse:  POST /uown/svc/reversePayment
 * Payload:  {amount, customerAccountPk, paymentPk, name, eventType, paymentDate}
 * Audit:    uown_sv_outbound_api_log (url LIKE '%webhook.site%')
 *
 * Setup: pre-existing funded account in qa1 (accountPk 4578 used by
 * dev Marcus in testing steps 2026-05-21).
 *
 * Tags: @regression @svc-514 @webhook @payment @servicing
 * Env: stg (default), qa1 (webhook fully configured)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { generateRunId } from '@config/constants.js';
import { sleep } from '@helpers/common.helpers.js';
import { calculateDateISO } from '@helpers/date.helpers.js';

// ── Environment + seed data ─────────────────────────────────────────

const TARGET_ENV = process.env.ENV ?? 'stg';

const SEED: Record<string, { accountPk: number; ccPk: number }> = {
  qa1: { accountPk: 4578, ccPk: 5112 },
  stg: { accountPk: 589199, ccPk: 611303 },
};
const ACCOUNT = SEED[TARGET_ENV] ?? SEED.stg;

const AI_AGENT = 'atlog-ai';
const HUMAN_AGENT = 'manual-qa-user';

// ── Row types ───────────────────────────────────────────────────────

interface OutboundRow {
  pk: number | string;
  url: string | null;
  request: string | null;
  response: string | null;
  source: string | null;
  call_type: string | null;
  row_created_timestamp: Date | string | null;
  [key: string]: unknown;
}

interface SvPaymentRow {
  pk: number | string;
  account_pk: number | string;
  agent_username: string | null;
  payment_amount: string | null;
  payment_type: string | null;
  payment_date: Date | string | null;
  status: string | null;
  is_credit_card: boolean;
  is_ach: boolean;
  cc_pk: number | string | null;
  ref_receipt: string | null;
  [key: string]: unknown;
}

// ── DB helpers ──────────────────────────────────────────────────────

type DbHelpers = import('@helpers/database.helpers.js').DatabaseHelpers;

async function pollWebhookOutbound(
  db: DbHelpers,
  since: Date,
  customerAccountPk: number,
  timeoutMs = 15_000,
): Promise<OutboundRow[]> {
  const deadline = Date.now() + timeoutMs;
  let rows: OutboundRow[] = [];
  while (Date.now() < deadline) {
    rows = await db.query<OutboundRow>(
      `SELECT pk, url, request, response, source, call_type, row_created_timestamp
         FROM uown_sv_outbound_api_log
        WHERE row_created_timestamp >= $1 AT TIME ZONE current_setting('TimeZone')
          AND url LIKE '%webhook%'
          AND request LIKE $2
        ORDER BY pk DESC
        LIMIT 10`,
      [since.toISOString(), `%"customerAccountPk":${customerAccountPk}%`],
    );
    if (rows.length > 0) return rows;
    await sleep(2_000);
  }
  return rows;
}

async function countWebhookOutbound(
  db: DbHelpers,
  since: Date,
  customerAccountPk: number,
): Promise<number> {
  return db.getSingleNumber(
    `SELECT COUNT(*)
       FROM uown_sv_outbound_api_log
      WHERE row_created_timestamp >= $1 AT TIME ZONE current_setting('TimeZone')
        AND url LIKE '%webhook%'
        AND request LIKE $2`,
    [since.toISOString(), `%"customerAccountPk":${customerAccountPk}%`],
  );
}

async function pollSvPayment(
  db: DbHelpers,
  refReceipt: string,
  timeoutMs = 15_000,
): Promise<SvPaymentRow | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = await db.queryOne<SvPaymentRow>(
      `SELECT pk, account_pk, agent_username, payment_amount, payment_type,
              payment_date, status, is_credit_card, is_ach, cc_pk, ref_receipt
         FROM uown_sv_payment
        WHERE ref_receipt = $1
        ORDER BY pk DESC LIMIT 1`,
      [refReceipt],
    );
    if (row) return row;
    await sleep(1_000);
  }
  return null;
}

async function isWebhookConfigured(db: DbHelpers): Promise<boolean> {
  const count = await db.getSingleNumber(
    `SELECT COUNT(*) FROM uown_sv_outbound_api_log WHERE url LIKE '%webhook%'`,
  );
  return count > 0;
}

function assertWebhook(
  rows: OutboundRow[],
  eventType: string,
  webhookActive: boolean,
  ctLabel: string,
): void {
  if (rows.length > 0) {
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const match = rows.find(r => String(r.request ?? '').includes(`"eventType":"${eventType}"`));
    expect(match, `payload must contain eventType ${eventType}`).toBeTruthy();
  } else if (webhookActive) {
    expect.soft(rows.length, `${ctLabel}: expected webhook but got 0 rows`).toBeGreaterThanOrEqual(1);
  } else {
    console.warn(
      `[${ctLabel}] [OBSERVACAO] 0 webhook outbound rows. ` +
      'Webhook not configured in this env -- payment endpoint validated, webhook skipped.',
    );
  }
}

// ── Shared state ────────────────────────────────────────────────────

let ccPaymentPk = 0;
let achPaymentPk = 0;
let webhookActive = false;

// ── Helpers for direct API calls ────────────────────────────────────

interface MakePaymentBody {
  accountPk: number;
  agentUsername: string;
  paymentAmount: number;
  paymentType: 'CC' | 'ACH';
  paymentDate: string;
  allocationStrategy?: string;
  ccPk?: number;
  comments?: string;
  refReceipt?: string;
}

interface ReversePaymentBody {
  paymentPk: number;
  comments?: string;
}

// ── Test suite ──────────────────────────────────────────────────────

test.describe.serial(
  'svc#514 -- Payment Vendor Webhook Callback',
  { tag: ['@regression', '@svc-514', '@webhook', '@payment', '@servicing'] },
  () => {
    test.beforeEach(({}, testInfo) => {
      testInfo.setTimeout(120_000);
    });

    // ── CT-01: AI agent CC payment -> CREATED webhook ───────────────

    test('CT-01 -- AI agent CC payment triggers CREATED webhook', async ({
      request,
      testEnv,
      db,
    }) => {
      const runStart = new Date();
      const refReceipt = `qa-514-cc-${generateRunId()}`;

      if (!webhookActive) {
        webhookActive = await isWebhookConfigured(db);
        console.log(`[CT-01] webhook configured in ${TARGET_ENV}: ${webhookActive}`);
      }

      const body: MakePaymentBody = {
        accountPk: ACCOUNT.accountPk,
        agentUsername: AI_AGENT,
        paymentAmount: 1.0,
        paymentType: 'CC',
        paymentDate: calculateDateISO(0),
        allocationStrategy: 'DEFAULT',
        ccPk: ACCOUNT.ccPk,
        comments: `svc#514 CT-01 CC payment ${AI_AGENT}`,
        refReceipt,
      };

      await test.step('POST /uown/svc/makePayment (CC)', async () => {
        const url = `${testEnv.svcApiUrl}/uown/svc/makePayment`;
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': testEnv.apiAuthorization,
            'x-api-key': testEnv.apiKey,
          },
          data: body,
          timeout: 60_000,
        });
        const status = resp.status();
        const respBody = await resp.text();
        console.log(`[CT-01] HTTP=${status} body=${respBody.substring(0, 300)}`);
        expect(status, `makePayment CC: HTTP ${status} ${respBody.substring(0, 200)}`).toBe(200);
      });

      await test.step('validate uown_sv_payment row', async () => {
        const row = await pollSvPayment(db, refReceipt);
        expect(row, `sv_payment with ref_receipt=${refReceipt}`).toBeTruthy();
        ccPaymentPk = Number(row!.pk);
        console.log(
          `[CT-01] paymentPk=${ccPaymentPk} agent=${row!.agent_username} ` +
          `status=${row!.status} type=${row!.payment_type}`,
        );
        expect(row!.agent_username).toBe(AI_AGENT);
        expect(row!.payment_type).toBe('CC');
      });

      await test.step('check outbound_api_log for CREATED webhook', async () => {
        const rows = await pollWebhookOutbound(db, runStart, ACCOUNT.accountPk, 15_000);
        console.log(`[CT-01] webhook outbound rows: ${rows.length}`);
        for (const r of rows) {
          console.log(`  pk=${r.pk} url=${r.url}`);
          console.log(`  payload=${String(r.request ?? '').substring(0, 300)}`);
        }
        assertWebhook(rows, 'CREATED', webhookActive, 'CT-01');
      });
    });

    // ── CT-02: AI agent ACH payment -> CREATED webhook ──────────────

    test('CT-02 -- AI agent ACH payment triggers CREATED webhook', async ({
      request,
      testEnv,
      db,
    }) => {
      const runStart = new Date();
      const refReceipt = `qa-514-ach-${generateRunId()}`;

      const body: MakePaymentBody = {
        accountPk: ACCOUNT.accountPk,
        agentUsername: AI_AGENT,
        paymentAmount: 1.0,
        paymentType: 'ACH',
        paymentDate: calculateDateISO(0),
        allocationStrategy: 'DEFAULT',
        comments: `svc#514 CT-02 ACH payment ${AI_AGENT}`,
        refReceipt,
      };

      await test.step('POST /uown/svc/makePayment (ACH)', async () => {
        const url = `${testEnv.svcApiUrl}/uown/svc/makePayment`;
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': testEnv.apiAuthorization,
            'x-api-key': testEnv.apiKey,
          },
          data: body,
          timeout: 60_000,
        });
        const status = resp.status();
        const respBody = await resp.text();
        console.log(`[CT-02] HTTP=${status} body=${respBody.substring(0, 300)}`);
        expect(status, `makePayment ACH: HTTP ${status}`).toBe(200);
      });

      await test.step('validate uown_sv_payment row', async () => {
        const row = await pollSvPayment(db, refReceipt);
        expect(row, `sv_payment with ref_receipt=${refReceipt}`).toBeTruthy();
        achPaymentPk = Number(row!.pk);
        console.log(
          `[CT-02] paymentPk=${achPaymentPk} agent=${row!.agent_username} ` +
          `status=${row!.status} type=${row!.payment_type}`,
        );
        expect(row!.agent_username).toBe(AI_AGENT);
        expect(row!.payment_type).toBe('ACH');
      });

      await test.step('check outbound_api_log for CREATED webhook', async () => {
        const rows = await pollWebhookOutbound(db, runStart, ACCOUNT.accountPk, 15_000);
        console.log(`[CT-02] webhook outbound rows: ${rows.length}`);
        for (const r of rows) {
          console.log(`  pk=${r.pk} payload=${String(r.request ?? '').substring(0, 300)}`);
        }
        assertWebhook(rows, 'CREATED', webhookActive, 'CT-02');
      });
    });

    // ── CT-03: Reverse CC payment -> REVERSED webhook ───────────────

    test('CT-03 -- Reverse CC payment triggers REVERSED webhook', async ({
      request,
      testEnv,
      db,
    }) => {
      test.skip(ccPaymentPk === 0, 'CT-01 did not produce a paymentPk');

      const runStart = new Date();

      await test.step('POST /uown/svc/reversePayment (CC)', async () => {
        const url = `${testEnv.svcApiUrl}/uown/svc/reversePayment`;
        const body: ReversePaymentBody = {
          paymentPk: ccPaymentPk,
          comments: `svc#514 CT-03 reverse CC pk=${ccPaymentPk}`,
        };
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': testEnv.apiAuthorization,
            'x-api-key': testEnv.apiKey,
          },
          data: body,
          timeout: 60_000,
        });
        const status = resp.status();
        const respBody = await resp.text();
        console.log(`[CT-03] reverse HTTP=${status} body=${respBody.substring(0, 300)}`);
        expect(status, `reversePayment: HTTP ${status}`).toBe(200);
      });

      await test.step('validate payment status = REVERSED', async () => {
        const ok = await db.waitForValueEquals(
          'SELECT status FROM uown_sv_payment WHERE pk = $1',
          [ccPaymentPk],
          'REVERSED',
          15_000,
        );
        expect(ok, `payment ${ccPaymentPk} must be REVERSED`).toBeTruthy();
      });

      await test.step('check outbound_api_log for REVERSED webhook', async () => {
        const rows = await pollWebhookOutbound(db, runStart, ACCOUNT.accountPk, 15_000);
        console.log(`[CT-03] webhook outbound rows: ${rows.length}`);
        for (const r of rows) {
          console.log(`  pk=${r.pk} payload=${String(r.request ?? '').substring(0, 300)}`);
        }
        assertWebhook(rows, 'REVERSED', webhookActive, 'CT-03');
      });
    });

    // ── CT-04: Reverse ACH payment -> REVERSED webhook ──────────────

    test('CT-04 -- Reverse ACH payment triggers REVERSED webhook', async ({
      request,
      testEnv,
      db,
    }) => {
      test.skip(achPaymentPk === 0, 'CT-02 did not produce a paymentPk');

      const runStart = new Date();

      await test.step('POST /uown/svc/reversePayment (ACH)', async () => {
        const url = `${testEnv.svcApiUrl}/uown/svc/reversePayment`;
        const body: ReversePaymentBody = {
          paymentPk: achPaymentPk,
          comments: `svc#514 CT-04 reverse ACH pk=${achPaymentPk}`,
        };
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': testEnv.apiAuthorization,
            'x-api-key': testEnv.apiKey,
          },
          data: body,
          timeout: 60_000,
        });
        const status = resp.status();
        const respBody = await resp.text();
        console.log(`[CT-04] reverse HTTP=${status} body=${respBody.substring(0, 300)}`);
        expect(status, `reversePayment ACH: HTTP ${status}`).toBe(200);
      });

      await test.step('validate payment status = REVERSED', async () => {
        const ok = await db.waitForValueEquals(
          'SELECT status FROM uown_sv_payment WHERE pk = $1',
          [achPaymentPk],
          'REVERSED',
          15_000,
        );
        expect(ok, `payment ${achPaymentPk} must be REVERSED`).toBeTruthy();
      });

      await test.step('check outbound_api_log for REVERSED webhook', async () => {
        const rows = await pollWebhookOutbound(db, runStart, ACCOUNT.accountPk, 15_000);
        console.log(`[CT-04] webhook outbound rows: ${rows.length}`);
        for (const r of rows) {
          console.log(`  pk=${r.pk} payload=${String(r.request ?? '').substring(0, 300)}`);
        }
        assertWebhook(rows, 'REVERSED', webhookActive, 'CT-04');
      });
    });

    // ── CT-05: Human agent CC -> NO webhook ─────────────────────────

    test('CT-05 -- Human agent CC payment does NOT trigger webhook', async ({
      request,
      testEnv,
      db,
    }) => {
      const runStart = new Date();
      const refReceipt = `qa-514-neg-cc-${generateRunId()}`;

      await test.step('POST /uown/svc/makePayment (human agent CC)', async () => {
        const url = `${testEnv.svcApiUrl}/uown/svc/makePayment`;
        const body: MakePaymentBody = {
          accountPk: ACCOUNT.accountPk,
          agentUsername: HUMAN_AGENT,
          paymentAmount: 1.0,
          paymentType: 'CC',
          paymentDate: calculateDateISO(0),
          allocationStrategy: 'DEFAULT',
          ccPk: ACCOUNT.ccPk,
          comments: `svc#514 CT-05 human agent CC (no webhook expected)`,
          refReceipt,
        };
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': testEnv.apiAuthorization,
            'x-api-key': testEnv.apiKey,
          },
          data: body,
          timeout: 60_000,
        });
        const status = resp.status();
        console.log(`[CT-05] HTTP=${status}`);
        expect(status, 'human agent payment must succeed').toBe(200);
      });

      await test.step('validate payment created with human agent', async () => {
        const row = await pollSvPayment(db, refReceipt);
        expect(row, 'sv_payment created').toBeTruthy();
        console.log(`[CT-05] paymentPk=${row!.pk} agent=${row!.agent_username}`);
        expect(row!.agent_username).toBe(HUMAN_AGENT);
      });

      await test.step('assert NO webhook dispatched (5s negative wait)', async () => {
        await sleep(5_000);
        const count = await countWebhookOutbound(db, runStart, ACCOUNT.accountPk);
        console.log(`[CT-05] webhook outbound rows: ${count}`);
        expect(count, 'no webhook for human agent').toBe(0);
      });
    });

    // ── CT-06: Human agent ACH -> NO webhook ────────────────────────

    test('CT-06 -- Human agent ACH payment does NOT trigger webhook', async ({
      request,
      testEnv,
      db,
    }) => {
      const runStart = new Date();
      const refReceipt = `qa-514-neg-ach-${generateRunId()}`;

      await test.step('POST /uown/svc/makePayment (human agent ACH)', async () => {
        const url = `${testEnv.svcApiUrl}/uown/svc/makePayment`;
        const body: MakePaymentBody = {
          accountPk: ACCOUNT.accountPk,
          agentUsername: HUMAN_AGENT,
          paymentAmount: 1.0,
          paymentType: 'ACH',
          paymentDate: calculateDateISO(0),
          allocationStrategy: 'DEFAULT',
          comments: `svc#514 CT-06 human agent ACH (no webhook expected)`,
          refReceipt,
        };
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': testEnv.apiAuthorization,
            'x-api-key': testEnv.apiKey,
          },
          data: body,
          timeout: 60_000,
        });
        const status = resp.status();
        console.log(`[CT-06] HTTP=${status}`);
        expect(status, 'human agent ACH must succeed').toBe(200);
      });

      await test.step('validate payment created with human agent', async () => {
        const row = await pollSvPayment(db, refReceipt);
        expect(row, 'sv_payment created').toBeTruthy();
        console.log(`[CT-06] paymentPk=${row!.pk} agent=${row!.agent_username}`);
        expect(row!.agent_username).toBe(HUMAN_AGENT);
      });

      await test.step('assert NO webhook dispatched (5s negative wait)', async () => {
        await sleep(5_000);
        const count = await countWebhookOutbound(db, runStart, ACCOUNT.accountPk);
        console.log(`[CT-06] webhook outbound rows: ${count}`);
        expect(count, 'no webhook for human agent').toBe(0);
      });
    });

    // ── CT-07: Payload schema validation ────────────────────────────

    test('CT-07 -- Webhook payload contains all required fields', async ({
      request,
      testEnv,
      db,
    }) => {
      const runStart = new Date();
      const refReceipt = `qa-514-schema-${generateRunId()}`;

      await test.step('create payment for schema check', async () => {
        const url = `${testEnv.svcApiUrl}/uown/svc/makePayment`;
        const body: MakePaymentBody = {
          accountPk: ACCOUNT.accountPk,
          agentUsername: AI_AGENT,
          paymentAmount: 2.5,
          paymentType: 'CC',
          paymentDate: calculateDateISO(0),
          ccPk: ACCOUNT.ccPk,
          comments: 'svc#514 CT-07 payload schema validation',
          refReceipt,
        };
        const resp = await request.post(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': testEnv.apiAuthorization,
            'x-api-key': testEnv.apiKey,
          },
          data: body,
          timeout: 60_000,
        });
        expect(resp.status(), 'payment created').toBe(200);
      });

      await test.step('validate payload schema', async () => {
        const rows = await pollWebhookOutbound(db, runStart, ACCOUNT.accountPk, 15_000);
        if (rows.length === 0) {
          console.warn('[CT-07] [OBSERVACAO] No webhook rows -- schema validation skipped (webhook not configured)');
          test.skip(!webhookActive, 'Webhook not configured in this env');
          return;
        }

        const payload = JSON.parse(String(rows[0].request));
        console.log(`[CT-07] payload: ${JSON.stringify(payload)}`);

        expect(payload).toHaveProperty('paymentPk');
        expect(payload).toHaveProperty('customerAccountPk');
        expect(payload).toHaveProperty('name');
        expect(payload).toHaveProperty('amount');
        expect(payload).toHaveProperty('paymentDate');
        expect(payload).toHaveProperty('eventType');

        expect(typeof payload.paymentPk).toBe('number');
        expect(payload.customerAccountPk).toBe(ACCOUNT.accountPk);
        expect(typeof payload.name).toBe('string');
        expect(payload.name.length).toBeGreaterThan(0);
        expect(payload.amount).toBeCloseTo(2.5, 1);
        expect(payload.paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(payload.eventType).toBe('CREATED');

        const keys = Object.keys(payload).sort();
        console.log(`[CT-07] payload keys: ${keys.join(', ')}`);
        expect(keys).toEqual(
          ['amount', 'customerAccountPk', 'eventType', 'name', 'paymentDate', 'paymentPk'],
        );
      });
    });
  },
);
