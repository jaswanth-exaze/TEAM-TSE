// A browser-only Linux teaching machine. No host command or network is called.
const LAB_COMMANDS = [
  'pwd', 'cd', 'ls', 'tree', 'stat', 'file', 'find', 'locate', 'touch', 'mkdir', 'cp', 'mv', 'rm', 'ln',
  'cat', 'head', 'tail', 'less', 'more', 'nano', 'wc', 'grep', 'sort', 'uniq', 'cut', 'tr', 'sed', 'awk', 'tee',
  'chmod', 'chown', 'chgrp', 'whoami', 'id', 'groups', 'users', 'who', 'su', 'sudo', 'useradd', 'adduser', 'usermod',
  'userdel', 'passwd', 'exit', 'ps', 'top', 'pgrep', 'pkill', 'kill', 'jobs', 'df', 'du', 'free', 'uname', 'hostname',
  'hostnamectl', 'uptime', 'lscpu', 'lsblk', 'env', 'export', 'date', 'tar', 'apt', 'apt-get', 'apt-cache', 'dpkg',
  'systemctl', 'service', 'ssh', 'ssh-keygen', 'ssh-copy-id', 'scp', 'ping', 'ip', 'curl', 'which', 'type', 'man',
  'help', 'history', 'clear', 'printf', 'echo', 'true', 'false', 'sleep', 'basename', 'dirname', 'realpath', 'readlink',
]

const BASE_DIRECTORIES = [
  '/bin', '/boot/grub', '/dev/pts', '/etc/ssh', '/etc/nginx/sites-available', '/etc/nginx/sites-enabled',
  '/etc/systemd/system', '/home/user/Desktop', '/home/user/Documents', '/home/user/Downloads', '/home/user/Music',
  '/home/user/Pictures', '/home/user/Public', '/home/user/Videos', '/home/deploy/.ssh', '/home/user/projects/website',
  '/home/user/projects/scripts', '/home/user/.ssh', '/lib', '/media/usb', '/mnt/backup', '/opt', '/proc/1',
  '/proc/1024', '/root', '/run/lock', '/run/sshd', '/sbin', '/srv/ftp', '/srv/www', '/tmp', '/usr/bin', '/usr/sbin',
  '/usr/local/bin', '/usr/lib', '/usr/share/doc/bash', '/usr/share/man', '/usr/share/nginx/html', '/var/cache/apt/archives',
  '/var/lib/apt/lists', '/var/lib/dpkg', '/var/log', '/var/log/nginx', '/var/spool/cron', '/var/tmp',
  '/var/www/html', '/var/www/html/assets', '/var/www/html/uploads',
]

const BASE_FILES = {
  '/etc/hostname': ['tse-lab\n', '644', 'root'],
  '/etc/hosts': ['127.0.0.1 localhost\n127.0.1.1 tse-lab\n10.0.0.21 web01\n10.0.0.22 app01\n10.0.0.23 db01\n', '644', 'root'],
  '/etc/passwd': ['root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:Lab User:/home/user:/bin/bash\ndeploy:x:1001:1001:Deploy User:/home/deploy:/bin/bash\nwww-data:x:33:33:Web Server:/var/www:/usr/sbin/nologin\n', '644', 'root'],
  '/etc/group': ['root:x:0:\nusers:x:1000:user\nsudo:x:27:user\nwww-data:x:33:\n', '644', 'root'],
  '/etc/fstab': ['# device  mountpoint  type  options\n/dev/sda1 / ext4 defaults 0 1\n/dev/sda2 /home ext4 defaults 0 2\n', '644', 'root'],
  '/etc/os-release': ['NAME="Ubuntu"\nVERSION="24.04 LTS (Noble Numbat)"\nID=ubuntu\nVERSION_ID="24.04"\n', '644', 'root'],
  '/etc/sudoers': ['# Simulated lab policy\n%sudo ALL=(ALL:ALL) ALL\n', '440', 'root'],
  '/etc/ssh/sshd_config': ['# OpenSSH server configuration\nPort 22\nPermitRootLogin prohibit-password\nPasswordAuthentication no\nPubkeyAuthentication yes\n', '644', 'root'],
  '/etc/ssh/ssh_config': ['Host *\n    ServerAliveInterval 60\n    StrictHostKeyChecking ask\n', '644', 'root'],
  '/etc/nginx/sites-available/default': ['server {\n    listen 80 default_server;\n    server_name _;\n    root /var/www/html;\n    index index.html;\n}\n', '644', 'root'],
  '/etc/nginx/sites-enabled/default': ['# symlink target: /etc/nginx/sites-available/default\n', '644', 'root'],
  '/etc/systemd/system/backup.service': ['[Unit]\nDescription=Nightly backup\n\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/backup.sh\n', '644', 'root'],
  '/home/user/.bashrc': ['# ~/.bashrc\nexport EDITOR=nano\nexport PATH="$HOME/.local/bin:$PATH"\nalias ll="ls -alF"\n', '644', 'user'],
  '/home/user/Documents/README.txt': ['TEAM TSE Linux practice files\nUse these files to practise safely in the browser lab.\n', '644', 'user'],
  '/home/user/Documents/notes.txt': ['Linux notes\nReview permissions before changing shared files.\nUse absolute paths when a command is ambiguous.\n', '640', 'user'],
  '/home/user/Documents/todo.txt': ['Review file permissions\nArchive the weekly report\nCheck the web service logs\n', '644', 'user'],
  '/home/user/Documents/inventory.csv': ['name,team,role\nAsha,Platform,engineer\nNoah,Platform,admin\nMina,Web,developer\nLeo,Web,tester\n', '644', 'user'],
  '/home/user/Downloads/weekly-report.txt': ['Week 1: navigation and files\nWeek 2: administration and remote access\nStatus: ready for review\n', '644', 'user'],
  '/home/user/Downloads/incoming-notes.txt': ['Release notes are ready for review.\n', '644', 'user'],
  '/home/user/projects/website/index.html': ['<!doctype html>\n<title>TEAM TSE Lab</title>\n<h1>Welcome</h1>\n', '644', 'user'],
  '/home/user/projects/website/README.md': ['# Practice website\nA small project for Linux file and archive exercises.\n', '644', 'user'],
  '/home/user/projects/scripts/backup.sh': ['#!/bin/bash\n# Create a dated backup\necho "Backup complete"\n', '644', 'user'],
  '/home/user/projects/scripts/cleanup.sh': ['#!/bin/bash\nfind /tmp -type f -mtime +7 -delete\n', '644', 'user'],
  '/home/user/.ssh/known_hosts': ['web01 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILabHostKeyExample\n', '600', 'user'],
  '/boot/grub/grub.cfg': ['# Simulated bootloader configuration\nset default=0\nset timeout=5\n', '644', 'root'],
  '/proc/cpuinfo': ['processor : 0\nmodel name : Simulated x86_64 CPU\nprocessor : 1\nmodel name : Simulated x86_64 CPU\n', '444', 'root'],
  '/proc/meminfo': ['MemTotal:        8192000 kB\nMemFree:         3072000 kB\nMemAvailable:    6144000 kB\nSwapTotal:       2097152 kB\nSwapFree:        2097152 kB\n', '444', 'root'],
  '/proc/uptime': ['86400.00 172800.00\n', '444', 'root'],
  '/var/log/auth.log': [
    'Oct 05 08:00:01 tse-lab sshd[428]: Server listening on 0.0.0.0 port 22\nOct 05 08:12:14 tse-lab sudo: user : TTY=pts/0 ; COMMAND=/usr/bin/apt update\nOct 05 08:30:02 tse-lab sshd[512]: Accepted publickey for deploy from 10.0.0.21\nOct 05 09:01:30 tse-lab sudo: user : TTY=pts/0 ; COMMAND=/usr/bin/systemctl status nginx\nOct 05 09:12:08 tse-lab sshd[428]: Failed password for invalid user guest from 192.0.2.8\nOct 05 09:18:22 tse-lab sudo: user : TTY=pts/0 ; COMMAND=/usr/bin/chmod 755 /home/user/projects/scripts/backup.sh\nOct 05 09:41:00 tse-lab sshd[530]: Accepted publickey for user from 10.0.0.42\n',
    '640', 'root',
  ],
  '/var/log/syslog': [
    'Oct 05 08:00:00 tse-lab systemd[1]: Started Daily apt download activities.\nOct 05 08:01:05 tse-lab CRON[884]: (root) CMD (run-parts /etc/cron.daily)\nOct 05 08:12:14 tse-lab apt[1200]: Package lists updated.\nOct 05 08:25:33 tse-lab systemd[1]: Started nginx.service.\nOct 05 08:30:02 tse-lab sshd[428]: Accepted publickey for deploy.\nOct 05 08:44:51 tse-lab kernel: eth0: link becomes ready\nOct 05 09:01:30 tse-lab sudo: user : TTY=pts/0 ; COMMAND=/usr/bin/systemctl status nginx\nOct 05 09:15:00 tse-lab systemd[1]: Started cron.service.\nOct 05 09:21:47 tse-lab nginx[632]: 10.0.0.21 - - GET /health 200\nOct 05 09:28:10 tse-lab kernel: Out of memory: no processes killed\nOct 05 09:32:19 tse-lab apt[1422]: nginx is already the newest version.\nOct 05 09:41:00 tse-lab sshd[530]: Accepted publickey for user.\n',
    '640', 'root',
  ],
  '/var/log/nginx/access.log': ['10.0.0.21 - - [05/Oct/2026:09:20:01 +0000] "GET / HTTP/1.1" 200 612\n10.0.0.22 - - [05/Oct/2026:09:21:47 +0000] "GET /health HTTP/1.1" 200 18\n192.0.2.8 - - [05/Oct/2026:09:22:03 +0000] "GET /admin HTTP/1.1" 403 162\n', '644', 'www-data'],
  '/var/log/nginx/error.log': ['2026/10/05 09:23:11 [warn] 632#632: *14 upstream response is buffered to a temporary file\n', '640', 'www-data'],
  '/var/www/html/index.html': ['<!doctype html>\n<html><head><title>TEAM TSE</title></head><body><h1>It works!</h1></body></html>\n', '644', 'www-data'],
  '/var/www/html/health.txt': ['ok\n', '644', 'www-data'],
  '/usr/share/doc/bash/README': ['Bash is the default interactive shell in this simulated Ubuntu lab.\n', '644', 'root'],
  '/srv/ftp/welcome.txt': ['TEAM TSE training server.\n', '644', 'root'],
  '/tmp/session.tmp': ['temporary session cache\n', '600', 'user'],
  '/var/tmp/keep-me.tmp': ['temporary data that survives a simulated reboot\n', '600', 'user'],
  '/dev/null': ['', '666', 'root', 'device'],
  '/dev/zero': ['', '666', 'root', 'device'],
  '/bin/bash': ['[simulated executable]\n', '755', 'root'],
  '/bin/ls': ['[simulated executable]\n', '755', 'root'],
  '/usr/bin/grep': ['[simulated executable]\n', '755', 'root'],
  '/usr/bin/ssh': ['[simulated executable]\n', '755', 'root'],
  '/usr/bin/curl': ['[simulated executable]\n', '755', 'root'],
}

const defaultSystemState = () => ({
  hostname: 'tse-lab',
  currentUser: 'user',
  previousUser: 'root',
  previousCwd: '/home/user',
  environment: { HOME: '/home/user', USER: 'user', SHELL: '/bin/bash', LANG: 'C.UTF-8', EDITOR: 'nano', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' },
  users: [
    { name: 'root', uid: 0, gid: 0, home: '/root', shell: '/bin/bash', groups: ['root'] },
    { name: 'user', uid: 1000, gid: 1000, home: '/home/user', shell: '/bin/bash', groups: ['user', 'sudo'] },
    { name: 'deploy', uid: 1001, gid: 1001, home: '/home/deploy', shell: '/bin/bash', groups: ['deploy'] },
    { name: 'www-data', uid: 33, gid: 33, home: '/var/www', shell: '/usr/sbin/nologin', groups: ['www-data'] },
  ],
  packages: ['bash', 'coreutils', 'curl', 'nginx', 'openssh-client', 'openssh-server', 'sudo', 'tar'],
  packageIndexUpdated: false,
  processes: [
    { pid: 1, user: 'root', cpu: '0.0', mem: '0.2', command: '/sbin/init', state: 'running' },
    { pid: 428, user: 'root', cpu: '0.0', mem: '0.1', command: '/usr/sbin/sshd -D', state: 'running' },
    { pid: 632, user: 'www-data', cpu: '0.1', mem: '0.8', command: 'nginx: master process', state: 'running' },
    { pid: 711, user: 'www-data', cpu: '0.0', mem: '0.3', command: 'nginx: worker process', state: 'running' },
    { pid: 884, user: 'root', cpu: '0.0', mem: '0.1', command: '/usr/sbin/cron -f', state: 'running' },
    { pid: 1024, user: 'user', cpu: '0.0', mem: '0.1', command: '-bash', state: 'running' },
  ],
  archives: {},
  services: { nginx: 'active', ssh: 'active', cron: 'active' },
  remotes: {
    web01: { address: '10.0.0.21', authorizedKeys: [], files: { '/home/deploy/README.txt': 'web01 training host\n' } },
    app01: { address: '10.0.0.22', authorizedKeys: [], files: { '/home/deploy/README.txt': 'app01 training host\n' } },
    db01: { address: '10.0.0.23', authorizedKeys: [], files: { '/home/deploy/README.txt': 'db01 training host\n' } },
  },
  keys: {},
})

const clone = (value) => JSON.parse(JSON.stringify(value))
const error = (message, code = 1) => ({ stdout: '', stderr: message, code })
const ok = (stdout = '', extra = {}) => ({ stdout, stderr: '', code: 0, ...extra })

class Shell {
  constructor(snapshot = null) {
    this.root = { type: 'dir', children: {}, mode: '755', owner: 'root', group: 'root', mtime: 0 }
    this.cwd = '/home/user'
    this.history = []
    this.system = defaultSystemState()
    this._sudo = false
    this._editor = null
    if (snapshot?.root && snapshot?.system) {
      this.root = snapshot.root
      this.cwd = snapshot.cwd || '/home/user'
      this.previousCwd = snapshot.previousCwd || '/home/user'
      this.history = Array.isArray(snapshot.history) ? snapshot.history.slice(-200) : []
      this.system = snapshot.system
    } else {
      this._sudo = true
      for (const directory of BASE_DIRECTORIES) {
        const owner = directory === '/home/user' || directory.startsWith('/home/user/') ? 'user' : directory === '/home/deploy' || directory.startsWith('/home/deploy/') ? 'deploy' : 'root'
        this.makeDirectory(directory, true, owner)
      }
      for (const [path, [data, mode, owner, type]] of Object.entries(BASE_FILES)) {
        this.putFile(path, data, { mode, owner, group: owner === 'www-data' ? 'www-data' : owner })
        if (type === 'device') this.node(path).type = 'device'
      }
      this.node('/tmp').mode = '1777'
      this.node('/var/tmp').mode = '1777'
      const archivePath = '/mnt/backup/weekly-backup.tar.gz'
      this.system.archives[archivePath] = {
        '/home/user/weekly-report.txt': {
          type: 'file', data: 'Week 1: navigation and files\nWeek 2: administration and remote access\nStatus: ready for review\n',
          mode: '644', owner: 'user', group: 'user', mtime: 0,
        },
      }
      this.putFile(archivePath, '[simulated gzip tar archive]\n', { type: 'archive', mode: '644', owner: 'root' })
      this._sudo = false
    }
    this.previousCwd ||= this.cwd
  }

  exportState() {
    return { root: this.root, cwd: this.cwd, previousCwd: this.previousCwd, history: this.history.slice(-200), system: this.system }
  }

  normalize(path, base = this.cwd) {
    let value = String(path || '').replace(/^~(?=\/|$)/, this.userHome())
    if (!value) value = this.userHome()
    value = value.replace(/\$(?:HOME|\{HOME\})/g, this.userHome())
    const parts = value.startsWith('/') ? [] : base.split('/').filter(Boolean)
    for (const part of value.split('/')) {
      if (!part || part === '.') continue
      if (part === '..') parts.pop()
      else parts.push(part)
    }
    return '/' + parts.join('/')
  }

  user() { return this.system.users.find((item) => item.name === this.system.currentUser) || this.system.users[1] }
  userHome(name = this.system.currentUser) { return this.system.users.find((item) => item.name === name)?.home || '/home/' + name }
  node(path) {
    const parts = this.normalize(path).split('/').filter(Boolean)
    let current = this.root
    for (const part of parts) {
      if (current.type !== 'dir' || !current.children[part]) return null
      current = current.children[part]
    }
    return current
  }
  parent(path) { const normalized = this.normalize(path); const i = normalized.lastIndexOf('/'); return i === 0 ? '/' : normalized.slice(0, i) }
  basename(path) { return this.normalize(path).split('/').filter(Boolean).at(-1) || '/' }
  canAccess(node, bit) {
    if (!node || this._sudo || this.system.currentUser === 'root') return true
    const shift = node.owner === this.system.currentUser ? 6 : node.group === this.user().groups?.[0] ? 3 : 0
    return (parseInt(node.mode || '000', 8) >> shift & bit) === bit
  }
  requireAccess(path, bit, command) {
    const node = this.node(path)
    return node && this.canAccess(node, bit) ? null : `${command}: ${path}: Permission denied`
  }
  makeDirectory(path, recursive = false, owner = this.system.currentUser) {
    const normalized = this.normalize(path)
    if (normalized === '/') return { node: this.root, created: false }
    const parts = normalized.split('/').filter(Boolean)
    let current = this.root
    let currentPath = ''
    let created = false
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath += '/' + part
      if (!current.children[part]) {
        if (i !== parts.length - 1 && !recursive) return { error: `mkdir: cannot create directory '${normalized}': No such file or directory` }
        if (current.type !== 'dir') return { error: `mkdir: cannot create directory '${normalized}': Not a directory` }
        const permissionError = this.requireAccess(this.parent(currentPath), 3, 'mkdir')
        if (permissionError) return { error: permissionError }
        current.children[part] = { type: 'dir', children: {}, mode: '755', owner, group: owner, mtime: Date.now() }
        created = true
      } else if (current.children[part].type !== 'dir' && i < parts.length - 1) {
        return { error: `mkdir: '${currentPath}' is not a directory` }
      }
      current = current.children[part]
    }
    return { node: current, created }
  }
  putFile(path, data = '', options = {}) {
    const normalized = this.normalize(path)
    if (normalized === '/') return { error: 'Is a directory' }
    const parent = this.node(this.parent(normalized))
    if (!parent || parent.type !== 'dir') return { error: `No such directory: ${this.parent(normalized)}` }
    if (!this.canAccess(parent, 3)) return { error: `Permission denied: ${this.parent(normalized)}` }
    const name = this.basename(normalized)
    if (parent.children[name]?.type === 'dir') return { error: 'Is a directory' }
    const existing = parent.children[name]
    if (existing && !this.canAccess(existing, 2)) return { error: 'Permission denied' }
    parent.children[name] = {
      type: options.type || 'file',
      data: String(data),
      mode: options.mode || existing?.mode || '644',
      owner: options.owner || existing?.owner || this.system.currentUser,
      group: options.group || existing?.group || this.system.currentUser,
      mtime: Date.now(),
    }
    return { node: parent.children[name] }
  }
  writeFile(path, data, append = false) {
    const normalized = this.normalize(path)
    const old = this.node(normalized)
    if (old?.type === 'device' && normalized === '/dev/null') return null
    const result = this.putFile(normalized, append && old ? old.data + data : data)
    return result.error || null
  }
  readFile(path) {
    const node = this.node(path)
    if (!node) return { error: `No such file or directory: ${path}` }
    if (node.type === 'dir') return { error: `Is a directory: ${path}` }
    if (!this.canAccess(node, 4)) return { error: `Permission denied: ${path}` }
    return { data: node.type === 'device' && this.normalize(path) === '/dev/zero' ? '\0'.repeat(32) : node.data || '' }
  }
  entries(path, recursive = false, prefix = '') {
    const node = this.node(path)
    if (!node || node.type !== 'dir') return []
    const out = []
    for (const name of Object.keys(node.children).sort()) {
      const childPath = (prefix || this.normalize(path)).replace(/\/$/, '') + '/' + name
      out.push([childPath, node.children[name]])
      if (recursive && node.children[name].type === 'dir') out.push(...this.entries(childPath, true, childPath))
    }
    return out
  }
  lines(text) { return String(text).replace(/\r/g, '').split('\n').filter((line, index, all) => !(index === all.length - 1 && line === '')) }
  permissionString(node) {
    const bits = parseInt(node.mode || '644', 8)
    const chars = ['r', 'w', 'x']
    let result = node.type === 'dir' ? 'd' : node.type === 'link' ? 'l' : node.type === 'device' ? 'c' : '-'
    for (let shift of [6, 3, 0]) for (let i = 2; i >= 0; i--) result += bits >> (shift + i) & 1 ? chars[2 - i] : '-'
    return result
  }
  glob(pattern) {
    if (!/[*?]/.test(pattern)) return null
    const normalized = this.normalize(pattern)
    const regex = new RegExp('^' + normalized.split('/').map((part) => part.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]')).join('/') + '$')
    return this.entries('/').map(([path]) => path).filter((path) => regex.test(path)).sort()
  }
  tokenize(source) {
    const tokens = []
    let word = ''
    let quote = ''
    let escaped = false
    let expand = true
    const push = () => { if (word !== '') { tokens.push({ type: 'word', value: word }); word = '' } }
    for (let i = 0; i < source.length; i++) {
      const char = source[i]
      if (escaped) { word += char; escaped = false; continue }
      if (char === '\\' && quote !== "'") {
        if (quote === '"' && !['$', '"', '\\', '`', '\n'].includes(source[i + 1])) { word += char; continue }
        escaped = true
        continue
      }
      if (quote) {
        if (char === quote) { quote = ''; expand = true; continue }
        if (expand && char === '$') {
          const variable = source.slice(i).match(/^\$(?:\{([A-Za-z_][\w]*)\}|([A-Za-z_][\w]*|\?))/)
          if (variable) { word += this.variableValue(variable[1] || variable[2]); i += variable[0].length - 1; continue }
        }
        word += char
        continue
      }
      if (char === "'" || char === '"') { quote = char; expand = char === '"'; continue }
      if (char === '#' && word === '') break
      if (/\s/.test(char)) { push(); continue }
      if (char === '2' && source[i + 1] === '>' && word === '') {
        push(); i++; const append = source[i + 1] === '>'; if (append) i++
        tokens.push({ type: 'op', value: append ? '2>>' : '2>' }); continue
      }
      if (char === '>' || char === '<' || char === '|' || char === ';' || char === '&') {
        push()
        if ((char === '>' || char === '&' || char === '|') && source[i + 1] === char) { tokens.push({ type: 'op', value: char + char }); i++ }
        else tokens.push({ type: 'op', value: char })
        continue
      }
      if (char === '$') {
        const variable = source.slice(i).match(/^\$(?:\{([A-Za-z_][\w]*)\}|([A-Za-z_][\w]*|\?))/)
        if (variable) { word += this.variableValue(variable[1] || variable[2]); i += variable[0].length - 1; continue }
      }
      word += char
    }
    if (escaped) word += '\\'
    if (quote) return { error: `bash: unexpected EOF while looking for matching ${quote}` }
    push()
    return { tokens }
  }
  variableValue(name) { return name === '?' ? String(this.lastExit || 0) : this.system.environment[name] || '' }
  splitCommands(tokens) {
    const commands = [[]]
    for (const token of tokens) {
      if (token.type === 'op' && [';', '&&', '||', '&'].includes(token.value)) commands.push({ operator: token.value === '&' ? ';' : token.value, tokens: [] })
      else {
        if (!Array.isArray(commands.at(-1))) commands.at(-1).tokens.push(token)
        else commands.at(-1).push(token)
      }
    }
    return commands.map((item) => Array.isArray(item) ? { operator: ';', tokens: item } : item)
  }
  run(source, options = {}) {
    const commandText = String(source || '').trim()
    if (!commandText) return ok()
    this.history.push(commandText)
    this.history = this.history.slice(-200)
    const parsed = this.tokenize(commandText)
    if (parsed.error) return { ...error(parsed.error), display: parsed.error }
    let stdout = ''
    let stderr = ''
    let code = 0
    let effect = null
    for (const item of this.splitCommands(parsed.tokens)) {
      if ((item.operator === '&&' && code !== 0) || (item.operator === '||' && code === 0)) continue
      const result = this.runPipeline(item.tokens, options)
      stdout += result.stdout
      stderr += result.stderr
      code = result.code
      effect ||= result.effect || null
    }
    this.lastExit = code
    return { stdout, stderr, code, effect, display: [stdout.trimEnd(), stderr.trimEnd()].filter(Boolean).join('\n') }
  }
  runPipeline(tokens, options = {}) {
    const segments = [[]]
    for (const token of tokens) {
      if (token.type === 'op' && token.value === '|') segments.push([])
      else segments.at(-1).push(token)
    }
    let input = ''
    let stdout = ''
    let stderr = ''
    let code = 0
    let effect = null
    for (let index = 0; index < segments.length; index++) {
      const tokensInSegment = segments[index]
      const args = []
      let inputFile = null
      let outputFile = null
      let errorFile = null
      let appendOutput = false
      let appendError = false
      for (let i = 0; i < tokensInSegment.length; i++) {
        const token = tokensInSegment[i]
        if (token.type === 'op' && ['<', '>', '>>', '2>', '2>>'].includes(token.value)) {
          const destination = tokensInSegment[++i]
          if (!destination || destination.type !== 'word') return error('bash: syntax error near unexpected token newline')
          if (token.value === '<') inputFile = destination.value
          if (token.value === '>' || token.value === '>>') { outputFile = destination.value; appendOutput = token.value === '>>' }
          if (token.value === '2>' || token.value === '2>>') { errorFile = destination.value; appendError = token.value === '2>>' }
        } else if (token.type === 'word') args.push(token.value)
        else return error(`bash: syntax error near unexpected token '${token.value}'`)
      }
      if (!args.length) continue
      if (inputFile) {
        const result = this.readFile(inputFile)
        if (result.error) return error(`bash: ${inputFile}: ${result.error}`)
        input = result.data
      }
      const result = this.execute(args, input, options)
      let stageOut = result.stdout || ''
      let stageErr = result.stderr || ''
      code = result.code || 0
      effect ||= result.effect || null
      if (outputFile) {
        const problem = this.writeFile(outputFile, stageOut, appendOutput)
        if (problem) return error(`bash: ${outputFile}: ${problem}`)
        stageOut = ''
      }
      if (errorFile) {
        const problem = this.writeFile(errorFile, stageErr, appendError)
        if (problem) return error(`bash: ${errorFile}: ${problem}`)
        stageErr = ''
      }
      stderr += stageErr
      input = stageOut
      stdout = stageOut
    }
    return { stdout: segments.length > 1 ? input : stdout, stderr, code, effect }
  }
  expandArgs(args, command) {
    const expanded = []
    const keepPatterns = ['find', 'grep', 'sed', 'awk', 'echo', 'printf', 'apt', 'apt-get', 'apt-cache', 'ssh', 'ssh-copy-id', 'scp', 'nano']
    for (const arg of args) {
      if (arg.startsWith('~')) {
        const m = arg.match(/^~([^/]*)(.*)$/)
        const home = m[1] ? this.userHome(m[1]) : this.userHome()
        expanded.push(home + m[2])
        continue
      }
      const matches = keepPatterns.includes(command) ? null : this.glob(arg)
      if (matches) expanded.push(...matches)
      else expanded.push(arg)
    }
    return expanded
  }
  execute(rawArgs, stdin = '', options = {}) {
    const command = rawArgs[0]
    const args = this.expandArgs(rawArgs.slice(1), command)
    if (!command) return ok()
    if (command === 'sudo') return this.sudo(args, stdin, options)
    if (command === 'clear') return ok('', { effect: 'clear' })
    if (command === 'history') return ok(this.history.map((item, i) => `${String(i + 1).padStart(4)}  ${item}`).join('\n'))
    const method = this.commands[command]
    if (!method) return error(`command not found: ${command}. Try help.`)
    try { return method.call(this, args, stdin, options) || ok() }
    catch (exception) { return error(`${command}: ${exception.message || 'command failed'}`) }
  }
  sudo(args, stdin, options) {
    if (args[0] === '-l') return ok('User ' + this.system.currentUser + ' may run the following commands on tse-lab:\n    (ALL : ALL) ALL')
    if (args[0] === '-u') {
      const user = this.system.users.find((item) => item.name === args[1])
      if (!user) return error(`sudo: unknown user ${args[1]}`)
      args = args.slice(2)
      return this.asUser(user.name, () => this.execute(args, stdin, options))
    }
    if (args[0] === '--') args.shift()
    return this.asUser('root', () => this.execute(args, stdin, options))
  }
  asUser(user, callback) { const old = this.system.currentUser; this.system.currentUser = user; const result = callback(); this.system.currentUser = old; return result }
  wildFiles(root, recursive = false) { return this.entries(root, recursive).filter(([, node]) => node.type !== 'dir') }
  openEditor(path) {
    const normalized = this.normalize(path)
    const existing = this.node(normalized)
    if (existing?.type === 'dir') return error(`nano: ${normalized}: Is a directory`)
    if (existing && !this.canAccess(existing, 2)) return error(`nano: ${normalized}: Permission denied`)
    const parent = this.node(this.parent(normalized))
    if (!parent) return error(`nano: ${normalized}: No such directory`)
    if (!this.canAccess(parent, 3)) return error(`nano: ${normalized}: Permission denied`)
    this._editor = { path: normalized, data: existing?.data || '' }
    return ok(`Opening ${normalized} in the built-in editor. Save or cancel to return to the terminal.`, { effect: { type: 'editor', path: normalized, data: existing?.data || '' } })
  }
  saveEditor(data) {
    if (!this._editor) return 'No editor session is open.'
    const path = this._editor.path
    const problem = this.writeFile(path, data)
    this._editor = null
    return problem ? `nano: ${path}: ${problem}` : `Saved ${path} (${String(data).length} bytes).`
  }
  cancelEditor() { this._editor = null }
  remotePath(value) {
    const match = value.match(/^(?:([^@:/]+)@)?([^:]+):(.+)$/)
    if (!match) return null
    return { user: match[1] || 'deploy', host: match[2], path: match[3].startsWith('/') ? match[3] : this.userHome(match[1] || 'deploy') + '/' + match[3] }
  }
  processRows(args) {
    const all = args.some((arg) => /[ax]/.test(arg.replace(/^-/, '')))
    return this.system.processes.filter((proc) => proc.state === 'running' && (all || proc.user === this.system.currentUser))
  }
  lsRows(path, args) {
    const node = this.node(path)
    if (!node) return { error: `ls: cannot access '${path}': No such file or directory` }
    const flags = args.filter((arg) => arg.startsWith('-')).join('')
    const showHidden = flags.includes('a') || flags.includes('A')
    const long = flags.includes('l')
    const targets = node.type === 'dir' ? Object.keys(node.children).filter((name) => showHidden || !name.startsWith('.')).sort() : []
    if (node.type !== 'dir') return { rows: [this.listLine(this.normalize(path), node, long)] }
    if (flags.includes('t')) targets.sort((a, b) => node.children[b].mtime - node.children[a].mtime)
    if (flags.includes('r')) targets.reverse()
    const rows = targets.map((name) => this.listLine(name, node.children[name], long))
    return { rows }
  }
  listLine(name, node, long) {
    if (!long) return node.type === 'dir' ? `${name}/` : name
    const size = node.type === 'dir' ? '4096' : String((node.data || '').length)
    const date = new Date(node.mtime || 0).toISOString().slice(0, 16).replace('T', ' ')
    return `${this.permissionString(node)} 1 ${node.owner} ${node.group} ${size.padStart(6)} ${date} ${name}${node.type === 'dir' ? '/' : ''}`
  }
  setMode(node, spec) {
    if (/^[0-7]{3,4}$/.test(spec)) { node.mode = spec.slice(-3); return true }
    for (const clause of spec.split(',')) {
      const m = clause.match(/^([ugoa]*)([+=-])([rwxX]+)$/)
      if (!m) return false
      const who = m[1] || 'a'; const op = m[2]; const letters = m[3]
      let mode = parseInt(node.mode || '644', 8)
      for (const [group, shift] of [['u', 6], ['g', 3], ['o', 0]]) {
        if (!who.includes(group) && !who.includes('a')) continue
        let value = 0
        if (letters.includes('r')) value |= 4
        if (letters.includes('w')) value |= 2
        if (letters.includes('x') || (letters.includes('X') && node.type === 'dir')) value |= 1
        if (op === '+') mode |= value << shift
        if (op === '-') mode &= ~(value << shift)
        if (op === '=') { mode &= ~(7 << shift); mode |= value << shift }
      }
      node.mode = mode.toString(8).padStart(3, '0').slice(-3)
    }
    return true
  }
  commands = {
    help(args) {
      if (args[0]) return this.commands.man.call(this, args, '')
      return ok('TEAM TSE Linux Lab shell\nType man <command> for examples. This simulated machine never runs commands on your device.\n\n' + LAB_COMMANDS.join('  '))
    },
    man(args) {
      const name = args[0]
      const pages = {
        ls: 'ls [-lahtr] [PATH...]\nList files. -a shows hidden entries, -l uses long format, -t sorts by modification time, and -r reverses order.',
        cp: 'cp [-r] SOURCE DEST\nCopy a file or directory. Use -r for directories.',
        mv: 'mv SOURCE DEST\nMove or rename files and directories.',
        rm: 'rm [-r] [-f] PATH...\nRemove files. Use -r for directories. Changes are limited to the simulated lab filesystem.',
        find: 'find PATH [-type f|d] [-name GLOB] [-maxdepth N]\nSearch a directory tree. Example: find /var/log -type f -name "*.log".',
        grep: 'grep [-inrvcl] PATTERN [FILE...]\nSearch text. Common flags: -i ignore case, -n line numbers, -r recursive, -v invert, -c count, -l matching filenames.',
        chmod: 'chmod MODE FILE...\nChange permissions using octal (755, 644) or symbolic modes (+x, u=rw,go=r).',
        tar: 'tar -czf ARCHIVE.tar.gz PATH... | tar -tzf ARCHIVE.tar.gz | tar -xzf ARCHIVE.tar.gz\nCreate, list, or extract simulated gzip tar archives.',
        nano: 'nano FILE\nOpen the built-in editor. Use Save or Cancel to return to the simulated terminal.',
        ssh: 'ssh [USER@]HOST [COMMAND...]\nConnect to a simulated training host. Available hosts: web01, app01, db01.',
        scp: 'scp [-r] [-P PORT] SOURCE DEST\nCopy files between this lab and web01, app01, or db01.',
        apt: 'sudo apt update | sudo apt install PACKAGE | sudo apt remove PACKAGE | apt search TERM\nPackage operations change a simulated package database only.',
        ps: 'ps [aux]\nShow simulated running processes. Use pgrep NAME and kill PID to practise process management.',
      }
      return pages[name] ? ok(pages[name]) : error(`No manual entry for ${name || '(no command)'}`)
    },
    pwd() { return ok(this.cwd) },
    cd(args) {
      const dest = args[0] === '-' ? this.previousCwd : this.normalize(args[0] || this.userHome())
      const node = this.node(dest)
      if (!node) return error(`bash: cd: ${args[0] || '~'}: No such file or directory`)
      if (node.type !== 'dir') return error(`bash: cd: ${args[0]}: Not a directory`)
      if (!this.canAccess(node, 1)) return error(`bash: cd: ${dest}: Permission denied`)
      this.previousCwd = this.cwd; this.cwd = dest
      return ok(args[0] === '-' ? this.cwd : '')
    },
    ls(args) {
      const flags = args.filter((arg) => arg.startsWith('-'))
      const paths = args.filter((arg) => !arg.startsWith('-'))
      const targets = paths.length ? paths : ['.']
      const output = []
      for (const path of targets) {
        const result = this.lsRows(path, flags)
        if (result.error) return error(result.error)
        output.push(...result.rows)
      }
      return ok(output.join(flags.some((flag) => flag.includes('l')) ? '\n' : '  '))
    },
    tree(args) {
      const root = this.normalize(args.find((arg) => !arg.startsWith('-')) || '.')
      const node = this.node(root)
      if (!node) return error(`tree: '${root}': No such file or directory`)
      const rows = [root]
      const walk = (current, prefix, depth) => {
        if (current.type !== 'dir' || depth > 5) return
        const names = Object.keys(current.children).filter((name) => args.includes('-a') || !name.startsWith('.')).sort()
        names.forEach((name, index) => {
          const last = index === names.length - 1
          rows.push(prefix + (last ? '└── ' : '├── ') + name + (current.children[name].type === 'dir' ? '/' : ''))
          if (current.children[name].type === 'dir') walk(current.children[name], prefix + (last ? '    ' : '│   '), depth + 1)
        })
      }
      walk(node, '', 0)
      return ok(rows.join('\n'))
    },
    stat(args) {
      const node = this.node(args[0] || '.')
      if (!node) return error(`stat: cannot stat '${args[0]}': No such file or directory`)
      return ok(`  File: ${this.normalize(args[0])}\n  Size: ${(node.data || '').length}\tBlocks: 8\tIO Block: 4096\t${node.type}\nAccess: (${node.mode})\tUid: (${node.owner})\tGid: (${node.group})`)
    },
    file(args) {
      const node = this.node(args[0] || '')
      if (!node) return error(`file: ${args[0]}: cannot open: No such file or directory`)
      const description = node.type === 'dir' ? 'directory' : node.type === 'device' ? 'character special (simulated)' : node.type === 'archive' ? 'gzip compressed data (simulated tar archive)' : /<html|<!doctype/i.test(node.data || '') ? 'HTML document, UTF-8 text' : 'ASCII text'
      return ok(`${this.normalize(args[0])}: ${description}`)
    },
    touch(args) {
      if (!args.length) return error('touch: missing file operand')
      for (const path of args) {
        const node = this.node(path)
        if (node) { node.mtime = Date.now(); continue }
        const result = this.putFile(path, '')
        if (result.error) return error(`touch: cannot touch '${path}': ${result.error}`)
      }
      return ok()
    },
    mkdir(args) {
      const recursive = args.includes('-p') || args.includes('--parents')
      const paths = args.filter((arg) => !arg.startsWith('-'))
      if (!paths.length) return error('mkdir: missing operand')
      for (const path of paths) {
        const existing = this.node(path)
        if (existing) { if (recursive && existing.type === 'dir') continue; return error(`mkdir: cannot create directory '${path}': File exists`) }
        const result = this.makeDirectory(path, recursive)
        if (result.error) return error(result.error)
      }
      return ok()
    },
    cp(args) {
      const recursive = args.includes('-r') || args.includes('-R')
      const paths = args.filter((arg) => !arg.startsWith('-'))
      if (paths.length < 2) return error('cp: missing destination file operand')
      const [source, destination] = paths
      const from = this.normalize(source); const node = this.node(from)
      if (!node) return error(`cp: cannot stat '${source}': No such file or directory`)
      if (node.type === 'dir' && !recursive) return error(`cp: -r not specified; omitting directory '${source}'`)
      const destNode = this.node(destination)
      const target = destNode?.type === 'dir' ? this.normalize(destination) + '/' + this.basename(source) : this.normalize(destination)
      if (node.type === 'dir') {
        const entries = [[from, node], ...this.entries(from, true)]
        for (const [sourcePath, child] of entries) {
          const suffix = sourcePath.slice(from.length)
          if (child.type === 'dir') { const made = this.makeDirectory(target + suffix, true); if (made.error) return error(`cp: ${made.error}`) }
          else { const problem = this.writeFile(target + suffix, child.data || ''); if (problem) return error(`cp: cannot create '${target + suffix}': ${problem}`) }
        }
        return ok()
      }
      const result = this.writeFile(target, node.data || '')
      return result ? error(`cp: cannot create '${target}': ${result}`) : ok()
    },
    mv(args) {
      const paths = args.filter((arg) => !arg.startsWith('-'))
      if (paths.length < 2) return error('mv: missing destination file operand')
      const [source, destination] = paths; const from = this.normalize(source); const node = this.node(from)
      if (!node) return error(`mv: cannot stat '${source}': No such file or directory`)
      const destNode = this.node(destination)
      const target = destNode?.type === 'dir' ? this.normalize(destination) + '/' + this.basename(source) : this.normalize(destination)
      if (this.node(target)) return error(`mv: cannot move '${source}' to '${target}': File exists`)
      const sourceParent = this.node(this.parent(from)); const destinationParent = this.node(this.parent(target))
      if (!destinationParent) return error(`mv: cannot move to '${target}': No such directory`)
      const access = this.requireAccess(this.parent(from), 3, 'mv') || this.requireAccess(this.parent(target), 3, 'mv')
      if (access) return error(access)
      destinationParent.children[this.basename(target)] = node
      delete sourceParent.children[this.basename(from)]
      return ok()
    },
    rm(args) {
      const recursive = args.some((arg) => /^-[^-]*[rR]/.test(arg))
      const force = args.some((arg) => arg.startsWith('-') && arg.includes('f'))
      const paths = args.filter((arg) => !arg.startsWith('-'))
      if (!paths.length) return error('rm: missing operand')
      for (const path of paths) {
        const normalized = this.normalize(path); const node = this.node(normalized)
        if (!node) { if (force) continue; return error(`rm: cannot remove '${path}': No such file or directory`) }
        if (normalized === '/') return error('rm: refusing to remove the root directory')
        if (node.type === 'dir' && !recursive) return error(`rm: cannot remove '${path}': Is a directory`)
        const problem = this.requireAccess(this.parent(normalized), 3, 'rm')
        if (problem) return error(problem)
        delete this.node(this.parent(normalized)).children[this.basename(normalized)]
      }
      return ok()
    },
    ln(args) {
      const symbolic = args.includes('-s')
      const paths = args.filter((arg) => !arg.startsWith('-'))
      if (paths.length < 2) return error('ln: missing file operand')
      const [source, destination] = paths
      if (!this.node(source) && !symbolic) return error(`ln: failed to access '${source}': No such file or directory`)
      const target = this.normalize(destination); const parent = this.node(this.parent(target))
      if (!parent || parent.children[this.basename(target)]) return error(`ln: failed to create link '${target}'`)
      parent.children[this.basename(target)] = { type: 'link', target: this.normalize(source), data: '', mode: '777', owner: this.system.currentUser, group: this.system.currentUser, mtime: Date.now() }
      return ok()
    },
    cat(args, stdin) {
      const number = args.includes('-n') || args.includes('-b')
      const paths = args.filter((arg) => !arg.startsWith('-'))
      let data = ''
      if (!paths.length) data = stdin || ''
      else for (const path of paths) { const result = this.readFile(path); if (result.error) return error(`cat: ${path}: ${result.error}`); data += result.data }
      if (!number) return ok(data)
      return ok(this.lines(data).map((line, index) => `${String(index + 1).padStart(6)}  ${line}`).join('\n'))
    },
    head(args, stdin) { return this.commands.readEdges.call(this, args, stdin, true) },
    tail(args, stdin) { return this.commands.readEdges.call(this, args, stdin, false) },
    less(args, stdin) { return this.commands.readEdges.call(this, args, stdin, false, true) },
    more(args, stdin) { return this.commands.readEdges.call(this, args, stdin, false, true) },
    readEdges(args, stdin, first, all = false) {
      let count = all ? Number.MAX_SAFE_INTEGER : 10
      const paths = []
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-n') { count = Number(args[++i]); if (!Number.isFinite(count)) return error('head/tail: invalid line count') }
        else if (args[i].startsWith('-') && /^-\d+$/.test(args[i])) count = Number(args[i].slice(1))
        else if (!args[i].startsWith('-')) paths.push(args[i])
      }
      let data = stdin || ''
      if (paths.length) { const result = this.readFile(paths[0]); if (result.error) return error(`${first ? 'head' : 'tail'}: ${paths[0]}: ${result.error}`); data = result.data }
      const lines = this.lines(data); const selected = all ? lines : first ? lines.slice(0, count) : lines.slice(-count)
      return ok(selected.join('\n') + (selected.length && data.endsWith('\n') ? '\n' : ''))
    },
    nano(args) { if (!args[0]) return error('nano: missing file operand'); return this.openEditor(args[0]) },
    wc(args, stdin) {
      const flags = args.filter((arg) => arg.startsWith('-')).join('')
      const paths = args.filter((arg) => !arg.startsWith('-'))
      const records = []
      for (const path of paths.length ? paths : ['']) {
        let data = stdin || ''
        if (path) { const result = this.readFile(path); if (result.error) return error(`wc: ${path}: ${result.error}`); data = result.data }
        const row = []
        if (!flags || flags.includes('l')) row.push(String((data.match(/\n/g) || []).length).padStart(8))
        if (!flags || flags.includes('w')) row.push(String((data.match(/\S+/g) || []).length).padStart(8))
        if (!flags || flags.includes('c')) row.push(String(new TextEncoder().encode(data).length).padStart(8))
        records.push(row.join(' ') + (path ? ' ' + path : ''))
      }
      return ok(records.join('\n'))
    },
    grep(args, stdin) {
      const flags = args.filter((arg) => arg.startsWith('-')).join('')
      const rest = args.filter((arg) => !arg.startsWith('-'))
      if (!rest.length) return error('Usage: grep [-inrvcl] PATTERN [FILE...]')
      const pattern = rest[0]; const paths = rest.slice(1)
      let regex
      try { regex = new RegExp(flags.includes('F') ? pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : pattern, flags.includes('i') ? 'i' : '') }
      catch { return error('grep: Invalid regular expression') }
      const files = paths.length ? paths.flatMap((path) => {
        const node = this.node(path)
        if (node?.type === 'dir') return flags.includes('r') || flags.includes('R') ? this.wildFiles(path, true).map(([p]) => p) : []
        return [path]
      }) : ['']
      if (paths.length && !files.length) return error('grep: no files to search (try -r for directories)')
      const matches = []
      for (const path of files) {
        const data = path ? this.readFile(path) : { data: stdin || '' }
        if (data.error) return error(`grep: ${path}: ${data.error}`)
        this.lines(data.data).forEach((line, index) => {
          regex.lastIndex = 0
          let matched = regex.test(line)
          if (flags.includes('w')) matched = matched && new RegExp(`\\b${pattern}\\b`, flags.includes('i') ? 'i' : '').test(line)
          if (flags.includes('v')) matched = !matched
          if (matched) matches.push({ path, line, number: index + 1 })
        })
      }
      if (flags.includes('c')) return { stdout: String(paths.length > 1 ? new Set(matches.map((item) => item.path)).size : matches.length), stderr: '', code: matches.length ? 0 : 1 }
      if (flags.includes('l')) return { stdout: [...new Set(matches.map((item) => item.path))].join('\n'), stderr: '', code: matches.length ? 0 : 1 }
      const output = matches.map((item) => `${paths.length > 1 ? item.path + ':' : ''}${flags.includes('n') ? item.number + ':' : ''}${item.line}`).join('\n')
      return { stdout: output + (matches.length ? '\n' : ''), stderr: '', code: matches.length ? 0 : 1 }
    },
    sort(args, stdin) {
      const numeric = args.includes('-n'); const reverse = args.includes('-r')
      const path = args.find((arg) => !arg.startsWith('-'))
      let data = stdin || ''
      if (path) { const result = this.readFile(path); if (result.error) return error(`sort: ${path}: ${result.error}`); data = result.data }
      const lines = this.lines(data)
      lines.sort((a, b) => numeric ? Number(a) - Number(b) : a.localeCompare(b))
      if (reverse) lines.reverse()
      return ok(lines.join('\n') + (lines.length && data.endsWith('\n') ? '\n' : ''))
    },
    uniq(args, stdin) {
      const count = args.includes('-c'); const path = args.find((arg) => !arg.startsWith('-'))
      let lines = this.lines(stdin || '')
      if (path) { const result = this.readFile(path); if (result.error) return error(`uniq: ${path}: ${result.error}`); lines = this.lines(result.data) }
      const unique = []
      for (const line of lines) { const last = unique.at(-1); if (last?.line === line) last.count++; else unique.push({ line, count: 1 }) }
      return ok(unique.map((row) => count ? `${String(row.count).padStart(7)} ${row.line}` : row.line).join('\n'))
    },
    cut(args, stdin) {
      const delimiterIndex = args.indexOf('-d'); const fieldIndex = args.indexOf('-f')
      if (fieldIndex < 0 || !args[fieldIndex + 1]) return error('cut: usage: cut -d DELIMITER -f FIELDS [FILE]')
      const delimiter = delimiterIndex >= 0 ? args[delimiterIndex + 1] : '\t'
      const fields = args[fieldIndex + 1].split(',').map((value) => Number(value) - 1)
      const path = args.find((arg, index) => !arg.startsWith('-') && index !== fieldIndex + 1 && index !== delimiterIndex + 1)
      let data = stdin || ''
      if (path) { const result = this.readFile(path); if (result.error) return error(`cut: ${path}: ${result.error}`); data = result.data }
      return ok(this.lines(data).map((line) => fields.map((field) => line.split(delimiter)[field] || '').join(delimiter)).join('\n'))
    },
    tr(args, stdin) {
      if (args.length < 2) return error('tr: missing operand')
      const from = args[0]; const to = args[1]
      let output = stdin || ''
      if (args.includes('[:lower:]')) output = output.toLowerCase()
      else if (args.includes('[:upper:]')) output = output.toUpperCase()
      else for (const char of from) output = output.split(char).join(to[from.indexOf(char)] ?? to.at(-1) ?? '')
      return ok(output)
    },
    sed(args, stdin) {
      const inPlace = args.includes('-i'); const expr = args.find((arg) => arg.startsWith('s/'))
      if (!expr) return error('sed: this lab supports s/PATTERN/REPLACEMENT/[g] substitutions')
      const [, pattern, replacement = '', flags = ''] = expr.match(/^s\/((?:\\.|[^/])*)\/((?:\\.|[^/])*)\/([gip]*)$/) || []
      if (pattern === undefined) return error('sed: invalid substitution expression')
      let text = stdin || ''; const path = args.find((arg) => !arg.startsWith('-') && arg !== expr)
      if (path) { const result = this.readFile(path); if (result.error) return error(`sed: ${path}: ${result.error}`); text = result.data }
      let regex; try { regex = new RegExp(pattern, flags.includes('g') ? 'g' : '') } catch { return error('sed: invalid regular expression') }
      const output = text.replace(regex, replacement.replace(/\\\//g, '/'))
      if (inPlace) { if (!path) return error('sed: -i requires a file operand'); const problem = this.writeFile(path, output); return problem ? error(`sed: ${path}: ${problem}`) : ok() }
      return ok(output)
    },
    awk(args, stdin) {
      const program = args.find((arg) => arg.startsWith('{'))
      if (!program) return error('awk: provide a simple program such as {print $1}')
      const match = program.match(/^\{\s*print\s+(.+?)\s*\}$/)
      if (!match) return error('awk: supported form: {print $N}')
      const fields = match[1].split(',').map((value) => value.trim())
      const path = args.find((arg) => !arg.startsWith('-') && arg !== program)
      let data = stdin || ''
      if (path) { const result = this.readFile(path); if (result.error) return error(`awk: ${path}: ${result.error}`); data = result.data }
      const separatorArg = args.indexOf('-F'); const separator = separatorArg >= 0 ? args[separatorArg + 1] : /\s+/
      return ok(this.lines(data).map((line) => fields.map((field) => field === '$0' ? line : line.split(separator)[Number(field.slice(1)) - 1] || '').join(' ')).join('\n'))
    },
    tee(args, stdin) {
      const append = args.includes('-a'); const paths = args.filter((arg) => !arg.startsWith('-'))
      for (const path of paths) { const problem = this.writeFile(path, stdin || '', append); if (problem) return error(`tee: ${path}: ${problem}`) }
      return ok(stdin || '')
    },
    find(args) {
      const path = args[0] && !args[0].startsWith('-') ? args[0] : '.'
      if (!this.node(path)) return error(`find: '${path}': No such file or directory`)
      const typeAt = args.indexOf('-type'); const nameAt = args.indexOf('-name'); const maxAt = args.indexOf('-maxdepth')
      if (nameAt >= 0 && !args[nameAt + 1]) return error("find: missing argument to '-name'")
      if (typeAt >= 0 && !args[typeAt + 1]) return error("find: missing argument to '-type'")
      const type = typeAt >= 0 ? args[typeAt + 1] : ''
      const glob = nameAt >= 0 ? new RegExp('^' + args[nameAt + 1].replace(/[.+^$()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$') : null
      const maxDepth = maxAt >= 0 ? Number(args[maxAt + 1]) : Infinity
      const results = []
      const visit = (currentPath, node, depth) => {
        if ((!type || type === 'f' && node.type !== 'dir' || type === 'd' && node.type === 'dir') && (!glob || glob.test(this.basename(currentPath)))) results.push(currentPath)
        if (node.type === 'dir' && depth < maxDepth) for (const name of Object.keys(node.children).sort()) visit(currentPath.replace(/\/$/, '') + '/' + name, node.children[name], depth + 1)
      }
      visit(this.normalize(path), this.node(path), 0)
      return ok(results.join('\n'))
    },
    locate(args) {
      const pattern = args.at(-1)
      if (!pattern) return error('locate: missing search pattern')
      const needle = pattern.replace(/\*/g, '').toLowerCase()
      return ok(this.entries('/').map(([path]) => path).filter((path) => path.toLowerCase().includes(needle)).join('\n'))
    },
    chmod(args) {
      const recursive = args.includes('-R') || args.includes('-r')
      const paths = args.filter((arg) => !arg.startsWith('-'))
      if (paths.length < 2) return error('chmod: missing operand')
      const [mode, ...targets] = paths
      for (const target of targets) {
        const node = this.node(target)
        if (!node) return error(`chmod: cannot access '${target}': No such file or directory`)
        if (node.owner !== this.system.currentUser && !this._sudo && this.system.currentUser !== 'root') return error(`chmod: changing permissions of '${target}': Operation not permitted`)
        if (!this.setMode(node, mode)) return error(`chmod: invalid mode '${mode}'`)
        if (recursive && node.type === 'dir') for (const [, child] of this.entries(target, true)) this.setMode(child, mode)
      }
      return ok()
    },
    chown(args) { return this.changeOwner(args, 'owner') },
    chgrp(args) { return this.changeOwner(args, 'group') },
    changeOwner(args, which) {
      const paths = args.filter((arg) => !arg.startsWith('-'))
      if (paths.length < 2) return error(`ch${which === 'owner' ? 'own' : 'grp'}: missing operand`)
      const [identity, ...targets] = paths
      const [owner, group] = identity.split(':')
      for (const target of targets) {
        const node = this.node(target)
        if (!node) return error(`ch${which === 'owner' ? 'own' : 'grp'}: cannot access '${target}'`)
        if (!this._sudo && this.system.currentUser !== 'root') return error('Operation not permitted')
        if (which === 'owner') node.owner = owner
        node.group = group || owner
      }
      return ok()
    },
    whoami() { return ok(this.system.currentUser) },
    id(args) {
      const user = this.system.users.find((item) => item.name === (args[0] || this.system.currentUser))
      if (!user) return error(`id: '${args[0]}': no such user`)
      return ok(`uid=${user.uid}(${user.name}) gid=${user.gid}(${user.groups[0]}) groups=${user.groups.map((group) => `${group === user.groups[0] ? user.gid : group === 'sudo' ? 27 : 1000}(${group})`).join(',')}`)
    },
    groups(args) { const user = this.system.users.find((item) => item.name === (args[0] || this.system.currentUser)); return user ? ok(user.groups.join(' ')) : error(`groups: '${args[0]}': no such user`) },
    users() { return ok(this.system.users.map((item) => item.name).join(' ')) },
    who() { return ok(`${this.system.currentUser} pts/0 2026-10-05 08:00 (console)`) },
    su(args) {
      const target = args.find((arg) => !arg.startsWith('-')) || 'root'
      const user = this.system.users.find((item) => item.name === target)
      if (!user) return error(`su: user ${target} does not exist`)
      this.system.previousUser = this.system.currentUser
      this.system.previousCwd = this.cwd
      this.system.currentUser = user.name; this.system.environment.USER = user.name; this.system.environment.HOME = user.home; this.cwd = user.home
      return ok(`Switched to ${target}. Type 'exit' to return to your previous simulated user.`)
    },
    exit() {
      const target = this.system.users.find((item) => item.name === this.system.previousUser) || this.system.users[1]
      this.system.currentUser = target.name
      this.system.environment.USER = target.name
      this.system.environment.HOME = target.home
      this.cwd = this.system.previousCwd || target.home
      return ok('Returned to ' + target.name)
    },
    useradd(args) { return this.commands.addUser.call(this, args) },
    adduser(args) { return this.commands.addUser.call(this, args) },
    addUser(args) {
      if (this.system.currentUser !== 'root') return error('useradd: Permission denied (try sudo)')
      const createHome = args.includes('-m') || args[0] === '--create-home'
      const name = args.find((arg) => !arg.startsWith('-'))
      if (!name) return error('useradd: missing username')
      if (this.system.users.some((item) => item.name === name)) return error(`useradd: user '${name}' already exists`)
      const uid = Math.max(...this.system.users.map((item) => item.uid)) + 1
      this.system.users.push({ name, uid, gid: uid, home: '/home/' + name, shell: '/bin/bash', groups: [name] })
      this.writeFile('/etc/passwd', this.readFile('/etc/passwd').data + `${name}:x:${uid}:${uid}:${name}:${'/home/' + name}:/bin/bash\n`)
      this.writeFile('/etc/group', this.readFile('/etc/group').data + `${name}:x:${uid}:${name}\n`)
      if (createHome) this.makeDirectory('/home/' + name, true, name)
      return ok()
    },
    userdel(args) {
      if (this.system.currentUser !== 'root') return error('userdel: Permission denied (try sudo)')
      const removeHome = args.includes('-r'); const name = args.find((arg) => !arg.startsWith('-'))
      const user = this.system.users.find((item) => item.name === name)
      if (!user) return error(`userdel: user '${name}' does not exist`)
      if (['root', this.system.currentUser].includes(name)) return error(`userdel: cannot remove ${name}`)
      this.system.users = this.system.users.filter((item) => item.name !== name)
      this.writeFile('/etc/passwd', this.readFile('/etc/passwd').data.split('\n').filter((line) => !line.startsWith(name + ':')).join('\n'))
      this.writeFile('/etc/group', this.readFile('/etc/group').data.split('\n').filter((line) => !line.startsWith(name + ':')).join('\n'))
      if (removeHome && this.node(user.home)) delete this.node('/home').children[name]
      return ok()
    },
    usermod(args) {
      if (this.system.currentUser !== 'root') return error('usermod: Permission denied (try sudo)')
      const name = args.at(-1); const user = this.system.users.find((item) => item.name === name)
      if (!user) return error(`usermod: user '${name}' does not exist`)
      const groupAt = args.indexOf('-aG') >= 0 ? args.indexOf('-aG') : args.indexOf('-G')
      if (groupAt >= 0 && args[groupAt + 1]) {
        const groups = args[groupAt + 1].split(',')
        user.groups = [...new Set([...(args[groupAt] === '-aG' ? user.groups : []), ...groups])]
        const records = this.readFile('/etc/group').data.split('\n')
        for (const group of groups) {
          const index = records.findIndex((line) => line.startsWith(group + ':'))
          if (index >= 0) {
            const fields = records[index].split(':')
            const members = new Set((fields[3] || '').split(',').filter(Boolean))
            members.add(name)
            fields[3] = [...members].join(',')
            records[index] = fields.join(':')
          } else records.push(`${group}:x:${user.gid}:${name}`)
        }
        this.writeFile('/etc/group', records.join('\n'))
      }
      return ok()
    },
    passwd(args) {
      const name = args[0] || this.system.currentUser
      if (!this.system.users.some((item) => item.name === name)) return error(`passwd: user '${name}' does not exist`)
      return ok(`passwd: password updated successfully for ${name} (simulated)`)
    },
    ps(args) {
      const rows = this.processRows(args)
      if (args.some((arg) => arg.includes('f')) || args.includes('-ef')) return ok(['UID          PID  PPID  C STIME TTY          TIME CMD', ...rows.map((p) => `${p.user.padEnd(12)} ${String(p.pid).padStart(5)}  1     0 08:00 ?        00:00:00 ${p.command}`)].join('\n'))
      return ok(['USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND', ...rows.map((p) => `${p.user.padEnd(12)} ${String(p.pid).padStart(5)} ${p.cpu.padStart(4)} ${p.mem.padStart(4)}  8000  1200 pts/0    S    08:00   0:00 ${p.command}`)].join('\n'))
    },
    top() { return ok('top - 09:41:22 up 1 day,  2 users,  load average: 0.08, 0.04, 0.01\nTasks: 6 total, 1 running, 5 sleeping, 0 stopped, 0 zombie\n%Cpu(s):  2.0 us,  1.0 sy, 97.0 id\nMiB Mem : 8000.0 total, 6000.0 free, 1200.0 used, 800.0 buff/cache\n\n  PID USER      %CPU %MEM COMMAND\n  632 www-data   0.1  0.8 nginx\n 1024 user       0.0  0.1 bash') },
    pgrep(args) {
      const pattern = args.filter((arg) => !arg.startsWith('-')).at(-1)
      if (!pattern) return error('pgrep: missing search pattern')
      const found = this.system.processes.filter((proc) => proc.state === 'running' && (args.includes('-f') ? proc.command : proc.command.split(' ')[0].split('/').at(-1)).includes(pattern))
      return found.length ? ok(found.map((proc) => String(proc.pid)).join('\n')) : error('')
    },
    pkill(args) {
      const pattern = args.filter((arg) => !arg.startsWith('-')).at(-1)
      const found = this.system.processes.filter((proc) => proc.state === 'running' && proc.pid !== 1 && (proc.command.includes(pattern) || proc.command.split(' ').at(-1) === pattern))
      if (!found.length) return error('pkill: no matching process')
      if (this.system.currentUser !== 'root' && found.some((proc) => proc.user !== this.system.currentUser)) return error('pkill: Operation not permitted')
      found.forEach((proc) => { proc.state = 'stopped' })
      return ok()
    },
    kill(args) {
      const target = args.filter((arg) => !arg.startsWith('-')).at(-1)
      const process = this.system.processes.find((proc) => String(proc.pid) === target)
      if (!process) return error(`kill: (${target}) - No such process`)
      if (process.pid === 1) return error('kill: cannot kill process 1 in the training lab')
      if (this.system.currentUser !== 'root' && process.user !== this.system.currentUser) return error(`kill: (${target}) - Operation not permitted`)
      process.state = 'stopped'
      return ok()
    },
    jobs() { return ok('[1]+  Running                 sleep 300 &') },
    df(args) {
      const human = args.includes('-h') || args.includes('-H')
      return ok(human ? 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   18G   20G  48% /\n/dev/sda2        80G   24G   52G  32% /home\n/dev/sdb1       100G   36G   59G  38% /mnt/backup' : 'Filesystem     1K-blocks     Used Available Use% Mounted on\n/dev/sda1       41943040 18874368  20971520  48% /\n/dev/sda2       83886080 25165824  54525952  32% /home\n/dev/sdb1      104857600 37748736  61865984  38% /mnt/backup')
    },
    du(args) {
      const summary = args.includes('-s') || args.includes('-sh') || args.includes('-hs')
      const human = args.some((arg) => arg.includes('h'))
      const targets = args.filter((arg) => !arg.startsWith('-'))
      const paths = targets.length ? targets : ['.']
      return ok(paths.map((path) => {
        const node = this.node(path); if (!node) return `du: cannot access '${path}': No such file or directory`
        const entries = [[this.normalize(path), node], ...this.entries(path, true)]
        const bytes = entries.reduce((sum, [, item]) => sum + (item.data?.length || 4096), 0)
        const size = human ? (bytes > 1048576 ? (bytes / 1048576).toFixed(1) + 'M' : Math.max(4, Math.ceil(bytes / 1024)) + 'K') : String(Math.ceil(bytes / 1024))
        return `${size}\t${path}`
      }).join(summary ? '\n' : '\n'))
    },
    free(args) {
      if (args.includes('-h')) return ok('               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       1.2Gi       3.0Gi       128Mi       3.6Gi       6.0Gi\nSwap:          2.0Gi          0B       2.0Gi')
      return ok('              total        used        free      shared  buff/cache   available\nMem:        8192000     1228800     3072000      131072     3891200     6144000\nSwap:       2097152           0     2097152')
    },
    uname(args) { return ok(args.includes('-a') ? 'Linux tse-lab 6.8.0-41-generic #41-Ubuntu SMP x86_64 GNU/Linux' : args.includes('-r') ? '6.8.0-41-generic' : 'Linux') },
    hostname() { return ok(this.system.hostname) },
    hostnamectl() { return ok(` Static hostname: ${this.system.hostname}\n       Icon name: computer-vm\n         Chassis: vm\n      Machine ID: tse-lab-simulated\n Operating System: Ubuntu 24.04 LTS\n           Kernel: Linux 6.8.0-41-generic\n     Architecture: x86-64`) },
    uptime() { return ok(' 09:41:22 up 1 day,  2 users,  load average: 0.08, 0.04, 0.01') },
    lscpu() { return ok('Architecture:             x86_64\nCPU(s):                   2\nVendor ID:                GenuineIntel\nModel name:               Simulated x86_64 CPU\nThread(s) per core:       1\nCore(s) per socket:       2\nVirtualization:           VT-x') },
    lsblk() { return ok('NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0   40G  0 disk\n├─sda1   8:1    0   38G  0 part /\n└─sda2   8:2    0    2G  0 part [SWAP]\nsdb      8:16   0  100G  0 disk /mnt/backup') },
    env() { return ok(Object.entries(this.system.environment).map(([key, value]) => `${key}=${value}`).join('\n')) },
    export(args) {
      const [assignment, value] = args
      if (!assignment) return this.commands.env.call(this)
      const match = assignment.match(/^([A-Za-z_][\w]*)=(.*)$/)
      if (match) this.system.environment[match[1]] = match[2]
      else if (value !== undefined) this.system.environment[assignment] = value
      else return error('export: usage: export NAME=VALUE')
      return ok()
    },
    date() { return ok('Mon Oct  5 09:41:22 UTC 2026') },
    tar(args) { return this.commands.tarCommand.call(this, args) },
    tarCommand(args) {
      const option = args.find((arg) => arg.startsWith('-')) || ''
      const fileAt = args.findIndex((arg) => arg.startsWith('-') && arg.includes('f')); const archive = fileAt >= 0 ? args[fileAt + 1] : args.find((arg) => arg.endsWith('.tar') || arg.endsWith('.tar.gz'))
      if (!archive) return error('tar: archive name required (use -f ARCHIVE)')
      if (option.includes('c')) {
        const sources = args.filter((arg) => !arg.startsWith('-') && arg !== archive)
        if (!sources.length) return error('tar: Cowardly refusing to create an empty archive')
        const contents = {}
        for (const source of sources) {
          const node = this.node(source); if (!node) return error(`tar: ${source}: Cannot stat: No such file or directory`)
          if (node.type === 'dir') for (const [path, child] of [[this.normalize(source), node], ...this.entries(source, true)]) contents[path] = clone(child)
          else contents[this.normalize(source)] = clone(node)
        }
        this.system.archives[this.normalize(archive)] = contents
        const problem = this.putFile(archive, '[simulated tar archive]\n', { type: 'archive', mode: '644' }).error
        return problem ? error(`tar: ${problem}`) : ok()
      }
      const contents = this.system.archives[this.normalize(archive)]
      if (!contents) return error(`tar: ${archive}: Cannot open: No such file or directory`)
      if (option.includes('t')) return ok(Object.keys(contents).map((path) => path.replace(/^\//, '')).join('\n'))
      if (option.includes('x')) {
        for (const [path, node] of Object.entries(contents)) {
          if (node.type === 'dir') { const result = this.makeDirectory(path, true); if (result.error) return error(`tar: ${result.error}`) }
          else { const problem = this.writeFile(path, node.data || ''); if (problem) return error(`tar: ${path}: ${problem}`) }
        }
        return ok()
      }
      return error('tar: choose -c (create), -t (list), or -x (extract)')
    },
    apt(args) { return this.commands.aptCommand.call(this, args) },
    'apt-get'(args) { return this.commands.aptCommand.call(this, args) },
    'apt-cache'(args) { return this.commands.aptCommand.call(this, args[0] === 'search' ? args : ['search', ...args]) },
    dpkg(args) {
      if (args.includes('-l') || args.includes('--list')) return ok('Desired=Unknown/Install/Remove/Purge/Hold\n||/ Name             Version      Architecture Description\n+++-================-============-============-=======================\nii  bash             5.2.21       amd64        GNU Bourne Again SHell\nii  coreutils        9.4          amd64        GNU core utilities\nii  nginx            1.24.0       amd64        web server')
      return error('dpkg: supported command: dpkg -l')
    },
    aptCommand(args) {
      const action = args[0]; const packageName = args.filter((arg) => !arg.startsWith('-'))[1]
      const catalog = ['acl', 'apache2', 'bash', 'build-essential', 'ca-certificates', 'curl', 'git', 'htop', 'jq', 'nano', 'nginx', 'openssh-client', 'openssh-server', 'python3', 'rsync', 'tar', 'tree', 'unzip', 'vim', 'wget']
      if (['update', 'install', 'reinstall', 'remove', 'purge', 'autoremove', 'clean'].includes(action) && this.system.currentUser !== 'root') return error(`E: Permission denied: run apt ${action} with sudo`)
      if (action === 'update') { this.system.packageIndexUpdated = true; return ok('Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nReading package lists... Done\nAll package lists are up to date.') }
      if (action === 'search') { const term = args.slice(1).join(' ').toLowerCase(); return ok(catalog.filter((name) => name.includes(term)).map((name) => `${name}/noble 1.0 amd64\n  ${name} package (simulated)`).join('\n')) }
      if (action === 'show' || action === 'info') return packageName && catalog.includes(packageName) ? ok(`Package: ${packageName}\nVersion: 1.0\nArchitecture: amd64\nDescription: ${packageName} in the simulated package catalog`) : error(`E: No packages found matching ${packageName}`)
      if (action === 'list') return ok(this.system.packages.map((name) => `${name}/noble,now 1.0 amd64 [installed]`).join('\n'))
      if (action === 'install' || action === 'reinstall') {
        const packages = args.slice(1).filter((arg) => !arg.startsWith('-'))
        if (!packages.length) return error('E: No packages specified')
        const unknown = packages.find((name) => !catalog.includes(name))
        if (unknown) return error(`E: Unable to locate package ${unknown}`)
        for (const name of packages) if (!this.system.packages.includes(name)) this.system.packages.push(name)
        return ok(`Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed: ${packages.join(' ')}\nSetting up ${packages.join(', ')} ...\nDone.`)
      }
      if (action === 'remove' || action === 'purge') {
        const packages = args.slice(1).filter((arg) => !arg.startsWith('-'))
        if (!packages.length) return error('E: No packages specified')
        this.system.packages = this.system.packages.filter((name) => !packages.includes(name))
        return ok(`The following packages will be ${action}d: ${packages.join(' ')}\nDone.`)
      }
      if (action === 'autoremove' || action === 'clean') return ok('Reading package lists... Done\nDone.')
      return error('apt: use update, install, remove, search, show, or list')
    },
    systemctl(args) { return this.commands.serviceCommand.call(this, args) },
    service(args) { return this.commands.serviceCommand.call(this, [args[1], args[0]]) },
    serviceCommand(args) {
      const action = args[0]; const service = (args[1] || '').replace(/\.service$/, '')
      if (!service) return error('systemctl: missing service name')
      if (!(service in this.system.services)) this.system.services[service] = 'inactive'
      if (action === 'status') return ok(`● ${service}.service - ${service} service\n     Loaded: loaded (/lib/systemd/system/${service}.service; enabled)\n     Active: ${this.system.services[service]} (running) since Mon 2026-10-05 08:00:00 UTC\n   Main PID: ${service === 'nginx' ? 632 : 428} (${service})`)
      if (this.system.currentUser !== 'root') return error(`systemctl: Permission denied: run ${action} with sudo`)
      if (action === 'start' || action === 'restart' || action === 'reload') this.system.services[service] = 'active'
      else if (action === 'stop') this.system.services[service] = 'inactive'
      else if (action === 'enable' || action === 'disable') return ok(`Synchronizing state of ${service}.service.`)
      else return error(`systemctl: unsupported action '${action}'`)
      return ok()
    },
    ssh(args) {
      const target = args.find((arg) => arg.includes('@') || arg in this.system.remotes)
      if (!target) return error('ssh: usage: ssh [user@]host [command]')
      const [userName, host] = target.includes('@') ? target.split('@') : ['deploy', target]
      const remote = this.system.remotes[host]
      if (!remote) return error(`ssh: Could not resolve hostname ${host}: Name or service not known`)
      const key = this.system.keys[this.userHome() + '/.ssh/id_ed25519.pub']
      if (!remote.authorizedKeys.includes(key) && userName !== 'user') return error(`Permission denied (publickey) for ${userName}@${host}`)
      const commandAt = args.indexOf(target) + 1; const remoteCommand = args.slice(commandAt).join(' ')
      if (remoteCommand) return ok(`${userName}@${host}: ${remoteCommand}\n(simulated remote command completed)`)
      return ok(`Welcome to ${host} (${remote.address}).\nLast login: Mon Oct  5 08:30:02 2026 from 10.0.0.10\n${userName}@${host}:~$`)
    },
    'ssh-keygen'(args) {
      const typeAt = args.indexOf('-t'); const fileAt = args.indexOf('-f')
      const type = typeAt >= 0 ? args[typeAt + 1] : 'ed25519'
      const path = this.normalize(fileAt >= 0 ? args[fileAt + 1] : '~/.ssh/id_' + type)
      if (this.node(path)) return ok(`Key pair already exists at ${path}; keeping the existing simulated key.`)
      const made = this.makeDirectory(this.parent(path), true)
      if (made.error) return error(made.error)
      const pub = `ssh-${type} AAAAC3NzaC1lZDI1NTE5AAAAI${this.system.currentUser}TSELabKey ${this.system.currentUser}@tse-lab`
      this.system.keys[path + '.pub'] = pub
      const first = this.putFile(path, 'SIMULATED PRIVATE KEY - not a real credential\n', { mode: '600' })
      const second = this.putFile(path + '.pub', pub + '\n', { mode: '644' })
      if (first.error || second.error) return error('ssh-keygen: could not write key files')
      return ok(`Generating public/private ${type} key pair.\nYour identification has been saved in ${path}\nYour public key has been saved in ${path}.pub`)
    },
    'ssh-copy-id'(args) {
      const target = args.filter((arg) => !arg.startsWith('-')).at(-1)
      if (!target?.includes('@')) return error('ssh-copy-id: usage: ssh-copy-id user@host')
      const [userName, host] = target.split('@'); const remote = this.system.remotes[host]
      if (!remote) return error(`ssh: Could not resolve hostname ${host}`)
      const keyPathAt = args.indexOf('-i'); const keyPath = this.normalize(keyPathAt >= 0 ? args[keyPathAt + 1] : '~/.ssh/id_ed25519.pub')
      const key = this.system.keys[keyPath] || this.node(keyPath)?.data?.trim()
      if (!key) return error(`ssh-copy-id: ${keyPath}: No such public key`)
      remote.authorizedKeys.push(key)
      return ok(`Number of key(s) added: 1\nNow try logging into the machine, with: ssh ${userName}@${host}`)
    },
    scp(args) {
      const recursive = args.includes('-r') || args.includes('-R')
      let port = '22'
      const paths = []
      for (let index = 0; index < args.length; index++) {
        if (args[index] === '-P') { port = args[++index] || '22'; continue }
        if (/^-P\d+$/.test(args[index])) { port = args[index].slice(2); continue }
        if (args[index].startsWith('-')) continue
        paths.push(args[index])
      }
      if (paths.length < 2) return error('usage: scp [-r] [-P port] source target')
      const [source, destination] = paths; const remoteSource = this.remotePath(source); const remoteDestination = this.remotePath(destination)
      if (remoteSource && remoteDestination) return error('scp: remote-to-remote copy is not supported in this lab')
      if (!remoteSource && !remoteDestination) {
        const copy = this.commands.cp.call(this, [recursive ? '-r' : '', source, destination].filter(Boolean))
        return copy.code ? copy : ok(`Copied ${source} to ${destination} (simulated, port ${port}).`)
      }
      const remoteInfo = remoteSource || remoteDestination
      const remote = this.system.remotes[remoteInfo.host]
      if (!remote) return error(`ssh: Could not resolve hostname ${remoteInfo.host}`)
      if (remoteSource) {
        const data = remote.files[remoteSource.path]
        if (data === undefined) return error(`scp: ${source}: No such file or directory`)
        const problem = this.writeFile(destination, data)
        return problem ? error(`scp: ${destination}: ${problem}`) : ok(`${source} -> ${destination} (simulated, port ${port})`)
      }
      const sourceNode = this.node(source)
      if (!sourceNode) return error(`scp: ${source}: No such file or directory`)
      if (sourceNode.type === 'dir' && !recursive) return error(`scp: ${source}: not a regular file (use -r)`)
      const destPath = remoteDestination.path.endsWith('/') ? remoteDestination.path + this.basename(source) : remoteDestination.path
      remote.files[destPath] = sourceNode.data || ''
      if (sourceNode.type === 'dir' && recursive) for (const [path, node] of this.entries(source, true)) remote.files[destPath + path.slice(this.normalize(source).length)] = node.data || ''
      return ok(`${source} -> ${remoteDestination.user}@${remoteDestination.host}:${destPath} (simulated, port ${port})`)
    },
    ping(args) {
      const host = args.find((arg) => !arg.startsWith('-'))
      const remote = this.system.remotes[host]
      if (!remote) return error(`ping: ${host || '(missing host)'}: Name or service not known`)
      return ok(`PING ${host} (${remote.address}) 56(84) bytes of data.\n64 bytes from ${host} (${remote.address}): icmp_seq=1 ttl=64 time=0.42 ms\n64 bytes from ${host} (${remote.address}): icmp_seq=2 ttl=64 time=0.39 ms\n--- ${host} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`)
    },
    ip(args) {
      if (args[0] === 'route') return ok('default via 10.0.0.1 dev eth0 proto dhcp\n10.0.0.0/24 dev eth0 proto kernel scope link src 10.0.0.10')
      if (args[0] === 'addr' || args[0] === 'a') return ok('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet 10.0.0.10/24 brd 10.0.0.255 scope global eth0')
      return error('ip: try addr or route')
    },
    curl(args) {
      const url = args.find((arg) => /^https?:/.test(arg))
      if (!url) return error('curl: try a simulated http://web01/ URL')
      const host = new URL(url).hostname
      if (!this.system.remotes[host]) return error(`curl: (6) Could not resolve host: ${host}`)
      if (url.includes('/health')) return ok('ok')
      if (url.endsWith('/')) return ok('<!doctype html>\n<html><head><title>TEAM TSE</title></head><body><h1>It works!</h1></body></html>')
      return error('curl: (22) The requested URL returned error: 404')
    },
    which(args) { const command = args[0]; return LAB_COMMANDS.includes(command) ? ok('/usr/bin/' + command) : error(`${command}: not found`) },
    type(args) { return args[0] && LAB_COMMANDS.includes(args[0]) ? ok(`${args[0]} is a simulated shell command`) : error(`type: ${args[0]}: not found`) },
    history() { return ok(this.history.map((item, i) => `${String(i + 1).padStart(4)}  ${item}`).join('\n')) },
    clear() { return ok('', { effect: 'clear' }) },
    echo(args) { const noNewline = args[0] === '-n'; if (noNewline) args.shift(); const text = args.join(' ').replace(/\\n/g, '\n').replace(/\\t/g, '\t'); return ok(text + (noNewline ? '' : '\n')) },
    printf(args) {
      if (!args.length) return ok()
      const format = args.shift().replace(/\\([\\nrt])/g, (_, code) => ({ '\\': '\\', n: '\n', r: '\r', t: '\t' })[code]).replace(/%%/g, '\uE000')
      let index = 0
      const output = format.replace(/%[-+0-9.]*[sdif]/g, (token) => {
        const value = args[index++] ?? ''
        return token.endsWith('d') || token.endsWith('i') || token.endsWith('f') ? String(Number(value)) : String(value)
      }).split('\uE000').join('%')
      return ok(output)
    },
    true() { return ok() },
    false() { return { stdout: '', stderr: '', code: 1 } },
    sleep(args) { return ok(`sleep: simulated ${args[0] || 1} second(s); no real wait performed`) },
    basename(args) { return ok(this.basename(args[0] || '.')) },
    dirname(args) { return ok(this.parent(args[0] || '.')) },
    realpath(args) { const path = this.normalize(args[0] || '.'); return this.node(path) ? ok(path) : error(`realpath: ${args[0]}: No such file or directory`) },
    readlink(args) { const node = this.node(args.at(-1)); return node?.type === 'link' ? ok(node.target) : error(`readlink: ${args.at(-1)}: Invalid argument`) },
  }
}

if (typeof window !== 'undefined') window.LinuxLabEngine = { Shell, LAB_COMMANDS, BASE_DIRECTORIES, BASE_FILES }

export { Shell, LAB_COMMANDS, BASE_DIRECTORIES, BASE_FILES }
