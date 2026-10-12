# 03 — Prerequisites

> **Goal:** Make sure you have every skill required for Express, with a quick
> revision of each, so you never feel lost.

---

## 1. Why a Prerequisites Lesson?

Express is simple *only if* the basics are solid. When beginners struggle with Express,
the real problem is usually one of these:

- confusion about **callbacks** and **arrow functions**
- not knowing what **`require` / `import`** do
- not understanding **JSON**
- not understanding **HTTP methods and status codes**
- not being comfortable in the **terminal**

Let us check each skill. If any section feels unfamiliar, revise it before moving on.

---

## 2. Checklist

Tick every item you can explain *in your own words*.

- [ ] Using the terminal (cd, ls, mkdir, cat)
- [ ] Git basics (init, add, commit, push) and a GitHub repo
- [ ] HTML structure, forms and inputs
- [ ] CSS basics
- [ ] JavaScript: variables, functions, arrow functions
- [ ] JavaScript: objects, arrays, array methods (`map`, `filter`, `find`)
- [ ] JavaScript: callbacks, Promises, `async/await`
- [ ] JavaScript: destructuring, template literals, spread
- [ ] JavaScript: `fetch` (we use it later)
- [ ] Node.js: running a file, `npm`, `package.json`, modules
- [ ] Node.js: `process.env`, `__dirname`, `path` module
- [ ] HTTP: methods, status codes, headers
- [ ] JSON: `JSON.stringify`, `JSON.parse`
- [ ] MySQL basics (not required for this course, but useful afterwards)

---

## 3. Terminal / Linux Skills

You need these commands daily:

| Command | Meaning |
|---------|---------|
| `pwd` | Show current folder |
| `ls` | List files |
| `cd folder` | Enter a folder |
| `cd ..` | Go up one level |
| `mkdir name` | Create folder |
| `touch file.js` | Create empty file |
| `cat file.js` | Print file content |
| `rm file` | Delete a file |
| `code .` | Open VS Code here (if installed) |
| `Ctrl + C` | **Stop a running server** |

> `Ctrl + C` is very important. A running Express server never ends by itself.
> Press `Ctrl + C` in the terminal to stop it.

### Practice
```bash
mkdir express-practice
cd express-practice
pwd
touch app.js
ls
```

---

## 4. Git and GitHub Skills

You will commit your work after each lesson. Minimum required:

```bash
git init
git add .
git commit -m "lesson 05: express setup"
git branch -M main
git remote add origin https://github.com/<you>/express-practice.git
git push -u origin main
```

### Very important: `.gitignore`
Never push `node_modules` or secrets (`.env`) to GitHub.

```
node_modules
.env
```

> 🔐 **Security reminder:** Pushing `.env` files to GitHub is one of the most common
> real-world leaks (API keys, database passwords). Add `.env` to `.gitignore` *before*
> your first commit.

---

## 5. HTML Skills Needed

You should be able to write a page and a form.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Page</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Hello</h1>

  <form action="/submit" method="POST">
    <input type="text" name="username" />
    <button type="submit">Send</button>
  </form>

  <script src="app.js"></script>
</body>
</html>
```

Key points:
- `action` = URL where the form data is sent.
- `method` = HTTP method (GET or POST).
- `name` attribute = the **key** in the data received by the server.

---

## 6. CSS Skills Needed

Only basics: selectors, colors, margins, flex. Express itself does not need CSS,
but when serving static sites (lesson 9) you will link a stylesheet.

```css
body { font-family: Arial, sans-serif; background: #f5f5f5; }
h1   { color: #333; }
```

---

## 7. JavaScript Skills — The Most Important Part

### 7.1 Functions and arrow functions

```js
function add(a, b) { return a + b; }
const add2 = (a, b) => a + b;
```

Express handlers are almost always arrow functions:

```js
app.get('/', (req, res) => {
  res.send('Hi');
});
```

### 7.2 Callbacks

A **callback** is a function you pass to another function to be called later.

```js
setTimeout(() => console.log('after 1 second'), 1000);

[1, 2, 3].forEach((n) => console.log(n));
```

In Express, **every route handler is a callback.**

### 7.3 Objects and arrays

```js
const user = { id: 1, name: 'Asha', skills: ['js', 'sql'] };
console.log(user.name);        // Asha
console.log(user['name']);     // Asha

const users = [{ id: 1 }, { id: 2 }];
users.find((u) => u.id === 2);          // { id: 2 }
users.filter((u) => u.id > 1);          // [ { id: 2 } ]
users.map((u) => u.id);                 // [1, 2]
```

You will use `find`, `filter`, `map`, `push`, `splice` heavily when building the
in-memory API (lessons 20–22).

### 7.4 Destructuring

```js
const { name, skills } = user;
const [first, second] = [10, 20];
```

Used in Express like this:

```js
const { id } = req.params;
const { name, email } = req.body;
```

### 7.5 Template literals

```js
const name = 'Asha';
console.log(`Hello, ${name}!`);
```

### 7.6 Spread operator

```js
const a = { x: 1 };
const b = { ...a, y: 2 };   // { x: 1, y: 2 }
```

### 7.7 Promises and async/await

Database and file operations take time. JavaScript handles waiting with Promises.

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('start');
  await wait(1000);
  console.log('after 1 sec');
}
run();
```

In Express:

```js
app.get('/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});
```

### 7.8 try / catch

```js
try {
  JSON.parse('not json');
} catch (err) {
  console.log('Error:', err.message);
}
```

### 7.9 `fetch` (front-end)

```js
const res = await fetch('/api/users');
const data = await res.json();
console.log(data);
```

Used in lessons 29–30.

### 7.10 Truthy / falsy and equality
- Use `===` not `==`.
- Falsy values: `false, 0, '', null, undefined, NaN`.

---

## 8. Node.js Skills Needed

### 8.1 Running a file
```bash
node app.js
```

### 8.2 npm and `package.json`

```bash
npm init -y
npm install express
npm install --save-dev nodemon
```

`package.json` example:

```json
{
  "name": "express-practice",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
```

| Field | Meaning |
|-------|---------|
| `scripts` | Shortcuts you run with `npm run <name>` |
| `dependencies` | Packages needed to run the app |
| `devDependencies` | Packages needed only during development |

### 8.3 Modules

**CommonJS**
```js
const fs = require('fs');
module.exports = { hello };
```

**ES Modules**
```js
import fs from 'fs';
export const hello = () => {};
```
(You need `"type": "module"` in `package.json`. Lesson 18 explains this.)

### 8.4 Built-in modules we will use
| Module | Use |
|--------|-----|
| `path` | Build safe file paths |
| `fs` | Read/write files |
| `url` | Work with URLs (`fileURLToPath`) |
| `http` | The base layer Express uses |

### 8.5 `process.env`

Environment variables are values outside your code.

```js
console.log(process.env.PORT);   // undefined if not set
const PORT = process.env.PORT || 3000;
```

### 8.6 `__dirname` and `__filename`

```js
console.log(__dirname);    // folder of current file
console.log(__filename);   // full path of current file
```

(These do not exist in ES Modules; lesson 28 covers the workaround.)

---

## 9. HTTP Skills Needed

### 9.1 Methods

| Method | Meaning | Typical use |
|--------|---------|-------------|
| GET | Read data | Open a page, list items |
| POST | Create data | Submit a form, add item |
| PUT | Replace/update data | Edit an item |
| PATCH | Partially update | Change one field |
| DELETE | Remove data | Delete an item |

These map nicely to database **CRUD** (Create, Read, Update, Delete),
which you know from MySQL as INSERT, SELECT, UPDATE, DELETE.

| CRUD | HTTP | SQL |
|------|------|-----|
| Create | POST | INSERT |
| Read | GET | SELECT |
| Update | PUT / PATCH | UPDATE |
| Delete | DELETE | DELETE |

### 9.2 Status codes

| Range | Meaning | Examples |
|-------|---------|----------|
| 1xx | Information | rarely used |
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirect | 301, 302 |
| 4xx | Client error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| 5xx | Server error | 500 Internal Server Error |

### 9.3 Headers

Key–value metadata sent with requests and responses.

| Header | Example value | Meaning |
|--------|---------------|---------|
| `Content-Type` | `application/json` | Format of the body |
| `Accept` | `text/html` | What the client wants back |
| `Authorization` | `Bearer abc123` | Login token |
| `User-Agent` | `Mozilla/5.0 ...` | Who is making the request |

### 9.4 URL anatomy

```
https://example.com:3000/users/42?sort=asc&page=2#top
\___/   \_________/ \__/ \_____/ \____________/ \_/
scheme     host     port  path      query       hash
```

You will meet **path** and **query** many times (lessons 13 and 14).

---

## 10. JSON Skills Needed

JSON = JavaScript Object Notation. A text format to exchange data.

```json
{
  "id": 1,
  "name": "Asha",
  "active": true,
  "skills": ["js", "sql"],
  "address": { "city": "Hyderabad" }
}
```

Rules:
- Keys **must** be in double quotes.
- Strings use double quotes only.
- No trailing commas, no comments.
- Values: string, number, boolean, null, array, object.

Convert:

```js
const text = JSON.stringify({ a: 1 });   // '{"a":1}'
const obj  = JSON.parse('{"a":1}');      // { a: 1 }
```

---

## 11. Tools to Install

| Tool | Why | Check |
|------|-----|-------|
| Node.js (LTS) | Run JavaScript | `node -v` |
| npm | Install packages | `npm -v` |
| VS Code | Code editor | open it |
| Git | Version control | `git --version` |
| Postman | Test APIs (lesson 11) | open it |
| A browser | Chrome / Firefox / Edge | — |

Recommended: Node version 18 or higher (Express 4 and 5 both work; features like
`--watch` need Node 18.11+).

```bash
node -v      # e.g., v20.11.0
npm -v       # e.g., 10.2.4
```

---

## 12. A Mini Self-Test (Code Reading)

Read the code and predict the output **before** running it.

### Test 1
```js
const nums = [1, 2, 3, 4];
const result = nums.filter((n) => n % 2 === 0).map((n) => n * 10);
console.log(result);
```
<details><summary>Answer</summary>`[20, 40]`</details>

### Test 2
```js
const { a, b = 5 } = { a: 1 };
console.log(a, b);
```
<details><summary>Answer</summary>`1 5`</details>

### Test 3
```js
const port = process.env.PORT || 4000;
console.log(port);
```
<details><summary>Answer</summary>`4000` if PORT is not set.</details>

### Test 4
```js
async function f() { return 5; }
console.log(f());
```
<details><summary>Answer</summary>`Promise { 5 }` — async functions always return a Promise.</details>

### Test 5
```js
console.log(JSON.stringify({ x: undefined, y: 1 }));
```
<details><summary>Answer</summary>`{"y":1}` — `undefined` values are skipped.</details>

---

## 13. Mindset for Learning Express

1. **Type the code yourself.** Do not copy-paste; your fingers learn.
2. **Run after every small change.**
3. **Read error messages fully** — Node errors tell you the file and line.
4. **Use `console.log(req.something)`** to explore what you get.
5. **Commit often** with Git.
6. **Break things on purpose** to see what happens.

---

## 14. Common Setup Problems and Fixes

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| `node: command not found` | Node not installed or not on PATH | Install Node LTS; reopen terminal |
| `Cannot find module 'express'` | Not installed or wrong folder | `npm install express` in the project folder |
| `EADDRINUSE: address already in use :::3000` | Another program uses port 3000 | Stop it or change the port |
| Changes not showing | Server not restarted | Restart or use `--watch` (lesson 7) |
| `SyntaxError: Cannot use import statement outside a module` | Using `import` without `"type": "module"` | See lesson 18 |

### Finding and killing a process on a port (Linux/macOS)
```bash
lsof -i :3000
kill -9 <PID>
```

---

## 15. Revision Resources

- MDN Web Docs — JavaScript Guide
- Node.js official docs — `nodejs.org/docs`
- HTTP basics on MDN — "An overview of HTTP"
- Your own notes from MySQL, Git and Node lessons

---

## 16. Quick Quiz

1. What does `Ctrl + C` do in a terminal running a server?
2. Which HTTP method matches SQL `INSERT`?
3. What status code means "Not Found"?
4. What does `process.env.PORT || 3000` do?
5. Why is `.env` placed in `.gitignore`?
6. What is a callback?
7. Convert `{ "a": 1 }` text into an object in JavaScript.

<details><summary>Answers</summary>

1. Stops the running process.
2. POST.
3. 404.
4. Uses the PORT variable if present; otherwise 3000.
5. To avoid leaking secrets to GitHub.
6. A function passed to another function to be called later.
7. `JSON.parse('{"a":1}')`.
</details>

---

## 17. Summary

- You need: terminal, Git, HTML, JS (callbacks, async, destructuring), Node (npm, modules, env), HTTP, JSON.
- Express handlers are callbacks receiving `req` and `res`.
- HTTP methods map to CRUD and to SQL statements.
- Always protect secrets: `.env` stays out of Git.
- Check `node -v`, `npm -v`, `git --version` before starting lesson 5.

---

## 18. Next Lesson

➡️ **04 — What We'll Cover**
A roadmap of the entire course with the project you will understand at the end.
