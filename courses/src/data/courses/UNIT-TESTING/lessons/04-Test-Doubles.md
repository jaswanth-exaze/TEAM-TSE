# Mocks, Stubs, Fakes, Spies, and Dummies

## Why replace a dependency?

The unit may depend on something slow, unreliable, expensive, or not yet built: a payment provider, database, clock, or third-party website. A test double is a controlled stand-in that lets the test focus on the unit's behavior.

Think of a stunt double: the stand-in performs a scene so the lead actor does not have to. In a test, the stand-in prevents a call to a real payment system, network, or clock.

## Five common test doubles

| Double | What it does | A useful way to remember it |
| --- | --- | --- |
| Dummy | Fills a required parameter but is not used. | A placeholder. |
| Stub | Returns a fixed, prepared answer. | A canned response. |
| Fake | Implements a simplified but working version. | A lightweight substitute. |
| Spy | Records how it was called so the test can inspect it later. | A stub that remembers. |
| Mock | Has expectations set in advance and fails if they are not met. | An interaction check. |

Teams use test doubles to keep tests fast and predictable and to avoid real networks, databases, clocks, or external services.

## A payment example

Suppose a test checks how an application reacts when a card payment succeeds or fails. It should not charge a real card every time the test runs. A controlled payment stand-in can return either outcome so the test checks the application's response safely.

## Mock with care

- Too many mocks can make a test pass while the real system is broken. The test may have proved only that the fake behaves as expected.
- If one small behavior requires a dozen mocks, the code may be doing too many things and need clearer boundaries.
- Test the result when the result expresses the requirement. Check interactions when the interaction itself matters.

> A test double is a tool for isolation, not proof that the real dependency works. Keep some tests that exercise important real integrations.
