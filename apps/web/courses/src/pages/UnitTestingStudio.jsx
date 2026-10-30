import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { UNIT_TESTING_STUDIO_LESSONS, UNIT_TESTING_STUDIO_PARTS } from '../data/unit-testing-studio'
import { appStorageKey } from '../lib/storage'
import './UnitTestingStudio.css'

const PROGRESS_KEY = appStorageKey('unit-testing-studio:v2')
const SCOPE_OPTIONS = [
  { id: 'unit', title: 'Unit', detail: 'one function', icon: 'ƒ' },
  { id: 'integration', title: 'Integration', detail: 'connected parts', icon: '↔' },
  { id: 'e2e', title: 'End to end', detail: 'whole journey', icon: '↗' },
]
const CASE_OPTIONS = [
  { id: 'standard', name: 'Standard monthly pay', input: '5000, 0h, $20/h', expected: '$5,000', actual: '$5,000' },
  { id: 'overtime', name: 'Overtime included', input: '5000, 10h, $20/h', expected: '$5,200', actual: '$5,200' },
  { id: 'zero', name: 'Zero salary boundary', input: '0, 0h, $20/h', expected: '$0', actual: '$0' },
]

function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(PROGRESS_KEY))
    const validIds = new Set(UNIT_TESTING_STUDIO_LESSONS.map((lesson) => lesson.id))
    return Array.isArray(value) ? value.filter((id) => validIds.has(id)) : []
  } catch {
    return []
  }
}

function getDefaults(interaction) {
  const defaults = {
    scope: { selected: 'e2e' },
    aaa: { step: 0 },
    cases: { selected: ['standard'] },
    assertion: { selected: 'log' },
    boundary: { value: 0 },
    errors: { value: 12, assertion: 'expected' },
    objects: { comparison: 'strict' },
    isolation: { frozen: false, hour: 9 },
    doubles: { selected: 'real' },
    async: { awaited: false },
    lifecycle: { beforeEach: false, afterEach: false },
    organization: { name: 'test 1' },
    coverage: { invalid: true, valid: false, asserted: false },
    tdd: { stage: 0 },
    mutation: { exactBoundary: false, mutant: true },
  }
  return defaults[interaction]
}

function makeDraft(lesson, controls) {
  switch (lesson.interaction) {
    case 'scope': return `test('${controls.selected} check: annual salary conversion', () => {\n  assert.equal(annualSalary(5000), 60000)\n})`
    case 'aaa': return `// ${controls.step > 0 ? '✓' : '○'} Arrange\nconst monthlyPay = 5000\n\n// ${controls.step > 1 ? '✓' : '○'} Act\nconst annual = annualSalary(monthlyPay)\n\n// ${controls.step > 2 ? '✓' : '○'} Assert\nassert.equal(annual, 60000)`
    case 'cases': {
      const inputById = { standard: '[5000, 0, 20]', overtime: '[5000, 10, 20]', zero: '[0, 0, 20]' }
      return `const cases = [\n${CASE_OPTIONS.filter((item) => controls.selected.includes(item.id)).map((item) => `  { name: '${item.name}', input: ${inputById[item.id]}, expected: ${item.expected.replace(/[$,]/g, '')} }`).join(',\n') || '  // Add a case from the test bench'}\n]\n\nfor (const { input, expected } of cases) {\n  assert.equal(monthlyPay(...input), expected)\n}`
    }
    case 'assertion': return controls.selected === 'log'
      ? 'const actual = takeHomePay(6000, 900)\nconsole.log(actual) // visible, but not asserted'
      : controls.selected === 'strict'
        ? 'const actual = takeHomePay(6000, 900)\nassert.strictEqual(actual, 5100)'
        : controls.selected === 'deep'
          ? "assert.deepStrictEqual(getEmployee('E-104'), expectedEmployee)"
          : "assert.throws(() => parseCheckIn(25), { name: 'RangeError' })"
    case 'boundary': return `test('allows leave at the minimum', () => {\n  const daysLeft = ${controls.value}\n  assert.equal(canRequestLeave(daysLeft), daysLeft >= 1)\n})`
    case 'errors': return controls.assertion === 'expected'
      ? `test('rejects an invalid check-in hour', () => {\n  assert.throws(\n    () => parseCheckIn(${controls.value}),\n    { name: 'RangeError' }\n  )\n})`
      : controls.assertion === 'any'
        ? `test('rejects an invalid check-in hour', () => {\n  assert.throws(() => parseCheckIn(${controls.value}))\n})`
        : `test('rejects an invalid check-in hour', () => {\n  parseCheckIn(${controls.value})\n  // no assertion yet\n})`
    case 'objects': return `${controls.comparison === 'deep' ? 'assert.deepStrictEqual' : controls.comparison === 'json' ? 'assert.equal(JSON.stringify(actual), JSON.stringify(expected))' : 'assert.strictEqual'}(\n  getEmployee('E-104'),\n  expectedEmployee\n)`
    case 'isolation': return `const now = ${controls.frozen ? "new Date('2026-04-01T09:00:00Z') // fixed clock" : 'new Date() // real clock'}\nassert.equal(contractIsActive(contract, now), true)`
    case 'doubles': return `const mailer = ${controls.selected === 'spy' ? 'createSpy()' : controls.selected === 'stub' ? 'createStub()' : controls.selected === 'fake' ? 'new FakeMailer()' : controls.selected === 'dummy' ? 'dummyMailer' : 'realEmailClient'}\nsendInvite(mailer, 'new.employee@example.test')\n${controls.selected === 'spy' ? 'assert.equal(mailer.calls.length, 1)' : '// inspect what this test double can prove'}`
    case 'async': return `test('loads an employee', async () => {\n  const result = ${controls.awaited ? 'await ' : ''}findEmployee(repository, 'E-104')\n  assert.equal(result.name, 'Mina')\n})`
    case 'lifecycle': return `${controls.beforeEach ? 'beforeEach(() => { store = createFreshStore() })' : '// shared store from previous test'}\ntest('starts with no attendance records', () => {\n  assert.equal(store.attendanceCount(), 0)\n})\n${controls.afterEach ? 'afterEach(() => store.close())' : '// cleanup not registered'}`
    case 'organization': return `describe('leave requests', () => {\n  test('${controls.name || 'name your behavior'}', () => {\n    assert.equal(canRequestLeave(1), true)\n  })\n})`
    case 'coverage': return `test('invalid quantity is denied', () => {\n  ${controls.invalid ? "assert.equal(canRequestLeave(0), 'denied')" : '// no invalid-path assertion'}\n})\ntest('minimum quantity is allowed', () => {\n  ${controls.valid ? "assert.equal(canRequestLeave(1), 'allowed')" : '// no boundary assertion'}\n})`
    case 'tdd': return `// ${controls.stage >= 1 ? '✓' : '○'} RED: write a failing behavior test\n// ${controls.stage >= 2 ? '✓' : '○'} GREEN: implement the smallest change\n// ${controls.stage >= 3 ? '✓' : '○'} REFACTOR: improve while tests stay green`
    case 'mutation': return `test('leave at the exact minimum is allowed', () => {\n  ${controls.exactBoundary ? 'assert.equal(canRequestLeave(1), true)' : '// exact-boundary case missing'}\n})\n\n// mutant enabled: ${controls.mutant ? 'daysLeft > 1' : 'daysLeft >= 1'}`
    default: return lesson.testCode
  }
}

function evaluateLesson(lesson, controls) {
  const output = (status, headline, explanation, rows = []) => ({ status, headline, explanation, rows })
  switch (lesson.interaction) {
    case 'scope': return controls.selected === 'unit'
      ? output('pass', 'UNIT CHECK: FAST FEEDBACK', 'One function, a controlled value, and a direct result. The browser, API, and database stay outside this test.', [
        { name: 'annualSalary(5000)', expected: '60000', actual: '60000', status: 'pass' },
      ])
      : output('gap', `${controls.selected.toUpperCase()} TEST: BROADER BOUNDARY`, 'This can be valuable, but it starts more system parts than this single salary rule needs. Keep broader checks for integration and user journeys.', [
        { name: 'annualSalary(5000)', expected: '60000', actual: '60000', status: 'pass' },
        { name: 'System parts started', expected: '1 small unit', actual: controls.selected === 'e2e' ? 'browser + API + database' : 'service + repository', status: 'info' },
      ])
    case 'aaa': return controls.step === 3
      ? output('pass', 'TEST TRACE COMPLETE', 'The runner can now follow the setup, one action, and a clear assertion in order.', [
        { name: 'Arrange', expected: 'monthlyPay = 5000', actual: 'monthlyPay = 5000', status: 'pass' },
        { name: 'Act', expected: 'annualSalary(monthlyPay)', actual: 'annualSalary(monthlyPay)', status: 'pass' },
        { name: 'Assert', expected: '60000', actual: '60000', status: 'pass' },
      ])
      : output('gap', 'TEST TRACE INCOMPLETE', 'Advance through Arrange, Act, and Assert. The runner needs all three to show a complete test.', [
        { name: 'Steps assembled', expected: '3', actual: String(controls.step), status: 'info' },
      ])
    case 'cases': {
      const rows = CASE_OPTIONS.filter((item) => controls.selected.includes(item.id)).map((item) => ({ name: item.name, expected: item.expected, actual: item.actual, status: 'pass' }))
      const complete = controls.selected.includes('standard') && controls.selected.includes('overtime')
      return output(complete ? 'pass' : 'gap', complete ? 'SUITE PASSED: CONTRACT EXAMPLES COVERED' : 'ADD A CONTRASTING EXAMPLE', complete ? 'The standard and overtime rows prove different parts of the pay contract. The zero boundary is an extra useful case.' : 'Add the overtime case so the suite checks a second behavior rule, not just the standard path.', rows)
    }
    case 'assertion': return controls.selected === 'strict'
      ? output('pass', 'ASSERTION FAILED ONLY WHEN THE VALUE IS WRONG', 'The strict equality assertion compares the actual number with the expected number. The test runner can report a meaningful failure.', [{ name: 'takeHomePay(6000, 900)', expected: '5100', actual: '5100', status: 'pass' }])
      : controls.selected === 'log'
        ? output('gap', 'NO ASSERTION REGISTERED', 'The value appears in output, but the runner has no condition to fail when it changes.', [{ name: 'console output', expected: 'runner assertion', actual: 'printed 5100', status: 'info' }])
        : output('gap', 'ASSERTION DOES NOT MATCH THIS RESULT', 'Choose an assertion that checks this numeric return value. Deep equality is for structured data; throws is for failure behavior.', [{ name: 'assertion type', expected: 'strict equality', actual: controls.selected, status: 'fail' }])
    case 'boundary': {
      const expected = controls.value >= 1
      const actual = controls.value > 1
      return controls.value === 1
        ? output('caught', 'BUG CAUGHT: OFF-BY-ONE DEFECT EXPOSED', 'The assertion fails against the defective function for exactly the right reason. A red test is valuable when it reveals a real contract violation.', [{ name: `canRequestLeave(${controls.value})`, expected: String(expected), actual: String(actual), status: 'fail' }])
        : output('gap', actual === expected ? 'TEST PASSED, BUT THE DEFECT SURVIVED' : 'CHECK THE CONTRACT', 'This input does not distinguish the buggy rule from the required rule. Move the test to the exact boundary.', [{ name: `canRequestLeave(${controls.value})`, expected: String(expected), actual: String(actual), status: actual === expected ? 'pass' : 'fail' }])
    }
    case 'errors': {
      const throwsRange = controls.value < 0 || controls.value > 23
      const catchesExpected = throwsRange && controls.assertion === 'expected'
      const noAssertion = controls.assertion === 'none'
      return output(catchesExpected ? 'pass' : 'gap', catchesExpected ? 'EXPECTED ERROR VERIFIED' : noAssertion ? 'ERROR HAS NO ASSERTION' : throwsRange ? 'ERROR OCCURRED, ASSERTION IS TOO BROAD' : 'VALID INPUT: NO ERROR TO ASSERT', catchesExpected ? 'The invalid check-in is rejected with the documented RangeError.' : noAssertion ? 'The function throws, but the test never asks the runner to verify that behavior.' : throwsRange ? 'Checking for any error can hide a different defect. Assert the expected error type.' : 'Move the input outside the valid 0–23 hour range, then verify the expected error.', [{ name: `parseCheckIn(${controls.value})`, expected: controls.assertion === 'expected' ? 'RangeError' : controls.assertion === 'any' ? 'any error' : 'assertion required', actual: throwsRange ? 'RangeError' : 'returned record', status: catchesExpected ? 'pass' : 'fail' }])
    }
    case 'objects': return controls.comparison === 'deep'
      ? output('pass', 'OBJECT SHAPE MATCHES', 'The returned object is a new reference, but its employee id and department match the expected contract.', [{ name: 'compare employee fields', expected: '{ id, department }', actual: '{ id, department }', status: 'pass' }])
      : output('gap', controls.comparison === 'strict' ? 'REFERENCE IS DIFFERENT' : 'STRING SNAPSHOT IS FRAGILE', controls.comparison === 'strict' ? 'Strict equality compares object identity here. Use a structural assertion for the fields this behavior promises.' : 'Stringifying can make formatting and property order part of the test. Prefer a structural assertion on stable fields.', [{ name: 'comparison', expected: 'matching structure', actual: controls.comparison === 'strict' ? 'different object reference' : 'formatted text', status: 'fail' }])
    case 'isolation': {
      const resultAtFixedHour = controls.hour < 17 ? 'active' : 'expired'
      return controls.frozen
      ? output('pass', 'REPEATABLE RESULT', 'The same fixed clock is injected on every run. The expiration rule stays real while time is controlled.', [{ name: `run 1 · ${String(controls.hour).padStart(2, '0')}:00`, expected: resultAtFixedHour, actual: resultAtFixedHour, status: 'pass' }, { name: 'run 2 · same input', expected: resultAtFixedHour, actual: resultAtFixedHour, status: 'pass' }])
      : output('gap', 'UNCONTROLLED CLOCK', 'The test reads wall-clock time. Its result can change when it runs, making the check timing-sensitive.', [{ name: 'run 1', expected: 'same result', actual: 'active', status: 'info' }, { name: 'run 2', expected: 'same result', actual: 'expired', status: 'fail' }])
    }
    case 'doubles': return controls.selected === 'spy'
      ? output('pass', 'SIDE EFFECT SAFELY OBSERVED', 'The service is real, the email is not sent, and the spy proves the mailer was called once.', [{ name: 'sendInvite()', expected: 'one mailer call', actual: 'one recorded call', status: 'pass' }])
      : output('gap', controls.selected === 'real' ? 'LIVE SIDE EFFECT BLOCKED' : 'DOUBLE DOES NOT ANSWER THIS QUESTION', controls.selected === 'real' ? 'The studio blocks real email. A unit test should not deliver a message to a real person.' : controls.selected === 'stub' ? 'A stub returns a chosen value; it does not automatically prove how many times it was called.' : controls.selected === 'fake' ? 'A fake can model behavior, but this test specifically needs evidence about a call.' : 'A dummy fills an unused parameter and does not record interactions.', [{ name: 'mailer', expected: 'record one call', actual: controls.selected, status: 'fail' }])
    case 'async': return controls.awaited
      ? output('pass', 'PROMISE SETTLED BEFORE ASSERTION', 'The test waits for the employee lookup. The runner observes the result and any rejection.', [{ name: 'findEmployee()', expected: 'resolved employee', actual: 'E-104 · Mina', status: 'pass' }, { name: 'assertion', expected: 'after resolve', actual: 'after resolve', status: 'pass' }])
      : output('gap', 'TEST ENDED WHILE WORK WAS PENDING', 'The promise is still in flight when the assertion runs. Await it or return it so the test runner tracks the operation.', [{ name: 'findEmployee()', expected: 'resolved employee', actual: 'pending promise', status: 'fail' }])
    case 'lifecycle': return controls.beforeEach && controls.afterEach
      ? output('pass', 'ISOLATED TESTS: ORDER DOES NOT MATTER', 'Each test gets an empty store, and the resource closes afterward. No attendance record leaks into the next case.', [{ name: 'beforeEach', expected: 'fresh store', actual: 'fresh store', status: 'pass' }, { name: 'test order', expected: 'independent', actual: 'independent', status: 'pass' }, { name: 'afterEach', expected: 'closed', actual: 'closed', status: 'pass' }])
      : output('gap', 'SHARED STATE CAN LEAK', 'Enable fresh setup and cleanup. Without both, results can depend on which test ran first or whether a resource stayed open.', [{ name: 'fresh setup', expected: 'enabled', actual: controls.beforeEach ? 'enabled' : 'missing', status: controls.beforeEach ? 'pass' : 'fail' }, { name: 'resource cleanup', expected: 'enabled', actual: controls.afterEach ? 'enabled' : 'missing', status: controls.afterEach ? 'pass' : 'fail' }])
    case 'organization': {
      const clearName = controls.name.trim().length >= 16 && /(allows|rejects|denies|returns|throws|when|at|empty|invalid)/i.test(controls.name)
      return output(clearName ? 'pass' : 'gap', clearName ? 'FAILURE REPORT TELLS A STORY' : 'FAILURE REPORT NEEDS CONTEXT', clearName ? `The runner can show “${controls.name.trim()}” when this test fails.` : 'Name the behavior and the situation so a teammate can understand the failure without opening the implementation.', [{ name: controls.name || '(unnamed test)', expected: 'scenario + behavior', actual: clearName ? 'descriptive' : 'too vague', status: clearName ? 'pass' : 'info' }])
    }
    case 'coverage': {
      const bothPaths = controls.invalid && controls.valid
      const rows = [
        { name: 'invalid branch', expected: 'executed + asserted', actual: controls.invalid ? (controls.asserted ? 'executed + asserted' : 'executed, assertion missing') : 'not executed', status: controls.invalid && controls.asserted ? 'pass' : 'fail' },
        { name: 'valid boundary branch', expected: 'executed + asserted', actual: controls.valid ? (controls.asserted ? 'executed + asserted' : 'executed, assertion missing') : 'not executed', status: controls.valid && controls.asserted ? 'pass' : 'fail' },
      ]
      return output(bothPaths && controls.asserted ? 'pass' : 'gap', bothPaths ? (controls.asserted ? 'BRANCHES RUN AND RESULTS ASSERTED' : '100% PATHS, NO ASSERTION PROOF') : 'UNVISITED BRANCH REMAINS', bothPaths && controls.asserted ? 'Both decision paths ran and their outcomes were checked. Coverage describes execution; the assertions provide behavioral evidence.' : bothPaths ? 'Both paths executed, but the suite still needs assertions that check the outcomes.' : 'Add tests for both the denied path and the valid boundary. Coverage is useful for finding what did not run.', rows)
    }
    case 'tdd': return controls.stage === 3
      ? output('pass', 'RED → GREEN → REFACTOR COMPLETE', 'The test first exposed the missing rule, the smallest implementation made it pass, and the refactor kept behavior green.', [{ name: 'RED', expected: 'fails for missing rule', actual: 'confirmed', status: 'pass' }, { name: 'GREEN', expected: 'test passes', actual: 'passes', status: 'pass' }, { name: 'REFACTOR', expected: 'behavior preserved', actual: 'suite green', status: 'pass' }])
      : output('gap', 'CYCLE IN PROGRESS', 'Advance one deliberate step at a time. A useful Red should fail for the behavior you intend to add.', [{ name: 'TDD step', expected: '3 steps', actual: String(controls.stage), status: 'info' }])
    case 'mutation': return controls.mutant && controls.exactBoundary
      ? output('caught', 'MUTANT KILLED: TEST PROTECTED THE RULE', 'The exact-boundary test fails against the changed comparison. Your test suite caught a realistic regression.', [{ name: 'daysLeft = 1', expected: 'allowed', actual: 'denied by mutant', status: 'fail' }])
      : output('gap', controls.mutant ? 'MUTANT SURVIVED' : 'ORIGINAL CODE IS GREEN', controls.mutant ? 'The suite does not distinguish the original rule from the defect yet. Add a test at exactly one day remaining.' : 'Turn the mutation on to challenge the suite with the one-character defect.', [{ name: 'exact boundary test', expected: 'must catch mutant', actual: controls.exactBoundary ? 'test present' : 'missing', status: controls.exactBoundary ? 'info' : 'fail' }])
    default: return output('gap', 'NO SCENARIO', 'Choose a lesson from the campaign rail.')
  }
}

function StatusChip({ children, tone = '' }) {
  return <span className={`ut-status-chip ${tone}`}>{children}</span>
}

function CampaignRail({ activeLesson, completed, onSelect }) {
  return <aside className="ut-campaign-rail" aria-label="Bug hunt campaign">
    <div className="ut-rail-heading"><span>CASE FILES</span><b>{completed.length}/15</b></div>
    {UNIT_TESTING_STUDIO_PARTS.map((part, partIndex) => <section className="ut-rail-part" key={part.id}>
      <h2><i>0{partIndex + 1}</i>{part.title}</h2>
      {part.lessons.map((lesson) => {
        const item = UNIT_TESTING_STUDIO_LESSONS.find((candidate) => candidate.id === lesson.id)
        const done = completed.includes(item.id)
        const current = activeLesson.id === item.id
        return <button key={item.id} className={`ut-case-link ${current ? 'current' : ''} ${done ? 'solved' : ''}`} type="button" onClick={() => onSelect(item.id)} aria-current={current ? 'step' : undefined}>
          <span className="ut-case-index">{done ? '✓' : String(item.number).padStart(2, '0')}</span><span className="ut-case-name">{item.title}</span><span className="ut-case-led" />
        </button>
      })}
    </section>)}
    <div className="ut-rail-tip"><b>INVESTIGATOR NOTE</b><p>A failing test is useful when it exposes a real behavior defect. The runner explains what each result means.</p></div>
  </aside>
}

function MissionControl({ lesson, controls, update }) {
  const selectedCases = new Set(controls.selected || [])
  const toggleCase = (id) => update({ selected: selectedCases.has(id) ? [...selectedCases].filter((item) => item !== id) : [...selectedCases, id] })

  if (lesson.interaction === 'scope') return <div className="ut-scope-options" role="group" aria-label="Choose the test boundary">
    {SCOPE_OPTIONS.map((option) => <button type="button" key={option.id} onClick={() => update({ selected: option.id })} className={controls.selected === option.id ? 'picked' : ''} aria-pressed={controls.selected === option.id}><b>{option.icon}</b><strong>{option.title}</strong><span>{option.detail}</span></button>)}
  </div>

  if (lesson.interaction === 'aaa') return <div className="ut-aaa-control">
    <div className="ut-aaa-track">{['Arrange', 'Act', 'Assert'].map((step, index) => <div key={step} className={controls.step > index ? 'done' : controls.step === index ? 'active' : ''}><i>{controls.step > index ? '✓' : index + 1}</i><span>{step}</span></div>)}</div>
    <button type="button" className="ut-action-button" onClick={() => update({ step: Math.min(3, controls.step + 1) })} disabled={controls.step >= 3}>{controls.step >= 3 ? 'Trace assembled ✓' : `Add ${['Arrange', 'Act', 'Assert'][controls.step]} step →`}</button>
  </div>

  if (lesson.interaction === 'cases') return <div className="ut-case-builder">
    <p>Select test rows to add to the suite. Each row keeps an input beside its expected output.</p>
    {CASE_OPTIONS.map((item) => <label key={item.id} className={`ut-case-row ${selectedCases.has(item.id) ? 'selected' : ''}`}><input type="checkbox" checked={selectedCases.has(item.id)} onChange={() => toggleCase(item.id)} /><span className="ut-case-row-main"><b>{item.name}</b><small>Input: {item.input}</small></span><span className="ut-case-expected">expect <b>{item.expected}</b></span></label>)}
  </div>

  if (lesson.interaction === 'assertion') return <div className="ut-assertion-picker">
    <p>Choose how the test should prove its result.</p>
    {[['log', 'console.log', 'Shows a value'], ['strict', 'strictEqual', 'Checks an exact primitive'], ['deep', 'deepStrictEqual', 'Checks data structure'], ['throws', 'throws', 'Checks a failure contract']].map(([id, label, help]) => <button type="button" key={id} onClick={() => update({ selected: id })} className={controls.selected === id ? 'selected' : ''}><code>{label}</code><span>{help}</span><i>{controls.selected === id ? 'SELECTED' : 'USE'}</i></button>)}
  </div>

  if (lesson.interaction === 'boundary') return <div className="ut-input-control">
    <div className="ut-value-readout"><span>days remaining</span><strong>{controls.value}</strong><StatusChip tone={controls.value === 1 ? 'warning' : ''}>{controls.value === 1 ? 'EXACT LIMIT' : controls.value < 1 ? 'BELOW LIMIT' : 'ABOVE LIMIT'}</StatusChip></div>
    <input aria-label="Days remaining for leave request" type="range" min="0" max="3" step="1" value={controls.value} onChange={(event) => update({ value: Number(event.target.value) })} />
    <div className="ut-range-labels"><span>0 · denied</span><b>1 · boundary</b><span>2+ · allowed</span></div>
    <p>The production rule incorrectly uses <code>&gt; 1</code>. Find the input that makes it disagree with the requirement <code>&gt;= 1</code>.</p>
  </div>

  if (lesson.interaction === 'errors') return <div className="ut-error-control">
    <label>Check-in hour <input type="number" min="-2" max="25" value={controls.value} onChange={(event) => update({ value: Number(event.target.value) })} /></label>
    <div className="ut-error-assertion"><span>ASSERTION EXPECTS</span>{[['expected', 'RangeError'], ['any', 'any error'], ['none', 'no assertion']].map(([id, label]) => <button type="button" key={id} onClick={() => update({ assertion: id })} className={controls.assertion === id ? 'selected' : ''}>{label}</button>)}</div>
    <p>Valid hours are 0 through 23. Try an invalid value and verify its documented error.</p>
  </div>

  if (lesson.interaction === 'objects') return <div className="ut-object-control">
    <div className="ut-object-visual"><div><span>ACTUAL</span><code>{'{ id: E-104, dept: HR }'}</code><small>new object in memory</small></div><b>≠ ref<br /><em>= data?</em></b><div><span>EXPECTED</span><code>{'{ id: E-104, dept: HR }'}</code><small>separate expected value</small></div></div>
    <div className="ut-segment-control" role="group" aria-label="Object comparison">{[['strict', 'Reference equality'], ['deep', 'Deep equality'], ['json', 'Stringify both']].map(([id, label]) => <button type="button" key={id} className={controls.comparison === id ? 'selected' : ''} aria-pressed={controls.comparison === id} onClick={() => update({ comparison: id })}>{label}</button>)}</div>
  </div>

  if (lesson.interaction === 'isolation') return <div className="ut-clock-control">
    <div className="ut-clock-face"><div className="ut-clock-hand" style={{ transform: `rotate(${controls.hour * 15}deg)` }} /><b>{String(controls.hour).padStart(2, '0')}:00</b><small>SIMULATED CLOCK</small></div>
    <div className="ut-clock-controls"><label className="ut-switch-row"><input type="checkbox" checked={controls.frozen} onChange={(event) => update({ frozen: event.target.checked })} /><span className="ut-toggle" /><span><b>{controls.frozen ? 'Clock injected and fixed' : 'Using real wall-clock time'}</b><small>Run the same test twice to compare its result.</small></span></label><label className="ut-hour-slider">Move simulated time<input type="range" min="0" max="23" value={controls.hour} onChange={(event) => update({ hour: Number(event.target.value) })} /><span>00:00 <b>{String(controls.hour).padStart(2, '0')}:00</b> 23:00</span></label></div>
    <p className="ut-clock-warning">{controls.frozen ? 'Same time input on every run → deterministic result.' : 'Time moves between runs → this test can become flaky.'}</p>
  </div>

  if (lesson.interaction === 'doubles') return <div className="ut-double-picker">
    <p>Choose what replaces the external mail provider in this test.</p>
    {[['real', 'Live email', 'Blocked side effect', '↗'], ['stub', 'Stub', 'Returns a controlled value', '→'], ['spy', 'Spy / mock', 'Records the send call', '◎'], ['fake', 'Fake', 'Lightweight working substitute', '▦'], ['dummy', 'Dummy', 'Unused placeholder', '—']].map(([id, title, detail, icon]) => <button type="button" key={id} onClick={() => update({ selected: id })} className={controls.selected === id ? 'selected' : ''} aria-pressed={controls.selected === id}><b>{icon}</b><strong>{title}</strong><span>{detail}</span></button>)}
    <div className="ut-no-network"><i /> LAB NETWORK DISABLED · NO REAL EMAIL IS SENT</div>
  </div>

  if (lesson.interaction === 'async') return <div className="ut-async-control">
    <div className={`ut-promise-track ${controls.awaited ? 'awaited' : ''}`}><span>CALL</span><b>findEmployee()</b><i>→</i><span className="promise">{controls.awaited ? 'RESOLVED' : 'PENDING'}</span><i>→</i><b className="assertion">assert name</b></div>
    <label className="ut-switch-row"><input type="checkbox" checked={controls.awaited} onChange={(event) => update({ awaited: event.target.checked })} /><span className="ut-toggle" /><span><b>{controls.awaited ? 'await result before asserting' : 'assert immediately'}</b><small>The runner can only track work that the test returns or awaits.</small></span></label>
  </div>

  if (lesson.interaction === 'lifecycle') return <div className="ut-hook-control">
    <div className="ut-hook-lane"><div className={controls.beforeEach ? 'enabled' : ''}><span>BEFORE EACH</span><b>createFreshStore()</b><small>{controls.beforeEach ? 'new clean state' : 'shared old state'}</small></div><i>→</i><div className="hook-test"><span>TEST</span><b>attendanceCount()</b><small>expect 0 records</small></div><i>→</i><div className={controls.afterEach ? 'enabled' : ''}><span>AFTER EACH</span><b>store.close()</b><small>{controls.afterEach ? 'resource released' : 'resource left open'}</small></div></div>
    <div className="ut-hook-toggles"><label><input type="checkbox" checked={controls.beforeEach} onChange={(event) => update({ beforeEach: event.target.checked })} />Fresh setup</label><label><input type="checkbox" checked={controls.afterEach} onChange={(event) => update({ afterEach: event.target.checked })} />Teardown</label></div>
  </div>

  if (lesson.interaction === 'organization') return <div className="ut-name-control">
    <label htmlFor="ut-test-name">Edit the test name</label><input id="ut-test-name" value={controls.name} onChange={(event) => update({ name: event.target.value })} placeholder="Describe the scenario and outcome" />
    <div className="ut-name-preview"><span>FAILURE REPORT PREVIEW</span><b>{controls.name || '(unnamed test)'}</b><small>Expected true · received false</small></div>
    <p>Make the report useful to a teammate who did not write this test.</p>
  </div>

  if (lesson.interaction === 'coverage') return <div className="ut-coverage-control">
    <label className={`ut-coverage-case ${controls.invalid ? 'selected' : ''}`}><input type="checkbox" checked={controls.invalid} onChange={(event) => update({ invalid: event.target.checked })} /><span><b>daysLeft = 0</b><small>invalid branch · denied</small></span><i>{controls.invalid ? 'EXECUTED' : 'NOT RUN'}</i></label>
    <label className={`ut-coverage-case ${controls.valid ? 'selected' : ''}`}><input type="checkbox" checked={controls.valid} onChange={(event) => update({ valid: event.target.checked })} /><span><b>daysLeft = 1</b><small>boundary branch · allowed</small></span><i>{controls.valid ? 'EXECUTED' : 'NOT RUN'}</i></label>
    <label className="ut-switch-row"><input type="checkbox" checked={controls.asserted} onChange={(event) => update({ asserted: event.target.checked })} /><span className="ut-toggle" /><span><b>Add meaningful assertions</b><small>Execution coverage alone cannot prove the output is correct.</small></span></label>
  </div>

  if (lesson.interaction === 'tdd') return <div className="ut-tdd-control">
    {[
      ['RED', 'Write a test for rating 5', 'The test fails: expected true, received false'],
      ['GREEN', 'Implement the smallest rule', 'The same test now passes'],
      ['REFACTOR', 'Improve the design safely', 'Behavior stays green after cleanup'],
    ].map(([stage, label, detail], index) => <button type="button" key={stage} onClick={() => update({ stage: Math.max(controls.stage, index + 1) })} disabled={controls.stage !== index} className={`${controls.stage >= index + 1 ? 'complete' : controls.stage === index ? 'active' : ''}`}><span>{controls.stage > index ? '✓' : String(index + 1).padStart(2, '0')}</span><b>{stage}</b><strong>{label}</strong><small>{detail}</small></button>)}
  </div>

  if (lesson.interaction === 'mutation') return <div className="ut-mutation-control">
    <div className="ut-mutation-switch"><span>INJECT ONE-CHARACTER BUG</span><button type="button" className={controls.mutant ? 'on' : ''} onClick={() => update({ mutant: !controls.mutant })} aria-pressed={controls.mutant}>{controls.mutant ? 'MUTANT ON' : 'ORIGINAL CODE'}</button></div>
    <label className={`ut-boundary-test ${controls.exactBoundary ? 'selected' : ''}`}><input type="checkbox" checked={controls.exactBoundary} onChange={(event) => update({ exactBoundary: event.target.checked })} /><span><b>daysLeft = 1</b><small>assert that the exact minimum is allowed</small></span><i>{controls.exactBoundary ? 'IN SUITE' : 'ADD TEST'}</i></label>
    <div className="ut-code-diff"><code>original: daysLeft &gt;= 1</code><code className={controls.mutant ? 'mutant' : ''}>mutant: &nbsp; daysLeft {controls.mutant ? '&gt; 1' : '&gt;= 1'}</code></div>
  </div>

  return null
}

function SystemTrace({ lesson, controls, result, running }) {
  const functionName = lesson.code.match(/function\s+([\w]+)/)?.[1] || 'unitUnderTest'
  const traceClass = running ? 'moving' : result?.status === 'caught' ? 'caught' : result?.status === 'pass' ? 'complete' : ''
  return <div className={`ut-system-trace ${traceClass}`}>
    <div className="ut-trace-node request-node"><span>ARRANGE · INPUT</span><b>{lesson.interaction === 'boundary' ? `daysLeft = ${controls.value}` : lesson.interaction === 'errors' ? `hour = ${controls.value}` : lesson.interaction === 'cases' ? `${controls.selected.length} salary cases` : lesson.interaction === 'async' ? 'employee id E-104' : lesson.interaction === 'mutation' ? 'daysLeft = 1' : lesson.interaction === 'isolation' ? (controls.frozen ? 'fixed clock' : 'wall clock') : 'controlled example'}</b><small>test-owned data</small></div>
    <div className="ut-trace-connector"><i /><span>→</span></div>
    <div className="ut-trace-node unit-node"><span>UNIT UNDER TEST</span><b>{functionName}()</b><small>{lesson.interaction === 'boundary' || lesson.interaction === 'mutation' ? 'known boundary defect in demo' : 'real behavior stays under test'}</small></div>
    <div className="ut-trace-connector"><i /><span>→</span></div>
    <div className="ut-trace-node result-node"><span>ASSERT · OBSERVE</span><b>{result?.rows?.[0]?.actual || (running ? 'running checks…' : 'waiting for run')}</b><small>{result?.headline || 'expected output is visible in the test file'}</small></div>
    <div className="ut-trace-packet" aria-hidden="true" />
  </div>
}

function RunnerOutput({ result }) {
  if (!result) return <div className="ut-runner-empty"><div className="ut-terminal-cursor">▍</div><b>Runner standing by</b><p>Build a test on the bench, then run it to see the input, function, assertion, and result.</p></div>
  return <div className={`ut-runner-result ${result.status}`}>
    <div className="ut-result-banner"><span>{result.status === 'caught' ? 'BUG CAUGHT' : result.status === 'pass' ? 'TESTS PASSED' : result.status === 'gap' ? 'TEST GAP' : 'TEST FAILED'}</span><b>{result.headline}</b></div>
    <p>{result.explanation}</p>
    <div className="ut-result-table"><div className="ut-result-header"><span>CHECK</span><span>EXPECTED</span><span>OBSERVED</span><span>RESULT</span></div>
      {result.rows.map((row, index) => <div className="ut-result-row" key={`${row.name}-${index}`}><span>{row.name}</span><code>{row.expected}</code><code>{row.actual}</code><b className={row.status}>{row.status === 'pass' ? 'PASS' : row.status === 'fail' ? 'FAIL' : 'INFO'}</b></div>)}
    </div>
  </div>
}

export default function UnitTestingStudio() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [completed, setCompleted] = useState(readProgress)
  const [controlsByLesson, setControlsByLesson] = useState({})
  const [resultsByLesson, setResultsByLesson] = useState({})
  const [runningLessonId, setRunningLessonId] = useState('')
  const runTimer = useRef(null)
  const activeId = searchParams.get('mission')
  const activeLesson = useMemo(() => UNIT_TESTING_STUDIO_LESSONS.find((lesson) => lesson.id === activeId) || UNIT_TESTING_STUDIO_LESSONS[0], [activeId])
  const controls = { ...getDefaults(activeLesson.interaction), ...controlsByLesson[activeLesson.id] }
  const result = resultsByLesson[activeLesson.id] || null
  const isRunning = runningLessonId === activeLesson.id
  const completedCount = completed.length
  const activeIndex = UNIT_TESTING_STUDIO_LESSONS.findIndex((lesson) => lesson.id === activeLesson.id)
  const previousLesson = UNIT_TESTING_STUDIO_LESSONS[activeIndex - 1]
  const nextLesson = UNIT_TESTING_STUDIO_LESSONS[activeIndex + 1]
  const progress = Math.round((completedCount / UNIT_TESTING_STUDIO_LESSONS.length) * 100)
  const score = completedCount * 100

  useEffect(() => () => window.clearTimeout(runTimer.current), [])

  function selectLesson(id) {
    window.clearTimeout(runTimer.current)
    setRunningLessonId('')
    setSearchParams({ mission: id })
  }

  function updateControls(patch) {
    setControlsByLesson((current) => ({ ...current, [activeLesson.id]: { ...getDefaults(activeLesson.interaction), ...current[activeLesson.id], ...patch } }))
    setResultsByLesson((current) => ({ ...current, [activeLesson.id]: null }))
  }

  function runSuite() {
    if (isRunning) return
    const lessonId = activeLesson.id
    const scenario = activeLesson
    const currentControls = controls
    window.clearTimeout(runTimer.current)
    setRunningLessonId(lessonId)
    setResultsByLesson((current) => ({ ...current, [lessonId]: null }))
    runTimer.current = window.setTimeout(() => {
      const output = evaluateLesson(scenario, currentControls)
      setResultsByLesson((current) => ({ ...current, [lessonId]: output }))
      setRunningLessonId((current) => current === lessonId ? '' : current)
      if ((output.status === 'pass' || output.status === 'caught') && !completed.includes(lessonId)) {
        const updated = [...completed, lessonId]
        setCompleted(updated)
        try {
          localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated))
        } catch {
          // Keep the completion in session state if browser storage is unavailable.
        }
      }
    }, 620)
  }

  return <main className="ut-studio">
    <div className="ut-shell">
      <div className="ut-topbar"><div className="ut-breadcrumb"><Link to="/">Learning Hub</Link><span>/</span><Link to="/course/unit-testing-fundamentals">Unit Testing</Link><span>/</span><b>Northstar release lab</b></div><StatusChip>LOCAL SIMULATION</StatusChip></div>

      <header className="ut-hero">
        <div className="ut-hero-copy"><div className="ut-eyebrow"><i /> NORTHSTAR · TEST ENGINEERING</div><h1>A bug escaped.<br /><em>Protect the next release.</em></h1><p>You’ve joined the team responsible for Northstar’s employee platform. Investigate each incident, build a focused test, then watch the runner prove what your suite can catch.</p><div className="ut-hero-actions"><span><b>15</b> incident missions</span><span><b>4</b> release stages</span><span><b>0</b> network calls</span></div></div>
        <div className="ut-hero-scene" aria-label="An employee request flows through a function and test runner">
          <div className="ut-hero-grid" />
          <div className="ut-orbit-ring ring-a" /><div className="ut-orbit-ring ring-b" />
          <div className="ut-server-card"><div className="ut-server-top"><span><i /> NORTHSTAR HR API</span><small>LOCAL · READY</small></div><div className="ut-server-lane"><b>EMPLOYEE</b><i>→</i><b className="server-unit">UNIT</b><i>→</i><b className="server-test">TEST</b></div><div className="ut-server-log"><span>09:41:02</span><b>request isolated</b><span>0.8 ms</span></div></div>
          <span className="ut-float-tag tag-incident">INCIDENT 01 · OPEN</span><span className="ut-float-tag tag-suite">SUITE · {completedCount}/15 GREEN</span>
        </div>
      </header>

      <section className="ut-dashboard" aria-label="Campaign dashboard">
        <div className="ut-dashboard-metric"><span>RELEASE BUILD</span><b>HR-2.8.0 <i>●</i></b><small>{progress === 100 ? 'All learning checks complete' : 'Regression risk under investigation'}</small></div>
        <div className="ut-dashboard-progress"><div><span>TEST SUITE PROGRESS</span><b>{completedCount} / 15 cases</b></div><div className="ut-progress-track"><i style={{ width: `${progress}%` }} /></div><small>{progress}% · progress saved on this device</small></div>
        <div className="ut-dashboard-xp"><span>ENGINEERING XP</span><b>{score.toLocaleString()}</b><small>earned from evidence-backed tests</small></div>
      </section>

      <div className="ut-layout">
        <CampaignRail activeLesson={activeLesson} completed={completed} onSelect={selectLesson} />

        <motion.section className="ut-workspace" key={activeLesson.id} initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} aria-labelledby="ut-lesson-title">
          <div className="ut-mission-header"><div><div className="ut-mission-kicker"><span>CASE {String(activeLesson.number).padStart(2, '0')}</span><i>/</i><span>{activeLesson.focus}</span></div><h2 id="ut-lesson-title">{activeLesson.title}</h2><p>{activeLesson.story}</p></div><div className="ut-case-stamp"><span>CASE STATUS</span><b className={completed.includes(activeLesson.id) ? 'resolved' : result?.status === 'caught' ? 'alert' : ''}>{completed.includes(activeLesson.id) ? 'RESOLVED' : result?.status === 'caught' ? 'BUG CAUGHT' : 'INVESTIGATING'}</b><small>{activeLesson.partTitle}</small></div></div>

          <div className="ut-impact-strip"><div className="ut-impact-icon">!</div><div><span>WHY THIS MATTERS IN PRODUCTION</span><p>{activeLesson.impact}</p></div><StatusChip tone="warning">REGRESSION RISK</StatusChip></div>

          <section className="ut-system-panel" aria-label="Application under test">
            <div className="ut-panel-bar"><div><i className="live-dot" /><span>APPLICATION UNDER TEST</span><b>northstar-hr / local sandbox</b></div><StatusChip tone={isRunning ? 'running' : result?.status === 'caught' ? 'warning' : 'ready'}>{isRunning ? 'TRACE IN FLIGHT' : result?.status === 'caught' ? 'DEFECT REPRODUCED' : 'SANDBOX READY'}</StatusChip></div>
            <SystemTrace lesson={activeLesson} controls={controls} result={result} running={isRunning} />
            <details className="ut-source-details"><summary>Inspect the function under test <span>→</span></summary><pre><code>{activeLesson.code}</code></pre></details>
          </section>

          <section className="ut-bench" aria-labelledby="ut-bench-heading">
            <div className="ut-bench-heading"><div className="ut-bench-icon">⌘</div><div><span>TEST BENCH · {activeLesson.partTitle}</span><h3 id="ut-bench-heading">Build evidence for this behavior</h3></div><StatusChip>TEST FILE · IN MEMORY</StatusChip></div>
      <div className="ut-bench-layout">
              <div className="ut-controls-panel"><div className="ut-subpanel-heading"><span>01</span><div><b>Configure your test</b><small>Change the controls and inspect what the test checks.</small></div></div><MissionControl lesson={activeLesson} controls={controls} update={updateControls} /></div>

              <div className="ut-runner-panel"><div className="ut-subpanel-heading"><span>02</span><div><b>Test file preview</b><small>Generated from the controls on your bench.</small></div></div><div className="ut-editor"><div className="ut-editor-bar"><span><i /> <i /> <i /></span><b>{activeLesson.id}.test.js</b><small>JAVASCRIPT</small></div><pre><code>{makeDraft(activeLesson, controls)}</code></pre></div><p className="ut-editor-note">Guided test draft · the runner simulates this scenario and does not execute arbitrary code.</p><button type="button" className="ut-run-button" onClick={runSuite} disabled={isRunning}>{isRunning ? <><i className="ut-run-spinner" /> Running test suite…</> : <>▶ &nbsp; Run test suite</>}</button><div className="ut-runner-console" aria-live="polite"><div className="ut-console-title"><span><i /> TEST RUNNER</span><small>{isRunning ? 'EXECUTING' : result ? 'COMPLETE' : 'IDLE'}</small></div><RunnerOutput result={result} /></div></div>
            </div>
          </section>

          <div className="ut-explanation-row"><article className="ut-explanation"><span>CONCEPT BRIEF</span><p>{activeLesson.why}</p></article><article className="ut-principle"><span>KEEP THIS RULE</span><p>{activeLesson.takeaway}</p></article></div>

          <div className="ut-workspace-footer"><div><b>{completed.includes(activeLesson.id) ? 'Evidence recorded' : 'Ready for the next investigation?'}</b><small>{completed.includes(activeLesson.id) ? 'Mission completion is saved locally.' : 'Use the bench, run the suite, and inspect the trace.'}</small></div><div className="ut-step-buttons"><button type="button" onClick={() => previousLesson && selectLesson(previousLesson.id)} disabled={!previousLesson}>← Previous case</button><button type="button" className="next" onClick={() => nextLesson && selectLesson(nextLesson.id)} disabled={!nextLesson}>{nextLesson ? 'Next incident →' : 'Campaign complete'}</button></div></div>
        </motion.section>
      </div>

      <footer className="ut-footer"><span>NORTHSTAR TEST ENGINEERING</span><p>Controlled learning sandbox · no server is started, no network request is made, and no project files are modified.</p><Link to="/course/unit-testing-fundamentals">Return to the reading course ↑</Link></footer>
    </div>
  </main>
}
