# 14 — Query Strings (`req.query`)

> **Goal:** Read optional filters from the URL (`?limit=2&sort=desc`) using
> `req.query`, and implement limit, search, sort and pagination.

---

## 1. What Is a Query String?

The part of the URL after `?`:

```
http://localhost:5000/api/posts?limit=2&sort=desc
                                ^^^^^^^^^^^^^^^^^
                                  query string
```

- Starts with `?`
- Pairs are `key=value`
- Pairs are separated by `&`

Express parses it automatically into `req.query`:

```js
// URL: /api/posts?limit=2&sort=desc
req.query  // { limit: '2', sort: 'desc' }
```

---

## 2. When to Use Query vs Params

| Use **path param** | Use **query string** |
|--------------------|----------------------|
| Identify one specific resource | Optional modifiers of a collection |
| `/posts/5` | `/posts?author=asha` |
| Required | Optional |
| Part of the resource identity | Filtering, sorting, searching, paging |

Rule of thumb: *"Which one?" → params. "How do you want the list?" → query.*

---

## 3. Basic Usage

```js
app.get('/api/posts', (req, res) => {
  console.log(req.query);
  res.json(posts);
});
```

Visit `/api/posts?limit=2&page=3` and look at the console:

```
{ limit: '2', page: '3' }
```

Again: values are **strings**.

---

## 4. Implementing `limit`

```js
app.get('/api/posts', (req, res) => {
  const limit = parseInt(req.query.limit, 10);

  if (!isNaN(limit) && limit > 0) {
    return res.json(posts.slice(0, limit));
  }

  res.json(posts);
});
```

### Explanation

- `parseInt(undefined, 10)` → `NaN` (when no `limit` provided).
- `!isNaN(limit) && limit > 0` → valid positive number.
- `posts.slice(0, limit)` returns the first `limit` items **without modifying** the array.

| URL | Result |
|-----|--------|
| `/api/posts` | all posts |
| `/api/posts?limit=2` | first two |
| `/api/posts?limit=0` | all (ignored) |
| `/api/posts?limit=abc` | all (ignored) |

### Prerequisite: `slice` vs `splice`

| Method | Changes original? | Meaning |
|--------|-------------------|---------|
| `slice(start, end)` | No | Returns a copy of part (end not included) |
| `splice(start, deleteCount, ...items)` | **Yes** | Removes/inserts in place |

```js
[10,20,30,40].slice(1, 3)    // [20, 30]
[10,20,30,40].slice(0, 2)    // [10, 20]
```

---

## 5. Multiple Query Parameters

```js
// /api/posts?search=one&sort=desc&limit=5
app.get('/api/posts', (req, res) => {
  const { search, sort = 'asc', limit } = req.query;

  let result = [...posts];            // copy so we never mutate the source

  if (search) {
    const term = String(search).toLowerCase();
    result = result.filter((p) => p.title.toLowerCase().includes(term));
  }

  result.sort((a, b) => (sort === 'desc' ? b.id - a.id : a.id - b.id));

  const n = parseInt(limit, 10);
  if (n > 0) result = result.slice(0, n);

  res.json(result);
});
```

Key ideas:

- **Destructuring with defaults:** `sort = 'asc'` is used if missing.
- `[...posts]` makes a **shallow copy**. `Array.sort` mutates the array in place, so
  never sort your original data accidentally.
- `String(search)` protects against non-string values (see "arrays" below).
- `includes` does substring matching.

### Prerequisite: sorting numbers
```js
[3, 1, 2].sort((a, b) => a - b)   // [1, 2, 3]  ascending
[3, 1, 2].sort((a, b) => b - a)   // [3, 2, 1]  descending
```
Without a compare function `sort` compares as strings (`[10, 2].sort()` → `[10, 2]`).

---

## 6. Pagination

Large lists should be returned in pages.

```
/api/posts?page=2&limit=10
```

Formula:

```
skip  = (page - 1) * limit
items = all.slice(skip, skip + limit)
```

```js
app.get('/api/posts', (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const total = posts.length;
  const start = (page - 1) * limit;
  const data = posts.slice(start, start + limit);

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data,
  });
});
```

Notes:
- `|| 1` supplies a default when parsing gives `NaN`.
- `Math.min(..., 100)` caps the maximum page size.

> 🔐 **Always cap `limit`.** If the client can ask for `limit=10000000`, one request can
> eat your memory/CPU — a simple denial-of-service vector.

### SQL parallel (you know MySQL)
```sql
SELECT * FROM posts ORDER BY id DESC LIMIT 10 OFFSET 20;
```
`LIMIT` = page size, `OFFSET` = skip. Same math.

---

## 7. Special Cases in Query Parsing

### Repeated keys → array
```
/api/posts?tag=node&tag=express
req.query.tag  // ['node', 'express']
```

### Nested objects (extended parser in Express 4)
```
/api/posts?filter[author]=asha
req.query  // { filter: { author: 'asha' } }   (Express 4 default "extended")
```
In **Express 5** the default query parser is **"simple"** (Node's `querystring`), so nested
syntax is not parsed automatically. You can change it:

```js
app.set('query parser', 'extended');
```

### Keys without values
```
/api/posts?debug
req.query  // { debug: '' }
```

### URL encoding
Special characters are encoded as `%XX`:

| Char | Encoded |
|------|---------|
| space | `%20` or `+` |
| `&` | `%26` |
| `=` | `%3D` |
| `é` | `%C3%A9` |

Express decodes them for you. In the browser use `encodeURIComponent('a&b')` when you
build URLs by hand, or `URLSearchParams`:

```js
const params = new URLSearchParams({ search: 'node js', limit: 5 });
fetch(`/api/posts?${params}`);   // /api/posts?search=node+js&limit=5
```

---

## 8. Type Safety and Security 🔐

Query values can be **strings, arrays or objects** — the attacker chooses.

```js
// /api/posts?search[]=a&search[]=b
req.query.search   // ['a', 'b']   -> .toLowerCase() is not a function -> crash (500)
```

Defences:

```js
const search = typeof req.query.search === 'string' ? req.query.search : '';
```

Other considerations:
- **SQL injection:** never interpolate query values into SQL; use `?` placeholders.
- **Whitelist sort fields** (`sort=password` should not be possible):
  ```js
  const allowedSort = ['id', 'title'];
  const sortBy = allowedSort.includes(req.query.sortBy) ? req.query.sortBy : 'id';
  ```
- **Do not put secrets in query strings.** URLs end up in browser history, server logs,
  proxies and referrer headers. Use headers or body for tokens/passwords.
- **Limit size/length** of search strings.
- **Reflected XSS:** do not echo `req.query` back into HTML unescaped.

---

## 9. Combining Params and Query

```js
// /api/users/5/posts?limit=3
app.get('/api/users/:userId/posts', (req, res) => {
  const { userId } = req.params;
  const limit = Number(req.query.limit) || 10;
  res.json({ userId, limit });
});
```

---

## 10. Full Example

```js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

let posts = [
  { id: 1, title: 'Post One' },
  { id: 2, title: 'Post Two' },
  { id: 3, title: 'Post Three' },
  { id: 4, title: 'Express Tips' },
  { id: 5, title: 'Node Tricks' },
];

app.get('/api/posts', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';
  const sort = req.query.sort === 'desc' ? 'desc' : 'asc';
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  let result = posts.filter((p) => p.title.toLowerCase().includes(search));
  result.sort((a, b) => (sort === 'desc' ? b.id - a.id : a.id - b.id));

  const total = result.length;
  const start = (page - 1) * limit;
  result = result.slice(start, start + limit);

  res.json({ page, limit, total, data: result });
});

app.get('/api/posts/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: 'Not found' });
  res.json(post);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 11. Testing

| URL | What to verify |
|-----|----------------|
| `/api/posts` | All posts (up to 10) |
| `/api/posts?limit=2` | 2 items |
| `/api/posts?limit=2&page=2` | items 3–4 |
| `/api/posts?search=post` | Titles containing "post" |
| `/api/posts?sort=desc` | Highest id first |
| `/api/posts?limit=-5` | Falls back to default |
| `/api/posts?search[]=a` | No crash |

In Postman use the **Params** tab; each row becomes a query pair.

---

## 12. Reading Query on the Front End

```js
const params = new URLSearchParams(window.location.search);
const page = params.get('page') || 1;
```

`window.location.search` gives `?page=2&limit=5` of the *browser* URL, which is different
from the API URL, but the concept is the same.

---

## 13. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Treating `req.query.limit` as number | `'2' + 1 = '21'` | Convert first |
| Sorting the original array | Data order changes permanently | Copy with `[...arr]` |
| No upper bound on `limit` | Resource exhaustion | `Math.min(limit, MAX)` |
| Assuming a string | Crash on arrays | Check `typeof` |
| Using query for sensitive data | Leaks in logs | Use body/headers |
| Defining route twice (`/api/posts?limit` separately) | Query is not part of route matching | One route reads `req.query` |

**Important:** the query string is **not** part of the route path. `app.get('/api/posts?limit=2')`
does not work; the route is `/api/posts` and you read `req.query` inside it.

---

## 14. Exercises

1. Implement `limit` for `GET /api/posts`.
2. Add `search` (case-insensitive substring in title).
3. Add `sort=asc|desc` without mutating the original array.
4. Add pagination with `page` and `limit`, and a maximum limit of 50.
5. Handle repeated keys (`?tag=a&tag=b`) by always converting to an array:
   `const tags = [].concat(req.query.tag ?? []);`
6. Reject unknown sort fields using a whitelist.
7. Build a front-end page with a search input that calls `/api/posts?search=...`.

### Challenge
Add `fields` query: `/api/posts?fields=id,title` returns only those properties.
Whitelist allowed fields.

<details><summary>Hint</summary>

```js
const allowed = ['id', 'title', 'body'];
const wanted = String(req.query.fields || '').split(',').filter((f) => allowed.includes(f));
const pick = (o) => Object.fromEntries(wanted.map((k) => [k, o[k]]));
res.json(wanted.length ? data.map(pick) : data);
```
</details>

---

## 15. Quick Quiz

1. What character starts a query string?
2. What type are the values in `req.query` by default?
3. Difference between `slice` and `splice`?
4. Why cap the `limit`?
5. What does `/x?a=1&a=2` produce in `req.query.a`?
6. Why avoid secrets in query strings?
7. Write the formula for the starting index of page `p` with size `l`.

<details><summary>Answers</summary>

1. `?`
2. Strings (or arrays/objects).
3. `slice` copies, `splice` mutates.
4. To prevent heavy requests / DoS.
5. `['1', '2']`.
6. URLs are logged and stored in history.
7. `(p - 1) * l`.
</details>

---

## 16. Summary

- Query strings carry optional modifiers: `?key=value&key2=value2`.
- Express exposes them in `req.query`; values are strings, arrays or objects.
- Use them for filtering, searching, sorting and pagination.
- Validate type, whitelist fields, cap sizes, and never trust the input.
- The query string is not part of the route path.

---

## 17. Next Lesson

➡️ **15 — Setting Status Codes**
Use `res.status()` correctly so clients understand what happened.
