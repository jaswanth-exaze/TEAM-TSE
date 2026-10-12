export default [
  {
    id: 'reactjs-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Rendering',
    prompt: `A component calls:

setCount(count + 1);

directly inside the component body (not inside an event handler or useEffect).

What happens?`,
    options: [
      'React automatically ignores it',
      'The component enters an infinite render loop',
      'The state updates only once',
      'Nothing happens'
    ],
    correctAnswer: 'The component enters an infinite render loop',
    explanation: 'Every call to a state setter schedules another render. Since the setter is executed during rendering, React continuously re-renders the component until it throws a "Too many re-renders" error.'
  },

  {
    id: 'reactjs-2',
    type: 'code-review',
    difficulty: 'expert',
    category: 'useEffect',
    prompt: `A developer writes:

useEffect(() => {
    fetchUsers();
});

Users report the API is called repeatedly.

What is the MOST likely reason?`,
    options: [
      'The dependency array is missing',
      'fetch() retries automatically',
      'React calls effects only once',
      'useEffect cannot call APIs'
    ],
    correctAnswer: 'The dependency array is missing',
    explanation: 'Without a dependency array, useEffect executes after every render. If the effect updates state, another render occurs, causing the effect to run again.'
  },

  {
    id: 'reactjs-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Keys',
    prompt: `A developer renders a list using:

items.map((item, index) => ...)

and uses the array index as the key.

Later users can reorder the list.

What problem is MOST likely?`,
    options: [
      'React cannot render arrays',
      'Component state may become associated with the wrong item',
      'The application will not compile',
      'Keys are only needed in development'
    ],
    correctAnswer: 'Component state may become associated with the wrong item',
    explanation: 'Keys identify component instances. Using indexes as keys in reorderable lists can cause React to reuse the wrong component instance, leading to incorrect UI state.'
  },

  {
    id: 'reactjs-4',
    type: 'code-output',
    difficulty: 'expert',
    category: 'State',
    prompt: `const [count, setCount] = useState(0);

setCount(count + 1);
setCount(count + 1);

After React processes these updates, what is count?`,
    options: [
      '1',
      '2',
      '0',
      'Depends on StrictMode'
    ],
    correctAnswer: '1',
    explanation: 'Both updates use the same stale value of count (0). React batches the updates, so both requests become setCount(1). Using the functional form setCount(c => c + 1) would produce 2.'
  },

  {
    id: 'reactjs-5',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Performance',
    prompt: `A parent component re-renders frequently.

A child component receives the same props every time but still re-renders.

Which React API is MOST appropriate?`,
    options: [
      'React.memo',
      'useEffect',
      'useContext',
      'Fragment'
    ],
    correctAnswer: 'React.memo',
    explanation: 'React.memo memoizes functional components and skips rendering when props have not changed, reducing unnecessary work.'
  },

  {
    id: 'reactjs-6',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Forms',
    prompt: `Developer A creates:

<input value={name} onChange={...} />

Developer B creates:

<input />

Which implementation is considered a controlled component?`,
    options: [
      'Developer A',
      'Developer B',
      'Both',
      'Neither'
    ],
    correctAnswer: 'Developer A',
    explanation: 'A controlled component stores its value in React state. The displayed value always comes from state, making validation and synchronization much easier.'
  },

  {
    id: 'reactjs-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Context',
    prompt: `A theme value must be accessed by dozens of deeply nested components.

Passing it through every intermediate component has become difficult.

Which React feature is MOST appropriate?`,
    options: [
      'React Context',
      'React.memo',
      'Fragments',
      'useRef'
    ],
    correctAnswer: 'React Context',
    explanation: 'Context allows data to be shared throughout a component tree without manually passing props through every intermediate component (prop drilling).'
  },
  {
  id: 'reactjs-8',
  type: 'mcq',
  difficulty: 'expert',
  category: 'useEffect',
  prompt: `A component has:

useEffect(() => {
    fetchUsers();
}, [users]);

fetchUsers() updates the users state.

What is the MOST likely outcome?`,
  options: [
    'The effect runs only once',
    'An infinite fetch loop',
    'The effect never runs',
    'React ignores duplicate state updates'
  ],
  correctAnswer: 'An infinite fetch loop',
  explanation: 'The effect depends on users, and fetchUsers() updates users. Every update changes the dependency, causing the effect to execute again, resulting in an endless loop.'
},

{
  id: 'reactjs-9',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A parent component passes this prop:

<UserList users={[...users]} />

The child is wrapped with React.memo but still re-renders every time.

Why?`,
  options: [
    'React.memo does not work with arrays',
    'A new array reference is created on every render',
    'Arrays cannot be passed as props',
    'React always re-renders memoized components'
  ],
  correctAnswer: 'A new array reference is created on every render',
  explanation: 'React.memo performs a shallow comparison. [...users] creates a brand-new array on every render, so React considers the prop changed.'
},

{
  id: 'reactjs-10',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Hooks',
  prompt: `Why must React Hooks always be called at the top level of a component?`,
  options: [
    'To keep the order of Hook calls consistent between renders',
    'Hooks cannot be called inside functions',
    'Hooks require JSX',
    'Hooks only work in development'
  ],
  correctAnswer: 'To keep the order of Hook calls consistent between renders',
  explanation: 'React identifies Hook state by the order in which Hooks are called. Calling Hooks conditionally changes that order and breaks React\'s internal state tracking.'
},

{
  id: 'reactjs-11',
  type: 'code-output',
  difficulty: 'expert',
  category: 'State Updates',
  prompt: `const [count, setCount] = useState(0);

setCount(c => c + 1);
setCount(c => c + 1);

What will count become after React processes the updates?`,
  options: [
    '1',
    '2',
    '0',
    'Depends on StrictMode'
  ],
  correctAnswer: '2',
  explanation: 'Functional updates receive the latest state value. The first update produces 1, and the second receives 1 and produces 2.'
},

{
  id: 'reactjs-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Refs',
  prompt: `Which Hook lets you store a mutable value that does NOT trigger a component re-render when it changes?`,
  options: [
    'useState',
    'useReducer',
    'useRef',
    'useMemo'
  ],
  correctAnswer: 'useRef',
  explanation: 'useRef stores mutable values that persist across renders without causing another render. It is commonly used for DOM references, timers, and previous values.'
},

{
  id: 'reactjs-13',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Lists',
  prompt: `A developer uses:

<li key={Math.random()}>

inside a mapped list.

What is the biggest problem?`,
  options: [
    'Keys must be strings',
    'Every render generates new keys, forcing React to recreate every list item',
    'Math.random() is deprecated',
    'React ignores random keys'
  ],
  correctAnswer: 'Every render generates new keys, forcing React to recreate every list item',
  explanation: 'Keys should remain stable across renders. Random keys cause React to discard existing components and recreate them, losing state and hurting performance.'
},

{
  id: 'reactjs-14',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A child component receives a callback prop.

The callback is recreated on every parent render, causing unnecessary child renders.

Which Hook is MOST appropriate?`,
  options: [
    'useMemo',
    'useCallback',
    'useRef',
    'useEffect'
  ],
  correctAnswer: 'useCallback',
  explanation: 'useCallback memoizes function references, preventing unnecessary child renders when used together with React.memo.'
},

{
  id: 'reactjs-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Lifecycle',
  prompt: `A component starts a timer inside useEffect.

What should usually happen when the component unmounts?`,
  options: [
    'Nothing',
    'Clear the timer in the cleanup function',
    'Call setState()',
    'Restart the timer'
  ],
  correctAnswer: 'Clear the timer in the cleanup function',
  explanation: 'Timers, subscriptions, and event listeners should be cleaned up in the function returned from useEffect to prevent memory leaks and unexpected behavior.'
},

{
  id: 'reactjs-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Debugging',
  prompt: `A React page becomes slower every time users navigate back to it.

Investigation shows multiple event listeners attached to window.

What is the MOST likely cause?`,
  options: [
    'The component did not remove event listeners during cleanup',
    'React.memo is missing',
    'The component uses Context',
    'Too many props are passed'
  ],
  correctAnswer: 'The component did not remove event listeners during cleanup',
  explanation: 'Event listeners added inside useEffect should be removed in the cleanup function. Failing to do so causes duplicate listeners, memory leaks, and progressively slower applications.'
},
{
  id: 'reactjs-17',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Context',
  prompt: `A Context Provider stores:

{
  user,
  theme,
  notifications
}

Updating only the notifications causes every consumer to re-render.

What is the BEST optimization?`,
  options: [
    'Split unrelated values into separate Contexts',
    'Wrap every component with React.memo',
    'Move everything into useRef',
    'Use useEffect instead of Context'
  ],
  correctAnswer: 'Split unrelated values into separate Contexts',
  explanation: 'Whenever a Context value changes, every consumer re-renders. Splitting unrelated state into separate Contexts reduces unnecessary rendering and improves scalability.'
},

{
  id: 'reactjs-18',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A component contains:

const expensiveData = expensiveCalculation(items);

The calculation takes nearly 800ms and runs on every render.

What is the BEST optimization?`,
  options: [
    'Move it into useMemo()',
    'Move it into useState()',
    'Wrap the component with Fragment',
    'Use useEffect()'
  ],
  correctAnswer: 'Move it into useMemo()',
  explanation: 'useMemo caches expensive computed values until their dependencies change, preventing unnecessary recalculation during unrelated renders.'
},

{
  id: 'reactjs-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'StrictMode',
  prompt: `While developing, an API request appears to execute twice.

The production build behaves correctly.

What is the MOST likely reason?`,
  options: [
    'React StrictMode intentionally invokes certain logic twice in development',
    'React retries failed requests automatically',
    'fetch() always sends duplicate requests',
    'The browser cache is disabled'
  ],
  correctAnswer: 'React StrictMode intentionally invokes certain logic twice in development',
  explanation: 'In development, StrictMode intentionally invokes components and certain lifecycle logic twice to help detect side effects. This behavior does not occur in production.'
},

{
  id: 'reactjs-20',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Forms',
  prompt: `A form contains 100 controlled input fields.

Typing feels noticeably slow.

What is the MOST likely reason?`,
  options: [
    'Every keystroke causes React state updates and component re-renders',
    'Controlled inputs cannot handle more than 50 fields',
    'React automatically validates every field',
    'The browser limits input performance'
  ],
  correctAnswer: 'Every keystroke causes React state updates and component re-renders',
  explanation: 'Controlled components update React state on every keystroke. Large forms may require memoization, component splitting, or specialized form libraries to improve performance.'
},

{
  id: 'reactjs-21',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Suspense',
  prompt: `What is the primary purpose of React Suspense?`,
  options: [
    'Display fallback UI while asynchronous resources are loading',
    'Prevent component re-renders',
    'Replace useEffect()',
    'Improve CSS performance'
  ],
  correctAnswer: 'Display fallback UI while asynchronous resources are loading',
  explanation: 'Suspense allows React to display fallback content while components or asynchronous resources are still loading, improving user experience.'
},

{
  id: 'reactjs-22',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Error Boundaries',
  prompt: `A component throws an unexpected rendering error.

You want the rest of the application to continue working.

Which React feature is MOST appropriate?`,
  options: [
    'Error Boundary',
    'useMemo',
    'useReducer',
    'StrictMode'
  ],
  correctAnswer: 'Error Boundary',
  explanation: 'Error Boundaries catch rendering errors below them in the component tree and display fallback UI instead of crashing the entire application.'
},

{
  id: 'reactjs-23',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Rendering',
  prompt: `A parent component updates every second.

Its child receives exactly the same props but still performs expensive rendering.

Which combination is MOST appropriate?`,
  options: [
    'React.memo + stable props',
    'useEffect()',
    'Context',
    'Fragment'
  ],
  correctAnswer: 'React.memo + stable props',
  explanation: 'React.memo skips rendering only when props remain referentially equal. Stable props are essential for memoization to work effectively.'
},

{
  id: 'reactjs-24',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Hooks',
  prompt: `A developer writes:

if (loggedIn) {
    const [user, setUser] = useState(null);
}

Why is this incorrect?`,
  options: [
    'Hooks cannot be called conditionally',
    'useState only works inside useEffect',
    'React does not support conditions',
    'The state should be global'
  ],
  correctAnswer: 'Hooks cannot be called conditionally',
  explanation: 'React relies on Hooks being called in exactly the same order during every render. Conditional Hook calls break this ordering and cause unpredictable behavior.'
},

{
  id: 'reactjs-25',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Final Boss',
  prompt: `A production React application becomes slower the longer it stays open.

Investigation shows:

• Memory usage continuously increases
• Multiple API requests are triggered for a single user action
• Event listeners accumulate after navigation

What is the MOST likely root cause?`,
  options: [
    'Missing cleanup functions inside useEffect()',
    'React.memo is missing',
    'Context API is too slow',
    'The Virtual DOM is full'
  ],
  correctAnswer: 'Missing cleanup functions inside useEffect()',
  explanation: 'Effects that register timers, subscriptions, sockets, or event listeners must clean them up when the component unmounts or dependencies change. Missing cleanup causes memory leaks, duplicate listeners, repeated API calls, and progressively slower applications.'
},
{
  id: 'reactjs-26',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'JSX',
  prompt: 'What does a component need to return to render nothing intentionally?',
  options: ['null', 'undefined only', 'An empty string is required', 'A DOM node created with document.createElement'],
  correctAnswer: 'null',
  explanation: 'Returning null from a React component renders no visible content. This is useful for conditional rendering when there is nothing to show.'
},
{
  id: 'reactjs-27',
  type: 'mcq',
  difficulty: 'medium',
  category: 'State Updates',
  prompt: 'Several state updates depend on the previous value. Which form avoids reading a stale render value?',
  options: ['setCount(current => current + 1)', 'setCount(count + 1) in every queued update', 'Assign directly to count', 'Call render() manually'],
  correctAnswer: 'setCount(current => current + 1)',
  explanation: 'The functional updater receives the latest queued state value, so multiple updates compose correctly even when React batches them. Reading count from the current render can cause repeated updates to calculate from the same stale value.'
}
];
