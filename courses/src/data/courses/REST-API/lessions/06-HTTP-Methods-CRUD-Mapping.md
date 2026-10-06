# 06. HTTP Methods ↔ CRUD Mapping

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Master the relationship between HTTP methods and CRUD operations.

---

## Table of Contents

1. What is CRUD?
2. Why Mapping Matters
3. The Classic Mapping Table
4. GET – Read / Retrieve
5. POST – Create
6. PUT – Replace (Full Update)
7. PATCH – Partial Update
8. DELETE – Remove
9. Complete CRUD Examples for a Resource
10. Idempotency Revisited in Context of CRUD
11. Safety Revisited
12. Choosing Between PUT and PATCH
13. Common Real-World Patterns
14. Anti-Patterns
15. Visual Summary Tables
16. Key Takeaways
17. Self-Check Questions
18. Summary
19. What’s Next

---

## 1. What is CRUD?

**CRUD** is an acronym for the four basic operations that can be performed on data:

| Letter | Operation | Meaning                          |
|--------|-----------|----------------------------------|
| C      | Create    | Add a new record / resource      |
| R      | Read      | Retrieve / fetch existing data   |
| U      | Update    | Modify existing data             |
| D      | Delete    | Remove existing data             |

Almost every business application needs these four operations.  
REST maps them cleanly onto HTTP methods.

---

## 2. Why Mapping Matters

When everyone follows the same mapping:

- APIs become predictable
- Developers can guess endpoints and methods
- Tools and documentation generators work better
- Client code becomes more consistent
- Onboarding new team members is faster

Deviating from the standard mapping creates confusion.

---

## 3. The Classic Mapping Table

| CRUD Operation | HTTP Method | Typical URI Pattern          | Success Status Codes     |
|----------------|-------------|------------------------------|--------------------------|
| Create         | POST        | `/resources`                 | 201 Created              |
| Read (one)     | GET         | `/resources/{id}`            | 200 OK                   |
| Read (many)    | GET         | `/resources`                 | 200 OK                   |
| Update (full)  | PUT         | `/resources/{id}`            | 200 OK or 204 No Content |
| Update (partial)| PATCH      | `/resources/{id}`            | 200 OK or 204 No Content |
| Delete         | DELETE      | `/resources/{id}`            | 200 OK or 204 No Content |

This table is the foundation of most REST APIs.

---

## 4. GET – Read / Retrieve

### Purpose
Retrieve a representation of a resource or a collection of resources without changing anything on the server.

### Characteristics
- Safe
- Idempotent
- No request body (normally)

### Examples

**Get a single resource**
```
GET /users/42 HTTP/1.1
Host: api.example.com
Accept: application/json
```

**Successful response**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 42,
  "name": "Alice",
  "email": "alice@example.com"
}
```

**Get a collection**
```
GET /users?role=admin&page=1&limit=20
```

**Response**
```json
{
  "data": [
    { "id": 1, "name": "Admin One" },
    { "id": 2, "name": "Admin Two" }
  ],
  "page": 1,
  "limit": 20,
  "total": 2
}
```

---

## 5. POST – Create

### Purpose
Create a new resource.  
The server usually decides the new resource’s ID.

### Characteristics
- Not safe
- Not idempotent
- Has a request body

### Example

**Request**
```
POST /users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Accept: application/json

{
  "name": "Bob",
  "email": "bob@example.com"
}
```

**Successful response**
```
HTTP/1.1 201 Created
Content-Type: application/json
Location: /users/43

{
  "id": 43,
  "name": "Bob",
  "email": "bob@example.com",
  "createdAt": "2026-10-06T10:30:00Z"
}
```

Notice the `Location` header and the `201 Created` status.

---

## 6. PUT – Replace (Full Update)

### Purpose
Replace the entire resource with the representation sent in the request body.  
If the resource does not exist, some APIs will create it (upsert behavior).

### Characteristics
- Not safe
- Idempotent
- Has a request body
- Client usually sends the complete resource

### Example

**Request**
```
PUT /users/43 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "name": "Robert",
  "email": "robert@example.com"
}
```

**Response**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 43,
  "name": "Robert",
  "email": "robert@example.com",
  "updatedAt": "2026-10-06T11:00:00Z"
}
```

If you omit a field, it is typically cleared or set to null (depending on API design).

---

## 7. PATCH – Partial Update

### Purpose
Apply a partial modification to a resource.  
Only the fields sent in the body are changed.

### Characteristics
- Not safe
- Not necessarily idempotent (depends on the patch operation)
- Has a request body

### Example

**Request**
```
PATCH /users/43 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "email": "robert.new@example.com"
}
```

**Response**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 43,
  "name": "Robert",
  "email": "robert.new@example.com",
  "updatedAt": "2026-10-06T11:15:00Z"
}
```

Only the email changed; the name stayed the same.

---

## 8. DELETE – Remove

### Purpose
Remove a resource.

### Characteristics
- Not safe
- Idempotent
- Body is usually empty

### Example

**Request**
```
DELETE /users/43 HTTP/1.1
Host: api.example.com
```

**Response options**

Option A – with body:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "User deleted successfully"
}
```

Option B – no body (very common):
```
HTTP/1.1 204 No Content
```

Calling DELETE again on the same resource should still return success (idempotent) or 404, depending on API design.

---

## 9. Complete CRUD Examples for a Resource

Let’s take the resource `/products`.

| Operation          | Method + URI                  | Body? | Typical Success Code |
|--------------------|-------------------------------|-------|----------------------|
| List products      | GET /products                 | No    | 200                  |
| Get one product    | GET /products/101             | No    | 200                  |
| Create product     | POST /products                | Yes   | 201                  |
| Full replace       | PUT /products/101             | Yes   | 200 or 204           |
| Partial update     | PATCH /products/101           | Yes   | 200 or 204           |
| Delete product     | DELETE /products/101          | No    | 200 or 204           |

---

## 10. Idempotency Revisited in Context of CRUD

| Method  | Idempotent? | Practical Meaning                                      |
|---------|-------------|--------------------------------------------------------|
| GET     | Yes         | Calling multiple times returns the same result         |
| PUT     | Yes         | Sending the same full representation multiple times is safe |
| DELETE  | Yes         | Deleting an already-deleted resource is safe           |
| POST    | No          | Each call may create a new resource                    |
| PATCH   | Depends     | Simple field updates are usually idempotent; complex operations may not be |

Idempotency is especially important when network failures cause clients to retry requests.

---

## 11. Safety Revisited

| Method  | Safe? | Meaning                                              |
|---------|-------|------------------------------------------------------|
| GET     | Yes   | Does not change server state                         |
| POST    | No    | Creates or triggers side effects                     |
| PUT     | No    | Changes resource state                               |
| PATCH   | No    | Changes resource state                               |
| DELETE  | No    | Removes resource                                     |

Safe methods can be cached and prefetched more aggressively.

---

## 12. Choosing Between PUT and PATCH

| Situation                              | Prefer | Reason                                      |
|----------------------------------------|--------|---------------------------------------------|
| Client has the full resource           | PUT    | Simpler semantics, fully idempotent         |
| Client wants to change only a few fields | PATCH | Less data transfer, clearer intent          |
| API is simple and resources are small  | PUT    | Easier to implement and document            |
| Large resources or frequent small edits | PATCH | More efficient                              |
| Need strict idempotency                | PUT    | Safer for retries                           |

Many modern APIs support both.

---

## 13. Common Real-World Patterns

### Upsert with PUT
Some APIs treat PUT as “create if not exists, replace if exists”.

### Soft Delete
Instead of really deleting, the API sets a `deletedAt` timestamp and returns 204.  
Later GET requests exclude soft-deleted items.

### Bulk Operations
```
POST /products/bulk-delete
POST /users/import
```
These are acceptable when true bulk CRUD is needed, even though they are not pure resource-oriented.

---

## 14. Anti-Patterns

| Anti-Pattern                          | Why It Is Problematic                     | Better Approach                     |
|---------------------------------------|-------------------------------------------|-------------------------------------|
| Using GET to delete                   | Violates safety                           | Use DELETE                          |
| Using POST for everything             | Loses HTTP semantics                      | Use proper methods                  |
| Using PUT for partial updates         | Confusing; may wipe other fields          | Use PATCH                           |
| Returning 200 for creation            | Hides the fact that a new resource was created | Use 201 + Location header       |
| Ignoring idempotency on DELETE / PUT  | Causes bugs on retries                    | Design for idempotency              |

---

## 15. Visual Summary Tables

### Quick Reference Card

```
CREATE   →  POST   /collection
READ     →  GET    /collection
READ one →  GET    /collection/{id}
UPDATE   →  PUT    /collection/{id}     (full)
UPDATE   →  PATCH  /collection/{id}     (partial)
DELETE   →  DELETE /collection/{id}
```

### Status Code Cheat Sheet for CRUD

| Operation | Success          | Client Error     | Not Found     |
|-----------|------------------|------------------|---------------|
| GET       | 200              | 400              | 404           |
| POST      | 201              | 400, 409, 422    | —             |
| PUT       | 200 / 204        | 400, 409, 422    | 404 (or 201)  |
| PATCH     | 200 / 204        | 400, 422         | 404           |
| DELETE    | 200 / 204        | 400              | 404           |

---

## 16. Key Takeaways

- CRUD maps cleanly onto HTTP methods.
- GET = Read, POST = Create, PUT = Full Update, PATCH = Partial Update, DELETE = Delete.
- Respect safety and idempotency properties.
- Use the correct success status codes (especially 201 for creation).
- Consistency in method usage makes APIs predictable and pleasant to use.

---

## 17. Self-Check Questions

1. What does CRUD stand for?
2. Which HTTP method is used for creating a resource?
3. What is the difference between PUT and PATCH?
4. Is DELETE idempotent? Why does it matter?
5. Which status code should be returned when a resource is successfully created?
6. Why should we avoid using GET for operations that change data?
7. Give an example of a non-idempotent method and explain why it is not idempotent.
8. When would you choose PATCH over PUT?
9. What header is commonly returned with a 201 response?
10. Map the following to HTTP methods: List all items, Get one item, Create, Full replace, Partial update, Remove.

---

## 18. Summary

The HTTP method + URI combination tells both humans and machines what operation is being performed on which resource.  

Mastering this mapping is one of the fastest ways to become productive with REST APIs — both as a consumer and as a designer.

---

## 19. What’s Next

Next we will examine the full anatomy of HTTP requests and responses with many practical JSON examples for each method.

---

**End of Topic 06 – HTTP Methods ↔ CRUD Mapping**

*Focus: Clear, practical mapping of CRUD operations to standard HTTP methods.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
