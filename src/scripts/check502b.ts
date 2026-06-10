import { request as playwrightRequest } from '@playwright/test';
import { ConfigEnvironment } from '@config/environment.js';

(async () => {
  const cfg = new ConfigEnvironment('qa2');
  const ctx = await playwrightRequest.newContext();

  const body = {
    userName: 'tireAgent',
    setupPassword: 'U0wn_tireAgent_G4eDIH',
    merchantNumber: 'OW90218-0001',
    mainFirstName: 'James',
    mainLastName: 'Khoury',
    mainSSN: '058804041',
    mainCellPhone: `646712${Date.now() % 10000}`,
    emailAddress: `JamesTKhoury${Date.now()}@jourrapide.com`,
    mainAddress1: '1120 S Grand Ave',
    mainCity: 'Los Angeles',
    mainStateOrProvince: 'CA',
    mainPostalCode: '90015',
    mainDOB: '02241987',
    mainEmployerName: 'Costco',
    mainPastBankruptcy: false,
    mainCurrentOrFutureBankruptcy: false,
    languagePreference: 'E',
    iovationFingerprintText: 'fingerPrintText',
    ipaddress: '192.168.0.2',
    desiredPaymentFrequency: 'WEEKLY',
    mainAnnualIncome: 56000,
    mainPayFrequency: 'WEEKLY',
    mainNextPayDate: '05122026',
    mainLastPayDate: '05052026',
    mainEmploymentDuration: '_1_TO_2_YEARS',
    shipToSameAsConsumer: true,
    merchandiseSubtotal: '549.00',
    discountAmount: '0.00',
    deliveryCharge: '25.00',
    installationCharge: '0.00',
    salesTax: '47.00',
    miscellaneousFees: '0.00',
    depositAmount: '0.00',
    orderTotal: '621.00',
    invoiceNumber: 'CA4109',
    lineItem: [{ lineItemLineNumber: '1', lineItemSerialNumber: 'SKU', lineItemProductNumber: 'P', lineItemProductDescription: 'Washer', lineItemProductCategory: 'Appliances', lineItemType: 'D', lineItemQuantityOrdered: '1', lineItemUnitPrice: '596.00', lineItemBasePrice: '549.00', lineItemTaxAmount: '47.00', lineItemDeliveryFee: '25.00', lineItemExtendedDeliveryFee: '25.00', lineItemExtendedPrice: '596.00' }],
  };

  // Attempt 1: only Authorization (like user's curl)
  console.log('--- Attempt 1: only Authorization header ---');
  const r1 = await ctx.post('https://svc-qa2.uownleasing.com/uown/los/sendApplication', {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: cfg.apiAuthorization },
    data: body,
  });
  console.log('status:', r1.status(), 'body:', (await r1.text()).slice(0, 300));

  // Attempt 2: Authorization + all api-key variants (like BaseClient)
  console.log('--- Attempt 2: full BaseClient headers ---');
  const r2 = await ctx.post('https://svc-qa2.uownleasing.com/uown/los/sendApplication', {
    headers: {
      Accept: 'application/json', 'Content-Type': 'application/json',
      Authorization: cfg.apiAuthorization,
      'x-api-key': cfg.apiKey, 'X-API-KEY': cfg.apiKey, 'api-key': cfg.apiKey, 'Api-Key': cfg.apiKey,
    },
    data: { ...body, mainSSN: '058804042', mainCellPhone: `646713${Date.now() % 10000}`, emailAddress: `JamesTKhoury2${Date.now()}@jourrapide.com` },
  });
  console.log('status:', r2.status(), 'body:', (await r2.text()).slice(0, 300));

  await ctx.dispose();
})();
