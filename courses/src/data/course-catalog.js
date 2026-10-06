import { ALL_MODULES } from './modules'
import { GIT_SYLLABUS } from './git-course'
import { HTML_CSS_JAVASCRIPT_SYLLABUS } from './html-css-javascript-course'
import { LINUX_SYLLABUS } from './linux-course'
import { NODE_PARTS } from './courses/node-js'
import { EXPRESS_PARTS } from './courses/express'
import { REST_API_PARTS } from './courses/rest-api'
import { UNIT_TESTING_PARTS } from './courses/unit-testing-fundamentals'
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
    hasQuiz: false,
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
