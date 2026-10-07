# 07 — Protecting Routes: User

> **Goal:** Make `GET /api/users/current` **private**: it must reject requests without a
> valid token and return the logged-in user's info when the token is valid. We first do
> it *by hand* inside the controller to feel the repetition problem — lesson 8 then
> solves it with middleware.

---

## 1. What Does "Protecting a Route" Mean?

A **protected (private) route** runs its logic only if the request proves who the caller
is. Otherwise the server stops early and answers **401 Unauthorized**.

```mermaid
flowchart TD
    A[GET /api/users/current] --> B{Authorization header<br/>present and Bearer?}
    B -- no --> X1[401 User is not authorized<br/>or token missing]
    B -- yes --> C{jwt.verify OK?}
    C -- bad signature / malformed --> X2[401 Invalid token]
    C -- expired --> X3[401 Token expired]
    C -- ok --> D[Read user from payload]
    D --> E[200 user info]
```

Today `/current` is open to anyone:

```bash
curl http://localhost:5000/api/users/current
# {"message":"Current user information"}   ← should NOT be allowed without a token
```

---

## 2. Prerequisite Concept: The `Authorization` Header

HTTP requests carry metadata in **headers**. The standard header for credentials:

```
Authorization: <scheme> <credentials>
```

For tokens we use the **Bearer** scheme (RFC 6750):

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7...}.AbC...
```

| Part | Meaning |
|------|---------|
| `Authorization` | Header name (case-insensitive) |
| `Bearer` | Scheme: "the bearer of this token is authorized" |
| (space) | Exactly one space |
| token | The JWT from login |

### In Express
Node lowercases header names:

```js
req.headers.authorization        // 'Bearer eyJ...'
req.get('Authorization')         // same (case-insensitive helper)
```

### Parsing it
```js
const header = req.headers.authorization;           // string or undefined
if (!header || !header.startsWith('Bearer ')) { /* reject */ }
const token = header.split(' ')[1];                  // the part after "Bearer "
```

Other schemes you may meet: `Basic base64(user:pass)`, `Digest`, `ApiKey` (custom).

### Sending it
**Postman:** Authorization tab → Type **Bearer Token** → paste `{{token}}`.
**curl:**
```bash
curl http://localhost:5000/api/users/current \
  -H "Authorization: Bearer $TOKEN"
```
**fetch:**
```js
fetch('/api/users/current', {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 3. The Route Is Already "Private" in the Docs — Not in Code

In lesson 1 we wrote `@access Private` in a comment. A comment protects nothing. Let us
enforce it.

---

## 4. Manual Protection Inside the Controller

`controllers/userController.js`:

```js
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/HttpError.js';

// @desc    Current user info
// @route   GET /api/users/current
// @access  Private
export const currentUser = async (req, res) => {
  // 1) read the header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'User is not authorized or token is missing');
  }

  // 2) extract the token
  const token = authHeader.split(' ')[1];

  // 3) verify it (throws if invalid or expired)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'User is not authorized';
    throw new HttpError(401, message);
  }

  // 4) use the verified payload
  res.status(200).json(decoded.user);
};
```

### Walk-through

| Step | What happens |
|------|--------------|
| 1 | Missing or wrongly-formatted header → 401 immediately |
| 2 | Split on space; index `[1]` is the token |
| 3 | `jwt.verify` checks signature, expiry, algorithm. It **throws** on failure |
| 4 | `decoded` is the payload: `{ user: {...}, iat, exp }` — we return `decoded.user` |

### Test it

**No token:**
```bash
curl -i http://localhost:5000/api/users/current
# 401 {"status":401,"message":"User is not authorized or token is missing"}
```

**Valid token:**
```bash
curl -s http://localhost:5000/api/users/current -H "Authorization: Bearer $TOKEN"
# {"id":"665f1c2e9b1d8a3f4c2a1b01","username":"asha","email":"asha@example.com"}
```

**Tampered token** (change the last character):
```bash
curl -i http://localhost:5000/api/users/current -H "Authorization: Bearer ${TOKEN}x"
# 401 {"message":"User is not authorized"}
```

---

## 5. Why This Approach Does Not Scale

Imagine protecting `current`, `GET /contacts`, `POST /contacts`, `PUT`, `DELETE`...
Each would repeat the same 15 lines:

```mermaid
flowchart LR
    subgraph Without middleware
      C1[currentUser<br/>verify code] 
      C2[getContacts<br/>verify code]
      C3[createContact<br/>verify code]
      C4[updateContact<br/>verify code]
      C5[deleteContact<br/>verify code]
    end
```

Problems:

1. **Duplication** (DRY violation).
2. **Inconsistency** — one handler forgets to check expiry, another uses a different message.
3. **Security risk** — adding a new route and *forgetting* the check leaves it open.
4. **Hard to change** — switching algorithm or header format requires editing everything.

**Solution** (next lesson): write the check **once** as **middleware** and plug it in
front of any route:

```js
router.get('/current', validateToken, currentUser);
```

```mermaid
flowchart LR
    R[Request] --> MW[validateToken<br/>runs once, reusable]
    MW -->|valid| C1[currentUser]
    MW -->|valid| C2[getContacts]
    MW -->|valid| C3[createContact]
    MW -->|invalid| X[401]
```

---

## 6. Prerequisite Concept: How Does Middleware Pass Data On?

When middleware verifies the token it knows **who** the user is. The controller needs
that info. Express lets middleware attach data to the **`req` object**, which is the
same object all later functions see for that request:

```js
req.user = decoded.user;     // set in middleware
// later in controller
const id = req.user.id;
```

We will use `req.user.id` to scope contacts to their owner (lessons 9–14).

```mermaid
sequenceDiagram
    participant C as Client
    participant M as validateToken
    participant H as currentUser
    C->>M: GET /current + Bearer token
    M->>M: verify token
    M->>M: req.user = payload.user
    M->>H: next()
    H-->>C: 200 req.user
```

---

## 7. Public vs Private Routes in `userRoutes.js`

Our final routing file (after lesson 8 provides `validateToken`):

```js
import express from 'express';
import { registerUser, loginUser, currentUser } from '../controllers/userController.js';
import { validateToken } from '../middleware/validateTokenHandler.js';

const router = express.Router();

router.post('/register', registerUser);            // public
router.post('/login', loginUser);                  // public
router.get('/current', validateToken, currentUser); // private

export default router;
```

A quick visual:

| Route | Middleware chain |
|-------|------------------|
| `POST /register` | `registerUser` |
| `POST /login` | `loginUser` |
| `GET /current` | `validateToken` → `currentUser` |

---

## 8. What Should `/current` Return?

Choices:

| Option | Source | Pros | Cons |
|--------|--------|------|------|
| **A. Payload only** (this lesson) | Token contents | No DB call, fast | May be stale (email changed) |
| **B. Fresh from DB** | `findUserById(req.user.id)` | Always current, detects deleted users | One query |

Option B is more correct and also confirms the user **still exists**:

```js
import { findUserById } from '../models/userModel.js';

export const currentUser = async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) throw new HttpError(401, 'User no longer exists');
  res.json(user);
};
```

If a user is deleted/banned, their token still verifies until it expires; checking the DB
closes this gap for sensitive routes. We use **Option B** in the final project and
explain the trade-off:

```mermaid
flowchart LR
    T[Valid token] --> Q{Check DB?}
    Q -- no --> F[Fast, stateless<br/>stale data risk]
    Q -- yes --> S[One extra query<br/>fresh data, revocation possible]
```

---

## 9. Security Checklist 🔐

| Threat | Defence |
|--------|---------|
| Missing check on a new route | Apply middleware at router level (`router.use(validateToken)`) when most routes are private |
| Using `decode` instead of `verify` | Always `verify` |
| Accepting tokens in query strings (`?token=`) | Use headers; URLs are logged |
| Revealing why a token failed in detail | Keep generic message; distinguish only "expired" if your client needs refresh |
| Tokens never expire | Always `expiresIn` |
| Deleted users still have working tokens | DB check on sensitive routes, short expiry |
| Token interception | HTTPS only |
| Returning too much user data | Select only needed fields |
| Caching responses with personal data | `Cache-Control: no-store` on private endpoints |

Add `no-store` for private responses:

```js
res.set('Cache-Control', 'no-store');
```

---

## 10. Testing Matrix

| # | Request | Expected status | Message |
|---|---------|-----------------|---------|
| 1 | No `Authorization` header | 401 | token missing |
| 2 | `Authorization: Token abc` (wrong scheme) | 401 | token missing / not authorized |
| 3 | `Authorization: Bearer` (no token) | 401 | not authorized |
| 4 | `Authorization: Bearer garbage` | 401 | not authorized |
| 5 | Valid token | 200 | user info |
| 6 | Token signed with another secret | 401 | not authorized |
| 7 | Expired token | 401 | token expired |
| 8 | Token with `alg: none` | 401 | not authorized |
| 9 | Token in query string `?token=...` | 401 | ignored |

Create a **Postman collection** `JWT Auth` with: Register, Login (saves `{{token}}`),
Current (Bearer `{{token}}`), and negative tests.

Add Postman tests for the Current request:

```js
pm.test('200 OK', () => pm.response.to.have.status(200));
pm.test('has email', () => pm.expect(pm.response.json()).to.have.property('email'));
```

---

## 11. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `split(' ')[1]` when header is just `Bearer` | `undefined` token → `jwt must be provided` | Check token exists |
| Sending `Bearer<token>` (no space) | 401 | Space required |
| Putting the token in the body of a GET | Ignored | Use header |
| Using `req.headers.Authorization` (capital A) | `undefined` | Lowercase `authorization` |
| Different secret in `.env` than at signing time | `invalid signature` | Same secret; restart server after change |
| Forgetting `await`/`throw` semantic in Express 4 | Hang | Use wrapper |
| Checking only header presence | Anyone passes with `Bearer x` | Verify signature |
| Returning `decoded` including `iat/exp` | Exposes internals (harmless but noisy) | Return `decoded.user` |
| Postman Authorization set to "No Auth" | 401 | Choose Bearer Token |
| Token with extra quotes copied from JSON | `jwt malformed` | Remove `"` characters |

---

## 12. Exercises

1. Implement the manual protection in `currentUser` and test with and without a token.
2. Send the token with the wrong scheme (`Token`, `Basic`) and observe the response.
3. Corrupt the token (change one char in each part, one at a time) and compare errors.
4. Use `jwt.decode` (not verify) in a temporary copy and show how a forged token passes —
   then restore `verify`.
5. Make `/current` load fresh data from MySQL and return 401 if the user was deleted
   (delete the row with `DELETE FROM users WHERE id = ?` and call again with the old token).
6. Add `Cache-Control: no-store` to the response and check it in Postman headers.
7. Create the Postman environment with `token` and a Bearer Authorization at collection level.
8. List five other routes in a typical app that need protection.

### Challenge
Write a function `getTokenFromRequest(req)` that supports **both** the `Authorization:
Bearer` header and an HttpOnly cookie named `token`. Think about the security trade-offs
of supporting both (hint: CSRF applies to cookies).

---

## 13. Quick Quiz

1. What status code do we return when the token is missing?
2. What is the format of the Authorization header for JWT?
3. Why should we use `jwt.verify` and not `jwt.decode`?
4. Why is repeating verification code in every controller a bad idea?
5. How can middleware make the user available to the controller?
6. Why might `/current` query the database even though the token has the user data?
7. Why is passing the token in the URL discouraged?

<details><summary>Answers</summary>

1. 401.
2. `Authorization: Bearer <token>`.
3. `decode` does not validate the signature; forged tokens would be accepted.
4. Duplication, inconsistency, and risk of forgetting protection.
5. By setting `req.user`.
6. To get fresh data and detect deleted/banned users.
7. URLs are logged and stored in history; tokens would leak.
</details>

---

## 14. Summary

- A protected route verifies the **Bearer token** before running its logic; failures are
  **401**.
- The token travels in `Authorization: Bearer <jwt>`; parse it, `jwt.verify` it, then use
  the payload.
- Doing this by hand in every controller is repetitive and error-prone → use **middleware**.
- Middleware can put the verified user on `req.user` for controllers.
- Consider a DB lookup for fresh data and revocation-like behavior; add `no-store`.

---

## 15. Next Lesson

➡️ **08 — Verify JWT Token Middleware**
Write `validateToken` once and reuse it everywhere.
