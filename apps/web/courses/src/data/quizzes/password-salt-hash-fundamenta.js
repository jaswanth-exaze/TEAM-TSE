export default [
  {
    id: 'password-security-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Password Hashing',
    prompt: `Two users register with exactly the same password:

Password@123

Your database stores:

User A → $2b$12$...
User B → $2b$12$...

The two stored hashes are completely different.

What is the MOST likely reason?`,
    options: [
      'The passwords were encrypted differently',
      'Each password was hashed using a unique salt',
      'The database modified the hashes',
      'The hashing algorithm is non-deterministic'
    ],
    correctAnswer: 'Each password was hashed using a unique salt',
    explanation: 'Modern password hashing algorithms such as bcrypt generate a unique random salt for every password. Even if two users choose the same password, their hashes are different, preventing attackers from identifying shared passwords and defeating rainbow table attacks.'
  },

  {
    id: 'password-security-2',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Hashing vs Encryption',
    prompt: `A junior developer proposes:

"Let's encrypt passwords instead of hashing them. That way we can recover them if users forget."

How should this proposal be reviewed?`,
    options: [
      'Approve it because encrypted passwords are more secure',
      'Reject it because passwords should be hashed, not encrypted',
      'Approve only for administrators',
      'Either approach is equally secure'
    ],
    correctAnswer: 'Reject it because passwords should be hashed, not encrypted',
    explanation: 'Passwords should never be recoverable. Hashing is a one-way operation designed for verification, while encryption is reversible. Password reset—not password recovery—is the correct security practice.'
  },

  {
    id: 'password-security-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Login Authentication',
    prompt: `A user enters a password during login.

How should the server verify it?`,
    options: [
      'Decrypt the stored password and compare it',
      'Hash the entered password using the stored salt, then compare the resulting hash',
      'Compare the plain text password directly with the database',
      'Generate a completely new random hash'
    ],
    correctAnswer: 'Hash the entered password using the stored salt, then compare the resulting hash',
    explanation: 'During authentication, the stored salt is reused with the password entered by the user. If the newly generated hash matches the stored hash, the password is correct. The original password is never decrypted because hashes are one-way.'
  },

  {
    id: 'password-security-4',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Password Algorithms',
    prompt: `A developer suggests replacing bcrypt with SHA-256 because SHA-256 is much faster.

Should this change be approved?`,
    options: [
      'Yes, faster hashing improves login performance',
      'No, password hashing algorithms should intentionally be slow',
      'Yes, SHA-256 automatically generates salts',
      'Both algorithms provide identical password protection'
    ],
    correctAnswer: 'No, password hashing algorithms should intentionally be slow',
    explanation: 'Algorithms like bcrypt, Argon2, and scrypt are intentionally computationally expensive to slow brute-force attacks. Fast hashing algorithms such as SHA-256 are excellent for data integrity but are unsuitable for password storage.'
  },

  {
    id: 'password-security-5',
    type: 'mcq',
    difficulty: 'expert',
    category: 'bcrypt',
    prompt: `Your security team increases the bcrypt cost factor from 10 to 14.

What is the PRIMARY effect?`,
    options: [
      'Hashes become shorter',
      'Password verification becomes slower but brute-force attacks become significantly harder',
      'Passwords become encrypted instead of hashed',
      'The database requires less storage'
    ],
    correctAnswer: 'Password verification becomes slower but brute-force attacks become significantly harder',
    explanation: 'Increasing bcrypt\'s work factor increases the computation required to hash and verify passwords. This slightly slows legitimate logins but dramatically increases the cost of offline brute-force attacks.'
  },

  {
    id: 'password-security-6',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Production Security',
    prompt: `During a code review you find:

console.log("Password:", password);

const hash = await bcrypt.hash(password, 12);

What is the BIGGEST security concern?`,
    options: [
      'bcrypt should be synchronous',
      'The plain-text password is being written to logs',
      'The bcrypt cost is too high',
      'Passwords should always be converted to uppercase'
    ],
    correctAnswer: 'The plain-text password is being written to logs',
    explanation: 'Application logs should never contain passwords or other secrets. Logs are often accessible to administrators, monitoring systems, and third-party services. Logging passwords creates a serious security risk.'
  },

  {
    id: 'password-security-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Production Incident',
    prompt: `A company's user database is stolen.

The attackers obtain:

• Usernames
• bcrypt password hashes
• Unique salts

The application server was NOT compromised.

What can the attackers still attempt?`,
    options: [
      'Immediately recover every user\'s password',
      'Offline brute-force attacks against individual password hashes',
      'Decrypt the hashes using the stored salts',
      'Generate valid login sessions automatically'
    ],
    correctAnswer: 'Offline brute-force attacks against individual password hashes',
    explanation: 'Salts are not secret—they are designed to be stored alongside password hashes. Their purpose is to prevent precomputed attacks such as rainbow tables. Attackers can still perform offline brute-force attacks, but bcrypt\'s computational cost makes them significantly slower.'
  },
  {
  id: 'password-security-8',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Pepper',
  prompt: `A company's database is stolen.

The attacker obtains:
• User table
• Password hashes
• Unique salts

However, the application server was NOT compromised.

Which additional security mechanism still helps protect the passwords?`,
  options: [
    'Using HTTPS',
    'A server-side pepper stored outside the database',
    'Using UUID primary keys',
    'Compressing the database backups'
  ],
  correctAnswer: 'A server-side pepper stored outside the database',
  explanation: 'Unlike salts, peppers are secret values stored outside the database (often as environment variables or in a secret manager). Even if attackers steal the database, they cannot correctly verify password guesses without also knowing the pepper.'
},

{
  id: 'password-security-9',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Timing Attacks',
  prompt: `A developer compares password hashes like this:

if (storedHash === calculatedHash)

During a security review this implementation is rejected.

Why?`,
  options: [
    'String comparison may leak timing information',
    'JavaScript cannot compare strings',
    'bcrypt hashes cannot be compared',
    'Hashes should always be converted to Base64 first'
  ],
  correctAnswer: 'String comparison may leak timing information',
  explanation: 'Simple string comparisons may stop as soon as a difference is found, making execution time slightly dependent on how much of the value matches. Security libraries use constant-time comparison functions to reduce timing attack risks.'
},

{
  id: 'password-security-10',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Password Reset',
  prompt: `A developer proposes sending this email:

"Your password is: Welcome@123"

How should this proposal be reviewed?`,
  options: [
    'Approve because only the user receives the email',
    'Reject because passwords should never be recoverable',
    'Approve if HTTPS is enabled',
    'Approve if the password is encrypted first'
  ],
  correctAnswer: 'Reject because passwords should never be recoverable',
  explanation: 'A system should never be able to reveal a user\'s password because passwords should only be stored as one-way hashes. Password reset flows should generate temporary reset tokens instead.'
},

{
  id: 'password-security-11',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Authentication',
  prompt: `Which information should normally be stored inside a password reset link?`,
  options: [
    'The user\'s current password',
    'The password hash',
    'A cryptographically secure, time-limited reset token',
    'The user\'s security questions'
  ],
  correctAnswer: 'A cryptographically secure, time-limited reset token',
  explanation: 'Password reset links should contain a random token with a short expiration time. Passwords and password hashes should never appear in reset URLs.'
},

{
  id: 'password-security-12',
  type: 'multi',
  difficulty: 'expert',
  category: 'Brute Force Protection',
  prompt: `An attacker is attempting thousands of password guesses against login accounts.

Which defenses are appropriate? (Select all that apply)`,
  options: [
    'Rate limiting',
    'Temporary account lockout',
    'Multi-factor authentication (MFA)',
    'Store passwords in plain text',
    'CAPTCHA after repeated failures'
  ],
  correctAnswer: [
    'Rate limiting',
    'Temporary account lockout',
    'Multi-factor authentication (MFA)',
    'CAPTCHA after repeated failures'
  ],
  explanation: 'Modern authentication systems layer multiple defenses. Rate limiting, lockouts, CAPTCHA, and MFA significantly reduce brute-force attacks. Storing passwords in plain text is never acceptable.'
},

{
  id: 'password-security-13',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Credential Stuffing',
  prompt: `Thousands of login attempts use real email addresses with passwords leaked from another website.

The passwords are actually correct for many users.

What attack is occurring?`,
  options: [
    'SQL Injection',
    'Credential Stuffing',
    'Cross-Site Scripting',
    'Rainbow Table Attack'
  ],
  correctAnswer: 'Credential Stuffing',
  explanation: 'Credential stuffing uses stolen username/password pairs from previous breaches. Because many users reuse passwords across multiple sites, attackers can often gain access without cracking password hashes.'
},

{
  id: 'password-security-14',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Production Security',
  prompt: `A developer writes:

const hash = await bcrypt.hash(password, 12);

db.save({
    username,
    password,
    hash
});

What is the BIGGEST problem?`,
  options: [
    'bcrypt cost factor is too high',
    'The plain-text password is being stored alongside its hash',
    'bcrypt should run synchronously',
    'The username should be hashed too'
  ],
  correctAnswer: 'The plain-text password is being stored alongside its hash',
  explanation: 'Hashing provides no protection if the original password is stored as well. Only the hash (and its salt) should be stored. Plain-text passwords should never be persisted.'
},

{
  id: 'password-security-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Final Boss',
  prompt: `A company experiences a database breach.

Investigation shows:
• Passwords use bcrypt
• Every password has a unique salt
• No plain-text passwords exist
• The application server remains secure

What should the company do FIRST?`,
  options: [
    'Immediately notify affected users and require password resets',
    'Nothing—the passwords are hashed',
    'Only restart the application servers',
    'Simply increase the bcrypt cost factor'
  ],
  correctAnswer: 'Immediately notify affected users and require password resets',
  explanation: 'Although bcrypt and unique salts provide strong protection, stolen password hashes can still be attacked offline. The correct incident response is to notify users, invalidate active sessions if appropriate, force password resets, and investigate the breach. Hashing reduces risk but does not eliminate it after a compromise.'
},
{
  id: 'password-salt-hash-fundamenta-16',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Password Storage',
  prompt: 'Why should an application store a password hash instead of the original password?',
  options: ['A database leak should not immediately reveal users’ passwords', 'Hashes can be decrypted by support staff', 'Passwords become shorter in the database', 'Hashing prevents users from reusing passwords'],
  correctAnswer: 'A database leak should not immediately reveal users’ passwords',
  explanation: 'A one-way password hash lets the application verify a password attempt without storing the original secret. A breach can still expose hashes, so use a password-specific algorithm such as Argon2id, bcrypt, or scrypt with appropriate parameters.'
},
{
  id: 'password-salt-hash-fundamenta-17',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Salting',
  prompt: 'What is the main security benefit of using a unique random salt for each password?',
  options: ['Equal passwords produce different stored hashes and precomputed tables become less useful', 'The salt encrypts the password hash with a secret key', 'The salt makes password verification unnecessary', 'The salt guarantees that weak passwords cannot be guessed'],
  correctAnswer: 'Equal passwords produce different stored hashes and precomputed tables become less useful',
  explanation: 'A salt is public random data stored with the hash. Unique salts prevent attackers from reusing one precomputed result across many accounts and make identical passwords produce different hashes. Salting does not replace a slow password hashing function or make weak passwords unguessable.'
}
];
