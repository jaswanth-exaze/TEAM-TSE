# Courses and practice

The React course library, quizzes, course material, and browser-based labs live in this app. The course and quiz routes use one shared navigation and theme. The Git, SQL, and Linux labs use focused practice controls while sharing the Learning Hub navigation and visual language.

All progress and quiz answers are stored in the browser. There is no backend.

## Run locally

Run these commands from the repository root so the entire site starts on one Node server:

```bash
npm ci
npm run dev
```

Open `/courses/` for the library, `/courses/git-lab/` for local Git foundations, branches, and merge practice, `/courses/sql-visual-lab/` for SQL practice, or `/courses/linux-lab/` for Linux practice on the URL printed by Vite.

## Build

From the repository root:

```bash
npm run build
npm run preview
```

The complete site is built to the root `dist/` directory.

## Questions and course material

Quiz question banks live in `src/data/quizzes/<module-id>.js`. Supported question types include multiple choice, multi-select, text, true/false, and code output. Course material lives under `src/data/courses/`; module and syllabus metadata live in `src/data/modules.js` and `src/data/course-catalog.js`.

The MySQL course has lesson units, mini challenges, and cumulative practice exams. The Git interactive simulator is linked from the Git course and course card. Quizzes remain available at `/quiz/:moduleId` inside the course app.

## Labs

The Git Interactive Lab source is in `git-lab/`; the SQL Visual Learning Lab source is in `sql-visual-lab/`; the Linux Practice Lab is in `linux-lab/`. All three are served by the same Vite process as the Hub and course app. Existing SQL and Linux checks are in `tests/` and can be run from the repository root with `npm run test:sql-visual-lab` and `npm run test:linux-lab`.

