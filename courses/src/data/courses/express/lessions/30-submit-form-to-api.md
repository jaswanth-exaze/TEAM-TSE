# 30 — Submit Form to API

> **Goal:** Collect user input with an HTML form and send it to the Express API in two
> ways: (1) JavaScript `fetch` with JSON, and (2) a classic form post
> (`application/x-www-form-urlencoded`). Add validation, feedback and basic security.

---

## 1. Why Forms Deserve Their Own Lesson

Every real application collects input: sign-up, login, contact, comments, search.
A form touches **every layer** you learned:

```
HTML form  →  browser builds request  →  Express parser  →  validation  →  controller  →  response  →  UI feedback
```

---

## 2. Prerequisite Concept: How an HTML Form Works

```html
<form action="/api/posts" method="POST">
  <input type="text" name="title" />
  <button type="submit">Send</button>
</form>
```

| Attribute | Meaning |
|-----------|---------|
| `action` | URL that receives the data (default: current page) |
| `method` | `GET` or `POST` only (HTML forms cannot send PUT/DELETE) |
| `enctype` | How the body is encoded (see below) |

### The `name` attribute is what the server sees
```html
<input id="title" />            <!-- ❌ no name: NOT submitted -->
<input name="title" />          <!-- ✅ submitted as title=... -->
```
`id` is for CSS/JS/labels; **`name` is the key sent to the server**.

### What the browser sends

**`method="GET"`** → data goes in the **query string**:
```
GET /search?q=express&page=1
```
**`method="POST"`** → data goes in the **body**; encoding depends on `enctype`:

| `enctype` | Content-Type | Use | Express parser |
|-----------|--------------|-----|----------------|
| *(default)* | `application/x-www-form-urlencoded` | Simple text fields | `express.urlencoded()` |
| `multipart/form-data` | `multipart/form-data; boundary=...` | File uploads | `multer` |
| `text/plain` | `text/plain` | Rare | `express.text()` |

Urlencoded body example: `title=Hello+World&body=Some+text%21`
(spaces → `+`, special chars → `%XX`).

### Useful input attributes (client-side validation)
```html
<input name="title" required minlength="3" maxlength="100" />
<input name="email" type="email" required />
<input name="age" type="number" min="1" max="120" />
<textarea name="body" rows="4" maxlength="1000"></textarea>
<select name="category"><option value="news">News</option></select>
<input type="checkbox" name="published" />
```
Browsers block submission if constraints fail — but **users can bypass this**, so the
server must validate again.

---

## 3. Express Setup Required

```js
app.use(express.json());                           // for fetch + JSON
app.use(express.urlencoded({ extended: true }));   // for classic forms
```

Both must be registered **before** the routes.

---

## 4. Approach A — Classic Form Post (no JavaScript)

### `public/new-post.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>New Post</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <main class="container">
    <h1>New Post</h1>

    <form action="/posts" method="POST">
      <label for="title">Title</label>
      <input id="title" name="title" required minlength="3" maxlength="100" />

      <label for="body">Body</label>
      <textarea id="body" name="body" rows="5" maxlength="1000"></textarea>

      <button type="submit">Create</button>
    </form>
  </main>
</body>
</html>
```

### Server route
```js
// returns a page/redirect (not JSON) because the browser navigates to the response
app.post('/posts', (req, res, next) => {
  const { title, body = '' } = req.body ?? {};

  if (typeof title !== 'string' || title.trim().length < 3) {
    return next(new HttpError(400, 'Title must be at least 3 characters'));
  }

  const post = createPostInStore({ title: title.trim(), body: String(body).trim() });
  res.redirect(303, `/posts/${post.id}`);        // Post/Redirect/Get pattern
});
```

### Post/Redirect/Get (PRG) pattern
After a successful POST, **redirect** to a GET page:

- Refreshing the page won't resubmit the form (no duplicate posts, no browser
  "Confirm Form Resubmission" dialog).
- Use status **303 See Other** (always switches to GET).

Flow:

```
POST /posts  → 303 Location: /posts/5  →  GET /posts/5  →  200 page
```

---

## 5. Approach B — JavaScript `fetch` (stay on the same page)

### HTML
```html
<form id="post-form" novalidate>
  <label for="title">Title</label>
  <input id="title" name="title" required minlength="3" maxlength="100" />
  <small id="title-error" class="field-error"></small>

  <label for="body">Body</label>
  <textarea id="body" name="body" rows="5" maxlength="1000"></textarea>

  <button type="submit" id="submit-btn">Create</button>
  <p id="form-status" role="status"></p>
</form>
<script src="/form.js"></script>
```

`novalidate` turns off the browser's pop-up bubbles so we can show our own messages.

### `public/form.js`
```js
const form = document.getElementById('post-form');
const statusEl = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');
const titleError = document.getElementById('title-error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();                       // 1. stop normal submission

  // 2. read values
  const formData = new FormData(form);
  const payload = {
    title: String(formData.get('title') ?? '').trim(),
    body: String(formData.get('body') ?? '').trim(),
  };

  // 3. client-side validation (for convenience, not security)
  titleError.textContent = '';
  if (payload.title.length < 3) {
    titleError.textContent = 'Title must be at least 3 characters';
    return;
  }

  // 4. send
  submitBtn.disabled = true;
  statusEl.textContent = 'Saving…';

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Could not save post');

    // 5. success feedback
    statusEl.textContent = `Post #${data.id} created!`;
    form.reset();
  } catch (err) {
    statusEl.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
  }
});
```

### `FormData` basics
```js
const fd = new FormData(form);
fd.get('title');                       // value of the field named "title"
fd.getAll('tags');                     // all values for repeated names
Object.fromEntries(fd.entries());      // { title: '...', body: '...' }
```
Quick conversion: `const payload = Object.fromEntries(new FormData(form));`
(checkboxes unchecked are **absent**; multi-values collapse to the last one).

### Sending `FormData` directly (multipart)
```js
fetch('/upload', { method: 'POST', body: new FormData(form) });
// Do NOT set Content-Type manually; the browser adds the multipart boundary.
```
This needs `multer` on the server (not `express.json`).

### Sending urlencoded with fetch
```js
fetch('/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(new FormData(form)),
});
```

---

## 6. Comparison

| | Classic form post | `fetch` + JSON |
|---|-------------------|-----------------|
| JavaScript required | No | Yes |
| Page reload | Yes (navigation) | No |
| Server response | Redirect / HTML page | JSON |
| Error display | Re-render page or error page | Update DOM |
| Good for | Server-rendered sites (EJS), progressive enhancement | SPAs, dynamic UI |
| Content-Type | urlencoded | JSON |

Best practice: build the classic form first (works everywhere), then enhance with
`fetch` for a smoother experience.

---

## 7. Server-Side Validation (Never Skip)

```js
// middleware/validatePost.js
import { HttpError } from '../utils/HttpError.js';

export const validatePost = (req, res, next) => {
  const { title, body = '' } = req.body ?? {};
  const errors = [];

  if (typeof title !== 'string' || title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
  } else if (title.trim().length > 100) {
    errors.push({ field: 'title', message: 'Title must be 100 characters or fewer' });
  }

  if (typeof body !== 'string' || body.length > 1000) {
    errors.push({ field: 'body', message: 'Body must be text up to 1000 characters' });
  }

  if (errors.length) return next(new HttpError(400, 'Validation failed', errors));

  req.body = { title: title.trim(), body: body.trim() };   // whitelist + clean
  next();
};
```

Show field errors on the client:

```js
if (!res.ok) {
  if (data.details) {
    data.details.forEach((d) => {
      document.getElementById(`${d.field}-error`).textContent = d.message;
    });
  }
  throw new Error(data.message);
}
```

---

## 8. Security Checklist for Forms 🔐

| Threat | How it happens | Defence |
|--------|----------------|---------|
| **XSS (stored)** | User submits `<script>` in `body`; later shown with `innerHTML` | Escape output (`textContent`, EJS `<%= %>`), sanitize HTML if allowed |
| **CSRF** | Another site auto-submits a form to your server using the victim's cookies | CSRF tokens, `SameSite=Lax/Strict` cookies, check `Origin` header |
| **Mass assignment** | Extra fields (`isAdmin=true`) in the body | Pick allowed fields only |
| **SQL injection** | Concatenating input into SQL | Parameterized queries |
| **DoS** | Huge bodies / many requests | `limit` in parsers, rate limiting |
| **Spam/bots** | Automated submissions | CAPTCHA, rate limit, honeypot field |
| **Sensitive data in GET** | Passwords in URL end in logs | Use POST, HTTPS |
| **Man-in-the-middle** | Plain HTTP exposes data | HTTPS (TLS) in production |
| **Open redirect** | `res.redirect(req.body.next)` | Whitelist redirect targets |
| **Clickjacking** | Your form embedded in a hidden iframe | `X-Frame-Options` / CSP `frame-ancestors` (helmet) |

### Honeypot idea
```html
<input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" />
```
Bots fill it; humans don't → reject if non-empty.

### Password fields (preview)
- `type="password"` hides characters but **does not** make transport secure.
- Never store plain passwords; hash with `bcrypt`/`argon2`.
- Use `autocomplete="current-password"` / `"new-password"` so password managers work.

---

## 9. Accessibility and UX Basics

- Every input gets a `<label for="id">` (screen readers, bigger click target).
- Show errors **near the field** and mark with `aria-live` regions.
- Disable the submit button while sending (prevents double submits).
- Keep the user's input if validation fails (don't clear the form).
- Give success feedback (message, redirect).
- Use correct `type`s (`email`, `number`, `tel`) → better mobile keyboards.

---

## 10. Testing

### Browser
1. Submit valid data → success message, new post appears in `/api/posts`.
2. Submit empty title → error message (client and server).
3. Disable JavaScript → classic form still works (approach A).

### Postman (simulate a form)
`POST /posts`, Body → `x-www-form-urlencoded`: `title = Hello`, `body = World`.

### curl
```bash
curl -i -X POST http://localhost:5000/posts \
  -d "title=From curl&body=Hello"

curl -i -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"JSON post","body":"Hi"}'
```

### Check the Network tab
Look at **Payload/Request** to see the encoded body and the `Content-Type` header.

---

## 11. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Input without `name` | Field missing in `req.body` | Add `name` |
| Missing `express.urlencoded()` | `req.body` undefined for form posts | Add middleware |
| `fetch` without `preventDefault()` | Page reloads, request cancelled | `event.preventDefault()` |
| Wrong `Content-Type` for JSON | Empty body | Set header |
| `<button>` outside the form | Doesn't submit | Place inside or use `form="id"` |
| Trusting `type="email"` | Invalid emails still arrive | Server validation |
| Using `method="PUT"` in HTML | Browser sends GET | Use `fetch` or method-override |
| Not resetting/clearing after success | Duplicate submissions | `form.reset()` |
| Rendering errors with `innerHTML` | XSS | `textContent` |
| Using `id` instead of `name` for FormData | Empty values | Use `name` |

---

## 12. Full Example (Server + Page)

### `server.js` (relevant parts)
```js
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import posts from './routes/posts.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/posts', posts);

app.use(notFound);
app.use(errorHandler);

app.listen(process.env.PORT || 5000);
```

### `routes/posts.js` (relevant parts)
```js
router.post('/', validatePost, createPost);
```

Now both the JSON `fetch` and the classic form (pointing to `/api/posts` or a page route)
are handled by validated, whitelisted code.

---

## 13. Exercises

1. Build `new-post.html` with a classic form posting to a route that redirects (PRG).
2. Build the `fetch` version with loading, success and error states.
3. Add `validatePost` middleware and show field errors under inputs.
4. Add a checkbox `published` and handle the unchecked (missing) case on the server.
5. Add a honeypot field and reject bot-like submissions with 400.
6. Test the classic form with JavaScript disabled in the browser.
7. Use Postman with `x-www-form-urlencoded` and `raw JSON` for the same endpoint.
8. Send `title=<script>alert(1)</script>` and verify it appears as plain text in the list.

### Challenge
Create a **contact form** (`name`, `email`, `message`). Validate on both sides, limit
`message` to 500 characters, rate-limit to 3 submissions per minute per IP, and store
messages in an array exposed (for you only) at `GET /api/messages` protected by an
`x-api-key` header.

---

## 14. Quick Quiz

1. Which attribute decides the key the server receives?
2. Which HTTP methods can an HTML form use?
3. What does `event.preventDefault()` do?
4. Which Express middleware parses classic form posts?
5. What is the Post/Redirect/Get pattern and why use it?
6. Why validate again on the server?
7. What is CSRF?
8. Which `enctype` is needed for file uploads?

<details><summary>Answers</summary>

1. `name`.
2. GET and POST.
3. Stops the default browser submission/navigation.
4. `express.urlencoded()`.
5. Redirect (303) after POST so refresh doesn't resubmit.
6. Client-side checks can be bypassed.
7. Cross-Site Request Forgery: another site makes the victim's browser send authenticated requests.
8. `multipart/form-data`.
</details>

---

## 15. Summary

- Forms send data using GET (query) or POST (body); inputs need a `name`.
- Classic forms → `application/x-www-form-urlencoded` → `express.urlencoded()` → redirect (PRG).
- `fetch` forms → `preventDefault`, build JSON, check `res.ok`, update the UI.
- Always validate and whitelist on the server; escape output; protect against CSRF/XSS/DoS.
- Good UX: labels, inline errors, disabled button while sending, success feedback.

---

## 16. Next Lesson

➡️ **31 — EJS Template Engine Setup**
Generate HTML pages on the server from templates and data.
