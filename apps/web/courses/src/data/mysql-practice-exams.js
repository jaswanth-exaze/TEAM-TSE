export const MYSQL_EXAMS = [
  {
    id: 'part-1',
    label: 'Part 1',
    title: 'Foundation mock exam',
    topicCount: '19 topics',
    newTopics: 'All new',
    description: 'DDL, DML, filtering, grouping, keys, joins, and common NULL/string cases.',
    tasks: [
      {
        id: 'p1-schema',
        title: '1. Define and load a small schema',
        tables: 'Create departments(id, name) and employees(id, name, department_id, salary).',
        prompt: 'Write the CREATE TABLE statements with primary keys, an auto-increment employee id, a required employee name, and a foreign key to departments. Then insert two departments and three employees using explicit column lists. Finish by adding an email column with ALTER TABLE and writing a DROP TABLE statement for an obsolete staging_import table.',
        solution: `CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  department_id INT,
  salary DECIMAL(10, 2),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

INSERT INTO departments (name)
VALUES ('Engineering'), ('Support');

INSERT INTO employees (name, department_id, salary)
VALUES ('Asha', 1, 72000), ('Ben', 1, 68000), ('Chen', 2, 54000);

ALTER TABLE employees ADD COLUMN email VARCHAR(255);
DROP TABLE IF EXISTS staging_import;`,
        note: 'Assume the departments are inserted first so each foreign-key value has a parent row. DROP TABLE removes the table and its data.',
      },
      {
        id: 'p1-select',
        title: '2. Filter, sort, and limit',
        tables: 'Use employees(id, name, department_id, salary, active).',
        prompt: 'Return the three highest-paid active employees in departments 1 or 2 whose salary is between 50,000 and 90,000 inclusive. Show the name and salary, and use a stable tie-breaker.',
        solution: `SELECT name, salary
FROM employees
WHERE active = 1
  AND department_id IN (1, 2)
  AND salary BETWEEN 50000 AND 90000
ORDER BY salary DESC, id ASC
LIMIT 3;`,
        note: 'BETWEEN includes both endpoints. The id tie-breaker makes the LIMIT result predictable.',
      },
      {
        id: 'p1-write',
        title: '3. Change rows safely',
        tables: 'Use employees(id, name, department_id, salary, active).',
        prompt: 'Write an UPDATE that adds 5% to active employees in department 2. Then write a DELETE for inactive employees in that same department. State which rows your WHERE clauses select before running either statement.',
        solution: `UPDATE employees
SET salary = salary * 1.05
WHERE active = 1 AND department_id = 2;

DELETE FROM employees
WHERE active = 0 AND department_id = 2;`,
        note: 'A missing WHERE changes every row. Preview the target rows with SELECT using the same conditions.',
      },
      {
        id: 'p1-aggregate',
        title: '4. Summarize departments',
        tables: 'Use employees(department_id, salary, active).',
        prompt: 'For active employees, return each department, employee count, total salary, average salary, lowest salary, and highest salary. Keep departments with an average above 60,000.',
        solution: `SELECT department_id,
       COUNT(*) AS employee_count,
       SUM(salary) AS total_salary,
       AVG(salary) AS average_salary,
       MIN(salary) AS lowest_salary,
       MAX(salary) AS highest_salary
FROM employees
WHERE active = 1
GROUP BY department_id
HAVING AVG(salary) > 60000;`,
        note: 'WHERE filters source rows; HAVING filters completed groups.',
      },
      {
        id: 'p1-joins',
        title: '5. Compare join results',
        tables: 'Use employees(id, name, department_id) and departments(id, name).',
        prompt: 'Write one query listing employees with their matching department names, and another that also keeps employees with no department. Explain what INNER JOIN, LEFT JOIN, RIGHT JOIN, and CROSS JOIN preserve or produce.',
        solution: `-- Matching employees only
SELECT e.name, d.name AS department
FROM employees AS e
INNER JOIN departments AS d ON d.id = e.department_id;

-- Every employee, including unassigned employees
SELECT e.name, d.name AS department
FROM employees AS e
LEFT JOIN departments AS d ON d.id = e.department_id;`,
        note: 'MySQL has no FULL OUTER JOIN keyword. A UNION of left-side rows and right-only rows can emulate it.',
      },
      {
        id: 'p1-null',
        title: '6. Handle uniqueness and missing values',
        tables: 'Use customers(id, city, manager_id).',
        prompt: 'Return each distinct non-NULL city in uppercase, then write a separate query to find customers without a manager.',
        solution: `SELECT DISTINCT UPPER(city) AS city
FROM customers
WHERE city IS NOT NULL;

SELECT id, city
FROM customers
WHERE manager_id IS NULL;`,
        note: 'Use IS NULL rather than = NULL. DISTINCT removes duplicates from the result.',
      },
    ],
  },
  {
    id: 'part-2',
    label: 'Part 2',
    title: 'Cumulative mock exam',
    topicCount: '26 topics total',
    newTopics: '7 new topics',
    description: 'Mix the Part 1 foundation with string functions, CASE, joins, COALESCE, and subqueries.',
    tasks: [
      {
        id: 'p2-case-substring',
        title: '1. Format a contact list',
        tables: 'Use customers(id, first_name, last_name, email, phone).',
        prompt: 'Return customer id, an uppercase first name, the first 8 characters of the email, and a contact label. Use CASE to return “Email” when email exists, “Phone” when only phone exists, or “Missing” otherwise.',
        solution: `SELECT id,
       UPPER(first_name) AS first_name,
       SUBSTRING(email, 1, 8) AS email_prefix,
       CASE
         WHEN email IS NOT NULL THEN 'Email'
         WHEN phone IS NOT NULL THEN 'Phone'
         ELSE 'Missing'
       END AS contact_label
FROM customers;`,
      },
      {
        id: 'p2-self-join',
        title: '2. Pair employees with managers',
        tables: 'Use employees(id, name, manager_id). A manager is also an employee row.',
        prompt: 'Return every employee and their manager’s name, keeping employees who do not have a manager.',
        solution: `SELECT e.name AS employee,
       m.name AS manager
FROM employees AS e
LEFT JOIN employees AS m ON m.id = e.manager_id;`,
        note: 'This is a self join: the same table appears twice with different aliases.',
      },
      {
        id: 'p2-multiple-joins',
        title: '3. Follow several relationships',
        tables: 'Use orders(id, customer_id), customers(id, name), order_items(order_id, product_id, quantity), and products(id, name).',
        prompt: 'Return each order id, customer name, product name, and quantity. Write the joins that connect all four tables.',
        solution: `SELECT o.id AS order_id,
       c.name AS customer,
       p.name AS product,
       i.quantity
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
JOIN order_items AS i ON i.order_id = o.id
JOIN products AS p ON p.id = i.product_id;`,
      },
      {
        id: 'p2-coalesce',
        title: '4. Choose the first available value',
        tables: 'Use users(nickname, full_name, email).',
        prompt: 'Return a display name using nickname first, full_name second, and the text “Unknown” if both names are NULL.',
        solution: `SELECT COALESCE(nickname, full_name, 'Unknown') AS display_name
FROM users;`,
      },
      {
        id: 'p2-nested',
        title: '5. Use a nested subquery',
        tables: 'Use employees(id, name, department_id, salary) and departments(id, region).',
        prompt: 'Return employees who belong to a department in the South region. Use a subquery in WHERE.',
        solution: `SELECT id, name
FROM employees
WHERE department_id IN (
  SELECT id
  FROM departments
  WHERE region = 'South'
);`,
      },
      {
        id: 'p2-correlated',
        title: '6. Compare each row with its group',
        tables: 'Use employees(id, name, department_id, salary).',
        prompt: 'Return employees whose salary is higher than the average salary in their own department. Use a correlated subquery.',
        solution: `SELECT e.name, e.department_id, e.salary
FROM employees AS e
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees AS e2
  WHERE e2.department_id = e.department_id
);`,
        note: 'The inner query refers to e.department_id from the current outer row.',
      },
      {
        id: 'p2-cumulative',
        title: '7. Aggregate after joining',
        tables: 'Use customers(id, name), orders(id, customer_id, total).',
        prompt: 'Return each customer, their order count, and total spend. Keep customers with at least two orders and show the highest spend first.',
        solution: `SELECT c.id, c.name,
       COUNT(o.id) AS order_count,
       SUM(o.total) AS total_spend
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(o.id) >= 2
ORDER BY total_spend DESC;`,
        note: 'This cumulative task combines JOIN, GROUP BY, aggregate functions, HAVING, and ORDER BY.',
      },
      {
        id: 'p2-ddl-dml',
        title: '8. Review schema and data changes',
        tables: 'Use products(id, name, category, price, active).',
        prompt: 'Write one INSERT for a new product, an ALTER TABLE adding an SKU column, an UPDATE that changes the price of one product by id, and a DELETE for one inactive product. Before the UPDATE and DELETE, write SELECT previews with matching WHERE conditions.',
        solution: `INSERT INTO products (name, category, price, active)
VALUES ('Notebook', 'Stationery', 4.50, 1);

ALTER TABLE products ADD COLUMN sku VARCHAR(40);

SELECT id, price FROM products WHERE id = 12;
UPDATE products SET price = price * 1.05 WHERE id = 12;

SELECT id, name FROM products WHERE active = 0;
DELETE FROM products WHERE active = 0;`,
        note: 'The Part 2 mock is cumulative, so it revisits Part 1 schema and data changes as well as the seven new topics.',
      },
    ],
  },
  {
    id: 'part-3',
    label: 'Part 3',
    title: 'Advanced cumulative mock exam',
    topicCount: '33 listed topics total',
    newTopics: '7 listed topics',
    description: 'Cumulative practice for Parts 1 and 2, plus recursive CTEs, dates, views, windows, transactions, and EXPLAIN.',
    tasks: [
      {
        id: 'p3-recursive',
        title: '1. Walk an employee hierarchy',
        tables: 'Use employees(id, name, manager_id). Top-level employees have manager_id IS NULL.',
        prompt: 'Write a recursive CTE that starts at top-level employees and returns each descendant with a depth value.',
        solution: `WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 0 AS depth
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, org.depth + 1
  FROM employees AS e
  JOIN org ON e.manager_id = org.id
)
SELECT id, name, manager_id, depth
FROM org;`,
        note: 'The anchor query seeds the recursion. Each recursive row must lead toward a finite stopping condition.',
      },
      {
        id: 'p3-dates',
        title: '2. Filter a calendar month',
        tables: 'Use orders(id, created_at).',
        prompt: 'Return orders created during January 2026. Also show how many whole days have passed since each order date.',
        solution: `SELECT id,
       created_at,
       DATEDIFF(CURRENT_DATE, DATE(created_at)) AS days_old
FROM orders
WHERE created_at >= '2026-01-01'
  AND created_at <  '2026-02-01';`,
        note: 'The half-open range includes all January timestamps and keeps the filter on the original column.',
      },
      {
        id: 'p3-view',
        title: '3. Save a reusable report',
        tables: 'Use orders(id, customer_id, total).',
        prompt: 'Create a view named customer_order_totals with one row per customer and their order count and total spend.',
        solution: `CREATE VIEW customer_order_totals AS
SELECT customer_id,
       COUNT(*) AS order_count,
       SUM(total) AS total_spend
FROM orders
GROUP BY customer_id;`,
        note: 'A regular view stores the query definition, not a separate stored copy of each result row.',
      },
      {
        id: 'p3-row-number',
        title: '4. Select one highest-paid employee per department',
        tables: 'Use employees(id, name, department_id, salary).',
        prompt: 'Use ROW_NUMBER() to number employees from highest salary to lowest within each department. Return only the top employee from each department.',
        solution: `WITH ranked AS (
  SELECT id, name, department_id, salary,
         ROW_NUMBER() OVER (
           PARTITION BY department_id
           ORDER BY salary DESC, id
         ) AS row_num
  FROM employees
)
SELECT id, name, department_id, salary
FROM ranked
WHERE row_num = 1;`,
      },
      {
        id: 'p3-rank',
        title: '5. Preserve ties in a leaderboard',
        tables: 'Use sales(employee_id, employee_name, amount).',
        prompt: 'Rank employees by amount so equal amounts share a rank and the next rank has a gap. Return the top three ranks.',
        solution: `WITH ranked AS (
  SELECT employee_id, employee_name, amount,
         RANK() OVER (ORDER BY amount DESC) AS sales_rank
  FROM sales
)
SELECT employee_id, employee_name, amount, sales_rank
FROM ranked
WHERE sales_rank <= 3;`,
        note: 'RANK assigns the same number to ties and leaves gaps after them.',
      },
      {
        id: 'p3-transaction',
        title: '6. Make a transfer atomic',
        tables: 'Use accounts(id, balance). Transfer 50 from account 1 to account 2.',
        prompt: 'Write the transaction statements so both balance changes commit together, or neither change remains if you roll back.',
        solution: `START TRANSACTION;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
UPDATE accounts SET balance = balance + 50 WHERE id = 2;
COMMIT;`,
        note: 'In a real transfer, validate the source balance and check that both target rows exist before committing.',
      },
      {
        id: 'p3-explain',
        title: '7. Inspect a query plan',
        tables: 'An orders table has an index on (status, created_at).',
        prompt: 'Write an EXPLAIN statement for a query that selects recent paid order ids. State which plan details you would inspect before proposing a change.',
        solution: `EXPLAIN
SELECT id, created_at
FROM orders
WHERE status = 'paid'
  AND created_at >= '2026-01-01'
ORDER BY created_at
LIMIT 20;`,
        note: 'Inspect access type, chosen key, estimated rows, and whether the plan needs extra sorting. EXPLAIN ANALYZE executes the query.',
      },
      {
        id: 'p3-cumulative',
        title: '8. Combine Part 2 string and subquery patterns',
        tables: 'Use employees(id, name, department_id, manager_id, email, nickname, salary).',
        prompt: 'Return employees whose salary is above their department average. Show the first 6 characters of each email, a display name using COALESCE, and a CASE label of Senior when salary is at least 80,000 or Standard otherwise. Keep employees without a manager and include their manager name when present.',
        solution: `SELECT e.id,
       SUBSTRING(e.email, 1, 6) AS email_prefix,
       COALESCE(e.nickname, e.name, 'Unknown') AS display_name,
       CASE WHEN e.salary >= 80000 THEN 'Senior' ELSE 'Standard' END AS level,
       m.name AS manager
FROM employees AS e
LEFT JOIN employees AS m ON m.id = e.manager_id
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees AS e2
  WHERE e2.department_id = e.department_id
);`,
        note: 'This cumulative task combines SUBSTRING, COALESCE, CASE, a self join, and a correlated subquery.',
      },
    ],
  },
  {
    id: 'final',
    label: 'Final',
    title: 'Full-syllabus mock exam',
    topicCount: 'All 33 listed topics',
    newTopics: 'Cumulative',
    description: 'Use the full syllabus: schema design, safe writes, joins, grouping, subqueries, windows, transactions, and query plans.',
    tasks: [
      {
        id: 'final-schema',
        title: '1. Design a small order schema',
        tables: 'Model customers, products, orders, and order_items.',
        prompt: 'Write CREATE TABLE statements with primary keys, suitable column types, required fields, and foreign keys. Use a composite key or a unique constraint to prevent the same product appearing twice in one order.',
        solution: `CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE order_items (
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);`,
      },
      {
        id: 'final-maintenance',
        title: '2. Insert, alter, update, delete, and drop',
        tables: 'Use products(id, name, category, price, active).',
        prompt: 'Write an INSERT for a product, add an SKU column with ALTER TABLE, preview and increase one product price by 4%, preview and delete inactive products, and drop an obsolete staging_import table.',
        solution: `INSERT INTO products (name, category, price, active)
VALUES ('SQL Basics', 'Books', 24.00, 1);

ALTER TABLE products ADD COLUMN sku VARCHAR(40);

SELECT id, price FROM products WHERE id = 8;
UPDATE products SET price = price * 1.04 WHERE id = 8;

SELECT id, name FROM products WHERE active = 0;
DELETE FROM products WHERE active = 0;

DROP TABLE IF EXISTS staging_import;`,
        note: 'Preview each target set before changing it. DROP TABLE removes the table definition and its data.',
      },
      {
        id: 'final-write',
        title: '3. Apply a targeted data change',
        tables: 'Use products(id, category, price, active).',
        prompt: 'Increase active products in the “Books” category by 4%. Give a safe preview query and the UPDATE.',
        solution: `SELECT id, price
FROM products
WHERE active = 1 AND category = 'Books';

UPDATE products
SET price = price * 1.04
WHERE active = 1 AND category = 'Books';`,
      },
      {
        id: 'final-report',
        title: '4. Build a grouped sales report',
        tables: 'Use customers(id, name), orders(id, customer_id, created_at), order_items(order_id, product_id, quantity, unit_price), and products(id, name).',
        prompt: 'For January 2026, return each customer’s order count, total spend, average item price, lowest item price, highest item price, and days since their latest order. Join the related tables, keep customers with at least two orders, and sort by spend descending.',
        solution: `SELECT c.id, c.name,
       COUNT(DISTINCT o.id) AS order_count,
       SUM(i.quantity * i.unit_price) AS total_spend,
       AVG(i.unit_price) AS average_item_price,
       MIN(i.unit_price) AS lowest_item_price,
       MAX(i.unit_price) AS highest_item_price,
       DATEDIFF(NOW(), DATE(MAX(o.created_at))) AS days_since_latest_order
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
JOIN order_items AS i ON i.order_id = o.id
JOIN products AS p ON p.id = i.product_id
WHERE o.created_at >= '2026-01-01'
  AND o.created_at <  '2026-02-01'
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT o.id) >= 2
ORDER BY total_spend DESC;`,
      },
      {
        id: 'final-no-orders',
        title: '5. Find customers with no orders',
        tables: 'Use customers(id, name) and orders(id, customer_id).',
        prompt: 'Write two valid approaches: one using LEFT JOIN and one using NOT EXISTS. Briefly state what RIGHT JOIN preserves and how CROSS JOIN changes the result.',
        solution: `SELECT c.id, c.name
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.id IS NULL;

SELECT c.id, c.name
FROM customers AS c
WHERE NOT EXISTS (
  SELECT 1 FROM orders AS o
  WHERE o.customer_id = c.id
);`,
        note: 'NOT EXISTS avoids the NULL trap that can make NOT IN return no rows.',
      },
      {
        id: 'final-strings',
        title: '6. Format a distinct customer list',
        tables: 'Use customers(id, name, nickname, city, email, phone).',
        prompt: 'Return unique combinations of lowercase city, the first 8 email characters, a display name using COALESCE, and a CASE contact label (Email, Phone, or Missing). Keep cities beginning with A or B, sort by city, and limit the output to 20 rows.',
        solution: `SELECT DISTINCT LOWER(city) AS city,
       SUBSTRING(email, 1, 8) AS email_prefix,
       COALESCE(nickname, name, 'Unknown') AS display_name,
       CASE
         WHEN email IS NOT NULL THEN 'Email'
         WHEN phone IS NOT NULL THEN 'Phone'
         ELSE 'Missing'
       END AS contact_method
FROM customers
WHERE city IS NOT NULL
  AND (city LIKE 'A%' OR city LIKE 'B%')
ORDER BY city
LIMIT 20;`,
        note: 'This task uses NULL checks, DISTINCT, LOWER, SUBSTRING, COALESCE, CASE, LIKE, ORDER BY, and LIMIT.',
      },
      {
        id: 'final-self-subquery',
        title: '7. Join a table to itself and use a nested query',
        tables: 'Use employees(id, name, manager_id, department_id, salary) and departments(id, name, region).',
        prompt: 'Return each employee and manager in departments located in the South. Use a self join for the manager and a nested subquery in WHERE to select the departments.',
        solution: `SELECT e.name AS employee, m.name AS manager
FROM employees AS e
LEFT JOIN employees AS m ON m.id = e.manager_id
WHERE e.department_id IN (
  SELECT id FROM departments WHERE region = 'South'
);`,
      },
      {
        id: 'final-hierarchy',
        title: '8. Return a hierarchy with levels',
        tables: 'Use employees(id, name, manager_id).',
        prompt: 'Write a recursive CTE returning every employee beneath the top-level manager, along with their depth.',
        solution: `WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 0 AS depth
  FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, org.depth + 1
  FROM employees AS e
  JOIN org ON e.manager_id = org.id
)
SELECT * FROM org;`,
      },
      {
        id: 'final-view',
        title: '9. Save a reusable view',
        tables: 'Use orders(id, customer_id, total).',
        prompt: 'Create a view named customer_order_totals with each customer’s order count and total spend.',
        solution: `CREATE VIEW customer_order_totals AS
SELECT customer_id,
       COUNT(*) AS order_count,
       SUM(total) AS total_spend
FROM orders
GROUP BY customer_id;`,
      },
      {
        id: 'final-window',
        title: '10. Rank revenue and keep one row per customer',
        tables: 'Use orders(id, customer_id, created_at, total).',
        prompt: 'Use ROW_NUMBER() to return each customer’s latest order with a tie-breaker. Also use RANK() to rank all orders by total descending, allowing ties to share a rank.',
        solution: `WITH ranked AS (
  SELECT id, customer_id, created_at, total,
         ROW_NUMBER() OVER (
           PARTITION BY customer_id
           ORDER BY created_at DESC, id DESC
         ) AS row_num
  FROM orders
)
SELECT id, customer_id, created_at, total
FROM ranked
WHERE row_num = 1;

SELECT id, customer_id, total,
       RANK() OVER (ORDER BY total DESC) AS total_rank
FROM orders;`,
      },
      {
        id: 'final-transaction',
        title: '11. Use a savepoint',
        tables: 'A transaction updates an account balance and then applies an optional fee.',
        prompt: 'Write a transaction that keeps the transfer, but can roll back only the optional fee before committing.',
        solution: `START TRANSACTION;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
UPDATE accounts SET balance = balance + 50 WHERE id = 2;
SAVEPOINT before_fee;
UPDATE accounts SET balance = balance - 2 WHERE id = 1;
ROLLBACK TO before_fee;
COMMIT;`,
      },
      {
        id: 'final-plan',
        title: '12. Explain a slow filter',
        tables: 'A table has an index on created_at. The query filters with YEAR(created_at) = 2026.',
        prompt: 'Write EXPLAIN for the query, then rewrite the date condition as a range that can use the index more directly.',
        solution: `EXPLAIN
SELECT id
FROM orders
WHERE YEAR(created_at) = 2026;

EXPLAIN
SELECT id
FROM orders
WHERE created_at >= '2026-01-01'
  AND created_at <  '2027-01-01';`,
        note: 'Compare both access plans rather than assuming an index is used. EXPLAIN ANALYZE runs the query.',
      },
    ],
  },
]

export function getMysqlExam(id) {
  return MYSQL_EXAMS.find((exam) => exam.id === id)
}
