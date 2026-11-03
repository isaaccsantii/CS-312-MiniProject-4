import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ErrorList from "./ErrorList.jsx";
import PostFormFields, { CATEGORIES } from "./PostFormFields.jsx";

// Step 5: the "Write a new post" form from index.ejs, rebuilt as a controlled React form.
export default function BlogPostForm({ onCreated }) {
  const { user, setUser, showFlash } = useAuth();

  // One state variable per form field. Each input's value comes from state.
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  // onChange handler: update the matching state variable as the user types.
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "title") setTitle(value);
    else if (name === "body") setBody(value);
    else if (name === "category") setCategory(value);
  }

  // Submit handler: stop the browser's normal form submit (full page reload),
  // gather the state into one object, and send it to the backend as JSON.
  async function handleSubmit(e) {
    e.preventDefault();
    const post = { title: title.trim(), body: body.trim(), category };

    const problems = [];
    if (!post.title) problems.push("A title is required.");
    if (!post.body) problems.push("The post content cannot be empty.");
    if (problems.length) return setErrors(problems);

    setSaving(true);
    try {
      const data = await api.createBlog(post);
      onCreated(data.blog); // parent adds the new post to the list
      setTitle("");
      setBody("");
      setCategory(CATEGORIES[0]);
      setErrors([]);
      showFlash(data.message);
    } catch (err) {
      if (err.status === 401) setUser(null); // session expired
      setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card" id="new-post">
      <h2>Write a new post</h2>
      <p className="hint">
        Posting as <strong>{user.name}</strong> (@{user.user_id})
      </p>
      <ErrorList errors={errors} />
      <form onSubmit={handleSubmit} noValidate>
        <PostFormFields title={title} body={body} category={category} onChange={handleChange} />
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Publishing…" : "Publish post"}
        </button>
      </form>
    </section>
  );
}
