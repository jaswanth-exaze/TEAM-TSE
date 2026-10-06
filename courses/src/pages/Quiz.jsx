import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getModule, quizLoaders } from '../data/modules'
import { getModuleProgress, saveModuleCheckpoint, saveModuleResult } from '../lib/progress'
import OptionButton from '../components/OptionButton'
import Icon from '../components/Icon'
import QuizFeedback from '../components/QuizFeedback'
import { getQuestionTakeaway } from '../lib/quiz-explanations'
import DifficultyMeter from '../components/DifficultyMeter'
import { getDifficultyRank, normalizeDifficulty } from '../lib/difficulty'
import { appStorageKey } from '../lib/storage'

const TIME_LIMITS = { beginner: 30, medium: 60, hard: 90 }

function normalize(str) {
  return String(str).trim().toLowerCase().replace(/\s+/g, ' ')
}

function isCorrectAnswer(q, given) {
  if (q.type === 'multi') {
    const a = [...given].sort()
    const b = [...q.correctAnswer].sort()
    return a.length === b.length && a.every((v, i) => v === b[i])
  }
  if (q.type === 'text') {
    const accepted = [q.correctAnswer, ...(q.acceptableAnswers || [])].map(normalize)
    return accepted.includes(normalize(given || ''))
  }
  return given === q.correctAnswer
}

function getOptionNote(question, option, isCorrect, isSelected) {
  const authoredNote = question.optionNotes?.[option]
  if (authoredNote) return authoredNote
  if (isCorrect && question.type === 'multi' && !isSelected) return 'This is a correct choice that was left unselected.'
  if (isCorrect) return 'Correct answer.'
  if (!isSelected) return ''
  if (question.commonMistake) return `Common mistake: ${question.commonMistake}`
  const takeaway = getQuestionTakeaway(question)
  return takeaway ? `Key idea: ${takeaway}` : 'Compare this choice with the explanation below.'
}

function shuffleOptions(options) {
  const shuffled = [...options]

  // Fisher-Yates gives every option position an equal chance.
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

function prepareQuestions(quiz) {
  return [...quiz]
    .sort((a, b) => getDifficultyRank(a.difficulty) - getDifficultyRank(b.difficulty))
    .map((question) => {
      const options = question.type === 'tf' ? ['True', 'False'] : question.options
      const optionNotes = Array.isArray(question.optionNotes)
        ? Object.fromEntries((options || []).map((option, index) => [option, question.optionNotes[index]]).filter(([, note]) => note))
        : question.optionNotes

      return {
        ...question,
        difficulty: normalizeDifficulty(question.difficulty),
        ...(optionNotes ? { optionNotes } : {}),
        ...(options ? { options: shuffleOptions(options) } : {}),
      }
    })
}

function refreshCheckpointQuestions(savedQuestions, currentQuestions) {
  const currentById = new Map(currentQuestions.map((question) => [question.id, question]))
  return savedQuestions.map((saved) => {
    const current = currentById.get(saved.id)
    if (!current) return saved
    return { ...saved, ...current, options: saved.options || current.options }
  })
}

export default function Quiz() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const mod = getModule(moduleId)

  const [questions, setQuestions] = useState(null)
  const [quizUnavailable, setQuizUnavailable] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null) // string | string[] | null
  const [textValue, setTextValue] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMITS.beginner)
  const [timerEnabled, setTimerEnabled] = useState(() => localStorage.getItem(appStorageKey('timer-enabled')) !== 'false')
  const checkpointStateRef = useRef({})
  checkpointStateRef.current = { score, answers, selected, textValue }

  useEffect(() => {
    let active = true
    setQuestions(null)
    setQuizUnavailable(false)
    setIndex(0)
    setScore(0)
    setAnswers([])
    resetQuestionState()
    const loadQuiz = quizLoaders[moduleId]
    if (!loadQuiz) {
      setQuizUnavailable(true)
      return () => { active = false }
    }

    loadQuiz().then((m) => {
      if (!active) return

      const checkpoint = getModuleProgress(moduleId)?.inProgress
      if (checkpoint?.questions?.length) {
        const resumedQuestions = refreshCheckpointQuestions(checkpoint.questions, prepareQuestions(m.default))
        setQuestions(resumedQuestions)
        setIndex(Math.min(checkpoint.index ?? 0, resumedQuestions.length - 1))
        setScore(checkpoint.score ?? 0)
        setAnswers(checkpoint.answers ?? [])
        setSelected(checkpoint.selected ?? null)
        setTextValue(checkpoint.textValue ?? '')
        setRevealed(Boolean(checkpoint.revealed))
      } else {
        const prepared = prepareQuestions(m.default)
        setQuestions(prepared)
        saveModuleCheckpoint(moduleId, {
          questions: prepared,
          index: 0,
          score: 0,
          answers: [],
          revealed: false,
          selected: null,
          textValue: '',
        })
      }
    }).catch(() => {
      if (active) setQuizUnavailable(true)
    })
    return () => {
      active = false
    }
  }, [moduleId])

  useEffect(() => {
    const currentQuestion = questions?.[index]
    if (!currentQuestion || revealed || !timerEnabled) return undefined

    const limit = TIME_LIMITS[currentQuestion.difficulty] ?? TIME_LIMITS.medium
    let remaining = limit
    setTimeRemaining(limit)
    const interval = setInterval(() => {
      remaining -= 1
      setTimeRemaining(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        setRevealed(true)
        const latest = checkpointStateRef.current
        const nextAnswers = [...latest.answers, { question: currentQuestion, given: null, correct: false, timedOut: true }]
        setAnswers(nextAnswers)
        saveModuleCheckpoint(moduleId, {
          questions,
          index,
          score: latest.score,
          answers: nextAnswers,
          revealed: true,
          selected: latest.selected,
          textValue: latest.textValue,
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [moduleId, questions, index, revealed, timerEnabled])

  function resetQuestionState() {
    setSelected(null)
    setTextValue('')
    setRevealed(false)
  }

  if (!mod) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center text-white/60">
        Module not found.{' '}
        <button className="text-indigo-400 underline" onClick={() => navigate('/')}>
          Open course library
        </button>
      </div>
    )
  }

  if (quizUnavailable) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-white">Quiz not available</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">There isn’t a self-check quiz for {mod.title} yet.</p>
        <button className="mt-5 text-sm text-indigo-200 underline hover:text-indigo-100" onClick={() => navigate(`/course/${moduleId}`)}>
          Open course lessons
        </button>
      </div>
    )
  }

  if (!questions) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="h-8 w-8 rounded-full border-2 border-white/10 border-t-indigo-400"
        />
      </div>
    )
  }

  const q = questions[index]
  const progressPct = Math.round((index / questions.length) * 100)
  const timeLimit = TIME_LIMITS[q.difficulty] ?? TIME_LIMITS.medium
  const timerPct = Math.max(0, (timeRemaining / timeLimit) * 100)
  const timerColor = timeRemaining <= 10 ? 'var(--status-danger)' : timeRemaining <= 20 ? 'var(--status-warning)' : 'var(--status-success)'

  function toggleOption(opt) {
    if (revealed) return
    if (q.type === 'multi') {
      setSelected((prev) => {
        const arr = prev || []
        return arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt]
      })
    } else {
      setSelected(opt)
    }
  }

  function handleSubmit() {
    if (revealed) return
    const given = q.type === 'text' ? textValue : selected
    if (q.type === 'text' && !textValue.trim()) return
    if (q.type !== 'text' && (given === null || (Array.isArray(given) && given.length === 0))) return

    const correct = isCorrectAnswer(q, given)
    setRevealed(true)
    if (correct) setScore((s) => s + 1)
    const nextAnswers = [...answers, { question: q, given, correct }]
    setAnswers(nextAnswers)
    saveModuleCheckpoint(moduleId, {
      questions,
      index,
      score: score + (correct ? 1 : 0),
      answers: nextAnswers,
      revealed: true,
      selected,
      textValue,
    })
  }

  function handleNext() {
    if (index + 1 < questions.length) {
      const nextIndex = index + 1
      saveModuleCheckpoint(moduleId, {
        questions,
        index: nextIndex,
        score,
        answers,
        revealed: false,
        selected: null,
        textValue: '',
      })
      setIndex(nextIndex)
      resetQuestionState()
    } else {
      saveModuleResult(moduleId, { score, total: questions.length, answers })
      navigate(`/results/${moduleId}`, { state: { score, total: questions.length, answers, mod } })
    }
  }

  const canSubmit = q.type === 'text' ? textValue.trim().length > 0 : q.type === 'multi' ? (selected || []).length > 0 : selected !== null
  const feedbackCorrect = answers.at(-1)?.question.id === q.id && Boolean(answers.at(-1)?.correct)

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* top bar */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
        >
          <Icon name="arrowRight" size={14} className="rotate-180" /> Course library
        </button>
        <div className="flex items-center gap-2 text-xs font-medium text-white/50">
          <span className="theme-accent" style={{ '--module-accent': mod.color }}>{mod.title}</span>
          <span>·</span>
          <span>
            {index + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: mod.color }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="mb-7 space-y-3">
        <div className="flex justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={timerEnabled}
            aria-label="Question timer"
            onClick={() => setTimerEnabled((enabled) => {
              const next = !enabled
              localStorage.setItem(appStorageKey('timer-enabled'), String(next))
              return next
            })}
            className="flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Icon name="clock" size={14} />
            <span>Timer</span>
            <span className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors ${timerEnabled ? 'bg-emerald-400/80' : 'bg-white/20'}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[var(--switch-thumb)] transition-[left] ${timerEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </span>
            <span className="w-7 shrink-0 text-left">{timerEnabled ? 'On' : 'Off'}</span>
          </button>
        </div>
        <div className="flex min-h-8 items-center gap-3">
          {timerEnabled ? (
            <>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8" aria-label="Question timer">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: timerColor }}
                  animate={{ width: `${timerPct}%` }}
                  transition={{ duration: 0.3, ease: 'linear' }}
                />
              </div>
              <div
                className="min-w-[76px] rounded-md border px-2.5 py-1 text-center font-mono text-sm font-semibold tabular-nums"
                style={{
                  color: timerColor,
                  borderColor: `color-mix(in srgb, ${timerColor} 42%, transparent)`,
                  background: `color-mix(in srgb, ${timerColor} 10%, transparent)`,
                }}
                aria-label={revealed ? 'Timer stopped' : `${timeRemaining} seconds remaining`}
              >
                {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}
              </div>
            </>
          ) : (
            <span className="text-xs text-white/40">Untimed practice</span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="-mx-3 rounded-lg bg-[var(--panel-bg)]/90 px-4 py-5 shadow-[0_12px_48px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:-mx-4 sm:px-5"
        >
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <DifficultyMeter difficulty={q.difficulty} />
            <span className="text-[10px] uppercase tracking-wide text-white/30">
              {q.type === 'code-output' ? 'predict output' : q.type === 'multi' ? 'select all' : q.type === 'text' ? 'type answer' : q.type === 'tf' ? 'true/false' : 'multiple choice'}
            </span>
            {q.category && (
              <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                {q.category}
              </span>
            )}
          </div>

          <h2 className="mb-6 whitespace-pre-wrap font-mono text-[15px] font-medium leading-relaxed text-white sm:text-base">
            {q.prompt}
          </h2>

          {q.type === 'text' ? (
            <div className="space-y-3">
              <input
                autoFocus
                disabled={revealed}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !revealed && handleSubmit()}
                placeholder={"Type your answer\u2026"}
                className={`w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3.5 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/50 ${
                  revealed
                    ? isCorrectAnswer(q, textValue)
                      ? 'border-emerald-400/60 bg-emerald-400/10'
                      : 'border-rose-400/60 bg-rose-400/10'
                    : 'focus:border-indigo-400/60'
                }`}
              />
              {revealed && !isCorrectAnswer(q, textValue) && (
                <p className="text-sm text-white/50">
                  Correct answer: <span className="font-mono text-emerald-400">{q.correctAnswer}</span>
                </p>
              )}
            </div>
          ) : q.type === 'tf' ? (
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, optionIndex) => (
                <OptionButton
                  key={opt}
                  label={opt}
                  selected={selected === opt}
                  revealed={revealed}
                  isCorrect={opt === q.correctAnswer}
                  note={revealed ? getOptionNote(q, opt, opt === q.correctAnswer, selected === opt) : ''}
                  noteTone={opt === q.correctAnswer ? 'success' : 'help'}
                  noteId={`quiz-${q.id}-option-${optionIndex}-note`}
                  disabled={revealed}
                  onClick={() => toggleOption(opt)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {q.options.map((opt, optionIndex) => {
                const isCorrect = q.type === 'multi' ? q.correctAnswer.includes(opt) : opt === q.correctAnswer
                const isSelected = q.type === 'multi' ? (selected || []).includes(opt) : selected === opt
                return (
                  <OptionButton
                    key={opt}
                    label={opt}
                    multi={q.type === 'multi'}
                    selected={isSelected}
                    revealed={revealed}
                    isCorrect={isCorrect}
                    note={revealed ? getOptionNote(q, opt, isCorrect, isSelected) : ''}
                    noteTone={isCorrect ? 'success' : 'help'}
                    noteId={`quiz-${q.id}-option-${optionIndex}-note`}
                    disabled={revealed}
                    onClick={() => toggleOption(opt)}
                  />
                )
              })}
            </div>
          )}

          <AnimatePresence>
            {revealed && (q.explanation || q.visual || q.commonMistake || q.takeaway) && (
              <QuizFeedback key={`${q.id}-feedback`} question={q} correct={feedbackCorrect} />
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-end">
            {!revealed ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="rounded-xl bg-[var(--action-primary)] px-6 py-3 text-sm font-semibold text-[var(--action-primary-fg)] transition-colors hover:bg-[var(--action-primary-hover)] disabled:opacity-40"
              >
                Check answer
              </motion.button>
            ) : (
              <div className="flex items-center gap-3">
                {timeRemaining === 0 && answers.at(-1)?.question.id === q.id && answers.at(-1)?.timedOut && (
                  <span className="text-xs font-medium text-rose-300">Time is up</span>
                )}
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black"
                >
                  {index + 1 < questions.length ? 'Next question' : 'See results'}
                  <Icon name="arrowRight" size={15} />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
