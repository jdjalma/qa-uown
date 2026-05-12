/**
 * contract-pdf.helper.ts — DOC-12 pipeline: capture + parse + cross-validate
 *   GowSign contract PDF.
 *
 * Pipeline:
 *   1. captureContractPdf(page, srcUrl) — opens the GowSign document URL in a
 *      new tab and uses Playwright's `page.pdf()` to render the rendered HTML
 *      to a real PDF buffer. Works without GOWSIGN_API_KEY.
 *   2. extractContractValues(buffer) — uses pdf-parse to extract text, then
 *      regex extractors to pull structured fields.
 *   3. crossValidateContract(extracted, inputs) — compares each PDF-extracted
 *      field with the API/`uown_esign_document.request` snapshot, money fields
 *      with $0.01 tolerance.
 *
 * Why HTML→PDF instead of GowSign's signed-PDF download:
 *   - qa2 doesn't have `GOWSIGN_API_KEY` available to fetch the signed PDF
 *   - DOC-13 confirms the standalone Download button is HIDDEN in embedMode
 *   - Rendering the same HTML the customer sees gives an equivalent text
 *     surface for cross-validation, which is the spec intent (US-DOC-12).
 */
import { PDFParse } from 'pdf-parse';
import type { Page } from '@playwright/test';

export interface PdfEpoChartRow {
  paymentNumber: number;
  payment: number;
  epo: number;
}

export interface ContractValues {
  agreementNumber?: string;
  lesseeName?: string;
  lessorName?: string;
  cashPrice?: number;
  costOfRental?: number;
  totalOfPayments?: number;
  paymentAmount?: number;
  numberOfPayments?: number;
  rentalPeriod?: string;
  epoChart: PdfEpoChartRow[];
  rawText: string;
}

const MONEY_RE = /\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/;

function parseMoney(s: string | number | undefined | null): number | undefined {
  if (s === undefined || s === null) return undefined;
  const str = String(s);
  const m = str.match(MONEY_RE);
  if (!m) return undefined;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function extractAfterLabel(
  text: string,
  labelPatterns: string[],
  windowChars = 60,
): string | undefined {
  for (const label of labelPatterns) {
    const re = new RegExp(`${label}[\\s:]*([\\s\\S]{0,${windowChars}})`, 'i');
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  return undefined;
}

export async function extractContractValues(pdfData: Buffer | Uint8Array): Promise<ContractValues> {
  const data = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);
  const parser = new PDFParse({ data });
  const result = await parser.getText();
  await parser.destroy();
  const text = result.text ?? '';
  const compact = text.replace(/\s+/g, ' ');

  const agMatch =
    compact.match(/Agreement\s*(?:#|Number)\s*[:#]?\s*([A-Z0-9_\-]+)/i) ??
    compact.match(/(UOWN_[0-9]+_[0-9]+)/);
  const agreementNumber = agMatch?.[1];

  const lesseeMatch = compact.match(
    /Lessee\s*(?:Name)?\s*[:]?\s*([A-Za-z][A-Za-z\s.'\-]+?)(?:\s+(?:DOB|Address|SSN|Email|Phone|City|State|Zip|Lessor)|\s{2,}|$)/i,
  );
  const lesseeName = lesseeMatch?.[1]?.trim();

  const lessorMatch =
    compact.match(/Lessor\s*(?:Name)?\s*[:]?\s*([A-Za-z][A-Za-z0-9\s,.'\-]+?)(?:\s{2,}|\.|$)/i) ??
    compact.match(/\b(Uown(?:\s+Leasing)?|Mollie\s+LLC)\b/i);
  const lessorName = lessorMatch?.[1]?.trim();

  const cashPrice = parseMoney(extractAfterLabel(compact, ['Cash\\s*Price', 'Property\\s*Cash\\s*Price'], 30));
  const costOfRental = parseMoney(extractAfterLabel(compact, ['Cost\\s*of\\s*(?:Rental|Lease)'], 30));
  const totalOfPayments = parseMoney(
    extractAfterLabel(compact, ['Total\\s*Of\\s*Payments', 'Total\\s*Cost', 'Total\\s*Payments'], 30),
  );
  const paymentAmount = parseMoney(
    extractAfterLabel(compact, ['Payment\\s*Amount', 'Regular\\s*Payment', 'Periodic\\s*Payment'], 30),
  );

  const nopMatch = compact.match(/Number\s*of\s*Payments?\s*[:]?\s*(\d{1,4})/i);
  const numberOfPayments = nopMatch ? Number(nopMatch[1]) : undefined;

  const rpMatch = compact.match(/\b(WEEKLY|BI[-\s]?WEEKLY|MONTHLY|SEMI[-\s]?MONTHLY)\b/i);
  const rentalPeriod = rpMatch?.[1]?.toUpperCase().replace(/\s+/g, '-');

  const epoChart: PdfEpoChartRow[] = [];
  const epoRe = /\b(\d{1,3})\s+\$?(\d+\.\d{2})\s*(?:\(plus\s*tax\))?\s+\$?(\d+\.\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = epoRe.exec(compact)) !== null) {
    const pn = Number(m[1]);
    if (pn >= 1 && pn <= 200 && epoChart.findIndex((r) => r.paymentNumber === pn) === -1) {
      epoChart.push({ paymentNumber: pn, payment: Number(m[2]), epo: Number(m[3]) });
    }
  }

  return {
    agreementNumber,
    lesseeName,
    lessorName,
    cashPrice,
    costOfRental,
    totalOfPayments,
    paymentAmount,
    numberOfPayments,
    rentalPeriod,
    epoChart,
    rawText: text,
  };
}

export async function captureContractPdf(page: Page, sourceUrl: string): Promise<Buffer> {
  const ctx = page.context();
  const tab = await ctx.newPage();
  try {
    await tab.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await tab.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    // Allow Strapi-template variables to settle before printing.
    await tab.waitForTimeout(2_000);
    return await tab.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
    });
  } finally {
    await tab.close();
  }
}

export interface ValidationField {
  name: string;
  api?: number | string;
  pdf?: number | string;
  ok: boolean;
}

function moneyEqual(a?: number, b?: number, tolDollars = 0.01): boolean {
  if (a === undefined || b === undefined) return false;
  return Math.abs(a - b) <= tolDollars + 1e-9;
}

export interface CrossValidateInput {
  paymentDetails?: {
    regularPaymentWithTax?: string | number;
    planId?: string;
    termInMonths?: number;
  };
  esignRequest?: {
    contractAmount?: string;
    costPrice?: string;
    costOfLease?: string;
    contractNumber?: string;
    customerFirstName?: string;
    customerLastName?: string;
    paymentFrequencyDesc?: string;
    numOfMonths?: string;
    totalNumberOfPayments?: string;
  };
}

export interface CrossValidateResult {
  fields: ValidationField[];
  okCount: number;
  totalCount: number;
  allOk: boolean;
}

export function crossValidateContract(
  extracted: ContractValues,
  inputs: CrossValidateInput,
): CrossValidateResult {
  const fields: ValidationField[] = [];

  if (inputs.paymentDetails?.regularPaymentWithTax !== undefined) {
    const apiVal = parseMoney(String(inputs.paymentDetails.regularPaymentWithTax));
    fields.push({
      name: 'paymentAmount',
      api: apiVal,
      pdf: extracted.paymentAmount,
      ok: moneyEqual(apiVal, extracted.paymentAmount),
    });
  }

  if (inputs.esignRequest?.contractAmount) {
    const apiVal = parseMoney(inputs.esignRequest.contractAmount);
    fields.push({
      name: 'totalOfPayments',
      api: apiVal,
      pdf: extracted.totalOfPayments,
      ok: moneyEqual(apiVal, extracted.totalOfPayments),
    });
  }

  if (inputs.esignRequest?.costPrice) {
    const apiVal = parseMoney(inputs.esignRequest.costPrice);
    fields.push({
      name: 'cashPrice',
      api: apiVal,
      pdf: extracted.cashPrice,
      ok: moneyEqual(apiVal, extracted.cashPrice),
    });
  }

  if (inputs.esignRequest?.costOfLease) {
    const apiVal = parseMoney(inputs.esignRequest.costOfLease);
    fields.push({
      name: 'costOfRental',
      api: apiVal,
      pdf: extracted.costOfRental,
      ok: moneyEqual(apiVal, extracted.costOfRental),
    });
  }

  if (inputs.esignRequest?.totalNumberOfPayments) {
    const apiVal = Number(inputs.esignRequest.totalNumberOfPayments);
    fields.push({
      name: 'numberOfPayments',
      api: apiVal,
      pdf: extracted.numberOfPayments,
      ok: Number.isFinite(apiVal) && apiVal === extracted.numberOfPayments,
    });
  }

  if (inputs.esignRequest?.paymentFrequencyDesc) {
    const apiVal = inputs.esignRequest.paymentFrequencyDesc.toUpperCase().replace(/\s+/g, '-');
    fields.push({
      name: 'rentalPeriod',
      api: apiVal,
      pdf: extracted.rentalPeriod,
      ok: extracted.rentalPeriod === apiVal,
    });
  }

  if (inputs.esignRequest?.contractNumber) {
    const expected = inputs.esignRequest.contractNumber;
    const got = extracted.agreementNumber ?? '';
    fields.push({
      name: 'agreementNumber',
      api: expected,
      pdf: got,
      ok: got.length > 0 && (expected.includes(got) || got.includes(expected)),
    });
  }

  if (inputs.esignRequest?.customerFirstName && inputs.esignRequest?.customerLastName) {
    const fn = inputs.esignRequest.customerFirstName.toLowerCase();
    const ln = inputs.esignRequest.customerLastName.toLowerCase();
    const lessee = (extracted.lesseeName ?? '').toLowerCase();
    const fullName = `${fn} ${ln}`;
    fields.push({
      name: 'lesseeName',
      api: fullName,
      pdf: extracted.lesseeName,
      ok: lessee.includes(fn) && lessee.includes(ln),
    });
  }

  const okCount = fields.filter((f) => f.ok).length;
  return {
    fields,
    okCount,
    totalCount: fields.length,
    allOk: okCount === fields.length && fields.length > 0,
  };
}
