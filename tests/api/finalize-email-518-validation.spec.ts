/**
 * API-only validation for GitLab #518 — Finalize Purchase Email template.
 *
 * Purpose: validate the BACKEND assertions for leads the user already created
 * manually via UI (one UOWN OL90205-0001 Daniel's Jewelers + one Kornerstone
 * KS3015 in qa1). Does NOT exercise the UI setup — relies on the leads that
 * are already there.
 *
 * Coverage per lead:
 *  - Brand check (`uown_sv_account.company`)
 *  - Activity log (Rule 14) for the invoice-creation auto-trigger that the
 *    user already exercised manually
 *  - Email queue `template_name` matches brand
 *  - API trigger `POST /uown/sendFinalizeEmailToCustomer` succeeds and
 *    produces a NEW activity log + queue row
 *
 * Tagged @cicd so it runs in CI once green.
 */
import { test, expect } from '@support/base-test.js';
import {
  getEmailTemplateNameByPattern,
  getCorrespondenceLogs,
} from '@helpers/correspondence.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

interface RecentLead {
  leadPk: number;
  accountPk: number;
  email: string;
  merchantNumber: string;
  refMerchantCode: string;
  brand: 'UOWN' | 'KORNERSTONE';
  createdAt: Date;
}

interface CtConfig {
  id: string;
  brand: 'UOWN' | 'KORNERSTONE';
  refMerchantCode: string;          // uown_merchant.ref_merchant_code
  expectedTemplate: 'FinalizePurchaseEmail' | 'KORNERSTONE_FinalizePurchaseEmail';
  templateLikePattern: string;
  notePattern: RegExp;
  redirectHost: string;
}

const CTS: readonly CtConfig[] = [
  {
    id: 'CT-A',
    brand: 'UOWN',
    // qa1: ref_merchant_code for Daniel's Jewelers is the OL number (NOT
    // 'danielsjewelers'). Confirmed via uown_email_queue join 2026-05-19.
    refMerchantCode: 'OL90205-0001',
    expectedTemplate: 'FinalizePurchaseEmail',
    templateLikePattern: '%FinalizePurchaseEmail%',
    notePattern: /(?<!KORNERSTONE_)FinalizePurchaseEmail/,
    redirectHost: 'secure-qa1.uownleasing.com',
  },
  {
    id: 'CT-B',
    brand: 'KORNERSTONE',
    refMerchantCode: 'KS3015',
    expectedTemplate: 'KORNERSTONE_FinalizePurchaseEmail',
    templateLikePattern: '%KORNERSTONE_FinalizePurchaseEmail%',
    notePattern: /KORNERSTONE_FinalizePurchaseEmail/,
    redirectHost: 'customer.qa1.kornerstoneliving.com',
  },
];

const LOOKBACK_HOURS = 24;

test.describe('Task #518 — Finalize Purchase Email backend validation', () => {
  for (const ct of CTS) {
    test(
      `${ct.id} ${ct.brand} (${ct.refMerchantCode}) — recent lead validation`,
      { tag: ['@regression', '@email', '@brand:' + ct.brand.toLowerCase(), '@task-518'] },
      async ({ api, db }, testInfo) => {
        test.setTimeout(180_000);

        // 1. Find the user's most recent lead for this merchant in qa1
        const sinceIso = new Date(Date.now() - LOOKBACK_HOURS * 3600_000).toISOString();
        // Find via uown_email_queue (works even when account_pk hasn't
        // materialized yet — applicable when lead was just created and the
        // sv_account row is still being written).
        const sql = `
          SELECT q.lead_pk AS lead_pk,
                 q.template_name AS template_name,
                 q.row_created_timestamp AS queue_created,
                 e.email_address AS email,
                 m.ref_merchant_code AS ref_merchant_code,
                 m.merchant_name AS merchant_name,
                 m.client_type AS client_type,
                 (SELECT a.pk FROM uown_sv_account a WHERE a.lead_pk = q.lead_pk LIMIT 1) AS account_pk,
                 (SELECT a.company FROM uown_sv_account a WHERE a.lead_pk = q.lead_pk LIMIT 1) AS company
            FROM uown_email_queue q
            JOIN uown_los_lead l ON l.pk = q.lead_pk
            JOIN uown_merchant m ON m.pk = l.merchant_pk
            LEFT JOIN uown_los_email e ON e.lead_pk = q.lead_pk
           WHERE m.ref_merchant_code = $1
             AND q.template_name LIKE $2
             AND q.row_created_timestamp >= $3
           ORDER BY q.row_created_timestamp DESC NULLS LAST, q.pk DESC
           LIMIT 1
        `;
        const row = await db.queryOne<{
          lead_pk: number | string;
          template_name: string;
          queue_created: Date | string | null;
          email: string | null;
          ref_merchant_code: string;
          merchant_name: string | null;
          client_type: string | null;
          account_pk: number | string | null;
          company: string | null;
        }>(sql, [ct.refMerchantCode, ct.templateLikePattern, sinceIso]);

        if (!row) {
          throw new Error(
            `[ENV-GAP] [${ct.id}] No Finalize Purchase email queued for ` +
              `ref_merchant_code=${ct.refMerchantCode} in the last ${LOOKBACK_HOURS}h. ` +
              `Was the manual lead created in a different env?`,
          );
        }

        const lead: RecentLead = {
          leadPk: Number(row.lead_pk),
          accountPk: row.account_pk != null ? Number(row.account_pk) : 0,
          email: row.email ?? '',
          merchantNumber: row.merchant_name ?? '',
          refMerchantCode: row.ref_merchant_code,
          brand: ct.brand,
          createdAt:
            row.queue_created instanceof Date
              ? row.queue_created
              : new Date(row.queue_created ?? Date.now()),
        };
        console.log(
          `[${ct.id}] Found lead: pk=${lead.leadPk} accountPk=${lead.accountPk} ` +
            `email=${lead.email} merchant=${lead.merchantNumber} ` +
            `created=${lead.createdAt.toISOString()}`,
        );
        testInfo.annotations.push({ type: 'leadPk', description: String(lead.leadPk) });
        testInfo.annotations.push({ type: 'accountPk', description: String(lead.accountPk) });
        testInfo.annotations.push({ type: 'applicantEmail', description: lead.email });
        testInfo.annotations.push({
          type: 'merchantName',
          description: lead.merchantNumber,
        });
        testInfo.annotations.push({
          type: 'company',
          description: row.company ?? '(null)',
        });

        // 2. Brand check (reflex §7.2). When uown_sv_account row hasn't
        // materialized yet (account_pk=0), fall back to merchant.client_type —
        // brand resolution in CorrespondenceService:84-97 honors either signal.
        await test.step(`[brand-check] merchant.client_type or sv_account.company=${ct.brand}`, async () => {
          if (lead.accountPk > 0) {
            const company = await db.getAccountCompanyByPk(lead.accountPk);
            expect(
              company,
              `[CONFIRMADO] [${ct.id}] BRAND_MISMATCH — expected ${ct.brand}, got sv_account.company=${company}`,
            ).toBe(ct.brand);
          } else {
            // KS leads keep client_type=KORNERSTONE; UOWN can be 'V1_UOWN',
            // 'DANIELS_JEWELERS', etc. — the brand is resolved against the
            // KORNERSTONE flag in CorrespondenceService, so we assert the
            // negative for UOWN and the positive for KS.
            const ct_client = row.client_type ?? '';
            if (ct.brand === 'KORNERSTONE') {
              expect(
                ct_client,
                `[CONFIRMADO] [${ct.id}] expected client_type=KORNERSTONE, got ${ct_client}`,
              ).toBe('KORNERSTONE');
            } else {
              expect(
                ct_client === 'KORNERSTONE',
                `[CONFIRMADO] [${ct.id}] UOWN lead has client_type=KORNERSTONE: ${ct_client}`,
              ).toBe(false);
            }
          }
        });

        // 3. Activity log from the user's manual invoice-creation trigger (Rule 14)
        await test.step(
          `[rule-14-manual] activity log from manual invoice trigger contains ${ct.notePattern}`,
          async () => {
            const logs = await getCorrespondenceLogs(db, lead.leadPk);
            const matches = logs.filter((l) => ct.notePattern.test(l.note));
            console.log(
              `[${ct.id}] Found ${logs.length} CORRESPONDENCE logs; ${matches.length} match ${ct.notePattern}`,
            );
            for (const m of matches.slice(0, 5)) {
              console.log(
                `[${ct.id}]   pk=${m.pk} createdAt=${m.createdAt.toISOString()} note="${m.note.slice(0, 120)}"`,
              );
            }
            expect(
              matches.length,
              `[CONFIRMADO] [${ct.id}] Rule 14 violation — no CORRESPONDENCE log in ` +
                `uown_los_activity_log for lead_pk=${lead.leadPk} matching ${ct.notePattern}. ` +
                `Manual invoice trigger should have produced one.`,
            ).toBeGreaterThan(0);

            // Cross-contamination — UOWN log MUST NOT contain KORNERSTONE_
            if (ct.brand === 'UOWN') {
              for (const m of matches) {
                expect(
                  m.note.includes('KORNERSTONE_'),
                  `[CONFIRMADO] [${ct.id}] §7.3 cross-contamination — UOWN log has KORNERSTONE_ prefix: ${m.note}`,
                ).toBe(false);
              }
            }
          },
        );

        // 4. Email queue template name (reflex §13)
        await test.step(
          `[email-queue] uown_email_queue.template_name=${ct.expectedTemplate}`,
          async () => {
            const templateName = await getEmailTemplateNameByPattern(
              db,
              lead.leadPk,
              ct.templateLikePattern,
            );
            expect(
              templateName,
              `[CONFIRMADO] [${ct.id}] R-COMM-03 — no row in uown_email_queue matching ` +
                `${ct.templateLikePattern} for lead_pk=${lead.leadPk}`,
            ).not.toBeNull();
            expect(
              templateName,
              `[CONFIRMADO] [${ct.id}] template_name mismatch — expected exact ` +
                `'${ct.expectedTemplate}', got '${templateName}'`,
            ).toBe(ct.expectedTemplate);
            if (ct.brand === 'KORNERSTONE') {
              expect(
                templateName!.startsWith('KORNERSTONE_'),
                `[CONFIRMADO] [${ct.id}] KS template MUST start with 'KORNERSTONE_'; got '${templateName}'`,
              ).toBe(true);
            }
          },
        );

        // 5. Snapshot row counts BEFORE API trigger so we can prove the new entries
        const logsBefore = await getCorrespondenceLogs(db, lead.leadPk);
        const logCountBefore = logsBefore.filter((l) => ct.notePattern.test(l.note)).length;
        const queueRowBefore = await db.queryOne<{ pk: string | number }>(
          `SELECT pk FROM uown_email_queue
            WHERE lead_pk = $1 AND template_name = $2
            ORDER BY pk DESC LIMIT 1`,
          [lead.leadPk, ct.expectedTemplate],
        );
        const queuePkBefore = queueRowBefore ? Number(queueRowBefore.pk) : 0;

        // 6. Trigger via API (covers CT-01/CT-02 of the original SPEC — the
        //    direct admin endpoint the user did NOT exercise manually)
        const redirectUrl = `https://${ct.redirectHost}/finalize/${lead.leadPk}`;
        await test.step(
          `[api-trigger] POST /uown/sendFinalizeEmailToCustomer redirectUrl=${redirectUrl}`,
          async () => {
            const res = await api.correspondence.sendFinalizeEmailToCustomer(
              lead.leadPk,
              redirectUrl,
            );
            console.log(`[${ct.id}] API response status=${res.status} ok=${res.ok}`);
            expect(
              res.ok,
              `[CONFIRMADO] [${ct.id}] API trigger failed: ${res.status} ${JSON.stringify(res.body).slice(0, 300)}`,
            ).toBeTruthy();
          },
        );

        // 7. New activity log appears after API trigger
        await test.step(
          `[rule-14-api] new activity log after API trigger`,
          async () => {
            const deadline = Date.now() + 30_000;
            let found = false;
            while (Date.now() < deadline) {
              const logsAfter = await getCorrespondenceLogs(db, lead.leadPk);
              const newMatches = logsAfter.filter((l) => ct.notePattern.test(l.note));
              if (newMatches.length > logCountBefore) {
                found = true;
                console.log(
                  `[${ct.id}] Found ${newMatches.length - logCountBefore} new log(s) after API trigger`,
                );
                break;
              }
              await sleep(2000);
            }
            expect(
              found,
              `[CONFIRMADO] [${ct.id}] Rule 14 — API trigger produced no new CORRESPONDENCE log ` +
                `in 30s (had ${logCountBefore} matching before).`,
            ).toBe(true);
          },
        );

        // 8. New queue row appears after API trigger
        await test.step(
          `[email-queue-api] new email_queue row after API trigger`,
          async () => {
            const deadline = Date.now() + 30_000;
            let found = false;
            while (Date.now() < deadline) {
              const row = await db.queryOne<{ pk: string | number }>(
                `SELECT pk FROM uown_email_queue
                  WHERE lead_pk = $1 AND template_name = $2
                  ORDER BY pk DESC LIMIT 1`,
                [lead.leadPk, ct.expectedTemplate],
              );
              if (row && Number(row.pk) > queuePkBefore) {
                found = true;
                console.log(
                  `[${ct.id}] New email_queue row pk=${row.pk} (was ${queuePkBefore})`,
                );
                break;
              }
              await sleep(2000);
            }
            expect(
              found,
              `[CONFIRMADO] [${ct.id}] R-COMM-03 — API trigger produced no new uown_email_queue ` +
                `row in 30s for template=${ct.expectedTemplate}`,
            ).toBe(true);
          },
        );

        // 9. AC-2 — GCS-only image hosting (validated directly against
        //    uown_email_queue.email_body — bypasses IMAP)
        await test.step('[ac-2-gcs] all <img src> are on storage.googleapis.com/uown/', async () => {
          // Fetch the most recent queue row for this brand+lead
          const queueRow = await db.queryOne<{
            email_body: string | null;
            subject: string | null;
            from_email_address: string | null;
            to_email_addresses: string | null;
          }>(
            `SELECT email_body, subject, from_email_address, to_email_addresses
               FROM uown_email_queue
              WHERE lead_pk = $1 AND template_name = $2
              ORDER BY pk DESC LIMIT 1`,
            [lead.leadPk, ct.expectedTemplate],
          );
          expect(
            queueRow?.email_body,
            `[${ct.id}] no email_body persisted in uown_email_queue`,
          ).toBeTruthy();
          const html = queueRow!.email_body!;

          testInfo.annotations.push({
            type: 'subject',
            description: queueRow!.subject ?? '(null)',
          });
          testInfo.annotations.push({
            type: 'fromEmail',
            description: queueRow!.from_email_address ?? '(null)',
          });
          console.log(
            `[${ct.id}] queue row subject="${queueRow!.subject}" from="${queueRow!.from_email_address}" body_chars=${html.length}`,
          );

          // Extract all <img src=...>
          const imgSrcRegex = /<img\s[^>]*src="([^"]+)"/gi;
          const imgSrcs: string[] = [];
          let m: RegExpExecArray | null;
          while ((m = imgSrcRegex.exec(html)) !== null) {
            imgSrcs.push(m[1]);
          }
          testInfo.annotations.push({
            type: 'imgSrcs',
            description: imgSrcs.join(' | ').slice(0, 1200),
          });
          console.log(`[${ct.id}] img srcs (${imgSrcs.length}):`, imgSrcs);

          expect(
            imgSrcs.length,
            `[CONFIRMADO] [${ct.id}] AC-2 — email_body has zero <img> tags; ` +
              `template likely not rendered`,
          ).toBeGreaterThan(0);

          const gcsHostPrefix = /^https:\/\/storage\.googleapis\.com\/uown\//;
          const offenders = imgSrcs.filter((src) => !gcsHostPrefix.test(src));
          expect(
            offenders,
            `[CONFIRMADO] [${ct.id}] AC-2 — ALL <img src> must match ` +
              `storage.googleapis.com/uown/. External srcs found: ${offenders.join(' | ')}`,
          ).toEqual([]);

          // KS-specific: at least one asset under /kornerstone/ subpath
          if (ct.brand === 'KORNERSTONE') {
            const ksAssets = imgSrcs.filter((src) =>
              /storage\.googleapis\.com\/uown\/kornerstone\//i.test(src),
            );
            expect(
              ksAssets.length,
              `[CONFIRMADO] [${ct.id}] KS body must have at least one asset under ` +
                `/uown/kornerstone/; all srcs: ${imgSrcs.join(' | ')}`,
            ).toBeGreaterThan(0);
          }

          // From-header brand check
          const fromAddr = queueRow!.from_email_address ?? '';
          if (ct.brand === 'UOWN') {
            expect(
              /@uownleasing\.com/i.test(fromAddr),
              `[CONFIRMADO] [${ct.id}] UOWN from must match @uownleasing.com; got "${fromAddr}"`,
            ).toBe(true);
            expect(
              /@kornerstoneliving\.com/i.test(fromAddr),
              `[CONFIRMADO] [${ct.id}] §7.3 cross-contamination — UOWN from has KS domain: "${fromAddr}"`,
            ).toBe(false);
          } else {
            expect(
              /@(kornerstoneliving|uownleasing)\.com/i.test(fromAddr),
              `[CONFIRMADO] [${ct.id}] KS from must match KS or UOWN domain; got "${fromAddr}"`,
            ).toBe(true);
          }

          // Subject sanity
          const subject = queueRow!.subject ?? '';
          expect(
            /finalize|purchase|complete/i.test(subject),
            `[CONFIRMADO] [${ct.id}] subject must hint at Finalize Purchase; got "${subject}"`,
          ).toBe(true);

          // Brand text in body
          const brandTextRegex = ct.brand === 'KORNERSTONE' ? /kornerstone/i : /uown/i;
          expect(
            brandTextRegex.test(html),
            `[CONFIRMADO] [${ct.id}] body must contain ${brandTextRegex}; preview: ` +
              `"${html.replace(/\s+/g, ' ').slice(0, 200)}"`,
          ).toBe(true);

          // Cross-contamination
          if (ct.brand === 'UOWN') {
            expect(
              /CS@kornerstoneliving\.com|kornerstone_logo|Kornerstone Living/i.test(html),
              `[CONFIRMADO] [${ct.id}] UOWN body contains KS markers`,
            ).toBe(false);
          } else {
            expect(
              /CustomerService@uownleasing\.com|uown\.dev@uownleasing\.com|contact_img_uown/i.test(html),
              `[CONFIRMADO] [${ct.id}] KS body contains UOWN markers`,
            ).toBe(false);
          }

          // redirectUrl rendered (we just triggered with redirectUrl)
          expect(
            html.includes(redirectUrl),
            `[CONFIRMADO] [${ct.id}] redirectUrl "${redirectUrl}" not rendered in email_body`,
          ).toBe(true);
        });

        // 10. Evidence breadcrumb
        await testInfo.attach(`${ct.id}-evidence.json`, {
          contentType: 'application/json',
          body: Buffer.from(
            JSON.stringify(
              {
                ct: ct.id,
                brand: ct.brand,
                refMerchantCode: ct.refMerchantCode,
                leadPk: lead.leadPk,
                accountPk: lead.accountPk,
                applicantEmail: lead.email,
                merchantNumber: lead.merchantNumber,
                createdAt: lead.createdAt.toISOString(),
                expectedTemplate: ct.expectedTemplate,
                redirectUrl,
                manualLogCountBefore: logCountBefore,
                queuePkBefore,
              },
              null,
              2,
            ),
          ),
        });
      },
    );
  }
});
