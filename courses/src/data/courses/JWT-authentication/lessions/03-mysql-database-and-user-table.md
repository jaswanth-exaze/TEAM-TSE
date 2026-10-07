# 03 — MySQL Database and User Table

> **Goal:** Connect Express to MySQL with `mysql2`, create a relational `users` table,
> and use parameterized SQL for safe reads and writes.

---

## 1. Why a Database Now?

Registered users must survive server restarts, so we need persistent storage. In the
Posts API we used an in-memory array. Now we use **MySQL**, a relational database.

| Concept | MySQL |
|---------|-------|
| Database | `mycontacts` |
| Table | `users` |
| Row | One user |
| Column | `id`, `username`, `email`, `password` |
| Primary key | `id INT AUTO_INCREMENT` |
| Relationship | Foreign key, enforced by the database |
| Read/write | SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) |

Unlike a document database, MySQL checks the table's declared column types and
constraints. We still validate requests in the application to return useful errors.

---

## 2. Step 1 — Create the Database and User Table

Start MySQL locally or use a managed MySQL service, then open the MySQL client or
Workbench and run:

```sql
CREATE DATABASE mycontacts
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'mycontacts_app'@'127.0.0.1' IDENTIFIED BY 'use-a-local-secret';
GRANT SELECT, INSERT, UPDATE, DELETE ON mycontacts.* TO 'mycontacts_app'@'127.0.0.1';

USE mycontacts;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password VARCHAR(60) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email)
);
```

The unique constraint is enforced by MySQL, even if two registration requests arrive
at the same time. Keep database credentials out of source code; use a dedicated app
account with only the permissions it needs.

Check the table:

```sql
SHOW TABLES;
DESCRIBE users;
SELECT id, username, email, created_at FROM users;
```

---

## 3. Step 2 — Install `mysql2` and Configure `.env`

```bash
npm install mysql2
```

`.env`:

```dotenv
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mycontacts
DB_USER=mycontacts_app
DB_PASSWORD=use-a-local-secret
```

Load the environment variables with Node's built-in option:

```bash
node --env-file=.env server.js
```

Add `.env` to `.gitignore`. In production, set these values using the hosting
platform's secret settings rather than committing them.

---

## 4. Step 3 — Create a Reusable Connection Pool

`config/dbConnection.js`:

```js
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const connectDb = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log(`MySQL connected: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  } finally {
    connection?.release();
  }
};
```

Use it in `server.js` **before** starting the server:

```js
import express from 'express';
import userRoutes from './routes/userRoutes.js';
import { connectDb } from './config/dbConnection.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

await connectDb();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/users', userRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

The pool reuses connections across requests. Do not open a new database connection
inside each controller.

### Common connection errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED` | MySQL is not running or host/port is wrong | Start MySQL; verify `DB_HOST` and `DB_PORT` |
| `ER_ACCESS_DENIED_ERROR` | Wrong username/password or host grant | Check credentials and MySQL user permissions |
| `ER_BAD_DB_ERROR` | Database does not exist | Create `mycontacts`; verify `DB_NAME` |
| `DB_*` is undefined | `.env` was not loaded | Start Node with `--env-file=.env` |

---

## 5. Step 4 — Add User Queries

`models/userModel.js` keeps SQL out of controllers. These functions are ordinary
JavaScript functions backed by a relational table, not an ODM model.

```js
import { pool } from '../config/dbConnection.js';

const USER_FIELDS = `
  id,
  username,
  email,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

export const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    `SELECT ${USER_FIELDS} FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
};

export const findUserByEmailForLogin = async (email) => {
  const [rows] = await pool.execute(
    `SELECT id, username, email, password,
            created_at AS createdAt, updated_at AS updatedAt
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
};

export const findUserById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, username, email, created_at AS createdAt
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
};

export const createUser = async ({ username, email, password }) => {
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, password]
  );
  return findUserById(result.insertId);
};
```

`findUserByEmailForLogin` includes the password hash so `bcrypt` can compare it. Keep
that function internal to authentication; `findUserByEmail` and `findUserById` return
only public user columns.

### Why `?` placeholders matter 🔐

Never put request values directly into SQL:

```js
// ❌ SQL injection: request data changes the SQL statement
const sql = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ The SQL and its data are sent separately
const [rows] = await pool.execute(
  'SELECT id, email FROM users WHERE email = ?',
  [email]
);
```

The driver treats the placeholder value as data, not executable SQL. Use placeholders
for **every** user-supplied value. SQL identifiers (such as a column name in `ORDER BY`)
cannot be parameterized; map those from a strict allowlist.

---

## 6. SQL ↔ `mysql2` Cheat Sheet

| SQL | `mysql2/promise` |
|-----|------------------|
| `INSERT INTO users (...) VALUES (?, ?)` | `await pool.execute(sql, [value1, value2])` |
| `SELECT * FROM users` | `const [rows] = await pool.execute(sql)` |
| `SELECT * FROM users WHERE email = ?` | `pool.execute(sql, [email])` |
| `UPDATE users SET username = ? WHERE id = ?` | `pool.execute(sql, [username, id])` |
| `DELETE FROM users WHERE id = ?` | `pool.execute(sql, [id])` |
| `SELECT COUNT(*) ...` | Read the count from the returned row |
| `ORDER BY created_at DESC` | Include a validated column/direction in SQL |
| `LIMIT ? OFFSET ?` | `pool.execute(sql, [limit, offset])` |

`pool.execute()` returns a promise. For `SELECT`, it resolves to `[rows, fields]`.
For `INSERT`, `UPDATE`, and `DELETE`, it resolves to `[result, fields]`.

---

## 7. Step 5 — Map MySQL Errors

MySQL reports a duplicate unique value with code `ER_DUP_ENTRY`. A pre-check can make
the common error friendlier, but only the database constraint safely handles concurrent
requests:

```js
if (err.code === 'ER_DUP_ENTRY') {
  return res.status(409).json({
    status: 409,
    message: 'A record with that value already exists',
  });
}
```

Do not return raw SQL, connection details, or stack traces to clients in production.

---

## 8. Final Files for This Lesson

### `.env.example`

```dotenv
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mycontacts
DB_USER=mycontacts_app
DB_PASSWORD=replace-me
```

### `config/dbConnection.js`

Create the connection pool as shown in section 4 and export `pool` and `connectDb`.
The user query functions in `models/userModel.js` import and reuse that pool.

---

## 9. Quick Experiment

In a temporary route, import `createUser` and insert a test user with a placeholder
password, then inspect it from MySQL:

```sql
SELECT id, username, email, password
FROM users
WHERE email = 'test@example.com';
```

Delete the test row afterward:

```sql
DELETE FROM users WHERE email = 'test@example.com';
```

The next lesson replaces the placeholder password with a bcrypt hash.

---

## 10. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting `await connectDb()` | Requests fail because no database is available | Connect before `listen` |
| Building SQL with string concatenation | SQL injection | Use `pool.execute(sql, values)` |
| Returning every database column | Password hash or internal fields leak | Select only required columns |
| Skipping `UNIQUE(email)` | Duplicate accounts can be inserted | Add a unique constraint |
| Using an administrator DB account in the app | Unnecessary damage if credentials leak | Create a least-privilege account |
| Committing `.env` | Credential leak | Ignore it and rotate exposed credentials |
| Forgetting `.js` on local ESM imports | Module resolution error | Include the file extension |

---

## 11. Summary

- MySQL stores users in a typed `users` table with an auto-incrementing integer key.
- `mysql2/promise` provides a shared connection pool and async queries.
- `pool.execute()` with placeholders prevents SQL injection.
- Unique constraints and foreign keys are enforced by MySQL.
- Select only the fields the caller needs, especially around password hashes.
