# 13. Common Pitfalls & Best Practices

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Learn the most frequent mistakes and the practical habits that lead to high-quality REST APIs.

---

## Table of Contents

1. Introduction
2. Pitfall 1 – Using Verbs in URLs
3. Pitfall 2 – Ignoring HTTP Method Semantics
4. Pitfall 3 – Inconsistent Naming and Structure
5. Pitfall 4 – Poor Status Code Usage
6. Pitfall 5 – Weak or Missing Error Responses
7. Pitfall 6 – Over-Nesting Resources
8. Pitfall 7 – Breaking Changes Without Versioning
9. Pitfall 8 – Returning Inconsistent Response Shapes
10. Pitfall 9 – Ignoring Pagination, Filtering, and Sorting
11. Pitfall 10 – Security Afterthoughts
12. Best Practice Checklist
13. Design Principles Summary
14. Client-Side Best Practices
15. Documentation Best Practices
16. Key Takeaways
17. Self-Check Questions
18. Summary
19. What’s Next

---

## 1. Introduction

Even experienced developers fall into common traps when designing or consuming REST APIs.  

This topic collects the most frequent pitfalls and pairs each one with practical best practices so you can avoid them from the beginning.

---

## 2. Pitfall 1 – Using Verbs in URLs

### Bad Examples
```
/getUsers
/createOrder
/deleteProduct/42
/updateUserEmail
```

### Why It Is Bad
- Breaks the resource-oriented model of REST
- Mixes actions into the URI instead of using HTTP methods
- Makes the API harder to learn and less consistent

### Best Practice
Use nouns and let the HTTP method express the action:

```
GET    /users
POST   /users
DELETE /products/42
PATCH  /users/42
```

---

## 3. Pitfall 2 – Ignoring HTTP Method Semantics

### Common Mistakes
- Using GET to change data
- Using POST for everything
- Using PUT for partial updates
- Making DELETE non-idempotent

### Best Practice
Respect the defined semantics:

| Intention              | Correct Method |
|------------------------|----------------|
| Read                   | GET            |
| Create                 | POST           |
| Full replace           | PUT            |
| Partial update         | PATCH          |
| Delete                 | DELETE         |

---

## 4. Pitfall 3 – Inconsistent Naming and Structure

### Bad Examples
```
/user
/Products
/order_items
/OrderItems
/get-customer-details
```

### Best Practice
Choose one style and apply it everywhere:

- Plural nouns
- Lowercase
- Kebab-case or snake_case (pick one)
- Consistent hierarchy

```
/users
/products
/order-items
/customers/{id}/orders
```

---

## 5. Pitfall 4 – Poor Status Code Usage

### Common Mistakes
- Always returning 200
- Using 200 for creation
- Returning 500 for validation errors
- Confusing 401 and 403

### Best Practice
- 201 for successful creation
- 204 when there is no content to return
- 4xx for client errors
- 5xx only for genuine server failures
- Precise codes over generic ones

---

## 6. Pitfall 5 – Weak or Missing Error Responses

### Bad Examples
- Empty body on errors
- Plain text “Error”
- HTML error pages
- Different structures for different errors

### Best Practice
Always return a consistent, structured JSON error body with:

- Machine-readable code
- Human-readable message
- Optional field-level details
- Request ID

---

## 7. Pitfall 6 – Over-Nesting Resources

### Bad Example
```
/users/42/orders/1001/items/5/details/3
```

### Why It Is Problematic
- Hard to read and remember
- Difficult to cache and route
- Couples resources too tightly

### Best Practice
Limit nesting to two or three levels.  
Consider flatter designs with query parameters when relationships are complex.

```
/orders/1001/items
/order-items/5
```

---

## 8. Pitfall 7 – Breaking Changes Without Versioning

### Consequences
- Existing clients suddenly fail
- Loss of trust
- Emergency hotfixes and angry developers

### Best Practice
- Introduce versioning from the first public release
- Prefer URI path versioning (`/v1/`, `/v2/`)
- Only introduce a new major version for breaking changes
- Provide a clear deprecation and sunset policy

---

## 9. Pitfall 8 – Returning Inconsistent Response Shapes

### Bad Example
Sometimes you return:
```json
{ "id": 1, "name": "Alice" }
```

Other times:
```json
{ "data": { "id": 1, "name": "Alice" } }
```

Or for lists:
```json
[ {...}, {...} ]
```
versus
```json
{ "items": [ {...}, {...} ] }
```

### Best Practice
Decide on one envelope style (or bare style) and stick to it for the entire API.

---

## 10. Pitfall 9 – Ignoring Pagination, Filtering, and Sorting

### Problem
Returning thousands of records in a single response:

- Slow responses
- High memory usage
- Poor user experience
- Potential denial-of-service risk

### Best Practice
Always support:

- Pagination (`page` + `limit` or cursor-based)
- Filtering on common fields
- Sorting

Document the default page size and maximum limits.

---

## 11. Pitfall 10 – Security Afterthoughts

### Common Issues
- Sensitive data in query parameters
- No rate limiting
- Verbose error messages that leak information
- Missing authentication on important endpoints
- CORS misconfiguration

### Best Practice
- Treat security as a first-class concern from day one
- Use HTTPS everywhere
- Apply authentication and authorization consistently
- Rate-limit public endpoints
- Review error messages for information leakage

---

## 12. Best Practice Checklist

Use this checklist when designing or reviewing an API:

- [ ] Resources are nouns, not verbs
- [ ] HTTP methods are used correctly
- [ ] Naming is consistent (plural, lowercase, one case style)
- [ ] Status codes are precise and meaningful
- [ ] Error responses follow a single structure
- [ ] Nesting is limited and purposeful
- [ ] Versioning strategy is defined
- [ ] Response shapes are consistent
- [ ] Collections support pagination
- [ ] Security (HTTPS, auth, rate limits) is in place
- [ ] Documentation is clear and up to date

---

## 13. Design Principles Summary

1. **Resource orientation** – Think in nouns.
2. **Uniform interface** – Be consistent.
3. **Correct use of HTTP** – Methods, status codes, headers.
4. **Explicitness** – Prefer clear over clever.
5. **Evolvability** – Design for change with versioning.
6. **Developer experience** – Make the happy path obvious and errors helpful.
7. **Security by default** – Never treat security as optional.

---

## 14. Client-Side Best Practices

When consuming REST APIs:

- Always check the status code before parsing the body
- Handle 4xx and 5xx distinctly
- Implement retries carefully (only on idempotent methods or with idempotency keys)
- Respect rate-limit headers
- Log request IDs when reporting issues
- Do not hard-code assumptions about response shapes without checking documentation

---

## 15. Documentation Best Practices

Good documentation is part of a good API:

- Provide clear examples for every endpoint
- Document all possible status codes and error codes
- Show both success and error response examples
- Explain authentication requirements
- Keep a changelog
- Offer an interactive playground (Swagger / OpenAPI, Postman collection, etc.)

---

## 16. Key Takeaways

- Most API problems come from a small set of repeated mistakes.
- Consistency is more valuable than perfection.
- Respecting HTTP semantics pays off in reliability and clarity.
- Error handling and versioning are not optional extras.
- Security and developer experience should be considered from the start.
- A simple checklist can prevent the majority of common pitfalls.

---

## 17. Self-Check Questions

1. Why are verbs in URLs considered a REST anti-pattern?
2. Name three consequences of inconsistent naming.
3. What is the danger of always returning status 200?
4. Why is over-nesting problematic?
5. List five items from the best-practice checklist.
6. How should a client react to a 429 status code?
7. Why should collections always support pagination?
8. What is the relationship between versioning and breaking changes?
9. Give two client-side best practices.
10. Why is documentation considered part of the API itself?

---

## 18. Summary

Avoiding common pitfalls and following proven best practices turns a merely functional API into a pleasant, reliable, and professional one.  

The habits you form while learning these fundamentals will serve you well throughout your career as an API designer or consumer.

---

## 19. What’s Next

Next we will create a set of **Quick Reference Tables** that summarize the most important information from the entire course in a compact, easy-to-scan format.

---

**End of Topic 13 – Common Pitfalls & Best Practices**

*Focus: Practical guidance for avoiding frequent mistakes and building high-quality REST APIs.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
