# 25. Emitting Events

## Concept

An **event** is a notification that something happened:

```text
"task created"
"file finished reading"
"server started"
```

An **emitter** announces the event. A **listener** waits for that event and reacts. A function that reacts to an event is often called a handler.

Node is **event-driven**. Many core objects (servers, streams, processes) use `EventEmitter` or the same event pattern. You've already used it:

```js
req.on('data', ...)
res.on('finish', ...)
server.on(...)
```

### Why events?

Suppose a task is created. You may want to write a log, send a notification, and update metrics.

Without events, the task handler must know about all those operations.

With events:

```text
Task handler
   │ emits task:created
   ▼
EventEmitter
   ├─ activity log listener
   └─ notification listener
```

The handler does not need to know who is listening. This is **loose coupling**: components depend less directly on each other, making the application easier to extend.

## Basics

```js
import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();

// listen
emitter.on('greet', (name) => console.log(`Hello, ${name}!`));

// listen only once
emitter.once('start', () => console.log('Started (runs one time)'));

// emit (announce), extra arguments are passed to listeners
emitter.emit('greet', 'Sam');     // Hello, Sam!
emitter.emit('start');
emitter.emit('start');            // nothing happens
```

- `.on()` registers a listener for repeated events.
- `.once()` removes the listener after its first execution.
- `.emit()` announces an event and can pass arguments to listeners.

## Useful API

```js
emitter.off('greet', handlerFn);        // remove a specific listener
emitter.removeAllListeners('greet');
emitter.listenerCount('greet');
emitter.emit('x', 1, 2, 3);             // listeners receive (1, 2, 3)
```

## Key behaviors

1. **Listeners run synchronously**, in registration order, when `emit()` is called. Emitting an event does not automatically create a background thread.
2. The special **`'error'` event**: if `emit('error', err)` is called and nobody listens, Node can throw and terminate the process. Add an error listener for emitters that may fail.

```js
emitter.on('error', (err) => {
  console.error('Emitter error:', err);
});
```

3. You can extend `EventEmitter` to build your own classes:

```js
class Downloader extends EventEmitter {
  start() {
    this.emit('start');
    setTimeout(() => this.emit('progress', 50), 500);
    setTimeout(() => this.emit('done'), 1000);
  }
}

const d = new Downloader();
d.on('progress', p => console.log(`${p}%`));
d.on('done', () => console.log('Finished'));
d.start();
```

## Apply it: an activity log driven by events

`src/events.js` — one shared emitter ("event bus"):

```js
import { EventEmitter } from 'node:events';

export const bus = new EventEmitter();
```

An **event bus** is simply a shared emitter used to publish events from one part of an application and let other parts subscribe to them.

`src/listeners.js` — reacts to events:

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bus } from './events.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', 'data', 'activity.log');

async function record(action, task) {
  const line = `${new Date().toISOString()} ${action} id=${task.id} title="${task.title}"\n`;
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.appendFile(LOG_FILE, line);
  } catch (err) {
    console.error('Could not write activity log:', err.message);
  }
}

bus.on('task:created', (task) => record('CREATED', task));
bus.on('task:updated', (task) => record('UPDATED', task));
bus.on('task:deleted', (task) => record('DELETED', task));
```

Emit from handlers (`src/handlers.js`):

```js
import { bus } from './events.js';

// in createTask, after store.create:
bus.emit('task:created', task);

// in replaceTask / patchTask, after a successful update:
bus.emit('task:updated', task);
```

For deletion, fetch first so we know what was deleted:

```js
export async function deleteTask(req, res) {
  const task = await store.getById(req.params.id);
  if (!task) throw httpError(404, 'Task not found');

  await store.remove(task.id);
  bus.emit('task:deleted', task);

  res.writeHead(204);
  res.end();
}
```

Register the listeners by importing the file in `server.js`:

```js
import './src/listeners.js';
```

Create/update/delete a few tasks, then open `data/activity.log`.

> **Log injection:** a user-supplied title containing a newline could fake extra log lines. In real systems, sanitize or JSON-encode logged values (for example, `JSON.stringify(task.title)`).

## Try it

Add a listener that prints:

```text
All tasks done!
```

whenever, after an update, no tasks remain with `done === false`.

Hint: emit the event with the task, and query the store inside the listener.

---
