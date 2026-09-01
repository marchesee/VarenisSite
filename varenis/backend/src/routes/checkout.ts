import { Router } from "express";
import { stripe } from "../stripe.js";
import { PRODUCTS } from "../products.js";

export const checkoutRouter = Router();

interface CartItemInput {
  productId: string;
  quantity: number;
}

checkoutRouter.post("/session", async (req, res) => {
  const items = req.body?.items as CartItemInput[] | undefined;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  // Build Stripe line items from OUR catalog, never from prices the
  // client sent. This is the line that keeps someone from opening dev
  // tools and checking out a $2 jacket.
  const lineItems: {
    price_data: {
      currency: string;
      product_data: { name: string; metadata: { catalogId: string } };
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

    lineItems.push({
      price_data: {
        currency: "usd",
        // Stamp the catalog id on the product so the webhook can read it
        // back from the line item and map it to a Printful variant.
        product_data: {
          name: product.name,
          metadata: { catalogId: product.id },
        },
        unit_amount: product.priceCents,
      },
      quantity,
    });
  }

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout/cancel`,
      // Printful needs a shipping address to send the physical product.
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      // Collect a phone too; some Printful carriers want one.
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: false },
      // If the shopper is logged in, carry their user id through Stripe
      // as metadata so the webhook can attach the resulting order to
      // their account, and prefill the email so it matches. attachUser
      // ran globally, so req.user is set for logged-in requests.
      ...(req.user
        ? {
            customer_email: req.user.email,
            metadata: { userId: req.user.id },
          }
        : {}),
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