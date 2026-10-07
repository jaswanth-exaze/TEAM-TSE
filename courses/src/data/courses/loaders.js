import { loadMysqlActivity, loadMysqlTopic } from './mysql'
import { loadNodeTopic } from './node-js'
import { loadExpressTopic } from './express'
import { loadRestApiTopic } from './rest-api'
import { loadUnitTestingTopic } from './unit-testing-fundamentals'
import { loadPasswordSaltHashTopic } from './password-salt-hash-fundamentals'
import { loadJwtAuthenticationTopic } from './jwt-authentication'

const moduleLoaders = {
  mysql: {
    topic: loadMysqlTopic,
    activity: loadMysqlActivity,
  },
  'node-js': {
    topic: loadNodeTopic,
  },
  express: {
    topic: loadExpressTopic,
  },
  'rest-api-fundamentals': {
    topic: loadRestApiTopic,
  },
  'unit-testing-fundamentals': {
    topic: loadUnitTestingTopic,
  },
  'password-salt-hash-fundamenta': {
    topic: loadPasswordSaltHashTopic,
  },
  'jwt-authentication': {
    topic: loadJwtAuthenticationTopic,
  },
}

export function loadCourseTopic(moduleId, topicId) {
  return moduleLoaders[moduleId]?.topic(topicId) || Promise.resolve(null)
}

export function loadCourseActivity(moduleId, activityId) {
  return moduleLoaders[moduleId]?.activity(activityId) || Promise.resolve(null)
}
