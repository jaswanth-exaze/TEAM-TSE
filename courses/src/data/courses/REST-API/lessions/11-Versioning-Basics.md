# 11. Versioning Basics

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Learn why APIs need versioning and the most common practical approaches.

---

## Table of Contents

1. Why Versioning is Necessary
2. What Happens Without Versioning
3. Goals of a Good Versioning Strategy
4. Common Versioning Approaches
5. Approach 1: URI Path Versioning
6. Approach 2: Query Parameter Versioning
7. Approach 3: Custom Header Versioning
8. Approach 4: Accept Header / Media Type Versioning
9. Comparison Table of Approaches
10. Which Approach Should You Choose?
11. Semantic Versioning and APIs
12. Deprecation Strategy
13. Practical Recommendations for Beginners
14. Real-World Examples
15. Common Mistakes
16. Key Takeaways
17. Self-Check Questions
18. Summary
19. What’s Next

---

## 1. Why Versioning is Necessary

APIs evolve over time. New features are added, bugs are fixed, and sometimes existing behavior must change.

If you change an API in a backward-incompatible way while existing clients are still using it, those clients will break.

**Versioning** is the practice of allowing multiple versions of an API to exist at the same time so that:

- Old clients continue to work
- New clients can use new features
- You can eventually retire old versions in a controlled way

---

## 2. What Happens Without Versioning

Imagine this scenario:

1. You release an API that returns user data like this:
   ```json
   { "name": "Alice", "age": 30 }
   ```

2. Hundreds of mobile apps and partner systems integrate with it.

3. Later you decide to change the field to:
   ```json
   { "fullName": "Alice", "ageInYears": 30 }
   ```

4. All existing clients break because they expect the old field names.

Without versioning, every breaking change becomes a painful, coordinated migration for everyone.

---

## 3. Goals of a Good Versioning Strategy

A good versioning approach should:

- Make the version explicit and discoverable
- Allow old and new versions to coexist
- Be easy for clients to use
- Be easy for the server to implement and route
- Support a clear deprecation policy
- Minimize surprise for developers

---

## 4. Common Versioning Approaches

There are four widely used strategies:

1. URI Path Versioning
2. Query Parameter Versioning
3. Custom Request Header Versioning
4. Accept Header (Media Type) Versioning

We will examine each one.

---

## 5. Approach 1: URI Path Versioning

The version appears as part of the URL path.

```
https://api.example.com/v1/users
https://api.example.com/v2/users
```

### Pros
- Extremely visible and explicit
- Easy to route on the server
- Easy for clients to understand
- Works well with caching and CDNs
- Most popular approach in the industry

### Cons
- Pollutes the URI with version information
- Strict purists argue that the URI should identify the resource, not the representation version

### Example
```
GET /v1/products/42
GET /v2/products/42
```

---

## 6. Approach 2: Query Parameter Versioning

The version is passed as a query parameter.

```
https://api.example.com/users?version=1
https://api.example.com/users?version=2
```

### Pros
- Keeps the base path clean
- Easy to implement
- Optional — clients can omit it and get a default version

### Cons
- Less visible than path versioning
- Can be ignored or forgotten by clients
- Caching can become more complicated
- Feels less “RESTful” to some designers

### Example
```
GET /products/42?version=2
```

---

## 7. Approach 3: Custom Header Versioning

The version is sent in a custom HTTP header.

```
GET /users/42 HTTP/1.1
X-API-Version: 2
```

or

```
API-Version: 2026-10-01
```

### Pros
- Keeps URIs clean
- Does not affect caching of the URL itself as much
- Can support date-based or complex version schemes

### Cons
- Less discoverable (clients must read documentation)
- Harder to test quickly in a browser
- Some proxies or intermediaries may strip custom headers
- More work for client developers

---

## 8. Approach 4: Accept Header / Media Type Versioning

The version is embedded in the media type using content negotiation.

```
Accept: application/vnd.example.v1+json
Accept: application/vnd.example.v2+json
```

### Pros
- Purest from a REST theoretical perspective
- Combines content negotiation with versioning
- Keeps URIs completely clean

### Cons
- Most complex for both clients and servers
- Harder for beginners to understand and use
- Tooling support is weaker
- Rarely used in mainstream public APIs

---

## 9. Comparison Table of Approaches

| Approach              | Visibility | Ease of Use | Caching Friendliness | Popularity | Theoretical Purity |
|-----------------------|------------|-------------|----------------------|------------|--------------------|
| URI Path (`/v1/`)     | Excellent  | Excellent   | Excellent            | Very High  | Medium             |
| Query Parameter       | Good       | Good        | Medium               | Medium     | Medium             |
| Custom Header         | Low        | Medium      | Good                 | Medium     | High               |
| Accept Header         | Low        | Low         | Good                 | Low        | Highest            |

---

## 10. Which Approach Should You Choose?

**For most beginners and most real-world projects:**

> Prefer **URI Path Versioning** (`/v1/`, `/v2/`).

Reasons:

- It is the most widely understood
- It is easy to document and teach
- It works reliably with all tools
- Many major companies use it (GitHub, Stripe, Twitter, Google, etc.)

You can always add more sophisticated strategies later if needed.

---

## 11. Semantic Versioning and APIs

Semantic Versioning (SemVer) uses the pattern:

```
MAJOR.MINOR.PATCH
```

- **MAJOR** – Breaking changes
- **MINOR** – New features, backward compatible
- **PATCH** – Bug fixes, backward compatible

In HTTP APIs we usually only expose the **MAJOR** version in the URL or header:

```
/v1/   → major version 1
/v2/   → major version 2
```

Minor and patch changes stay within the same major version and should not break clients.

---

## 12. Deprecation Strategy

Versioning is incomplete without a deprecation policy.

Recommended practices:

1. Announce deprecation well in advance (6–12 months or more).
2. Document the sunset date clearly.
3. Return a warning header while the old version is still supported:
   ```
   Deprecation: true
   Sunset: Sat, 01 Jan 2028 00:00:00 GMT
   Link: <https://api.example.com/v2/users>; rel="successor-version"
   ```
4. Monitor usage of the old version.
5. Only remove the old version when usage is negligible or after the announced date.

---

## 13. Practical Recommendations for Beginners

1. Start with `/v1/` in the path from day one.
2. Treat the first public release as v1 even if you think it is temporary.
3. Avoid breaking changes inside a major version.
4. When you must make a breaking change, release `/v2/` and keep `/v1/` running.
5. Document the versioning policy clearly in your API docs.
6. Never change the meaning of an existing field without a new version.

---

## 14. Real-World Examples

| Company / API     | Versioning Style                  | Example                                      |
|-------------------|-----------------------------------|----------------------------------------------|
| GitHub            | URI Path                          | `https://api.github.com/` (currently v3 via Accept) + path for some |
| Stripe            | URI Path + date-based             | `/v1/charges`                                |
| Twitter / X       | URI Path                          | `/2/tweets`                                  |
| Google APIs       | URI Path                          | `/v1/`, `/v2/`                               |
| Microsoft Graph   | URI Path                          | `/v1.0/`, `/beta/`                           |
| Shopify           | Custom Header + path              | `X-Shopify-API-Version`                      |

Most successful public APIs use path-based major versioning.

---

## 15. Common Mistakes

| Mistake                                      | Why It Hurts                                 | Better Practice                              |
|----------------------------------------------|----------------------------------------------|----------------------------------------------|
| No versioning at all                         | Breaking changes destroy clients             | Introduce versioning from the start          |
| Changing fields inside the same version      | Silent breakage                              | Only additive changes inside a major version |
| Removing a version without notice            | Angry developers and broken apps             | Proper deprecation policy                    |
| Using too many versions simultaneously       | Maintenance burden                           | Support only 1–2 major versions at a time    |
| Hiding the version completely                | Clients cannot control compatibility         | Make version explicit                        |

---

## 16. Key Takeaways

- Versioning protects existing clients when the API must change.
- URI path versioning (`/v1/`, `/v2/`) is the most practical and popular approach.
- Only major (breaking) changes should create a new version.
- Always plan a deprecation and sunset strategy.
- Consistency and clear communication are more important than theoretical purity.

---

## 17. Self-Check Questions

1. Why do APIs need versioning?
2. Name the four common versioning approaches.
3. Which approach is most widely used in public APIs?
4. What is the main advantage of URI path versioning?
5. What does a major version number represent in API versioning?
6. Why should you avoid making breaking changes inside the same major version?
7. What is a deprecation header and why is it useful?
8. Give one disadvantage of using only custom headers for versioning.
9. Should you start with versioning on day one? Why?
10. How do major companies like Stripe and GitHub handle versioning?

---

## 18. Summary

Versioning is the practical mechanism that allows an API to evolve without abandoning its existing users.  

For almost all beginner and intermediate projects, simple URI path versioning combined with a clear deprecation policy is the best choice.

---

## 19. What’s Next

Next we will study **Error Handling Best Practices** — how to return clear, consistent, and useful error information to clients.

---

**End of Topic 11 – Versioning Basics**

*Focus: Practical strategies for evolving REST APIs safely over time.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
