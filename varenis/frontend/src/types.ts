export type Category = "Tees" | "Knitwear" | "Outerwear" | "Accessories";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  priceCents: number;
  weightOz: number;
  colorway: string;
  swatch: string; // hex used for the generated fabric swatch
  fabric: string;
  description: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface Order {
  id: string;
  lookupCode: string;
  email: string;
  amountTotalCents: number;
  status: string;
  createdAt: string;
  lines: { name: string; quantity: number; priceCents: number }[];
}
