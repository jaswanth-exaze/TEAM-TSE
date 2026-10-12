# 20 — POST Request

> **Goal:** Implement `POST /api/posts` to create a new resource: validate input,
> generate an id, store it, and respond with `201 Created`.

---

## 1. What Is POST For?

In REST, **POST** means: *"create a new resource inside this collection"*.

```
POST /api/posts      body: { "title": "New" }     -> creates a post
```

| CRUD | HTTP | Path | Success status |
|------|------|------|----------------|
| Create | POST | `/api/posts` | **201 Created** |
| Read all | GET | `/api/posts` | 200 |
| Read one | GET | `/api/posts/:id` | 200 |
| Update | PUT | `/api/posts/:id` | 200 |
| Delete | DELETE | `/api/posts/:id` | 200 / 204 |

SQL equivalent: `INSERT INTO posts (title) VALUES (?)`.

Properties of POST:
- **Not idempotent** — sending it twice creates two posts.
- **Not safe** — it changes server state.
- The **server** chooses the new resource's id (client does not).

---

## 2. Requirements Before We Start

1. Body parsers registered **before** routers (lesson 19):
   ```js
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   ```
2. A mutable data array (`let posts = [...]` — or mutate with `push`).
3. The posts router (lesson 17) in ES module style (lesson 18).

---

## 3. Basic Implementation

```js
// routes/posts.js
import express from 'express';
const router = express.Router();

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];

// POST /api/posts
router.post('/', (req, res) => {
  const newPost = {
    id: posts.length + 1,
    title: req.body.title,
  };

  if (!newPost.title) {
    return res.status(400).json({ message: 'Please include a title' });
  }

  posts.push(newPost);
  res.status(201).json(newPost);
});

export default router;
```

### Line-by-line

1. `router.post('/', ...)` — handles POST requests to the mount path `/api/posts`.
2. We build a `newPost` object. `id: posts.length + 1` is a **quick but flawed** way to
   create an id (see next section).
3. Validate: reject missing title with **400**.
4. `posts.push(newPost)` — adds to the end of the array (mutates it).
5. `res.status(201).json(newPost)` — **201 Created** plus the created object.

### Test (Postman)
- Method: POST, URL `{{baseUrl}}/api/posts`
- Body → raw → JSON: `{ "title": "Post Four" }`
- Expected: status 201, body `{ "id": 4, "title": "Post Four" }`
- Then GET `/api/posts` — you should see four posts.

---

## 4. Problem: `posts.length + 1` Is Not a Safe ID

Scenario:

1. Posts have ids 1, 2, 3.
2. Delete post 2 → array is `[1, 3]`, length 2.
3. Create a post → new id = `2 + 1 = 3` → **duplicate id 3!**

Better strategies:

### A) Max id + 1
```js
const nextId = posts.length ? Math.max(...posts.map((p) => p.id)) + 1 : 1;
```

### B) Keep a counter variable
```js
let nextId = 4;
// in handler
const newPost = { id: nextId++, title };
```
`nextId++` uses the value then increments.

### C) Use UUIDs
```js
import { randomUUID } from 'node:crypto';
const newPost = { id: randomUUID(), title };
```
Built into Node; produces ids like `3b241101-e2bb-4255-8caf-4136c566a962`.
Advantages: unguessable, unique across servers. (Remember `req.params.id` is then a
string and no `Number()` conversion is needed.)

### D) Database auto-increment
With MySQL: `id INT AUTO_INCREMENT PRIMARY KEY`; the database creates the id and gives
you `insertId`. This is what you will do in real projects.

> 🔐 Sequential numeric ids make **enumeration** easy (`/posts/1`, `/posts/2`, ...).
> That is fine for public data but a risk for private resources; always check
> authorization, or use UUIDs.

---

## 5. A Better Version (Validation + Safe Fields)

```js
router.post('/', (req, res) => {
  const { title, body = '' } = req.body ?? {};

  // validation
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'title is required and must be a non-empty string' });
  }
  if (title.length > 100) {
    return res.status(400).json({ message: 'title must be 100 characters or fewer' });
  }
  if (typeof body !== 'string') {
    return res.status(400).json({ message: 'body must be a string' });
  }

  // only the allowed fields are copied (prevents mass assignment)
  const newPost = {
    id: posts.length ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
    title: title.trim(),
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };

  posts.push(newPost);
  res.status(201).json(newPost);
});
```

Things to appreciate:

- `req.body ?? {}` avoids crash when body missing.
- Default value `body = ''` in destructuring.
- Clean, trimmed data; never `...req.body` spread into the object.
- Server-set fields (`id`, `createdAt`) cannot be overridden by the client.

---

## 6. The `Location` Header (REST Nicety)

Good REST APIs tell the client where the new resource lives:

```js
res
  .status(201)
  .location(`/api/posts/${newPost.id}`)
  .json(newPost);
```

Response header: `Location: /api/posts/4`.

---

## 7. Duplicate Detection and 409

```js
const exists = posts.some((p) => p.title.toLowerCase() === title.trim().toLowerCase());
if (exists) {
  return res.status(409).json({ message: 'A post with this title already exists' });
}
```

`409 Conflict`: the request is valid but conflicts with current state.

---

## 8. Sending Data From the Browser With `fetch`

`public/main.js`:

```js
async function createPost(title) {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message);
    return;
  }

  console.log('Created:', data);
}

createPost('Created from the browser');
```

Key points:

1. `method: 'POST'` (default is GET).
2. Must set `Content-Type: application/json`.
3. Body must be a **string** — `JSON.stringify`.
4. `res.ok` false for 4xx/5xx; read the error message from the JSON.

(Lessons 29–30 cover this in depth with forms.)

---

## 9. Sending With curl

```bash
curl -i -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"From curl","body":"Hello"}'
```

Expected: `HTTP/1.1 201 Created` and the JSON of the new post.

Missing title:

```bash
curl -i -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" -d '{}'
# HTTP/1.1 400 Bad Request
```

---

## 10. Order of Route Definitions

POST and GET with the same path are **different routes**; order between them does not
matter. But remember:

- Parsers **before** the router in `server.js`.
- Specific paths before parameterized ones (`/latest` before `/:id`).

---

## 11. Data Is Temporary

Because posts live in memory:

- Restarting the server (including `--watch` restarts when you save a file!) resets the
  array to the original three posts.
- Multiple server instances would each have their own array.

In real projects replace the array operations with MySQL queries:

```js
const [result] = await db.execute(
  'INSERT INTO posts (title, body) VALUES (?, ?)',
  [title, body]
);
const newPost = { id: result.insertId, title, body };
res.status(201).json(newPost);
```

The HTTP part (parsing, validation, status codes) remains the same — only the storage
changes. That is why we will separate controllers in lesson 27.

---

## 12. Security Checklist for POST Endpoints 🔐

| Check | Why |
|-------|-----|
| Validate types, length, format | Prevent bad data, crashes |
| Pick allowed fields only | Prevent mass assignment |
| Limit body size | Prevent DoS |
| Escape output when displaying | Prevent stored XSS |
| Parameterized queries | Prevent SQL injection |
| Authentication/authorization | Only permitted users create |
| Rate limiting | Stop spam/flooding |
| CSRF protection (for cookie-based sessions) | Prevent forged form posts from other sites |
| Do not echo sensitive input | Avoid leaking passwords |

---

## 13. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| No `express.json()` | `req.body` undefined → TypeError | Add parser before routes |
| Postman body set to `Text` | `req.body` `{}`/undefined | Use raw → JSON |
| Forgetting `.status(201)` | Status 200 | Add it |
| Spreading `...req.body` into object | Mass assignment | Pick fields |
| `id` as `posts.length + 1` after deletes | Duplicate ids | Use max+1/counter/UUID |
| Forgetting `return` in validation | Double response | `return res...` |
| `JSON.stringify` missing in fetch | `[object Object]` sent | Stringify |
| Using `push` on a `const` array reassigned elsewhere | confusion | Understand mutation vs reassignment |

---

## 14. Complete Router File So Far

```js
import express from 'express';
const router = express.Router();

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];

let nextId = 4;

// GET all
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10);
  res.status(200).json(limit > 0 ? posts.slice(0, limit) : posts);
});

// GET one
router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.status(200).json(post);
});

// POST create
router.post('/', (req, res) => {
  const { title } = req.body ?? {};

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Please include a title' });
  }

  const newPost = { id: nextId++, title: title.trim() };
  posts.push(newPost);

  res.status(201).location(`/api/posts/${newPost.id}`).json(newPost);
});

export default router;
```

---

## 15. Exercises

1. Implement `POST /api/posts` with title validation.
2. Test with Postman: success, missing title, empty title, number title.
3. Fix the duplicate-id problem using a counter or max+1.
4. Add optional `body` field with validation and a `createdAt` timestamp.
5. Return `409` for duplicate titles.
6. Add the `Location` header and verify it with `curl -i`.
7. Call the endpoint from `fetch` in the browser console.
8. Restart the server and note that new posts disappear.

### Challenge
Write a **validator function** `validatePost(data)` returning `{ valid, errors }` where
`errors` is an array of messages. Use it in the route to respond with
`400 { errors: [...] }` showing **all** problems at once.

<details><summary>Solution</summary>

```js
function validatePost({ title, body } = {}) {
  const errors = [];
  if (typeof title !== 'string' || !title.trim()) errors.push('title is required');
  else if (title.length > 100) errors.push('title max length is 100');
  if (body !== undefined && typeof body !== 'string') errors.push('body must be a string');
  return { valid: errors.length === 0, errors };
}

router.post('/', (req, res) => {
  const { valid, errors } = validatePost(req.body);
  if (!valid) return res.status(400).json({ errors });
  // ...
});
```
</details>

---

## 16. Quick Quiz

1. Which status code should a successful POST that creates something return?
2. Why is `posts.length + 1` a poor id strategy?
3. Is POST idempotent?
4. What does the `Location` header tell the client?
5. How can you prevent mass assignment?
6. Which header must `fetch` set to send JSON?
7. What status do you return for a duplicate?

<details><summary>Answers</summary>

1. 201 Created.
2. After deletions it can generate duplicate ids.
3. No.
4. The URL of the newly created resource.
5. Pick only allowed fields explicitly.
6. `Content-Type: application/json`.
7. 409 Conflict.
</details>

---

## 17. Summary

- POST creates a resource; respond with **201** and the created object.
- Use `req.body` (needs `express.json()`), validate, whitelist fields.
- Server generates ids; use a counter, max+1, UUID or a database auto-increment.
- Return clear 400/409 errors; optionally set `Location`.
- Data in memory is lost on restart; swap in MySQL later without changing the HTTP contract.

---

## 18. Next Lesson

➡️ **21 — PUT Request**
Update an existing post by id.
