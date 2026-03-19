import { test as setup } from '@playwright/test';
import { ConfigEnvironment } from '../src/config/environment.js';
import { LoginPage } from '../src/pages/login.page.js';

// setup('authenticate for origination', async ({ page }) => {
//   const env = new ConfigEnvironment(process.env.ENV || 'sandbox');
//   const loginPage = new LoginPage(page);

//   await page.goto(env.originationUrl);
//   const creds = env.getCredentials('manager');
//   await loginPage.login(creds.username, creds.password);
//   await page.waitForLoadState('networkidle');
//   await page.context().storageState({ path: '.auth/origination.json' });
// });

setup('authenticate for servicing', async ({ page }) => {
  const env = new ConfigEnvironment(process.env.ENV || 'sandbox');
  const loginPage = new LoginPage(page);

  await page.goto(env.servicingUrl);
  const creds = env.getCredentials('manager');
  await loginPage.login(creds.username, creds.password);
  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: '.auth/servicing.json' });
});