import { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE, verifySessionToken } from "../auth.js";
import { getUserById, UserRow } from "../db.js";

// Augment Express's Request so downstream handlers can read req.user
// with types, without casting everywhere.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserRow;
    }
  }
}

// Populates req.user if there's a valid session cookie, otherwise leaves
// it undefined. Never blocks the request — use requireAuth below for
// routes that must be logged in.
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (token) {
    const payload = verifySessionToken(token);
    if (payload) {
      const user = getUserById(payload.userId);
      if (user) req.user = user;
    }
  }
  next();
}

// Hard gate: 401 if there's no valid session. Put after attachUser.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "You need to be signed in." });
  }
  next();
}
