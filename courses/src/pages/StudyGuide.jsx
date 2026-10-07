import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getModule } from '../data/modules'
import { getCourseSyllabus } from '../data/course-catalog'
import { getLinuxLabHref, getSqlVisualLabHref } from '../lib/paths'
import { appStorageKey } from '../lib/storage'
import NodeStudyGuide from '../components/NodeStudyGuide'
import HashAnchorLink from '../components/HashAnchorLink'
import ProgressRing from '../components/ProgressRing'
import StudyResources from '../components/StudyResources'

function readCompletedTopics(progressKey) {
  try {
    const value = JSON.parse(localStorage.getItem(progressKey))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function Pill({ children, tone = 'default' }) {
  const tones = {
    default: 'border-white/15 bg-white/[0.045] text-white/75',
    green: 'border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100/90',
    amber: 'border-amber-300/20 bg-amber-300/[0.06] text-amber-100/75',
    blue: 'border-indigo-300/25 bg-indigo-300/[0.08] text-indigo-100/90',
  }
  return <span className={`rounded-full border px-2.5 py-1 text-xs ${tones[tone]}`}>{children}</span>
}

function ProgressBar({ done, total, color }) {
  const percentage = total ? Math.round((done / total) * 100) : 0
  return <div>
    <div className="h-2 overflow-hidden rounded-full bg-[var(--progress-track)]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`${done} of ${total} lessons done`}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
    </div>
    <p className="mt-2 text-sm text-[var(--muted-fg)]">{done} of {total} lessons complete</p>
  </div>
}

function CourseReader({ module, course }) {
  const progressKey = appStorageKey(`study:${module.id}:v1`)
  const [completed] = useState(() => readCompletedTopics(progressKey))
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [copied, setCopied] = useState(false)
  const allTopics = course.parts.flatMap((part) => part.topics)
  const completedTopics = allTopics.filter((topic) => completed.includes(topic.id))
  const completedCount = completedTopics.length
  const progressPercent = allTopics.length ? Math.round((completedCount / allTopics.length) * 100) : 0
  const nextTopic = allTopics.find((topic) => !completed.includes(topic.id)) || allTopics[0]
  const searchValue = search.trim().toLowerCase()
  const visibleTopics = useMemo(() => {
    return allTopics.filter((topic) => {
      const matchesSearch = !searchValue || `${topic.title} ${topic.category}`.toLowerCase().includes(searchValue)
      const isDone = completed.includes(topic.id)
      const matchesFilter = filter === 'all' || (filter === 'done' ? isDone : !isDone)
      return matchesSearch && matchesFilter
    })
  }, [allTopics, searchValue, filter, completed])

  async function copyDailyTemplate() {
    try {
      await navigator.clipboard.writeText(course.dailyUpdateTemplate)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="learning-surface mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-9 lg:px-10 2xl:px-14">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white">
          <span aria-hidden="true">←</span> Course library
        </Link>
        <nav aria-label="Course tools" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {course.examRoute && <Link to={course.examRoute} className="text-sm text-white/75 hover:text-white">Practice exams</Link>}
          {module.id === 'mysql' && <a href={getSqlVisualLabHref()} className="text-sm font-medium text-amber-200 hover:text-amber-100">Visual SQL lab</a>}
          {course.hasQuiz !== false && <Link to={`/quiz/${module.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200/30 bg-indigo-300 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-indigo-950/20 transition hover:-translate-y-0.5 hover:bg-indigo-200 hover:shadow-indigo-950/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 sm:px-5 sm:text-base">
            <span aria-hidden="true">✦</span> Take the quiz <span aria-hidden="true">→</span>
          </Link>}
        </nav>
      </div>

      <header className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel-bg)] shadow-xl shadow-black/10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: `${module.color}24` }} />
        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:items-center lg:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: module.color }} />
                Course material
              </span>
              <Pill>{module.title}</Pill>
              <Pill>{course.parts.length} learning parts</Pill>
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{course.title || `${module.title} Course`}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">{course.subtitle || `Study ${module.title} through in-page lessons, examples, and practice material.`}</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/65">
              <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">{allTopics.length} lessons</span>
              <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">{course.parts.length} guided parts</span>
              {course.hasQuiz !== false && <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">Practice quiz included</span>}
            </div>
          </div>

          <section aria-label="Your course progress" className="rounded-2xl border border-white/10 bg-black/[0.12] p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="relative grid h-16 w-16 shrink-0 place-items-center">
                <ProgressRing percent={progressPercent} size={64} stroke={5} color={module.color} />
                <span className="absolute font-display text-sm font-bold text-white">{progressPercent}%</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-white/55">Your progress</p>
                <p className="mt-1 font-display text-xl font-semibold text-white">{completedCount} <span className="text-sm font-medium text-white/55">of {allTopics.length} lessons</span></p>
                <p className="mt-1 text-xs text-white/55">{allTopics.length - completedCount} lessons left to explore</p>
              </div>
            </div>
            <div className="mt-5">
              <ProgressBar done={completedCount} total={allTopics.length} color={module.color} />
            </div>
            {nextTopic && <Link to={`/course/${module.id}/topic/${nextTopic.id}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70" style={{ backgroundColor: module.color, color: '#0b0e14' }}>
              {completedCount ? 'Continue learning' : 'Start learning'} <span aria-hidden="true">→</span>
            </Link>}
          </section>
        </div>

        <nav aria-label="Jump to a syllabus part" className="border-t border-white/10 bg-black/[0.08] px-4 py-3 sm:px-8 lg:px-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="mr-1 hidden shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-white/45 sm:inline">Jump to</span>
            {course.parts.map((part, index) => {
              const done = part.topics.filter((topic) => completed.includes(topic.id)).length
              return <HashAnchorLink key={part.id} targetId={part.id} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
                <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold" style={{ backgroundColor: `${module.color}25`, color: module.color }}>{String(index + 1).padStart(2, '0')}</span>
                {part.label}
                <span className="text-white/45">{done}/{part.topics.length}</span>
              </HashAnchorLink>
            })}
          </div>
        </nav>
      </header>

      <section className="mt-9 sm:mt-12" aria-labelledby="syllabus-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: module.color }}>Learning path</p>
            <h2 id="syllabus-heading" className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">{course.curriculumTitle || 'Course outline'}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Follow the parts in order or jump straight to a lesson. Your progress is saved on this device.</p>
          </div>
          <span className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-medium text-white/60">{completedCount}/{allTopics.length} complete</span>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-3 sm:flex-row sm:items-center sm:p-3.5">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search topic title or category</span>
            <span className="relative block">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-white/40">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.2 4.2" strokeLinecap="round" />
              </svg>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a lesson or topic…" className="w-full rounded-xl border border-white/10 bg-black/[0.12] py-3 pl-10 pr-3.5 text-sm text-white/90 outline-none placeholder:text-white/45 focus:border-indigo-200/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200" />
            </span>
          </label>
          <div role="group" aria-label="Filter lessons" className="flex shrink-0 gap-1 rounded-xl border border-white/10 bg-black/[0.12] p-1">
            {[
              ['all', 'All'],
              ['not-started', 'Not started'],
              ['done', 'Done'],
            ].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 ${filter === value ? 'bg-white/10 text-white shadow-sm' : 'text-white/55 hover:bg-white/[0.06] hover:text-white/85'}`}>{label}</button>)}
          </div>
        </div>

        <div className="space-y-10">
          {course.parts.map((part) => {
            const partTopics = part.topics.filter((topic) => visibleTopics.includes(topic))
            const partDone = part.topics.filter((topic) => completed.includes(topic.id)).length
            return <section key={part.id} id={part.id} className="scroll-mt-28">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200">{part.label} · {part.newTopics ?? part.topics.length} new · {part.totalTopics ?? part.topics.length} total topics</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-white">{part.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">{part.summary}</p>
                </div>
                <p className="text-sm text-white/70">{partDone}/{part.topics.length} in this part done</p>
              </div>

              {partTopics.length ? <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {partTopics.map((topic) => {
                  const isDone = completed.includes(topic.id)
                  const href = topic.lessonStatus === 'reference' ? `/course/${module.id}/topic/count` : `/course/${module.id}/topic/${topic.id}`
                  const isComingSoon = topic.lessonStatus === 'outline'
                  return <Link key={topic.id} to={href} className="group relative flex min-h-[132px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg hover:shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 sm:p-4.5">
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 opacity-0 transition group-hover:opacity-100" style={{ backgroundColor: module.color }} />
                    <div className="flex items-start gap-3.5">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold ${isDone ? 'bg-emerald-300/10 text-emerald-200' : 'bg-white/[0.055] text-white/70'}`} aria-label={isDone ? 'Completed' : `Lesson ${topic.number}`}>
                        {isDone ? '✓' : String(topic.number).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-sm font-semibold leading-5 text-white/95 group-hover:text-white">{topic.title}</h4>
                          <span aria-hidden="true" className="mt-0.5 shrink-0 text-sm text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white/80">↗</span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/55">{topic.outcome || topic.category}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pl-[54px] pt-3">
                      <span className="truncate text-[11px] font-medium text-white/40">{topic.category || part.label}</span>
                      {isComingSoon
                        ? <span className="shrink-0 rounded-full border border-amber-200/15 bg-amber-200/[0.04] px-2 py-1 text-[10px] font-medium text-amber-100/75">Coming soon</span>
                        : isDone
                          ? <span className="shrink-0 rounded-full border border-emerald-300/15 bg-emerald-300/[0.05] px-2 py-1 text-[10px] font-medium text-emerald-100/80">Completed</span>
                          : <span className="shrink-0 text-[10px] font-semibold text-white/45 transition group-hover:text-white/80">Open lesson</span>}
                    </div>
                  </Link>
                })}
              </div> : <p className="rounded-lg border border-white/10 px-4 py-5 text-sm text-white/70">No topics in this part match the current search and filter.</p>}
            </section>
          })}
        </div>
        {course.contentNote && <p className="mt-7 rounded-lg border border-white/10 bg-white/[0.025] px-4 py-3 text-sm leading-6 text-white/70">{course.contentNote}</p>}
      </section>

      {course.practiceUnits?.length > 0 && <section className="mt-12" aria-labelledby="challenges-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Apply what you learned</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h2 id="challenges-heading" className="font-display text-2xl font-semibold text-white">Mini challenges</h2>
          <p className="text-sm text-white/70">Short practice activities from the course material.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {course.practiceUnits.map((unit) => <Link key={unit.id} to={`/course/${module.id}/activity/${unit.id}`} className="rounded-xl border border-amber-200/15 bg-amber-200/[0.025] p-4 hover:border-amber-200/30 hover:bg-amber-200/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">
            <p className="text-sm text-amber-100/80">Part {unit.part} · {unit.difficulty}</p>
            <h3 className="mt-2 font-display text-base font-semibold text-white">{unit.title}</h3>
            <span className="mt-3 inline-block text-sm text-amber-100/80">Open challenge →</span>
          </Link>)}
        </div>
      </section>}

      {(course.program || course.dailyUpdateTemplate) && <section className="mt-12" aria-labelledby="program-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Plan your study</p>
        <h2 id="program-heading" className="mt-1 font-display text-2xl font-semibold text-white">Programme guide</h2>

        {course.program?.stats?.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {course.program.stats.map(([stat, description]) => <div key={stat} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <p className="font-display text-xl font-semibold text-white">{stat}</p>
            <p className="mt-1 text-sm leading-6 text-white/70">{description}</p>
          </div>)}
        </div>}

        {course.program?.schedule?.length > 0 && <section className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
          <h3 className="font-display text-xl font-semibold text-white">{course.program.scheduleTitle || 'Suggested study rhythm'}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {course.program.schedule.map(([day, description]) => <article key={day} className="rounded-lg border border-white/10 bg-black/10 p-4">
              <h4 className="text-sm font-semibold text-white">{day}</h4>
              <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>
            </article>)}
          </div>
          {course.program.scheduleNote && <p className="mt-4 text-sm leading-6 text-white/70">{course.program.scheduleNote}</p>}
        </section>}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {course.dailyUpdateTemplate && <article className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
            <h3 className="font-display text-xl font-semibold text-white">Daily study update</h3>
            <p className="mt-2 text-sm leading-6 text-white/75">Record study time, finished practice, questions, and blockers.</p>
            <pre className="code-surface mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-[#090c12] p-4 text-sm leading-6 text-white/80">{course.dailyUpdateTemplate}</pre>
            <button type="button" onClick={copyDailyTemplate} className="mt-3 rounded-lg border border-white/15 px-3.5 py-2.5 text-sm text-white/80 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">{copied ? 'Copied' : 'Copy update template'}</button>
          </article>}
          {course.program?.examFormat && <article className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
            <h3 className="font-display text-xl font-semibold text-white">Exam format</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/75">{course.program.examFormat.map((item) => <li key={item} className="border-l-2 border-sky-200/50 pl-3">{item}</li>)}</ul>
            <p className="mt-4 rounded-lg bg-sky-300/[0.07] p-3 text-sm leading-6 text-sky-100/85">Browser mock exams are private practice and do not use official attempts.</p>
            {course.examRoute && <Link to={course.examRoute} className="mt-4 inline-flex text-sm font-medium text-sky-100 hover:text-white">Choose a mock exam →</Link>}
          </article>}
        </div>
      </section>}

      <StudyResources resources={course.resources} id={`resources-${module.id}`} />
    </main>
  )
}

function syllabusResourceLabel(resource) {
  if (resource === 'week1_fundamentals') return 'Week 1 fundamentals notes'
  if (resource?.includes('week2_system_admin')) return 'Week 2 system administration notes'
  return resource
}

function SyllabusOnlyReader({ module, course }) {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const allTopics = course.parts.flatMap((part) => part.topics)
  const filteredParts = useMemo(() => course.parts.map((part) => ({
    ...part,
    topics: part.topics.filter((topic) => {
      const searchable = [
        topic.title,
        topic.category,
        (topic.keyTopics || topic.commands || []).join(' '),
        topic.keyNotes,
        topic.notes,
        topic.capstone,
        topic.resource,
        (topic.studyFiles || []).join(' '),
      ].filter(Boolean).join(' ')
      return !query || searchable.toLowerCase().includes(query)
    }),
  })), [course.parts, query])
  const hasMatches = filteredParts.some((part) => part.topics.length > 0)

  return (
    <main className="learning-surface w-full px-4 py-6 sm:px-6 sm:py-9 lg:px-10 2xl:px-14">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="text-sm font-medium text-white/75 transition hover:text-white">← Course library</Link>
        <nav aria-label="Course tools" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {course.examPlanOverviewHref && <Link to={course.examPlanOverviewHref} className="text-sm text-white/75 transition hover:text-white">Practice exams</Link>}
        </nav>
      </div>

      <header className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel-bg)] shadow-xl shadow-black/10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: `${module.color}24` }} />
        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.58fr)] lg:items-center lg:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="blue">COURSE SYLLABUS</Pill>
              <Pill>{course.parts.length} learning sections</Pill>
              <Pill>{allTopics.length} {course.entryLabel || 'topics'}</Pill>
              <Pill>{course.durationLabel || `${course.parts.length} weeks`}</Pill>
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{course.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/75">{course.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/quiz/${module.id}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-indigo-200/30 bg-indigo-300 px-5 py-3 text-base font-bold text-slate-950 shadow-lg shadow-indigo-950/20 transition hover:-translate-y-0.5 hover:bg-indigo-200 hover:shadow-indigo-950/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">
                <span aria-hidden="true">✦</span> Take the quiz <span aria-hidden="true">→</span>
              </Link>
              {module.id === 'linux-commands' && <a href={getLinuxLabHref()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-200/25 bg-amber-200/[0.08] px-4 py-3 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-200/40 hover:bg-amber-200/[0.13] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">
                Open Linux practice lab <span aria-hidden="true">↗</span>
              </a>}
              <HashAnchorLink targetId={course.parts[0]?.id} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">
                Browse {course.parts[0]?.label || 'syllabus'} <span aria-hidden="true">↓</span>
              </HashAnchorLink>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-black/[0.16] p-5 sm:p-6" aria-label={`${course.title} at a glance`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">At a glance</p>
            <dl className="mt-4 divide-y divide-white/10">
              <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                <dt className="text-sm text-white/60">Study duration</dt>
                <dd className="text-right text-sm font-semibold text-white">{course.durationLabel || `${course.parts.length} weeks`}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-white/60">Learning sections</dt>
                <dd className="text-right text-sm font-semibold text-white">{course.parts.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
                <dt className="text-sm text-white/60">Syllabus {course.entryLabel || 'topics'}</dt>
                <dd className="text-right text-sm font-semibold text-white">{allTopics.length}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl border border-indigo-200/15 bg-indigo-200/[0.05] px-3.5 py-3 text-sm leading-5 text-white/75">
              Follow each section in order, practise the key ideas, then use the quiz to check your understanding.
            </p>
          </aside>
        </div>
      </header>

      <nav aria-label="Jump to a syllabus section" className="sticky top-2 z-20 mt-5 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[var(--panel-bg)]/95 p-2 shadow-lg backdrop-blur-sm">
        {course.parts.map((part) => <HashAnchorLink key={part.id} targetId={part.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/80 transition hover:border-indigo-200/30 hover:bg-indigo-200/[0.06] hover:text-white">
          {part.label} <span className="ml-1 text-white/55">{part.topics.length} {part.entryLabel || course.entryLabel || 'topics'}</span>
        </HashAnchorLink>)}
      </nav>

      {course.overview?.length > 0 && <section className="mt-8" aria-labelledby={`overview-${module.id}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Course overview</p>
        <h2 id={`overview-${module.id}`} className="sr-only">Course overview</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {course.overview.map(([label, value]) => <div key={label} className={`rounded-lg border border-white/10 bg-white/[0.025] px-3.5 py-3 ${label === 'Exam format' ? 'lg:col-span-2' : ''}`}>
            <dt className="text-xs font-medium text-white/55">{label}</dt>
            <dd className="mt-1 text-sm leading-5 text-white/85">{value}</dd>
          </div>)}
        </dl>
      </section>}

      {course.sequence?.length > 0 && <section className="mt-9" aria-labelledby={`sequence-${module.id}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Follow in order</p>
        <h2 id={`sequence-${module.id}`} className="mt-1 font-display text-2xl font-semibold text-white">{course.sequenceTitle || 'Course sequence'}</h2>
        {course.sequenceNote && <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">{course.sequenceNote}</p>}
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {course.sequence.map((resource, index) => <li key={resource.title} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-200/[0.08] font-mono text-xs text-sky-100">{String(index + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/50">{resource.kind}</p>
                <h3 className="mt-1 text-sm font-medium leading-5 text-white/90">{resource.title}</h3>
                <a href={resource.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-indigo-200 transition hover:text-white">Open source in a new tab</a>
              </div>
            </div>
          </li>)}
        </ol>
      </section>}

      <section className="mt-8" aria-labelledby="syllabus-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Syllabus</p>
            <h2 id="syllabus-heading" className="mt-1 font-display text-2xl font-semibold text-white">{course.curriculumTitle}</h2>
          </div>
          <p className="text-sm text-white/65">{course.syllabusHint || `Browse the syllabus and review ${course.topicDetailsLabel?.toLowerCase() || 'key details'}.`}</p>
        </div>

        <label className="mb-6 block max-w-xl">
          <span className="sr-only">Search {course.title} syllabus</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${course.entryLabel || 'topics'} or key details`} className="w-full rounded-lg border border-white/15 bg-black/15 px-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/50 focus:border-indigo-200/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200" />
        </label>

        {hasMatches ? <div className="space-y-10">
          {filteredParts.map((part) => part.topics.length > 0 && <section key={part.id} id={part.id} className="scroll-mt-28">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200">{part.label} · {part.topics.length} {part.entryLabel || course.entryLabel || 'topics'}{part.hours ? ` · ${part.hours} hours` : ''}</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-white">{part.title}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">{part.summary}</p>
              </div>
              {part.examLabel && <Pill tone="amber">{part.examLabel}</Pill>}
            </div>

            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {part.topics.map((topic) => {
                const details = topic.keyTopics || topic.commands || []
                const note = topic.keyNotes || (!topic.capstone ? topic.notes : '')
                return <article key={topic.id} id={`topic-${topic.id}`} className="scroll-mt-28 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-300/10 font-mono text-sm text-indigo-100" aria-label={`${course.entryLabel || 'Topic'} ${topic.number}`}>
                      {String(topic.number).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-display text-base font-semibold text-white/95">{topic.title}</h4>
                        <Pill tone={topic.badge ? 'default' : 'green'}>{topic.badge || course.topicBadge || 'Exam topic'}</Pill>
                      </div>
                      <p className="mt-1 text-xs text-white/55">{topic.category}</p>
                    </div>
                  </div>

                  {details.length > 0 && <div className="mt-4" aria-label={course.topicDetailsLabel || 'Key topics'}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">{course.topicDetailsLabel || 'Commands and syntax'}</p>
                    <div className="flex flex-wrap gap-2">{details.map((detail) => course.topicDetailsLabel === 'Commands and syntax'
                      ? <code key={detail} className="max-w-full overflow-x-auto rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 font-mono text-xs text-emerald-100/85">{detail}</code>
                      : <span key={detail} className="rounded-md border border-white/10 bg-black/10 px-2.5 py-1.5 text-xs leading-5 text-white/75">{detail}</span>)}</div>
                  </div>}

                  {note && <div className="mt-4 rounded-lg border border-indigo-200/10 bg-indigo-200/[0.035] px-3.5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-100/75">{topic.noteLabel || 'Key point'}</p>
                    <p className="mt-1.5 text-sm leading-6 text-white/75">{note}</p>
                  </div>}

                  {topic.capstone && <div className="mt-4 rounded-lg border border-amber-200/15 bg-amber-200/[0.035] px-3.5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-100/80">Capstone / assessment</p>
                    <p className="mt-1.5 text-sm leading-6 text-white/80">{topic.capstone}</p>
                    {topic.notes && <p className="mt-1.5 text-xs leading-5 text-white/60">{topic.notes}</p>}
                  </div>}

                  {topic.studyFiles?.length > 0 && <p className="mt-3 text-xs leading-5 text-white/45">Study files listed: {topic.studyFiles.join(' · ')}</p>}
                  {topic.resource && <p className="mt-3 text-xs text-white/45">Reference: {syllabusResourceLabel(topic.resource)}</p>}
                </article>
              })}
            </div>
          </section>)}
        </div> : <p className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-8 text-center text-sm text-white/65">No syllabus items match “{search}”. Try another term.</p>}
      </section>

      {course.examPlan?.length > 0 && <section className="mt-12 border-t border-white/10 pt-8" aria-labelledby={`exam-plan-${module.id}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Practice plan</p>
            <h2 id={`exam-plan-${module.id}`} className="mt-1 font-display text-2xl font-semibold text-white">{course.examPlanTitle || 'Exam plan'}</h2>
            {course.examPlanIntro && <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">{course.examPlanIntro}</p>}
          </div>
          {course.examPlanOverviewHref && <Link to={course.examPlanOverviewHref} className="rounded-lg border border-amber-200/20 px-3.5 py-2.5 text-sm font-medium text-amber-100/85 transition hover:bg-amber-200/[0.06] hover:text-white">Browse all five exams</Link>}
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {course.examPlan.map((exam) => <li key={exam.title} className="flex min-h-44 flex-col rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-white/90">{exam.title}</h3>
              <Pill tone="amber">{exam.weeks}</Pill>
            </div>
            <p className="mt-4 text-sm font-medium text-white/85">{exam.topics}</p>
            <p className="mt-1 text-xs text-white/55">{exam.courseParts}</p>
            <Link to={exam.href} className="mt-auto pt-4 text-xs font-medium text-indigo-200 transition hover:text-white">Practice this exam</Link>
          </li>)}
        </ol>
      </section>}

      {course.contentNote && <aside className="mt-9 rounded-xl border border-sky-200/15 bg-sky-200/[0.035] p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-sky-100/85">{course.contentNoteTitle || 'Course note'}</p>
        <p className="mt-2 text-sm leading-6 text-white/75">{course.contentNote}</p>
      </aside>}

      <StudyResources resources={course.resources} id={`resources-${module.id}`} />
    </main>
  )
}

function CoursePending({ module }) {
  return <main className="learning-surface w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-10 2xl:px-14">
    <Link to="/" className="text-sm text-white/75 hover:text-white">← Course library</Link>
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Course material</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{module.title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-white/75">{module.tagline}</p>
      <p className="mt-6 max-w-2xl text-sm leading-6 text-white/70">This course has its own place in the library. Add its lesson material to show dedicated topic pages, examples, and practice here.</p>
      <Link to={`/quiz/${module.id}`} className="mt-7 inline-flex text-sm text-white/70 hover:text-white">Optional self-check quiz →</Link>
    </section>
  </main>
}

export default function StudyGuide() {
  const { moduleId } = useParams()
  const module = getModule(moduleId)
  const course = getCourseSyllabus(moduleId)

  if (!module) return <CoursePending module={{ title: 'Course not found', tagline: 'Choose a course from the course library.' }} />
  if (!course) return <CoursePending module={module} />
  if (moduleId === 'node-js') return <NodeStudyGuide module={module} course={course} />
  if (course.syllabusOnly) return <SyllabusOnlyReader module={module} course={course} />
  return <CourseReader module={module} course={course} />
}
