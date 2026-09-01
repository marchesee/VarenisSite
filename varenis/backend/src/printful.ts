// Printful API wrapper. Mirrors how stripe.ts wraps Stripe: one place that
// holds the credential and exposes typed helpers, so the rest of the app
// never hand-builds fetch calls or touches the token directly.
//
// The token can place REAL orders that cost REAL money, so like the Stripe
// secret key it lives only in the backend .env and is never sent to the
// browser. Add to your .env:
//
//   PRINTFUL_API_TOKEN=your_private_token
//
// Get the token from the Printful Developers Portal
// (https://developers.printful.com) → create a PRIVATE token scoped to your
// store. A store-scoped token targets your store automatically, so you do
// NOT need to send a store id header. (If you ever use an account-level
// token instead, you'd add an "X-PF-Store-Id" header — not needed here.)

const token = process.env.PRINTFUL_API_TOKEN;
if (!token) {
  throw new Error(
    "PRINTFUL_API_TOKEN is missing. Add it to .env — create a Private token at https://developers.printful.com"
  );
}

const API_BASE = "https://api.printful.com";

const baseHeaders = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

// ---- Types (only the fields we actually use) --------------------------------

// A Printful "variant" is a specific product+color+size combination,
// identified by a numeric variant_id you look up per product.
export interface PrintfulItem {
  variant_id: number;
  quantity: number;
  // Optional: which of your saved design files / print areas to use. If you
  // designed the product in Printful's dashboard and are ordering by
  // sync_variant, you can use that path instead — see note in printful-map.ts.
}

export interface PrintfulRecipient {
  name: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string; // e.g. "NH"
  country_code: string; // e.g. "US"
  zip: string;
}

export interface CreateOrderInput {
  // Your own order id (the one you already generate from the Stripe session).
  // Printful stores it as external_id for cross-referencing.
  externalId: string;
  recipient: PrintfulRecipient;
  items: PrintfulItem[];
  // If false/omitted, Printful creates the order as a DRAFT and does NOT
  // charge you or send to production until you confirm it — the safe default
  // while testing. Set confirm:true only once you're happy going live.
  confirm?: boolean;
}

interface PrintfulOrderResponse {
  code: number;
  result: {
    id: number;
    external_id?: string;
    status: string;
  };
}

// ---- Core API calls ---------------------------------------------------------

// Submit an order to Printful for fulfillment. Returns as a draft unless
// confirm:true is passed. A non-2xx or a Printful error code throws so the
// caller (the webhook) can log it and keep the paid order for manual retry.
export async function createPrintfulOrder(
  input: CreateOrderInput
): Promise<PrintfulOrderResponse["result"]> {
  const body = {
    external_id: input.externalId,
    confirm: input.confirm ?? false,
    recipient: input.recipient,
    // Order by sync_variant_id — a "sync variant" is the product variant WITH
    // your uploaded design attached, so Printful pulls in the print files
    // automatically. (Ordering by the raw catalog variant_id fails with
    // "Item can't be submitted without any print files", because a raw
    // variant is just a blank garment with no artwork.)
    items: input.items.map((i) => ({
      sync_variant_id: i.variant_id,
      quantity: i.quantity,
    })),
  };

  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as
    | PrintfulOrderResponse
    | { code?: number; error?: { message?: string }; result?: string }
    | null;

  if (!res.ok || !json || (json as PrintfulOrderResponse).code >= 400) {
    const msg =
      (json as { error?: { message?: string } })?.error?.message ??
      (typeof (json as { result?: string })?.result === "string"
        ? (json as { result?: string }).result
        : `HTTP ${res.status}`);
    throw new Error(`Printful createOrder failed: ${msg}`);
  }

  return (json as PrintfulOrderResponse).result;
}

// Ask Printful what shipping will cost for a set of items + destination,
// BEFORE checkout, so you can charge the customer the right amount rather
// than eating it. Returns rate options; take the first (cheapest) or let the
// customer choose. Prices come back as strings in the store currency.
export async function getShippingRates(input: {
  recipient: Pick<
    PrintfulRecipient,
    "address1" | "city" | "state_code" | "country_code" | "zip"
  >;
  items: PrintfulItem[];
}): Promise<Array<{ id: string; name: string; rate: string; currency: string }>> {
  const res = await fetch(`${API_BASE}/shipping/rates`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({
      recipient: input.recipient,
      items: input.items.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
      })),
    }),
  });

  const json = (await res.json().catch(() => null)) as
    | { code: number; result: Array<{ id: string; name: string; rate: string; currency: string }> }
    | null;

  if (!res.ok || !json || json.code >= 400) {
    throw new Error(`Printful shipping rates failed: HTTP ${res.status}`);
  }
  return json.result;
}

// One-time helper: list this token's store(s), to confirm the token works and
// see the store it's scoped to.
export async function getStores(): Promise<unknown> {
  const res = await fetch(`${API_BASE}/stores`, { headers: baseHeaders });
  if (!res.ok) throw new Error(`Printful getStores failed: HTTP ${res.status}`);
  return res.json();
}