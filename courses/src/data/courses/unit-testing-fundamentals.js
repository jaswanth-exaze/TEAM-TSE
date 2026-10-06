const partDefinitions = [
  {
    id: 'testing-foundations',
    label: 'Part 1',
    title: 'Build a testing mindset',
    summary: 'Learn what a unit test checks, why fast feedback matters, and how to choose useful examples.',
    newTopics: 3,
    totalTopics: 3,
    topics: [
      [1, 'Unit Test Foundations', 'Define a unit test, compare it with integration and end-to-end tests, and understand the test pyramid.', 'Unit-Testing-Foundations'],
      [2, 'Why Tests Matter', 'See how tests catch regressions early, document behavior, support refactoring, and encourage small designs.', 'Why-Tests-Matter'],
      [3, 'Test Quality and Testing Approaches', 'Apply F.I.R.S.T. and choose state, behavior, edge, table-driven, regression, or property-based checks.', 'Test-Quality-and-Approaches'],
    ],
  },
  {
    id: 'isolate-dependencies',
    label: 'Part 2',
    title: 'Choose what to isolate',
    summary: 'Use test doubles with care and understand where temporary databases help or mislead.',
    newTopics: 2,
    totalTopics: 5,
    topics: [
      [4, 'Mocks, Stubs, Fakes, Spies, and Dummies', 'Distinguish the five common test doubles, why they are used, and when excessive mocking is a warning.', 'Test-Doubles'],
      [5, 'In-Memory Databases', 'Balance fast, realistic data checks against differences from the production database.', 'In-Memory-Databases'],
    ],
  },
  {
    id: 'test-driven-development',
    label: 'Part 3',
    title: 'Work in small TDD cycles',
    summary: 'Practise Red–Green–Refactor, learn the three laws, and compare two common TDD styles.',
    newTopics: 3,
    totalTopics: 8,
    topics: [
      [6, 'TDD and the Three Laws', 'Understand test-driven development as a small-step design process and learn Uncle Bob’s three laws.', 'TDD-and-the-Three-Laws'],
      [7, 'Red, Green, Refactor', 'Move from a failing test to the simplest passing code, then improve the design safely.', 'Red-Green-Refactor'],
      [8, 'Two Schools of TDD and When to Use Them', 'Compare inside-out and outside-in workflows and choose a sensible approach for the problem.', 'TDD-Styles-and-Tradeoffs'],
    ],
  },
  {
    id: 'reliable-test-suites',
    label: 'Part 4',
    title: 'Build a reliable test suite',
    summary: 'Avoid fragile testing habits, follow the reading trail, and check your understanding.',
    newTopics: 3,
    totalTopics: 11,
    topics: [
      [9, 'Common Testing Mistakes', 'Test behavior rather than implementation, keep refactoring, work in small steps, and value meaningful coverage.', 'Common-Testing-Mistakes'],
      [10, 'Further Reading and Study Resources', 'Follow the sources and books named in the supplied learning notes.', 'Further-Reading'],
      [11, 'Exam Preparation: Questions and Answers', 'Review the core ideas with 15 questions and model answers.', 'Exam-Preparation'],
    ],
  },
]

function toTopic([number, title, summary, fileName], part) {
  const paddedNumber = String(number).padStart(2, '0')
  const slug = title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    id: `unit-testing-${paddedNumber}-${slug}`,
    file: `${paddedNumber}-${fileName}.md`,
    number,
    title,
    summary,
    outcome: summary,
    category: part.label,
    part: { id: part.id, label: part.label, title: part.title },
  }
}

export const UNIT_TESTING_PARTS = partDefinitions.map((part) => ({
  ...part,
  topics: part.topics.map((topic) => toTopic(topic, part)),
}))

export const UNIT_TESTING_TOPICS = UNIT_TESTING_PARTS.flatMap((part) => part.topics)

const lessonFiles = import.meta.glob('./UNIT-TESTING/lessons/[0-9][0-9]-*.md', { query: '?raw', import: 'default' })

export async function loadUnitTestingTopic(id) {
  const topic = UNIT_TESTING_TOPICS.find((item) => item.id === id)
  if (!topic) return null

  const loadFile = lessonFiles[`./UNIT-TESTING/lessons/${topic.file}`]
  if (!loadFile) return null

  const markdown = await loadFile()
  return { ...topic, markdown, status: 'full' }
}
