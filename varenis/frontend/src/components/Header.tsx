import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { itemCount, open } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <div className="wrap site-header__row">
        <Link to="/" className="wordmark">
          <span className="wordmark__name">Varenis</span>
          <span className="wordmark__place">Boston</span>
        </Link>
        <nav className="nav-links">
          <Link to="/">Shop</Link>
          {user ? (
            <>
              <Link to="/orders">Your Orders</Link>
              <button className="linklike" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/orders">Order Lookup</Link>
              <Link to="/account">Sign In</Link>
            </>
          )}
        </nav>
        <button className="cart-button" onClick={open}>
          Bag
          <span className="cart-button__count">{itemCount}</span>
        </button>
      </div>
    </header>
  );
}
