# 13 — Request Params (`req.params`)

> **Goal:** Build dynamic routes such as `/api/posts/:id`, read values with
> `req.params`, and find a single item in our data.

---

## 1. The Problem

Right now we can return **all** posts. But what if the client wants **post number 2**?

We cannot write one route for each post:

```js
app.get('/api/posts/1', ...);
app.get('/api/posts/2', ...);
app.get('/api/posts/3', ...);   // impossible for 10,000 posts
```

We need a **pattern** with a variable part. That is a **route parameter**.

---

## 2. Syntax

```js
app.get('/api/posts/:id', (req, res) => {
  res.send(`You asked for post ${req.params.id}`);
});
```

- `:id` = a **placeholder** (colon + name).
- Express captures whatever appears in that position.
- The captured value goes into the object `req.params` as `{ id: '2' }`.

| Request URL | `req.params` |
|-------------|--------------|
| `/api/posts/1` | `{ id: '1' }` |
| `/api/posts/abc` | `{ id: 'abc' }` |
| `/api/posts/` | no match (404) |
| `/api/posts/1/comments` | no match (404) |

---

## 3. Prerequisite Concept: URL Path Segments

A path is split by `/`:

```
/api/posts/2
 ^   ^     ^
 |   |     └─ segment 3 (:id)
 |   └─────── segment 2 ("posts")
 └─────────── segment 1 ("api")
```

A param matches **exactly one segment** (it stops at the next `/`).

---

## 4. Important: Params Are Always Strings

```js
app.get('/api/posts/:id', (req, res) => {
  console.log(req.params.id);          // '2'
  console.log(typeof req.params.id);   // 'string'
});
```

Our posts have **numeric** ids. Comparing `2 === '2'` is **false** in JavaScript
(strict equality checks type). So convert first:

```js
const id = parseInt(req.params.id, 10);   // or Number(req.params.id)
```

### Why `parseInt(x, 10)`?
The second argument is the **radix** (number base). `10` = decimal. Always pass it.

Alternatives:

| Expression | `'12abc'` | `'abc'` | `''` |
|-----------|-----------|---------|------|
| `parseInt(s, 10)` | 12 | NaN | NaN |
| `Number(s)` | NaN | NaN | 0 |
| `+s` | NaN | NaN | 0 |

Because `parseInt('12abc')` happily returns 12, strict validation needs more care
(`Number.isInteger(Number(s))`).

---

## 5. Getting One Post

```js
let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];

app.get('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ message: `Post with id ${id} was not found` });
  }

  res.json(post);
});
```

### Explanation

1. Read and convert the param.
2. `Array.prototype.find` returns the **first** element where the callback is true, or
   `undefined` if none.
3. If `undefined`, respond with **404** and a message, then `return` (stop the function).
4. Otherwise send the post as JSON.

### Try it

| URL | Result |
|-----|--------|
| `/api/posts/1` | `{ "id": 1, "title": "Post One" }` |
| `/api/posts/3` | Post Three |
| `/api/posts/99` | 404 + message |
| `/api/posts/abc` | `id` is `NaN` → not found → 404 |

---

## 6. Why `return` Before `res.status(404)...`?

```js
if (!post) {
  res.status(404).json({ message: 'Not found' });   // no return
}
res.json(post);   // still runs! -> "Cannot set headers after they are sent"
```

Without `return`, the function continues and tries to respond twice.
Use `return res...` (early return pattern) in guard clauses. Lesson 16 explains this error.

---

## 7. Multiple Parameters

```js
app.get('/api/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  res.json({ userId, postId });
});
```

URL `/api/users/5/posts/42` → `{ "userId": "5", "postId": "42" }`.

Use **destructuring** to pull values out neatly.

---

## 8. Parameters With Other Characters

Params normally match any characters except `/`. You can constrain them with regular
expressions (Express 4 style):

```js
// Only digits  (Express 4)
app.get('/api/posts/:id(\\d+)', handler);
```

> **Express 5 note:** regex inside route strings was removed for safety reasons
> (ReDoS attacks). In Express 5 validate inside the handler or middleware, or use a
> `router.param` function (below).

Validation in the handler works in **both** versions:

```js
app.get('/api/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'id must be a positive integer' });
  }
  // ...
});
```

Notice we used **400 Bad Request** (invalid input) here, versus **404 Not Found**
(valid id, nothing there).

---

## 9. Optional Parameters

Express 4: `'/api/posts/:id?'` (question mark).
Express 5: use braces `'/api/posts{/:id}'`.

Often simpler: define **two routes** (`/api/posts` and `/api/posts/:id`).

---

## 10. Route Order and Conflicts ⚠️

```js
app.get('/api/posts/:id', (req, res) => res.send('one post'));
app.get('/api/posts/latest', (req, res) => res.send('latest'));   // NEVER reached!
```

`/api/posts/latest` matches the **first** route with `id = 'latest'`. Put **specific
routes first**:

```js
app.get('/api/posts/latest', ...);   // specific
app.get('/api/posts/:id', ...);      // generic
```

Rule: **static paths before dynamic paths.**

---

## 11. `app.param()` — Preprocessing a Parameter

If many routes use `:id`, you can run common logic once.

```js
app.param('id', (req, res, next, value) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  req.postId = id;       // attach a clean value for later handlers
  next();                // continue to the route handler
});

app.get('/api/posts/:id', (req, res) => {
  const post = posts.find((p) => p.id === req.postId);
  if (!post) return res.status(404).json({ message: 'Not found' });
  res.json(post);
});
```

`next()` passes control onward (full explanation in lesson 23).

---

## 12. Params and Security 🔐

Route params come from the **user** — treat them as untrusted input.

| Risk | Example | Defence |
|------|---------|---------|
| SQL Injection | `SELECT * FROM posts WHERE id = ${req.params.id}` | Use **parameterized queries** (`?` placeholders in `mysql2`) |
| Path traversal | `sendFile('/files/' + req.params.name)` | Whitelist / `root` option |
| Type confusion | `id` as `'1 OR 1=1'` | Validate type and range |
| Information leak | Different message for "exists but forbidden" vs "not found" | Consistent responses |
| IDOR (Insecure Direct Object Reference) | `/api/orders/123` returns someone else's order | Check ownership on the server |

Example of a safe MySQL query (preview):

```js
const [rows] = await db.execute('SELECT * FROM posts WHERE id = ?', [id]);
```

The `?` is filled safely by the driver; user text can never become SQL code.

---

## 13. Full Working Example

```js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];

// GET all posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

// GET single post
app.get('/api/posts/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'id must be an integer' });
  }

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ message: `A post with the id of ${id} was not found` });
  }

  res.json(post);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 14. Testing in Postman

| Request | Expected |
|---------|----------|
| `GET {{baseUrl}}/api/posts/1` | 200, Post One |
| `GET {{baseUrl}}/api/posts/2` | 200, Post Two |
| `GET {{baseUrl}}/api/posts/100` | 404 JSON message |
| `GET {{baseUrl}}/api/posts/abc` | 400 JSON message |
| `GET {{baseUrl}}/api/posts/-5` | 404 (integer but not found) |

Add a test:

```js
pm.test('404 for unknown id', () => pm.response.to.have.status(404));
```

---

## 15. Params in Frontend `fetch`

```js
async function loadPost(id) {
  const res = await fetch(`/api/posts/${id}`);
  if (!res.ok) {
    console.log('Error status:', res.status);
    return;
  }
  const post = await res.json();
  console.log(post.title);
}
loadPost(2);
```

`res.ok` is true for status 200–299. `fetch` does **not** throw on 404; you must check.

---

## 16. Params vs Query vs Body (Overview)

| Where | Example | Typical use | Read with |
|-------|---------|-------------|-----------|
| Path param | `/posts/5` | Identify **one resource** | `req.params` |
| Query string | `/posts?limit=3` | Filter, sort, paginate | `req.query` (lesson 14) |
| Body | JSON in POST | Data to create/update | `req.body` (lesson 19) |

---

## 17. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Comparing string id with number | `find` returns undefined | Convert with `Number()` |
| Forgetting `return` after a response | "headers already sent" | Use `return res...` |
| Dynamic route above static route | Static never matches | Reorder |
| `req.param.id` (typo) | `Cannot read properties of undefined` | `req.params.id` |
| Not handling `NaN` | Confusing results | Validate integers |
| Trusting ids for authorization | IDOR vulnerability | Check ownership |

---

## 18. Exercises

1. Implement `GET /api/posts/:id` with 404 handling.
2. Add validation: non-integer id → 400.
3. Add `GET /api/users/:userId/posts/:postId` returning both values.
4. Place a `/api/posts/latest` route correctly so it returns the highest-id post.
5. Add `app.param('id', ...)` to validate once for several routes.
6. Write a `fetch` snippet that shows a friendly message when the post is not found.
7. Test every case in Postman and note status codes.

### Challenge
Add `GET /api/posts/:id/title` that returns just `{ title }` of that post, with proper
404/400 handling and no duplicated validation code (use `app.param`).

---

## 19. Quick Quiz

1. How do you declare a route parameter?
2. What is the type of `req.params.id`?
3. Why is `posts.find(p => p.id === req.params.id)` buggy?
4. What does `find` return if nothing matches?
5. Why must `/posts/latest` come before `/posts/:id`?
6. What is IDOR?

<details><summary>Answers</summary>

1. With a colon: `/posts/:id`.
2. String.
3. Number vs string strict comparison always fails.
4. `undefined`.
5. Otherwise `:id` would swallow `latest`.
6. Insecure Direct Object Reference — accessing others' data by changing an id when the server does not check ownership.
</details>

---

## 20. Summary

- `:name` in a path creates a route parameter available in `req.params.name`.
- Params are **strings**; convert and validate them.
- A param matches one path segment only.
- Specific routes must be declared before generic ones.
- Use 400 for invalid input and 404 for missing resources.
- Treat params as untrusted: validate, use parameterized SQL, check ownership.

---

## 21. Next Lesson

➡️ **14 — Query Strings (`req.query`)**
Filter and limit results with URLs such as `/api/posts?limit=2`.
