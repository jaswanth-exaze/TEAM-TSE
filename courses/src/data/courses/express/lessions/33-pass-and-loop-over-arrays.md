# 33 — Pass and Loop Over Arrays

> **Goal:** Send arrays (like our list of posts) to EJS and render them with loops:
> `forEach`, `for`, `for...of`, `map`; handle empty lists, indexes, nested arrays,
> filtering and sorting, and build a posts page.

---

## 1. Why Loops in Templates?

Most pages show **lists**: posts, products, comments, users, menu items.

You do not want to write HTML for each item by hand:

```html
<li>Post One</li>
<li>Post Two</li>
<li>Post Three</li>
```

The number of items is unknown until runtime. A loop generates the HTML **once per
item**.

---

## 2. Prerequisite Concept: Array Iteration in JavaScript

```js
const skills = ['JS', 'SQL', 'Linux'];

// forEach (no return value)
skills.forEach((skill, index) => console.log(index, skill));

// for loop
for (let i = 0; i < skills.length; i++) console.log(skills[i]);

// for...of (values)
for (const skill of skills) console.log(skill);

// for...of with index using entries()
for (const [i, skill] of skills.entries()) console.log(i, skill);

// map (returns new array)
const upper = skills.map((s) => s.toUpperCase());

// filter and sort
skills.filter((s) => s.length > 2);
[...skills].sort();            // copy first, sort mutates!
```

For objects:

```js
const user = { name: 'Asha', city: 'Hyderabad' };
for (const key in user) console.log(key, user[key]);
for (const [key, value] of Object.entries(user)) console.log(key, value);
Object.keys(user);   Object.values(user);
```

EJS scriptlets accept **any** of these because they run real JavaScript.

---

## 3. Passing an Array From the Route

```js
// routes/pages.js (or server.js)
import * as Post from '../models/postModel.js';

app.get('/posts', (req, res) => {
  const posts = Post.findAll();           // [{ id: 1, title: 'Post One' }, ...]

  res.render('posts', {
    title: 'All Posts',
    posts,
  });
});
```

Arrays travel in the locals object like any other value.

---

## 4. Looping With `forEach`

### `views/posts.ejs`
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
    <h1><%= title %></h1>

    <ul class="post-list">
      <% posts.forEach(function (post) { %>
        <li>
          <a href="/posts/<%= post.id %>"><%= post.title %></a>
        </li>
      <% }); %>
    </ul>
  </main>
</body>
</html>
```

### How to read this
1. `<% posts.forEach(function (post) { %>` — opens the loop and the callback body.
2. HTML inside is repeated for each element; `<%= %>` prints that element's data.
3. `<% }); %>` — closes the callback and the `forEach` call (**note `)` and `;`**).

Arrow function version:

```html
<% posts.forEach((post) => { %>
  <li><%= post.title %></li>
<% }) %>
```

Rendered output:

```html
<ul class="post-list">
  <li><a href="/posts/1">Post One</a></li>
  <li><a href="/posts/2">Post Two</a></li>
  <li><a href="/posts/3">Post Three</a></li>
</ul>
```

---

## 5. Looping With a Classic `for`

```html
<% for (let i = 0; i < posts.length; i++) { %>
  <li><%= i + 1 %>. <%= posts[i].title %></li>
<% } %>
```

Use when you need full control of indexes, skipping, or reverse order:

```html
<% for (let i = posts.length - 1; i >= 0; i--) { %>
  <li><%= posts[i].title %></li>
<% } %>
```

## 6. `for...of`

```html
<% for (const post of posts) { %>
  <li><%= post.title %></li>
<% } %>
```

With index:

```html
<% for (const [i, post] of posts.entries()) { %>
  <li><%= i + 1 %>. <%= post.title %></li>
<% } %>
```

### Which style to choose?

| Style | When |
|-------|------|
| `forEach` | Simple, very common in EJS |
| `for...of` | Cleaner syntax; supports `break`/`continue` |
| classic `for` | Reverse loops, custom steps |
| `map` | When you want to build an array of strings (rare in EJS) |

`break` and `continue` do **not** work inside `forEach` callbacks (use `for...of`).

---

## 7. `map` and `join` (Compact but Less Readable)

```html
<ul>
  <%- posts.map((p) => `<li>${p.title}</li>`).join('') %>
</ul>
```

⚠️ This requires `<%-` (raw) and **bypasses escaping** — `p.title` is not escaped →
XSS risk. Prefer `forEach` with `<%= %>`.

---

## 8. Handling Empty Arrays

Always handle "no data":

```html
<% if (posts.length === 0) { %>
  <p class="empty">No posts yet. <a href="/posts/new">Create one</a>.</p>
<% } else { %>
  <ul>
    <% posts.forEach((post) => { %>
      <li><%= post.title %></li>
    <% }) %>
  </ul>
<% } %>
```

Also guard against `undefined`:

```html
<% const list = locals.posts || []; %>
```

Four states of every list UI: **loading** (client-side only), **empty**, **has data**,
**error**.

---

## 9. Index, First, Last, Odd/Even

```html
<% posts.forEach((post, index) => { %>
  <li class="<%= index % 2 === 0 ? 'even' : 'odd' %><%= index === 0 ? ' first' : '' %><%= index === posts.length - 1 ? ' last' : '' %>">
    <%= index + 1 %>. <%= post.title %>
  </li>
<% }) %>
```

---

## 10. Tables

```html
<table>
  <thead>
    <tr><th>#</th><th>ID</th><th>Title</th><th>Actions</th></tr>
  </thead>
  <tbody>
    <% posts.forEach((post, i) => { %>
      <tr>
        <td><%= i + 1 %></td>
        <td><%= post.id %></td>
        <td><%= post.title %></td>
        <td><a href="/posts/<%= post.id %>">View</a></td>
      </tr>
    <% }) %>
  </tbody>
</table>
```

CSS:

```css
table { width: 100%; border-collapse: collapse; background: #fff; }
th, td { padding: .6rem .8rem; border-bottom: 1px solid #e5e7eb; text-align: left; }
tbody tr:nth-child(even) { background: #f9fafb; }
```

---

## 11. Nested Loops and Nested Data

### Data
```js
const categories = [
  { name: 'JavaScript', topics: ['Closures', 'Promises', 'Modules'] },
  { name: 'Express', topics: ['Routing', 'Middleware'] },
];
res.render('courses', { categories });
```

### Template
```html
<% categories.forEach((cat) => { %>
  <section>
    <h2><%= cat.name %> (<%= cat.topics.length %>)</h2>
    <ul>
      <% cat.topics.forEach((topic) => { %>
        <li><%= topic %></li>
      <% }) %>
    </ul>
  </section>
<% }) %>
```

Use distinct variable names for nested loops (`cat`, `topic`) to avoid shadowing.

---

## 12. Filtering and Sorting: Do It in the Controller

You can filter inside the template:

```html
<% posts.filter((p) => p.published).forEach((p) => { %> ... <% }) %>
```

But better:

```js
app.get('/posts', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';

  const posts = Post.findAll()
    .filter((p) => p.title.toLowerCase().includes(search))
    .sort((a, b) => b.id - a.id);                 // newest first

  res.render('posts', { title: 'Posts', posts, search });
});
```

Display the search value back (escaped!):

```html
<form method="GET" action="/posts">
  <input name="search" value="<%= search %>" placeholder="Search posts" />
  <button>Search</button>
</form>
<p><%= posts.length %> result(s)<% if (search) { %> for “<%= search %>”<% } %></p>
```

---

## 13. Pagination in Views

Controller:

```js
const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
const limit = 5;
const all = Post.findAll();
const totalPages = Math.max(Math.ceil(all.length / limit), 1);
const posts = all.slice((page - 1) * limit, page * limit);

res.render('posts', { title: 'Posts', posts, page, totalPages });
```

View:

```html
<nav class="pagination">
  <% if (page > 1) { %><a href="/posts?page=<%= page - 1 %>">&laquo; Prev</a><% } %>

  <% for (let p = 1; p <= totalPages; p++) { %>
    <% if (p === page) { %>
      <strong><%= p %></strong>
    <% } else { %>
      <a href="/posts?page=<%= p %>"><%= p %></a>
    <% } %>
  <% } %>

  <% if (page < totalPages) { %><a href="/posts?page=<%= page + 1 %>">Next &raquo;</a><% } %>
</nav>
```

---

## 14. Looping Over Objects

```js
res.render('stats', { stats: { users: 120, posts: 45, comments: 310 } });
```

```html
<dl>
  <% Object.entries(stats).forEach(([label, value]) => { %>
    <dt><%= label %></dt>
    <dd><%= value %></dd>
  <% }) %>
</dl>
```

---

## 15. Including Delete Buttons in a Server-Rendered List

HTML forms can only POST. For deletion use a small POST route:

```html
<% posts.forEach((post) => { %>
  <li>
    <%= post.title %>
    <form action="/posts/<%= post.id %>/delete" method="POST" style="display:inline"
          onsubmit="return confirm('Delete this post?')">
      <button type="submit">Delete</button>
    </form>
  </li>
<% }) %>
```

```js
app.post('/posts/:id/delete', (req, res, next) => {
  const removed = Post.remove(Number(req.params.id));
  if (!removed) return next(new HttpError(404, 'Post not found'));
  res.redirect(303, '/posts');
});
```

(Authentication and CSRF tokens are required before using this in production.)

---

## 16. Performance Notes

- Rendering thousands of rows on the server blocks the single-threaded event loop for
  that time. **Paginate**.
- Don't query the database inside the template loop (the "N+1 query" problem): load all
  data in the controller first (e.g., with a SQL `JOIN`).
- Cache compiled templates in production (`NODE_ENV=production` does this).
- Avoid heavy logic in loops; precompute labels in the controller.

---

## 17. Security Notes 🔐

| Issue | Example | Defence |
|-------|---------|---------|
| XSS from list items | `post.title` contains `<img onerror=...>` | `<%= %>` for every item |
| Raw output in loops | `<%- post.body %>` | Only with sanitized HTML |
| Unvalidated link targets | `<a href="<%= post.url %>">` | Allow only `http/https` |
| Over-exposed fields | Passing full user objects | Map to safe fields before rendering |
| Large lists | DoS by `?limit=1000000` | Cap page size |
| IDs in URLs | `/posts/<%= post.id %>/delete` via GET | Use POST/DELETE + CSRF protection |

Safe mapping in controller:

```js
const safeUsers = users.map(({ id, name }) => ({ id, name }));   // no email, no password hash
res.render('users', { users: safeUsers });
```

---

## 18. Complete Example

### Route
```js
// server.js or routes/pages.js
app.get('/posts', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const term = search.toLowerCase();

  const posts = Post.findAll()
    .filter((p) => p.title.toLowerCase().includes(term))
    .sort((a, b) => b.id - a.id);

  res.render('posts', { title: 'All Posts', posts, search });
});
```

### `views/posts.ejs`
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
    <h1><%= title %></h1>

    <form method="GET" action="/posts" class="toolbar">
      <input name="search" value="<%= search %>" placeholder="Search…" />
      <button>Search</button>
    </form>

    <% if (posts.length === 0) { %>
      <p class="empty">No posts found.</p>
    <% } else { %>
      <p><%= posts.length %> post(s)</p>
      <ul class="post-list">
        <% posts.forEach((post, i) => { %>
          <li class="<%= i % 2 ? 'odd' : 'even' %>">
            <a href="/posts/<%= post.id %>"><%= post.title %></a>
          </li>
        <% }) %>
      </ul>
    <% } %>
  </main>
</body>
</html>
```

---

## 19. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Missing `}); ` at the end of `forEach` | `SyntaxError: Unexpected token` | Close with `<% }) %>` |
| Using `<%` instead of `<%=` for output | Nothing printed | Use `<%=` for printing |
| Using `<%=` for control code | Prints `undefined`/syntax error | Use `<% %>` |
| `posts` undefined | `ReferenceError` | Pass it; default `[]` |
| Mutating the source array with `sort` | Order changes globally | `[...posts].sort()` |
| Same variable name in nested loops | Wrong values | Distinct names |
| `break` inside `forEach` | SyntaxError | Use `for...of` |
| Using `async` callback in `forEach` | Unexpected behavior | Prepare data in controller |
| Printing an object | `[object Object]` | Print properties |
| Forgetting empty state | Blank page | `if (posts.length === 0)` |

---

## 20. Exercises

1. Render the posts list from the model with `forEach`.
2. Add an "empty" message and test by deleting all posts.
3. Render the same list as a table with row numbers.
4. Add a search box that filters posts (server side) and shows result count.
5. Add pagination with Prev / page numbers / Next.
6. Render nested categories → topics.
7. Add `odd` / `even` row classes and highlight the first and last item.
8. Add Delete buttons using POST forms and the PRG pattern.
9. Test XSS: create a post titled `<script>alert(1)</script>` and confirm it displays as text.

### Challenge
Group posts by their first letter: controller builds
`{ A: [...], B: [...] }`; the view renders a heading per letter (sorted) and its posts
using `Object.keys(groups).sort().forEach(...)`.

<details><summary>Hint</summary>

```js
const groups = posts.reduce((acc, p) => {
  const key = p.title[0].toUpperCase();
  (acc[key] ||= []).push(p);
  return acc;
}, {});
res.render('grouped', { groups });
```
</details>

---

## 21. Quick Quiz

1. How do you pass an array to a template?
2. Which tag opens a `forEach` loop?
3. Why is `map(...).join('')` with `<%-` risky?
4. How can you get the index inside `forEach`?
5. Why prepare/filter data in the controller instead of the view?
6. What happens to `break` inside `forEach`?
7. How do you loop over an object's entries?
8. Why paginate?

<details><summary>Answers</summary>

1. Include it in the locals object of `res.render`.
2. `<% posts.forEach((post) => { %>` (scriptlet, no output).
3. Raw output skips escaping → XSS.
4. Second callback parameter: `(post, index)`.
5. Keeps views simple, easier testing and reuse.
6. It is a syntax error; use `for...of` instead.
7. `Object.entries(obj).forEach(([key, value]) => ...)`.
8. Limits work, response size and DoS risk.
</details>

---

## 22. Summary

- Arrays are passed in the locals object and iterated with JavaScript loops inside
  scriptlet tags.
- `forEach` is the common choice; `for...of` allows `break`; use indexes for numbering.
- Always handle the empty state and missing variables.
- Filter, sort, paginate and map to safe fields in the **controller**.
- Use `<%= %>` for every item field to stay safe from XSS.

---

## 23. Next Lesson

➡️ **34 — Template Partials**
Reuse headers, footers and navigation across all pages with `include`.
