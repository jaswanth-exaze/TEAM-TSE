/*
 * Isolated SQL execution for the static learning lab.
 * Keep versions pinned here; this file is served as a classic Worker.
 */
const SQL_JS_CDN_BASE = 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/'
const SQL_JS_CDN_SCRIPT = `${SQL_JS_CDN_BASE}sql-wasm.js`
const PARSER_CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/node-sql-parser@5.4.0/umd/mysql.umd.js'
const VENDOR_BASE = new URL('./vendor/', self.location.href).toString()
const MAX_RESULT_ROWS = 5000
const MAX_SCANNED_ROWS = 100000
const MAX_SANDBOX_ROWS_PER_TABLE = 25000
const MAX_SANDBOX_DATABASE_BYTES = 8 * 1024 * 1024
const MAX_INSERT_ROWS_PER_STATEMENT = 1000
const MAX_HISTORY_STATES = 31
const MAX_HISTORY_BYTES = 32 * 1024 * 1024
const MAX_SCRIPT_STATEMENTS = 50
const MYSQL_OPTIONS = { database: 'MySQL' }

let SQL = null
let parser = null
let queryDatabase = null
let sandboxDatabase = null
let schemaSql = ''
let sandboxHistory = []
let sandboxHistoryIndex = -1
let transactionSnapshot = null
let transactionOpen = false
let savepointStack = []

self.addEventListener('message', async (event) => {
  const { requestId, type, payload = {} } = event.data || {}
  try {
    let result
    if (type === 'init') {
      schemaSql = String(payload.schemaSql || '')
      await loadDependencies()
      await createDatabases(payload.sandboxSnapshot || null)
      result = { ready: true, schema: getSchemaSummary(queryDatabase), sandboxSchema: getSchemaSummary(sandboxDatabase) }
    } else if (type === 'run') {
      if (!queryDatabase || !sandboxDatabase || !parser) throw new Error('The SQL engine is not ready. Retry the engine and try again.')
      result = payload.mode === 'sandbox'
        ? executeSandboxScript(payload.sql, payload)
        : executeQuerySelect(payload.sql)
    } else if (type === 'reset') {
      await createDatabases()
      result = { reset: true, schema: getSchemaSummary(queryDatabase), sandboxSchema: getSchemaSummary(sandboxDatabase), sandboxSnapshot: exportSandboxDatabase() }
    } else if (type === 'history') {
      result = { undo: sandboxHistoryIndex > 0, redo: sandboxHistoryIndex >= 0 && sandboxHistoryIndex < sandboxHistory.length - 1,
        activeTransaction: transactionOpen, schema: getSchemaSummary(sandboxDatabase) }
    } else if (type === 'undo' || type === 'redo') {
      result = moveSandboxHistory(type === 'undo' ? -1 : 1)
      result.sandboxSnapshot = exportSandboxDatabase()
    } else {
      throw new Error('Unknown SQL engine request.')
    }
    self.postMessage({ requestId, ok: true, result })
  } catch (error) {
    self.postMessage({
      requestId,
      ok: false,
      error: { message: String(error?.message || error), code: error?.code || 'QUERY_FAILED' },
    })
  }
})

async function loadDependencies() {
  if (!SQL) {
    let localSqlLoaded = false
    if (!self.initSqlJs) {
      try {
        importScripts(`${VENDOR_BASE}sql-wasm.js`)
        localSqlLoaded = Boolean(self.initSqlJs)
      } catch {
        importScripts(SQL_JS_CDN_SCRIPT)
      }
    }
    if (!self.NodeSQLParser?.Parser) {
      try {
        importScripts(`${VENDOR_BASE}mysql.umd.js`)
      } catch {
        importScripts(PARSER_CDN_SCRIPT)
      }
    }
    if (!self.initSqlJs || !self.NodeSQLParser?.Parser) {
      throw new Error('A required SQL engine dependency did not load. Check your connection and retry.')
    }
    try {
      SQL = await self.initSqlJs({ locateFile: (file) => `${localSqlLoaded ? VENDOR_BASE : SQL_JS_CDN_BASE}${file}` })
    } catch (localError) {
      if (!localSqlLoaded) throw localError
      SQL = await self.initSqlJs({ locateFile: (file) => `${SQL_JS_CDN_BASE}${file}` })
    }
    parser = new self.NodeSQLParser.Parser()
  }
}

async function createDatabases(sandboxBytes = null) {
  if (!SQL || !schemaSql) throw new Error('The sample database could not be loaded.')
  queryDatabase?.close()
  sandboxDatabase?.close()
  queryDatabase = new SQL.Database()
  sandboxDatabase = sandboxBytes ? new SQL.Database(sandboxBytes) : new SQL.Database()
  queryDatabase.run(schemaSql)
  if (!sandboxBytes) sandboxDatabase.run(schemaSql)
  // Schema setup runs before this switch. User SQL is prepared only afterward.
  queryDatabase.run('PRAGMA query_only = ON;')
  queryDatabase.run('PRAGMA trusted_schema = OFF;')
  sandboxDatabase.run('PRAGMA foreign_keys = ON;')
  sandboxDatabase.run('PRAGMA trusted_schema = OFF;')
  sandboxHistory = [{ bytes: exportSandboxDatabase(), label: sandboxBytes ? 'Recovered sandbox checkpoint' : 'Original sample data' }]
  sandboxHistoryIndex = 0
  transactionSnapshot = null
  transactionOpen = false
  savepointStack = []
}

function executeQuerySelect(sql) {
  assertReadOnlySelect(sql)
  return executeSelect(queryDatabase, sql)
}

function assertReadOnlySelect(sql) {
  const source = String(sql || '')
  const statementCount = countStatements(source)
  if (statementCount === 0) throw new Error('Write a SELECT query before running it.')
  if (statementCount > 1) {
    const error = new Error('Run one SELECT statement at a time. Multiple statements are not allowed.')
    error.code = 'MULTIPLE_STATEMENTS'
    throw error
  }

  let parsed
  try {
    parsed = parser.astify(source, MYSQL_OPTIONS)
  } catch (error) {
    const wrapped = new Error(`This SQL could not be verified as a read-only SELECT. ${error?.message || ''}`.trim())
    wrapped.code = 'UNVERIFIED_SQL'
    throw wrapped
  }
  const statements = Array.isArray(parsed) ? parsed : [parsed]
  if (statements.length !== 1 || statements[0]?.type !== 'select') {
    const error = new Error('Only read-only SELECT queries are allowed in this lab.')
    error.code = 'READ_ONLY'
    throw error
  }

  // SQL.js ships a fixed SQLite build. These dangerous extension functions are
  // denied explicitly even if a future build registers them by default.
  if (containsBlockedFunction(statements[0])) {
    const error = new Error('This query calls a file or extension function that is disabled in the learning lab.')
    error.code = 'READ_ONLY_FUNCTION'
    throw error
  }
}

function containsBlockedFunction(node) {
  if (!node || typeof node !== 'object') return false
  if (Array.isArray(node)) return node.some(containsBlockedFunction)
  const rawName = node.name?.name || node.name || ''
  const name = (Array.isArray(rawName)
    ? rawName.map((part) => part?.value || '').join('.')
    : rawName?.value || rawName).toString().replace(/[`"']/g, '').toLowerCase()
  if (node.type === 'function' && ['load_extension', 'readfile', 'writefile', 'fts3_tokenizer'].includes(name)) return true
  return Object.values(node).some(containsBlockedFunction)
}

function executeSelect(db, sql) {
  let statement
  try {
    statement = db.prepare(String(sql))
    const columns = statement.getColumnNames()
    const rows = []
    let totalRows = 0
    while (statement.step()) {
      totalRows += 1
      if (totalRows > MAX_SCANNED_ROWS) {
        const error = new Error(`This query produces more than ${MAX_SCANNED_ROWS.toLocaleString()} rows. Add a LIMIT to keep the result manageable.`)
        error.code = 'RESULT_TOO_LARGE'
        throw error
      }
      if (rows.length < MAX_RESULT_ROWS) rows.push(statement.get())
    }
    return {
      columns,
      rows,
      totalRows,
      truncated: totalRows > MAX_RESULT_ROWS,
    }
  } finally {
    statement?.free()
  }
}

function executeSandboxScript(sql, options = {}) {
  const statements = splitSqlStatements(String(sql || ''))
  if (!statements.length) throw makeError('Write a SQL statement before running it.', 'EMPTY_QUERY')
  if (statements.length > MAX_SCRIPT_STATEMENTS) {
    throw makeError(`A sandbox script can contain at most ${MAX_SCRIPT_STATEMENTS} statements.`, 'SCRIPT_TOO_LARGE')
  }

  // Validate the entire script before it can make any changes.
  const parsedStatements = statements.map((statement) => ({
    sql: statement,
    ast: parseSandboxStatement(statement),
  }))
  const pendingConfirmations = parsedStatements.filter(({ ast }) => {
    const hasJoinPredicate = [...(ast.table || []), ...(ast.from || [])].some((entry) => entry?.on || entry?.using)
    return ['update', 'delete', 'truncate'].includes(ast.type) && !ast.where && !hasJoinPredicate && !options.confirmed
  })
  if (pendingConfirmations.length) {
    return {
      kind: 'script',
      confirmationRequired: pendingConfirmations.map(({ ast }) => {
        const table = getTargetTable(ast)
        return { operation: ast.type.toUpperCase(), table, rowCount: table ? countTableRows(sandboxDatabase, table) : 0 }
      }),
      statements: [],
      transaction: transactionState(),
      schema: getSchemaSummary(sandboxDatabase),
      history: historyState(),
    }
  }

  const output = []
  for (const { sql: statementSql, ast } of parsedStatements) {
    const startedAt = performance.now()
    const beforeSchema = getSchemaSummary(sandboxDatabase)
    const target = getTargetTable(ast)
    const before = target ? readTableSnapshot(sandboxDatabase, target) : null
    const transactionAction = classifyTransaction(statementSql, ast)
    const dependencyWarning = ast.type === 'drop' ? getDropDependencyWarning(sandboxDatabase, ast) : ''
    const databaseBefore = transactionAction ? getDatabaseSnapshot(sandboxDatabase) : null
    const priorBytes = transactionOpen || ast.type === 'select' || ast.type === 'transaction' ? null : exportSandboxDatabase()
    let result
    try {
      if (transactionAction === 'begin' && !transactionOpen) {
        transactionSnapshot = exportSandboxDatabase()
        sandboxDatabase.run(statementSql)
        transactionOpen = true
        savepointStack = []
      } else if (transactionAction === 'begin' && transactionOpen) {
        throw makeError('A transaction is already open. Commit or roll it back before starting another.', 'TRANSACTION_MISUSE')
      } else if (transactionAction === 'commit') {
        if (!transactionOpen) throw makeError('There is no active transaction to commit. Start one with BEGIN first.', 'TRANSACTION_MISUSE')
        sandboxDatabase.run(statementSql)
        transactionOpen = false
        savepointStack = []
        if (transactionSnapshot) saveCurrentSandboxSnapshot('Committed transaction')
        transactionSnapshot = null
      } else if (transactionAction === 'rollback') {
        if (!transactionOpen) throw makeError('There is no active transaction to roll back. Start one with BEGIN first.', 'TRANSACTION_MISUSE')
        sandboxDatabase.run(statementSql)
        transactionOpen = false
        savepointStack = []
        transactionSnapshot = null
      } else if (transactionAction === 'savepoint') {
        if (!transactionOpen) transactionSnapshot = exportSandboxDatabase()
        sandboxDatabase.run(statementSql)
        transactionOpen = true
        savepointStack.push(getSavepointName(statementSql))
      } else if (transactionAction === 'rollback-to') {
        if (!transactionOpen) throw makeError('There is no active savepoint to roll back to.', 'TRANSACTION_MISUSE')
        sandboxDatabase.run(statementSql)
        const name = getSavepointName(statementSql)
        const index = savepointStack.map((value) => value.toLowerCase()).lastIndexOf(name.toLowerCase())
        if (index >= 0) savepointStack = savepointStack.slice(0, index + 1)
      } else if (transactionAction === 'release') {
        if (!transactionOpen) throw makeError('There is no active savepoint to release.', 'TRANSACTION_MISUSE')
        sandboxDatabase.run(statementSql)
        const name = getSavepointName(statementSql)
        const index = savepointStack.map((value) => value.toLowerCase()).lastIndexOf(name.toLowerCase())
        if (index >= 0) savepointStack = savepointStack.slice(0, index)
        if (!savepointStack.length) {
          transactionOpen = false
          if (transactionSnapshot) saveCurrentSandboxSnapshot('Released savepoint transaction')
          transactionSnapshot = null
        }
      } else {
        result = runSandboxStatement(statementSql, ast)
      }
      if (['insert', 'replace'].includes(ast.type) && (result?.affectedRows || 0) > MAX_INSERT_ROWS_PER_STATEMENT) {
        throw makeError(`A single INSERT can add at most ${MAX_INSERT_ROWS_PER_STATEMENT.toLocaleString()} rows. Split this into smaller statements.`, 'SANDBOX_INSERT_LIMIT')
      }
      if (result?.write) {
        enforceSandboxLimits()
        if (!transactionOpen) saveCurrentSandboxSnapshot(`${ast.type.toUpperCase()} ${target || ''}`.trim())
      }
      const after = target ? readTableSnapshot(sandboxDatabase, target) : null
      output.push({
        index: output.length + 1,
        type: ast.type,
        sql: statementSql,
        ok: true,
        columns: result?.columns || [],
        rows: result?.rows || [],
        totalRows: result?.totalRows || 0,
        affectedRows: result?.affectedRows || 0,
        before,
        after,
        databaseBefore,
        databaseAfter: transactionAction ? getDatabaseSnapshot(sandboxDatabase) : null,
        schemaBefore: beforeSchema,
        schemaAfter: getSchemaSummary(sandboxDatabase),
        transaction: transactionState(),
        durationMs: performance.now() - startedAt,
        note: result?.note || dependencyWarning,
      })
    } catch (error) {
      if (['SANDBOX_SIZE_LIMIT', 'SANDBOX_ROW_LIMIT', 'SANDBOX_INSERT_LIMIT'].includes(error.code)) {
        if (transactionOpen) {
          try { sandboxDatabase.run('ROLLBACK') } catch { /* Transaction may already have ended. */ }
          transactionOpen = false
          transactionSnapshot = null
        } else if (priorBytes) {
          restoreSandbox(priorBytes)
        }
      }
      output.push({
        index: output.length + 1,
        type: ast.type,
        sql: statementSql,
        ok: false,
        error: friendlySandboxError(error),
        code: error.code || 'SANDBOX_STATEMENT_FAILED',
        note: dependencyWarning,
        before,
        after: target ? readTableSnapshot(sandboxDatabase, target) : null,
        databaseBefore,
        databaseAfter: transactionAction ? getDatabaseSnapshot(sandboxDatabase) : null,
        schemaBefore: beforeSchema,
        schemaAfter: getSchemaSummary(sandboxDatabase),
        transaction: transactionState(),
        durationMs: performance.now() - startedAt,
      })
      if (!options.continueOnError) break
    }
  }

  const lastSuccessfulSelect = [...output].reverse().find((entry) => entry.ok && entry.columns.length)
  return {
    kind: 'script',
    statements: output,
    finalResult: lastSuccessfulSelect
      ? { columns: lastSuccessfulSelect.columns, rows: lastSuccessfulSelect.rows, totalRows: lastSuccessfulSelect.totalRows, truncated: lastSuccessfulSelect.totalRows > MAX_RESULT_ROWS }
      : null,
    transaction: transactionState(),
    schema: getSchemaSummary(sandboxDatabase),
    history: historyState(),
    sandboxSnapshot: transactionOpen ? null : exportSandboxDatabase(),
  }
}

function parseSandboxStatement(sql) {
  const forbidden = /\b(?:ATTACH|DETACH|PRAGMA|VACUUM|LOAD_EXTENSION|CREATE\s+VIRTUAL\s+TABLE|CREATE\s+TRIGGER)\b/i
  if (forbidden.test(stripSqlComments(sql))) {
    throw makeError('This command can access files or change engine settings, so it is blocked even in Sandbox Mode.', 'SANDBOX_BLOCKED')
  }
  if (/^\s*(?:SAVEPOINT\s+[A-Za-z_]\w*|RELEASE(?:\s+SAVEPOINT)?\s+[A-Za-z_]\w*|ROLLBACK\s+TO(?:\s+SAVEPOINT)?\s+[A-Za-z_]\w*)\s*$/i.test(stripSqlComments(sql))) {
    return { type: 'transaction', savepoint: true }
  }

  let ast
  try {
    ast = parser.astify(sql, MYSQL_OPTIONS)
  } catch (error) {
    throw makeError(`I couldn't verify this statement safely. Check the SQL syntax and try again. ${error?.message || ''}`.trim(), 'SANDBOX_UNVERIFIED')
  }
  if (Array.isArray(ast)) {
    if (ast.length !== 1) throw makeError('Put one statement at a time between semicolons. Scripts are already split safely.', 'MULTIPLE_STATEMENTS')
    ast = ast[0]
  }
  const allowed = new Set(['select', 'insert', 'replace', 'update', 'delete', 'truncate', 'create', 'alter', 'drop', 'transaction'])
  if (!ast || !allowed.has(ast.type)) throw makeError('This statement type is not enabled in Sandbox Mode.', 'SANDBOX_UNSUPPORTED')
  if (containsBlockedFunction(ast)) throw makeError('File and extension functions are blocked in Sandbox Mode.', 'SANDBOX_BLOCKED')
  if (ast.type === 'create' && /\bVIRTUAL\s+TABLE\b|\bTRIGGER\b/i.test(stripSqlComments(sql))) {
    throw makeError('Virtual tables and triggers are disabled because they can extend database access beyond this sandbox.', 'SANDBOX_BLOCKED')
  }
  return ast
}

function runSandboxStatement(sql, ast) {
  if (ast.type === 'truncate') {
    const table = ast.name?.[0]?.table || ast.table?.[0]?.table
    if (!table) throw makeError('TRUNCATE needs a table name.', 'SANDBOX_SYNTAX')
    sandboxDatabase.run(`DELETE FROM ${quoteIdentifier(table)}`)
    return { write: true, affectedRows: sandboxDatabase.getRowsModified(), note: 'TRUNCATE was taught as DELETE FROM plus an identity counter reset.' }
  }

  const adapted = adaptMySqlWrite(sql, ast)
  if (ast.type === 'select') {
    const result = executeSelect(sandboxDatabase, adapted)
    return { ...result, write: false }
  }
  sandboxDatabase.run(adapted)
  const affectedRows = ['insert', 'replace', 'update', 'delete'].includes(ast.type)
    ? sandboxDatabase.getRowsModified()
    : 0
  return { write: ['insert', 'replace', 'update', 'delete', 'create', 'alter', 'drop'].includes(ast.type), affectedRows, note: mysqlWriteNote(sql, ast) }
}

function adaptMySqlWrite(sql, ast) {
  let adapted = sql.trim().replace(/;\s*$/, '')
  if (ast.type === 'update' && Array.isArray(ast.table) && ast.table.length > 1) return rewriteUpdateJoin(ast)
  if (ast.type === 'delete' && Array.isArray(ast.from) && ast.from.length > 1) return rewriteDeleteJoin(ast)
  if (ast.type === 'insert' && ast.on_duplicate_update?.set?.length) {
    const base = { ...ast, on_duplicate_update: null }
    const insertSql = parser.sqlify(base, MYSQL_OPTIONS).replace(/;\s*$/, '')
    const updates = ast.on_duplicate_update.set.map((item) => {
      const value = rewriteMySqlValuesFunction(item.value)
      return `${quoteIdentifier(item.column)} = ${parser.exprToSQL(value, MYSQL_OPTIONS)}`
    })
    return `${insertSql} ON CONFLICT DO UPDATE SET ${updates.join(', ')}`
  }
  if (ast.type === 'insert' && /^\s*INSERT\s+IGNORE\b/i.test(adapted)) {
    adapted = adapted.replace(/^\s*INSERT\s+IGNORE\b/i, 'INSERT OR IGNORE')
  }
  // SQLite's AUTOINCREMENT requires the exact INTEGER PRIMARY KEY form.
  if (ast.type === 'create') {
    adapted = adapted.replace(/\b(?:INT|BIGINT)\s+PRIMARY\s+KEY\s+AUTO_INCREMENT\b/ig, 'INTEGER PRIMARY KEY AUTO_INCREMENT')
    adapted = adapted.replace(/\bAUTO_INCREMENT\b/ig, '')
    adapted = adapted.replace(/\)\s*(?:ENGINE|TYPE)\s*=\s*[\w-]+(?:\s+(?:DEFAULT\s+)?CHARSET\s*=\s*[\w-]+)?\s*$/i, ')')
  }
  return adapted
}

function rewriteUpdateJoin(ast) {
  if (ast.orderby || ast.limit) throw makeError('UPDATE JOIN with ORDER BY or LIMIT is not supported yet. Use a WHERE condition to target rows explicitly.', 'SANDBOX_DIALECT')
  const joined = ast.table.slice(1)
  if (!joined.every(isInnerJoinEntry)) {
    throw makeError('This UPDATE join uses an outer join. Use a correlated subquery or an inner join in the sandbox.', 'SANDBOX_DIALECT')
  }
  const targetSql = renderTableSource(ast.table[0])
  const sources = joined.map(renderTableSource).join(', ')
  const assignments = (ast.set || []).map((item) => `${quoteIdentifier(item.column)} = ${parser.exprToSQL(item.value, MYSQL_OPTIONS)}`)
  if (!assignments.length) throw makeError('UPDATE needs at least one assignment after SET.', 'SANDBOX_SYNTAX')
  const predicates = [...joined.flatMap((entry, index) => getJoinPredicates(entry, ast.table[index])), ast.where].filter(Boolean)
    .map((expression) => parser.exprToSQL(expression, MYSQL_OPTIONS))
  return `UPDATE ${targetSql} SET ${assignments.join(', ')} FROM ${sources}${predicates.length ? ` WHERE ${predicates.join(' AND ')}` : ''}`
}

function rewriteDeleteJoin(ast) {
  if (ast.orderby || ast.limit) throw makeError('DELETE JOIN with ORDER BY or LIMIT is not supported yet. Use a WHERE condition to target rows explicitly.', 'SANDBOX_DIALECT')
  const target = ast.table?.[0]
  const sourceTables = ast.from || []
  const targetSource = sourceTables.find((entry) => entry.as && entry.as.toLowerCase() === String(target?.table || '').toLowerCase())
    || sourceTables.find((entry) => getTableIdentifier(entry).toLowerCase() === String(target?.table || '').toLowerCase())
  if (!targetSource) throw makeError('The DELETE join target could not be matched to a source table.', 'SANDBOX_DIALECT')
  const others = sourceTables.filter((entry) => entry !== targetSource)
  if (!others.every(isInnerJoinEntry)) {
    throw makeError('This DELETE uses an outer join. Use a correlated subquery or an inner join in the sandbox.', 'SANDBOX_DIALECT')
  }
  const conditions = [...sourceTables.slice(1).flatMap((entry, index) => getJoinPredicates(entry, sourceTables[index])), ast.where].filter(Boolean)
    .map((expression) => parser.exprToSQL(expression, MYSQL_OPTIONS))
  if (!conditions.length) throw makeError('DELETE join needs an ON or WHERE condition so it cannot remove every row.', 'SANDBOX_SAFE_UPDATE')
  const targetAlias = targetSource.as ? ` AS ${quoteIdentifier(targetSource.as)}` : ''
  const sources = others.map(renderTableSource).join(', ')
  const targetName = getTableIdentifier(targetSource)
  return `DELETE FROM ${quoteIdentifier(targetName)}${targetAlias} WHERE EXISTS (SELECT 1 FROM ${sources} WHERE ${conditions.join(' AND ')})`
}

function getJoinPredicates(entry, leftEntry) {
  if (entry?.on) return [entry.on]
  if (!entry?.using) return []
  const columns = Array.isArray(entry.using) ? entry.using : [entry.using]
  const leftName = leftEntry?.as || getTableIdentifier(leftEntry)
  const rightName = entry.as || getTableIdentifier(entry)
  return columns.map((item) => {
    const name = typeof item === 'string' ? item : item?.column || item?.value || item?.name
    if (!name) throw makeError('This USING clause could not be translated safely.', 'SANDBOX_DIALECT')
    return { type: 'binary_expr', operator: '=', left: { type: 'column_ref', table: leftName, column: name }, right: { type: 'column_ref', table: rightName, column: name } }
  })
}

function isInnerJoinEntry(entry) {
  const join = String(entry?.join || '').toUpperCase()
  return !join || join === 'JOIN' || join === 'INNER JOIN' || join === 'CROSS JOIN'
}

function getTableIdentifier(entry) {
  const table = entry?.table
  if (typeof table === 'string') return table.replace(/[`"[]]/g, '')
  return String(table?.value || '').replace(/[`"[]]/g, '')
}

function renderTableSource(entry) {
  const table = getTableIdentifier(entry)
  if (!table) throw makeError('Only named tables can be used in a joined write in this sandbox.', 'SANDBOX_DIALECT')
  return `${quoteIdentifier(table)}${entry.as ? ` AS ${quoteIdentifier(entry.as)}` : ''}`
}

function rewriteMySqlValuesFunction(node) {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(rewriteMySqlValuesFunction)
  const functionName = node.type === 'function'
    ? String(node.name?.name?.[0]?.value || '').toUpperCase()
    : ''
  if (functionName === 'VALUES') {
    const column = node.args?.value?.[0]
    if (!column || column.type !== 'column_ref') throw makeError('VALUES() in ON DUPLICATE KEY UPDATE must name an inserted column.', 'SANDBOX_UNSUPPORTED')
    return { ...column, table: 'excluded' }
  }
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, rewriteMySqlValuesFunction(value)]))
}

function mysqlWriteNote(sql, ast) {
  if (ast.type === 'update' && Array.isArray(ast.table) && ast.table.length > 1) return 'MySQL UPDATE JOIN was rewritten as SQLite UPDATE ... FROM with the join predicates preserved.'
  if (ast.type === 'delete' && Array.isArray(ast.from) && ast.from.length > 1) return 'MySQL DELETE JOIN was rewritten as a correlated EXISTS delete for its target table.'
  if (ast.type === 'create' && /\b(?:ENGINE|CHARSET)\s*=/i.test(sql)) return 'SQLite stores no MySQL engine or charset option; those table options were accepted and ignored.'
  if (/\bAUTO_INCREMENT\b/i.test(sql)) return 'AUTO_INCREMENT is represented by SQLite INTEGER PRIMARY KEY AUTO_INCREMENT.'
  if (/\bON\s+DUPLICATE\s+KEY\s+UPDATE\b/i.test(sql)) return 'MySQL ON DUPLICATE KEY UPDATE was rewritten as SQLite UPSERT. With multiple unique keys, conflict selection can differ slightly from MySQL.'
  return ''
}

function classifyTransaction(sql, ast) {
  if (ast.savepoint) return /^\s*ROLLBACK\s+TO/i.test(sql) ? 'rollback-to' : /^\s*RELEASE/i.test(sql) ? 'release' : 'savepoint'
  if (ast.type !== 'transaction') return ''
  const word = stripSqlComments(sql).trim().split(/\s+/)[0].toUpperCase()
  if (word === 'BEGIN' || word === 'START') return 'begin'
  if (word === 'COMMIT' || word === 'END') return 'commit'
  if (word === 'ROLLBACK') return 'rollback'
  return ''
}

function getSavepointName(sql) {
  return stripSqlComments(sql).trim().match(/^(?:SAVEPOINT|RELEASE(?:\s+SAVEPOINT)?|ROLLBACK\s+TO(?:\s+SAVEPOINT)?)\s+([A-Za-z_]\w*)/i)?.[1] || ''
}

function transactionState() {
  return { active: transactionOpen, label: transactionOpen ? 'Uncommitted changes' : 'Autocommit' }
}

function historyState() {
  return { undo: sandboxHistoryIndex > 0, redo: sandboxHistoryIndex >= 0 && sandboxHistoryIndex < sandboxHistory.length - 1,
    index: sandboxHistoryIndex, length: sandboxHistory.length }
}

function saveCurrentSandboxSnapshot(label) {
  saveSnapshot(exportSandboxDatabase(), label)
}

function exportSandboxDatabase() {
  const bytes = sandboxDatabase.export()
  // Export serializes the file into a fresh SQLite connection. Reapply runtime
  // protections afterward; connection PRAGMAs are not stored in the file.
  sandboxDatabase.run('PRAGMA foreign_keys = ON;')
  sandboxDatabase.run('PRAGMA trusted_schema = OFF;')
  return bytes
}

function saveSnapshot(bytes, label) {
  sandboxHistory = sandboxHistory.slice(0, sandboxHistoryIndex + 1)
  sandboxHistory.push({ bytes: bytes.slice(), label })
  const historySize = () => sandboxHistory.reduce((total, item) => total + item.bytes.byteLength, 0)
  while (sandboxHistory.length > MAX_HISTORY_STATES || historySize() > MAX_HISTORY_BYTES) sandboxHistory.shift()
  sandboxHistoryIndex = sandboxHistory.length - 1
}

function moveSandboxHistory(direction) {
  const target = sandboxHistoryIndex + direction
  if (transactionOpen) throw makeError('Commit or roll back the open transaction before using Undo or Redo.', 'TRANSACTION_ACTIVE')
  if (target < 0 || target >= sandboxHistory.length) return { ...historyState(), schema: getSchemaSummary(sandboxDatabase) }
  sandboxHistoryIndex = target
  restoreSandbox(sandboxHistory[target].bytes)
  return { ...historyState(), label: sandboxHistory[target].label, schema: getSchemaSummary(sandboxDatabase) }
}

function restoreSandbox(bytes) {
  sandboxDatabase?.close()
  sandboxDatabase = new SQL.Database(bytes)
  sandboxDatabase.run('PRAGMA foreign_keys = ON;')
  sandboxDatabase.run('PRAGMA trusted_schema = OFF;')
  transactionOpen = false
  transactionSnapshot = null
  savepointStack = []
}

function enforceSandboxLimits() {
  const pages = sandboxDatabase.exec('PRAGMA page_count')?.[0]?.values?.[0]?.[0] || 0
  const pageSize = sandboxDatabase.exec('PRAGMA page_size')?.[0]?.values?.[0]?.[0] || 0
  const bytes = pages * pageSize
  if (bytes.byteLength > MAX_SANDBOX_DATABASE_BYTES) throw makeError('Sandbox database limit reached (8 MB). Undo or reset data before adding more.', 'SANDBOX_SIZE_LIMIT')
  const tables = getSchemaSummary(sandboxDatabase)
  for (const table of tables) {
    if (countTableRows(sandboxDatabase, table.name) > MAX_SANDBOX_ROWS_PER_TABLE) {
      throw makeError(`Table ${table.name} exceeds the ${MAX_SANDBOX_ROWS_PER_TABLE.toLocaleString()} row sandbox limit.`, 'SANDBOX_ROW_LIMIT')
    }
  }
}

function getSchemaSummary(db) {
  const tables = []
  let statement
  try {
    statement = db.prepare("SELECT name, type, tbl_name FROM sqlite_master WHERE type IN ('table','view','index') AND name NOT LIKE 'sqlite_%' ORDER BY type, name")
    while (statement.step()) {
      const [name, type, tableName] = statement.get()
      let columns = []
      if (type === 'table' || type === 'view') {
        const info = db.exec(`PRAGMA table_info(${quoteIdentifier(name)})`)[0]
        const foreignKeys = db.exec(`PRAGMA foreign_key_list(${quoteIdentifier(name)})`)[0]?.values || []
        columns = (info?.values || []).map((row) => {
          const foreignKey = foreignKeys.find((key) => String(key[3]).toLowerCase() === String(row[1]).toLowerCase())
          return {
            name: row[1],
            type: row[2] || 'value',
            primaryKey: Boolean(row[5]),
            foreignKey: foreignKey ? { table: foreignKey[2], column: foreignKey[4] || 'id' } : null,
          }
        })
      } else if (type === 'index') {
        const info = db.exec(`PRAGMA index_info(${quoteIdentifier(name)})`)[0]
        columns = (info?.values || []).map((row) => ({ name: row[2], type: 'index' }))
      }
      tables.push({ name, type, tableName, columns })
    }
  } finally {
    statement?.free()
  }
  return tables
}

function readTableSnapshot(db, tableName) {
  if (!tableName || !getSchemaSummary(db).some((item) => item.name.toLowerCase() === String(tableName).toLowerCase() && item.type === 'table')) return null
  const raw = executeSelect(db, `SELECT rowid AS __visual_rowid, * FROM ${quoteIdentifier(tableName)} LIMIT ${MAX_RESULT_ROWS}`)
  return {
    columns: raw.columns.slice(1),
    rows: raw.rows.map((row) => row.slice(1)),
    rowIds: raw.rows.map((row) => row[0]),
    totalRows: raw.totalRows,
    truncated: raw.truncated,
  }
}

function getDatabaseSnapshot(db) {
  const snapshot = {}
  getSchemaSummary(db).filter((table) => table.type === 'table').forEach((table) => {
    snapshot[table.name] = readTableSnapshot(db, table.name)
  })
  return snapshot
}

function getDropDependencyWarning(db, ast) {
  if (String(ast.keyword || '').toLowerCase() !== 'table') return ''
  const target = getTargetTable(ast)
  if (!target) return ''
  const dependencies = []
  getSchemaSummary(db).filter((item) => item.type === 'table' && item.name !== target).forEach((child) => {
    const foreignKeys = db.exec(`PRAGMA foreign_key_list(${quoteIdentifier(child.name)})`)[0]?.values || []
    foreignKeys.filter((row) => String(row[2]).toLowerCase() === target.toLowerCase()).forEach((row) => {
      const count = countRowsWhereNotNull(db, child.name, row[3])
      if (count) dependencies.push(`${child.name}.${row[3]} (${count} rows)`)
    })
  })
  return dependencies.length
    ? `Dependency warning: ${target} is referenced by ${dependencies.join(', ')}. Foreign-key rules may prevent dropping it or cascade changes.`
    : ''
}

function countRowsWhereNotNull(db, table, column) {
  try { return executeSelect(db, `SELECT COUNT(*) FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier(column)} IS NOT NULL`).rows[0][0] } catch { return 0 }
}

function getTargetTable(ast) {
  if (ast.type === 'delete' && Array.isArray(ast.from) && ast.from.length) {
    const targetName = ast.table?.[0]?.table
    const matched = ast.from.find((entry) => entry.as && entry.as.toLowerCase() === String(targetName || '').toLowerCase())
      || ast.from.find((entry) => getTableIdentifier(entry).toLowerCase() === String(targetName || '').toLowerCase())
    if (matched) return getTableIdentifier(matched)
  }
  const item = (Array.isArray(ast.table) ? ast.table[0] : ast.table) || ast.from?.[0] || (Array.isArray(ast.name) ? ast.name[0] : ast.name)
  const candidate = item?.table || item?.view || ast.view?.view
  if (typeof candidate === 'string') return candidate.replace(/[`"[]]/g, '')
  if (candidate?.type === 'default') return candidate.value
  return null
}

function countTableRows(db, table) {
  try { return executeSelect(db, `SELECT COUNT(*) FROM ${quoteIdentifier(table)}`).rows[0][0] } catch { return 0 }
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function splitSqlStatements(source) {
  const result = []
  let start = 0
  let quote = ''
  let lineComment = false
  let blockComment = false
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    const next = source[i + 1]
    if (lineComment) { if (char === '\n' || char === '\r') lineComment = false; continue }
    if (blockComment) { if (char === '*' && next === '/') { blockComment = false; i += 1 }; continue }
    if (quote) {
      if (char === quote) { if (next === quote && quote !== ']') i += 1; else quote = '' }
      else if (char === '\\' && quote !== ']') i += 1
      continue
    }
    if (char === '-' && next === '-') { lineComment = true; i += 1 }
    else if (char === '#') lineComment = true
    else if (char === '/' && next === '*') { blockComment = true; i += 1 }
    else if (char === "'" || char === '"' || char === '`') quote = char
    else if (char === '[') quote = ']'
    else if (char === ';') {
      const part = source.slice(start, i).trim()
      if (stripSqlComments(part).trim()) result.push(part)
      start = i + 1
    }
  }
  const tail = source.slice(start).trim()
  if (stripSqlComments(tail).trim()) result.push(tail)
  return result
}

function stripSqlComments(sql) {
  return String(sql).replace(/--[^\r\n]*|#[^\r\n]*|\/\*[\s\S]*?\*\//g, ' ')
}

function makeError(message, code) {
  const error = new Error(message)
  error.code = code
  return error
}

function friendlySandboxError(error) {
  const message = String(error?.message || error)
  if (/UNIQUE constraint failed/i.test(message) || /PRIMARY KEY/i.test(message)) return 'Duplicate key: that value already exists in a PRIMARY KEY or UNIQUE column. Choose a different value or use an upsert.'
  if (/NOT NULL constraint failed/i.test(message)) return 'A required column is missing. Supply a value for every NOT NULL column or add a default.'
  if (/FOREIGN KEY constraint failed/i.test(message)) return 'This change conflicts with a foreign key. Add the parent row first, or remove/reassign the dependent rows.'
  if (/CHECK constraint failed/i.test(message)) return 'A CHECK constraint rejected this value. Review the rule in the table definition.'
  if (/table .* already exists/i.test(message)) return 'That table already exists. Use CREATE TABLE IF NOT EXISTS or choose another table name.'
  if (/has \d+ columns? but \d+ values? were supplied|values? for \w+ columns?/i.test(message)) return 'The number of values does not match the inserted columns. Add or remove a value, or name the matching columns.'
  if (/cannot rollback - no transaction is active|cannot commit - no transaction is active/i.test(message)) return 'There is no active transaction. Start one with BEGIN before using COMMIT or ROLLBACK.'
  if (/no such table/i.test(message)) return 'That table does not exist. Check the schema browser or create it first.'
  if (/no such column/i.test(message)) return 'That column does not exist in the target table. Check the schema browser for its exact name.'
  return message.replace(/^SQLite error:\s*/i, '')
}

// Count non-empty statements while respecting SQL strings and comments. The
// parser remains the authoritative statement-type check; this catches stacked
// statements even if a parser version happens to return only its first AST.
function countStatements(sql) {
  let count = 0
  let hasContent = false
  let quote = ''
  let lineComment = false
  let blockComment = false

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]
    const next = sql[index + 1]

    if (lineComment) {
      if (char === '\n' || char === '\r') lineComment = false
      continue
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (char === quote) {
        if (next === quote && quote !== ']') index += 1
        else quote = ''
      } else if (char === '\\' && quote !== ']') {
        index += 1
      }
      continue
    }

    if (char === '-' && next === '-') {
      lineComment = true
      index += 1
    } else if (char === '#') {
      lineComment = true
    } else if (char === '/' && next === '*') {
      blockComment = true
      index += 1
    } else if (char === "'" || char === '"' || char === '`') {
      quote = char
      hasContent = true
    } else if (char === '[') {
      quote = ']'
      hasContent = true
    } else if (char === ';') {
      if (hasContent) count += 1
      hasContent = false
    } else if (!/\s/.test(char)) {
      hasContent = true
    }
  }
  if (hasContent) count += 1
  return count
}
