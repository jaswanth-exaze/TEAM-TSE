import { Link } from 'react-router-dom'
import { getHubHomeHref } from '../lib/paths'

export default function NotFound() {
  return (
    <main className="learning-surface mx-auto flex min-h-[65vh] w-full max-w-3xl flex-col items-start justify-center px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Page not found</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">This page isn’t here</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">The address may have changed, or the link may be out of date. Choose a destination to keep learning.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--action-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--action-primary-fg)] transition-colors hover:bg-[var(--action-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">Open course library</Link>
        <a href={getHubHomeHref()} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">Go to TSE Home</a>
      </div>
    </main>
  )
}
