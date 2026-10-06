# Two Schools of TDD and When to Use Them

## Inside-out: classical or Detroit style

Start with core logic and build outward. Use real parts of your own code where reasonable, and replace dependencies that are truly outside your control, such as the network, clock, or external service. The design can take shape gradually.

## Outside-in: mockist or London style

Start at the outside—for example, what should happen when a user submits a form. Use doubles for lower-level pieces that do not exist yet. This helps design how components communicate and checks that the expected calls happen.

| Inside-out | Outside-in |
| --- | --- |
| Begins with core behavior | Begins with an outer user-visible behavior |
| Uses real internal components where practical | Uses more doubles for unfinished collaborators |
| Often verifies returned state | Often verifies expected interactions |

Neither style is the only correct approach. Teams often combine them, depending on the behavior and the boundaries involved.

## Benefits and honest tradeoffs

TDD can provide quick feedback, describe intended behavior, and encourage small, clear components. But strict test-first work can take time to learn. It may not fit early exploration of an unfamiliar idea or highly visual work. Too many doubles can also make tests fragile: they break when implementation details change even if real behavior remains the same.

## A sensible middle ground

Use TDD by default for logic the team understands well, such as calculations, business rules, and data validation. When exploring something unfamiliar, it can be reasonable to build a rough throwaway version first, learn from it, then write proper tests around the real solution.

> Choose the workflow that gives useful feedback about behavior. The goal is not to prove allegiance to one school.
