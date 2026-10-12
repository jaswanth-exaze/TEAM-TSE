function task(number, title, prompt, solution, language, consoleRequired = false) {
  return {
    id: 'task-' + number,
    number,
    title,
    prompt,
    solution,
    language,
    consoleRequired,
    minutes: 4,
  }
}

export const HTML_JS_EXAM_POLICY = {
  format: '15 tasks × 4 minutes = 60 minutes. Hands-on practice.',
  console: 'For console-marked tasks, run your code in the browser and show the printed output in DevTools. In Chrome or Edge, press F12 or right-click and choose Inspect, then open Console. On Mac, use Cmd+Option+J. Show the code and output together, live on screen share or in a screenshot.',
  attempts: 'The official module policy allows up to 3 attempts per exam. These in-browser practice worksheets do not use an official attempt.',
  grading: 'A working solution counts even when it differs from this example. Use the answer as a correctness reference, not as the only accepted solution.',
  savedWork: 'Drafts are saved in this browser on this device. This page does not run or automatically grade your code.',
}

export const HTML_JS_EXAM_1 = {
  id: 'exam-1',
  number: 1,
  weeks: 'Weeks 1–2',
  title: 'Module 4 — Exam 1',
  covers: 'Git basics, HTML foundations, the CSS box model and Flexbox, JavaScript basics, DOM events, and objects.',
  tasks: [
    task(1, 'Git init', 'Write the commands to initialize a new repo, stage all files, and commit with message "initial commit".', `git init
git add .
git commit -m "initial commit"`, 'Git'),
    task(2, 'Git branching', 'Write the command to create and switch to a new branch called styling.', `git switch -c styling`, 'Git'),
    task(3, 'HTML structure', 'Write a semantic heading, a paragraph, and an image with meaningful alt text for a recipe page.', `<h1>Banana Pancakes</h1>
<p>Fluffy pancakes made with ripe bananas.</p>
<img src="pancakes.jpg" alt="Stack of banana pancakes on a plate">`, 'HTML'),
    task(4, 'HTML lists', 'Write an unordered list of 3 ingredients and an ordered list of 2 steps.', `<ul>
  <li>2 bananas</li>
  <li>2 eggs</li>
  <li>1 cup oats</li>
</ul>
<ol>
  <li>Mash the bananas.</li>
  <li>Mix in eggs and oats, then cook on a griddle.</li>
</ol>`, 'HTML'),
    task(5, 'CSS box model', 'Give .box a 2px solid border, 20px padding, and 10px margin.', `.box {
  border: 2px solid #333;
  padding: 20px;
  margin: 10px;
}`, 'CSS'),
    task(6, 'box-sizing', 'Make the declared width of .box (300px) include its padding and border instead of adding to it.', `.box {
  box-sizing: border-box;
  width: 300px;
}`, 'CSS'),
    task(7, 'Flexbox centering', 'Center .card both horizontally and vertically inside .container using Flexbox.', `.container {
  display: flex;
  justify-content: center;
  align-items: center;
}`, 'CSS'),
    task(8, 'Flexbox row', 'Place the .navbar children in a row, spaced evenly apart, with 16px padding.', `.navbar {
  display: flex;
  justify-content: space-between;
  padding: 16px;
}`, 'CSS'),
    task(9, 'Variables and data types', 'Declare a let string, a const number, and a let boolean, and log each one along with its typeof.', `let name = "Ana";
const age = 22;
let isStudent = true;
console.log(name, typeof name);
console.log(age, typeof age);
console.log(isStudent, typeof isStudent);`, 'JavaScript', true),
    task(10, 'Operators', 'Log the result of 10 % 3, "5" == 5, and "5" === 5.', `console.log(10 % 3);      // 1
console.log("5" == 5);    // true
console.log("5" === 5);   // false`, 'JavaScript', true),
    task(11, 'Conditionals', 'Write canVote(age) returning true/false for age ≥ 18, and log the result for ages 16 and 20.', `function canVote(age) {
  return age >= 18;
}
console.log(canVote(16)); // false
console.log(canVote(20)); // true`, 'JavaScript', true),
    task(12, 'Function: Rock Paper Scissors', 'Write playRound(playerSelection, computerSelection) returning "You win!", "You lose!", or "Tie!", and log the result of 2 test calls.', `function playRound(playerSelection, computerSelection) {
  const p = playerSelection.toLowerCase();
  const c = computerSelection.toLowerCase();
  if (p === c) return "Tie!";
  const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
  return beats[p] === c ? "You win!" : "You lose!";
}
console.log(playRound("rock", "scissors")); // You win!
console.log(playRound("paper", "rock"));    // You win!`, 'JavaScript', true),
    task(13, 'Loops and arrays', 'Sum the array [4, 8, 15, 16, 23, 42] using a loop and log the total.', `const nums = [4, 8, 15, 16, 23, 42];
let total = 0;
for (let i = 0; i < nums.length; i++) {
  total += nums[i];
}
console.log(total); // 108`, 'JavaScript', true),
    task(14, 'DOM and events', 'Add a click listener to <button id="btn"> that logs "Button clicked!" to the console each time it is clicked.', `document.getElementById("btn").addEventListener("click", () => {
  console.log("Button clicked!");
});`, 'JavaScript', true),
    task(15, 'Objects: calculator', 'Write a calculator object with add/subtract/multiply/divide methods (divide by 0 returns an error string), then log the result of each method with sample inputs.', `const calculator = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => (b === 0 ? "Error: divide by zero" : a / b),
};
console.log(calculator.add(4, 2));      // 6
console.log(calculator.subtract(4, 2)); // 2
console.log(calculator.multiply(4, 2)); // 8
console.log(calculator.divide(4, 0));   // Error: divide by zero`, 'JavaScript', true),
  ],
}

export const HTML_JS_EXAM_2 = {
  id: 'exam-2',
  number: 2,
  weeks: 'Weeks 3–4',
  title: 'Module 4 — Exam 2',
  covers: 'Real HTML/CSS pages, accessibility, JavaScript variables, operators, conditionals, and loops.',
  tasks: [
    task(1, 'HTML page', 'Write a minimal but complete HTML page: doctype, <head> with a linked styles.css, an <h1>, and a <p>.', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Welcome</h1>
  <p>This is my first page.</p>
</body>
</html>`, 'HTML'),
    task(2, 'Accessible form', 'Write labeled name and email inputs (email required) with a submit button.', `<form>
  <label for="name">Name</label>
  <input id="name" type="text" name="name">
  <label for="email">Email</label>
  <input id="email" type="email" name="email" required>
  <button type="submit">Send</button>
</form>`, 'HTML'),
    task(3, 'CSS selectors', 'Style all elements with class highlight yellow, and the element with id main-title bold.', `.highlight { background-color: yellow; }
#main-title { font-weight: bold; }`, 'CSS'),
    task(4, 'Hover state', 'Give .btn a blue background that turns darker blue on :hover.', `.btn { background-color: #2563eb; color: white; padding: 8px 16px; border: none; }
.btn:hover { background-color: #1e40af; }`, 'CSS'),
    task(5, 'Accessibility fix', 'Fix the accessibility problems: <div onclick="submitForm()">Submit</div> and <img src="cat.jpg">.', `<button onclick="submitForm()">Submit</button>
<img src="cat.jpg" alt="A photo of a cat">`, 'HTML'),
    task(6, 'Accessibility fix: forms', 'Fix: <input type="text" placeholder="Username"> with no label.', `<label for="username">Username</label>
<input id="username" type="text" placeholder="Username">`, 'HTML'),
    task(7, 'Semantic landmarks', 'Wrap the main content in <main> and the navigation links in a <nav>.', `<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>
<main>
  <h1>Welcome</h1>
</main>`, 'HTML'),
    task(8, 'First program', 'Log "Hello, World!" followed by your own name on a second line.', `console.log("Hello, World!");
console.log("Rahul");`, 'JavaScript', true),
    task(9, 'let vs const', 'Declare a let score = 0, reassign it to 10, then log it. Try reassigning a const and log the resulting error message.', `let score = 0;
score = 10;
console.log(score); // 10

const pi = 3.14;
try {
  pi = 3;
} catch (err) {
  console.log(err.message); // Assignment to constant variable.
}`, 'JavaScript', true),
    task(10, 'Reverse a string', 'Write reverseString(str) and log reverseString("hello").', `function reverseString(str) {
  return str.split("").reverse().join("");
}
console.log(reverseString("hello")); // "olleh"`, 'JavaScript', true),
    task(11, 'Truthy and falsy', 'Log whether each of 0, "", "0", null, [] is truthy or falsy by wrapping each in Boolean(...).', `console.log(Boolean(0));    // false
console.log(Boolean(""));   // false
console.log(Boolean("0"));  // true
console.log(Boolean(null)); // false
console.log(Boolean([]));   // true`, 'JavaScript', true),
    task(12, 'Max of three', 'Write maxOfThree(a, b, c) and log maxOfThree(4, 9, 2).', `function maxOfThree(a, b, c) {
  return Math.max(a, b, c);
}
console.log(maxOfThree(4, 9, 2)); // 9`, 'JavaScript', true),
    task(13, 'Temperature converter', 'Write celsiusToFahrenheit(c) (F = C * 9/5 + 32) and log the result for 100.', `function celsiusToFahrenheit(c) {
  return c * 9 / 5 + 32;
}
console.log(celsiusToFahrenheit(100)); // 212`, 'JavaScript', true),
    task(14, 'Grade calculator', 'Write getGrade(score) returning "A" (≥90), "B" (≥80), "C" (≥70), else "F", and log results for 95, 72, 40.', `function getGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "F";
}
console.log(getGrade(95), getGrade(72), getGrade(40)); // A C F`, 'JavaScript', true),
    task(15, 'FizzBuzz', 'Log FizzBuzz for 1–20 ("Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for both, else the number).', `for (let i = 1; i <= 20; i++) {
  if (i % 15 === 0) console.log("FizzBuzz");
  else if (i % 3 === 0) console.log("Fizz");
  else if (i % 5 === 0) console.log("Buzz");
  else console.log(i);
}`, 'JavaScript', true),
  ],
}

export const HTML_JS_EXAM_3 = {
  id: 'exam-3',
  number: 3,
  weeks: 'Weeks 5–6',
  title: 'Module 4 — Exam 3',
  covers: 'Primitives, practice problems, array and string methods, callbacks, Dates, regular expressions, and error handling.',
  tasks: [
    task(1, 'Primitives vs reference', 'Copy a number into a new variable and change the copy; then copy an array into a new variable, push into the copy, and log both originals to show the difference.', `let a = 5;
let b = a;
b = 10;
console.log(a, b); // 5 10

let arr1 = [1, 2];
let arr2 = arr1;
arr2.push(3);
console.log(arr1, arr2); // [1, 2, 3] [1, 2, 3]`, 'JavaScript', true),
    task(2, 'Palindrome checker', 'Write isPalindrome(str) and log the result for "racecar" and "hello".', `function isPalindrome(str) {
  const clean = str.toLowerCase();
  return clean === clean.split("").reverse().join("");
}
console.log(isPalindrome("racecar")); // true
console.log(isPalindrome("hello"));   // false`, 'JavaScript', true),
    task(3, 'Count vowels', 'Write countVowels(str) and log countVowels("javascript").', `function countVowels(str) {
  const matches = str.match(/[aeiou]/gi);
  return matches ? matches.length : 0;
}
console.log(countVowels("javascript")); // 3`, 'JavaScript', true),
    task(4, '.map()', 'Log [1, 2, 3, 4].map(n => n * 2).', `console.log([1, 2, 3, 4].map(n => n * 2)); // [2, 4, 6, 8]`, 'JavaScript', true),
    task(5, '.filter() + .reduce()', 'Given [1,2,3,4,5,6], log the sum of only the even numbers using .filter() then .reduce().', `const nums = [1, 2, 3, 4, 5, 6];
const sum = nums.filter(n => n % 2 === 0).reduce((t, n) => t + n, 0);
console.log(sum); // 12`, 'JavaScript', true),
    task(6, '.find()', 'Given [{name:"Ana",age:17},{name:"Bo",age:22}], log the first user 18 or older using .find().', `const users = [{name: "Ana", age: 17}, {name: "Bo", age: 22}];
console.log(users.find(u => u.age >= 18)); // {name: "Bo", age: 22}`, 'JavaScript', true),
    task(7, '.split() and .join()', 'Log "2026-08-24" converted to "24/08/2026".', `const date = "2026-08-24";
const reformatted = date.split("-").reverse().join("/");
console.log(reformatted); // "24/08/2026"`, 'JavaScript', true),
    task(8, '.includes() and .indexOf()', 'Log whether "hello world" includes "world", and the index of "world".', `console.log("hello world".includes("world")); // true
console.log("hello world".indexOf("world"));   // 6`, 'JavaScript', true),
    task(9, 'Custom map with a callback', 'Write myMap(arr, callback) without using the built-in .map(), and log myMap([1,2,3], n => n * 10).', `function myMap(arr, callback) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(callback(arr[i], i, arr));
  }
  return result;
}
console.log(myMap([1, 2, 3], n => n * 10)); // [10, 20, 30]`, 'JavaScript', true),
    task(10, 'setTimeout', 'Log "Start", then after 1 second log "1 second later".', `console.log("Start");
setTimeout(() => {
  console.log("1 second later");
}, 1000);`, 'JavaScript', true),
    task(11, 'Dates: difference', 'Log the number of full days between "2026-01-01" and "2026-08-24".', `const start = new Date("2026-01-01");
const end = new Date("2026-08-24");
const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
console.log(days); // 235`, 'JavaScript', true),
    task(12, 'Dates: age', 'Write getAge(birthDateStr) for a date in YYYY-MM-DD format and log the result for your own birthdate.', `function getAge(birthDateStr) {
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) age--;
  return age;
}
console.log(getAge("2000-05-10"));`, 'JavaScript', true),
    task(13, 'Regular expressions: email', 'Write isValidEmail(str) and log results for "a@b.com" and "not-an-email".', `function isValidEmail(str) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(str);
}
console.log(isValidEmail("a@b.com"));       // true
console.log(isValidEmail("not-an-email"));  // false`, 'JavaScript', true),
    task(14, 'Math utilities', 'Log Math.max(3, 9, 1), Math.round(4.6), and a random integer between 1 and 10 using Math.random().', `console.log(Math.max(3, 9, 1));  // 9
console.log(Math.round(4.6));    // 5
console.log(Math.floor(Math.random() * 10) + 1); // 1–10`, 'JavaScript', true),
    task(15, 'Error handling', 'Write safeParseJSON(str) that returns the parsed object or null on invalid JSON, and log both a valid and an invalid call.', `function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    return null;
  }
}
console.log(safeParseJSON('{"a":1}')); // {a: 1}
console.log(safeParseJSON("not json")); // null`, 'JavaScript', true),
  ],
}

export const HTML_JS_EXAM_4 = {
  id: 'exam-4',
  number: 4,
  weeks: 'Weeks 7–8',
  title: 'Module 4 — Exam 4',
  covers: 'HTML pages, DOM manipulation, mini-projects, CSS box model and common properties, and responsive design.',
  tasks: [
    task(1, 'About Me page', 'Write an About Me section: a heading, a short bio paragraph, and a profile image with alt text.', `<h1>About Me</h1>
<img src="me.jpg" alt="Photo of Rahul smiling outdoors">
<p>I'm a trainee web developer learning HTML, CSS, and JavaScript.</p>`, 'HTML'),
    task(2, 'Navigation with anchor links', 'Write a nav with 3 links that jump to sections on the same page (#about, #projects, #contact).', `<nav>
  <a href="#about">About</a>
  <a href="#projects">Projects</a>
  <a href="#contact">Contact</a>
</nav>`, 'HTML'),
    task(3, 'DOM select and change text', 'Select <h1 id="title"> by id, change its text to "Updated!", then log the element to the console to confirm.', `const title = document.getElementById("title");
title.textContent = "Updated!";
console.log(title);`, 'JavaScript', true),
    task(4, 'DOM select by class', 'Select all .item elements, loop over them turning their text red, and log the NodeList.', `const items = document.querySelectorAll(".item");
items.forEach(el => el.style.color = "red");
console.log(items);`, 'JavaScript', true),
    task(5, 'Click counter', 'Add a click listener to <button id="btn"> that logs an incrementing click count each click (1, 2, 3, ...).', `let count = 0;
document.getElementById("btn").addEventListener("click", () => {
  count++;
  console.log(count);
});`, 'JavaScript', true),
    task(6, 'Create and append element', 'Create a new <li> with text "New item", append it to <ul id="list">, and log the new element.', `const li = document.createElement("li");
li.textContent = "New item";
document.getElementById("list").appendChild(li);
console.log(li);`, 'JavaScript', true),
    task(7, 'Add task from input', 'Clicking <button id="addBtn"> reads <input id="taskInput">, appends its value as a new <li> to <ul id="taskList">, clears the input, and logs the value that was added.', `document.getElementById("addBtn").addEventListener("click", () => {
  const input = document.getElementById("taskInput");
  const li = document.createElement("li");
  li.textContent = input.value;
  document.getElementById("taskList").appendChild(li);
  console.log(input.value);
  input.value = "";
});`, 'JavaScript', true),
    task(8, 'Remove from list', 'Clicking any <li> in #taskList removes that item and logs the removed text.', `document.getElementById("taskList").addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    console.log(e.target.textContent);
    e.target.remove();
  }
});`, 'JavaScript', true),
    task(9, 'Meme generator text', 'Read the values of <input id="topText"> and <input id="bottomText">, log both, and set them as the textContent of <p id="topOverlay"> / <p id="bottomOverlay">.', `const top = document.getElementById("topText").value;
const bottom = document.getElementById("bottomText").value;
console.log(top, bottom);
document.getElementById("topOverlay").textContent = top;
document.getElementById("bottomOverlay").textContent = bottom;`, 'JavaScript', true),
    task(10, 'CSS box model', 'Make .card 300px wide including 20px padding and a 2px border (use box-sizing), with 8px rounded corners.', `.card {
  box-sizing: border-box;
  width: 300px;
  padding: 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
}`, 'CSS'),
    task(11, 'Common CSS properties', 'Style an <h2> with a custom color, centered text, and font-size: 2rem.', `h2 {
  color: #1e293b;
  text-align: center;
  font-size: 2rem;
}`, 'CSS'),
    task(12, 'Pricing card', 'Write HTML + CSS for a pricing card: title, price, button, with padding, rounded corners, and a shadow.', `<div class="pricing-card">
  <h3>Pro</h3>
  <p class="price">$19/mo</p>
  <button>Choose Plan</button>
</div>
.pricing-card {
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  text-align: center;
}`, 'HTML + CSS'),
    task(13, 'Media query', 'Make .nav-links display: none below 700px width, and display: flex at 700px and above.', `.nav-links { display: none; }
@media (min-width: 700px) {
  .nav-links { display: flex; }
}`, 'CSS'),
    task(14, 'Responsive images', 'Make all images inside .content scale down to fit their container on small screens, never overflowing it.', `.content img {
  max-width: 100%;
  height: auto;
}`, 'CSS'),
    task(15, 'Count words', 'Write countWords(str) and log countWords("the quick brown fox").', `function countWords(str) {
  return str.trim().split(/\\s+/).length;
}
console.log(countWords("the quick brown fox")); // 4`, 'JavaScript', true),
  ],
}

export const HTML_JS_EXAM_5 = {
  id: 'exam-5',
  number: 5,
  weeks: 'Weeks 9–10',
  title: 'Module 4 — Exam 5',
  covers: 'Flexbox layout, OOP, fetch and async code, introductory React, SQL, and Express. This is an awareness check across new areas, not an expert-level test.',
  tasks: [
    task(1, 'Flexbox: testimonials', 'Lay out .testimonials .card children in a row with a 20px gap, wrapping on small screens, each card flexing to a minimum width of 250px.', `.testimonials {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.testimonials .card {
  flex: 1 1 250px;
}`, 'CSS'),
    task(2, 'Flexbox: alignment', 'Center .card content both horizontally and cross-axis, and make the card fill the parent height.', `.card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}`, 'CSS'),
    task(3, 'Two-column responsive layout', 'Build a .layout with .sidebar and .main side by side using Flexbox, stacking vertically below 600px.', `.layout { display: flex; gap: 16px; }
@media (max-width: 600px) {
  .layout { flex-direction: column; }
}`, 'CSS'),
    task(4, 'OOP: class', 'Write a Person class (constructor takes name, age) with an introduce() method, instantiate one, and log the result of introduce().', `class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  introduce() {
    return "Hi, I'm " + this.name + " and I'm " + this.age + " years old.";
  }
}
const p = new Person("Rahul", 30);
console.log(p.introduce());`, 'JavaScript', true),
    task(5, 'OOP: inheritance', 'Write Dog extends Animal (constructor takes name) adding speak(), and log the result of speak().', `class Animal {
  constructor(name) { this.name = name; }
}
class Dog extends Animal {
  speak() { return this.name + " says Woof!"; }
}
console.log(new Dog("Rex").speak());`, 'JavaScript', true),
    task(6, 'OOP: static method', 'Add a static method Person.compareAges(a, b) returning the older Person, and log the result for two instances.', `class Person {
  constructor(name, age) { this.name = name; this.age = age; }
  static compareAges(a, b) { return a.age > b.age ? a : b; }
}
const older = Person.compareAges(new Person("A", 20), new Person("B", 35));
console.log(older.name); // "B"`, 'JavaScript', true),
    task(7, 'Form submit', 'Add a submit listener to <form id="signupForm"> that prevents the default page reload and logs the value of its <input name="email">.', `document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  console.log(e.target.email.value);
});`, 'JavaScript', true),
    task(8, 'Fetch with async/await', 'Write async function getPost(id) that fetches the post at https://jsonplaceholder.typicode.com/posts/{id}, and log the result of getPost(1).', `async function getPost(id) {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts/" + id);
  return await res.json();
}
getPost(1).then(post => console.log(post));`, 'JavaScript', true),
    task(9, 'Fetch error handling', 'Wrap the fetch in a try/catch that logs "Request failed:" plus the error message if it fails. Check the HTTP response and test with a missing post.', `async function getPost(id) {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts/" + id);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.log("Request failed:", err.message);
    return null;
  }
}
getPost("bad-url").then(post => console.log(post));`, 'JavaScript', true),
    task(10, 'React: props', 'Write a functional Greeting component that renders Hello, {props.name}!.', `function Greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}
// usage: <Greeting name="Rahul" />`, 'React'),
    task(11, 'React: state', 'Write a functional Counter component with a count state starting at 0 and a button that increments it.', `import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Add</button>
    </div>
  );
}`, 'React'),
    task(12, 'SQL: SELECT and WHERE', 'Write a query returning all customers whose country is South Africa.', `SELECT * FROM customers WHERE country = 'South Africa';`, 'SQL'),
    task(13, 'SQL: JOIN', 'Return each order id and total plus the name of the customer who placed it (orders.customer_id → customers.id).', `SELECT orders.id, orders.total, customers.name
FROM orders
INNER JOIN customers ON orders.customer_id = customers.id;`, 'SQL'),
    task(14, 'Express: GET route', 'Write GET /api/hello responding with JSON { message: "Hello, world!" }.', `app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello, world!" });
});`, 'Express'),
    task(15, 'Express: POST with validation', 'Write POST /api/users reading name from req.body, responding 400 + { error: "name is required" } if missing, otherwise 201 + { name }. ', `app.post("/api/users", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }
  res.status(201).json({ name });
});`, 'Express'),
  ],
}

export const HTML_JS_EXAMS = [
  HTML_JS_EXAM_1,
  HTML_JS_EXAM_2,
  HTML_JS_EXAM_3,
  HTML_JS_EXAM_4,
  HTML_JS_EXAM_5,
]

