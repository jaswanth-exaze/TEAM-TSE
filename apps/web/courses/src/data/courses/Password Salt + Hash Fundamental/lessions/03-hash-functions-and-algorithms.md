# 03 — Hash Function Properties and Algorithms

> **Goal:** Understand deterministic digests, the avalanche effect, preimage and
> collision resistance, and why MD5, SHA-1, and SHA-256 have different uses.

---

## 1. What a Cryptographic Hash Does

A cryptographic hash function maps arbitrary-length input to a fixed-length output:

```text
SHA-256("hello") -> 2cf24dba... (always 256 bits)
```

For a secure general-purpose hash, important properties include:

- **Deterministic:** the same bytes always yield the same digest.
- **Fixed output size:** digest length does not depend on input length.
- **Preimage resistance:** given a digest, finding an input that hashes to it should be
  computationally infeasible.
- **Second-preimage resistance:** given one input, finding a different input with the
  same digest should be infeasible.
- **Collision resistance:** finding any two different inputs with the same digest
  should be infeasible.
- **Avalanche effect:** a small input change should change many output bits in an
  unpredictable way.

The avalanche effect does **not** make a password secret or slow down guessing.

---

## 2. Observe the Avalanche Effect

```js
import { createHash } from 'node:crypto';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

console.log(sha256('password'));
console.log(sha256('Password')); // One character changed
```

The digests look unrelated even though the inputs differ only by letter case. Hashes
are deterministic, so repeated runs with the exact same bytes return the same digest.

---

## 3. Common General-Purpose Hashes

| Algorithm | Digest size | Status and typical lesson |
|-----------|-------------|---------------------------|
| MD5 | 128 bits | Broken for collision resistance; do not use for security decisions or passwords |
| SHA-1 | 160 bits | Collision attacks are practical; avoid in new security designs |
| SHA-256 | 256 bits | A sound general-purpose digest for many integrity/signature constructions, but too fast alone for passwords |

MD5 and SHA-1 remain in old systems and file formats. Their existence does not make
them suitable for new security-sensitive uses. SHA-256 is not "broken" in the same
sense, but its speed is exactly the problem for password verification.

---

## 4. Why Fast Hashes Fail for Password Storage

Password security depends heavily on how quickly an attacker can test candidate
passwords. SHA-256 is designed to process data quickly. A GPU can compute huge numbers
of candidate digests in parallel. A password KDF deliberately adds CPU and often memory
cost so each guess is more expensive.

```text
Fast hash:
guess -> SHA-256 -> compare

Password KDF:
guess + salt + expensive parameters -> Argon2id/scrypt/bcrypt/PBKDF2 -> compare
```

Adding a random salt to SHA-256 prevents identical passwords from sharing the same
digest and defeats precomputed rainbow tables, but it does not make each SHA-256 guess
expensive enough.

---

## 5. Hashing Bytes, Not Abstract Text

Hash functions operate on bytes. Text encoding therefore matters. UTF-8 is the usual
choice for text examples:

```js
import { createHash } from 'node:crypto';

const digest = createHash('sha256')
  .update('café', 'utf8')
  .digest('hex');
```

Two visually similar Unicode strings can contain different code points. Password
systems should define their text handling consistently and avoid silently trimming or
normalizing a user's password.

---

## 6. General Hash vs Password KDF

| Need | Example |
|------|---------|
| File checksum / content identifier | SHA-256 |
| Digital signature construction | SHA-256 as part of a standard signature scheme |
| Password verifier | Argon2id, scrypt, bcrypt, or PBKDF2 |
| Password storage by repeated SHA-256 | **Do not do this**, even with a salt |

For file integrity, a hash may help detect changes if the expected digest is trusted.
For passwords, the stored digest is exposed to an attacker and must resist cheap guesses.

---

## 7. Exercises

1. Hash `"password"` and `"Password"` using SHA-256; describe the output changes.
2. Hash the exact same bytes twice and confirm the outputs match.
3. Explain why collision resistance matters for file signatures, but slowness matters
   for password storage.
4. Explain why a salted SHA-256 password digest is still too fast.

---

## 8. Quick Quiz

1. What does the avalanche effect describe?
2. Is MD5 appropriate for new collision-sensitive security uses?
3. Is SHA-256 alone a password KDF?
4. Why do hashes return the same output for the same byte input?

<details><summary>Answers</summary>

1. Small input changes produce large, unpredictable changes in the digest.
2. No; practical collision attacks exist.
3. No. It is a fast general hash, not a password KDF.
4. Cryptographic hashes are deterministic.
</details>

---

## 9. Summary

- Hash functions have useful properties such as determinism and preimage resistance.
- MD5 and SHA-1 are unsuitable for modern collision-sensitive security; SHA-256 is a
  general-purpose hash but is still too fast by itself for passwords.
- Password storage is an economic problem: make every candidate guess costly.
- The next lesson examines how attackers test those guesses.

### Next lesson

➡️ **04 — Attacks on Fast Password Hashes**
Compare brute force, dictionary attacks, and rainbow tables.
