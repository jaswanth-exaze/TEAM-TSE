# TDD and the Three Laws

## Test-driven development

Test-driven development (TDD) is a way of working, not just a way to test code. Write a test for a behavior before writing the production code for that behavior. Then take small steps, using each test result to guide the next one.

Kent Beck helped popularize TDD in the late 1990s and described the practice in *Test-Driven Development: By Example*. The goal is to reduce fear around change by keeping clear, recent feedback about what works.

## The Three Laws of TDD

Robert C. Martin (“Uncle Bob”) described these rules in “The Cycles of TDD”:

1. Do not write real code until a test has been written that fails.
2. Do not write more of the test than is needed to make it fail.
3. Do not write more production code than is needed to make that test pass.

In plain terms: write a small failing test, add only enough code to pass it, and repeat. The laws encourage short feedback loops instead of writing a large feature before checking it.

## What the laws encourage

- Make one behavior explicit at a time.
- Confirm that the test can detect the missing behavior.
- Keep the implementation step small.
- Let design decisions emerge from repeated feedback.

The laws are a disciplined way to practise TDD. The larger aim is useful, trustworthy tests and clear code—not following a ritual without thinking.
