# 08. Idempotency & Safety

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Understand two critical properties of HTTP methods and why they matter for reliable APIs.

---

## Table of Contents

1. Why These Properties Matter
2. What is a Safe Method?
3. What is an Idempotent Method?
4. Safety vs Idempotency – Clear Comparison
5. Method-by-Method Analysis
6. Why Idempotency is Essential for Reliability
7. Real-World Failure Scenarios
8. How APIs Can Support Idempotency
9. Idempotency Keys (Practical Pattern)
10. Safety and Caching
11. Common Misunderstandings
12. Visual Summary Tables
13. Practical Guidelines for API Designers
14. Key Takeaways
15. Self-Check Questions
16. Summary
17. What’s Next

---

## 1. Why These Properties Matter

When a client sends a request, many things can go wrong:

- Network timeout
- Connection dropped
- Server temporarily unavailable
- Load balancer retry
- Client-side retry logic

If the client retries the request, the outcome should be predictable and safe.  

**Safety** and **Idempotency** give us that predictability.

---

## 2. What is a Safe Method?

A method is **safe** if it does not change the state of the server.

Calling a safe method any number of times should leave the server in the same state as if it had never been called.

### Safe Methods

| Method  | Safe? | Reason                                      |
|---------|-------|---------------------------------------------|
| GET     | Yes   | Only retrieves data                         |
| HEAD    | Yes   | Only retrieves headers                      |
| OPTIONS | Yes   | Only retrieves allowed methods / CORS info  |
| TRACE   | Yes   | Diagnostic only                             |

### Unsafe Methods

| Method  | Safe? | Reason                                      |
|---------|-------|---------------------------------------------|
| POST    | No    | Creates resources or triggers side effects  |
| PUT     | No    | Replaces resource state                     |
| PATCH   | No    | Modifies resource state                     |
| DELETE  | No    | Removes resources                           |

**Important:** Safety is about *server state*, not about whether the client sees the same response.

---

## 3. What is an Idempotent Method?

A method is **idempotent** if making the same request multiple times produces the **same effect** on the server as making it once.

In mathematical terms:

```
f(x) = f(f(x))
```

Applying the operation once or many times yields the same final state.

### Idempotent Methods

| Method  | Idempotent? | Explanation                                                |
|---------|-------------|------------------------------------------------------------|
| GET     | Yes         | Reading does not change state                              |
| PUT     | Yes         | Replacing with the same data multiple times is the same    |
| DELETE  | Yes         | Deleting a resource that is already gone stays gone        |
| HEAD    | Yes         | Same as GET                                                |
| OPTIONS | Yes         | Same as GET                                                |
| POST    | No          | Each call may create a new resource or trigger new effects |
| PATCH   | Usually No* | Depends on the specific patch operation                    |

*Simple field updates are often idempotent in practice, but the HTTP specification does not guarantee it.

---

## 4. Safety vs Idempotency – Clear Comparison

| Property     | Definition                                      | Focus                          | Example                          |
|--------------|-------------------------------------------------|--------------------------------|----------------------------------|
| Safe         | Does not change server state                    | Side effects                   | GET never modifies data          |
| Idempotent   | Multiple identical calls = same final state     | Final state after retries      | PUT / DELETE can be safely retried |

**Key Insight:**

- All safe methods are idempotent.
- Not all idempotent methods are safe (PUT and DELETE change state but are still idempotent).

---

## 5. Method-by-Method Analysis

### GET
- Safe: Yes
- Idempotent: Yes
- Retries are completely safe.

### POST
- Safe: No
- Idempotent: No
- Retrying may create duplicate resources (classic problem with payment or order creation).

### PUT
- Safe: No
- Idempotent: Yes
- Sending the same full representation multiple times ends with the same resource state.

### PATCH
- Safe: No
- Idempotent: Not guaranteed
- A patch that says “set status to active” is idempotent.  
  A patch that says “increment counter by 1” is not.

### DELETE
- Safe: No
- Idempotent: Yes
- Deleting an already-deleted resource should not cause an error that breaks the client (many APIs return 204 or 404 consistently).

---

## 6. Why Idempotency is Essential for Reliability

Consider this sequence:

1. Client sends `POST /orders`
2. Server creates the order and sends `201 Created`
3. Network fails before the client receives the response
4. Client assumes failure and retries the same `POST /orders`
5. Server creates a **second** order

Result: Duplicate order — bad for business.

If the operation had been idempotent, the second request would not have created a duplicate.

---

## 7. Real-World Failure Scenarios

| Scenario                              | Risk if Not Idempotent              | Mitigation                          |
|---------------------------------------|-------------------------------------|-------------------------------------|
| Payment processing                    | Double charge                       | Idempotency key                     |
| Order creation                        | Duplicate orders                    | Idempotency key or PUT-style design |
| User registration                     | Duplicate accounts                  | Unique constraints + careful design |
| File upload                           | Duplicate files                     | Content-hash or idempotency key     |
| Mobile app with poor connectivity     | Many retries                        | Design for idempotency              |

---

## 8. How APIs Can Support Idempotency

Even though POST is not idempotent by nature, APIs can make specific POST operations idempotent using extra mechanisms.

Common techniques:

1. **Idempotency Key** (most popular)
2. Unique business constraints (email uniqueness, order number uniqueness)
3. Using PUT instead of POST when the client can generate the ID
4. Returning the existing resource if a duplicate is detected

---

## 9. Idempotency Keys (Practical Pattern)

Many modern APIs (Stripe, PayPal, etc.) support an `Idempotency-Key` header.

### How It Works

1. Client generates a unique key (UUID) for the operation.
2. Client sends the key in a header:
   ```
   Idempotency-Key: 8f3e2a1b-9c4d-4e5f-a6b7-1234567890ab
   ```
3. Server stores the key + the result of the first request.
4. If the same key arrives again, the server returns the original result without re-executing the operation.

### Example

```
POST /payments HTTP/1.1
Idempotency-Key: 8f3e2a1b-9c4d-4e5f-a6b7-1234567890ab
Content-Type: application/json

{
  "amount": 1000,
  "currency": "INR"
}
```

If this request is retried with the same key, the server returns the same payment result and does not charge again.

---

## 10. Safety and Caching

Because safe methods do not change state, intermediaries (browsers, CDNs, proxies) can cache their responses more aggressively.

- GET responses are frequently cached.
- POST, PUT, PATCH, DELETE responses are normally not cached (or cached only with great care).

This is why marking methods correctly as safe is important for performance as well as correctness.

---

## 11. Common Misunderstandings

| Misunderstanding                                      | Reality                                                                 |
|-------------------------------------------------------|-------------------------------------------------------------------------|
| “Idempotent means the response is always identical”   | Idempotency is about server *state*, not about the response body        |
| “POST can never be made safe to retry”                | Idempotency keys solve this for many use cases                          |
| “DELETE returning 404 on second call breaks idempotency” | Some APIs choose 404; others keep returning 204. Both can be valid. |
| “PATCH is always idempotent”                          | Only if the patch operation itself is idempotent                        |
| “Safe methods cannot return different data”           | They can (e.g., current time, stock level) as long as they don’t change state |

---

## 12. Visual Summary Tables

### Master Table

| Method  | Safe | Idempotent | Typical Use                     | Retry Safe?          |
|---------|------|------------|---------------------------------|----------------------|
| GET     | Yes  | Yes        | Read                            | Always               |
| HEAD    | Yes  | Yes        | Metadata                        | Always               |
| OPTIONS | Yes  | Yes        | Discover                        | Always               |
| PUT     | No   | Yes        | Full replace                    | Yes                  |
| DELETE  | No   | Yes        | Remove                          | Yes                  |
| POST    | No   | No         | Create / Actions                | Only with extra care |
| PATCH   | No   | Depends    | Partial update                  | Depends on operation |

---

## 13. Practical Guidelines for API Designers

1. Prefer PUT or DELETE when the operation can be made idempotent by nature.
2. For non-idempotent POST operations that must be reliable (payments, orders), support Idempotency-Key.
3. Document clearly whether a particular endpoint is safe and/or idempotent.
4. Make DELETE and PUT truly idempotent in implementation.
5. Avoid side effects on GET (logging is okay; changing data is not).

---

## 14. Key Takeaways

- **Safe** = does not change server state.
- **Idempotent** = multiple identical requests have the same effect as one.
- All safe methods are idempotent; the reverse is not true.
- Idempotency is critical for reliable systems in the face of network failures and retries.
- POST is the main method that needs extra mechanisms (such as idempotency keys) when retries must be safe.
- Correct use of these properties leads to more robust and predictable APIs.

---

## 15. Self-Check Questions

1. Define a safe HTTP method in one sentence.
2. Define an idempotent HTTP method in one sentence.
3. Which methods are both safe and idempotent?
4. Why is POST not idempotent by default?
5. Give a real-world example where lack of idempotency causes a serious problem.
6. What is an Idempotency-Key and how does it help?
7. Is DELETE idempotent? Explain with an example.
8. Can a method be idempotent but not safe? Give an example.
9. Why can safe methods be cached more aggressively?
10. How would you make a “create payment” endpoint safe to retry?

---

## 16. Summary

Safety and idempotency are not academic concepts — they directly affect the reliability of systems that communicate over unreliable networks.  

Understanding and respecting these properties is a hallmark of professional API design and client development.

---

## 17. What’s Next

Next we will study **Status Codes in Practice** — when to use which status code and how to communicate success and failure clearly to clients.

---

**End of Topic 08 – Idempotency & Safety**

*Focus: Deep understanding of two fundamental properties that make HTTP methods reliable.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
