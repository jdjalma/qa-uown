import https from 'node:https';

const auth = 'knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2';
const body = JSON.stringify({
  userName: 'tireAgent', setupPassword: 'U0wn_tireAgent_G4eDIH', merchantNumber: 'OW90218-0001',
  mainFirstName: 'James', mainLastName: 'Khoury', mainSSN: '058804041',
  mainCellPhone: '6467125831',
  emailAddress: `JamesTKhouryNode${Date.now()}@jourrapide.com`,
  mainAddress1: '1120 S Grand Ave', mainCity: 'Los Angeles', mainStateOrProvince: 'CA', mainPostalCode: '90015',
  mainDOB: '02241987', mainEmployerName: 'Costco', mainPastBankruptcy: false, mainCurrentOrFutureBankruptcy: false,
  languagePreference: 'E', iovationFingerprintText: 'fingerPrintText', ipaddress: '192.168.0.2',
  desiredPaymentFrequency: 'WEEKLY', mainAnnualIncome: 56000, mainPayFrequency: 'WEEKLY',
  mainNextPayDate: '05122026', mainLastPayDate: '05052026', mainEmploymentDuration: '_1_TO_2_YEARS',
  shipToSameAsConsumer: true,
  merchandiseSubtotal: '549.00', discountAmount: '0.00', deliveryCharge: '25.00', installationCharge: '0.00',
  salesTax: '47.00', miscellaneousFees: '0.00', depositAmount: '0.00', orderTotal: '621.00', invoiceNumber: 'CA4109',
  lineItem: [{ lineItemLineNumber: '1', lineItemSerialNumber: 'SKU', lineItemProductNumber: 'P', lineItemProductDescription: 'Washer', lineItemProductCategory: 'Appliances', lineItemType: 'D', lineItemQuantityOrdered: '1', lineItemUnitPrice: '596.00', lineItemBasePrice: '549.00', lineItemTaxAmount: '47.00', lineItemDeliveryFee: '25.00', lineItemExtendedDeliveryFee: '25.00', lineItemExtendedPrice: '596.00' }],
});

const req = https.request({
  hostname: 'svc-qa2.uownleasing.com',
  path: '/uown/los/sendApplication',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Authorization': auth,
  },
}, (res) => {
  console.log('status:', res.statusCode);
  console.log('headers:', res.headers);
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => console.log('body:', data.slice(0, 400)));
});
req.on('error', (e) => console.error('err:', e));
req.write(body);
req.end();
