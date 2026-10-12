export default [
  {
    id: 'unit-testing-1',
    type: 'mcq',
    difficulty: 'medium',
    category: 'Testing Fundamentals',
    prompt: `A developer writes a test that verifies only one function in complete isolation without calling databases, APIs, or external services.

What type of test is this?`,
    options: [
      'Integration Test',
      'Unit Test',
      'End-to-End Test',
      'Performance Test'
    ],
    correctAnswer: 'Unit Test',
    explanation: 'A unit test verifies the behavior of a single unit of code in isolation. External dependencies such as databases, APIs, file systems, and network calls should be replaced with mocks, stubs, or fakes.'
  },

  {
    id: 'unit-testing-2',
    type: 'mcq',
    difficulty: 'hard',
    category: 'AAA Pattern',
    prompt: `Which sequence follows the Arrange-Act-Assert (AAA) testing pattern?`,
    options: [
      'Assert → Arrange → Act',
      'Arrange → Act → Assert',
      'Act → Assert → Arrange',
      'Arrange → Assert → Act'
    ],
    correctAnswer: 'Arrange → Act → Assert',
    explanation: 'Arrange prepares the test data and dependencies. Act executes the code under test. Assert verifies that the expected outcome occurred. Following AAA makes tests easier to understand and maintain.'
  },

  {
    id: 'unit-testing-3',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Mocks vs Stubs',
    prompt: `A payment service depends on a bank API.

During unit testing you replace the API with an object that always returns "Payment Successful" without checking how it was called.

What type of test double is this?`,
    options: [
      'Mock',
      'Stub',
      'Spy',
      'Fake'
    ],
    correctAnswer: 'Stub',
    explanation: 'A stub provides predefined responses but does not verify interactions. A mock, on the other hand, can verify whether methods were called, how many times they were called, and with which arguments.'
  },

  {
    id: 'unit-testing-4',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Test Isolation',
    prompt: `A unit test passes on your machine but fails after another test runs before it.

What is the MOST likely problem?`,
    options: [
      'The tests are not isolated',
      'The compiler is outdated',
      'Assertions are incorrect',
      'The testing framework is buggy'
    ],
    correctAnswer: 'The tests are not isolated',
    explanation: 'Unit tests should be completely independent. If one test changes shared state or depends on another test\'s execution order, the test suite becomes unreliable.'
  },

  {
    id: 'unit-testing-5',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Flaky Tests',
    prompt: `A test sometimes passes and sometimes fails without any code changes.

What is this commonly called?`,
    options: [
      'Regression',
      'Flaky Test',
      'Smoke Test',
      'Mutation Test'
    ],
    correctAnswer: 'Flaky Test',
    explanation: 'Flaky tests produce inconsistent results. Common causes include timing issues, shared state, network dependencies, randomness, and reliance on system time.'
  },

  {
    id: 'unit-testing-6',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Code Coverage',
    prompt: `A project reports 100% code coverage.

Can you conclude the software is bug-free?`,
    options: [
      'Yes',
      'No, coverage measures execution—not correctness',
      'Only if integration tests exist',
      'Only in production builds'
    ],
    correctAnswer: 'No, coverage measures execution—not correctness',
    explanation: 'Coverage only indicates that code was executed during testing. Poor assertions or missing edge cases can still leave serious bugs undetected despite very high coverage.'
  },

  {
    id: 'unit-testing-7',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Assertions',
    prompt: `A test executes the target method successfully but contains no assertions.

How should this test be reviewed?`,
    options: [
      'Accept because no exception occurred',
      'Reject because the test verifies nothing',
      'Accept if code coverage is high',
      'Replace it with an integration test'
    ],
    correctAnswer: 'Reject because the test verifies nothing',
    explanation: 'Executing code without checking the result provides almost no value. Every meaningful unit test should verify observable behavior using assertions.'
  },

  {
    id: 'unit-testing-8',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Mock Verification',
    prompt: `An email service should send exactly one confirmation email after a successful order.

Which testing technique best verifies this behavior?`,
    options: [
      'Stub the email service',
      'Mock the email service and verify it was called once',
      'Increase code coverage',
      'Use a real SMTP server'
    ],
    correctAnswer: 'Mock the email service and verify it was called once',
    explanation: 'Mocks are designed to verify interactions. In this case, the important behavior is that the email service is called exactly once with the correct information.'
  },

  {
    id: 'unit-testing-9',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Dependency Injection',
    prompt: `Why does dependency injection generally make unit testing easier?`,
    options: [
      'Dependencies can be replaced with mocks or stubs',
      'Applications become faster',
      'It eliminates the need for assertions',
      'It automatically increases coverage'
    ],
    correctAnswer: 'Dependencies can be replaced with mocks or stubs',
    explanation: 'Dependency injection separates object creation from object usage, allowing tests to substitute real services with lightweight test doubles.'
  },

  {
    id: 'unit-testing-10',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Production Scenario',
    prompt: `A function passes every unit test but fails in production because the database schema changed.

What is the MOST likely explanation?`,
    options: [
      'Unit tests replace external dependencies and may not detect integration issues',
      'Unit tests are unreliable',
      'Assertions were incorrect',
      'Mocks automatically update the database schema'
    ],
    correctAnswer: 'Unit tests replace external dependencies and may not detect integration issues',
    explanation: 'Unit tests validate isolated business logic. They intentionally replace databases and external services, so schema mismatches and integration problems require integration or end-to-end tests to detect.'
  },
  {
  id: 'unit-testing-11',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Edge Cases',
  prompt: `A function calculates discounts correctly for positive prices.

During code review, what additional test case is MOST important?`,
  options: [
    'Test only with larger positive values',
    'Test boundary and invalid inputs such as 0, negative numbers, and null',
    'Increase code coverage',
    'Run the same test multiple times'
  ],
  correctAnswer: 'Test boundary and invalid inputs such as 0, negative numbers, and null',
  explanation: 'Many production bugs occur around boundary conditions rather than normal inputs. Good unit tests include edge cases such as empty values, nulls, negatives, maximum values, and invalid data.'
},

{
  id: 'unit-testing-12',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Exception Testing',
  prompt: `A method should throw an InvalidEmailException when an invalid email is supplied.

Which test is MOST valuable?`,
  options: [
    'Verify that the exception is thrown for invalid input',
    'Call the method without assertions',
    'Test only valid email addresses',
    'Mock the exception'
  ],
  correctAnswer: 'Verify that the exception is thrown for invalid input',
  explanation: 'Unit tests should verify both successful execution and expected failures. Exception paths are often overlooked but are critical to application reliability.'
},

{
  id: 'unit-testing-13',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Parameterized Tests',
  prompt: `A validation function must be tested with 50 different inputs.

What is generally the BEST approach?`,
  options: [
    'Write 50 separate test methods',
    'Use a parameterized test',
    'Test only one value',
    'Skip testing because coverage will be high'
  ],
  correctAnswer: 'Use a parameterized test',
  explanation: 'Parameterized tests allow the same test logic to run with multiple datasets, reducing duplication while improving readability and maintainability.'
},

{
  id: 'unit-testing-14',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Deterministic Tests',
  prompt: `A test sometimes fails because it depends on the current system time.

What is the BEST long-term solution?`,
  options: [
    'Increase the timeout',
    'Inject a controllable clock or time provider',
    'Run the test only during the day',
    'Ignore the failure'
  ],
  correctAnswer: 'Inject a controllable clock or time provider',
  explanation: 'Unit tests should be deterministic. Injecting a clock allows tests to control time explicitly instead of depending on the system clock.'
},

{
  id: 'unit-testing-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Async Testing',
  prompt: `A test finishes before an asynchronous operation completes.

What is the MOST likely issue?`,
  options: [
    'The test is not waiting for the async operation to complete',
    'The assertion is incorrect',
    'The mock is missing',
    'Code coverage is too low'
  ],
  correctAnswer: 'The test is not waiting for the async operation to complete',
  explanation: 'Async tests must await Promises or use the testing framework\'s asynchronous support. Otherwise, assertions may execute before the actual work has completed.'
},

{
  id: 'unit-testing-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Database',
  prompt: `A unit test inserts records into a real production database.

How should this be reviewed?`,
  options: [
    'Accept because it proves the database works',
    'Reject because unit tests should not depend on real external systems',
    'Accept only if transactions are used',
    'Accept if cleanup runs afterward'
  ],
  correctAnswer: 'Reject because unit tests should not depend on real external systems',
  explanation: 'Unit tests should execute quickly and consistently. Real databases introduce network delays, shared state, and environmental dependencies, making tests slower and less reliable.'
},

{
  id: 'unit-testing-17',
  type: 'code-review',
  difficulty: 'expert',
  category: 'External APIs',
  prompt: `A unit test calls a real payment gateway every time it runs.

What is the BEST recommendation?`,
  options: [
    'Replace the payment gateway with a mock or stub',
    'Increase the API timeout',
    'Run the test only once per release',
    'Retry failed requests automatically'
  ],
  correctAnswer: 'Replace the payment gateway with a mock or stub',
  explanation: 'Unit tests should isolate business logic from external services. Calling real payment APIs makes tests slow, expensive, and unreliable.'
},

{
  id: 'unit-testing-18',
  type: 'mcq',
  difficulty: 'expert',
  category: 'CI/CD',
  prompt: `A test passes locally but consistently fails in the CI pipeline.

What should be investigated FIRST?`,
  options: [
    'Hidden environment dependencies or assumptions',
    'Delete the failing test',
    'Increase code coverage',
    'Disable CI temporarily'
  ],
  correctAnswer: 'Hidden environment dependencies or assumptions',
  explanation: 'Tests should be environment-independent. Differences in operating systems, file paths, environment variables, time zones, or configuration often explain CI-only failures.'
},

{
  id: 'unit-testing-19',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Maintainability',
  prompt: `A single unit test performs login, creates a user, updates a profile, deletes records, and verifies email delivery.

How should this test be reviewed?`,
  options: [
    'Accept because it covers many features',
    'Split it into smaller tests that verify one behavior each',
    'Increase assertions',
    'Convert it into a smoke test'
  ],
  correctAnswer: 'Split it into smaller tests that verify one behavior each',
  explanation: 'Each unit test should verify one behavior. Small, focused tests are easier to understand, debug, and maintain. Large tests often hide the real cause of failures.'
},

{
  id: 'unit-testing-20',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Final Boss',
  prompt: `A project reports:

• 98% unit test coverage
• All unit tests pass
• Frequent production failures caused by API integrations

What is the MOST likely conclusion?`,
  options: [
    'High unit test coverage guarantees software quality',
    'The project likely lacks sufficient integration and end-to-end tests',
    'The unit tests should be deleted',
    'Code coverage should be reduced'
  ],
  correctAnswer: 'The project likely lacks sufficient integration and end-to-end tests',
  explanation: 'Unit tests verify isolated business logic, but they cannot detect issues involving databases, external APIs, messaging systems, authentication providers, or other integrated components. A balanced testing strategy combines unit, integration, and end-to-end tests to provide confidence across the entire application.'
},
{
  id: 'unit-testing-21',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Assertions',
  prompt: 'What is the primary purpose of an assertion in a test?',
  options: ['Compare actual behavior with an expected outcome', 'Start the application server', 'Replace every dependency with a mock', 'Generate production test data'],
  correctAnswer: 'Compare actual behavior with an expected outcome',
  explanation: 'An assertion states what the test expects and fails the test when actual behavior differs. Without meaningful assertions, a test can execute code without checking that it works.'
},
{
  id: 'unit-testing-22',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Test Doubles',
  prompt: 'A test uses an in-memory repository that implements the same interface as the real database repository. Which test double is this most like?',
  options: ['Fake', 'Stub', 'Spy', 'Assertion'],
  correctAnswer: 'Fake',
  explanation: 'A fake is a lightweight working implementation, such as an in-memory repository, that replaces a real dependency. A stub mainly returns canned data, while a spy records interactions for later assertions.'
}
];
