/**
 * Realistic product catalog + cart generators.
 *
 * One catalog feeds BOTH cart shapes the platform needs:
 *   - UOWN `InvoiceLineItem[]` (sendApplication / sendInvoice `lineItem`)
 *   - PayPair `TireAgentProduct[]` (partner-portal Cart textarea)
 *
 * A `CartLine[]` is the neutral intermediate; adapters convert to either shape
 * so prices/quantities stay consistent across the two.
 */
import { int, pick, digits, money, splitAmount } from './random.js';
import type { InvoiceLineItem } from '../../api/bodies/invoice.body.js';
import type { TireAgentProduct } from '../tire-agent.data.js';

export interface CatalogProduct {
  brand: string;
  model: string;
  description: string;
  category: string;
  productType: string;
  /** Typical price range (USD) for a single unit. */
  min: number;
  max: number;
}

export const PRODUCT_CATALOG: readonly CatalogProduct[] = [
  // Electronics
  { brand: 'Apple', model: 'iPhone 15', description: 'Apple iPhone 15 128GB', category: 'Electronics', productType: 'phone', min: 650, max: 950 },
  { brand: 'Samsung', model: 'Galaxy S24', description: 'Samsung Galaxy S24 256GB', category: 'Electronics', productType: 'phone', min: 600, max: 900 },
  { brand: 'Sony', model: 'WH-1000XM5', description: 'Sony WH-1000XM5 Headphones', category: 'Audio', productType: 'audio', min: 250, max: 400 },
  { brand: 'Bose', model: 'Soundbar 900', description: 'Bose Smart Soundbar 900', category: 'Audio', productType: 'audio', min: 500, max: 900 },
  { brand: 'LG', model: 'OLED C3 55"', description: 'LG OLED C3 55-inch 4K TV', category: 'Electronics', productType: 'tv', min: 900, max: 1500 },
  { brand: 'Dell', model: 'XPS 13', description: 'Dell XPS 13 Laptop', category: 'Computers', productType: 'laptop', min: 800, max: 1400 },
  // Appliances
  { brand: 'Whirlpool', model: 'WRX735', description: 'Whirlpool French Door Refrigerator', category: 'Appliances', productType: 'appliance', min: 1100, max: 1900 },
  { brand: 'GE', model: 'GTW465', description: 'GE Top-Load Washer', category: 'Appliances', productType: 'appliance', min: 600, max: 950 },
  { brand: 'Dyson', model: 'V15 Detect', description: 'Dyson V15 Detect Vacuum', category: 'Appliances', productType: 'appliance', min: 550, max: 750 },
  // Furniture
  { brand: 'Ashley', model: 'Larkinhurst', description: 'Ashley Larkinhurst Sofa', category: 'Furniture', productType: 'furniture', min: 600, max: 1100 },
  { brand: 'La-Z-Boy', model: 'Pinnacle', description: 'La-Z-Boy Pinnacle Recliner', category: 'Seating', productType: 'furniture', min: 500, max: 900 },
  { brand: 'Sealy', model: 'Posturepedic', description: 'Sealy Posturepedic Queen Mattress', category: 'Furniture', productType: 'furniture', min: 700, max: 1300 },
  // Tires (TireAgent / ShopByVehicle)
  { brand: 'Michelin', model: 'Primacy 4', description: 'Michelin Primacy 4 Tire Set', category: 'Tires', productType: 'tire', min: 600, max: 1000 },
  { brand: 'Goodyear', model: 'Assurance', description: 'Goodyear Assurance All-Season Tire', category: 'Tires', productType: 'tire', min: 500, max: 900 },
  { brand: 'Bridgestone', model: 'Turanza', description: 'Bridgestone Turanza Tire Set', category: 'Tires', productType: 'tire', min: 550, max: 950 },
  { brand: 'Pirelli', model: 'P Zero', description: 'Pirelli P Zero Performance Tire', category: 'Tires', productType: 'tire', min: 700, max: 1200 },
  // Jewelry (Daniel's Jewelers)
  { brand: 'Citizen', model: 'Eco-Drive', description: 'Citizen Eco-Drive Watch', category: 'Jewelry', productType: 'jewelry', min: 300, max: 600 },
  { brand: 'Pandora', model: 'Moments', description: 'Pandora Moments Bracelet', category: 'Jewelry', productType: 'jewelry', min: 150, max: 400 },
  { brand: 'Movado', model: 'Museum Classic', description: 'Movado Museum Classic Watch', category: 'Jewelry', productType: 'jewelry', min: 500, max: 1200 },
  { brand: 'Seiko', model: '5 Sport', description: 'Seiko 5 Sport Automatic Watch', category: 'Jewelry', productType: 'jewelry', min: 200, max: 450 },
  { brand: 'Kay', model: 'Diamond Studs', description: '14K Gold Diamond Stud Earrings', category: 'Jewelry', productType: 'jewelry', min: 400, max: 1100 },
  { brand: 'Zales', model: 'Rope Chain', description: '14K Gold Rope Chain Necklace', category: 'Jewelry', productType: 'jewelry', min: 350, max: 900 },
  // Fitness / outdoors
  { brand: 'Peloton', model: 'Bike', description: 'Peloton Exercise Bike', category: 'Fitness', productType: 'fitness', min: 1000, max: 1500 },
  { brand: 'Weber', model: 'Genesis', description: 'Weber Genesis Gas Grill', category: 'Outdoor', productType: 'outdoor', min: 700, max: 1300 },
  // ── Expanded catalog ──
  // Electronics / computers
  { brand: 'Apple', model: 'iPad Air', description: 'Apple iPad Air 11-inch', category: 'Electronics', productType: 'tablet', min: 600, max: 900 },
  { brand: 'Samsung', model: 'QN65', description: 'Samsung 65-inch QLED 4K TV', category: 'Electronics', productType: 'tv', min: 800, max: 1500 },
  { brand: 'HP', model: 'Pavilion', description: 'HP Pavilion 15 Laptop', category: 'Computers', productType: 'laptop', min: 600, max: 1000 },
  { brand: 'Lenovo', model: 'ThinkPad E14', description: 'Lenovo ThinkPad E14 Laptop', category: 'Computers', productType: 'laptop', min: 700, max: 1300 },
  { brand: 'Microsoft', model: 'Surface Pro', description: 'Microsoft Surface Pro 9', category: 'Computers', productType: 'tablet', min: 900, max: 1500 },
  { brand: 'Nintendo', model: 'Switch OLED', description: 'Nintendo Switch OLED Console', category: 'Electronics', productType: 'gaming', min: 320, max: 400 },
  { brand: 'Sony', model: 'PlayStation 5', description: 'Sony PlayStation 5 Console', category: 'Electronics', productType: 'gaming', min: 450, max: 600 },
  { brand: 'JBL', model: 'Charge 5', description: 'JBL Charge 5 Bluetooth Speaker', category: 'Audio', productType: 'audio', min: 130, max: 250 },
  // Appliances / kitchen
  { brand: 'Samsung', model: 'WF45', description: 'Samsung Front-Load Washer', category: 'Appliances', productType: 'appliance', min: 700, max: 1200 },
  { brand: 'LG', model: 'LDF5', description: 'LG Front-Control Dishwasher', category: 'Appliances', productType: 'appliance', min: 500, max: 850 },
  { brand: 'KitchenAid', model: 'Artisan', description: 'KitchenAid Artisan Stand Mixer', category: 'Kitchen', productType: 'kitchen', min: 350, max: 550 },
  { brand: 'Ninja', model: 'Foodi', description: 'Ninja Foodi Air Fryer', category: 'Kitchen', productType: 'kitchen', min: 150, max: 300 },
  { brand: 'Frigidaire', model: 'Gallery', description: 'Frigidaire Gallery Electric Range', category: 'Appliances', productType: 'appliance', min: 700, max: 1300 },
  // Furniture
  { brand: 'Ashley', model: 'Bolanburg', description: 'Ashley Bolanburg Dining Table Set', category: 'Furniture', productType: 'furniture', min: 700, max: 1400 },
  { brand: 'Tempur-Pedic', model: 'Adapt', description: 'Tempur-Pedic Adapt Queen Mattress', category: 'Furniture', productType: 'furniture', min: 1500, max: 2400 },
  { brand: 'IKEA', model: 'Ektorp', description: 'IKEA Ektorp 3-Seat Sofa', category: 'Furniture', productType: 'furniture', min: 500, max: 800 },
  // Tires / auto
  { brand: 'Continental', model: 'ExtremeContact', description: 'Continental ExtremeContact Tire Set', category: 'Tires', productType: 'tire', min: 600, max: 1100 },
  { brand: 'Cooper', model: 'Discoverer', description: 'Cooper Discoverer AT3 Tire Set', category: 'Tires', productType: 'tire', min: 650, max: 1200 },
  { brand: 'Yokohama', model: 'Avid', description: 'Yokohama Avid Ascend Tire Set', category: 'Tires', productType: 'tire', min: 500, max: 900 },
  { brand: 'BMR', model: 'ENKEI', description: 'Enkei TS-10 Alloy Wheel Set', category: 'Tires', productType: 'wheel', min: 800, max: 1500 },
  // Jewelry
  { brand: 'Bulova', model: 'Marine Star', description: 'Bulova Marine Star Chronograph Watch', category: 'Jewelry', productType: 'jewelry', min: 250, max: 500 },
  { brand: 'Fossil', model: 'Gen 6', description: 'Fossil Gen 6 Smartwatch', category: 'Jewelry', productType: 'jewelry', min: 200, max: 350 },
  { brand: 'Helzberg', model: 'Solitaire', description: '14K White Gold Diamond Pendant', category: 'Jewelry', productType: 'jewelry', min: 500, max: 1500 },
  // Fitness / outdoor / tools
  { brand: 'Bowflex', model: 'SelectTech', description: 'Bowflex SelectTech Adjustable Dumbbells', category: 'Fitness', productType: 'fitness', min: 300, max: 600 },
  { brand: 'YETI', model: 'Tundra 65', description: 'YETI Tundra 65 Cooler', category: 'Outdoor', productType: 'outdoor', min: 350, max: 450 },
  { brand: 'DeWalt', model: '20V Combo', description: 'DeWalt 20V Max Power Tool Combo Kit', category: 'Tools', productType: 'tools', min: 350, max: 700 },
  { brand: 'Milwaukee', model: 'M18 Fuel', description: 'Milwaukee M18 Fuel Drill/Driver Set', category: 'Tools', productType: 'tools', min: 300, max: 600 },
  { brand: 'Graco', model: 'Modes', description: 'Graco Modes Travel System Stroller', category: 'Baby', productType: 'baby', min: 300, max: 500 },
];

export interface CartLine {
  product: CatalogProduct;
  description: string;
  brand: string;
  model: string;
  category: string;
  productType: string;
  sku: string;
  quantity: number;
  /** Price per unit (USD). */
  unitPrice: number;
  /** unitPrice * quantity. */
  lineTotal: number;
}

export interface RandomCartOptions {
  /** Number of distinct cart lines (default random 1-3). */
  count?: number;
  /** Target order total (USD). If set, prices are fitted so the cart sums to it. */
  total?: number;
  /** Max quantity per line (default 1). When >1, quantity is random 1..maxQuantity. */
  maxQuantity?: number;
  /** Restrict to a single category (e.g. 'Tires' for TireAgent, 'Jewelry' for Daniel's). */
  category?: string;
}

function makeSku(p: CatalogProduct): string {
  return `${p.brand.slice(0, 3).toUpperCase()}-${p.model.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()}-${digits(4)}`;
}

/** A neutral, internally-consistent cart. Convert with the adapters below. */
export function randomCart(opts: RandomCartOptions = {}): CartLine[] {
  const count = opts.count ?? int(1, 3);
  const catalog = opts.category
    ? PRODUCT_CATALOG.filter((p) => p.category.toLowerCase() === opts.category!.toLowerCase())
    : PRODUCT_CATALOG;
  const pool = catalog.length > 0 ? catalog : PRODUCT_CATALOG;

  const quantities = Array.from({ length: count }, () =>
    opts.maxQuantity && opts.maxQuantity > 1 ? int(1, opts.maxQuantity) : 1,
  );

  // Per-line totals: split the target total across lines, else price each unit.
  const lineTotals = opts.total != null
    ? splitAmount(opts.total, count, 50)
    : quantities.map((q) => {
        const prod = pick(pool);
        return +(money(prod.min, prod.max) * q).toFixed(2);
      });

  return lineTotals.map((lineTotal, i) => {
    const product = pick(pool);
    const quantity = quantities[i] as number;
    const unitPrice = +(lineTotal / quantity).toFixed(2);
    return {
      product,
      description: product.description,
      brand: product.brand,
      model: product.model,
      category: product.category,
      productType: product.productType,
      sku: makeSku(product),
      quantity,
      unitPrice,
      lineTotal: +unitPrice.toFixed(2) * quantity,
    };
  });
}

/** Sum of a cart's line totals. */
export function cartTotal(cart: CartLine[]): number {
  return +cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0).toFixed(2);
}

/** Adapter → UOWN `InvoiceLineItem[]` (sendApplication / sendInvoice `lineItem`). */
export function cartToLineItems(cart: CartLine[]): InvoiceLineItem[] {
  return cart.map((l, i) => {
    const extended = +(l.unitPrice * l.quantity).toFixed(2);
    return {
      lineItemLineNumber: String(101 + i),
      lineItemSerialNumber: `SN-${digits(12)}`,
      lineItemProductNumber: l.sku,
      lineItemProductDescription: l.description,
      lineItemProductCategory: l.category,
      lineItemType: 'D',
      lineItemQuantityOrdered: String(l.quantity),
      lineItemUnitPrice: l.unitPrice.toFixed(2),
      lineItemBasePrice: l.unitPrice.toFixed(2),
      lineItemTaxAmount: '0.00',
      lineItemExtendedPrice: extended.toFixed(2),
    };
  });
}

/** Adapter → PayPair `TireAgentProduct[]` (partner-portal Cart textarea). */
export function cartToPayPair(cart: CartLine[]): TireAgentProduct[] {
  return cart.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    price: l.unitPrice,
    category: l.category,
    brand: l.brand,
    model: l.model,
    sku: l.sku,
    taxClass: '0',
    taxAmount: 0,
    productType: l.productType,
  }));
}

/** Convenience: random UOWN line items in one call. */
export function randomLineItems(opts: RandomCartOptions = {}): InvoiceLineItem[] {
  return cartToLineItems(randomCart(opts));
}

/** Convenience: random PayPair cart in one call. */
export function randomPayPairCart(opts: RandomCartOptions = {}): TireAgentProduct[] {
  return cartToPayPair(randomCart(opts));
}

// ── Merchant → product category coherence ────────────────────────────

/**
 * Maps a merchant `client_type` (or a category hint) to a catalog category, so
 * generated cart items stay coherent with the MERCHANT — not just internally.
 * A Daniel's (JEWELRY) lease should list watches/rings, not ottomans; a
 * TireAgent lease should list tires. Pass the result as `randomCart({ category })`.
 * Returns `undefined` for unknown merchants → factory picks across all categories.
 */
export const MERCHANT_PRODUCT_CATEGORY: Record<string, string> = {
  DANIELS_JEWELERS: 'Jewelry',
  JEWELRY: 'Jewelry',
  TIREAGENT: 'Tires',
  TIRE_AGENT: 'Tires',
  TIRE: 'Tires',
  KORNERSTONE: 'Furniture',
};

export function categoryForMerchant(clientTypeOrHint?: string): string | undefined {
  if (!clientTypeOrHint) return undefined;
  return MERCHANT_PRODUCT_CATEGORY[clientTypeOrHint.toUpperCase()];
}
