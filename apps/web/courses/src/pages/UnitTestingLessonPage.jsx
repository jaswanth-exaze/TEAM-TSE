import MarkdownCourseLessonPage from './MarkdownCourseLessonPage'
import { UNIT_TESTING_PARTS, UNIT_TESTING_TOPICS, loadUnitTestingTopic } from '../data/courses/unit-testing-fundamentals'

export default function UnitTestingLessonPage() {
  return <MarkdownCourseLessonPage
    moduleId="unit-testing-fundamentals"
    parts={UNIT_TESTING_PARTS}
    topics={UNIT_TESTING_TOPICS}
    loadTopic={loadUnitTestingTopic}
  />
}
