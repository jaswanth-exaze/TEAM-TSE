import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NodeMarkdown from '../components/NodeMarkdown'
import { NODE_PARTS, NODE_TOPICS, loadNodeTopic } from '../data/courses/node-js'
import { getModule } from '../data/modules'
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

function LessonList({ module, currentTopic, completed, onNavigate }) {
  return <nav aria-label="Node.js lessons" className="mt-4 max-h-[65vh] space-y-5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-13rem)]">
    {NODE_PARTS.map((part) => <section key={part.id}>
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-indigo-200/75">{part.label} · {part.title}</p>
      <div className="space-y-0.5">{part.topics.map((topic) => {
        const isCurrent = topic.id === currentTopic.id
        const isDone = completed.includes(topic.id)
        return <Link key={topic.id} to={`/course/${module.id}/topic/${topic.id}`} onClick={onNavigate} aria-current={isCurrent ? 'page' : undefined} className={`flex items-start rounded-md px-2 py-2 text-[13px] leading-5 transition ${isCurrent ? 'bg-indigo-300/10 text-indigo-100' : 'text-white/65 hover:bg-white/[0.05] hover:text-white/95'}`}>
          <span className={`mr-2 inline-block w-4 shrink-0 text-center ${isDone ? 'text-emerald-300' : isCurrent ? 'text-indigo-200' : 'text-white/40'}`} aria-hidden="true">{isDone ? '✓' : String(topic.number).padStart(2, '0')}</span>
          <span>{topic.title}</span>
        </Link>
      })}</div>
    </section>)}
  </nav>
}

function TopicNavigation({ module, lesson, completed, onNavigate }) {
  return <aside className="hidden self-start lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
    <div className="rounded-xl border border-white/10 bg-[var(--panel-bg)] p-3">
      <div className="flex items-center justify-between gap-2 px-2">
        <Link to={`/course/${module.id}`} className="text-sm font-semibold text-white/90 hover:text-white">All Node.js lessons</Link>
        <span className="text-[10px] text-white/50">{completed.length}/{NODE_TOPICS.length}</span>
      </div>
      <LessonList module={module} currentTopic={lesson} completed={completed} onNavigate={onNavigate} />
    </div>
  </aside>
}

function PageLoading() {
  return <main className="learning-surface w-full px-4 py-8 sm:px-6 lg:px-10">
    <div className="flex gap-4"><Link to="/" className="text-sm text-white/70 hover:text-white">Home</Link><Link to="/course/node-js" className="text-sm text-white/70 hover:text-white">Node.js course</Link></div>
    <p className="mt-10 text-sm text-white/65">Loading lesson…</p>
  </main>
}

export default function NodeLessonPage() {
  const { topicId } = useParams()
  const module = getModule('node-js')
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(readCompleted)
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false)
  const topicIndex = NODE_TOPICS.findIndex((topic) => topic.id === topicId)
  const previousTopic = NODE_TOPICS[topicIndex - 1]
  const nextTopic = NODE_TOPICS[topicIndex + 1]
  const isComplete = completed.includes(topicId)
  const markdownBody = useMemo(() => lesson?.markdown?.replace(/^#[^\r\n]*\r?\n+/, '') || '', [lesson])
  const readMinutes = lesson ? Math.max(1, Math.ceil(lesson.markdown.trim().split(/\s+/).length / 200)) : 0

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setLesson(null)
    loadNodeTopic(topicId).then((result) => {
      if (mounted) setLesson(result)
    }).catch(() => {
      if (mounted) setLesson(null)
    }).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [topicId])

  function markComplete() {
    const updated = [...new Set([...completed, topicId])]
    setCompleted(updated)
    localStorage.setItem(progressKey, JSON.stringify(updated))
  }

  if (loading) return <PageLoading />
  if (!lesson || topicIndex < 0) return <main className="learning-surface w-full px-4 py-8 sm:px-6 lg:px-10">
    <div className="flex flex-wrap gap-4"><Link to="/" className="text-sm text-white/70 hover:text-white">← Home</Link><Link to="/course/node-js" className="text-sm text-white/70 hover:text-white">← Back to Node.js lessons</Link></div>
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <h1 className="font-display text-2xl font-semibold text-white">Lesson not found</h1>
      <p className="mt-2 text-sm leading-6 text-white/65">This lesson link may be old or incorrect. Choose a lesson from the Node.js course contents.</p>
      <Link to="/course/node-js" className="mt-5 inline-flex rounded-lg bg-indigo-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-indigo-200">Open course contents</Link>
    </section>
  </main>

  return <main className="learning-surface w-full px-4 py-6 sm:px-6 sm:py-9 lg:px-10 2xl:px-14">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <Link to="/" className="font-medium text-white/70 transition hover:text-white">Home</Link>
        <span aria-hidden="true" className="text-white/35">/</span>
        <Link to="/course/node-js" className="font-medium text-white/70 transition hover:text-white">Back to Node.js course</Link>
        <span aria-hidden="true" className="text-white/35">/</span>
        <span className="text-white/50">{lesson.title}</span>
      </nav>
      <Link to={`/quiz/${module.id}`} className="text-sm text-white/65 transition hover:text-white">Optional quiz</Link>
    </div>

    <button type="button" onClick={() => setMobileTopicsOpen(true)} aria-expanded={mobileTopicsOpen} className="mb-4 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium text-white/85 hover:bg-white/[0.08] lg:hidden">Browse lessons <span className="ml-2 text-white/55">{completed.length}/{NODE_TOPICS.length} complete</span></button>
    <div className="grid gap-6 lg:grid-cols-[235px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)] 2xl:gap-8">
      <TopicNavigation module={module} lesson={lesson} completed={completed} />

      <div className="min-w-0 xl:w-full xl:max-w-4xl xl:justify-self-center">
        <header className="border-b border-white/10 pb-6 sm:pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-indigo-200/20 bg-indigo-200/[0.06] px-2.5 py-1 text-xs text-indigo-100/85">{lesson.part.label} · {lesson.part.title}</span>
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">Lesson {lesson.number} of {NODE_TOPICS.length}</span>
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">About {readMinutes} min read</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{lesson.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">{lesson.summary}</p>
        </header>

        <article className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.015] px-4 py-5 sm:px-7 sm:py-8 xl:px-9">
          <NodeMarkdown content={markdownBody} />
        </article>

        <section className="mt-6 rounded-xl border border-emerald-200/15 bg-emerald-200/[0.04] p-4 sm:p-5" aria-label="Lesson progress">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-white/90">{isComplete ? 'Lesson completed' : 'Finished this lesson?'}</p>
              <p className="mt-1 text-sm leading-6 text-white/65">{isComplete ? 'Your progress is saved on this device.' : 'Mark it complete to keep track of your progress.'}</p>
              {!isComplete && <button type="button" onClick={markComplete} className="mt-3 rounded-lg border border-emerald-200/25 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-200/[0.08]">Mark lesson complete</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {previousTopic ? <Link to={`/course/${module.id}/topic/${previousTopic.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 px-3.5 py-2 text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white">← Previous</Link> : <Link to={`/course/${module.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 px-3.5 py-2 text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white">Back to course</Link>}
              {nextTopic ? <Link to={`/course/${module.id}/topic/${nextTopic.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-indigo-200">Next: {nextTopic.title} <span aria-hidden="true">→</span></Link> : <Link to={`/course/${module.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-100">Course complete · Return to course <span aria-hidden="true">→</span></Link>}
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-3"><Link to="/" className="text-sm text-white/60 transition hover:text-white">Return to home</Link></div>
        </section>
      </div>

    </div>

    {mobileTopicsOpen && <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <button type="button" aria-label="Close lesson menu" onClick={() => setMobileTopicsOpen(false)} className="modal-scrim absolute inset-0 h-full w-full cursor-default border-0" />
      <aside role="dialog" aria-modal="true" aria-label="Node.js lesson navigation" className="absolute inset-y-0 left-0 flex w-[min(23rem,90vw)] flex-col overflow-y-auto border-r border-white/15 bg-[var(--panel-bg)] p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3"><div><Link to="/" onClick={() => setMobileTopicsOpen(false)} className="text-xs text-white/55 hover:text-white">Home</Link><Link to="/course/node-js" onClick={() => setMobileTopicsOpen(false)} className="mt-1 block text-sm font-semibold text-white/90 hover:text-white">Back to Node.js course</Link></div><button type="button" onClick={() => setMobileTopicsOpen(false)} className="rounded-md border border-white/15 px-2.5 py-1.5 text-sm text-white/75 hover:bg-white/10">Close</button></div>
        <LessonList module={module} currentTopic={lesson} completed={completed} onNavigate={() => setMobileTopicsOpen(false)} />
      </aside>
    </div>}
  </main>
}
