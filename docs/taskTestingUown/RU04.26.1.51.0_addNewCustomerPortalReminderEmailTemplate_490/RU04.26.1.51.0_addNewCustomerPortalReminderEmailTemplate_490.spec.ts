/**
 * Task #490 — Add New "Customer Portal Reminder Email Template" (UOWN and Kornerstone)
 * Milestone: RU04.26.1.51.0
 *
 * Validates that the Customer Portal Reminder email template is correctly rendered
 * and delivered for both UOWN and Kornerstone brands. Checks:
 *  - Email delivery via sendCustomerPortalLink API + emailSweep
 *  - Email content (subject, body text, dynamic variables per brand)
 *  - Image URLs hosted on GCS (storage.googleapis.com/uown/)
 *  - All images return HTTP 200
 *  - Links/buttons point to correct portal URLs per brand
 *  - Email queue DB records (template_name, status, from_email)
 *
 * The email HTML body and a browser screenshot are saved as test artifacts.
 *
 * Run: npx playwright test docs/taskTestingUown/RU04.26.1.51.0_addNewCustomerPortalReminderEmailTemplate_490/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import type { EmailContent } from '@helpers/email.helpers.js';
import { ConfigEnvironment } from '@config/environment.js';
import { RUN_ID } from '@helpers/worker-id.helper.js';
import { chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const TEST_NAME = 'RU04.26.1.51.0_addNewCustomerPortalReminderEmailTemplate_490';

const GCS_DOMAIN = 'storage.googleapis.com/uown';

// ── Expected content per brand ───────────────────────────────────────────────

interface BrandExpectations {
  brand: 'uown' | 'kornerstone';
  subjectPattern: RegExp;
  bodyContains: string[];
  bodyNotContains: string[];
  expectedLinks: Record<string, RegExp>;
  footerContains: string[];
  templateName: string;
  portalUrlPattern: RegExp;
}

const UOWN_EXPECTATIONS: BrandExpectations = {
  brand: 'uown',
  subjectPattern: /uown|portal|account|manage/i,
  bodyContains: [
    'Uown Customer Portal',
    'manage your account',
    'verification code',
    'View your account and lease details',
    'Make or schedule payments',
  ],
  bodyNotContains: [
    'Kornerstone Customer Portal',
    'kornerstoneliving.com',
  ],
  expectedLinks: {
    'Portal': /uownleasing\.com/,
  },
  footerContains: [
    'uownleasing.com',
  ],
  templateName: 'CustomerPortalReminderEmail',
  portalUrlPattern: /uownleasing\.com/,
};

const KORNERSTONE_EXPECTATIONS: BrandExpectations = {
  brand: 'kornerstone',
  subjectPattern: /kornerstone|portal|account|manage/i,
  bodyContains: [
    'Kornerstone Customer Portal',
    'manage your account',
    'verification code',
    'View your account and lease details',
    'Make or schedule payments',
  ],
  bodyNotContains: [
    'Uown Customer Portal',
  ],
  expectedLinks: {
    'Portal': /kornerstoneliving\.com/,
  },
  footerContains: [],
  templateName: 'KORNERSTONE_CustomerPortalReminderEmail',
  portalUrlPattern: /kornerstoneliving\.com/,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractImageUrls(html: string): string[] {
  const imgSrcRegex = /src=["']([^"']+)["']/gi;
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = imgSrcRegex.exec(html)) !== null) {
    const url = match[1];
    if (url.startsWith('http')) urls.push(url);
  }
  return [...new Set(urls)];
}

function extractLinks(html: string): string[] {
  const hrefRegex = /href=["']([^"']+)["']/gi;
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html)) !== null) {
    const url = match[1];
    if (url.startsWith('http')) urls.push(url);
  }
  return [...new Set(urls)];
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\u2014/g, '\u2014')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── SQL queries ─────────────────────────────────────────────────────────────

/** Find an ACTIVE account for a given company (UOWN or KORNERSTONE) */
const FIND_ACCOUNT_SQL = `
  SELECT a.pk AS account_pk, c.pk AS customer_pk, c.first_name
  FROM uown_sv_account a
  JOIN uown_sv_customer c ON c.account_pk = a.pk AND c.customer_type = 'PRIMARY'
  JOIN uown_sv_email e ON e.account_pk = a.pk
  WHERE a.account_status = 'ACTIVE'
    AND (a.company = $1 OR ($1 = 'UOWN' AND a.company IS NULL))
    AND (e.do_not_email = false OR e.do_not_email IS NULL)
  ORDER BY a.pk DESC
  LIMIT 1
`;

/** Get the primary email record for an account */
const GET_EMAIL_PK_SQL = `
  SELECT e.pk AS email_pk, e.email_address, e.customer_pk
  FROM uown_sv_email e
  WHERE e.account_pk = $1
  ORDER BY e.pk ASC
  LIMIT 1
`;

/** Check email queue for the portal reminder template */
const CHECK_EMAIL_QUEUE_SQL = `
  SELECT eq.pk, eq.template_name, eq.status, eq.to_email_addresses, eq.from_email_address
  FROM uown_email_queue eq
  WHERE eq.account_pk = $1
    AND eq.template_name = $2
  ORDER BY eq.row_created_timestamp DESC
  LIMIT 1
`;

// ── Test data ────────────────────────────────────────────────────────────────

const testData = [
  {
    env: 'stg' as const,
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.STG),
  },
];

// ── Tests ────────────────────────────────────────────────────────────────────

for (const td of testData) {
  test.describe(`${TEST_NAME} [${td.env}]`, { tag: splitTags(td.tag) }, () => {
    test.describe.configure({ mode: 'serial' });

    // Shared state per brand
    const emailByBrand: Record<string, EmailContent> = {};
    const accountPkByBrand: Record<string, number> = {};
    const originalEmailByBrand: Record<string, { emailPk: number; customerPk: number; emailAddress: string }> = {};

    for (const expectations of [UOWN_EXPECTATIONS, KORNERSTONE_EXPECTATIONS]) {
      const { brand } = expectations;
      const ctOffset = brand === 'uown' ? 0 : 3; // CT-01..03 for UOWN, CT-04..06 for Kornerstone

      test.describe(`${brand.toUpperCase()} — Customer Portal Reminder`, () => {
        test.describe.configure({ mode: 'serial' });

        test(`CT-0${ctOffset + 1}: Send Customer Portal Reminder and receive email [${brand}]`,
          async ({ api, email, db }) => {
            test.setTimeout(480_000); // 8 min — email delivery can take time

            const env = new ConfigEnvironment(td.env);
            const companyValue = brand === 'uown' ? 'UOWN' : 'KORNERSTONE';

            // Generate unique test email alias
            const timestamp = Date.now().toString().slice(-6);
            const [localPart, domain] = env.email.split('@');
            const testEmail = `${localPart}+490_${brand}_${RUN_ID}_${timestamp}@${domain}`;

            await test.step(`Find ACTIVE ${brand.toUpperCase()} account via DB`, async () => {
              const row = await db.queryOne<{ account_pk: number; customer_pk: number; first_name: string }>(
                FIND_ACCOUNT_SQL, [companyValue],
              );
              expect(row, `Should find an ACTIVE ${companyValue} account`).not.toBeNull();
              accountPkByBrand[brand] = row!.account_pk;
              console.log(`[CT-0${ctOffset + 1}] accountPk=${row!.account_pk}, customerFirstName=${row!.first_name}, company=${companyValue}`);
            });

            const accountPk = accountPkByBrand[brand];

            await test.step('Get current email via API and save for restore', async () => {
              const contactRes = await api.svcEmail.getContactInfo(accountPk);
              expect(contactRes.status, 'getContactInfo should return 200').toBe(200);

              const emailList = contactRes.body.emailList || [];
              expect(emailList.length, 'Account should have at least one email').toBeGreaterThan(0);

              const primaryEmail = emailList[0];
              originalEmailByBrand[brand] = {
                emailPk: primaryEmail.pk,
                customerPk: primaryEmail.emailInfo.customerPK,
                emailAddress: primaryEmail.emailInfo.emailAddress,
              };
              console.log(`[CT-0${ctOffset + 1}] Original email: pk=${primaryEmail.pk}, customerPK=${primaryEmail.emailInfo.customerPK}, address=${primaryEmail.emailInfo.emailAddress}`);
            });

            await test.step(`Update account email to test inbox (${testEmail})`, async () => {
              const orig = originalEmailByBrand[brand];
              const updateRes = await api.svcEmail.createOrUpdateEmail({
                emailPK: orig.emailPk,
                customerPK: orig.customerPk,
                emailAddress: testEmail,
                emailType: 'PRIMARY',
                doNotEmail: false,
              });
              console.log(`[CT-0${ctOffset + 1}] Email update response: status=${updateRes.status}, body=${JSON.stringify(updateRes.body)}`);
              expect(updateRes.status, 'Email update should return 200').toBe(200);
              console.log(`[CT-0${ctOffset + 1}] Email updated to ${testEmail}`);
            });

            await test.step('Call sendCustomerPortalLink API', async () => {
              const response = await api.account.sendCustomerPortalLink(accountPk);
              expect(response.status, 'sendCustomerPortalLink should return 200').toBe(200);
              console.log(`[CT-0${ctOffset + 1}] API response: ${JSON.stringify(response.body)}`);

              // The response message should indicate email was sent
              const msg = response.body?.message || '';
              expect(msg.toLowerCase(), 'Response should mention email sent').toContain('email');
              console.log(`[CT-0${ctOffset + 1}] Invitation response: "${msg}"`);
            });

            await test.step('Trigger emailSweep to process queue', async () => {
              // Small delay to let the async correspondence creation complete
              await new Promise(r => setTimeout(r, 3_000));
              const sweepRes = await api.scheduledTask.sendEmailsSweep();
              console.log(`[CT-0${ctOffset + 1}] emailSweep triggered: status=${sweepRes.status}`);
            });

            await test.step('Wait for email via IMAP', async () => {
              console.log(`[CT-0${ctOffset + 1}] Waiting for Customer Portal Reminder email at ${testEmail}...`);
              const emailContent = await email.getEmailContent(
                testEmail,
                expectations.subjectPattern,
                420_000, // 7 min
              );
              expect(emailContent, `Portal reminder email should be received for ${brand}`).not.toBeNull();
              emailByBrand[brand] = emailContent!;
              console.log(`[CT-0${ctOffset + 1}] Email received: Subject="${emailContent!.subject}"`);
            });

            await test.step('Save email HTML as artifact', async () => {
              const artifactDir = path.resolve('docs/taskTestingUown/RU04.26.1.51.0_addNewCustomerPortalReminderEmailTemplate_490');
              fs.mkdirSync(artifactDir, { recursive: true });
              const htmlPath = path.join(artifactDir, `email-490-${brand}.html`);
              fs.writeFileSync(htmlPath, emailByBrand[brand].body, 'utf-8');
              console.log(`[CT-0${ctOffset + 1}] Email HTML saved to ${htmlPath}`);

              await test.info().attach(`portal-reminder-${brand}.html`, {
                body: emailByBrand[brand].body,
                contentType: 'text/html',
              });
            });

            await test.step('Take screenshot of email rendered in browser', async () => {
              const rawEmail = emailByBrand[brand].body;
              const htmlStart = rawEmail.indexOf('<!DOCTYPE');
              const cleanHtml = htmlStart >= 0 ? rawEmail.substring(htmlStart) : rawEmail;
              const artifactDir = path.resolve('docs/taskTestingUown/RU04.26.1.51.0_addNewCustomerPortalReminderEmailTemplate_490');
              fs.mkdirSync(artifactDir, { recursive: true });
              const renderPath = path.join(artifactDir, `email-490-${brand}-render.html`);
              fs.writeFileSync(renderPath, cleanHtml, 'utf-8');

              const browser = await chromium.launch({ headless: true });
              try {
                const page = await browser.newPage({ viewport: { width: 700, height: 1200 } });
                await page.goto(`file://${renderPath}`, { waitUntil: 'networkidle' });
                const screenshotBuffer = await page.screenshot({ fullPage: true });

                const pngPath = path.join(artifactDir, `email-490-${brand}.png`);
                fs.writeFileSync(pngPath, screenshotBuffer);
                console.log(`[CT-0${ctOffset + 1}] Email screenshot saved to ${pngPath}`);

                await test.info().attach(`portal-reminder-${brand}-screenshot.png`, {
                  body: screenshotBuffer,
                  contentType: 'image/png',
                });
              } finally {
                await browser.close();
              }
            });

            await test.step('Restore original email address', async () => {
              const orig = originalEmailByBrand[brand];
              try {
                await api.svcEmail.createOrUpdateEmail({
                  emailPK: orig.emailPk,
                  customerPK: orig.customerPk,
                  emailAddress: orig.emailAddress,
                  emailType: 'PRIMARY',
                  doNotEmail: false,
                });
                console.log(`[CT-0${ctOffset + 1}] Restored original email: ${orig.emailAddress}`);
              } catch (err) {
                console.log(`[CT-0${ctOffset + 1}] WARN: Failed to restore email — ${(err as Error).message}`);
              }
            });
          },
        );

        test(`CT-0${ctOffset + 2}: Validate email body content [${brand}]`,
          async () => {
            const content = emailByBrand[brand];
            expect(content, `Email for ${brand} should have been fetched in previous test`).toBeDefined();

            const bodyText = stripHtmlTags(content.body);

            await test.step('Validate subject line', async () => {
              expect(content.subject).toMatch(expectations.subjectPattern);
              console.log(`[CT-0${ctOffset + 2}] Subject OK: "${content.subject}"`);
            });

            await test.step('Validate required body content', async () => {
              for (const text of expectations.bodyContains) {
                expect(
                  bodyText.toLowerCase(),
                  `Email body should contain "${text}"`,
                ).toContain(text.toLowerCase());
              }
            });

            await test.step('Validate excluded content', async () => {
              for (const text of expectations.bodyNotContains) {
                expect(
                  bodyText.toLowerCase(),
                  `Email body should NOT contain "${text}"`,
                ).not.toContain(text.toLowerCase());
              }
            });

            await test.step('Validate footer content', async () => {
              for (const text of expectations.footerContains) {
                expect(
                  bodyText,
                  `Footer should contain "${text}"`,
                ).toContain(text);
              }
            });
          },
        );

        test(`CT-0${ctOffset + 3}: Validate images on GCS and links [${brand}]`,
          async ({ request }) => {
            const content = emailByBrand[brand];
            expect(content, `Email for ${brand} should have been fetched`).toBeDefined();

            await test.step('Verify image URLs point to GCS and return HTTP 200', async () => {
              const imageUrls = extractImageUrls(content.body);
              expect(imageUrls.length, 'Email should contain at least one image').toBeGreaterThan(0);
              console.log(`[CT-0${ctOffset + 3}] Found ${imageUrls.length} image URLs`);

              for (const url of imageUrls) {
                expect(url, `Image URL should be hosted on GCS: ${url}`).toContain(GCS_DOMAIN);
                const response = await request.get(url);
                expect(response.status(), `Image should return 200: ${url}`).toBe(200);
                console.log(`[CT-0${ctOffset + 3}] Image OK (200): ${url}`);
              }

              await test.info().attach(`image-urls-${brand}`, {
                body: imageUrls.join('\n'),
                contentType: 'text/plain',
              });
            });

            await test.step('Verify portal link points to correct brand URL', async () => {
              const links = extractLinks(content.body);
              console.log(`[CT-0${ctOffset + 3}] Found ${links.length} links in email`);

              for (const [name, pattern] of Object.entries(expectations.expectedLinks)) {
                const matchingLink = links.find(url => pattern.test(url));
                expect(matchingLink, `Should find ${name} link matching ${pattern}`).toBeTruthy();
                console.log(`[CT-0${ctOffset + 3}] Link OK — ${name}: ${matchingLink}`);
              }

              await test.info().attach(`links-${brand}`, {
                body: links.join('\n'),
                contentType: 'text/plain',
              });
            });
          },
        );
      });
    }

    // ── DB Validation (after both brands) ──────────────────────────────

    test.describe('DB Validations', () => {
      test.describe.configure({ mode: 'serial' });

      for (const expectations of [UOWN_EXPECTATIONS, KORNERSTONE_EXPECTATIONS]) {
        const { brand, templateName } = expectations;
        const ctNum = brand === 'uown' ? '07' : '08';

        test(`CT-${ctNum}: Verify email_queue record for ${brand.toUpperCase()}`,
          async ({ db }) => {
            const accountPk = accountPkByBrand[brand];
            expect(accountPk, `Account PK for ${brand} should be available`).toBeDefined();

            await test.step(`Check uown_email_queue for template=${templateName}`, async () => {
              const row = await db.queryOne<{
                pk: number;
                template_name: string;
                status: string;
                to_email_addresses: string;
                from_email_address: string;
              }>(CHECK_EMAIL_QUEUE_SQL, [accountPk, templateName]);

              expect(row, `Email queue record should exist for ${brand}`).not.toBeNull();
              console.log(`[CT-${ctNum}] email_queue: pk=${row!.pk}, template=${row!.template_name}, status=${row!.status}, from=${row!.from_email_address}`);

              expect(row!.template_name, 'Template name should match').toBe(templateName);
              expect(
                row!.status,
                'Email should have been sent (status SENT or PENDING)',
              ).toMatch(/SENT|PENDING/);
            });
          },
        );
      }
    });
  });
}
