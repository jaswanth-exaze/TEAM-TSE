# 5. CommonJS Modules

## Concept

Real applications are usually split into multiple files so the code is easier to organize and maintain.

A **module** is a file that can share some of its code with other files.

**CommonJS (CJS)** is Node.js's original module system. It mainly uses:

```js
require()
module.exports
```

You will still see CommonJS in older tutorials and many existing Node.js projects, so it is important to understand it even though our main project uses **ES Modules**.

> **Important:** Do this topic in a separate scratch folder called `commonjs-demo/`. Run `npm init -y` there and do **not** add `"type": "module"` to its `package.json`.

### Picture the flow

```text
math.js
   │ module.exports
   ▼
app.js
   │ require('./math')
   ▼
uses the exported values
```

---

## Steps

### 1. Create the module

Create `commonjs-demo/math.js`:

```js
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

const PI = 3.14159;

module.exports = { add, multiply, PI };
```

Here:

```js
module.exports = { add, multiply, PI };
```

makes these three values available to another file.

### 2. Import the module

Create `commonjs-demo/app.js`:

```js
const { add, multiply, PI } = require('./math');
const os = require('os');

console.log(add(2, 3));      // 5
console.log(multiply(4, 5)); // 20
console.log(PI);             // 3.14159
console.log(os.platform());
```

Notice the difference:

```js
require('./math')
```

starts with `./` because `math` is our local file.

```js
require('os')
```

does not use a path because `os` is a Node.js built-in module.

### 3. Run the program

From the `commonjs-demo` folder:

```bash
node app.js
```

---

## Key Ideas

### Three common forms of `require()`

```js
require('./math');   // your own/local file
require('fs');       // Node.js built-in module
require('express');  // package from node_modules
```

A useful rule is:

```text
./ or ../
    → local file

built-in module name
    → Node.js built-in module

package name
    → installed package
```

---

### Exporting a Single Value

A module can export one function or value.

For example:

```js
// logger.js
module.exports = function log(msg) {
  console.log(`[LOG] ${msg}`);
};
```

Use it from another file:

```js
const log = require('./logger');

log('hi');
```

The important idea is:

```text
module.exports
      ↓
makes something available

require()
      ↓
gets that exported value
```

---

## CommonJS Variables

Node.js provides several useful variables in CommonJS modules:

| Variable | Meaning |
|---|---|
| `require` | Loads another module |
| `module` | Represents the current module |
| `exports` | Shortcut related to `module.exports` |
| `__filename` | Full path of the current file |
| `__dirname` | Directory containing the current file |

Each CommonJS file has its own module scope, so variables declared in one file are not automatically available in another file.

You explicitly share values using `module.exports`.

---

## Module Caching

When a CommonJS module is loaded with `require()`, Node.js caches it.

This means if the same module is required again, Node normally uses the already-loaded module instead of executing the file from the beginning again.

A simple mental model is:

```text
First require
    ↓
Load and execute module
    ↓
Cache it

Second require
    ↓
Use cached module
```

This is useful, but it also means you should understand that requiring the same module does not normally create a completely new copy each time.

---

## Common Mistakes

| Mistake | Why it fails |
|---|---|
| `exports = { add }` | Reassigns the local `exports` variable. Use `module.exports = { add }` when replacing the export. |
| `require('math')` | Without `./`, Node treats `math` as a package/module name rather than your local `math.js` file. |
| Using `import` in a CommonJS setup | The project/file must be configured for ES Modules before using `import` syntax. |

The most important distinction to remember is:

```js
require('./math')
```

means:

> Load my local module.

while:

```js
require('express')
```

means:

> Load a package named `express`.

---

## Try It

Create `greet.js` that exports two functions:

```text
greet(name)
farewell(name)
```

Then import both functions in `app.js` and print their results.

For example:

```text
Hello, Sam!
Goodbye, Sam!
```

The goal is to practice the complete CommonJS flow:

```text
Create functions
     ↓
module.exports
     ↓
require()
     ↓
Use the functions
```

---

## Why It Matters

Our main project uses ES Modules, but you will encounter CommonJS frequently when working with existing Node.js applications and older tutorials.

Once you understand:

```text
module.exports → export
require()      → import
```

the basic CommonJS module pattern becomes much easier to recognize.

---
