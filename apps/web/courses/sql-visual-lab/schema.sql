-- A compact company database for practicing SELECT queries.
-- The dataset intentionally includes unassigned employees, empty departments,
-- nullable managers, and one NULL order amount so joins and NULL handling are visible.

PRAGMA foreign_keys = ON;

CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  salary INTEGER NOT NULL,
  hire_date TEXT NOT NULL,
  manager_id INTEGER REFERENCES employees(id)
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  amount REAL,
  order_date TEXT NOT NULL,
  status TEXT NOT NULL
);

INSERT INTO departments (id, name, location) VALUES
  (1, 'Engineering', 'Bengaluru'),
  (2, 'Product', 'Bengaluru'),
  (3, 'Data', 'Hyderabad'),
  (4, 'Design', 'Pune'),
  (5, 'Customer Success', 'Chennai'),
  (6, 'Sales', 'Mumbai'),
  (7, 'Operations', 'Bengaluru'),
  (8, 'Security', 'Hyderabad'),
  (9, 'Research', 'Pune'),
  (10, 'Legal', 'Mumbai');

INSERT INTO employees (id, name, department_id, salary, hire_date, manager_id) VALUES
  (1, 'Asha Rao', 1, 120000, '2021-02-15', NULL),
  (2, 'Ben Carter', 1, 98000, '2022-08-01', 1),
  (3, 'Chen Li', 2, 105000, '2020-11-10', NULL),
  (4, 'Divya Nair', 3, 112000, '2021-06-21', 3),
  (5, 'Ethan Cole', 4, 76000, '2023-01-09', 3),
  (6, 'Fatima Noor', 5, 69000, '2022-04-18', 3),
  (7, 'Gabriel Silva', 6, 88000, '2019-09-02', 1),
  (8, 'Hana Kim', 7, 82000, '2024-02-01', 1),
  (9, 'Imani Okafor', 3, 93000, '2023-03-13', 4),
  (10, 'Jae Park', NULL, 61000, '2024-07-22', NULL),
  (11, 'Kiran Patel', 1, 101000, '2021-09-06', 1),
  (12, 'Lucia Gomez', 5, 73000, '2023-05-30', 6);

INSERT INTO orders (id, employee_id, amount, order_date, status) VALUES
  (1, 2, 12500.00, '2024-01-12', 'completed'),
  (2, 1, 4800.00, '2024-01-18', 'completed'),
  (3, 3, 18200.00, '2024-02-02', 'pending'),
  (4, 4, 7600.00, '2024-02-11', 'completed'),
  (5, 5, 2350.00, '2024-02-22', 'cancelled'),
  (6, 6, 6400.00, '2024-03-01', 'completed'),
  (7, 7, 15200.00, '2024-03-07', 'pending'),
  (8, 8, 3900.00, '2024-03-15', 'completed'),
  (9, 9, 11100.00, '2024-03-28', 'completed'),
  (10, 2, 8900.00, '2024-04-03', 'pending'),
  (11, 11, 17800.00, '2024-04-10', 'completed'),
  (12, 12, 4200.00, '2024-04-16', 'pending'),
  (13, 1, 10200.00, '2024-04-21', 'shipped'),
  (14, 4, NULL, '2024-04-29', 'cancelled');
