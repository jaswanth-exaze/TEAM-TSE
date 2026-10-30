import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { REST_API_PARTS, REST_API_TOPICS } from '../data/courses/rest-api'
import { appStorageKey } from '../lib/storage'
import './RestApiStudio.css'

const GAME_KEY = appStorageKey('rest-api-operations:v1')

const STARTER_EMPLOYEES = [
  { id: 'E-101', name: 'Dev Patel', jobTitle: 'Frontend Engineer', department: 'Engineering', email: 'dev.patel@northstar.example' },
  { id: 'E-110', name: 'Vikram Rao', jobTitle: 'Engineering Manager', department: 'Engineering', email: 'vikram.rao@northstar.example' },
  { id: 'E-121', name: 'Rhea Kapoor', jobTitle: 'HR Officer', department: 'People Operations', email: 'rhea.kapoor@northstar.example' },
  { id: 'E-130', name: 'Anita Menon', jobTitle: 'Payroll Specialist', department: 'Finance', email: 'anita.menon@northstar.example' },
  { id: 'E-140', name: 'Noor Khan', jobTitle: 'System Administrator', department: 'IT Operations', email: 'noor.khan@northstar.example' },
]

const DEPARTMENTS = [
  { id: 'D-ENG', name: 'Engineering', lead: 'Vikram Rao', employeeCount: 18 },
  { id: 'D-PEO', name: 'People Operations', lead: 'Rhea Kapoor', employeeCount: 6 },
  { id: 'D-FIN', name: 'Finance', lead: 'Anita Menon', employeeCount: 5 },
  { id: 'D-DSN', name: 'Product Design', lead: 'Maya Chen', employeeCount: 9 },
]

const ATTENDANCE = [
  { id: 'A-2031', employeeId: 'E-101', name: 'Dev Patel', department: 'Engineering', date: 'Today', clockIn: '09:02', status: 'Present' },
  { id: 'A-2030', employeeId: 'E-110', name: 'Vikram Rao', department: 'Engineering', date: 'Today', clockIn: '08:48', status: 'Present' },
  { id: 'A-2029', employeeId: 'E-121', name: 'Rhea Kapoor', department: 'People Operations', date: 'Today', clockIn: '09:14', status: 'Present' },
]

const PAYROLL = [
  { employeeId: 'E-101', name: 'Dev Patel', department: 'Engineering', monthlySalary: '₹1,18,000' },
  { employeeId: 'E-110', name: 'Vikram Rao', department: 'Engineering', monthlySalary: '₹2,10,000' },
  { employeeId: 'E-121', name: 'Rhea Kapoor', department: 'People Operations', monthlySalary: '₹1,35,000' },
  { employeeId: 'E-130', name: 'Anita Menon', department: 'Finance', monthlySalary: '₹1,42,000' },
]

const VIEW_TABS = [
  ['network', '01', 'Network lab'],
  ['resources', '02', 'Resource explorer'],
  ['methods', '03', 'Methods & retries'],
  ['responses', '04', 'Response design'],
  ['principles', '05', 'REST principles'],
  ['campaign', '06', 'Campaign'],
  ['concepts', '07', '15 lesson visuals'],
]

const REQUEST_STAGES = [
  { id: 'client', title: 'Client sends', point: 16 },
  { id: 'gateway', title: 'API gateway', point: 48 },
  { id: 'route', title: 'Resource route', point: 56 },
  { id: 'service', title: 'Method behavior', point: 61 },
  { id: 'database', title: 'Data store', point: 83 },
  { id: 'events', title: 'Audit event', point: 71 },
  { id: 'serialize', title: 'Representation', point: 61 },
  { id: 'response', title: 'Response returns', point: 16 },
]

const METHODS = [
  { method: 'GET', color: 'blue', purpose: 'Read a resource', safe: true, idempotent: true, note: 'Does not change server state. Repeating it has the same intended effect.' },
  { method: 'QUERY', color: 'cyan', purpose: 'Query with a request body', safe: true, idempotent: true, note: 'Carries structured query input in the request body. It is safe and idempotent; the target server must support QUERY and the request must declare its Content-Type.' },
  { method: 'POST', color: 'green', purpose: 'Create or submit', safe: false, idempotent: false, note: 'Often creates a new resource. Repeating may create a duplicate unless you add an idempotency key.' },
  { method: 'PUT', color: 'amber', purpose: 'Replace a resource', safe: false, idempotent: true, note: 'Send the full replacement. Repeating the same representation keeps the same final state.' },
  { method: 'PATCH', color: 'violet', purpose: 'Change selected fields', safe: false, idempotent: 'sometimes', note: 'Partial updates are not guaranteed to be idempotent. This lab uses set-value patches, which are repeatable.' },
  { method: 'DELETE', color: 'rose', purpose: 'Remove a resource', safe: false, idempotent: true, note: 'Repeating leaves the resource absent. The second response may differ, such as 404 after 204.' },
]

const CONSTRAINTS = [
  { id: 'client-server', title: 'Client–server', icon: '⇄', color: 'cyan', plain: 'The interface and data storage are separate responsibilities.', example: 'The HR dashboard asks the API for employee records; it does not read the database directly.', effect: 'The client and server can evolve independently.' },
  { id: 'stateless', title: 'Stateless', icon: '◉', color: 'mint', plain: 'Each request contains the information the server needs to understand it.', example: 'The request carries its identity and parameters. The server does not depend on hidden conversation memory.', effect: 'Requests can be routed to any healthy server instance.' },
  { id: 'cacheable', title: 'Cacheable', icon: '▣', color: 'amber', plain: 'Responses say whether a client or intermediary may reuse them.', example: 'A department list can return Cache-Control: max-age=60.', effect: 'Repeated reads can be faster and reduce server work.' },
  { id: 'uniform', title: 'Uniform interface', icon: '⌘', color: 'violet', plain: 'Resources have identifiers and representations; standard methods act on them.', example: 'GET /employees/E-101 reads one resource. PATCH /employees/E-101 changes selected fields.', effect: 'Clients can understand a consistent API without private endpoint rules.' },
  { id: 'layered', title: 'Layered system', icon: '▤', color: 'blue', plain: 'A request can pass through gateways, proxies, and services without the client needing to know.', example: 'Laptop → API gateway → employee service → database.', effect: 'Security, routing, and scaling can be handled in separate layers.' },
  { id: 'code', title: 'Code on demand · optional', icon: '{ }', color: 'rose', plain: 'A server may send executable code that extends a client’s behavior.', example: 'A browser downloads JavaScript to run an interactive page.', effect: 'This constraint is optional; an API can be RESTful without it.' },
]

const RESOURCE_NODES = [
  { id: 'employees', path: '/api/v1/employees', label: 'employees', kind: 'Collection', description: 'A collection contains employee resources. Use GET query parameters for simple filters, or QUERY with a JSON body for structured filters when the server supports it.', methods: 'GET · QUERY · POST', sampleMethod: 'GET', samplePath: '/api/v1/employees?department=Engineering&page=1&limit=5' },
  { id: 'employee', path: '/api/v1/employees/{employeeId}', label: '{employeeId}', kind: 'Item', description: 'An item URI identifies one employee. The identifier belongs in the path; filters and sort options belong in the query.', methods: 'GET · PUT · PATCH · DELETE', sampleMethod: 'GET', samplePath: '/api/v1/employees/E-101' },
  { id: 'departments', path: '/api/v1/departments', label: 'departments', kind: 'Collection', description: 'A separate resource collection for the company’s departments.', methods: 'GET', sampleMethod: 'GET', samplePath: '/api/v1/departments' },
  { id: 'attendance', path: '/api/v1/attendance', label: 'attendance', kind: 'Collection', description: 'Attendance records can be filtered by employee, department, or date.', methods: 'GET · POST', sampleMethod: 'GET', samplePath: '/api/v1/attendance?department=Engineering' },
  { id: 'payroll', path: '/api/v1/payroll', label: 'payroll', kind: 'Collection', description: 'Payroll is modeled as a company resource; the representation contains salary records.', methods: 'GET', sampleMethod: 'GET', samplePath: '/api/v1/payroll' },
]

const TOPIC_PRACTICE = {
  1: { activity: 'Send your first request and trace the response back to the client.' },
  2: { activity: 'Separate the REST architectural style from the HTTP protocol.' },
  3: { activity: 'Inspect the method, URI, headers, body, and status line.' },
  4: { activity: 'Explore the six REST constraints and their effect.' },
  5: { activity: 'Browse collections, items, and relationships in the URI tree.' },
  6: { activity: 'Compare CRUD methods with QUERY: a safe, idempotent read that carries structured criteria in its body.' },
  7: { activity: 'Expand a complete raw HTTP request and response.' },
  8: { activity: 'Replay requests and compare safety and idempotency.' },
  9: { activity: 'Trigger common status codes and see the client action.' },
  10: { activity: 'Change Accept and Content-Type to negotiate JSON or CSV.' },
  11: { activity: 'Compare v1 and v2 representations and migration choices.' },
  12: { activity: 'Create validation, routing, and server errors safely.' },
  13: { activity: 'Fix common API design mistakes in a checklist challenge.' },
  14: { activity: 'Open the method, header, URI, and status quick reference.' },
  15: { activity: 'Take the final design challenge and review every topic.' },
}

const LESSON_WALKS = [
  {
    number: 1, visual: 'contract', lens: 'A shared contract',
    explanation: 'An API is a documented agreement between programs. The client knows which resource to ask for, how to format its request, and how to interpret the response. The server can change its internal code while keeping that public agreement stable.',
    exampleLabel: 'Employee lookup contract', example: 'GET /api/v1/employees/E-101\nAccept: application/json\n\n200 OK\nContent-Type: application/json\n\n{ "id": "E-101", "name": "Dev Patel" }',
    why: 'The HR screen, mobile app, and payroll report can all use the same API contract without connecting directly to the company database.',
    pitfall: 'An API is not the database and it is not only a URL. It includes operations, input and output formats, and expected outcomes.',
    check: { question: 'What does a stable API contract let the server team change?', choices: ['Its internal implementation', 'The meaning of every response without notice', 'The client’s database connection'], answer: 0, feedback: 'The implementation can evolve behind a stable contract so existing clients continue to work.' },
    takeaway: 'An API is the agreed interface that lets one program ask another for data or actions.',
    steps: [['Client asks', 'The HR dashboard needs employee records and sends a request.'], ['Contract guides both sides', 'The API defines resource names, request formats, and possible replies.'], ['Server handles the request', 'The server checks the request, reads the needed record, and creates a response.'], ['Client uses the result', 'The dashboard turns the JSON representation into a screen for a person.']],
  },
  {
    number: 2, visual: 'layers', lens: 'Style, protocol, implementation',
    explanation: 'REST is an architectural style: a set of constraints for designing networked systems. HTTP is a protocol with request methods, headers, status codes, and message bodies. A framework or server program is an implementation choice; it can help build an API, but it does not define REST.',
    exampleLabel: 'Three different things', example: 'Design style: REST constraints\nWire protocol: HTTP\nResource: /api/v1/employees/E-101\nOperation: GET\nImplementation: any server code that honors the contract',
    why: 'Keeping these terms separate makes it easier to understand APIs built with different languages and server tools.',
    pitfall: 'Using HTTP does not automatically make an API RESTful. The resource model and architectural constraints matter too.',
    check: { question: 'Which item describes the rules carried in an HTTP request?', choices: ['REST', 'HTTP', 'A server framework'], answer: 1, feedback: 'HTTP defines the request and response protocol. REST is a design style that can use HTTP.' },
    takeaway: 'REST is an architectural style. HTTP is a protocol commonly used to carry REST interactions.',
    steps: [['REST style', 'A set of architectural constraints for networked systems.'], ['HTTP protocol', 'The message rules that carry methods, headers, status codes, and bodies.'], ['Resource design', 'URIs identify resources and standard methods describe the requested operation.'], ['Implementation choice', 'Server code can change while the API contract stays stable.']],
  },
  {
    number: 3, visual: 'cycle', lens: 'One request, one response',
    explanation: 'HTTP follows a request-response pattern. A client sends a request line and headers, with a body when the operation needs input. The server returns a status line and response headers, then usually a body. The client should use the status and headers before assuming the body shape.',
    exampleLabel: 'Read one employee', example: 'GET /api/v1/employees/E-101 HTTP/1.1\nHost: api.northstar.example\nAccept: application/json\n\n--- response ---\nHTTP/1.1 200 OK\nContent-Type: application/json\n\n{ "id": "E-101", "name": "Dev Patel" }',
    why: 'The same cycle works for browsers, mobile apps, command-line tools, and services talking to other services.',
    pitfall: 'A body is optional. GET requests commonly have no body; POST, PUT, and PATCH often carry one.',
    check: { question: 'Which part tells the client whether the request succeeded?', choices: ['The response status code', 'The JSON field order', 'The request URL hostname alone'], answer: 0, feedback: 'The status code communicates the broad outcome, such as 200, 404, or 500.' },
    takeaway: 'The client sends an explicit request, then interprets the server response.',
    steps: [['Request line', 'GET /employees/E-101 HTTP/1.1 identifies the method, target, and protocol version.'], ['Request headers', 'Accept: application/json describes a format the client can read.'], ['Optional body', 'POST, PUT, or PATCH can carry JSON data to create or change a resource.'], ['Response', 'HTTP/1.1 200 OK is followed by response headers and the representation.']],
  },
  {
    number: 4, visual: 'constraints', lens: 'Six REST constraints',
    explanation: 'REST is defined by a set of constraints that shape the whole system: client-server separation, stateless requests, cacheable responses, a uniform interface, and a layered system. Code on demand is optional. Together these constraints support independent clients and servers and predictable communication.',
    exampleLabel: 'A request through the system', example: 'HR browser -> gateway -> employee service -> data store\nEach request carries its needed context.\nThe response declares whether it can be cached.',
    why: 'The constraints encourage systems that can scale across multiple clients and server layers while keeping the interface consistent.',
    pitfall: 'A service can use REST-inspired ideas without satisfying every constraint. Learn the formal constraints before labeling an architecture REST.',
    check: { question: 'Which REST constraint is optional?', choices: ['Statelessness', 'Code on demand', 'Client-server separation'], answer: 1, feedback: 'Code on demand is optional; the other listed constraints are part of REST.' },
    takeaway: 'REST combines the constraints; code on demand is the one optional constraint.',
    steps: [['Client-server', 'Separate user interface concerns from data and service concerns.'], ['Stateless', 'Each request carries the context needed to understand it.'], ['Cacheable', 'Responses state whether they may be reused.'], ['Uniform interface', 'Use resource identifiers, representations, and consistent operations.'], ['Layered system', 'Gateways and services can sit between the client and data.'], ['Code on demand', 'A server may send executable code; this constraint is optional.']],
  },
  {
    number: 5, visual: 'uri', lens: 'Model nouns as resources',
    explanation: 'A resource is a useful concept the API exposes, such as an employee, department, or attendance record. A path identifies the collection or one item. Query parameters refine a collection request with filtering, sorting, or pagination; they do not usually change which resource the path names.',
    exampleLabel: 'Read one filtered page', example: 'https://api.northstar.example/api/v1/employees?department=Engineering&page=1&limit=5\n\nPath: /api/v1/employees\nQuery: department=Engineering, page=1, limit=5',
    why: 'Consistent resource paths make APIs easier to explore and let standard HTTP methods carry the action.',
    pitfall: 'Avoid action paths such as /getEmployee or /createEmployee. Prefer resource nouns and use the method to express intent.',
    check: { question: 'Where should a department filter for an employee collection go?', choices: ['In the query string', 'As an action verb in the path', 'In the HTTP version'], answer: 0, feedback: 'The collection path identifies employees; the query string refines which employees are returned.' },
    takeaway: 'The path identifies a resource; query parameters refine a collection request.',
    steps: [['Domain concept', 'An employee is a resource with a stable identifier.'], ['Collection', '/api/v1/employees names the employee collection.'], ['Item', '/api/v1/employees/E-101 identifies one employee.'], ['Query', '?department=Engineering&page=1 refines or paginates the collection.']],
  },
  {
    number: 6, visual: 'crud', lens: 'Standard methods express intent',
    explanation: 'The HTTP method and resource URI work together. GET reads, QUERY reads with structured criteria in a request body, POST commonly creates in a collection, PUT replaces a full representation, PATCH applies a partial change, and DELETE removes a resource. QUERY is safe and idempotent, but each target server must support it; its body needs a Content-Type.',
    exampleLabel: 'CRUD methods plus a structured query', example: 'GET    /api/v1/employees?department=Engineering  Simple filter\nQUERY  /api/v1/employees                      Structured query\nContent-Type: application/json\n{ "filter": { "department": "Engineering" }, "limit": 5 }\nPOST   /api/v1/employees                      Create in collection\nPUT    /api/v1/employees/E-101                Replace item\nPATCH  /api/v1/employees/E-101                Change selected fields\nDELETE /api/v1/employees/E-101                Remove item',
    why: 'Using standard methods lets clients reuse familiar HTTP behavior instead of learning a new verb for every endpoint.',
    pitfall: 'QUERY is not a CRUD write and is not automatically supported by every server. Use GET for simple URI filters; use QUERY when the target supports it and structured or larger criteria belong in a request body.',
    check: { question: 'What distinguishes QUERY from a simple GET collection request?', choices: ['QUERY carries structured query input in a body and is safe and idempotent', 'QUERY always changes the resource', 'QUERY is supported by every HTTP server'], answer: 0, feedback: 'QUERY carries query input in request content. It is safe and idempotent, but the target has to support the method.' },
    takeaway: 'QUERY is a standardized read method for sending structured query input in a body; server support and Content-Type matter.',
    steps: [['Read with GET', 'GET /employees?department=Engineering is a good fit for simple filters.'], ['Send a structured query', 'QUERY /employees puts richer criteria in request content instead of a long URI.'], ['Declare the body format', 'Content-Type: application/json tells the server how to parse the query document.'], ['Read without changing state', 'QUERY is safe and idempotent, so the operation is intended to leave resources unchanged.'], ['Check server support', 'QUERY is standardized, but a target that does not support it can reject it.'], ['Write with CRUD methods', 'POST, PUT, PATCH, and DELETE express create and change operations.']],
  },
  {
    number: 7, visual: 'anatomy', lens: 'Read the message shape',
    explanation: 'An HTTP message is structured rather than free-form text. Its start line begins the request or response. Headers provide metadata. A blank line marks the end of headers, and an optional body follows. For JSON, Content-Type identifies the body format.',
    exampleLabel: 'Request and response anatomy', example: 'PATCH /api/v1/employees/E-101 HTTP/1.1  <- request line\nAccept: application/json                 <- response format wanted\nContent-Type: application/json            <- request body format\n                                               <- blank line\n{ "department": "Design" }               <- request body\n\nHTTP/1.1 200 OK                           <- status line\nContent-Type: application/json\n\n{ "id": "E-101", "department": "Design" }',
    why: 'Once you can read the message boundaries, you can debug malformed requests and understand what the server actually returned.',
    pitfall: 'Accept and Content-Type answer different questions: what the client can receive versus what format the current body uses.',
    check: { question: 'Which header describes the format of the JSON body being sent?', choices: ['Accept', 'Content-Type', 'Location'], answer: 1, feedback: 'Content-Type describes the body format. Accept advertises response formats the client can handle.' },
    takeaway: 'Each message has a start line, headers, a blank line, and sometimes a body.',
    steps: [['Start line', 'The request line or status line identifies the operation or outcome.'], ['Headers', 'Metadata such as Accept and Content-Type describes message expectations and format.'], ['Blank line', 'The blank line separates headers from the body.'], ['Request body', 'A JSON body can carry values to create or update.'], ['Response body', 'The server returns a representation when the response has one.']],
  },
  {
    number: 8, visual: 'retries', lens: 'Separate safety from idempotency',
    explanation: 'A safe method is not intended to change server state; GET is the key example. An idempotent method has the same intended final effect when repeated; PUT and DELETE are idempotent by HTTP semantics. POST is not inherently idempotent, so retrying after a timeout can create duplicates.',
    exampleLabel: 'Timeout after an employee create', example: 'POST /api/v1/employees\nIdempotency-Key: onboarding-7842\n\nFirst attempt: employee created, response lost\nRetry: server recognizes the key and returns the original result',
    why: 'Networks can fail after the server has completed work. Safe retry behavior helps clients recover without guessing whether an operation happened.',
    pitfall: 'An idempotency key is an application design pattern, not an automatic property added to every POST. Define its scope and retention behavior.',
    check: { question: 'Which statement best describes idempotency?', choices: ['The request never changes state', 'Repeating it has the same intended final effect', 'The server always returns the same status code'], answer: 1, feedback: 'Idempotency describes the intended effect on server state. A repeated request may return a different status.' },
    takeaway: 'Safety is about intended side effects. Idempotency is about the intended final effect after repetition.',
    steps: [['GET is safe', 'Reading an employee is not intended to change server state.'], ['PUT is idempotent', 'Sending the same replacement twice leaves the same intended final state.'], ['POST can duplicate', 'Repeating a create may create another employee.'], ['Key controls retry', 'A server can recognize a retry and return the first result without a duplicate.']],
  },
  {
    number: 9, visual: 'statuses', lens: 'Status guides the next action',
    explanation: 'The first digit groups the outcome: 2xx means success, 3xx relates to redirection, 4xx indicates a request or client-side problem, and 5xx means the server failed to fulfill an apparently valid request. Specific codes make the next client action clearer.',
    exampleLabel: 'Common outcomes', example: '201 Created  -> show the new resource; inspect Location\n204 No Content -> show success; do not parse a body\n400 Bad Request -> let the user correct input\n404 Not Found -> show that the resource is unavailable\n500 Internal Server Error -> show safe detail and a request ID',
    why: 'Clients can respond consistently to machine-readable outcomes while presenting helpful language to people.',
    pitfall: 'Do not return 200 for every result and hide failures in a JSON field. The HTTP status is part of the API contract.',
    check: { question: 'A create request succeeds and returns the new employee. Which status is the clearest standard choice?', choices: ['200 OK', '201 Created', '404 Not Found'], answer: 1, feedback: '201 Created communicates that the request created a resource; a Location header can identify it.' },
    takeaway: 'The status code is the machine-readable outcome; clients use it to decide what to do next.',
    steps: [['2xx success', 'The request succeeded; 201 specifically reports a created resource.'], ['3xx redirect', 'The client may need to follow another location.'], ['4xx request problem', 'The client may need to correct input, permissions, or the target URI.'], ['5xx server failure', 'Show a safe message and use a request ID to help support investigate.']],
  },
  {
    number: 10, visual: 'negotiation', lens: 'Negotiate a representation',
    explanation: 'A resource can have more than one representation. The client uses Accept to describe response formats it can handle. The server chooses a supported format and declares it with Content-Type. A request body has its own Content-Type because it describes what the client sent.',
    exampleLabel: 'Ask for a CSV report', example: 'GET /api/v1/employees\nAccept: text/csv\n\n200 OK\nContent-Type: text/csv\n\nid,name,department\nE-101,Dev Patel,Engineering',
    why: 'Negotiation lets a client request a format suited to its job while the same resource remains available through one contract.',
    pitfall: 'Accept does not label the request body. If a client sends JSON, it should set Content-Type: application/json.',
    check: { question: 'Which header tells the server that a client can receive CSV?', choices: ['Accept: text/csv', 'Content-Type: text/csv on an empty GET', 'Location: text/csv'], answer: 0, feedback: 'Accept advertises acceptable response formats. The response Content-Type confirms the format selected.' },
    takeaway: 'Accept describes what the client can receive. Content-Type describes the body format.',
    steps: [['Client lists formats', 'Accept: application/json, text/csv tells the server what the client can read.'], ['Server chooses', 'The API selects one supported representation for this request.'], ['Response labels it', 'Content-Type tells the client how to interpret the response body.'], ['Client parses', 'The client uses a JSON or CSV parser that matches the declared type.']],
  },
  {
    number: 11, visual: 'versions', lens: 'Evolve the contract deliberately',
    explanation: 'An API evolves as products and data needs change. Additive optional fields are often compatible, while renaming or removing a field may break deployed clients. Versioning makes a breaking contract change visible, and a migration plan gives clients time to move.',
    exampleLabel: 'A breaking field rename', example: 'v1 response: { "name": "Dev Patel", "jobTitle": "Engineer" }\nv2 response: { "displayName": "Dev Patel", "role": "Engineer" }\n\nKeep v1 available while clients migrate to v2.',
    why: 'Many clients are deployed outside the API team’s control. A planned transition reduces outages and rushed upgrades.',
    pitfall: 'A version number alone does not make an API stable. Publish compatibility rules, deprecation dates, and migration guidance.',
    check: { question: 'Which change is most likely to break an existing client?', choices: ['Adding a documented optional field', 'Renaming name to displayName and removing name', 'Adding a new resource endpoint'], answer: 1, feedback: 'Existing clients may still read name, so removing or renaming it is a breaking change.' },
    takeaway: 'Versioning makes breaking representation changes visible so clients can migrate safely.',
    steps: [['Existing v1', 'Current clients depend on stable fields such as name and jobTitle.'], ['Breaking change found', 'A field rename can break clients that still read the old name.'], ['Publish v2', 'A new contract can expose displayName while v1 remains available.'], ['Migrate and retire', 'Give clients guidance and time before removing the old contract.']],
  },
  {
    number: 12, visual: 'problem', lens: 'Make errors useful and safe',
    explanation: 'An error response should have a status that matches the failure and a predictable body that helps the client recover. Problem Details provides a standard shape with fields such as type, title, status, detail, and instance. Keep internal traces and secrets in server-side logs.',
    exampleLabel: 'Validation response', example: 'HTTP/1.1 400 Bad Request\nContent-Type: application/problem+json\n\n{\n  "type": "https://api.example/problems/validation",\n  "title": "Validation failed",\n  "status": 400,\n  "detail": "department is required",\n  "instance": "/api/v1/employees"\n}',
    why: 'A consistent error shape lets clients display a useful message, highlight invalid fields, and include a request reference when asking for help.',
    pitfall: 'Never send a stack trace, SQL query, token, or server secret to the client as the error detail.',
    check: { question: 'Where should a server keep a detailed stack trace?', choices: ['In the public Problem Details response', 'In protected server logs', 'In the Location response header'], answer: 1, feedback: 'Keep diagnostics in protected server logs. Return safe, actionable details and a correlation reference.' },
    takeaway: 'A consistent error explains what happened and how to correct it without exposing internals.',
    steps: [['Invalid input arrives', 'The client sends a missing or malformed field.'], ['Choose a meaningful status', '400 Bad Request tells the client that it should correct the request.'], ['Return Problem Details', 'Use a consistent type, title, status, detail, and instance shape.'], ['Recover safely', 'Show an actionable message and request ID; keep traces in server logs.']],
  },
  {
    number: 13, visual: 'quality', lens: 'Turn pitfalls into reliable design',
    explanation: 'Good API design is a collection of small, consistent decisions: noun-based resource paths, documented method semantics, bounded collections, truthful status codes, and stable representations. These choices reduce guesswork for every client.',
    exampleLabel: 'Replace an action endpoint', example: 'Hard to reuse: POST /api/v1/createEmployee\nClearer:       POST /api/v1/employees\n\nFor a large collection:\nGET /api/v1/employees?page=1&limit=20',
    why: 'Predictable conventions lower client complexity and make an API easier to document, test, and extend.',
    pitfall: 'Consistency matters more than a clever endpoint. If two similar resources behave differently, explain why in the contract.',
    check: { question: 'What is the main reason to paginate a large collection?', choices: ['Keep response size and work bounded', 'Turn GET into a write operation', 'Hide the resource identifier'], answer: 0, feedback: 'Pagination bounds the size of a response and gives clients control over how much data to request.' },
    takeaway: 'Noun-based resources, standard methods, bounded collections, and honest statuses make APIs predictable.',
    steps: [['Spot the trap', 'POST /createEmployee puts an action verb in the path.'], ['Name the resource', 'Use POST /employees; the method already expresses the action.'], ['Bound the collection', 'Add pagination rather than returning an unbounded list.'], ['Keep outcomes honest', 'Use an HTTP status that matches the result.']],
  },
  {
    number: 14, visual: 'reference', lens: 'Keep the essentials at hand',
    explanation: 'When designing or reading an endpoint, check four things: what resource the URI identifies, which method expresses the operation, what status reports the outcome, and which headers describe the message. Then confirm the request and response examples match that contract.',
    exampleLabel: 'A quick design scan', example: 'Resource: /api/v1/employees/E-101\nMethod:   PATCH\nInput:    Content-Type: application/json\nSuccess:  200 OK with employee representation\nError:    400 Problem Details for invalid fields',
    why: 'A small checklist catches mismatches before code is written and gives teams a shared language during review.',
    pitfall: 'A quick reference is a starting point, not a substitute for checking the exact HTTP semantics and API-specific contract.',
    check: { question: 'For a new resource created by POST, which response header commonly points to it?', choices: ['Location', 'Accept', 'ETag only'], answer: 0, feedback: 'Location commonly identifies the newly created resource after a 201 Created response.' },
    takeaway: 'Choose the URI, method, status, and headers that fit the interaction.',
    steps: [['URI', 'Use a noun and stable identifier, such as /employees/E-101.'], ['Method', 'Choose GET, POST, PUT, PATCH, or DELETE by intended operation.'], ['Status', 'Use a success or failure status that matches the result.'], ['Headers', 'Use Accept, Content-Type, Cache-Control, Location, and ETag deliberately.']],
  },
  {
    number: 15, visual: 'blueprint', lens: 'Design a complete interaction',
    explanation: 'Designing an API means connecting every layer of the interaction: choose the resource, choose the method, define the representation, specify success and failure responses, and decide what happens when a client retries. Each decision should fit the same clear contract.',
    exampleLabel: 'Create an employee, end to end', example: 'POST /api/v1/employees\nContent-Type: application/json\nIdempotency-Key: hr-onboard-7842\n\n{ "name": "Aarav Shah", "jobTitle": "Backend Developer", "department": "Engineering" }\n\n201 Created\nLocation: /api/v1/employees/E-141\n{ "id": "E-141", "name": "Aarav Shah", ... }',
    why: 'A complete contract lets a client implement the happy path and recover from validation errors, timeouts, and duplicate submissions.',
    pitfall: 'Do not design only the success response. Define validation errors, duplicate handling, retry behavior, and how clients find the created resource.',
    check: { question: 'After a successful employee creation, what should the client use to locate the new resource?', choices: ['The Location header or returned resource URI', 'The server stack trace', 'The request Content-Type'], answer: 0, feedback: 'A 201 response commonly includes Location, and the representation can also include the created resource identifier.' },
    takeaway: 'A solid API design ties a resource, method, representation, status, and recovery path together.',
    steps: [['Choose the resource', 'Model the employee collection and one employee item.'], ['Choose the operation', 'Use POST to create, GET to read, and PATCH for a partial update.'], ['Specify the contract', 'Define JSON fields, status codes, and useful response headers.'], ['Plan recovery', 'Handle validation errors and make uncertain retries safe.']],
  },
]

const VISUAL_TITLES = {
  1: 'The API contract connects a client to a service',
  2: 'Design style, wire protocol, and implementation are separate layers',
  3: 'An HTTP request travels to the server and a response returns',
  4: 'REST constraints shape the system as a whole',
  5: 'A URI has a resource path and optional query parameters',
  6: 'HTTP methods map to distinct resource operations',
  7: 'Headers and bodies sit on opposite sides of the blank line',
  8: 'Retries can repeat an operation after a response is lost',
  9: 'The status family points the client toward its next action',
  10: 'The client and server agree on a representation format',
  11: 'Clients can migrate from a stable v1 contract to v2',
  12: 'A useful error separates public details from private diagnostics',
  13: 'Replace confusing API choices with consistent patterns',
  14: 'Review URI, method, status, and headers together',
  15: 'A complete API design connects every part of the interaction',
}

function LessonVisual({ lesson, step, reduceMotion }) {
  const active = (index) => step === index
  const shown = (index) => step >= index
  const motionState = (index) => ({
    animate: { opacity: active(index) ? 1 : shown(index) ? 0.88 : 0.58, scale: active(index) ? 1.025 : 1, y: active(index) ? -2 : 0 },
    transition: { duration: reduceMotion ? 0 : 0.3 },
    className: `rest-visual-card ${active(index) ? 'is-active' : ''} ${shown(index) ? 'is-shown' : ''}`,
  })
  const dot = (index) => <span className={`rest-visual-dot ${active(index) ? 'active' : shown(index) ? 'passed' : ''}`} aria-hidden="true">{shown(index) ? '✓' : String(index + 1).padStart(2, '0')}</span>

  let scene
  switch (lesson.visual) {
    case 'contract':
      scene = <div className="rest-visual-flow rest-visual-contract">
        <motion.div {...motionState(0)} className={`rest-visual-card ${active(0) || active(3) ? 'is-active' : shown(0) ? 'is-shown' : ''}`}><span className="rest-visual-icon">CLIENT</span><b>HR dashboard</b><small>{active(3) ? 'Uses the returned employee data' : 'Needs an employee record'}</small></motion.div><span className="rest-visual-arrow">request →</span>
        <motion.div {...motionState(1)}><span className="rest-visual-icon contract-icon">CONTRACT</span><b>API agreement</b><small>URI · method · format · outcome</small></motion.div><span className="rest-visual-arrow return-arrow">← response</span>
        <motion.div {...motionState(2)}><span className="rest-visual-icon server-icon">SERVER</span><b>Employee service</b><small>Finds data and formats a reply</small></motion.div>
        <motion.span className="rest-visual-packet" animate={{ left: `${[8, 40, 67, 92][step] ?? 8}%` }} transition={{ duration: reduceMotion ? 0 : 0.65 }}>GET · JSON</motion.span>
        <div className="rest-visual-outcome">{step < 3 ? 'A response becomes data the client can use' : '200 OK · employee representation received'}</div>
      </div>
      break
    case 'layers':
      scene = <div className="rest-visual-layer-stack">
        {[['REST DESIGN STYLE', 'Constraints for resource-oriented interactions', 'resources · uniform interface · stateless'], ['HTTP PROTOCOL', 'Rules for request and response messages', 'GET · headers · 200 OK · body'], ['SERVER IMPLEMENTATION', 'Code and infrastructure chosen by the team', 'language · runtime · storage'], ['PUBLIC CONTRACT', 'The stable agreement used by every client', 'resource · method · representation · response']].map(([name, detail, tags], index) => <motion.div key={name} {...motionState(Math.min(index, 3))}><b>{name}</b><p>{detail}</p><small>{tags}</small></motion.div>)}
        <div className="rest-visual-layer-note">A REST API can use HTTP without being tied to one server framework.</div>
      </div>
      break
    case 'cycle':
      scene = <div className="rest-visual-cycle">
        <motion.div {...motionState(0)}><span>REQUEST</span><b>GET /employees/E-101</b><small>Accept: application/json</small><code>No body needed for this read</code></motion.div>
        <motion.div {...motionState(2)} className={`rest-visual-card rest-visual-server-node ${active(2) ? 'is-active' : ''} ${shown(2) ? 'is-shown' : ''}`}><span>API SERVER</span><b>Find resource</b><small>Build response</small></motion.div>
        <motion.div {...motionState(3)}><span>RESPONSE</span><b>200 OK</b><small>Content-Type: application/json</small><code>{'{ "id": "E-101", "name": "Dev Patel" }'}</code></motion.div>
        <motion.i className="rest-cycle-packet request-packet" animate={{ left: step < 2 ? `${18 + step * 24}%` : '50%', opacity: step < 3 ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.55 }} />
        <motion.i className="rest-cycle-packet response-packet" animate={{ left: step >= 3 ? '82%' : '50%', opacity: step >= 3 ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.55 }} />
      </div>
      break
    case 'constraints':
      scene = <div className="rest-visual-constraints">
        {CONSTRAINTS.map((item, index) => <motion.div key={item.id} {...motionState(index)}><span>{dot(index)}</span><b>{item.title.replace(' · optional', '')}</b><small>{item.plain}</small>{index === 5 && <i>OPTIONAL</i>}</motion.div>)}
        <p className="rest-visual-constraint-center">REST system<br /><b>consistent interaction</b></p>
      </div>
      break
    case 'uri':
      scene = <div className="rest-visual-uri">
        <p className="rest-visual-caption-label">REQUEST TARGET</p>
        <div className="rest-uri-segments"><span className={active(0) ? 'selected' : ''}>https://api.northstar.example</span><b>/</b><span className={active(1) ? 'selected' : ''}>api/v1</span><b>/</b><span className={active(2) ? 'selected' : ''}>employees</span><b>/</b><span className={active(3) ? 'selected' : ''}>E-101</span><em>?department=Engineering&amp;page=1</em></div>
        <div className="rest-uri-labels">{[['Origin', 0], ['Version prefix', 1], ['Collection', 2], ['Item identifier + query', 3]].map(([label, index]) => <div key={label} className={active(index) ? 'is-active' : ''}><span />{label}</div>)}</div>
        <p className="rest-uri-rule">Path identifies the resource · query string filters or pages a collection</p>
      </div>
      break
    case 'crud':
      scene = <div className="rest-visual-crud">
        {[['POST', 'Create', 'Collection', '201 Created'], ['GET', 'Read', 'Item or collection', '200 OK'], ['QUERY', 'Structured read', 'Collection + JSON body', '200 OK'], ['PUT', 'Replace all fields', 'Item', '200 OK'], ['PATCH', 'Change selected fields', 'Item', '200 OK'], ['DELETE', 'Remove', 'Item', '204 No Content']].map(([method, action, target, result], index) => <motion.div key={method} {...motionState(index)}><b className={`method-${method.toLowerCase()}`}>{method}</b><span className="crud-arrow">→</span><strong>{action}</strong><small>{target}</small><code>{result}</code></motion.div>)}
      </div>
      break
    case 'anatomy':
      scene = <div className="rest-visual-messages">
        <div><h4>REQUEST</h4>{[['Start line', 'PATCH /employees/E-101 HTTP/1.1'], ['Headers', 'Content-Type: application/json'], ['Blank line', 'Header/body boundary'], ['Body', '{ "department": "Design" }']].map(([label, text], index) => <motion.div key={label} {...motionState(Math.min(index, 2))}><b>{label}</b><code>{text}</code></motion.div>)}</div>
        <div className="message-separator">server processes request ↓</div>
        <div><h4>RESPONSE</h4>{[['Status line', 'HTTP/1.1 200 OK'], ['Headers', 'Content-Type: application/json'], ['Blank line', 'Header/body boundary'], ['Body', '{ "id": "E-101", ... }']].map(([label, text], index) => <motion.div key={label} {...motionState(index === 0 ? 3 : 4)}><b>{label}</b><code>{text}</code></motion.div>)}</div>
      </div>
      break
    case 'retries':
      scene = <div className="rest-visual-retries">
        <motion.div {...motionState(0)}><b>GET · SAFE</b><p>Read employee</p><div className="state-pills"><span>Attempt 1: E-101</span><span>Attempt 2: E-101</span></div><small>No intended write</small></motion.div>
        <motion.div {...motionState(1)}><b>PUT · IDEMPOTENT</b><p>Set department to Design</p><div className="state-pills"><span>Attempt 1: Design</span><span>Attempt 2: Design</span></div><small>Same intended final state</small></motion.div>
        <motion.div {...motionState(2)}><b>POST · RETRY RISK</b><p>Create employee</p><div className="state-pills"><span>Without key: E-141</span><span className={step >= 3 ? 'deduped' : ''}>{step >= 3 ? 'With key: original result' : 'Retry may create E-142'}</span></div><small>{step >= 3 ? 'Same key lets server deduplicate' : 'Response may be lost after the write'}</small></motion.div>
        {step >= 3 && <motion.div className="rest-retry-key" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>Idempotency-Key: hr-onboard-7842</motion.div>}
      </div>
      break
    case 'statuses':
      scene = <div className="rest-visual-statuses">
        {[['2xx', 'Success', '201 Created · show new employee', 'success'], ['3xx', 'Redirect', 'Follow a Location when appropriate', 'redirect'], ['4xx', 'Request problem', '400 invalid input · correct request', 'client'], ['5xx', 'Server failure', '500 failed · show safe message', 'server']].map(([family, label, next, color], index) => <motion.div key={family} {...motionState(index)} className={`rest-status-lane ${color} ${active(index) ? 'is-active' : ''}`}><b>{family}</b><span className="status-track"><i /></span><strong>{label}</strong><small>{next}</small></motion.div>)}
        <div className="rest-status-next">STATUS → CLIENT NEXT ACTION</div>
      </div>
      break
    case 'negotiation':
      scene = <div className="rest-visual-negotiation">
        <motion.div {...motionState(0)} className={`rest-visual-card ${(active(0) || active(3)) ? 'is-active' : shown(0) ? 'is-shown' : ''}`}><b>CLIENT ACCEPTS</b><code>application/json</code><code>text/csv</code><small>{active(3) ? 'Choose a parser from response Content-Type' : 'Advertise formats the client can read'}</small></motion.div><span>→</span>
        <motion.div {...motionState(1)}><b>SERVER SELECTS</b><div className="format-choice"><span className={step >= 2 ? 'format-selected' : ''}>{step >= 2 ? 'CSV selected' : 'Choose supported type'}</span></div></motion.div><span>→</span>
        <motion.div {...motionState(2)}><b>RESPONSE DECLARES</b><code>Content-Type: {step >= 2 ? 'text/csv' : 'application/json'}</code><pre>{step >= 2 ? 'id,name\nE-101,Dev Patel' : '{ "id": "E-101" }'}</pre></motion.div>
        <p>Accept = what the client can read · Content-Type = what this body contains</p>
      </div>
      break
    case 'versions':
      scene = <div className="rest-visual-versions">
        <div className="version-clients"><motion.div {...motionState(0)}>HR dashboard<br /><small>reads name</small></motion.div><motion.div {...motionState(0)}>Mobile portal<br /><small>reads name</small></motion.div></div>
        <div className="version-branch"><span>BREAKING CHANGE</span><i /><i /></div>
        <div className="version-contracts"><motion.div {...motionState(0)}><b>API v1 · supported</b><code>{'{ "name": "Dev Patel" }'}</code><small>Existing clients keep working</small></motion.div><motion.div {...motionState(2)}><b>API v2 · new contract</b><code>{'{ "displayName": "Dev Patel" }'}</code><small>New clients migrate when ready</small></motion.div></div>
        <div className="version-plan">{[['1', 'Announce'], ['2', 'Migrate'], ['3', 'Deprecate'], ['4', 'Retire']].map(([number, title], index) => <span className={shown(index) ? 'is-active' : ''} key={title}>{number} · {title}</span>)}</div>
      </div>
      break
    case 'problem':
      scene = <div className="rest-visual-problem">
        <div className="problem-response-head"><b>400 Bad Request</b><span>application/problem+json</span></div>
        {[['type', 'https://api.example/problems/validation', 2], ['title', 'Validation failed', 2], ['status', '400', 1], ['detail', 'department is required', 2], ['instance', '/api/v1/employees', 2]].map(([key, value, index]) => <motion.div key={key} {...motionState(index)}><b>{key}</b><code>{JSON.stringify(value)}</code><small>{key === 'detail' ? 'Actionable explanation' : key === 'status' ? 'Matches HTTP response' : key === 'instance' ? 'Request location' : 'Problem identification'}</small></motion.div>)}
        <motion.div {...motionState(3)} className={`problem-private ${active(3) ? 'is-active' : ''}`}><b>PRIVATE SERVER LOG</b><span>Stack trace · SQL · credentials stay here</span><i>Never include in public response</i></motion.div>
      </div>
      break
    case 'quality':
      scene = <div className="rest-visual-quality">
        {[['ACTION IN URI', 'POST /createEmployee', 'NOUN RESOURCE', 'POST /employees'], ['UNBOUNDED LIST', 'GET /employees', 'PAGED COLLECTION', 'GET /employees?page=1&limit=20'], ['HIDDEN FAILURE', '200 { "error": true }', 'HONEST STATUS', '404 + clear error body'], ['BREAKING CHANGE', 'Remove name silently', 'PLANNED EVOLUTION', 'Document, migrate, deprecate']].map(([problem, bad, fix, good], index) => <motion.div key={problem} {...motionState(index)}><span>{problem}</span><code className="quality-bad">{bad}</code><b>↓ {fix}</b><code className="quality-good">{good}</code></motion.div>)}
      </div>
      break
    case 'reference':
      scene = <div className="rest-visual-reference">
        {[
          ['01', 'RESOURCE URI', '/employees/E-101', 'Name the thing'],
          ['02', 'HTTP METHOD', 'PATCH', 'Describe the operation'],
          ['03', 'STATUS', '200 OK', 'Report the outcome'],
          ['04', 'HEADERS', 'Content-Type', 'Describe the message'],
        ].map(([number, title, value, note], index) => <motion.div key={title} {...motionState(index)}><span>{number}</span><b>{title}</b><code>{value}</code><small>{note}</small></motion.div>)}
        <div className="reference-joined">One coherent API interaction</div>
      </div>
      break
    case 'blueprint':
      scene = <div className="rest-visual-blueprint">
        {[
          ['RESOURCE', '/employees', 'collection'],
          ['METHOD', 'POST', 'create'],
          ['REPRESENTATION', 'JSON body', 'employee fields'],
          ['OUTCOME', '201 Created', 'Location + resource'],
          ['RECOVERY', 'same idempotency key', 'no duplicate on retry'],
        ].map(([title, value, note], index) => <motion.div key={title} {...motionState(Math.min(index, 3))}><span>{dot(Math.min(index, 3))}</span><b>{title}</b><code>{value}</code><small>{note}</small></motion.div>)}
        <div className="blueprint-wire" aria-hidden="true" />
        <div className="blueprint-result">Complete contract · clear success · safe recovery</div>
      </div>
      break
    default:
      scene = null
  }

  return <section className={`rest-lesson-visual rest-lesson-visual-${lesson.visual}`} aria-label={VISUAL_TITLES[lesson.number]}>
    <div className="rest-lesson-visual-head"><div><span>LESSON MODEL</span><h3>{VISUAL_TITLES[lesson.number]}</h3></div><span className="rest-visual-live"><i /> STEP {String(step + 1).padStart(2, '0')}</span></div>
    <div className="rest-lesson-visual-canvas">{scene}</div>
  </section>
}

const MISSIONS = [
  { id: 'inspect', title: 'Find one employee', detail: 'Retrieve E-101 and identify where the resource URI ends and the query string begins.', topic: 5, request: { method: 'GET', path: '/api/v1/employees/E-101' }, matches: (request, result) => request.method === 'GET' && request.path.includes('/employees/E-101') && result.status === 200, reward: 100 },
  { id: 'create', title: 'Onboard a teammate', detail: 'Create a resource with POST and inspect the 201 response and Location header.', topic: 6, request: { method: 'POST', path: '/api/v1/employees', body: '{\n  "name": "Aarav Shah",\n  "jobTitle": "Backend Developer",\n  "department": "Engineering"\n}' }, matches: (request, result) => request.method === 'POST' && request.path.endsWith('/employees') && result.status === 201, reward: 120 },
  { id: 'retry', title: 'Make a retry safe', detail: 'Replace E-101 using PUT, then replay the same request and compare the stored state.', topic: 8, request: { method: 'PUT', path: '/api/v1/employees/E-101', body: '{\n  "name": "Dev Patel",\n  "jobTitle": "Frontend Engineer",\n  "department": "Engineering"\n}' }, matches: (request, result) => request.method === 'PUT' && result.status === 200, reward: 140 },
  { id: 'negotiate', title: 'Choose a response format', detail: 'Ask for CSV and inspect how Accept changes the representation returned by the server.', topic: 10, request: { method: 'GET', path: '/api/v1/employees', accept: 'text/csv' }, matches: (request, result) => request.accept === 'text/csv' && result.status === 200 && result.contentType.startsWith('text/csv'), reward: 120 },
  { id: 'evolve', title: 'Try the newer API', detail: 'Request v2 and identify the changed representation before a client migrates.', topic: 11, request: { method: 'GET', path: '/api/v2/employees/E-101' }, matches: (request, result) => request.path.includes('/v2/') && result.status === 200, reward: 140 },
  { id: 'recover', title: 'Return a useful error', detail: 'Request a missing resource. Give the client a clear 404 without exposing server internals.', topic: 12, request: { method: 'GET', path: '/api/v1/employees/E-999' }, matches: (request, result) => result.status === 404 && result.body?.type, reward: 160 },
]

function readGameProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(GAME_KEY))
    return { xp: Number(value?.xp) || 0, completed: Array.isArray(value?.completed) ? value.completed.filter((id) => MISSIONS.some((mission) => mission.id === id)) : [] }
  } catch {
    return { xp: 0, completed: [] }
  }
}

function makeRequestState(patch = {}) {
  return { method: 'GET', path: '/api/v1/employees?department=Engineering&page=1&limit=5', accept: 'application/json', contentType: 'application/json', body: '', idempotencyKey: '', simulateFailure: false, ...patch }
}

function makeProblem(status, title, detail, path) {
  return {
    status,
    label: title,
    contentType: 'application/problem+json',
    explanation: detail,
    data: null,
    body: { type: `https://api.northstar.example/problems/${status}`, title, status, detail, instance: path, requestId: `req-${String(Date.now()).slice(-6)}` },
    headers: { 'Content-Type': 'application/problem+json', 'Cache-Control': 'no-store' },
  }
}

function makePipeline(result, request) {
  const stages = [
    { id: 'client', title: 'Client sends request', detail: `${request.method} ${request.path}`, point: 16 },
    { id: 'gateway', title: 'HTTP gateway receives it', detail: `Host: api.northstar.company · Accept: ${request.accept}`, point: 48 },
    { id: 'route', title: 'Router identifies resource', detail: 'The method and URI select a resource operation.', point: 55 },
  ]
  if (result.status === 400 || result.status === 406 || result.status === 415 || result.status === 500) {
    stages.push({ id: 'service', title: 'Request check stops here', detail: result.explanation, point: 58, failed: true })
  } else if (result.status >= 400) {
    stages.push({ id: 'service', title: 'Resource lookup', detail: result.explanation, point: 60, failed: true })
  } else {
    stages.push({ id: 'service', title: `${request.method} behavior`, detail: result.explanation, point: 61 })
    if (result.dataMutation) stages.push({ id: 'database', title: 'Database writes resource', detail: 'The new resource representation is stored.', point: 83 })
    else stages.push({ id: 'database', title: 'Database reads resource', detail: 'The selected resource representation is loaded.', point: 83 })
    if (result.dataMutation) stages.push({ id: 'events', title: `Resource event · ${result.dataMutation.event}`, detail: 'The server can notify audit and other listeners after the write.', point: 71 })
    if (result.status !== 204) stages.push({ id: 'serialize', title: 'Response representation built', detail: `The server formats the result as ${result.contentType}.`, point: 61 })
  }
  stages.push({ id: 'response', title: `${result.status} ${result.label} returns`, detail: 'The response packet travels back to the client.', point: 16 })
  return stages
}

function quoteCsv(value) {
  const string = String(value ?? '')
  return /[",\r\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string
}

function toCsv(rows) {
  if (!rows.length) return ''
  const columns = Object.keys(rows[0]).filter((key) => typeof rows[0][key] !== 'object')
  return [columns.join(','), ...rows.map((row) => columns.map((column) => quoteCsv(row[column])).join(','))].join('\n')
}

function shapeForVersion(value, version) {
  const shape = (employee) => version === 'v2'
    ? { id: employee.id, displayName: employee.name, role: employee.jobTitle, department: employee.department, links: { self: `/api/v2/employees/${employee.id}` } }
    : { id: employee.id, name: employee.name, jobTitle: employee.jobTitle, department: employee.department, email: employee.email }
  return Array.isArray(value) ? value.map(shape) : value && value.id?.startsWith('E-') ? shape(value) : value
}

function evaluateRequest(request, employees, attendance, nextEmployeeNumber, idempotencyCache) {
  let url
  try {
    url = new URL(request.path, 'https://api.northstar.company')
  } catch {
    const problem = makeProblem(400, 'Bad Request', 'The request URI could not be parsed.', request.path)
    return { ...problem, dataMutation: null, data: null }
  }
  if (!request.path.startsWith('/')) {
    const problem = makeProblem(400, 'Bad Request', 'A request target must be an absolute path such as /api/v1/employees.', request.path)
    return { ...problem, dataMutation: null, data: null }
  }
  if (request.simulateFailure) {
    const problem = makeProblem(500, 'Internal Server Error', 'The server could not complete this request. Internal diagnostics are recorded privately.', url.pathname)
    return { ...problem, dataMutation: null, data: null }
  }
  if (request.accept === 'application/xml') {
    const problem = makeProblem(406, 'Not Acceptable', 'This API can return application/json or text/csv, but not application/xml.', url.pathname)
    return { ...problem, dataMutation: null, data: null }
  }
  if (!['application/json', 'text/csv'].includes(request.accept)) {
    const problem = makeProblem(406, 'Not Acceptable', `No representation is available for Accept: ${request.accept}.`, url.pathname)
    return { ...problem, dataMutation: null, data: null }
  }
  if (request.method === 'QUERY' && !request.body.trim()) {
    const problem = makeProblem(400, 'Query Content Required', 'QUERY needs a query document in the request body and a Content-Type that describes it.', url.pathname)
    return { ...problem, dataMutation: null, data: null }
  }
  if (request.method === 'QUERY' && request.contentType !== 'application/json') {
    const problem = makeProblem(415, 'Unsupported Query Format', 'This employee collection accepts QUERY input as application/json. The target can advertise supported formats with Accept-Query.', url.pathname)
    return { ...problem, dataMutation: null, data: null }
  }
  if (request.body.trim() && request.contentType !== 'application/json') {
    const problem = makeProblem(415, 'Unsupported Media Type', `This endpoint expects application/json, not ${request.contentType}.`, url.pathname)
    return { ...problem, dataMutation: null, data: null }
  }

  const match = url.pathname.match(/^\/api\/(v1|v2)\/(employees|departments|attendance|payroll)(?:\/([^/]+))?$/)
  if (!match) {
    const problem = makeProblem(404, 'Not Found', 'No resource matches this URI. Check the collection name and resource identifier.', url.pathname)
    return { ...problem, dataMutation: null, data: null }
  }
  const [, version, resource, identifier] = match
  const method = request.method
  let data = null
  let status = 200
  let label = 'OK'
  let explanation = 'The requested representation was returned.'
  let dataMutation = null
  let bodyValue = null

  const parseBody = () => {
    try {
      return JSON.parse(request.body)
    } catch {
      return null
    }
  }
  const allowedMethods = resource === 'employees' && identifier ? ['GET', 'PUT', 'PATCH', 'DELETE'] : resource === 'employees' ? ['GET', 'QUERY', 'POST'] : resource === 'attendance' ? ['GET', 'POST'] : ['GET']
  if (!allowedMethods.includes(method)) {
    const problem = makeProblem(405, 'Method Not Allowed', `${method} is not supported for this resource. Allowed methods: ${allowedMethods.join(', ')}.`, url.pathname)
    return { ...problem, dataMutation: null, data: null, extraHeaders: { Allow: allowedMethods.join(', ') } }
  }

  if (method === 'POST' && request.idempotencyKey && idempotencyCache.has(request.idempotencyKey)) {
    const cached = idempotencyCache.get(request.idempotencyKey)
    if (cached.fingerprint !== `${request.path}\n${request.body}`) {
      const problem = makeProblem(409, 'Idempotency Key Reused', 'This key was already used for a different request. Use a new key for a different operation.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    return { ...cached.result, dataMutation: null, replayed: true, explanation: 'The idempotency key matched an earlier POST. The server returned the original result without creating a duplicate.', extraHeaders: { ...cached.result.extraHeaders, 'Idempotency-Replayed': 'true' } }
  }

  if (method === 'QUERY') {
    const query = parseBody()
    if (!query || typeof query !== 'object' || Array.isArray(query) || (query.filter !== undefined && (!query.filter || typeof query.filter !== 'object' || Array.isArray(query.filter)))) {
      const problem = makeProblem(400, 'Invalid Query Document', 'Send a JSON object such as { "filter": { "department": "Engineering" }, "page": 1, "limit": 5 }.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    if (resource !== 'employees' || identifier) {
      const problem = makeProblem(404, 'Not Found', 'This training server supports QUERY on the employees collection.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    const departmentFilter = typeof query.filter?.department === 'string' ? query.filter.department.trim() : ''
    const jobTitleFilter = typeof query.filter?.jobTitle === 'string' ? query.filter.jobTitle.trim() : ''
    const selected = employees.filter((employee) => (!departmentFilter || employee.department.toLowerCase() === departmentFilter.toLowerCase()) && (!jobTitleFilter || employee.jobTitle.toLowerCase().includes(jobTitleFilter.toLowerCase())))
    const page = Math.max(1, Math.floor(Number(query.page) || 1))
    const limit = Math.min(20, Math.max(1, Math.floor(Number(query.limit) || 5)))
    const start = (page - 1) * limit
    data = selected.slice(start, start + limit)
    bodyValue = { data: shapeForVersion(data, version), meta: { total: selected.length, page, limit, pages: Math.max(1, Math.ceil(selected.length / limit)) } }
    explanation = `QUERY reads the employee collection using criteria in its JSON request body${departmentFilter ? `, filtered to ${departmentFilter}` : ''}. The method is safe and idempotent; no employee state changed.`
  } else if (method === 'GET') {
    if (resource === 'employees') {
      const selected = identifier ? employees.find((employee) => employee.id === decodeURIComponent(identifier)) : employees.filter((employee) => !url.searchParams.get('department') || employee.department.toLowerCase() === url.searchParams.get('department').toLowerCase())
      if (identifier && !selected) {
        const problem = makeProblem(404, 'Not Found', `Employee ${identifier} does not exist.`, url.pathname)
        return { ...problem, dataMutation: null, data: null }
      }
      if (Array.isArray(selected)) {
        const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
        const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || 5))
        const start = (page - 1) * limit
        data = selected.slice(start, start + limit)
        bodyValue = { data: shapeForVersion(data, version), meta: { total: selected.length, page, limit, pages: Math.max(1, Math.ceil(selected.length / limit)) } }
        explanation = `GET reads the ${selected.length}-item employee collection${url.searchParams.has('department') ? ` filtered to ${url.searchParams.get('department')}` : ''}. Page ${page} returns ${data.length} record${data.length === 1 ? '' : 's'}.`
      } else {
        data = selected
        bodyValue = { data: shapeForVersion(data, version) }
        explanation = 'GET retrieves one employee resource and does not change server state.'
      }
    } else if (resource === 'departments' && !identifier) {
      data = DEPARTMENTS
      bodyValue = { data }
      explanation = 'GET retrieves the department collection.'
    } else if (resource === 'attendance' && !identifier) {
      const departmentFilter = url.searchParams.get('department')
      data = attendance.filter((record) => !departmentFilter || record.department.toLowerCase() === departmentFilter.toLowerCase())
      bodyValue = { data, meta: { total: data.length } }
      explanation = `GET retrieves ${data.length} attendance record${data.length === 1 ? '' : 's'}${departmentFilter ? ` for ${departmentFilter}` : ''}.`
    } else if (resource === 'payroll' && !identifier) {
      data = PAYROLL
      bodyValue = { data }
      explanation = 'GET retrieves the salary representation from the payroll collection.'
    } else {
      const problem = makeProblem(404, 'Not Found', 'No resource exists at this URI.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
  } else if (resource === 'employees' && method === 'POST' && !identifier) {
    if (!request.body.trim()) {
      const problem = makeProblem(400, 'Bad Request', 'POST needs a JSON body with name, jobTitle, and department.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    const payload = parseBody()
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      const problem = makeProblem(400, 'Bad Request', 'The request body is not valid JSON.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    const name = String(payload.name || '').trim()
    const jobTitle = String(payload.jobTitle || '').trim()
    const department = String(payload.department || '').trim()
    if (!name || !jobTitle || !department) {
      const problem = makeProblem(400, 'Validation Failed', 'Provide non-empty name, jobTitle, and department fields.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    if (employees.some((employee) => employee.name.toLowerCase() === name.toLowerCase())) {
      const problem = makeProblem(409, 'Conflict', `An employee named ${name} already exists.`, url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    data = { id: `E-${nextEmployeeNumber}`, name, jobTitle, department, email: `${name.toLowerCase().replace(/\s+/g, '.')}@northstar.example` }
    status = 201
    label = 'Created'
    explanation = 'POST creates a new employee resource in the collection.'
    bodyValue = { data: shapeForVersion(data, version) }
    dataMutation = { type: 'create', value: data, event: 'employee:created' }
  } else if (resource === 'employees' && identifier && ['PUT', 'PATCH'].includes(method)) {
    const current = employees.find((employee) => employee.id === decodeURIComponent(identifier))
    if (!current) {
      const problem = makeProblem(404, 'Not Found', `Employee ${identifier} does not exist.`, url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    if (!request.body.trim()) {
      const problem = makeProblem(400, 'Bad Request', `${method} needs a JSON request body.`, url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    const payload = parseBody()
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      const problem = makeProblem(400, 'Bad Request', 'The request body is not valid JSON.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    const fields = ['name', 'jobTitle', 'department']
    if (method === 'PUT' && fields.some((field) => typeof payload[field] !== 'string' || !payload[field].trim())) {
      const problem = makeProblem(400, 'Validation Failed', 'PUT replaces the resource. Include name, jobTitle, and department.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    if (method === 'PATCH' && (!fields.some((field) => Object.hasOwn(payload, field)) || fields.some((field) => Object.hasOwn(payload, field) && (typeof payload[field] !== 'string' || !payload[field].trim())))) {
      const problem = makeProblem(400, 'Validation Failed', 'PATCH needs at least one supported field: name, jobTitle, or department.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    const updated = method === 'PUT'
      ? { ...current, name: payload.name.trim(), jobTitle: payload.jobTitle.trim(), department: payload.department.trim(), email: `${payload.name.trim().toLowerCase().replace(/\s+/g, '.')}@northstar.example` }
      : { ...current, ...Object.fromEntries(fields.filter((field) => Object.hasOwn(payload, field)).map((field) => [field, String(payload[field]).trim()])) }
    data = updated
    explanation = method === 'PUT' ? 'PUT replaces the selected employee representation. Repeating the same PUT keeps the same final state.' : 'PATCH changes only the fields supplied in the request body.'
    bodyValue = { data: shapeForVersion(updated, version) }
    dataMutation = { type: 'update', id: current.id, value: updated, event: 'employee:updated' }
  } else if (resource === 'employees' && identifier && method === 'DELETE') {
    const current = employees.find((employee) => employee.id === decodeURIComponent(identifier))
    if (!current) {
      const problem = makeProblem(404, 'Not Found', `Employee ${identifier} is already absent. DELETE remains idempotent because the final state is unchanged.`, url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    data = null
    bodyValue = null
    status = 204
    label = 'No Content'
    explanation = `DELETE removes ${current.name}. A retry leaves the employee absent; the repeat may return 404.`
    dataMutation = { type: 'delete', id: current.id, event: 'employee:deleted' }
  } else if (resource === 'attendance' && method === 'POST' && !identifier) {
    const payload = parseBody()
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !String(payload.employeeId || '').trim()) {
      const problem = makeProblem(400, 'Validation Failed', 'Provide a JSON body with an existing employeeId, date, and clockIn.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    const employee = employees.find((item) => item.id === String(payload.employeeId).trim())
    if (!employee) {
      const problem = makeProblem(404, 'Employee Not Found', `Employee ${payload.employeeId} does not exist.`, url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    const date = String(payload.date || '').trim()
    const clockIn = String(payload.clockIn || '').trim()
    if (!date || !clockIn) {
      const problem = makeProblem(400, 'Validation Failed', 'Provide non-empty date and clockIn fields.', url.pathname)
      return { ...problem, dataMutation: null, data: null }
    }
    data = { id: `A-${2032 + attendance.length}`, employeeId: employee.id, name: employee.name, department: employee.department, date, clockIn, status: 'Present' }
    status = 201
    label = 'Created'
    explanation = 'POST creates a new attendance record in the collection.'
    bodyValue = { data }
    dataMutation = { type: 'attendance', value: data, event: 'attendance:recorded' }
  }

  const responseData = resource === 'employees' ? shapeForVersion(data, version) : data
  const wantsCsv = request.accept === 'text/csv' && status !== 204 && responseData !== null
  const contentType = wantsCsv ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8'
  if (wantsCsv) bodyValue = toCsv(Array.isArray(responseData) ? responseData : [responseData])
  const headers = { ...(status === 204 ? {} : { 'Content-Type': contentType }), 'Cache-Control': method === 'GET' ? 'private, max-age=30' : 'no-store' }
  if (resource === 'employees' && !identifier && status < 400) headers['Accept-Query'] = 'application/json'
  const responseContentType = status === 204 ? null : contentType
  if (status !== 204) headers.ETag = `W/"${version}-${String(JSON.stringify(responseData)).length}"`
  if (status === 201) headers.Location = `/api/${version}/${resource}/${data.id}`
  if (status === 204) headers['Content-Length'] = '0'
  if (version === 'v2') headers['API-Version'] = 'v2'
  else headers['API-Version'] = 'v1'
  return { status, label, contentType: responseContentType, explanation, data: responseData, body: bodyValue, headers, dataMutation, extraHeaders: {} }
}

function TableView({ rows, empty = 'No resource data returned.' }) {
  const records = Array.isArray(rows) ? rows : rows && typeof rows === 'object' ? [rows] : []
  const columns = records.length ? Object.keys(records[0]).filter((key) => typeof records[0][key] !== 'object').slice(0, 5) : []
  if (!records.length || !columns.length) return <div className="rest-empty-data">{empty}</div>
  return <div className="max-w-full overflow-x-auto"><table className="rest-data-table"><thead><tr>{columns.map((column) => <th key={column}>{column.replace(/[A-Z]/g, (letter) => ` ${letter}`).toLowerCase()}</th>)}</tr></thead><tbody>{records.map((record, index) => <motion.tr key={record.id || record.employeeId || record.name || index} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}>{columns.map((column) => <td key={column} title={String(record[column])}>{String(record[column] ?? '—')}</td>)}</motion.tr>)}</tbody></table></div>
}

function DataLaptop({ client, request, response, running }) {
  return <div className="rest-laptop-wrap" aria-label="Three-dimensional API client laptop"><div className="rest-laptop">
    <div className="rest-laptop-screen"><div className="rest-laptop-top"><b><i>R</i> REST CLIENT</b><span>{client.toUpperCase()}</span></div><div className="rest-screen-method"><strong>{request.method}</strong><span>{request.path}</span></div><div className="rest-screen-lines"><i /><i /><i /></div><div className={`rest-screen-status ${response?.status >= 400 ? 'is-error' : ''}`}>{running ? 'SENDING REQUEST…' : response ? `${response.status} ${response.label.toUpperCase()}` : 'READY · CLICK SEND'}</div></div>
    <div className="rest-laptop-base"><span /></div>
  </div><div className="rest-world-label"><b>API CLIENT</b><small>{client} · request starts here</small></div></div>
}

function ApiServer({ stage, response }) {
  return <div className="rest-server-wrap" aria-label="Three-dimensional REST API server"><div className="rest-server-side" /><div className="rest-server-face">
    <div className="rest-server-head"><i>R</i><span><b>NORTHSTAR API</b><small>HTTP · RESOURCE ROUTER</small></span><em className={stage ? 'server-led-active' : ''} /></div>
    {['GATEWAY · HTTP', 'ROUTER · URI', 'SERVICE · CRUD', 'SERIALIZER · JSON'].map((unit, index) => <div key={unit} className={`rest-server-unit ${stage && ((index === 0 && stage.id === 'gateway') || (index === 1 && stage.id === 'route') || (index === 2 && stage.id === 'service') || (index === 3 && stage.id === 'serialize')) ? 'active' : ''}`}><small>0{index + 1}</small><span>{unit}</span><i /><i /><i /></div>)}
    <div className="rest-server-foot"><span>REST API</span><b>{stage ? 'PROCESSING' : response ? `${response.status} ${response.label}` : 'LISTENING :443'}</b></div>
  </div><div className="rest-world-label"><b>REST API SERVER</b><small>uniform interface · representations</small></div></div>
}

function DatabaseCylinder({ stage, count }) {
  return <div className={`rest-db-wrap ${stage?.id === 'database' ? 'db-active' : ''}`} aria-label="Three-dimensional API data store"><div className="rest-cylinder"><div className="rest-cylinder-top"><b>DATA</b><small>STORE</small></div><div className="rest-cylinder-band band-a" /><div className="rest-cylinder-band band-b" /><div className="rest-cylinder-band band-c" /><span className="rest-db-lock">▣</span></div><span className="rest-record-count">{count} records</span><div className="rest-world-label"><b>RESOURCE STORE</b><small>employees · departments · more</small></div></div>
}

function HeaderField({ label, value, children }) {
  return <div className="rest-header-field"><span>{label}</span>{children || <b>{value}</b>}</div>
}

function TopicActivityButton({ children, onClick }) {
  return <button type="button" onClick={onClick} className="rest-secondary-button">{children}<span aria-hidden="true"> ↗</span></button>
}

function MethodBadge({ method }) {
  const methodTone = METHODS.find((item) => item.method === method)?.color || 'blue'
  return <span className={`rest-method-badge tone-${methodTone}`}>{method}</span>
}

function methodExample(method) {
  if (method === 'GET') return { method, path: '/api/v1/employees/E-101' }
  if (method === 'QUERY') return { method, path: '/api/v1/employees', body: '{\n  "filter": { "department": "Engineering" },\n  "page": 1,\n  "limit": 5\n}' }
  if (method === 'POST') return { method, path: '/api/v1/employees', body: '{\n  "name": "Aarav Shah",\n  "jobTitle": "Backend Developer",\n  "department": "Engineering"\n}' }
  if (method === 'PUT') return { method, path: '/api/v1/employees/E-101', body: '{\n  "name": "Dev Patel",\n  "jobTitle": "Frontend Engineer",\n  "department": "Engineering"\n}' }
  if (method === 'PATCH') return { method, path: '/api/v1/employees/E-101', body: '{\n  "department": "Product Design"\n}' }
  return { method: 'DELETE', path: '/api/v1/employees/E-140' }
}

function SelfCheckPanel() {
  const questions = [
    { question: 'Which URI identifies one employee resource?', options: ['/api/v1/employees?employeeId=E-101', '/api/v1/employees/E-101', '/api/v1/getEmployee/E-101'], answer: 1, explanation: 'A path segment identifies the item. Query parameters are for collection filtering, sorting, or pagination.' },
    { question: 'Which statement about GET is correct?', options: ['It is safe and should not change server state.', 'It creates a resource when repeated.', 'It is safe only when sent with JSON.'], answer: 0, explanation: 'GET is safe: its intended purpose is to read data without changing server state.' },
    { question: 'What makes QUERY useful for a structured read?', options: ['It carries query input in a body and is safe and idempotent.', 'It always creates a resource.', 'Every server accepts it automatically.'], answer: 0, explanation: 'QUERY carries query content with a declared Content-Type. It is safe and idempotent, but the target must support it.' },
    { question: 'A successful POST creates an employee. Which response is a clear choice?', options: ['200 OK with no Location header', '201 Created with a Location header', '204 No Content with the employee in the body'], answer: 1, explanation: '201 Created communicates that a resource was created. Location can identify the new resource.' },
    { question: 'What does the Accept request header describe?', options: ['The format of the request body', 'The response representation the client can accept', 'The API version number'], answer: 1, explanation: 'Accept describes a response format the client wants, such as application/json or text/csv.' },
    { question: 'A client may retry a POST after losing the response. What helps avoid a duplicate?', options: ['A Cache-Control header', 'An Idempotency-Key the server remembers', 'Changing POST to GET'], answer: 1, explanation: 'A server can remember an idempotency key and return the original result for a safe retry.' },
  ]
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const score = questions.reduce((total, question, index) => total + Number(answers[index] === question.answer), 0)

  return <section className="rest-self-check mt-5 rounded-2xl border border-violet-100/15 bg-violet-200/[0.025] p-4 sm:p-6" aria-label="REST API self-check">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-200">Lesson 15 · self-check</p><h2 className="mt-1 font-display text-xl font-bold text-white">Can you read the API contract?</h2><p className="mt-1 text-xs leading-5 text-white/50">Choose one answer for each scenario, then check your reasoning.</p></div><span className="rounded-lg border border-violet-100/10 px-3 py-2 text-[9px] font-mono text-violet-100/65">6 questions</span></div>
    <div className="mt-4 grid gap-3 lg:grid-cols-2">{questions.map((question, index) => <fieldset key={question.question} className="rest-check-question"><legend><span>{String(index + 1).padStart(2, '0')}</span>{question.question}</legend><div className="mt-2 grid gap-1.5">{question.options.map((option, optionIndex) => {
      const chosen = answers[index] === optionIndex
      const correct = submitted && optionIndex === question.answer
      const incorrect = submitted && chosen && optionIndex !== question.answer
      return <button key={option} type="button" aria-pressed={chosen} onClick={() => { setAnswers((current) => ({ ...current, [index]: optionIndex })); setSubmitted(false) }} className={`rest-check-option ${chosen ? 'chosen' : ''} ${correct ? 'correct' : ''} ${incorrect ? 'incorrect' : ''}`}><i aria-hidden="true">{chosen ? '●' : '○'}</i><span>{option}</span></button>
    })}</div>{submitted && <p className="rest-check-explanation">{question.explanation}</p>}</fieldset>)}</div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="min-h-5 text-xs text-white/55" aria-live="polite">{submitted ? `Score: ${score} / ${questions.length}. ${score === questions.length ? 'Excellent API instincts.' : 'Review the explanations and try again.'}` : 'Your choices stay on this page only.'}</p><div className="flex gap-2"><button type="button" onClick={() => { setAnswers({}); setSubmitted(false) }} className="rest-secondary-button">Reset</button><button type="button" disabled={Object.keys(answers).length !== questions.length} onClick={() => setSubmitted(true)} className="rest-send-button disabled:opacity-40">Check answers</button></div></div>
  </section>
}

export default function RestApiStudio() {
  const reduceMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  const requestedTopic = Number(searchParams.get('topic'))
  const initialConceptIndex = Number.isInteger(requestedTopic) && requestedTopic >= 1 && requestedTopic <= LESSON_WALKS.length ? requestedTopic - 1 : 0
  const runIdRef = useRef(0)
  const idempotencyCache = useRef(new Map())
  const [tab, setTab] = useState(() => searchParams.has('topic') ? 'concepts' : 'network')
  const [client, setClient] = useState('HR dashboard')
  const [request, setRequest] = useState(() => makeRequestState())
  const [employees, setEmployees] = useState(STARTER_EMPLOYEES)
  const [attendance, setAttendance] = useState(ATTENDANCE)
  const [nextEmployeeNumber, setNextEmployeeNumber] = useState(141)
  const [run, setRun] = useState(null)
  const [response, setResponse] = useState(null)
  const [history, setHistory] = useState([])
  const [rawVisible, setRawVisible] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [selectedResource, setSelectedResource] = useState('employees')
  const [selectedMethod, setSelectedMethod] = useState('GET')
  const [constraintOpen, setConstraintOpen] = useState('stateless')
  const [versionPreview, setVersionPreview] = useState('v1')
  const [conceptIndex, setConceptIndex] = useState(initialConceptIndex)
  const [conceptStep, setConceptStep] = useState(0)
  const [conceptPlaying, setConceptPlaying] = useState(() => searchParams.has('topic'))
  const [conceptAnswers, setConceptAnswers] = useState({})
  const [missionIndex, setMissionIndex] = useState(0)
  const [gameProgress, setGameProgress] = useState(readGameProgress)
  const mission = MISSIONS[missionIndex]
  const activeConcept = LESSON_WALKS[conceptIndex]
  const missionComplete = gameProgress.completed.includes(mission.id)
  const currentStage = run?.plan[run.index]
  const recordCount = employees.length + attendance.length + DEPARTMENTS.length + PAYROLL.length
  const currentVersion = request.path.match(/^\/api\/(v\d+)(?:\/|$)/)?.[1] || 'unknown version'

  useEffect(() => () => { runIdRef.current += 1 }, [])
  useEffect(() => {
    if (!conceptPlaying || tab !== 'concepts') return undefined
    const timer = window.setTimeout(() => {
      if (conceptStep >= activeConcept.steps.length - 1) setConceptPlaying(false)
      else setConceptStep((step) => step + 1)
    }, reduceMotion ? 2600 : 3000)
    return () => window.clearTimeout(timer)
  }, [activeConcept, conceptPlaying, conceptStep, reduceMotion, tab])
  useEffect(() => {
    try { localStorage.setItem(GAME_KEY, JSON.stringify(gameProgress)) } catch { /* Progress remains available for this session. */ }
  }, [gameProgress])

  const requestBodyPreview = useMemo(() => {
    try { return request.body ? JSON.stringify(JSON.parse(request.body), null, 2) : '' } catch { return request.body }
  }, [request.body])

  function updateRequest(patch) {
    setRequest((current) => ({ ...current, ...patch }))
    setFeedback('')
  }

  function loadScenario(scenario, nextTab = 'network') {
    runIdRef.current += 1
    setRun(null)
    setRequest(makeRequestState(scenario))
    setResponse(null)
    setRawVisible(false)
    setFeedback('')
    setTab(nextTab)
  }

  function loadMission(index) {
    const target = MISSIONS[index]
    if (!target) return
    setMissionIndex(index)
    loadScenario(target.request)
    setFeedback(`Mission loaded · ${target.title}`)
  }

  async function sendRequest() {
    if (run) return
    const requestSnapshot = { ...request }
    const id = ++runIdRef.current
    const result = evaluateRequest(requestSnapshot, employees, attendance, nextEmployeeNumber, idempotencyCache.current)
    const plan = makePipeline(result, requestSnapshot)
    setResponse(null)
    setRawVisible(false)
    setFeedback('')
    setRun({ id, plan, index: 0, status: result.status })
    for (let index = 1; index < plan.length; index += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 0 : 580))
      if (runIdRef.current !== id) return
      setRun({ id, plan, index, status: result.status })
    }
    await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 0 : 420))
    if (runIdRef.current !== id) return

    if (result.dataMutation?.type === 'create') {
      setEmployees((current) => [...current, result.dataMutation.value])
      setNextEmployeeNumber((current) => current + 1)
    }
    if (result.dataMutation?.type === 'update') setEmployees((current) => current.map((employee) => employee.id === result.dataMutation.id ? result.dataMutation.value : employee))
    if (result.dataMutation?.type === 'delete') setEmployees((current) => current.filter((employee) => employee.id !== result.dataMutation.id))
    if (result.dataMutation?.type === 'attendance') setAttendance((current) => [...current, result.dataMutation.value])
    if (requestSnapshot.method === 'POST' && requestSnapshot.idempotencyKey && result.status === 201 && !result.replayed) idempotencyCache.current.set(requestSnapshot.idempotencyKey, { fingerprint: `${requestSnapshot.path}\n${requestSnapshot.body}`, result })

    const finalResponse = { ...result, request: requestSnapshot, id: Date.now() }
    setResponse(finalResponse)
    setRun(null)
    setHistory((current) => [{ id: Date.now(), method: requestSnapshot.method, path: requestSnapshot.path, status: result.status, contentType: result.contentType, note: result.explanation }, ...current].slice(0, 6))
    if (mission.matches(requestSnapshot, result) && !gameProgress.completed.includes(mission.id)) {
      setGameProgress((current) => ({ xp: current.xp + mission.reward, completed: [...current.completed, mission.id] }))
      setFeedback(`Mission complete · +${mission.reward} XP`)
    } else if (mission.matches(requestSnapshot, result)) {
      setFeedback('Request matches this mission. You already earned its XP; keep exploring.')
    } else {
      setFeedback(result.status >= 400 ? `${result.status} ${result.label} · Inspect the Problem Details response and try another request.` : 'Request complete · Compare the method, resource, and response semantics.')
    }
  }

  const activeMissionCount = gameProgress.completed.length
  const responseBodyText = response?.body === null || response?.body === undefined ? '' : typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2)

  function openTopicPractice(topicNumber, destination = 'concepts') {
    setConceptIndex(topicNumber - 1)
    setConceptStep(0)
    setConceptPlaying(destination === 'concepts')
    setTab(destination)
    setResponse(null)
    setFeedback('')
    const examples = {
      1: { method: 'GET', path: '/api/v1/employees/E-101' },
      2: { method: 'GET', path: '/api/v1/employees/E-101' },
      3: { method: 'GET', path: '/api/v1/employees/E-101', accept: 'application/json' },
      4: { method: 'GET', path: '/api/v1/departments' },
      5: { method: 'GET', path: '/api/v1/employees?department=Engineering&page=1&limit=5' },
      6: { method: 'POST', path: '/api/v1/employees', body: '{\n  "name": "Aarav Shah",\n  "jobTitle": "Backend Developer",\n  "department": "Engineering"\n}' },
      7: { method: 'PATCH', path: '/api/v1/employees/E-101', body: '{\n  "department": "Product Design"\n}' },
      8: { method: 'POST', path: '/api/v1/employees', idempotencyKey: 'hr-onboard-7842', body: '{\n  "name": "Aarav Shah",\n  "jobTitle": "Backend Developer",\n  "department": "Engineering"\n}' },
      9: { method: 'GET', path: '/api/v1/employees/E-999' },
      10: { method: 'GET', path: '/api/v1/employees', accept: 'text/csv' },
      11: { method: 'GET', path: '/api/v2/employees/E-101' },
      12: { method: 'POST', path: '/api/v1/employees', body: '{\n  "name": "Aarav Shah"\n}' },
      13: { method: 'GET', path: '/api/v1/employees?page=1&limit=2' },
      14: { method: 'GET', path: '/api/v1/employees/E-101' },
      15: { method: 'POST', path: '/api/v1/employees', idempotencyKey: 'hr-onboard-7842', body: '{\n  "name": "Aarav Shah",\n  "jobTitle": "Backend Developer",\n  "department": "Engineering"\n}' },
    }
    setRequest(makeRequestState(examples[topicNumber] || examples[1]))
  }

  return <main className="learning-surface rest-ops min-h-screen w-full px-3 py-5 sm:px-5 sm:py-8 lg:px-8 2xl:px-12">
    <div className="mx-auto max-w-[1560px]">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-white/50"><Link to="/" className="transition hover:text-white">Course library</Link><span>/</span><Link to="/course/rest-api-fundamentals" className="transition hover:text-white">REST API Fundamentals</Link><span>/</span><span className="text-white/80">Northstar API Operations</span></nav>

      <header className="rest-game-header mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--panel-bg)] px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3"><div className="rest-game-logo">API<span>↗</span></div><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-orange-200">REST API training simulation</p><h1 className="mt-0.5 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">Northstar API Operations</h1></div></div>
        <div className="flex flex-wrap items-center gap-2"><div className="rest-score-badge"><span>✦</span><b>{gameProgress.xp} XP</b><small>{activeMissionCount}/{MISSIONS.length} MISSIONS</small></div><Link to="/course/rest-api-fundamentals" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/65 transition hover:bg-white/[0.05] hover:text-white">All 15 course lessons ↗</Link></div>
      </header>

      <section className="rest-briefing mb-5 grid gap-4 rounded-2xl border border-orange-100/15 bg-orange-200/[0.035] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5" aria-label="Campaign mission briefing"><div className="flex gap-3"><div className="rest-mission-number">{String(missionIndex + 1).padStart(2, '0')}</div><div><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-100">Campaign mission {missionIndex + 1}/{MISSIONS.length}</span>{missionComplete && <span className="rounded-full bg-emerald-200/10 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-100">Complete</span>}</div><h2 className="mt-1 font-display text-lg font-bold text-white sm:text-xl">{mission.title}</h2><p className="mt-1 text-xs leading-5 text-white/60">{mission.detail}</p><p className="mt-1.5 text-[10px] text-orange-100/65">Topic {String(mission.topic).padStart(2, '0')} · {REST_API_TOPICS.find((topic) => topic.number === mission.topic)?.title}</p></div></div><div className="flex items-center gap-3 sm:justify-end">{missionComplete ? <button type="button" onClick={() => loadMission((missionIndex + 1) % MISSIONS.length)} className="min-h-10 rounded-lg bg-orange-200 px-4 py-2 text-xs font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-orange-100">{missionIndex === MISSIONS.length - 1 ? 'Play again' : 'Next mission'} →</button> : <span className="rounded-lg border border-orange-100/15 px-3 py-2 text-xs font-semibold text-orange-100">Reward · +{mission.reward} XP</span>}<div className="flex gap-1">{MISSIONS.map((item, index) => <span key={item.id} title={item.title} className={`h-1.5 w-4 rounded-full ${gameProgress.completed.includes(item.id) ? 'bg-emerald-200' : index === missionIndex ? 'bg-orange-200' : 'bg-white/15'}`} />)}</div></div></section>

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="REST API Operations views">{VIEW_TABS.map(([id, number, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className={`rest-view-tab ${tab === id ? 'selected' : ''}`}><span>{number}</span>{label}</button>)}</div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'network' && <motion.section key="network" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} aria-label="Animated REST request simulator">
          <div className="rest-network-window mb-5 overflow-hidden rounded-2xl border border-white/10 bg-[#091119] shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-black/15 px-4 py-3"><div className="flex items-center gap-2"><span className={`rest-server-status ${run ? 'busy' : ''}`} /><div><p className="text-xs font-bold text-white/90">Live HTTP traffic · Northstar company network</p><p className="mt-0.5 text-[9px] text-white/40">CLIENT → GATEWAY → RESOURCE ROUTER → SERVICE → DATA → REPRESENTATION → CLIENT</p></div></div><div className="flex flex-wrap items-center gap-2"><span className="rest-traffic-legend"><i className="request-light" /> request out</span><span className="rest-traffic-legend"><i className="response-light" /> response back</span><span className="rest-version-pill">{currentVersion.toUpperCase()}</span></div></div>

            <div className="rest-3d-scene">
              <div className="rest-scene-grid" aria-hidden="true" /><div className="rest-scene-light light-laptop" /><div className="rest-scene-light light-server" /><div className="rest-scene-light light-db" />
              <svg className="rest-route-svg" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true"><path className="route-out" d="M160 196 C270 142 377 156 500 196 S695 231 850 196" /><path className="route-back" d="M850 219 C695 258 635 258 500 219 S293 184 160 219" /><circle cx="500" cy="196" r="6" /><circle className="db-route-dot" cx="850" cy="196" r="5" /></svg>
              <div className="rest-scene-objects"><DataLaptop client={client} request={request} response={response} running={Boolean(run)} /><ApiServer stage={currentStage} response={response} /><DatabaseCylinder stage={currentStage} count={recordCount} /></div>
              {run && <motion.div className={`rest-packet ${currentStage?.id === 'response' ? 'returning' : ''} ${currentStage?.failed ? 'packet-error' : ''}`} initial={false} animate={{ left: `${currentStage?.point ?? 16}%` }} transition={{ duration: reduceMotion ? 0 : 0.52, ease: [0.2, 1, 0.3, 1] }}><b>{currentStage?.id === 'response' ? '←' : '→'} {currentStage?.id === 'response' ? run.status : request.method}</b><small>{currentStage?.id === 'response' ? 'HTTP' : request.path.split('?')[0].replace('/api/', '')}</small></motion.div>}
              <div className="rest-scene-stage" aria-live="polite">{run ? <><b>{currentStage?.title}</b><small>{currentStage?.detail}</small></> : response ? <><b className={response.status >= 400 ? 'scene-error' : 'scene-success'}>← {response.status} {response.label}</b><small>{response.explanation}</small></> : <><b>NETWORK READY</b><small>Build a request, then send the packet through the 3D server.</small></>}</div>
            </div>

            <div className="rest-pipeline">{REQUEST_STAGES.map((stageItem, index) => {
              const active = currentStage?.id === stageItem.id
              const completed = run && run.plan.slice(0, run.index).some((step) => step.id === stageItem.id)
              return <div key={stageItem.id} className={`rest-pipeline-item ${active ? 'active' : ''} ${completed ? 'complete' : ''} ${active && currentStage.failed ? 'failed' : ''}`}><i>{completed ? '✓' : `0${index + 1}`}</i><span><b>{stageItem.title}</b><small>{index === 0 ? 'Laptop' : index === 1 ? 'HTTP' : index === 2 ? 'URI + method' : index === 3 ? 'CRUD' : index === 4 ? 'Resource' : index === 5 ? 'Audit' : index === 6 ? 'JSON / CSV' : 'HTTP'}</small></span></div>
            })}</div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="rest-request-composer rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-5" aria-label="Build an HTTP request"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-200">Request builder</p><h2 className="mt-1 font-display text-lg font-bold text-white">Build the request</h2><p className="mt-1 text-xs leading-5 text-white/50">Change the method, resource, headers, or body before sending.</p></div><label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Client<select value={client} onChange={(event) => setClient(event.target.value)} disabled={Boolean(run)} className="rest-select mt-1 block min-h-9 rounded-lg border border-white/10 bg-black/20 px-2.5 text-xs font-medium normal-case tracking-normal text-white"><option>HR dashboard</option><option>Employee portal</option><option>Mobile app</option><option>Postman</option></select></label></div>

              <div className="mt-4 flex flex-wrap gap-1.5">{[
                ['GET', '/api/v1/employees?department=Engineering&page=1&limit=5', ''],
                ['QUERY', '/api/v1/employees', '{\n  "filter": { "department": "Engineering" },\n  "page": 1,\n  "limit": 5\n}'],
                ['GET', '/api/v1/employees/E-101', ''],
                ['POST', '/api/v1/employees', '{\n  "name": "Aarav Shah",\n  "jobTitle": "Backend Developer",\n  "department": "Engineering"\n}'],
                ['PUT', '/api/v1/employees/E-101', '{\n  "name": "Dev Patel",\n  "jobTitle": "Frontend Engineer",\n  "department": "Engineering"\n}'],
              ].map(([method, path, body]) => <button key={`${method}-${path}`} type="button" onClick={() => updateRequest({ method, path, body, ...(method === 'QUERY' ? { contentType: 'application/json' } : {}) })} disabled={Boolean(run)} className={`rest-quick-request ${request.method === method && request.path === path ? 'active' : ''}`}><MethodBadge method={method} />{path.replace('/api/v1/', '')}</button>)}</div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[112px_minmax(0,1fr)]"><label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Method<select value={request.method} onChange={(event) => updateRequest({ method: event.target.value })} disabled={Boolean(run)} className="rest-select mt-1 block min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 font-mono text-xs text-white">{['GET', 'QUERY', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => <option key={method}>{method}</option>)}</select></label><label className="min-w-0 text-[9px] font-semibold uppercase tracking-wider text-white/40">Request URI<input value={request.path} onChange={(event) => updateRequest({ path: event.target.value })} disabled={Boolean(run)} spellCheck="false" className="rest-input mt-1 block min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 font-mono text-xs text-emerald-100 outline-none focus:border-orange-200/45" /></label></div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Accept · wanted response<select value={request.accept} onChange={(event) => updateRequest({ accept: event.target.value })} disabled={Boolean(run)} className="rest-select mt-1 block min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 font-mono text-[10px] text-white"><option value="application/json">application/json</option><option value="text/csv">text/csv</option><option value="application/xml">application/xml · unsupported demo</option></select></label><label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">{request.method === 'QUERY' ? 'Content-Type · required by QUERY' : 'Content-Type · sent body'}<select value={request.contentType} onChange={(event) => updateRequest({ contentType: event.target.value })} disabled={Boolean(run)} className="rest-select mt-1 block min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 font-mono text-[10px] text-white"><option value="application/json">application/json</option><option value="text/plain">text/plain · unsupported demo</option></select></label></div>

              {['QUERY', 'POST', 'PUT', 'PATCH'].includes(request.method) && <label className="mt-3 block text-[9px] font-semibold uppercase tracking-wider text-white/40">{request.method === 'QUERY' ? 'Structured query · JSON body' : 'JSON request body'}<textarea value={request.body} onChange={(event) => updateRequest({ body: event.target.value })} disabled={Boolean(run)} rows={5} spellCheck="false" className="rest-body-input mt-1 block w-full resize-y rounded-lg border border-white/10 bg-[#080e14] p-3 font-mono text-[10px] leading-5 text-amber-100 outline-none focus:border-orange-200/40" /></label>}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><label className="flex min-h-9 items-center gap-2 text-[10px] text-white/50"><input type="checkbox" checked={Boolean(request.idempotencyKey)} onChange={(event) => updateRequest({ idempotencyKey: event.target.checked ? 'northstar-create-001' : '' })} disabled={Boolean(run)} className="accent-emerald-300" />Add Idempotency-Key</label><label className="flex min-h-9 items-center gap-2 text-[10px] text-white/50"><input type="checkbox" checked={request.simulateFailure} onChange={(event) => updateRequest({ simulateFailure: event.target.checked })} disabled={Boolean(run)} className="accent-rose-300" />Simulate safe 500</label></div>

              <div className="rest-raw-request mt-3 rounded-lg border border-white/[0.07] bg-black/[0.16] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-wider text-white/35">Wire view · request bytes, simplified</span><span className="font-mono text-[8px] text-white/30">HTTP/1.1</span></div><pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[9px] leading-5 text-white/65"><span className="text-emerald-100">{request.method} {request.path} HTTP/1.1</span>{'\n'}Host: api.northstar.company{'\n'}Accept: {request.accept}{request.body.trim() || request.method === 'QUERY' ? `\nContent-Type: ${request.contentType}` : ''}{request.idempotencyKey ? `\nIdempotency-Key: ${request.idempotencyKey}` : ''}{requestBodyPreview ? `\n\n${requestBodyPreview}` : ''}</pre></div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="min-h-5 text-[10px]" aria-live="polite">{feedback ? <span className={feedback.startsWith('Mission complete') ? 'font-bold text-emerald-100' : feedback.includes('· Inspect') ? 'text-amber-100' : 'text-white/50'}>{feedback}</span> : <span className="text-white/35">{missionComplete ? 'Mission cleared · continue exploring.' : 'Complete the campaign objective to earn XP.'}</span>}</p><div className="flex gap-2"><button type="button" disabled={Boolean(run) || !response} onClick={sendRequest} className="rest-secondary-button disabled:opacity-35">Replay</button><button type="button" disabled={Boolean(run)} onClick={sendRequest} className="rest-send-button">{run ? <><i className="rest-spinner" /> Sending…</> : <>Send request <span>↗</span></>}</button></div></div>
            </section>

            <section className="rest-response-inspector min-w-0 rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-5" aria-label="HTTP response inspector"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-200">Response inspector</p><h2 className="mt-1 font-display text-lg font-bold text-white">What came back?</h2><p className="mt-1 text-xs leading-5 text-white/50">Read the status first, then inspect headers and the representation.</p></div>{response && <span className={`rest-status-badge ${response.status >= 400 ? 'bad' : response.status === 201 ? 'created' : 'good'}`}>{response.status}<small>{response.label}</small></span>}</div>
              <div className="rest-response-panel mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#080e14]" aria-live="polite"><AnimatePresence mode="wait" initial={false}>{response ? <motion.div key={response.id} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }}>
                <div className={`flex items-start gap-3 border-b px-3.5 py-3 ${response.status >= 400 ? 'border-rose-200/10 bg-rose-200/[0.035]' : 'border-emerald-200/10 bg-emerald-200/[0.025]'}`}><span className={`rest-response-mark ${response.status >= 400 ? 'error' : ''}`}>{response.status >= 400 ? '!' : '✓'}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-white/90">{response.explanation}</p><p className="mt-1 text-[9px] text-white/40">{response.replayed ? 'Idempotency key replay · original result reused' : 'Request completed in the local training simulator'}</p></div><button type="button" onClick={() => setRawVisible((value) => !value)} className="rounded-md border border-white/10 px-2 py-1 text-[9px] text-white/50">{rawVisible ? 'Hide raw' : 'Raw HTTP'}</button></div>
                <div className="grid gap-2 border-b border-white/[0.06] px-3.5 py-3 sm:grid-cols-2">{Object.entries({ ...response.headers, ...response.extraHeaders }).map(([name, value]) => <HeaderField key={name} label={name} value={value} />)}</div>
                {response.status === 204 ? <div className="rest-empty-data">204 No Content · successful DELETE responses have no body.</div> : response.contentType?.startsWith('text/csv') ? <pre className="max-h-56 overflow-auto p-3.5 font-mono text-[9px] leading-5 text-emerald-100">{response.body}</pre> : response.data ? <><div className="flex items-center justify-between px-3.5 pt-3"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">Returned resource data</p><span className="text-[9px] text-white/35">{Array.isArray(response.data) ? `${response.data.length} records` : '1 resource'}</span></div><TableView rows={response.data} /></> : <div className="rest-error-explainer"><b>{response.body?.title || response.label}</b><p>{response.body?.detail || response.explanation}</p><small>requestId: {response.body?.requestId || '—'}</small></div>}
                {rawVisible && <pre className="max-h-60 overflow-auto border-t border-white/[0.07] bg-black/20 p-3.5 font-mono text-[9px] leading-5 text-cyan-100/80">{`${request.method} ${response.request.path} HTTP/1.1\n\n${response.status} ${response.label}\n${Object.entries({ ...response.headers, ...response.extraHeaders }).map(([key, value]) => `${key}: ${value}`).join('\n')}\n\n${responseBodyText}`}</pre>}
              </motion.div> : <div className="grid min-h-[270px] place-items-center p-6 text-center"><div><div className="rest-empty-icon">⇄</div><p className="mt-3 text-xs font-semibold text-white/70">Response inspector ready</p><p className="mt-1 max-w-xs text-[10px] leading-5 text-white/40">Send a request to watch the response packet arrive. The status, headers, and data will appear here.</p></div></div>}</AnimatePresence></div>
            </section>
          </div>
        </motion.section>}

        {tab === 'resources' && <motion.section key="resources" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} aria-label="REST resource explorer">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"><section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-200">Resource map</p><h2 className="mt-1 font-display text-xl font-bold text-white">URIs identify company resources</h2><p className="mt-2 max-w-xl text-xs leading-5 text-white/55">Choose a collection or item. Query parameters filter a collection; path segments identify the resource itself.</p>
            <div className="rest-resource-tree mt-5"><div className="resource-root"><span>◈</span> Northstar API <small>root</small></div>{RESOURCE_NODES.map((node, index) => <button type="button" key={node.id} onClick={() => setSelectedResource(node.id)} className={`resource-tree-node ${selectedResource === node.id ? 'selected' : ''}`} style={{ '--resource-depth': `${index ? 1 : 0}` }}><span className="resource-branch">{index === RESOURCE_NODES.length - 1 ? '└' : '├'}</span><span className="resource-folder">{node.kind === 'Collection' ? '▦' : '↳'}</span><span className="min-w-0 flex-1"><b>{node.label}</b><small>{node.path}</small></span><span className="resource-node-type">{node.kind}</span></button>)}</div>
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/[0.12] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Resource design quick check</p><div className="mt-2 flex flex-wrap gap-1.5"><span className="rest-rule-chip positive">Plural nouns</span><span className="rest-rule-chip positive">Stable identifiers</span><span className="rest-rule-chip positive">Filters in query</span><span className="rest-rule-chip negative">Avoid verbs in paths</span></div></div>
          </section><section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6">{(() => { const node = RESOURCE_NODES.find((item) => item.id === selectedResource) || RESOURCE_NODES[0]; return <><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-200">Selected resource · {node.kind}</p><h3 className="mt-1 font-mono text-lg font-bold text-white">{node.path}</h3></div><span className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[9px] text-white/50">{node.methods}</span></div><p className="mt-3 text-xs leading-6 text-white/60">{node.description}</p><div className="rest-uri-dissection mt-4"><p className="text-[9px] font-bold uppercase tracking-wider text-white/35">URI anatomy</p><div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]"><span className="uri-part protocol">/api</span><span className="uri-part version">/v1</span><span className="uri-part collection">/{node.label.replace(/[{}]/g, '')}</span>{node.id === 'employee' && <span className="uri-part identifier">/E-101</span>}</div><div className="mt-2 grid gap-2 sm:grid-cols-3"><div><b className="text-[9px] text-sky-100">Path</b><p className="text-[9px] leading-4 text-white/40">Identifies the collection or item.</p></div><div><b className="text-[9px] text-amber-100">Query</b><p className="text-[9px] leading-4 text-white/40">Filters, sorts, or paginates a collection.</p></div><div><b className="text-[9px] text-violet-100">Representation</b><p className="text-[9px] leading-4 text-white/40">The resource data returned in the response.</p></div></div></div><div className="mt-4 rounded-xl border border-white/[0.07] bg-[#080e14] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Try this resource</p><p className="mt-2 font-mono text-[10px] text-emerald-100">{node.sampleMethod} {node.samplePath}</p><button type="button" onClick={() => loadScenario({ method: node.sampleMethod, path: node.samplePath })} className="rest-send-button mt-3">Open in network lab <span>↗</span></button></div><div className="mt-4 rounded-xl border border-orange-100/10 bg-orange-200/[0.03] p-3"><p className="text-[10px] font-semibold text-orange-100">Think in resources</p><p className="mt-1 text-[10px] leading-5 text-white/50">A REST URI names a thing. The HTTP method describes what the client wants to do with it.</p></div></>; })()}</section></div>
        </motion.section>}

        {tab === 'methods' && <motion.section key="methods" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} aria-label="HTTP methods and idempotency lab">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"><section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-200">HTTP method console</p><h2 className="mt-1 font-display text-xl font-bold text-white">One resource · CRUD plus QUERY</h2><p className="mt-2 text-xs leading-5 text-white/55">Select a method to see its intent, safety, and idempotency. Then load an example into the network simulator.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{METHODS.map((item) => <button type="button" key={item.method} onClick={() => setSelectedMethod(item.method)} className={`rest-method-card ${selectedMethod === item.method ? `selected method-${item.color}` : ''}`}><MethodBadge method={item.method} /><b>{item.purpose}</b><span>{selectedMethod === item.method ? 'Selected method' : 'Inspect semantics'}</span></button>)}</div>
            {(() => { const method = METHODS.find((item) => item.method === selectedMethod); return <div className="rest-method-detail mt-4"><div className="flex flex-wrap items-center gap-2"><MethodBadge method={method.method} /><span className="text-sm font-semibold text-white/85">{method.purpose}</span></div><p className="mt-2 text-xs leading-6 text-white/60">{method.note}</p><div className="mt-3 flex flex-wrap gap-2"><span className={`rest-semantics-pill ${method.safe ? 'yes' : 'no'}`}>Safe · {method.safe ? 'yes' : 'no'}</span><span className={`rest-semantics-pill ${method.idempotent === true ? 'yes' : method.idempotent === false ? 'no' : 'maybe'}`}>Idempotent · {method.idempotent === true ? 'yes' : method.idempotent === false ? 'no' : 'not guaranteed'}</span></div><button type="button" onClick={() => loadScenario(methodExample(method.method))} className="rest-send-button mt-4">Load {method.method} example <span>↗</span></button></div>; })()}
          </section><section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-200">Retry lab</p><h2 className="mt-1 font-display text-xl font-bold text-white">What if the reply gets lost?</h2><p className="mt-2 text-xs leading-5 text-white/55">The client cannot always tell whether the server finished. Replay the same operation and watch the data state.</p><div className="mt-4 space-y-2">{[['GET', 'Read employee', 'Safe · retry freely'], ['QUERY', 'Structured read', 'Safe · body must be part of cache key'], ['PUT', 'Replace employee', 'Idempotent · same final state'], ['DELETE', 'Remove employee', 'Idempotent · already absent on retry'], ['POST', 'Create employee', 'Not idempotent · retry can duplicate']].map(([method, actionName, note]) => <div key={method} className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-black/[0.11] px-3 py-2.5"><MethodBadge method={method} /><span className="min-w-0 flex-1"><b className="block text-[10px] text-white/75">{actionName}</b><small className="mt-0.5 block text-[9px] text-white/40">{note}</small></span><span className="text-[9px] text-white/25">↻</span></div>)}</div><div className="mt-4 rounded-xl border border-violet-100/10 bg-violet-200/[0.035] p-3"><div className="flex items-center gap-2"><span className="text-sm text-violet-100">⌁</span><p className="text-[10px] font-semibold text-violet-100">POST + Idempotency-Key</p></div><p className="mt-1 text-[10px] leading-5 text-white/50">Load the POST example, turn on the key, send it, then press Replay. The server returns the original result without adding a second employee.</p><button type="button" onClick={() => loadScenario({ method: 'POST', path: '/api/v1/employees', body: '{\n  "name": "Aarav Shah",\n  "jobTitle": "Backend Developer",\n  "department": "Engineering"\n}', idempotencyKey: 'northstar-create-001' })} className="rest-secondary-button mt-3">Try idempotent POST ↗</button></div></section></div>
        </motion.section>}

        {tab === 'responses' && <motion.section key="responses" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} aria-label="HTTP response design lab">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-200">Status code deck</p><h2 className="mt-1 font-display text-xl font-bold text-white">Tell the client what happened</h2><p className="mt-2 text-xs leading-5 text-white/55">Status codes are part of the API contract. Try a scenario to see its response in the Network Lab.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{[
              { code: '200', label: 'OK · resource returned', request: { method: 'GET', path: '/api/v1/employees/E-101' } },
              { code: '201', label: 'Created · new resource', request: { method: 'POST', path: '/api/v1/employees', body: '{\n  "name": "Aarav Shah",\n  "jobTitle": "Backend Developer",\n  "department": "Engineering"\n}' } },
              { code: '204', label: 'No Content · deleted', request: { method: 'DELETE', path: '/api/v1/employees/E-140' } },
              { code: '400', label: 'Bad Request · invalid JSON', request: { method: 'POST', path: '/api/v1/employees', body: '{ "name": ' } },
              { code: '404', label: 'Not Found · missing resource', request: { method: 'GET', path: '/api/v1/employees/E-999' } },
              { code: '405', label: 'Method Not Allowed', request: { method: 'DELETE', path: '/api/v1/departments' } },
              { code: '406', label: 'Not Acceptable · no format', request: { method: 'GET', path: '/api/v1/employees', accept: 'application/xml' } },
              { code: '409', label: 'Conflict · duplicate record', request: { method: 'POST', path: '/api/v1/employees', body: '{\n  "name": "Dev Patel",\n  "jobTitle": "Engineer",\n  "department": "Engineering"\n}' } },
              { code: '415', label: 'Unsupported Media Type', request: { method: 'POST', path: '/api/v1/employees', contentType: 'text/plain', body: '{\n  "name": "Aarav Shah"\n}' } },
              { code: '500', label: 'Internal Server Error · safe detail', request: { method: 'GET', path: '/api/v1/employees', simulateFailure: true } },
            ].map((item) => <button type="button" key={item.code} onClick={() => loadScenario(item.request)} className={`rest-code-scenario ${Number(item.code) >= 400 ? 'code-bad' : ''}`}><b>{item.code}</b><span>{item.label}</span><small>Load scenario ↗</small></button>)}</div><div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-white/[0.07] bg-black/[0.11] p-3"><b className="text-[10px] text-amber-100">401 · Unauthorized</b><p className="mt-1 text-[9px] leading-4 text-white/45">The request needs valid authentication credentials.</p></div><div className="rounded-lg border border-white/[0.07] bg-black/[0.11] p-3"><b className="text-[10px] text-amber-100">403 · Forbidden</b><p className="mt-1 text-[9px] leading-4 text-white/45">The server understood the request but refuses to authorize it.</p></div></div></section>

            <section className="space-y-5"><div className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-200">Content negotiation</p><h2 className="mt-1 font-display text-xl font-bold text-white">Request a representation</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-cyan-100/10 bg-cyan-200/[0.025] p-3"><code className="text-[10px] font-bold text-cyan-100">Accept</code><p className="mt-1 text-[10px] leading-5 text-white/50">“Send me this response format.” Try JSON, CSV, or unsupported XML.</p></div><div className="rounded-lg border border-amber-100/10 bg-amber-200/[0.025] p-3"><code className="text-[10px] font-bold text-amber-100">Content-Type</code><p className="mt-1 text-[10px] leading-5 text-white/50">“This is the format of the body I’m sending.” Unsupported input can receive 415.</p></div></div><button type="button" onClick={() => loadScenario({ method: 'GET', path: '/api/v1/employees', accept: 'text/csv' })} className="rest-send-button mt-4">Try JSON vs CSV ↗</button></div>

              <div className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-200">Versioning lab</p><h2 className="mt-1 font-display text-xl font-bold text-white">Evolve without surprising clients</h2></div><div className="flex gap-1 rounded-lg border border-white/10 bg-black/10 p-1">{['v1', 'v2'].map((version) => <button key={version} type="button" onClick={() => setVersionPreview(version)} className={`rounded-md px-3 py-1.5 font-mono text-[10px] ${versionPreview === version ? 'bg-violet-200/15 text-violet-100' : 'text-white/45'}`}>{version}</button>)}</div></div><div className="mt-4 rounded-xl border border-white/[0.07] bg-[#080e14] p-3"><p className="font-mono text-[9px] text-white/35">GET /api/{versionPreview}/employees/E-101</p><pre className="mt-2 overflow-auto font-mono text-[9px] leading-5 text-emerald-100">{JSON.stringify(versionPreview === 'v1' ? { id: 'E-101', name: 'Dev Patel', jobTitle: 'Frontend Engineer', department: 'Engineering', email: 'dev.patel@northstar.example' } : { id: 'E-101', displayName: 'Dev Patel', role: 'Frontend Engineer', department: 'Engineering', links: { self: '/api/v2/employees/E-101' } }, null, 2)}</pre></div><div className="mt-3 flex flex-wrap gap-2">{[['URI path', '/api/v2/...'], ['Query', '?version=2'], ['Header', 'API-Version: 2'], ['Media type', 'application/vnd...']].map(([name, example]) => <span key={name} className="rest-rule-chip"><b>{name}</b> · {example}</span>)}</div><button type="button" onClick={() => loadScenario({ method: 'GET', path: `/api/${versionPreview}/employees/E-101` })} className="rest-secondary-button mt-3">Send {versionPreview.toUpperCase()} request ↗</button></div></section></div>
        </motion.section>}

        {tab === 'principles' && <motion.section key="principles" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} aria-label="REST constraints and API design principles">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]"><section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-200">REST architecture</p><h2 className="mt-1 font-display text-xl font-bold text-white">Six constraints · one system</h2><p className="mt-2 text-xs leading-5 text-white/55">Open a card to connect the principle to a visible part of the request journey.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{CONSTRAINTS.map((item) => <button type="button" key={item.id} onClick={() => setConstraintOpen(constraintOpen === item.id ? '' : item.id)} className={`rest-constraint-card color-${item.color} ${constraintOpen === item.id ? 'opened' : ''}`}><span>{item.icon}</span><b>{item.title}</b><small>{constraintOpen === item.id ? item.effect : 'Click to explore'}</small></button>)}</div>{(() => { const item = CONSTRAINTS.find((constraint) => constraint.id === constraintOpen); return item ? <motion.div key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rest-constraint-explainer"><p className="text-[10px] font-bold uppercase tracking-wider text-violet-100">{item.title} · plain language</p><p className="mt-1 text-xs leading-5 text-white/65">{item.plain}</p><div className="mt-3 rounded-lg border border-white/[0.07] bg-black/[0.12] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Northstar example</p><p className="mt-1 text-[10px] leading-5 text-white/60">{item.example}</p></div><p className="mt-2 text-[10px] text-emerald-100/75">Why it matters: {item.effect}</p></motion.div> : null; })()}</section>

            <section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-200">API quality scanner</p><h2 className="mt-1 font-display text-xl font-bold text-white">Catch the common traps</h2><p className="mt-2 text-xs leading-5 text-white/55">These design choices make APIs confusing or unsafe to change.</p><div className="mt-4 space-y-2">{[
              ['Verb in the URI', 'POST /createEmployee', 'POST /employees', 'Use a noun for the resource; the method supplies the action.'],
              ['Full replacement called PATCH', 'PATCH body silently requires every field', 'PATCH changes only supplied fields', 'Make partial-update behavior explicit.'],
              ['Success hidden in the body', '200 { "error": "not found" }', '404 with a useful error representation', 'Let the HTTP status match the outcome.'],
              ['Internal trace exposed', '500 with database password and stack', '500 with safe detail + request ID', 'Keep diagnostics in server logs.'],
              ['Unbounded collection', 'GET /employees returns every record', 'GET /employees?page=1&limit=20', 'Paginate large collections.'],
            ].map(([bad, badExample, good, why]) => <div key={bad} className="rest-quality-row"><div className="flex items-start justify-between gap-2"><b className="text-[10px] text-white/75">{bad}</b><span className="text-[8px] font-bold uppercase text-rose-200">Pitfall</span></div><code className="mt-1 block rounded bg-rose-200/[0.04] p-2 text-[9px] text-rose-100/70">{badExample}</code><code className="mt-1 block rounded bg-emerald-200/[0.045] p-2 text-[9px] text-emerald-100/75">{good}</code><p className="mt-1 text-[9px] leading-4 text-white/40">{why}</p></div>)}</div>
            </section></div>
        </motion.section>}

        {tab === 'concepts' && <motion.section key="concepts" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} aria-label="Visual lessons for all 15 REST API topics">
          <div className="rest-concept-layout"><section className="rest-concept-index"><div className="rest-concept-index-head"><p>REST API · complete course</p><h2>Choose a lesson</h2><span>15 interactive visual lessons</span></div><ol>{REST_API_TOPICS.map((topic, index) => <li key={topic.id}><button type="button" aria-current={conceptIndex === index ? 'step' : undefined} className={conceptIndex === index ? 'selected' : ''} onClick={() => { setConceptIndex(index); setConceptStep(0); setConceptPlaying(true) }}><span>{String(topic.number).padStart(2, '0')}</span><b>{topic.title}</b><i>{conceptIndex === index ? 'Viewing' : 'Open lesson'}</i></button></li>)}</ol></section>

            <section className="rest-concept-main"><header className="rest-concept-heading"><div><p>LESSON {String(activeConcept.number).padStart(2, '0')} · VISUAL EXPLANATION</p><h2>{REST_API_TOPICS[conceptIndex]?.title}</h2><span>{activeConcept.lens}</span></div><Link to={`/course/rest-api-fundamentals/topic/${REST_API_TOPICS[conceptIndex]?.id}`} className="rest-concept-course-link">Full lesson <span aria-hidden="true">↗</span></Link></header>
              <div className="rest-concept-body">
                <p className="rest-concept-introduction">{activeConcept.explanation}</p>
                <LessonVisual lesson={activeConcept} step={conceptStep} reduceMotion={reduceMotion} />

                <section className="rest-concept-journey" aria-label="Lesson animation steps"><div className="rest-concept-section-heading"><span>FOLLOW THE IDEA</span><p>Choose a stage or play the lesson animation</p></div>
                  <div className="rest-concept-steps">{activeConcept.steps.map(([title], index) => <button type="button" key={`${activeConcept.number}-${title}`} aria-current={index === conceptStep ? 'step' : undefined} onClick={() => { setConceptStep(index); setConceptPlaying(false) }} className={`rest-concept-step ${index < conceptStep ? 'passed' : ''} ${index === conceptStep ? 'active' : ''}`}><motion.span animate={{ scale: index === conceptStep ? 1.08 : 1 }} transition={{ duration: reduceMotion ? 0 : .2 }}>{index < conceptStep ? '✓' : String(index + 1).padStart(2, '0')}</motion.span><b>{title}</b></button>)}</div>
                  <AnimatePresence mode="wait" initial={false}><motion.article key={`${activeConcept.number}-${conceptStep}`} className="rest-concept-focus" initial={{ opacity: 0, y: 8, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: reduceMotion ? 0 : .22 }}><span>STEP {String(conceptStep + 1).padStart(2, '0')} / {String(activeConcept.steps.length).padStart(2, '0')}</span><h3>{activeConcept.steps[conceptStep][0]}</h3><p>{activeConcept.steps[conceptStep][1]}</p></motion.article></AnimatePresence>
                </section>

                <section className="rest-concept-study-grid" aria-label="Lesson explanation and example"><article className="rest-concept-study-card rest-example-card"><div className="rest-concept-section-heading"><span>{activeConcept.exampleLabel}</span><small>WORKED EXAMPLE</small></div><pre>{activeConcept.example}</pre></article><article className="rest-concept-study-card"><div className="rest-concept-section-heading"><span>Why this matters</span><small>IN PRACTICE</small></div><p>{activeConcept.why}</p><div className="rest-concept-pitfall"><b>Common mistake</b><p>{activeConcept.pitfall}</p></div></article></section>

                <section className="rest-concept-check" aria-label="Lesson knowledge check"><div><span>CHECK YOUR UNDERSTANDING</span><h3>{activeConcept.check.question}</h3></div><div className="rest-concept-check-options">{activeConcept.check.choices.map((choice, index) => { const answer = conceptAnswers[activeConcept.number]; const wasAnswered = answer !== undefined; return <button type="button" key={choice} aria-pressed={answer === index} className={`${answer === index ? 'chosen' : ''} ${wasAnswered && index === activeConcept.check.answer ? 'correct' : ''} ${wasAnswered && answer === index && answer !== activeConcept.check.answer ? 'incorrect' : ''}`} onClick={() => setConceptAnswers((current) => ({ ...current, [activeConcept.number]: index }))}><span>{String.fromCharCode(65 + index)}</span>{choice}</button> })}</div>{conceptAnswers[activeConcept.number] !== undefined && <p className={`rest-concept-check-feedback ${conceptAnswers[activeConcept.number] === activeConcept.check.answer ? 'correct' : 'incorrect'}`} role="status">{conceptAnswers[activeConcept.number] === activeConcept.check.answer ? 'Correct. ' : 'Not quite. '}{activeConcept.check.feedback}</p>}</section>

                <div className="rest-concept-controls"><button type="button" className="rest-secondary-button" disabled={conceptStep === 0} onClick={() => { setConceptStep((step) => Math.max(0, step - 1)); setConceptPlaying(false) }}>Previous step</button><button type="button" className="rest-send-button" onClick={() => { if (conceptPlaying) setConceptPlaying(false); else if (conceptStep === activeConcept.steps.length - 1) { setConceptStep(0); setConceptPlaying(true) } else setConceptPlaying(true) }}>{conceptPlaying ? 'Pause animation' : conceptStep === activeConcept.steps.length - 1 ? 'Replay animation' : 'Play animation'}</button><button type="button" className="rest-secondary-button" disabled={conceptStep === activeConcept.steps.length - 1} onClick={() => { setConceptStep((step) => Math.min(activeConcept.steps.length - 1, step + 1)); setConceptPlaying(false) }}>Next step</button></div>
                <div className="rest-concept-lesson"><span>REMEMBER</span><p>{activeConcept.takeaway}</p></div>
                <div className="rest-concept-practice"><div><span>PUT IT INTO PRACTICE</span><p>{TOPIC_PRACTICE[activeConcept.number]?.activity}</p></div><button type="button" onClick={() => openTopicPractice(activeConcept.number, 'network')}>Open matching request <span aria-hidden="true">↗</span></button></div>
              </div>
            </section>
          </div>
        </motion.section>}

        {tab === 'campaign' && <motion.section key="campaign" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} aria-label="REST API campaign and all course lessons">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]"><section className="rounded-2xl border border-orange-100/15 bg-orange-200/[0.035] p-4 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-100">Campaign progress</p><h2 className="mt-1 font-display text-xl font-bold text-white">API operations missions</h2><p className="mt-2 text-xs leading-5 text-white/55">Practice the request design decisions that make an API predictable for its clients.</p><div className="mt-4 space-y-2">{MISSIONS.map((item, index) => { const complete = gameProgress.completed.includes(item.id); return <div key={item.id} className={`rest-mission-row ${index === missionIndex ? 'current' : ''}`}><span className={complete ? 'mission-done' : ''}>{complete ? '✓' : `0${index + 1}`}</span><div className="min-w-0 flex-1"><b>{item.title}</b><small>Lesson {String(item.topic).padStart(2, '0')} · +{item.reward} XP</small></div><button type="button" onClick={() => loadMission(index)}>{complete ? 'Replay' : index === missionIndex ? 'Current' : 'Load'}</button></div>; })}</div><div className="mt-4 rounded-xl border border-white/[0.08] bg-black/[0.12] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-orange-100/80">Final operation</p><p className="mt-1 text-[10px] leading-5 text-white/55">Design a versioned employee API, choose correct methods, safely handle a retry, negotiate a response type, and return clear errors.</p></div></section>

              <section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-200">Full syllabus coverage</p><h2 className="mt-1 font-display text-xl font-bold text-white">All 15 course topics</h2><p className="mt-1 text-xs leading-5 text-white/50">Each lesson has a matching studio activity and a direct lesson link.</p></div><span className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[9px] text-white/45">3 parts · 15 lessons</span></div><div className="mt-4 space-y-4">{REST_API_PARTS.map((part) => <section key={part.id}><div className="mb-2 flex items-center justify-between border-b border-white/[0.07] pb-2"><div><p className="text-[9px] font-bold uppercase tracking-wider text-orange-200">{part.label}</p><h3 className="mt-0.5 text-xs font-semibold text-white/80">{part.title}</h3></div><span className="text-[9px] text-white/35">{part.topics.length} lessons</span></div><div className="space-y-1.5">{part.topics.map((topic) => { const practice = TOPIC_PRACTICE[topic.number]; return <div key={topic.id} className="rest-topic-row"><span className="rest-topic-num">{String(topic.number).padStart(2, '0')}</span><div className="min-w-0 flex-1"><b>{topic.title}</b><small>{practice.activity}</small></div><TopicActivityButton onClick={() => openTopicPractice(topic.number)}>Visualize</TopicActivityButton><Link to={`/course/rest-api-fundamentals/topic/${topic.id}`} className="rest-lesson-link" aria-label={`Open lesson ${topic.number}: ${topic.title}`}>Lesson ↗</Link></div>; })}</div></section>)}</div></section>
          </div>
        </motion.section>}
      </AnimatePresence>

      {tab === 'resources' && <section className="rest-reference-grid mt-5" aria-label="REST API quick reference tables">
        <article className="rest-reference-card"><p>HTTP methods</p><h2>Method · purpose · behavior</h2><div className="rest-reference-rows">{[['GET', 'Read', 'Safe · idempotent'], ['QUERY', 'Structured read', 'Safe · idempotent · query in body'], ['POST', 'Create / submit', 'Not safe · not idempotent'], ['PUT', 'Replace', 'Not safe · idempotent'], ['PATCH', 'Partial update', 'Not safe · may vary'], ['DELETE', 'Remove', 'Not safe · idempotent']].map(([method, purpose, behavior]) => <div key={method}><MethodBadge method={method} /><b>{purpose}</b><small>{behavior}</small></div>)}</div></article>
        <article className="rest-reference-card"><p>Status codes</p><h2>Common client outcomes</h2><div className="rest-reference-rows status-reference">{[['200', 'Read or update succeeded'], ['201', 'Resource created · check Location'], ['204', 'Succeeded · no response body'], ['400', 'Request is invalid'], ['401 / 403', 'Authenticate / permission denied'], ['404 / 405', 'Missing resource / method not allowed'], ['409 / 415', 'Conflict / unsupported body format'], ['500', 'Server failed · show safe detail']].map(([code, meaning]) => <div key={code}><code>{code}</code><small>{meaning}</small></div>)}</div></article>
        <article className="rest-reference-card"><p>HTTP headers</p><h2>What each header tells you</h2><div className="rest-reference-rows header-reference">{[['Accept', 'Response formats the client can read'], ['Content-Type', 'Format of the body sent or returned'], ['Accept-Query', 'Query document formats the server accepts'], ['Authorization', 'Credentials accompanying the request'], ['Cache-Control', 'Whether and how a response can be reused'], ['Location', 'URI of a newly created resource'], ['ETag', 'Validator for a representation version']].map(([header, meaning]) => <div key={header}><code>{header}</code><small>{meaning}</small></div>)}</div></article>
      </section>}
      {tab === 'campaign' && <SelfCheckPanel />}

      {tab === 'network' && <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">Recent request log</p><h2 className="mt-1 font-display text-base font-bold text-white">Traffic history</h2></div><span className="font-mono text-[9px] text-white/35">{history.length} requests</span></div>{history.length ? <ol className="mt-3 divide-y divide-white/[0.05]">{history.map((item) => <li key={item.id} className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2 py-2"><span className={`rounded px-1 py-1 text-center font-mono text-[8px] font-bold ${item.status >= 400 ? 'bg-rose-200/10 text-rose-100' : 'bg-emerald-200/10 text-emerald-100'}`}>{item.status}</span><span className="min-w-0"><b className="block truncate font-mono text-[9px] text-white/65">{item.method} {item.path}</b><small className="mt-0.5 block truncate text-[8px] text-white/35">{item.note}</small></span><span className="font-mono text-[8px] text-white/30">{item.contentType?.split(';')[0] || 'no body'}</span></li>)}</ol> : <p className="mt-3 rounded-lg border border-dashed border-white/10 p-4 text-center text-[10px] text-white/40">Your requests will appear here.</p>}</div><div className="rounded-2xl border border-orange-100/10 bg-orange-200/[0.025] p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-100">Read the flow</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{[['1', 'Request', 'Client selects a resource and sends method, URI, headers, and optional body.'], ['2', 'Server work', 'The API routes the request, applies method semantics, and accesses data if needed.'], ['3', 'Response', 'Status, headers, and a representation travel back to the client.']].map(([number, title, detail]) => <div key={number} className="rounded-lg border border-white/[0.06] bg-black/[0.11] p-3"><span className="text-[9px] font-bold text-orange-100">0{number} · {title}</span><p className="mt-1 text-[9px] leading-4 text-white/45">{detail}</p></div>)}</div><p className="mt-3 text-[9px] text-white/35">Local training simulation · no external request is sent.</p></div></section>}

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4 text-[10px] text-white/35"><span>REST API simulation · 3D client/server flow, resources, methods, HTTP semantics, and API evolution.</span><Link to="/course/rest-api-fundamentals" className="font-semibold text-white/50 transition hover:text-white">Back to REST API course →</Link></footer>
    </div>
  </main>
}
