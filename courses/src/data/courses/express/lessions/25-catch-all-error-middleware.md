# 25 — Catch-All Error Middleware

> **Goal:** Handle requests that match **no route** (404 Not Found), connect them to the
> error handler, and make the app robust against anything that slips through.

---

## 1. The Problem: Unknown URLs

Visit `http://localhost:5000/api/doesnotexist`. Express answers with its default:

```
Cannot GET /api/doesnotexist
```

- It is **plain HTML text**, not JSON.
- It does not match the style of our error handler.
- Front-end code expecting JSON breaks (`Unexpected token C in JSON`).

We want **every** unmatched request to produce our standard JSON 404.

---

## 2. Prerequisite Concept: Why Order Matters (Again)

Express checks middleware/routes **top to bottom**. If a request passes through **all**
of them without anything responding, we reach the end of the stack. A middleware placed
**after all routes** is therefore only reached by requests that **nothing else handled**.

```
request
  │
  ▼
[logger] ► [parsers] ► [static] ► [/api/posts router] ► [/api/users router]
                                                              │ (nothing matched)
                                                              ▼
                                                    [ 404 catch-all middleware ]
                                                              │ next(error)
                                                              ▼
                                                    [ error handler ]
```

---

## 3. The 404 Catch-All Middleware

```js
// middleware/notFound.js
import { HttpError } from '../utils/HttpError.js';

export const notFound = (req, res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
```

Register after the routes and **before** the error handler:

```js
app.use('/api/posts', posts);

app.use(notFound);        // catches everything unmatched
app.use(errorHandler);    // formats every error
```

Now:

```json
GET /api/doesnotexist  →  404
{
  "status": 404,
  "message": "Route not found: GET /api/doesnotexist"
}
```

### Why `app.use` with no path works as catch-all
`app.use(fn)` matches **every** path and method. Because it's registered last, only
unhandled requests arrive.

### Alternative inline version
```js
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});
```

---

## 4. The Three Final Layers

A well-structured `server.js` ends like this:

```js
// 1. normal routes
app.use('/api/posts', posts);

// 2. catch-all for unmatched requests → creates 404 error
app.use(notFound);

// 3. error handler → turns any error into a response
app.use(errorHandler);
```

| Layer | Arity | Job |
|-------|-------|-----|
| Routes | `(req, res)` | Normal work |
| `notFound` | `(req, res, next)` | Creates a 404 error for unmatched requests |
| `errorHandler` | `(err, req, res, next)` | Formats **all** errors |

---

## 5. A Subtle Point: Wrong Method on an Existing Path

`DELETE /api/posts` (no id) is not defined. Express treats it as "no route" → 404.
Strictly, HTTP says **405 Method Not Allowed** (with an `Allow` header). You can
implement it:

```js
router.all('/', (req, res, next) => {
  res.set('Allow', 'GET, POST');
  next(new HttpError(405, `Method ${req.method} not allowed on this resource`));
});
```

`router.all()` matches **every** method; define it **after** the specific ones so they
win first.

---

## 6. HTML Pages vs API Routes

If your app serves both pages and API:

```js
// API-specific 404 (JSON)
app.use('/api', (req, res, next) => {
  next(new HttpError(404, 'API route not found'));
});

// Everything else (pages) → HTML 404 page
app.use((req, res) => {
  res.status(404).sendFile('404.html', { root: 'public' });
});

// Error handler last
app.use(errorHandler);
```

You can also choose based on the client's `Accept` header or on whether the path starts
with `/api`.

---

## 7. Express 5 vs Express 4 Wildcards

Sometimes people write a catch-all **route**:

```js
// Express 4
app.all('*', (req, res) => res.status(404).json({ message: 'Not found' }));

// Express 5 (path-to-regexp v8): wildcard needs a name
app.all('/{*splat}', (req, res) => res.status(404).json({ message: 'Not found' }));
```

`'*'` alone throws an error in Express 5. The `app.use(notFound)` approach (no path)
works in **both** versions and is preferred.

---

## 8. Making Sure Nothing Escapes

Even with handlers, serious problems may happen outside the request cycle:

```js
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // In production: log, then shut down gracefully and let the process manager restart
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
```

| Event | Cause |
|-------|-------|
| `unhandledRejection` | A Promise rejected and nobody handled it |
| `uncaughtException` | A sync error thrown outside any try/catch (e.g., inside a `setTimeout` callback) |

After an uncaught exception, the process state is unreliable: **log and exit**; let
systemd/PM2/Docker restart it.

### Graceful shutdown (concept)

```js
const server = app.listen(PORT);

process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
```

`SIGTERM` is the polite "please stop" signal sent by systemd, Docker, Kubernetes. You
know signals from Linux (`kill -15`, `Ctrl+C` = `SIGINT`).

---

## 9. Security Benefits 🔐

1. **Uniform 404s** → no differences that reveal which paths exist.
2. **No stack traces** from the default HTML handler.
3. **No framework fingerprint** — default Express pages reveal the framework; custom
   JSON does not (also `app.disable('x-powered-by')` or `helmet`).
4. **Logging 404s** helps detect scanning: many 404s from one IP for paths like
   `/wp-admin`, `/.env`, `/phpmyadmin`, `/.git/config` is typical reconnaissance.

Log them:

```js
export const notFound = (req, res, next) => {
  console.warn(`404 ${req.method} ${req.originalUrl} from ${req.ip}`);
  next(new HttpError(404, 'Route not found'));
};
```

(Combine with a rate limiter or fail2ban-like tooling on the server.)

> Do not echo `req.originalUrl` into HTML responses without escaping (reflected XSS).
> In JSON it is safe, but keep messages simple anyway.

---

## 10. Full Example

### `middleware/notFound.js`
```js
import { HttpError } from '../utils/HttpError.js';

export const notFound = (req, res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
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
  });
};
```

### `server.js`
```js
import express from 'express';
import posts from './routes/posts.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static('public'));

app.use('/api/posts', posts);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('SIGTERM', () => server.close(() => process.exit(0)));
```

---

## 11. Testing Table

| Request | Expected status | Handled by |
|---------|-----------------|------------|
| `GET /api/posts` | 200 | router |
| `GET /api/posts/999` | 404 (post) | router → `next(err)` → errorHandler |
| `GET /api/unknown` | 404 (route) | notFound → errorHandler |
| `PATCH /api/posts/1` (not defined) | 404 (or 405) | notFound |
| `POST /api/posts` invalid JSON | 400 | errorHandler (parse error) |
| `GET /boom` (throws) | 500 | errorHandler |

Test with:

```bash
curl -i http://localhost:5000/api/unknown
curl -i -X PATCH http://localhost:5000/api/posts/1
```

---

## 12. Debugging Tips

- If your 404 handler **never runs**, something earlier is responding (e.g., a wildcard
  route or `express.static` fallback).
- If it **always runs**, you placed it **before** your routes.
- If the error handler isn't used, check that it has **4 parameters**.
- If you see the default `Cannot GET ...`, your `notFound` isn't registered or is
  registered after something that ended the request.
- Print the stack of registered layers during learning (Express 4: `app._router.stack`).

---

## 13. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| 404 middleware before routes | Everything 404s | Move to the end |
| Error handler before 404 middleware | 404 errors uncaught by handler | Handler last |
| Using `app.get('*')` on Express 5 | Startup error `Missing parameter name` | `app.use(notFound)` or `'/{*splat}'` |
| Sending HTML 404 for API | JSON clients break | JSON for `/api` |
| Not logging 404 scans | No visibility | Log method, URL, IP |
| Forgetting `process.on` handlers | Silent crashes | Add logging + exit |
| Keeping process alive after uncaughtException | Corrupt state | Exit and restart |

---

## 14. Exercises

1. Add `notFound` and `errorHandler` to your project in the right order.
2. Test an unknown URL and confirm JSON.
3. Implement 405 for `DELETE /api/posts` including the `Allow` header.
4. Add a separate HTML 404 page for non-API paths.
5. Log every 404 with IP and user agent.
6. Add `unhandledRejection` handling and trigger it with `Promise.reject(new Error('x'))`.
7. Implement SIGTERM handling and test with `kill -15 <pid>`.
8. Move the `notFound` middleware above the router and observe the effect.

### Challenge
Build a middleware that counts 404s per IP and responds `429` after 10 misses in a
minute (a mini "scanner blocker").

<details><summary>Solution idea</summary>

```js
const misses = new Map();
setInterval(() => misses.clear(), 60_000).unref();

export const notFound = (req, res, next) => {
  const n = (misses.get(req.ip) || 0) + 1;
  misses.set(req.ip, n);
  if (n > 10) return next(new HttpError(429, 'Too many invalid requests'));
  next(new HttpError(404, 'Route not found'));
};
```
</details>

---

## 15. Quick Quiz

1. Where must the 404 middleware be registered?
2. What is the difference between `notFound` and `errorHandler` arity?
3. Why is `app.use(notFound)` safer than `app.all('*')`?
4. Which status code means "method not allowed"?
5. What should you do after an `uncaughtException`?
6. What does `SIGTERM` mean?
7. Why log 404s?

<details><summary>Answers</summary>

1. After all routes, before the error handler.
2. `notFound` has 3 params; `errorHandler` has 4.
3. It works in Express 4 and 5; wildcard syntax differs.
4. 405.
5. Log and exit; let a supervisor restart.
6. A polite termination request to the process.
7. To detect scanning and broken links.
</details>

---

## 16. Summary

- A catch-all middleware placed after all routes converts unmatched requests into 404 errors.
- The error handler then formats them consistently.
- Final stack order: routes → `notFound` → `errorHandler`.
- Handle 405 for known paths with wrong methods, and separate JSON vs HTML 404s.
- Add process-level handlers (`unhandledRejection`, `uncaughtException`, `SIGTERM`).
- Uniform errors and logged 404s improve security.

---

## 17. Next Lesson

➡️ **26 — Colors Package**
Make the console output readable by colouring logs (status codes, methods, errors).
