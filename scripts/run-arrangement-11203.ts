/**
 * Script: Create payment arrangement on account 11203 and trigger CC sweep.
 *
 * Usage: ENV=qa2 node --loader tsx scripts/run-arrangement-11203.ts
 */
import { chromium } from '@playwright/test';
import { ConfigEnvironment } from '../src/config/environment.js';
import { PaymentArrangementClient } from '../src/api/clients/payment-arrangement.client.js';
import { ScheduledTaskClient } from '../src/api/clients/scheduled-task.client.js';
import { buildCcArrangementBody } from '../src/api/bodies/payment-arrangement.body.js';

const ACCOUNT_PK = 11203;
const LEAD_PK = 14869;
const CC_PK = 11440;
const CC_TOKEN = '208012c3-94ac-421f-91c0-6f15fc3a72d9';

function isoDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

async function main() {
  const envName = process.env.ENV || 'qa2';
  const config = new ConfigEnvironment(envName);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    const paymentClient = new PaymentArrangementClient(context.request, config);
    const taskClient = new ScheduledTaskClient(context.request, config);

    // 1. Create CC SETTLEMENT arrangement with overdue installments
    console.log('\n=== Step 1: Create CC SETTLEMENT arrangement ===');
    const body = buildCcArrangementBody({
      accountPk: ACCOUNT_PK,
      arrangementType: 'SETTLEMENT',
      leadPk: LEAD_PK,
      creditCardPk: CC_PK,
      ccToken: CC_TOKEN,
      ccNumber: '************0055',
      ccExp: '12/2028',
      ccFirstName: 'Fernando',
      ccLastName: 'Martins',
      ccType: 'OTHER',
      ccVendor: 'CHANNEL_PAYMENTS_CC',
      useCardOnFile: true,
      installments: [
        { amount: '50.00', date: isoDate(-3) },
        { amount: '50.00', date: isoDate(-1) },
        { amount: '50.00', date: isoDate(0) },
      ],
    });

    console.log('Request body:', JSON.stringify(body, null, 2));

    const resp = await paymentClient.makeCreditCardPayments(body);
    console.log(`\nResponse: status=${resp.status}, ok=${resp.ok}`);
    console.log('Body:', JSON.stringify(resp.body, null, 2));

    if (!resp.ok) {
      console.error('makeCreditCardPayments FAILED. Aborting.');
      return;
    }

    // Check arrangement in response
    const txResults = resp.body.creditCardTransactions ?? [];
    const approved = txResults.filter(t => t.status === 'APPROVED');
    const pending = txResults.filter(t => t.status === 'PENDING');
    console.log(`\nTransactions: ${txResults.length} total, ${approved.length} APPROVED, ${pending.length} PENDING`);

    if (txResults.length > 0 && txResults[0].paymentArrangementPk) {
      console.log(`Arrangement PK: ${txResults[0].paymentArrangementPk}`);
    }

    // 2. Wait and trigger CC sweep
    console.log('\n=== Step 2: Trigger CC sweep (sendCreditCardPaymentsSql) ===');
    console.log('Waiting 5s before sweep...');
    await new Promise(r => setTimeout(r, 5000));

    const sweepResp = await taskClient.triggerScheduledTask('sendCreditCardPaymentsSql');
    console.log(`Sweep response: status=${sweepResp.status}, ok=${sweepResp.ok}`);
    console.log('Body:', JSON.stringify(sweepResp.body, null, 2));

    console.log('\nDone. Check DB for arrangement status:');
    console.log(`  SELECT status, is_active, arrangement_type FROM uown_sv_payment_arrangement WHERE account_pk = ${ACCOUNT_PK} ORDER BY pk DESC;`);
    console.log(`  SELECT pk, status, amount, payment_arrangement_pk FROM uown_sv_credit_card_transaction WHERE account_pk = ${ACCOUNT_PK} ORDER BY pk DESC;`);

  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(console.error);
