import { Router } from "express";
import { PRODUCTS } from "../products.js";
import { resolvePrintfulVariant } from "../printful-map.js";
import { getShippingRates } from "../printful.js";

export const quoteRouter = Router();

interface QuoteItemInput {
  productId: string;
  size: string | null;
  quantity: number;
}

interface QuoteAddressInput {
  address1: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
}

const VALID_SIZES = new Set(["S", "M", "L", "XL", "2XL", "3XL"]);

// POST /api/quote/shipping
// Body: { items: [{productId,size,quantity}], address: {...} }
// Returns: { rates: [{id,name,rateCents}], productSubtotalCents }
// Called from the frontend AFTER the customer enters their address but
// BEFORE they go to Stripe, so we can charge exact shipping.
quoteRouter.post("/shipping", async (req, res) => {
  const items = req.body?.items as QuoteItemInput[] | undefined;
  const address = req.body?.address as QuoteAddressInput | undefined;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }
  if (
    !address ||
    !address.address1 ||
    !address.city ||
    !address.country_code ||
    !address.zip
  ) {
    return res
      .status(400)
      .json({ error: "A complete shipping address is required." });
  }

  // Build Printful line items from our catalog + map (prices from server).
  const printfulItems: { variant_id: number; quantity: number }[] = [];
  let productSubtotalCents = 0;

  for (const item of items) {
    const product = PRODUCTS[item.productId];
    const quantity = Math.floor(Number(item.quantity));
    if (!product) {
      return res.status(400).json({ error: `Unknown product: ${item.productId}` });
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: `Invalid quantity for ${product.name}` });
    }
    const size = item.size ?? undefined;
    if (size && !VALID_SIZES.has(size)) {
      return res.status(400).json({ error: `Invalid size for ${product.name}` });
    }

    const ref = resolvePrintfulVariant(item.productId, size);
    if (!ref) {
      return res.status(400).json({
        error: `${product.name}${size ? ` (${size})` : ""} isn't available to ship.`,
      });
    }
    printfulItems.push({ variant_id: ref.catalogVariantId, quantity });
    productSubtotalCents += product.priceCents * quantity;
  }

  try {
    const rates = await getShippingRates({
      recipient: {
        address1: address.address1,
        city: address.city,
        state_code: address.state_code ?? "",
        country_code: address.country_code,
        zip: address.zip,
      },
      items: printfulItems,
    });

    if (!rates.length) {
      return res.status(400).json({
        error: "No shipping options available for that address.",
      });
    }

    // Printful returns rate as a string like "4.99" in the store currency.
    // Convert to cents for the frontend + Stripe.
    const normalized = rates.map((r) => ({
      id: r.id,
      name: r.name,
      rateCents: Math.round(parseFloat(r.rate) * 100),
    }));

    res.json({ rates: normalized, productSubtotalCents });
  } catch (err) {
    console.error("Shipping quote failed:", err);
    res
      .status(502)
      .json({ error: "Couldn't get shipping rates. Check the address and try again." });
  }
});