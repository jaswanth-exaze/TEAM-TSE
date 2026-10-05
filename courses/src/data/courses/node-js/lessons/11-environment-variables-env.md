# 11. Environment Variables & `.env`

## Before We Start

**Configuration** means values that control how an application runs, such as:

```text
PORT=3000
NODE_ENV=development
API_KEY=...
```

Instead of hard-coding these values in JavaScript, we can keep them outside the code.

## Concept

An **environment variable** is a named value available to a running program.

A `.env` file is a convenient development file for storing these values. Node.js does not automatically read `.env`; a package such as `dotenv` loads it into `process.env`.

```text
.env
 │
 │ dotenv
 ▼
process.env
 │
 └── server reads PORT, API_KEY, etc.
```

Remember:

- `.env` = file containing development configuration
- `process.env` = where Node reads environment variables
- `dotenv` = loads `.env` values into `process.env`

## Steps

### 1. Create `.env`

```env
PORT=3000
NODE_ENV=development
API_KEY=my-secret-key-123
```

Do not write JavaScript syntax such as `PORT = 3000;`.

### 2. Install `dotenv`

```bash
npm install dotenv
```

### 3. Read the values

```js
import 'dotenv/config';
import http from 'node:http';

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Running in ${process.env.NODE_ENV} mode`);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

`process.env.PORT` reads the variable named `PORT`.

## Important: Values Are Strings

Environment variables are strings:

```js
process.env.PORT // "3000"
```

If a number is required:

```js
const PORT = Number(process.env.PORT) || 3000;
```

The `|| 3000` gives a default when `PORT` is missing.

### Change Configuration Without Changing Code

Change:

```env
PORT=4000
```

Restart the server. It now uses port 4000.

This lets the same application use different configuration on your computer, testing server, and production server.

## Other Ways to Set Variables

macOS/Linux:

```bash
PORT=5000 node server.js
```

Windows PowerShell:

```powershell
$env:PORT=5000; node server.js
```

Recent Node.js versions also support:

```bash
node --env-file=.env server.js
```

## Security

Never commit real secrets:

```env
API_KEY=real-secret
DATABASE_PASSWORD=real-password
```

Make sure `.env` is in `.gitignore`.

Instead, commit a safe template:

```env
PORT=3000
NODE_ENV=development
API_KEY=change-me
```

in:

```text
.env.example
```

Never print real secrets with `console.log`.

If a required variable is missing, fail early:

```js
if (!process.env.API_KEY) {
  console.error('Missing API_KEY');
  process.exit(1);
}
```

## Common Mistakes

- Forgetting to restart after changing `.env`.
- Treating environment values as numbers.
- Committing `.env`.
- Assuming `.env` is automatically loaded.
- Putting server secrets into frontend JavaScript.

## Try It

Add:

```env
APP_NAME=Task API
```

and display `process.env.APP_NAME` in the server startup message.

---
