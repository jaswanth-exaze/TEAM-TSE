# In-Memory Databases

## A temporary database for a test

Some code needs a database. Starting a real database for every quick unit test can be slow and inconvenient, so teams sometimes use a lightweight database that exists only in memory while the test runs and disappears afterward.

It is like rehearsing a presentation in front of a mirror: practice is fast and low-stakes, but the mirror cannot ask the questions a real audience would.

## Where it helps

- It avoids starting or connecting to a database server.
- Tests can write data and read it back, which is more realistic than a stub for some behaviors.
- It works offline and can run in an automated pipeline.

## Where it can mislead

- The temporary database may not enforce the same rules as production, such as uniqueness or valid references.
- Its supported queries may differ from the real database. A test can pass in memory and still fail in production.
- Teams may stop testing against the real database because the in-memory version feels close enough.

| In-memory database | Real database |
| --- | --- |
| Quick setup and fast feedback | Confirms behavior against production-like rules |
| Useful for many data-flow checks | Catches provider-specific constraints and query differences |
| Can create false confidence if used alone | Usually slower and needs more setup |

## Rule of thumb

Use an in-memory database as a shortcut for quick checks, not as a complete replacement for testing against the real database at least some of the time.
