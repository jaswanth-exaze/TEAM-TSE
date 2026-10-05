import { loadMysqlActivity, loadMysqlTopic } from './mysql'
import { loadNodeTopic } from './node-js'

const moduleLoaders = {
  mysql: {
    topic: loadMysqlTopic,
    activity: loadMysqlActivity,
  },
  'node-js': {
    topic: loadNodeTopic,
  },
}

export function loadCourseTopic(moduleId, topicId) {
  return moduleLoaders[moduleId]?.topic(topicId) || Promise.resolve(null)
}

export function loadCourseActivity(moduleId, activityId) {
  return moduleLoaders[moduleId]?.activity(activityId) || Promise.resolve(null)
}
