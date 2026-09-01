import { LeopardMark } from "./LeopardMark";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <LeopardMark className="site-footer__mark" />
        <span className="site-footer__text">Varenis · Boston</span>
        <span className="site-footer__text">
          Secure payment by Stripe
        </span>
      </div>
    </footer>
  );
}
