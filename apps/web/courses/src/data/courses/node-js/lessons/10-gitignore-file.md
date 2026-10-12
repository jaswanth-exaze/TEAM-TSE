# 10. `.gitignore` File

## Before `.gitignore`

Before understanding `.gitignore`, you need one basic Git concept.

**Git** is a version-control system. It keeps a history of changes to your project so you can see what changed, return to earlier versions, and collaborate with other developers.

When Git **tracks** a file, Git knows about that file and can include it in commits.

But some files should not be committed.

Examples:

- `node_modules/` — can be recreated with `npm install`
- `.env` — may contain passwords or API keys
- log files — often generated automatically
- operating-system files — usually not useful to the project

A `.gitignore` file tells Git which files and folders to leave out.

## Concept

A **`.gitignore`** file contains patterns for files and folders that Git should not track.

Think of it as a filter:

```text
Your project
    │
    ├── source files       → Git can track
    │
    ├── package.json       → Git can track
    │
    ├── node_modules/      → ignored
    └── .env               → ignored
```

## Why do we ignore `node_modules`?

You learned in Topic 9 that `node_modules` contains installed packages.

It can be very large, and it can be recreated with:

```bash
npm install
```

So we normally do not commit it.

## Why do we ignore `.env`?

A `.env` file commonly contains configuration or secrets such as:

```text
DATABASE_PASSWORD=...
API_KEY=...
```

Secrets should not be committed to a public repository.

## Steps

### 1. Create `.gitignore`

In the project root, create a file named exactly:

```text
.gitignore
```

It starts with a dot and has no extension.

For our project:

```gitignore
# Dependencies (re-created by `npm install`)
node_modules/

# Secrets and local config
.env
.env.*
!.env.example

# Logs
logs/
*.log
npm-debug.log*

# Runtime data
data/*.tmp
data/activity.log

# OS / editor files
.DS_Store
Thumbs.db
.vscode/
.idea/
```

## Understanding the patterns

```text
node_modules/
```

Ignore the `node_modules` folder.

```text
*.log
```

Ignore files ending in `.log`.

For example:

```text
server.log
error.log
debug.log
```

```text
!.env.example
```

The `!` creates an exception.

It means:

> Even though `.env.*` is ignored, allow `.env.example` to be tracked.

This is useful because `.env.example` can contain placeholder values that show teammates which environment variables they need.

```text
# text
```

A line beginning with `#` is a comment and is ignored as a pattern.

```text
/build
```

This matches the `build` directory in the project root.

## Initialize Git and check the result

If Git has not been initialized:

```bash
git init
```

Then:

```bash
git add .
git status
```

Before committing, check that files such as `node_modules` and `.env` are not being added.

Then:

```bash
git commit -m "Initial commit"
```

## Critical security rule

`.gitignore` mainly prevents **untracked** files from being added.

If you already committed `.env`, adding `.env` to `.gitignore` does not automatically erase the secret from Git history.

For a file that is already tracked, you can remove it from the current Git index with:

```bash
git rm --cached .env
```

But if a real password, API key, or other secret was exposed, removing the file is not enough.

**Rotate the leaked secret** — for example, generate a new API key or change the password.

## Good practice: `.env.example`

You can commit a template containing fake or placeholder values:

```text
PORT=3000
API_KEY=change-me
```

This tells other developers which variables they need without giving them your actual secrets.

The real `.env` stays ignored.

## Pattern rules

| Pattern | Meaning |
|---|---|
| `node_modules/` | Ignore this folder |
| `*.log` | Ignore files ending in `.log` |
| `!.env.example` | Exception: allow this file |
| `# text` | Comment |
| `/build` | Match the `build` folder in the project root |

## Try it

1. Create a `.env` file:

```text
API_KEY=my-secret-key
```

2. Run:

```bash
git status
```

3. Confirm that `.env` does not appear as a file to be committed.

## Why this matters

A good `.gitignore` keeps unnecessary generated files out of your repository and, more importantly, helps prevent local secrets and configuration from being committed accidentally.
