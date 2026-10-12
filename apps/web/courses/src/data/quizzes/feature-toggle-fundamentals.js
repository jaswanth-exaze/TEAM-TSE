export default [
  {
    id: 'feature-toggle-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Fundamentals',
    prompt: `Your team finishes a new Dashboard feature.

Management wants the code deployed today but the feature should become available next Monday.

What is the BEST approach?`,
    options: [
      'Delay deployment until Monday',
      'Deploy now and control access using a Feature Toggle',
      'Comment out the feature until Monday',
      'Create a separate production branch'
    ],
    correctAnswer: 'Deploy now and control access using a Feature Toggle',
    explanation: 'Feature Toggles separate deployment from release. The code can safely reach production while remaining hidden until the business decides to enable it.'
  },

  {
    id: 'feature-toggle-2',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Fundamentals',
    prompt: `What is the PRIMARY benefit of Feature Toggles in modern software development?`,
    options: [
      'Separating deployment from feature release',
      'Reducing database size',
      'Making applications compile faster',
      'Replacing version control'
    ],
    correctAnswer: 'Separating deployment from feature release',
    explanation: 'Feature Toggles allow teams to deploy code independently of when users actually see the feature, enabling safer releases and continuous deployment.'
  },

  {
    id: 'feature-toggle-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Technical Debt',
    prompt: `A feature flag has remained enabled for every user for over a year.

The flag is still checked throughout the codebase.

What is the BIGGEST concern?`,
    options: [
      'Increased technical debt and unnecessary complexity',
      'The application becomes slower to compile',
      'The database becomes fragmented',
      'Git history becomes larger'
    ],
    correctAnswer: 'Increased technical debt and unnecessary complexity',
    explanation: 'Once a rollout is complete, obsolete feature flags should be removed. Leaving them in the codebase increases maintenance costs, complicates testing, and makes business logic harder to understand.'
  },

  {
    id: 'feature-toggle-4',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Targeted Rollout',
    prompt: `A new reporting feature should only be available to QA engineers before public release.

Which rollout strategy is MOST appropriate?`,
    options: [
      'Target users by role or user ID',
      'Enable it for 10% of users',
      'Release it to everyone',
      'Deploy it to another branch'
    ],
    correctAnswer: 'Target users by role or user ID',
    explanation: 'Targeted rollouts allow specific users or groups, such as QA engineers, beta testers, or internal employees, to access a feature before wider release.'
  },

  {
    id: 'feature-toggle-5',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Production Incident',
    prompt: `A newly released feature begins crashing production.

Users are actively affected.

What is the FASTEST recovery?`,
    options: [
      'Disable the feature using a Kill Switch',
      'Rollback the entire deployment',
      'Restart every server',
      'Clear application cache'
    ],
    correctAnswer: 'Disable the feature using a Kill Switch',
    explanation: 'A Kill Switch is a feature toggle that immediately disables problematic functionality without requiring a new deployment, minimizing user impact.'
  },

  {
    id: 'feature-toggle-6',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Percentage Rollout',
    prompt: `Your application has 500,000 users.

Management wants to enable a feature for only 5% of users initially.

Why is this strategy commonly used?`,
    options: [
      'To detect production issues before affecting everyone',
      'To reduce database storage',
      'To improve internet speed',
      'To simplify source control'
    ],
    correctAnswer: 'To detect production issues before affecting everyone',
    explanation: 'Percentage rollouts reduce risk by exposing new functionality to a small subset of users first. If problems occur, the rollout can be paused before impacting the entire user base.'
  },

  {
    id: 'feature-toggle-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Canary Releases',
    prompt: `Which statement BEST describes a Canary Release?`,
    options: [
      'Releasing a feature to a small group before wider rollout',
      'Deploying only during weekends',
      'Deploying to every server simultaneously',
      'Running only automated tests'
    ],
    correctAnswer: 'Releasing a feature to a small group before wider rollout',
    explanation: 'A Canary Release gradually exposes new functionality to a limited audience, allowing teams to monitor stability before expanding the rollout.'
  },

  {
    id: 'feature-toggle-8',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Code Review',
    prompt: `A developer writes:

if (featureFlag) {
   newLogic();
} else {
   oldLogic();
}

The feature has been enabled for every user for eight months.

How should this code be reviewed?`,
    options: [
      'Remove the obsolete flag and old code',
      'Leave it for future releases',
      'Duplicate the feature flag',
      'Convert it into a nested feature flag'
    ],
    correctAnswer: 'Remove the obsolete flag and old code',
    explanation: 'Feature Toggles should be temporary. Once a rollout is complete and the old implementation is no longer needed, both the flag and the unused code should be removed.'
  },

  {
    id: 'feature-toggle-9',
    type: 'mcq',
    difficulty: 'expert',
    category: 'A/B Testing',
    prompt: `Marketing wants to compare two checkout page designs using real users.

Which feature flag strategy is MOST appropriate?`,
    options: [
      'A/B Testing',
      'Kill Switch',
      'Time-based rollout',
      'Hotfix deployment'
    ],
    correctAnswer: 'A/B Testing',
    explanation: 'A/B Testing exposes different user groups to different versions of a feature, allowing teams to compare metrics such as conversions, engagement, or performance before making a final decision.'
  },

  {
    id: 'feature-toggle-10',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Release Strategy',
    prompt: `Which statement BEST explains the difference between deployment and release?`,
    options: [
      'Deployment delivers code; release makes functionality available to users',
      'Deployment and release are the same thing',
      'Release always happens before deployment',
      'Deployment only applies to mobile applications'
    ],
    correctAnswer: 'Deployment delivers code; release makes functionality available to users',
    explanation: 'Modern continuous delivery separates deployment from release. Code can be deployed safely into production while Feature Toggles determine when users actually gain access to new functionality.'
  },
  {
  id: 'feature-toggle-11',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Database Migration',
  prompt: `A new feature requires a new database table.

Which deployment strategy is the SAFEST?`,
  options: [
    'Deploy the feature first, then create the table',
    'Deploy the database changes first, keep the feature disabled until everything is ready',
    'Deploy both simultaneously without a feature flag',
    'Wait until users report missing tables'
  ],
  correctAnswer: 'Deploy the database changes first, keep the feature disabled until everything is ready',
  explanation: 'Database migrations should generally be backward-compatible and deployed before enabling new functionality. Feature Toggles allow the schema to exist safely before users access the new feature.'
},

{
  id: 'feature-toggle-12',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Frontend & Backend',
  prompt: `A mobile application enables a feature using a Feature Toggle.

The backend API for that feature has NOT yet been deployed.

What is the MOST likely result?`,
  options: [
    'The feature appears but API requests fail',
    'Flutter automatically disables the feature',
    'The backend deploys automatically',
    'The feature continues working normally'
  ],
  correctAnswer: 'The feature appears but API requests fail',
  explanation: 'Feature Toggles should be coordinated across frontend and backend. Enabling only the UI without backend support commonly results in API failures or broken user experiences.'
},

{
  id: 'feature-toggle-13',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Caching',
  prompt: `Your Feature Flag service is queried on every HTTP request.

Traffic suddenly increases to 2 million requests per hour.

What is the BEST optimization?`,
  options: [
    'Cache feature flags for a short duration',
    'Remove all feature flags',
    'Query the database twice',
    'Restart the flag service'
  ],
  correctAnswer: 'Cache feature flags for a short duration',
  explanation: 'Feature flag values change relatively infrequently. Short-lived caching dramatically reduces load while still allowing changes to propagate quickly.'
},

{
  id: 'feature-toggle-14',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Offline Strategy',
  prompt: `A mobile app starts without an internet connection.

The Feature Flag service cannot be reached.

What is the BEST behavior?`,
  options: [
    'Use the last known cached flag values with sensible defaults',
    'Crash immediately',
    'Enable every feature',
    'Disable the entire application'
  ],
  correctAnswer: 'Use the last known cached flag values with sensible defaults',
  explanation: 'Production applications should continue operating when possible. Caching previously downloaded feature flags allows the application to remain usable during temporary connectivity issues.'
},

{
  id: 'feature-toggle-15',
  type: 'mcq',
  difficulty: 'expert',
  category: 'High Availability',
  prompt: `Your Feature Flag service becomes completely unavailable.

What should a well-designed application do?`,
  options: [
    'Fall back to predefined default values',
    'Crash immediately',
    'Enable every feature automatically',
    'Block all user requests'
  ],
  correctAnswer: 'Fall back to predefined default values',
  explanation: 'Applications should never depend entirely on the availability of a Feature Flag service. Safe defaults and local caching improve resilience.'
},

{
  id: 'feature-toggle-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Architecture',
  prompt: `Feature A is enabled only if Feature B is also enabled.

Over time many flags begin depending on one another.

What is this problem commonly called?`,
  options: [
    'Feature Flag Dependency',
    'Memory Leak',
    'Deadlock',
    'Canary Deployment'
  ],
  correctAnswer: 'Feature Flag Dependency',
  explanation: 'Dependent feature flags create complex decision trees that become difficult to understand, test, and maintain. Teams should minimize dependencies between flags.'
},

{
  id: 'feature-toggle-17',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Maintainability',
  prompt: `A project now contains over 300 active feature flags.

Developers struggle to understand which flags are still required.

What is the MOST likely problem?`,
  options: [
    'Feature Flag Explosion',
    'Thread Starvation',
    'Database Fragmentation',
    'Cache Thrashing'
  ],
  correctAnswer: 'Feature Flag Explosion',
  explanation: 'Allowing feature flags to accumulate indefinitely creates technical debt, increases testing effort, and makes application behavior difficult to reason about.'
},

{
  id: 'feature-toggle-18',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Performance',
  prompt: `A developer writes:

if (isFeatureEnabled("newDashboard")) {
   ...
}

inside every widget's build() method.

What should be improved?`,
  options: [
    'Evaluate the flag once and reuse the result instead of repeatedly querying it',
    'Move the flag into setState()',
    'Call the flag service more often',
    'Replace the feature flag with comments'
  ],
  correctAnswer: 'Evaluate the flag once and reuse the result instead of repeatedly querying it',
  explanation: 'Repeated feature flag evaluation can become unnecessarily expensive, especially if it involves network or storage access. Cache or resolve the value once per logical operation.'
},

{
  id: 'feature-toggle-19',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Rollout',
  prompt: `A feature has successfully completed a gradual rollout:

5% → 25% → 50% → 100%

No issues have been reported.

What should happen NEXT?`,
  options: [
    'Remove the feature flag and old code',
    'Keep the flag forever',
    'Roll back the deployment',
    'Reduce rollout back to 5%'
  ],
  correctAnswer: 'Remove the feature flag and old code',
  explanation: 'Feature Toggles are intended to be temporary. Once a rollout is complete and confidence is high, removing the flag simplifies the codebase and reduces technical debt.'
},

{
  id: 'feature-toggle-20',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Production Incident',
  prompt: `Users report:

• The new Checkout page is visible.
• Clicking "Place Order" returns HTTP 404.
• Feature Flag dashboard shows:
    Frontend Flag = ON
    Backend Flag = OFF

What is the MOST likely root cause?`,
  options: [
    'Frontend and backend feature flags are out of sync',
    'Database corruption',
    'Memory leak',
    'Flutter rendering issue'
  ],
  correctAnswer: 'Frontend and backend feature flags are out of sync',
    explanation: 'This is a classic distributed rollout problem. The frontend exposes functionality that the backend has not yet enabled, causing API failures. Coordinated feature rollouts across all services are essential in distributed systems.'
  },
  {
    id: 'feature-toggle-fundamentals-21',
    type: 'mcq',
    difficulty: 'beginner',
    category: 'Flag Basics',
    prompt: 'What does a feature toggle allow a team to control?',
    options: ['Whether a feature is available without redeploying its code', 'Whether source code is compiled', 'Whether a database backup exists', 'Whether users can connect to the internet'],
    correctAnswer: 'Whether a feature is available without redeploying its code',
    explanation: 'A feature toggle separates deploying code from making a feature available. Teams can release code safely and enable the behavior later for selected users or environments.'
  },
  {
    id: 'feature-toggle-fundamentals-22',
    type: 'mcq',
    difficulty: 'medium',
    category: 'Flag Lifecycle',
    prompt: 'A temporary release flag has been enabled for everyone for several months. What is the healthiest next step?',
    options: ['Remove the flag and obsolete branching after confirming rollout', 'Keep it permanently in case it may be useful someday', 'Add a second flag to control the first one', 'Move the flag check into every database query'],
    correctAnswer: 'Remove the flag and obsolete branching after confirming rollout',
    explanation: 'Temporary flags create ongoing code paths, testing combinations, and operational state. After a successful rollout, remove the flag and old branch so the codebase returns to one clear behavior.'
  }
];
