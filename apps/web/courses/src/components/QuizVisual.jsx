import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function Surface({ children, className = '' }) {
  return <div className={`rounded-xl border border-white/10 bg-black/10 p-4 ${className}`}>{children}</div>
}

function VisualHeading({ title, description }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">{title}</p>
      {description && <p className="mt-1.5 text-xs leading-5 text-white/55">{description}</p>}
    </div>
  )
}

function StepperVisual({ visual }) {
  const steps = Array.isArray(visual.steps) ? visual.steps : []
  const [activeIndex, setActiveIndex] = useState(0)
  const active = steps[activeIndex]
  if (!active) return null

  return (
    <Surface>
      <VisualHeading title={visual.title || 'Follow the steps'} description={visual.description} />
      <div className="mb-4 flex items-center gap-1.5" aria-label={`Step ${activeIndex + 1} of ${steps.length}`}>
        {steps.map((step, index) => (
          <span
            key={`${step.label || 'step'}-${index}`}
            className={`h-1.5 flex-1 rounded-full transition-colors ${index <= activeIndex ? 'bg-indigo-300' : 'bg-white/10'}`}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.article
          key={activeIndex}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
          className="rounded-lg border border-white/10 bg-white/[0.035] p-4"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-white">{active.label || `Step ${activeIndex + 1}`}</h4>
            <span className="font-mono text-[11px] text-white/40">{activeIndex + 1} / {steps.length}</span>
          </div>
          {active.context && <p className="mt-2 text-sm leading-6 text-white/65">{active.context}</p>}
          {active.calculation && <p className="mt-3 rounded-md bg-black/20 px-3 py-2 font-mono text-xs leading-5 text-indigo-100">{active.calculation}</p>}
          {active.outcome && (
            <p className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs ${active.keep ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : active.keep === false ? 'border-rose-300/25 bg-rose-300/10 text-rose-200' : 'border-white/10 bg-white/5 text-white/70'}`}>
              {active.outcome}
            </p>
          )}
        </motion.article>
      </AnimatePresence>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setActiveIndex((value) => Math.max(0, value - 1))} disabled={activeIndex === 0} className="min-h-10 rounded-lg border border-white/10 px-3 text-xs text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35">Previous</button>
        <button type="button" onClick={() => setActiveIndex((value) => Math.min(steps.length - 1, value + 1))} disabled={activeIndex === steps.length - 1} className="min-h-10 rounded-lg border border-indigo-300/25 bg-indigo-300/10 px-3 text-xs font-medium text-indigo-100 transition hover:bg-indigo-300/15 disabled:cursor-not-allowed disabled:opacity-35">Next step</button>
      </div>
    </Surface>
  )
}

function DiffVisual({ visual }) {
  const columns = visual.columns || []
  const before = visual.before || []
  const after = visual.after || []
  const key = visual.rowKey
  const afterByKey = new Map(after.map((row, index) => [key ? row[key] : index, row]))
  const beforeByKey = new Map(before.map((row, index) => [key ? row[key] : index, row]))
  const keys = [...new Set([...beforeByKey.keys(), ...afterByKey.keys()])]
  const changed = (rowKey, column) => JSON.stringify(beforeByKey.get(rowKey)?.[column]) !== JSON.stringify(afterByKey.get(rowKey)?.[column])

  const renderTable = (rowsByKey, side) => (
    <div className="min-w-0 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full border-collapse text-left text-xs">
        <caption className="border-b border-white/10 bg-white/[0.04] px-3 py-2 text-left font-semibold text-white/80">{side}</caption>
        <thead><tr>{columns.map((column) => <th key={column} className="px-3 py-2 font-medium text-white/40">{column}</th>)}</tr></thead>
        <tbody>{keys.map((rowKey) => {
          const row = rowsByKey.get(rowKey)
          if (!row) return <tr key={rowKey}><td colSpan={columns.length} className="px-3 py-2 text-white/40">{side === 'Before' ? 'New row' : 'Row removed'}</td></tr>
          return <tr key={rowKey} className="border-t border-white/5">{columns.map((column) => (
            <td key={column} className={`px-3 py-2 font-mono ${changed(rowKey, column) ? 'bg-amber-300/10 text-amber-100' : 'text-white/70'}`}>{String(row[column] ?? 'NULL')}</td>
          ))}</tr>
        })}</tbody>
      </table>
    </div>
  )

  return (
    <Surface>
      <VisualHeading title={visual.title || 'Before and after'} description={visual.description} />
      <div className="grid gap-3 md:grid-cols-2">{renderTable(beforeByKey, 'Before')}{renderTable(afterByKey, 'After')}</div>
      {visual.note && <p className="mt-3 text-xs leading-5 text-white/55">{visual.note}</p>}
    </Surface>
  )
}

function PipelineVisual({ visual }) {
  const steps = visual.steps || []
  return (
    <Surface>
      <VisualHeading title={visual.title || 'Execution order'} description={visual.description} />
      <ol className="flex flex-wrap items-center gap-2" aria-label="Query execution order">
        {steps.map((step, index) => {
          const item = typeof step === 'string' ? { label: step } : step
          const active = item.active || item.label === visual.active
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              <div className={`rounded-lg border px-3 py-2 ${active ? 'border-indigo-300/50 bg-indigo-300/15 text-indigo-100 shadow-[0_0_20px_rgba(129,140,248,0.12)]' : 'border-white/10 bg-white/[0.03] text-white/55'}`}>
                <span className="block font-mono text-xs font-semibold">{item.label}</span>
                {item.detail && <span className="mt-1 block max-w-36 text-[10px] leading-4 text-white/45">{item.detail}</span>}
              </div>
              {index < steps.length - 1 && <span className="text-white/25" aria-hidden="true">→</span>}
            </li>
          )
        })}
      </ol>
      {visual.note && <p className="mt-3 text-xs leading-5 text-white/55">{visual.note}</p>}
    </Surface>
  )
}

function TableVisual({ visual, type }) {
  return (
    <Surface>
      <VisualHeading title={visual.title || (type === 'truth-table' ? 'Truth table' : 'Compare the rows')} description={visual.description} />
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr>{(visual.columns || []).map((column) => <th key={column} className="bg-white/[0.04] px-3 py-2 font-semibold text-white/65">{column}</th>)}</tr></thead>
          <tbody>{(visual.rows || []).map((row, index) => <tr key={index} className="border-t border-white/5">{row.map((value, cellIndex) => <td key={cellIndex} className={`px-3 py-2 ${String(value).toUpperCase() === 'UNKNOWN' ? 'text-amber-200' : 'text-white/70'}`}>{String(value ?? 'NULL')}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {visual.note && <p className="mt-3 text-xs leading-5 text-white/55">{visual.note}</p>}
    </Surface>
  )
}

function IndexVisual({ visual }) {
  return (
    <Surface>
      <VisualHeading title={visual.title || 'How the index is used'} description={visual.description} />
      <div className="space-y-3">
        {(visual.paths || []).map((path) => (
          <div key={path.label} className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-white/80">{path.label}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${path.kind === 'range' ? 'text-emerald-200' : 'text-amber-200'}`}>{path.kind === 'range' ? 'Range seek' : 'Scan'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label={path.description || path.label}>
              {(path.entries || []).map((entry, index) => <span key={`${entry.value}-${index}`} className={`rounded-md border px-2 py-1 font-mono text-[10px] ${entry.match ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-white/5 bg-black/10 text-white/35'}`}>{entry.value}</span>)}
            </div>
            {path.note && <p className="mt-2 text-[11px] leading-5 text-white/50">{path.note}</p>}
          </div>
        ))}
      </div>
    </Surface>
  )
}

function TimelineVisual({ visual }) {
  return (
    <Surface>
      <VisualHeading title={visual.title || 'Transaction timeline'} description={visual.description} />
      <div className="space-y-3">
        {(visual.lanes || []).map((lane) => (
          <section key={lane.name} className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
            <h4 className="text-xs font-semibold text-white/80">{lane.name}</h4>
            <ol className="mt-2 grid gap-2 sm:grid-cols-2">
              {(lane.events || []).map((event, index) => <li key={`${event.label}-${index}`} className={`rounded-md border p-2 text-[11px] leading-5 ${event.status === 'deadlock' ? 'border-rose-300/35 bg-rose-300/10 text-rose-100' : event.status === 'wait' ? 'border-amber-300/25 bg-amber-300/5 text-amber-100' : 'border-white/5 bg-black/10 text-white/65'}`}><span className="mr-2 font-mono text-white/40">{event.time || `Step ${index + 1}`}</span>{event.label}</li>)}
            </ol>
          </section>
        ))}
      </div>
      {visual.note && <p className="mt-3 text-xs leading-5 text-white/55">{visual.note}</p>}
    </Surface>
  )
}

function JoinVisual({ visual }) {
  const rightMatches = new Map()
  ;(visual.matches || []).forEach((match) => {
    if (!rightMatches.has(match.leftId)) rightMatches.set(match.leftId, [])
    rightMatches.get(match.leftId).push(match.rightId)
  })
  return (
    <Surface>
      <VisualHeading title={visual.title || 'Rows matched by the join'} description={visual.description} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
        <div className="space-y-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">{visual.leftLabel}</p>{(visual.leftRows || []).map((row) => <div key={row.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white/75"><span className="font-mono text-white/40">{row.id}</span><span className="ml-2">{row.label}</span></div>)}</div>
        <div className="hidden pt-8 font-mono text-indigo-200/70 sm:block" aria-hidden="true">⟷</div>
        <div className="space-y-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">{visual.rightLabel}</p>{(visual.rightRows || []).map((row) => <div key={row.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white/75"><span className="font-mono text-white/40">{row.id}</span><span className="ml-2">{row.label}</span></div>)}</div>
      </div>
      <div className="mt-3 space-y-1.5">
        {(visual.leftRows || []).map((row) => {
          const matches = rightMatches.get(row.id) || []
          return <p key={row.id} className="rounded-md bg-black/10 px-3 py-2 text-[11px] text-white/55"><span className="font-medium text-white/75">{row.label}</span> {matches.length ? `matches ${matches.map((id) => visual.rightRows.find((candidate) => candidate.id === id)?.label || id).join(', ')}` : 'has no matching row'}.</p>
        })}
      </div>
      {visual.note && <p className="mt-3 text-xs leading-5 text-white/55">{visual.note}</p>}
    </Surface>
  )
}

export default function QuizVisual({ visual }) {
  if (!visual || typeof visual !== 'object') return null
  switch (visual.type) {
    case 'stepper': return <StepperVisual visual={visual} />
    case 'diff': return <DiffVisual visual={visual} />
    case 'pipeline': return <PipelineVisual visual={visual} />
    case 'truth-table': return <TableVisual visual={visual} type="truth-table" />
    case 'index-range': return <IndexVisual visual={visual} />
    case 'timeline': return <TimelineVisual visual={visual} />
    case 'join-map': return <JoinVisual visual={visual} />
    default: return null
  }
}
