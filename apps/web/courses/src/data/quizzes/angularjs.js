export default [
  {
    id: 'angularjs-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Digest Cycle',
    prompt: `A developer updates:

$scope.username = "John";

inside an ng-click handler.

The UI updates immediately.

Why?`,
    options: [
      'AngularJS automatically starts a digest cycle',
      'The browser refreshes the page',
      'The DOM polls the variable continuously',
      'JavaScript automatically refreshes HTML'
    ],
    correctAnswer: 'AngularJS automatically starts a digest cycle',
    explanation: 'Built-in AngularJS directives such as ng-click automatically trigger a digest cycle. During the digest cycle, AngularJS checks all watchers for changes and updates the DOM where necessary. This automatic synchronization is one of AngularJS\'s core features.'
  },

  {
    id: 'angularjs-2',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Digest Cycle',
    prompt: `A developer updates:

$scope.username = "John";

inside JavaScript's native setTimeout().

The value changes, but the UI never updates.

Why?`,
    options: [
      'The code executed outside AngularJS so no digest cycle occurred',
      'setTimeout cannot modify variables',
      'AngularJS does not support asynchronous code',
      'The browser cached the HTML'
    ],
    correctAnswer: 'The code executed outside AngularJS so no digest cycle occurred',
    explanation: 'Native JavaScript callbacks execute outside AngularJS. Since AngularJS is unaware of the change, no digest cycle runs automatically. Wrapping the update inside $scope.$apply() (or using Angular services like $timeout) informs AngularJS that the model has changed.'
  },

  {
    id: 'angularjs-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Two-way Binding',
    prompt: `An input field uses:

<input ng-model="email">

The user types into the textbox.

What happens automatically?`,
    options: [
      '$scope.email is updated immediately',
      'Only the HTML changes',
      'Only after pressing Enter does the model update',
      'A manual digest cycle is required'
    ],
    correctAnswer: '$scope.email is updated immediately',
    explanation: 'ng-model provides two-way data binding. Changes in the view immediately update the model, and model changes automatically update the view through AngularJS\'s digest cycle.'
  },

  {
    id: 'angularjs-4',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Directives',
    prompt: `A developer expects an element to be completely removed from the DOM when hidden.

Which directive should be used?`,
    options: [
      'ng-if',
      'ng-show',
      'ng-hide',
      'ng-class'
    ],
    correctAnswer: 'ng-if',
    explanation: 'ng-if actually creates and destroys DOM elements. ng-show and ng-hide only change CSS visibility using display:none, meaning the element remains in the DOM.'
  },

  {
    id: 'angularjs-5',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Performance',
    prompt: `A page displays 15,000 employees using:

<div ng-repeat="employee in employees">

The page becomes extremely slow.

What is the MOST likely reason?`,
    options: [
      'AngularJS creates thousands of watchers',
      'ng-repeat uses recursion',
      'HTML cannot render more than 1000 elements',
      'JavaScript arrays have a size limit'
    ],
    correctAnswer: 'AngularJS creates thousands of watchers',
    explanation: 'Every repeated item adds watchers that participate in each digest cycle. Large ng-repeat lists dramatically increase digest time, causing poor UI performance.'
  },

  {
    id: 'angularjs-6',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Dependency Injection',
    prompt: `A controller creates a service like this:

var service = new UserService();

How should this code be reviewed?`,
    options: [
      'Inject the service using AngularJS Dependency Injection',
      'Always create services using new',
      'Convert the service into a controller',
      'Create the service globally'
    ],
    correctAnswer: 'Inject the service using AngularJS Dependency Injection',
    explanation: 'AngularJS manages service creation through its Dependency Injection system. Injecting services improves testability, ensures singleton behavior, and keeps components loosely coupled.'
  },

  {
    id: 'angularjs-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Services',
    prompt: `Two different controllers inject the same UserService.

What happens?`,
    options: [
      'Both controllers share the same service instance',
      'Each controller receives a new service instance',
      'AngularJS throws an error',
      'The service is recreated every digest cycle'
    ],
    correctAnswer: 'Both controllers share the same service instance',
    explanation: 'Services in AngularJS are singletons. AngularJS creates one instance and shares it across the application, making services ideal for shared business logic and application state.'
  },

  {
    id: 'angularjs-8',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Factory vs Service',
    prompt: `Your application needs reusable business logic shared across multiple controllers.

Which AngularJS component is MOST appropriate?`,
    options: [
      'Service',
      'Controller',
      '$scope',
      'Directive'
    ],
    correctAnswer: 'Service',
    explanation: 'Services encapsulate reusable business logic and shared state. Controllers should coordinate the view, while services contain the application\'s reusable functionality.'
  },

  {
    id: 'angularjs-9',
    type: 'mcq',
    difficulty: 'expert',
    category: '$http',
    prompt: `An API request is made using AngularJS $http.

Why does the UI automatically update when the response arrives?`,
    options: [
      '$http automatically triggers a digest cycle',
      '$http refreshes the browser',
      '$http modifies the DOM directly',
      'The browser periodically checks API responses'
    ],
    correctAnswer: '$http automatically triggers a digest cycle',
    explanation: 'AngularJS services such as $http integrate with the framework. After the asynchronous operation completes, AngularJS automatically starts a digest cycle so the updated model is reflected in the UI.'
  },

  {
    id: 'angularjs-10',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Promises',
    prompt: `A page depends on three different API calls before rendering.

Which AngularJS utility is MOST appropriate for waiting until all requests finish?`,
    options: [
      '$q.all()',
      '$scope.$digest()',
      '$compile()',
      '$watch()'
    ],
    correctAnswer: '$q.all()',
    explanation: '$q.all() waits until multiple promises have completed before continuing execution. This is useful when a page depends on several independent API requests before it can be rendered.'
  },
  {
  id: 'angularjs-11',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Watchers',
  prompt: `A page contains over 8,000 AngularJS watchers.

Users report slow typing and laggy UI.

What is the MOST likely reason?`,
  options: [
    'Every digest cycle must evaluate thousands of watchers',
    'AngularJS recompiles the entire application',
    'The browser reloads the page repeatedly',
    'JavaScript garbage collection stops working'
  ],
  correctAnswer: 'Every digest cycle must evaluate thousands of watchers',
  explanation: 'During every digest cycle, AngularJS evaluates every watcher to detect model changes. As the number of watchers grows, digest cycles become slower, leading to noticeable UI lag.'
},

{
  id: 'angularjs-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'One-time Binding',
  prompt: `Why would a developer use:

{{::employee.name}}

instead of

{{employee.name}}?`,
  options: [
    'To remove the watcher once the value is initialized',
    'To update the value twice as fast',
    'To enable two-way binding',
    'To force manual digest cycles'
  ],
  correctAnswer: 'To remove the watcher once the value is initialized',
  explanation: 'One-time binding ({{:: }}) removes its watcher after the value is resolved. This reduces the number of active watchers and improves performance on screens with mostly static data.'
},

{
  id: 'angularjs-13',
  type: 'mcq',
  difficulty: 'expert',
  category: '$apply vs $digest',
  prompt: `Which statement correctly describes $scope.$apply()?`,
  options: [
    '$apply() executes code and starts a digest cycle for the application',
    '$apply() refreshes only the current scope',
    '$apply() creates new watchers',
    '$apply() only works inside controllers'
  ],
  correctAnswer: '$apply() executes code and starts a digest cycle for the application',
  explanation: '$apply() is typically used when code executes outside AngularJS (such as native browser callbacks). It evaluates an expression and then triggers a digest cycle so AngularJS updates the UI.'
},

{
  id: 'angularjs-14',
  type: 'mcq',
  difficulty: 'expert',
  category: '$digest',
  prompt: `When should $scope.$digest() be called directly?`,
  options: [
    'Rarely; AngularJS usually manages digest cycles automatically',
    'After every model change',
    'After every API request',
    'Inside every controller method'
  ],
  correctAnswer: 'Rarely; AngularJS usually manages digest cycles automatically',
  explanation: 'AngularJS automatically runs digest cycles through built-in services like ng-click and $http. Calling $digest() manually is uncommon and should only be done when you fully understand its implications.'
},

{
  id: 'angularjs-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `Why is "track by employee.id" recommended in large ng-repeat lists?`,
  options: [
    'It allows AngularJS to reuse existing DOM elements efficiently',
    'It sorts the list automatically',
    'It removes duplicate objects',
    'It prevents HTTP requests'
  ],
  correctAnswer: 'It allows AngularJS to reuse existing DOM elements efficiently',
  explanation: 'Without track by, AngularJS compares objects by identity and may recreate DOM elements unnecessarily. Using a unique identifier improves rendering performance and reduces DOM updates.'
},

{
  id: 'angularjs-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Memory Management',
  prompt: `A controller registers:

$scope.$on("userUpdated", callback);

The listener is never removed.

What is the MOST likely long-term issue?`,
  options: [
    'Memory leaks due to lingering event listeners',
    'Digest cycles stop working',
    'The application recompiles itself',
    'The browser disables JavaScript'
  ],
  correctAnswer: 'Memory leaks due to lingering event listeners',
  explanation: 'If listeners remain registered after scopes are destroyed, AngularJS may retain references to objects that should be garbage collected, gradually increasing memory usage.'
},

{
  id: 'angularjs-17',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Routing',
  prompt: `Why would an application listen for $routeChangeStart?`,
  options: [
    'To perform authentication or validation before navigation',
    'To rebuild every controller',
    'To restart the application',
    'To force another digest cycle'
  ],
  correctAnswer: 'To perform authentication or validation before navigation',
  explanation: '$routeChangeStart allows applications to intercept route changes. It is commonly used for authentication checks, unsaved changes warnings, or analytics before navigation completes.'
},

{
  id: 'angularjs-18',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Race Conditions',
  prompt: `A user clicks the Search button five times quickly.

Five API requests are sent.

Responses return in a different order.

What is the MOST likely problem?`,
  options: [
    'Older responses may overwrite newer search results',
    'AngularJS automatically cancels earlier requests',
    'The browser merges all responses',
    'The digest cycle stops'
  ],
  correctAnswer: 'Older responses may overwrite newer search results',
  explanation: 'Asynchronous requests can complete out of order. Without request cancellation or response validation, stale responses may replace newer results, confusing users.'
},

{
  id: 'angularjs-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Digest Cycle',
  prompt: `AngularJS throws:

"$digest() iterations reached"

What is the MOST likely cause?`,
  options: [
    'A watcher continuously changes another watched value, creating an infinite digest loop',
    'The browser cache is full',
    'The application has too many routes',
    'A service was injected twice'
  ],
  correctAnswer: 'A watcher continuously changes another watched value, creating an infinite digest loop',
  explanation: 'AngularJS limits digest iterations (typically 10) to prevent infinite loops. This usually happens when a watcher modifies another watched value during the digest process.'
},

{
  id: 'angularjs-20',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Investigation',
  prompt: `A production AngularJS application shows these symptoms:

• Typing into forms feels slow
• CPU usage reaches 95%
• Memory usage remains stable
• More than 12,000 watchers are active
• No unusual network activity

What is the MOST likely root cause?`,
  options: [
    'Excessive watcher evaluation during every digest cycle',
    'Memory leak caused by $http',
    'Database latency',
    'AngularJS routing failure'
  ],
  correctAnswer: 'Excessive watcher evaluation during every digest cycle',
  explanation: 'Stable memory and normal network activity eliminate many common bottlenecks. A very large number of watchers forces AngularJS to perform expensive digest cycles repeatedly, leading to high CPU usage and sluggish UI performance.'
},
{
  id: 'angularjs-21',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Templates',
  prompt: 'Which AngularJS directive binds an input value to a scope model with two-way synchronization?',
  options: ['ng-model', 'ng-bind', 'ng-repeat', 'ng-include'],
  correctAnswer: 'ng-model',
  explanation: 'ng-model synchronizes a form control with an expression on the scope. User edits update the model, and model changes update the control.'
},
{
  id: 'angularjs-22',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Dependency Injection',
  prompt: 'Why is array annotation used when minifying an AngularJS controller?',
  options: ['It preserves dependency names for AngularJS after parameter names are shortened', 'It forces the controller to run asynchronously', 'It creates a new injector for every request', 'It prevents services from being singletons'],
  correctAnswer: 'It preserves dependency names for AngularJS after parameter names are shortened',
  explanation: 'Minifiers can rename function parameters, which would hide dependency names from AngularJS implicit annotation. Array notation stores the dependency names as strings, so injection continues to work after minification.'
}
];
