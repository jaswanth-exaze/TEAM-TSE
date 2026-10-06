# 22 — DELETE Request

> **Goal:** Implement `DELETE /api/posts/:id` correctly, understand array removal
> techniques, choose the right status code, and think about safe deletion.

---

## 1. What Is DELETE For?

**DELETE** removes the resource identified by the URL.

```
DELETE /api/posts/2
```

SQL equivalent: `DELETE FROM posts WHERE id = ?`.

Properties:

- **Idempotent** in effect: after the first success the resource is gone; repeating the
  request leaves the server in the same state (but the response code may differ: 404
  the second time).
- **Not safe** — it changes data.
- Usually **has no request body**.

---

## 2. Prerequisite Concept: Removing Items From Arrays

Because our data is an array we need to know the options.

### 2.1 `filter` — create a new array without the item
```js
const posts = [{ id: 1 }, { id: 2 }, { id: 3 }];
const result = posts.filter((p) => p.id !== 2);
// result: [{ id: 1 }, { id: 3 }]; posts is unchanged
```
- Does **not** mutate the original.
- You must assign the result: `posts = posts.filter(...)` → requires `let`, not `const`.

### 2.2 `splice` — remove in place
```js
const index = posts.findIndex((p) => p.id === 2);
if (index !== -1) posts.splice(index, 1);   // remove 1 element at index
```
- **Mutates** the array (works even with `const`).
- Returns the removed elements as an array.

### Which to choose?

| Technique | Mutates? | `const` OK? | Notes |
|-----------|----------|-------------|-------|
| `filter` + reassign | No (new array) | ❌ needs `let` | Reassigning breaks other modules holding the old array reference (lesson 17) |
| `splice` | Yes | ✅ | Safe for shared arrays |

In this course we use whichever fits; remember the reference issue when data is shared
between files.

---

## 3. Basic Implementation (with `filter`)

```js
let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ message: `A post with id ${id} was not found` });
  }

  posts = posts.filter((p) => p.id !== id);
  res.status(200).json({ message: 'Post deleted', deleted: post });
});
```

### Explanation

1. Convert and read `:id`.
2. Check the post exists; else 404.
3. Remove it by filtering.
4. Respond with 200 and a confirmation (or return the deleted object).

---

## 4. Implementation with `splice`

```js
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ message: `A post with id ${id} was not found` });
  }

  const [removed] = posts.splice(index, 1);   // array destructuring of the returned array
  res.status(200).json({ message: 'Post deleted', deleted: removed });
});
```

`const [removed] = ...` takes the first element of the array returned by `splice`.

---

## 5. Choosing the Response: 200 vs 204

| Option | Code | Body | When |
|--------|------|------|------|
| Return a message | **200 OK** | `{ "message": "Post deleted" }` | Friendly API, easy for beginners |
| Return nothing | **204 No Content** | none | REST purist, saves bandwidth |
| Return the deleted object | 200 | object | Useful for "undo" |

204 example:

```js
posts.splice(index, 1);
res.status(204).end();      // no body allowed
```

Remember: a 204 response must not include a body, so don't use `.json()` with it.
Front-end code must not call `res.json()` on a 204 (it would throw on empty body).

---

## 6. Repeating a DELETE

| Attempt | Server state | Response |
|---------|--------------|----------|
| 1st `DELETE /posts/2` | Post 2 removed | 200/204 |
| 2nd `DELETE /posts/2` | Still removed | 404 (not found) |

Both outcomes are acceptable. Some APIs return 204 for the second request as well
(treating "already gone" as success). Document your choice.

---

## 7. Cascading and Related Data

Deleting a post may require deleting its comments (like `ON DELETE CASCADE` in MySQL):

```sql
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  body TEXT,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

In memory you would do it manually:

```js
comments = comments.filter((c) => c.postId !== id);
```

Always think: *"What else depends on this resource?"*

---

## 8. Soft Delete vs Hard Delete

| | Hard delete | Soft delete |
|--|-------------|-------------|
| How | Row removed | Flag `deletedAt` / `isDeleted = true` |
| Recoverable | No | Yes |
| Audit/legal | Poor | Good |
| Complexity | Low | Every query must filter deleted rows |
| Privacy (GDPR "right to erasure") | Satisfies | Needs real purge later |

Soft delete example in memory:

```js
post.deletedAt = new Date().toISOString();
// GET routes: posts.filter(p => !p.deletedAt)
```

SQL: `UPDATE posts SET deleted_at = NOW() WHERE id = ?`.

---

## 9. Security Checklist for DELETE 🔐

| Concern | Why it matters | Defence |
|---------|----------------|---------|
| Authorization | Anyone could delete anything | Require login + ownership/role check |
| IDOR | Deleting others' resources by guessing ids | Verify ownership on the server |
| CSRF | A malicious site triggers a DELETE using your cookies | CSRF tokens, SameSite cookies, custom headers |
| Accidental deletion | Typos, bugs | Confirmation in UI, soft delete, backups |
| Mass deletion | `DELETE /api/posts` (no id) wiping everything | Don't implement or protect it strictly |
| Audit | No record of who deleted | Log deletions (who, what, when) |
| Never use GET for deletion | Crawlers/prefetch could delete data | Use DELETE only |

> A famous real-world bug: an admin page used `GET /delete?id=5` links; a search-engine
> crawler followed them all and deleted the entire database.

---

## 10. Calling DELETE From the Browser

```js
async function deletePost(id) {
  const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });

  if (res.status === 204) return true;           // no body to parse

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

deletePost(2)
  .then(() => console.log('Deleted'))
  .catch((err) => console.error(err.message));
```

A delete button in HTML:

```html
<ul id="list"></ul>
<script>
  async function load() {
    const posts = await (await fetch('/api/posts')).json();
    const list = document.getElementById('list');
    list.innerHTML = '';
    posts.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = p.title + ' ';
      const btn = document.createElement('button');
      btn.textContent = 'Delete';
      btn.addEventListener('click', async () => {
        if (!confirm(`Delete "${p.title}"?`)) return;
        await fetch(`/api/posts/${p.id}`, { method: 'DELETE' });
        load();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }
  load();
</script>
```

---

## 11. Testing in Postman / curl

| Test | Request | Expected |
|------|---------|----------|
| Success | `DELETE /api/posts/2` | 200 + message (or 204) |
| Verify | `GET /api/posts/2` | 404 |
| List | `GET /api/posts` | One fewer item |
| Repeat | `DELETE /api/posts/2` | 404 |
| Bad id | `DELETE /api/posts/abc` | 404/400 |

```bash
curl -i -X DELETE http://localhost:5000/api/posts/2
curl -i http://localhost:5000/api/posts/2
```

Postman test:

```js
pm.test('Deleted', () => pm.expect([200, 204]).to.include(pm.response.code));
```

---

## 12. Complete CRUD Router

```js
import express from 'express';
const router = express.Router();

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];
let nextId = 4;

const parseId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
};

// READ ALL
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10);
  res.status(200).json(limit > 0 ? posts.slice(0, limit) : posts);
});

// READ ONE
router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === parseId(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.status(200).json(post);
});

// CREATE
router.post('/', (req, res) => {
  const { title } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Please include a title' });
  }
  const newPost = { id: nextId++, title: title.trim() };
  posts.push(newPost);
  res.status(201).json(newPost);
});

// UPDATE
router.put('/:id', (req, res) => {
  const post = posts.find((p) => p.id === parseId(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const { title } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Please include a title' });
  }
  post.title = title.trim();
  res.status(200).json(post);
});

// DELETE
router.delete('/:id', (req, res) => {
  const index = posts.findIndex((p) => p.id === parseId(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Post not found' });

  const [removed] = posts.splice(index, 1);
  res.status(200).json({ message: 'Post deleted', deleted: removed });
});

export default router;
```

**Congratulations** — this is a full CRUD REST API.

---

## 13. REST Summary Table of Our API

| Method | URL | Body | Success | Errors |
|--------|-----|------|---------|--------|
| GET | `/api/posts` | — | 200 + array | — |
| GET | `/api/posts?limit=2` | — | 200 + array | — |
| GET | `/api/posts/:id` | — | 200 + object | 404 |
| POST | `/api/posts` | `{ title }` | 201 + object | 400 |
| PUT | `/api/posts/:id` | `{ title }` | 200 + object | 400, 404 |
| DELETE | `/api/posts/:id` | — | 200 / 204 | 404 |

---

## 14. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `const posts` then `posts = posts.filter(...)` | `TypeError: Assignment to constant variable` | Use `let` or `splice` |
| String vs number id | Always 404 | Convert |
| Using `splice(index)` without count | Removes everything after index! | `splice(index, 1)` |
| `splice(-1, 1)` when index is `-1` | Removes the **last** element accidentally | Check `index === -1` first |
| `204` with JSON body | Body dropped / error | `.end()` |
| Parsing JSON from a 204 on the client | `Unexpected end of JSON input` | Check status first |
| Delete via GET | Security & caching issues | Use DELETE |
| No auth | Anyone deletes | Add authorization |

The `splice(-1, 1)` bug is subtle: a negative index counts from the end, so a missing
item results in deleting the **last** item. Always guard `index === -1`.

---

## 15. Exercises

1. Implement `DELETE /api/posts/:id` using `filter`, then again using `splice`.
2. Test the repeated delete and observe 404.
3. Switch to `204` and fix a `fetch` function to handle no body.
4. Add soft delete: mark `deletedAt` and hide those posts from GET.
5. Build a front-end list with Delete buttons (section 10).
6. Add a `DELETE /api/posts` that is **not** allowed and returns `405 Method Not Allowed`.
7. Log each deletion: `console.log(`Deleted post ${id} from ${req.ip}`)`.
8. Think: what would a delete confirmation flow look like for an admin panel?

### Challenge
Add an "undo": after deleting, keep the deleted post in a `trash` array and implement
`POST /api/posts/:id/restore` that moves it back (return 404 if not in trash).

<details><summary>Solution idea</summary>

```js
const trash = [];

router.delete('/:id', (req, res) => {
  const index = posts.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Post not found' });
  trash.push(...posts.splice(index, 1));
  res.status(200).json({ message: 'Moved to trash' });
});

router.post('/:id/restore', (req, res) => {
  const i = trash.findIndex((p) => p.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ message: 'Not in trash' });
  const [post] = trash.splice(i, 1);
  posts.push(post);
  res.status(200).json(post);
});
```
</details>

---

## 16. Quick Quiz

1. What does DELETE usually not have?
2. Difference between `filter` and `splice` for removal?
3. What happens with `array.splice(-1, 1)`?
4. Which status code means "success, no body"?
5. What is soft delete?
6. Why should deletion never be done via GET?
7. What is cascade delete?

<details><summary>Answers</summary>

1. A request body.
2. `filter` builds a new array; `splice` mutates in place.
3. Removes the last element.
4. 204.
5. Marking a record as deleted instead of removing it.
6. GET must be safe; crawlers/prefetchers could trigger deletion.
7. Automatically deleting dependent rows/records.
</details>

---

## 17. Summary

- DELETE removes the resource at `/:id`; return 404 if missing, else 200 (message) or 204.
- Remove array items with `filter` (new array) or `splice` (in place) — guard `-1`.
- Consider related data, soft deletes, auditing and authorization.
- Never allow deletion via GET; protect with auth and CSRF defences.
- You now have a complete CRUD API: GET, POST, PUT, DELETE.

---

## 18. Next Lesson

➡️ **23 — Middleware**
The core concept of Express: functions that run between request and response.
