import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing. Copy .env.example to .env and add your Stripe secret key."
  );
}

// apiVersion pinned so a Stripe account upgrade doesn't silently change
// the shape of responses this server parses.
export const stripe = new Stripe(key, {
  apiVersion: "2024-06-20",
});
