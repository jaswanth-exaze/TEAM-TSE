# 11 — Postman Utility

> **Goal:** Learn to test your API with Postman (and curl): send requests with any
> method, add headers/body/params, read responses, and save collections.

---

## 1. Why Do We Need Postman?

The browser address bar can only send **GET** requests. But APIs also use:

| Method | Can the address bar do it? |
|--------|----------------------------|
| GET | ✅ |
| POST | ❌ (needs a form or JavaScript) |
| PUT | ❌ |
| PATCH | ❌ |
| DELETE | ❌ |

To test a backend you need a **client tool** that can craft any HTTP request and show
the full response (status, headers, body, time). That is **Postman**.

---

## 2. What Is Postman?

A desktop/web application for designing, testing and documenting APIs.

Alternatives:

| Tool | Type | Notes |
|------|------|-------|
| Postman | GUI | Most popular; account optional for basics |
| Insomnia | GUI | Clean, lightweight |
| Bruno | GUI | Open source, stores collections as files (Git friendly) |
| Thunder Client | VS Code extension | Convenient inside the editor |
| `curl` | CLI | Everywhere, scriptable |
| REST Client | VS Code extension | Requests in `.http` files |

Learn Postman concepts; they transfer to every tool.

---

## 3. Install and First Look

1. Download from `postman.com/downloads`.
2. Open it. You can skip sign-in (use "Lightweight API client" / Scratch Pad) if offered.
3. Click **New → HTTP Request** (or the `+` tab).

The request builder has:

```
[ GET v ]  [ http://localhost:5000/api/posts        ]  [ Send ]
-----------------------------------------------------------------
 Params | Authorization | Headers | Body | Pre-request | Tests | Settings
-----------------------------------------------------------------
 (response area: Body | Cookies | Headers | Test Results   Status: 200 OK  Time: 8ms  Size: 250 B)
```

---

## 4. Your First Request

1. Start your server: `npm run dev`.
2. In Postman: method **GET**, URL `http://localhost:5000/api/posts`.
3. Click **Send**.
4. Look at the response:
   - **Status:** `200 OK`
   - **Time:** a few milliseconds
   - **Body → Pretty:** formatted JSON
   - **Headers:** `Content-Type: application/json; charset=utf-8`

Congratulations, you just acted as a client program.

---

## 5. Prerequisite Concept: Anatomy of an HTTP Message

### Request
```
POST /api/posts HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Content-Length: 45

{"title":"New Post","body":"Hello"}
```

| Part | In Postman |
|------|-----------|
| Method + URL | Top bar |
| Headers | **Headers** tab |
| Body | **Body** tab |
| Query string | **Params** tab |

### Response
```
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"New Post","body":"Hello"}
```

| Part | In Postman |
|------|-----------|
| Status line | Status badge (green = 2xx) |
| Headers | Response **Headers** tab |
| Body | Response **Body** tab |

---

## 6. The Request Tabs Explained

### Params
Key/value rows that are added to the URL as a query string.

Typing `limit = 2` makes the URL `http://localhost:5000/api/posts?limit=2`
(used in lesson 14).

### Headers
Add `Key: Value` pairs.
Postman adds some automatically (`Host`, `User-Agent`, `Content-Length`).
When you choose a body type, `Content-Type` is set for you.

### Body (very important)

| Body option | Content-Type sent | Express parser needed |
|-------------|-------------------|-----------------------|
| `none` | — | — |
| `form-data` | `multipart/form-data` | `multer` (file uploads) |
| `x-www-form-urlencoded` | `application/x-www-form-urlencoded` | `express.urlencoded()` |
| `raw` + **JSON** | `application/json` | `express.json()` |
| `raw` + Text | `text/plain` | `express.text()` |
| `binary` | file bytes | custom |

For our API we mostly use **raw → JSON**.

---

## 7. Sending a POST With JSON (Preview of Lesson 20)

1. Method: **POST**
2. URL: `http://localhost:5000/api/posts`
3. **Body → raw → JSON** (dropdown at the right of the "raw" option)
4. Type:

```json
{
  "title": "Post Four",
  "body": "Created from Postman"
}
```

5. Click **Send**.

Right now your server has no POST route, so you get:

```
Cannot POST /api/posts      (404)
```

That is **good** — it proves Postman works and that Express answers unknown routes with
404. We will implement the route in lesson 20.

---

## 8. Understanding Status Colors and Codes

| Badge | Meaning |
|-------|---------|
| 🟢 `200 OK` | Success |
| 🟢 `201 Created` | Resource created |
| 🟢 `204 No Content` | Success, nothing to return |
| 🟡 `301/302` | Redirect |
| 🟠 `400 Bad Request` | Client sent something wrong |
| 🟠 `401 Unauthorized` | Not logged in |
| 🟠 `403 Forbidden` | Not allowed |
| 🟠 `404 Not Found` | Resource/route missing |
| 🔴 `500 Internal Server Error` | Server bug |

Read the status first; then the body; then headers.

---

## 9. Organizing Requests: Collections and Folders

A **collection** is a saved group of requests.

Steps:
1. Click **New → Collection**, name it `Express Crash Course`.
2. Add folders: `Posts`, `Users`, `Misc`.
3. After building a request, press **Ctrl + S** and choose the collection/folder.
4. Name requests clearly: `GET all posts`, `GET post by id`, `POST create post`.

Benefits: you can re-run, share and document your API; export as JSON and commit to Git.

> 🔐 Do not export collections containing real tokens or passwords to a public repo.

---

## 10. Variables and Environments

Hard-coding `http://localhost:5000` in every request is annoying.

### Create an environment
1. Top right → **Environments → +**.
2. Name: `Local`.
3. Add variable: `baseUrl` = `http://localhost:5000`.
4. Select **Local** in the environment dropdown.

### Use it
```
{{baseUrl}}/api/posts
```

Later, add another environment `Production` with a different `baseUrl`, and switch with
one click. Variable types: *global*, *collection*, *environment*, *local*. The narrower
scope wins.

---

## 11. Writing Simple Tests

The **Tests** tab runs JavaScript after the response arrives.

```js
pm.test('Status is 200', () => {
  pm.response.to.have.status(200);
});

pm.test('Response is an array', () => {
  const data = pm.response.json();
  pm.expect(data).to.be.an('array');
});

pm.test('Content-Type is JSON', () => {
  pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});
```

Results appear in the **Test Results** tab (green = pass). This is a first step toward
automated API testing.

### Saving values for later requests
```js
const json = pm.response.json();
pm.environment.set('lastId', json.id);
```
Use `{{lastId}}` in the next request URL.

---

## 12. Same Requests With `curl` (Linux Friendly)

Since you know the terminal, learn curl; it works on servers without any GUI.

```bash
# GET
curl http://localhost:5000/api/posts

# GET with response headers
curl -i http://localhost:5000/api/posts

# POST JSON
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Post Four","body":"From curl"}'

# PUT
curl -X PUT http://localhost:5000/api/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated"}'

# DELETE
curl -X DELETE http://localhost:5000/api/posts/1

# Pretty print with jq (if installed)
curl -s http://localhost:5000/api/posts | jq
```

| Flag | Meaning |
|------|---------|
| `-X METHOD` | Set HTTP method |
| `-H "K: V"` | Add header |
| `-d 'data'` | Request body |
| `-i` | Include response headers |
| `-s` | Silent (no progress) |
| `-v` | Verbose (full details) |

---

## 13. Debugging With Postman

### Problem: "Could not get response"
- Server not running or wrong port.
- Using `https` instead of `http`.
- Firewall or proxy.
- Check the **Postman Console** (View → Show Postman Console) for details.

### Problem: `req.body` is `undefined`
- You did not choose **raw → JSON** (Body type mismatch).
- Server missing `app.use(express.json())` (lesson 19).

### Problem: 404 on a route you wrote
- Wrong method (GET vs POST).
- Typo in the path (`/api/post` vs `/api/posts`).
- Route defined **after** a handler that already responded.

### Problem: JSON parse error from Express
```
SyntaxError: Unexpected token } in JSON at position 25
```
Your JSON has a trailing comma or single quotes. Postman can **Beautify** JSON to help.

---

## 14. Useful Postman Features

| Feature | How to use |
|---------|------------|
| Beautify JSON | In Body, click **Beautify** |
| Save response as example | Response → **Save as example** |
| Generate code | Right sidebar `</>` → curl, fetch, axios, etc. |
| History | Left sidebar → recent requests |
| Console | Bottom-left **Console** for logs |
| Import curl | **Import** → paste a curl command |
| Collection Runner | Run all requests in sequence |
| Documentation | Collection → **View documentation** |

The **code generator** is excellent: build a request in the GUI, copy the `fetch` code
into your front-end.

---

## 15. Good Habits for API Testing

1. **Test the happy path** (valid input) and the **unhappy paths** (bad id, empty body).
2. Check status code **and** body **and** headers.
3. Verify what **should not** be allowed (try DELETE on unknown id, huge bodies).
4. Keep a collection per project; commit exported JSON to Git.
5. Use environments, not hard-coded URLs and secrets.

> 🔐 Security testers use the same approach: send unexpected input and observe the
> reaction. Your Postman skills are directly useful for security testing of APIs
> (checking missing validation, verbose errors, missing auth).

---

## 16. Exercises

1. Install Postman (or Thunder Client) and send `GET /api/posts`.
2. Create a collection with folders `Posts` and `Misc`.
3. Create an environment `Local` with `baseUrl` and use `{{baseUrl}}`.
4. Add a test asserting status 200 and that the response is an array of length ≥ 3.
5. Send a `POST /api/posts` and confirm you get 404 now (route missing).
6. Reproduce the same GET request with `curl -i` and compare headers.
7. Use **Generate code** to produce a `fetch` snippet for your GET request.

### Challenge
Build a request `GET {{baseUrl}}/api/does-not-exist` with a test that expects status 404,
and note what the response body says.

<details><summary>Hint</summary>

```js
pm.test('Not found', () => pm.response.to.have.status(404));
```
Body will be an HTML page: `Cannot GET /api/does-not-exist`.
</details>

---

## 17. Quick Quiz

1. Why can't the browser address bar test POST?
2. Which Body option do we use to send JSON?
3. What is `{{baseUrl}}`?
4. Name three parts of a response you can inspect.
5. What does `curl -i` do?
6. What does a 404 on a POST route usually mean in our current server?

<details><summary>Answers</summary>

1. It only issues GET requests.
2. Body → raw → JSON.
3. A variable from the selected environment.
4. Status, headers, body (also time/size).
5. Shows response headers along with body.
6. The route is not defined yet (or wrong path/method).
</details>

---

## 18. Summary

- Postman (or curl/Thunder Client) sends any HTTP request and shows the full response.
- Use **Params** for query strings, **Headers** for metadata, **Body → raw → JSON** for JSON.
- Collections + environments keep tests organized and reusable.
- Tests tab lets you automate simple checks.
- curl is the CLI equivalent and works well on Linux servers.
- Testing both valid and invalid input is the foundation of reliable (and secure) APIs.

---

## 19. Next Lesson

➡️ **12 — Environment Variables (.env)**
Move the port and other settings out of your code so they can change per environment
without editing source files.
