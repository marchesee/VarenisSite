import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { Shop } from "./components/Shop";
import { OrderHistory } from "./components/OrderHistory";
import { Account } from "./components/Account";
import { CheckoutSuccess } from "./components/CheckoutSuccess";
import { CheckoutCancel } from "./components/CheckoutCancel";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/account" element={<Account />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        </Routes>
        <Footer />
        <CartDrawer />
      </CartProvider>
    </AuthProvider>
  );
}
