import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Account() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate("/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap page">
      <h1 className="page__title">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>
      <p className="page__sub">
        {mode === "login"
          ? "Sign in to see your full order history in one place."
          : "Make an account and every order you place is saved to it — no lookup codes to keep track of."}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-label">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="auth-label">
          Password
          <input
            type="password"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            placeholder={mode === "signup" ? "At least 8 characters" : ""}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="checkout-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading
            ? "Working…"
            : mode === "login"
            ? "Sign in"
            : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        {mode === "login" ? (
          <>
            No account?{" "}
            <button onClick={() => { setMode("signup"); setError(null); }}>
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => { setMode("login"); setError(null); }}>
              Sign in
            </button>
          </>
        )}
      </p>

      <p className="auth-guest">
        Prefer not to sign in? You can still{" "}
        <Link to="/orders">look up a single order by its code</Link>.
      </p>
    </div>
  );
}
