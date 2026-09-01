export type Category = "Tees" | "Sweats" | "Outerwear" | "Accessories";

export type Size = "S" | "M" | "L" | "XL" | "2XL" | "3XL";

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
  // Product photos in /public/products, in display order (first = main/hero).
  // Any number per product. Convention: "<id>-1.jpg", "<id>-2.jpg", etc.
  // If empty/missing, the tile and modal fall back to the leopard placeholder,
  // so you can add photos one at a time.
  images?: string[];
  // Real, fulfillable garments list their sizes here. A product with sizes
  // requires the customer to pick one before adding to bag. Products without
  // sizes are display-only (not yet on Printful).
  sizes?: Size[];
}

export interface CartLine {
  product: Product;
  size: Size | null; // chosen size for sized products; null for unsized
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