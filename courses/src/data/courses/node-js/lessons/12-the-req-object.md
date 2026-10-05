# 12. The `req` Object

## Before We Start

An HTTP request can contain:

```text
Method  → GET
URL     → /api/tasks?done=true
Headers → request metadata
Body    → optional data sent by the client
```

Node.js gives us this information through the `req` object.

## Concept

`req` means **request**. It is an `http.IncomingMessage` containing information sent by the client.

Think:

> `req` = "What did the client send?"

```text
HTTP request
   ├─ method
   ├─ URL/query
   ├─ headers
   └─ optional body
        ↓
      req
```

## Inspect the Request

```js
const server = http.createServer((req, res) => {
  console.log('Method :', req.method);
  console.log('URL    :', req.url);
  console.log('Headers:', req.headers);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  }));
});
```

Try:

```text
http://localhost:3000/hello?name=sam
```

## Important Properties

| Property | Example | Meaning |
|---|---|---|
| `req.method` | `"GET"` | HTTP method |
| `req.url` | `"/api/tasks?done=true"` | Path + query string |
| `req.headers` | `{ host, ... }` | Request metadata |
| `req.httpVersion` | `"1.1"` | HTTP version |
| `req.socket.remoteAddress` | `"::1"` | Client IP |

Header names are normally lowercase:

```js
req.headers['content-type']
```

## HTTP Methods

```text
GET     → read
POST    → create
PUT     → replace
PATCH   → partially update
DELETE  → remove
OPTIONS → commonly used for CORS preflight
```

## Path and Query Parameters

For:

```text
/api/tasks?done=true
```

the pathname is:

```text
/api/tasks
```

and the query parameter is:

```text
done=true
```

Parse them with `URL`:

```js
const url = new URL(req.url, `http://${req.headers.host}`);

console.log(url.pathname);
console.log(url.searchParams.get('done'));
```

## Request Body

`POST`, `PUT`, and `PATCH` often send data in the request body.

For example:

```json
{ "title": "Learn Node.js" }
```

With Node's basic `http` module, the body does **not** automatically appear as `req.body`.

`req` is a readable stream, so the body arrives in chunks. We will learn to read it later.

## Common Mistakes

- Confusing `req.url` with only the pathname.
- Expecting `req.body` to already exist.
- Confusing query parameters with the body.
- Assuming every request has a body.

## Try It

Visit:

```text
/a/b/c?x=1&y=2
```

Return the pathname, `x`, and `y` as JSON.

---
