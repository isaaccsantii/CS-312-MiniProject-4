import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ErrorList from "../components/ErrorList.jsx";

const EMPTY_FORM = {
  name: "",
  user_id: "",
  password: "",
  confirm_password: "",
  age: "",
  occupation: "",
  city: "",
};

// Step 4: React version of signup.ejs, plus optional profile details
// (age, occupation, city) that the My Profile page shows.
export default function SignUp() {
  const { showFlash } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // One handler for every input: the input's name attribute picks the field to update.
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      return setErrors(["Passwords do not match."]);
    }
    setSubmitting(true);
    try {
      // The backend checks whether the user_id is taken, hashes the password, and inserts the user.
      const data = await api.signup(form);
      showFlash(data.message);
      navigate("/signin");
    } catch (err) {
      setErrors(err.errors);
      setForm({ ...form, password: "", confirm_password: "" });
      setSubmitting(false);
    }
  }

  return (
    <section className="card auth">
      <h2>Create an account</h2>
      <p className="hint">Pick a user ID. You'll use it with your password to sign in.</p>
      <ErrorList errors={errors} />
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" maxLength={255} autoComplete="name" required
                 value={form.name} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="user_id">User ID</label>
          <input type="text" id="user_id" name="user_id" minLength={3} maxLength={30}
                 pattern="[A-Za-z0-9_.\-]{3,30}" title="3-30 characters: letters, numbers, dot, dash or underscore"
                 autoComplete="username" required value={form.user_id} onChange={handleChange} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" minLength={6} maxLength={72}
                   autoComplete="new-password" required value={form.password} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="confirm_password">Confirm password</label>
            <input type="password" id="confirm_password" name="confirm_password" minLength={6} maxLength={72}
                   autoComplete="new-password" required value={form.confirm_password} onChange={handleChange} />
          </div>
        </div>

        <fieldset className="optional">
          <legend>About you <span className="hint-inline">(optional, shown on your profile)</span></legend>
          <div className="field-row">
            <div className="field">
              <label htmlFor="age">Age</label>
              <input type="number" id="age" name="age" min={13} max={120} inputMode="numeric"
                     value={form.age} onChange={handleChange} />
            </div>
            <div className="field grow">
              <label htmlFor="occupation">Occupation</label>
              <input type="text" id="occupation" name="occupation" maxLength={100}
                     value={form.occupation} onChange={handleChange} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="city">Current city</label>
            <input type="text" id="city" name="city" maxLength={100} autoComplete="address-level2"
                   value={form.city} onChange={handleChange} />
          </div>
        </fieldset>

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="switch">
        Already have an account? <Link to="/signin">Sign in</Link>
      </p>
    </section>
  );
}
