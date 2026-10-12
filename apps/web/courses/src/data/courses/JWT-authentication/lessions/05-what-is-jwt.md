# 05 — What is JWT?

> **Goal:** Understand JSON Web Tokens deeply — structure, signing, verification, claims,
> expiry, storage options and limits — *before* we use them in code. This is mostly a
> concept lesson with small experiments.

---

## 1. The Problem JWT Solves

After login, the client must prove who it is on **every** request (HTTP is stateless,
lesson 1). Two main designs:

### A) Server-side sessions (stateful)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant M as Session store (memory/Redis/DB)
    C->>S: POST /login (email, password)
    S->>M: create session {id: abc, userId: 7}
    S-->>C: Set-Cookie: sid=abc
    C->>S: GET /contacts (Cookie: sid=abc)
    S->>M: lookup abc
    M-->>S: userId 7
    S-->>C: contacts of user 7
```

The server **remembers** every logged-in user.

### B) Tokens (stateless) — JWT

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    C->>S: POST /login (email, password)
    S->>S: build token {userId: 7, exp} and SIGN it
    S-->>C: accessToken = xxxxx.yyyyy.zzzzz
    C->>S: GET /contacts (Authorization: Bearer token)
    S->>S: VERIFY signature + expiry
    S-->>C: contacts of user 7
```

The server stores **nothing**; the token itself carries the identity, protected by a
**signature** nobody can forge without the server's secret.

| | Sessions | JWT |
|---|----------|-----|
| State on server | Yes (session store) | No |
| Scaling to many servers | Needs shared store | Easy (any server can verify) |
| Instant logout/revocation | Easy (delete session) | Hard (token valid until it expires) |
| Size per request | Tiny id | Larger (hundreds of bytes) |
| Good for | Classic websites | APIs, mobile apps, microservices |

---

## 2. Definition

> **JWT (JSON Web Token)**, pronounced "jot", is an open standard (**RFC 7519**) for a
> compact, URL-safe string that carries **claims** (data) between parties, protected by
> a **digital signature** (or encryption).

Key words:

- **Compact / URL-safe** — can travel in headers or URLs.
- **Claims** — statements such as "user id is 7", "expires at 12:30".
- **Signed** — the receiver can detect tampering.
- **Self-contained** — no database lookup needed to read the identity.

---

## 3. Prerequisite Concept: Base64URL (Encoding, Not Secrecy)

A JWT uses **Base64URL** encoding to turn JSON into text that is safe for URLs/headers.

- Base64 maps bytes to characters `A–Z a–z 0–9 + /`.
- **Base64URL** replaces `+` with `-`, `/` with `_`, and removes `=` padding.

```bash
echo -n '{"hello":"world"}' | base64
# eyJoZWxsbyI6IndvcmxkIn0=
echo 'eyJoZWxsbyI6IndvcmxkIn0=' | base64 -d
# {"hello":"world"}
```

> ⚠️ **Base64 is NOT encryption.** Anyone who sees a JWT can read its contents. Never
> put passwords, secrets, or sensitive personal data in a JWT payload.

---

## 4. Anatomy: Three Parts Separated by Dots

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjY1ZiJ9LCJpYXQiOjE3NjAwMDAwMDAsImV4cCI6MTc2MDAwMDkwMH0.Xx9fV3...signature...
└──────────── HEADER ────────────┘ └───────────────── PAYLOAD ─────────────────┘ └──── SIGNATURE ────┘
```

```mermaid
flowchart LR
    H[Header<br/>alg, typ] -->|Base64URL| A[part 1]
    P[Payload<br/>claims] -->|Base64URL| B[part 2]
    A --> SIG
    B --> SIG[HMAC-SHA256<br/>of part1.part2 with SECRET]
    SIG -->|Base64URL| C[part 3]
    A --> J[part1.part2.part3 = JWT]
    B --> J
    C --> J
```

### 4.1 Header (metadata)
```json
{ "alg": "HS256", "typ": "JWT" }
```
- `alg` — signing algorithm (HS256 = HMAC with SHA-256).
- `typ` — token type.

### 4.2 Payload (claims)
```json
{
  "user": { "id": "665f1c2e9b1d8a3f4c2a1b01", "username": "asha", "email": "asha@example.com" },
  "iat": 1760000000,
  "exp": 1760000900
}
```

**Registered (standard) claims:**

| Claim | Name | Meaning |
|-------|------|---------|
| `iss` | Issuer | Who created the token |
| `sub` | Subject | Whom the token is about (user id) |
| `aud` | Audience | Who may use the token |
| `exp` | Expiration time | Unix seconds after which token is invalid |
| `nbf` | Not before | Token invalid before this time |
| `iat` | Issued at | When it was created |
| `jti` | JWT ID | Unique id (useful for revocation lists) |

You can add **custom claims** (`role`, `user`), but keep them **small and non-sensitive**.

Unix timestamp: seconds since 1970-01-01 UTC. Convert with
`date -d @1760000900` on Linux.

### 4.3 Signature
```
signature = HMACSHA256( base64url(header) + "." + base64url(payload), SECRET )
```
Only someone who knows `SECRET` can produce a valid signature for given header+payload.

---

## 5. How Verification Works

```mermaid
flowchart TD
    T[Receive token] --> S{3 parts?}
    S -- no --> X1[Reject: malformed]
    S -- yes --> R[Recompute signature using<br/>header.payload + SECRET]
    R --> C{Equals the received<br/>signature?}
    C -- no --> X2[Reject: tampered / wrong secret]
    C -- yes --> E{exp in the past?}
    E -- yes --> X3[Reject: expired]
    E -- no --> OK[Accept: trust the payload]
```

**Tamper test:** if an attacker changes `"id":"7"` to `"id":"1"` in the payload, the
recomputed signature no longer matches the one in the token → rejected. They cannot
create a new valid signature without the secret.

Verification is **fast** and needs **no database call** — that is what "stateless" means.

---

## 6. Hands-On Experiment (Node)

```bash
npm install jsonwebtoken
```

`scripts/jwt-demo.js`:

```js
import jwt from 'jsonwebtoken';

const SECRET = 'demo-secret-do-not-use-in-real-life';

// 1) SIGN
const token = jwt.sign(
  { user: { id: '665f1c', username: 'asha' } },   // payload (claims)
  SECRET,                                          // secret key
  { expiresIn: '15m' }                             // options → adds exp (and iat)
);
console.log('TOKEN:\n', token, '\n');

// 2) DECODE (no verification!) — anyone can do this
console.log('DECODED (not trusted):\n', jwt.decode(token, { complete: true }), '\n');

// 3) VERIFY — checks signature and expiry
const payload = jwt.verify(token, SECRET);
console.log('VERIFIED PAYLOAD:\n', payload, '\n');

// 4) Wrong secret
try {
  jwt.verify(token, 'wrong-secret');
} catch (e) {
  console.log('Wrong secret →', e.name, '-', e.message);
}

// 5) Tampered payload
const [h, , s] = token.split('.');
const fakePayload = Buffer.from(JSON.stringify({ user: { id: 'ADMIN' } })).toString('base64url');
try {
  jwt.verify(`${h}.${fakePayload}.${s}`, SECRET);
} catch (e) {
  console.log('Tampered →', e.name, '-', e.message);
}

// 6) Expired
const expired = jwt.sign({ a: 1 }, SECRET, { expiresIn: '1s' });
setTimeout(() => {
  try { jwt.verify(expired, SECRET); }
  catch (e) { console.log('Expired →', e.name, '-', e.message); }
}, 1500);
```

Run: `node scripts/jwt-demo.js`. Expected error names:

| Situation | `e.name` | `e.message` |
|-----------|----------|-------------|
| Wrong secret / tampered | `JsonWebTokenError` | `invalid signature` |
| Malformed | `JsonWebTokenError` | `jwt malformed` |
| Expired | `TokenExpiredError` | `jwt expired` |
| Not yet valid | `NotBeforeError` | `jwt not active` |

### Decode by hand in Linux
```bash
TOKEN="paste.token.here"
echo "$TOKEN" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null; echo
```
You can read the payload without any key — proof it is **not secret**.

Or paste a (non-production!) token into `jwt.io` to inspect it. Never paste real
production tokens into third-party websites.

---

## 7. `sign`, `verify`, `decode` — Never Confuse Them

| Function | Checks signature? | Use |
|----------|-------------------|-----|
| `jwt.sign(payload, secret, options)` | — | Create a token |
| `jwt.verify(token, secret, options)` | ✅ and `exp`/`nbf` | **Always use for authentication** |
| `jwt.decode(token)` | ❌ | Debugging only; **never trust the result** |

Using `decode` for access control is a classic vulnerability: an attacker can craft any
payload and `decode` happily returns it.

---

## 8. Algorithms: Symmetric vs Asymmetric

| | **HS256** (HMAC) | **RS256 / ES256** (public-key) |
|---|------------------|--------------------------------|
| Keys | One **shared secret** | **Private key** signs, **public key** verifies |
| Who can create tokens | Anyone with the secret | Only the private-key holder |
| Who can verify | Anyone with the secret | Anyone with the public key |
| Best for | Single app / one backend (this course) | Multiple services, third parties verifying tokens |

```mermaid
flowchart LR
    subgraph HS256
      A1[Auth server<br/>secret K] -- same secret K --> B1[API<br/>secret K]
    end
    subgraph RS256
      A2[Auth server<br/>private key] -- publishes public key --> B2[API 1<br/>public key]
      A2 --> B3[API 2<br/>public key]
    end
```

### Security: pin the algorithm 🔐
Historic attacks:
- **`alg: none`** — attacker sets `"alg":"none"` and removes the signature; naive
  libraries accepted it.
- **Algorithm confusion** — switching `RS256` to `HS256` and signing with the *public*
  key as an HMAC secret.

Defence: **always specify allowed algorithms** when verifying:

```js
jwt.verify(token, SECRET, { algorithms: ['HS256'] });
```

---

## 9. The Secret Key 🔐

For HS256 the secret is everything. If it leaks, anyone can mint tokens for any user.

Rules:
1. **Long and random** (≥ 32 bytes). Generate on Linux:
   ```bash
   openssl rand -hex 32
   # 3f7a9c...64 hex chars
   ```
2. Keep it in `.env` / secret manager — **never** in source code or Git.
3. Use **different secrets** per environment (dev/test/prod).
4. Rotate periodically; rotating invalidates existing tokens.
5. Do not use words like `secret`, `password`, `jwt`.
6. Do not log it.

`.env`:
```
ACCESS_TOKEN_SECRET=3f7a9c1d... (64 hex chars)
ACCESS_TOKEN_EXPIRES_IN=15m
```

---

## 10. Expiry, Access Tokens and Refresh Tokens

A stolen JWT works until it expires, so **keep access tokens short-lived**
(5–15 minutes) and combine with a **refresh token** for long sessions:

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API / Auth
    C->>A: login
    A-->>C: access token (15 min) + refresh token (7 days, stored server-side)
    C->>A: request with access token
    A-->>C: data
    Note over C,A: 15 minutes later access token expires
    C->>A: request with expired access token
    A-->>C: 401 Token expired
    C->>A: POST /refresh with refresh token
    A->>A: check refresh token in DB (can be revoked)
    A-->>C: new access token
```

| Token | Lifetime | Stored | Purpose |
|-------|----------|--------|---------|
| Access token | minutes | Memory / header | Authorize API calls |
| Refresh token | days | HttpOnly cookie + DB record | Get new access tokens; revocable |

This course implements the **access token** only (what the syllabus covers). Refresh
tokens are the recommended next step.

---

## 11. Where Does the Client Store the Token?

| Storage | XSS risk | CSRF risk | Notes |
|---------|----------|-----------|-------|
| `localStorage` / `sessionStorage` | **High** (any injected script can read it) | None (not sent automatically) | Easy but risky |
| JavaScript variable (memory) | Medium (lost on reload) | None | Safer, needs refresh flow |
| **HttpOnly, Secure, SameSite cookie** | Low (JS cannot read) | Needs protection (SameSite, CSRF token) | Often recommended for browsers |
| Mobile secure storage (Keychain/Keystore) | Low | None | For apps |

How the client sends it:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

`Bearer` means "whoever bears (holds) this token is treated as the user". Hence tokens
must travel only over **HTTPS**.

---

## 12. Limitations and Common Misunderstandings

| Misunderstanding | Reality |
|------------------|---------|
| "JWT is encrypted" | Signed, **not** encrypted (readable). JWE exists for encryption |
| "JWT can be revoked on logout" | Not by itself; valid until `exp`. Use short expiry, deny-lists (`jti`), or sessions |
| "Put the whole user in the token" | Large tokens, stale data (role changed but token says old role) |
| "Longer expiry is more convenient" | Longer window for stolen tokens |
| "Stateless means faster always" | Saves a lookup but adds size; revocation needs state anyway |
| "JWT replaces HTTPS" | No — tokens must be protected in transit |
| "decode = verify" | Decode does not check the signature |
| "JWT is always better than sessions" | For classic server-rendered sites sessions are often simpler and safer |

### When to use JWT
✅ Stateless APIs, mobile apps, microservices, short-lived authorization, passing signed
claims between services.

### When to be careful
⚠️ If you need instant logout/ban, large permission sets, or you are building a plain
server-rendered website → consider sessions.

---

## 13. How JWT Fits Our Project

```mermaid
flowchart LR
    L[POST /login] -->|credentials ok| S[jwt.sign<br/>payload user id<br/>secret from .env<br/>expiresIn 15m]
    S --> TK[accessToken]
    TK --> CL[Client stores it]
    CL -->|Authorization: Bearer| MW[validateToken middleware<br/>jwt.verify]
    MW -->|ok: req.user set| CT[Controller]
    MW -->|fail| E[401]
```

| Lesson | JWT step |
|--------|----------|
| 06 | Create the token at login |
| 07 | Require it on `/current` |
| 08 | Verify it in reusable middleware |
| 09–14 | Use `req.user.id` to scope contacts to their owner |

---

## 14. Common Mistakes (Conceptual)

| Mistake | Consequence |
|---------|-------------|
| Putting password/PII in payload | Anyone holding the token can read it |
| Using `jwt.decode` for auth | Forged tokens accepted |
| Not setting `expiresIn` | Token valid forever |
| Weak/short secret | Brute-forceable |
| Not pinning `algorithms` | Algorithm confusion attacks |
| Storing tokens in `localStorage` with XSS holes | Account takeover |
| Sending tokens over HTTP | Interception |
| Trusting role/permissions in an old token | Stale privileges |
| Logging full tokens | Anyone with logs can impersonate users |
| Same secret for dev and prod | Dev leak affects production |

---

## 15. Exercises

1. Run `jwt-demo.js` and read every printed result.
2. Decode the payload of your token using only `base64 -d` in the terminal.
3. Change one character of the payload and show verification fails.
4. Generate a secret with `openssl rand -hex 32` and store it in `.env`.
5. Convert the `exp` value to a human date using `date -d @<exp>`.
6. Create a token with `expiresIn: '10s'` and verify it before and after 10 seconds.
7. Create a token with `notBefore: '5s'` and see `NotBeforeError`.
8. Explain, in your own words, why a stolen JWT is dangerous and how short expiry helps.

### Challenge
Implement a tiny JWT by hand (no library): build header and payload JSON, Base64URL them,
compute `crypto.createHmac('sha256', secret)`, and output `h.p.s`. Then verify it with
`jsonwebtoken` to prove they agree.

<details><summary>Solution idea</summary>

```js
import crypto from 'node:crypto';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const head = b64({ alg: 'HS256', typ: 'JWT' });
const body = b64({ sub: '1', exp: Math.floor(Date.now() / 1000) + 60 });
const sig = crypto.createHmac('sha256', 'my-secret').update(`${head}.${body}`).digest('base64url');
console.log(`${head}.${body}.${sig}`);
```
</details>

---

## 16. Quick Quiz

1. What are the three parts of a JWT?
2. Is the payload encrypted?
3. What does the signature protect against?
4. What is the difference between `verify` and `decode`?
5. Why keep access tokens short-lived?
6. What does `Bearer` mean?
7. Why pin the `algorithms` option?
8. Name one downside of JWT compared to sessions.

<details><summary>Answers</summary>

1. Header, payload, signature (Base64URL, separated by dots).
2. No, only Base64URL-encoded; anyone can read it.
3. Tampering (any change to header or payload invalidates it).
4. `verify` checks signature and expiry; `decode` just reads.
5. A stolen token is usable until expiry.
6. Whoever holds the token is treated as the user.
7. To block `alg: none` and algorithm-confusion attacks.
8. Hard to revoke immediately / larger requests / stale claims.
</details>

---

## 17. Summary

- A JWT is `header.payload.signature`: Base64URL-encoded JSON plus an HMAC/RSA signature.
- It is **signed, not encrypted**; keep payloads small and non-sensitive.
- Servers **verify** (signature + `exp`) without database lookups; never trust `decode`.
- Use strong secrets from `.env`, pin algorithms, short expiries, and HTTPS.
- Know the trade-offs: stateless and scalable, but hard to revoke.

---

## 18. Next Lesson

➡️ **06 — User Login & JWT Access Token**
Check the password with bcrypt and issue a signed access token.
