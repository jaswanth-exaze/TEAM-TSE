import { ALL_MODULES } from './modules'
import { GIT_SYLLABUS } from './git-course'
import { HTML_CSS_JAVASCRIPT_SYLLABUS } from './html-css-javascript-course'
import { LINUX_SYLLABUS } from './linux-course'
import { NODE_PARTS } from './courses/node-js'
import { EXPRESS_PARTS } from './courses/express'
import { REST_API_PARTS } from './courses/rest-api'
import { UNIT_TESTING_PARTS } from './courses/unit-testing-fundamentals'
import { PASSWORD_SALT_HASH_PARTS } from './courses/password-salt-hash-fundamentals'
import { JWT_AUTHENTICATION_PARTS } from './courses/jwt-authentication'
import { MYSQL_DAILY_UPDATE_TEMPLATE, MYSQL_PARTS, MYSQL_STUDY_RESOURCES } from './mysql-course'
import { MYSQL_PRACTICE_ACTIVITIES, MYSQL_TOPIC_STATUS } from './courses/mysql'

const mysqlPartsWithLessonStatus = MYSQL_PARTS.map((part) => ({
  ...part,
  topics: part.topics.map((topic) => ({
    ...topic,
    lessonStatus: MYSQL_TOPIC_STATUS[topic.id] || 'outline',
  })),
}))

// Add authored course content here as each module's material is supplied.
// The reader and landing page are shared by every module.
const COURSE_CONTENT = {
  mysql: {
    title: 'MySQL Course',
    subtitle: 'SQL foundations, reporting, joins, and advanced query patterns.',
    curriculumTitle: 'Three cumulative parts',
    parts: mysqlPartsWithLessonStatus,
    practiceUnits: MYSQL_PRACTICE_ACTIVITIES,
    contentNote: 'Some lessons are still being written.',
    resources: MYSQL_STUDY_RESOURCES,
    dailyUpdateTemplate: MYSQL_DAILY_UPDATE_TEMPLATE,
    examRoute: '/study/mysql/exams',
    program: {
      stats: [
        ['40 hours', 'About five study days per part'],
        ['8 hours', 'Daily study target and update'],
        ['Up to 3', 'Official attempts for each part'],
        ['Cumulative', 'Each later exam includes earlier topics'],
      ],
      schedule: [
        ['Day 1', 'Read the new lessons. Write small examples and note unfamiliar terms.'],
        ['Day 2', 'Practise each statement from a blank page; check table and result shapes.'],
        ['Day 3', 'Combine topics in realistic queries. Explain why each clause is needed.'],
        ['Day 4', 'Review earlier parts and retry questions you previously missed.'],
        ['Day 5', 'Attempt a mock without notes, then review mistakes and open doubts.'],
      ],
      scheduleTitle: 'Repeat this five-day loop for each part',
      scheduleNote: 'Plan for about eight study hours each day. Raise questions and blockers early rather than waiting until the exam.',
      examFormat: [
        'Official exams are live query-writing sessions over a recorded Microsoft Teams call.',
        'No Google or other external aids are allowed during the official exam.',
        'Later parts are cumulative. Each part allows up to three official attempts.',
        'After an exam, review the written feedback and recording before your next attempt.',
      ],
    },
  },
  'node-js': {
    title: 'Node.js Course',
    subtitle: 'A beginner-friendly, build-along guide that takes you from installing Node.js to completing a Task Manager API.',
    curriculumTitle: '26 beginner lessons in four parts',
    parts: NODE_PARTS,
    resources: [
      { title: 'Node.js Learn', kind: 'Official reference', href: 'https://nodejs.org/en/learn', description: 'Official getting-started guides and explanations of Node.js concepts.' },
      { title: 'Node.js API documentation', kind: 'Official reference', href: 'https://nodejs.org/api/', description: 'Reference for built-in modules such as HTTP, fs, path, os, url, crypto, events, and process.' },
      { title: 'Express routing guide', kind: 'Official reference', href: 'https://expressjs.com/en/guide/routing.html', description: 'Official guide to routes, methods, paths, and route handlers.' },
      { title: 'Express middleware guide', kind: 'Official reference', href: 'https://expressjs.com/en/guide/using-middleware.html', description: 'Official guide to middleware, request flow, static files, and built-in body parsers.' },
      { title: 'npm documentation', kind: 'Official reference', href: 'https://docs.npmjs.com/', description: 'Reference for package.json, installing packages, and npm scripts.' },
      { title: 'Postman Learning Center', kind: 'Tutorial', href: 'https://learning.postman.com/docs/getting-started/first-steps/sending-the-first-request/', description: 'Learn how to configure and send HTTP requests in Postman.' },
    ],
  },
  express: {
    title: 'Express.js Fundamentals',
    subtitle: 'Build Express servers and APIs from setup through routing, middleware, frontend requests, and EJS views.',
    curriculumTitle: '34 lessons in four learning parts',
    parts: EXPRESS_PARTS,
    resources: [
      { title: 'Express documentation', kind: 'Official reference', href: 'https://expressjs.com/en/4x/api.html', description: 'API reference for Express applications, requests, responses, routers, and middleware.' },
      { title: 'Express guide', kind: 'Official reference', href: 'https://expressjs.com/en/guide/routing.html', description: 'Learn routing, middleware, error handling, and common Express application patterns.' },
      { title: 'Node.js environment variables', kind: 'Official reference', href: 'https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs', description: 'Understand how Node.js reads environment variables and local configuration.' },
      { title: 'EJS documentation', kind: 'Official reference', href: 'https://ejs.co/', description: 'Reference for EJS tags, includes, and rendering templates.' },
      { title: 'Postman Learning Center', kind: 'Tutorial', href: 'https://learning.postman.com/docs/getting-started/first-steps/sending-the-first-request/', description: 'Learn to configure and send HTTP requests while practising the API lessons.' },
    ],
  },
  'rest-api-fundamentals': {
    title: 'REST API Fundamentals',
    subtitle: 'A structured introduction to REST API design, from HTTP and resources to reliable responses, versioning, and practical checks.',
    curriculumTitle: '15 lessons in three learning parts',
    parts: REST_API_PARTS,
    resources: [
      { title: 'HTTP Semantics', kind: 'Standard', href: 'https://www.rfc-editor.org/rfc/rfc9110', description: 'The HTTP standard for methods, status codes, fields, and message semantics.' },
      { title: 'HTTP Semantics: Safe Methods', kind: 'Standard', href: 'https://www.rfc-editor.org/rfc/rfc9110#name-safe-methods', description: 'The standard definition and behavior of safe request methods.' },
      { title: 'HTTP Semantics: Idempotent Methods', kind: 'Standard', href: 'https://www.rfc-editor.org/rfc/rfc9110#name-idempotent-methods', description: 'The standard definition of idempotent methods and their retry behavior.' },
      { title: 'Problem Details for HTTP APIs', kind: 'Standard', href: 'https://www.rfc-editor.org/rfc/rfc9457', description: 'A standard format for machine-readable HTTP API error responses.' },
    ],
  },
  'unit-testing-fundamentals': {
    title: 'Unit Testing Fundamentals',
    subtitle: 'Learn to design fast, trustworthy tests, isolate dependencies, and improve code through small TDD cycles.',
    curriculumTitle: '11 lessons in four learning parts',
    parts: UNIT_TESTING_PARTS,
    contentNoteTitle: 'Language-independent learning path',
    contentNote: 'The core ideas apply across languages and test frameworks. The examples focus on test behavior and design rather than framework-specific syntax.',
    program: {
      stats: [
        ['11 lessons', 'Four cumulative learning parts'],
        ['2 weeks', 'Suggested self-paced plan'],
        ['15 questions', 'End-of-course review'],
        ['40 questions', 'Optional course quiz'],
      ],
      scheduleTitle: 'A suggested two-week sequence',
      schedule: [
        ['Days 1–3', 'Work through test levels, the value of tests, F.I.R.S.T., and testing approaches.'],
        ['Days 4–5', 'Compare test doubles and learn the limits of in-memory databases.'],
        ['Days 6–8', 'Study the Three Laws and practise the Red–Green–Refactor cycle.'],
        ['Days 9–11', 'Compare TDD styles, review tradeoffs, and check common testing mistakes.'],
        ['Days 12–14', 'Review the reading list, answer the questions from memory, then try the quiz.'],
      ],
      scheduleNote: 'Treat this as a flexible guide. Spend extra time on the test types and dependencies that are new to you.',
    },
  },
  'password-salt-hash-fundamenta': {
    title: 'Password Salt + Hash Fundamentals',
    subtitle: 'Learn how password hashes protect accounts, how salts and work factors help, and how to verify credentials safely.',
    curriculumTitle: '10 lessons in three learning parts',
    parts: PASSWORD_SALT_HASH_PARTS,
    contentNoteTitle: 'Hands-on, language-aware learning path',
    contentNote: 'The concepts apply across platforms. Implementation examples use Node.js built-in crypto, bcrypt, and argon2id. The final lab only cracks toy hashes created by the learner.',
    resources: [
      { title: 'OWASP Password Storage Cheat Sheet', kind: 'Security guidance', href: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', description: 'Recommended password hashing approaches, parameters, migration, and pepper handling.' },
      { title: 'Node.js crypto documentation', kind: 'Official reference', href: 'https://nodejs.org/api/crypto.html', description: 'Reference for randomBytes, pbkdf2, scrypt, timingSafeEqual, and cryptographic APIs.' },
      { title: 'NIST SP 800-63B', kind: 'Standard', href: 'https://pages.nist.gov/800-63-4/sp800-63b.html', description: 'Digital identity guidance for memorized secrets, authentication, and verifier requirements.' },
    ],
    program: {
      stats: [
        ['10 lessons', 'Three cumulative learning parts'],
        ['3 algorithms', 'Create hashes using Node crypto, bcrypt, and argon2id'],
        ['1 safe lab', 'Recover only hashes created for the exercise'],
        ['40 questions', 'Optional course quiz'],
      ],
      scheduleTitle: 'A suggested one-week sequence',
      schedule: [
        ['Days 1–2', 'Study password threats, transformations, hash properties, and fast-hash attacks.'],
        ['Days 3–4', 'Work through salt, pepper, encoded formats, and password-specific KDF trade-offs.'],
        ['Day 5', 'Run the Node.js hashing examples and note the algorithms and parameters stored.'],
        ['Day 6', 'Review verification timing, hash migration, password policy, and layered defenses.'],
        ['Day 7', 'Complete the own-hashes-only lab, explain the results, then take the course quiz.'],
      ],
      scheduleNote: 'Tune examples on a representative deployment host. Do not benchmark or attempt recovery against hashes you do not own or have explicit permission to test.',
    },
  },
  'jwt-authentication': {
    title: 'JWT Authentication',
    subtitle: 'Build a secure authentication API with user registration, password hashing, JWT access tokens, and owner-scoped contact routes.',
    curriculumTitle: '14 lessons in four learning parts',
    parts: JWT_AUTHENTICATION_PARTS,
    contentNoteTitle: 'Build-along backend course',
    contentNote: 'Lessons use Express, Node.js, bcrypt, JWT, and MySQL with mysql2/promise. Follow the examples with a local development database and never commit secrets.',
    resources: [
      { title: 'JSON Web Token introduction', kind: 'Reference', href: 'https://jwt.io/introduction', description: 'Understand JWT structure, claims, signing, and common use cases.' },
      { title: 'OWASP Password Storage Cheat Sheet', kind: 'Security guidance', href: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', description: 'Guidance for securely storing password verifiers.' },
      { title: 'MySQL2 documentation', kind: 'Library reference', href: 'https://sidorares.github.io/node-mysql2/docs', description: 'Connection pools and promise-based prepared queries for MySQL in Node.js.' },
    ],
    program: {
      stats: [
        ['14 lessons', 'Four cumulative learning parts'],
        ['40 questions', 'Optional course quiz'],
        ['1 API', 'Register, log in, and manage contacts'],
        ['MySQL', 'Persistent users and owner-linked contacts'],
        ['Security first', 'Password hashing, JWT verification, and authorization'],
      ],
      scheduleTitle: 'A suggested two-week sequence',
      schedule: [
        ['Days 1–3', 'Set up routes and controllers; learn validation and error handling.'],
        ['Days 4–6', 'Create the MySQL schema and implement secure registration and login.'],
        ['Days 7–9', 'Understand JWTs, protect user routes, and verify bearer tokens.'],
        ['Days 10–12', 'Model users and contacts, then implement owner-scoped read and create operations.'],
        ['Days 13–14', 'Add update/delete behavior and test authentication and cross-user access.'],
      ],
      scheduleNote: 'Use a local MySQL database, keep credentials in an ignored .env file, and test with synthetic users and contacts.',
    },
  },
}

// Syllabus-only entries appear in the course reader without being counted as
// authored lessons or changing lesson progress on the library cards.
const SYLLABUS_ONLY = {
  git: GIT_SYLLABUS,
  'html-css-javascript': HTML_CSS_JAVASCRIPT_SYLLABUS,
  'linux-commands': LINUX_SYLLABUS,
}

export function getCourseContent(moduleId) {
  return COURSE_CONTENT[moduleId] || null
}

export function getCourseSyllabus(moduleId) {
  return getCourseContent(moduleId) || SYLLABUS_ONLY[moduleId] || null
}

export function hasCourseContent(moduleId) {
  return Boolean(COURSE_CONTENT[moduleId])
}

export const COURSE_MODULES = ALL_MODULES.map((module) => ({
  ...module,
  courseContent: getCourseContent(module.id),
  lessonCount: getCourseContent(module.id)?.parts.reduce(
    (count, part) => count + part.topics.length,
    0,
  ) || 0,
}))
