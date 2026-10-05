import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { Shell, LAB_COMMANDS } from '../public/linux-lab/js/terminal.js'
import { evaluateQuestion, previewCommand } from '../public/linux-lab/js/validator.js'

const here = dirname(fileURLToPath(import.meta.url))
const lab = resolve(here, '../public/linux-lab')
const catalog = JSON.parse(readFileSync(resolve(lab, 'data/questions.json'), 'utf8'))
const topics = catalog.topics
const questions = topics.flatMap((topic) => topic.questions)

function solveReference(shell, question) {
  let result = shell.run(question.solution)
  assert.equal(result.code, 0, `${question.title}: ${result.stderr || result.stdout}`)
  if (result.effect?.type === 'editor') {
    const expected = question.checks.find((check) => check.type === 'fs' && check.contains)?.contains || 'TEAM TSE practice note'
    const saved = shell.saveEditor(`${expected}\n`)
    assert.match(saved, /^Saved /, `${question.title}: built-in editor saves to the simulated filesystem`)
    result = { code: 0, stdout: saved, stderr: '' }
  }
  const evaluation = evaluateQuestion(question, shell, result)
  assert.ok(evaluation.complete, `${question.title}: unsatisfied checks ${JSON.stringify(evaluation.checks)}`)
}

test('question catalog follows the 15 topic syllabus and has 75 questions', () => {
  const syllabus = readFileSync(resolve(lab, '../../src/data/linux-course.js'), 'utf8')
  const syllabusTopics = Array.from(syllabus.matchAll(/topic\(\d+,\s*'([^']+)',\s*'([^']+)'/g), (match) => ({ id: match[1], title: match[2] }))
  assert.deepEqual(topics.map(({ id, title }) => ({ id, title })), syllabusTopics)
  assert.equal(topics.length, 15)
  assert.ok(topics.every((topic) => topic.questions.length === 5))
  assert.equal(questions.length, 75)
  assert.equal(new Set(questions.map((question) => question.id)).size, 75)
  assert.ok(questions.every((question) => question.hints.length === 3 && question.points === 10))
  assert.equal(catalog.totalPoints, 750)
})

test('guided prompts describe work outcomes without giving the solution commands away', () => {
  const commandNames = ['pwd', 'cd', 'ls', 'mkdir', 'cp', 'mv', 'rm', 'cat', 'head', 'tail', 'grep', 'nano', 'chmod', 'find', 'sudo', 'useradd', 'df', 'free', 'uname', 'hostnamectl', 'lscpu', 'tar', 'apt', 'ssh', 'scp', 'tee', 'top', 'pgrep', 'jobs', 'whoami']
  for (const question of questions) {
    const prompt = [question.title, question.goal, question.task, ...question.hints].join(' ')
    if (/\s/.test(question.solution)) assert.ok(!prompt.includes(question.solution), `${question.id}: prompt contains its full solution`)
    for (const command of commandNames) {
      const directInstruction = new RegExp(`\\b(?:use|run|type|try|enter|start with)\\s+(?:sudo\\s+)?${command}\\b`, 'i')
      assert.ok(!directInstruction.test(prompt), `${question.id}: prompt gives away ${command}`)
    }
  }
  const app = readFileSync(resolve(lab, 'js/app.js'), 'utf8')
  assert.match(app, /container\.hidden = !question \|\| !isComplete\(question\)/)
})

test('every guided solution satisfies its result checks on a fresh machine', () => {
  const failures = []
  for (const question of questions) {
    try { solveReference(new Shell(), question) }
    catch (failure) { failures.push(`${question.id}: ${failure.message}`) }
  }
  assert.deepEqual(failures, [])
})

test('all guided solutions also work in sequence on one saved machine', () => {
  const shell = new Shell()
  for (const question of questions) solveReference(shell, question)
  assert.equal(shell.system.packages.includes('htop'), true)
  assert.equal(shell.system.remotes.web01.files['/home/deploy/weekly-report.txt'].includes('Week 1'), true)
  assert.equal(shell.node('/home/user/projects/website/staging.html')?.data.includes('Staging environment'), true)
})

test('the advertised command list maps to simulated implementations', () => {
  const shell = new Shell()
  const missing = LAB_COMMANDS.filter((command) => command !== 'sudo' && typeof shell.commands[command] !== 'function')
  assert.deepEqual(missing, [])
  assert.equal(shell.run('help').code, 0)
  assert.match(shell.run('man find').stdout, /-name GLOB/)
  assert.match(shell.run('definitely-not-a-linux-command').stderr, /command not found: definitely-not-a-linux-command\. Try help\./)
})

test('filesystem workflows, command history, and saved machine state work together', () => {
  const shell = new Shell()
  const commands = [
    'mkdir -p ~/projects/free-play/nested',
    "printf 'second\\nfirst\\n' > ~/projects/free-play/nested/input.txt",
    'sort ~/projects/free-play/nested/input.txt | tee ~/projects/free-play/nested/sorted.txt',
    'grep -n first ~/projects/free-play/nested/sorted.txt',
    'cp ~/projects/free-play/nested/sorted.txt ~/projects/free-play/copied.txt',
    'mv ~/projects/free-play/copied.txt ~/projects/free-play/renamed.txt',
    'chmod 600 ~/projects/free-play/renamed.txt',
    'ln -s ~/projects/free-play/renamed.txt ~/projects/free-play/link.txt',
  ]
  for (const command of commands) assert.equal(shell.run(command).code, 0, command)
  assert.match(shell.node('/home/user/projects/free-play/nested/sorted.txt').data, /^first\nsecond\n$/)
  assert.equal(shell.node('/home/user/projects/free-play/renamed.txt').mode, '600')
  assert.deepEqual(shell.run('history').code, 0)
  assert.equal(shell.run('readlink ~/projects/free-play/link.txt').code, 0)
  assert.equal(shell.run('rm -rf /').code, 1)
  assert.equal(shell.node('/'), shell.root)

  const restored = new Shell(JSON.parse(JSON.stringify(shell.exportState())))
  assert.equal(restored.node('/home/user/projects/free-play/nested/sorted.txt').data, 'first\nsecond\n')
  assert.equal(restored.run('pwd').stdout, '/home/user')
})

test('SSH, SCP, users, services, and packages stay inside the simulated machine', () => {
  const shell = new Shell()
  assert.equal(shell.run('mkdir /root/student-data').code, 1)
  assert.equal(shell.run('sudo mkdir /root/student-data').code, 0)
  assert.equal(shell.run('apt install htop').code, 1)
  assert.equal(shell.run('sudo apt install htop').code, 0)
  assert.equal(shell.run('sudo systemctl stop nginx').code, 0)
  assert.equal(shell.system.services.nginx, 'inactive')
  assert.equal(shell.run('curl http://web01/health').stdout, 'ok')
  assert.match(shell.run('ssh user@web01').stdout, /Welcome to web01/)
  shell.run('printf data > ~/Documents/upload.txt')
  assert.equal(shell.run('scp -P 2222 ~/Documents/upload.txt deploy@app01:/home/deploy/upload.txt').code, 0)
  assert.equal(shell.system.remotes.app01.files['/home/deploy/upload.txt'], 'data')
  assert.equal(shell.run('useradd outside-sudo').code, 1)
  assert.equal(shell.run('sudo useradd -m analyst').code, 0)
  assert.match(shell.node('/etc/passwd').data, /^.*analyst:x:/m)
  assert.ok(shell.node('/home/analyst'))
})

test('SCP checklist previews source and destination without requiring exact spacing', () => {
  const question = topics[14].questions[1]
  const shell = new Shell()
  const checklist = previewCommand(question, 'scp web01:/home/deploy/README.txt ~/Downloads/remote-README.txt', shell)
  assert.equal(checklist.length, 3)
  assert.ok(checklist.every((item) => item.complete))
})

test('both screens include the browser controller selectors and static assets', () => {
  const pages = ['index.html', 'lab.html'].map((name) => readFileSync(resolve(lab, name), 'utf8'))
  const markup = pages.join('\n')
  const app = readFileSync(resolve(lab, 'js/app.js'), 'utf8')
  const ids = new Set(Array.from(markup.matchAll(/\bid="([^"]+)"/g), (match) => match[1]))
  const selectors = Array.from(app.matchAll(/\$\('#([^']+)'\)/g), (match) => match[1])
  assert.deepEqual([...new Set(selectors.filter((id) => !ids.has(id)))], [])
  assert.ok(pages.every((html) => html.includes('./css/styles.css') && html.includes('./js/app.js')))
  for (const file of ['css/styles.css', 'js/app.js', 'js/terminal.js', 'js/validator.js', 'data/questions.json', 'README.md']) {
    assert.ok(readFileSync(resolve(lab, file), 'utf8').length > 0, `${file} exists`)
  }
  assert.match(pages[1], /aria-live="polite"/)
  assert.match(pages[1], /id="terminalForm"/)
  assert.match(pages[1], /id="editorDialog"/)
})
