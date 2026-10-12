# 13. Making Requests from Postman

## Before We Start

A browser address bar is mainly convenient for `GET` requests.

APIs also use:

```text
POST  PUT  PATCH  DELETE
```

To test these requests easily, we can use **Postman**.

## Concept

Postman is an API testing tool. It acts as a client that lets us choose the:

- HTTP method
- URL
- headers
- request body

and then inspect the server's response.

```text
Postman
   │ HTTP request
   ▼
Node.js server
   │ HTTP response
   ▼
Postman response
```

For example:

```text
POST /api/tasks
```

might contain:

```text
Header: Content-Type: application/json
Body:   { "title": "Learn Node.js" }
```

## Steps in Postman

### 1. Start the server

```bash
node server.js
```

Assume it runs at:

```text
http://localhost:3000
```

### 2. Send GET

Create:

**New → HTTP Request**

Choose:

```text
GET
http://localhost:3000/hello?name=sam
```

Click **Send**.

Check:

- Status
- Body
- Headers
- Response time

### 3. Send JSON with POST

Choose:

```text
POST
http://localhost:3000/api/tasks
```

Go to:

```text
Body → raw → JSON
```

Enter:

```json
{ "title": "Learn Node.js" }
```

The request should use:

```text
Content-Type: application/json
```

This tells the server that the body is JSON.

### 4. Add Headers

Example:

```text
x-api-key: my-secret-key-123
```

The server can read it using:

```js
req.headers['x-api-key']
```

Do not use real secrets in examples.

### 5. Save Requests

A **Collection** is a group of saved requests.

```text
Task API
├── Get tasks
├── Create task
└── Delete task
```

This makes repeated testing easier.

### 6. Use Variables

Create:

```text
baseUrl = http://localhost:3000
```

Then use:

```text
{{baseUrl}}/api/tasks
```

## `curl` Alternative

GET:

```bash
curl http://localhost:3000/api/tasks
```

POST:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Node.js"}'
```

DELETE:

```bash
curl -X DELETE http://localhost:3000/api/tasks/123
```

## What to Check

For every API response, check:

1. Status code
2. Response body
3. `Content-Type`
4. Response time

## Common Mistakes

- Server is not running.
- Wrong port or URL.
- Wrong HTTP method.
- JSON sent without `Content-Type: application/json`.
- Looking only at the response body and ignoring the status code.

## Try It

Send `GET`, `POST`, `PUT`, and `DELETE` requests to:

```text
http://localhost:3000/anything
```

Observe how your current server responds. Routing in the next topic will make these requests behave differently.

---
