import { test } from '@fixtures/test-context.fixture.js';
import { loginToPortal } from '@helpers/auth.helpers.js';

test.use({ envName: 'qa1' });

test('DOM diagnostic - Dealer Rebate Type field', async ({ page, testEnv }) => {
  test.setTimeout(90_000);

  await loginToPortal(page, testEnv.originationUrl, testEnv);
  await page.goto(`${testEnv.originationUrl}merchantSetting`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // Find the Dealer Rebate Type label and look at sibling elements
  const labelInfo = await page.evaluate(() => {
    const allElements = document.querySelectorAll('label, span, div');
    const rebateLabel = Array.from(allElements).find(
      (el) => el.textContent?.trim() === 'Dealer Rebate Type',
    );
    if (!rebateLabel)
      return {
        error: 'Label not found',
        allLabels: Array.from(document.querySelectorAll('label'))
          .map((e) => e.textContent?.trim())
          .filter(Boolean)
          .slice(0, 30),
      };

    const parent = rebateLabel.parentElement;
    if (!parent) return { error: 'No parent' };

    return {
      labelText: rebateLabel.textContent,
      parentHTML: parent.outerHTML.substring(0, 3000),
    };
  });

  console.log('=== LABEL DOM ===');
  console.log(JSON.stringify(labelInfo, null, 2));

  const selects = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('select')).map((s) => ({
      name: (s as HTMLSelectElement).name,
      id: s.id,
      class: s.className.substring(0, 100),
      optionCount: (s as HTMLSelectElement).options.length,
    }));
  });
  console.log('=== ALL SELECT ELEMENTS ===');
  console.log(JSON.stringify(selects, null, 2));

  // Find elements with DAILY option values
  const dayElements = await page.evaluate(() => {
    const allOpts = Array.from(document.querySelectorAll('option, [role="option"]'));
    return allOpts
      .filter((o) => ['DAILY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].some((v) => o.textContent?.includes(v)))
      .map((o) => ({
        tag: o.tagName,
        text: o.textContent?.trim(),
        parentTag: o.parentElement?.tagName,
        parentClass: o.parentElement?.className?.substring(0, 100),
        parentName: (o.parentElement as HTMLSelectElement)?.name,
      }));
  });
  console.log('=== OPTIONS WITH DAILY/MONTHLY ===');
  console.log(JSON.stringify(dayElements, null, 2));

  // Check combobox / listbox
  const comboboxes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="combobox"], [role="listbox"]')).map((el) => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      class: el.className?.substring(0, 150),
      ariaLabel: el.getAttribute('aria-label'),
      id: el.id,
    }));
  });
  console.log('=== COMBOBOXES/LISTBOXES ===');
  console.log(JSON.stringify(comboboxes, null, 2));
});
