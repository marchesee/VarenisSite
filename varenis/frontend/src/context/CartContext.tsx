import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { CartLine, Product, Size } from "../types";

interface CartContextValue {
  lines: CartLine[];
  // size is required for products that have sizes; pass null for unsized ones.
  addItem: (product: Product, size: Size | null) => void;
  removeItem: (productId: string, size: Size | null) => void;
  setQuantity: (productId: string, size: Size | null, quantity: number) => void;
  clear: () => void;
  subtotalCents: number;
  itemCount: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// Bumped to v2 because the cart line shape changed (now carries size).
// Old v1 carts in sessionStorage are ignored rather than mis-parsed.
const STORAGE_KEY = "varenis_cart_v2";

// A cart line is uniquely identified by product + size, so the same shirt in
// two sizes is two lines.
function sameLine(l: CartLine, productId: string, size: Size | null): boolean {
  return l.product.id === productId && l.size === size;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  function addItem(product: Product, size: Size | null) {
    setLines((prev) => {
      const existing = prev.find((l) => sameLine(l, product.id, size));
      if (existing) {
        return prev.map((l) =>
          sameLine(l, product.id, size)
            ? { ...l, quantity: l.quantity + 1 }
            : l
        );
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    setIsOpen(true);
  }

  function removeItem(productId: string, size: Size | null) {
    setLines((prev) => prev.filter((l) => !sameLine(l, productId, size)));
  }

  function setQuantity(productId: string, size: Size | null, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        sameLine(l, productId, size) ? { ...l, quantity } : l
      )
    );
  }

  function clear() {
    setLines([]);
  }

  const subtotalCents = useMemo(
    () =>
      lines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0),
    [lines]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{
        lines,
        addItem,
        removeItem,
        setQuantity,
        clear,
        subtotalCents,
        itemCount,
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}