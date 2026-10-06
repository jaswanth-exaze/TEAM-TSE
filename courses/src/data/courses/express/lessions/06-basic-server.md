# 06 — Basic Server

> **Goal:** Write your first Express server, run it, visit it in the browser, and
> understand every line, plus the concepts behind ports, routes and responses.

---

## 1. What We Are Building

A server that answers `GET /` with text, and `GET /about` with more text.

```
Browser  --GET /-->  Express  --"Hello World"-->  Browser
```

---

## 2. Prerequisite Concept: What Is a Port?

A computer has one IP address but runs many programs. A **port** is a number
(0–65535) that tells the computer *which program* should receive the traffic.

```
Your computer (localhost = 127.0.0.1)
   ├── port 3000  -> your Express server
   ├── port 3306  -> MySQL
   ├── port 22    -> SSH
   └── port 80    -> a web server (HTTP default)
```

| Port | Common use |
|------|------------|
| 80 | HTTP |
| 443 | HTTPS |
| 3306 | MySQL |
| 3000, 5000, 8000, 8080 | Development servers |

Rules:
- Only **one program** can listen on a port at a time.
- Ports below 1024 usually need admin rights.
- `localhost` means "this computer only".

---

## 3. Step 1 — The Code

Open `server.js`:

```js
const express = require('express');

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

---

## 4. Step 2 — Run It

```bash
node server.js
```

Output:

```
Server is running on port 5000
```

The terminal does **not** return to the prompt. That is correct — the server is
alive and waiting. Open the browser at:

```
http://localhost:5000
```

You should see **Hello World**.

Stop the server with `Ctrl + C`.

---

## 5. Line-by-Line Explanation

### Line 1
```js
const express = require('express');
```
Loads the Express library. `express` is a function.

### Line 2
```js
const app = express();
```
Creates an **application**. Think of `app` as your server's control panel.

### Line 3
```js
const PORT = 5000;
```
A constant for the port. Uppercase is a naming convention for constants.

### The route
```js
app.get('/', (req, res) => {
  res.send('Hello World');
});
```

| Part | Meaning |
|------|---------|
| `app.get` | Handle **GET** requests |
| `'/'` | Only for the path `/` |
| `(req, res) => {...}` | Handler: runs when matched |
| `res.send('Hello World')` | Sends the response and finishes it |

### The listen call
```js
app.listen(PORT, () => { ... });
```
Starts the server. The callback runs once it is ready.

---

## 6. Prerequisite Concept: What Happens When a Request Arrives?

1. Browser opens a TCP connection to `localhost:5000`.
2. Browser sends: `GET / HTTP/1.1` + headers.
3. Node receives it and passes it to Express.
4. Express checks routes in the **order you wrote them**.
5. First matching route runs.
6. Your handler calls `res.send(...)`.
7. Express writes the response; the connection finishes.

If no route matches, Express sends its default **404 Cannot GET /something**.

---

## 7. Adding More Routes

```js
const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Home page');
});

app.get('/about', (req, res) => {
  res.send('About page');
});

app.get('/contact', (req, res) => {
  res.send('Contact page');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Visit:
- `http://localhost:5000/` → Home page
- `http://localhost:5000/about` → About page
- `http://localhost:5000/contact` → Contact page
- `http://localhost:5000/xyz` → `Cannot GET /xyz` (404)

---

## 8. `res.send()` Can Send HTML

```js
app.get('/', (req, res) => {
  res.send('<h1>Hello World</h1><p>This is HTML</p>');
});
```

Express detects a string and sets `Content-Type: text/html`.
The browser renders the heading and paragraph.

### What `res.send()` accepts

| You pass | Content-Type set | Notes |
|----------|------------------|-------|
| String | `text/html` | Rendered as HTML |
| Object / Array | `application/json` | Converted to JSON |
| Buffer | `application/octet-stream` | Binary data |
| Number | — | **Do not** pass a number alone (it was treated as status in old versions); use `res.send(String(n))` |

---

## 9. Concept: The Handler Arguments

```js
app.get('/', (req, res) => { ... });
```

### `req` — the request
Try printing things:

```js
app.get('/', (req, res) => {
  console.log(req.method);    // GET
  console.log(req.url);       // /
  console.log(req.path);      // /
  console.log(req.headers);   // object of headers
  console.log(req.ip);        // client IP
  res.send('Check your terminal');
});
```

### `res` — the response
Common methods (we will meet all of them):

| Method | Use |
|--------|-----|
| `res.send()` | Send string/object |
| `res.json()` | Send JSON |
| `res.sendFile()` | Send a file |
| `res.status()` | Set status code |
| `res.redirect()` | Redirect to another URL |
| `res.render()` | Render a template |
| `res.set()` | Set a header |
| `res.end()` | End without data |

---

## 10. Important: A Response Must Be Sent

If your handler never calls a `res.*` method, the browser keeps waiting and finally times out.

```js
app.get('/slow', (req, res) => {
  console.log('I ran but forgot to respond');
  // no res.send -> request hangs!
});
```

**Rule:** every code path in a handler must end the response exactly once.

---

## 11. Listening on a Different Host

```js
app.listen(PORT, '127.0.0.1', () => { ... });  // only this computer
app.listen(PORT, '0.0.0.0', () => { ... });    // all network interfaces
```

By default (no host) Node listens on all interfaces, so other devices on your network
could reach your dev server using your IP.

> 🔐 **Security note:** For development, binding to `127.0.0.1` keeps your test server
> private. Never expose an unfinished app to the network.

---

## 12. What if the Port Is Busy?

Error:

```
Error: listen EADDRINUSE: address already in use :::5000
```

Reasons: an older instance of your server is still running, or another program uses it.

Fix on Linux/macOS:

```bash
lsof -i :5000
kill <PID>
```

Or choose another port. Always remember to stop servers with `Ctrl + C`.

---

## 13. Error Handling on Listen (Optional but Good)

```js
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
```

`app.listen` returns the underlying Node `http.Server`. That means everything you know
about Node's `http` still applies.

---

## 14. Behind the Scenes — What `app.listen` Really Does

```js
// Express source (simplified)
app.listen = function () {
  const server = http.createServer(this);
  return server.listen.apply(server, arguments);
};
```

So `app` is a function `(req, res) => ...` that Node's `http.createServer` can use.
That is why `typeof app === 'function'` (you saw it in lesson 5).

Equivalent manual version:

```js
const http = require('http');
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Hi'));

http.createServer(app).listen(5000);
```

---

## 15. The Order of Routes Matters

```js
app.get('/hello', (req, res) => res.send('First'));
app.get('/hello', (req, res) => res.send('Second'));  // never runs
```

Express runs the **first** matching handler. Because it already sent a response, the
second one is never reached (unless the first calls `next()` — lesson 23).

---

## 16. Other HTTP Methods (Preview)

```js
app.post('/items', (req, res) => res.send('Create'));
app.put('/items', (req, res) => res.send('Update'));
app.delete('/items', (req, res) => res.send('Delete'));
```

The browser address bar can only send **GET**. To test the others you need Postman
(lesson 11) or a form (lesson 30).

Try in the terminal with `curl`:

```bash
curl http://localhost:5000/
curl -X POST http://localhost:5000/items
curl -i http://localhost:5000/      # -i shows headers too
```

---

## 17. Reading the Response Headers

```bash
curl -i http://localhost:5000/
```

Example output:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 11
ETag: W/"b-Ck1VqNd45QIvq3AZd8XYQLvEhtA"
Date: Tue, 06 Oct 2026 10:00:00 GMT
Connection: keep-alive

Hello World
```

Notice `X-Powered-By: Express`. This tells attackers which framework you use.

> 🔐 Hide it in production:
> ```js
> app.disable('x-powered-by');
> ```
> (The `helmet` package does this too.)

---

## 18. Complete Example for This Lesson

```js
const express = require('express');
const app = express();
const PORT = 5000;

app.disable('x-powered-by');

app.get('/', (req, res) => {
  res.send('<h1>Home</h1>');
});

app.get('/about', (req, res) => {
  res.send('<h1>About</h1>');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## 19. Common Mistakes

| Mistake | Result | Fix |
|---------|--------|-----|
| Forgetting `app.listen` | Program exits immediately | Add it |
| Typing `http://localhost:5000/` while server is stopped | "Unable to connect" | Start server |
| Editing code but not restarting | Old behavior | Restart (lesson 7) |
| Using `https://localhost:5000` | SSL error | Use `http://` |
| Calling `res.send` twice | "Cannot set headers after they are sent" | Respond only once (lesson 16) |
| Missing quotes around path | Syntax error | `'/about'` |

---

## 20. Exercises

1. Create routes for `/`, `/services`, `/team`, each returning an `<h1>`.
2. Make `/time` return the current time: `res.send(new Date().toString())`.
3. Make `/random` return a random number from 1 to 100.
4. Print the HTTP method and path in the console for every request to `/`.
5. Change the port to 4000 using a constant.
6. Use `curl -i` to see the response headers of your `/time` route.

### Challenge
Build a route `/hello` that returns an HTML page with a heading, a paragraph and a
bulleted list of three items, using one template literal string.

<details><summary>Hint</summary>

```js
res.send(`
  <h1>Hello</h1>
  <p>Welcome</p>
  <ul><li>One</li><li>Two</li><li>Three</li></ul>
`);
```
</details>

---

## 21. Quick Quiz

1. What does `app.listen` do?
2. What happens if no route matches?
3. What error means the port is already used?
4. Why does the terminal not return to the prompt after starting the server?
5. What does `res.send('<h1>Hi</h1>')` set as Content-Type?

<details><summary>Answers</summary>

1. Starts the HTTP server on a port.
2. Express sends a 404 response.
3. `EADDRINUSE`.
4. The server keeps running to accept requests.
5. `text/html`.
</details>

---

## 22. Summary

- A basic Express server = `require`, `express()`, routes, `app.listen`.
- A port identifies your program on the computer.
- `app.get(path, handler)` handles GET requests; handler receives `req` and `res`.
- `res.send()` sends the response and ends it; always end every request.
- Routes are checked top to bottom; first match wins.
- `app.listen` returns a Node `http.Server`.
- Disable `X-Powered-By` for a bit more safety.

---

## 23. Next Lesson

➡️ **07 — `--watch` Flag & NPM Scripts**
Stop restarting manually: Node can restart the server whenever you save a file.
