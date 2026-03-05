import type { Locator } from '@playwright/test';
import { sleep } from './common.helpers.js';
import { SELECTORS } from '../selectors/common.selectors.js';

/**
 * Abstraction for locator resolution — Page, FrameLocator, and Frame all implement
 * a `.locator(selector)` method that returns a Locator. This allows the shared
 * Signwell e-sign flow to work in iframe, direct-page, and nested-frame contexts.
 */
export type LocatorSource = {
  locator(selector: string): Locator;
};

/**
 * Fill a single Signwell field (signature or initials) and invoke the Sign All action.
 *
 * Detects whether the current field is a signature (callout) or initials (avatar),
 * clicks it, types the appropriate text, and delegates to the provided `clickSignAll`
 * callback for the Sign All action.
 */
export async function fillSignwellField(
  source: LocatorSource,
  label: string,
  fieldIdx: number,
  clickSignAll: () => Promise<void>,
): Promise<void> {
  const callout = source.locator(SELECTORS.signwellCallout).first();
  const avatar = source.locator(SELECTORS.signwellAvatarWrapper).first();
  const isCalloutVisible = await callout.isVisible({ timeout: 3_000 }).catch(() => false);
  const isAvatarVisible = await avatar.isVisible({ timeout: 1_000 }).catch(() => false);

  if (!isCalloutVisible && !isAvatarVisible) {
    console.log(`[ESign ${label}] Field ${fieldIdx + 1}: No callout/avatar visible`);
    return;
  }

  const fieldTarget = isCalloutVisible ? callout : avatar;
  const fieldType = isCalloutVisible ? 'signature/callout' : 'initials/avatar';
  await fieldTarget.click();
  console.log(`[ESign ${label}] Field ${fieldIdx + 1}: Clicked ${fieldType}`);
  await sleep(2_000);

  const signatureInput = source.locator(SELECTORS.signwellSignatureType);
  const initialsInput = source.locator(SELECTORS.signwellInitialsType);
  let typeInput: Locator | null = null;
  if (await signatureInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    typeInput = signatureInput;
  } else if (await initialsInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    typeInput = initialsInput;
  }

  if (typeInput) {
    await typeInput.fill(isCalloutVisible ? 'est' : 'ing');
    console.log(`[ESign ${label}] Field ${fieldIdx + 1}: Typed "${isCalloutVisible ? 'est' : 'ing'}"`);
    await sleep(1_000);
    await clickSignAll();
    console.log(`[ESign ${label}] Field ${fieldIdx + 1}: Clicked Sign All`);
    await sleep(5_000);
  } else {
    await clickSignAll().catch(() => {});
    console.log(`[ESign ${label}] Field ${fieldIdx + 1}: No type input — tried Sign All`);
    await sleep(3_000);
  }
}

/**
 * Complete the full Signwell e-sign flow: Start → fill all fields → Finish.
 *
 * Iterates through up to 15 fields using a generic field-loop approach.
 * Each field is detected via callout/avatar visibility and filled accordingly.
 * The `clickSignAll` callback is invoked after each field fill to apply the
 * signature/initials everywhere.
 */
export async function completeSignwellFlow(
  source: LocatorSource,
  label: string,
  clickSignAll: () => Promise<void>,
): Promise<void> {
  // Step 1: Click "Click to Start"
  const startBtn = source.locator(SELECTORS.signwellStart);
  await startBtn.waitFor({ state: 'visible', timeout: 120_000 });
  await startBtn.click();
  console.log(`[ESign ${label}] Clicked Start`);
  await sleep(1_000);

  // Step 2: Fill all fields in a loop
  const MAX_FIELDS = 15;
  for (let fieldIdx = 0; fieldIdx < MAX_FIELDS; fieldIdx++) {
    const finishBtn = source.locator(SELECTORS.signwellFinish);
    if (await finishBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      console.log(`[ESign ${label}] Finish button visible after ${fieldIdx} field(s) — done filling`);
      break;
    }

    await fillSignwellField(source, label, fieldIdx, clickSignAll);

    const nextField = source.locator(SELECTORS.signwellNextField);
    if (await nextField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nextField.click();
      console.log(`[ESign ${label}] Clicked Next Field after field ${fieldIdx + 1}`);
      await sleep(2_000);
    } else {
      console.log(`[ESign ${label}] No Next Field after field ${fieldIdx + 1} — checking Finish`);
      break;
    }
  }

  // Step 3: Click Finish
  const finishBtn = source.locator(SELECTORS.signwellFinish);
  await finishBtn.waitFor({ state: 'visible', timeout: 30_000 });
  await finishBtn.click();
  console.log(`[ESign ${label}] Clicked Finish`);
  await sleep(500);
}

/**
 * Click "Sign All" / "Save & Apply Everywhere" via visible link elements.
 *
 * Works with any LocatorSource (Page, FrameLocator, Frame). Falls back to
 * clicking the last action button in `.signature-actions` if the explicit
 * "Sign All" link is not found.
 */
export async function clickSignAllViaLink(source: LocatorSource): Promise<void> {
  const signAllBtn = source.locator(SELECTORS.signwellSignAllLink).first();
  if (await signAllBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await signAllBtn.click();
  } else {
    // Fallback: click the last action button ("Save"/"Sign All")
    const actionBtns = source.locator(`${SELECTORS.signwellSignatureActions} a`);
    const lastBtn = actionBtns.last();
    if (await lastBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await lastBtn.click();
    } else {
      await actionBtns.first().click();
    }
  }
}
