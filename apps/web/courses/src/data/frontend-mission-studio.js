const htmlShell = (body) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Frontend mission</title>
  </head>
  <body>
${body}
  </body>
</html>`

export const FRONTEND_MISSIONS = [
  {
    id: 'semantic-canvas', track: 'HTML foundations', language: 'HTML', title: 'Give the page a real structure',
    goal: 'Replace the page wrapper with the landmark that tells browsers and assistive technology where the main content begins.',
    concept: 'Semantic HTML describes what content means. A main landmark gives the page one clear primary-content region.',
    why: 'Meaningful structure makes pages easier to navigate, maintain, and understand with assistive technology.',
    files: {
      html: htmlShell('    <div class="page-shell">\n      <header class="site-header"><strong>Northstar Studio</strong></header>\n      <div class="page-content">\n        <h1>Make the web clearer</h1>\n        <p>Accessible structure starts with the right elements.</p>\n      </div>\n      <footer>Built for people.</footer>\n    </div>'),
      css: 'body { margin: 0; font: 16px/1.5 system-ui, sans-serif; color: #172338; }\n.page-shell { min-height: 100vh; display: grid; grid-template-rows: auto 1fr auto; }\n.site-header, footer { padding: 18px 24px; background: #eef3f8; }\n.page-content { max-width: 720px; margin: auto; padding: 48px 24px; }\nh1 { font-size: clamp(2rem, 6vw, 4rem); }',
      js: '// No JavaScript is needed for this structural mission.',
    },
    checks: [{ file: 'html', label: 'The page has a main landmark', pattern: '<main\\b', flags: 'i' }],
    hints: ['The main landmark should wrap the page’s unique primary content.', 'Change the opening and closing page-content wrapper to <main class="page-content"> and </main>.'],
  },
  {
    id: 'article-story', track: 'HTML foundations', language: 'HTML', title: 'Turn a story into an article',
    goal: 'Mark this self-contained story with the element that communicates it can stand on its own.',
    concept: 'Use article for content that remains meaningful when shared or moved out of its surrounding page.',
    why: 'Choosing elements by meaning gives browsers a useful document outline and gives future developers clearer intent.',
    files: {
      html: htmlShell('    <main class="page-content">\n      <div class="story-card">\n        <p class="eyebrow">FIELD NOTES · 4 MIN READ</p>\n        <h1>Designing for the smallest screen</h1>\n        <p class="summary">A useful interface begins with the person holding the device.</p>\n        <a href="#read">Read the field note</a>\n      </div>\n    </main>'),
      css: 'body { margin: 0; padding: 36px; background: #f0f5f5; font: 16px/1.6 system-ui, sans-serif; color: #173533; }\n.story-card { max-width: 620px; margin: 30px auto; padding: 32px; border-radius: 20px; background: white; box-shadow: 0 16px 48px #17353318; }\n.eyebrow { color: #147568; font-size: 12px; font-weight: 800; letter-spacing: .13em; }\nh1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.08; }\na { color: #12685d; font-weight: 700; }',
      js: '// No JavaScript is needed for this semantic mission.',
    },
    checks: [{ file: 'html', label: 'The story uses an article element', pattern: '<article\\b', flags: 'i' }],
    hints: ['The article is the outer element for the complete field note.', 'Replace the story-card div with <article class="story-card"> and close it with </article>.'],
  },
  {
    id: 'accessible-links', track: 'HTML foundations', language: 'HTML', title: 'Make every destination explicit',
    goal: 'Give the link a real destination and the image useful alternative text.',
    concept: 'A link needs an href to behave as a link. An image alt describes its purpose when the image cannot be seen.',
    why: 'Clear links and alternatives make content usable with keyboards, screen readers, and blocked images.',
    files: {
      html: htmlShell('    <main class="product">\n      <img src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 240%27%3E%3Crect width=%27400%27 height=%27240%27 rx=%2724%27 fill=%27%23c9e8dc%27/%3E%3Ccircle cx=%27200%27 cy=%27120%27 r=%2762%27 fill=%27%232b8b69%27/%3E%3C/svg%3E" />\n      <div><p class="eyebrow">FIELD KIT / 04</p><h1>Trail bottle</h1><p>Made for long days outside.</p><a class="button">See product details</a></div>\n    </main>'),
      css: 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f7f5; font: 16px/1.55 system-ui, sans-serif; color: #17352c; }\n.product { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, .9fr); align-items: center; gap: 30px; max-width: 800px; margin: 24px; padding: 24px; border-radius: 24px; background: white; }\nimg { width: 100%; border-radius: 18px; }\n.eyebrow { color: #24795d; font-size: 12px; font-weight: 800; letter-spacing: .14em; }\n.button { display: inline-block; padding: 11px 15px; border-radius: 10px; background: #176e52; color: white; font-weight: 700; }\n@media (max-width: 600px) { .product { grid-template-columns: 1fr; } }',
      js: '// No JavaScript is needed for this accessibility mission.',
    },
    checks: [
      { file: 'html', label: 'The product link has an href', pattern: '<a\\b(?=[^>]*\\bhref\\s*=)[^>]*>', flags: 'i' },
      { file: 'html', label: 'The product image has alt text', pattern: '<img\\b(?=[^>]*\\balt\\s*=)[^>]*>', flags: 'i' },
    ],
    hints: ['Describe the product image briefly, for example alt="Green trail bottle".', 'Add href="#details" to the anchor and an alt attribute to the image.'],
  },
  {
    id: 'box-model', track: 'CSS layout', language: 'CSS', title: 'Fit the card to its measured width',
    goal: 'Make the 280-pixel card width include its padding and border, so it stays inside the layout grid.',
    concept: 'With content-box, padding and border add to the declared width. border-box includes them inside that width.',
    why: 'Predictable sizing makes responsive layouts easier to compose and prevents cards from unexpectedly overflowing.',
    files: {
      html: htmlShell('    <main class="stage">\n      <article class="profile-card"><span class="avatar">MP</span><p class="eyebrow">DESIGN SYSTEM</p><h1>Measured spacing</h1><p>This card must stay inside its 280-pixel layout track.</p><button>Inspect dimensions</button></article>\n      <div class="measure-label">280 px track</div>\n    </main>'),
      css: 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef3fb; font: 15px/1.5 system-ui, sans-serif; color: #1b2a43; }\n.stage { position: relative; width: 280px; min-height: 360px; display: grid; place-items: center; border: 1px dashed #7d90ae; background: #e1eafa; }\n.profile-card { width: 280px; padding: 24px; border: 1px solid #d6dfed; border-radius: 20px; background: white; box-shadow: 0 16px 40px #334a6b1a; }\n.avatar { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 14px; background: #d9e8ff; color: #315e9a; font-weight: 800; }\n.eyebrow { margin-top: 24px; color: #607490; font-size: 11px; font-weight: 800; letter-spacing: .12em; }\nh1 { font-size: 23px; }\nbutton { padding: 10px 13px; border: 0; border-radius: 9px; background: #315e9a; color: white; font-weight: 700; }\n.measure-label { position: absolute; right: -82px; top: 50%; color: #526782; font: 12px ui-monospace, monospace; }',
      js: '// This layout is controlled by CSS.',
    },
    checks: [{ file: 'css', label: 'The card uses border-box sizing', pattern: 'box-sizing\\s*:\\s*border-box', flags: 'i' }],
    hints: ['The box-sizing property changes what the width value measures.', 'Add box-sizing: border-box to .profile-card or to a universal selector.'],
  },
  {
    id: 'flexbox-rescue', track: 'CSS layout', language: 'CSS', title: 'Send the crew to the launch zone',
    goal: 'Move the crew to the far edge of the stage and center them on the cross axis. Watch the target ring.',
    concept: 'justify-content places items along the main axis. align-items places them along the cross axis.',
    why: 'Flexbox is a reliable way to align a row or column when content size can change.',
    files: {
      html: htmlShell('    <main class="mission-card"><p class="eyebrow">MISSION 05 / FLEXBOX RESCUE</p><h1>Launch sequence</h1><p class="instruction">Move the crew into the target ring at the right side, vertically centered.</p><section class="layout-stage" aria-label="Flexbox alignment board"><div class="crew"><span>🐸</span><span>🐸</span><span>🐸</span></div><div class="target"><span>LANDING ZONE</span></div></section><p class="board-caption">MAIN AXIS <b>→</b> &nbsp; CROSS AXIS <b>↓</b></p></main>'),
      css: 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 20px; box-sizing: border-box; background: #ecf6ed; color: #18382c; font: 15px/1.5 system-ui, sans-serif; }\n.mission-card { width: min(100%, 520px); padding: 24px; border: 1px solid #d6e7d8; border-radius: 22px; background: white; box-shadow: 0 18px 50px #284b3215; }\n.eyebrow { color: #2b8058; font-size: 11px; font-weight: 850; letter-spacing: .13em; }\nh1 { margin: 8px 0; font-size: 32px; }\n.instruction { color: #567262; }\n.layout-stage { position: relative; display: flex; justify-content: flex-start; align-items: flex-start; gap: 9px; min-height: 220px; margin-top: 22px; padding: 18px; overflow: hidden; border: 1px solid #d8e9d8; border-radius: 16px; background: repeating-linear-gradient(0deg, transparent 0 39px, #dceade 40px), repeating-linear-gradient(90deg, transparent 0 39px, #dceade 40px), #f7fcf5; }\n.crew { display: flex; gap: 8px; }\n.crew span { display: grid; width: 46px; height: 46px; place-items: center; border: 1px solid #d5e9ce; border-radius: 14px; background: #e3f5d9; font-size: 26px; }\n.target { position: absolute; right: 18px; top: 50%; display: grid; width: 92px; height: 92px; place-items: center; border: 2px dashed #42a56e; border-radius: 50%; background: #ddf5e45c; transform: translateY(-50%); }\n.target span { color: #287b50; font-size: 8px; font-weight: 850; letter-spacing: .08em; text-align: center; }\n.board-caption { color: #668271; font: 11px ui-monospace, monospace; }\n.board-caption b { color: #2f9a64; }',
      js: '// This alignment challenge is powered by CSS Flexbox.',
    },
    checks: [
      { file: 'css', label: 'The crew reaches the end of the main axis', pattern: 'justify-content\\s*:\\s*flex-end', flags: 'i' },
      { file: 'css', label: 'The crew is centered on the cross axis', pattern: 'align-items\\s*:\\s*center', flags: 'i' },
    ],
    hints: ['The stage uses flex-direction: row by default, so its main axis runs left to right.', 'Set justify-content: flex-end and align-items: center on .layout-stage.'],
  },
  {
    id: 'flex-wrap', track: 'CSS layout', language: 'CSS', title: 'Keep the dashboard cards flowing',
    goal: 'Let these cards move onto another row when the viewport narrows, while keeping a consistent gap.',
    concept: 'flex-wrap lets flex items continue on a new line when there is not enough room.',
    why: 'Wrapping adapts a row of content without forcing cards to shrink until they become unreadable.',
    files: {
      html: htmlShell('    <main class="dashboard"><p class="eyebrow">PEOPLE OPERATIONS</p><h1>Team overview</h1><section class="metric-row"><article><span>OPEN ROLES</span><b>08</b><small>Across 3 departments</small></article><article><span>ONBOARDING</span><b>12</b><small>Starting this month</small></article><article><span>TEAM HEALTH</span><b>94%</b><small>Updated today</small></article><article><span>LOCATIONS</span><b>04</b><small>Across 2 regions</small></article></section></main>'),
      css: 'body { margin: 0; min-height: 100vh; background: #f3f5fa; color: #1c2941; font: 15px/1.45 system-ui, sans-serif; }\n.dashboard { max-width: 860px; margin: 0 auto; padding: 32px 22px; }\n.eyebrow { color: #62728c; font-size: 11px; font-weight: 850; letter-spacing: .14em; }\nh1 { margin: 6px 0 22px; font-size: 32px; }\n.metric-row { display: flex; flex-wrap: nowrap; gap: 14px; }\n.metric-row article { flex: 1 1 175px; min-width: 155px; display: grid; gap: 10px; padding: 18px; border: 1px solid #dbe2ed; border-radius: 16px; background: white; box-shadow: 0 8px 22px #263d5b0b; }\n.metric-row span, .metric-row small { color: #667792; font-size: 11px; }\n.metric-row b { color: #234e87; font-size: 30px; }',
      js: '// The cards adapt through CSS, without JavaScript.',
    },
    checks: [
      { file: 'css', label: 'Flex items are allowed to wrap', pattern: 'flex-wrap\\s*:\\s*wrap', flags: 'i' },
      { file: 'css', label: 'A consistent gap separates the cards', pattern: 'gap\\s*:\\s*[^;]+', flags: 'i' },
    ],
    hints: ['The current nowrap value forces every metric card to remain on one line.', 'Change flex-wrap to wrap on .metric-row, then keep or add a gap.'],
  },
  {
    id: 'grid-tracks', track: 'CSS layout', language: 'CSS', title: 'Build three clear grid tracks',
    goal: 'Arrange these six feature tiles into three equal columns and two rows.',
    concept: 'CSS Grid defines rows and columns as tracks. repeat() describes a repeated track pattern concisely.',
    why: 'Grid gives page sections a shared two-dimensional structure that stays aligned as content changes.',
    files: {
      html: htmlShell('    <main class="workspace"><p class="eyebrow">NORTHSTAR / WORKSPACE</p><h1>Project overview</h1><section class="feature-grid"><article><span>01</span><b>Roadmap</b><small>Plan upcoming work</small></article><article><span>02</span><b>Design system</b><small>Shared interface patterns</small></article><article><span>03</span><b>Research</b><small>Notes from the field</small></article><article><span>04</span><b>Engineering</b><small>Build and ship together</small></article><article><span>05</span><b>Analytics</b><small>Understand what changes</small></article><article><span>06</span><b>Team</b><small>People and ownership</small></article></section></main>'),
      css: 'body { margin: 0; min-height: 100vh; background: #f4f6fb; color: #1d2941; font: 15px/1.45 system-ui, sans-serif; }\n.workspace { max-width: 780px; margin: 0 auto; padding: 28px 22px; }\n.eyebrow { color: #6d5ba1; font-size: 11px; font-weight: 850; letter-spacing: .15em; }\nh1 { margin: 7px 0 20px; font-size: 32px; }\n.feature-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }\n.feature-grid article { min-height: 110px; display: grid; align-content: space-between; padding: 16px; border: 1px solid #e0e3ef; border-radius: 15px; background: white; box-shadow: 0 8px 22px #30345b0b; }\n.feature-grid span, .feature-grid small { color: #77839a; font-size: 11px; }\n.feature-grid b { color: #4e3a7e; font-size: 17px; }',
      js: '// This layout challenge is powered by CSS Grid.',
    },
    checks: [
      { file: 'css', label: 'The feature board uses CSS Grid', pattern: 'display\\s*:\\s*grid', flags: 'i' },
      { file: 'css', label: 'The board defines three repeated columns', pattern: 'grid-template-columns\\s*:\\s*repeat\\(\\s*3', flags: 'i' },
    ],
    hints: ['The grid has six cards, which fit naturally into three columns and two rows.', 'Set grid-template-columns: repeat(3, 1fr) on .feature-grid.'],
  },
  {
    id: 'grid-areas', track: 'CSS layout', language: 'CSS', title: 'Name the page regions',
    goal: 'Use named grid areas to place the header, navigation, article, and aside into the page map.',
    concept: 'grid-template-areas gives a grid a readable named map; grid-area assigns each child to a named region.',
    why: 'Named areas make complex page layouts easier to scan and adapt at different screen sizes.',
    files: {
      html: htmlShell('    <main class="page-map"><header>Northstar journal</header><nav>Stories<br>Topics<br>About</nav><article><p class="eyebrow">LATEST STORY</p><h1>Good systems make room for good work.</h1><p>Thoughtful tools help teams focus on the people they serve.</p></article><aside>Related reading<br><br>Design principles<br>Team notes</aside></main>'),
      css: 'body { margin: 0; min-height: 100vh; background: #f4f5f7; color: #1e2b40; font: 15px/1.55 system-ui, sans-serif; }\n.page-map { display: grid; grid-template-columns: 190px 1fr 180px; grid-template-areas: "header header header" "nav article aside"; gap: 14px; max-width: 960px; margin: 0 auto; padding: 20px; }\nheader, nav, article, aside { padding: 20px; border: 1px solid #dfe3ea; border-radius: 15px; background: white; }\nheader { grid-area: auto; font-size: 21px; font-weight: 800; }\nnav { grid-area: auto; color: #586a84; line-height: 2.2; }\narticle { grid-area: auto; min-height: 260px; }\naside { grid-area: auto; color: #586a84; }\n.eyebrow { color: #6c5b9d; font-size: 11px; font-weight: 850; letter-spacing: .14em; }\nh1 { font-size: clamp(25px, 4vw, 40px); line-height: 1.1; }',
      js: '// This page map is defined by CSS Grid.',
    },
    checks: [
      { file: 'css', label: 'The page defines named grid areas', pattern: 'grid-template-areas\\s*:', flags: 'i' },
      { file: 'css', label: 'The article is assigned to its named area', pattern: 'grid-area\\s*:\\s*article', flags: 'i' },
    ],
    hints: ['The grid map is already written; each region still needs to claim its name.', 'Replace each grid-area: auto with header, nav, article, and aside respectively.'],
  },
  {
    id: 'responsive-layout', track: 'CSS layout', language: 'CSS', title: 'Make the layout fit a phone',
    goal: 'At narrow viewport widths, turn the two-column story layout into one readable column.',
    concept: 'A media query applies styles when the viewport meets a condition, such as a maximum width.',
    why: 'Responsive design lets the same content work across phones, tablets, laptops, and zoomed views.',
    files: {
      html: htmlShell('    <main class="article-layout"><aside class="toc"><b>ON THIS PAGE</b><a href="#idea">The idea</a><a href="#details">Details</a><a href="#next">Next steps</a></aside><article><p class="eyebrow">DESIGN SYSTEMS / 8 MIN READ</p><h1>Interfaces that make sense at every size</h1><p class="lead">A responsive interface keeps its purpose while its layout changes.</p><section id="idea"><h2>Start with content</h2><p>Choose widths that give each line room to breathe. Let columns become rows when the viewport no longer has space.</p></section><section id="details"><h2>Let the layout adapt</h2><p>Use flexible tracks and deliberate breakpoints to keep reading comfortable.</p></section></article></main>'),
      css: 'body { margin: 0; background: #f4f6fa; color: #1c2940; font: 16px/1.7 system-ui, sans-serif; }\n.article-layout { display: grid; grid-template-columns: 230px minmax(0, 1fr); gap: 44px; max-width: 940px; margin: 0 auto; padding: 32px 24px; }\n.toc { position: sticky; top: 20px; align-self: start; display: grid; gap: 13px; padding: 18px; border: 1px solid #dce3ee; border-radius: 15px; background: white; color: #526780; font-size: 13px; }\n.toc b, .eyebrow { color: #376d89; font-size: 11px; font-weight: 850; letter-spacing: .13em; }\na { color: inherit; text-decoration: none; }\narticle { padding: 18px 24px; border-radius: 18px; background: white; }\nh1 { font-size: clamp(32px, 5vw, 54px); line-height: 1.08; }\nh2 { margin-top: 34px; }\n.lead { color: #526780; font-size: 19px; }',
      js: '// The responsive change is controlled by a CSS media query.',
    },
    checks: [
      { file: 'css', label: 'A narrow-screen media query exists', pattern: '@media[\\s\\S]*max-width\\s*:', flags: 'i' },
      { file: 'css', label: 'The article switches to one column', pattern: '@media[\\s\\S]*grid-template-columns\\s*:\\s*1fr', flags: 'i' },
    ],
    hints: ['The media query belongs after the default layout rules.', 'Add @media (max-width: 640px) { .article-layout { grid-template-columns: 1fr; } } and inspect the phone preview.'],
  },
  {
    id: 'event-counter', track: 'JavaScript in the browser', language: 'JavaScript', title: 'Wire the button to a real event',
    goal: 'When the button is clicked, increase the counter and update the visible number.',
    concept: 'An event listener connects a browser event to a function that responds to it.',
    why: 'Events are how interfaces respond to clicks, typing, keyboard input, and many other user actions.',
    files: {
      html: htmlShell('    <main class="counter-card"><p class="eyebrow">INTERACTION / 01</p><h1>Focus sessions</h1><p>Completed sessions</p><output id="count" aria-live="polite">0</output><button id="add-session" type="button">Complete a session <span aria-hidden="true">+</span></button><p class="hint">Click the button to record your progress.</p></main>'),
      css: 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 18px; background: #f2f1fa; color: #292442; font: 15px/1.5 system-ui, sans-serif; }\n.counter-card { width: min(100%, 360px); display: grid; justify-items: start; padding: 28px; border: 1px solid #e2dff0; border-radius: 22px; background: white; box-shadow: 0 20px 50px #30225b14; }\n.eyebrow { color: #7355a8; font-size: 11px; font-weight: 850; letter-spacing: .14em; }\nh1 { margin: 8px 0; font-size: 30px; }\noutput { margin: 0 0 20px; color: #563a91; font-size: 54px; font-weight: 800; }\nbutton { padding: 12px 16px; border: 0; border-radius: 11px; background: #684ca2; color: white; font-weight: 750; cursor: pointer; }\n.hint { color: #718096; font-size: 12px; }',
      js: 'let sessions = 0;\nconst count = document.querySelector("#count");\nconst button = document.querySelector("#add-session");\n\n// Add a click event listener that increments sessions\n// and updates the count output.',
    },
    checks: [
      { file: 'js', label: 'The button listens for a click', pattern: 'addEventListener\\s*\\(\\s*[\'"]click', flags: 'i' },
      { file: 'js', label: 'The session value increases', pattern: 'sessions\\s*\\+\\+|sessions\\s*=\\s*sessions\\s*\\+\\s*1', flags: 'i' },
      { file: 'js', label: 'The displayed count is updated', pattern: 'textContent|innerText|\\.value', flags: 'i' },
    ],
    hints: ['Use button.addEventListener("click", () => { ... }).', 'Inside the callback, increment sessions and set count.textContent = sessions.'],
  },
  {
    id: 'functions-and-dom', track: 'JavaScript in the browser', language: 'JavaScript', title: 'Calculate, then update the page',
    goal: 'Use a named function to calculate the project total and show the result after a button click.',
    concept: 'Functions name a reusable action. The DOM API lets JavaScript read and update the current document.',
    why: 'Separating calculation from display logic makes behavior easier to reuse and explain.',
    files: {
      html: htmlShell('    <main class="estimate"><p class="eyebrow">PROJECT PLANNER</p><h1>Estimate the build</h1><label>Design hours <input id="design" type="number" value="8" min="0"></label><label>Build hours <input id="build" type="number" value="16" min="0"></label><button id="calculate" type="button">Calculate estimate</button><p class="result">Estimated effort <output id="total">—</output> hours</p></main>'),
      css: 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 20px; background: #f1f5f7; color: #203443; font: 15px/1.5 system-ui, sans-serif; }\n.estimate { width: min(100%, 420px); display: grid; gap: 12px; padding: 26px; border: 1px solid #dce5e8; border-radius: 20px; background: white; box-shadow: 0 18px 46px #1d47500f; }\n.eyebrow { color: #277a80; font-size: 11px; font-weight: 850; letter-spacing: .14em; }\nh1 { margin: 0; font-size: 29px; }\nlabel { display: grid; gap: 5px; color: #526575; font-size: 13px; }\ninput { padding: 10px; border: 1px solid #ccd8df; border-radius: 9px; font: inherit; }\nbutton { margin-top: 7px; padding: 12px; border: 0; border-radius: 10px; background: #176c75; color: white; font-weight: 750; cursor: pointer; }\n.result { padding: 12px; border-radius: 10px; background: #edf7f5; color: #365f61; }\noutput { color: #125e65; font-size: 22px; font-weight: 800; }',
      js: 'const designInput = document.querySelector("#design");\nconst buildInput = document.querySelector("#build");\nconst totalOutput = document.querySelector("#total");\nconst calculateButton = document.querySelector("#calculate");\n\n// Create calculateEffort(designHours, buildHours).\n// On click, call it with the input values and show the total.',
    },
    checks: [
      { file: 'js', label: 'The calculation is kept in a function', pattern: 'function\\s+calculateEffort|const\\s+calculateEffort\\s*=', flags: 'i' },
      { file: 'js', label: 'The calculation reads both inputs', pattern: 'designInput\\.value[\\s\\S]*buildInput\\.value|buildInput\\.value[\\s\\S]*designInput\\.value', flags: 'i' },
      { file: 'js', label: 'The estimate is written to the page', pattern: 'totalOutput\\.textContent|totalOutput\\.innerText', flags: 'i' },
      { file: 'js', label: 'The calculate button is connected', pattern: 'calculateButton\\.addEventListener', flags: 'i' },
    ],
    hints: ['Convert number inputs with Number(input.value) before adding them.', 'Inside the click handler, assign the function result to totalOutput.textContent.'],
  },
  {
    id: 'render-collection', track: 'JavaScript in the browser', language: 'JavaScript', title: 'Render a collection from data',
    goal: 'Turn each project in the array into a visible list item when the learner selects Show projects.',
    concept: 'Arrays keep related values together. map() transforms each value into a new value, such as a piece of markup.',
    why: 'Rendering from data avoids hand-writing repeated UI and keeps the content in one clear source.',
    files: {
      html: htmlShell('    <main class="portfolio"><p class="eyebrow">MADE WITH CARE</p><h1>Selected projects</h1><p>A small collection of recent work.</p><button id="show-projects" type="button">Show projects</button><ul id="project-list" aria-live="polite"><li class="empty">Your projects will appear here.</li></ul></main>'),
      css: 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 20px; background: #f8f4ed; color: #392e25; font: 15px/1.5 system-ui, sans-serif; }\n.portfolio { width: min(100%, 480px); padding: 26px; border: 1px solid #e9dfd1; border-radius: 20px; background: white; box-shadow: 0 18px 46px #563a1c12; }\n.eyebrow { color: #a3602d; font-size: 11px; font-weight: 850; letter-spacing: .14em; }\nh1 { margin-bottom: 6px; font-size: 32px; }\nbutton { margin-top: 10px; padding: 11px 14px; border: 0; border-radius: 10px; background: #98592f; color: white; font-weight: 750; cursor: pointer; }\nul { display: grid; gap: 8px; padding: 0; list-style: none; }\nli { padding: 12px 14px; border: 1px solid #eee4d8; border-radius: 10px; background: #fffaf4; font-weight: 650; }\n.empty { color: #8c8174; font-weight: 450; }',
      js: 'const projects = ["Accessible recipe finder", "Community garden map", "Quiet focus timer"];\nconst projectList = document.querySelector("#project-list");\nconst showProjects = document.querySelector("#show-projects");\n\n// Transform each project into one list item,\n// then render the items into projectList on click.',
    },
    checks: [
      { file: 'js', label: 'The collection is transformed with map()', pattern: '\\.map\\s*\\(', flags: 'i' },
      { file: 'js', label: 'The generated items are rendered into the list', pattern: 'projectList\\.(?:innerHTML|insertAdjacentHTML|append|replaceChildren)', flags: 'i' },
      { file: 'js', label: 'The render action responds to a click', pattern: 'showProjects\\.addEventListener', flags: 'i' },
    ],
    hints: ['Map each project to a string such as `<li>${project}</li>`.', 'Join the array and assign it to projectList.innerHTML inside the click handler.'],
  },
  {
    id: 'form-validation', track: 'JavaScript in the browser', language: 'JavaScript', title: 'Validate before accepting a form',
    goal: 'Stop the browser’s default submit, trim the name, and show a helpful message when the value is empty.',
    concept: 'Form submit events are a good place to validate input. trim() removes whitespace from both ends of text.',
    why: 'Friendly validation prevents avoidable errors and tells people what to do next.',
    files: {
      html: htmlShell('    <main class="invite-card"><p class="eyebrow">TEAM WORKSPACE</p><h1>Request an invitation</h1><p>Tell us what to call you and we will prepare your workspace.</p><form id="invite-form" novalidate><label for="name">Your name</label><input id="name" name="name" autocomplete="name" placeholder="Taylor Morgan"><button type="submit">Request invitation</button><p id="message" aria-live="polite">Your confirmation will appear here.</p></form></main>'),
      css: 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 20px; background: #eef6f5; color: #1c3836; font: 15px/1.55 system-ui, sans-serif; }\n.invite-card { width: min(100%, 430px); padding: 26px; border: 1px solid #d7e8e5; border-radius: 20px; background: white; box-shadow: 0 18px 46px #204b4512; }\n.eyebrow { color: #247b72; font-size: 11px; font-weight: 850; letter-spacing: .14em; }\nh1 { margin: 7px 0; font-size: 30px; }\nform { display: grid; gap: 10px; margin-top: 20px; }\nlabel { font-weight: 700; }\ninput { padding: 12px; border: 1px solid #bfd4d1; border-radius: 9px; font: inherit; }\nbutton { padding: 12px; border: 0; border-radius: 10px; background: #26776e; color: white; font-weight: 750; cursor: pointer; }\n#message { min-height: 22px; color: #536d69; font-size: 13px; }',
      js: 'const inviteForm = document.querySelector("#invite-form");\nconst nameInput = document.querySelector("#name");\nconst message = document.querySelector("#message");\n\n// Listen for submit. Prevent the page reload.\n// Reject a blank trimmed name; otherwise show a greeting.',
    },
    checks: [
      { file: 'js', label: 'The form handles its submit event', pattern: 'addEventListener\\s*\\(\\s*[\'"]submit', flags: 'i' },
      { file: 'js', label: 'The browser default is prevented', pattern: 'preventDefault\\s*\\(', flags: 'i' },
      { file: 'js', label: 'Whitespace is removed before validation', pattern: 'nameInput\\.value\\.trim\\s*\\(', flags: 'i' },
      { file: 'js', label: 'The result message is updated', pattern: 'message\\.textContent|message\\.innerText', flags: 'i' },
    ],
    hints: ['Use event.preventDefault() inside the submit handler.', 'Check `const name = nameInput.value.trim()`; show an error for an empty name and a greeting otherwise.'],
  },
  {
    id: 'async-dashboard', track: 'JavaScript in the browser', language: 'JavaScript', title: 'Load data without blocking the page',
    goal: 'Use async/await to load the local mock activity feed and render its messages after the button is pressed.',
    concept: 'A Promise represents work that completes later. await pauses this async function until the Promise settles.',
    why: 'Asynchronous code keeps interfaces responsive while data is being prepared or requested.',
    files: {
      html: htmlShell('    <main class="activity-card"><p class="eyebrow">TEAM ACTIVITY</p><h1>Latest updates</h1><p>Load a local sample feed and show the newest team activity.</p><button id="load-activity" type="button">Load activity</button><p id="status" aria-live="polite">Ready when you are.</p><ul id="activity-list"></ul></main>'),
      css: 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 20px; background: #f4f4fa; color: #29283e; font: 15px/1.5 system-ui, sans-serif; }\n.activity-card { width: min(100%, 470px); padding: 26px; border: 1px solid #e1e0ee; border-radius: 20px; background: white; box-shadow: 0 18px 46px #302d5812; }\n.eyebrow { color: #6553a0; font-size: 11px; font-weight: 850; letter-spacing: .14em; }\nh1 { margin: 7px 0; font-size: 30px; }\nbutton { margin: 8px 0; padding: 11px 14px; border: 0; border-radius: 10px; background: #61509a; color: white; font-weight: 750; cursor: pointer; }\n#status { color: #687188; font-size: 13px; }\nul { display: grid; gap: 8px; padding: 0; list-style: none; }\nli { padding: 12px; border-radius: 10px; background: #f5f3fa; color: #45405d; }',
      js: 'const activities = ["Mina published the new design tokens.", "The accessibility review is ready.", "Sam opened a pull request for the dashboard."];\nconst loadActivity = document.querySelector("#load-activity");\nconst activityList = document.querySelector("#activity-list");\nconst status = document.querySelector("#status");\n\nfunction loadMockActivity() {\n  return new Promise((resolve) => {\n    setTimeout(() => resolve(activities), 450);\n  });\n}\n\n// Create a named async loader for the mock feed.\n// Render the returned items and update the status.\n// Call the loader from the button click handler.',
    },
    checks: [
      { file: 'js', label: 'The data loader is asynchronous', pattern: 'async\\s+function\\s+loadActivityFeed|const\\s+loadActivityFeed\\s*=\\s*async', flags: 'i' },
      { file: 'js', label: 'The mock Promise is awaited', pattern: 'await\\s+loadMockActivity\\s*\\(', flags: 'i' },
      { file: 'js', label: 'The activity feed is rendered', pattern: 'activityList\\.(?:innerHTML|insertAdjacentHTML|append|replaceChildren)', flags: 'i' },
      { file: 'js', label: 'The button starts the load flow', pattern: 'loadActivity\\.addEventListener', flags: 'i' },
    ],
    hints: ['Make loadActivityFeed an async function and store the awaited result.', 'Render the resulting array, update status.textContent, and call the async function from the click listener.'],
  },
  {
    id: 'capstone-launch', track: 'Capstone', language: 'HTML + CSS + JS', title: 'Ship the launch page',
    goal: 'Complete a small product launch page: give it semantic structure, a responsive card grid, and a working save button.',
    concept: 'A real interface combines semantic markup, layout rules, and JavaScript behavior as one system.',
    why: 'The capstone brings browser fundamentals together and gives you a small, reviewable project to build on.',
    files: {
      html: htmlShell('    <div class="launch-page"><header class="topbar"><b>FIELDWORK</b><a href="#saved">Saved <span id="saved-count">0</span></a></header><div class="hero"><p class="eyebrow">A SMALLER FOOTPRINT</p><h1>Tools for thoughtful travel.</h1><p>Durable essentials designed to go further and stay useful.</p></div><div class="product-grid"><article class="product"><span class="product-art art-one">01</span><h2>Trail bottle</h2><p>Lightweight, repairable, ready to roam.</p><button class="save" data-product="Trail bottle">Save item</button></article><article class="product"><span class="product-art art-two">02</span><h2>Day pack</h2><p>Room for what matters, nothing more.</p><button class="save" data-product="Day pack">Save item</button></article><article class="product"><span class="product-art art-three">03</span><h2>Field journal</h2><p>A place to notice the small things.</p><button class="save" data-product="Field journal">Save item</button></article></div><p id="feedback" aria-live="polite">Choose an item to save it.</p></div>'),
      css: 'body { margin: 0; background: #f4f4ee; color: #25352c; font: 15px/1.5 system-ui, sans-serif; }\n.launch-page { max-width: 1000px; margin: 0 auto; padding: 20px clamp(16px, 4vw, 44px) 38px; }\n.topbar { display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #dfe3d8; font-size: 13px; }\na { color: inherit; }\n.hero { max-width: 620px; padding: 42px 0 28px; }\n.eyebrow { color: #6c7d52; font-size: 11px; font-weight: 850; letter-spacing: .15em; }\nh1 { max-width: 600px; margin: 8px 0; font-size: clamp(36px, 7vw, 68px); line-height: 1.02; letter-spacing: -.04em; }\n.hero > p:last-child { max-width: 470px; color: #657165; font-size: 17px; }\n.product-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }\n.product { padding: 13px; border: 1px solid #e0e4da; border-radius: 17px; background: white; }\n.product-art { display: grid; min-height: 145px; place-items: center; border-radius: 12px; font-size: 36px; font-weight: 850; }\n.art-one { background: #dce9d1; color: #608347; } .art-two { background: #e9e0d2; color: #98754a; } .art-three { background: #dbe8e8; color: #4d7e7e; }\n.product h2 { margin: 13px 0 3px; font-size: 17px; } .product p { min-height: 42px; color: #667267; font-size: 13px; }\nbutton { padding: 9px 12px; border: 1px solid #cad4c5; border-radius: 9px; background: #f7f9f4; color: #34553a; font-weight: 750; cursor: pointer; }\nbutton.saved { background: #345d42; color: white; }\n#feedback { color: #526853; font-size: 13px; }\n@media (max-width: 680px) { .product-grid { grid-template-columns: 1fr; } .product-art { min-height: 95px; } .product p { min-height: 0; } }',
      js: 'const savedCount = document.querySelector("#saved-count");\nconst feedback = document.querySelector("#feedback");\nconst saveButtons = document.querySelectorAll(".save");\nlet saved = 0;\n\n// Add a click listener to every save button.\n// Update the saved count, button label/state, and feedback.',
    },
    checks: [
      { file: 'html', label: 'The capstone has a main landmark', pattern: '<main\\b', flags: 'i' },
      { file: 'css', label: 'The products use a responsive grid', pattern: 'display\\s*:\\s*grid[\\s\\S]*grid-template-columns\\s*:\\s*repeat', flags: 'i' },
      { file: 'css', label: 'The grid has a narrow-screen rule', pattern: '@media[\\s\\S]*max-width\\s*:[\\s\\S]*grid-template-columns\\s*:\\s*1fr', flags: 'i' },
      { file: 'js', label: 'Save buttons respond to clicks', pattern: 'addEventListener\\s*\\(\\s*[\'"]click', flags: 'i' },
      { file: 'js', label: 'The saved item count increases', pattern: 'saved\\s*\\+\\+|saved\\s*=\\s*saved\\s*\\+\\s*1', flags: 'i' },
      { file: 'js', label: 'The saved state updates the page', pattern: 'savedCount\\.textContent', flags: 'i' },
    ],
    hints: ['Wrap the page content in <main class="launch-page"> and close the landmark.', 'Loop over saveButtons, update savedCount.textContent, then change the clicked button and feedback text.'],
  },
]

export const FRONTEND_TRACKS = [
  { name: 'HTML foundations', shortName: 'HTML', description: 'Structure and accessibility', color: 'coral' },
  { name: 'CSS layout', shortName: 'CSS', description: 'Box model, Flexbox, Grid, responsive design', color: 'violet' },
  { name: 'JavaScript in the browser', shortName: 'JavaScript', description: 'Events, DOM, data, forms, async', color: 'mint' },
  { name: 'Capstone', shortName: 'Capstone', description: 'Bring the browser platform together', color: 'amber' },
]

