# 26. Process Object

## Concept

Before learning `process`, understand what a **process** is.

A process is a running instance of a program. When you execute:

```bash
node server.js
```

the operating system starts a process for that Node.js program.

Node exposes information about this running program through the global `process` object. No import is needed.

Useful terms:

- **PID:** process ID assigned by the operating system.
- **CLI argument:** a value supplied when starting a program, such as `--port=4000`.
- **CWD:** current working directory, the directory from which the command was started.
- **Signal:** a message sent to a process asking it to perform an action.
- **Exit code:** a value returned to the operating system; conventionally `0` means success.
- **Graceful shutdown:** stopping the server and allowing important work to finish before exiting.

## The essentials

```js
process.argv;               // [nodePath, scriptPath, ...args]
process.env;                // environment variables
process.cwd();              // current working directory
process.pid;                // process ID
process.platform;           // 'win32' | 'darwin' | 'linux'
process.version;            // 'v...'
process.versions;           // versions of V8 and other components
process.uptime();           // seconds since the program started
process.memoryUsage();      // memory information in bytes
process.hrtime.bigint();    // high-precision timer
```

For:

```bash
node server.js --port=4000
```

`process.argv` contains the command-line argument:

```js
const portArg = process.argv.find(
  a => a.startsWith('--port=')
);
```

## Standard input/output

Command-line programs normally have:

- **stdin:** standard input, such as keyboard input
- **stdout:** normal output
- **stderr:** error/diagnostic output

```js
process.stdout.write('No newline here');
process.stderr.write('Error output\n');
```

`console.log()` writes normal output and `console.error()` writes error output.

To read a line:

```js
import readline from 'node:readline/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const answer = await rl.question('Your name? ');
console.log(`Hi ${answer}`);
rl.close();
```

## Exiting

```js
process.exit(0);       // success
process.exit(1);       // failure
process.exitCode = 1;  // set code and allow pending work to finish
```

`process.exit()` stops immediately. Pending file writes or open connections may be cut off, so servers should prefer a graceful shutdown.

## `process` is an EventEmitter

You already learned that an `EventEmitter` lets code listen for events. The `process` object also provides event-based hooks:

```js
process.on('exit', (code) => console.log(`Exiting with ${code}`));

process.on('SIGINT', () => { /* Ctrl+C */ });

process.on('SIGTERM', () => {
  /* commonly used by containers/hosting platforms */
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
```

Pressing `Ctrl+C` normally sends `SIGINT`. A hosting platform or container manager may send `SIGTERM` when it wants the application to stop.

## Apply it: graceful shutdown + CLI port option in `server.js`

**Final `server.js`:**

```js
import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compose, logger, cors, parseUrl, serveStatic, requireApiKey, jsonBody,
} from './src/middleware.js';
import { dispatch } from './src/router.js';
import './src/routes.js';
import './src/listeners.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1) Fail fast on missing configuration
if (!process.env.API_KEY) {
  console.error('Missing API_KEY. Add it to your .env file.');
  process.exit(1);
}

// 2) Port priority: --port=4000 argument > PORT env var > 3000
const portArg = process.argv.find(a => a.startsWith('--port='));
const PORT = Number(portArg?.split('=')[1] ?? process.env.PORT) || 3000;

const server = http.createServer(
  compose([
    logger,
    cors,
    parseUrl,
    serveStatic(path.join(__dirname, 'public')),
    requireApiKey,
    jsonBody,
    dispatch,
  ])
);

server.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT} (pid ${process.pid})`);
});

// 3) Graceful shutdown
function shutdown(signal) {
  console.log(`\n${signal} received. Closing server...`);

  server.close(() => {
    console.log('Server closed. Bye');
    process.exit(0);
  });

  server.closeIdleConnections?.();

  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// 4) Last-resort safety nets
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
```

Run:

```bash
node server.js --port=4000
```

Then press `Ctrl+C` and watch the clean shutdown messages.

`server.close()` stops accepting new connections while allowing existing work to finish. The 10-second timer is a safety net if shutdown gets stuck.

## Try it

1. Log `process.memoryUsage().heapUsed` (in MB) every 10 seconds using `setInterval`. Create 1000 tasks via a loop script and watch the memory change.
2. Make the server print how long it took to start using `process.hrtime.bigint()`.

---

## Project wrap-up

At this point, the project combines HTTP handling, routing, middleware, file persistence, URL parsing, cryptography, events, and process management.

### Final Project: Run & Test Checklist

#### 1. Final `package.json`

```json
{
  "name": "task-api",
  "version": "1.0.0",
  "description": "Task Manager API built with pure Node.js",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "license": "ISC"
}
```

Your version numbers will match whatever npm installed.

#### 2. `.env`

```text
PORT=3000
NODE_ENV=development
API_KEY=my-secret-key-123
```

#### 3. Final `src/routes.js`

```js
import { addRoute } from './router.js';
import {
  health, listTasks, getTask, createTask, replaceTask, patchTask, deleteTask,
} from './handlers.js';

addRoute('GET',    '/api/health',    health);
addRoute('GET',    '/api/tasks',     listTasks);
addRoute('GET',    '/api/tasks/:id', getTask);
addRoute('POST',   '/api/tasks',     createTask);
addRoute('PUT',    '/api/tasks/:id', replaceTask);
addRoute('PATCH',  '/api/tasks/:id', patchTask);
addRoute('DELETE', '/api/tasks/:id', deleteTask);
```

#### 4. Test checklist

- [ ] `npm run dev` starts without errors
- [ ] `http://localhost:3000` shows the web page
- [ ] `GET /api/health` → 200 with system info
- [ ] `GET /api/tasks` → 200 list
- [ ] `POST /api/tasks` without API key → 401
- [ ] `POST /api/tasks` with key and `{"title":"Test"}` → 201
- [ ] `POST /api/tasks` with `{}` → 400
- [ ] `POST /api/tasks` with invalid JSON → 400
- [ ] `GET /api/tasks/<id>` → 200; unknown id → 404
- [ ] `PATCH /api/tasks/<id>` `{"done":true}` → 200
- [ ] `GET /api/tasks?done=true` shows it
- [ ] `DELETE /api/tasks/<id>` → 204
- [ ] Restart the server: tasks are still there
- [ ] `data/activity.log` has CREATED / UPDATED / DELETED lines
- [ ] `GET /../.env` and `GET /%2e%2e/.env` do not expose your secrets
- [ ] `Ctrl+C` shuts down gracefully
- [ ] `.env` and `node_modules` are not in `git status`

#### 5. Stretch challenges

1. **Due dates:** add `dueDate` and `?overdue=true`.
2. **Users:** add `/api/register` and `/api/login` with `scrypt` password hashing and signed tokens (HMAC).
3. **Rate limiting:** allow 60 requests/minute per IP using a `Map`.
4. **Tests:** use the built-in runner (`node --test`) to test `validate` and your router.
5. **Streams:** serve large files with `fs.createReadStream(file).pipe(res)` instead of `readFile`.
6. **Rewrite in Express** and compare. You'll recognize every concept.

---

### Cheat Sheet

| Task | Code |
|---|---|
| Run a file | `node file.js` |
| Auto-restart | `nodemon file.js` / `node --watch file.js` |
| Init project | `npm init -y` |
| Install package | `npm i pkg` / `npm i -D pkg` |
| Run script | `npm run <name>` |
| Load `.env` | `import 'dotenv/config'` |
| Read env var | `process.env.NAME` |
| Create server | `http.createServer((req, res) => {...}).listen(port)` |
| Send JSON | `res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify(x))` |
| Parse URL | `new URL(req.url, 'http://' + req.headers.host)` |
| Query param | `url.searchParams.get('x')` |
| Read body | collect `'data'` chunks → `Buffer.concat` → `JSON.parse` on `'end'` |
| Read file | `await fs.readFile(path, 'utf8')` |
| Write file | `await fs.writeFile(path, data)` |
| Safe path | `path.join(__dirname, 'folder', 'file')` |
| `__dirname` in ESM | `path.dirname(fileURLToPath(import.meta.url))` |
| Random ID | `crypto.randomUUID()` |
| Hash | `crypto.createHash('sha256').update(x).digest('hex')` |
| Emit/listen | `emitter.emit('x', data)` / `emitter.on('x', fn)` |
| Exit | `process.exit(code)` |
| Handle Ctrl+C | `process.on('SIGINT', fn)` |

#### Status code quick reference

`200` OK · `201` Created · `204` No Content · `400` Bad Request · `401` Unauthorized · `403` Forbidden · `404` Not Found · `405` Method Not Allowed · `413` Payload Too Large · `415` Unsupported Media Type · `500` Internal Server Error

#### Security habits you practiced in this project

1. Secrets in `.env`, kept out of Git
2. Validate all input (body and query)
3. Limit request body size
4. Block path traversal in file serving
5. Compare secrets with `timingSafeEqual`
6. Never leak stack traces or system details to clients
7. Use secure randomness for IDs/tokens
8. Fail fast when configuration is missing
9. Keep dependencies few and audited (`npm audit`)

---

### Where to Go Next

1. **Streams & Buffers:** handle large files efficiently.
2. **Express.js** (or Fastify): production-grade versions of what you built by hand.
3. **Databases:** SQLite, PostgreSQL or MongoDB instead of a JSON file.
4. **Authentication:** sessions, JWT, OAuth.
5. **Testing:** `node:test`, Jest or Vitest.
6. **Async deep dive:** the event loop, `Promise.all`, worker threads.
7. **Deployment:** Docker, environment config, process managers, reverse proxies, HTTPS.
8. **Logging & monitoring:** structured logs, health checks, metrics.

You have now built a framework-level understanding of how a Node.js web server works.
