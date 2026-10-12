# 01 — What is Express?

> **Level:** Zero → Beginner
> **You already know:** MySQL, Linux, Git, GitHub, HTML, CSS, JavaScript, Node.js basics
> **Time to read:** ~25 minutes

---

## 1. The Big Picture

Before learning Express, let us remember what we already built with plain Node.js.

In the Node.js basics you probably wrote something like this:

```js
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Home page');
  } else if (req.url === '/about' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('About page');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(3000, () => console.log('Server running on port 3000'));
```

This works. But imagine you have 50 routes, JSON bodies, file uploads, login,
error handling... the file becomes a huge pile of `if / else if`.

**Express exists to solve exactly this problem.**

---

## 2. Definition

> **Express** is a fast, minimal, flexible **web framework** for **Node.js**.

Let us break the sentence into small words:

| Word | Meaning |
|------|---------|
| **Web** | It works with the internet (HTTP requests and responses) |
| **Framework** | A ready-made structure + helper tools so you write less code |
| **Node.js** | It runs on Node.js. Express is *not* a new language. It is a JavaScript library |
| **Minimal** | The core is small. It does only the essential things |
| **Flexible** | You decide how to organize your project |

So: Express = **Node's `http` module with superpowers**.

---

## 3. Important Concept: Library vs Framework

Many beginners confuse these two words. Let us clear it now because it matters.

### Library
- *You* call the library.
- Example: `lodash`. You decide when to call `_.map()`.

### Framework
- The framework calls *your* code.
- You give it small pieces (route handlers), and the framework decides when to run them.

Express sits in the middle. People call it a framework, but it is very light.
You write handlers like this:

```js
app.get('/', (req, res) => {
  res.send('Hello');
});
```

You never call this function yourself. **Express calls it** when someone visits `/`.
This idea — "I give you a function, you call it later" — is called a **callback**,
and you already learned it in JavaScript.

---

## 4. Important Concept: Client–Server and HTTP (quick revision)

To understand Express you must clearly understand this flow.

```
 Browser (Client)                         Server (Express app)
       |                                          |
       |  1. HTTP REQUEST  ---------------------> |
       |     GET /about                           |
       |                                          |  2. Express finds the
       |                                          |     matching route
       |                                          |     and runs your code
       |  <--------------------- 3. HTTP RESPONSE |
       |     200 OK + HTML                        |
```

### A request contains
- **Method**: GET, POST, PUT, DELETE ...
- **URL / path**: `/users/5`
- **Headers**: extra information (like `Content-Type`)
- **Body** (optional): data sent by client (like a form)

### A response contains
- **Status code**: 200, 404, 500 ...
- **Headers**
- **Body**: HTML, JSON, text, a file...

Express gives you two objects for this:

| Object | Name in code | Meaning |
|--------|-------------|---------|
| Request | `req` | Everything the client sent |
| Response | `res` | Tools to send something back |

Memorize this. In all 34 lessons you will write `(req, res) => { ... }`.

---

## 5. What Does Express Give Us?

### 5.1 Routing
Match **method + path** to a function.

```js
app.get('/products', listProducts);
app.post('/products', createProduct);
app.delete('/products/:id', deleteProduct);
```

### 5.2 Middleware
Small functions that run *between* the request and the response. Examples:
- logging every request
- checking if user is logged in
- reading JSON body

(We will give middleware a full lesson later, #23.)

### 5.3 Simple response helpers
Compare the two styles:

| Task | Plain Node | Express |
|------|-----------|---------|
| Send JSON | set header, `JSON.stringify`, `res.end` | `res.json(obj)` |
| Send status | `res.statusCode = 404` | `res.status(404)` |
| Send a file | read stream + pipe | `res.sendFile(path)` |
| Redirect | header + status manually | `res.redirect('/login')` |

### 5.4 Static files
Serve HTML, CSS, images, front-end JS with a single line:

```js
app.use(express.static('public'));
```

### 5.5 Template engines
Generate HTML from data (EJS, Pug, Handlebars). We will learn **EJS** in lessons 31–34.

### 5.6 Error handling
One central place to catch errors.

---

## 6. Plain Node vs Express — Side by Side

### Plain Node
```js
const http = require('http');

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/user') {
    const data = { name: 'Asha', age: 22 };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
}).listen(3000);
```

### Express
```js
const express = require('express');
const app = express();

app.get('/api/user', (req, res) => {
  res.json({ name: 'Asha', age: 22 });
});

app.listen(3000);
```

Count the lines. Count the things you had to remember. Express wins.

---

## 7. A Little History

- Created by **TJ Holowaychuk**, first released in **2010**.
- Inspired by a Ruby framework called **Sinatra**.
- Today maintained by the Node.js Foundation / OpenJS Foundation community.
- It is the **most popular** Node web framework, and many other frameworks
  (NestJS can use it underneath, for example) are built around its ideas.

You do not need to remember dates. Just know: *it is mature, stable and used in industry.*

---

## 8. Where is Express Used in Real Life?

| Use case | Example |
|----------|---------|
| REST APIs | Mobile app talks to your server |
| Websites with server-rendered pages | Blog, admin panel using EJS |
| Microservices | Small services that do one job |
| Backend for React / Angular / Vue | Front-end calls Express APIs |
| Real-time apps | Express + Socket.IO for chat |
| Proxies / gateways | Forward requests to other servers |

As a cybersecurity-minded learner, remember: because Express is so common,
attackers know it well too. Later you will learn why validation, safe headers
and error handling matter.

---

## 9. How Express Fits With Your Existing Skills

```
HTML / CSS / JS (front-end)  <----- HTTP ----->  Express (Node.js)  <---->  MySQL
        Browser                                   Server logic             Database
```

| Skill you have | Where it is used with Express |
|----------------|--------------------------------|
| HTML, CSS | Pages sent to the browser; static files; EJS templates |
| JavaScript | The language you write Express in |
| Node.js | The runtime that runs Express; `npm`, modules, `process.env` |
| MySQL | Store and read data in route handlers |
| Linux | Deploying and running the server; environment variables |
| Git / GitHub | Version control for your project |

You are well prepared. Nothing in Express is truly new — it is a neat way to
organize things you already know.

---

## 10. Express Is a Package (npm)

Express is not built into Node. It is a package stored in the **npm registry**.

You install it with:

```bash
npm install express
```

After this:
- a folder `node_modules/express` appears,
- `package.json` gets a `dependencies` entry,
- `package-lock.json` records exact versions.

You then load it in your code:

```js
// CommonJS style
const express = require('express');

// ES Modules style (we cover this in lesson 18)
import express from 'express';
```

`express` is actually a **function**. Calling it creates an application:

```js
const app = express();
```

`app` is an object with methods such as `get`, `post`, `use`, `listen`.

---

## 11. Smallest Possible Express App

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

### Line-by-line

| Line | What happens |
|------|--------------|
| `require('express')` | Loads the library |
| `express()` | Creates an app object |
| `app.get('/', fn)` | "When someone does GET on `/`, run `fn`" |
| `res.send(...)` | Sends text/HTML back and ends the response |
| `app.listen(3000, cb)` | Starts listening on port 3000; runs `cb` once ready |

Do not worry about running it yet. Lesson 5 and 6 will do it step by step.

---

## 12. Mental Model: The Express "Pipeline"

Think of Express as a **conveyor belt** in a factory.

```
Request enters
     |
     v
[ Middleware 1: log ]        <- every request passes here
     |
     v
[ Middleware 2: parse JSON ] <- turns raw body into req.body
     |
     v
[ Route: GET /users ]        <- matched? run handler, send response
     |
     v
[ Error handler ]            <- if anything failed, handle here
     |
     v
Response leaves
```

Every Express feature fits somewhere on this belt. When you feel lost in later
lessons, come back to this picture.

---

## 13. Common Terms Dictionary

| Term | Simple meaning |
|------|----------------|
| **Route** | A method + path + handler |
| **Handler** | The function that answers a request |
| **Endpoint** | A URL on your server that does something (like `/api/users`) |
| **Middleware** | A function that sits in the pipeline |
| **API** | A set of endpoints other programs can call |
| **REST** | A style of designing APIs using HTTP methods properly |
| **Port** | A number that identifies your program on the computer |
| **localhost** | "This computer" (address `127.0.0.1`) |

---

## 14. Common Beginner Misunderstandings

1. **"Express is a language."**  No. It is a JavaScript package.
2. **"Express replaces Node."**  No. Express runs *on* Node.
3. **"Express is a database."**  No. It only handles HTTP. You still use MySQL for data.
4. **"Express is only for APIs."**  No. It can also serve full HTML websites.
5. **"I must use Express for all backends."**  No. Node has other options (Fastify, Koa, NestJS). Express is the best one to learn first.

---

## 15. What You Will Build in This Course

By lesson 34 you will understand all the pieces to build:

- a server that serves HTML, CSS and images,
- a REST API (create, read, update, delete),
- an API that uses params, query strings and JSON bodies,
- middleware for logging and errors,
- a project organized in routes and controllers,
- a front-end form that talks to your API,
- server-side rendered pages using EJS.

---

## 16. Practice Questions

Answer in your notebook, then check against the lesson.

1. In one sentence, what is Express?
2. Which two objects does every route handler receive?
3. Name three things Express gives you that plain `http` does not.
4. Is Express a library, a framework, or a language?
5. What command installs Express?
6. What does `app.listen(3000)` do?
7. Draw the request–response cycle.
8. What does "minimal and flexible" mean?

### Mini Challenge
Without running code, rewrite this plain-Node snippet using Express:

```js
http.createServer((req, res) => {
  if (req.url === '/hello') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World');
  }
}).listen(4000);
```

<details>
<summary>Answer</summary>

```js
const express = require('express');
const app = express();

app.get('/hello', (req, res) => {
  res.send('Hello World');
});

app.listen(4000);
```
</details>

---

## 17. Quick Quiz (True / False)

1. Express is built into Node.js. **(False — install with npm)**
2. `req` represents the response going to the client. **(False — `res` does)**
3. `express()` returns an application object. **(True)**
4. Express can serve static files. **(True)**
5. Express needs MySQL to run. **(False)**
6. A route is a combination of method and path. **(True)**

---

## 18. Cheat Sheet

```js
const express = require('express');   // import
const app = express();                // create app

app.get(path, handler);               // GET route
app.post(path, handler);              // POST route
app.put(path, handler);               // PUT route
app.delete(path, handler);            // DELETE route
app.use(middleware);                  // add middleware

res.send('text or html');             // send text/HTML
res.json({ any: 'object' });          // send JSON
res.status(404);                      // set status code
res.sendFile(absolutePath);           // send a file
res.redirect('/other');               // redirect

app.listen(port, callback);           // start server
```

---

## 19. Summary

- Express is a **minimal, flexible web framework for Node.js**.
- It sits on top of Node's `http` module and removes repetitive work.
- You write **routes** (method + path + handler) and use **middleware**.
- Handlers receive **`req`** (request) and **`res`** (response).
- It is installed with **npm** and created with `express()`.
- It is not a database, not a language, and not a replacement for Node.

---

## 20. Next Lesson

➡️ **02 — Opinionated vs Unopinionated**
We will learn what "unopinionated" means, why Express is called that, and what
freedom (and responsibility) it gives you.
