# 12. Error Handling Best Practices

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Learn how to design clear, consistent, and helpful error responses.

---

## Table of Contents

1. Why Error Handling Matters
2. Principles of Good Error Responses
3. Choosing the Right Status Code
4. Designing a Consistent Error Body
5. Recommended Error Response Structure
6. Field-Level Validation Errors
7. Business Logic / Domain Errors
8. Authentication & Authorization Errors
9. Not Found vs Gone
10. Rate Limiting Errors
11. Unexpected Server Errors
12. What to Avoid in Error Responses
13. Internationalization of Error Messages
14. Logging vs Client-Facing Errors
15. Practical Examples
16. Key Takeaways
17. Self-Check Questions
18. Summary
19. What’s Next

---

## 1. Why Error Handling Matters

When things go wrong, the quality of your error responses determines:

- How quickly client developers can fix their code
- How much support load your team receives
- How professional and trustworthy your API feels
- Whether automated clients can recover gracefully

A good error response is as important as a good success response.

---

## 2. Principles of Good Error Responses

1. **Use the correct HTTP status code**
2. **Be consistent** across the entire API
3. **Be specific** — tell the client exactly what went wrong
4. **Be actionable** — help the client understand how to fix it
5. **Do not leak sensitive information**
6. **Support both humans and machines**
7. **Keep the structure stable** over time

---

## 3. Choosing the Right Status Code

Always start with the correct status code (see previous topic).  

Then enrich it with a well-structured body.

| Situation                        | Recommended Status |
|----------------------------------|--------------------|
| Malformed JSON / missing fields  | 400 or 422         |
| Validation failed                | 422                |
| Authentication required/failed   | 401                |
| Permission denied                | 403                |
| Resource does not exist          | 404                |
| Conflict (duplicate, state)      | 409                |
| Rate limit exceeded              | 429                |
| Unexpected server failure        | 500                |
| Temporary overload               | 503                |

---

## 4. Designing a Consistent Error Body

Every error response should follow the **same structure**.  
Clients can then write one error-handling path for the whole API.

Avoid returning:

- Plain text messages
- Different shapes for different errors
- HTML error pages
- Empty bodies

---

## 5. Recommended Error Response Structure

A widely used and practical structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields failed validation.",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "rejectedValue": "not-an-email"
      },
      {
        "field": "age",
        "message": "Must be a positive integer",
        "rejectedValue": -5
      }
    ],
    "timestamp": "2026-10-06T15:30:00Z",
    "path": "/v1/users",
    "requestId": "req_8f3e2a1b9c4d"
  }
}
```

### Field Explanations

| Field        | Purpose                                              | Required? |
|--------------|------------------------------------------------------|-----------|
| code         | Machine-readable error code                          | Yes       |
| message      | Human-readable summary                               | Yes       |
| details      | List of specific problems (especially validation)    | Recommended |
| timestamp    | When the error occurred                              | Optional  |
| path         | The request path that failed                         | Optional  |
| requestId    | Correlation ID for support and logging               | Highly recommended |

---

## 6. Field-Level Validation Errors

Validation errors are the most common client errors.  
Always return field-level details when possible.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "password",
        "message": "Must be at least 8 characters long"
      },
      {
        "field": "confirmPassword",
        "message": "Must match password"
      }
    ]
  }
}
```

This allows the client UI to highlight the exact fields that need correction.

---

## 7. Business Logic / Domain Errors

These are errors that pass basic validation but violate business rules.

Examples:

- Insufficient balance
- Product out of stock
- User already registered
- Order cannot be cancelled because it has already shipped

Use status **409 Conflict** or **422 Unprocessable Entity** and a clear code:

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Account balance is too low to complete this transfer.",
    "details": {
      "availableBalance": 150.00,
      "requestedAmount": 200.00
    }
  }
}
```

---

## 8. Authentication & Authorization Errors

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required to access this resource."
  }
}
```

Often accompanied by a `WWW-Authenticate` header.

### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to delete this resource."
  }
}
```

Never reveal whether a resource exists when the user is not allowed to see it (security through obscurity is sometimes appropriate here).

---

## 9. Not Found vs Gone

- **404 Not Found** — The resource does not exist (or never existed, or you are not allowed to know it exists).
- **410 Gone** — The resource existed in the past but has been permanently removed and will not return.

Most APIs use 404 for both cases.  
Use 410 only when you want to explicitly signal permanent removal.

---

## 10. Rate Limiting Errors

When a client exceeds the allowed request rate:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded the rate limit. Please try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

Always include a `Retry-After` header when possible.

---

## 11. Unexpected Server Errors

For true unexpected failures:

```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "requestId": "req_8f3e2a1b9c4d"
  }
}
```

**Never** include:

- Stack traces
- Database error messages
- Internal file paths
- Secrets

These belong only in server logs.

---

## 12. What to Avoid in Error Responses

| Bad Practice                         | Why It Is Harmful                              |
|--------------------------------------|------------------------------------------------|
| Returning HTML error pages           | Breaks programmatic clients                    |
| Inconsistent error shapes            | Forces complex client error handling           |
| Generic messages only (“Error occurred”) | Not actionable                              |
| Exposing stack traces                | Security risk and information leakage          |
| Using 200 OK for errors              | Forces clients to parse body to detect failure |
| Different formats for different errors | Increases client complexity                  |

---

## 13. Internationalization of Error Messages

If your API serves users in multiple languages:

- Keep the machine-readable `code` stable and language-independent
- Allow the `message` to be localized based on an `Accept-Language` header
- Or return message keys that the client can translate

Many APIs keep messages in English only for simplicity, especially in the early stages.

---

## 14. Logging vs Client-Facing Errors

| Aspect                | Client-Facing Response              | Server Logs                              |
|-----------------------|-------------------------------------|------------------------------------------|
| Audience              | External developers / applications  | Your operations and support team         |
| Detail level          | Helpful but safe                    | Full detail including stack traces       |
| Sensitive data        | Never                               | Allowed (with care)                      |
| Request ID            | Include                             | Include and index                        |
| Purpose               | Help the client fix the problem     | Help you diagnose and fix the system     |

Always correlate the two with a `requestId`.

---

## 15. Practical Examples

### Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      { "field": "email", "message": "is required" },
      { "field": "password", "message": "is too short" }
    ],
    "requestId": "req_abc123"
  }
}
```

### Resource Not Found
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Product with id 999 was not found",
    "requestId": "req_def456"
  }
}
```

### Conflict
```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "A user with this email address already exists",
    "requestId": "req_ghi789"
  }
}
```

---

## 16. Key Takeaways

- Always return the correct HTTP status code first.
- Use a single, consistent error body structure across the whole API.
- Provide both machine-readable codes and human-readable messages.
- Include field-level details for validation errors.
- Never expose internal implementation details.
- Use a request ID so support teams can correlate client reports with server logs.
- Good error handling dramatically improves the developer experience of your API.

---

## 17. Self-Check Questions

1. Why is consistency in error responses important?
2. What are the two most important parts of an error body?
3. When should you use 422 instead of 400?
4. What is the difference between 401 and 403 in error handling?
5. Why should you include a requestId in error responses?
6. What information should never appear in a client-facing error response?
7. How should rate-limit errors be communicated?
8. Give an example of a good validation error response.
9. Why is returning HTML for API errors a bad idea?
10. How do you balance helpfulness with security in error messages?

---

## 18. Summary

Error handling is where many APIs reveal their maturity.  

A thoughtful, consistent, and secure error strategy turns frustrating failures into clear guidance for client developers and reduces the burden on your support team.

---

## 19. What’s Next

Next we will cover **Common Pitfalls & Best Practices** — a collection of practical do’s and don’ts that will help you avoid the most frequent mistakes when designing or consuming REST APIs.

---

**End of Topic 12 – Error Handling Best Practices**

*Focus: Designing clear, consistent, secure, and actionable error responses.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
