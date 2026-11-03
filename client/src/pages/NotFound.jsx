import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="card empty">
      <h2>Page not found</h2>
      <p>That page doesn't exist.</p>
      <Link className="btn" to="/">Back to the feed</Link>
    </section>
  );
}
