import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Order } from "../types";
import { fetchOrderByLookupCode, fetchMyOrders } from "../api";
import { formatPrice } from "../utils/format";
import { useAuth } from "../context/AuthContext";

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="order-card">
      <div className="order-card__row">
        <span className="order-card__id mono">{order.id}</span>
        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
        <span>{order.status}</span>
      </div>
      {order.lines.map((line, i) => (
        <div className="order-card__line" key={i}>
          <span>
            {line.quantity} × {line.name}
          </span>
          <span className="mono">
            {formatPrice(line.priceCents * line.quantity)}
          </span>
        </div>
      ))}
      <div className="order-card__total">
        <span>Total</span>
        <span>{formatPrice(order.amountTotalCents)}</span>
      </div>
    </div>
  );
}

export function OrderHistory() {
  const { user, loading: authLoading } = useAuth();

  // Guest lookup state
  const [code, setCode] = useState("");
  const [guestOrder, setGuestOrder] = useState<Order | null>(null);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);

  // Account order state
  const [myOrders, setMyOrders] = useState<Order[] | null>(null);
  const [myError, setMyError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMyOrders(null);
      return;
    }
    fetchMyOrders()
      .then(setMyOrders)
      .catch((e) =>
        setMyError(e instanceof Error ? e.message : "Could not load orders")
      );
  }, [user]);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setGuestLoading(true);
    setGuestError(null);
    setGuestOrder(null);
    try {
      setGuestOrder(await fetchOrderByLookupCode(code));
    } catch (e) {
      setGuestError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setGuestLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="wrap page">
        <p className="empty-state">Loading…</p>
      </div>
    );
  }

  // ---- Logged in: show account order history ----
  if (user) {
    return (
      <div className="wrap page">
        <h1 className="page__title">Your orders</h1>
        <p className="page__sub">
          Signed in as {user.email}. Every order placed while signed in
          shows up here automatically.
        </p>

        {myError && <p className="checkout-error">{myError}</p>}

        {myOrders === null && !myError && (
          <p className="empty-state">Loading your orders…</p>
        )}

        {myOrders && myOrders.length === 0 && (
          <p className="empty-state">
            No orders yet. When you check out, they'll appear here.
          </p>
        )}

        {myOrders?.map((order) => (
          <OrderCard order={order} key={order.id} />
        ))}
      </div>
    );
  }

  // ---- Guest: code lookup ----
  return (
    <div className="wrap page">
      <h1 className="page__title">Order Lookup</h1>
      <p className="page__sub">
        Enter the order code shown on your confirmation page after
        checkout. Or <Link to="/account">sign in</Link> to see all your
        orders in one place.
      </p>
      <form className="lookup-form" onSubmit={handleLookup}>
        <input
          type="text"
          required
          placeholder="e.g. 9f1a3c7b2e6d4f8091a2b3c4d5e6f708"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mono"
        />
        <button type="submit" disabled={guestLoading}>
          {guestLoading ? "Looking up…" : "Find order"}
        </button>
      </form>

      {guestError && <p className="checkout-error">{guestError}</p>}
      {guestOrder && <OrderCard order={guestOrder} />}
    </div>
  );
}
