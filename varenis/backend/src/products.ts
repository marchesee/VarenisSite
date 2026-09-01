// This is the security-critical copy of the catalog. The frontend has its
// own copy (frontend/src/data/products.ts) for rendering, but the backend
// NEVER trusts a price sent from the browser — it always looks the price
// up here before creating a Stripe Checkout Session. If you add a product
// on the frontend, add the matching id/name/price here too.

export interface CatalogProduct {
  id: string;
  name: string;
  priceCents: number;
  // Your cost from Printful (base + typical fulfillment) in cents. Used for
  // real profit in the creator-code CSV. Fill in with Printful's actual base
  // cost per item. Optional for display-only products not yet on Printful.
  costCents?: number;
}

export const PRODUCTS: Record<string, CatalogProduct> = {
  // The three real, Printful-fulfilled tees. costCents are PLACEHOLDERS —
  // replace with Printful's actual base cost per shirt (check the product in
  // your Printful dashboard; typically ~$12–16 for a printed tee).
  "leopard-tee-black": { id: "leopard-tee-black", name: "Leopard Tee — Black", priceCents: 6800, costCents: 1400 },
  "leopard-tee-white": { id: "leopard-tee-white", name: "Leopard Tee — White", priceCents: 6800, costCents: 1400 },
  "leopard-graphic-tee-white": { id: "leopard-graphic-tee-white", name: "Leopard Graphic Tee — White", priceCents: 6800, costCents: 1600 },
  // Display-only for now (not on Printful) — no cost set.
  "wordmark-tee-black": { id: "wordmark-tee-black", name: "Wordmark Tee — Black", priceCents: 5800 },
  "boxy-crew-bone": { id: "boxy-crew-bone", name: "Boxy Crew — Bone", priceCents: 16800 },
  "boxy-crew-charcoal": { id: "boxy-crew-charcoal", name: "Boxy Crew — Charcoal", priceCents: 16800 },
  "merino-beanie": { id: "merino-beanie", name: "Merino Beanie — Black", priceCents: 5200 },
  "overshirt-ink": { id: "overshirt-ink", name: "Wool Overshirt — Ink", priceCents: 24800 },
  "topcoat-slate": { id: "topcoat-slate", name: "Minimal Topcoat — Slate", priceCents: 42800 },
  "leather-card-holder": { id: "leather-card-holder", name: "Card Holder — Black", priceCents: 8800 },
  "silk-scarf-mono": { id: "silk-scarf-mono", name: "Printed Scarf — Monochrome", priceCents: 12800 },
};