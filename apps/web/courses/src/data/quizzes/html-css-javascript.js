export default [
  {
    id: 'html-css-javascript-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'CSS Positioning',
    prompt: `A developer sets:

.modal {
  z-index: 9999;
}

However, the modal still appears behind other elements.

What is the MOST likely reason?`,
    options: [
      'The element has position: static',
      'The z-index value is too small',
      'The modal must use display: block',
      'Only flex containers support z-index'
    ],
    correctAnswer: 'The element has position: static',
    explanation: 'z-index only affects positioned elements (relative, absolute, fixed, or sticky). If an element uses the default position: static, changing z-index has no effect.'
  },

  {
    id: 'html-css-javascript-2',
    type: 'code-output',
    difficulty: 'expert',
    category: 'CSS Layout',
    prompt: `A container has:

display: flex;
justify-content: center;
align-items: center;
height: 100vh;

What is the result?`,
    options: [
      'Children are centered horizontally only',
      'Children are centered vertically only',
      'Children are centered both horizontally and vertically',
      'Children stretch to fill the viewport'
    ],
    correctAnswer: 'Children are centered both horizontally and vertically',
    explanation: 'justify-content controls the main axis and align-items controls the cross axis. With the default flex-direction: row, this combination perfectly centers content in both directions.'
  },

  {
    id: 'html-css-javascript-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Responsive Design',
    prompt: `A webpage looks perfect on desktop but requires horizontal scrolling on mobile devices.

What is the MOST likely cause?`,
    options: [
      'A fixed-width element wider than the viewport',
      'Too many HTML comments',
      'Using semantic HTML elements',
      'Missing display: flex'
    ],
    correctAnswer: 'A fixed-width element wider than the viewport',
    explanation: 'Hardcoded widths such as width: 1200px commonly cause horizontal scrolling on smaller screens. Responsive layouts should prefer percentages, max-width, flexbox, or CSS Grid.'
  },

  {
    id: 'html-css-javascript-4',
    type: 'code-review',
    difficulty: 'hard',
    category: 'Accessibility',
    prompt: `A developer creates a button like this:

<div onclick="submitForm()">Submit</div>

Another developer writes:

<button type="submit">Submit</button>

Which implementation follows HTML best practices?`,
    options: [
      'The first developer',
      'The second developer',
      'Both are equally correct',
      'Neither'
    ],
    correctAnswer: 'The second developer',
    explanation: 'The <button> element provides built-in keyboard accessibility, focus handling, semantic meaning, and better support for assistive technologies. Using a clickable <div> should generally be avoided for buttons.'
  },

  {
    id: 'html-css-javascript-5',
    type: 'mcq',
    difficulty: 'expert',
    category: 'CSS Specificity',
    prompt: `A CSS rule is not being applied even though the selector appears correct.

What should be investigated FIRST?`,
    options: [
      'CSS specificity and rule order',
      'Restart the browser',
      'Add !important everywhere',
      'Replace the stylesheet'
    ],
    correctAnswer: 'CSS specificity and rule order',
    explanation: 'Conflicting selectors with higher specificity or later declarations often override expected styles. Understanding specificity is more effective than immediately using !important.'
  },

  {
    id: 'html-css-javascript-6',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Performance',
    prompt: `A page contains 5,000 DOM elements and scrolling feels sluggish.

Which change is MOST likely to improve rendering performance?`,
    options: [
      'Reduce unnecessary DOM elements and nesting',
      'Increase the z-index values',
      'Use more inline styles',
      'Replace all <div> elements with <span>'
    ],
    correctAnswer: 'Reduce unnecessary DOM elements and nesting',
    explanation: 'Large and deeply nested DOM trees increase rendering, layout, and repaint costs. Simplifying the DOM generally improves browser performance.'
  },

  {
    id: 'html-css-javascript-7',
    type: 'code-output',
    difficulty: 'expert',
    category: 'CSS Box Model',
    prompt: `An element has:

width: 200px;
padding: 20px;
border: 5px solid black;
box-sizing: content-box;

What is its total rendered width?`,
    options: [
      '200px',
      '210px',
      '240px',
      '250px'
    ],
    correctAnswer: '250px',
    explanation: 'With box-sizing: content-box, the declared width excludes padding and borders. Total width = 200 + 20 + 20 + 5 + 5 = 250px. This is a common source of layout issues in CSS.'
  },{
  id: 'html-css-javascript-8',
  type: 'mcq',
  difficulty: 'expert',
  category: 'CSS Positioning',
  prompt: `A tooltip is absolutely positioned inside a card.

The tooltip has:

position: absolute;
z-index: 9999;

Yet it is still partially hidden because the card has:

overflow: hidden;

What is the MOST likely reason?`,
  options: [
    'z-index is too low',
    'overflow: hidden clips overflowing content regardless of z-index',
    'The tooltip must use display: block',
    'Absolute positioning does not support z-index'
  ],
  correctAnswer: 'overflow: hidden clips overflowing content regardless of z-index',
  explanation: 'z-index controls stacking order, not clipping. If a parent has overflow: hidden, child elements cannot render outside that container even with a very high z-index.'
},

{
  id: 'html-css-javascript-9',
  type: 'code-output',
  difficulty: 'expert',
  category: 'CSS Specificity',
  prompt: `Given:

#header .title {
  color: blue;
}

.title {
  color: red !important;
}

<div id="header">
  <h1 class="title">Welcome</h1>
</div>

What color is the text?`,
  options: [
    'Blue',
    'Red',
    'Browser default',
    'Inheritance makes it purple'
  ],
  correctAnswer: 'Red',
  explanation: 'Although the first selector has higher specificity, !important overrides normal declarations. Since only one declaration uses !important, the text becomes red.'
},

{
  id: 'html-css-javascript-10',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Responsive Design',
  prompt: `A responsive layout works perfectly until a long email address appears, causing the page to overflow horizontally.

Which CSS property is MOST likely needed?`,
  options: [
    'overflow-wrap: break-word;',
    'text-align: center;',
    'display: inline;',
    'white-space: nowrap;'
  ],
  correctAnswer: 'overflow-wrap: break-word;',
  explanation: 'Long unbroken strings such as email addresses or URLs can exceed container width. overflow-wrap (or word-break when appropriate) allows the browser to wrap long words and prevent horizontal scrolling.'
},

{
  id: 'html-css-javascript-11',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Accessibility',
  prompt: `Two developers build a navigation menu.

Developer A:

<div onclick="goHome()">Home</div>

Developer B:

<a href="/home">Home</a>

Which implementation should be approved during code review?`,
  options: [
    'Developer A',
    'Developer B',
    'Both are equally correct',
    'Neither'
  ],
  correctAnswer: 'Developer B',
  explanation: 'Navigation should use semantic <a> elements. They provide keyboard support, accessibility, browser history integration, right-click actions, SEO benefits, and expected behavior without additional JavaScript.'
},

{
  id: 'html-css-javascript-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Rendering Performance',
  prompt: `A page re-renders slowly whenever users resize the browser window.

What is the MOST likely cause?`,
  options: [
    'Frequent layout recalculations caused by a large, complex DOM',
    'Using semantic HTML elements',
    'Using CSS variables',
    'Too many comments in HTML'
  ],
  correctAnswer: 'Frequent layout recalculations caused by a large, complex DOM',
  explanation: 'Resizing forces browsers to recalculate layout and repaint affected elements. Large DOM trees, deeply nested layouts, and expensive layout calculations increase rendering cost.'
},

{
  id: 'html-css-javascript-13',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Flexbox',
  prompt: `A flex container contains three items.

The CSS is:

display: flex;
justify-content: space-between;

The first item is aligned to the left edge and the last item to the right edge.

Where is the second item placed?`,
  options: [
    'Centered exactly in the container',
    'Evenly distributed with equal space between adjacent items',
    'Directly after the first item',
    'Below the first item'
  ],
  correctAnswer: 'Evenly distributed with equal space between adjacent items',
  explanation: 'space-between places the first and last items at the container edges while distributing the remaining free space equally between adjacent items. The middle item is not necessarily mathematically centered unless widths are symmetrical.'
},

{
  id: 'html-css-javascript-14',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Debugging',
  prompt: `Users report that clicking a button sometimes does nothing.

Inspection shows another transparent element covering the page with:

position: fixed;
opacity: 0;

What is the MOST likely issue?`,
  options: [
    'The invisible element is intercepting mouse events.',
    'Opacity disables pointer events automatically.',
    'The button needs a higher font size.',
    'The browser ignores transparent elements.'
  ],
  correctAnswer: 'The invisible element is intercepting mouse events.',
  explanation: 'opacity: 0 makes an element invisible but it still participates in layout and receives pointer events unless pointer-events: none is applied. Invisible overlays are a common cause of seemingly "unclickable" buttons.'
},
{
  id: 'html-css-javascript-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'CSS Grid',
  prompt: `A dashboard uses CSS Grid.

grid-template-columns: repeat(3, 1fr);

One card contains an extremely long unbreakable string, causing the entire layout to overflow.

What is the MOST likely cause?`,
  options: [
    'fr units automatically ignore content size',
    'Grid items have a default min-width: auto, preventing them from shrinking',
    'Grid does not support responsive layouts',
    'The container should use display: flex instead'
  ],
  correctAnswer: 'Grid items have a default min-width: auto, preventing them from shrinking',
  explanation: 'Grid items default to min-width: auto, meaning long content can force columns to grow beyond the available space. Setting min-width: 0 on the grid item often fixes this subtle but common production issue.'
},

{
  id: 'html-css-javascript-16',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Responsive Design',
  prompt: `Two developers implement a responsive image.

Developer A:

img {
  width: 100%;
}

Developer B:

img {
  max-width: 100%;
  height: auto;
}

Which implementation should be approved?`,
  options: [
    'Developer A',
    'Developer B',
    'Both are equivalent',
    'Neither'
  ],
  correctAnswer: 'Developer B',
  explanation: 'max-width: 100% prevents images from overflowing while allowing smaller images to retain their natural size. height: auto preserves the aspect ratio during resizing.'
},

{
  id: 'html-css-javascript-17',
  type: 'mcq',
  difficulty: 'expert',
  category: 'CSS Cascade',
  prompt: `A CSS rule is not applied even though it appears later in the stylesheet.

Which is the MOST likely explanation?`,
  options: [
    'A selector with higher specificity overrides it',
    'Browsers ignore later CSS rules',
    'The stylesheet loaded successfully',
    'HTML elements can only have one CSS rule'
  ],
  correctAnswer: 'A selector with higher specificity overrides it',
  explanation: 'The CSS cascade considers importance, specificity, and source order. A more specific selector can override a later, less specific rule.'
},

{
  id: 'html-css-javascript-18',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Box Model',
  prompt: `A div has:

width: 300px;
padding: 20px;
border: 10px solid;
box-sizing: border-box;

What is its rendered width?`,
  options: [
    '300px',
    '340px',
    '360px',
    '320px'
  ],
  correctAnswer: '300px',
  explanation: 'With border-box, the declared width already includes content, padding, and borders. Unlike content-box, the total rendered width remains exactly 300px.'
},

{
  id: 'html-css-javascript-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Accessibility',
  prompt: `A form contains several input fields but users relying on screen readers struggle to understand them.

Which improvement provides the GREATEST accessibility benefit?`,
  options: [
    'Increase the font size',
    'Associate every input with a proper <label>',
    'Add more placeholder text',
    'Use brighter colors'
  ],
  correctAnswer: 'Associate every input with a proper <label>',
  explanation: 'A properly associated <label> gives inputs an accessible name, improves keyboard usability, and benefits assistive technologies. Placeholders should not replace labels.'
},

{
  id: 'html-css-javascript-20',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Debugging',
  prompt: `A fixed navigation bar overlaps the top of every page section when users click navigation links.

The links work correctly, but the section titles are hidden beneath the navbar.

What is the BEST CSS solution?`,
  options: [
    'Increase the navbar z-index',
    'Apply scroll-margin-top to the target sections',
    'Reduce the navbar height',
    'Replace position: fixed with position: absolute'
  ],
  correctAnswer: 'Apply scroll-margin-top to the target sections',
  explanation: 'When navigating to anchors, scroll-margin-top allows sections to stop below a fixed header. This modern CSS solution avoids JavaScript workarounds and improves user experience.'
}
,
  {
    id: 'javascript-1',
    type: 'code-output',
    difficulty: 'hard',
    category: 'Hoisting',
    prompt: `What is the output?

console.log(a);

var a = 10;`,
    options: [
      'undefined',
      '10',
      'ReferenceError',
      'null'
    ],
    correctAnswer: 'undefined',
    explanation: 'Variables declared with var are hoisted and initialized with undefined during the creation phase. Therefore the variable exists before assignment, making the first console.log print undefined instead of throwing an error.'
  },

  {
    id: 'javascript-2',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Temporal Dead Zone',
    prompt: `What is the output?

console.log(a);

let a = 10;`,
    options: [
      'undefined',
      '10',
      'ReferenceError',
      'null'
    ],
    correctAnswer: 'ReferenceError',
    explanation: 'let and const declarations are hoisted but remain inside the Temporal Dead Zone until execution reaches their declaration. Accessing them before initialization throws a ReferenceError.'
  },

  {
    id: 'javascript-3',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Closures',
    prompt: `What is the output?

function counter() {
  let count = 0;

  return function () {
    return ++count;
  };
}

const c1 = counter();

console.log(c1());
console.log(c1());
console.log(c1());`,
    options: [
      '1 2 3',
      '1 1 1',
      '0 1 2',
      'ReferenceError'
    ],
    correctAnswer: '1 2 3',
    explanation: 'The returned function forms a closure over the count variable. Even after counter() finishes executing, count remains alive inside the closure, allowing its value to persist between function calls.'
  },

  {
    id: 'javascript-4',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Objects',
    prompt: `What is the output?

const a = {
  value: 10
};

const b = a;

b.value = 20;

console.log(a.value);`,
    options: [
      '10',
      '20',
      'undefined',
      'ReferenceError'
    ],
    correctAnswer: '20',
    explanation: 'Objects are assigned by reference. Both a and b point to the same object in memory, so changing the object through one variable is visible through the other.'
  },

  {
    id: 'javascript-5',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Equality',
    prompt: `What is the output?

console.log([] == false);`,
    options: [
      'true',
      'false',
      'TypeError',
      'undefined'
    ],
    correctAnswer: 'true',
    explanation: 'Loose equality (==) performs type coercion. [] becomes an empty string (""), which converts to 0. false also converts to 0, making the comparison evaluate to true. This is one reason many teams recommend using ===.'
  },

  {
    id: 'javascript-6',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Event Loop',
    prompt: `What is the output?

console.log("A");

Promise.resolve().then(() => console.log("B"));

console.log("C");`,
    options: [
      'A C B',
      'A B C',
      'B A C',
      'C A B'
    ],
    correctAnswer: 'A C B',
    explanation: 'JavaScript executes synchronous code first. Promise callbacks are placed in the microtask queue, which runs immediately after the current synchronous execution finishes and before any macrotasks.'
  },

  {
    id: 'javascript-7',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Async Functions',
    prompt: `What is the output?

async function test() {
  return 100;
}

console.log(test());`,
    options: [
      '100',
      'Promise { 100 }',
      'Promise { <fulfilled>: 100 }',
      'undefined'
    ],
    correctAnswer: 'Promise { <fulfilled>: 100 }',
    explanation: 'Every async function always returns a Promise. Returning 100 automatically wraps the value inside a resolved Promise. The exact console formatting may differ slightly between environments, but the returned value is always a fulfilled Promise.'
  },
  {
  id: 'javascript-8',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Closures',
  prompt: `What is the output?

for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
  options: [
    '0 1 2',
    '3 3 3',
    '0 0 0',
    'ReferenceError'
  ],
  correctAnswer: '3 3 3',
  explanation: 'var is function-scoped, so all callbacks share the same variable i. By the time setTimeout callbacks execute, the loop has completed and i equals 3. Using let would create a new binding for each iteration.'
},

{
  id: 'javascript-9',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Arrow Functions',
  prompt: `What is the output?

const user = {
  name: "Alice",
  greet: () => console.log(this.name)
};

user.greet();`,
  options: [
    'Alice',
    'undefined',
    'ReferenceError',
    'null'
  ],
  correctAnswer: 'undefined',
  explanation: 'Arrow functions do not have their own this. They inherit it lexically from the surrounding scope, which is not the user object in this example.'
},

{
  id: 'javascript-10',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Promises',
  prompt: `What is the output?

console.log(1);

setTimeout(() => console.log(2), 0);

Promise.resolve().then(() => console.log(3));

console.log(4);`,
  options: [
    '1 4 3 2',
    '1 3 4 2',
    '1 2 3 4',
    '4 3 2 1'
  ],
  correctAnswer: '1 4 3 2',
  explanation: 'Synchronous code runs first (1,4). Promise callbacks are microtasks and execute before macrotasks such as setTimeout, so 3 prints before 2.'
},

{
  id: 'javascript-11',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Spread Operator',
  prompt: `What is the output?

const a = { name: "John", address: { city: "Delhi" } };

const b = { ...a };

b.address.city = "Mumbai";

console.log(a.address.city);`,
  options: [
    'Delhi',
    'Mumbai',
    'undefined',
    'ReferenceError'
  ],
  correctAnswer: 'Mumbai',
  explanation: 'The spread operator performs a shallow copy. Nested objects are still shared by reference, so modifying address affects both objects.'
},

{
  id: 'javascript-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Arrays',
  prompt: `You need to transform an array into another array of the same length.

Which method is the MOST appropriate?`,
  options: [
    'forEach()',
    'map()',
    'filter()',
    'find()'
  ],
  correctAnswer: 'map()',
  explanation: 'map() returns a new array with the same number of elements after applying a transformation. forEach() returns undefined and is intended for side effects.'
},

{
  id: 'javascript-13',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Type Coercion',
  prompt: `What is the output?

console.log(null == undefined);
console.log(null === undefined);`,
  options: [
    'true false',
    'false true',
    'true true',
    'false false'
  ],
  correctAnswer: 'true false',
  explanation: 'Loose equality considers null and undefined equal. Strict equality compares both value and type, so they are different.'
},

{
  id: 'javascript-14',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Optional Chaining',
  prompt: `What is the output?

const user = {};

console.log(user.profile?.email ?? "Not Available");`,
  options: [
    'undefined',
    'null',
    'Not Available',
    'ReferenceError'
  ],
  correctAnswer: 'Not Available',
  explanation: 'Optional chaining safely returns undefined when profile does not exist. The nullish coalescing operator (??) then provides the fallback value.'
},

{
  id: 'javascript-15',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Production Debugging',
  prompt: `A production application occasionally crashes with:

TypeError: Cannot read properties of undefined

Which change is MOST likely to make the code safer without changing its intended behavior?`,
  options: [
    'Replace all == with ===',
    'Use optional chaining (?.) where objects may be missing',
    'Wrap the entire application in try...catch',
    'Replace let with var'
  ],
  correctAnswer: 'Use optional chaining (?.) where objects may be missing',
  explanation: 'Optional chaining safely stops property access when an intermediate value is null or undefined. It is specifically designed to prevent errors such as "Cannot read properties of undefined" while keeping the code concise.'
},
{
  id: 'html-css-javascript-36',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'HTML Semantics',
  prompt: 'Which element is intended for the main, unique content of a page?',
  options: ['<main>', '<section>', '<aside>', '<footer>'],
  correctAnswer: '<main>',
  explanation: 'The main element identifies the dominant content of the document. A page should generally have one visible main landmark, which helps assistive technology users navigate.'
},
{
  id: 'html-css-javascript-37',
  type: 'code-output',
  difficulty: 'medium',
  category: 'JavaScript Equality',
  prompt: 'What does this expression evaluate to?\n\n0 == false',
  options: ['true, because loose equality coerces operands', 'false, because the types differ', 'undefined', 'It throws a TypeError'],
  correctAnswer: 'true, because loose equality coerces operands',
  explanation: 'The == operator performs type coercion. In this comparison, false converts to numeric 0, so the values compare equal. The === operator avoids this coercion and returns false here.'
}

];
