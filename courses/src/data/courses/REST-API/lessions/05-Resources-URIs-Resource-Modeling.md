# 05. Resources, URIs & Resource Modeling

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Learn how to identify resources and design clean, consistent URIs.

---

## Table of Contents

1. What is a Resource?
2. Resource vs Representation
3. Identifying Resources
4. What is a URI / URL?
5. Anatomy of a Good URI
6. Resource Modeling Principles
7. Collection Resources vs Singleton Resources
8. Nested / Sub-Resources
9. Naming Conventions (Best Practices)
10. Anti-Patterns to Avoid
11. Practical Modeling Examples
12. Query Parameters for Filtering & Pagination
13. Visual Diagrams
14. Common Beginner Mistakes
15. Key Takeaways
16. Self-Check Questions
17. Summary
18. What’s Next

---

## 1. What is a Resource?

In REST, a **resource** is any concept or entity that can be identified, named, and manipulated.

Simple definition:

> A resource is anything that is important enough to be referenced as a separate thing in your API.

Examples:

- A user
- A product
- An order
- A blog post
- A comment on a blog post
- A list of all products
- A customer’s shopping cart
- A weather report for a city
- A PDF invoice

Resources are the nouns of your API.

---

## 2. Resource vs Representation

This distinction is crucial.

| Concept          | Meaning                                                                 |
|------------------|-------------------------------------------------------------------------|
| Resource         | The actual concept or entity (exists on the server)                     |
| Representation   | A snapshot of the resource’s state at a particular moment, in a particular format (usually JSON) |

When a client does `GET /users/42`, the server does **not** send the user object itself.  
It sends a **representation** of that user (JSON, XML, etc.).

The same resource can have multiple representations:

- `application/json`
- `application/xml`
- `text/html`
- `application/pdf`

---

## 3. Identifying Resources

Every resource must have at least one unique identifier.  
In REST this identifier is almost always a **URI** (Uniform Resource Identifier).

Good resource identification:

- Stable over time
- Unique within the system
- Meaningful (when possible)
- Not tied to implementation details (database row IDs are okay if they are stable)

---

## 4. What is a URI / URL?

- **URI** = Uniform Resource Identifier (the general term)
- **URL** = Uniform Resource Locator (a type of URI that includes location)

In everyday API work we usually say “URL”.

Example:

```
https://api.example.com/v1/users/42
```

This URL uniquely identifies the user resource with ID 42.

---

## 5. Anatomy of a Good URI

A typical REST URI looks like this:

```
https://api.example.com / v1 / users / 42 / orders
│         │              │    │      │    │
│         │              │    │      │    └─ sub-resource
│         │              │    │      └─ specific resource
│         │              │    └─ collection resource
│         │              └─ version (optional but common)
│         └─ host
└─ protocol
```

### Recommended Structure

```
/{version}/{collection}/{resource-id}/{sub-collection}/{sub-resource-id}
```

---

## 6. Resource Modeling Principles

When designing resources, follow these principles:

1. **Model around business concepts**, not database tables
2. **Use nouns**, never verbs in the path
3. **Be consistent** across the whole API
4. **Prefer plural nouns** for collections
5. **Keep URIs hierarchical** when relationships are clear
6. **Avoid deep nesting** (more than 2–3 levels is usually a smell)
7. **Make URIs guessable** and readable by humans

---

## 7. Collection Resources vs Singleton Resources

| Type              | Example URI              | Meaning                              | Typical Methods          |
|-------------------|--------------------------|--------------------------------------|--------------------------|
| Collection        | `/users`                 | The set of all users                 | GET, POST                |
| Singleton         | `/users/42`              | One specific user                    | GET, PUT, PATCH, DELETE  |
| Singleton (special)| `/users/me`             | The currently authenticated user     | GET, PUT, PATCH          |

Collections usually support:

- `GET /users` → list / search
- `POST /users` → create a new item

Singletons usually support:

- `GET /users/42` → retrieve
- `PUT /users/42` → replace
- `PATCH /users/42` → partial update
- `DELETE /users/42` → remove

---

## 8. Nested / Sub-Resources

When one resource belongs to another, we can nest them:

```
/users/42/orders          → all orders of user 42
/users/42/orders/1001     → specific order of user 42
/posts/15/comments        → comments on post 15
/posts/15/comments/3      → specific comment
```

### Guidelines for Nesting

- Nest when the child resource cannot exist without the parent
- Avoid nesting just because there is a foreign key
- Do not nest more than two or three levels deep
- Sometimes a flat structure is clearer:

```
/orders?userId=42          (instead of /users/42/orders)
```

Both styles are valid; choose consistency and clarity.

---

## 9. Naming Conventions (Best Practices)

| Recommendation                  | Good Example                  | Bad Example                    |
|---------------------------------|-------------------------------|--------------------------------|
| Use plural nouns                | `/users`, `/products`         | `/user`, `/getProducts`        |
| Use kebab-case or snake_case    | `/order-items` or `/order_items` | `/orderItems` (less common in URLs) |
| Lowercase only                  | `/users`                      | `/Users`                       |
| Avoid file extensions           | `/users`                      | `/users.json`                  |
| Avoid verbs                     | `/users`                      | `/getUsers`, `/createUser`     |
| Be consistent                   | Always plural                 | Mixing `/user` and `/products` |
| Use hyphens for readability     | `/blog-posts`                 | `/blogposts`                   |

Most modern public APIs prefer:

- Plural nouns
- Lowercase
- Kebab-case (`/order-items`)

---

## 10. Anti-Patterns to Avoid

| Anti-Pattern                        | Why It Is Bad                              | Better Alternative                     |
|-------------------------------------|--------------------------------------------|----------------------------------------|
| Verbs in URLs                       | Breaks resource-oriented thinking          | Use HTTP methods                       |
| `/getUser?id=42`                    | RPC style, not REST                        | `GET /users/42`                        |
| `/api/createNewUser`                | Verb + non-resource                        | `POST /users`                          |
| Deep nesting                        | Hard to read and maintain                  | Flatten or use query parameters        |
| `/users/42/orders/1001/items/5/details` | Too deep                               | Redesign resources                     |
| Mixing singular and plural          | Inconsistent                               | Always use plural for collections      |
| Exposing database IDs in a fragile way | Coupling to implementation              | Use stable identifiers                 |
| Using GET for state-changing operations | Violates safe method semantics        | Use POST / PUT / PATCH / DELETE        |

---

## 11. Practical Modeling Examples

### Example 1: Blog Platform

```
/posts
/posts/{postId}
/posts/{postId}/comments
/posts/{postId}/comments/{commentId}
/authors
/authors/{authorId}
/authors/{authorId}/posts
/tags
/posts/{postId}/tags
```

### Example 2: E-Commerce

```
/products
/products/{productId}
/categories
/categories/{categoryId}/products
/customers
/customers/{customerId}
/customers/{customerId}/orders
/orders
/orders/{orderId}
/orders/{orderId}/items
/carts/{cartId}
/carts/{cartId}/items
```

### Example 3: Task Management

```
/projects
/projects/{projectId}
/projects/{projectId}/tasks
/tasks/{taskId}
/tasks/{taskId}/comments
/users/{userId}/assigned-tasks
```

---

## 12. Query Parameters for Filtering & Pagination

Path parameters identify the resource.  
Query parameters refine the request.

Common patterns:

```
GET /products?category=electronics&sort=price&order=asc
GET /users?role=admin&status=active
GET /orders?from=2026-01-01&to=2026-03-31
GET /products?page=2&limit=20
GET /posts?search=rest+api&limit=10
```

### Typical Query Parameters

| Parameter     | Purpose                          | Example                    |
|---------------|----------------------------------|----------------------------|
| page / offset | Pagination                       | `?page=3`                  |
| limit / size  | Page size                        | `?limit=25`                |
| sort          | Sort field                       | `?sort=createdAt`          |
| order         | asc / desc                       | `?order=desc`              |
| filter fields | Field-specific filters           | `?status=active`           |
| search / q    | Full-text search                 | `?q=wireless+headphones`   |

---

## 13. Visual Diagrams

### Resource Hierarchy Example

```
                    /products
                       │
         ┌─────────────┼─────────────┐
         │             │             │
   /products/101  /products/102  /products/103
         │
         └─────────────┐
                       │
              /products/101/reviews
                       │
         ┌─────────────┼─────────────┐
         │             │             │
   /reviews/1     /reviews/2     /reviews/3
```

### Collection vs Item

```
Collection Resource          Item Resource
─────────────────────        ──────────────────
GET    /users          →     GET    /users/42
POST   /users          →     PUT    /users/42
                             PATCH  /users/42
                             DELETE /users/42
```

---

## 14. Common Beginner Mistakes

1. Putting verbs in the URL (`/createUser`, `/deleteOrder`)
2. Using singular nouns for collections (`/user` instead of `/users`)
3. Extremely deep nesting
4. Inconsistent naming across the API
5. Exposing internal database structure too directly
6. Using query parameters for resource identity instead of path parameters
7. Forgetting that a list of items is itself a resource (`/users`)

---

## 15. Key Takeaways

- Resources are the nouns of your API.
- Every resource should have a clear, stable URI.
- Prefer plural nouns and consistent naming.
- Use path parameters for identity, query parameters for filtering.
- Nest resources only when the relationship is strong and clear.
- Avoid verbs, deep nesting, and inconsistency.
- Good resource modeling makes the API predictable and easy to learn.

---

## 16. Self-Check Questions

1. What is the difference between a resource and its representation?
2. Why should we use nouns instead of verbs in URIs?
3. Give an example of a collection resource and a singleton resource.
4. When is nesting resources a good idea?
5. What is the recommended way to handle pagination?
6. Why is `/getUsers` considered a bad URI design?
7. How would you model “all comments on a specific blog post”?
8. Should resource URIs contain file extensions like `.json`? Why or why not?
9. What is the difference between a path parameter and a query parameter?
10. Name three naming conventions that improve URI quality.

---

## 17. Summary

Resource modeling is one of the most visible and important parts of REST API design.  

A well-modeled set of resources with clean URIs makes the API feel intuitive.  
A poorly modeled API forces every client developer to constantly check documentation and remember special cases.

Invest time in thinking about resources before writing any code.

---

## 18. What’s Next

Next we will map the standard HTTP methods to the classic CRUD operations and see how they work together with the resources we have just learned to model.

---

**End of Topic 05 – Resources, URIs & Resource Modeling**

*Focus: Practical skills for identifying resources and designing clean, consistent URIs.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
