# 16 — Multiple Responses

> **Goal:** Understand why a request can only be answered **once**, recognise the
> error `ERR_HTTP_HEADERS_SENT`, and learn patterns that prevent it.

---

## 1. The Famous Error

```
Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
```

Almost every Express beginner meets this error. This lesson explains **exactly** why it
happens.

---

## 2. Prerequisite Concept: The Anatomy of a Response

An HTTP response is sent in this order:

```
1. Status line   ->  HTTP/1.1 200 OK
2. Headers       ->  Content-Type: ..., Content-Length: ...
3. Blank line
4. Body          ->  <html>... or {"json":...}
```

Once the **status line and headers have been written to the network**, they cannot be
changed. You cannot "take back" the first part. So the server may send **exactly one
response** per request.

Methods that **send** the response (finish the headers + body):

- `res.send()`
- `res.json()`
- `res.end()`
- `res.sendFile()`
- `res.render()`
- `res.redirect()`
- `res.sendStatus()`
- `res.download()`

Methods that only **prepare** (can be called many times before sending):

- `res.status()`
- `res.set()` / `res.header()`
- `res.cookie()`
- `res.type()`

---

## 3. Reproducing the Error

```js
app.get('/bad', (req, res) => {
  res.send('First response');
  res.send('Second response');   // 💥 ERR_HTTP_HEADERS_SENT
});
```

Walkthrough:
1. First `res.send` writes headers and the body, ends the response.
2. Second `res.send` tries to set `Content-Type` header again → Node refuses.

The client **does** receive "First response"; the error is thrown on the server side,
and appears in your terminal (and may crash your app if unhandled).

---

## 4. The Most Common Cause: Missing `return`

```js
app.get('/api/posts/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));

  if (!post) {
    res.status(404).json({ message: 'Not found' });    // responds…
  }

  res.json(post);       // …but code keeps running -> second response!
});
```

`res.status(404).json(...)` does **not** stop the function. JavaScript continues to the
next line.

### Fix 1 — `return` the response
```js
if (!post) {
  return res.status(404).json({ message: 'Not found' });
}
res.json(post);
```

### Fix 2 — `if / else`
```js
if (!post) {
  res.status(404).json({ message: 'Not found' });
} else {
  res.json(post);
}
```

### Fix 3 — separate `return;`
```js
if (!post) {
  res.status(404).json({ message: 'Not found' });
  return;
}
```

**Best practice:** *guard clause + `return res...`* — fail early, keep the main path
unindented.

---

## 5. Cause 2: Responding Inside Callbacks and Also After

```js
app.get('/file', (req, res) => {
  fs.readFile('data.txt', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error');       // missing return
    }
    res.send(data);                          // runs even on error
  });
  res.send('Done');                          // runs IMMEDIATELY (callback is async!)
});
```

Two bugs:
1. The final `res.send('Done')` runs **before** the file is read (callbacks are
   asynchronous), so the callback's response comes second → error.
2. The missing `return` after the error response.

Corrected:

```js
app.get('/file', (req, res) => {
  fs.readFile('data.txt', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error');
    res.send(data);
  });
});
```

### Prerequisite: Asynchronous code does not pause
```js
console.log('1');
setTimeout(() => console.log('2'), 0);
console.log('3');
// prints 1, 3, 2
```
Code after an async call runs **immediately**; the callback runs later.

---

## 6. Cause 3: `async/await` Without Waiting

```js
app.get('/users', async (req, res) => {
  db.query('SELECT * FROM users').then((rows) => res.json(rows));  // not awaited
  res.send('OK');       // runs first
});
```

Use `await` and a single response:

```js
app.get('/users', async (req, res) => {
  const rows = await db.query('SELECT * FROM users');
  res.json(rows);
});
```

---

## 7. Cause 4: Middleware Responds Then Calls `next()`

```js
app.use((req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).json({ message: 'No token' });   // responded
    // forgot return; falls through
  }
  next();                                            // continues to route -> 2nd response
});
```

Fix:

```js
app.use((req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'No token' });
  }
  next();
});
```

**Rule:** a middleware either **responds** or calls **`next()`** — never both.

---

## 8. Cause 5: Error Handler After Headers Sent

If an error occurs *after* the response has started streaming, Express's default error
handler closes the connection. In custom handlers check:

```js
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);            // let Express close the connection
  }
  res.status(500).json({ message: 'Server error' });
});
```

`res.headersSent` is `true` once headers have gone out.

---

## 9. Cause 6: Loops

```js
app.get('/list', (req, res) => {
  posts.forEach((p) => {
    res.json(p);        // ❌ sends on the first iteration, errors on the second
  });
});
```

Build the full result first, then respond once:

```js
app.get('/list', (req, res) => {
  const titles = posts.map((p) => p.title);
  res.json(titles);
});
```

---

## 10. Cause 7: `try/catch` Responding Twice

```js
app.get('/x', async (req, res) => {
  try {
    const data = await getData();
    res.json(data);
    doSomethingElse();           // throws!
  } catch (err) {
    res.status(500).json({ message: 'fail' });    // 2nd response, headers already sent
  }
});
```

Keep the `res.*` call as the **last** statement inside `try`, or track state:

```js
try {
  const data = await getData();
  doSomethingElse();
  res.json(data);
} catch (err) {
  if (!res.headersSent) res.status(500).json({ message: 'fail' });
}
```

---

## 11. Streaming Is the Exception: `res.write()`

You may intentionally send a body in **pieces**:

```js
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.write('part 1\n');
  setTimeout(() => {
    res.write('part 2\n');
    res.end('done\n');
  }, 1000);
});
```

Still **one response**: headers are sent once, the body is delivered in chunks, and
`res.end()` finishes it.

---

## 12. A Debugging Checklist

When you see `ERR_HTTP_HEADERS_SENT`:

1. Read the **stack trace** — the first line pointing to *your* file shows which `res.*`
   ran second.
2. Search that function for **every** `res.send/json/end/render/redirect`.
3. For each, ask: *"after this line, can the function continue?"* If yes, add `return`.
4. Look at **middleware before** the route: do they respond and then call `next()`?
5. Look for **async code** (callbacks, promises) with a response outside.
6. Add temporary logs:
   ```js
   console.log('responding from branch A');
   ```

---

## 13. Helper Pattern: A Single Exit Point

Build the result in variables and respond once at the end.

```js
app.get('/api/posts/:id', (req, res) => {
  let status = 200;
  let body;

  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!Number.isInteger(id)) {
    status = 400;
    body = { message: 'Invalid id' };
  } else if (!post) {
    status = 404;
    body = { message: 'Not found' };
  } else {
    body = post;
  }

  res.status(status).json(body);
});
```

Not always necessary, but it makes double-responding impossible.

---

## 14. Multiple *Formats*, One Response: Content Negotiation

You may want to "respond differently" depending on the client — but still only once.

```js
app.get('/info', (req, res) => {
  res.format({
    'text/plain': () => res.send('Plain text info'),
    'text/html': () => res.send('<p>HTML info</p>'),
    'application/json': () => res.json({ info: 'JSON info' }),
    default: () => res.status(406).send('Not Acceptable'),
  });
});
```

`res.format` looks at the `Accept` header and runs **one** branch.

---

## 15. Express 5 Note

In Express 5, if an `async` handler rejects (throws), Express automatically calls
`next(err)`. In Express 4 you must wrap with try/catch or a helper:

```js
// Express 4 helper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/users', asyncHandler(async (req, res) => {
  res.json(await db.getUsers());
}));
```

This ties into lesson 24 (error handling).

---

## 16. Complete Example: Before and After

### ❌ Buggy
```js
app.get('/api/posts/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) {
    res.status(404).json({ message: 'Not found' });
  }
  res.status(200).json(post);
});
```

### ✅ Fixed
```js
app.get('/api/posts/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));

  if (!post) {
    return res.status(404).json({ message: 'Not found' });
  }

  return res.status(200).json(post);
});
```

---

## 17. Exercises

1. Write a route that reproduces `ERR_HTTP_HEADERS_SENT`, then fix it.
2. Create a middleware that blocks requests without `?key=123`; make sure it uses
   `return` correctly.
3. Write a route using `fs.readFile` with a proper error branch.
4. Convert a `forEach` that responds inside the loop into a single response.
5. Use `res.headersSent` in a custom error middleware.
6. Implement `res.format` for `/hello` returning text/HTML/JSON.
7. Add `console.log` calls at each branch to see which one executes.

### Challenge
Write a route `/random-fail` that randomly (50%) succeeds or fails with 500, using a
**single** `res` call at the end of the function.

<details><summary>Solution</summary>

```js
app.get('/random-fail', (req, res) => {
  const ok = Math.random() < 0.5;
  const status = ok ? 200 : 500;
  const body = ok ? { ok: true } : { ok: false, message: 'Random failure' };
  res.status(status).json(body);
});
```
</details>

---

## 18. Quick Quiz

1. How many responses can one request receive?
2. Which methods send the response and which only prepare it?
3. Why does `res.status(404).json(...)` not stop a function?
4. What property tells you headers were already sent?
5. What rule applies to middleware regarding `next()` and responding?
6. Why is responding inside `forEach` problematic?

<details><summary>Answers</summary>

1. Exactly one.
2. `send/json/end/sendFile/render/redirect` send; `status/set/cookie/type` prepare.
3. It is just a function call; execution continues unless you `return`.
4. `res.headersSent`.
5. Either respond or call `next()`, not both.
6. It would send multiple responses.
</details>

---

## 19. Summary

- HTTP allows one response per request; headers cannot be rewritten after sending.
- `ERR_HTTP_HEADERS_SENT` = you tried to respond (or set headers) a second time.
- Fix with `return res...`, `if/else`, or a single exit point.
- Async code needs `await` or callbacks with careful returns.
- Middleware: respond **or** `next()`.
- Check `res.headersSent` in error handlers.

---

## 20. Next Lesson

➡️ **17 — Route Files**
Split the growing `server.js` into separate route modules using `express.Router`.
