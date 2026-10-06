# 15 — Setting Status Codes

> **Goal:** Understand HTTP status codes deeply and use `res.status()` so that every
> response tells the client exactly what happened.

---

## 1. What Is a Status Code?

Every HTTP response begins with a **status line**:

```
HTTP/1.1 404 Not Found
         ^^^ ^^^^^^^^^
        code  reason phrase
```

The three-digit **code** is for programs; the **reason phrase** is for humans.

By default Express sends **200 OK** for everything — even errors, unless you change it.
That is dangerous: a client cannot tell success from failure without reading the body.

```js
// Misleading: error with status 200
app.get('/api/posts/:id', (req, res) => {
  res.json({ error: 'Not found' });      // status is 200!
});
```

Correct:

```js
res.status(404).json({ error: 'Not found' });
```

---

## 2. The Five Families

| Range | Class | Meaning |
|-------|-------|---------|
| **1xx** | Informational | Request received, continue |
| **2xx** | Success | It worked |
| **3xx** | Redirection | Go somewhere else |
| **4xx** | Client error | *You* (the client) made a mistake |
| **5xx** | Server error | *We* (the server) failed |

Quick memory trick: **4 = their fault, 5 = our fault.**

---

## 3. The Codes You Will Use 95% of the Time

### 2xx — Success
| Code | Name | When to use |
|------|------|-------------|
| **200** | OK | Successful GET, PUT, PATCH |
| **201** | Created | Successful POST that created a resource |
| **202** | Accepted | Work accepted, will finish later |
| **204** | No Content | Success with no body (often DELETE) |

### 3xx — Redirect
| Code | Name | When to use |
|------|------|-------------|
| **301** | Moved Permanently | URL changed forever |
| **302** | Found | Temporary redirect |
| **304** | Not Modified | Use your cached copy (automatic) |
| **307/308** | Temporary/Permanent Redirect | Redirect that keeps the method |

### 4xx — Client errors
| Code | Name | When to use |
|------|------|-------------|
| **400** | Bad Request | Invalid/missing input, malformed JSON |
| **401** | Unauthorized | Not authenticated (no/invalid login) |
| **403** | Forbidden | Authenticated but not allowed |
| **404** | Not Found | Resource/route does not exist |
| **405** | Method Not Allowed | Route exists but not for this method |
| **409** | Conflict | Duplicate, version conflict |
| **413** | Payload Too Large | Body exceeds limit |
| **415** | Unsupported Media Type | Wrong `Content-Type` |
| **422** | Unprocessable Entity | Syntax OK but fails validation rules |
| **429** | Too Many Requests | Rate limit exceeded |

### 5xx — Server errors
| Code | Name | When to use |
|------|------|-------------|
| **500** | Internal Server Error | Unexpected bug |
| **501** | Not Implemented | Feature not built yet |
| **502** | Bad Gateway | Upstream server returned garbage |
| **503** | Service Unavailable | Overloaded/maintenance |
| **504** | Gateway Timeout | Upstream took too long |

---

## 4. `res.status()`

```js
res.status(404);                 // sets status only; response not sent yet
res.status(404).send('Nope');    // chained: set status, then send
res.status(201).json(newPost);
res.sendStatus(204);             // sets status AND sends the reason phrase as body
```

`res.status()` returns `res`, which is why you can **chain** methods.

| Call | Status | Body |
|------|--------|------|
| `res.json(x)` | 200 | JSON x |
| `res.status(201).json(x)` | 201 | JSON x |
| `res.sendStatus(404)` | 404 | text `Not Found` |
| `res.status(204).end()` | 204 | empty |

### Order of chaining
`res.status(...)` must come **before** the call that sends (`send`, `json`, `end`):

```js
res.json({ a: 1 }).status(404);   // ❌ too late, response already sent with 200
```

---

## 5. Applying It to Our Posts API

```js
app.get('/api/posts', (req, res) => {
  res.status(200).json(posts);               // 200 is default; explicit is fine
});

app.get('/api/posts/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ message: `A post with id ${id} was not found` });
  }

  res.status(200).json(post);
});
```

Later lessons:
- `POST` success → **201 Created**
- `PUT` success → **200 OK** (with updated object)
- `DELETE` success → **200 OK** with message or **204 No Content**
- Missing `title` in POST body → **400 Bad Request**

---

## 6. 400 vs 404 vs 422 — Choosing Correctly

| Situation | Code |
|-----------|------|
| `/api/posts/abc` (id not a number) | 400 |
| `/api/posts/999` (valid id, nothing there) | 404 |
| POST body is not valid JSON | 400 |
| POST body valid JSON but `title` is empty | 400 or 422 (pick one and stay consistent) |
| Email already registered | 409 |
| Not logged in | 401 |
| Logged in but not admin | 403 |

> 🔐 **Security tip:** sometimes return **404 instead of 403** for resources a user must
> not even know exist (prevents enumeration). Also, use the *same* message for
> "wrong username" and "wrong password" (401) so attackers cannot discover which users exist.

---

## 7. Standard Error Response Shape

Pick one JSON shape for all errors and use it everywhere:

```json
{
  "status": 404,
  "message": "A post with id 99 was not found"
}
```

or

```json
{
  "error": { "code": "POST_NOT_FOUND", "message": "..." }
}
```

Clients love consistency. In lesson 24 we centralize this in an error handler.

---

## 8. Status Codes and Redirects

```js
app.get('/old-page', (req, res) => {
  res.redirect(301, '/new-page');   // permanent
});

app.get('/login-required', (req, res) => {
  res.redirect('/login');           // default is 302
});
```

| Redirect code | Browser caches? | Method changes POST→GET? |
|---------------|-----------------|--------------------------|
| 301 | Yes (long) | Often yes |
| 302 | No | Often yes |
| 307 | No | **Keeps** method |
| 308 | Yes | **Keeps** method |

Use **301** only when you are sure; browsers remember it aggressively.

---

## 9. Seeing Status Codes in Practice

### Browser DevTools → Network tab
Column **Status** shows `200`, `304`, `404` etc.

### curl
```bash
curl -i http://localhost:5000/api/posts/99
# HTTP/1.1 404 Not Found

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/posts/1
# 200
```

### Postman
Status badge at top right of the response panel.

---

## 10. `fetch` and Status Codes on the Front-End

```js
const res = await fetch('/api/posts/99');
console.log(res.status);     // 404
console.log(res.ok);         // false (true only for 200–299)
console.log(res.statusText); // 'Not Found'

if (!res.ok) {
  const err = await res.json();
  alert(err.message);
  return;
}
const post = await res.json();
```

**Remember:** `fetch` only rejects (throws) on *network failures*, not on 404/500.

---

## 11. Default Express 404

Without a matching route, Express responds:

```
HTTP/1.1 404 Not Found
Content-Type: text/html

Cannot GET /api/unknown
```

Better to return JSON for API paths — we will build a custom 404 handler in lesson 25.

---

## 12. Express Defaults When Errors Are Thrown

If your handler throws (sync) or calls `next(err)`:
- Express sets status **500** (or `err.status` / `err.statusCode` if present).
- In development shows a stack trace HTML page.
- In production (`NODE_ENV=production`) hides the stack.

```js
app.get('/boom', (req, res) => {
  throw new Error('Something broke');     // -> 500
});
```

(In Express 4, async functions that throw do **not** reach the error handler; Express 5
handles rejected promises automatically.)

---

## 13. Idempotency and Safe Methods (Background)

| Method | Safe (no change)? | Idempotent (same result if repeated)? |
|--------|-------------------|---------------------------------------|
| GET | ✅ | ✅ |
| HEAD | ✅ | ✅ |
| PUT | ❌ | ✅ |
| DELETE | ❌ | ✅ |
| POST | ❌ | ❌ |
| PATCH | ❌ | usually ❌ |

This influences status codes: repeating `DELETE /posts/1` the second time could return
404 (already gone) or 204 (still "deleted"); both are acceptable if documented.

---

## 14. Custom Status Messages

```js
res.statusMessage = 'Custom Phrase';
res.status(400).send('Bad input');
```

Rarely needed; HTTP/2 does not even transmit reason phrases. The numeric code is what
matters.

---

## 15. Complete Example

```js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
];

app.get('/api/posts', (req, res) => res.status(200).json(posts));

app.get('/api/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ status: 400, message: 'Invalid id' });
  }
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ status: 404, message: `Post ${id} not found` });
  }
  res.status(200).json(post);
});

app.get('/teapot', (req, res) => res.sendStatus(418));        // fun: I'm a teapot
app.get('/old', (req, res) => res.redirect(301, '/api/posts'));
app.get('/empty', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 16. Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Sending errors with status 200 | Clients cannot detect failure | Use 4xx/5xx |
| Using 500 for user mistakes | Misleading, triggers alerts | Use 400/404/422 |
| Using 404 for everything | No detail | Use the precise code |
| `res.status(204).json(data)` | 204 must have no body | Use `.end()` |
| Forgetting `return` | Double responses | `return res.status()...` |
| Mixing error shapes | Hard for clients | One shape for all errors |
| Revealing stack traces to clients | Information disclosure | Hide in production |

---

## 17. Exercises

1. Update `GET /api/posts/:id` to use proper 400 and 404 codes.
2. Create `/api/status/:code` that responds with that status code (validate 100–599).
3. Create `/old-route` redirecting permanently to `/api/posts`.
4. Create a route returning 204 with no body.
5. Use `curl -i` to inspect status lines for each route.
6. In the browser, `fetch` a missing post and print `res.ok`, `res.status`.
7. Define a single helper `sendError(res, status, message)` and use it in two routes.

### Challenge
Write a function `describeStatus(code)` that returns the family name ("Success",
"Client error", ...) based on the first digit.

<details><summary>Solution</summary>

```js
function describeStatus(code) {
  const families = { 1: 'Informational', 2: 'Success', 3: 'Redirection', 4: 'Client error', 5: 'Server error' };
  return families[Math.floor(code / 100)] || 'Unknown';
}
```
</details>

---

## 18. Quick Quiz

1. Which status family means "the client made a mistake"?
2. What is the difference between 401 and 403?
3. What is the status code for a successfully created resource?
4. Which method call sets a status and sends the reason phrase as body?
5. Does `fetch` throw an error on a 404 response?
6. Why should a 204 response have no body?
7. What does Express send by default if you do not set a status?

<details><summary>Answers</summary>

1. 4xx.
2. 401 = not authenticated; 403 = authenticated but not permitted.
3. 201.
4. `res.sendStatus(code)`.
5. No; check `res.ok`.
6. 204 means "No Content" by definition.
7. 200.
</details>

---

## 19. Summary

- Status codes are the first thing a client reads; use them honestly.
- 2xx success, 3xx redirect, 4xx client error, 5xx server error.
- Use `res.status(code)` before sending; chain with `.json()`/`.send()`/`.end()`.
- Choose precisely: 201 for created, 400 invalid input, 401/403 for auth, 404 missing, 409 conflict, 500 server bug.
- Keep one consistent error JSON shape.

---

## 20. Next Lesson

➡️ **16 — Multiple Responses**
Why "Cannot set headers after they are sent" happens, and how to prevent it.
