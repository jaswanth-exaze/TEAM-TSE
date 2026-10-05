import { useState } from 'react'
import { Link } from 'react-router-dom'
import NodeMarkdown from './NodeMarkdown'
import overviewMarkdown from '../data/courses/node-js/lessons/overview.md?raw'
import { NODE_PARTS, NODE_TOPICS } from '../data/courses/node-js'
import { appStorageKey } from '../lib/storage'

const progressKey = appStorageKey('study:node-js:v1')

function readCompleted() {
  try {
    const value = JSON.parse(localStorage.getItem(progressKey))
    return Array.isArray(value) ? value.filter((id) => NODE_TOPICS.some((topic) => topic.id === id)) : []
  } catch {
    return []
  }
}

function PartPill({ children }) {
  return <span className="rounded-full border border-indigo-200/20 bg-indigo-200/[0.06] px-2.5 py-1 text-[11px] font-medium text-indigo-100/85">{children}</span>
}

export default function NodeStudyGuide({ module }) {
  const [completed] = useState(readCompleted)
  const doneCount = NODE_TOPICS.filter((topic) => completed.includes(topic.id)).length
  const nextTopic = NODE_TOPICS.find((topic) => !completed.includes(topic.id)) || NODE_TOPICS[0]
  const completion = Math.round((doneCount / NODE_TOPICS.length) * 100)

  return <main className="learning-surface w-full px-4 py-6 sm:px-6 sm:py-9 lg:px-10 2xl:px-14">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link to="/" className="text-sm font-medium text-white/75 transition hover:text-white">← Home</Link>
      <nav aria-label="Course links" className="flex flex-wrap items-center gap-4">
        <Link to={`/quiz/${module.id}`} className="text-sm text-white/70 transition hover:text-white">Optional quiz</Link>
      </nav>
    </div>

    <header className="mb-7 rounded-2xl border border-emerald-200/15 bg-gradient-to-br from-emerald-200/[0.08] via-white/[0.025] to-indigo-200/[0.04] p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200/25 bg-emerald-200/[0.08] px-2.5 py-1 text-xs font-medium text-emerald-100">BEGINNER PROJECT COURSE</span>
        <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70">Windows &amp; macOS</span>
        <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70">26 lessons</span>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-white/75 sm:text-base sm:leading-7">Learn Node.js by building one Task Manager API. Work through each lesson in order, type the examples, and keep extending the same project.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-white/65"><span>Your lesson progress</span><span>{doneCount} of {NODE_TOPICS.length} completed</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Node.js course progress" aria-valuemin={0} aria-valuemax={NODE_TOPICS.length} aria-valuenow={doneCount}><div className="h-full rounded-full bg-emerald-300 transition-[width]" style={{ width: `${completion}%` }} /></div>
        </div>
        {nextTopic && <Link to={`/course/${module.id}/topic/${nextTopic.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">{doneCount === NODE_TOPICS.length ? 'Review lessons' : doneCount ? 'Continue learning' : 'Start lesson 1'} <span aria-hidden="true">→</span></Link>}
      </div>
    </header>

    <section className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.015] px-4 py-5 sm:px-7 sm:py-7" aria-label="Course introduction">
      <NodeMarkdown content={overviewMarkdown} />
    </section>

    <section aria-labelledby="node-course-content">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Course contents</p>
          <h2 id="node-course-content" className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">Choose a lesson</h2>
        </div>
        <p className="text-sm text-white/65">Follow the parts in order; each one builds on the previous work.</p>
      </div>

      <div className="space-y-8">
        {NODE_PARTS.map((part) => <section key={part.id} id={`part-${part.id}`} className="scroll-mt-24">
          <div className="mb-4 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-2"><PartPill>{part.label}</PartPill><span className="text-xs text-white/50">{part.topics.length} lessons</span></div>
            <h3 className="mt-2 font-display text-xl font-semibold text-white">{part.title}</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/65">{part.summary}</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {part.topics.map((topic) => {
              const isDone = completed.includes(topic.id)
              return <li key={topic.id}>
                <Link to={`/course/${module.id}/topic/${topic.id}`} className="group flex h-full min-h-32 gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-indigo-200/30 hover:bg-indigo-200/[0.045] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs ${isDone ? 'bg-emerald-200/10 text-emerald-100' : 'bg-indigo-200/[0.08] text-indigo-100'}`} aria-label={isDone ? 'Completed' : `Lesson ${topic.number}`}>
                    {isDone ? '✓' : String(topic.number).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-semibold leading-5 text-white/90 group-hover:text-white">{topic.title}</span>
                    <span className="mt-2 block text-xs leading-5 text-white/60">{topic.summary}</span>
                    <span className="mt-3 block text-xs font-medium text-indigo-200/80">{isDone ? 'Review lesson' : 'Open lesson'} <span aria-hidden="true">→</span></span>
                  </span>
                </Link>
              </li>
            })}
          </ol>
        </section>)}
      </div>
    </section>
  </main>
}
