# 1. Installation

## Concept

Before writing Node.js programs, we first need to install **Node.js** and a few tools.

**Node.js** is a **runtime** that allows us to run JavaScript outside a web browser. It uses Google's **V8** JavaScript engine and provides features that browser JavaScript does not normally have, such as working with files, the operating system, and network servers.

**npm** (Node Package Manager) is installed along with Node.js. It is used to install and manage packages that our Node.js projects depend on.

### Picture the flow

```text
Node.js installation
       │
       ├─ Node.js runtime → runs JavaScript
       │
       └─ npm → installs and manages packages
```

## Steps

For learning, use the **LTS (Long-Term Support)** release. LTS versions receive long-term maintenance and are a good choice for starting a new project.

## Windows: Official Installer

The easiest method for beginners is the official installer.

1. Open the [official Node.js download page](https://nodejs.org/en/download) and choose the **Windows Installer (.msi)** for the LTS release.
2. Open the downloaded `.msi` file and follow the setup wizard. Accept the license and keep the default options. Make sure the option that adds Node.js to `PATH` remains enabled.
3. Finish the installation, then close and reopen PowerShell or Command Prompt.

### What is `PATH`?

`PATH` is an operating-system setting that tells the terminal where it can find executable programs.

When Node.js is added to `PATH`, you can simply type:

```bash
node
```

instead of providing the full location of the Node.js installation.

## Windows: Package Manager (Optional)

If you already use Windows Package Manager (`winget`), you can install the LTS release with:

```powershell
winget install -e --id OpenJS.NodeJS.LTS
```

After installation, reopen PowerShell.

If `winget` is not available, use the `.msi` installer above.

## macOS: Official Installer

1. Open the [official Node.js download page](https://nodejs.org/en/download) and choose the **macOS Installer (.pkg)** for the LTS release.
2. Choose the correct installer for your Mac:
   - **ARM64** for Apple silicon such as M1, M2, M3, or newer.
   - **x64** for Intel Macs.
3. You can check this from **Apple menu → About This Mac**, where you will see the Chip or Processor information.
4. Open the downloaded `.pkg` file and follow the installation steps.
5. When installation finishes, open a new Terminal window.

## Verify the Installation

After installing Node.js, we need to confirm that both Node.js and npm are available.

Open PowerShell or Command Prompt on Windows, or Terminal on macOS, and run:

```bash
node --version
npm --version
```

Both commands should print version numbers, for example:

```text
vXX.X.X
X.X.X
```

The exact numbers depend on the versions currently installed.

If you see:

```text
'node' is not recognized
```

or:

```text
command not found
```

first close and reopen the terminal. If the problem continues, check that the installation completed successfully and that Node.js was added to `PATH`.

## Install the Other Tools

You will also use:

- **VS Code** as the code editor.
- **Postman** for testing HTTP APIs later in the guide.

Postman is optional because some API requests can also be made directly from the terminal.

**Optional:** If you work on projects that require different Node.js versions, you can use a version manager. On Windows, use [nvm-windows](https://github.com/coreybutler/nvm-windows). On macOS and Linux, use [nvm](https://github.com/nvm-sh/nvm).

## Try It

Run:

```bash
node --version
npm --version
```

Then confirm:

1. Node.js prints a version.
2. npm prints a version.
3. You can run `node` from the terminal.

If all three work, your Node.js environment is ready.

## Common Mistakes

| Problem | Fix |
|---|---|
| `'node' is not recognized` / `command not found` | Reopen the terminal. If it still fails, check the installation and `PATH`. |
| Wrong Mac installer architecture | Check **About This Mac**. Use ARM64 for Apple silicon and x64 for Intel. |
| Old Node version | Install the current LTS release or use a version manager. |

---

## Why It Matters

Every Node.js project you build will depend on the Node.js runtime, and npm will become an important tool for managing project packages.

Once the installation is working, we can move on to creating our first Node.js project.
