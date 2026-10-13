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
    return { available: true, reason: '', steps: await buildRecursiveCteSteps(hierarchy, queryRunner) }
  }
  const steps = []
  let previousResult = null
  const sourceEntries = Array.isArray(ast.from) ? ast.from : []
  const hasFrom = sourceEntries.length > 0
  const visualSubquery = getVisualizableWhereSubquery(ast)
  let scalarSubqueryStep = null

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
        plain: `Read every row of the ${fromName} table.`,
        description: `FROM reads the starting rows from ${fromName}. No filtering or column selection has happened yet.`,
      }, { fromCount: 1 })

      for (let index = 1; index < sourceEntries.length; index += 1) {
        const entry = sourceEntries[index]
        const joinType = String(entry.join || 'JOIN').replace(/\s+JOIN$/i, '').trim() || 'INNER'
        const tableName = getTableName(entry)
        const leftEntry = sourceEntries[index - 1]
        const matchingSelfJoinEntry = sourceEntries.slice(0, index).find((source) => {
          const sourceTable = getTableName(source)
          return sourceTable && tableName && sourceTable.toLowerCase() === tableName.toLowerCase()
        })
        const leftTable = getTableName(matchingSelfJoinEntry || leftEntry)
        const leftAlias = String((matchingSelfJoinEntry || leftEntry).as || leftTable)
        const rightAlias = String(entry.as || tableName)
        const isSelfJoin = Boolean(matchingSelfJoinEntry)
        const condition = getJoinCondition(entry, parser)
        const joinRight = await queryRunner(`SELECT * FROM \`${String(tableName).replace(/`/g, '``')}\` LIMIT ${isSelfJoin ? 20 : 8}`)
        const joinStep = await runStep({
          id: `join-${index}`,
          kind: 'join',
          joinType,
          title: `${joinType} JOIN ${tableName}${isSelfJoin ? ` AS ${rightAlias}` : ''}`,
          plain: describeJoinPlain(entry, tableName, joinType, parser),
          description: describeJoin(entry, tableName, joinType, parser),
          joinTable: tableName,
          joinLeftTable: leftTable,
          joinLeftAlias: leftAlias,
          joinRightTable: tableName,
          joinRightAlias: rightAlias,
          joinCondition: condition,
          isSelfJoin,
          joinRight,
        }, { fromCount: index + 1 })
        if (isSelfJoin) {
          const leftColumnCount = joinStep.input?.columns?.length || 0
          joinStep.joinDisplayResult = {
            ...joinStep.result,
            columns: joinStep.result.columns.map((column, columnIndex) =>
              `${columnIndex < leftColumnCount ? leftAlias : rightAlias}.${column}`),
          }
        }
      }
    }

    if (visualSubquery) {
      const subqueryStep = visualSubquery.kind === 'membership'
        ? await buildMembershipSubqueryStep(parser, ast, visualSubquery, queryRunner, previousResult)
        : visualSubquery.kind === 'exists'
          ? await buildExistsSubqueryStep(parser, ast, visualSubquery, queryRunner, previousResult)
          : await buildScalarSubqueryStep(parser, ast, visualSubquery, queryRunner, previousResult)
      if (subqueryStep) {
        steps.push(subqueryStep)
        if (subqueryStep.kind === 'subquery') scalarSubqueryStep = subqueryStep
      }
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
      const filterInput = await queryRunner(filterRows)
      let walkthroughInput = filterInput
      if (scalarSubqueryStep) {
        const valueColumn = scalarSubqueryStep.result.columns.at(-1)
        const computedValues = scalarSubqueryStep.executions.map((execution) => execution.scalarValue)
        walkthroughInput = {
          ...filterInput,
          columns: [...filterInput.columns, valueColumn],
          rows: filterInput.rows.map((row, index) => [...row, index < computedValues.length ? computedValues[index] : 'Not expanded']),
        }
      }
      await runStep({
        id: 'where',
        title: 'WHERE',
        plain: containsSubquery(ast.where) ? 'Keep only the rows that pass the subquery test.' : `Keep only the rows where ${expressionText(ast.where, parser)}.`,
        description: `WHERE evaluates ${expressionText(ast.where, parser)} against each incoming row. TRUE keeps the row; FALSE or UNKNOWN removes it before the next query stage.`,
        filterFlags: markerResult.rows.map((row) => Boolean(row[0])),
        filterResults: markerResult.rows.map((row) => row[0] ?? null),
        filterReason: expressionText(ast.where, parser),
        filterInput: walkthroughInput,
        subqueryValueColumn: scalarSubqueryStep?.result.columns.at(-1) || '',
        subqueryExpression: scalarSubqueryStep?.innerExpression || '',
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
        plain: `Bundle rows that share the same ${groupExpressions.map((expr) => expressionText(expr, parser)).join(' + ')} into one group each.`,
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
        plain: `Calculate ${aggregateNames(ast.columns)} for each group.`,
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
        plain: `Calculate ${aggregateNames(ast.columns)} across all the rows, giving a single answer.`,
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
        plain: `Keep only the groups where ${expressionText(ast.having, parser)}.`,
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
      plain: describeSelectPlain(ast.columns, parser),
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
        plain: 'Remove rows that are exact duplicates of an earlier row.',
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
        plain: describeOrderPlain(ast.orderby, parser),
        description: `ORDER BY sorts the selected rows by ${ast.orderby.map((order) => `${expressionText(order.expr, parser)} ${order.type || 'ASC'}`).join(', ')}.`,
        sortKeys: getSortKeys(ast.orderby, parser),
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
      limitStep.plain = `Keep only the first ${limitStep.limitCount} ${limitStep.limitCount === 1 ? 'row' : 'rows'} and discard the rest.`
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
    return 'Step view not available for this query yet: this subquery shape cannot be expanded safely. Try a single-column IN query, a correlated EXISTS query, or a scalar comparison in WHERE.'
  }
  return ''
}

function getVisualizableWhereSubquery(ast) {
  if (!containsSubquery(ast?.where) || containsSubquery(ast?.having)) return null
  if (ast.groupby || hasAggregate(ast.columns)) return null

  const wrappers = collectSubqueryWrappers(ast.where)
  if (wrappers.length !== 1) return null
  const inner = wrappers[0].ast
  if (!inner || inner.type !== 'select' || !Array.isArray(inner.columns) || !inner.columns.length) return null
  if (inner.with || inner.groupby || inner.having || inner._next || inner.set_op) return null
  if (inner.from && (!Array.isArray(inner.from) || inner.from.some((entry) => !getTableName(entry)))) return null

  const ancestors = findSubqueryAncestors(ast.where, wrappers[0]) || []
  const membership = [...ancestors].reverse().find((node) => node.type === 'binary_expr' && /^(?:NOT\s+)?IN$/i.test(String(node.operator || '')))
  const exists = [...ancestors].reverse().find((node) =>
    node.type === 'unary_expr' && /EXISTS/i.test(String(node.operator || ''))
    || node.type === 'function' && (node.name?.name || []).some((part) => /EXISTS/i.test(String(part.value || ''))))
  const kind = membership ? 'membership' : exists ? 'exists' : isScalarComparisonSubquery(ast.where, wrappers[0]) ? 'scalar' : ''
  if (!kind) return null
  if (kind === 'membership' && inner.columns.length !== 1) return null
  if (kind === 'scalar' && (inner.columns.length !== 1 || collectSubqueryWrappers(inner).length)) return null

  const nestedWrappers = kind === 'exists' ? collectSubqueryWrappers(inner.where) : []
  if (nestedWrappers.length > 1) return null
  if (nestedWrappers.length === 1) {
    const nested = nestedWrappers[0].ast
    if (!isScalarComparisonSubquery(inner.where, nestedWrappers[0])
      || !nested || nested.type !== 'select' || !Array.isArray(nested.columns) || nested.columns.length !== 1
      || nested.with || nested.groupby || nested.having || nested._next || nested.set_op
      || collectSubqueryWrappers(nested).length
      || nested.from && (!Array.isArray(nested.from) || nested.from.some((entry) => !getTableName(entry)))) return null
  }

  const outerAliases = new Set((ast.from || []).map((entry) => String(entry.as || getTableName(entry)).toLowerCase()))
  const innerAliases = new Set((inner.from || []).map((entry) => String(entry.as || getTableName(entry)).toLowerCase()))
  const correlated = collectColumnReferences(inner).filter((reference) => reference.table && outerAliases.has(String(reference.table).toLowerCase()))
  if (correlated.some((reference) => innerAliases.has(String(reference.table).toLowerCase()))) return null
  if (kind === 'membership' && correlated.length) return null
  return {
    kind,
    wrapper: wrappers[0],
    inner,
    outerAliases,
    correlated,
    membershipExpression: membership?.left || null,
    operator: membership?.operator || '',
    negated: /NOT/i.test(String(membership?.operator || exists?.operator || '')),
  }
}

function findSubqueryAncestors(value, target, ancestors = []) {
  if (value === target) return ancestors
  if (!value || typeof value !== 'object') return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSubqueryAncestors(item, target, ancestors)
      if (found) return found
    }
    return null
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'ast' && child?.type === 'select') continue
    const found = findSubqueryAncestors(child, target, [...ancestors, value])
    if (found) return found
  }
  return null
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

async function buildMembershipSubqueryStep(parser, outerAst, subquery, queryRunner, previousResult) {
  const valueColumn = { expr: clone(subquery.membershipExpression), as: '__visual_membership_value' }
  const passColumn = { expr: clone(outerAst.where), as: '__visual_where_passes' }
  const source = makeOuterSourceQuery(parser, outerAst, [valueColumn, passColumn])
  const [sourceResult, innerResult] = await Promise.all([
    queryRunner(source.sql),
    queryRunner(parser.sqlify(subquery.inner, MYSQL_OPTIONS).replace(/;\s*$/, '')),
  ])
  const valueIndex = sourceResult.columns.length - 2
  const passIndex = sourceResult.columns.length - 1
  const membershipValues = innerResult.rows.map((row) => row[0])
  const operator = String(subquery.operator || 'IN').toUpperCase()
  const rows = sourceResult.rows.map((row) => {
    const value = row[valueIndex]
    const condition = row[passIndex]
    const passed = condition === true || condition === 1
    const matched = membershipValues.some((candidate) => candidate !== null && stableValue(candidate) === stableValue(value))
    const decision = condition === null
      ? 'UNKNOWN · filtered out'
      : passed
        ? `${matched ? 'Match' : 'Condition passed'} · kept`
        : `${matched ? 'Match' : 'No match'} · filtered out`
    return [...row.slice(0, valueIndex), value, decision]
  })
  const columns = [
    ...sourceResult.columns.slice(0, valueIndex),
    expressionText(subquery.membershipExpression, parser),
    `${operator} decision`,
  ]
  const capped = Boolean(sourceResult.truncated || innerResult.truncated)

  return {
    id: 'subquery-membership',
    kind: 'subquery-membership',
    title: 'Build the inner set, then check each row',
    plain: `Run the inner query once to get ${innerResult.totalRows} ${innerResult.totalRows === 1 ? 'value' : 'values'}, then keep only the rows whose ${expressionText(subquery.membershipExpression, parser)} ${/NOT/i.test(operator) ? 'is not' : 'is'} in that list.`,
    description: `The inner query runs once and returns ${innerResult.totalRows} value${innerResult.totalRows === 1 ? '' : 's'}. The outer query checks each ${expressionText(subquery.membershipExpression, parser)} against that set; only rows that satisfy ${expressionText(outerAst.where, parser)} remain.`,
    sql: parser.sqlify(subquery.inner, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    input: previousResult || sourceResult,
    result: { columns, rows, totalRows: sourceResult.totalRows, truncated: capped },
    innerResult,
    membershipValues,
    membershipExpression: expressionText(subquery.membershipExpression, parser),
    operator,
    filterFlags: rows.map((row) => row.at(-1).includes('kept')),
    capped,
  }
}

async function buildExistsSubqueryStep(parser, outerAst, subquery, queryRunner, previousResult) {
  const references = []
  const seen = new Set()
  subquery.correlated.forEach((reference) => {
    const key = columnReferenceKey(reference)
    if (seen.has(key)) return
    seen.add(key)
    references.push({ key, expression: clone(reference), label: expressionText(reference, parser) })
  })
  const helperColumns = references.map((reference, index) => ({
    expr: clone(reference.expression),
    as: `__visual_exists_outer_${index + 1}`,
  }))
  const source = makeOuterSourceQuery(parser, outerAst, helperColumns)
  const sourceResult = await queryRunner(source.sql)
  const totalOuterRows = sourceResult.totalRows ?? sourceResult.rows.length
  const executions = []
  const maxRowsToExplain = 25
  const nestedWrappers = collectSubqueryWrappers(subquery.inner.where)

  for (let index = 0; index < Math.min(sourceResult.rows.length, maxRowsToExplain); index += 1) {
    const sourceRow = sourceResult.rows[index]
    const values = new Map(references.map((reference, referenceIndex) => [reference.key, sourceRow[source.baseColumnCount + referenceIndex]]))
    const replaceOuterReferences = (node) => {
      if (node.type !== 'column_ref' || !node.table || !subquery.outerAliases.has(String(node.table).toLowerCase())) return undefined
      const key = columnReferenceKey(node)
      if (!values.has(key)) throw new Error(`The outer value ${expressionText(node, parser)} could not be mapped into the inner query.`)
      return makeLiteralAst(parser, values.get(key))
    }
    const innerAst = transformAst(clone(subquery.inner), replaceOuterReferences)
    const innerSql = parser.sqlify(innerAst, MYSQL_OPTIONS).replace(/;\s*$/, '')
    const matchingAst = clone(innerAst)
    matchingAst.columns = [{ expr: { type: 'column_ref', table: null, column: '*' }, as: null }]
    const matchingResult = await queryRunner(parser.sqlify(matchingAst, MYSQL_OPTIONS).replace(/;\s*$/, ''))
    const matchCount = matchingResult.totalRows ?? matchingResult.rows.length
    const hasMatch = matchCount > 0
    const passed = subquery.negated ? !hasMatch : hasMatch
    const nestedValues = []

    for (const wrapper of nestedWrappers) {
      try {
        const nestedAst = transformAst(clone(wrapper.ast), replaceOuterReferences)
        const nestedSql = parser.sqlify(nestedAst, MYSQL_OPTIONS).replace(/;\s*$/, '')
        const nestedResult = await queryRunner(nestedSql)
        nestedValues.push({
          label: expressionText(wrapper.ast.columns[0].expr, parser),
          value: nestedResult.rows[0]?.[0] ?? null,
          sql: nestedSql,
        })
      } catch {
        // The full inner query still provides the authoritative EXISTS decision.
      }
    }

    const referenceValues = references.map((reference) => ({ label: reference.label, value: values.get(reference.key) }))
    const decision = passed
      ? `${subquery.negated ? 'No matching row' : 'At least one match'} · kept`
      : `${subquery.negated ? 'A match exists' : 'No match'} · filtered out`
    executions.push({
      rowNumber: index + 1,
      sourceRow,
      referenceValues,
      innerSql,
      matchingResult,
      matchCount,
      hasMatch,
      passed,
      decision,
      nestedValues,
    })
  }

  const rows = executions.map((execution) => [
    ...execution.sourceRow.slice(0, source.baseColumnCount),
    ...execution.referenceValues.map((reference) => reference.value),
    execution.matchCount,
    execution.decision,
  ])
  const columns = [
    ...sourceResult.columns.slice(0, source.baseColumnCount),
    ...references.map((reference) => reference.label),
    'Matching inner rows',
    subquery.negated ? 'NOT EXISTS decision' : 'EXISTS decision',
  ]
  const capped = sourceResult.rows.length > executions.length || Boolean(sourceResult.truncated)
  const verb = subquery.negated ? 'NOT EXISTS' : 'EXISTS'
  const rowCoverage = capped ? `the first ${executions.length} of ${totalOuterRows}` : `all ${totalOuterRows}`

  return {
    id: 'subquery-exists',
    kind: 'subquery-exists',
    title: `Check ${verb} for each outer row`,
    plain: `For each row, look for matching rows in the inner query. Keep the row when ${subquery.negated ? 'none are found' : 'at least one is found'}.`,
    description: `For each outer row, the lab supplies its correlated value${references.length === 1 ? '' : 's'} to the inner query. ${verb} keeps or filters the employee based on whether that lookup returns any rows.${nestedWrappers.length ? ' The nested average is evaluated for the same employee.' : ''} This walkthrough evaluates ${rowCoverage} outer rows.`,
    sql: executions[0]?.innerSql || parser.sqlify(subquery.inner, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    input: previousResult || sourceResult,
    result: { columns, rows, totalRows: totalOuterRows, truncated: capped },
    executions,
    negated: subquery.negated,
    capped,
  }
}

function makeOuterSourceQuery(parser, outerAst, helperColumns) {
  const sourceAst = clone(outerAst)
  const baseColumns = Array.isArray(outerAst.columns)
    ? clone(outerAst.columns)
    : [{ expr: { type: 'column_ref', table: null, column: '*' }, as: null }]
  sourceAst.columns = [...baseColumns, ...helperColumns]
  sourceAst.where = null
  sourceAst.groupby = null
  sourceAst.having = null
  sourceAst.orderby = null
  sourceAst.limit = null
  sourceAst.distinct = null
  sourceAst._next = null
  sourceAst.set_op = null
  return {
    sql: parser.sqlify(sourceAst, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    baseColumnCount: baseColumns.length,
  }
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
    let innerRowsResult = null
    let innerRowsSql = ''
    if (hasAggregate(subquery.inner.columns)) {
      const innerRowsAst = clone(innerAst)
      innerRowsAst.columns = [{ expr: { type: 'column_ref', table: null, column: '*' }, as: null }]
      innerRowsAst.groupby = null
      innerRowsAst.having = null
      innerRowsAst.orderby = null
      innerRowsAst.limit = null
      innerRowsAst.distinct = null
      innerRowsAst.with = null
      innerRowsAst._next = null
      innerRowsAst.set_op = null
      innerRowsSql = parser.sqlify(innerRowsAst, MYSQL_OPTIONS).replace(/;\s*$/, '')
      innerRowsResult = await queryRunner(innerRowsSql)
    }
    const referenceValuesList = references.map((item) => ({ label: item.label, value: referenceValues.get(item.key) }))
    executions.push({
      rowNumber: index + 1,
      sourceRow,
      outerColumns: sourceResult.columns.slice(0, helperStart),
      referenceValues: referenceValuesList,
      correlatedValues: subquery.correlated.map((reference) => ({
        label: expressionText(reference, parser),
        value: referenceValues.get(columnReferenceKey(reference)),
      })),
      innerSql,
      innerRowsSql,
      innerRowsResult,
      innerResult,
      scalarValue,
    })
  }

  const columns = [
    ...sourceResult.columns.slice(0, helperStart),
    `Subquery result · ${innerExpression}`,
  ]
  const outerRows = sourceResult.rows.map((row) => row.slice(0, helperStart))
  const rows = outerRows.map((row, index) => [...row, index < executions.length ? executions[index].scalarValue : 'Waiting'])
  const sample = executions[0]
  const capped = sourceResult.rows.length > executions.length || Boolean(sourceResult.truncated)
  return {
    id: 'scalar-subquery',
    kind: 'subquery',
    title: 'Add the subquery result to each row',
    plain: `Run the inner query for each outer row and place its ${innerExpression} answer in a new column. The next WHERE stage checks the rows.`,
    description: `The outer query supplies one row at a time to the scalar subquery. The inner SELECT calculates ${innerExpression} for that row, and the result is shown as an added column before WHERE filters anything. This walkthrough expands ${executions.length}${capped ? ` of ${totalOuterRows} outer rows` : ` outer ${totalOuterRows === 1 ? 'row' : 'rows'}`}.`,
    sql: sample?.innerSql || parser.sqlify(subquery.inner, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    input: previousResult || sourceResult,
    result: { columns, rows, totalRows: totalOuterRows, truncated: capped },
    outerRows,
    outerColumns: sourceResult.columns.slice(0, helperStart),
    executions,
    innerExpression,
    inputRelation: getTableName(subquery.inner.from?.[0]),
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
  const querySql = parser.sqlify(ast, MYSQL_OPTIONS).replace(/;\s*$/, '')
  let windowResult = finalResult
  if (ast.orderby || ast.limit) {
    const beforeFinalSort = clone(ast)
    beforeFinalSort.orderby = null
    beforeFinalSort.limit = null
    try { windowResult = await queryRunner(parser.sqlify(beforeFinalSort, MYSQL_OPTIONS).replace(/;\s*$/, '')) } catch { windowResult = finalResult }
  }

  const inputAst = clone(ast)
  inputAst.columns = (ast.columns || []).filter((column) => !containsWindowNode(column.expr)).map((column) => clone(column))
  if (!inputAst.columns.length) inputAst.columns = [{ expr: { type: 'column_ref', table: null, column: '*' }, as: null }]
  inputAst.window = null
  inputAst.qualify = null
  inputAst.orderby = null
  inputAst.limit = null
  let windowInput
  try {
    windowInput = await queryRunner(parser.sqlify(inputAst, MYSQL_OPTIONS).replace(/;\s*$/, ''))
  } catch {
    windowInput = { columns: windowResult.columns, rows: windowResult.rows.map((row) => row.slice()), totalRows: windowResult.totalRows ?? windowResult.rows.length }
  }

  let groups = []
  try { groups = await buildWindowPartitions(ast, windowResult, parser, queryRunner) } catch { groups = [] }
  groups = groups.map((group) => ({
    ...group,
    inputRows: group.indexes.map((index) => windowInput.rows[index]).filter(Boolean),
  }))

  const mainWindow = functions[0]
  const partitionTitle = mainWindow?.partition?.length ? `PARTITION BY ${mainWindow.partition.join(', ')}` : 'One shared partition'
  const orderingTitle = mainWindow?.order ? `ORDER BY ${mainWindow.order}` : 'window order'
  const functionTitle = mainWindow?.name || 'window function'
  const shared = { kind: 'window', functions, partitions: groups, sql: querySql, input: windowInput }
  const steps = [{
    ...shared,
    id: 'window-input',
    windowPhase: 'input',
    title: 'Rows entering the window',
    plain: 'The query first produces the employee rows that the window function will inspect. No employee is removed by RANK.',
    description: 'These rows are the input to the OVER clause. The window calculation adds a value to each row; it does not group employees into one summary row.',
    sql: parser.sqlify(inputAst, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    result: windowInput,
  }, {
    ...shared,
    id: 'window-partition',
    windowPhase: 'partition',
    title: partitionTitle,
    plain: `Split incoming rows by ${partitionTitle}. Each partition is an independent calculation group.`,
    description: `PARTITION BY groups rows with the same ${mainWindow?.partition?.join(', ') || 'partition key'}. The window function starts over in each partition, so values from different groups are not compared.`,
    result: windowResult,
    input: windowInput,
  }, {
    ...shared,
    id: 'window-rank',
    windowPhase: 'rank',
    title: `${orderingTitle} · assign ${functionTitle}`,
    plain: `Inside each ${mainWindow?.partition?.length ? 'partition' : 'window'}, sort rows by ${mainWindow?.order || 'the window order'} and calculate ${functionTitle} for every row.`,
    description: `ORDER BY inside OVER controls the sequence within each partition. ${functionTitle} calculates a value for every row without removing any rows.`,
    result: windowResult,
    input: windowInput,
  }]

  if (ast.orderby || ast.limit) {
    const sortKeys = getSortKeys(ast.orderby, parser)
    steps.push({
      id: ast.orderby ? 'order' : 'limit',
      title: ast.orderby ? 'Final ORDER BY' : 'Final LIMIT',
      plain: ast.orderby ? 'After every rank has been calculated, the outer ORDER BY arranges the completed rows for display.' : 'The final LIMIT returns only the requested number of already-ranked rows.',
      description: ast.orderby ? `The outer ORDER BY ${sortKeys.map((key) => `${key.expression} ${key.direction}`).join(', ')} is outside OVER(...). It changes the order of the finished result; it does not change how RANK was assigned.` : 'LIMIT is applied after the window values are calculated.',
      kind: ast.orderby ? 'order' : 'limit',
      sortKeys,
      sql: querySql,
      input: windowResult,
      result: finalResult,
    })
  }
  return { available: true, reason: '', steps }
}

function containsWindowNode(node) {
  if (!node || typeof node !== 'object') return false
  if (Array.isArray(node)) return node.some(containsWindowNode)
  if (node.type === 'function' && node.over) return true
  return Object.entries(node).some(([key, value]) => key !== 'ast' && containsWindowNode(value))
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
  copy.orderby = null
  copy.limit = null
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
      const orderKeys = getSortKeys(spec?.orderby, parser)
      const ordering = orderKeys.map((entry) => `${entry.expression} ${entry.direction}`).join(', ')
      const frame = spec?.window_frame_clause ? expressionText(spec.window_frame_clause, parser) : ''
      output.push({
        name: name || 'Window function',
        alias,
        specificationName: typeof reference === 'string' ? reference : '',
        partition: partitionExpressions.map((expr) => expressionText(expr, parser)),
        partitionExpressions,
        order: ordering,
        orderKeys,
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
  const recursiveCte = (ast.with || []).find((item) => item.recursive)
  const cteQuery = recursiveCte?.stmt?.ast
  let anchorSql = ''
  let recursiveSql = ''
  let outerSql = ''
  if (cteQuery) {
    const anchor = clone(cteQuery)
    anchor.with = null
    anchor._next = null
    anchor.set_op = null
    anchorSql = parser.sqlify(anchor, MYSQL_OPTIONS).replace(/;\s*$/, '')

    if (cteQuery._next) {
      const recursive = clone(cteQuery._next)
      recursive.with = null
      recursive._next = null
      recursive.set_op = null
      recursiveSql = parser.sqlify(recursive, MYSQL_OPTIONS).replace(/;\s*$/, '')
    }

    const outer = clone(ast)
    outer.with = null
    outerSql = parser.sqlify(outer, MYSQL_OPTIONS).replace(/;\s*$/, '')
  }
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
    plain: 'Start with the top-level rows, then repeatedly find the rows that report to them, adding one level of the tree per pass.',
    description: 'A recursive CTE runs its anchor member once, then repeats its recursive member using the rows found in the previous pass. Rows are grouped by their returned depth or inferred parent level.',
    kind: 'hierarchy',
    sql: parser.sqlify(ast, MYSQL_OPTIONS).replace(/;\s*$/, ''),
    result,
    input: result,
    recursiveCte: Boolean(recursiveCte),
    cteName: recursiveCte?.name?.value || recursiveCte?.name || '',
    anchorSql,
    recursiveSql,
    outerSql,
    idColumn: result.columns[idIndex],
    parentColumn: result.columns[parentIndex],
    depthColumn: depthIndex >= 0 ? result.columns[depthIndex] : 'inferred depth',
    outerOrderBy: getSortKeys(ast.orderby, parser),
    levels: [...levels.entries()].sort(([left], [right]) => left - right).map(([depth, items]) => ({ depth, rows: items.map((item) => item.row), ids: items.map((item) => item.id), parents: items.map((item) => item.parent) })),
  }
}

async function buildRecursiveCteSteps(hierarchy, queryRunner) {
  if (!hierarchy.recursiveCte || !hierarchy.recursiveSql || !hierarchy.levels?.length) return [hierarchy]

  const steps = []
  const columns = hierarchy.result.columns
  const anchorLevel = hierarchy.levels.find((level) => level.depth === 0) || { depth: 0, rows: [] }
  let anchorResult = { columns, rows: anchorLevel.rows, totalRows: anchorLevel.rows.length }
  try {
    const actualAnchor = await queryRunner(hierarchy.anchorSql)
    if (actualAnchor?.columns?.length) anchorResult = actualAnchor
  } catch {
    // The anchor rows from the completed CTE still provide a useful view when a runner cannot execute the isolated member.
  }

  const common = {
    kind: 'hierarchy',
    sql: hierarchy.sql,
    recursiveCte: true,
    cteName: hierarchy.cteName,
    anchorSql: hierarchy.anchorSql,
    recursiveSql: hierarchy.recursiveSql,
    outerSql: hierarchy.outerSql,
    levels: hierarchy.levels,
    idColumn: hierarchy.idColumn,
    parentColumn: hierarchy.parentColumn,
    depthColumn: hierarchy.depthColumn,
    outerOrderBy: hierarchy.outerOrderBy || [],
  }
  steps.push({
    ...common,
    id: 'cte-anchor',
    hierarchyPhase: 'anchor',
    title: 'Anchor query · find the roots',
    plain: `Run the anchor SELECT once to place root rows into ${hierarchy.cteName} at depth 0.`,
    description: 'The anchor member runs once. In this query, manager_id IS NULL identifies the employees at the top of the organization.',
    sql: hierarchy.anchorSql,
    result: anchorResult,
    input: null,
    activeLevel: anchorLevel,
  })

  const levels = hierarchy.levels.filter((level) => level.depth > 0)
  levels.forEach((level) => {
    const previous = hierarchy.levels.find((item) => item.depth === level.depth - 1) || anchorLevel
    const previousResult = { columns, rows: previous.rows, totalRows: previous.rows.length }
    const passResult = { columns, rows: level.rows, totalRows: level.rows.length }
    steps.push({
      ...common,
      id: `cte-pass-${level.depth}`,
      hierarchyPhase: 'recursive',
      title: `Recursive pass ${level.depth} · find the next level`,
      plain: `Use the employees found in the previous pass to find their direct reports. Add ${level.rows.length} ${level.rows.length === 1 ? 'new row' : 'new rows'} at depth ${level.depth}.`,
      description: `The recursive member joins employees.manager_id to ${hierarchy.cteName}.id from the previous pass. These newly matched employees become the next level of the organization.`,
      sql: hierarchy.recursiveSql,
      result: passResult,
      input: previousResult,
      activeLevel: level,
      previousLevel: previous,
    })
  })

  const lastLevel = hierarchy.levels.at(-1) || anchorLevel
  const lastResult = { columns, rows: lastLevel.rows, totalRows: lastLevel.rows.length }
  steps.push({
    ...common,
    id: 'cte-stop',
    hierarchyPhase: 'stop',
    title: 'Stop when a pass adds no rows',
    plain: `The next recursive pass finds no employees reporting to depth ${lastLevel.depth}, so the recursion is complete.`,
    description: 'A recursive CTE ends when its recursive member returns an empty batch. No new rows are added after this point.',
    sql: hierarchy.recursiveSql,
    result: { columns, rows: [], totalRows: 0 },
    input: lastResult,
    activeLevel: { depth: lastLevel.depth + 1, rows: [] },
    previousLevel: lastLevel,
  })
  steps.push({
    ...common,
    id: 'cte-final',
    hierarchyPhase: 'final',
    title: 'Outer SELECT · return the completed hierarchy',
    plain: `Read all accumulated rows from ${hierarchy.cteName}, then return them in the requested order.`,
    description: `After recursion stops, the outer SELECT reads the completed CTE. Its ORDER BY arranges rows by depth and then id.`,
    sql: hierarchy.outerSql || hierarchy.sql,
    result: hierarchy.result,
    input: hierarchy.result,
  })
  return steps
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

// Display-only text: backtick quoting from the MySQL printer is dropped so labels read naturally.
function expressionText(expression, parser) {
  return rawExpressionText(expression, parser).replace(/`/g, '')
}

function rawExpressionText(expression, parser) {
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

function getJoinCondition(entry, parser) {
  return entry.on ? expressionText(entry.on, parser) : entry.using?.length ? `USING (${entry.using.join(', ')})` : 'the join condition'
}

function describeJoin(entry, tableName, joinType, parser) {
  const condition = getJoinCondition(entry, parser)
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

function describeJoinPlain(entry, tableName, joinType, parser) {
  const condition = entry.on ? expressionText(entry.on, parser) : entry.using?.length ? `USING (${entry.using.join(', ')})` : 'the join condition is true'
  const upper = String(joinType).toUpperCase()
  const keep = upper.includes('LEFT')
    ? 'Left rows without a partner are kept, with NULLs on the right.'
    : upper.includes('RIGHT')
      ? 'Right rows without a partner are kept, with NULLs on the left.'
      : 'Rows without a partner are dropped.'
  return `Attach ${tableName} rows wherever ${condition}. ${keep}`
}

function describeSelectPlain(columns, parser) {
  if (!columns || columns === '*') return 'Keep every column.'
  const names = columns.map((column) => {
    const text = column.as || expressionText(column.expr, parser)
    return text === '*' ? 'all columns' : text
  })
  const shown = names.slice(0, 4).join(', ')
  return `Pick the output columns: ${shown}${names.length > 4 ? ` and ${names.length - 4} more` : ''}.`
}

function describeOrderPlain(orderby, parser) {
  const parts = (orderby || []).map((order) => `${expressionText(order.expr, parser)} ${String(order.type || 'ASC').toUpperCase() === 'DESC' ? '(high to low)' : '(low to high)'}`)
  return `Sort the rows by ${parts.join(', then ')}.`
}

function getSortKeys(orderby, parser) {
  return (orderby || []).map((term) => ({
    expression: expressionText(term.expr, parser),
    direction: String(term.type || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
  }))
}

function aggregateNames(value, names = new Set(), top = true) {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) value.forEach((item) => aggregateNames(item, names, false))
    else {
      if (value.type === 'aggr_func') names.add(String(value.name || '').toUpperCase())
      Object.values(value).forEach((item) => aggregateNames(item, names, false))
    }
  }
  if (!top) return names
  return [...names].join(', ') || 'a summary value'
}
