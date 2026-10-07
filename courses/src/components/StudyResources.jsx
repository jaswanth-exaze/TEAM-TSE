const RESOURCE_GROUPS = {
  'Official reference': 'Official references',
  Reference: 'References',
  Standard: 'Standards',
  'Security guidance': 'Security guidance',
  'Library reference': 'Library references',
  Tutorial: 'Tutorials',
  Article: 'Articles',
  Video: 'Videos',
}

export default function StudyResources({ resources = [], id = 'study-resources' }) {
  if (resources.length === 0) return null

  const groups = resources.reduce((result, resource) => {
    const group = RESOURCE_GROUPS[resource.kind] || 'Further reading'
    const existing = result.find((item) => item.title === group)
    if (existing) existing.resources.push(resource)
    else result.push({ title: group, resources: [resource] })
    return result
  }, [])

  return (
    <section className="mt-12" aria-labelledby={id}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Keep learning</p>
          <h2 id={id} className="mt-1 font-display text-2xl font-semibold text-[var(--page-fg)]">Study resources</h2>
        </div>
        <p className="text-sm text-[var(--muted-fg)]">Optional references to revisit while practising.</p>
      </div>
      <div className="mt-5 space-y-6">
        {groups.map(({ title, resources: groupedResources }) => (
          <section key={title} aria-label={title}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted-fg)]">{title}</h3>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {groupedResources.map((resource) => {
                const Card = resource.href ? 'a' : 'article'
                const linkProps = resource.href
                  ? { href: resource.href, target: '_blank', rel: 'noreferrer' }
                  : {}
                return (
                  <li key={resource.title}>
                    <Card
                      {...linkProps}
                      className={`group flex h-full min-h-36 flex-col rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 transition ${resource.href ? 'hover:-translate-y-0.5 hover:border-indigo-200/30 hover:shadow-lg hover:shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-display text-sm font-semibold leading-5 text-[var(--page-fg)] group-hover:text-indigo-100">{resource.title}</h4>
                        <span className="shrink-0 rounded-full border border-indigo-200/15 bg-indigo-200/[0.05] px-2 py-1 text-[10px] font-medium text-indigo-100/80">{resource.kind}</span>
                      </div>
                      {resource.description && <p className="mt-2 text-sm leading-5 text-[var(--muted-fg)]">{resource.description}</p>}
                      <span className="mt-auto pt-4 text-xs font-semibold text-indigo-200">
                        {resource.href ? 'Open resource ↗' : 'Reference listed in syllabus'}
                      </span>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  )
}
