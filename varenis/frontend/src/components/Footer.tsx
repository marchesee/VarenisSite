import { Link } from "react-router-dom";
import { LeopardMark } from "./LeopardMark";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <LeopardMark className="site-footer__mark" />
        <span className="site-footer__text">Varenis · Boston</span>
        <nav className="site-footer__links">
          <Link to="/size-guide">Size Guide</Link>
          <Link to="/legal/terms">Terms</Link>
          <Link to="/legal/privacy">Privacy</Link>
          <Link to="/legal/refunds">Returns</Link>
        </nav>
        <span className="site-footer__text">Secure payment by Stripe</span>
      </div>
    </footer>
  );
}