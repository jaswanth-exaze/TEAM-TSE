# 21 — PUT Request

> **Goal:** Implement `PUT /api/posts/:id` to update an existing post: combine route
> params, body data, validation, and correct status codes.

---

## 1. What Is PUT For?

**PUT** means: *"replace the resource at this URL with the data I send."*

```
PUT /api/posts/2     body: { "title": "Updated Title" }
```

SQL equivalent: `UPDATE posts SET title = ? WHERE id = ?`.

| Method | Meaning | Typical body |
|--------|---------|--------------|
| **PUT** | Replace the **whole** resource | Complete object |
| **PATCH** | Change **part** of the resource | Only changed fields |
| POST | Create new | New object |

### Idempotent
Sending the same PUT request 1 time or 10 times leaves the server in the **same state**.
That makes PUT safe to retry after a network failure (unlike POST).

---

## 2. Where Does the Data Come From?

A PUT request combines **two** inputs from earlier lessons:

```
PUT /api/posts/2        ← which resource?   -> req.params.id   (lesson 13)
{ "title": "New title" } ← new data         -> req.body        (lesson 19)
```

Both are untrusted and need validation.

---

## 3. Basic Implementation

```js
// routes/posts.js
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ message: `A post with id ${id} was not found` });
  }

  const { title } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Please include a title' });
  }

  post.title = title.trim();
  res.status(200).json(post);
});
```

### Explanation

1. Read `:id` and convert to number.
2. `find` returns the **actual object** inside the array (a reference, not a copy).
3. 404 if not found.
4. Validate the body.
5. Changing `post.title` changes the object **inside** `posts` too, because both names
   point to the same object in memory.
6. Respond 200 with the updated resource.

### Prerequisite: Objects are references
```js
const a = { n: 1 };
const b = a;       // b points to the SAME object
b.n = 99;
console.log(a.n);  // 99
```
Arrays and objects are **reference types**; modifying through one variable is visible
through every variable referencing the same object.

---

## 4. Order of Checks

A sensible order inside a handler:

1. Validate `id` format → 400
2. Find the resource → 404
3. (Check permissions → 401/403, later with auth)
4. Validate body → 400/422
5. Apply the change
6. Respond 200

Checking existence **before** body validation or the other way round are both seen in
practice; just be consistent.

---

## 5. Full Replacement vs Partial Update

### Strict PUT (replace everything)
```js
router.put('/:id', (req, res) => {
  const index = posts.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Post not found' });

  const { title, body } = req.body ?? {};
  if (typeof title !== 'string' || typeof body !== 'string') {
    return res.status(400).json({ message: 'title and body are required' });
  }

  const updated = {
    id: posts[index].id,        // id never changes
    title: title.trim(),
    body: body.trim(),
    createdAt: posts[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  posts[index] = updated;       // replace the entire object
  res.status(200).json(updated);
});
```

`findIndex` returns the position or `-1` when not found.

### PATCH (update only provided fields)
```js
router.patch('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const { title, body } = req.body ?? {};

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'title must be a non-empty string' });
    }
    post.title = title.trim();
  }
  if (body !== undefined) {
    if (typeof body !== 'string') {
      return res.status(400).json({ message: 'body must be a string' });
    }
    post.body = body.trim();
  }

  post.updatedAt = new Date().toISOString();
  res.status(200).json(post);
});
```

In the original lesson style many tutorials implement "PUT" with partial semantics for
simplicity. In real APIs prefer PATCH for partial updates.

---

## 6. What If the Resource Does Not Exist? (Upsert)

Strict REST says PUT may **create** the resource if it does not exist (upsert) and
return **201**. For simplicity most APIs return 404. Choose and document it.

```js
if (index === -1) {
  // optional upsert behaviour
  const created = { id, title, body };
  posts.push(created);
  return res.status(201).json(created);
}
```

(With server-generated ids, 404 is the better design.)

---

## 7. Never Allow the Client to Change the Id

```js
Object.assign(post, req.body);   // ❌ attacker sends { "id": 1 } or { "isAdmin": true }
```

Always **copy selected fields** only. Also ignore/reject `id` in the body, or compare it
with the URL id:

```js
if (req.body.id !== undefined && Number(req.body.id) !== id) {
  return res.status(400).json({ message: 'id in body does not match URL' });
}
```

---

## 8. Concurrency Concern (Awareness)

Two users update the same post at the same time: the last write wins and the first
user's change is silently lost ("lost update"). Solutions you will meet later:

- **Versioning / ETag with `If-Match`** → 412 Precondition Failed.
- A `version` or `updatedAt` column compared in `WHERE` clause.
- Database transactions and locking.

---

## 9. Calling PUT From the Browser

```js
async function updatePost(id, title) {
  const res = await fetch(`/api/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

updatePost(2, 'A better title')
  .then((post) => console.log('Updated:', post))
  .catch((err) => console.error(err.message));
```

HTML forms **cannot** send PUT (only GET and POST). Use `fetch`, or the
`method-override` middleware (`<form method="POST" action="/posts/2?_method=PUT">`).

---

## 10. Testing in Postman

| Test | Request | Expected |
|------|---------|----------|
| Success | `PUT /api/posts/2` `{ "title": "Updated" }` | 200 + updated post |
| Unknown id | `PUT /api/posts/99` | 404 |
| Invalid id | `PUT /api/posts/abc` | 404/400 |
| Empty body | `PUT /api/posts/2` `{}` | 400 |
| Wrong type | `{ "title": 123 }` | 400 |
| Repeat same request | send twice | same result (idempotent) |

Then `GET /api/posts` — confirm the change persisted (until restart).

Postman test snippet:

```js
pm.test('Title updated', () => {
  pm.expect(pm.response.json().title).to.eql('Updated');
});
```

---

## 11. Using `router.route()` to Group Methods

```js
router
  .route('/:id')
  .get(getPost)
  .put(updatePost)
  .delete(deletePost);
```

You will see this style in lesson 27 (controllers). It keeps one definition per URL.

---

## 12. Express 5 / Async Note

If you later use a database:

```js
router.put('/:id', async (req, res) => {
  const [result] = await db.execute(
    'UPDATE posts SET title = ?, body = ? WHERE id = ?',
    [title, body, id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Post not found' });
  }
  res.json({ id, title, body });
});
```

`affectedRows` = number of rows matched/changed → use it to detect "not found".

---

## 13. Security Checklist for PUT/PATCH 🔐

| Concern | Defence |
|---------|---------|
| Changing someone else's resource | Authorization: check ownership/role |
| Mass assignment | Whitelist fields |
| Changing protected fields (`id`, `role`, `createdAt`) | Ignore/reject |
| Oversized payload | `express.json({ limit })` |
| Stored XSS | Escape on output / sanitize |
| SQL injection | Parameterized queries |
| Lost updates | Versioning/ETags |
| Verbose errors | Generic messages in production |

IDOR example: `PUT /api/orders/123` — the server must verify order 123 belongs to the
logged-in user. **Never assume** "the UI only shows their own orders".

---

## 14. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting `express.json()` | `req.body` undefined | Add middleware |
| Comparing string id with number | Always 404 | `Number(req.params.id)` |
| Replacing array element with a **copy** when you meant to mutate | Changes not visible | Assign to `posts[index]` or mutate `post` |
| `post = {...}` (reassigning local variable) | Array unchanged | Mutate properties or `posts[index] = ...` |
| Returning 200 with `{ error }` | Wrong status | Use 4xx |
| Allowing id change | Data corruption | Ignore id in body |
| Missing `return` after error response | Double response | `return res...` |
| Not setting `updatedAt` | No audit trail | Set timestamp |

The "reassigning local variable" bug deserves an example:

```js
let post = posts.find(p => p.id === id);
post = { ...post, title: 'New' };   // ❌ only local variable now points to new object
```
`posts` still contains the old object.

---

## 15. Complete Router (GET, POST, PUT)

```js
import express from 'express';
const router = express.Router();

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];
let nextId = 4;

router.get('/', (req, res) => res.status(200).json(posts));

router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.status(200).json(post);
});

router.post('/', (req, res) => {
  const { title } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Please include a title' });
  }
  const newPost = { id: nextId++, title: title.trim() };
  posts.push(newPost);
  res.status(201).json(newPost);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ message: `A post with id ${id} was not found` });
  }

  const { title } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Please include a title' });
  }

  post.title = title.trim();
  res.status(200).json(post);
});

export default router;
```

---

## 16. Exercises

1. Implement `PUT /api/posts/:id` updating the title.
2. Test success, unknown id, missing title, wrong type.
3. Show that repeating the same PUT is idempotent.
4. Add `updatedAt` to the post on each update.
5. Reject body ids that differ from the URL id.
6. Implement `PATCH` for partial updates and compare with PUT.
7. Write a `fetch` function that updates a post and shows an error message when it fails.
8. Use `findIndex` to implement strict replacement.

### Challenge
Create a `PUT /api/posts/:id` that returns **404 vs 400 in the right order** and uses a
shared helper `findPostOr404(id, res)` to avoid duplicating lookup code in PUT, PATCH
and DELETE.

<details><summary>Solution idea</summary>

```js
function findPost(req, res) {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);
  if (!post) {
    res.status(404).json({ message: `Post ${id} not found` });
    return null;
  }
  return post;
}

router.put('/:id', (req, res) => {
  const post = findPost(req, res);
  if (!post) return;               // response already sent
  // ...
});
```
(Lesson 23's middleware or `app.param` solve this more elegantly.)
</details>

---

## 17. Quick Quiz

1. What does PUT mean semantically?
2. What does "idempotent" mean?
3. Which two request parts does PUT combine?
4. Why is `Object.assign(post, req.body)` dangerous?
5. Which status code for a successful update?
6. Why can't a plain HTML form send PUT?
7. What does `findIndex` return when nothing is found?

<details><summary>Answers</summary>

1. Replace the resource at the URL with the supplied representation.
2. Repeating the request has the same effect as doing it once.
3. URL param (`id`) and body.
4. Mass assignment: attackers can overwrite protected fields.
5. 200 (or 204 if no body).
6. HTML forms support only GET and POST.
7. `-1`.
</details>

---

## 18. Summary

- PUT updates the resource at `/:id` using data from the body; it is idempotent.
- Look up the resource (404), validate input (400), copy allowed fields, respond 200.
- PATCH is for partial updates; PUT conceptually replaces the whole resource.
- Objects are references: mutate the found object or assign to the array index.
- Authorization and field whitelisting are essential for real apps.

---

## 19. Next Lesson

➡️ **22 — DELETE Request**
Remove a post from the collection.
