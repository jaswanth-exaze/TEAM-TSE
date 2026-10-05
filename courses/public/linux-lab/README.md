# TSE Linux Practice Lab

The lab is the interactive practice companion to the 15 topics in
`courses/src/data/linux-course.js`. It contains 15 topics with five questions
each, for 75 questions and 750 possible points. The overview lives at
`index.html`; guided questions and the open practice machine live at `lab.html`.

This is a static browser application. It simulates an Ubuntu style filesystem,
commands, users, permissions, processes, packages, services, archives, and fake
remote hosts. It does not run commands on the visitor's computer or connect to
real servers. Filesystem state is stored in `tse_linux_fs`; solved questions,
score, skips, hints, and the last location are stored in `tse_linux_progress`.

## Open the lab

Serve this folder from a static web server so browser modules and question data
can load. Inside the TEAM TSE repository, start the course app from `courses/`:

```bash
npm run dev
```

Then open **Linux Commands** in the Learning Hub and choose **Linux Practice
Lab**. The deployed course route is `/courses/linux-lab/`. For direct static
hosting, publish this folder as a directory and open its `index.html` through
the host's HTTP(S) URL.

## Questions and checks

All guided content is in `data/questions.json`. Each topic has a number, stable
ID, title, command examples, summary, and five questions. Every question has
three hints, a solution, command anatomy, and one or more checks. The validator
supports these check types:

- `output`: checks successful command output with `includes`, `equals`, or
  `startsWith`.
- `fs`: checks a simulated path, node type, permissions, or file contents.
- `state`: checks nested simulated system state such as users, packages,
  services, process history, or remote files.

Example question:

```json
{
  "id": "directory-structure-04",
  "topic": "directory-structure",
  "topicNumber": 1,
  "title": "Make a workspace",
  "goal": "Create a nested workspace in your home directory.",
  "task": "Create ~/projects/linux-practice/week-1.",
  "anatomy": [
    { "value": "mkdir", "explanation": "create a directory" },
    { "value": "-p", "explanation": "create missing parent folders" },
    { "value": "~/projects/linux-practice/week-1", "explanation": "the new path" }
  ],
  "hints": [
    "The destination belongs inside the user's project workspace.",
    "Some parent folders in the requested path may not exist yet.",
    "Confirm the entire destination path is available when setup is complete."
  ],
  "solution": "mkdir -p ~/projects/linux-practice/week-1",
  "checks": [
    {
      "type": "fs",
      "path": "/home/user/projects/linux-practice/week-1",
      "exists": true,
      "nodeType": "dir"
    }
  ],
  "points": 10
}
```

To add a question, add it to the correct topic's `questions` array and give it
a unique ID. Keep the topic ID and order aligned with `linux-course.js`, include
three hints, and choose checks that test the resulting simulated state instead
of requiring one exact command string. Reference answers should run in
`js/terminal.js`. Write the prompt as a realistic work request and keep hints
conceptual: they should guide the learner without naming the answer command or
showing its syntax. The command breakdown stays hidden until the question is
completed. The guided validator lives in `js/validator.js`.

## Verify the simulator

From `courses/`, run:

```bash
npm run test:linux-lab
```

The suite checks topic alignment, all 75 reference solutions on fresh and shared
machines, the supported command catalog, filesystem workflows, persistence,
remote simulation, and the lab page/controller contract.
