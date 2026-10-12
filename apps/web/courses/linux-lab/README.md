# TSE Linux Practice Lab

A browser-based practice companion to the Linux course. It includes 15 topics with five guided questions each, a simulated filesystem, and a practice terminal. Commands do not run on the learner's computer or connect to real servers. Progress is stored in the browser.

## Run locally

Start the single project server from the repository root:

```bash
npm ci
npm run dev
```

Open `/courses/linux-lab/` on the Vite URL. The overview links to the practice terminal; the course library and other Hub pages use this same server.

## Questions and checks

Question content is in `data/questions.json`; terminal behavior is in `js/terminal.js`; answer checks are in `js/validator.js`. Run `npm run test:linux-lab` from the repository root for the Node checks.

