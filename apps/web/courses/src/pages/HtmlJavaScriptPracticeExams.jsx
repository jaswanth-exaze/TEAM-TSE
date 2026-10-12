import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HTML_JS_EXAMS, HTML_JS_EXAM_POLICY } from '../data/html-css-javascript-practice-exams'
import { appStorageKey } from '../lib/storage'

const examsPath = '/study/html-css-javascript/exams'
const coursePath = '/course/html-css-javascript'

function readDrafts(examId) {
  try {
    const saved = JSON.parse(localStorage.getItem(appStorageKey(`html-js-mock:${examId}`)))
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

function ExamCard({ exam }) {
  const consoleTasks = exam.tasks.filter((item) => item.consoleRequired).length
  return (
    <Link to={`${examsPath}/${exam.id}`} className="group flex min-h-56 flex-col rounded-xl border border-white/10 bg-white/[0.025] p-5 transition-colors hover:border-indigo-200/30 hover:bg-white/[0.045]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200">Exam {exam.number} · {exam.weeks}</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-white">{exam.title}</h2>
        </div>
        <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/60">15 tasks</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/70">{exam.covers}</p>
      <p className="mt-3 text-xs text-white/50">60 minutes · {consoleTasks} browser console tasks</p>
      <span className="mt-auto pt-5 text-sm font-medium text-indigo-200 group-hover:text-white">Open practice exam →</span>
    </Link>
  )
}

function TaskCard({ exam, task, draft, onChange }) {
  const answerId = `solution-${exam.id}-${task.id}`
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-200">Task {String(task.number).padStart(2, '0')}</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-white">{task.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60">{task.language}</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60">4 min</span>
          {task.consoleRequired && <span className="rounded-full border border-sky-200/20 bg-sky-200/[0.05] px-2.5 py-1 text-xs text-sky-100/80">Run in console</span>}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/75">{task.prompt}</p>
      <label htmlFor={`draft-${exam.id}-${task.id}`} className="mt-5 block text-xs font-medium text-white/60">Your working</label>
      <textarea
        id={`draft-${exam.id}-${task.id}`}
        value={draft || ''}
        onChange={(event) => onChange(task.id, event.target.value)}
        rows={Math.max(5, Math.min(12, task.prompt.split('\n').length + 2))}
        spellCheck="false"
        autoCapitalize="off"
        autoCorrect="off"
        className="code-surface mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#090c12] p-3 font-mono text-xs leading-5 text-emerald-100/90 outline-none placeholder:text-white/25 focus:border-indigo-200/50 focus:ring-2 focus:ring-indigo-200/10"
        placeholder="Write your solution before revealing the example…"
      />
      <details className="mt-4 rounded-lg border border-emerald-200/15 bg-emerald-200/[0.025]">
        <summary aria-controls={answerId} className="cursor-pointer px-3.5 py-3 text-sm font-medium text-emerald-100/90">Show one possible answer</summary>
        <div id={answerId} className="border-t border-emerald-200/10 p-3.5">
          <pre className="overflow-x-auto whitespace-pre rounded-md bg-black/20 p-3 text-xs leading-5 text-emerald-100/90"><code>{task.solution}</code></pre>
          {task.note && <p className="mt-3 text-sm leading-6 text-white/65">{task.note}</p>}
          <p className="mt-3 text-xs leading-5 text-white/50">Other correct solutions are acceptable.</p>
        </div>
      </details>
    </article>
  )
}

function ExamLibrary() {
  return (
    <main className="learning-surface w-full px-4 py-7 sm:px-6 sm:py-10 lg:px-10 2xl:px-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={coursePath} className="text-sm text-white/65 hover:text-white">← Module 4 syllabus</Link>
        <Link to="/quiz/html-css-javascript" className="text-sm text-indigo-200 hover:text-white">Short module quiz</Link>
      </div>
      <header className="mt-8 max-w-4xl border-b border-white/10 pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.17em] text-indigo-200">HTML + CSS + JavaScript · Hands-on practice</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Five practice exams</h1>
        <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">Work through the tasks in the browser. Each exam follows the supplied two-week sequence and includes a private draft space with answers you can reveal when you are ready.</p>
      </header>

      <section className="mt-6 rounded-xl border border-sky-200/15 bg-sky-200/[0.035] p-4 sm:p-5" aria-labelledby="exam-rules">
        <h2 id="exam-rules" className="font-display text-base font-semibold text-sky-100">How to use these practice exams</h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-white/70 md:grid-cols-2">
          <li>{HTML_JS_EXAM_POLICY.format}</li>
          <li>{HTML_JS_EXAM_POLICY.attempts}</li>
          <li>{HTML_JS_EXAM_POLICY.grading}</li>
          <li>{HTML_JS_EXAM_POLICY.savedWork}</li>
        </ul>
        <p className="mt-3 border-t border-sky-100/10 pt-3 text-sm leading-6 text-sky-100/75">{HTML_JS_EXAM_POLICY.console}</p>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="HTML, CSS and JavaScript practice exams">
        {HTML_JS_EXAMS.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
      </section>
    </main>
  )
}

function ExamWorksheet({ exam }) {
  const [drafts, setDrafts] = useState(() => readDrafts(exam.id))
  const examIndex = HTML_JS_EXAMS.findIndex((item) => item.id === exam.id)
  const previous = HTML_JS_EXAMS[examIndex - 1]
  const next = HTML_JS_EXAMS[examIndex + 1]
  const consoleTasks = exam.tasks.filter((task) => task.consoleRequired).length

  function updateDraft(taskId, value) {
    const updated = { ...drafts, [taskId]: value }
    setDrafts(updated)
    try {
      localStorage.setItem(appStorageKey(`html-js-mock:${exam.id}`), JSON.stringify(updated))
    } catch {
      // Keep the current work in memory if browser storage is unavailable.
    }
  }

  return (
    <main className="learning-surface w-full px-4 py-7 sm:px-6 sm:py-10 lg:px-10 2xl:px-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={examsPath} className="text-sm text-white/65 hover:text-white">← All five practice exams</Link>
        <Link to={coursePath} className="text-sm text-indigo-200 hover:text-white">Module 4 syllabus</Link>
      </div>
      <header className="mt-7 border-b border-white/10 pb-6 sm:pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">{exam.weeks} · Exam {exam.number}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{exam.title}</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">{exam.covers}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">15 tasks</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">60 minutes · 4 minutes per task</span>
          <span className="rounded-full border border-sky-200/15 px-3 py-1 text-xs text-sky-100/75">{consoleTasks} console tasks</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">Practice only · no official attempt used</span>
        </div>
      </header>

      <aside className="mt-5 rounded-lg border border-sky-200/15 bg-sky-200/[0.03] px-4 py-3 text-sm leading-6 text-white/70">
        {HTML_JS_EXAM_POLICY.console}
      </aside>
      <p className="mt-4 text-xs leading-5 text-white/50">Drafts save in this browser on this device. This worksheet does not run or grade your code. Reveal an example after attempting the task; working alternatives count.</p>

      <div className="mt-5 space-y-4">
        {exam.tasks.map((task) => <TaskCard key={task.id} exam={exam} task={task} draft={drafts[task.id]} onChange={updateDraft} />)}
      </div>

      <nav aria-label="Exam navigation" className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
        {previous ? <Link to={`${examsPath}/${previous.id}`} className="text-sm text-white/70 hover:text-white">← Exam {previous.number}: {previous.weeks}</Link> : <span />}
        {next ? <Link to={`${examsPath}/${next.id}`} className="text-sm font-medium text-indigo-200 hover:text-white">Exam {next.number}: {next.weeks} →</Link> : <Link to={coursePath} className="text-sm font-medium text-indigo-200 hover:text-white">Back to Module 4 syllabus →</Link>}
      </nav>
    </main>
  )
}

export default function HtmlJavaScriptPracticeExams() {
  const { examId } = useParams()
  if (!examId) return <ExamLibrary />
  const exam = HTML_JS_EXAMS.find((item) => item.id === examId)
  if (!exam) {
    return <main className="learning-surface w-full px-4 py-16 text-center sm:px-6 lg:px-10">
      <h1 className="font-display text-2xl font-semibold text-white">Practice exam not found</h1>
      <Link to={examsPath} className="mt-4 inline-block text-sm text-indigo-200 hover:text-white">Browse the five exams</Link>
    </main>
  }
  return <ExamWorksheet key={exam.id} exam={exam} />
}
