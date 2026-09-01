import { Router } from "express";
import Stripe from "stripe";
import { stripe } from "../stripe.js";
import { insertOrder, generateLookupCode } from "../db.js";
import { createPrintfulOrder } from "../printful.js";
import { resolvePrintfulVariant } from "../printful-map.js";
import { PRODUCTS } from "../products.js";
import { resolveCreatorCode } from "../creator-codes.js";
import { appendSaleRow } from "../creator-csv.js";

export const webhookRouter = Router();

// IMPORTANT: this route must receive the RAW request body (not JSON parsed)
// or Stripe's signature check will fail. Wired up in index.ts by mounting
// express.raw() only for this path, before the global express.json().
webhookRouter.post("/", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("Missing Stripe signature or STRIPE_WEBHOOK_SECRET.");
    return res.status(400).send("Webhook not configured.");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send("Invalid signature.");
  }

  if (event.type === "checkout.session.completed") {
    const slimSession = event.data.object as Stripe.Checkout.Session;

    try {
      // Retrieve the full session with line items + their product expanded,
      // and the total_details expanded so we can read the discount amount.
      const session = await stripe.checkout.sessions.retrieve(slimSession.id, {
        expand: ["line_items.data.price.product", "total_details"],
      });

      const lineItems = session.line_items?.data ?? [];
      const orderId = `ord_${session.id.slice(-14)}`;

      // 1) Record the paid order (source of truth that money changed hands).
      await insertOrder({
        id: orderId,
        stripeSessionId: session.id,
        lookupCode: generateLookupCode(),
        userId: session.metadata?.userId ?? null,
        email: session.customer_details?.email ?? "unknown@example.com",
        amountTotalCents: session.amount_total ?? 0,
        status: session.payment_status ?? "paid",
        lines: lineItems.map((li) => ({
          name: li.description ?? "Item",
          quantity: li.quantity ?? 1,
          priceCents: (li.amount_total ?? 0) / (li.quantity || 1),
        })),
      });

      // 2) Fulfillment (isolated so a failure never loses the sale).
      await submitToPrintful(session, orderId);

      // 3) Creator-code accounting → CSV (also isolated).
      await recordCreatorSale(session, orderId).catch((e) =>
        console.error(`[csv] Failed to write sale row for ${orderId}:`, e)
      );
    } catch (err) {
      console.error("Failed to record order from webhook:", err);
      // Still 200 so Stripe doesn't retry forever; payment already succeeded.
    }
  }

  res.json({ received: true });
});

// ---- Fulfillment ----------------------------------------------------------

async function submitToPrintful(
  session: Stripe.Checkout.Session,
  orderId: string
): Promise<void> {
  try {
    const details = session.customer_details;
    const loose = session as unknown as {
      collected_information?: {
        shipping_details?: Stripe.Checkout.Session.ShippingDetails | null;
      };
      shipping_details?: Stripe.Checkout.Session.ShippingDetails | null;
    };
    const shipping =
      loose.collected_information?.shipping_details ??
      loose.shipping_details ??
      null;
    const addr = shipping?.address;

    if (!addr || !details) {
      console.error(
        `[printful] Order ${orderId}: no shipping address on session; ` +
          `cannot fulfill. Recorded as paid — fulfill manually.`
      );
      return;
    }

    const lineItems = session.line_items?.data ?? [];
    const items = [];

    for (const li of lineItems) {
      const product = li.price?.product as Stripe.Product | undefined;
      const meta = product?.metadata ?? {};
      const catalogId = meta.catalogId as string | undefined;
      const size = (meta.size as string | undefined) || undefined;

      if (!catalogId) {
        console.error(
          `[printful] Order ${orderId}: line "${li.description}" has no ` +
            `catalogId metadata; skipping this line.`
        );
        continue;
      }

      // Resolve the exact Printful sync variant for this catalogId + size.
      const ref = resolvePrintfulVariant(catalogId, size);
      if (!ref) {
        console.error(
          `[printful] Order ${orderId}: no Printful mapping for ` +
            `"${catalogId}"${size ? ` size ${size}` : ""}; skipping.`
        );
        continue;
      }

      items.push({ variant_id: ref.variantId, quantity: li.quantity ?? 1 });
    }

    if (items.length === 0) {
      console.error(
        `[printful] Order ${orderId}: no fulfillable lines; nothing sent. ` +
          `Order is recorded as paid — fulfill manually.`
      );
      return;
    }

    const created = await createPrintfulOrder({
      externalId: orderId,
      confirm: false, // draft until you confirm; flip to true to auto-ship
      recipient: {
        name: (shipping?.name ?? details.name) ?? "Customer",
        email: details.email ?? "unknown@example.com",
        phone: details.phone ?? undefined,
        address1: addr.line1 ?? "",
        address2: addr.line2 ?? undefined,
        city: addr.city ?? "",
        state_code: addr.state ?? "",
        country_code: addr.country ?? "US",
        zip: addr.postal_code ?? "",
      },
      items,
    });

    console.log(
      `[printful] Order ${orderId} submitted to Printful as ${created.id} ` +
        `(status: ${created.status}).`
    );
  } catch (err) {
    console.error(
      `[printful] Fulfillment FAILED for ${orderId} — order is paid and ` +
        `recorded; needs manual resubmit:`,
      err
    );
  }
}

// ---- Creator-code accounting ---------------------------------------------

async function recordCreatorSale(
  session: Stripe.Checkout.Session,
  orderId: string
): Promise<void> {
  const code = session.metadata?.creatorCode;
  const creator = resolveCreatorCode(code);

  // Only track orders that actually used a known creator code.
  if (!creator) return;

  const lineItems = session.line_items?.data ?? [];

  // Post-discount item revenue = sum of each line's amount_total (Stripe has
  // already applied the discount there). Also sum our cost from the catalog.
  let revenueCents = 0;
  let costCents = 0;
  for (const li of lineItems) {
    revenueCents += li.amount_total ?? 0;
    const product = li.price?.product as Stripe.Product | undefined;
    const catalogId = product?.metadata?.catalogId as string | undefined;
    const cat = catalogId ? PRODUCTS[catalogId] : undefined;
    const unitCost = cat?.costCents ?? 0;
    costCents += unitCost * (li.quantity ?? 1);
  }

  // Discount amount Stripe applied (in cents), if any.
  const discountCents = session.total_details?.amount_discount ?? 0;

  // Creator commission = commissionPct of post-discount revenue.
  const commissionCents = Math.round(
    (revenueCents * creator.commissionPct) / 100
  );

  // Profit = revenue - your product cost - creator commission.
  // (Shipping and Stripe fees aren't included here — add later if you want a
  // fully-loaded figure.)
  const profitCents = revenueCents - costCents - commissionCents;

  await appendSaleRow({
    orderId,
    creatorCode: creator.code,
    discountPct: creator.discountPct,
    commissionPct: creator.commissionPct,
    revenueCents,
    discountCents,
    commissionCents,
    costCents,
    profitCents,
  });

  console.log(
    `[csv] Recorded sale for ${orderId} — code ${creator.code}, ` +
      `revenue ${revenueCents}c, commission ${commissionCents}c, ` +
      `profit ${profitCents}c.`
  );
}