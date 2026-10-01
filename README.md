# TSE Learning Hub

A collaborative website for Trainee Software Engineers (TSE) to introduce
themselves, track their learning, and practice real Git/GitHub workflows —
built as a static site.

The interactive React course app lives in `courses/` and is built separately for deployment. It contains course material, practice exams, and module quizzes.
The MySQL area also includes a standalone, browser-based SQL Visual Learning Lab at `courses/public/sql-visual-lab/`.

## What this is

Every profile on the [Team](team.html) page is a real HTML/CSS page that
member built and PR'd in themselves, reviewed by a teammate, and merged
into `main`. There are no demo members and no shared "profile card"
template controlling everyone's layout — each person's page is their own
HTML and CSS, which is the point: it's a low-stakes place to practice and
show front-end skills on something real. The Team page itself is just a
lightweight directory that links out to each person's page.

## Project structure

```
tse-learning-hub/
├── index.html                         Home page
├── about.html                          About page
├── team.html                           Team directory (renders from team/members/)
├── css/                                Site-wide home/about/team styling
├── js/                                 Shared behavior and team directory renderer
├── assets/                             Shared images and icons
├── team/members/                       Member profile pages and directory data
├── courses/                            Course library, practice exams, and quizzes
│   ├── src/data/courses/               Course lessons and activities
│   ├── src/data/quizzes/               Actual quiz question banks
│   └── public/sql-visual-lab/          Browser-based SQL learning tool
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

### How the directory works

`team.html` doesn't hardcode anyone's info. On load, `js/team.js`:

1. Reads `team/members/index.json` for the list of member folder names.
2. Fetches each member's own `index.html`.
3. Reads four `<meta name="tse:*">` tags out of that page's `<head>`
   (name, role, tagline, GitHub link) to build a small card.
4. Links the card to that member's real page.

Everything below the `<head>` of a member's page — every element, class,
and style — is entirely up to them.

## Running locally

This is a static site with no build step, but the Team page fetches
files, which most browsers block over `file://`. Serve the folder
instead:

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server works — Python's is just built in on most machines.

To run the courses locally, open a second terminal and run:

```bash
cd courses
npm ci
npm run dev
```

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` publishes the static site
and builds the course app into `/courses/` whenever changes are pushed to `main`. In the
repository's **Settings > Pages**, set **Build and deployment > Source** to
**GitHub Actions**. The published project site is available at
<https://jaswanth-exaze.github.io/TEAM-TSE/>. The course app uses a relative
asset base and hash-based routes so it also works under the repository path.

## How to contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full fork → branch → PR →
review → merge workflow, including how to add your own profile page.

## Roadmap

V1 ships Home, About, and a Team directory pointing at empty, member-owned
HTML/CSS pages. Later versions are expected to let each member add
courses, daily progress logs, goals, and projects to their own page —
in whatever markup they choose, since there's no shared schema to
outgrow.
