# Varenis — Boston

A full clothing-brand storefront for **Varenis**, an elegant Boston
apparel label: product catalog, categories, cart, Stripe Checkout,
accounts, and order lookup. Two pieces:

```
frontend/   React + Vite + TypeScript — the storefront UI
backend/    Node + Express + TypeScript — creates Stripe Checkout Sessions,
            verifies Stripe webhooks, stores orders in SQLite
```

## Why there's a backend at all

Stripe Payment Links are great for a single fixed-price item, but they
don't handle a dynamic multi-item cart well, and you asked for order
history too — that needs somewhere to record what got paid for. So this
uses **Stripe Checkout** (Stripe's own hosted, PCI-compliant payment page —
you still never touch card numbers) with the session created dynamically
by a small backend from whatever's in the cart. That's the standard,
secure pattern for a real cart-based store.

**Card data never touches this code.** The backend only ever talks to
Stripe's API with your secret key; the browser is redirected to a page
hosted by Stripe to actually enter card details.

## 1. Get Stripe keys (test mode)

1. Create a free account at https://dashboard.stripe.com/register
2. Make sure you're in **test mode** (toggle top-right of the dashboard).
3. Go to **Developers → API keys** and copy the **Secret key** (`sk_test_...`).
4. Install the Stripe CLI to test webhooks locally: https://docs.stripe.com/stripe-cli
   ```bash
   stripe login
   stripe listen --forward-to localhost:4242/api/webhook
   ```
   This prints a `whsec_...` value — that's your webhook secret for local dev.

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
STRIPE_SECRET_KEY=sk_test_...        # from step 1
STRIPE_WEBHOOK_SECRET=whsec_...      # from `stripe listen`
JWT_SECRET=...                       # any long random string; see below
FRONTEND_URL=http://localhost:5173
PORT=4242
```

Generate a `JWT_SECRET` with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
npm run dev
```

Leave `stripe listen` running in a second terminal — it's what lets your
local server hear "payment succeeded" from Stripe.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173. Add something to the cart and hit
**Checkout with Stripe** — it'll redirect to a real Stripe-hosted checkout
page in test mode.

**Test card:** `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
More test cards (declines, 3D Secure, etc.): https://docs.stripe.com/testing

After a successful test payment, the `stripe listen` terminal will show
the webhook firing, and the order will show up under **Order Lookup** on
the site using the email you typed into Stripe Checkout.

## How a purchase actually flows

1. Browser sends the cart (`productId` + `quantity` only — never a price)
   to `POST /api/checkout/session`.
2. Backend looks up the real price for each `productId` in its own
   catalog (`backend/src/products.ts`) and builds the Stripe session from
   *that*. A tampered request from dev tools can't buy anything below
   the real price.
3. Browser is redirected to Stripe's hosted checkout page.
4. On success, Stripe redirects back to `/checkout/success` **and**
   separately calls your webhook (`POST /api/webhook`) server-to-server.
   The webhook is the source of truth for "this order is paid" — the
   redirect alone is just a UX nicety and is never trusted for that.
5. The webhook handler verifies Stripe's signature, then writes the order
   to `orders.db` (SQLite) along with a freshly generated random lookup
   code.
6. The success page fetches that order by Stripe session id (it polls a
   few times since the webhook can land a couple seconds after the
   redirect) and displays the lookup code — save it, it's the receipt.
7. `/orders` looks up **one order at a time by that code**, never a list
   by email. See the Security notes below for why.

## Keeping the two product catalogs in sync

There are two copies of the product list on purpose:

- `frontend/src/data/products.ts` — for rendering (images, descriptions).
- `backend/src/products.ts` — the **only** copy the backend trusts for
  price. This is what actually gets charged.

If you add or reprice a product, update both, keeping `id` identical
between them. For a bigger version of this project, you'd pull both from
one shared source (a database or a JSON file both sides import) instead
of hand-syncing two files — worth doing once you're past the prototype
stage.

## Accounts and order history

There are now two ways to see an order:

- **Signed in** — create an account (email + password) and every order you
  place while logged in is tied to it. `Your Orders` shows the full list,
  no codes to keep track of. Signing up also back-links any earlier guest
  orders that used the same email.
- **Guest** — no account needed. Each order still gets its one-time lookup
  code on the success page, and `Order Lookup` finds that single order.

How the auth works, and why it's built this way:

- Passwords are hashed with **bcrypt** (cost factor 12) — the database
  never stores a plaintext or reversibly-encrypted password.
- Login issues a **JWT stored in an httpOnly cookie**. httpOnly means
  page JavaScript can't read the token, so an XSS bug can't steal the
  session. The cookie is `sameSite=lax` (not sent on cross-site POSTs,
  which blunts CSRF) and `secure` in production (HTTPS only).
- The "my orders" endpoint keys off the **user id inside the verified
  token**, never off anything in the request body — so there's no way to
  ask for someone else's orders by editing a request.
- Login uses a **constant-ish-time path**: it runs a bcrypt comparison
  even when the email doesn't exist, and returns the same generic error
  for "no such user" and "wrong password," so an attacker can't probe
  which emails are registered via timing or error text. (Signup does
  still tell you if an email is taken — a deliberate UX trade noted in
  the code.)
- Auth endpoints are rate limited harder than the rest (12 attempts per
  15 min per IP) since login is the prime brute-force target.

### Still worth adding for a real launch

- **Email verification and password reset.** There's no "forgot
  password" flow yet — losing a password currently means losing the
  account. This is the first thing to add before real customers.
- **The JWT can't be revoked before it expires** (30 days). For a store
  that's usually fine; if you need instant "log out everywhere," move to
  server-side sessions or keep a token-version column you can bump.
- Everything in the earlier security notes still applies.

## Accounts and order history

There are now two ways to see an order:

- **Signed in** — create an account (email + password) and every order you
  place while logged in is tied to it. `Your Orders` shows the full list,
  no codes to keep track of. Signing up also back-links any earlier guest
  orders that used the same email.
- **Guest** — no account needed. Each order still gets its one-time lookup
  code on the success page, and `Order Lookup` finds that single order.

How the auth works, and why it's built this way:

- Passwords are hashed with **bcrypt** (cost factor 12) — the database
  never stores a plaintext or reversibly-encrypted password.
- Login issues a **JWT stored in an httpOnly cookie**. httpOnly means
  page JavaScript can't read the token, so an XSS bug can't steal the
  session. The cookie is `sameSite=lax` (not sent on cross-site POSTs,
  which blunts CSRF) and `secure` in production (HTTPS only).
- The "my orders" endpoint keys off the **user id inside the verified
  token**, never off anything in the request body — so there's no way to
  ask for someone else's orders by editing a request.
- Login uses a **constant-ish-time path**: it runs a bcrypt comparison
  even when the email doesn't exist, and returns the same generic error
  for "no such user" and "wrong password," so an attacker can't probe
  which emails are registered via timing or error text. (Signup does
  still tell you if an email is taken — a deliberate UX trade noted in
  the code.)
- Auth endpoints are rate limited harder than the rest (12 attempts per
  15 min per IP) since login is the prime brute-force target.

### Still worth adding for a real launch

- **Email verification and password reset.** There's no "forgot
  password" flow yet — losing a password currently means losing the
  account. This is the first thing to add before real customers.
- **The JWT can't be revoked before it expires** (30 days). For a store
  that's usually fine; if you need instant "log out everywhere," move to
  server-side sessions or keep a token-version column you can bump.
- Everything in the earlier security notes still applies.

## Security notes

- **Never commit `.env`.** It's already in `.gitignore`. The secret key in
  there can create charges and issue refunds on your account.
- The **secret key** (`sk_test_...` / `sk_live_...`) only ever lives on
  the backend — it's never sent to or read by the browser.
- Prices are always resolved server-side from `backend/src/products.ts`,
  never trusted from the client. This is the #1 thing DIY checkouts get
  wrong.
- The webhook route verifies Stripe's signature (`stripe-signature`
  header) before trusting *any* webhook payload — otherwise anyone could
  POST a fake "payment succeeded" event to your server.
- **Order lookup requires an unguessable per-order code, not just an
  email.** Each order gets a random 128-bit `lookup_code` (generated in
  `backend/src/db.ts`) shown once on the success page. Looking up an
  order by code proves you actually have the receipt; looking up "every
  order for jane@example.com" would let anyone who knows Jane's email
  see her purchase history, so that path was deliberately removed
  (`backend/src/routes/orders.ts`). The success page itself fetches by
  Stripe session id, which only the browser that just paid actually
  knows.
- **Rate limiting** is applied to `/api/checkout/*` and `/api/orders/*`
  (`backend/src/index.ts`, via `express-rate-limit`) — 20 checkout
  attempts and 30 lookup attempts per 10 minutes per IP by default. This
  mostly slows down abuse rather than stopping a determined attacker;
  treat it as one layer, not the whole defense.
- `automatic_tax` is off by default since it needs Stripe Tax configured
  for your jurisdiction — turn it on in `backend/src/routes/checkout.ts`
  once you've set that up in the Stripe dashboard.

### What this still doesn't cover

- **No real authentication.** There's no login system, so "your orders"
  only exists in the sense of "whoever has the code." Fine for a
  learning project; add real accounts (and tie orders to a `user_id`)
  before this touches real customers who'd expect an account.
- **Rate limiting is per-IP and in-memory**, so it resets if the server
  restarts and won't help if the backend runs behind a shared NAT/proxy
  that masks individual IPs, or if you scale to multiple server
  instances. A production setup would use a shared store (Redis) for
  the rate limiter.
- **No CAPTCHA or bot protection** on checkout — a scripted attacker
  could still burn through the rate limit budget with automation. Not
  usually worth the added friction until you see real abuse.
- **No input sanitization library beyond what's here** — email and
  quantity get basic validation, but this hasn't been through a formal
  security review. Treat it as a solid learning-project baseline, not a
  production audit.

## Going to production

1. **Switch to live keys.** Toggle out of test mode in the Stripe
   dashboard, grab the `sk_live_...` key, and set up a **live** webhook
   endpoint under Developers → Webhooks pointing at your deployed
   backend's `/api/webhook` URL, subscribed to `checkout.session.completed`.
2. **Deploy the backend somewhere that keeps a filesystem**, or swap
   SQLite for Postgres — you've already got a Postgres + AWS Fargate setup
   from the resume tailor project; the same container pattern works here.
   Only `backend/src/db.ts` needs to change; the routes call `insertOrder`
   / `getOrdersByEmail` and don't care what's underneath.
3. **Deploy the frontend** as a static build (`npm run build` → the
   `dist/` folder) to Vercel, Netlify, or an S3 + CloudFront bucket. Set
   `VITE_API_BASE` to your backend's public URL if it's not on the same
   domain.
4. Update `FRONTEND_URL` in the backend's `.env` to your real domain, and
   lock CORS down to that origin (already wired up via the `cors` package
   in `src/index.ts`).
5. Consider adding rate limiting on `/api/checkout/session` (e.g.
   `express-rate-limit`) so the endpoint can't be hammered.

## Extending it

- **Auth-backed order history** — done (see "Accounts and order history"
  above). Next auth step would be email verification + password reset.
- **Inventory:** the catalog currently has no stock tracking; add a
  `stock` column and check it before creating a checkout session.
- **Product images:** swap the CSS swatch blocks in
  `ProductCard`/`ProductModal` for real photos once you have them.
- **Refunds/admin view:** a small internal page hitting
  `stripe.refunds.create()` for support use.
