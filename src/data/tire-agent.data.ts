/**
 * TireAgent / PayPair portal test data.
 * Migrated from: fintech-qaautomation/utility/dev/tireAgentData.json
 *
 * Contains product/cart data and helpers to build the JSON payloads
 * that the PayPair portal expects in its personal-info and cart textareas.
 */
import { randomInt } from 'node:crypto';

// ── Interfaces ────────────────────────────────────────────────────────

export interface TireAgentProduct {
  description: string;
  quantity: number;
  price: number;
  category: string;
  brand: string;
  model: string;
  sku: string;
  taxClass: string;
  taxAmount: number;
  productType: string;
}

export interface PayPairPersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PayPairConfig {
  provider: string;
  prequalification: string;
  productSelectionType: string;
}

// ── Default test data ────────────────────────────────────────────────

export const DEFAULT_TIRE_AGENT_PRODUCT: TireAgentProduct = {
  description: 'Michelin Primacy 4 Tire Set',
  quantity: 1,
  price: 800,
  category: 'Tires',
  brand: 'Michelin',
  model: 'Primacy 4',
  sku: '16H4',
  taxClass: '123',
  taxAmount: 10,
  productType: 'tire',
};

export const DEFAULT_PAYPAIR_CONFIG: PayPairConfig = {
  provider: 'anybody',
  prequalification: 'false',
  productSelectionType: 'ShopByVehicle',
};

// ── Phone number generator ──────────────────────────────────────────

/**
 * Generates a test phone number starting with "111" or "222" prefix,
 * required by the PayPair sandbox environment for OTP verification.
 */
export function generatePayPairTestPhone(): string {
  const prefix = randomInt(2) === 0 ? '111' : '222';
  return `${prefix}${1000000 + randomInt(9000000)}`;
}

// ── JSON builders ────────────────────────────────────────────────────

export function buildPayPairPersonalInfoJson(info: PayPairPersonalInfo): string {
  return JSON.stringify({
    firstName: info.firstName,
    lastName: info.lastName,
    email: info.email,
    street: info.street,
    city: info.city,
    state: info.state,
    postalCode: info.postalCode,
    country: info.country,
  }, null, 2);
}

export function buildPayPairCartJson(products: TireAgentProduct[]): string {
  return JSON.stringify(
    products.map((p) => ({
      description: p.description,
      quantity: p.quantity,
      price: p.price,
      category: p.category,
      brand: p.brand,
      model: p.model,
      sku: p.sku,
      taxClass: p.taxClass,
      taxAmount: p.taxAmount,
      productType: p.productType,
    })),
    null,
    2,
  );
}
