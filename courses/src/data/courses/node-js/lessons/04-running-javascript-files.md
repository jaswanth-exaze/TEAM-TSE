# 4. Running JavaScript Files

## Concept

You run a JavaScript file with:

```bash
node <filename>
```

Node.js reads the file, executes the code from top to bottom, and normally exits when there is nothing left to do.

A server is different because it keeps running while it listens for requests.

### Picture the flow

```text
Terminal
   │
   │ node server.js
   ▼
Node.js runs the file
   │
   └─ output and errors return to the terminal
```

---

## Steps

### 1. Create a JavaScript file

Create `hello.js` in your project:

```js
console.log("Hello from Node!");
console.log("Node version:", process.version);
console.log("Running on:", process.platform);
```

Here, `console.log()` prints information to the terminal.

### 2. Run the file

From the folder containing `hello.js`, run:

```bash
node hello.js
```

Node executes the file from top to bottom and displays the output.

You can also omit the `.js` extension in this simple case:

```bash
node hello
```

### 3. Use Watch Mode

During development, you may want Node to automatically restart the program whenever you save the file.

Use:

```bash
node --watch hello.js
```

This is called **watch mode** and is available in modern Node.js versions.

### 4. Pass Arguments to a JavaScript File

You can provide values from the terminal when starting a program.

Create `greet.js`:

```js
const name = process.argv[2] ?? "stranger";

console.log(`Hello, ${name}!`);
```

Run:

```bash
node greet.js Sam
```

Output:

```text
Hello, Sam!
```

If you do not provide a name:

```bash
node greet.js
```

Output:

```text
Hello, stranger!
```

`process.argv` is an array containing the command-line arguments:

```text
process.argv
    ↓
[nodePath, scriptPath, ...yourArguments]
```

Therefore, the first argument you provide is at index `2`:

```js
process.argv[2]
```

The first two positions are used for the Node executable path and the script path.

---

## Browser JavaScript vs Node.js

JavaScript behaves differently depending on where it runs.

| | Browser | Node.js |
|---|---|---|
| Global object | `window` | `globalThis` |
| DOM (`document`) | Yes | No |
| File system | No direct access | Yes |
| Network servers | No | Yes |
| Modules | `import` | `import` and `require` |

The key idea is:

```text
Browser
→ JavaScript for web pages

Node.js
→ JavaScript for server-side and system-level tasks
```

This is why Node.js can do things that browser JavaScript normally cannot, such as working with the file system and creating network servers.

---

## Try It

Create `sum.js` that adds all numbers passed from the terminal.

For example:

```bash
node sum.js 4 5 6
```

Expected output:

```text
15
```

### Hint

You can get the arguments and convert them to numbers with:

```js
process.argv.slice(2).map(Number)
```

Then use `reduce()` to calculate their total.

---

## Common Mistakes

### 1. Running the command from the wrong folder

Make sure the terminal is inside the folder containing your JavaScript file.

### 2. Forgetting the filename

Use:

```bash
node hello.js
```

not just:

```bash
node
```

The second command starts the Node REPL.

### 3. Forgetting that command-line arguments are strings

Values from:

```js
process.argv
```

are strings.

For example:

```text
"4"
"5"
"6"
```

If you need numbers, convert them with:

```js
Number(...)
```

or:

```js
map(Number)
```

---

## Why It Matters

Running JavaScript files is the basic way you execute Node.js programs.

You have now seen the difference between:

```text
node
     → Node REPL

node hello.js
     → Run a JavaScript file

node --watch hello.js
     → Run and automatically restart when the file changes
```

This is the foundation for running the Node.js applications we will build next.
