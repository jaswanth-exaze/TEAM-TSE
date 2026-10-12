# 02 — Opinionated vs Unopinionated

> **Goal:** Understand what these two words mean, why Express is *unopinionated*,
> and how that changes the way you structure projects.

---

## 1. First, What Is an "Opinion" in Software?

In daily life, an opinion is "I think this is the best way."

In software, an **opinion** is a *rule or default decision* that a tool makes for you:

- "Your files must be in this folder."
- "Your database must be accessed this way."
- "Your routes must be written in this style."

A tool with **many such rules** is **opinionated**.
A tool with **few or no such rules** is **unopinionated**.

---

## 2. Real-Life Analogy 🍕

### Opinionated = Set-menu restaurant
- You get a fixed meal.
- Fast to order, no decisions.
- If you want something different, it is difficult.

### Unopinionated = Buffet / build-your-own
- You pick every item.
- Very flexible.
- But you must decide, and you can make bad combinations.

### Another analogy: Furniture
| Type | Example | Feeling |
|------|---------|---------|
| Opinionated | Ready-made wardrobe with fixed shelves | Quick, but not customizable |
| Unopinionated | Empty room + tools | Total freedom, more work |

---

## 3. Opinionated Frameworks

An **opinionated** framework says:
> "Do it MY way and everything will work smoothly."

### Characteristics
- Fixed folder structure
- Built-in tools: database layer, authentication, forms
- Strong conventions ("convention over configuration")
- Faster to start
- Harder to break rules

### Examples
| Framework | Language | Notable opinions |
|-----------|----------|------------------|
| Ruby on Rails | Ruby | Fixed folders, built-in ORM |
| Django | Python | Admin panel, ORM, templates built in |
| Laravel | PHP | Standard structure, Eloquent ORM |
| NestJS | Node.js | Modules, controllers, decorators required |
| AdonisJS | Node.js | Full-stack structure like Laravel |

---

## 4. Unopinionated Frameworks

An **unopinionated** framework says:
> "I give you the basics. You decide everything else."

### Characteristics
- No required folder structure
- No built-in database tools
- You choose libraries yourself
- More freedom
- More responsibility

### Examples
| Framework | Notes |
|-----------|-------|
| **Express** | The classic unopinionated Node framework |
| Koa | Even smaller than Express |
| Fastify | Light, but with some structure (schemas) |
| Flask (Python) | Micro-framework |

---

## 5. Why Is Express Called Unopinionated?

Express does **not** force any of these:

| Decision | Express says | You decide |
|----------|--------------|------------|
| Folder structure | Nothing | `routes/`, `controllers/`, `src/`, anything |
| Database | Nothing | MySQL, MongoDB, PostgreSQL, files |
| Template engine | Nothing | EJS, Pug, Handlebars, or none |
| Authentication | Nothing | JWT, sessions, OAuth, Passport |
| Validation | Nothing | Joi, Zod, express-validator, manual |
| Folder for static files | Nothing | `public`, `static`, `assets` |
| Module system | Nothing | CommonJS or ES Modules |
| Code style | Nothing | You choose |

Express provides **only**:
1. Routing
2. Middleware system
3. Request / response helpers
4. A few built-in middlewares (`express.json`, `express.static`, ...)

Everything else comes from **npm packages** that you add when needed.

---

## 6. Proof by Example: Two Valid Express Projects

Both of the following are *valid*. Express does not care.

### Project A — Everything in one file
```
my-app/
├── package.json
└── server.js        <- routes, logic, database, everything
```

```js
// server.js
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Home'));
app.get('/about', (req, res) => res.send('About'));

app.listen(3000);
```

### Project B — Layered structure
```
my-app/
├── package.json
├── server.js
├── config/
│   └── db.js
├── routes/
│   └── userRoutes.js
├── controllers/
│   └── userController.js
├── middleware/
│   └── logger.js
├── models/
│   └── User.js
├── views/
│   └── index.ejs
└── public/
    ├── css/
    └── js/
```

Both run. Express does not complain about either. **That is what unopinionated means.**

---

## 7. Advantages of Being Unopinionated

### ✅ 1. Freedom
Pick the best tool for your project. Need MySQL? Use `mysql2`. Need MongoDB? Use `mongoose`.

### ✅ 2. Lightweight
Your app has only what it needs. Less code means less to load and less to attack.

### ✅ 3. Easy to learn the core
The Express core can be learned in a day. You are doing it in 34 short lessons.

### ✅ 4. Huge ecosystem
Because Express is so popular, there is a package for almost everything.

### ✅ 5. Good for learning
You see how each piece works instead of hiding it under magic.

---

## 8. Disadvantages (The Honest Part)

### ❌ 1. Decision fatigue
"Which validation library? Which folder structure? Which logger?"

### ❌ 2. Inconsistent projects
Every team organizes differently. Joining a new project can be confusing.

### ❌ 3. Easy to write messy code
Nothing stops you from putting 2000 lines in one file.

### ❌ 4. Security is your job
A framework like Django enables many protections by default. In Express you must add:
- security headers (e.g. `helmet`)
- rate limiting
- input validation
- safe error messages

> 🔐 **Security note:** "Unopinionated" does not mean "unsafe", but it means *nothing
> is secure unless you make it secure.* Keep this in mind throughout the course.

### ❌ 5. More boilerplate
Things that opinionated frameworks give for free, you set up by hand.

---

## 9. Comparison Table

| Feature | Opinionated (e.g., NestJS, Rails) | Unopinionated (Express) |
|---------|-----------------------------------|--------------------------|
| Learning curve at start | Steeper (many concepts) | Gentle |
| Speed to first feature | Fast after learning | Fast for simple apps |
| Folder structure | Fixed | Your choice |
| Built-in features | Many | Few |
| Flexibility | Lower | Very high |
| Team consistency | High | Depends on team rules |
| Risk of messy code | Lower | Higher |
| Best for | Large teams, large apps | Learning, small–medium apps, custom needs |

---

## 10. "Convention Over Configuration"

You will often hear this phrase.

- **Convention** = a standard way everybody follows.
- **Configuration** = settings you must write yourself.

Opinionated frameworks use *conventions*, so you configure less.
Express uses *configuration*: you write the setup.

Example — In Express, to read JSON bodies you must **explicitly** write:

```js
app.use(express.json());
```

If you forget it, `req.body` will be `undefined`. Express will not do it automatically.
This is the most common beginner bug and now you know *why* it happens:
Express gives you no default behavior unless you ask.

---

## 11. Express "Freedom" Examples in Code

### Example 1: Choose your own response style
```js
app.get('/a', (req, res) => res.send('text'));
app.get('/b', (req, res) => res.json({ ok: true }));
app.get('/c', (req, res) => res.sendFile(__dirname + '/page.html'));
app.get('/d', (req, res) => res.render('page'));   // needs a template engine
```

### Example 2: Choose your own database
```js
// MySQL
const mysql = require('mysql2/promise');

// or MongoDB
const mongoose = require('mongoose');

// or even a plain array in memory (we will do this in the course)
const users = [{ id: 1, name: 'Asha' }];
```

### Example 3: Choose your own folder for static files
```js
app.use(express.static('public'));
// or
app.use('/assets', express.static('files'));
```

---

## 12. What Does Express Do for You vs What You Add

```
+----------------------------------------------------+
|                 YOUR APPLICATION                   |
|  validation  auth  database  logging  security    |
|  (you add these using npm packages)                |
+----------------------------------------------------+
|                   EXPRESS (core)                   |
|   routing   middleware system   req/res helpers    |
+----------------------------------------------------+
|                 NODE.JS  `http` module             |
+----------------------------------------------------+
```

---

## 13. Popular Packages You Will Meet Around Express

You do **not** need to learn these now. Just know they exist.

| Need | Popular package |
|------|-----------------|
| Read `.env` file | `dotenv` (or Node's `--env-file`) |
| Logging requests | `morgan` |
| Security headers | `helmet` |
| Cross-origin requests | `cors` |
| Validation | `zod`, `joi`, `express-validator` |
| Password hashing | `bcrypt` |
| Login tokens | `jsonwebtoken` |
| MySQL | `mysql2` |
| Rate limiting | `express-rate-limit` |
| Auto-restart in dev | `nodemon` (or `node --watch`) |
| Coloured console text | `colors`, `chalk` |

---

## 14. How to Cope With Too Much Freedom

Here is a simple 5-step habit for beginners:

1. **Start with one file.** Make it work.
2. **Split routes** into separate files when the file grows.
3. **Split logic** into controllers when route files become busy.
4. **Keep configuration in `.env`**, not in code.
5. **Pick a convention and stay consistent** in the whole project.

This is exactly the path of the course: lessons 1–16 (one file), 17 (route files),
27 (controllers).

---

## 15. Should You Prefer an Opinionated Framework Later?

Neither is "better." They solve different problems.

| If you are... | Consider |
|---------------|----------|
| Learning how web servers work | Express |
| Building small APIs quickly | Express |
| In a large team that needs strict structure | NestJS |
| Building a content-heavy site with admin panel fast | Django / Laravel |
| Needing top performance with schemas | Fastify |

Learning Express first is good because opinionated Node frameworks (like NestJS)
are often built **on top of Express**. Knowing Express makes them easy.

---

## 16. Exercises

### Exercise 1 — Classify
Write **O** (opinionated) or **U** (unopinionated):

1. A tool that forces a folder named `controllers`. ___
2. A tool that lets you put code anywhere. ___
3. Express. ___
4. Ruby on Rails. ___
5. A tool that includes its own ORM and admin panel. ___

<details><summary>Answers</summary>
1. O  2. U  3. U  4. O  5. O
</details>

### Exercise 2 — Think
List **three decisions** you must make yourself when using Express.

### Exercise 3 — Plan
You are asked to build a small API with users and products. Sketch a folder structure
you would use (just names, no code).

### Exercise 4 — Debug the thinking
A friend says: "My Express app has no security because Express is bad."
Write two sentences explaining why that statement is wrong or incomplete.

---

## 17. Quick Quiz

1. What does "unopinionated" mean?
2. Give one advantage and one disadvantage of Express being unopinionated.
3. Why is `req.body` `undefined` if you forget `express.json()`?
4. What is "convention over configuration"?
5. Name two things Express *does* provide.

<details><summary>Answers</summary>

1. The framework does not force a specific structure or tools.
2. Advantage: freedom. Disadvantage: messy code / more decisions / security is your job.
3. Because Express does nothing automatically; you must add the parser middleware.
4. Follow a standard so you write less setup.
5. Routing and middleware (also request/response helpers).
</details>

---

## 18. Summary

- **Opinionated** = the tool decides many things for you.
- **Unopinionated** = you decide; the tool stays small.
- Express is **unopinionated**: it gives routing, middleware, and helpers only.
- Benefits: freedom, lightweight, easy core, large ecosystem.
- Costs: decision fatigue, inconsistent structure, security is your responsibility.
- A good habit: start simple, then split into routes and controllers as the app grows.

---

## 19. Next Lesson

➡️ **03 — Prerequisites**
A checklist of everything you should know before writing Express code, with quick
revision for each item.
