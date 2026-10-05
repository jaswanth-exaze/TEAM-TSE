# 19. Getting the Request Body for POST

## Before reading a request body

A request can contain information in several places:

- **Method** — what the client wants to do, such as `GET` or `POST`.
- **URL** — where the request is going.
- **Headers** — extra information about the request, such as `Content-Type`.
- **Body** — data sent by the client, commonly JSON for an API.

For example:

```text
POST /api/tasks
Content-Type: application/json

{"title":"Learn Node"}
```

The JSON object is the **request body**. Node does not give it to us as a ready-made JavaScript object. Because the HTTP request is a stream, we must receive the incoming data and then parse the JSON.

## Concept

When a client sends JSON (`POST`/`PUT`/`PATCH`), the body arrives in **chunks** over time, because `req` is a **stream**. We listen to its events, collect the chunks, and join them.

```
Client sends:  {"title":"Learn Node"}
Server gets:   chunk1 ... chunk2 ... chunk3 → 'end' event → join → JSON.parse
```

### Picture the flow

```text
Request bytes
   ▼
read body → parse JSON
   ▼
validate fields
   ├─ invalid → 400 response
   └─ valid → create task → 201 response
```

## Step 1: the raw idea
```js
let body = '';
req.on('data', chunk => { body += chunk; });
req.on('end', () => {
  const data = JSON.parse(body);
  // use data
});
```
- `'data'` fires for each chunk.
- `'end'` fires when the whole body has arrived.
- It's callback-based, so we wrap it in a **Promise** to use `await`.

## Step 2: a safe body parser: `src/utils/body.js`
```js
import { httpError } from './response.js';

export function getJsonBody(req, limitBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) { tooLarge = true; return; }   // stop collecting
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (tooLarge) return reject(httpError(413, 'Payload too large'));
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(httpError(400, 'Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}
```
Why this version is better than the basic one:
- Joins **Buffers** properly (multi-byte characters can be split across chunks).
- **Size limit** (413): stops people from sending gigabytes to exhaust memory.
- **Invalid JSON** returns a clean 400 instead of crashing the server.

## Step 3: a body-parsing middleware (add to `middleware.js`)
```js
import { getJsonBody } from './utils/body.js';

export async function jsonBody(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const type = req.headers['content-type'] ?? '';
    if (!type.includes('application/json')) {
      throw httpError(415, 'Content-Type must be application/json');
    }
    req.body = await getJsonBody(req);
  }
  next();
}
```

## Step 4: write handlers: add to `src/handlers.js`
```js
// Validate incoming data (never trust the client!)
function validate(body, { partial }) {
  const out = {};

  if (!partial || 'title' in body) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw httpError(400, 'title is required and must be a non-empty string');
    }
    out.title = body.title.trim().slice(0, 200);
  }

  if ('done' in body) {
    if (typeof body.done !== 'boolean') throw httpError(400, 'done must be true or false');
    out.done = body.done;
  }
  return out;
}

export async function createTask(req, res) {
  const data = validate(req.body, { partial: false });
  const task = await store.create(data);
  sendJson(res, 201, task);                 // 201 Created
}

export async function replaceTask(req, res) {          // PUT: title required
  const data = validate(req.body, { partial: false });
  const task = await store.update(req.params.id, { done: false, ...data });
  if (!task) throw httpError(404, 'Task not found');
  sendJson(res, 200, task);
}

export async function patchTask(req, res) {            // PATCH: any subset
  const data = validate(req.body, { partial: true });
  const task = await store.update(req.params.id, data);
  if (!task) throw httpError(404, 'Task not found');
  sendJson(res, 200, task);
}
```

## Step 5: register routes: `src/routes.js`
```js
import { addRoute } from './router.js';
import { listTasks, getTask, createTask, replaceTask, patchTask, deleteTask } from './handlers.js';

addRoute('GET',    '/api/tasks',     listTasks);
addRoute('GET',    '/api/tasks/:id', getTask);
addRoute('POST',   '/api/tasks',     createTask);
addRoute('PUT',    '/api/tasks/:id', replaceTask);
addRoute('PATCH',  '/api/tasks/:id', patchTask);
addRoute('DELETE', '/api/tasks/:id', deleteTask);
```

## Step 6: add `jsonBody` to the chain in `server.js`
```js
import { compose, logger, cors, parseUrl, serveStatic, jsonBody } from './src/middleware.js';

compose([logger, cors, parseUrl, serveStatic(PUBLIC_DIR), jsonBody, dispatch])
```

## Step 7: test in Postman
| Request | Expected |
|---|---|
| `POST /api/tasks` `{"title":"Write notes"}` | **201** + the new task |
| `POST /api/tasks` `{}` | **400** `title is required...` |
| `POST /api/tasks` with broken JSON `{"title":` | **400** `Invalid JSON` |
| `PATCH /api/tasks/1` `{"done":true}` | **200**, done is true |
| `PUT /api/tasks/1` `{"title":"New title"}` | **200** |
| `PATCH /api/tasks/999` `{"done":true}` | **404** |

## Common mistakes
- Forgetting `Content-Type: application/json` in the client.
- Using `body += chunk` with large or binary data (use Buffers).
- Skipping validation. **Never trust client input.**
- Calling `JSON.parse` without `try/catch`. One bad request could crash your server.

## Try it
Add validation: reject titles longer than 200 characters with a 400 instead of silently trimming them.

---