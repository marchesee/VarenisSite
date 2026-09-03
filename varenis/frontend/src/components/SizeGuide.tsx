import { useState } from "react";

// Size guide. These are the ACTUAL measurements from our fulfillment
// affiliates' (Printful) product size charts, in inches. cm is derived
// (1 in = 2.54 cm). Verify against Printful if you ever change the blanks.

type Unit = "in" | "cm";

interface SizeRow {
  size: string;
  values: Record<string, number>;
}

interface Chart {
  key: string;
  name: string;
  note: string;
  columns: string[];
  rows: SizeRow[];
}

const CHARTS: Chart[] = [
  {
    key: "tee",
    name: "Leopard Tees (Black & White)",
    note: "Unisex fit. Garment measured laid flat.",
    columns: ["Length", "Width"],
    rows: [
      { size: "XS", values: { Length: 26.75, Width: 17 } },
      { size: "S", values: { Length: 28, Width: 18.5 } },
      { size: "M", values: { Length: 29.5, Width: 20.5 } },
      { size: "L", values: { Length: 31, Width: 22.25 } },
      { size: "XL", values: { Length: 32.25, Width: 24 } },
      { size: "2XL", values: { Length: 33, Width: 25.25 } },
      { size: "3XL", values: { Length: 33.5, Width: 26.75 } },
    ],
  },
  {
    key: "graphic-tee",
    name: "Leopard Graphic Tee",
    note: "Unisex fit. Garment measured laid flat.",
    columns: ["Length", "Width", "Sleeve length"],
    rows: [
      { size: "S", values: { Length: 26.625, Width: 18.25, "Sleeve length": 16.25 } },
      { size: "M", values: { Length: 28, Width: 20.25, "Sleeve length": 17.75 } },
      { size: "L", values: { Length: 29.375, Width: 22, "Sleeve length": 19 } },
      { size: "XL", values: { Length: 30.75, Width: 24, "Sleeve length": 20.5 } },
      { size: "2XL", values: { Length: 31.625, Width: 26, "Sleeve length": 21.75 } },
      { size: "3XL", values: { Length: 32.5, Width: 27.75, "Sleeve length": 23.25 } },
      { size: "4XL", values: { Length: 33.5, Width: 29.75, "Sleeve length": 24.625 } },
    ],
  },
  {
    key: "sweatshirt",
    name: "Sweatshirts",
    note: "Unisex fit. Garment measured laid flat.",
    columns: ["Length", "Width"],
    rows: [
      { size: "S", values: { Length: 27, Width: 20 } },
      { size: "M", values: { Length: 28, Width: 21 } },
      { size: "L", values: { Length: 29, Width: 23 } },
      { size: "XL", values: { Length: 30, Width: 25 } },
      { size: "2XL", values: { Length: 31, Width: 26.5 } },
      { size: "3XL", values: { Length: 32, Width: 28 } },
    ],
  },
  {
    key: "sweatpants",
    name: "Sweatpants",
    note: "Unisex fit. Waistband measured flat (unstretched).",
    columns: ["Waistband", "Inseam length"],
    rows: [
      { size: "XS", values: { Waistband: 28, "Inseam length": 28 } },
      { size: "S", values: { Waistband: 30, "Inseam length": 29 } },
      { size: "M", values: { Waistband: 32, "Inseam length": 30 } },
      { size: "L", values: { Waistband: 34, "Inseam length": 31 } },
      { size: "XL", values: { Waistband: 36, "Inseam length": 32 } },
      { size: "2XL", values: { Waistband: 38, "Inseam length": 33 } },
    ],
  },
];

function toCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

function fmtIn(v: number): string {
  return Number.isInteger(v)
    ? String(v)
    : v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function SizeGuide() {
  const [unit, setUnit] = useState<Unit>("in");

  return (
    <div className="legal">
      <div className="legal__inner sizeguide">
        <h1 className="legal__title">Size Guide</h1>
        <p className="legal__meta">
          Measurements in {unit === "in" ? "inches" : "centimeters"} · from our
          fulfillment affiliates
        </p>

        <p>
          Every piece is made to order, so please check your size before buying
          — sizing and fit are not returnable. If you're between sizes or unsure,
          measure a garment you already own and love, lay it flat, and compare it
          to the numbers below. These measurements are provided by our
          fulfillment affiliates.
        </p>

        <div className="sizeguide__toggle">
          <button
            className={"unit-btn" + (unit === "in" ? " unit-btn--active" : "")}
            onClick={() => setUnit("in")}
          >
            Inches
          </button>
          <button
            className={"unit-btn" + (unit === "cm" ? " unit-btn--active" : "")}
            onClick={() => setUnit("cm")}
          >
            Centimeters
          </button>
        </div>

        {CHARTS.map((chart) => (
          <section key={chart.key} className="sizeguide__section">
            <h2>{chart.name}</h2>
            <p className="sizeguide__note">{chart.note}</p>
            <div className="sizeguide__tablewrap">
              <table className="sizeguide__table">
                <thead>
                  <tr>
                    <th>Size</th>
                    {chart.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((row) => (
                    <tr key={row.size}>
                      <td className="sizeguide__size">{row.size}</td>
                      {chart.columns.map((c) => {
                        const inches = row.values[c];
                        return (
                          <td key={c}>
                            {unit === "in"
                              ? `${fmtIn(inches)}"`
                              : `${toCm(inches)} cm`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <p className="sizeguide__disclaimer">
          Measurements are approximate and provided by our fulfillment
          affiliates. They may vary slightly between items, as each is
          individually produced — they're provided to help you choose, not as
          exact guarantees.
        </p>
      </div>
    </div>
  );
}
