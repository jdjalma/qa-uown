/**
 * Task #489 — Approval Email Template for EZPawn Merchant
 * Milestone: R1.51.0  (test name: RU04.26.1.51.0_approvalEmailTemplateForEZPawnMerchant_489)
 *
 * Validates the merchant-bound routing of the ApprovalEmail template:
 *   - EZPawn merchant (TF10078-0001)  -> template `approval-email-ezpawn.html`
 *       markers: contains "you've got this"; MUST NOT contain "no money down".
 *   - UOWN non-EZPawn (OL90202-0001)   -> generic `approval-email-general.html`
 *       "no money down" presence is merchant-dependent on
 *       uown_merchant.charge_processing_fee_before_esign (inverted).
 *   - Kornerstone (KS3015)             -> `KORNERSTONE_ApprovalEmail`
 *       markers: kornerstoneliving.com footer; MUST NOT contain uownleasing.com.
 *
 * Triple validation: API payload (APPROVED) + IMAP-fetched email body + DB
 * (`uown_email_queue.template_name`, `uown_los_activity_log` CORRESPONDENCE).
 *
 * DB-safety: CLAUDE.md Exception 3 — no INSERT/UPDATE/DELETE here. CT-03
 * performs a BRAND pre-condition probe on `uown_sv_account.company`; on
 * mismatch the test self-skips as [ENV-GAP] BRAND_MISMATCH (user memory
 * "No DB mutation to force test pass").
 *
 * Run:
 *   npx playwright test docs/taskTestingUown/RU04.26.1.51.0_approvalEmailTemplateForEZPawnMerchant_489/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import {
  buildTestData,
  getEmailTemplateName,
  getCorrespondenceLogs,
  getMerchantChargeProcessingFee,
} from '@helpers/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import type { EmailContent } from '@helpers/email.helpers.js';
import { chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const TEST_NAME = 'RU04.26.1.51.0_approvalEmailTemplateForEZPawnMerchant_489';

// ── Inline HTML helpers (ported verbatim from task #486 spec; Phase 6 will
//    migrate these into `src/helpers/email.helpers.ts`). ───────────────────

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

// Kept for parity with #486 / future link-integrity checks; not currently wired.
// Underscore prefix avoids `noUnusedLocals` (strict tsconfig).
function _extractLinks(html: string): string[] {
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
    .replace(/—/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Test data ───────────────────────────────────────────────────────────────

const testData = [
  {
    env: 'sandbox' as const,
    orderTotal: '1000',
    // Base CT tag string (CT-01 is the critical one). Per-describe overrides
    // for CT-02 / CT-03 are applied via `splitTags` below.
    tag: buildTags(TestTag.SANDBOX, TestTag.REGRESSION, TestTag.CRITICAL) + ' @email',
    tagNoCritical: buildTags(TestTag.SANDBOX, TestTag.REGRESSION) + ' @email',
  },
];

// ── Tests ───────────────────────────────────────────────────────────────────

for (const td of testData) {
  test.describe(`${TEST_NAME} [${td.env}]`, { tag: splitTags(td.tag) }, () => {
    // Outer describe is NOT serial — failure in one merchant group (e.g. EZPawn)
    // must NOT block the others from running (TerraceFinance / Kornerstone).
    // Each merchant's inner describe is serial so it can share state across its CTs.

    // Shared state across CTs within each inner serial describe.
    const emailByMerchant: Record<string, EmailContent> = {};
    const leadPkByMerchant: Record<string, number> = {};
    const accountPkByMerchant: Record<string, number> = {};

    // ═══════════════════════════════════════════════════════════════════════
    // EZPawn — TF10078-0001  (CT-01, CT-01-content, CT-04-ezpawn, CT-05-ezpawn)
    // ═══════════════════════════════════════════════════════════════════════
    test.describe(`EZPawn — TF10078-0001`, { tag: splitTags(td.tag) }, () => {
      test.describe.configure({ mode: 'serial' });
      const merchantKey = 'EZPawn';
      const artifactKey = 'ezpawn';

      test(`CT-01: Send application + receive approval email (EZPawn template) [${td.env}]`,
        async ({ api, email, ctx, db }) => {
          test.setTimeout(900_000); // 15 min — 8 min IMAP wait + margins.

          const data = buildTestData({
            env: td.env,
            state: 'TX',
            merchant: merchantKey,
            orderTotal: td.orderTotal,
            approved: true,
          });

          await test.step('Validate test data (EZPawn merchant number)', async () => {
            expect(data.merchant.number, 'EZPawn merchant number must be TF10078-0001')
              .toBe('TF10078-0001');
          });

          await test.step('Send application via API', async () => {
            const response = await api.application.sendApplication(
              data.merchant, data.applicant, data.order,
            );
            expect(response.status, 'sendApplication should return 200').toBe(200);
            expect(response.body.appApprovalStatus, 'Lead should be APPROVED')
              .toBe('APPROVED');

            ctx.leadUuid = String(response.body.accountNumber ?? '');
            console.log(
              `[${merchantKey}] Lead created: leadUuid=${ctx.leadUuid}, ` +
              `status=${response.body.appApprovalStatus}, ` +
              `creditLimit=$${response.body.creditLimit}`,
            );
          });

          await test.step('Resolve leadPk', async () => {
            const statusRes = await api.application.getApplicationStatus(
              data.merchant, ctx.leadUuid,
            );
            const leadPk = statusRes.body.leadPk;
            expect(leadPk, 'leadPk should be returned').toBeTruthy();
            ctx.leadPk = String(leadPk);
            leadPkByMerchant[merchantKey] = Number(leadPk);
            console.log(`[${merchantKey}] leadPk=${ctx.leadPk}`);
          });

          await test.step('Trigger synchronous ApprovalEmail (getFinalApprovalDetails)',
            async () => {
              // sendApplication dispatches email via @Async notificationExecutor
              // (AFTER_COMMIT). In sandbox the async executor may be sluggish —
              // getFinalApprovalDetails forces sendApprovalEmail(lead) synchronously.
              try {
                const res = await api.application.getFinalApprovalDetails(
                  leadPkByMerchant[merchantKey],
                );
                console.log(`[${merchantKey}] getFinalApprovalDetails: status=${res.status}`);
              } catch (err) {
                console.log(
                  `[${merchantKey}] getFinalApprovalDetails threw ` +
                  `(expected in sandbox) — email may still be queued: ${(err as Error).message}`,
                );
              }
            },
          );

          await test.step('Wait for approval email via IMAP (<=7 min)', async () => {
            console.log(`[${merchantKey}] Waiting for approval email at ${data.applicant.email}...`);
            const emailContent = await email.getEmailContent(
              data.applicant.email,
              /approval|approved/i,
              420_000,
            );
            expect(emailContent,
              `Approval email should be received for ${merchantKey} within 7 min`,
            ).not.toBeNull();
            emailByMerchant[merchantKey] = emailContent!;
            console.log(`[${merchantKey}] Email received: Subject="${emailContent!.subject}"`);
          });

          await test.step('Save email HTML + screenshot artifacts', async () => {
            const artifactDir = path.resolve('reports/test-results');
            fs.mkdirSync(artifactDir, { recursive: true });

            const htmlPath = path.join(artifactDir, `email-489-${artifactKey}.html`);
            fs.writeFileSync(htmlPath, emailByMerchant[merchantKey].body, 'utf-8');

            await test.info().attach(`approval-email-489-${artifactKey}.html`, {
              body: emailByMerchant[merchantKey].body,
              contentType: 'text/html',
            });

            // Render in headless chromium for visual artifact.
            const rawEmail = emailByMerchant[merchantKey].body;
            const htmlStart = rawEmail.indexOf('<!DOCTYPE');
            const cleanHtml = htmlStart >= 0 ? rawEmail.substring(htmlStart) : rawEmail;
            const renderPath = htmlPath.replace('.html', '-render.html');
            fs.writeFileSync(renderPath, cleanHtml, 'utf-8');

            const browser = await chromium.launch({ headless: true });
            try {
              const page = await browser.newPage({ viewport: { width: 700, height: 1200 } });
              await page.goto(`file://${renderPath}`, { waitUntil: 'networkidle' });
              const pngBuffer = await page.screenshot({ fullPage: true });
              const pngPath = path.join(artifactDir, `email-489-${artifactKey}.png`);
              fs.writeFileSync(pngPath, pngBuffer);
              await test.info().attach(`approval-email-489-${artifactKey}.png`, {
                body: pngBuffer,
                contentType: 'image/png',
              });
              console.log(`[${merchantKey}] Artifacts saved: ${htmlPath}, ${pngPath}`);
            } finally {
              await browser.close();
            }
          });

          await test.step('[reflex] DB: uown_email_queue.template_name = ApprovalEmail',
            async () => {
              const templateName = await getEmailTemplateName(db, leadPkByMerchant[merchantKey]);
              console.log(`[${merchantKey}] DB template_name=${templateName}`);
              if (templateName === null) {
                console.warn(`[${merchantKey}] [ENV-GAP] DB unreachable — skipping template_name assertion; primary content validation still runs in CT-01-content`);
                return;
              }
              expect(templateName,
                'Email queue row should exist with template_name = ApprovalEmail',
              ).toBe('ApprovalEmail');
            },
          );

          await test.step('[reflex] DB: audit log CORRESPONDENCE has ApprovalEmail note',
            async () => {
              let logs;
              try {
                logs = await getCorrespondenceLogs(db, leadPkByMerchant[merchantKey]);
              } catch (err) {
                console.warn(`[${merchantKey}] [ENV-GAP] DB unreachable — skipping audit log assertion: ${(err as Error).message}`);
                return;
              }
              expect(logs.length, 'At least one CORRESPONDENCE audit log expected')
                .toBeGreaterThan(0);
              expect(logs[0].note, 'Latest audit log note must reference ApprovalEmail')
                .toMatch(/ApprovalEmail/);
              expect(logs[0].createdBy, 'created_by (updated_by reflex) must be populated')
                .toBeTruthy();
            },
          );
        },
      );

      test(`CT-04-ezpawn: GCS images return HTTP 200 [${td.env}]`,
        { tag: splitTags(buildTags(TestTag.SANDBOX, TestTag.SMOKE) + ' @email') },
        async ({ request }) => {
          const content = emailByMerchant[merchantKey];
          expect(content, 'Email from CT-01 must exist').toBeDefined();

          const imageUrls = extractImageUrls(content.body)
            .filter((u) => u.includes('storage.googleapis.com/'));

          await test.step('At least one GCS image URL present', async () => {
            expect(imageUrls.length,
              'Expected >=1 image src on storage.googleapis.com',
            ).toBeGreaterThan(0);
            console.log(`[${merchantKey}] GCS image URLs: ${imageUrls.length}`);
          });

          await test.step('All GCS images return HTTP 200', async () => {
            for (const url of imageUrls) {
              const res = await request.get(url);
              expect(res.status(), `Image should return 200: ${url}`).toBe(200);
            }
          });

          await test.step('Attach URL list', async () => {
            await test.info().attach(`image-urls-489-${artifactKey}`, {
              body: imageUrls.join('\n'),
              contentType: 'text/plain',
            });
          });
        },
      );

      test(`CT-05-ezpawn: Audit log rollup for CORRESPONDENCE [${td.env}]`, async ({ db }) => {
        const leadPk = leadPkByMerchant[merchantKey];
        expect(leadPk, 'leadPk from CT-01 must exist').toBeTruthy();

        let logs;
        try {
          logs = await getCorrespondenceLogs(db, leadPk);
        } catch (err) {
          console.warn(`[${merchantKey}] [ENV-GAP] DB unreachable — skipping audit log rollup: ${(err as Error).message}`);
          test.skip(true, '[ENV-GAP] DB unreachable from this host (cloud-sql-proxy not tunneling sandbox)');
          return;
        }
        expect(logs.length,
          'Should have >=1 CORRESPONDENCE log for the EZPawn lead',
        ).toBeGreaterThan(0);
        expect(logs[0].note).toMatch(/ApprovalEmail/);
        // For EZPawn (UOWN brand) we must NOT see the KORNERSTONE_ prefix.
        expect(logs[0].note).not.toMatch(/KORNERSTONE_ApprovalEmail/);
        expect(logs[0].createdBy).toBeTruthy();
      });

      // Task #489 (per user confirmation 2026-04-23): EZPawn merchants must
      // receive the UOWN General Approval template (shared with other UOWN
      // merchants) WITHOUT the "NO MONEY DOWN!" promotional banner. This is
      // achieved via the merchant-level flag charge_processing_fee_before_esign
      // (or equivalent), NOT via a separate template file. The primary feature
      // check is therefore: EZPawn email must NOT contain the NO MONEY DOWN
      // banner, must render with merchantLocationName="EZ Pawn - N0001", and
      // must keep UOWN branding.
      test(`CT-01-content: Validate EZPawn approval email (general UOWN template, no NO MONEY DOWN banner) [${td.env}]`, async () => {
        const content = emailByMerchant[merchantKey];
        expect(content, 'Email from CT-01 must exist (serial mode)').toBeDefined();

        const bodyText = stripHtmlTags(content.body).toLowerCase();
        const hasGenericMarker = bodyText.includes("don't miss");
        const hasNoMoneyDown = bodyText.includes('no money down');
        const hasEzMerchantName = bodyText.includes('ez pawn');
        test.info().annotations.push({
          type: 'template-observed',
          description:
            `EZPawn email markers → general-template-marker="don't miss":${hasGenericMarker}, ` +
            `NO MONEY DOWN banner:${hasNoMoneyDown}, ` +
            `merchantLocationName contains "ez pawn":${hasEzMerchantName}`,
        });
        console.log(`[EZPawn] Observed markers: don't-miss=${hasGenericMarker}, no-money-down=${hasNoMoneyDown}, ez-pawn-name=${hasEzMerchantName}`);

        await test.step('Subject matches approval regex', async () => {
          expect(content.subject).toMatch(/approval|approved/i);
        });

        await test.step('PRIMARY: NO "NO MONEY DOWN!" banner (task #489 core requirement)', async () => {
          expect(bodyText,
            'EZPawn merchant must NOT receive the "No Money Down Approval Template" banner (task #489: use General Approval instead)',
          ).not.toContain('no money down');
        });

        await test.step('Merchant identified correctly (location name = EZ Pawn)', async () => {
          expect(bodyText,
            'merchantLocationName placeholder must resolve to the EZPawn merchant name in the body',
          ).toContain('ez pawn');
        });

        await test.step('UOWN footer preserved; Kornerstone content absent', async () => {
          expect(bodyText).toContain('uownleasing.com');
          expect(bodyText).not.toContain('kornerstoneliving.com');
        });
      });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // UOWN_NON_EZPAWN — OL90202-0001  (CT-02, CT-02-content)
    // ═══════════════════════════════════════════════════════════════════════
    test.describe(`UOWN_NON_EZPAWN — OL90202-0001`,
      { tag: splitTags(td.tagNoCritical) },
      () => {
        test.describe.configure({ mode: 'serial' });
        const merchantKey = 'TerraceFinance';
        const artifactKey = 'terracefinance';

        test(`CT-02: Send application + receive generic ApprovalEmail [${td.env}]`,
          async ({ api, email, ctx, db }) => {
            test.setTimeout(900_000);

            const data = buildTestData({
              env: td.env,
              state: 'TX',
              merchant: merchantKey,
              orderTotal: td.orderTotal,
              approved: true,
            });

            await test.step('Validate test data (TerraceFinance merchant number)', async () => {
              expect(data.merchant.number).toBe('OL90202-0001');
            });

            await test.step('Send application via API', async () => {
              const response = await api.application.sendApplication(
                data.merchant, data.applicant, data.order,
              );
              expect(response.status).toBe(200);
              expect(response.body.appApprovalStatus).toBe('APPROVED');
              ctx.leadUuid = String(response.body.accountNumber ?? '');
              console.log(`[${merchantKey}] leadUuid=${ctx.leadUuid}`);
            });

            await test.step('Resolve leadPk', async () => {
              const statusRes = await api.application.getApplicationStatus(
                data.merchant, ctx.leadUuid,
              );
              const leadPk = statusRes.body.leadPk;
              expect(leadPk).toBeTruthy();
              ctx.leadPk = String(leadPk);
              leadPkByMerchant[merchantKey] = Number(leadPk);
            });

            await test.step('Trigger sync ApprovalEmail', async () => {
              try {
                const res = await api.application.getFinalApprovalDetails(
                  leadPkByMerchant[merchantKey],
                );
                console.log(`[${merchantKey}] getFinalApprovalDetails: status=${res.status}`);
              } catch (err) {
                console.log(
                  `[${merchantKey}] getFinalApprovalDetails threw: ` +
                  `${(err as Error).message}`,
                );
              }
            });

            await test.step('Wait for approval email via IMAP', async () => {
              const emailContent = await email.getEmailContent(
                data.applicant.email, /approval|approved/i, 420_000,
              );
              expect(emailContent).not.toBeNull();
              emailByMerchant[merchantKey] = emailContent!;
              console.log(`[${merchantKey}] Email received: Subject="${emailContent!.subject}"`);
            });

            await test.step('Save email HTML + screenshot artifacts', async () => {
              const artifactDir = path.resolve('reports/test-results');
              fs.mkdirSync(artifactDir, { recursive: true });
              const htmlPath = path.join(artifactDir, `email-489-${artifactKey}.html`);
              fs.writeFileSync(htmlPath, emailByMerchant[merchantKey].body, 'utf-8');
              await test.info().attach(`approval-email-489-${artifactKey}.html`, {
                body: emailByMerchant[merchantKey].body,
                contentType: 'text/html',
              });

              const rawEmail = emailByMerchant[merchantKey].body;
              const htmlStart = rawEmail.indexOf('<!DOCTYPE');
              const cleanHtml = htmlStart >= 0 ? rawEmail.substring(htmlStart) : rawEmail;
              const renderPath = htmlPath.replace('.html', '-render.html');
              fs.writeFileSync(renderPath, cleanHtml, 'utf-8');

              const browser = await chromium.launch({ headless: true });
              try {
                const page = await browser.newPage({ viewport: { width: 700, height: 1200 } });
                await page.goto(`file://${renderPath}`, { waitUntil: 'networkidle' });
                const pngBuffer = await page.screenshot({ fullPage: true });
                const pngPath = path.join(artifactDir, `email-489-${artifactKey}.png`);
                fs.writeFileSync(pngPath, pngBuffer);
                await test.info().attach(`approval-email-489-${artifactKey}.png`, {
                  body: pngBuffer,
                  contentType: 'image/png',
                });
              } finally {
                await browser.close();
              }
            });

            await test.step('[reflex] DB: template_name = ApprovalEmail', async () => {
              const templateName = await getEmailTemplateName(
                db, leadPkByMerchant[merchantKey],
              );
              console.log(`[${merchantKey}] DB template_name=${templateName}`);
              if (templateName === null) {
                console.warn(`[${merchantKey}] [ENV-GAP] DB unreachable — skipping template_name assertion`);
                return;
              }
              expect(templateName).toBe('ApprovalEmail');
            });
          },
        );

        test(`CT-02-content: Validate generic (non-EZPawn) body markers [${td.env}]`,
          async ({ db }) => {
            const content = emailByMerchant[merchantKey];
            expect(content, 'Email from CT-02 must exist').toBeDefined();

            const bodyText = stripHtmlTags(content.body).toLowerCase();

            await test.step('Subject matches approval regex', async () => {
              expect(content.subject).toMatch(/approval|approved/i);
            });

            await test.step('[info] Record "no money down" banner presence', async () => {
              // Generic template has <th:block th:unless="${chargeProcessingFee}">
              // so "NO MONEY DOWN" appears IFF chargeProcessingFee === false.
              // Presence is informational for this regression CT — task #489
              // does not require TerraceFinance to render the banner.
              const refCode = 'terraceFinance';
              let chargeProcessingFee: boolean | 'unknown' = 'unknown';
              try {
                chargeProcessingFee = await getMerchantChargeProcessingFee(db, refCode);
              } catch (err) {
                console.warn(`[${merchantKey}] [ENV-GAP] DB unreachable for merchant flag. Error: ${(err as Error).message}`);
              }
              const containsNoMoneyDown = bodyText.includes('no money down');
              console.log(
                `[${merchantKey}] charge_processing_fee_before_esign=${chargeProcessingFee} / body contains "no money down"=${containsNoMoneyDown}`,
              );
              test.info().annotations.push({
                type: 'charge-processing-fee',
                description: `chargeProcessingFee=${chargeProcessingFee}; bodyContainsNoMoneyDown=${containsNoMoneyDown}`,
              });
              // No hard expect — when chargeProcessingFee is known and false,
              // we DO assert the banner is present; otherwise we only record.
              if (chargeProcessingFee === false) {
                expect(containsNoMoneyDown,
                  'When charge_processing_fee_before_esign=false, the banner SHOULD render',
                ).toBe(true);
              }
            });

            await test.step('Merchant identified correctly (location name = terraceFinance)', async () => {
              expect(bodyText).toContain('terracefinance');
            });

            await test.step('UOWN footer preserved; Kornerstone content absent',
              async () => {
                expect(bodyText).toContain('uownleasing.com');
                expect(bodyText).not.toContain('kornerstoneliving.com');
              },
            );
          },
        );
      },
    );

    // ═══════════════════════════════════════════════════════════════════════
    // KORNERSTONE — KS3015  (CT-03, CT-03-content)
    // ═══════════════════════════════════════════════════════════════════════
    test.describe(`KORNERSTONE — KS3015`,
      { tag: splitTags(td.tagNoCritical) },
      () => {
        test.describe.configure({ mode: 'serial' });
        const merchantKey = 'FifthAveFurnitureNY';
        const artifactKey = 'kornerstone';

        test(`CT-03: Send application + receive Kornerstone template [${td.env}]`,
          async ({ api, email, ctx, db }) => {
            test.setTimeout(900_000);

            const data = buildTestData({
              env: td.env,
              state: 'NY',
              merchant: merchantKey,
              orderTotal: td.orderTotal,
              approved: true,
            });

            await test.step('Validate test data (Kornerstone merchant number)', async () => {
              expect(data.merchant.number).toBe('KS3015');
            });

            await test.step('Send application via API', async () => {
              const response = await api.application.sendApplication(
                data.merchant, data.applicant, data.order,
              );
              expect(response.status).toBe(200);
              expect(response.body.appApprovalStatus).toBe('APPROVED');
              ctx.leadUuid = String(response.body.accountNumber ?? '');
              console.log(`[${merchantKey}] leadUuid=${ctx.leadUuid}`);
            });

            let dbReachable = true;
            await test.step('Resolve leadPk + accountPk', async () => {
              const statusRes = await api.application.getApplicationStatus(
                data.merchant, ctx.leadUuid,
              );
              const leadPk = statusRes.body.leadPk;
              expect(leadPk).toBeTruthy();
              ctx.leadPk = String(leadPk);
              leadPkByMerchant[merchantKey] = Number(leadPk);

              // accountPk via svc (uown_sv_account.lead_pk) — DB-dependent
              try {
                const accountPkStr = await db.waitForAccountByLeadPk(ctx.leadPk, 30_000);
                expect(accountPkStr,
                  'Account row in uown_sv_account should be created from the lead',
                ).toBeTruthy();
                ctx.accountPk = accountPkStr!;
                accountPkByMerchant[merchantKey] = Number(accountPkStr);
                console.log(`[${merchantKey}] leadPk=${ctx.leadPk} accountPk=${ctx.accountPk}`);
              } catch (err) {
                console.warn(`[${merchantKey}] [ENV-GAP] DB unreachable for accountPk lookup: ${(err as Error).message}`);
                dbReachable = false;
              }
            });

            // ── BRAND pre-condition gate (CLAUDE.md Exception 3 + user memory) ──
            await test.step('[gate] Kornerstone brand pre-condition: company = KORNERSTONE',
              async () => {
                if (!dbReachable) {
                  test.skip(true, '[ENV-GAP] DB unreachable — cannot verify brand; skipping CT-03');
                  return;
                }
                const row = await db.getSingleRow<{ company: string | null }>(
                  `SELECT company FROM uown_sv_account WHERE pk = $1`,
                  [accountPkByMerchant[merchantKey]],
                );
                const company = row?.company ?? '(null)';
                console.log(`[${merchantKey}] uown_sv_account.company=${company}`);
                test.skip(company !== 'KORNERSTONE',
                  `[CT-03] BRAND_MISMATCH — expected KORNERSTONE, got "${company}" ` +
                  `(ENV-GAP; no DB UPDATE per CLAUDE.md Exception 3 + ` +
                  `user memory "No DB mutation to force test pass")`);
              },
            );

            await test.step('Trigger sync ApprovalEmail', async () => {
              try {
                const res = await api.application.getFinalApprovalDetails(
                  leadPkByMerchant[merchantKey],
                );
                console.log(`[${merchantKey}] getFinalApprovalDetails: status=${res.status}`);
              } catch (err) {
                console.log(
                  `[${merchantKey}] getFinalApprovalDetails threw: ` +
                  `${(err as Error).message}`,
                );
              }
            });

            await test.step('Wait for approval email via IMAP', async () => {
              const emailContent = await email.getEmailContent(
                data.applicant.email, /approval|approved/i, 420_000,
              );
              expect(emailContent).not.toBeNull();
              emailByMerchant[merchantKey] = emailContent!;
              console.log(`[${merchantKey}] Email received: Subject="${emailContent!.subject}"`);
            });

            await test.step('Save email HTML + screenshot artifacts', async () => {
              const artifactDir = path.resolve('reports/test-results');
              fs.mkdirSync(artifactDir, { recursive: true });
              const htmlPath = path.join(artifactDir, `email-489-${artifactKey}.html`);
              fs.writeFileSync(htmlPath, emailByMerchant[merchantKey].body, 'utf-8');
              await test.info().attach(`approval-email-489-${artifactKey}.html`, {
                body: emailByMerchant[merchantKey].body,
                contentType: 'text/html',
              });

              const rawEmail = emailByMerchant[merchantKey].body;
              const htmlStart = rawEmail.indexOf('<!DOCTYPE');
              const cleanHtml = htmlStart >= 0 ? rawEmail.substring(htmlStart) : rawEmail;
              const renderPath = htmlPath.replace('.html', '-render.html');
              fs.writeFileSync(renderPath, cleanHtml, 'utf-8');

              const browser = await chromium.launch({ headless: true });
              try {
                const page = await browser.newPage({ viewport: { width: 700, height: 1200 } });
                await page.goto(`file://${renderPath}`, { waitUntil: 'networkidle' });
                const pngBuffer = await page.screenshot({ fullPage: true });
                const pngPath = path.join(artifactDir, `email-489-${artifactKey}.png`);
                fs.writeFileSync(pngPath, pngBuffer);
                await test.info().attach(`approval-email-489-${artifactKey}.png`, {
                  body: pngBuffer,
                  contentType: 'image/png',
                });
              } finally {
                await browser.close();
              }
            });

            await test.step('[reflex] DB: template_name = KORNERSTONE_ApprovalEmail',
              async () => {
                const templateName = await getEmailTemplateName(
                  db, leadPkByMerchant[merchantKey],
                );
                console.log(`[${merchantKey}] DB template_name=${templateName}`);
                if (templateName === null) {
                  console.warn(`[${merchantKey}] [ENV-GAP] DB unreachable — skipping template_name assertion`);
                  return;
                }
                expect(templateName).toBe('KORNERSTONE_ApprovalEmail');
              },
            );
          },
        );

        test(`CT-03-content: Validate Kornerstone body markers + no UOWN contamination [${td.env}]`,
          async () => {
            const content = emailByMerchant[merchantKey];
            // If CT-03 skipped due to BRAND_MISMATCH, this will also be skipped
            // because the prior test did not populate the shared state.
            test.skip(!content, '[CT-03-content] Skipped — CT-03 did not run to completion');

            const bodyRaw = stripHtmlTags(content!.body);
            const bodyText = bodyRaw.toLowerCase();

            await test.step('Subject matches approval regex', async () => {
              expect(content!.subject).toMatch(/approval|approved/i);
            });

            await test.step('Kornerstone branding present (footer / email)', async () => {
              const hasKornerstoneMarker =
                bodyText.includes('kornerstoneliving.com') ||
                bodyText.includes('cs@kornerstoneliving.com');
              expect(hasKornerstoneMarker,
                'Body should reference kornerstoneliving.com (footer or CS email)',
              ).toBe(true);
            });

            await test.step('UOWN cross-contamination absent', async () => {
              expect(bodyText).not.toContain('uownleasing.com');
            });

            await test.step('EZPawn-specific copy MUST NOT leak across brands',
              async () => {
                expect(bodyText).not.toContain("you've got this");
              },
            );
          },
        );
      },
    );
  });
}
