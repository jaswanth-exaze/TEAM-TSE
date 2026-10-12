# 15. Loading Files

## Before We Start

A server can return more than JSON. It can send:

```text
HTML
CSS
JavaScript
Images
JSON files
```

This is commonly called **serving static files**.

Example project:

```text
project/
├── server.js
└── public/
    ├── index.html
    └── style.css
```

Flow:

```text
Browser requests /index.html
        ↓
Server looks in public/
        ↓
Server reads the file
        ↓
Browser receives the file
```

## Step 1: Create the Page

`public/index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Task API</title>
</head>
<body>
  <h1>Task Manager</h1>
  <ul id="list"></ul>

  <script>
    async function load() {
      const res = await fetch('/api/tasks');
      const tasks = await res.json();

      const list = document.getElementById('list');
      list.innerHTML = '';

      tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.title;
        list.appendChild(li);
      });
    }

    load();
  </script>
</body>
</html>
```

The browser receives this HTML and executes its JavaScript.

## Step 2: Read and Send the File

Node's `fs` module works with files:

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
```

Then make the request callback `async`:

```js
const server = http.createServer(async (req, res) => {
  // ...
});
```

Serve the page:

```js
if (method === 'GET' && pathname === '/') {
  try {
    const html = await fs.readFile(
      path.join(PUBLIC_DIR, 'index.html')
    );

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8'
    });

    return res.end(html);
  } catch {
    return sendJson(res, 500, {
      error: 'Could not load page'
    });
  }
}
```

`await` is used because `fs.readFile()` is asynchronous and returns a Promise.

## Content-Type

The client needs to know what type of data it received.

Examples:

```text
HTML → text/html
CSS  → text/css
JS   → text/javascript
JSON → application/json
PNG  → image/png
```

Example map:

```js
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};
```

## Buffer

If you read:

```js
await fs.readFile('notes.txt', 'utf8');
```

you get text.

If you read an image without an encoding:

```js
await fs.readFile('image.png');
```

you get a **Buffer**, which represents raw bytes.

## Serving Any Static File

```js
async function serveFile(res, filePath) {
  const data = await fs.readFile(filePath);
  const type = MIME[path.extname(filePath)]
    ?? 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': type });
  res.end(data);
}
```

## Security: Path Traversal

Do not blindly turn user input into a file path.

An attacker could try:

```text
/../../.env
```

to access files outside `public/`.

Verify that the final path stays inside the public directory:

```js
const requested = path.join(
  PUBLIC_DIR,
  decodeURIComponent(pathname)
);

if (!requested.startsWith(PUBLIC_DIR + path.sep)) {
  return sendJson(res, 403, { error: 'Forbidden' });
}
```

This protects against **path traversal**.

## Common Mistakes

- Wrong file path.
- Wrong `Content-Type`.
- Forgetting `await`.
- Treating binary files as normal text.
- Building file paths directly from user input.
- Not handling missing files.

## Try It

Create:

```text
public/style.css
```

Link it from `index.html` and serve it with `text/css`.

---
