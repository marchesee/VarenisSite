import { Product } from "../types";

// Prices are in cents. Stripe works in the smallest currency unit, so
// keeping this data source in cents means the frontend and the backend
// checkout-session builder never have to convert back and forth.
//
// `swatch` is a hex used to render each product's placeholder tile until
// real photography replaces it. The Varenis line lives in black / off-white.
//
// This is the REAL catalog — every product here exists in Printful and is
// fulfillable. Categories with no products yet (Outerwear, Accessories) are
// shown as "coming soon" tabs, handled in the Shop component.
export const PRODUCTS: Product[] = [
  // ---- Tees ----
  {
    id: "leopard-tee-black",
    images: [
      "/products/leopard-tee-black/1.jpg",
      "/products/leopard-tee-black/2.jpg",
      "/products/leopard-tee-black/3.jpg",
      "/products/leopard-tee-black/4.jpg",
    ],
    sku: "VR-001-BLK",
    name: "Leopard Tee",
    category: "Tees",
    priceCents: 3500,
    weightOz: 6,
    colorway: "Black",
    swatch: "#141414",
    fabric: "6oz combed Pima cotton",
    description:
      "The signature piece. A heavyweight black tee with the Varenis leopard set small at the left chest, printed in soft white. Cut boxy through the body with a ribbed crew that keeps its shape.",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "leopard-tee-white",
    images: [
      "/products/leopard-tee-white/1.jpg",
      "/products/leopard-tee-white/2.jpg",
      "/products/leopard-tee-white/3.jpg",
      "/products/leopard-tee-white/4.jpg",
    ],
    sku: "VR-001-WHT",
    name: "Leopard Tee",
    category: "Tees",
    priceCents: 3500,
    weightOz: 6,
    colorway: "White",
    swatch: "#EDEBE4",
    fabric: "6oz combed Pima cotton",
    description:
      "The leopard rendered large across the front in fine graphite linework, under the Varenis wordmark. A gallery print on a garment — meant to be seen.",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "leopard-graphic-tee-white",
    images: [
      "/products/leopard-graphic-tee-white/1.jpg",
      "/products/leopard-graphic-tee-white/2.jpg",
      "/products/leopard-graphic-tee-white/3.jpg",
      "/products/leopard-graphic-tee-white/4.jpg",
    ],
    sku: "VR-003-WHT",
    name: "Leopard Graphic Tee",
    category: "Tees",
    priceCents: 3500,
    weightOz: 6,
    colorway: "White",
    swatch: "#EDEBE4",
    fabric: "Unisex combed cotton",
    description:
      "A unisex cut with the full leopard study printed large across the front. Relaxed through the body, true to size.",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  // ---- Sweats ----
  {
    id: "sweatshirt-black",
    images: [
      "/products/sweatshirt-black/1.jpg",
      "/products/sweatshirt-black/2.jpg",
      "/products/sweatshirt-black/3.jpg",
      "/products/sweatshirt-black/4.jpg",
    ],
    sku: "VR-500-BLK",
    name: "Sweatshirt",
    category: "Sweats",
    priceCents: 7000,
    weightOz: 14,
    colorway: "Black",
    swatch: "#141414",
    fabric: "Heavyweight cotton fleece",
    description:
      "A heavyweight fleece sweatshirt in black, marked with the Varenis leopard. Brushed soft on the inside, cut for an easy drape.",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "sweatshirt-white",
    images: [
      "/products/sweatshirt-white/1.jpg",
      "/products/sweatshirt-white/2.jpg",
      "/products/sweatshirt-white/3.jpg",
      "/products/sweatshirt-white/4.jpg",
    ],
    sku: "VR-500-WHT",
    name: "Sweatshirt",
    category: "Sweats",
    priceCents: 7000,
    weightOz: 14,
    colorway: "White",
    swatch: "#EDEBE4",
    fabric: "Heavyweight cotton fleece",
    description:
      "The Varenis sweatshirt in off-white, leopard set to the chest. Heavyweight brushed fleece with a relaxed line.",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "sweatpants-black",
    images: [
      "/products/sweatpants-black/1.jpg",
      "/products/sweatpants-black/2.jpg",
      "/products/sweatpants-black/3.jpg",
      "/products/sweatpants-black/4.jpg",
    ],
    sku: "VR-510-BLK",
    name: "Sweatpants",
    category: "Sweats",
    priceCents: 5000,
    weightOz: 12,
    colorway: "Black",
    swatch: "#141414",
    fabric: "Heavyweight cotton fleece",
    description:
      "Matching fleece sweatpants in black, marked with the leopard at the hip. Tapered leg, ribbed cuff, drawcord waist.",
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
];

export const CATEGORIES: Product["category"][] = [
  "Tees",
  "Sweats",
  "Outerwear",
  "Accessories",
];