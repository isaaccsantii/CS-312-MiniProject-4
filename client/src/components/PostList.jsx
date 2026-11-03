import { useState } from "react";
import { api, formatDate } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import EditPostForm from "./EditPostForm.jsx";

// Step 6: renders every post with .map(). Each post the signed-in user created
// gets Edit and Delete buttons (the backend sends can_edit for each post).
export default function PostList({ blogs, onUpdated, onDeleted, emptyMessage = "No posts yet." }) {
  const { setUser, showFlash } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Step 8: ask the backend to delete; it only does so if we created the post.
  async function handleDelete(blog) {
    if (!window.confirm(`Delete "${blog.title}" permanently?`)) return;
    setDeletingId(blog.blog_id);
    try {
      const data = await api.deleteBlog(blog.blog_id);
      onDeleted(blog.blog_id); // parent removes it from the list
      showFlash(data.message);
    } catch (err) {
      if (err.status === 401) setUser(null);
      if (err.status === 404) onDeleted(blog.blog_id); // already gone
      showFlash(err.errors.join(" "), "error");
    } finally {
      setDeletingId(null);
    }
  }

  if (blogs.length === 0) return <div className="empty">{emptyMessage}</div>;

  return (
    <div className="post-list">
      {blogs.map((blog) =>
        editingId === blog.blog_id ? (
          <EditPostForm
            key={blog.blog_id}
            post={blog}
            onSaved={(updated) => {
              onUpdated(updated);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <article key={blog.blog_id} className={`card post ${blog.can_edit ? "mine" : ""}`}>
            <div className="post-top">
              <span className="badge">{blog.category}</span>
              <time dateTime={blog.date_created}>{formatDate(blog.date_created)}</time>
            </div>
            <h3>{blog.title}</h3>
            <p className="meta">
              By <strong>{blog.creator_name}</strong> <span className="handle">@{blog.creator_user_id}</span>
              {blog.can_edit && <span className="you">You</span>}
              {blog.date_updated && <> &middot; edited {formatDate(blog.date_updated)}</>}
            </p>
            <p className="content">{blog.body}</p>
            {blog.can_edit && (
              <div className="actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditingId(blog.blog_id)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(blog)}
                  disabled={deletingId === blog.blog_id}
                >
                  {deletingId === blog.blog_id ? "Deleting…" : "Delete"}
                </button>
              </div>
            )}
          </article>
        )
      )}
    </div>
  );
}
