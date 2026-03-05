/**
 * Deep DOM inspection of PayTomorrow contract page.
 * Goes through the full flow: login → create app → finalize → contract
 * Then inspects EVERY element inside the contract blue box for embedded content.
 *
 * Usage: node scripts/inspect-pt-contract-deep.mjs
 */
import { chromium } from 'playwright';

const MERCHANT_URL = 'https://merchant-staging.paytomorrow.com/login';
const USERNAME = 'uwon_powersports@paytomorrow.com';
const PASSWORD = 'UOwnTest123!';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });

  // Monitor ALL network requests to see what loads on the contract page
  const apiCalls = [];
  context.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('paytomorrow.com/api') || url.includes('uown') || url.includes('lender')) {
      const status = resp.status();
      let bodyPreview = '';
      try {
        const text = await resp.text();
        bodyPreview = text.slice(0, 300);
      } catch {}
      apiCalls.push({ url, status, bodyPreview });
      console.log(`[API] ${status} ${url.split('?')[0]}`);
      if (bodyPreview) console.log(`  → ${bodyPreview.slice(0, 200)}`);
    }
  });

  const page = await context.newPage();

  // ── Phase 1: Login ──────────────────────────────────────────────────
  console.log('\n=== Phase 1: Login ===');
  await page.goto(MERCHANT_URL, { timeout: 30000 });
  await page.locator('#username').fill(USERNAME);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#kc-login').click();
  await page.waitForURL('**/merchant/applications/**', { timeout: 30000 });
  console.log('Login successful');

  // ── Phase 2: Create Application (Customer Not Present) ──────────────
  console.log('\n=== Phase 2: Create Application ===');

  // Click the first button to navigate to create page
  await page.waitForTimeout(2000);
  const createBtn = page.locator('button').first();
  await createBtn.waitFor({ state: 'visible', timeout: 15000 });
  await createBtn.click();
  await page.waitForURL('**/create**', { timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log(`On create page: ${page.url()}`);

  // Remove chat widget
  await page.locator('#fc_frame, iframe[id*="chat"], div[class*="freshchat"]').first()
    .evaluate(el => el.remove()).catch(() => {});
  await page.waitForTimeout(1000);

  const ts = Date.now();
  const firstName = `TestDeep${ts}`;
  const lastName = `Inspect${ts}`;
  const phone = `555${String(ts).slice(-7)}`;
  const email = `uown.test+deep${ts}@gmail.com`;
  // SSN not ending in 9 → approved
  const ssn = `${100000000 + Math.floor(Math.random() * 899999998)}`;

  // Click "No" button for "Is the customer physically present in store?"
  const noBtn = page.locator('button:has-text("No"), button.btn:has-text("No")').first();
  await noBtn.waitFor({ state: 'visible', timeout: 15000 });
  await noBtn.click();
  console.log('Clicked "No" — customer not present');
  await page.waitForTimeout(2000);

  // Log what's on the page now
  const pageButtons = await page.locator('button').allTextContents();
  console.log(`Buttons on page: ${pageButtons.join(' | ')}`);

  // Look for form fields — try multiple selectors
  const formFieldIds = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
      tag: el.tagName,
      id: el.id,
      name: el.getAttribute('name') || '',
      type: el.getAttribute('type') || '',
      placeholder: el.getAttribute('placeholder') || '',
      visible: el.offsetParent !== null,
    }));
  });
  console.log('Form fields:', JSON.stringify(formFieldIds, null, 2));

  // Take screenshot to see what's on the page
  await page.screenshot({ path: 'scripts/pt-deep-create-form.png', fullPage: true });

  // Wait for form fields to appear — they may take time after "No" click
  // Fields have IDs: firstName1, lastName1, phone, emailAddress
  const firstNameField = page.locator('#firstName1, #firstName, input[name="firstName1"]').first();
  await firstNameField.waitFor({ state: 'visible', timeout: 15000 });

  // Fill customer info
  await firstNameField.fill(firstName);
  await page.locator('#lastName1, #lastName, input[name="lastName1"]').first().fill(lastName);
  await page.locator('#phone, input[name="phone"]').first().fill(phone);
  await page.locator('#emailAddress, #email, input[name="emailAddress"]').first().fill(email);
  console.log(`Filled: ${firstName} ${lastName} / ${phone} / ${email}`);

  // Initiate Pre Approval
  const initiateBtn = page.locator('button:has-text("Initiate Pre Approval"), button:has-text("Initiate")').first();
  await initiateBtn.waitFor({ state: 'visible', timeout: 10000 });
  await initiateBtn.click();
  console.log('Clicked Initiate Pre Approval');
  await page.waitForTimeout(2000);

  // Confirm "add cart" dialog
  const yesBtn = page.locator('button:has-text("Yes")').first();
  await yesBtn.waitFor({ state: 'visible', timeout: 10000 });
  await yesBtn.click();
  await page.waitForTimeout(3000);
  console.log('Confirmed cart dialog');

  // ── Phase 3: Add Item ──────────────────────────────────────────────
  console.log('\n=== Phase 3: Add Item ===');
  console.log(`Current URL: ${page.url()}`);

  // Wait for address form
  const streetField = page.locator('#street, input[name="street"]').first();
  await streetField.waitFor({ state: 'visible', timeout: 15000 });

  await streetField.fill('555 Test Street');
  await page.locator('#city, input[name="city"]').first().fill('Los Angeles');

  // PrimeNG state dropdown
  const dropdown = page.locator('#state.p-dropdown, .p-dropdown').first();
  if (await dropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
    await dropdown.click();
    await page.waitForTimeout(500);
    await page.locator('.p-dropdown-item').filter({ hasText: 'California' }).first().click();
  }

  await page.locator('#zip, input[name="zip"]').first().fill('90001');
  await page.locator('#orderId, input[name="orderId"]').first().fill('1579876780');
  await page.locator('#itemDescription, input[name="itemDescription"]').first().fill('Item Test');
  await page.locator('#quantity, input[name="quantity"]').first().fill('1');
  await page.locator('#price, input[name="price"]').first().fill('1000');
  console.log('Filled cart details');

  // Add item
  await page.locator('button:has-text("Add")').first().click();
  await page.waitForTimeout(2000);

  // Fill tax/shipping/discount = 0
  for (const sel of ['#taxRate', '#shipping', '#discount']) {
    const f = page.locator(sel).first();
    if (await f.isVisible({ timeout: 2000 }).catch(() => false)) await f.fill('0');
  }

  // Send to customer
  const sendBtn = page.locator('button:has-text("Send to customer")').first();
  await sendBtn.waitFor({ state: 'visible', timeout: 10000 });
  await sendBtn.click();
  await page.waitForTimeout(3000);
  console.log('Clicked Send to Customer');

  // Navigate to detail
  await page.waitForURL('**/merchant/applications/**', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const detailRow = page.locator('tr').filter({ hasText: 'IN-PROGRESS' }).first();
  await detailRow.waitFor({ state: 'visible', timeout: 15000 });
  await detailRow.locator('a[href*="details"]').first().click();
  await page.waitForTimeout(3000);
  console.log(`App detail page: ${page.url()}`);

  // Click Send Cart and capture finalization URL
  const sendCartPromise = page.waitForResponse(
    resp => resp.url().includes('/send/cart') && resp.status() === 200,
    { timeout: 30000 },
  );

  const sendCartBtn = page.locator('button:has-text("Send Cart")').first();
  await sendCartBtn.waitFor({ state: 'visible', timeout: 15000 });
  await sendCartBtn.click();

  const confirmYes = page.locator('button:has-text("Yes")').first();
  await confirmYes.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await confirmYes.isVisible()) await confirmYes.click();

  let finalizationUrl = '';
  try {
    const resp = await sendCartPromise;
    const body = await resp.json();
    finalizationUrl = body.url || '';
    console.log(`Finalization URL: ${finalizationUrl}`);
  } catch (e) {
    console.log(`Could not capture /send/cart response: ${e.message}`);
  }

  if (!finalizationUrl) {
    const bodyText = await page.locator('body').textContent() ?? '';
    const tokenMatch = bodyText.match(/Token\s*:\s*([a-f0-9]{32})/);
    if (tokenMatch) {
      finalizationUrl = `https://api-staging-paytomorrow.paytomorrow.com/api/app/consumer/verify/${tokenMatch[1]}`;
      console.log(`Fallback URL: ${finalizationUrl}`);
    }
  }

  if (!finalizationUrl) {
    console.error('NO FINALIZATION URL FOUND');
    await page.screenshot({ path: 'scripts/pt-deep-no-url.png', fullPage: true });
    await browser.close();
    return;
  }

  // ── Phase 4: Finalization Flow ──────────────────────────────────────
  console.log('\n=== Phase 4: Finalization Flow ===');
  const newPage = await context.newPage();
  await newPage.goto(finalizationUrl, { timeout: 30000 });
  await newPage.waitForLoadState('networkidle').catch(() => {});
  console.log(`Finalization page URL: ${newPage.url()}`);

  // Handle verify/personal flow
  // Step 1: Terms agreement + submit
  const termsCheckbox = newPage.locator("input[type='checkbox']").first();
  if (await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await termsCheckbox.check().catch(() => {});
    console.log('Checked terms');
  }

  const step1Submit = newPage.locator("button[type='submit'], button:has-text('Submit'), button:has-text('Continue')").first();
  if (await step1Submit.isVisible({ timeout: 3000 }).catch(() => false)) {
    await step1Submit.click();
    await newPage.waitForTimeout(3000);
    console.log('Submitted step 1');
  }

  // OTP
  await newPage.waitForURL('**/verify/otp**', { timeout: 30000 }).catch(() => {});
  await newPage.locator('#spinner.backdrop, .backdrop').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

  const otpInputs = newPage.locator('.otp-input, input[autocomplete="one-time-code"]');
  const otpCount = await otpInputs.count();
  if (otpCount >= 5) {
    for (let i = 0; i < 5; i++) await otpInputs.nth(i).fill('12345'[i]);
    await newPage.locator("button:has-text('Continue'), button[type='submit']").first().click();
    await newPage.waitForTimeout(3000);
    console.log('OTP submitted');
  }

  await newPage.locator('#spinner.backdrop, .backdrop').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await newPage.waitForTimeout(2000);
  console.log(`After OTP → URL: ${newPage.url()}`);

  // SSN
  const ssnInput = newPage.locator("input[name='ssn'], input[maxlength='9'], input[type='password']").first();
  if (await ssnInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await ssnInput.fill(ssn);
    console.log(`Filled SSN: ***${ssn.slice(-4)}`);
  }

  // DOB
  const dobMonth = newPage.locator('#dobMonth, select[name="dobMonth"]').first();
  if (await dobMonth.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dobMonth.selectOption({ label: 'June' }).catch(() => {});
    console.log('DOB month: June');
  }
  const dobDay = newPage.locator('#dobDay, select[name="dobDay"]').first();
  if (await dobDay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dobDay.selectOption('17').catch(() => {});
  }
  const dobYear = newPage.locator('#dobYear, select[name="dobYear"]').first();
  if (await dobYear.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dobYear.selectOption('1984').catch(() => {});
  }

  // Pay cycle
  const payCycle = newPage.locator('#payCycle, select[name="payCycle"]').first();
  if (await payCycle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await payCycle.selectOption({ label: 'Every two weeks' }).catch(() => {});
    console.log('Pay cycle: Every two weeks');
  }

  // Pay date
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const payMonth = newPage.locator('#payMonth, select[name="payMonth"]').first();
  if (await payMonth.isVisible({ timeout: 2000 }).catch(() => false)) {
    await payMonth.selectOption({ label: monthNames[futureDate.getMonth()] }).catch(() => {});
  }
  const payDay = newPage.locator('#payDay, select[name="payDay"]').first();
  if (await payDay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await payDay.selectOption(String(futureDate.getDate())).catch(() => {});
  }

  // Submit step 2
  const step2Submit = newPage.locator("button:has-text('Continue'), button[type='submit']").first();
  if (await step2Submit.isVisible({ timeout: 3000 }).catch(() => false)) {
    await step2Submit.click();
    await newPage.waitForTimeout(3000);
    console.log('Submitted step 2 (identity/DOB/SSN)');
  }

  // Confirm page
  await newPage.waitForURL('**/confirm**', { timeout: 30000 }).catch(() => {});
  console.log(`After step 2 → URL: ${newPage.url()}`);

  const confirmSubmit = newPage.locator("button[type='submit'], button:has-text('Submit')").first();
  if (await confirmSubmit.isVisible({ timeout: 5000 }).catch(() => false)) {
    await confirmSubmit.click();
    await newPage.waitForTimeout(3000);
    console.log('Submitted confirm');
  }

  // Employment page
  await newPage.waitForURL('**/employment**', { timeout: 30000 }).catch(() => {});
  console.log(`After confirm → URL: ${newPage.url()}`);

  // Fill employment
  const incomeField = newPage.locator('#monthlyIncome, input[name="monthlyIncome"]').first();
  if (await incomeField.isVisible({ timeout: 5000 }).catch(() => false)) {
    await incomeField.fill('4300');
  }

  const pastDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const empPayMonth = newPage.locator('#payMonth, select[name="payMonth"]').first();
  if (await empPayMonth.isVisible({ timeout: 2000 }).catch(() => false)) {
    await empPayMonth.selectOption({ label: monthNames[pastDate.getMonth()] }).catch(() => {});
  }
  const empPayDay = newPage.locator('#payDay, select[name="payDay"]').first();
  if (await empPayDay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await empPayDay.selectOption(String(pastDate.getDate())).catch(() => {});
  }

  const employerField = newPage.locator('#employerName, input[name="employerName"]').first();
  if (await employerField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await employerField.fill('Feed Me Money Ltd.');
  }

  const empSubmit = newPage.locator("button:has-text('Continue'), button[type='submit']").first();
  if (await empSubmit.isVisible({ timeout: 3000 }).catch(() => false)) {
    await empSubmit.click();
    await newPage.waitForTimeout(5000);
    console.log('Submitted employment');
  }

  // Offers page
  await newPage.waitForURL('**/offers**', { timeout: 60000 }).catch(() => {});
  console.log(`After employment → URL: ${newPage.url()}`);
  await newPage.waitForTimeout(3000);

  // Check for "cart exceeded" error
  const offerText = await newPage.locator('body').textContent() ?? '';
  if (offerText.includes('cart value exceeded') || offerText.includes('exceeded your maximum')) {
    console.error('CART EXCEEDED ERROR');
    await newPage.screenshot({ path: 'scripts/pt-deep-exceeded.png', fullPage: true });
    await browser.close();
    return;
  }

  // Select first offer
  const selectOffer = newPage.locator('button:has-text("Select"), button:has-text("Choose"), button.select-offer').first();
  await selectOffer.waitFor({ state: 'visible', timeout: 60000 });
  console.log(`Offer button found, clicking...`);
  await selectOffer.click();
  await newPage.waitForTimeout(5000);

  // ── Phase 5: CONTRACT PAGE — DEEP DOM INSPECTION ────────────────────
  console.log('\n=== Phase 5: CONTRACT PAGE DEEP INSPECTION ===');
  console.log(`Contract page URL: ${newPage.url()}`);

  // Wait for full load
  await newPage.waitForLoadState('networkidle').catch(() => {});
  await newPage.waitForTimeout(5000);

  // Screenshot
  await newPage.screenshot({ path: 'scripts/pt-deep-contract-1.png', fullPage: true });

  // ── DEEP DOM INSPECTION ──────────────────────────────────────────
  const domInfo = await newPage.evaluate(() => {
    const results = {
      url: location.href,
      title: document.title,
      allTags: {},
      iframes: [],
      objects: [],
      embeds: [],
      shadowHosts: [],
      scrollableElements: [],
      formElements: [],
      angularComponents: [],
      divWithBorder: [],
      allButtons: [],
      allInputs: [],
      bodyHTML: '',
    };

    // Count all tags
    document.querySelectorAll('*').forEach(el => {
      const tag = el.tagName.toLowerCase();
      results.allTags[tag] = (results.allTags[tag] || 0) + 1;
    });

    // Find iframes
    document.querySelectorAll('iframe').forEach(el => {
      results.iframes.push({
        src: el.src || el.getAttribute('src') || '',
        id: el.id || '',
        name: el.name || '',
        className: el.className || '',
        width: el.offsetWidth,
        height: el.offsetHeight,
        style: el.getAttribute('style') || '',
        visible: el.offsetParent !== null,
        display: getComputedStyle(el).display,
      });
    });

    // Find <object> elements
    document.querySelectorAll('object').forEach(el => {
      results.objects.push({
        data: el.data || '',
        type: el.type || '',
        id: el.id || '',
        visible: el.offsetParent !== null,
      });
    });

    // Find <embed> elements
    document.querySelectorAll('embed').forEach(el => {
      results.embeds.push({
        src: el.src || '',
        type: el.type || '',
        visible: el.offsetParent !== null,
      });
    });

    // Find shadow DOM hosts
    document.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        results.shadowHosts.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: el.className || '',
          childCount: el.shadowRoot.childElementCount,
          innerHTML: el.shadowRoot.innerHTML?.slice(0, 500) || '',
        });
      }
    });

    // Angular components
    document.querySelectorAll('*').forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (tag.includes('-') && (tag.startsWith('app-') || tag.startsWith('ng-'))) {
        results.angularComponents.push({
          tag,
          id: el.id || '',
          className: el.className || '',
          childCount: el.childElementCount,
          innerHTML: el.innerHTML.slice(0, 500),
          visible: el.offsetParent !== null,
        });
      }
    });

    // Scrollable elements
    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if ((cs.overflow === 'auto' || cs.overflow === 'scroll' ||
           cs.overflowY === 'auto' || cs.overflowY === 'scroll') ||
          el.scrollHeight > el.clientHeight + 20) {
        results.scrollableElements.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: el.className?.toString().slice(0, 100) || '',
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          overflow: cs.overflow,
          overflowY: cs.overflowY,
          childCount: el.childElementCount,
          innerHTMLLen: el.innerHTML.length,
          firstChild: el.innerHTML.slice(0, 300),
        });
      }
    });

    // Bordered elements (blue box candidates)
    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.borderStyle !== 'none' && cs.borderWidth !== '0px' &&
          el.clientHeight > 50 && el.clientWidth > 200) {
        results.divWithBorder.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: el.className?.toString().slice(0, 100) || '',
          borderColor: cs.borderColor,
          borderWidth: cs.borderWidth,
          width: el.clientWidth,
          height: el.clientHeight,
          scrollHeight: el.scrollHeight,
          childCount: el.childElementCount,
          innerHTMLLen: el.innerHTML.length,
          firstChild: el.innerHTML.slice(0, 500),
          innerText: el.innerText?.slice(0, 200) || '',
        });
      }
    });

    // Form elements
    document.querySelectorAll('input, select, textarea, button').forEach(el => {
      results.formElements.push({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        name: el.getAttribute('name') || '',
        id: el.id || '',
        className: el.className?.toString().slice(0, 80) || '',
        text: el.textContent?.trim().slice(0, 50) || '',
        visible: el.offsetParent !== null,
        disabled: el.hasAttribute('disabled'),
      });
    });

    // Body HTML
    results.bodyHTML = document.body.innerHTML.slice(0, 8000);

    return results;
  });

  console.log('\n── TAG COUNTS ──');
  console.log(JSON.stringify(domInfo.allTags, null, 2));

  console.log('\n── IFRAMES ──');
  console.log(JSON.stringify(domInfo.iframes, null, 2));

  console.log('\n── OBJECTS ──');
  console.log(JSON.stringify(domInfo.objects, null, 2));

  console.log('\n── EMBEDS ──');
  console.log(JSON.stringify(domInfo.embeds, null, 2));

  console.log('\n── SHADOW HOSTS ──');
  console.log(JSON.stringify(domInfo.shadowHosts, null, 2));

  console.log('\n── ANGULAR COMPONENTS ──');
  for (const c of domInfo.angularComponents) {
    console.log(`  <${c.tag}> children=${c.childCount} visible=${c.visible}`);
    console.log(`    ${c.innerHTML.slice(0, 200)}`);
  }

  console.log('\n── SCROLLABLE ELEMENTS ──');
  for (const el of domInfo.scrollableElements) {
    console.log(`  <${el.tag}#${el.id}.${el.className}> scroll=${el.scrollHeight}/${el.clientHeight} children=${el.childCount} htmlLen=${el.innerHTMLLen}`);
    console.log(`    ${el.firstChild.slice(0, 200)}`);
  }

  console.log('\n── BORDERED ELEMENTS ──');
  for (const el of domInfo.divWithBorder) {
    console.log(`  <${el.tag}#${el.id}.${el.className}>`);
    console.log(`    border: ${el.borderWidth} ${el.borderColor}`);
    console.log(`    size: ${el.width}x${el.height} scroll=${el.scrollHeight} children=${el.childCount}`);
    console.log(`    text: ${el.innerText?.slice(0, 100)}`);
    console.log(`    html: ${el.firstChild?.slice(0, 200)}`);
  }

  console.log('\n── FORM ELEMENTS ──');
  for (const el of domInfo.formElements) {
    console.log(`  <${el.tag} type="${el.type}" name="${el.name}" id="${el.id}" visible=${el.visible} disabled=${el.disabled}> "${el.text.slice(0, 30)}"`);
  }

  console.log('\n── BODY HTML (first 5000 chars) ──');
  console.log(domInfo.bodyHTML.slice(0, 5000));

  // ── Wait for lazy content and inspect again ──────────
  console.log('\n=== Waiting 20s for lazy content... ===');
  await newPage.waitForTimeout(20000);
  await newPage.screenshot({ path: 'scripts/pt-deep-contract-2.png', fullPage: true });

  // Check for new API calls
  console.log('\n── ALL API CALLS ──');
  for (const call of apiCalls) {
    console.log(`  ${call.status} ${call.url.split('?')[0]}`);
  }

  // Check if scrollable areas appeared
  const afterWait = await newPage.evaluate(() => {
    const items = [];
    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if ((cs.overflow === 'auto' || cs.overflow === 'scroll' ||
           cs.overflowY === 'auto' || cs.overflowY === 'scroll') &&
          el.clientHeight > 50) {
        el.scrollTo(0, el.scrollHeight);
        items.push({
          tag: el.tagName.toLowerCase(),
          id: el.id,
          cls: el.className?.toString().slice(0, 80),
          scroll: el.scrollHeight,
          client: el.clientHeight,
          atBottom: Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 5,
        });
      }
    });
    return items;
  });

  console.log('\n── AFTER 20s WAIT - SCROLLABLE ──');
  for (const el of afterWait) {
    console.log(`  <${el.tag}#${el.id}.${el.cls}> scroll=${el.scroll}/${el.client} atBottom=${el.atBottom}`);
  }

  await newPage.screenshot({ path: 'scripts/pt-deep-contract-3.png', fullPage: true });

  // Keep browser open for manual inspection
  console.log('\n=== BROWSER OPEN FOR MANUAL INSPECTION ===');
  console.log('Press Ctrl+C to close');
  await new Promise(() => {});
})();
