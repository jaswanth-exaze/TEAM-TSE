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

## Check the lab

From the repository root, run `npm run test:sql-visual-lab`.

## Add a challenge

Add an object with a unique ID, title, difficulty, learner-facing description, hint, expected result, and solution to `challenges.json`.

