import { Router } from "express";
import { stripe } from "../stripe.js";
import { PRODUCTS } from "../products.js";
import { resolveCreatorCode } from "../creator-codes.js";

export const checkoutRouter = Router();

interface CartItemInput {
  productId: string;
  size: string | null;
  quantity: number;
}

const VALID_SIZES = new Set(["S", "M", "L", "XL", "2XL", "3XL"]);

checkoutRouter.post("/session", async (req, res) => {
  const items = req.body?.items as CartItemInput[] | undefined;
  const creatorCodeInput = req.body?.creatorCode as string | undefined;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  // Build Stripe line items from OUR catalog, never from prices the client
  // sent. This is what stops someone editing the price in dev tools.
  const lineItems: {
    price_data: {
      currency: string;
      // catalogId + size live on product_data.metadata (a valid place for
      // metadata). The webhook reads them back to pick the Printful variant.
      product_data: { name: string; metadata: { catalogId: string; size: string } };
      unit_amount: number;
    };
    quantity: number;
  }[] = [];

  for (const item of items) {
    const product = PRODUCTS[item.productId];
    const quantity = Math.floor(Number(item.quantity));

    if (!product) {
      return res.status(400).json({ error: `Unknown product: ${item.productId}` });
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: `Invalid quantity for ${product.name}` });
    }

    // size may be null for display-only unsized products; if present it must
    // be one we recognise.
    const size = item.size ?? "";
    if (size && !VALID_SIZES.has(size)) {
      return res.status(400).json({ error: `Invalid size for ${product.name}` });
    }

    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: size ? `${product.name} (${size})` : product.name,
          metadata: { catalogId: product.id, size },
        },
        unit_amount: product.priceCents,
      },
      quantity,
    });
  }

  // Resolve an optional creator code → a Stripe coupon for the % discount.
  // We also stash the code in session metadata so the webhook's CSV tracker
  // knows which creator to credit.
  const creator = resolveCreatorCode(creatorCodeInput);
  let discounts: { coupon: string }[] | undefined;
  if (creator) {
    try {
      const coupon = await stripe.coupons.create({
        percent_off: creator.discountPct,
        duration: "once",
        name: `Creator ${creator.code}`,
      });
      discounts = [{ coupon: coupon.id }];
    } catch (err) {
      console.error("Failed to create discount coupon:", err);
      // If coupon creation fails, proceed without a discount rather than
      // blocking the sale.
    }
  }

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  // Merge metadata: logged-in user id (if any) + creator code (if any).
  const metadata: Record<string, string> = {};
  if (req.user) metadata.userId = req.user.id;
  if (creator) metadata.creatorCode = creator.code;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: false },
      ...(discounts ? { discounts } : {}),
      ...(req.user ? { customer_email: req.user.email } : {}),
      ...(Object.keys(metadata).length ? { metadata } : {}),
    });

    if (!session.url) {
      return res.status(500).json({ error: "Stripe did not return a checkout URL." });
    }

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session error:", err);
    res.status(500).json({ error: "Could not start checkout. Try again." });
  }
});