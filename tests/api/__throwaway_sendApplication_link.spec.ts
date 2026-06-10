/**
 * THROWAWAY — generate a sendApplication redirectUrl for manual verification
 * of the submitApplication regression (svc#485 sandbox, 2026-05-21).
 *
 * Delete after use.
 */
import { test } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { buildSendApplicationBody } from '@api/bodies/application.body.js';

test('emit sendApplication link (TireAgent / CA / qa1)', async ({ request, testEnv }) => {
  test.setTimeout(120_000);

  const td = buildTestData({
    state: 'CA',
    merchant: 'TireAgent',
    orderTotal: 1000,
    orderDescription: 'manual submitApplication verification',
    approved: true,
  });

  console.log(`[link] using merchant userName=${td.merchant.username} merchantNumber=${td.merchant.number}`);

  const body = buildSendApplicationBody(td.merchant, td.applicant, td.order);
  const url = `${testEnv.svcApiUrl}/uown/los/sendApplication`;
  console.log(`[link] POST ${url}`);

  // Send ONLY x-api-key (no Authorization) — Authorization header with raw key
  // value (no "Bearer" prefix) triggers backend RBAC denial in qa1.
  const raw = await request.post(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': testEnv.apiKey,
    },
    data: body,
    timeout: 60_000,
  });
  const status = raw.status();
  const text = await raw.text();
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(text) as Record<string, unknown>; } catch { /* keep text */ }
  console.log(`[link] sendApplication status=${status}`);
  if (status < 200 || status >= 300) {
    console.log(`[link] body: ${text.slice(0, 600)}`);
    throw new Error(`sendApplication failed: ${status}`);
  }

  const accountNumber = parsed.accountNumber as string | undefined;
  const authorizationNumber = parsed.authorizationNumber as string | undefined;
  const list = (parsed.paymentDetailsList ?? []) as Array<{ redirectUrl?: string }>;
  const idx = list.length > 1 ? 1 : 0;
  const redirectUrl = list[idx]?.redirectUrl ?? '';

  console.log('────────────────────────────────────────────────────────────');
  console.log(`[link] env=sandbox merchant=TireAgent state=CA`);
  console.log(`[link] runId=${td.runId} email=${td.applicant.email}`);
  console.log(`[link] accountNumber (leadUuid)=${accountNumber}`);
  console.log(`[link] authorizationNumber (leadPk)=${authorizationNumber}`);
  console.log(`[link] paymentDetailsList entries=${list.length} (picked idx=${idx})`);
  console.log(`[link] redirectUrl: ${redirectUrl}`);
  console.log('────────────────────────────────────────────────────────────');
});
