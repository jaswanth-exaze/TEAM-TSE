# 05 — Salts, Peppers, and Stored Hash Formats

> **Goal:** Generate and store unique random salts, understand optional peppers, and
> recognize self-describing password-hash encodings.

---

## 1. What a Salt Is

A salt is a random, non-secret value used as an input to a password KDF:

```text
verifier = KDF(password, salt, parameters)
```

Each password record needs its own independent salt. The salt is generated when the
password is created or changed and stored with the resulting verifier.

### A salt should be

- Generated with a cryptographically secure random number generator.
- Unique per password record; at least 16 random bytes is a common baseline.
- Stored with the verifier, so it remains available for login verification.
- Public: it does not need confidentiality.
- Reused only to verify that one password record—not shared by every user.

Use Node's cryptographic random API, never `Math.random()`:

```js
import { randomBytes } from 'node:crypto';

const salt = randomBytes(16);
console.log(salt.toString('base64url'));
```

When using bcrypt or Argon2 libraries, let the library generate and encode its salt.
Do not generate a salt and then accidentally discard it.

---

## 2. Why the Salt Is Not Secret

The verifier must contain or reference the salt so the application can recompute the
KDF at login. An attacker who steals the verifier also sees the salt. Security comes
from:

1. A different salt per record, so attackers cannot amortize one computation over all
   users.
2. A slow password KDF, so each candidate remains expensive.
3. Strong, unique passwords, which make likely guesses less likely.

The salt is not an encryption key and should not be kept in a separate secret store.

---

## 3. What a Pepper Is

A pepper is an optional secret shared by a service or key version and held **separately**
from the password database, ideally in a secrets manager or HSM-backed service.

| Salt | Pepper |
|------|--------|
| Random per password | Usually shared at service/key-version scope |
| Public and stored with the verifier | Secret and stored separately |
| Prevents cross-record precomputation | Can add protection if only the DB is stolen |
| Cannot be rotated without recomputing verifiers from passwords | Rotation needs a planned migration strategy |

If an attacker compromises both the database and the application/secret store, the
pepper may not help. Peppering adds operational complexity: backup, access control,
availability, key-version tracking, and rotation must be designed.

Do not invent an ad hoc concatenation scheme. If using a pepper, follow maintained
framework/library guidance for a keyed pre-hash or verifier design, version it, and
ensure the pepper is never written to the database or logs.

---

## 4. Self-Describing Encodings

A stored verifier should identify its algorithm and parameters. This allows verification
and future upgrades without guessing how a string was made.

An Argon2id PHC string looks like:

```text
$argon2id$v=19$m=65536,t=3,p=1$<salt-base64>$<hash-base64>
```

Its fields identify the algorithm/version, memory cost (`m`), time cost (`t`),
parallelism (`p`), salt, and derived output.

A bcrypt verifier often looks like:

```text
$2b$12$<salt-and-derived-value-encoded-together>
```

The bcrypt format encodes its version, work factor, salt, and derived value in its
standard string. It is not the same literal five-field format as Argon2.

A generic conceptual format is:

```text
$algorithm$version/parameters$salt$derived-value
```

Exact delimiters and fields vary by algorithm. Let the selected library encode and parse
its own format; do not hand-roll a parser.

---

## 5. Store the Encoded Verifier

A relational schema can store the complete encoded verifier as one string:

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);
```

Column size depends on the chosen algorithm and encoding. `VARCHAR(255)` accommodates
common PHC strings but confirm the library's maximum encoded length. Do not truncate a
verifier. Store separate algorithm or pepper-version columns only when your application
needs them for indexing or migration policy.

---

## 6. Common Mistakes

| Mistake | Why it fails | Better approach |
|---------|--------------|-----------------|
| One static salt for every user | Shared computation is reusable | Let the KDF create a unique salt per hash |
| `Math.random()` salt | Not a cryptographic random source | `crypto.randomBytes()` or KDF library |
| Treating salt as a secret | Adds operational burden without value | Store the salt with the verifier |
| Storing pepper beside password hash | Database theft exposes both | Keep pepper in a separate secret system |
| Truncating encoded verifier | Verification may fail or become ambiguous | Size the column for complete encoded output |
| Parsing format manually | Fragile and easy to misread | Use the algorithm's verification library |

---

## 7. Exercises

1. Generate several 16-byte salts with `randomBytes`; compare their hex/base64url
   encodings and byte lengths.
2. Explain why the salt must be stored but does not need to be secret.
3. Label the algorithm, version, cost, salt, and derived output in the example Argon2id
   PHC string.
4. Draft an operational checklist for storing and rotating a pepper.
5. Explain why a shared salt and a pepper are not interchangeable.

---

## 8. Quick Quiz

1. Should two users have the same salt by design?
2. Where should the salt be stored?
3. Where should a pepper be stored?
4. What useful information does a self-describing verifier carry?

<details><summary>Answers</summary>

1. No; generate an independent random salt for each password hash.
2. With the verifier or in its encoded format.
3. Separately from the password database, in a protected secret-management system.
4. Algorithm/version, work parameters, salt, and derived value.
</details>

---

## 9. Summary

- A salt is random, unique per password, public, and stored with the verifier.
- A pepper is optional secret material held separately and requires careful rotation
  planning.
- Store complete, self-describing verifier strings and use library parsing/verification.

### Next lesson

➡️ **06 — Slow Password Hashing Algorithms**
Compare the KDF choices and tune their costs for real deployment hardware.
