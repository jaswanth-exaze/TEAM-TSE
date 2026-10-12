export default [
  {
    id: 'c-sharp-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Value vs Reference Types',
    prompt: `Two variables reference the same List<int> object.

One variable adds a new item to the list.

What happens when the other variable accesses the list?`,
    options: [
      'It sees the new item because both variables reference the same object',
      'It still sees the original list',
      'A copy of the list is automatically created',
      'A runtime exception occurs'
    ],
    correctAnswer: 'It sees the new item because both variables reference the same object',
    explanation: 'List<T> is a reference type. Assigning it to another variable copies the reference, not the object itself. Both variables therefore point to the same list in memory.'
  },

  {
    id: 'c-sharp-2',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Parameters',
    prompt: `A method needs to modify a caller's variable and guarantee that a value is assigned before returning.

Which parameter modifier is MOST appropriate?`,
    options: [
      'out',
      'ref',
      'in',
      'params'
    ],
    correctAnswer: 'out',
    explanation: 'The out modifier requires the called method to assign a value before returning. Unlike ref, the caller does not need to initialize the variable beforehand.'
  },

  {
    id: 'c-sharp-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Properties',
    prompt: `Why are properties generally preferred over public fields?`,
    options: [
      'Properties provide encapsulation and validation',
      'Properties use less memory',
      'Fields cannot store values',
      'Properties are always faster'
    ],
    correctAnswer: 'Properties provide encapsulation and validation',
    explanation: 'Properties allow validation, computed values, logging, and future implementation changes while keeping the public API unchanged.'
  },

  {
    id: 'c-sharp-4',
    type: 'mcq',
    difficulty: 'expert',
    category: 'var vs dynamic',
    prompt: `What is the key difference between var and dynamic?`,
    options: [
      'var is resolved at compile time; dynamic is resolved at runtime',
      'They are identical',
      'dynamic improves compile-time safety',
      'var creates dynamic objects'
    ],
    correctAnswer: 'var is resolved at compile time; dynamic is resolved at runtime',
    explanation: 'var performs compile-time type inference while remaining strongly typed. dynamic bypasses compile-time type checking and defers member resolution until runtime.'
  },

  {
    id: 'c-sharp-5',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Strings',
    prompt: `A loop concatenates thousands of strings using +.

What is the BEST optimization?`,
    options: [
      'Use StringBuilder',
      'Use dynamic',
      'Convert everything to char[]',
      'Use string.Format repeatedly'
    ],
    correctAnswer: 'Use StringBuilder',
    explanation: 'Strings are immutable in C#. Every concatenation creates a new string. StringBuilder avoids repeated allocations by modifying an internal buffer.'
  },

  {
    id: 'c-sharp-6',
    type: 'mcq',
    difficulty: 'expert',
    category: 'OOP',
    prompt: `When should an abstract class be preferred over an interface?`,
    options: [
      'When shared implementation and state should be inherited',
      'When multiple inheritance is required',
      'When no implementation is needed',
      'Interfaces should always be preferred'
    ],
    correctAnswer: 'When shared implementation and state should be inherited',
    explanation: 'Abstract classes can provide common implementation, fields, and constructors. Interfaces define contracts and support multiple implementations.'
  },

  {
    id: 'c-sharp-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Polymorphism',
    prompt: `A derived class needs to replace the implementation of a virtual method.

Which keyword is required?`,
    options: [
      'override',
      'new',
      'sealed',
      'partial'
    ],
    correctAnswer: 'override',
    explanation: 'override replaces the inherited virtual implementation while preserving runtime polymorphism.'
  },

  {
    id: 'c-sharp-8',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Collections',
    prompt: `An application frequently searches employees by EmployeeId.

Which collection is MOST appropriate?`,
    options: [
      'Dictionary<int, Employee>',
      'List<Employee>',
      'Queue<Employee>',
      'Stack<Employee>'
    ],
    correctAnswer: 'Dictionary<int, Employee>',
    explanation: 'Dictionary provides average O(1) key-based lookups, making it ideal for frequent searches by unique identifiers.'
  },

  {
    id: 'c-sharp-9',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Collections',
    prompt: `You need to store unique values while preventing duplicates.

Which collection should you choose?`,
    options: [
      'HashSet<T>',
      'List<T>',
      'Dictionary<TKey, TValue>',
      'Array'
    ],
    correctAnswer: 'HashSet<T>',
    explanation: 'HashSet automatically ignores duplicate values and provides efficient membership checks.'
  },

  {
    id: 'c-sharp-10',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Collections',
    prompt: `A method should accept any sequence that can be enumerated without requiring modification.

Which interface is MOST appropriate?`,
    options: [
      'IEnumerable<T>',
      'IList<T>',
      'ICollection<T>',
      'Dictionary<TKey, TValue>'
    ],
    correctAnswer: 'IEnumerable<T>',
    explanation: 'IEnumerable represents a read-only sequence that can be iterated. Accepting the least restrictive interface increases flexibility.'
  },

  {
    id: 'c-sharp-11',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Async Programming',
    prompt: `Why is async/await preferred over calling Task.Wait() or Result?`,
    options: [
      'It avoids blocking the calling thread',
      'It always creates a new thread',
      'It executes synchronously',
      'It eliminates exceptions'
    ],
    correctAnswer: 'It avoids blocking the calling thread',
    explanation: 'await allows the thread to perform other work while waiting for the asynchronous operation to complete. Blocking methods such as Wait() and Result can reduce scalability and even lead to deadlocks.'
  },

  {
    id: 'c-sharp-12',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Tasks',
    prompt: `Five independent HTTP requests must complete before generating a report.

Which approach is MOST efficient?`,
    options: [
      'Task.WhenAll()',
      'Await each request sequentially',
      'Thread.Sleep()',
      'Task.Wait() after every request'
    ],
    correctAnswer: 'Task.WhenAll()',
    explanation: 'Task.WhenAll executes multiple asynchronous operations concurrently and completes when all have finished, reducing overall execution time.'
  },

  {
    id: 'c-sharp-13',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Cancellation',
    prompt: `A user cancels a file upload halfway through.

Which .NET feature is designed to support cooperative cancellation?`,
    options: [
      'CancellationToken',
      'Thread.Abort()',
      'Environment.Exit()',
      'GC.Collect()'
    ],
    correctAnswer: 'CancellationToken',
    explanation: 'CancellationToken allows asynchronous operations to observe cancellation requests and stop gracefully. It is the recommended pattern for cooperative cancellation in modern .NET applications.'
  },
  {
  id: 'c-sharp-14',
  type: 'mcq',
  difficulty: 'expert',
  category: 'ConfigureAwait',
  prompt: `A library method uses:

await httpClient.GetAsync(url);

Which is generally recommended inside reusable libraries?`,
  options: [
    'await ...ConfigureAwait(false)',
    'Task.Wait()',
    'Thread.Sleep()',
    'GC.Collect()'
  ],
  correctAnswer: 'await ...ConfigureAwait(false)',
  explanation: 'Library code generally should not capture the caller\'s synchronization context. ConfigureAwait(false) avoids unnecessary context switches and reduces the risk of deadlocks in UI applications.'
},

{
  id: 'c-sharp-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'LINQ',
  prompt: `A LINQ query is assigned to a variable but never executed.

When does it actually run?`,
  options: [
    'When it is enumerated (foreach, ToList(), etc.)',
    'Immediately after assignment',
    'At compile time',
    'Only when GC runs'
  ],
  correctAnswer: 'When it is enumerated (foreach, ToList(), etc.)',
  explanation: 'Most LINQ queries use deferred execution. The query is not executed until the results are enumerated.'
},

{
  id: 'c-sharp-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'LINQ',
  prompt: `A developer writes:

var result = employees.Where(e => e.Active);

Later, more employees are added before foreach executes.

What happens?`,
  options: [
    'The newly added matching employees are included',
    'Only the original employees are returned',
    'The query throws an exception',
    'LINQ creates a snapshot automatically'
  ],
  correctAnswer: 'The newly added matching employees are included',
  explanation: 'Because LINQ uses deferred execution, it evaluates the collection when enumeration begins. Changes made before enumeration are reflected in the results.'
},

{
  id: 'c-sharp-17',
  type: 'mcq',
  difficulty: 'expert',
  category: 'LINQ',
  prompt: `Which method forces immediate execution of a LINQ query?`,
  options: [
    'ToList()',
    'Where()',
    'Select()',
    'OrderBy()'
  ],
  correctAnswer: 'ToList()',
  explanation: 'Methods like ToList(), ToArray(), Count(), and First() execute the query immediately instead of waiting for enumeration.'
},

{
  id: 'c-sharp-18',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Resource Management',
  prompt: `A SqlConnection is opened but never disposed.

What is the MOST likely long-term issue?`,
  options: [
    'Connection pool exhaustion',
    'Compilation error',
    'Stack overflow',
    'Dictionary corruption'
  ],
  correctAnswer: 'Connection pool exhaustion',
  explanation: 'Failing to dispose database connections eventually exhausts the connection pool, causing new database requests to wait or fail.'
},

{
  id: 'c-sharp-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'using Statement',
  prompt: `What is the PRIMARY purpose of the using statement?`,
  options: [
    'Automatically dispose IDisposable resources',
    'Import namespaces',
    'Increase application speed',
    'Allocate heap memory'
  ],
  correctAnswer: 'Automatically dispose IDisposable resources',
  explanation: 'The using statement guarantees Dispose() is called even if an exception occurs, making it the preferred way to manage files, database connections, streams, and similar resources.'
},

{
  id: 'c-sharp-20',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Dependency Injection',
  prompt: `A service stores user-specific request data.

Which ASP.NET Core lifetime is MOST appropriate?`,
  options: [
    'Scoped',
    'Singleton',
    'Transient',
    'Static'
  ],
  correctAnswer: 'Scoped',
  explanation: 'Scoped services are created once per HTTP request, making them ideal for request-specific state such as authenticated user information.'
},

{
  id: 'c-sharp-21',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Dependency Injection',
  prompt: `A Singleton service depends directly on a Scoped service.

What is the biggest concern?`,
  options: [
    'The Singleton may hold invalid request-specific state',
    'Compilation fails immediately',
    'The Scoped service becomes Singleton automatically',
    'Performance always improves'
  ],
  correctAnswer: 'The Singleton may hold invalid request-specific state',
  explanation: 'A Singleton lives for the application\'s lifetime, while a Scoped service exists only for one request. Injecting Scoped services into Singletons can cause lifetime and state issues.'
},

{
  id: 'c-sharp-22',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Deadlocks',
  prompt: `A desktop application calls:

task.Result

on the UI thread.

Sometimes the application freezes.

Why?`,
  options: [
    'Blocking on async work can cause a deadlock',
    'Result always throws an exception',
    'The Task runs twice',
    'Garbage Collection pauses the UI'
  ],
  correctAnswer: 'Blocking on async work can cause a deadlock',
  explanation: 'Calling Result or Wait() on asynchronous operations can block the synchronization context, preventing the awaited continuation from executing and causing a deadlock.'
},

{
  id: 'c-sharp-23',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `Which operation is generally more expensive?`,
  options: [
    'Repeated string concatenation using + inside a large loop',
    'Reading an integer variable',
    'Comparing two bool values',
    'Returning from a method'
  ],
  correctAnswer: 'Repeated string concatenation using + inside a large loop',
  explanation: 'Because strings are immutable, repeated concatenation creates many temporary objects. StringBuilder is usually the preferred solution.'
},

{
  id: 'c-sharp-24',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Memory',
  prompt: `A static List<Order> continuously stores every processed order.

The application runs for weeks.

Memory usage keeps increasing.

What is the MOST likely cause?`,
  options: [
    'Objects remain referenced by the static collection',
    'Garbage Collection is disabled',
    'The CLR cannot free memory',
    'Stack overflow'
  ],
  correctAnswer: 'Objects remain referenced by the static collection',
  explanation: 'Static collections live for the application\'s lifetime. As long as objects remain referenced, the garbage collector cannot reclaim their memory.'
},

{
  id: 'c-sharp-25',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Investigation',
  prompt: `A production ASP.NET Core API shows:

• CPU usage: 18%
• Memory usage: Stable
• Database: Healthy
• Requests remain pending for a long time
• Thread dump shows many threads blocked on .Result

What is the MOST likely root cause?`,
  options: [
    'Blocking asynchronous code using .Result or Wait()',
    'Garbage Collection is running too often',
    'Database indexing problem',
    'Memory leak'
  ],
  correctAnswer: 'Blocking asynchronous code using .Result or Wait()',
  explanation: 'Healthy CPU, stable memory, and a healthy database eliminate many common bottlenecks. Large numbers of blocked threads waiting on .Result or Wait() strongly indicate sync-over-async, which reduces scalability and can lead to deadlocks.'
},
{
  id: 'c-sharp-26',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Types',
  prompt: 'Which C# type represents a true-or-false value?',
  options: ['bool', 'int', 'char', 'decimal'],
  correctAnswer: 'bool',
  explanation: 'bool has the two values true and false and is used for conditions and logical results. C# does not implicitly treat numeric values such as 0 and 1 as booleans.'
},
{
  id: 'c-sharp-27',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Async Programming',
  prompt: 'What does the await keyword do when used with an incomplete Task?',
  options: ['Suspends the async method until the task completes without blocking the current thread', 'Creates a new operating-system thread for every task', 'Immediately cancels the task', 'Converts the task result into a synchronous value'],
  correctAnswer: 'Suspends the async method until the task completes without blocking the current thread',
  explanation: 'await arranges for the remainder of the async method to continue when the awaited operation completes. It does not inherently create a thread, and the caller can continue using its thread while the operation is pending.'
}
];
