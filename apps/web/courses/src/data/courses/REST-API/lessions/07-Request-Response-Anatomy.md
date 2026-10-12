# 07. Request & Response Anatomy

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Become comfortable reading and writing complete HTTP requests and responses.

---

## Table of Contents

1. Why Anatomy Matters
2. Complete Structure of an HTTP Request
3. Complete Structure of an HTTP Response
4. Detailed Breakdown – Request Line
5. Detailed Breakdown – Headers
6. Detailed Breakdown – Body
7. Practical Examples – GET
8. Practical Examples – POST
9. Practical Examples – PUT
10. Practical Examples – PATCH
11. Practical Examples – DELETE
12. Content-Type and Accept Headers in Depth
13. Common Header Combinations
14. How Tools Show Request/Response
15. Visual Diagrams
16. Key Takeaways
17. Self-Check Questions
18. Summary
19. What’s Next

---

## 1. Why Anatomy Matters

When you work with REST APIs you constantly look at requests and responses.  

Understanding every part helps you:

- Debug problems faster
- Read API documentation correctly
- Write correct client code
- Design better APIs
- Use tools like Postman, curl, and browser DevTools effectively

---

## 2. Complete Structure of an HTTP Request

```
METHOD /path?query HTTP/1.1
Header-Name: Header-Value
Header-Name: Header-Value
...
(blank line)
{optional body}
```

### Three Main Parts

1. **Request Line** (start line)
2. **Headers** (zero or more)
3. **Body** (optional)

---

## 3. Complete Structure of an HTTP Response

```
HTTP/1.1 STATUS_CODE Reason-Phrase
Header-Name: Header-Value
Header-Name: Header-Value
...
(blank line)
{optional body}
```

### Three Main Parts

1. **Status Line**
2. **Headers**
3. **Body** (optional)

---

## 4. Detailed Breakdown – Request Line

```
GET /users/42?expand=orders HTTP/1.1
│   │         │             │
│   │         │             └─ HTTP version
│   │         └─ Query string (optional)
│   └─ Path (resource identifier)
└─ HTTP Method
```

### Components

| Part          | Example                  | Purpose                              |
|---------------|--------------------------|--------------------------------------|
| Method        | GET, POST, PUT…          | Action to perform                    |
| Path          | /users/42                | Identifies the resource              |
| Query String  | ?page=2&limit=20         | Filtering, pagination, options       |
| HTTP Version  | HTTP/1.1 or HTTP/2       | Protocol version                     |

---

## 5. Detailed Breakdown – Headers

Headers are key-value pairs separated by a colon.

```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
User-Agent: MyApp/1.0
```

### Important Request Headers

| Header            | Purpose                                      | Common Values                     |
|-------------------|----------------------------------------------|-----------------------------------|
| Host              | Target domain                                | api.example.com                   |
| Content-Type      | Format of the request body                   | application/json                  |
| Accept            | Preferred response format                    | application/json                  |
| Authorization     | Authentication credentials                   | Bearer <token>                    |
| Content-Length    | Size of body in bytes                        | 128                               |
| User-Agent        | Client identification                        | Mozilla/5.0, MyApp/1.0            |
| Cache-Control     | Caching preferences                          | no-cache                          |
| If-None-Match     | Conditional request (ETag)                   | "abc123"                          |

### Important Response Headers

| Header            | Purpose                                      | Common Values                     |
|-------------------|----------------------------------------------|-----------------------------------|
| Content-Type      | Format of the response body                  | application/json                  |
| Content-Length    | Size of body                                 | 256                               |
| Location          | URI of newly created resource                | /users/43                         |
| ETag              | Version identifier                           | "xyz789"                          |
| Cache-Control     | Caching instructions                         | max-age=3600                      |
| Date              | Response generation time                     | Tue, 06 Oct 2026 12:00:00 GMT     |
| WWW-Authenticate  | Authentication challenge                     | Bearer realm="api"                |

---

## 6. Detailed Breakdown – Body

The body is the payload of the message.

- Used with POST, PUT, PATCH (and sometimes DELETE)
- Most modern REST APIs use **JSON**
- Must match the `Content-Type` header

### JSON Body Example

```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "age": 28,
  "roles": ["user", "editor"]
}
```

### Empty Body

Many GET and DELETE requests have no body.  
In that case there is simply nothing after the blank line that follows the headers.

---

## 7. Practical Examples – GET

### Request
```
GET /users/42 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOi...
User-Agent: MyClient/1.0
```

### Response
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 112
ETag: "user-42-v3"
Cache-Control: private, max-age=60

{
  "id": 42,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "createdAt": "2025-03-15T09:00:00Z"
}
```

---

## 8. Practical Examples – POST

### Request
```
POST /users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Accept: application/json
Authorization: Bearer eyJhbGciOi...
Content-Length: 78

{
  "name": "Bob Smith",
  "email": "bob@example.com"
}
```

### Response
```
HTTP/1.1 201 Created
Content-Type: application/json
Location: https://api.example.com/users/43
Content-Length: 145

{
  "id": 43,
  "name": "Bob Smith",
  "email": "bob@example.com",
  "createdAt": "2026-10-06T12:30:00Z"
}
```

---

## 9. Practical Examples – PUT

### Request
```
PUT /users/43 HTTP/1.1
Host: api.example.com
Content-Type: application/json
Accept: application/json
Authorization: Bearer eyJhbGciOi...
Content-Length: 95

{
  "name": "Robert Smith",
  "email": "robert@example.com",
  "age": 32
}
```

### Response
```
HTTP/1.1 200 OK
Content-Type: application/json
ETag: "user-43-v2"

{
  "id": 43,
  "name": "Robert Smith",
  "email": "robert@example.com",
  "age": 32,
  "updatedAt": "2026-10-06T13:00:00Z"
}
```

---

## 10. Practical Examples – PATCH

### Request
```
PATCH /users/43 HTTP/1.1
Host: api.example.com
Content-Type: application/json
Accept: application/json
Authorization: Bearer eyJhbGciOi...

{
  "email": "robert.smith@example.com"
}
```

### Response
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 43,
  "name": "Robert Smith",
  "email": "robert.smith@example.com",
  "age": 32,
  "updatedAt": "2026-10-06T13:15:00Z"
}
```

---

## 11. Practical Examples – DELETE

### Request
```
DELETE /users/43 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOi...
```

### Response (No Content style)
```
HTTP/1.1 204 No Content
```

### Response (With message style)
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "User successfully deleted",
  "id": 43
}
```

---

## 12. Content-Type and Accept Headers in Depth

These two headers control content negotiation.

| Header         | Sent By  | Meaning                                              |
|----------------|----------|------------------------------------------------------|
| Content-Type   | Client or Server | “This is the format of the body I am sending”     |
| Accept         | Client   | “These are the formats I am willing to receive”      |

### Common Values

- `application/json` → most common for REST APIs
- `application/xml`
- `application/x-www-form-urlencoded` (HTML forms)
- `multipart/form-data` (file uploads)
- `text/plain`
- `application/pdf`

### Example of Negotiation

Client says:
```
Accept: application/json
```

Server responds:
```
Content-Type: application/json
```

If the server cannot provide an acceptable format, it may return `406 Not Acceptable`.

---

## 13. Common Header Combinations

### Authenticated JSON API Call
```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

### File Upload
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

### Conditional GET (caching)
```
If-None-Match: "abc123"
Accept: application/json
```

---

## 14. How Tools Show Request/Response

### Browser DevTools (Network tab)
- Shows method, URL, status, headers, and body
- Excellent for learning

### Postman / Insomnia
- Friendly UI for building requests
- Shows formatted JSON responses
- Allows saving collections

### curl
- Command-line, scriptable
- Very close to the raw HTTP

Example curl with verbose output:
```bash
curl -v -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"name":"Alice"}'
```

---

## 15. Visual Diagrams

### Request Anatomy

```
┌─────────────────────────────────────────────────────┐
│  POST /users HTTP/1.1                               │  ← Request Line
├─────────────────────────────────────────────────────┤
│  Host: api.example.com                              │
│  Content-Type: application/json                     │  ← Headers
│  Authorization: Bearer eyJ...                       │
│  Accept: application/json                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  {                                                  │
│    "name": "Alice",                                 │  ← Body
│    "email": "alice@example.com"                     │
│  }                                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Response Anatomy

```
┌─────────────────────────────────────────────────────┐
│  HTTP/1.1 201 Created                               │  ← Status Line
├─────────────────────────────────────────────────────┤
│  Content-Type: application/json                     │
│  Location: /users/43                                │  ← Headers
│  Content-Length: 145                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  {                                                  │
│    "id": 43,                                        │  ← Body
│    "name": "Alice",                                 │
│    "email": "alice@example.com"                     │
│  }                                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 16. Key Takeaways

- Every HTTP message has a start line, headers, and an optional body.
- The request line tells the method and the target resource.
- The status line tells the result of the request.
- Headers carry metadata; the body carries the main data.
- `Content-Type` and `Accept` control data formats.
- Reading raw requests and responses is a core skill for API work.

---

## 17. Self-Check Questions

1. What are the three main parts of an HTTP request?
2. What information appears on the request line?
3. What is the purpose of the `Location` header?
4. When is a request body required?
5. What is the difference between `Content-Type` and `Accept`?
6. Write a complete example of a successful POST response (status line + headers + body).
7. Why do many DELETE responses use status 204?
8. What does the blank line after the headers signify?
9. Name three important request headers and their purposes.
10. How would you request JSON and send JSON in the same call?

---

## 18. Summary

Being able to read and construct complete HTTP requests and responses is a fundamental skill.  

Once this becomes natural, working with any REST API feels much more straightforward, whether you are using a GUI tool, writing code, or debugging production issues.

---

## 19. What’s Next

Next we will deepen our understanding of **Idempotency and Safety** — two critical properties of HTTP methods that affect reliability and API design.

---

**End of Topic 07 – Request & Response Anatomy**

*Focus: Practical mastery of the structure of HTTP messages used in REST APIs.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
