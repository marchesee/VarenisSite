# Printful integration — what's included

This project now submits paid orders to **Printful** for printing & shipping,
on top of the existing Stripe checkout. The flow:

  customer pays (Stripe Checkout) → webhook verifies + records the order →
  webhook calls Printful to create the order (as a DRAFT) → you approve it.

## New / changed backend files

- `backend/src/printful.ts` — Printful API wrapper (create order, shipping
  rates, list stores). Reads `PRINTFUL_API_TOKEN` from `.env`.
- `backend/src/printful-map.ts` — **you fill this in.** Maps your catalog ids
  (e.g. `leopard-tee-black-l`) to Printful numeric `variant_id`s.
- `backend/src/routes/webhook.ts` — records the order (with lookup code +
  user id, as before) and then submits it to Printful, with fulfillment
  failures isolated so a Printful error never loses a paid sale.
- `backend/src/routes/checkout.ts` — stamps each line with its `catalogId`
  (so the webhook can map it) and collects a phone number. All existing
  price-from-server security and logged-in-user metadata is preserved.

## To make it live

1. Add `PRINTFUL_API_TOKEN` to `backend/.env` (see `.env.example`). Create the
   token in the Printful Developers Portal as a Private token scoped to your
   store.
2. Fill in `backend/src/printful-map.ts` with your products' Printful variant
   ids. Get them from:
     GET https://api.printful.com/store/products
     GET https://api.printful.com/store/products/{id}
   (send header `Authorization: Bearer <token>`), reading each sync variant's
   `variant_id`.
3. Keep orders as drafts (`confirm: false`, already set) while testing. Use
   Stripe test mode + card 4242 4242 4242 4242, then check the Printful
   dashboard for the draft order.
4. Go live: Stripe live keys + live webhook endpoint, then either set
   `confirm: true` in webhook.ts or approve each order by hand in Printful.

## Still worth doing (not yet wired)

- Charge real shipping: `printful.ts` has `getShippingRates()` — call it during
  checkout and add it as a Stripe shipping option, so you don't eat shipping.
- Store the Printful order id on your order row (add a column in `db.ts`) to
  show fulfillment status / tracking later.
