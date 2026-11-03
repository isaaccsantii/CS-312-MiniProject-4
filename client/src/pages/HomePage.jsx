import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import BlogPostForm from "../components/BlogPostForm.jsx";
import PostList from "../components/PostList.jsx";
import ErrorList from "../components/ErrorList.jsx";
import { CATEGORIES } from "../components/PostFormFields.jsx";

// The home page = index.ejs: new-post form (or sign-in prompt) + filter chips + the feed.
export default function HomePage() {
  const { user, checking } = useAuth();
  const [searchParams] = useSearchParams();
  const selected = CATEGORIES.includes(searchParams.get("category")) ? searchParams.get("category") : "All";

  const [blogs, setBlogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  // Load posts from the backend. This runs again when the category filter changes
  // or when the user signs in/out (so can_edit is recalculated for each post).
  useEffect(() => {
    if (checking) return;
    let ignore = false;
    setLoading(true);
    api
      .getBlogs(selected)
      .then((data) => {
        console.log("Blogs from backend:", data); // Step 3: confirm React is connected to Express
        if (ignore) return;
        setBlogs(data.blogs);
        setTotal(data.total);
        setErrors([]);
      })
      .catch((err) => !ignore && setErrors(err.errors))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [selected, user?.user_id, checking]);

  // Called by BlogPostForm after the backend saves a new post.
  function handleCreated(blog) {
    setTotal((t) => t + 1);
    if (selected === "All" || blog.category === selected) setBlogs((list) => [blog, ...list]);
  }

  // Called by EditPostForm: replace the old post with the updated one, in place.
  function handleUpdated(updated) {
    setBlogs((list) =>
      list
        .map((b) => (b.blog_id === updated.blog_id ? updated : b))
        .filter((b) => selected === "All" || b.category === selected)
    );
  }

  // Called after a delete: drop the post so it disappears from the page.
  function handleDeleted(id) {
    setBlogs((list) => list.filter((b) => b.blog_id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  return (
    <>
      {user ? (
        <BlogPostForm onCreated={handleCreated} />
      ) : (
        !checking && (
          <section className="card cta">
            <div>
              <h2>Share your own posts</h2>
              <p className="hint">Sign in to write posts and to edit or delete the ones you've created.</p>
            </div>
            <div className="actions">
              <Link className="btn" to="/signin">Sign in</Link>
              <Link className="btn btn-outline" to="/signup">Create account</Link>
            </div>
          </section>
        )
      )}

      <section className="posts">
        <div className="posts-head">
          <h2>
            Blog feed{" "}
            <span className="count">
              {blogs.length}
              {selected !== "All" ? ` of ${total}` : ""}
            </span>
          </h2>
          <div className="filters" aria-label="Filter posts by category">
            <Link to="/" className={`chip ${selected === "All" ? "active" : ""}`}>All</Link>
            {CATEGORIES.map((c) => (
              <Link key={c} to={`/?category=${encodeURIComponent(c)}`} className={`chip ${selected === c ? "active" : ""}`}>
                {c}
              </Link>
            ))}
          </div>
        </div>

        <ErrorList errors={errors} />
        {loading ? (
          <div className="empty">Loading posts…</div>
        ) : (
          <PostList
            blogs={blogs}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
            emptyMessage={selected !== "All" ? `No posts in ${selected} yet.` : "No posts yet."}
          />
        )}
      </section>
    </>
  );
}
