# Test Quality and Testing Approaches

## F.I.R.S.T. principles

Good tests are often described with the F.I.R.S.T. checklist.

| Principle | What it means | Why it matters |
| --- | --- | --- |
| Fast | A test completes quickly. | Slow tests get skipped, so defects go unnoticed. |
| Independent | A test does not rely on another test running first or leaving data behind. | Tests can run in any order and are easier to debug. |
| Repeatable | The same test gives the same result across runs and machines. | A test should not depend on the internet, current time, or yesterday's state. |
| Self-validating | The result is plainly pass or fail. | People should not have to interpret a long log to know what happened. |
| Timely | Tests are written around the same time as the code. | The expected behavior is clear while the design is still fresh. |

## Choose the behavior you need to verify

There are several useful approaches. They can be mixed in one test suite.

### Check the result: state-based testing

Run the unit and check what it returned or what state changed. For example, call an addition function and compare its result with the expected sum. This is usually the simplest starting point.

### Check what happened: behavior-based testing

Verify that the unit called a dependency in the expected way. For example, check that an email sender was called once with the intended address. This often uses a spy or mock.

### Test boundaries and edge cases

Try inputs where mistakes are easy to hide: an empty list, zero, a negative number, a missing value, or the largest permitted value.

### Test a table of examples

When many inputs follow the same rule, provide a table of input and expected output pairs instead of writing nearly identical tests one by one.

### Turn a discovered bug into a regression test

First write a test that reproduces the bug and fails. Then fix the code. The test helps catch the same bug if it returns later.

### Check a general rule

Property-based testing checks a rule over many generated examples. For example, sorting a list twice should give the same result as sorting it once.

## State or behavior?

State verification inspects the final result. Behavior verification inspects interactions with dependencies. Prefer checking results when that expresses the requirement clearly; use interaction checks when the interaction itself is important.

> **Practice:** for a password validator, list one ordinary input, one boundary input, and one rule that should hold for many inputs.
