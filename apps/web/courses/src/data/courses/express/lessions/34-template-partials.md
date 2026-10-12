# 34 — Template Partials

> **Goal:** Remove repeated HTML (head, header, navigation, footer) by using EJS
> **partials** with `include`, pass data into partials, and structure a complete
> server-rendered site.

---

## 1. The Problem: Copy-Paste HTML

Every page repeats the same pieces:

```html
<!DOCTYPE html>
<html lang="en">
<head> ... same meta, CSS links ... </head>
<body>
  <header> ... same navigation ... </header>
  <main> ... unique content ... </main>
  <footer> ... same footer ... </footer>
</body>
</html>
```

With 20 pages, changing one navigation link means editing 20 files and forgetting one.
This breaks the **DRY** principle (**D**on't **R**epeat **Y**ourself).

**Partials** are small reusable template pieces that other templates **include**.

---

## 2. Prerequisite Concept: Template Composition

Two common approaches:

| Approach | Idea | Example |
|----------|------|---------|
| **Includes (partials)** | Page includes header & footer pieces | EJS `include()` |
| **Layouts / inheritance** | Page fills "blocks" in a base layout | Pug `extends`, Nunjucks, `express-ejs-layouts` |

EJS has **includes** built in. (Layouts need extra packages or a small trick shown in
section 9.)

```
            ┌──────────────────────────┐
            │ partials/head.ejs        │
            ├──────────────────────────┤
 page.ejs → │ partials/header.ejs      │
            ├──────────────────────────┤
            │  ... unique content ...  │
            ├──────────────────────────┤
            │ partials/footer.ejs      │
            └──────────────────────────┘
```

---

## 3. The `include` Function

```html
<%- include('partials/header') %>
```

- Path is **relative to the current template file** (and supports `views` root for
  absolute-looking paths in Express).
- Extension `.ejs` is optional.
- Uses **`<%-`** (raw output) because the partial's HTML is already rendered and trusted.
  Using `<%=` would escape it and show tags as text.

⚠️ Old syntax `<% include header %>` was removed in EJS 3. Use the function form.

### Passing data to the partial
```html
<%- include('partials/header', { title: 'Home', active: 'home' }) %>
```

The partial automatically sees **all variables of the parent template** too (the parent's
locals); the object you pass adds/overrides variables for that partial.

---

## 4. Step-by-Step: Build the Partials

### Folder structure
```
views/
├── partials/
│   ├── head.ejs
│   ├── header.ejs
│   └── footer.ejs
├── index.ejs
├── about.ejs
├── posts.ejs
└── post.ejs
```

### `views/partials/head.ejs`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= locals.title ? `${title} | ${siteName}` : siteName %></title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
```

### `views/partials/header.ejs`
```html
<header class="site-header">
  <div class="container">
    <a class="brand" href="/"><%= siteName %></a>
    <nav>
      <a href="/"      class="<%= currentPath === '/' ? 'active' : '' %>">Home</a>
      <a href="/posts" class="<%= currentPath.startsWith('/posts') ? 'active' : '' %>">Posts</a>
      <a href="/about" class="<%= currentPath === '/about' ? 'active' : '' %>">About</a>
    </nav>
  </div>
</header>
```

### `views/partials/footer.ejs`
```html
<footer class="site-footer">
  <div class="container">
    <p>&copy; <%= new Date().getFullYear() %> <%= siteName %>. Built with Express &amp; EJS.</p>
  </div>
</footer>
</body>
</html>
```

Notice: `head.ejs` **opens** `<html>` and `<body>`, `footer.ejs` **closes** them.
Partials can contain partial HTML structure — but keep it consistent and documented.

---

## 5. Provide Common Data Once

Use `app.locals` (global) and `res.locals` (per request) so every template/partial has
`siteName` and `currentPath` without passing them in every route.

```js
app.locals.siteName = 'Express Crash Course';

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});
```

Register this middleware **before** the page routes.

---

## 6. Use the Partials in Pages

### `views/index.ejs`
```html
<%- include('partials/head', { title: 'Home' }) %>
<%- include('partials/header') %>

<main class="container">
  <h1>Welcome to <%= siteName %></h1>
  <p>This page is assembled from partials.</p>
  <a href="/posts">View posts</a>
</main>

<%- include('partials/footer') %>
```

### `views/posts.ejs`
```html
<%- include('partials/head', { title: 'Posts' }) %>
<%- include('partials/header') %>

<main class="container">
  <h1>All Posts</h1>

  <% if (posts.length === 0) { %>
    <p>No posts yet.</p>
  <% } else { %>
    <ul class="post-list">
      <% posts.forEach((post) => { %>
        <%- include('partials/post-item', { post }) %>
      <% }) %>
    </ul>
  <% } %>
</main>

<%- include('partials/footer') %>
```

### `views/partials/post-item.ejs` (a reusable component)
```html
<li class="post-item">
  <a href="/posts/<%= post.id %>"><%= post.title %></a>
</li>
```

Now one change in `header.ejs` updates **every page**.

---

## 7. Route Code

```js
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Post from './models/postModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.siteName = 'Express Crash Course';

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));
app.get('/posts', (req, res) => res.render('posts', { posts: Post.findAll() }));
app.get('/posts/:id', (req, res, next) => {
  const post = Post.findById(Number(req.params.id));
  if (!post) return next();
  res.render('post', { post });
});
```

---

## 8. Include Rules and Behaviour

| Rule | Detail |
|------|--------|
| Syntax | `<%- include('relative/path', { data }) %>` |
| Path base | Relative to the including file; also resolves from `views` folder |
| Variables | Partial sees parent locals + passed data |
| Scope | Variables declared with `const/let` inside a partial are **private** to it |
| Escaping | Use `<%-` to output included HTML |
| Nesting | Partials can include other partials |
| Cache | Compiled & cached in production |
| Missing file | Throws error with the path |
| Dynamic path | `include(name)` works but **never use user input** for `name` (template injection / arbitrary file include) |
| `include` vs `include` with `with`-style | EJS 3: pass an object; avoid `with` keyword usage |

### Passing arrays and flags
```html
<%- include('partials/card', { title: 'Express', tags: ['node', 'web'], featured: true }) %>
```

```html
<!-- partials/card.ejs -->
<article class="card <%= featured ? 'featured' : '' %>">
  <h3><%= title %></h3>
  <ul>
    <% tags.forEach((t) => { %><li><%= t %></li><% }) %>
  </ul>
</article>
```

### Optional arguments inside a partial
```html
<% const size = locals.size || 'md'; %>
<button class="btn btn-<%= size %>"><%= label %></button>
```

---

## 9. Layout Pattern (One Wrapper, Many Pages)

Even with includes you still repeat two `include` lines per page. A common trick is a
**layout** template that receives the page body:

```js
// helper
app.use((req, res, next) => {
  res.renderPage = (view, locals = {}) => {
    res.render(view, locals, (err, body) => {
      if (err) return next(err);
      res.render('layout', { ...locals, body });
    });
  };
  next();
});
```

`views/layout.ejs`:
```html
<%- include('partials/head') %>
<%- include('partials/header') %>
<main class="container"><%- body %></main>
<%- include('partials/footer') %>
```

Usage: `res.renderPage('posts', { title: 'Posts', posts })`.

Or install the package **`express-ejs-layouts`**:

```bash
npm install express-ejs-layouts
```
```js
import expressLayouts from 'express-ejs-layouts';
app.use(expressLayouts);
app.set('layout', 'layout');          // views/layout.ejs with <%- body %>
```

(`<%- body %>` is raw because it is your own rendered page output; user data inside it
was already escaped by `<%= %>` when that page rendered.)

---

## 10. Highlighting the Active Link

```html
<a href="/posts" class="<%= currentPath.startsWith('/posts') ? 'active' : '' %>">Posts</a>
```

CSS:

```css
.site-header nav a { color: #cbd5e1; margin-right: 1rem; text-decoration: none; }
.site-header nav a.active { color: #fff; border-bottom: 2px solid #60a5fa; }
```

`req.path` excludes the query string; `req.originalUrl` includes it.

---

## 11. Partials for Alerts, Forms and Pagination

### `partials/alert.ejs`
```html
<% if (locals.message) { %>
  <div class="alert alert-<%= locals.type || 'info' %>" role="alert"><%= message %></div>
<% } %>
```

Usage: `<%- include('partials/alert', { message: 'Saved!', type: 'success' }) %>`

### `partials/pagination.ejs`
```html
<% if (totalPages > 1) { %>
  <nav class="pagination" aria-label="Pagination">
    <% for (let p = 1; p <= totalPages; p++) { %>
      <% if (p === page) { %><strong><%= p %></strong>
      <% } else { %><a href="?page=<%= p %>"><%= p %></a><% } %>
    <% } %>
  </nav>
<% } %>
```

Pass `{ page, totalPages }` and reuse it on every list page.

---

## 12. Static Assets Linked From Partials

Assets use **root-relative URLs** so they work on any route depth:

```html
<link rel="stylesheet" href="/style.css" />     <!-- ✅ works on /posts/5 -->
<link rel="stylesheet" href="style.css" />      <!-- ❌ breaks on /posts/5 (looks for /posts/style.css) -->
```

Add a cache-busting version while developing:

```html
<link rel="stylesheet" href="/style.css?v=<%= assetVersion %>" />
```

---

## 13. Security Notes 🔐

1. `<%- include(...) %>` is safe because the partial source is **your** file; the data
   inside is still escaped with `<%= %>`.
2. **Never** include a template chosen by user input:
   ```js
   res.render('index', { partial: req.query.p });   // ❌ then include(partial) in view
   ```
   Whitelist partial names.
3. Do not put secrets/config (API keys, tokens) into partials/locals; the HTML is public.
4. Use a **Content-Security-Policy** (via `helmet`) — avoid inline scripts in partials;
   load `/main.js` instead.
5. Add `rel="noopener noreferrer"` on external `target="_blank"` links.
6. Provide `lang` on `<html>` and `charset` for correct, consistent rendering (avoids
   encoding-based XSS tricks).
7. Don't expose admin-only navigation items by hiding them in HTML alone — enforce
   authorization on the **server** routes.

---

## 14. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `<%= include('x') %>` | Tags displayed as text | Use `<%-` |
| Old syntax `<% include x %>` | Error in EJS 3+ | `<%- include('x') %>` |
| Wrong relative path (`partials/header` from inside `partials/`) | `Could not find the include file` | Path is relative to the current file: `include('header')` inside `partials/` |
| Missing `siteName` in partial | `siteName is not defined` | Set `app.locals.siteName` or pass it |
| Mismatched HTML tags between head/footer partials | Broken page layout | Keep opening/closing consistent |
| Forgetting to register `res.locals` middleware before routes | `currentPath is not defined` | Register early |
| Unclosed `<% if %>` in partial | Syntax error with line number | Balance braces |
| Passing `title` but partial uses `pageTitle` | Empty title | Align variable names |
| Using relative asset URLs | CSS missing on nested routes | Start with `/` |
| Heavy DB calls inside a partial | Slow, hidden dependencies | Fetch in controller, pass data |

---

## 15. Final Project Structure (Whole Course)

```
express-crash-course/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── controllers/
│   └── postController.js
├── models/
│   └── postModel.js
├── middleware/
│   ├── logger.js
│   ├── error.js
│   ├── notFound.js
│   └── validatePost.js
├── routes/
│   ├── posts.js           (API)
│   └── pages.js           (EJS pages)
├── utils/
│   ├── HttpError.js
│   └── paths.js
├── public/
│   ├── style.css
│   └── main.js
└── views/
    ├── index.ejs
    ├── about.ejs
    ├── posts.ejs
    ├── post.ejs
    ├── 404.ejs
    └── partials/
        ├── head.ejs
        ├── header.ejs
        ├── footer.ejs
        └── post-item.ejs
```

You now have every building block: routing, middleware, CRUD API, error handling,
controllers, front-end `fetch`, forms, and server-rendered views with partials.

---

## 16. Exercises

1. Create `head.ejs`, `header.ejs`, `footer.ejs` and use them in three pages.
2. Add `app.locals.siteName` and `res.locals.currentPath` and highlight the active link.
3. Change one nav link in `header.ejs` and confirm every page updates.
4. Create a `post-item` partial and use it inside a loop.
5. Create an `alert` partial with `message` and `type`.
6. Create a pagination partial and reuse it on two pages.
7. Build a branded `404.ejs` using the partials and render it from `notFound`.
8. Try the layout approach (`layout.ejs` + `<%- body %>`) and compare with includes.

### Challenge
Build a **mini blog**: pages `/`, `/posts`, `/posts/:id`, `/posts/new` (form) with:
partials for head/header/footer/alert, a PRG-based create form, validation errors
re-displayed in the form, a branded 404, and `helmet` for security headers.

---

## 17. Quick Quiz

1. What is a partial?
2. Which tag do you use to include one and why?
3. How do you pass data to a partial?
4. Why use root-relative asset URLs (`/style.css`)?
5. What are `app.locals` and `res.locals` good for here?
6. Why should you never include a template chosen by user input?
7. What does DRY stand for?
8. How is a layout different from includes?

<details><summary>Answers</summary>

1. A reusable template fragment included by other templates.
2. `<%- include('path') %>`; raw output so HTML isn't escaped.
3. Pass an object as the second argument.
4. They work from any route depth.
5. Provide shared data (site name, current path) to all templates/partials.
6. It can expose arbitrary files/lead to template injection; whitelist instead.
7. Don't Repeat Yourself.
8. A layout wraps page content in one shared template; includes are inserted manually.
</details>

---

## 18. Summary

- Partials remove duplicated HTML: `<%- include('partials/header', { data }) %>`.
- Use `<%-` for includes; relative paths; data passes down automatically plus extras.
- Shared variables come from `app.locals` and `res.locals`.
- Build reusable components (post item, alert, pagination); consider a layout wrapper.
- Never include user-chosen templates; keep secrets out; combine with `helmet` and CSP.

---

## 19. Course Complete 🎉

You have covered all 34 topics. Suggested next steps:

1. **MySQL integration** — replace the in-memory model with `mysql2` and parameterized queries.
2. **Authentication** — sessions or JWT, `bcrypt`, protecting routes with middleware.
3. **Validation libraries** — `zod`, `joi`, `express-validator`.
4. **Security hardening** — `helmet`, `express-rate-limit`, CORS configuration, CSRF.
5. **Testing** — Vitest/Jest + Supertest.
6. **Deployment** — environment variables, `systemd`/PM2/Docker, reverse proxy (nginx), HTTPS.

Keep building small projects; every concept becomes natural with practice.
