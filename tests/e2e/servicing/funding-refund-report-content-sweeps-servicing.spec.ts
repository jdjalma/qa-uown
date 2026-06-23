/**
 * Daily Funding / Funded / Refund / Refunded Report Sweeps — Content Validation (delta over smoke)
 *
 * SPEC: docs/taskTestingUown/dailyFundingRefundReportSweeps_contentValidation/
 *       dailyFundingRefundReportSweeps_contentValidation.spec.md
 *
 * This file covers the API + DB CTs of the SPEC:
 *   - CT-01..04 — per-sweep mechanism + error-class (one row per sweep in uown_sweep_logs,
 *                 error classified provisioning vs environment vs product). A clean no-op
 *                 (processed=0, no error) is a PASS.
 *   - CT-05 (P0) — recipient-SQL correctness of dailyFundingReportSweep: read
 *                 `sql_to_pick_accounts` from uown_scheduled_task at RUNTIME (rule #16 — never
 *                 hard-code the SQL), execute it, and validate every selected merchant against
 *                 the eligibility guards independently.
 *   - CT-06 (IMAP, blocked) / CT-10 (Refunded content, blocked) — `test.fixme()` stubs with
 *                 the documented reason (see below). NOT implemented now per orchestrator scope.
 *
 * The Funding Queue UI-proxy CTs (CT-07/08/09 — Download CSV vs DB oracle) live in a SEPARATE
 * file under tests/e2e/origination/ because the Funding Queue (`/funding`) is an ORIGINATION
 * portal screen and needs the `.auth/origination.json` storageState. A spec in
 * tests/e2e/servicing/ runs in the `servicing-ui` project (servicing storageState/baseURL),
 * so the Origination-portal browser steps cannot live here. See:
 *   tests/e2e/origination/funding-refund-report-content-ui-origination.spec.ts
 * This split is forced by the project's portal-split rule (.claude/rules/testing.md) — the
 * Funding Queue is not a Servicing screen. The CTs below are API-only (rule #14 exception (a):
 * the report SWEEPS themselves are admin/ops with no UI affordance; the report ARTIFACT does
 * not pass through uown_email_queue / uown_correspondence_logs — only uown_sweep_logs is
 * observable — see SPEC Achado-chave 3).
 *
 * Test Data Hierarchy (rule #9): these CTs are READ-ONLY over the existing global funding
 * population + admin sweep triggers. NO fresh application is created and (critically) NO DB
 * mutation is performed. There is no application-creation path here, so merchant preflight
 * (rule #12) does NOT apply.
 *
 * Activity log (rule #13): the SPEC's Achado-chave 3 + Risk row "Activity log ausente" record
 * that report sweeps do NOT write a lead-note nor a correspondence_log — the only DB evidence
 * is uown_sweep_logs. We therefore validate the sweep_log row (mechanism) and DO NOT assert a
 * business activity log here (none is expected for a report-generation sweep). The IMAP CT-06
 * (blocked) carries the `@blocked-by-missing-log` escalation marker for the funding-report
 * EMAIL artifact, where rule #13 would apply if/when that path is exercised.
 *
 * P-1 (sweep_log async): `number_of_records_processed` is written AFTER processing — we NEVER
 * assert `processed >= 1` immediately after the trigger (SPEC pitfall P-1). Mechanism evidence
 * is the new sweep_log row (pk > baseline); content evidence is the derived DB oracle.
 *
 * Env: sandbox primary (SPEC §Test Strategy — pk30 dailyFundingReportSweep ACTIVE there).
 *   DB tunnel: SPEC + memory `sticky-refund-tests-sandbox-only` record 127.0.0.1:5445 LIVE,
 *   5446 STALE for sandbox. `.env`'s `UOWN_DB_URL_SBX` currently points at 5446 — if these CTs
 *   fail to connect, point ENV at the env whose tunnel is on 5445 (qa2 proxy) or correct the
 *   .env port. This is an environment-provisioning note for qa-validator, NOT a code change
 *   (shared config, not edited here).
 *
 * Run (sandbox): ENV=sandbox node node_modules/@playwright/test/cli.js test \
 *   tests/e2e/servicing/funding-refund-report-content-sweeps-servicing.spec.ts \
 *   --project=servicing-ui --reporter=list --timeout=300000
 */
import { test, expect } from '@support/base-test.js';
import {
  sweepLogBaseline,
  getSweepLogError,
  classifySweepError,
} from '@helpers/sweep-fixture.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// ── Sweep contract (case-sensitive — confirmed in the smoke spec + SPEC §DB) ──
const SWEEPS = {
  funding: 'dailyFundingReportSweep',
  funded: 'dailyFundedReportSweep',
  refund: 'dailyRefundReportSweep',
  refunded: 'dailyRefundedReportSweep',
} as const;

const TAGS = buildTags(TestTag.REGRESSION, TestTag.SANDBOX);

test.describe(
  'Daily Funding/Funded/Refund/Refunded Report Sweeps — content validation',
  { tag: splitTags(TAGS) },
  () => {
    // Serial: the four mechanism CTs each trigger a sweep; running them serially keeps the
    // per-sweep baseline window unambiguous on the shared sweep_log table.
    test.describe.configure({ mode: 'serial' });

    // ════════════════════════════════════════════════════════════════════════
    // CT-01..04 — per-sweep mechanism + error-class
    // ════════════════════════════════════════════════════════════════════════
    //
    // For each sweep: capture MAX(pk) baseline → trigger (HTTP 200) → poll for a NEW
    // sweep_log row (pk > baseline) → read + classify its `error`. A clean no-op
    // (processed=0, no error) is a PASS — that is the AC5 empty-report case.
    const MECHANISM_CASES: ReadonlyArray<{
      ct: string;
      sweep: string;
      /** dailyFundedReportSweep has NO uown_scheduled_task row but still logs (SPEC Achado 2). */
      expectNoScheduledTaskRow?: boolean;
    }> = [
      { ct: 'CT-01', sweep: SWEEPS.funding },
      { ct: 'CT-02', sweep: SWEEPS.funded, expectNoScheduledTaskRow: true },
      { ct: 'CT-03', sweep: SWEEPS.refund },
      { ct: 'CT-04', sweep: SWEEPS.refunded },
    ];

    for (const c of MECHANISM_CASES) {
      test(`${c.ct} — ${c.sweep}: trigger → new sweep_log row → error classified @servicing @sweep @regression`, async ({ api, db }) => {
        test.setTimeout(120_000);

        let baseline = 0;
        await test.step(`Capture sweep_log baseline for ${c.sweep}`, async () => {
          baseline = await sweepLogBaseline(db, c.sweep);
          console.log(`[${c.ct}] baseline pk=${baseline} for ${c.sweep}`);
        });

        // Edge (CT-02): dailyFundedReportSweep is NOT registered in uown_scheduled_task but
        // the handler still runs & logs (SPEC Achado-chave 2). Assert the absence explicitly
        // so a future regression that adds/removes the row is observable.
        if (c.expectNoScheduledTaskRow) {
          await test.step(`${c.sweep} has NO uown_scheduled_task row (SPEC Achado 2)`, async () => {
            const taskRows = await db.getSingleNumber(
              `SELECT COUNT(*) FROM uown_scheduled_task WHERE scheduled_task_name = $1`,
              [c.sweep],
            );
            if (taskRows > 0) {
              test.info().annotations.push({
                type: 'observation',
                description:
                  `[OBSERVAÇÃO] ${c.ct} — ${c.sweep} now HAS ${taskRows} uown_scheduled_task row(s); ` +
                  'SPEC Achado-chave 2 (Java-only selector, no task row) may be stale — verify.',
              });
            } else {
              console.log(`[${c.ct}] confirmed: ${c.sweep} has no uown_scheduled_task row (Java-only selector)`);
            }
          });
        }

        let newRowExists = false;
        await test.step(`Trigger ${c.sweep} (HTTP 200) and poll for a new sweep_log row`, async () => {
          const resp = await api.scheduledTask.triggerScheduledTask(c.sweep);
          expect(resp.status, `triggerScheduledTask ${c.sweep} must return 200`).toBe(200);
          // Report sweeps are slow (file/email generation) — 60s window, pk-monotonic (P-1 safe).
          newRowExists = await db.waitForRecord(
            'uown_sweep_logs',
            'sweep_name = $1 AND pk > $2',
            [c.sweep, baseline],
            60_000,
          );
        });

        await test.step(`Assert mechanism: a fresh sweep_log row exists for ${c.sweep}`, async () => {
          expect(
            newRowExists,
            `${c.sweep} must produce a fresh uown_sweep_logs row (pk > ${baseline}) within 60s ` +
              '(slow file/email generation — bump window if env is loaded, but the trigger was accepted)',
          ).toBe(true);
        });

        await test.step(`Classify the sweep_log error for ${c.sweep} (provisioning vs environment vs product)`, async () => {
          const err = await getSweepLogError(db, c.sweep, baseline);
          const kind = classifySweepError(err);
          console.log(`[${c.ct}] ${c.sweep} error-class=${kind}${err ? ` :: ${err.slice(0, 120)}` : ' (clean no-op)'}`);

          if (kind === 'product') {
            // A genuine code-level exception not explained by missing infra. Surface as an
            // observation for dev (conservative classification, rule #10) — do not fail the
            // mechanism CT on it; the validator decides escalation.
            test.info().annotations.push({
              type: 'observation',
              description: `[OBSERVAÇÃO — possible product issue] ${c.sweep}: ${err.slice(0, 200)}`,
            });
          } else if (kind === 'provisioning') {
            test.info().annotations.push({
              type: 'observation',
              description: `[PROVISIONING GAP] ${c.sweep}: ${err.slice(0, 200)} (validate in stg)`,
            });
          }

          // AC1 + AC5: the sweep must NOT carry a genuine product exception. A clean no-op,
          // an environment gap, or a provisioning gap are all acceptable mechanism outcomes
          // in a lower env (the row existing already proved the SQL ran to completion).
          expect(
            kind,
            `${c.sweep} sweep_log error is a product-level exception (not infra/no-op): ${err.slice(0, 200)}`,
          ).not.toBe('product');
        });
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    // CT-05 (P0) — recipient-SQL correctness of dailyFundingReportSweep
    // ════════════════════════════════════════════════════════════════════════
    //
    // Read `sql_to_pick_accounts` from uown_scheduled_task at RUNTIME (rule #16 — the SQL is
    // editable via an admin endpoint; never hard-code the text), execute it to get the set of
    // recipient merchant PKs, then validate EVERY returned merchant independently against the
    // eligibility guards. Drift of the SQL away from the documented snapshot → [OBSERVAÇÃO],
    // never a blind failure (categoria volatile #2).
    test('CT-05 — dailyFundingReportSweep recipient-SQL correctness (runtime SQL, self-validating) @servicing @sweep @recipient @critical', async ({ db }) => {
      test.setTimeout(120_000);

      let pickSql = '';
      await test.step('Read sql_to_pick_accounts from uown_scheduled_task at runtime (the ACTIVE row, not the cron-2099 disabled clone)', async () => {
        // SPEC §DB: pk30 is ACTIVE (cron '0 0 0 * * ?'); pk44 is disabled (cron contains 2099).
        // Select the active row by excluding the 2099-disabled clone — never by PK (drift-prone).
        const row = await db.queryOne<{ sql_to_pick_accounts: string | null; cron_trigger: string | null }>(
          `SELECT sql_to_pick_accounts, cron_trigger
             FROM uown_scheduled_task
            WHERE scheduled_task_name = $1
              AND COALESCE(cron_trigger, '') NOT LIKE '%2099%'
            ORDER BY pk ASC
            LIMIT 1`,
          [SWEEPS.funding],
        );
        pickSql = String(row?.sql_to_pick_accounts ?? '').trim();
        console.log(`[CT-05] active dailyFundingReportSweep cron='${row?.cron_trigger ?? '(none)'}'`);
        expect(
          pickSql.length,
          'dailyFundingReportSweep must have a non-empty sql_to_pick_accounts (ACTIVE, non-2099 row)',
        ).toBeGreaterThan(0);
      });

      // Drift guard (rule #16, volatile cat. #2): the recipient SQL is a recipient SELECTOR —
      // it must select merchants, gate on send_automated_funding_report, funding_report_frequency
      // LIKE DAILY, an email, and a yesterday-funded transaction. We assert the SHAPE (these
      // guards are present) rather than byte-equality with the snapshot, so a cosmetic edit does
      // not fail the CT but a structural drift (a guard removed) is surfaced.
      await test.step('Drift guard: the runtime SQL still contains the recipient-eligibility guards', async () => {
        const sql = pickSql.toLowerCase();
        const guards: ReadonlyArray<{ label: string; present: boolean }> = [
          { label: 'send_automated_funding_report', present: sql.includes('send_automated_funding_report') },
          { label: 'funding_report_frequency LIKE %DAILY%', present: /funding_report_frequency\s+like\s+'%daily%'/.test(sql) },
          { label: 'email presence (primary_contact_email / funding_report_emails)', present: sql.includes('primary_contact_email') || sql.includes('funding_report_emails') },
          { label: 'yesterday window (current_date - 1)', present: /current_date\s*-\s*1/.test(sql) },
          { label: 'fully_funded', present: sql.includes('fully_funded') },
        ];
        const missing = guards.filter(g => !g.present).map(g => g.label);
        if (missing.length > 0) {
          test.info().annotations.push({
            type: 'observation',
            description:
              `[OBSERVAÇÃO] CT-05 — recipient SQL drifted: missing guard(s) [${missing.join('; ')}]. ` +
              'Verify the dailyFundingReportSweep selector against the SPEC snapshot before treating as a bug ' +
              '(categoria volatile #2 — SQL editable via admin endpoint).',
          });
        }
        // Only the two structurally load-bearing guards are hard-asserted (their absence would
        // make the recipient set meaningless); the rest are observation-only to tolerate edits.
        expect(
          guards.find(g => g.label.startsWith('send_automated'))!.present,
          'recipient SQL must gate on send_automated_funding_report',
        ).toBe(true);
        expect(
          guards.find(g => g.label.startsWith('funding_report_frequency'))!.present,
          "recipient SQL must gate on funding_report_frequency LIKE '%DAILY%'",
        ).toBe(true);
      });

      let recipientPks: number[] = [];
      await test.step('Execute the runtime recipient SQL → set of selected merchant PKs', async () => {
        // The SQL is a SELECT-only recipient selector (read-only — no mutation). Wrap as a
        // subquery so we get a clean single `pk` column regardless of the inner projection.
        const rows = await db.query<{ pk: string }>(
          `SELECT pk FROM ( ${pickSql} ) AS recipients`,
          [],
        );
        recipientPks = rows.map(r => Number(r.pk)).filter(n => !Number.isNaN(n));
        console.log(`[CT-05] recipient SQL selected ${recipientPks.length} merchant(s)`);

        if (recipientPks.length === 0) {
          // SPEC Achado-chave 5: 0 FULLY_FUNDED txns dated yesterday in sandbox → the recipient
          // set is legitimately empty (the report would go out empty / be suppressed). This is
          // AC5 (clean empty), NOT a failure. Record it and skip the per-merchant validation.
          test.info().annotations.push({
            type: 'observation',
            description:
              '[OBSERVAÇÃO] CT-05 — recipient set is EMPTY: no merchant has a FULLY_FUNDED ' +
              'transaction dated CURRENT_DATE-1 (SPEC Achado-chave 5 — expected in sandbox without ' +
              'a funded-yesterday seed). The selector is structurally valid (drift guard above); ' +
              'per-merchant eligibility is vacuously satisfied. Re-run after a funded-yesterday ' +
              'lease exists (CT-06 setup) to exercise the non-empty path.',
          });
        }
      });

      await test.step('Validate EVERY selected merchant satisfies the eligibility guards independently', async () => {
        if (recipientPks.length === 0) {
          test.skip(true, 'Empty recipient set (AC5 empty-report) — per-merchant checks vacuously hold.');
          return;
        }
        // Independent re-derivation (not the same SQL text): assert each selected merchant
        // really has the report flags AND a yesterday-funded transaction. Catches a selector
        // that returns merchants it should not.
        const offenders: string[] = [];
        for (const mpk of recipientPks) {
          const m = await db.queryOne<{
            send_automated_funding_report: boolean | null;
            funding_report_frequency: string | null;
            primary_contact_email: string | null;
            funding_report_emails: string | null;
            is_active: boolean | null;
          }>(
            `SELECT send_automated_funding_report, funding_report_frequency,
                    primary_contact_email, funding_report_emails, is_active
               FROM uown_merchant WHERE pk = $1`,
            [mpk],
          );
          const hasEmail = !!(m?.primary_contact_email || m?.funding_report_emails);
          const freqOk = /DAILY/i.test(String(m?.funding_report_frequency ?? ''));
          const fundedYesterday = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_funding_transaction t
              WHERE t.merchant_pk = $1
                AND t.funding_status = 'FULLY_FUNDED'
                AND t.fund_date_time IS NOT NULL
                AND date(t.fund_date_time) = CURRENT_DATE - 1`,
            [mpk],
          );
          const reasons: string[] = [];
          if (m?.send_automated_funding_report !== true) reasons.push('send_automated_funding_report!=true');
          if (!freqOk) reasons.push(`frequency='${m?.funding_report_frequency ?? '(null)'}' lacks DAILY`);
          if (!hasEmail) reasons.push('no email on file');
          if (m?.is_active === false) reasons.push('merchant inactive');
          if (fundedYesterday < 1) reasons.push('no FULLY_FUNDED txn dated CURRENT_DATE-1');
          if (reasons.length > 0) offenders.push(`merchant ${mpk}: ${reasons.join(', ')}`);
        }
        expect(
          offenders,
          `every recipient must satisfy all eligibility guards; offenders: ${offenders.join(' | ')}`,
        ).toEqual([]);
        console.log(`[CT-05] all ${recipientPks.length} recipient merchant(s) satisfy the eligibility guards`);
      });
    });

    // ════════════════════════════════════════════════════════════════════════
    // CT-06 (BLOCKED) — Funding report EMAIL artifact via IMAP (TireAgent)
    // ════════════════════════════════════════════════════════════════════════
    //
    // BLOCKED — not implemented now (orchestrator scope). Requires a lease FUNDED YESTERDAY for
    // TireAgent (OW90218-0001 → fintechgroup777 inbox) so the daily funding report is non-empty.
    // SPEC Achado-chave 5: sandbox has 0 FULLY_FUNDED txns dated CURRENT_DATE-1. Driving a fresh
    // lease to FUNDED does NOT produce a `fund_date_time` of YESTERDAY natively, so reaching the
    // non-empty path likely needs Exception 3 (UPDATE fund_date_time = CURRENT_DATE-1 on the
    // fresh txn) — which is NOT authorized (CLAUDE.md Exception 2 / security rule). Open SPEC
    // questions Q1/Q6 must be resolved by the user/PO first.
    //
    // Activity log (rule #13): the funding-report EMAIL artifact would be the business action
    // here; the SPEC hypothesises NO correspondence/lead-note log is written for it. The assert
    // below is intentionally retained behind `@blocked-by-missing-log` and must NOT be silently
    // dropped — escalate to dev if/when this path is exercised (SPEC Risk "Activity log ausente").
    test.fixme(
      'CT-06 — funding report email artifact via IMAP for TireAgent (funded-yesterday) @servicing @sweep @imap @blocked-by-missing-log @critical',
      async () => {
        // INTENTIONALLY UNIMPLEMENTED — see block comment above.
        // Pending: (a) user authorization for Exception 3 (UPDATE fund_date_time on the fresh
        //          test txn), or a native path that yields a CURRENT_DATE-1 fund date;
        //          (b) SPEC Q1 (canonical Funded criteria) + Q6 (Exception 3 approval).
        // When unblocked: drive fresh lease (TireAgent OW90218-0001) → FUNDED → fund_date_time
        //   = CURRENT_DATE-1 → trigger dailyFundingReportSweep → snapshot fintechgroup777 inbox
        //   UID → poll for the funding-report email → assert it references the funded lease
        //   (customer_name / invoice_amount from the DB oracle). Then validate (or escalate the
        //   ABSENCE of) the activity/correspondence log for the email dispatch (rule #13).
      },
    );

    // ════════════════════════════════════════════════════════════════════════
    // CT-10 (BLOCKED) — Refunded report content
    // ════════════════════════════════════════════════════════════════════════
    //
    // BLOCKED — environment data limitation (NOT a code gap). SPEC Achado-chave 5 +
    // §Níveis: `refunded_date_time` is populated on 0 transactions in sandbox; there is no
    // completed REFUNDED transaction to observe. A completed refund only runs in sandbox via a
    // RECOVERED sticky session + inbound webhook (memory `sticky-refund-tests-sandbox-only`) and
    // would require a dedicated seed. The Refunded report content is therefore not verifiable
    // without that seed — documented as an environment limitation, not a test failure.
    test.fixme(
      'CT-10 — Refunded report content vs DB oracle @servicing @sweep @refunded @env-limitation',
      async () => {
        // INTENTIONALLY UNIMPLEMENTED — 0 rows with refunded_date_time in sandbox.
        // Unblock requires a completed-refund seed (RECOVERED sticky session + inbound webhook,
        // sandbox-only per memory `sticky-refund-tests-sandbox-only`). The CT-04 mechanism check
        // above already proves dailyRefundedReportSweep triggers & logs cleanly on empty data.
      },
    );
  },
);
