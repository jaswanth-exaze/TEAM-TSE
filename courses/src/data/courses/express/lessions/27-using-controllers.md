# 27 — Using Controllers

> **Goal:** Separate **routing** (which URL → which function) from **logic** (what the
> function does) by introducing controller files, and understand the MVC-style layering
> that makes apps maintainable.

---

## 1. The Problem: Fat Route Files

Look at `routes/posts.js` after lessons 20–22:

```js
router.post('/', (req, res, next) => {
  const { title } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) { ... }
  const newPost = { id: nextId++, title: title.trim() };
  posts.push(newPost);
  res.status(201).json(newPost);
});
// ... plus GET, GET:id, PUT, DELETE, each 10–20 lines
```

The route file now mixes:

1. **URL definitions** (what paths exist)
2. **Business logic** (validation, data changes)
3. **Data storage** (the array)

Consequences: hard to read, hard to test, hard to swap storage (array → MySQL).

---

## 2. Prerequisite Concept: Separation of Concerns & MVC

**Separation of concerns:** each part of the program has *one* responsibility.

**MVC** (Model–View–Controller) is a classic pattern:

| Layer | Responsibility | In our project |
|-------|----------------|----------------|
| **Model** | Data and rules (database access) | `models/` (later: MySQL queries) — for now the array |
| **View** | What the user sees | HTML / EJS templates (lessons 31–34) or JSON |
| **Controller** | Receives request, calls model, chooses response | `controllers/` |
| Routes | Map URL + method → controller function | `routes/` |

Request flow:

```
Client
  │  GET /api/posts/2
  ▼
Route        router.get('/:id', getPost)      "which function handles this?"
  ▼
Controller   getPost(req, res, next)          "read input, apply logic, respond"
  ▼
Model/Data   posts.find(...) / SQL query      "get or change the data"
  ▲
  └── result flows back to controller → res.json(...)
```

Benefits:
- Routes read like a **table of contents** of your API.
- Controllers are reusable and unit-testable.
- Changing the data source touches only the model layer.
- Team members can work on different layers.

---

## 3. Target Structure

```
express-crash-course/
├── server.js
├── routes/
│   └── posts.js            <- only URL mapping
├── controllers/
│   └── postController.js   <- request handling logic
├── models/                 <- (optional) data layer
│   └── postModel.js
├── middleware/
│   ├── logger.js
│   ├── error.js
│   └── notFound.js
└── utils/
    └── HttpError.js
```

---

## 4. Step 1 — Create the Controller

### Naming convention
Handler names describe the **action**: `getPosts`, `getPost`, `createPost`,
`updatePost`, `deletePost`.

Controllers often include a short comment with the route:

```js
// controllers/postController.js
import { HttpError } from '../utils/HttpError.js';

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];
let nextId = 4;

// @desc    Get all posts
// @route   GET /api/posts
export const getPosts = (req, res) => {
  const limit = parseInt(req.query.limit, 10);

  if (!isNaN(limit) && limit > 0) {
    return res.status(200).json(posts.slice(0, limit));
  }

  res.status(200).json(posts);
};

// @desc    Get single post
// @route   GET /api/posts/:id
export const getPost = (req, res, next) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return next(new HttpError(404, `A post with the id of ${id} was not found`));
  }

  res.status(200).json(post);
};

// @desc    Create new post
// @route   POST /api/posts
export const createPost = (req, res, next) => {
  const { title } = req.body ?? {};

  if (typeof title !== 'string' || !title.trim()) {
    return next(new HttpError(400, 'Please include a title'));
  }

  const newPost = { id: nextId++, title: title.trim() };
  posts.push(newPost);

  res.status(201).json(newPost);
};

// @desc    Update post
// @route   PUT /api/posts/:id
export const updatePost = (req, res, next) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return next(new HttpError(404, `A post with the id of ${id} was not found`));
  }

  const { title } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) {
    return next(new HttpError(400, 'Please include a title'));
  }

  post.title = title.trim();
  res.status(200).json(post);
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
export const deletePost = (req, res, next) => {
  const id = Number(req.params.id);
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) {
    return next(new HttpError(404, `A post with the id of ${id} was not found`));
  }

  const [removed] = posts.splice(index, 1);
  res.status(200).json({ message: 'Post deleted', deleted: removed });
};
```

Each function is **exported by name** (named exports, lesson 18).

---

## 5. Step 2 — Slim Down the Route File

```js
// routes/posts.js
import express from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
```

Compare: **14 lines** versus ~80 earlier. The route file now documents the API at a
glance. Using `router.route()`:

```js
router.route('/').get(getPosts).post(createPost);
router.route('/:id').get(getPost).put(updatePost).delete(deletePost);
```

---

## 6. Step 3 — `server.js` Stays the Same

```js
app.use('/api/posts', posts);
```

Nothing to change — the router still exports the same interface.
This is the benefit of layering: internal refactoring does not affect other files.

---

## 7. Prerequisite Concept: Named Exports and Hoisting of Handlers

Because controllers are `const` arrow functions, they must be **defined before they are
used** at runtime. ES `import` guarantees the controller module is fully evaluated
before the route file executes, so ordering across files is safe.

Named import with many names can use multi-line formatting (shown above) or:

```js
import * as postController from '../controllers/postController.js';
router.get('/', postController.getPosts);
```

---

## 8. Adding a Model Layer (Recommended Step)

Move data access out of the controller so the controller does not know *how* data is
stored.

```js
// models/postModel.js
let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];
let nextId = 4;

export const findAll = () => posts;

export const findById = (id) => posts.find((p) => p.id === id);

export const create = (data) => {
  const post = { id: nextId++, ...data };
  posts.push(post);
  return post;
};

export const update = (id, data) => {
  const post = findById(id);
  if (!post) return null;
  Object.assign(post, data);       // safe: `data` contains only fields we chose
  return post;
};

export const remove = (id) => {
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  return posts.splice(index, 1)[0];
};
```

Controller using the model:

```js
import * as Post from '../models/postModel.js';
import { HttpError } from '../utils/HttpError.js';

export const getPost = (req, res, next) => {
  const id = Number(req.params.id);
  const post = Post.findById(id);
  if (!post) return next(new HttpError(404, `Post ${id} not found`));
  res.json(post);
};
```

### Later: replace with MySQL, controller untouched

```js
// models/postModel.js (MySQL version)
import { pool } from '../config/db.js';

export const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM posts WHERE id = ?', [id]);
  return rows[0] ?? null;
};
```

```js
// controller only needs `await`
export const getPost = async (req, res, next) => {
  const post = await Post.findById(Number(req.params.id));
  if (!post) return next(new HttpError(404, 'Post not found'));
  res.json(post);
};
```

---

## 9. Thin Controllers, Fat Models (or a Service Layer)

Guidelines:

| Put in controller | Put in model/service |
|-------------------|----------------------|
| Reading `req.params/query/body` | Database queries |
| Choosing status codes and response shape | Business rules (pricing, permissions logic) |
| Calling the model/service | Reusable operations |
| Passing errors to `next` | Data validation rules that apply everywhere |

Controllers should **not** contain SQL, and models should **not** know about `req`/`res`.
If you find `res.` inside the model, the layers are leaking.

As apps grow a **service layer** sits between controller and model for business logic
(`controller → service → model`).

---

## 10. Validation Middleware (Cleaner Controllers)

Move validation out of the controller into middleware used in the route definition:

```js
// middleware/validatePost.js
import { HttpError } from '../utils/HttpError.js';

export const validatePost = (req, res, next) => {
  const { title } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) {
    return next(new HttpError(400, 'Please include a title'));
  }
  req.body = { title: title.trim() };    // sanitised, only allowed fields
  next();
};
```

```js
// routes/posts.js
router.post('/', validatePost, createPost);
router.put('/:id', validatePost, updatePost);
```

Now `createPost` can trust `req.body.title` is valid.

And an id-parsing helper with `router.param`:

```js
router.param('id', (req, res, next, value) => {
  const id = Number(value);
  if (!Number.isInteger(id)) return next(new HttpError(400, 'Invalid id'));
  req.postId = id;
  next();
});
```

---

## 11. Complete Final Structure and Code

### `routes/posts.js`
```js
import express from 'express';
import {
  getPosts, getPost, createPost, updatePost, deletePost,
} from '../controllers/postController.js';
import { validatePost } from '../middleware/validatePost.js';

const router = express.Router();

router.route('/').get(getPosts).post(validatePost, createPost);
router.route('/:id').get(getPost).put(validatePost, updatePost).delete(deletePost);

export default router;
```

### `controllers/postController.js` (using the model)
```js
import * as Post from '../models/postModel.js';
import { HttpError } from '../utils/HttpError.js';

const notFound = (id) => new HttpError(404, `A post with the id of ${id} was not found`);

export const getPosts = (req, res) => {
  const limit = parseInt(req.query.limit, 10);
  const all = Post.findAll();
  res.status(200).json(limit > 0 ? all.slice(0, limit) : all);
};

export const getPost = (req, res, next) => {
  const id = Number(req.params.id);
  const post = Post.findById(id);
  if (!post) return next(notFound(id));
  res.status(200).json(post);
};

export const createPost = (req, res) => {
  const post = Post.create({ title: req.body.title });
  res.status(201).json(post);
};

export const updatePost = (req, res, next) => {
  const id = Number(req.params.id);
  const post = Post.update(id, { title: req.body.title });
  if (!post) return next(notFound(id));
  res.status(200).json(post);
};

export const deletePost = (req, res, next) => {
  const id = Number(req.params.id);
  const removed = Post.remove(id);
  if (!removed) return next(notFound(id));
  res.status(200).json({ message: 'Post deleted', deleted: removed });
};
```

### `server.js`
```js
import express from 'express';
import posts from './routes/posts.js';
import { logger } from './middleware/logger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/api/posts', posts);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 12. Testing Strategy Benefit

A controller is just a function `(req, res, next)`. You can test it with fake objects:

```js
const req = { params: { id: '1' } };
const res = { status(c) { this.code = c; return this; }, json(b) { this.body = b; } };
getPost(req, res, (err) => { throw err; });
console.log(res.code, res.body);   // 200 { id: 1, title: 'Post One' }
```

Real projects use Jest/Vitest with Supertest, but the idea is the same: layered code is
testable code.

---

## 13. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting `export` on controller functions | `does not provide an export named` | Add `export` |
| Missing `.js` in imports | `ERR_MODULE_NOT_FOUND` | Add extension |
| Calling the controller: `router.get('/', getPosts())` | Runs immediately; `undefined` passed | Pass the **reference**: `getPosts` |
| Duplicated data arrays in two files | Inconsistent state | One model module owns the data |
| Putting `res.json` in the model | Tight coupling | Return data; let controller respond |
| Controllers growing huge | Hard to maintain | Move logic to services/models, validation to middleware |
| Reassigning exported `let` from another module | Error (imports are read-only) | Export functions to mutate |
| Mixing responsibilities in `server.js` | Hard to scale | Keep it for setup only |

The "called vs referenced" error is very common:

```js
router.get('/', getPosts);     // ✅ pass function (Express will call it)
router.get('/', getPosts());   // ❌ calls it now and passes its return value
```

---

## 14. Naming Cheat Sheet

| Route | Controller function | Model function |
|-------|---------------------|----------------|
| `GET /posts` | `getPosts` | `findAll` |
| `GET /posts/:id` | `getPost` | `findById` |
| `POST /posts` | `createPost` | `create` |
| `PUT /posts/:id` | `updatePost` | `update` |
| `DELETE /posts/:id` | `deletePost` | `remove` |

---

## 15. Exercises

1. Create `controllers/postController.js` and move the five handlers into it.
2. Reduce `routes/posts.js` to only route definitions.
3. Use `router.route()` to group methods per path.
4. Create `models/postModel.js` and make the controller use it.
5. Create `validatePost` middleware and use it in POST and PUT routes.
6. Create `usersController.js` and `routes/users.js` with the same structure.
7. Deliberately write `router.get('/', getPosts())` and read the error.
8. Draw the request flow for `PUT /api/posts/3` from client to model and back.

### Challenge
Create a second resource `products` with its own route, controller, model and
validation middleware — copying the pattern without looking at the posts code.

---

## 16. Quick Quiz

1. What does a route file do in the layered design?
2. What does a controller do?
3. Why should models not use `req` / `res`?
4. What is wrong with `router.get('/', getPosts())`?
5. What does MVC stand for?
6. Name one benefit of moving validation into middleware.
7. How would introducing MySQL affect controllers if you have a model layer?

<details><summary>Answers</summary>

1. Maps URL + method to controller functions (and attaches middleware).
2. Reads request input, calls the model/service, chooses the response/status.
3. Keeps layers independent and reusable/testable.
4. It calls the function immediately instead of registering it as a handler.
5. Model–View–Controller.
6. Reusable, controllers stay focused, consistent errors.
7. Mostly unchanged apart from `await`; the model changes.
</details>

---

## 17. Summary

- Split code into **routes** (URL mapping), **controllers** (request handling), and
  **models** (data access) — plus middleware for cross-cutting concerns.
- Controllers are exported functions `(req, res, next)`; routes import and reference them.
- Thin controllers + validation middleware + model layer = maintainable, testable code.
- This structure lets you replace the in-memory array with MySQL without touching routes.

---

## 18. Next Lesson

➡️ **28 — `__dirname` Workaround**
Fix paths in ES Modules where `__dirname` does not exist.
