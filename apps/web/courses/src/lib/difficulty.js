export const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', color: '#33c9a3' },
  { id: 'medium', label: 'Medium', color: '#f5a623' },
  { id: 'hard', label: 'Hard', color: '#ff5c5c' },
]

// Keep older question data working while the app uses one three-level scale.
const LEGACY_DIFFICULTY_MAP = {
  beginner: 'beginner',
  easy: 'beginner',
  medium: 'medium',
  hard: 'hard',
  tricky: 'hard',
  expert: 'hard',
}

export function normalizeDifficulty(value) {
  return LEGACY_DIFFICULTY_MAP[String(value || '').toLowerCase()] || 'medium'
}

export function getDifficultyMeta(value) {
  const difficulty = normalizeDifficulty(value)
  return DIFFICULTY_LEVELS.find((level) => level.id === difficulty) || DIFFICULTY_LEVELS[1]
}

export function getDifficultyRank(value) {
  return DIFFICULTY_LEVELS.findIndex((level) => level.id === normalizeDifficulty(value))
}
