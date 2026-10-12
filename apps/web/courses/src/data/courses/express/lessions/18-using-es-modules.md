# 18 — Using ES Modules

> **Goal:** Switch the project from CommonJS (`require`) to ES Modules (`import`/`export`),
> understand the differences, and fix the common errors.

---

## 1. Two Module Systems in Node

| | **CommonJS (CJS)** | **ES Modules (ESM)** |
|---|---|---|
| Origin | Node.js (2009) | JavaScript standard (ES2015) |
| Import | `const x = require('x')` | `import x from 'x'` |
| Export | `module.exports = ...` | `export default ...` / `export const ...` |
| Loading | **Synchronous**, at runtime | **Static analysis**, async capable |
| File extension | `.js` (default) / `.cjs` | `.mjs` or `.js` with `"type": "module"` |
| Top-level `await` | ❌ | ✅ |
| `__dirname` | ✅ | ❌ (workaround, lesson 28) |
| Used in | Older Node code, many packages | Browsers, modern Node, front-end tools |

**Why switch?** ESM is the official standard. The same `import` syntax works in the
browser, React, Vue, Node. Tooling (bundlers, TypeScript) is built around it.

---

## 2. Prerequisite Concept: What Does `import` Do?

```js
import express from 'express';
```

1. Finds the module `express` (in `node_modules`).
2. Loads it once.
3. Binds its **default export** to the name `express`.

An ES module can have:

- **One default export** — imported without braces, any name you like.
- **Many named exports** — imported with braces, exact names.

### Exporting

```js
// math.js
export const add = (a, b) => a + b;        // named export
export const sub = (a, b) => a - b;        // named export
export default function multiply(a, b) {   // default export
  return a * b;
}
```

### Importing

```js
// app.js
import multiply, { add, sub } from './math.js';
import * as math from './math.js';          // everything in one object

console.log(add(1, 2), multiply(2, 3));
console.log(math.sub(5, 1));
```

Renaming:

```js
import { add as sum } from './math.js';
export { add as plus };
```

---

## 3. How to Enable ESM in Node

### Option A (recommended) — `"type": "module"` in `package.json`

```json
{
  "name": "express-crash-course",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^5.1.0"
  }
}
```

Now **all `.js` files** in the project are treated as ES modules.

### Option B — use the `.mjs` extension
Only those files are ESM; `.js` remain CommonJS. Rarely used for whole apps.

### The opposite
`.cjs` files are always CommonJS, even with `"type": "module"`.

---

## 4. Converting `server.js`

### Before (CommonJS)
```js
const express = require('express');
const path = require('path');
const posts = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/posts', posts);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### After (ESM)
```js
import express from 'express';
import path from 'path';
import posts from './routes/posts.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(import.meta.dirname, 'public')));
app.use('/api/posts', posts);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### Differences to notice

1. `require(...)` → `import ... from '...'`.
2. **File extension is required** for your own files: `'./routes/posts.js'`.
   (In CommonJS you could omit `.js`.)
3. `__dirname` is not available; use `import.meta.dirname` (Node 20.11+) or the
   workaround in lesson 28.

---

## 5. Converting `routes/posts.js`

### Before
```js
const express = require('express');
const router = express.Router();
// ...
module.exports = router;
```

### After
```js
import express from 'express';
const router = express.Router();

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];

router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10);
  res.status(200).json(limit > 0 ? posts.slice(0, limit) : posts);
});

router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  res.status(200).json(post);
});

export default router;
```

---

## 6. Conversion Cheat Sheet

| CommonJS | ES Modules |
|----------|-----------|
| `const a = require('a')` | `import a from 'a'` |
| `const { x } = require('a')` | `import { x } from 'a'` |
| `const b = require('./b')` | `import b from './b.js'` |
| `module.exports = thing` | `export default thing` |
| `module.exports = { a, b }` | `export { a, b }` |
| `exports.a = 1` | `export const a = 1` |
| `require('dotenv').config()` | `import 'dotenv/config'` |
| `const fs = require('fs')` | `import fs from 'fs'` (or `'node:fs'`) |
| `const fsp = require('fs/promises')` | `import fsp from 'fs/promises'` |
| `const { readFile } = require('fs/promises')` | `import { readFile } from 'fs/promises'` |
| `__dirname` | `import.meta.dirname` / workaround |
| `__filename` | `import.meta.filename` / workaround |

### The `node:` prefix
`import fs from 'node:fs'` makes it explicit that the module is built into Node. It is
recommended style in modern code.

---

## 7. Important Behaviour Differences

### 7.1 Imports are hoisted
`import` statements are processed **before** any code runs, no matter where they are
written. Keep them at the top.

### 7.2 Imports are live read-only bindings
```js
// counter.js
export let count = 0;
export function inc() { count++; }

// app.js
import { count, inc } from './counter.js';
inc();
console.log(count);   // 1  (live view)
count = 5;            // ❌ TypeError: Assignment to constant variable
```

This matters for our `posts` array: another module cannot **reassign** an imported
variable — it can only mutate the object/array or call a function exported by the
owner module.

### 7.3 Strict mode always on
ES modules run in strict mode: undeclared variables throw errors, etc.

### 7.4 Top-level `await`
```js
import fs from 'node:fs/promises';
const text = await fs.readFile('./data.json', 'utf8');   // no async wrapper needed
const data = JSON.parse(text);
```

### 7.5 Dynamic import
```js
const mod = await import('./heavy.js');       // load on demand
```

### 7.6 Importing JSON
```js
import data from './data.json' with { type: 'json' };   // modern Node (22+)
```
Older approach: read with `fs` and `JSON.parse`.

### 7.7 Importing CommonJS from ESM
Allowed: `import express from 'express'` works because Express is CommonJS — Node
exposes `module.exports` as the **default** import. Named imports from CJS packages
sometimes work, sometimes not; if `import { x } from 'pkg'` fails, use
`import pkg from 'pkg'; const { x } = pkg;`.

### 7.8 Requiring ESM from CommonJS
Traditionally impossible with `require` (modern Node versions are adding support, but do
not rely on it). Use dynamic `import()` in CJS.

---

## 8. Common Errors and Fixes

### Error 1
```
SyntaxError: Cannot use import statement outside a module
```
**Cause:** you wrote `import` but Node treats the file as CommonJS.
**Fix:** add `"type": "module"` to `package.json` (or rename to `.mjs`).

### Error 2
```
ReferenceError: require is not defined in ES module scope
```
**Cause:** you used `require` in an ESM file.
**Fix:** change to `import`, or use `createRequire`:
```js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
```

### Error 3
```
ReferenceError: __dirname is not defined in ES module scope
```
**Fix:** `import.meta.dirname` or lesson 28's workaround.

### Error 4
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/routes/posts' imported from /app/server.js
```
**Cause:** you forgot the extension.
**Fix:** `import posts from './routes/posts.js'`.

### Error 5
```
SyntaxError: The requested module './x.js' does not provide an export named 'y'
```
**Cause:** wrong name, or it was a default export.
**Fix:** check `export` statements; named needs braces, default does not.

---

## 9. Default vs Named Exports — Which to Choose?

| Style | Example | Pros | Cons |
|-------|---------|------|------|
| Default | `export default router` | Simple for "one thing per file" | Importer can name it anything → inconsistent names |
| Named | `export const getPosts` | Exact names, good autocompletion, tree-shaking | Need braces |

Convention used in this course:

- **Routers:** `export default router`.
- **Controllers:** named exports (`export const getPosts = ...`) — lesson 27.
- **Middleware:** named or default (we will use named, e.g., `export const logger`).

---

## 10. File Extensions in Imports

| You write | Works in ESM? |
|-----------|---------------|
| `'./routes/posts.js'` | ✅ |
| `'./routes/posts'` | ❌ |
| `'./routes'` (folder with `index.js`) | ❌ (must write `'./routes/index.js'`) |
| `'express'` | ✅ (package) |
| `'node:path'` | ✅ |

Editors like VS Code auto-add extensions if configured; otherwise you must type them.

---

## 11. Project After Conversion

```
express-crash-course/
├── package.json           <- "type": "module"
├── server.js
├── routes/
│   └── posts.js           <- export default router
└── public/
```

`package.json` snippet:

```json
{
  "type": "module",
  "scripts": {
    "dev": "node --watch server.js"
  }
}
```

---

## 12. Mixing Strategy

Some tools expect CJS config files (older ESLint, Jest, etc.). Solutions:

- Name those files `.cjs` (`jest.config.cjs`).
- Or use the tool's ESM-compatible config.

---

## 13. Performance and Tooling Notes

- ESM loading is async and enables static analysis (bundlers can drop unused code).
- Circular imports in ESM are handled with live bindings but still confusing — avoid them.
- TypeScript, React, Vite, Next.js all use ESM syntax; learning it now helps everywhere.

---

## 14. Security Perspective 🔐

- `import` statements are static; the module graph is known before running, which helps
  audit tools and bundlers.
- Dynamic `import(userInput)` is dangerous — **never** import a path built from user data
  (arbitrary code execution).
- Same supply-chain caution: each `import` of a package runs third-party code. Review
  dependencies and run `npm audit`.

---

## 15. Complete Example

### `package.json`
```json
{
  "name": "express-crash-course",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^5.1.0"
  }
}
```

### `server.js`
```js
import express from 'express';
import path from 'node:path';
import posts from './routes/posts.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(import.meta.dirname, 'public')));
app.use('/api/posts', posts);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### `routes/posts.js`
```js
import { Router } from 'express';

const router = Router();

const posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
];

router.get('/', (req, res) => res.json(posts));

export default router;
```

Notice `import { Router } from 'express'` — a **named** import from the CJS package
(works because Express exposes `Router` as a property).

---

## 16. Exercises

1. Add `"type": "module"` and convert `server.js` to ESM.
2. Convert `routes/posts.js` and `routes/users.js`.
3. Deliberately import without `.js` and read the error message.
4. Create `utils.js` with two named exports and one default export; import them all.
5. Use top-level `await` to read a JSON file before the server starts.
6. Trigger and fix `ReferenceError: __dirname is not defined`.
7. Rename `server.js` to `server.cjs` in a copy of the project and see what breaks.

### Challenge
Create `config.js` that exports `const config = {...}` (named) and use `import 'dotenv/config'`
at its top. Import `config` in `server.js` and use `config.port`.

<details><summary>Solution</summary>

```js
// config.js
import 'dotenv/config';
export const config = {
  port: Number(process.env.PORT) || 5000,
  env: process.env.NODE_ENV || 'development',
};

// server.js
import { config } from './config.js';
app.listen(config.port, () => console.log(`Running on ${config.port}`));
```
</details>

---

## 17. Quick Quiz

1. Which `package.json` field turns on ES Modules for `.js` files?
2. Is the file extension required in ESM relative imports?
3. How do you import a default export vs a named export?
4. What replaces `__dirname` in modern Node ESM?
5. Can you reassign an imported variable?
6. What does top-level `await` allow?

<details><summary>Answers</summary>

1. `"type": "module"`.
2. Yes.
3. `import x from` vs `import { x } from`.
4. `import.meta.dirname` (or a workaround with `import.meta.url`).
5. No, imports are read-only bindings.
6. Using `await` outside an `async` function in a module.
</details>

---

## 18. Summary

- ESM is the JavaScript standard: `import` / `export`.
- Enable it with `"type": "module"`; include `.js` in relative import paths.
- No `require`, `module.exports`, `__dirname` in ESM (use `import.meta`).
- Default export → import without braces; named exports → braces.
- Imports are hoisted, read-only live bindings; top-level await is allowed.
- Most errors come from missing `type`, missing extension, or leftover `require`.

---

## 19. Next Lesson

➡️ **19 — Request Body Data**
Learn how clients send data to the server and how Express parses it.
