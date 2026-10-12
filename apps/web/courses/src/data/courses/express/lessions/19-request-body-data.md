# 19 — Request Body Data

> **Goal:** Understand what the request body is, why Express needs body-parsing
> middleware, and how `express.json()` and `express.urlencoded()` fill `req.body`.

---

## 1. Why Do We Need a Body?

So far clients sent information through:

- the **URL path** (`/posts/5`) and
- the **query string** (`?limit=3`).

But URLs are limited:
- They are short (browsers/servers limit length ~2–8 KB).
- They are visible in logs and browser history.
- They cannot cleanly carry large or structured data (nested objects, long text, files).

To **create** or **update** resources (a new post with title + body text, a user with a
password), clients put data in the **request body** — the part after the headers.

```
POST /api/posts HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Content-Length: 41

{"title":"New Post","body":"Hello world"}
 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                request body
```

Which methods have bodies? Typically **POST, PUT, PATCH**. (GET and DELETE normally
do not.)

---

## 2. Prerequisite Concept: The `Content-Type` Header

The body is just bytes. The `Content-Type` header says **how to interpret** them.

| Content-Type | Body looks like | Typical source |
|--------------|-----------------|----------------|
| `application/json` | `{"title":"x"}` | `fetch` with JSON, Postman raw JSON, mobile apps |
| `application/x-www-form-urlencoded` | `title=x&body=y` | Plain HTML `<form>` |
| `multipart/form-data` | boundary-separated parts | Forms with file upload |
| `text/plain` | any text | Rare |
| `application/octet-stream` | raw bytes | Binary uploads |

Express must use a **parser** that matches the Content-Type.

---

## 3. Prerequisite Concept: Streams (Why the Body Is Not Ready Immediately)

In plain Node, the request is a **stream** — the body arrives in **chunks**:

```js
// Plain Node (what Express hides from you)
let data = '';
req.on('data', (chunk) => { data += chunk; });
req.on('end', () => {
  const obj = JSON.parse(data);
  console.log(obj);
});
```

You must collect chunks, wait for `end`, then parse. That is tedious and easy to get
wrong. **Body-parsing middleware** does it for you and puts the result into
`req.body`.

---

## 4. The Default: `req.body` Is `undefined`

```js
app.post('/api/posts', (req, res) => {
  console.log(req.body);      // undefined (Express 5) — no parser installed!
  res.send('ok');
});
```

(Express 4 with older setup gave `undefined` as well; Express 5 returns `undefined`
until a parser sets it.)

This is the #1 beginner bug: **"My req.body is undefined!"** — you forgot the middleware.

---

## 5. `express.json()` — Parse JSON Bodies

```js
import express from 'express';
const app = express();

app.use(express.json());      // ← must be BEFORE the routes that need it

app.post('/api/posts', (req, res) => {
  console.log(req.body);      // { title: 'New Post', body: 'Hello world' }
  res.json(req.body);
});
```

What it does:
1. Checks `Content-Type` is `application/json`.
2. Collects the stream, `JSON.parse`s it.
3. Sets `req.body` to the resulting object.
4. Calls `next()`.

If the Content-Type is different, it **skips** and leaves `req.body` untouched.

If the JSON is invalid, it triggers an error with status **400** (`SyntaxError`).

---

## 6. `express.urlencoded()` — Parse HTML Form Bodies

A normal HTML form:

```html
<form action="/api/posts" method="POST">
  <input name="title" />
  <input name="body" />
  <button>Send</button>
</form>
```

Browser sends:

```
POST /api/posts
Content-Type: application/x-www-form-urlencoded

title=My+Title&body=Some+text
```

Parser:

```js
app.use(express.urlencoded({ extended: true }));
```

| `extended` | Library | Supports |
|------------|---------|----------|
| `false` | `querystring` | Flat key=value only |
| `true` | `qs` | Nested objects/arrays: `user[name]=Asha` |

Result: `req.body = { title: 'My Title', body: 'Some text' }`.
Values are **strings**.

---

## 7. Usually You Add Both

```js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

Order matters: **before** your routers.

```js
// ✅ correct order
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/posts', posts);

// ❌ wrong: router is registered before the parser
app.use('/api/posts', posts);
app.use(express.json());
```

In the wrong order, requests hit the router first, where `req.body` is still undefined.

---

## 8. Other Built-in Parsers

| Middleware | Content-Type | Result |
|------------|--------------|--------|
| `express.json()` | `application/json` | Object in `req.body` |
| `express.urlencoded()` | `application/x-www-form-urlencoded` | Object |
| `express.text()` | `text/plain` | String |
| `express.raw()` | `application/octet-stream` | Buffer |

For `multipart/form-data` (file uploads) use `multer` or `busboy`.

---

## 9. Options and Limits 🔐

```js
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

Default limit is **100kb**. Bigger bodies → **413 Payload Too Large**.

Why set limits? Attackers can send gigantic bodies to exhaust memory or CPU. Use the
smallest limit your app needs (bigger only on specific upload routes).

Other `express.json` options:

| Option | Meaning |
|--------|---------|
| `limit` | Max body size |
| `strict` | Accept only objects and arrays at top level (default true) |
| `type` | Which content types to parse |
| `verify` | Function to check raw body (e.g., webhook signatures) |

---

## 10. Reading and Using `req.body`

```js
app.post('/api/echo', (req, res) => {
  const { name, age } = req.body;
  res.json({ message: `Hello ${name}, you are ${age}` });
});
```

Test in Postman: POST `/api/echo`, Body → raw → JSON:

```json
{ "name": "Asha", "age": 22 }
```

Response:

```json
{ "message": "Hello Asha, you are 22" }
```

### Safe destructuring when body may be missing
```js
const { name, age } = req.body ?? {};
```
(`??` gives `{}` if `req.body` is `undefined`/`null`, avoiding a crash.)

---

## 11. Data Types: JSON vs Forms

| | JSON body | Form body |
|--|-----------|-----------|
| `age: 22` | number `22` | string `'22'` |
| `active: true` | boolean | string `'on'` (checkbox) or missing |
| Nested object | ✅ | needs `extended: true` |
| Arrays | ✅ | repeated keys |

Always **convert and validate** form values.

---

## 12. Validating the Body 🔐

Never trust `req.body`.

```js
app.post('/api/posts', (req, res) => {
  const { title, body } = req.body ?? {};

  if (typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ message: 'title must be a string with at least 3 characters' });
  }
  if (body !== undefined && typeof body !== 'string') {
    return res.status(400).json({ message: 'body must be a string' });
  }

  // ...create post
});
```

Security issues related to bodies:

| Risk | Description | Defence |
|------|-------------|---------|
| Missing fields | Crashes / bad data | Validate presence |
| Wrong types | `title: {"$gt": ""}` (NoSQL injection), arrays instead of strings | Check `typeof` |
| Mass assignment | `Object.assign(user, req.body)` lets attacker set `isAdmin: true` | **Pick** allowed fields explicitly |
| Prototype pollution | Body with `__proto__` key merged into objects | Avoid deep-merge of untrusted data; use libraries that block it |
| Oversized payloads | DoS | `limit` option |
| XSS | Storing `<script>` and later printing unescaped | Escape output; sanitize if HTML allowed |
| SQL injection | String-concatenated queries | Parameterized queries |

**Mass assignment example (bad):**

```js
const user = { id: 1, name: 'A', isAdmin: false };
Object.assign(user, req.body);      // attacker sends { "isAdmin": true }
```

**Good:**

```js
const { name } = req.body;
user.name = name;
```

For serious projects use schema validation libraries: **zod**, **joi**, **express-validator**.

---

## 13. Handling Invalid JSON

If a client sends broken JSON:

```
{"title": "x",}
```

`express.json()` throws → Express default error handler → HTML page with stack trace in
development. For APIs return clean JSON using an error middleware (lesson 24):

```js
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON' });
  }
  next(err);
});
```

---

## 14. Debugging `req.body` Problems

| Symptom | Cause | Fix |
|---------|-------|-----|
| `req.body` is `undefined` | No parser or wrong order | Add `express.json()` before routes |
| `req.body` is `{}` | Content-Type does not match the parser | Postman: raw → JSON; fetch: set header |
| Form fields missing | `<input>` has no `name` attribute | Add `name` |
| Numbers are strings | Form data | Convert |
| 413 error | Body above limit | Raise limit carefully |
| 400 "Unexpected token" | Invalid JSON | Fix JSON, use Postman Beautify |

### fetch: must set the header and stringify
```js
fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Hi', body: 'There' }),
});
```
If you forget `headers`, the browser sends `text/plain` and `express.json()` ignores it.

---

## 15. Putting It Together

```js
import express from 'express';
import posts from './routes/posts.js';

const app = express();
const PORT = process.env.PORT || 5000;

// body parsers (must come before routes)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.post('/api/echo', (req, res) => {
  res.json({
    contentType: req.get('Content-Type'),
    received: req.body ?? null,
  });
});

app.use('/api/posts', posts);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Try sending the same data three ways (JSON via Postman, form via browser, `curl -d`):

```bash
curl -X POST http://localhost:5000/api/echo \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha"}'

curl -X POST http://localhost:5000/api/echo \
  -d "name=Asha&age=22"
```
(`curl -d` without a header sends `application/x-www-form-urlencoded`.)

---

## 16. Useful Request Helpers

| Property / method | Meaning |
|-------------------|---------|
| `req.body` | Parsed body |
| `req.get('Content-Type')` | Read a request header |
| `req.is('json')` | Check if content type matches |
| `req.headers` | All headers (lowercase keys) |
| `req.ip` | Client IP |

```js
if (!req.is('application/json')) {
  return res.status(415).json({ message: 'Send JSON' });
}
```

---

## 17. Exercises

1. Add `express.json()` and `express.urlencoded()` to `server.js`.
2. Build `POST /api/echo` returning what you sent; test with Postman JSON.
3. Test the same endpoint with `curl -d` and with a plain HTML form.
4. Remove the middleware and observe `req.body`.
5. Put the middleware **after** the router and observe the bug.
6. Add `limit: '1kb'`, send a larger body and see the 413 error.
7. Write validation that returns 400 when `name` is missing or not a string.
8. Send invalid JSON and see the error; then add a JSON-error middleware.

### Challenge
Create `POST /api/contact` accepting `name`, `email`, `message`. Validate that all
three are non-empty strings, `email` contains `@`, and `message` ≤ 500 characters.
Return `201` with only the cleaned fields.

---

## 18. Quick Quiz

1. Why is `req.body` undefined without middleware?
2. Which middleware parses JSON bodies?
3. Which header decides which parser acts?
4. What does `extended: true` do in `urlencoded`?
5. What is mass assignment?
6. Why limit body sizes?
7. What happens if the fetch call lacks `Content-Type: application/json`?

<details><summary>Answers</summary>

1. Express does not parse bodies by default; the body is a raw stream.
2. `express.json()`.
3. `Content-Type`.
4. Uses `qs` to support nested objects/arrays.
5. Copying all client-supplied fields into an object, letting attackers set protected fields.
6. To prevent memory/CPU exhaustion.
7. The JSON parser ignores it; `req.body` stays empty/undefined.
</details>

---

## 19. Summary

- The body carries data for POST/PUT/PATCH; its format is described by `Content-Type`.
- Express needs parsers: `express.json()`, `express.urlencoded({ extended: true })`.
- Register them **before** routes; they fill `req.body` or leave it untouched.
- Form values are strings; JSON keeps types.
- Always validate, whitelist fields, and limit sizes.

---

## 20. Next Lesson

➡️ **20 — POST Request**
Use `req.body` to create new posts in our API.
