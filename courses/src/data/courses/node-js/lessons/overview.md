# Node.js: Learn by Building

### 26 topics → one real hands-on project (a Task Manager API with no frameworks)

---

## How to Use This Guide

- Follow the topics **in order**. Every topic adds one piece to the same project.
- **Type the code yourself.** Copy-pasting teaches much less than typing, breaking and fixing.
- Every topic has: **Concept → Steps → Code → Try it → Common mistakes** where applicable.
- By Topic 26, you'll have built a working REST API with routing, middleware, JSON file storage, events, security basics, and graceful shutdown.

## Beginner-first rule

This guide assumes basic JavaScript, but no previous Node.js experience.

When a topic introduces an important backend or Node.js term, understand the term before relying on it. For example:

- HTTP topics explain client, server, request, response, and API first.
- Request-body topics explain methods, headers, bodies, streams, and JSON.
- File topics explain files, directories, and paths.
- Event topics explain events, emitters, and listeners.
- Cryptography topics explain hashing, encryption, salts, secrets, and secure randomness.
- Process topics explain processes, signals, PIDs, CLI arguments, and exit codes.

These short foundations are included to explain **why** the Node.js API is being used, not just how to type it.

## Prerequisites

Basic JavaScript:

- variables
- functions
- arrays
- objects
- arrow functions
- template strings
- `async/await`

You do **not** need previous Node.js experience.

If Promises, `async/await`, or JavaScript modules are unfamiliar, review them before continuing because later topics use them repeatedly.

## Project we are building: `task-api`

A small API where you can **list, create, update and delete tasks**, plus a tiny web page that shows them.

**Final folder structure**

```text
task-api/
├── .env                  # secrets/config (never committed)
├── .gitignore
├── package.json
├── server.js             # entry point
├── data/
│   └── tasks.json        # our "database" (created automatically)
├── public/
│   └── index.html        # simple frontend
└── src/
    ├── events.js         # shared event emitter
    ├── handlers.js       # what each route does
    ├── listeners.js      # reacts to events
    ├── middleware.js     # logger, cors, body parser, etc.
    ├── router.js         # tiny router
    ├── routes.js         # route table
    ├── store.js          # data layer (read/write tasks)
    └── utils/
        ├── body.js       # read the request body
        └── response.js   # sendJson, httpError
```

### How the pieces fit together

```text
Client
  ↓
HTTP request
  ↓
Node HTTP server
  ↓
Middleware
  ↓
Router
  ↓
Route handler
  ↓
Store / application logic
  ↓
HTTP response

Important actions can also emit events:
handler → EventEmitter → listeners
```

## API we'll end up with

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Server/system info |
| GET | `/api/tasks` | List tasks (supports `?done=true`) |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Replace a task's fields |
| PATCH | `/api/tasks/:id` | Partially update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
