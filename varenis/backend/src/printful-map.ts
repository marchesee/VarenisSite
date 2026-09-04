// The bridge between YOUR catalog and Printful's numbering.
//
// Printful has TWO ids per product/size:
//   - syncVariantId  → the variant WITH your design attached. Used for ORDERS
//     (so Printful pulls in the print files).
//   - catalogVariantId → the underlying blank garment's variant. Used for
//     SHIPPING RATE quotes (shipping cost depends on the blank, not the art).
// We store both. Pulled from GET /store/products/{id} → sync_variants[]
// (.id = sync, .variant_id = catalog) via list-both-ids.mjs.
//
// Keyed "<catalogId>:<size>". Sizes offered: S–3XL (tees/hoodies), S–2XL (pants).

export interface PrintfulVariantRef {
  syncVariantId: number; // for placing orders
  catalogVariantId: number; // for shipping-rate quotes
}

export type Size = "S" | "M" | "L" | "XL" | "2XL" | "3XL";

const DEFAULT_SIZE: Size = "L";

export const PRINTFUL_MAP: Record<string, PrintfulVariantRef> = {
  // Quiet Leopard Tee — Black
  "leopard-tee-black:S": { syncVariantId: 5464446153, catalogVariantId: 18772 },
  "leopard-tee-black:M": { syncVariantId: 5464446154, catalogVariantId: 18773 },
  "leopard-tee-black:L": { syncVariantId: 5464446155, catalogVariantId: 18777 },
  "leopard-tee-black:XL": { syncVariantId: 5464446156, catalogVariantId: 18774 },
  "leopard-tee-black:2XL": { syncVariantId: 5464446157, catalogVariantId: 18775 },
  "leopard-tee-black:3XL": { syncVariantId: 5464446158, catalogVariantId: 18776 },

  // Quiet Leopard Tee — White
  "leopard-tee-white:S": { syncVariantId: 5464447487, catalogVariantId: 18793 },
  "leopard-tee-white:M": { syncVariantId: 5464447488, catalogVariantId: 18794 },
  "leopard-tee-white:L": { syncVariantId: 5464447489, catalogVariantId: 18798 },
  "leopard-tee-white:XL": { syncVariantId: 5464447490, catalogVariantId: 18795 },
  "leopard-tee-white:2XL": { syncVariantId: 5464447491, catalogVariantId: 18796 },
  "leopard-tee-white:3XL": { syncVariantId: 5464447492, catalogVariantId: 18797 },

  // Unisex Leopard Graphic Tee — White
  "leopard-graphic-tee-white:S": { syncVariantId: 5464427514, catalogVariantId: 15124 },
  "leopard-graphic-tee-white:M": { syncVariantId: 5464427515, catalogVariantId: 15125 },
  "leopard-graphic-tee-white:L": { syncVariantId: 5464427516, catalogVariantId: 15126 },
  "leopard-graphic-tee-white:XL": { syncVariantId: 5464427517, catalogVariantId: 15127 },
  "leopard-graphic-tee-white:2XL": { syncVariantId: 5464427518, catalogVariantId: 15128 },
  "leopard-graphic-tee-white:3XL": { syncVariantId: 5464427519, catalogVariantId: 16335 },

  // Sweatpants — Black (S–2XL)
  "sweatpants-black:S": { syncVariantId: 5473082307, catalogVariantId: 11266 },
  "sweatpants-black:M": { syncVariantId: 5473082308, catalogVariantId: 11267 },
  "sweatpants-black:L": { syncVariantId: 5473082309, catalogVariantId: 11268 },
  "sweatpants-black:XL": { syncVariantId: 5473082310, catalogVariantId: 11269 },
  "sweatpants-black:2XL": { syncVariantId: 5473082311, catalogVariantId: 11270 },

  // Sweatshirt (Hoodie) — Black (S–3XL)
  "sweatshirt-black:S": { syncVariantId: 5473081343, catalogVariantId: 10779 },
  "sweatshirt-black:M": { syncVariantId: 5473081344, catalogVariantId: 10780 },
  "sweatshirt-black:L": { syncVariantId: 5473081345, catalogVariantId: 10781 },
  "sweatshirt-black:XL": { syncVariantId: 5473081347, catalogVariantId: 10782 },
  "sweatshirt-black:2XL": { syncVariantId: 5473081348, catalogVariantId: 10783 },
  "sweatshirt-black:3XL": { syncVariantId: 5473081349, catalogVariantId: 13416 },

  // Sweatshirt (Hoodie) — White (S–3XL)
  "sweatshirt-white:S": { syncVariantId: 5473078923, catalogVariantId: 10774 },
  "sweatshirt-white:M": { syncVariantId: 5473078924, catalogVariantId: 10775 },
  "sweatshirt-white:L": { syncVariantId: 5473078925, catalogVariantId: 10776 },
  "sweatshirt-white:XL": { syncVariantId: 5473078926, catalogVariantId: 10777 },
  "sweatshirt-white:2XL": { syncVariantId: 5473078927, catalogVariantId: 10778 },
  "sweatshirt-white:3XL": { syncVariantId: 5473078928, catalogVariantId: 13421 },

  // Headwear — one size. Keyed with the ONE_SIZE marker (no size suffix).
  "baseball-cap-black:ONE": { syncVariantId: 5478892736, catalogVariantId: 7854 },
  "beanie-black:ONE": { syncVariantId: 5477481160, catalogVariantId: 8936 },
};

// Resolve a catalog id + size to both Printful ids. One-size products (caps,
// beanies) are keyed with ":ONE" and are looked up when no size is given. For
// sized products with no size passed, we fall back to L.
export function resolvePrintfulVariant(
  catalogId: string,
  size?: string
): PrintfulVariantRef | null {
  if (size) {
    return PRINTFUL_MAP[`${catalogId}:${size}`] ?? null;
  }
  // No size: try the one-size key first, then the default sized fallback.
  return (
    PRINTFUL_MAP[`${catalogId}:ONE`] ??
    PRINTFUL_MAP[`${catalogId}:${DEFAULT_SIZE}`] ??
    null
  );
}