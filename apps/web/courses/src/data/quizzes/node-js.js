export default [
  {
    id: 'nodejs-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Event Loop',
    prompt: `A Node.js server becomes unresponsive whenever a large JSON file is processed.

What is the MOST likely cause?`,
    options: [
      'A synchronous operation is blocking the event loop',
      'The server has too many environment variables',
      'The HTTP module cannot process JSON',
      'Node.js automatically pauses requests while reading files'
    ],
    correctAnswer: 'A synchronous operation is blocking the event loop',
    explanation: 'Node.js runs JavaScript on a single event loop. Expensive synchronous operations such as fs.readFileSync() or CPU-intensive loops block the event loop, preventing other requests from being processed.'
  },

  {
    id: 'nodejs-2',
    type: 'code-review',
    difficulty: 'expert',
    category: 'File System',
    prompt: `A developer writes:

const data = fs.readFileSync("users.json");

inside an API that receives hundreds of requests per second.

What should be recommended during code review?`,
    options: [
      'Use fs.readFile() instead',
      'Increase server RAM',
      'Move the file into the public folder',
      'Wrap the code in try...catch only'
    ],
    correctAnswer: 'Use fs.readFile() instead',
    explanation: 'fs.readFileSync() blocks the event loop until the file is completely read. In production servers, asynchronous APIs should be preferred whenever possible.'
  },

  {
    id: 'nodejs-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Modules',
    prompt: `Which statement correctly describes CommonJS?`,
    options: [
      'Uses require() and module.exports',
      'Uses import and export only',
      'Works only in browsers',
      'Cannot export functions'
    ],
    correctAnswer: 'Uses require() and module.exports',
    explanation: 'CommonJS is Node.js\'s traditional module system. Modern Node.js also supports ES Modules using import/export.'
  },

  {
    id: 'nodejs-4',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Environment Variables',
    prompt: `Why should database passwords usually be stored in environment variables instead of directly in source code?`,
    options: [
      'They improve application performance',
      'They separate secrets from source code and reduce accidental exposure',
      'Node.js requires it',
      'Environment variables are automatically encrypted'
    ],
    correctAnswer: 'They separate secrets from source code and reduce accidental exposure',
    explanation: 'Secrets should never be committed to source control. Environment variables allow different values for development, testing, and production without modifying application code.'
  },

  {
    id: 'nodejs-5',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Path Module',
    prompt: `Which method should be used to safely build a file path that works across Windows, Linux, and macOS?`,
    options: [
      'path.join()',
      'String concatenation with "/"',
      'fs.join()',
      'os.path()'
    ],
    correctAnswer: 'path.join()',
    explanation: 'path.join() automatically uses the correct path separator for the operating system, making code portable across platforms.'
  },

  {
    id: 'nodejs-6',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Streams',
    prompt: `A server needs to send a 2 GB video file to users.

Which approach is MOST memory efficient?`,
    options: [
      'Read the entire file into memory first',
      'Use a readable stream',
      'Convert the file into JSON',
      'Use fs.readFileSync()'
    ],
    correctAnswer: 'Use a readable stream',
    explanation: 'Streams process data in chunks rather than loading the entire file into memory. This significantly reduces memory usage and is the standard approach for large files.'
  },

  {
    id: 'nodejs-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Production Debugging',
    prompt: `Users report that every API request suddenly becomes slow.

CPU usage is nearly 100%.

Memory usage is stable.

What should be investigated FIRST?`,
    options: [
      'Long-running synchronous JavaScript code blocking the event loop',
      'Increase the number of environment variables',
      'Rename package.json',
      'Restart the server immediately'
    ],
    correctAnswer: 'Long-running synchronous JavaScript code blocking the event loop',
    explanation: 'High CPU with stable memory often indicates CPU-bound synchronous work blocking the event loop. Before restarting the service, identify the blocking operation and replace it with an asynchronous or worker-thread-based solution if appropriate.'
  },
  {
  id: 'nodejs-8',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Middleware',
  prompt: `An Express application has this order:

app.get('/users', getUsers);

app.use(authMiddleware);

Users can access /users without authentication.

What is the MOST likely reason?`,
  options: [
    'Middleware executes only after matching routes',
    'authMiddleware must be registered before protected routes',
    'Express ignores middleware for GET requests',
    'Authentication only works with POST requests'
  ],
  correctAnswer: 'authMiddleware must be registered before protected routes',
  explanation: 'Express executes middleware and routes in the order they are registered. Since the route appears before authMiddleware, requests reach the route handler before authentication is checked.'
},

{
  id: 'nodejs-9',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Error Handling',
  prompt: `Inside an async Express route a developer writes:

app.get('/users', async (req, res) => {
  const users = await getUsers();
  res.json(users);
});

If getUsers() rejects, what should be recommended?`,
  options: [
    'Wrap the code in try...catch and forward the error to Express',
    'Ignore the rejection',
    'Restart the server',
    'Replace async/await with callbacks'
  ],
  correctAnswer: 'Wrap the code in try...catch and forward the error to Express',
  explanation: 'Unhandled promise rejections can cause unstable applications. Route handlers should catch asynchronous errors and pass them to Express error-handling middleware using next(err) or an async wrapper.'
},

{
  id: 'nodejs-10',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `An API endpoint takes 8 seconds to respond.

Database queries complete in only 40ms.

CPU usage reaches nearly 100% while the endpoint runs.

What is the MOST likely cause?`,
  options: [
    'CPU-intensive JavaScript is blocking the event loop',
    'The database connection pool is exhausted',
    'Network latency',
    'Express middleware order'
  ],
  correctAnswer: 'CPU-intensive JavaScript is blocking the event loop',
  explanation: 'Fast database queries combined with very high CPU usage usually indicate expensive JavaScript computation rather than an I/O bottleneck.'
},

{
  id: 'nodejs-11',
  type: 'mcq',
  difficulty: 'expert',
  category: 'HTTP',
  prompt: `A client sends JSON data to an Express API.

Every request returns:

req.body === undefined

What is the MOST likely reason?`,
  options: [
    'express.json() middleware was not registered',
    'The route should use GET instead of POST',
    'The server must use HTTP/2',
    'Node.js cannot receive JSON'
  ],
  correctAnswer: 'express.json() middleware was not registered',
  explanation: 'Express does not automatically parse JSON request bodies. express.json() must be registered before routes that access req.body.'
},

{
  id: 'nodejs-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Memory',
  prompt: `A Node.js service becomes slower every day.

Memory usage keeps increasing and never drops.

What is the MOST likely issue?`,
  options: [
    'Memory leak caused by objects remaining referenced',
    'Node.js automatically reserves more RAM every day',
    'The event loop has stopped',
    'The HTTP module caches every request forever'
  ],
  correctAnswer: 'Memory leak caused by objects remaining referenced',
  explanation: 'Continuously increasing memory usage often indicates objects are still being referenced, preventing the garbage collector from reclaiming them.'
},

{
  id: 'nodejs-13',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Security',
  prompt: `A developer commits this file:

config.js

module.exports = {
  dbPassword: "Admin@123",
  jwtSecret: "secret123"
};

What should be recommended during code review?`,
  options: [
    'Move secrets into environment variables',
    'Compress the file',
    'Rename the file',
    'Convert it to JSON'
  ],
  correctAnswer: 'Move secrets into environment variables',
  explanation: 'Secrets should never be committed to source control. Store credentials and tokens in environment variables and rotate any secrets that have already been exposed.'
},

{
  id: 'nodejs-14',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Incident',
  prompt: `A production server handles thousands of concurrent users.

One endpoint exports a 3 GB CSV file.

Which implementation is MOST appropriate?`,
  options: [
    'Read the entire file into memory before sending it',
    'Use streams to generate and send the file in chunks',
    'Convert the CSV into JSON first',
    'Increase the Node.js heap size'
  ],
  correctAnswer: 'Use streams to generate and send the file in chunks',
  explanation: 'Streaming avoids loading the entire file into memory, reduces RAM usage, and allows clients to begin downloading immediately. This is the standard approach for serving large files in Node.js.'
},
{
  id: 'nodejs-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Async Programming',
  prompt: `A developer writes:

await user.save();
await order.save();
await audit.save();

These three operations are independent.

How can this usually be optimized?`,
  options: [
    'Replace await with callbacks',
    'Run them using Promise.all()',
    'Use setTimeout()',
    'Move them into a loop'
  ],
  correctAnswer: 'Run them using Promise.all()',
  explanation: 'Independent asynchronous operations should generally execute concurrently using Promise.all(). Running them sequentially increases total response time unnecessarily.'
},

{
  id: 'nodejs-16',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Error Handling',
  prompt: `An Express error handler is written as:

app.use((err, req, res) => {
    res.status(500).json({ message: err.message });
});

Why will Express not recognize this as an error-handling middleware?`,
  options: [
    'It should return next()',
    'It is missing the fourth parameter (next)',
    'Error handlers must be async',
    'Error handlers only work in production'
  ],
  correctAnswer: 'It is missing the fourth parameter (next)',
  explanation: 'Express identifies error middleware by its four parameters: (err, req, res, next). Without next, Express treats it as normal middleware.'
},

{
  id: 'nodejs-17',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `An endpoint loads 100,000 database records into memory before processing them.

What is the biggest concern?`,
  options: [
    'High memory usage and increased garbage collection',
    'The database will stop working',
    'Node.js limits arrays to 10,000 elements',
    'The event loop will automatically split the work'
  ],
  correctAnswer: 'High memory usage and increased garbage collection',
  explanation: 'Loading massive datasets into memory increases heap usage, garbage collection pauses, and response time. Pagination or streaming is usually preferred.'
},

{
  id: 'nodejs-18',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Security',
  prompt: `Which HTTP header is commonly added to improve security by disabling MIME type sniffing?`,
  options: [
    'X-Content-Type-Options: nosniff',
    'Content-Encoding: gzip',
    'Cache-Control: public',
    'Accept: application/json'
  ],
  correctAnswer: 'X-Content-Type-Options: nosniff',
  explanation: 'The nosniff header helps prevent browsers from interpreting files as a different MIME type than intended, reducing certain attack vectors.'
},

{
  id: 'nodejs-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Authentication',
  prompt: `A JWT is successfully verified, but users still access resources they should not.

What is MOST likely missing?`,
  options: [
    'Authorization checks after authentication',
    'A stronger password',
    'HTTPS',
    'Body parsing middleware'
  ],
  correctAnswer: 'Authorization checks after authentication',
  explanation: 'Authentication confirms identity. Authorization determines what that identity is allowed to access. Verifying a JWT alone does not enforce permissions.'
},

{
  id: 'nodejs-20',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Modules',
  prompt: `Two modules require each other (circular dependency).

What is the MOST likely result?`,
  options: [
    'One module may receive an incomplete export',
    'Node.js automatically fixes the dependency',
    'Compilation fails immediately',
    'Both modules execute twice'
  ],
  correctAnswer: 'One module may receive an incomplete export',
  explanation: 'During circular dependencies, Node.js may expose partially initialized exports because one module has not finished executing when the other imports it.'
},

{
  id: 'nodejs-21',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Caching',
  prompt: `A frequently requested configuration file rarely changes.

What is the BEST optimization?`,
  options: [
    'Read it from disk on every request',
    'Cache it in memory and reload only when necessary',
    'Store it in session',
    'Compress it every request'
  ],
  correctAnswer: 'Cache it in memory and reload only when necessary',
  explanation: 'Reading the same file repeatedly wastes disk I/O. Caching immutable or rarely changing data significantly improves throughput.'
},

{
  id: 'nodejs-22',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Debugging',
  prompt: `A Node.js process suddenly exits without throwing any visible error.

Which should you investigate FIRST?`,
  options: [
    'Unhandled promise rejections or uncaught exceptions',
    'HTML syntax',
    'Database indexes',
    'Browser cache'
  ],
  correctAnswer: 'Unhandled promise rejections or uncaught exceptions',
  explanation: 'Unexpected process termination is often caused by unhandled exceptions or promise rejections. Logs and process managers should be checked first.'
},

{
  id: 'nodejs-23',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Scaling',
  prompt: `A Node.js application fully utilizes one CPU core on an 8-core server.

Which built-in approach helps utilize multiple CPU cores?`,
  options: [
    'Worker Threads',
    'Cluster module',
    'Streams',
    'Buffers'
  ],
  correctAnswer: 'Cluster module',
  explanation: 'The Cluster module creates multiple Node.js processes that can share incoming connections, allowing better utilization of multi-core CPUs for server workloads.'
},

{
  id: 'nodejs-24',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Logging',
  prompt: `A production API logs complete JWT tokens, passwords, and database connection strings.

What is the BIGGEST concern?`,
  options: [
    'Logs become larger',
    'Sensitive information is exposed',
    'Logging slows Node.js',
    'Express cannot read large logs'
  ],
  correctAnswer: 'Sensitive information is exposed',
  explanation: 'Application logs should never contain passwords, tokens, API keys, or other secrets. Logs are often accessible to multiple systems and personnel.'
},

{
  id: 'nodejs-25',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Final Boss',
  prompt: `Users report that API responses become slower throughout the day.

Observations:

• CPU remains around 20%
• Memory continuously increases
• Restarting the server immediately restores performance

What is the MOST likely root cause?`,
  options: [
    'Memory leak',
    'Network latency',
    'Database indexing',
    'Missing environment variables'
  ],
  correctAnswer: 'Memory leak',
  explanation: 'Gradually increasing memory usage combined with temporary recovery after a restart strongly indicates a memory leak. Objects are likely remaining referenced and cannot be reclaimed by the garbage collector.'
},
{
  id: 'nodejs-26',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Runtime',
  prompt: 'Which global object provides access to command-line arguments passed to a Node.js process?',
  options: ['process.argv', 'console.args', 'module.params', 'global.arguments'],
  correctAnswer: 'process.argv',
  explanation: 'Node.js exposes command-line arguments through process.argv. Its first entries identify the runtime and script path, followed by arguments supplied by the caller.'
},
{
  id: 'nodejs-27',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Promises',
  prompt: 'What happens when a promise returned by an async function is rejected and the caller does not handle it?',
  options: ['The rejection propagates as an unhandled promise rejection', 'The async function retries automatically', 'The rejection becomes a fulfilled value of null', 'Node.js converts it to a callback error'],
  correctAnswer: 'The rejection propagates as an unhandled promise rejection',
  explanation: 'An async function always returns a promise. A thrown error or rejected awaited promise rejects that returned promise, so callers should await it within try/catch or attach a rejection handler.'
}
];
