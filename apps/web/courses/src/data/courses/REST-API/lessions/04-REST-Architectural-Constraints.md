# 04. REST Architectural Constraints

> **REST API Fundamentals Study Guide**  
> Audience: Absolute Beginners  
> Goal: Understand the six constraints that define a RESTful system according to Roy Fielding.

---

## Table of Contents

1. Introduction – Why Constraints Matter
2. Overview of the Six Constraints
3. Constraint 1: Client-Server
4. Constraint 2: Stateless
5. Constraint 3: Cacheable
6. Constraint 4: Uniform Interface
7. Constraint 5: Layered System
8. Constraint 6: Code on Demand (Optional)
9. How the Constraints Work Together
10. What Happens When Constraints Are Violated
11. Pure REST vs Practical REST
12. Visual Diagrams
13. Real-World Implications
14. Common Beginner Questions
15. Key Takeaways
16. Self-Check Questions
17. Summary
18. What’s Next

---

## 1. Introduction – Why Constraints Matter

Roy Fielding did not invent REST as a set of random good ideas.  
He extracted six architectural **constraints** from the successful design of the World Wide Web.

A constraint is a **restriction** that forces the design in a particular direction.  
By accepting these restrictions, we gain important properties:

- Scalability
- Simplicity
- Reliability
- Visibility
- Portability
- Performance (through caching)

Understanding these constraints helps you:

- Design better APIs
- Evaluate whether an existing API is truly RESTful
- Understand trade-offs when you intentionally violate a constraint

---

## 2. Overview of the Six Constraints

| # | Constraint            | Mandatory? | Main Benefit                          |
|---|-----------------------|------------|---------------------------------------|
| 1 | Client-Server         | Yes        | Separation of concerns                |
| 2 | Stateless             | Yes        | Scalability & reliability             |
| 3 | Cacheable             | Yes        | Performance & reduced server load     |
| 4 | Uniform Interface     | Yes        | Simplicity & evolvability             |
| 5 | Layered System        | Yes        | Scalability & security                |
| 6 | Code on Demand        | Optional   | Extensibility                         |

The first five are required for a system to be considered RESTful.  
The sixth is optional.

---

## 3. Constraint 1: Client-Server

### Definition
The client and the server are separate concerns.  
They can evolve independently as long as they agree on the interface.

### What It Means in Practice

- The client is responsible for the user interface and user experience.
- The server is responsible for data storage, business logic, and security.
- Neither needs to know the internal implementation of the other.

### Benefits

| Benefit                    | Explanation                                           |
|----------------------------|-------------------------------------------------------|
| Independent evolution      | Frontend and backend teams can work separately        |
| Scalability                | Server can be scaled without touching clients         |
| Simpler components         | Each side has a clear responsibility                  |
| Multiple clients           | Same server can serve web, mobile, IoT, etc.          |

### Example

A React web app and a Flutter mobile app can both talk to the same REST API server.  
Changing the database on the server does not force the apps to be rewritten.

---

## 4. Constraint 2: Stateless

### Definition
Each request from the client to the server must contain **all the information** needed to understand and process the request.  
The server does not store any client context between requests.

### What “Stateless” Really Means

- The server does **not** remember previous requests from the same client.
- Session state is kept on the client side (or in a shared store that is not tied to a specific server instance).
- Authentication information must be sent with every request (usually via headers).

### Benefits

| Benefit                    | Explanation                                           |
|----------------------------|-------------------------------------------------------|
| Scalability                | Any server instance can handle any request            |
| Reliability                | Server crashes do not lose session state              |
| Visibility                 | Every request is self-contained and easier to monitor |
| Simplicity                 | Server logic becomes simpler                          |

### Practical Example

**Stateful (not REST-friendly):**
```
Request 1: Login → Server creates session ID and stores it in memory
Request 2: Get profile → Client sends only session ID → Server looks up session
```

**Stateless (REST-friendly):**
```
Every request includes: Authorization: Bearer <token>
Server validates the token on every request and does not store session state.
```

---

## 5. Constraint 3: Cacheable

### Definition
Responses must explicitly indicate whether they are cacheable or not.  
If a response is cacheable, the client (or an intermediate cache) may reuse it for later equivalent requests.

### Why Caching Matters

- Reduces the number of requests that reach the server
- Improves response time for the client
- Decreases network traffic
- Lowers server load and cost

### How Caching Is Controlled

Through HTTP headers:

| Header            | Purpose                                      |
|-------------------|----------------------------------------------|
| Cache-Control     | Main directives (max-age, no-cache, etc.)    |
| ETag              | Version identifier for conditional requests  |
| Last-Modified     | Timestamp for conditional requests           |
| Expires           | Absolute expiration time                     |

### Example

```
HTTP/1.1 200 OK
Cache-Control: max-age=3600
ETag: "abc123"
Content-Type: application/json

{ "id": 42, "name": "Alice" }
```

The client (or a CDN) can reuse this response for the next 3600 seconds.

---

## 6. Constraint 4: Uniform Interface

This is the **most important** and most distinctive constraint of REST.

### Definition
All interactions between client and server follow a uniform, consistent interface.

### Four Interface Constraints (Sub-constraints)

1. **Identification of Resources**  
   Resources are identified by URIs.

2. **Manipulation of Resources Through Representations**  
   Clients receive representations (JSON, etc.) and use them to modify resources.

3. **Self-Descriptive Messages**  
   Each message contains enough information to describe how to process it (headers, media types).

4. **Hypermedia as the Engine of Application State (HATEOAS)**  
   Responses should contain links that guide the client about possible next actions.

### Benefits

- Clients can interact with many different resources using the same rules
- The system becomes simpler and more evolvable
- New resources can be added without breaking existing clients (if designed carefully)

### Practical Impact on API Design

- Use nouns in URLs, not verbs
- Use standard HTTP methods consistently
- Use standard status codes
- Return consistent error formats
- Prefer hypermedia links when possible (advanced)

---

## 7. Constraint 5: Layered System

### Definition
A client cannot usually tell whether it is connected directly to the end server or to an intermediate layer.

### What This Enables

- Load balancers
- API gateways
- Caches (CDNs, reverse proxies)
- Security layers (firewalls, authentication proxies)
- Monitoring and logging layers

### Benefits

| Benefit                    | Explanation                                           |
|----------------------------|-------------------------------------------------------|
| Scalability                | Intermediate layers can distribute load               |
| Security                   | Sensitive logic can be hidden behind gateways         |
| Flexibility                | New layers can be added without changing clients      |
| Legacy support             | Old systems can be wrapped behind a modern API layer  |

### Example Architecture

```
Client → CDN → API Gateway → Load Balancer → Application Servers → Database
```

The client only sees the public URL. It does not know how many layers exist behind it.

---

## 8. Constraint 6: Code on Demand (Optional)

### Definition
Servers can temporarily extend client functionality by transferring executable code (for example, JavaScript).

### Examples

- Browser downloads and executes JavaScript
- Applets (historically)
- WebAssembly modules

### Why It Is Optional

- Not all clients can execute code (mobile apps, IoT devices, other servers)
- It reduces visibility (harder to understand what the client will do)
- Most pure REST APIs for mobile and backend-to-backend communication do **not** use Code on Demand

For most REST API design work, this constraint can be ignored.

---

## 9. How the Constraints Work Together

The constraints are not independent. They reinforce each other:

- **Stateless + Layered System** → Excellent horizontal scalability
- **Uniform Interface + Client-Server** → Independent evolution of client and server
- **Cacheable + Stateless** → High performance and reduced server load
- **Uniform Interface** makes the whole system understandable and evolvable

Together they create a system that can grow to internet scale (like the World Wide Web itself).

---

## 10. What Happens When Constraints Are Violated

| Constraint Violated     | Typical Consequence                              |
|-------------------------|--------------------------------------------------|
| Client-Server           | Tight coupling, harder to change either side     |
| Stateless               | Harder to scale, session affinity problems       |
| Cacheable               | Unnecessary load on servers, slower responses    |
| Uniform Interface       | Clients become complex, API becomes hard to learn|
| Layered System          | Reduced flexibility and scalability options      |

Many real-world APIs intentionally relax some constraints for practical reasons (especially HATEOAS).  
The key is to understand the trade-off you are making.

---

## 11. Pure REST vs Practical REST

| Aspect                  | Pure REST (Fielding)               | Practical REST (Most APIs)              |
|-------------------------|------------------------------------|-----------------------------------------|
| HATEOAS                 | Required                           | Rarely fully implemented                |
| Resource identification | Strict                             | Usually followed                        |
| Stateless               | Strict                             | Usually followed (with tokens)          |
| Caching                 | Explicit                           | Often implemented                       |
| Uniform methods         | Strict                             | Usually followed                        |
| Real-world adoption     | Rare                               | Extremely common                        |

Most successful public APIs (GitHub, Stripe, Twilio, etc.) are “RESTful” rather than pure REST.  
They follow the spirit of the constraints while making pragmatic compromises.

---

## 12. Visual Diagrams

### The Six Constraints at a Glance

```
                    ┌──────────────────────────┐
                    │   REST System            │
                    │                          │
     ┌──────────────┤  1. Client-Server        │
     │              │  2. Stateless            │
     │              │  3. Cacheable            │
     │              │  4. Uniform Interface    │
     │              │  5. Layered System       │
     │              │  6. Code on Demand (opt) │
     │              └──────────────────────────┘
     │
     ▼
   Benefits: Scalability, Simplicity, Reliability,
             Visibility, Performance, Evolvability
```

### Layered System Example

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Client  │───►│   CDN   │───►│ Gateway │───►│  App    │───►│   DB    │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                 Cache          Auth +         Business
                                Rate Limit     Logic
```

---

## 13. Real-World Implications

When you design or review an API, ask yourself:

1. Is the client tightly coupled to server implementation details?
2. Does every request carry all necessary context (especially authentication)?
3. Are responses explicitly marked as cacheable or not?
4. Is the interface consistent across resources?
5. Can I insert intermediate layers without breaking clients?

Answering these questions honestly will improve the quality of your APIs.

---

## 14. Common Beginner Questions

**Q: Do I need to implement all six constraints perfectly?**  
A: No. Most production APIs aim for “RESTful enough”. Focus first on Client-Server, Stateless, and Uniform Interface.

**Q: Is using JWT a violation of the Stateless constraint?**  
A: No. The token is sent by the client with every request. The server does not store session state.

**Q: Why do so few APIs implement HATEOAS fully?**  
A: It adds complexity for both API designers and client developers. Many teams prefer simpler, well-documented endpoints.

**Q: Can a GraphQL API be RESTful?**  
A: GraphQL follows a different architectural style. It is not REST.

---

## 15. Key Takeaways

- REST is defined by six architectural constraints.
- The most important practical constraints are Client-Server, Stateless, and Uniform Interface.
- Constraints create beneficial properties (scalability, simplicity, etc.).
- Real-world APIs are usually “RESTful” rather than pure REST.
- Understanding the constraints helps you make intentional design decisions.

---

## 16. Self-Check Questions

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

## 17. Summary

The six architectural constraints are the formal definition of REST.  

They explain *why* RESTful systems can scale to the size of the web and remain understandable.  

You do not need to implement every constraint perfectly in every API, but you should understand the purpose of each constraint and the consequences of relaxing it.

---

## 18. What’s Next

Next we will focus on the practical side of the Uniform Interface:  
**Resources, URIs, and Resource Modeling**.

We will learn how to design clean, consistent resource URLs — one of the most visible aspects of a good REST API.

---

**End of Topic 04 – REST Architectural Constraints**

*Focus: Deep understanding of the six constraints that give REST its power and character.*

---

**Version**: 1.0  
**Course**: REST API Fundamentals  
**For**: Absolute Beginners
