import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Login
await page.goto('https://merchant-staging.paytomorrow.com/login', { timeout: 30000 });
await page.waitForLoadState('networkidle');
await page.locator('#username').fill('uwon_powersports@paytomorrow.com');
await page.locator('#password').fill('UOwnTest123!');
await page.locator('#kc-login').click();
await page.waitForURL('**/merchant/applications/**', { timeout: 30000 });
console.log('Logged in. URL:', page.url());
await page.waitForTimeout(3000);

// On applications list page — find and click create/new button
console.log('Current URL:', page.url());
const listBtns = await page.locator('button').evaluateAll(els =>
  els.filter(el => el.offsetParent != null)
    .map((el, i) => ({ idx: i, text: (el.textContent || '').trim().slice(0, 80) }))
);
console.log('List page buttons:', JSON.stringify(listBtns, null, 2));

// Click the first visible button (expected to be "Create" or similar)
const firstBtn = page.locator('button').first();
await firstBtn.click();
await page.waitForTimeout(3000);
console.log('After clicking first button, URL:', page.url());

// Check if the page shows "Is the customer physically present" question
const bodyText = await page.locator('body').textContent();
const has_present = bodyText.includes('physically present');
console.log('Has "physically present" question:', has_present);

// Click "No" button
if (has_present) {
  const noBtn = page.locator('button:has-text("No")');
  const noVisible = await noBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log('"No" button visible:', noVisible);

  if (noVisible) {
    await noBtn.click();
    console.log('Clicked "No"');
    await page.waitForTimeout(3000);

    // Take snapshot of current page after clicking No
    console.log('URL after No:', page.url());

    // Find all visible input fields
    const inputs = await page.locator('input').evaluateAll(els =>
      els.filter(el => el.offsetParent != null && el.type !== 'hidden')
        .map(el => ({ type: el.type, name: el.name, id: el.id, placeholder: el.placeholder, classes: el.className.slice(0, 80) }))
    );
    console.log('Visible inputs after No:', JSON.stringify(inputs, null, 2));

    // Find visible buttons
    const buttons = await page.locator('button').evaluateAll(els =>
      els.filter(el => el.offsetParent != null)
        .map(el => ({ text: (el.textContent || '').trim().slice(0, 60), classes: el.className.slice(0, 80) }))
    );
    console.log('Visible buttons after No:', JSON.stringify(buttons, null, 2));

    // Check for heading/labels
    const labels = await page.locator('label, h1, h2, h3, h4, h5, h6').evaluateAll(els =>
      els.filter(el => el.offsetParent != null)
        .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 80) }))
    );
    console.log('Visible labels/headings:', JSON.stringify(labels, null, 2));
  }
}

await browser.close();
