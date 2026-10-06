# 08 — `res.sendFile()` Method

> **Goal:** Send real HTML files from your server, understand absolute paths, the
> `path` module and `__dirname`, and avoid the classic path errors.

---

## 1. Why Not Just Use `res.send('<h1>...</h1>')`?

For a tiny test it is fine. For a real page it becomes a nightmare:

```js
res.send('<!DOCTYPE html><html><head><title>Home</title></head><body>...300 lines...</body></html>');
```

Problems:
- No syntax highlighting or autocomplete for HTML.
- Hard to read and maintain.
- Designers cannot edit the page without touching JavaScript.

**Better:** keep HTML in `.html` files and let Express send the file.

---

## 2. Prerequisite Concept: Relative vs Absolute Paths

| Type | Example | Starts from |
|------|---------|-------------|
| **Relative** | `./public/index.html`, `index.html` | The *current working directory* of the running process |
| **Absolute** | `/home/user/app/public/index.html` | The root of the filesystem |

### The danger of relative paths
The *current working directory* is where you **ran the command**, not where the file lives.

```bash
cd /home/user/app
node server.js          # cwd = /home/user/app  -> './public' works

cd /home/user
node app/server.js      # cwd = /home/user      -> './public' is WRONG
```

So code that depends on the cwd breaks easily. That is why `res.sendFile` demands an
**absolute path** (or a `root` option).

---

## 3. Prerequisite Concept: `__dirname` and `__filename`

In CommonJS Node gives you two helpful variables in every file:

```js
console.log(__filename);  // /home/user/app/server.js
console.log(__dirname);   // /home/user/app
```

`__dirname` = the folder where **this file** lives, no matter where you ran Node from.
Perfect for building paths.

---

## 4. Prerequisite Concept: The `path` Module

Building paths with `+ '/'` is error-prone (slashes differ between operating systems).
Use Node's built-in `path` module:

```js
const path = require('path');

path.join('/home/user', 'app', 'index.html');
// '/home/user/app/index.html'

path.join(__dirname, 'public', 'index.html');
// '/home/user/app/public/index.html'

path.resolve('public', 'index.html');
// absolute path from the cwd

path.basename('/a/b/file.txt');   // 'file.txt'
path.extname('/a/b/file.txt');    // '.txt'
path.dirname('/a/b/file.txt');    // '/a/b'
```

| Function | Behavior |
|----------|----------|
| `path.join(a, b, ...)` | Joins segments with the correct separator and normalizes `..` |
| `path.resolve(a, b, ...)` | Produces an absolute path; builds from right to left until absolute |

---

## 5. Step 1 — Create the HTML Files

Project structure:

```
express-crash-course/
├── server.js
├── package.json
└── public/
    ├── index.html
    └── about.html
```

### `public/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Home</title>
</head>
<body>
  <h1>Home Page</h1>
  <p>Welcome to my Express website.</p>
  <a href="/about">About</a>
</body>
</html>
```

### `public/about.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>About</title>
</head>
<body>
  <h1>About Page</h1>
  <p>This page is sent with res.sendFile().</p>
  <a href="/">Home</a>
</body>
</html>
```

---

## 6. Step 2 — Send the Files

```js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Run `npm run dev` and visit `/` and `/about`.

---

## 7. How `res.sendFile()` Works

```
res.sendFile(absolutePath [, options] [, callback])
```

Internally Express:
1. Checks the file exists.
2. Sets the `Content-Type` from the file extension (`.html` → `text/html`).
3. Sets `Content-Length`, `ETag`, `Last-Modified`.
4. **Streams** the file to the client (efficient for big files).
5. Supports caching headers and range requests.

| Extension | Content-Type |
|-----------|--------------|
| `.html` | `text/html` |
| `.css` | `text/css` |
| `.js` | `text/javascript` |
| `.json` | `application/json` |
| `.png` | `image/png` |
| `.pdf` | `application/pdf` |

---

## 8. The `root` Option (Cleaner Alternative)

Instead of joining the full path:

```js
res.sendFile('index.html', { root: path.join(__dirname, 'public') });
```

Here the first argument is **relative to `root`**. This is also **safer** because Express
refuses paths that try to escape the root (like `../../etc/passwd`).

---

## 9. Security: Path Traversal ⚠️

> This is a real attack — know it.

Imagine this code:

```js
// DANGEROUS!
app.get('/file/:name', (req, res) => {
  res.sendFile(__dirname + '/public/' + req.params.name);
});
```

Attacker visits: `/file/..%2F..%2F.env` (the `%2F` is an encoded `/`). The path becomes
`/home/user/app/public/../../.env` → the attacker reads your secrets.

### Defences
1. **Use `root`** — Express blocks `..` going outside root:

```js
res.sendFile(req.params.name, { root: path.join(__dirname, 'public') });
```

2. **Whitelist** allowed names:

```js
const allowed = ['index.html', 'about.html'];
if (!allowed.includes(req.params.name)) return res.status(404).send('Not found');
```

3. Prefer `express.static` (next lesson) for serving a folder.

Rule: **never put raw user input into a file path.**

---

## 10. Handling Errors with the Callback

```js
app.get('/report', (req, res) => {
  const file = path.join(__dirname, 'public', 'report.pdf');

  res.sendFile(file, (err) => {
    if (err) {
      console.error('Could not send file:', err.message);
      if (!res.headersSent) {
        res.status(404).send('File not found');
      }
    }
  });
});
```

- `err` is set if the file does not exist or sending fails.
- `res.headersSent` tells you if a response already started (avoid double responses).

If you skip the callback and the file is missing, Express passes the error to its error
handler (lesson 24–25) and the client gets an error page.

---

## 11. Options Worth Knowing

```js
res.sendFile(file, {
  root: path.join(__dirname, 'public'),
  headers: { 'x-sent': 'true' },
  maxAge: '1d',          // cache for one day
  dotfiles: 'deny',      // refuse files that start with a dot
});
```

| Option | Meaning |
|--------|---------|
| `root` | Base directory for relative file names |
| `maxAge` | Cache-Control max-age |
| `headers` | Extra headers to send |
| `dotfiles` | `allow`, `deny` or `ignore` dotfiles |
| `lastModified` | Send `Last-Modified` header |
| `cacheControl` | Enable/disable Cache-Control |

---

## 12. Related Methods

| Method | Purpose |
|--------|---------|
| `res.sendFile(path)` | Display / send a file (browser decides: show or download) |
| `res.download(path, filename)` | Force the browser to **download** the file |
| `res.attachment(filename)` | Set `Content-Disposition` header only |

```js
app.get('/download', (req, res) => {
  res.download(path.join(__dirname, 'public', 'about.html'), 'about-us.html');
});
```

---

## 13. A Problem: CSS and Images Are Not Loading!

Add this to `index.html`:

```html
<link rel="stylesheet" href="/style.css" />
```

Create `public/style.css`. Open the page — **the CSS does not apply.** Why?

Because the browser makes a *new request* for `/style.css`, and **you have no route for
it**. Express answers 404.

```
GET /          -> 200  (route exists)
GET /style.css -> 404  (no route!)
```

One fix: add a route per file. Terrible idea (imagine 100 images). The real fix is
the **static middleware** — next lesson.

---

## 14. Debugging with DevTools

1. Open the page → press `F12` → **Network** tab → refresh.
2. Each file requested appears in the list with status code.
3. A red `404` on `style.css` tells you immediately what is wrong.
4. Click the request → **Headers** tab shows request and response headers.

This single habit saves hours.

---

## 15. Common Mistakes

| Mistake | Error / symptom | Fix |
|---------|-----------------|-----|
| Relative path in `sendFile('public/index.html')` | `path must be absolute or specify root to res.sendFile` | Use `path.join(__dirname, ...)` |
| `__dirname + 'public'` | Missing slash → wrong path | Use `path.join` |
| Wrong folder name case (`Public`) | Works on Windows, fails on Linux | Match case exactly |
| File missing | 404 / `ENOENT` | Check spelling and folder |
| User input in the path | Path traversal | Use root / whitelist |
| Forgetting `const path = require('path')` | `path is not defined` | Add the import |

---

## 16. Complete Example

```js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: PUBLIC_DIR });
});

app.get('/about', (req, res) => {
  res.sendFile('about.html', { root: PUBLIC_DIR });
});

app.get('/download', (req, res) => {
  res.download(path.join(PUBLIC_DIR, 'about.html'), 'about-us.html');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 17. Exercises

1. Create `contact.html` and a `/contact` route.
2. Create a `404.html` page. Show it using a catch-all route placed **last**:
   ```js
   app.use((req, res) => {
     res.status(404).sendFile('404.html', { root: PUBLIC_DIR });
   });
   ```
3. Print `__dirname` and `__filename` in the console.
4. Use `path.basename`, `path.extname` on `__filename` and print results.
5. Add a `/download` route that forces download of a text file.
6. Try to run the server from a different folder (`cd .. && node express-crash-course/server.js`) and confirm the routes still work (they should, thanks to `__dirname`).

### Challenge
Write a route `/page/:name` that serves `public/<name>.html` **safely**, returning 404
for any name not in a whitelist array.

<details><summary>Solution</summary>

```js
const pages = ['index', 'about', 'contact'];

app.get('/page/:name', (req, res) => {
  const { name } = req.params;
  if (!pages.includes(name)) {
    return res.status(404).send('Page not found');
  }
  res.sendFile(`${name}.html`, { root: PUBLIC_DIR });
});
```
</details>

---

## 18. Quick Quiz

1. Why must `sendFile` use an absolute path?
2. What does `__dirname` contain?
3. Difference between `path.join` and `path.resolve`?
4. Which method forces a download?
5. What is a path traversal attack?
6. Why is CSS not loading when a page is sent with `sendFile`?

<details><summary>Answers</summary>

1. Relative paths depend on the cwd and are unsafe/ambiguous.
2. The absolute folder path of the current file.
3. `join` just joins segments; `resolve` returns an absolute path from the cwd.
4. `res.download()`.
5. Using `../` to read files outside the intended folder.
6. The browser requests `/style.css` and no route/static middleware serves it.
</details>

---

## 19. Summary

- `res.sendFile()` sends a file from disk and sets the right headers.
- It needs an **absolute path** or a `root` option.
- Use `path.join(__dirname, ...)` to build paths reliably.
- Never mix user input into file paths; use `root`, whitelists or `express.static`.
- Each CSS/JS/image is a separate request — you need a static middleware for those.

---

## 20. Next Lesson

➡️ **09 — Static Web Server**
One line of code that serves an entire folder (HTML, CSS, JS, images).
