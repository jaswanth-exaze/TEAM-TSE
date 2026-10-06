import MarkdownCourseLessonPage from './MarkdownCourseLessonPage'
import { REST_API_PARTS, REST_API_TOPICS, loadRestApiTopic } from '../data/courses/rest-api'

export default function RestApiLessonPage() {
  return <MarkdownCourseLessonPage
    moduleId="rest-api-fundamentals"
    parts={REST_API_PARTS}
    topics={REST_API_TOPICS}
    loadTopic={loadRestApiTopic}
  />
}
