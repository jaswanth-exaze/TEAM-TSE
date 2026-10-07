import { useState } from 'react'
import { Link } from 'react-router-dom'
import CourseMarkdown from './CourseMarkdown'
import overviewMarkdown from '../data/courses/node-js/lessons/overview.md?raw'
import { NODE_PARTS, NODE_TOPICS } from '../data/courses/node-js'
import { appStorageKey } from '../lib/storage'
import ProgressRing from './ProgressRing'
import StudyResources from './StudyResources'

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

export default function NodeStudyGuide({ module, course }) {
  const [completed] = useState(readCompleted)
  const doneCount = NODE_TOPICS.filter((topic) => completed.includes(topic.id)).length
  const nextTopic = NODE_TOPICS.find((topic) => !completed.includes(topic.id)) || NODE_TOPICS[0]
  const completion = Math.round((doneCount / NODE_TOPICS.length) * 100)

  return <main className="learning-surface w-full px-4 py-6 sm:px-6 sm:py-9 lg:px-10 2xl:px-14">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
      <Link to="/" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white">← Course library</Link>
      <nav aria-label="Course links" className="flex flex-wrap items-center gap-4">
        <Link to={`/quiz/${module.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200/30 bg-indigo-300 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-indigo-950/20 transition hover:-translate-y-0.5 hover:bg-indigo-200 hover:shadow-indigo-950/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 sm:px-5 sm:text-base">
          <span aria-hidden="true">✦</span> Take the quiz <span aria-hidden="true">→</span>
        </Link>
      </nav>
    </div>

    <header className="relative isolate mb-9 overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel-bg)] shadow-xl shadow-black/10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.7fr)] lg:items-center lg:p-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
              <span className="h-2 w-2 rounded-full bg-emerald-300" /> Course material
            </span>
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70">{module.title}</span>
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70">{NODE_PARTS.length} learning parts</span>
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">Build a Task Manager API with Node.js</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">Learn Node.js by extending one project from setup through a working API. Follow the guided lessons, type the examples, and practise each step as you go.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/65">
            <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">{NODE_TOPICS.length} lessons</span>
            <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">Windows &amp; macOS</span>
            <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">Optional practice quiz</span>
          </div>
        </div>
        <section aria-label="Your course progress" className="rounded-2xl border border-white/10 bg-black/[0.12] p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center">
              <ProgressRing percent={completion} size={64} stroke={5} color="#6ee7b7" />
              <span className="absolute font-display text-sm font-bold text-white">{completion}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-white/55">Your progress</p>
              <p className="mt-1 font-display text-xl font-semibold text-white">{doneCount} <span className="text-sm font-medium text-white/55">of {NODE_TOPICS.length} lessons</span></p>
              <p className="mt-1 text-xs text-white/55">{NODE_TOPICS.length - doneCount} lessons left to explore</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-[var(--progress-track)]" role="progressbar" aria-label="Node.js course progress" aria-valuemin={0} aria-valuemax={NODE_TOPICS.length} aria-valuenow={doneCount}>
              <div className="h-full rounded-full bg-emerald-300 transition-[width] duration-500" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-2 text-sm text-[var(--muted-fg)]">{doneCount} of {NODE_TOPICS.length} lessons complete</p>
          </div>
          {nextTopic && <Link to={`/course/${module.id}/topic/${nextTopic.id}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">{doneCount === NODE_TOPICS.length ? 'Review lessons' : doneCount ? 'Continue learning' : 'Start lesson 1'} <span aria-hidden="true">→</span></Link>}
        </section>
      </div>
    </header>

    <section className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.015] px-4 py-5 sm:px-7 sm:py-7" aria-label="Course introduction">
      <CourseMarkdown content={overviewMarkdown} />
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
                <Link to={`/course/${module.id}/topic/${topic.id}`} className="group flex h-full min-h-32 gap-3 rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 transition hover:-translate-y-0.5 hover:border-indigo-200/30 hover:shadow-lg hover:shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${isDone ? 'bg-emerald-200/10 text-emerald-100' : 'bg-indigo-200/[0.08] text-indigo-100'}`} aria-label={isDone ? 'Completed' : `Lesson ${topic.number}`}>
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
    <StudyResources resources={course.resources} id="resources-node-js" />
  </main>
}
