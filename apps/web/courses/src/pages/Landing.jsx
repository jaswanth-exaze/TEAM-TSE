import { useMemo, useState } from 'react'
import ModuleCard from '../components/ModuleCard'
import { TRACKS } from '../data/modules'
import { COURSE_MODULES, getCourseSyllabus } from '../data/course-catalog'
import { getGitLabHref, getLinuxLabHref, getSqlVisualLabHref } from '../lib/paths'
import { appStorageKey } from '../lib/storage'

const COURSE_STUDIOS = {
  'html-css-javascript': { href: '/course/html-css-javascript/lab', label: 'Frontend Mission Studio' },
  'node-js': { href: '/course/node-js/lab', label: 'Company Network Ops' },
  express: { href: '/course/express/lab', label: 'Express Request Studio' },
  'rest-api-fundamentals': { href: '/course/rest-api-fundamentals/lab', label: 'API Operations Studio' },
  'unit-testing-fundamentals': { href: '/course/unit-testing-fundamentals/lab', label: 'Unit Testing Studio' },
  'jwt-authentication': { href: '/course/jwt-authentication/lab', label: 'JWT Visual Studio' },
  'password-salt-hash-fundamenta': { href: '/course/password-salt-hash-fundamenta/lab', label: 'Password Hash Studio' },
}

function getStudioLink(moduleId) {
  if (moduleId === 'mysql') return { href: getSqlVisualLabHref(), label: 'Visual SQL Lab' }
  if (moduleId === 'linux-commands') return { href: getLinuxLabHref(), label: 'Linux Visual Lab' }
  if (moduleId === 'git') return { href: getGitLabHref(), label: 'Git Interactive Lab' }
  return COURSE_STUDIOS[moduleId] || null
}

function readCompletedLessons(moduleId, topics) {
  try {
    const stored = JSON.parse(localStorage.getItem(appStorageKey(`study:${moduleId}:v1`)))
    const validIds = new Set(topics.map((topic) => topic.id))
    return Array.isArray(stored) ? stored.filter((id) => validIds.has(id)) : []
  } catch {
    return []
  }
}

export default function Landing() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const coursesByTrack = useMemo(() => TRACKS.map((track) => ({
    ...track,
    label: track.id === 'foundation' ? 'Foundation courses' : 'Advanced courses',
    modules: track.modules.map((module) => {
      const course = COURSE_MODULES.find((item) => item.id === module.id)
      const syllabusAvailable = Boolean(getCourseSyllabus(module.id))
      const topics = course?.courseContent?.parts.flatMap((part) => part.topics) || []
      const completed = readCompletedLessons(module.id, topics)
      const completedIds = new Set(completed)
      const nextTopic = topics.find((topic) => !completedIds.has(topic.id))
      const allComplete = topics.length > 0 && completed.length === topics.length
      const studio = getStudioLink(module.id)

      return {
        ...module,
        labHref: studio?.href || null,
        labLabel: studio?.label || 'Practice lab',
        courseReady: topics.length > 0,
        syllabusAvailable,
        lessonCount: topics.length,
        courseProgressLabel: module.id === 'node-js' ? '26 topics' : null,
        completedCount: completed.length,
        continueHref: topics.length
          ? nextTopic
            ? `/course/${module.id}/topic/${nextTopic.id}`
            : `/course/${module.id}`
          : null,
        continueLabel: completed.length
          ? allComplete ? 'Review lessons' : 'Continue learning'
          : 'Start learning',
      }
    }),
  })), [])

  const allCourses = coursesByTrack.flatMap((track) => track.modules)
  const matchingCount = allCourses.filter((course) => {
    const matchesSearch = `${course.title} ${course.tagline}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'available' ? course.courseReady : !course.courseReady)
    return matchesSearch && matchesFilter
  }).length

  function matches(course) {
    const matchesSearch = `${course.title} ${course.tagline}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'available' ? course.courseReady : !course.courseReady)
    return matchesSearch && matchesFilter
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <header className="mb-9 overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel-bg)] shadow-xl shadow-black/10 sm:mb-10">
        <div className="relative isolate p-5 sm:p-8 lg:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-indigo-200/20 bg-indigo-200/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-100">TSE trainee learning hub</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65">Learn · practise · grow</span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">Build skills one lesson at a time.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
            Start with guided course lessons, apply each idea in practice, then use an optional quiz to check what stayed with you.
          </p>
        </div>
      </header>

      <section aria-labelledby="browse-heading">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="browse-heading" className="font-display text-xl font-semibold text-white">Choose a course</h2>
            <p className="mt-1 text-sm text-white/70">Start with MySQL, or find another course below.</p>
          </div>
          <p className="text-sm text-white/65" aria-live="polite">Showing {matchingCount} of {allCourses.length}</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search courses</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses"
              className="w-full rounded-lg border border-white/15 bg-black/15 px-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/55 focus:border-indigo-200/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
            />
          </label>
          <div role="group" aria-label="Filter courses" className="flex flex-wrap gap-2">
            {[
              ['all', 'All courses'],
              ['available', 'Lessons available'],
              ['coming-soon', 'Coming soon'],
            ].map(([value, label]) => <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 ${filter === value ? 'border-indigo-200/40 bg-indigo-200/10 text-indigo-100' : 'border-white/15 text-white/75 hover:bg-white/[0.06] hover:text-white'}`}
            >{label}</button>)}
          </div>
        </div>

        <div className="space-y-9">
          {coursesByTrack.map((track) => {
            const modules = track.modules.filter(matches)
            if (!modules.length) return null
            return <section key={track.id} aria-labelledby={`track-${track.id}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id={`track-${track.id}`} className="font-display text-base font-semibold text-white/90">{track.label}</h3>
                <span className="text-sm text-white/65">{modules.length} courses</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => <ModuleCard key={module.id} mod={module} {...module} />)}
              </div>
            </section>
          })}
        </div>

        {matchingCount === 0 && <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-8 text-center">
          <p className="text-sm font-medium text-white/85">No courses found</p>
          <p className="mt-1 text-sm text-white/65">Try another name or choose a different filter.</p>
        </div>}
      </section>
    </main>
  )
}
