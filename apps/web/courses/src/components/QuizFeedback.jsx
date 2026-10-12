import { motion } from 'framer-motion'
import Icon from './Icon'
import QuizVisual from './QuizVisual'
import { getSqlVisualLabHref } from '../lib/paths'
import { getQuestionTakeaway } from '../lib/quiz-explanations'

function getTryItHref(tryIt) {
  if (tryIt?.href) return tryIt.href
  if (!tryIt?.query) return ''
  const destination = new URL(getSqlVisualLabHref(), window.location.origin)
  destination.hash = new URLSearchParams({ query: tryIt.query }).toString()
  return `${destination.pathname}${destination.search}${destination.hash}`
}

export default function QuizFeedback({ question, correct }) {
  const takeaway = getQuestionTakeaway(question)
  const tryItHref = getTryItHref(question.tryIt)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: 5 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: 5 }}
      transition={{ duration: 0.24 }}
      className="mt-5 overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={`rounded-xl border p-4 ${correct ? 'border-emerald-300/20 bg-emerald-300/[0.055]' : 'border-amber-300/20 bg-amber-300/[0.045]'}`}>
        <div className="mb-4 flex items-start gap-3">
          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${correct ? 'bg-emerald-300/15 text-emerald-200' : 'bg-amber-300/15 text-amber-100'}`}>
            <Icon name={correct ? 'check' : 'lightbulb'} size={15} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">{correct ? 'Correct — here is why' : 'Review the key idea'}</h3>
            <p className="mt-1 text-xs leading-5 text-white/55">{correct ? 'Connect the answer to the rule so it is easier to recall.' : 'Compare the right answer with the rule behind it.'}</p>
          </div>
        </div>

        {question.explanation && (
          <section className="border-t border-white/10 pt-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/45">Why this is right</h4>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-white/75">{question.explanation}</p>
          </section>
        )}

        {question.commonMistake && (
          <section className="mt-3 rounded-lg border border-amber-200/15 bg-amber-200/[0.055] px-3 py-2.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100/75">Common mistake</h4>
            <p className="mt-1 text-xs leading-5 text-white/70">{question.commonMistake}</p>
          </section>
        )}

        {takeaway && (
          <section className="mt-3 rounded-lg border border-indigo-200/15 bg-indigo-200/[0.055] px-3 py-2.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-100/75">Remember this</h4>
            <p className="mt-1 text-xs font-medium leading-5 text-white/80">{takeaway}</p>
          </section>
        )}

        {question.visual && <div className="mt-4"><QuizVisual visual={question.visual} /></div>}

        {tryItHref && (
          <div className="mt-4">
            <a href={tryItHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-indigo-200/25 bg-indigo-200/10 px-4 py-2 text-xs font-semibold text-indigo-100 transition hover:border-indigo-200/40 hover:bg-indigo-200/15 focus-visible:outline-indigo-200">
              <Icon name="play" size={14} />
              {question.tryIt.label || 'Try it in SQL Visual Lab'}
              <span aria-hidden="true">→</span>
            </a>
            {question.tryIt.description && <p className="mt-2 text-[11px] leading-5 text-white/45">{question.tryIt.description}</p>}
          </div>
        )}
      </div>
    </motion.div>
  )
}
