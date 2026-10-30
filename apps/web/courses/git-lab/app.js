const STORAGE_KEY = 'tse-learning-hub:git-foundations-lab:v1'
const MAX_FILE_LENGTH = 30000
const MAX_FILE_LINES = 300

const starterFiles = {
  'README.md': '# Task Tracker\n\nA small app for keeping track of work.\n',
  'src/app.js': 'const tasks = []\n\nfunction addTask(title) {\n  tasks.push({ title, done: false })\n}\n\nconsole.log("Task Tracker ready")\n',
}

const missionData = [
  {
    id: 'version-control',
    title: '1 · What is version control?',
    description: 'Version control keeps a useful history of changes. Instead of guessing which backup is newest, you can compare named snapshots and understand how the project changed.',
    command: 'Review this idea, then mark it understood.',
    done: (state) => state.progress.conceptRead,
  },
  {
    id: 'initialize',
    title: '2 · Create a local repository',
    description: 'Git starts in a folder on your computer. Initialize this practice project to create its local Git metadata; the project files remain in place.',
    command: 'git init',
    done: (state) => state.initialized,
  },
  {
    id: 'inspect',
    title: '3 · Inspect the project',
    description: 'Ask Git for the repository status. The starter files exist in the folder, but Git does not track them until you add them.',
    command: 'git status',
    done: (state) => state.progress.checkedStatus,
  },
  {
    id: 'identity',
    title: '4 · Set your local Git identity',
    description: 'Git records an author name and email on every commit. Set a local identity for this practice repository; it does not change your computer-wide Git settings.',
    command: 'git config user.name "Your Name"\ngit config user.email "you@example.local"',
    done: (state) => Boolean(state.identity.name && state.identity.email),
  },
  {
    id: 'stage-first',
    title: '5 · Choose files to save',
    description: 'The staging area is a preview of the next commit. Stage the starter files so Git knows which snapshot you intend to save.',
    command: 'git add README.md src/app.js',
    done: (state) => Object.keys(starterFiles).every((path) => own(state.index, path)),
  },
  {
    id: 'first-commit',
    title: '6 · Make your first commit',
    description: 'A commit saves the staged snapshot to this local repository. Give it a short message that describes the change.',
    command: 'git commit -m "Add the starter project"',
    done: (state) => state.commits.length >= 1,
  },
  {
    id: 'working-diff',
    title: '7 · Change and compare',
    description: 'Edit README.md, save the file, then compare your working copy with the staging area. This shows changes that have not been staged.',
    command: 'Edit README.md, then run git diff',
    done: (state) => state.progress.reviewedUnstaged,
  },
  {
    id: 'staged-diff',
    title: '8 · Stage and review',
    description: 'Stage your README change. Review the staged version before committing; git diff --staged shows what the next commit will contain.',
    command: 'git add README.md\ngit diff --staged',
    done: (state) => state.progress.reviewedStaged,
  },
  {
    id: 'history',
    title: '9 · Save and read local history',
    description: 'Commit the reviewed change, then inspect the sequence of snapshots. The history is local; sharing it with another repository is a later lesson.',
    command: 'git commit -m "Improve project overview"\ngit log --oneline',
    done: (state) => state.commits.length >= 2 && state.progress.readHistory,
  },
  {
    id: 'create-branch',
    title: '10 · Create a feature branch',
    description: 'A branch is a movable name pointing to a commit. Create a second line of work from your current main commit, then look at HEAD and the branch labels.',
    command: 'git switch -c feature/greeting',
    done: (state) => state.progress.branchCreated && state.branch === 'feature/greeting',
  },
  {
    id: 'feature-commit',
    title: '11 · Commit work on the branch',
    description: 'In src/app.js, change the final log line to console.log("Task Tracker ready with a friendly greeting"). Save, stage the file, and commit it on feature/greeting.',
    command: 'git add src/app.js\ngit commit -m "Add a greeting"',
    done: (state) => state.progress.featureCommitted,
  },
  {
    id: 'main-commit',
    title: '12 · Make a separate main change',
    description: 'Switch back to main. Change that same final log line to console.log("Task Tracker ready for local users"). Save, stage, and commit it. The two branches now changed the same line differently.',
    command: 'git switch main\ngit add src/app.js\ngit commit -m "Clarify startup message"',
    done: (state) => state.progress.mainCommitted,
  },
  {
    id: 'merge-conflict',
    title: '13 · Merge and inspect a conflict',
    description: 'Merge feature/greeting into main. Git can combine different edits automatically, but it asks you to choose when both branches change the same line.',
    command: 'git merge feature/greeting',
    done: (state) => Boolean(state.mergeState?.conflicts.length || state.progress.mergeCompleted),
  },
  {
    id: 'resolve-conflict',
    title: '14 · Resolve and finish the merge',
    description: 'Choose the final startup message in the editor and remove the conflict markers. Save the file, stage it, then commit the merge. The graph will show both parent lines joining.',
    command: 'git add src/app.js\ngit commit -m "Merge greeting feature"',
    done: (state) => state.progress.mergeCompleted,
  },
]

function freshWorkspace() {
  return {
    version: 2,
    initialized: false,
    files: { ...starterFiles },
    index: {},
    commits: [],
    branch: 'main',
    branches: { main: null },
    branchLanes: { main: 0 },
    nextLane: 1,
    branchBase: null,
    featureBranch: 'feature/greeting',
    mergeState: null,
    activity: [],
    identity: { name: '', email: '' },
    progress: {
      conceptRead: false,
      checkedStatus: false,
      stagedFirst: false,
      reviewedUnstaged: false,
      reviewedStaged: false,
      readHistory: false,
      branchCreated: false,
      featureCommitted: false,
      mainCommitted: false,
      mergeCompleted: false,
    },
    selectedFile: 'README.md',
    selectedMission: 'version-control',
    commandHistory: [],
  }
}

function loadWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (![1, 2].includes(saved?.version) || !saved.files || !saved.progress || !Array.isArray(saved.commits)) return freshWorkspace()
    const base = freshWorkspace()
    const commits = saved.commits.map((commit, index) => ({
      ...commit,
      lane: Number.isInteger(commit.lane) ? commit.lane : 0,
      mergeParent: commit.mergeParent || null,
      parent: commit.parent ?? (index ? saved.commits[index - 1].id : null),
    }))
    const branches = saved.version === 2 && saved.branches && typeof saved.branches === 'object'
      ? saved.branches
      : { main: commits.at(-1)?.id || null }
    return {
      ...base,
      ...saved,
      version: 2,
      commits,
      branches: Object.keys(branches).length ? branches : { main: null },
      branchLanes: saved.version === 2 && saved.branchLanes ? saved.branchLanes : { main: 0 },
      nextLane: Number.isInteger(saved.nextLane) ? saved.nextLane : Math.max(1, Object.keys(branches).length),
      branch: saved.branch && own(branches, saved.branch) ? saved.branch : Object.keys(branches)[0] || 'main',
      mergeState: saved.mergeState || null,
      activity: Array.isArray(saved.activity) ? saved.activity : [],
      files: { ...starterFiles, ...saved.files },
      index: saved.index && typeof saved.index === 'object' ? saved.index : {},
      progress: { ...base.progress, ...saved.progress },
      identity: { ...base.identity, ...saved.identity },
      commandHistory: Array.isArray(saved.commandHistory) ? saved.commandHistory.slice(-40) : [],
    }
  } catch {
    return freshWorkspace()
  }
}

let workspace = loadWorkspace()
let selectedMission = workspace.selectedMission
let toastTimer = 0
let taskFeedback = null
let renderedCommitIds = new Set()

const THEME_STORAGE_KEY = 'tse-learning-theme'
const LEGACY_THEME_STORAGE_KEY = 'tse-learning-hub:git-foundations-lab:theme'
const missionChapters = [
  { title: 'Setup', start: 0, end: 3 },
  { title: 'Save', start: 3, end: 6 },
  { title: 'Compare', start: 6, end: 9 },
  { title: 'Branch and merge', start: 9, end: 14 },
]

const $ = (selector) => document.querySelector(selector)
const fileExplorer = $('#file-explorer')
const fileEditor = $('#file-editor')
const terminalInput = $('#terminal-input')
const terminalOutput = $('#terminal-output')
const missionList = $('#mission-list')

function applyTheme(theme) {
  const selected = theme === 'light' ? 'light' : 'dark'
  document.documentElement.dataset.theme = selected
  const button = $('#theme-toggle')
  button.textContent = selected === 'dark' ? 'Use light theme' : 'Use dark theme'
}

try {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY) || 'dark'
  applyTheme(savedTheme)
  localStorage.setItem(THEME_STORAGE_KEY, savedTheme)
} catch { applyTheme('dark') }

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function saveWorkspace() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
  } catch {
    announce('Progress could not be saved in this browser. Your current practice still works until you close the page.')
  }
}

function own(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function commitById(id) {
  return id ? workspace.commits.find((commit) => commit.id === id) || null : null
}

function branchHead(branch = workspace.branch) {
  return commitById(workspace.branches[branch])
}

function reachableCommits(headId = workspace.branches[workspace.branch]) {
  const found = new Set()
  const pending = headId ? [headId] : []
  while (pending.length) {
    const id = pending.pop()
    if (!id || found.has(id)) continue
    found.add(id)
    const commit = commitById(id)
    if (commit?.parent) pending.push(commit.parent)
    if (commit?.mergeParent) pending.push(commit.mergeParent)
  }
  return workspace.commits.filter((commit) => found.has(commit.id))
}

function latestSnapshot() {
  return branchHead()?.files || {}
}

function changedPaths(before, after) {
  const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  return paths.filter((path) => before[path] !== after[path] || own(before, path) !== own(after, path))
}

function changeKind(before, after, path) {
  if (!own(before, path) && own(after, path)) return 'new file'
  if (own(before, path) && !own(after, path)) return 'deleted'
  return 'modified'
}

function repositoryStatus() {
  const head = latestSnapshot()
  const staged = changedPaths(head, workspace.index).map((path) => ({ path, kind: changeKind(head, workspace.index, path) }))
  const unstaged = changedPaths(workspace.index, workspace.files).map((path) => ({ path, kind: changeKind(workspace.index, workspace.files, path) }))
  const untracked = Object.keys(workspace.files)
    .filter((path) => !own(workspace.index, path) && !own(head, path))
    .sort()
  const conflicts = workspace.mergeState?.conflicts.filter((path) => !workspace.mergeState.resolved.includes(path)) || []
  return { head, staged, unstaged, untracked, conflicts }
}

function fileState(path) {
  const status = repositoryStatus()
  const isStaged = status.staged.some((item) => item.path === path)
  const isUnstaged = status.unstaged.some((item) => item.path === path)
  const isUntracked = status.untracked.includes(path)
  if (status.conflicts.includes(path)) return { label: 'conflict', tone: 'conflict' }
  if (isStaged && isUnstaged) return { label: 'staged + edited', tone: 'modified' }
  if (isStaged) return { label: 'staged', tone: 'staged' }
  if (isUntracked) return { label: 'untracked', tone: 'untracked' }
  if (isUnstaged) return { label: 'modified', tone: 'modified' }
  if (workspace.initialized && own(status.head, path)) return { label: 'tracked', tone: 'clean' }
  return { label: 'not tracked', tone: 'clean' }
}

function renderFileExplorer() {
  const paths = Object.keys(workspace.files).sort()
  if (!paths.includes(workspace.selectedFile)) workspace.selectedFile = paths[0] || ''
  $('#file-count').textContent = `${paths.length} ${paths.length === 1 ? 'file' : 'files'}`
  fileExplorer.replaceChildren()
  paths.forEach((path) => {
    const status = fileState(path)
    const item = document.createElement('div')
    item.setAttribute('role', 'listitem')
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `file-row${workspace.selectedFile === path ? ' is-selected' : ''}`
    button.setAttribute('aria-current', workspace.selectedFile === path ? 'true' : 'false')
    const glyph = document.createElement('span')
    glyph.className = 'file-glyph'
    glyph.setAttribute('aria-hidden', 'true')
    glyph.textContent = path.endsWith('.md') ? '¶' : '◇'
    const label = document.createElement('span')
    label.className = 'file-path'
    label.textContent = path
    const badge = document.createElement('span')
    badge.className = `file-status file-status--${status.tone}`
    badge.textContent = status.label
    button.append(glyph, label, badge)
    button.addEventListener('click', () => {
      if (hasUnsavedEdit()) {
        announce('Save your current file edit before opening another file.')
        return
      }
      workspace.selectedFile = path
      saveWorkspace()
      renderFileExplorer()
      loadEditorFile()
    })
    item.append(button)
    fileExplorer.append(item)
  })
  if (!paths.length) fileExplorer.append(createText('p', 'state-empty', 'The project has no files.'))
}

function loadEditorFile(force = false) {
  const path = workspace.selectedFile
  $('#selected-file-label').textContent = path || 'No file selected'
  fileEditor.placeholder = path ? 'Edit the selected file here…' : 'Select a file to edit'
  if (force || (!hasUnsavedEdit() && document.activeElement !== fileEditor)) fileEditor.value = workspace.files[path] || ''
  fileEditor.disabled = !path
  $('#save-file').disabled = !path
}

function hasUnsavedEdit() {
  const path = workspace.selectedFile
  return Boolean(path) && fileEditor.value !== (workspace.files[path] || '')
}

function renderWorkingState(status) {
  const tracked = Object.keys(workspace.index).length
  const fileTotal = Object.keys(workspace.files).length
  $('#working-summary').textContent = workspace.initialized
    ? `${fileTotal} project ${fileTotal === 1 ? 'file' : 'files'} · ${status.untracked.length} untracked · ${status.unstaged.length} unstaged · ${status.conflicts.length} conflicts`
    : `${fileTotal} files in the folder. Git is not tracking them yet.`
  const list = $('#working-files')
  list.replaceChildren()
  const displayPaths = Object.keys(workspace.files).sort()
  displayPaths.forEach((path) => {
    const item = document.createElement('li')
    const name = createText('span', '', path)
    const state = fileState(path)
    const label = createText('span', '', state.label)
    label.className = `file-status file-status--${state.tone}`
    item.append(name, label)
    list.append(item)
  })
  if (!displayPaths.length) list.append(createText('li', 'state-empty', 'No files'))
  if (tracked > 0 && !status.untracked.length && !status.unstaged.length && !status.staged.length && !status.conflicts.length) {
    $('#working-summary').textContent = `${tracked} tracked ${tracked === 1 ? 'file' : 'files'} · clean`
  }
}

function renderStagedState(status) {
  const card = $('.state-card--staging')
  card.classList.toggle('is-inactive', !workspace.initialized)
  $('#staging-summary').textContent = !workspace.initialized
    ? 'Run git init to begin tracking a commit preview.'
    : status.staged.length
      ? `${status.staged.length} staged change${status.staged.length === 1 ? '' : 's'} ready for a commit.`
      : 'No staged changes. The next commit would contain no new snapshot.'
  const list = $('#staged-files')
  list.replaceChildren()
  status.staged.forEach(({ path, kind }) => {
    const item = document.createElement('li')
    item.append(createText('span', '', path), createText('span', 'file-status file-status--staged', kind))
    list.append(item)
  })
  if (!status.staged.length) list.append(createText('li', 'state-empty', 'Nothing staged'))
}

function renderHistorySnapshot() {
  const commit = branchHead()
  $('.state-card--history').classList.toggle('is-inactive', !workspace.initialized)
  const files = $('#history-files')
  files.replaceChildren()
  if (!workspace.initialized) {
    $('#history-summary').textContent = 'Run git init to start.'
    files.append(createText('li', 'state-empty', 'No local history yet'))
    return
  }
  if (!commit) {
    $('#history-summary').textContent = `${workspace.branch} · no commits yet`
    files.append(createText('li', 'state-empty', 'The first commit creates a snapshot.'))
    return
  }
  const paths = Object.keys(commit.files).sort()
  $('#history-summary').textContent = `${commit.id} · ${commit.message} · ${paths.length} file${paths.length === 1 ? '' : 's'}`
  paths.forEach((path) => files.append(createText('li', '', path)))
  if (!paths.length) files.append(createText('li', 'state-empty', 'Empty snapshot'))
}

function renderHistory() {
  const graph = $('#history-graph')
  $('.state-card--graph').classList.toggle('is-inactive', !workspace.initialized)
  graph.replaceChildren()
  const commits = workspace.commits
  if (!commits.length) {
    graph.append(createText('p', 'state-empty', workspace.initialized ? 'No commits yet. Make the first snapshot.' : 'Initialize Git to start local history.'))
    return
  }
  const namespace = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(namespace, 'svg')
  const maxLane = Math.max(0, ...commits.map((commit) => commit.lane || 0))
  const labelX = 30 + (maxLane + 1) * 34
  const graphHeight = commits.length * 34 + 14
  svg.setAttribute('viewBox', `0 0 ${Math.max(510, labelX + 440)} ${graphHeight}`)
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', String(graphHeight))
  svg.setAttribute('preserveAspectRatio', 'xMinYMin meet')
  svg.style.height = `${graphHeight}px`
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', 'Local commit graph. Lines connect commits to their parents; merge commits have two parent lines.')
  svg.classList.add('commit-graph-svg')
  const rowById = new Map(commits.map((commit, index) => [commit.id, index]))
  const xFor = (commit) => 16 + (commit.lane || 0) * 34
  const yFor = (commit) => 17 + rowById.get(commit.id) * 34
  const lineLayer = document.createElementNS(namespace, 'g')
  lineLayer.classList.add('graph-lines')
  for (const commit of commits) {
    for (const [parentId, type] of [[commit.parent, 'first-parent'], [commit.mergeParent, 'merge-parent']]) {
      const parent = commitById(parentId)
      if (!parent || !rowById.has(parent.id)) continue
      const line = document.createElementNS(namespace, 'path')
      line.setAttribute('d', `M ${xFor(parent)} ${yFor(parent)} L ${xFor(commit)} ${yFor(commit)}`)
      line.setAttribute('class', `graph-edge graph-edge--${type}`)
      lineLayer.append(line)
    }
  }
  svg.append(lineLayer)
  const refsAt = new Map()
  Object.entries(workspace.branches).forEach(([name, id]) => {
    if (!id) return
    const names = refsAt.get(id) || []
    names.push(`${name}${name === workspace.branch ? ' · HEAD' : ''}`)
    refsAt.set(id, names)
  })
  commits.slice().reverse().forEach((commit) => {
    const y = yFor(commit)
    const isHead = workspace.branches[workspace.branch] === commit.id
    const node = document.createElementNS(namespace, 'circle')
    node.setAttribute('cx', xFor(commit))
    node.setAttribute('cy', y)
    node.setAttribute('r', commit.mergeParent ? '8' : isHead ? '7' : '5')
    const nodeClasses = ['graph-node']
    if (commit.mergeParent) nodeClasses.push('graph-node--merge')
    if (isHead) nodeClasses.push('graph-node--head')
    if (!renderedCommitIds.has(commit.id)) nodeClasses.push('graph-node--new')
    node.setAttribute('class', nodeClasses.join(' '))
    const title = document.createElementNS(namespace, 'title')
    title.textContent = `${commit.id}: ${commit.message}`
    node.append(title)
    svg.append(node)
    const label = document.createElementNS(namespace, 'text')
    label.setAttribute('x', labelX)
    label.setAttribute('y', y + 3)
    label.setAttribute('class', 'graph-commit-label')
    label.textContent = `${commit.id}  ${commit.message}`
    svg.append(label)
    const refs = refsAt.get(commit.id)
    if (refs?.length) {
      const ref = document.createElementNS(namespace, 'text')
      ref.setAttribute('x', labelX + 280)
      ref.setAttribute('y', y + 3)
      ref.setAttribute('class', 'graph-ref-label')
      ref.textContent = refs.join('  ·  ')
      svg.append(ref)
    }
  })
  workspace.commits.forEach((commit) => renderedCommitIds.add(commit.id))
  graph.append(svg)
}

function renderRefs() {
  const head = branchHead()
  $('.state-card--refs').classList.toggle('is-inactive', !workspace.initialized)
  $('#refs-summary').textContent = head ? `HEAD → ${workspace.branch} → ${head.id}` : `${workspace.branch} · no commits yet`
  const list = $('#branch-list')
  list.replaceChildren()
  Object.entries(workspace.branches).forEach(([name, id]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.disabled = !workspace.initialized
    button.className = `branch-ref${name === workspace.branch ? ' is-current' : ''}`
    button.setAttribute('aria-current', name === workspace.branch ? 'true' : 'false')
    button.append(createText('span', 'branch-ref-name', `${name === workspace.branch ? '●' : '○'} ${name}`))
    button.append(createText('span', 'branch-ref-commit', id || 'no commits yet'))
    button.title = `Switch to ${name}`
    button.addEventListener('click', () => runCommand(`git switch ${name}`))
    list.append(button)
  })
}

function renderActivity() {
  const stream = $('#activity-stream')
  stream.replaceChildren()
  const actionCount = workspace.activity.length
  $('#activity-count').textContent = `${actionCount} ${actionCount === 1 ? 'action' : 'actions'}`
  if (!workspace.activity.length) {
    stream.append(createText('p', 'activity-empty', 'Run a Git command or save a file to see its effect recorded here.'))
    return
  }
  workspace.activity.forEach((event) => {
    const item = document.createElement('article')
    item.className = `activity-event activity-event--${event.kind}`
    item.append(createText('span', 'activity-marker', event.icon || '•'))
    const body = document.createElement('div')
    body.className = 'activity-event-body'
    body.append(createText('strong', 'activity-title', event.title))
    body.append(createText('p', 'activity-detail', event.detail))
    item.append(body)
    const meta = document.createElement('div')
    meta.className = 'activity-meta'
    meta.append(createText('code', 'activity-command', event.command || 'editor'))
    meta.append(createText('time', 'activity-time', new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })))
    item.append(meta)
    stream.append(item)
  })
}

function renderConflictPanel(status = repositoryStatus()) {
  const panel = $('#conflict-panel')
  const active = Boolean(workspace.mergeState)
  panel.hidden = !active
  if (!active) return
  const unresolved = status.conflicts
  const resolved = workspace.mergeState.resolved
  $('#conflict-summary').textContent = `Merging ${workspace.mergeState.targetBranch} into ${workspace.branch}. Git stopped at ${workspace.mergeState.conflicts.length} overlapping file${workspace.mergeState.conflicts.length === 1 ? '' : 's'}.`
  $('#conflict-status').textContent = unresolved.length ? `${unresolved.length} unresolved` : 'Ready to commit'
  $('#conflict-status').classList.toggle('is-resolved', unresolved.length === 0)
  const files = $('#conflict-files')
  files.replaceChildren()
  workspace.mergeState.conflicts.forEach((path) => {
    const row = document.createElement('div')
    row.className = `conflict-file${resolved.includes(path) ? ' is-resolved' : ''}`
    row.append(createText('code', '', path))
    row.append(createText('span', '', resolved.includes(path) ? 'Resolved · staged' : 'Both branches changed this file'))
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'text-button'
    button.textContent = 'Open file'
    button.addEventListener('click', () => {
      workspace.selectedFile = path
      renderFileExplorer()
      loadEditorFile(true)
      fileEditor.focus()
    })
    row.append(button)
    files.append(row)
  })
}

function renderRepoStatus() {
  const indicator = $('#repo-state')
  indicator.classList.toggle('is-ready', workspace.initialized)
  indicator.querySelector('span').textContent = workspace.initialized
    ? reachableCommits().length ? `On ${workspace.branch} · ${reachableCommits().length} ${reachableCommits().length === 1 ? 'commit' : 'commits'}` : `On ${workspace.branch} · no commits`
    : 'Not initialized'
  const status = repositoryStatus()
  renderWorkingState(status)
  renderStagedState(status)
  renderHistorySnapshot()
  renderHistory()
  renderRefs()
  renderActivity()
  renderConflictPanel(status)
  renderFileExplorer()
}

function createText(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  node.textContent = text
  return node
}

function renderMissions() {
  missionList.replaceChildren()
  const completedCount = missionData.filter((mission) => mission.done(workspace)).length
  const firstIncomplete = missionData.find((mission) => !mission.done(workspace))
  if (!missionData.some((mission) => mission.id === selectedMission)) selectedMission = firstIncomplete?.id || missionData.at(-1).id
  const selected = missionData.find((mission) => mission.id === selectedMission) || firstIncomplete || missionData.at(-1)
  const selectedIndex = missionData.indexOf(selected)
  workspace.selectedMission = selected.id

  missionChapters.forEach((chapter, chapterIndex) => {
    const details = document.createElement('details')
    details.className = 'mission-chapter'
    details.open = selectedIndex >= chapter.start && selectedIndex < chapter.end
    const summary = document.createElement('summary')
    const chapterName = createText('span', 'chapter-name', `${chapterIndex + 1}. ${chapter.title}`)
    const chapterDone = missionData.slice(chapter.start, chapter.end).filter((mission) => mission.done(workspace)).length
    const chapterTotal = chapter.end - chapter.start
    summary.append(chapterName, createText('span', 'chapter-count', `${chapterDone}/${chapterTotal}`))
    const list = document.createElement('ol')
    list.className = 'chapter-missions'
    missionData.slice(chapter.start, chapter.end).forEach((mission, offset) => {
      const index = chapter.start + offset
      const complete = mission.done(workspace)
      const active = mission.id === selected.id
      const item = document.createElement('li')
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `mission-button${active ? ' is-active' : ''}${complete ? ' is-complete' : ''}`
      button.setAttribute('aria-current', active ? 'step' : 'false')
      const number = createText('span', 'mission-index', complete ? '✓' : String(index + 1).padStart(2, '0'))
      const name = createText('span', 'mission-name', mission.title.replace(/^\d+ · /, ''))
      const check = createText('span', 'mission-check', complete ? '✓' : '')
      button.append(number, name, check)
      button.addEventListener('click', () => {
        selectedMission = mission.id
        taskFeedback = null
        saveWorkspace()
        renderMissions()
      })
      item.append(button)
      list.append(item)
    })
    details.append(summary, list)
    missionList.append(details)
  })

  renderCurrentTask(selected, selectedIndex, completedCount)
  $('#progress-count').textContent = `${completedCount} of ${missionData.length} complete`
  $('#progress-fill').style.width = `${Math.round((completedCount / missionData.length) * 100)}%`
  $('#mark-concept').textContent = workspace.progress.conceptRead ? 'Concept understood ✓' : 'Mark concept understood'
  $('#mark-concept').disabled = workspace.progress.conceptRead
  saveWorkspace()
}

function missionCommands(mission) {
  const listed = mission.command.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('git '))
  const embedded = mission.command.match(/git (?:init|status|add [^\n,]+|diff(?: --staged)?|commit -m "[^"]+"|log --oneline|config [^\n]+|switch(?: -c)? [^\n]+|merge [^\n]+)/g) || []
  return [...new Set([...listed, ...embedded])]
}

function taskReason(mission) {
  const reasons = {
    'version-control': 'Review the explanation in this task, then mark the concept understood.',
    initialize: 'This repository has not been initialized yet. Run git init here.',
    inspect: 'Run git status so Git can report what is in this folder.',
    identity: 'Set both user.name and user.email for this practice repository.',
    'stage-first': 'Stage both starter files: README.md and src/app.js.',
    'first-commit': workspace.identity.name && workspace.identity.email ? 'Stage the starter files, then create the first commit.' : 'Set the local author name and email, stage the starter files, then commit.',
    'working-diff': 'After a commit, edit and save README.md, then inspect the unstaged change with git diff.',
    'staged-diff': 'Stage the README.md edit and inspect it with git diff --staged.',
    history: 'Commit the staged README change, then read the local history with git log --oneline.',
    'create-branch': 'Create and switch to feature/greeting with git switch -c feature/greeting.',
    'feature-commit': 'Edit the startup line on feature/greeting, save it, stage it, and commit it.',
    'main-commit': 'Switch to main, edit that same startup line differently, save, stage, and commit.',
    'merge-conflict': 'Switch to main and merge feature/greeting. Both branches need separate edits first.',
    'resolve-conflict': 'Remove all conflict markers, save the chosen result, stage the file, and commit the merge.',
  }
  return reasons[mission.id] || 'Complete the instruction above, then check this step again.'
}

function renderCurrentTask(mission, index, completedCount) {
  const chapterIndex = missionChapters.findIndex((chapter) => index >= chapter.start && index < chapter.end)
  const chapter = missionChapters[chapterIndex]
  const chapterStep = index - chapter.start + 1
  $('#task-chapter').textContent = `CHAPTER ${chapterIndex + 1} · ${chapter.title.toUpperCase()} · STEP ${chapterStep} OF ${chapter.end - chapter.start}`
  $('#task-title').textContent = mission.title.replace(/^\d+ · /, '')
  $('#task-step').textContent = `Step ${index + 1} of ${missionData.length} · ${completedCount} complete`
  $('#task-instruction').textContent = mission.description

  const commands = missionCommands(mission)
  const commandArea = $('#task-commands')
  commandArea.replaceChildren()
  if (mission.id === 'version-control') {
    const button = createText('button', 'task-command', 'Mark concept understood')
    button.type = 'button'
    button.addEventListener('click', markConcept)
    commandArea.append(button)
  }
  if (/edit/i.test(mission.command)) {
    const paths = [...new Set(mission.command.match(/(?:README\.md|src\/app\.js)/g) || [])]
    paths.forEach((path) => {
      const button = createText('button', 'task-command task-command--file', `Open ${path}`)
      button.type = 'button'
      button.addEventListener('click', () => openFileForPractice(path))
      commandArea.append(button)
    })
  }
  commands.forEach((command) => {
    const button = createText('button', 'task-command', command)
    button.type = 'button'
    button.title = `Run ${command}`
    button.addEventListener('click', () => {
      runCommand(command)
      terminalInput.focus()
    })
    commandArea.append(button)
  })

  const quick = $('#quick-commands')
  quick.replaceChildren(createText('span', 'quick-label', 'Suggested:'))
  const suggestions = commands.length ? commands.slice(0, 2) : ['git status']
  suggestions.forEach((command) => {
    const button = createText('button', '', command)
    button.type = 'button'
    button.addEventListener('click', () => {
      runCommand(command)
      terminalInput.focus()
    })
    quick.append(button)
  })

  const hints = $('#git-command-hints')
  hints.replaceChildren()
  const candidates = [
    'git init', 'git status', 'git config user.name "Your Name"', 'git config user.email "you@example.local"',
    'git add README.md', 'git add src/app.js', 'git add .', 'git diff', 'git diff --staged',
    'git commit -m "Save snapshot"', 'git log --oneline', 'git branch',
    'git switch main', 'git switch -c feature/greeting', 'git merge feature/greeting',
  ]
  workspace.branches && Object.keys(workspace.branches).forEach((name) => candidates.push(`git switch ${name}`))
  ;[...new Set(candidates)].forEach((value) => {
    const option = document.createElement('option')
    option.value = value
    hints.append(option)
  })

  const done = mission.done(workspace)
  const feedback = taskFeedback?.missionId === mission.id ? taskFeedback : null
  const feedbackNode = $('#task-feedback')
  feedbackNode.textContent = feedback?.text || (done ? 'This step is complete. Check it to continue.' : 'Complete the instruction, then check your work here.')
  feedbackNode.className = `task-feedback${feedback ? ` is-${feedback.tone}` : ''}`
  $('#next-step').hidden = !(feedback?.tone === 'done')
  $('#check-step').textContent = done ? 'Check again' : 'Check my step'

  const flowAdd = $('#flow-add-command')
  const flowCommit = $('#flow-commit-command')
  const currentStatus = repositoryStatus()
  const addCommand = commands.find((command) => command.startsWith('git add ')) || `git add ${workspace.selectedFile || 'README.md'}`
  const commitCommandText = commands.find((command) => command.startsWith('git commit ')) || 'git commit -m "Save changes"'
  flowAdd.dataset.command = addCommand
  flowAdd.textContent = addCommand
  flowAdd.disabled = !workspace.initialized
  flowAdd.title = workspace.initialized ? `Run ${addCommand}` : 'Run git init to start staging changes.'
  flowCommit.dataset.command = commitCommandText
  flowCommit.textContent = commitCommandText
  flowCommit.disabled = !workspace.initialized || currentStatus.conflicts.length > 0 || (!currentStatus.staged.length && !workspace.mergeState)
  flowCommit.title = flowCommit.disabled ? 'Stage a change before creating a commit.' : `Run ${commitCommandText}`
}

function openFileForPractice(path) {
  if (!Object.prototype.hasOwnProperty.call(workspace.files, path)) {
    announce(`${path} is not available in this practice repository.`)
    return
  }
  workspace.selectedFile = path
  saveWorkspace()
  renderFileExplorer()
  loadEditorFile(true)
  fileEditor.focus()
  fileEditor.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

function checkCurrentStep() {
  const mission = missionData.find((item) => item.id === selectedMission)
  const index = missionData.indexOf(mission)
  if (mission.done(workspace)) {
    const next = missionData.slice(index + 1).find((item) => !item.done(workspace))
    taskFeedback = {
      missionId: mission.id,
      tone: 'done',
      text: next ? `Done. Next: ${next.title.replace(/^\d+ · /, '')}.` : 'Done. You completed the local foundations and branch merge path.',
    }
  } else {
    taskFeedback = { missionId: mission.id, tone: 'incomplete', text: `Not yet. ${taskReason(mission)}` }
  }
  renderMissions()
}

function goToNextStep() {
  const currentIndex = missionData.findIndex((mission) => mission.id === selectedMission)
  const next = missionData.slice(currentIndex + 1).find((mission) => !mission.done(workspace))
  if (!next) return
  selectedMission = next.id
  taskFeedback = null
  saveWorkspace()
  renderMissions()
  $('#task-card').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function renderAll() {
  renderRepoStatus()
  loadEditorFile()
  renderMissions()
}

function setExplanation(text, tone = '') {
  const feedback = $('#command-feedback')
  const detail = $('#feedback-detail')
  const summary = $('#feedback-summary')
  const line = $('#feedback-line')
  feedback.classList.toggle('is-error', tone === 'error')
  $('#feedback-icon').textContent = tone === 'error' ? '!' : '✓'
  line.textContent = tone === 'error' ? text.split('\n')[0] : text
  detail.textContent = text
  summary.textContent = tone === 'error' ? 'Why did that fail?' : 'Details'
  $('#feedback-details').open = false
}

function announce(message) {
  const toast = $('#toast')
  toast.textContent = message
  toast.hidden = false
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.hidden = true }, 3300)
}

function appendTerminal(command, output, tone = '') {
  const entry = document.createElement('div')
  entry.className = 'terminal-entry'
  const commandLine = document.createElement('div')
  commandLine.className = 'terminal-command'
  commandLine.append(createText('span', 'terminal-prompt', 'learner@local ~/practice/task-tracker $'))
  commandLine.append(createText('span', '', command))
  const result = createText('pre', `terminal-result${tone ? ` is-${tone}` : ''}`, output)
  entry.append(commandLine, result)
  terminalOutput.append(entry)
  terminalOutput.scrollTop = terminalOutput.scrollHeight
}

function tokenize(command) {
  const tokens = command.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\S+/g) || []
  return tokens.map((token) => {
    const quote = token[0]
    if ((quote === '"' || quote === "'") && token.at(-1) === quote) {
      return token.slice(1, -1).replace(/\\([\\"'])/g, '$1')
    }
    return token
  })
}

function runCommand(rawCommand) {
  const command = rawCommand.trim()
  if (!command) return
  workspace.commandHistory.push(command)
  workspace.commandHistory = workspace.commandHistory.slice(-40)
  const tokens = tokenize(command)
  const previouslySelected = missionData.find((mission) => mission.id === selectedMission)
  const output = execute(tokens)
  if (tokens[0] === 'git' && (output.tone !== 'error' || (tokens[1] === 'merge' && output.text.includes('CONFLICT'))) && tokens[1] !== 'help') recordCommandActivity(command, output, tokens)
  taskFeedback = { missionId: previouslySelected?.id, tone: output.tone === 'error' ? 'incomplete' : 'neutral', text: output.tone === 'error' ? 'Command needs attention. Read the terminal output, then check your step.' : 'Command ran. Check whether this step is complete.' }
  appendTerminal(command, output.text, output.tone)
  setExplanation(output.explanation || 'Command finished. Review the terminal output and current repository state.', output.tone)
  saveWorkspace()
  renderAll()
}

function recordCommandActivity(command, output, tokens) {
  const subcommand = tokens[1]
  if (subcommand === 'commit' && output.text.includes('nothing to commit')) return
  const branchListing = subcommand === 'branch' && tokens.length === 2
  const configLookup = subcommand === 'config' && tokens.length < 4
  const mergeAbort = subcommand === 'merge' && tokens[2] === '--abort'
  const mergeAlreadyDone = subcommand === 'merge' && output.text.startsWith('Already up to date.')
  const events = {
    init: ['repository', 'Created the local repository', 'Git metadata added in this project folder.', '◆'],
    status: ['inspect', 'Inspected repository status', output.text.split('\n').slice(0, 2).join(' · '), '◉'],
    config: configLookup
      ? ['inspect', 'Read local author settings', 'These values are stored only in this repository.', '◉']
      : ['settings', 'Set local author identity', 'Commit author settings belong to this repository.', '⚙'],
    add: ['stage', 'Updated the staging area', output.text.split('\n').slice(0, 3).join(' · '), '+'],
    diff: ['inspect', 'Compared file versions', tokens.includes('--staged') || tokens.includes('--cached') ? 'Staging area compared with the latest commit.' : 'Working files compared with the staging area.', '⇄'],
    commit: ['commit', 'Saved a local commit', output.text.split('\n')[0], '●'],
    log: ['inspect', 'Read local commit history', `${reachableCommits().length} commit${reachableCommits().length === 1 ? '' : 's'} reachable from ${workspace.branch}.`, '↕'],
    show: ['inspect', 'Inspected a saved commit', tokens[2] || 'HEAD', '◉'],
    restore: ['restore', 'Restored file contents', output.text.split('\n')[0], '↶'],
    branch: branchListing
      ? ['inspect', 'Listed local branches', output.text.split('\n').join(' · '), '⑂']
      : ['branch', 'Created a branch reference', output.text.split('\n')[0], '⑂'],
    switch: ['branch', 'Moved HEAD to a branch', output.text.split('\n')[0], '⑂'],
    checkout: ['branch', 'Moved HEAD to a branch', output.text.split('\n')[0], '⑂'],
    merge: mergeAbort
      ? ['restore', 'Aborted the merge', 'Returned working files to the current branch.', '↶']
      : mergeAlreadyDone
        ? ['inspect', 'Checked branch history', output.text.split('\n')[0], '◉']
        : workspace.mergeState?.conflicts.length
          ? ['conflict', 'Merge stopped for conflict resolution', output.text.split('\n')[0], '⑂']
          : ['merge', 'Merged branch history', output.text.split('\n')[0], '⑂'],
  }
  const event = events[subcommand]
  if (!event) return
  workspace.activity.unshift({ kind: event[0], title: event[1], detail: event[2] || 'Repository state updated.', icon: event[3], command, time: Date.now() })
}

function execute(tokens) {
  if (tokens[0] === 'clear') {
    terminalOutput.replaceChildren()
    return { text: 'Terminal output cleared.', tone: 'success', explanation: 'Clearing terminal output does not change your repository.' }
  }
  if (tokens[0] === 'help' || (tokens[0] === 'git' && tokens[1] === 'help')) {
    return {
      text: [
        'Commands supported in this local foundations lab:',
        '  git init                       create a local repository',
        '  git status                     inspect file and staging state',
        '  git add <path> | .             stage selected file contents',
        '  git diff                       compare working files with staging',
        '  git diff --staged              compare staging with the last commit',
        '  git commit -m "message"        save a local snapshot',
        '  git log --oneline              inspect local commit history',
        '  git branch [name]              list or create local branches',
        '  git switch <branch>            move HEAD to a branch',
        '  git switch -c <name>           create and switch branches',
        '  git merge <branch>             combine local branch histories',
        '  git merge --abort              cancel an in-progress merge',
        '  git show [HEAD]                inspect a saved snapshot',
        '  git restore <path>             discard unstaged edits to a tracked file',
        '  git restore --staged <path>    remove a file from the next commit',
        '  git config user.name "name"    set this practice repo author',
        '  git config user.email "email"  set this practice repo email',
        '',
        'Use the file editor to make changes. No system shell command is executed.',
      ].join('\n'),
      explanation: 'This simulator accepts a focused set of local Git commands, including branches and merges. Run git status first to inspect the current state.',
    }
  }
  if (tokens[0] !== 'git') return { text: `Command not found: ${tokens[0] || ''}\nThis is a Git practice terminal. Type help to see supported commands.`, tone: 'error' }

  const subcommand = tokens[1]
  if (subcommand === 'init') return initRepository()
  if (subcommand === '--version' || subcommand === 'version') return { text: 'git version 2.45.0 (simulated learning environment)', explanation: 'The lab presents a consistent modern Git interface. It does not execute the installed Git program.' }
  if (subcommand === 'config' && !workspace.initialized) {
    return { text: 'fatal: not a git repository\nSet local Git identity after running git init.', tone: 'error', explanation: 'Repository-local settings are stored with a local repository. Initialize this folder before configuring its author identity.' }
  }
  if (subcommand === 'config') return configure(tokens.slice(2))
  if (!workspace.initialized) {
    return { text: `fatal: not a git repository (or any parent up to mount point): .git\n\nRun git init in this practice folder before using git ${subcommand || 'commands'}.`, tone: 'error', explanation: 'Git commands that inspect or change repository state need a local repository. git init creates its metadata in this folder.' }
  }

  if (subcommand === 'status') return statusCommand()
  if (subcommand === 'branch') return branchCommand(tokens.slice(2))
  if (subcommand === 'switch') return switchCommand(tokens.slice(2))
  if (subcommand === 'checkout') return checkoutCommand(tokens.slice(2))
  if (subcommand === 'merge') return mergeCommand(tokens.slice(2))
  if (subcommand === 'add') return addCommand(tokens.slice(2))
  if (subcommand === 'diff') return diffCommand(tokens.slice(2))
  if (subcommand === 'commit') return commitCommand(tokens.slice(2))
  if (subcommand === 'log') return logCommand(tokens.slice(2))
  if (subcommand === 'show') return showCommand(tokens.slice(2))
  if (subcommand === 'restore') return restoreCommand(tokens.slice(2))
  if (subcommand === 'rev-parse' && tokens[2] === '--show-toplevel') return { text: '/practice/task-tracker', explanation: 'This is the root folder of the simulated local repository.' }
  return { text: `git: '${subcommand || ''}' is not available in this foundations module.\nType help to list supported commands.`, tone: 'error', explanation: 'This module models local version control, branching, and merging. Remote collaboration comes next.' }
}

function initRepository() {
  if (workspace.initialized) return { text: 'Reinitialized existing Git repository in /practice/task-tracker/.git/', tone: 'success', explanation: 'Running git init again keeps the existing repository and commit history. It does not remove your files or commits.' }
  workspace.initialized = true
  workspace.index = {}
  workspace.branch = 'main'
  workspace.branches = { main: null }
  workspace.branchLanes = { main: 0 }
  workspace.nextLane = 1
  return { text: 'Initialized empty Git repository in /practice/task-tracker/.git/', tone: 'success', explanation: 'Git created local repository metadata. Your starter files are still untracked; inspect them with git status.' }
}

function repositoryIsClean() {
  const status = repositoryStatus()
  return !status.staged.length && !status.unstaged.length && !status.untracked.length && !status.conflicts.length
}

function validBranchName(name) {
  return Boolean(name) && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(name) && !name.includes('..') && !name.endsWith('/')
}

function createBranch(name) {
  if (!validBranchName(name)) return { error: `fatal: '${name || ''}' is not a valid branch name` }
  if (own(workspace.branches, name)) return { error: `fatal: a branch named '${name}' already exists` }
  workspace.branches[name] = workspace.branches[workspace.branch] || null
  workspace.branchLanes[name] = workspace.nextLane
  workspace.nextLane += 1
  if (name === workspace.featureBranch) {
    workspace.branchBase = workspace.branches[name]
    workspace.progress.branchCreated = true
  }
  return { name }
}

function branchCommand(args) {
  if (args.length > 1) return { text: 'Usage: git branch [name]', tone: 'error' }
  if (!args.length) {
    const rows = Object.entries(workspace.branches).map(([name, id]) => `${name === workspace.branch ? '* ' : '  '}${name}${id ? `  ${id}` : '  (no commits yet)'}`)
    return { text: rows.join('\n'), explanation: 'A branch is a local name pointing at a commit. HEAD identifies the branch currently checked out.' }
  }
  const created = createBranch(args[0])
  if (created.error) return { text: created.error, tone: 'error' }
  return { text: `Created branch '${created.name}' at ${workspace.branches[created.name] || '(unborn HEAD)'}`, tone: 'success', explanation: 'Creating a branch adds a movable name at the current commit. It does not copy the project files; both branches initially point to the same snapshot.' }
}

function switchBranch(name) {
  if (!own(workspace.branches, name)) return { text: `error: pathspec '${name}' did not match any branch`, tone: 'error' }
  if (workspace.mergeState) return { text: 'fatal: you have not concluded your merge (MERGE_HEAD exists)', tone: 'error', explanation: 'Finish resolving and committing the merge, or run git merge --abort before switching branches.' }
  if (!repositoryIsClean()) return { text: 'error: your local changes would be overwritten by switching branches\nCommit or restore the current changes, then switch again.', tone: 'error', explanation: 'Git protects your working files when changing branches. Commit or discard local changes before switching.' }
  workspace.branch = name
  const snapshot = clone(latestSnapshot())
  workspace.files = clone(snapshot)
  workspace.index = clone(snapshot)
  if (!own(workspace.files, workspace.selectedFile)) workspace.selectedFile = Object.keys(workspace.files)[0] || ''
  return { text: `Switched to branch '${name}'`, tone: 'success', explanation: `HEAD now follows ${name}. Git updated the working files to that branch's latest commit.` }
}

function switchCommand(args) {
  if (!args.length) return { text: 'Usage: git switch [-c] <branch>', tone: 'error' }
  if (args[0] === '-c' || args[0] === '--create') {
    const name = args[1]
    if (args.length !== 2) return { text: 'Usage: git switch -c <new-branch>', tone: 'error' }
    if (!repositoryIsClean()) return { text: 'error: commit or restore your changes before creating a branch', tone: 'error' }
    const created = createBranch(name)
    if (created.error) return { text: created.error, tone: 'error' }
    workspace.branch = name
    return { text: `Switched to a new branch '${name}'`, tone: 'success', explanation: 'The new branch starts at the current commit, and HEAD now follows it. New commits will move this branch name forward.' }
  }
  if (args.length !== 1) return { text: 'Usage: git switch <branch>', tone: 'error' }
  return switchBranch(args[0])
}

function checkoutCommand(args) {
  if (args[0] === '-b') return switchCommand(['-c', ...args.slice(1)])
  return switchCommand(args)
}

function isAncestor(ancestorId, descendantId) {
  if (!ancestorId) return true
  if (!descendantId) return false
  const pending = [descendantId]
  const seen = new Set()
  while (pending.length) {
    const id = pending.pop()
    if (id === ancestorId) return true
    if (!id || seen.has(id)) continue
    seen.add(id)
    const commit = commitById(id)
    if (commit?.parent) pending.push(commit.parent)
    if (commit?.mergeParent) pending.push(commit.mergeParent)
  }
  return false
}

function mergeBase(firstId, secondId) {
  const distances = new Map()
  const firstQueue = firstId ? [[firstId, 0]] : []
  while (firstQueue.length) {
    const [id, distance] = firstQueue.shift()
    if (distances.has(id)) continue
    distances.set(id, distance)
    const commit = commitById(id)
    if (commit?.parent) firstQueue.push([commit.parent, distance + 1])
    if (commit?.mergeParent) firstQueue.push([commit.mergeParent, distance + 1])
  }
  const secondQueue = secondId ? [[secondId, 0]] : []
  const seen = new Set()
  let best = null
  while (secondQueue.length) {
    const [id, distance] = secondQueue.shift()
    if (seen.has(id)) continue
    seen.add(id)
    if (distances.has(id)) {
      const score = distance + distances.get(id)
      if (!best || score < best.score) best = { id, score }
    }
    const commit = commitById(id)
    if (commit?.parent) secondQueue.push([commit.parent, distance + 1])
    if (commit?.mergeParent) secondQueue.push([commit.mergeParent, distance + 1])
  }
  return best?.id || null
}

function sameTreeEntry(first, second, path) {
  return own(first, path) === own(second, path) && first[path] === second[path]
}

function setTreeEntry(tree, path, exists, value) {
  if (exists) tree[path] = value
  else delete tree[path]
}

function conflictText(ours, theirs) {
  const left = ours ?? '(file deleted)'
  const right = theirs ?? '(file deleted)'
  return `<<<<<<< HEAD (${workspace.branch})\n${left}${left.endsWith('\n') ? '' : '\n'}=======\n${right}${right.endsWith('\n') ? '' : '\n'}>>>>>>> ${workspace.mergeState.targetBranch}\n`
}

function mergeCommand(args) {
  if (args[0] === '--abort') {
    if (!workspace.mergeState) return { text: 'fatal: There is no merge to abort (MERGE_HEAD missing).', tone: 'error' }
    workspace.files = clone(latestSnapshot())
    workspace.index = clone(latestSnapshot())
    workspace.mergeState = null
    return { text: 'Merge aborted. Working tree restored to the current branch.', tone: 'success', explanation: 'Aborting a merge removes the in-progress merge result and returns files to the checked-out branch snapshot.' }
  }
  if (args.length !== 1) return { text: 'Usage: git merge <branch> | git merge --abort', tone: 'error' }
  if (workspace.mergeState) return { text: 'error: a merge is already in progress', tone: 'error' }
  if (!repositoryIsClean()) return { text: 'error: commit or restore local changes before merging', tone: 'error' }
  const targetBranch = args[0]
  if (!own(workspace.branches, targetBranch)) return { text: `merge: ${targetBranch} - not something we can merge`, tone: 'error' }
  if (targetBranch === workspace.branch) return { text: `Already on '${workspace.branch}'.`, tone: 'error' }
  const oursId = workspace.branches[workspace.branch]
  const theirsId = workspace.branches[targetBranch]
  if (!theirsId) return { text: `fatal: refusing to merge unrelated branch '${targetBranch}' with no commits`, tone: 'error' }
  if (isAncestor(theirsId, oursId)) return { text: `Already up to date. '${targetBranch}' is already included in '${workspace.branch}'.`, tone: 'success', explanation: 'The target branch has no commits missing from the current branch, so there is nothing to merge.' }
  if (isAncestor(oursId, theirsId)) {
    workspace.branches[workspace.branch] = theirsId
    workspace.files = clone(commitById(theirsId).files)
    workspace.index = clone(workspace.files)
    return { text: `Updating ${oursId || '(empty)'}..${theirsId}\nFast-forward`, tone: 'success', explanation: 'A fast-forward merge moves the current branch pointer to a later commit because no separate work exists on the current branch.' }
  }
  const baseId = mergeBase(oursId, theirsId)
  const base = commitById(baseId)?.files || {}
  const ours = latestSnapshot()
  const theirs = commitById(theirsId).files
  const merged = {}
  const conflicts = []
  const paths = [...new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])].sort()
  for (const path of paths) {
    if (sameTreeEntry(ours, theirs, path)) setTreeEntry(merged, path, own(ours, path), ours[path])
    else if (sameTreeEntry(ours, base, path)) setTreeEntry(merged, path, own(theirs, path), theirs[path])
    else if (sameTreeEntry(theirs, base, path)) setTreeEntry(merged, path, own(ours, path), ours[path])
    else {
      conflicts.push(path)
      setTreeEntry(merged, path, own(ours, path), ours[path])
    }
  }
  workspace.mergeState = { targetBranch, targetHead: theirsId, baseId, conflicts, resolved: [] }
  workspace.index = clone(merged)
  workspace.files = clone(merged)
  conflicts.forEach((path) => { workspace.files[path] = conflictText(ours[path], theirs[path]) })
  if (conflicts.length) {
    workspace.selectedFile = conflicts[0]
    return { text: `Auto-merging ${conflicts.join(', ')}\nCONFLICT (content): Merge conflict in ${conflicts.join(', ')}\nAutomatic merge failed; fix conflicts and then commit the result.`, tone: 'error', explanation: 'Git found two different edits to the same file. The working copy now shows both versions with conflict markers; choose the final text, save it, stage it, and commit.' }
  }
  const committed = commitCommand(['-m', `Merge branch '${targetBranch}'`])
  return { ...committed, text: `Merge made by the simulator.\n${committed.text}`, explanation: 'Git combined the non-overlapping file changes and recorded a merge commit with two parents. The graph shows both histories joining.' }
}

function statusCommand() {
  const status = repositoryStatus()
  workspace.progress.checkedStatus = true
  const lines = [`On branch ${workspace.branch}`]
  if (!branchHead()) lines.push('', 'No commits yet')
  if (!status.staged.length && !status.unstaged.length && !status.untracked.length && !status.conflicts.length) {
    lines.push('', 'nothing to commit, working tree clean')
    return { text: lines.join('\n'), tone: 'success', explanation: 'A clean working tree means your saved files match the staging area, and the staging area matches the latest commit.' }
  }
  if (status.staged.length) {
    lines.push('', 'Changes to be committed:', '  (use "git restore --staged <file>..." to unstage)')
    status.staged.forEach(({ path, kind }) => lines.push(`\t${kind}:   ${path}`))
  }
  if (status.unstaged.length) {
    lines.push('', 'Changes not staged for commit:', '  (use "git add <file>..." to update what will be committed)', '  (use "git restore <file>..." to discard changes in working directory)')
    status.unstaged.forEach(({ path, kind }) => lines.push(`\t${kind}:   ${path}`))
  }
  if (status.untracked.length) {
    lines.push('', 'Untracked files:', '  (use "git add <file>..." to include in what will be committed)')
    status.untracked.forEach((path) => lines.push(`\t${path}`))
  }
  if (status.conflicts.length) {
    lines.push('', 'Unmerged paths:', '  (use "git add <file>..." after resolving conflicts)')
    status.conflicts.forEach((path) => lines.push(`\tboth modified:   ${path}`))
  }
  const explanation = status.conflicts.length
    ? 'Git found overlapping edits. Choose the final contents, remove conflict markers, save the file, and stage the resolved version.'
    : status.untracked.length
    ? 'Untracked means the file is in your folder but not in Git’s staging area or history. git add selects its current contents for the next snapshot.'
    : status.staged.length && status.unstaged.length
      ? 'The index and working file differ. You have staged one version and then made another edit; each area represents a different state.'
      : status.staged.length
        ? 'Staged changes are the proposed contents of your next commit. Review them with git diff --staged before committing.'
        : 'These tracked files changed after the last staging operation. Review the edits with git diff, then stage the ones you want.'
  return { text: lines.join('\n'), explanation }
}

function addCommand(paths) {
  if (!paths.length) return { text: 'Nothing specified, nothing added.\nHint: git add README.md or git add .', tone: 'error' }
  const stageAll = paths.includes('.') || paths.includes('-A') || paths.includes('--all')
  const selected = stageAll
    ? [...new Set([...Object.keys(workspace.files), ...Object.keys(workspace.index)])]
    : paths.flatMap((path) => Object.keys({ ...workspace.files, ...workspace.index }).filter((candidate) => candidate === path || candidate.startsWith(`${path.replace(/\/$/, '')}/`)))
  const uniquePaths = [...new Set(selected)].sort()
  if (!uniquePaths.length) return { text: `fatal: pathspec '${paths.join(' ')}' did not match any files`, tone: 'error' }
  const unresolved = uniquePaths.filter((path) => workspace.mergeState?.conflicts.includes(path) && /^(<<<<<<< .+|=======|>>>>>>> .+)$/m.test(workspace.files[path] || ''))
  if (unresolved.length) return { text: `error: conflict markers remain in ${unresolved.join(', ')}\nEdit and save the file before staging the resolution.`, tone: 'error', explanation: 'git add marks a conflict resolved only after the conflict markers have been removed from the working file.' }
  const lines = []
  for (const path of uniquePaths) {
    if (own(workspace.files, path)) {
      workspace.index[path] = workspace.files[path]
      lines.push(`staged ${path}`)
      if (workspace.mergeState?.conflicts.includes(path) && !workspace.mergeState.resolved.includes(path)) workspace.mergeState.resolved.push(path)
    } else if (own(workspace.index, path)) {
      delete workspace.index[path]
      lines.push(`staged removal of ${path}`)
    }
  }
  if (!branchHead() && changedPaths({}, workspace.index).length) workspace.progress.stagedFirst = true
  return {
    text: lines.length ? lines.join('\n') : 'No changes added.',
    tone: 'success',
    explanation: 'git add copies the selected file contents into the staging area. It does not create a commit yet; you can review the proposed snapshot with git diff --staged.',
  }
}

function diffCommand(options) {
  const staged = options.includes('--staged') || options.includes('--cached')
  const before = staged ? latestSnapshot() : workspace.index
  const after = staged ? workspace.index : workspace.files
  const output = formatDiff(before, after)
  if (!output) {
    return { text: 'No differences found.', explanation: staged ? 'The staging area currently matches the latest commit.' : 'The working files currently match the staging area. Untracked files are listed by git status but are not included in this comparison.' }
  }
  if (staged && branchHead() && changedPaths(latestSnapshot(), workspace.index).includes('README.md')) {
    workspace.progress.reviewedStaged = true
  } else if (!staged && branchHead() && changedPaths(workspace.index, workspace.files).includes('README.md')) {
    workspace.progress.reviewedUnstaged = true
  }
  return {
    text: output,
    explanation: staged
      ? 'This compares the staging area with the latest commit. These are the changes a new commit will record.'
      : 'This compares your working files with the staging area. These changes are not staged yet, so they will not be in the next commit until you run git add.',
  }
}

function formatDiff(before, after) {
  const sections = []
  for (const path of changedPaths(before, after)) {
    sections.push(`diff --git a/${path} b/${path}`)
    if (!own(before, path)) sections.push('new file mode 100644')
    if (!own(after, path)) sections.push('deleted file mode 100644')
    sections.push(`--- ${own(before, path) ? `a/${path}` : '/dev/null'}`)
    sections.push(`+++ ${own(after, path) ? `b/${path}` : '/dev/null'}`)
    sections.push(...lineDiff(before[path] || '', after[path] || ''))
    sections.push('')
  }
  return sections.join('\n').trimEnd()
}

function lineDiff(beforeText, afterText) {
  const before = beforeText ? beforeText.replace(/\n$/, '').split('\n') : []
  const after = afterText ? afterText.replace(/\n$/, '').split('\n') : []
  const rows = before.length + 1
  const cols = after.length + 1
  const table = Array.from({ length: rows }, () => new Uint16Array(cols))
  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      table[i][j] = before[i] === after[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const diff = []
  let i = 0
  let j = 0
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      diff.push(` ${before[i]}`)
      i += 1
      j += 1
    } else if (j < after.length && (i === before.length || table[i][j + 1] >= table[i + 1][j])) {
      diff.push(`+${after[j]}`)
      j += 1
    } else {
      diff.push(`-${before[i]}`)
      i += 1
    }
  }
  return ['@@', ...diff]
}

function commitCommand(args) {
  const messageIndex = args.indexOf('-m')
  if (messageIndex < 0 || !args[messageIndex + 1]) return { text: 'error: a commit message is required\nUsage: git commit -m "Describe the change"', tone: 'error' }
  const message = args[messageIndex + 1]
  if (!workspace.identity.name || !workspace.identity.email) {
    return {
      text: 'Author identity unknown\n\nSet the author for this local repository first:\n  git config user.name "Your Name"\n  git config user.email "you@example.local"',
      tone: 'error',
      explanation: 'Git stores author information in each commit. These git config commands change only the practice repository identity.',
    }
  }
  const unresolved = repositoryStatus().conflicts
  if (unresolved.length) return { text: `error: cannot commit because these conflicts are unresolved:\n${unresolved.map((path) => `\t${path}`).join('\n')}`, tone: 'error', explanation: 'Resolve each conflict, save the file, and stage it with git add before committing the merge.' }
  const mergeInProgress = Boolean(workspace.mergeState)
  const changes = changedPaths(latestSnapshot(), workspace.index)
  if (!changes.length && !mergeInProgress) return { text: `On branch ${workspace.branch}\nnothing to commit, working tree clean`, tone: 'error', explanation: 'A commit records staged changes. Make an edit, stage it with git add, then commit the new snapshot.' }
  const commitNumber = workspace.commits.length + 1
  const commit = {
    id: `c${String(commitNumber).padStart(3, '0')}`,
    message,
    author: workspace.identity.name,
    email: workspace.identity.email,
    time: Date.now(),
    parent: workspace.branches[workspace.branch] || null,
    mergeParent: mergeInProgress ? workspace.mergeState.targetHead : null,
    lane: workspace.branchLanes[workspace.branch] || 0,
    files: clone(workspace.index),
  }
  workspace.commits.push(commit)
  workspace.branches[workspace.branch] = commit.id
  workspace.index = clone(commit.files)
  if (workspace.branch === workspace.featureBranch && workspace.branchBase !== commit.id) workspace.progress.featureCommitted = true
  if (workspace.branch === 'main' && workspace.branchBase && workspace.branchBase !== commit.id) workspace.progress.mainCommitted = true
  if (mergeInProgress) {
    workspace.progress.mergeCompleted = true
    workspace.mergeState = null
  }
  const summary = changes.map(({ path }) => path).slice(0, 4).join(', ')
  return {
    text: `[${workspace.branch} ${commit.id}${commit.mergeParent ? ` ${commit.mergeParent}` : ''}] ${message}\n ${changes.length} file${changes.length === 1 ? '' : 's'} changed${summary ? `: ${summary}${changes.length > 4 ? ', …' : ''}` : ''}`,
    tone: 'success',
    explanation: 'The commit saved a snapshot of the staging area in this local repository. Your next changes start from this checkpoint; nothing has been uploaded to a server.',
  }
}

function logCommand(options) {
  const commits = reachableCommits().slice().reverse()
  if (!commits.length) return { text: 'fatal: your current branch has no commits yet', tone: 'error', explanation: 'git log reads committed history. Stage and commit your first snapshot, then run it again.' }
  if (reachableCommits().length >= 2) workspace.progress.readHistory = true
  const oneline = options.includes('--oneline') || options.includes('--graph')
  const lines = commits.map((commit, index) => oneline
    ? `* ${commit.id} ${commit.mergeParent ? `(${commit.parent} ${commit.mergeParent}) ` : ''}${index === 0 ? `(${workspace.branch}, HEAD)` : ''} ${commit.message}`.trim()
    : `commit ${commit.id}${index === 0 ? ` (HEAD -> ${workspace.branch})` : ''}\nAuthor: ${commit.author} <${commit.email}>\nDate:   ${new Date(commit.time).toLocaleString()}\n\n    ${commit.message}`)
  return { text: lines.join(oneline ? '\n' : '\n\n'), explanation: 'git log shows committed snapshots, newest first. Each commit points to its parent, forming the local history.' }
}

function showCommand(args) {
  if (!branchHead()) return { text: 'fatal: your current branch has no commits yet', tone: 'error' }
  const requested = args[0] || 'HEAD'
  const commit = requested === 'HEAD'
    ? branchHead()
    : workspace.branches[requested] ? commitById(workspace.branches[requested]) : workspace.commits.find((item) => item.id === requested || item.id.startsWith(requested))
  if (!commit) return { text: `fatal: unknown revision '${requested}'`, tone: 'error' }
  const parent = commit.parent ? workspace.commits.find((item) => item.id === commit.parent)?.files || {} : {}
  return { text: `commit ${commit.id}\nAuthor: ${commit.author} <${commit.email}>\n\n    ${commit.message}\n\n${formatDiff(parent, commit.files) || '(empty snapshot)'}`, explanation: 'git show displays a saved commit and the file changes it introduced.' }
}

function restoreCommand(args) {
  const unstage = args[0] === '--staged'
  const path = args[unstage ? 1 : 0]
  if (!path || path.startsWith('-')) return { text: 'Usage: git restore [--staged] <path>', tone: 'error' }
  if (!own(workspace.files, path) && !own(workspace.index, path) && !own(latestSnapshot(), path)) return { text: `error: pathspec '${path}' did not match any tracked file`, tone: 'error' }
  if (unstage) {
    const head = latestSnapshot()
    if (own(head, path)) workspace.index[path] = head[path]
    else delete workspace.index[path]
    return { text: `Unstaged changes for ${path}`, tone: 'success', explanation: 'git restore --staged updates the index to match the latest commit. Your working file remains in place, so you can stage it again later.' }
  }
  if (!own(workspace.index, path)) return { text: `error: '${path}' is not in the staging area; use git add before restoring a staged version`, tone: 'error' }
  workspace.files[path] = workspace.index[path]
  if (workspace.selectedFile === path) loadEditorFile(true)
  return { text: `Restored ${path} from the staging area`, tone: 'success', explanation: 'git restore <path> discards unstaged edits by copying the staged version back into the working file. Review git status before using it on real work.' }
}

function configure(args) {
  if (!args.length) return { text: `user.name=${workspace.identity.name || '(not set)'}\nuser.email=${workspace.identity.email || '(not set)'}`, explanation: 'Git records an author name and email on each commit. These values are stored only in this practice repository.' }
  if (args.length === 1) {
    if (args[0] === 'user.name') return { text: workspace.identity.name || '', explanation: 'This is the author name Git will put on new commits in this practice repository.' }
    if (args[0] === 'user.email') return { text: workspace.identity.email || '', explanation: 'This is the author email Git will put on new commits in this practice repository.' }
    return { text: `error: unsupported local setting '${args[0]}'`, tone: 'error' }
  }
  const [key, value] = args
  if (key === 'user.name') workspace.identity.name = value
  else if (key === 'user.email') workspace.identity.email = value
  else return { text: `error: unsupported local setting '${key}'`, tone: 'error' }
  return { text: `Set ${key} for this practice repository.`, tone: 'success', explanation: 'This is a repository-local author setting for the simulator. It does not change your computer-wide Git configuration.' }
}

function saveEditor() {
  const path = workspace.selectedFile
  if (!path) return
  if (fileEditor.value.length > MAX_FILE_LENGTH) {
    $('#editor-message').textContent = `Keep practice files under ${MAX_FILE_LENGTH.toLocaleString()} characters.`
    return
  }
  if (fileEditor.value.split('\n').length > MAX_FILE_LINES) {
    $('#editor-message').textContent = `Keep practice files under ${MAX_FILE_LINES} lines so diffs stay easy to follow.`
    return
  }
  workspace.files[path] = fileEditor.value
  taskFeedback = { missionId: selectedMission, tone: 'neutral', text: `Saved ${path}. Check the current step when you have finished its commands.` }
  workspace.activity.unshift({ kind: 'modified', title: `Edited ${path} in the working tree`, detail: 'Saved file contents are visible to Git, but still need staging before a commit.', icon: '✎', command: 'Save file', time: Date.now() })
  saveWorkspace()
  $('#editor-message').textContent = `Saved ${path} to the working tree.`
  renderRepoStatus()
  renderMissions()
  setExplanation('You changed the working file. Git records the change only after you inspect it and stage it with git add.')
}

function markConcept() {
  workspace.progress.conceptRead = true
  taskFeedback = { missionId: selectedMission, tone: 'neutral', text: 'Concept marked understood. Check this step to continue.' }
  saveWorkspace()
  renderMissions()
  announce('Concept marked understood. Check your step to continue.')
}

function resetLab() {
  const confirmed = window.confirm('Reset this practice repository and clear its saved progress?')
  if (!confirmed) return
  workspace = freshWorkspace()
  selectedMission = 'version-control'
  taskFeedback = null
  renderedCommitIds.clear()
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* The fresh session remains usable. */ }
  terminalOutput.replaceChildren(createWelcome())
  $('#editor-message').textContent = 'Choose a file, edit it, then save.'
  renderAll()
  setExplanation('Git is not initialized yet. git init creates the repository metadata; your files stay where they are.')
  announce('Practice repository reset.')
}

function createWelcome() {
  const welcome = document.createElement('div')
  welcome.className = 'terminal-welcome'
  welcome.append(
    createText('p', 'terminal-welcome-title', 'Welcome to your practice repository.'),
    createText('p', '', 'Commands run in an isolated simulator. They never run on your computer.'),
    createText('p', '', 'Start with git init, then try git status.'),
  )
  return welcome
}

$('#terminal-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const command = terminalInput.value
  terminalInput.value = ''
  runCommand(command)
  terminalInput.focus()
})

terminalInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    const lastCommand = workspace.commandHistory.at(-1)
    if (lastCommand) terminalInput.value = lastCommand
  }
})

document.querySelectorAll('[data-command]').forEach((button) => {
  button.addEventListener('click', () => {
    runCommand(button.dataset.command)
    terminalInput.focus()
  })
})

$('#save-file').addEventListener('click', saveEditor)
$('#file-editor').addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    saveEditor()
  }
})
$('#mark-concept').addEventListener('click', markConcept)
$('#reset-lab').addEventListener('click', resetLab)
$('#clear-terminal').addEventListener('click', () => terminalOutput.replaceChildren())
$('#check-step').addEventListener('click', checkCurrentStep)
$('#next-step').addEventListener('click', goToNextStep)
$('#flow-add-command').addEventListener('click', () => runCommand($('#flow-add-command').dataset.command))
$('#flow-commit-command').addEventListener('click', () => runCommand($('#flow-commit-command').dataset.command))
$('#theme-toggle').addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  applyTheme(nextTheme)
  try { localStorage.setItem(THEME_STORAGE_KEY, nextTheme) } catch { /* The current page still uses the selected theme. */ }
})

renderAll()
if (workspace.initialized) {
  const resume = document.createElement('p')
  resume.className = 'terminal-welcome-title'
  resume.textContent = `Practice restored · ${workspace.commits.length} local ${workspace.commits.length === 1 ? 'commit' : 'commits'} · no remote configured`
  terminalOutput.replaceChildren(resume)
}
