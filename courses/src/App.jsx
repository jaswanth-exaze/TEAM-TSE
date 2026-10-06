import { lazy, Suspense, useEffect, useRef } from 'react'
import { MotionConfig } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import StudyGuide from './pages/StudyGuide'
import LessonPage from './pages/LessonPage'
import NodeLessonPage from './pages/NodeLessonPage'
import RestApiLessonPage from './pages/RestApiLessonPage'
import UnitTestingLessonPage from './pages/UnitTestingLessonPage'
import MiniChallengePage from './pages/MiniChallengePage'
import PracticeExams from './pages/PracticeExams'
import NotFound from './pages/NotFound'
import AmbientEffects from './components/AmbientEffects'
import SiteNavigation from './components/SiteNavigation'
import { ThemeProvider } from './components/ThemeContext'
import { getModule } from './data/modules'

const HtmlJavaScriptPracticeExams = lazy(() => import('./pages/HtmlJavaScriptPracticeExams'))

function getRouteTitle(pathname) {
  if (pathname === '/') return 'Course library'
  const moduleId = pathname.match(/^\/(?:course|study|quiz|results)\/([^/]+)/)?.[1]
  const module = moduleId ? getModule(moduleId) : null
  if (moduleId && !module) return 'Page not found'
  const courseName = module?.title || 'Course'
  if (pathname.includes('/topic/')) return `${courseName} lesson`
  if (pathname.includes('/activity/')) return `${courseName} practice challenge`
  if (pathname.startsWith('/quiz/')) return `${courseName} quiz`
  if (pathname.startsWith('/results/')) return `${courseName} quiz results`
  if (pathname.includes('/exams')) return `${courseName} practice exams`
  if (pathname.startsWith('/course/') || pathname.startsWith('/study/')) return `${courseName} course`
  return 'Page not found'
}

export default function App() {
  const { pathname } = useLocation()
  const initialPathname = useRef(pathname)
  const routeTitle = getRouteTitle(pathname)
  const quizMatch = pathname.match(/^\/quiz\/([^/]+)\/?$/)
  const showAmbientEffects = pathname === '/' || Boolean(quizMatch)

  useEffect(() => {
    document.title = `${routeTitle} | TSE Learning Hub`
  }, [routeTitle])

  useEffect(() => {
    if (initialPathname.current === pathname) return
    initialPathname.current = pathname
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    requestAnimationFrame(() => {
      const heading = document.querySelector('#app-content h1')
      const focusTarget = heading || document.getElementById('app-content')
      if (heading) heading.setAttribute('tabindex', '-1')
      focusTarget?.focus({ preventScroll: true })
    })
  }, [pathname])

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <div className="relative isolate min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
          {showAmbientEffects && <AmbientEffects moduleId={quizMatch?.[1]} />}
          <SiteNavigation />
          <div id="app-content" className="relative z-10" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/quiz/:moduleId" element={<Quiz />} />
              <Route path="/results/:moduleId" element={<Results />} />
              <Route path="/course/:moduleId" element={<StudyGuide />} />
              <Route path="/course/node-js/topic/:topicId" element={<NodeLessonPage />} />
              <Route path="/course/unit-testing-fundamentals/topic/:topicId" element={<UnitTestingLessonPage />} />
              <Route path="/course/rest-api-fundamentals/topic/:topicId" element={<RestApiLessonPage />} />
              <Route path="/course/:moduleId/topic/:topicId" element={<LessonPage />} />
              <Route path="/course/:moduleId/activity/:activityId" element={<MiniChallengePage />} />
              <Route path="/study/:moduleId" element={<StudyGuide />} />
              <Route path="/study/html-css-javascript/exams" element={<Suspense fallback={<p className="px-6 py-12 text-center text-sm text-white/60">Loading practice exams...</p>}><HtmlJavaScriptPracticeExams /></Suspense>} />
              <Route path="/study/html-css-javascript/exams/:examId" element={<Suspense fallback={<p className="px-6 py-12 text-center text-sm text-white/60">Loading practice exam...</p>}><HtmlJavaScriptPracticeExams /></Suspense>} />
              <Route path="/study/mysql/exams" element={<PracticeExams />} />
              <Route path="/study/mysql/exams/:examId" element={<PracticeExams />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </MotionConfig>
    </ThemeProvider>
  )
}
