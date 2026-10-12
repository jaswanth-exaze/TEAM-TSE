# 23 — Middleware

> **Goal:** Master the heart of Express: what middleware is, the `(req, res, next)`
> signature, the order of execution, types of middleware, and how to write your own
> (logger, auth check, etc.).

---

## 1. What Is Middleware?

> **Middleware** is a function that has access to the request (`req`), the response
> (`res`) and the next function in the pipeline (`next`).

It can:

1. Execute any code.
2. **Modify** `req` and `res` (add properties, set headers).
3. **End** the request–response cycle (send a response).
4. **Pass control** to the next middleware by calling `next()`.

Analogy — **airport security**:

```
Passenger (request)
   |
   v
[ Ticket check ] -> [ ID check ] -> [ Baggage scan ] -> [ Gate (route handler) ]
   any station can stop the passenger (send a response)
   or let them continue (next)
```

---

## 2. You Already Used Middleware

| Code | Middleware? |
|------|-------------|
| `app.use(express.static('public'))` | ✅ |
| `app.use(express.json())` | ✅ |
| `app.use(express.urlencoded(...))` | ✅ |
| `app.use('/api/posts', router)` | ✅ (a router is middleware) |
| `app.get('/', (req, res) => ...)` | ✅ (route handler is the last middleware) |

Everything in Express is middleware. The app is a **stack of functions** executed in order.

---

## 3. The Signature

```js
function myMiddleware(req, res, next) {
  // do something
  next();     // pass control onward
}
```

| Parameter | Meaning |
|-----------|---------|
| `req` | The request object (shared by all middleware for this request) |
| `res` | The response object |
| `next` | A function: "I'm done; run the next middleware" |

A middleware must do **exactly one** of:

- call `next()`, **or**
- send a response (`res.send/json/end/...`), **or**
- call `next(err)` to signal an error (lesson 24).

If it does none, the request **hangs** until the client times out.

---

## 4. Our First Middleware: A Logger

```js
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  next();
};

app.use(logger);
```

Visit any URL — the console prints:

```
GET http://localhost:5000/api/posts
GET http://localhost:5000/api/posts/1
```

### Explanation
- `req.method` → `GET`
- `req.protocol` → `http`
- `req.get('host')` → `localhost:5000`
- `req.originalUrl` → `/api/posts/1` (full path with query)
- `next()` → continue to the next function

Put it **before** the routes to log every request.

---

## 5. Order of Execution

Middleware runs **in the order you register it** (top to bottom).

```js
app.use((req, res, next) => { console.log('A'); next(); });
app.use((req, res, next) => { console.log('B'); next(); });
app.get('/', (req, res) => { console.log('C'); res.send('done'); });
app.use((req, res, next) => { console.log('D'); next(); });   // never reached for GET /
```

Request `GET /` prints: `A`, `B`, `C`. After `C` sends the response, nothing else runs.

### Flow diagram

```
 request
   │
   ▼
 [A] ──next()──► [B] ──next()──► [route C] ── res.send() ──► response
                                     (D not reached)
```

**Rule:** register general middleware (logging, parsers, security) **first**, specific
routes next, 404 and error handlers **last**.

---

## 6. Types of Middleware

### 6.1 Application-level
Bound to `app` with `app.use()` or `app.METHOD()`.

```js
app.use(logger);                   // all requests
app.use('/api', logger);           // only paths starting with /api
app.get('/secret', auth, handler); // route-specific
```

### 6.2 Router-level
Same as application-level but bound to a `Router`.

```js
router.use(logger);
router.get('/', auth, handler);
```

### 6.3 Built-in (shipped with Express)
`express.json()`, `express.urlencoded()`, `express.static()`, `express.text()`, `express.raw()`.

### 6.4 Third-party
Installed from npm: `morgan` (logging), `helmet` (security headers), `cors`,
`cookie-parser`, `express-session`, `multer`, `express-rate-limit`, `compression`.

### 6.5 Error-handling
Four parameters `(err, req, res, next)` — lesson 24.

---

## 7. Where to Apply Middleware

```js
// 1. Every request
app.use(logger);

// 2. Only requests whose path starts with /api
app.use('/api', logger);

// 3. Only for one route
app.get('/profile', auth, (req, res) => res.send('profile'));

// 4. Several in a row for one route
app.post('/posts', auth, validatePost, createPost);

// 5. Array of middleware
app.get('/admin', [auth, isAdmin], handler);
```

Per-route middleware is evaluated left to right; if one responds, the rest do not run.

---

## 8. Storing Data on `req`

Middleware can attach information for later handlers:

```js
const addTimestamp = (req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
};

app.use(addTimestamp);

app.get('/time', (req, res) => {
  res.json({ requestedAt: req.requestTime });
});
```

Common real-world uses: `req.user` (after authentication), `req.id` (request id),
`req.body` (parsers).

For per-request data that should not clash with Express's own properties, some people
use `res.locals` (also available in templates):

```js
res.locals.user = { name: 'Asha' };
```

---

## 9. Example: A Simple Authentication Gate

```js
const requireKey = (req, res, next) => {
  const key = req.get('x-api-key');

  if (key !== process.env.API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });   // stop here
  }

  next();                                                        // allowed
};

app.use('/api', requireKey);
```

- Note `return` before `res...` so `next()` is not also called.
- This is only a demonstration; real apps use sessions or JWT and constant-time
  comparison for secrets.

Test in Postman: add header `x-api-key: abc123` (matching your `.env`) → 200; omit it → 401.

---

## 10. Example: Request Timer (Uses the `finish` Event)

Middleware can run code **after** the response is sent by listening to events:

```js
const timer = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms.toFixed(1)} ms`);
  });

  next();
};

app.use(timer);
```

Output:

```
GET /api/posts 200 - 2.3 ms
GET /api/posts/99 404 - 0.8 ms
```

This is essentially what `morgan` does.

---

## 11. Middleware Factories (Configurable Middleware)

A function that **returns** a middleware lets you pass options (a closure):

```js
const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

app.delete('/api/posts/:id', requireRole('admin'), deletePost);
```

`express.json({ limit: '10kb' })` is exactly this pattern.

---

## 12. Moving Middleware to Its Own File

```
middleware/
└── logger.js
```

```js
// middleware/logger.js
export const logger = (req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
};
```

```js
// server.js
import { logger } from './middleware/logger.js';
app.use(logger);
```

Or default export:

```js
export default logger;
// import logger from './middleware/logger.js';
```

---

## 13. Using Third-Party Middleware: `morgan`

```bash
npm install morgan
```

```js
import morgan from 'morgan';
app.use(morgan('dev'));
```

Output: `GET /api/posts 200 3.512 ms - 250`.
Formats: `dev`, `combined` (Apache style for production), `tiny`, `short`, custom.

### Security basics with `helmet`

```bash
npm install helmet
```

```js
import helmet from 'helmet';
app.use(helmet());
```

Adds headers like `X-Content-Type-Options`, `Strict-Transport-Security`, removes
`X-Powered-By`.

---

## 14. Async Middleware

```js
const loadUser = async (req, res, next) => {
  try {
    req.user = await db.findUser(req.get('x-user-id'));
    next();
  } catch (err) {
    next(err);          // pass errors to the error handler
  }
};
```

Express 5 forwards rejected promises automatically; in Express 4 you need try/catch (or
a wrapper) — otherwise the request hangs and you may get "unhandled rejection".

---

## 15. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting `next()` | Request hangs forever | Call `next()` or respond |
| Calling `next()` after responding | `ERR_HTTP_HEADERS_SENT` | `return` after responding |
| Registering middleware **after** routes | It never runs | Register earlier |
| Registering body parser after routers | `req.body` undefined | Order! |
| Doing heavy sync work in middleware | Blocks all requests | Use async APIs |
| Forgetting `return` in guard | Double flow | `return res...` |
| `app.use(logger())` when logger is not a factory | `logger is not a function` error | `app.use(logger)` |
| Wrong arity `(req, res)` | `next` undefined | Add `next` |
| Placing error handler before routes | Never catches | Put last |

---

## 16. Debugging the Pipeline

Add a quick tracing middleware:

```js
app.use((req, res, next) => {
  console.log('→ entering', req.method, req.url);
  res.on('finish', () => console.log('← leaving ', res.statusCode));
  next();
});
```

If you see "entering" without "leaving", something never responded.

---

## 17. Complete Example

```js
import express from 'express';
import posts from './routes/posts.js';
import { logger } from './middleware/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

// 1) general middleware first
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 2) routes
app.use('/api/posts', posts);

// 3) 404 and error handlers go last (lessons 24–25)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 18. Exercises

1. Write `logger` middleware printing method, URL and time.
2. Add `req.requestTime` and return it from `/time`.
3. Create `requireKey` and protect `/api` with an `x-api-key` header.
4. Write `requireRole('admin')` as a middleware factory.
5. Create the timer middleware using `res.on('finish')`.
6. Install `morgan` and compare its output to your logger.
7. Prove that order matters by moving `express.json()` after the router.
8. Move your middleware into `middleware/` and import it.

### Challenge
Write middleware `rateLimit(maxPerMinute)` keeping a counter per `req.ip` in an object.
After `maxPerMinute` requests in the same minute respond `429 Too Many Requests`.

<details><summary>Solution idea</summary>

```js
export const rateLimit = (max) => {
  const hits = new Map();
  setInterval(() => hits.clear(), 60_000).unref();

  return (req, res, next) => {
    const count = (hits.get(req.ip) || 0) + 1;
    hits.set(req.ip, count);
    if (count > max) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    next();
  };
};
```
(Production: use `express-rate-limit`.)
</details>

---

## 19. Quick Quiz

1. What are the three parameters of a normal middleware?
2. What happens if middleware neither calls `next()` nor responds?
3. In what order does Express run middleware?
4. What is a middleware factory?
5. Why must `express.json()` come before routes?
6. How can middleware pass data to later handlers?
7. How many parameters make an error-handling middleware?

<details><summary>Answers</summary>

1. `req`, `res`, `next`.
2. The request hangs.
3. The order of registration.
4. A function returning a middleware, allowing configuration.
5. Otherwise `req.body` isn't populated when the route runs.
6. By attaching properties to `req` or `res.locals`.
7. Four: `(err, req, res, next)`.
</details>

---

## 20. Summary

- Middleware = `(req, res, next)` functions forming a pipeline.
- Each either responds or calls `next()` (or `next(err)`).
- Order is everything: parsers/logging first, routes next, 404/error handlers last.
- Types: application, router, built-in, third-party, error-handling.
- Factories give configurable middleware; `req` / `res.locals` carry data forward.

---

## 21. Next Lesson

➡️ **24 — Custom Error Handler**
Create one central place to turn errors into clean responses.
