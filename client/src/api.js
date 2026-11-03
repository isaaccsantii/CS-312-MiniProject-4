// Every call to the Express backend goes through this file.
// The backend runs on a different port, so we send credentials: "include"
// to make the browser attach the session cookie to each request.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(status, errors) {
    super(errors.join(" "));
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, [`Could not reach the server. Is the backend running at ${API_URL}?`]);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.errors || [`Request failed (${res.status}).`]);
  }
  return data;
}

export const api = {
  // Auth
  me: () => request("/auth/me"),
  signup: (form) => request("/auth/signup", { method: "POST", body: form }),
  signin: (form) => request("/auth/signin", { method: "POST", body: form }),
  signout: () => request("/auth/signout", { method: "POST" }),

  // Blogs
  getBlogs: (category = "All") =>
    request(category === "All" ? "/blogs" : `/blogs?category=${encodeURIComponent(category)}`),
  createBlog: (post) => request("/blogs", { method: "POST", body: post }),
  updateBlog: (id, post) => request(`/blogs/${id}`, { method: "PUT", body: post }),
  deleteBlog: (id) => request(`/blogs/${id}`, { method: "DELETE" }),

  // Bonus: My Profile
  getProfile: () => request("/profile"),
};

export function formatDate(value) {
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
