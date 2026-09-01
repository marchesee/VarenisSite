import { CartLine, Order, AuthUser } from "./types";

// All requests go through /api, which vite.config.ts proxies to the
// backend in dev. In production, point this at your deployed backend
// (or serve both from the same origin) via VITE_API_BASE.
const BASE = import.meta.env.VITE_API_BASE ?? "/api";

// credentials:"include" makes the browser send and store the session
// cookie. Every call uses it so logged-in state is carried consistently.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

// ---------- Checkout ----------

export function createCheckoutSession(
  lines: CartLine[]
): Promise<{ url: string }> {
  return request("/checkout/session", {
    method: "POST",
    body: JSON.stringify({
      items: lines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
      })),
    }),
  });
}

// ---------- Orders ----------

export function fetchOrderBySessionId(sessionId: string): Promise<Order> {
  return request(`/orders/by-session/${encodeURIComponent(sessionId)}`);
}

export function fetchOrderByLookupCode(code: string): Promise<Order> {
  return request(`/orders/by-code/${encodeURIComponent(code.trim())}`);
}

export function fetchMyOrders(): Promise<Order[]> {
  return request("/orders/mine");
}

// ---------- Auth ----------

export function signup(email: string, password: string): Promise<{ user: AuthUser }> {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<{ user: AuthUser }> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<{ ok: boolean }> {
  return request("/auth/logout", { method: "POST" });
}

// Returns the current user, or null if not logged in (the 401 is
// expected here, so we swallow it rather than throwing).
export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const data = await request<{ user: AuthUser }>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
}
