# 28 — `__dirname` Workaround

> **Goal:** Understand why `__dirname` and `__filename` disappear in ES Modules, how to
> recreate them with `import.meta.url`, and use them for static files, views and
> `sendFile`.

---

## 1. The Error

After converting to ES Modules (lesson 18) you write:

```js
app.use(express.static(path.join(__dirname, 'public')));
```

and get:

```
ReferenceError: __dirname is not defined in ES module scope
```

Why?

---

## 2. Prerequisite Concept: Where `__dirname` Comes From

In **CommonJS**, Node wraps every file in a hidden function:

```js
(function (exports, require, module, __filename, __dirname) {
  // your file's code lives here
});
```

That's why `require`, `module`, `exports`, `__filename`, `__dirname` seem "global" — they
are actually **function parameters** that Node supplies to each file.

**ES Modules are not wrapped in that function.** They are parsed differently and have
their own, standardised way to expose module metadata: **`import.meta`**.

| CommonJS | ES Modules |
|----------|------------|
| `require` | `import` / `createRequire` |
| `module.exports` | `export` |
| `__filename` | `import.meta.filename` (Node 20.11+) / derive from `import.meta.url` |
| `__dirname` | `import.meta.dirname` (Node 20.11+) / derive from `import.meta.url` |

---

## 3. Prerequisite Concept: `import.meta.url` and `file://` URLs

`import.meta.url` is the **URL of the current module**:

```js
console.log(import.meta.url);
// file:///home/user/express-crash-course/server.js
```

Notice it is a **file URL**, not a normal path:

| Form | Example |
|------|---------|
| File path | `/home/user/app/server.js` |
| File URL | `file:///home/user/app/server.js` |

Differences:

- URLs start with `file://` and use `/` always.
- Special characters are **percent-encoded**: a space becomes `%20`
  (`/home/my%20folder/app`). `path.join` with such a string would be wrong.
- On Windows: `file:///C:/Users/me/app/server.js` vs `C:\Users\me\app\server.js`.

So we must **convert the URL to a normal path**.

---

## 4. The Classic Workaround (works on every Node version supporting ESM)

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

Step by step:

| Step | Code | Result |
|------|------|--------|
| 1 | `import.meta.url` | `file:///home/user/app/server.js` |
| 2 | `fileURLToPath(...)` | `/home/user/app/server.js` (decoded, platform-correct) |
| 3 | `path.dirname(...)` | `/home/user/app` |

We name the variables `__filename` and `__dirname` so the rest of the code looks the
same as CommonJS code you may find in tutorials. (Declaring variables with those names
is allowed in ESM because they are not already defined.)

### Using it
```js
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

---

## 5. The Modern Shortcut (Node 20.11+ / 21.2+)

```js
console.log(import.meta.dirname);    // /home/user/app
console.log(import.meta.filename);   // /home/user/app/server.js

app.use(express.static(path.join(import.meta.dirname, 'public')));
```

Check your version: `node -v`. If `import.meta.dirname` is `undefined`, use the classic
workaround. **For maximum compatibility, the classic workaround always works.**

Alternative without `path`:

```js
const publicDir = fileURLToPath(new URL('./public', import.meta.url));
```

`new URL('./public', import.meta.url)` resolves a path **relative to the current file**
as a URL object; `fileURLToPath` converts it.

---

## 6. Why Not Just Use Relative Paths Like `'./public'`?

Remember from lesson 8: relative paths for the **filesystem** are relative to the
**current working directory** (where you ran `node`), *not* to the file.

```bash
cd /home/user/app && node server.js          # cwd = /home/user/app
cd /home/user && node app/server.js          # cwd = /home/user   -> './public' breaks
```

Note: **`import './x.js'`** specifiers are relative to the **file** (module resolution),
but **`fs`, `express.static`, `res.sendFile`** use filesystem paths relative to the
**cwd**. Mixing these up is a classic confusion.

| Context | Relative to |
|---------|-------------|
| `import './routes/posts.js'` | The importing file |
| `fs.readFile('./data.json')` | Current working directory |
| `express.static('public')` | Current working directory |
| `path.join(__dirname, 'public')` | The file's folder — reliable ✅ |

Running from systemd, Docker, PM2 or cron often changes the cwd, so using
`__dirname` makes your app **independent of where it is started**.

---

## 7. Put the Workaround in a Helper (DRY)

If many files need it, avoid repeating 3 lines.

```js
// utils/paths.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// project root = one level above /utils
export const ROOT_DIR = path.resolve(__dirname, '..');
export const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
export const VIEWS_DIR = path.join(ROOT_DIR, 'views');
```

```js
// server.js
import { PUBLIC_DIR, VIEWS_DIR } from './utils/paths.js';

app.use(express.static(PUBLIC_DIR));
app.set('views', VIEWS_DIR);
```

Careful: inside `utils/paths.js`, `__dirname` is the **`utils`** folder — hence
`path.resolve(__dirname, '..')` to go up to the root.

---

## 8. Using the Paths Everywhere

### Static files
```js
app.use(express.static(PUBLIC_DIR));
```

### `res.sendFile`
```js
app.get('/about', (req, res) => {
  res.sendFile('about.html', { root: PUBLIC_DIR });
});
```

### Reading a JSON file
```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT_DIR } from './utils/paths.js';

const data = JSON.parse(await fs.readFile(path.join(ROOT_DIR, 'data', 'posts.json'), 'utf8'));
```

### EJS views folder (lesson 31)
```js
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
```

### File uploads folder
```js
const uploadDir = path.join(ROOT_DIR, 'uploads');
```

---

## 9. `path` Module Quick Reference (for this lesson)

```js
import path from 'node:path';

path.join('/a', 'b', '../c');          // '/a/c'     (joins + normalises)
path.resolve('/a', 'b', 'c');          // '/a/b/c'   (absolute result)
path.resolve('x');                     // '<cwd>/x'
path.dirname('/a/b/file.txt');         // '/a/b'
path.basename('/a/b/file.txt');        // 'file.txt'
path.basename('/a/b/file.txt', '.txt');// 'file'
path.extname('/a/b/file.txt');         // '.txt'
path.parse('/a/b/file.txt');           // { root, dir, base, ext, name }
path.sep;                              // '/' on Linux, '\\' on Windows
path.isAbsolute('/a');                 // true
```

---

## 10. Other CommonJS Features You May Miss in ESM

### `require` (needed by some old packages or JSON loading)
```js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');
console.log(pkg.version);
```

### `module.parent`, `require.main === module`
CommonJS idiom to run code only when the file is executed directly:

```js
if (require.main === module) { startServer(); }
```

ESM equivalent:

```js
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
```

### JSON import
```js
import pkg from './package.json' with { type: 'json' };   // Node 22+
```

---

## 11. Security Notes 🔐

- **Never** build file paths from user input without validation (path traversal,
  lessons 8–9). `__dirname` gives a **trusted base**; always keep user-supplied parts
  inside it using `root`, `path.basename`, or whitelists.
- Verify the final resolved path still starts with your base directory:

```js
const base = PUBLIC_DIR;
const target = path.resolve(base, userInput);
if (!target.startsWith(base + path.sep)) {
  throw new HttpError(400, 'Invalid path');
}
```

- Do not point `express.static` at `ROOT_DIR` (exposes `.env`, `package.json`, source).
- Keep uploads outside the static folder or serve them with correct `Content-Type` and
  `X-Content-Type-Options: nosniff` to avoid executing uploaded HTML/JS in the browser.

---

## 12. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Using `__dirname` directly in ESM | `ReferenceError` | Define it from `import.meta.url` |
| `path.dirname(import.meta.url)` | Path with `file:` prefix, broken | Use `fileURLToPath` first |
| Forgetting `import { fileURLToPath } from 'node:url'` | `fileURLToPath is not defined` | Import it |
| Declaring `__dirname` in a CommonJS file | `Identifier '__dirname' has already been declared` | Not needed in CJS |
| Using `__dirname` of `utils/` as project root | Wrong folder | `path.resolve(__dirname, '..')` |
| `import.meta.dirname` undefined | Old Node | Use classic workaround or upgrade |
| Hard-coded absolute path (`/home/me/app/public`) | Breaks on other machines | Use `__dirname` |
| Mixing `\` and `/` manually | Cross-platform bugs | Always `path.join` |

---

## 13. Complete Example

```js
// server.js
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import posts from './routes/posts.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static files: works from any working directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.use('/api/posts', posts);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, 'public')}`);
});
```

---

## 14. Test: Prove It Works From Anywhere

```bash
cd ~
node express-crash-course/server.js
curl -I http://localhost:5000/style.css     # should be 200
```

Then try with the relative `express.static('public')` version and see it fail with 404.
That is the practical reason for `__dirname`.

---

## 15. Exercises

1. Reproduce the `__dirname is not defined` error, then fix it with the workaround.
2. Print `import.meta.url`, `__filename`, and `__dirname` and explain each.
3. Run the server from a different folder and verify static files still work.
4. Create `utils/paths.js` exporting `ROOT_DIR` and `PUBLIC_DIR` and use it.
5. Use `createRequire` to load `package.json` and print the version in `/api/version`.
6. Try `import.meta.dirname` and check whether your Node supports it.
7. Add a safe-path check function that rejects `../` escapes.
8. Use `path.parse(__filename)` and print the object.

### Challenge
Write a route `GET /files/:name` that serves files from `public/downloads` and is safe
against path traversal even if `name` contains `..` or encoded slashes.

<details><summary>Solution idea</summary>

```js
const DOWNLOADS = path.join(__dirname, 'public', 'downloads');

app.get('/files/:name', (req, res, next) => {
  const safeName = path.basename(req.params.name);          // strips directories
  const full = path.resolve(DOWNLOADS, safeName);
  if (!full.startsWith(DOWNLOADS + path.sep)) return next(new HttpError(400, 'Invalid file'));
  res.sendFile(full, (err) => err && next(new HttpError(404, 'File not found')));
});
```
</details>

---

## 16. Quick Quiz

1. Why is `__dirname` undefined in ES modules?
2. What does `import.meta.url` contain?
3. What does `fileURLToPath` do?
4. What is the modern shortcut and which Node version introduced it?
5. Why prefer `path.join(__dirname, 'public')` over `'./public'`?
6. What does `path.dirname` return?
7. How can you use `require` inside an ES module?

<details><summary>Answers</summary>

1. ES modules are not wrapped in the CommonJS function that supplies it.
2. The `file://` URL of the current module.
3. Converts a file URL to a normal filesystem path.
4. `import.meta.dirname` / `import.meta.filename` (Node 20.11+ / 21.2+).
5. Relative paths depend on the working directory.
6. The directory part of a path.
7. `createRequire(import.meta.url)`.
</details>

---

## 17. Summary

- `__dirname`/`__filename` exist only in CommonJS (function wrapper parameters).
- In ESM derive them: `fileURLToPath(import.meta.url)` → `path.dirname(...)`; or use
  `import.meta.dirname` on modern Node.
- Always build filesystem paths from `__dirname`, never rely on the working directory.
- Centralise paths in a helper; keep user input safely inside a trusted base folder.

---

## 18. Next Lesson

➡️ **29 — Making Requests From Frontend**
Use `fetch` in the browser to talk to your Express API.
