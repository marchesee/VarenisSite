import { Router } from "express";
import Stripe from "stripe";
import { stripe } from "../stripe.js";
import { insertOrder, generateLookupCode } from "../db.js";
import { createPrintfulOrder } from "../printful.js";
import { resolvePrintfulVariant } from "../printful-map.js";

export const webhookRouter = Router();

// IMPORTANT: this route must receive the RAW request body (not JSON
// parsed) or Stripe's signature check will fail. That's wired up in
// index.ts by mounting express.raw() only for this path, before the
// global express.json() middleware.
webhookRouter.post("/", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("Missing Stripe signature or STRIPE_WEBHOOK_SECRET.");
    return res.status(400).send("Webhook not configured.");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send("Invalid signature.");
  }

  if (event.type === "checkout.session.completed") {
    const slimSession = event.data.object as Stripe.Checkout.Session;

    try {
      // The session on the webhook EVENT is slim on line items, so retrieve
      // the full session and expand the line items (with product) so we can
      // read the catalogId. customer_details and shipping_details come back
      // on the session automatically — they must NOT be in expand[].
      const session = await stripe.checkout.sessions.retrieve(slimSession.id, {
        expand: ["line_items.data.price.product"],
      });

      const lineItems = session.line_items?.data ?? [];
      const orderId = `ord_${session.id.slice(-14)}`;

      // 1) Record the paid order first — the source of truth that money
      //    changed hands. Must succeed independently of fulfillment.
      insertOrder({
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

      // 2) Submit to Printful for fulfillment. Isolated: payment already
      //    succeeded and the order is already recorded, so a Printful
      //    failure must NOT throw away the sale. Logged for manual resubmit.
      await submitToPrintful(session, orderId);
    } catch (err) {
      console.error("Failed to record order from webhook:", err);
      // Still 200 so Stripe doesn't retry forever on a bug a retry can't
      // fix; the payment already succeeded either way.
    }
  }

  res.json({ received: true });
});

// Translate the (fully-expanded) Stripe session into a Printful order and
// submit it. Kept separate so the fulfillment failure mode is isolated from
// the payment-recording path above.
async function submitToPrintful(
  session: Stripe.Checkout.Session,
  orderId: string
): Promise<void> {
  try {
    const details = session.customer_details;
    // On the pinned API version shipping lives on shipping_details (now
    // populated because we retrieved the session with it expanded). Newer
    // API versions moved it to collected_information; tolerate both via a
    // loose read so a future Stripe upgrade doesn't silently break this.
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
      const catalogId =
        (li.price?.metadata?.catalogId as string | undefined) ??
        (product?.metadata?.catalogId as string | undefined);

      if (!catalogId) {
        console.error(
          `[printful] Order ${orderId}: line "${li.description}" has no ` +
            `catalogId metadata; skipping this line.`
        );
        continue;
      }

      const ref = resolvePrintfulVariant(catalogId);
      if (!ref) {
        console.error(
          `[printful] Order ${orderId}: no Printful mapping for "${catalogId}"; ` +
            `skipping. Add it to printful-map.ts.`
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
      // confirm:false => Printful holds it as a DRAFT so nothing prints
      // while testing. Flip to true (or confirm in the dashboard) when live.
      confirm: false,
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