# 3. Setup & `package.json` Init

## Create a project folder

A Node.js project is a folder containing the files for one application. We will use a small project called `task-api` in the upcoming lessons.

Open Command Prompt or PowerShell on Windows, or Terminal on macOS. These commands work in all three:

```bash
mkdir task-api
cd task-api
```

`mkdir` creates the folder. `cd` moves the terminal into it. Run the next command from inside `task-api`.

## Create `package.json`

Run:

```bash
npm init -y
```

npm creates a `package.json` file in the current folder. The `-y` option accepts the default answers, so you do not have to fill in each prompt. Without `-y`, npm asks you questions and uses your answers to create the file.

Your folder now includes:

```text
task-api/
└── package.json
```

## What `package.json` is for

`package.json` describes the project for Node.js tools and other developers. It stores details such as the project name, version, and description. npm may also add other fields; that is normal.

A small valid example is:

```json
{
  "name": "task-api",
  "version": "1.0.0",
  "description": "A beginner task manager API"
}
```

You can open `package.json` in your editor and change the name or description. Keep the JSON format valid: use double quotes around keys and text, separate fields with commas, and do not add a comma after the last field.

We will add run commands and packages in later lessons. For now, the important point is that `npm init -y` creates the project manifest so npm has a place to keep project details.

## Practice

1. Create a folder named `task-api` and move into it.
2. Run `npm init -y`.
3. Open `package.json` and find the project name and version.
4. Change the description and save the file.

The same steps work on Windows and macOS. If `npm` is not recognized, finish the installation lesson first, then close and reopen the terminal.

## Next step

The project folder is ready. In the next lesson, you will create a JavaScript file and run it with Node.js.