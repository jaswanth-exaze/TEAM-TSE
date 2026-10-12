const MYSQL_STUDY_SUPPORT = {
  'select-from-where': [
    { title: 'Exercise 1 · Guided', hint: 'Use salary as the filter. Keep the comparison inclusive with >=, and return only the three requested columns.', answer: `SELECT first_name, last_name, salary\nFROM employees\nWHERE salary >= 100000;`, explanation: 'WHERE filters rows before they are returned. The >= operator includes employees earning exactly $100,000.' },
    { title: 'Exercise 2 · Independent', hint: 'An end date that has not been recorded is NULL. Test it with IS NULL, not = NULL.', answer: `SELECT project_name, start_date\nFROM projects\nWHERE end_date IS NULL;`, explanation: 'NULL represents an unknown or missing value, so ordinary equality comparisons do not match it.' },
  ],
  filtering: [
    { title: 'Exercise 1 · Guided', hint: 'Use two LIKE patterns and join them with OR. CONCAT can build the displayed full name.', answer: `SELECT CONCAT(first_name, ' ', last_name) AS full_name\nFROM employees\nWHERE last_name LIKE 'M%' OR last_name LIKE 'W%';`, explanation: 'The percent sign matches any sequence after the first letter. OR accepts either initial.' },
    { title: 'Exercise 2 · Independent', hint: 'BETWEEN includes both boundary values. Filter by budget before choosing the output columns.', answer: `SELECT project_name, budget\nFROM projects\nWHERE budget BETWEEN 100000 AND 200000;`, explanation: 'BETWEEN is inclusive, so budgets of exactly $100,000 and $200,000 are included.' },
    { title: 'Exercise 3 · Challenge', hint: 'Combine the two hire years with IN. Use NOT BETWEEN for the excluded salary range; decide explicitly how to handle NULL salaries.', answer: `SELECT first_name, last_name, hire_date, salary\nFROM employees\nWHERE hire_date >= '2022-01-01'\n  AND hire_date < '2024-01-01'\n  AND salary NOT BETWEEN 60000 AND 80000;`, explanation: 'The half-open date range includes all of 2022 and 2023. A NULL salary will not pass NOT BETWEEN because its comparison is unknown.' },
  ],
  'order-by': [
    { title: 'Exercise 1 · Guided', hint: 'Sort by budget in descending order. Add an explicit NULL rule if you want missing budgets at the end.', answer: `SELECT project_name, budget\nFROM projects\nORDER BY budget DESC;`, explanation: 'DESC places larger known budgets first. MySQL sorts NULL values first in descending order; use an expression such as budget IS NULL if you need NULLs last.' },
    { title: 'Exercise 2 · Independent', hint: 'Filter hire_date to 2022 or later, then sort ascending so earlier dates come first.', answer: `SELECT first_name, last_name, hire_date\nFROM employees\nWHERE hire_date >= '2022-01-01'\nORDER BY hire_date ASC;`, explanation: 'The WHERE clause keeps the requested years, and ascending date order places the oldest matching hire date first.' },
    { title: 'Exercise 3 · Challenge', hint: 'ORDER BY accepts multiple columns. Make department ascending the primary sort, then hire date descending within each department.', answer: `SELECT first_name, last_name, department_id, hire_date\nFROM employees\nORDER BY department_id ASC, hire_date DESC;`, explanation: 'MySQL sorts by the first key, then uses the next key to order rows tied on that first key.' },
  ],
  limit: [
    { title: 'Exercise 1 · Guided', hint: 'Sort start_date newest first, then limit the result to three rows.', answer: `SELECT project_name, start_date\nFROM projects\nORDER BY start_date DESC\nLIMIT 3;`, explanation: 'ORDER BY determines which rows are considered the newest; LIMIT then returns the first three.' },
    { title: 'Exercise 2 · Independent', hint: 'Sort by last_name first. Rows 11–15 are five rows, so skip ten and return five.', answer: `SELECT first_name, last_name\nFROM employees\nORDER BY last_name ASC, first_name ASC\nLIMIT 5 OFFSET 10;`, explanation: 'OFFSET 10 skips the first ten sorted rows; LIMIT 5 returns the next five. The extra first-name key makes ties deterministic.' },
    { title: 'Exercise 3 · Challenge', hint: 'Filter to hire dates after 2020, then sort by salary ascending and take one row. Consider whether NULL salaries should be excluded.', answer: `SELECT first_name, last_name, salary, hire_date\nFROM employees\nWHERE hire_date >= '2021-01-01'\n  AND salary IS NOT NULL\nORDER BY salary ASC\nLIMIT 1;`, explanation: 'Filtering first ensures only post-2020 hires are considered. Sorting ascending puts the lowest known salary first.' },
  ],
  count: [
    { title: 'Exercise 1 · Guided', hint: 'SUM adds non-NULL budget values and naturally ignores NULLs.', answer: `SELECT SUM(budget) AS total_budget\nFROM projects;`, explanation: 'SUM returns one aggregate value for the matching rows and skips NULL budget values.' },
    { title: 'Exercise 2 · Independent', hint: 'Use COUNT(*) for every project row, COUNT(budget) for non-NULL budgets, and AVG(budget) for the average.', answer: `SELECT COUNT(*) AS project_count,\n       COUNT(budget) AS projects_with_budget,\n       AVG(budget) AS average_budget\nFROM projects;`, explanation: 'COUNT(*) counts rows, while COUNT(column) counts only rows where that column is not NULL. AVG also ignores NULL values.' },
    { title: 'Exercise 3 · Challenge', hint: 'MIN and MAX work on DATE columns as well as numbers. Give each result the requested alias.', answer: `SELECT MIN(hire_date) AS first_hire,\n       MAX(hire_date) AS most_recent_hire\nFROM employees;`, explanation: 'The aggregate functions compare date values chronologically and return the earliest and latest dates.' },
  ],
  sum: [
    { title: 'Exercise 1 · Guided', hint: 'SUM ignores NULL values. You can either rely on that behavior or write an explicit IS NOT NULL filter.', answer: `SELECT SUM(budget) AS total_budget\nFROM projects\nWHERE budget IS NOT NULL;`, explanation: 'The filter states the requirement clearly; SUM would also skip NULL budgets if the WHERE clause were omitted.' },
  ],
  avg: [
    { title: 'Exercise 2 · Independent', hint: 'Combine COUNT(*), COUNT(budget), and AVG(budget) in one SELECT. COUNT(budget) excludes NULLs.', answer: `SELECT COUNT(*) AS project_count,\n       COUNT(budget) AS projects_with_budget,\n       AVG(budget) AS average_budget\nFROM projects;`, explanation: 'These aggregates summarize the same project rows but treat NULL differently: COUNT(*) includes each row, while COUNT(budget) and AVG(budget) ignore missing budgets.' },
  ],
  'min-max': [
    { title: 'Exercise 3 · Challenge', hint: 'Use MIN and MAX on hire_date and label the returned columns with the requested aliases.', answer: `SELECT MIN(hire_date) AS first_hire,\n       MAX(hire_date) AS most_recent_hire\nFROM employees;`, explanation: 'MIN and MAX support date values and return the earliest and most recent hire dates.' },
  ],
  'group-by': [
    { title: 'Exercise 1 · Guided', hint: 'Group by department_id, count employee rows, then order by that count descending.', answer: `SELECT department_id, COUNT(*) AS employee_count\nFROM employees\nGROUP BY department_id\nORDER BY employee_count DESC;`, explanation: 'GROUP BY creates one group per department. COUNT(*) counts each employee in a group, and the alias can be used in ORDER BY.' },
    { title: 'Exercise 2 · Independent', hint: 'Start from employee_projects, group by project_id, and count its employee assignments.', answer: `SELECT project_id, COUNT(*) AS employee_count\nFROM employee_projects\nGROUP BY project_id;`, explanation: 'Each row in employee_projects represents an assignment, so counting rows per project gives its assigned employee count.' },
    { title: 'Exercise 3 · Challenge', hint: 'YEAR(start_date) is the grouping key. Sum budget for each year and sort by that year.', answer: `SELECT YEAR(start_date) AS project_year,\n       SUM(budget) AS total_budget\nFROM projects\nWHERE start_date IS NOT NULL\nGROUP BY YEAR(start_date)\nORDER BY project_year;`, explanation: 'Rows with the same start year form one group. SUM totals budgets in each group, and filtering missing dates avoids an unnamed year group.' },
  ],
  'having-where': [
    { title: 'Exercise 1 · Guided', hint: 'Join assignments to projects, group by project, then use HAVING to keep counts of two or more.', answer: `SELECT p.project_id, COUNT(ep.employee_id) AS employee_count\nFROM projects AS p\nJOIN employee_projects AS ep ON ep.project_id = p.project_id\nGROUP BY p.project_id\nHAVING COUNT(ep.employee_id) >= 2;`, explanation: 'HAVING filters groups after COUNT has been calculated. An inner join naturally omits projects with no assignments.' },
    { title: 'Exercise 2 · Independent', hint: 'Filter employees by salary before grouping. Then use HAVING on the grouped count.', answer: `SELECT department_id, COUNT(*) AS high_earner_count\nFROM employees\nWHERE salary > 70000\nGROUP BY department_id\nHAVING COUNT(*) >= 2;`, explanation: 'WHERE limits the input rows to employees earning over $70,000. HAVING then keeps departments with at least two qualifying employees.' },
    { title: 'Exercise 3 · Challenge', hint: 'Group employees by manager_id. Use HAVING for both the report count and average salary conditions.', answer: `SELECT manager_id,\n       COUNT(*) AS report_count,\n       AVG(salary) AS average_report_salary\nFROM employees\nWHERE manager_id IS NOT NULL\nGROUP BY manager_id\nHAVING COUNT(*) >= 3\n   AND AVG(salary) > 75000;`, explanation: 'The non-NULL filter removes employees without a manager. HAVING evaluates each manager group after COUNT and AVG are available.' },
  ],
  insert: [
    { title: 'Exercise 1 · Guided', hint: 'List the project columns explicitly. Use ISO date format and NULL for the missing end date.', answer: `INSERT INTO projects (project_name, start_date, end_date, budget)\nVALUES ('AI Research Initiative', '2024-01-01', NULL, 600000.00);`, explanation: 'Explicit column names make the value order clear. SQL uses the NULL keyword for a missing value, without quotes.' },
    { title: 'Exercise 2 · Independent', hint: 'Insert the requested employee columns and use CURDATE() for today. Replace the sample name and salary with your own values.', answer: `INSERT INTO employees (first_name, last_name, department_id, salary, hire_date, manager_id)\nVALUES ('YourFirstName', 'YourLastName', 1, 80000.00, CURDATE(), 1);`, explanation: 'The values must match the listed columns in count and order. CURDATE() supplies the current date, and the sample department, salary, and name should be adjusted.' },
  ],
  'delete': [
    { title: 'Exercise 1 · Guided', hint: 'NULL is checked with IS NULL. Consider previewing the matching rows with SELECT before deleting.', answer: `DELETE FROM departments\nWHERE location IS NULL;`, explanation: 'The WHERE clause limits the deletion to departments whose location is missing. Without it, every row would be deleted.' },
    { title: 'Exercise 2 · Independent', hint: 'Target employee_projects and test role with IS NULL. A SELECT with the same WHERE clause can verify the rows first.', answer: `DELETE FROM employee_projects\nWHERE role IS NULL;`, explanation: 'This removes only assignment rows without a role. The condition is scoped to the requested table.' },
  ],
  'drop-table': [
    { title: 'Exercise 1 · Guided', hint: 'Use CREATE TABLE, INSERT one sample row, then DROP TABLE IF EXISTS. Run the destructive statement only after verifying the table name.', answer: `CREATE TABLE temp_test (id INT PRIMARY KEY, note VARCHAR(100));\nINSERT INTO temp_test (id, note) VALUES (1, 'sample');\nDROP TABLE IF EXISTS temp_test;`, explanation: 'IF EXISTS prevents an error if the table is already absent. DROP TABLE removes both the table definition and its stored rows.' },
    { title: 'Exercise 2 · Independent', hint: 'Create the backup from the original with CREATE TABLE ... LIKE and INSERT ... SELECT before dropping the original.', answer: `CREATE TABLE meeting_rooms_backup LIKE meeting_rooms;\nINSERT INTO meeting_rooms_backup\nSELECT * FROM meeting_rooms;\nSELECT COUNT(*) FROM meeting_rooms_backup;\nDROP TABLE meeting_rooms;`, explanation: 'LIKE copies the table structure, and INSERT ... SELECT copies its rows. Verify the backup before dropping the original.' },
  ],
  'alter-table': [
    { title: 'Exercise 1 · Guided', hint: 'Use ALTER TABLE with ADD COLUMN. A BOOLEAN column can use FALSE as its default.', answer: `ALTER TABLE projects\nADD COLUMN budget_approved BOOLEAN NOT NULL DEFAULT FALSE;`, explanation: 'The new column is non-NULL and existing rows receive the specified default.' },
    { title: 'Exercise 2 · Independent', hint: 'Add employee_count first. Then update each department from a correlated COUNT query filtered by matching department_id.', answer: `ALTER TABLE departments\nADD COLUMN employee_count INT NOT NULL DEFAULT 0;\n\nUPDATE departments AS d\nSET employee_count = (\n  SELECT COUNT(*)\n  FROM employees AS e\n  WHERE e.department_id = d.department_id\n);`, explanation: 'The correlated subquery computes the employee count for the department currently being updated. Departments with no employees receive zero.' },
  ],
  'primary-foreign-keys': [
    { title: 'Exercise 1 · Guided', hint: 'Inspect the table definition for FOREIGN KEY clauses and identify each referenced table and column.', answer: `employee_projects.employee_id → employees.employee_id\nemployee_projects.project_id → projects.project_id\nThis junction table represents the many-to-many relationship between employees and projects.`, explanation: 'Each foreign key points to one parent row. The junction table turns the many-to-many relationship into two one-to-many relationships.' },
    { title: 'Exercise 2 · Independent', hint: 'Department 1 has employee rows in the lesson data. Check the foreign-key constraint from employees.department_id to departments.department_id.', answer: `With the usual restrictive foreign-key action, MySQL rejects the DELETE because employees still reference department_id = 1. The delete would work after those employee rows were reassigned or removed, or if the constraint explicitly used an action such as ON DELETE CASCADE.`, explanation: 'The foreign key prevents the parent department from being removed while child employee rows still point to it. The configured ON DELETE action determines the exact behavior.' },
    { title: 'Exercise 3 · Challenge', hint: 'Define the primary key first, then add one foreign key for assigned_to and one for project_id. Use matching integer types.', answer: `CREATE TABLE tasks (\n  task_id INT AUTO_INCREMENT PRIMARY KEY,\n  task_name VARCHAR(200) NOT NULL,\n  assigned_to INT,\n  project_id INT,\n  FOREIGN KEY (assigned_to) REFERENCES employees(employee_id),\n  FOREIGN KEY (project_id) REFERENCES projects(project_id)\n);`, explanation: 'Each foreign key column uses the same type as the referenced primary key. The constraints prevent tasks from pointing to missing employees or projects.' },
  ],
  'distinct-null-strings': [
    { title: 'DISTINCT · Exercise 1', hint: 'Select manager_id from employees and apply DISTINCT. Filter out NULL because the prompt asks for people who manage others.', answer: `SELECT DISTINCT manager_id\nFROM employees\nWHERE manager_id IS NOT NULL;`, explanation: 'DISTINCT removes repeated manager IDs. The NULL filter keeps the result to people who manage at least one employee.' },
    { title: 'DISTINCT · Exercise 2', hint: 'Put both location and department_name in the SELECT DISTINCT list, then sort by location.', answer: `SELECT DISTINCT location, department_name\nFROM departments\nORDER BY location;`, explanation: 'DISTINCT applies to the pair of selected values, so rows are unique by the location and department-name combination.' },
    { title: 'DISTINCT · Exercise 3', hint: 'COUNT(DISTINCT role) counts unique non-NULL roles.', answer: `SELECT COUNT(DISTINCT role) AS unique_role_count\nFROM employee_projects;`, explanation: 'The DISTINCT modifier removes duplicates before COUNT. COUNT(expression) does not count NULL values.' },
    { title: 'NULL handling · Exercise 1', hint: 'Filter manager_id with IS NULL and return the requested name and manager columns.', answer: `SELECT first_name, last_name, manager_id\nFROM employees\nWHERE manager_id IS NULL;`, explanation: 'IS NULL is the correct predicate for missing manager assignments; = NULL does not work.' },
    { title: 'NULL handling · Exercise 2', hint: 'Conditional aggregation can produce both counts in one row. Use SUM(manager_id IS NULL) and SUM(manager_id IS NOT NULL).', answer: `SELECT SUM(manager_id IS NOT NULL) AS with_manager,\n       SUM(manager_id IS NULL) AS without_manager\nFROM employees;`, explanation: 'In MySQL, each boolean condition evaluates to 1 or 0, so SUM counts rows satisfying that condition.' },
    { title: 'NULL handling · Exercise 3', hint: 'Group the salary alternatives with parentheses: salary IS NULL OR salary < 60000. Use a boolean sort key to put NULLs last.', answer: `SELECT first_name, last_name, salary\nFROM employees\nWHERE salary IS NULL OR salary < 60000\nORDER BY salary IS NULL, salary;`, explanation: 'The predicate includes missing salaries and known salaries below the threshold. In ascending order, FALSE sorts before TRUE, so the boolean expression places NULL rows last.' },
    { title: 'String functions · Exercise 1', hint: 'Use LOWER(department_name) in the result and order by the displayed lowercase name.', answer: `SELECT LOWER(department_name) AS department_name\nFROM departments\nORDER BY department_name;`, explanation: 'LOWER converts the displayed value to lowercase. The alias makes the result easier to read.' },
    { title: 'String functions · Exercise 2', hint: 'Use LOWER with LIKE so matching does not depend on the case in the stored last name.', answer: `SELECT CONCAT(first_name, ' ', last_name) AS full_name\nFROM employees\nWHERE LOWER(last_name) LIKE '%a%';`, explanation: 'Converting to lowercase makes the pattern case-insensitive for the letter a. The surrounding percent signs allow it anywhere in the name.' },
    { title: 'String functions · Exercise 3', hint: 'Concatenate LOWER(first_name), a dot, LOWER(last_name), and the fixed domain.', answer: `SELECT first_name, last_name,\n       CONCAT(LOWER(first_name), '.', LOWER(last_name), '@company.com') AS email_address\nFROM employees;`, explanation: 'CONCAT assembles the parts into one string, while LOWER normalizes both names before the address is formed.' },
  ],
  'joins': [
    { title: 'INNER JOIN · Exercise 1', hint: 'Alias employees twice: one alias for the employee and one for the manager. Match manager_id to the manager row’s employee_id.', answer: `SELECT e.first_name AS employee_first_name,\n       e.last_name AS employee_last_name,\n       m.first_name AS manager_first_name,\n       m.last_name AS manager_last_name\nFROM employees AS e\nLEFT JOIN employees AS m ON m.employee_id = e.manager_id;`, explanation: 'This is a self-join. LEFT JOIN preserves employees who have no manager and returns NULL manager columns for them.' },
    { title: 'INNER JOIN · Exercise 2', hint: 'Join projects to employee_projects, group by project, and count assignment rows.', answer: `SELECT p.project_name, COUNT(ep.employee_id) AS employee_count\nFROM projects AS p\nJOIN employee_projects AS ep ON ep.project_id = p.project_id\nGROUP BY p.project_id, p.project_name;`, explanation: 'The inner join includes projects with at least one assignment. Grouping by the project key produces one count per project.' },
    { title: 'INNER JOIN · Exercise 3', hint: 'Join employees to departments on department_id and filter the department location to San Francisco.', answer: `SELECT e.first_name, e.last_name, e.salary, d.department_name\nFROM employees AS e\nJOIN departments AS d ON d.department_id = e.department_id\nWHERE d.location = 'San Francisco'\nORDER BY e.salary DESC;`, explanation: 'The join supplies the department location and name. The WHERE clause filters that joined result before sorting by salary.' },
    { title: 'LEFT JOIN · Exercise 1', hint: 'Start with projects and LEFT JOIN assignments. Count a nullable assignment column, not COUNT(*), so projects without matches show zero.', answer: `SELECT p.project_name, COUNT(ep.employee_id) AS employee_count\nFROM projects AS p\nLEFT JOIN employee_projects AS ep ON ep.project_id = p.project_id\nGROUP BY p.project_id, p.project_name;`, explanation: 'LEFT JOIN keeps every project. COUNT(ep.employee_id) ignores the NULL placeholder row for unmatched projects and returns zero.' },
    { title: 'LEFT JOIN · Exercise 2', hint: 'Start from departments, LEFT JOIN employees, then keep rows where the employee key is NULL.', answer: `SELECT d.department_name\nFROM departments AS d\nLEFT JOIN employees AS e ON e.department_id = d.department_id\nWHERE e.employee_id IS NULL;`, explanation: 'The NULL check finds departments for which the outer join could not find a matching employee.' },
    { title: 'LEFT JOIN · Exercise 3', hint: 'Start from employees so every employee stays in the result, then LEFT JOIN assignments and projects. Count the assignment key.', answer: `SELECT e.employee_id, e.first_name, e.last_name,\n       COUNT(ep.project_id) AS project_count\nFROM employees AS e\nLEFT JOIN employee_projects AS ep ON ep.employee_id = e.employee_id\nLEFT JOIN projects AS p ON p.project_id = ep.project_id\nGROUP BY e.employee_id, e.first_name, e.last_name;`, explanation: 'Both joins preserve employees with no assignments. COUNT(ep.project_id) returns zero for those employees.' },
    { title: 'RIGHT JOIN · Exercise 1', hint: 'Keep projects as the preserved table in both forms. Count the nullable assignment key so projects without matches show zero.', answer: `SELECT p.project_name, COUNT(ep.employee_id) AS employee_count\nFROM employee_projects AS ep\nRIGHT JOIN projects AS p ON p.project_id = ep.project_id\nGROUP BY p.project_id, p.project_name;\n\nSELECT p.project_name, COUNT(ep.employee_id) AS employee_count\nFROM projects AS p\nLEFT JOIN employee_projects AS ep ON ep.project_id = p.project_id\nGROUP BY p.project_id, p.project_name;`, explanation: 'RIGHT JOIN preserves every project on the right. Reversing the table order and using LEFT JOIN preserves the same rows and gives the equivalent result.' },
    { title: 'RIGHT JOIN · Exercise 2', hint: 'Keep projects with RIGHT JOIN, then filter for a NULL assignment key.', answer: `SELECT p.project_name\nFROM employee_projects AS ep\nRIGHT JOIN projects AS p ON p.project_id = ep.project_id\nWHERE ep.project_id IS NULL;`, explanation: 'Unmatched project rows receive NULL values for the employee_projects columns, which identifies projects with no employees assigned.' },
    { title: 'RIGHT JOIN · Exercise 3', hint: 'The RIGHT JOIN preserves employee_projects, so start the rewrite from that table and LEFT JOIN each lookup table.', answer: `-- Original query: the RIGHT JOIN preserves employee_projects\nSELECT e.first_name, d.department_name, p.project_name\nFROM employees AS e\nLEFT JOIN departments AS d ON e.department_id = d.department_id\nRIGHT JOIN employee_projects AS ep ON e.employee_id = ep.employee_id\nLEFT JOIN projects AS p ON ep.project_id = p.project_id;\n\n-- Equivalent version using only LEFT JOINs\nSELECT e.first_name, d.department_name, p.project_name\nFROM employee_projects AS ep\nLEFT JOIN employees AS e ON e.employee_id = ep.employee_id\nLEFT JOIN departments AS d ON e.department_id = d.department_id\nLEFT JOIN projects AS p ON ep.project_id = p.project_id;`, explanation: 'Mixing LEFT and RIGHT JOIN makes it harder to see which rows survive each step. Starting with employee_projects makes the preserved set clear; the LEFT JOINs retain every assignment and add matching employee, department, and project details.' },
  ],
  substring: [
    { title: 'Exercise 1 · Guided', hint: 'Use UPPER around SUBSTRING(last_name, 1, 1). Sort by the derived first_letter alias.', answer: `SELECT last_name, UPPER(SUBSTRING(last_name, 1, 1)) AS first_letter\nFROM employees\nORDER BY first_letter;`, explanation: 'SUBSTRING starts at position 1 and returns one character. UPPER normalizes it before sorting.' },
    { title: 'Exercise 2 · Independent', hint: 'SUBSTRING(project_name, 1, 10) returns up to the first ten characters; shorter strings are returned as-is.', answer: `SELECT project_name, SUBSTRING(project_name, 1, 10) AS short_name\nFROM projects;`, explanation: 'When the requested length goes past the end of a string, SUBSTRING returns the available characters without padding.' },
    { title: 'Exercise 3 · Challenge', hint: 'Use RIGHT(email, 3) for the final characters and COALESCE to replace a NULL email with N/A.', answer: `SELECT email, COALESCE(RIGHT(email, 3), 'N/A') AS extension\nFROM employees;`, explanation: 'RIGHT returns the last three characters. COALESCE handles missing email values before RIGHT would otherwise return NULL.' },
  ],
  'create-table': [
    { title: 'Exercise 1 · Guided', hint: 'Use INT AUTO_INCREMENT PRIMARY KEY for the identifier, VARCHAR(150) NOT NULL for the title, DATE NOT NULL, and a BOOLEAN default.', answer: `CREATE TABLE meetings (\n  meeting_id INT AUTO_INCREMENT PRIMARY KEY,\n  meeting_title VARCHAR(150) NOT NULL,\n  meeting_date DATE NOT NULL,\n  room_number INT,\n  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE\n);`, explanation: 'The primary key uniquely identifies each meeting. Required fields use NOT NULL; room_number remains optional.' },
    { title: 'Exercise 2 · Independent', hint: 'Add UNIQUE to the required title. DECIMAL(6,2) stores two fractional digits; a CHECK can enforce a positive price in MySQL 8.0.16 and later.', answer: `CREATE TABLE books (\n  book_id INT AUTO_INCREMENT PRIMARY KEY,\n  title VARCHAR(200) NOT NULL UNIQUE,\n  author VARCHAR(100) NOT NULL,\n  publication_year INT,\n  price DECIMAL(6,2) NOT NULL CHECK (price > 0),\n  available BOOLEAN NOT NULL DEFAULT TRUE\n);`, explanation: 'The unique constraint prevents duplicate titles, and CHECK enforces the positive-price rule on MySQL versions that enforce CHECK constraints.' },
    { title: 'Exercise 3 · Challenge', hint: 'Create customers and products first, then define order_id as the primary key and reference both parent keys. Use DEFAULT CURRENT_TIMESTAMP for the order date.', answer: `CREATE TABLE customers (\n  customer_id INT AUTO_INCREMENT PRIMARY KEY,\n  customer_name VARCHAR(100) NOT NULL\n);\n\nCREATE TABLE products (\n  product_id INT AUTO_INCREMENT PRIMARY KEY,\n  product_name VARCHAR(100) NOT NULL\n);\n\nCREATE TABLE orders (\n  order_id INT AUTO_INCREMENT PRIMARY KEY,\n  customer_id INT NOT NULL,\n  product_id INT NOT NULL,\n  quantity INT NOT NULL CHECK (quantity >= 1),\n  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (customer_id) REFERENCES customers(customer_id),\n  FOREIGN KEY (product_id) REFERENCES products(product_id)\n);`, explanation: 'Create the parent tables first so the referenced keys exist. The foreign keys protect those relationships; the quantity check prevents values below one on MySQL versions that enforce CHECK constraints.' },
  ],
}

const MYSQL_MUST_INCLUDE = {
  avg: [
    ['COUNT(*)', 'COUNT(budget)', 'AVG(budget)', 'FROM projects'],
  ],
  'create-table': [
    ['CREATE TABLE meetings', 'AUTO_INCREMENT', 'PRIMARY KEY', 'VARCHAR(150)', 'NOT NULL', 'DEFAULT FALSE'],
    ['CREATE TABLE books', 'AUTO_INCREMENT', 'PRIMARY KEY', 'VARCHAR(200)', 'UNIQUE', 'DECIMAL(6,2)', 'CHECK', 'DEFAULT TRUE'],
    ['CREATE TABLE customers', 'CREATE TABLE products', 'CREATE TABLE orders', 'AUTO_INCREMENT', 'FOREIGN KEY', 'REFERENCES customers', 'REFERENCES products', 'CHECK', 'CURRENT_TIMESTAMP'],
  ],
}

function inferMustInclude(answer = '') {
  const requirements = new Set()
  const clausePatterns = [
    [/^SELECT\b/i, 'SELECT'],
    [/^INSERT\s+INTO\s+([\w]+)/i, (_, table) => `INSERT INTO ${table}`],
    [/^UPDATE\s+([\w]+)/i, (_, table) => `UPDATE ${table}`],
    [/^DELETE\s+FROM\s+([\w]+)/i, (_, table) => `DELETE FROM ${table}`],
    [/^CREATE\s+TABLE\s+([\w]+)/i, (_, table) => `CREATE TABLE ${table}`],
    [/^ALTER\s+TABLE\s+([\w]+)/i, (_, table) => `ALTER TABLE ${table}`],
    [/^DROP\s+TABLE\s+([\w]+)/i, (_, table) => `DROP TABLE ${table}`],
    [/^FROM\s+([\w]+)/i, (_, table) => `FROM ${table}`],
    [/^WHERE\b/i, 'WHERE'],
    [/^GROUP\s+BY\b/i, 'GROUP BY'],
    [/^HAVING\b/i, 'HAVING'],
    [/^ORDER\s+BY\b/i, 'ORDER BY'],
    [/^LIMIT\b/i, 'LIMIT'],
    [/^OFFSET\b/i, 'OFFSET'],
    [/^(?:INNER|LEFT|RIGHT|CROSS)?\s*JOIN\b/i, 'JOIN'],
    [/^VALUES\b/i, 'VALUES'],
    [/^SET\b/i, 'SET'],
    [/^ON\b/i, 'ON'],
    [/^UNION\b/i, 'UNION'],
    [/^WITH\b/i, 'WITH'],
    [/^COMMIT\b/i, 'COMMIT'],
    [/^ROLLBACK\b/i, 'ROLLBACK'],
  ]

  for (const line of String(answer).replace(/\r/g, '').split('\n')) {
    const text = line.trim()
    for (const [pattern, value] of clausePatterns) {
      const match = text.match(pattern)
      if (match) requirements.add(typeof value === 'function' ? value(...match) : value)
    }
  }

  const normalizedAnswer = String(answer).toUpperCase()
  for (const token of ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'CASE', 'COALESCE', 'SUBSTRING', 'ROW_NUMBER', 'RANK', 'IS NULL', 'IS NOT NULL', 'NOT BETWEEN', 'BETWEEN', 'LIMIT', 'OFFSET', 'JOIN', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'NOT NULL', 'AUTO_INCREMENT', 'CHECK']) {
    if (normalizedAnswer.includes(token)) requirements.add(token)
  }
  return [...requirements]
}

export function getMysqlStudySupport(topicId) {
  return (MYSQL_STUDY_SUPPORT[topicId] || []).map((item, index) => ({
    ...item,
    mustInclude: item.mustInclude || MYSQL_MUST_INCLUDE[topicId]?.[index] || inferMustInclude(item.answer),
  }))
}


const MYSQL_PREDICT_ANSWERS = {
  'alter-table': [
    { answer: 'Renaming the column keeps its existing values. The column changes name; its stored data is not cleared.', explanation: 'RENAME COLUMN changes the schema metadata. It does not replace or rewrite each row value.' },
  ],
  count: [
    { answer: 'It returns the number of distinct, non-NULL salary values.', explanation: 'COUNT(DISTINCT salary) removes duplicate salaries and COUNT ignores NULL values.' },
  ],
  'create-table': [
    { answer: 'The insert is rejected because age = 15 violates the age-at-least-18 CHECK constraint.', explanation: 'MySQL enforces CHECK constraints starting with 8.0.16. Earlier MySQL 8.0 releases accepted CHECK syntax but ignored the constraint, so this row could be inserted there.' },
  ],
  delete: [
    { answer: `Use the same predicate in a count query before deleting:\n\nSELECT COUNT(*) AS matching_employees\nFROM employees\nWHERE salary < 60000.00\n  AND hire_date > '2023-01-01';`, explanation: 'The count is determined by both conditions being true for the same row. Previewing the match count is a useful safety step before DELETE.' },
  ],
  'distinct-null-strings': [
    { answer: 'The identical first_name and last_name combination appears once in the result.', explanation: 'DISTINCT applies to the full selected row. It removes duplicate name pairs, not just duplicate first names.' },
    { answer: 'MIN(manager_id) returns the smallest non-NULL manager ID. It ignores NULL values.', explanation: 'MIN skips NULL inputs. If every manager_id is NULL, the aggregate result is NULL.' },
    { answer: 'UPPER(NULL) returns NULL.', explanation: 'String functions generally return NULL when their input expression is NULL.' },
  ],
  'drop-table': [
    { answer: 'The recreated table starts a new AUTO_INCREMENT sequence, normally at 1 unless a different starting value is specified.', explanation: 'DROP TABLE removes the old table definition and its counter. Creating a new table with the same name does not restore the old sequence.' },
  ],
  filtering: [
    { answer: `Count the rows that satisfy the exact predicate:\n\nSELECT COUNT(*) AS matching_employees\nFROM employees\nWHERE last_name NOT LIKE 'M%';`, explanation: 'NOT LIKE excludes last names beginning with M. The count is based on the rows in the lesson dataset.' },
  ],
  'group-by': [
    { answer: 'With ONLY_FULL_GROUP_BY enabled, MySQL rejects the query because first_name is neither grouped nor aggregated. If that mode is disabled, the chosen first_name can be nondeterministic.', explanation: 'A group can contain several employees, so there is no single first_name value unless the query defines how to choose one.' },
  ],
  'having-where': [
    { answer: 'Yes. WHERE can filter individual rows before grouping, and HAVING can filter the resulting groups using the same column or an aggregate.', explanation: 'The two clauses run at different stages. For example, WHERE salary > 70000 filters employees first; HAVING AVG(salary) > 80000 filters groups afterward.' },
  ],
  insert: [
    { answer: 'The table will contain 13 rows: the original 10 plus the 3 inserted departments.', explanation: 'A multi-row INSERT adds one row for each VALUES tuple.' },
  ],
  joins: [
    { answer: 'The result has one row per matching employee-project assignment for employees in department 1. Use COUNT(*) with the same joins and WHERE clause to get the exact row count.', explanation: 'Joining through employee_projects creates one result row for each assignment, so an employee assigned to several projects appears several times.' },
    { answer: 'COUNT(e.employee_id) ignores the NULL employee key in the unmatched LEFT JOIN row and returns zero. COUNT(*) still counts that preserved department row, so it returns one.', explanation: 'COUNT(column) skips NULL values; COUNT(*) counts every output row, including the NULL-extended row produced by LEFT JOIN.' },
    { answer: 'RIGHT JOIN offers the same outer-join behavior when the table to preserve is written on the right. It can be rewritten as LEFT JOIN by swapping table order; teams often choose LEFT JOIN because its preserved side is easier to scan.', explanation: 'RIGHT JOIN is a syntax alternative. Both forms are useful to understand, while keeping one consistent style can make multi-join queries easier to read.' },
  ],
  limit: [
    { answer: 'Use LIMIT 10 OFFSET 40 (or LIMIT 40, 10).', explanation: 'Page 5 starts after four pages of ten rows, so the query skips 40 rows and returns the next 10.' },
  ],
  'order-by': [
    { answer: 'It lists hire dates from earliest to latest. In MySQL, NULL dates sort before known dates in ascending order.', explanation: 'ASC is the default sort direction. Add an explicit NULL sort expression if missing dates should appear last.' },
  ],
  'primary-foreign-keys': [
    { answer: 'The DELETE is rejected while employee rows still reference that department under the default RESTRICT behavior.', explanation: 'The foreign key prevents an orphaned employee.department_id. Reassign or remove the child rows first, or choose an explicit ON DELETE action.' },
  ],
  'select-from-where': [
    { answer: 'The query returns eight employees in the sample data: five in department 1 and three in department 2.', explanation: 'The two department IDs are joined with OR, so a row matching either one is returned once.' },
  ],
  substring: [
    { answer: 'It returns Hello.', explanation: 'SUBSTRING returns the characters that exist from position 1 up to the requested length. It does not pad the value to 100 characters.' },
  ],
}

export function getMysqlInlineReveal(topicId, index) {
  return MYSQL_PREDICT_ANSWERS[topicId]?.[index] || null
}

