import { Product } from "../types";
import { formatPrice } from "../utils/format";
import { LeopardMark } from "./LeopardMark";

interface Props {
  products: Product[];
  onSelect: (product: Product) => void;
}

// Each product tile shows the leopard mark on a tone drawn from the
// product's colorway, standing in for photography. Dark garments get a
// light mark, light garments get a dark one, so it always reads.
export function ProductGrid({ products, onSelect }: Props) {
  if (products.length === 0) {
    return <div className="empty-state">Nothing in this category yet</div>;
  }

  return (
    <div className="product-grid" id="catalog">
      {products.map((p) => (
        <button
          key={p.id}
          className="product-card"
          onClick={() => onSelect(p)}
          aria-label={`View ${p.name}, ${p.colorway}`}
        >
          <div className="product-card__frame">
            <span className="product-card__sku">{p.sku}</span>
            {p.images && p.images.length > 0 ? (
              <img
                className="product-card__photo"
                src={p.images[0]}
                alt={`${p.name} — ${p.colorway}`}
                loading="lazy"
                onError={(e) => {
                  // If the hero photo isn't there yet, hide the broken img so
                  // the tile background shows instead of a broken-image icon.
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <LeopardMark className="product-card__mark" />
            )}
          </div>
          <div className="product-card__body">
            <div>
              <p className="product-card__name">{p.name}</p>
              <p className="product-card__colorway">{p.colorway}</p>
            </div>
            <span className="product-card__price">{formatPrice(p.priceCents)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}