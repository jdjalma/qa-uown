/**
 * S6 DISCOVERY (qa1 exploratory master) — SVC-04 Settlement / SVC-06 Banking / SVC-07 Contact-OptOut.
 *
 * READ-ONLY recon (rule #10 conservative, rule #18 UI-first + DB oracle). NO mutation:
 *   - Settlement: NEVER submit a SETTLEMENT arrangement (settle ends the lease). Only read the
 *     panel value + open the breakdown modal + close it.
 *   - Banking: open Add Bank modal + View All modal, inventory fields, CANCEL/close. NEVER Save/Delete.
 *   - Contact: read Opt Out AI visibility + checked state. NEVER toggle/save. Podium button: visibility only.
 *
 * Accounts (existing qa1 fixtures, observation-only — no fresh data needed for a read-only recon):
 *   - 4452 ACTIVE DPD 58 → settlement ELSE bucket 1.00 (offer = full balance, ~$2500.16, == EPO range)
 *   - 3992 ACTIVE DPD 90 → settlement 0.70 bucket, but total_paid == total_contract → settlement $0.00
 *     (reproduce SettlementBreakdownModal BUG-1: modal opens empty on $0.00 ineligible).
 *
 * Activity-log watermark (rule #13) is captured before/after to PROVE the recon created no audit noise.
 */
import { test, expect } from '@support/base-test.js';
import {
  ServicingAccountSummaryPage,
  SettlementBreakdownModal,
  BankAccountPage,
  ServicingCustomerPage,
} from '@pages/servicing/index.js';

const ACCT_ELIGIBLE = '4452'; // DPD 58 → full balance offer
const ACCT_ZERO = '3992';     // DPD 90 but fully-paid → settlement $0.00

test.describe('S6 discovery — Settlement / Banking / Contact (READ-ONLY)', () => {
  test.describe.configure({ mode: 'serial' });

  async function logWatermark(db: any, pk: string, label: string): Promise<number> {
    const rows = await db.query(
      'SELECT COALESCE(max(pk),0) AS m FROM uown_sv_activity_log WHERE account_pk = $1', [pk],
    );
    const m = Number(rows[0].m as number);
    console.log(`[S6][WM][${label}] account ${pk} max activity_log pk=${m}`);
    return m;
  }

  test('A) SVC-04 Settlement — panel value + breakdown modal vs DB (eligible + $0.00)', async ({ page, testEnv, db }) => {
    test.setTimeout(180_000);
    const summary = new ServicingAccountSummaryPage(page);
    const modal = new SettlementBreakdownModal(page);

    for (const pk of [ACCT_ELIGIBLE, ACCT_ZERO]) {
      const wm = await logWatermark(db, pk, `A-pre-${pk}`);

      await test.step(`[${pk}] open customer-information + read EPO/Settlement panel`, async () => {
        await summary.navigateToCustomerInformation(testEnv.servicingUrl, pk);
        const epo = await summary.readEpoPanel();
        console.log(`[S6][A][${pk}][PANEL] EPO=${epo.epoBalance} Settlement=${epo.settlementAmount} ` +
          `TCA=${epo.totalContractAmount} ContractBal=${epo.contractBalance} eligible90=${epo.eligible}`);
      });

      await test.step(`[${pk}] settlement label visibility + panel value text`, async () => {
        const labelVisible = await modal.isLabelVisible(8_000);
        console.log(`[S6][A][${pk}] Settlement Amount label visible? ${labelVisible}`);
        if (labelVisible) {
          const panelText = await modal.getPanelValueText();
          console.log(`[S6][A][${pk}] panel value text raw: "${panelText}"`);
        }
      });

      await test.step(`[${pk}] open breakdown modal (read rows) + close — NO submit`, async () => {
        const labelVisible = await modal.isLabelVisible(5_000);
        if (!labelVisible) {
          console.log(`[S6][A][${pk}] label not visible → skip modal (documenting absence)`);
          return;
        }
        try {
          await modal.openModal();
          const hasContent = await modal.hasBreakdownContent(3_000);
          console.log(`[S6][A][${pk}] modal opened. hasBreakdownContent=${hasContent}`);
          if (hasContent) {
            const rows = await modal.getBreakdownRows();
            console.log(`[S6][A][${pk}] breakdown rows (${rows.length}): ` +
              JSON.stringify(rows.map(r => `${r.label}=${r.value}`)));
          } else {
            console.log(`[S6][A][${pk}] modal opened EMPTY (reproduces BUG-1 candidate on $0.00/ineligible)`);
          }
          await modal.close();
        } catch (e) {
          console.log(`[S6][A][${pk}] modal open threw: ${(e as Error).message.slice(0, 160)}`);
        }
      });

      const wmPost = await logWatermark(db, pk, `A-post-${pk}`);
      console.log(`[S6][A][${pk}][AUDIT] new logs during read-only recon: ${wmPost - wm} (expected ~0)`);
    }
  });

  test('B) SVC-06 Banking — Add modal fields + View All masking (NO Save/Delete)', async ({ page, testEnv, db }) => {
    test.setTimeout(180_000);
    const summary = new ServicingAccountSummaryPage(page);
    const bank = new BankAccountPage(page);
    const pk = ACCT_ZERO; // 3992 has a bank account on file (160781900000)
    const wm = await logWatermark(db, pk, `B-pre-${pk}`);

    await test.step('open customer-information', async () => {
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, pk);
    });

    await test.step('read Bank Account card (masking on card)', async () => {
      const last4 = await bank.getAccountNumberLastFour();
      const def = await bank.getDefaultPaymentFromCard();
      console.log(`[S6][B][card] account last4="${last4}" defaultPayment="${def}"`);
    });

    await test.step('open Add a Bank Account modal → inventory fields → CANCEL (no save)', async () => {
      try {
        await bank.openAddBankAccountModal();
        const inv = await page.evaluate(() => {
          const ids = ['routingNumber', 'accountNumber', 'bankAccountType'];
          const present: Record<string, boolean> = {};
          for (const id of ids) present[id] = !!document.querySelector(`#${id}`);
          const form = document.querySelector('#addBAForm');
          const labels = form
            ? Array.from(form.querySelectorAll('label')).map(l => (l.textContent ?? '').trim()).filter(Boolean)
            : [];
          return { present, labels };
        });
        console.log(`[S6][B][addModal] fields present: ${JSON.stringify(inv.present)}`);
        console.log(`[S6][B][addModal] labels: ${JSON.stringify(inv.labels)}`);
      } catch (e) {
        console.log(`[S6][B][addModal] threw: ${(e as Error).message.slice(0, 160)}`);
      } finally {
        // Close WITHOUT saving
        const cancel = bank.cancelBankAccountButton.first();
        if (await cancel.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await cancel.click().catch(() => {});
        } else {
          await page.keyboard.press('Escape').catch(() => {});
        }
      }
    });

    await test.step('open All Bank Accounts modal → masking in table → close (no delete)', async () => {
      try {
        await bank.openAllBankAccountsModal();
        const tableText = await page.locator('.modal.show .rdt_TableBody').first()
          .textContent().catch(() => '');
        console.log(`[S6][B][viewAll] table body text (masking check): "${(tableText ?? '').replace(/\s+/g, ' ').trim().slice(0, 220)}"`);
      } catch (e) {
        console.log(`[S6][B][viewAll] threw: ${(e as Error).message.slice(0, 160)}`);
      } finally {
        await page.keyboard.press('Escape').catch(() => {});
      }
    });

    const wmPost = await logWatermark(db, pk, `B-post-${pk}`);
    console.log(`[S6][B][AUDIT] new logs during read-only recon: ${wmPost - wm} (expected ~0; opening modals must NOT log)`);
  });

  test('C) SVC-07 Contact Opt-Out — Opt Out AI state + Podium button visibility (NO toggle)', async ({ page, testEnv, db }) => {
    test.setTimeout(180_000);
    const summary = new ServicingAccountSummaryPage(page);
    const cust = new ServicingCustomerPage(page);

    for (const pk of [ACCT_ELIGIBLE, ACCT_ZERO]) {
      const wm = await logWatermark(db, pk, `C-pre-${pk}`);

      await test.step(`[${pk}] customer-information → Primary Contact`, async () => {
        await summary.navigateToCustomerInformation(testEnv.servicingUrl, pk);
        await cust.navigateToPrimaryContact();
      });

      await test.step(`[${pk}] read Opt Out AI (visibility + checked) — NO edit`, async () => {
        const visible = await cust.isOptOutAiVisible();
        const checked = visible ? await cust.isOptOutAiChecked() : false;
        console.log(`[S6][C][${pk}] OptOutAI visible=${visible} checked=${checked}`);
      });

      await test.step(`[${pk}] inventory all contact opt-out controls in DOM`, async () => {
        const inv = await page.evaluate(() => {
          const sel = [
            '#optOutAiMobile', '#doNotCallMobile', '#doNotTextMobile',
            '#doNotEmail', '#doNotContact', '#optOutSms', '#optOutMail',
          ];
          const out: Record<string, { present: boolean; checked: boolean | null }> = {};
          for (const s of sel) {
            const el = document.querySelector(s) as HTMLInputElement | null;
            out[s] = { present: !!el, checked: el ? !!el.checked : null };
          }
          // any checkbox whose nearby label mentions opt-out / do not
          const labelHits = Array.from(document.querySelectorAll('label'))
            .map(l => (l.textContent ?? '').trim())
            .filter(t => /opt.?out|do not|unsubscrib/i.test(t));
          return { out, labelHits };
        });
        console.log(`[S6][C][${pk}] opt-out controls: ${JSON.stringify(inv.out)}`);
        console.log(`[S6][C][${pk}] opt-out related labels: ${JSON.stringify(inv.labelHits)}`);
      });

      const wmPost = await logWatermark(db, pk, `C-post-${pk}`);
      console.log(`[S6][C][${pk}][AUDIT] new logs during read-only recon: ${wmPost - wm} (expected ~0)`);
    }

    await test.step('Podium / Send Invite button visibility (Account Summary)', async () => {
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, ACCT_ELIGIBLE);
      const podiumVisible = await cust.isPodiumLinkButtonVisible().catch(() => false);
      console.log(`[S6][C][podium] Send Podium Link button directly visible (no envelope click)? ${podiumVisible}`);
    });
  });
});
