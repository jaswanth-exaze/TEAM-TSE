import { useMemo } from 'react'

function slugify(text) {
  return text
    .replace(/[`*_~]/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'section'
}

function splitTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}

function isTableDivider(line) {
  const cells = splitTableRow(line)
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function isListItem(line) {
  return /^\s*(?:[-+*]|\d+[.)])\s+/.test(line)
}

function parseList(lines, start) {
  const first = lines[start].match(/^(\s*)([-+*]|\d+[.)])\s+(.*)$/)
  const rootIndent = first[1].length
  const rootOrdered = /^\d/.test(first[2])
  const items = []
  let index = start

  while (index < lines.length) {
    const match = lines[index].match(/^(\s*)([-+*]|\d+[.)])\s+(.*)$/)
    if (!match || match[1].length < rootIndent) break
    if (match[1].length === rootIndent) {
      items.push({ text: match[3], children: [] })
    } else if (items.length) {
      items.at(-1).children.push({ text: match[3], children: [] })
    }
    index += 1
  }

  return { type: 'list', ordered: rootOrdered, items, nextIndex: index }
}

function parseMarkdown(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  const headingCounts = new Map()
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const fence = line.match(/^\s*```\s*([\w.+#-]*)\s*$/)
    if (fence) {
      const codeLines = []
      index += 1
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      blocks.push({ type: 'code', language: fence[1], value: codeLines.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (heading) {
      const title = heading[2].trim()
      const baseId = slugify(title)
      const duplicateCount = headingCounts.get(baseId) || 0
      headingCounts.set(baseId, duplicateCount + 1)
      const level = heading[1].length
      blocks.push({ type: 'heading', level, displayLevel: level, title, id: duplicateCount ? `${baseId}-${duplicateCount + 1}` : baseId })
      index += 1
      continue
    }

    if (/^\s*(?:(?:-{3,})|(?:_{3,})|(?:\*{3,}))\s*$/.test(line)) {
      blocks.push({ type: 'rule' })
      index += 1
      continue
    }

    if (/^\s*>/.test(line)) {
      const quoteLines = []
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ''))
        index += 1
      }
      blocks.push({ type: 'quote', value: quoteLines.join('\n') })
      continue
    }

    if (line.includes('|') && lines[index + 1] && isTableDivider(lines[index + 1])) {
      const headers = splitTableRow(line)
      const rows = []
      index += 2
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]))
        index += 1
      }
      blocks.push({ type: 'table', headers, rows })
      continue
    }

    if (isListItem(line)) {
      const list = parseList(lines, index)
      blocks.push(list)
      index = list.nextIndex
      continue
    }

    const paragraph = [line.trim()]
    index += 1
    while (index < lines.length && lines[index].trim()) {
      if (/^\s*```/.test(lines[index]) || /^(#{1,6})\s+/.test(lines[index]) || /^\s*>/.test(lines[index]) || isListItem(lines[index]) || /^\s*(?:(?:-{3,})|(?:_{3,})|(?:\*{3,}))\s*$/.test(lines[index])) break
      if (lines[index].includes('|') && lines[index + 1] && isTableDivider(lines[index + 1])) break
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push({ type: 'paragraph', value: paragraph.join(' ') })
  }

  return blocks
}

function InlineMarkdown({ text }) {
  const pattern = /(\[[^\]]+\]\((?:https?:\/\/|#)[^)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|(?<!\*)\*[^*\n]+\*(?!\*)|(?<!_)_[^_\n]+_(?!_)|`[^`]+`|https?:\/\/[^\s<]+)/g
  const parts = String(text).split(pattern).filter(Boolean)

  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|#)[^)]+)\)$/)
    if (link) {
      const external = /^https?:\/\//.test(link[2])
      return <a key={index} href={link[2]} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} className="font-medium text-sky-200 underline decoration-sky-200/40 underline-offset-2 hover:text-sky-100">{link[1]}</a>
    }
    if (/^https?:\/\//.test(part)) {
      const url = part.replace(/[.,!?;:]$/, '')
      const punctuation = part.slice(url.length)
      return <span key={index}><a href={url} target="_blank" rel="noreferrer" className="break-words font-medium text-sky-200 underline decoration-sky-200/40 underline-offset-2 hover:text-sky-100">{url}</a>{punctuation}</span>
    }
    if (part.startsWith('**') || part.startsWith('__')) {
      const value = part.slice(2, -2)
      if (/^https?:\/\//.test(value)) return <strong key={index} className="font-semibold text-white"><a href={value} target="_blank" rel="noreferrer" className="underline decoration-white/35 underline-offset-2">{value}</a></strong>
      return <strong key={index} className="font-semibold text-white">{value}</strong>
    }
    if (part.startsWith('~~')) return <del key={index}>{part.slice(2, -2)}</del>
    if (part.startsWith('`')) return <code key={index} className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.92em] text-emerald-100">{part.slice(1, -1)}</code>
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) return <em key={index}>{part.slice(1, -1)}</em>
    return <span key={index}>{part}</span>
  })
}

function ListItems({ items }) {
  return items.map((item, index) => <li key={`${index}-${item.text}`}>
    <InlineMarkdown text={item.text} />
    {item.children.length > 0 && <ul className="my-2 ml-5 list-disc space-y-1.5 text-white/70"><ListItems items={item.children} /></ul>}
  </li>)
}

function MarkdownBlock({ block }) {
  if (block.type === 'heading') {
    const level = block.displayLevel || block.level
    const className = level === 1
      ? 'scroll-mt-24 mb-5 mt-12 border-b border-white/10 pb-3 font-display text-2xl font-bold tracking-tight text-white first:mt-0 sm:text-3xl'
      : level === 2
        ? 'scroll-mt-24 mb-4 mt-10 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl'
        : 'mb-3 mt-7 font-display text-lg font-semibold text-white/95'
    const props = { id: block.id, className }
    const Tag = `h${level}`
    return <Tag {...props}><InlineMarkdown text={block.title} /></Tag>
  }

  if (block.type === 'code') return <div className="my-5 overflow-hidden rounded-xl border border-white/10 bg-[#090c12] shadow-inner">
    {block.language && <div className="border-b border-white/[0.07] bg-white/[0.025] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">{block.language}</div>}
    <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-emerald-100/90 sm:p-5 sm:text-sm"><code>{block.value}</code></pre>
  </div>

  if (block.type === 'quote') return <blockquote className="my-5 rounded-r-xl border-l-2 border-sky-200/50 bg-sky-200/[0.04] px-4 py-3 text-[15px] leading-7 text-white/75"><InlineMarkdown text={block.value} /></blockquote>
  if (block.type === 'rule') return <hr className="my-8 border-white/10" />
  if (block.type === 'list') {
    const Tag = block.ordered ? 'ol' : 'ul'
    return <Tag className={`my-4 space-y-2 pl-6 text-[15px] leading-7 text-white/75 ${block.ordered ? 'list-decimal' : 'list-disc'}`}><ListItems items={block.items} /></Tag>
  }
  if (block.type === 'table') return <div className="my-5 overflow-x-auto rounded-xl border border-white/10">
    <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
      <thead className="bg-white/[0.06] text-white/90"><tr>{block.headers.map((cell, index) => <th key={index} scope="col" className="border-b border-white/10 px-3.5 py-3 font-semibold"><InlineMarkdown text={cell} /></th>)}</tr></thead>
      <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex} className="even:bg-white/[0.025]">{block.headers.map((_, columnIndex) => <td key={columnIndex} className="border-b border-white/[0.06] px-3.5 py-3 leading-6 text-white/70"><InlineMarkdown text={row[columnIndex] || ''} /></td>)}</tr>)}</tbody>
    </table>
  </div>

  return <p className="my-3 text-[15px] leading-7 text-white/75"><InlineMarkdown text={block.value} /></p>
}

export function getMarkdownHeadings(markdown) {
  return parseMarkdown(markdown)
    .filter((block) => block.type === 'heading' && block.level > 1)
    .map(({ id, level, title }) => ({ id, level, title }))
}

export default function NodeMarkdown({ content, className = '' }) {
  const blocks = useMemo(() => parseMarkdown(content), [content])
  return <div className={className}>{blocks.map((block, index) => <MarkdownBlock key={`${block.type}-${block.id || index}`} block={block} />)}</div>
}
