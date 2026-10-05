# 18. Cleanup (Middleware & Handlers)

## Before we refactor

Before this topic, it helps to understand three ideas:

- **Refactoring** means changing the structure of code without intentionally changing what the program does.
- A **responsibility** is a specific job a piece of code is responsible for. For example, routing should decide which handler runs; it should not also contain database or file-storage logic.
- **Separation of concerns** means keeping different jobs in different parts of the application. This makes code easier to read, test, and change.

Our `server.js` has grown messy because routing, middleware, business logic, storage, and response formatting are all becoming mixed together.

## Concept

**Refactoring** = reorganizing code without changing behavior. We separate **concerns**:

| File | Responsibility |
|---|---|
| `server.js` | Start the server, wire everything together |
| `src/middleware.js` | Reusable chain functions |
| `src/router.js` | Matches method + path → handler |
| `src/routes.js` | The route table |
| `src/handlers.js` | Business logic for each endpoint |
| `src/store.js` | Where data lives |
| `src/utils/response.js` | `sendJson`, `httpError`, `sendError` |

### Picture the flow

```text
server.js
   ▼
router → route table
   ▼
handler → store
   ▼
response helper → client
```

## Step 1: `src/utils/response.js`
```js
export function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// Create an error carrying an HTTP status
export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

// Central error responder
export function sendError(res, err) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);          // log the real error
  if (res.headersSent) return res.end();           // too late to change the response
  sendJson(res, status, {
    error: status >= 500 ? 'Internal Server Error' : err.message,   // don't leak internals
  });
}
```

## Step 2: `src/router.js`: a route table
```js
import { sendJson } from './utils/response.js';

const routes = [];

// addRoute('GET', '/api/tasks/:id', handler)
export function addRoute(method, pathPattern, handler) {
  const keys = [];
  const source = pathPattern.replace(/:([A-Za-z_]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  routes.push({ method, regex: new RegExp(`^${source}$`), keys, handler });
}

// Final step in the middleware chain
export async function dispatch(req, res) {
  const { pathname } = req.parsedUrl;

  for (const route of routes) {
    if (route.method !== req.method) continue;
    const match = pathname.match(route.regex);
    if (!match) continue;

    req.params = {};
    route.keys.forEach((key, i) => {
      req.params[key] = decodeURIComponent(match[i + 1]);
    });
    return route.handler(req, res);
  }

  sendJson(res, 404, { error: 'Not Found' });
}
```
Now `/api/tasks/:id` automatically becomes a regex, and `req.params.id` holds the value.

## Step 3: `src/store.js` (in-memory for now)
```js
let tasks = [
  { id: '1', title: 'Learn Node.js', done: false, createdAt: new Date().toISOString() },
];
let nextId = 2;

export async function getAll()      { return tasks; }
export async function getById(id)   { return tasks.find(t => t.id === id) ?? null; }

export async function create({ title }) {
  const task = { id: String(nextId++), title, done: false, createdAt: new Date().toISOString() };
  tasks.push(task);
  return task;
}

export async function update(id, changes) {
  const task = tasks.find(t => t.id === id);
  if (!task) return null;
  Object.assign(task, changes);
  return task;
}

export async function remove(id) {
  const before = tasks.length;
  tasks = tasks.filter(t => t.id !== id);
  return tasks.length < before;
}
```
💡 **Design lesson:** every function is `async` even though in-memory code doesn't need it. In topic 20 we replace the internals with file storage and **nothing else changes**, because the interface stays the same.

## Step 4: `src/handlers.js` (read handlers now; write handlers in topic 19)
```js
import * as store from './store.js';
import { sendJson, httpError } from './utils/response.js';

export async function listTasks(req, res) {
  let tasks = await store.getAll();
  const done = req.parsedUrl.searchParams.get('done');
  if (done !== null) tasks = tasks.filter(t => String(t.done) === done);
  sendJson(res, 200, tasks);
}

export async function getTask(req, res) {
  const task = await store.getById(req.params.id);
  if (!task) throw httpError(404, 'Task not found');
  sendJson(res, 200, task);
}

export async function deleteTask(req, res) {
  const removed = await store.remove(req.params.id);
  if (!removed) throw httpError(404, 'Task not found');
  res.writeHead(204);
  res.end();
}
```
Notice handlers just `throw`. The `compose` wrapper catches it and `sendError` formats it.

## Step 5: `src/routes.js`
```js
import { addRoute } from './router.js';
import { listTasks, getTask, deleteTask } from './handlers.js';

addRoute('GET',    '/api/tasks',     listTasks);
addRoute('GET',    '/api/tasks/:id', getTask);
addRoute('DELETE', '/api/tasks/:id', deleteTask);
```

## Step 6: `src/middleware.js` (essentials)
```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { httpError, sendError } from './utils/response.js';

export function compose(stack) {
  return (req, res) => {
    let i = 0;
    const next = (err) => {
      if (err) return sendError(res, err);
      const fn = stack[i++];
      if (!fn) return;
      Promise.resolve().then(() => fn(req, res, next)).catch(next);
    };
    next();
  };
}

export function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} → ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
}

export function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  next();
}

export function parseUrl(req, res, next) {
  req.parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  next();
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

export function serveStatic(publicDir) {
  return async (req, res, next) => {
    if (req.method !== 'GET' || req.parsedUrl.pathname.startsWith('/api')) return next();

    let pathname = decodeURIComponent(req.parsedUrl.pathname);
    if (pathname === '/') pathname = '/index.html';

    const filePath = path.join(publicDir, pathname);
    if (!filePath.startsWith(publicDir + path.sep)) throw httpError(403, 'Forbidden');

    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream' });
      res.end(data);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') return next();   // not a file → try next middleware
      throw err;
    }
  };
}
```

## Step 7: slim `server.js`
```js
import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compose, logger, cors, parseUrl, serveStatic } from './src/middleware.js';
import { dispatch } from './src/router.js';
import './src/routes.js';                       // importing registers the routes

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(
  compose([logger, cors, parseUrl, serveStatic(path.join(__dirname, 'public')), dispatch])
);

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
```

## Result
`server.js` is ~10 lines. Adding a feature now means: **one handler + one route line**. Congratulations, you've built the core of a mini Express.

## Try it
Test every endpoint again in Postman and confirm nothing broke. Then add `GET /api/about`: only one handler and one `addRoute` line should be needed.

---