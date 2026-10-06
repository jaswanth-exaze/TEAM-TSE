# 10 — Working with JSON

> **Goal:** Build API endpoints that return JSON, understand `res.json()` vs
> `res.send()`, and create the in-memory `posts` data we use for the next lessons.

---

## 1. What Is an API?

**API = Application Programming Interface.** In web development, a *web API* is a set of
URLs that return **data** (usually JSON) rather than pages for humans.

```
HTML page:   GET /about      -> <html>...</html>   (for people)
Web API:     GET /api/posts  -> [{"id":1,...}]     (for programs)
```

Who calls an API?
- A JavaScript front-end (`fetch`)
- A mobile app
- Another server
- Tools like Postman / curl

---

## 2. Prerequisite Concept: JSON Refresher

JSON is a text format for structured data.

```json
{
  "id": 1,
  "title": "Post One",
  "published": true,
  "tags": ["node", "express"],
  "author": { "name": "Asha" },
  "views": null
}
```

| JSON type | JavaScript equivalent |
|-----------|-----------------------|
| object `{}` | object |
| array `[]` | array |
| string `"x"` | string |
| number | number |
| true / false | boolean |
| null | null |

Not allowed in JSON: `undefined`, functions, comments, single quotes, trailing commas,
`Date` objects (they become strings), `NaN`.

### Conversion functions
```js
const obj = { a: 1, d: new Date(0) };
const text = JSON.stringify(obj);       // '{"a":1,"d":"1970-01-01T00:00:00.000Z"}'
const back = JSON.parse(text);          // { a: 1, d: '1970-01-01T00:00:00.000Z' }

JSON.stringify(obj, null, 2);           // pretty printed with 2 spaces
```

---

## 3. Sending JSON — The Hard Way (plain Node)

```js
res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ message: 'Hi' }));
```

## 4. Sending JSON — The Express Way

```js
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hi' });
});
```

`res.json()` does three things:
1. `JSON.stringify` the value.
2. Sets `Content-Type: application/json; charset=utf-8`.
3. Sends the response.

Why `Content-Type` matters: it tells the receiver how to interpret bytes. A browser
extension, Postman, or `fetch(...).json()` rely on it.

---

## 5. `res.send()` vs `res.json()`

```js
res.send({ a: 1 });     // object -> internally calls res.json
res.send([1, 2]);       // array  -> JSON
res.send('text');       // string -> text/html
res.json('text');       // JSON string: "text" (with quotes!)
res.json(null);         // null
```

| Situation | Prefer |
|-----------|--------|
| Returning data from an API | `res.json()` (explicit, clearer) |
| Returning HTML or plain text | `res.send()` |
| Returning `null`/primitive JSON | `res.json()` |

Being explicit helps teammates and prevents surprises.

---

## 6. Creating the Sample Data

At the top of `server.js` (below `const app = express();`):

```js
let posts = [
  { id: 1, title: 'Post One', body: 'Content of post one' },
  { id: 2, title: 'Post Two', body: 'Content of post two' },
  { id: 3, title: 'Post Three', body: 'Content of post three' },
];
```

`let` (not `const`) because later lessons will replace/modify the array.
This is our fake database. When the server restarts, it resets.

---

## 7. Endpoint 1 — Get All Posts

```js
app.get('/api/posts', (req, res) => {
  res.json(posts);
});
```

Open `http://localhost:5000/api/posts` — you should see:

```json
[
  { "id": 1, "title": "Post One", "body": "Content of post one" },
  { "id": 2, "title": "Post Two", "body": "Content of post two" },
  { "id": 3, "title": "Post Three", "body": "Content of post three" }
]
```

(Chrome shows it raw; Firefox has a nice JSON viewer; Postman pretty-prints it.)

---

## 8. Why `/api/...`?

A convention to separate **data routes** from **page routes**.

```
/             -> page
/about        -> page
/api/posts    -> data
/api/users    -> data
```

Benefits:
- Easy to apply middleware only to `/api` (auth, CORS, rate limit).
- Clear for front-end developers.
- Lets you version later: `/api/v1/posts`.

---

## 9. Naming Endpoints — REST Basics

REST (Representational State Transfer) is a style: **URLs are nouns, methods are verbs.**

| Do ✅ | Don't ❌ |
|-------|----------|
| `GET /api/posts` | `GET /api/getAllPosts` |
| `POST /api/posts` | `POST /api/createPost` |
| `DELETE /api/posts/5` | `GET /api/deletePost?id=5` |

- Use **plural nouns**: `posts`, `users`, `products`.
- Use the **HTTP method** to say what to do.
- Use `/:id` to point to a single item.

---

## 10. Working with Nested Data

```js
let users = [
  {
    id: 1,
    name: 'Asha',
    skills: ['js', 'sql'],
    address: { city: 'Hyderabad', country: 'India' },
  },
];

app.get('/api/users', (req, res) => {
  res.json(users);
});
```

The nested object and array are converted automatically.

---

## 11. Returning a Wrapped Response

Many APIs wrap data in an object:

```js
app.get('/api/posts', (req, res) => {
  res.json({
    success: true,
    count: posts.length,
    data: posts,
  });
});
```

Benefits: room for metadata (pagination, messages). Drawback: slightly more verbose.
Pick one style and keep it **consistent across the whole API**.

---

## 12. Controlling JSON Output

### Pretty printing (development only)
```js
app.set('json spaces', 2);
```

### Hide properties on an object
```js
const user = { id: 1, name: 'Asha', password: 'hash...' };
res.json({ id: user.id, name: user.name });  // choose fields explicitly
```

> 🔐 **Security:** Never send entire database rows blindly. Fields like `password`,
> `passwordHash`, tokens, internal IDs or emails of other users can leak. Always return
> only the fields the client needs ("data minimization").

### `toJSON()` customization
```js
class User {
  constructor(id, name, password) { this.id = id; this.name = name; this.password = password; }
  toJSON() { return { id: this.id, name: this.name }; }
}
res.json(new User(1, 'Asha', 'secret'));  // password omitted
```

---

## 13. `res.jsonp` and Other JSON-ish Methods

| Method | Meaning |
|--------|---------|
| `res.json(obj)` | Standard JSON |
| `res.jsonp(obj)` | JSONP (old cross-domain technique; avoid) |
| `res.type('json').send(str)` | Send a pre-made JSON string |

---

## 14. Reading a JSON File and Sending It

You know `fs` from Node basics.

```js
const fs = require('fs');
const path = require('path');

app.get('/api/products', (req, res) => {
  const file = path.join(__dirname, 'data', 'products.json');
  fs.readFile(file, 'utf8', (err, text) => {
    if (err) return res.status(500).json({ error: 'Cannot read data' });
    res.json(JSON.parse(text));
  });
});
```

Async/await version:

```js
const fsp = require('fs/promises');

app.get('/api/products', async (req, res) => {
  try {
    const text = await fsp.readFile(path.join(__dirname, 'data', 'products.json'), 'utf8');
    res.json(JSON.parse(text));
  } catch (err) {
    res.status(500).json({ error: 'Cannot read data' });
  }
});
```

Even simpler (CommonJS only): `const products = require('./data/products.json');`
— but note `require` caches the file, so changes need a restart.

---

## 15. Consuming JSON in the Browser

`public/main.js`:

```js
async function loadPosts() {
  const response = await fetch('/api/posts');
  const posts = await response.json();

  const list = document.getElementById('list');
  list.innerHTML = '';
  posts.forEach((p) => {
    const li = document.createElement('li');
    li.textContent = `${p.id}. ${p.title}`;
    list.appendChild(li);
  });
}

loadPosts();
```

`index.html` needs `<ul id="list"></ul>` and `<script src="/main.js"></script>`.

We use `textContent` (not `innerHTML` with data) to avoid **XSS** (Cross-Site Scripting):
if a post title contained `<script>`, `innerHTML` would execute it.

---

## 16. A Note on CORS (Preview)

If your HTML page is on one origin (`http://localhost:5000`) and calls an API on another
(`http://localhost:4000`), the browser blocks it unless the API sends CORS headers.
When the page and API are served by the same Express app (as here), no CORS issue
occurs. Later you will use the `cors` package.

---

## 17. Full Code So Far

```js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

let posts = [
  { id: 1, title: 'Post One', body: 'Content of post one' },
  { id: 2, title: 'Post Two', body: 'Content of post two' },
  { id: 3, title: 'Post Three', body: 'Content of post three' },
];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 18. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Sending JSON with `res.send(JSON.stringify(x))` | Content-Type `text/html` | Use `res.json(x)` |
| Calling `res.json` twice | "Cannot set headers after they are sent" | One response only |
| Returning `undefined` | Empty body | Return `null` or an object |
| Using single quotes in a `.json` file | Parse error | Use double quotes |
| Trailing comma in `.json` | `Unexpected token` | Remove it |
| Sending password fields | Data leak | Whitelist fields |
| Circular object | `Converting circular structure to JSON` | Remove cycles |

---

## 19. Exercises

1. Add the `posts` array and `GET /api/posts`.
2. Add `GET /api/users` returning two users with nested objects.
3. Add `GET /api/status` returning `{ ok: true, uptime: process.uptime() }`.
4. Set `app.set('json spaces', 2)` and compare the output.
5. Create `data/products.json` and serve it using `fs/promises`.
6. In `main.js` fetch `/api/posts` and render a list on the home page.
7. Build `GET /api/health` returning `{ status: 'ok', time: <ISO date> }`.

### Challenge
Return posts wrapped as `{ success, count, data }`, and add a separate endpoint
`/api/posts/titles` that returns only an array of titles (use `map`).

<details><summary>Solution</summary>

```js
app.get('/api/posts/titles', (req, res) => {
  res.json(posts.map((p) => p.title));
});
```
(Place it **before** `/api/posts/:id` in later lessons so `titles` is not treated as an id.)
</details>

---

## 20. Quick Quiz

1. What does `res.json()` set as Content-Type?
2. What is the difference between `JSON.parse` and `JSON.stringify`?
3. Name two values that cannot be represented in JSON.
4. Why use `/api` prefix?
5. Why should you avoid sending entire database records?
6. What does REST say about URLs and methods?

<details><summary>Answers</summary>

1. `application/json; charset=utf-8`.
2. `parse` text→object; `stringify` object→text.
3. `undefined`, functions (also comments, `NaN`, `Date` objects as such).
4. Separate data routes from page routes.
5. Sensitive fields may leak.
6. URLs are nouns (resources); methods are verbs (actions).
</details>

---

## 21. Summary

- APIs return data, usually JSON.
- `res.json()` stringifies and sets the correct header.
- Keep sample data in an array to focus on Express.
- Use plural-noun URLs under `/api`; let the HTTP method express the action.
- Return only needed fields; be consistent in response shape.
- Use `textContent` when rendering API data in the browser.

---

## 22. Next Lesson

➡️ **11 — Postman Utility**
A tool to send any request (POST, PUT, DELETE) and inspect responses.
