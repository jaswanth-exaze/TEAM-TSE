# 05 — Express Setup

> **Goal:** Create a project folder, initialize npm, install Express, and understand
> every file and folder that appears.

---

## 1. Before You Start

Check your tools:

```bash
node -v
npm -v
git --version
```

If one fails, install it first (see lesson 03).

---

## 2. Concept: What Is a "Project" in Node?

A Node project is simply **a folder that contains a `package.json`**.

`package.json` is the **identity card** of the project:
- its name and version
- which packages it needs (dependencies)
- shortcut commands (scripts)

Without it, `npm install` does not know what to track.

---

## 3. Step 1 — Create the Project Folder

```bash
mkdir express-crash-course
cd express-crash-course
```

Open it in your editor:

```bash
code .
```

---

## 4. Step 2 — Initialize npm

```bash
npm init -y
```

- `npm init` asks questions to create `package.json`.
- `-y` means "yes to all defaults".

You will now see a `package.json`:

```json
{
  "name": "express-crash-course",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

### Field meanings

| Field | Meaning |
|-------|---------|
| `name` | Project name (lowercase, no spaces) |
| `version` | Semantic version `MAJOR.MINOR.PATCH` |
| `description` | Short text about the project |
| `main` | Entry file when others `require` your package |
| `scripts` | Named commands |
| `keywords` | Words for searching in npm registry |
| `author` | Your name |
| `license` | Legal license (ISC, MIT...) |

### Clean-up
Change `main` to `server.js` since our entry file will be `server.js`:

```json
"main": "server.js",
```

---

## 5. Concept: Semantic Versioning (SemVer)

Versions look like `4.19.2`:

```
  4   .   19   .   2
MAJOR   MINOR   PATCH
```

| Part | Changes when | Safe to update? |
|------|--------------|-----------------|
| MAJOR | Breaking changes | Not automatically |
| MINOR | New features, backward compatible | Usually yes |
| PATCH | Bug fixes | Yes |

In `package.json`:

| Written | Meaning |
|---------|---------|
| `"^4.19.2"` | Any `4.x.x` version ≥ 4.19.2 (caret: allows minor + patch) |
| `"~4.19.2"` | Any `4.19.x` version (tilde: allows patch only) |
| `"4.19.2"` | Exactly this version |

---

## 6. Step 3 — Install Express

```bash
npm install express
```

(Short form: `npm i express`)

### What happens
1. npm downloads Express and **all its dependencies** from the registry.
2. A folder **`node_modules/`** is created and filled.
3. `package.json` gets a new section:

```json
"dependencies": {
  "express": "^5.1.0"
}
```
(your version number may differ)

4. A file **`package-lock.json`** is created.

---

## 7. Understanding What Was Created

```
express-crash-course/
├── node_modules/        <- hundreds of folders (Express + its dependencies)
├── package.json         <- project identity + dependency list
└── package-lock.json    <- exact versions of everything installed
```

### `node_modules/`
- Contains downloaded packages.
- Can be **huge**. Never edit it. Never commit it to Git.
- Can always be recreated with `npm install`.

### `package-lock.json`
- Records the **exact** version of every package (and sub-package).
- Guarantees that everyone gets identical versions.
- **Do commit this file** to Git.

### Why does Express bring so many folders?
Express depends on other small packages (`body-parser`, `cookie`, `path-to-regexp`, ...).
Those depend on others. This is called the **dependency tree**.

```bash
npm ls --depth=0     # shows only your direct dependencies
npm ls express       # shows who uses express
```

---

## 8. Step 4 — Set Up Git Properly

```bash
echo "node_modules" > .gitignore
echo ".env" >> .gitignore
git init
git add .
git commit -m "lesson 05: express setup"
```

Check:

```bash
git status
```

`node_modules` should **not** appear.

> 🔐 If you ever clone a project from GitHub, run `npm install` in it — this rebuilds
> `node_modules` from `package.json` + `package-lock.json`.

---

## 9. Step 5 — Create the Entry File

Create `server.js` in the project root.

```bash
touch server.js
```

For now put one line inside to test Node:

```js
console.log('Express project is ready');
```

Run:

```bash
node server.js
```

You should see: `Express project is ready`.

---

## 10. Step 6 — Verify Express Is Importable

Replace content of `server.js`:

```js
const express = require('express');

console.log(typeof express);          // 'function'
const app = express();
console.log(typeof app);              // 'function' (app is also a function)
console.log(typeof app.get);          // 'function'
```

Run `node server.js`. Expected output:

```
function
function
function
```

If you see `Cannot find module 'express'`, you are probably in the wrong folder, or
the install did not finish. Run `npm install` again.

---

## 11. Concept: How `require('express')` Finds the Package

When you write `require('express')` (no `./` at the start), Node searches:

1. Built-in modules (like `fs`) — not found
2. `./node_modules/express`
3. `../node_modules/express` (parent folders, going up)
4. ...up to the root

When you write `require('./routes/posts')` (with `./`), Node loads **your own file**
relative to the current file.

| Style | Meaning |
|-------|---------|
| `require('fs')` | Built-in module |
| `require('express')` | Package from `node_modules` |
| `require('./file')` | Your own file |

---

## 12. Dev Dependencies (Preview)

Some tools are only for development, such as auto-restart tools.

```bash
npm install --save-dev nodemon
```

This adds to `package.json`:

```json
"devDependencies": {
  "nodemon": "^3.1.0"
}
```

In production, `npm install --omit=dev` skips them.
(In lesson 7 we use Node's own `--watch`, so you may not even need nodemon.)

---

## 13. Useful npm Commands

| Command | Purpose |
|---------|---------|
| `npm init -y` | Create `package.json` |
| `npm install` | Install all dependencies listed |
| `npm install <pkg>` | Add a dependency |
| `npm install -D <pkg>` | Add a dev dependency |
| `npm uninstall <pkg>` | Remove a package |
| `npm update` | Update within allowed ranges |
| `npm outdated` | See which packages are old |
| `npm ls --depth=0` | List installed top-level packages |
| `npm audit` | Check known vulnerabilities |
| `npm run <script>` | Run a script from `package.json` |

> 🔐 **Security habit:** run `npm audit` regularly. Most real-world Node attacks come
> through vulnerable or malicious dependencies, not through your own code.

---

## 14. Choosing a Project Name and Folder Rules

- Use lowercase and hyphens: `express-crash-course`.
- Avoid spaces and special characters in folder names.
- Do **not** name your project `express` — npm would conflict with the package name.

(If your folder is named `express`, `npm install express` can fail because a package
cannot depend on itself.)

---

## 15. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Running `npm install express` outside the project folder | Express installs in wrong place | `cd` into project first |
| Forgetting `npm init` | A `node_modules` appears without `package.json` | Run `npm init -y` |
| Committing `node_modules` | Huge repo | Add to `.gitignore` and `git rm -r --cached node_modules` |
| Editing `package-lock.json` by hand | Weird install errors | Delete lock + `node_modules`, run `npm install` |
| Naming the file `express.js` and requiring `express` | Your file loads itself | Rename the file (e.g., `server.js`) |

---

## 16. Exercise

1. Create a new folder `express-test`.
2. Run `npm init -y`.
3. Install Express.
4. Print `typeof express` in a file.
5. Delete the `node_modules` folder.
6. Run `npm install` — see everything come back.
7. Look at `package-lock.json` and find the line for `express`.

### Challenge
Run `npm ls express`. What version do you have? Write it down.

---

## 17. Quick Quiz

1. What is the purpose of `package.json`?
2. What does the `-y` in `npm init -y` mean?
3. Should `node_modules` be committed to Git?
4. What does `^4.19.2` mean?
5. What does `npm install` (with no name) do?
6. Where does Node look when you `require('express')`?

<details><summary>Answers</summary>

1. Stores project information, scripts and dependency list.
2. Accept all default answers.
3. No.
4. Any compatible 4.x.x version ≥ 4.19.2.
5. Installs everything listed in `package.json`.
6. In `node_modules` folders, going up from the current folder.
</details>

---

## 18. Summary

- A Node project = a folder with `package.json`.
- `npm init -y` creates it; `npm install express` adds Express.
- `node_modules` = downloaded packages (never commit); `package-lock.json` = exact
  versions (commit it).
- SemVer: `MAJOR.MINOR.PATCH`; `^` allows minor+patch updates.
- `.gitignore` should contain `node_modules` and `.env`.
- You can confirm the setup with `typeof require('express')` → `'function'`.

---

## 19. Next Lesson

➡️ **06 — Basic Server**
We write our first real Express server and open it in the browser.
