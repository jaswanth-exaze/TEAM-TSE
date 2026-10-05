# 20. File System (`fs`) Module

## Before using the `fs` module

A Node.js program normally runs in memory. If you create:

```js
let tasks = [];
```

the data disappears when the program stops.

A **file** gives us a simple way to store data on disk so it can be read again after the program restarts. The Node.js `fs` (File System) module provides functions for working with files and directories.

A few terms:

- **File** — stored data such as `tasks.json`.
- **Directory/folder** — a container for files and other folders.
- **Read** — get existing data.
- **Write** — create or replace data.
- **Append** — add data to the end of a file.
- **Delete** — remove a file.

## Concept

The `fs` module reads, writes and manages files and folders. We'll use it to make our tasks **persistent**: saved in `data/tasks.json` so they survive restarts.

### Picture the flow

```text
JavaScript starts a file operation
   ▼
Node requests work from the operating system
   ▼
other work can continue
   ▼
Promise settles with data or an error
```

## Three styles of the same API
```js
import fs from 'node:fs';
import fsp from 'node:fs/promises';

// 1) Synchronous: BLOCKS the whole server. OK for startup scripts, avoid in request handlers
const text = fs.readFileSync('notes.txt', 'utf8');

// 2) Callback style (older)
fs.readFile('notes.txt', 'utf8', (err, data) => {
  if (err) return console.error(err);
  console.log(data);
});

// 3) Promises: modern, use with async/await (what we use)
const data = await fsp.readFile('notes.txt', 'utf8');
```
**Rule:** inside servers, prefer the **promise** version. A sync call freezes every other user while it runs.

## Most-used functions (promise versions)
```js
import fs from 'node:fs/promises';

await fs.readFile('a.txt', 'utf8');                 // read text
await fs.writeFile('a.txt', 'hello');               // create/OVERWRITE
await fs.appendFile('log.txt', 'new line\n');       // add to end
await fs.mkdir('data/backups', { recursive: true });  // create folder(s); no error if exists
await fs.readdir('data');                           // list names in a folder
await fs.stat('a.txt');                             // size, dates, isFile(), isDirectory()
await fs.rename('old.txt', 'new.txt');              // rename/move
await fs.copyFile('a.txt', 'b.txt');
await fs.unlink('a.txt');                           // delete a file
await fs.rm('folder', { recursive: true, force: true });   // delete folder tree ⚠️ careful
await fs.access('a.txt');                           // throws if missing/not permitted
```

## Handling errors
Error `code` tells you what happened:
```js
try {
  await fs.readFile('missing.txt', 'utf8');
} catch (err) {
  if (err.code === 'ENOENT') console.log('File does not exist');
  else if (err.code === 'EACCES') console.log('Permission denied');
  else throw err;
}
```

## Practice script: file explorer
```js
// explore.js
import fs from 'node:fs/promises';
import path from 'node:path';

const entries = await fs.readdir('.', { withFileTypes: true });
for (const entry of entries) {
  const stats = await fs.stat(entry.name);
  console.log(`${entry.isDirectory() ? '📁' : '📄'} ${entry.name} (${stats.size} bytes)`);
}
```

## Apply it: make our store persistent
Replace `src/store.js`. **The exported functions stay identical**, so handlers don't change:
```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];      // first run: no file yet
    throw err;
  }
}

async function writeAll(tasks) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  // Write to a temp file, then rename: avoids a half-written, corrupted file if we crash mid-write
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(tasks, null, 2));
  await fs.rename(tmp, DATA_FILE);
}

export async function getAll() {
  return readAll();
}

export async function getById(id) {
  return (await readAll()).find(t => t.id === id) ?? null;
}

export async function create({ title }) {
  const tasks = await readAll();
  const task = {
    id: Date.now().toString(),       // temporary. Replaced by randomUUID in topic 24
    title,
    done: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  await writeAll(tasks);
  return task;
}

export async function update(id, changes) {
  const tasks = await readAll();
  const task = tasks.find(t => t.id === id);
  if (!task) return null;
  Object.assign(task, changes);
  await writeAll(tasks);
  return task;
}

export async function remove(id) {
  const tasks = await readAll();
  const next = tasks.filter(t => t.id !== id);
  if (next.length === tasks.length) return false;
  await writeAll(next);
  return true;
}
```
Create a task, **restart the server**, and list again. It's still there! 🎉

> ⚠️ **Limitation to understand:** read → modify → write is not safe if two requests change data at the exact same moment (one could overwrite the other). That's one of the reasons real apps use databases. For learning and small tools, it's fine.
> Also add `data/` to nodemon's `ignore` list (topic 9), or each save restarts the server.

## Try it
Write `backup.js` that copies `data/tasks.json` to `data/backups/tasks-<timestamp>.json` (create the folder if needed).

---