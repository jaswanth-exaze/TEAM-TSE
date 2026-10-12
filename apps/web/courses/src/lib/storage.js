const APP_STORAGE_PREFIX = 'tse-learning-hub:'
const LEGACY_STORAGE_PREFIX = 'quizapp:'

export function appStorageKey(key) {
  return `${APP_STORAGE_PREFIX}${key}`
}

/** Copy previously saved course data to the Learning Hub namespace. */
export function migrateLegacyStorage() {
  try {
    const legacyKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key) => key?.startsWith(LEGACY_STORAGE_PREFIX))

    for (const legacyKey of legacyKeys) {
      const currentKey = `${APP_STORAGE_PREFIX}${legacyKey.slice(LEGACY_STORAGE_PREFIX.length)}`
      if (localStorage.getItem(currentKey) === null) {
        const value = localStorage.getItem(legacyKey)
        if (value !== null) localStorage.setItem(currentKey, value)
      }
    }
  } catch {
    // The app remains usable if browser storage is disabled or full.
  }
}
