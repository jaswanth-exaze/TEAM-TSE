export default [
  {
    id: 'rest-api-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'HTTP Methods',
    prompt: `A client refreshes the browser after successfully creating an order using:

POST /orders

A second identical order is created.

Why is this possible?`,
    options: [
      'POST is not idempotent',
      'POST is cacheable',
      'POST is read-only',
      'POST automatically retries requests'
    ],
    correctAnswer: 'POST is not idempotent',
    explanation: 'POST is generally used to create resources and is not idempotent. Repeating the same POST request may create multiple resources unless the API implements idempotency keys.'
  },

  {
    id: 'rest-api-2',
    type: 'mcq',
    difficulty: 'expert',
    category: 'HTTP Methods',
    prompt: `Which HTTP method should normally be safe to execute repeatedly without changing server data?`,
    options: [
      'GET',
      'POST',
      'PATCH',
      'DELETE'
    ],
    correctAnswer: 'GET',
    explanation: 'GET is both safe and idempotent. It should retrieve information without modifying server state, allowing browsers, proxies, and crawlers to call it repeatedly without side effects.'
  },

  {
    id: 'rest-api-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'PUT vs PATCH',
    prompt: `A client wants to update only a user's phone number.

Which HTTP method is MOST appropriate?`,
    options: [
      'PUT',
      'PATCH',
      'POST',
      'GET'
    ],
    correctAnswer: 'PATCH',
    explanation: 'PATCH performs partial updates. PUT generally represents replacing the entire resource. Using PATCH avoids accidentally overwriting fields that were not included in the request.'
  },

  {
    id: 'rest-api-4',
    type: 'code-review',
    difficulty: 'expert',
    category: 'PUT vs PATCH',
    prompt: `A developer implements:

PUT /users/10

Request Body:
{
  "name": "John"
}

The API clears every other field in the user record.

Is this behavior correct?`,
    options: [
      'Yes, PUT normally replaces the entire resource',
      'No, PUT should only update changed fields',
      'PUT and PATCH behave identically',
      'PUT should never accept JSON'
    ],
    correctAnswer: 'Yes, PUT normally replaces the entire resource',
    explanation: 'PUT represents replacing the resource with the supplied representation. If only one field is sent, any omitted fields may be removed unless the API explicitly defines different behavior. PATCH is intended for partial updates.'
  },

  {
    id: 'rest-api-5',
    type: 'mcq',
    difficulty: 'hard',
    category: 'DELETE',
    prompt: `A client sends DELETE /users/15 twice.

The first request succeeds.

What should normally happen on the second request?`,
    options: [
      'The server crashes',
      'DELETE is idempotent, so repeating the request should not create additional side effects',
      'Another user is deleted',
      'DELETE automatically recreates the resource'
    ],
    correctAnswer: 'DELETE is idempotent, so repeating the request should not create additional side effects',
    explanation: 'DELETE is idempotent. Calling it multiple times should leave the system in the same final state. The response code may differ (such as 404 if the resource no longer exists), but no additional deletion occurs.'
  },

  {
    id: 'rest-api-6',
    type: 'mcq',
    difficulty: 'expert',
    category: 'HTTP Status Codes',
    prompt: `A client sends malformed JSON to an API.

Which response is MOST appropriate?`,
    options: [
      '400 Bad Request',
      '401 Unauthorized',
      '404 Not Found',
      '500 Internal Server Error'
    ],
    correctAnswer: '400 Bad Request',
    explanation: '400 indicates the server cannot understand the request because of invalid syntax or malformed request data. This is a client-side error.'
  },

  {
    id: 'rest-api-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Authentication',
    prompt: `A user logs in successfully but attempts to access another employee's payroll without permission.

Which response is MOST appropriate?`,
    options: [
      '401 Unauthorized',
      '403 Forbidden',
      '404 Not Found',
      '400 Bad Request'
    ],
    correctAnswer: '403 Forbidden',
    explanation: '401 means authentication is missing or invalid. 403 means the user is authenticated but does not have permission to access the requested resource.'
  },

  {
    id: 'rest-api-8',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Validation',
    prompt: `An API receives:

{
  "email": "not-an-email"
}

The JSON is syntactically valid, but the email format violates business validation rules.

Which response is MOST appropriate?`,
    options: [
      '400 Bad Request',
      '401 Unauthorized',
      '422 Unprocessable Content',
      '500 Internal Server Error'
    ],
    correctAnswer: '422 Unprocessable Content',
    explanation: 'The request syntax is valid, but the submitted data violates validation rules. 422 distinguishes semantic validation failures from malformed requests.'
  },

  {
    id: 'rest-api-9',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Concurrency',
    prompt: `Two users attempt to book the last available meeting room at exactly the same time.

One booking succeeds.

What is the MOST appropriate response for the second request?`,
    options: [
      '200 OK',
      '404 Not Found',
      '409 Conflict',
      '500 Internal Server Error'
    ],
    correctAnswer: '409 Conflict',
    explanation: '409 Conflict indicates that the request cannot be completed because of a conflict with the current state of the resource, such as optimistic locking failures or concurrent bookings.'
  },

  {
    id: 'rest-api-10',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Asynchronous APIs',
    prompt: `A client uploads a large video.

Processing will take several minutes in a background worker.

Which response is MOST appropriate immediately after accepting the upload?`,
    options: [
      '200 OK',
      '201 Created',
      '202 Accepted',
      '204 No Content'
    ],
    correctAnswer: '202 Accepted',
    explanation: '202 Accepted indicates the server has accepted the request for processing, but the work has not yet completed. It is commonly used for asynchronous jobs such as video processing, report generation, and large data imports.'
  },
  {
  id: 'rest-api-11',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Resource Design',
  prompt: `You are designing an endpoint to retrieve employee #125.

Which URI follows REST conventions?`,
  options: [
    'GET /getEmployee?id=125',
    'GET /employees/125',
    'POST /employee/get',
    'GET /employee?id=125'
  ],
  correctAnswer: 'GET /employees/125',
  explanation: 'REST APIs model resources rather than actions. The resource is "employees", and "125" identifies a specific employee. Using nouns instead of verbs results in cleaner, more consistent APIs.'
},

{
  id: 'rest-api-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Query Parameters',
  prompt: `An endpoint should support:

• Department filter
• Active employees only
• Sort by name
• Page number

Which request is MOST RESTful?`,
  options: [
    'GET /employees?department=IT&status=active&sort=name&page=2',
    'GET /employees/IT/active/name/2',
    'POST /employees/filter',
    'GET /filterEmployees'
  ],
  correctAnswer: 'GET /employees?department=IT&status=active&sort=name&page=2',
  explanation: 'Query parameters are intended for filtering, sorting, searching, and pagination. Path parameters identify specific resources.'
},

{
  id: 'rest-api-13',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Path vs Query',
  prompt: `Which value should normally be represented as a PATH parameter instead of a query parameter?`,
  options: [
    'Employee ID',
    'Sort order',
    'Page number',
    'Search keyword'
  ],
  correctAnswer: 'Employee ID',
  explanation: 'Path parameters identify a specific resource, such as /employees/125. Query parameters modify how a collection is returned, such as filtering, sorting, or pagination.'
},

{
  id: 'rest-api-14',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Pagination',
  prompt: `An endpoint returns 2 million products.

What is the BEST API design?`,
  options: [
    'Return all products in one response',
    'Support pagination using page/limit or cursor parameters',
    'Require the client to filter locally',
    'Split the response into multiple HTTP responses'
  ],
  correctAnswer: 'Support pagination using page/limit or cursor parameters',
  explanation: 'Large datasets should never be returned in a single response. Pagination improves performance, reduces memory usage, and provides a better user experience.'
},

{
  id: 'rest-api-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Searching',
  prompt: `Users need to search employees by name.

Which endpoint follows REST conventions?`,
  options: [
    'GET /employees?search=john',
    'GET /searchEmployees/john',
    'POST /employees/searchJohn',
    'GET /employees/name/john/search'
  ],
  correctAnswer: 'GET /employees?search=john',
  explanation: 'Searching modifies the returned collection rather than identifying a resource. Query parameters are therefore the preferred approach.'
},

{
  id: 'rest-api-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'REST Principles',
  prompt: `An API requires the server to remember every user's session between requests.

Which REST constraint is violated?`,
  options: [
    'Statelessness',
    'Caching',
    'Uniform Interface',
    'Layered System'
  ],
  correctAnswer: 'Statelessness',
  explanation: 'REST requires every request to contain all information necessary for processing. The server should not depend on conversational state stored between requests.'
},

{
  id: 'rest-api-17',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Resource Naming',
  prompt: `Which endpoint should be recommended during code review?`,
  options: [
    'POST /createUser',
    'POST /users',
    'POST /users/create',
    'POST /newUser'
  ],
  correctAnswer: 'POST /users',
  explanation: 'REST APIs use HTTP methods to express actions. The URI should represent the resource (users), while POST indicates creation.'
},

{
  id: 'rest-api-18',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Nested Resources',
  prompt: `Each employee belongs to one department.

Which endpoint BEST represents retrieving employees within department 10?`,
  options: [
    'GET /departments/10/employees',
    'GET /employees?department=10',
    'Both are acceptable depending on API design',
    'GET /employeeDepartment/10'
  ],
  correctAnswer: 'Both are acceptable depending on API design',
  explanation: 'Nested resources express ownership relationships clearly, while query parameters are excellent for filtering collections. Both designs are valid depending on whether department ownership or filtering is the primary concern.'
},

{
  id: 'rest-api-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Versioning',
  prompt: `Your API introduces breaking changes.

What is the MOST common strategy?`,
  options: [
    'Create a new API version (for example /v2)',
    'Overwrite the existing endpoints',
    'Rename only the database tables',
    'Restart the server'
  ],
  correctAnswer: 'Create a new API version (for example /v2)',
  explanation: 'Versioning allows existing clients to continue working while newer clients adopt updated behavior. URI versioning is one of the most widely used strategies.'
},

{
  id: 'rest-api-20',
  type: 'code-review',
  difficulty: 'expert',
  category: 'API Design',
  prompt: `A developer creates these endpoints:

POST /createOrder
PUT /updateOrder
DELETE /deleteOrder

How should this API be improved?`,
  options: [
    'Use resource-oriented endpoints such as POST /orders, PUT /orders/{id}, DELETE /orders/{id}',
    'Rename everything using camelCase',
    'Convert every endpoint into POST',
    'Use GET for updates'
  ],
  correctAnswer: 'Use resource-oriented endpoints such as POST /orders, PUT /orders/{id}, DELETE /orders/{id}',
  explanation: 'REST APIs model resources instead of actions. HTTP methods already describe the operation, so the URI should identify the resource rather than repeat the action.'
},
{
  id: 'rest-api-21',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Authentication',
  prompt: `A client sends a request without an Authorization header.

The endpoint requires authentication.

Which response is MOST appropriate?`,
  options: [
    '400 Bad Request',
    '401 Unauthorized',
    '403 Forbidden',
    '404 Not Found'
  ],
  correctAnswer: '401 Unauthorized',
  explanation: '401 indicates that authentication credentials are missing or invalid. If the client later authenticates successfully but lacks permission, 403 Forbidden should be returned instead.'
},

{
  id: 'rest-api-22',
  type: 'code-review',
  difficulty: 'expert',
  category: 'API Security',
  prompt: `A developer returns this JSON:

{
  "id": 10,
  "name": "John",
  "email": "john@company.com",
  "passwordHash": "$2b$12$..."
}

How should this API be reviewed?`,
  options: [
    'Approve because hashes are safe',
    'Reject because password hashes should never be exposed',
    'Only remove the email field',
    'Encrypt the response'
  ],
  correctAnswer: 'Reject because password hashes should never be exposed',
  explanation: 'Password hashes are sensitive security data. Even though they are not plain-text passwords, exposing them unnecessarily increases risk if intercepted, logged, or leaked.'
},

{
  id: 'rest-api-23',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Caching',
  prompt: `Thousands of clients request the same product catalog every minute.

The catalog changes only once per day.

What is the BEST optimization?`,
  options: [
    'Disable caching',
    'Use HTTP caching with Cache-Control and ETags',
    'Return 500 when traffic increases',
    'Force clients to reconnect every request'
  ],
  correctAnswer: 'Use HTTP caching with Cache-Control and ETags',
  explanation: 'HTTP caching dramatically reduces bandwidth and server load for resources that change infrequently. Cache-Control and ETags allow clients to reuse cached responses safely.'
},

{
  id: 'rest-api-24',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Conditional Requests',
  prompt: `A client already has a cached copy of a resource.

The client sends an If-None-Match header with a matching ETag.

What should the server return if the resource has NOT changed?`,
  options: [
    '200 OK',
    '201 Created',
    '204 No Content',
    '304 Not Modified'
  ],
  correctAnswer: '304 Not Modified',
  explanation: '304 tells the client that its cached representation is still valid, allowing it to reuse the local copy without downloading the resource again.'
},

{
  id: 'rest-api-25',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Rate Limiting',
  prompt: `A client exceeds the API rate limit.

Which response is MOST appropriate?`,
  options: [
    '401 Unauthorized',
    '409 Conflict',
    '429 Too Many Requests',
    '503 Service Unavailable'
  ],
  correctAnswer: '429 Too Many Requests',
  explanation: '429 indicates the client has sent too many requests within a given time window. APIs commonly include a Retry-After header to indicate when the client may retry.'
},

{
  id: 'rest-api-26',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Modern HTTP',
  prompt: `A search endpoint accepts a complex JSON filter with hundreds of conditions.

The operation is read-only and should remain safe and idempotent.

Which HTTP method is MOST appropriate according to the latest HTTP standards?`,
  options: [
    'GET',
    'POST',
    'QUERY',
    'PATCH'
  ],
  correctAnswer: 'QUERY',
  explanation: 'The HTTP QUERY method (RFC 10008) is designed for safe, idempotent requests that require a request body. It combines the read-only semantics of GET with support for complex request payloads.'
},

{
  id: 'rest-api-27',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Modern HTTP',
  prompt: `A team currently uses:

POST /products/search

only because the search filters are too large for a URL.

After adopting the HTTP QUERY method, what is the PRIMARY benefit?`,
  options: [
    'The operation remains safe and idempotent while supporting a request body',
    'Responses become automatically encrypted',
    'Authentication is no longer required',
    'Queries execute faster'
  ],
  correctAnswer: 'The operation remains safe and idempotent while supporting a request body',
  explanation: 'QUERY fills the gap between GET and POST by allowing complex query bodies while preserving read-only semantics. This makes retries, intermediaries, and HTTP semantics clearer.'
},

{
  id: 'rest-api-28',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Idempotency',
  prompt: `A payment API occasionally creates duplicate transactions because mobile clients automatically retry failed POST requests.

What is the BEST long-term solution?`,
  options: [
    'Reject all retries',
    'Require an Idempotency-Key header for create operations',
    'Replace POST with GET',
    'Increase the request timeout'
  ],
  correctAnswer: 'Require an Idempotency-Key header for create operations',
  explanation: 'Idempotency keys allow the server to recognize repeated requests representing the same logical operation, preventing duplicate resource creation even if clients retry.'
},

{
  id: 'rest-api-29',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Concurrency',
  prompt: `Two users edit the same employee record.

User A saves first.

User B unknowingly overwrites User A's changes.

Which HTTP mechanism BEST helps prevent this?`,
  options: [
    'ETag with If-Match',
    'Cache-Control',
    'Retry-After',
    'OPTIONS'
  ],
  correctAnswer: 'ETag with If-Match',
  explanation: 'Optimistic concurrency control uses ETags and the If-Match header. If the resource changes after it was retrieved, the update is rejected instead of silently overwriting newer data.'
},

{
  id: 'rest-api-30',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Final Production Incident',
  prompt: `A production API suddenly becomes slow.

Investigation shows:

• Database response time: 18 ms
• Memory usage: Normal
• Network latency: Normal
• CPU usage: 97%
• Thousands of identical GET requests every minute

What is the MOST likely improvement?`,
  options: [
    'Increase database indexes',
    'Implement HTTP caching for frequently requested resources',
    'Replace GET with POST',
    'Increase request timeouts'
  ],
  correctAnswer: 'Implement HTTP caching for frequently requested resources',
  explanation: 'The database is already fast, and the bottleneck is repeated processing of identical GET requests. Proper HTTP caching using Cache-Control, ETags, reverse proxies, or CDNs can dramatically reduce CPU usage and improve response times.'
},
{
  id: 'rest-api-fundamentals-31',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'HTTP Methods',
  prompt: 'Which HTTP method is normally used to retrieve a representation without changing server state?',
  options: ['GET', 'POST', 'PATCH', 'DELETE'],
  correctAnswer: 'GET',
  explanation: 'GET is defined for retrieving a representation and should be safe: clients do not request a state change by making the call. A server should not use GET for actions such as deleting a record.'
},
{
  id: 'rest-api-fundamentals-32',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Idempotency',
  prompt: 'A client repeats the same PUT request twice with the same resource representation. Which property should the API preserve?',
  options: ['The final resource state should be the same as after one request', 'The server must create two resources', 'The second request must always return 404', 'PUT must append the representation to the resource'],
  correctAnswer: 'The final resource state should be the same as after one request',
  explanation: 'PUT is intended to be idempotent: repeating an identical request has the same intended effect on resource state as performing it once. Responses may differ, but the repeated request should not keep applying an additional change.'
}
];
