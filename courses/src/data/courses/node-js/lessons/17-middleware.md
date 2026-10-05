# 17. Middleware

## Before We Start

Our server currently looks like:

```text
Request
   ↓
Route
   ↓
Handler
   ↓
Response
```

As an application grows, many requests need common processing:

```text
logging
authentication
CORS
URL parsing
body parsing
validation
```

Repeating this code in every route would make the application difficult to maintain.

Middleware solves this problem.

## Concept

**Middleware** is a function that runs during request processing, usually before the final route handler.

```js
function myMiddleware(req, res, next) {
  // do something
  next();
}
```

- `req` = incoming request
- `res` = response
- `next()` = continue to the next middleware

Think of `next()` as:

> "My work is finished; continue."

## Middleware Chain

```text
Request
   ↓
logger
   ↓
CORS
   ↓
URL parser
   ↓
body parser
   ↓
route handler
   ↓
Response
```

Each middleware can:

1. inspect `req`
2. modify `req` or `res`
3. end the response
4. call `next()`

## Important Rule

Every middleware must eventually either:

```js
next();
```

or end the response:

```js
res.end(...);
```

If it does neither, the request can hang.

Do not normally do both:

```js
next();
res.end();
```

because two parts of the chain may try to send a response.

## Common Middleware Jobs

- Logging
- Authentication
- Authorization
- CORS
- URL parsing
- Body parsing
- Validation
- Error handling

## Step 1: A Simple Middleware

```js
function myMiddleware(req, res, next) {
  console.log('Request received');
  next();
}
```

## Step 2: A Simple Middleware Runner

Frameworks such as Express use this same basic idea.

```js
export function compose(stack) {
  return (req, res) => {
    let i = 0;

    const next = (err) => {
      if (err) return sendError(res, err);

      const fn = stack[i++];

      if (!fn) return;

      Promise.resolve()
        .then(() => fn(req, res, next))
        .catch(next);
    };

    next();
  };
}
```

`stack` is an array of middleware functions.

Each `next()` moves to the next function.

If a middleware throws an error or calls:

```js
next(error);
```

the normal chain stops and error handling can take over.

## Step 3: Logger Middleware

```js
export function logger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    console.log(
      `${req.method} ${req.url} → ` +
      `${res.statusCode} (${Date.now() - start}ms)`
    );
  });

  next();
}
```

`res.on('finish')` runs after the response finishes, so we can see the final status code and duration.

## Step 4: CORS Middleware

**CORS** means Cross-Origin Resource Sharing.

Browsers apply security rules when JavaScript from one origin calls another origin.

For example:

```text
Frontend: http://localhost:5173
API:      http://localhost:3000
```

These are different origins.

Example middleware:

```js
export function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-api-key'
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  next();
}
```

`OPTIONS` is commonly used for a browser's CORS **preflight** request.

`*` allows any origin and is convenient for learning. Production applications often restrict allowed origins.

## Step 5: Parse the URL Once

```js
export function parseUrl(req, res, next) {
  req.parsedUrl = new URL(
    req.url,
    `http://${req.headers.host}`
  );

  next();
}
```

Later code can use:

```js
req.parsedUrl.pathname
```

instead of parsing the URL again.

This demonstrates an important pattern:

> Middleware can attach information to `req` for later steps.

## Step 6: Use the Middleware

```js
const handler = compose([
  logger,
  cors,
  parseUrl,
  routeHandler
]);

const server = http.createServer(handler);
```

The request now passes through the chain in that exact order.

## Middleware Order Matters

For example:

```text
logger
   ↓
body parser
   ↓
authentication
   ↓
router
```

A route that needs the body must run after the body parser.

A protected route should run after authentication.

So middleware is not just a list; **its order forms the request-processing pipeline**.

## Middleware vs Route Handler

Middleware handles common processing:

```text
logging
authentication
parsing
validation
```

A route handler handles a particular endpoint:

```text
GET /api/tasks
POST /api/tasks
DELETE /api/tasks/:id
```

## Common Mistakes

- Forgetting `next()`.
- Calling `next()` after ending the response.
- Putting middleware in the wrong order.
- Forgetting to include middleware in the chain.
- Confusing middleware with a route handler.
- Using CORS `*` without considering production security requirements.

## Try It

Create `addRequestId` middleware using:

```js
crypto.randomUUID()
```

Store the ID on `req.id`, send it as an `X-Request-Id` response header, and include it in the logger.

---
