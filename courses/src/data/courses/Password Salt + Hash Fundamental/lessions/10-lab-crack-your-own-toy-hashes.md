# 10 — Hands-on Lab: Crack Your Own Toy Hashes

> **Goal:** Create a deliberately weak hash using a password you choose, recover it from
> a tiny local candidate list, and compare that lesson with a salted slow KDF.

> **Safety boundary:** This lab only creates and checks artificial hashes in memory.
> Do not use real users' hashes, breach dumps, production databases, external wordlists,
> network services, or accounts. The example intentionally uses fast MD5/SHA-256 only to
> demonstrate why they are unsuitable for password storage.

---

## 1. What This Lab Demonstrates

You will:

1. Choose a synthetic password from a short candidate list.
2. Hash it with a fast general-purpose hash.
3. Test only the candidates in that local list.
4. Observe how quickly a weak candidate can be recovered.
5. Create two slow KDF verifiers with independent salts and compare verification.

This is a teaching demonstration, not a production password recovery tool.

---

## 2. Prerequisites

- Node.js installed.
- A local folder for a temporary script.
- No third-party packages or downloaded wordlists required.

Create a file named `own-hash-lab.mjs` and paste the following:

```js
import { createHash, randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

// Pick a value you created for this exercise; never use a real account password.
const toyPassword = 'bluebird7';
const candidates = [
  'tulip',
  'bluebird',
  'bluebird7',
  'planet-owl',
  'another-toy-value',
];

const target = createHash('sha256').update(toyPassword, 'utf8').digest('hex');
console.log('Toy SHA-256 target:', target);

const recovered = candidates.find((candidate) =>
  createHash('sha256').update(candidate, 'utf8').digest('hex') === target
);

console.log('Recovered from the tiny local list:', recovered ?? 'no match');
```

Run it:

```bash
node own-hash-lab.mjs
```

The candidate equals the synthetic value you used to create the target, so the demo
finds it. If you replace `toyPassword`, update or extend only this small local
`candidates` array with your own synthetic value.

---

## 3. Compare an Unsalted Digest

Add a short MD5 comparison beside the SHA-256 demonstration:

```js
const md5Target = createHash('md5').update(toyPassword, 'utf8').digest('hex');
const md5Match = candidates.find((candidate) =>
  createHash('md5').update(candidate, 'utf8').digest('hex') === md5Target
);

console.log('Toy MD5 target:', md5Target);
console.log('MD5 candidate match:', md5Match ?? 'no match');
```

MD5 is included because it is a known-broken legacy algorithm. It is not included as a
recommendation. SHA-256 is also unsuitable as a password verifier by itself because it
is too fast, even though it remains useful for many general-purpose integrity
constructions.

---

## 4. Add a Random Salt to the Toy Hash

This still is **not** a safe password storage scheme; it simply shows how salts change
the input and output:

```js
const saltA = randomBytes(16);
const saltB = randomBytes(16);
const toyPasswordBytes = Buffer.from(toyPassword, 'utf8');

const saltedA = createHash('sha256').update(saltA).update(toyPasswordBytes).digest('hex');
const saltedB = createHash('sha256').update(saltB).update(toyPasswordBytes).digest('hex');

console.log('Salt A:', saltA.toString('hex'));
console.log('Salt B:', saltB.toString('hex'));
console.log('Salted digest A:', saltedA);
console.log('Salted digest B:', saltedB);
console.log('Digests differ:', saltedA !== saltedB);
```

The salts should be stored with their verifier and are not secret. A salt prevents the
same precomputed digest from matching every user and forces separate work per salt.
It does not make fast SHA-256 expensive enough for password storage.

---

## 5. Compare With a Slow KDF

Append this self-contained scrypt example:

```js
async function makeScryptVerifier(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 32, {
    N: 1 << 15,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return { salt, key };
}

const verifierA = await makeScryptVerifier(toyPassword);
const verifierB = await makeScryptVerifier(toyPassword);

console.log('Slow KDF salts differ:', !verifierA.salt.equals(verifierB.salt));
console.log('Slow KDF derived keys differ:', !verifierA.key.equals(verifierB.key));

const attempt = 'bluebird7';
const attemptKey = await scrypt(attempt, verifierA.salt, verifierA.key.length, {
  N: 1 << 15,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
});
console.log('Correct attempt verifies:', attemptKey.equals(verifierA.key));
```

This lab compares buffers for a local demonstration. In a real app, store a
self-describing encoding of the algorithm, parameters, salt, and key, validate its
parameters, and use a maintained password-hashing library's verification API.
Benchmark the scrypt parameters on your machine; they are intentionally modest for a
teaching run and are not a production recommendation.

---

## 6. Observe and Explain

Answer these questions in your notes:

1. Why did the toy SHA-256 value match quickly?
2. What changed when the salt changed?
3. Why is salt not a replacement for a slow KDF?
4. Why do two scrypt verifiers for the same password have different salts and keys?
5. What extra information must a real stored verifier contain?
6. Which parts of this lab must **not** be used for production password storage?

Do not compare the printed duration on one device with published benchmark numbers.
Runtime varies with Node version, processor, memory, operating system, and concurrent
work.

---

## 7. Cleanup

Delete the temporary script when finished, or retain it only as a local educational
artifact. It contains no real password. Never replace the synthetic value with a
credential used on any real service.

---

## 8. Quick Quiz

1. Did the lab reverse a hash mathematically?
2. Why was the SHA-256 target easy to match?
3. What does a unique salt accomplish?
4. Is the toy SHA-256-plus-salt code production password storage?
5. What should production code use to verify an Argon2id/bcrypt hash?

<details><summary>Answers</summary>

1. No; it tested candidates and compared their computed digests.
2. The candidate list was tiny and general-purpose SHA-256 is fast.
3. It prevents shared precomputation and makes identical passwords have different
   verifiers.
4. No. A salt does not slow the hash; use a password KDF.
5. The maintained library's verification function.
</details>

---

## 9. Summary

- Hash guessing works by testing candidates, not by decrypting the digest.
- A tiny local example demonstrates the risk without touching third-party credentials.
- Salts prevent shared precomputation; slow KDFs make each guess more expensive.
- Only run this exercise against hashes you created yourself.

### Course complete

You can now explain password threats, select the correct transformation, use unique
salts and slow KDFs, verify and upgrade stored verifiers, and layer account defenses.
