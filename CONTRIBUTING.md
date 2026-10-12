# Contributing to TSE Learning Hub

Every change, including adding yourself to the Team page, goes through the same workflow. Working through it is part of the point.

## Workflow

Fork or clone the repository, create a branch, make your change, commit, push, and open a pull request for review. Merging to `main` deploys the site automatically.

## Run the project

Install dependencies and start the one local server from the repository root:

```bash
npm ci
npm run dev
```

## Add a team profile

Member pages are independently authored HTML/CSS pages under `apps/web/team/members/`.

1. Copy the profile template folder to `apps/web/team/members/<your-name>/`.
2. Add the `tse:name`, `tse:role`, `tse:tagline`, and `tse:github` meta tags in the page head.
3. Add the folder name to `apps/web/team/members/index.json`.
4. Check the Team page with `npm run dev`.

Keep the four meta tags accurate. Avoid changing another member's page or the shared directory renderer unless the change needs it.

## Commit and pull request

```bash
git add apps/web/team/members/<your-name> apps/web/team/members/index.json
git commit -m "Add <your-name> profile page"
git push origin feature/add-<your-name>-profile
```

Include a short description and how you checked the change in the pull request.

