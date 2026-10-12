export default [
  // 1-10: Foundations & Local Workflow
  {
    id: 'git-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Local Workflow',
    prompt: `You made changes to a file but realize they are wrong before committing. What is the best way to discard those changes?`,
    options: [
      'git reset --hard',
      'git checkout -- file.txt',
      'git stash drop',
      'Delete the file'
    ],
    correctAnswer: 'git checkout -- file.txt',
    explanation: 'git checkout -- <file> safely discards uncommitted changes in a specific file. git reset --hard is more dangerous as it affects the entire working directory.'
  },

  {
    id: 'git-2',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Status & Inspection',
    prompt: `git status shows:\nChanges to be committed: app.js\nChanges not staged: README.md\nUntracked: keys.log\nWhich files will be in the next commit?`,
    options: ['app.js only', 'All three', 'app.js and README.md', 'None'],
    correctAnswer: 'app.js only',
    explanation: 'Only staged files are committed. You must git add the others first.'
  },

  {
    id: 'git-3',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Local Workflow',
    prompt: `What does git diff --staged show?`,
    options: [
      'Changes in working directory',
      'Changes between staging area and last commit',
      'Changes between branches',
      'Untracked files'
    ],
    correctAnswer: 'Changes between staging area and last commit',
    explanation: 'git diff shows working directory vs staging. git diff --staged (or --cached) shows staging vs last commit. Both are essential during review.'
  },

  {
    id: 'git-4',
    type: 'mcq',
    difficulty: 'expert',
    category: 'HEAD & References',
    prompt: `You run git checkout abc1234 (a commit hash). What state are you in?`,
    options: [
      'Detached HEAD',
      'On a new branch',
      'On main',
      'Error'
    ],
    correctAnswer: 'Detached HEAD',
    explanation: 'Detached HEAD means you are not on any branch. Commits made here are at risk of being lost unless you create a branch.'
  },

  {
    id: 'git-5',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Reset vs Revert',
    prompt: `A commit was already pushed to main. You want to undo it safely for the team. Which command?`,
    options: [
      'git reset --hard HEAD~1',
      'git revert HEAD',
      'git push --force',
      'git checkout HEAD~1'
    ],
    correctAnswer: 'git revert HEAD',
    explanation: 'git revert creates a new commit that undoes the changes. It is safe for shared history. git reset rewrites history and requires force push.'
  },

  {
    id: 'git-6',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Stashing',
    prompt: `Best use case for git stash?`,
    options: [
      'Permanent backup',
      'Temporary shelving to switch branches',
      'Deleting untracked files',
      'Merging branches'
    ],
    correctAnswer: 'Temporary shelving to switch branches',
    explanation: 'Stash is perfect for context switching when you have unfinished work.'
  },

  {
    id: 'git-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Remote',
    prompt: `Difference between git fetch and git pull?`,
    options: [
      'fetch updates remote tracking branches only',
      'pull updates working directory',
      'Both do the same',
      'fetch is dangerous'
    ],
    correctAnswer: 'fetch updates remote tracking branches only',
    explanation: 'git fetch is safe inspection. git pull = fetch + merge. Many teams prefer explicit fetch + review before merging.'
  },

  {
    id: 'git-8',
    type: 'code-review',
    difficulty: 'hard',
    category: 'Code Review',
    prompt: `Developer A: git add . && git commit\nDeveloper B: git add .env && git commit\nWhich is better?`,
    options: ['A', 'B', 'Both', 'Neither'],
    correctAnswer: 'B',
    explanation: 'Never commit .env files. Always review what you are staging.'
  },

  {
    id: 'git-9',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Branching',
    prompt: `Best branch naming convention?`,
    options: [
      'login-page',
      'feature/user-auth',
      'fix-bug',
      'update'
    ],
    correctAnswer: 'feature/user-auth',
    explanation: 'Prefix + descriptive name helps teams understand purpose quickly.'
  },

  {
    id: 'git-10',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Merge Conflicts',
    prompt: `After resolving conflicts, what must you do?`,
    options: [
      'git merge --continue',
      'git add the resolved files',
      'git push',
      'git commit --amend'
    ],
    correctAnswer: 'git add the resolved files',
    explanation: 'Staging tells Git the conflict is resolved.'
  },

   {
    id: 'git-11',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Local Workflow',
    prompt: `git diff returns nothing, but git status shows changes. What is the most likely reason?`,
    options: [
      'All changes are committed',
      'Changes are staged (use git diff --staged)',
      'Repository is corrupted',
      'You are in detached HEAD'
    ],
    correctAnswer: 'Changes are staged (use git diff --staged)',
    explanation: 'git diff shows working directory vs staging area. git diff --staged shows staging area vs last commit. This is a very common point of confusion.'
  },

  {
    id: 'git-12',
    type: 'mcq',
    difficulty: 'expert',
    category: 'HEAD & References',
    prompt: `What does HEAD~2 mean?`,
    options: [
      'Two commits before current HEAD',
      'The second branch',
      'Two stashes back',
      'Two tags back'
    ],
    correctAnswer: 'Two commits before current HEAD',
    explanation: 'HEAD~n or HEAD^^ means go back n commits. Extremely useful with git show, git reset, git revert, etc.'
  },

  {
    id: 'git-13',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Reset',
    prompt: `You want to unstage a file but keep the changes in working directory. Which command?`,
    options: [
      'git reset --hard',
      'git reset <file>',
      'git checkout -- <file>',
      'git restore --staged <file>'
    ],
    correctAnswer: 'git restore --staged <file>',
    explanation: 'git restore --staged is the modern, safer way (Git 2.23+). git reset <file> also works but is less clear.'
  },

  {
    id: 'git-14',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Remote',
    prompt: `git fetch origin vs git pull origin main. Which is safer for inspection?`,
    options: [
      'git pull',
      'git fetch',
      'Both are same',
      'git merge'
    ],
    correctAnswer: 'git fetch',
    explanation: 'git fetch updates remote tracking branches without touching your working directory. Safer for reviewing changes before merging.'
  },

  {
  id: 'git-15',
  type: 'code-output',
  difficulty: 'expert',
  category: 'Status Interpretation',
  prompt: `You run:

git status

and see:

On branch feature/login

Your branch is ahead of 'origin/feature/login' by 2 commits.

Changes to be committed:
  modified: app.js

Changes not staged for commit:
  modified: README.md

Untracked files:
  notes.txt

You now run:

git commit -m "Finish login"

What remains afterwards?`,
  options: [
    'README.md and notes.txt remain, app.js is committed',
    'Everything is committed',
    'Only notes.txt remains',
    'Nothing changes'
  ],
  correctAnswer: 'README.md and notes.txt remain, app.js is committed',
  explanation: 'Only staged files are committed. app.js was staged, so it becomes part of the commit. README.md is still modified but unstaged, and notes.txt is still untracked.'
},

  {
  id: 'git-16',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Release Management',
  prompt: `Version 2.4.0 has passed QA and is being deployed to production.

What is the BEST Git practice?`,
  options: [
    'Rename the main branch to v2.4.0',
    'Create an annotated Git tag for the release',
    'Create a new repository',
    'Commit with message "Production Release"'
  ],
  correctAnswer: 'Create an annotated Git tag for the release',
  explanation: 'Annotated tags permanently mark release versions and include metadata such as author, date, and release message. They are the standard approach for production releases.'
},

  {
    id: 'git-17',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Bisect',
    prompt: `A bug was introduced somewhere in the last 50 commits. Best tool to find it?`,
    options: [
      'git blame',
      'git bisect',
      'git log',
      'git diff'
    ],
    correctAnswer: 'git bisect',
    explanation: 'git bisect performs binary search on commit history. Extremely powerful for finding when a bug was introduced.'
  },

  {
  id: 'git-18',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Debugging',
  prompt: `A production bug appears after last week's deployment.

Developer A says:

"I'll read the commit history."

Developer B says:

"I'll run git blame on the affected file."

Which approach is MORE likely to identify who introduced the problematic line?`,
  options: [
    'Developer A',
    'Developer B',
    'Both are equally effective',
    'Neither'
  ],
  correctAnswer: 'Developer B',
  explanation: 'git blame shows who last modified each individual line, making it much faster to investigate when a specific line of code is responsible for a bug.'
},

  {
    id: 'git-19',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Recovery',
    prompt: `A sensitive file was committed and pushed. Best action?`,
    options: [
      'Delete and commit',
      'Use BFG Repo-Cleaner or filter-branch + force push + rotate secrets',
      'Add to .gitignore only',
      'Do nothing'
    ],
    correctAnswer: 'Use BFG Repo-Cleaner or filter-branch + force push + rotate secrets',
    explanation: 'History must be rewritten. Secrets must be rotated immediately.'
  },

  {
    id: 'git-20',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Force Push',
    prompt: `Safest force push command?`,
    options: [
      'git push --force',
      'git push --force-with-lease',
      'git push -f',
      'git push origin main'
    ],
    correctAnswer: 'git push --force-with-lease',
    explanation: '--force-with-lease is safer as it aborts if someone else pushed meanwhile.'
  },

  {
  id: 'git-21',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Hotfix Workflow',
  prompt: `A critical production bug was fixed on the release branch.

The feature branch contains 30 unfinished commits that should NOT be merged.

You only need the hotfix on main.

What is the BEST approach?`,
  options: [
    'Merge the entire release branch',
    'Cherry-pick only the hotfix commit',
    'Rebase the release branch',
    'Force push the release branch'
  ],
  correctAnswer: 'Cherry-pick only the hotfix commit',
  explanation: 'git cherry-pick applies a single commit onto another branch without bringing unrelated commits. This is a common workflow for production hotfixes.'
},

  {
    id: 'git-22',
    type: 'mcq',
    difficulty: 'expert',
    category: 'GitHub Flow',
    prompt: `In GitHub Flow, where do you make changes?`,
    options: [
      'Directly on main',
      'On short-lived feature branches',
      'On release branches',
      'On fork only'
    ],
    correctAnswer: 'On short-lived feature branches',
    explanation: 'GitHub Flow is simple: feature branches → PR → merge to main.'
  },

  {
    id: 'git-23',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Branch Protection',
    prompt: `Best way to prevent direct pushes to main?`,
    options: [
      'Tell the team',
      'Enable branch protection rules on GitHub',
      'Use .git/hooks',
      'Make main read-only'
    ],
    correctAnswer: 'Enable branch protection rules on GitHub',
    explanation: 'Branch protection rules enforce PRs, reviews, and status checks.'
  },

  {
    id: 'git-24',
    type: 'code-review',
    difficulty: 'hard',
    category: 'Workflow',
    prompt: `Developer A uses git pull. Developer B uses git fetch + git merge. Requirement: Review changes before merging. Who is better?`,
    options: ['A', 'B', 'Both same', 'Neither'],
    correctAnswer: 'B',
    explanation: 'git fetch allows inspection before merging.'
  },

  {
    id: 'git-25',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Detached HEAD',
    prompt: `You are in detached HEAD and make commits. How to save this work?`,
    options: [
      'git checkout main',
      'git switch -c new-branch',
      'git reset',
      'Nothing'
    ],
    correctAnswer: 'git switch -c new-branch',
    explanation: 'Create a new branch from the current detached state to preserve the commits.'
  },

  {
    id: 'git-26',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Advanced',
    prompt: `git restore is preferred over which older command?`,
    options: [
      'git checkout',
      'git reset',
      'git revert',
      'git stash'
    ],
    correctAnswer: 'git checkout',
    explanation: 'git restore (Git 2.23+) is the modern replacement for many checkout use cases.'
  },

  {
    id: 'git-27',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Team',
    prompt: `Two developers edit the same function. Best prevention?`,
    options: [
      'Smaller features',
      'Frequent communication',
      'Feature flags',
      'All of the above'
    ],
    correctAnswer: 'All of the above',
    explanation: 'Good engineering practices reduce merge conflicts.'
  },

  {
  id: 'git-28',
  type: 'mcq',
  difficulty: 'expert',
  category: 'Recovery',
  prompt: `A teammate accidentally ran:

git reset --hard

and believes several local commits are lost.

What should you ask them to do FIRST?`,
  options: [
    'Clone the repository again',
    'Run git reflog to locate the previous HEAD',
    'Run git pull',
    'Delete the branch'
  ],
  correctAnswer: 'Run git reflog to locate the previous HEAD',
  explanation: 'git reflog records every movement of HEAD, even after reset operations. In many cases, apparently "lost" commits can be recovered using reflog.'
},

  {
    id: 'git-29',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Best Practices',
    prompt: `Most important habit for professional Git usage?`,
    options: [
      'Commit often',
      'Write good messages',
      'Use feature branches',
      'All of the above'
    ],
    correctAnswer: 'All of the above',
    explanation: 'These habits make collaboration smooth and history useful.'
  },

  {
    id: 'git-30',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Final Boss',
    prompt: `A developer ran git pull (got conflict), then git reset --hard, then git push --force. How many serious mistakes?`,
    options: ['1', '2', '3', '4'],
    correctAnswer: '3',
    explanation: '1. Did not resolve conflict properly. 2. Reset --hard lost others’ work. 3. Force push without coordination is dangerous.'
  },

  {
    id: 'git-31',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Capstone',
    prompt: `Best way to keep feature branches up to date with main?`,
    options: [
      'Merge main frequently',
      'Rebase on main regularly',
      'Never update',
      'Create new branch every day'
    ],
    correctAnswer: 'Rebase on main regularly',
    explanation: 'Regular rebasing keeps PRs small and clean.'
  },

  {
    id: 'git-32',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Tags',
    prompt: `You want to mark a production release. Best command?`,
    options: [
      'git tag v1.5.0',
      'git tag -a v1.5.0 -m "Release 1.5.0"',
      'git branch v1.5.0',
      'git commit -m "release"'
    ],
    correctAnswer: 'git tag -a v1.5.0 -m "Release 1.5.0"',
    explanation: 'Annotated tags store extra metadata and are preferred for releases.'
  },

  {
    id: 'git-33',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Debugging',
    prompt: `git blame is most useful for:`,
    options: [
      'Finding who wrote each line',
      'Finding merge conflicts',
      'Creating branches',
      'Pushing code'
    ],
    correctAnswer: 'Finding who wrote each line',
    explanation: 'git blame helps understand the reasoning behind code during debugging.'
  },

  {
    id: 'git-34',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Advanced',
    prompt: `git cherry-pick is best used when:`,
    options: [
      'You need one specific commit from another branch',
      'You want to merge entire branches',
      'You want to delete commits',
      'You want to stash changes'
    ],
    correctAnswer: 'You need one specific commit from another branch',
    explanation: 'Cherry-pick is perfect for hotfixes and porting individual commits.'
  },

  {
    id: 'git-35',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Capstone Reasoning',
    prompt: `Your team follows GitHub Flow. A junior pushed directly to main and broke the build. What is the best long-term solution?`,
    options: [
      'Scold the junior',
      'Enable branch protection rules + required PR reviews + CI checks',
      'Switch to Git Flow',
      'Allow force pushes'
    ],
    correctAnswer: 'Enable branch protection rules + required PR reviews + CI checks',
    explanation: 'Technical guardrails are far more effective than relying on human discipline alone.'
  },{
  id: 'git-36',
  type: 'code-review',
  difficulty: 'expert',
  category: 'Production Workflow',
  prompt: `Two developers propose different deployment workflows.

Developer A:

Feature Branch
→ Merge directly into main
→ Deploy

Developer B:

Feature Branch
→ Pull Request
→ Code Review
→ CI Passes
→ Merge
→ Deploy

Which workflow should a professional team adopt?`,
  options: [
    'Developer A',
    'Developer B',
    'Either workflow',
    'Both are unsafe'
  ],
  correctAnswer: 'Developer B',
  explanation: 'Modern teams rely on Pull Requests, mandatory code reviews, and automated CI checks before merging into main. These practices reduce defects, improve collaboration, and prevent broken builds from reaching production.'
},
{
  id: 'git-37',
  type: 'mcq',
  difficulty: 'beginner',
  category: 'Working Tree',
  prompt: 'Which command shows changed files and whether changes are staged?',
  options: ['git status', 'git log', 'git branch', 'git init'],
  correctAnswer: 'git status',
  explanation: 'git status summarizes the current branch, staged changes, unstaged changes, and untracked files. It is a safe first check before committing or switching branches.'
},
{
  id: 'git-38',
  type: 'mcq',
  difficulty: 'medium',
  category: 'Staging',
  prompt: 'A file has both staged and unstaged edits. What does git commit include?',
  options: ['All edits currently in the working tree', 'Only the staged snapshot', 'Only the unstaged edits', 'Neither until the file is committed separately'],
  correctAnswer: 'Only the staged snapshot',
  explanation: 'A commit records the index, also called the staging area. Later unstaged edits to the same file remain in the working tree and are not included until staged.'
}
];
