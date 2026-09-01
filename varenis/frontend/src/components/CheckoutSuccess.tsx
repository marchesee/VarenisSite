import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { fetchOrderBySessionId } from "../api";
import { Order } from "../types";
import { LeopardMark } from "./LeopardMark";

export function CheckoutSuccess() {
  const { clear } = useCart();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clear();
  }, [clear]);

  useEffect(() => {
    if (!sessionId) return;
    // The webhook (server-to-server, separate from this redirect) is
    // the source of truth for "paid" — it can take a few seconds to
    // land, so this polls briefly rather than failing on the first miss.
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      try {
        const result = await fetchOrderBySessionId(sessionId!);
        if (!cancelled) setOrder(result);
      } catch {
        attempts += 1;
        if (attempts < 6 && !cancelled) {
          setTimeout(poll, 1500);
        } else if (!cancelled) {
          setError(
            "We couldn't pull up your order yet. If you were just charged, it'll appear shortly — check Order Lookup in a minute."
          );
        }
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  function copyCode() {
    if (!order) return;
    navigator.clipboard?.writeText(order.lookupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="wrap">
      <div className="status-panel">
        <LeopardMark className="status-panel__mark" />
        <h1 className="page__title">Thank you</h1>
        <p className="page__sub" style={{ margin: "0 auto" }}>
          Your payment is confirmed and your order is with us. A receipt is
          on its way to your inbox.
        </p>

        {order && (
          <div className="code-box">
            <p className="code-box__label">
              Save this order code — it's how you look this order up later
            </p>
            <div className="code-box__row">
              <code className="code-box__value">{order.lookupCode}</code>
              <button className="code-box__copy" onClick={copyCode}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="checkout-error" style={{ marginTop: 16 }}>{error}</p>}

        <div>
          <Link to="/orders">Look up an order</Link>
        </div>
      </div>
    </div>
  );
}
