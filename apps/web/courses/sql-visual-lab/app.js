import {
  SCHEMA_TABLES,
  buildExecutionSteps,
  findErrorLine,
  friendlyEngineError,
  inspectQuery,
} from './engine.js'

const $ = (selector) => document.querySelector(selector)
const editorTextarea = $('#sql-editor')
const queryMessage = $('#query-message')
const runButton = $('#run-query')
const cancelButton = $('#cancel-query')
const retryButton = $('#retry-engine')
const clearButton = $('#clear-query')
const checkChallengeButton = $('#check-challenge')
const challengeSelect = $('#challenge-select')
const challengePrompt = $('#challenge-prompt')
const challengeFeedback = $('#challenge-feedback')
const challengeFeedbackCopy = $('#challenge-feedback-copy')
const hintButton = $('#show-hint')
const solutionButton = $('#show-solution')
const resultContent = $('#result-content')
const resultCount = $('#result-count')
const executionMeta = $('#execution-meta')
const stepView = $('#step-view')
const stepPanel = $('#panel-steps')
const resultPanel = $('#panel-result')
const stepsEmpty = $('.steps-empty')
const preview = $('#table-preview')
const schemaTables = $('#schema-tables')
const cheatsheetDialog = $('#cheatsheet-dialog')
const queryModeButton = $('#query-mode')
const sandboxModeButton = $('#sandbox-mode')
const modeCopy = $('#mode-copy')
const modeSafetyNote = $('#mode-safety-note')
const transactionStatus = $('#transaction-status')
const undoButton = $('#undo-sandbox')
const redoButton = $('#redo-sandbox')
const writeConfirmDialog = $('#confirm-write-dialog')
const writeConfirmCopy = $('#confirm-write-copy')

const examples = {
  where: `SELECT name, salary
FROM employees
WHERE salary > 90000
ORDER BY salary DESC;`,
  join: `SELECT e.name, d.name AS department_name
FROM employees AS e
LEFT JOIN departments AS d ON e.department_id = d.id
ORDER BY e.name;`,
  group: `SELECT status, COUNT(*) AS order_count, SUM(amount) AS total_amount
FROM orders
GROUP BY status;`,
  having: `SELECT d.name AS department_name, COUNT(e.id) AS employee_count
FROM departments AS d
INNER JOIN employees AS e ON e.department_id = d.id
GROUP BY d.id, d.name
HAVING COUNT(e.id) >= 2
ORDER BY employee_count DESC, department_name;`,
  'order-limit': `SELECT id, amount, status
FROM orders
ORDER BY amount DESC
LIMIT 5;`,
  'window-ranking': `SELECT name, department_id, salary,
       RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS department_rank
FROM employees
ORDER BY department_id, department_rank;`,
  hierarchy: `WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 0 AS depth
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, org.depth + 1
  FROM employees AS e
  JOIN org ON e.manager_id = org.id
)
SELECT id, name, manager_id, depth
FROM org
ORDER BY depth, id;`,
  'sandbox-insert': `INSERT INTO departments (name, location)
VALUES ('Finance', 'Delhi');`,
  'sandbox-update': `UPDATE employees
SET salary = salary * 1.05
WHERE id = 2;`,
  'sandbox-delete': `DELETE FROM orders
WHERE id = 14;`,
  'sandbox-transaction': `BEGIN;
UPDATE employees SET salary = salary + 5000 WHERE id = 2;
ROLLBACK;`,
  'sandbox-create': `CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name TEXT NOT NULL UNIQUE,
  lead_id INTEGER REFERENCES employees(id)
);`,
}

let workerClient = null
let schemaSqlCache = ''
let engineReady = false
let parser = null
let editor = null
let challenges = []
let selectedChallenge = null
let failedAttempts = 0
let activeStepIndex = 0
let activeSteps = []
let autoplayTimer = null
let markedErrorLine = null
let solutionVisible = false
let hintVisible = false
let currentMode = 'query'
let querySchema = []
let sandboxSchema = []

const codeEditor = createEditor()
const sharedQuery = readSharedQueryFromHash()
if (sharedQuery) codeEditor.setValue(sharedQuery)
configureTabs()
configureActions()
runButton.disabled = true

const QUERY_TIMEOUT_MS = Number(document.querySelector('meta[name="sql-query-timeout"]')?.content) || 5000

class SqlWorkerClient {
  constructor(schemaSql) {
    this.schemaSql = schemaSql
    this.worker = null
    this.pending = new Map()
    this.nextRequestId = 1
    this.operationGeneration = 0
    this.readyPromise = null
    this.isReady = false
    this.restarting = false
    this.sandboxSnapshot = null
  }

  start() {
    this.readyPromise = this.createAndInitialize()
    return this.readyPromise
  }

  async createAndInitialize() {
    this.isReady = false
    this.worker = new Worker(new URL('./worker.js', import.meta.url))
    this.worker.addEventListener('message', (event) => this.receive(event.data))
    this.worker.addEventListener('error', (event) => {
      event.preventDefault()
      this.handleWorkerFailure(new Error('The SQL worker stopped unexpectedly. Retry the engine and run your query again.'))
    })
    this.initResult = await this.sendRaw('init', { schemaSql: this.schemaSql, sandboxSnapshot: this.sandboxSnapshot }, 15000)
    this.isReady = true
    return true
  }

  async request(type, payload = {}, timeout = QUERY_TIMEOUT_MS, operation = this.operationGeneration) {
    await this.waitUntilReady()
    if (operation !== this.operationGeneration) {
      const error = new Error('Query cancelled. The SQL engine is restarting.')
      error.name = 'AbortError'
      throw error
    }
    return this.sendRaw(type, payload, timeout)
  }

  async waitUntilReady() {
    while (this.readyPromise) {
      const readiness = this.readyPromise
      await readiness
      if (readiness !== this.readyPromise) continue
      if (this.worker && this.isReady) return
      break
    }
    throw new Error('The SQL engine is not ready. Use Retry engine to restart it.')
  }

  sendRaw(type, payload, timeout) {
    const requestId = this.nextRequestId++
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(requestId)
        const error = new Error(type === 'run'
          ? `This query took longer than ${QUERY_TIMEOUT_MS / 1000} seconds and was stopped. Try a simpler query or add a LIMIT.`
          : 'The SQL engine took too long to respond. Retry the engine and try again.')
        error.code = type === 'run' ? 'TIMEOUT' : 'ENGINE_TIMEOUT'
        reject(error)
        if (type !== 'init') this.restart(error)
      }, timeout)
      this.pending.set(requestId, { resolve, reject, timer, type, payload })
      this.worker.postMessage({ requestId, type, payload })
    })
  }

  receive(message) {
    const pending = this.pending.get(message?.requestId)
    if (!pending) return
    window.clearTimeout(pending.timer)
    this.pending.delete(message.requestId)
    if (!message.ok) {
      const error = new Error(message.error?.message || 'The SQL engine could not run this query.')
      error.code = message.error?.code || 'QUERY_FAILED'
      pending.reject(error)
      return
    }
    if (message.result?.sandboxSnapshot instanceof Uint8Array) this.sandboxSnapshot = message.result.sandboxSnapshot
    pending.resolve(message.result)
  }

  cancel() {
    this.operationGeneration += 1
    const error = new Error('Query cancelled. The SQL engine is restarting.')
    error.name = 'AbortError'
    this.restart(error)
  }

  dispose() {
    this.worker?.terminate()
    this.worker = null
    this.rejectPending(new Error('The SQL engine is restarting.'))
    this.isReady = false
  }

  handleWorkerFailure(error) {
    if (!this.worker) return
    if (this.isReady) this.restart(error)
    else {
      this.rejectPending(error)
      this.worker.terminate()
      this.worker = null
      this.isReady = false
    }
  }

  restart(reason) {
    if (this.restarting) return this.readyPromise
    this.restarting = true
    this.operationGeneration += 1
    this.worker?.terminate()
    this.worker = null
    this.isReady = false
    this.rejectPending(reason)
    this.readyPromise = this.createAndInitialize()
      .catch((error) => {
        engineReady = false
        showFatalError(`The SQL engine could not restart. ${error.message}`)
        throw error
      })
      .finally(() => { this.restarting = false })
    // The active request already reports the timeout or cancellation. Hold the
    // recovery rejection until the next action or the explicit retry button.
    this.readyPromise.catch(() => {})
    return this.readyPromise
  }

  rejectPending(reason) {
    this.pending.forEach(({ reject, timer }) => {
      window.clearTimeout(timer)
      reject(reason)
    })
    this.pending.clear()
  }
}

loadDependencies()

function createEditor() {
  if (window.CodeMirror && editorTextarea) {
    editor = window.CodeMirror.fromTextArea(editorTextarea, {
      mode: 'text/x-mysql',
      theme: 'material-darker',
      lineNumbers: true,
      lineWrapping: false,
      tabSize: 4,
      indentUnit: 4,
      gutters: ['CodeMirror-linenumbers', 'error-gutter'],
      extraKeys: {
        'Ctrl-Enter': () => runQuery(),
        'Cmd-Enter': () => runQuery(),
        Tab: (instance) => instance.replaceSelection('    ', 'end'),
      },
    })
    return {
      getValue: () => editor.getValue(),
      setValue: (value) => editor.setValue(value),
      clearError: clearEditorError,
      markError: markEditorError,
    }
  }

  queryMessage.textContent = 'The syntax-highlighted editor did not load. The plain text editor remains available.'
  queryMessage.dataset.tone = 'warning'
  return {
    getValue: () => editorTextarea.value,
    setValue: (value) => { editorTextarea.value = value },
    clearError: () => { editorTextarea.removeAttribute('aria-invalid') },
    markError: () => { editorTextarea.setAttribute('aria-invalid', 'true') },
  }
}

function readSharedQueryFromHash() {
  try {
    const query = new URLSearchParams(window.location.hash.slice(1)).get('query')?.trim()
    if (!query || query.length > 4000 || !/^\s*(?:SELECT|WITH)\b/i.test(query)) return ''
    return query
  } catch {
    return ''
  }
}

function configureTabs() {
  const tabButtons = [...document.querySelectorAll('[role="tab"]')]
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab, false))
    button.addEventListener('keydown', (event) => {
      let targetIndex = null
      if (event.key === 'ArrowRight') targetIndex = (index + 1) % tabButtons.length
      if (event.key === 'ArrowLeft') targetIndex = (index - 1 + tabButtons.length) % tabButtons.length
      if (event.key === 'Home') targetIndex = 0
      if (event.key === 'End') targetIndex = tabButtons.length - 1
      if (targetIndex === null) return
      event.preventDefault()
      tabButtons[targetIndex].focus()
      activateTab(tabButtons[targetIndex].dataset.tab, false)
    })
  })
}

function activateTab(name) {
  const isSteps = name === 'steps'
  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    const active = tab.dataset.tab === name
    tab.classList.toggle('is-active', active)
    tab.setAttribute('aria-selected', String(active))
    tab.tabIndex = active ? 0 : -1
  })
  resultPanel.hidden = isSteps
  resultPanel.classList.toggle('is-active', !isSteps)
  stepPanel.hidden = !isSteps
  stepPanel.classList.toggle('is-active', isSteps)
}

function configureActions() {
  runButton.addEventListener('click', () => runQuery())
  cancelButton.addEventListener('click', () => workerClient?.cancel())
  retryButton.addEventListener('click', () => loadDependencies())
  clearButton.addEventListener('click', clearQuery)
  checkChallengeButton.addEventListener('click', () => runQuery({ checkChallenge: true }))
  $('#reset-database').addEventListener('click', resetDatabase)
  queryModeButton.addEventListener('click', () => setExecutionMode('query'))
  sandboxModeButton.addEventListener('click', () => setExecutionMode('sandbox'))
  undoButton.addEventListener('click', () => changeSandboxHistory('undo'))
  redoButton.addEventListener('click', () => changeSandboxHistory('redo'))
  $('#cheatsheet-button').addEventListener('click', () => cheatsheetDialog.showModal())

  $('#example-select').addEventListener('change', (event) => {
    const example = examples[event.target.value]
    if (example) {
      codeEditor.setValue(example)
      codeEditor.clearError()
      setQueryMessage('Example loaded. Run it to see the intermediate data.', 'neutral')
      editor?.focus()
    }
    event.target.value = ''
  })

  challengeSelect.addEventListener('change', () => selectChallenge(challengeSelect.value))
  hintButton.addEventListener('click', toggleHint)
  solutionButton.addEventListener('click', toggleSolution)
}

async function setExecutionMode(mode) {
  if (mode !== 'query' && mode !== 'sandbox') return
  if (isQueryRunning) {
    setQueryMessage('Wait for the current run to finish before changing modes.', 'warning')
    return
  }
  if (currentMode === mode) return
  currentMode = mode
  document.body.dataset.mode = mode
  queryModeButton.classList.toggle('is-active', mode === 'query')
  sandboxModeButton.classList.toggle('is-active', mode === 'sandbox')
  queryModeButton.setAttribute('aria-pressed', String(mode === 'query'))
  sandboxModeButton.setAttribute('aria-pressed', String(mode === 'sandbox'))
  modeCopy.textContent = mode === 'query'
    ? 'Query Mode runs read-only queries against the challenge data.'
    : 'Sandbox Mode runs editable SQL on a separate temporary copy of the sample data.'
  modeSafetyNote.textContent = mode === 'query'
    ? 'Query Mode is read-only. Challenges always use this untouched database.'
    : 'Sandbox changes stay in this browser tab, can be undone, and never touch challenge data.'
  $('#example-select').querySelectorAll('option[data-mode]').forEach((option) => {
    option.hidden = option.dataset.mode !== mode
  })
  $('#editor-title').textContent = mode === 'sandbox' ? 'Try SQL statements' : 'Try a query'
  if (runButton.lastChild?.nodeType === Node.TEXT_NODE) runButton.lastChild.textContent = mode === 'sandbox' ? ' Run script' : ' Run query'
  checkChallengeButton.hidden = mode === 'sandbox' || !selectedChallenge
  hintButton.hidden = mode === 'sandbox' || !selectedChallenge
  solutionButton.hidden = mode === 'sandbox' || failedAttempts < 2
  challengeSelect.disabled = mode === 'sandbox'
  challengePrompt.textContent = mode === 'sandbox'
    ? 'Challenges run only against the untouched Query Mode database.'
    : selectedChallenge
      ? `${selectedChallenge.difficulty} · ${selectedChallenge.description}`
      : 'Choose a challenge to practice and check your result.'
  await refreshSandboxStatus()
  renderSchemaTables()
  preview.replaceChildren(createNode('p', 'preview-placeholder', 'Choose a table above to inspect a few rows.'))
  clearDisplayedResults(mode === 'query'
    ? 'Query Mode is ready. It can read the original challenge data.'
    : 'Sandbox Mode is ready. Try INSERT, UPDATE, DELETE, CREATE TABLE, or a transaction script.')
  setQueryMessage(mode === 'query' ? 'Query Mode selected. Only read-only SELECT queries can run here.' : 'Sandbox Mode selected. Your changes are isolated from challenge data.', 'neutral')
}

async function refreshSandboxStatus() {
  if (!workerClient || !engineReady) return
  try {
    const status = await workerClient.request('history')
    sandboxSchema = status.schema || sandboxSchema
    updateSandboxControls(status)
  } catch {
    updateSandboxControls({ undo: false, redo: false, activeTransaction: false })
  }
}

function updateSandboxControls(status = {}) {
  const enabled = currentMode === 'sandbox'
  transactionStatus.hidden = !enabled
  transactionStatus.textContent = status.activeTransaction ? 'Transaction open' : 'Autocommit'
  transactionStatus.dataset.active = String(Boolean(status.activeTransaction))
  undoButton.hidden = !enabled
  redoButton.hidden = !enabled
  undoButton.disabled = !status.undo || Boolean(status.activeTransaction)
  redoButton.disabled = !status.redo || Boolean(status.activeTransaction)
}

async function changeSandboxHistory(action) {
  if (currentMode !== 'sandbox' || !workerClient || !engineReady) return
  try {
    const state = await workerClient.request(action)
    sandboxSchema = state.schema || sandboxSchema
    updateSandboxControls(state)
    renderSchemaTables()
    clearDisplayedResults(action === 'undo' ? 'Sandbox change undone.' : 'Sandbox change redone.')
    setQueryMessage(state.label ? `${action === 'undo' ? 'Undid' : 'Redid'}: ${state.label}.` : `${action === 'undo' ? 'Undo' : 'Redo'} complete.`, 'success')
  } catch (error) {
    setQueryMessage(error.message || 'Could not restore that sandbox state.', 'error')
  }
}

async function loadDependencies() {
  retryButton.hidden = true
  runButton.disabled = true
  workerClient?.dispose()
  workerClient = null
  setQueryMessage('Starting the private SQL engine…', 'neutral')
  try {
    if (!schemaSqlCache) {
      const schemaResponse = await fetch(new URL('./schema.sql', import.meta.url))
      if (!schemaResponse.ok) throw new Error(`Could not load the sample schema (${schemaResponse.status}).`)
      schemaSqlCache = await schemaResponse.text()
    }
    const challengeResponse = await fetch(new URL('./challenges.json', import.meta.url))

    if (challengeResponse.ok) {
      challenges = await challengeResponse.json()
      populateChallenges()
    }
    parser = window.NodeSQLParser?.Parser ? new window.NodeSQLParser.Parser() : null
    workerClient = new SqlWorkerClient(schemaSqlCache)
    await workerClient.start()
    engineReady = true
    querySchema = workerClient.initResult?.schema || []
    sandboxSchema = workerClient.initResult?.sandboxSchema || []
    runButton.disabled = false
    retryButton.hidden = true
    renderSchemaTables()
    await refreshSandboxStatus()
    setQueryMessage(sharedQuery
      ? 'Question query loaded. Run it to see the result and open How it works for the steps.'
      : 'Database ready. Try the example or choose a table to explore.', 'success')

    if (!parser) {
      setQueryMessage('The query parser did not load. Queries can still run, but the step-by-step view is unavailable.', 'warning')
    }
  } catch (error) {
    engineReady = false
    showFatalError(error.message || 'The SQL learning lab could not start. Check your connection and retry.')
  }
}

async function resetDatabase() {
  if (!workerClient || !engineReady) return
  try {
    const resetState = await workerClient.request('reset')
    querySchema = resetState.schema || []
    sandboxSchema = resetState.sandboxSchema || []
    clearEditorError()
    renderSchemaTables()
    await refreshSandboxStatus()
    preview.replaceChildren(createNode('p', 'preview-placeholder', 'Choose a table above to inspect a few rows.'))
    clearDisplayedResults('The sample data reset. Run a query to see results from the original data.')
    setQueryMessage('Sample database reset. Your next query starts with the original data.', 'success')
  } catch (error) {
    setQueryMessage(error.message || 'Could not reset the sample database.', 'error')
  }
}

function renderSchemaTables() {
  schemaTables.replaceChildren()
  const schema = currentMode === 'sandbox' ? sandboxSchema : querySchema
  const visibleSchema = schema.filter((table) => table.type !== 'index')
  const tables = visibleSchema.length
    ? visibleSchema.map((table) => [table.name, table.columns || []])
    : Object.entries(SCHEMA_TABLES).map(([name, columns]) => [name, columns.map(([columnName, type]) => ({ name: columnName, type }))])
  tables.forEach(([tableName, columns]) => {
    const tableMeta = visibleSchema.find((table) => table.name === tableName)
    const button = createNode('button', 'schema-table-button')
    button.type = 'button'
    button.setAttribute('aria-expanded', 'false')
    button.dataset.table = tableName
    button.append(createNode('span', 'table-glyph', '▤'))
    const label = createNode('span', 'schema-table-label')
    label.append(createNode('strong', '', tableName))
    label.append(createNode('small', '', `${columns.length} columns${tableMeta?.type === 'view' ? ' · view' : ''}`))
    const keys = columns.filter((column) => column.primaryKey || column.foreignKey)
    if (keys.length) {
      const keySummary = keys.map((column) => column.primaryKey
        ? `PK ${column.name}`
        : `FK ${column.name} → ${column.foreignKey.table}.${column.foreignKey.column}`)
      label.append(createNode('small', 'schema-relations', keySummary.join(' · ')))
    }
    button.append(label)
    button.append(createNode('span', 'schema-chevron', '›'))
    button.addEventListener('click', () => showTablePreview(tableName, button))
    schemaTables.append(button)
  })
}

async function showTablePreview(tableName, activeButton) {
  document.querySelectorAll('.schema-table-button').forEach((button) => {
    const active = button === activeButton
    button.classList.toggle('is-selected', active)
    button.setAttribute('aria-expanded', String(active))
  })

  try {
    const rawResult = await workerClient.request('run', { sql: `SELECT * FROM "${tableName}" LIMIT 5`, mode: currentMode })
    const result = unwrapWorkerResult(rawResult)
    preview.replaceChildren()
    const heading = createNode('div', 'preview-heading')
    const title = createNode('h3')
    title.append(document.createTextNode(`${tableName} `), createNode('span', '', 'sample'))
    heading.append(title)
    const tryButton = createNode('button', 'text-button', 'Use in editor')
    tryButton.type = 'button'
    tryButton.addEventListener('click', () => {
      codeEditor.setValue(`SELECT *\nFROM ${tableName}\nLIMIT 5;`)
      editor?.focus()
    })
    heading.append(tryButton)
    const tableMeta = (currentMode === 'sandbox' ? sandboxSchema : querySchema).find((table) => table.name === tableName)
    const keys = (tableMeta?.columns || []).filter((column) => column.primaryKey || column.foreignKey)
    if (keys.length) {
      const keySummary = createNode('p', 'preview-key-summary')
      keySummary.append(createNode('strong', '', 'Keys: '))
      keySummary.append(document.createTextNode(keys.map((column) => column.primaryKey
        ? `PK ${column.name}`
        : `FK ${column.name} → ${column.foreignKey.table}.${column.foreignKey.column}`).join(' · ')))
      preview.append(heading, keySummary, renderTable(result, { compact: true, rowLimit: 5 }))
    } else {
      preview.append(heading, renderTable(result, { compact: true, rowLimit: 5 }))
    }
  } catch (error) {
    preview.replaceChildren(createNode('p', 'preview-placeholder', friendlyEngineError(error)))
  }
}

function populateChallenges() {
  while (challengeSelect.options.length > 1) challengeSelect.remove(1)
  for (const challenge of challenges) {
    const option = document.createElement('option')
    option.value = challenge.id
    option.textContent = `${challenge.difficulty} · ${challenge.title}`
    challengeSelect.append(option)
  }
}

function selectChallenge(challengeId) {
  selectedChallenge = challenges.find((challenge) => challenge.id === challengeId) || null
  failedAttempts = 0
  solutionVisible = false
  hintVisible = false
  solutionButton.hidden = true
  solutionButton.textContent = 'Show solution'
  checkChallengeButton.hidden = !selectedChallenge
  hintButton.hidden = !selectedChallenge
  challengeFeedback.hidden = !selectedChallenge
  challengeFeedbackCopy.replaceChildren()
  challengePrompt.textContent = selectedChallenge
    ? `${selectedChallenge.difficulty} · ${selectedChallenge.description}`
    : 'Choose a challenge to practice and check your result.'
  challengePrompt.classList.toggle('has-challenge', Boolean(selectedChallenge))
}

function toggleHint() {
  if (!selectedChallenge) return
  hintVisible = !hintVisible
  hintButton.textContent = hintVisible ? 'Hide hint' : 'Show hint'
  const oldHint = challengeFeedbackCopy.querySelector('.hint-copy')
  oldHint?.remove()
  if (hintVisible) challengeFeedbackCopy.append(createNode('p', 'hint-copy', `Hint: ${selectedChallenge.hint}`))
}

function toggleSolution() {
  if (!selectedChallenge || failedAttempts < 2) return
  solutionVisible = !solutionVisible
  solutionButton.textContent = solutionVisible ? 'Hide solution' : 'Show solution'
  challengeFeedbackCopy.querySelector('.solution-copy')?.remove()
  if (solutionVisible) {
    const solution = createNode('pre', 'solution-copy')
    solution.append(createNode('code', '', selectedChallenge.solution))
    challengeFeedbackCopy.append(solution)
  }
}

function clearQuery() {
  if (isQueryRunning) workerClient?.cancel()
  codeEditor.setValue('')
  codeEditor.clearError()
  activeSteps = []
  resultCount.textContent = ''
  executionMeta.textContent = ''
  resultContent.replaceChildren(createEmptyState('Your query result will appear here', 'Write a SELECT query and run it to see the returned records.'))
  renderStepUnavailable('Run a query to reveal its logical steps and the rows produced at each stage.')
  setQueryMessage('Editor cleared.', 'neutral')
}

let isQueryRunning = false

function setRunningState(running) {
  runButton.hidden = running
  cancelButton.hidden = !running
  clearButton.disabled = running
  checkChallengeButton.disabled = running
  queryModeButton.disabled = running
  sandboxModeButton.disabled = running
}

function clearDisplayedResults(message) {
  resultCount.textContent = ''
  executionMeta.textContent = ''
  resultContent.replaceChildren(createEmptyState('No current result', message))
  renderStepUnavailable(message)
  activeSteps = []
}

async function runQuery({ checkChallenge = false, confirmed = false } = {}) {
  if (!engineReady || isQueryRunning) return null
  if (checkChallenge && currentMode !== 'query') return null
  const sql = codeEditor.getValue()
  clearEditorError()
  stopAutoplay()

  let inspection = null
  if (currentMode === 'query') {
    try {
      inspection = inspectQuery(sql, parser)
    } catch (error) {
      const line = findErrorLine(sql, error)
      markEditorError(line)
      clearDisplayedResults('This query did not run. Fix the SQL and run it again.')
      setQueryMessage(error.message, 'error')
      return null
    }
  } else if (/^\s*(?:SELECT|WITH)\b/i.test(sql)) {
    try { inspection = inspectQuery(sql, parser) } catch { /* Worker returns the authoritative sandbox parse error. */ }
  }

  isQueryRunning = true
  setRunningState(true)
  clearDisplayedResults('Running query in the isolated SQL worker…')
  const startedAt = performance.now()
  const operation = workerClient.operationGeneration
  try {
    const workerResult = await workerClient.request('run', {
      sql,
      mode: currentMode,
      confirmed,
      continueOnError: $('#script-error-policy').value === 'continue',
    }, QUERY_TIMEOUT_MS, operation)
    if (workerResult.confirmationRequired) {
      isQueryRunning = false
      setRunningState(false)
      const approved = await confirmWholeTableWrite(workerResult.confirmationRequired)
      if (approved) return await runQuery({ confirmed: true })
      clearDisplayedResults('The statement was canceled. No rows were changed.')
      setQueryMessage('Canceled. No rows were changed.', 'neutral')
      return null
    }

    const elapsed = performance.now() - startedAt
    if (currentMode === 'sandbox') {
      sandboxSchema = workerResult.schema || sandboxSchema
      updateSandboxControls({
        undo: workerResult.history?.undo,
        redo: workerResult.history?.redo,
        activeTransaction: workerResult.transaction?.active,
      })
      renderSchemaTables()
      const result = workerResult.finalResult
      const hasStatementError = workerResult.statements.some((statement) => !statement.ok)
      let stepPlan = { available: false, steps: [], reason: 'This script has no visual steps.' }
      const singleRead = workerResult.statements.length === 1 && workerResult.statements[0].type === 'select'
      if (singleRead && inspection?.ast && inspection.visualizationAvailable) {
        stepPlan = await buildExecutionSteps(parser, inspection.ast, async (statement) => {
          const response = await workerClient.request('run', { sql: statement, mode: 'sandbox' }, QUERY_TIMEOUT_MS, operation)
          return unwrapWorkerResult(response)
        }, result)
      } else if (singleRead && inspection && !inspection.visualizationAvailable) {
        stepPlan = { available: false, steps: [], reason: inspection.reason }
      } else {
        stepPlan = createSandboxStepPlan(workerResult)
      }
      if (singleRead && result) renderResult(result)
      else renderSandboxScriptResults(workerResult)
      resultCount.textContent = singleRead && result
        ? `${result.totalRows} ${result.totalRows === 1 ? 'row' : 'rows'}${result.truncated ? ' (showing first 5,000)' : ''}`
        : `${workerResult.statements.length} ${workerResult.statements.length === 1 ? 'statement' : 'statements'} · ${workerResult.statements.reduce((sum, item) => sum + (item.affectedRows || 0), 0)} rows affected${result ? ` · last SELECT ${result.totalRows} rows` : ''}`
      executionMeta.textContent = `${elapsed.toFixed(1)} ms`
      setQueryMessage(
        hasStatementError
          ? 'Script finished with an error. Review the statement list and its visual trace.'
          : workerResult.transaction?.active
            ? 'Script complete. Changes are pending until you COMMIT or ROLLBACK.'
            : 'Sandbox script complete. Review the before-and-after trace.',
        hasStatementError ? 'warning' : 'success',
      )
      if (stepPlan.available) {
        renderSteps(stepPlan.steps)
      } else {
        renderStepUnavailable(stepPlan.reason)
      }
      activateTab('result')
      return result || workerResult
    }

    const result = workerResult
    let stepPlan = { available: false, steps: [], reason: inspection.reason || 'Step view not available for this query yet.' }
    if (inspection.ast && inspection.visualizationAvailable) {
      stepPlan = await buildExecutionSteps(parser, inspection.ast, async (statement) => {
        const response = await workerClient.request('run', { sql: statement, mode: 'query' }, QUERY_TIMEOUT_MS, operation)
        return unwrapWorkerResult(response)
      }, result)
    }

    renderResult(result)
    executionMeta.textContent = `${elapsed.toFixed(1)} ms`
    resultCount.textContent = `${result.totalRows} ${result.totalRows === 1 ? 'row' : 'rows'}${result.truncated ? ' (showing first 5,000)' : ''}`
    setQueryMessage(
      stepPlan.available
        ? 'Query complete. Results are shown; open How it works for the visual breakdown.'
        : 'Query complete. The final result is ready; this query has no step breakdown.',
      stepPlan.available ? 'success' : 'warning',
    )

    if (stepPlan.available) {
      renderSteps(stepPlan.steps)
    } else {
      renderStepUnavailable(stepPlan.reason || 'Step view not available for this query yet. The final result is still shown.')
    }
    activateTab('result')

    if (checkChallenge) await gradeChallenge(result)
    return result
  } catch (error) {
    const columns = Object.values(SCHEMA_TABLES).flat().map(([name]) => name)
    const line = findErrorLine(sql, error)
    markEditorError(line)
    clearDisplayedResults('The previous result was cleared because this query did not finish.')
    const tone = error.name === 'AbortError' || error.code === 'TIMEOUT' ? 'warning' : 'error'
    setQueryMessage(friendlyEngineError(error, columns), tone)
    return null
  } finally {
    isQueryRunning = false
    setRunningState(false)
  }
}

function unwrapWorkerResult(response) {
  return response?.kind === 'script' ? response.finalResult || { columns: [], rows: [], totalRows: 0, truncated: false } : response
}

async function confirmWholeTableWrite(details) {
  const items = Array.isArray(details) ? details : [details]
  const description = items.map((item) => `${item.operation} will affect all ${item.rowCount} rows in ${item.table}.`).join(' ')
  if (!writeConfirmDialog?.showModal) {
    return window.confirm(`${description} Run anyway?`)
  }
  $('#confirm-write-title').textContent = items.length === 1 ? 'This statement affects every row' : 'These statements affect every row'
  writeConfirmCopy.textContent = `${description} Add a WHERE clause to target specific rows. Proceed only if you intend to change every listed row.`
  return new Promise((resolve) => {
    writeConfirmDialog.addEventListener('close', () => resolve(writeConfirmDialog.returnValue === 'confirm'), { once: true })
    writeConfirmDialog.showModal()
  })
}

function createSandboxStepPlan(script) {
  const steps = script.statements.map((statement) => {
    const type = statement.type.toUpperCase()
    const kind = !statement.ok ? 'sandbox-error'
      : ['create', 'alter', 'drop'].includes(statement.type) ? 'sandbox-schema'
        : statement.type === 'transaction' ? 'sandbox-transaction'
          : ['insert', 'replace', 'update', 'delete', 'truncate'].includes(statement.type) ? 'sandbox-write'
            : 'sandbox-statement'
    const data = statement.type === 'select'
      ? { columns: statement.columns, rows: statement.rows, totalRows: statement.totalRows }
      : statement.after || statement.before || { columns: [], rows: [], totalRows: 0 }
    const result = { columns: data.columns || [], rows: data.rows || [], totalRows: data.totalRows || 0, truncated: Boolean(data.truncated) }
    const count = statement.affectedRows || 0
    const description = !statement.ok
      ? [statement.error, statement.note].filter(Boolean).join(' ')
      : kind === 'sandbox-write'
        ? `${type} affected ${count} ${count === 1 ? 'row' : 'rows'}. Compare the source snapshot with the resulting table below.`
        : kind === 'sandbox-schema'
          ? `${type} changed the schema. The database browser reflects the schema after this statement.`
          : kind === 'sandbox-transaction'
            ? `Transaction control changed the commit state to ${statement.transaction?.active ? 'pending' : 'autocommit'}. The before-and-after snapshots show whether the changes stayed or rolled back.`
            : 'This statement ran inside the isolated sandbox database.'
    return {
      id: `sandbox-${statement.index}`,
      title: `${String(statement.index).padStart(2, '0')} · ${type}`,
      description,
      sql: statement.sql,
      kind,
      result,
      before: statement.before,
      after: statement.after,
      statement,
      schemaBefore: statement.schemaBefore,
      schemaAfter: statement.schemaAfter,
      input: statement.before,
    }
  })
  return { available: steps.length > 0, reason: steps.length ? '' : 'No statement trace was produced.', steps }
}

function renderSandboxScriptResults(script) {
  resultContent.replaceChildren()
  const list = createNode('div', 'script-results')
  script.statements.forEach((statement) => {
    const card = createNode('article', 'script-statement')
    const head = createNode('div', 'script-statement-head')
    const title = createNode('div')
    title.append(createNode('h3', '', `Statement ${statement.index} · ${statement.type.toUpperCase()}`))
    title.append(createNode('p', '', statement.sql))
    const status = !statement.ok ? 'Error'
      : statement.columns?.length ? `${statement.totalRows} result rows`
        : statement.type === 'transaction' ? (statement.transaction?.active ? 'Transaction open' : 'Transaction ended')
          : ['create', 'alter', 'drop'].includes(statement.type) ? 'Schema changed'
            : `${statement.affectedRows || 0} rows affected`
    const badge = createNode('span', `script-result-badge${statement.ok ? '' : ' is-error'}`, status)
    head.append(title, badge)
    card.append(head)
    if (!statement.ok) card.append(createNode('p', 'script-error', statement.error))
    else if (statement.columns?.length) card.append(renderTable({ columns: statement.columns, rows: statement.rows, totalRows: statement.totalRows }, { rowLimit: 20 }))
    else if (statement.before || statement.after) card.append(renderDiffTable(statement.before, statement.after))
    else if (['create', 'alter', 'drop'].includes(statement.type)) card.append(renderSchemaDiff(statement.schemaBefore || [], statement.schemaAfter || []))
    if (statement.note) card.append(createNode('p', 'script-state-note', statement.note))
    card.append(createNode('p', 'script-state-note', statement.transaction?.active ? 'Changes are pending in this transaction.' : 'Autocommit is active; this statement is committed.'))
    card.append(createNode('p', 'script-state-note', `Completed in ${Number(statement.durationMs || 0).toFixed(1)} ms.`))
    list.append(card)
  })
  if (!script.statements.length) list.append(createEmptyState('No statements ran', 'The script was canceled before it changed any rows.'))
  resultContent.append(list)
}

async function gradeChallenge(result) {
  if (!selectedChallenge || !workerClient) return
  let expected
  try {
    expected = await workerClient.request('run', { sql: selectedChallenge.expectedResult.query })
  } catch {
    setFeedback('The reference result for this challenge could not be loaded. Reset the database and try again.', 'error')
    return
  }

  const matches = compareResults(result, expected, selectedChallenge.expectedResult.orderMatters)
  if (matches) {
    setFeedback('Correct. Your result matches the expected records and columns.', 'success')
    return
  }

  failedAttempts += 1
  solutionButton.hidden = failedAttempts < 2
  solutionVisible = false
  solutionButton.textContent = 'Show solution'
  challengeFeedbackCopy.querySelector('.solution-copy')?.remove()
  setFeedback(`Not quite yet. Your query ran and returned ${result.totalRows} ${result.totalRows === 1 ? 'row' : 'rows'}. Check the required columns and values, then try again.`, 'error')
}

function setFeedback(message, tone) {
  const feedbackText = createNode('p', 'feedback-message', message)
  feedbackText.dataset.tone = tone
  const solution = challengeFeedbackCopy.querySelector('.solution-copy')
  challengeFeedbackCopy.replaceChildren(feedbackText)
  if (hintVisible && selectedChallenge) challengeFeedbackCopy.append(createNode('p', 'hint-copy', `Hint: ${selectedChallenge.hint}`))
  if (solutionVisible && solution) challengeFeedbackCopy.append(solution)
  challengeFeedback.hidden = false
}

function compareResults(actual, expected, orderMatters) {
  const actualHeaders = actual.columns.map(normalizeColumn)
  const expectedHeaders = expected.columns.map(normalizeColumn)
  if (actualHeaders.length !== expectedHeaders.length) return false
  if (actualHeaders.slice().sort().join('|') !== expectedHeaders.slice().sort().join('|')) return false

  const sortIndexes = (headers) => headers.map((name, index) => ({ name, index }))
    .sort((left, right) => left.name.localeCompare(right.name) || left.index - right.index)
    .map(({ index }) => index)
  const actualOrder = sortIndexes(actualHeaders)
  const expectedOrder = sortIndexes(expectedHeaders)
  const normalizeRows = (rows, order) => rows.map((row) => order.map((index) => normalizeCell(row[index])))
  const actualRows = normalizeRows(actual.rows, actualOrder)
  const expectedRows = normalizeRows(expected.rows, expectedOrder)

  if (actualRows.length !== expectedRows.length) return false
  if (orderMatters) {
    return actualRows.every((row, index) => stableJson(row) === stableJson(expectedRows[index]))
  }

  return actualRows.map(stableJson).sort().every((row, index) => row === expectedRows.map(stableJson).sort()[index])
}

function normalizeColumn(column) {
  return String(column).trim().replace(/[`"[\]]/g, '').toLowerCase()
}

function normalizeCell(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value * 1e8) / 1e8
  return value
}

function stableJson(value) {
  return JSON.stringify(value)
}

function renderResult(result) {
  resultContent.replaceChildren()
  if (!result.rows.length) {
    resultContent.append(createEmptyState('No rows matched', 'The query ran successfully and returned an empty result set.'))
    return
  }
  resultContent.append(renderTable(result))
}

function renderSteps(steps) {
  activeSteps = steps
  activeStepIndex = 0
  stepView.replaceChildren()
  stepsEmpty.hidden = true
  stepView.hidden = false

  const stepper = createNode('div', 'stepper-track')
  stepper.setAttribute('aria-label', 'Logical query steps')
  stepper.setAttribute('role', 'list')
  steps.forEach((step, index) => {
    const button = createNode('button', 'stepper-item')
    button.type = 'button'
    button.setAttribute('role', 'listitem')
    button.setAttribute('aria-pressed', String(index === 0))
    button.dataset.stepIndex = String(index)
    button.append(createNode('span', 'stepper-number', String(index + 1).padStart(2, '0')))
    button.append(createNode('span', 'stepper-label', step.title))
    button.addEventListener('click', () => showStep(index))
    stepper.append(button)
  })
  stepView.append(stepper)

  const navigation = createNode('div', 'step-navigation')
  const previousButton = createNode('button', 'button button--quiet', '← Previous')
  previousButton.type = 'button'
  previousButton.dataset.stepControl = 'previous'
  previousButton.addEventListener('click', () => showStep(Math.max(0, activeStepIndex - 1)))
  const stepPosition = createNode('p', 'step-position')
  stepPosition.setAttribute('aria-live', 'polite')
  const autoplayButton = createNode('button', 'button button--quiet', '▶ Auto-play')
  autoplayButton.type = 'button'
  autoplayButton.dataset.stepControl = 'autoplay'
  autoplayButton.addEventListener('click', toggleAutoplay)
  const nextButton = createNode('button', 'button button--quiet', 'Next →')
  nextButton.type = 'button'
  nextButton.dataset.stepControl = 'next'
  nextButton.addEventListener('click', () => showStep(Math.min(activeSteps.length - 1, activeStepIndex + 1)))
  navigation.append(previousButton, stepPosition, autoplayButton, nextButton)
  stepView.append(navigation)
  const detail = createNode('article', 'step-detail')
  detail.setAttribute('aria-live', 'polite')
  detail.id = 'step-detail'
  stepView.append(detail)
  showStep(0)
}

function showStep(index) {
  if (!activeSteps.length) return
  activeStepIndex = Math.max(0, Math.min(index, activeSteps.length - 1))
  const step = activeSteps[activeStepIndex]

  document.querySelectorAll('.stepper-item').forEach((button, buttonIndex) => {
    const active = buttonIndex === activeStepIndex
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  })
  const previous = $('[data-step-control="previous"]')
  const next = $('[data-step-control="next"]')
  if (previous) previous.disabled = activeStepIndex === 0
  if (next) next.disabled = activeStepIndex === activeSteps.length - 1
  const position = $('.step-position')
  if (position) position.textContent = `Step ${activeStepIndex + 1} of ${activeSteps.length}`

  const detail = $('#step-detail')
  detail.replaceChildren()
  const header = createNode('div', 'step-detail-header')
  const titleGroup = createNode('div', '')
  titleGroup.append(createNode('p', 'eyebrow eyebrow--small', `LOGICAL STEP ${String(activeStepIndex + 1).padStart(2, '0')}`))
  titleGroup.append(createNode('h3', '', step.title))
  header.append(titleGroup)
  const rowCounts = createNode('div', 'row-counts')
  const inputCount = step.filterInput?.totalRows ?? step.input?.totalRows
  const outputCount = step.result.totalRows
  if (inputCount !== undefined) {
    rowCounts.append(createNode('span', 'count-chip', `${inputCount} in`))
    rowCounts.append(createNode('span', 'count-arrow', '→'))
  }
  rowCounts.append(createNode('span', 'count-chip count-chip--accent', `${outputCount} ${outputCount === 1 ? 'row' : 'rows'} out`))
  header.append(rowCounts)
  detail.append(header, createNode('p', 'step-explanation', step.description))

  if (step.kind === 'window') renderWindowVisual(detail, step)
  else if (step.kind === 'hierarchy') renderHierarchyVisual(detail, step)
  else if (step.kind === 'sandbox-write') renderSandboxWriteVisual(detail, step)
  else if (step.kind === 'sandbox-schema') renderSandboxSchemaVisual(detail, step)
  else if (step.kind === 'sandbox-transaction') renderSandboxTransactionVisual(detail, step)
  else if (step.kind === 'sandbox-error') renderSandboxErrorVisual(detail, step)
  else if (step.kind === 'join') renderJoinVisual(detail, step)
  else if (step.kind === 'subquery') renderSubqueryVisual(detail, step)
  else if (step.kind === 'groups') renderGroupVisual(detail, step)
  else if (step.id === 'where') renderWhereVisual(detail, step)
  else if (step.id === 'having') renderHavingVisual(detail, step)
  else if (step.kind === 'order') renderOrderVisual(detail, step)
  else if (step.kind === 'limit') renderLimitVisual(detail, step)
  else if (step.id === 'select') renderProjectionVisual(detail, step)
  else renderStandardVisual(detail, step)

  const sqlNote = createNode('details', 'step-sql')
  const sqlSummary = createNode('summary', '', 'SQL used for this stage')
  const sqlBlock = createNode('pre', 'step-sql-code')
  sqlBlock.append(createNode('code', '', step.sql))
  sqlNote.append(sqlSummary, sqlBlock)
  detail.append(sqlNote)
}

function renderWindowVisual(parent, step) {
  parent.append(createNode('h4', 'visual-subheading', 'Window functions and their specification'))
  const cards = createNode('div', 'window-function-list')
  ;(step.functions || []).forEach((item) => {
    const card = createNode('article', 'window-function-card')
    card.append(createNode('strong', '', `${item.name}${item.alias ? ` → ${item.alias}` : ''}`))
    card.append(createNode('span', '', item.specificationName ? `Named window: ${item.specificationName}` : 'Inline window specification'))
    if (item.partition?.length) card.append(createNode('span', '', `PARTITION BY ${item.partition.join(', ')}`))
    if (item.order) card.append(createNode('span', '', `ORDER BY ${item.order}`))
    if (item.frame) card.append(createNode('span', '', `Frame: ${item.frame}`))
    cards.append(card)
  })
  parent.append(cards)
  parent.append(createNode('h4', 'visual-subheading', 'Rows inside each partition'))
  parent.append(createNode('p', 'visual-caption', 'The same partition is evaluated as a group, while every original row remains in the output. The final columns show the window values the engine calculated.'))
  ;(step.partitions || []).forEach((partition, index) => {
    const details = createNode('details', 'window-partition')
    details.open = index === 0
    details.append(createNode('summary', '', `${partition.label} · ${partition.rows.length} ${partition.rows.length === 1 ? 'row' : 'rows'}`))
    const result = { columns: step.result.columns, rows: partition.rows, totalRows: partition.rows.length }
    details.append(renderTable(result, { rowLimit: 40, numbered: true, selectedColumns: (step.functions || []).map((item) => item.alias).filter(Boolean) }))
    parent.append(details)
  })
  if (!(step.partitions || []).length) parent.append(renderTable(step.result, { rowLimit: 40, numbered: true }))
}

function renderHierarchyVisual(parent, step) {
  parent.append(createNode('h4', 'visual-subheading', 'Recursive levels'))
  parent.append(createNode('p', 'visual-caption', `The recursive member follows ${step.parentColumn} to build levels. ${step.depthColumn} identifies each pass through the hierarchy.`))
  const levels = createNode('div', 'hierarchy-levels')
  step.levels.forEach((level) => {
    const card = createNode('section', 'hierarchy-level')
    card.dataset.depth = String(Math.min(level.depth, 3))
    card.append(createNode('h4', '', `Level ${level.depth} · ${level.rows.length} ${level.rows.length === 1 ? 'row' : 'rows'}`))
    card.append(renderTable({ columns: step.result.columns, rows: level.rows, totalRows: level.rows.length }, { compact: true, rowLimit: 40 }))
    levels.append(card)
  })
  parent.append(levels)
}

function renderSubqueryVisual(parent, step) {
  parent.append(createNode('h4', 'visual-subheading', 'Follow the inner query one outer row at a time'))
  parent.append(createNode('p', 'visual-caption', 'A correlated subquery can read values from the current outer row. The inner result is calculated for that row, then the outer WHERE condition decides whether the row stays.'))
  const executions = step.executions || []
  const result = renderTable(step.result, {
    rowLimit: 40,
    numbered: false,
    rowStatus: (index) => executions[index]?.passed,
    statusKept: 'Kept by WHERE',
    statusRemoved: 'Filtered out',
    reason: 'The outer comparison is false or UNKNOWN',
  })
  parent.append(result)

  const examples = executions.slice(0, 6)
  if (examples.length) {
    parent.append(createNode('h4', 'visual-subheading', 'Example inner-query runs'))
    const list = createNode('div', 'subquery-execution-list')
    examples.forEach((execution) => {
      const details = createNode('details', 'subquery-execution')
      details.open = execution.rowNumber === 1
      const correlations = execution.referenceValues
        .filter((item) => item.label.includes('.'))
        .map((item) => `${item.label} = ${item.value === null ? 'NULL' : String(item.value)}`)
      const summary = correlations.length
        ? `Outer row ${execution.rowNumber} · ${correlations.join(', ')} · inner result ${execution.scalarValue === null ? 'NULL' : String(execution.scalarValue)}`
        : `Outer row ${execution.rowNumber} · inner result ${execution.scalarValue === null ? 'NULL' : String(execution.scalarValue)}`
      details.append(createNode('summary', '', summary))
      details.append(createNode('p', 'visual-caption', `${execution.conditionText}.`))
      const code = createNode('pre', 'step-sql-code')
      code.append(createNode('code', '', execution.innerSql))
      details.append(code)
      list.append(details)
    })
    parent.append(list)
  }

  if (step.capped) {
    parent.append(createNode('p', 'table-overflow-note', `To keep the explanation responsive, the inner query is expanded for the first ${executions.length} outer rows. The final query result is available separately.`))
  }
}

function renderSandboxWriteVisual(parent, step) {
  parent.append(createNode('h4', 'visual-subheading', `${step.statement.type.toUpperCase()} · ${step.statement.affectedRows || 0} rows affected`))
  if (!step.before && !step.after) {
    parent.append(createNode('p', 'visual-caption', 'The statement changed the schema or did not target a regular table. Inspect the statement result for details.'))
    return
  }
  parent.append(createNode('p', 'visual-caption', 'Row identity comes from SQLite rowid, so duplicate values stay distinct in this before-and-after comparison.'))
  parent.append(renderDiffTable(step.before, step.after))
}

function renderSandboxSchemaVisual(parent, step) {
  parent.append(createNode('h4', 'visual-subheading', 'Schema before and after'))
  parent.append(createNode('p', 'visual-caption', 'Green entries were added, red entries were removed, and neutral entries remain.'))
  parent.append(renderSchemaDiff(step.schemaBefore || [], step.schemaAfter || []))
}

function renderSandboxTransactionVisual(parent, step) {
  const active = Boolean(step.statement.transaction?.active)
  parent.append(createNode('h4', 'visual-subheading', active ? 'Changes are pending' : 'Transaction state after this statement'))
  parent.append(createNode('p', 'visual-caption', active
    ? 'These writes are visible in the sandbox connection but are not committed. ROLLBACK restores the earlier table state.'
    : 'The transaction control statement ended the pending transaction. Compare the table snapshots to see what remained.'))
  const before = step.statement.databaseBefore || {}
  const after = step.statement.databaseAfter || {}
  const names = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  if (!names.length && (step.before || step.after)) parent.append(renderDiffTable(step.before, step.after))
  names.forEach((name, index) => {
    const details = createNode('details', 'window-partition')
    details.open = index === 0
    details.append(createNode('summary', '', `${name} · transaction snapshot`))
    details.append(renderDiffTable(before[name], after[name]))
    parent.append(details)
  })
}

function renderSandboxErrorVisual(parent, step) {
  parent.append(createNode('p', 'script-error', step.statement.error || 'This statement failed and did not complete.'))
  if (step.statement.note) parent.append(createNode('p', 'visual-caption', step.statement.note))
  if (step.before || step.after) parent.append(renderDiffTable(step.before, step.after))
}

function renderDiffTable(before, after) {
  const wrapper = createNode('div', 'data-table-wrap')
  const oldRows = before?.rows || []
  const newRows = after?.rows || []
  const columns = after?.columns?.length ? after.columns : before?.columns || []
  if (!columns.length) {
    wrapper.append(createNode('p', 'empty-inline', 'There are no table rows to compare.'))
    return wrapper
  }
  const oldIds = before?.rowIds || oldRows.map((_row, index) => `old-${index}`)
  const newIds = after?.rowIds || newRows.map((_row, index) => `new-${index}`)
  const oldIndex = new Map(oldIds.map((id, index) => [String(id), index]))
  const newIndex = new Map(newIds.map((id, index) => [String(id), index]))
  const identities = [...oldIds.map(String), ...newIds.map(String).filter((id) => !oldIndex.has(id))]
  const table = createNode('table', 'data-table')
  const head = createNode('thead')
  const header = createNode('tr')
  header.append(createNode('th', '', 'Change'))
  columns.forEach((column) => header.append(createNode('th', '', column)))
  head.append(header)
  const body = createNode('tbody')
  identities.slice(0, 100).forEach((identity) => {
    const oldRowIndex = oldIndex.get(identity)
    const newRowIndex = newIndex.get(identity)
    const oldRow = oldRowIndex === undefined ? null : oldRows[oldRowIndex]
    const newRow = newRowIndex === undefined ? null : newRows[newRowIndex]
    const changed = oldRow && newRow && oldRow.some((value, index) => stableJson(value) !== stableJson(newRow[index]))
    const row = createNode('tr', changed ? 'row-updated' : !oldRow ? 'row-inserted' : !newRow ? 'row-deleted' : 'row-unchanged')
    row.append(createNode('td', 'row-status-cell', !oldRow ? 'Inserted' : !newRow ? 'Deleted' : changed ? 'Updated' : 'Unchanged'))
    columns.forEach((_column, columnIndex) => {
      const cell = createNode('td')
      if (changed && stableJson(oldRow[columnIndex]) !== stableJson(newRow[columnIndex])) {
        const oldValue = createNode('span', 'diff-before')
        appendValue(oldValue, oldRow[columnIndex])
        const newValue = createNode('span', 'diff-after')
        appendValue(newValue, newRow[columnIndex])
        cell.append(oldValue, createNode('span', 'diff-arrow', ' → '), newValue)
      } else appendValue(cell, newRow ? newRow[columnIndex] : oldRow[columnIndex])
      row.append(cell)
    })
    body.append(row)
  })
  table.append(head, body)
  wrapper.append(table)
  const total = Math.max(before?.totalRows || 0, after?.totalRows || 0)
  if (identities.length > 100 || before?.truncated || after?.truncated) wrapper.append(createNode('p', 'table-overflow-note', `Showing ${Math.min(identities.length, 100)} of up to ${total} rows.`))
  return wrapper
}

function renderSchemaDiff(before, after) {
  const list = createNode('div', 'schema-change-list')
  const oldTables = new Map(before.map((table) => [table.name, table]))
  const newTables = new Map(after.map((table) => [table.name, table]))
  const names = [...new Set([...oldTables.keys(), ...newTables.keys()])].sort()
  names.forEach((name) => {
    const oldTable = oldTables.get(name)
    const newTable = newTables.get(name)
    if (!oldTable) {
      list.append(createNode('span', 'schema-change-chip is-added', `+ ${newTable.type} ${name}`))
      newTable.columns.forEach((column) => list.append(createNode('span', 'schema-change-chip is-added', `+ ${name}.${column.name} ${column.type}`)))
    } else if (!newTable) {
      list.append(createNode('span', 'schema-change-chip is-removed', `− ${oldTable.type} ${name}`))
      oldTable.columns.forEach((column) => list.append(createNode('span', 'schema-change-chip is-removed', `− ${name}.${column.name} ${column.type}`)))
    }
    else {
      if (oldTable.type !== newTable.type) {
        list.append(createNode('span', 'schema-change-chip', `~ ${name}: ${oldTable.type} → ${newTable.type}`))
        return
      }
      const oldColumns = new Map(oldTable.columns.map((column) => [column.name, column.type]))
      const newColumns = new Map(newTable.columns.map((column) => [column.name, column.type]))
      ;[...new Set([...oldColumns.keys(), ...newColumns.keys()])].sort().forEach((column) => {
        const oldType = oldColumns.get(column)
        const newType = newColumns.get(column)
        if (oldType === undefined) list.append(createNode('span', 'schema-change-chip is-added', `+ ${name}.${column} ${newType}`))
        else if (newType === undefined) list.append(createNode('span', 'schema-change-chip is-removed', `− ${name}.${column}`))
        else if (oldType !== newType) list.append(createNode('span', 'schema-change-chip', `~ ${name}.${column} ${oldType} → ${newType}`))
      })
    }
  })
  if (!names.length) list.append(createNode('span', 'empty-inline', 'No tables are present.'))
  return list
}

function renderWhereVisual(parent, step) {
  const input = step.filterInput || step.input
  parent.append(createNode('h4', 'visual-subheading', 'Rows checked by WHERE'))
  parent.append(createNode('p', 'visual-caption', '✓ Kept rows match the condition. × Removed rows did not match it.'))
  parent.append(renderTable(input, {
    rowStatus: (index) => Boolean(step.filterFlags?.[index]),
    statusKept: 'Kept',
    statusRemoved: 'Filtered out',
    reason: `Does not match: ${step.filterReason}`,
  }))
}

function renderJoinVisual(parent, step) {
  const input = step.input || { columns: [], rows: [], totalRows: 0 }
  const comparison = createNode('div', 'join-comparison')
  const left = createNode('section', 'comparison-card')
  left.append(createNode('div', 'comparison-heading', 'Left-side rows'))
  left.append(renderTable(input, { compact: true, rowLimit: 20 }))
  const right = createNode('section', 'comparison-card')
  right.append(createNode('div', 'comparison-heading', `${step.joinTable} join source`))
  right.append(renderTable(step.joinRight || { columns: [], rows: [], totalRows: 0 }, { compact: true, rowLimit: 8 }))
  comparison.append(left, createNode('div', 'join-connector', '↔'), right)
  parent.append(createNode('h4', 'visual-subheading', 'Match related records'))
  parent.append(comparison)

  const output = createNode('section', 'join-output')
  output.append(createNode('div', 'comparison-heading', `${step.joinType} JOIN result · ${step.result.totalRows} rows`))
  const leftColumns = input.columns.length
  output.append(renderTable(step.result, {
    rowLimit: 40,
    rowStatus: (index) => {
      const rightValues = step.result.rows[index]?.slice(leftColumns) || []
      return rightValues.some((value) => value !== null) ? true : false
    },
    statusKept: 'Matched',
    statusRemoved: 'No right match',
    showStatus: step.joinType.toUpperCase().includes('LEFT') || step.joinType.toUpperCase().includes('RIGHT'),
  }))
  parent.append(output)
}

function renderGroupVisual(parent, step) {
  parent.append(createNode('h4', 'visual-subheading', 'Rows collected into groups'))
  const groupGrid = createNode('div', 'group-grid')
  if (!step.buckets.length) {
    groupGrid.append(createNode('p', 'empty-inline', 'No groups were created from these rows.'))
  }
  step.buckets.slice(0, 40).forEach((bucket, index) => {
    const card = createNode('article', 'group-card')
    const cardHead = createNode('div', 'group-card-head')
    cardHead.append(createNode('span', 'group-number', `Group ${index + 1}`))
    cardHead.append(createNode('span', 'group-size', `${bucket.count} ${bucket.count === 1 ? 'row' : 'rows'}`))
    card.append(cardHead)
    bucket.keys.forEach((value, keyIndex) => {
      const key = createNode('p', 'group-key')
      key.append(createNode('span', 'group-key-label', `${bucket.labels[keyIndex]} = `))
      appendValue(key, value)
      card.append(key)
    })
    groupGrid.append(card)
  })
  parent.append(groupGrid)
  parent.append(createNode('p', 'visual-caption', `${step.buckets.length} groups were formed from ${step.input?.totalRows ?? 0} incoming rows.`))
}

function renderHavingVisual(parent, step) {
  const input = step.filterInput || step.input
  parent.append(createNode('h4', 'visual-subheading', 'Groups before and after HAVING'))
  parent.append(createNode('p', 'visual-caption', `Groups marked “Filtered out” did not pass: ${step.filterReason}`))
  parent.append(renderTable(input, {
    rowStatus: (_index, row) => rowAppearsIn(row, step.result.rows),
    statusKept: 'Kept group',
    statusRemoved: 'Filtered out',
    reason: `Group did not match: ${step.filterReason}`,
  }))
  if (step.groupBuckets?.length) {
    const badges = createNode('div', 'group-status-list')
    step.groupBuckets.forEach((bucket) => {
      const badge = createNode('span', `group-status ${bucket.kept ? 'is-kept' : 'is-removed'}`)
      badge.append(createNode('span', 'status-symbol', bucket.kept ? '✓' : '×'))
      bucket.keys.forEach((value, index) => {
        if (index) badge.append(createNode('span', 'group-key-separator', '·'))
        appendValue(badge, value)
      })
      badge.append(createNode('small', '', bucket.kept ? 'kept' : 'removed'))
      badges.append(badge)
    })
    parent.append(badges)
  }
}

function renderProjectionVisual(parent, step) {
  if (!step.input) {
    renderStandardVisual(parent, step)
    return
  }
  const comparison = createNode('div', 'projection-comparison')
  const source = createNode('section', 'comparison-card')
  source.append(createNode('div', 'comparison-heading', 'Available input columns'))
  source.append(renderTable(step.input, {
    compact: true,
    rowLimit: 12,
    selectedColumns: step.selectedColumns,
  }))
  const output = createNode('section', 'comparison-card')
  output.append(createNode('div', 'comparison-heading', 'Selected output columns'))
  output.append(renderTable(step.result, { compact: true, rowLimit: 12 }))
  comparison.append(source, createNode('div', 'projection-arrow', '→'), output)
  parent.append(createNode('h4', 'visual-subheading', 'Projection'))
  parent.append(comparison)
}

function renderOrderVisual(parent, step) {
  const input = step.input
  parent.append(createNode('h4', 'visual-subheading', 'Rows in their sorted order'))
  parent.append(createNode('p', 'visual-caption', 'The arrows show the requested sort direction. Row positions now follow ORDER BY.'))
  const directions = step.description.match(/\b(?:ASC|DESC)\b/gi) || []
  const direction = directions[0]?.toUpperCase() === 'DESC' ? '↓ DESC' : '↑ ASC'
  parent.append(createNode('div', 'sort-direction', `${direction} · ${step.result.totalRows} rows`))
  parent.append(renderTable(step.result, { rowLimit: 40, numbered: true }))
  if (input && step.result.rows.length === 0) parent.append(createNode('p', 'empty-inline', 'There were no rows to sort.'))
}

function renderLimitVisual(parent, step) {
  const input = step.filterInput || step.input
  const retainedKeys = countRows(step.result.rows)
  const flags = input.rows.map((row) => {
    const key = stableJson(row)
    const remaining = retainedKeys.get(key) || 0
    if (remaining > 0) {
      retainedKeys.set(key, remaining - 1)
      return true
    }
    return false
  })
  parent.append(createNode('h4', 'visual-subheading', 'The cutoff line'))
  parent.append(createNode('p', 'visual-caption', `${step.result.totalRows} rows are kept; ${Math.max(0, input.totalRows - step.result.totalRows)} rows fall after the LIMIT.`))
  parent.append(renderTable(input, {
    rowStatus: (index) => flags[index],
    statusKept: 'Included',
    statusRemoved: 'After cutoff',
    reason: 'Outside the row limit',
    cutoffAfter: flags.lastIndexOf(true),
    showCutoff: input.rows.length > step.result.rows.length,
  }))
}

function renderStandardVisual(parent, step) {
  if (step.kind === 'order') return renderOrderVisual(parent, step)
  if (!step.result.rows.length) {
    parent.append(createEmptyState('No rows at this step', 'The query is valid, but no rows remain after the previous clauses.'))
  } else {
    parent.append(renderTable(step.result, { rowLimit: 40 }))
  }
}

function renderTable(result, options = {}) {
  const wrapper = createNode('div', `data-table-wrap${options.compact ? ' data-table-wrap--compact' : ''}`)
  if (!result || !result.columns?.length) {
    wrapper.append(createNode('p', 'empty-inline', 'No columns to display.'))
    return wrapper
  }

  const limit = Math.max(1, options.rowLimit || 100)
  const rows = (result.rows || []).slice(0, limit)
  const table = createNode('table', 'data-table')
  const head = createNode('thead')
  const heading = createNode('tr')
  if (options.showStatus || options.rowStatus) heading.append(createNode('th', 'row-status-heading', 'Row status'))
  if (options.numbered) heading.append(createNode('th', 'row-number-heading', '#'))
  result.columns.forEach((column) => {
    const cell = createNode('th', '', column)
    if (options.selectedColumns && options.selectedColumns.length) {
      const normalized = normalizeColumn(column)
      const isSelected = options.selectedColumns.some((name) => name === normalized || normalized.endsWith(`.${name}`))
      if (!isSelected) cell.classList.add('column-muted')
    }
    heading.append(cell)
  })
  head.append(heading)

  const body = createNode('tbody')
  rows.forEach((row, index) => {
    const tr = createNode('tr')
    const kept = options.rowStatus ? options.rowStatus(index, row) : null
    if (options.showStatus || options.rowStatus) {
      const statusCell = createNode('td', `row-status-cell ${kept ? 'row-is-kept' : kept === false ? 'row-is-removed' : ''}`)
      if (kept === true) statusCell.append(createNode('span', 'status-symbol', '✓'), createNode('span', '', options.statusKept || 'Kept'))
      else if (kept === false) {
        statusCell.append(createNode('span', 'status-symbol', '×'), createNode('span', '', options.statusRemoved || 'Removed'))
        if (options.reason) statusCell.append(createNode('small', 'reason-tag', options.reason))
      } else statusCell.append(createNode('span', '', '—'))
      tr.append(statusCell)
      if (kept === false) tr.classList.add('row-filtered')
      if (kept === true) tr.classList.add('row-retained')
    }
    if (options.numbered) tr.append(createNode('td', 'row-index', String(index + 1)))
    row.forEach((value, columnIndex) => {
      const cell = createNode('td')
      if (options.selectedColumns && options.selectedColumns.length) {
        const normalized = normalizeColumn(result.columns[columnIndex])
        const isSelected = options.selectedColumns.some((name) => name === normalized || normalized.endsWith(`.${name}`))
        if (!isSelected) cell.classList.add('column-muted')
      }
      appendValue(cell, value)
      tr.append(cell)
    })
    body.append(tr)
    if (options.showCutoff && index === options.cutoffAfter) {
      const cutoff = createNode('tr', 'cutoff-row')
      const cell = createNode('td', '', 'LIMIT cutoff')
      cell.colSpan = heading.children.length
      cutoff.append(cell)
      body.append(cutoff)
    }
  })
  table.append(head, body)
  wrapper.append(table)

  const total = result.totalRows ?? result.rows?.length ?? 0
  if (total > rows.length || result.truncated) {
    wrapper.append(createNode('p', 'table-overflow-note', `Showing ${rows.length} of ${total} rows.`))
  }
  return wrapper
}

function appendValue(parent, value) {
  if (value === null || value === undefined) {
    const nullValue = createNode('span', 'null-value', 'NULL')
    nullValue.setAttribute('aria-label', 'NULL value')
    parent.append(nullValue)
  } else if (typeof value === 'number') {
    parent.append(createNode('span', 'numeric-value', Number.isInteger(value) ? String(value) : value.toLocaleString(undefined, { maximumFractionDigits: 4 })))
  } else {
    parent.append(document.createTextNode(String(value)))
  }
}

function renderStepUnavailable(message) {
  activeSteps = []
  stepView.hidden = true
  stepView.replaceChildren()
  stepsEmpty.hidden = false
  stepsEmpty.replaceChildren(
    createNode('span', 'empty-icon', '⌁'),
    createNode('h3', '', 'Step view not available'),
    createNode('p', '', message),
  )
}

function createEmptyState(title, description) {
  const state = createNode('div', 'empty-state')
  state.append(createNode('span', 'empty-icon', '▤'))
  state.append(createNode('h3', '', title))
  state.append(createNode('p', '', description))
  return state
}

function createNode(tagName, className = '', text = '') {
  const node = document.createElement(tagName)
  if (className) node.className = className
  if (text !== undefined && text !== null) node.textContent = text
  return node
}

function setQueryMessage(message, tone = 'neutral') {
  queryMessage.textContent = message
  queryMessage.dataset.tone = tone
}

function showFatalError(message) {
  engineReady = false
  setQueryMessage(message, 'error')
  runButton.disabled = true
  runButton.hidden = false
  cancelButton.hidden = true
  checkChallengeButton.disabled = true
  retryButton.hidden = false
  schemaTables.replaceChildren(createNode('p', 'loading-copy', 'The sample database is not available.'))
}

function markEditorError(lineIndex) {
  if (!editor) {
    codeEditor.markError()
    return
  }
  const line = Math.max(0, Math.min(lineIndex, editor.lineCount() - 1))
  markedErrorLine = line
  editor.addLineClass(line, 'background', 'cm-error-line')
  const marker = createNode('span', 'error-marker', '●')
  marker.title = 'Query error on this line'
  editor.setGutterMarker(line, 'error-gutter', marker)
  editor.scrollIntoView({ line, ch: 0 }, 100)
}

function clearEditorError() {
  if (editor && markedErrorLine !== null) {
    editor.removeLineClass(markedErrorLine, 'background', 'cm-error-line')
    editor.setGutterMarker(markedErrorLine, 'error-gutter', null)
  } else if (!editor) {
    editorTextarea.removeAttribute('aria-invalid')
  }
  markedErrorLine = null
}

function toggleAutoplay() {
  if (autoplayTimer) {
    stopAutoplay()
    return
  }
  const button = $('[data-step-control="autoplay"]')
  if (!button || activeSteps.length < 2) return
  button.textContent = 'Ⅱ Pause'
  autoplayTimer = window.setInterval(() => {
    if (activeStepIndex >= activeSteps.length - 1) {
      stopAutoplay()
      return
    }
    showStep(activeStepIndex + 1)
  }, 1500)
}

function stopAutoplay() {
  if (autoplayTimer) window.clearInterval(autoplayTimer)
  autoplayTimer = null
  const button = $('[data-step-control="autoplay"]')
  if (button) button.textContent = '▶ Auto-play'
}

function rowAppearsIn(row, candidates) {
  const counts = countRows(candidates)
  const key = stableJson(row)
  const remaining = counts.get(key) || 0
  if (remaining <= 0) return false
  counts.set(key, remaining - 1)
  return true
}

function countRows(rows) {
  const counts = new Map()
  for (const row of rows || []) {
    const key = stableJson(row)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}
