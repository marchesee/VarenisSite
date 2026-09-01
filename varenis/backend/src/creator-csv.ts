import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Appends one row per paid order to a CSV on disk. Tracks, per order: the
// creator code used, revenue, discount, creator commission, product cost, and
// resulting profit. The file lives next to the backend (backend/data) and is
// created with a header row on first write.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// src/creator-csv.ts -> backend/data/creator-sales.csv
const DATA_DIR = path.resolve(__dirname, "..", "data");
const CSV_PATH = path.join(DATA_DIR, "creator-sales.csv");

const HEADER =
  "order_id,date_iso,creator_code,discount_pct,commission_pct," +
  "revenue_cents,discount_cents,commission_cents,cost_cents,profit_cents\n";

export interface SaleRow {
  orderId: string;
  creatorCode: string; // "" if none
  discountPct: number;
  commissionPct: number;
  revenueCents: number; // what the customer actually paid for items (post-discount)
  discountCents: number; // how much the discount took off
  commissionCents: number; // what the creator earns
  costCents: number; // your Printful cost for the items
  profitCents: number; // revenue - cost - commission
}

// CSV-escape a field (quote if it contains comma/quote/newline).
function esc(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function appendSaleRow(row: SaleRow): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Write the header once, if the file doesn't exist yet.
  try {
    await fs.access(CSV_PATH);
  } catch {
    await fs.writeFile(CSV_PATH, HEADER, "utf8");
  }

  const line =
    [
      esc(row.orderId),
      esc(new Date().toISOString()),
      esc(row.creatorCode),
      esc(row.discountPct),
      esc(row.commissionPct),
      esc(row.revenueCents),
      esc(row.discountCents),
      esc(row.commissionCents),
      esc(row.costCents),
      esc(row.profitCents),
    ].join(",") + "\n";

  await fs.appendFile(CSV_PATH, line, "utf8");
}

export { CSV_PATH };