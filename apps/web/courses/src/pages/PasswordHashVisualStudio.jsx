import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './PasswordHashVisualStudio.css'

const COURSE_PATH = '/course/password-salt-hash-fundamenta'
const ITERATIONS = 600_000
const encoder = new TextEncoder()

const VIEWS = [
  ['flow', '01', 'Registration → login'],
  ['register', '02', 'Create a verifier'],
  ['verify', '03', 'Verify a login'],
  ['design', '04', 'Salt, pepper & KDFs'],
  ['challenge', '05', 'Security challenge'],
]

const FLOW = [
  { title: 'User chooses a password', node: 'INPUT', tone: 'blue', detail: 'During registration, the browser sends the password to the application over HTTPS. The server handles it only long enough to derive a password verifier.', wire: 'POST /register\npassword: ********', tip: 'TLS protects the password while it travels. It does not make storing plaintext safe.' },
  { title: 'Server generates a salt', node: 'SALT', tone: 'violet', detail: 'The server creates fresh cryptographically random salt bytes for this account. A salt is unique per password and is stored with the verifier; it is not a secret.', wire: 'salt = randomBytes(16)', tip: 'Different accounts with the same password should normally have different salts and different stored verifiers.' },
  { title: 'Password KDF does the work', node: 'KDF', tone: 'amber', detail: 'A password-specific key derivation function mixes the password with its salt and applies a deliberately costly computation. Memory and work factors make each guess more expensive.', wire: 'PBKDF2(password, salt, parameters)', tip: 'Fast general-purpose hashes such as SHA-256 are designed for speed and are not suitable password storage functions.' },
  { title: 'Database stores a verifier', node: 'DATABASE', tone: 'cyan', detail: 'Store the algorithm name, parameters, salt, and derived value. Do not store the original password, and do not encrypt it so the application can recover it.', wire: 'algorithm + cost + salt + verifier', tip: 'The record must carry enough information to verify a future login and migrate parameters later.' },
  { title: 'Login derives and compares', node: 'VERIFY', tone: 'green', detail: 'At login, load the user’s stored salt and parameters, derive a candidate verifier from the submitted password, then compare it with the stored value.', wire: 'candidate = KDF(guess, stored salt, stored parameters)', tip: 'A match proves the submitted password produced the stored verifier. The original password is never recovered.' },
]

const ALGORITHMS = [
  { id: 'argon2id', title: 'Argon2id', badge: 'RECOMMENDED', tone: 'green', summary: 'A memory-hard password hashing function and the preferred general-purpose choice when available.', parameters: 'OWASP floor: 19 MiB memory · 2 iterations · parallelism 1', use: 'Use a maintained library and tune the work factor on representative production hardware.' },
  { id: 'scrypt', title: 'scrypt', badge: 'GOOD FALLBACK', tone: 'cyan', summary: 'A memory-hard password KDF available in Node.js crypto and many platforms.', parameters: 'One OWASP option: N=2¹⁷ · r=8 · p=1', use: 'Useful where Argon2id is unavailable. Account for memory use under concurrent logins.' },
  { id: 'pbkdf2', title: 'PBKDF2-HMAC-SHA-256', badge: 'FIPS PATH', tone: 'violet', summary: 'A widely supported password KDF. It is useful where approved/FIPS-validated cryptography is required.', parameters: 'OWASP recommendation for FIPS use: 600,000 iterations', use: 'This studio’s browser demonstration uses Web Crypto PBKDF2 with 600,000 iterations.' },
  { id: 'bcrypt', title: 'bcrypt', badge: 'LEGACY SUPPORT', tone: 'amber', summary: 'A long-standing adaptive password hashing function with a configurable work factor.', parameters: 'OWASP: work factor 10 or greater; traditional implementations have a 72-byte input limit.', use: 'Keep existing bcrypt hashes working and rehash after successful login when policy calls for migration.' },
  { id: 'sha256', title: 'SHA-256 by itself', badge: 'DO NOT STORE PASSWORDS', tone: 'rose', summary: 'A general-purpose cryptographic hash that is intentionally very fast.', parameters: 'No password-specific salt/work-factor format; attackers can test guesses quickly.', use: 'Use SHA-256 for checksums or signatures as appropriate, not as a password verifier.' },
]

const CHALLENGES = [
  {
    prompt: 'Two users pick the same password. Each account receives a fresh random salt. What should the database usually contain?',
    choices: ['Two different salts and different derived values', 'One shared hash because the passwords match', 'The original password encrypted with the salt'],
    answer: 0,
    explanation: 'A unique salt makes each stored verifier distinct, even when two users chose the same password. The salt is stored openly beside the verifier.',
    trace: ['Read the account records', 'Notice the independent salt values', 'Derive different verifier outputs'],
  },
  {
    prompt: 'A database backup is stolen. What does a salted password verifier protect against?',
    choices: ['It makes guessing impossible', 'It prevents one precomputed table from matching every account', 'It lets the server decrypt a forgotten password'],
    answer: 1,
    explanation: 'Salts defeat reusable precomputed tables and hide equal-password patterns. Attackers can still make guesses against each record, so use a costly KDF and strong passwords.',
    trace: ['Attacker reads the verifier record', 'Each account has a separate salt', 'Guesses still cost a KDF calculation'],
  },
  {
    prompt: 'A developer proposes SHA-256(password) because it is secure and produces a digest. What is the problem?',
    choices: ['SHA-256 is too slow for servers', 'SHA-256 is fast, so guesses are cheap at scale', 'A digest can always be reversed mathematically'],
    answer: 1,
    explanation: 'A strong general-purpose hash is still the wrong tool for password storage. Use a password KDF designed to make each guess costly.',
    trace: ['Compare the operation goal', 'A fast digest favors high throughput', 'Choose an adaptive password KDF'],
  },
  {
    prompt: 'A user forgets their password. Can the application recover it from the stored verifier?',
    choices: ['Yes, decrypt the verifier with the salt', 'Yes, reverse the hash if the password is long enough', 'No, use a verified password-reset flow'],
    answer: 2,
    explanation: 'Password hashing is one-way. A reset flow establishes a new password; it does not retrieve the old one.',
    trace: ['Look up the stored verifier', 'There is no decryption key or inverse', 'Verify identity and set a new password'],
  },
  {
    prompt: 'The team adds a pepper. Where should the pepper live?',
    choices: ['In the same user table beside the salt', 'In a separate secrets system, outside the password database', 'Inside the password so the user can remember it'],
    answer: 1,
    explanation: 'A pepper is an optional secret kept separate from the database, such as in a secret manager or HSM. It supplements a salt and KDF; it does not replace either one.',
    trace: ['Separate public salt from secret pepper', 'Keep the pepper outside the database', 'Plan carefully for rotation and availability'],
  },
]

function toBase64(bytes) {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function fromBase64(value) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function deriveVerifier(password, salt) {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error('Web Crypto is unavailable. Open this lesson over HTTPS or localhost to run the browser-only demo.')
  }
  const key = await globalThis.crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await globalThis.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256)
  return new Uint8Array(bits)
}

function sameBytes(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

function pause(reduceMotion, milliseconds = 350) {
  return reduceMotion ? Promise.resolve() : new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`ph-badge ${tone}`}>{children}</span>
}

export default function PasswordHashVisualStudio() {
  const reduceMotion = useReducedMotion()
  const [view, setView] = useState('flow')
  const [flowStep, setFlowStep] = useState(0)
  const [registrationPassword, setRegistrationPassword] = useState('')
  const [registrationBusy, setRegistrationBusy] = useState(false)
  const [registrationStep, setRegistrationStep] = useState(-1)
  const [registrationMessage, setRegistrationMessage] = useState('Create a local demo verifier to inspect its stored fields.')
  const [record, setRecord] = useState(null)
  const [loginPassword, setLoginPassword] = useState('')
  const [verificationBusy, setVerificationBusy] = useState(false)
  const [verificationStep, setVerificationStep] = useState(-1)
  const [verificationStatus, setVerificationStatus] = useState('idle')
  const [verificationMessage, setVerificationMessage] = useState('Create a verifier first, then try a login.')
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('argon2id')
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [challengeChoice, setChallengeChoice] = useState(-1)
  const [challengeTraceCount, setChallengeTraceCount] = useState(0)
  const [challengeBusy, setChallengeBusy] = useState(false)
  const [challengeAnswered, setChallengeAnswered] = useState(false)
  const [challengeScore, setChallengeScore] = useState(0)

  const activeFlow = FLOW[flowStep]
  const activeAlgorithm = ALGORITHMS.find(({ id }) => id === selectedAlgorithm) || ALGORITHMS[0]
  const activeChallenge = CHALLENGES[challengeIndex]

  async function createVerifier() {
    if (!registrationPassword) {
      setRegistrationMessage('Enter a demo password first. It will stay in this page and will be cleared after hashing.')
      return
    }
    setRegistrationBusy(true)
    setRecord(null)
    setLoginPassword('')
    setRegistrationStep(0)
    setVerificationStatus('idle')
    setVerificationStep(-1)
    setRegistrationMessage('Receiving password through a protected connection…')
    try {
      await pause(reduceMotion)
      setRegistrationStep(1)
      setRegistrationMessage('Generating a fresh 16-byte random salt…')
      const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
      await pause(reduceMotion)
      setRegistrationStep(2)
      setRegistrationMessage(`Running PBKDF2-HMAC-SHA-256 with ${ITERATIONS.toLocaleString()} iterations in this browser…`)
      const derived = await deriveVerifier(registrationPassword, salt)
      setRegistrationStep(3)
      await pause(reduceMotion, 180)
      setRecord({
        algorithm: 'PBKDF2-HMAC-SHA-256',
        iterations: ITERATIONS,
        digest: 'SHA-256',
        saltBase64: toBase64(salt),
        saltHex: toHex(salt),
        verifierBase64: toBase64(derived),
        derivedBytes: Array.from(derived),
      })
      setVerificationStatus('idle')
      setVerificationStep(-1)
      setVerificationMessage('Verifier created. Try the same password, then try a different one.')
      setRegistrationMessage('Done. The page kept the salt and verifier only; it did not save or send the password.')
    } catch (error) {
      setRegistrationMessage(error.message || 'The browser could not create a verifier.')
      setRegistrationStep(-1)
    } finally {
      setRegistrationPassword('')
      setRegistrationBusy(false)
    }
  }

  async function verifyLogin() {
    if (!record) {
      setVerificationMessage('Create a verifier first in the previous section.')
      return
    }
    if (!loginPassword) {
      setVerificationMessage('Enter a login attempt. The input will be cleared after comparison.')
      return
    }
    setVerificationBusy(true)
    setVerificationStatus('running')
    setVerificationStep(0)
    setVerificationMessage('Loading this demo account’s stored salt and KDF parameters…')
    try {
      await pause(reduceMotion)
      setVerificationStep(1)
      setVerificationMessage('Deriving a candidate verifier from the submitted password and stored salt…')
      const candidate = await deriveVerifier(loginPassword, fromBase64(record.saltBase64))
      setVerificationStep(2)
      await pause(reduceMotion, 180)
      const matches = sameBytes(candidate, Uint8Array.from(record.derivedBytes))
      setVerificationStep(3)
      await pause(reduceMotion, 180)
      setVerificationStatus(matches ? 'accepted' : 'rejected')
      setVerificationMessage(matches ? 'Password match. A server could now issue a session or continue authentication.' : 'No match. Do not create an authenticated session for this login.')
    } catch (error) {
      setVerificationStatus('error')
      setVerificationMessage(error.message || 'The browser could not verify this attempt.')
      setVerificationStep(-1)
    } finally {
      setLoginPassword('')
      setVerificationBusy(false)
    }
  }

  async function revealChallenge() {
    if (challengeChoice < 0 || challengeBusy || challengeAnswered) return
    setChallengeBusy(true)
    setChallengeTraceCount(0)
    for (let index = 0; index < activeChallenge.trace.length; index += 1) {
      await pause(reduceMotion, 400)
      setChallengeTraceCount(index + 1)
    }
    if (challengeChoice === activeChallenge.answer) setChallengeScore((score) => score + 1)
    setChallengeAnswered(true)
    setChallengeBusy(false)
  }

  function nextChallenge() {
    const nextIndex = challengeIndex === CHALLENGES.length - 1 ? 0 : challengeIndex + 1
    if (nextIndex === 0) setChallengeScore(0)
    setChallengeIndex(nextIndex)
    setChallengeChoice(-1)
    setChallengeTraceCount(0)
    setChallengeAnswered(false)
  }

  const journeyPayload = flowStep === 0
    ? 'password travels over HTTPS'
    : flowStep === 1
      ? 'random salt generated per account'
      : flowStep === 2
        ? 'password + salt + KDF parameters'
        : flowStep === 3
          ? 'algorithm + cost + salt + verifier'
          : 'login guess + stored salt + parameters'

  return <main className="password-hash-studio min-h-screen px-4 py-6 text-white sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1480px]">
      <nav className="ph-topnav" aria-label="Password hashing studio navigation">
        <Link to={COURSE_PATH} className="ph-back-link">← Password Salt + Hash course</Link>
        <Link to={COURSE_PATH} className="ph-course-link">Read course lessons ↗</Link>
      </nav>

      <header className="ph-hero">
        <div className="ph-hero-glow" aria-hidden="true" />
        <div className="ph-hero-content">
          <div>
            <div className="ph-eyebrow"><span className="ph-live-dot" /> PASSWORD SECURITY WORKBENCH <i>STORAGE / VERIFICATION</i></div>
            <h1>Never store the password.<span>Store proof of it.</span></h1>
            <p>Watch a password become a salted verifier, then try a login and follow the comparison. Explore why salts, slow KDFs, and safe verification belong together.</p>
            <div className="ph-hero-tags"><Badge tone="violet">Unique random salt</Badge><Badge tone="cyan">Slow password KDF</Badge><Badge tone="green">Browser-only demo</Badge></div>
          </div>
          <aside className="ph-hero-note"><b>A hash is not encryption</b><p>There is no decrypt button. At login, derive a new candidate using the stored salt and parameters, then compare it with the saved verifier.</p><small>Demo input, salt, and verifier remain in this page’s memory only. They are never sent or persisted.</small></aside>
        </div>
      </header>

      <div className="ph-tabs" role="group" aria-label="Password hashing visual lessons">
        {VIEWS.map(([id, number, label]) => <button key={id} type="button" aria-pressed={view === id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><span>{number}</span>{label}</button>)}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === 'flow' && <motion.section key="flow" className="ph-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="ph-section-heading"><div><span>01 / THE PASSWORD’S JOURNEY</span><h2>From registration to a verified login</h2><p>Select a stage and follow what the application receives, computes, and stores.</p></div><Badge tone="amber">One-way verifier</Badge></div>
          <div className="ph-flow-map"><div className="ph-flow-track"><motion.i animate={{ left: `${flowStep * 25}%` }} transition={{ duration: reduceMotion ? 0 : .4 }} /></div>{FLOW.map((step, index) => <button type="button" key={step.node} aria-current={flowStep === index ? 'step' : undefined} onClick={() => setFlowStep(index)} className={`ph-flow-node ${step.tone} ${flowStep === index ? 'selected' : ''} ${flowStep > index ? 'passed' : ''}`}><span>{String(index + 1).padStart(2, '0')}</span><b>{step.node}</b><small>{step.title}</small></button>)}</div>
          <AnimatePresence mode="wait"><motion.article key={activeFlow.node} className={`ph-flow-detail ${activeFlow.tone}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: reduceMotion ? 0 : .18 }}>
            <div><span className="ph-kicker">STAGE {String(flowStep + 1).padStart(2, '0')} / {String(FLOW.length).padStart(2, '0')}</span><h3>{activeFlow.title}</h3><p>{activeFlow.detail}</p><div className="ph-wire"><span>DATA IN MOTION</span><code>{activeFlow.wire}</code></div><div className="ph-tip"><b>Remember</b>{activeFlow.tip}</div></div>
            <div className="ph-flow-visual"><motion.div className="ph-flow-orb" animate={{ y: reduceMotion ? 0 : [0, -8, 0], scale: [1, 1.04, 1] }} transition={{ duration: reduceMotion ? 0 : 3, repeat: reduceMotion ? 0 : Infinity }}><span>{activeFlow.node}</span></motion.div><div className="ph-flow-packet"><i />{journeyPayload}</div><div className="ph-flow-count">STEP {String(flowStep + 1).padStart(2, '0')} <b>/ 05</b></div></div>
          </motion.article></AnimatePresence>
          <div className="ph-flow-controls"><button type="button" onClick={() => setFlowStep((step) => Math.max(0, step - 1))} disabled={flowStep === 0}>← Previous stage</button><button type="button" onClick={() => setFlowStep((step) => Math.min(FLOW.length - 1, step + 1))} disabled={flowStep === FLOW.length - 1}>Next stage →</button></div>
          <div className="ph-principle-grid"><article><b>Salt is public</b><p>Store it beside the verifier so a login can repeat the same derivation.</p></article><article><b>Verifier is not reversible</b><p>Forgotten passwords are reset. The server does not decrypt or recover the original.</p></article><article><b>Parameters travel with the record</b><p>Store algorithm and cost settings so verification and future migration stay possible.</p></article></div>
        </motion.section>}

        {view === 'register' && <motion.section key="register" className="ph-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="ph-section-heading"><div><span>02 / REGISTRATION LAB</span><h2>Create a salted password verifier</h2><p>This uses the browser’s real PBKDF2-HMAC-SHA-256 implementation to demonstrate salt, parameters, and a derived value.</p></div><Badge tone="amber">Not an account system</Badge></div>
          <div className="ph-register-layout"><section className="ph-register-panel"><div className="ph-card-heading"><div><span>LOCAL DEMO INPUT</span><h3>Choose a sample password</h3></div><span className="ph-lock">LOCAL</span></div><label className="ph-password-field">Demo password<input type="password" autoComplete="off" value={registrationPassword} onChange={(event) => setRegistrationPassword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !registrationBusy) createVerifier() }} placeholder="Type a password for this demo" /></label><div className="ph-input-note">Use a throwaway example. The field clears after derivation, and the value is not logged or saved.</div><button type="button" className="ph-primary-button" disabled={registrationBusy} onClick={createVerifier}>{registrationBusy ? 'Deriving verifier…' : 'Generate salt + verifier'} <span>→</span></button><p className={`ph-inline-message ${registrationStep === 3 ? 'success' : ''}`} aria-live="polite">{registrationMessage}</p><div className="ph-register-steps">{['Receive over HTTPS', 'Generate unique salt', 'Derive PBKDF2 verifier', 'Store verifier record'].map((label, index) => <div key={label} className={registrationStep >= index ? 'complete' : registrationStep === index - 1 && registrationBusy ? 'current' : ''}><span>{registrationStep > index ? '✓' : String(index + 1).padStart(2, '0')}</span><b>{label}</b></div>)}</div></section>
            <section className="ph-record-panel"><div className="ph-card-heading"><div><span>DATABASE RECORD / DEMO ONLY</span><h3>What gets stored</h3></div><Badge tone={record ? 'green' : 'neutral'}>{record ? 'CREATED IN MEMORY' : 'WAITING'}</Badge></div>{record ? <><div className="ph-record-visual"><div className="ph-record-row"><span>ALGORITHM</span><code>{record.algorithm}</code></div><div className="ph-record-row"><span>PARAMETERS</span><code>iterations={record.iterations.toLocaleString()} · digest={record.digest} · output=256 bits</code></div><div className="ph-record-row"><span>SALT / BASE64</span><code>{record.saltBase64}</code></div><div className="ph-record-row"><span>VERIFIER / BASE64</span><code>{record.verifierBase64}</code></div></div><div className="ph-record-note"><b>The password is absent.</b><span>The random salt is public. The verifier can confirm a guess, but it cannot reveal the original password.</span></div></> : <div className="ph-record-empty"><motion.div animate={{ opacity: [.42, .8, .42] }} transition={{ duration: reduceMotion ? 0 : 2, repeat: reduceMotion ? 0 : Infinity }}>salt + KDF + password</motion.div><span>Run the local demo to reveal a verifier record.</span></div>}</section></div>
          <div className="ph-demo-disclaimer"><b>Why PBKDF2 here?</b> Browser Web Crypto supports it directly, so the derivation is real and stays on this device. OWASP generally prefers Argon2id when available; PBKDF2 is useful where approved/FIPS cryptography is required. This demo does not replace a server-side password library.</div>
        </motion.section>}

        {view === 'verify' && <motion.section key="verify" className="ph-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="ph-section-heading"><div><span>03 / LOGIN VERIFICATION</span><h2>Repeat the derivation, then compare</h2><p>Enter the same password you used in the registration lab. The verifier reuses the stored salt and KDF parameters; it never decrypts the record.</p></div><Badge tone={verificationStatus === 'accepted' ? 'green' : verificationStatus === 'rejected' ? 'rose' : 'cyan'}>{verificationStatus === 'accepted' ? 'MATCH' : verificationStatus === 'rejected' ? 'NO MATCH' : verificationStatus === 'running' ? 'VERIFYING' : 'READY'}</Badge></div>
          <div className="ph-verify-layout"><section className="ph-login-panel"><div className="ph-card-heading"><div><span>LOGIN REQUEST</span><h3>Submit a password attempt</h3></div><span className="ph-lock">HTTPS</span></div><label className="ph-password-field">Password attempt<input type="password" autoComplete="off" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !verificationBusy) verifyLogin() }} placeholder="Type the original or a different password" /></label><div className="ph-stored-salt"><span>LOOKED-UP SALT</span><code>{record?.saltBase64 || 'Create a verifier first'}</code></div><button type="button" className="ph-primary-button" disabled={verificationBusy || !record} onClick={verifyLogin}>{verificationBusy ? 'Running the KDF…' : 'Verify this login'} <span>→</span></button><p className={`ph-inline-message ${verificationStatus === 'accepted' ? 'success' : verificationStatus === 'rejected' ? 'failure' : ''}`} aria-live="polite">{verificationMessage}</p></section>
            <section className="ph-verify-pipeline"><div className="ph-card-heading"><div><span>THE SERVER’S CHECKS</span><h3>What happens after submit</h3></div></div>{['Load this account’s stored salt and parameters', 'Derive a candidate with the submitted password', 'Compare the candidate with the saved verifier', 'Create a session only when they match'].map((label, index) => { const shown = verificationStep >= index; const failed = verificationStatus === 'rejected' && index === 3; return <motion.article key={label} initial={false} animate={{ opacity: shown ? 1 : .48, x: verificationBusy && verificationStep === index ? 4 : 0 }} className={`ph-check-row ${shown ? 'shown' : ''} ${failed ? 'failure' : ''} ${verificationStatus === 'accepted' && index === 3 ? 'success' : ''}`}><span>{shown ? failed ? '×' : verificationStatus === 'accepted' && index === 3 ? '✓' : '●' : String(index + 1).padStart(2, '0')}</span><div><b>{label}</b><p>{shown ? index === 0 ? 'Lookup the account record; the salt is not secret.' : index === 1 ? `Use ${record?.algorithm || 'the stored KDF'} and exactly the recorded parameters.` : index === 2 ? verificationStatus === 'accepted' ? 'The fixed-length derived values match.' : verificationStatus === 'rejected' ? 'The fixed-length derived values differ.' : 'The comparison runs over the entire fixed-length value in this demo.' : verificationStatus === 'accepted' ? 'The password matched. Authentication may continue.' : 'No session is created for a mismatch.' : 'Waiting for the previous step.'}</p></div><Badge tone={failed ? 'rose' : verificationStatus === 'accepted' && index === 3 ? 'green' : shown ? 'cyan' : 'neutral'}>{shown ? failed ? 'deny' : verificationStatus === 'accepted' && index === 3 ? 'allow' : 'done' : 'waiting'}</Badge></motion.article>})}</section></div>
          <div className="ph-timing-note"><b>Timing matters.</b> The demo compares all bytes in JavaScript for teaching, but JavaScript does not guarantee constant-time execution. On a server, use the password library’s verification function or a constant-time comparison API such as Node.js <code>timingSafeEqual</code>.</div>
        </motion.section>}

        {view === 'design' && <motion.section key="design" className="ph-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="ph-section-heading"><div><span>04 / STORAGE DESIGN</span><h2>Salt, pepper, and the right KDF</h2><p>Pick a concept to inspect. These controls explain what belongs in a database record and how algorithm choices differ.</p></div><Badge tone="violet">Design decisions</Badge></div>
          <div className="ph-algorithm-layout"><div className="ph-algorithm-list">{ALGORITHMS.map((algorithm) => <button type="button" key={algorithm.id} onClick={() => setSelectedAlgorithm(algorithm.id)} className={selectedAlgorithm === algorithm.id ? 'selected' : ''}><span className={`ph-algo-dot ${algorithm.tone}`} /><div><b>{algorithm.title}</b><small>{algorithm.badge}</small></div><i>→</i></button>)}</div><article className={`ph-algorithm-detail ${activeAlgorithm.tone}`}><span className="ph-kicker">ALGORITHM / {activeAlgorithm.badge}</span><h3>{activeAlgorithm.title}</h3><p>{activeAlgorithm.summary}</p><div className="ph-parameter-box"><span>PARAMETER GUIDANCE</span><b>{activeAlgorithm.parameters}</b></div><div className="ph-cost-visual"><div><span>CPU WORK</span><i><motion.b animate={{ scaleX: activeAlgorithm.id === 'sha256' ? .15 : .78 }} transition={{ duration: reduceMotion ? 0 : .5 }} /></i><small>{activeAlgorithm.id === 'sha256' ? 'very fast' : 'deliberately costly'}</small></div><div><span>MEMORY COST</span><i><motion.b animate={{ scaleX: activeAlgorithm.id === 'argon2id' || activeAlgorithm.id === 'scrypt' ? .82 : activeAlgorithm.id === 'sha256' ? .08 : .36 }} transition={{ duration: reduceMotion ? 0 : .5 }} /></i><small>{activeAlgorithm.id === 'argon2id' || activeAlgorithm.id === 'scrypt' ? 'memory-hard' : activeAlgorithm.id === 'sha256' ? 'minimal' : 'algorithm dependent'}</small></div></div><div className="ph-algorithm-use"><b>When to choose it</b><p>{activeAlgorithm.use}</p></div></article></div>
          <div className="ph-salt-pepper-grid"><article className="ph-salt-card"><div className="ph-concept-icon">S</div><div><span>PUBLIC · UNIQUE · RANDOM</span><h3>Salt</h3><p>Generate a fresh random salt for each stored password. Save it with the verifier. It stops equal passwords from having equal records and defeats precomputed lookup tables.</p></div><div className="ph-concept-wire"><code>password + salt → password KDF</code><b>Stored beside the verifier</b></div></article><article className="ph-pepper-card"><div className="ph-concept-icon">P</div><div><span>SECRET · OPTIONAL · SEPARATE</span><h3>Pepper</h3><p>An additional secret can provide defense in depth if only the database is exposed. Keep it in a separate secret manager or HSM, never in the user table.</p></div><div className="ph-concept-wire"><code>verifier + secret outside DB</code><b>Requires rotation and recovery planning</b></div></article></div>
          <div className="ph-safety-banner"><b>A salt does not make a weak password strong.</b><span>Use a suitable password KDF, rate-limit online attempts, protect reset flows, and encourage unique passphrases. Tune parameters for the service’s capacity and threat model.</span></div>
        </motion.section>}

        {view === 'challenge' && <motion.section key="challenge" className="ph-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="ph-section-heading"><div><span>05 / SECURITY CHALLENGE</span><h2>Choose the safe password-storage decision</h2><p>Answer five short scenarios, then watch the reasoning unfold as an animated review trace.</p></div><Badge tone="violet">{challengeScore} / {CHALLENGES.length} correct</Badge></div>
          <div className="ph-challenge-progress"><div><span>SCENARIO {String(challengeIndex + 1).padStart(2, '0')} OF {String(CHALLENGES.length).padStart(2, '0')}</span><b>{challengeScore} correct</b></div><div role="progressbar" aria-label="Password security challenge progress" aria-valuemin="0" aria-valuemax={CHALLENGES.length} aria-valuenow={challengeIndex + Number(challengeAnswered)}><motion.i animate={{ scaleX: (challengeIndex + Number(challengeAnswered)) / CHALLENGES.length }} transition={{ duration: reduceMotion ? 0 : .35 }} /></div></div>
          <div className="ph-challenge-layout"><section className="ph-challenge-question"><div className="ph-card-heading"><div><span>SCENARIO / {String(challengeIndex + 1).padStart(2, '0')}</span><h3>{activeChallenge.prompt}</h3></div></div><fieldset disabled={challengeBusy || challengeAnswered}><legend>Pick one answer</legend>{activeChallenge.choices.map((choice, index) => <button type="button" key={choice} aria-pressed={challengeChoice === index} className={challengeChoice === index ? 'selected' : ''} onClick={() => setChallengeChoice(index)}><span>{String.fromCharCode(65 + index)}</span><b>{choice}</b></button>)}</fieldset><div className="ph-challenge-controls"><button type="button" className="ph-primary-button" disabled={challengeChoice < 0 || challengeBusy || challengeAnswered} onClick={revealChallenge}>{challengeBusy ? 'Reviewing the decision…' : challengeAnswered ? 'Scenario complete' : 'Check my answer'} <span>→</span></button>{challengeAnswered && <button type="button" className="ph-quiet-button" onClick={nextChallenge}>{challengeIndex === CHALLENGES.length - 1 ? 'Play again' : 'Next scenario'} →</button>}</div>{challengeAnswered && <motion.div initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className={`ph-challenge-feedback ${challengeChoice === activeChallenge.answer ? 'correct' : 'incorrect'}`} aria-live="polite"><b>{challengeChoice === activeChallenge.answer ? 'Correct decision' : 'Review this principle'}</b><p>{activeChallenge.explanation}</p></motion.div>}</section>
            <section className="ph-challenge-trace-panel"><div className="ph-card-heading"><div><span>REASONING TRACE</span><h3>What the security review notices</h3></div><Badge tone={challengeAnswered ? challengeChoice === activeChallenge.answer ? 'green' : 'amber' : 'neutral'}>{challengeAnswered ? 'REVIEWED' : 'WAITING'}</Badge></div><div className="ph-challenge-trace">{activeChallenge.trace.map((step, index) => { const shown = index < challengeTraceCount; return <motion.article key={step} initial={false} animate={{ opacity: shown ? 1 : .48, x: challengeBusy && index === challengeTraceCount ? 4 : 0 }} className={shown ? 'shown' : ''}><span>{shown ? '✓' : String(index + 1).padStart(2, '0')}</span><b>{shown ? step : 'Waiting for your answer'}</b></motion.article>})}</div><div className="ph-challenge-score"><span>YOUR SCORE</span><b>{challengeScore}<i> / {CHALLENGES.length}</i></b><small>Score updates after the review trace finishes.</small></div></section></div>
        </motion.section>}
      </AnimatePresence>

      <footer className="ph-footer"><span>PASSWORD HASH VISUAL STUDIO · MEMORY ONLY · NEVER STORE PLAINTEXT</span><div><a href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" target="_blank" rel="noreferrer">OWASP Password Storage ↗</a><a href="https://www.rfc-editor.org/rfc/rfc9106" target="_blank" rel="noreferrer">Argon2 RFC 9106 ↗</a><a href="https://nodejs.org/api/crypto.html" target="_blank" rel="noreferrer">Node.js crypto ↗</a></div></footer>
    </div>
  </main>
}
