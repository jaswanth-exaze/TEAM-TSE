# 12 — Logged-in User: Create New Contact

> **Goal:** Implement `POST /api/contacts` so a new row is owned by the authenticated
> user. Validate input, prevent mass assignment, and handle MySQL constraint errors.

---

## 1. The Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant V as validateToken
    participant H as createContact
    participant DB as MySQL
    C->>V: POST /api/contacts {name,email,phone} + Bearer token
    V->>V: verify token; set req.user.id
    V->>H: next()
    H->>H: validate and whitelist fields
    H->>DB: INSERT with user_id from token
    DB-->>H: insertId
    H-->>C: 201 contact
```

The owner comes from `req.user.id`, never the request body.

---

## 2. Prevent Mass Assignment

Mass assignment means copying every client-provided field into a database write.

```js
// ❌ A caller could set user_id, role, or other protected columns
const values = Object.values(req.body);

// ✅ Read only the public fields this endpoint accepts
const { name, email, phone } = req.body ?? {};
```

The SQL column list should be explicit too. Do not build an `INSERT` from arbitrary
body keys.

---

## 3. Validate Before Writing

```js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{6,20}$/;

const validateContact = ({ name, email, phone }) => {
  const details = [];

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    details.push({ field: 'name', message: 'must be a non-empty string up to 100 characters' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim()) || email.length > 254) {
    details.push({ field: 'email', message: 'must be a valid email address' });
  }
  if (typeof phone !== 'string' || !PHONE_RE.test(phone.trim())) {
    details.push({ field: 'phone', message: 'must be a valid phone number' });
  }

  return details;
};
```

The controller gives early, clear errors. The MySQL table's `NOT NULL`, length limits,
unique constraints, and foreign key remain a second integrity layer.

---

## 4. Create the Contact With a Prepared Statement

`controllers/contactController.js`:

```js
import { pool } from '../config/dbConnection.js';
import { HttpError } from '../utils/HttpError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{6,20}$/;

export const createContact = async (req, res) => {
  const { name, email, phone } = req.body ?? {};
  const errors = [];

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    errors.push({ field: 'name', message: 'invalid name' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim()) || email.length > 254) {
    errors.push({ field: 'email', message: 'valid email required' });
  }
  if (typeof phone !== 'string' || !PHONE_RE.test(phone.trim())) {
    errors.push({ field: 'phone', message: 'valid phone required' });
  }
  if (errors.length) throw new HttpError(400, 'Validation failed', errors);

  const normalizedEmail = email.trim().toLowerCase();
  const [result] = await pool.execute(
    'INSERT INTO contacts (user_id, name, email, phone) VALUES (?, ?, ?, ?)',
    [req.user.id, name.trim(), normalizedEmail, phone.trim()]
  );

  const [rows] = await pool.execute(
    `SELECT id, name, email, phone, created_at AS createdAt,
            updated_at AS updatedAt
     FROM contacts
     WHERE id = ? AND user_id = ?`,
    [result.insertId, req.user.id]
  );

  res.status(201).json(rows[0]);
};
```

The SQL text is fixed; the user ID and field values are bound separately. Even if a
malicious value contains SQL syntax, it remains data.

---

## 5. Handle MySQL Errors in the Central Error Handler

`ER_DUP_ENTRY` is MySQL's duplicate unique-key error. Map expected client-facing errors
without returning raw SQL or database details:

```js
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      status: 409,
      message: 'A record with that value already exists',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      status: 400,
      message: 'The referenced user does not exist',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 400, message: 'Invalid JSON in request body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ status: 413, message: 'Request body too large' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    status,
    message: status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
    ...(err.details && { details: err.details }),
  });
};
```

The `user_id` comes from a verified token, but the foreign key is still useful protection
if the user row is removed while a request is in flight.

---

## 6. Test the Endpoint

`POST /api/contacts`:

```json
{
  "name": "Priya",
  "email": "priya@x.com",
  "phone": "9876543210"
}
```

| # | Test | Expected |
|---|------|----------|
| 1 | Valid body, token A | 201; row has Asha's `user_id` |
| 2 | Same body with token B | 201; row has Ravi's `user_id` |
| 3 | No token | 401 |
| 4 | Missing `phone` | 400 |
| 5 | Invalid email | 400 |
| 6 | `name: 123` | 400 |
| 7 | Body contains another `user_id` | 201; supplied owner ignored |
| 8 | Body contains `"role": "admin"` | 201; extra field ignored |
| 9 | Invalid JSON | 400 |
| 10 | Oversized request | 413 |

Verify ownership in MySQL:

```sql
SELECT id, user_id, name, email FROM contacts WHERE email = ?;
```

---

## 7. Security Checklist 🔐

- The endpoint is behind `validateToken`.
- Validate required fields, types, and lengths before database work.
- Whitelist columns; never copy `req.body` into SQL.
- Use placeholders with `pool.execute()`.
- Set `user_id` from `req.user.id`.
- Do not return database errors or sensitive columns.
- Keep the foreign key and unique constraints enabled.

---

## 8. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Interpolating email or name into SQL | SQL injection | Bind values with placeholders |
| Accepting `user_id` from the body | Owner spoofing | Use `req.user.id` |
| Using `INSERT INTO contacts VALUES (...)` | Breaks when table columns change | Name the columns explicitly |
| Returning raw MySQL errors | Leaks schema and query details | Map known codes; hide 500 details |
| Relying only on pre-insert checks | Concurrent duplicates | Enforce unique constraints in MySQL |
| Returning all row columns | Internal fields leak | Select the public response fields |

---

## 9. Summary

- Validate input, whitelist fields, then insert with a parameterized statement.
- Ownership is set from the verified JWT identity.
- MySQL constraints enforce integrity even if application validation is bypassed.
- Map `ER_DUP_ENTRY` and foreign-key errors to safe client responses.
