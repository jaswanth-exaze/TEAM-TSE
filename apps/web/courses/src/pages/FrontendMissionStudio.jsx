import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FRONTEND_MISSIONS, FRONTEND_TRACKS } from '../data/frontend-mission-studio'
import { appStorageKey } from '../lib/storage'
import './FrontendMissionStudio.css'

const STORAGE_KEY = appStorageKey('frontend-mission-studio:v1')
function readStudioState() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!value || typeof value !== 'object') return { activeId: FRONTEND_MISSIONS[0].id, drafts: {}, completed: [] }
    const drafts = {}
    if (value.drafts && typeof value.drafts === 'object' && !Array.isArray(value.drafts)) {
      for (const mission of FRONTEND_MISSIONS) {
        const savedFiles = value.drafts[mission.id]
        if (!savedFiles || typeof savedFiles !== 'object' || Array.isArray(savedFiles)) continue
        const validFiles = Object.fromEntries(['html', 'css', 'js'].filter((file) => typeof savedFiles[file] === 'string').map((file) => [file, savedFiles[file]]))
        if (Object.keys(validFiles).length) drafts[mission.id] = validFiles
      }
    }
    return {
      activeId: FRONTEND_MISSIONS.some((mission) => mission.id === value.activeId) ? value.activeId : FRONTEND_MISSIONS[0].id,
      drafts,
      completed: Array.isArray(value.completed) ? [...new Set(value.completed.filter((id) => FRONTEND_MISSIONS.some((mission) => mission.id === id)))] : [],
    }
  } catch {
    return { activeId: FRONTEND_MISSIONS[0].id, drafts: {}, completed: [] }
  }
}

function escapeClosingTag(value, name) {
  return String(value).replace(new RegExp('</' + name, 'gi'), '<' + String.fromCharCode(92) + '/' + name)
}

async function runPreviewBehaviorCheck(missionId) {
  const wait = (duration = 30) => new Promise((resolve) => window.setTimeout(resolve, duration))
  const result = (label, passed) => ({ label, passed: Boolean(passed) })
  const style = (selector) => {
    const element = document.querySelector(selector)
    return element ? window.getComputedStyle(element) : null
  }

  switch (missionId) {
    case 'semantic-canvas': return [result('The browser sees one primary main landmark', document.querySelectorAll('main').length === 1)]
    case 'article-story': return [result('The story is represented by an article element', Boolean(document.querySelector('article.story-card')))]
    case 'accessible-links': {
      const link = document.querySelector('.product a')
      const image = document.querySelector('.product img')
      return [result('The link and image expose their accessible purpose', Boolean(link?.getAttribute('href')?.trim()) && Boolean(image?.getAttribute('alt')?.trim()))]
    }
    case 'box-model': return [result('The measured card width includes its padding and border', style('.profile-card')?.boxSizing === 'border-box')]
    case 'flexbox-rescue': {
      const layout = style('.layout-stage')
      return [result('The crew reaches the target edge and aligns to its center', layout?.justifyContent === 'flex-end' && layout?.alignItems === 'center')]
    }
    case 'flex-wrap': return [result('The dashboard cards can wrap to another row', style('.metric-row')?.flexWrap === 'wrap')]
    case 'grid-tracks': {
      const columns = style('.feature-grid')?.gridTemplateColumns.trim().split(/\s+/) || []
      return [result('The feature board renders three equal columns', columns.length === 3 && columns[0] === columns[1] && columns[1] === columns[2])]
    }
    case 'grid-areas': {
      const regions = ['header', 'nav', 'article', 'aside']
      return [result('Each page region occupies its named grid area', regions.every((name) => style(`.page-map > ${name}`)?.gridArea.toLowerCase().includes(name)))]
    }
    case 'responsive-layout': {
      let hasPhoneRule = false
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (!rule.cssRules || !rule.conditionText?.includes('max-width')) continue
            if (Array.from(rule.cssRules).some((nested) => nested.selectorText?.includes('.article-layout') && nested.style?.gridTemplateColumns === '1fr')) hasPhoneRule = true
          }
        } catch { /* A blocked stylesheet does not affect the learner preview. */ }
      }
      return [result('A narrow-screen rule collapses the article to one column', hasPhoneRule)]
    }
    case 'event-counter': {
      document.querySelector('#add-session')?.click()
      await wait()
      return [result('A click increases the visible session count', document.querySelector('#count')?.textContent.trim() === '1')]
    }
    case 'functions-and-dom': {
      const design = document.querySelector('#design')
      const build = document.querySelector('#build')
      if (design) design.value = '8'
      if (build) build.value = '16'
      document.querySelector('#calculate')?.click()
      await wait()
      return [result('The page displays the calculated 24-hour estimate', document.querySelector('#total')?.textContent.trim() === '24')]
    }
    case 'render-collection': {
      document.querySelector('#show-projects')?.click()
      await wait()
      return [result('The button renders one list item for each project', document.querySelectorAll('#project-list li').length === 3)]
    }
    case 'form-validation': {
      const form = document.querySelector('#invite-form')
      const name = document.querySelector('#name')
      const message = document.querySelector('#message')
      if (!form || !name || !message) return [result('The form responds to empty and valid names', false)]
      name.value = '   '
      const emptySubmit = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(emptySubmit)
      const rejectedBlank = emptySubmit.defaultPrevented && /name|enter|required|empty/i.test(message.textContent)
      name.value = 'Taylor Morgan'
      const validSubmit = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(validSubmit)
      return [result('Blank names are rejected and a valid name is accepted', rejectedBlank && validSubmit.defaultPrevented && message.textContent.includes('Taylor Morgan'))]
    }
    case 'async-dashboard': {
      document.querySelector('#load-activity')?.click()
      await wait(650)
      return [result('The delayed activity feed appears after loading', document.querySelectorAll('#activity-list li').length === 3)]
    }
    case 'capstone-launch': {
      const buttons = Array.from(document.querySelectorAll('.save'))
      buttons.forEach((button) => button.click())
      await wait()
      return [result('Saving all products updates the live saved count', buttons.length === 3 && document.querySelector('#saved-count')?.textContent.trim() === '3')]
    }
    default: return [result('The browser preview loaded', true)]
  }
}

function installPreviewBridge(missionId, runBehaviorCheck) {
  let inspectMode = false
  let hovered = null
  let selected = null
  const markerStyle = document.createElement('style')
  markerStyle.textContent = '[data-fm-inspect-hover],[data-fm-inspect-selected]{outline:3px solid #7357ff!important;outline-offset:2px!important;cursor:crosshair!important}[data-fm-inspect-selected]{outline-color:#12a889!important;box-shadow:0 0 0 5px #12a88935!important}'
  document.head.appendChild(markerStyle)

  function removeMarker(element, attribute) {
    if (element) element.removeAttribute(attribute)
  }

  function findElement(target) {
    return target instanceof Element ? target.closest('body *') : null
  }

  function inspectClick(event) {
    if (!inspectMode || !event.isTrusted) return
    const element = findElement(event.target)
    if (!element || ['SCRIPT', 'STYLE', 'LINK', 'META'].includes(element.tagName)) return
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    removeMarker(hovered, 'data-fm-inspect-hover')
    removeMarker(selected, 'data-fm-inspect-selected')
    hovered = null
    selected = element
    element.setAttribute('data-fm-inspect-selected', '')

    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    const text = (element.innerText || element.getAttribute('alt') || '').trim().replace(/\s+/g, ' ').slice(0, 120)
    const path = []
    let node = element
    while (node && node !== document.body && path.length < 4) {
      let part = node.tagName.toLowerCase()
      if (node.id) part += '#' + node.id
      else if (node.classList.length) part += '.' + Array.from(node.classList).slice(0, 2).join('.')
      path.unshift(part)
      node = node.parentElement
    }

    parent.postMessage({
      channel: 'frontend-mission-preview',
      kind: 'inspect',
      element: {
        tag: element.tagName.toLowerCase(),
        id: element.id,
        className: typeof element.className === 'string' ? element.className : '',
        text,
        role: element.getAttribute('role') || '',
        ariaLabel: element.getAttribute('aria-label') || '',
        path: path.join(' > '),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        display: style.display,
        position: style.position,
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        gap: style.gap,
        padding: style.padding,
        margin: style.margin,
        flexDirection: style.flexDirection,
        gridTemplateColumns: style.gridTemplateColumns,
      },
    }, '*')
  }

  document.addEventListener('pointerover', (event) => {
    if (!inspectMode) return
    const element = findElement(event.target)
    if (!element) return
    removeMarker(hovered, 'data-fm-inspect-hover')
    hovered = element
    if (element !== selected) element.setAttribute('data-fm-inspect-hover', '')
  }, true)
  document.addEventListener('pointerout', (event) => {
    if (!inspectMode) return
    const element = findElement(event.target)
    removeMarker(element, 'data-fm-inspect-hover')
    if (hovered === element) hovered = null
  }, true)
  document.addEventListener('click', inspectClick, true)

  window.addEventListener('message', async (event) => {
    if (event.data?.channel !== 'frontend-mission-host') return
    if (event.data.type === 'set-inspect') {
      inspectMode = Boolean(event.data.enabled)
      if (!inspectMode) {
        removeMarker(hovered, 'data-fm-inspect-hover')
        removeMarker(selected, 'data-fm-inspect-selected')
        hovered = null
        selected = null
      }
      parent.postMessage({ channel: 'frontend-mission-preview', kind: 'inspect-mode', enabled: inspectMode }, '*')
      return
    }
    if (event.data.type !== 'run-checks') return
    const runId = event.data.runId
    try {
      const rows = await runBehaviorCheck(missionId)
      parent.postMessage({ channel: 'frontend-mission-preview', kind: 'checks', missionId, runId, rows }, '*')
    } catch {
      parent.postMessage({
        channel: 'frontend-mission-preview',
        kind: 'checks',
        missionId,
        runId,
        rows: [{ label: 'The browser interaction completed without a runtime error', passed: false }],
      }, '*')
    }
  })
  parent.postMessage({ channel: 'frontend-mission-preview', kind: 'ready' }, '*')
}

function createPreviewDocument(files, missionId) {
  const policy = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: blob:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; font-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none">'
  const css = `<style>${escapeClosingTag(files.css, 'style')}</style>`
  const diagnostics = '<script>function reportPreviewError(message){parent.postMessage({channel:"frontend-mission-preview",message:String(message)},"*")}window.onerror=function(message){reportPreviewError(message)};window.addEventListener("unhandledrejection",function(event){reportPreviewError(event.reason&&event.reason.message||event.reason||"Unhandled promise rejection")});</script>'
  const js = files.js.trim() && !files.js.trim().startsWith('// No JavaScript')
    ? `<script>${escapeClosingTag(files.js, 'script')}</script>`
    : ''
  const behaviorRunner = '<script>(' + installPreviewBridge.toString() + ')(' + JSON.stringify(missionId) + ',(' + runPreviewBehaviorCheck.toString() + '));</script>'
  let html = files.html || '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>'
  if (/<head\b[^>]*>/i.test(html)) html = html.replace(/<head\b[^>]*>/i, (head) => `${head}${policy}${css}`)
  else html = html.replace(/<html\b[^>]*>/i, (root) => `${root}<head>${policy}${css}</head>`)
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${diagnostics}${js}${behaviorRunner}</body>`)
  else html += `${diagnostics}${js}${behaviorRunner}`
  return html
}

function getDocumentOutline(source) {
  if (typeof DOMParser === 'undefined') return []
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const semanticTags = new Set(['main', 'header', 'nav', 'article', 'section', 'aside', 'footer', 'h1', 'h2', 'h3', 'form', 'button', 'a', 'img', 'ul', 'li'])
  return Array.from(doc.body.querySelectorAll('*')).filter((element) => semanticTags.has(element.tagName.toLowerCase())).slice(0, 22).map((element) => ({
    tag: element.tagName.toLowerCase(),
    label: element.getAttribute('aria-label') || element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 54) || element.getAttribute('alt') || '',
    depth: Math.min(4, (() => { let depth = 0; let node = element.parentElement; while (node && node !== doc.body) { depth += 1; node = node.parentElement } return depth })()),
  }))
}

function getCssSignals(source) {
  const found = []
  const expression = /([a-z-]+)\s*:\s*([^;{}]+)\s*;/gi
  let match
  while ((match = expression.exec(source)) && found.length < 10) {
    found.push({ property: match[1], value: match[2].trim() })
  }
  return found
}

function getFileForLanguage(language) {
  if (language === 'HTML') return 'html'
  if (language === 'CSS') return 'css'
  if (language === 'JavaScript') return 'js'
  return 'html'
}

function getLineCount(value) {
  return String(value).split('\n').length
}

function tokenizeMarkup(source) {
  const tokens = []
  const syntax = /<!--[\s\S]*?-->|<!doctype\b[^>]*>|<\/?[a-z][^>]*>|&(?:#\d+|#x[\da-f]+|[a-z]+);/gi
  let cursor = 0
  let match
  const add = (text, type = '') => { if (text) tokens.push({ text, type }) }

  while ((match = syntax.exec(source))) {
    add(source.slice(cursor, match.index))
    const value = match[0]
    if (value.startsWith('<!--')) add(value, 'comment')
    else if (/^<!doctype/i.test(value)) add(value, 'doctype')
    else if (value.startsWith('&')) add(value, 'entity')
    else {
      const tag = value.match(/^<(\/)?([a-z][\w:-]*)([\s\S]*?)(\/?)>$/i)
      if (!tag) add(value, 'tag')
      else {
        add(`<${tag[1] || ''}`, 'punctuation')
        add(tag[2], 'tag-name')
        const attributes = tag[3]
        const attributeSyntax = /(\s+)([^\s=/>]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g
        let attributeCursor = 0
        let attribute
        while ((attribute = attributeSyntax.exec(attributes))) {
          add(attributes.slice(attributeCursor, attribute.index))
          add(attribute[1])
          add(attribute[2], 'attribute')
          if (attribute[3]) {
            const equals = attribute[3].indexOf('=')
            add(attribute[3].slice(0, equals + 1), 'punctuation')
            add(attribute[3].slice(equals + 1), 'string')
          }
          attributeCursor = attributeSyntax.lastIndex
        }
        add(attributes.slice(attributeCursor))
        add(`${tag[4] || ''}>`, 'punctuation')
      }
    }
    cursor = syntax.lastIndex
  }
  add(source.slice(cursor))
  return tokens
}

function tokenizeCode(source, language) {
  if (language === 'html') return tokenizeMarkup(source)
  const tokens = []
  const syntax = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[0-9a-f]{3,8}\b|@[a-z-]+\b|\b(?:[$\w-]+)\b|\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)?|[^\s])/gi
  const keywords = new Set(['async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'else', 'export', 'false', 'for', 'from', 'function', 'if', 'import', 'in', 'let', 'new', 'null', 'of', 'return', 'throw', 'true', 'try', 'var', 'while', 'yield'])
  const cssValues = new Set(['absolute', 'auto', 'baseline', 'block', 'bold', 'border-box', 'center', 'column', 'contain', 'cover', 'currentColor', 'ease', 'end', 'fixed', 'flex', 'flex-end', 'flex-start', 'grid', 'hidden', 'inherit', 'initial', 'inline', 'inline-block', 'inset', 'italic', 'left', 'max-content', 'min-content', 'none', 'normal', 'nowrap', 'pointer', 'relative', 'repeat', 'right', 'row', 'sans-serif', 'space-around', 'space-between', 'space-evenly', 'start', 'static', 'stretch', 'system-ui', 'transparent', 'unset', 'wrap'])
  let cursor = 0
  let match
  while ((match = syntax.exec(source))) {
    if (match.index > cursor) tokens.push({ text: source.slice(cursor, match.index), type: '' })
    const value = match[0]
    let type = ''
    if (value.startsWith('//') || value.startsWith('/*')) type = 'comment'
    else if (/^["'`]/.test(value)) type = 'string'
    else if (value.startsWith('@')) type = 'at-rule'
    else if (/^#[\da-f]{3,8}$/i.test(value) || /^\d/.test(value)) type = 'number'
    else if (language === 'js' && keywords.has(value)) type = 'keyword'
    else if (language === 'css' && /^[-\w]+$/.test(value)) {
      const after = source.slice(syntax.lastIndex)
      const before = source.slice(0, match.index)
      if (/^\s*:/.test(after)) type = 'property'
      else if (/[.#:]$/.test(before) && !/^#[\da-f]{3,8}$/i.test(value)) type = 'selector'
      else if (cssValues.has(value)) type = 'value'
      else {
        const ruleContext = before.slice(Math.max(before.lastIndexOf('{'), before.lastIndexOf('}'), before.lastIndexOf(';')) + 1).trim()
        if (!ruleContext || /[,>+~]$/.test(ruleContext)) type = 'selector'
        else if (ruleContext.includes(':')) type = 'value'
      }
    }
    if (!type && /^[a-z_$][\w$]*$/i.test(value) && /^\s*\(/.test(source.slice(syntax.lastIndex))) type = 'function'
    if (!type && /^[{}()[\];,.<>:=+*/%-]$/.test(value)) type = 'punctuation'
    tokens.push({ text: value, type })
    cursor = syntax.lastIndex
  }
  if (cursor < source.length) tokens.push({ text: source.slice(cursor), type: '' })
  return tokens
}

function normalizeCssDeclaration(source) {
  const declaration = source.trim()
  let quote = ''
  let escaped = false
  let inComment = false
  let parentheses = 0
  for (let index = 0; index < declaration.length; index += 1) {
    const character = declaration[index]
    const next = declaration[index + 1]
    if (inComment) {
      if (character === '*' && next === '/') {
        inComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = ''
    } else if (character === '/' && next === '*') {
      inComment = true
      index += 1
    } else if (character === '"' || character === "'") quote = character
    else if (character === '(') parentheses += 1
    else if (character === ')') parentheses = Math.max(0, parentheses - 1)
    else if (character === ':' && parentheses === 0) return `${declaration.slice(0, index).trim()}: ${declaration.slice(index + 1).trim()}`
  }
  return declaration
}

function formatCssSource(source) {
  let output = ''
  let current = ''
  let indent = 0
  let quote = ''
  let escaped = false
  let inComment = false
  let parentheses = 0
  const writeLine = (value, suffix = ';') => {
    const normalized = normalizeCssDeclaration(value)
    if (normalized) output += `${'  '.repeat(indent)}${normalized}${suffix}\n`
  }

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const next = source[index + 1]
    if (inComment) {
      current += character
      if (character === '*' && next === '/') {
        current += next
        index += 1
        inComment = false
      }
      continue
    }
    if (quote) {
      current += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = ''
      continue
    }
    if (character === '/' && next === '*') {
      current += '/*'
      index += 1
      inComment = true
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      current += character
      continue
    }
    if (character === '(') parentheses += 1
    if (character === ')') parentheses = Math.max(0, parentheses - 1)
    if (parentheses === 0 && character === '{') {
      const selector = current.trim()
      if (selector) output += `${'  '.repeat(indent)}${selector} {\n`
      else output += `${'  '.repeat(indent)}{\n`
      indent += 1
      current = ''
    } else if (parentheses === 0 && character === ';') {
      writeLine(current)
      current = ''
    } else if (parentheses === 0 && character === '}') {
      if (current.trim()) writeLine(current)
      current = ''
      indent = Math.max(0, indent - 1)
      output += `${'  '.repeat(indent)}}\n`
    } else current += character
  }
  if (current.trim()) writeLine(current, '')
  return output.trimEnd()
}

function evaluateMission(mission, files) {
  return mission.checks.map((check) => {
    let passed = false
    try {
      passed = new RegExp(check.pattern, check.flags || '').test(files[check.file] || '')
    } catch {
      passed = false
    }
    return { ...check, passed }
  })
}

export default function FrontendMissionStudio() {
  const [savedState, setSavedState] = useState(readStudioState)
  const [activeFile, setActiveFile] = useState(() => getFileForLanguage(FRONTEND_MISSIONS[0].language))
  const [checkResult, setCheckResult] = useState(null)
  const [hintIndex, setHintIndex] = useState(-1)
  const [viewMode, setViewMode] = useState('preview')
  const [viewportWidth, setViewportWidth] = useState(390)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [previewError, setPreviewError] = useState('')
  const [inspectEnabled, setInspectEnabled] = useState(false)
  const [selectedElement, setSelectedElement] = useState(null)
  const [previewRevision, setPreviewRevision] = useState(0)
  const previewRef = useRef(null)
  const inspectEnabledRef = useRef(false)
  const resizeStartRef = useRef(null)
  const editorRef = useRef(null)
  const highlightRef = useRef(null)
  const lineNumbersRef = useRef(null)
  const checkTimeoutRef = useRef(null)
  const runSequenceRef = useRef(0)

  const activeMission = FRONTEND_MISSIONS.find((mission) => mission.id === savedState.activeId) || FRONTEND_MISSIONS[0]
  const activeIndex = FRONTEND_MISSIONS.findIndex((mission) => mission.id === activeMission.id)
  const activeTrackIndex = FRONTEND_TRACKS.findIndex((track) => track.name === activeMission.track)
  const files = { ...activeMission.files, ...(savedState.drafts[activeMission.id] || {}) }
  const activeCode = files[activeFile]
  const completed = new Set(savedState.completed)
  const progressPercent = Math.round((completed.size / FRONTEND_MISSIONS.length) * 100)
  const previewDocument = useMemo(() => createPreviewDocument({ html: files.html, css: files.css, js: files.js }, activeMission.id), [files.html, files.css, files.js, activeMission.id])
  const highlightedTokens = useMemo(() => tokenizeCode(activeCode, activeFile), [activeCode, activeFile])
  const outline = useMemo(() => getDocumentOutline(files.html), [files.html])
  const cssSignals = useMemo(() => getCssSignals(files.css), [files.css])
  const currentCheckRows = checkResult?.missionId === activeMission.id ? checkResult.rows : []
  const currentPending = checkResult?.missionId === activeMission.id && checkResult.pending
  const currentPassed = checkResult?.missionId === activeMission.id && checkResult.passed
  const pendingCheckRef = useRef(null)
  const previewReadyRef = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState)) } catch { /* Progress stays available in memory if storage is full. */ }
    }, 180)
    return () => window.clearTimeout(timer)
  }, [savedState])

  useEffect(() => () => window.clearTimeout(checkTimeoutRef.current), [])

  useEffect(() => {
    previewReadyRef.current = false
  }, [previewDocument])

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = 0
      editorRef.current.scrollLeft = 0
    }
    if (highlightRef.current) {
      highlightRef.current.scrollTop = 0
      highlightRef.current.scrollLeft = 0
    }
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = 0
  }, [activeFile, activeMission.id])

  function sendPendingChecks() {
    if (!previewReadyRef.current || !pendingCheckRef.current || pendingCheckRef.current.sent || !previewRef.current?.contentWindow) return
    pendingCheckRef.current.sent = true
    previewRef.current.contentWindow.postMessage({ channel: 'frontend-mission-host', type: 'run-checks', runId: pendingCheckRef.current.runId }, '*')
  }

  function handlePreviewLoad() {
    previewReadyRef.current = true
    previewRef.current?.contentWindow?.postMessage({ channel: 'frontend-mission-host', type: 'set-inspect', enabled: inspectEnabledRef.current }, '*')
    sendPendingChecks()
  }

  useEffect(() => {
    function receivePreviewMessage(event) {
      if (event.source !== previewRef.current?.contentWindow || event.data?.channel !== 'frontend-mission-preview') return
      if (event.data.kind === 'ready') {
        previewReadyRef.current = true
        previewRef.current?.contentWindow?.postMessage({ channel: 'frontend-mission-host', type: 'set-inspect', enabled: inspectEnabledRef.current }, '*')
        sendPendingChecks()
        return
      }
      if (event.data.kind === 'inspect') {
        setSelectedElement(event.data.element || null)
        return
      }
      if (event.data.kind === 'inspect-mode') return
      if (event.data.kind === 'checks') {
        const pending = pendingCheckRef.current
        if (!pending || pending.missionId !== event.data.missionId || pending.runId !== event.data.runId) return
        const rows = [...pending.rows, ...(Array.isArray(event.data.rows) ? event.data.rows : [])]
        const passed = rows.every((row) => row.passed)
        pendingCheckRef.current = null
        window.clearTimeout(checkTimeoutRef.current)
        checkTimeoutRef.current = null
        setCheckResult({ missionId: pending.missionId, rows, passed, pending: false })
        if (passed) setSavedState((current) => ({ ...current, completed: current.completed.includes(pending.missionId) ? current.completed : [...current.completed, pending.missionId] }))
        return
      }
      setPreviewError(String(event.data.message).slice(0, 180))
    }
    window.addEventListener('message', receivePreviewMessage)
    return () => window.removeEventListener('message', receivePreviewMessage)
  }, [])

  function cancelPendingCheck() {
    pendingCheckRef.current = null
    window.clearTimeout(checkTimeoutRef.current)
    checkTimeoutRef.current = null
  }

  function chooseMission(mission) {
    cancelPendingCheck()
    setSavedState((current) => ({ ...current, activeId: mission.id }))
    const nextFile = getFileForLanguage(mission.language)
    if (nextFile === 'css') {
      const cssSource = savedState.drafts[mission.id]?.css || mission.files.css
      const formattedCss = formatCssSource(cssSource)
      if (formattedCss !== cssSource) {
        setSavedState((current) => ({
          ...current,
          drafts: { ...current.drafts, [mission.id]: { ...(current.drafts[mission.id] || {}), css: formattedCss } },
        }))
      }
    }
    setActiveFile(nextFile)
    setCheckResult(null)
    setHintIndex(-1)
    setPreviewError('')
    setSelectedElement(null)
  }

  function updateFile(file, value) {
    cancelPendingCheck()
    previewReadyRef.current = false
    setSavedState((current) => ({
      ...current,
      drafts: { ...current.drafts, [activeMission.id]: { ...(current.drafts[activeMission.id] || {}), [file]: value } },
    }))
    setCheckResult(null)
    setPreviewError('')
    setSelectedElement(null)
  }

  function toggleElementInspector() {
    const enabled = !inspectEnabledRef.current
    inspectEnabledRef.current = enabled
    setInspectEnabled(enabled)
    setSelectedElement(null)
    setViewMode('preview')
    previewRef.current?.contentWindow?.postMessage({ channel: 'frontend-mission-host', type: 'set-inspect', enabled }, '*')
  }

  function refreshPreview() {
    cancelPendingCheck()
    previewReadyRef.current = false
    setPreviewError('')
    setSelectedElement(null)
    setCheckResult(null)
    setPreviewRevision((revision) => revision + 1)
  }

  function startPreviewResize(event) {
    event.preventDefault()
    event.currentTarget.focus()
    resizeStartRef.current = { pointerX: event.clientX, width: viewportWidth, zoom: previewZoom }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function movePreviewResize(event) {
    if (!resizeStartRef.current) return
    const nextWidth = resizeStartRef.current.width + (event.clientX - resizeStartRef.current.pointerX) / resizeStartRef.current.zoom
    setViewportWidth(Math.min(1440, Math.max(320, Math.round(nextWidth))))
  }

  function stopPreviewResize() {
    resizeStartRef.current = null
  }

  function changePreviewZoom(amount) {
    setPreviewZoom((zoom) => Math.min(1.5, Math.max(0.5, Math.round((zoom + amount) * 10) / 10)))
  }

  function resetPreviewZoom() {
    setPreviewZoom(1)
  }

  function keyPreviewResize(event) {
    const step = event.shiftKey ? 50 : 10
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      setViewportWidth((width) => Math.max(320, width - step))
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      setViewportWidth((width) => Math.min(1440, width + step))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setViewportWidth(320)
    } else if (event.key === 'End') {
      event.preventDefault()
      setViewportWidth(1440)
    }
  }

  function formatActiveCss() {
    updateFile('css', formatCssSource(files.css))
  }

  function selectFile(file) {
    if (file === 'css') {
      const formattedCss = formatCssSource(files.css)
      if (formattedCss !== files.css) updateFile('css', formattedCss)
    }
    setActiveFile(file)
  }

  function runChecks() {
    cancelPendingCheck()
    const rows = evaluateMission(activeMission, files)
    if (rows.some((row) => !row.passed)) {
      setCheckResult({ missionId: activeMission.id, rows, passed: false, pending: false })
      return
    }
    const runId = ++runSequenceRef.current
    pendingCheckRef.current = { missionId: activeMission.id, rows, runId, sent: false }
    setCheckResult({ missionId: activeMission.id, rows, passed: false, pending: true })
    sendPendingChecks()
    checkTimeoutRef.current = window.setTimeout(() => {
      if (pendingCheckRef.current?.runId !== runId) return
      pendingCheckRef.current = null
      setCheckResult({ missionId: activeMission.id, rows: [...rows, { label: 'The isolated browser preview responds to checks', passed: false }], passed: false, pending: false })
    }, 5000)
  }

  function resetMission() {
    cancelPendingCheck()
    setSavedState((current) => {
      const drafts = { ...current.drafts }
      delete drafts[activeMission.id]
      return { ...current, drafts }
    })
    setCheckResult(null)
    setPreviewError('')
  }

  function handleEditorKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      runChecks()
      return
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      const editor = event.currentTarget
      const start = editor.selectionStart
      const end = editor.selectionEnd
      const source = activeCode
      const lineStart = source.lastIndexOf('\n', start - 1) + 1
      const indentation = source.slice(lineStart, start).match(/^\s*/)?.[0] || ''
      const nestedIndent = /[({[]\s*$/.test(source.slice(lineStart, start)) ? '  ' : ''
      const insertion = `\n${indentation}${nestedIndent}`
      updateFile(activeFile, `${source.slice(0, start)}${insertion}${source.slice(end)}`)
      requestAnimationFrame(() => {
        editor.focus()
        editor.setSelectionRange(start + insertion.length, start + insertion.length)
      })
      return
    }
    if (event.key !== 'Tab') return
    event.preventDefault()
    const editor = event.currentTarget
    const start = editor.selectionStart
    const end = editor.selectionEnd
    const next = `${activeCode.slice(0, start)}  ${activeCode.slice(end)}`
    updateFile(activeFile, next)
    requestAnimationFrame(() => {
      editor.focus()
      editor.setSelectionRange(start + 2, start + 2)
    })
  }

  function handleEditorScroll(event) {
    const { scrollTop, scrollLeft } = event.currentTarget
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop
      highlightRef.current.scrollLeft = scrollLeft
    }
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = scrollTop
  }

  function goToMission(index) {
    const nextMission = FRONTEND_MISSIONS[index]
    if (nextMission) chooseMission(nextMission)
  }

  return (
    <main className="frontend-studio">
      <div className="frontend-topbar">
        <Link to="/" className="frontend-back">← <span>Course library</span></Link>
        <div className="frontend-topbar-meta"><span className="frontend-live-dot" /> Browser sandbox <span className="frontend-topbar-divider">·</span> Progress saved on this device</div>
        <Link to="/course/html-css-javascript" className="frontend-course-link">Course outline ↗</Link>
      </div>

      <header className="frontend-hero">
        <div className="frontend-hero-copy">
          <span className="frontend-kicker"><i /> FRONTEND ENGINEERING / INTERACTIVE CAMPAIGN</span>
          <h1>Build the interface.<br /><em>Understand the browser.</em></h1>
          <p>Take a page from structure to interaction. Solve focused missions in HTML, CSS, and JavaScript, then see every change in a live browser.</p>
          <div className="frontend-hero-tags"><span>15 guided missions</span><span>Live browser preview</span><span>Local, private progress</span></div>
        </div>
        <div className="frontend-hero-visual" aria-hidden="true">
          <div className="frontend-browser-window">
            <div className="frontend-browser-bar"><i /><i /><i /><span>your-first-interface.dev</span></div>
            <div className="frontend-browser-canvas"><div className="frontend-visual-nav"><b /> <span /><span /></div><div className="frontend-visual-hero"><span /><b /><i /></div><div className="frontend-visual-cards"><i /><i /><i /></div></div>
          </div>
          <div className="frontend-hero-float frontend-float-html">&lt;html&gt;</div>
          <div className="frontend-hero-float frontend-float-css">display: grid;</div>
          <div className="frontend-hero-float frontend-float-js">click → update()</div>
        </div>
      </header>

      <section className="frontend-progress" aria-label="Campaign progress">
        <div className="frontend-progress-stat"><span className="frontend-stat-icon">01</span><div><small>MISSIONS COMPLETE</small><b>{completed.size}<span> / {FRONTEND_MISSIONS.length}</span></b></div></div>
        <div className="frontend-progress-bar-wrap"><div className="frontend-progress-label"><span>Campaign progress</span><b>{progressPercent}%</b></div><div className="frontend-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax={FRONTEND_MISSIONS.length} aria-valuenow={completed.size} aria-label={`${completed.size} of ${FRONTEND_MISSIONS.length} missions complete`}><i style={{ width: `${progressPercent}%` }} /></div></div>
        <div className="frontend-progress-stat frontend-xp-stat"><span className="frontend-stat-icon">✦</span><div><small>EXPERIENCE EARNED</small><b>{completed.size * 100}<span> XP</span></b></div></div>
      </section>

      <div className="frontend-track-tabs" role="group" aria-label="Jump to a mission track">
        {FRONTEND_TRACKS.map((track, index) => {
          const trackMissions = FRONTEND_MISSIONS.filter((mission) => mission.track === track.name)
          const trackCompleted = trackMissions.filter((mission) => completed.has(mission.id)).length
          const selected = activeTrackIndex === index
          return <button key={track.name} type="button" aria-pressed={selected} onClick={() => goToMission(FRONTEND_MISSIONS.findIndex((mission) => mission.track === track.name))} className={`frontend-track-tab ${selected ? 'selected' : ''} ${track.color}`}>
            <span className="frontend-track-number">0{index + 1}</span><span className="frontend-track-name">{track.shortName}<small>{track.description}</small></span><span className="frontend-track-count">{trackCompleted}/{trackMissions.length}</span>
          </button>
        })}
      </div>

      <section className="frontend-mission-heading" aria-labelledby="mission-title">
        <div><p className="frontend-section-label"><b>MISSION {String(activeIndex + 1).padStart(2, '0')}</b><span>/ 15</span><i /> {activeMission.track.toUpperCase()}</p><h2 id="mission-title">{activeMission.title}</h2><p>{activeMission.goal}</p></div>
        <div className="frontend-mission-heading-actions"><span className="frontend-duration">◷ &nbsp; 5–8 min</span><button type="button" className="frontend-reset-button" onClick={resetMission} title="Reset this mission to its starter code">Reset code</button></div>
      </section>

      <section className="frontend-workbench" aria-label="Frontend mission workbench">
        <aside className="frontend-mission-rail" aria-label="Campaign missions">
          <div className="frontend-rail-heading"><span>CAMPAIGN MAP</span><b>15</b></div>
          {FRONTEND_TRACKS.map((track, trackIndex) => {
            const missions = FRONTEND_MISSIONS.filter((mission) => mission.track === track.name)
            return <div key={track.name} className="frontend-rail-group">
              <p><span>{String(trackIndex + 1).padStart(2, '0')}</span>{track.name}</p>
              {missions.map((mission) => {
                const index = FRONTEND_MISSIONS.indexOf(mission)
                const isActive = mission.id === activeMission.id
                const isComplete = completed.has(mission.id)
                return <button key={mission.id} type="button" aria-current={isActive ? 'step' : undefined} onClick={() => chooseMission(mission)} className={`frontend-rail-mission ${isActive ? 'active' : ''} ${isComplete ? 'done' : ''}`}>
                  <span className="frontend-rail-status">{isComplete ? '✓' : String(index + 1).padStart(2, '0')}</span><span className="frontend-rail-title">{mission.title}</span><span className="frontend-rail-file">{mission.language === 'JavaScript' ? 'JS' : mission.language === 'HTML + CSS + JS' ? 'APP' : mission.language}</span>
                </button>
              })}
            </div>
          })}
          <div className="frontend-rail-note"><span>LEARNING LOOP</span><p>Make one change, inspect the browser, then run the mission checks.</p></div>
        </aside>

        <div className="frontend-editor-panel">
          <div className="frontend-panel-heading"><div><span className="frontend-panel-index">A</span><div><b>Code workspace</b><small>{activeFile === 'css' ? 'CSS syntax colors · Format CSS tidies the stylesheet' : 'Syntax colors · Tab indents · Enter keeps indentation'}</small></div></div><span className="frontend-editor-status"><i /> EDITING LOCALLY</span></div>
          <div className="frontend-file-tabs" role="group" aria-label="Choose code file">
            {[
              ['html', 'index.html', 'HTML'],
              ['css', 'styles.css', 'CSS'],
              ['js', 'script.js', 'JS'],
            ].map(([file, name, label]) => <button key={file} type="button" aria-pressed={activeFile === file} onClick={() => selectFile(file)} className={activeFile === file ? 'active' : ''}><span className={`frontend-file-icon ${file}`}>{label}</span>{name}<i>{getLineCount(files[file])}</i></button>)}
          </div>
          <div className="frontend-editor-shell">
            <div ref={lineNumbersRef} className="frontend-line-numbers" aria-hidden="true">{Array.from({ length: Math.max(1, getLineCount(activeCode)) }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
            <div className="frontend-code-pane">
              <pre ref={highlightRef} className="frontend-code-highlight" aria-hidden="true"><code>{highlightedTokens.map((token, index) => <span key={`${index}-${token.type}`} className={token.type ? `frontend-token-${token.type}` : undefined}>{token.text}</span>)}</code></pre>
              <textarea
                ref={editorRef}
                aria-label={`Edit ${activeFile === 'js' ? 'JavaScript' : activeFile.toUpperCase()} code`}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                value={activeCode}
                onChange={(event) => updateFile(activeFile, event.target.value)}
                onKeyDown={handleEditorKeyDown}
                onScroll={handleEditorScroll}
                className="frontend-code-editor"
                wrap="off"
              />
            </div>
          </div>
          <div className="frontend-editor-footer"><span><i /> {activeFile === 'html' ? 'HTML5' : activeFile === 'css' ? 'CSS3' : 'ECMAScript'} · saved automatically</span>{activeFile === 'css' && <button type="button" className="frontend-format-button" onClick={formatActiveCss}>Format CSS</button>}<span>{activeCode.length} chars</span></div>
          <div className="frontend-action-row"><button type="button" className="frontend-run-button" onClick={runChecks} disabled={currentPending}><span>{currentPending ? '…' : '▶'}</span> {currentPending ? 'Checking browser…' : 'Run mission checks'} <kbd>Ctrl ↵</kbd></button><button type="button" className="frontend-hint-button" onClick={() => setHintIndex((index) => (index + 1) % activeMission.hints.length)}>Lightbulb &nbsp; {hintIndex < 0 ? 'Need a hint?' : 'Next hint'}</button></div>
          {hintIndex >= 0 && <div className="frontend-hint-callout" role="status"><span>HINT {hintIndex + 1}</span><p>{activeMission.hints[hintIndex]}</p></div>}
          {currentCheckRows.length > 0 && <div className={`frontend-check-result ${currentPassed ? 'passed' : 'incomplete'}`} role="status" aria-live="polite" aria-busy={currentPending}>
            <div className="frontend-check-title"><span>{currentPending ? '…' : currentPassed ? '✓' : '!'}</span><div><b>{currentPending ? 'Checking the live browser…' : currentPassed ? 'Mission complete' : 'Keep working through the checks'}</b><small>{currentPending ? 'The preview is exercising your page behavior.' : currentPassed ? 'Your progress is saved on this device.' : 'Use the browser preview and hint to find the missing step.'}</small></div></div>
            <ul>{currentCheckRows.map((row) => <li key={row.label} className={row.passed ? 'ok' : ''}><span>{row.passed ? '✓' : '○'}</span>{row.label}</li>)}</ul>
          </div>}
        </div>

        <section className="frontend-browser-panel" aria-label="Live browser preview">
          <div className="frontend-panel-heading"><div><span className="frontend-panel-index">B</span><div><b>Live browser</b><small>Your code, rendered in an isolated preview</small></div></div><span className="frontend-browser-status"><i /> LIVE</span></div>
          <div className="frontend-preview-toolbar">
            <div className="frontend-preview-modes" role="group" aria-label="Browser tools">
              <button type="button" aria-pressed={viewMode === 'preview'} onClick={() => setViewMode('preview')}>Preview</button>
              <button type="button" aria-pressed={viewMode === 'structure'} onClick={() => setViewMode('structure')}>DOM</button>
              <button type="button" aria-pressed={viewMode === 'styles'} onClick={() => setViewMode('styles')}>CSS</button>
            </div>
            <div className="frontend-preview-tools">
              {viewMode === 'preview' && <label className="frontend-viewport-select"><span className="sr-only">Preview viewport size</span><select value={[390, 768, 1280].includes(viewportWidth) ? viewportWidth : 'custom'} onChange={(event) => setViewportWidth(Number(event.target.value))}><option value="custom" disabled>Custom · {viewportWidth}px</option><option value="390">Mobile · 390</option><option value="768">Tablet · 768</option><option value="1280">Desktop · 1280</option></select></label>}
              {viewMode === 'preview' && <div className="frontend-zoom-controls" role="group" aria-label="Preview zoom controls">
                <button type="button" onClick={() => changePreviewZoom(-0.1)} disabled={previewZoom <= 0.5} aria-label="Zoom out" title="Zoom out">−</button>
                <output>{Math.round(previewZoom * 100)}%</output>
                <button type="button" onClick={() => changePreviewZoom(0.1)} disabled={previewZoom >= 1.5} aria-label="Zoom in" title="Zoom in">+</button>
                <button type="button" onClick={resetPreviewZoom} disabled={previewZoom === 1} aria-label="Reset preview zoom" title="Reset zoom">Reset</button>
              </div>}
              {viewMode === 'preview' && <button type="button" className={'frontend-inspect-toggle' + (inspectEnabled ? ' active' : '')} aria-pressed={inspectEnabled} onClick={toggleElementInspector} title={inspectEnabled ? 'Turn off element picker' : 'Pick an element to inspect'}>{inspectEnabled ? 'Picking…' : 'Inspect'}</button>}
              <button type="button" className="frontend-preview-refresh" onClick={refreshPreview} aria-label="Refresh live preview" title="Restart the preview"><span aria-hidden="true">↻</span></button>
            </div>
          </div>
          <div className="frontend-preview-frame-wrap" key={activeMission.id + '-' + previewRevision} hidden={viewMode !== 'preview'}>
            <div className="frontend-preview-device" style={{ width: viewportWidth * previewZoom + 'px', height: previewZoom * 100 + '%' }}>
              <iframe ref={previewRef} onLoad={handlePreviewLoad} title={activeMission.title + ' live preview'} sandbox="allow-scripts" srcDoc={previewDocument} style={{ width: viewportWidth + 'px', height: 100 / previewZoom + '%', transform: 'scale(' + previewZoom + ')' }} />
              <output className="frontend-preview-measure" aria-hidden="true">{viewportWidth} px</output>
              <div className="frontend-preview-resize" role="slider" tabIndex={0} aria-orientation="horizontal" aria-label="Preview viewport width" aria-valuemin={320} aria-valuemax={1440} aria-valuenow={viewportWidth} aria-valuetext={viewportWidth + ' pixels wide'} title="Drag to resize; use arrow keys to adjust" onPointerDown={startPreviewResize} onPointerMove={movePreviewResize} onPointerUp={stopPreviewResize} onPointerCancel={stopPreviewResize} onKeyDown={keyPreviewResize}><span aria-hidden="true">⋮</span></div>
            </div>
          </div>
          {viewMode === 'preview' && inspectEnabled && <div className="frontend-inspect-hint" role="status"><span>ELEMENT PICKER ON</span> Click any item in the preview to see its rendered size and computed CSS.</div>}
          {viewMode === 'preview' && selectedElement && <section className="frontend-picked-element" aria-label="Selected element details">
            <div className="frontend-picked-heading"><div><span>SELECTED ELEMENT</span><code>&lt;{selectedElement.tag}{selectedElement.id ? ' id="' + selectedElement.id + '"' : ''}&gt;</code></div><button type="button" onClick={() => setSelectedElement(null)} aria-label="Clear selected element">×</button></div>
            <small className="frontend-picked-path">{selectedElement.path || 'document body'}</small>
            {selectedElement.text && <p className="frontend-picked-text">{selectedElement.text}</p>}
            <div className="frontend-picked-metrics"><span><b>{selectedElement.width} × {selectedElement.height}</b><small>rendered size</small></span><span><b>{selectedElement.display}</b><small>display</small></span><span><b>{selectedElement.position}</b><small>position</small></span></div>
            <div className="frontend-picked-styles">{[['color', selectedElement.color], ['background', selectedElement.backgroundColor], ['font', selectedElement.fontSize + ' / ' + selectedElement.fontWeight], ['spacing', 'padding ' + selectedElement.padding + ' · margin ' + selectedElement.margin], ...(selectedElement.gap !== 'normal' ? [['gap', selectedElement.gap]] : []), ...(selectedElement.flexDirection !== 'row' ? [['flex direction', selectedElement.flexDirection]] : []), ...(selectedElement.gridTemplateColumns !== 'none' ? [['grid columns', selectedElement.gridTemplateColumns]] : [])].map(([label, value]) => <span key={label}><small>{label}</small><code>{value}</code></span>)}</div>
          </section>}
          {viewMode === 'structure' ? <div className="frontend-inspector-view"><div className="frontend-inspector-caption"><span>DOCUMENT OUTLINE</span><small>Semantic elements in your markup</small></div>{outline.length ? <ul className="frontend-dom-tree">{outline.map((node, index) => <li key={`${node.tag}-${index}`} style={{ paddingLeft: `${Math.min(40, node.depth * 13)}px` }}><span className="frontend-dom-branch">{node.depth ? '└' : '◆'}</span><code>&lt;{node.tag}&gt;</code>{node.label && <small>{node.label}</small>}</li>)}</ul> : <p className="frontend-empty-inspector">Add semantic HTML elements to see the document outline.</p>}</div> : viewMode === 'styles' ? <div className="frontend-inspector-view"><div className="frontend-inspector-caption"><span>DECLARED CSS</span><small>Properties parsed from styles.css</small></div>{cssSignals.length ? <ul className="frontend-css-signals">{cssSignals.map((signal, index) => <li key={`${signal.property}-${index}`}><code>{signal.property}</code><span>:</span><b>{signal.value}</b></li>)}</ul> : <p className="frontend-empty-inspector">Add CSS declarations to inspect the current style rules.</p>}</div> : null}
          {previewError && viewMode === 'preview' && <div className="frontend-preview-error" role="status"><b>Browser console</b><span>{previewError}</span><button type="button" onClick={() => setPreviewError('')} aria-label="Dismiss preview error">×</button></div>}
          <div className="frontend-preview-foot"><span><i /> {viewMode === 'preview' ? 'SANDBOXED PREVIEW' : viewMode === 'structure' ? 'LIVE DOCUMENT MAP' : 'LIVE STYLE INSPECTOR'}</span><small>{viewportWidth}px viewport</small></div>
        </section>

        <aside className="frontend-concept-panel">
          <div className="frontend-concept-copy"><span>THE IDEA</span><p>{activeMission.concept}</p></div>
          <div className="frontend-concept-copy why"><span>WHY IT MATTERS</span><p>{activeMission.why}</p></div>
          <div className="frontend-checklist-summary"><span>MISSION ACCEPTANCE</span><small>{activeMission.checks.length} checks · {activeMission.language}</small></div>
          <div className="frontend-current-file"><span>FOCUSED FILE</span><b>{activeMission.language === 'HTML' ? 'index.html' : activeMission.language === 'CSS' ? 'styles.css' : activeMission.language === 'JavaScript' ? 'script.js' : 'Full project'}</b><small>{activeMission.track}</small></div>
        </aside>
      </section>

      <div className="frontend-workbench-controls"><button type="button" disabled={activeIndex === 0} onClick={() => goToMission(activeIndex - 1)}>← Previous mission</button><div><span>{String(activeIndex + 1).padStart(2, '0')}</span> / 15</div><button type="button" disabled={activeIndex === FRONTEND_MISSIONS.length - 1} onClick={() => goToMission(activeIndex + 1)}>Next mission →</button></div>

      <footer className="frontend-studio-footer"><span>FRONTEND MISSION STUDIO</span><p>Runs in your browser. Drafts and progress stay on this device; the studio does not upload your code.</p><Link to="/course/html-css-javascript">Return to the full course ↑</Link></footer>
    </main>
  )
}

