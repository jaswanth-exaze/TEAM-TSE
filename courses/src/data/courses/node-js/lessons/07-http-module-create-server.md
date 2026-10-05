# 7. HTTP Module & Create Server

## Before Node's HTTP Module

Before writing a server, understand four basic terms: **client, server, HTTP, and API**.

### What is a client?

A **client** is a program that asks another program for something.

Examples:

- A web browser
- A frontend application
- Postman
- A mobile application

For example, when your browser opens a website, the browser acts as the client.

### What is a server?

A **server** is a program that waits for requests and sends responses.

It can:

- receive a request
- process it
- read or change data
- send a response back

In this topic, Node.js will run our server program.

Think of it simply as:

```text
Client:  "I need this information."
Server:  "Here is the information."
```

### What is HTTP?

**HTTP (HyperText Transfer Protocol)** is a set of rules that allows clients and servers to communicate.

For now, remember the basic flow:

```text
Client
   │
   │ HTTP request
   ▼
Server
   │
   │ HTTP response
   ▼
Client
```

An HTTP request can contain information such as:

- the **method** (`GET`, `POST`, etc.)
- the URL
- headers
- a request body

An HTTP response contains information such as:

- a status code
- headers
- a response body

### What is an API?

An **API (Application Programming Interface)** is a defined way for one program to communicate with another program.

For example, a frontend could ask our server for users:

```text
GET /users
```

The server might respond with:

```json
[
  { "id": 1, "name": "Rahul" },
  { "id": 2, "name": "Amit" }
]
```

Here, `/users` can be an API endpoint.

You do not need to learn all API concepts yet. The important idea is:

```text
Client  →  sends request to API  →  Server
Client  ←  receives response      ←  Server
```

## Concept: Node's HTTP module

Node.js provides a built-in **`http` module** that allows us to create an HTTP server without installing an external package.

We can use it to receive HTTP requests and send HTTP responses.

### Picture the flow

```text
Browser or API client
       │
       │ HTTP request
       ▼
Node.js HTTP server
       │
       │ status + headers + body
       ▼
Browser or API client
```

## Steps

### 1. Create `server.js`

Create it in the project root:

```js
import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Task API!');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
```

### 2. Run the server

```bash
node server.js
```

You should see:

```text
Server running at http://localhost:3000
```

### 3. Open the URL

Open:

```text
http://localhost:3000
```

Your browser sends a request to the Node.js server, and the server sends back:

```text
Hello from Task API!
```

### 4. Stop the server

Press:

```text
Ctrl + C
```

## Understanding the code

### `http.createServer()`

```js
const server = http.createServer((req, res) => {
  // handle the request
});
```

`createServer()` creates the HTTP server.

The function inside it is called a **callback function**. Node.js calls this function whenever a request arrives.

### `req`

```js
(req, res)
```

`req` means **request**.

It contains information about what the client asked for, such as:

- HTTP method
- URL
- headers
- request body

### `res`

`res` means **response**.

We use it to tell the client what to send back.

### `res.writeHead()`

```js
res.writeHead(200, { 'Content-Type': 'text/plain' });
```

This sets the response's:

- **status code**: `200`
- **headers**: `Content-Type: text/plain`

### `res.end()`

```js
res.end('Hello from Task API!');
```

This sends the response body and tells Node.js that the response is finished.

If you forget to finish the response, the client may continue waiting.

### `server.listen()`

```js
server.listen(3000);
```

This starts the server and tells it to listen for requests on port `3000`.

## Important concepts

### What is a port?

A **port** is a number used to identify a network service running on a computer.

Think of it as a door number:

```text
localhost:3000
   │       │
   │       └── port
   └────────── this computer
```

`localhost` means your own computer.

So:

```text
http://localhost:3000
```

means:

> "Connect to the HTTP server running on my computer through port 3000."

### HTTP status codes

A status code tells the client what happened with the request.

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

You will use these more as we build APIs.

### Content-Type

`Content-Type` tells the client how to interpret the response body.

Common examples:

```text
text/plain
text/html
application/json
```

## Sending HTML and JSON

### HTML response

```js
res.writeHead(200, { 'Content-Type': 'text/html' });
res.end('<h1>Welcome</h1>');
```

### JSON response

JSON is a common format for data exchanged between an API and its clients.

```js
res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ message: 'Hello', ok: true }));
```

`JSON.stringify()` converts the JavaScript object into a JSON string that can be sent as the response body.

## Common mistakes

| Problem | Fix |
|---|---|
| Browser keeps waiting | You forgot `res.end()` |
| `EADDRINUSE` on port 3000 | Another process is using port 3000; stop it or change the port |
| Changes don't appear | Restart Node, or use nodemon later |
| Sending an object to `res.end(obj)` | Convert it with `JSON.stringify()` |

## Try it

Make the server respond with JSON:

```json
{
  "app": "task-api",
  "time": "<current ISO time>"
}
```

Use:

```js
new Date().toISOString()
```

## Why this matters

This is the foundation of a Node.js backend. Later, frameworks such as Express can make server and API development easier, but the underlying idea remains:

```text
Request → Server processes it → Response
```
