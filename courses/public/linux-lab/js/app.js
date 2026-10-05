import { Shell, LAB_COMMANDS } from './terminal.js'
import { evaluateQuestion, previewCommand } from './validator.js'

const PROGRESS_KEY = 'tse_linux_progress'
const FILESYSTEM_KEY = 'tse_linux_fs'
const LEGACY_KEYS = ['tse-learning-hub:linux-lab:v2', 'tse-learning-hub:linux-lab:v1', 'tse-linux-lab:v1']
const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector))

async function start() {
  const page = document.body.dataset.page
  const response = await fetch(new URL('../data/questions.json', import.meta.url))
  if (!response.ok) throw new Error(`Could not load question data (${response.status}).`)
  const catalog = await response.json()
  const topics = catalog.topics || []
  const questions = topics.flatMap((topic) => topic.questions)
  const questionById = new Map(questions.map((question) => [question.id, question]))

  let progress = readJson(PROGRESS_KEY, null)
  let machine = readJson(FILESYSTEM_KEY, null)
  if (!progress) {
    const legacy = LEGACY_KEYS.map((key) => readJson(key, null)).find(Boolean)
    if (legacy) {
      const completed = {}
      for (const [id, record] of Object.entries(legacy.done || {})) {
        if (questionById.has(id)) completed[id] = { points: Math.min(10, Number(record?.points) || 0), assisted: Boolean(record?.assisted) }
      }
      progress = {
        completed,
        skipped: {},
        hints: {},
        solutionShown: {},
        lastTopic: (Number(legacy.sectionIndex) || 0) + 1,
        lastQuestion: (Number(legacy.questionIndex) || 0) + 1,
      }
      machine = legacy.machine || machine
    }
  }
  progress = {
    completed: progress?.completed || {},
    skipped: progress?.skipped || {},
    hints: progress?.hints || {},
    solutionShown: progress?.solutionShown || {},
    lastTopic: progress?.lastTopic || 1,
    lastQuestion: progress?.lastQuestion || 1,
  }
  for (const id of Object.keys(progress.completed)) if (!questionById.has(id)) delete progress.completed[id]
  for (const id of Object.keys(progress.skipped)) if (!questionById.has(id)) delete progress.skipped[id]

  let shell = new Shell(machine)
  let lastResult = null
  let historyCursor = shell.history.length
  let topicIndex = 0
  let questionIndex = 0
  let freePractice = false
  const setProgressRoute = (topic, question) => {
    progress.lastTopic = topic
    progress.lastQuestion = question
  }
  const currentTopic = () => topics[topicIndex]
  const currentQuestion = () => currentTopic()?.questions[questionIndex] || null
  const completedCount = () => Object.keys(progress.completed).length
  const points = () => Object.values(progress.completed).reduce((sum, item) => sum + (Number(item.points) || 0), 0)
  const isComplete = (question) => Boolean(progress.completed[question?.id])
  const isUnlocked = (question) => isComplete(question) || Boolean(progress.skipped[question?.id])

  function save() {
    const fs = shell.exportState()
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
      localStorage.setItem(FILESYSTEM_KEY, JSON.stringify(fs))
    } catch {
      showFeedback('Browser storage is full. Your current practice session will continue until this page closes.', 'wrong')
    }
  }

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
    catch { return fallback }
  }

  function updateProgressDisplays() {
    const done = completedCount()
    const score = points()
    const percent = Math.round((done / catalog.totalQuestions) * 100)
    const values = {
      overviewDone: `${done} / ${catalog.totalQuestions}`,
      overviewPoints: `${score} / ${catalog.totalPoints}`,
      topDone: `${done} / ${catalog.totalQuestions}`,
      topPoints: `${score} / ${catalog.totalPoints}`,
      sidePercent: `${percent}%`,
      sideDone: `${done} of ${catalog.totalQuestions} questions`,
      sidePoints: `${score} of ${catalog.totalPoints} points earned`,
    }
    for (const [id, value] of Object.entries(values)) if ($(`#${id}`)) $(`#${id}`).textContent = value
    const fill = $('#sideProgress')
    if (fill) {
      fill.style.width = `${percent}%`
      fill.parentElement.setAttribute('aria-valuenow', String(percent))
    }
  }

  function openRoute(topicNumber, questionNumber = 1, { push = true, practice = false } = {}) {
    topicIndex = Math.min(Math.max(Number(topicNumber) - 1 || 0, 0), topics.length - 1)
    questionIndex = Math.min(Math.max(Number(questionNumber) - 1 || 0, 0), topics[topicIndex].questions.length - 1)
    freePractice = practice
    lastResult = null
    if ($('#commandInput')) $('#commandInput').value = ''
    if ($('#feedback')) $('#feedback').hidden = true
    setProgressRoute(topicIndex + 1, questionIndex + 1)
    const params = new URLSearchParams({ topic: String(topicIndex + 1), q: String(questionIndex + 1) })
    if (freePractice) params.set('practice', '1')
    const url = `./lab.html?${params}`
    if (push) history.pushState({ topic: topicIndex + 1, question: questionIndex + 1, practice: freePractice }, '', url)
    save()
    if (page === 'practice') renderPractice()
  }

  function topicDone(topic) { return topic.questions.filter(isComplete).length }
  function buildTopicNavigation() {
    const nav = $('#topicNav')
    if (!nav) return
    nav.replaceChildren()
    topics.forEach((topic, index) => {
      const done = topicDone(topic)
      const active = index === topicIndex && !freePractice
      const link = document.createElement('a')
      link.className = `topic-row${active ? ' is-current' : ''}${done === topic.questions.length ? ' is-complete' : ''}`
      link.href = `./lab.html?topic=${topic.number}`
      link.setAttribute('aria-current', active ? 'page' : 'false')
      const number = document.createElement('span')
      number.className = 'topic-number'
      number.textContent = done === topic.questions.length ? '✓' : String(topic.number)
      const title = document.createElement('span')
      title.className = 'topic-row-title'
      title.textContent = topic.title
      const count = document.createElement('span')
      count.className = 'topic-row-count'
      count.textContent = `${done} of ${topic.questions.length}`
      link.append(number, title, count)
      link.addEventListener('click', (event) => {
        event.preventDefault()
        const next = topic.questions.findIndex((question) => !isComplete(question))
        closeTopicDrawer()
        openRoute(topic.number, next >= 0 ? next + 1 : 1)
      })
      nav.append(link)
    })
  }

  function renderOverview() {
    updateProgressDisplays()
    const grid = $('#topicGrid')
    if (!grid) return
    grid.replaceChildren()
    const resumeTopic = Math.min(Math.max(Number(progress.lastTopic) || 1, 1), topics.length)
    const resumeQuestion = Math.min(Math.max(Number(progress.lastQuestion) || 1, 1), 5)
    const resume = topics[resumeTopic - 1]?.questions[resumeQuestion - 1]
    const anyProgress = completedCount() > 0 || resumeTopic !== 1 || resumeQuestion !== 1
    $('#resumeTitle').textContent = anyProgress ? `${topics[resumeTopic - 1].title} · Question ${resumeQuestion}` : 'Start with Navigation'
    $('#resumeDescription').textContent = anyProgress ? resume?.goal || 'Continue your saved Linux practice.' : 'Begin with the command line basics and find your way around the machine.'
    $('#resumeEyebrow').textContent = anyProgress ? 'Pick up where you left off' : 'Your practice starts here'
    $('#continueLink').href = `./lab.html?topic=${anyProgress ? resumeTopic : 2}&q=${anyProgress ? resumeQuestion : 1}`
    $('#freePracticeLink').href = `./lab.html?topic=${resumeTopic}&q=${resumeQuestion}&practice=1`

    const nextTopicNumber = completedCount() === 0
      ? (anyProgress ? resumeTopic : 2)
      : topics.find((candidate) => topicDone(candidate) < candidate.questions.length)?.number
    topics.forEach((topic) => {
      const done = topicDone(topic)
      const current = done < topic.questions.length && topic.number === nextTopicNumber
      const link = document.createElement('a')
      link.className = `topic-card${current ? ' is-up-next' : ''}${done === topic.questions.length ? ' is-complete' : ''}`
      link.href = `./lab.html?topic=${topic.number}`
      link.setAttribute('aria-label', `Topic ${topic.number}, ${topic.title}, ${done} of 5 complete`)
      const top = document.createElement('span')
      top.className = 'topic-card-top'
      const badge = document.createElement('span')
      badge.className = 'topic-card-number'
      badge.textContent = done === topic.questions.length ? '✓' : String(topic.number)
      const count = document.createElement('span')
      count.className = current ? 'up-next-label' : 'topic-card-count'
      count.textContent = current ? 'Up next' : `${done} of 5`
      top.append(badge, count)
      const title = document.createElement('strong')
      title.textContent = topic.title
      const commands = document.createElement('code')
      commands.textContent = topic.commands.join(', ')
      const track = document.createElement('span')
      track.className = 'topic-card-track'
      const fill = document.createElement('i')
      fill.style.width = `${done * 20}%`
      track.append(fill)
      link.append(top, title, commands, track)
      grid.append(link)
    })
  }

  function setText(selector, value) {
    const element = $(selector)
    if (element) element.textContent = value
  }

  function updatePointsBadge() {
    const badge = $('.points-badge')
    if (!badge) return
    const question = freePractice ? null : currentQuestion()
    badge.textContent = question
      ? `${question.points} ${window.matchMedia('(max-width: 720px)').matches ? 'pts' : 'points'}`
      : 'Open practice'
  }

  function buildAnatomy(question) {
    const container = $('#commandAnatomy')
    container.hidden = !question || !isComplete(question)
    container.replaceChildren()
    for (const part of question?.anatomy || []) {
      const card = document.createElement('div')
      card.className = 'anatomy-part'
      const value = document.createElement('code')
      value.textContent = part.value
      const explanation = document.createElement('span')
      explanation.textContent = part.explanation
      card.append(value, explanation)
      container.append(card)
    }
  }

  function buildHints(question) {
    const list = $('#hintList')
    list.replaceChildren()
    const opened = Number(progress.hints[question.id]) || 0
    question.hints.forEach((hint, index) => {
      const row = document.createElement('div')
      row.className = 'hint-row'
      const badge = document.createElement('span')
      badge.className = `hint-number${index < opened ? ' is-open' : ''}`
      badge.textContent = String(index + 1)
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `hint-button${index < opened ? ' is-revealed' : ''}`
      button.disabled = index > opened
      button.textContent = index < opened ? hint : `Show hint ${index + 1}`
      if (index === opened && opened < question.hints.length) button.addEventListener('click', () => {
        progress.hints[question.id] = opened + 1
        save()
        renderPractice()
      })
      row.append(badge, button)
      list.append(row)
    })
    if (progress.solutionShown[question.id]) {
      const solution = document.createElement('p')
      solution.className = 'solution-reveal'
      const label = document.createElement('span')
      label.textContent = 'Suggested command'
      const code = document.createElement('code')
      code.textContent = question.solution
      solution.append(label, code)
      list.append(solution)
    }
  }

  function friendlyCheck(check) {
    if (check.type === 'fs') {
      const kind = check.nodeType === 'dir' ? 'Folder' : 'File'
      if (check.exists === false) return `No file remains at ${check.path}`
      if (check.contains) return `${kind} at ${check.path} contains “${check.contains}”`
      if (check.mode) return `Permissions on ${check.path} are ${check.mode}`
      return `${kind} exists at ${check.path}`
    }
    if (check.type === 'output') {
      const expected = check.includes ?? check.equals ?? check.startsWith ?? 'the requested result'
      return `Command output includes “${expected}”`
    }
    if (check.label) return check.label.replace(/\?([^?]+)\?/g, '“$1”')
    return 'Complete this task requirement'
  }

  function updateChecklist(question, command = '') {
    const list = $('#checklist')
    list.replaceChildren()
    if (!question) return
    const evaluated = evaluateQuestion(question, shell, lastResult)
    const preview = previewCommand(question, command, shell)
    const rows = evaluated.checks.map((check, index) => ({ ...check, label: friendlyCheck(question.checks[index]) }))
    for (const item of preview) if (!rows.some((row) => row.label === item.label)) rows.push(item)
    rows.forEach((item) => {
      const row = document.createElement('li')
      row.className = item.complete ? 'is-done' : ''
      const mark = document.createElement('span')
      mark.className = 'check-mark'
      mark.setAttribute('aria-hidden', 'true')
      mark.textContent = item.complete ? '✓' : ''
      const text = document.createElement('span')
      text.textContent = item.label
      row.append(mark, text)
      list.append(row)
    })
  }

  function relevantPaths(question) {
    const parts = question?.anatomy?.map((part) => part.value) || []
    const pathParts = parts.filter((value) => value.startsWith('/') || value.startsWith('~/') || /^[\w.-]+:\//.test(value))
    if (pathParts.length) return pathParts
    const text = `${question?.goal || ''} ${question?.solution || ''}`
    return Array.from(new Set(text.match(/(?:~\/|\/)[\w./-]+/g) || [])).slice(0, 3)
  }

  function buildFilesystemMap(question) {
    const map = $('#filesystemMap')
    map.replaceChildren()
    const paths = relevantPaths(question)
    if (!paths.length) {
      const line = document.createElement('p')
      line.textContent = 'Your files live under ~/ ( /home/user ).'
      map.append(line)
      return
    }
    const target = paths.at(-1)
    const localPaths = paths.filter((path) => !/^[\w.-]+:\//.test(path))
    const remotePaths = paths.filter((path) => /^[\w.-]+:\//.test(path))
    const addPathLine = (value, remote = false, isTarget = false) => {
      const remoteMatch = remote ? value.match(/^([\w.-]+):(\/.*)$/) : null
      const localPath = remoteMatch ? remoteMatch[2] : value
      const node = remoteMatch ? null : shell.node(localPath)
      const exists = remoteMatch
        ? Boolean(shell.system.remotes?.[remoteMatch[1]]?.files?.[localPath])
        : Boolean(node)
      const normalized = remoteMatch?.[2] || value
      const folder = node?.type === 'dir'
      const separator = normalized.lastIndexOf('/')
      const parent = folder ? `${value.replace(/\/$/, '')}/` : normalized.slice(0, separator + 1)
      const leaf = folder ? '' : normalized.slice(separator + 1)
      const className = `${remote ? 'remote-path' : ''}${exists ? ' path-exists' : ''}`
      const parentLine = document.createElement('p')
      parentLine.className = className
      const parentBranch = document.createElement('span')
      parentBranch.textContent = '\u2514 '
      const parentLabel = document.createElement('code')
      parentLabel.textContent = parent
      parentLine.append(parentBranch, parentLabel)
      map.append(parentLine)
      if (leaf) {
        const fileLine = document.createElement('p')
        fileLine.className = `${className} filesystem-leaf`
        const fileBranch = document.createElement('span')
        fileBranch.textContent = '\u00a0\u00a0\u2514 '
        const fileLabel = document.createElement('code')
        fileLabel.textContent = leaf
        const suffix = document.createElement('span')
        suffix.textContent = isTarget ? '  \u2190 goal' : ''
        fileLine.append(fileBranch, fileLabel, suffix)
        map.append(fileLine)
      } else if (isTarget) {
        const suffix = document.createElement('span')
        suffix.textContent = '  \u2190 goal'
        parentLine.append(suffix)
      }
    }
    if (localPaths.length) {
      const heading = document.createElement('p')
      heading.textContent = '~ (your machine)'
      map.append(heading)
      localPaths.forEach((path) => addPathLine(path, false, path === target))
    }
    const remoteGroups = new Map()
    for (const path of remotePaths) {
      const host = path.split(':', 1)[0]
      if (!remoteGroups.has(host)) remoteGroups.set(host, [])
      remoteGroups.get(host).push(path)
    }
    for (const [host, hostPaths] of remoteGroups) {
      const heading = document.createElement('p')
      heading.className = 'remote-path'
      heading.textContent = `${host} (remote)`
      map.append(heading)
      hostPaths.forEach((path) => addPathLine(path, true, path === target))
    }
  }

  function updateTopicNavigationState() {
    buildTopicNavigation()
    updateProgressDisplays()
  }

  function renderPractice() {
    const topic = currentTopic()
    const question = freePractice ? null : currentQuestion()
    document.body.classList.toggle('free-practice', freePractice)
    updateProgressDisplays()
    updateTopicNavigationState()
    setText('#topicBreadcrumb', `Topic ${topic.number} of ${topics.length} / ${freePractice ? 'Free practice' : topic.title}`)
    const breadcrumb = $('#topicBreadcrumb')
    if (breadcrumb) {
      breadcrumb.replaceChildren(document.createTextNode(`Topic ${topic.number} of ${topics.length} / `))
      const name = document.createElement('b')
      name.textContent = freePractice ? 'Free practice' : topic.title
      breadcrumb.append(name)
    }
    setText('#topicTitle', freePractice ? 'Free practice' : topic.title)
    setText('#topicSummary', freePractice ? 'Use the full simulated machine to explore Linux commands. Your files are saved in this browser.' : topic.summary)
    setText('#mobileTopic', freePractice ? 'Free practice' : topic.title)
    setText('#mobileQuestion', freePractice ? 'Open workspace' : `Question ${questionIndex + 1} of ${topic.questions.length}`)
    const mobileFill = $('#mobileTopicProgress')
    if (mobileFill) mobileFill.style.width = freePractice ? '100%' : `${((questionIndex + 1) / topic.questions.length) * 100}%`

    const stepper = $('#questionStepper')
    stepper.replaceChildren()
    topic.questions.forEach((item, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `step-pill${index === questionIndex && !freePractice ? ' is-current' : ''}${isComplete(item) ? ' is-complete' : ''}`
      button.setAttribute('aria-current', index === questionIndex && !freePractice ? 'step' : 'false')
      const number = document.createElement('span')
      number.className = 'step-number'
      number.textContent = isComplete(item) ? '✓' : String(index + 1)
      const label = document.createElement('span')
      label.textContent = item.title
      button.append(number, label)
      button.addEventListener('click', () => openRoute(topic.number, index + 1))
      stepper.append(button)
    })
    if (!freePractice) {
      const selected = $('.step-pill.is-current', stepper)
      if (selected) stepper.scrollLeft = Math.max(0, selected.offsetLeft - (stepper.clientWidth - selected.offsetWidth) / 2)
    }

    const title = $('#questionTitle')
    const meta = $('#questionMeta')
    const task = $('#questionTask')
    if (question) {
      title.textContent = question.title
      meta.textContent = `Question ${questionIndex + 1} of ${topic.questions.length} · ${question.goal}`
      task.textContent = question.task
      buildAnatomy(question)
      buildHints(question)
      updateChecklist(question, $('#commandInput').value)
      buildFilesystemMap(question)
    } else {
      title.textContent = 'Explore the simulated Linux machine'
      meta.textContent = 'Create folders, edit files, and try any supported command. Your changes are saved here.'
      task.textContent = 'Try help, then make a workspace with mkdir -p ~/projects/sandbox.'
      buildAnatomy(null)
      $('#hintList').replaceChildren()
      $('#checklist').replaceChildren()
      buildFilesystemMap(null)
    }
    updatePointsBadge()
    $('#nextQuestion').disabled = !question || !isUnlocked(question)
    $('#skipQuestion').disabled = !question || isUnlocked(question)
    $('#showSolution').disabled = !question || isComplete(question)
    $('#mobileNext').hidden = !question || !isUnlocked(question)
    $('#mobileSkip').disabled = !question || isUnlocked(question)
    $('#mobileSolution').disabled = !question || isComplete(question)
    $('#mobileHint').setAttribute('aria-label', 'Open hints and question checklist')
    $('#shellPrompt').textContent = shellPrompt()
    const freePracticeLink = $('#freePracticeNav')
    if (freePracticeLink) {
      freePracticeLink.textContent = freePractice ? 'Guided questions' : 'Free practice shell'
      freePracticeLink.href = freePractice ? `./lab.html?topic=${topic.number}&q=${questionIndex + 1}` : `./lab.html?topic=${topic.number}&q=${questionIndex + 1}&practice=1`
    }
    save()
  }

  function shellPrompt() {
    const home = shell.userHome()
    const path = shell.cwd === home ? '~' : shell.cwd.startsWith(`${home}/`) ? `~${shell.cwd.slice(home.length)}` : shell.cwd
    return `${shell.system.currentUser}@tse-lab:${path}$`
  }

  function showFeedback(message, type = '') {
    const box = $('#feedback')
    if (!box) return
    box.hidden = false
    box.className = `feedback${type ? ` ${type}` : ''}`
    box.replaceChildren()
    const lead = document.createElement('strong')
    const split = message.indexOf(' ')
    lead.textContent = split < 0 ? message : message.slice(0, split)
    box.append(lead, document.createTextNode(split < 0 ? '' : message.slice(split)))
  }

  function appendLine(text, kind = 'command-output') {
    if (!text) return
    const line = document.createElement('div')
    line.className = `terminal-line ${kind}`
    line.textContent = String(text)
    $('#terminalOutput').append(line)
    $('#terminalOutput').scrollTop = $('#terminalOutput').scrollHeight
  }

  function clearOutput() { $('#terminalOutput').replaceChildren() }

  function commandMatches(question, result) {
    if (!question || !result || result.code !== 0) return false
    return evaluateQuestion(question, shell, result).complete
  }

  function markComplete(question, assisted = false) {
    if (!question || isComplete(question)) return false
    const earned = assisted ? 0 : Number(question.points) || 10
    progress.completed[question.id] = { points: earned, assisted, completedAt: new Date().toISOString() }
    if (currentQuestion()?.id === question.id) $('#commandAnatomy').hidden = false
    updateProgressDisplays()
    updateTopicNavigationState()
    save()
    return true
  }

  function runCommand(value) {
    const command = value.trim()
    if (!command) return
    const question = freePractice ? null : currentQuestion()
    appendLine(`${shellPrompt()} ${command}`, 'command-line')
    lastResult = shell.run(command)
    if (lastResult.effect === 'clear') clearOutput()
    else {
      appendLine(lastResult.stdout, 'command-output')
      appendLine(lastResult.stderr, 'command-error')
    }
    $('#shellPrompt').textContent = shellPrompt()
    historyCursor = shell.history.length
    save()
    if (lastResult.effect?.type === 'editor') showEditor(lastResult.effect)

    if (question) {
      updateChecklist(question, '')
      if (commandMatches(question, lastResult)) {
        const assisted = Boolean(progress.solutionShown[question.id])
        markComplete(question, assisted)
        showFeedback(assisted ? `Correct. This question is complete with 0 points because you viewed its solution.` : `Correct. +${question.points} points. The requested result is in place.`, 'correct')
        $('#nextQuestion').disabled = false
        $('#skipQuestion').disabled = true
        $('#mobileNext').hidden = false
      } else if (lastResult.code !== 0) {
        const detail = lastResult.stderr || 'the requested result is not present yet'
        const evaluated = evaluateQuestion(question, shell, lastResult)
        const missingIndex = evaluated.checks.findIndex((check) => !check.complete)
        const requirement = missingIndex >= 0 ? friendlyCheck(question.checks[missingIndex]) : 'the requested result'
        showFeedback(`Close. ${detail}. Fix this requirement: ${requirement}.`, 'wrong')
      } else {
        const evaluated = evaluateQuestion(question, shell, lastResult)
        const missingIndex = evaluated.checks.findIndex((check) => !check.complete)
        const requirement = missingIndex >= 0 ? friendlyCheck(question.checks[missingIndex]) : 'the requested result'
        const rule = question.checks[missingIndex]
        const fix = rule?.type === 'output' && rule.includes
          ? `Aim the command at the requested file or directory so its output includes “${rule.includes}”.`
          : rule?.type === 'fs' && rule.exists
            ? `Create or copy the requested result to ${rule.path}${rule.nodeType === 'dir' ? ' as a directory' : ''}.`
            : 'Adjust the command or path until this requirement is true.'
        showFeedback(`Close. The command ran, but ${requirement.toLowerCase()} is not true yet. ${fix}`, 'hint')
      }
    } else if (lastResult.code !== 0) {
      showFeedback(`${lastResult.stderr || 'The command could not run.'} Check the command name and paths, then try again.`, 'wrong')
    } else {
      showFeedback('Command complete. Changes stay inside this simulated practice machine.', 'correct')
    }
    buildFilesystemMap(question)
  }

  function showEditor(effect) {
    const dialog = $('#editorDialog')
    if (!dialog) {
      showFeedback('The built-in editor is unavailable on this page. Use echo or printf to write this file.', 'wrong')
      return
    }
    $('#editorTitle').textContent = effect.path
    $('#editorText').value = effect.data || ''
    dialog.showModal()
    $('#editorText').focus()
  }

  function saveEditor() {
    const message = shell.saveEditor($('#editorText').value)
    appendLine(message, message.startsWith('nano:') ? 'command-error' : 'command-output')
    $('#editorDialog').close()
    save()
    const question = freePractice ? null : currentQuestion()
    if (question && commandMatches(question, { code: 0 })) {
      const assisted = Boolean(progress.solutionShown[question.id])
      markComplete(question, assisted)
      showFeedback(assisted ? 'Correct. This question is complete with 0 points because you viewed its solution.' : `Correct. +${question.points} points. The requested file is saved.`, 'correct')
      $('#nextQuestion').disabled = false
      $('#mobileNext').hidden = false
    }
    $('#commandInput').focus()
  }

  function nextQuestion() {
    const question = currentQuestion()
    if (!question || !isUnlocked(question)) return
    if (questionIndex < currentTopic().questions.length - 1) openRoute(topicIndex + 1, questionIndex + 2)
    else if (topicIndex < topics.length - 1) openRoute(topicIndex + 2, 1)
    else window.location.assign('./index.html')
    $('#commandInput')?.focus()
  }

  function revealSolution() {
    const question = currentQuestion()
    if (!question || isComplete(question)) return
    if (!window.confirm('Show the suggested command? This completes the question with 0 points.')) return
    progress.solutionShown[question.id] = true
    markComplete(question, true)
    renderPractice()
    showFeedback('Solution shown. This question is complete and earns 0 points. You can still practise the command in the terminal.', 'hint')
    $('#nextQuestion').disabled = false
    $('#mobileNext').hidden = false
  }

  function skipQuestion() {
    const question = currentQuestion()
    if (!question || isUnlocked(question)) return
    progress.skipped[question.id] = true
    save()
    $('#nextQuestion').disabled = false
    $('#skipQuestion').disabled = true
    $('#mobileNext').hidden = false
    showFeedback('Skipped. You can return with the question stepper; no points were added.', 'hint')
  }

  function resetLab() {
    if (!window.confirm('Reset all saved Linux lab progress and the simulated filesystem in this browser?')) return
    localStorage.removeItem(PROGRESS_KEY)
    localStorage.removeItem(FILESYSTEM_KEY)
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
    progress = { completed: {}, skipped: {}, hints: {}, solutionShown: {}, lastTopic: 1, lastQuestion: 1 }
    shell = new Shell()
    lastResult = null
    clearOutput()
    if ($('#commandInput')) $('#commandInput').value = ''
    if (page === 'overview') renderOverview()
    else openRoute(1, 1, { push: true })
    if ($('#terminalOutput')) appendLine('Welcome to the TSE Linux lab. Type help or start with the task above.', 'terminal-muted')
  }

  function completePath() {
    const input = $('#commandInput')
    const value = input.value
    const cursor = input.selectionStart
    const before = value.slice(0, cursor)
    const tokenStart = before.search(/\S+$/)
    if (tokenStart < 0) return
    const token = before.slice(tokenStart)
    const firstWord = before.trim().split(/\s+/).length === 1
    const candidates = firstWord && !token.includes('/')
      ? LAB_COMMANDS.filter((name) => name.startsWith(token))
      : (() => {
        const slash = token.lastIndexOf('/')
        const parentPart = slash >= 0 ? token.slice(0, slash + 1) : ''
        const leaf = token.slice(slash + 1)
        const directory = parentPart ? shell.normalize(parentPart) : shell.cwd
        const node = shell.node(directory)
        return Object.entries(node?.children || {}).filter(([name]) => name.startsWith(leaf)).map(([name, item]) => `${parentPart}${name}${item.type === 'dir' ? '/' : ''}`)
      })()
    if (!candidates.length) return
    let replacement = candidates[0]
    if (candidates.length > 1) {
      let common = candidates[0]
      while (!candidates.every((candidate) => candidate.startsWith(common))) common = common.slice(0, -1)
      replacement = common.length > token.length ? common : token
      appendLine(candidates.join('  '), 'terminal-muted')
    } else if (!replacement.endsWith('/')) replacement += ' '
    input.value = `${value.slice(0, tokenStart)}${replacement}${value.slice(cursor)}`
    input.setSelectionRange(tokenStart + replacement.length, tokenStart + replacement.length)
  }

  function onCommandKeydown(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      historyCursor = Math.max(0, historyCursor - 1)
      $('#commandInput').value = shell.history[historyCursor] || ''
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      historyCursor = Math.min(shell.history.length, historyCursor + 1)
      $('#commandInput').value = shell.history[historyCursor] || ''
    } else if (event.key === 'Tab') {
      event.preventDefault()
      completePath()
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault()
      clearOutput()
    }
  }

  function closeTopicDrawer() {
    document.body.classList.remove('drawer-open')
    $('#menuTopics')?.setAttribute('aria-expanded', 'false')
    $('#drawerBackdrop')?.setAttribute('hidden', '')
  }
  function openInfoPanels() {
    document.body.classList.add('panels-open')
    $('#infoBackdrop').hidden = false
    $('#mobileHint').setAttribute('aria-expanded', 'true')
    $('#closePanels').focus()
  }
  function closeInfoPanels() {
    document.body.classList.remove('panels-open')
    $('#infoBackdrop').hidden = true
    $('#mobileHint').setAttribute('aria-expanded', 'false')
  }

  if (page === 'overview') {
    renderOverview()
    $('#resetOverview')?.addEventListener('click', resetLab)
    window.addEventListener('storage', (event) => { if ([PROGRESS_KEY, FILESYSTEM_KEY].includes(event.key)) renderOverview() })
    return
  }

  const initialParams = new URLSearchParams(location.search)
  const initialTopic = Number(initialParams.get('topic')) || Number(progress.lastTopic) || 1
  const initialQuestion = Number(initialParams.get('q')) || Number(progress.lastQuestion) || 1
  freePractice = initialParams.get('practice') === '1'
  openRoute(initialTopic, initialQuestion, { push: false, practice: freePractice })
  $('#terminalOutput').replaceChildren()
  appendLine('Welcome to the TSE Linux lab. Type help or start with the task above.', 'terminal-muted')

  $('#terminalForm').addEventListener('submit', (event) => {
    event.preventDefault()
    const input = $('#commandInput')
    const value = input.value
    input.value = ''
    runCommand(value)
    input.focus()
  })
  $('#commandInput').addEventListener('keydown', onCommandKeydown)
  $('#commandInput').addEventListener('input', () => updateChecklist(freePractice ? null : currentQuestion(), $('#commandInput').value))
  $('#clearTerminal').addEventListener('click', () => { clearOutput(); $('#commandInput').focus() })
  $('#skipQuestion').addEventListener('click', skipQuestion)
  $('#showSolution').addEventListener('click', revealSolution)
  $('#mobileSkip').addEventListener('click', () => { skipQuestion(); closeInfoPanels() })
  $('#mobileSolution').addEventListener('click', () => { revealSolution(); closeInfoPanels() })
  $('#nextQuestion').addEventListener('click', nextQuestion)
  $('#mobileNext').addEventListener('click', nextQuestion)
  $('#mobileRun').addEventListener('click', () => $('#terminalForm').requestSubmit())
  $('#mobileHint').addEventListener('click', openInfoPanels)
  $('#closePanels').addEventListener('click', closeInfoPanels)
  $('#infoBackdrop').addEventListener('click', closeInfoPanels)
  $('#resetLab').addEventListener('click', resetLab)
  $('#menuTopics').addEventListener('click', () => {
    document.body.classList.add('drawer-open')
    $('#drawerBackdrop').removeAttribute('hidden')
    $('#menuTopics').setAttribute('aria-expanded', 'true')
    $('.sidebar').focus()
  })
  $('#drawerBackdrop').addEventListener('click', closeTopicDrawer)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTopicDrawer()
      closeInfoPanels()
    }
  })
  $('#freePracticeNav').addEventListener('click', (event) => {
    event.preventDefault()
    openRoute(topicIndex + 1, questionIndex + 1, { practice: !freePractice })
  })
  $('#editorForm')?.addEventListener('submit', (event) => { event.preventDefault(); saveEditor() })
  $('#editorCancel')?.addEventListener('click', () => { shell.cancelEditor(); $('#editorDialog').close(); $('#commandInput').focus() })
  $('#editorDialog')?.addEventListener('cancel', () => shell.cancelEditor())
  $('#editorText')?.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'o') { event.preventDefault(); saveEditor() }
  })
  $$('.mobile-quick-keys button').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.key
    if (key === 'Tab') completePath()
    else if (key === 'ArrowUp') { historyCursor = Math.max(0, historyCursor - 1); $('#commandInput').value = shell.history[historyCursor] || '' }
    else if (key === 'ArrowDown') { historyCursor = Math.min(shell.history.length, historyCursor + 1); $('#commandInput').value = shell.history[historyCursor] || '' }
    else if (key === 'Ctrl') clearOutput()
    else {
      const input = $('#commandInput')
      const start = input.selectionStart ?? input.value.length
      const end = input.selectionEnd ?? input.value.length
      input.value = `${input.value.slice(0, start)}${key}${input.value.slice(end)}`
      input.setSelectionRange(start + key.length, start + key.length)
      input.focus()
    }
  }))
  window.addEventListener('popstate', (event) => {
    const params = new URLSearchParams(location.search)
    openRoute(event.state?.topic || params.get('topic') || 1, event.state?.question || params.get('q') || 1, { push: false, practice: event.state?.practice ?? params.get('practice') === '1' })
  })
  window.addEventListener('storage', (event) => {
    if (event.key === PROGRESS_KEY) {
      const next = readJson(PROGRESS_KEY, progress)
      if (next) progress = { ...progress, ...next }
      renderPractice()
    }
  })
  window.addEventListener('resize', updatePointsBadge)
}

start().catch((error) => {
  const target = document.querySelector('main') || document.body
  const notice = document.createElement('p')
  notice.className = 'load-error'
  notice.setAttribute('role', 'alert')
  notice.textContent = `The Linux practice lab could not start: ${error.message}`
  target.prepend(notice)
})
