/**
 * SVC-460 — Website Customer Portal OTP Login Regression
 *
 * Validates that the optimized query on `uown_login_attempt`
 * (`UPPER(email_phone_input)=UPPER($1) ORDER BY row_created_timestamp DESC LIMIT $2`,
 * backed by index `idx_login_attempt_email_upper_created` in qa2) preserves
 * functional behavior of the customer-portal OTP login flow.
 *
 * Smoke scope (P0 — direct query risk):
 *   - US-1: happy-path email login + activity log validation
 *   - US-3: case-insensitive lookup (lowercase / mixed / uppercase variants)
 *   - US-6: resend code returns the most recent code (ORDER BY DESC)
 *
 * Cross-portal scope (P0 — agent updates contact, customer logs in with new credential):
 *   - US-10: agent updates email via API → customer logs in with new email
 *   - US-11: agent updates phone via API → customer logs in via SMS with new phone
 *   - US-12: combined update → customer logs in with both new credentials
 *
 * Negative & edge scope:
 *   - US-2: SMS direct login (existing phone, no contact change)
 *   - US-4: invalid code is rejected (single attempt)
 *   - US-5: expired code is rejected (DB UPDATE on expiration_time — authorized)
 *   - US-7: lockout — modal closes after 3 wrong attempts; user must re-enter email/phone
 *   - US-8: nonexistent email → account_found=false, no activity logs
 *
 * Test data hierarchy exception (CLAUDE.md Rule #3):
 *   Uses an existing ACTIVE account (11540) with pre-configured email + phone.
 *   Authorized by user — creating a fresh account requires the full funding flow,
 *   prohibitive for a login-only regression. The OTP code is read directly from
 *   `uown_login_attempt.code` (DB), not from the inbox, so the test does not depend
 *   on the customer's email mailbox being accessible.
 *
 * Run: npx playwright test tests/e2e/website/login-otp.spec.ts --project=website-ui
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { WebsiteBasePage } from '@pages/website/index.js';
import { TestTag, splitTags } from '@ptypes/enums.js';
import { uniqueEmail } from '@helpers/index.js';
import type { ApiClients } from '@support/base-test.js';
import type { ContactInformationResponse } from '@api/responses';

// ── Test data — per-env existing account (selected via ENV) ───────────
//
// The test relies on an ACTIVE account whose primary email is unique in the env
// (otherwise the OTP query returns account_pks with multiple comma-separated
// PKs and assertions become ambiguous).
const TEST_ACCOUNTS: Record<string, { accountPk: string; leadPk: string; email: string; phone: string }> = {
  qa2: {
    accountPk: '11540',
    leadPk: '16095',
    email: 'gomata4457@iapapi.com',
    phone: '7073175051',
  },
  qa1: {
    accountPk: '4488',
    leadPk: '11151',
    email: 'fintechgroup777+5840900_875903@gmail.com',
    phone: '9436903924',
  },
};

const TARGET_ENV = (process.env.ENV ?? 'qa2');
const TEST_ACCOUNT = TEST_ACCOUNTS[TARGET_ENV] ?? TEST_ACCOUNTS.qa2;
const ENV_TAG = TARGET_ENV === 'qa1' ? TestTag.QA1 : TestTag.QA2;
const SMOKE_TAG = `${TestTag.SMOKE} ${ENV_TAG}`;

test.describe('Website OTP Login — SVC-460 regression', { tag: splitTags(SMOKE_TAG) }, () => {
  test.beforeAll(async ({ db }) => {
    // Sanity: optimization index must be present in the target env.
    const indexExists = await db.loginAttemptUpperIndexExists();
    expect(indexExists, 'idx_login_attempt_email_upper_created must exist on qa2').toBe(true);
  });

  test('US-1: happy-path email login generates correct activity logs', async ({ page, testEnv, db }) => {
    test.skip(testEnv.env !== 'qa2', 'US-1 uses qa2 test account fixture and OTP index — skip in other environments');
    const websitePage = new WebsiteBasePage(page);
    const otpSincePk = await db.getMaxLoginAttemptPk(TEST_ACCOUNT.email);
    const logSincePk = await db.getMaxActivityLogPk(TEST_ACCOUNT.accountPk);
    let otpCode = '';

    await test.step('navigate to website portal', async () => {
      await page.goto(testEnv.websiteUrl);
    });

    await test.step('submit email — triggers OTP request', async () => {
      await websitePage.loginWithEmailOrPhone(TEST_ACCOUNT.email);
    });

    await test.step('read fresh OTP from uown_login_attempt', async () => {
      const row = await db.waitForFreshOtpCode(TEST_ACCOUNT.email, otpSincePk, 30_000);
      expect(row, `OTP row must be inserted for ${TEST_ACCOUNT.email}`).toBeTruthy();
      expect(row!.account_found).toBe(true);
      // account_pks is a comma-separated list when multiple email/phone rows point at the same account.
      // What matters is that ALL referenced PKs are the test account.
      expect(row!.account_pks!.split(',').every(p => p.trim() === TEST_ACCOUNT.accountPk),
        `account_pks "${row!.account_pks}" must reference only ${TEST_ACCOUNT.accountPk}`).toBe(true);
      expect(row!.sms_id).toBeNull();
      expect(row!.code).toMatch(/^\d{6}$/);
      otpCode = row!.code!;
    });

    await test.step('enter OTP and verify login', async () => {
      const ok = await websitePage.enterVerificationCode(otpCode);
      expect(ok, 'login must succeed with the freshly-read OTP').toBe(true);
    });

    // Activity log shape differs between backends:
    //   qa2 emits two logs ("Created VerificationCode..." then "Sent VerificationCode...") both as SYSTEM.
    //   qa1 emits a single "Sent Verification Code" log as 'customer portal'.
    // Assert the universal contract: a CORRESPONDENCE log mentioning the email is generated.
    await test.step('activity log: CORRESPONDENCE — code dispatch logged', async () => {
      const sent = await db.waitForLoginActivityLog(
        TEST_ACCOUNT.accountPk,
        logSincePk,
        l => /Sent\s*Verification\s*Code/i.test(l.notes ?? ''),
        15_000,
      );
      expect(sent, 'must log VerificationCode dispatch').toBeTruthy();
      expect(sent!.log_type).toBe('CORRESPONDENCE');
      expect(sent!.notes).toContain(`To : ${TEST_ACCOUNT.email}`);
      expect(['SYSTEM', 'customer portal'],
        `created_by "${sent!.created_by}" must be SYSTEM (qa2) or customer portal (qa1)`).toContain(sent!.created_by);
    });

    // qa2-only: separate "Created VerificationCode to be sent as EMAIL" log. Skip on qa1.
    if (TARGET_ENV !== 'qa1') {
      await test.step('activity log: CORRESPONDENCE/SYSTEM "Created VerificationCode" (qa2 only)', async () => {
        const created = await db.waitForLoginActivityLog(
          TEST_ACCOUNT.accountPk,
          logSincePk,
          l => l.notes?.includes('Created VerificationCode to be sent as EMAIL') === true,
          15_000,
        );
        expect(created, 'qa2 must log VerificationCode creation').toBeTruthy();
        expect(created!.log_type).toBe('CORRESPONDENCE');
        expect(created!.created_by).toBe('SYSTEM');
      });
    }

    await test.step('activity log: INTERNAL "Login Success using code N at TS; Attempt N."', async () => {
      const success = await db.waitForLoginSuccessLog(TEST_ACCOUNT.accountPk, logSincePk, 30_000);
      expect(success, 'must record Login Success activity log').toBeTruthy();
      expect(success!.log_type).toBe('INTERNAL');
      expect(success!.created_by).toBe('customer portal');
      // Trailing "." is sometimes present, sometimes not — accept both.
      expect(success!.notes).toMatch(
        /^Login Success using code \d{6} at \d{4}-\d{2}-\d{2}T[\d:.]+; Attempt \d+\.?$/,
      );
      expect(success!.notes).toContain(`code ${otpCode}`);
    });
  });

  test('US-3: case-insensitive email lookup hits the same account', async ({ page, testEnv, db }) => {
    const websitePage = new WebsiteBasePage(page);
    const variants = [
      TEST_ACCOUNT.email.toLowerCase(),
      TEST_ACCOUNT.email.toUpperCase(),
      // Mixed case — only flip alphabetic characters before "@"
      TEST_ACCOUNT.email.replace(/^([^@]+)@/, (_, local) => {
        return [...local].map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('') + '@';
      }),
    ];

    for (const variant of variants) {
      const sincePk = await db.getMaxLoginAttemptPk(variant);

      await test.step(`request OTP with "${variant}"`, async () => {
        await page.goto(testEnv.websiteUrl);
        await websitePage.loginWithEmailOrPhone(variant);
      });

      await test.step(`uown_login_attempt: row exists with input="${variant}" pointing to account ${TEST_ACCOUNT.accountPk}`, async () => {
        const row = await db.waitForFreshOtpCode(variant, sincePk, 30_000);
        expect(row, `OTP row must be inserted for variant "${variant}"`).toBeTruthy();
        expect(row!.account_found).toBe(true);
        // account_pks is a comma-separated list when multiple email/phone rows point at the same account.
      // What matters is that ALL referenced PKs are the test account.
      expect(row!.account_pks!.split(',').every(p => p.trim() === TEST_ACCOUNT.accountPk),
        `account_pks "${row!.account_pks}" must reference only ${TEST_ACCOUNT.accountPk}`).toBe(true);
        // Input is stored with the case as typed — the UPPER() is applied at query time, not at insert
        expect(row!.email_phone_input.toUpperCase()).toBe(TEST_ACCOUNT.email.toUpperCase());
      });
    }
  });

  test('US-6: resend code returns the most recent code (ORDER BY DESC LIMIT 1)', async ({ page, testEnv, db }) => {
    const websitePage = new WebsiteBasePage(page);
    const sincePk0 = await db.getMaxLoginAttemptPk(TEST_ACCOUNT.email);

    await test.step('first request → record code A', async () => {
      await page.goto(testEnv.websiteUrl);
      await websitePage.loginWithEmailOrPhone(TEST_ACCOUNT.email);
    });

    let codeA = '';
    let pkA: bigint = 0n;
    await test.step('read code A from DB', async () => {
      const row = await db.waitForFreshOtpCode(TEST_ACCOUNT.email, sincePk0, 30_000);
      expect(row).toBeTruthy();
      codeA = row!.code!;
      pkA = BigInt(row!.pk);
    });

    await test.step('click "Didn\'t get a code?" → triggers resend', async () => {
      await websitePage.requestNewVerificationCode();
    });

    await test.step('latest OTP from DB must be a NEW code (code B != A)', async () => {
      const rowB = await db.waitForFreshOtpCode(TEST_ACCOUNT.email, pkA, 30_000);
      expect(rowB, 'a new login_attempt row must be inserted on resend').toBeTruthy();
      expect(rowB!.code, 'resent code must differ from the first one').not.toBe(codeA);
    });

    await test.step('the helper (mirrors ticket query) returns the resent code', async () => {
      const latest = await db.getLatestLoginAttempt(TEST_ACCOUNT.email);
      expect(latest, 'getLatestLoginAttempt must return the most recent row').toBeTruthy();
      expect(latest!.code).not.toBe(codeA);
    });

    await test.step('login with the new code succeeds', async () => {
      const latest = await db.getLatestLoginAttempt(TEST_ACCOUNT.email);
      const ok = await websitePage.enterVerificationCode(latest!.code!);
      expect(ok, 'login must succeed with the resent code').toBe(true);
    });
  });

  // ── Cross-portal: agent updates contact via API → customer logs in with new credential
  //
  // Each test:
  //   1. Snapshots primary email + phone via svcContact.getContactInfo
  //   2. Updates the target field via svcContact.createOrUpdateContactInfo
  //   3. Logs into Website with the NEW credential, validates OTP + Login Success log
  //   4. Restores original contact info in `finally` (always runs, even on assertion failure)

  test.describe.configure({ mode: 'serial' });

  test('US-10: agent updates email via API, customer logs in with new email', async ({ page, testEnv, db, api }) => {
    const websitePage = new WebsiteBasePage(page);
    const original = await snapshotContact(api, TEST_ACCOUNT.accountPk);
    const originalEmailEntry = primaryEmailEntry(original);
    const newEmail = uniqueEmail('svc460');

    try {
      await test.step(`update primary email via API: ${originalEmailEntry.emailInfo.emailAddress} → ${newEmail}`, async () => {
        const resp = await api.svcContact.createOrUpdateContactInfo({
          accountPk: Number(TEST_ACCOUNT.accountPk),
          emailList: [{
            pk: originalEmailEntry.pk,
            emailInfo: {
              emailPK: originalEmailEntry.emailInfo.emailPK,
              customerPK: originalEmailEntry.emailInfo.customerPK,
              emailAddress: newEmail,
              emailType: originalEmailEntry.emailInfo.emailType,
              doNotEmail: originalEmailEntry.emailInfo.doNotEmail,
            },
          }],
        });
        expect(resp.status, `email update must succeed (got ${resp.status})`).toBeLessThan(300);
      });

      await test.step('verify update persisted: getContactInfo returns new email', async () => {
        const after = await api.svcContact.getContactInfo(TEST_ACCOUNT.accountPk);
        const primary = primaryEmailEntry(after.body!);
        expect(primary.emailInfo.emailAddress.toLowerCase()).toBe(newEmail.toLowerCase());
      });

      const otpSincePk = await db.getMaxLoginAttemptPk(newEmail);
      const logSincePk = await db.getMaxActivityLogPk(TEST_ACCOUNT.accountPk);
      let otpCode = '';

      await test.step('customer logs in with new email — request OTP', async () => {
        await page.goto(testEnv.websiteUrl);
        await websitePage.loginWithEmailOrPhone(newEmail);
      });

      await test.step('uown_login_attempt: row inserted for new email, account_pks=11540', async () => {
        const row = await db.waitForFreshOtpCode(newEmail, otpSincePk, 30_000);
        expect(row, `OTP row must be inserted for new email "${newEmail}"`).toBeTruthy();
        expect(row!.account_found).toBe(true);
        // account_pks is a comma-separated list when multiple email/phone rows point at the same account.
      // What matters is that ALL referenced PKs are the test account.
      expect(row!.account_pks!.split(',').every(p => p.trim() === TEST_ACCOUNT.accountPk),
        `account_pks "${row!.account_pks}" must reference only ${TEST_ACCOUNT.accountPk}`).toBe(true);
        expect(row!.sms_id).toBeNull();
        otpCode = row!.code!;
      });

      await test.step('enter OTP — login succeeds', async () => {
        const ok = await websitePage.enterVerificationCode(otpCode);
        expect(ok, 'login must succeed with new-email OTP').toBe(true);
      });

      await test.step('activity log: Login Success with the new-email code', async () => {
        const success = await db.waitForLoginSuccessLog(TEST_ACCOUNT.accountPk, logSincePk, 30_000);
        expect(success).toBeTruthy();
        expect(success!.notes).toContain(`code ${otpCode}`);
      });
    } finally {
      await restorePrimaryEmail(api, TEST_ACCOUNT.accountPk, originalEmailEntry);
    }
  });

  test('US-11: agent updates phone via API, customer logs in via SMS with new phone', async ({ page, testEnv, db, api }) => {
    const websitePage = new WebsiteBasePage(page);
    const original = await snapshotContact(api, TEST_ACCOUNT.accountPk);
    const originalPhoneEntry = primaryPhoneEntry(original);
    const newPhone = generateUsPhone10();

    try {
      await test.step(`update primary phone via API: ${formatPhone(originalPhoneEntry)} → ${newPhone}`, async () => {
        const resp = await api.svcContact.createOrUpdateContactInfo({
          accountPk: Number(TEST_ACCOUNT.accountPk),
          phoneList: [{
            pk: originalPhoneEntry.pk,
            phoneInfo: {
              phonePK: originalPhoneEntry.phoneInfo.phonePK,
              customerPK: originalPhoneEntry.phoneInfo.customerPK,
              areaCode: newPhone.slice(0, 3),
              phoneNumber: Number(newPhone.slice(3)),
              phoneType: originalPhoneEntry.phoneInfo.phoneType,
              doNotCall: originalPhoneEntry.phoneInfo.doNotCall,
              doNotText: originalPhoneEntry.phoneInfo.doNotText,
            },
          }],
        });
        if (resp.status >= 300) {
          console.log(`[svc-460] phone update body received: ${JSON.stringify(resp.body)}`);
        }
        expect(resp.status, `phone update must succeed (got ${resp.status})`).toBeLessThan(300);
      });

      await test.step('verify update persisted: getContactInfo returns new phone', async () => {
        const after = await api.svcContact.getContactInfo(TEST_ACCOUNT.accountPk);
        const primary = primaryPhoneEntry(after.body!);
        expect(formatPhone(primary)).toBe(newPhone);
      });

      const otpSincePk = await db.getMaxLoginAttemptPk(newPhone);
      const logSincePk = await db.getMaxActivityLogPk(TEST_ACCOUNT.accountPk);
      let otpCode = '';

      await test.step('customer logs in with new phone (10 digits, no mask) — request OTP', async () => {
        await page.goto(testEnv.websiteUrl);
        await websitePage.loginWithEmailOrPhone(newPhone);
      });

      await test.step('uown_login_attempt: row inserted with sms_id != NULL, account_pks=11540', async () => {
        const row = await db.waitForFreshOtpCode(newPhone, otpSincePk, 30_000);
        expect(row, `OTP row must be inserted for new phone "${newPhone}"`).toBeTruthy();
        expect(row!.account_found).toBe(true);
        // account_pks is a comma-separated list when multiple email/phone rows point at the same account.
      // What matters is that ALL referenced PKs are the test account.
      expect(row!.account_pks!.split(',').every(p => p.trim() === TEST_ACCOUNT.accountPk),
        `account_pks "${row!.account_pks}" must reference only ${TEST_ACCOUNT.accountPk}`).toBe(true);
        expect(row!.sms_id, 'SMS path must populate sms_id').not.toBeNull();
        otpCode = row!.code!;
      });

      await test.step('enter OTP — login succeeds', async () => {
        const ok = await websitePage.enterVerificationCode(otpCode);
        expect(ok, 'login must succeed with new-phone OTP').toBe(true);
      });

      await test.step('activity log: Login Success with the SMS-path code', async () => {
        const success = await db.waitForLoginSuccessLog(TEST_ACCOUNT.accountPk, logSincePk, 30_000);
        expect(success).toBeTruthy();
        expect(success!.notes).toContain(`code ${otpCode}`);
      });
    } finally {
      await restorePrimaryPhone(api, TEST_ACCOUNT.accountPk, originalPhoneEntry);
    }
  });

  test('US-12: agent updates email + phone in a single call, customer logs in with each', async ({ page, testEnv, db, api }) => {
    const websitePage = new WebsiteBasePage(page);
    const original = await snapshotContact(api, TEST_ACCOUNT.accountPk);
    const originalEmailEntry = primaryEmailEntry(original);
    const originalPhoneEntry = primaryPhoneEntry(original);
    const newEmail = uniqueEmail('svc460combo');
    const newPhone = generateUsPhone10();

    try {
      await test.step('update email AND phone in a single createOrUpdateContactInfo call', async () => {
        const resp = await api.svcContact.createOrUpdateContactInfo({
          accountPk: Number(TEST_ACCOUNT.accountPk),
          emailList: [{
            pk: originalEmailEntry.pk,
            emailInfo: {
              emailPK: originalEmailEntry.emailInfo.emailPK,
              customerPK: originalEmailEntry.emailInfo.customerPK,
              emailAddress: newEmail,
              emailType: originalEmailEntry.emailInfo.emailType,
              doNotEmail: originalEmailEntry.emailInfo.doNotEmail,
            },
          }],
          phoneList: [{
            pk: originalPhoneEntry.pk,
            phoneInfo: {
              phonePK: originalPhoneEntry.phoneInfo.phonePK,
              customerPK: originalPhoneEntry.phoneInfo.customerPK,
              areaCode: newPhone.slice(0, 3),
              phoneNumber: Number(newPhone.slice(3)),
              phoneType: originalPhoneEntry.phoneInfo.phoneType,
              doNotCall: originalPhoneEntry.phoneInfo.doNotCall,
              doNotText: originalPhoneEntry.phoneInfo.doNotText,
            },
          }],
        });
        expect(resp.status).toBeLessThan(300);
      });

      await test.step('verify both fields persisted', async () => {
        const after = await api.svcContact.getContactInfo(TEST_ACCOUNT.accountPk);
        expect(primaryEmailEntry(after.body!).emailInfo.emailAddress.toLowerCase()).toBe(newEmail.toLowerCase());
        expect(formatPhone(primaryPhoneEntry(after.body!))).toBe(newPhone);
      });

      // Email login
      let emailLoginAccount = '';
      await test.step('login with new email — both new credentials must hit the same account', async () => {
        const sincePk = await db.getMaxLoginAttemptPk(newEmail);
        await page.goto(testEnv.websiteUrl);
        await websitePage.loginWithEmailOrPhone(newEmail);
        const row = await db.waitForFreshOtpCode(newEmail, sincePk, 30_000);
        expect(row).toBeTruthy();
        emailLoginAccount = row!.account_pks!;
        const ok = await websitePage.enterVerificationCode(row!.code!);
        expect(ok).toBe(true);
      });

      // Phone login (open fresh page — previous test logged in)
      await test.step('login with new phone — same account_pks as email login', async () => {
        const sincePk = await db.getMaxLoginAttemptPk(newPhone);
        await page.goto(testEnv.websiteUrl);
        await websitePage.loginWithEmailOrPhone(newPhone);
        const row = await db.waitForFreshOtpCode(newPhone, sincePk, 30_000);
        expect(row).toBeTruthy();
        expect(row!.sms_id).not.toBeNull();
        // Both logins should reference the same set of account PKs (modulo duplication caused by old orphan rows).
        const phoneAccounts = new Set(row!.account_pks!.split(',').map(p => p.trim()));
        const emailAccounts = new Set(emailLoginAccount.split(',').map(p => p.trim()));
        expect([...phoneAccounts].sort()).toEqual([...emailAccounts].sort());
        const ok = await websitePage.enterVerificationCode(row!.code!);
        expect(ok).toBe(true);
      });
    } finally {
      await restorePrimaryEmail(api, TEST_ACCOUNT.accountPk, originalEmailEntry);
      await restorePrimaryPhone(api, TEST_ACCOUNT.accountPk, originalPhoneEntry);
    }
  });

  // ── Negative & edge scenarios ─────────────────────────────────────────

  test('US-2: SMS direct login with the existing phone (no contact change)', async ({ page, testEnv, db }) => {
    const websitePage = new WebsiteBasePage(page);
    const otpSincePk = await db.getMaxLoginAttemptPk(TEST_ACCOUNT.phone);
    const logSincePk = await db.getMaxActivityLogPk(TEST_ACCOUNT.accountPk);
    let otpCode = '';

    await test.step('submit phone (10 digits, no mask) — triggers SMS OTP request', async () => {
      await page.goto(testEnv.websiteUrl);
      await websitePage.loginWithEmailOrPhone(TEST_ACCOUNT.phone);
    });

    await test.step('uown_login_attempt: row inserted with sms_id != NULL, account_found=true', async () => {
      const row = await db.waitForFreshOtpCode(TEST_ACCOUNT.phone, otpSincePk, 30_000);
      expect(row, `OTP row must be inserted for phone "${TEST_ACCOUNT.phone}"`).toBeTruthy();
      expect(row!.account_found).toBe(true);
      expect(row!.account_pks!.split(',').every(p => p.trim() === TEST_ACCOUNT.accountPk)).toBe(true);
      expect(row!.sms_id, 'SMS path must populate sms_id').not.toBeNull();
      expect(row!.code).toMatch(/^\d{6}$/);
      otpCode = row!.code!;
    });

    await test.step('enter OTP — login succeeds via SMS path', async () => {
      const ok = await websitePage.enterVerificationCode(otpCode);
      expect(ok).toBe(true);
      expect(page.url(), 'must land on customer dashboard').toMatch(/\/overview/);
    });

    await test.step('activity log: INTERNAL Login Success references the SMS code', async () => {
      const success = await db.waitForLoginSuccessLog(TEST_ACCOUNT.accountPk, logSincePk, 30_000);
      expect(success).toBeTruthy();
      expect(success!.notes).toContain(`code ${otpCode}`);
    });
  });

  test('US-4: invalid code is rejected (modal stays open, no Login Success log)', async ({ page, testEnv, db }) => {
    const websitePage = new WebsiteBasePage(page);
    const otpSincePk = await db.getMaxLoginAttemptPk(TEST_ACCOUNT.email);
    const logSincePk = await db.getMaxActivityLogPk(TEST_ACCOUNT.accountPk);
    const wrongCode = '000000';

    await test.step('request OTP', async () => {
      await page.goto(testEnv.websiteUrl);
      await websitePage.loginWithEmailOrPhone(TEST_ACCOUNT.email);
    });

    let realCode = '';
    await test.step('confirm a real OTP exists for this request (so the wrong one is provably wrong)', async () => {
      const row = await db.waitForFreshOtpCode(TEST_ACCOUNT.email, otpSincePk, 30_000);
      expect(row).toBeTruthy();
      realCode = row!.code!;
      expect(wrongCode).not.toBe(realCode);
    });

    await test.step('enter wrong code — must be rejected', async () => {
      const ok = await websitePage.enterVerificationCode(wrongCode);
      expect(ok, 'wrong code must NOT be accepted as login').toBe(false);
      expect(await websitePage.isOtpModalVisible(),
        'OTP modal must remain visible after a single wrong attempt').toBe(true);
    });

    await test.step('uown_login_attempt: row preserved (wrong attempt does not invalidate the OTP row)', async () => {
      const row = await db.getLatestLoginAttempt(TEST_ACCOUNT.email);
      expect(row).toBeTruthy();
      // number_of_attempts behavior varies between envs — qa2 increments on each
      // wrong attempt, qa1 may keep at 0 until a successful entry. Don't assert
      // a specific count; assert only that the row remains queryable with the
      // same code (i.e. the wrong attempt did not delete or rotate it).
      expect(row!.code, 'OTP row must still hold the original code after a wrong attempt').toBe(realCode);
    });

    await test.step('activity log: NO Login Success generated', async () => {
      const success = await db.waitForLoginSuccessLog(TEST_ACCOUNT.accountPk, logSincePk, 5_000).catch(() => null);
      expect(success, 'no Login Success log should be created on invalid code').toBeNull();
    });
  });

  test('US-5: expired code is rejected (DB UPDATE on expiration_time — authorized)', async ({ page, testEnv, db }) => {
    const websitePage = new WebsiteBasePage(page);
    const otpSincePk = await db.getMaxLoginAttemptPk(TEST_ACCOUNT.email);
    const logSincePk = await db.getMaxActivityLogPk(TEST_ACCOUNT.accountPk);
    let otpRowPk = '';
    let otpCode = '';

    await test.step('request OTP', async () => {
      await page.goto(testEnv.websiteUrl);
      await websitePage.loginWithEmailOrPhone(TEST_ACCOUNT.email);
    });

    await test.step('read fresh OTP row from uown_login_attempt', async () => {
      const row = await db.waitForFreshOtpCode(TEST_ACCOUNT.email, otpSincePk, 30_000);
      expect(row).toBeTruthy();
      otpRowPk = row!.pk;
      otpCode = row!.code!;
    });

    await test.step('UPDATE expiration_time to the past — force expiration (authorized 2026-04-30)', async () => {
      const affected = await db.executeUpdate(
        `UPDATE uown_login_attempt
         SET expiration_time = sent_time - INTERVAL '10 minutes'
         WHERE pk = $1`,
        [otpRowPk],
      );
      expect(affected, 'UPDATE must affect exactly one row').toBe(1);
    });

    await test.step('enter the now-expired code — must be rejected', async () => {
      const ok = await websitePage.enterVerificationCode(otpCode);
      expect(ok, 'expired code must NOT log the user in').toBe(false);
    });

    await test.step('activity log: NO Login Success generated', async () => {
      const success = await db.waitForLoginSuccessLog(TEST_ACCOUNT.accountPk, logSincePk, 5_000).catch(() => null);
      expect(success, 'no Login Success log should be created on expired code').toBeNull();
    });
  });

  test('US-7: lockout — modal closes after 3 wrong attempts, user must re-enter email/phone', async ({ page, testEnv, db }) => {
    const websitePage = new WebsiteBasePage(page);
    const otpSincePk = await db.getMaxLoginAttemptPk(TEST_ACCOUNT.email);
    const logSincePk = await db.getMaxActivityLogPk(TEST_ACCOUNT.accountPk);

    await test.step('request OTP', async () => {
      await page.goto(testEnv.websiteUrl);
      await websitePage.loginWithEmailOrPhone(TEST_ACCOUNT.email);
    });

    await test.step('confirm a fresh OTP exists (we will NOT use it — only wrong codes)', async () => {
      const row = await db.waitForFreshOtpCode(TEST_ACCOUNT.email, otpSincePk, 30_000);
      expect(row).toBeTruthy();
    });

    // Lockout limit varies by env (qa2 = 3, qa1 may be higher). Iterate until
    // the modal closes, capping at MAX_ATTEMPTS to avoid infinite loops if
    // the env doesn't lock at all.
    const MAX_ATTEMPTS = 6;
    let attemptsBeforeLockout = 0;
    let modalClosedByLockout = false;

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const wrongCode = `${i}${i}${i}${i}${i}${i}`;
      await test.step(`attempt ${i} — wrong code "${wrongCode}"`, async () => {
        await websitePage.enterVerificationCode(wrongCode).catch(() => null);
        const modalStillVisible = await websitePage.isOtpModalVisible();
        if (!modalStillVisible) {
          modalClosedByLockout = true;
          attemptsBeforeLockout = i;
        } else {
          await websitePage.clearOtpInputs();
        }
      });
      if (modalClosedByLockout) break;
    }

    await test.step('lockout triggered: modal hidden, URL not /overview, login form visible', async () => {
      expect(modalClosedByLockout,
        `OTP modal must close as lockout within ${MAX_ATTEMPTS} wrong attempts (closed on attempt #${attemptsBeforeLockout})`).toBe(true);
      expect(page.url(), 'URL must NOT advance to /overview on lockout').not.toMatch(/\/overview/);
      await expect(websitePage.emailOrPhoneInput,
        'login form must be visible again so user can re-enter email/phone').toBeVisible({ timeout: 5_000 });
      console.log(`[US-7] Lockout triggered after ${attemptsBeforeLockout} wrong attempts in env=${TARGET_ENV}`);
    });

    await test.step('uown_login_attempt: row preserved after the lockout', async () => {
      const row = await db.getLatestLoginAttempt(TEST_ACCOUNT.email);
      expect(row).toBeTruthy();
    });

    await test.step('activity log: NO Login Success generated during the lockout', async () => {
      const success = await db.waitForLoginSuccessLog(TEST_ACCOUNT.accountPk, logSincePk, 3_000).catch(() => null);
      expect(success, 'no Login Success must be logged during lockout').toBeNull();
    });
  });

  test('US-8: nonexistent email — account_found=false, no activity logs leak existence', async ({ page, testEnv, db }) => {
    const websitePage = new WebsiteBasePage(page);
    // Generate a unique email that does NOT exist in the env's customer base.
    const ghostEmail = uniqueEmail('svc460ghost');
    const otpSincePk = await db.getMaxLoginAttemptPk(ghostEmail);
    const logSincePk = await db.getMaxActivityLogPk(TEST_ACCOUNT.accountPk);

    await test.step(`submit nonexistent email "${ghostEmail}"`, async () => {
      await page.goto(testEnv.websiteUrl);
      await websitePage.loginWithEmailOrPhone(ghostEmail);
    });

    // The backend may or may not insert a row for a nonexistent email. Both
    // patterns are valid anti-enumeration defenses:
    //   (a) Row inserted with account_found=false, account_pks=NULL (qa2 behavior).
    //   (b) No row inserted at all (qa1 behavior).
    // What MUST NOT happen: row with account_found=true, OR a leak in activity logs.
    await test.step('uown_login_attempt: either no row, or row with account_found=false', async () => {
      const row = await pollForLoginAttemptRow(db, ghostEmail, otpSincePk, 8_000);
      if (row === null) {
        console.log('[US-8] No login_attempt row inserted for ghost email — anti-enumeration via no-op.');
      } else {
        console.log('[US-8] login_attempt row inserted with account_found=' + row.account_found);
        expect(row.account_found, 'nonexistent email must NOT be flagged as found').toBe(false);
        expect(row.account_pks, 'no account should be linked').toBeNull();
      }
    });

    await test.step('uown_sv_activity_log: no log on the test account leaks the ghost email', async () => {
      const logs = await db.getLoginActivityLogs(TEST_ACCOUNT.accountPk, logSincePk);
      expect(logs.filter(l => l.notes?.includes(ghostEmail)),
        'no log should mention the ghost email on the test account').toHaveLength(0);
    });
  });
});

// ── Polling helper for non-OTP-bearing login_attempt rows (US-8) ─────────

async function pollForLoginAttemptRow(
  db: { query<T>(sql: string, params?: unknown[]): Promise<T[]> },
  emailOrPhone: string,
  sincePk: bigint,
  timeoutMs: number,
): Promise<{ pk: string; account_found: boolean; account_pks: string | null; code: string | null } | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const rows = await db.query<{ pk: string; account_found: boolean; account_pks: string | null; code: string | null }>(
      `SELECT pk, account_found, account_pks, code
       FROM uown_login_attempt
       WHERE UPPER(email_phone_input) = UPPER($1) AND pk > $2
       ORDER BY pk DESC LIMIT 1`,
      [emailOrPhone, sincePk.toString()],
    );
    if (rows.length > 0) return rows[0];
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

// ── Cross-portal helpers ──────────────────────────────────────────────────

async function snapshotContact(api: ApiClients, accountPk: string): Promise<ContactInformationResponse> {
  const resp = await api.svcContact.getContactInfo(accountPk);
  if (!resp.body) throw new Error(`getContactInfo returned no body (status=${resp.status})`);
  return resp.body;
}

function primaryEmailEntry(contact: ContactInformationResponse) {
  const primary = contact.emailList.find(e => e.emailInfo.emailType === 'PRIMARY') ?? contact.emailList[0];
  if (!primary) throw new Error('account has no email on file');
  return primary;
}

function primaryPhoneEntry(contact: ContactInformationResponse) {
  const primary = contact.phoneList[0];
  if (!primary) throw new Error('account has no phone on file');
  return primary;
}

function formatPhone(entry: { phoneInfo: { areaCode: string; phoneNumber: number | string } }): string {
  return `${entry.phoneInfo.areaCode}${entry.phoneInfo.phoneNumber}`;
}

/**
 * Generate a 10-digit US phone for testing.
 * Uses a real-looking area code (415 — San Francisco) because qa2 validates
 * against a real number-format check that rejects the fictional 555 prefix
 * ("Invalid Phone Number" 400). Random 7-digit suffix avoids collisions
 * across parallel runs.
 */
function generateUsPhone10(): string {
  const suffix = Math.floor(1000000 + Math.random() * 8999999); // 7 digits
  return `415${suffix}`;
}

async function restorePrimaryEmail(
  api: ApiClients,
  accountPk: string,
  original: ReturnType<typeof primaryEmailEntry>,
): Promise<void> {
  await api.svcContact.createOrUpdateContactInfo({
    accountPk: Number(accountPk),
    emailList: [{
      pk: original.pk,
      emailInfo: {
        emailPK: original.emailInfo.emailPK,
        customerPK: original.emailInfo.customerPK,
        emailAddress: original.emailInfo.emailAddress,
        emailType: original.emailInfo.emailType,
        doNotEmail: original.emailInfo.doNotEmail,
      },
    }],
  });
}

async function restorePrimaryPhone(
  api: ApiClients,
  accountPk: string,
  original: ReturnType<typeof primaryPhoneEntry>,
): Promise<void> {
  await api.svcContact.createOrUpdateContactInfo({
    accountPk: Number(accountPk),
    phoneList: [{
      pk: original.pk,
      phoneInfo: {
        phonePK: original.phoneInfo.phonePK,
        customerPK: original.phoneInfo.customerPK,
        areaCode: original.phoneInfo.areaCode,
        phoneNumber: Number(original.phoneInfo.phoneNumber),
        phoneType: original.phoneInfo.phoneType,
        doNotCall: original.phoneInfo.doNotCall,
        doNotText: original.phoneInfo.doNotText,
      },
    }],
  });
}
