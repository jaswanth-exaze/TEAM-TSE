import { loadMysqlActivity, loadMysqlTopic } from './mysql'
import { loadNodeTopic } from './node-js'
import { loadRestApiTopic } from './rest-api'
import { loadUnitTestingTopic } from './unit-testing-fundamentals'

const moduleLoaders = {
  mysql: {
    topic: loadMysqlTopic,
    activity: loadMysqlActivity,
  },
  'node-js': {
    topic: loadNodeTopic,
  },
  'rest-api-fundamentals': {
    topic: loadRestApiTopic,
  },
  'unit-testing-fundamentals': {
    topic: loadUnitTestingTopic,
  },
}

export function loadCourseTopic(moduleId, topicId) {
  return moduleLoaders[moduleId]?.topic(topicId) || Promise.resolve(null)
}

export function loadCourseActivity(moduleId, activityId) {
  return moduleLoaders[moduleId]?.activity(activityId) || Promise.resolve(null)
}
