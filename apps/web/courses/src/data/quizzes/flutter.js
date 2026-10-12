export default [
  {
    id: 'flutter-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Widget Lifecycle',
    prompt: `A developer places an API call inside the build() method of a StatefulWidget.

Users report that the API is being called repeatedly while interacting with the screen.

What is the MOST likely reason?`,
    options: [
      'build() can be called many times during a widget\'s lifecycle',
      'Flutter automatically retries failed API calls',
      'setState() only works inside build()',
      'The widget should be StatelessWidget'
    ],
    correctAnswer: 'build() can be called many times during a widget\'s lifecycle',
    explanation: 'The build() method should remain free of side effects because Flutter may call it frequently. Expensive operations like API requests should typically be performed in initState(), FutureBuilder, or a state management solution.'
  },

  {
    id: 'flutter-2',
    type: 'code-output',
    difficulty: 'expert',
    category: 'State Management',
    prompt: `A StatefulWidget contains:

int counter = 0;

void increment() {
  counter++;
}

The UI never updates after calling increment().

Why?`,
    options: [
      'counter must be final',
      'setState() was not called after changing the value',
      'Flutter does not support mutable variables',
      'StatefulWidget requires StreamBuilder'
    ],
    correctAnswer: 'setState() was not called after changing the value',
    explanation: 'Changing a variable alone does not trigger a rebuild. Wrapping the state change inside setState() tells Flutter that the widget needs to rebuild with the updated value.'
  },

  {
    id: 'flutter-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Performance',
    prompt: `A screen contains a large list of 10,000 products.

Which widget is the BEST choice for displaying this list efficiently?`,
    options: [
      'Column',
      'SingleChildScrollView',
      'ListView.builder',
      'GridView.count'
    ],
    correctAnswer: 'ListView.builder',
    explanation: 'ListView.builder lazily builds only the visible widgets, making it suitable for large datasets. Column or SingleChildScrollView would attempt to build every child immediately, leading to poor performance.'
  },

  {
    id: 'flutter-4',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Navigation',
    prompt: `A user logs out of your application.

You do NOT want them to return to the dashboard by pressing the Back button.

Which navigation approach is most appropriate?`,
    options: [
      'Navigator.push()',
      'Navigator.pop()',
      'Navigator.pushReplacement()',
      'Navigator.pushAndRemoveUntil()'
    ],
    correctAnswer: 'Navigator.pushAndRemoveUntil()',
    explanation: 'Navigator.pushAndRemoveUntil() removes previous routes from the navigation stack, preventing users from returning to authenticated screens after logout.'
  },

  {
    id: 'flutter-5',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Widget Lifecycle',
    prompt: `A developer writes:

@override
void initState() {
  super.initState();
  fetchUsers();
}

Another developer moves fetchUsers() into build() because "build runs first anyway."

Whose approach follows Flutter best practices?`,
    options: [
      'First developer',
      'Second developer',
      'Both are equally correct',
      'Neither'
    ],
    correctAnswer: 'First developer',
    explanation: 'Initialization logic such as API calls belongs in initState() because it runs once when the State object is created. The build() method may execute many times and should focus on describing the UI.'
  },

  {
    id: 'flutter-6',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Keys',
    prompt: `A dynamic list allows users to reorder items.

After reordering, some widgets display incorrect state.

What is the MOST likely missing piece?`,
    options: [
      'MediaQuery',
      'Unique or Value Keys',
      'Expanded',
      'FutureBuilder'
    ],
    correctAnswer: 'Unique or Value Keys',
    explanation: 'Keys help Flutter correctly identify widgets between rebuilds. Without appropriate keys, Flutter may reuse widget state incorrectly when list items move.'
  },

  {
    id: 'flutter-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'BLoC Architecture',
    prompt: `Your application uses the BLoC pattern.

A widget directly modifies the internal state of the BLoC instead of dispatching an event.

Why is this considered poor practice?`,
    options: [
      'It bypasses the event → state flow, making state changes harder to track and test',
      'Flutter does not allow widgets to access a BLoC',
      'Events are slower than direct modification',
      'The application will not compile'
    ],
    correctAnswer: 'It bypasses the event → state flow, making state changes harder to track and test',
    explanation: 'In the BLoC pattern, widgets should dispatch events, and the BLoC should emit new states. This predictable unidirectional data flow improves maintainability, debugging, and testing.'
  },
  {
  id: 'flutter-8',
  type: 'mcq',
  difficulty: 'expert',
  category: 'BLoC Architecture',
  prompt: `A developer writes:

BlocProvider.of<UserBloc>(context).emit(UserLoaded(users));

inside a widget.

Why should this code be reviewed?`,
  options: [
    'Widgets should dispatch events instead of emitting states directly',
    'emit() is only allowed inside StatelessWidget',
    'Widgets cannot access BLoCs',
    'emit() only works with Cubit'
  ],
  correctAnswer: 'Widgets should dispatch events instead of emitting states directly',
  explanation: 'In the BLoC pattern, widgets represent the presentation layer. They should dispatch events such as LoadUsersEvent. The BLoC processes those events and emits new states. Directly emitting states from the UI breaks the unidirectional data flow and makes testing and maintenance much harder.'
},

{
  id: 'flutter-9',
  type: 'mcq',
  difficulty: 'expert',
  category: 'BLoC',
  prompt: `Which widget should rebuild automatically whenever a BLoC emits a new state?`,
  options: [
    'BlocBuilder',
    'FutureBuilder',
    'Builder',
    'LayoutBuilder'
  ],
  correctAnswer: 'BlocBuilder',
  explanation: 'BlocBuilder listens for state changes from a BLoC and rebuilds the UI whenever a new state is emitted. It is the primary widget for reactive UI updates when using flutter_bloc.'
},

{
  id: 'flutter-10',
  type: 'mcq',
  difficulty: 'hard',
  category: 'Async Programming',
  prompt: `A developer calls:

await fetchUsers();

inside initState().

The application does not compile.

Why?`,
  options: [
    'initState() cannot be marked async',
    'Future cannot be used in Flutter',
    'await only works inside build()',
    'initState() only supports Streams'
  ],
  correctAnswer: 'initState() cannot be marked async',
  explanation: 'initState() must remain synchronous. If asynchronous work is needed, call another async method from initState() without making initState() itself async.'
},

{
  id: 'flutter-11',
  type: 'mcq',
  difficulty: 'expert',
  category: 'FutureBuilder',
  prompt: `A screen loads data from an API exactly once and displays a loading indicator until the response arrives.

Which widget is MOST appropriate?`,
  options: [
    'FutureBuilder',
    'BlocBuilder',
    'AnimatedBuilder',
    'Expanded'
  ],
  correctAnswer: 'FutureBuilder',
  explanation: 'FutureBuilder is designed for a single asynchronous operation. It automatically rebuilds when the Future completes, making loading, success, and error states easy to manage.'
},

{
  id: 'flutter-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Streams',
  prompt: `A stock market application receives price updates every second.

Which approach is MOST appropriate?`,
  options: [
    'StreamBuilder',
    'FutureBuilder',
    'setState() every minute',
    'Navigator.push()'
  ],
  correctAnswer: 'StreamBuilder',
  explanation: 'FutureBuilder handles one-time asynchronous operations, whereas StreamBuilder listens continuously to streams of data such as stock prices, chat messages, or sensor updates.'
},

{
  id: 'flutter-13',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A developer places a ListView.builder inside another scrollable widget without constraints.

Users report rendering errors.

What is the MOST likely issue?`,
  options: [
    'The inner ListView has an unbounded height',
    'ListView.builder does not support scrolling',
    'Flutter allows only one ListView per screen',
    'The Builder widget is missing'
  ],
  correctAnswer: 'The inner ListView has an unbounded height',
  explanation: 'Nested scrollable widgets often produce "Vertical viewport was given unbounded height." The inner ListView should be constrained using Expanded, SizedBox, or shrinkWrap when appropriate.'
},

{
  id: 'flutter-14',
  type: 'mcq',
  difficulty: 'expert',
  category: 'const Widgets',
  prompt: `Why should developers use const constructors whenever possible?`,
  options: [
    'Flutter can reuse immutable widget instances, reducing unnecessary rebuild work',
    'const widgets use less internet bandwidth',
    'const widgets execute asynchronously',
    'const widgets never rebuild'
  ],
  correctAnswer: 'Flutter can reuse immutable widget instances, reducing unnecessary rebuild work',
  explanation: 'Const widgets are created at compile time when possible. Flutter can reuse them across rebuilds, improving rendering performance and reducing unnecessary object creation.'
},

{
  id: 'flutter-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'State Management',
  prompt: `A developer calls setState() after the widget has already been disposed.

What is the MOST likely result?`,
  options: [
    'A runtime exception occurs',
    'Flutter ignores the call silently',
    'The widget rebuilds successfully',
    'The application automatically recreates the widget'
  ],
  correctAnswer: 'A runtime exception occurs',
  explanation: 'Calling setState() after dispose() results in a runtime error because the widget no longer exists in the widget tree. This commonly happens when asynchronous operations complete after navigation.'
},

{
  id: 'flutter-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Widget Tree',
  prompt: `A small value changes frequently, but the entire screen rebuilds every time.

What is the BEST optimization?`,
  options: [
    'Move the changing widget into a smaller subtree',
    'Replace StatefulWidget with StatelessWidget',
    'Restart the application after every update',
    'Use Navigator.pushReplacement()'
  ],
  correctAnswer: 'Move the changing widget into a smaller subtree',
  explanation: 'Flutter rebuilds from the widget where setState() is called downward. By isolating frequently changing widgets into smaller subtrees, unnecessary rebuilds of unrelated UI can be avoided.'
},

{
  id: 'flutter-17',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Debugging',
  prompt: `A production Flutter application shows these symptoms:

• Scrolling feels slow
• Frame rate drops
• CPU usage increases while opening a product list
• Every item contains multiple high-resolution images

What is the MOST likely root cause?`,
  options: [
    'Large image rendering and excessive widget rebuilding',
    'Navigator is too slow',
    'FutureBuilder causes memory leaks',
    'Flutter does not support long lists'
  ],
  correctAnswer: 'Large image rendering and excessive widget rebuilding',
  explanation: 'Large images increase decoding time and memory usage, while unnecessary widget rebuilds increase CPU work. Together they commonly cause dropped frames and poor scrolling performance in Flutter applications.'
},
{
  id: 'flutter-18',
  type: 'mcq',
  difficulty: 'expert',
  category: 'BLoC',
  prompt: `A widget should perform navigation when LoginSuccess is emitted, but it should NOT rebuild the UI.

Which flutter_bloc widget is MOST appropriate?`,
  options: [
    'BlocListener',
    'BlocBuilder',
    'FutureBuilder',
    'ValueListenableBuilder'
  ],
  correctAnswer: 'BlocListener',
  explanation: 'BlocListener is designed for one-time side effects such as navigation, dialogs, SnackBars, and logging. BlocBuilder should only be used for rebuilding the UI in response to state changes.'
},

{
  id: 'flutter-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'BLoC',
  prompt: `A screen needs to both rebuild its UI AND show a SnackBar whenever an error state occurs.

Which widget provides the cleanest solution?`,
  options: [
    'BlocConsumer',
    'BlocBuilder',
    'BlocListener',
    'FutureBuilder'
  ],
  correctAnswer: 'BlocConsumer',
  explanation: 'BlocConsumer combines BlocBuilder and BlocListener into a single widget, allowing UI rebuilding and side effects to be handled together while keeping the code organized.'
},

{
  id: 'flutter-20',
  type: 'mcq',
  difficulty: 'expert',
  category: 'BuildContext',
  prompt: `A developer stores a BuildContext in a class field and uses it several minutes later.

Why is this considered dangerous?`,
  options: [
    'The widget associated with that BuildContext may no longer exist',
    'BuildContext can only be used inside StatelessWidget',
    'BuildContext is immutable',
    'Flutter automatically recreates every BuildContext'
  ],
  correctAnswer: 'The widget associated with that BuildContext may no longer exist',
  explanation: 'BuildContext represents a widget\'s location in the widget tree. If the widget is removed, the stored context becomes invalid. This can lead to runtime exceptions when attempting navigation or showing dialogs.'
},

{
  id: 'flutter-21',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Async Programming',
  prompt: `An API request completes after the user has already left the screen.

Before calling setState(), what should be checked?`,
  options: [
    'mounted',
    'isClosed',
    'hasData',
    'isCompleted'
  ],
  correctAnswer: 'mounted',
  explanation: 'The mounted property indicates whether the State object is still part of the widget tree. Checking mounted before calling setState() prevents runtime exceptions after asynchronous operations.'
},

{
  id: 'flutter-22',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A complex animated chart repaints continuously, causing the entire screen to repaint.

Which widget helps isolate those repaints?`,
  options: [
    'RepaintBoundary',
    'Expanded',
    'Hero',
    'Container'
  ],
  correctAnswer: 'RepaintBoundary',
  explanation: 'RepaintBoundary creates a separate rendering layer, allowing Flutter to repaint only that section instead of the entire screen. This significantly improves rendering performance for complex animations.'
},

{
  id: 'flutter-23',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Concurrency',
  prompt: `A Flutter application performs heavy JSON parsing on a 40 MB response.

Users report frozen animations during parsing.

What is the BEST solution?`,
  options: [
    'Move the parsing work to an Isolate using compute()',
    'Wrap the parsing in setState()',
    'Use FutureBuilder',
    'Increase device RAM'
  ],
  correctAnswer: 'Move the parsing work to an Isolate using compute()',
  explanation: 'Heavy CPU-intensive work blocks Flutter\'s main isolate, causing dropped frames and frozen animations. compute() executes expensive work on a background isolate, keeping the UI responsive.'
},

{
  id: 'flutter-24',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Architecture',
  prompt: `A widget directly calls REST APIs, performs JSON parsing, updates business logic, and renders UI.

Which software engineering principle is MOST violated?`,
  options: [
    'Separation of Concerns',
    'Inheritance',
    'Polymorphism',
    'Dependency Injection'
  ],
  correctAnswer: 'Separation of Concerns',
  explanation: 'Widgets should focus on presentation. Business logic belongs in BLoCs, repositories, or services. Separating responsibilities improves maintainability, testing, and scalability.'
},

{
  id: 'flutter-25',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Incident',
  prompt: `A production Flutter application has these symptoms:

• App startup takes 8 seconds
• Scrolling occasionally freezes
• Memory usage continuously increases
• Users navigate between many screens
• Large product images are displayed
• Heavy JSON parsing occurs after every API call

What is the MOST likely overall cause?`,
  options: [
    'A combination of expensive work on the main isolate, missing resource cleanup, and unoptimized image rendering',
    'Navigator.push() is too slow',
    'Flutter does not support large applications',
    'FutureBuilder automatically leaks memory'
  ],
  correctAnswer: 'A combination of expensive work on the main isolate, missing resource cleanup, and unoptimized image rendering',
  explanation: 'This incident combines several common production problems. Heavy parsing blocks the UI isolate, missing cleanup of controllers or subscriptions increases memory usage, and large images increase decoding and rendering costs. Production performance issues are often caused by multiple bottlenecks rather than a single bug.'
},
{
  id: 'flutter-26',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Widget Lifecycle',
  prompt: `Widget A rebuilds.

Its child widget is declared as:

const Text("Hello")

What happens during rebuild?`,
  options: [
    'A new Text widget is created',
    'Flutter reuses the existing const widget instance',
    'The Text widget disappears',
    'Compilation error'
  ],
  correctAnswer: 'Flutter reuses the existing const widget instance',
  explanation: 'const widgets are canonicalized. Flutter can reuse the existing immutable instance instead of creating a new object, reducing rebuild work.'
},
{
  id: 'flutter-27',
  type: 'mcq',
  difficulty: 'expert',
  category: 'BuildContext',
  prompt: `A developer writes:

showDialog(...);

Navigator.pop(context);

inside the dialog builder.

Unexpectedly, the entire page closes.

Why?`,
  options: [
    'The wrong BuildContext was used',
    'showDialog() cannot be closed',
    'Navigator.pop() always closes the page',
    'Dialogs require Bloc'
  ],
  correctAnswer: 'The wrong BuildContext was used',
  explanation: 'BuildContext determines which Navigator is used. Using a parent context instead of the dialog context may pop the underlying route instead of dismissing the dialog.'
},
{
  id: 'flutter-28',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Keys',
  prompt: `Two widgets swap positions.

Neither widget has a Key.

Both contain TextEditingControllers.

What is MOST likely to happen?`,
  options: [
    'Text entered by users appears in the wrong widget',
    'Compilation error',
    'Flutter automatically creates keys',
    'Nothing changes'
  ],
  correctAnswer: 'Text entered by users appears in the wrong widget',
  explanation: 'Without Keys, Flutter matches widgets by position rather than identity. Stateful widgets may therefore reuse the wrong State object after reordering.'
},
{
  id: 'flutter-29',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `Which change is MOST likely to reduce rebuilds?`,
  options: [
    'Move setState() closer to the changing widget',
    'Wrap the entire app in setState()',
    'Replace StatefulWidget with StatelessWidget',
    'Use FutureBuilder everywhere'
  ],
  correctAnswer: 'Move setState() closer to the changing widget',
  explanation: 'Flutter rebuilds downward from where setState() is called. Keeping mutable state localized reduces unnecessary rebuilds.'
},
{
  id: 'flutter-30',
  type: 'mcq',
  difficulty: 'expert',
  category: 'BLoC',
  prompt: `A Bloc emits exactly the same state object twice.

BlocBuilder does NOT rebuild.

Why?`,
  options: [
    'The emitted state is considered equal to the previous state',
    'BlocBuilder rebuilds only every second state',
    'Flutter ignores duplicate objects',
    'emit() can only be called once'
  ],
  correctAnswer: 'The emitted state is considered equal to the previous state',
  explanation: 'When using Equatable (or equivalent equality), identical states are treated as unchanged, preventing unnecessary UI rebuilds.'
},{
  id: 'flutter-31',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Async',
  prompt: `A Future completes after 5 seconds.

The user already navigated away.

What is the safest action before updating UI?`,
  options: [
    'Check mounted',
    'Call setState() immediately',
    'Restart the Future',
    'Use BlocBuilder'
  ],
  correctAnswer: 'Check mounted',
  explanation: 'Calling setState() on a disposed widget throws an exception. mounted confirms the State object still exists in the widget tree.'
},{
  id: 'flutter-32',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Rendering',
  prompt: `A screen contains one AnimatedContainer and 300 static widgets.

Only the animation changes.

Which Flutter behavior keeps rendering efficient?`,
  options: [
    'Only dirty render objects are repainted',
    'The entire application is repainted every frame',
    'Flutter rebuilds every widget',
    'Everything is recreated'
  ],
  correctAnswer: 'Only dirty render objects are repainted',
  explanation: 'Flutter\'s rendering pipeline marks only affected render objects as dirty. The framework avoids repainting unchanged portions of the render tree whenever possible.'
},{
  id: 'flutter-33',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Architecture',
  prompt: `A repository directly imports Flutter widgets.

Why is this considered poor architecture?`,
  options: [
    'Repositories should remain independent of the presentation layer',
    'Repositories cannot import Dart files',
    'Widgets execute before repositories',
    'Flutter does not allow repository classes'
  ],
  correctAnswer: 'Repositories should remain independent of the presentation layer',
  explanation: 'Repositories belong to the data layer. Depending on UI classes tightly couples business logic to presentation, making testing and reuse much more difficult.'
},{
  id: 'flutter-34',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Memory',
  prompt: `A page creates an AnimationController.

The controller is never disposed.

After opening and closing the page many times, memory usage slowly increases.

What is the MOST likely cause?`,
  options: [
    'The AnimationController remains allocated because dispose() was never called',
    'Flutter automatically caches every controller forever',
    'AnimationControllers live in the Stack',
    'Garbage Collection cannot run'
  ],
  correctAnswer: 'The AnimationController remains allocated because dispose() was never called',
  explanation: 'Objects that own native resources, listeners, or tickers should be disposed explicitly. Forgetting dispose() is a common cause of memory leaks in Flutter.'
},{
  id: 'flutter-35',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Investigation',
  prompt: `A production Flutter application reports:

• 60 FPS on the home screen
• 18 FPS on the product screen
• CPU usage: Normal
• Memory usage: Stable
• Network responses: Fast
• Flutter DevTools shows over 2,500 widget rebuilds while scrolling.

What is the MOST likely root cause?`,
  options: [
    'Excessive unnecessary widget rebuilding',
    'Memory leak',
    'Slow REST API',
    'Database locking'
  ],
  correctAnswer: 'Excessive unnecessary widget rebuilding',
  explanation: 'Normal CPU, stable memory, and fast network responses eliminate many common bottlenecks. Thousands of rebuilds during scrolling strongly indicate that widgets are rebuilding far more often than necessary. Splitting widgets into smaller subtrees, using const constructors, and optimizing state management are typical solutions.'
},
{
  id: 'flutter-36',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Widgets',
  prompt: 'Which widget arranges its children vertically?',
  options: ['Column', 'Row', 'Stack', 'Wrap'],
  correctAnswer: 'Column',
  explanation: 'Column lays out children along the vertical axis. Row uses the horizontal axis, while Stack overlays children.'
},
{
  id: 'flutter-37',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Build Lifecycle',
  prompt: 'A parent passes a new value to a child widget. Which mechanism normally tells Flutter that the child configuration has changed?',
  options: ['The framework calls the child State object’s didUpdateWidget method', 'The child must call setState from its constructor', 'Flutter recreates the entire application process', 'The child must manually request a new BuildContext'],
  correctAnswer: 'The framework calls the child State object’s didUpdateWidget method',
  explanation: 'When a new widget configuration has the same runtime type and key, Flutter can retain the State object and call didUpdateWidget with the new widget. This is where stateful children can respond to changed parent-provided values.'
}
];
