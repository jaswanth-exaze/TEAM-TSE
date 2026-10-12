let nextTopicNumber = 0

const lesson = (id, title, category, outcome, notes, example, subtopics = []) => ({
  id,
  number: ++nextTopicNumber,
  title,
  category,
  outcome,
  notes,
  example,
  subtopics,
})

export const MYSQL_PARTS = [
  {
    id: 'part-1',
    label: 'Part 1',
    title: 'SQL foundations',
    totalTopics: 19,
    newTopics: 'All new',
    summary: 'Build tables, change data safely, query and filter rows, summarize results, and connect related tables.',
    topics: [
      lesson('insert', 'INSERT', 'DML', 'Add one or more rows and specify which values belong to which columns.',
        'List the target columns explicitly. This keeps inserts understandable and avoids depending on the table column order. INSERT can add several rows with one VALUES clause.',
        `INSERT INTO departments (name)
VALUES ('Engineering'), ('Support');`),
      lesson('update', 'UPDATE', 'DML', 'Change values in rows selected by a condition.',
        'Without WHERE, every row is updated. Before a risky change, run the same WHERE condition in a SELECT, then use a transaction when the operation needs rollback protection.',
        `UPDATE employees
SET salary = salary * 1.05
WHERE department_id = 3;`),
      lesson('delete', 'DELETE', 'DML', 'Remove selected rows while leaving the table definition in place.',
        'DELETE removes rows; it does not remove the table. Without WHERE, it removes every row. Check the target rows first and use a transaction for changes that must be reversible.',
        `DELETE FROM sessions
WHERE expires_at < '2026-01-01';`),
      lesson('create-table', 'CREATE TABLE', 'DDL', 'Define a table, its columns, data types, and constraints.',
        'Choose a type that matches the value, make required columns NOT NULL, and use constraints to protect data. In MySQL, InnoDB is the default storage engine.',
        `CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE
);`),
      lesson('alter-table', 'ALTER TABLE', 'DDL', 'Change an existing table definition.',
        'ALTER TABLE can add, change, rename, and remove columns or constraints. Schema changes affect every query and application that depends on that table, so check dependencies before applying them.',
        `ALTER TABLE employees
ADD COLUMN work_email VARCHAR(255);`),
      lesson('drop-table', 'DROP TABLE', 'DDL', 'Remove a table definition and its data.',
        'DROP TABLE is destructive and different from DELETE. Use it only when the table itself is no longer needed; confirm the database and table name before running it.',
        `DROP TABLE IF EXISTS staging_import;`),
      lesson('select-from-where', 'SELECT with FROM / WHERE', 'DQL', 'Choose columns from a table and keep only rows that match a condition.',
        'Name the columns you need instead of relying on SELECT *. WHERE filters individual rows before grouping. Give calculated expressions a readable alias.',
        `SELECT name, salary
FROM employees
WHERE department_id = 3;`),
      lesson('filtering', 'Filtering operators', 'DQL', 'Combine comparisons, ranges, sets, patterns, and Boolean conditions.',
        'Common operators include =, <>, <, <=, >, >=, BETWEEN, IN, LIKE, AND, OR, and NOT. BETWEEN includes both endpoints. Use parentheses when AND and OR are mixed.',
        `SELECT name
FROM employees
WHERE salary BETWEEN 50000 AND 80000
  AND department_id IN (2, 3);`),
      lesson('order-by', 'ORDER BY', 'DQL', 'Sort the rows returned by a query.',
        'ASC is the default direction; DESC sorts from high to low. Add a second sort column to make ties predictable, especially before LIMIT.',
        `SELECT name, salary
FROM employees
ORDER BY salary DESC, name ASC;`),
      lesson('limit', 'LIMIT', 'DQL', 'Restrict the number of rows returned in MySQL.',
        'MySQL uses LIMIT; TOP is used by other database systems. Use ORDER BY when the selected rows must be deterministic. LIMIT offset, count skips the first offset rows.',
        `SELECT name, salary
FROM employees
ORDER BY salary DESC, id ASC
LIMIT 5;`),
      lesson('count', 'COUNT()', 'Aggregate', 'Count rows or count non-NULL values.',
        'COUNT(*) counts result rows. COUNT(column) ignores NULL values in that column. COUNT(DISTINCT column) counts unique non-NULL values.',
        `SELECT department_id, COUNT(*) AS employee_count
FROM employees
GROUP BY department_id;`),
      lesson('sum', 'SUM()', 'Aggregate', 'Add the non-NULL values in a numeric column.',
        'SUM returns one value for the input set, or one value per group when combined with GROUP BY. If no non-NULL values are present, the result is NULL.',
        `SELECT department_id, SUM(amount) AS total_sales
FROM sales
GROUP BY department_id;`),
      lesson('avg', 'AVG()', 'Aggregate', 'Calculate the average of non-NULL numeric values.',
        'AVG ignores NULL values; it does not treat them as zero. A grouped average is calculated independently for each group.',
        `SELECT department_id, AVG(salary) AS average_salary
FROM employees
GROUP BY department_id;`),
      lesson('min-max', 'MIN() / MAX()', 'Aggregate', 'Find the lowest and highest values in a set.',
        'MIN and MAX work with numbers, dates, and strings using their comparison rules. They also ignore NULL values.',
        `SELECT MIN(hired_at) AS first_hire,
       MAX(hired_at) AS latest_hire
FROM employees;`),
      lesson('group-by', 'GROUP BY', 'Grouping', 'Produce one result row for each distinct group key.',
        'GROUP BY is commonly paired with aggregates. Select grouped columns and aggregate expressions; ONLY_FULL_GROUP_BY helps reject ambiguous, non-grouped columns.',
        `SELECT department_id, COUNT(*) AS people
FROM employees
GROUP BY department_id;`),
      lesson('having-where', 'HAVING vs WHERE', 'Grouping', 'Filter source rows with WHERE and grouped results with HAVING.',
        'WHERE runs before grouping and cannot test aggregate results. HAVING filters groups after GROUP BY and can use expressions such as COUNT(*) or AVG(salary).',
        `SELECT department_id, AVG(salary) AS average_salary
FROM employees
WHERE active = 1
GROUP BY department_id
HAVING AVG(salary) > 60000;`),
      lesson('primary-foreign-keys', 'Primary keys & foreign keys', 'Concepts', 'Identify rows and protect relationships between tables.',
        'A primary key uniquely identifies each row and cannot be NULL. A foreign key requires a referenced parent row, subject to its configured actions. In MySQL, foreign-key checks are supported by InnoDB.',
        `CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);`),
      lesson('joins', 'INNER / LEFT / RIGHT / CROSS JOIN', 'Joins', 'Combine rows according to a relationship or produce a Cartesian product.',
        'INNER JOIN keeps matching pairs. LEFT JOIN keeps every left row and fills unmatched right columns with NULL. RIGHT JOIN preserves the right side. MySQL has no FULL OUTER JOIN keyword; a UNION of left and right unmatched rows can emulate it. CROSS JOIN returns every pair.',
        `SELECT e.name, d.name AS department
FROM employees AS e
LEFT JOIN departments AS d
  ON d.id = e.department_id;`, [
          ['INNER JOIN', 'part1_15_inner_join'],
          ['LEFT JOIN', 'part1_16_left_join'],
          ['RIGHT JOIN', 'part1_17_right_join'],
        ]),
      lesson('distinct-null-strings', 'DISTINCT, NULL, and string case functions', 'Misc', 'Remove duplicate values, test missing values, and change string case.',
        'DISTINCT removes duplicate result rows. NULL means missing or unknown: compare with IS NULL or IS NOT NULL, not = NULL. UPPER() and LOWER() return a changed-case string; comparison behavior can also depend on collation.',
        `SELECT DISTINCT UPPER(city) AS city
FROM customers
WHERE manager_id IS NULL;`, [
          ['DISTINCT', 'part1_18_distinct'],
          ['NULL handling', 'part1_19_null_handling'],
          ['String functions', 'part1_20_string_functions_upper_lower'],
        ]),
    ],
  },
  {
    id: 'part-2',
    label: 'Part 2',
    title: 'Conditional logic and subqueries',
    totalTopics: 26,
    newTopics: '7 new topics',
    summary: 'Add string extraction, conditional output, multi-table patterns, and subqueries to the Part 1 foundation.',
    topics: [
      lesson('substring', 'SUBSTRING()', 'String functions', 'Extract a section of a string by its position.',
        'MySQL string positions start at 1. The optional length limits the number of returned characters. Use SUBSTRING_INDEX when splitting around a delimiter is a better fit.',
        `SELECT SUBSTRING(email, 1, 5) AS prefix
FROM users;`),
      lesson('case-when', 'CASE WHEN', 'Conditional', 'Return a value selected by ordered conditions.',
        'A searched CASE evaluates WHEN conditions from top to bottom and returns the first matching result. Include ELSE when an unmatched row needs a deliberate value.',
        `SELECT name,
       CASE
         WHEN score >= 80 THEN 'Pass'
         WHEN score >= 50 THEN 'Review'
         ELSE 'Retry'
       END AS result
FROM assessments;`),
      lesson('self-joins', 'Self joins', 'Joins', 'Relate rows in one table by joining that table to itself.',
        'Give each table reference a different alias. A self join is useful for parent-child relationships such as an employee and their manager.',
        `SELECT e.name AS employee,
       m.name AS manager
FROM employees AS e
LEFT JOIN employees AS m
  ON m.id = e.manager_id;`),
      lesson('multiple-joins', 'Multiple JOINs', 'Joins', 'Follow relationships across three or more tables.',
        'Join each table on the key that connects it to the previous result. Keep aliases descriptive and check whether each relationship is one-to-one or one-to-many so row counts do not surprise you.',
        `SELECT o.id, c.name, p.name AS product
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
JOIN order_items AS i ON i.order_id = o.id
JOIN products AS p ON p.id = i.product_id;`),
      lesson('coalesce', 'COALESCE()', 'Functions', 'Choose the first non-NULL expression in a list.',
        'COALESCE is useful for display fallbacks and defaulting a nullable expression. Its arguments should be compatible types.',
        `SELECT COALESCE(nickname, full_name, 'Unknown') AS display_name
FROM users;`),
      lesson('nested-subqueries', 'Nested subqueries', 'Subqueries', 'Use a query result inside another query.',
        'A subquery can appear in places such as WHERE, FROM, or the select list. Use IN for a set of values and EXISTS when the question is whether a matching row exists. Check NULL behavior when using NOT IN.',
        `SELECT name
FROM employees
WHERE department_id IN (
  SELECT id FROM departments WHERE region = 'South'
);`),
      lesson('correlated-subqueries', 'Correlated subqueries', 'Subqueries', 'Compare an outer row with a value computed by a subquery that refers to it.',
        'A correlated subquery references columns from the outer query. It can express per-group comparisons clearly; for large data sets, compare its plan with a join or window-function alternative.',
        `SELECT e.name
FROM employees AS e
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees AS e2
  WHERE e2.department_id = e.department_id
);`),
    ],
  },
  {
    id: 'part-3',
    label: 'Part 3',
    title: 'Advanced query patterns',
    totalTopics: 33,
    newTopics: '7 listed topics',
    summary: 'Add recursive queries, date work, views, window functions, transactions, and query-plan reading.',
    topics: [
      lesson('hierarchies', 'Hierarchies and recursive CTEs', 'Advanced', 'Walk parent-child data such as reporting lines or category trees.',
        'A recursive CTE has an anchor query and a recursive query joined with UNION ALL. The recursive query refers to the CTE; make sure the recursion reaches a stopping condition.',
        `WITH RECURSIVE org AS (
  SELECT id, manager_id, name, 0 AS depth
  FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.manager_id, e.name, o.depth + 1
  FROM employees AS e
  JOIN org AS o ON e.manager_id = o.id
)
SELECT * FROM org;`),
      lesson('date-functions', 'Date functions', 'Functions', 'Compare, extract, and calculate with date or time values.',
        'NOW() returns the current date and time; DATE() extracts the date portion; DATEDIFF(a, b) returns the number of days from b to a. For indexed date filtering, prefer a half-open range over wrapping the column in a function.',
        `SELECT order_id
FROM orders
WHERE created_at >= '2026-01-01'
  AND created_at <  '2026-02-01';`),
      lesson('views', 'CREATE VIEW', 'DDL', 'Save a named SELECT query as a reusable database view.',
        'A view presents query results like a table but normally stores the SELECT definition rather than a separate copy of its rows. A view can simplify repeated access; it does not automatically make every underlying query updatable.',
        `CREATE VIEW department_totals AS
SELECT department_id, COUNT(*) AS employee_count
FROM employees
GROUP BY department_id;`),
      lesson('row-number', 'ROW_NUMBER()', 'Window functions', 'Assign a unique sequence number within an ordered result or partition.',
        'The OVER clause defines ordering and optionally partitions. Add a tie-breaker to ORDER BY when row-number assignment must be repeatable.',
        `SELECT name, department_id,
       ROW_NUMBER() OVER (
         PARTITION BY department_id
         ORDER BY salary DESC, id
       ) AS row_num
FROM employees;`),
      lesson('rank', 'RANK()', 'Window functions', 'Give tied rows the same rank and leave gaps after ties.',
        'RANK differs from ROW_NUMBER, which assigns every row a distinct number, and DENSE_RANK, which does not leave gaps. Window functions keep row detail while calculating values over related rows.',
        `SELECT name, salary,
       RANK() OVER (ORDER BY salary DESC) AS salary_rank
FROM employees;`),
      lesson('transactions', 'Transactions', 'Transactions', 'Commit a set of changes together or roll them back.',
        'A transaction groups statements into one unit of work. COMMIT keeps its changes; ROLLBACK undoes uncommitted changes. InnoDB supports transactions and savepoints.',
        `START TRANSACTION;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
UPDATE accounts SET balance = balance + 50 WHERE id = 2;
COMMIT;`),
      lesson('query-cost-explain', 'Query cost and EXPLAIN', 'Performance', 'Inspect the optimizer plan before changing a slow query.',
        'EXPLAIN shows how MySQL plans a statement, including table access and chosen keys. EXPLAIN ANALYZE executes the statement and reports observed iterator timing and row counts; use it carefully because it really runs the query.',
        `EXPLAIN
SELECT id, created_at
FROM orders
WHERE status = 'paid'
  AND created_at >= '2026-01-01';`),
    ],
  },
]

export const MYSQL_STUDY_RESOURCES = [
  {
    title: 'MySQL 8.4 Reference Manual',
    kind: 'Official reference',
    href: 'https://dev.mysql.com/doc/refman/8.4/en/',
    description: 'Use the manual to confirm exact syntax and server behavior.',
  },
  {
    title: 'MySQL Notes for Professionals',
    kind: 'PDF',
    href: 'https://exaze.github.io/exaze_grads_training_material/MySQLNotesForProfessionals.pdf',
    description: 'The PDF listed in the supplied training resources.',
  },
  {
    title: 'W3Schools SQL Tutorial',
    kind: 'Tutorial',
    href: 'https://www.w3schools.com/sql/default.asp',
    description: 'A second explanation for SQL fundamentals and examples.',
  },
  {
    title: 'GeeksforGeeks SQL Tutorial',
    kind: 'Tutorial',
    href: 'https://www.geeksforgeeks.org/sql/sql-tutorial/',
    description: 'Reference articles and examples for SQL topics.',
  },
  {
    title: 'A Visual Explanation of SQL Joins',
    kind: 'Article',
    href: 'https://blog.codinghorror.com/a-visual-explanation-of-sql-joins/',
    description: 'A visual introduction to how common join types combine rows.',
  },
  {
    title: 'MySQL JOINs Guide',
    kind: 'Article',
    href: 'https://www.beekeeperstudio.io/blog/mysql-joins-guide',
    description: 'Examples and explanations for joining MySQL tables.',
  },
  {
    title: 'Playing with Hierarchical Data in MySQL',
    kind: 'Article',
    href: 'https://medium.com/@officialhvirmani/playing-with-hierarchical-data-in-mysql-463bde9749d1',
    description: 'An additional perspective on representing and querying hierarchies.',
  },
  {
    title: 'Hierarchy in SQL',
    kind: 'Article',
    href: 'https://lars.yencken.org/hierarchy-in-sql/',
    description: 'Patterns for modelling and querying hierarchical data.',
  },
  {
    title: 'MySQL 8 Recursive CTEs and Hierarchies',
    kind: 'Article',
    href: 'https://dev.mysql.com/blog-archive/mysql-8-0-labs-recursive-common-table-expressions-in-mysql-ctes-part-three-hierarchies/',
    description: 'MySQL examples using recursive common table expressions.',
  },
  {
    title: 'SQL JOINs Tutorial',
    kind: 'Video',
    href: 'https://youtu.be/5OdVJbNCSso?si=zjR_5Y5i3AclM9Do',
    description: 'A video walkthrough of SQL joins.',
  },
  {
    title: 'Advanced SQL',
    kind: 'Video',
    href: 'https://youtu.be/nJIEIzF7tDw?si=9Hy-BKJ2Fjqx-UAU',
    description: 'A video resource for more advanced SQL patterns.',
  },
]

export const MYSQL_DAILY_UPDATE_TEMPLATE = `Date:
Study hours completed (target: 8):

Tasks:
- Topic / practical task — Not started / In progress / Done

Difficulties / doubts:
- Question or blocker:
- Person asked:
- Status: Not asked / Waiting / Cleared`
