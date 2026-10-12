# 12 — Environment Variables (.env)

> **Goal:** Move configuration (port, secrets, mode) out of the source code using
> environment variables and a `.env` file, safely.

---

## 1. The Problem: Hard-Coded Configuration

```js
const PORT = 5000;
const DB_PASSWORD = 'MyS3cretPass';
const API_KEY = 'sk_live_abc123';
```

Problems:

1. **Secrets in Git.** Once pushed to GitHub, they are public (and bots scan GitHub for
   keys within minutes).
2. **Different values per environment.** Your laptop uses port 5000 and a test
   database; production uses port 80 and a real database. Editing code for each
   deployment is error-prone.
3. **Team conflicts.** Every developer has different local settings.

**Solution:** keep configuration **outside** the code in **environment variables**.

---

## 2. Prerequisite Concept: What Is an Environment Variable?

An **environment variable** is a named value stored by the operating system for a
process. You know them from Linux:

```bash
echo $HOME          # /home/user
echo $PATH
export NAME="Asha"
echo $NAME          # Asha
env                 # list all environment variables
```

Rules:
- Names are usually UPPER_CASE with underscores.
- Values are always **strings**.
- A child process **inherits** the variables of its parent.

### Setting a variable for one command (Linux/macOS)
```bash
PORT=8000 node server.js
```

### In Node: `process.env`
```js
console.log(process.env.HOME);
console.log(process.env.PORT);      // undefined if not set
```

`process.env` is an object that holds all environment variables for the Node process.

> Important: `process.env.PORT` is a **string** `"8000"`, not number `8000`.
> Convert when needed: `Number(process.env.PORT)`.

---

## 3. Using `process.env` With a Default

```js
const PORT = process.env.PORT || 5000;
```

`||` means: "use the left side if it is truthy, otherwise use 5000".

Now:

```bash
node server.js              # port 5000
PORT=8000 node server.js    # port 8000
```

---

## 4. The `.env` File

Typing variables before every command is tiring. A **`.env` file** stores them in a text
file in the project root:

```
PORT=8000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=MyS3cretPass
API_KEY=abc123
```

Format rules:
- One `KEY=value` per line.
- No spaces around `=` (usually).
- No quotes needed (quotes allowed for values with spaces: `TITLE="My App"`).
- Lines starting with `#` are comments.
- Not JSON, not JavaScript.

---

## 5. Loading `.env` — Option A: Node's Built-in `--env-file` (Node 20.6+)

No package needed:

```bash
node --env-file=.env server.js
```

In `package.json`:

```json
"scripts": {
  "start": "node --env-file=.env server.js",
  "dev": "node --watch --env-file=.env server.js"
}
```

Then in code:

```js
const PORT = process.env.PORT || 5000;
```

(There is also `process.loadEnvFile()` in newer Node versions.)

## 6. Loading `.env` — Option B: The `dotenv` Package

Works on all Node versions and is widely used.

```bash
npm install dotenv
```

CommonJS:
```js
require('dotenv').config();
```

ES Modules:
```js
import 'dotenv/config';
```

**Place it at the very top** of the entry file — before any code that reads `process.env`.

```js
require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;
```

How `dotenv` works: reads `.env`, splits each line, and assigns `process.env.KEY = value`
(without overriding variables that already exist in the real environment).

---

## 7. Step-by-Step Example

### 1. Create `.env`
```
PORT=8000
NODE_ENV=development
APP_NAME=Express Crash Course
```

### 2. `server.js`
```js
const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send(`Welcome to ${process.env.APP_NAME}`);
});

app.get('/api/config', (req, res) => {
  res.json({
    port: PORT,
    mode: process.env.NODE_ENV,
  });
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
```

### 3. Run
```bash
npm run dev
```
(with `--env-file=.env` in the script, or `dotenv` loaded in code)

Expected console output:

```
Server running in development mode on port 8000
```

---

## 8. 🔐 Security Rules for `.env` (Very Important)

1. **Add `.env` to `.gitignore` before the first commit.**
   ```
   node_modules
   .env
   ```
2. **Commit a template instead:** `.env.example` with fake values.
   ```
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=
   DB_PASSWORD=
   API_KEY=
   ```
3. **Never print secrets** to logs or responses.
4. **Never expose `process.env` through an endpoint**:
   ```js
   // ❌ TERRIBLE
   app.get('/debug', (req, res) => res.json(process.env));
   ```
5. **Do not put `.env` inside the static folder** (`public/`).
6. **If a secret leaks, rotate it** (generate a new one) — deleting the Git commit is not
   enough, because it may already have been copied.
7. In production, set variables via the platform (systemd `Environment=`, Docker
   `-e`, cloud dashboards, secret managers) instead of shipping an `.env` file.

### If you accidentally committed `.env`
```bash
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "stop tracking .env"
```
Then **change every secret inside it**. Git history still contains the old values.

---

## 9. The `NODE_ENV` Variable

A common convention to tell the app what environment it runs in:

| Value | Meaning |
|-------|---------|
| `development` | Local work: verbose logs, detailed errors |
| `production` | Live: minimal logs, hidden error details, caching |
| `test` | Automated tests |

```js
const isProd = process.env.NODE_ENV === 'production';
```

Express itself changes behavior when `NODE_ENV=production`:
- View templates are cached.
- Less verbose error messages.
- Better performance overall.

Use it later in the error handler (lesson 24) to hide stack traces in production.

---

## 10. Converting Types

All values are strings. Be careful:

```js
process.env.DEBUG = 'false';
if (process.env.DEBUG) { /* TRUE! 'false' is a non-empty string */ }
```

Correct approaches:

```js
const DEBUG = process.env.DEBUG === 'true';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_ITEMS = Number(process.env.MAX_ITEMS ?? 10);
```

---

## 11. Centralizing Config in One File

Instead of reading `process.env` everywhere, create `config.js`:

```js
// config.js
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'My App',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};

module.exports = config;
```

Use it:

```js
const config = require('./config');
app.listen(config.port, () => console.log(`Running on ${config.port}`));
```

Benefits:
- One place to see all settings.
- Type conversion happens once.
- Easy to validate.

### Fail fast when something is missing

```js
const required = ['DB_USER', 'DB_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
```

A server that crashes immediately on bad config is better than one that fails mysteriously
later.

---

## 12. Multiple Env Files

Common patterns:

```
.env                 # shared defaults (often not committed)
.env.development     # local
.env.production      # production values (never committed)
.env.test
```

Node supports multiple files:

```bash
node --env-file=.env --env-file=.env.local server.js
```
(later files override earlier ones)

With dotenv:
```js
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
```

---

## 13. Setting Variables in Other Places (Linux Knowledge Used Here)

### In a shell session
```bash
export PORT=9000
node server.js
```

### Inline for one run
```bash
PORT=9000 NODE_ENV=production node server.js
```

### systemd service
```ini
[Service]
Environment=PORT=9000
Environment=NODE_ENV=production
EnvironmentFile=/etc/myapp/env
ExecStart=/usr/bin/node /srv/app/server.js
```

### Docker
```bash
docker run -e PORT=9000 -e NODE_ENV=production myapp
docker run --env-file ./env.list myapp
```

### GitHub Actions
```yaml
env:
  NODE_ENV: test
steps:
  - run: npm test
    env:
      API_KEY: ${{ secrets.API_KEY }}
```

(GitHub **Secrets** store sensitive values; never write them in the YAML.)

---

## 14. Precedence: Which Value Wins?

If the same variable is defined in several places:

1. A variable already in the real environment (`PORT=9000 node ...`) — **wins** with
   dotenv's default behavior.
2. Value from `.env` file.
3. Default in your code (`|| 5000`).

With `node --env-file`, values from the file are applied but real environment variables
set in the shell take precedence too (in current Node versions). Always test to confirm
in your version.

---

## 15. Debugging Env Problems

| Symptom | Cause | Fix |
|---------|-------|-----|
| `process.env.PORT` is `undefined` | `.env` not loaded | Load dotenv/`--env-file` at top |
| Variables work in terminal but not in app | Ran from a different folder | `.env` is looked up in the cwd; run from project root or give `path` |
| Value has quotes in it | Extra quotes in file | Remove them or understand parser rules |
| Value has trailing spaces | Space before newline | Delete spaces |
| Changes not applied | Server not restarted | `--watch` watches code, not necessarily `.env` — restart manually |
| `.env` pushed to GitHub | Missing `.gitignore` | Remove, rotate secrets |

Quick debug (never in production): 

```js
console.log('PORT:', process.env.PORT);
console.log('Loaded keys:', Object.keys(process.env).filter(k => k.startsWith('APP_')));
```

---

## 16. Exercises

1. Create `.env` with `PORT=8000` and `APP_NAME=...`.
2. Load it using `--env-file` and verify the port changes.
3. Install `dotenv` and load it with `require('dotenv').config()`.
4. Add `.env` to `.gitignore` and create `.env.example`.
5. Create `config.js` that exports `port`, `env` and `appName`.
6. Make an endpoint `/api/config` that returns **only non-secret** values.
7. Add a startup check that exits when `APP_NAME` is missing.
8. Run `PORT=9999 npm run dev` and decide which wins: shell or `.env`.

### Challenge
Write a function `getBool(name, default)` that converts `'true'/'false'/'1'/'0'` strings
from `process.env` to real booleans.

<details><summary>Solution</summary>

```js
function getBool(name, def = false) {
  const v = process.env[name];
  if (v === undefined) return def;
  return ['true', '1', 'yes'].includes(v.toLowerCase());
}
```
</details>

---

## 17. Quick Quiz

1. What type are all values in `process.env`?
2. Why should `.env` be in `.gitignore`?
3. What is `.env.example` for?
4. What does `NODE_ENV=production` usually change?
5. What is wrong with `if (process.env.DEBUG)` when `DEBUG=false`?
6. Give one way to load `.env` without installing any package.
7. If a secret was pushed to GitHub, what must you do?

<details><summary>Answers</summary>

1. Strings.
2. To avoid leaking secrets to a repository.
3. A safe template listing required variables without real secrets.
4. Less verbose errors, caching, better performance, hidden stack traces (if coded).
5. The string `'false'` is truthy.
6. `node --env-file=.env server.js`.
7. Rotate/replace the secret immediately and stop tracking the file.
</details>

---

## 18. Summary

- Configuration should live **outside** code; secrets must never be committed.
- Environment variables are OS-level strings, read through `process.env`.
- `.env` files + `--env-file` (Node 20.6+) or `dotenv` provide convenient local config.
- Always supply sensible defaults and validate required values at startup.
- `NODE_ENV` indicates the running mode; production should be quieter and safer.
- Keep `.env` out of Git and out of public folders; share `.env.example`.

---

## 19. Next Lesson

➡️ **13 — Request Params (`req.params`)**
Learn to read dynamic URL parts like `/api/posts/2` to fetch one specific post.
