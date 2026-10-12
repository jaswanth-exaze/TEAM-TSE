# 31 — EJS Template Engine Setup

> **Goal:** Understand what a template engine is, install and configure **EJS** in
> Express, create the `views` folder, and render your first dynamic page with
> `res.render()`.

---

## 1. The Problem With Plain HTML

Static HTML (`public/index.html`) is **the same for every visitor**. But real sites need
pages that change:

- "Welcome back, Asha" (user-specific)
- A list of 25 posts from the database
- A product page for each of 10,000 products
- Different content depending on login status

Options:

1. **Client-side rendering:** send JSON, build HTML in the browser (lesson 29).
2. **Server-side rendering (SSR):** build the HTML **on the server** and send finished
   pages. A **template engine** makes this easy.

Why SSR? Faster first paint, works without JavaScript, good for SEO, simpler for
content sites and admin dashboards.

---

## 2. Prerequisite Concept: What Is a Template Engine?

A **template** is an HTML file with **placeholders** and small bits of logic. The
**engine** merges the template with **data** to produce final HTML.

```
Template (views/hello.ejs)         Data                      Result (HTML sent to browser)
-------------------------          --------------            ---------------------------
<h1>Hello, <%= name %>!</h1>   +   { name: 'Asha' }     →    <h1>Hello, Asha!</h1>
```

Similar to string templates you know:

```js
const name = 'Asha';
const html = `<h1>Hello, ${name}!</h1>`;
```

but with real files, loops, conditions, includes (partials), and **automatic HTML
escaping**.

### Popular engines

| Engine | Style | Notes |
|--------|-------|-------|
| **EJS** | HTML + `<% %>` JavaScript tags | Easiest if you know JS (this course) |
| Pug | Indentation-based shorthand | Different syntax from HTML |
| Handlebars / Mustache | `{{ }}` logic-less | Simple, separation of logic |
| Nunjucks | Jinja-like | Powerful inheritance |

EJS = **E**mbedded **J**ava**S**cript templates.

---

## 3. Step 1 — Install EJS

```bash
npm install ejs
```

It appears in `package.json` under `dependencies`.

---

## 4. Step 2 — Configure Express

```js
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'ejs');                         // use EJS for .ejs files
app.set('views', path.join(__dirname, 'views'));       // where templates live
```

### `app.set(name, value)` — application settings
Express has a settings table. Two important ones here:

| Setting | Meaning | Default |
|---------|---------|---------|
| `view engine` | Default template engine / extension | none |
| `views` | Folder(s) containing templates | `process.cwd() + '/views'` |

Because the default `views` path depends on the cwd, set it explicitly with `__dirname`
(lesson 28).

With `view engine` set, you can write `res.render('index')` instead of
`res.render('index.ejs')`. Express `require`s the `ejs` package automatically.

---

## 5. Step 3 — Create the `views` Folder and First Template

```
express-crash-course/
├── server.js
├── views/
│   └── index.ejs
└── public/
```

### `views/index.ejs`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EJS Home</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <main class="container">
    <h1>Hello from EJS</h1>
    <p>This HTML was generated on the server.</p>
  </main>
</body>
</html>
```

A `.ejs` file with no tags is just HTML. Tags come next lesson.

---

## 6. Step 4 — Render It

```js
app.get('/', (req, res) => {
  res.render('index');
});
```

### `res.render(view, [locals], [callback])`

| Argument | Meaning |
|----------|---------|
| `view` | Template name relative to `views` (without extension) |
| `locals` | Object of data available inside the template |
| `callback` | Optional `(err, html)`; if given, Express does **not** send automatically |

What happens:

1. Express finds `views/index.ejs`.
2. EJS compiles the template into a JavaScript function.
3. EJS runs it with your data → HTML string.
4. Express sends it with `Content-Type: text/html`.

Visit `http://localhost:5000/` — you see the rendered page. **View source** (Ctrl+U): it
is plain HTML; the browser never sees EJS.

---

## 7. `res.render` vs `res.sendFile` vs `res.send`

| Method | Use |
|--------|-----|
| `res.sendFile` | Send an unmodified file |
| `res.send` | Send a string/object you built manually |
| `res.render` | Compile a template with data and send the HTML |
| `res.json` | Send JSON for programmatic clients |

---

## 8. Setup Variations

### Multiple view folders
```js
app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'admin-views')]);
```

### Different extension
Using `.html` templates with EJS:

```js
import ejs from 'ejs';
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
```

### View caching
In production (`NODE_ENV=production`) Express caches compiled templates
(`app.enable('view cache')`). In development they are re-read on each request, so
changing a `.ejs` file shows up on refresh **without restarting** the server
(`--watch` does not watch `.ejs` unless you add `--watch-path=./views`, but you don't need
to restart anyway).

### Global data for all templates: `app.locals`
```js
app.locals.siteName = 'My Express Site';
app.locals.year = new Date().getFullYear();
```
Available in every template as `siteName`, `year`.

### Per-request data: `res.locals`
```js
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = null;               // later: logged-in user
  next();
});
```
Also available in templates. Great for navigation highlighting and auth state.

Merge order (later wins): `app.locals` < `res.locals` < the object passed to `res.render`.

---

## 9. Mixing Pages (EJS) and API (JSON)

```js
// Pages (HTML via EJS)
app.get('/', (req, res) => res.render('index'));
app.get('/posts', (req, res) => res.render('posts'));

// API (JSON)
app.use('/api/posts', postsRouter);

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
```

Keep page routes and API routes separate, e.g., `routes/pages.js` and `routes/api/posts.js`.

Order reminder: static → pages/API routers → `notFound` → `errorHandler`.

---

## 10. Where to Put What

```
views/                     templates (server-only, NOT public)
public/                    static assets (CSS, JS, images) — public
```

**Never** place views inside `public/`: anyone could download your raw templates.
(They don't reveal secrets unless you put some in, but they expose structure.)

Recommended views layout:

```
views/
├── index.ejs
├── about.ejs
├── posts.ejs
├── 404.ejs
├── error.ejs
└── partials/
    ├── header.ejs
    └── footer.ejs        (lesson 34)
```

---

## 11. A Branded 404 and Error Page With EJS

```js
// middleware/notFound.js
export const notFound = (req, res, next) => {
  if (req.accepts(['html', 'json']) === 'html') {
    return res.status(404).render('404', { url: req.originalUrl });
  }
  next(new HttpError(404, 'Route not found'));
};
```

`views/404.ejs`:

```html
<h1>404 — Page not found</h1>
<p>We could not find <code><%= url %></code>.</p>
<a href="/">Go home</a>
```

(`<%= %>` escapes the URL, preventing reflected XSS — next lesson explains.)

---

## 12. Error Handling in Rendering

If the template has a syntax error or references a missing variable, `res.render`
throws:

```
ReferenceError: /app/views/index.ejs:12
   title is not defined
```

- Express forwards the error to your error handler.
- Read the message: it shows the **template file and line**.
- Avoid by always passing the variables the template uses, or by using `locals.title`
  (undefined instead of error — see lesson 32).

Custom callback form:

```js
res.render('index', { title: 'Home' }, (err, html) => {
  if (err) return next(err);
  res.send(html);
});
```

---

## 13. Security Notes 🔐

| Topic | Guidance |
|-------|----------|
| **Output escaping** | EJS `<%= %>` escapes HTML; `<%- %>` does **not**. Use `<%-` only with trusted HTML |
| **Template injection (SSTI)** | Never build the template *string* from user input or pass user-controlled `view` names to `res.render` (`res.render(req.query.page)` → can load arbitrary templates; known EJS RCE issues arise from passing user-controlled **options** such as `req.query` into render) |
| **Passing `req.query`/`req.body` as options** | Never do `res.render('x', req.query)`; older EJS versions allowed option injection leading to remote code execution. Pass only chosen fields |
| **Keep EJS updated** | Run `npm audit`; template engines have had critical CVEs |
| **Sensitive data in templates** | Don't pass entire DB objects (password hashes) — pass only fields needed |
| **Views location** | Not inside `public/` |
| **CSP headers** | Use `helmet` to restrict inline scripts |

Bad:

```js
res.render('profile', req.body);        // ❌ attacker controls render options/locals
res.render(req.params.page);            // ❌ attacker chooses template
```

Good:

```js
const allowed = new Set(['about', 'contact']);
if (!allowed.has(req.params.page)) return next();
res.render(req.params.page, { title: req.params.page });
```

---

## 14. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting `app.set('view engine', 'ejs')` | `No default engine was specified and no extension was provided` | Set it or write `index.ejs` |
| `ejs` not installed | `Cannot find module 'ejs'` | `npm install ejs` |
| Wrong `views` path | `Failed to lookup view "index" in views directory ...` | Set with `path.join(__dirname, 'views')` |
| Template file in wrong folder | Same lookup error | Move to `views/` |
| Using `res.sendFile` for an `.ejs` file | Raw tags shown to the browser | Use `res.render` |
| Setting view engine **after** routes? | Usually fine, but set before rendering | Put config near the top |
| Case mismatch (`Index.ejs`) on Linux | Not found | Match file name case |
| Editing `.ejs` and seeing old HTML in production | View cache enabled | Restart or disable cache for dev |
| Putting views in `public` | Exposes templates | Use `views/` |
| Passing user input as render options | Security issue | Whitelist data |

---

## 15. Complete Example

### `server.js`
```js
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import posts from './routes/posts.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.siteName = 'Express Crash Course';

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// pages
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));

// api
app.use('/api/posts', posts);

// errors
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### `views/index.ejs`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Home</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <main class="container">
    <h1>Hello from EJS</h1>
    <p>Rendered on the server.</p>
    <a href="/about">About</a>
  </main>
</body>
</html>
```

### `views/about.ejs`
```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>About</title><link rel="stylesheet" href="/style.css" /></head>
<body>
  <main class="container">
    <h1>About</h1>
    <a href="/">Home</a>
  </main>
</body>
</html>
```

---

## 16. Debugging Checklist

1. Is `ejs` listed in `package.json`?
2. Is `view engine` set and does the file end with `.ejs`?
3. Does `views` point to the correct absolute path? (`console.log(app.get('views'))`)
4. Does the file exist with the exact name and case?
5. Did you call `res.render` (not `sendFile`)?
6. Check the terminal for the template error line number.
7. View page source in the browser to confirm what was actually sent.

---

## 17. Exercises

1. Install EJS and render `index.ejs` at `/`.
2. Create `about.ejs` and `contact.ejs` with their routes.
3. Print `app.get('views')` and `app.get('view engine')` in the console.
4. Set `app.locals.siteName` and read it in a template with `<%= siteName %>` (try ahead).
5. Remove `app.set('view engine', ...)` and read the error; fix it.
6. Rename the folder to `templates` and update the `views` setting.
7. Make a branded 404 page rendered for HTML requests and JSON for API clients.
8. View page source and confirm no EJS tags remain.

### Challenge
Create a route `/page/:name` that renders `views/pages/<name>.ejs` only for names in a
whitelist (`about`, `contact`, `faq`) and returns 404 otherwise — without any path
traversal risk.

---

## 18. Quick Quiz

1. What is a template engine?
2. Which two `app.set` settings configure EJS?
3. What does `res.render('index')` do?
4. Why set `views` with `__dirname`?
5. Difference between `app.locals` and `res.locals`?
6. Why must views not be in `public/`?
7. Why is `res.render('page', req.body)` dangerous?

<details><summary>Answers</summary>

1. Software that merges templates with data to produce HTML.
2. `view engine` and `views`.
3. Renders `views/index.ejs` and sends the HTML.
4. Default path depends on the current working directory.
5. `app.locals` = global to the app; `res.locals` = per request.
6. Static folder files are publicly downloadable.
7. User controls locals/options → injection risks.
</details>

---

## 19. Summary

- Template engines generate HTML from templates + data on the server.
- Install `ejs`, then `app.set('view engine', 'ejs')` and `app.set('views', ...)`.
- `res.render('name', data)` compiles `views/name.ejs` and sends HTML.
- `app.locals` / `res.locals` supply global and per-request data.
- Keep views outside `public/`, whitelist render inputs, and keep EJS updated.

---

## 20. Next Lesson

➡️ **32 — Pass Data to Views**
Use EJS tags to display variables, conditions and expressions.
