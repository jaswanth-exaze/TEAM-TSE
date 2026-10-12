function topic(number, id, title, commands, keyNotes, resource) {
  return {
    number,
    id,
    title,
    category: 'Commands and topics',
    commands,
    keyNotes,
    examExpected: true,
    resource,
    syllabusOnly: true,
  }
}

export const LINUX_SYLLABUS = {
  title: 'Linux Commands',
  subtitle: 'A two week syllabus covering command line fundamentals, system administration, and remote access.',
  curriculumTitle: 'Linux Commands syllabus',
  syllabusOnly: true,
  parts: [
    {
      id: 'part-1',
      label: 'Week 1',
      title: 'Fundamentals',
      newTopics: 'Fundamentals',
      totalTopics: 8,
      summary: 'Navigate the file system, manage files, inspect text, set permissions, and combine commands.',
      topics: [
        topic(1, 'directory-structure', 'Directory Structure', ['/', '/etc', '/home', '/var', '/tmp', '/bin', '/proc'], 'Know what each system directory is for.', 'week1_fundamentals'),
        topic(2, 'navigation', 'Navigation', ['pwd', 'cd', 'ls'], '-lrt sorts by time; -lrth adds human readable sizes.', 'week1_fundamentals'),
        topic(3, 'file-operations', 'File Operations', ['touch', 'mkdir', 'cp', 'mv', 'rm'], 'Use rm -rf with care. Use cp -r to copy directories.', 'week1_fundamentals'),
        topic(4, 'viewing-files', 'Viewing Files', ['cat', 'less', 'head', 'tail'], 'Use tail -f to follow live logs and head -n 20 to show the first 20 lines.', 'week1_fundamentals'),
        topic(5, 'text-editing', 'Text Editing', ['nano'], 'Ctrl+O saves, Ctrl+X exits, and Ctrl+K cuts a line.', 'week1_fundamentals'),
        topic(6, 'permissions', 'Permissions', ['chmod'], '755 means rwxr-xr-x; 644 means rw-r--r--; +x adds execute permission.', 'week1_fundamentals'),
        topic(7, 'searching', 'Searching', ['find', 'grep'], 'Examples: find . -name "*.txt" and grep -r "text" /path.', 'week1_fundamentals'),
        topic(8, 'pipes-redirection', 'Pipes & Redirection', ['|', '>', '>>'], 'Pipe output into another command with |. Use > to replace a file and >> to append. Examples: ls -la | grep ".txt"; echo "hi" > file.txt.', 'week1_fundamentals'),
      ],
    },
    {
      id: 'part-2',
      label: 'Week 2',
      title: 'System & Remote',
      newTopics: 'System administration and remote access',
      totalTopics: 15,
      summary: 'Inspect processes and resources, manage packages and archives, and connect to remote systems.',
      topics: [
        topic(9, 'process-management', 'Process Management', ['ps aux', 'top', 'kill'], 'Use top for a live process view. kill -9 forcefully terminates a process.', 'week2_system_admin'),
        topic(10, 'users-sudo', 'Users & Sudo', ['sudo', 'passwd'], 'Use sudo to run a command with elevated privileges. passwd changes a password.', 'week2_system_admin'),
        topic(11, 'system-info', 'System Info', ['df -h', 'du -sh', 'free -h'], 'df reports disk space, du reports directory size, and free reports memory.', 'week2_system_admin'),
        topic(12, 'archives', 'Archives', ['tar -czf', 'tar -xzf'], '-c creates, -x extracts, -z uses gzip, and -f names the archive file.', 'week2_system_admin'),
        topic(13, 'package-management', 'Package Management', ['apt update', 'apt install'], 'Run apt update before installing packages.', 'week2_system_admin'),
        topic(14, 'ssh', 'SSH', ['ssh', 'ssh-keygen', 'ssh-copy-id'], 'Connect with ssh user@host. Use ssh-keygen and ssh-copy-id to set up key-based login.', 'week2_system_admin · Mac howto'),
        topic(15, 'file-transfer', 'File Transfer', ['scp'], 'Example: scp file.txt user@host:/remote/path/. SCP uses uppercase -P to set the port.', 'week2_system_admin · Mac howto'),
      ],
    },
  ],
  contentNoteTitle: 'Mac setup note',
  contentNote: 'Mac users should practise SSH and SCP in a Docker container. The source syllabus refers to week2_mac_ssh_scp_howto.md for the setup guide.',
  resources: [
    { title: 'Official Study Guide', kind: 'Guide' },
    { title: 'Quick Reference (cheat sheet)', kind: 'Guide' },
    { title: 'Linux for Beginners', kind: 'Video' },
    { title: 'Linux Commands', kind: 'Video' },
    { title: 'Linux Tutorial', kind: 'Video' },
    { title: 'Linux Crash Course', kind: 'Video' },
    { title: 'Linux Full Course', kind: 'Video' },
  ],
}
