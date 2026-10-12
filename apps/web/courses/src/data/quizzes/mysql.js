export default [
  {
    id: 'mysql-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Production Bug',
    prompt: `An e-commerce application stores product stock in the database.

products

id | product_name | stock
--------------------------
1  | Laptop       | 5
2  | Mouse        | 12

A developer accidentally deploys this query:

UPDATE products
SET stock = stock - 1;

The QA team immediately reports incorrect stock values.

Which statement BEST explains what happened?`,
    options: [
      'Only the first product stock was updated.',
      'Only products with stock greater than 10 were updated.',
      'Every product stock decreased because UPDATE without WHERE affects all rows.',
      'MySQL automatically rolls back UPDATE statements without a WHERE clause.'
    ],
    correctAnswer: 'Every product stock decreased because UPDATE without WHERE affects all rows.',
    explanation: 'UPDATE modifies every row that satisfies the WHERE clause. If no WHERE clause exists, every row satisfies the condition. MySQL does not automatically protect you from this mistake or roll back the transaction. This is one of the most common production incidents caused by human error.',
    optionNotes: {
      'Only the first product stock was updated.': 'UPDATE does not default to the first row; it affects every row matched by its condition.',
      'Only products with stock greater than 10 were updated.': 'No stock condition appears in the statement, so stock values do not limit which rows match.',
      'Every product stock decreased because UPDATE without WHERE affects all rows.': 'Correct: with no WHERE clause, every row in products is updated.',
      'MySQL automatically rolls back UPDATE statements without a WHERE clause.': 'MySQL does not treat a missing WHERE clause as an error or automatically undo the update.'
    },
    commonMistake: 'Assuming the database will protect a write query when its WHERE clause is missing.',
    takeaway: 'An UPDATE without WHERE changes every row in the table.',
    visual: {
      type: 'diff',
      title: 'The missing WHERE changed every row',
      description: 'Subtracting one from stock with no filter applies the same update to every product.',
      columns: ['id', 'product_name', 'stock'],
      rowKey: 'id',
      before: [{ id: 1, product_name: 'Laptop', stock: 5 }, { id: 2, product_name: 'Mouse', stock: 12 }],
      after: [{ id: 1, product_name: 'Laptop', stock: 4 }, { id: 2, product_name: 'Mouse', stock: 11 }],
      note: 'Preview the matching rows with the same WHERE condition before running a production UPDATE.'
    }
  },

  {
    id: 'mysql-2',
    type: 'code-output',
    difficulty: 'hard',
    category: 'Reporting Dashboard',
    prompt: `The HR dashboard displays departments whose average salary is greater than ₹60,000.

employees

name | department | salary
---------------------------
A    | IT         | 50000
B    | IT         | 70000
C    | HR         | 65000
D    | HR         | NULL
E    | Sales      | 55000

SELECT department
FROM employees
GROUP BY department
HAVING AVG(salary) > 60000;

Which department(s) are returned?`,
    options: [
      'IT',
      'HR',
      'IT and HR',
      'No departments'
    ],
    correctAnswer: 'HR',
    explanation: "AVG() completely ignores NULL values—it does not treat them as 0. IT's average is (50000 + 70000) / 2 = 60000, which does not satisfy > 60000. HR's average is AVG(65000, NULL) = 65000 because NULL is skipped entirely. This catches developers who mistakenly calculate (65000 + 0) / 2.",
    optionNotes: {
      IT: 'IT averages exactly 60,000, and the condition is strictly greater than 60,000.',
      HR: 'HR averages 65,000 because AVG ignores its NULL salary; 65,000 is greater than 60,000.',
      'IT and HR': 'IT equals the threshold, so it fails the strict > comparison. Only HR passes.',
      'No departments': 'HR has a non-NULL average above the threshold, so at least one department qualifies.'
    },
    commonMistake: 'Treating NULL as zero when calculating AVG.',
    takeaway: 'AVG ignores NULL values, and > excludes a value equal to the threshold.',
    visual: {
      type: 'stepper',
      title: 'Evaluate the HAVING condition by department',
      steps: [
        { label: 'IT · 2 salaries', context: 'Both IT salaries are present.', calculation: '(50,000 + 70,000) / 2 = 60,000', outcome: '60,000 is not greater than 60,000 · filtered out', keep: false },
        { label: 'HR · one NULL salary', context: 'AVG skips the NULL row instead of counting it as zero.', calculation: 'AVG(65,000, NULL) = 65,000', outcome: '65,000 is greater than 60,000 · kept', keep: true },
        { label: 'Sales · one salary', context: 'The only Sales value is below the threshold.', calculation: 'AVG(55,000) = 55,000', outcome: '55,000 is not greater than 60,000 · filtered out', keep: false }
      ]
    }
  },

  {
    id: 'mysql-3',
    type: 'mcq',
    difficulty: 'tricky',
    category: 'Code Review',
    prompt: `A developer wants to find users who have never placed an order.

Developer A writes:

SELECT *
FROM users
WHERE id NOT IN (
    SELECT user_id
    FROM orders
);

Later, one record in the orders table has user_id = NULL.

What is the MOST likely effect?`,
    options: [
      'The query works exactly as before.',
      'The query returns only users whose id is NULL.',
      'The query may return zero rows because NULL affects NOT IN comparisons.',
      'The query throws a syntax error.'
    ],
    correctAnswer: 'The query may return zero rows because NULL affects NOT IN comparisons.',
    explanation: 'This is one of SQL\'s most famous interview questions. If the subquery used with NOT IN returns even one NULL value, every comparison becomes UNKNOWN, so no rows satisfy the condition. Using NOT EXISTS is usually the safer solution because it checks row existence rather than comparing values.',
    optionNotes: {
      'The query works exactly as before.': 'A NULL in the subquery changes the result of non-matching NOT IN comparisons to UNKNOWN.',
      'The query returns only users whose id is NULL.': 'NOT IN does not select NULL IDs here; the NULL inside the subquery prevents comparisons from becoming TRUE.',
      'The query may return zero rows because NULL affects NOT IN comparisons.': 'Correct: NOT IN with a NULL candidate can evaluate to UNKNOWN, which WHERE filters out.',
      'The query throws a syntax error.': 'The syntax is valid. The surprising result comes from SQL NULL logic, not parsing.'
    },
    commonMistake: 'Reading UNKNOWN as if it were FALSE or ignoring it; WHERE keeps only TRUE.',
    takeaway: 'A NULL returned by a NOT IN subquery can make every unmatched comparison UNKNOWN.',
    visual: {
      type: 'truth-table',
      title: 'Why NOT IN becomes UNKNOWN',
      description: 'For a user id of 7 and subquery values 5 and NULL, NOT IN is equivalent to combining both not-equal comparisons.',
      columns: ['Comparison', 'Result'],
      rows: [['7 <> 5', 'TRUE'], ['7 <> NULL', 'UNKNOWN'], ['TRUE AND UNKNOWN', 'UNKNOWN'], ['WHERE keeps this row?', 'No — only TRUE passes']],
      note: 'NOT EXISTS avoids this particular NULL comparison trap.'
    }
  },

  {
    id: 'mysql-4',
    type: 'multi',
    difficulty: 'hard',
    category: 'Performance Optimization',
    prompt: `A table contains 12 million customer records.

An index exists on the "created_at" column.

Which queries are MOST likely to use the index efficiently? (Select all that apply)`,
    options: [
      "WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'",
      "WHERE YEAR(created_at) = 2026",
      "WHERE DATE(created_at) = '2026-06-01'",
      "WHERE created_at BETWEEN '2026-06-01 00:00:00' AND '2026-06-01 23:59:59'"
    ],
    correctAnswer: [
      "WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'",
      "WHERE created_at BETWEEN '2026-06-01 00:00:00' AND '2026-06-01 23:59:59'"
    ],
    explanation: 'Applying functions like YEAR() or DATE() directly to an indexed column makes the predicate non-sargable, preventing efficient index lookups. Range predicates preserve the original column values and allow MySQL to perform an index range scan.',
    optionNotes: {
      "WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'": 'Keeps the indexed column bare and defines a searchable half-open date range.',
      'WHERE YEAR(created_at) = 2026': 'Applying YEAR() to each value usually prevents a normal range lookup on the created_at index.',
      "WHERE DATE(created_at) = '2026-06-01'": 'Applying DATE() to the indexed column can force MySQL to evaluate rows instead of seeking a range.',
      "WHERE created_at BETWEEN '2026-06-01 00:00:00' AND '2026-06-01 23:59:59'": 'Keeps the indexed column bare and uses a bounded range, so the index can locate matching values.'
    },
    commonMistake: 'Wrapping an indexed column in a function and expecting an ordinary index range scan.',
    takeaway: 'Filter indexed dates with range predicates instead of applying a function to the column.',
    visual: {
      type: 'index-range',
      title: 'A range predicate can seek into the index',
      description: 'The index stores created_at in order. A bare range narrows to a segment; YEAR(created_at) must be calculated for candidate rows.',
      paths: [
        { label: "created_at >= '2026-01-01' AND created_at < '2027-01-01'", kind: 'range', entries: [{ value: '2025-12-31', match: false }, { value: '2026-01-01', match: true }, { value: '2026-06-15', match: true }, { value: '2026-12-31', match: true }, { value: '2027-01-01', match: false }], note: 'Seek to the first boundary and read the matching range.' },
        { label: 'YEAR(created_at) = 2026', kind: 'scan', entries: [{ value: '2025-12-31', match: false }, { value: '2026-01-01', match: true }, { value: '2026-06-15', match: true }, { value: '2026-12-31', match: true }, { value: '2027-01-01', match: false }], note: 'The function is evaluated for each candidate value; the ordinary index cannot directly seek by the transformed year.' }
      ]
    }
  },

  {
    id: 'mysql-5',
    type: 'code-output',
    difficulty: 'tricky',
    category: 'Production Bug',
    prompt: `The CEO notices that today's dashboard reports 4 customer records, even though there are only 3 customers.

customers

id
--
1
2
3

orders

id | customer_id
----------------
1  | 1
2  | 1
3  | 2

The query executed is:

SELECT COUNT(*)
FROM customers c
LEFT JOIN orders o
ON c.id = o.customer_id;

What is returned?`,
    options: [
      '3',
      '4',
      '5',
      '2'
    ],
    correctAnswer: '4',
    explanation: 'LEFT JOIN does not preserve the number of rows from the left table when matching rows exist. Customer 1 appears twice because they have two orders, customer 2 appears once, and customer 3 appears once with NULL order columns. The joined result contains four rows, so COUNT(*) returns 4. Many developers incorrectly assume a LEFT JOIN always returns exactly the number of rows in the left table.',
    optionNotes: {
      '3': 'The unmatched third customer still contributes a NULL-extended row, and customer 1 contributes two matching rows.',
      '4': 'Correct: customer 1 contributes two rows, customer 2 one, and customer 3 one preserved unmatched row.',
      '5': 'There are three customers and three orders, but one order matches customer 1; the join output is four rows, not a sum of table sizes.',
      '2': 'The join does not collapse a customer with multiple matching orders into one row.'
    },
    commonMistake: 'Assuming LEFT JOIN always produces exactly one output row per left-side row.',
    takeaway: 'A one-to-many join repeats the left row once for each match; unmatched left rows still appear once.',
    visual: {
      type: 'join-map',
      title: 'Count the rows produced by the join',
      description: 'The join emits one row per match and one NULL-extended row when a left row has no match.',
      leftLabel: 'Customers',
      rightLabel: 'Orders',
      leftRows: [{ id: 'c1', label: 'Customer 1' }, { id: 'c2', label: 'Customer 2' }, { id: 'c3', label: 'Customer 3' }],
      rightRows: [{ id: 'o1', label: 'Order 1' }, { id: 'o2', label: 'Order 2' }, { id: 'o3', label: 'Order 3' }],
      matches: [{ leftId: 'c1', rightId: 'o1' }, { leftId: 'c1', rightId: 'o2' }, { leftId: 'c2', rightId: 'o3' }],
      note: 'Customer 1 appears twice in the joined result. Customer 3 stays once with NULL order columns.'
    }
  },
  {
  id: 'mysql-6',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Reporting Dashboard',
  prompt: `The finance team wants to know how many employees belong to each department.

departments

id | name
---------
1  | IT
2  | HR
3  | Sales

employees

id | name | department_id
--------------------------
1  | Alice| 1
2  | Bob  | 1
3  | Carol| 2

A developer writes:

SELECT
    d.name,
    COUNT(*)
FROM departments d
LEFT JOIN employees e
ON d.id = e.department_id
GROUP BY d.name;

What will the query return?`,
  options: [
    'IT=2, HR=1, Sales=0',
    'IT=2, HR=1, Sales=1',
    'IT=3, HR=2, Sales=1',
    'The query throws an error'
  ],
  correctAnswer: 'IT=2, HR=1, Sales=1',
  explanation: 'This is a classic COUNT(*) trap. LEFT JOIN always produces one row for Sales even though there is no matching employee. COUNT(*) counts rows, not matching values, so Sales becomes 1. To count employees correctly, use COUNT(e.id), which ignores NULL values.'
},

{
  id: 'mysql-7',
  type: 'mcq',
  difficulty: 'hard',
  category: 'Code Review',
  prompt: `A developer needs the five highest-paid employees.

Query A

SELECT *
FROM employees
LIMIT 5;

Query B

SELECT *
FROM employees
ORDER BY salary DESC
LIMIT 5;

Which statement is TRUE?`,
  options: [
    'Both queries always return the same result.',
    'Query A is faster and always returns the top 5 salaries.',
    'Only Query B guarantees the highest-paid employees.',
    'LIMIT automatically sorts rows before returning them.'
  ],
  correctAnswer: 'Only Query B guarantees the highest-paid employees.',
  explanation: 'LIMIT simply restricts the number of rows returned. Without ORDER BY, SQL does not guarantee row order. Query A may return any five rows depending on the execution plan, storage engine, or indexes.'
},

{
  id: 'mysql-8',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Leaderboard',
  prompt: `The company displays employee rankings based on sales.

Sales

Employee | Sales
----------------
Alice    | 100
Bob      | 100
Charlie  | 90
David    | 80

The ranking should appear as:

1
1
3
4

Which window function should be used?`,
  options: [
    'ROW_NUMBER()',
    'RANK()',
    'DENSE_RANK()',
    'COUNT()'
  ],
  correctAnswer: 'RANK()',
  explanation: 'ROW_NUMBER() never produces duplicate ranks. DENSE_RANK() would produce 1,1,2,3 because it does not leave gaps. RANK() assigns the same rank to ties and skips the next rank, producing 1,1,3,4.'
},

{
  id: 'mysql-9',
  type: 'code-output',
  difficulty: 'hard',
  category: 'Transaction Management',
  prompt: `A banking application executes:

BEGIN;

UPDATE accounts
SET balance = balance - 1000
WHERE id = 1;

COMMIT;

ROLLBACK;

What is the final result?`,
  options: [
    'The balance returns to its original value.',
    'Only the last statement is rolled back.',
    'The deducted amount remains because COMMIT permanently saves the transaction.',
    'ROLLBACK throws a syntax error after COMMIT.'
  ],
  correctAnswer: 'The deducted amount remains because COMMIT permanently saves the transaction.',
  explanation: 'COMMIT makes all changes in the current transaction permanent. After COMMIT, there is no active transaction to roll back, so the later ROLLBACK has no effect on the committed data.'
},

{
  id: 'mysql-10',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance & Query Logic',
  prompt: `The HR team wants employees whose salary is greater than the average salary of their own department.

Which technique is the MOST appropriate?`,
  options: [
    'A simple GROUP BY query',
    'A correlated subquery',
    'A CROSS JOIN',
    'DISTINCT with HAVING'
  ],
  correctAnswer: 'A correlated subquery',
  explanation: 'The average salary must be calculated separately for each employees department. A correlated subquery references the outer query (for example, WHERE e.salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id)), allowing each employee to be compared against the average of their own department.'
},{
  id: 'mysql-11',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Reporting Dashboard',
  prompt: `A dashboard should show the number of unique cities where customers live.

customers

id | city
---------
1  | Hyderabad
2  | Hyderabad
3  | NULL
4  | NULL
5  | Chennai

A developer executes:

SELECT COUNT(DISTINCT city)
FROM customers;

What is returned?`,
  options: [
    '2',
    '3',
    '4',
    '5'
  ],
  correctAnswer: '2',
  explanation: 'DISTINCT removes duplicate non-NULL values, but COUNT(column) ignores NULL values entirely. DISTINCT city produces {Hyderabad, Chennai, NULL}, but COUNT(DISTINCT city) counts only Hyderabad and Chennai, returning 2.'
},

{
  id: 'mysql-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Bug',
  prompt: `A reporting query suddenly starts returning duplicate customers.

Developer A writes:

SELECT DISTINCT c.id
FROM customers c
INNER JOIN orders o
ON c.id = o.customer_id;

Developer B removes DISTINCT because customer IDs are already unique in the customers table.

What is MOST likely to happen?`,
  options: [
    'Nothing changes because customer IDs are unique.',
    'Customers with multiple orders may appear multiple times.',
    'The query throws a duplicate key error.',
    'INNER JOIN automatically removes duplicates.'
  ],
  correctAnswer: 'Customers with multiple orders may appear multiple times.',
  explanation: 'The uniqueness of customer IDs exists only in the customers table. After an INNER JOIN, one customer row is repeated for every matching order. DISTINCT removes these duplicate result rows. Removing it can cause customers with multiple orders to appear multiple times.'
},

{
  id: 'mysql-13',
  type: 'multi',
  difficulty: 'expert',
  category: 'Execution Order',
  prompt: `The finance team wants the top-selling department.

sales

department | amount
-------------------
IT         | 100
IT         | 200
HR         | 500
Sales      | 300
Sales      | 200

SELECT department,
SUM(amount) AS total
FROM sales
GROUP BY department
ORDER BY total DESC
LIMIT 1;

Which departments could legally be returned? (Select all that apply)`,
  options: [
    'IT',
    'HR',
    'Sales',
    'The query throws an error because ORDER BY uses an alias.'
  ],
  correctAnswer: ['HR', 'Sales'],
  explanation: 'The logical order is GROUP BY → SUM() → ORDER BY → LIMIT. Totals become IT=300, HR=500, Sales=500. Because HR and Sales tie, LIMIT 1 returns one of them based on MySQL\'s ordering of ties, which is not guaranteed. However, with the data shown and no secondary ORDER BY, either HR or Sales could legally be returned. This query is nondeterministic. A secondary ORDER BY (for example, department) should be added.',
  optionNotes: {
    IT: 'IT totals 300, below the two departments tied at 500.',
    HR: 'HR is tied for the highest total, so HR is a valid result; the prompt also lists Sales as another possible tied winner.',
    Sales: 'Sales is tied with HR at 500. With no tie-breaker either can be returned, so this is one valid outcome.',
    'The query throws an error because ORDER BY uses an alias.': 'MySQL allows the SELECT alias total in ORDER BY. The issue is nondeterministic tie ordering, not an error.'
  },
  commonMistake: 'Assuming LIMIT 1 makes tied rows deterministic when ORDER BY has no tie-breaker.',
  takeaway: 'Use a secondary ORDER BY key when a LIMIT result must be deterministic.',
  visual: {
    type: 'pipeline',
    title: 'Follow the grouped rows to LIMIT',
    description: 'The query computes totals before sorting and limiting them.',
    active: 'LIMIT',
    steps: [
      { label: 'FROM', detail: 'Read sales rows' },
      { label: 'GROUP BY', detail: 'One row per department' },
      { label: 'SUM', detail: 'IT 300 · HR 500 · Sales 500' },
      { label: 'ORDER BY', detail: 'Largest total first' },
      { label: 'LIMIT', detail: 'Take one tied top row' }
    ],
    note: 'Add department as a secondary sort key to choose a stable winner.'
  },
},

{
id: 'mysql-14',
type: 'mcq',
difficulty: 'expert',
category: 'Code Review',
prompt: `A developer wants to retrieve the department with the highest total sales amount.

The query is:

SELECT department,
SUM(amount) AS total
FROM sales
GROUP BY department
ORDER BY total DESC
LIMIT 1;

During code review, a senior developer points out that the query may not always return a predictable result.

Assume that two or more departments have the same highest total sales amount.

What is the main issue with this query?`,
options: [
'LIMIT cannot be used with GROUP BY.',
'SUM() cannot be used with ORDER BY.',
'The query does not define a tie-breaker when multiple departments have the same highest total.',
'Column aliases cannot be used in ORDER BY.'
],
correctAnswer: 'The query does not define a tie-breaker when multiple departments have the same highest total.',
explanation: 'ORDER BY total DESC sorts departments by their total sales in descending order. However, if multiple departments have the same highest total, their relative order is not guaranteed. LIMIT 1 returns only one row, so the selected department may be unpredictable. To make the result deterministic, add a secondary sort condition, such as ORDER BY total DESC, department ASC.'
},

{
  id: 'mysql-15',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Performance Optimization',
  prompt: `An index exists on (last_name, first_name).

Which query is MOST likely to use the composite index efficiently?`,
  options: [
    "WHERE first_name = 'John'",
    "WHERE LOWER(last_name) = 'Smith'",
    "WHERE last_name = 'Smith' AND first_name = 'John'",
    "WHERE first_name = 'John' AND last_name LIKE '%Smith'"
  ],
  correctAnswer: "WHERE last_name = 'Smith' AND first_name = 'John'",
  explanation: 'Composite indexes follow the leftmost-prefix rule. MySQL can efficiently use the index when the leading column (last_name) is used. Wrapping the column in LOWER() makes the predicate non-sargable, and a leading wildcard (%Smith) also prevents efficient index usage.'
},
{
  id: 'mysql-16',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Feature Request',
  prompt: `The HR team wants to list employees who earn MORE than their department's average salary.

employees

id | name    | department | salary
----------------------------------
1  | Alice   | IT         | 50000
2  | Bob     | IT         | 70000
3  | Carol   | HR         | 40000
4  | David   | HR         | 60000

Query:

SELECT e1.name
FROM employees e1
WHERE salary >
(
    SELECT AVG(salary)
    FROM employees e2
    WHERE e1.department = e2.department
);

Which employees are returned?`,
  options: [
    'Alice and Carol',
    'Bob and David',
    'Bob only',
    'David only'
  ],
  correctAnswer: 'Bob and David',
  explanation: 'The subquery is correlated because it references e1.department from the outer query. IT average is (50000 + 70000)/2 = 60000, so only Bob qualifies. HR average is (40000 + 60000)/2 = 50000, so only David qualifies.',
  optionNotes: {
    'Alice and Carol': 'Both salaries are below their own department averages.',
    'Bob and David': 'Correct: Bob is above IT average 60,000, and David is above HR average 50,000.',
    'Bob only': 'Bob qualifies, but David also earns more than the HR average.',
    'David only': 'David qualifies, but Bob also earns more than the IT average.'
  },
  commonMistake: 'Comparing every employee to one overall average instead of the average for that employee’s department.',
  takeaway: 'A correlated subquery can calculate a different comparison value for each outer row.',
  visual: {
    type: 'stepper',
    title: 'Re-run the department average for each employee',
    description: 'The outer employee supplies a department to the inner AVG query. Compare that department average with the employee salary.',
    steps: [
      { label: 'Alice · IT', context: 'The inner query selects IT salaries.', calculation: 'IT average = (50,000 + 70,000) / 2 = 60,000 · 50,000 > 60,000 is false', outcome: 'Filtered out', keep: false },
      { label: 'Bob · IT', context: 'The inner query runs for Bob’s IT department.', calculation: 'IT average = 60,000 · 70,000 > 60,000 is true', outcome: 'Kept', keep: true },
      { label: 'Carol · HR', context: 'The department changes, so the inner AVG is recalculated for HR.', calculation: 'HR average = (40,000 + 60,000) / 2 = 50,000 · 40,000 > 50,000 is false', outcome: 'Filtered out', keep: false },
      { label: 'David · HR', context: 'The inner query uses the same HR group for David.', calculation: 'HR average = 50,000 · 60,000 > 50,000 is true', outcome: 'Kept', keep: true }
    ]
  },
  tryIt: {
    label: 'Try the correlated query in SQL Visual Lab',
    query: `SELECT e1.name, e1.salary
FROM employees AS e1
WHERE e1.salary > (
  SELECT AVG(e2.salary)
  FROM employees AS e2
  WHERE e2.department_id = e1.department_id
);`,
    description: 'The lab opens with its Company sample schema and this query prefilled.'
  }
},

{
  id: 'mysql-17',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Code Review',
  prompt: `The analytics team wants unique customer countries.

customers

id | country
-------------
1  | India
2  | India
3  | USA
4  | NULL
5  | NULL

Query:

SELECT DISTINCT country
FROM customers;

How many rows are returned?`,
  options: [
    '2',
    '3',
    '4',
    '5'
  ],
  correctAnswer: '3',
  explanation: 'DISTINCT removes duplicate values, including duplicate NULLs. The result set becomes {India, USA, NULL}, producing three rows. This differs from COUNT(DISTINCT country), which ignores NULL completely.'
},

{
  id: 'mysql-18',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Bug',
  prompt: `A developer writes:

SELECT *
FROM users
WHERE email LIKE '%@gmail.com';

An index exists on email.

The query is slow.

Which explanation is MOST accurate?`,
  options: [
    'LIKE never uses indexes.',
    'The leading wildcard prevents efficient index usage.',
    'Indexes work only on numeric columns.',
    'The query needs GROUP BY.'
  ],
  correctAnswer: 'The leading wildcard prevents efficient index usage.',
  explanation: 'A B-tree index can efficiently search prefixes, such as LIKE \'john%\'. When the pattern starts with %, MySQL cannot perform an efficient index seek and usually falls back to scanning rows.'
},

{
  id: 'mysql-19',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Reporting Dashboard',
  prompt: `The company wants the top three salaries.

employees

name | salary
-------------
A    | 100
B    | 90
C    | 90
D    | 80

Query:

SELECT
name,
salary,
ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn
FROM employees;

Which employee receives ROW_NUMBER() = 3?`,
  options: [
    'B',
    'C',
    'D',
    'Both B and C'
  ],
  correctAnswer: 'C',
  explanation: 'ROW_NUMBER() always assigns unique sequential numbers, even when values tie. The ordering becomes A(1), B(2), C(3), D(4). If the requirement was to assign equal ranks to equal salaries, RANK() or DENSE_RANK() should be used instead.'
},

{
  id: 'mysql-20',
  type: 'multi',
  difficulty: 'expert',
  category: 'Database Design',
  prompt: `A database has these constraints:

• PRIMARY KEY(id)
• FOREIGN KEY(department_id) REFERENCES departments(id)

Which operations will FAIL? (Select all that apply)`,
  options: [
    'Insert an employee with an existing PRIMARY KEY.',
    'Insert an employee with department_id that does not exist.',
    'Insert an employee with a new PRIMARY KEY and a valid department_id.',
    'Update an employee name.'
  ],
  correctAnswer: [
    'Insert an employee with an existing PRIMARY KEY.',
    'Insert an employee with department_id that does not exist.'
  ],
  explanation: 'PRIMARY KEY values must be unique, so duplicate IDs are rejected. FOREIGN KEY values must reference an existing parent row, so an invalid department_id also fails. A new unique ID with a valid department_id is allowed, and updating a non-key column such as name does not violate either constraint.'
},
{
  id: 'mysql-21',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Feature Request',
  prompt: `The HR team wants to list employees who earn MORE than their department's average salary.

employees

id | name    | department | salary
----------------------------------
1  | Alice   | IT         | 50000
2  | Bob     | IT         | 70000
3  | Carol   | HR         | 40000
4  | David   | HR         | 60000

Query:

SELECT e1.name
FROM employees e1
WHERE salary >
(
    SELECT AVG(salary)
    FROM employees e2
    WHERE e1.department = e2.department
);

Which employees are returned?`,
  options: [
    'Alice and Carol',
    'Bob and David',
    'Bob only',
    'David only'
  ],
  correctAnswer: 'Bob and David',
  explanation: 'The subquery is correlated because it references e1.department from the outer query. IT average is (50000 + 70000)/2 = 60000, so only Bob qualifies. HR average is (40000 + 60000)/2 = 50000, so only David qualifies.',
  optionNotes: {
    'Alice and Carol': 'Both salaries are below their own department averages.',
    'Bob and David': 'Correct: Bob is above IT average 60,000, and David is above HR average 50,000.',
    'Bob only': 'Bob qualifies, but David also earns more than the HR average.',
    'David only': 'David qualifies, but Bob also earns more than the IT average.'
  },
  commonMistake: 'Comparing every employee to one overall average instead of the average for that employee’s department.',
  takeaway: 'A correlated subquery can calculate a different comparison value for each outer row.',
  visual: {
    type: 'stepper',
    title: 'Re-run the department average for each employee',
    description: 'The outer employee supplies a department to the inner AVG query. Compare that department average with the employee salary.',
    steps: [
      { label: 'Alice · IT', context: 'The inner query selects IT salaries.', calculation: 'IT average = (50,000 + 70,000) / 2 = 60,000 · 50,000 > 60,000 is false', outcome: 'Filtered out', keep: false },
      { label: 'Bob · IT', context: 'The inner query runs for Bob’s IT department.', calculation: 'IT average = 60,000 · 70,000 > 60,000 is true', outcome: 'Kept', keep: true },
      { label: 'Carol · HR', context: 'The department changes, so the inner AVG is recalculated for HR.', calculation: 'HR average = (40,000 + 60,000) / 2 = 50,000 · 40,000 > 50,000 is false', outcome: 'Filtered out', keep: false },
      { label: 'David · HR', context: 'The inner query uses the same HR group for David.', calculation: 'HR average = 50,000 · 60,000 > 50,000 is true', outcome: 'Kept', keep: true }
    ]
  }
},

{
  id: 'mysql-22',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Code Review',
  prompt: `The analytics team wants unique customer countries.

customers

id | country
-------------
1  | India
2  | India
3  | USA
4  | NULL
5  | NULL

Query:

SELECT DISTINCT country
FROM customers;

How many rows are returned?`,
  options: [
    '2',
    '3',
    '4',
    '5'
  ],
  correctAnswer: '3',
  explanation: 'DISTINCT removes duplicate values, including duplicate NULLs. The result set becomes {India, USA, NULL}, producing three rows. This differs from COUNT(DISTINCT country), which ignores NULL completely.'
},

{
  id: 'mysql-23',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Bug',
  prompt: `A developer writes:

SELECT *
FROM users
WHERE email LIKE '%@gmail.com';

An index exists on email.

The query is slow.

Which explanation is MOST accurate?`,
  options: [
    'LIKE never uses indexes.',
    'The leading wildcard prevents efficient index usage.',
    'Indexes work only on numeric columns.',
    'The query needs GROUP BY.'
  ],
  correctAnswer: 'The leading wildcard prevents efficient index usage.',
  explanation: 'A B-tree index can efficiently search prefixes, such as LIKE \'john%\'. When the pattern starts with %, MySQL cannot perform an efficient index seek and usually falls back to scanning rows.'
},

{
  id: 'mysql-24',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Reporting Dashboard',
  prompt: `The company wants the top three salaries.

employees

name | salary
-------------
A    | 100
B    | 90
C    | 90
D    | 80

Query:

SELECT
name,
salary,
ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn
FROM employees;

Which employee receives ROW_NUMBER() = 3?`,
  options: [
    'B',
    'C',
    'D',
    'Both B and C'
  ],
  correctAnswer: 'C',
  explanation: 'ROW_NUMBER() always assigns unique sequential numbers, even when values tie. The ordering becomes A(1), B(2), C(3), D(4). If the requirement was to assign equal ranks to equal salaries, RANK() or DENSE_RANK() should be used instead.'
},

{
  id: 'mysql-25',
  type: 'multi',
  difficulty: 'expert',
  category: 'Database Design',
  prompt: `A database has these constraints:

• PRIMARY KEY(id)
• FOREIGN KEY(department_id) REFERENCES departments(id)

Which operations will FAIL? (Select all that apply)`,
  options: [
    'Insert an employee with an existing PRIMARY KEY.',
    'Insert an employee with department_id that does not exist.',
    'Insert an employee with a new PRIMARY KEY and a valid department_id.',
    'Update an employee name.'
  ],
  correctAnswer: [
    'Insert an employee with an existing PRIMARY KEY.',
    'Insert an employee with department_id that does not exist.'
  ],
  explanation: 'PRIMARY KEY values must be unique, so duplicate IDs are rejected. FOREIGN KEY values must reference an existing parent row, so an invalid department_id also fails. A new unique ID with a valid department_id is allowed, and updating a non-key column such as name does not violate either constraint.'
},
{
  id: 'mysql-26',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Bug',
  prompt: `A developer wants to list all employees, including those who are not assigned to any department.

Query A

SELECT e.name, d.name
FROM employees e
LEFT JOIN departments d
ON e.department_id = d.id
WHERE d.name = 'IT';

Query B

SELECT e.name, d.name
FROM employees e
LEFT JOIN departments d
ON e.department_id = d.id
AND d.name = 'IT';

Which statement is TRUE?`,
  options: [
    'Both queries always return the same result.',
    'Query A behaves like an INNER JOIN for IT employees.',
    'Query B behaves like an INNER JOIN for IT employees.',
    'Neither query returns employees without departments.'
  ],
  correctAnswer: 'Query A behaves like an INNER JOIN for IT employees.',
  explanation: 'This is a very common production bug. In Query A, the WHERE clause filters out rows where d.name is NULL, effectively removing employees without matching departments and making the LEFT JOIN behave like an INNER JOIN. Query B places the condition in the ON clause, preserving unmatched employees while only matching IT departments.'
},

{
  id: 'mysql-27',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Window Functions',
  prompt: `Sales Leaderboard

employee | sales
----------------
Alice    | 500
Bob      | 400
Carol    | 400
David    | 300

SELECT
employee,
RANK() OVER(ORDER BY sales DESC) AS rnk,
DENSE_RANK() OVER(ORDER BY sales DESC) AS dense_rnk
FROM sales;

Which row is correct?`,
  options: [
    'Carol → RANK=2, DENSE_RANK=2',
    'David → RANK=3, DENSE_RANK=3',
    'David → RANK=4, DENSE_RANK=3',
    'Carol → RANK=3, DENSE_RANK=2'
  ],
  correctAnswer: 'David → RANK=4, DENSE_RANK=3',
  explanation: 'RANK() leaves gaps after ties. Alice receives rank 1, Bob and Carol share rank 2, so David receives rank 4. DENSE_RANK() does not leave gaps, producing 1,2,2,3.'
},

{
  id: 'mysql-28',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Execution Order',
  prompt: `A developer writes:

SELECT DISTINCT department
FROM employees
ORDER BY salary DESC;

Which statement is MOST accurate?`,
  options: [
    'The query always returns departments ordered by the highest salary.',
    'The query is logically incorrect because salary is not part of the DISTINCT result.',
    'DISTINCT executes after ORDER BY.',
    'ORDER BY is ignored when DISTINCT is used.'
  ],
  correctAnswer: 'The query is logically incorrect because salary is not part of the DISTINCT result.',
  explanation: 'DISTINCT removes duplicate department values, leaving only one row per department. Since multiple salaries may exist for the same department, ordering those distinct rows by salary is ambiguous. In MySQL, this may be rejected depending on SQL mode (such as ONLY_FULL_GROUP_BY) or produce non-intuitive results. The intent should instead be expressed with GROUP BY and an aggregate like MAX(salary).'
},

{
  id: 'mysql-29',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance Optimization',
  prompt: `A table contains 50 million orders.

An index exists on order_date.

Which query is expected to perform the BEST?`,
  options: [
    "WHERE YEAR(order_date)=2026",
    "WHERE MONTH(order_date)=6",
    "WHERE DATE(order_date)='2026-06-15'",
    "WHERE order_date >= '2026-06-15' AND order_date < '2026-06-16'"
  ],
  correctAnswer: "WHERE order_date >= '2026-06-15' AND order_date < '2026-06-16'",
  explanation: 'Wrapping indexed columns inside YEAR(), MONTH(), or DATE() makes the predicate non-sargable, preventing efficient index range scans. Using a range condition preserves the index and is the preferred approach for large tables.'
},

{
  id: 'mysql-30',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Senior Backend Challenge',
  prompt: `A product manager reports that the dashboard shows 120 orders but only 80 unique customers.

orders

order_id | customer_id
----------------------
1        | 1
2        | 1
3        | 2
4        | 3
5        | 3

Which query correctly returns the number of unique customers who placed orders?`,
  options: [
    "SELECT COUNT(*) FROM orders;",
    "SELECT COUNT(customer_id) FROM orders;",
    "SELECT COUNT(DISTINCT customer_id) FROM orders;",
    "SELECT DISTINCT COUNT(customer_id) FROM orders;"
  ],
  correctAnswer: "SELECT COUNT(DISTINCT customer_id) FROM orders;",
  explanation: "COUNT(*) counts every row (every order). COUNT(customer_id) also counts every non-NULL customer_id, which is still every order in this example. COUNT(DISTINCT customer_id) counts each customer only once, producing the number of unique customers who placed orders. DISTINCT applies to the customer_id values before the COUNT is calculated."
},

{
  id: 'mysql-31',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'SQL Modes',
  prompt: `A production server has ONLY_FULL_GROUP_BY enabled. A developer runs:

SELECT department, employee_name, MAX(salary)
FROM employees
GROUP BY department;

There are several employees in each department. What is the most accurate result?`,
  options: [
    'It always returns the employee who has the maximum salary in each department.',
    'It returns an arbitrary employee name beside the department maximum.',
    'It is rejected because employee_name is neither aggregated nor grouped.',
    'It is rejected because MAX() cannot be used with GROUP BY.'
  ],
  correctAnswer: 'It is rejected because employee_name is neither aggregated nor grouped.',
  explanation: 'With ONLY_FULL_GROUP_BY enabled, every selected column must be aggregated, included in GROUP BY, or proven functionally dependent on the grouped columns. employee_name is not determined by department when several employees belong to a department, so MySQL rejects the query instead of silently choosing an arbitrary name. To return the employee attached to the maximum salary, use a window function or join the grouped result back to employees.'
},

{
  id: 'mysql-32',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Collations',
  prompt: `A users table has this column:

email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci UNIQUE

The table already contains:

Alice@example.com

What happens when the application inserts alice@example.com?`,
  options: [
    'A second row is inserted because the strings have different letter casing.',
    'The insert fails because this collation compares the values case-insensitively.',
    'The insert succeeds but MySQL silently changes it to uppercase.',
    'The insert fails only if the column uses a binary data type.'
  ],
  correctAnswer: 'The insert fails because this collation compares the values case-insensitively.',
  explanation: 'The ai suffix means accent-insensitive, and this utf8mb4 collation is also case-insensitive. The UNIQUE constraint therefore treats Alice@example.com and alice@example.com as the same key. A binary or case-sensitive collation would produce different uniqueness behavior, so collation is part of the data model, not just a display setting.'
},

{
  id: 'mysql-33',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Index Coverage',
  prompt: `An orders table has this index:

INDEX idx_status_created (status, created_at)

Which query can most likely be answered entirely from the index without looking up the full table row?`,
  options: [
    "SELECT created_at FROM orders WHERE status = 'paid' ORDER BY created_at;",
    "SELECT order_id FROM orders WHERE status = 'paid' ORDER BY created_at;",
    "SELECT customer_id FROM orders WHERE status = 'paid' ORDER BY created_at;",
    "SELECT * FROM orders WHERE status = 'paid' ORDER BY created_at;"
  ],
  correctAnswer: "SELECT created_at FROM orders WHERE status = 'paid' ORDER BY created_at;",
  explanation: 'The index stores status and created_at, so it can filter by the leading status column, read rows in created_at order, and return created_at without fetching the base table. This is called a covering-index access. The other queries request columns that are not present in the index, so MySQL generally needs additional row lookups.'
},

{
  id: 'mysql-34',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Numeric Precision',
  prompt: `A payments table stores amount as DECIMAL(10, 2). It contains two rows:

amount
------
0.10
0.20

What should this expression return?

SELECT SUM(amount) = 0.30 FROM payments;`,
  options: [
    '1, because DECIMAL arithmetic preserves the exact declared scale.',
    '0, because every decimal value is converted to FLOAT during SUM().',
    'NULL, because SUM() cannot aggregate decimal columns.',
    'The result changes between executions because decimal arithmetic is approximate.'
  ],
  correctAnswer: '1, because DECIMAL arithmetic preserves the exact declared scale.',
  explanation: 'DECIMAL is an exact fixed-point type, which is appropriate for money. SUM(amount) calculates an exact decimal result of 0.30, so the comparison is true. FLOAT and DOUBLE use binary floating-point representation and can introduce small rounding differences that make direct equality comparisons unsafe for financial values.'
},

{
  id: 'mysql-35',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Auto Increment',
  prompt: `An InnoDB table has AUTO_INCREMENT id values. The next generated id is 101.

Transaction A inserts a row and receives id 101, but then rolls back. No other inserts occur. Transaction B inserts the next row.

Which id should the second row normally receive?`,
  options: [
    '100, because the rolled-back insert releases its id.',
    '101, because InnoDB reuses every id from a rolled-back transaction.',
    '102, because generated auto-increment values are not rolled back.',
    'NULL, because the previous transaction did not commit.'
  ],
  correctAnswer: '102, because generated auto-increment values are not rolled back.',
  explanation: 'Auto-increment allocation is intentionally not transactional. Once InnoDB hands out 101, a rollback does not return that number to the sequence, so the next insert normally receives 102. Gaps are therefore expected after rollbacks, failed inserts, or concurrent allocation; an auto-increment column should not be treated as a gap-free business sequence.'
},

{
  id: 'mysql-36',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Deadlocks',
  prompt: `Two transactions update the same two account rows:

Transaction A: UPDATE accounts SET balance = balance - 10 WHERE id = 1;
Transaction B: UPDATE accounts SET balance = balance - 20 WHERE id = 2;
Transaction A: UPDATE accounts SET balance = balance + 10 WHERE id = 2;
Transaction B: UPDATE accounts SET balance = balance + 20 WHERE id = 1;

What will InnoDB most likely do?`,
  options: [
    'Wait forever because neither transaction can release its first lock.',
    'Automatically commit both transactions after resolving the lock cycle.',
    'Detect the deadlock and roll back one transaction so the other can proceed.',
    'Ignore the second update in each transaction and commit both partial changes.'
  ],
  correctAnswer: 'Detect the deadlock and roll back one transaction so the other can proceed.',
  explanation: 'A has locked account 1 and waits for account 2, while B has locked account 2 and waits for account 1. InnoDB detects this cycle and chooses a victim transaction to roll back, returning a deadlock error to its client. Applications should retry the complete transaction, and code should acquire shared locks in a consistent order to reduce deadlocks.',
  optionNotes: {
    'Wait forever because neither transaction can release its first lock.': 'InnoDB detects deadlock cycles instead of waiting forever.',
    'Automatically commit both transactions after resolving the lock cycle.': 'The database rolls back a victim; it does not commit both transactions.',
    'Detect the deadlock and roll back one transaction so the other can proceed.': 'Correct: the victim receives an error and the other transaction can continue.',
    'Ignore the second update in each transaction and commit both partial changes.': 'InnoDB does not silently skip conflicting statements and commit partial work as the deadlock resolution.'
  },
  commonMistake: 'Treating a deadlock as a permanent hang instead of an error that applications should handle and retry.',
  takeaway: 'Deadlocks form a wait cycle; InnoDB aborts one transaction so the other can proceed.',
  visual: {
    type: 'timeline',
    title: 'Two sessions form a lock cycle',
    description: 'Each transaction holds one row lock and requests the row held by the other transaction.',
    lanes: [
      { name: 'Transaction A', events: [{ time: '1', label: 'Locks account 1' }, { time: '3', label: 'Requests account 2', status: 'wait' }] },
      { name: 'Transaction B', events: [{ time: '2', label: 'Locks account 2' }, { time: '4', label: 'Requests account 1 · cycle detected', status: 'deadlock' }] }
    ],
    note: 'InnoDB rolls back one victim. Retry the entire transaction and acquire locks in a consistent order where possible.'
  }
},

{
  id: 'mysql-37',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Locking Reads',
  prompt: `A worker claims the next pending job using:

SELECT id
FROM jobs
WHERE status = 'pending'
ORDER BY id
LIMIT 1
FOR UPDATE;

What is the key requirement for this lock to protect the following UPDATE?`,
  options: [
    'The SELECT and UPDATE must run in the same open transaction.',
    'The SELECT must be executed outside a transaction so locks become global.',
    'The query must use UNION so every worker sees the same job.',
    'The lock remains until the MySQL server restarts, even after COMMIT.'
  ],
  correctAnswer: 'The SELECT and UPDATE must run in the same open transaction.',
  explanation: 'FOR UPDATE takes row locks for a locking read, but those locks belong to the current transaction. The worker must select the job, update its status, and commit as one transaction; otherwise another worker can claim the same job after the lock is released. With autocommit enabled, the lock may be released immediately after the SELECT statement completes.'
},

{
  id: 'mysql-38',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Generated Columns',
  prompt: `A table stores user profiles as JSON and defines:

email VARCHAR(255)
  GENERATED ALWAYS AS (JSON_UNQUOTE(profile->'$.email')) STORED,
INDEX idx_email (email)

Which query directly uses the indexed generated column?`,
  options: [
    "SELECT * FROM users WHERE email = 'a@example.com';",
    "SELECT * FROM users WHERE JSON_EXTRACT(profile, '$.email') = 'a@example.com';",
    "SELECT * FROM users WHERE LOWER(profile) LIKE '%a@example.com%';",
    "SELECT * FROM users WHERE profile->'$.email' IS NOT NULL;"
  ],
  correctAnswer: "SELECT * FROM users WHERE email = 'a@example.com';",
  explanation: 'The generated column materializes the extracted email and has its own index, so filtering directly on email gives the optimizer a straightforward indexed predicate. Repeating the JSON expression may or may not be matched to the generated-column index depending on expression equivalence and MySQL version, while broad functions and leading wildcards are not good substitutes for the indexed column.'
},

{
  id: 'mysql-39',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Date and Time',
  prompt: `A table has:

created_ts TIMESTAMP
created_dt DATETIME

The application inserts 2026-01-01 12:00:00 while its session time zone is UTC. Later, a user reads the row in an Asia/Kolkata session.

Which behavior is expected?`,
  options: [
    'Both values display 2026-01-01 17:30:00 because all date types convert time zones.',
    'Both values display 2026-01-01 12:00:00 because MySQL never converts stored dates.',
    'TIMESTAMP can display 17:30:00 after conversion, while DATETIME remains 12:00:00.',
    'TIMESTAMP becomes NULL because it cannot store values from UTC sessions.'
  ],
  correctAnswer: 'TIMESTAMP can display 17:30:00 after conversion, while DATETIME remains 12:00:00.',
  explanation: 'TIMESTAMP values are converted from the session time zone to UTC when stored and back to the current session time zone when read. UTC noon is 17:30 in Asia/Kolkata. DATETIME stores the calendar fields without time-zone conversion, so it remains 12:00:00. Choose based on whether the value represents an instant or a wall-clock value.'
},

{
  id: 'mysql-40',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Write Semantics',
  prompt: `A users table has an existing row with id = 7 and a foreign key from user_sessions.user_id to users.id.

The application runs:

REPLACE INTO users (id, email, name)
VALUES (7, 'new@example.com', 'Nia');

Why can REPLACE be dangerous here?`,
  options: [
    'It updates only the changed columns and preserves the original row identity.',
    'It deletes the conflicting row and inserts a new row, which can trigger foreign-key actions and delete dependent data.',
    'It behaves exactly like INSERT IGNORE and leaves the existing row untouched.',
    'It can only replace rows when the table has no foreign keys.'
  ],
  correctAnswer: 'It deletes the conflicting row and inserts a new row, which can trigger foreign-key actions and delete dependent data.',
  explanation: 'REPLACE is not a normal UPDATE. When a duplicate primary or unique key is found, MySQL removes the existing row and then inserts the new row. That can fire DELETE and INSERT triggers, change generated values, and activate ON DELETE behavior on child rows. Use INSERT ... ON DUPLICATE KEY UPDATE when the intended behavior is to update the existing record.'
},

{
  id: 'mysql-41',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Query Logic',
  prompt: `A customer can place many orders. The data contains:

customers: 1 = Alice, 2 = Bob
orders: customer_id 1, customer_id 1

What does this query return?

SELECT c.id
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.id
);`,
  options: [
    'One row containing customer 1.',
    'Two rows containing customer 1 twice.',
    'One row for every customer, including customer 2.',
    'No rows, because EXISTS cannot contain SELECT 1.'
  ],
  correctAnswer: 'One row containing customer 1.',
  explanation: 'EXISTS is a boolean test. It asks whether at least one matching order exists for each customer and does not multiply the outer row for additional matches. Customer 1 passes once and customer 2 fails. An ordinary join would produce two rows for customer 1 unless the result were deduplicated.'
},

{
  id: 'mysql-42',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Performance Optimization',
  prompt: `A large orders table has this composite index:

INDEX idx_status_created (status, created_at)

The most common query is:

SELECT id, created_at
FROM orders
WHERE status = 'paid'
ORDER BY created_at
LIMIT 20;

Why is this index a strong match for the query?`,
  options: [
    'It filters by the equality column first, then reads matching rows in created_at order.',
    'It ignores status and sorts the entire table because ORDER BY is always separate from indexes.',
    'It works only because created_at is the first column in the index.',
    'It guarantees no table access even though id is not stored in the index.'
  ],
  correctAnswer: 'It filters by the equality column first, then reads matching rows in created_at order.',
  explanation: 'The leading status column narrows the index range to paid orders. Within that range, created_at is already ordered, so MySQL can avoid a large filesort and stop after finding 20 rows. The index may still need a table lookup for id unless id is included in the index or is available through the storage engine primary-key suffix.'
},

{
  id: 'mysql-43',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Transaction Management',
  prompt: `A transaction runs:

START TRANSACTION;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
SAVEPOINT before_fee;
UPDATE accounts SET balance = balance - 10 WHERE id = 1;
ROLLBACK TO before_fee;
COMMIT;

Which change remains after COMMIT?`,
  options: [
    'Both deductions remain because SAVEPOINT cannot undo an UPDATE.',
    'Only the 50 deduction remains because the second update was rolled back to the savepoint.',
    'Neither deduction remains because ROLLBACK TO ends the transaction.',
    'The transaction fails because SAVEPOINT can only be used after INSERT.'
  ],
  correctAnswer: 'Only the 50 deduction remains because the second update was rolled back to the savepoint.',
  explanation: 'ROLLBACK TO before_fee undoes work performed after the savepoint but keeps the transaction open. The first 50 deduction happened before the savepoint, so it remains and is committed. This differs from a full ROLLBACK, which would undo all uncommitted changes.'
},

{
  id: 'mysql-44',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Database Design',
  prompt: `A multi-tenant application defines:

UNIQUE (tenant_id, slug)

The table already contains (tenant_id, slug) values (1, 'dashboard') and (2, 'dashboard'). What does this constraint allow?`,
  options: [
    'It allows the same slug only once across the entire table.',
    'It allows the same slug in different tenants but rejects a duplicate pair within one tenant.',
    'It rejects both existing rows because slug values must be globally unique.',
    'It does not enforce uniqueness because composite keys can only contain primary-key columns.'
  ],
  correctAnswer: 'It allows the same slug in different tenants but rejects a duplicate pair within one tenant.',
  explanation: 'A composite unique constraint compares the complete tuple, not each column independently. (1, dashboard) and (2, dashboard) are different keys, while another (1, dashboard) would conflict. This pattern is essential when a value must be unique within an account, organization, or tenant rather than globally.'
},

{
  id: 'mysql-45',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Reporting Dashboard',
  prompt: `A report runs:

SELECT department, SUM(amount) AS total
FROM sales
GROUP BY department WITH ROLLUP;

There are three distinct department values and no NULL department values. How many rows does the result contain?`,
  options: [
    '3 rows, one for each department.',
    '4 rows, including one grand-total row with department set to NULL.',
    '6 rows, because ROLLUP creates a subtotal for every pair of departments.',
    'The query fails because ROLLUP cannot be combined with SUM().' 
  ],
  correctAnswer: '4 rows, including one grand-total row with department set to NULL.',
  explanation: 'WITH ROLLUP adds a summary row after the grouped rows. With one grouping column, that extra row is the grand total, represented by NULL in the department column. If real department values can also be NULL, the report should use GROUPING() to distinguish a real NULL from the generated total row.'
},

{
  id: 'mysql-46',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Window Functions',
  prompt: `monthly_revenue contains:

month | revenue
--------------
Jan   | 100
Feb   | 130
Mar   | 90

What value is returned for March by this expression?

LAG(revenue) OVER (ORDER BY month)`,
  options: [
    '90, because LAG reads the current row.',
    '100, because LAG skips the immediately previous row.',
    '130, because LAG reads the previous ordered row.',
    'NULL, because window functions cannot read numeric columns.'
  ],
  correctAnswer: '130, because LAG reads the previous ordered row.',
  explanation: 'LAG reads a value from an earlier row in the window ordering without collapsing rows like GROUP BY. For March, the previous month is February, so the result is 130. The first ordered row has no previous row and therefore receives NULL unless a default value is supplied.'
},

{
  id: 'mysql-47',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Production Bug',
  prompt: `A cleanup job runs:

DELETE FROM sessions
WHERE expires_at < NOW()
LIMIT 100;

The team assumes it always deletes the 100 oldest expired sessions. What is the problem?`,
  options: [
    'LIMIT is ignored when DELETE has a WHERE clause.',
    'The statement may delete any 100 matching rows because no deletion order is defined.',
    'NOW() cannot be used in a DELETE statement.',
    'MySQL always sorts matching rows by the indexed primary key before deleting them.'
  ],
  correctAnswer: 'The statement may delete any 100 matching rows because no deletion order is defined.',
  explanation: 'A WHERE clause defines which rows qualify, but it does not define which qualifying rows are chosen first when LIMIT is used. Without ORDER BY, the optimizer may choose any 100 expired rows. If the oldest rows must be removed first, use DELETE ... ORDER BY expires_at, id LIMIT 100, and make the ordering deterministic with a tie-breaker.'
},

{
  id: 'mysql-48',
  type: 'code-output',
  difficulty: 'tricky',
  category: 'Security',
  prompt: `An application uses this prepared statement:

SELECT id FROM users WHERE email = ?;

The bound value is:

'admin@example.com' OR '1' = '1'

What does MySQL treat the bound value as?`,
  options: [
    'A SQL expression that returns every user.',
    'A literal email string that is compared as one parameter value.',
    'A syntax error because prepared statements cannot accept strings.',
    'A comment that removes the WHERE clause.'
  ],
  correctAnswer: 'A literal email string that is compared as one parameter value.',
  explanation: 'Prepared statements send the SQL structure separately from the parameter value. The quote characters and operators inside the bound value are data, not executable SQL, so the input does not turn the predicate into an always-true expression. Parameter binding prevents this class of injection, but authorization checks are still required after authentication.'
},

{
  id: 'mysql-49',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Data Integrity',
  prompt: `A table defines:

email VARCHAR(255) UNIQUE

The table already contains one row with email = NULL. What happens when a second row is inserted with email = NULL?`,
  options: [
    'The insert fails because UNIQUE permits only one empty value.',
    'The insert succeeds because NULL represents an unknown value and NULLs are not equal for UNIQUE checks.',
    'The insert succeeds only when email is an integer column.',
    'The insert changes both NULL values to empty strings before checking uniqueness.'
  ],
  correctAnswer: 'The insert succeeds because NULL represents an unknown value and NULLs are not equal for UNIQUE checks.',
  explanation: 'A UNIQUE constraint prevents duplicate non-NULL values, but MySQL allows multiple NULLs because NULL means unknown and is not equal to another NULL in normal comparison semantics. If exactly one missing value is required, enforce it with NOT NULL or use an explicit application/database rule.'
},

{
  id: 'mysql-50',
  type: 'mcq',
  difficulty: 'tricky',
  category: 'Senior Backend Challenge',
  prompt: `An API must return one row per customer with the latest order date. Which approach is the most reliable when several orders can share the same date?`,
  options: [
    'GROUP BY customer_id and select order_date without an aggregate.',
    'Use ROW_NUMBER() partitioned by customer_id and order by order_date DESC, order_id DESC.',
    'Use DISTINCT customer_id, order_date and assume the database chooses the latest row.',
    'Use LIMIT 1 after sorting all orders without partitioning by customer.'
  ],
  correctAnswer: 'Use ROW_NUMBER() partitioned by customer_id and order by order_date DESC, order_id DESC.',
  explanation: 'ROW_NUMBER() creates a separate ordered sequence for each customer. Ordering by date first chooses the latest date, and order_id provides a deterministic tie-breaker when multiple orders share that date. GROUP BY alone cannot safely return non-aggregated columns from the selected order.'
},
{
  id: 'mysql-51',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Filtering',
  prompt: 'Which condition correctly finds rows where manager_id has no assigned value?',
  options: ['manager_id = NULL', 'manager_id IS NULL', 'manager_id == NULL', 'manager_id IS EMPTY'],
  correctAnswer: 'manager_id IS NULL',
  explanation: 'NULL represents a missing or unknown value, so ordinary equality comparisons with NULL do not evaluate to true. Use IS NULL or IS NOT NULL to test for it.'
},
{
  id: 'mysql-52',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Aggregation',
  prompt: 'A query groups orders by customer_id and must show only customers with at least three orders. Where should the condition COUNT(*) >= 3 go?',
  options: ['WHERE COUNT(*) >= 3', 'HAVING COUNT(*) >= 3', 'ON COUNT(*) >= 3', 'ORDER BY COUNT(*) >= 3'],
  correctAnswer: 'HAVING COUNT(*) >= 3',
  explanation: 'WHERE filters individual rows before grouping. HAVING filters grouped results, so it is the appropriate place to test an aggregate such as COUNT(*).'
}
];
