# 14. Quick Reference Tables

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Provide compact, printable reference material for rapid lookup.

---

## Table of Contents

1. HTTP Methods Summary
2. CRUD ↔ HTTP Mapping
3. Safety & Idempotency
4. Most Important Status Codes
5. Status Code Decision Guide
6. Common Request Headers
7. Common Response Headers
8. Resource Naming Conventions
9. Versioning Approaches Comparison
10. Error Response Template
11. Content Types
12. Query Parameter Patterns
13. Key REST Constraints
14. Client vs Server Responsibilities
15. Cheat Sheet – One Page Summary
16. Key Takeaways
17. How to Use This Reference
18. Summary

---

## 1. HTTP Methods Summary

| Method  | Purpose                     | Has Body? | Safe | Idempotent | Typical Success Codes |
|---------|-----------------------------|-----------|------|------------|-----------------------|
| GET     | Retrieve resource(s)        | No        | Yes  | Yes        | 200                   |
| POST    | Create resource / action    | Yes       | No   | No         | 201                   |
| PUT     | Replace resource            | Yes       | No   | Yes        | 200 / 204             |
| PATCH   | Partial update              | Yes       | No   | Depends    | 200 / 204             |
| DELETE  | Remove resource             | Optional  | No   | Yes        | 200 / 204             |
| HEAD    | Same as GET, headers only   | No        | Yes  | Yes        | 200                   |
| OPTIONS | Describe communication options | No     | Yes  | Yes        | 200                   |

---

## 2. CRUD ↔ HTTP Mapping

| CRUD     | HTTP Method | URI Pattern              | Success Code     |
|----------|-------------|--------------------------|------------------|
| Create   | POST        | `/resources`             | 201 Created      |
| Read one | GET         | `/resources/{id}`        | 200 OK           |
| Read many| GET         | `/resources`             | 200 OK           |
| Update (full) | PUT    | `/resources/{id}`        | 200 / 204        |
| Update (partial) | PATCH | `/resources/{id}`     | 200 / 204        |
| Delete   | DELETE      | `/resources/{id}`        | 200 / 204        |

---

## 3. Safety & Idempotency

| Method  | Safe? | Idempotent? | Notes                                      |
|---------|-------|-------------|--------------------------------------------|
| GET     | Yes   | Yes         | Always safe to retry and cache             |
| HEAD    | Yes   | Yes         | Same as GET                                |
| OPTIONS | Yes   | Yes         | Same as GET                                |
| PUT     | No    | Yes         | Safe to retry with same body               |
| DELETE  | No    | Yes         | Safe to retry                              |
| POST    | No    | No          | Needs idempotency key for safe retries     |
| PATCH   | No    | Depends     | Depends on the patch semantics             |

---

## 4. Most Important Status Codes

### Success (2xx)
| Code | Name         | Typical Use                          |
|------|--------------|--------------------------------------|
| 200  | OK           | Successful GET, PUT, PATCH           |
| 201  | Created      | Successful POST that created a resource |
| 204  | No Content   | Successful DELETE or action with no body |

### Client Errors (4xx)
| Code | Name                   | Typical Use                              |
|------|------------------------|------------------------------------------|
| 400  | Bad Request            | Malformed request                        |
| 401  | Unauthorized           | Authentication required or failed        |
| 403  | Forbidden              | Authenticated but not permitted          |
| 404  | Not Found              | Resource does not exist                  |
| 405  | Method Not Allowed     | HTTP method not supported                |
| 409  | Conflict               | State conflict                            |
| 422  | Unprocessable Entity   | Validation / semantic errors             |
| 429  | Too Many Requests      | Rate limit exceeded                      |

### Server Errors (5xx)
| Code | Name                     | Typical Use                          |
|------|--------------------------|--------------------------------------|
| 500  | Internal Server Error    | Unexpected failure                   |
| 503  | Service Unavailable      | Temporary overload or maintenance    |

---

## 5. Status Code Decision Guide

```
Success?
├── Created new resource? → 201
├── Body to return? → 200
└── No body → 204

Client error?
├── Auth missing/invalid → 401
├── Permission denied → 403
├── Not found → 404
├── Validation error → 422 (or 400)
├── Conflict → 409
└── Rate limited → 429

Server error?
├── Unexpected → 500
└── Temporary → 503
```

---

## 6. Common Request Headers

| Header            | Purpose                                      | Example                              |
|-------------------|----------------------------------------------|--------------------------------------|
| Accept            | Preferred response format                    | application/json                     |
| Content-Type      | Format of request body                       | application/json                     |
| Authorization     | Credentials / token                          | Bearer eyJhbGciOi...                 |
| User-Agent        | Client identification                        | MyApp/1.0                            |
| Idempotency-Key   | Safe retries for non-idempotent operations   | 8f3e2a1b-9c4d-4e5f-a6b7-...         |
| If-None-Match     | Conditional request (ETag)                   | "abc123"                             |
| Cache-Control     | Caching preferences                          | no-cache                             |

---

## 7. Common Response Headers

| Header            | Purpose                                      | Example                              |
|-------------------|----------------------------------------------|--------------------------------------|
| Content-Type      | Format of response body                      | application/json                     |
| Location          | URI of newly created resource                | /users/43                            |
| ETag              | Version identifier                           | "user-43-v2"                         |
| Cache-Control     | Caching instructions                         | max-age=3600                         |
| Retry-After       | Seconds to wait before retrying              | 60                                   |
| Deprecation       | Indicates the endpoint is deprecated         | true                                 |
| Sunset            | Date when the endpoint will be removed       | Sat, 01 Jan 2028 00:00:00 GMT        |

---

## 8. Resource Naming Conventions

| Rule                        | Good                        | Avoid                          |
|-----------------------------|-----------------------------|--------------------------------|
| Use plural nouns            | /users, /products           | /user, /getProducts            |
| Lowercase                   | /order-items                | /OrderItems                    |
| Consistent case style       | kebab-case or snake_case    | Mixing styles                  |
| No verbs                    | /orders                     | /createOrder                   |
| No file extensions          | /users                      | /users.json                    |
| Limit nesting               | /users/42/orders            | /users/42/orders/1/items/5/... |

---

## 9. Versioning Approaches Comparison

| Approach          | Example                              | Pros                     | Cons                        | Popularity |
|-------------------|--------------------------------------|--------------------------|-----------------------------|------------|
| URI Path          | /v1/users                            | Visible, simple, cacheable | URI pollution              | Highest    |
| Query Parameter   | /users?version=1                     | Clean path               | Easy to ignore             | Medium     |
| Custom Header     | X-API-Version: 1                     | Clean URI                | Less discoverable          | Medium     |
| Accept Header     | Accept: application/vnd.api.v1+json  | Pure REST                | Complex                    | Low        |

**Recommendation for most projects:** URI Path Versioning.

---

## 10. Error Response Template

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable summary",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific problem"
      }
    ],
    "timestamp": "2026-10-06T16:00:00Z",
    "path": "/v1/resource",
    "requestId": "req_abc123"
  }
}
```

---

## 11. Content Types

| Media Type                        | Use Case                          |
|-----------------------------------|-----------------------------------|
| application/json                  | Default for modern REST APIs      |
| application/xml                   | Legacy / enterprise systems       |
| multipart/form-data               | File uploads                      |
| application/x-www-form-urlencoded | Simple form submissions           |
| text/plain                        | Simple text responses             |
| application/pdf                   | Document download                 |

---

## 12. Query Parameter Patterns

| Purpose          | Common Parameters              | Example                              |
|------------------|--------------------------------|--------------------------------------|
| Pagination       | page, limit / size, offset     | ?page=2&limit=20                     |
| Sorting          | sort, order                    | ?sort=createdAt&order=desc           |
| Filtering        | field names                    | ?status=active&role=admin            |
| Search           | q, search                      | ?q=wireless+headphones               |
| Sparse fields    | fields                         | ?fields=id,name,email                |

---

## 13. Key REST Constraints

| # | Constraint         | Core Idea                                      |
|---|--------------------|------------------------------------------------|
| 1 | Client-Server      | Separation of concerns                         |
| 2 | Stateless          | Each request is self-contained                 |
| 3 | Cacheable          | Responses declare cacheability                 |
| 4 | Uniform Interface  | Consistent interaction style                   |
| 5 | Layered System     | Intermediaries are allowed                     |
| 6 | Code on Demand     | Optional executable code transfer              |

---

## 14. Client vs Server Responsibilities

| Responsibility                  | Client                          | Server                              |
|---------------------------------|---------------------------------|-------------------------------------|
| User interface                  | Yes                             | No                                  |
| Business logic & data storage   | No                              | Yes                                 |
| Authentication credentials      | Sends with every request        | Validates                           |
| Caching decisions               | Can cache                       | Declares cacheability               |
| Error interpretation            | Reacts to status + body         | Provides clear status + body        |
| Version selection               | Chooses version                 | Supports multiple versions          |

---

## 15. Cheat Sheet – One Page Summary

```
RESOURCES          → Nouns in URLs (/users, /products/42)
METHODS            → GET POST PUT PATCH DELETE
SUCCESS            → 200 201 204
CLIENT ERRORS      → 400 401 403 404 409 422 429
SERVER ERRORS      → 500 503
JSON               → Default format
VERSIONING         → /v1/ preferred
ERRORS             → Consistent structured body + requestId
IDEMPOTENCY        → GET PUT DELETE safe to retry
SAFETY             → Only GET HEAD OPTIONS are safe
```

---

## 16. Key Takeaways

- Keep these tables handy while designing or consuming APIs.
- Consistency across methods, status codes, naming, and error shapes is more important than any single clever design.
- When in doubt, prefer the most common industry practice (path versioning, JSON, plural nouns, precise status codes).

---

## 17. How to Use This Reference

- Print or keep open while coding
- Use during code reviews
- Share with teammates as a common language
- Revisit when designing a new endpoint

---

## 18. Summary

This quick-reference document consolidates the most actionable information from the entire REST API Fundamentals course into compact tables.  

Master these tables and you will have a solid working knowledge of REST API fundamentals.

---

**End of Topic 14 – Quick Reference Tables**

*Focus: Compact, high-density reference material for daily use.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
