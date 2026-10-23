# Git Foundations Lab

A local-first Git workbench built around one idea: learners build a repository timeline by choosing changes, staging them, and saving commits. The simulator teaches version control from the beginning, then covers `git init`, `git status`, `git add`, `git diff`, `git commit`, `git log`, `git branch`, `git switch`, and `git merge` in a guided practice project.

The 14 steps are grouped into Setup, Save, Compare, and Branch and merge. Each task includes suggested actions and a check based on the repository's actual state. The workbench shows the working tree, staging area, local history, branch references, HEAD, and an interactive commit graph alongside a small file editor and simulated terminal.

The interface uses a compact learning path beside the repository workspace. It includes contextual command suggestions, explanations for failed commands, a collapsible action history, keyboard focus states, and a light/dark theme toggle.

Commands run against an isolated in-browser model. The learner's computer files are never read or changed, and no real shell is started. Repository state and mission progress are saved locally in the browser.

## Run locally

Start the project server from the repository root:

```bash
npm ci
npm run dev
```

Open `/courses/git-lab/` on the URL printed by Vite.

## Local state model

The simulator maintains a working copy, staging snapshot, branch references, and a local commit graph. The `git diff` view compares the working copy with staging; `git diff --staged` compares staging with the current branch tip. Branches point to commits, and merge commits retain both parents. The guided branch lesson creates a deliberate same-line conflict so the learner can resolve it in the editor. Commit identifiers are short teaching labels rather than Git object hashes.

All practice remains local to the browser. Remote repositories and collaboration workflows such as push, fetch, and pull are planned as a later learning stage.
