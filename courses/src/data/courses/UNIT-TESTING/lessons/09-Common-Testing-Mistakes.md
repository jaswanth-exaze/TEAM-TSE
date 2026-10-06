# Common Testing Mistakes

## Test behavior, not implementation details

If a test breaks every time code is reorganized—even when the user-visible behavior is unchanged—it is probably coupled too tightly to implementation details. Prefer assertions that express what the unit should do.

## Do not skip Refactor

Stopping as soon as the test passes misses an important part of TDD. Clean up the code while the test protects its behavior.

## Keep each test step small

If one test requires pages of production code before it can pass, divide the behavior into smaller steps. Short cycles are easier to understand and debug.

## Do not chase 100% coverage as the goal

High coverage can still come from weak or pointless tests—for example, checking that a variable stores the exact value just assigned to it. Coverage is a side effect of meaningful tests, not the target itself.

## Think of tests as living documentation

Well-named tests describe what the code should do. Unlike a comment, a test cannot quietly become stale: if behavior changes without updating the expectation, the test fails and asks the team to make the change explicit.

Martin Fowler describes TDD as a technique in which tests guide software development. The design grows through the repeated work of making behavior pass and then improving the code.

## Quick review

- Does the test name explain the behavior?
- Would it still pass if the implementation were reorganized but behavior stayed the same?
- Is the test checking something meaningful?
- Is the test small enough to understand when it fails?
