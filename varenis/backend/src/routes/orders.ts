import { Router } from "express";
import {
  getOrderBySessionId,
  getOrderByLookupCode,
  getOrdersByUserId,
  OrderRow,
} from "../db.js";
import { requireAuth } from "./middleware.js";

export const ordersRouter = Router();

function serialize(row: OrderRow) {
  return {
    id: row.id,
    lookupCode: row.lookup_code,
    email: row.email,
    amountTotalCents: row.amount_total_cents,
    status: row.status,
    createdAt: row.created_at,
    lines: JSON.parse(row.lines_json),
  };
}

// Every order belonging to the signed-in user, newest first. The user id
// comes from their verified session, never from the request body, so
// there's no way to ask for another account's orders.
ordersRouter.get("/mine", requireAuth, async (req, res) => {
  const rows = await getOrdersByUserId(req.user!.id);
  res.json(rows.map(serialize));
});

// Used only by the success page immediately after a Stripe redirect,
// where the browser has the session id from its own URL. This is not a
// general-purpose lookup — session ids aren't meant to be typed in by
// hand later, so this alone doesn't need brute-force protection the
// same way a public lookup form would.
ordersRouter.get("/by-session/:sessionId", async (req, res) => {
  const row = await getOrderBySessionId(req.params.sessionId);
  if (!row) return res.status(404).json({ error: "Order not found." });
  res.json(serialize(row));
});

// The general "look up an order later" path. Requires the lookup code
// shown once on the success page (32 hex chars, 128 bits of entropy) —
// knowing someone's email is not enough to see their purchase history.
// Rate limited in index.ts to slow down brute-force attempts further.
ordersRouter.get("/by-code/:lookupCode", async (req, res) => {
  const code = req.params.lookupCode;
  if (!/^[a-f0-9]{32}$/.test(code)) {
    return res.status(400).json({ error: "That order code doesn't look right." });
  }
  const row = await getOrderByLookupCode(code);
  if (!row) return res.status(404).json({ error: "No order found for that code." });
  res.json(serialize(row));
});