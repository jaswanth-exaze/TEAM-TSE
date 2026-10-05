# 8. NPM Scripts

## Before NPM Scripts

You have already used commands such as:

```bash
node server.js
node hello.js
```

As a project grows, commands can become long or difficult to remember.

For example:

```bash
node --watch server.js
```

Instead of typing the full command every time, npm lets us give the command a name.

## What is npm?

**npm (Node Package Manager)** is the package manager that comes with Node.js.

We use npm to:

- install packages
- remove packages
- manage project dependencies
- run project scripts

You have already used npm when running:

```bash
npm init -y
```

and installing packages.

## What is an npm script?

An npm script is a **named shortcut for a command** stored inside the `scripts` section of `package.json`.

For example:

```json
"scripts": {
  "dev": "node --watch server.js"
}
```

Now:

```bash
npm run dev
```

runs:

```bash
node --watch server.js
```

### Picture the flow

```text
npm run dev
      │
      ▼
package.json
      │
      ▼
scripts.dev
      │
      ▼
node --watch server.js
```

## Steps

### 1. Edit `package.json`

Add:

```json
"scripts": {
  "start": "node server.js",
  "dev": "node --watch server.js",
  "hello": "node hello.js"
}
```

The name on the left is the script name.

The command on the right is what npm executes.

For example:

```json
"dev": "node --watch server.js"
```

means:

```text
dev → node --watch server.js
```

### 2. Run the scripts

```bash
npm start
npm run dev
npm run hello
```

Most custom scripts use:

```bash
npm run <script-name>
```

So:

```bash
npm run hello
```

runs the `hello` script.

### 3. See available scripts

Run:

```bash
npm run
```

This lists the scripts defined in your `package.json`.

## Special script names

Some npm script names have special commands.

For example:

```bash
npm start
npm test
```

do not require `npm run`.

For custom names such as `dev`, `hello`, and `build`, use:

```bash
npm run dev
npm run hello
npm run build
```

## Useful features

### Chaining commands

You can run commands one after another:

```json
"build": "npm run clean && npm run compile"
```

`&&` means:

> Run the second command only if the first command succeeds.

### Passing extra arguments

You can pass additional arguments to a script after `--`:

```bash
npm run dev -- --port 4000
```

The first `--` tells npm that the following arguments should be passed to the command.

### Using locally installed tools

npm scripts can use tools installed inside your project, such as `nodemon`, without requiring a global installation.

When npm runs a script, it makes locally installed command-line tools available through `node_modules/.bin`.

This is one reason project-specific installations are preferred.

## Typical script set for a real project

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "node --test",
  "lint": "eslint ."
}
```

These names are conventions:

- `start` → run the application
- `dev` → run the application in development mode
- `test` → run tests
- `lint` → check code style/problems

The exact commands depend on the project.

## Try it

Add:

```json
"info": "node -v && npm -v"
```

Then run:

```bash
npm run info
```

You should see the installed Node.js and npm versions.

## Why this matters

As your project grows, npm scripts give you a simple and consistent way to run common development commands without remembering long commands.
