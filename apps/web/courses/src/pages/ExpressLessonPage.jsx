import MarkdownCourseLessonPage from './MarkdownCourseLessonPage'
import { EXPRESS_PARTS, EXPRESS_TOPICS, loadExpressTopic } from '../data/courses/express'

export default function ExpressLessonPage() {
  return <MarkdownCourseLessonPage
    moduleId="express"
    parts={EXPRESS_PARTS}
    topics={EXPRESS_TOPICS}
    loadTopic={loadExpressTopic}
    showQuiz={false}
  />
}
