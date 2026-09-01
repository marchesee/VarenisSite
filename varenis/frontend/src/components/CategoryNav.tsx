import { Category } from "../types";

interface Props {
  categories: Category[];
  active: Category | "All";
  onSelect: (category: Category | "All") => void;
}

export function CategoryNav({ categories, active, onSelect }: Props) {
  return (
    <nav className="category-nav" aria-label="Filter by category">
      <button
        className={active === "All" ? "active" : ""}
        onClick={() => onSelect("All")}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c}
          className={active === c ? "active" : ""}
          onClick={() => onSelect(c)}
        >
          {c}
        </button>
      ))}
    </nav>
  );
}
