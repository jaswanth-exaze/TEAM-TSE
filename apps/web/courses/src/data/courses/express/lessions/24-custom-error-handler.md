# 24 — Custom Error Handler

> **Goal:** Replace scattered `res.status(...).json(...)` error code with one central
> error-handling middleware, understand `next(err)`, and return safe, consistent errors.

---

## 1. The Problem: Repeated Error Code

Right now every route handles errors like this:

```js
if (!post) {
  return res.status(404).json({ message: 'Post not found' });
}
```

Issues:

1. **Duplication** — the same shape repeated in dozens of places.
2. **Inconsistency** — one route says `message`, another says `error`.
3. **Unexpected errors** (bugs, database failures) are not handled at all → ugly HTML
   with a stack trace, or a crashed process.
4. **Hard to change** — switching the error format means editing every route.

**Solution:** throw/forward an error and let **one function** turn it into a response.

---

## 2. Prerequisite Concept: Errors in JavaScript

```js
const err = new Error('Something went wrong');
console.log(err.message);   // 'Something went wrong'
console.log(err.name);      // 'Error'
console.log(err.stack);     // multi-line trace showing where it was created
```

### Throwing and catching
```js
function risky() { throw new Error('boom'); }

try {
  risky();
} catch (e) {
  console.log('Caught:', e.message);
}
```

### Built-in error types
`Error`, `TypeError`, `RangeError`, `SyntaxError`, `ReferenceError`.

### Custom error classes
```js
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}
```

An error is just an object — we can attach extra properties such as `status`.

---

## 3. How Express Handles Errors

Express recognises an **error-handling middleware** by its **four parameters**:

```js
(err, req, res, next) => { ... }
```

All four must be declared, **even if `next` is unused** — Express checks
`function.length === 4`.

Errors reach it in two ways:

### 3.1 A synchronous `throw` in a handler
```js
app.get('/boom', (req, res) => {
  throw new Error('Kaboom');        // Express catches it automatically
});
```

### 3.2 `next(err)` — pass the error explicitly
```js
app.get('/boom2', (req, res, next) => {
  next(new Error('Kaboom 2'));
});
```

When an error is forwarded, Express **skips all normal middleware** and jumps to the
next error-handling middleware.

```
request ─► [mw] ─► [route] ──throw/next(err)──┐
                                               ▼
                        [skips remaining normal middleware]
                                               ▼
                                   [ error handler (4 args) ] ─► response
```

### Async code
| Express version | `async` handler that throws/rejects |
|-----------------|--------------------------------------|
| **5** | Automatically forwarded to the error handler ✅ |
| **4** | **Not** forwarded — you must `try/catch` and call `next(err)` or use a wrapper |

```js
// Express 4-safe pattern
app.get('/x', async (req, res, next) => {
  try {
    const data = await getData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});
```

---

## 4. The Default Error Handler

If you do nothing, Express uses a built-in handler:

- Status = `err.status` / `err.statusCode` if valid, otherwise **500**.
- In development: sends the **stack trace** as HTML.
- In production (`NODE_ENV=production`): sends only the status text.

Showing stack traces to users is an **information disclosure vulnerability** (file paths,
library versions, SQL fragments). That's why we write our own handler.

---

## 5. Writing a Custom Error Handler

```js
// middleware/error.js
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    status,
    message: err.message || 'Internal Server Error',
  });
};
```

Register it **after all routes** (last):

```js
import { errorHandler } from './middleware/error.js';

app.use('/api/posts', posts);

app.use(errorHandler);           // ← last
```

---

## 6. Using It in Routes

### Before
```js
router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  res.json(post);
});
```

### After (create an error and forward it)
```js
router.get('/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    const error = new Error(`A post with the id of ${id} was not found`);
    error.status = 404;
    return next(error);        // goes to errorHandler
  }

  res.status(200).json(post);
});
```

Notice the `return` — we must stop executing the handler after `next(error)`.

Now **every** error leaves the application in the same JSON format.

---

## 7. A Reusable `HttpError` Class

Creating errors with two lines each time is repetitive. Make a class:

```js
// utils/HttpError.js
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;          // optional extra info (validation errors)
    Error.captureStackTrace?.(this, this.constructor);
  }
}
```

Usage:

```js
import { HttpError } from '../utils/HttpError.js';

router.get('/:id', (req, res, next) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return next(new HttpError(404, 'Post not found'));
  res.json(post);
});
```

Even shorter: **just `throw`** (works in sync handlers, and in async handlers on
Express 5):

```js
router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) throw new HttpError(404, 'Post not found');
  res.json(post);
});
```

---

## 8. A Better Error Handler

```js
// middleware/error.js
export const errorHandler = (err, req, res, next) => {
  // If the response already started, delegate to Express's default handler
  if (res.headersSent) {
    return next(err);
  }

  // 1) Known problem: invalid JSON from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 400, message: 'Invalid JSON in request body' });
  }

  // 2) Payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ status: 413, message: 'Request body too large' });
  }

  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log server errors for developers (never send details to the client in production)
  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    status,
    // For 5xx hide internal messages in production
    message: status >= 500 && isProduction ? 'Internal Server Error' : err.message,
    ...(err.details && { details: err.details }),
    ...(!isProduction && { stack: err.stack }),
  });
};
```

### What this achieves

| Feature | Benefit |
|---------|---------|
| `res.headersSent` check | Avoids "headers already sent" crash |
| Specific handling for parse errors | Clean 400 instead of HTML trace |
| Status from error | One place decides status |
| Logging only 5xx | Noise-free logs |
| Hide messages in production | No information leaks |
| Stack in development only | Easier debugging |

---

## 9. Operational vs Programmer Errors

| Type | Examples | What to do |
|------|----------|-----------|
| **Operational** (expected) | invalid input, missing resource, DB temporarily down, 3rd-party timeout | Handle: respond with proper status |
| **Programmer** (bugs) | `undefined.property`, typos, wrong logic | Log, return 500, fix the code |

Our `HttpError` represents operational errors. Anything else that reaches the handler is
treated as a bug → 500 and logged.

For truly unexpected states (uncaught exceptions), a process manager should restart the
app:

```js
process.on('uncaughtException', (err) => { console.error(err); process.exit(1); });
process.on('unhandledRejection', (reason) => { console.error(reason); process.exit(1); });
```

---

## 10. Validation Errors with Details

```js
router.post('/', (req, res, next) => {
  const { title } = req.body ?? {};
  const errors = [];

  if (typeof title !== 'string' || !title.trim()) errors.push({ field: 'title', message: 'required' });

  if (errors.length) {
    return next(new HttpError(400, 'Validation failed', errors));
  }
  // ...
});
```

Response:

```json
{
  "status": 400,
  "message": "Validation failed",
  "details": [{ "field": "title", "message": "required" }]
}
```

---

## 11. Express 4 Async Wrapper

```js
// utils/asyncHandler.js
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

```js
router.get('/', asyncHandler(async (req, res) => {
  const rows = await db.query('SELECT * FROM posts');
  res.json(rows);
}));
```

On Express 5 this wrapper is no longer necessary but harmless.

---

## 12. Multiple Error Handlers (Chain)

You can register several; each may handle or pass along with `next(err)`:

```js
app.use(logErrors);        // log and next(err)
app.use(clientErrorHandler);  // handle XHR errors, else next(err)
app.use(errorHandler);     // final handler
```

```js
function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}
```

---

## 13. Testing the Error Handler

Add temporary routes:

```js
app.get('/test/throw', () => { throw new Error('Sync error'); });
app.get('/test/next', (req, res, next) => next(new HttpError(418, "I'm a teapot")));
app.get('/test/async', async () => { throw new Error('Async error'); });  // Express 5
```

| Request | Expected |
|---------|----------|
| `GET /test/throw` | 500 JSON |
| `GET /test/next` | 418 JSON |
| `GET /test/async` | 500 JSON (Express 5) |
| `POST /api/posts` with invalid JSON | 400 "Invalid JSON" |
| `GET /api/posts/999` | 404 JSON |

Run with `NODE_ENV=production` and confirm `stack` disappears and 500 messages are generic.

---

## 14. Security Notes 🔐

- **Never** return `err.stack`, SQL errors or file paths in production.
- Use **generic messages** for authentication failures ("Invalid credentials").
- Log with a **request id** so you can match a user's report to the log line.
- Do not log sensitive data (passwords, tokens, full bodies).
- Different error wording for "user exists" vs "user not found" enables **user
  enumeration** — keep responses uniform where it matters.
- Always respond with JSON for API routes so clients never get HTML traces.

---

## 15. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Error handler declared with 3 args | Treated as normal middleware, never catches errors | Declare `(err, req, res, next)` |
| Handler registered before routes | Doesn't catch route errors | Register last |
| Calling `next(err)` without `return` | Code continues, double response | `return next(err)` |
| Forgetting `res.headersSent` check | Crash when error occurs mid-response | Delegate with `next(err)` |
| Sending `err.message` of DB errors | Information leak | Generic message for 5xx |
| `throw` inside callback (setTimeout, event) | Process crashes | try/catch and `next(err)` |
| Async handler without catch on Express 4 | Request hangs | try/catch or wrapper |
| Using `console.log` instead of `console.error` | Logs mixed | Use `console.error` |

---

## 16. Complete Example

### `utils/HttpError.js`
```js
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}
```

### `middleware/error.js`
```js
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  const prod = process.env.NODE_ENV === 'production';

  if (status >= 500) console.error(err);

  res.status(status).json({
    status,
    message: status >= 500 && prod ? 'Internal Server Error' : err.message,
    ...(err.details && { details: err.details }),
    ...(!prod && { stack: err.stack }),
  });
};
```

### `routes/posts.js` (excerpt)
```js
import { HttpError } from '../utils/HttpError.js';

router.get('/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);
  if (!post) return next(new HttpError(404, `A post with the id of ${id} was not found`));
  res.status(200).json(post);
});
```

### `server.js`
```js
import express from 'express';
import posts from './routes/posts.js';
import { errorHandler } from './middleware/error.js';

const app = express();
app.use(express.json());
app.use('/api/posts', posts);
app.use(errorHandler);                     // last
app.listen(5000);
```

---

## 17. Exercises

1. Create `middleware/error.js` and register it after the routes.
2. Convert the 404 in `GET /api/posts/:id` to use `next(error)`.
3. Create the `HttpError` class and use it in all routes.
4. Throw an error with `throw new Error('x')` in a route and see the JSON result.
5. Send invalid JSON via Postman and check the 400 response.
6. Run with `NODE_ENV=production` and compare responses.
7. Create a validation error with `details` array.
8. Add a request id (`crypto.randomUUID()`) in a middleware and include it in the log.

### Challenge
Write an `errorHandler` that returns **HTML** when the client's `Accept` header prefers
HTML and **JSON** otherwise (use `req.accepts(['json', 'html'])`).

<details><summary>Hint</summary>

```js
if (req.accepts(['json', 'html']) === 'html') {
  return res.status(status).send(`<h1>${status}</h1><p>${err.message}</p>`);
}
res.status(status).json({ status, message: err.message });
```
(Escape the message if it could contain user input!)
</details>

---

## 18. Quick Quiz

1. How does Express recognise an error-handling middleware?
2. Where must it be registered?
3. What does `next(err)` do?
4. Why should stack traces be hidden in production?
5. What is the difference between operational and programmer errors?
6. Why check `res.headersSent` inside the handler?
7. What changed for async handlers in Express 5?

<details><summary>Answers</summary>

1. It has four parameters `(err, req, res, next)`.
2. After all routes and other middleware.
3. Skips normal middleware and jumps to error handlers.
4. They leak internal details useful for attackers.
5. Operational = expected runtime problems; programmer = bugs.
6. If the response has started, you can't send another; delegate to Express.
7. Rejected promises/throws are forwarded automatically.
</details>

---

## 19. Summary

- A custom error handler centralises error responses: `(err, req, res, next)`, registered last.
- Forward errors with `next(err)` or `throw`; create status-carrying errors with an `HttpError` class.
- Return a consistent JSON shape; hide internals in production; log server errors.
- Handle special cases (invalid JSON, large payloads) and `res.headersSent`.
- Express 5 forwards async errors; Express 4 needs try/catch or a wrapper.

---

## 20. Next Lesson

➡️ **25 — Catch-All Error Middleware**
Handle unknown routes (404) and make sure nothing escapes unhandled.
