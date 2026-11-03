import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ErrorList from "../components/ErrorList.jsx";

// Step 4: React version of signin.ejs (same layout: user_id + password).
export default function SignIn() {
  const { setUser, showFlash } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState(location.state?.needSignIn ? ["Please sign in first."] : []);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // The backend looks up the user_id in PostgreSQL and checks the bcrypt hash.
      const data = await api.signin({ user_id: userId.trim(), password });
      setUser(data.user);
      showFlash(data.message);
      navigate("/");
    } catch (err) {
      setErrors(err.errors);
      setPassword("");
      setSubmitting(false);
    }
  }

  return (
    <section className="card auth">
      <h2>Sign in</h2>
      <p className="hint">Welcome back. Enter your user ID and password.</p>
      <ErrorList errors={errors} />
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="user_id">User ID</label>
          <input
            type="text"
            id="user_id"
            autoComplete="username"
            required
            autoFocus
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </section>
  );
}
