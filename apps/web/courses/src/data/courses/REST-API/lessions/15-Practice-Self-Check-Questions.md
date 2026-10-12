# 15. Practice / Self-Check Questions

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Reinforce learning through comprehensive practice questions covering all previous topics.

---

## Table of Contents

1. How to Use This Practice Set
2. Section A – Introduction to APIs
3. Section B – What is REST?
4. Section C – HTTP Basics
5. Section D – REST Architectural Constraints
6. Section E – Resources, URIs & Resource Modeling
7. Section F – HTTP Methods & CRUD
8. Section G – Request & Response Anatomy
9. Section H – Idempotency & Safety
10. Section I – Status Codes
11. Section J – Content Negotiation & JSON
12. Section K – Versioning
13. Section L – Error Handling
14. Section M – Best Practices & Pitfalls
15. Mixed Scenario Questions
16. Answer Key (Selected Questions)
17. Self-Assessment Rubric
18. Final Challenge
19. Summary & Next Steps

---

## 1. How to Use This Practice Set

1. Attempt the questions **without** looking at notes first.
2. Mark questions you are unsure about.
3. Review the corresponding topic notes for gaps.
4. Re-attempt the difficult questions after revision.
5. Discuss challenging scenarios with classmates or instructors.

There are questions of varying difficulty: conceptual, practical, and scenario-based.

---

## 2. Section A – Introduction to APIs

1. Expand the acronym API and explain each word in one sentence.
2. Give two real-world analogies for an API and explain why they fit.
3. What is the difference between a client and a server in the context of APIs?
4. Why can a Python backend and a React frontend communicate easily via an API?
5. Name three everyday applications that rely heavily on APIs.
6. What is the main advantage of the client-server model?
7. Is Postman a client or a server when you use it to test an API? Explain.
8. Why is documentation critical for any API?
9. Can two completely different programming languages communicate through an API? Why?
10. What happens if the network between client and server fails during an API call?

---

## 3. Section B – What is REST?

1. What does the acronym REST stand for?
2. Who defined REST and in what year?
3. Is REST a protocol, a standard, or an architectural style?
4. What is the most important concept in REST?
5. Give three examples of resources in an e-commerce system.
6. Why is the uniform interface important?
7. Name two reasons why REST became more popular than SOAP.
8. True or False: Using JSON automatically makes an API RESTful. Explain.
9. What is the difference between a resource and its representation?
10. Can an API use HTTP and still not be considered RESTful? Explain.

---

## 4. Section C – HTTP Basics

1. What does HTTP stand for?
2. Name the three main parts of an HTTP request.
3. Which HTTP methods are considered safe?
4. Which HTTP methods are idempotent?
5. What is the difference between a 401 and a 403 status code?
6. When should you use a query parameter vs a path parameter?
7. Why should modern APIs use HTTPS instead of HTTP?
8. What header tells the server the format of the request body?
9. What status code is typically returned when a new resource is successfully created?
10. Is POST idempotent? Why or why not?

---

## 5. Section D – REST Architectural Constraints

1. List the six REST architectural constraints.
2. Which constraint is optional?
3. Why is the Stateless constraint important for scalability?
4. What are the four sub-constraints of the Uniform Interface?
5. Give one benefit of the Layered System constraint.
6. What is HATEOAS and why is it often skipped in practice?
7. Does using a Bearer token violate the Stateless constraint? Explain.
8. What property do we gain by making responses cacheable?
9. Why can client and server evolve independently under the Client-Server constraint?
10. Name one trade-off of violating the Uniform Interface constraint.

---

## 6. Section E – Resources, URIs & Resource Modeling

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

## 7. Section F – HTTP Methods & CRUD

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

## 8. Section G – Request & Response Anatomy

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

## 9. Section H – Idempotency & Safety

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

## 10. Section I – Status Codes

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

## 11. Section J – Content Negotiation & JSON

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

## 12. Section K – Versioning

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

## 13. Section L – Error Handling

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

## 14. Section M – Best Practices & Pitfalls

1. Why are verbs in URLs considered a REST anti-pattern?
2. Name three consequences of inconsistent naming.
3. What is the danger of always returning status 200?
4. Why is over-nesting problematic?
5. List five items from a good API design checklist.
6. How should a client react to a 429 status code?
7. Why should collections always support pagination?
8. What is the relationship between versioning and breaking changes?
9. Give two client-side best practices.
10. Why is documentation considered part of the API itself?

---

## 15. Mixed Scenario Questions

1. You need to design an endpoint that creates a new order. The client may retry the request if the network fails. How would you design this endpoint to avoid duplicate orders?

2. A mobile app receives a 401 status code. What should the app do next? What if it receives a 403 instead?

3. You are reviewing an API that has the following endpoints:
   - GET /getAllUsers
   - POST /createNewUser
   - GET /user?id=42
   Suggest improved designs following REST principles.

4. An API returns the following for a successful creation:
   ```
   HTTP/1.1 200 OK
   { "id": 55, "name": "New Item" }
   ```
   What would you change and why?

5. A client sends a PATCH request that increments a counter. Is this operation idempotent? How would you make a counter update safer for retries?

6. Design clean URIs for a library system that manages books, authors, and loans.

7. An API currently has no versioning. The team wants to rename a field from `userName` to `fullName`. What should they do?

8. Write a complete example (request + response) for successfully deleting a resource, including appropriate status code and headers.

9. A server receives a request with `Accept: application/xml` but only supports JSON. What status code and body should it return?

10. Explain how the Stateless constraint helps when you need to scale your API servers horizontally.

---

## 16. Answer Key (Selected Questions)

**A1.** Application Programming Interface – Application (software), Programming (related to code), Interface (point of interaction).

**B3.** Architectural style.

**C5.** 401 = authentication problem; 403 = authorization problem (authenticated but not allowed).

**F3.** PUT replaces the entire resource; PATCH applies a partial modification.

**H6.** An Idempotency-Key is a unique client-generated value sent with a request. The server remembers the result of the first request with that key and returns the same result on retries without re-executing the operation.

**I2.** When a new resource has been created.

**K3.** URI Path versioning.

*(Full answer key can be expanded by instructors as needed.)*

---

## 17. Self-Assessment Rubric

| Score Range | Interpretation                              | Suggested Action                          |
|-------------|---------------------------------------------|-------------------------------------------|
| 90–100%     | Excellent mastery                           | Ready for practical projects              |
| 75–89%      | Good understanding with minor gaps          | Review weak sections                      |
| 60–74%      | Adequate but needs reinforcement            | Re-read notes + more practice             |
| Below 60%   | Significant gaps                            | Systematic revision of all topics         |

---

## 18. Final Challenge

Design a small REST API for a simple “Task Manager” with the following requirements:

- Users can create, list, retrieve, update, and delete tasks
- Tasks belong to users
- Support pagination and filtering by status
- Proper versioning
- Consistent error handling
- Clear status codes

Write:

1. The list of resources and their URIs
2. The HTTP methods supported for each
3. Example success and error responses
4. Any versioning and error-handling decisions you made

---

## 19. Summary & Next Steps

You have now completed a comprehensive set of practice questions covering every major topic in REST API Fundamentals.

**Recommended next steps:**

1. Build a small real API (even a mock one) applying these principles.
2. Explore OpenAPI / Swagger for documentation.
3. Study authentication patterns (to be covered in separate notes on JWT).
4. Practice with public APIs (JSONPlaceholder, GitHub, etc.).
5. Review the Quick Reference Tables regularly.

Congratulations on completing the REST API Fundamentals study guide!

---

**End of Topic 15 – Practice / Self-Check Questions**

*Focus: Active recall and application of all concepts learned.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
