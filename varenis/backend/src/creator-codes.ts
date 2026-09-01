// Creator / influencer discount codes.
//
// Each code gives the CUSTOMER a percentage discount, and credits the CREATOR
// a commission percentage (of the post-discount item revenue). Both are used
// by the CSV tracker in the webhook. Codes are matched case-insensitively.
//
// Hardcoded for now — add/remove entries here. (A future admin endpoint could
// manage these without editing code.)

export interface CreatorCode {
  code: string; // stored uppercase; matched case-insensitively
  discountPct: number; // % off for the customer, e.g. 10 = 10% off
  commissionPct: number; // % the creator earns on post-discount revenue
}

const CODES: CreatorCode[] = [
  { code: "EDDIE10", discountPct: 10, commissionPct: 15 },
  { code: "FRIEND15", discountPct: 15, commissionPct: 10 },
  // add more here...
];

// Look up a code (case-insensitive). Returns null if unknown.
export function resolveCreatorCode(input: string | undefined): CreatorCode | null {
  if (!input) return null;
  const norm = input.trim().toUpperCase();
  return CODES.find((c) => c.code === norm) ?? null;
}