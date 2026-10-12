import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function ModuleCard({
  mod,
  progress,
  labHref,
  labLabel,
  courseReady = false,
  syllabusAvailable = false,
  lessonCount = 0,
  courseProgressLabel,
}) {
  const checkpoint = progress?.inProgress
  const hasCheckpoint = Boolean(checkpoint?.questions?.length)
  const hasQuiz = mod.hasQuiz !== false
  const total = progress?.total ?? 0
  const best = progress?.best ?? 0
  const quizStatus = !hasQuiz
    ? 'Lessons ready'
    : hasCheckpoint
      ? 'Quiz in progress'
      : total
        ? `Quiz best: ${best}/${total}`
        : 'Quiz not started'
  const courseStatus = courseReady
    ? courseProgressLabel || `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`
    : syllabusAvailable
      ? 'Syllabus available'
      : 'Course content pending'
  const courseAction = courseReady
    ? 'Open course'
    : syllabusAvailable
      ? 'View syllabus'
      : 'Open course page'

  return (
    <motion.article
      whileHover={{ y: -4, borderColor: `${mod.color}70`, boxShadow: `0 0 22px ${mod.color}24` }}
      className="group relative h-full min-h-[220px] w-full overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.035] p-4 transition-colors sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${mod.color}1f`, color: mod.color }}
          aria-hidden="true"
        >
          <Icon name={mod.icon} size={21} />
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${courseReady || syllabusAvailable ? 'border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100/75' : 'border-white/10 bg-white/[0.035] text-white/45'}`}>
          {courseStatus}
        </span>
      </div>

      <Link to={`/course/${mod.id}`} className="mt-3 block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60">
        <h3 className="font-display text-base font-semibold text-white/90 transition group-hover:text-white">{mod.title}</h3>
        <p className="mt-1 min-h-9 text-xs leading-relaxed text-white/55">{mod.tagline}</p>
        <span className="mt-2 inline-block text-sm font-semibold text-indigo-200 transition group-hover:text-indigo-100">
          {courseAction} <span aria-hidden="true">&rarr;</span>
        </span>
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-white/[0.08] pt-3">
        <span className="truncate text-[11px] text-white/45">{quizStatus}</span>
        <div className="flex items-center gap-1">
          {labHref && <a href={labHref} className="rounded-md px-2 py-1 text-xs font-medium text-amber-200/85 transition hover:bg-amber-200/[0.06] hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200">{labLabel || 'Practice lab'}</a>}
          {hasQuiz && <Link to={`/quiz/${mod.id}`} className="shrink-0 rounded-md px-2 py-1 text-xs text-white/55 transition hover:bg-white/[0.06] hover:text-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60">
          Practice quiz
          </Link>}
        </div>
      </div>
    </motion.article>
  )
}
