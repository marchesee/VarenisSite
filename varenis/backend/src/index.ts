import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { checkoutRouter } from "./routes/checkout.js";
import { webhookRouter } from "./routes/webhook.js";
import { ordersRouter } from "./routes/orders.js";
import { authRouter } from "./routes/auth.js";
import { attachUser } from "./routes/middleware.js";

const app = express();
const PORT = process.env.PORT ?? 4242;
// Allowed browser origins for cross-origin API calls. Set FRONTEND_URL to a
// comma-separated list to allow several (e.g. your apex domain, www, and the
// Vercel preview URL). Falls back to the local dev server.
const ALLOWED_ORIGINS = (
  process.env.FRONTEND_URL ?? "http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// credentials:true is required for the browser to send/receive the
// session cookie on cross-origin API calls. Origin must be an explicit
// match (not "*") when credentials are involved, so we check the request's
// origin against the allow-list.
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser requests (curl, health checks, server-to-server like
      // Stripe webhooks) have no Origin header — allow those through.
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

// Trust the first proxy hop (typical when deployed behind Fargate/ALB,
// Vercel, Render, etc.) so rate limiting keys off the real client IP
// instead of the proxy's IP for every request.
app.set("trust proxy", 1);

// The webhook route needs the RAW body for Stripe's signature check, so
// it's mounted with express.raw() BEFORE the global express.json() below.
// If you reorder these, webhook signature verification will break.
app.use("/api/webhook", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json());
app.use(cookieParser());

// Populate req.user from the session cookie on every request (never
// blocks — routes that require login use requireAuth). Runs after
// cookieParser so req.cookies is available.
app.use(attachUser);

// Keeps someone from hammering session creation, brute-forcing order
// lookup codes, or guessing passwords. Numbers are a starting point —
// tune them once you see real traffic patterns.
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout attempts. Try again in a few minutes." },
});

const ordersLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many lookup attempts. Try again in a few minutes." },
});

// Tighter budget on auth: login/signup are the most attractive targets
// for brute force, so cap attempts hard per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/checkout", checkoutLimiter, checkoutRouter);
app.use("/api/orders", ordersLimiter, ordersRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Create tables if needed, THEN start listening. If the DB can't be
// reached, fail loudly rather than start a broken server.
import { initDb } from "./db.js";

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Varenis backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database — not starting server:", err);
    process.exit(1);
  });