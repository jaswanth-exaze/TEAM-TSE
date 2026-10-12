function readPath(object, path) {
  return path.reduce((value, key) => value?.[key], object)
}

function machineState(shell) {
  return {
    ...shell.system,
    cwd: shell.cwd,
    previousCwd: shell.previousCwd,
    history: shell.history,
  }
}

function normalizeOutput(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

export function checkRule(rule, shell, result) {
  if (rule.type === 'output') {
    if (!result || result.code !== 0) return false
    const output = normalizeOutput(result.stdout)
    if (rule.equals !== undefined) return output === normalizeOutput(rule.equals)
    if (rule.startsWith !== undefined) return output.startsWith(rule.startsWith)
    return output.includes(rule.includes || '')
  }

  if (rule.type === 'fs') {
    const node = shell.node(rule.path)
    if (rule.exists === false) return !node
    if (!node) return false
    if (rule.nodeType && node.type !== rule.nodeType) return false
    if (rule.mode && node.mode !== rule.mode) return false
    if (rule.ownerExecutable && !(parseInt(node.mode || '000', 8) & 0o100)) return false
    if (rule.contains && !(node.data || '').includes(rule.contains)) return false
    return true
  }

  if (rule.type === 'state') {
    const value = readPath(machineState(shell), rule.path)
    if (rule.equals !== undefined && value !== rule.equals) return false
    if (rule.includes !== undefined) {
      const matches = typeof value === 'string'
        ? value.includes(rule.includes)
        : Array.isArray(value) && value.some((item) => (rule.field ? item?.[rule.field] : item) === rule.includes)
      if (!matches) return false
    }
    if (rule.includesKey !== undefined && (!value || !Object.hasOwn(value, rule.includesKey))) return false
    if (rule.length !== undefined && value?.length !== rule.length) return false
    if (rule.minLength !== undefined && (!value || value.length < rule.minLength)) return false
    if (rule.predicate) {
      const predicate = rule.predicate
      const found = Array.isArray(value) && value.some((item) => item?.[predicate.field] === predicate.equals && item?.[predicate.fieldEquals] === predicate.value)
      if (!found) return false
    }
    return true
  }

  return false
}

export function evaluateQuestion(question, shell, result) {
  const checks = question.checks.map((rule) => ({
    label: rule.label || 'Complete this task requirement',
    complete: checkRule(rule, shell, result),
  }))
  return { complete: checks.length > 0 && checks.every((check) => check.complete), checks }
}

export function previewCommand(question, command, shell) {
  const parts = question.anatomy || []
  const input = String(command || '').trim()
  const isScp = parts[0]?.value === 'scp'
  if (!isScp) return []

  const history = shell.history || []
  const recent = input || history.at(-1) || ''
  const normalizedCommand = recent.replace(/\s+/g, ' ')
  const includesPath = (value) => {
    if (!value) return false
    const tildeForm = value.startsWith('~/') ? value : null
    const absoluteForm = tildeForm ? shell.normalize(tildeForm) : value
    return normalizedCommand.includes(value) || normalizedCommand.includes(absoluteForm)
  }
  const usedScp = /(?:^|\s)scp(?:\s|$)/.test(normalizedCommand)
  const sourcePart = parts[1]
  const destinationPart = parts[2]
  return [
    { label: 'Use scp for the transfer', complete: usedScp },
    ...(sourcePart ? [{ label: `Select source: ${sourcePart.value}`, complete: usedScp && includesPath(sourcePart.value) }] : []),
    ...(destinationPart ? [{ label: `Select destination: ${destinationPart.value}`, complete: usedScp && includesPath(destinationPart.value) }] : []),
  ]
}
