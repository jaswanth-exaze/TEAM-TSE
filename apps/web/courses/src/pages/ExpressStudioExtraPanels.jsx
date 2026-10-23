import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const FETCH_CODE = [
  "const response = await fetch('/api/books')",
  'const { data } = await response.json()',
  'renderBookCards(data)',
].join('\n')

const EJS_CODE = [
  "app.get('/shop', async (req, res) => {",
  '  const books = await Book.find()',
  "  res.render('shop', { books })",
  '})',
].join('\n')

function TraceRow({ item, index, active, complete }) {
  const state = complete ? item.state : active ? 'active' : 'waiting'
  return <motion.article initial={false} animate={{ opacity: state === 'waiting' ? 0.48 : 1, x: active ? 4 : 0 }} className={'ex-trace-row ' + state}>
    <span>{complete ? (item.state === 'pass' ? '✓' : item.state === 'fail' ? '×' : '—') : String(index + 1).padStart(2, '0')}</span>
    <div><b>{item.label}</b><p>{complete || active ? item.detail : 'Waiting for the request to reach this step.'}</p></div>
    <small>{complete ? item.state.toUpperCase() : active ? 'RUNNING' : 'QUEUED'}</small>
  </motion.article>
}

export function BrowserEjsView({ mode, setMode, busy, step, complete, run, reduceMotion, books, coursePath }) {
  const steps = mode === 'fetch'
    ? ['Browser starts fetch()', 'Request enters Express', 'Route returns JSON', 'Browser renders the result']
    : ['Browser requests /shop', 'Express selects EJS route', 'Controller prepares view data', 'EJS renders template + partials', 'Server returns HTML']
  const finalStage = mode === 'fetch' ? 3 : 4
  const forward = step >= 1
  const returned = step >= 2
  return <motion.section key="rendering" className="ex-view-panel" role="tabpanel" initial={{ opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}>
    <div className="ex-section-heading"><div><span>05 / BROWSER + EJS</span><h2>JSON for apps, HTML for pages</h2><p>Compare two complete request cycles: a browser fetch that consumes JSON, and an EJS route that renders HTML on the server.</p></div><span className="ex-version-pill">CLIENT ↔ SERVER</span></div>
    <div className="ex-render-controls" role="group" aria-label="Choose response rendering style">
      <button type="button" disabled={busy} className={mode === 'fetch' ? 'selected' : ''} aria-pressed={mode === 'fetch'} onClick={() => setMode('fetch')}><span>01</span><b>Fetch + JSON</b><small>Browser builds the view</small></button>
      <button type="button" disabled={busy} className={mode === 'ejs' ? 'selected' : ''} aria-pressed={mode === 'ejs'} onClick={() => setMode('ejs')}><span>02</span><b>EJS + HTML</b><small>Server builds the page</small></button>
      <Link to={coursePath + '/topic/' + (mode === 'fetch' ? 'express-29-making-requests-from-frontend' : 'express-31-ejs-template-engine-setup')}>Open related lesson ↗</Link>
    </div>
    <div className={'ex-render-stage ' + mode}>
      <div className="ex-render-scene">
        <div className={'ex-render-node browser ' + (step >= 0 ? 'lit' : '')}><span>{mode === 'fetch' ? 'BROWSER APP' : 'BROWSER'}</span><b>{mode === 'fetch' ? 'fetch("/api/books")' : 'GET /shop'}</b><small>{mode === 'fetch' ? 'JavaScript client' : 'page navigation'}</small></div>
        <div className="ex-render-wire"><motion.i animate={reduceMotion || !forward ? { opacity: 0.2 } : { x: [0, 30, 60], opacity: [1, 1, 0.4] }} transition={{ duration: 0.8, repeat: busy ? Infinity : 0 }} /></div>
        <div className={'ex-render-node express ' + (step >= 1 ? 'lit' : '')}><span>EXPRESS ROUTE</span><b>{mode === 'fetch' ? 'res.json(data)' : 'res.render("shop", data)'}</b><small>{mode === 'fetch' ? 'application/json' : 'template + locals'}</small></div>
        <div className="ex-render-wire return"><motion.i animate={reduceMotion || !returned ? { opacity: 0.2 } : { x: [60, 30, 0], opacity: [1, 1, 0.4] }} transition={{ duration: 0.8, repeat: busy ? Infinity : 0 }} /></div>
        <div className={'ex-render-node output ' + (step >= finalStage ? 'lit' : '')}><span>{mode === 'fetch' ? 'DOM VIEW' : 'HTML PAGE'}</span><b>{mode === 'fetch' ? 'Client renders cards' : 'Server sends markup'}</b><small>{mode === 'fetch' ? 'JSON → browser UI' : 'EJS → HTML response'}</small></div>
        {busy && <motion.div className={'ex-render-packet ' + (step % 2 === 0 ? 'outbound' : 'inbound')} animate={step % 2 === 0 ? { left: ['8%', '50%', '90%'] } : { left: ['90%', '50%', '8%'] }} transition={{ duration: 0.75, ease: 'easeInOut' }}>{mode === 'fetch' ? 'JSON' : 'HTTP'}</motion.div>}
      </div>
      <div className="ex-render-progress">
        <div className="ex-render-progress-head"><span>{busy ? 'REQUEST STEP ' + (step + 1) + ' / ' + steps.length : complete ? 'REQUEST CYCLE COMPLETE' : 'READY TO PLAY'}</span><small>{mode === 'fetch' ? 'JSON travels back; browser JavaScript updates the DOM.' : 'EJS runs on the server; the browser receives rendered HTML.'}</small></div>
        <div className="ex-render-step-list">{steps.map((label, index) => <div key={label} className={step > index || complete ? 'done' : step === index ? 'active' : ''}><i>{step > index || complete ? '✓' : String(index + 1).padStart(2, '0')}</i><span>{label}</span></div>)}</div>
        <button type="button" className="ex-primary-button" disabled={busy} onClick={run}>{busy ? 'Animating request…' : complete ? 'Replay request' : 'Run the request'} <span>→</span></button>
      </div>
    </div>
    <div className="ex-render-explain-grid">
      <section className="ex-code-panel"><div className="ex-card-heading"><div><span>{mode === 'fetch' ? 'BROWSER JAVASCRIPT' : 'EXPRESS ROUTE'}</span><h3>{mode === 'fetch' ? 'Consume JSON in the client' : 'Pass data into a template'}</h3></div></div><pre>{mode === 'fetch' ? FETCH_CODE : EJS_CODE}</pre><p>{mode === 'fetch' ? 'The browser receives data and decides how to update its own page.' : 'Express selects the view and supplies local variables for the EJS template.'}</p></section>
      <section className="ex-render-output"><div className="ex-card-heading"><div><span>{mode === 'fetch' ? 'JSON DATA → UI' : 'EJS TEMPLATE → HTML'}</span><h3>What the user sees</h3></div></div>
        {mode === 'fetch' ? <div className="ex-book-cards">{books.slice(0, 3).map((book) => <article key={book.id}><span>{book.category}</span><b>{book.title}</b><small>{book.author}</small></article>)}</div> : <div className="ex-ejs-preview"><span>&lt;h1&gt;Northstar Bookshop&lt;/h1&gt;</span>{books.slice(0, 3).map((book) => <article key={book.id}><i /><div><b>{book.title}</b><small>escaped output: &lt;%= book.title %&gt;</small></div></article>)}<small>Use &lt;%= value %&gt; to escape output. Keep unescaped output for trusted markup.</small></div>}
      </section>
    </div>
    <div className="ex-lesson-callout"><span>CONTINUE LEARNING</span><p>{mode === 'fetch' ? 'The browser receives JSON, then JavaScript reads the response and updates the interface.' : 'The server gives EJS data, EJS creates HTML, and Express sends that HTML to the browser.'}</p><Link to={coursePath + '/topic/' + (mode === 'fetch' ? 'express-29-making-requests-from-frontend' : 'express-32-pass-data-to-views')}>Continue with {mode === 'fetch' ? 'frontend requests' : 'passing data to views'} ↗</Link></div>
  </motion.section>
}

export function MissionView({ mission, missionIndex, missionCount, choice, setChoice, busy, traceCount, complete, score, check, next, coursePath }) {
  const area = ['REQUEST DATA', 'BODY PARSING', 'MIDDLEWARE', 'ERROR HANDLING', 'TEMPLATES'][missionIndex]
  const isCorrect = choice === mission.answer
  return <motion.section key="missions" className="ex-view-panel" role="tabpanel" initial={{ opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
    <div className="ex-section-heading"><div><span>06 / MISSION MODE</span><h2>Read the request. Predict the server.</h2><p>Use what you learned to solve short Express scenarios, then watch the request trace explain the correct control flow.</p></div><div className="ex-score-badge"><span>STUDIO SCORE</span><b>{score} <small>/ {missionIndex + (complete ? 1 : 0)}</small></b></div></div>
    <div className="ex-mission-layout">
      <section className="ex-mission-card">
        <div className="ex-mission-meta"><span>MISSION {String(missionIndex + 1).padStart(2, '0')} / {String(missionCount).padStart(2, '0')}</span><span>{area}</span></div>
        <h3>{mission.prompt}</h3>
        <div className="ex-mission-choices">{mission.choices.map((text, index) => <button type="button" key={text} disabled={busy || complete} aria-pressed={choice === index} className={(choice === index ? 'selected ' : '') + (complete && index === mission.answer ? 'correct ' : '') + (complete && choice === index && !isCorrect ? 'incorrect' : '')} onClick={() => setChoice(index)}><i>{String.fromCharCode(65 + index)}</i><span>{text}</span>{complete && index === mission.answer && <b>✓</b>}</button>)}</div>
        <div className="ex-mission-footer"><Link to={coursePath + '/topic/' + mission.lesson}>Review lesson ↗</Link>{complete ? <button type="button" className="ex-primary-button" onClick={next}>{missionIndex === missionCount - 1 ? 'Play again' : 'Next mission'} →</button> : <button type="button" className="ex-primary-button" disabled={choice < 0 || busy} onClick={check}>{busy ? 'Tracing the request…' : 'Check + trace'} →</button>}</div>
        {complete && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={'ex-mission-feedback ' + (isCorrect ? 'correct' : 'incorrect')}><b>{isCorrect ? 'Correct: you predicted the request path.' : 'Let’s follow the path and see the key decision.'}</b><p>{mission.explanation}</p></motion.div>}
      </section>
      <section className="ex-mission-trace"><div className="ex-card-heading"><div><span>VISUAL ANSWER TRACE</span><h3>What Express does next</h3></div><span className="ex-version-pill">ORDERED FLOW</span></div>
        <div className="ex-trace-list">{mission.trace.map((detail, index) => <TraceRow key={missionIndex + '-' + detail} item={{ label: detail, detail, state: complete && !isCorrect ? 'blocked' : 'pass' }} index={index} active={busy && index === traceCount} complete={index < traceCount} />)}</div>
        <div className="ex-mission-progress"><i style={{ width: (complete ? 100 : mission.trace.length ? traceCount / mission.trace.length * 100 : 0) + '%' }} /><span>{complete ? 'Explanation complete' : traceCount + ' / ' + mission.trace.length + ' steps revealed'}</span></div>
      </section>
    </div>
    <div className="ex-mission-footer-note"><b>Practice rule:</b> Answer first, then use the trace as feedback. Each mission links to the exact lesson where the concept is taught.</div>
  </motion.section>
}
