# 29 — Making Requests From Frontend

> **Goal:** Build a small front-end (HTML + JavaScript) served by Express that uses
> `fetch` to read data from the API, display it safely in the page, and handle loading
> and error states.

---

## 1. The Big Picture

So far we tested the API with Postman and curl. Real users use a **web page**. The page
is delivered by Express (`express.static`) and its JavaScript calls the API:

```
Browser ── GET / ───────────────► Express (static)  → index.html, style.css, main.js
Browser ── fetch GET /api/posts ► Express (API)     → JSON
Browser ◄──────────── JSON ───── Express
Browser updates the DOM (the list of posts)
```

This pattern is called a **client-side rendered** page (the browser builds the HTML
from data). Lessons 31–34 show the alternative: **server-side rendering with EJS**.

---

## 2. Prerequisite Concept: The `fetch` API

`fetch(url, options)` starts an HTTP request and returns a **Promise** of a `Response`.

```js
const response = await fetch('/api/posts');
```

The `Response` object:

| Property / method | Meaning |
|-------------------|---------|
| `response.ok` | `true` if status 200–299 |
| `response.status` | Number, e.g. 404 |
| `response.statusText` | Text, e.g. "Not Found" |
| `response.headers` | Response headers |
| `await response.json()` | Parse body as JSON (also a Promise) |
| `await response.text()` | Body as text |
| `await response.blob()` | Body as binary |

**Two awaits** are needed for JSON: one for the response headers arriving, another for
the body to be read and parsed.

### `fetch` only rejects on network failure
```js
try {
  const res = await fetch('/api/posts/9999');   // 404 -> NO exception
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (err) {
  console.error(err);                            // network down OR our own throw
}
```

### Options
```js
fetch(url, {
  method: 'POST',                                 // GET (default), POST, PUT, DELETE
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Hi' }),          // must be a string/FormData/Blob
});
```

---

## 3. Prerequisite Concept: The DOM (Quick Revision)

The browser represents the page as a tree of objects (the **Document Object Model**).

```js
const list = document.getElementById('posts');     // find element
const li = document.createElement('li');           // create element
li.textContent = 'Hello';                          // set text (safe)
list.appendChild(li);                              // add to page
list.innerHTML = '';                               // clear children
btn.addEventListener('click', handler);            // events
```

**`textContent` vs `innerHTML`:**

| | `textContent` | `innerHTML` |
|--|---------------|-------------|
| Treats value as | Plain text | HTML markup |
| Safe with user data? | ✅ Yes | ❌ XSS risk |

---

## 4. Project Files

```
public/
├── index.html
├── style.css
└── main.js
```

### `public/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Posts</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <main class="container">
    <h1>Posts</h1>

    <div class="toolbar">
      <button id="refresh">Refresh</button>
      <label>
        Limit
        <input id="limit" type="number" min="1" max="50" placeholder="all" />
      </label>
    </div>

    <p id="status" role="status" aria-live="polite"></p>
    <ul id="posts"></ul>
  </main>

  <script src="/main.js"></script>
</body>
</html>
```

### `public/style.css`
```css
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; background: #f3f4f6; color: #111827; }
.container { max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
h1 { margin-bottom: 1rem; }
.toolbar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
button { padding: .5rem 1rem; border: 0; border-radius: 6px; background: #2563eb; color: #fff; cursor: pointer; }
button:hover { background: #1d4ed8; }
input { padding: .4rem .6rem; border: 1px solid #d1d5db; border-radius: 6px; }
ul { list-style: none; padding: 0; margin: 0; display: grid; gap: .5rem; }
li { background: #fff; padding: .75rem 1rem; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
#status { min-height: 1.5rem; color: #6b7280; }
#status.error { color: #b91c1c; }
```

### `public/main.js`
```js
const listEl = document.getElementById('posts');
const statusEl = document.getElementById('status');
const limitEl = document.getElementById('limit');
const refreshBtn = document.getElementById('refresh');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

async function getPosts() {
  const limit = limitEl.value;
  const url = limit ? `/api/posts?limit=${encodeURIComponent(limit)}` : '/api/posts';

  setStatus('Loading…');
  refreshBtn.disabled = true;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed (${res.status})`);
    }

    const posts = await res.json();
    renderPosts(posts);
    setStatus(`${posts.length} post(s) loaded`);
  } catch (error) {
    listEl.innerHTML = '';
    setStatus(error.message, true);
  } finally {
    refreshBtn.disabled = false;
  }
}

function renderPosts(posts) {
  listEl.innerHTML = '';                     // clear old items

  if (posts.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No posts yet.';
    listEl.appendChild(li);
    return;
  }

  posts.forEach((post) => {
    const li = document.createElement('li');
    li.textContent = `#${post.id} — ${post.title}`;      // safe: plain text
    listEl.appendChild(li);
  });
}

refreshBtn.addEventListener('click', getPosts);
getPosts();                                   // load on page open
```

Open `http://localhost:5000` — the page loads, calls the API, and lists the posts.

---

## 5. Walkthrough of `getPosts()`

1. Build the URL (optionally with `?limit=`). `encodeURIComponent` escapes unsafe
   characters in user-provided values.
2. Show "Loading…" and disable the button (prevents double clicks).
3. `fetch` → check `res.ok`; if not ok, try to read the error JSON (`.catch(() => ({}))`
   in case the body is not JSON) and throw an `Error`.
4. Parse and render the posts.
5. `catch` shows errors to the user; `finally` always re-enables the button.

**Loading, success, error, empty** — these four UI states exist in every data-driven
page. Handling all four is what separates a demo from a real app.

---

## 6. Prerequisite Concept: Same-Origin Policy and CORS

Browsers enforce the **Same-Origin Policy**: JavaScript on one *origin* may not read
responses from a different origin unless the server allows it.

An **origin** = scheme + host + port.

| Page origin | API origin | Same origin? |
|-------------|-----------|--------------|
| `http://localhost:5000` | `http://localhost:5000` | ✅ |
| `http://localhost:5000` | `http://localhost:3000` | ❌ (port differs) |
| `http://localhost:5000` | `https://localhost:5000` | ❌ (scheme differs) |
| `http://a.com` | `http://api.a.com` | ❌ (host differs) |

In our setup the page and API are served by the **same Express app** → same origin →
no CORS issues, and we can use **relative URLs** (`/api/posts`).

If your front-end runs elsewhere (React dev server on 5173, calling Express on 5000):

```bash
npm install cors
```

```js
import cors from 'cors';

app.use(cors({ origin: 'http://localhost:5173' }));   // allow only your front-end
```

> 🔐 **Security:** `app.use(cors())` with no options allows **every** website to call
> your API from a browser. Never combine wildcard origins with credentials. Allow
> specific origins only. CORS is enforced by the **browser** — it does not protect your
> server from curl/Postman/attackers, so you still need authentication.

Typical CORS error in the console:

```
Access to fetch at 'http://localhost:5000/api/posts' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

### Preflight requests
For "non-simple" requests (JSON `Content-Type`, PUT/DELETE, custom headers) the browser
first sends an **OPTIONS** request asking permission. The `cors` package answers it.

---

## 7. Creating, Updating and Deleting From the Page

Add a small form (we do a proper form lesson next):

```html
<form id="create-form">
  <input id="title" placeholder="New post title" required />
  <button type="submit">Add</button>
</form>
```

```js
document.getElementById('create-form').addEventListener('submit', async (e) => {
  e.preventDefault();                                   // stop the page reload
  const title = document.getElementById('title').value.trim();

  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  const data = await res.json();
  if (!res.ok) return setStatus(data.message, true);

  e.target.reset();
  getPosts();                                           // reload the list
});
```

Delete button inside `renderPosts`:

```js
const del = document.createElement('button');
del.textContent = 'Delete';
del.addEventListener('click', async () => {
  const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
  if (!res.ok) return setStatus('Could not delete', true);
  getPosts();
});
li.appendChild(del);
```

Update with PUT:

```js
await fetch(`/api/posts/${post.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: newTitle }),
});
```

---

## 8. A Reusable `api()` Helper

Avoid repeating headers/JSON/error handling in every call:

```js
async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

// usage
const posts = await api('/posts');
const created = await api('/posts', { method: 'POST', body: { title: 'Hello' } });
await api(`/posts/${created.id}`, { method: 'DELETE' });
```

---

## 9. Debugging Front-End Requests

Open DevTools (F12):

| Tab | Use |
|-----|-----|
| **Network** | See every request: URL, method, status, timing, request/response headers and body |
| **Console** | Errors, `console.log` output |
| **Application** | Cookies, storage |
| **Sources** | Set breakpoints in `main.js` |

Checklist when "nothing shows":

1. Console → any red errors? (syntax error stops the script)
2. Network → was `/api/posts` requested? status? (404 = wrong URL, 500 = server bug)
3. Click the request → **Response** tab → is it valid JSON?
4. Is the `<script>` path correct (`/main.js`) and loaded (200)?
5. Does the element id in JS match the HTML id?
6. Hard refresh (`Ctrl+Shift+R`) to bypass cache.

---

## 10. Security Notes 🔐

| Risk | Explanation | Defence |
|------|-------------|---------|
| **XSS** | Rendering API data with `innerHTML` runs injected `<script>`/event attributes | Use `textContent`; sanitize if HTML is required (DOMPurify) |
| Trusting client-side validation | Users can bypass it | Validate on the server (we did) |
| Secrets in front-end code | Everything in `main.js` is public | Keep keys on the server |
| Tokens in `localStorage` | Readable by XSS | Prefer HttpOnly cookies for sessions |
| CORS misconfiguration | Any site can call your API | Allow specific origins |
| CSRF | Cookies are sent automatically with cross-site form posts | SameSite cookies, CSRF tokens |
| Building URLs by string concat | Injection of `&`, `#`, `../` | `encodeURIComponent`, `URLSearchParams` |

XSS demo (never do this with real data):

```js
li.innerHTML = post.title;      // ❌ title = '<img src=x onerror=alert(1)>' runs code
li.textContent = post.title;    // ✅ shown as text
```

---

## 11. Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting `await` on `res.json()` | `Promise {<pending>}` | `await res.json()` |
| Not checking `res.ok` | UI shows undefined data on errors | Check status |
| Missing `Content-Type` on POST | `req.body` empty | Add header |
| Using `body: { title }` (object) | Sends `[object Object]` | `JSON.stringify` |
| Absolute URL to a different port | CORS errors | Use relative URLs or configure CORS |
| `<script>` placed before elements exist | `null` errors | Put script at the end of body or use `defer` |
| Form submits and reloads the page | State lost | `e.preventDefault()` |
| Using `innerHTML` with API data | XSS | `textContent` |
| Not handling network errors | Unhandled rejection | `try/catch` |

---

## 12. Exercises

1. Build the page above and confirm the list loads.
2. Add a `Limit` input that calls `/api/posts?limit=N`.
3. Show "Loading…" and an error message when the server is stopped.
4. Add a form that creates posts via `POST` and refreshes the list.
5. Add Delete buttons wired to `DELETE`.
6. Add an "Edit" button that prompts for a new title and sends `PUT`.
7. Create the `api()` helper and refactor all calls to use it.
8. Run the HTML from a different port (`npx serve public -l 4000`) and fix the CORS error using `cors`.

### Challenge
Add a search box that filters posts as the user types, calling
`/api/posts?search=...` after a **300 ms debounce** (wait until the user stops typing).

<details><summary>Hint</summary>

```js
let timer;
searchEl.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(getPosts, 300);
});
```
(Server side: implement the `search` query parameter from lesson 14.)
</details>

---

## 13. Quick Quiz

1. What does `fetch` return?
2. When does `fetch` reject?
3. Why are two `await`s needed for `fetch(...).json()`?
4. What is the same-origin policy?
5. Why use `textContent` instead of `innerHTML`?
6. What does `e.preventDefault()` do on a form submit?
7. Is CORS a server-side protection?

<details><summary>Answers</summary>

1. A Promise resolving to a `Response` object.
2. Only on network failures (not on 404/500).
3. One for the response, one for reading/parsing the body stream.
4. Browser rule restricting scripts from reading responses of other origins.
5. It prevents HTML/script injection (XSS).
6. Stops the browser's default behaviour (page reload/navigation).
7. No, it's a browser-enforced rule; servers still need authentication.
</details>

---

## 14. Summary

- Express serves the page (static) and the API (JSON); same origin → simple `fetch('/api/...')`.
- `fetch` returns a Promise; check `res.ok`; parse with `await res.json()`.
- Handle loading, success, error and empty states.
- Render with `textContent` to avoid XSS; validate on the server.
- CORS only matters across origins; allow specific origins with the `cors` package.

---

## 15. Next Lesson

➡️ **30 — Submit Form to API**
Collect user input with an HTML form and send it to the API (JSON and classic form post).
