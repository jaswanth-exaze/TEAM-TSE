# 08 — Password Verification, Timing, and Migration

> **Goal:** Verify passwords with maintained library APIs, reduce timing differences,
> safely upgrade legacy hashes, and handle algorithm changes over time.

---

## 1. Verify; Do Not Decrypt

At login, load the user's encoded verifier and let the same KDF library verify the
attempt:

```js
const user = await findUserByEmailForLogin(normalizedEmail);
const valid = user
  ? await argon2.verify(user.passwordHash, submittedPassword)
  : false;
```

The library reads the salt and parameters from the stored encoding, derives a verifier
for the attempt, and compares the results. Never implement your own verifier comparison
for bcrypt or Argon2.

---

## 2. Constant-Time Comparisons

Timing variation can reveal whether an account exists or how many bytes matched. Use
maintained KDF verify/compare functions; they are designed to compare their outputs
appropriately. Do not compare secret-derived strings with an early-exit loop.

Node's `timingSafeEqual` is appropriate for equal-length buffers in carefully designed
protocols:

```js
import { timingSafeEqual } from 'node:crypto';

function equalFixedLengthBuffers(a, b) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

The length check itself may reveal length. For password KDF outputs, use the KDF
library's verification API instead of building a custom comparison. A constant-time
comparison does not make the whole endpoint constant-time; database access and other
work may still vary.

---

## 3. Reduce Account-Existence Timing Differences

If unknown accounts return immediately while known accounts perform a slow KDF, an
attacker may distinguish them by timing even if the response message is generic.

One common mitigation is to verify against a valid dummy verifier when no account was
found:

```js
const user = await findUserByEmailForLogin(normalizedEmail);
const verifier = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
const passwordMatches = await argon2.verify(verifier, submittedPassword);

if (!user || !passwordMatches) {
  throw new HttpError(401, 'Email or password is not valid');
}
```

Generate the dummy verifier once using the same KDF and comparable parameters; do not
hash a new dummy value for each request. The response, status code, logging, and rate
limits should not disclose whether the account exists. Timing mitigation reduces a
signal; it does not prove perfect constant-time behavior.

---

## 4. Login and Upgrade-on-Success

Store an algorithm and parameter version with the verifier. On a successful login:

1. Verify using the verifier's recorded algorithm and parameters.
2. Check whether the verifier is weaker or older than current policy.
3. If needed, hash the submitted password with the current KDF and parameters.
4. Replace the stored verifier after a successful match.
5. Do not lock the user out solely because their verifier is old.

Pseudocode:

```js
const user = await findUserByEmailForLogin(email);
const valid = await verifyEncodedPassword(password, user.passwordHash);

if (!valid) throw new HttpError(401, 'Email or password is not valid');

if (needsRehash(user.passwordHash)) {
  const upgraded = await hashPassword(password);
  await updatePasswordHash(user.id, upgraded);
}
```

The `needsRehash` and `verifyEncodedPassword` functions should be provided by the chosen
library or by a small, carefully reviewed adapter. Validate stored parameters before
doing expensive work.

---

## 5. Migrating Legacy Hashes

Suppose an old system stored unsalted SHA-256. Do not attempt to recover users'
passwords in bulk. Instead:

- Tag the legacy scheme explicitly; do not guess the algorithm from string length alone.
- At login, verify the submitted password using the legacy format only for accounts
  that are marked as legacy.
- On success, immediately replace it with a current password KDF verifier.
- On failure, return the same generic error; do not reveal the stored scheme.
- Set a migration deadline and reset passwords for inactive accounts that remain legacy.
- Treat a known-exposed credential set as an incident; force resets when appropriate.

Be careful with encoding: old systems may have used different character encodings,
normalization, or truncation. Document the exact legacy behavior.

---

## 6. Changing a Pepper or KDF

Changing a KDF parameter can usually be handled by rehashing after a successful login.
A pepper rotation is more complicated because the old pepper may be required to verify
the old record. Keep a version identifier, retain old keys only for a controlled
migration window, rehash with the current key after successful verification, then retire
old keys according to policy.

If an old pepper is compromised, follow an incident response plan; merely changing the
secret does not update existing verifiers.

---

## 7. Common Mistakes

| Mistake | Risk | Better approach |
|---------|------|-----------------|
| Decrypting a password | Stored value should not be reversible | Verify a KDF |
| Comparing strings with custom early exit | Timing signal | Use the KDF's verify API |
| Different login messages for missing user/wrong password | Account enumeration | Generic response and similar work |
| Rehash every account offline without its password | Impossible for one-way hashes | Rehash on successful login or reset |
| Trusting parameters from the DB without limits | Malformed values can exhaust resources | Use a library and bound accepted parameters |
| Rotating a pepper without a transition plan | Existing users cannot verify | Version keys and migrate or reset deliberately |

---

## 8. Exercises

1. Explain why a generic error alone may not prevent account enumeration.
2. Add a dummy verifier to a test login flow and compare response code/message for an
   unknown email and a wrong password.
3. Design a record/version scheme for legacy SHA-256 and current Argon2id accounts.
4. Describe which values must be known to verify a legacy password and which can be
   discarded after an account upgrades.

---

## 9. Quick Quiz

1. Should passwords be decrypted during login?
2. When is the best time to upgrade a user's legacy verifier?
3. Does `timingSafeEqual` make an entire HTTP request constant-time?
4. What should happen if the account is missing when using a dummy verifier?

<details><summary>Answers</summary>

1. No; use a KDF verify/compare operation.
2. Immediately after successful verification, using the submitted password.
3. No; other operations and system behavior can still vary.
4. Perform comparable KDF work with a valid dummy verifier, then return the same
   generic authentication failure.
</details>

---

## 10. Summary

- Use library verification APIs and generic login failures.
- A dummy verifier can reduce account-existence timing differences but cannot promise
  perfect constant-time behavior.
- Upgrade weak hashes and parameters on successful login; do not try to reverse hashes.
- Plan pepper rotation, legacy encoding, and migration deadlines explicitly.

### Next lesson

➡️ **09 — Password Policy and Defence in Depth**
Password hashing is one layer; account security also depends on user choices and login
controls.
