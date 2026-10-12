import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { getModule } from '../data/modules'
import { getCourseContent } from '../data/course-catalog'
import { loadCourseTopic } from '../data/courses/loaders'
import LessonContent, { LESSON_SECTIONS } from '../components/LessonContent'
import { appStorageKey } from '../lib/storage'

function readCompletedTopics(progressKey) {
  try {
    const value = JSON.parse(localStorage.getItem(progressKey))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function lessonTextContent(value) {
  if (typeof value === 'string') return value
  if (value?.type === 'mistakes') {
    return value.items.map((item) => [item.title, item.wrong, item.error, item.fix, item.explanation, item.tip].filter(Boolean).join(' ')).join(' ')
  }
  return ''
}

function Pill({ children, tone = 'default' }) {
  const tones = {
    default: 'border-white/15 bg-white/[0.045] text-white/75',
    green: 'border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100/90',
    amber: 'border-amber-300/25 bg-amber-300/[0.08] text-amber-100/90',
    blue: 'border-indigo-300/25 bg-indigo-300/[0.08] text-indigo-100/90',
  }
  return <span className={`rounded-full border px-2.5 py-1 text-xs ${tones[tone]}`}>{children}</span>
}

function CourseProgress({ topics, completed }) {
  const done = topics.filter((item) => completed.includes(item.id)).length
  const percentage = topics.length ? Math.round((done / topics.length) * 100) : 0

  return (
    <div className="mt-4" aria-label={`${done} of ${topics.length} lessons completed`}>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={topics.length}
        aria-valuenow={done}
      >
        <div className="h-full rounded-full bg-emerald-300" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-white/65">{done} of {topics.length} lessons done</p>
    </div>
  )
}

function TopicList({ module, course, topics, topic, search, setSearch, completed, onNavigate }) {
  const normalizedSearch = search.trim().toLowerCase()
  const filteredTopics = normalizedSearch
    ? topics.filter((item) => `${item.title} ${item.category} ${item.outcome}`.toLowerCase().includes(normalizedSearch))
    : topics

  return (
    <>
      <label className="mt-4 block">
        <span className="sr-only">Search topics</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search topics…"
          className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white/85 outline-none placeholder:text-white/50 focus:border-indigo-200/50"
        />
      </label>
      <nav aria-label="Course topics" className="mt-4 max-h-[55vh] space-y-5 overflow-y-auto pr-1 lg:max-h-none">
        {course.parts.map((part) => {
          const partTopics = filteredTopics.filter((item) => item.part.id === part.id)
          if (!partTopics.length) return null
          return (
            <section key={part.id}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-indigo-200/80">{part.label}</p>
              <div className="space-y-0.5">
                {partTopics.map((item) => {
                  const current = item.id === topic.id
                  const isDone = completed.includes(item.id)
                  return (
                    <Link
                      key={item.id}
                      to={`/course/${module.id}/topic/${item.id}`}
                      onClick={onNavigate}
                      aria-current={current ? 'page' : undefined}
                      className={`flex items-start rounded-md px-2 py-2 text-sm leading-5 transition ${current ? 'bg-indigo-300/10 text-indigo-100' : 'text-white/70 hover:bg-white/[0.05] hover:text-white/95'}`}
                    >
                      <span aria-hidden="true" className={`mr-2 inline-block w-4 shrink-0 text-center ${isDone ? 'text-emerald-300' : current ? 'text-indigo-200' : 'text-white/45'}`}>
                        {isDone ? '✓' : current ? '●' : '○'}
                      </span>
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
        {!filteredTopics.length && <p className="px-2 py-3 text-sm text-white/60">No topics match this search.</p>}
      </nav>
    </>
  )
}

function LessonSidebar({ module, course, topics, topic, search, setSearch, completed }) {
  return (
    <aside className="hidden self-start lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <div className="rounded-xl border border-white/10 bg-[var(--panel-bg)] p-4">
        <Link to={`/course/${module.id}`} className="text-sm font-semibold text-white/90 hover:text-white">{course.title}</Link>
        <CourseProgress topics={topics} completed={completed} />
        <TopicList module={module} course={course} topics={topics} topic={topic} search={search} setSearch={setSearch} completed={completed} />
      </div>
    </aside>
  )
}

function OnThisPage({ pathname, activeSection, sections }) {
  function scrollToSection(key) {
    window.requestAnimationFrame(() => document.getElementById(`lesson-${key}`)?.scrollIntoView({ block: 'start' }))
  }

  return (
    <aside className="hidden self-start xl:sticky xl:top-20 xl:block">
      <div className="rounded-xl border border-white/10 bg-[var(--panel-bg)] p-3">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.13em] text-white/65">On this page</p>
        <nav aria-label="Lesson sections" className="space-y-0.5">
          {sections.map(([key, title]) => (
            <Link
              key={key}
              to={`${pathname}#lesson-${key}`}
              onClick={() => scrollToSection(key)}
              aria-current={activeSection === key ? 'location' : undefined}
              className={`block rounded-md border-l-2 px-2.5 py-2 text-sm leading-5 transition ${activeSection === key ? 'border-indigo-300 bg-indigo-300/[0.08] text-indigo-100' : 'border-transparent text-white/65 hover:bg-white/[0.04] hover:text-white/90'}`}
            >
              {title}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function LessonUnavailable({ module, course }) {
  return (
    <main className="learning-surface w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-10 2xl:px-14">
      <Link to={`/course/${module.id}`} className="text-sm text-white/70 transition hover:text-white">← Back to {module.title}</Link>
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Lesson unavailable</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white">This topic page is not available</h1>
        <p className="mt-3 text-base leading-7 text-white/70">Choose a topic from the {course.title} syllabus.</p>
        <Link to={`/course/${module.id}`} className="mt-6 inline-flex rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/10">View syllabus</Link>
      </section>
    </main>
  )
}

function LessonLoading({ module }) {
  return <main className="learning-surface w-full px-4 py-10 text-base text-white/70 sm:px-6 sm:py-14 lg:px-10 2xl:px-14"><Link to={`/course/${module.id}`} className="text-white/75">← Back to {module.title}</Link><p className="mt-10">Opening lesson…</p></main>
}

export default function LessonPage() {
  const { moduleId, topicId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const module = getModule(moduleId)
  const course = getCourseContent(moduleId)
  const topics = useMemo(() => course?.parts.flatMap((part) => part.topics.map((topic) => ({ ...topic, part }))) || [], [course])
  const topicIndex = topics.findIndex((item) => item.id === topicId)
  const topic = topics[topicIndex]
  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : null
  const nextTopic = topicIndex >= 0 && topicIndex + 1 < topics.length ? topics[topicIndex + 1] : null
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState('whatIsIt')
  const progressKey = appStorageKey(`study:${moduleId}:v1`)
  const [completed, setCompleted] = useState(() => readCompletedTopics(progressKey))

  useEffect(() => {
    setCompleted(readCompletedTopics(progressKey))
  }, [progressKey])

  useEffect(() => {
    if (!mobileTopicsOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileTopicsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileTopicsOpen])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setLesson(null)
    if (topicId) {
      loadCourseTopic(moduleId, topicId).then((result) => {
        if (mounted) setLesson(result)
      }).catch(() => {
        if (mounted) setLesson(null)
      }).finally(() => {
        if (mounted) setLoading(false)
      })
    } else {
      setLoading(false)
    }
    return () => { mounted = false }
  }, [moduleId, topicId])

  useEffect(() => {
    setActiveSection('whatIsIt')
    if (loading || !lesson || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
      if (visible.length) {
        const nearest = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        setActiveSection(nearest.target.id.replace('lesson-', ''))
      }
    }, { rootMargin: '-20% 0px -70% 0px' })

    LESSON_SECTIONS.forEach(([key]) => {
      const section = document.getElementById(`lesson-${key}`)
      if (section) observer.observe(section)
    })
    return () => observer.disconnect()
  }, [topicId, loading, lesson])

  if (!module || !course) return <LessonUnavailable module={module || { id: moduleId, title: 'Course' }} course={course || { title: 'course' }} />
  if (!topic) return <LessonUnavailable module={module} course={course} />
  if (loading) return <LessonLoading module={module} />
  if (!lesson) return <LessonUnavailable module={module} course={course} />

  const sections = {
    ...lesson.sections,
    whatIsIt: lesson.sections.whatIsIt || topic.notes,
    basicExample: lesson.sections.basicExample || topic.example,
  }
  const isComplete = completed.includes(topic.id)
  const statusText = lesson.status === 'full' ? 'Full lesson' : lesson.status === 'reference' ? 'Shared chapter' : 'Lesson outline'
  const sourceMetadata = lesson.sourceDocuments?.[0]
  const prerequisite = topics.find((item) => item.id === sourceMetadata?.prerequisites)
  const prerequisiteId = sourceMetadata?.prerequisites
  const prerequisiteLabel = prerequisite?.title || prerequisiteId?.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const readingText = Object.values(sections).map(lessonTextContent).join(' ')
  const readMinutes = Math.max(1, Math.ceil(readingText.trim().split(/\s+/).filter(Boolean).length / 200))
  const upNextCopy = sections.upNext?.replace(/^next topic:.*$/gim, '').trim()
  const upNext = (
    <div className="rounded-xl border border-indigo-200/15 bg-indigo-200/[0.05] p-4 sm:p-5">
      {upNextCopy && <p className="text-sm leading-7 text-white/75">{upNextCopy}</p>}
      {nextTopic ? <>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-white/60">Continue the syllabus</p>
        <Link to={`/course/${module.id}/topic/${nextTopic.id}`} className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-indigo-100 transition hover:text-white">
          {nextTopic.title}<span aria-hidden="true">→</span>
        </Link>
        <p className="mt-1 text-sm text-white/60">{nextTopic.part.label} · {nextTopic.category}</p>
      </> : <p className="mt-3 text-sm text-emerald-100/85">You have reached the end of the listed syllabus.</p>}
    </div>
  )
  const visibleSections = LESSON_SECTIONS.filter(([key]) => Boolean(key === 'upNext' ? upNext : sections[key]))

  function completeAndContinue() {
    if (!isComplete) {
      const updated = [...new Set([...completed, topic.id])]
      setCompleted(updated)
      localStorage.setItem(progressKey, JSON.stringify(updated))
    }
    navigate(nextTopic ? `/course/${module.id}/topic/${nextTopic.id}` : `/course/${module.id}`)
  }

  function toggleCompletion(event) {
    const updated = event.target.checked
      ? [...new Set([...completed, topic.id])]
      : completed.filter((id) => id !== topic.id)
    setCompleted(updated)
    localStorage.setItem(progressKey, JSON.stringify(updated))
  }

  return (
    <main className="learning-surface w-full px-4 py-6 sm:px-6 sm:py-9 lg:px-10 2xl:px-14">
      <div className="mb-7">
        <Link to={`/course/${module.id}`} className="text-sm text-white/75 transition hover:text-white">← {module.title} course</Link>
        <div className="mt-4 lg:hidden">
          <button type="button" onClick={() => setMobileTopicsOpen(true)} aria-expanded={mobileTopicsOpen} className="rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium text-white/85 hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">
            Browse topics <span className="ml-2 text-white/65">{completed.filter((id) => topics.some((item) => item.id === id)).length}/{topics.length} done</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_200px] 2xl:grid-cols-[270px_minmax(0,1fr)_210px] 2xl:gap-8">
        <LessonSidebar module={module} course={course} topics={topics} topic={topic} search={search} setSearch={setSearch} completed={completed} />

        <div className="min-w-0 xl:w-full xl:max-w-4xl xl:justify-self-center">
          <header className="border-b border-white/10 pb-7 sm:pb-9">
            <div className="flex flex-wrap items-center gap-2">
              <Pill>{topic.part.label}</Pill>
              {sourceMetadata?.difficulty && <Pill>{sourceMetadata.difficulty}</Pill>}
              <Pill tone="blue">About {readMinutes} min read</Pill>
              {lesson.status !== 'full' && <Pill tone={lesson.status === 'reference' ? 'blue' : 'amber'}>{statusText}</Pill>}
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">{topic.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/80"><span className="font-semibold text-white">You’ll learn:</span> {topic.outcome}</p>
            {prerequisiteLabel && (
              <p className="mt-3 text-sm text-white/70">
                Recommended first:{' '}
                <Link to={prerequisite ? `/course/${module.id}/topic/${prerequisite.id}` : `/course/${module.id}`} className="font-medium text-indigo-100 underline decoration-indigo-200/35 underline-offset-4 hover:text-white">
                  {prerequisiteLabel}
                </Link>
              </p>
            )}
            {lesson.status === 'outline' && <p className="mt-5 border-l-2 border-amber-300/60 pl-4 text-sm leading-6 text-amber-100/85">A complete lesson for this topic is still being prepared. The outline and starter example are here; the rest of the page will follow the same study format as the full lessons.</p>}
          </header>

          {lesson.status === 'reference' && lesson.relatedTopicId && (
            <aside className="mt-5 rounded-xl border border-indigo-200/20 bg-indigo-200/[0.05] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-indigo-200/85">Shared source chapter</p>
              <p className="mt-2 text-sm leading-6 text-white/75">This topic is taught inside a combined aggregate functions lesson. Open that lesson for its examples and practice.</p>
              <Link to={`/course/${module.id}/topic/${lesson.relatedTopicId}`} className="mt-3 inline-flex rounded-lg border border-indigo-200/25 px-3 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-200/10 hover:text-white">Open COUNT() and aggregate functions →</Link>
            </aside>
          )}

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5 xl:hidden">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-white/65">On this page</p>
            <nav aria-label="Lesson sections" className="flex flex-wrap gap-2">
              {visibleSections.map(([key, title]) => (
                <Link
                  key={key}
                  to={`${location.pathname}#lesson-${key}`}
                  onClick={() => window.requestAnimationFrame(() => document.getElementById(`lesson-${key}`)?.scrollIntoView({ block: 'start' }))}
                  aria-current={activeSection === key ? 'location' : undefined}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${activeSection === key ? 'border-indigo-200/35 bg-indigo-200/10 text-indigo-100' : 'border-white/15 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white'}`}
                >
                  {title}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-7">
            <LessonContent sections={sections} upNext={upNext} topicId={topic.id} quizHref={`/quiz/${module.id}`} />
          </div>

          <section className="mt-8 flex flex-col gap-4 rounded-xl border border-emerald-200/15 bg-emerald-200/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="font-semibold text-white/90">{isComplete ? 'Lesson complete' : 'Ready to move on?'}</p>
              <p className="mt-1 text-sm leading-6 text-white/70">{isComplete ? 'Your progress is saved on this device.' : 'Mark this lesson complete and continue to the next topic.'}</p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-white/75">
                <input type="checkbox" checked={isComplete} onChange={toggleCompletion} className="h-4 w-4 accent-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200" />
                Mark this lesson complete
              </label>
            </div>
            <button type="button" onClick={completeAndContinue} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--action-success)] px-4 py-3 text-sm font-semibold text-[var(--action-success-fg)] transition-colors hover:bg-[var(--action-success-hover)] focus:outline-none focus:ring-2 focus:ring-emerald-200/70">
              {isComplete ? (nextTopic ? 'Continue to next topic' : 'Return to syllabus') : (nextTopic ? 'Mark complete & continue' : 'Mark complete & return to syllabus')}
              <span aria-hidden="true">→</span>
            </button>
          </section>

          {previousTopic && <Link to={`/course/${module.id}/topic/${previousTopic.id}`} className="mt-5 inline-flex text-sm text-white/65 transition hover:text-white">← Previous: {previousTopic.title}</Link>}
        </div>

        {mobileTopicsOpen && <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <div className="modal-scrim absolute inset-0" onClick={() => setMobileTopicsOpen(false)} />
          <aside role="dialog" aria-modal="true" aria-label={`${course.title} topics`} className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto border-r border-white/15 bg-[var(--panel-bg)] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/course/${module.id}`} onClick={() => setMobileTopicsOpen(false)} className="text-sm font-semibold text-white/90 hover:text-white">{course.title}</Link>
              <button type="button" onClick={() => setMobileTopicsOpen(false)} aria-label="Close topic navigation" className="rounded-md border border-white/15 px-2.5 py-1.5 text-sm text-white/75 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">Close</button>
            </div>
            <CourseProgress topics={topics} completed={completed} />
            <TopicList module={module} course={course} topics={topics} topic={topic} search={search} setSearch={setSearch} completed={completed} onNavigate={() => setMobileTopicsOpen(false)} />
          </aside>
        </div>}

        <OnThisPage pathname={location.pathname} activeSection={activeSection} sections={visibleSections} />
      </div>
    </main>
  )
}
