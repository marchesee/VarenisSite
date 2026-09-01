import { Link } from "react-router-dom";
import { LeopardMark } from "./LeopardMark";

export function CheckoutCancel() {
  return (
    <div className="wrap">
      <div className="status-panel">
        <LeopardMark className="status-panel__mark" />
        <h1 className="page__title">Checkout paused</h1>
        <p className="page__sub" style={{ margin: "0 auto" }}>
          Nothing was charged. Your bag is still here whenever you're ready
          to finish.
        </p>
        <div>
          <Link to="/">Return to the collection</Link>
        </div>
      </div>
    </div>
  );
}
