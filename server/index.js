// CS-312 Mini Project 4 - Express JSON API
// Mini Project 3 rendered EJS pages on the server. In this project the server only
// sends JSON; the React app in ../client renders every page in the browser.
require("dotenv").config({ quiet: true });

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 8000;
const SALT_ROUNDS = 10;
const CATEGORIES = ["Tech", "Lifestyle", "Education", "Travel", "Other"];
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

// ---------- Middleware ----------

// React runs on a different port (5173), so the browser treats it as a different origin.
// CORS tells the browser that the React app may call this API, and credentials: true
// lets the session cookie travel with each fetch() request.
app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));
app.use(express.json()); // parse JSON request bodies sent by fetch()
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-only-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
  })
);

// ---------- Helpers ----------

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Send errors in one consistent shape so React can always read data.errors.
function sendErrors(res, status, errors) {
  return res.status(status).json({ errors: Array.isArray(errors) ? errors : [errors] });
}

function requireLogin(req, res, next) {
  if (req.session.user) return next();
  sendErrors(res, 401, "Please sign in first.");
}

const USER_ID_RE = /^[A-Za-z0-9_.-]{3,30}$/;

function validatePost(body = {}) {
  const data = {
    title: clean(body.title),
    body: clean(body.body),
    category: CATEGORIES.includes(body.category) ? body.category : "Other",
  };
  const errors = [];
  if (!data.title) errors.push("A title is required.");
  if (data.title.length > 255) errors.push("The title must be 255 characters or fewer.");
  if (!data.body) errors.push("The post content cannot be empty.");
  return { data, errors };
}

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Add a can_edit flag to each blog. The backend decides ownership and forwards
// the answer to the frontend, which uses it to show or hide Edit/Delete buttons.
function withPermissions(blog, req) {
  const me = req.session.user;
  return { ...blog, can_edit: Boolean(me && me.user_id === blog.creator_user_id) };
}

const BLOG_COLUMNS =
  "blog_id, creator_name, creator_user_id, title, body, category, date_created, date_updated";

async function getBlog(blogId) {
  const { rows } = await db.query(`SELECT ${BLOG_COLUMNS} FROM blogs WHERE blog_id = $1`, [blogId]);
  return rows[0] || null;
}

// Load a blog and confirm the signed-in user created it.
// Sends a 404/403 JSON error itself and returns null if access is not allowed.
async function loadOwnBlog(req, res) {
  const id = parseId(req.params.id);
  const blog = id && (await getBlog(id));
  if (!blog) {
    sendErrors(res, 404, "That post doesn't exist. It may have been deleted.");
    return null;
  }
  if (blog.creator_user_id !== req.session.user.user_id) {
    sendErrors(res, 403, "You can only edit or delete posts you created.");
    return null;
  }
  return blog;
}

// ---------- Auth: sign up / sign in / sign out ----------

// Who is signed in right now? React calls this when the app first loads.
app.get("/auth/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post("/auth/signup", async (req, res) => {
  const body = req.body || {};
  const form = {
    user_id: clean(body.user_id),
    name: clean(body.name),
    occupation: clean(body.occupation),
    city: clean(body.city),
  };
  const password = typeof body.password === "string" ? body.password : "";
  const confirm = typeof body.confirm_password === "string" ? body.confirm_password : "";
  const ageRaw = body.age === undefined || body.age === null ? "" : String(body.age).trim();
  const age = ageRaw === "" ? null : Number(ageRaw);

  const errors = [];
  if (!USER_ID_RE.test(form.user_id)) {
    errors.push("User ID must be 3-30 characters: letters, numbers, dot, dash or underscore.");
  }
  if (!form.name) errors.push("Your name is required.");
  if (password.length < 6) errors.push("Password must be at least 6 characters.");
  if (password.length > 72) errors.push("Password must be 72 characters or fewer.");
  if (password !== confirm) errors.push("Passwords do not match.");
  if (age !== null && (!Number.isInteger(age) || age < 13 || age > 120)) {
    errors.push("Age must be a whole number between 13 and 120.");
  }
  if (form.occupation.length > 100) errors.push("Occupation must be 100 characters or fewer.");
  if (form.city.length > 100) errors.push("City must be 100 characters or fewer.");

  // Database lookup: is the user_id already taken?
  if (!errors.length) {
    const { rowCount } = await db.query("SELECT 1 FROM users WHERE user_id = $1", [form.user_id]);
    if (rowCount > 0) {
      errors.push(`The user ID "${form.user_id}" is already taken. Please choose a different one.`);
    }
  }
  if (errors.length) return sendErrors(res, 400, errors);

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  await db.query(
    `INSERT INTO users (user_id, password, name, age, occupation, city)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [form.user_id, hash, form.name, age, form.occupation || null, form.city || null]
  );

  res.status(201).json({ message: "Account created! Sign in with your new user ID and password." });
});

app.post("/auth/signin", async (req, res, next) => {
  const body = req.body || {};
  const userId = clean(body.user_id);
  const password = typeof body.password === "string" ? body.password : "";

  // Look up the user_id, then compare the password with its stored bcrypt hash.
  const { rows } = userId
    ? await db.query("SELECT user_id, password, name FROM users WHERE user_id = $1", [userId])
    : { rows: [] };
  const user = rows[0];
  const ok = user ? await bcrypt.compare(password, user.password) : false;

  if (!ok) {
    return sendErrors(res, 401, "Incorrect user ID or password. Please enter your correct credentials.");
  }

  // New session ID on sign-in to prevent session fixation.
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.user = { user_id: user.user_id, name: user.name };
    req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      res.json({ user: req.session.user, message: `Welcome back, ${user.name}!` });
    });
  });
});

app.post("/auth/signout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Signed out." });
  });
});

// ---------- Blogs ----------

// All posts (optionally filtered by ?category=Tech), newest first.
app.get("/blogs", async (req, res) => {
  const selected = CATEGORIES.includes(req.query.category) ? req.query.category : "All";
  const params = [];
  let sql = `SELECT ${BLOG_COLUMNS} FROM blogs`;
  if (selected !== "All") {
    sql += " WHERE category = $1";
    params.push(selected);
  }
  sql += " ORDER BY date_created DESC, blog_id DESC";

  const [{ rows }, { rows: countRows }] = await Promise.all([
    db.query(sql, params),
    db.query("SELECT COUNT(*)::int AS total FROM blogs"),
  ]);

  res.json({
    blogs: rows.map((b) => withPermissions(b, req)),
    total: countRows[0].total,
    categories: CATEGORIES,
  });
});

// One post
app.get("/blogs/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const blog = id && (await getBlog(id));
  if (!blog) return sendErrors(res, 404, "That post doesn't exist. It may have been deleted.");
  res.json({ blog: withPermissions(blog, req) });
});

// Create a post (must be signed in). The creator comes from the session, never from the request body.
app.post("/blogs", requireLogin, async (req, res) => {
  const { data, errors } = validatePost(req.body);
  if (errors.length) return sendErrors(res, 400, errors);

  const { user_id, name } = req.session.user;
  const { rows } = await db.query(
    `INSERT INTO blogs (creator_name, creator_user_id, title, body, category, date_created)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING ${BLOG_COLUMNS}`,
    [name, user_id, data.title, data.body, data.category]
  );
  res.status(201).json({ blog: withPermissions(rows[0], req), message: "Post published." });
});

// Update a post (creator only)
app.put("/blogs/:id", requireLogin, async (req, res) => {
  const blog = await loadOwnBlog(req, res);
  if (!blog) return;

  const { data, errors } = validatePost(req.body);
  if (errors.length) return sendErrors(res, 400, errors);

  // The creator_user_id check in WHERE is a second safety net on top of loadOwnBlog.
  const { rows } = await db.query(
    `UPDATE blogs SET title = $1, body = $2, category = $3, date_updated = NOW()
     WHERE blog_id = $4 AND creator_user_id = $5
     RETURNING ${BLOG_COLUMNS}`,
    [data.title, data.body, data.category, blog.blog_id, req.session.user.user_id]
  );
  res.json({ blog: withPermissions(rows[0], req), message: "Post updated." });
});

// Delete a post (creator only)
app.delete("/blogs/:id", requireLogin, async (req, res) => {
  const blog = await loadOwnBlog(req, res);
  if (!blog) return;

  await db.query("DELETE FROM blogs WHERE blog_id = $1 AND creator_user_id = $2", [
    blog.blog_id,
    req.session.user.user_id,
  ]);
  res.json({ blog_id: blog.blog_id, message: "Post deleted." });
});

// ---------- My Profile (bonus) ----------

app.get("/profile", requireLogin, async (req, res) => {
  const userId = req.session.user.user_id;
  const [{ rows: users }, { rows: blogs }] = await Promise.all([
    db.query(
      "SELECT user_id, name, age, occupation, city, created_at FROM users WHERE user_id = $1",
      [userId]
    ),
    db.query(
      `SELECT ${BLOG_COLUMNS} FROM blogs WHERE creator_user_id = $1 ORDER BY date_created DESC, blog_id DESC`,
      [userId]
    ),
  ]);
  if (!users[0]) return sendErrors(res, 404, "Account not found.");
  res.json({ user: users[0], blogs: blogs.map((b) => withPermissions(b, req)) });
});

// ---------- Fallbacks ----------

app.use((req, res) => {
  sendErrors(res, 404, `No API route for ${req.method} ${req.path}`);
});

// Express 5 forwards errors thrown in async handlers here.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return sendErrors(res, 400, "Invalid JSON in request body.");
  console.error(err);
  const dbDown = ["ECONNREFUSED", "3D000", "28P01"].includes(err.code);
  sendErrors(
    res,
    500,
    dbDown
      ? "Could not reach the database. Check that PostgreSQL is running and server/.env is correct."
      : "An unexpected error occurred. Please try again."
  );
});

app.listen(PORT, () => {
  console.log(`Blog API running at http://localhost:${PORT}`);
});
