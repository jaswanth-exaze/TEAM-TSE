import MarkdownCourseLessonPage from './MarkdownCourseLessonPage'
import {
  PASSWORD_SALT_HASH_PARTS,
  PASSWORD_SALT_HASH_TOPICS,
  loadPasswordSaltHashTopic,
} from '../data/courses/password-salt-hash-fundamentals'

export default function PasswordSaltHashLessonPage() {
  return <MarkdownCourseLessonPage
    moduleId="password-salt-hash-fundamenta"
    parts={PASSWORD_SALT_HASH_PARTS}
    topics={PASSWORD_SALT_HASH_TOPICS}
    loadTopic={loadPasswordSaltHashTopic}
  />
}
