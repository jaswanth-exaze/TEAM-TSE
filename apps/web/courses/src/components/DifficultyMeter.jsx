import { DIFFICULTY_LEVELS, getDifficultyMeta, getDifficultyRank } from '../lib/difficulty'

export default function DifficultyMeter({ difficulty }) {
  const meta = getDifficultyMeta(difficulty)
  const activeRank = getDifficultyRank(difficulty)
  const activeColor = `var(--difficulty-${meta.id})`

  return (
    <div
      className="min-w-[176px]"
      aria-label={`Difficulty: ${meta.label}`}
      title={`Difficulty: ${meta.label}`}
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        {DIFFICULTY_LEVELS.map((level, index) => (
          <span
            key={level.id}
            className="h-1.5 flex-1 rounded-full"
            style={{
              background: index <= activeRank ? `var(--difficulty-${level.id})` : 'var(--meter-track)',
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-semibold uppercase tracking-wide">
        {DIFFICULTY_LEVELS.map((level) => (
          <span key={level.id} style={{ color: level.id === meta.id ? activeColor : 'var(--meter-muted)' }}>
            {level.label}
          </span>
        ))}
      </div>
    </div>
  )
}
