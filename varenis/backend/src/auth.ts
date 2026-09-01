import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "replace_this_with_a_long_random_string") {
  throw new Error(
    "JWT_SECRET is missing or still the placeholder value. Set a real random string in .env — see the comment in .env.example for how to generate one."
  );
}

export const AUTH_COOKIE = "fw_session";
const TOKEN_TTL = "30d";

export async function hashPassword(password: string): Promise<string> {
  // Cost factor 12: slower than the bcrypt default (10), which is the
  // point — it's deliberately expensive to brute-force offline if the
  // hash table ever leaks, while still fast enough for one login.
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET!, { expiresIn: TOKEN_TTL });
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as jwt.JwtPayload;
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    // Expired, tampered, or malformed — all treated the same: not logged in.
    return null;
  }
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true, // JS on the page can't read this, even via XSS
    // In production the frontend (your domain) and backend (Render) are on
    // different sites, so the session cookie must be SameSite=None to be sent
    // on cross-site API calls — and SameSite=None REQUIRES Secure (HTTPS).
    // Locally everything is http://localhost, where "lax" + not-secure works.
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days, matches TOKEN_TTL above
    path: "/",
  };
}

// Very deliberately not a full password-strength meter — just enough
// to stop "a" or "1234" without being annoying. Real strength checks
// (breached-password lists, entropy scoring) are a nice-to-have, not
// a blocker for a project at this stage.
export function isPasswordValid(password: string): boolean {
  return typeof password === "string" && password.length >= 8;
}

export function isEmailValid(email: string): boolean {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}