const MYSQL_OPTIONS = { database: 'MySQL' }

export const SCHEMA_TABLES = Object.freeze({
  departments: [
    ['id', 'INTEGER'], ['name', 'TEXT'], ['location', 'TEXT'],
  ],
  employees: [
    ['id', 'INTEGER'], ['name', 'TEXT'], ['department_id', 'INTEGER'],
    ['salary', 'INTEGER'], ['hire_date', 'TEXT'], ['manager_id', 'INTEGER'],
  ],
  orders: [
    ['id', 'INTEGER'], ['employee_id', 'INTEGER'], ['amount', 'REAL'],
    ['order_date', 'TEXT'], ['status', 'TEXT'],
  ],
})

export function inspectQuery(sql, parser) {
  const normalized = String(sql || '').trim()
  if (!normalized) throw new Error('Write a SELECT query before running it.')

  const statements = splitStatements(normalized)
  if (statements.length > 1) {
    throw new Error('Run one SELECT statement at a time. Multiple statements are not allowed.')
  }

  const firstKeyword = normalized.replace(/^(?:\s|--[^\n]*(?:\n|$)|#[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/g, '').match(/^([a-z]+)/i)?.[1]?.toUpperCase()
  if (firstKeyword !== 'SELECT' && firstKeyword !== 'WITH') {
    throw new Error('Only read-only SELECT queries are allowed in this lab.')
  }

  if (!parser) {
    if (firstKeyword !== 'SELECT') {
      throw new Error('The SQL parser did not load, so this query could not be safely checked. Try a SELECT query.')
    }
    return { ast: null, visualizationAvailable: false, reason: 'The SQL parser is unavailable. Your SELECT result can still be shown.' }
  }

  let parsed
  try {
    parsed = parser.astify(normalized, MYSQL_OPTIONS)
  } catch (error) {
    if (firstKeyword !== 'SELECT') {
      throw new Error('This query could not be safely verified as read-only. Try a SELECT query without a CTE.')
    }
    return {
      ast: null,
      visualizationAvailable: false,
      reason: 'This query could not be broken into visual steps. The final result is still available.',
      parseError: error,
    }
  }

  const statementsFromParser = Array.isArray(parsed) ? parsed : [parsed]
  if (statementsFromParser.length !== 1) {
    throw new Error('Run one SELECT statement at a time. Multiple statements are not allowed.')
  }

  const ast = statementsFromParser[0]
  if (!ast || ast.type !== 'select') {
    throw new Error('Only read-only SELECT queries are allowed in this lab.')
  }

  const unsupported = explainUnsupportedQuery(ast)
  return { ast, visualizationAvailable: !unsupported, reason: unsupported || '' }
}

export async function buildExecutionSteps(parser, ast, queryRunner, finalResult = null) {
  const supportMessage = explainUnsupportedQuery(ast)
  if (supportMessage) return { available: false, reason: supportMessage, steps: [] }

  if (containsWindowExpression(ast.columns) || ast.window || ast.qualify) {
    return buildWindowExecutionStep(parser, ast, queryRunner, finalResult)
  }
  if (isRecursiveCte(ast)) {
    const hierarchy = buildHierarchyExecutionStep(parser, ast, finalResult)
    if (!hierarchy) {
      return { available: false, reason: 'This recursive CTE returned its result, but it does not expose an id, a parent id, and a depth or level column, so a tree cannot be drawn safely.', steps: [] }
    }
    return { available: true, reason: '', steps: [hierarchy] }
  }
  if (isEmployeeSelfJoin(ast)) {
    const hierarchy = await buildSelfJoinHierarchyStep(parser, ast, queryRunner, finalResult)
    return hierarchy
      ? { available: true, reason: '', steps: [hierarchy] }
      : { available: false, reason: 'This self-join uses a parent/child relationship, but its rows could not be mapped into a stable hierarchy. Include the child id and manager id in the query.', steps: [] }
  }

  const steps = []
  let previousResult = null
  const sourceEntries = Array.isArray(ast.from) ? ast.from : []
  const hasFrom = sourceEntries.length > 0
  const scalarSubquery = getVisualizableWhereSubquery(ast)

  const runStep = async (definition, options) => {
    const statement = makePartialQuery(parser, ast, options)
    const result = await queryRunner(statement)
    const step = {
      ...definition,
      sql: statement,
      input: previousResult,
      result,
    }
    steps.push(step)
    previousResult = result
    return step
  }

  try {
    if (hasFrom) {
      const first = sourceEntries[0]
      const fromName = getTableName(first)
      await runStep({
        id: 'from',
        label: 'FROM',
        title: `Start with ${fromName}`,
        description: `FROM reads the starting rows from ${fromName}. No filtering or column selection has happened yet.`,
      }, { fromCount: 1 })

      for (let index = 1; index < sourceEntries.length; index += 1) {
        const entry = sourceEntries[index]
        const joinType = String(entry.join || 'JOIN').replace(/\s+JOIN$/i, '').trim() || 'INNER'
        const tableName = getTableName(entry)
      await runStep({
        id: `join-${index}`,
        kind: 'join',
        joinType,
        title: `${joinType} JOIN ${tableName}`,
        description: describeJoin(entry, tableName, joinType, parser),
        joinTable: tableName,
        joinRight: await queryRunner(`SELECT * FROM \`${String(tableName).replace(/`/g, '``')}\` LIMIT 8`),
      }, { fromCount: index + 1 })
      }
    }

    if (scalarSubquery) {
      const subqueryStep = await buildScalarSubqueryStep(parser, ast, scalarSubquery, queryRunner, previousResult)
      if (subqueryStep) steps.push(subqueryStep)
    }

    if (ast.where) {
      const filterRows = makePartialQuery(parser, ast, {
        fromCount: sourceEntries.length,
        includeWhere: false,
      })
      const markedRows = makePartialQuery(parser, ast, {
        fromCount: sourceEntries.length,
        includeWhere: false,
        columns: [
          { expr: ast.where, as: '__visual_where_passes' },
          { expr: { type: 'column_ref', table: null, column: '*' }, as: null },
        ],
      })
      const markerResult = await queryRunner(markedRows)
      await runStep({
        id: 'where',
        title: 'WHERE',
        description: `WHERE checks each incoming row against ${expressionText(ast.where, parser)}. Rows that do not match are removed before groups are formed.`,
        filterFlags: markerResult.rows.map((row) => Boolean(row[0])),
        filterReason: expressionText(ast.where, parser),
        filterInput: await queryRunner(filterRows),
      }, { fromCount: sourceEntries.length, includeWhere: true })
    }

    const groupExpressions = getGroupExpressions(ast)
    if (groupExpressions.length) {
      const inputRows = makePartialQuery(parser, ast, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
      })
      const groupKeyColumns = groupExpressions.map((expr, index) => ({
        expr,
        as: `__visual_group_${index + 1}`,
      }))
      const groupRowsSql = makePartialQuery(parser, ast, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        columns: [
          ...groupKeyColumns,
          { expr: { type: 'column_ref', table: null, column: '*' }, as: null },
        ],
      })
      const grouped = buildGroupBuckets(await queryRunner(groupRowsSql), groupExpressions, parser)
      await runStep({
        id: 'group',
        title: 'GROUP BY',
        description: `GROUP BY collects the ${(await queryRunner(inputRows)).totalRows} incoming rows into groups using ${groupExpressions.map((expr) => expressionText(expr, parser)).join(', ')}.`,
        kind: 'groups',
        buckets: grouped.buckets,
        bucketResult: grouped.result,
      }, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        columns: groupKeyColumns,
        includeGroupBy: true,
      })
    }

    if (hasAggregate(ast.columns) && groupExpressions.length) {
      await runStep({
        id: 'aggregate',
        title: 'AGGREGATE',
        description: 'Aggregate functions calculate a value for each group. COUNT, SUM, AVG, MIN, and MAX ignore NULL values where SQL defines them to.',
      }, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        includeGroupBy: true,
        columns: ast.columns,
      })
    } else if (hasAggregate(ast.columns) && !groupExpressions.length) {
      await runStep({
        id: 'aggregate',
        title: 'AGGREGATE',
        description: 'Without GROUP BY, aggregate functions calculate one result for the entire set of rows.',
      }, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        columns: ast.columns,
      })
    }

    if (ast.having) {
      const beforeHaving = makePartialQuery(parser, ast, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        includeGroupBy: true,
        includeHaving: false,
        columns: ast.columns,
      })
      const beforeResult = await queryRunner(beforeHaving)
      const havingStep = await runStep({
        id: 'having',
        title: 'HAVING',
        description: `HAVING filters completed groups using ${expressionText(ast.having, parser)}. Aggregates are calculated before this filter is applied.`,
        kind: 'having',
        filterReason: expressionText(ast.having, parser),
        filterInput: beforeResult,
      }, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        includeGroupBy: true,
        includeHaving: true,
        columns: ast.columns,
      })

      if (groupExpressions.length) {
        const groupKeysBefore = await queryRunner(makeGroupKeyQuery(parser, ast, false))
        const groupKeysAfter = await queryRunner(makeGroupKeyQuery(parser, ast, true))
        havingStep.groupFlags = buildGroupFlags(groupKeysBefore, groupKeysAfter, groupExpressions.length)
        havingStep.groupBuckets = groupKeysBefore.rows.map((row) => ({
          keys: row.slice(0, groupExpressions.length),
          kept: hasMatchingGroup(row.slice(0, groupExpressions.length), groupKeysAfter.rows, groupExpressions.length),
        }))
      }
    }

    if (!ast.columns || ast.columns === '*') {
      // A plain SELECT * still has a projection step; the result is the source rows.
    }
    await runStep({
      id: 'select',
      title: 'SELECT',
      description: describeSelect(ast.columns, parser),
      selectedColumns: getReferencedColumns(ast.columns),
    }, {
      fromCount: sourceEntries.length,
      includeWhere: Boolean(ast.where),
      includeGroupBy: Boolean(ast.groupby),
      includeHaving: Boolean(ast.having),
      columns: ast.columns,
    })

    if (ast.distinct) {
      await runStep({
        id: 'distinct',
        title: 'DISTINCT',
        description: 'DISTINCT compares the selected column values and removes duplicate result rows.',
      }, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        includeGroupBy: Boolean(ast.groupby),
        includeHaving: Boolean(ast.having),
        columns: ast.columns,
        includeDistinct: true,
      })
    }

    if (ast.orderby?.length) {
      await runStep({
        id: 'order',
        kind: 'order',
        title: 'ORDER BY',
        description: `ORDER BY sorts the selected rows by ${ast.orderby.map((order) => `${expressionText(order.expr, parser)} ${order.type || 'ASC'}`).join(', ')}.`,
      }, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        includeGroupBy: Boolean(ast.groupby),
        includeHaving: Boolean(ast.having),
        columns: ast.columns,
        includeDistinct: Boolean(ast.distinct),
        includeOrderBy: true,
      })
    }

    if (ast.limit) {
      const inputBeforeLimit = makePartialQuery(parser, ast, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        includeGroupBy: Boolean(ast.groupby),
        includeHaving: Boolean(ast.having),
        columns: ast.columns,
        includeDistinct: Boolean(ast.distinct),
        includeOrderBy: Boolean(ast.orderby?.length),
      })
      const limitStep = await runStep({
        id: 'limit',
        kind: 'limit',
        title: 'LIMIT',
        description: 'LIMIT keeps only the first requested rows after sorting. Later rows are outside the final result.',
        filterInput: await queryRunner(inputBeforeLimit),
      }, {
        fromCount: sourceEntries.length,
        includeWhere: Boolean(ast.where),
        includeGroupBy: Boolean(ast.groupby),
        includeHaving: Boolean(ast.having),
        columns: ast.columns,
        includeDistinct: Boolean(ast.distinct),
        includeOrderBy: Boolean(ast.orderby?.length),
        includeLimit: true,
      })
      limitStep.limitCount = limitStep.result.totalRows
    }

    return { available: steps.length > 0, reason: '', steps }
  } catch (error) {
    if (error?.name === 'AbortError' || error?.code === 'TIMEOUT') throw error
    return {
      available: false,
      reason: `Step view not available for this query yet. The final result is still shown. (${friendlyEngineError(error)})`,
      steps: [],
    }
  }
}

export function friendlyEngineError(error, knownColumns = []) {
  const message = String(error?.message || error || 'The query could not be run.')
  const missingColumn = message.match(/no such column:\s*["'`]?([\w.]+)["'`]?/i)
  if (missingColumn) {
    const requested = missingColumn[1].split('.').at(-1).toLowerCase()
    const suggestion = closestName(requested, knownColumns)
    return suggestion
      ? `Column “${requested}” was not found. Did you mean “${suggestion}”?`
      : `Column “${requested}” was not found. Check the column names in the schema.`
  }

  const missingTable = message.match(/no such table:\s*["'`]?([\w.]+)["'`]?/i)
  if (missingTable) {
    const tableName = missingTable[1].split('.').at(-1)
    return `Table “${tableName}” was not found. Choose one of the tables in the schema panel.`
  }

  if (/syntax error|incomplete input|unrecognized token/i.test(message)) {
    return 'There is a SQL syntax issue. Check the highlighted line and make sure each clause is complete.'
  }

  return message.replace(/^SQLite error:\s*/i, '')
}

export function findErrorLine(sql, error) {
  const explicitLine = Number(error?.location?.start?.line || error?.lineNumber || error?.line)
  if (Number.isInteger(explicitLine) && explicitLine > 0) return explicitLine - 1

  const missingName = String(error?.message || error || '').match(/no such column:\s*["'`]?([\w.]+)["'`]?/i)?.[1]?.split('.').at(-1)
  if (missingName) {
    const pattern = new RegExp(`\\b${escapeRegExp(missingName)}\\b`, 'i')
    const match = pattern.exec(sql)
    if (match) return sql.slice(0, match.index).split('\n').length - 1
  }

  return 0
}

function makePartialQuery(parser, ast, options = {}) {
  const copy = clone(ast)
  copy.from = Array.isArray(ast.from)
    ? ast.from.slice(0, options.fromCount ?? ast.from.length)
    : ast.from
  copy.columns = options.columns ?? '*'
  copy.where = options.includeWhere ? ast.where : null
  copy.groupby = options.includeGroupBy ? ast.groupby : null
  copy.having = options.includeHaving ? ast.having : null
  copy.distinct = options.includeDistinct ? ast.distinct : null
  copy.orderby = options.includeOrderBy ? ast.orderby : null
  copy.limit = options.includeLimit ? ast.limit : null
  copy.with = null
  copy.window = null
  copy.qualify = null
  copy._next = null
  copy.set_op = null

  return parser.sqlify(copy, MYSQL_OPTIONS).replace(/;\s*$/, '')
}

function makeGroupKeyQuery(parser, ast, includeHaving) {
  const groupExpressions = getGroupExpressions(ast)
  const columns = groupExpressions.map((expr, index) => ({ expr, as: `__visual_group_${index + 1}` }))
  return makePartialQuery(parser, ast, {
    fromCount: Array.isArray(ast.from) ? ast.from.length : 0,
    includeWhere: Boolean(ast.where),
    includeGroupBy: true,
    includeHaving,
    columns,
  })
}

function buildGroupBuckets(result, expressions, parser) {
  const buckets = new Map()
  const groupCount = expressions.length

  for (const row of result.rows) {
    const keys = row.slice(0, groupCount)
    const key = stableValue(keys)
    if (!buckets.has(key)) buckets.set(key, { keys, count: 0 })
    buckets.get(key).count += 1
  }

  const output = [...buckets.values()]
  return {
    buckets: output.map((bucket) => ({
      keys: bucket.keys,
      labels: expressions.map((expr) => expressionText(expr, parser)),
      count: bucket.count,
    })),
    result: {
      columns: [...expressions.map((expr, index) => expressionText(expr, parser) || `Group ${index + 1}`), 'Rows in group'],
      rows: output.map((bucket) => [...bucket.keys, bucket.count]),
      totalRows: output.length,
      truncated: false,
    },
  }
}

function buildGroupFlags(before, after, groupCount) {
  return before.rows.map((row) => hasMatchingGroup(row.slice(0, groupCount), after.rows, groupCount))
}

function hasMatchingGroup(keys, candidates, groupCount) {
  return candidates.some((candidate) => stableValue(candidate.slice(0, groupCount)) === stableValue(keys))
}

function explainUnsupportedQuery(ast) {
  if (ast.with && !isRecursiveCte(ast)) return 'Step view not available for this query yet: common table expressions (WITH) are supported for results only.'
  if (ast.window || ast.qualify || containsWindowExpression(ast.columns)) return ''
  if (ast._next || ast.set_op) return 'Step view not available for this query yet: UNION and other set operations are supported for results only.'
  if (!Array.isArray(ast.from) && ast.from) return 'Step view not available for this query yet: derived tables are supported for results only.'
  if (Array.isArray(ast.from) && ast.from.some((entry) => !getTableName(entry))) {
    return 'Step view not available for this query yet: subqueries and derived tables are supported for results only.'
  }
  if (containsSubquery(ast.having)) {
    return 'Step view not available for this query yet: subqueries in HAVING are supported for results only.'
  }
  if (containsSubquery(ast.where) && !getVisualizableWhereSubquery(ast)) {
    return 'Step view not available for this query yet: this subquery shape cannot be expanded safely. A single-column scalar subquery in WHERE is supported when it reads regular tables.'
  }
  return ''
}

function getVisualizableWhereSubquery(ast) {
  if (!containsSubquery(ast?.where) || containsSubquery(ast?.having)) return null
  if (ast.groupby || hasAggregate(ast.columns)) return null

  const wrappers = collectSubqueryWrappers(ast.where)
  if (wrappers.length !== 1) return null
  if (!isScalarComparisonSubquery(ast.where, wrappers[0])) return null
  const inner = wrappers[0].ast
  if (!inner || inner.type !== 'select' || !Array.isArray(inner.columns) || inner.columns.length !== 1) return null
  if (inner.with || inner.groupby || inner.having || inner._next || inner.set_op || collectSubqueryWrappers(inner).length) return null
  if (inner.from && (!Array.isArray(inner.from) || inner.from.some((entry) => !getTableName(entry)))) return null

  const outerAliases = new Set((ast.from || []).map((entry) => String(entry.as || getTableName(entry)).toLowerCase()))
  const innerAliases = new Set((inner.from || []).map((entry) => String(entry.as || getTableName(entry)).toLowerCase()))
  const correlated = collectColumnReferences(inner).filter((reference) => reference.table && outerAliases.has(String(reference.table).toLowerCase()))
  if (correlated.some((reference) => innerAliases.has(String(reference.table).toLowerCase()))) return null
  return { wrapper: wrappers[0], inner, outerAliases, correlated }
}

function isScalarComparisonSubquery(value, target, parent = null) {
  if (!value || typeof value !== 'object') return false
  if (value === target) {
    return parent?.type === 'binary_expr' && !/\b(?:IN|EXISTS|ANY|SOME|ALL)\b/i.test(String(parent.operator || ''))
  }
  if (Array.isArray(value)) return value.some((item) => isScalarComparisonSubquery(item, target, parent))
  return Object.entries(value).some(([key, child]) => key !== 'ast' && isScalarComparisonSubquery(child, target, value))
}

function collectSubqueryWrappers(value, wrappers = []) {
  if (!value || typeof value !== 'object') return wrappers
  if (Array.isArray(value)) {
    value.forEach((item) => collectSubqueryWrappers(item, wrappers))
    return wrappers
  }
  if (value.ast?.type === 'select') {
    wrappers.push(value)
    return wrappers
  }
  Object.entries(value).forEach(([key, child]) => {
    if (key !== 'ast') collectSubqueryWrappers(child, wrappers)
  })
  return wrappers
}

function collectColumnReferences(value, references = []) {
  if (!value || typeof value !== 'object') return references
  if (Array.isArray(value)) {
    value.forEach((item) => collectColumnReferences(item, references))
    return references
  }
  if (value.type === 'column_ref' && value.column !== '*') references.push(value)
  Object.entries(value).forEach(([key, child]) => {
    if (key !== 'ast') collectColumnReferences(child, references)
  })
  return references
}

async function buildScalarSubqueryStep(parser, outerAst, subquery, queryRunner, previousResult) {
  const visibleReferences = collectColumnReferencesOutsideSubqueries(outerAst.where)
    .filter((reference) => !reference.table || subquery.outerAliases.has(String(reference.table).toLowerCase()))
  const allReferences = [...visibleReferences, ...subquery.correlated]
  const references = []
  const referenceKeys = new Set()
  allReferences.forEach((reference) => {
    const key = columnReferenceKey(reference)
    if (referenceKeys.has(key)) return
    referenceKeys.add(key)
    references.push({ key, expression: clone(reference), label: expressionText(reference, parser), reference })
  })

  const projectedReferences = references.map((item, index) => ({
    expr: clone(item.expression),
    as: `__visual_subquery_value_${index + 1}`,
  }))
  const sourceAst = clone(outerAst)
  sourceAst.columns = [...clone(outerAst.columns), ...projectedReferences]
  sourceAst.where = null
  sourceAst.groupby = null
  sourceAst.having = null
  sourceAst.orderby = null
  sourceAst.limit = null
  sourceAst.distinct = null
  sourceAst._next = null
  sourceAst.set_op = null

  const sourceSql = parser.sqlify(sourceAst, MYSQL_OPTIONS).replace(/;\s*$/, '')
  const sourceResult = await queryRunner(sourceSql)
  const helperStart = Math.max(0, sourceResult.columns.length - references.length)
  const innerExpression = expressionText(subquery.inner.columns[0].expr, parser)
  const totalOuterRows = sourceResult.totalRows ?? sourceResult.rows.length
  const executions = []
  const maxRowsToExplain = 25

  for (let index = 0; index < Math.min(sourceResult.rows.length, maxRowsToExplain); index += 1) {
    const sourceRow = sourceResult.rows[index]
    const referenceValues = new Map(references.map((item, referenceIndex) => [item.key, sourceRow[helperStart + referenceIndex]]))
    const innerAst = transformAst(clone(subquery.inner), (node) => {
      if (node.type !== 'column_ref' || !node.table) return undefined
      if (!subquery.outerAliases.has(String(node.table).toLowerCase())) return undefined
      const key = columnReferenceKey(node)
      if (!referenceValues.has(key)) throw new Error(`The outer value ${expressionText(node, parser)} could not be mapped into the inner query.`)
      return makeLiteralAst(parser, referenceValues.get(key))
    })
    const innerSql = parser.sqlify(innerAst, MYSQL_OPTIONS).replace(/;\s*$/, '')
    const innerResult = await queryRunner(innerSql)
    const scalarValue = innerResult.rows.length ? innerResult.rows[0][0] : null
    const conditionAst = transformAst(clone(outerAst.where), (node) => {
      if (node === subquery.wrapper || node.ast?.type === 'select') return makeLiteralAst(parser, scalarValue)
      if (node.type !== 'column_ref') return undefined
      const key = columnReferenceKey(node)
      if (!referenceValues.has(key)) return undefined
      return makeLiteralAst(parser, referenceValues.get(key))
    })
    const evaluationAst = parser.astify('SELECT 1', MYSQL_OPTIONS)
    evaluationAst.columns = [{ expr: conditionAst, as: '__visual_condition' }]
    const evaluationSql = parser.sqlify(evaluationAst, MYSQL_OPTIONS).replace(/;\s*$/, '')
    const conditionResult = await queryRunner(evaluationSql)
    const conditionValue = conditionResult.rows[0]?.[0] ?? null
    const passed = conditionValue === true || conditionValue === 1
    executions.push({
      rowNumber: index + 1,
      sourceRow,
      referenceValues: references.map((item) => ({ label: item.label, value: referenceValues.get(item.key) })),
      innerSql,
      scalarValue,
      conditionValue,
      passed,
      conditionText: `${expressionText(outerAst.where, parser)} evaluated ${conditionValue === null ? 'UNKNOWN (NULL)' : passed ? 'true' : 'false'}`,
    })
  }

  const columns = [
    'Outer row',
    ...sourceResult.columns.slice(0, helperStart),
    ...references.map((item) => item.label),
    `Inner result: ${innerExpression}`,
    'WHERE decision',
  ]
  const rows = executions.map((execution) => [
    execution.rowNumber,
    ...execution.sourceRow.slice(0, helperStart),
    ...execution.referenceValues.map((item) => item.value),
    execution.scalarValue,
    execution.conditionValue === null ? 'UNKNOWN — filtered out' : execution.passed ? 'Pass — row kept' : 'Fail — filtered out',
  ])
  const sample = executions[0]
  const capped = sourceResult.rows.length > executions.length || Boolean(sourceResult.truncated)
  return {
    id: 'scalar-subquery',
    kind: 'subquery',
    title: 'Run the inner query for each outer row',
    description: `The outer query supplies each row to the scalar subquery. The inner SELECT calculates ${innerExpression}; its value is then used by the outer WHERE condition. This view expands ${executions.length}${capped ? ` of ${totalOuterRows} rows` : ` ${totalOuterRows === 1 ? 'row' : 'rows'}`}.`,
    sql: sample?.innerSql || parser.sqlify(subquery.inner, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    input: previousResult || sourceResult,
    result: { columns, rows, totalRows: totalOuterRows, truncated: capped },
    executions,
    innerExpression,
    wrapperSql: expressionText(subquery.inner, parser),
    capped,
  }
}

function collectColumnReferencesOutsideSubqueries(value, references = []) {
  if (!value || typeof value !== 'object') return references
  if (Array.isArray(value)) {
    value.forEach((item) => collectColumnReferencesOutsideSubqueries(item, references))
    return references
  }
  if (value.type === 'column_ref' && value.column !== '*') references.push(value)
  Object.entries(value).forEach(([key, child]) => {
    if (key !== 'ast') collectColumnReferencesOutsideSubqueries(child, references)
  })
  return references
}

function columnReferenceKey(reference) {
  return `${String(reference.table || '').toLowerCase()}.${String(reference.column || '').toLowerCase()}`
}

function transformAst(value, replacer) {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((item) => transformAst(item, replacer))
  const replacement = replacer(value)
  if (replacement !== undefined) return replacement
  const result = {}
  Object.entries(value).forEach(([key, child]) => { result[key] = transformAst(child, replacer) })
  return result
}

function makeLiteralAst(parser, value) {
  const sqlLiteral = value === null || value === undefined
    ? 'NULL'
    : typeof value === 'number'
      ? (Number.isFinite(value) ? String(value) : 'NULL')
      : typeof value === 'boolean'
        ? (value ? '1' : '0')
        : `'${String(value).replace(/'/g, "''")}'`
  const literalQuery = parser.astify(`SELECT ${sqlLiteral}`, MYSQL_OPTIONS)
  return clone(literalQuery.columns[0].expr)
}

async function buildWindowExecutionStep(parser, ast, queryRunner, finalResult) {
  if (!finalResult) return { available: false, reason: 'Window results are ready, but partition details could not be attached to this result.', steps: [] }
  const functions = getWindowFunctions(ast, parser)
  const partitions = buildWindowPartitions(ast, finalResult, parser, queryRunner)
  let groups = []
  try { groups = await partitions } catch { groups = [] }
  const details = {
    id: 'window-functions',
    title: 'Window calculations',
    description: 'Window functions keep each input row, then calculate a value across its partition. The cards show each function and its partition, order, and frame; the result table shows the computed value on every row.',
    kind: 'window',
    sql: parser.sqlify(ast, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    result: finalResult,
    functions,
    partitions: groups,
    input: finalResult,
  }
  return { available: true, reason: '', steps: [details] }
}

async function buildWindowPartitions(ast, result, parser, queryRunner) {
  const windows = getWindowFunctions(ast, parser)
  const partitionExpressions = []
  windows.forEach((item) => item.partitionExpressions.forEach((expr) => {
    if (!partitionExpressions.some((current) => expressionText(current, parser) === expressionText(expr, parser))) partitionExpressions.push(expr)
  }))
  if (!partitionExpressions.length || ast.distinct) {
    return [{ label: ast.distinct ? 'Window rows (DISTINCT prevents hidden partition columns)' : 'All rows · one partition', keys: [], rows: result.rows, indexes: result.rows.map((_row, index) => index) }]
  }

  const copy = clone(ast)
  const selected = Array.isArray(ast.columns) ? clone(ast.columns) : [{ expr: { type: 'column_ref', table: null, column: '*' }, as: null }]
  const helpers = partitionExpressions.map((expr, index) => ({ expr: clone(expr), as: `__visual_partition_${index + 1}` }))
  copy.columns = [...selected, ...helpers]
  copy._next = null
  copy.set_op = null
  const response = await queryRunner(parser.sqlify(copy, MYSQL_OPTIONS).replace(/;\s*$/, ''))
  const helperOffset = Math.max(0, response.columns.length - helpers.length)
  const mapped = new Map()
  response.rows.forEach((row, index) => {
    const values = row.slice(helperOffset)
    const key = stableValue(values)
    if (!mapped.has(key)) mapped.set(key, { label: values.map((value, keyIndex) => `${expressionText(partitionExpressions[keyIndex], parser)} = ${value === null ? 'NULL' : String(value)}`).join(' · '), keys: values, rows: [], indexes: [] })
    const bucket = mapped.get(key)
    bucket.rows.push(result.rows[index] || row.slice(0, helperOffset))
    bucket.indexes.push(index)
  })
  return [...mapped.values()]
}

function getWindowFunctions(ast, parser) {
  const named = new Map()
  const namedItems = ast.window?.expr || []
  namedItems.forEach((entry) => {
    const spec = entry.as_window_specification?.window_specification || entry.as_window_specification
    if (entry.name) named.set(String(entry.name.value || entry.name).toLowerCase(), spec)
  })
  const output = []
  const visit = (node, alias = '') => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) { node.forEach((item) => visit(item, alias)); return }
    if (node.type === 'function' && node.over) {
      const name = getAstFunctionName(node)
      const reference = node.over.as_window_specification
      const spec = typeof reference === 'string'
        ? named.get(reference.toLowerCase())
        : reference?.window_specification || reference
      const partitionExpressions = spec?.partitionby?.map((entry) => entry.expr || entry) || []
      const ordering = spec?.orderby?.map((entry) => `${expressionText(entry.expr, parser)} ${entry.type || 'ASC'}`).join(', ') || ''
      const frame = spec?.window_frame_clause ? expressionText(spec.window_frame_clause, parser) : ''
      output.push({
        name: name || 'Window function',
        alias,
        specificationName: typeof reference === 'string' ? reference : '',
        partition: partitionExpressions.map((expr) => expressionText(expr, parser)),
        partitionExpressions,
        order: ordering,
        frame,
      })
      return
    }
    Object.entries(node).forEach(([key, value]) => visit(value, key === 'expr' ? alias : alias))
  }
  ;(ast.columns || []).forEach((column) => visit(column.expr, column.as || ''))
  return output
}

function getAstFunctionName(node) {
  const name = node.name?.name
  if (Array.isArray(name)) return name.map((part) => part.value || '').join('.').toUpperCase()
  return String(name?.value || name || '').toUpperCase()
}

function buildHierarchyExecutionStep(parser, ast, result) {
  if (!result?.columns?.length) return null
  const columns = result.columns.map((column) => String(column).replace(/[`"[\]]/g, '').toLowerCase())
  const idIndex = columns.findIndex((column) => ['id', 'employee_id', 'node_id'].includes(column))
  const parentIndex = columns.findIndex((column) => ['manager_id', 'parent_id', 'reports_to'].includes(column))
  const depthIndex = columns.findIndex((column) => ['depth', 'level', 'hierarchy_level'].includes(column))
  if (idIndex < 0 || parentIndex < 0) return null

  const records = result.rows.map((row, index) => ({ row, index, id: row[idIndex], parent: row[parentIndex], depth: depthIndex >= 0 ? Number(row[depthIndex]) : null }))
  const byId = new Map(records.map((record) => [String(record.id), record]))
  const getDepth = (record, seen = new Set()) => {
    if (Number.isFinite(record.depth)) return Math.max(0, record.depth)
    const key = String(record.id)
    if (seen.has(key)) return 0
    seen.add(key)
    const parent = record.parent === null ? null : byId.get(String(record.parent))
    return parent ? getDepth(parent, seen) + 1 : 0
  }
  const levels = new Map()
  records.forEach((record) => {
    const depth = getDepth(record)
    if (!levels.has(depth)) levels.set(depth, [])
    levels.get(depth).push(record)
  })
  return {
    id: 'recursive-hierarchy',
    title: 'Recursive hierarchy',
    description: 'The recursive CTE starts with its anchor rows, then repeatedly joins each discovered parent to its children. Rows are grouped by their returned depth or inferred parent level.',
    kind: 'hierarchy',
    sql: parser.sqlify(ast, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    result,
    input: result,
    idColumn: result.columns[idIndex],
    parentColumn: result.columns[parentIndex],
    depthColumn: depthIndex >= 0 ? result.columns[depthIndex] : 'inferred depth',
    levels: [...levels.entries()].sort(([left], [right]) => left - right).map(([depth, items]) => ({ depth, rows: items.map((item) => item.row), ids: items.map((item) => item.id), parents: items.map((item) => item.parent) })),
  }
}

async function buildSelfJoinHierarchyStep(parser, ast, queryRunner, result) {
  if (!result?.rows?.length || ast.distinct || !Array.isArray(ast.columns) || !Array.isArray(ast.from)) return null
  const relation = findSelfJoinRelation(ast)
  if (!relation) return null
  const copy = clone(ast)
  copy.columns = [
    ...clone(ast.columns),
    { expr: { type: 'column_ref', table: relation.childAlias, column: 'id' }, as: '__visual_child_id' },
    { expr: { type: 'column_ref', table: relation.childAlias, column: 'manager_id' }, as: '__visual_parent_id' },
  ]
  const response = await queryRunner(parser.sqlify(copy, MYSQL_OPTIONS).replace(/;\s*$/, ''))
  const offset = response.columns.length - 2
  const records = result.rows.map((row, index) => ({
    row,
    id: response.rows[index]?.[offset],
    parent: response.rows[index]?.[offset + 1] ?? null,
  }))
  if (records.some((record) => record.id === undefined)) return null
  const byId = new Map(records.map((record) => [String(record.id), record]))
  const depthFor = (record, seen = new Set()) => {
    const key = String(record.id)
    if (seen.has(key)) return 0
    seen.add(key)
    const parent = record.parent === null ? null : byId.get(String(record.parent))
    return parent ? depthFor(parent, seen) + 1 : 0
  }
  const levels = new Map()
  records.forEach((record) => {
    const depth = depthFor(record)
    if (!levels.has(depth)) levels.set(depth, [])
    levels.get(depth).push(record)
  })
  return {
    id: 'self-join-hierarchy',
    title: 'Manager hierarchy',
    description: `The self-join matches each ${relation.childAlias} row to its manager through manager_id = id. The rows are arranged into levels by following that parent link.`,
    kind: 'hierarchy',
    sql: parser.sqlify(ast, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    result,
    input: result,
    idColumn: 'employee id',
    parentColumn: 'manager_id',
    depthColumn: 'inferred depth',
    levels: [...levels.entries()].sort(([left], [right]) => left - right).map(([depth, items]) => ({
      depth,
      rows: items.map((item) => item.row),
      ids: items.map((item) => item.id),
      parents: items.map((item) => item.parent),
    })),
  }
}

function isEmployeeSelfJoin(ast) {
  return Boolean(findSelfJoinRelation(ast))
}

function findSelfJoinRelation(ast) {
  if (!Array.isArray(ast?.from)) return null
  for (let rightIndex = 1; rightIndex < ast.from.length; rightIndex += 1) {
    const right = ast.from[rightIndex]
    for (let leftIndex = 0; leftIndex < rightIndex; leftIndex += 1) {
      const left = ast.from[leftIndex]
      if (!getTableName(left) || getTableName(left).toLowerCase() !== getTableName(right).toLowerCase()) continue
      const leftAlias = String(left.as || getTableName(left))
      const rightAlias = String(right.as || getTableName(right))
      if (leftAlias.toLowerCase() === rightAlias.toLowerCase()) continue
      const conditions = collectEqualityColumnPairs(right.on)
      const candidates = [
        { childAlias: leftAlias, managerAlias: rightAlias },
        { childAlias: rightAlias, managerAlias: leftAlias },
      ]
      const relation = candidates.find(({ childAlias, managerAlias }) => conditions.some(([one, two]) =>
        isColumnPair(one, childAlias, 'manager_id') && isColumnPair(two, managerAlias, 'id')
        || isColumnPair(two, childAlias, 'manager_id') && isColumnPair(one, managerAlias, 'id')))
      if (relation) return relation
    }
  }
  return null
}

function collectEqualityColumnPairs(node, pairs = []) {
  if (!node || typeof node !== 'object') return pairs
  if (Array.isArray(node)) { node.forEach((item) => collectEqualityColumnPairs(item, pairs)); return pairs }
  if (node.type === 'binary_expr' && String(node.operator).trim() === '=' && node.left?.type === 'column_ref' && node.right?.type === 'column_ref') {
    pairs.push([node.left, node.right])
  }
  Object.values(node).forEach((value) => collectEqualityColumnPairs(value, pairs))
  return pairs
}

function isColumnPair(node, alias, column) {
  return String(node?.table || '').toLowerCase() === alias.toLowerCase()
    && String(node?.column || '').toLowerCase() === column.toLowerCase()
}

function isRecursiveCte(ast) {
  return Array.isArray(ast?.with) && ast.with.some((item) => Boolean(item.recursive))
}

function containsWindowExpression(value) {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(containsWindowExpression)
  if (value.type === 'window' || value.over?.type === 'window') return true
  return Object.values(value).some(containsWindowExpression)
}

function containsSubquery(value) {
  if (!value || typeof value !== 'object') return false
  if (value.type === 'select' || value.ast?.type === 'select') return true
  return Object.values(value).some((child) => Array.isArray(child)
    ? child.some(containsSubquery)
    : containsSubquery(child))
}

function getGroupExpressions(ast) {
  if (!ast.groupby) return []
  if (Array.isArray(ast.groupby)) return ast.groupby
  return Array.isArray(ast.groupby.columns) ? ast.groupby.columns : []
}

function hasAggregate(value) {
  if (!value) return false
  if (Array.isArray(value)) return value.some(hasAggregate)
  if (typeof value !== 'object') return false
  if (value.type === 'aggr_func') return true
  return Object.values(value).some(hasAggregate)
}

function getReferencedColumns(value, columns = new Set()) {
  if (!value) return []
  if (Array.isArray(value)) {
    value.forEach((item) => getReferencedColumns(item, columns))
  } else if (typeof value === 'object') {
    if (value.type === 'column_ref' && typeof value.column === 'string' && value.column !== '*') {
      columns.add(value.column.toLowerCase())
    }
    Object.values(value).forEach((item) => getReferencedColumns(item, columns))
  }
  return [...columns]
}

function expressionText(expression, parser) {
  try {
    return parser.exprToSQL(expression, MYSQL_OPTIONS)
  } catch {
    try {
      return parser.sqlify({
        type: 'select', with: null, options: null, distinct: null,
        columns: [{ expr: expression, as: null }], from: null,
        where: null, groupby: null, having: null, orderby: null, limit: null,
      }, MYSQL_OPTIONS).replace(/^SELECT\s+|;$/gi, '').trim()
    } catch {
      return 'the requested expression'
    }
  }
}

function describeJoin(entry, tableName, joinType, parser) {
  const condition = entry.on ? expressionText(entry.on, parser) : entry.using?.length ? `USING (${entry.using.join(', ')})` : 'the join condition'
  const behavior = joinType.toUpperCase().includes('LEFT')
    ? 'Every left-side row stays; unmatched right-side values appear as NULL.'
    : joinType.toUpperCase().includes('RIGHT')
      ? 'Every right-side row stays; unmatched left-side values appear as NULL.'
      : 'Only pairs that satisfy the join condition remain.'
  return `${joinType} JOIN matches rows with ${condition}. ${behavior}`
}

function describeSelect(columns, parser) {
  if (!columns || columns === '*') return 'SELECT keeps all available columns for the output. The query result is now shaped for display.'
  const names = columns.map((column) => {
    const expr = expressionText(column.expr, parser)
    return column.as ? `${expr} AS ${column.as}` : expr
  })
  return `SELECT projects ${names.join(', ')} into the output. Expressions and aliases are calculated here.`
}

function getTableName(entry) {
  return entry && typeof entry.table === 'string' ? entry.table : ''
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function stableValue(value) {
  return JSON.stringify(value, (_key, item) => typeof item === 'number' && Number.isFinite(item)
    ? Math.round(item * 1e8) / 1e8
    : item)
}

function closestName(value, choices) {
  let best = ''
  let distance = Infinity
  for (const choice of choices) {
    const current = levenshtein(value, String(choice).toLowerCase())
    if (current < distance) {
      best = choice
      distance = current
    }
  }
  return distance <= Math.max(1, Math.floor(value.length * 0.32)) ? best : ''
}

function levenshtein(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_item, index) => index)
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0]
    row[0] = i
    for (let j = 1; j <= right.length; j += 1) {
      const previous = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1))
      diagonal = previous
    }
  }
  return row[right.length]
}

function splitStatements(sql) {
  const statements = []
  let start = 0
  let quote = ''
  let lineComment = false
  let blockComment = false

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]
    const next = sql[index + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
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
      if (char === quote && sql[index - 1] !== '\\') {
        if (sql[index + 1] === quote && quote !== '`') index += 1
        else quote = ''
      }
      continue
    }

    if ((char === '-' && next === '-') || char === '#') {
      lineComment = true
      if (char === '-') index += 1
    } else if (char === '/' && next === '*') {
      blockComment = true
      index += 1
    } else if (char === "'" || char === '"' || char === '`') {
      quote = char
    } else if (char === ';') {
      const part = sql.slice(start, index).trim()
      if (part) statements.push(part)
      start = index + 1
    }
  }

  const tail = sql.slice(start).trim()
  if (tail) statements.push(tail)
  return statements
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
