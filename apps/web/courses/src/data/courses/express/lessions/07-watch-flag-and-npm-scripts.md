# 07 — `--watch` Flag & NPM Scripts

> **Goal:** Make the server restart automatically when files change, and create
> shortcut commands with `npm run`.

---

## 1. The Problem

Right now your workflow is:

1. Edit `server.js`
2. Go to terminal, press `Ctrl + C`
3. Type `node server.js` again
4. Refresh the browser

Doing this 200 times a day is painful. Why is restarting needed at all?

---

## 2. Prerequisite Concept: Why Node Does Not See Your Changes

When you run `node server.js`:
1. Node **reads** the file once.
2. Compiles it into memory.
3. Runs it.

Changing the file on disk afterwards does nothing to the running program.
Node does not keep watching files. To load the new code, the process must restart.

A **file watcher** is a tool that:
1. Watches your files.
2. Kills the process when something changes.
3. Starts it again.

---

## 3. Solution A — Node's Built-in `--watch`

Since Node 18.11 (stable in 20+), you can run:

```bash
node --watch server.js
```

Now when you save `server.js`, you will see the restart in the terminal:

```
Restarting 'server.js'
Server is running on port 5000
```

No installation. No extra package.

### What it watches
- The entry file and every file it imports/requires.
- It does **not** watch files such as `.html` read at runtime unless they are imported.
  If you change only HTML or CSS served as static files, a restart is not necessary
  because Express reads them from disk on each request.

### Related flags

| Flag | Meaning |
|------|---------|
| `--watch` | Restart when watched files change |
| `--watch-path=./src` | Watch only a specific folder |
| `--watch-preserve-output` | Do not clear the console on restart |
| `--env-file=.env` | Load an env file (lesson 12) |

Example combining:

```bash
node --watch --env-file=.env server.js
```

---

## 4. Solution B — nodemon (the classic tool)

Before `--watch` existed, everybody used **nodemon**.

```bash
npm install --save-dev nodemon
npx nodemon server.js
```

- `npx` runs a package from `node_modules/.bin` without installing globally.
- nodemon prints `[nodemon] restarting due to changes...`.

| Feature | `node --watch` | `nodemon` |
|---------|----------------|-----------|
| Needs install | No | Yes |
| Config file | No | `nodemon.json` |
| Ignore patterns | Limited | Flexible |
| Watch extra extensions | Limited | `-e js,json,html` |
| Works on older Node | No (needs 18.11+) | Yes |

For this course, use `node --watch` unless your Node is older.

---

## 5. Prerequisite Concept: What Are npm Scripts?

In `package.json` there is a `scripts` object:

```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

Each entry is **name → command**. You run it with:

```bash
npm run test
```

Why use scripts instead of typing the command?

1. **Shorter** to type.
2. **Same command for the whole team** — documented in the project.
3. **Can use locally installed tools** (like nodemon) without `npx`.
4. Other tools (CI, Docker, hosting platforms) look for known script names.

---

## 6. Add Scripts to the Project

Edit `package.json`:

```json
{
  "name": "express-crash-course",
  "version": "1.0.0",
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

Now run:

```bash
npm run dev
```

and for production-like running:

```bash
npm start
```

---

## 7. Special Script Names

| Script | How to run | Notes |
|--------|------------|-------|
| `start` | `npm start` | `run` is optional |
| `test` | `npm test` | `run` is optional |
| `stop`, `restart` | `npm stop` | rarely used |
| `dev` (custom) | `npm run dev` | **needs** `run` |

Convention in the Node world:

- `npm start` → run the app normally (used on production).
- `npm run dev` → run with auto-restart for development.

---

## 8. Using nodemon in Scripts (alternative)

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

No `npx` needed — npm adds `node_modules/.bin` to the PATH while running scripts.

---

## 9. Passing Extra Arguments

```bash
npm run dev -- --port 4000
```

The `--` separates npm's options from the arguments for your script. Your program can
read them via `process.argv`.

```js
console.log(process.argv);
// [ '/usr/bin/node', '/path/server.js', '--port', '4000' ]
```

---

## 10. Combining Commands in Scripts

```json
"scripts": {
  "start": "node server.js",
  "dev": "node --watch server.js",
  "lint": "echo 'no linter yet'",
  "clean": "rm -rf node_modules",
  "reinstall": "npm run clean && npm install"
}
```

| Operator | Meaning |
|----------|---------|
| `a && b` | Run `b` only if `a` succeeds |
| `a ; b` | Run both regardless |
| `a \|\| b` | Run `b` only if `a` fails |

> On Windows, commands like `rm -rf` do not exist in `cmd`. Use cross-platform packages
> like `rimraf` or write scripts in Node. (On Linux you are fine.)

---

## 11. Pre and Post Hooks

npm automatically runs `pre<name>` before and `post<name>` after a script.

```json
"scripts": {
  "predev": "echo Starting dev server...",
  "dev": "node --watch server.js",
  "postdev": "echo Dev server stopped"
}
```

Mostly used for build steps; good to know they exist.

---

## 12. Handy npm Output Tricks

```bash
npm run                  # list available scripts
npm run dev --silent     # hide npm's own messages (-s)
npm start --silent
```

---

## 13. Putting It All Together

### `server.js`
```js
const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Hello with auto-restart!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Terminal
```bash
npm run dev
```

### Try this
1. Change `'Hello with auto-restart!'` to `'Changed!'`
2. Press **Ctrl + S**
3. Watch the terminal: it restarts automatically.
4. Refresh the browser: new text appears.

---

## 14. Concept: Hot Reload vs Restart

| Term | Meaning |
|------|---------|
| **Restart** | Whole process stops and starts again. Memory is cleared |
| **Hot reload** | New code is injected without losing state |

`--watch` and nodemon **restart**. Because we keep data in an array in memory,
**your data resets on every restart**. That is expected in this course.

Browser auto-refresh (live reload) is a separate topic; tools like `livereload` or
browser-sync do that. For now, press `F5`.

---

## 15. Common Problems

### 1. `node: bad option: --watch`
Your Node is too old. Check `node -v`. Update to 18.11+ (LTS 20 or 22 is best), or use nodemon.

### 2. Restart loops forever
If your code writes to a file inside a watched folder, the write triggers a restart,
which writes again... Avoid writing into watched folders (e.g., use a `data/` folder
and exclude it with nodemon config or write outside).

### 3. Port in use after crash
An old process may still run. Stop it or change the port.

### 4. Syntax error stops the watcher
If you save broken code, the process crashes. Node `--watch` waits for the next change,
then retries. Fix the error and save again.

### 5. `npm run dev` says `Missing script: "dev"`
Check spelling in `package.json` and that you saved the file.

---

## 16. nodemon Config Example (Optional)

`nodemon.json`:

```json
{
  "watch": ["server.js", "routes", "controllers"],
  "ext": "js,json",
  "ignore": ["node_modules", "data"],
  "delay": 300
}
```

Then simply run `nodemon`.

---

## 17. Production Note

Never use `--watch` or nodemon in production:
- File watching costs resources.
- Unexpected restarts hurt availability.

Production uses `npm start` (plain `node`) and a process manager such as **PM2**,
**systemd** (you know Linux!) or a container platform that restarts crashed apps.

Simple systemd idea:

```
[Service]
ExecStart=/usr/bin/node /srv/app/server.js
Restart=always
Environment=NODE_ENV=production
```

---

## 18. Exercises

1. Add `start` and `dev` scripts to your project.
2. Run `npm run dev`, change a response, and verify auto-restart.
3. Add a `hello` script that runs `echo Hello from npm`.
4. Add a script `clean` that deletes `node_modules` and a script `reinstall` that
   runs `clean` and then `npm install`.
5. Use `process.argv` to print the arguments passed via `npm run dev -- foo bar`.
6. (Optional) Install nodemon and compare it with `--watch`.

### Challenge
Create a script named `dev:env` that runs the server with watch **and** loads `.env`
(you will create `.env` in lesson 12):

<details><summary>Answer</summary>

```json
"dev:env": "node --watch --env-file=.env server.js"
```
</details>

---

## 19. Quick Quiz

1. Why does Node not pick up file changes automatically?
2. Which flag auto-restarts the server?
3. How do you run a script named `dev`?
4. Which two script names do not need the word `run`?
5. Should you use `--watch` in production?
6. What is the purpose of `--` in `npm run dev -- --port 4000`?

<details><summary>Answers</summary>

1. The file is read once at startup.
2. `--watch`.
3. `npm run dev`.
4. `start` and `test`.
5. No.
6. It separates npm options from arguments passed to your script.
</details>

---

## 20. Summary

- Node loads code once, so changes need a restart.
- `node --watch server.js` restarts automatically (no install needed, Node 18.11+).
- nodemon is the older popular alternative.
- npm scripts give short, shared commands: `npm start`, `npm run dev`.
- Restarting clears memory data.
- Use watchers only in development.

---

## 21. Next Lesson

➡️ **08 — `res.sendFile()` Method**
We stop sending HTML strings and start sending real `.html` files.
