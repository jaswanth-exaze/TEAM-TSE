# 21. Path Module

## Before using the `path` module

A **file path** tells the operating system where a file or folder is located.

For example:

```text
Windows: C:\Users\sam\project\data\tasks.json
Linux/Mac: /home/sam/project/data/tasks.json
```

Notice that Windows and Linux/Mac use different path separators. A Node.js application should not assume that every computer uses `/`.

The `path` module provides functions that understand the operating system's path rules.

## Concept

File paths differ between systems (`C:\Users\sam\file.txt` on Windows vs `/home/sam/file.txt` on Linux/Mac). The `path` module builds and analyzes paths **correctly on every OS**. **Never concatenate paths with `+` or hard-code `/` or `\`.**

File paths differ between systems (`C:\Users\sam\file.txt` on Windows vs `/home/sam/file.txt` on Linux/Mac). The `path` module builds and analyzes paths **correctly on every OS**. **Never concatenate paths with `+` or hard-code `/` or `\`.**

### Picture the flow

```text
Folder + file names
   ▼ path.join(...)
OS-specific path such as / or \
   ▼
normalized file location
```

## Explore in the REPL
```js
import path from 'node:path';

path.join('data', 'backups', 'tasks.json');
// 'data/backups/tasks.json'  (uses the right separator for your OS)

path.join('/a/b', '../c');            // '/a/c'   (resolves ..)

path.resolve('data', 'tasks.json');   // absolute path, starting from the current working directory

const file = '/home/sam/projects/task-api/data/tasks.json';
path.basename(file);                  // 'tasks.json'
path.basename(file, '.json');         // 'tasks'
path.dirname(file);                   // '/home/sam/projects/task-api/data'
path.extname(file);                   // '.json'
path.parse(file);
// { root: '/', dir: '/home/.../data', base: 'tasks.json', ext: '.json', name: 'tasks' }

path.format({ dir: '/tmp', name: 'report', ext: '.pdf' });   // '/tmp/report.pdf'
path.isAbsolute('/tmp');              // true
path.relative('/a/b/c', '/a/d');      // '../../d'
path.sep;                             // '/' or '\\'
```

## `join` vs `resolve`
| | `join` | `resolve` |
|---|---|---|
| Result | Combines segments (can stay relative) | Always an **absolute** path |
| Starts from | Nothing | Right-to-left until it forms an absolute path (falls back to the current working directory) |

## The relative-path trap
```js
fs.readFile('./data/tasks.json');              // ❌ relative to where you RAN the command
fs.readFile(path.join(__dirname, 'data', 'tasks.json'));   // ✅ always relative to this file
```
If you run `node src/app.js` from another folder, the first form breaks. **Always anchor to `__dirname`** (in ESM, via `fileURLToPath(import.meta.url)`, shown in topic 6).

## Security connection
`path.join` normalizes `..` segments, which is exactly why we can check `startsWith(PUBLIC_DIR + path.sep)` to block path traversal (topic 15 and our `serveStatic`).

## Try it
Write `info.js` that accepts a path argument and prints its folder, file name, name without extension, and extension using `path.parse`.

---