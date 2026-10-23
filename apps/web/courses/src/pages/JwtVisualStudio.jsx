import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './JwtVisualStudio.css'

const ISSUER = 'https://auth.northstar.example'
const AUDIENCE = 'contacts-api'
const encoder = new TextEncoder()

const VIEWS = [
  ['journey', '01', 'End-to-end flow'],
  ['anatomy', '02', 'Build a token'],
  ['verify', '03', 'Verify a request'],
  ['claims', '04', 'Claims explorer'],
  ['attacks', '05', 'Break it safely'],
  ['lifecycle', '06', 'Storage & lifetime'],
  ['challenge', '07', 'Request challenge'],
]

const JOURNEY = [
  { title: 'Credentials arrive', node: 'LOGIN', accent: 'blue', detail: 'The browser sends email and password over HTTPS. The API looks up the account and compares the submitted password with the stored password hash.', wire: 'POST /api/auth/login\n{ "email": "asha@example.com", "password": "••••••••" }', misconception: 'The password is never placed in the JWT payload.' },
  { title: 'Issuer creates claims', node: 'ISSUER', accent: 'violet', detail: 'After successful login, the issuer chooses a subject and the claims this API needs. It sets an expiry and signs the compact representation with a trusted key.', wire: 'sub = "user-2048"\naud = "contacts-api"\nexp = now + 15 minutes', misconception: 'A JWT is a format for claims. It is not a complete login or authorization protocol.' },
  { title: 'Token goes to the client', node: 'TOKEN', accent: 'amber', detail: 'The client receives an access token and keeps it according to the application’s threat model. A bearer token is usable by whoever possesses it.', wire: 'eyJ...header.eyJ...claims.signature', misconception: 'The signature does not hide the claims. A signed JWT is normally readable.' },
  { title: 'Client presents it', node: 'REQUEST', accent: 'cyan', detail: 'For a protected API call, the client sends the token in the Authorization header using the Bearer scheme, over HTTPS.', wire: 'GET /api/contacts\nAuthorization: Bearer <access-token>', misconception: 'Do not put bearer tokens in URLs, where they can leak through logs and browser history.' },
  { title: 'API verifies the token', node: 'VERIFY', accent: 'green', detail: 'The API checks a pinned algorithm and trusted key, validates the signature, then checks required issuer, audience, and time claims before using the subject.', wire: 'signature ✓  iss ✓  aud ✓  exp ✓', misconception: 'Decoding is not verification. A valid signature alone does not prove that this token is meant for this API or is still valid.' },
  { title: 'API authorizes the action', node: 'AUTHORIZE', accent: 'rose', detail: 'Authentication establishes the verified identity. Authorization then checks permissions and resource ownership before returning or changing data.', wire: 'verified sub → owner-scoped query → response', misconception: 'A signed role claim does not replace server-side permission checks or ownership filters.' },
]

const CLAIMS = [
  ['iss', 'Issuer', 'Who issued the token. Compare it with the exact issuer your API trusts.'],
  ['sub', 'Subject', 'The principal the token is about. Interpret it within the issuer’s namespace.'],
  ['aud', 'Audience', 'The intended recipient or recipients. Reject a token intended for another API.'],
  ['exp', 'Expiration', 'NumericDate in seconds. A token must not be accepted at or after this time.'],
  ['nbf', 'Not before', 'NumericDate in seconds. A token must not be accepted before this time.'],
  ['iat', 'Issued at', 'NumericDate in seconds describing when the token was issued. It is not an expiry check by itself.'],
  ['jti', 'JWT ID', 'A token identifier. It can support a denylist, but the claim alone does not revoke anything.'],
]

const VERIFY_STEPS = [
  ['Token shape', 'Expect exactly three compact JWS segments for this signed-token profile.'],
  ['Algorithm policy', 'Allow only the algorithm configured by the API. Never let token input choose policy.'],
  ['Signature', 'Verify the exact encoded header and payload with a trusted key.'],
  ['Token profile', 'Require the token type and claim rules expected by this endpoint.'],
  ['Issuer', 'Require the expected iss value for this trust relationship.'],
  ['Audience', 'Require this API to appear in aud. A token for another service is not interchangeable.'],
  ['Time claims', 'Reject expired tokens and tokens that are not yet valid. Apply only deliberate clock-skew tolerance.'],
]

const CHALLENGES = [
  {
    title: 'A normal read request',
    request: 'GET /api/contacts/ct-42',
    description: 'Asha sends a correctly signed token for this API. Her token grants contacts:read, and she owns this contact.',
    facts: [['SIGNATURE', 'valid'], ['AUD', 'contacts-api'], ['EXP', 'valid'], ['SCOPE', 'contacts:read'], ['OWNER', 'user-2048']],
    expected: '200',
    response: 'The API returns the contact after authentication and authorization succeed.',
    explanation: 'Every verification check passes. The route then confirms the required scope and that this subject owns the requested record.',
    trace: [
      ['Signature', 'pass', 'The signature matches the token bytes.'],
      ['Issuer + audience', 'pass', 'The trusted issuer signed a token intended for contacts-api.'],
      ['Time claims', 'pass', 'The token is not expired and is already valid.'],
      ['Route permission', 'pass', 'The verified identity has contacts:read.'],
      ['Resource ownership', 'pass', 'user-2048 owns contact ct-42.'],
    ],
  },
  {
    title: 'A token for another service',
    request: 'GET /api/contacts/ct-42',
    description: 'The token has a valid signature and time window, but it was issued for billing-api.',
    facts: [['SIGNATURE', 'valid'], ['AUD', 'billing-api'], ['EXP', 'valid'], ['SCOPE', 'contacts:read'], ['OWNER', 'user-2048']],
    expected: '401',
    response: 'The contacts API rejects the credential before using its identity.',
    explanation: 'A valid signature proves who issued the token and that its bytes were not changed. The audience check says this token was not meant for contacts-api.',
    trace: [
      ['Signature', 'pass', 'The trusted key verifies the signature.'],
      ['Issuer + audience', 'fail', 'Issuer is trusted, but aud is billing-api; this API expects contacts-api.'],
      ['Time claims', 'blocked', 'Claims are not accepted after the audience check fails.'],
      ['Route permission', 'blocked', 'The API does not authorize an unaccepted token.'],
      ['Resource ownership', 'blocked', 'No resource lookup should run for this request.'],
    ],
  },
  {
    title: 'Someone edits the subject',
    request: 'GET /api/contacts/ct-42',
    description: 'A subject claim was changed from user-2048 to user-9999, while the original signature was kept.',
    facts: [['SIGNATURE', 'invalid'], ['AUD', 'contacts-api'], ['EXP', 'valid'], ['SCOPE', 'contacts:read'], ['SUB', 'user-9999']],
    expected: '401',
    response: 'The API rejects the altered token; it must not trust the edited subject.',
    explanation: 'The signature covers the encoded header and payload. Changing sub changes the signed bytes, so verification fails before claims can identify a caller.',
    trace: [
      ['Signature', 'fail', 'The presented payload does not match the original signature.'],
      ['Issuer + audience', 'blocked', 'Unverified claims cannot establish a trusted issuer or audience.'],
      ['Time claims', 'blocked', 'Unverified time values are ignored.'],
      ['Route permission', 'blocked', 'No permission check runs for an unverified identity.'],
      ['Resource ownership', 'blocked', 'The API must not query using the edited subject.'],
    ],
  },
  {
    title: 'A correctly signed expired token',
    request: 'GET /api/contacts/ct-42',
    description: 'The issuer signed this token correctly, but its exp time has already passed.',
    facts: [['SIGNATURE', 'valid'], ['AUD', 'contacts-api'], ['EXP', 'expired'], ['SCOPE', 'contacts:read'], ['OWNER', 'user-2048']],
    expected: '401',
    response: 'The API rejects the expired credential even though its signature is valid.',
    explanation: 'Signature validation and time validation answer different questions. A correctly signed token is still unusable after exp.',
    trace: [
      ['Signature', 'pass', 'The issuer signed these exact token bytes.'],
      ['Issuer + audience', 'pass', 'The token comes from the trusted issuer and targets contacts-api.'],
      ['Time claims', 'fail', 'exp is in the past; this token is no longer valid.'],
      ['Route permission', 'blocked', 'Authorization does not run after authentication fails.'],
      ['Resource ownership', 'blocked', 'No record lookup should run for an expired token.'],
    ],
  },
  {
    title: 'Valid identity, missing permission',
    request: 'GET /api/contacts/ct-42',
    description: 'The token is valid for contacts-api, but only grants contacts:write. The route requires contacts:read.',
    facts: [['SIGNATURE', 'valid'], ['AUD', 'contacts-api'], ['EXP', 'valid'], ['SCOPE', 'contacts:write'], ['OWNER', 'user-2048']],
    expected: '403',
    response: 'The caller is authenticated, but this action is forbidden by the route policy.',
    explanation: 'The token establishes a verified identity, so authentication succeeds. The route then denies the request because contacts:read is missing.',
    trace: [
      ['Signature', 'pass', 'The signature matches.'],
      ['Issuer + audience', 'pass', 'The issuer is trusted and aud includes contacts-api.'],
      ['Time claims', 'pass', 'The token is inside its valid time window.'],
      ['Route permission', 'fail', 'The route requires contacts:read; the token only grants contacts:write.'],
      ['Resource ownership', 'blocked', 'The route denies access before returning the record.'],
    ],
  },
  {
    title: 'Valid identity, someone else’s record',
    request: 'GET /api/contacts/ct-99',
    description: 'The token and contacts:read scope are valid, but contact ct-99 belongs to user-7788.',
    facts: [['SIGNATURE', 'valid'], ['AUD', 'contacts-api'], ['EXP', 'valid'], ['SCOPE', 'contacts:read'], ['OWNER', 'user-7788']],
    expected: '403',
    response: 'The API denies access to this record even though the caller is authenticated.',
    explanation: 'A broad scope does not prove ownership. The server must apply the verified subject to a server-side ownership check for this specific resource.',
    trace: [
      ['Signature', 'pass', 'The signature matches.'],
      ['Issuer + audience', 'pass', 'The token is trusted and intended for contacts-api.'],
      ['Time claims', 'pass', 'The token is currently valid.'],
      ['Route permission', 'pass', 'The identity has contacts:read.'],
      ['Resource ownership', 'fail', 'contact ct-99 belongs to user-7788, not user-2048.'],
    ],
  },
]

function base64UrlBytes(bytes) {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlText(value) {
  return base64UrlBytes(encoder.encode(value))
}

function decodeBase64UrlBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function decodeBase64UrlJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64UrlBytes(value)))
}

function jsonText(value) {
  return JSON.stringify(value, null, 2)
}

function makeStartingClaims() {
  const now = Math.floor(Date.now() / 1000)
  return {
    iss: ISSUER,
    sub: 'user-2048',
    aud: AUDIENCE,
    iat: now,
    nbf: now,
    exp: now + 900,
    jti: 'jwt-demo-7f31',
    scope: 'contacts:read contacts:write',
    role: 'employee',
  }
}

function makeDemoKey() {
  const key = new Uint8Array(32)
  globalThis.crypto?.getRandomValues?.(key)
  return key
}

function StatusTag({ children, tone = 'neutral' }) {
  return <span className={`jwt-status-tag ${tone}`}>{children}</span>
}

function Segment({ title, value, tone, empty }) {
  return <div className={`jwt-segment ${tone}`}>
    <span>{title}</span>
    <code>{value || empty}</code>
  </div>
}

export default function JwtVisualStudio() {
  const reduceMotion = useReducedMotion()
  const [view, setView] = useState('journey')
  const [journeyStep, setJourneyStep] = useState(0)
  const [headerDraft, setHeaderDraft] = useState(() => jsonText({ alg: 'HS256', typ: 'JWT', kid: 'demo-key-1' }))
  const [claimsDraft, setClaimsDraft] = useState(() => jsonText(makeStartingClaims()))
  const [demoKey] = useState(makeDemoKey)
  const [issuedToken, setIssuedToken] = useState('')
  const [presentedToken, setPresentedToken] = useState('')
  const [issueMessage, setIssueMessage] = useState('Generate a token to inspect its encoded parts.')
  const [expectedAudience, setExpectedAudience] = useState(AUDIENCE)
  const [verifyState, setVerifyState] = useState('idle')
  const [verifyChecks, setVerifyChecks] = useState([])
  const [activeCheck, setActiveCheck] = useState(-1)
  const [selectedClaim, setSelectedClaim] = useState('exp')
  const [storageChoice, setStorageChoice] = useState('memory')
  const [lifetimeMinutes, setLifetimeMinutes] = useState(15)
  const [revocationMode, setRevocationMode] = useState(false)
  const [routeScope, setRouteScope] = useState(true)
  const [routeOwner, setRouteOwner] = useState(true)
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [challengeChoice, setChallengeChoice] = useState('')
  const [challengeTraceCount, setChallengeTraceCount] = useState(0)
  const [challengeRunning, setChallengeRunning] = useState(false)
  const [challengeAnswered, setChallengeAnswered] = useState(false)
  const [challengeScore, setChallengeScore] = useState(0)

  const segments = presentedToken ? presentedToken.split('.') : []
  const decoded = useMemo(() => {
    if (segments.length !== 3) return { header: null, payload: null }
    try {
      return { header: decodeBase64UrlJson(segments[0]), payload: decodeBase64UrlJson(segments[1]) }
    } catch {
      return { header: null, payload: null }
    }
  }, [presentedToken])
  const parsedDrafts = useMemo(() => {
    try {
      const header = JSON.parse(headerDraft)
      const claims = JSON.parse(claimsDraft)
      return { header, claims, error: '' }
    } catch {
      return { header: null, claims: null, error: 'Fix the JSON before signing.' }
    }
  }, [headerDraft, claimsDraft])

  async function signClaims(claims, header = { alg: 'HS256', typ: 'JWT', kid: 'demo-key-1' }) {
    if (!globalThis.crypto?.subtle) throw new Error('Web Crypto is unavailable. Open this lesson over HTTPS or localhost.')
    if (header.alg !== 'HS256') throw new Error('This training issuer pins HS256. The token header cannot select another algorithm.')
    const headerPart = base64UrlText(JSON.stringify(header))
    const payloadPart = base64UrlText(JSON.stringify(claims))
    const key = await globalThis.crypto.subtle.importKey('raw', demoKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(`${headerPart}.${payloadPart}`))
    return `${headerPart}.${payloadPart}.${base64UrlBytes(new Uint8Array(signature))}`
  }

  async function issueFromEditor() {
    if (!parsedDrafts.header || !parsedDrafts.claims || parsedDrafts.error) {
      setIssueMessage(parsedDrafts.error || 'Header and payload must be JSON objects.')
      return
    }
    try {
      const token = await signClaims(parsedDrafts.claims, parsedDrafts.header)
      setIssuedToken(token)
      setPresentedToken(token)
      setIssueMessage('Signed locally with a temporary lesson key. This is a demonstration token, not a credential.')
      setVerifyState('idle')
      setVerifyChecks([])
      setActiveCheck(-1)
    } catch (error) {
      setIssueMessage(error.message || 'The demo token could not be signed.')
    }
  }

  async function issueScenario(kind) {
    let claims = decoded.payload || parsedDrafts.claims || makeStartingClaims()
    const now = Math.floor(Date.now() / 1000)
    setExpectedAudience(AUDIENCE)
    if (kind === 'expired') claims = { ...claims, iat: now - 600, nbf: now - 600, exp: now - 60 }
    if (kind === 'audience') claims = { ...claims, aud: 'billing-api', iat: now, nbf: now, exp: now + 900 }
    try {
      const token = await signClaims(claims)
      setIssuedToken(token)
      setPresentedToken(token)
      setIssueMessage(kind === 'expired' ? 'This token has a valid demo signature but an expired exp claim.' : 'This token is correctly signed for billing-api, not contacts-api.')
      setVerifyState('idle')
      setVerifyChecks([])
      setActiveCheck(-1)
      setView('verify')
    } catch (error) {
      setIssueMessage(error.message || 'The demo token could not be signed.')
    }
  }

  function tamperToken(kind) {
    const base = issuedToken || presentedToken
    const pieces = base.split('.')
    if (pieces.length !== 3) {
      setIssueMessage('Generate a token first, then try changing it.')
      setView('anatomy')
      return
    }
    try {
      if (kind === 'payload') {
        const claims = decodeBase64UrlJson(pieces[1])
        claims.sub = 'user-9999'
        pieces[1] = base64UrlText(JSON.stringify(claims))
        setIssueMessage('The subject changed, but the signature was left untouched.')
      } else {
        const header = decodeBase64UrlJson(pieces[0])
        header.alg = 'none'
        pieces[0] = base64UrlText(JSON.stringify(header))
        pieces[2] = ''
        setIssueMessage('The untrusted header now asks for alg: none. The verifier has a fixed allowlist.')
      }
      setPresentedToken(pieces.join('.'))
      setVerifyState('idle')
      setVerifyChecks([])
      setActiveCheck(-1)
      setView('verify')
    } catch {
      setIssueMessage('The token could not be decoded for this demonstration.')
    }
  }

  async function verifyPresentedToken() {
    setVerifyState('running')
    setVerifyChecks([])
    setActiveCheck(-1)
    const pieces = presentedToken.split('.')
    let header = null
    let claims = null
    let shapeValid = pieces.length === 3 && pieces[0].length > 0 && pieces[1].length > 0
    if (pieces.length === 3) {
      try {
        header = decodeBase64UrlJson(pieces[0])
        claims = decodeBase64UrlJson(pieces[1])
      } catch {
        shapeValid = false
      }
    }
    let signatureValid = false
    if (shapeValid && header?.alg === 'HS256' && globalThis.crypto?.subtle) {
      try {
        const key = await globalThis.crypto.subtle.importKey('raw', demoKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
        signatureValid = await globalThis.crypto.subtle.verify('HMAC', key, decodeBase64UrlBytes(pieces[2]), encoder.encode(`${pieces[0]}.${pieces[1]}`))
      } catch {
        signatureValid = false
      }
    }
    const now = Math.floor(Date.now() / 1000)
    const allowClaims = shapeValid && header?.alg === 'HS256' && signatureValid
    const tokenTypeValid = allowClaims && header.typ === 'JWT'
    const issuerValid = allowClaims && claims.iss === ISSUER
    const audiences = Array.isArray(claims?.aud) ? claims.aud : [claims?.aud]
    const audienceValid = allowClaims && audiences.includes(expectedAudience)
    const timeValid = allowClaims && typeof claims.exp === 'number' && now < claims.exp && (claims.nbf === undefined || (typeof claims.nbf === 'number' && now >= claims.nbf))
    const checks = [
      { label: VERIFY_STEPS[0][0], state: shapeValid ? 'pass' : 'fail', note: shapeValid ? 'Three compact segments were parsed.' : 'A signed compact JWT needs three non-empty segments.' },
      { label: VERIFY_STEPS[1][0], state: shapeValid ? (header?.alg === 'HS256' ? 'pass' : 'fail') : 'blocked', note: shapeValid ? `Header alg is ${header?.alg || 'missing'}; this verifier allows HS256 only.` : 'Cannot inspect a malformed token.' },
      { label: VERIFY_STEPS[2][0], state: shapeValid && header?.alg === 'HS256' ? (signatureValid ? 'pass' : 'fail') : 'blocked', note: !shapeValid || header?.alg !== 'HS256' ? 'Signature check stopped by the format or algorithm policy.' : signatureValid ? 'HMAC matches the exact header.payload signing input.' : 'Signature does not match the presented header and payload.' },
      { label: VERIFY_STEPS[3][0], state: allowClaims ? (tokenTypeValid ? 'pass' : 'fail') : 'blocked', note: allowClaims ? `Expected typ=JWT; received ${header.typ || 'no typ header'}.` : 'Token profile is not trusted until the signature is valid.' },
      { label: VERIFY_STEPS[4][0], state: allowClaims ? (issuerValid ? 'pass' : 'fail') : 'blocked', note: allowClaims ? `Expected ${ISSUER}; received ${claims.iss || 'no iss claim'}.` : 'Claims are not trusted until the signature is valid.' },
      { label: VERIFY_STEPS[5][0], state: allowClaims ? (audienceValid ? 'pass' : 'fail') : 'blocked', note: allowClaims ? `Expected ${expectedAudience}; received ${JSON.stringify(claims.aud ?? null)}.` : 'Audience is not trusted until the signature is valid.' },
      { label: VERIFY_STEPS[6][0], state: allowClaims ? (timeValid ? 'pass' : 'fail') : 'blocked', note: allowClaims ? `exp=${claims.exp ?? 'not set'} · nbf=${claims.nbf ?? 'not set'} · now=${now}.` : 'Time claims are not trusted until the signature is valid.' },
    ]
    for (let index = 0; index < checks.length; index += 1) {
      setActiveCheck(index)
      if (!reduceMotion) await new Promise((resolve) => window.setTimeout(resolve, 380))
      setVerifyChecks(checks.slice(0, index + 1))
    }
    const accepted = checks.every((check) => check.state === 'pass')
    setVerifyState(accepted ? 'accepted' : 'rejected')
    setActiveCheck(-1)
  }

  function restoreIssuedToken() {
    setPresentedToken(issuedToken)
    setVerifyState('idle')
    setVerifyChecks([])
    setActiveCheck(-1)
    setIssueMessage('Restored the last token signed by this lesson issuer.')
  }

  async function runChallenge() {
    if (!challengeChoice || challengeRunning || challengeAnswered) return
    const challenge = CHALLENGES[challengeIndex]
    setChallengeRunning(true)
    setChallengeTraceCount(0)
    for (let index = 0; index < challenge.trace.length; index += 1) {
      if (!reduceMotion) await new Promise((resolve) => window.setTimeout(resolve, 420))
      setChallengeTraceCount(index + 1)
    }
    if (challengeChoice === challenge.expected) setChallengeScore((score) => score + 1)
    setChallengeAnswered(true)
    setChallengeRunning(false)
  }

  function advanceChallenge() {
    const nextIndex = challengeIndex === CHALLENGES.length - 1 ? 0 : challengeIndex + 1
    if (nextIndex === 0) setChallengeScore(0)
    setChallengeIndex(nextIndex)
    setChallengeChoice('')
    setChallengeTraceCount(0)
    setChallengeAnswered(false)
  }

  const activeJourney = JOURNEY[journeyStep]
  const activeChallenge = CHALLENGES[challengeIndex]
  const selectedClaimInfo = CLAIMS.find(([name]) => name === selectedClaim) || CLAIMS[0]
  const expValue = Number(decoded.payload?.exp)
  const secondsRemaining = Number.isFinite(expValue) ? expValue - Math.floor(Date.now() / 1000) : null
  const authorizationAllowed = verifyState === 'accepted' && routeScope && routeOwner && !revocationMode
  const routeDecision = verifyState !== 'accepted' || revocationMode ? '401 · AUTHENTICATE' : routeScope && routeOwner ? '200 · ALLOW' : '403 · DENY'

  return <main className="jwt-studio min-h-screen px-4 py-6 text-white sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1500px]">
      <nav className="mb-6 flex flex-wrap items-center justify-between gap-3" aria-label="JWT studio navigation">
        <Link to="/course/jwt-authentication" className="jwt-back-link">← JWT Authentication course</Link>
        <Link to="/course/jwt-authentication/topic/jwt-05-what-is-jwt" className="jwt-reference-link">Open the full JWT lesson ↗</Link>
      </nav>

      <header className="jwt-hero">
        <div className="jwt-hero-glow" aria-hidden="true" />
        <div className="relative z-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.62fr)] lg:items-end">
          <div>
            <div className="jwt-eyebrow"><span className="jwt-live-dot" /> SECURITY WORKBENCH <i>JWT / JWS</i></div>
            <h1>See what happens <span>inside a JWT.</span></h1>
            <p className="jwt-hero-copy">Follow the token from login to a protected API. Build its parts, change claims, watch a real local HMAC signature fail, and step through the checks a verifier should perform.</p>
            <div className="jwt-hero-tags"><StatusTag tone="violet">Compact claims format</StatusTag><StatusTag tone="cyan">Signature ≠ encryption</StatusTag><StatusTag tone="green">Local browser simulation</StatusTag></div>
          </div>
          <aside className="jwt-hero-note">
            <b>First, one important distinction</b>
            <p>JWT is a token format, not a login protocol. A signed JWT’s claims are readable. The signature detects changes; it does not conceal the payload.</p>
            <small>This studio creates only a temporary in-browser teaching token. It never sends or stores it.</small>
          </aside>
        </div>
      </header>

      <div className="jwt-tab-strip" role="group" aria-label="JWT visual lessons">
        {VIEWS.map(([id, number, label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={view === id ? 'active' : ''}><span>{number}</span>{label}</button>)}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === 'journey' && <motion.section key="journey" className="jwt-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="jwt-section-heading"><div><span>01 / THE REQUEST JOURNEY</span><h2>From login to an authorized response</h2><p>Move one step at a time. Notice where signing stops and authorization begins.</p></div><div className="jwt-step-count">STEP {String(journeyStep + 1).padStart(2, '0')} <i>/ 06</i></div></div>
          <div className="jwt-journey-map">
            <div className="jwt-flow-rail" aria-hidden="true"><motion.i animate={{ left: `${journeyStep * 20}%` }} transition={{ duration: reduceMotion ? 0 : .42 }} /></div>
            {JOURNEY.map((step, index) => <button type="button" key={step.node} aria-current={journeyStep === index ? 'step' : undefined} onClick={() => setJourneyStep(index)} className={`jwt-flow-node ${step.accent} ${journeyStep === index ? 'selected' : ''} ${journeyStep > index ? 'passed' : ''}`}><span>{String(index + 1).padStart(2, '0')}</span><b>{step.node}</b><small>{step.title}</small></button>)}
          </div>
          <div className="jwt-journey-detail">
          <AnimatePresence mode="wait"><motion.article key={activeJourney.node} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: reduceMotion ? 0 : .18 }} className={`jwt-journey-card ${activeJourney.accent}`}>
              <div><span className="jwt-card-kicker">{activeJourney.node} / WHAT THE API DOES</span><h3>{activeJourney.title}</h3><p>{activeJourney.detail}</p><div className="jwt-wire-example"><span>MESSAGE VIEW</span><pre>{activeJourney.wire}</pre></div><div className="jwt-misconception"><b>Keep in mind</b><span>{activeJourney.misconception}</span></div></div>
              <div className="jwt-stage-orb" aria-hidden="true"><motion.div animate={{ rotate: journeyStep * 45 }} transition={{ duration: reduceMotion ? 0 : .5 }}><span>{activeJourney.node.slice(0, 1)}</span></motion.div><i /></div>
            </motion.article></AnimatePresence>
            <div className="jwt-journey-controls"><button type="button" disabled={journeyStep === 0} onClick={() => setJourneyStep((step) => Math.max(0, step - 1))}>← Previous step</button><button type="button" className="primary" onClick={() => setJourneyStep((step) => (step + 1) % JOURNEY.length)}>{journeyStep === JOURNEY.length - 1 ? 'Replay flow' : 'Next step'} <span>→</span></button></div>
          </div>
          <div className="jwt-two-definitions"><article><span>AUTHENTICATION</span><b>Who is making this request?</b><p>Derive identity only from a token that passed verification.</p></article><article><span>AUTHORIZATION</span><b>May they do this here?</b><p>Check permission and resource ownership after authentication.</p></article></div>
        </motion.section>}

        {view === 'anatomy' && <motion.section key="anatomy" className="jwt-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="jwt-section-heading"><div><span>02 / TOKEN ANATOMY</span><h2>Build, encode, then sign</h2><p>Edit the JSON and sign it locally. Base64URL is reversible encoding; HMAC-SHA-256 produces the signature for this lesson profile.</p></div><StatusTag tone="amber">Demo key exists only in this page</StatusTag></div>
          <div className="jwt-anatomy-grid">
            <section className="jwt-workbench-card"><div className="jwt-card-heading"><div><span>PART 01</span><h3>Header JSON</h3></div><StatusTag tone="violet">metadata</StatusTag></div><p className="jwt-card-help">The header names the signing algorithm and may include a key ID. The verifier still treats all token header values as untrusted input.</p><textarea aria-label="JWT header JSON" value={headerDraft} onChange={(event) => setHeaderDraft(event.target.value)} spellCheck="false" rows={6} /></section>
            <section className="jwt-workbench-card"><div className="jwt-card-heading"><div><span>PART 02</span><h3>Payload claims</h3></div><StatusTag tone="cyan">readable JSON</StatusTag></div><p className="jwt-card-help">Only include claims this API needs. Never place passwords, signing keys, or confidential data in a signed-only JWT.</p><textarea aria-label="JWT payload claims JSON" value={claimsDraft} onChange={(event) => setClaimsDraft(event.target.value)} spellCheck="false" rows={10} /></section>
          </div>
          <div className="jwt-signing-bridge"><div><span>ENCODE HEADER</span><i>→</i><span>ENCODE PAYLOAD</span><i>→</i><span>SIGN header.payload</span></div><button type="button" className="jwt-primary-button" onClick={issueFromEditor} disabled={Boolean(parsedDrafts.error)}>Sign demo token <span>✦</span></button></div>
          {issueMessage && <p className={`jwt-inline-message ${issueMessage.startsWith('Signed') ? 'success' : ''}`} aria-live="polite">{issueMessage}</p>}
          <section className="jwt-token-output">
            <div className="jwt-card-heading"><div><span>COMPACT SERIALIZATION / JWS PROFILE</span><h3>Three dot-separated segments</h3></div><button type="button" className="jwt-text-button" disabled={!issuedToken} onClick={restoreIssuedToken}>Restore issued token</button></div>
            <div className="jwt-segment-grid"><Segment title="HEADER" value={segments[0]} tone="head" empty="base64url(header JSON)" /><i> . </i><Segment title="PAYLOAD" value={segments[1]} tone="payload" empty="base64url(claims JSON)" /><i> . </i><Segment title="SIGNATURE" value={segments[2]} tone="signature" empty="HMAC(header.payload)" /></div>
            <div className="jwt-token-full"><span>BEARER TOKEN / DEMO ONLY</span><code>{presentedToken || 'Sign the JSON above to build the compact token.'}</code></div>
            <div className="jwt-decoded-grid"><article><span>DECODED HEADER</span><pre>{decoded.header ? jsonText(decoded.header) : '{ }'}</pre></article><article><span>DECODED PAYLOAD</span><pre>{decoded.payload ? jsonText(decoded.payload) : '{ }'}</pre></article><article><span>SIGNATURE MEANING</span><p>For HMAC, the issuer and verifier share a key. Anyone who can verify with that shared key can also create valid signatures. Never expose a production signing key to a browser.</p></article></div>
            <div className="jwt-key-models"><article><span>HS256 · SHARED KEY</span><b>One secret signs and verifies</b><p>All services holding this secret can also mint tokens. Keep it in server-side secret storage.</p></article><article><span>RS256 / ES256 · KEY PAIR</span><b>Private key signs, public key verifies</b><p>Resource servers can verify without receiving the issuer’s private signing key.</p></article><article><span>kid · KEY HINT</span><b>Resolve only inside trusted keys</b><p>Treat key IDs as untrusted input. Never turn kid directly into a path, URL, or arbitrary key lookup.</p></article></div>
            <p className="jwt-format-note"><b>Format note:</b> this lesson shows a signed JWS compact token with 3 segments. Encrypted JWE compact serialization has 5 segments; signing and encryption solve different problems.</p>
          </section>
        </motion.section>}

        {view === 'verify' && <motion.section key="verify" className="jwt-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="jwt-section-heading"><div><span>03 / RESOURCE SERVER</span><h2>Verify before trusting claims</h2><p>Watch the API inspect the presented token. A decoded payload is just input until every required check passes.</p></div><StatusTag tone={verifyState === 'accepted' ? 'green' : verifyState === 'rejected' ? 'rose' : 'neutral'}>{verifyState === 'accepted' ? 'TOKEN ACCEPTED' : verifyState === 'rejected' ? 'REQUEST REJECTED' : verifyState === 'running' ? 'CHECKING' : 'READY TO VERIFY'}</StatusTag></div>
          <div className="jwt-verifier-layout">
            <section className="jwt-verifier-request"><div className="jwt-card-heading"><div><span>INCOMING API REQUEST</span><h3>What the client sends</h3></div><span className="jwt-https-lock">HTTPS</span></div><div className="jwt-request-lines"><code><b>GET</b> /api/contacts</code><code>Host: api.northstar.example</code><code className="bearer">Authorization: Bearer {presentedToken ? `${presentedToken.slice(0, 34)}…` : '<token>'}</code></div><label className="jwt-select-label">Verifier expects this audience<select value={expectedAudience} onChange={(event) => { setExpectedAudience(event.target.value); setVerifyState('idle'); setVerifyChecks([]) }}><option value="contacts-api">contacts-api</option><option value="billing-api">billing-api</option></select></label><button type="button" className="jwt-primary-button full" disabled={!presentedToken || verifyState === 'running'} onClick={verifyPresentedToken}>{verifyState === 'running' ? 'Verifying token…' : 'Run verifier'} <span>→</span></button>
              {!presentedToken && <p className="jwt-empty-hint">Create a token in Build a token, then return here to verify it.</p>}
            </section>
            <section className="jwt-verification-steps"><div className="jwt-card-heading"><div><span>TRUST PIPELINE</span><h3>Seven checks, in order</h3></div><small>Only verified claims can identify the caller</small></div><div className="jwt-check-list">{VERIFY_STEPS.map(([title, detail], index) => {
              const check = verifyChecks[index]
              const current = activeCheck === index
              return <motion.article key={title} initial={false} animate={{ opacity: check || current ? 1 : .56, x: current ? 5 : 0 }} className={`jwt-check-row ${current ? 'current' : ''} ${check?.state || ''}`}><span className="jwt-check-number">{check?.state === 'pass' ? '✓' : check?.state === 'fail' ? '×' : String(index + 1).padStart(2, '0')}</span><div><b>{title}</b><p>{check?.note || detail}</p></div><StatusTag tone={check?.state === 'pass' ? 'green' : check?.state === 'fail' ? 'rose' : check?.state === 'blocked' ? 'neutral' : 'neutral'}>{check?.state || 'waiting'}</StatusTag></motion.article>
            })}</div><div className={`jwt-verification-result ${verifyState}`} aria-live="polite">{verifyState === 'accepted' ? 'Verified identity: ' + (decoded.payload?.sub || 'subject') : verifyState === 'rejected' ? 'Do not attach this token’s identity to the request.' : verifyState === 'running' ? 'Checking the request token…' : 'Signature verification and claim validation are separate checks.'}</div></section>
          </div>
          <div className="jwt-authorization-strip"><div><span>AFTER AUTHENTICATION</span><b>Permission and ownership still need a decision</b></div><div className="jwt-route-switches"><label><input type="checkbox" checked={routeScope} onChange={(event) => setRouteScope(event.target.checked)} />has contacts:read</label><label><input type="checkbox" checked={routeOwner} onChange={(event) => setRouteOwner(event.target.checked)} />owns this contact</label></div><StatusTag tone={authorizationAllowed ? 'green' : 'rose'}>{routeDecision}</StatusTag></div>
        </motion.section>}

        {view === 'claims' && <motion.section key="claims" className="jwt-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="jwt-section-heading"><div><span>04 / CLAIMS EXPLORER</span><h2>Claims are statements, not permissions by magic</h2><p>Claims describe an issuer, subject, recipient, time, or application-defined value. Their meaning depends on your token profile.</p></div><StatusTag tone="cyan">NumericDate = seconds since epoch</StatusTag></div>
          <div className="jwt-claims-layout"><div className="jwt-claim-list">{CLAIMS.map(([name, title, description]) => <button type="button" key={name} className={selectedClaim === name ? 'selected' : ''} onClick={() => setSelectedClaim(name)}><code>{name}</code><span>{title}</span><i>{decoded.payload?.[name] === undefined ? 'not in token' : typeof decoded.payload[name] === 'number' && ['exp', 'nbf', 'iat'].includes(name) ? new Date(decoded.payload[name] * 1000).toLocaleString() : JSON.stringify(decoded.payload[name])}</i></button>)}<button type="button" className={selectedClaim === 'scope' ? 'selected private' : 'private'} onClick={() => setSelectedClaim('scope')}><code>scope</code><span>Application claim</span><i>{decoded.payload?.scope || 'contacts:read contacts:write'}</i></button></div>
            <article className="jwt-claim-detail"><span>SELECTED CLAIM / {selectedClaimInfo[0]}</span><h3>{selectedClaim === 'scope' ? 'Scope · application-defined' : selectedClaimInfo[1]}</h3><p>{selectedClaim === 'scope' ? 'Scope names the operations a client or subject may request in a particular API profile. A verifier must still enforce it on each route.' : selectedClaimInfo[2]}</p><div className="jwt-claim-live-value"><small>VALUE IN PRESENTED TOKEN</small><code>{selectedClaim === 'scope' ? (decoded.payload?.scope || 'contacts:read contacts:write') : decoded.payload?.[selectedClaim] === undefined ? 'Claim is not present' : jsonText(decoded.payload[selectedClaim])}</code></div><div className="jwt-time-rail"><div><span>NOT BEFORE</span><b>{typeof decoded.payload?.nbf === 'number' ? new Date(decoded.payload.nbf * 1000).toLocaleTimeString() : 'not set'}</b></div><i><motion.span animate={{ width: secondsRemaining === null ? '0%' : secondsRemaining <= 0 ? '100%' : '55%' }} transition={{ duration: reduceMotion ? 0 : .4 }} /></i><div><span>EXPIRES</span><b>{typeof decoded.payload?.exp === 'number' ? new Date(decoded.payload.exp * 1000).toLocaleTimeString() : 'not set'}</b></div></div><p className="jwt-claim-caution">A correctly signed claim can still be stale, inappropriate for this API, or insufficient to authorize a specific action.</p></article>
          </div>
          <div className="jwt-claim-note-grid"><article><b>Registered claims</b><p>Names such as iss, sub, aud, exp, nbf, iat, and jti are standardized by JWT. Many are optional in the base format; your token profile decides which are required.</p></article><article><b>Private claims</b><p>Names such as scope, role, or tenant are application conventions. Document them, minimize their data, and validate their use at the API.</p></article><article><b>Trust boundary</b><p>Read claims only after signature verification and the required issuer, audience, and time checks have passed.</p></article><article><b>JWT vs access token</b><p>JWT is a format. OAuth access tokens may be opaque or JWTs; an API must validate the token profile it expects.</p></article></div>
        </motion.section>}

        {view === 'attacks' && <motion.section key="attacks" className="jwt-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="jwt-section-heading"><div><span>05 / TRUST-BOUNDARY LAB</span><h2>Change one thing. Observe the check that catches it.</h2><p>Each action changes only a local teaching token. Watch the verifier distinguish an invalid signature from a valid token with invalid claims.</p></div><StatusTag tone="rose">Safe, local exercises</StatusTag></div>
          <div className="jwt-attack-grid">
            <button type="button" onClick={() => tamperToken('payload')}><span className="attack-icon">01</span><b>Change the subject</b><p>Edit payload bytes but keep the old signature. The signature must fail.</p><i>Expected: invalid signature → reject</i></button>
            <button type="button" onClick={() => issueScenario('expired')}><span className="attack-icon">02</span><b>Use an expired token</b><p>Issuer signs it correctly, but its exp time is in the past.</p><i>Expected: signature passes → time check fails</i></button>
            <button type="button" onClick={() => issueScenario('audience')}><span className="attack-icon">03</span><b>Wrong API audience</b><p>A validly signed token intended for billing-api reaches contacts-api.</p><i>Expected: signature passes → aud check fails</i></button>
            <button type="button" onClick={() => tamperToken('algorithm')}><span className="attack-icon">04</span><b>Ask for alg: none</b><p>Change attacker-controlled header data and remove the signature.</p><i>Expected: algorithm allowlist rejects it</i></button>
          </div>
          <div className="jwt-attack-workbench"><div><span>CURRENT PRESENTED TOKEN</span><code>{presentedToken ? `${segments[0]?.slice(0, 28)}… . ${segments[1]?.slice(0, 34)}… . ${segments[2]?.slice(0, 28) || '(empty signature)'}` : 'No token yet'}</code><p>{issueMessage}</p></div><div className="jwt-attack-actions"><button type="button" onClick={restoreIssuedToken} disabled={!issuedToken}>Restore signed token</button><button type="button" className="primary" onClick={verifyPresentedToken} disabled={!presentedToken || verifyState === 'running'}>Run the checks →</button></div></div>
          <div className="jwt-security-rules"><h3>Verifier rules worth keeping</h3><ul><li>Pin accepted algorithms in server configuration; do not trust alg from the token to choose policy.</li><li>Bind each algorithm to the right trusted key type and key source. Constrain kid lookup to configured keys.</li><li>Validate issuer, audience, expiration, and not-before for the API’s token profile.</li><li>Return a safe 401 for invalid or missing credentials; never log the full token.</li></ul></div>
        </motion.section>}

        {view === 'lifecycle' && <motion.section key="lifecycle" className="jwt-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="jwt-section-heading"><div><span>06 / STORAGE, EXPIRY, REVOCATION</span><h2>A token is a credential while it is usable</h2><p>JWTs change where some state lives. They do not remove browser risks, authorization checks, or lifecycle design.</p></div><StatusTag tone="amber">Bearer tokens need protection</StatusTag></div>
          <div className="jwt-lifecycle-layout">
            <section className="jwt-storage-card"><div className="jwt-card-heading"><div><span>CHOOSE A STORAGE MODEL</span><h3>What risk does this client accept?</h3></div></div><div className="jwt-storage-options">{[
              ['memory', 'In-memory token', 'An XSS attacker may still read app memory, but reloads clear it. Plan how the client obtains another access token.'],
              ['cookie', 'HttpOnly Secure cookie', 'JavaScript cannot read an HttpOnly cookie, but an active XSS can still make requests from the page. Browsers send cookies automatically, so use SameSite and a deliberate CSRF defense.'],
              ['local', 'localStorage', 'Simple across reloads, but any successful same-origin script injection can read and exfiltrate the token.'],
              ['session', 'Server session cookie', 'A random session ID points to server-side state. It can simplify revocation at the cost of a session store.'],
            ].map(([id, title, note]) => <button type="button" key={id} onClick={() => setStorageChoice(id)} className={storageChoice === id ? 'selected' : ''}><span className="jwt-radio" /><div><b>{title}</b><p>{note}</p></div></button>)}</div><div className="jwt-storage-summary"><b>Selected: {storageChoice === 'memory' ? 'in-memory access token' : storageChoice === 'cookie' ? 'HttpOnly Secure cookie' : storageChoice === 'local' ? 'localStorage' : 'server session'}</b><span>There is no one storage choice that removes every threat. Match controls to the app’s XSS, CSRF, and refresh-token model.</span></div></section>
            <section className="jwt-expiry-card"><div className="jwt-card-heading"><div><span>ACCESS TOKEN LIFETIME</span><h3>Short expiry limits exposure</h3></div><b className="jwt-minute-value">{lifetimeMinutes}<small> min</small></b></div><p>Short-lived access tokens reduce how long a stolen token remains useful. They do not stop theft or replace revocation and refresh policies.</p><label className="jwt-range-label">Illustration lifetime<select value={lifetimeMinutes} onChange={(event) => setLifetimeMinutes(Number(event.target.value))}><option value={5}>5 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>60 minutes</option></select></label><div className="jwt-lifetime-track"><span>ISSUED</span><div><motion.i key={lifetimeMinutes} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduceMotion ? 0 : .55 }} /></div><span>EXPIRES</span></div><div className="jwt-revoke-control"><div><b>Simulate revoked jti</b><p>Self-contained signature checks do not know about logout by themselves.</p></div><button type="button" aria-pressed={revocationMode} onClick={() => setRevocationMode((active) => !active)} className={revocationMode ? 'on' : ''}>{revocationMode ? 'REVOKED' : 'ACTIVE'}</button></div><p className="jwt-expiry-note">Immediate revocation needs extra state, such as a denylist/session version, or a session-based design. A jti claim alone is only an identifier.</p></section>
          </div>
          <div className="jwt-lifecycle-bottom"><article><span>ALWAYS</span><b>Use HTTPS</b><p>Protect bearer tokens while travelling between client and API.</p></article><article><span>NEVER</span><b>Put tokens in URLs</b><p>URLs can end up in history, access logs, analytics, and referrer data.</p></article><article><span>REMEMBER</span><b>Refresh is separate</b><p>A refresh token is a separate credential with its own rotation and storage rules.</p></article><article><span>COMPARE</span><b>JWT is not always better</b><p>A server session can be simpler when central revocation is important.</p></article></div>
        </motion.section>}

        {view === 'challenge' && <motion.section key="challenge" className="jwt-view" role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
          <div className="jwt-section-heading"><div><span>07 / REQUEST CHALLENGE</span><h2>Can you make the API decision?</h2><p>Predict the HTTP result, then follow the request through token verification and route authorization. Each case changes one important condition.</p></div><StatusTag tone="violet">{challengeScore} / {CHALLENGES.length} correct</StatusTag></div>
          <div className="jwt-challenge-progress"><div><span>CASE {String(challengeIndex + 1).padStart(2, '0')} OF {String(CHALLENGES.length).padStart(2, '0')}</span><b>{challengeScore} correct so far</b></div><div role="progressbar" aria-label="Challenge progress" aria-valuemin="0" aria-valuemax={CHALLENGES.length} aria-valuenow={challengeIndex + Number(challengeAnswered)}><motion.i animate={{ scaleX: (challengeIndex + Number(challengeAnswered)) / CHALLENGES.length }} transition={{ duration: reduceMotion ? 0 : .35 }} /></div></div>

          <div className="jwt-challenge-layout">
            <section className="jwt-challenge-case">
              <div className="jwt-card-heading"><div><span>CASE FILE / {String(challengeIndex + 1).padStart(2, '0')}</span><h3>{activeChallenge.title}</h3></div><span className="jwt-https-lock">HTTPS</span></div>
              <div className="jwt-challenge-request"><code>{activeChallenge.request}</code><span>Authorization: Bearer &lt;access-token&gt;</span></div>
              <p className="jwt-challenge-description">{activeChallenge.description}</p>
              <div className="jwt-challenge-facts" aria-label="Scenario facts">{activeChallenge.facts.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>
              <fieldset className="jwt-challenge-prediction" disabled={challengeRunning || challengeAnswered}>
                <legend>Predict the response</legend>
                <div>{[['200', 'Allow'], ['401', 'Reject token'], ['403', 'Deny action']].map(([status, label]) => <button type="button" key={status} aria-pressed={challengeChoice === status} className={challengeChoice === status ? 'selected' : ''} onClick={() => setChallengeChoice(status)}><b>{status}</b><span>{label}</span></button>)}</div>
              </fieldset>
              <div className="jwt-challenge-controls"><button type="button" className="jwt-primary-button" disabled={!challengeChoice || challengeRunning || challengeAnswered} onClick={runChallenge}>{challengeRunning ? 'Tracing request…' : challengeAnswered ? 'Decision complete' : 'Send request through API'} <span aria-hidden="true">→</span></button>{challengeAnswered && <button type="button" className="jwt-text-button" onClick={advanceChallenge}>{challengeIndex === CHALLENGES.length - 1 ? 'Play again' : 'Next case'} →</button>}</div>
              {challengeAnswered && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`jwt-challenge-feedback ${challengeChoice === activeChallenge.expected ? 'correct' : 'incorrect'}`} aria-live="polite"><b>{challengeChoice === activeChallenge.expected ? 'Correct prediction' : `The API returns ${activeChallenge.expected}`}</b><span><strong>{activeChallenge.expected}</strong> · {activeChallenge.response}</span><p>{activeChallenge.explanation}</p></motion.div>}
            </section>

            <section className="jwt-challenge-pipeline">
              <div className="jwt-card-heading"><div><span>LIVE REQUEST TRACE</span><h3>Follow each trust boundary</h3></div><StatusTag tone={challengeRunning ? 'amber' : challengeAnswered ? (challengeChoice === activeChallenge.expected ? 'green' : 'rose') : 'neutral'}>{challengeRunning ? 'IN FLIGHT' : challengeAnswered ? 'COMPLETE' : 'WAITING'}</StatusTag></div>
              <div className="jwt-challenge-path" aria-label="Request path"><span>CLIENT</span><i>→</i><span>API</span><i>→</i><span>VERIFIER</span><i>→</i><span>ROUTE</span></div>
              <div className="jwt-challenge-trace">{activeChallenge.trace.map(([label, result, detail], index) => {
                const revealed = index < challengeTraceCount
                const state = revealed ? result : 'waiting'
                const marker = state === 'pass' ? '✓' : state === 'fail' ? '×' : state === 'blocked' ? '—' : String(index + 1).padStart(2, '0')
                return <motion.article key={label} initial={false} animate={{ opacity: revealed ? 1 : .5, x: challengeRunning && index === challengeTraceCount ? 4 : 0 }} className={`jwt-challenge-trace-row ${state}`}><span>{marker}</span><div><b>{label}</b><p>{revealed ? detail : index === 0 ? 'The request has not reached this check yet.' : 'Waiting for the previous check.'}</p></div><StatusTag tone={state === 'pass' ? 'green' : state === 'fail' ? 'rose' : 'neutral'}>{state}</StatusTag></motion.article>
              })}</div>
              {challengeAnswered && <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} className={`jwt-challenge-response status-${activeChallenge.expected}`}><span>API RESPONSE</span><b>{activeChallenge.expected}</b><p>{activeChallenge.response}</p></motion.div>}
            </section>
          </div>
          <div className="jwt-challenge-rule"><b>Remember the boundary:</b> invalid or expired credentials fail authentication (401). A verified identity that lacks permission or record ownership fails authorization (403). Some APIs intentionally return 404 for a forbidden record to avoid revealing that it exists; this exercise assumes the API distinguishes that case.</div>
        </motion.section>}
      </AnimatePresence>

      <footer className="jwt-footer"><span>JWT VISUAL STUDIO · LOCAL ONLY · NO TOKEN PERSISTENCE</span><div><a href="https://www.rfc-editor.org/rfc/rfc7519" target="_blank" rel="noreferrer">RFC 7519 ↗</a><a href="https://www.rfc-editor.org/rfc/rfc8725" target="_blank" rel="noreferrer">JWT Best Current Practice ↗</a><a href="https://www.rfc-editor.org/rfc/rfc9068" target="_blank" rel="noreferrer">JWT Access Token Profile ↗</a><a href="https://www.rfc-editor.org/rfc/rfc6750" target="_blank" rel="noreferrer">Bearer Token Usage ↗</a></div></footer>
    </div>
  </main>
}
