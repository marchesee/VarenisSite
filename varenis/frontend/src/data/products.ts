import { Product } from "../types";

// Prices are in cents. Stripe works in the smallest currency unit, so
// keeping this data source in cents means the frontend and the backend
// checkout-session builder never have to convert back and forth.
//
// `tone` is a hex used to render each product's placeholder tile in a
// monochrome palette until real photography replaces it. Everything in
// the Varenis line lives in black / off-white / warm grey.
export const PRODUCTS: Product[] = [
  {
    id: "leopard-tee-black",
    sku: "VR-001-BLK",
    name: "Leopard Tee",
    category: "Tees",
    priceCents: 6800,
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
    sku: "VR-001-WHT",
    name: "Leopard Tee",
    category: "Tees",
    priceCents: 6800,
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
    sku: "VR-003-WHT",
    name: "Leopard Graphic Tee",
    category: "Tees",
    priceCents: 6800,
    weightOz: 6,
    colorway: "White",
    swatch: "#EDEBE4",
    fabric: "Unisex combed cotton",
    description:
      "A unisex cut with the full leopard study printed large across the front. Relaxed through the body, true to size.",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "wordmark-tee-black",
    sku: "VR-002-BLK",
    name: "Wordmark Tee",
    category: "Tees",
    priceCents: 5800,
    weightOz: 6,
    colorway: "Black",
    swatch: "#141414",
    fabric: "6oz combed Pima cotton",
    description:
      "Quieter than the Leopard Tee. Just the Varenis wordmark and its letter-spaced Boston, centered small. For when you want the name and nothing else.",
  },
  {
    id: "boxy-crew-bone",
    sku: "VR-101-BNE",
    name: "Boxy Crew",
    category: "Knitwear",
    priceCents: 16800,
    weightOz: 14,
    colorway: "Bone",
    swatch: "#E3DECF",
    fabric: "Midweight cotton-cashmere",
    description:
      "A relaxed crewneck knit in a cotton-cashmere blend that softens with wear. Drop shoulder, ribbed cuffs, the leopard mark tonal at the nape.",
  },
  {
    id: "boxy-crew-charcoal",
    sku: "VR-101-CHR",
    name: "Boxy Crew",
    category: "Knitwear",
    priceCents: 16800,
    weightOz: 14,
    colorway: "Charcoal",
    swatch: "#2B2B2B",
    fabric: "Midweight cotton-cashmere",
    description:
      "The Boxy Crew in a deep charcoal that reads almost black indoors. Same cotton-cashmere hand, same tonal mark at the nape.",
  },
  {
    id: "merino-beanie",
    sku: "VR-210-BLK",
    name: "Merino Beanie",
    category: "Knitwear",
    priceCents: 5200,
    weightOz: 3,
    colorway: "Black",
    swatch: "#161616",
    fabric: "Fine-gauge merino wool",
    description:
      "A close-knit merino beanie with a short fold. Warm without bulk, with a small woven label carrying the leopard. Boston winters, considered.",
  },
  {
    id: "overshirt-ink",
    sku: "VR-301-INK",
    name: "Wool Overshirt",
    category: "Outerwear",
    priceCents: 24800,
    weightOz: 16,
    colorway: "Ink",
    swatch: "#1A1B1F",
    fabric: "Italian wool-blend flannel",
    description:
      "A structured overshirt in a brushed Italian wool blend, meant to sit between a shirt and a coat. Horn buttons, patch pockets, clean lines that hold a press.",
  },
  {
    id: "topcoat-slate",
    sku: "VR-320-SLT",
    name: "Minimal Topcoat",
    category: "Outerwear",
    priceCents: 42800,
    weightOz: 22,
    colorway: "Slate",
    swatch: "#3A3D42",
    fabric: "Wool-cashmere melton",
    description:
      "An unstructured single-breasted topcoat in wool-cashmere melton. No logo, no hardware you'd notice — the shape is the statement. The leopard sits inside, at the lining.",
  },
  {
    id: "leather-card-holder",
    sku: "VR-410-BLK",
    name: "Card Holder",
    category: "Accessories",
    priceCents: 8800,
    weightOz: 2,
    colorway: "Black",
    swatch: "#0F0F0F",
    fabric: "Full-grain Italian leather",
    description:
      "A slim four-slot card holder in full-grain leather that patinas with use. Edge-painted, blind-debossed with the leopard on the back panel.",
  },
  {
    id: "silk-scarf-mono",
    sku: "VR-420-MON",
    name: "Printed Scarf",
    category: "Accessories",
    priceCents: 12800,
    weightOz: 3,
    colorway: "Monochrome",
    swatch: "#4A4A4A",
    fabric: "Sandwashed silk twill",
    description:
      "A large square scarf in sandwashed silk, printed with a repeating leopard study in greyscale. Finished with hand-rolled edges.",
  },
];

export const CATEGORIES: Product["category"][] = [
  "Tees",
  "Knitwear",
  "Outerwear",
  "Accessories",
];