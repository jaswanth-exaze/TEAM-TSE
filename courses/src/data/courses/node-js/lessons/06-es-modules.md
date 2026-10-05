# 6. ES Modules

## Before ES Modules: why do we need modules?

As a JavaScript project grows, putting all code in one file becomes difficult to manage. A **module** is a JavaScript file that contains code we can keep separate and reuse in another file.

For example:

```text
math.js  →  contains math functions
app.js   →  uses those functions
```

To share code between files, JavaScript uses **exports** and **imports**.

- **Export** = make a value available outside the current file.
- **Import** = bring an exported value into another file.

## Concept

**ES Modules (ESM)** are the standard JavaScript module system that uses `import` and `export`. The same syntax is commonly used in frontend JavaScript, and **our Node.js project uses ESM**.

### Picture the flow

```text
math.js
   │ export
   ▼
app.js
   │ import
   ▼
uses the exported values
```

Think of it as:

```text
export = "make this available"
import = "bring this into this file"
```

## Steps: enable ESM

Node.js needs to know that a project is using ES Modules.

Choose one:

- Add `"type": "module"` to `package.json` (what we did in topic 3), or
- Use the `.mjs` file extension.

For our project, we use `"type": "module"`:

```json
{
  "type": "module"
}
```

Once this is set, `.js` files are treated as ES Modules.

## Named and default exports

`src/math.js`

```js
export function add(a, b) {
  return a + b;
}

export const PI = 3.14159;

export default function multiply(a, b) {
  return a * b;
}
```

Here:

- `add` is a **named export**.
- `PI` is another **named export**.
- `multiply` is the **default export**.
- A file can have many named exports, but only one default export.

### Importing them

`app.js`

```js
import multiply, { add, PI } from './src/math.js';

console.log(add(2, 3));
console.log(multiply(4, 5));
console.log(PI);
```

Notice the syntax:

```js
import multiply, { add, PI } from './src/math.js';
```

- `multiply` is imported as the default export, so it does not use `{}`.
- `add` and `PI` are named exports, so they use `{}`.
- `./` means "look in the current project directory."
- In Node.js ESM, the `.js` extension is required for local file imports.

## Importing Node.js built-in modules

Node.js provides modules such as `os`, `path`, and `fs`.

With ESM, we can import them like this:

```js
import os from 'node:os';
import { readFile } from 'node:fs/promises';
```

The `node:` prefix clearly tells Node.js that the module is built into Node itself.

## Differences from CommonJS

| | CommonJS | ES Modules |
|---|---|---|
| Import | `const x = require('x')` | `import x from 'x'` |
| Export | `module.exports = ...` | `export` / `export default` |
| Local import extension | often optional | required (`./math.js`) |
| `__dirname` / `__filename` | available | not available directly |
| Top-level `await` | not traditionally available | available |
| Module system | Node's older module system | JavaScript standard module system |

You learned CommonJS in Topic 5. The important thing is to recognize both systems because Node.js projects can encounter either one.

## Getting `__dirname` back in ESM

CommonJS provides `__dirname` and `__filename` automatically. ESM does not provide them directly.

If you need the same information:

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(__dirname);
```

`import.meta.url` represents the URL of the current module.

Newer Node.js versions also provide `import.meta.dirname`, but the approach above is widely useful.

## Top-level await

`await` normally appears inside an `async` function. ESM also allows **top-level `await`**, meaning it can be used directly at the top level of a module.

```js
import { readFile } from 'node:fs/promises';

const text = await readFile('./notes.txt', 'utf8');

console.log(text);
```

Here, `readFile()` reads the file asynchronously, and `await` waits for the result before `text` is used.

## Mixing the two systems

ESM and CommonJS are different module systems, but Node.js provides ways for them to work together.

- ESM can import a CommonJS package; its `module.exports` is commonly available as the default import.
- CommonJS cannot traditionally use `require()` to load an ESM file. Dynamic `import()` can be used instead:

```js
const mod = await import('./file.js');
```

## The `node:` prefix

```js
import fs from 'node:fs';
```

The `node:` prefix clearly identifies a Node.js built-in module and avoids confusion with an npm package having the same name.

We will use this style for Node.js built-in modules.

## Try it

1. In your `task-api` project, create `src/utils/response.js`:

```js
export function hello() {
  return 'hi';
}
```

2. Import it in a test file and run it.
3. Deliberately remove `.js` from the import path and read the error message.

## Why this matters

ES Modules are the module system you will use to split a Node.js application into smaller files. Understanding `import` and `export` now will make larger projects much easier to follow.
