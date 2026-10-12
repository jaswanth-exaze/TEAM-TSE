# 23. URL Module

## Before working with URLs

A **URL (Uniform Resource Locator)** is the address used to locate a resource on a network.

For example:

```text
https://example.com/api/tasks?done=true
```

A URL can contain several parts:

- **Protocol** — `https:`
- **Hostname** — `example.com`
- **Port** — `8080` when explicitly provided
- **Pathname** — `/api/tasks`
- **Query string** — `?done=true`
- **Hash** — `#top`

In an API, the query string is often used to send optional information such as filtering, searching, sorting, or pagination.

## Concept

URLs have structure:
```
https://user:pass@example.com:8080/api/tasks?done=true&sort=asc#top
└──┬──┘   └──┬───┘ └────┬────┘└┬─┘└────┬────┘└───────┬───────┘└─┬─┘
protocol  credentials  hostname port  pathname      search     hash
```
Node provides the standard **`URL`** and **`URLSearchParams`** classes (the same as in browsers); they are globals and need no import. (The old `url.parse()` is **deprecated**. Use `new URL()`.)

### Picture the flow

```text
URL text
   ▼ new URL(...)
protocol · host · path · search params
   ▼
read or validate each part
```

## The `URL` class
```js
const u = new URL('https://example.com:8080/api/tasks?done=true&sort=asc#top');

u.protocol;      // 'https:'
u.hostname;      // 'example.com'
u.port;          // '8080'
u.host;          // 'example.com:8080'
u.pathname;      // '/api/tasks'
u.search;        // '?done=true&sort=asc'
u.hash;          // '#top'
u.origin;        // 'https://example.com:8080'
u.href;          // the full URL
```

## Why a base is needed in servers
`req.url` is only `/api/tasks?done=true` (no host), so `new URL(req.url)` would throw. Give it a base:
```js
const url = new URL(req.url, `http://${req.headers.host}`);
```
(That's exactly what our `parseUrl` middleware does.)

## `searchParams`: reading and building query strings
```js
const p = new URL('http://x.com/?done=true&tag=a&tag=b&page=2').searchParams;

p.get('done');          // 'true'      (always a STRING)
p.get('missing');       // null
p.has('page');          // true
p.getAll('tag');        // ['a', 'b']
Number(p.get('page'));  // 2

// build / modify
const q = new URLSearchParams({ done: 'true', page: '1' });
q.append('sort', 'asc');
q.set('page', '2');
q.delete('done');
q.toString();           // 'page=2&sort=asc'

for (const [key, value] of p) console.log(key, value);
```
It also **encodes special characters** safely: `new URLSearchParams({ q: 'a b&c' }).toString()` → `q=a+b%26c`.

## Converting between file paths and `file://` URLs
```js
import { fileURLToPath, pathToFileURL } from 'node:url';

fileURLToPath(import.meta.url);      // '/home/sam/task-api/server.js'
pathToFileURL('/tmp/a.txt').href;    // 'file:///tmp/a.txt'
```

## Apply it: pagination + sorting in `listTasks`
```js
export async function listTasks(req, res) {
  const params = req.parsedUrl.searchParams;
  let tasks = await store.getAll();

  const done = params.get('done');
  if (done !== null) tasks = tasks.filter(t => String(t.done) === done);

  const search = params.get('search');
  if (search) tasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  if (params.get('sort') === 'title') tasks.sort((a, b) => a.title.localeCompare(b.title));

  const page  = Math.max(1, Number(params.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.get('limit')) || 20));
  const start = (page - 1) * limit;

  sendJson(res, 200, tasks.slice(start, start + limit));
}
```
Try: `GET /api/tasks?done=false&search=node&sort=title&page=1&limit=5`.

## 🔐 Security habit
Query values are **user input**. Validate type and range (notice `Math.min/Math.max` on `limit`, so nobody can request a million items).

## Try it
Write a function `buildUrl(base, params)` that returns a full URL string using `URL` and `searchParams`, skipping params whose value is `undefined`.

---