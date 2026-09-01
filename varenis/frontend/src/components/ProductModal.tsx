import { useEffect } from "react";
import { Product } from "../types";
import { formatPrice } from "../utils/format";
import { useCart } from "../context/CartContext";
import { LeopardMark } from "./LeopardMark";

interface Props {
  product: Product;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: Props) {
  const { addItem } = useCart();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="product-modal__frame"
        >
          <LeopardMark className="product-modal__mark" />
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
          <p className="product-modal__price">{formatPrice(product.priceCents)}</p>
          <button
            className="add-to-cart"
            onClick={() => {
              addItem(product);
              onClose();
            }}
          >
            Add to bag
          </button>
        </div>
      </div>
    </div>
  );
}
