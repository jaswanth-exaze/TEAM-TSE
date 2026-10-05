# 16. Building a Simple API

## Before We Start

An **API** is a way for one program to communicate with another program.

For example:

```text
Frontend
   │
   │ GET /api/tasks
   ▼
Node.js API
   │
   │ JSON
   ▼
Frontend
```

An **endpoint** is a specific API address that a client can request.

For example:

```text
GET /api/tasks
```

Here:

```text
GET        → operation
/api/tasks → resource path
```

## Concept: REST-style API

A REST-style API commonly represents data as **resources**.

Our resource is:

```text
tasks
```

HTTP methods describe the operation:

| Action | Method + Path | Success |
|---|---|---|
| List | `GET /api/tasks` | 200 |
| Read one | `GET /api/tasks/:id` | 200 / 404 |
| Create | `POST /api/tasks` | 201 |
| Replace | `PUT /api/tasks/:id` | 200 |
| Update part | `PATCH /api/tasks/:id` | 200 |
| Delete | `DELETE /api/tasks/:id` | 204 |

In this topic we focus on reading and deleting data. Creating/updating requires reading the request body, which comes later.

## JSON Responses

APIs commonly exchange data as **JSON**:

```json
{
  "id": "1",
  "title": "Learn Node.js",
  "done": false
}
```

The basic flow is:

```text
Client request
     ↓
API route
     ↓
Handler
     ↓
Data
     ↓
JSON response + status
```

## Step 1: In-Memory Data

```js
let tasks = [
  {
    id: '1',
    title: 'Learn Node.js',
    done: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Build an API',
    done: false,
    createdAt: new Date().toISOString()
  }
];
```

This is **in-memory** data. It disappears when the server restarts.

## Step 2: JSON Helper

```js
function sendJson(res, status, data) {
  const body = JSON.stringify(data);

  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });

  res.end(body);
}
```

`JSON.stringify()` converts a JavaScript value into a JSON string.

## Step 3: Endpoints

```js
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  const { method } = req;

  if (method === 'GET' && pathname === '/api/tasks') {
    const done = url.searchParams.get('done');

    const result = done === null
      ? tasks
      : tasks.filter(t => String(t.done) === done);

    return sendJson(res, 200, result);
  }

  const match = pathname.match(/^\/api\/tasks\/([^/]+)$/);

  if (method === 'GET' && match) {
    const task = tasks.find(t => t.id === match[1]);

    if (!task) {
      return sendJson(res, 404, { error: 'Task not found' });
    }

    return sendJson(res, 200, task);
  }

  if (method === 'DELETE' && match) {
    const before = tasks.length;

    tasks = tasks.filter(t => t.id !== match[1]);

    if (tasks.length === before) {
      return sendJson(res, 404, { error: 'Task not found' });
    }

    res.writeHead(204);
    return res.end();
  }

  sendJson(res, 404, { error: 'Not Found' });
});
```

## Understand the Endpoints

```text
GET /api/tasks
```

gets all tasks.

```text
GET /api/tasks?done=false
```

filters using a query parameter.

```text
GET /api/tasks/1
```

gets one task. Here `1` is the **route parameter** `id`.

```text
DELETE /api/tasks/2
```

deletes task 2.

## Why 204?

`204 No Content` means the operation succeeded and there is no response body.

It is useful for successful deletes.

## Test the API

```text
GET /api/tasks       → list
GET /api/tasks/1     → one task
GET /api/tasks/999   → 404
GET /api/tasks?done=false → filtered list
DELETE /api/tasks/2  → 204
```

## API Design Rules

1. Use resource nouns:

```text
/api/tasks
```

rather than:

```text
/api/getTasks
```

2. Use the HTTP method to describe the operation.

3. Use appropriate status codes.

4. Use `Content-Type: application/json` for JSON.

5. Do not expose internal errors, stack traces, passwords, or file paths.

## Common Mistakes

- Thinking an API is only a URL.
- Forgetting that method + path define the operation.
- Using `200` for every situation.
- Forgetting `404` for a missing resource.
- Expecting in-memory data to survive a restart.
- Forgetting `JSON.stringify()` when sending JSON with the basic `http` module.

## Try It

Add:

```text
GET /api/tasks?search=node
```

that returns tasks whose title contains `node`, case-insensitively.

---
