/**
 * External-Sync Sweeps — Servicing Portal — E2E (trigger-acceptance smoke)
 *
 * Trigger-acceptance coverage for the remaining scheduled tasks whose work is a sync to a
 * THIRD-PARTY system (TaxCloud, TrustPilot) or a program activation/EPO-pool operation that
 * produces NO observable DB outcome in dev3 (no external connection, no-op data). These
 * sweeps cannot be asserted on a business row or a deterministic state change here; the only
 * honest, deterministic check is that the trigger endpoint accepts the task (HTTP 200),
 * which catches a removed/renamed scheduled task or a broken admin route.
 *
 * Sweeps covered (7):
 *   dailyTaxCloudPaymentsSync, dailyTaxCloudRefundsSync, updateTaxRatesSweep   (TaxCloud sync)
 *   refreshTrustPilotAccessKeySweep                                            (TrustPilot token)
 *   MerchantProgramActivationDeactivationSweep, ProgramActivationDeactivationSweep (program activation)
 *   redistributeDelinquentEpoPoolSweep                                         (EPO pool redistribution)
 *
 * This closes the active-sweep inventory at 57/57 with at least trigger-acceptance coverage.
 * A new uown_sweep_logs row is reported as [OBSERVAÇÃO] when present (these are slow / no-op
 * in dev3 and frequently do not log within a test window).
 *
 * API-only (admin/ops sweeps, no UI affordance — rule #14 exception (a)).
 * Env: dev3 (DB 127.0.0.1:5445, SVC API svc-dev3).
 *
 * Run: ENV=dev3 node node_modules/@playwright/test/cli.js test \
 *        tests/e2e/servicing/external-sync-sweeps-servicing.spec.ts --reporter=list --timeout=300000
 */
import { test, expect } from '@support/base-test.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const EXTERNAL_SWEEPS = [
  'dailyTaxCloudPaymentsSync',
  'dailyTaxCloudRefundsSync',
  'updateTaxRatesSweep',
  'refreshTrustPilotAccessKeySweep',
  'MerchantProgramActivationDeactivationSweep',
  'ProgramActivationDeactivationSweep',
  'redistributeDelinquentEpoPoolSweep',
] as const;

const TAGS = buildTags(TestTag.REGRESSION);

test.describe('External-Sync Sweeps — Servicing (trigger-acceptance)', { tag: splitTags(TAGS) }, () => {
  test('All external-sync sweeps accept the trigger (HTTP 200)', async ({ api, db }) => {
    test.setTimeout(180_000);

    const baselines = new Map<string, number>();
    await test.step('Capture sweep_log baselines', async () => {
      for (const name of EXTERNAL_SWEEPS) {
        baselines.set(
          name,
          await db.getSingleNumber(
            `SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1`,
            [name],
          ),
        );
      }
    });

    await test.step('Trigger each external-sync sweep (assert HTTP 200)', async () => {
      for (const name of EXTERNAL_SWEEPS) {
        const resp = await api.scheduledTask.triggerScheduledTask(name);
        expect(resp.status, `triggerScheduledTask ${name} must return 200 (task registered)`).toBe(200);
        console.log(`[external-sync] ${name}: trigger accepted (HTTP 200)`);
      }
    });

    await test.step('Best-effort sweep_log observation (non-gating)', async () => {
      // Give them a short shared window; these are external/no-op in dev3 so most will not log.
      await new Promise(r => setTimeout(r, 30_000));
      const logged: string[] = [];
      for (const name of EXTERNAL_SWEEPS) {
        const latest = await db.getSingleNumber(
          `SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1`,
          [name],
        );
        if (latest > (baselines.get(name) ?? 0)) logged.push(name);
      }
      console.log(`[external-sync] [OBSERVAÇÃO] logged ${logged.length}/${EXTERNAL_SWEEPS.length}: ${logged.join(', ') || '(none — external sync is no-op in dev3)'}`);
    });
  });
});
