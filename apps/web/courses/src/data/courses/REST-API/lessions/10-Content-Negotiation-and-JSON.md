# 10. Content Negotiation & JSON

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Understand how clients and servers agree on data formats and why JSON dominates REST APIs.

---

## Table of Contents

1. What is Content Negotiation?
2. Why Content Negotiation Exists
3. The Accept Header
4. The Content-Type Header
5. How Negotiation Works – Step by Step
6. Common Media Types
7. Why JSON Became the Default
8. JSON Structure Basics for APIs
9. JSON Design Best Practices
10. Handling Unsupported Formats
11. Content Negotiation in Practice
12. Other Formats You May Encounter
13. Visual Diagrams
14. Common Mistakes
15. Key Takeaways
16. Self-Check Questions
17. Summary
18. What’s Next

---

## 1. What is Content Negotiation?

**Content Negotiation** is the mechanism that allows a client and a server to decide which representation format to use when exchanging data.

In simple words:

> The client says “I prefer JSON”, the server replies “Here is the data in JSON”.

It is one of the features that makes HTTP flexible and RESTful systems evolvable.

---

## 2. Why Content Negotiation Exists

Different clients have different needs:

- A mobile app may want compact JSON
- A legacy system may still require XML
- A browser may prefer HTML
- A reporting tool may want CSV or PDF

Instead of creating separate endpoints for every format, content negotiation allows the **same endpoint** to serve different representations.

---

## 3. The Accept Header

The client uses the `Accept` header to express its preferences.

```
Accept: application/json
```

### More Advanced Examples

```
Accept: application/json, application/xml;q=0.9, text/plain;q=0.8
```

The `q` value (quality factor) indicates preference (from 0 to 1).

| Header Value                                      | Meaning                                      |
|---------------------------------------------------|----------------------------------------------|
| `Accept: application/json`                        | I only want JSON                             |
| `Accept: application/json, application/xml`       | I accept both, JSON preferred                |
| `Accept: */*`                                     | I accept anything                            |
| `Accept: application/json;q=0.9, application/xml;q=0.5` | JSON strongly preferred over XML     |

---

## 4. The Content-Type Header

The `Content-Type` header tells the receiver what format the body is actually in.

### When Sending a Request (Client → Server)
```
Content-Type: application/json
```

### When Sending a Response (Server → Client)
```
Content-Type: application/json
```

The server should always set `Content-Type` on responses that have a body so the client knows how to parse it.

---

## 5. How Negotiation Works – Step by Step

1. Client sends a request with an `Accept` header.
2. Server examines the `Accept` header.
3. Server chooses the best matching representation it can produce.
4. Server returns the response with the chosen `Content-Type`.
5. If the server cannot produce any acceptable format, it returns **406 Not Acceptable**.

### Example Flow

**Request**
```
GET /users/42 HTTP/1.1
Accept: application/json
```

**Response**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 42,
  "name": "Alice"
}
```

---

## 6. Common Media Types

| Media Type                        | Common Use Case                     | File Extension |
|-----------------------------------|-------------------------------------|----------------|
| application/json                  | Almost all modern REST APIs         | .json          |
| application/xml                   | Older enterprise / SOAP systems     | .xml           |
| application/x-www-form-urlencoded | HTML form submissions               | —              |
| multipart/form-data               | File uploads                        | —              |
| text/plain                        | Simple text                         | .txt           |
| text/html                         | Web pages                           | .html          |
| application/pdf                   | Documents                           | .pdf           |
| image/png, image/jpeg             | Images                              | .png, .jpg     |

For REST APIs focused on data exchange, **application/json** is by far the most important.

---

## 7. Why JSON Became the Default

Several factors contributed to JSON’s dominance:

1. **Native to JavaScript** – Perfect for browser and Node.js applications
2. **Lightweight** – Much less verbose than XML
3. **Human-readable** – Easy to debug
4. **Language support** – Excellent libraries in almost every programming language
5. **Perfect match for REST** – Resources map naturally to JSON objects
6. **Mobile era** – Bandwidth-efficient for mobile networks
7. **Tooling** – Postman, browsers, and editors all handle JSON beautifully

Today, if an API does not specify otherwise, developers assume it speaks JSON.

---

## 8. JSON Structure Basics for APIs

JSON supports six data types:

| Type     | Example                          | Notes                              |
|----------|----------------------------------|------------------------------------|
| Object   | `{ "name": "Alice" }`            | Key-value pairs                    |
| Array    | `[1, 2, 3]`                      | Ordered list                       |
| String   | `"hello"`                        | Double quotes required             |
| Number   | `42`, `3.14`                     | No quotes                          |
| Boolean  | `true`, `false`                  | Lowercase                          |
| Null     | `null`                           | Represents empty / unknown         |

### Typical API Response Shapes

**Single resource**
```json
{
  "id": 42,
  "name": "Alice",
  "email": "alice@example.com"
}
```

**Collection**
```json
{
  "data": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ],
  "page": 1,
  "total": 2
}
```

**Error**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

---

## 9. JSON Design Best Practices

| Practice                              | Recommendation                                      | Why                                      |
|---------------------------------------|-----------------------------------------------------|------------------------------------------|
| Naming convention                     | camelCase or snake_case (be consistent)             | Predictability                           |
| Date format                           | ISO 8601 (`2026-10-06T14:30:00Z`)                   | Universally understood                   |
| Null vs omitting fields               | Be consistent                                       | Avoid ambiguity                          |
| Nested objects                        | Keep reasonable depth                               | Readability                              |
| Arrays of objects                     | Prefer arrays over objects-with-numeric-keys        | Natural list structure                   |
| Boolean values                        | Use true/false, not 1/0 or "yes"/"no"               | Correct typing                           |
| Large numbers / IDs                   | Consider strings if precision matters               | JavaScript number limits                 |
| Envelope vs bare objects              | Both are valid; choose one style and stick to it    | Consistency                              |

---

## 10. Handling Unsupported Formats

If a client requests a format the server does not support:

```
HTTP/1.1 406 Not Acceptable
Content-Type: application/json

{
  "error": {
    "code": "NOT_ACCEPTABLE",
    "message": "Supported formats: application/json"
  }
}
```

If a client sends a body in an unsupported format:

```
HTTP/1.1 415 Unsupported Media Type
```

---

## 11. Content Negotiation in Practice

### Simple Modern API (JSON only)
Many APIs today simply require JSON and document it clearly:

- Request bodies must be `application/json`
- Responses are always `application/json`
- `Accept` header is optional but recommended

This is perfectly acceptable and reduces complexity.

### Full Negotiation
Some APIs support multiple formats and truly negotiate based on the `Accept` header.  
This is more flexible but requires more implementation effort.

---

## 12. Other Formats You May Encounter

| Format     | Still Used? | Typical Domain                          |
|------------|-------------|-----------------------------------------|
| XML        | Yes         | Legacy enterprise, some government APIs |
| Protocol Buffers | Growing | High-performance internal services     |
| MessagePack| Occasional  | Bandwidth-sensitive systems             |
| YAML       | Rare in APIs| Configuration files more than APIs      |
| CSV        | Yes         | Data export endpoints                   |

For public-facing REST APIs aimed at web and mobile clients, JSON remains the clear winner.

---

## 13. Visual Diagrams

### Content Negotiation Flow

```
Client                         Server
  |                              |
  |  Accept: application/json    |
  |----------------------------->|
  |                              |
  |                     Choose best match
  |                              |
  |  Content-Type: application/json
  |  { JSON body }               |
  |<-----------------------------|
```

### Media Type Decision

```
Client sends Accept header
         │
         ▼
Does server support any of the requested types?
         │
    ┌────┴────┐
    │ Yes     │ No
    ▼         ▼
Return best  Return 406
match        Not Acceptable
```

---

## 14. Common Mistakes

| Mistake                                      | Consequence                                | Better Approach                          |
|----------------------------------------------|--------------------------------------------|------------------------------------------|
| Forgetting Content-Type on requests with body| Server may reject or mis-parse the body    | Always set Content-Type                  |
| Assuming every API accepts only JSON         | Breaks when API supports multiple formats  | Check documentation / Accept header      |
| Using wrong media type for forms             | File uploads or form data fail             | Use multipart/form-data when needed      |
| Inconsistent JSON field naming               | Client developers get confused             | Pick one convention and stick to it      |
| Returning HTML error pages for API calls     | Hard for programmatic clients to handle    | Always return JSON error bodies for APIs |

---

## 15. Key Takeaways

- Content negotiation allows the same resource to have multiple representations.
- The client uses `Accept`; the server uses `Content-Type`.
- JSON is the de-facto standard for modern REST APIs.
- Good JSON design (consistent naming, proper types, ISO dates) improves usability.
- Even if your API only supports JSON, understanding negotiation helps you design better and debug issues faster.

---

## 16. Self-Check Questions

1. What is content negotiation in one sentence?
2. Which header does the client use to express preferred formats?
3. Which header tells the receiver the actual format of the body?
4. What status code should be returned when the server cannot produce an acceptable format?
5. Why did JSON become more popular than XML for REST APIs?
6. Name three JSON design best practices.
7. What is the correct Content-Type for a JSON request body?
8. When would you use `multipart/form-data`?
9. What does `q=0.8` mean in an Accept header?
10. Should a modern public REST API support XML by default? Why or why not?

---

## 17. Summary

Content negotiation is the HTTP mechanism that makes representation flexibility possible.  

In practice, most REST APIs standardize on JSON, which keeps things simple while still benefiting from the clean separation of resource and representation that REST promotes.

---

## 18. What’s Next

Next we will explore **Versioning Basics** — how to evolve an API over time without breaking existing clients.

---

**End of Topic 10 – Content Negotiation & JSON**

*Focus: Understanding format agreement between client and server, with emphasis on JSON as the modern standard.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
