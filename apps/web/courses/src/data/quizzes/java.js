export default [
  {
    id: 'java-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Polymorphism',
    prompt: `Animal animal = new Dog();
animal.sound();

Which implementation executes?`,
    options: [
      'Animal.sound()',
      'Dog.sound()',
      'Both methods execute',
      'Compilation error'
    ],
    correctAnswer: 'Dog.sound()',
    explanation: 'Java uses runtime polymorphism for overridden methods. Although the reference type is Animal, the actual object is Dog, so Dog.sound() executes. The reference type determines what methods are accessible, while the object type determines which overridden implementation runs.'
  },

  {
    id: 'java-2',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Method Overloading',
    prompt: `class Calculator {
    void add(int a, int b) {}
    void add(double a, double b) {}
}

What OOP concept is demonstrated?`,
    options: [
      'Method Overloading',
      'Method Overriding',
      'Polymorphism',
      'Inheritance'
    ],
    correctAnswer: 'Method Overloading',
    explanation: 'Method overloading occurs when multiple methods have the same name but different parameter lists within the same class. The compiler decides which version to call based on the arguments at compile time.'
  },

  {
    id: 'java-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Inheritance',
    prompt: `Which member cannot be overridden in Java?`,
    options: [
      'Constructor',
      'Public Method',
      'Protected Method',
      'Abstract Method'
    ],
    correctAnswer: 'Constructor',
    explanation: 'Constructors are not inherited, so they cannot be overridden. They execute only when creating an object. Abstract methods are specifically intended to be overridden.'
  },

  {
    id: 'java-4',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Encapsulation',
    prompt: `A developer makes every field public because "it is easier to access."

How should this code be reviewed?`,
    options: [
      'Good practice because it reduces code',
      'Poor practice because it breaks encapsulation',
      'Good practice for performance',
      'Required for inheritance'
    ],
    correctAnswer: 'Poor practice because it breaks encapsulation',
    explanation: 'Encapsulation protects an object\'s internal state by restricting direct access. Making fields public allows any code to modify object state, increasing coupling and making future maintenance much harder.'
  },

  {
    id: 'java-5',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Interfaces',
    prompt: `Why are interfaces generally preferred over concrete classes for service definitions?`,
    options: [
      'They promote loose coupling and multiple implementations',
      'They execute faster',
      'Interfaces consume less memory',
      'Interfaces automatically create objects'
    ],
    correctAnswer: 'They promote loose coupling and multiple implementations',
    explanation: 'Programming against interfaces rather than implementations allows components to be replaced easily, improves testing through mocking, and follows the Dependency Inversion Principle.'
  },

  {
    id: 'java-6',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Collections',
    prompt: `Your application performs millions of random index lookups.

Which collection is MOST appropriate?`,
    options: [
      'ArrayList',
      'LinkedList',
      'HashSet',
      'TreeSet'
    ],
    correctAnswer: 'ArrayList',
    explanation: 'ArrayList provides O(1) random access because elements are stored in a contiguous array. LinkedList requires traversing nodes, making random access O(n).'
  },

  {
    id: 'java-7',
    type: 'code-output',
    difficulty: 'expert',
    category: 'HashMap',
    prompt: `HashMap<String, Integer> map = new HashMap<>();

map.put("A", 10);
map.put("A", 50);

System.out.println(map.size());

What is printed?`,
    options: [
      '1',
      '2',
      '0',
      'Compilation error'
    ],
    correctAnswer: '1',
    explanation: 'HashMap stores unique keys. Adding the same key again replaces the existing value rather than creating a second entry. The final map contains one entry with key "A" and value 50.'
  },

  {
    id: 'java-8',
    type: 'mcq',
    difficulty: 'expert',
    category: 'HashSet',
    prompt: `A HashSet unexpectedly contains duplicate-looking objects.

What is the MOST likely cause?`,
    options: [
      'equals() and hashCode() are implemented incorrectly',
      'HashSet allows duplicates',
      'Objects are stored in insertion order',
      'HashSet uses a LinkedList internally'
    ],
    correctAnswer: 'equals() and hashCode() are implemented incorrectly',
    explanation: 'HashSet relies on both hashCode() and equals() to determine uniqueness. If these methods are inconsistent or not overridden correctly, logically identical objects may be stored multiple times.'
  },

  {
    id: 'java-9',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Maps',
    prompt: `A reporting application must keep customer IDs automatically sorted.

Which collection should be used?`,
    options: [
      'TreeMap',
      'HashMap',
      'Hashtable',
      'LinkedHashMap'
    ],
    correctAnswer: 'TreeMap',
    explanation: 'TreeMap stores keys in sorted order using a Red-Black Tree. HashMap provides faster average lookup but does not maintain ordering. LinkedHashMap preserves insertion order, not sorted order.'
  },

  {
    id: 'java-10',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Collections',
    prompt: `List<String> names = new ArrayList<>();

for (String name : names) {
    names.remove(name);
}

What is the MOST likely outcome?`,
    options: [
      'ConcurrentModificationException',
      'The loop removes every element successfully',
      'Compilation error',
      'NullPointerException'
    ],
    correctAnswer: 'ConcurrentModificationException',
    explanation: 'The enhanced for-loop uses an Iterator internally. Modifying the collection directly while iterating invalidates the iterator and usually results in ConcurrentModificationException. The correct approach is to use Iterator.remove() or removeIf().'
  },
  {
  id: 'java-11',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Exceptions',
  prompt: `A method reads a file from disk.

Which exception type should callers normally be required to handle?`,
  options: [
    'IOException',
    'NullPointerException',
    'ArithmeticException',
    'ArrayIndexOutOfBoundsException'
  ],
  correctAnswer: 'IOException',
  explanation: 'IOException is a checked exception because file operations depend on external resources that may fail. Java requires callers to either handle or declare checked exceptions. Runtime exceptions such as NullPointerException are unchecked because they usually indicate programming mistakes.'
},

{
  id: 'java-12',
  type: 'code-output',
  difficulty: 'expert',
  category: 'finally',
  prompt: `try {
    System.out.println("A");
    return;
} finally {
    System.out.println("B");
}

What is printed?`,
  options: [
    'A',
    'B',
    'A followed by B',
    'Nothing'
  ],
  correctAnswer: 'A followed by B',
  explanation: 'The finally block executes even when the try block returns. This guarantees cleanup code such as closing files or releasing database connections is executed before the method exits.'
},

{
  id: 'java-13',
  type: 'mcq',
  difficulty: 'expert',
  category: 'try-with-resources',
  prompt: `Why is try-with-resources preferred when working with files or database connections?`,
  options: [
    'Resources are automatically closed',
    'It improves JVM performance',
    'It eliminates checked exceptions',
    'It makes code execute faster'
  ],
  correctAnswer: 'Resources are automatically closed',
  explanation: 'Classes implementing AutoCloseable are automatically closed even if exceptions occur. This greatly reduces resource leaks and simplifies cleanup logic.'
},

{
  id: 'java-14',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Custom Exceptions',
  prompt: `A banking application throws:

throw new Exception("Insufficient balance");

How should this be reviewed?`,
  options: [
    'Accept because Exception handles everything',
    'Prefer a custom exception such as InsufficientBalanceException',
    'Replace it with NullPointerException',
    'Remove the exception completely'
  ],
  correctAnswer: 'Prefer a custom exception such as InsufficientBalanceException',
  explanation: 'Custom exceptions communicate business intent clearly and make error handling more precise. Generic Exception makes debugging and maintenance more difficult.'
},

{
  id: 'java-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Exception Propagation',
  prompt: `A checked exception is neither caught nor declared using throws.

What happens?`,
  options: [
    'Compilation error',
    'Runtime exception',
    'Program continues normally',
    'JVM catches it automatically'
  ],
  correctAnswer: 'Compilation error',
  explanation: 'Java requires checked exceptions to be handled or declared. Failing to do so results in a compilation error, enforcing explicit error handling.'
},

{
  id: 'java-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Synchronization',
  prompt: `Two threads update the same bank account balance simultaneously.

Sometimes the final balance is incorrect.

Which Java keyword is MOST appropriate?`,
  options: [
    'synchronized',
    'static',
    'final',
    'transient'
  ],
  correctAnswer: 'synchronized',
  explanation: 'The synchronized keyword ensures only one thread executes a critical section at a time, preventing race conditions when modifying shared mutable state.'
},

{
  id: 'java-17',
  type: 'mcq',
  difficulty: 'expert',
  category: 'volatile',
  prompt: `One thread sets:

shutdown = true;

Another thread never observes the updated value.

Which keyword is MOST appropriate?`,
  options: [
    'volatile',
    'synchronized',
    'final',
    'native'
  ],
  correctAnswer: 'volatile',
  explanation: 'volatile guarantees visibility of variable updates across threads. It does not provide atomicity, but it ensures each thread reads the latest value from main memory.'
},

{
  id: 'java-18',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Deadlock',
  prompt: `Thread A locks Resource1 then waits for Resource2.

Thread B locks Resource2 then waits for Resource1.

What is this situation called?`,
  options: [
    'Deadlock',
    'Race Condition',
    'Starvation',
    'Livelock'
  ],
  correctAnswer: 'Deadlock',
  explanation: 'A deadlock occurs when two or more threads permanently wait for resources held by one another. Neither thread can proceed without external intervention.'
},

{
  id: 'java-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'ExecutorService',
  prompt: `An application needs to execute hundreds of short background tasks efficiently.

Which approach is MOST appropriate?`,
  options: [
    'Create a new Thread for every task',
    'Use ExecutorService with a thread pool',
    'Run everything on the main thread',
    'Use synchronized everywhere'
  ],
  correctAnswer: 'Use ExecutorService with a thread pool',
  explanation: 'ExecutorService reuses worker threads, reducing thread creation overhead and improving scalability. Creating thousands of individual Thread objects is inefficient.'
},

{
  id: 'java-20',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Race Conditions',
  prompt: `A production bug appears only occasionally.

Investigation shows multiple threads updating the same shared object without synchronization.

What is the MOST likely cause?`,
  options: [
    'Race Condition',
    'Memory Leak',
    'Garbage Collection',
    'Stack Overflow'
  ],
  correctAnswer: 'Race Condition',
  explanation: 'Race conditions occur when multiple threads access shared mutable state concurrently without proper synchronization. The result depends on unpredictable thread scheduling, making these bugs difficult to reproduce and debug.'
},
{
  id: 'java-21',
  type: 'mcq',
  difficulty: 'expert',
  category: 'JVM Memory',
  prompt: `A method is called:

calculateSalary();

Inside the method:

int salary = 50000;

Where is the variable 'salary' stored?`,
  options: [
    'Stack Memory',
    'Heap Memory',
    'Method Area',
    'String Pool'
  ],
  correctAnswer: 'Stack Memory',
  explanation: 'Local variables and method calls are stored on the thread stack. Objects created with new are stored on the heap, while the stack only contains references to those objects.'
},

{
  id: 'java-22',
  type: 'code-output',
  difficulty: 'expert',
  category: 'String Pool',
  prompt: `String a = "Java";
String b = "Java";
String c = new String("Java");

Which comparison returns true?`,
  options: [
    'a == b only',
    'a == c only',
    'b == c only',
    'All comparisons'
  ],
  correctAnswer: 'a == b only',
  explanation: 'String literals are stored in the String Pool, so a and b reference the same object. new String() always creates a new object on the heap, making a == c false. (Using equals() would return true for all because it compares content.)'
},

{
  id: 'java-23',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Garbage Collection',
  prompt: `An object has no remaining references anywhere in the application.

What happens next?`,
  options: [
    'It becomes eligible for Garbage Collection',
    'It is immediately deleted',
    'It moves to the Stack',
    'It becomes immutable'
  ],
  correctAnswer: 'It becomes eligible for Garbage Collection',
  explanation: 'Once no live references point to an object, it becomes eligible for garbage collection. The JVM decides when (or if) to reclaim its memory—there is no guarantee of immediate deletion.'
},

{
  id: 'java-24',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Immutability',
  prompt: `Why is the String class immutable?`,
  options: [
    'Security, thread-safety, and String Pool optimization',
    'To reduce heap size',
    'To improve inheritance',
    'Because Java does not support mutable objects'
  ],
  correctAnswer: 'Security, thread-safety, and String Pool optimization',
  explanation: 'Immutability allows Strings to be safely shared through the String Pool, simplifies thread safety, and prevents accidental modification of sensitive values such as file paths, URLs, and class names.'
},

{
  id: 'java-25',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Memory Leaks',
  prompt: `A Java application's memory usage continuously increases.

Garbage Collection runs frequently, but memory never returns to normal.

What is the MOST likely cause?`,
  options: [
    'Objects are still referenced, preventing Garbage Collection',
    'The JVM never performs Garbage Collection',
    'Stack memory is full',
    'The String Pool is disabled'
  ],
  correctAnswer: 'Objects are still referenced, preventing Garbage Collection',
  explanation: 'Memory leaks in Java usually occur because objects remain reachable through collections, static variables, caches, or listeners. Since references still exist, the garbage collector cannot reclaim the memory.'
},

{
  id: 'java-26',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Stream API',
  prompt: `You need to:

• Filter active employees
• Sort them by salary
• Extract only their names

Which Java feature is MOST appropriate?`,
  options: [
    'Stream API',
    'Nested for loops',
    'StringBuilder',
    'ExecutorService'
  ],
  correctAnswer: 'Stream API',
  explanation: 'The Stream API allows declarative processing such as filter(), sorted(), and map() without modifying the original collection, producing cleaner and more maintainable code.'
},

{
  id: 'java-27',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Optional',
  prompt: `A method may or may not return a User object.

Which return type best communicates this possibility?`,
  options: [
    'Optional<User>',
    'Object',
    'User',
    'String'
  ],
  correctAnswer: 'Optional<User>',
  explanation: 'Optional explicitly represents the presence or absence of a value, encouraging developers to handle missing data safely instead of risking NullPointerException.'
},

{
  id: 'java-28',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Functional Interfaces',
  prompt: `Which interface is considered a functional interface?`,
  options: [
    'Predicate<T>',
    'ArrayList<T>',
    'HashMap<K,V>',
    'Thread'
  ],
  correctAnswer: 'Predicate<T>',
  explanation: 'A functional interface contains exactly one abstract method. Predicate, Function, Consumer, Supplier, and Runnable are common examples used with lambda expressions.'
},

{
  id: 'java-29',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Parallel Streams',
  prompt: `A developer replaces:

stream()

with

parallelStream()

expecting every operation to become faster.

Which statement is MOST accurate?`,
  options: [
    'Parallel streams are not always faster and should be benchmarked',
    'parallelStream() is always faster',
    'parallelStream() uses only one thread',
    'parallel streams eliminate synchronization issues'
  ],
  correctAnswer: 'Parallel streams are not always faster and should be benchmarked',
  explanation: 'Parallel streams introduce thread management and splitting overhead. They work well for CPU-intensive operations on large datasets but may actually reduce performance for small collections or I/O-bound workloads.'
},

{
  id: 'java-30',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Debugging',
  prompt: `A production Java application suddenly becomes slow.

Monitoring shows:

• CPU: 96%
• Heap usage: Stable
• Garbage Collection: Normal
• Database queries: Fast
• Hundreds of threads are BLOCKED waiting for locks

What is the MOST likely root cause?`,
  options: [
    'Excessive synchronization or lock contention',
    'Memory leak',
    'Database indexing problem',
    'Stack overflow'
  ],
  correctAnswer: 'Excessive synchronization or lock contention',
  explanation: 'Stable memory and normal garbage collection rule out memory pressure. Fast database queries eliminate the database as the bottleneck. A large number of BLOCKED threads strongly indicates lock contention caused by synchronized blocks, locks held too long, or even deadlocks. Thread dumps (jstack) are typically the next step in diagnosing this type of production issue.'
},
{
  id: 'java-31',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Collections',
  prompt: 'Which Java collection preserves insertion order and allows duplicate elements?',
  options: ['ArrayList', 'HashSet', 'TreeSet', 'HashMap'],
  correctAnswer: 'ArrayList',
  explanation: 'ArrayList is a resizable list that preserves element order and permits duplicates. Sets enforce uniqueness, while a map stores key-value entries rather than a sequence of duplicate values.'
},
{
  id: 'java-32',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Equality',
  prompt: 'A class overrides equals() but inherits Object.hashCode(). What can break when its objects are keys in a HashMap?',
  options: ['Equal objects may have different hash codes, so lookups can fail', 'The map will sort keys alphabetically', 'The map will automatically call compareTo()', 'All keys will be replaced by null'],
  correctAnswer: 'Equal objects may have different hash codes, so lookups can fail',
  explanation: 'The equals/hashCode contract requires equal objects to have equal hash codes. HashMap first uses the hash code to find a bucket, then uses equality within that bucket, so violating the contract can make logically equal keys behave as separate entries.'
}
];
