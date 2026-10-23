# TSE Learning Hub

A single Node/Vite app for the TSE home page, team directory, course library, quizzes, and practice labs. Course and quiz routes share one React interface; Git, SQL, and Linux labs use focused practice controls while sharing the Learning Hub navigation and visual language.

## Run locally

From the repository root:

```bash
npm ci
npm run dev
```

Open the URL printed by Vite (normally <http://localhost:5173/>). The same server serves `/courses/git-lab/` for interactive local Git, branching, and merge practice, along with:

- `/` — Home, About, and Team pages
- `/courses/` — course library, lessons, quizzes, and exams
- `/courses/sql-visual-lab/` — interactive SQL lab
- `/courses/linux-lab/` — Linux lab overview and practice terminal

There is one package manifest and one local server. No Python server or separate app terminal is needed.

## Build and preview

```bash
npm run build
npm run preview
```

The complete deployable site is written to `dist/`. GitHub Pages uses the same build output. Learning progress and quiz answers stay in the browser.

## Project structure

```text
apps/web/
  index.html, about.html, team.html     Static Hub pages
  css/, js/                             Hub styles and shared behavior
  team/members/                         Member-owned pages and directory data
  courses/
    index.html, src/                    Course and quiz app
    git-lab/                            Local Git and branching simulator
    sql-visual-lab/                     SQL practice lab source
    linux-lab/                          Linux practice lab source
    tests/                              SQL and Linux lab Node checks
scripts/
  copy-site.mjs                         Adds static pages and labs to dist/
package.json, package-lock.json         Shared dependencies and commands
vite.config.js                          One dev server and production build
```

The member profile pages remain independently authored HTML/CSS. The shared Hub pages, course app, and labs use a common palette and navigation.

## Common commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test:sql-visual-lab
npm run test:linux-lab
```

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` installs the root dependencies, builds `dist/`, verifies the expected pages and lab assets, and publishes that folder. In the repository's **Settings > Pages**, set **Build and deployment > Source** to **GitHub Actions**.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the fork, branch, pull request, review, and profile workflow.

