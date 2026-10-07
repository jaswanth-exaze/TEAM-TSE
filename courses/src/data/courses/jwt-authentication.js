const partDefinitions = [
  {
    id: 'jwt-api-foundations',
    label: 'Part 1',
    title: 'Set up the authentication API',
    summary: 'Build route/controller structure, validate requests, and prepare the MySQL user store.',
    topics: [
      [1, 'Adding User Routes', 'Create the Express router, register user endpoints, and establish the project structure.', 'adding-user-routes'],
      [2, 'Adding User Controller', 'Move request logic into controllers and add reusable validation and error handling.', 'adding-user-controller'],
      [3, 'MySQL Database and User Table', 'Configure mysql2/promise, connect with a pool, and define user-table queries.', 'mysql-database-and-user-table'],
      [4, 'User Registration and Password Hashing', 'Validate registration, hash passwords with bcrypt, handle duplicate emails, and return safe data.', 'user-registration-and-password-hashing'],
    ],
  },
  {
    id: 'jwt-token-fundamentals',
    label: 'Part 2',
    title: 'Issue and verify access tokens',
    summary: 'Understand JWT structure, implement login, protect routes, and verify bearer tokens.',
    topics: [
      [5, 'What Is JWT?', 'Learn token structure, signing, claims, expiry, and what a JWT does not protect.', 'what-is-jwt'],
      [6, 'User Login and JWT Access Token', 'Verify credentials and issue a short-lived signed access token.', 'user-login-and-jwt-access-token'],
      [7, 'Protecting User Routes', 'Restrict private user endpoints and return current account information safely.', 'protecting-routes-user'],
      [8, 'Verify JWT Token Middleware', 'Validate bearer tokens, handle failure cases, and attach the authenticated identity.', 'verify-jwt-token-middleware'],
    ],
  },
  {
    id: 'jwt-contact-authorization',
    label: 'Part 3',
    title: 'Model ownership and protect contact routes',
    summary: 'Use relational ownership and authentication middleware to prevent cross-user data access.',
    topics: [
      [9, 'Handle User and Contact Relationships', 'Create MySQL foreign-key relationships and scope contact queries to the token owner.', 'handle-relationship-user-and-contact-schema'],
      [10, 'Protecting Contact Routes', 'Apply authentication middleware consistently to private contact endpoints.', 'protecting-routes-contact'],
      [11, 'Get All Contacts for the Logged-in User', 'List and retrieve contacts with owner-scoped parameterized SQL.', 'logged-in-user-get-all-contacts'],
      [12, 'Create a Contact for the Logged-in User', 'Validate contact input and assign ownership from the verified token.', 'logged-in-user-create-new-contact'],
    ],
  },
  {
    id: 'jwt-contact-management',
    label: 'Part 4',
    title: 'Complete secure contact management',
    summary: 'Implement owner-only updates and deletion, then review the end-to-end security model.',
    topics: [
      [13, 'Update the Logged-in User’s Contact', 'Whitelist mutable fields and update only a row owned by the caller.', 'logged-in-user-update-contact'],
      [14, 'Delete the Logged-in User’s Contact', 'Delete contacts safely, use MySQL cascading behavior, and review the finished project.', 'logged-in-user-delete-contact'],
    ],
  },
]

function topicFromDefinition([number, title, summary, fileName], part) {
  const paddedNumber = String(number).padStart(2, '0')
  const slug = title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    id: `jwt-${paddedNumber}-${slug}`,
    file: `${paddedNumber}-${fileName}.md`,
    number,
    title,
    summary,
    outcome: summary,
    category: part.label,
    part: { id: part.id, label: part.label, title: part.title },
  }
}

export const JWT_AUTHENTICATION_PARTS = partDefinitions.map((part) => ({
  ...part,
  topics: part.topics.map((topic) => topicFromDefinition(topic, part)),
}))

export const JWT_AUTHENTICATION_TOPICS = JWT_AUTHENTICATION_PARTS.flatMap((part) => part.topics)

const lessonFiles = import.meta.glob(
  './JWT-authentication/lessions/[0-9][0-9]-*.md',
  { query: '?raw', import: 'default' },
)

export async function loadJwtAuthenticationTopic(id) {
  const topic = JWT_AUTHENTICATION_TOPICS.find((item) => item.id === id)
  if (!topic) return null

  const loadFile = lessonFiles[`./JWT-authentication/lessions/${topic.file}`]
  if (!loadFile) return null

  const markdown = await loadFile()
  return { ...topic, markdown, status: 'full' }
}
