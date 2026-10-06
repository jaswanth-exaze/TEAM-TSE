import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ModuleCard from '../components/ModuleCard'
import { TRACKS } from '../data/modules'
import { COURSE_MODULES, getCourseSyllabus } from '../data/course-catalog'
import { getAllProgress } from '../lib/progress'
import { getLinuxLabHref } from '../lib/paths'
import { appStorageKey } from '../lib/storage'

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

      return {
        ...module,
        labHref: module.id === 'linux-commands' ? getLinuxLabHref() : null,
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
        quizProgress: getAllProgress()[module.id],
      }
    }),
  })), [])

  const allCourses = coursesByTrack.flatMap((track) => track.modules)
  const lessonsAvailable = allCourses.filter((course) => course.courseReady).length
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
      <header className="mb-9 border-b border-white/10 pb-7 sm:mb-10 sm:pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">TEAM TSE learning</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Course library</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
          Learn from the course pages first. Use a quiz whenever you want a quick self-check.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
          <span>{allCourses.length} courses</span>
          <span>{lessonsAvailable} course{lessonsAvailable === 1 ? '' : 's'} with lessons</span>
          <span>Quizzes available for practice</span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="text-white/55">Browse syllabi:</span>
          <Link to="/course/mysql" className="rounded-md border border-white/10 px-3 py-1.5 text-white/80 transition hover:border-indigo-200/30 hover:bg-indigo-200/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">MySQL</Link>
          <Link to="/course/linux-commands" className="rounded-md border border-white/10 px-3 py-1.5 text-white/80 transition hover:border-indigo-200/30 hover:bg-indigo-200/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">Linux Commands</Link>
          <Link to="/course/git" className="rounded-md border border-white/10 px-3 py-1.5 text-white/80 transition hover:border-indigo-200/30 hover:bg-indigo-200/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">Git</Link>
          <Link to="/course/html-css-javascript" className="rounded-md border border-white/10 px-3 py-1.5 text-white/80 transition hover:border-indigo-200/30 hover:bg-indigo-200/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">HTML + CSS + JavaScript</Link>
          <Link to="/course/unit-testing-fundamentals" className="rounded-md border border-white/10 px-3 py-1.5 text-white/80 transition hover:border-indigo-200/30 hover:bg-indigo-200/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">Unit Testing Fundamentals</Link>
          <Link to="/course/rest-api-fundamentals" className="rounded-md border border-white/10 px-3 py-1.5 text-white/80 transition hover:border-indigo-200/30 hover:bg-indigo-200/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">REST API Fundamentals</Link>
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
                {modules.map((module) => <ModuleCard key={module.id} mod={module} {...module} progress={module.quizProgress} />)}
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
