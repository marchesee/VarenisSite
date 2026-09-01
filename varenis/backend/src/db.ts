import pg from "pg";
import crypto from "node:crypto";

// Postgres-backed data layer. Every access to the database lives in this
// file; the rest of the app calls these functions and never touches SQL.
// (This replaced the original SQLite version for production — SQLite stores
// a file on disk, which most hosts wipe on redeploy, so orders/accounts
// would vanish. Postgres persists and handles concurrency.)
//
// Requires DATABASE_URL in the environment, e.g.
//   DATABASE_URL=postgresql://user:pass@host:5432/dbname
// Hosting platforms (Render, Supabase, Neon, Railway) give you this string.
// Locally, run a Postgres and point DATABASE_URL at it.

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Set it to your Postgres connection string."
  );
}

// Managed Postgres usually requires SSL. Most platforms accept this relaxed
// setting; if your provider needs stricter certs, adjust here.
const needsSsl =
  process.env.DATABASE_SSL === "true" ||
  /render\.com|neon\.tech|supabase\.co|railway|amazonaws\.com/.test(
    connectionString
  );

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

// Create tables on startup if they don't exist. Runs once; safe to re-run.
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      stripe_session_id TEXT UNIQUE NOT NULL,
      lookup_code TEXT UNIQUE NOT NULL,
      user_id TEXT,
      email TEXT NOT NULL,
      amount_total_cents INTEGER NOT NULL,
      status TEXT NOT NULL,
      lines_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_orders_lookup_code ON orders(lookup_code);`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`
  );
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

// 16 random bytes -> 32 hex chars. The guest "proof you placed this order",
// shown once on the success page.
export function generateLookupCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

function newUserId(): string {
  return `usr_${crypto.randomBytes(12).toString("hex")}`;
}

// ---------- Users ----------

export async function createUser(
  email: string,
  passwordHash: string
): Promise<UserRow> {
  const id = newUserId();
  const normEmail = email.toLowerCase().trim();
  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (id, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, password_hash, created_at`,
    [id, normEmail, passwordHash]
  );
  return rows[0];
}

export async function getUserByEmail(
  email: string
): Promise<UserRow | undefined> {
  const { rows } = await pool.query<UserRow>(
    `SELECT * FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  return rows[0];
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  const { rows } = await pool.query<UserRow>(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return rows[0];
}

// ---------- Orders ----------

export async function insertOrder(order: {
  id: string;
  stripeSessionId: string;
  lookupCode: string;
  userId: string | null;
  email: string;
  amountTotalCents: number;
  status: string;
  lines: { name: string; quantity: number; priceCents: number }[];
}): Promise<void> {
  await pool.query(
    `INSERT INTO orders
       (id, stripe_session_id, lookup_code, user_id, email,
        amount_total_cents, status, lines_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [
      order.id,
      order.stripeSessionId,
      order.lookupCode,
      order.userId,
      order.email.toLowerCase().trim(),
      order.amountTotalCents,
      order.status,
      JSON.stringify(order.lines),
    ]
  );
}

export async function getOrderBySessionId(
  sessionId: string
): Promise<OrderRow | undefined> {
  const { rows } = await pool.query<OrderRow>(
    `SELECT * FROM orders WHERE stripe_session_id = $1`,
    [sessionId]
  );
  return rows[0];
}

export async function getOrderByLookupCode(
  code: string
): Promise<OrderRow | undefined> {
  const { rows } = await pool.query<OrderRow>(
    `SELECT * FROM orders WHERE lookup_code = $1`,
    [code.trim()]
  );
  return rows[0];
}

export async function getOrdersByUserId(userId: string): Promise<OrderRow[]> {
  const { rows } = await pool.query<OrderRow>(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function claimOrdersForUser(
  userId: string,
  email: string
): Promise<void> {
  await pool.query(
    `UPDATE orders SET user_id = $1 WHERE user_id IS NULL AND email = $2`,
    [userId, email.toLowerCase().trim()]
  );
}