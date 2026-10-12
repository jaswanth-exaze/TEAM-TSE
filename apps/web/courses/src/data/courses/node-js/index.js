const partDefinitions = [
  {
    id: 'foundations',
    label: 'Part 1',
    title: 'Node.js foundations',
    summary: 'Install Node.js, experiment in the REPL, create a project, run files, and learn both module systems.',
    topics: [
      [1, 'Installation', 'Install Node.js and npm on Windows or macOS, then check that both commands work.'],
      [2, 'Node REPL', 'Use Node’s interactive prompt to try JavaScript expressions without making a file.'],
      [3, 'Setup & package.json Init', 'Create a project folder and learn what the package manifest records.'],
      [4, 'Running JavaScript Files', 'Save JavaScript in a file and run it from the terminal with Node.'],
      [5, 'CommonJS Modules', 'Share values between files with require() and module.exports.'],
      [6, 'ES Modules', 'Use JavaScript’s standard import and export syntax in Node projects.'],
    ],
  },
  {
    id: 'server',
    label: 'Part 2',
    title: 'Your first server',
    summary: 'Create a server, use npm scripts and packages, and keep project configuration safe.',
    topics: [
      [7, 'HTTP Module & Create Server', 'Create a basic HTTP server and return a response to a browser or API client.'],
      [8, 'NPM Scripts', 'Add short, repeatable commands to the scripts section of package.json.'],
      [9, 'NPM Modules & Nodemon', 'Install packages and automatically restart your development server after edits.'],
      [10, '.gitignore File', 'Tell Git which generated files and local settings should stay out of commits.'],
      [11, 'Environment Variables & .env', 'Configure a program through environment variables and a local .env file.'],
    ],
  },
  {
    id: 'requests',
    label: 'Part 3',
    title: 'Requests, routing, and APIs',
    summary: 'Inspect requests, test endpoints, serve files, build routes, and accept POST data safely.',
    topics: [
      [12, 'The req Object', 'Read the method, URL, headers, query string, and body of an incoming request.'],
      [13, 'Making Requests from Postman', 'Send requests from Postman and inspect the server’s responses.'],
      [14, 'Simple Routing', 'Match a request method and path to the correct handler.'],
      [15, 'Loading Files', 'Serve a public web page and static files from your application.'],
      [16, 'Building a Simple API', 'Create resource endpoints that return JSON and useful HTTP status codes.'],
      [17, 'Middleware', 'Run reusable request-processing functions in a clear, ordered chain.'],
      [18, 'Cleanup (Middleware & Handlers)', 'Separate routes, middleware, handlers, storage, and response helpers.'],
      [19, 'Getting the Request Body for POST', 'Read JSON sent by a client, validate it, and create a task.'],
    ],
  },
  {
    id: 'core-modules',
    label: 'Part 4',
    title: 'Node.js core modules',
    summary: 'Work with files and paths, inspect the operating system, parse URLs, and use events and process controls.',
    topics: [
      [20, 'File System (fs) Module', 'Read and write project files using Node’s file-system APIs.'],
      [21, 'Path Module', 'Build file paths that work with Windows and macOS path conventions.'],
      [22, 'OS Module', 'Read useful information about the operating system and machine.'],
      [23, 'URL Module', 'Parse URLs into their protocol, host, path, and query parameters.'],
      [24, 'Crypto Module', 'Generate secure random values and understand hashing and password storage.'],
      [25, 'Emitting Events', 'Publish named events and let listeners react to application actions.'],
      [26, 'Process Object', 'Read process arguments and settings, handle shutdown, and finish the project.'],
    ],
  },
]

function topicFromDefinition([number, title, summary], part) {
  const paddedNumber = String(number).padStart(2, '0')
  const slug = title.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const id = `node-${paddedNumber}-${slug}`
  return {
    id,
    file: `${paddedNumber}-${slug}.md`,
    number,
    title,
    summary,
    outcome: summary,
    category: part.label,
    part: { id: part.id, label: part.label, title: part.title },
  }
}

export const NODE_PARTS = partDefinitions.map((definition) => ({
  ...definition,
  topics: definition.topics.map((item) => topicFromDefinition(item, definition)),
}))

export const NODE_TOPICS = NODE_PARTS.flatMap((part) => part.topics)

const lessonFiles = import.meta.glob('./lessons/[0-9][0-9]-*.md', { query: '?raw', import: 'default' })

export async function loadNodeTopic(id) {
  const topic = NODE_TOPICS.find((item) => item.id === id)
  if (!topic) return null

  const loadFile = lessonFiles[`./lessons/${topic.file}`]
  if (!loadFile) return null

  const markdown = await loadFile()
  return { ...topic, markdown, status: 'full' }
}
