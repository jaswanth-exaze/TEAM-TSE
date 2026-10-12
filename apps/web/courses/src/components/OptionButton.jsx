import { motion } from 'framer-motion'
import Icon from './Icon'

export default function OptionButton({ label, selected, revealed, isCorrect, disabled, onClick, multi, note = '', noteTone = 'help', noteId }) {
  let stateClasses = 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
  let icon = null

  if (revealed) {
    if (isCorrect) {
      stateClasses = 'border-emerald-400/60 bg-emerald-400/10'
      icon = <Icon name="check" size={16} className="text-emerald-400" />
    } else if (selected && !isCorrect) {
      stateClasses = 'border-rose-400/60 bg-rose-400/10'
      icon = <Icon name="x" size={16} className="text-rose-400" />
    } else {
      stateClasses = 'border-white/5 bg-white/[0.02] opacity-50'
    }
  } else if (selected) {
    stateClasses = 'border-indigo-400/70 bg-indigo-400/10'
  }

  return (
    <div className="min-w-0">
      <motion.button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-describedby={note ? noteId : undefined}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        animate={revealed && selected && !isCorrect ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={revealed && selected && !isCorrect ? { duration: 0.4 } : { duration: 0.15 }}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm text-white/85 transition-colors ${stateClasses}`}
      >
        <span className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] ${
              selected ? 'border-indigo-400 bg-indigo-400/20' : 'border-white/20'
            } ${multi ? '' : 'rounded-full'}`}
          >
            {selected && !revealed && <span className="h-2 w-2 rounded-sm bg-indigo-300" />}
          </span>
          <span className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed sm:text-sm">{label}</span>
        </span>
        {icon}
      </motion.button>
      {note && (
        <p id={noteId} className={`flex items-start gap-2 px-3 pb-1 pt-2 text-xs leading-5 ${noteTone === 'success' ? 'text-emerald-200/85' : 'text-amber-100/75'}`}>
          <Icon name={noteTone === 'success' ? 'check' : 'lightbulb'} size={13} className="mt-0.5 shrink-0" />
          <span>{note}</span>
        </p>
      )}
    </div>
  )
}
