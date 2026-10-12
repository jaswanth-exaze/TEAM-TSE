export default [
  {
    id: 'react-native-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Architecture',
    prompt: `A React Native application frequently communicates with native modules thousands of times per second.

Which limitation of the legacy React Native architecture is MOST likely causing performance issues?`,
    options: [
      'Communication must pass through the asynchronous Bridge',
      'JavaScript cannot call native code',
      'React Native renders HTML internally',
      'Metro Bundler limits API calls'
    ],
    correctAnswer: 'Communication must pass through the asynchronous Bridge',
    explanation: 'In the legacy architecture, JavaScript and native code communicate through the Bridge by serializing messages. Frequent communication introduces overhead. The New Architecture (JSI, Fabric, TurboModules) significantly reduces this bottleneck.'
  },

  {
    id: 'react-native-2',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Performance',
    prompt: `A developer accidentally writes an expensive loop that runs for 8 seconds on the JavaScript thread.

What will users MOST likely experience?`,
    options: [
      'Animations and button presses become unresponsive',
      'The application automatically moves work to another thread',
      'Only API requests slow down',
      'Nothing noticeable'
    ],
    correctAnswer: 'Animations and button presses become unresponsive',
    explanation: 'Heavy JavaScript blocks the JS thread. Since user interactions and much of the application logic depend on it, the UI appears frozen until the work completes.'
  },

  {
    id: 'react-native-3',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Components',
    prompt: `React Native uses components like <View>, <Text>, and <Image>.

What are these actually rendered as?`,
    options: [
      'Native Android and iOS UI components',
      'HTML elements',
      'Canvas drawings',
      'Flutter widgets'
    ],
    correctAnswer: 'Native Android and iOS UI components',
    explanation: 'Unlike React for the web, React Native renders platform-native UI components instead of HTML elements.'
  },

  {
    id: 'react-native-4',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Platform',
    prompt: `Your design requires different button colors on Android and iOS.

Which React Native API is specifically designed for this purpose?`,
    options: [
      'Platform.select()',
      'Navigator.select()',
      'DeviceInfo.getPlatform()',
      'Appearance.select()'
    ],
    correctAnswer: 'Platform.select()',
    explanation: 'Platform.select() allows developers to provide platform-specific implementations while keeping the code clean and maintainable.'
  },

  {
    id: 'react-native-5',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Layout',
    prompt: `A web developer creates this:

<View>
   <Button />
   <Button />
</View>

Without specifying flexDirection, how will the buttons appear?`,
    options: [
      'Vertically',
      'Horizontally',
      'Overlapping',
      'Random order'
    ],
    correctAnswer: 'Vertically',
    explanation: 'React Native defaults to flexDirection: "column", unlike CSS on the web, where the default flex direction is row only after display:flex is applied.'
  },

  {
    id: 'react-native-6',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Navigation',
    prompt: `Users navigate:

Home
→ Products
→ Product Details

Each screen should support the Back button naturally.

Which navigator is MOST appropriate?`,
    options: [
      'Stack Navigator',
      'Bottom Tab Navigator',
      'Drawer Navigator',
      'Material Top Tabs'
    ],
    correctAnswer: 'Stack Navigator',
    explanation: 'Stack navigation models a stack of screens, making it ideal for drill-down navigation where users naturally move forward and backward.'
  },

  {
    id: 'react-native-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Navigation',
    prompt: `You need to open the Profile screen and provide the selected user's ID.

What is the BEST approach?`,
    options: [
      'Pass route parameters',
      'Store the ID in AsyncStorage',
      'Create a global variable',
      'Restart the application'
    ],
    correctAnswer: 'Pass route parameters',
    explanation: 'Route parameters are designed for passing small pieces of contextual information between screens, such as IDs or filter values.'
  },

  {
    id: 'react-native-8',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Lifecycle',
    prompt: `A screen should refresh its data every time the user returns to it from another screen.

Which hook is MOST appropriate when using React Navigation?`,
    options: [
      'useFocusEffect()',
      'useEffect()',
      'useMemo()',
      'useCallback()'
    ],
    correctAnswer: 'useFocusEffect()',
    explanation: 'useFocusEffect() runs whenever the screen gains focus, making it ideal for refreshing data after returning from another screen.'
  },

  {
    id: 'react-native-9',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Deep Linking',
    prompt: `A user clicks the link:

mycompany://orders/245

What feature of React Native does this demonstrate?`,
    options: [
      'Deep Linking',
      'Hot Reloading',
      'Code Splitting',
      'Metro Bundling'
    ],
    correctAnswer: 'Deep Linking',
    explanation: 'Deep linking allows external URLs or custom URI schemes to open specific screens inside a mobile application.'
  },

  {
    id: 'react-native-10',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Android',
    prompt: `On Android, pressing the physical Back button should display a confirmation dialog before exiting the application.

Which API should be used?`,
    options: [
      'BackHandler',
      'AlertManager',
      'Platform.Back',
      'Navigation.exit()'
    ],
    correctAnswer: 'BackHandler',
    explanation: 'BackHandler allows React Native applications to intercept the Android hardware Back button and implement custom behavior such as confirmation dialogs or custom navigation.'
  },
  {
  id: 'react-native-11',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Storage',
  prompt: `A developer stores the following in AsyncStorage:

• App theme
• JWT access token
• User profile picture (8 MB)
• Last selected language

Which item is LEAST appropriate to store in AsyncStorage?`,
  options: [
    'App theme',
    'JWT access token',
    'User profile picture (8 MB)',
    'Last selected language'
  ],
  correctAnswer: 'User profile picture (8 MB)',
  explanation: 'AsyncStorage is intended for small amounts of key-value data. Large binary files such as images should be stored in the device file system or a database, while only their file paths are kept in AsyncStorage.'
},

{
  id: 'react-native-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Permissions',
  prompt: `A React Native app crashes when trying to access the camera on Android.

The camera works correctly on iOS.

What should be investigated FIRST?`,
  options: [
    'Android runtime permissions',
    'Metro Bundler',
    'React Navigation',
    'Redux configuration'
  ],
  correctAnswer: 'Android runtime permissions',
  explanation: 'Android requires dangerous permissions such as CAMERA to be declared in AndroidManifest.xml and requested at runtime. Missing permissions are a common cause of camera failures.'
},

{
  id: 'react-native-13',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Image Picker',
  prompt: `Users should be able to either take a new profile picture or select one from their gallery.

Which solution is MOST appropriate?`,
  options: [
    'Use an image picker library supporting both camera and gallery',
    'Use only the Camera API',
    'Store images in AsyncStorage',
    'Open the browser'
  ],
  correctAnswer: 'Use an image picker library supporting both camera and gallery',
  explanation: 'Libraries such as react-native-image-picker provide a consistent interface for both capturing photos and selecting existing images from the device.'
},

{
  id: 'react-native-14',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Push Notifications',
  prompt: `A shopping app should notify users that their order has shipped even when the application is completely closed.

What technology is required?`,
  options: [
    'Push notifications using FCM/APNs',
    'AsyncStorage',
    'React Context',
    'Deep Linking'
  ],
  correctAnswer: 'Push notifications using FCM/APNs',
  explanation: 'Push notifications are delivered through Firebase Cloud Messaging (Android) and Apple Push Notification service (iOS). Local storage alone cannot wake a closed application.'
},

{
  id: 'react-native-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Location',
  prompt: `A user permanently denies location permission.

What is the BEST application behavior?`,
  options: [
    'Crash the application',
    'Continue requesting permission every second',
    'Gracefully explain why the permission is needed and allow manual location selection if possible',
    'Enable location automatically'
  ],
  correctAnswer: 'Gracefully explain why the permission is needed and allow manual location selection if possible',
  explanation: 'Applications should fail gracefully. Respect the user\'s decision while providing an alternative workflow whenever practical.'
},

{
  id: 'react-native-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A screen displays 15,000 products.

Which component is MOST appropriate?`,
  options: [
    'FlatList',
    'ScrollView',
    'View',
    'SectionList'
  ],
  correctAnswer: 'FlatList',
  explanation: 'FlatList virtualizes rendering by displaying only visible items. ScrollView renders every child immediately, making it unsuitable for very large datasets.'
},

{
  id: 'react-native-17',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A developer writes:

<FlatList
   data={products}
   keyExtractor={(item, index) => index.toString()}
/>

Why should this be reviewed?`,
  options: [
    'Using array indexes as keys can cause incorrect rendering when the list changes',
    'FlatList does not support keyExtractor',
    'Indexes improve performance',
    'FlatList requires UUID objects'
  ],
  correctAnswer: 'Using array indexes as keys can cause incorrect rendering when the list changes',
  explanation: 'Stable unique IDs should be used whenever possible. Index-based keys may cause incorrect item reuse, rendering issues, and unexpected state changes when inserting, deleting, or reordering items.'
},

{
  id: 'react-native-18',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A FlatList item performs expensive rendering even though its props rarely change.

Which optimization is MOST appropriate?`,
  options: [
    'Wrap the item component with React.memo',
    'Replace FlatList with ScrollView',
    'Increase the device memory',
    'Disable virtualization'
  ],
  correctAnswer: 'Wrap the item component with React.memo',
  explanation: 'React.memo prevents unnecessary re-renders when the component\'s props remain unchanged, improving scrolling performance for large lists.'
},

{
  id: 'react-native-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Images',
  prompt: `Users report slow scrolling on a feed containing hundreds of high-resolution images.

What is the BEST optimization?`,
  options: [
    'Resize, cache, and lazy-load images',
    'Increase FlatList height',
    'Store images in AsyncStorage',
    'Disable image loading'
  ],
  correctAnswer: 'Resize, cache, and lazy-load images',
  explanation: 'Large images consume memory, network bandwidth, and decoding time. Optimized image loading significantly improves scrolling performance and reduces memory usage.'
},

{
  id: 'react-native-20',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A React Native application freezes whenever a 25 MB JSON file is parsed.

Animations stop until parsing finishes.

What is the MOST likely reason?`,
  options: [
    'The JavaScript thread is blocked by heavy computation',
    'The UI thread crashed',
    'Metro Bundler is overloaded',
    'React Navigation blocks parsing'
  ],
  correctAnswer: 'The JavaScript thread is blocked by heavy computation',
  explanation: 'Large synchronous operations such as parsing huge JSON payloads block the JavaScript thread, preventing user interactions and animations until processing completes.'
},
{
  id: 'react-native-21',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Offline Support',
  prompt: `A field sales application must continue working even when there is no internet connection.

Users should be able to create new customer records, which will automatically sync once the device reconnects.

Which approach is MOST appropriate?`,
  options: [
    'Require an internet connection before allowing any action',
    'Store operations locally and synchronize them when connectivity returns',
    'Refresh the application every minute',
    'Keep retrying the API every second until it succeeds'
  ],
  correctAnswer: 'Store operations locally and synchronize them when connectivity returns',
  explanation: 'Offline-first applications queue operations locally using local storage or a database and synchronize them later. This provides a much better user experience in unreliable network environments.'
},

{
  id: 'react-native-22',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Debugging',
  prompt: `A React Native application crashes only on Android.

The same feature works perfectly on iOS.

What should be investigated FIRST?`,
  options: [
    'Platform-specific native code, permissions, and Android logs (Logcat)',
    'React Context',
    'FlatList optimization',
    'Metro cache'
  ],
  correctAnswer: 'Platform-specific native code, permissions, and Android logs (Logcat)',
  explanation: 'When an issue affects only one platform, begin by investigating platform-specific implementations, runtime permissions, Gradle configuration, native modules, and Android Logcat output.'
},

{
  id: 'react-native-23',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Memory Leaks',
  prompt: `Users repeatedly open and close a screen.

After several minutes:

• Memory usage continuously increases
• The app becomes slower
• Battery usage rises

What is the MOST likely cause?`,
  options: [
    'Timers, subscriptions, or event listeners are not cleaned up',
    'The application uses FlatList',
    'The app uses React Navigation',
    'Too many StyleSheet objects exist'
  ],
  correctAnswer: 'Timers, subscriptions, or event listeners are not cleaned up',
  explanation: 'Missing cleanup functions cause memory leaks. Timers, WebSocket connections, event listeners, and subscriptions should always be removed when a screen unmounts.'
},

{
  id: 'react-native-24',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Startup Performance',
  prompt: `A production application takes nearly 10 seconds to launch.

Which combination of optimizations would MOST likely improve startup time?`,
  options: [
    'Enable Hermes, lazy-load heavy screens, reduce unnecessary startup work',
    'Replace FlatList with ScrollView',
    'Increase image resolution',
    'Store more data in AsyncStorage'
  ],
  correctAnswer: 'Enable Hermes, lazy-load heavy screens, reduce unnecessary startup work',
  explanation: 'Startup performance improves by minimizing work performed during launch. Hermes reduces JavaScript startup overhead, while lazy loading delays loading features until they are actually needed.'
},

{
  id: 'react-native-25',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Final Production Incident',
  prompt: `A production React Native application receives these complaints:

• Scrolling is very slow
• Animations freeze while loading data
• Battery drains quickly
• Memory usage keeps increasing after navigating between screens
• Product feed contains thousands of high-resolution images

What is the MOST likely root cause?`,
  options: [
    'A combination of blocked JavaScript thread, unoptimized image rendering, and missing cleanup of resources',
    'AsyncStorage is full',
    'React Navigation is too slow',
    'The application has too many screens'
  ],
  correctAnswer: 'A combination of blocked JavaScript thread, unoptimized image rendering, and missing cleanup of resources',
  explanation: 'This incident combines several common production issues: expensive JavaScript work blocks the JS thread, large images consume memory and slow rendering, and missing cleanup for timers or listeners causes memory leaks. Production performance problems are often caused by multiple issues rather than a single bug.'
},
{
  id: 'react-native-26',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Components',
  prompt: 'Which React Native component is designed to display text?',
  options: ['Text', 'Label', 'Paragraph', 'Span'],
  correctAnswer: 'Text',
  explanation: 'React Native uses the Text component for text content. Unlike web React, plain text generally cannot be placed directly inside a View.'
},
{
  id: 'react-native-27',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Lists',
  prompt: 'Why is FlatList generally preferred over mapping a very large array into many View components?',
  options: ['It virtualizes rows and renders mainly the items near the viewport', 'It stores all rows on the native UI thread permanently', 'It guarantees every row is rendered before the first paint', 'It automatically fetches data from an API'],
  correctAnswer: 'It virtualizes rows and renders mainly the items near the viewport',
  explanation: 'FlatList virtualizes large lists, limiting the number of mounted row components and reducing memory and rendering work. It does not fetch data by itself; applications provide data and keys.'
}

];
