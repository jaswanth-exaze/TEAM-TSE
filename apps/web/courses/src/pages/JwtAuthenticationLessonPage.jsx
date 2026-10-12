import MarkdownCourseLessonPage from './MarkdownCourseLessonPage'
import {
  JWT_AUTHENTICATION_PARTS,
  JWT_AUTHENTICATION_TOPICS,
  loadJwtAuthenticationTopic,
} from '../data/courses/jwt-authentication'

export default function JwtAuthenticationLessonPage() {
  return <MarkdownCourseLessonPage
    moduleId="jwt-authentication"
    parts={JWT_AUTHENTICATION_PARTS}
    topics={JWT_AUTHENTICATION_TOPICS}
    loadTopic={loadJwtAuthenticationTopic}
  />
}
