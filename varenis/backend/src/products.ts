// This is the security-critical copy of the catalog. The frontend has its
// own copy (frontend/src/data/products.ts) for rendering, but the backend
// NEVER trusts a price sent from the browser — it always looks the price up
// here before creating a Stripe Checkout Session.
//
// Only REAL, fulfillable products live here (all exist in Printful). If you
// add a product on the frontend, add the matching id/name/price here too.

export interface CatalogProduct {
  id: string;
  name: string;
  priceCents: number;
  // Your cost from Printful (base + typical fulfillment) in cents. Used for
  // real profit in the creator-code CSV. Replace placeholders with Printful's
  // actual base cost per item (check each product in the Printful dashboard).
  costCents?: number;
}

export const PRODUCTS: Record<string, CatalogProduct> = {
  // Tees — $68
  "leopard-tee-black": { id: "leopard-tee-black", name: "Leopard Tee — Black", priceCents: 3500, costCents: 2039 },
  "leopard-tee-white": { id: "leopard-tee-white", name: "Leopard Tee — White", priceCents: 3500, costCents: 2039 },
  "leopard-graphic-tee-white": { id: "leopard-graphic-tee-white", name: "Leopard Graphic Tee — White", priceCents: 3500, costCents: 2250 },
  // Sweatshirts — $70
  "sweatshirt-black": { id: "sweatshirt-black", name: "Sweatshirt — Black", priceCents: 7000, costCents: 4095 },
  "sweatshirt-white": { id: "sweatshirt-white", name: "Sweatshirt — White", priceCents: 7000, costCents: 3970 },
  // Sweatpants — $50
  "sweatpants-black": { id: "sweatpants-black", name: "Sweatpants — Black", priceCents: 5000, costCents: 3198 },
};