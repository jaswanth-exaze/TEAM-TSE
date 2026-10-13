# SQL Visual Learning Lab

A browser-based SQL practice page. The editor, sample database, query results, challenge checks, and visual query stages run in the learner's browser. No account or backend is used.

## Run locally

Start the single project server from the repository root:

```bash
npm ci
npm run dev
```

Open `/courses/sql-visual-lab/` on the Vite URL. The course app and main site use the same server.

The SQL.js and node-sql-parser files are pinned local copies in `vendor/`; the worker runs the SQL engine and parser. CodeMirror loads from its pinned CDN and falls back to a plain textarea if unavailable. SQL data stays in memory and is never uploaded.

The guided subquery examples cover `IN`, correlated averages, `EXISTS`, and `NOT EXISTS`. Running one opens its visual walkthrough, including returned value sets or per-row inner-query matches.

## How it works view

Running a query opens a walkthrough that starts at stage 1 and follows the data to the final result:

- **Query overview**: your SQL colour-coded by clause (click a colour to jump to that stage), a "You write / SQL runs" strip showing the real execution order, and a numbered plain-English story of the query.
- **Stage pipeline**: one chip per stage with its row count and a mini bar, so you can see rows shrink, group or grow.
- **Stage detail**: plain-words explanation, the exact part of your SQL for that stage, a rows-in / rows-out meter with a one-line takeaway, then the stage visual (row-by-row WHERE checks, groups, joins, subqueries and so on).

Each engine step carries a `plain` sentence (see `engine.js`); add one when you add a new step type. Clause colours live in `styles.css` as `.clause--*`.

## Check the lab

From the repository root, run `npm run test:sql-visual-lab`.

## Add a challenge

Add an object with a unique ID, title, difficulty, learner-facing description, hint, expected result, and solution to `challenges.json`.