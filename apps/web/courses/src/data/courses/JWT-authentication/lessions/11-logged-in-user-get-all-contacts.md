# 11 — Logged-in User: Get All Contacts

> **Goal:** Implement `GET /api/contacts` and `GET /api/contacts/:id` so a logged-in
> user sees only their own contacts, with safe pagination, sorting, and search.

---

## 1. The Core Idea: Scope Every Query by Owner

```sql
-- ❌ Returns every user's contacts
SELECT id, name, email, phone FROM contacts;

-- ✅ Returns only the caller's contacts
SELECT id, name, email, phone FROM contacts WHERE user_id = ?;
```

The owner value comes from the verified JWT (`req.user.id`), never from a query
parameter or request body.

---

## 2. Basic List Endpoint

`controllers/contactController.js`:

```js
import { pool } from '../config/dbConnection.js';

export const getContacts = async (req, res) => {
  const [contacts] = await pool.execute(
    `SELECT id, name, email, phone, created_at AS createdAt,
            updated_at AS updatedAt
     FROM contacts
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [req.user.id]
  );

  res.status(200).json(contacts);
};
```

An empty array with status 200 is correct when the user has no contacts.

---

## 3. Pagination

```
GET /api/contacts?page=2&limit=10
```

```js
export const getContacts = async (req, res) => {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 100)
    : 10;
  const maxPage = Math.floor(Number.MAX_SAFE_INTEGER / limit);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, maxPage)
    : 1;
  const offset = (page - 1) * limit;

  const [contacts] = await pool.execute(
    `SELECT id, name, email, phone, created_at AS createdAt,
            updated_at AS updatedAt
     FROM contacts
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset]
  );
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM contacts WHERE user_id = ?',
    [req.user.id]
  );
  const total = Number(countRows[0].total);

  res.status(200).json({
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    data: contacts,
  });
};
```

The page size is capped to prevent unbounded responses. The owner filter is present in
both the list query and the count query.

---

## 4. Search and Sorting

```
GET /api/contacts?search=pri&sort=name
GET /api/contacts?sort=-createdAt
```

Values can be bound with `?`, but a SQL identifier such as an `ORDER BY` column cannot.
Build it only from a fixed allowlist:

```js
const SORT_COLUMNS = new Map([
  ['name', 'name'],
  ['email', 'email'],
  ['createdAt', 'created_at'],
]);

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

export const getContacts = async (req, res) => {
  const rawSort = typeof req.query.sort === 'string' ? req.query.sort : '-createdAt';
  const descending = rawSort.startsWith('-');
  const requestedField = descending ? rawSort.slice(1) : rawSort;
  const sortColumn = SORT_COLUMNS.get(requestedField) ?? 'created_at';
  const direction = descending ? 'DESC' : 'ASC';

  const values = [req.user.id];
  let searchSql = '';
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const term = `%${escapeLike(req.query.search.trim().slice(0, 50))}%`;
    searchSql = ` AND (name LIKE ? ESCAPE '\\\\' OR email LIKE ? ESCAPE '\\\\')`;
    values.push(term, term);
  }

  const [contacts] = await pool.execute(
    `SELECT id, name, email, phone, created_at AS createdAt,
            updated_at AS updatedAt
     FROM contacts
     WHERE user_id = ?${searchSql}
     ORDER BY ${sortColumn} ${direction}
     LIMIT 100`,
    values
  );
  res.status(200).json(contacts);
};
```

The SQL fragment uses only allowlisted column names and fixed sort directions.
Search terms are values and remain parameterized.

| Risk | Defense |
|------|---------|
| SQL injection through search | Bind search values with placeholders |
| SQL injection through sort | Allowlist columns and directions |
| Owner bypass | Always build `user_id` from `req.user.id` |
| Unbounded results | Cap limit |
| LIKE wildcard abuse | Escape `%`, `_`, and `\`; limit search length |

Never pass `req.query` directly into a SQL statement.

---

## 5. Get One Contact With an Ownership Check

```js
import { pool } from '../config/dbConnection.js';
import { HttpError } from '../utils/HttpError.js';

export const getContact = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HttpError(404, 'Contact not found');
  }

  const [rows] = await pool.execute(
    `SELECT id, name, email, phone, created_at AS createdAt,
            updated_at AS updatedAt
     FROM contacts
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [id, req.user.id]
  );

  if (rows.length === 0) throw new HttpError(404, 'Contact not found');
  res.status(200).json(rows[0]);
};
```

Including both `id` and `user_id` means a non-owned contact and a missing contact
produce the same 404 response. This avoids leaking the existence of another user's data.

---

## 6. Testing Data Isolation

1. Create users Asha and Ravi and create contacts for both.
2. Log in as Asha and request `GET /api/contacts`; only Asha's rows should appear.
3. Use Asha's token to request Ravi's contact ID; expect 404.
4. Repeat as Ravi; Ravi can read their own contact.
5. Call without a token; expect 401.

Inspect test rows in MySQL:

```sql
SELECT id, user_id, name, email FROM contacts ORDER BY user_id, id;
```

---

## 7. Security Notes 🔐

- Parameterize every request value with `pool.execute()`.
- For list, count, get, update, and delete queries, always include `user_id = req.user.id`.
- Do not allow a caller to provide `user_id` through URL, body, or query parameters.
- Whitelist SQL identifiers; placeholders are for values, not table/column names.
- Return only the fields the endpoint needs.
- Use 404 consistently for missing and non-owned contact IDs.

---

## 8. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `SELECT ... FROM contacts` without owner filter | Data leaks between users | Add `WHERE user_id = ?` |
| ID lookup without owner filter | IDOR/BOLA | Filter by both `id` and `user_id` |
| Interpolating `req.query.sort` | SQL injection | Map to an allowlisted column |
| Returning the entire table | Excessive memory and response size | Paginate and cap page size |
| Taking owner from request body | Caller can impersonate another owner | Use verified `req.user.id` |
| Query values concatenated into SQL | SQL injection | Use placeholders |

---

## 9. Summary

- Every contact read is scoped by the authenticated `user_id`.
- Use parameterized SQL for values and an allowlist for identifiers.
- Pagination, bounded search, and controlled sorting keep the endpoint safe.
- A single `WHERE id = ? AND user_id = ?` query combines lookup and authorization.
