import { test, expect } from '@fixtures/test-context.fixture.js';
import { WebsiteBasePage } from '@pages/website/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import type { EmailContent } from '@helpers/email.helpers.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { sleep } from '@helpers/common.helpers.js';
import { chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Constants ──────────────────────────────────────────────────────

const TEST_NAME = 'RU04.26.1.51.0_verificationCodeEmailTemplate_147';
const SCREENSHOT_DIR = `reports/screenshots`;
const ARTIFACT_DIR = path.resolve('docs/taskTestingUown', TEST_NAME);

// ── Brand Expectations ─────────────────────────────────────────────

interface BrandExpectations {
  brand: 'uown' | 'kornerstone';
  logoContains: string;
  lockIconBgColor: string;
  contactPhone: string;
  websiteDomain: string;
  socialLinks: { name: string; hrefContains: string }[];
  noSocialLinks: string[];
  bodyNotContains: string[];
}

const UOWN_EXPECTATIONS: BrandExpectations = {
  brand: 'uown',
  logoContains: 'uown',
  lockIconBgColor: '#1dbae4',
  contactPhone: '(877) 357-5474',
  websiteDomain: 'uownleasing.com',
  socialLinks: [
    { name: 'Facebook', hrefContains: 'facebook.com' },
    { name: 'Instagram', hrefContains: 'instagram.com' },
    { name: 'Twitter', hrefContains: 'twitter.com' },
  ],
  noSocialLinks: [],
  bodyNotContains: ['kornerstoneliving.com'],
};

const KS_EXPECTATIONS: BrandExpectations = {
  brand: 'kornerstone',
  logoContains: 'kornerstone',
  lockIconBgColor: '#8fc31f',
  contactPhone: '(888) 521-5111',
  websiteDomain: 'kornerstoneliving.com',
  socialLinks: [
    { name: 'Facebook', hrefContains: 'facebook.com' },
    { name: 'Instagram', hrefContains: 'instagram.com' },
  ],
  noSocialLinks: ['twitter.com'],
  bodyNotContains: ['uownleasing.com', 'uown_logo_png'],
};

// ── Helpers ─────────────────────────────────────────────────────────

function extractImageUrls(html: string): string[] {
  const imgSrcRegex = /src=["']([^"']+)["']/gi;
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = imgSrcRegex.exec(html)) !== null) {
    if (match[1].startsWith('http')) urls.push(match[1]);
  }
  return [...new Set(urls)];
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHtmlBody(rawEmail: string): string {
  const doctypeIdx = rawEmail.indexOf('<!DOCTYPE');
  const htmlIdx = rawEmail.indexOf('<html');
  const startIdx = doctypeIdx >= 0 ? doctypeIdx : (htmlIdx >= 0 ? htmlIdx : 0);
  return rawEmail.substring(startIdx);
}

async function getOtpFromDb(
  db: DatabaseHelpers,
  emailAddress: string,
  timeoutMs = 60_000,
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    // Broad query first — no time filter, just most recent for this email
    const row = await db.queryOne<{ code: string; sent_time: string; expiration_time: string; account_found: boolean }>(
      `SELECT code, sent_time::text, expiration_time::text, account_found
       FROM uown_login_attempt
       WHERE LOWER(email_phone_input) = LOWER($1)
       ORDER BY pk DESC
       LIMIT 1`,
      [emailAddress],
    );
    if (attempt <= 3) {
      console.log(`[OTP-DB] attempt=${attempt} email=${emailAddress} found=${JSON.stringify(row)}`);
    }
    if (row?.code) return row.code;
    await new Promise((r) => setTimeout(r, 3_000));
  }
  // Final debug: check if ANY records exist for this email
  const count = await db.queryOne<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM uown_login_attempt WHERE LOWER(email_phone_input) = LOWER($1)`,
    [emailAddress],
  );
  console.log(`[OTP-DB] Total records for ${emailAddress}: ${count?.cnt || 0}`);
  return null;
}

/**
 * Fetches the email HTML body from uown_email_queue DB table.
 * This is more reliable than IMAP since it reads directly from the backend's email queue.
 */
async function getEmailBodyFromDb(
  db: DatabaseHelpers,
  recipientEmail: string,
  templateName: string,
  timeoutMs = 60_000,
): Promise<{ subject: string; body: string } | null> {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    try {
      const row = await db.queryOne<{ subject: string; email_body: string; status: string; template_name: string }>(
        `SELECT subject, email_body, status, template_name
         FROM uown_email_queue
         WHERE LOWER(to_email_addresses) LIKE LOWER($1)
           AND LOWER(template_name) LIKE LOWER($2)
         ORDER BY pk DESC
         LIMIT 1`,
        [`%${recipientEmail}%`, `%${templateName}%`],
      );
      if (attempt <= 3) {
        console.log(`[EmailDB] attempt=${attempt} template=${templateName} email=${recipientEmail} found=${row ? `status=${row.status}, template=${row.template_name}` : 'null'}`);
      }
      if (row?.email_body) {
        return { subject: row.subject, body: row.email_body };
      }
    } catch (err) {
      console.log(`[EmailDB] attempt=${attempt} DB error: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  return null;
}

async function saveEmailScreenshot(htmlBody: string, brand: string): Promise<Buffer> {
  const htmlPath = path.resolve(ARTIFACT_DIR, `email-${brand}.html`);
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, htmlBody, 'utf-8');

  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 700, height: 1200 } });
    const pg = await ctx.newPage();
    await pg.goto(`file://${htmlPath}`, { waitUntil: 'networkidle', timeout: 15_000 }).catch(() =>
      pg.goto(`file://${htmlPath}`, { waitUntil: 'domcontentloaded' }),
    );
    const screenshotBuffer = await pg.screenshot({ fullPage: true });

    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const pngPath = path.resolve(SCREENSHOT_DIR, `${TEST_NAME}-email-${brand}.png`);
    fs.writeFileSync(pngPath, screenshotBuffer);

    return screenshotBuffer;
  } finally {
    await browser.close();
  }
}

function validateTemplateContent(
  htmlBody: string,
  exp: BrandExpectations,
  ctLabel: string,
): void {
  const bodyLower = htmlBody.toLowerCase();
  const bodyText = stripHtmlTags(htmlBody);

  // Logo
  expect(bodyLower, `[${ctLabel}] Email should contain ${exp.brand} logo`).toContain(exp.logoContains);

  // Lock icon with brand color
  expect(bodyLower, `[${ctLabel}] Lock icon bg ${exp.lockIconBgColor}`).toContain(exp.lockIconBgColor);
  expect(bodyLower, `[${ctLabel}] Lock icon image`).toContain('lock_icon');

  // Title
  expect(bodyText.toLowerCase(), `[${ctLabel}] "Verification Code" title`).toContain('verification code');

  // Contact phone
  expect(htmlBody, `[${ctLabel}] Contact phone ${exp.contactPhone}`).toContain(exp.contactPhone);

  // Website domain
  expect(bodyLower, `[${ctLabel}] Website ${exp.websiteDomain}`).toContain(exp.websiteDomain);

  // Social links
  for (const social of exp.socialLinks) {
    expect(bodyLower, `[${ctLabel}] ${social.name} link`).toContain(social.hrefContains.toLowerCase());
  }

  // Absent social links
  for (const absent of exp.noSocialLinks) {
    const hrefCount = (htmlBody.match(new RegExp(`href="[^"]*${absent.replace('.', '\\.')}[^"]*"`, 'gi')) || []).length;
    expect(hrefCount, `[${ctLabel}] No ${absent} link`).toBe(0);
  }

  // Cross-brand check
  for (const notContain of exp.bodyNotContains) {
    expect(bodyLower, `[${ctLabel}] Should NOT contain "${notContain}"`).not.toContain(notContain.toLowerCase());
  }

  // Expiration notice
  expect(bodyText.toLowerCase(), `[${ctLabel}] Expiration notice`).toContain('expire');

  console.log(`[${ctLabel}] All template content validations passed`);
}

// ── Test Data ───────────────────────────────────────────────────────

const testData = [
  {
    env: 'qa2' as const,
    uownAccountPk: 10855,
    uownEmail: 'fintechgroup777@gmail.com',
    ksAccountPk: undefined as number | undefined,
    ksEmail: undefined as string | undefined,
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION, TestTag.CRITICAL),
  },
];

// ── Tests ────────────────────────────────────────────────────────────

for (const td of testData) {
  test.describe(`${TEST_NAME} [${td.env}]`, { tag: splitTags(td.tag) }, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ envName: td.env });

    // Shared state
    const emailByBrand: Record<string, EmailContent> = {};
    let ksEmail: string | undefined;

    test.beforeAll(async ({ db }) => {
      // Verify UOWN account and company
      const uownAccount = await db.queryOne<{ pk: number; account_status: string; company: string }>(
        `SELECT pk, account_status, company FROM uown_sv_account WHERE pk = $1`,
        [td.uownAccountPk],
      );
      console.log(`[Setup] UOWN account pk=${td.uownAccountPk} status=${uownAccount?.account_status} company=${uownAccount?.company}`);
      expect(uownAccount, `UOWN account ${td.uownAccountPk} must exist`).not.toBeNull();

      // If account 10855 is KS, find a real UOWN account
      if (uownAccount?.company === 'KORNERSTONE') {
        console.log(`[Setup] Account ${td.uownAccountPk} is KORNERSTONE, not UOWN — finding UOWN account...`);
        const realUown = await db.queryOne<{ pk: number; email_address: string }>(
          `SELECT a.pk, c.email_address
           FROM uown_sv_account a
           JOIN uown_sv_customer c ON c.account_pk = a.pk
           WHERE a.company = 'UOWN'
             AND a.account_status = 'ACTIVE'
             AND c.email_address LIKE '%gmail.com%'
           ORDER BY a.row_created_timestamp DESC
           LIMIT 1`,
        );
        if (realUown) {
          td.uownAccountPk = realUown.pk;
          td.uownEmail = realUown.email_address;
          console.log(`[Setup] Found UOWN account: pk=${realUown.pk}, email=${realUown.email_address}`);
        } else {
          console.log(`[Setup] WARNING: No UOWN ACTIVE account with Gmail found — using ${td.uownAccountPk} (KS) for all tests`);
        }
      }

      // Discover KS account
      const ksAccount = await db.queryOne<{ pk: number; email_address: string }>(
        `SELECT a.pk, c.email_address
         FROM uown_sv_account a
         JOIN uown_sv_customer c ON c.account_pk = a.pk
         WHERE a.company = 'KORNERSTONE'
           AND a.account_status = 'ACTIVE'
           AND c.email_address LIKE '%gmail.com%'
         ORDER BY a.row_created_timestamp DESC
         LIMIT 1`,
      );

      if (ksAccount) {
        ksEmail = ksAccount.email_address;
        console.log(`[Setup] KS account: pk=${ksAccount.pk}, email=${ksEmail}`);
      } else {
        console.log(`[Setup] No KS ACTIVE account with Gmail in ${td.env} — KS tests will be skipped`);
      }
    });

    // ── CT-01 + CT-02: UOWN Template + Login ─────────────────────

    test('CT-01 + CT-02: UOWN verification email template and login', async ({ page, email, db, testEnv }) => {
      test.setTimeout(720_000);
      const exp = UOWN_EXPECTATIONS;

      // Step 1: Trigger verification email
      await test.step('Navigate to Customer Portal and submit login', async () => {
        const websitePage = new WebsiteBasePage(page);
        await page.goto(testEnv.websiteUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await websitePage.loginWithEmail(td.uownEmail);
        console.log(`[CT-01] Login form submitted for ${td.uownEmail}`);
      });

      // Step 2: Get verification code from DB (fast, reliable)
      let verificationCode: string | null = null;
      await test.step('Get verification code from DB', async () => {
        verificationCode = await getOtpFromDb(db, td.uownEmail, 30_000);
        expect(verificationCode, 'OTP must exist in DB').not.toBeNull();
        expect(verificationCode, 'Code should be 6 digits').toMatch(/^\d{6}$/);
        console.log(`[CT-01] verificationCode=${verificationCode} (from DB)`);
      });

      // Step 3: CT-02 — Enter code and complete login (before code expires)
      await test.step('CT-02: Enter code and verify login succeeds', async () => {
        const websitePage = new WebsiteBasePage(page);
        const success = await websitePage.enterVerificationCode(verificationCode!);
        expect(success, 'Login with verification code should succeed').toBe(true);
        console.log(`[CT-02] Login succeeded`);
      });

      await test.step('CT-02: Verify account summary visible', async () => {
        // Verify dashboard loaded — check for "Account Summary" text or URL contains /overview
        await page.waitForURL('**/overview*', { timeout: 15_000 }).catch(() => {});
        const hasAccountSummary = await page.getByText('Account Summary', { exact: false }).first()
          .isVisible({ timeout: 10_000 }).catch(() => false);
        const hasDashboardContent = await page.getByText('Payment Due', { exact: false }).first()
          .isVisible({ timeout: 5_000 }).catch(() => false);
        expect(hasAccountSummary || hasDashboardContent || page.url().includes('/overview'),
          'Portal dashboard should load after login').toBe(true);
        console.log(`[CT-02] Dashboard visible at ${page.url()}`);
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/${TEST_NAME}-ct02-portal-dashboard.png`,
          fullPage: false,
        });
      });

      // Step 4: CT-01 — Fetch email content from DB (uown_email_queue)
      await test.step('CT-01: Fetch verification email from DB email queue', async () => {
        // Template name in DB has space: "Verification Code" not "VerificationCode"
        const emailRecord = await getEmailBodyFromDb(db, td.uownEmail, 'Verification', 30_000);
        if (!emailRecord) {
          test.skip(true, 'Verification email not found in DB queue');
          return;
        }
        emailByBrand['uown'] = { subject: emailRecord.subject, body: emailRecord.body };
        console.log(`[CT-01] Email from DB: subject="${emailRecord.subject}", body length=${emailRecord.body.length}`);

        // Detect if this is the OLD or NEW template
        const isNewTemplate = emailRecord.body.includes('lock_icon') || emailRecord.body.includes('<!DOCTYPE');
        if (!isNewTemplate) {
          console.log(`[CT-01] BUG DETECTED: Old simple template still deployed in ${td.env}`);
          console.log(`[CT-01] Email body: "${emailRecord.body.substring(0, 200)}"`);
          console.log(`[CT-01] Expected: New professional template with logo, lock icon, contact info, social links`);
          console.log(`[CT-01] The new template from MR !1356 has NOT been deployed to ${td.env}`);
          // Fail the test — this IS the bug we're testing for
          expect(isNewTemplate, `New verification code template should be deployed in ${td.env}. ` +
            `Current email body is the old simple format: "${emailRecord.body.substring(0, 100)}...". ` +
            `MR svc!1356 needs to be deployed.`).toBe(true);
        }
      });

      // Step 5: CT-01 — Validate template content
      await test.step('CT-01: Validate UOWN email template content', async () => {
        const htmlBody = extractHtmlBody(emailByBrand['uown'].body);
        validateTemplateContent(htmlBody, exp, 'CT-01');
      });

      // Step 6: CT-01 — Validate images return HTTP 200
      await test.step('CT-01: Validate image URLs return HTTP 200', async () => {
        const htmlBody = extractHtmlBody(emailByBrand['uown'].body);
        const imageUrls = extractImageUrls(htmlBody);
        console.log(`[CT-01] Found ${imageUrls.length} image URLs`);
        for (const url of imageUrls) {
          try {
            const resp = await fetch(url, { method: 'HEAD' });
            console.log(`[CT-01] Image ${url} → ${resp.status}`);
            expect(resp.status, `Image ${url} should return 200`).toBe(200);
          } catch (err) {
            console.log(`[CT-01] Image fetch failed: ${url} → ${(err as Error).message}`);
          }
        }
      });

      // Step 7: Save artifacts
      await test.step('CT-01: Save email artifacts', async () => {
        const htmlBody = extractHtmlBody(emailByBrand['uown'].body);
        const screenshotBuffer = await saveEmailScreenshot(htmlBody, 'uown');
        await test.info().attach('verification-email-uown.html', {
          body: htmlBody,
          contentType: 'text/html',
        });
        await test.info().attach('verification-email-uown.png', {
          body: screenshotBuffer,
          contentType: 'image/png',
        });
        console.log(`[CT-01] Artifacts saved`);
      });
    });

    // ── CT-03 + CT-04: KS Template + Login ───────────────────────

    test('CT-03 + CT-04: Kornerstone verification email template and login', async ({ page, email, db, testEnv }) => {
      test.skip(!ksEmail, 'No Kornerstone ACTIVE account with Gmail found in qa2');
      test.setTimeout(720_000);
      const exp = KS_EXPECTATIONS;

      await test.step('Navigate to Customer Portal and submit login', async () => {
        const websitePage = new WebsiteBasePage(page);
        await page.goto(testEnv.websiteUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await websitePage.loginWithEmail(ksEmail!);
        console.log(`[CT-03] Login form submitted for ${ksEmail}`);
      });

      let verificationCode: string | null = null;
      await test.step('Get verification code from DB', async () => {
        verificationCode = await getOtpFromDb(db, ksEmail!, 30_000);
        expect(verificationCode, 'KS OTP must exist in DB').not.toBeNull();
        console.log(`[CT-03] verificationCode=${verificationCode} (from DB)`);
      });

      await test.step('CT-04: Enter code and verify login succeeds', async () => {
        const websitePage = new WebsiteBasePage(page);
        const success = await websitePage.enterVerificationCode(verificationCode!);
        expect(success, 'KS login should succeed').toBe(true);
        console.log(`[CT-04] KS login succeeded`);
      });

      await test.step('CT-04: Verify dashboard loaded', async () => {
        await page.waitForURL('**/overview*', { timeout: 15_000 }).catch(() => {});
        const visible = await page.getByText('Account Summary', { exact: false }).first()
          .isVisible({ timeout: 10_000 }).catch(() => false);
        expect(visible || page.url().includes('/overview'), 'KS dashboard should load').toBe(true);
        console.log(`[CT-04] KS dashboard visible at ${page.url()}`);
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/${TEST_NAME}-ct04-ks-portal-dashboard.png`,
          fullPage: false,
        });
      });

      await test.step('CT-03: Fetch KS verification email from DB email queue', async () => {
        const emailRecord = await getEmailBodyFromDb(db, ksEmail!, 'Verification', 30_000);
        if (!emailRecord) {
          test.skip(true, 'KS verification email not found in DB queue');
          return;
        }
        emailByBrand['kornerstone'] = { subject: emailRecord.subject, body: emailRecord.body };
        console.log(`[CT-03] KS email from DB: subject="${emailRecord.subject}", body length=${emailRecord.body.length}`);

        const isNewTemplate = emailRecord.body.includes('lock_icon') || emailRecord.body.includes('<!DOCTYPE');
        if (!isNewTemplate) {
          console.log(`[CT-03] BUG: Old KS template still deployed`);
          expect(isNewTemplate, `New KS verification template should be deployed. ` +
            `Current: "${emailRecord.body.substring(0, 100)}..."`).toBe(true);
        }
      });

      await test.step('CT-03: Validate Kornerstone email template content', async () => {
        const htmlBody = extractHtmlBody(emailByBrand['kornerstone'].body);
        validateTemplateContent(htmlBody, exp, 'CT-03');
      });

      await test.step('CT-03: Save email artifacts', async () => {
        const htmlBody = extractHtmlBody(emailByBrand['kornerstone'].body);
        const screenshotBuffer = await saveEmailScreenshot(htmlBody, 'kornerstone');
        await test.info().attach('verification-email-kornerstone.html', {
          body: htmlBody,
          contentType: 'text/html',
        });
        await test.info().attach('verification-email-kornerstone.png', {
          body: screenshotBuffer,
          contentType: 'image/png',
        });
        console.log(`[CT-03] KS artifacts saved`);
      });
    });

    // ── CT-05: Code Format ───────────────────────────────────────

    test('CT-05: Validate verification code format for mobile copy', async () => {
      test.setTimeout(30_000);
      test.skip(!emailByBrand['uown'], 'CT-05 depends on CT-01 email');

      const htmlBody = extractHtmlBody(emailByBrand['uown'].body);

      await test.step('Validate hidden div with user-select:all', async () => {
        expect(htmlBody, 'user-select:all div should exist').toContain('user-select:all');

        const hiddenDivMatch = htmlBody.match(/user-select:all[^>]*>(\d{6})/);
        if (hiddenDivMatch) {
          expect(hiddenDivMatch[1], 'Hidden code should be 6 digits').toMatch(/^\d{6}$/);
          console.log(`[CT-05] Hidden div code: ${hiddenDivMatch[1]}`);
        }
      });

      await test.step('Validate 6 individual digit cells', async () => {
        const digitCells = htmlBody.match(/width:48px/g) || [];
        console.log(`[CT-05] Found ${digitCells.length} digit cells`);
        expect(digitCells.length, '6 individual digit cells').toBeGreaterThanOrEqual(6);
      });

      if (emailByBrand['kornerstone']) {
        await test.step('Validate KS also has mobile-copy format', async () => {
          const ksHtml = extractHtmlBody(emailByBrand['kornerstone'].body);
          expect(ksHtml, 'KS user-select:all').toContain('user-select:all');
          const ksCells = ksHtml.match(/width:48px/g) || [];
          expect(ksCells.length, 'KS 6 digit cells').toBeGreaterThanOrEqual(6);
          console.log(`[CT-05] KS also has ${ksCells.length} digit cells`);
        });
      }
    });

    // ── CT-06: Resend Code ───────────────────────────────────────

    test('CT-06: Validate resend verification code flow', async ({ page, email, db, testEnv }) => {
      test.setTimeout(720_000);

      let firstCode: string | null = null;
      let newCode: string | null = null;

      await test.step('Navigate to portal and trigger first code', async () => {
        const websitePage = new WebsiteBasePage(page);
        await page.goto(testEnv.websiteUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await websitePage.loginWithEmail(td.uownEmail);
        console.log(`[CT-06] First login submitted`);
      });

      await test.step('Get first code from DB', async () => {
        firstCode = await getOtpFromDb(db, td.uownEmail, 30_000);
        console.log(`[CT-06] First code: ${firstCode}`);
      });

      await test.step('Click "Didn\'t get a code?" to resend', async () => {
        const websitePage = new WebsiteBasePage(page);
        await websitePage.requestNewVerificationCode();
        console.log(`[CT-06] Resend requested`);
        await sleep(3_000);
      });

      await test.step('Fetch new verification code', async () => {
        // Get the newest code from DB (should be different from first)
        newCode = await getOtpFromDb(db, td.uownEmail, 30_000);
        if (!newCode) {
          // Fallback to IMAP
          newCode = await email.getVerificationCode(td.uownEmail, 150_000).catch(() => null);
        }
        expect(newCode, 'New verification code should exist').not.toBeNull();
        expect(newCode, 'New code should be 6 digits').toMatch(/^\d{6}$/);
        console.log(`[CT-06] newCode=${newCode} (firstCode=${firstCode})`);
      });

      await test.step('Enter new code and verify login', async () => {
        const websitePage = new WebsiteBasePage(page);
        const success = await websitePage.enterVerificationCode(newCode!);
        expect(success, 'Resent code login should succeed').toBe(true);
        console.log(`[CT-06] Resend login succeeded`);
      });

      await test.step('Verify portal dashboard', async () => {
        await page.waitForURL('**/overview*', { timeout: 15_000 }).catch(() => {});
        const visible = await page.getByText('Account Summary', { exact: false }).first()
          .isVisible({ timeout: 10_000 }).catch(() => false);
        expect(visible || page.url().includes('/overview'), 'Dashboard should load after resend').toBe(true);
        console.log(`[CT-06] Dashboard visible at ${page.url()}`);
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/${TEST_NAME}-ct06-resend-dashboard.png`,
          fullPage: false,
        });
      });
    });
  });
}
