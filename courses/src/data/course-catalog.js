import { ALL_MODULES } from './modules'
import { GIT_SYLLABUS } from './git-course'
import { HTML_CSS_JAVASCRIPT_SYLLABUS } from './html-css-javascript-course'
import { LINUX_SYLLABUS } from './linux-course'
import { NODE_PARTS } from './courses/node-js'
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
