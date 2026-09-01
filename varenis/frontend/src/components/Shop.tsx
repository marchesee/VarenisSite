import { useMemo, useState } from "react";
import { Hero } from "./Hero";
import { CategoryNav } from "./CategoryNav";
import { ProductGrid } from "./ProductGrid";
import { ProductModal } from "./ProductModal";
import { PRODUCTS, CATEGORIES } from "../data/products";
import { Category, Product } from "../types";

export function Shop() {
  const [active, setActive] = useState<Category | "All">("All");
  const [selected, setSelected] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      active === "All"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === active),
    [active]
  );

  return (
    <>
      <Hero />
      <div className="wrap">
        <CategoryNav
          categories={CATEGORIES}
          active={active}
          onSelect={setActive}
        />
        <ProductGrid products={filtered} onSelect={setSelected} />
      </div>
      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
