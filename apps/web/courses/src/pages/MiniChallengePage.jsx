import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getModule } from '../data/modules'
import { getCourseContent } from '../data/course-catalog'
import { loadCourseActivity } from '../data/courses/loaders'
import { RichLessonText } from '../components/LessonContent'

function splitAnswerKey(content = '', title = '') {
  const lines = content.split(/\r?\n/)
  if (lines[0]?.trim() === title.trim()) lines.shift()
  const answerIndex = lines.findIndex((line) => /^\s*answer key\s*$/i.test(line))
  if (answerIndex < 0) return { challenge: content.trim(), answer: '' }
  return {
    challenge: lines.slice(0, answerIndex).join('\n').trim(),
    answer: lines.slice(answerIndex + 1).join('\n').trim(),
  }
}

function answerTextIsMissing(content = '') {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  return lines.length > 0 && lines.every((line) => /^challenge\s+\d+\s+answer:?$/i.test(line))
}

function ChallengeLoading({ module }) {
  return <main className="learning-surface w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-10 2xl:px-14"><Link to={`/course/${module.id}`} className="text-sm text-white/50">← Back to {module.title}</Link><p className="mt-10 text-sm text-white/45">Opening practice challenge…</p></main>
}

export default function MiniChallengePage() {
  const { moduleId, activityId } = useParams()
  const module = getModule(moduleId)
  const course = getCourseContent(moduleId)
  const activitySummary = course?.practiceUnits?.find((item) => item.id === activityId)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setActivity(null)
    setLoading(true)
    if (activityId) {
      loadCourseActivity(moduleId, activityId).then((result) => {
        if (mounted) setActivity(result)
      }).catch(() => {
        if (mounted) setActivity(null)
      }).finally(() => {
        if (mounted) setLoading(false)
      })
    } else setLoading(false)
    return () => { mounted = false }
  }, [moduleId, activityId])

  if (!module || !course || !activitySummary) {
    return <main className="learning-surface w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-10 2xl:px-14"><Link to="/" className="text-sm text-white/50">← Course library</Link><h1 className="mt-8 font-display text-3xl font-bold text-white">Practice challenge unavailable</h1></main>
  }
  if (loading) return <ChallengeLoading module={module} />
  if (!activity) return <main className="learning-surface w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-10 2xl:px-14"><Link to={`/course/${module.id}`} className="text-sm text-white/50">← Back to {module.title}</Link><h1 className="mt-8 font-display text-3xl font-bold text-white">Practice challenge unavailable</h1></main>

  const { challenge, answer } = splitAnswerKey(activity.content, activity.title)
  const activities = course.practiceUnits
  const activityIndex = activities.findIndex((item) => item.id === activityId)
  const next = activities[activityIndex + 1]
  const previous = activities[activityIndex - 1]

  return (
    <main className="learning-surface w-full px-4 py-6 sm:px-6 sm:py-9 lg:px-10 2xl:px-14">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <Link to={`/course/${module.id}`} className="text-sm text-white/50 transition hover:text-white">← {module.title} course</Link>
        <span className="text-xs text-white/40">Part {activity.part} · Practice challenge</span>
      </div>
      <header className="border-b border-white/10 pb-7 sm:pb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">Course practice</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">{activity.title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Try the questions on your own, then review the supplied answer key.</p>
      </header>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
        <div className="mb-3 flex items-center gap-2"><span className="rounded-full border border-emerald-200/15 bg-emerald-200/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-wider text-emerald-100/75">Challenge</span><span className="text-xs text-white/35">Difficulty: {activity.difficulty}</span></div>
        <RichLessonText content={challenge} />
      </section>

      <section className="mt-4 rounded-2xl border border-indigo-200/10 bg-indigo-200/[0.025] p-5 sm:p-7">
        <div className="mb-3 flex items-center gap-2"><span className="rounded-full border border-indigo-200/15 bg-indigo-200/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-wider text-indigo-100/75">Answer key</span></div>
        {answer ? <>
          {answerTextIsMissing(answer) && <p className="mb-3 rounded-lg border border-amber-200/10 bg-amber-200/[0.035] px-3.5 py-3 text-xs leading-5 text-amber-100/70">The supplied export lists answer headings but does not include the answer text.</p>}
          <RichLessonText content={answer} />
        </> : <p className="text-sm leading-6 text-white/45">The supplied export does not include answer text for this challenge.</p>}
      </section>

      <nav aria-label="Challenge navigation" className="mt-6 grid gap-3 sm:grid-cols-2">
        {previous ? <Link to={`/course/${module.id}/activity/${previous.id}`} className="rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:bg-white/[0.045]"><p className="text-[10px] uppercase tracking-wider text-white/35">Previous challenge</p><p className="mt-1 font-medium text-white/80">← {previous.title}</p></Link> : <div />}
        {next ? <Link to={`/course/${module.id}/activity/${next.id}`} className="rounded-xl border border-amber-200/10 bg-amber-200/[0.025] p-4 text-left transition hover:bg-amber-200/[0.045] sm:text-right"><p className="text-[10px] uppercase tracking-wider text-white/35">Next challenge</p><p className="mt-1 font-medium text-amber-100/85">{next.title} →</p></Link> : <Link to={`/course/${module.id}`} className="rounded-xl border border-indigo-200/10 bg-indigo-200/[0.025] p-4 text-left transition hover:bg-indigo-200/[0.045] sm:text-right"><p className="text-[10px] uppercase tracking-wider text-white/35">Practice complete</p><p className="mt-1 font-medium text-indigo-100/85">Return to course →</p></Link>}
      </nav>
    </main>
  )
}
