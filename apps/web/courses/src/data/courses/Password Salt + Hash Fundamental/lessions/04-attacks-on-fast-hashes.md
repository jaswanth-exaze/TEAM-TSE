# 04 — Attacks on Fast Password Hashes

> **Goal:** Understand offline brute-force and dictionary guessing, precomputation and
> rainbow tables, and how salts and slow KDFs change the attack cost.

---

## 1. Password Hashes Can Be Guessed

A cryptographic hash is not reversed. Instead, an attacker proposes a candidate,
computes its digest, and compares it with the stolen digest:

```text
candidate -> hash(candidate) -> compare with target digest
```

When the hash algorithm is fast and the password is common, the candidate may match
quickly. This is why "one-way" does not mean "impossible to recover."

---

## 2. Brute-Force Guessing

Brute force enumerates possible passwords from a defined character set. If a password
has length `L` and a character set of size `C`, the search space is approximately:

```text
C^L
```

Every additional character can multiply the search cost. Predictable choices reduce
the effective search space: keyboard patterns, dates, repeated characters, and common
substitutions are not random secrets.

Attackers usually prioritize likely candidates instead of starting with every possible
string. The exact attack speed depends on the hash/KDF, parameters, hardware, and
candidate distribution. Avoid treating any single benchmark number as a guarantee.

---

## 3. Dictionary and Rule-Based Attacks

A dictionary attack tests likely human choices and known password patterns. Rule-based
guessing applies common transformations such as capitalization, appending a year, or
substituting a character.

```text
base candidate -> common variations -> hash/KDF -> compare
```

The strongest defense is not an obscure substitution rule. It is a long, unique
password or passphrase, plus a password KDF and independent account protections.

---

## 4. Precomputation and Rainbow Tables

Before a target is known, an attacker can precompute mappings for many likely
passwords:

```text
candidate -> fast hash -> stored lookup
```

A rainbow table is a space/time trade-off technique that compresses precomputed
chains. These approaches are especially effective when many accounts use the same
unsalted fast hash.

### What a salt changes

With a unique salt per account:

```text
KDF(password, saltA) != KDF(password, saltB)
```

An attacker must do the work again for each unique salt. A reusable precomputed table
cannot directly answer guesses for every user. The salt does **not** make a weak
password strong, and it does not stop a targeted attacker from guessing that account.

---

## 5. Online vs Offline Attacks

| Attack | Where guesses run | Useful defense |
|--------|-------------------|----------------|
| Online guessing | Against the live login service | Rate limits, progressive delays, monitoring, MFA |
| Credential stuffing | Live service, using credentials leaked elsewhere | MFA/passkeys, breached-password checks, rate limits |
| Offline hash guessing | Attacker's own hardware after obtaining hashes | Unique salts and a slow, memory/CPU-expensive password KDF |

An online rate limit cannot slow a stolen database being attacked offline. Conversely,
a slow KDF does not prevent an attacker from sending login requests to the live service.
Use both categories of defense.

---

## 6. Why Reuse Raises the Stakes

If a person reuses a password, learning it from one service can unlock accounts on
another service. Password managers help users create unique values for every account.
MFA adds another proof that a stolen password alone cannot provide.

Never test credential-stuffing tools or guessed passwords against real accounts. In
this course, guessing is restricted to the tiny, artificial hashes created in lesson 10.

---

## 7. Exercises

1. Explain the difference between an offline hash attack and online login guessing.
2. Why does a unique salt defeat shared precomputation but not a targeted dictionary
   attack?
3. Identify three predictable password patterns that are not equivalent to randomness.
4. Choose one defense for each row of the online/offline table.
5. Explain why a slow KDF and MFA solve different problems.

---

## 8. Quick Quiz

1. Does offline guessing need to contact the original login service?
2. What problem does a per-password salt make more expensive?
3. Can rate limiting protect a stolen hash file?
4. Can a slow KDF prevent credential stuffing by itself?

<details><summary>Answers</summary>

1. No; verification guesses can run locally.
2. Reusing precomputed work across records; each distinct salt needs new work.
3. No. The attack is offline.
4. No. It slows offline guessing, not online attempts using already-known credentials.
</details>

---

## 9. Summary

- Fast hashes permit large numbers of offline guesses.
- Dictionary attacks exploit human predictability; brute force explores a search space.
- Unique salts defeat shared precomputation and rainbow-table reuse.
- Slow password KDFs and online defenses protect different boundaries.

### Next lesson

➡️ **05 — Salts, Peppers, and Stored Hash Formats**
Learn what belongs beside a verifier and what must be kept separately.
