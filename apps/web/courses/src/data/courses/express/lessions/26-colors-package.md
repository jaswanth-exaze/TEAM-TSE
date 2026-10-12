# 26 — Colors Package

> **Goal:** Add colour to terminal output with the `colors` package (and know the
> alternatives like `chalk` and Node's built-in `styleText`), and use it to build a
> readable request logger.

---

## 1. Why Colour the Console?

When your server runs, the terminal fills with lines. Scanning a hundred grey lines for
the one error is slow. Colour adds **meaning at a glance**:

- 🟢 green = success
- 🟡 yellow = warnings / redirects
- 🔴 red = errors
- 🔵 blue/cyan = information

This is purely a **developer-experience** feature — it does not change app behaviour.

---

## 2. Prerequisite Concept: ANSI Escape Codes

Terminals do not "know" colours from JavaScript. Colours are produced by special
character sequences called **ANSI escape codes** inserted in the text.

```js
console.log('\x1b[31mThis is red\x1b[0m');
```

- `\x1b[` = escape character (ESC) + `[`
- `31m` = "set text colour to red"
- `0m` = "reset all formatting"

| Code | Effect |
|------|--------|
| `0` | Reset |
| `1` | Bold |
| `4` | Underline |
| `30–37` | Foreground: black, red, green, yellow, blue, magenta, cyan, white |
| `40–47` | Background colours |
| `90–97` | Bright foreground colours |

Libraries like `colors` and `chalk` just wrap this so you don't type escape codes.

Try it in Linux:

```bash
echo -e "\e[32mGreen text\e[0m"
```

---

## 3. Installing `colors`

```bash
npm install colors
```

(We install it as a normal dependency, but since it only affects logs you could also use
`--save-dev` if you log colour only in development.)

> 🔐 **Supply-chain lesson:** In January 2022 the maintainer of `colors` (and `faker`)
> intentionally published a broken version (`1.4.1+`) that printed an infinite loop of
> garbage, breaking thousands of projects. Always **pin or review versions** (`colors@1.4.0`),
> commit `package-lock.json`, and prefer well-maintained packages (`chalk`) or built-ins
> for new projects. This is a real example of dependency risk.

Install the safe, known version if you choose to use it:

```bash
npm install colors@1.4.0
```

---

## 4. Basic Usage

### Style 1 — String prototype extension (the classic `colors` way)

```js
import 'colors';             // adds getters to String.prototype

console.log('Server started'.green);
console.log('Warning!'.yellow);
console.log('Error!'.red);
console.log('Info'.cyan);
console.log('Important'.bold.underline);
console.log('White on red'.white.bgRed);
```

Because it **modifies the global `String.prototype`**, many consider it intrusive.

### Style 2 — Safe mode (no prototype changes)

```js
import colors from 'colors/safe.js';

console.log(colors.green('Server started'));
console.log(colors.red.bold('Fatal error'));
```

CommonJS:
```js
const colors = require('colors/safe');
```

### Common styles

| Property | Meaning |
|----------|---------|
| `.red .green .yellow .blue .magenta .cyan .white .gray` | Text colours |
| `.bgRed .bgGreen .bgYellow ...` | Background colours |
| `.bold .dim .italic .underline .inverse` | Text styles |
| `.rainbow .zebra .america` | Fun effects |

Chaining: `'text'.red.bold.underline`.

---

## 5. Using Colours in the Server Start Message

```js
import express from 'express';
import 'colors';

const app = express();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.green.bold);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`.cyan);
});
```

---

## 6. A Colourful Logger Middleware

Combine lesson 23 (middleware) with colours:

```js
// middleware/logger.js
import 'colors';

const methodColors = {
  GET: 'green',
  POST: 'yellow',
  PUT: 'blue',
  PATCH: 'magenta',
  DELETE: 'red',
};

export const logger = (req, res, next) => {
  const color = methodColors[req.method] || 'white';
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;

    const statusText =
      status >= 500 ? String(status).red :
      status >= 400 ? String(status).yellow :
      status >= 300 ? String(status).cyan :
      String(status).green;

    console.log(
      `${req.method[color]} ${req.originalUrl} ${statusText} ${`${ms}ms`.gray}`
    );
  });

  next();
};
```

Explanation:

- A lookup object maps methods to colour names.
- `req.method[color]` — **bracket notation**: `'GET'['green']` returns the green version
  (works because `colors` adds getters to `String.prototype`).
- We wait for the `finish` event to know the final status code and duration.
- Status ranges choose a colour: 5xx red, 4xx yellow, 3xx cyan, 2xx green.

Sample output (imagine colours):

```
GET /api/posts 200 3ms
POST /api/posts 201 5ms
GET /api/posts/99 404 1ms
DELETE /api/posts/2 200 2ms
```

---

## 7. Colourful Error Handler

```js
import 'colors';

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  console.error(`[${new Date().toISOString()}]`.gray, `${status}`.red.bold, err.message.red);
  if (status >= 500) console.error(err.stack.dim);

  res.status(status).json({ status, message: status >= 500 ? 'Internal Server Error' : err.message });
};
```

Now server errors are impossible to miss in a busy terminal.

---

## 8. Alternatives

### 8.1 `chalk` (most popular)

```bash
npm install chalk
```

```js
import chalk from 'chalk';

console.log(chalk.green('Success'));
console.log(chalk.red.bold('Error'));
console.log(chalk.bgBlue.white(' INFO '));
console.log(chalk.hex('#ff8800')('Orange'));
console.log(`${chalk.gray('time')} ${chalk.cyan('GET')} /api`);
```

- Does **not** modify `String.prototype`.
- ESM-only since version 5 (works great with `"type": "module"`).
- Auto-detects colour support.

### 8.2 Node's built-in `util.styleText` (Node 20.12+/21.7+)

No dependency at all:

```js
import { styleText } from 'node:util';

console.log(styleText('green', 'Success'));
console.log(styleText(['red', 'bold'], 'Error'));
```

### 8.3 `morgan` with its built-in colours

```js
import morgan from 'morgan';
app.use(morgan('dev'));    // coloured by status code automatically
```

### Comparison

| Option | Install? | Modifies prototypes? | Notes |
|--------|----------|----------------------|-------|
| `colors` | yes | yes (unless `/safe`) | Used in this course syllabus; watch the 2022 incident |
| `colors/safe` | yes | no | Safer variant |
| `chalk` | yes | no | Industry default |
| `util.styleText` | no | no | Best for tiny needs |
| Raw ANSI codes | no | no | Verbose |

---

## 9. Disabling Colours

Colours are noise in **log files** or CI systems (you'll see strange `[31m` characters).

```js
import colors from 'colors';
if (process.env.NODE_ENV === 'production' || !process.stdout.isTTY) {
  colors.disable();
}
```

- `process.stdout.isTTY` is `true` when output goes to an interactive terminal and
  `undefined` when piped/redirected (`node server.js > log.txt`).
- Environment convention: `NO_COLOR=1` should disable colour; `FORCE_COLOR=1` enables.

```bash
NO_COLOR=1 node server.js
node server.js | tee server.log        # tee receives non-TTY output
```

Production logs should be **structured (JSON)** with a library like `pino` or `winston`
— not coloured text.

---

## 10. Putting It Together

### Project tree (relevant part)

```
middleware/
├── logger.js
├── error.js
└── notFound.js
```

### `server.js`
```js
import express from 'express';
import 'colors';
import posts from './routes/posts.js';
import { logger } from './middleware/logger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(logger);
app.use(express.json());
app.use('/api/posts', posts);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.green.bold);
});
```

Make requests in Postman and watch the coloured log.

---

## 11. Security and Logging Practices 🔐

Colour is cosmetic, but this lesson is a good time to remember good logging habits:

| Do | Don't |
|----|-------|
| Log method, path, status, duration, request id | Log passwords, tokens, full card numbers |
| Log 4xx/5xx with context | Log entire request bodies of sensitive endpoints |
| Rotate and protect log files (Linux `logrotate`, file permissions) | Leave logs world-readable |
| Sanitize user input before logging (newlines) | Allow **log injection** (`\n` forged lines) |
| Use structured logs in production | Rely on coloured text in production |

**Log injection:** if you log `req.query.name` directly and an attacker sends
`%0aINFO admin logged in`, they can forge a fake log line. Encode or JSON-stringify user
data when logging: `console.log(JSON.stringify({ name: req.query.name }))`.

---

## 12. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `.green` is `undefined` | Forgot `import 'colors'` | Import it |
| Using `colors/safe` and then `.green` on strings | `undefined` | Use `colors.green(str)` |
| `req.method[color]` with an unknown colour name | `undefined` printed | Provide fallback |
| Colours appear as `\x1b[32m` in files | Output not a TTY | Disable colours |
| Colouring non-strings (`200.green`) | `SyntaxError`/undefined | Convert: `String(200).green` |
| Installing the broken `colors@1.4.1+` | Infinite-loop output | Pin `1.4.0` or use chalk |
| Using colours in JSON responses | Garbage characters for clients | Colour only terminal logs |

---

## 13. Exercises

1. Install `colors@1.4.0` and print a green success message on startup.
2. Build the coloured logger middleware and register it first.
3. Colour status codes by range (2xx, 3xx, 4xx, 5xx).
4. Colour the error handler output and print stack traces dimmed.
5. Try `colors/safe` and rewrite the logger without prototype extension.
6. Replace `colors` with `chalk`, then with `util.styleText`.
7. Add logic to disable colours when `NO_COLOR` is set or output is not a TTY.
8. Run `node server.js | cat` and observe whether colours appear.

### Challenge
Create a `log` helper with methods `log.info()`, `log.warn()`, `log.error()`,
`log.success()` that prefix messages with a coloured label and ISO timestamp.

<details><summary>Solution idea</summary>

```js
import { styleText } from 'node:util';
const stamp = () => styleText('gray', new Date().toISOString());

export const log = {
  info:    (...a) => console.log(stamp(), styleText('cyan', 'INFO '), ...a),
  success: (...a) => console.log(stamp(), styleText('green', 'OK   '), ...a),
  warn:    (...a) => console.warn(stamp(), styleText('yellow', 'WARN '), ...a),
  error:   (...a) => console.error(stamp(), styleText('red', 'ERROR'), ...a),
};
```
</details>

---

## 14. Quick Quiz

1. What are ANSI escape codes?
2. How do you print green text with `colors`?
3. What is the difference between `import 'colors'` and `colors/safe`?
4. Why disable colours in production logs?
5. What happened to `colors` in January 2022?
6. What does `process.stdout.isTTY` tell you?
7. Name two alternatives to `colors`.

<details><summary>Answers</summary>

1. Special character sequences that terminals interpret as formatting commands.
2. `'text'.green` (after importing) or `colors.green('text')` in safe mode.
3. The first modifies `String.prototype`; safe mode does not.
4. They pollute log files and tools; production prefers structured logs.
5. The maintainer published a sabotaged version that looped forever.
6. Whether output goes to an interactive terminal.
7. `chalk`, `util.styleText`, `picocolors`, `morgan('dev')`.
</details>

---

## 15. Summary

- Terminal colours come from ANSI escape codes; packages like `colors` and `chalk` wrap them.
- With `colors` you chain properties (`'ok'.green.bold`) or use `colors/safe` functions.
- Use colour for readable dev logs: method colours, status ranges, red errors.
- Disable colours for non-TTY/production; prefer structured logs there.
- Mind supply-chain risk (pin versions) and avoid logging secrets or raw user input.

---

## 16. Next Lesson

➡️ **27 — Using Controllers**
Separate **what URL maps to what** (routes) from **what the code does** (controllers).
