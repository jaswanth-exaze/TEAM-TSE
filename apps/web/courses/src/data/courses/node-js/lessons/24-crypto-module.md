# 24. Crypto Module

## Concept

Before using cryptography, understand the problem it solves.

**Cryptography** protects information using mathematical techniques. In backend applications, common uses include secure random values, data fingerprints, password protection, and signatures.

Node's built-in `node:crypto` module provides these tools. You do not need to install a package for these basic operations.

**Rule #1: never invent your own cryptography. Use established algorithms and Node's built-ins correctly.**

### Important terms

- **Random value:** a value generated unpredictably. Secure randomness is important for tokens and secrets.
- **Token:** a value used to identify or authorize something, such as a session.
- **Hash:** a one-way fingerprint of data.
- **Encryption:** transforms data so it can later be recovered with a key. Unlike hashing, encryption is reversible with the correct key.
- **Salt:** random data added when hashing a password so identical passwords do not produce identical stored values.
- **HMAC:** a value created from a message and a secret key to detect tampering and verify knowledge of the secret.
- **Buffer:** Node's representation of raw binary data. Crypto APIs often use Buffers.

### Picture the flow

```text
Crypto tools
   ├─ secure random value → identifier or token
   ├─ hash → one-way fingerprint
   └─ scrypt + salt → password verification data
```

## 1) Secure random values and IDs

```js
import crypto from 'node:crypto';

crypto.randomUUID();                          // 'b1f4b4c0-....' unique ID
crypto.randomBytes(16).toString('hex');       // 32 hex chars, useful for tokens
crypto.randomInt(1, 7);                       // secure random integer 1–6
```

`Math.random()` is **not cryptographically secure**. Never use it for tokens, passwords, API keys, or session IDs.

**Apply:** in `store.js`, replace:

```js
Date.now().toString()
```

with:

```js
import { randomUUID } from 'node:crypto';

// ...
id: randomUUID(),
```

Timestamps are predictable, so they are not suitable for security-sensitive identifiers.

## 2) Hashing: one-way fingerprints

A **hash** converts input into a fixed-size digest.

```js
const hash = crypto.createHash('sha256').update('hello').digest('hex');
// '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
```

- Same input → same output.
- A tiny change → a very different output.
- You cannot practically recover the original input from the hash.
- Common uses: file integrity checks, cache keys, and fingerprints.
- **Not for storing passwords:** SHA-256 is designed to be fast, which makes password guessing cheaper. See `scrypt` below.

## 3) HMAC: hash with a secret

**HMAC** combines a message with a secret key to produce a value that can be verified by someone who knows the same secret.

```js
const secret = process.env.API_KEY;

const signature = crypto
  .createHmac('sha256', secret)
  .update('task:123')
  .digest('hex');
```

HMAC is used for webhooks and signed messages. It does **not** encrypt the message.

## 4) Password hashing with `scrypt`

Passwords should not be stored as plain text.

A **salt** is random data generated for each password:

```text
password + unique salt → scrypt → stored verification data
```

`scrypt` is deliberately expensive, which slows down large numbers of password guesses.

```js
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64);

  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, keyHex] = stored.split(':');

  const key = await scrypt(
    password,
    Buffer.from(saltHex, 'hex'),
    64
  );

  return crypto.timingSafeEqual(
    key,
    Buffer.from(keyHex, 'hex')
  );
}
```

`promisify()` converts a callback-style function into one that can be used with `await`.

The stored value contains the salt and derived key. You do not decrypt it; you derive a value again when verifying the password.

## 5) Timing-safe comparison

A normal comparison such as:

```js
given === expected
```

can reveal timing information because comparisons may stop when they find a difference.

Use:

```js
crypto.timingSafeEqual(a, b);
```

for security-sensitive equal-length `Buffer` values.

Hashing both values first gives fixed-length buffers:

```js
const givenHash = sha256(given);
const expectedHash = sha256(expected);

crypto.timingSafeEqual(givenHash, expectedHash);
```

## Apply it: protect write endpoints with an API key

An **API key** is a secret value sent by a client to authorize API access.

Add to `src/middleware.js`:

```js
import { createHash, timingSafeEqual } from 'node:crypto';

const sha256 = (value) =>
  createHash('sha256').update(String(value)).digest();

export function requireApiKey(req, res, next) {
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (!isWrite || !req.parsedUrl.pathname.startsWith('/api')) return next();

  const expected = process.env.API_KEY;
  if (!expected) throw httpError(500, 'Server misconfigured');

  const given = req.headers['x-api-key'] ?? '';

  if (!timingSafeEqual(sha256(given), sha256(expected))) {
    throw httpError(401, 'Invalid or missing API key');
  }

  next();
}
```

In `server.js`, put it **before** `jsonBody` so unauthorized requests are rejected before their bodies are parsed:

```js
compose([logger, cors, parseUrl, serveStatic(PUBLIC_DIR), requireApiKey, jsonBody, dispatch])
```

Test:

- `POST /api/tasks` without the header → **401**
- `POST /api/tasks` with `x-api-key: my-secret-key-123` → **201**

Keep real API keys in environment configuration such as `.env`, not in source code.

## Try it

Write `hash.js` that takes a file path and prints its SHA-256 checksum using `fs.createReadStream` piped into `createHash`. Streams allow large files to be processed without loading the entire file into memory.

Compare it with:

```text
sha256sum <file>
```

or on Windows PowerShell:

```powershell
Get-FileHash <file> -Algorithm SHA256
```

---
