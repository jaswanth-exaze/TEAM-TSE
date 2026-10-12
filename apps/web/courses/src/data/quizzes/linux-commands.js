export default [
  {
    id: 'linux-1',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Production Incident',
    prompt: `A production server shows 99% disk usage. Which command should you run NEXT to identify large directories?`,
    options: [
      'df -h',
      'du -sh /*',
      'free -h',
      'top'
    ],
    correctAnswer: 'du -sh /*',
    explanation: 'df -h only shows filesystem-level usage (e.g., /dev/sda1 is 99% full) but gives no insight into which directories or files are responsible. du -sh /* quickly summarizes space used by top-level directories. This is the standard troubleshooting workflow in production: df → du → investigate the largest directory (often /var/log, /tmp, Docker volumes, or old backups). Never delete files blindly.'
  },

  {
    id: 'linux-2',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Log Investigation',
    prompt: `Which command watches new log entries in real time and shows only lines containing "ERROR"?`,
    options: [
      'cat app.log | grep ERROR',
      'tail -f app.log | grep ERROR',
      'grep ERROR app.log',
      'head -100 app.log | grep ERROR'
    ],
    correctAnswer: 'tail -f app.log | grep ERROR',
    explanation: 'cat and plain grep only inspect the current static content of the file. tail -f continuously follows the file as new lines are written (essential for live debugging). Piping to grep filters the live stream to ERROR lines only. This pattern is used constantly during production incidents involving crashing or misbehaving applications.'
  },

  {
    id: 'linux-3',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Deployment Failure',
    prompt: `A script with permissions -rw-r--r-- fails with "Permission denied" when executed. Why?`,
    options: [
      'The file is owned by root',
      'The execute bit is missing',
      'The file is corrupted',
      'Wrong filesystem'
    ],
    correctAnswer: 'The execute bit is missing',
    explanation: 'Permissions -rw-r--r-- (644) allow the owner to read and write but grant no execute permission (x) to anyone. Shell scripts must have the execute bit (chmod +x deploy.sh or chmod 755 deploy.sh) to be run directly with ./deploy.sh. This is one of the most frequent deployment failures seen in production environments.'
  },

  {
    id: 'linux-4',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Security',
    prompt: `A junior runs chmod 777 deploy.sh to fix a permission issue. Why is this problematic?`,
    options: [
      'It makes the file too large',
      'It gives everyone full permissions — security risk',
      'It removes execute rights',
      'Linux does not support 777'
    ],
    correctAnswer: 'It gives everyone full permissions — security risk',
    explanation: '777 grants read, write, and execute rights to owner, group, and all other users. This violates the principle of least privilege and is a common security finding in audits. Production scripts should usually be 755 (owner rwx, others rx). Over-permissive files increase the attack surface significantly.'
  },

  {
    id: 'linux-5',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Remote Administration',
    prompt: `After ssh-keygen, passwordless login still asks for a password. What is missing?`,
    options: [
      'Restart sshd',
      'ssh-copy-id user@server',
      'chmod 777 on the key',
      'scp the private key'
    ],
    correctAnswer: 'ssh-copy-id user@server',
    explanation: 'ssh-keygen only creates the public/private key pair locally. ssh-copy-id securely transfers the public key to the remote server\'s ~/.ssh/authorized_keys file and sets correct permissions (600). Never copy the private key to any server.'
  },

  {
    id: 'linux-6',
    type: 'multi',
    difficulty: 'expert',
    category: 'Production Debugging',
    prompt: `Server is low on disk space. Which commands help investigate? (Select all that apply)`,
    options: [
      'df -h',
      'du -sh /var/*',
      'find /var -name "*.log" -size +100M',
      'top'
    ],
    correctAnswer: ['df -h', 'du -sh /var/*', 'find /var -name "*.log" -size +100M'],
    explanation: 'df -h confirms overall filesystem usage. du -sh identifies which directories are large. find helps locate specific large or old log files. top is useful for CPU/memory but does not help with disk space. This combination forms the standard disk troubleshooting workflow in production.'
  },

  {
    id: 'linux-7',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Memory Investigation',
    prompt: `free -h shows 16G total, 15.2G used, 800M free, 9G available. Is the server out of memory?`,
    options: [
      'Yes, almost no free RAM',
      'No — "available" column shows usable memory including cache',
      'Yes — it has started swapping',
      'Cannot tell without top'
    ],
    correctAnswer: 'No — "available" column shows usable memory including cache',
    explanation: 'Modern Linux aggressively uses free RAM for filesystem cache to improve performance. The "free" column can be misleading. The "available" column estimates how much memory can actually be allocated to new processes without triggering swapping. Always trust "available" more than "free".'
  },

  {
    id: 'linux-8',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Command Pipeline',
    prompt: `Find all .log files and search inside them for "OutOfMemory". Best command?`,
    options: [
      'grep -r "OutOfMemory" .',
      'find . -name "*.log" -exec grep -H "OutOfMemory" {} \\;',
      'cat *.log | grep OutOfMemory',
      'ls *.log | xargs grep OutOfMemory'
    ],
    correctAnswer: 'find . -name "*.log" -exec grep -H "OutOfMemory" {} \\;',
    explanation: 'grep -r searches everything recursively (including non-log files). find + -exec limits the search to .log files and runs grep efficiently on each. The -H flag shows the filename. This pattern scales well on servers with thousands of files.'
  },

  {
    id: 'linux-9',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Incident Response',
    prompt: `A process is at 100% CPU. What should you do first?`,
    options: [
      'kill -9 <PID>',
      'Investigate logs and application state before terminating',
      'Reboot the server',
      'Delete log files'
    ],
    correctAnswer: 'Investigate logs and application state before terminating',
    explanation: 'High CPU usage is not always bad — it could be legitimate heavy workload, indexing, or batch processing. Blindly killing processes can cause data corruption or loss of important state. Always check logs, recent deployments, and application health first.'
  },

  {
    id: 'linux-10',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Archive Management',
    prompt: `You received backup.tar.gz. How do you extract it?`,
    options: [
      'tar -czf backup.tar.gz',
      'tar -xzf backup.tar.gz',
      'gzip -d backup.tar.gz',
      'tar -cf backup.tar.gz'
    ],
    correctAnswer: 'tar -xzf backup.tar.gz',
    explanation: 'x = extract, z = handle gzip compression, f = specify the archive file. The other options are for creating archives. Always extract into a temporary directory first in production to avoid overwriting live data.'
  },

  {
    id: 'linux-11',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Security Review',
    prompt: `Permissions on a script: -rwxr-x---. Who can execute it?`,
    options: [
      'Only owner',
      'Owner and group',
      'Everyone',
      'Nobody'
    ],
    correctAnswer: 'Owner and group',
    explanation: 'The permission string breaks down as: owner (rwx), group (r-x), others (---). Both owner and members of the group can execute the script. This is a common permission setup for shared deployment scripts.'
  },

  {
    id: 'linux-12',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Command Review',
    prompt: `Why is grep "Exception" server.log better than cat server.log | grep "Exception"?`,
    options: [
      'It is faster and avoids unnecessary use of cat',
      'The cat version does not work',
      'grep requires cat',
      'They are identical in performance'
    ],
    correctAnswer: 'It is faster and avoids unnecessary use of cat',
    explanation: 'This is known as "Useless Use of Cat" (UUOC). grep can read files directly. The cat version creates an extra process and pipe, which is slightly less efficient. Senior engineers prefer the cleaner form.'
  },

  {
    id: 'linux-13',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Deployment Review',
    prompt: `mv build/ /var/www/html/ vs cp -r build/ /var/www/html/. After the command, where is the original build/?`,
    options: [
      'Still in original location (cp)',
      'Moved to destination (mv)',
      'Deleted automatically',
      'Both leave original intact'
    ],
    correctAnswer: 'Moved to destination (mv)',
    explanation: 'mv renames/moves the directory (original location no longer exists). cp -r creates a copy, leaving the source intact. This distinction is critical during deployment scripts where later steps may expect the build directory to still exist.'
  },

  {
    id: 'linux-14',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Senior Linux Challenge',
    prompt: `Teammate suggests immediate reboot due to slowness. Best response?`,
    options: [
      'Reboot immediately',
      'Collect evidence (processes, logs, memory, disk) first unless true emergency',
      'Kill high CPU processes',
      'Clear /tmp'
    ],
    correctAnswer: 'Collect evidence (processes, logs, memory, disk) first unless true emergency',
    explanation: 'Rebooting destroys valuable diagnostic information (running processes, open files, memory state, recent logs) and makes root cause analysis much harder. Always gather data first unless there is a complete outage.'
  },

  {
    id: 'linux-15',
    type: 'code-output',
    difficulty: 'medium',
    category: 'File Navigation',
    prompt: `You run: ls -lh /var/log\nWhat does the "l" in the first column of output indicate for an entry?`,
    options: [
      'Large file',
      'Symbolic link',
      'Directory',
      'Executable'
    ],
    correctAnswer: 'Symbolic link',
    explanation: 'The first character in ls -l output indicates file type: - = regular file, d = directory, l = symbolic link, s = socket, p = pipe, b/c = block/character device. Understanding this is fundamental for navigation and troubleshooting.'
  },

  {
    id: 'linux-16',
    type: 'mcq',
    difficulty: 'medium',
    category: 'Basic Commands',
    prompt: `You are in /home/user/project. Which command shows files sorted by modification time, newest first, with human-readable sizes?`,
    options: [
      'ls -l',
      'ls -lrt',
      'ls -lhrt',
      'ls -a'
    ],
    correctAnswer: 'ls -lhrt',
    explanation: 'l = long format, h = human readable sizes, r = reverse order, t = sort by modification time. This combination is extremely common when trying to find recently changed files during incidents.'
  },

  {
    id: 'linux-17',
    type: 'code-review',
    difficulty: 'hard',
    category: 'Code Review',
    prompt: `Requirement: Append new errors to error.log without overwriting existing content.\nDeveloper A: cat new_errors.txt > error.log\nDeveloper B: cat new_errors.txt >> error.log\nWho is correct?`,
    options: [
      'Developer A',
      'Developer B',
      'Both',
      'Neither'
    ],
    correctAnswer: 'Developer B',
    explanation: '> redirects and overwrites the target file. >> appends to the end. Using > when you meant to append is a common cause of lost log data in scripts.'
  },

  {
    id: 'linux-18',
    type: 'code-output',
    difficulty: 'hard',
    category: 'Output Interpretation',
    prompt: `top output shows: %Cpu(s): 5.2 us, 2.1 sy, 0.0 ni, 90.3 id, 2.4 wa...\nWhat does the high "wa" value suggest?`,
    options: [
      'High user CPU',
      'High I/O wait (disk bottleneck)',
      'High idle time',
      'High nice processes'
    ],
    correctAnswer: 'High I/O wait (disk bottleneck)',
    explanation: 'wa = iowait percentage. High iowait with low user CPU usually indicates the system is waiting for disk or network I/O. This is a common symptom of slow disks, exhausted IOPS, or heavy logging.'
  },

  {
    id: 'linux-19',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Command Sequencing',
    prompt: `Best sequence to safely free space on a full disk?`,
    options: [
      'rm -rf /var/log/* → df -h',
      'df -h → du -sh /var/* → find large logs → rm carefully',
      'du -sh /* → reboot',
      'rm -rf /tmp/* → top'
    ],
    correctAnswer: 'df -h → du -sh /var/* → find large logs → rm carefully',
    explanation: 'Always investigate before deleting. Understand what is consuming space and why. Blind deletion (especially rm -rf) has caused many major production outages.'
  },

  {
    id: 'linux-20',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Code Review',
    prompt: `Requirement: Copy project directory to remote server.\nA: scp project user@server:/opt\nB: scp -r project user@server:/opt\nWho is correct?`,
    options: ['A', 'B', 'Both', 'Neither'],
    correctAnswer: 'B',
    explanation: 'scp without -r only copies individual files. Directories require the recursive (-r) flag. rsync -avz is often preferred for larger directories due to better performance and resuming capability.'
  },

  {
    id: 'linux-21',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Redirection & Pipelines',
    prompt: `You want both stdout and stderr of a script to go to output.log. Correct command?`,
    options: [
      './script.sh > output.log',
      './script.sh > output.log 2>&1',
      './script.sh 2> output.log',
      './script.sh | tee output.log'
    ],
    correctAnswer: './script.sh > output.log 2>&1',
    explanation: '2>&1 redirects stderr (file descriptor 2) to stdout (file descriptor 1). This is the standard way to capture all output from a script or command.'
  },

  {
    id: 'linux-22',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Output Interpretation',
    prompt: `ls -l output: lrwxrwxrwx 1 user user 12 ... mylink -> /real/path\nWhat type of file is mylink?`,
    options: ['Regular file', 'Directory', 'Symbolic link', 'Block device'],
    correctAnswer: 'Symbolic link',
    explanation: 'The first character "l" denotes a symbolic (soft) link. Unlike hard links, symlinks can point to different filesystems and break if the target is deleted.'
  },

  {
    id: 'linux-23',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Troubleshooting',
    prompt: `A command works with sudo but not as normal user. Most likely issue?`,
    options: [
      'Missing execute permission for others',
      'File is owned by root with 700 permissions',
      'Command not in PATH',
      'Disk full'
    ],
    correctAnswer: 'File is owned by root with 700 permissions',
    explanation: '700 means only the owner (root) can read/write/execute. A normal user gets Permission Denied. This is very common after running commands with sudo without proper permission planning.'
  },

  {
    id: 'linux-24',
    type: 'code-review',
    difficulty: 'hard',
    category: 'Code Review',
    prompt: `Requirement: Edit config file safely.\nA: nano config.env\nB: cp config.env config.env.bak && nano config.env\nWho followed best practice?`,
    options: ['A', 'B', 'Both', 'Neither'],
    correctAnswer: 'B',
    explanation: 'Always create a backup before editing critical configuration files in production. This allows quick rollback if the change causes issues.'
  },

  {
    id: 'linux-25',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Find Command',
    prompt: `Find all .log files larger than 100MB modified in last 30 days:`,
    options: [
      'find /var -name "*.log" -size +100M -mtime -30',
      'find /var -name "*.log" -size 100M',
      'du -sh *.log',
      'ls -l *.log | grep 100M'
    ],
    correctAnswer: 'find /var -name "*.log" -size +100M -mtime -30',
    explanation: '-size +100M finds files larger than 100MB. -mtime -30 finds files modified in the last 30 days. find is extremely powerful for production cleanup and investigation.'
  },

  {
    id: 'linux-26',
    type: 'multi',
    difficulty: 'expert',
    category: 'Production Troubleshooting',
    prompt: `Server is slow. Select the best initial investigation commands:`,
    options: [
      'top',
      'df -h',
      'free -h',
      'rm -rf /tmp/*'
    ],
    correctAnswer: ['top', 'df -h', 'free -h'],
    explanation: 'top shows CPU and memory hogs, df checks disk, free checks memory pressure. Destructive commands like rm should only be used after careful investigation.'
  },

  {
    id: 'linux-27',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Predict Output',
    prompt: `After: rm -rf * inside /app/logs (no hidden files). What remains?`,
    options: [
      'All files deleted including hidden',
      'Only non-hidden files and directories deleted',
      'Nothing is deleted (needs sudo)',
      'Files moved to Trash'
    ],
    correctAnswer: 'Only non-hidden files and directories deleted',
    explanation: 'The * wildcard does not match hidden files (starting with .) by default. rm -rf is one of the most dangerous commands in Linux — it deletes immediately with no trash/recovery.'
  },

  {
    id: 'linux-28',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Sudo & Security',
    prompt: `Best way to run a script as another user?`,
    options: [
      'sudo -u otheruser ./script.sh',
      'su otheruser && ./script.sh',
      'chmod 777 script.sh',
      'chown otheruser script.sh'
    ],
    correctAnswer: 'sudo -u otheruser ./script.sh',
    explanation: 'sudo -u is the cleanest and most auditable way for one-off commands. su starts a full login shell and is more heavyweight.'
  },

  {
    id: 'linux-29',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Code Review',
    prompt: `Requirement: Graceful shutdown of a service.\nA: kill -9 <PID>\nB: kill -15 <PID>\nWho is correct?`,
    options: ['A', 'B', 'Both', 'Neither'],
    correctAnswer: 'B',
    explanation: 'SIGTERM (15) asks the process to shut down cleanly and allows it to flush buffers, close connections, and release resources. SIGKILL (9) cannot be caught and may leave the system in an inconsistent state.'
  },

  {
    id: 'linux-30',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Advanced Troubleshooting',
    prompt: `A service starts but dies after a few seconds. Best first command?`,
    options: [
      'journalctl -u service -n 100',
      'top',
      'df -h',
      'reboot'
    ],
    correctAnswer: 'journalctl -u service -n 100',
    explanation: 'On systemd-based systems, journalctl shows the recent logs for a specific service, including startup errors and crash reasons. This is usually the fastest way to diagnose why a service is dying immediately after starting.'
  },

  {
    id: 'linux-31',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Advanced Troubleshooting',
    prompt: `A production application is consuming 100% CPU.\ntop shows:\n%CPU: 99%    %wa: 0%\nThe application is still responding to requests.\nWhat should you do NEXT?`,
    options: [
      'kill -9 the process immediately',
      'Check application logs and identify what the process is doing',
      'Reboot the server',
      'Increase server resources'
    ],
    correctAnswer: 'Check application logs and identify what the process is doing',
    explanation: 'High CPU with low I/O wait and a still-responsive application usually points to an internal issue (infinite loop, bad algorithm, GC thrashing, lock contention, etc.). Investigation (logs, thread dumps, profiling) is essential before taking disruptive action.'
  },

  {
    id: 'linux-32',
    type: 'code-output',
    difficulty: 'expert',
    category: 'Output Interpretation',
    prompt: `ps aux output:\nUSER   PID %CPU %MEM COMMAND\nroot   101  0.1  0.2 sshd\nmysql  203  2.1 31.0 mysqld\nubuntu 511 97.8  1.3 python app.py\nWhich process should be investigated FIRST?`,
    options: [
      'sshd (PID 101)',
      'mysqld (PID 203)',
      'python app.py (PID 511)',
      'All of them equally'
    ],
    correctAnswer: 'python app.py (PID 511)',
    explanation: 'The process with 97.8% CPU is the obvious outlier. Always start investigation with the most anomalous resource consumer. This prevents wasting time on normal system processes.'
  },

  {
    id: 'linux-33',
    type: 'multi',
    difficulty: 'expert',
    category: 'Security & Hardening',
    prompt: `After a security audit on a production server, which actions should be taken? (Select all that apply)`,
    options: [
      'Disable password authentication in SSH',
      'Set PermitRootLogin no in sshd_config',
      'Run chmod 777 on deployment scripts',
      'Install and configure fail2ban',
      'Enable automatic security updates'
    ],
    correctAnswer: ['Disable password authentication in SSH', 'Set PermitRootLogin no in sshd_config', 'Install and configure fail2ban', 'Enable automatic security updates'],
    explanation: 'Defense-in-depth and least privilege are key. Password auth and root login are common attack vectors. 777 is never acceptable in production. Tools like fail2ban and automatic updates significantly reduce risk.'
  },

  {
    id: 'linux-34',
    type: 'code-review',
    difficulty: 'expert',
    category: 'Production Best Practices',
    prompt: `Deployment script contains:\nrm -rf /tmp/myapp/*\ncp -r build/* /var/www/html/\nnohup npm start > app.log &\nWhat is the BIGGEST risk?`,
    options: [
      'Using nohup',
      'rm -rf on a dynamic path without safeguards',
      'Using cp instead of rsync',
      'Redirecting logs without rotation'
    ],
    correctAnswer: 'rm -rf on a dynamic path without safeguards',
    explanation: 'rm -rf on paths constructed at runtime is extremely dangerous. A small bug (wrong directory, missing mount, etc.) can delete production data. Always add safeguards or use safer patterns.'
  },

  {
    id: 'linux-35',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Final Incident',
    prompt: `2:14 AM - Production API latency suddenly increases.\nUsers report file uploads are failing.\n\ntop → CPU 18%, wa 8%\nfree -h → Available 9.2 GB\ndf -h → /dev/sda1 99% full\ntail -f app.log → No new entries\n\nWhat is the MOST likely root cause?`,
    options: [
      'High CPU usage',
      'Memory pressure',
      'Disk full (preventing writes and logging)',
      'Application memory leak'
    ],
    correctAnswer: 'Disk full (preventing writes and logging)',
    explanation: 'Full disk prevents new writes, temporary file creation, and logging. This perfectly explains failing uploads, increased latency, and silent logs. The other metrics (low CPU, good available memory) rule out CPU/memory as primary causes. Disk-full incidents are very common.'
  },

  {
    id: 'linux-36',
    type: 'mcq',
    difficulty: 'expert',
    category: 'Capstone Reasoning',
    prompt: `You have 60 seconds before the on-call phone starts ringing.\nServer is slow.\nWhich investigation order is best?`,
    options: [
      'Reboot → rm -rf /tmp/*',
      'top → free -h → df -h → check recent logs',
      'kill -9 all processes > 50% CPU',
      'apt update && apt upgrade -y'
    ],
    correctAnswer: 'top → free -h → df -h → check recent logs',
    explanation: 'Under pressure, resist the urge to take destructive actions immediately. Quick, safe observability commands (top, free, df, logs) give you critical information to make an informed decision. This disciplined approach separates senior engineers from juniors.'
  },
  {
    id: 'linux-commands-37',
    type: 'mcq',
    difficulty: 'beginner',
    category: 'Navigation',
    prompt: 'Which command prints the full path of the current working directory?',
    options: ['pwd', 'cd', 'ls', 'which'],
    correctAnswer: 'pwd',
    explanation: 'pwd means print working directory. It displays the absolute path of the directory your shell is currently using.'
  },
  {
    id: 'linux-commands-38',
    type: 'mcq',
    difficulty: 'medium',
    category: 'Pipelines',
    prompt: 'What does grep -i error app.log piped to wc -l count?',
    options: ['All lines in app.log, case-sensitively', 'Lines containing error regardless of case', 'Occurrences of the word error only', 'Bytes in matching lines'],
    correctAnswer: 'Lines containing error regardless of case',
    explanation: 'grep -i matches without regard to letter case and emits matching lines. wc -l counts those output lines, not the number of individual matches within a line.'
  }
];
