import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMysqlExam, MYSQL_EXAMS } from '../data/mysql-practice-exams'
import { getSqlVisualLabHref } from '../lib/paths'
import { appStorageKey } from '../lib/storage'

function loadDrafts(examId) {
  try {
    return JSON.parse(localStorage.getItem(appStorageKey(`mysql-mock:${examId}`))) || {}
  } catch {
    return {}
  }
}

function ExamCard({ exam }) {
  return (
    <Link to={`/study/mysql/exams/${exam.id}`} className="group rounded-lg border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-indigo-300/35 hover:bg-white/[0.055]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">{exam.label} · {exam.newTopics}</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-white">{exam.title}</h3>
        </div>
        <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/55">{exam.tasks.length} tasks</span>
      </div>
      <p className="mt-3 text-xs text-white/45">Coverage: {exam.topicCount}</p>
      <p className="mt-2 text-sm leading-6 text-white/55">{exam.description}</p>
      <span className="mt-5 inline-flex text-sm font-medium text-indigo-300 transition group-hover:text-indigo-200">Open mock exam →</span>
    </Link>
  )
}

function ExamTask({ task, answer, onChange }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-white">{task.title}</h3>
      <p className="mt-3 rounded-lg border border-white/8 bg-black/15 px-3 py-2 font-mono text-xs leading-5 text-sky-100/75">{task.tables}</p>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/70">{task.prompt}</p>
      <label className="mt-4 block text-xs font-medium text-white/45" htmlFor={`answer-${task.id}`}>Your SQL</label>
      <textarea
        id={`answer-${task.id}`}
        value={answer || ''}
        onChange={(event) => onChange(task.id, event.target.value)}
        rows={Math.max(5, Math.min(10, task.prompt.split('\n').length + 2))}
        spellCheck="false"
        autoCapitalize="off"
        autoCorrect="off"
        className="code-surface mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#090c12] p-3 font-mono text-xs leading-5 text-emerald-100/85 outline-none transition placeholder:text-white/20 focus:border-indigo-300/50 focus:ring-2 focus:ring-indigo-300/10"
        placeholder="Write your query before opening the example solution…"
      />
      <details className="mt-4 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.035]">
        <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-emerald-200/85">Show one possible solution</summary>
        <div className="border-t border-emerald-300/10 p-3">
          <pre className="overflow-x-auto text-xs leading-5 text-emerald-100/85"><code>{task.solution}</code></pre>
          {task.note && <p className="mt-3 text-xs leading-5 text-white/50">{task.note}</p>}
        </div>
      </details>
    </article>
  )
}

export default function PracticeExams() {
  const { examId } = useParams()
  const exam = examId ? getMysqlExam(examId) : null
  const [drafts, setDrafts] = useState(() => loadDrafts(examId || 'overview'))

  function updateDraft(taskId, value) {
    const next = { ...drafts, [taskId]: value }
    setDrafts(next)
    localStorage.setItem(appStorageKey(`mysql-mock:${examId || 'overview'}`), JSON.stringify(next))
  }

  if (examId && !exam) {
    return (
      <main className="learning-surface w-full px-4 py-16 text-center sm:px-6 lg:px-10">
        <p className="text-sm text-white/50">That MySQL mock exam was not found.</p>
        <Link to="/study/mysql/exams" className="mt-4 inline-block text-indigo-300 hover:text-indigo-200">Browse practice exams</Link>
      </main>
    )
  }

  if (!exam) {
    return (
      <main className="learning-surface w-full px-4 py-7 sm:px-6 sm:py-10 lg:px-10 2xl:px-14">
        <Link to="/study/mysql" className="text-sm text-white/50 transition hover:text-white">← MySQL study guide</Link>
        <header className="mt-7 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Write queries, then review</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">MySQL practice exams</h1>
          <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
            These are self-check worksheets built around the supplied cumulative syllabus. Write a query before revealing the example solution; your drafts stay in this browser.
          </p>
        </header>

        <div className="mt-6 rounded-xl border border-sky-300/15 bg-sky-300/[0.04] p-4 text-sm leading-6 text-sky-100/70">
          Official assessments are live query-writing sessions with no external aids. The browser mocks below do not run or grade SQL and do not use up official attempts. For a closer simulation, close your notes and source links before starting.
        </div>

        <a href={getSqlVisualLabHref()} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.055] p-4 transition hover:border-amber-300/35 hover:bg-amber-300/[0.08]">
          <span>
            <span className="block text-sm font-semibold text-amber-100">Practice SQL visually</span>
            <span className="mt-1 block text-sm text-white/65">Run queries against a sample database and follow each step.</span>
          </span>
          <span className="text-sm font-medium text-amber-200">Open Visual SQL Lab →</span>
        </a>

        <section aria-label="Available MySQL practice exams" className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MYSQL_EXAMS.map((item) => <ExamCard key={item.id} exam={item} />)}
        </section>
        <section className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
          <Link to="/quiz/mysql" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white/75 transition hover:bg-white/10">Take the interactive 52-question quiz</Link>
          <Link to="/study/mysql" className="rounded-lg bg-[var(--action-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--action-primary-fg)] transition-colors hover:bg-[var(--action-primary-hover)]">Return to lessons</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="learning-surface w-full px-4 py-7 sm:px-6 sm:py-10 lg:px-10 2xl:px-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/study/mysql/exams" className="text-sm text-white/50 transition hover:text-white">← All MySQL mock exams</Link>
        <Link to="/study/mysql" className="text-sm text-indigo-300 transition hover:text-indigo-200">Study guide</Link>
      </div>
      <header className="mt-7 border-b border-white/10 pb-6 sm:pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">{exam.label} · {exam.newTopics}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{exam.title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">{exam.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">{exam.topicCount}</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">{exam.tasks.length} query-writing tasks</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">Practice only · no official attempt used</span>
        </div>
      </header>

      <p className="mt-5 text-xs leading-5 text-white/40">Write each query first, then open the example solution. Example solutions are not the only valid answers. Your drafts are saved locally on this device.</p>
      <div className="mt-5 space-y-4">
        {exam.tasks.map((task) => (
          <ExamTask key={task.id} task={task} answer={drafts[task.id]} onChange={updateDraft} />
        ))}
      </div>
      <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
        <Link to="/study/mysql/exams" className="text-sm text-white/50 transition hover:text-white">← Choose another part</Link>
        <Link to="/quiz/mysql" className="text-sm text-indigo-300 transition hover:text-indigo-200">Continue with mixed MySQL quiz →</Link>
      </div>
    </main>
  )
}
