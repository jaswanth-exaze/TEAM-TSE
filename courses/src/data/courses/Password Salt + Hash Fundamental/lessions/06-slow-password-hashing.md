# 06 — Slow Password Hashing Algorithms

> **Goal:** Compare PBKDF2, bcrypt, scrypt, and Argon2; understand work factors and
> choose safe, measured parameters for a deployment.

---

## 1. Why Password KDFs Are Deliberately Expensive

A KDF makes password verification more expensive than a general-purpose hash. This
increases the cost of each offline guess after a database theft. Parameters must be
stored so the same cost can be used at login.

Two main levers are:

- **CPU/time cost:** more computation per guess.
- **Memory cost:** more memory per guess, reducing the attacker's parallel guesses per
  device.

The objective is not to make login unusable. Benchmark on representative production
hardware, choose an acceptable authentication latency and capacity, and revisit
parameters as hardware changes.

---

## 2. Algorithm Comparison

| Algorithm | Main properties | When it may fit | Notes |
|-----------|-----------------|-----------------|------|
| **PBKDF2** | Repeated keyed hash; CPU cost | Environments requiring broad standards/FIPS support | Use a current iteration count and a maintained implementation |
| **bcrypt** | Tunable cost, mature ecosystem | Existing apps and broad compatibility | Common implementations limit input to 72 bytes; do not silently truncate longer passwords |
| **scrypt** | CPU- and memory-costly | When a memory-hard KDF is needed and Argon2 is unavailable | Configure memory deliberately; account for concurrent logins |
| **Argon2id** | Memory-hard, combines side-channel and GPU resistance design goals | Preferred modern general choice when supported | Tune memory, time, and parallelism to the service's capacity |

Do not build a password scheme by repeatedly hashing SHA-256. Use a standard password
KDF and a maintained library.

---

## 3. Work Factors and Example Baselines

Security guidance changes as hardware evolves. Treat these as **starting points for
measurement**, not immutable constants:

- Argon2id: OWASP guidance includes a minimum baseline around `m=19 MiB, t=2, p=1`;
  stronger settings may be appropriate if login capacity allows.
- scrypt: OWASP guidance includes parameter sets such as `N=2^17, r=8, p=1`; verify
  memory requirements and runtime on the actual Node deployment.
- bcrypt: choose a cost that gives an acceptable measured verification latency; its
  cost factor is logarithmic (increasing it by one roughly doubles work).
- PBKDF2-HMAC-SHA-256: current OWASP guidance uses 600,000 iterations as a baseline
  where PBKDF2 is required; always confirm current guidance and benchmark.

The system's CPU and memory limits, peak simultaneous logins, serverless timeouts, and
service-level objectives all affect the final choice. Excessive memory cost can become
an availability problem under high concurrency.

---

## 4. Capacity Planning

If one verification uses `T` milliseconds and the service accepts `R` concurrent
logins, expect roughly `R × T` milliseconds of aggregate compute time, with memory use
depending on the algorithm. Benchmark realistic concurrent requests, not only one
password in a developer console.

Plan to:

1. Measure hash and verify latency on production-like machines.
2. Load-test expected concurrency and memory use.
3. Apply rate limits and abuse controls to reduce attacker-triggered work.
4. Revisit parameters on a regular schedule.
5. Store parameters in the verifier so hashes can evolve.

---

## 5. Password Length and Input Handling

Password inputs must be consistently encoded and bounded to prevent huge payloads or
resource abuse. Do not trim or silently alter a password. If using bcrypt, its common
72-byte input limitation matters; define a user-visible policy and do not silently
truncate, because different inputs could otherwise be treated as the same password.

For new systems, use a library and document its exact accepted input behavior. Normalize
Unicode only if the product has a deliberate, consistent policy; never change behavior
without a migration plan.

---

## 6. Algorithm Selection Checklist

1. Prefer Argon2id when a well-maintained implementation is supported in your environment.
2. Use scrypt when a memory-hard KDF is desired and Argon2id is not practical.
3. Use bcrypt for compatibility or established systems, with its input-length caveat.
4. Use PBKDF2 where a standards or FIPS constraint requires it.
5. Store algorithm and parameters with every verifier.
6. Use library verification APIs; never compare custom-derived password hashes casually.

---

## 7. Common Mistakes

| Mistake | Risk | Better approach |
|---------|------|-----------------|
| Choose parameters from an old blog and never revisit | Hardware makes them weak or latency becomes excessive | Benchmark and periodically retune |
| Max out cost without load testing | Login traffic can exhaust CPU or memory | Test concurrency and service capacity |
| Use a fast hash as a KDF | Offline guessing remains cheap | Use Argon2id, scrypt, bcrypt, or PBKDF2 |
| Implement your own KDF loop | Easy to make a subtle cryptographic error | Use maintained libraries |
| Ignore bcrypt's 72-byte limit | Silent truncation/collision of long inputs | Set and enforce a deliberate policy |

---

## 8. Exercises

1. Compare algorithms by memory hardness, compatibility, and operational requirements.
2. Benchmark a library hash/verify operation on your own machine and record the
   algorithm parameters and time. Do not treat one machine's result as universal.
3. Estimate the service impact of 50 simultaneous logins if each verification takes
   100 ms and uses 19 MiB.
4. Choose a KDF for a hypothetical FIPS-constrained application and explain the trade-off.

---

## 9. Quick Quiz

1. Which listed KDF is designed to be memory-hard and is a strong modern default?
2. Why should cost settings be load-tested?
3. Does raising a bcrypt cost factor by one make it roughly twice as costly?
4. Which algorithm may be selected when FIPS requirements constrain choices?

<details><summary>Answers</summary>

1. Argon2id.
2. To balance offline-guess cost against login latency and resource exhaustion.
3. Yes, approximately.
4. PBKDF2, using current approved guidance and a maintained implementation.
</details>

---

## 10. Summary

- Password KDFs deliberately consume CPU and, for memory-hard designs, RAM.
- Argon2id is a strong modern choice; scrypt, bcrypt, and PBKDF2 have contexts and
  trade-offs.
- Benchmarks, concurrency, current guidance, and migration ability all matter.

### Next lesson

➡️ **07 — Password Hashing in Node.js**
Use `crypto`, bcrypt, and Argon2id without writing custom cryptographic primitives.
