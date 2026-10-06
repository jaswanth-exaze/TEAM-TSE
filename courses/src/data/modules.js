// Central registry of every module. `quiz` is dynamically imported so we
// only load the questions for the module the user actually opens.
import { ADDITIONAL_QUESTIONS } from './quizzes/question-additions.js'

const loadQuiz = (moduleId, importer) => () =>
  importer().then((quiz) => ({
    ...quiz,
    default: [...quiz.default, ...(ADDITIONAL_QUESTIONS[moduleId] || [])],
  }))

export const TRACKS = [
  {
    id: 'foundation',
    label: 'Foundation Modules',
    modules: [
      { id: 'mysql', title: 'MySQL', tagline: 'Queries, joins, indexes & transactions', icon: 'database', color: '#4f7cff', questionCount: 52 },
      { id: 'linux-commands', title: 'Linux Commands', tagline: 'Shell, permissions, processes & pipes', icon: 'terminal', color: '#f5a623', questionCount: 40 },
      { id: 'git', title: 'Git', tagline: 'Branching, merging, rebasing & recovery', icon: 'git', color: '#ff5c5c', questionCount: 40 },
      { id: 'html-css-javascript', title: 'HTML + CSS + JavaScript', tagline: 'The web platform fundamentals', icon: 'code', color: '#f7df1e', questionCount: 40 },
      { id: 'node-js', title: 'Node.js', tagline: 'Event loop, modules & async I/O', icon: 'node', color: '#68a063', questionCount: 40 },
      { id: 'unit-testing-fundamentals', title: 'Unit Testing Fundamentals', tagline: 'Test design, test doubles & TDD', icon: 'test', color: '#a06cf7', questionCount: 40 },
      { id: 'feature-toggle-fundamentals', title: 'Feature Toggle Fundamentals', tagline: 'Rollouts, flags & release strategy', icon: 'toggle', color: '#33c9a3', questionCount: 40 },
      { id: 'rest-api-fundamentals', title: 'REST API Fundamentals', tagline: 'Verbs, status codes & idempotency', icon: 'api', color: '#ff8a5c', questionCount: 40 },
      { id: 'password-salt-hash-fundamenta', title: 'Password Salt + Hash Fundamentals', tagline: 'Hashing, salting & credential security', icon: 'lock', color: '#5cd6ff', questionCount: 40 },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced Tracks',
    modules: [
      { id: 'c-sharp', title: 'C#', tagline: 'LINQ, async/await & the CLR', icon: 'code', color: '#9b4de0', questionCount: 40 },
      { id: 'java', title: 'Java', tagline: 'JVM internals, collections & concurrency', icon: 'coffee', color: '#e0752f', questionCount: 40 },
      { id: 'reactjs', title: 'ReactJS', tagline: 'Hooks, rendering & state pitfalls', icon: 'react', color: '#61dafb', questionCount: 40 },
      { id: 'angularjs', title: 'AngularJS', tagline: 'Directives, DI & digest cycles', icon: 'angular', color: '#dd0031', questionCount: 40 },
      { id: 'react-native', title: 'React Native', tagline: 'Bridges, navigation & native modules', icon: 'mobile', color: '#00c2ff', questionCount: 40 },
      { id: 'flutter', title: 'Flutter', tagline: 'Widgets, state & the render tree', icon: 'flutter', color: '#54c5f8', questionCount: 40 },
      { id: 'python-machine-learning', title: 'Python - Machine Learning', tagline: 'Models, metrics & overfitting traps', icon: 'brain', color: '#ffd43b', questionCount: 40 },
    ],
  },
]

export const ALL_MODULES = TRACKS.flatMap(t => t.modules)

export function getModule(id) {
  return ALL_MODULES.find(m => m.id === id)
}

// Lazy loaders — one entry per module id. Add the file to src/data/quizzes/
// and it will automatically become playable.
export const quizLoaders = {
  'mysql': loadQuiz('mysql', () => import('./quizzes/mysql.js')),
  'linux-commands': loadQuiz('linux-commands', () => import('./quizzes/linux-commands.js')),
  'git': loadQuiz('git', () => import('./quizzes/git.js')),
  'html-css-javascript': loadQuiz('html-css-javascript', () => import('./quizzes/html-css-javascript.js')),
  'node-js': loadQuiz('node-js', () => import('./quizzes/node-js.js')),
  'unit-testing-fundamentals': loadQuiz('unit-testing-fundamentals', () => import('./quizzes/unit-testing-fundamentals.js')),
  'feature-toggle-fundamentals': loadQuiz('feature-toggle-fundamentals', () => import('./quizzes/feature-toggle-fundamentals.js')),
  'rest-api-fundamentals': loadQuiz('rest-api-fundamentals', () => import('./quizzes/rest-api-fundamentals.js')),
  'password-salt-hash-fundamenta': loadQuiz('password-salt-hash-fundamenta', () => import('./quizzes/password-salt-hash-fundamenta.js')),
  'c-sharp': loadQuiz('c-sharp', () => import('./quizzes/c-sharp.js')),
  'java': loadQuiz('java', () => import('./quizzes/java.js')),
  'reactjs': loadQuiz('reactjs', () => import('./quizzes/reactjs.js')),
  'angularjs': loadQuiz('angularjs', () => import('./quizzes/angularjs.js')),
  'react-native': loadQuiz('react-native', () => import('./quizzes/react-native.js')),
  'flutter': loadQuiz('flutter', () => import('./quizzes/flutter.js')),
  'python-machine-learning': loadQuiz('python-machine-learning', () => import('./quizzes/python-machine-learning.js')),
}
