import { appStorageKey } from './storage'

const KEY = appStorageKey('progress:v1')

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

function writeAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getModuleProgress(moduleId) {
  const all = readAll()
  return all[moduleId] || null
}

export function saveModuleResult(moduleId, { score, total, answers }) {
  const all = readAll()
  const best = all[moduleId]?.best ?? 0
  all[moduleId] = {
    lastScore: score,
    total,
    best: Math.max(best, score),
    attempts: (all[moduleId]?.attempts ?? 0) + 1,
    answers,
    completedAt: Date.now(),
  }
  writeAll(all)
}

export function getAllProgress() {
  return readAll()
}

export function saveModuleCheckpoint(moduleId, checkpoint) {
  const all = readAll()
  all[moduleId] = { ...all[moduleId], inProgress: checkpoint }
  writeAll(all)
}

export function resetProgress() {
  localStorage.removeItem(KEY)
}
