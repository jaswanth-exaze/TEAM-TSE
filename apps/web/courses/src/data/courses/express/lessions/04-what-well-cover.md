# 04 — What We'll Cover

> **Goal:** See the full roadmap of the course, understand how the 34 lessons connect,
> and know what you will be able to build at the end.

---

## 1. The Journey in One Picture

```
 SETUP             BASICS             DATA               STRUCTURE
 (1-7)             (8-12)             (13-16)            (17-18)
   |                 |                  |                  |
   v                 v                  v                  v
 What/why   ->  Files, JSON,   ->  Params, query,  ->  Route files,
 install        Postman, env       status codes        ES modules

     CRUD API            MIDDLEWARE           ARCHITECTURE        FRONT-END / VIEWS
     (19-22)             (23-26)              (27-28)             (29-34)
        |                   |                    |                    |
        v                   v                    v                    v
  body, POST, PUT,   ->  middleware,     ->  controllers,   ->  fetch, forms,
  DELETE                 error handlers       __dirname          EJS templates
```

---

## 2. The Course Map (All 34 Lessons)

### Part A — Foundations (Lessons 1–7)
| # | Lesson | What you will gain |
|---|--------|--------------------|
| 1 | What is Express? | Know what it is and why we use it |
| 2 | Opinionated vs Unopinionated | Understand Express's philosophy |
| 3 | Prerequisites | Skills checklist |
| 4 | What we'll cover | This roadmap |
| 5 | Express Setup | Install and initialize a project |
| 6 | Basic Server | Your first running server |
| 7 | `--watch` Flag & NPM Scripts | Auto-restart and shortcuts |

### Part B — Serving Content (Lessons 8–12)
| # | Lesson | What you will gain |
|---|--------|--------------------|
| 8 | `res.sendFile()` | Send HTML files |
| 9 | Static Web Server | Serve a whole website folder |
| 10 | Working with JSON | Build JSON endpoints |
| 11 | Postman Utility | Test your API without a browser |
| 12 | Environment Variables | Keep config and secrets out of code |

### Part C — Reading the Request (Lessons 13–16)
| # | Lesson | What you will gain |
|---|--------|--------------------|
| 13 | Request Params | `/posts/:id` style URLs |
| 14 | Query Strings | `?limit=3` style filters |
| 15 | Setting Status Codes | Proper HTTP answers |
| 16 | Multiple Responses | Avoid "headers already sent" bugs |

### Part D — Organizing Code (Lessons 17–18)
| # | Lesson | What you will gain |
|---|--------|--------------------|
| 17 | Route Files | Split routes into modules with `Router` |
| 18 | ES Modules | Use `import` / `export` |

### Part E — Full CRUD API (Lessons 19–22)
| # | Lesson | What you will gain |
|---|--------|--------------------|
| 19 | Request Body Data | `express.json()`, `urlencoded` |
| 20 | POST Request | Create resources |
| 21 | PUT Request | Update resources |
| 22 | DELETE Request | Remove resources |

### Part F — Middleware & Errors (Lessons 23–26)
| # | Lesson | What you will gain |
|---|--------|--------------------|
| 23 | Middleware | The heart of Express |
| 24 | Custom Error Handler | Central error function |
| 25 | Catch-All Error Middleware | 404 + unexpected errors |
| 26 | Colors Package | Readable colored logs |

### Part G — Architecture (Lessons 27–28)
| # | Lesson | What you will gain |
|---|--------|--------------------|
| 27 | Using Controllers | Separate routing from logic |
| 28 | `__dirname` Workaround | Paths in ES Modules |

### Part H — Front-End Connection & Views (Lessons 29–34)
| # | Lesson | What you will gain |
|---|--------|--------------------|
| 29 | Requests from Frontend | `fetch` to your API |
| 30 | Submit Form to API | HTML form → POST → API |
| 31 | EJS Setup | Server-rendered HTML |
| 32 | Pass Data to Views | Dynamic pages |
| 33 | Pass and Loop Over Arrays | Lists in templates |
| 34 | Template Partials | Reusable header/footer |

---

## 3. The Project That Grows Through the Lessons

Instead of many unrelated examples, think of **one growing application**: a small
**Posts API / Blog** server.

### Version 1 (Lessons 5–9)
```
GET /           -> HTML home page
GET /about      -> HTML about page
GET /style.css  -> static CSS
```

### Version 2 (Lessons 10–16)
```
GET /api/posts           -> JSON list of posts
GET /api/posts/1         -> one post (params)
GET /api/posts?limit=2   -> first 2 posts (query)
GET /api/posts/999       -> 404 with proper status
```

### Version 3 (Lessons 17–22)
```
GET    /api/posts
GET    /api/posts/:id
POST   /api/posts        -> create
PUT    /api/posts/:id    -> update
DELETE /api/posts/:id    -> delete
```
Now structured in `routes/posts.js` using ES Modules.

### Version 4 (Lessons 23–28)
- logger middleware prints each request in color
- 404 and error middleware return clean JSON errors
- controllers hold the logic; routes only connect URLs

### Version 5 (Lessons 29–34)
- a front-end page calls the API with `fetch`
- an HTML form creates posts
- EJS pages render the posts list with partial header/footer

---

## 4. Final Folder Structure (Preview)

```
express-crash-course/
├── .env
├── .gitignore
├── package.json
├── server.js
├── controllers/
│   └── postController.js
├── middleware/
│   ├── logger.js
│   ├── error.js
│   └── notFound.js
├── routes/
│   └── posts.js
├── public/
│   ├── index.html
│   ├── about.html
│   ├── style.css
│   └── main.js
└── views/
    ├── partials/
    │   ├── header.ejs
    │   └── footer.ejs
    └── posts.ejs
```

Do not memorize it. By lesson 34 each file will make sense.

---

## 5. Key Concepts You Will Master

| Concept | Lesson(s) | One-line meaning |
|---------|-----------|------------------|
| Routing | 6, 10, 13, 17 | Match URL + method to code |
| Middleware | 9, 19, 23–26 | Functions in the request pipeline |
| Request object | 13, 14, 19 | Read data the client sent |
| Response object | 8, 10, 15 | Send data/status back |
| REST API | 20–22 | Resource-oriented endpoints |
| Config | 12 | `.env` and `process.env` |
| Modules | 17, 18, 27 | Split code into files |
| Error handling | 24, 25 | One place to handle failures |
| Templating | 31–34 | HTML generated with data |

---

## 6. How Each Lesson Is Structured

Every lesson file in this series follows a similar pattern:

1. **Goal** — what you will learn
2. **Concept explanation** from zero
3. **Prerequisite concepts** (extra background where needed)
4. **Step-by-step code**
5. **Line-by-line explanation**
6. **Common mistakes**
7. **Practice and mini challenges**
8. **Quiz and summary**
9. **Next lesson link**

---

## 7. How to Study Effectively

### The 4-step loop (for each lesson)
1. **Read** the lesson once without coding.
2. **Type** the code in your own project.
3. **Modify** it (change values, break it, fix it).
4. **Explain** it aloud as if teaching a friend.

### Suggested pace
| Plan | Lessons per day | Total days |
|------|-----------------|------------|
| Relaxed | 2 | 17 |
| Normal | 4 | 9 |
| Intense | 6–7 | 5–6 |

### Keep a learning log
After each lesson, write three bullet points:
- What I learned
- What confused me
- One thing I will try tomorrow

---

## 8. Tools You Will Use Along the Way

| Tool | First used in | Purpose |
|------|---------------|---------|
| Terminal | 5 | Run commands |
| VS Code | 5 | Write code |
| Node.js + npm | 5 | Run and install |
| Express | 5 | The framework |
| Postman | 11 | Test API |
| Browser DevTools | 9, 29 | Inspect network and console |
| `colors` package | 26 | Colored logs |
| EJS | 31 | HTML templates |
| Git | all | Version control |

> Tip: Open the browser DevTools (F12) → **Network** tab. It shows every request your
> Express server receives and every response it sends. It is your best debugging friend.

---

## 9. What This Course Does NOT Cover

It is a **crash course**. Important topics that come *after* it:

| Topic | Why it matters |
|-------|----------------|
| Database integration (MySQL with `mysql2`) | Real persistence |
| Authentication (sessions, JWT) | Login systems |
| Validation libraries | Safe input |
| Security hardening (helmet, rate limit, CORS) | Production safety |
| Testing (Jest, Supertest) | Reliable code |
| Deployment | Making it public |
| TypeScript | Safer code |

After this course, the natural next step is: **Express + MySQL**, using the SQL you
already know.

---

## 10. Data Storage in This Course

To stay focused on Express, we **do not use a database**. We use an array in memory:

```js
let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
];
```

### Important limitation
- When the server restarts, changes are **lost** (memory resets).
- That is acceptable for learning.
- Later you will replace the array with MySQL queries and the Express code stays almost
  the same. That is the beauty of separating controllers (lesson 27).

---

## 11. Vocabulary Preview

You will meet these words repeatedly. Read them now so they feel familiar.

| Word | Short meaning |
|------|---------------|
| `app` | Your Express application |
| `router` | A mini-app holding a group of routes |
| `req.params` | Values from the URL path (`/posts/5`) |
| `req.query` | Values after `?` in the URL |
| `req.body` | Data sent in the request body |
| `res.send` | Send text/HTML |
| `res.json` | Send JSON |
| `next()` | Pass control to the next middleware |
| `NODE_ENV` | Environment name (`development`, `production`) |
| `view` | A template file that becomes HTML |
| `partial` | A reusable piece of a template |

---

## 12. Visual: Request Life Cycle in Our Final App

```
Browser / Postman / fetch
        |
        v
  [ logger middleware ]      -> prints "GET /api/posts 200" in color
        |
        v
  [ express.json() ]         -> fills req.body
        |
        v
  [ router: /api/posts ]     -> picks the right route
        |
        v
  [ controller function ]    -> reads / changes the posts array
        |
        v
  res.json(...) / res.render(...)
        |
   (if error) -> [ error middleware ] -> JSON error response
   (no route) -> [ notFound middleware ] -> 404 response
```

---

## 13. Self-Assessment Before You Start

Rate yourself 1–5 (1 = not at all, 5 = very confident).

| Skill | Rating |
|-------|--------|
| Using the terminal | |
| Arrow functions and callbacks | |
| Array methods (`find`, `filter`, `map`) | |
| `async/await` | |
| JSON | |
| HTTP methods and status codes | |
| npm and `package.json` | |

If any rating is 1–2, go back to **Lesson 03** and revise that section first.

---

## 14. Setting Up Your Practice Repository

Create the repository now so you can commit after every lesson.

```bash
mkdir express-crash-course
cd express-crash-course
git init
echo "node_modules" > .gitignore
echo ".env" >> .gitignore
git add .
git commit -m "chore: initial commit"
```

### Commit message habit
Use short meaningful messages:

```
lesson 05: install express
lesson 06: basic server
lesson 10: json endpoints
```

---

## 15. Frequently Asked Questions

**Q1. Do I need MySQL for this course?**
No. We use in-memory arrays. You will connect MySQL afterwards.

**Q2. Express 4 or Express 5?**
Both teach the same concepts. Express 5 is now the default on npm and handles
rejected promises in async handlers automatically; Express 4 needs a wrapper or try/catch.
We write code that works in both and point out differences where they matter.

**Q3. CommonJS or ES Modules?**
We start with CommonJS (`require`) and switch to ES Modules in lesson 18, because
modern code mostly uses `import`.

**Q4. Is this enough to get a job?**
It is the foundation. Add databases, authentication, validation, testing, security and
deployment to be job-ready.

**Q5. Can I use TypeScript?**
Yes, later. Learn the JavaScript version first.

---

## 16. Mini Task

Without writing code, answer:

1. Which lesson teaches you to read `/posts/5`?
2. Which lessons build the CRUD API?
3. Which lesson explains the `next()` function?
4. In which lesson do we leave plain HTML and begin using templates?

<details><summary>Answers</summary>

1. Lesson 13 (Request Params)
2. Lessons 19–22 (and 20, 21, 22 specifically for POST, PUT, DELETE)
3. Lesson 23 (Middleware)
4. Lesson 31 (EJS Template Engine Setup)
</details>

---

## 17. Summary

- The course has **34 lessons** in 8 parts: foundations, serving content, reading the
  request, organizing code, CRUD, middleware & errors, architecture, front-end & views.
- One growing **Posts** application ties the lessons together.
- Data is stored in memory so we can focus on Express itself.
- Study loop: read → type → modify → explain.
- Next stages after the course: MySQL, authentication, validation, security, testing, deployment.

---

## 18. Next Lesson

➡️ **05 — Express Setup**
We create the project folder, run `npm init`, install Express and prepare everything for
our first server.
