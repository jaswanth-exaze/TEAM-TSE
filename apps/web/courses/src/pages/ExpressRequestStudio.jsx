import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BrowserEjsView, MissionView } from './ExpressStudioExtraPanels'
import './ExpressRequestStudio.css'

const COURSE_PATH = '/course/express'

const VIEWS = [
  ['journey', '01', 'Request journey'],
  ['routes', '02', 'Route workshop'],
  ['pipeline', '03', 'Pipeline builder'],
  ['errors', '04', 'Error lab'],
  ['rendering', '05', 'Browser + EJS'],
  ['missions', '06', 'Mission mode'],
]

const FLOW_STEPS = [
  { title: 'Client request arrives', node: 'CLIENT', tone: 'blue', detail: 'A browser, mobile app, or API client sends an HTTP method, URL, headers, and possibly a body. Express starts a request-response cycle for this incoming request.', wire: 'GET /api/books/bk-102?view=full\nAccept: application/json', lesson: 'express-06-basic-server', lessonTitle: 'Basic Server' },
  { title: 'Middleware runs in order', node: 'MIDDLEWARE', tone: 'violet', detail: 'Each matching middleware can inspect or modify req/res, end the response, or pass control onward. A body parser must run before a route that reads req.body.', wire: 'logger → express.json() → request metadata', lesson: 'express-23-middleware', lessonTitle: 'Middleware' },
  { title: 'Router matches method + path', node: 'ROUTER', tone: 'cyan', detail: 'Express checks registered routes in order. A route can read path parameters from req.params and query-string values from req.query.', wire: 'router.get("/books/:bookId", handler)', lesson: 'express-13-request-params', lessonTitle: 'Request Params' },
  { title: 'Handler builds one response', node: 'HANDLER', tone: 'amber', detail: 'The route or controller reads validated request data, performs the action, and chooses a status, headers, and response body. Once it sends, the cycle is complete.', wire: 'res.status(200).json(book)', lesson: 'express-27-using-controllers', lessonTitle: 'Using Controllers' },
  { title: 'Response returns to client', node: 'RESPONSE', tone: 'green', detail: 'Express serializes the response and sends it back. If an error was forwarded, normal middleware is skipped and the error-handling path takes over.', wire: 'HTTP/1.1 200 OK\nContent-Type: application/json', lesson: 'express-24-custom-error-handler', lessonTitle: 'Custom Error Handler' },
]

const STARTER_BOOKS = [
  { id: 'bk-101', title: 'Express in Motion', author: 'Asha Rao', category: 'Web', stock: 7 },
  { id: 'bk-102', title: 'HTTP Field Notes', author: 'Ishan Mehta', category: 'Web', stock: 12 },
  { id: 'bk-103', title: 'Middleware Patterns', author: 'Mira Das', category: 'Node.js', stock: 4 },
  { id: 'bk-104', title: 'EJS by Example', author: 'Kabir Shah', category: 'Node.js', stock: 9 },
]

const INITIAL_PIPELINE = [
  { id: 'logger', title: 'Request logger', kind: 'middleware', enabled: true, lesson: 'express-23-middleware', code: 'app.use(requestLogger)' },
  { id: 'parser', title: 'express.json()', kind: 'parser', enabled: true, lesson: 'express-19-request-body-data', code: 'app.use(express.json())' },
  { id: 'router', title: '/api router', kind: 'router', enabled: true, lesson: 'express-17-route-files', code: 'app.use("/api", booksRouter)' },
  { id: 'notFound', title: '404 fallback', kind: 'fallback', enabled: true, lesson: 'express-25-catch-all-error-middleware', code: 'app.use(notFound)' },
  { id: 'errorHandler', title: 'Error handler (4 args)', kind: 'error', enabled: true, lesson: 'express-24-custom-error-handler', code: 'app.use(errorHandler)' },
]

const ERROR_CASES = [
  { id: 'bad-json', title: 'Malformed JSON body', detail: 'The JSON parser cannot read the submitted body.', code: 'POST /api/books\nContent-Type: application/json\n{ "title": "Broken"', lesson: 'express-19-request-body-data' },
  { id: 'async', title: 'Async route rejects', detail: 'A database call rejects inside an async route handler.', code: 'app.get("/api/books", async (req, res) => {\n  throw new Error("database offline")\n})', lesson: 'express-24-custom-error-handler' },
  { id: 'not-found', title: 'Route does not match', detail: 'The method and URL match no registered route.', code: 'GET /api/unknown\n→ no route handler matches', lesson: 'express-25-catch-all-error-middleware' },
  { id: 'headers', title: 'Response already sent', detail: 'A handler starts a response and then forwards another error.', code: 'res.json(book)\nnext(new Error("too late"))', lesson: 'express-16-multiple-responses' },
]

const MISSIONS = [
  {
    prompt: 'For GET /api/books/bk-102?view=full, where do the two values live?',
    choices: ['req.params.bookId = "bk-102"; req.query.view = "full"', 'req.body.bookId = "bk-102"; req.params.view = "full"', 'Both values are in req.query'],
    answer: 0,
    explanation: 'The named path segment belongs to req.params. Query-string pairs belong to req.query.',
    trace: ['Split path from query string', 'Match /books/:bookId', 'Populate params and query'],
    lesson: 'express-13-request-params',
  },
  {
    prompt: 'POST reaches the route, but req.body is undefined. What should you inspect first?',
    choices: ['Mount express.json() before the router and send JSON Content-Type', 'Move express.json() after the response handler', 'Read the submitted JSON from req.params'],
    answer: 0,
    explanation: 'The built-in JSON parser must match the request content type and run before the route reads req.body.',
    trace: ['Inspect request Content-Type', 'Check parser placement', 'Ensure parser is before the router'],
    lesson: 'express-19-request-body-data',
  },
  {
    prompt: 'A logger prints a line, but the browser keeps waiting. The middleware does not send a response. What is probably missing?',
    choices: ['A call to next()', 'A second app.listen()', 'A route parameter'],
    answer: 0,
    explanation: 'Middleware must end the response or pass control with next(). Doing neither leaves the request open.',
    trace: ['Logger receives request', 'No response is sent', 'Control must continue with next()'],
    lesson: 'express-23-middleware',
  },
  {
    prompt: 'With the course’s Express 5 setup, an async route throws. What happens to the rejected promise?',
    choices: ['Express automatically forwards it to error handling', 'It is always ignored', 'Express converts it into a successful 200'],
    answer: 0,
    explanation: 'Express 5 forwards rejections from route-handler promises. In Express 4, use try/catch with next(err) or a wrapper.',
    trace: ['Async handler returns a promise', 'Promise rejects', 'Express 5 forwards the error'],
    lesson: 'express-24-custom-error-handler',
  },
  {
    prompt: 'An EJS page renders a user-provided book title. Which tag should display it as escaped text?',
    choices: ['<%= book.title %>', '<%- book.title %>', '<% book.title %>'],
    answer: 0,
    explanation: '<%= ... %> outputs escaped text. The unescaped <%- ... %> form should be reserved for trusted markup such as a template include.',
    trace: ['View receives book data', 'EJS escapes the title', 'HTML is returned to browser'],
    lesson: 'express-32-pass-data-to-views',
  },
]

const API_CODE = `router.get('/books/:bookId', async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.bookId)
    if (!book) return res.status(404).json({ error: 'Book not found' })
    res.status(200).json(book)
  } catch (err) {
    next(err)
  }
})`

function parseURL(path) {
  try {
    return new URL(path || '/', 'http://northstar.local')
  } catch {
    return new URL('/', 'http://northstar.local')
  }
}

function findBookRoute(method, pathname) {
  if (pathname === '/api/books' && ['GET', 'POST'].includes(method)) return { name: method === 'GET' ? 'List books' : 'Create a book', params: {} }
  if (pathname === '/api/health' && method === 'GET') return { name: 'Health check', params: {} }
  if (pathname === '/shop' && method === 'GET') return { name: 'Render EJS shop view', params: {} }
  const match = pathname.match(/^\/api\/books\/([^/]+)$/)
  if (!match) return null
  if (!['GET', 'PUT', 'PATCH', 'DELETE'].includes(method)) return null
  let bookId = match[1]
  try { bookId = decodeURIComponent(bookId) } catch { /* keep the URL segment as received */ }
  const routeNames = { GET: 'Read one book', PUT: 'Replace a book', PATCH: 'Update selected fields', DELETE: 'Delete a book' }
  return { name: routeNames[method], params: { bookId } }
}

function response(status, body, headers = {}) {
  return { status, body, headers: { 'content-type': 'application/json', ...headers } }
}

function runExpressSimulation({ method, path, bodyText, contentType, pipeline, books }) {
  const url = parseURL(path)
  const pathname = url.pathname.replace(/\/$/, '') || '/'
  const query = Object.fromEntries(url.searchParams.entries())
  const matchedRoute = findBookRoute(method, pathname)
  const active = pipeline.filter((item) => item.enabled)
  const trace = [{ id: 'arrival', label: 'Request arrives', state: 'pass', detail: `${method} ${url.pathname}${url.search} reaches the Express application.` }]
  const req = { method, path: url.pathname, originalUrl: `${url.pathname}${url.search}`, params: {}, query, body: undefined }
  let pendingError = null
  let errorOrigin = -1
  let routeHandled = false
  let result = null
  let nextBooks = books

  for (let index = 0; index < active.length; index += 1) {
    const item = active[index]
    if (pendingError) {
      if (item.id === 'errorHandler' && index > errorOrigin) {
        trace.push({ id: item.id, label: 'Error handler', state: 'pass', detail: `Four-argument error middleware receives the failure and returns a safe ${pendingError.status} response.` })
        result = response(pendingError.status, { error: { status: pendingError.status, message: pendingError.message } })
        pendingError = null
        break
      }
      continue
    }

    if (item.id === 'logger') {
      trace.push({ id: item.id, label: item.title, state: 'pass', detail: `Logs ${req.method} ${req.originalUrl}, then calls next().` })
      continue
    }
    if (item.id === 'parser') {
      if (contentType !== 'application/json' || !bodyText.trim()) {
        trace.push({ id: item.id, label: 'express.json()', state: 'pass', detail: 'No JSON body needs parsing for this request; next() continues.' })
        continue
      }
      try {
        req.body = JSON.parse(bodyText)
        trace.push({ id: item.id, label: 'express.json()', state: 'pass', detail: 'Parses the JSON bytes and makes the result available at req.body.' })
      } catch {
        trace.push({ id: item.id, label: 'express.json()', state: 'fail', detail: 'Malformed JSON throws a parser error. Normal middleware is skipped.' })
        pendingError = { status: 400, message: 'Invalid JSON request body' }
        errorOrigin = index
      }
      continue
    }
    if (item.id === 'router') {
      if (!matchedRoute) {
        trace.push({ id: item.id, label: 'Books router', state: 'pass', detail: 'No method + path pair matches this router; Express continues searching.' })
        continue
      }
      routeHandled = true
      req.params = matchedRoute.params
      trace.push({ id: item.id, label: matchedRoute.name, state: 'pass', detail: `Route matched. req.params=${JSON.stringify(req.params)} · req.query=${JSON.stringify(req.query)}.` })
      const bookId = req.params.bookId
      const existing = books.find((book) => book.id === bookId)
      if (method === 'GET' && pathname === '/api/books') {
        const term = (query.q || query.search || '').toLowerCase()
        const filtered = books.filter((book) => !term || `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(term))
        result = response(200, { data: filtered, meta: { total: filtered.length, q: query.q || query.search || null } })
      } else if (method === 'GET' && pathname === '/api/health') {
        result = response(200, { status: 'ok', service: 'northstar-books-api' })
      } else if (method === 'GET' && pathname === '/shop') {
        result = { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: '<!doctype html><title>Northstar Bookshop</title><h1>Books</h1><ul><li>Express in Motion</li><li>HTTP Field Notes</li></ul>' }
      } else if (method === 'GET') {
        result = existing ? response(200, existing) : response(404, { error: { status: 404, message: `No book with id ${bookId}` } })
      } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
          result = response(400, { error: { status: 400, message: 'req.body is undefined or is not a JSON object; check parser order and Content-Type' } })
        } else if (method === 'POST') {
          const title = String(req.body.title || '').trim()
          const author = String(req.body.author || '').trim()
          if (!title || !author) result = response(400, { error: { status: 400, message: 'title and author are required' } })
          else {
            const lastNumber = Math.max(100, ...books.map((book) => Number(book.id.match(/(\d+)$/)?.[1] || 0)))
            const created = { id: `bk-${lastNumber + 1}`, title, author, category: String(req.body.category || 'General'), stock: Number(req.body.stock || 0) }
            nextBooks = [...books, created]
            result = response(201, { data: created }, { location: `/api/books/${created.id}` })
          }
        } else if (!existing) result = response(404, { error: { status: 404, message: `No book with id ${bookId}` } })
        else {
          const updated = { ...existing, ...req.body, id: existing.id }
          nextBooks = books.map((book) => book.id === bookId ? updated : book)
          result = response(200, updated)
        }
      } else if (method === 'DELETE') {
        if (!existing) result = response(404, { error: { status: 404, message: `No book with id ${bookId}` } })
        else {
          nextBooks = books.filter((book) => book.id !== bookId)
          result = { status: 204, headers: {}, body: null }
        }
      }
      trace.push({ id: 'handler', label: 'Route handler / controller', state: result?.status >= 400 ? 'fail' : 'pass', detail: result?.status >= 400 ? 'The handler returns a client error; it does not continue to another response.' : 'The handler chooses a response and ends this request-response cycle.' })
      break
    }
    if (item.id === 'notFound') {
      const orderIssue = matchedRoute && active.findIndex((candidate) => candidate.id === 'router') > index
      trace.push({ id: item.id, label: '404 fallback', state: orderIssue ? 'fail' : 'pass', detail: orderIssue ? 'The catch-all runs before the matching router and ends the request. Move it after routes.' : 'No route handled this request; the fallback creates a 404 error.' })
      pendingError = { status: 404, message: 'Route not found' }
      errorOrigin = index
      continue
    }
  }

  if (pendingError) {
    trace.push({ id: 'defaultError', label: 'Express default error handler', state: 'fail', detail: 'No later custom error handler caught this error; Express uses its built-in final handler.' })
    result = response(pendingError.status, { error: { status: pendingError.status, message: pendingError.message } })
  }
  if (!result) {
    trace.push({ id: 'default404', label: 'No route response', state: 'fail', detail: 'The router did not end the cycle; Express eventually returns its default not-found response.' })
    result = response(404, { error: { status: 404, message: 'Cannot find this route' } })
  }
  if (!routeHandled && result.status === 404 && !trace.some((item) => item.id === 'notFound' || item.id === 'defaultError')) {
    trace.push({ id: 'notFound', label: 'No matching route', state: 'fail', detail: 'No route matched this method and path.' })
  }
  trace.push({ id: 'response', label: `Response · ${result.status}`, state: result.status >= 400 ? 'fail' : 'pass', detail: result.status === 204 ? 'No response body is sent.' : `Express sends status ${result.status} and ${result.headers?.['content-type'] || 'no body content type'}.` })
  return { trace, response: result, request: req, route: matchedRoute, books: nextBooks }
}

function simulateErrorCase(caseId, version) {
  if (caseId === 'bad-json') return {
    trace: [
      ['Client sends malformed JSON', 'pass', 'Request enters the application with Content-Type: application/json.'],
      ['express.json()', 'fail', 'The parser raises a SyntaxError and calls next(error).'],
      ['Normal routes', 'blocked', 'Express skips the remaining non-error middleware.'],
      ['Four-argument error handler', 'pass', 'Error middleware formats a safe 400 response.'],
    ], status: 400, explanation: 'Body parsing happens before the route. Parser failures join the error path.',
  }
  if (caseId === 'async') return version === '5' ? {
    trace: [
      ['Request matches async route', 'pass', 'The route returns a Promise while awaiting its database operation.'],
      ['Promise rejects', 'fail', 'The database call throws while the handler is awaiting.'],
      ['Express 5 forwards rejection', 'pass', 'Express calls next(error) for a rejected route-handler Promise.'],
      ['Four-argument error handler', 'pass', 'The handler logs safely and returns a 500 response.'],
    ], status: 500, explanation: 'Express 5 automatically forwards rejected Promises from route handlers and middleware. Express 4 needs try/catch with next(err) or a Promise wrapper.',
  } : {
    trace: [
      ['Request matches async route', 'pass', 'The route returns a Promise while awaiting its database operation.'],
      ['Promise rejects', 'fail', 'The async function rejects after the route callback has returned.'],
      ['No automatic Express 4 forwarding', 'fail', 'Without a wrapper or try/catch, the rejection does not enter Express error middleware.'],
      ['Repair: forward with next(err)', 'blocked', 'Wrap the await in try/catch or use a version-compatible wrapper.'],
    ], status: 'UNHANDLED', explanation: 'This is why the project targets Express 5. On Express 4, explicitly forward rejected promises to next(err).',
  }
  if (caseId === 'not-found') return {
    trace: [
      ['Request enters router stack', 'pass', 'GET /api/unknown reaches the app.'],
      ['Routes are checked', 'pass', 'No registered method + path pair matches.'],
      ['Catch-all creates a 404', 'fail', 'The fallback runs after routes and forwards a not-found error.'],
      ['Error handler formats response', 'pass', 'The client receives a safe 404 response.'],
    ], status: 404, explanation: 'A 404 fallback belongs after route definitions so it only handles requests that remain unmatched.',
  }
  return {
    trace: [
      ['Handler sends JSON', 'pass', 'The response headers and body have begun leaving the server.'],
      ['Code calls next(error)', 'fail', 'A later failure arrives after the response has started.'],
      ['Custom handler sees headersSent', 'pass', 'It cannot replace a response that has already started.'],
      ['Delegate to Express default handler', 'fail', 'Call next(err); Express closes the connection for the failed response.'],
    ], status: 'CONNECTION CLOSED', explanation: 'Check res.headersSent in custom error middleware. If true, delegate to the default handler with next(err).',
  }
}

function delay(reduceMotion, ms = 380) {
  return reduceMotion ? Promise.resolve() : new Promise((resolve) => window.setTimeout(resolve, ms))
}

function DataPill({ label, value }) {
  return <div className="ex-data-pill"><span>{label}</span><code>{value}</code></div>
}

function TraceRow({ item, index, active, complete }) {
  const state = complete ? item.state : active ? 'active' : 'waiting'
  return <motion.article initial={false} animate={{ opacity: state === 'waiting' ? .48 : 1, x: active ? 4 : 0 }} className={`ex-trace-row ${state}`}>
    <span>{complete ? item.state === 'pass' ? '✓' : item.state === 'fail' ? '×' : '—' : String(index + 1).padStart(2, '0')}</span>
    <div><b>{item.label}</b><p>{complete || active ? item.detail : 'Waiting for the request to reach this step.'}</p></div>
    <small>{complete ? item.state.toUpperCase() : active ? 'RUNNING' : 'QUEUED'}</small>
  </motion.article>
}

export default function ExpressRequestStudio() {
  const reduceMotion = useReducedMotion()
  const [view, setView] = useState('journey')
  const [flowStep, setFlowStep] = useState(0)
  const [books, setBooks] = useState(STARTER_BOOKS)
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState('/api/books?q=web')
  const [contentType, setContentType] = useState('application/json')
  const [bodyText, setBodyText] = useState('{\n  "title": "Express in Practice",\n  "author": "A. Learner",\n  "category": "Web",\n  "stock": 6\n}')
  const [requestBusy, setRequestBusy] = useState(false)
  const [requestTrace, setRequestTrace] = useState([])
  const [requestTraceCount, setRequestTraceCount] = useState(0)
  const [requestResult, setRequestResult] = useState(null)
  const [pipeline, setPipeline] = useState(INITIAL_PIPELINE)
  const [errorCase, setErrorCase] = useState('async')
  const [expressVersion, setExpressVersion] = useState('5')
  const [errorBusy, setErrorBusy] = useState(false)
  const [errorTrace, setErrorTrace] = useState([])
  const [errorTraceCount, setErrorTraceCount] = useState(0)
  const [errorResult, setErrorResult] = useState(null)
  const [renderMode, setRenderMode] = useState('fetch')
  const [renderBusy, setRenderBusy] = useState(false)
  const [renderStep, setRenderStep] = useState(-1)
  const [renderComplete, setRenderComplete] = useState(false)
  const [missionIndex, setMissionIndex] = useState(0)
  const [missionChoice, setMissionChoice] = useState(-1)
  const [missionBusy, setMissionBusy] = useState(false)
  const [missionTraceCount, setMissionTraceCount] = useState(0)
  const [missionComplete, setMissionComplete] = useState(false)
  const [missionScore, setMissionScore] = useState(0)

  const activeFlow = FLOW_STEPS[flowStep]
  const activeMission = MISSIONS[missionIndex]
  const activeError = ERROR_CASES.find(({ id }) => id === errorCase) || ERROR_CASES[0]
  const requestVisibleCount = requestBusy ? requestTraceCount : requestResult ? requestTrace.length : 0
  const serializedPipeline = useMemo(() => pipeline.map(({ code, enabled }) => `${enabled ? code : `// ${code}  // disabled`}`).join('\n'), [pipeline])

  function movePipeline(index, offset) {
    setPipeline((current) => {
      const nextIndex = index + offset
      if (nextIndex < 0 || nextIndex >= current.length) return current
      const reordered = [...current]
      ;[reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]
      return reordered
    })
  }

  function togglePipeline(id) {
    setPipeline((current) => current.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))
  }

  async function runRequest() {
    if (requestBusy) return
    const result = runExpressSimulation({ method, path, bodyText, contentType, pipeline, books })
    setBooks(result.books)
    setRequestResult(result)
    setRequestTrace(result.trace)
    setRequestTraceCount(0)
    setRequestBusy(true)
    for (let index = 0; index < result.trace.length; index += 1) {
      await delay(reduceMotion, 360)
      setRequestTraceCount(index + 1)
    }
    setRequestBusy(false)
  }

  async function runErrorScenario() {
    if (errorBusy) return
    const result = simulateErrorCase(errorCase, expressVersion)
    setErrorResult(result)
    setErrorTrace(result.trace)
    setErrorTraceCount(0)
    setErrorBusy(true)
    for (let index = 0; index < result.trace.length; index += 1) {
      await delay(reduceMotion, 430)
      setErrorTraceCount(index + 1)
    }
    setErrorBusy(false)
  }

  async function runRenderDemo() {
    if (renderBusy) return
    setRenderBusy(true)
    setRenderComplete(false)
    setRenderStep(0)
    const count = renderMode === 'fetch' ? 4 : 5
    for (let index = 0; index < count; index += 1) {
      await delay(reduceMotion, 440)
      setRenderStep(index + 1)
    }
    setRenderComplete(true)
    setRenderBusy(false)
  }

  async function checkMission() {
    if (missionChoice < 0 || missionBusy || missionComplete) return
    setMissionBusy(true)
    setMissionTraceCount(0)
    for (let index = 0; index < activeMission.trace.length; index += 1) {
      await delay(reduceMotion, 400)
      setMissionTraceCount(index + 1)
    }
    if (missionChoice === activeMission.answer) setMissionScore((score) => score + 1)
    setMissionComplete(true)
    setMissionBusy(false)
  }

  function nextMission() {
    const nextIndex = missionIndex === MISSIONS.length - 1 ? 0 : missionIndex + 1
    if (nextIndex === 0) setMissionScore(0)
    setMissionIndex(nextIndex)
    setMissionChoice(-1)
    setMissionTraceCount(0)
    setMissionComplete(false)
  }

  function selectRenderMode(nextMode) {
    setRenderMode(nextMode)
    setRenderStep(-1)
    setRenderComplete(false)
  }

  const responseReady = requestResult && !requestBusy && requestVisibleCount >= requestTrace.length

  return <main className="express-request-studio min-h-screen px-4 py-6 text-white sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1500px]">
      <nav className="ex-topnav" aria-label="Express studio navigation"><Link to={COURSE_PATH} className="ex-back-link">← Express.js course</Link><Link to="/course/express/topic/express-23-middleware" className="ex-course-link">Open middleware lesson ↗</Link></nav>

      <header className="ex-hero">
        <div className="ex-hero-glow" aria-hidden="true" />
        <div className="ex-hero-grid"><div><div className="ex-eyebrow"><span className="ex-live-dot" /> EXPRESS 5 REQUEST CONTROL <i>SERVER / ROUTER / RESPONSE</i></div><h1>Follow every request.<span>See Express decide.</span></h1><p>Send a request through a living Express pipeline. Watch middleware run in order, routes populate req, handlers build responses, and errors take their own path.</p><div className="ex-hero-tags"><span>34 course lessons</span><span>Express 5.1</span><span>Animated request trace</span><span>Local simulation</span></div></div>
          <div className="ex-hero-diagram" aria-label="Express request flows through middleware, router, handler, and response"><div className="ex-hero-client">CLIENT<small>HTTP request</small></div><motion.div className="ex-hero-packet" animate={reduceMotion ? {} : { x: [0, 64, 128], opacity: [1, 1, .2] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: .4 }}>GET</motion.div><div className="ex-hero-server"><span>EXPRESS</span><b>middleware → route</b><small>handler → response</small><i /><i /><i /></div><div className="ex-hero-return">200<small>JSON response</small></div></div>
        </div>
      </header>

      <div className="ex-view-tabs" role="group" aria-label="Express visual lessons">{VIEWS.map(([id, number, label]) => <button type="button" key={id} aria-pressed={view === id} className={view === id ? 'selected' : ''} onClick={() => setView(id)}><span>{number}</span>{label}</button>)}</div>

      <AnimatePresence mode="wait" initial={false}>
        {view === 'journey' && <motion.section key="journey" className="ex-view-panel" role="tabpanel" initial={{ opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .2 }}>
          <div className="ex-section-heading"><div><span>01 / REQUEST JOURNEY</span><h2>One request, five decisions</h2><p>Choose a stage. Follow the packet and inspect the Express concept that becomes active there.</p></div><span className="ex-version-pill">EXPRESS 5.1</span></div>
          <div className="ex-journey-map"><div className="ex-journey-rail"><motion.i animate={{ left: `${flowStep * 25}%` }} transition={{ duration: reduceMotion ? 0 : .42 }} /></div>{FLOW_STEPS.map((step, index) => <button type="button" key={step.node} aria-current={flowStep === index ? 'step' : undefined} onClick={() => setFlowStep(index)} className={`ex-journey-node ${step.tone} ${flowStep === index ? 'selected' : ''} ${flowStep > index ? 'passed' : ''}`}><span>{String(index + 1).padStart(2, '0')}</span><b>{step.node}</b><small>{step.title}</small></button>)}</div>
          <AnimatePresence mode="wait"><motion.article key={activeFlow.node} className={`ex-journey-detail ${activeFlow.tone}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: reduceMotion ? 0 : .18 }}>
            <div><span className="ex-kicker">STAGE {String(flowStep + 1).padStart(2, '0')} / 05</span><h3>{activeFlow.title}</h3><p>{activeFlow.detail}</p><div className="ex-wire-example"><span>CODE / MESSAGE</span><pre>{activeFlow.wire}</pre></div><Link to={`${COURSE_PATH}/topic/${activeFlow.lesson}`} className="ex-lesson-link">Related lesson: {activeFlow.lessonTitle} →</Link></div>
            <div className="ex-journey-visual"><motion.div className="ex-journey-orb" animate={reduceMotion ? {} : { y: [0, -7, 0], scale: [1, 1.04, 1] }} transition={{ duration: 2.8, repeat: reduceMotion ? 0 : Infinity }}><span>{activeFlow.node}</span></motion.div><div className="ex-packet-label"><i />{flowStep === 0 ? 'method + URL + headers' : flowStep === 1 ? 'req / res / next' : flowStep === 2 ? 'params + query' : flowStep === 3 ? 'status + headers + body' : 'response → client'}</div><div className="ex-stage-counter">STEP {String(flowStep + 1).padStart(2, '0')} <b>/ 05</b></div></div>
          </motion.article></AnimatePresence>
          <div className="ex-journey-controls"><button type="button" disabled={flowStep === 0} onClick={() => setFlowStep((step) => Math.max(0, step - 1))}>← Previous</button><div>{FLOW_STEPS.map((step, index) => <button type="button" key={step.node} aria-label={`Go to ${step.title}`} aria-pressed={flowStep === index} className={flowStep === index ? 'current' : ''} onClick={() => setFlowStep(index)} />)}</div><button type="button" disabled={flowStep === FLOW_STEPS.length - 1} onClick={() => setFlowStep((step) => Math.min(FLOW_STEPS.length - 1, step + 1))}>Next stage →</button></div>
          <div className="ex-principle-strip"><article><b>Middleware continues</b><p>Call next() when the current step has more work to do.</p></article><article><b>Response ends the cycle</b><p>Once a handler sends, later normal middleware does not run.</p></article><article><b>Errors change lanes</b><p>next(err) skips normal handlers and seeks error middleware.</p></article></div>
        </motion.section>}
        {view === 'routes' && <motion.section key="routes" className="ex-view-panel" role="tabpanel" initial={{ opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .2 }}>
          <div className="ex-section-heading"><div><span>02 / ROUTE WORKSHOP</span><h2>Build a request and watch it match</h2><p>Edit the method, URL, query, or JSON body. The simulator shows which Express route receives it and what the handler returns.</p></div><span className="ex-version-pill">SIMULATED SERVER</span></div>
          <div className="ex-route-layout"><section className="ex-request-composer"><div className="ex-card-heading"><div><span>CLIENT REQUEST</span><h3>Compose an HTTP request</h3></div><span className="ex-lock-chip">LOCAL</span></div><label className="ex-form-label">Method<select disabled={requestBusy} value={method} onChange={(event) => setMethod(event.target.value)}>{['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((item) => <option key={item}>{item}</option>)}</select></label><label className="ex-form-label">Path + query<input disabled={requestBusy} value={path} onChange={(event) => setPath(event.target.value)} spellCheck="false" /></label><div className="ex-request-shortcuts"><button type="button" disabled={requestBusy} onClick={() => { setMethod('GET'); setPath('/api/books?q=node') }}>List + filter</button><button type="button" disabled={requestBusy} onClick={() => { setMethod('GET'); setPath('/api/books/bk-102?view=full') }}>Read one</button><button type="button" disabled={requestBusy} onClick={() => { setMethod('POST'); setPath('/api/books') }}>Create</button><button type="button" disabled={requestBusy} onClick={() => { setMethod('DELETE'); setPath('/api/books/bk-103') }}>Delete</button></div>{method !== 'GET' && method !== 'DELETE' && <><label className="ex-form-label">Content-Type<select disabled={requestBusy} value={contentType} onChange={(event) => setContentType(event.target.value)}><option value="application/json">application/json</option><option value="text/plain">text/plain</option></select></label><label className="ex-form-label">Request body<textarea disabled={requestBusy} value={bodyText} onChange={(event) => setBodyText(event.target.value)} spellCheck="false" rows="6" /></label></>}<button type="button" className="ex-primary-button" disabled={requestBusy} onClick={runRequest}>{requestBusy ? 'Request in flight…' : 'Send through Express'} <span>→</span></button><p className="ex-local-note">No network request is sent. This controlled simulator models the selected Express pipeline.</p></section>

            <div className="ex-route-result-column"><div className="ex-route-scene"><div className="ex-scene-grid" aria-hidden="true" /><div className="ex-scene-connection" aria-hidden="true"><i /></div><div className="ex-scene-nodes"><div className="ex-scene-node client"><span>CLIENT</span><b>{method}</b><small>{path.split('?')[0] || '/'}</small></div><div className={`ex-scene-node server ${requestBusy ? 'busy' : ''}`}><span>EXPRESS 5</span><b>app → router</b><small>middleware stack</small></div><div className="ex-scene-node response"><span>RESPONSE</span><b>{responseReady ? requestResult.response.status : '—'}</b><small>{responseReady ? 'returned' : 'waiting'}</small></div></div>{requestBusy && <motion.div className="ex-scene-packet" animate={{ left: ['14%', '50%', '86%'] }} transition={{ duration: Math.max(1.1, requestTrace.length * .36), ease: 'easeInOut' }}>{method}</motion.div>}<div className="ex-scene-footer"><span>{requestBusy ? `STEP ${requestTraceCount + 1} / ${requestTrace.length}` : responseReady ? 'CYCLE COMPLETE' : 'READY'}</span><small>{responseReady ? `${requestResult.route?.name || 'No matching route'} · ${requestResult.response.status}` : 'Client → Express → response'}</small></div></div>
              <div className="ex-request-object"><div className="ex-card-heading"><div><span>LIVE REQUEST INSPECTOR</span><h3>What the handler can read</h3></div><Link to={`${COURSE_PATH}/topic/express-13-request-params`}>req.params lesson ↗</Link></div><div className="ex-request-object-grid"><DataPill label="req.method" value={requestResult?.request.method || method} /><DataPill label="req.params" value={JSON.stringify(requestResult?.request.params || {})} /><DataPill label="req.query" value={JSON.stringify(requestResult?.request.query || {})} /><DataPill label="req.body" value={requestResult?.request.body === undefined ? 'undefined' : JSON.stringify(requestResult.request.body)} /></div></div>
              <div className="ex-response-panel"><div className="ex-card-heading"><div><span>HTTP RESPONSE</span><h3>Handler output</h3></div><span className={`ex-response-code ${responseReady && requestResult.response.status >= 400 ? 'error' : ''}`}>{responseReady ? requestResult.response.status : '—'}</span></div>{responseReady ? <><div className="ex-response-headers">{Object.entries(requestResult.response.headers || {}).map(([key, value]) => <code key={key}>{key}: {value}</code>)}</div><pre>{requestResult.response.body === null ? '(empty body · 204)' : JSON.stringify(requestResult.response.body, null, 2)}</pre></> : <p className="ex-placeholder">Send a request to see the status, headers, and response body.</p>}</div>
            </div>
          </div>
          <div className="ex-trace-panel"><div className="ex-card-heading"><div><span>EXECUTION TRACE</span><h3>Watch each matching layer</h3></div><Link to={`${COURSE_PATH}/topic/express-14-query-strings`}>Query strings lesson ↗</Link></div><div className="ex-trace-list">{(requestTrace.length ? requestTrace : [{ label: 'Waiting for request', detail: 'Send a request above to create an execution trace.', state: 'pass' }]).map((item, index) => <TraceRow key={`${item.id}-${index}`} item={item} index={index} active={requestBusy && index === requestTraceCount} complete={index < requestVisibleCount} />)}</div></div>
          <section className="ex-code-panel ex-route-code"><div className="ex-card-heading"><div><span>ROUTE HANDLER / EXPRESS 5</span><h3>Match a path parameter and return JSON</h3></div><Link to={COURSE_PATH + '/topic/express-13-request-params'}>Request params lesson ↗</Link></div><pre>{API_CODE}</pre><p>Express 5 forwards a rejected async handler promise to error middleware. The local try/catch makes that handoff visible in the example.</p></section>
        </motion.section>}

        {view === 'pipeline' && <motion.section key="pipeline" className="ex-view-panel" role="tabpanel" initial={{ opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .2 }}>
          <div className="ex-section-heading"><div><span>03 / PIPELINE BUILDER</span><h2>Order changes behavior</h2><p>Move, disable, and replay middleware. The request follows the active stack from top to bottom.</p></div><span className="ex-version-pill">APP.USE ORDER</span></div>
          <div className="ex-pipeline-layout"><section className="ex-pipeline-builder"><div className="ex-card-heading"><div><span>EXPRESS APP STACK</span><h3>Arrange the request path</h3></div><span className="ex-count-chip">{pipeline.filter((item) => item.enabled).length} active</span></div><div className="ex-pipeline-list">{pipeline.map((item, index) => <article key={item.id} className={`${item.enabled ? 'enabled' : 'disabled'} kind-${item.kind}`}><span className="ex-pipeline-index">{String(index + 1).padStart(2, '0')}</span><div className="ex-pipeline-copy"><b>{item.title}</b><small>{item.kind.toUpperCase()}</small><code>{item.code}</code></div><div className="ex-pipeline-actions"><button type="button" aria-label={`Move ${item.title} up`} disabled={index === 0 || requestBusy} onClick={() => movePipeline(index, -1)}>↑</button><button type="button" aria-label={`Move ${item.title} down`} disabled={index === pipeline.length - 1 || requestBusy} onClick={() => movePipeline(index, 1)}>↓</button><button type="button" aria-pressed={item.enabled} disabled={requestBusy} className={item.enabled ? 'on' : ''} onClick={() => togglePipeline(item.id)}>{item.enabled ? 'ON' : 'OFF'}</button></div></article>)}</div><div className="ex-pipeline-actions-footer"><button type="button" className="ex-primary-button" disabled={requestBusy} onClick={runRequest}>{requestBusy ? 'Tracing…' : 'Replay current request'} →</button><button type="button" className="ex-quiet-button" disabled={requestBusy} onClick={() => { setPipeline(INITIAL_PIPELINE); setRequestResult(null); setRequestTrace([]); setRequestTraceCount(0) }}>Reset order</button></div></section>
            <div className="ex-pipeline-side"><section className="ex-stack-explainer"><span className="ex-kicker">THE CONTROL SIGNALS</span><h3>What does middleware do?</h3><div className="ex-signal"><b>next()</b><span>continue to the next matching layer</span></div><div className="ex-signal response"><b>res.json(...)</b><span>end the cycle and send one response</span></div><div className="ex-signal error"><b>next(err)</b><span>skip normal handlers and enter error flow</span></div><div className="ex-warning-callout">If middleware does none of these, the request waits until the client times out.</div></section><section className="ex-code-panel"><div className="ex-card-heading"><div><span>GENERATED APP ORDER</span><h3>Equivalent Express setup</h3></div></div><pre>{serializedPipeline}</pre><p>Route handlers are middleware too. A handler that sends a response ends this path.</p></section></div></div>
          <div className="ex-trace-panel"><div className="ex-card-heading"><div><span>LAST REPLAY</span><h3>Trace from the current stack</h3></div><Link to={`${COURSE_PATH}/topic/express-23-middleware`}>Middleware lesson ↗</Link></div><div className="ex-trace-list">{(requestTrace.length ? requestTrace : [{ label: 'No replay yet', detail: 'Replay the request to see how the reordered stack behaves.', state: 'pass' }]).map((item, index) => <TraceRow key={`${item.id}-${index}`} item={item} index={index} active={requestBusy && index === requestTraceCount} complete={index < requestVisibleCount} />)}</div></div>
        </motion.section>}

        {view === 'errors' && <motion.section key="errors" className="ex-view-panel" role="tabpanel" initial={{ opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .2 }}>
          <div className="ex-section-heading"><div><span>04 / ERROR LAB</span><h2>Errors take a different route</h2><p>Trigger a failure and trace where Express sends it. Compare how rejected async handlers differ between Express 4 and Express 5.</p></div><label className="ex-version-select">Express version<select disabled={errorBusy} value={expressVersion} onChange={(event) => { setExpressVersion(event.target.value); setErrorResult(null); setErrorTrace([]); setErrorTraceCount(0) }}><option value="5">5.x · course version</option><option value="4">4.x · compatibility</option></select></label></div>
          <div className="ex-error-layout"><section className="ex-error-scenarios"><div className="ex-card-heading"><div><span>SELECT A FAILURE</span><h3>What went wrong?</h3></div></div>{ERROR_CASES.map((item) => <button type="button" key={item.id} disabled={errorBusy} className={errorCase === item.id ? 'selected' : ''} onClick={() => { setErrorCase(item.id); setErrorResult(null); setErrorTrace([]); setErrorTraceCount(0) }}><span>{item.id === 'bad-json' ? '01' : item.id === 'async' ? '02' : item.id === 'not-found' ? '03' : '04'}</span><div><b>{item.title}</b><small>{item.detail}</small></div></button>)}<button type="button" className="ex-primary-button" disabled={errorBusy} onClick={runErrorScenario}>{errorBusy ? 'Following error path…' : 'Run error scenario'} →</button></section>
            <div className="ex-error-detail"><section className="ex-error-code"><div className="ex-card-heading"><div><span>SCENARIO INPUT</span><h3>{activeError.title}</h3></div><Link to={`${COURSE_PATH}/topic/${activeError.lesson}`}>Related lesson ↗</Link></div><pre>{activeError.code}</pre></section><section className="ex-error-trace"><div className="ex-card-heading"><div><span>ERROR FLOW</span><h3>Normal path → error handler</h3></div><span className={`ex-response-code ${errorResult && errorResult.status !== 400 ? 'error' : ''}`}>{errorResult?.status ?? '—'}</span></div><div className="ex-error-lanes"><div><span>REQUEST LANE</span><i /><small>normal middleware</small></div><div><span>ERROR LANE</span><i /><small>(err, req, res, next)</small></div></div><div className="ex-trace-list">{(errorTrace.length ? errorTrace.map(([label, state, detail]) => ({ label, state, detail })) : [{ label: 'Ready to trace', detail: 'Choose a failure and run it to animate the error path.', state: 'pass' }]).map((item, index) => <TraceRow key={item.label + index} item={item} index={index} active={errorBusy && index === errorTraceCount} complete={index < errorTraceCount} />)}</div>{errorResult && !errorBusy && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="ex-error-outcome"><b>Outcome: {errorResult.status}</b><p>{errorResult.explanation}</p></motion.div>}</section></div></div>
          <div className="ex-error-handler-note"><b>Express error middleware has four arguments:</b><code>(err, req, res, next)</code><span>It must be registered after routes. If res.headersSent is already true, delegate with next(err).</span></div>
        </motion.section>}
        {view === 'rendering' && <BrowserEjsView mode={renderMode} setMode={selectRenderMode} busy={renderBusy} step={renderStep} complete={renderComplete} run={runRenderDemo} reduceMotion={reduceMotion} books={books} coursePath={COURSE_PATH} />}
        {view === 'missions' && <MissionView mission={activeMission} missionIndex={missionIndex} missionCount={MISSIONS.length} choice={missionChoice} setChoice={setMissionChoice} busy={missionBusy} traceCount={missionTraceCount} complete={missionComplete} score={missionScore} check={checkMission} next={nextMission} coursePath={COURSE_PATH} />}
      </AnimatePresence>
      <footer className="ex-studio-footer"><span>EXPRESS REQUEST STUDIO</span><p>Hands-on model of Express 5 request flow. The client and server visuals are simulated locally; they do not start a Node server or send network traffic.</p><Link to={COURSE_PATH}>Back to the full Express course ↑</Link></footer>
    </div>
  </main>
}
