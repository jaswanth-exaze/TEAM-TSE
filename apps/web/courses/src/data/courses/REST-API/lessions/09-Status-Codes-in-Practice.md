# 09. Status Codes in Practice

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Learn when and how to use the most important HTTP status codes correctly.

---

## Table of Contents

1. Why Status Codes Matter
2. The Five Classes of Status Codes
3. 2xx – Success Codes
4. 3xx – Redirection Codes (Brief)
5. 4xx – Client Error Codes
6. 5xx – Server Error Codes
7. Most Important Codes for REST APIs
8. Decision Guide – Which Code Should I Return?
9. Status Codes with CRUD Operations
10. Error Response Body Best Practices
11. Common Mistakes with Status Codes
12. Real-World Examples
13. Visual Quick Reference
14. Key Takeaways
15. Self-Check Questions
16. Summary
17. What’s Next

---

## 1. Why Status Codes Matter

The status code is the **first thing** a client looks at after receiving a response.

A well-chosen status code:

- Communicates success or failure instantly
- Helps clients decide what to do next
- Makes debugging easier
- Allows intermediary systems (caches, gateways, monitoring) to behave correctly
- Improves the overall quality of the API

Using the wrong status code is one of the most common API design mistakes.

---

## 2. The Five Classes of Status Codes

| Range | Class               | Meaning                                      | Who is responsible? |
|-------|---------------------|----------------------------------------------|---------------------|
| 1xx   | Informational       | Request received, continuing process         | —                   |
| 2xx   | Success             | Request successfully received and processed  | —                   |
| 3xx   | Redirection         | Further action needed to complete request    | Client              |
| 4xx   | Client Error        | Request contains bad syntax or cannot be fulfilled | Client         |
| 5xx   | Server Error        | Server failed to fulfill a valid request     | Server              |

For REST APIs we mostly care about **2xx, 4xx, and 5xx**.

---

## 3. 2xx – Success Codes

| Code | Name                  | When to Use                                      | Body?     |
|------|-----------------------|--------------------------------------------------|-----------|
| 200  | OK                    | General success (GET, PUT, PATCH, DELETE)        | Usually   |
| 201  | Created               | New resource successfully created (POST)         | Usually   |
| 202  | Accepted              | Request accepted for asynchronous processing     | Optional  |
| 204  | No Content            | Success but no response body (common for DELETE) | No        |

### Recommendations

- Prefer **201** for successful creation.
- Prefer **204** when there is nothing useful to return (especially DELETE and some PUTs).
- Use **200** when you return the updated or retrieved resource.

---

## 4. 3xx – Redirection Codes (Brief)

These are less common in pure data APIs but still appear:

| Code | Name                  | Typical Use                                      |
|------|-----------------------|--------------------------------------------------|
| 301  | Moved Permanently     | Resource has a new permanent URI                 |
| 302  | Found (Temporary)     | Temporary redirect                               |
| 304  | Not Modified          | Cached version is still valid (conditional GET)  |
| 307  | Temporary Redirect    | Method and body must not change                  |
| 308  | Permanent Redirect    | Method and body must not change                  |

For most beginner REST work, **304 Not Modified** is the most relevant (caching).

---

## 5. 4xx – Client Error Codes

These indicate that the **client** did something wrong.

| Code | Name                      | When to Use                                          |
|------|---------------------------|------------------------------------------------------|
| 400  | Bad Request               | Malformed request, invalid JSON, missing required fields |
| 401  | Unauthorized              | Authentication is required or failed                 |
| 403  | Forbidden                 | Authenticated but not allowed to perform the action  |
| 404  | Not Found                 | Resource does not exist                              |
| 405  | Method Not Allowed        | HTTP method not supported for this resource          |
| 406  | Not Acceptable            | Server cannot produce a response matching Accept header |
| 409  | Conflict                  | Request conflicts with current state of the resource |
| 410  | Gone                      | Resource existed but has been permanently removed    |
| 415  | Unsupported Media Type    | Content-Type is not supported                        |
| 422  | Unprocessable Entity      | Validation errors (well-formed but semantically invalid) |
| 429  | Too Many Requests         | Rate limit exceeded                                  |

### 401 vs 403 – Important Distinction

- **401 Unauthorized** → “I don’t know who you are” (or credentials are invalid)
- **403 Forbidden** → “I know who you are, but you are not allowed to do this”

---

## 6. 5xx – Server Error Codes

These indicate that the **server** failed.

| Code | Name                      | When to Use                                          |
|------|---------------------------|------------------------------------------------------|
| 500  | Internal Server Error     | Unexpected error (catch-all)                         |
| 501  | Not Implemented           | Method or feature not supported                      |
| 502  | Bad Gateway               | Invalid response from upstream server               |
| 503  | Service Unavailable       | Server temporarily overloaded or down for maintenance |
| 504  | Gateway Timeout           | Upstream server did not respond in time              |

**Best Practice:**  
Avoid returning 500 for expected business errors.  
Use appropriate 4xx codes instead.

---

## 7. Most Important Codes for REST APIs

If you remember only these, you will be in good shape:

**Success**
- 200 OK
- 201 Created
- 204 No Content

**Client Errors**
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Unprocessable Entity
- 429 Too Many Requests

**Server Errors**
- 500 Internal Server Error
- 503 Service Unavailable

---

## 8. Decision Guide – Which Code Should I Return?

```
Is the request successful?
├── Yes
│   ├── Did I create a new resource? → 201
│   ├── Do I have a body to return? → 200
│   └── No body needed → 204
│
└── No
    ├── Is it the client’s fault?
    │   ├── Authentication problem → 401
    │   ├── Permission problem → 403
    │   ├── Resource does not exist → 404
    │   ├── Method not allowed → 405
    │   ├── Validation / business rule error → 400 or 422
    │   ├── Conflict with current state → 409
    │   └── Rate limited → 429
    │
    └── Is it the server’s fault?
        ├── Unexpected error → 500
        └── Temporarily unavailable → 503
```

---

## 9. Status Codes with CRUD Operations

| Operation              | Success Code(s)     | Common Error Codes              |
|------------------------|---------------------|---------------------------------|
| GET collection         | 200                 | 400, 401, 403                   |
| GET one                | 200                 | 401, 403, 404                   |
| POST (create)          | 201                 | 400, 401, 403, 409, 422         |
| PUT (replace)          | 200 or 204          | 400, 401, 403, 404, 409, 422    |
| PATCH (partial)        | 200 or 204          | 400, 401, 403, 404, 422         |
| DELETE                 | 200 or 204          | 401, 403, 404                   |

---

## 10. Error Response Body Best Practices

Status codes alone are not enough.  
Always return a useful error body for 4xx and 5xx responses.

### Recommended Structure

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields failed validation",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      },
      {
        "field": "age",
        "message": "Must be a positive integer"
      }
    ],
    "timestamp": "2026-10-06T14:00:00Z",
    "path": "/users"
  }
}
```

### Guidelines

- Keep the structure consistent across the whole API
- Use machine-readable error codes
- Provide human-readable messages
- Include field-level details for validation errors
- Never expose internal stack traces in production

---

## 11. Common Mistakes with Status Codes

| Mistake                              | Why It Is Bad                              | Better Practice                          |
|--------------------------------------|--------------------------------------------|------------------------------------------|
| Always returning 200                 | Clients cannot detect errors easily        | Use proper 4xx / 5xx                     |
| Using 200 for creation               | Hides that a new resource was created      | Use 201 + Location                       |
| Using 500 for validation errors      | Blames the server for client mistakes      | Use 400 or 422                           |
| Confusing 401 and 403                | Wrong security handling on client side     | Learn the distinction                    |
| Returning 404 for permission issues  | Information leakage / wrong semantics      | Use 403                                  |
| Empty error bodies                   | Clients cannot understand what went wrong  | Always provide a structured error body   |

---

## 12. Real-World Examples

### Successful Creation
```
HTTP/1.1 201 Created
Location: /orders/98765
Content-Type: application/json

{
  "id": 98765,
  "status": "pending",
  "total": 1499.00
}
```

### Validation Error
```
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "already exists" }
    ]
  }
}
```

### Not Found
```
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with id 999 does not exist"
  }
}
```

---

## 13. Visual Quick Reference

```
2xx Success
├── 200 OK
├── 201 Created
└── 204 No Content

4xx Client Error
├── 400 Bad Request
├── 401 Unauthorized
├── 403 Forbidden
├── 404 Not Found
├── 409 Conflict
├── 422 Unprocessable Entity
└── 429 Too Many Requests

5xx Server Error
├── 500 Internal Server Error
└── 503 Service Unavailable
```

---

## 14. Key Takeaways

- Status codes are the primary way to communicate the outcome of a request.
- Use 2xx for success, 4xx for client mistakes, 5xx for server failures.
- Prefer precise codes (201, 204, 422, etc.) over generic ones.
- Always accompany error status codes with a clear, consistent error body.
- Correct status code usage makes APIs easier to consume and debug.

---

## 15. Self-Check Questions

1. What is the difference between 401 and 403?
2. When should you return 201 instead of 200?
3. When is 204 more appropriate than 200?
4. Which status code is best for validation errors?
5. Why should you avoid returning 500 for bad user input?
6. What does 429 mean and when is it used?
7. Give an example of a good error response body.
8. Which status code indicates that a resource no longer exists permanently?
9. What is the recommended success code for a successful DELETE?
10. How do status codes help intermediary systems (caches, gateways)?

---

## 16. Summary

Choosing the right status code is one of the highest-leverage skills in API design.  

A consistent and thoughtful use of status codes dramatically improves the developer experience of your API and reduces the number of support questions you receive.

---

## 17. What’s Next

Next we will look at **Content Negotiation & JSON** — how clients and servers agree on data formats and why JSON became the default for REST APIs.

---

**End of Topic 09 – Status Codes in Practice**

*Focus: Practical, correct usage of HTTP status codes in real REST APIs.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
