# 07 — Password Hashing in Node.js

> **Goal:** Create password verifiers with Node's `crypto` APIs, bcrypt, and Argon2id;
> use random salts, store complete encodings, and avoid custom cryptographic designs.

---

## 1. Use a Maintained Password KDF

For production, choose a maintained implementation and use its encoding and verify
functions. Do not create your own hash format or silently omit the salt or parameters.

```text
password -> library KDF -> encoded verifier -> database
login attempt + stored verifier -> library verify -> true / false
```

Use `argon2id` where supported, or a suitable bcrypt, scrypt, or PBKDF2 library/API
based on the requirements from lesson 6.

---

## 2. Node's Built-in PBKDF2

Node provides asynchronous PBKDF2 through `node:crypto`. This example creates a
self-describing string and verifies it later. It uses a random 16-byte salt and
PBKDF2-HMAC-SHA-256 with 600,000 iterations as an OWASP baseline; confirm current
guidance and benchmark for your environment.

`password-pbkdf2.js`:

```js
import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 600_000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return [
    'pbkdf2-sha256',
    ITERATIONS,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password, encoded) {
  const [algorithm, iterationText, saltText, keyText] = encoded.split('$');
  if (algorithm !== 'pbkdf2-sha256') throw new Error('Unsupported password hash');

  const iterations = Number(iterationText);
  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(keyText, 'base64url');
  if (encoded.split('$').length !== 4 ||
      !Number.isSafeInteger(iterations) || iterations < 1 || iterations > 1_000_000 ||
      salt.length < 16 || expected.length !== KEY_LENGTH) {
    throw new Error('Invalid password hash format');
  }

  const actual = await pbkdf2Async(password, salt, iterations, expected.length, DIGEST);
  return timingSafeEqual(actual, expected);
}
```

In production, strictly bound parsed parameters before doing expensive work. Otherwise,
a maliciously modified stored string could request extreme resource consumption. A
maintained password-hashing library is preferable because it handles format parsing
and supported parameter constraints.

---

## 3. Node's Built-in `scrypt`

`scrypt` uses both CPU and memory. Node exposes it in `node:crypto`:

```js
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const salt = randomBytes(16);
const key = await scrypt('correct horse battery staple', salt, 32, {
  N: 1 << 17,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
});
```

For a full application, store the chosen parameters, salt, and derived key in a
versioned encoding, and enforce safe upper bounds when parsing it. Always benchmark
memory use and concurrent logins. Do not reuse the example parameters without testing
their cost on your deployment.

---

## 4. Bcrypt

Install the maintained package:

```bash
npm install bcrypt
```

```js
import bcrypt from 'bcrypt';

const verifier = await bcrypt.hash(password, 12);
const matches = await bcrypt.compare(loginAttempt, verifier);
```

The library creates and embeds a random salt and cost in its encoded verifier.
Benchmark the cost factor on the server. Bcrypt commonly limits input to 72 bytes;
define an explicit password-length policy and do not silently truncate.

---

## 5. Argon2id

Install the maintained `argon2` package:

```bash
npm install argon2
```

```js
import argon2 from 'argon2';

const verifier = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
});

const matches = await argon2.verify(verifier, loginAttempt);
```

The library generates a unique salt and returns a PHC encoded string containing
algorithm/version, parameters, salt, and derived hash. The example uses a baseline
parameter set; tune for your machine and service capacity using current security
guidance.

---

## 6. Store and Return the Right Values

The encoded verifier belongs in the database. Never return it in normal API responses,
and never log the password or verifier. Select the password hash only in the
authentication query.

```js
const passwordHash = await hashPassword(req.body.password);
await pool.execute(
  'INSERT INTO users (email, password_hash) VALUES (?, ?)',
  [email, passwordHash]
);
```

Do not write the password into request logs, tracing attributes, analytics events,
error messages, or test snapshots.

---

## 7. Common Mistakes

| Mistake | Why it fails | Better approach |
|---------|--------------|-----------------|
| Use `Math.random()` for salt | Predictable randomness | Use the KDF library or `randomBytes` |
| Use `createHash('sha256')` for password storage | Fast offline guesses | Use a password KDF |
| Use synchronous KDF APIs in a request handler | Blocks Node's event loop | Use asynchronous APIs |
| Reuse one salt | Enables cross-account precomputation | Unique per password |
| Store only the derived bytes with no metadata | Cannot reliably verify/upgrade | Store a self-describing encoded verifier |
| Ignore KDF concurrency cost | Login bursts may exhaust resources | Benchmark and rate-limit |
| Return the stored verifier | Exposes an offline-guessing target | Return only public account fields |

---

## 8. Exercises

1. Implement PBKDF2 creation and verification with asynchronous APIs.
2. Create two bcrypt or Argon2id hashes for the same password and observe that the
   encoded verifiers differ due to independent salts.
3. Check that the library's `verify`/`compare` API accepts the correct password and
   rejects a wrong one.
4. Add a database column for the encoded verifier and make sure API responses omit it.
5. Record latency and memory use under representative concurrency.

---

## 9. Quick Quiz

1. Who should generate a bcrypt or Argon2 salt?
2. What should the database store?
3. Should a request handler call a synchronous password KDF?
4. Why is PBKDF2's example encoding self-describing?

<details><summary>Answers</summary>

1. The maintained library.
2. The complete encoded verifier, with algorithm, parameters, salt, and derived value.
3. No; use asynchronous APIs to avoid blocking the event loop.
4. The verifier must communicate its algorithm, work factor, salt, and result for
   verification and future upgrades.
</details>

---

## 10. Summary

- Use a maintained password KDF and its encoding/verification APIs.
- Node's async PBKDF2 and scrypt are available; bcrypt and Argon2id use maintained
  packages.
- Store encoded verifiers, not plaintext, and do not expose them to ordinary API code.

### Next lesson

➡️ **08 — Password Verification, Timing, and Migration**
Verify safely and upgrade old hashes when a user successfully authenticates.
