# CS-312 Mini Project 4: Blog Web Application Using React.js, Node.js, Express.js

This project builds on Mini Project 3 (Express + EJS + PostgreSQL). The EJS views are gone: the **Express server now returns JSON only**, and a **React** front end (built with Vite) renders every page in the browser and talks to the server with `fetch`.

Users can sign up, sign in, create, view, edit, and delete blog posts. A user can edit or delete only the posts they created, and that check happens on the backend.

## Features

- **Sign up / Sign in** React pages with the same layout as the EJS versions. The backend does the database lookup and password check and returns success or error JSON.
- **BlogPostForm**: controlled form (one state variable per field, `value` + `onChange`), `preventDefault()` submit handler, posts JSON to the API.
- **PostList**: fetches posts, renders them with `.map()`, and shows Edit/Delete buttons on your own posts.
- **EditPostForm**: receives the existing post as a **prop** and pre-fills the form. The updated post replaces the old one in the list without reloading.
- **Delete**: asks the backend to delete; the post disappears from the page right away.
- **Ownership is enforced by the backend**: `PUT` and `DELETE` return **403** for posts you didn't create, and every post in the API response carries a `can_edit` flag that the frontend uses to show or hide buttons.
- Category filter chips and responsive styling carried over from earlier projects.
- Passwords stored as bcrypt hashes; sessions use an httpOnly cookie.
- **Bonus: My Profile** page showing your user ID, name, age, occupation, current city, member-since date, and all of your posts (which you can edit/delete there too). Age, occupation, and city are optional fields on the sign-up form.

## Step 1: Planning

### React component tree

```
main.jsx
└── AuthProvider (AuthContext.jsx)      signed-in user + flash messages for every component
    └── App.jsx                         routes
        ├── Header                      nav links, avatar → My Profile, Sign out
        ├── Flash                       one-time success/error banner
        ├── "/"         HomePage
        │               ├── BlogPostForm      (signed in)  → PostFormFields
        │               ├── category chips
        │               └── PostList
        │                   └── EditPostForm  (for the post being edited) → PostFormFields
        ├── "/signin"   SignIn
        ├── "/signup"   SignUp
        ├── "/profile"  Profile (bonus)  → PostList
        └── "*"         NotFound
```

| EJS view (Mini Project 3)          | React component (Mini Project 4)          |
| ---------------------------------- | ----------------------------------------- |
| `partials/header.ejs`              | `components/Header.jsx`                   |
| `partials/errors.ejs`              | `components/ErrorList.jsx`                |
| `partials/post-form-fields.ejs`    | `components/PostFormFields.jsx`           |
| new-post form in `index.ejs`       | `components/BlogPostForm.jsx`             |
| post loop in `index.ejs`           | `components/PostList.jsx`                 |
| `edit.ejs`                         | `components/EditPostForm.jsx`             |
| `signin.ejs` / `signup.ejs`        | `pages/SignIn.jsx` / `pages/SignUp.jsx`   |
| `account.ejs`                      | `pages/Profile.jsx` (My Profile)          |
| `404.ejs`                          | `pages/NotFound.jsx`                      |

### Database schema

Same as Mini Project 3, plus three optional profile columns on `users`:

```
users                                   blogs
-----------------------------           ---------------------------------------------
user_id     VARCHAR(255) PK  <──────┐   blog_id          SERIAL PK
password    VARCHAR(255)  (bcrypt)  └── creator_user_id  VARCHAR(255) FK → users.user_id
name        VARCHAR(255)                creator_name     VARCHAR(255)
age         INTEGER       (optional)    title            VARCHAR(255)
occupation  VARCHAR(100)  (optional)    body             TEXT
city        VARCHAR(100)  (optional)    category         VARCHAR(50)
created_at  TIMESTAMP                   date_created     TIMESTAMP
                                        date_updated     TIMESTAMP (null until edited)
```

## API routes (all return JSON)

| Method | Path             | Purpose                                            | Sign-in needed |
| ------ | ---------------- | -------------------------------------------------- | -------------- |
| GET    | `/auth/me`       | Current session user (or `null`)                   | No             |
| POST   | `/auth/signup`   | Create account (checks if `user_id` is taken)      | No             |
| POST   | `/auth/signin`   | Check credentials, start session                   | No             |
| POST   | `/auth/signout`  | End session                                        | No             |
| GET    | `/blogs`         | All posts, newest first (`?category=Tech` filter)  | No             |
| GET    | `/blogs/:id`     | One post                                           | No             |
| POST   | `/blogs`         | Create a post                                      | Yes            |
| PUT    | `/blogs/:id`     | Update a post (creator only, else 403)             | Yes            |
| DELETE | `/blogs/:id`     | Delete a post (creator only, else 403)             | Yes            |
| GET    | `/profile`       | Your details + your posts (bonus)                  | Yes            |

Errors always come back as `{ "errors": ["..."] }` with a matching status code (400, 401, 403, 404, 500).

## Setup

**Requirements:** Node.js 20.19+ (or 22.12+) and PostgreSQL.

1. Install everything (root, server, and client):
   ```bash
   npm run install:all
   ```
2. Copy `server/.env.example` to `server/.env` and set `PGPASSWORD` to your PostgreSQL password.
3. Create the database `BlogDB4` with its tables and starter data:
   ```bash
   npm run db:setup
   ```
   (Or in pgAdmin: create a database named `BlogDB4`, then run `server/db/schema.sql` and `server/db/seed.sql` in the Query Tool.)
4. Start the API and the React app together:
   ```bash
   npm run dev
   ```
   - React app: http://localhost:5173 ← open this one
   - Express API: http://localhost:8000 (try http://localhost:8000/blogs to see the raw JSON)

Use `localhost` (not `127.0.0.1`) in the browser so the session cookie is shared between the two ports.

### Starter accounts

| User ID | Password  | Name           |
| ------- | --------- | -------------- |
| isaac   | isaac123  | Isaac Santiago |
| maria   | maria2026 | Maria Lopez    |
| devon   | devon2026 | Devon Clark    |

## How React and Express connect

- `client/src/api.js` holds every request. It calls `http://localhost:8000/...` with `fetch` and `credentials: "include"` so the session cookie is sent.
- `server/index.js` uses the `cors` package to allow the React origin (`http://localhost:5173`) with credentials.
- When the home page loads, it logs `Blogs from backend: {...}` in the browser console, which confirms the connection (Step 3).

## Testing

Tested in Chrome at 1280px (desktop) and 390px (mobile) with an automated browser script plus manual checks:

- Sign up with a taken user ID → error; with a new ID (+ optional age/occupation/city) → redirected to sign in
- Sign in with a wrong password → error; correct password → feed with the new-post form
- Create a post → appears at the top of the feed without a reload, form clears
- Edit → form opens pre-filled; saving replaces the post in place and shows "edited"
- Sending a `PUT` for another user's post straight to the API → **403** "You can only edit or delete posts you created."
- Delete → post disappears immediately and stays gone after a reload
- Category filters, session survives a page reload, `/profile` redirects to sign in when signed out
- My Profile shows the sign-up details and only that user's posts
- No horizontal scrolling on mobile; buttons go full width

Screenshots are in [`screenshots/`](screenshots).

## Project structure

```
package.json                 root scripts: install:all, db:setup, dev (runs both servers)
server/
  index.js                   Express JSON API
  db/index.js                PostgreSQL connection pool
  db/schema.sql, seed.sql    tables + starter data
  db/setup-db.js             creates BlogDB4 and runs the SQL files
  .env.example
client/
  index.html, vite.config.js
  src/main.jsx               mounts React, router, AuthProvider
  src/App.jsx                routes + RequireAuth / GuestOnly guards
  src/api.js                 fetch wrapper for every backend call
  src/AuthContext.jsx        signed-in user + flash messages
  src/components/            Header, Footer, Flash, ErrorList, PostFormFields,
                             BlogPostForm, PostList, EditPostForm
  src/pages/                 HomePage, SignIn, SignUp, Profile, NotFound
  src/index.css              styles (carried over from Mini Project 3 + additions)
screenshots/
```
