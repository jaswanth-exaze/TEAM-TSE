import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getMysqlInlineReveal, getMysqlStudySupport } from '../data/courses/mysql/study-support'

export const LESSON_SECTIONS = [
  ['whatIsIt', 'What is it?'],
  ['syntaxBreakdown', 'Syntax breakdown'],
  ['basicExample', 'Basic example'],
  ['goingDeeper', 'Going deeper'],
  ['commonMistakes', 'Watch out — common mistakes'],
  ['edgeCaseSpotlight', 'Edge case spotlight'],
  ['tryThis', 'Try this'],
  ['answerKey', 'Answer key'],
  ['quickRecap', 'Quick recap'],
  ['upNext', 'Up next'],
]

const SQL_START = /^(SELECT\b|WITH\b|CREATE\b|INSERT\b|UPDATE\b|DELETE\b|ALTER\b|DROP\b|SHOW\b|DESCRIBE\b|DESC\b|EXPLAIN\b|BEGIN\b|START TRANSACTION\b|COMMIT\b|ROLLBACK\b|GRANT\b|REVOKE\b|SET\b|USE\b|CALL\b|PREPARE\b|EXECUTE\b|DEALLOCATE\b|--|\/\*|ORDER BY\b|GROUP BY\b|HAVING\b|LIMIT\b|UNION\b|JOIN\b|INNER JOIN\b|LEFT JOIN\b|RIGHT JOIN\b|ON\b)/i
const SQL_TOKEN = /(\b(?:SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE|PRIMARY KEY|FOREIGN KEY|NOT NULL|UNIQUE|DEFAULT|AUTO_INCREMENT|INNER JOIN|LEFT JOIN|RIGHT JOIN|CROSS JOIN|JOIN|ON|AS|AND|OR|IN|IS NULL|IS NOT NULL|BETWEEN|LIKE|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|WITH|RECURSIVE|UNION ALL|UNION|COMMIT|ROLLBACK|BEGIN)\b|--[^\n]*|'(?:''|[^'])*')/gi
const SQL_KEYWORDS = new Set(['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL', 'UNIQUE', 'DEFAULT', 'AUTO_INCREMENT', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN', 'JOIN', 'ON', 'AS', 'AND', 'OR', 'IN', 'IS NULL', 'IS NOT NULL', 'BETWEEN', 'LIKE', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH', 'RECURSIVE', 'UNION ALL', 'UNION', 'COMMIT', 'ROLLBACK', 'BEGIN'])

function splitBlocks(content) {
  return String(content || '').trim().split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
}

function tableRows(block) {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
  if (lines.length < 2) return null
  const rows = lines.map((line) => {
    if (line.includes('\t')) return line.split('\t').map((cell) => cell.trim())
    if (line.includes('|')) return line.replace(/^\|\s*/, '').replace(/\s*\|$/, '').split('|').map((cell) => cell.trim())
    return [line]
  })
  const width = rows[0].length
  if (width < 2 || rows.some((row) => row.length !== width)) return null
  if (rows.every((row) => row.every((cell) => /^:?-{3,}:?$/.test(cell)))) return null
  return rows
}

function isSingleColumnOutput(block, previousBlock) {
  if (!/^expected output:?$/i.test(previousBlock || '')) return false
  const rows = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  return rows.length >= 2 && rows.every((line) => line.length < 80 && !/[.!?]/.test(line))
}

function isCodeBlock(block) {
  const first = block.split(/\r?\n/).find((line) => line.trim())?.trim() || ''
  return SQL_START.test(first) || (
    block.includes('\n') && /\b(VARCHAR|CHAR|INT|INTEGER|DECIMAL|DATE|DATETIME|BOOLEAN|PRIMARY KEY|FOREIGN KEY|AUTO_INCREMENT|NOT NULL)\b/i.test(block) && /[();]/.test(block)
  )
}

function isList(block) {
  const lines = block.split(/\r?\n/).filter((line) => line.trim())
  return lines.length > 0 && lines.every((line) => /^\s*(?:[-\u2022*]|\d+[.)])\s+/.test(line))
}

function isAnswerHeadingOnly(content) {
  const lines = String(content || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  return lines.length > 0 && lines.every((line) => /^exercise\s+\d+\s+answer:?$/i.test(line))
}

function CodeToken({ token }) {
  if (token.startsWith('--')) return <span className="text-white/35">{token}</span>
  if (token.startsWith("'")) return <span className="text-amber-200">{token}</span>
  return <span className="text-sky-200">{token}</span>
}

function SqlCodeBlock({ code }) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="code-surface my-4 overflow-hidden rounded-xl border border-emerald-200/10 bg-[#090c12] shadow-inner">
      <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-4 py-2.5">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/70">SQL</span>
        <button type="button" onClick={copyCode} className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/75 hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="overflow-x-auto p-5 text-sm leading-7 text-white/85 sm:text-base"><code>{code.split(SQL_TOKEN).map((token, index) => (token.startsWith('--') || token.startsWith("'") || SQL_KEYWORDS.has(token.toUpperCase())) ? <CodeToken key={index} token={token} /> : token)}</code></pre>
    </div>
  )
}

function ContentBlock({ block, previousBlock }) {
  const rows = tableRows(block)
  if (rows) {
    return (
      <div className="code-surface my-4 overflow-x-auto rounded-xl border border-sky-200/10 bg-[#0a0e14]">
        <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
          <thead className="bg-sky-200/[0.07] text-sky-100/85">
            <tr>{rows[0].map((cell, index) => <th key={`${cell}-${index}`} className="whitespace-nowrap border-b border-white/10 px-3 py-2.5 font-semibold">{cell}</th>)}</tr>
          </thead>
          <tbody className="text-white/70">
            {rows.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex} className="even:bg-white/[0.025]">
                {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="whitespace-nowrap border-b border-white/[0.06] px-3 py-2">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (isSingleColumnOutput(block, previousBlock)) {
    return (
      <div className="code-surface my-4 overflow-x-auto rounded-xl border border-sky-200/10 bg-[#0a0e14]">
        <table className="min-w-[12rem] border-collapse text-left text-xs sm:text-sm">
          <thead className="bg-sky-200/[0.07] text-sky-100/85"><tr><th className="border-b border-white/10 px-3 py-2.5 font-semibold">{block.split(/\r?\n/)[0]}</th></tr></thead>
          <tbody className="text-white/70">{block.split(/\r?\n/).slice(1).map((line, index) => <tr key={index}><td className="border-b border-white/[0.06] px-3 py-2">{line.trim()}</td></tr>)}</tbody>
        </table>
      </div>
    )
  }

  if (isCodeBlock(block)) {
    return <SqlCodeBlock code={block} />
  }

  if (isList(block)) {
    const items = block.split(/\r?\n/).filter((line) => line.trim())
    return <ul className="my-3 space-y-2 pl-5 text-[15px] leading-7 text-white/75">{items.map((line, index) => <li key={index} className="list-disc marker:text-indigo-300/70">{line.trim().replace(/^(?:[-\u2022*]|\d+[.)])\s+/, '')}</li>)}</ul>
  }

  if (/^expected output:?$/i.test(block)) {
    return <p className="mt-4 text-xs font-semibold uppercase tracking-[0.13em] text-sky-200/80">Expected result</p>
  }

  if (/^(?:answer|hint|explanation|note|key rule|why\b|the fix\b)/i.test(block)) {
    return <p className="my-3 rounded-lg border border-indigo-200/10 bg-indigo-200/[0.035] px-3.5 py-3 text-sm leading-6 text-indigo-50/75">{block}</p>
  }

  return <p className="my-3 whitespace-pre-line text-[15px] leading-7 text-white/75">{block}</p>
}

function splitDefinition(line) {
  for (const separator of ['\u2014', '\u2013', '\u2192']) {
    const index = line.indexOf(separator)
    if (index > 0 && index < 49) return [line.slice(0, index).trim().replace(/:$/, ''), line.slice(index + 1).trim()]
  }
  const colon = line.indexOf(': ')
  if (colon > 0 && colon < 49) return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()]
  return null
}

function studyHeading(line) {
  const text = line.trim()
  if (!text) return false
  if (/^pause and predict:/i.test(text)) return true
  if (text.length > 90) return false
  if (/^(?:hint|answer)$/i.test(text)) return true
  if (/^(?:mistake\s+#?\d+|exercise\s+\d+|challenge\s+\d+|example\s+\d*|edge case|pagination patterns|use case|alternative|expected output|correct version|incorrect version|what this does|what happens|why it matters|best practice|try it|pause and predict|full example|worked example|result|output|breaking it down|order of execution|interpretation|multiple aggregates|group by with|inserting |counting |sorting |auto_increment|limit with|limit without|for each )/i.test(text)) return true
  if (text.endsWith(':') && text.length < 72) return true
  if (/[.!?]$/.test(text)) return false
  return /^(?:[A-Z][A-Za-z0-9()#'+/-]*)(?:\s+[A-Z][A-Za-z0-9()#'+/-]*){1,7}$/.test(text)
}

function sqlStartsLine(line) {
  const text = line.trim()
  if (/\s(?:\u2014|\u2013|\u2192)\s/.test(text)) return false
  return SQL_START.test(text)
}

function sqlContinuesLine(line) {
  const text = line.trim()
  return line !== text || /^[,)]/.test(text) || /^(?:FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|VALUES|SET|ON|JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|CROSS JOIN|UNION|AND|OR|WHEN|THEN|ELSE|END|AS|ENGINE|PRIMARY KEY|FOREIGN KEY|REFERENCES|NOT NULL|DEFAULT|AUTO_INCREMENT|CHECK)\b/i.test(text)
}

function isCompactListLine(segment) {
  return segment.type === 'block'
    && !segment.value.includes('\n')
    && segment.value.length < 120
    && !/[.!?]$/.test(segment.value)
    && !segment.value.includes(':')
    && !studyHeading(segment.value)
}

function groupCompactLines(segments) {
  const grouped = []
  let run = []

  function flush() {
    if (run.length > 1 && run.length <= 12) grouped.push({ type: 'block', value: run.map((item) => item.value).join('\n') })
    else grouped.push(...run)
    run = []
  }

  for (const segment of segments) {
    if (isCompactListLine(segment)) run.push(segment)
    else {
      flush()
      grouped.push(segment)
    }
  }
  flush()
  return grouped
}

function richSegments(content) {
  const segments = []
  const lines = String(content || '').replace(/\r/g, '').split('\n')
  let prose = []
  let code = []
  let table = []
  let definitions = []

  function flushProse() {
    const value = prose.join('\n').trim()
    if (value) segments.push({ type: 'block', value })
    prose = []
  }
  function flushCode() {
    const value = code.join('\n').trim()
    if (value) segments.push({ type: 'code', value })
    code = []
  }
  function flushTable() {
    const value = table.join('\n').trim()
    if (value) segments.push({ type: 'block', value })
    table = []
  }
  function flushDefinitions() {
    if (definitions.length) segments.push({ type: 'definitions', value: definitions })
    definitions = []
  }

  for (const line of lines) {
    const text = line.trim()
    if (!text) {
      flushCode()
      flushTable()
      flushDefinitions()
      flushProse()
      continue
    }

    const isTableLine = text.includes('\t') || (text.startsWith('|') && text.endsWith('|'))
    if (isTableLine) {
      flushCode()
      flushDefinitions()
      flushProse()
      table.push(text)
      continue
    }

    if (code.length && sqlContinuesLine(line)) {
      code.push(line)
      continue
    }
    if (sqlStartsLine(text)) {
      flushTable()
      flushDefinitions()
      flushProse()
      code.push(line)
      continue
    }
    flushCode()
    flushTable()

    const definition = splitDefinition(text)
    if (definition) {
      flushProse()
      const calloutTone = {
        'key point': 'indigo',
        'real-world analogy': 'sky',
        'best practice': 'emerald',
      }[definition[0].toLowerCase()]
      if (calloutTone) {
        flushDefinitions()
        segments.push({ type: 'callout', title: definition[0], value: definition[1], tone: calloutTone })
        continue
      }
      definitions.push(definition)
      continue
    }
    flushDefinitions()

    if (studyHeading(text)) {
      flushProse()
      const type = /^(?:hint|answer)$/i.test(text) ? 'reveal-label' : /^pause and predict:/i.test(text) ? 'predict' : 'heading'
      segments.push({ type, value: text })
      continue
    }
    prose.push(line)
  }

  flushCode()
  flushTable()
  flushDefinitions()
  flushProse()
  return groupCompactLines(segments)
}

function RevealLabel({ label, topicId, reveal }) {
  const answer = /^answer$/i.test(label)
  if (!answer) return null
  if (answer && !reveal?.answer?.trim()) return null
  return <details className="my-3 rounded-lg border border-amber-200/15 bg-amber-200/[0.035] px-4 py-3"><summary className="cursor-pointer list-none text-sm font-semibold text-amber-100 marker:hidden">{answer ? 'Show answer' : 'Show hint'}<span aria-hidden="true" className="ml-2 text-xs text-white/65">+</span></summary>{answer && reveal ? <div className="mt-3"><RichLessonText content={reveal.answer} topicId={topicId} /><div className="mt-3 border-l-2 border-emerald-300/55 pl-3"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-emerald-200/90">Why it works</p><p className="mt-1 text-sm leading-6 text-white/80">{reveal.explanation}</p></div></div> : null}</details>
}

function PauseAndPredict({ question, topicId, reveal }) {
  return (
    <details className="my-4 rounded-xl border border-sky-200/20 bg-sky-200/[0.055] p-4 sm:p-5">
      <summary className="cursor-pointer list-none text-sm font-semibold text-sky-100 marker:hidden">
        Pause and predict <span aria-hidden="true" className="ml-1 text-sky-100/70">+</span>
      </summary>
      <p className="mt-3 text-[15px] leading-7 text-white/80">{question}</p>
      {reveal ? (
        <div className="mt-4 border-t border-sky-100/10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-emerald-200/85">Answer</p>
          <RichLessonText content={reveal.answer} topicId={topicId} className="mt-2" />
          <div className="mt-3 rounded-lg border border-amber-200/15 bg-amber-200/[0.04] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-amber-100/90">Why</p>
            <p className="mt-1 text-sm leading-6 text-white/75">{reveal.explanation}</p>
          </div>
        </div>
      ) : <p className="mt-3 text-sm text-white/65">Try to explain the result before moving on.</p>}
    </details>
  )
}

function parseMistakeComparisons(content) {
  const source = String(content || '').replace(/\r/g, '')
  const headings = [...source.matchAll(/^Mistake\s*#?\s*\d+\s*:[^\n]*/gim)]
  if (!headings.length) return null

  const chunks = []
  const lead = source.slice(0, headings[0].index).trim()
  if (lead) chunks.push({ title: '', raw: lead })

  headings.forEach((heading, index) => {
    const bodyStart = heading.index + heading[0].length
    const bodyEnd = headings[index + 1]?.index ?? source.length
    const body = source.slice(bodyStart, bodyEnd).trim()
    const markerPattern = /^--[^\n]*\b(?:WRONG|AMBIGUOUS|TRICKY|MIGHT FAIL|CONFUSING|CORRECT|SAFE|CLEARER)\b/i
    const rawCode = richSegments(body).filter((segment) => segment.type === 'code')
    const code = []
    for (let codeIndex = 0; codeIndex < rawCode.length; codeIndex += 1) {
      const segment = rawCode[codeIndex]
      const markerCommentOnly = segment.value.split('\n').every((line) => !line.trim() || line.trim().startsWith('--'))
      if (markerCommentOnly && markerPattern.test(segment.value.trim()) && rawCode[codeIndex + 1]) {
        code.push({ type: 'code', value: `${segment.value}\n${rawCode[codeIndex + 1].value}` })
        codeIndex += 1
      } else code.push(segment)
    }
    const markedCode = code.filter((segment) => markerPattern.test(segment.value.trim()))
    let wrongCode = markedCode.filter((segment) => /^--[^\n]*\b(?:WRONG|AMBIGUOUS|TRICKY|MIGHT FAIL|CONFUSING)\b/i.test(segment.value.trim()))
    const fixCode = markedCode.filter((segment) => /^--[^\n]*\b(?:CORRECT|SAFE|CLEARER)\b/i.test(segment.value.trim()))

    // Some supplied topics label only the correction. Keep their original first example as the comparison.
    if (!wrongCode.length && fixCode.length) {
      wrongCode = code.filter((segment) => !markerPattern.test(segment.value.trim()) && segment.value !== fixCode[0].value).slice(0, 1)
    }

    if (!wrongCode.length || !fixCode.length) {
      chunks.push({ title: heading[0].replace(/^Mistake\s*#?\s*\d+\s*:\s*/i, '').trim(), raw: body })
      return
    }

    const error = body.match(/^(?:Errors?|Error message)(?:\s*\([^)]*\))?\s*:\s*(.+)$/im)?.[1]?.trim()
    const tip = body.match(/^(?:Best practice|Remember|Lesson)\s*:\s*(.+)$/im)?.[1]?.trim()
    let explanation = body
    markedCode.forEach((segment) => { explanation = explanation.replace(segment.value, '') })
    if (error) explanation = explanation.replace(/^(?:Errors?|Error message)\s*:\s*.+$/im, '')
    if (tip) explanation = explanation.replace(/^(?:Best practice|Remember|Lesson)\s*:\s*.+$/im, '')
    explanation = explanation
      .replace(/^\s*(?:Fix|The fix)\s*:\s*$/gim, '')
      .replace(/^\s*--[^\n]*\b(?:WRONG|AMBIGUOUS|TRICKY|MIGHT FAIL|CONFUSING|CORRECT|SAFE|CLEARER)\b[^\n]*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    const stripLabel = (snippet) => snippet.replace(/^--[^\n]*\b(?:WRONG|AMBIGUOUS|TRICKY|MIGHT FAIL|CONFUSING|CORRECT|SAFE|CLEARER)\b[^\n]*(?:\n|$)/gim, '').trim()
    chunks.push({
      title: heading[0].replace(/^Mistake\s*#?\s*\d+\s*:\s*/i, '').trim(),
      wrong: wrongCode.map((segment) => stripLabel(segment.value)).filter(Boolean).join('\n\n'),
      fix: fixCode.map((segment) => stripLabel(segment.value)).filter(Boolean).join('\n\n'),
      error,
      explanation,
      tip,
    })
  })

  return chunks
}

function MistakeList({ items, topicId }) {
  return (
    <div className="space-y-5">
      {items.map((mistake, index) => (
        <article key={`${mistake.title}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          {mistake.title && <h3 className="font-display text-base font-semibold text-white sm:text-lg">{mistake.title}</h3>}
          {mistake.raw ? <RichLessonText content={mistake.raw} className="mt-2" topicId={topicId} /> : <>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-rose-300/25 bg-rose-300/[0.045] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-rose-200/90">Avoid</p>
              <SqlCodeBlock code={mistake.wrong} />
            </div>
            <div className="min-w-0 rounded-lg border border-emerald-300/25 bg-emerald-300/[0.045] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-emerald-200/90">Use this</p>
              <SqlCodeBlock code={mistake.fix} />
            </div>
          </div>
          {mistake.error && <div className="code-surface mt-3 rounded-lg border border-rose-300/20 bg-[#160d12] px-3.5 py-3 font-mono text-sm leading-6 text-rose-100/90"><span className="mr-2 text-rose-300">Error</span>{mistake.error}</div>}
          {mistake.explanation && <RichLessonText content={mistake.explanation} className="mt-3" topicId={topicId} />}
          {mistake.tip && <aside className="mt-3 rounded-lg border border-sky-200/20 bg-sky-200/[0.045] px-3.5 py-3"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-sky-100/90">Best practice</p><p className="mt-1 text-sm leading-6 text-white/75">{mistake.tip}</p></aside>}
          </>}
        </article>
      ))}
    </div>
  )
}

export function RichLessonText({ content, className = '', topicId }) {
  const segments = richSegments(content)
  let answerIndex = 0
  const consumedAnswers = new Set()
  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (consumedAnswers.has(index)) return null
        if (segment.type === 'code') return <SqlCodeBlock key={index} code={segment.value} />
        if (segment.type === 'definitions') return <dl key={index} className="my-4 divide-y divide-white/10 border-y border-white/10">{segment.value.map(([term, definition], row) => <div key={row} className="grid gap-1 py-3 sm:grid-cols-[minmax(9rem,0.32fr)_1fr] sm:gap-5"><dt className="font-mono text-sm font-semibold text-indigo-200/90">{term}</dt><dd className="text-[15px] leading-7 text-white/75">{definition}</dd></div>)}</dl>
        if (segment.type === 'callout') {
          const styles = {
            indigo: 'border border-l-4 border-indigo-200/30 bg-indigo-200/[0.055] text-indigo-100',
            sky: 'border border-l-4 border-sky-200/30 bg-sky-200/[0.05] text-sky-100',
            emerald: 'border border-l-4 border-emerald-200/30 bg-emerald-200/[0.05] text-emerald-100',
          }
          return <aside key={index} className={`my-4 rounded-xl border px-4 py-3.5 ${styles[segment.tone]}`}><p className="text-xs font-semibold uppercase tracking-[0.13em]">{segment.title}</p><p className="mt-1.5 text-[15px] leading-7 text-white/80">{segment.value}</p></aside>
        }
        if (segment.type === 'heading') return <h3 key={index} className="mb-2 mt-6 scroll-mt-24 font-display text-base font-semibold tracking-tight text-white sm:text-lg">{/^expected output:?$/i.test(segment.value) ? 'Expected result' : segment.value}</h3>
        if (segment.type === 'predict') {
          const following = segments[index + 1]
          const answerFollows = following?.type === 'reveal-label' && /^answer$/i.test(following.value)
          const reveal = answerFollows ? getMysqlInlineReveal(topicId, answerIndex++) : null
          if (answerFollows && reveal) consumedAnswers.add(index + 1)
          return <PauseAndPredict key={index} question={segment.value.replace(/^pause and predict:\s*/i, '')} topicId={topicId} reveal={reveal} />
        }
        if (segment.type === 'reveal-label') {
          const answer = /^answer$/i.test(segment.value)
          const reveal = answer ? getMysqlInlineReveal(topicId, answerIndex++) : null
          return <RevealLabel key={index} label={segment.value} topicId={topicId} reveal={reveal} />
        }
        return <ContentBlock key={index} block={segment.value} previousBlock={segments[index - 1]?.value} />
      })}
    </div>
  )
}

function isPracticeGroup(line) {
  return /^(?:INNER JOIN|LEFT JOIN|RIGHT JOIN|DISTINCT|NULL HANDLING\b.*|STRING FUNCTIONS\b.*|AGGREGATE FUNCTIONS\b.*|PART \d+.*)$/i.test(line.trim())
}

function parsePracticeExercises(content = '') {
  const groups = []
  let group = ''
  let current = null

  function finishExercise() {
    if (!current) return
    current.prompt = current.prompt.join('\n').trim()
    if (current.prompt) {
      const last = groups[groups.length - 1]
      if (last?.title === current.group) last.exercises.push(current)
      else groups.push({ title: current.group, exercises: [current] })
    }
    current = null
  }

  for (const line of String(content).replace(/\r/g, '').split('\n')) {
    const text = line.trim()
    if (!text) {
      if (current?.prompt.length && current.prompt[current.prompt.length - 1] !== '') current.prompt.push('')
      continue
    }
    if (isPracticeGroup(text)) {
      finishExercise()
      group = text
      continue
    }
    if (/^exercise\s+\d+/i.test(text)) {
      finishExercise()
      current = { title: text, group, prompt: [], sourceHint: [], hasHint: false }
      continue
    }
    const inlineHint = text.match(/^hint\s*:\s*(.+)$/i)
    if (inlineHint && current) {
      current.sourceHint.push(inlineHint[1])
      current.hasHint = true
      continue
    }
    if (/^hint(?:\s+for\b|\s+on\b)?\s*:?$/i.test(text)) {
      if (current) current.hasHint = true
      continue
    }
    if (current?.hasHint && current.sourceHint.length === 0 && !/^exercise\s+\d+/i.test(text)) current.sourceHint.push(text)
    else if (current) current.prompt.push(line)
  }
  finishExercise()
  return groups
}

function PracticeSet({ topicId, content }) {
  const groups = parsePracticeExercises(content)
  const support = getMysqlStudySupport(topicId)
  if (!groups.length) return <RichLessonText content={content} />
  let exerciseIndex = 0

  return <div className="divide-y divide-white/10">{groups.map((group, groupIndex) => <section key={`${group.title}-${groupIndex}`} className="py-4 first:pt-0 last:pb-0">
    {group.title && <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-indigo-200/80">{group.title}</h3>}
    <div className="divide-y divide-white/[0.07]">{group.exercises.map((exercise) => {
      const index = exerciseIndex++
      const exerciseSupport = support[index]
      const hint = exerciseSupport?.hint?.trim() || exercise.sourceHint.join('\n').trim()
      return <article key={`${exercise.title}-${index}`} className="py-5 first:pt-2 last:pb-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h4 className="font-display text-base font-semibold text-white/95">{exercise.title}</h4>
          <span className="text-xs uppercase tracking-wider text-white/60">Try before revealing</span>
        </div>
        <RichLessonText content={exercise.prompt} className="mt-2" topicId={topicId} />
        <CodePractice inputId={`sql-practice-${topicId}-${index}`} requirements={exerciseSupport?.mustInclude} />
        {hint && <details className="mt-3 rounded-lg border border-amber-200/15 bg-amber-200/[0.035] px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-semibold text-amber-100 marker:hidden">Show hint <span aria-hidden="true" className="ml-1 text-white/65">+</span></summary>
          <div className="mt-2 text-sm leading-6 text-white/80"><RichLessonText content={hint} /></div>
        </details>}
      </article>
    })}</div>
  </section>)}</div>
}

function CodePractice({ requirements = [], inputId }) {
  const [query, setQuery] = useState('')
  const [checked, setChecked] = useState(false)
  if (!requirements.length) return null

  const normalizeSql = (value) => value
    .toLowerCase()
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),;])\s*/g, '$1')
    .trim()
  const normalizedQuery = normalizeSql(query)
  const missing = checked ? requirements.filter((required) => !normalizedQuery.includes(normalizeSql(required))) : []
  return (
    <div className="mt-4 rounded-xl border border-indigo-200/15 bg-indigo-200/[0.035] p-3.5 sm:p-4">
      <label className="block text-sm font-semibold text-white/90" htmlFor={inputId}>Write your SQL</label>
      <textarea
        id={inputId}
        value={query}
        onChange={(event) => { setQuery(event.target.value); setChecked(false) }}
        rows={6}
        spellCheck="false"
        placeholder="Write a query here…"
        className="code-surface mt-2 w-full resize-y rounded-lg border border-white/15 bg-[#090c12] p-3 font-mono text-sm leading-6 text-white/90 outline-none placeholder:text-white/40 focus:border-indigo-200/45"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5 text-white/65">Checks for the required SQL parts. It does not run a database.</p>
        <button type="button" onClick={() => setChecked(true)} disabled={!query.trim()} className="rounded-lg border border-indigo-200/30 bg-indigo-200/[0.09] px-3.5 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-200/[0.15] disabled:cursor-not-allowed disabled:opacity-45">Check my SQL</button>
      </div>
      {checked && <p aria-live="polite" className={`mt-3 rounded-lg border px-3 py-2.5 text-sm leading-6 ${missing.length ? 'border-amber-200/20 bg-amber-200/[0.045] text-amber-100/90' : 'border-emerald-200/20 bg-emerald-200/[0.045] text-emerald-100/90'}`}>
        {missing.length ? <>Almost there. Add or check: <span className="font-mono">{missing.join(', ')}</span>.</> : 'All required SQL parts are present. Review the answer key to compare your full query.'}
      </p>}
    </div>
  )
}

function AnswerKey({ topicId, content }) {
  const answers = getMysqlStudySupport(topicId).filter((item) => item.answer?.trim())
  if (!answers.length) return <RichLessonText content={content} />

  return <div className="divide-y divide-white/10">{answers.map((item, index) => <details key={`${item.title}-${index}`} className="group py-4 first:pt-0 last:pb-0">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2 text-sm font-semibold text-white/90 marker:hidden"><span><span className="text-indigo-100">Show answer</span><span className="ml-2 text-white/75">· {item.title}</span></span><span aria-hidden="true" className="text-sm text-indigo-100/90 group-open:rotate-45">+</span></summary>
    <div className="pb-3 pl-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-sky-200/85">One possible answer</p>
      <RichLessonText content={item.answer} />
      <div className="mt-3 border-l-2 border-emerald-300/45 pl-3"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-emerald-200/85">Why it works</p><p className="mt-1 text-sm leading-6 text-white/75">{item.explanation}</p></div>
    </div>
  </details>)}</div>
}

function Section({ sectionKey, title, content, number, upNext, topicId, quizHref }) {
  const body = sectionKey === 'upNext' && upNext ? upNext : content
  if (!body) return null
  const typedMistakes = sectionKey === 'commonMistakes' && body?.type === 'mistakes'
  const parsedMistakes = sectionKey === 'commonMistakes' && typeof body === 'string' ? parseMistakeComparisons(body) : null
  let renderedBody
  if (typedMistakes) renderedBody = <MistakeList items={body.items} topicId={topicId} />
  else if (parsedMistakes) renderedBody = <MistakeList items={parsedMistakes} topicId={topicId} />
  else if (sectionKey === 'tryThis' && typeof body === 'string') renderedBody = <PracticeSet topicId={topicId} content={body} />
  else if (sectionKey === 'answerKey' && typeof body === 'string' && isAnswerHeadingOnly(content) && !getMysqlStudySupport(topicId).length) renderedBody = <div className="rounded-lg border border-amber-200/20 bg-amber-200/[0.04] p-4"><p className="text-sm leading-6 text-amber-100/85">The supplied lesson lists answer headings but does not include the answer text.</p><RichLessonText content={content} className="mt-2" topicId={topicId} /></div>
  else if (sectionKey === 'answerKey' && typeof body === 'string') renderedBody = <AnswerKey topicId={topicId} content={body} />
  else if (typeof body === 'string') renderedBody = <RichLessonText content={body} topicId={topicId} />
  else renderedBody = <div>{body}</div>
  const advanced = sectionKey === 'goingDeeper' || sectionKey === 'edgeCaseSpotlight'

  return (
    <section id={`lesson-${sectionKey}`} className="scroll-mt-24 border-t border-white/10 py-8 first:border-t-0 first:pt-0 sm:py-10">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-xs tabular-nums text-indigo-200/85">{String(number).padStart(2, '0')}</span>
        <h2 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
      </div>
      {advanced ? <details className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"><summary className="cursor-pointer list-none text-sm font-semibold text-indigo-100 marker:hidden">{sectionKey === 'goingDeeper' ? 'Show deeper walkthroughs' : 'Show edge case examples'} <span aria-hidden="true" className="ml-1 text-white/65">+</span></summary><div className="mt-4">{renderedBody}</div></details> : renderedBody}
      {sectionKey === 'tryThis' && quizHref && <Link to={quizHref} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-indigo-200/30 bg-indigo-200/[0.08] px-4 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-200/[0.14] hover:text-white">Take the optional quiz <span aria-hidden="true">→</span></Link>}
    </section>
  )
}

export default function LessonContent({ sections = {}, upNext, topicId, quizHref }) {
  return <article className="w-full">{LESSON_SECTIONS.map(([key, title], index) => <Section key={key} sectionKey={key} title={title} content={sections[key]} number={index + 1} upNext={upNext} topicId={topicId} quizHref={quizHref} />)}</article>
}
