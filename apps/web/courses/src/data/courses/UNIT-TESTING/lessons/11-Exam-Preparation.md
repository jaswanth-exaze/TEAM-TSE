# Exam Preparation: Questions and Answers

Try each question from memory before opening the answer. Use missed questions to choose which lesson to review.

## 1. What is a unit test, and how does it differ from integration and end-to-end tests?

> **Answer:** A unit test checks one small piece of code, such as a function or method, on its own. An integration test checks that multiple pieces work together. An end-to-end test checks that the full system works from a real user's point of view. A suite usually has many fast unit tests, fewer integration tests, and only a few end-to-end tests.

## 2. Why do unit tests matter? Give at least three reasons.

> **Answer:** They reveal breakages quickly, make refactoring safer, describe expected behavior, encourage smaller and clearer code, and make bugs cheaper to fix by catching them early.

## 3. State the Three Laws of TDD.

> **Answer:** Do not write real code until a failing test exists. Do not write more of the test than is needed to make it fail. Do not write more production code than is needed to make that test pass.

## 4. What does F.I.R.S.T. stand for, and why does each part matter?

> **Answer:** Fast, Independent, Repeatable, Self-validating, and Timely. Fast tests keep feedback quick; independent tests can run in any order; repeatable tests give the same result across runs; self-validating tests clearly pass or fail; timely tests are written near the code they describe.

## 5. Name and describe three types of unit testing.

> **Answer:** Examples include checking the returned result (state-based), checking interactions (behavior-based), testing edge inputs, using a table of examples, writing regression tests for bugs, and checking general properties over many generated inputs.

## 6. What is the difference between checking a result and checking what happened?

> **Answer:** State verification checks the final value or state. Behavior verification checks whether dependencies were called as expected, including which methods, how many times, and with what values. The first is usually simpler; the second often uses mocks or spies.

## 7. What are the pros and cons of an in-memory database?

> **Answer:** It is fast, avoids a separate database server, and can exercise real data writes and reads. It may not enforce production rules or support identical queries, so a passing test can still hide a production database issue.

## 8. What are the five common test doubles?

> **Answer:** A dummy fills a parameter but is unused; a stub returns a fixed answer; a fake is a simplified working substitute; a spy records how it was used; a mock has preconfigured expectations and fails when they are not met.

## 9. What can go wrong if you mock too much?

> **Answer:** Tests can pass while the real system is broken because they only prove the doubles work. Needing many mocks for one unit can also indicate that the code has too many responsibilities.

## 10. What are the TDD steps?

> **Answer:** Red: write a small test and see it fail. Green: write the simplest code that makes it pass. Refactor: improve the code while keeping the test passing, then run the tests again.

## 11. How do inside-out and outside-in TDD differ?

> **Answer:** Inside-out begins with core logic and uses real internal components where practical. Outside-in begins with an outer behavior and often uses doubles for unfinished collaborators to shape their interactions. Neither is universally correct; teams can combine them.

## 12. What are honest criticisms of strict TDD, and when might a team not use it?

> **Answer:** It can take time to learn, may slow early exploration of an unclear idea or visual work, and excessive fakes can make tests fragile. A balanced approach uses TDD for understood logic and allows rough experiments when learning something new.

## 13. Name three common TDD mistakes.

> **Answer:** Testing implementation instead of behavior, skipping Refactor, trying to test too much at once, and chasing 100% coverage instead of meaningful checks are common mistakes.

## 14. Why are unit tests sometimes called living documentation?

> **Answer:** A clear test describes intended behavior and runs automatically. If behavior changes without updating the expectation, the test fails instead of silently becoming outdated like a comment can.

## 15. Why does TDD build a feature gradually?

> **Answer:** Each cycle handles one behavior, such as rejecting an empty password before rejecting a wrong one. The developer checks the behavior, makes it pass, and tidies it before moving on. The complete design grows from these small, verified steps.
