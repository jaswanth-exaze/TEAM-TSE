# 9. NPM Modules & Nodemon

## Before npm Modules

A Node.js application often needs functionality that would take a lot of time to build from scratch.

For example, instead of writing your own utility for loading environment variables, you can use an existing package.

An **npm package** is reusable code distributed through npm.

You install a package with:

```bash
npm install <package-name>
```

## What is a dependency?

A **dependency** is a package your application depends on to perform some task.

For example:

```text
Your application
      │
      │ depends on
      ▼
    dotenv
```

If your application needs `dotenv` at runtime, it belongs in `dependencies`.

## What is a dev dependency?

A **dev dependency** is a package mainly needed while developing the application.

For example, `nodemon` helps developers by restarting the server when files change. The application itself does not need nodemon to perform its business logic in production.

So:

```text
dependencies     → needed by the application
devDependencies  → needed mainly during development
```

## What is Nodemon?

Normally, if you change `server.js` while Node is running, Node does not automatically restart the server.

You would have to:

```text
Stop server
   ↓
Run server again
```

**Nodemon** automates this:

```text
Edit file
   ↓
Save file
   ↓
Nodemon detects change
   ↓
Restarts server
```

This makes development faster.

## Picture the package flow

```text
package.json
      │
      │ npm install
      ▼
node_modules
      │
      │ package code
      ▼
Your application
```

## Steps

### 1. Install a runtime dependency

We'll use `dotenv` in topic 11:

```bash
npm install dotenv
```

Because it is a package the application will use at runtime, npm adds it to `dependencies`.

### 2. Install Nodemon as a development dependency

```bash
npm install --save-dev nodemon
```

Short form:

```bash
npm i -D nodemon
```

### 3. Look at what changed

`package.json` gains entries similar to:

```json
"dependencies": {
  "dotenv": "^16.0.0"
},
"devDependencies": {
  "nodemon": "^3.0.0"
}
```

You will also see:

```text
node_modules/
package-lock.json
```

### What is `node_modules`?

`node_modules` contains the packages installed for the project, including their dependencies.

It can become very large.

You normally:

- do not edit it manually
- do not commit it to Git
- recreate it with `npm install`

### What is `package-lock.json`?

`package-lock.json` records the exact package versions installed for the project and their dependency tree.

This helps different developers or environments install consistent versions.

## Update the development script

In `package.json`:

```json
"dev": "nodemon server.js"
```

Then run:

```bash
npm run dev
```

Now edit and save `server.js`.

Nodemon detects the change and restarts the server automatically.

## Key concepts

| Concept | Explanation |
|---|---|
| `dependencies` | Packages needed for the application to run |
| `devDependencies` | Packages mainly needed during development |
| `node_modules/` | Installed package code; don't edit or commit it |
| `package-lock.json` | Records exact installed dependency versions |
| `^1.2.3` | Allows compatible minor/patch updates within the same major version |
| `~1.2.3` | Allows patch updates within the same minor version |

## Other must-know commands

```bash
npm install                  # install everything listed in package.json
npm uninstall dotenv         # remove a package
npm update                   # update within allowed version ranges
npm list --depth=0           # list top-level installed packages
npm outdated                 # see packages with newer versions
npx nodemon server.js        # run nodemon without a global install
npm audit                    # check for known dependency vulnerabilities
```

### `npm install` after cloning a project

Usually, you do not copy `node_modules` from another computer.

After cloning a project:

```bash
npm install
```

npm reads `package.json` and `package-lock.json` and installs the required packages.

## Package security

npm packages are third-party code that runs as part of your application.

Before installing a package, check:

- the exact package name
- whether it is actively maintained
- whether it is widely used
- whether the package is actually the one you intended to install

This matters because attackers can publish packages with names similar to popular packages, a technique called **typosquatting**.

You can also run:

```bash
npm audit
```

to check for known vulnerabilities in installed dependencies.

## Nodemon configuration (optional)

You can customize what Nodemon watches with `nodemon.json`:

```json
{
  "watch": ["server.js", "src"],
  "ext": "js,json",
  "ignore": ["data/*"]
}
```

For example, if your API later writes `tasks.json` into `data/`, ignoring that directory prevents Nodemon from restarting the server every time the application writes data.

## Common mistakes

- Committing `node_modules`. Use `.gitignore` (next topic).
- Deleting `package-lock.json` without understanding why.
- Installing packages globally with `-g` when the project should use a local installation.
- Putting a development-only tool in `dependencies` when it belongs in `devDependencies`.

## Try it

Install `chalk`:

```bash
npm i chalk
```

Use it to print colored text.

Then remove it:

```bash
npm uninstall chalk
```

Observe how `package.json` and `package-lock.json` change.

## Why this matters

npm packages let you reuse existing code instead of rebuilding everything yourself, while Nodemon makes the development cycle faster.
