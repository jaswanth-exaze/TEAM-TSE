# 02 — Encoding, Encryption, and Hashing

> **Goal:** Distinguish encoding, encryption, and hashing by purpose, reversibility, and
> key requirements; choose the right operation for a given security problem.

---

## 1. Three Different Operations

| Operation | Purpose | Reversible? | Secret key? | Example |
|-----------|---------|-------------|-------------|---------|
| **Encoding** | Represent bytes in a chosen format | Yes, by anyone who knows the format | No | Base64, URL encoding |
| **Encryption** | Keep data confidential while allowing recovery | Yes, with the correct key | Yes | AES-GCM |
| **Hashing** | Produce a digest/fingerprint for comparison | Designed to be one-way | No | SHA-256 |
| **Password KDF** | Derive a password verifier at deliberate cost | Not practically reversible; guesses can be tested | Usually no; optional pepper | Argon2id, scrypt |

Hashing a password quickly with SHA-256 is **not** secure password storage. Passwords
have low, human-chosen entropy, so password verification needs a deliberately expensive
KDF.

---

## 2. Encoding Is Not Protection

Base64 encodes bytes as printable text. Anyone can decode it:

```js
const encoded = Buffer.from('correct horse battery staple', 'utf8').toString('base64');
const decoded = Buffer.from(encoded, 'base64').toString('utf8');

console.log(encoded);
console.log(decoded);
```

Use encoding to transport or represent data—not to hide passwords, API keys, or tokens.
The same is true of hexadecimal and URL encoding.

---

## 3. Encryption Is Reversible

Encryption is appropriate when the application must later recover the original data,
such as a private document or a third-party credential. It requires secure key
management:

```text
ciphertext = Encrypt(key, nonce, plaintext, authenticated-encryption-mode)
plaintext  = Decrypt(key, nonce, ciphertext)
```

For new designs, use a maintained authenticated-encryption API such as AES-GCM, with a
unique nonce per key and correct authentication-tag handling. Do not invent a cipher or
reuse a nonce. Keep keys outside the encrypted database.

Passwords are different: a login service should compare an attempt, not decrypt the
stored value. Encrypting a password still leaves the service with a reversible copy and
a key that can expose every account if compromised.

---

## 4. Hashing and Password KDFs

A general hash maps arbitrary input to a fixed-size digest:

```text
digest = Hash(message)
```

A password KDF takes the password, a salt, and cost parameters:

```text
verifier = KDF(password, salt, parameters)
```

Verification recomputes the KDF using the saved salt and parameters, then compares the
result. It does not recover the original password.

---

## 5. Quick Demonstration

```js
import { createHash } from 'node:crypto';

const password = 'correct horse battery staple';
const sha256 = createHash('sha256').update(password, 'utf8').digest('hex');
const base64 = Buffer.from(password, 'utf8').toString('base64');

console.log({ password, sha256, base64 });
console.log(Buffer.from(base64, 'base64').toString('utf8')); // Reveals the password
```

This is a demonstration only. Do not copy the SHA-256 result as a password verifier.

---

## 6. Choose the Right Tool

| Requirement | Suitable approach |
|-------------|-------------------|
| Represent binary data as text | Base64 or hex encoding |
| Store a value that must be recovered later | Authenticated encryption plus key management |
| Detect accidental file changes | A general cryptographic hash such as SHA-256 |
| Store a user password for later login verification | Argon2id, scrypt, bcrypt, or PBKDF2 using a maintained password-hashing library |

---

## 7. Common Mistakes

| Mistake | Why it fails | Better approach |
|---------|--------------|-----------------|
| Base64-encoding a password | Easily decoded; no secret required | Use a password KDF |
| Encrypting passwords for login | Recoverable if the key is exposed | Store a KDF verifier |
| Using SHA-256 once for passwords | Very fast to guess at scale | Use a slow, tunable password KDF |
| Calling every transformation "hashing" | Hides important security properties | Name the operation precisely |

---

## 8. Exercises

1. Base64-encode a sample phrase and decode it without using a secret.
2. Explain why an encrypted password database still needs a decryption key.
3. Decide which operation to use for a private document, file-integrity check, and
   account password; justify each choice.
4. Modify the demo to use SHA-256 and compare output for two different inputs.

---

## 9. Quick Quiz

1. Which operation can be reversed by anyone who knows the format?
2. Which operation uses a key to recover data?
3. Should SHA-256 be used by itself to store passwords?
4. Does a password KDF decrypt the password at login?

<details><summary>Answers</summary>

1. Encoding.
2. Encryption.
3. No; use a password-specific KDF with a salt and appropriate cost.
4. No; it derives another verifier from the login attempt and compares it.
</details>

---

## 10. Summary

- Encoding is representation, encryption is reversible confidentiality, and hashing is a
  one-way digest.
- Password storage requires a password KDF, not encoding, encryption, or a fast hash.
- Select the operation based on whether the original value must later be recovered.

### Next lesson

➡️ **03 — Hash Function Properties and Algorithms**
Learn what digests guarantee—and what MD5, SHA-1, and SHA-256 do not guarantee.
