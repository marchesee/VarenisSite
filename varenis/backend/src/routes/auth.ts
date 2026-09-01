import { Router } from "express";
import {
  AUTH_COOKIE,
  cookieOptions,
  hashPassword,
  verifyPassword,
  signSessionToken,
  isEmailValid,
  isPasswordValid,
} from "../auth.js";
import {
  createUser,
  getUserByEmail,
  claimOrdersForUser,
} from "../db.js";
import { requireAuth } from "./middleware.js";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const email = String(req.body?.email ?? "");
  const password = String(req.body?.password ?? "");

  if (!isEmailValid(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (!isPasswordValid(password)) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }
  if (getUserByEmail(email)) {
    // Note: this does reveal whether an email is registered. For a store
    // that's a reasonable trade for a clear signup error; a higher-security
    // app would return a generic message and email the address instead.
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const user = createUser(email, await hashPassword(password));
  // Gather up any guest orders this email placed before signing up.
  claimOrdersForUser(user.id, user.email);

  const token = signSessionToken(user.id);
  res.cookie(AUTH_COOKIE, token, cookieOptions());
  res.json({ user: { id: user.id, email: user.email } });
});

authRouter.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "");
  const password = String(req.body?.password ?? "");

  const user = getUserByEmail(email);
  // Run the hash comparison even when the user doesn't exist, against a
  // dummy hash, so response timing doesn't reveal which emails are
  // registered. Then return the same generic error either way.
  const ok = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, "$2a$12$" + "x".repeat(53));

  if (!user || !ok) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  const token = signSessionToken(user.id);
  res.cookie(AUTH_COOKIE, token, cookieOptions());
  res.json({ user: { id: user.id, email: user.email } });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

// Lets the frontend ask "am I logged in, and as who?" on page load.
authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user!.id, email: req.user!.email } });
});
