const defineLesson = (id, title, focus, story, impact, why, code, testCode, interaction, takeaway) => ({
  id, title, focus, story, impact, why, code, testCode, interaction, takeaway,
})

export const UNIT_TESTING_STUDIO_PARTS = [
  {
    id: 'testing-foundations',
    title: 'Build the first safety net',
    description: 'Choose a small behavior, describe its contract, and prove it with an assertion.',
    lessons: [
      defineLesson(
        'what-unit-tests-check', 'What unit tests check', 'TEST BOUNDARIES',
        'The payroll preview is slow because its check starts a browser, API, and database just to test one salary rule.',
        'A slow feedback loop means developers run checks less often and defects travel farther.',
        'A unit test checks one small behavior in isolation. Integration tests check connected components; end-to-end tests check a whole user journey. Teams need all three kinds of evidence, with fast unit checks close to the code.',
        "function annualSalary(monthlyPay) {\n  return monthlyPay * 12\n}",
        "test('converts monthly pay to annual pay', () => {\n  assert.equal(annualSalary(5000), 60000)\n})",
        'scope',
        'Keep this check close to the salary function. Broader tests still matter, but they answer a different question.'
      ),
      defineLesson(
        'arrange-act-assert', 'Arrange, Act, Assert', 'TEST STRUCTURE',
        'A new engineer cannot tell which line prepares the case, which line calls the behavior, or what the test proves.',
        'Hard-to-read tests make failures expensive to investigate and easy to weaken accidentally.',
        'AAA is a way to make a test’s reasoning visible. Arrange the inputs, Act by calling the unit, then Assert the observable result. One clear action per test makes the failure point easier to understand.',
        "function annualSalary(monthlyPay) {\n  return monthlyPay * 12\n}",
        "test('converts monthly pay to annual pay', () => {\n  // Arrange\n  const monthlyPay = 5000\n  // Act\n  const annual = annualSalary(monthlyPay)\n  // Assert\n  assert.equal(annual, 60000)\n})",
        'aaa',
        'A readable test tells a tiny story: given this situation, when this behavior runs, expect this result.'
      ),
      defineLesson(
        'inputs-and-expected-outputs', 'Inputs and expected outputs', 'TEST DATA',
        'A salary calculation handles a standard employee but breaks for part-time staff with zero overtime.',
        'One happy-path example can leave important business rules unprotected.',
        'Tests are examples of a behavior contract. Use meaningful inputs and independently known expected results. Table-driven cases make related rules visible together without hiding what each row means.',
        "function monthlyPay(base, overtimeHours, overtimeRate) {\n  return base + overtimeHours * overtimeRate\n}",
        "const cases = [\n  [5000, 0, 20, 5000],\n  [5000, 10, 20, 5200],\n]\n\nfor (const [base, hours, rate, expected] of cases) {\n  assert.equal(monthlyPay(base, hours, rate), expected)\n}",
        'cases',
        'A strong test names its input and its expected output. Do not copy the production calculation to generate the expectation.'
      ),
      defineLesson(
        'assertions', 'Assertions: make the proof precise', 'ASSERTIONS',
        'A payroll helper returns the right number, but its test only prints the result in the terminal.',
        'A console message does not fail a build when the result is wrong.',
        'Assertions turn expectations into executable checks. Match the assertion to the contract: exact values, nested data, thrown errors, or a recorded collaboration. Keep assertions focused on behavior a caller can observe.',
        "function takeHomePay(gross, tax) {\n  return gross - tax\n}",
        "const actual = takeHomePay(6000, 900)\nassert.strictEqual(actual, 5100)",
        'assertion',
        'A test is evidence only when the runner can detect that the expected behavior did or did not happen.'
      ),
    ],
  },
  {
    id: 'behavior-and-data',
    title: 'Find the behavior edges',
    description: 'Test limits, failures, returned data, and the dependencies that can make results unstable.',
    lessons: [
      defineLesson(
        'edge-cases', 'Edge cases and boundaries', 'BOUNDARY CHECKS',
        'The leave-balance rule rejects an employee who has exactly one day remaining.',
        'A one-character boundary mistake can deny a valid request to many employees.',
        'Defects often sit where behavior changes: empty versus non-empty, below versus at a limit, or allowed versus rejected. Test the boundary and nearby values. The lab’s function intentionally contains an off-by-one defect so you can see a useful test expose it.',
        "function canRequestLeave(daysLeft) {\n  return daysLeft > 1 // defect: exactly 1 should be allowed\n}",
        "test('allows a request with one day left', () => {\n  assert.equal(canRequestLeave(1), true)\n})",
        'boundary',
        'The most useful test is often the value exactly at the rule’s boundary.'
      ),
      defineLesson(
        'errors-and-exceptions', 'Errors and exceptions', 'FAILURE CONTRACTS',
        'The attendance parser must reject an invalid check-in time instead of silently recording it.',
        'Unexpected input is normal in production. Its failure behavior deserves a test too.',
        'A failure is part of a function’s contract. Assert that the operation throws the documented error type or stable message. The callback belongs inside the assertion so the runner can observe the exception.',
        "function parseCheckIn(hour) {\n  if (hour < 0 || hour > 23) throw new RangeError('hour out of range')\n  return { hour }\n}",
        "assert.throws(\n  () => parseCheckIn(25),\n  { name: 'RangeError' }\n)",
        'errors',
        'Assert the expected failure, not just any crash; otherwise an unrelated defect can make the test look successful.'
      ),
      defineLesson(
        'arrays-and-objects', 'Arrays and objects', 'DATA SHAPE',
        'An employee lookup returns correct fields, but a strict equality check fails every time.',
        'A broken assertion can hide valid behavior or tempt someone to remove a useful test.',
        'Strict equality on objects compares identity. If the requirement is about contents, compare structure. For large objects, check stable fields that matter instead of incidental metadata or formatting.',
        "function getEmployee(id) {\n  return { id, department: 'Engineering' }\n}",
        "assert.deepStrictEqual(\n  getEmployee('E-104'),\n  { id: 'E-104', department: 'Engineering' }\n)",
        'objects',
        'Choose the comparison that matches the contract: same reference, or same meaningful data.'
      ),
      defineLesson(
        'isolate-dependencies', 'Isolate external dependencies', 'TEST ISOLATION',
        'The “contract ends today” test passes on one laptop and fails after midnight.',
        'A test that depends on real time, a network, or shared state becomes slow and unreliable.',
        'Keep the behavior under test real, but control volatile inputs at its boundary. Pass a clock or fixed time into the function. Isolation is a deliberate boundary choice, not an instruction to mock every collaborator.',
        "function contractIsActive(contract, now) {\n  return now < contract.endsAt\n}",
        "const fixedNow = new Date('2026-04-01T00:00:00Z')\nassert.equal(contractIsActive(contract, fixedNow), true)",
        'isolation',
        'Deterministic inputs make a test repeatable at any time and on any machine.'
      ),
    ],
  },
  {
    id: 'dependencies-and-lifecycle',
    title: 'Control collaborators and time',
    description: 'Use test doubles for a reason, wait for async work, and give each test a clean world.',
    lessons: [
      defineLesson(
        'mocks-and-stubs', 'Mocks, stubs, fakes, spies', 'TEST DOUBLES',
        'An invitation service should request an email, but the lab must never send a real message.',
        'A live email, payment, or database dependency makes a unit test risky and nondeterministic.',
        'A stub supplies a controlled result. A spy records calls. A mock checks an expected interaction. A fake is a lightweight working substitute; a dummy fills a parameter the test ignores. Use the lightest double that answers the question.',
        "function sendInvite(mailer, email) {\n  return mailer.send(email)\n}",
        "const mailer = createSpy()\nsendInvite(mailer, 'new.employee@example.test')\nassert.equal(mailer.calls.length, 1)",
        'doubles',
        'The double should replace the external side effect while the service behavior remains real.'
      ),
      defineLesson(
        'async-functions', 'Asynchronous functions', 'ASYNC TIMELINE',
        'The employee list test reports green before the database promise has returned.',
        'A test that finishes too early can miss a rejected promise or an incorrect result.',
        'Await the promise or return it from the test so the runner knows the work is still in progress. Avoid guessed sleeps: they waste time and remain timing-sensitive.',
        "async function findEmployee(repository, id) {\n  return repository.findById(id)\n}",
        "test('loads the employee record', async () => {\n  const employee = await findEmployee(repository, 'E-104')\n  assert.equal(employee.name, 'Mina')\n})",
        'async',
        'The runner must wait for the asynchronous operation before it can trust the assertion.'
      ),
      defineLesson(
        'setup-and-teardown', 'Setup and teardown', 'TEST LIFECYCLE',
        'One attendance test leaves a modified employee record that changes the next test’s result.',
        'Order-dependent tests are hard to reproduce and can break when the suite runs in parallel.',
        'Create fresh fixtures before each test and release resources afterward. Tests should pass alone and in a different order. Keep important setup near the test so hidden shared state does not obscure what it proves.',
        "beforeEach(() => {\n  store = createEmployeeStore()\n})\n\nafterEach(() => {\n  store.close()\n})",
        "test('starts with no attendance records', () => {\n  assert.equal(store.attendanceCount(), 0)\n})",
        'lifecycle',
        'Fresh state and dependable cleanup make tests repeatable instead of order-sensitive.'
      ),
    ],
  },
  {
    id: 'trust-and-release',
    title: 'Trust the suite before release',
    description: 'Make failures readable, interpret coverage carefully, and challenge tests with TDD and mutations.',
    lessons: [
      defineLesson(
        'test-organization', 'Test organization and naming', 'FAILURE REPORTS',
        'The release report says “test 7 failed”; the engineer has to open every file to find the broken rule.',
        'Clear names shorten diagnosis time and turn a test suite into useful behavior documentation.',
        'Group related checks and name each test by the situation and expected result. Test behavior visible to callers, not private helper calls that can change during refactoring.',
        "describe('leave requests', () => {\n  // focused behavior checks live here\n})",
        "test('allows leave when one day remains', () => {\n  assert.equal(canRequestLeave(1), true)\n})",
        'organization',
        'A failure report should tell the team which behavior and situation need attention.'
      ),
      defineLesson(
        'coverage-limits', 'Coverage: evidence, not a score', 'COVERAGE MAP',
        'The dashboard shows 100% line coverage, but nobody tested the exact leave limit.',
        'A high percentage can create false confidence if assertions do not check important behavior.',
        'Line coverage tells you which lines ran; branch coverage shows decision paths. Neither proves the expected result was asserted. Use coverage to locate unvisited code, then inspect whether the suite would catch a meaningful defect.',
        "if (daysLeft < 1) return 'denied'\nreturn 'allowed'",
        "test('allows the exact minimum', () => {\n  assert.equal(canRequestLeave(1), 'allowed')\n})",
        'coverage',
        'Coverage is a map of execution. Test quality is whether the suite protects behavior.'
      ),
      defineLesson(
        'test-driven-development', 'Test-driven development', 'RED · GREEN · REFACTOR',
        'The team is adding a new salary rule and wants feedback before the implementation spreads.',
        'Small test-first steps catch misunderstandings while changes are still cheap.',
        'Red: write one test and confirm it fails for the intended reason. Green: make the simplest change that passes. Refactor: improve the design while the test remains green. Then repeat for the next rule.',
        "function bonusEligible(employee) {\n  return false // next behavior not implemented yet\n}",
        "test('allows a bonus for a top performer', () => {\n  assert.equal(bonusEligible({ rating: 5 }), true)\n})",
        'tdd',
        'Red proves the test can detect missing behavior. Green implements it; refactor keeps the design clear.'
      ),
      defineLesson(
        'mutation-testing-capstone', 'Mutation testing: the final challenge', 'RELEASE GATE',
        'A tiny change from < to <= slips into the leave rule during a refactor.',
        'A suite that stays green after a meaningful defect may not be protecting the contract.',
        'Mutation testing changes code deliberately and reruns tests. A killed mutant means a test detected the change; a survivor exposes a gap. It is a useful signal, not a proof that a system has no bugs.',
        "// Original\nreturn daysLeft >= 1\n\n// Mutant\nreturn daysLeft > 1",
        "test('allows exactly one day remaining', () => {\n  assert.equal(canRequestLeave(1), true)\n})",
        'mutation',
        'A strong capstone test distinguishes the rule from a realistic one-character defect.'
      ),
    ],
  },
]

export const UNIT_TESTING_STUDIO_LESSONS = UNIT_TESTING_STUDIO_PARTS.flatMap((part, partIndex) =>
  part.lessons.map((item, lessonIndex) => ({
    ...item,
    partId: part.id,
    partTitle: part.title,
    partDescription: part.description,
    number: UNIT_TESTING_STUDIO_PARTS.slice(0, partIndex).reduce((count, previous) => count + previous.lessons.length, 0) + lessonIndex + 1,
  }))
)
