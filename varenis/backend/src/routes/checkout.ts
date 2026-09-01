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

interface ShippingInput {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
  phone?: string;
  email?: string;
  shippingName: string;
  shippingCents: number;
}

const VALID_SIZES = new Set(["S", "M", "L", "XL", "2XL", "3XL"]);

checkoutRouter.post("/session", async (req, res) => {
  const items = req.body?.items as CartItemInput[] | undefined;
  const creatorCodeInput = req.body?.creatorCode as string | undefined;
  const shipping = req.body?.shipping as ShippingInput | undefined;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }
  if (
    !shipping ||
    !shipping.address1 ||
    !shipping.city ||
    !shipping.country_code ||
    !shipping.zip ||
    typeof shipping.shippingCents !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "Shipping details are required. Please re-enter your address." });
  }

  const lineItems: {
    price_data: {
      currency: string;
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

  // Clamp the client-supplied shipping to a sane range so a tampered request
  // can't set negative or absurd shipping. (It was quoted by /api/quote.)
  const shippingCents = Math.max(0, Math.min(Math.round(shipping.shippingCents), 10000));

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
    }
  }

  const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:5173")
    .split(",")[0]
    .trim();

  // Stash the address we collected so the webhook can send it to Printful
  // (we no longer rely on Stripe to collect the shipping address).
  const metadata: Record<string, string> = {
    ship_name: shipping.name ?? "",
    ship_address1: shipping.address1,
    ship_address2: shipping.address2 ?? "",
    ship_city: shipping.city,
    ship_state: shipping.state_code ?? "",
    ship_country: shipping.country_code,
    ship_zip: shipping.zip,
    ship_phone: shipping.phone ?? "",
  };
  if (req.user) metadata.userId = req.user.id;
  if (creator) metadata.creatorCode = creator.code;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout/cancel`,
      // Add the exact shipping the customer already chose as a fixed option.
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingCents, currency: "usd" },
            display_name: shipping.shippingName || "Shipping",
          },
        },
      ],
      ...(shipping.email
        ? { customer_email: shipping.email }
        : req.user
        ? { customer_email: req.user.email }
        : {}),
      ...(discounts ? { discounts } : {}),
      metadata,
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