// The bridge between YOUR catalog and Printful's numbering.
//
// These are SYNC VARIANT IDs — the product variant WITH your uploaded design
// attached. Ordering by these makes Printful pull in the print files
// automatically. (Raw catalog variant_ids fail with "Item can't be submitted
// without any print files" because they're blank garments.) Pulled from
// GET /store/products/{id} → sync_variants[].id via the list script.
//
// NOTE ON SIZES: a real sale is a product AND a size. Full size-selection is
// the next feature. Until then, resolvePrintfulVariant falls back to size L
// when called without one, so the current checkout still fulfills a valid
// variant. The map is already size-keyed, ready for that feature.

export interface PrintfulVariantRef {
  // The Printful sync_variant_id (design attached).
  variantId: number;
}

export type Size = "S" | "M" | "L" | "XL" | "2XL" | "3XL";

const DEFAULT_SIZE: Size = "L";

// Keyed "<catalogId>:<size>". Values are SYNC variant ids.
export const PRINTFUL_MAP: Record<string, PrintfulVariantRef> = {
  // Quiet Leopard Tee — Black  (store product 460209707)
  "leopard-tee-black:S": { variantId: 5464446153 },
  "leopard-tee-black:M": { variantId: 5464446154 },
  "leopard-tee-black:L": { variantId: 5464446155 },
  "leopard-tee-black:XL": { variantId: 5464446156 },
  "leopard-tee-black:2XL": { variantId: 5464446157 },
  "leopard-tee-black:3XL": { variantId: 5464446158 },

  // Quiet Leopard Tee — White  (store product 460209874)
  "leopard-tee-white:S": { variantId: 5464447487 },
  "leopard-tee-white:M": { variantId: 5464447488 },
  "leopard-tee-white:L": { variantId: 5464447489 },
  "leopard-tee-white:XL": { variantId: 5464447490 },
  "leopard-tee-white:2XL": { variantId: 5464447491 },
  "leopard-tee-white:3XL": { variantId: 5464447492 },

  // Unisex Leopard Graphic Tee — White  (store product 460208903)
  "leopard-graphic-tee-white:S": { variantId: 5464427514 },
  "leopard-graphic-tee-white:M": { variantId: 5464427515 },
  "leopard-graphic-tee-white:L": { variantId: 5464427516 },
  "leopard-graphic-tee-white:XL": { variantId: 5464427517 },
  "leopard-graphic-tee-white:2XL": { variantId: 5464427518 },
  "leopard-graphic-tee-white:3XL": { variantId: 5464427519 },
  // (4XL 5464427520 exists but we're offering S–3XL.)

  // Sweatpants — Black  (store product 462973767, Black color variants)
  "sweatpants-black:S": { variantId: 5473082307 },
  "sweatpants-black:M": { variantId: 5473082308 },
  "sweatpants-black:L": { variantId: 5473082309 },
  "sweatpants-black:XL": { variantId: 5473082310 },
  "sweatpants-black:2XL": { variantId: 5473082311 },
  // (XS 5473082306 exists but we're offering S–2XL.)


  // Hoodie / Sweatshirt — Black  (store product 462973120)
  "sweatshirt-black:S": { variantId: 5473081343 },
  "sweatshirt-black:M": { variantId: 5473081344 },
  "sweatshirt-black:L": { variantId: 5473081345 },
  "sweatshirt-black:XL": { variantId: 5473081347 },
  "sweatshirt-black:2XL": { variantId: 5473081348 },
  "sweatshirt-black:3XL": { variantId: 5473081349 },

  // Hoodie / Sweatshirt — White  (store product 462971811)
  "sweatshirt-white:S": { variantId: 5473078923 },
  "sweatshirt-white:M": { variantId: 5473078924 },
  "sweatshirt-white:L": { variantId: 5473078925 },
  "sweatshirt-white:XL": { variantId: 5473078926 },
  "sweatshirt-white:2XL": { variantId: 5473078927 },
  "sweatshirt-white:3XL": { variantId: 5473078928 },
};

// Look up a Printful sync variant for a catalog id, optionally with a size.
// Without a size (today's checkout), falls back to DEFAULT_SIZE.
export function resolvePrintfulVariant(
  catalogId: string,
  size?: string
): PrintfulVariantRef | null {
  const s = size ?? DEFAULT_SIZE;
  return PRINTFUL_MAP[`${catalogId}:${s}`] ?? null;
}