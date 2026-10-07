import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { getModule } from '../data/modules'
import { getHubHomeHref } from '../lib/paths'
import { ThemeToggle } from './ThemeContext'
import { attachLogoMorph } from '../../../js/logo-morph.js'
import ExazeLogoSvg from './ExazeLogoSvg'

const primaryLinkClass = ({ isActive }) => `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 ${
  isActive
    ? 'bg-indigo-200/10 text-indigo-100'
    : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
}`

function HomeLink({ onNavigate }) {
  return <a href={getHubHomeHref()} onClick={onNavigate} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">Home</a>
}

export default function SiteNavigation() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const brandRef = useRef(null)
  const hubHomeHref = getHubHomeHref()
  const activeModuleId = location.pathname.match(/^\/(?:course|study|quiz|results)\/([^/]+)/)?.[1]
  const activeModule = activeModuleId ? getModule(activeModuleId) : null
  const activeCoursePath = activeModule && (
    location.pathname.startsWith(`/course/${activeModule.id}`)
    || location.pathname.startsWith(`/study/${activeModule.id}`)
  )

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!brandRef.current) return undefined
    return attachLogoMorph(brandRef.current, { interactive: true, idPrefix: 'nav-' })
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined
    function closeOnEscape(event) {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  useEffect(() => {
    if (!window.matchMedia) return undefined
    const desktopViewport = window.matchMedia('(min-width: 1024px)')
    function closeOnDesktop(event) {
      if (event.matches) setMenuOpen(false)
    }
    if (desktopViewport.addEventListener) {
      desktopViewport.addEventListener('change', closeOnDesktop)
      return () => desktopViewport.removeEventListener('change', closeOnDesktop)
    }
    desktopViewport.addListener(closeOnDesktop)
    return () => desktopViewport.removeListener(closeOnDesktop)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <a href="#app-content" className="sr-only z-50 rounded-lg bg-[var(--action-primary)] px-4 py-3 text-sm font-semibold text-[var(--action-primary-fg)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to page content
      </a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--page-bg)]/95 text-[var(--page-fg)] shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <a ref={brandRef} href={hubHomeHref} aria-label="TSE Learning Hub home" className="group flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200">
            <ExazeLogoSvg />
            <span aria-hidden="true" className="h-6 w-px bg-white/20" />
            <span className="truncate text-sm font-semibold text-white/85">TSE Learning Hub</span>
          </a>

          <nav aria-label="Primary navigation" className="ml-auto hidden items-center gap-1 lg:flex">
            <HomeLink />
            <NavLink to="/" end className={primaryLinkClass}>Course library</NavLink>
            {activeModule && <Link to={`/course/${activeModule.id}`} aria-current={activeCoursePath ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 ${activeCoursePath ? 'bg-indigo-200/10 text-indigo-100' : 'text-white/70 hover:bg-white/[0.05] hover:text-white'}`}>
              {activeModule.title} course
            </Link>}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-1">
            <ThemeToggle />
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 lg:hidden"
              aria-controls="mobile-primary-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true" className="grid gap-1">
                <span className="h-px w-4 bg-current" />
                <span className="h-px w-4 bg-current" />
                <span className="h-px w-4 bg-current" />
              </span>
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>

          <nav
            id="mobile-primary-navigation"
            aria-label="Mobile primary navigation"
            hidden={!menuOpen}
            className="grid w-full gap-1 border-t border-white/10 pt-2 lg:hidden"
          >
            <HomeLink onNavigate={closeMenu} />
            <NavLink to="/" end onClick={closeMenu} className={primaryLinkClass}>Course library</NavLink>
            {activeModule && <Link to={`/course/${activeModule.id}`} onClick={closeMenu} aria-current={activeCoursePath ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 ${activeCoursePath ? 'bg-indigo-200/10 text-indigo-100' : 'text-white/70 hover:bg-white/[0.05] hover:text-white'}`}>
              {activeModule.title} course
            </Link>}
          </nav>
        </div>
      </header>
    </>
  )
}
