# 22. OS Module

## Before using the `os` module

Your Node.js program runs on a **machine** and an **operating system (OS)**.

The operating system is the software that manages the computer's hardware and basic resources. Examples include Windows, Linux, and macOS.

Node.js sometimes needs information about the machine it is running on—for example, the platform, CPU count, memory, temporary directory, or home directory. The built-in `os` module provides that information.

## Concept

The `os` module gives information about the machine and operating system Node runs on. It's useful for diagnostics, health checks, cross-platform behavior and tooling.

### Picture the flow

```text
Node.js process
   │ node:os
   ▼
platform · CPU · memory · temp folder
   ▼
useful diagnostic information
```

## Explore
```js
import os from 'node:os';

os.platform();       // 'win32' | 'darwin' | 'linux'
os.type();           // 'Windows_NT' | 'Darwin' | 'Linux'
os.release();        // OS version
os.arch();           // 'x64', 'arm64'
os.hostname();       // machine name
os.homedir();        // user's home folder
os.tmpdir();         // temp folder (good for scratch files)
os.uptime();         // seconds since the machine booted
os.totalmem();       // total RAM (bytes)
os.freemem();        // free RAM (bytes)
os.cpus();           // array, one entry per CPU core
os.cpus().length;    // number of cores
os.userInfo();       // { username, homedir, shell, ... }
os.networkInterfaces();
os.EOL;              // line ending: '\n' or '\r\n'
```

## Convert bytes to something readable
```js
const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(0) + ' MB';
console.log('Total RAM:', toMB(os.totalmem()));
console.log('Free RAM :', toMB(os.freemem()));
```

## Apply it: a health-check endpoint
Add to `src/handlers.js`:
```js
import os from 'node:os';

export async function health(req, res) {
  sendJson(res, 200, {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    platform: os.platform(),
    cpuCores: os.cpus().length,
    memory: {
      totalMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMB: Math.round(os.freemem() / 1024 / 1024),
    },
    nodeVersion: process.version,
  });
}
```
`src/routes.js`: `addRoute('GET', '/api/health', health);`

## 🔐 Security note
Health endpoints are handy, but **public servers should not reveal details** such as hostnames, OS versions, usernames, network interfaces or exact versions. This information helps attackers fingerprint your system. That's why the endpoint above deliberately leaves out `hostname()` and `userInfo()`. In production, return a simple `{ "status": "ok" }` publicly and expose detailed metrics only to authenticated/internal callers.

## Practical uses
- `os.EOL` when writing text files that must match the platform.
- `os.tmpdir()` for temporary files (uploads, caches).
- `os.cpus().length` to decide how many worker processes to start.
- `os.homedir()` for CLI tools that store config.

## Try it
Write `sysinfo.js` that prints a formatted report: OS, architecture, CPU model, cores, total/free memory and uptime in hours.

---