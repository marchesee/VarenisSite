import { useState } from "react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import { createCheckoutSession } from "../api";
import { LeopardMark } from "./LeopardMark";

export function CartDrawer() {
  const { lines, isOpen, close, setQuantity, removeItem, subtotalCents } =
    useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(lines);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="cart-overlay" onClick={close} />
      <aside className="cart-drawer" role="dialog" aria-label="Bag">
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">Your Bag</h2>
          <button
            className="cart-drawer__close"
            onClick={close}
            aria-label="Close bag"
          >
            ×
          </button>
        </div>

        <div className="cart-drawer__lines">
          {lines.length === 0 && (
            <p className="empty-state">Your bag is empty</p>
          )}
          {lines.map((line) => (
            <div className="cart-line" key={line.product.id}>
              <div
                className="cart-line__frame"
              >
                <LeopardMark />
              </div>
              <div>
                <p className="cart-line__name">{line.product.name}</p>
                <div className="cart-line__meta">
                  <span>{line.product.colorway}</span>
                  <button
                    className="cart-line__qty-btn"
                    onClick={() =>
                      setQuantity(line.product.id, line.quantity - 1)
                    }
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    className="cart-line__qty-btn"
                    onClick={() =>
                      setQuantity(line.product.id, line.quantity + 1)
                    }
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <p className="cart-line__price">
                  {formatPrice(line.product.priceCents * line.quantity)}
                </p>
                <button
                  className="cart-line__remove"
                  onClick={() => removeItem(line.product.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-drawer__footer">
          <div className="cart-drawer__subtotal">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          <p className="cart-drawer__hint">
            Shipping and tax calculated at checkout.
          </p>
          <button
            className="checkout-btn"
            disabled={lines.length === 0 || loading}
            onClick={handleCheckout}
          >
            {loading ? "Redirecting…" : "Checkout"}
          </button>
          {error && <p className="checkout-error">{error}</p>}
        </div>
      </aside>
    </>
  );
}
