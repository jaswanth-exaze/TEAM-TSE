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
const outputPanel = $('.output-panel')
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
  'subquery-department-in': `SELECT id, name, department_id
FROM employees
WHERE department_id IN (
  SELECT id
  FROM departments
  WHERE location = 'Hyderabad'
);`,
  'subquery-orders-in': `SELECT id, name
FROM employees
WHERE id IN (
  SELECT employee_id
  FROM orders
  WHERE amount > 10000
);`,
  'subquery-department-average': `SELECT e.id, e.name, e.department_id, e.salary
FROM employees e
WHERE e.department_id IS NOT NULL
  AND e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.department_id = e.department_id
  );`,
  'subquery-correlated-average': `SELECT name, salary
FROM employees e1
WHERE salary > (
  SELECT AVG(salary)
  FROM employees e2
  WHERE e2.department_id = e1.department_id
);`,
  'subquery-exists-completed': `SELECT e.id, e.name
FROM employees e
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.employee_id = e.id
    AND o.status = 'completed'
);`,
  'subquery-not-exists-orders': `SELECT e.id, e.name
FROM employees e
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.employee_id = e.id
);`,
  'subquery-exists-above-average': `SELECT e.id, e.name
FROM employees e
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.employee_id = e.id
    AND o.amount > (
      SELECT AVG(o2.amount)
      FROM orders o2
      WHERE o2.employee_id = e.id
    )
);`,
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
let activeSubqueryExecutionIndex = 0
let activeWhereExecutionIndex = 0
let lastQuerySql = ''
let activeSql = ''
let activeSegments = []
let activePlanIsSandbox = false
let activePlanHasGroups = false
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
  if (!isSteps && outputPanel.classList.contains('is-focused')) setWalkthroughFocus(false)
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
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && outputPanel.classList.contains('is-focused') && !document.fullscreenElement && !document.querySelector('dialog[open]')) {
      setWalkthroughFocus(false)
    }
  })
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === outputPanel) {
      outputPanel.classList.add('uses-native-fullscreen')
      updateWalkthroughFocusState(true)
    } else if (outputPanel.classList.contains('uses-native-fullscreen')) {
      outputPanel.classList.remove('uses-native-fullscreen')
      updateWalkthroughFocusState(false)
    }
  })
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
      const isSubquery = event.target.value.startsWith('subquery-')
      setQueryMessage(isSubquery
        ? 'Guided subquery loaded. Run it to see the inner query and row-by-row decisions.'
        : 'Example loaded. Run it to see the intermediate data.', 'neutral')
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
  lastQuerySql = sql
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
      activateTab(stepPlan.available ? 'steps' : 'result')
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
        ? 'Query complete. Follow the walkthrough, then open Results to see the final rows.'
        : 'Query complete. The final result is ready; this query has no step breakdown.',
      stepPlan.available ? 'success' : 'warning',
    )

    if (stepPlan.available) {
      renderSteps(stepPlan.steps)
    } else {
      renderStepUnavailable(stepPlan.reason || 'Step view not available for this query yet. The final result is still shown.')
    }
    activateTab(stepPlan.available ? 'steps' : 'result')

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

// ---------------------------------------------------------------------------
// How it works: color-coded clauses, plain-English story, and row-flow helpers
// ---------------------------------------------------------------------------
const CLAUSE_CLASS = { FROM: 'from', JOIN: 'join', WHERE: 'where', 'GROUP BY': 'group', HAVING: 'having', SELECT: 'select', 'ORDER BY': 'order', LIMIT: 'limit' }
const CLAUSE_RUN_ORDER = ['FROM', 'JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY', 'LIMIT']

function clauseClass(key) {
  return key && CLAUSE_CLASS[key] ? ` clause--${CLAUSE_CLASS[key]}` : ''
}

function isSubqueryStep(step) {
  const kind = String(step?.kind || '')
  return kind === 'subquery' || kind.startsWith('subquery-')
}

// Which SQL clause a stage belongs to (used for color and for highlighting the SQL).
function clauseKeyForStep(step) {
  const id = String(step.id || '')
  const kind = String(step.kind || '')
  if (id === 'from') return 'FROM'
  if (kind === 'join' || id.startsWith('join-')) return 'JOIN'
  if (id === 'where' || isSubqueryStep(step)) return 'WHERE'
  if (kind === 'groups') return 'GROUP BY'
  if (id === 'having') return 'HAVING'
  if (id === 'aggregate' || id === 'select' || id === 'distinct') return 'SELECT'
  if (kind === 'order') return 'ORDER BY'
  if (kind === 'limit') return 'LIMIT'
  if (kind === 'window') return 'SELECT'
  return ''
}

// Short label shown on stage chips and in the story list.
function stageTag(step) {
  const id = String(step.id || '')
  if (id === 'from') return String(step.title || '').replace(/^Start with\s+/i, 'FROM ')
  if (id === 'aggregate') return 'AGGREGATE'
  if (id === 'distinct') return 'DISTINCT'
  if (step.kind === 'subquery') return 'ADD COLUMN'
  if (isSubqueryStep(step)) return 'SUBQUERY'
  if (step.kind === 'window') return step.windowPhase === 'input' ? 'WINDOW INPUT' : step.windowPhase === 'partition' ? 'PARTITION BY' : 'RANK'
  if (step.kind === 'hierarchy') return step.hierarchyPhase === 'anchor' ? 'ANCHOR' : step.hierarchyPhase === 'recursive' ? `PASS ${step.activeLevel?.depth}` : step.hierarchyPhase === 'stop' ? 'STOP' : step.hierarchyPhase === 'final' ? 'FINAL SELECT' : 'HIERARCHY'
  return step.title
}

function stepPlainText(step) {
  return step.plain || step.description || ''
}

function countLabel(value, unit) {
  return `${value} ${unit}${value === 1 ? '' : 's'}`
}

function stageCounts(step) {
  return { input: step.filterInput?.totalRows ?? step.input?.totalRows, output: step.result?.totalRows }
}

// The unit a stage counts: groups after GROUP BY, rows everywhere else.
function stageUnit(step) {
  if (step.kind === 'groups') return 'group'
  if (activePlanHasGroups && (step.id === 'aggregate' || step.id === 'having')) return 'group'
  return 'row'
}

// Split SQL into top-level clause segments (ignores text inside parentheses, strings and comments).
function segmentSqlByClause(sql) {
  const text = String(sql || '')
  const marks = []
  let depth = 0
  let quote = ''
  let lineComment = false
  let blockComment = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const next = text[i + 1]
    if (lineComment) { if (ch === '\n') lineComment = false; continue }
    if (blockComment) { if (ch === '*' && next === '/') { blockComment = false; i += 1 } continue }
    if (quote) {
      if (ch === quote) { if (next === quote) i += 1; else quote = '' } else if (ch === '\\') i += 1
      continue
    }
    if ((ch === '-' && next === '-') || ch === '#') { lineComment = true; continue }
    if (ch === '/' && next === '*') { blockComment = true; i += 1; continue }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue }
    if (ch === '(') { depth += 1; continue }
    if (ch === ')') { depth = Math.max(0, depth - 1); continue }
    if (depth !== 0 || !/[A-Za-z]/.test(ch) || (i > 0 && /[\w$]/.test(text[i - 1]))) continue
    const match = text.slice(i).match(/^(SELECT|FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|(?:(?:INNER|LEFT|RIGHT|FULL|CROSS|NATURAL)\s+(?:OUTER\s+)?)?JOIN)\b/i)
    if (match) {
      const word = match[1].toUpperCase().replace(/\s+/g, ' ')
      marks.push({ index: i, key: word.endsWith('JOIN') ? 'JOIN' : word })
      i += match[1].length - 1
    }
  }
  if (!marks.length) return [{ key: '', text }]
  const segments = []
  if (marks[0].index > 0) segments.push({ key: '', text: text.slice(0, marks[0].index) })
  marks.forEach((mark, position) => {
    const end = position + 1 < marks.length ? marks[position + 1].index : text.length
    segments.push({ key: mark.key, text: text.slice(mark.index, end) })
  })
  return segments
}

function describeComplexity(steps) {
  let score = 0
  steps.forEach((step) => {
    const id = String(step.id || '')
    const kind = String(step.kind || '')
    if (kind === 'join' || kind === 'groups' || id === 'aggregate' || id === 'having') score += 1
    else if (isSubqueryStep(step) || kind === 'window' || kind === 'hierarchy') score += 3
  })
  if (score === 0) return { level: 'simple', label: 'Simple query', hint: 'One table with filtering, sorting or limiting.' }
  if (score <= 2) return { level: 'moderate', label: 'Moderate query', hint: 'Adds a join or grouping on top of the basics.' }
  return { level: 'advanced', label: 'Advanced query', hint: 'Combines several of: joins, grouping, HAVING, subqueries and window functions.' }
}

function buildOverviewHeader(steps) {
  const overview = createNode('header', 'walkthrough-overview')
  const copy = createNode('div', 'walkthrough-overview-copy')
  copy.append(createNode('p', 'eyebrow eyebrow--small', 'INTERACTIVE QUERY WALKTHROUGH'))
  const isSubquery = steps.some(isSubqueryStep)
  copy.append(createNode('h2', '', isSubquery ? 'Follow the inner query and the outer rows' : 'Follow the data through every SQL stage'))
  if (activePlanIsSandbox) {
    copy.append(createNode('p', 'walkthrough-overview-description', 'Select a stage to see the rows and decisions at that point in the script.'))
    overview.append(copy)
    return overview
  }
  copy.append(createNode('p', 'walkthrough-overview-description', 'Every stage takes rows in, changes them, and hands them to the next stage. Press Next, use the ← → keys, or hit Auto-play to watch the data flow from the first table to your final result.'))
  overview.append(copy)

  const complexity = describeComplexity(steps)
  const badges = createNode('div', 'overview-badges')
  const level = createNode('span', `overview-badge overview-badge--${complexity.level}`, complexity.label)
  level.title = complexity.hint
  badges.append(level)
  badges.append(createNode('span', 'overview-badge', `${steps.length} ${steps.length === 1 ? 'stage' : 'stages'}`))
  const last = steps[steps.length - 1]
  if (last?.result) badges.append(createNode('span', 'overview-badge', `Final result · ${countLabel(last.result.totalRows, 'row')}`))
  overview.append(badges)
  return overview
}

function buildQueryMap(steps) {
  const map = createNode('pre', 'query-map')
  map.setAttribute('aria-label', 'Your query, color-coded by clause')
  const code = createNode('code')
  let joinCount = 0
  activeSegments.forEach((segment) => {
    const known = segment.key && steps.some((step) => clauseKeyForStep(step) === segment.key)
    if (!known) {
      code.append(document.createTextNode(segment.text))
      return
    }
    const trimmed = segment.text.replace(/\s+$/, '')
    const span = createNode('span', `query-clause${clauseClass(segment.key)}`, trimmed)
    span.dataset.clause = segment.key
    if (segment.key === 'JOIN') {
      joinCount += 1
      span.dataset.occurrence = String(joinCount)
    }
    span.tabIndex = 0
    span.setAttribute('role', 'button')
    span.title = `Jump to ${segment.key}`
    const jump = () => {
      const occurrence = segment.key === 'JOIN' ? Number(span.dataset.occurrence) : 0
      let index = occurrence ? steps.findIndex((step) => step.id === `join-${occurrence}`) : -1
      if (index < 0) index = steps.findIndex((step) => clauseKeyForStep(step) === segment.key)
      if (index >= 0) showStep(index)
    }
    span.addEventListener('click', jump)
    span.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); jump() }
    })
    code.append(span, document.createTextNode(segment.text.slice(trimmed.length)))
  })
  map.append(code)
  return map
}

function buildOrderStrip() {
  const written = []
  activeSegments.forEach((segment) => { if (segment.key && !written.includes(segment.key)) written.push(segment.key) })
  const ran = CLAUSE_RUN_ORDER.filter((key) => written.includes(key))
  if (ran.length < 2) return null
  const strip = createNode('div', 'order-strip')
  const makeRow = (label, keys, numbered) => {
    const row = createNode('div', 'order-row')
    row.append(createNode('span', 'order-row-label', label))
    keys.forEach((key, index) => {
      if (index) row.append(createNode('span', 'order-arrow', '›'))
      const chip = createNode('span', `order-chip${clauseClass(key)}`)
      chip.dataset.clause = key
      if (numbered) chip.append(createNode('b', '', String(index + 1)))
      chip.append(document.createTextNode(key))
      row.append(chip)
    })
    return row
  }
  strip.append(makeRow('You write', written, false), makeRow('SQL runs', ran, true))
  strip.append(createNode('p', 'order-note', 'SQL does not run top to bottom. It builds and filters the rows first, and only then picks columns (SELECT), sorts and limits.'))
  return strip
}

function buildStory(steps) {
  const list = createNode('ol', 'story-list')
  steps.forEach((step, index) => {
    const key = clauseKeyForStep(step)
    const item = createNode('li', `story-item${clauseClass(key)}`)
    item.dataset.stepIndex = String(index)
    const button = createNode('button', 'story-button')
    button.type = 'button'
    button.append(createNode('span', 'story-number', String(index + 1)))
    const copy = createNode('span', 'story-copy')
    copy.append(createNode('span', 'story-tag', stageTag(step)))
    copy.append(createNode('span', 'story-text', stepPlainText(step)))
    button.append(copy)
    button.addEventListener('click', () => showStep(index))
    item.append(button)
    list.append(item)
  })
  return list
}

function buildOverviewCard(steps) {
  if (!steps.some((step) => clauseKeyForStep(step))) return null
  const card = createNode('details', 'overview-card')
  card.open = true
  const summary = createNode('summary')
  summary.append(createNode('span', 'overview-card-title', 'Query overview'))
  summary.append(createNode('span', 'overview-card-sub', 'Your SQL, color-coded, and what each part does in plain English'))
  summary.append(createNode('span', 'overview-card-chevron', '▾'))
  card.append(summary)
  const body = createNode('div', 'overview-body')
  const left = createNode('div', 'overview-column')
  left.append(createNode('p', 'intro-label', 'YOUR QUERY · CLICK A COLOR TO JUMP'), buildQueryMap(steps))
  const strip = buildOrderStrip()
  if (strip) left.append(strip)
  const right = createNode('div', 'overview-column')
  right.append(createNode('p', 'intro-label', 'WHAT HAPPENS · IN ORDER'), buildStory(steps))
  body.append(left, right)
  card.append(body)
  return card
}

function syncOverviewHighlight() {
  const step = activeSteps[activeStepIndex]
  if (!step) return
  const key = clauseKeyForStep(step)
  const map = stepView.querySelector('.query-map')
  map?.classList.toggle('has-active', Boolean(key))
  const joinMatch = /^join-(\d+)$/.exec(String(step.id || ''))
  stepView.querySelectorAll('.query-clause').forEach((node) => {
    let active = Boolean(key) && node.dataset.clause === key
    if (active && key === 'JOIN' && joinMatch) active = node.dataset.occurrence === joinMatch[1]
    node.classList.toggle('is-active', active)
  })
  // A comma join has no JOIN keyword to light up, so fall back to FROM.
  if (key && map && !map.querySelector('.query-clause.is-active')) map.querySelector('.query-clause[data-clause="FROM"]')?.classList.add('is-active')
  stepView.querySelectorAll('.order-chip').forEach((chip) => chip.classList.toggle('is-active', Boolean(key) && chip.dataset.clause === key))
  stepView.querySelectorAll('.story-item').forEach((item) => {
    const index = Number(item.dataset.stepIndex)
    item.classList.toggle('is-active', index === activeStepIndex)
    item.classList.toggle('is-done', index < activeStepIndex)
  })
}

function getClauseSnippet(step) {
  const key = clauseKeyForStep(step)
  if (!key) return ''
  const matches = activeSegments.filter((segment) => segment.key === key)
  if (!matches.length) return ''
  let segment = matches[0]
  const joinMatch = /^join-(\d+)$/.exec(String(step.id || ''))
  if (key === 'JOIN' && joinMatch && matches[Number(joinMatch[1]) - 1]) segment = matches[Number(joinMatch[1]) - 1]
  return segment.text.trim().replace(/;$/, '')
}

// Describes how many rows went in and out of a stage, for the flow meter.
function buildFlowModel(step) {
  const id = String(step.id || '')
  const kind = String(step.kind || '')
  const { input, output } = stageCounts(step)
  if (output === undefined || output === null) return null
  const plural = (unit, n) => `${unit}${n === 1 ? '' : 's'}`
  const percent = (part, whole) => (whole > 0 ? Math.max(0, Math.min(100, (part / whole) * 100)) : 0)
  const filter = (total, kept, unit, takeaway) => ({
    inValue: String(total), inLabel: `${plural(unit, total)} in`,
    outValue: String(kept), outLabel: `${plural(unit, kept)} out`,
    bar: { kept: percent(kept, total), removed: total > 0 ? 100 - percent(kept, total) : 0, keptLabel: `${kept} kept`, removedLabel: `${Math.max(0, total - kept)} removed`, tone: 'removed' },
    takeaway,
  })

  if (id === 'from') {
    return {
      inValue: '▤', inLabel: 'table', outValue: String(output), outLabel: `${plural('row', output)} loaded`,
      bar: { kept: 100, removed: 0 }, takeaway: `${countLabel(output, 'row')} read from the table. Nothing has been filtered yet.`,
    }
  }
  if (step.kind === 'subquery') {
    const rows = input ?? output
    return {
      inValue: String(rows), inLabel: `${plural('row', rows)} in`, outValue: String(output), outLabel: `${plural('row', output)} out`,
      bar: { kept: 100, removed: 0 }, takeaway: 'The subquery result was added as a column on each outer row. WHERE has not filtered these rows yet.',
    }
  }
  if (isSubqueryStep(step)) {
    const decisions = step.filterFlags || step.executions?.map((execution) => execution.passed)
    if (!decisions?.length) return null
    const kept = decisions.filter(Boolean).length
    return filter(decisions.length, kept, 'row', `${kept} of ${decisions.length} rows passed the subquery test${step.capped ? ' (the first rows were checked)' : ''}.`)
  }
  if (kind === 'join') {
    if (input === undefined || input === null) return null
    const takeaway = output > input
      ? `${output - input} extra ${output - input === 1 ? 'row' : 'rows'} appeared because some rows matched more than one partner.`
      : output < input
        ? `${input - output} ${input - output === 1 ? 'row' : 'rows'} had no match, so this join dropped them.`
        : `Row count unchanged at ${output}.`
    return {
      inValue: String(input), inLabel: `${plural('row', input)} in`, outValue: String(output), outLabel: `${plural('row', output)} out`,
      bar: output < input
        ? { kept: percent(output, input), removed: 100 - percent(output, input), keptLabel: `${output} matched`, removedLabel: `${input - output} dropped`, tone: 'removed' }
        : { kept: 100, removed: 0, extraLabel: output > input ? `+${output - input} extra ${output - input === 1 ? 'row' : 'rows'}` : '' },
      takeaway,
    }
  }
  if (kind === 'groups') {
    if (input === undefined || input === null) return null
    return {
      inValue: String(input), inLabel: `${plural('row', input)} in`, outValue: String(output), outLabel: `${plural('group', output)} out`,
      bar: { kept: percent(output, input), removed: 100 - percent(output, input), keptLabel: countLabel(output, 'group'), removedLabel: `${Math.max(0, input - output)} rows merged in`, tone: 'merged' },
      takeaway: `${countLabel(input, 'row')} were sorted into ${countLabel(output, 'group')}. Rows that share the same key land in the same group.`,
    }
  }
  if (id === 'aggregate') {
    if (input === undefined || input === null) return null
    if (activePlanHasGroups) {
      return {
        inValue: String(input), inLabel: `${plural('group', input)} in`, outValue: String(output), outLabel: `${plural('group', output)} out`,
        bar: { kept: 100, removed: 0 }, takeaway: `Each of the ${countLabel(output, 'group')} now carries its calculated value (COUNT, SUM, AVG…).`,
      }
    }
    return {
      inValue: String(input), inLabel: `${plural('row', input)} in`, outValue: String(output), outLabel: `${plural('row', output)} out`,
      bar: { kept: percent(output, input), removed: 100 - percent(output, input), keptLabel: countLabel(output, 'row'), removedLabel: `${Math.max(0, input - output)} rows folded in`, tone: 'merged' },
      takeaway: `All ${countLabel(input, 'row')} were squeezed into ${countLabel(output, 'row')}: one answer for the whole table.`,
    }
  }
  if (id === 'where' || id === 'distinct' || kind === 'limit' || id === 'having') {
    if (input === undefined || input === null) return null
    const unit = id === 'having' ? 'group' : 'row'
    const removed = Math.max(0, input - output)
    const takeaway = id === 'where'
      ? (output === 0 ? 'No row passed the condition, so nothing moves on and the result will be empty.'
        : removed === 0 ? 'Every row passed the condition, so nothing was removed.'
          : `${removed} of ${input} rows failed the condition and were removed. Only ${output} move on.`)
      : id === 'having'
        ? (removed === 0 ? 'Every group passed the HAVING test.' : `${removed} of ${input} groups failed the HAVING test and were removed.`)
        : id === 'distinct'
          ? (removed === 0 ? 'There were no duplicates to remove.' : `${removed} duplicate rows were removed.`)
          : `Kept the first ${output}; ${removed} ${plural('row', removed)} fall after the cutoff.`
    return filter(input, output, unit, takeaway)
  }
  if (id === 'select') {
    const base = input === undefined || input === null ? output : input
    const inCols = step.input?.columns?.length
    const outCols = step.result.columns?.length
    const columnNote = !activePlanHasGroups && inCols && outCols && inCols !== outCols
      ? ` ${inCols} columns were narrowed to the ${outCols} you asked for.`
      : outCols ? ` Each row now has the ${outCols} requested ${outCols === 1 ? 'column' : 'columns'}.` : ''
    return {
      inValue: String(base), inLabel: `${plural('row', base)} in`, outValue: String(output), outLabel: `${plural('row', output)} out`,
      bar: { kept: 100, removed: 0 }, takeaway: `Same ${countLabel(output, 'row')}, only the columns change.${columnNote}`,
    }
  }
  if (kind === 'order') {
    const base = input === undefined || input === null ? output : input
    return {
      inValue: String(base), inLabel: `${plural('row', base)} in`, outValue: String(output), outLabel: `${plural('row', output)} out`,
      bar: { kept: 100, removed: 0 }, takeaway: 'Same rows in a new order. Nothing was added or removed.',
    }
  }
  return null
}

function renderFlowMeter(step) {
  if (activePlanIsSandbox) return null
  const model = buildFlowModel(step)
  if (!model) return null
  const section = createNode('section', 'flow-meter')
  section.setAttribute('aria-label', 'Rows entering and leaving this stage')
  const left = createNode('div', 'flow-meter-end')
  left.append(createNode('strong', '', model.inValue), createNode('small', '', model.inLabel))
  const middle = createNode('div', 'flow-meter-middle')
  const bar = createNode('div', 'flow-meter-bar')
  bar.setAttribute('role', 'img')
  bar.setAttribute('aria-label', `${model.inValue} ${model.inLabel}, ${model.outValue} ${model.outLabel}`)
  const kept = createNode('span', 'flow-meter-kept')
  kept.style.width = `${model.bar.kept}%`
  bar.append(kept)
  if (model.bar.removed > 0) {
    const removed = createNode('span', `flow-meter-removed is-${model.bar.tone || 'removed'}`)
    removed.style.width = `${model.bar.removed}%`
    bar.append(removed)
  }
  middle.append(bar)
  const legend = createNode('div', 'flow-meter-legend')
  if (model.bar.keptLabel) legend.append(createNode('span', 'flow-legend is-kept', model.bar.keptLabel))
  if (model.bar.removed > 0 && model.bar.removedLabel) legend.append(createNode('span', `flow-legend is-${model.bar.tone || 'removed'}`, model.bar.removedLabel))
  if (model.bar.extraLabel) legend.append(createNode('span', 'flow-legend is-extra', model.bar.extraLabel))
  if (legend.children.length) middle.append(legend)
  const right = createNode('div', 'flow-meter-end flow-meter-end--out')
  right.append(createNode('strong', '', model.outValue), createNode('small', '', model.outLabel))
  section.append(left, middle, right)
  if (model.takeaway) section.append(createNode('p', 'flow-takeaway', model.takeaway))
  return section
}

function stepperCountText(step) {
  const { input, output } = stageCounts(step)
  if (output === undefined || output === null) return ''
  const outText = countLabel(output, stageUnit(step))
  return input !== undefined && input !== null && input !== output ? `${input} → ${outText}` : outText
}

function renderSteps(steps) {
  activeSteps = steps
  activeStepIndex = 0
  activeSql = lastQuerySql
  activeSegments = segmentSqlByClause(activeSql)
  activePlanIsSandbox = steps.every((step) => String(step.kind || '').startsWith('sandbox'))
  activePlanHasGroups = steps.some((step) => step.kind === 'groups')
  stepView.replaceChildren()
  stepsEmpty.hidden = true
  stepView.hidden = false

  stepView.append(buildOverviewHeader(steps))
  if (!activePlanIsSandbox) {
    const card = buildOverviewCard(steps)
    if (card) stepView.append(card)
  }

  const stepper = createNode('div', 'stepper-track')
  stepper.setAttribute('aria-label', 'Logical query steps')
  stepper.setAttribute('role', 'list')
  const maxCount = Math.max(1, ...steps.map((step) => step.result?.totalRows || 0))
  steps.forEach((step, index) => {
    if (index > 0 && !activePlanIsSandbox) stepper.append(createNode('span', 'stepper-arrow', '›'))
    const key = clauseKeyForStep(step)
    const button = createNode('button', `stepper-item${clauseClass(key)}`)
    button.type = 'button'
    button.setAttribute('role', 'listitem')
    button.setAttribute('aria-pressed', 'false')
    button.dataset.stepIndex = String(index)
    button.append(createNode('span', 'stepper-number', String(index + 1).padStart(2, '0')))
    const text = createNode('span', 'stepper-text')
    text.append(createNode('span', 'stepper-label', activePlanIsSandbox ? step.title : stageTag(step)))
    if (!activePlanIsSandbox) text.append(createNode('span', 'stepper-count', stepperCountText(step)))
    button.append(text)
    if (!activePlanIsSandbox) {
      const barTrack = createNode('span', 'stepper-bar')
      const fill = createNode('span', 'stepper-bar-fill')
      fill.style.width = `${Math.max(6, Math.round(((step.result?.totalRows || 0) / maxCount) * 100))}%`
      barTrack.append(fill)
      button.append(barTrack)
    }
    button.addEventListener('click', () => showStep(index))
    stepper.append(button)
  })
  stepper.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const target = event.target.closest?.('.stepper-item')
    if (!target) return
    event.preventDefault()
    const nextIndex = Math.max(0, Math.min(steps.length - 1, Number(target.dataset.stepIndex) + (event.key === 'ArrowRight' ? 1 : -1)))
    showStep(nextIndex)
    stepper.querySelector(`[data-step-index="${nextIndex}"]`)?.focus()
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
  const focusButton = createNode('button', 'button button--quiet', 'Focus view')
  focusButton.type = 'button'
  focusButton.dataset.stepControl = 'focus'
  focusButton.setAttribute('aria-pressed', String(outputPanel.classList.contains('is-focused')))
  focusButton.addEventListener('click', () => setWalkthroughFocus(!outputPanel.classList.contains('is-focused')))
  const nextButton = createNode('button', 'button button--quiet', 'Next →')
  nextButton.type = 'button'
  nextButton.dataset.stepControl = 'next'
  nextButton.addEventListener('click', () => showStep(Math.min(activeSteps.length - 1, activeStepIndex + 1)))
  navigation.append(previousButton, stepPosition, autoplayButton, focusButton, nextButton)
  stepView.append(navigation)

  const detail = createNode('article', 'step-detail')
  detail.setAttribute('aria-live', 'polite')
  detail.id = 'step-detail'
  stepView.append(detail)
  // Always begin at stage 1 so the story reads from the first table to the final result.
  showStep(0)
}

function showStep(index, { fromAutoplay = false } = {}) {
  if (!activeSteps.length) return
  if (autoplayTimer && !fromAutoplay) stopAutoplay()
  activeStepIndex = Math.max(0, Math.min(index, activeSteps.length - 1))
  const step = activeSteps[activeStepIndex]

  document.querySelectorAll('.stepper-item').forEach((button, buttonIndex) => {
    const active = buttonIndex === activeStepIndex
    button.classList.toggle('is-active', active)
    button.classList.toggle('is-done', buttonIndex < activeStepIndex)
    button.setAttribute('aria-pressed', String(active))
    if (active) button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
  const previous = $('[data-step-control="previous"]')
  const next = $('[data-step-control="next"]')
  if (previous) previous.disabled = activeStepIndex === 0
  if (next) next.disabled = activeStepIndex === activeSteps.length - 1
  const position = $('.step-position')
  if (position) position.textContent = `Stage ${activeStepIndex + 1} of ${activeSteps.length} · ${step.title}`
  syncOverviewHighlight()

  const detail = $('#step-detail')
  detail.replaceChildren()
  const clauseKey = clauseKeyForStep(step)
  detail.className = `step-detail${clauseClass(clauseKey)}`
  const header = createNode('div', 'step-detail-header')
  const titleGroup = createNode('div', '')
  const total = String(activeSteps.length).padStart(2, '0')
  titleGroup.append(createNode('p', 'eyebrow eyebrow--small', `LOGICAL STEP ${String(activeStepIndex + 1).padStart(2, '0')} OF ${total}`))
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
  detail.append(header)

  if (activePlanIsSandbox) {
    detail.append(createNode('p', 'step-explanation', step.description))
  } else {
    const intro = createNode('div', 'step-intro')
    const plainCard = createNode('section', 'intro-card intro-card--plain')
    plainCard.append(createNode('p', 'intro-label', 'IN PLAIN WORDS'), createNode('p', 'intro-plain', stepPlainText(step)))
    intro.append(plainCard)
    const snippet = getClauseSnippet(step)
    if (snippet) {
      const snippetCard = createNode('section', 'intro-card')
      snippetCard.append(createNode('p', 'intro-label', 'THIS PART OF YOUR QUERY'))
      const pre = createNode('pre', 'intro-snippet')
      pre.append(createNode('code', '', snippet))
      snippetCard.append(pre)
      intro.append(snippetCard)
    } else {
      intro.classList.add('is-single')
    }
    detail.append(intro)
    const meter = renderFlowMeter(step)
    if (meter) detail.append(meter)
    const technical = createNode('div', 'step-technical')
    technical.append(createNode('p', 'intro-label', 'UNDER THE HOOD'), createNode('p', 'step-explanation', step.description))
    detail.append(technical)
  }

  if (step.kind === 'window') renderWindowVisual(detail, step)
  else if (step.kind === 'hierarchy') renderHierarchyVisual(detail, step)
  else if (step.kind === 'sandbox-write') renderSandboxWriteVisual(detail, step)
  else if (step.kind === 'sandbox-schema') renderSandboxSchemaVisual(detail, step)
  else if (step.kind === 'sandbox-transaction') renderSandboxTransactionVisual(detail, step)
  else if (step.kind === 'sandbox-error') renderSandboxErrorVisual(detail, step)
  else if (step.kind === 'join') renderJoinVisual(detail, step)
  else if (step.kind === 'subquery-membership') renderMembershipSubqueryVisual(detail, step)
  else if (step.kind === 'subquery-exists') renderExistsSubqueryVisual(detail, step)
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

  if (activeStepIndex === activeSteps.length - 1 && !activePlanIsSandbox) {
    const done = createNode('section', 'final-callout')
    const copy = createNode('div', 'final-callout-copy')
    copy.append(createNode('strong', '', 'That is your final result.'))
    copy.append(createNode('span', '', `The rows above are exactly what the Results tab shows: ${countLabel(step.result.totalRows, 'row')}.`))
    const resultsButton = createNode('button', 'button button--primary', 'Open Results')
    resultsButton.type = 'button'
    resultsButton.addEventListener('click', () => activateTab('result'))
    done.append(copy, resultsButton)
    detail.append(done)
  }
}

function renderWindowVisual(parent, step) {
  if (step.windowPhase === 'input') {
    parent.append(createNode('h4', 'visual-subheading', 'Step 1 · rows entering OVER(...)'))
    parent.append(createNode('p', 'visual-caption', 'These are the rows after the query’s source and filters. The window function will add a value to every row that reaches it.'))
    parent.append(renderTable(step.result, { rowLimit: 40, numbered: true }))
    return
  }

  if (step.windowPhase === 'partition') {
    const partitionKeys = step.functions?.[0]?.partition || []
    const partitionName = partitionKeys.length ? partitionKeys.join(', ') : 'the full row set'
    parent.append(createNode('h4', 'visual-subheading', `Step 2 · split rows by ${partitionName}`))
    parent.append(createNode('p', 'visual-caption', partitionKeys.length
      ? `Rows with the same ${partitionName} are placed in the same partition. Each group is an independent lane; the window function starts over in every group.`
      : 'There is no PARTITION BY, so every input row belongs to one shared partition.'))
    const groups = createNode('div', 'window-partition-grid')
    ;(step.partitions || []).forEach((partition, index) => {
      const card = createNode('article', 'window-partition-card')
      card.append(createNode('p', 'window-logic-label', `PARTITION ${String(index + 1).padStart(2, '0')}`))
      card.append(createNode('h4', '', partition.label))
      card.append(createNode('p', 'window-partition-note', `${partition.inputRows?.length || 0} ${partition.inputRows?.length === 1 ? 'row' : 'rows'} will be ranked together. RANK starts again at 1 in this group.`))
      card.append(renderTable({
        columns: step.input?.columns || step.result.columns,
        rows: partition.inputRows || [],
        totalRows: partition.inputRows?.length || 0,
      }, { compact: true, rowLimit: 40, numbered: true }))
      groups.append(card)
    })
    if (!(step.partitions || []).length) groups.append(renderTable(step.input || step.result, { rowLimit: 40, numbered: true }))
    parent.append(groups)
    return
  }

  const functions = step.functions || []
  const rankFunction = functions.find((item) => ['RANK', 'DENSE_RANK', 'ROW_NUMBER'].includes(String(item.name).toUpperCase()))
  const partitionLabel = rankFunction?.partition?.length ? rankFunction.partition.join(', ') : 'all rows'
  const orderLabel = rankFunction?.order || 'no window ORDER BY'
  const functionName = String(rankFunction?.name || 'window function').toUpperCase()

  parent.append(createNode('h4', 'visual-subheading', 'How the OVER clause creates a ranking'))
  parent.append(createNode('p', 'visual-caption', 'The OVER clause defines the rows a window function can see and the order it uses. It adds a value to each row without collapsing the rows into one result.'))

  const flow = createNode('div', 'window-logic-flow')
  const partitionCard = createNode('article', 'window-logic-card window-logic-card--partition')
  partitionCard.append(createNode('p', 'window-logic-label', '01 · PARTITION BY'))
  partitionCard.append(createNode('h4', '', partitionLabel))
  partitionCard.append(createNode('p', 'window-logic-copy', rankFunction?.partition?.length
    ? 'Split employees into separate groups. Each group is ranked independently; a high salary in one department does not compete with another department.'
    : 'There is no PARTITION BY, so every input row belongs to one shared group.'))

  const orderCard = createNode('article', 'window-logic-card window-logic-card--order')
  orderCard.append(createNode('p', 'window-logic-label', '02 · ORDER BY inside OVER'))
  orderCard.append(createNode('h4', '', orderLabel))
  orderCard.append(createNode('p', 'window-logic-copy', rankFunction?.order
    ? `Sort the rows inside each partition by ${orderLabel.replace(/\bDESC\b/gi, 'largest first').replace(/\bASC\b/gi, 'smallest first')}. This order determines their rank.`
    : 'Without an ORDER BY in OVER, the function has no ranking sequence to follow.'))

  const rankCard = createNode('article', 'window-logic-card window-logic-card--rank')
  rankCard.append(createNode('p', 'window-logic-label', '03 · WINDOW FUNCTION'))
  rankCard.append(createNode('h4', '', functionName))
  const rankExplanation = functionName === 'RANK'
    ? 'RANK gives the same number to tied order values. The next rank skips ahead by the number of tied rows.'
    : functionName === 'DENSE_RANK'
      ? 'DENSE_RANK gives the same number to ties, then continues with the next consecutive number.'
      : functionName === 'ROW_NUMBER'
        ? 'ROW_NUMBER gives every row a different sequence number, even when order values tie.'
        : 'The function calculates a value for each row in the window.'
  rankCard.append(createNode('p', 'window-logic-copy', rankExplanation))
  flow.append(partitionCard, createNode('span', 'window-logic-arrow', '→'), orderCard, createNode('span', 'window-logic-arrow', '→'), rankCard)
  parent.append(flow)

  const orderingFunction = rankFunction || functions.find((item) => item.orderKeys?.length)
  const orderKeys = renderSortKeys(orderingFunction?.orderKeys, 'ORDER BY inside OVER(...) · sort priority')
  if (orderKeys) parent.append(orderKeys)

  parent.append(createNode('h4', 'visual-subheading', 'Window definition in this query'))
  const definitions = createNode('div', 'window-function-list')
  functions.forEach((item) => {
    const card = createNode('article', 'window-function-card')
    card.append(createNode('strong', '', `${item.name}${item.alias ? ` → ${item.alias}` : ''}`))
    card.append(createNode('span', '', item.specificationName ? `Named window: ${item.specificationName}` : 'Window specification written inside OVER(...)'))
    card.append(createNode('span', '', `PARTITION BY ${item.partition?.length ? item.partition.join(', ') : '(all rows together)'}`))
    card.append(createNode('span', '', `ORDER BY ${item.order || '(no window ordering)'}`))
    if (item.frame) card.append(createNode('span', '', `Frame: ${item.frame}`))
    definitions.append(card)
  })
  parent.append(definitions)

  parent.append(createNode('h4', 'visual-subheading', rankFunction ? 'Rows sorted and ranked inside each partition' : 'Window values inside each partition'))
  parent.append(createNode('p', 'visual-caption', rankFunction
    ? 'The table keeps the final values calculated by SQL. When the rank column is available, it is displayed in rank order so you can follow the window ORDER BY.'
    : 'The table keeps the final values calculated by SQL and groups them by the PARTITION BY values.'))
  const rankIndex = rankFunction ? findWindowResultColumn(step, rankFunction) : -1
  const orderColumns = rankFunction ? findWindowOrderColumns(step, rankFunction) : []
  ;(step.partitions || []).forEach((partition, index) => {
    const details = createNode('details', 'window-partition')
    details.open = index === 0
    const rows = [...partition.rows]
    if (rankIndex >= 0) rows.sort((left, right) => Number(left[rankIndex]) - Number(right[rankIndex]))
    const rowNoun = rows.length === 1 ? 'employee' : 'employees'
    details.append(createNode('summary', '', `${partition.label} · ${rows.length} ${rowNoun}`))
    const partitionNote = rankIndex >= 0
      ? `Sorted by ${rankFunction.order}. This ${functionName} value was calculated by SQL.`
      : rankFunction?.order
        ? `The window ORDER BY is ${rankFunction.order}. The displayed order follows the final query result.`
        : `All rows share one partition. ${functionName} was calculated for every row.`
    details.append(createNode('p', 'window-partition-note', partitionNote))
    const selectedColumns = [...orderColumns]
    if (rankIndex >= 0) selectedColumns.push(step.result.columns[rankIndex])
    const result = { columns: step.result.columns, rows, totalRows: partition.rows.length }
    details.append(renderTable(result, {
      rowLimit: 40,
      numbered: true,
      selectedColumns: selectedColumns.length ? [...new Set(selectedColumns)] : undefined,
    }))
    parent.append(details)
  })
  if (!(step.partitions || []).length) parent.append(renderTable(step.result, { rowLimit: 40, numbered: true }))

  if (functionName === 'RANK') {
    const tieExample = createNode('aside', 'rank-tie-example')
    tieExample.append(createNode('p', 'window-logic-label', 'RANK tie example'))
    tieExample.append(createNode('p', 'window-partition-note', 'The current employee data has no tied salaries within a department. This example shows what RANK does when two order values are equal.'))
    tieExample.append(renderTable({
      columns: ['Sorted position', 'Salary', 'RANK()', 'DENSE_RANK()'],
      rows: [[1, 120000, 1, 1], [2, 120000, 1, 1], [3, 98000, 3, 2]],
      totalRows: 3,
    }, { compact: true, numbered: false }))
    tieExample.append(createNode('p', 'window-partition-note', 'The two $120,000 rows tie at rank 1. RANK skips 2, so the next row gets 3; DENSE_RANK would give it 2.'))
    parent.append(tieExample)
  }
}

function findWindowResultColumn(step, item) {
  const columns = step.result.columns || []
  const alias = normalizeColumn(item.alias || '').split('.').at(-1)
  if (alias) {
    const match = columns.findIndex((column) => normalizeColumn(column).split('.').at(-1) === alias)
    if (match >= 0) return match
  }
  const functionName = String(item.name || '').toLowerCase()
  return columns.findIndex((column) => normalizeColumn(column).includes(functionName))
}

function findWindowOrderColumns(step, item) {
  const output = []
  String(item.order || '').split(',').forEach((term) => {
    const expression = term.trim().replace(/\s+(?:ASC|DESC)\s*$/i, '').replace(/[`"\[\]]/g, '')
    if (!/^[\w$]+(?:\.[\w$]+)?$/.test(expression)) return
    const name = expression.split('.').at(-1).toLowerCase()
    const column = step.result.columns.find((candidate) => normalizeColumn(candidate).split('.').at(-1) === name)
    if (column) output.push(column)
  })
  return output
}
function renderHierarchyVisual(parent, step) {
  if (step.hierarchyPhase) {
    const heading = step.hierarchyPhase === 'anchor'
      ? 'Step 1 · run the anchor once'
      : step.hierarchyPhase === 'recursive'
        ? `Step ${step.activeLevel.depth + 1} · expand the previous level`
        : step.hierarchyPhase === 'stop'
          ? 'Recursion is complete'
          : 'Final step · read the completed CTE'
    parent.append(createNode('h4', 'visual-subheading', heading))

    if (step.hierarchyPhase === 'anchor') {
      parent.append(createNode('p', 'visual-caption', `The anchor query runs once. It selects employees with no manager and seeds ${step.cteName} at depth 0.`))
      parent.append(renderCteSql('ANCHOR SQL', step.anchorSql))
      parent.append(createNode('p', 'cte-pass-label', 'ROOT ROWS ADDED · DEPTH 0'))
      parent.append(renderTable(step.result, { rowLimit: 40, numbered: true }))
      return
    }

    if (step.hierarchyPhase === 'recursive') {
      parent.append(createNode('p', 'visual-caption', `The recursive member reads the depth ${step.previousLevel.depth} rows shown on the left, finds employees whose manager_id matches one of those ids, then adds only the new matches at depth ${step.activeLevel.depth}.`))
      parent.append(renderCteSql(`RECURSIVE MEMBER · PASS ${step.activeLevel.depth}`, step.recursiveSql))
      const pass = createNode('div', 'cte-pass-panels')
      const prior = createNode('section', 'cte-pass-panel cte-pass-panel--input')
      prior.append(createNode('p', 'cte-pass-label', `INPUT · DEPTH ${step.previousLevel.depth}`))
      prior.append(renderTable(step.input, { compact: true, rowLimit: 24, numbered: true }))
      const next = createNode('section', 'cte-pass-panel cte-pass-panel--output')
      next.append(createNode('p', 'cte-pass-label', `NEW ROWS · DEPTH ${step.activeLevel.depth}`))
      next.append(renderTable(step.result, { compact: true, rowLimit: 24, numbered: true }))
      pass.append(prior, createNode('span', 'cte-pass-arrow', '→'), next)
      parent.append(pass)
      return
    }

    if (step.hierarchyPhase === 'stop') {
      parent.append(createNode('p', 'visual-caption', `The previous pass had ${step.previousLevel.rows.length} row${step.previousLevel.rows.length === 1 ? '' : 's'}, but no employees report to them. The recursive member returns an empty batch, so SQL stops repeating it.`))
      const stop = createNode('section', 'cte-stop-callout')
      stop.append(createNode('strong', '', '0 new rows'))
      stop.append(createNode('span', '', 'No next level exists. The CTE is now complete.'))
      parent.append(stop)
      return
    }

    parent.append(createNode('p', 'visual-caption', `Now the outer SELECT reads all accumulated rows from ${step.cteName}. The final ORDER BY arranges the complete hierarchy by depth and id.`))
    parent.append(renderCteSql('OUTER SELECT', step.outerSql))
    const orderKeys = renderSortKeys(step.outerOrderBy, 'Final ORDER BY · sort priority')
    if (orderKeys) parent.append(orderKeys)
    parent.append(renderTable(step.result, { rowLimit: 40, numbered: true }))
    return
  }

  if (step.recursiveCte && step.anchorSql && step.recursiveSql) {
    parent.append(createNode('h4', 'visual-subheading', 'How the recursive CTE builds the result'))
    parent.append(createNode('p', 'visual-caption', `WITH RECURSIVE creates a temporary result called ${step.cteName}. The anchor seeds it once; the recursive member reads the rows already found and adds the next level.`))

    const process = createNode('div', 'cte-process')
    const anchor = createNode('article', 'cte-process-card cte-process-card--anchor')
    anchor.append(createNode('p', 'cte-process-label', '01 · ANCHOR · RUNS ONCE'))
    anchor.append(createNode('h4', '', 'Find the starting rows'))
    anchor.append(createNode('p', 'cte-process-copy', 'The anchor query selects the root employees. These rows become level 0.'))
    const anchorCode = createNode('pre', 'cte-sql')
    anchorCode.append(createNode('code', '', step.anchorSql))
    anchor.append(anchorCode)

    const recursive = createNode('article', 'cte-process-card cte-process-card--recursive')
    recursive.append(createNode('p', 'cte-process-label', '02 · RECURSIVE MEMBER · REPEATS'))
    recursive.append(createNode('h4', '', 'Find children of the current level'))
    recursive.append(createNode('p', 'cte-process-copy', `Each pass joins employees to ${step.cteName}, which represents the rows found so far. The join adds the next level.`))
    const recursiveCode = createNode('pre', 'cte-sql')
    recursiveCode.append(createNode('code', '', step.recursiveSql))
    recursive.append(recursiveCode)

    const stop = createNode('article', 'cte-process-card cte-process-card--stop')
    stop.append(createNode('p', 'cte-process-label', '03 · STOP CONDITION'))
    stop.append(createNode('h4', '', 'No new rows → stop'))
    stop.append(createNode('p', 'cte-process-copy', 'The recursive member runs again until it finds no more employees to add.'))
    process.append(anchor, createNode('span', 'cte-process-arrow', '→'), recursive, createNode('span', 'cte-process-arrow', '→'), stop)
    parent.append(process)

    parent.append(createNode('h4', 'visual-subheading', 'Rows added at each pass'))
    parent.append(createNode('p', 'visual-caption', 'Level 0 comes from the anchor. Each later level is one recursive pass using the previous level as its starting point.'))
    const rounds = createNode('div', 'cte-rounds')
    step.levels.forEach((level) => {
      const card = createNode('section', 'cte-round')
      card.dataset.depth = String(Math.min(level.depth, 3))
      const title = level.depth === 0 ? 'Anchor · starting employees' : `Recursive pass ${level.depth}`
      card.append(createNode('h4', '', `${title} · ${level.rows.length} ${level.rows.length === 1 ? 'row' : 'rows'}`))
      card.append(renderTable({ columns: step.result.columns, rows: level.rows, totalRows: level.rows.length }, { compact: true, rowLimit: 40 }))
      rounds.append(card)
    })
    parent.append(rounds)

    if (step.outerSql) {
      const outer = createNode('section', 'cte-outer-query')
      outer.append(createNode('p', 'cte-process-label', 'AFTER THE CTE IS BUILT'))
      outer.append(createNode('p', 'cte-process-copy', `The outer SELECT reads the completed ${step.cteName} result and returns the rows shown here.`))
      const outerCode = createNode('pre', 'cte-sql')
      outerCode.append(createNode('code', '', step.outerSql))
      outer.append(outerCode)
      parent.append(outer)
    }
    return
  }

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
  const orderKeys = renderSortKeys(step.outerOrderBy, 'Final ORDER BY · sort priority')
  if (orderKeys) parent.append(orderKeys)
}

function renderCteSql(label, sql) {
  const block = createNode('details', 'cte-phase-sql')
  const summary = createNode('summary', '', label)
  const pre = createNode('pre', 'cte-sql')
  pre.append(createNode('code', '', sql || ''))
  block.append(summary, pre)
  return block
}

function renderSubqueryVisual(parent, step) {
  const executions = step.executions || []
  if (executions.length) {
    renderScalarExecutionSequence(parent, step, executions)
    if (step.capped) {
      parent.append(createNode('p', 'table-overflow-note', `The walkthrough calculates the subquery column for the first ${executions.length} of ${step.result.totalRows} rows. WHERE runs as the next stage. The Results tab shows the complete query output.`))
    }
    return
  }

  parent.append(createNode('h4', 'visual-subheading', 'Subquery value added as a column'))
  parent.append(createNode('p', 'visual-caption', 'This stage calculates the inner result for each outer row. The WHERE stage that follows makes the keep or remove decision.'))
  parent.append(renderTable(step.result, { rowLimit: 40, numbered: true }))
}

function renderScalarExecutionSequence(parent, step, executions) {
  activeSubqueryExecutionIndex = 0
  const sequence = createNode('section', 'correlated-walkthrough')
  const navigation = createNode('div', 'correlated-walkthrough-navigation')
  const previousButton = createNode('button', 'button button--quiet correlated-row-button', '← Previous outer row')
  previousButton.type = 'button'
  previousButton.addEventListener('click', () => {
    if (autoplayTimer) stopAutoplay()
    activeSubqueryExecutionIndex = Math.max(0, activeSubqueryExecutionIndex - 1)
    updateScalarExecutionSequence(sequence, step, executions, previousButton, nextButton, counter, progressFill)
  })
  const counter = createNode('p', 'correlated-row-counter')
  counter.setAttribute('aria-live', 'polite')
  counter.setAttribute('aria-atomic', 'true')
  const nextButton = createNode('button', 'button button--primary correlated-row-button', 'Next outer row →')
  nextButton.type = 'button'
  nextButton.addEventListener('click', () => {
    if (autoplayTimer) stopAutoplay()
    activeSubqueryExecutionIndex = Math.min(executions.length - 1, activeSubqueryExecutionIndex + 1)
    updateScalarExecutionSequence(sequence, step, executions, previousButton, nextButton, counter, progressFill)
  })
  navigation.append(previousButton, counter, nextButton)

  const progressTrack = createNode('div', 'correlated-row-progress')
  progressTrack.setAttribute('role', 'progressbar')
  progressTrack.setAttribute('aria-label', 'Outer rows with a calculated subquery value')
  progressTrack.setAttribute('aria-valuemin', '1')
  progressTrack.setAttribute('aria-valuemax', String(step.result.totalRows || executions.length))
  const progressFill = createNode('span', 'correlated-row-progress-fill')
  progressTrack.append(progressFill)
  const cards = createNode('div', 'correlated-row-flow')
  const resultTable = createNode('section', 'correlated-result-table')
  sequence.append(navigation, progressTrack, cards, resultTable)
  parent.append(sequence)
  updateScalarExecutionSequence(sequence, step, executions, previousButton, nextButton, counter, progressFill)
}

function updateScalarExecutionSequence(sequence, step, executions, previousButton, nextButton, counter, progressFill) {
  const index = activeSubqueryExecutionIndex
  const execution = executions[index]
  const total = step.result.totalRows || executions.length
  counter.textContent = `OUTER ROW ${execution.rowNumber} OF ${total}`
  previousButton.disabled = index === 0
  nextButton.disabled = index === executions.length - 1
  progressFill.parentElement.setAttribute('aria-valuenow', String(execution.rowNumber))
  progressFill.style.width = `${Math.round((execution.rowNumber / total) * 100)}%`

  const flow = sequence.querySelector('.correlated-row-flow')
  const outerCard = createNode('article', 'correlated-stage-card correlated-stage-card--outer')
  outerCard.append(createNode('p', 'correlated-stage-label', '01 · CURRENT OUTER ROW'))
  const outerNameIndex = execution.outerColumns.findIndex((column) => normalizeColumn(column).split('.').at(-1) === 'name')
  const outerName = outerNameIndex >= 0 ? execution.sourceRow[outerNameIndex] : `Row ${execution.rowNumber}`
  outerCard.append(createNode('h4', '', String(outerName)))
  outerCard.append(createNode('p', 'correlated-stage-copy', 'Take this row from the outer query. Its values can be passed into the inner query.'))
  outerCard.append(renderTable({
    columns: execution.outerColumns,
    rows: [execution.sourceRow.slice(0, execution.outerColumns.length)],
    totalRows: 1,
  }, { compact: true }))
  if (execution.correlatedValues.length) {
    const keyList = createNode('div', 'correlated-key-list')
    execution.correlatedValues.forEach((reference) => {
      const key = createNode('div', 'correlated-key')
      key.append(createNode('span', '', `Value passed in · ${reference.label}`))
      const value = createNode('strong', '')
      appendCorrelatedValue(value, reference.value)
      key.append(value)
      keyList.append(key)
    })
    outerCard.append(keyList)
  }

  const innerCard = createNode('article', 'correlated-stage-card correlated-stage-card--inner')
  innerCard.append(createNode('p', 'correlated-stage-label', '02 · RUN THE INNER QUERY'))
  const matchingRows = execution.innerRowsResult
  const correlationText = execution.correlatedValues.map((reference) => `${reference.label} = ${formatCorrelatedValue(reference.value)}`).join(' · ')
  innerCard.append(createNode('h4', '', step.innerExpression))
  innerCard.append(createNode('p', 'correlated-stage-copy', correlationText
    ? `The current row supplies ${correlationText}. The inner SELECT uses those values to calculate its answer.`
    : 'The inner SELECT runs for this outer row and returns a scalar value.'))
  if (matchingRows) {
    innerCard.append(createNode('p', 'correlated-stage-copy', `Input rows used by ${step.innerExpression}:`))
    innerCard.append(renderTable(matchingRows, { compact: true, numbered: true, rowLimit: 8 }))
  } else if (execution.innerResult) {
    innerCard.append(createNode('p', 'correlated-stage-copy', 'The inner SELECT returns this value:'))
    innerCard.append(renderTable(execution.innerResult, { compact: true, numbered: true, rowLimit: 8 }))
  }
  const innerSql = createNode('details', 'step-sql correlated-inner-sql')
  innerSql.append(createNode('summary', '', 'See the inner SQL for this row'))
  const innerSqlCode = createNode('pre', 'step-sql-code')
  innerSqlCode.append(createNode('code', '', execution.innerSql))
  innerSql.append(innerSqlCode)
  innerCard.append(innerSql)

  const appendCard = createNode('article', 'correlated-stage-card correlated-stage-card--added')
  appendCard.append(createNode('p', 'correlated-stage-label', '03 · APPEND A NEW COLUMN'))
  appendCard.append(createNode('h4', '', step.innerExpression))
  appendCard.append(createNode('p', 'correlated-stage-copy', 'Put the inner query’s scalar answer beside this outer row. Move to the next row; WHERE has not run yet.'))
  const value = createNode('div', 'correlated-average-result')
  value.append(createNode('span', '', 'Value added to this row'))
  const scalar = createNode('strong', '')
  appendCorrelatedValue(scalar, execution.scalarValue)
  value.append(scalar)
  appendCard.append(value)

  flow.replaceChildren(outerCard, createNode('span', 'correlated-flow-arrow', '→'), innerCard, createNode('span', 'correlated-flow-arrow', '→'), appendCard)

  const resultTable = sequence.querySelector('.correlated-result-table')
  const resultRows = (step.outerRows || []).map((row, rowIndex) => {
    const finished = rowIndex <= index && executions[rowIndex]
    return [...row, finished ? executions[rowIndex].scalarValue : 'Waiting']
  })
  resultTable.replaceChildren(
    createNode('h4', 'visual-subheading', 'The outer table gains one column, row by row'),
    createNode('p', 'visual-caption', 'Completed rows keep their calculated value. Rows after the current one are still waiting for their inner query result.'),
    renderTable({ columns: step.result.columns, rows: resultRows, totalRows: total }, { rowLimit: 40, numbered: true }),
  )
}

function formatCorrelatedValue(value) {
  if (typeof value !== 'number') return value === null || value === undefined ? 'NULL' : String(value)
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function appendCorrelatedValue(parent, value) {
  if (typeof value === 'number') parent.textContent = formatCorrelatedValue(value)
  else appendValue(parent, value)
}

function renderMembershipSubqueryVisual(parent, step) {
  const flow = createNode('div', 'subquery-flow')
  const innerCard = createNode('section', 'subquery-flow-card')
  innerCard.append(createNode('span', 'subquery-flow-number', '01 · INNER QUERY'))
  innerCard.append(createNode('h4', '', 'Find the allowed values'))
  innerCard.append(createNode('p', 'visual-caption', 'This query runs once and returns a one-column set.'))
  innerCard.append(renderTable(step.innerResult, { compact: true, rowLimit: 16, numbered: true }))
  const setCard = createNode('section', 'subquery-flow-card subquery-flow-card--set')
  setCard.append(createNode('span', 'subquery-flow-number', '02 · VALUE SET'))
  setCard.append(createNode('h4', '', `${step.membershipValues.length} values to check`))
  const valueSet = createNode('div', 'query-value-set')
  step.membershipValues.slice(0, 24).forEach((value) => {
    const chip = createNode('span', 'query-value-chip')
    appendValue(chip, value)
    valueSet.append(chip)
  })
  if (!step.membershipValues.length) valueSet.append(createNode('span', 'visual-caption', 'The inner query returned no values.'))
  setCard.append(valueSet)
  flow.append(innerCard, createNode('span', 'subquery-flow-arrow', '→'), setCard)
  parent.append(flow)

  parent.append(createNode('h4', 'visual-subheading', `03 · Check each outer row against ${step.operator}`))
  parent.append(createNode('p', 'visual-caption', `The highlighted value from each employee row is compared with the set above. A passing condition keeps the row; a non-match or UNKNOWN is filtered out.`))
  parent.append(renderTable(step.result, {
    rowLimit: 40,
    rowStatus: (index) => step.filterFlags[index],
    statusKept: 'Condition passed',
    statusRemoved: 'Filtered out',
    reason: 'No matching value, or the result was UNKNOWN',
  }))
  if (step.capped) parent.append(createNode('p', 'table-overflow-note', 'The visual set or row list is shortened to keep the walkthrough readable. The Results tab shows the complete query output.'))
}

function renderExistsSubqueryVisual(parent, step) {
  const flow = createNode('div', 'subquery-flow subquery-flow--exists')
  const outerCard = createNode('section', 'subquery-flow-card')
  outerCard.append(createNode('span', 'subquery-flow-number', '01 · OUTER ROW'))
  outerCard.append(createNode('h4', '', 'Take one employee'))
  outerCard.append(createNode('p', 'visual-caption', step.executions[0]?.referenceValues.length
    ? `Use ${step.executions[0].referenceValues.map((reference) => reference.label).join(', ')} from this employee as the lookup key.`
    : 'The outer row is checked against the inner query.'))
  const lookupCard = createNode('section', 'subquery-flow-card')
  lookupCard.append(createNode('span', 'subquery-flow-number', '02 · INNER LOOKUP'))
  lookupCard.append(createNode('h4', '', step.negated ? 'Look for any order' : 'Look for a matching order'))
  lookupCard.append(createNode('p', 'visual-caption', step.negated
    ? 'NOT EXISTS is true only when this lookup returns zero rows.'
    : 'EXISTS becomes true as soon as this lookup returns at least one row.'))
  if (step.executions[0]?.nestedValues.length) {
    const average = step.executions[0].nestedValues[0]
    lookupCard.append(createNode('p', 'subquery-average-note', `${average.label} for the example employee: ${average.value === null ? 'NULL' : String(average.value)}`))
  }
  const decisionCard = createNode('section', 'subquery-flow-card subquery-flow-card--decision')
  decisionCard.append(createNode('span', 'subquery-flow-number', '03 · KEEP OR FILTER'))
  decisionCard.append(createNode('h4', '', step.negated ? 'Keep rows with no matches' : 'Keep rows with a match'))
  decisionCard.append(createNode('p', 'visual-caption', 'Each employee gets its own yes/no decision. The table below shows the actual lookup count.'))
  flow.append(outerCard, createNode('span', 'subquery-flow-arrow', '→'), lookupCard, createNode('span', 'subquery-flow-arrow', '→'), decisionCard)
  parent.append(flow)

  parent.append(createNode('h4', 'visual-subheading', 'Employee-by-employee decisions'))
  parent.append(renderTable(step.result, {
    rowLimit: 40,
    rowStatus: (index) => step.executions[index]?.passed,
    statusKept: 'Kept by EXISTS',
    statusRemoved: 'Filtered out',
    reason: step.negated ? 'At least one matching row exists' : 'The inner lookup returned no rows',
  }))

  const executions = step.executions.slice(0, 8)
  if (executions.length) {
    parent.append(createNode('h4', 'visual-subheading', 'Open a row to inspect its inner lookup'))
    const list = createNode('div', 'subquery-execution-list')
    executions.forEach((execution) => {
      const details = createNode('details', 'subquery-execution')
      details.open = execution.rowNumber === 1
      const correlations = execution.referenceValues.map((reference) => `${reference.label} = ${reference.value === null ? 'NULL' : String(reference.value)}`)
      const label = correlations.length ? correlations.join(', ') : 'outer row'
      details.append(createNode('summary', '', `Employee ${execution.rowNumber} · ${label} · ${execution.matchCount} inner ${execution.matchCount === 1 ? 'row' : 'rows'}`))
      details.append(createNode('p', 'visual-caption', execution.decision + '.'))
      execution.nestedValues.forEach((nested) => {
        details.append(createNode('p', 'subquery-average-note', `${nested.label} = ${nested.value === null ? 'NULL' : String(nested.value)}`))
      })
      if (execution.matchingResult.rows.length) {
        details.append(createNode('p', 'visual-caption', 'Matching order rows:'))
        details.append(renderTable(execution.matchingResult, { compact: true, rowLimit: 8, numbered: true }))
      } else {
        details.append(createNode('p', 'visual-caption', 'No order rows matched this employee.'))
      }
      const code = createNode('details', 'step-sql')
      code.append(createNode('summary', '', 'Inner SQL with this employee value'))
      const pre = createNode('pre', 'step-sql-code')
      pre.append(createNode('code', '', execution.innerSql))
      code.append(pre)
      details.append(code)
      list.append(details)
    })
    parent.append(list)
  }
  if (executions.length < step.result.totalRows && !step.capped) {
    parent.append(createNode('p', 'table-overflow-note', `The table above shows every employee decision. Detailed inner-query rows are expanded for the first ${executions.length} employees.`))
  }
  if (step.capped) parent.append(createNode('p', 'table-overflow-note', `The visual expands the first ${executions.length} outer rows. The Results tab still shows the full query result.`))
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
  const rows = input?.rows || []
  if (!rows.length) {
    parent.append(createEmptyState('No input rows for WHERE', 'There are no rows to evaluate at this stage.'))
    return
  }

  parent.append(createNode('h4', 'visual-subheading', 'Follow WHERE one input row at a time'))
  parent.append(createNode('p', 'visual-caption', 'Use Next row to see the condition evaluated against each row. WHERE keeps TRUE and filters out FALSE or UNKNOWN.'))
  const sequence = createNode('section', 'correlated-walkthrough')
  const navigation = createNode('div', 'correlated-walkthrough-navigation')
  const previousButton = createNode('button', 'button button--quiet correlated-row-button', '← Previous row')
  previousButton.type = 'button'
  previousButton.addEventListener('click', () => {
    if (autoplayTimer) stopAutoplay()
    activeWhereExecutionIndex = Math.max(0, activeWhereExecutionIndex - 1)
    updateWhereExecutionSequence(sequence, step, input, previousButton, nextButton, counter, progressFill)
  })
  const counter = createNode('p', 'correlated-row-counter')
  counter.setAttribute('aria-live', 'polite')
  counter.setAttribute('aria-atomic', 'true')
  const nextButton = createNode('button', 'button button--primary correlated-row-button', 'Next row →')
  nextButton.type = 'button'
  nextButton.addEventListener('click', () => {
    if (autoplayTimer) stopAutoplay()
    activeWhereExecutionIndex = Math.min(rows.length - 1, activeWhereExecutionIndex + 1)
    updateWhereExecutionSequence(sequence, step, input, previousButton, nextButton, counter, progressFill)
  })
  navigation.append(previousButton, counter, nextButton)

  const progressTrack = createNode('div', 'correlated-row-progress')
  progressTrack.setAttribute('role', 'progressbar')
  progressTrack.setAttribute('aria-label', 'Rows checked by WHERE')
  progressTrack.setAttribute('aria-valuemin', '1')
  progressTrack.setAttribute('aria-valuemax', String(input.totalRows || rows.length))
  const progressFill = createNode('span', 'correlated-row-progress-fill')
  progressTrack.append(progressFill)
  const flow = createNode('div', 'where-row-flow')
  sequence.append(navigation, progressTrack, flow)
  parent.append(sequence)

  const glance = createNode('section', 'where-glance')
  glance.append(createNode('h4', 'visual-subheading', 'All rows at a glance'))
  glance.append(createNode('p', 'visual-caption', 'Green rows pass the condition. Struck-through rows are removed. Click any row to inspect it in the walkthrough above.'))
  const glanceTable = renderTable(input, {
    compact: true,
    rowLimit: 40,
    rowStatus: (index) => Boolean(step.filterFlags?.[index]),
    statusKept: 'TRUE · kept',
    statusRemoved: 'Removed',
    reason: 'FALSE or UNKNOWN',
  })
  glance.append(glanceTable)
  parent.append(glance)
  glanceTable.querySelectorAll('tbody tr').forEach((tr, rowIndex) => {
    tr.classList.add('is-clickable')
    tr.addEventListener('click', () => {
      if (autoplayTimer) stopAutoplay()
      activeWhereExecutionIndex = rowIndex
      updateWhereExecutionSequence(sequence, step, input, previousButton, nextButton, counter, progressFill)
    })
  })

  activeWhereExecutionIndex = 0
  updateWhereExecutionSequence(sequence, step, input, previousButton, nextButton, counter, progressFill)
  if (input.totalRows > rows.length || input.truncated) {
    parent.append(createNode('p', 'table-overflow-note', `This walkthrough can step through ${rows.length} of ${input.totalRows} input rows.`))
  }
}

function updateWhereExecutionSequence(sequence, step, input, previousButton, nextButton, counter, progressFill) {
  const rows = input.rows || []
  const index = activeWhereExecutionIndex
  const row = rows[index]
  if (!row) return
  const total = input.totalRows || rows.length
  const passed = Boolean(step.filterFlags?.[index])
  const rawResult = step.filterResults?.[index]
  const truth = rawResult === null || rawResult === undefined ? 'UNKNOWN' : Boolean(rawResult) ? 'TRUE' : 'FALSE'
  counter.textContent = `ROW ${index + 1} OF ${total}`
  previousButton.disabled = index === 0
  nextButton.disabled = index === rows.length - 1
  progressFill.parentElement.setAttribute('aria-valuenow', String(index + 1))
  progressFill.style.width = `${Math.round(((index + 1) / total) * 100)}%`

  const nameIndex = input.columns.findIndex((column) => normalizeColumn(column).split('.').at(-1) === 'name')
  const rowName = nameIndex >= 0 ? row[nameIndex] : `Input row ${index + 1}`
  const inputCard = createNode('article', 'correlated-stage-card correlated-stage-card--outer')
  inputCard.append(createNode('p', 'correlated-stage-label', '01 · INPUT ROW'))
  inputCard.append(createNode('h4', '', String(rowName)))
  inputCard.append(createNode('p', 'correlated-stage-copy', step.subqueryValueColumn
    ? `This row carries the ${step.subqueryExpression} value calculated in the previous stage. WHERE can now check the full row.`
    : 'This row reaches the WHERE clause before any filtering happens.'))
  inputCard.append(renderTable({ columns: input.columns, rows: [row], totalRows: 1 }, { compact: true }))

  const checkCard = createNode('article', 'correlated-stage-card correlated-stage-card--inner')
  checkCard.append(createNode('p', 'correlated-stage-label', '02 · EVALUATE WHERE'))
  checkCard.append(createNode('code', 'where-condition-code', step.filterReason))
  checkCard.append(createNode('p', 'correlated-stage-copy', step.subqueryValueColumn
    ? 'Now evaluate the WHERE condition using the values in this row, including the subquery result column.'
    : 'SQL evaluates this condition using the values in the input row.'))
  if (step.subqueryValueColumn) {
    const subqueryIndex = input.columns.indexOf(step.subqueryValueColumn)
    const subqueryValue = row[subqueryIndex]
    const valueNote = createNode('div', 'correlated-key')
    valueNote.append(createNode('span', '', `Value from previous stage · ${step.subqueryExpression}`))
    const value = createNode('strong', '')
    appendCorrelatedValue(value, subqueryValue)
    valueNote.append(value)
    checkCard.append(valueNote)
  }
  checkCard.append(createNode('div', `where-truth-result${truth === 'TRUE' ? ' is-true' : truth === 'FALSE' ? ' is-false' : ' is-unknown'}`, truth))

  const decisionCard = createNode('article', `correlated-stage-card correlated-stage-card--decision${passed ? ' is-kept' : ' is-dropped'}`)
  decisionCard.append(createNode('p', 'correlated-stage-label', '03 · ROW DECISION'))
  decisionCard.append(createNode('h4', '', passed ? 'Keep this row' : 'Filter out this row'))
  decisionCard.append(createNode('div', `correlated-decision-badge${passed ? ' is-kept' : ' is-dropped'}`, passed ? 'KEEP ROW' : 'DROP ROW'))
  decisionCard.append(createNode('p', 'correlated-stage-copy', passed
    ? 'The condition is TRUE, so the row moves on to the next query stage.'
    : truth === 'UNKNOWN'
      ? 'The condition is UNKNOWN. WHERE keeps only rows where the condition is TRUE.'
      : 'The condition is FALSE, so the row is removed before the next query stage.'))

  sequence.querySelector('.where-row-flow').replaceChildren(inputCard, createNode('span', 'correlated-flow-arrow', '→'), checkCard, createNode('span', 'correlated-flow-arrow', '→'), decisionCard)
  sequence.parentElement?.querySelectorAll('.where-glance tbody tr').forEach((tr, rowIndex) => tr.classList.toggle('is-current-row', rowIndex === index))
}

function renderJoinVisual(parent, step) {
  const input = step.input || { columns: [], rows: [], totalRows: 0 }
  const comparison = createNode('div', 'join-comparison')
  const left = createNode('section', 'comparison-card')
  left.append(createNode('div', 'comparison-heading', step.isSelfJoin
    ? `${step.joinLeftTable} AS ${step.joinLeftAlias} · first table role`
    : 'Left-side rows'))
  left.append(renderTable(input, { compact: true, rowLimit: 20 }))
  const right = createNode('section', 'comparison-card')
  right.append(createNode('div', 'comparison-heading', step.isSelfJoin
    ? `${step.joinRightTable} AS ${step.joinRightAlias} · second table role`
    : `${step.joinTable} join source`))
  right.append(renderTable(step.joinRight || { columns: [], rows: [], totalRows: 0 }, { compact: true, rowLimit: step.isSelfJoin ? 20 : 8 }))
  comparison.append(left, createNode('div', `join-connector${step.isSelfJoin ? ' join-connector--self' : ''}`, step.isSelfJoin ? 'JOIN' : '↔'), right)
  parent.append(createNode('h4', 'visual-subheading', step.isSelfJoin ? 'One table, two aliases' : 'Match related records'))
  parent.append(comparison)

  if (step.isSelfJoin) {
    const explanation = createNode('div', 'self-join-explanation')
    explanation.append(createNode('p', 'self-join-intro', `SQL reads ${step.joinLeftTable} twice. The left copy has alias ${step.joinLeftAlias}; the second copy has alias ${step.joinRightAlias}. The aliases let the query refer to each copy separately.`))
    const condition = createNode('div', 'self-join-condition')
    condition.append(createNode('span', 'self-join-condition-label', 'COMPARE THESE COLUMNS'))
    condition.append(createNode('code', '', step.joinCondition || 'Join condition'))
    explanation.append(condition)
    const joinBehavior = step.joinType.toUpperCase().includes('LEFT')
      ? `LEFT JOIN keeps every ${step.joinLeftAlias} row. If no ${step.joinRightAlias} row matches, the right-side values are NULL.`
      : step.joinType.toUpperCase().includes('RIGHT')
        ? `RIGHT JOIN keeps every ${step.joinRightAlias} row. If no ${step.joinLeftAlias} row matches, the left-side values are NULL.`
        : step.joinType.toUpperCase().includes('FULL')
          ? 'FULL JOIN keeps unmatched rows from both copies, filling the missing side with NULL.'
          : 'Only row pairs from the two copies that satisfy this condition are kept.'
    explanation.append(createNode('p', 'self-join-intro', `For each row in the left copy, SQL looks for matching row(s) in the right copy. ${joinBehavior}`))
    parent.append(explanation)
  }

  const output = createNode('section', 'join-output')
  output.append(createNode('div', 'comparison-heading', `${step.joinType} JOIN output · ${step.result.totalRows} ${step.result.totalRows === 1 ? 'row' : 'rows'}`))
  if (step.isSelfJoin) {
    output.append(renderTable(step.joinDisplayResult || step.result, { rowLimit: 40 }))
  } else {
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
  }
  parent.append(output)
}

function renderGroupVisual(parent, step) {
  parent.append(createNode('h4', 'visual-subheading', 'Rows collected into groups'))
  const groupGrid = createNode('div', 'group-grid')
  if (!step.buckets.length) {
    groupGrid.append(createNode('p', 'empty-inline', 'No groups were created from these rows.'))
  }
  const largestBucket = Math.max(1, ...step.buckets.map((bucket) => bucket.count))
  step.buckets.slice(0, 40).forEach((bucket, index) => {
    const card = createNode('article', 'group-card')
    const cardHead = createNode('div', 'group-card-head')
    cardHead.append(createNode('span', 'group-number', `Group ${index + 1}`))
    cardHead.append(createNode('span', 'group-size', `${bucket.count} ${bucket.count === 1 ? 'row' : 'rows'}`))
    card.append(cardHead)
    const sizeBar = createNode('span', 'group-bar')
    const sizeFill = createNode('span', 'group-bar-fill')
    sizeFill.style.width = `${Math.max(6, Math.round((bucket.count / largestBucket) * 100))}%`
    sizeBar.append(sizeFill)
    card.append(sizeBar)
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
  parent.append(createNode('h4', 'visual-subheading', 'Sort keys, then read the arranged rows'))
  const sortKeys = renderSortKeys(step.sortKeys, 'ORDER BY · sort priority')
  if (sortKeys) parent.append(sortKeys)
  parent.append(createNode('p', 'visual-caption', `The table below is the result after applying the ORDER BY keys in priority order. ${step.result.totalRows} ${step.result.totalRows === 1 ? 'row' : 'rows'} are shown.`))
  parent.append(renderTable(step.result, { rowLimit: 40, numbered: true }))
  if (input && step.result.rows.length === 0) parent.append(createNode('p', 'empty-inline', 'There were no rows to sort.'))
}

function renderSortKeys(keys, heading = 'ORDER BY · sort priority') {
  if (!keys?.length) return null
  const section = createNode('section', 'sort-key-visual')
  section.append(createNode('p', 'sort-key-heading', heading))
  const list = createNode('div', 'sort-key-list')
  keys.forEach((key, index) => {
    const descending = String(key.direction).toUpperCase() === 'DESC'
    const item = createNode('article', `sort-key-card${descending ? ' is-descending' : ' is-ascending'}`)
    item.append(createNode('span', 'sort-key-number', `KEY ${index + 1}`))
    item.append(createNode('strong', 'sort-key-expression', key.expression))
    item.append(createNode('span', 'sort-key-direction', `${descending ? '↓' : '↑'} ${descending ? 'DESC' : 'ASC'}`))
    item.append(createNode('small', 'sort-key-explanation', descending ? 'Descending · larger / later values first' : 'Ascending · smaller / earlier values first'))
    list.append(item)
  })
  section.append(list)
  section.append(createNode('p', 'sort-key-note', keys.length > 1
    ? 'SQL sorts by Key 1 first. When rows tie on a key, it uses the next key to decide their order.'
    : 'SQL arranges every row using this one sort key.'))
  return section
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
  if (step.id === 'from') {
    parent.append(createNode('h4', 'visual-subheading', 'Starting rows'))
    parent.append(createNode('p', 'visual-caption', 'Every row of the table enters the pipeline. Later stages filter, group or reshape these rows.'))
  }
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
    showStep(activeStepIndex + 1, { fromAutoplay: true })
  }, 1500)
}

function stopAutoplay() {
  if (autoplayTimer) window.clearInterval(autoplayTimer)
  autoplayTimer = null
  const button = $('[data-step-control="autoplay"]')
  if (button) button.textContent = '▶ Auto-play'
}

function updateWalkthroughFocusState(focused) {
  const isFocused = Boolean(focused)
  outputPanel.classList.toggle('is-focused', isFocused)
  document.body.classList.toggle('walkthrough-focused', isFocused)
  const button = $('[data-step-control="focus"]')
  if (button) {
    button.setAttribute('aria-pressed', String(isFocused))
    button.textContent = isFocused ? 'Exit focus view' : 'Focus view'
  }
}

async function setWalkthroughFocus(focused) {
  const isFocused = Boolean(focused)
  if (isFocused) {
    if (typeof outputPanel.requestFullscreen === 'function') {
      try {
        await outputPanel.requestFullscreen()
        outputPanel.classList.add('uses-native-fullscreen')
        updateWalkthroughFocusState(true)
        return
      } catch {
        // Keep the expanded in-page view available when fullscreen is blocked.
      }
    }
    updateWalkthroughFocusState(true)
    return
  }

  if (document.fullscreenElement === outputPanel) {
    outputPanel.classList.remove('uses-native-fullscreen')
    try {
      await document.exitFullscreen()
    } catch {
      // The in-page focus view still closes if fullscreen exit is unavailable.
    }
  }
  updateWalkthroughFocusState(false)
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
