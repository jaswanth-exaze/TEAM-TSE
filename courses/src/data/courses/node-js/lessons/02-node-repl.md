# 2. Node REPL

## What is the Node REPL?

The Node REPL is an interactive place to run JavaScript directly in a terminal. **REPL** means **Read, Evaluate, Print, Loop**:

```text
You enter code -> Node evaluates it -> Node shows the result -> Node waits again
```

Use it to try a short expression or check an idea. Use a `.js` file for a program you want to save and run again.

## Start the REPL

Open Command Prompt or PowerShell on Windows, or Terminal on macOS, and run:

```bash
node
```

When Node displays `>`, it is ready. Try:

```js
> 2 + 3
5

> "hello".toUpperCase()
'HELLO'
```

The prompt returns after each result so you can enter another expression.

## Try variables and expressions

JavaScript works in the REPL just as it does in a file:

```js
> const name = "Node"
undefined

> name
'Node'

> `Hello, ${name}`
'Hello, Node'
```

A declaration creates the variable. The REPL may show `undefined` for the declaration itself; that does not mean the variable is empty. Enter the variable name to see its value.

The REPL also remembers the last result in `_`:

```js
> 10 * 5
50

> _ + 1
51
```

`_` is handy for quick experiments. It is a REPL convenience, not a feature to rely on in application code.

## Useful REPL commands

Commands beginning with a dot are REPL commands, not JavaScript.

| Command | What it does |
|---|---|
| `.help` | Shows available REPL commands |
| `.editor` | Lets you enter a multi-line code block |
| `.exit` | Closes the REPL |

For example, enter `.editor`, type the function below, then press **Ctrl+D** to run it:

```js
function isEven(number) {
  return number % 2 === 0;
}

isEven(8);
```

The result is `true`. To leave the REPL, type `.exit` or press **Ctrl+D**. On Windows, **Ctrl+C** twice also exits.

## Practice

Start `node` and try these tasks:

1. Calculate `12 * 4`.
2. Create `const city = "Toronto"`, then enter `city` to see its value.
3. Calculate `7 + 3`, then use `_ * 2`.
4. Use `.editor` to create `isEven(number)` and try it with `8` and `5`.
5. Exit the REPL and return to your terminal.

## Remember

- Run `node` by itself to open the REPL.
- Run a command such as `node app.js` to execute a file instead.
- The `>` prompt accepts JavaScript; dot commands control the REPL.