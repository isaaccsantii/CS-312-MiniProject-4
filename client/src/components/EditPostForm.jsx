import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ErrorList from "./ErrorList.jsx";
import PostFormFields from "./PostFormFields.jsx";

// Step 7: the edit form from edit.ejs. The existing post arrives as a prop,
// and its values pre-fill the state, so the form opens already filled in.
export default function EditPostForm({ post, onSaved, onCancel }) {
  const { setUser, showFlash } = useAuth();
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [category, setCategory] = useState(post.category);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "title") setTitle(value);
    else if (name === "body") setBody(value);
    else if (name === "category") setCategory(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const updated = { title: title.trim(), body: body.trim(), category };

    const problems = [];
    if (!updated.title) problems.push("A title is required.");
    if (!updated.body) problems.push("The post content cannot be empty.");
    if (problems.length) return setErrors(problems);

    setSaving(true);
    try {
      // The backend checks that we created this post; a 403 comes back otherwise.
      const data = await api.updateBlog(post.blog_id, updated);
      onSaved(data.blog); // parent swaps the old post for the updated one
      showFlash(data.message);
    } catch (err) {
      if (err.status === 401) setUser(null);
      setErrors(err.errors);
      setSaving(false);
    }
  }

  return (
    <article className="card post editing">
      <h2>Edit post</h2>
      <ErrorList errors={errors} />
      <form onSubmit={handleSubmit} noValidate>
        <PostFormFields
          title={title}
          body={body}
          category={category}
          onChange={handleChange}
          idPrefix={`edit-${post.blog_id}`}
        />
        <div className="actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </article>
  );
}
