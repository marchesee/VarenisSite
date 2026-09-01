import { useState } from "react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import {
  quoteShipping,
  createCheckoutSession,
  ShippingRate,
} from "../api";
import { LeopardMark } from "./LeopardMark";

// Two-step bag: (1) review items, (2) enter address + choose shipping, then
// go to Stripe with exact shipping included.
type Step = "bag" | "shipping";

// Common Printful destinations. Printful ships far more widely; this is a
// reasonable starter list and can be expanded freely.
const COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
];

export function CartDrawer() {
  const { lines, isOpen, close, setQuantity, removeItem, subtotalCents, clear } =
    useCart();
  const [step, setStep] = useState<Step>("bag");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatorCode, setCreatorCode] = useState("");

  // Address fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");

  // Shipping quote
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [chosenRateId, setChosenRateId] = useState<string | null>(null);

  if (!isOpen) return null;

  const chosenRate = rates?.find((r) => r.id === chosenRateId) ?? null;

  function resetAndClose() {
    close();
    // keep the bag contents; just reset the flow state
    setStep("bag");
    setRates(null);
    setChosenRateId(null);
    setError(null);
  }

  async function handleGetRates() {
    setError(null);
    if (!address1 || !city || !zip || !country) {
      setError("Please fill in your address.");
      return;
    }
    setLoading(true);
    try {
      const { rates } = await quoteShipping(lines, {
        address1,
        city,
        state_code: stateCode,
        country_code: country,
        zip,
      });
      setRates(rates);
      setChosenRateId(rates[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't get shipping rates.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!chosenRate) {
      setError("Please choose a shipping option.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { url } = await createCheckoutSession(
        lines,
        {
          name,
          email: email || undefined,
          phone: phone || undefined,
          address1,
          address2: address2 || undefined,
          city,
          state_code: stateCode,
          country_code: country,
          zip,
          shippingName: chosenRate.name,
          shippingCents: chosenRate.rateCents,
        },
        creatorCode
      );
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  const shippingCents = chosenRate?.rateCents ?? 0;
  const totalCents = subtotalCents + shippingCents;

  return (
    <>
      <div className="cart-overlay" onClick={resetAndClose} />
      <aside className="cart-drawer" role="dialog" aria-label="Bag">
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            {step === "bag" ? "Your Bag" : "Shipping"}
          </h2>
          <button
            className="cart-drawer__close"
            onClick={resetAndClose}
            aria-label="Close bag"
          >
            ×
          </button>
        </div>

        {step === "bag" && (
          <>
            <div className="cart-drawer__lines">
              {lines.length === 0 && (
                <p className="empty-state">Your bag is empty</p>
              )}
              {lines.map((line) => (
                <div
                  className="cart-line"
                  key={`${line.product.id}:${line.size ?? "one"}`}
                >
                  <div className="cart-line__frame">
                    {line.product.images && line.product.images.length > 0 ? (
                      <img
                        src={line.product.images[0]}
                        alt=""
                        onError={(e) =>
                          ((e.currentTarget as HTMLImageElement).style.display =
                            "none")
                        }
                      />
                    ) : (
                      <LeopardMark />
                    )}
                  </div>
                  <div>
                    <p className="cart-line__name">{line.product.name}</p>
                    <div className="cart-line__meta">
                      <span>{line.product.colorway}</span>
                      {line.size && (
                        <span className="cart-line__size">Size {line.size}</span>
                      )}
                      <button
                        className="cart-line__qty-btn"
                        onClick={() =>
                          setQuantity(line.product.id, line.size, line.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        className="cart-line__qty-btn"
                        onClick={() =>
                          setQuantity(line.product.id, line.size, line.quantity + 1)
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
                      onClick={() => removeItem(line.product.id, line.size)}
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
                Shipping calculated on the next step.
              </p>
              <button
                className="checkout-btn"
                disabled={lines.length === 0}
                onClick={() => {
                  setStep("shipping");
                  setError(null);
                }}
              >
                Continue to shipping
              </button>
            </div>
          </>
        )}

        {step === "shipping" && (
          <>
            <div className="cart-drawer__lines cart-drawer__form">
              <label className="fld">
                <span>Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="fld">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="fld">
                <span>Address</span>
                <input
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                />
              </label>
              <label className="fld">
                <span>Apt, suite (optional)</span>
                <input
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                />
              </label>
              <div className="fld-row">
                <label className="fld">
                  <span>City</span>
                  <input value={city} onChange={(e) => setCity(e.target.value)} />
                </label>
                <label className="fld fld--sm">
                  <span>State</span>
                  <input
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                    placeholder="NH"
                  />
                </label>
              </div>
              <div className="fld-row">
                <label className="fld fld--sm">
                  <span>ZIP</span>
                  <input value={zip} onChange={(e) => setZip(e.target.value)} />
                </label>
                <label className="fld">
                  <span>Country</span>
                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setRates(null);
                      setChosenRateId(null);
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                className="ghost-btn"
                onClick={handleGetRates}
                disabled={loading}
              >
                {loading && !rates ? "Getting rates…" : "Get shipping options"}
              </button>

              {rates && rates.length > 0 && (
                <div className="ship-rates">
                  {rates.map((r) => (
                    <label key={r.id} className="ship-rate">
                      <input
                        type="radio"
                        name="ship"
                        checked={chosenRateId === r.id}
                        onChange={() => setChosenRateId(r.id)}
                      />
                      <span className="ship-rate__name">{r.name}</span>
                      <span className="ship-rate__price">
                        {formatPrice(r.rateCents)}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="creator-code">
                <label htmlFor="creator-code-input" className="creator-code__label">
                  Creator code
                </label>
                <input
                  id="creator-code-input"
                  className="creator-code__input"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="Optional"
                  value={creatorCode}
                  onChange={(e) => setCreatorCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__subtotal">
                <span>Subtotal</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <div className="cart-drawer__subtotal">
                <span>Shipping</span>
                <span>
                  {chosenRate ? formatPrice(shippingCents) : "—"}
                </span>
              </div>
              <div className="cart-drawer__subtotal cart-drawer__total">
                <span>Total</span>
                <span>{formatPrice(totalCents)}</span>
              </div>
              <button
                className="checkout-btn"
                disabled={loading || !chosenRate}
                onClick={handleCheckout}
              >
                {loading ? "Redirecting…" : "Pay with card"}
              </button>
              <button
                className="linkish-btn"
                onClick={() => {
                  setStep("bag");
                  setError(null);
                }}
              >
                ← Back to bag
              </button>
              {error && <p className="checkout-error">{error}</p>}
            </div>
          </>
        )}
      </aside>
    </>
  );
}