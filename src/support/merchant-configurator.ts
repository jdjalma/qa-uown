/**
 * Merchant Configurator
 *
 * Orchestrates merchant setup/teardown via API with automatic snapshot & restore.
 * Designed to be used as a Playwright fixture — restoreAll() runs in teardown.
 *
 * Usage:
 *   // Apply preset
 *   await merchantConfig.configure('tireagent', 'signedToFunding');
 *
 *   // Apply preset + overrides
 *   await merchantConfig.configureWith('tireagent', 'withDealerFees', { maxApprovalAmount: 15000 });
 *
 *   // Apply custom state
 *   await merchantConfig.configure('tireagent', { fraudThreshold: 500, uwPipeline: 'MANUAL' });
 *
 *   // Restore all merchants to original state (automatic in fixture teardown)
 *   await merchantConfig.restoreAll();
 */
import { MerchantClient } from '../api/clients/merchant.client.js';
import type { MerchantDesiredState, MerchantPreset } from '../api/bodies/merchant-config.body.js';
import { MERCHANT_PRESETS } from '../api/bodies/merchant-config.body.js';
import type { MerchantDetail } from '../api/responses/merchant.response.js';
import { getMerchant } from '../data/merchants.js';

export class MerchantConfigurator {
  /** Snapshots of original state keyed by merchantPk — used for restore */
  private snapshots = new Map<number, Record<string, unknown>>();

  constructor(private client: MerchantClient) {}

  /**
   * Resolve a merchant by refCode, returning full detail from the API.
   * Throws if not found.
   */
  async resolve(refCode: string): Promise<MerchantDetail> {
    const res = await this.client.getMerchantsByRefCode(refCode);
    const list = Array.isArray(res.body) ? res.body : [];
    const merchant = list[0];
    const pk = Number(merchant?.merchantInfo?.merchantPK ?? merchant?.pk ?? 0);
    if (!merchant || !pk) {
      throw new Error(`Merchant not found for refCode: "${refCode}"`);
    }
    return merchant;
  }

  /**
   * Apply a preset or custom state to a merchant.
   * Automatically snapshots the current state for later restore.
   *
   * @param refCode - Merchant ref code (e.g. 'tireagent', 'kornerstone')
   * @param state - A preset name ('signedToFunding') or a custom MerchantDesiredState object
   * @returns The merchant detail with the applied state
   */
  async configure(
    refCode: string,
    state: MerchantPreset | MerchantDesiredState,
  ): Promise<MerchantDetail> {
    const merchant = await this.resolve(refCode);
    const desired = typeof state === 'string' ? MERCHANT_PRESETS[state] : state;
    const pk = Number(merchant.merchantInfo?.merchantPK ?? merchant.pk ?? 0);

    // Only snapshot once per merchant — first configure wins
    if (!this.snapshots.has(pk)) {
      this.snapshots.set(pk, this.extractCurrentState(merchant, desired));
    }

    await this.client.updateMerchants({
      merchantPks: [pk],
      merchantData: desired,
    });

    return { ...merchant, ...desired };
  }

  /**
   * Configure a merchant by its catalog name (e.g. 'TireAgent', 'ProgressMobility').
   * Resolves the refCode from the static merchant catalog, then calls configure().
   */
  async configureByName(
    merchantName: string,
    state: MerchantPreset | MerchantDesiredState,
  ): Promise<MerchantDetail> {
    const config = getMerchant(merchantName);
    const refCode = config.refCode ?? merchantName.toLowerCase();
    return this.configure(refCode, state);
  }

  /**
   * Apply a preset with additional overrides.
   * Convenience for: configure(refCode, { ...preset, ...overrides })
   */
  async configureWith(
    refCode: string,
    preset: MerchantPreset,
    overrides: Partial<MerchantDesiredState>,
  ): Promise<MerchantDetail> {
    return this.configure(refCode, { ...MERCHANT_PRESETS[preset], ...overrides });
  }

  /**
   * Restore all configured merchants to their original state.
   * Called automatically in fixture teardown.
   * Safe to call multiple times — clears snapshots after restore.
   */
  async restoreAll(): Promise<void> {
    for (const [pk, original] of this.snapshots) {
      try {
        await this.client.updateMerchants({
          merchantPks: [pk],
          merchantData: original,
        });
      } catch (err) {
        console.warn(`[MerchantConfigurator] Failed to restore merchant pk=${pk}:`, err);
      }
    }
    this.snapshots.clear();
  }

  /** Check if any merchants have been configured (have pending snapshots) */
  get hasPendingRestores(): boolean {
    return this.snapshots.size > 0;
  }

  /**
   * Extract only the fields we're about to change from the current merchant state.
   * This way restore only touches what was modified.
   */
  private extractCurrentState(
    merchant: MerchantDetail,
    desired: MerchantDesiredState,
  ): Record<string, unknown> {
    const snapshot: Record<string, unknown> = {};
    for (const key of Object.keys(desired)) {
      snapshot[key] = merchant[key] ?? null;
    }
    return snapshot;
  }
}
