import { useEffect, useState } from "react";
import { Product, Size } from "../types";
import { formatPrice } from "../utils/format";
import { useCart } from "../context/CartContext";
import { LeopardMark } from "./LeopardMark";

interface Props {
  product: Product;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: Props) {
  const { addItem } = useCart();
  const hasSizes = !!product.sizes && product.sizes.length > 0;
  const [size, setSize] = useState<Size | null>(null);
  // Shown only if the user hits "Add to bag" on a sized product without
  // picking a size — a gentle nudge rather than a hard error.
  const [needsSize, setNeedsSize] = useState(false);

  // Gallery: track which candidate image files actually loaded (some numbered
  // slots may not have files yet) and which one is currently shown as main.
  const candidates = product.images ?? [];
  const [okImages, setOkImages] = useState<string[]>(candidates);
  const [activeImg, setActiveImg] = useState<string | null>(
    candidates[0] ?? null
  );

  function handleImgError(src: string) {
    // Drop a failed image from the working set; if it was the active one,
    // fall back to the next available.
    setOkImages((prev) => {
      const next = prev.filter((s) => s !== src);
      setActiveImg((cur) => (cur === src ? next[0] ?? null : cur));
      return next;
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleAdd() {
    if (hasSizes && !size) {
      setNeedsSize(true);
      return;
    }
    addItem(product, hasSizes ? size : null);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="product-modal__gallery">
          <div className="product-modal__frame">
            {activeImg ? (
              <img
                className="product-modal__photo"
                src={activeImg}
                alt={`${product.name} — ${product.colorway}`}
                onError={() => handleImgError(activeImg)}
              />
            ) : (
              <LeopardMark className="product-modal__mark" />
            )}
          </div>
          {okImages.length > 1 && (
            <div className="product-modal__thumbs">
              {okImages.map((src) => (
                <button
                  key={src}
                  type="button"
                  className={
                    "product-modal__thumb" +
                    (src === activeImg ? " product-modal__thumb--active" : "")
                  }
                  onClick={() => setActiveImg(src)}
                  aria-label="View image"
                >
                  <img
                    src={src}
                    alt=""
                    onError={() => handleImgError(src)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-modal__body">
          <button
            className="product-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <p className="product-modal__sku">{product.sku}</p>
          <h2 className="product-modal__name">{product.name}</h2>
          <p className="product-modal__colorway">{product.colorway}</p>
          <p className="product-modal__desc">{product.description}</p>
          <div className="product-modal__specs">
            <div>
              <span>Fabric</span>
              {product.fabric}
            </div>
            <div>
              <span>Weight</span>
              {product.weightOz}oz
            </div>
            <div>
              <span>Category</span>
              {product.category}
            </div>
          </div>

          {hasSizes && (
            <div className="size-picker">
              <div className="size-picker__label">
                <span>Size</span>
                {needsSize && (
                  <span className="size-picker__hint">Please choose a size</span>
                )}
              </div>
              <div className="size-picker__options">
                {product.sizes!.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={
                      "size-chip" + (size === s ? " size-chip--active" : "")
                    }
                    aria-pressed={size === s}
                    onClick={() => {
                      setSize(s);
                      setNeedsSize(false);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="product-modal__price">{formatPrice(product.priceCents)}</p>
          <button className="add-to-cart" onClick={handleAdd}>
            Add to bag
          </button>
        </div>
      </div>
    </div>
  );
}