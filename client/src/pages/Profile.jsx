import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ErrorList from "../components/ErrorList.jsx";
import PostList from "../components/PostList.jsx";

// Bonus: My Profile - the user's sign-up details plus every post they wrote.
export default function Profile() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    api
      .getProfile()
      .then((data) => {
        setProfile(data.user);
        setBlogs(data.blogs);
      })
      .catch((err) => {
        if (err.status === 401) setUser(null);
        setErrors(err.errors);
      });
  }, [setUser]);

  if (errors.length) return <ErrorList errors={errors} />;
  if (!profile) return <div className="empty">Loading profile…</div>;

  const details = [
    ["User ID", `@${profile.user_id}`],
    ["Name", profile.name],
    ["Age", profile.age],
    ["Occupation", profile.occupation],
    ["Current city", profile.city],
    ["Member since", new Date(profile.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })],
  ];

  return (
    <>
      <section className="card">
        <div className="profile">
          <span className="avatar avatar-lg" aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</span>
          <div>
            <h2>{profile.name}</h2>
            <p className="hint">
              @{profile.user_id} &middot; {blogs.length} post{blogs.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <dl className="details">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value === null || value === undefined || value === "" ? <span className="muted">Not provided</span> : value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="posts">
        <div className="posts-head">
          <h2>My posts <span className="count">{blogs.length}</span></h2>
          <Link to="/" className="btn btn-small">Write a post</Link>
        </div>
        <PostList
          blogs={blogs}
          onUpdated={(updated) => setBlogs((list) => list.map((b) => (b.blog_id === updated.blog_id ? updated : b)))}
          onDeleted={(id) => setBlogs((list) => list.filter((b) => b.blog_id !== id))}
          emptyMessage="You haven't written any posts yet."
        />
      </section>
    </>
  );
}
