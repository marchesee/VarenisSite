import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SQLite keeps this a zero-setup demo. To move to Postgres later, swap
// this file for a `pg` Pool and keep the same function signatures —
// nothing outside this file needs to change.
export const db = new Database(path.join(__dirname, "..", "orders.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    stripe_session_id TEXT UNIQUE NOT NULL,
    lookup_code TEXT UNIQUE NOT NULL,
    user_id TEXT,
    email TEXT NOT NULL,
    amount_total_cents INTEGER NOT NULL,
    status TEXT NOT NULL,
    lines_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_orders_lookup_code ON orders(lookup_code);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
`);

// If this database was created before accounts existed, add the new
// column in place so existing installs don't have to wipe their data.
try {
  const cols = db.prepare(`PRAGMA table_info(orders)`).all() as { name: string }[];
  if (!cols.some((c) => c.name === "user_id")) {
    db.exec(`ALTER TABLE orders ADD COLUMN user_id TEXT`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`);
  }
} catch {
  // Fresh DB — table was just created above with the column already.
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface OrderRow {
  id: string;
  stripe_session_id: string;
  lookup_code: string;
  user_id: string | null;
  email: string;
  amount_total_cents: number;
  status: string;
  lines_json: string;
  created_at: string;
}

// 16 random bytes -> 32 hex chars. Unguessable by brute force even
// without rate limiting, and it's the guest "proof you placed this
// order" — shown once on the success page. Logged-in users don't need
// it; they see their orders through their account.
export function generateLookupCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

function newUserId(): string {
  return `usr_${crypto.randomBytes(12).toString("hex")}`;
}

// ---------- Users ----------

export function createUser(email: string, passwordHash: string): UserRow {
  const user: UserRow = {
    id: newUserId(),
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO users (id, email, password_hash, created_at)
     VALUES (@id, @email, @password_hash, @created_at)`
  ).run(user);
  return user;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .get(email.toLowerCase().trim()) as UserRow | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as
    | UserRow
    | undefined;
}

// ---------- Orders ----------

export function insertOrder(order: {
  id: string;
  stripeSessionId: string;
  lookupCode: string;
  userId: string | null;
  email: string;
  amountTotalCents: number;
  status: string;
  lines: { name: string; quantity: number; priceCents: number }[];
}) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO orders
      (id, stripe_session_id, lookup_code, user_id, email, amount_total_cents, status, lines_json, created_at)
    VALUES (@id, @stripeSessionId, @lookupCode, @userId, @email, @amountTotalCents, @status, @linesJson, @createdAt)
  `);
  stmt.run({
    id: order.id,
    stripeSessionId: order.stripeSessionId,
    lookupCode: order.lookupCode,
    userId: order.userId,
    email: order.email.toLowerCase().trim(),
    amountTotalCents: order.amountTotalCents,
    status: order.status,
    linesJson: JSON.stringify(order.lines),
    createdAt: new Date().toISOString(),
  });
}

// Fetch by Stripe session id — used right after checkout, when the
// browser genuinely knows its own session id from the redirect URL.
export function getOrderBySessionId(sessionId: string): OrderRow | undefined {
  return db
    .prepare(`SELECT * FROM orders WHERE stripe_session_id = ?`)
    .get(sessionId) as OrderRow | undefined;
}

// Fetch by lookup code — the guest path for looking an order up later.
// One order per code, never a list, so a leaked/guessed code exposes
// exactly one purchase instead of a person's whole history.
export function getOrderByLookupCode(code: string): OrderRow | undefined {
  return db
    .prepare(`SELECT * FROM orders WHERE lookup_code = ?`)
    .get(code.trim()) as OrderRow | undefined;
}

// The account path: every order that belongs to this user, newest first.
// Only ever called with a user_id proven by a verified session token, so
// there's no way to ask for someone else's orders.
export function getOrdersByUserId(userId: string): OrderRow[] {
  return db
    .prepare(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(userId) as OrderRow[];
}

// When a logged-in guest checks out, Stripe knows their email but we
// stamp the order with their user_id at creation time (see checkout
// route). This also back-links any *earlier* guest orders that used the
// same email, so signing up later still gathers past purchases.
export function claimOrdersForUser(userId: string, email: string) {
  db.prepare(
    `UPDATE orders SET user_id = ? WHERE user_id IS NULL AND email = ?`
  ).run(userId, email.toLowerCase().trim());
}
