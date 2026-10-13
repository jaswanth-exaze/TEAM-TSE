import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test, { before, beforeEach } from 'node:test'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { performance } from 'node:perf_hooks'
import { buildExecutionSteps, inspectQuery } from '../sql-visual-lab/engine.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const labDir = path.resolve(here, '../sql-visual-lab')
const require = createRequire(import.meta.url)
let SQL
let parser
let worker
let nextRequestId = 1

before(async () => {
  const sqlContext = {
    exports: {}, require, process, console, WebAssembly, Buffer, TextDecoder, TextEncoder,
    setTimeout, clearTimeout, performance, URL,
    __dirname: path.join(labDir, 'vendor'),
  }
  vm.runInNewContext(await readFile(path.join(labDir, 'vendor/sql-wasm.js'), 'utf8'), sqlContext)
  SQL = await sqlContext.exports.Module({
    wasmBinary: await readFile(path.join(labDir, 'vendor/sql-wasm.wasm')),
  })

  const parserContext = { console, setTimeout, clearTimeout, setInterval, clearInterval, URL, TextEncoder, TextDecoder }
  vm.runInNewContext(await readFile(path.join(labDir, 'vendor/mysql.umd.js'), 'utf8'), parserContext)
  parser = new parserContext.Parser()
  worker = createWorker()
  await request('init', { schemaSql: await readFile(path.join(labDir, 'schema.sql'), 'utf8') })
})

beforeEach(async () => {
  await request('reset')
})

test('keeps Query Mode read-only and isolates sandbox writes', async () => {
  await assert.rejects(
    request('run', { sql: "INSERT INTO departments(name, location) VALUES ('Finance', 'Delhi')" }),
    { code: 'READ_ONLY' },
  )

  const changed = await request('run', {
    mode: 'sandbox',
    sql: "INSERT INTO departments(name, location) VALUES ('Finance', 'Delhi')",
  })
  assert.equal(changed.statements[0].affectedRows, 1)

  const queryCount = await request('run', { sql: 'SELECT COUNT(*) AS n FROM departments' })
  const sandboxCount = await request('run', { mode: 'sandbox', sql: 'SELECT COUNT(*) AS n FROM departments' })
  assert.equal(queryCount.rows[0][0], 10)
  assert.equal(sandboxCount.finalResult.rows[0][0], 11)
})

test('exposes primary and foreign-key labels in the generated schema metadata', async () => {
  const resetState = await request('reset')
  const employees = resetState.schema.find((table) => table.name === 'employees')
  const departments = resetState.schema.find((table) => table.name === 'departments')
  const departmentKey = employees.columns.find((column) => column.name === 'department_id').foreignKey
  assert.equal(departmentKey.table, 'departments')
  assert.equal(departmentKey.column, 'id')
  assert.equal(departments.columns.find((column) => column.name === 'id').primaryKey, true)
})

test('visualizes INSERT, UPDATE, DELETE and MySQL UPDATE JOIN with row identity', async () => {
  const inserted = await request('run', { mode: 'sandbox', sql: "INSERT INTO departments(name, location) VALUES ('Finance', 'Delhi')" })
  assert.deepEqual(Array.from(inserted.statements[0].after.rowIds).slice(-1), [11])

  const updated = await request('run', {
    mode: 'sandbox',
    sql: 'UPDATE employees SET salary = salary * 1.10 WHERE department_id = 1',
  })
  assert.equal(updated.statements[0].affectedRows, 3)
  assert.equal(updated.statements[0].before.rowIds.join(','), updated.statements[0].after.rowIds.join(','))

  const joinedUpdate = await request('run', {
    mode: 'sandbox',
    sql: "UPDATE employees e JOIN departments d ON e.department_id = d.id SET e.salary = e.salary + 500 WHERE d.name = 'Data'",
  })
  assert.equal(joinedUpdate.statements[0].affectedRows, 2)
  assert.match(joinedUpdate.statements[0].note, /UPDATE JOIN was rewritten/i)

  const joinedDelete = await request('run', {
    mode: 'sandbox',
    sql: "DELETE o FROM orders o JOIN employees e ON o.employee_id = e.id JOIN departments d ON e.department_id = d.id WHERE d.name = 'Data' AND o.id = 9",
  })
  assert.equal(joinedDelete.statements[0].affectedRows, 1)
  assert.equal(joinedDelete.statements[0].after.totalRows, 13)

  const deleted = await request('run', { mode: 'sandbox', sql: "DELETE FROM orders WHERE status = 'cancelled'" })
  assert.equal(deleted.statements[0].affectedRows, 2)
  assert.equal(deleted.statements[0].before.rows.length - deleted.statements[0].after.rows.length, 2)
})

test('supports table creation, identity columns, schema changes, and teachable constraint errors', async () => {
  const created = await request('run', {
    mode: 'sandbox',
    sql: 'CREATE TABLE projects (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50) NOT NULL UNIQUE, lead_id INT REFERENCES employees(id))',
  })
  assert.ok(created.schema.some((table) => table.name === 'projects'))

  const added = await request('run', { mode: 'sandbox', sql: "INSERT INTO projects(name, lead_id) VALUES ('Apollo', 1)" })
  assert.equal(added.statements[0].after.rows[0][0], 1)
  const invalidReference = await request('run', { mode: 'sandbox', sql: "INSERT INTO projects(name, lead_id) VALUES ('Missing lead', 999)" })
  assert.equal(invalidReference.statements[0].ok, false, JSON.stringify(invalidReference.statements[0]))
  assert.match(invalidReference.statements[0].error, /foreign key/i)
  const duplicate = await request('run', { mode: 'sandbox', sql: "INSERT INTO projects(name, lead_id) VALUES ('Apollo', 2)" })
  assert.equal(duplicate.statements[0].ok, false)
  assert.match(duplicate.statements[0].error, /Duplicate key/)

  await request('run', { mode: 'sandbox', sql: 'CREATE TABLE upserts (id INTEGER PRIMARY KEY, value TEXT UNIQUE)' })
  await request('run', { mode: 'sandbox', sql: "INSERT INTO upserts(id, value) VALUES (1, 'before')" })
  const upsert = await request('run', { mode: 'sandbox', sql: "INSERT INTO upserts(id, value) VALUES (1, 'after') ON DUPLICATE KEY UPDATE value = VALUES(value)" })
  assert.match(upsert.statements[0].note, /rewritten as SQLite UPSERT/i)
  const upsertedValue = await request('run', { mode: 'sandbox', sql: 'SELECT value FROM upserts WHERE id = 1' })
  assert.equal(upsertedValue.finalResult.rows[0][0], 'after')

  const altered = await request('run', { mode: 'sandbox', sql: 'ALTER TABLE employees ADD COLUMN email VARCHAR(100)' })
  assert.ok(altered.schema.find((table) => table.name === 'employees').columns.some((column) => column.name === 'email'))
  assert.ok(altered.statements[0].schemaAfter.find((table) => table.name === 'employees').columns.some((column) => column.name === 'email'))

  const protectedDrop = await request('run', { mode: 'sandbox', sql: 'DROP TABLE departments' })
  assert.equal(protectedDrop.statements[0].ok, false)
  assert.match(protectedDrop.statements[0].note, /referenced by/i)
})

test('requires confirmation for whole-table writes and blocks database escape commands', async () => {
  const confirmation = await request('run', { mode: 'sandbox', sql: 'DELETE FROM employees' })
  assert.equal(confirmation.confirmationRequired[0].rowCount, 12)
  assert.equal(confirmation.statements.length, 0)

  await assert.rejects(
    request('run', { mode: 'sandbox', sql: "ATTACH DATABASE 'outside.db' AS outside" }),
    { code: 'SANDBOX_BLOCKED' },
  )
  await assert.rejects(request('run', { sql: "SELECT load_extension('outside')" }), { code: 'READ_ONLY_FUNCTION' })
  await assert.rejects(request('run', { sql: 'WITH gone AS (SELECT 1) DELETE FROM employees' }), { code: 'READ_ONLY' })
  const unchanged = await request('run', { mode: 'sandbox', sql: 'SELECT COUNT(*) FROM employees' })
  assert.equal(unchanged.finalResult.rows[0][0], 12)
})

test('restores the latest completed sandbox checkpoint after worker recreation', async () => {
  const schemaSql = await readFile(path.join(labDir, 'schema.sql'), 'utf8')
  const changed = await request('run', {
    mode: 'sandbox',
    sql: "INSERT INTO departments(name, location) VALUES ('Checkpoint', 'Delhi')",
  })
  const queryWorker = worker
  worker = createWorker()
  await request('init', { schemaSql, sandboxSnapshot: changed.sandboxSnapshot })

  const sandbox = await request('run', { mode: 'sandbox', sql: "SELECT name FROM departments WHERE name = 'Checkpoint'" })
  const query = await request('run', { sql: 'SELECT COUNT(*) FROM departments' })
  assert.equal(sandbox.finalResult.rows[0][0], 'Checkpoint')
  assert.equal(query.rows[0][0], 10)
  assert.notEqual(worker, queryWorker)
})

test('shows transaction, savepoint, rollback, commit, and undo/redo state', async () => {
  const rollback = await request('run', {
    mode: 'sandbox', confirmed: true,
    sql: 'BEGIN; DELETE FROM orders; ROLLBACK;',
  })
  assert.equal(rollback.statements.length, 3)
  assert.equal(rollback.statements[1].after.totalRows, 0)
  assert.equal(rollback.statements[2].databaseAfter.orders.totalRows, 14)
  assert.equal(rollback.transaction.active, false)

  const truncated = await request('run', { mode: 'sandbox', confirmed: true, sql: 'TRUNCATE TABLE orders' })
  assert.equal(truncated.statements[0].affectedRows, 14)

  const savepoint = await request('run', {
    mode: 'sandbox',
    sql: 'SAVEPOINT before_change; UPDATE employees SET salary = 1 WHERE id = 2; ROLLBACK TO before_change; RELEASE before_change;',
  })
  assert.ok(savepoint.statements.every((statement) => statement.ok))
  assert.equal(savepoint.transaction.active, false)

  const commit = await request('run', {
    mode: 'sandbox',
    sql: 'BEGIN; UPDATE employees SET salary = 1 WHERE id = 2; COMMIT;',
  })
  assert.ok(commit.statements.every((statement) => statement.ok))
  const committedValue = await request('run', { mode: 'sandbox', sql: 'SELECT salary FROM employees WHERE id = 2' })
  assert.equal(committedValue.finalResult.rows[0][0], 1)

  const undo = await request('undo')
  assert.equal(undo.undo, true)
  const undoneValue = await request('run', { mode: 'sandbox', sql: 'SELECT salary FROM employees WHERE id = 2' })
  assert.notEqual(undoneValue.finalResult.rows[0][0], 1)
  const redo = await request('redo')
  assert.equal(redo.redo, false)
  const redoneValue = await request('run', { mode: 'sandbox', sql: 'SELECT salary FROM employees WHERE id = 2' })
  assert.equal(redoneValue.finalResult.rows[0][0], 1)
})

test('builds dedicated window and recursive hierarchy steps', async () => {
  const windowSql = `SELECT name, department_id, salary,
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank
    FROM employees ORDER BY department_id, dept_rank`
  const windowResult = await request('run', { sql: windowSql })
  const windowPlan = await buildExecutionSteps(
    parser,
    parser.astify(windowSql, { database: 'MySQL' }),
    async (sql) => request('run', { sql }),
    windowResult,
  )
  assert.equal(windowPlan.available, true)
  assert.equal(windowPlan.steps[0].kind, 'window')
  assert.equal(windowPlan.steps[0].functions[0].alias, 'dept_rank')
  assert.equal(windowPlan.steps[0].partitions.reduce((sum, group) => sum + group.rows.length, 0), 12)
  assert.deepEqual(windowPlan.steps.slice(0, 3).map((step) => step.windowPhase), ['input', 'partition', 'rank'])
  assert.deepEqual(Array.from(windowPlan.steps[2].functions[0].orderKeys, (key) => `${key.expression} ${key.direction}`), ['salary DESC'])
  assert.deepEqual(Array.from(windowPlan.steps.at(-1).sortKeys, (key) => `${key.expression} ${key.direction}`), ['department_id ASC', 'dept_rank ASC'])

  const selfJoinSql = `SELECT e.name AS employee, m.name AS manager
    FROM employees AS e LEFT JOIN employees AS m ON e.manager_id = m.id
    ORDER BY e.id`
  const selfJoinResult = await request('run', { sql: selfJoinSql })
  const selfJoinPlan = await buildExecutionSteps(
    parser,
    parser.astify(selfJoinSql, { database: 'MySQL' }),
    async (sql) => request('run', { sql }),
    selfJoinResult,
  )
  assert.equal(selfJoinPlan.steps[0].kind, 'hierarchy')
  assert.deepEqual(selfJoinPlan.steps[0].levels.map((level) => level.rows.length), [3, 7, 2])

  const hierarchySql = `WITH RECURSIVE org AS (
    SELECT id, name, manager_id, 0 AS depth FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id, org.depth + 1
    FROM employees AS e JOIN org ON e.manager_id = org.id
  ) SELECT id, name, manager_id, depth FROM org ORDER BY depth, id`
  const hierarchyResult = await request('run', { sql: hierarchySql })
  const hierarchyPlan = await buildExecutionSteps(
    parser,
    parser.astify(hierarchySql, { database: 'MySQL' }),
    async (sql) => request('run', { sql }),
    hierarchyResult,
  )
  assert.equal(hierarchyPlan.available, true)
  assert.equal(hierarchyPlan.steps[0].kind, 'hierarchy')
  assert.deepEqual(hierarchyPlan.steps[0].levels.map((level) => level.rows.length), [3, 7, 2])
  assert.deepEqual(hierarchyPlan.steps.map((step) => step.hierarchyPhase), ['anchor', 'recursive', 'recursive', 'stop', 'final'])
  assert.deepEqual(Array.from(hierarchyPlan.steps.at(-1).outerOrderBy, (key) => `${key.expression} ${key.direction}`), ['depth ASC', 'id ASC'])
})

test('visualizes a correlated scalar subquery once for every outer employee', async () => {
  const sql = `SELECT e1.name
    FROM employees e1
    WHERE salary > (
      SELECT AVG(salary)
      FROM employees e2
      WHERE e1.department_id = e2.department_id
    )`
  const inspection = inspectQuery(sql, parser)
  assert.equal(inspection.visualizationAvailable, true, inspection.reason)

  const finalResult = await request('run', { sql })
  const plan = await buildExecutionSteps(
    parser,
    inspection.ast,
    async (statement) => request('run', { sql: statement }),
    finalResult,
  )

  assert.equal(plan.available, true, plan.reason)
  const subqueryStep = plan.steps.find((step) => step.kind === 'subquery')
  const whereStep = plan.steps.find((step) => step.id === 'where')
  assert.ok(subqueryStep, 'the plan should include a dedicated inner-query step')
  assert.ok(whereStep, 'the plan should still show the outer WHERE filter')
  assert.equal(subqueryStep.executions.length, 12)
  assert.match(subqueryStep.executions[0].innerSql, /(?:\d+\s*=\s*`?e2`?\.`?department_id|`?e2`?\.`?department_id`?\s*=\s*\d+)/i)
  assert.match(subqueryStep.result.columns.at(-1), /^Subquery result · AVG\(salary\)$/)
  assert.equal(whereStep.filterInput.columns.at(-1), subqueryStep.result.columns.at(-1))

  const nameIndex = whereStep.filterInput.columns.findIndex((column) => column.toLowerCase() === 'name')
  const keptNames = whereStep.filterInput.rows
    .filter((_row, index) => whereStep.filterFlags[index])
    .map((row) => row[nameIndex])
    .sort()
  assert.deepEqual(Array.from(keptNames), Array.from(finalResult.rows, (row) => row[0]).sort())
  assert.equal(subqueryStep.executions.every((execution) => typeof execution.innerSql === 'string' && execution.innerSql.length > 0), true)
})

test('visualizes uncorrelated scalar subqueries without mistaking IN subqueries for scalars', async () => {
  const scalarSql = 'SELECT name FROM employees WHERE salary > (SELECT 0)'
  const scalarInspection = inspectQuery(scalarSql, parser)
  assert.equal(scalarInspection.visualizationAvailable, true, scalarInspection.reason)
  const scalarResult = await request('run', { sql: scalarSql })
  const scalarPlan = await buildExecutionSteps(
    parser,
    scalarInspection.ast,
    async (statement) => request('run', { sql: statement }),
    scalarResult,
  )
  assert.equal(scalarPlan.available, true, scalarPlan.reason)
  const scalarStep = scalarPlan.steps.find((step) => step.kind === 'subquery')
  assert.equal(scalarStep.executions[0].scalarValue, 0)
  assert.equal(scalarStep.executions.length, 12)
  assert.equal(scalarStep.result.rows[0].at(-1), 0)

  const inInspection = inspectQuery('SELECT name FROM employees WHERE department_id IN (SELECT id FROM departments)', parser)
  assert.equal(inInspection.visualizationAvailable, true, inInspection.reason)
  const inResult = await request('run', { sql: 'SELECT name FROM employees WHERE department_id IN (SELECT id FROM departments)' })
  const inPlan = await buildExecutionSteps(
    parser,
    inInspection.ast,
    async (statement) => request('run', { sql: statement }),
    inResult,
  )
  assert.equal(inPlan.available, true, inPlan.reason)
  assert.ok(inPlan.steps.some((step) => step.kind === 'subquery-membership'))
  assert.equal(inPlan.steps.some((step) => step.kind === 'subquery'), false)
})

function createWorker() {
  const self = {
    location: { href: 'http://localhost/sql-visual-lab/worker.js' },
    initSqlJs: async () => SQL,
    NodeSQLParser: { Parser: parser.constructor },
    addEventListener(_type, handler) { this.handler = handler },
    postMessage(message) { this.lastMessage = message },
  }
  vm.runInNewContext(awaitableWorkerSource, {
    self, URL, performance, console, Map, Set, Date, Math, Number, String,
    Array, Object, RegExp, Error, Uint8Array, TextEncoder, TextDecoder,
  })
  return self
}

const awaitableWorkerSource = await readFile(path.join(labDir, 'worker.js'), 'utf8')

async function request(type, payload = {}) {
  const requestId = nextRequestId++
  worker.lastMessage = null
  await worker.handler({ data: { requestId, type, payload } })
  const message = worker.lastMessage
  if (!message?.ok) {
    throw Object.assign(new Error(message?.error?.message || 'Worker request failed.'), {
      code: message?.error?.code || 'QUERY_FAILED',
    })
  }
  return message.result
}
