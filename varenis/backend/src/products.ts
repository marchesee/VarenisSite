// This is the security-critical copy of the catalog. The frontend has its
// own copy (frontend/src/data/products.ts) for rendering, but the backend
// NEVER trusts a price sent from the browser — it always looks the price
// up here before creating a Stripe Checkout Session. If you add a product
// on the frontend, add the matching id/name/price here too.

export interface CatalogProduct {
  id: string;
  name: string;
  priceCents: number;
}

export const PRODUCTS: Record<string, CatalogProduct> = {
  "leopard-tee-black": { id: "leopard-tee-black", name: "Leopard Tee — Black", priceCents: 6800 },
  "leopard-tee-white": { id: "leopard-tee-white", name: "Leopard Tee — White", priceCents: 6800 },
  "wordmark-tee-black": { id: "wordmark-tee-black", name: "Wordmark Tee — Black", priceCents: 5800 },
  "boxy-crew-bone": { id: "boxy-crew-bone", name: "Boxy Crew — Bone", priceCents: 16800 },
  "boxy-crew-charcoal": { id: "boxy-crew-charcoal", name: "Boxy Crew — Charcoal", priceCents: 16800 },
  "merino-beanie": { id: "merino-beanie", name: "Merino Beanie — Black", priceCents: 5200 },
  "overshirt-ink": { id: "overshirt-ink", name: "Wool Overshirt — Ink", priceCents: 24800 },
  "topcoat-slate": { id: "topcoat-slate", name: "Minimal Topcoat — Slate", priceCents: 42800 },
  "leather-card-holder": { id: "leather-card-holder", name: "Card Holder — Black", priceCents: 8800 },
  "silk-scarf-mono": { id: "silk-scarf-mono", name: "Printed Scarf — Monochrome", priceCents: 12800 },
};
