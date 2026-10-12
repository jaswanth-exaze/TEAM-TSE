const topicLoaders = {
  'insert': () => import('./topics/insert.js'),
  'update': () => import('./topics/update.js'),
  'delete': () => import('./topics/delete.js'),
  'create-table': () => import('./topics/create-table.js'),
  'alter-table': () => import('./topics/alter-table.js'),
  'drop-table': () => import('./topics/drop-table.js'),
  'select-from-where': () => import('./topics/select-from-where.js'),
  'filtering': () => import('./topics/filtering.js'),
  'order-by': () => import('./topics/order-by.js'),
  'limit': () => import('./topics/limit.js'),
  'count': () => import('./topics/count.js'),
  'sum': () => import('./topics/sum.js'),
  'avg': () => import('./topics/avg.js'),
  'min-max': () => import('./topics/min-max.js'),
  'group-by': () => import('./topics/group-by.js'),
  'having-where': () => import('./topics/having-where.js'),
  'primary-foreign-keys': () => import('./topics/primary-foreign-keys.js'),
  'joins': () => import('./topics/joins.js'),
  'distinct-null-strings': () => import('./topics/distinct-null-strings.js'),
  'substring': () => import('./topics/substring.js'),
  'case-when': () => import('./topics/case-when.js'),
  'self-joins': () => import('./topics/self-joins.js'),
  'multiple-joins': () => import('./topics/multiple-joins.js'),
  'coalesce': () => import('./topics/coalesce.js'),
  'nested-subqueries': () => import('./topics/nested-subqueries.js'),
  'correlated-subqueries': () => import('./topics/correlated-subqueries.js'),
  'hierarchies': () => import('./topics/hierarchies.js'),
  'date-functions': () => import('./topics/date-functions.js'),
  'views': () => import('./topics/views.js'),
  'row-number': () => import('./topics/row-number.js'),
  'rank': () => import('./topics/rank.js'),
  'transactions': () => import('./topics/transactions.js'),
  'query-cost-explain': () => import('./topics/query-cost-explain.js')
}

const activityLoaders = {
  'mini-challenge-01': () => import('./activities/mini-challenge-01.js'),
  'mini-challenge-02': () => import('./activities/mini-challenge-02.js'),
  'mini-challenge-03': () => import('./activities/mini-challenge-03.js'),
  'mini-challenge-04': () => import('./activities/mini-challenge-04.js'),
  'mini-challenge-05': () => import('./activities/mini-challenge-05.js'),
  'mini-challenge-06': () => import('./activities/mini-challenge-06.js'),
  'mini-challenge-07': () => import('./activities/mini-challenge-07.js')
}

export const MYSQL_TOPIC_STATUS = {
  'insert': 'full',
  'update': 'outline',
  'delete': 'full',
  'create-table': 'full',
  'alter-table': 'full',
  'drop-table': 'full',
  'select-from-where': 'full',
  'filtering': 'full',
  'order-by': 'full',
  'limit': 'full',
  'count': 'full',
  'sum': 'reference',
  'avg': 'reference',
  'min-max': 'reference',
  'group-by': 'full',
  'having-where': 'full',
  'primary-foreign-keys': 'full',
  'joins': 'full',
  'distinct-null-strings': 'full',
  'substring': 'full',
  'case-when': 'outline',
  'self-joins': 'outline',
  'multiple-joins': 'outline',
  'coalesce': 'outline',
  'nested-subqueries': 'outline',
  'correlated-subqueries': 'outline',
  'hierarchies': 'outline',
  'date-functions': 'outline',
  'views': 'outline',
  'row-number': 'outline',
  'rank': 'outline',
  'transactions': 'outline',
  'query-cost-explain': 'outline'
}

export const MYSQL_PRACTICE_ACTIVITIES = [
  { id: 'mini-challenge-01', title: "Mini Challenge 1 — Topics 1-4", part: 1, difficulty: "Beginner" },
  { id: 'mini-challenge-02', title: "Mini Challenge 2 — Topics 5-6", part: 1, difficulty: "Beginner" },
  { id: 'mini-challenge-03', title: "Mini Challenge 3 — Topics 7-9", part: 1, difficulty: "Beginner" },
  { id: 'mini-challenge-04', title: "Mini Challenge 4 — Topics 10-12", part: 1, difficulty: "Intermediate" },
  { id: 'mini-challenge-05', title: "Mini Challenge 5 — Topics 13-15", part: 1, difficulty: "Beginner" },
  { id: 'mini-challenge-06', title: "Mini Challenge 6 — Topics 16-18", part: 1, difficulty: "Beginner" },
  { id: 'mini-challenge-07', title: "Mini Challenge 7 — Topics 19-20 + Preview", part: 1, difficulty: "Beginner" }
]

export function loadMysqlTopic(id) {
  return topicLoaders[id]?.().then((module) => module.default) || Promise.resolve(null)
}

export function loadMysqlActivity(id) {
  return activityLoaders[id]?.().then((module) => module.default) || Promise.resolve(null)
}
