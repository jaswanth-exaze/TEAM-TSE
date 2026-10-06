# 09 — Static Web Server

> **Goal:** Serve a whole folder of HTML, CSS, JavaScript and images with one line,
> and understand how middleware, URL prefixes and caching work.

---

## 1. What Is a "Static" File?

| Static | Dynamic |
|--------|---------|
| Same file for everyone | Generated per request |
| `.html`, `.css`, `.js`, images, fonts, PDFs | JSON from a database, personalized pages |
| Just read from disk and send | Needs code to compute |

A **static web server** only sends files from a folder. Express can do this *and* run
dynamic routes in the same app.

---

## 2. Prerequisite Concept: Middleware (Short Intro)

Lesson 23 explains middleware fully, but you need the idea now.

> **Middleware** is a function that runs **between** the request arriving and the
> response leaving. It can read the request, change it, send a response, or pass control
> to the next function.

```
Request -> [middleware A] -> [middleware B] -> [route handler] -> Response
```

`app.use(fn)` registers middleware for **every** request (and every method).

`express.static` is a **built-in middleware factory**: you call it with a folder name and
it returns a middleware that serves files from that folder.

---

## 3. The One-Line Solution

```js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Now **everything** inside `public/` is reachable:

```
public/
├── index.html
├── about.html
├── style.css
├── main.js
└── images/
    └── logo.png
```

| URL | File served |
|-----|-------------|
| `/` | `public/index.html` (automatic!) |
| `/about.html` | `public/about.html` |
| `/style.css` | `public/style.css` |
| `/main.js` | `public/main.js` |
| `/images/logo.png` | `public/images/logo.png` |

Note: the folder name `public` is **not** part of the URL.

---

## 4. How `express.static` Decides

For each request, the static middleware:

1. Only handles **GET** and **HEAD**.
2. Takes the URL path (e.g., `/style.css`).
3. Looks for `public/style.css`.
4. If found → sends it and **stops** (route handlers after it are not reached).
5. If not found → calls `next()` so later routes can try (or Express returns 404).
6. If the path is a folder → looks for `index.html` inside it.

That is why `/` shows `index.html` without any route.

---

## 5. Build a Small Website

### `public/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Express Site</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <header>
    <h1>My Express Site</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/about.html">About</a>
    </nav>
  </header>

  <main>
    <p>Served by express.static.</p>
    <img src="/images/logo.png" alt="Logo" width="120" />
    <button id="btn">Click me</button>
    <p id="out"></p>
  </main>

  <script src="/main.js"></script>
</body>
</html>
```

### `public/style.css`
```css
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; background: #f4f6f8; color: #222; }
header { background: #1f2937; color: #fff; padding: 1rem 2rem; }
nav a { color: #93c5fd; margin-right: 1rem; text-decoration: none; }
main { padding: 2rem; }
button { padding: .5rem 1rem; cursor: pointer; }
```

### `public/main.js`
```js
document.getElementById('btn').addEventListener('click', () => {
  document.getElementById('out').textContent = 'Hello from main.js!';
});
```

### `public/about.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>About</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <header><h1>About</h1></header>
  <main><p>This is a static page.</p><a href="/">Back</a></main>
</body>
</html>
```

Run `npm run dev` and open `http://localhost:5000`. CSS, JS and image all load now.

---

## 6. Prerequisite Concept: Absolute vs Relative URLs in HTML

In HTML you write `href="style.css"` or `href="/style.css"`:

| Written | Resolved relative to |
|---------|----------------------|
| `style.css` | the current page's folder |
| `/style.css` | the **site root** (host) |
| `../style.css` | one folder up from current page |

Example: on page `/blog/post1.html`
- `href="style.css"` → `/blog/style.css`
- `href="/style.css"` → `/style.css`

**Tip:** use root-relative URLs (starting with `/`) to avoid broken links in nested pages.

---

## 7. Mounting at a URL Prefix

```js
app.use('/assets', express.static(path.join(__dirname, 'public')));
```

Now:

| URL | File |
|-----|------|
| `/assets/style.css` | `public/style.css` |
| `/style.css` | 404 |

Use prefixes to avoid clashing with your API routes (`/api/...`).

### Multiple static folders
```js
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```
Express tries them in order.

---

## 8. Order Matters: Static vs Routes

```js
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Route handler');
});
```

If `public/index.html` exists, **static wins** because it is registered first and sends
the file. Your `/` route never runs. If you want the route to win, register it before
static, or remove/rename `index.html`.

Typical safe order:

1. Logging / security middleware
2. `express.static(...)`
3. API routes
4. 404 handler
5. Error handler

---

## 9. Options of `express.static`

```js
app.use(express.static(path.join(__dirname, 'public'), {
  index: 'home.html',     // default file instead of index.html
  extensions: ['html'],   // /about -> about.html (no .html in URL)
  maxAge: '1d',           // browser cache time
  dotfiles: 'ignore',     // do not serve .hidden files
  etag: true,
  redirect: true,         // /folder -> /folder/
}));
```

### Pretty URLs with `extensions`
```js
app.use(express.static('public', { extensions: ['html'] }));
```
Now `/about` serves `public/about.html`. 

| Option | Default | Meaning |
|--------|---------|---------|
| `index` | `index.html` | Default document for folders |
| `extensions` | false | Try these extensions when a file is not found |
| `maxAge` | 0 | Cache lifetime |
| `dotfiles` | `ignore` | How to treat files starting with `.` |
| `fallthrough` | true | Call `next()` when file missing |
| `setHeaders` | — | Function to set custom headers |

---

## 10. Concept: Browser Caching (Why Changes Sometimes Do Not Appear)

Browsers save static files to avoid downloading again.

| Header | Meaning |
|--------|---------|
| `ETag` | Fingerprint of the file; browser asks "is it still this one?" |
| `Last-Modified` | When file changed |
| `Cache-Control: max-age=86400` | Do not even ask for 1 day |

If you set a long `maxAge` while developing, the browser may show **old CSS**. Fix:
- Hard refresh: `Ctrl + Shift + R`
- DevTools → Network → tick **Disable cache**
- Keep `maxAge` small in development

Server answers `304 Not Modified` when the cached copy is still valid — saves bandwidth.

---

## 11. Security: What Becomes Public?

**Everything inside the static folder is public.** Anyone can request any file.

Never place these in `public/`:
- `.env`
- `package.json`, `package-lock.json`
- database dumps or backups
- source code you do not want exposed
- private user uploads

Bad (exposes the whole project!):
```js
app.use(express.static(__dirname));   // ❌ serves server.js, .env, everything
```

Good:
```js
app.use(express.static(path.join(__dirname, 'public')));   // ✅ only public
```

> 🔐 In security reviews, "static root points to project root" is a classic finding.
> It leaks `.env`, `.git/` folder and source code.

By default `dotfiles: 'ignore'` hides `.env` and `.git`, but do not rely on it — keep
secrets outside the static folder.

---

## 12. Path Traversal Protection

`express.static` already blocks `../` escapes and null bytes, so it is the **preferred**
way to serve files rather than writing your own `sendFile` route with user input.

Test:
```bash
curl --path-as-is -i "http://localhost:5000/../server.js"
```
You should get 404/403, not the file.

---

## 13. Static + API in One App

```js
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/time', (req, res) => {
  res.json({ now: new Date().toISOString() });
});

app.listen(5000, () => console.log('http://localhost:5000'));
```

In `main.js` the page can call the API:

```js
fetch('/api/time')
  .then((r) => r.json())
  .then((data) => console.log(data.now));
```

This pattern — a static front-end plus JSON API — is the base of most web apps.

---

## 14. Serving a Single-Page Fallback (Preview)

For apps like React that handle routing in the browser:

```js
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {          // Express 4 syntax
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
```

In Express 5 the wildcard syntax changed (`'/{*splat}'`). Keep it in mind for later.

---

## 15. Inspecting What Happens (Network Tab)

1. Open `http://localhost:5000`.
2. DevTools → **Network** → refresh.
3. You see 4 requests: `localhost` (HTML), `style.css`, `main.js`, `logo.png`.
4. Each shows Status `200` (first time) or `304` (cached validation).

One HTML page triggers many requests. Static middleware answers all of them.

---

## 16. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `express.static('public')` with cwd issues | 404 when run from another folder | Use `path.join(__dirname, 'public')` |
| Writing `/public/style.css` in HTML | 404 | The folder name is not in the URL: `/style.css` |
| Placing `app.use(express.static)` after the 404 handler | Files never served | Register static **before** 404 |
| Serving project root | Secrets leak | Serve only `public` |
| Old CSS after editing | Browser cache | Hard refresh / disable cache |
| Image in wrong folder | Broken image icon | Check path in Network tab |

---

## 17. Exercises

1. Build the site in section 5 and confirm all four resources load.
2. Add `contact.html` and use `extensions: ['html']` so `/contact` works.
3. Mount static at `/assets` and update the HTML links.
4. Add a second folder `uploads` served at `/files`.
5. Add `/api/hello` returning JSON and call it with `fetch` from `main.js`.
6. In DevTools, compare the first load (200) and second load (304) of `style.css`.
7. Place a file `secret.txt` **outside** `public` and confirm it cannot be requested.

### Challenge
Create a "gallery" page: put three images in `public/images`, write `index.html` that
shows them in a CSS grid. No Express routes allowed except `express.static`.

---

## 18. Quick Quiz

1. What does `express.static` return?
2. Why does `/` show `index.html` automatically?
3. Is the folder name part of the URL?
4. What happens when the file is not found?
5. Why is `express.static(__dirname)` dangerous?
6. What status code means "use your cached copy"?

<details><summary>Answers</summary>

1. A middleware function that serves files from the given folder.
2. The default `index` option looks for `index.html` in folders.
3. No (unless you mount with a prefix, and then only the prefix).
4. It calls `next()`, so later routes/404 handler run.
5. It exposes `.env`, source code and other private files.
6. `304 Not Modified`.
</details>

---

## 19. Summary

- Static files are served unchanged; `express.static(folder)` is the built-in way.
- Register it with `app.use(...)`; it handles GET/HEAD and falls through if not found.
- URL does not contain the folder name unless you mount with a prefix.
- Order of middleware decides which handler answers first.
- Only the intended public folder should be served; everything inside is public.
- Cache headers can hide your changes during development.

---

## 20. Next Lesson

➡️ **10 — Working with JSON**
Time to build our first API endpoints that return data instead of pages.
