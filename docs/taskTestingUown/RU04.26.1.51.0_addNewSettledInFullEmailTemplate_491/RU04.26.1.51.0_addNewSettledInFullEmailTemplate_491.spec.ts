/**
 * RU04.26.1.51.0_addNewSettledInFullEmailTemplate_491
 *
 * Task #491 — Settled In Full email template (UOWN + Kornerstone).
 * Pipeline: new-api (API + DB + IMAP — no UI).
 *
 * Env: qa2
 * Inbox: fintechgroup777@gmail.com (env EMAIL)
 * Project: task-testing
 *
 * ═══════════════════════════════════════════════════════════════════════
 * TEST DATA HIERARCHY — COMPLIANT
 * ═══════════════════════════════════════════════════════════════════════
 * CT-01 e CT-02 agora seguem o modo PADRÃO da hierarquia (`.claude/rules/
 * testing.md § Test Data Hierarchy`): CADA EXECUÇÃO CRIA UMA CONTA FRESH via
 * fluxo API completo — sendApplication → submitApplication → settleApplication
 * → FUNDED → SETTLEMENT CC arrangement → SETTLED_IN_FULL.
 *
 * Por que fresh?
 *   Runs anteriores com fixtures sintéticas (smoke + UPDATE manual) falhavam
 *   no JOIN do template SQL (`settled-in-full.sql`, 5 INNER JOINs) porque
 *   `uown_sv_payment` com status='PAID' nunca foi populado. O listener de
 *   SETTLEMENT só grava o PAID quando o arrangement CC chega a SUCCESS via
 *   fluxo real. O resultado é `"No data associated with correspondence
 *   request"` em uown_correspondence_logs e zero enfileiramento.
 *
 * Janela temporal (CONSTRAINT INERENTE):
 *   O sweep `settledInFullAccountEmailSweep` exige:
 *     DOW 1/2 → DATE(settled_in_full_date_time) = CURRENT_DATE − 4
 *     DOW 3   → DATE(...) IN (CURRENT_DATE − 4, −3, −2)
 *     DOW 4/5 → DATE(...) = CURRENT_DATE − 2
 *
 *   Conta fresh quitada hoje tem `settled_in_full_date_time = HOJE` — fora
 *   da janela. O step preflight (mantido do refactor anterior) LOGA um
 *   UPDATE autorizado pro user executar manualmente ajustando a data para a
 *   janela DOW, depois faz polling a cada 10s por até 10min aguardando.
 *
 * Demais CTs:
 *   - CT-03 lê o body via IMAP — depende apenas de CT-01/02 terem emitido.
 *   - CT-04 / CT-05 / CT-06 continuam a reusar fixtures pré-existentes pois:
 *       * rating E/F/U (CT-04) é COMPUTADO pelo sistema baseado em histórico
 *         — não forçável via automação em runtime;
 *       * ACTIVE (CT-06) só requer uma conta funded qualquer no ambiente;
 *       * do_not_email (CT-05) muda o bit por API mas o restante do estado
 *         ainda precisa ser SETTLED_IN_FULL elegível — reuso é mais rápido.
 *     Estas exceções estão justificadas na hierarquia.
 *   - CT-07 é contratual (GET endpoint) — independente de fixtures.
 *   - CT-08 e CT-09 reusam o `uownAccountPk` / `uownEmailContent` estabelecidos
 *     por CT-01 dentro do mesmo `describe.serial('UOWN flow')`.
 *
 * ───────────────────────────────────────────────────────────────────────
 * PREFLIGHT PROTOCOL (CT-01 + CT-02)
 * ───────────────────────────────────────────────────────────────────────
 * Depois do drive fresh, `settled_in_full_date_time = HOJE`. O step preflight
 * roda `checkTemplateQueryReturnsData`. Se já estiver dentro da janela
 * (caso raro: o drive for executado num dia em que HOJE coincide), segue.
 * Senão, LOGA o UPDATE autorizado pro user executar em outro terminal e faz
 * polling até a query do template voltar TRUE E `settled_in_full_date_time`
 * bater com `getSweepWindowDate()`. Timeout 10min → `test.skip`.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * CT-01  Happy path UOWN — fresh account + sweep dispatches email
 * CT-02  Happy path Kornerstone — fresh account + brand-aware sender + template
 * CT-03  GCS images only — no external image hosts
 * CT-04  Eligibility: rating E/F/U blocks enqueue (fixture reuse)
 * CT-05  Eligibility: do_not_email=true blocks enqueue (fixture reuse)
 * CT-06  Eligibility: ACTIVE status blocks enqueue (fixture reuse)
 * CT-07  Inspection endpoint — cron + query contract
 * CT-08  Correspondence log audit (reuses CT-01 account)
 * CT-09  Dynamic data rendered (reuses CT-01 account + email body)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { sleep } from '@helpers/common.helpers.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import {
  createPreQualifiedApplication,
  driveLeadToFunding,
} from '@helpers/api-setup.helpers.js';
import { buildCcArrangementBody } from '@api/bodies/payment-arrangement.body.js';
import { calculateDateISO } from '@helpers/date.helpers.js';
import { TEST_CARDS, TEST_BANK } from '@config/constants.js';
import type { TestContext } from '@support/base-test.js';
import {
  findEligibleSettledInFullAccount,
  findIneligibleSettledInFullAccount,
  waitForEmailQueueRecord,
  waitForEmailQueueDispatched,
  waitForCorrespondenceLog,
  getCorrespondenceLog,
  countEmailQueueRows,
  countCorrespondenceLogs,
  checkTemplateQueryReturnsData,
  getSweepWindowDate,
  waitForFixtureReady,
  type EligibleAccount,
  type EmailQueueRow,
  type CorrespondenceLogRow,
} from '@helpers/settled-in-full.helpers.js';
import type { EmailContent } from '@helpers/email.helpers.js';

// ── Constants ────────────────────────────────────────────────────────

const TEST_NAME = 'RU04.26.1.51.0_addNewSettledInFullEmailTemplate_491';
const INBOX = 'fintechgroup777@gmail.com';
const SWEEP_TASK = 'settledInFullAccountEmailSweep';
const UOWN_TEMPLATE = 'SettledInFullEmail';
const KS_TEMPLATE = 'KORNERSTONE_SettledInFullEmail';
const UOWN_FROM = 'CustomerService@uownleasing.com';
const KS_FROM = 'CS@kornerstoneliving.com';
// reason: real subject of the SettledInFullEmail template is unknown ahead of
// dispatch; widen to cover variants like "settled in full", "paid in full",
// "settling your account", "fully paid". Probe logs subjects on miss.
const SUBJECT_RE = /(settled|settling|paid|payoff).{0,60}(in.{0,5}full|fully|account)/i;
// reason: run17 surfaced that the sweep enqueues every eligible account each
// trigger — fixtures from prior runs coexist with the fresh one and may land
// in the inbox at the same envelope second, causing a tie where the latest-
// date selector returns the wrong brand's body. Scope by account number
// (template includes "Account #<pk>" in the subject).
const subjectReForAccount = (accountPk: number): RegExp =>
  new RegExp(`(settled|settling|paid|payoff).{0,60}account.{0,5}#\\s*${accountPk}\\b`, 'i');
const SWEEP_SETTLE_MS = 15_000;

// reason: sweep cron is MON-FRI; if we run on Sat/Sun the job does nothing
function isWeekendUtc(): boolean {
  const dow = new Date().getUTCDay();
  return dow === 0 || dow === 6;
}

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env: 'qa2',
    tagCritical: buildTags(TestTag.CICD, TestTag.QA2, TestTag.REGRESSION, TestTag.CRITICAL),
    tagRegression: buildTags(TestTag.CICD, TestTag.QA2, TestTag.REGRESSION),
  },
  {
    env: 'stg',
    tagCritical: buildTags(TestTag.CICD, TestTag.STG, TestTag.REGRESSION, TestTag.CRITICAL),
    tagRegression: buildTags(TestTag.CICD, TestTag.STG, TestTag.REGRESSION),
  },
];

// ── Tests ────────────────────────────────────────────────────────────

for (const data of testData) {
  test.describe(
    `${TEST_NAME} - ${data.env}`,
    { tag: splitTags(data.tagRegression) },
    () => {
      test.use({ envName: data.env });

      // ═══════════════════════════════════════════════════════════════
      // UOWN serial flow — CT-01 → CT-08 → CT-09 share the same account
      // ═══════════════════════════════════════════════════════════════

      test.describe.serial('UOWN flow', () => {
        let uownAccountPk = 0;
        let uownCustomerPk = 0;
        let uownAccount: EligibleAccount | null = null;
        let uownEmailContent: EmailContent | null = null;

        test(
          'CT-01 Happy path UOWN — fresh drive + sweep dispatches SettledInFullEmail',
          { tag: splitTags(data.tagCritical) },
          async ({ api, db, email }) => {
            test.setTimeout(720_000);

            if (isWeekendUtc()) {
              test.skip(true, 'sweep cron excludes weekends (MON-FRI)');
            }

            // reason: Test Data Hierarchy — PADRÃO mode. Criar conta fresh via
            // full drive (sendApplication → submit → settle → FUNDED → SETTLEMENT
            // CC arrangement → SETTLED_IN_FULL). Elimina dependência de fixtures
            // sintéticas que falhavam no JOIN de uown_sv_payment(PAID).
            let uownFirstName = '';
            // reason: email applicant DEVE ser único por run — evita DataMismatchStep
            // no UW (mesmo SSN/email reusado → denial antes do GDS). O primary email
            // da conta é trocado para INBOX via createOrUpdateEmail APÓS o drive.
            const uownTd = buildTestData({
              env: data.env,
              state: 'CA',
              merchant: 'TireAgent',
              orderTotal: '1000',
            });
            const uownCtx: TestContext = {
              leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
              contractStatus: '', contractUrl: '', websiteAccountPk: '', achAdded: 0, ccAdded: 0,
              reportKeys: new Map<string, string>(),
            };

            await test.step('setup: create pre-qualified UOWN application (sendApplication → submit)', async () => {
              uownFirstName = uownTd.applicant.firstName;
              await createPreQualifiedApplication(
                api,
                uownTd.merchant,
                uownTd.applicant,
                uownCtx,
                { submitPaymentInfoViaApi: true },
              );
              console.log(`[CT-01] leadPk=${uownCtx.leadPk}`);
              console.log(`[CT-01] leadUuid=${uownCtx.leadUuid}`);
            });

            await test.step('setup: drive lead SIGNED → SETTLED → FUNDING', async () => {
              await driveLeadToFunding(api, uownTd.merchant, uownCtx);
              await sleep(2_000);
              const fundedResp = await api.lead.updateFundingStatus([Number(uownCtx.leadPk)], 'FUNDED');
              expect(fundedResp.ok, `updateFundingStatus FUNDED: ${fundedResp.status}`).toBeTruthy();
              console.log(`[CT-01] settlementStatus=FUNDED`);
            });

            await test.step('setup: wait for SVC account created + ACTIVE', async () => {
              const acctPk = await db.waitForAccountByLeadPk(uownCtx.leadPk, 60_000);
              expect(acctPk, `SVC account not created for leadPk=${uownCtx.leadPk}`).toBeTruthy();
              uownCtx.accountPk = acctPk!;
              uownAccountPk = Number(acctPk);
              const reachedActive = await db.waitForAccountStatus(uownCtx.accountPk, 'ACTIVE', 180_000);
              expect(reachedActive, `account ${uownAccountPk} never reached ACTIVE`).toBe(true);
              const cust = await db.queryOne<{ pk: string | number }>(
                `SELECT pk FROM uown_sv_customer WHERE account_pk = $1 AND customer_type = 'PRIMARY'`,
                [uownAccountPk],
              );
              uownCustomerPk = Number(cust?.pk ?? 0);
              uownAccount = {
                accountPk: uownAccountPk,
                customerPk: uownCustomerPk,
                firstName: uownFirstName,
                lastName: uownTd.applicant.lastName,
                accountStatus: 'ACTIVE',
                rating: null,
                company: 'UOWN',
                settledInFullDateTime: null,
              };
              console.log(`[CT-01] accountPk=${uownAccountPk}`);
              console.log(`[CT-01] customerPk=${uownCustomerPk}`);
            });

            await test.step('setup: create SETTLEMENT CC arrangement → SETTLED_IN_FULL', async () => {
              // KNOWN BUG (see application-lifecycle-protocol.md § Pitfall #11):
              // /uown/svc/makeCreditCardPayments returns HTTP 500
              // `fk_uown_cc_transaction_arrangement` ConstraintViolation for every
              // fresh account in qa2 (reproducible via UI). Workaround attempts
              // (pre-tokenize + useCardOnFile=true) did NOT bypass the bug.
              // Keeping the original call here so the failure surfaces clearly
              // when the backend is fixed — the assertion will start passing.
              const body = buildCcArrangementBody({
                accountPk: uownAccountPk,
                arrangementType: 'SETTLEMENT',
                ccNumber: TEST_CARDS.MASTERCARD_APPROVED.number,
                ccExp: TEST_CARDS.MASTERCARD_APPROVED.expirationDate,
                cvc: TEST_CARDS.MASTERCARD_APPROVED.cvv,
                installments: [{ amount: '100', date: calculateDateISO(0) }],
              });
              const res = await api.paymentArrangement.makeCreditCardPayments(body);
              expect(res.ok, `makeCreditCardPayments: ${res.status} — ${JSON.stringify(res.body)}`).toBeTruthy();

              const arrangement = await db.getPaymentArrangement(uownCtx.accountPk);
              const arrangementPk = String(arrangement?.pk ?? '');
              console.log(`[CT-01] arrangementPk=${arrangementPk}`);
              expect(arrangementPk, 'no payment arrangement row found').toBeTruthy();

              const arrangementSuccess = await db.waitForPaymentArrangementStatus(uownCtx.accountPk, 'SUCCESS', 60_000);
              expect(arrangementSuccess, 'arrangement never reached SUCCESS').toBe(true);

              // SETTLEMENT listener transitions account to SETTLED_IN_FULL + writes uown_sv_payment(PAID)
              const reachedSif = await db.waitForAccountStatus(uownCtx.accountPk, 'SETTLED_IN_FULL', 60_000);
              expect(reachedSif, `account ${uownAccountPk} never reached SETTLED_IN_FULL`).toBe(true);
              console.log(`[CT-01] settlementStatus=SETTLED_IN_FULL`);
            });

            let emailPk = 0;
            await test.step('setup: read current primary email', async () => {
              const res = await api.svcEmail.getContactInfo(uownAccountPk);
              expect(res.ok).toBeTruthy();
              expect(res.status).toBe(200);
              const primary = res.body?.emailList?.find(
                (e) => e.emailInfo?.emailType === 'PRIMARY',
              );
              expect(primary, 'PRIMARY email entry not found').toBeDefined();
              emailPk = primary!.emailInfo.emailPK;
              console.log(`[CT-01] emailPk=${emailPk}`);
            });

            await test.step('setup: update primary email to inbox (doNotEmail=false)', async () => {
              const res = await api.svcEmail.createOrUpdateEmail({
                emailPK: emailPk,
                customerPK: uownCustomerPk,
                emailAddress: INBOX,
                emailType: 'PRIMARY',
                doNotEmail: false,
              });
              expect(res.ok).toBeTruthy();
              expect(res.status).toBe(200);
            });

            await test.step('setup: confirm DB reflects primary email', async () => {
              const row = await db.queryOne<{ email_address: string; do_not_email: boolean }>(
                `SELECT email_address, do_not_email FROM uown_sv_email WHERE pk = $1`,
                [emailPk],
              );
              expect(row?.email_address).toBe(INBOX);
              expect(row?.do_not_email).toBe(false);
            });

            await test.step('preflight: temporal adjustment to sweep DOW window', async () => {
              const targetDate = getSweepWindowDate();
              const sifDateMatches = async (): Promise<boolean> => {
                const row = await db.queryOne<{ sif_date: string }>(
                  `SELECT TO_CHAR(settled_in_full_date_time::date, 'YYYY-MM-DD') AS sif_date
                     FROM uown_sv_account WHERE pk = $1`,
                  [uownAccountPk],
                );
                return row?.sif_date === targetDate;
              };

              const templateReady = await checkTemplateQueryReturnsData(db, uownAccountPk);
              const dateReady = await sifDateMatches();
              if (templateReady && dateReady) {
                console.log(`[CT-01] fixture ready — sif_date=${targetDate} and template SQL returns data`);
                return;
              }

              console.log(`[CT-01] 🔐 TEMPORAL ADJUSTMENT REQUIRED`);
              console.log(`[CT-01] Account ${uownAccountPk} foi criada e quitada com sucesso.`);
              console.log(`[CT-01] sif_date atual = HOJE. Sweep exige = ${targetDate} (CURRENT_DATE-4 para DOW 1/2, -2 para DOW 4/5).`);
              console.log(`[CT-01] Autorize: UPDATE uown_sv_account SET settled_in_full_date_time='${targetDate} 10:00:00' WHERE pk=${uownAccountPk};`);
              console.log(`[CT-01] Polling a cada 10s, timeout 10min...`);

              const start = Date.now();
              let ok = false;
              while (Date.now() - start < 600_000) {
                const t = await checkTemplateQueryReturnsData(db, uownAccountPk);
                const d = await sifDateMatches();
                if (t && d) { ok = true; break; }
                await sleep(10_000);
              }
              if (!ok) {
                // mantém compatibilidade com o helper existente como fallback final
                ok = await waitForFixtureReady(db, uownAccountPk, 10_000);
              }
              if (!ok) {
                test.skip(true, 'temporal adjustment not completed in 10min');
                return;
              }
              console.log(`[CT-01] fixture ready — proceeding with sweep`);
            });

            let baselineQueue = 0;
            let baselineLogs = 0;
            await test.step('baseline: snapshot queue + log counts', async () => {
              baselineQueue = await countEmailQueueRows(db, uownAccountPk);
              baselineLogs = await countCorrespondenceLogs(db, uownAccountPk, '%SettledInFull%');
            });

            await test.step(`action: trigger ${SWEEP_TASK}`, async () => {
              const res = await api.scheduledTask.triggerScheduledTask(SWEEP_TASK);
              console.log(`[CT-01] triggerResponse=${res.status}`);
              expect(res.ok).toBeTruthy();
              expect(res.status).toBe(200);
            });

            let queueRow: EmailQueueRow | null = null;
            await test.step('verify: email_queue row enqueued [reflex §13: email log]', async () => {
              queueRow = await waitForEmailQueueRecord(
                db,
                INBOX,
                uownAccountPk,
                UOWN_TEMPLATE,
                60_000,
              );
              console.log(`[CT-01] emailQueueRowFound=${queueRow !== null}`);
              if (!queueRow) {
                // reason: diagnostic chain.
                //  (a) is_active=false → Quartz not registered
                //  (b) latest correspondence_logs.error surfaces service-side
                //      failures (e.g. "No data associated with correspondence
                //      request") that write a log row but never enqueue.
                const taskRow = await db.queryOne<{ is_active: boolean | null; last_trigger_time: Date | null }>(
                  `SELECT is_active, last_trigger_time FROM uown_scheduled_task WHERE scheduled_task_name = $1`,
                  [SWEEP_TASK],
                );
                console.log(`[CT-01] diag: uown_scheduled_task.is_active=${taskRow?.is_active}, last_trigger_time=${taskRow?.last_trigger_time?.toISOString?.() ?? 'null'}`);
                const errLog = await db.queryOne<{ error: string | null; data_map: string | null; row_created_timestamp: Date }>(
                  `SELECT error, data_map, row_created_timestamp FROM uown_correspondence_logs
                    WHERE account_pk = $1 AND template_name = $2
                    ORDER BY row_created_timestamp DESC LIMIT 1`,
                  [uownAccountPk, UOWN_TEMPLATE],
                );
                console.log(`[CT-01] diag: correspondence_logs.error=${JSON.stringify(errLog?.error)}`);
                console.log(`[CT-01] diag: correspondence_logs.data_map=${errLog?.data_map}`);
                console.log(`[CT-01] diag: correspondence_logs.created=${errLog?.row_created_timestamp?.toISOString?.() ?? 'null'}`);
                if ((errLog?.error ?? '').includes('No data associated with correspondence request')) {
                  console.log(`[CT-01] CLASSIFICATION: application bug — sweep resolves account but fails to build template data (empty data_map). Log row written, queue row skipped. NOT a test bug.`);
                }
              }
              expect(queueRow, 'email_queue row not found').not.toBeNull();
              expect(queueRow!.toEmail).toBe(INBOX);
              expect(queueRow!.accountPk).toBe(uownAccountPk);
              expect(queueRow!.templateName ?? '').toContain(UOWN_TEMPLATE);
              expect(['PENDING', 'STORED', 'SENT', 'QUEUED', 'DELIVERED']).toContain(queueRow!.status ?? '');
              const afterCount = await countEmailQueueRows(db, uownAccountPk);
              expect(afterCount).toBeGreaterThan(baselineQueue);
              console.log(`[CT-01] templateName=${queueRow!.templateName}`);
            });

            // reason: settledInFullAccountEmailSweep only ENQUEUES rows in
            // uown_email_queue with status='PENDING'. The actual dispatch to
            // SendGrid happens in a separate worker (emailSweep). Without this
            // explicit trigger, the row stays PENDING and IMAP never sees the
            // email. Status flips to 'STORED' (qa2 enum) once sent_time is
            // populated — that is our true "delivered" signal.
            await test.step('action: trigger emailSweep to dispatch PENDING row', async () => {
              await sleep(SWEEP_SETTLE_MS);
              const res = await api.scheduledTask.sendEmailsSweep();
              console.log(`[CT-01] emailSweepTriggered=${res.status}`);
              expect(res.ok).toBeTruthy();
            });

            await test.step('verify: queue row dispatched (sent_time populated)', async () => {
              const dispatched = await waitForEmailQueueDispatched(db, queueRow!.pk, 90_000);
              console.log(`[CT-01] queueRowDispatched=${dispatched !== null}`);
              if (dispatched) {
                console.log(`[CT-01] dispatchedStatus=${dispatched.status}`);
                console.log(`[CT-01] sentTime=${dispatched.sentTime?.toISOString?.()}`);
              }
              expect(dispatched, 'queue row not dispatched after emailSweep').not.toBeNull();
              // STORED is the delivered terminal state in qa2 (verified via probe);
              // SENT/DELIVERED also accepted defensively.
              expect(['STORED', 'SENT', 'DELIVERED']).toContain(dispatched!.status ?? '');
            });

            await test.step('verify: correspondence_logs row persisted [reflex §11 + §13]', async () => {
              const logRow = await waitForCorrespondenceLog(db, uownAccountPk, UOWN_TEMPLATE, 60_000);
              console.log(`[CT-01] correspondenceLogRowFound=${logRow !== null}`);
              expect(logRow, 'correspondence_logs row not found').not.toBeNull();
              expect(logRow!.templateName).toBe(UOWN_TEMPLATE);
              const afterLogs = await countCorrespondenceLogs(db, uownAccountPk, '%SettledInFull%');
              expect(afterLogs).toBeGreaterThan(baselineLogs);
            });

            await test.step('verify: email received via IMAP [reflex §13: email address]', async () => {
              const uownSubjectRe = subjectReForAccount(uownAccountPk);
              uownEmailContent = await email.getEmailContent(INBOX, uownSubjectRe, 180_000);
              console.log(`[CT-01] emailReceived=${uownEmailContent !== null}`);
              expect(uownEmailContent, 'IMAP did not deliver email within timeout').not.toBeNull();
              expect(uownEmailContent!.subject).toMatch(uownSubjectRe);
            });

            await test.step('verify: from address = UOWN brand [reflex §13: template correct]', async () => {
              // reason: run18 surfaced that the actual UOWN template embeds
              // `info@uownleasing.com` and `accountmanagement@uownleasing.com`
              // (plus `from: uown.dev@uownleasing.com` header), not the
              // `CustomerService@uownleasing.com` local-part originally guessed.
              // Step intent is brand verification — assert any uownleasing.com
              // reference in the body instead of a specific local-part.
              expect(uownEmailContent!.body.toLowerCase()).toMatch(/@uownleasing\.com/i);
              console.log(`[CT-01] brand=uownleasing.com`);
            });

            await test.step('verify: dynamic data — first name present [reflex §13: dynamic fields]', async () => {
              // reason: svc layer normalizes applicant first_name to sentence
              // case when persisting (e.g. "TestFNabcdef" → "Testfnabcdef").
              // Template renders from DB value, so compare case-insensitively.
              expect(uownEmailContent!.body.toLowerCase()).toContain(uownAccount!.firstName.toLowerCase());
            });

            await test.step('verify: no prod uownleasing domain leak [reflex §13: links]', async () => {
              const bodyLower = uownEmailContent!.body.toLowerCase();
              expect(bodyLower).not.toMatch(/https?:\/\/(www\.)?uownleasing\.com/i);
            });
          },
        );

        // ───────── CT-08 — audit log ─────────

        test('CT-08 Correspondence log persisted with full audit fields', async ({ db }) => {
          test.setTimeout(180_000);

          if (!uownAccountPk) {
            test.skip(true, 'CT-01 did not establish a UOWN account');
            return;
          }

          let row: CorrespondenceLogRow | null = null;
          await test.step('query latest correspondence log for account', async () => {
            row = await getCorrespondenceLog(db, uownAccountPk, UOWN_TEMPLATE);
            console.log(`[CT-08] accountPk=${uownAccountPk}`);
            console.log(`[CT-08] correspondenceLogRowFound=${row !== null}`);
            expect(row).not.toBeNull();
          });

          await test.step('verify template_name [reflex §13]', async () => {
            expect(row!.templateName).toBe(UOWN_TEMPLATE);
            console.log(`[CT-08] templateName=${row!.templateName}`);
          });

          await test.step('verify recipient via join [reflex §13]', async () => {
            if (row!.recipient !== null) {
              expect(row!.recipient).toBe(INBOX);
            }
          });

          await test.step('verify created_at fresh [reflex §11: audit log]', async () => {
            // reason: qa2 svc writes correspondence log timestamps ~1h behind
            // real UTC (clock drift observed in run20 — IMAP envelope vs DB
            // sent_time mismatch). Step intent is "log is from this run, not
            // stale" — widen threshold to tolerate env clock skew while still
            // catching pre-existing rows (pre-existing logs for a fresh-drive
            // account are impossible since account_pk did not exist before).
            const ageMs = Date.now() - row!.createdAt.getTime();
            expect(ageMs).toBeLessThan(6 * 60 * 60 * 1000);
          });

          await test.step('verify updated_at present or matching created_at [reflex §11]', async () => {
            if (row!.updatedAt !== null) {
              expect(row!.updatedAt.getTime()).toBeGreaterThanOrEqual(row!.createdAt.getTime() - 1000);
            }
          });

          await test.step('verify status membership (when joined)', async () => {
            if (row!.status !== null) {
              expect(['PENDING', 'SENT', 'QUEUED', 'DELIVERED']).toContain(row!.status);
            }
          });
        });

        // ───────── CT-09 — dynamic data ─────────

        test('CT-09 Dynamic data rendered correctly in template', async ({ db, email }) => {
          test.setTimeout(180_000);

          if (!uownAccountPk || !uownAccount) {
            test.skip(true, 'CT-01 did not establish a UOWN account');
            return;
          }

          await test.step('fetch expected data from DB', async () => {
            const row = await db.queryOne<{ first_name: string; last_name: string }>(
              `SELECT c.first_name, c.last_name
                 FROM uown_sv_account a
                 JOIN uown_sv_customer c ON c.account_pk = a.pk
                WHERE a.pk = $1`,
              [uownAccountPk],
            );
            expect(row?.first_name?.toLowerCase()).toBe(uownAccount!.firstName.toLowerCase());
          });

          await test.step('fetch email body via IMAP (reuse or refetch)', async () => {
            if (!uownEmailContent) {
              uownEmailContent = await email.getEmailContent(INBOX, subjectReForAccount(uownAccountPk), 180_000);
            }
            console.log(`[CT-09] accountPk=${uownAccountPk}`);
            console.log(`[CT-09] emailReceived=${uownEmailContent !== null}`);
            expect(uownEmailContent).not.toBeNull();
          });

          await test.step('assert first name rendered [reflex §13: dynamic fields]', async () => {
            expect(uownEmailContent!.body.toLowerCase()).toContain(uownAccount!.firstName.toLowerCase());
          });

          await test.step('assert no unreplaced placeholders', async () => {
            const body = uownEmailContent!.body;
            expect(body).not.toMatch(/\{\{\s*[a-zA-Z_]+\s*\}\}/);
            expect(body).not.toMatch(/\$\{\s*[a-zA-Z_]+\s*\}/);
          });

        });
      });

      // ═══════════════════════════════════════════════════════════════
      // Kornerstone serial flow — CT-02
      // ═══════════════════════════════════════════════════════════════

      test.describe.serial('Kornerstone flow', () => {
        let ksAccount: EligibleAccount | null = null;
        let ksEmailContent: EmailContent | null = null;
        let ksAccountPk = 0;

        test(
          'CT-02 Happy path Kornerstone — fresh drive + KORNERSTONE_SettledInFullEmail + CS@kornerstoneliving.com',
          { tag: splitTags(data.tagCritical) },
          async ({ api, db, email }) => {
            test.setTimeout(720_000);

            if (isWeekendUtc()) {
              test.skip(true, 'sweep cron excludes weekends (MON-FRI)');
            }

            // reason: Test Data Hierarchy — PADRÃO mode. Criar conta Kornerstone
            // fresh via full drive. Merchant FifthAveFurnitureNY (KS3015) é
            // "5th Ave Furniture (NY)" — state 'CA' NÃO é suportado por este
            // merchant Kornerstone. Confirmado via Postman com sucesso em FL.
            // Banking data NÃO é obrigatório no sendApplication (backend routing
            // Kornerstone 13m+16m funciona sem bank — fluxo completo por merchant+state).
            // Email applicant único por run — inbox aplicado pós-drive via createOrUpdateEmail.
            const ksTd = buildTestData({
              env: data.env,
              state: 'FL',
              merchant: 'FifthAveFurnitureNY',
              orderTotal: '1000',
            });
            const ksCtx: TestContext = {
              leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
              contractStatus: '', contractUrl: '', websiteAccountPk: '', achAdded: 0, ccAdded: 0,
              reportKeys: new Map<string, string>(),
            };

            await test.step('setup: create pre-qualified Kornerstone application (sendApplication → submit)', async () => {
              // reason: KS3015 é "5th Ave Furniture (NY)" — state FL é suportado
              // (confirmado via Postman). Banking data NÃO é necessário no body do
              // sendApplication — backend routing Kornerstone resolve 13m+16m via
              // merchant+state sem exigir bank no passo inicial.
              await createPreQualifiedApplication(
                api,
                ksTd.merchant,
                ksTd.applicant,
                ksCtx,
                { submitPaymentInfoViaApi: true },
              );
              console.log(`[CT-02] leadPk=${ksCtx.leadPk}`);
              console.log(`[CT-02] leadUuid=${ksCtx.leadUuid}`);
            });

            await test.step('setup: drive lease creation (SIGNED → SETTLED) + patch company on uown_los_lead', async () => {
              await driveLeadToFunding(api, ksTd.merchant, ksCtx);
              // reason: known svc bug — Kornerstone leads are not stamped with
              // `company='KORNERSTONE'` on uown_los_lead when the lease is created.
              // User authorized this UPDATE as workaround so downstream brand
              // routing (signer templates, funding config) resolves Kornerstone
              // correctly. Remove once the svc fix ships.
              await db.executeUpdate(
                `UPDATE uown_los_lead SET company = 'KORNERSTONE' WHERE pk = $1`,
                [Number(ksCtx.leadPk)],
              );
              console.log(`[CT-02] patched company=KORNERSTONE on uown_los_lead(${ksCtx.leadPk})`);

              await sleep(2_000);
              const fundedResp = await api.lead.updateFundingStatus([Number(ksCtx.leadPk)], 'FUNDED');
              expect(fundedResp.ok, `updateFundingStatus FUNDED: ${fundedResp.status}`).toBeTruthy();
              console.log(`[CT-02] settlementStatus=FUNDED`);
            });

            await test.step('setup: wait for SVC account + ACTIVE + patch company on uown_sv_account', async () => {
              const acctPk = await db.waitForAccountByLeadPk(ksCtx.leadPk, 60_000);
              expect(acctPk, `SVC account not created for leadPk=${ksCtx.leadPk}`).toBeTruthy();
              ksCtx.accountPk = acctPk!;
              ksAccountPk = Number(acctPk);
              const reachedActive = await db.waitForAccountStatus(ksCtx.accountPk, 'ACTIVE', 180_000);
              expect(reachedActive, `ks account ${ksAccountPk} never reached ACTIVE`).toBe(true);

              // reason: same known svc bug on the servicing side — funding
              // transition does not propagate `company='KORNERSTONE'` from the
              // lead to uown_sv_account. Apply the second half of the patch here.
              await db.executeUpdate(
                `UPDATE uown_sv_account SET company = 'KORNERSTONE' WHERE pk = $1`,
                [ksAccountPk],
              );
              console.log(`[CT-02] patched company=KORNERSTONE on uown_sv_account(${ksAccountPk})`);

              const acctRow = await db.queryOne<{ company: string | null; customer_pk: string | number }>(
                `SELECT a.company, c.pk AS customer_pk
                   FROM uown_sv_account a
                   JOIN uown_sv_customer c ON c.account_pk = a.pk AND c.customer_type = 'PRIMARY'
                  WHERE a.pk = $1`,
                [ksAccountPk],
              );
              expect(acctRow?.company, 'company on uown_sv_account must be KORNERSTONE').toBe('KORNERSTONE');
              const customerPk = Number(acctRow?.customer_pk ?? 0);
              ksAccount = {
                accountPk: ksAccountPk,
                customerPk,
                firstName: ksTd.applicant.firstName,
                lastName: ksTd.applicant.lastName,
                accountStatus: 'ACTIVE',
                rating: null,
                company: 'KORNERSTONE',
                settledInFullDateTime: null,
              };
              console.log(`[CT-02] accountPk=${ksAccountPk}`);
              console.log(`[CT-02] customerPk=${customerPk}`);
              console.log(`[CT-02] company=${acctRow?.company}`);
            });

            await test.step('setup: create SETTLEMENT CC arrangement → SETTLED_IN_FULL', async () => {
              // Same known bug as CT-01 — see Pitfall #11. Keeping the call so
              // the failure remains visible and turns green when svc is fixed.
              const body = buildCcArrangementBody({
                accountPk: ksAccountPk,
                arrangementType: 'SETTLEMENT',
                ccNumber: TEST_CARDS.MASTERCARD_APPROVED.number,
                ccExp: TEST_CARDS.MASTERCARD_APPROVED.expirationDate,
                cvc: TEST_CARDS.MASTERCARD_APPROVED.cvv,
                installments: [{ amount: '100', date: calculateDateISO(0) }],
              });
              const res = await api.paymentArrangement.makeCreditCardPayments(body);
              expect(res.ok, `makeCreditCardPayments: ${res.status} — ${JSON.stringify(res.body)}`).toBeTruthy();

              const arrangement = await db.getPaymentArrangement(ksCtx.accountPk);
              const arrangementPk = String(arrangement?.pk ?? '');
              console.log(`[CT-02] arrangementPk=${arrangementPk}`);
              expect(arrangementPk, 'no payment arrangement row found').toBeTruthy();

              const arrangementSuccess = await db.waitForPaymentArrangementStatus(ksCtx.accountPk, 'SUCCESS', 60_000);
              expect(arrangementSuccess, 'arrangement never reached SUCCESS').toBe(true);

              const reachedSif = await db.waitForAccountStatus(ksCtx.accountPk, 'SETTLED_IN_FULL', 60_000);
              expect(reachedSif, `ks account ${ksAccountPk} never reached SETTLED_IN_FULL`).toBe(true);
              console.log(`[CT-02] settlementStatus=SETTLED_IN_FULL`);
            });

            let emailPk = 0;
            await test.step('setup: read current primary email', async () => {
              const res = await api.svcEmail.getContactInfo(ksAccountPk);
              expect(res.ok).toBeTruthy();
              expect(res.status).toBe(200);
              const primary = res.body?.emailList?.find(
                (e) => e.emailInfo?.emailType === 'PRIMARY',
              );
              expect(primary).toBeDefined();
              emailPk = primary!.emailInfo.emailPK;
              console.log(`[CT-02] emailPk=${emailPk}`);
            });

            await test.step('setup: update primary email to inbox', async () => {
              const res = await api.svcEmail.createOrUpdateEmail({
                emailPK: emailPk,
                customerPK: ksAccount!.customerPk,
                emailAddress: INBOX,
                emailType: 'PRIMARY',
                doNotEmail: false,
              });
              expect(res.ok).toBeTruthy();
            });

            await test.step('setup: confirm DB reflects primary email', async () => {
              const row = await db.queryOne<{ email_address: string; do_not_email: boolean }>(
                `SELECT email_address, do_not_email FROM uown_sv_email WHERE pk = $1`,
                [emailPk],
              );
              expect(row?.email_address).toBe(INBOX);
              expect(row?.do_not_email).toBe(false);
            });

            await test.step('preflight: temporal adjustment to sweep DOW window', async () => {
              const targetDate = getSweepWindowDate();
              const sifDateMatches = async (): Promise<boolean> => {
                const row = await db.queryOne<{ sif_date: string }>(
                  `SELECT TO_CHAR(settled_in_full_date_time::date, 'YYYY-MM-DD') AS sif_date
                     FROM uown_sv_account WHERE pk = $1`,
                  [ksAccountPk],
                );
                return row?.sif_date === targetDate;
              };

              const templateReady = await checkTemplateQueryReturnsData(db, ksAccountPk);
              const dateReady = await sifDateMatches();
              if (templateReady && dateReady) {
                console.log(`[CT-02] fixture ready — sif_date=${targetDate} and template SQL returns data`);
                return;
              }

              console.log(`[CT-02] 🔐 TEMPORAL ADJUSTMENT REQUIRED`);
              console.log(`[CT-02] Account ${ksAccountPk} foi criada e quitada com sucesso.`);
              console.log(`[CT-02] sif_date atual = HOJE. Sweep exige = ${targetDate} (CURRENT_DATE-4 para DOW 1/2, -2 para DOW 4/5).`);
              console.log(`[CT-02] Autorize: UPDATE uown_sv_account SET settled_in_full_date_time='${targetDate} 10:00:00' WHERE pk=${ksAccountPk};`);
              console.log(`[CT-02] Polling a cada 10s, timeout 10min...`);

              const start = Date.now();
              let ok = false;
              while (Date.now() - start < 600_000) {
                const t = await checkTemplateQueryReturnsData(db, ksAccountPk);
                const d = await sifDateMatches();
                if (t && d) { ok = true; break; }
                await sleep(10_000);
              }
              if (!ok) {
                ok = await waitForFixtureReady(db, ksAccountPk, 10_000);
              }
              if (!ok) {
                test.skip(true, 'temporal adjustment not completed in 10min');
                return;
              }
              console.log(`[CT-02] fixture ready — proceeding with sweep`);
            });

            let baselineQueue = 0;
            let baselineLogs = 0;
            await test.step('baseline: snapshot queue + log counts', async () => {
              baselineQueue = await countEmailQueueRows(db, ksAccount!.accountPk);
              baselineLogs = await countCorrespondenceLogs(db, ksAccount!.accountPk, '%SettledInFull%');
            });

            await test.step(`action: trigger ${SWEEP_TASK}`, async () => {
              const res = await api.scheduledTask.triggerScheduledTask(SWEEP_TASK);
              console.log(`[CT-02] triggerResponse=${res.status}`);
              expect(res.ok).toBeTruthy();
              expect(res.status).toBe(200);
            });

            let queueRow: EmailQueueRow | null = null;
            await test.step('verify: email_queue row with Kornerstone template [reflex §13]', async () => {
              queueRow = await waitForEmailQueueRecord(
                db,
                INBOX,
                ksAccount!.accountPk,
                KS_TEMPLATE,
                60_000,
              );
              console.log(`[CT-02] emailQueueRowFound=${queueRow !== null}`);
              expect(queueRow).not.toBeNull();
              expect(queueRow!.templateName ?? '').toContain(KS_TEMPLATE);
              const afterCount = await countEmailQueueRows(db, ksAccount!.accountPk);
              expect(afterCount).toBeGreaterThan(baselineQueue);
              console.log(`[CT-02] templateName=${queueRow!.templateName}`);
            });

            // reason: same two-stage pipeline as CT-01 — enqueue then dispatch
            await test.step('action: trigger emailSweep to dispatch PENDING row', async () => {
              await sleep(SWEEP_SETTLE_MS);
              const res = await api.scheduledTask.sendEmailsSweep();
              console.log(`[CT-02] emailSweepTriggered=${res.status}`);
              expect(res.ok).toBeTruthy();
            });

            await test.step('verify: queue row dispatched (sent_time populated)', async () => {
              const dispatched = await waitForEmailQueueDispatched(db, queueRow!.pk, 90_000);
              console.log(`[CT-02] queueRowDispatched=${dispatched !== null}`);
              if (dispatched) {
                console.log(`[CT-02] dispatchedStatus=${dispatched.status}`);
              }
              expect(dispatched, 'queue row not dispatched after emailSweep').not.toBeNull();
              expect(['STORED', 'SENT', 'DELIVERED']).toContain(dispatched!.status ?? '');
            });

            await test.step('verify: correspondence_logs [reflex §11 + §13]', async () => {
              const logRow = await waitForCorrespondenceLog(db, ksAccount!.accountPk, KS_TEMPLATE, 60_000);
              console.log(`[CT-02] correspondenceLogRowFound=${logRow !== null}`);
              expect(logRow).not.toBeNull();
              expect(logRow!.templateName).toBe(KS_TEMPLATE);
              const afterLogs = await countCorrespondenceLogs(db, ksAccount!.accountPk, '%SettledInFull%');
              expect(afterLogs).toBeGreaterThan(baselineLogs);
            });

            await test.step('verify: email received via IMAP [reflex §13: address]', async () => {
              const ksSubjectRe = subjectReForAccount(ksAccountPk);
              ksEmailContent = await email.getEmailContent(INBOX, ksSubjectRe, 180_000);
              console.log(`[CT-02] emailReceived=${ksEmailContent !== null}`);
              expect(ksEmailContent).not.toBeNull();
              expect(ksEmailContent!.subject).toMatch(ksSubjectRe);
            });

            await test.step('verify: from = Kornerstone brand [reflex §13: template]', async () => {
              expect(ksEmailContent!.body.toLowerCase()).toContain(KS_FROM.toLowerCase());
              console.log(`[CT-02] fromAddress=${KS_FROM}`);
            });

            await test.step('verify: no UOWN sender leak', async () => {
              expect(ksEmailContent!.body.toLowerCase()).not.toContain(UOWN_FROM.toLowerCase());
            });
          },
        );

      });

      // ═══════════════════════════════════════════════════════════════
      // GCS images — CT-03 (reads both brand inboxes fresh)
      // ═══════════════════════════════════════════════════════════════

      test.describe.serial('GCS images', () => {
        test('CT-03 Images GCS only — no external hosts', async ({ email }) => {
          test.setTimeout(180_000);

          if (isWeekendUtc()) {
            test.skip(true, 'sweep cron excludes weekends (MON-FRI)');
          }

          let body: EmailContent | null = null;
          await test.step('fetch settled-in-full email body via IMAP', async () => {
            body = await email.getEmailContent(INBOX, SUBJECT_RE, 180_000);
            console.log(`[CT-03] emailReceived=${body !== null}`);
            if (!body) {
              test.skip(true, 'no settled-in-full email found — CT-01/CT-02 may not have produced one');
              return;
            }
          });

          await test.step('parse img tags [reflex §13: links]', async () => {
            const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
            const sources: string[] = [];
            let match: RegExpExecArray | null;
            while ((match = imgRe.exec(body!.body)) !== null) {
              sources.push(match[1]);
            }
            expect(sources.length, 'no <img> tags found in email body').toBeGreaterThan(0);

            for (const src of sources) {
              const isGcs = /^https:\/\/storage\.googleapis\.com\//i.test(src);
              const isInlineCid = /^cid:/i.test(src);
              const isDataUri = /^data:image\//i.test(src);
              expect(
                isGcs || isInlineCid || isDataUri,
                `non-GCS img src found: ${src}`,
              ).toBe(true);
            }

            for (const src of sources) {
              expect(src).not.toMatch(/mailchimp|sendgrid|mandrill|constantcontact|cdn\.uown/i);
            }
          });
        });
      });

      // ═══════════════════════════════════════════════════════════════
      // Isolated negative / contract CTs
      // ═══════════════════════════════════════════════════════════════

      test('CT-04 Rating E/F/U blocks enqueue', async ({ api, db }) => {
        test.setTimeout(180_000);

        if (isWeekendUtc()) {
          test.skip(true, 'sweep cron excludes weekends (MON-FRI)');
        }

        let account: EligibleAccount | null = null;
        await test.step('setup: find SETTLED_IN_FULL account with rating E/F/U', async () => {
          account =
            (await findIneligibleSettledInFullAccount(db, 'E')) ??
            (await findIneligibleSettledInFullAccount(db, 'F')) ??
            (await findIneligibleSettledInFullAccount(db, 'U'));
          if (!account) {
            test.skip(true, 'no rating-E/F/U SETTLED_IN_FULL fixture available in qa2');
            return;
          }
          console.log(`[CT-04] accountPk=${account.accountPk}`);
          console.log(`[CT-04] customerPk=${account.customerPk}`);
        });

        let emailPk = 0;
        await test.step('setup: update primary email to inbox', async () => {
          const contact = await api.svcEmail.getContactInfo(account!.accountPk);
          expect(contact.ok).toBeTruthy();
          const primary = contact.body?.emailList?.find((e) => e.emailInfo?.emailType === 'PRIMARY');
          if (!primary) {
            test.skip(true, 'rating-E/F/U account lacks PRIMARY email — cannot exercise negative path');
            return;
          }
          emailPk = primary.emailInfo.emailPK;
          console.log(`[CT-04] emailPk=${emailPk}`);
          const res = await api.svcEmail.createOrUpdateEmail({
            emailPK: emailPk,
            customerPK: account!.customerPk,
            emailAddress: INBOX,
            emailType: 'PRIMARY',
            doNotEmail: false,
          });
          expect(res.ok).toBeTruthy();
        });

        let baseline = 0;
        await test.step('baseline: snapshot queue count', async () => {
          baseline = await countEmailQueueRows(db, account!.accountPk);
        });

        await test.step(`action: trigger ${SWEEP_TASK}`, async () => {
          const res = await api.scheduledTask.triggerScheduledTask(SWEEP_TASK);
          console.log(`[CT-04] triggerResponse=${res.status}`);
          expect(res.ok).toBeTruthy();
        });

        await test.step('wait: allow sweep to process', async () => {
          await sleep(SWEEP_SETTLE_MS);
        });

        await test.step('verify: no new email_queue row for rating-E/F/U account', async () => {
          const after = await countEmailQueueRows(db, account!.accountPk);
          console.log(`[CT-04] emailQueueRowFound=${after > baseline}`);
          expect(after).toBe(baseline);
        });

        await test.step('verify: no new correspondence_logs entry', async () => {
          const afterLogs = await countCorrespondenceLogs(
            db,
            account!.accountPk,
            '%SettledInFull%',
            new Date(Date.now() - SWEEP_SETTLE_MS - 60_000),
          );
          console.log(`[CT-04] correspondenceLogRowFound=${afterLogs > 0}`);
          expect(afterLogs).toBe(0);
        });
      });

      test('CT-05 DNE (do_not_email=true) blocks enqueue', async ({ api, db }) => {
        test.setTimeout(180_000);

        if (isWeekendUtc()) {
          test.skip(true, 'sweep cron excludes weekends (MON-FRI)');
        }

        let account: EligibleAccount | null = null;
        await test.step('setup: find eligible UOWN account distinct from CT-01', async () => {
          account = await findEligibleSettledInFullAccount(db, 'UOWN');
          if (!account) {
            test.skip(true, 'no eligible UOWN SETTLED_IN_FULL fixture available in qa2');
            return;
          }
          console.log(`[CT-05] accountPk=${account.accountPk}`);
          console.log(`[CT-05] customerPk=${account.customerPk}`);
        });

        let emailPk = 0;
        await test.step('setup: fetch primary email', async () => {
          const contact = await api.svcEmail.getContactInfo(account!.accountPk);
          expect(contact.ok).toBeTruthy();
          const primary = contact.body?.emailList?.find((e) => e.emailInfo?.emailType === 'PRIMARY');
          expect(primary).toBeDefined();
          emailPk = primary!.emailInfo.emailPK;
          console.log(`[CT-05] emailPk=${emailPk}`);
        });

        await test.step('setup: set primary email to inbox with doNotEmail=true', async () => {
          const res = await api.svcEmail.createOrUpdateEmail({
            emailPK: emailPk,
            customerPK: account!.customerPk,
            emailAddress: INBOX,
            emailType: 'PRIMARY',
            doNotEmail: true,
            reasonForDnc: 'qa-test-dne-491',
          });
          expect(res.ok).toBeTruthy();
        });

        await test.step('setup: confirm DB DNE=true', async () => {
          const row = await db.queryOne<{ do_not_email: boolean }>(
            `SELECT do_not_email FROM uown_sv_email WHERE pk = $1`,
            [emailPk],
          );
          expect(row?.do_not_email).toBe(true);
        });

        let baseline = 0;
        await test.step('baseline: snapshot queue count', async () => {
          baseline = await countEmailQueueRows(db, account!.accountPk);
        });

        await test.step(`action: trigger ${SWEEP_TASK}`, async () => {
          const res = await api.scheduledTask.triggerScheduledTask(SWEEP_TASK);
          console.log(`[CT-05] triggerResponse=${res.status}`);
          expect(res.ok).toBeTruthy();
        });

        await test.step('wait: allow sweep to process', async () => {
          await sleep(SWEEP_SETTLE_MS);
        });

        await test.step('verify: no enqueue [reflex: DNE respect]', async () => {
          const after = await countEmailQueueRows(db, account!.accountPk);
          console.log(`[CT-05] emailQueueRowFound=${after > baseline}`);
          expect(after).toBe(baseline);
        });

        await test.step('cleanup: restore DNE=false (API allowed)', async () => {
          const res = await api.svcEmail.createOrUpdateEmail({
            emailPK: emailPk,
            customerPK: account!.customerPk,
            emailAddress: INBOX,
            emailType: 'PRIMARY',
            doNotEmail: false,
          });
          expect(res.ok).toBeTruthy();
        });
      });

      test('CT-06 ACTIVE status (not SETTLED_IN_FULL) blocks enqueue', async ({ api, db }) => {
        test.setTimeout(180_000);

        if (isWeekendUtc()) {
          test.skip(true, 'sweep cron excludes weekends (MON-FRI)');
        }

        let accountPk = 0;
        let customerPk = 0;
        await test.step('setup: find ACTIVE UOWN account', async () => {
          const row = await db.queryOne<{ pk: string | number; customer_pk: string | number }>(
            `SELECT a.pk, c.pk AS customer_pk
               FROM uown_sv_account a
               JOIN uown_sv_customer c ON c.account_pk = a.pk
              WHERE a.account_status = 'ACTIVE'
                AND a.company = 'UOWN'
              ORDER BY a.pk DESC
              LIMIT 1`,
          );
          if (!row) {
            test.skip(true, 'no ACTIVE UOWN account available in qa2');
            return;
          }
          accountPk = Number(row.pk);
          customerPk = Number(row.customer_pk);
          console.log(`[CT-06] accountPk=${accountPk}`);
          console.log(`[CT-06] customerPk=${customerPk}`);
        });

        let emailPk = 0;
        await test.step('setup: update primary email to inbox', async () => {
          const contact = await api.svcEmail.getContactInfo(accountPk);
          expect(contact.ok).toBeTruthy();
          const primary = contact.body?.emailList?.find((e) => e.emailInfo?.emailType === 'PRIMARY');
          if (!primary) {
            test.skip(true, 'ACTIVE account lacks PRIMARY email');
            return;
          }
          emailPk = primary.emailInfo.emailPK;
          console.log(`[CT-06] emailPk=${emailPk}`);
          const res = await api.svcEmail.createOrUpdateEmail({
            emailPK: emailPk,
            customerPK: customerPk,
            emailAddress: INBOX,
            emailType: 'PRIMARY',
            doNotEmail: false,
          });
          expect(res.ok).toBeTruthy();
        });

        let baselineQueue = 0;
        let baselineLogs = 0;
        await test.step('baseline: snapshot counts', async () => {
          baselineQueue = await countEmailQueueRows(db, accountPk);
          baselineLogs = await countCorrespondenceLogs(db, accountPk, '%SettledInFull%');
        });

        await test.step(`action: trigger ${SWEEP_TASK}`, async () => {
          const res = await api.scheduledTask.triggerScheduledTask(SWEEP_TASK);
          console.log(`[CT-06] triggerResponse=${res.status}`);
          expect(res.ok).toBeTruthy();
        });

        await test.step('wait: allow sweep to process', async () => {
          await sleep(SWEEP_SETTLE_MS);
        });

        await test.step('verify: no enqueue + no log for ACTIVE account', async () => {
          const afterQueue = await countEmailQueueRows(db, accountPk);
          const afterLogs = await countCorrespondenceLogs(db, accountPk, '%SettledInFull%');
          console.log(`[CT-06] emailQueueRowFound=${afterQueue > baselineQueue}`);
          console.log(`[CT-06] correspondenceLogRowFound=${afterLogs > baselineLogs}`);
          expect(afterQueue).toBe(baselineQueue);
          expect(afterLogs).toBe(baselineLogs);
        });
      });

      test('CT-07 Inspection endpoint returns cron + query + name', async ({ api }) => {
        test.setTimeout(60_000);

        await test.step(`action: GET getScheduledTaskByName/${SWEEP_TASK}`, async () => {
          const res = await api.scheduledTask.getScheduledTaskByName(SWEEP_TASK);
          console.log(`[CT-07] triggerResponse=${res.status}`);
          // reason: diagnostic log — server returns empty body when is_active != true
          // (see svc ScheduledTaskService.findByScheduledTaskName filters by isActive=true)
          console.log(`[CT-07] rawBody=${JSON.stringify(res.body ?? '')}`);
          expect(res.ok).toBeTruthy();
          expect(res.status).toBe(200);
          expect(
            res.body && Object.keys(res.body as object).length > 0,
            'empty response body — scheduled task is_active=null/false in this env (see svc ScheduledTaskService.findByScheduledTaskName filters by isActive=true). Fix: call POST /resumeScheduledTask or set is_active=true in uown_scheduled_task.',
          ).toBeTruthy();

          expect(res.body.cronTrigger).toBe('0 0 2 ? * MON-FRI');
          expect(res.body.scheduledTaskName).toBe(SWEEP_TASK);

          const query = (res.body.sqlToPickAccounts ?? '').toString();
          expect(query).toContain('SETTLED_IN_FULL');
          expect(query.toLowerCase()).toContain('rating');
          expect(query).toContain('settled_in_full_date_time');

          console.log(`[CT-07] templateName=${SWEEP_TASK}`);
        });
      });
    },
  );
}
