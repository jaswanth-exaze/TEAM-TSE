# 14. Simple Routing

## Before We Start

A server can receive many requests:

```text
GET  /api/tasks
GET  /api/tasks/42
POST /api/tasks
```

The server needs to decide which code should handle each request.

This is **routing**.

A route is mainly identified by:

```text
HTTP method + path
```

So:

```text
GET /api/tasks
```

and:

```text
POST /api/tasks
```

are different routes.

## Concept

**Routing** means deciding what to do based on the request method and path.

```text
Request
   │
   ├─ match → route handler
   │
   └─ no match → 404
```

## Step 1: JSON Helper

```js
function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(data));
}
```

This avoids repeating the same response code.

## Step 2: Create Routes

```js
import 'dotenv/config';
import http from 'node:http';

const PORT = Number(process.env.PORT) || 3000;

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  const { method } = req;

  if (method === 'GET' && pathname === '/') {
    return sendJson(res, 200, {
      message: 'Welcome to Task API'
    });
  }

  if (method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (method === 'GET' && pathname === '/api/tasks') {
    return sendJson(res, 200, [
      { id: '1', title: 'Learn routing', done: false }
    ]);
  }

  sendJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
```

`URL` helps us get only the pathname.

For:

```text
/api/tasks?done=true
```

the pathname is:

```text
/api/tasks
```

## Step 3: Test

```text
GET /              → 200
GET /api/health    → 200
GET /api/tasks     → 200
GET /nope          → 404
POST /api/tasks    → 404
```

The last request is not implemented yet.

## Route Parameters

Consider:

```text
/api/tasks/42
```

`42` is a **route parameter** representing the task ID.

With Node's basic HTTP module:

```js
const match = pathname.match(/^\/api\/tasks\/([^/]+)$/);

if (method === 'GET' && match) {
  const id = match[1];

  return sendJson(res, 200, {
    id,
    title: `Task ${id}`
  });
}
```

For `/api/tasks/42`:

```text
match[1] → "42"
```

You do not need to master regular expressions yet; understand that this pattern extracts the ID.

## 404 vs 405

- **404 Not Found** → no matching resource/route.
- **405 Method Not Allowed** → the path exists, but that method is not allowed.

We can refine this later.

## Why Simple Routing Gets Messy

A few `if` statements are fine. With many routes, one large chain becomes difficult to maintain.

Later we will use a cleaner route table and eventually a framework such as Express.

## Common Mistakes

- Checking `req.url` when only the pathname is needed.
- Forgetting to check both method and path.
- Returning success for unknown routes.
- Forgetting `res.end()`.
- Treating `/api/tasks` and `/api/tasks/42` as the same route.

## Try It

Add:

```text
GET /api/about
```

returning:

```json
{
  "app": "task-api",
  "version": "1.0.0"
}
```

---
