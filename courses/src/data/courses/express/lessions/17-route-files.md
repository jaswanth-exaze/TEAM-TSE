# 17 — Route Files

> **Goal:** Move routes out of `server.js` into separate files using `express.Router()`,
> and understand `module.exports`, `require`, `app.use` with prefixes, and project
> organisation.

---

## 1. The Problem: One Giant File

Look at `server.js` now: app setup, data, 5+ routes, middleware... and we have not even
written POST/PUT/DELETE yet. Soon it would be 400+ lines. Problems:

- Hard to find things.
- Merge conflicts when teammates edit the same file.
- Hard to test and reuse.
- Mixed responsibilities (setup + routing + logic).

**Solution:** one **file per resource** (posts, users, products...).

---

## 2. Prerequisite Concept: Modules in CommonJS (Quick Revision)

Every file in Node is a **module** with its own scope. Variables are private unless exported.

### Exporting
```js
// math.js
const add = (a, b) => a + b;
const sub = (a, b) => a - b;

module.exports = { add, sub };          // export an object
// or: module.exports = add;           // export a single thing
// or: exports.add = add;              // shortcut for adding properties
```

### Importing
```js
// app.js
const { add, sub } = require('./math');   // note ./ for your own files
console.log(add(2, 3));                   // 5
```

Key facts:
- `require` runs the file **once** and **caches** the result.
- Paths for your files start with `./` or `../` (extension `.js` optional).
- `module.exports` is what `require` returns.

(Lesson 18 shows the modern `import/export` version.)

---

## 3. Concept: `express.Router`

A **Router** is a "mini application" that can have its own routes and middleware, but
cannot start a server by itself. You **mount** it onto the main app.

```js
const router = express.Router();

router.get('/', handler);
router.post('/', handler);

module.exports = router;
```

Think of it as a **department** in a company; the `app` is the **headquarters** that
directs visitors to the correct department.

```
app  ──/api/posts──►  postsRouter  (get /, get /:id, post /, ...)
     ──/api/users──►  usersRouter
```

---

## 4. Step 1 — Create the `routes` Folder

```
express-crash-course/
├── server.js
├── routes/
│   └── posts.js
└── public/
```

---

## 5. Step 2 — Write `routes/posts.js`

```js
const express = require('express');
const router = express.Router();

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];

// GET /api/posts
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10);
  if (!isNaN(limit) && limit > 0) {
    return res.status(200).json(posts.slice(0, limit));
  }
  res.status(200).json(posts);
});

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ message: `A post with the id of ${id} was not found` });
  }
  res.status(200).json(post);
});

module.exports = router;
```

**Notice:** the paths are `'/'` and `'/:id'` — **not** `/api/posts`. The prefix is added
when we mount the router. This makes the file reusable: you can mount it under
`/api/v1/posts` later without editing it.

---

## 6. Step 3 — Mount It in `server.js`

```js
const express = require('express');
const path = require('path');
const posts = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/posts', posts);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### How Express resolves a request

Request: `GET /api/posts/2`

1. `express.static` — no file `public/api/posts/2` → `next()`.
2. `app.use('/api/posts', posts)` — path starts with `/api/posts` ✔.
   Express **strips** the prefix → inside the router the path is `/2`.
3. Router: `router.get('/', ...)` → `/` ≠ `/2`; `router.get('/:id', ...)` ✔ matches
   with `id = '2'`.
4. Handler responds.

### `app.use(path, router)` vs `app.get(path, handler)`

| | `app.use('/api/posts', x)` | `app.get('/api/posts', x)` |
|---|---|---|
| Methods | all | GET only |
| Path match | **prefix** (starts with) | exact |
| Strips prefix? | yes | no |
| Used for | routers, middleware | endpoint handlers |

---

## 7. Adding a Second Router

```js
// routes/users.js
const express = require('express');
const router = express.Router();

const users = [
  { id: 1, name: 'Asha' },
  { id: 2, name: 'Ravi' },
];

router.get('/', (req, res) => res.json(users));

router.get('/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;
```

```js
// server.js
const users = require('./routes/users');
app.use('/api/users', users);
```

---

## 8. Router-Level Middleware

A router can have its own middleware that runs only for its routes:

```js
// routes/posts.js
router.use((req, res, next) => {
  console.log('Posts router hit:', req.method, req.originalUrl);
  next();
});
```

Inside the router `req.url` is the **stripped** path (`/2`), but `req.originalUrl` keeps
the full original (`/api/posts/2`). `req.baseUrl` holds the mount path (`/api/posts`).

| Property | Value for `GET /api/posts/2?x=1` inside the posts router |
|----------|---------------------------------------------------------|
| `req.originalUrl` | `/api/posts/2?x=1` |
| `req.baseUrl` | `/api/posts` |
| `req.url` | `/2?x=1` |
| `req.path` | `/2` |

---

## 9. Nested Routers

```js
// routes/comments.js
const router = express.Router({ mergeParams: true });   // inherit :postId from parent
router.get('/', (req, res) => {
  res.json({ postId: req.params.postId, comments: [] });
});
module.exports = router;

// routes/posts.js
const comments = require('./comments');
router.use('/:postId/comments', comments);
```

`GET /api/posts/5/comments` → `{ postId: '5', comments: [] }`.
Without `mergeParams: true` the child router would not see `postId`.

---

## 10. `router.route()` — Chain Methods on the Same Path

```js
router
  .route('/:id')
  .get((req, res) => { /* read */ })
  .put((req, res) => { /* update */ })
  .delete((req, res) => { /* delete */ });
```

Avoids repeating `'/:id'` and typos. We will use it in lessons 21–22.

---

## 11. Sharing Data Between Files

Currently `posts` lives inside `routes/posts.js`. Fine for now. In lesson 27 (controllers)
we will move logic and data into a separate layer. Never `require` a router file just to
reach its data; export what you need from a proper module instead.

If two files need the same array, put it in its own module:

```js
// data/posts.js
let posts = [ /* ... */ ];
module.exports = posts;     // same array object is shared (required modules are cached)
```

Caution: if you **reassign** (`posts = posts.filter(...)`) in another file you only change
that file's variable, not the exported array. Mutate in place (`splice`) or export getter
and setter functions. This subtlety matters in lesson 22 (DELETE).

---

## 12. Recommended Folder Layout

```
express-crash-course/
├── server.js              <- app setup, middleware, mount routers
├── routes/
│   ├── posts.js           <- URL → controller mapping
│   └── users.js
├── controllers/           <- (lesson 27) logic
├── middleware/            <- (lesson 23+) custom middleware
├── data/                  <- sample data
├── public/                <- static files
└── views/                 <- (lesson 31) templates
```

Naming conventions:
- Lowercase file names; plural for resources: `posts.js`, `users.js`.
- Routes only describe **URLs and methods**; logic goes elsewhere later.

---

## 13. Versioning Your API

```js
app.use('/api/v1/posts', postsV1);
app.use('/api/v2/posts', postsV2);
```

Because routers know nothing about their prefix, versioning is easy.

---

## 14. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting `module.exports = router` | `app.use` throws "requires a middleware function" | Export the router |
| Using `/api/posts` inside router paths AND mount prefix | Routes become `/api/posts/api/posts` | Use `'/'` inside the router |
| Forgetting `./` in `require('./routes/posts')` | `Cannot find module` | Add `./` |
| Mounting after the 404 handler | Routes never run | Mount before 404 |
| `app.get('/api/posts', router)` | Router only gets exact path | Use `app.use` |
| Circular requires | `undefined` imports | Restructure; avoid mutual dependencies |
| Not using `mergeParams` | `req.params.postId` undefined in child | `Router({ mergeParams: true })` |

---

## 15. Debugging Routes

Print all registered routes (Express 4 internals; for learning):

```js
function listRoutes(app) {
  app._router.stack.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      console.log(methods, layer.route.path);
    }
  });
}
```

For routers mounted via `use`, the stack contains `router` layers; third-party packages
like `express-list-endpoints` show everything. Or just test with Postman.

---

## 16. Complete Example

### `server.js`
```js
const express = require('express');
const path = require('path');
const posts = require('./routes/posts');
const users = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/posts', posts);
app.use('/api/users', users);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### `routes/posts.js`
```js
const express = require('express');
const router = express.Router();

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];

router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10);
  res.json(limit > 0 ? posts.slice(0, limit) : posts);
});

router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
});

module.exports = router;
```

---

## 17. Exercises

1. Create `routes/posts.js` and mount it at `/api/posts`.
2. Create `routes/users.js` and mount it at `/api/users`.
3. Add router-level logging middleware to posts and print `req.baseUrl`, `req.path`.
4. Mount the same posts router at `/api/v2/posts` as well and test both.
5. Create `routes/comments.js` with `mergeParams` and mount it under posts.
6. Rewrite `/:id` with `router.route('/:id').get(...)`.
7. Draw the request flow for `GET /api/users/2` on paper.

### Challenge
Create a `routes/index.js` that mounts all other routers, then in `server.js` only write
`app.use('/api', require('./routes'))`.

<details><summary>Solution</summary>

```js
// routes/index.js
const express = require('express');
const router = express.Router();
router.use('/posts', require('./posts'));
router.use('/users', require('./users'));
module.exports = router;
```
</details>

---

## 18. Quick Quiz

1. What is `express.Router()`?
2. Why use `'/'` instead of `'/api/posts'` inside a router file?
3. What does `app.use('/api/posts', router)` do to the URL inside the router?
4. What does `module.exports` do?
5. When do you need `mergeParams`?
6. Difference between `req.originalUrl` and `req.url` inside a router?

<details><summary>Answers</summary>

1. A mini app for grouping routes and middleware.
2. The prefix is provided when mounting, so the router is reusable.
3. Strips the mount prefix.
4. Defines what other files get when they `require` this file.
5. When a child router needs params defined in the parent path.
6. `originalUrl` is the full URL; `url` is stripped of the mount path.
</details>

---

## 19. Summary

- Split routes into files with `express.Router()`; export with `module.exports`.
- Mount with `app.use('/prefix', router)`; the router sees paths without the prefix.
- Routers can have their own middleware and nested routers (`mergeParams`).
- `router.route()` chains methods for one path.
- Organise by resource; keep `server.js` small.

---

## 20. Next Lesson

➡️ **18 — Using ES Modules**
Switch from `require/module.exports` to `import/export` — the modern JavaScript standard.
