import { LeopardMark } from "./LeopardMark";

export function Hero() {
  return (
    <section className="hero">
      <div className="wrap">
        <LeopardMark className="hero__mark" />
        <h1 className="hero__name">Varenis</h1>
        <p className="hero__place">Boston</p>
        <p className="hero__body">
          Considered essentials in black and white. Fine cottons, cashmere,
          marked quietly by the leopard. Made to be kept.
        </p>
        <a href="#catalog" className="hero__cta">
          The Collection
        </a>
      </div>
    </section>
  );
}
