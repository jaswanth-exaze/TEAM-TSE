const partDefinitions = [
  {
    id: 'password-security-basics',
    label: 'Part 1',
    title: 'Understand password risk and hashes',
    summary: 'Build the threat model, distinguish cryptographic transformations, and understand why fast hashes are unsafe for passwords.',
    newTopics: 4,
    totalTopics: 4,
    topics: [
      [1, 'Why Passwords Need Protection', 'Model password threats, breach impact, credential reuse, and safe storage goals.', 'why-passwords-need-protection'],
      [2, 'Encoding, Encryption, and Hashing', 'Compare reversibility, keys, use cases, and the right tool for each data problem.', 'encoding-encryption-hashing'],
      [3, 'Hash Function Properties and Algorithms', 'Learn deterministic digests, avalanche behavior, collision resistance, and MD5/SHA-1/SHA-256 trade-offs.', 'hash-functions-and-algorithms'],
      [4, 'Attacks on Fast Password Hashes', 'Understand brute force, dictionary attacks, rainbow tables, and why GPUs change the economics.', 'attacks-on-fast-hashes'],
    ],
  },
  {
    id: 'salted-password-hashing',
    label: 'Part 2',
    title: 'Build secure password verifiers',
    summary: 'Use unique salts, understand peppers and encoded hash formats, and choose a password-specific KDF and work factor.',
    newTopics: 3,
    totalTopics: 7,
    topics: [
      [5, 'Salts, Peppers, and Stored Hash Formats', 'Generate unique salts, keep peppers outside the database, and parse self-describing formats.', 'salts-peppers-and-formats'],
      [6, 'Slow Password Hashing Algorithms', 'Compare PBKDF2, bcrypt, scrypt, and Argon2; tune cost for your environment.', 'slow-password-hashing'],
      [7, 'Password Hashing in Node.js', 'Implement password hash creation with Node crypto, bcrypt, and argon2id.', 'password-hashing-in-nodejs'],
    ],
  },
  {
    id: 'verification-and-defence',
    label: 'Part 3',
    title: 'Verify safely and defend accounts',
    summary: 'Verify and migrate password hashes safely, layer account defenses, and practise the economics of weak hashes in a bounded lab.',
    newTopics: 3,
    totalTopics: 10,
    topics: [
      [8, 'Password Verification, Timing, and Migration', 'Use library verification, reduce timing leaks, and upgrade legacy hashes on successful login.', 'verification-timing-and-migration'],
      [9, 'Password Policy and Defence in Depth', 'Pair strong hashing with breached-password checks, rate limits, credential-stuffing defenses, and MFA.', 'password-policy-and-defence-in-depth'],
      [10, 'Hands-on Lab: Crack Your Own Toy Hashes', 'Create weak sample hashes, recover them from a tiny local candidate list, and compare with a slow password KDF.', 'lab-crack-your-own-toy-hashes'],
    ],
  },
]

function toTopic([number, title, summary, fileName], part) {
  const paddedNumber = String(number).padStart(2, '0')
  const slug = title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    id: `password-salt-hash-${paddedNumber}-${slug}`,
    file: `${paddedNumber}-${fileName}.md`,
    number,
    title,
    summary,
    outcome: summary,
    category: part.label,
    part: { id: part.id, label: part.label, title: part.title },
  }
}

export const PASSWORD_SALT_HASH_PARTS = partDefinitions.map((part) => ({
  ...part,
  topics: part.topics.map((topic) => toTopic(topic, part)),
}))

export const PASSWORD_SALT_HASH_TOPICS = PASSWORD_SALT_HASH_PARTS.flatMap((part) => part.topics)

const lessonFiles = import.meta.glob(
  './Password Salt + Hash Fundamental/lessions/[0-9][0-9]-*.md',
  { query: '?raw', import: 'default' },
)

export async function loadPasswordSaltHashTopic(id) {
  const topic = PASSWORD_SALT_HASH_TOPICS.find((item) => item.id === id)
  if (!topic) return null

  const loadFile = lessonFiles[`./Password Salt + Hash Fundamental/lessions/${topic.file}`]
  if (!loadFile) return null

  const markdown = await loadFile()
  return { ...topic, markdown, status: 'full' }
}
