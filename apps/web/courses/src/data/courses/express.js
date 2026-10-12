const partDefinitions = [
  {
    id: 'express-foundations',
    label: 'Part 1',
    title: 'Set up Express and serve your first responses',
    summary: 'Get oriented, create an Express project, start a server, and serve files and JSON while learning the tools used throughout the course.',
    topics: [
      [1, 'What is Express?', 'Understand what Express adds to Node.js and how it simplifies routes, responses, and middleware.', '01-what-is-express.md'],
      [2, 'Opinionated vs Unopinionated', 'Compare framework design choices and see how Express leaves project structure decisions to you.', '02-opinionated-vs-unopinionated.md'],
      [3, 'Prerequisites', 'Review the JavaScript, Node.js, terminal, and HTTP basics that make the Express lessons easier to follow.', '03-prerequisites.md'],
      [4, "What We'll Cover", 'Preview the course path from your first server through APIs, frontend requests, and EJS views.', '04-what-well-cover.md'],
      [5, 'Express Setup', 'Create a project, initialize npm, install Express, and understand the files in the project.', '05-express-setup.md'],
      [6, 'Basic Server', 'Build and run an Express server with a couple of routes and a clear response flow.', '06-basic-server.md'],
      [7, '--watch Flag & NPM Scripts', 'Restart Node during development with watch mode and create convenient npm commands.', '07-watch-flag-and-npm-scripts.md'],
      [8, 'res.sendFile() Method', 'Send an HTML file from a route and understand the absolute paths that sendFile requires.', '08-res-sendfile-method.md'],
      [9, 'Static Web Server', 'Serve a directory of browser assets with express.static and understand URL prefixes.', '09-static-web-server.md'],
      [10, 'Working with JSON', 'Return JSON from API routes and build the sample data used in later request lessons.', '10-working-with-json.md'],
      [11, 'Postman Utility', 'Send and inspect API requests with Postman and curl, including methods, headers, and bodies.', '11-postman-utility.md'],
      [12, 'Environment Variables (.env)', 'Move configuration out of source code and load local environment settings safely.', '12-environment-variables.md'],
    ],
  },
  {
    id: 'express-routes-and-requests',
    label: 'Part 2',
    title: 'Build routes and handle HTTP requests',
    summary: 'Read route parameters, query strings, and request bodies; organize routes and implement create, update, and delete operations.',
    topics: [
      [13, 'Request Params (req.params)', 'Create parameterized routes and use req.params to find a specific resource.', '13-request-params.md'],
      [14, 'Query Strings (req.query)', 'Read URL filters and implement search, sorting, limits, and pagination.', '14-query-strings.md'],
      [15, 'Setting Status Codes', 'Choose useful HTTP status codes and set them explicitly with Express responses.', '15-setting-status-codes.md'],
      [16, 'Multiple Responses', 'Understand why each request must receive one response and prevent headers-sent errors.', '16-multiple-responses.md'],
      [17, 'Route Files', 'Move routes into Express routers and mount them under clear URL prefixes.', '17-route-files.md'],
      [18, 'Using ES Modules', 'Switch an Express project to import and export syntax and avoid common module configuration errors.', '18-using-es-modules.md'],
      [19, 'Request Body Data', 'Parse JSON and form data with Express middleware and read submitted values from req.body.', '19-request-body-data.md'],
      [20, 'POST Request', 'Create a resource from validated request data and respond with an appropriate created status.', '20-post-request.md'],
      [21, 'PUT Request', 'Update a resource by combining route parameters, request data, validation, and status codes.', '21-put-request.md'],
      [22, 'DELETE Request', 'Remove a resource by route parameter and choose a predictable deletion response.', '22-delete-request.md'],
    ],
  },
  {
    id: 'express-middleware-and-errors',
    label: 'Part 3',
    title: 'Structure middleware, errors, and controllers',
    summary: 'Follow Express request flow, centralize errors, improve server logs, and separate route definitions from application logic.',
    topics: [
      [23, 'Middleware', 'Trace middleware execution and write reusable functions for logging, checks, and request processing.', '23-middleware.md'],
      [24, 'Custom Error Handler', 'Pass failures to centralized error middleware and return consistent, safe error responses.', '24-custom-error-handler.md'],
      [25, 'Catch-All Error Middleware', 'Handle unmatched URLs as 404 errors and connect them to the application error flow.', '25-catch-all-error-middleware.md'],
      [26, 'Colors Package', 'Add readable color to terminal output and build a clearer request logger.', '26-colors-package.md'],
      [27, 'Using Controllers', 'Move request logic into controllers so route files stay focused on URL and method mapping.', '27-using-controllers.md'],
      [28, '__dirname Workaround', 'Recreate __dirname and __filename in ES Modules for file and view paths.', '28-dirname-workaround.md'],
    ],
  },
  {
    id: 'express-frontends-and-views',
    label: 'Part 4',
    title: 'Connect a frontend and render EJS views',
    summary: 'Build browser-to-API interactions, submit forms, and finish with dynamic EJS pages, loops, and reusable partials.',
    topics: [
      [29, 'Making Requests From Frontend', 'Use fetch from a browser page to read API data and present loading and error states.', '29-making-requests-from-frontend.md'],
      [30, 'Submit Form to API', 'Validate form input and send it to an API as JSON or URL-encoded form data.', '30-submit-form-to-api.md'],
      [31, 'EJS Template Engine Setup', 'Configure EJS in Express and render your first server-generated page.', '31-ejs-template-engine-setup.md'],
      [32, 'Pass Data to Views', 'Send values to EJS templates, use conditions, and understand escaped output.', '32-pass-data-to-views.md'],
      [33, 'Pass and Loop Over Arrays', 'Pass collections into EJS and render lists, empty states, and filtered data.', '33-pass-and-loop-over-arrays.md'],
      [34, 'Template Partials', 'Use EJS includes to share page sections and finish a reusable server-rendered layout.', '34-template-partials.md'],
    ],
  },
]

function topicFromDefinition([number, title, summary, file], part) {
  const paddedNumber = String(number).padStart(2, '0')
  const slug = file.replace(/^\d+-/, '').replace(/\.md$/, '')
  return {
    id: `express-${paddedNumber}-${slug}`,
    file,
    number,
    title,
    summary,
    outcome: summary,
    category: part.label,
    part: { id: part.id, label: part.label, title: part.title },
  }
}

export const EXPRESS_PARTS = partDefinitions.map((definition) => ({
  ...definition,
  topics: definition.topics.map((item) => topicFromDefinition(item, definition)),
}))

export const EXPRESS_TOPICS = EXPRESS_PARTS.flatMap((part) => part.topics)

const lessonFiles = import.meta.glob('./express/lessions/[0-9][0-9]-*.md', { query: '?raw', import: 'default' })

export async function loadExpressTopic(id) {
  const topic = EXPRESS_TOPICS.find((item) => item.id === id)
  if (!topic) return null

  const loadFile = lessonFiles[`./express/lessions/${topic.file}`]
  if (!loadFile) return null

  const markdown = await loadFile()
  return { ...topic, markdown, status: 'full' }
}
