const partDefinitions = [
  {
    id: 'api-foundations',
    label: 'Part 1',
    title: 'Understand APIs and REST',
    summary: 'Build a clear mental model of APIs, HTTP, resources, and the constraints that shape REST systems.',
    topics: [
      [1, 'Introduction to APIs', 'Learn what an API does, how clients and servers communicate, and where APIs appear in everyday software.', 'Introduction-to-APIs'],
      [2, 'What is REST?', 'Understand REST as a resource-oriented architectural style and distinguish it from a protocol or library.', 'What-is-REST'],
      [3, 'HTTP Basics', 'Read the request–response cycle, HTTP methods, headers, status codes, and common URL parameters.', 'HTTP-Basics'],
      [4, 'REST Architectural Constraints', 'Explore the six REST constraints and how they support scalable, reliable client–server systems.', 'REST-Architectural-Constraints'],
    ],
  },
  {
    id: 'resource-design',
    label: 'Part 2',
    title: 'Model resources and operations',
    summary: 'Turn domain concepts into consistent URIs, then map HTTP methods to safe, predictable resource changes.',
    topics: [
      [5, 'Resources, URIs & Resource Modeling', 'Choose resource boundaries, design readable URIs, and use collections, items, and query parameters.', 'Resources-URIs-Resource-Modeling'],
      [6, 'HTTP Methods & CRUD Mapping', 'Apply GET, POST, PUT, PATCH, and DELETE with the right safety, idempotency, and response behavior.', 'HTTP-Methods-CRUD-Mapping'],
      [7, 'Request & Response Anatomy', 'Understand request lines, headers, bodies, response status lines, and practical HTTP examples.', 'Request-Response-Anatomy'],
      [8, 'Idempotency & Safety', 'Distinguish safe methods from idempotent ones and design operations that tolerate retries.', 'Idempotency-and-Safety'],
    ],
  },
  {
    id: 'production-practices',
    label: 'Part 3',
    title: 'Design reliable API responses',
    summary: 'Make APIs easier to consume and evolve with useful status codes, JSON conventions, versioning, and clear errors.',
    topics: [
      [9, 'Status Codes in Practice', 'Choose status codes that tell clients whether a request succeeded, needs action, or failed.', 'Status-Codes-in-Practice'],
      [10, 'Content Negotiation & JSON', 'Use Accept and Content-Type correctly and design predictable JSON representations.', 'Content-Negotiation-and-JSON'],
      [11, 'Versioning Basics', 'Compare versioning strategies and plan safe API evolution and deprecation.', 'Versioning-Basics'],
      [12, 'Error Handling Best Practices', 'Return consistent, actionable error details without exposing internal server information.', 'Error-Handling-Best-Practices'],
      [13, 'Common Pitfalls & Best Practices', 'Recognize common design mistakes and apply a practical API quality checklist.', 'Common-Pitfalls-and-Best-Practices'],
      [14, 'Quick Reference Tables', 'Review concise reference tables for methods, status codes, headers, naming, and REST constraints.', 'Quick-Reference-Tables'],
      [15, 'Practice & Self-Check Questions', 'Apply the course concepts to short questions, mixed scenarios, and a final API design challenge.', 'Practice-Self-Check-Questions'],
    ],
  },
]

function topicFromDefinition([number, title, summary, fileName], part) {
  const paddedNumber = String(number).padStart(2, '0')
  const slug = title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    id: `rest-${paddedNumber}-${slug}`,
    file: `${paddedNumber}-${fileName}.md`,
    number,
    title,
    summary,
    outcome: summary,
    category: part.label,
    part: { id: part.id, label: part.label, title: part.title },
  }
}

export const REST_API_PARTS = partDefinitions.map((definition) => ({
  ...definition,
  topics: definition.topics.map((item) => topicFromDefinition(item, definition)),
}))

export const REST_API_TOPICS = REST_API_PARTS.flatMap((part) => part.topics)

const lessonFiles = import.meta.glob('./REST-API/lessions/[0-9][0-9]-*.md', { query: '?raw', import: 'default' })

export async function loadRestApiTopic(id) {
  const topic = REST_API_TOPICS.find((item) => item.id === id)
  if (!topic) return null

  const loadFile = lessonFiles[`./REST-API/lessions/${topic.file}`]
  if (!loadFile) return null

  const markdown = await loadFile()
  return { ...topic, markdown, status: 'full' }
}
