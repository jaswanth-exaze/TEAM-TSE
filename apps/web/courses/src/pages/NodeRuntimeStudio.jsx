import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './NodeRuntimeStudio.css'

const ROLES = [
  { id: 'employee', name: 'Dev Patel', title: 'Employee', department: 'Engineering', employeeId: 'E-101' },
  { id: 'hr', name: 'Rhea Kapoor', title: 'HR Officer', department: 'People Operations', employeeId: 'E-121' },
  { id: 'manager', name: 'Vikram Rao', title: 'Engineering Manager', department: 'Engineering', employeeId: 'E-110' },
  { id: 'payroll', name: 'Anita Menon', title: 'Payroll Specialist', department: 'Finance', employeeId: 'E-130' },
  { id: 'admin', name: 'Noor Khan', title: 'System Administrator', department: 'IT Operations', employeeId: 'E-140' },
  { id: 'guest', name: 'Signed out', title: 'Guest session', department: 'No active session', employeeId: null },
]

const ACTIONS = [
  { id: 'employees', label: 'View employee records', method: 'GET', path: '/api/employees', category: 'Employee directory', allowed: ['hr', 'manager', 'admin'], module: 'Employee Service' },
  { id: 'addEmployee', label: 'Add a new employee', method: 'POST', path: '/api/employees', category: 'Onboarding', allowed: ['hr', 'admin'], module: 'Employee Service', body: true },
  { id: 'myProfile', label: 'View my employee profile', method: 'GET', path: '/api/employees/me', category: 'My profile', allowed: ['employee', 'hr', 'manager', 'payroll', 'admin'], module: 'Employee Service' },
  { id: 'departments', label: 'List departments', method: 'GET', path: '/api/departments', category: 'Organization', allowed: ['employee', 'hr', 'manager', 'payroll', 'admin'], module: 'Directory Service' },
  { id: 'myAttendance', label: 'View my attendance', method: 'GET', path: '/api/attendance/me', category: 'My attendance', allowed: ['employee', 'hr', 'manager', 'payroll', 'admin'], module: 'Attendance Service' },
  { id: 'teamAttendance', label: 'View department attendance', method: 'GET', path: '/api/attendance?scope=department', category: 'Team attendance', allowed: ['hr', 'manager', 'admin'], module: 'Attendance Service' },
  { id: 'recordAttendance', label: 'Record my attendance', method: 'POST', path: '/api/attendance', category: 'Attendance check-in', allowed: ['employee', 'hr', 'manager', 'admin'], module: 'Attendance Service' },
  { id: 'payroll', label: 'View salary records', method: 'GET', path: '/api/payroll', category: 'Payroll', allowed: ['hr', 'payroll', 'admin'], module: 'Payroll Service' },
]

const MISSIONS = [
  { id: 'onboard', title: 'Onboard a new teammate', brief: 'HR needs to add a new employee to the company directory.', actor: 'hr', action: 'addEmployee', result: 201, reward: 120, hint: 'Use the HR account and send POST /api/employees.' },
  { id: 'attendance', title: 'Check your attendance', brief: 'An employee opens their own attendance record for the week.', actor: 'employee', action: 'myAttendance', result: 200, reward: 120, hint: 'Use the Employee account and request your own attendance.' },
  { id: 'team', title: 'Review the team', brief: 'A manager checks attendance for their department.', actor: 'manager', action: 'teamAttendance', result: 200, reward: 120, hint: 'Managers can see their own department. HR and Admin can see all.' },
  { id: 'privacy', title: 'Stop a payroll data leak', brief: 'An employee attempts to open confidential salary records. RBAC must deny access.', actor: 'employee', action: 'payroll', result: 403, reward: 180, hint: 'Keep the Employee role, request salary records, and confirm the RBAC middleware blocks it.' },
]

const INITIAL_EMPLOYEES = [
  { id: 'E-101', name: 'Dev Patel', jobTitle: 'Frontend Engineer', department: 'Engineering', email: 'dev.patel@northstar.example' },
  { id: 'E-110', name: 'Vikram Rao', jobTitle: 'Engineering Manager', department: 'Engineering', email: 'vikram.rao@northstar.example' },
  { id: 'E-121', name: 'Rhea Kapoor', jobTitle: 'HR Officer', department: 'People Operations', email: 'rhea.kapoor@northstar.example' },
  { id: 'E-130', name: 'Anita Menon', jobTitle: 'Payroll Specialist', department: 'Finance', email: 'anita.menon@northstar.example' },
  { id: 'E-140', name: 'Noor Khan', jobTitle: 'System Administrator', department: 'IT Operations', email: 'noor.khan@northstar.example' },
]

const INITIAL_ATTENDANCE = [
  { id: 'A-2031', employeeId: 'E-101', name: 'Dev Patel', department: 'Engineering', date: 'Today', clockIn: '09:02', status: 'Present' },
  { id: 'A-2030', employeeId: 'E-110', name: 'Vikram Rao', department: 'Engineering', date: 'Today', clockIn: '08:48', status: 'Present' },
  { id: 'A-2029', employeeId: 'E-121', name: 'Rhea Kapoor', department: 'People Operations', date: 'Today', clockIn: '09:14', status: 'Present' },
  { id: 'A-2028', employeeId: 'E-130', name: 'Anita Menon', department: 'Finance', date: 'Today', clockIn: '09:06', status: 'Present' },
]

const DEPARTMENTS = [
  { name: 'Engineering', lead: 'Vikram Rao', employees: 18, code: 'ENG' },
  { name: 'People Operations', lead: 'Rhea Kapoor', employees: 6, code: 'PEO' },
  { name: 'Finance', lead: 'Anita Menon', employees: 5, code: 'FIN' },
  { name: 'Product Design', lead: 'Maya Chen', employees: 9, code: 'DSN' },
]

const PAYROLL = [
  { employeeId: 'E-101', name: 'Dev Patel', department: 'Engineering', monthlySalary: '₹1,18,000' },
  { employeeId: 'E-110', name: 'Vikram Rao', department: 'Engineering', monthlySalary: '₹2,10,000' },
  { employeeId: 'E-121', name: 'Rhea Kapoor', department: 'People Operations', monthlySalary: '₹1,35,000' },
  { employeeId: 'E-130', name: 'Anita Menon', department: 'Finance', monthlySalary: '₹1,42,000' },
]

const PIPELINE = [
  { id: 'client', title: 'Client sends', short: 'Laptop' },
  { id: 'auth', title: 'Authenticate', short: 'Session' },
  { id: 'rbac', title: 'RBAC middleware', short: 'Policy gate' },
  { id: 'service', title: 'Route + service', short: 'Controller' },
  { id: 'database', title: 'Company data', short: 'Database' },
  { id: 'events', title: 'Emit event', short: 'Listeners' },
  { id: 'response', title: 'Response returns', short: 'HTTP reply' },
]

const ROLE_NAMES = Object.fromEntries(ROLES.map((role) => [role.id, role.title]))
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

function makeStage(id, title, detail, location, tone = 'normal') {
  return { id, title, detail, location, tone }
}

function simulateRequest({ role, action, employeeName, department, jobTitle, employees, attendance, nextEmployeeNumber }) {
  const request = { method: action.method, path: action.path }
  if (role.id === 'guest') {
    const response = { status: 401, label: 'Unauthorized', message: 'The request reached the server, but no signed-in session was attached.', data: null }
    return {
      request, response,
      plan: [makeStage('client', 'Request leaves the laptop', `${request.method} ${request.path}`, 18), makeStage('auth', 'Session check', 'No session token found. The request cannot continue to RBAC.', 51, 'deny'), makeStage('response', '401 sent back', 'Sign in to get an authenticated session.', 18, 'deny')],
    }
  }

  const allowed = action.allowed.includes(role.id)
  if (!allowed) {
    const requiredRoles = action.allowed.map((id) => ROLE_NAMES[id]).join(', ')
    const response = { status: 403, label: 'Forbidden', message: `${role.title} is authenticated, but the RBAC policy does not allow this action.`, data: null }
    return {
      request, response,
      plan: [makeStage('client', 'Request leaves the laptop', `${request.method} ${request.path}`, 18), makeStage('auth', 'Session verified', `${role.name} is signed in as ${role.title}.`, 51), makeStage('rbac', 'RBAC denies access', `Required roles: ${requiredRoles}. Current role: ${role.title}.`, 51, 'deny'), makeStage('response', '403 sent back', 'The service and database are skipped.', 18, 'deny')],
    }
  }

  let data = null
  let message = 'Request completed.'
  let status = 200
  let mutation = null
  const plan = [
    makeStage('client', 'Request leaves the laptop', `${request.method} ${request.path}`, 18),
    makeStage('auth', 'Session verified', `Signed in as ${role.name}.`, 51),
    makeStage('rbac', 'RBAC allows access', `${role.title} is allowed to use ${action.category}.`, 51),
    makeStage('service', `${action.module} handles request`, `Matched ${request.method} ${request.path}.`, 61),
  ]

  if (action.id === 'employees') {
    const visible = role.id === 'manager' ? employees.filter((employee) => employee.department === role.department) : employees
    data = visible
    message = role.id === 'manager' ? `Returned ${visible.length} employee records from ${role.department}.` : `Returned ${visible.length} employee records.`
  } else if (action.id === 'addEmployee') {
    if (!employeeName.trim() || !department || !jobTitle.trim()) {
      status = 400
      message = 'Name, department, and job title are required. No record was created.'
      data = { error: 'Complete all employee fields before submitting.' }
    } else {
      status = 201
      const newEmployee = { id: `E-${nextEmployeeNumber}`, name: employeeName.trim(), jobTitle: jobTitle.trim(), department, email: `${employeeName.trim().toLowerCase().replace(/\s+/g, '.')}@northstar.example` }
      data = newEmployee
      mutation = { type: 'employee', value: newEmployee, eventName: 'employee:created' }
      message = `${newEmployee.name} was added to the employee directory.`
    }
  } else if (action.id === 'myProfile') {
    data = employees.find((employee) => employee.id === role.employeeId) || { id: role.employeeId, name: role.name, jobTitle: role.title, department: role.department }
    message = 'Returned the signed-in user’s own employee profile.'
  } else if (action.id === 'departments') {
    data = DEPARTMENTS
    message = `Returned ${DEPARTMENTS.length} department records.`
  } else if (action.id === 'myAttendance') {
    data = attendance.filter((record) => record.employeeId === role.employeeId)
    message = `Returned ${data.length} attendance record${data.length === 1 ? '' : 's'} for ${role.name}.`
  } else if (action.id === 'teamAttendance') {
    data = role.id === 'manager' ? attendance.filter((record) => record.department === role.department) : attendance
    message = role.id === 'manager' ? `Returned attendance for the ${role.department} team.` : `Returned ${data.length} attendance records across the company.`
  } else if (action.id === 'recordAttendance') {
    const record = { id: `A-${2032 + attendance.length - INITIAL_ATTENDANCE.length}`, employeeId: role.employeeId, name: role.name, department: role.department, date: 'Today', clockIn: '09:21', status: 'Present' }
    data = record
    mutation = { type: 'attendance', value: record, eventName: 'attendance:recorded' }
    status = 201
    message = `Attendance recorded for ${role.name}.`
  } else if (action.id === 'payroll') {
    data = PAYROLL
    message = 'Returned confidential salary records. RBAC allowed this role.'
  }

  if (status !== 400) plan.push(makeStage('database', action.method === 'POST' ? 'Write company data' : 'Read company data', action.method === 'POST' ? 'The authorized record is saved.' : 'The service reads the records it is allowed to return.', 84))
  if (mutation) plan.push(makeStage('events', `Emit ${mutation.eventName}`, 'EventEmitter calls the audit and notification listeners in registration order.', 61))
  plan.push(makeStage('response', `${status} ${status === 201 ? 'Created' : status === 400 ? 'Bad Request' : 'OK'} returns`, 'The server sends the HTTP status and JSON response to the laptop.', 18))
  return { request, response: { status, label: status === 201 ? 'Created' : status === 400 ? 'Bad Request' : 'OK', message, data }, plan, mutation }
}

function formatValue(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function DataTable({ data, emptyMessage = 'No records returned.' }) {
  const rows = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : []
  const columns = rows.length ? Object.keys(rows[0]).filter((key) => typeof rows[0][key] !== 'object').slice(0, 5) : []
  if (!rows.length || !columns.length) return <p className="px-4 py-6 text-center text-xs text-white/45">{emptyMessage}</p>
  return <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[480px] border-collapse text-left text-xs"><thead><tr>{columns.map((column) => <th key={column} className="border-b border-white/[0.08] px-3 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-white/40">{column.replace(/[A-Z]/g, (letter) => ` ${letter}`).toLowerCase()}</th>)}</tr></thead><tbody>{rows.map((row, index) => <motion.tr key={row.id || row.employeeId || row.name || index} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }} className="border-b border-white/[0.045] last:border-0 hover:bg-white/[0.025]">{columns.map((column) => <td key={column} className={`max-w-52 truncate px-3 py-2.5 ${column.toLowerCase().includes('salary') ? 'font-semibold text-amber-100' : 'text-white/70'}`} title={formatValue(row[column])}>{formatValue(row[column])}</td>)}</motion.tr>)}</tbody></table></div>
}

function Laptop({ role, action, response, isRunning }) {
  return <div className="node-laptop-wrap" aria-label="3D client laptop">
    <div className="node-laptop">
      <div className="node-laptop-lid"><div className="node-laptop-screen">
        <div className="node-screen-top"><span className="node-screen-brand"><b>N</b> northstar</span><span className="node-screen-lock">{role.id === 'guest' ? '↪ sign in' : '● secure session'}</span></div>
        <div className="node-screen-user"><span className="node-avatar">{role.name.slice(0, 1)}</span><span><b>{role.name}</b><small>{role.title}</small></span></div>
        <div className="node-screen-request"><small>{isRunning ? 'SENDING REQUEST' : response ? `HTTP ${response.status} · ${response.label.toUpperCase()}` : 'READY TO SEND'}</small><b>{action.method} {action.path}</b></div>
        <div className="node-screen-bottom"><i className={isRunning ? 'node-pulse-dot' : ''} /> {isRunning ? 'Connecting to company server…' : response ? response.message : 'Company portal · Online'}</div>
      </div></div>
      <div className="node-laptop-base"><div className="node-laptop-trackpad" /></div>
    </div>
    <div className="node-object-caption"><span className="node-device-icon">01</span><span><b>CLIENT LAPTOP</b><small>{role.title} · Northstar portal</small></span></div>
  </div>
}

function ServerRack({ activeStage, activeModule, eventActive, denyActive, isRunning }) {
  return <div className={`node-server-wrap ${isRunning ? 'is-processing' : ''}`} aria-label="3D company API server">
    <div className="node-server-rack">
      <div className="node-rack-side" />
      <div className="node-rack-face">
        <div className="node-rack-brand"><span>N</span><div><b>NORTHSTAR</b><small>API GATEWAY · NODE.JS</small></div><i className={isRunning ? 'node-pulse-dot' : ''} /></div>
        <div className={`node-rack-unit ${activeStage === 'auth' ? 'unit-active' : ''} ${activeStage === 'auth' && denyActive ? 'auth-denied' : ''}`}><span className="rack-unit-id">01</span><div className="rack-vents" /><span className="rack-leds"><i /><i /><i /></span><small>AUTH GATE</small></div>
        <div className={`node-rack-unit ${activeStage === 'rbac' ? 'unit-active rbac-active' : ''} ${activeStage === 'rbac' && denyActive ? 'rbac-denied' : ''}`}><span className="rack-unit-id">02</span><div className="rack-vents" /><span className="rack-leds"><i /><i /><i /></span><small>RBAC MIDDLEWARE</small></div>
        <div className={`node-rack-unit ${activeModule ? 'unit-active' : ''}`}><span className="rack-unit-id">03</span><div className="rack-vents" /><span className="rack-leds"><i /><i /><i /></span><small>{activeModule || 'API SERVICES'}</small></div>
        <div className={`node-rack-unit ${eventActive ? 'unit-active event-active' : ''}`}><span className="rack-unit-id">04</span><div className="rack-vents" /><span className="rack-leds"><i /><i /><i /></span><small>EVENT BUS</small></div>
        <div className="node-rack-unit"><span className="rack-unit-id">05</span><div className="rack-vents" /><span className="rack-leds"><i /><i /><i /></span><small>LOAD BALANCER</small></div>
      </div>
    </div>
    <div className="node-object-caption"><span className="node-device-icon server-icon">02</span><span><b>COMPANY SERVER</b><small>Auth · RBAC · API services</small></span></div>
  </div>
}

function DatabaseStack({ activeStage, records }) {
  return <div className={`node-database-wrap ${activeStage === 'database' ? 'is-processing' : ''}`} aria-label="3D company database">
    <div className="node-db-stack"><div className="node-db-top"><span>SQL</span></div><div className="node-db-band db-band-one"><i /><i /><i /></div><div className="node-db-band db-band-two"><i /><i /><i /></div><div className="node-db-band db-band-three"><i /><i /><i /></div><span className="node-db-lock">▣</span></div>
    <div className="node-db-count">{records} records</div>
    <div className="node-object-caption"><span className="node-device-icon db-icon">03</span><span><b>COMPANY DATA</b><small>Employee · attendance · payroll</small></span></div>
  </div>
}

export default function NodeRuntimeStudio() {
  const reduceMotion = useReducedMotion()
  const requestRunId = useRef(0)
  const [roleId, setRoleId] = useState('hr')
  const [actionId, setActionId] = useState('addEmployee')
  const [missionIndex, setMissionIndex] = useState(0)
  const [completedMissions, setCompletedMissions] = useState([])
  const [xp, setXp] = useState(0)
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES)
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE)
  const [nextEmployeeNumber, setNextEmployeeNumber] = useState(141)
  const [employeeName, setEmployeeName] = useState('Aarav Shah')
  const [department, setDepartment] = useState('Engineering')
  const [jobTitle, setJobTitle] = useState('Backend Developer')
  const [run, setRun] = useState(null)
  const [response, setResponse] = useState(null)
  const [activity, setActivity] = useState([])
  const [rawVisible, setRawVisible] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [selectedPermission, setSelectedPermission] = useState('')

  const role = ROLES.find((item) => item.id === roleId) || ROLES[0]
  const action = ACTIONS.find((item) => item.id === actionId) || ACTIONS[0]
  const mission = MISSIONS[missionIndex]
  const missionComplete = completedMissions.includes(mission.id)
  const stage = run?.plan[run.index]
  const packetPosition = stage?.location ?? 18
  const activeStage = stage?.id === 'database' ? 'database' : stage?.id === 'events' ? 'events' : stage?.id === 'service' ? 'service' : stage?.id === 'rbac' ? 'rbac' : stage?.id === 'auth' ? 'auth' : ''

  useEffect(() => () => { requestRunId.current += 1 }, [])

  const recordCount = employees.length + attendance.length + DEPARTMENTS.length + PAYROLL.length
  const requestPreview = useMemo(() => ({
    requestLine: `${action.method} ${action.path} HTTP/1.1`,
    host: 'api.northstar.company',
    authorization: role.id === 'guest' ? 'Authorization: none' : `Authorization: Bearer ${role.id}.••••••`,
    body: action.body ? { name: employeeName, department, jobTitle } : null,
  }), [action, department, employeeName, jobTitle, role.id])

  function updateMissionControls(index) {
    const nextMission = MISSIONS[index]
    if (!nextMission) return
    setMissionIndex(index)
    setRoleId(nextMission.actor)
    setActionId(nextMission.action)
    setResponse(null)
    setRawVisible(false)
    setFeedback('')
  }

  async function sendRequest() {
    if (run) return
    const id = ++requestRunId.current
    const evaluation = simulateRequest({ role, action, employeeName, department, jobTitle, employees, attendance, nextEmployeeNumber })
    setResponse(null)
    setRawVisible(false)
    setFeedback('')
    setRun({ id, plan: evaluation.plan, index: 0, status: evaluation.response.status })
    for (let index = 1; index < evaluation.plan.length; index += 1) {
      await wait(reduceMotion ? 0 : 680)
      if (requestRunId.current !== id) return
      setRun({ id, plan: evaluation.plan, index, status: evaluation.response.status })
    }
    await wait(reduceMotion ? 0 : 520)
    if (requestRunId.current !== id) return
    if (evaluation.mutation?.type === 'employee') {
      setEmployees((current) => [...current, evaluation.mutation.value])
      setNextEmployeeNumber((current) => current + 1)
    }
    if (evaluation.mutation?.type === 'attendance') setAttendance((current) => [evaluation.mutation.value, ...current])
    setResponse({ ...evaluation.response, request: evaluation.request, actionId: action.id, actor: role.name, roleId: role.id })
    setRun(null)
    setActivity((current) => [{ id: Date.now(), method: action.method, path: action.path, status: evaluation.response.status, role: role.title, message: evaluation.response.message }, ...current].slice(0, 6))
    if (role.id === mission.actor && action.id === mission.action && evaluation.response.status === mission.result && !completedMissions.includes(mission.id)) {
      setCompletedMissions((current) => [...current, mission.id])
      setXp((current) => current + mission.reward)
      setFeedback(`Mission complete · +${mission.reward} XP`)
    } else if (role.id === mission.actor && action.id === mission.action && evaluation.response.status !== mission.result) {
      setFeedback(`Not quite yet · mission needs HTTP ${mission.result}. ${evaluation.response.message}`)
    } else {
      setFeedback(evaluation.response.status === 403 ? 'RBAC blocked this role before the protected service ran.' : evaluation.response.status >= 400 ? evaluation.response.message : 'Request finished. Compare the role, middleware decision, and returned data.')
    }
  }

  function moveToNextMission() {
    if (missionIndex < MISSIONS.length - 1) updateMissionControls(missionIndex + 1)
    else {
      setCompletedMissions([])
      setXp(0)
      updateMissionControls(0)
    }
  }

  const responseRows = response?.data
  const responseRowsCount = Array.isArray(responseRows) ? responseRows.length : responseRows ? 1 : 0

  return <main className="learning-surface node-studio node-game min-h-screen w-full px-3 py-5 sm:px-5 sm:py-8 lg:px-8 2xl:px-12">
    <div className="mx-auto max-w-[1540px]">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-white/50"><Link to="/" className="transition hover:text-white">Course library</Link><span>/</span><Link to="/course/node-js" className="transition hover:text-white">Node.js</Link><span>/</span><span className="text-white/80">Company Network Game</span></nav>

      <header className="node-game-header mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--panel-bg)] px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3"><div className="node-game-logo">N<span>↗</span></div><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-emerald-200">Northstar · Node.js training simulation</p><h1 className="mt-0.5 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">Company Network Ops</h1></div></div>
        <div className="flex flex-wrap items-center gap-2"><div className="node-xp-badge"><span>✦</span><b>{xp} XP</b><small>OPERATOR SCORE</small></div><Link to="/course/node-js" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/65 transition hover:bg-white/[0.05] hover:text-white">Course lessons ↗</Link></div>
      </header>

      <section className="node-mission-card mb-5 grid gap-4 rounded-2xl border border-amber-100/15 bg-amber-200/[0.035] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5" aria-label="Current game mission">
        <div className="flex gap-3"><div className="node-mission-emblem"><span>{missionIndex + 1}</span></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-100">Mission {missionIndex + 1} / {MISSIONS.length}</span>{missionComplete && <span className="rounded-full bg-emerald-200/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100">Completed</span>}</div><h2 className="mt-1 font-display text-lg font-bold text-white sm:text-xl">{mission.title}</h2><p className="mt-1 text-xs leading-5 text-white/60 sm:text-sm">{mission.brief}</p><p className="mt-2 text-[10px] text-amber-100/70">MISSION INTEL · {mission.hint}</p></div></div>
        <div className="flex items-center gap-3 sm:justify-end">{missionComplete ? <button type="button" onClick={moveToNextMission} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-amber-200 px-4 py-2 text-xs font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-100">{missionIndex === MISSIONS.length - 1 ? 'Restart campaign' : 'Next mission'} <span>→</span></button> : <span className="rounded-lg border border-amber-100/15 px-3 py-2 text-xs font-semibold text-amber-100">Reward · +{mission.reward} XP</span>}<div className="flex gap-1" aria-label={`${completedMissions.length} of ${MISSIONS.length} missions complete`}>{MISSIONS.map((item, index) => <span key={item.id} title={item.title} className={`h-1.5 w-5 rounded-full ${completedMissions.includes(item.id) ? 'bg-emerald-200' : index === missionIndex ? 'bg-amber-200' : 'bg-white/15'}`} />)}</div></div>
      </section>

      <section className="node-command-center mb-5 overflow-hidden rounded-2xl border border-white/10 bg-[#090f17] shadow-2xl shadow-black/20" aria-label="3D company network visualization">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-black/15 px-4 py-3 sm:px-5"><div className="flex items-center gap-2"><span className={`node-online-indicator ${run ? 'is-busy' : ''}`} /><div><p className="text-xs font-bold text-white/90">Company network · live traffic view</p><p className="mt-0.5 text-[9px] text-white/40">CLIENT → GATEWAY → RBAC → SERVICE → DATABASE → RESPONSE</p></div></div><div className="flex flex-wrap items-center gap-2"><span className="node-network-chip"><i className="outbound-chip" /> request outbound</span><span className="node-network-chip"><i className="inbound-chip" /> response inbound</span><span className="node-latency">{run ? '● PROCESSING' : response ? `HTTP ${response.status}` : '● SERVER READY'}</span></div></div>

        <div className="node-network-scene">
          <div className="node-network-grid" aria-hidden="true" />
          <div className="node-scene-glow glow-client" aria-hidden="true" /><div className="node-scene-glow glow-server" aria-hidden="true" /><div className="node-scene-glow glow-data" aria-hidden="true" />
          <svg className="node-network-lines" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true"><path className="network-line network-line-request" d="M165 205 C270 150, 360 155, 505 205 S700 235, 840 205"/><path className="network-line network-line-return" d="M840 226 C700 267, 650 260, 505 226 S300 190, 165 226"/><circle className="network-node-dot" cx="505" cy="205" r="7"/><circle className="network-node-dot data-node-dot" cx="840" cy="205" r="6"/></svg>

          <div className="node-world">
            <Laptop role={role} action={action} response={response} isRunning={Boolean(run)} />
            <ServerRack activeStage={activeStage} activeModule={run ? ['service', 'database'].includes(activeStage) ? action.module.toUpperCase() : '' : response ? action.module.toUpperCase() : ''} eventActive={activeStage === 'events'} denyActive={stage?.tone === 'deny'} isRunning={Boolean(run)} />
            <DatabaseStack activeStage={activeStage} records={recordCount} />
          </div>

          {run && <motion.div className={`node-data-packet ${stage?.id === 'response' ? 'packet-response' : 'packet-request'} ${stage?.tone === 'deny' ? 'packet-denied' : ''}`} initial={false} animate={{ left: `${packetPosition}%` }} transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}><span>{stage?.id === 'response' ? '←' : '→'}</span><b>{stage?.id === 'response' ? run.status : action.method}</b><small>{stage?.id === 'response' ? 'HTTP' : action.path.replace('/api/', '')}</small></motion.div>}

          <div className="node-scene-status scene-status-client"><span className="scene-status-index">01</span><span>{role.name}<small>{role.id === 'guest' ? 'NO SESSION TOKEN' : `SESSION · ${role.id.toUpperCase()}`}</small></span></div>
          <div className={`node-scene-status scene-status-server ${activeStage === 'rbac' ? 'gate-status-active' : ''}`}><span className={`scene-status-index ${stage?.tone === 'deny' ? 'status-deny' : ''}`}>{activeStage === 'rbac' ? 'RBAC' : '02'}</span><span>{stage?.title || 'Node.js API'}<small>{stage?.detail || 'WAITING FOR REQUEST'}</small></span></div>
          <div className="node-scene-status scene-status-db"><span className="scene-status-index">03</span><span>{stage?.id === 'database' ? 'QUERY RUNNING' : 'DATA STORE'}<small>{stage?.id === 'database' ? action.module.toUpperCase() : `${recordCount} SAMPLE RECORDS`}</small></span></div>

          <div className="node-packet-label" aria-live="polite">{run ? <><span className={stage?.tone === 'deny' ? 'label-deny' : ''}>{stage?.title}</span><small>{stage?.detail}</small></> : response ? <><span className={response.status >= 400 ? 'label-deny' : 'label-success'}>← {response.status} {response.label}</span><small>{response.message}</small></> : <><span>NETWORK IDLE</span><small>Select a role and send a request to start the mission.</small></>}</div>
        </div>

        <div className="node-pipeline-strip" aria-label="Request pipeline stages">{PIPELINE.map((item, index) => {
          const currentStep = stage?.id === item.id || (stage?.id === 'dataReturn' && item.id === 'database')
          const complete = run && run.index > 0 && run.plan.slice(0, run.index).some((planStage) => planStage.id === item.id)
          const denied = currentStep && stage?.tone === 'deny'
          return <div key={item.id} className={`node-pipeline-step ${currentStep ? 'pipeline-current' : ''} ${complete ? 'pipeline-complete' : ''} ${denied ? 'pipeline-denied' : ''}`}><span className="pipeline-number">{complete ? '✓' : `0${index + 1}`}</span><span><b>{item.title}</b><small>{item.short}</small></span>{index < PIPELINE.length - 1 && <i className="pipeline-connector" />}</div>
        })}</div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-5" aria-label="Request console">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-200">Mission control</p><h2 className="mt-1 font-display text-lg font-bold text-white">Choose who sends it</h2><p className="mt-1 text-xs leading-5 text-white/50">The same endpoint can return different results for different roles.</p></div><span className="rounded-lg border border-white/[0.08] bg-black/[0.1] px-2.5 py-1.5 font-mono text-[9px] text-white/45">API SIM · v1</span></div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/45">Signed-in identity<select value={roleId} onChange={(event) => { setRoleId(event.target.value); setResponse(null); setFeedback('') }} disabled={Boolean(run)} className="node-select mt-1.5 min-h-11 w-full rounded-lg border border-white/10 bg-black/15 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none transition focus:border-emerald-200/40 disabled:opacity-50">{ROLES.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.name}</option>)}</select><span className="mt-1 block text-[9px] normal-case tracking-normal text-white/35">{role.department} · role claims loaded from demo session</span></label>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/45">Company action<select value={actionId} onChange={(event) => { setActionId(event.target.value); setResponse(null); setFeedback('') }} disabled={Boolean(run)} className="node-select mt-1.5 min-h-11 w-full rounded-lg border border-white/10 bg-black/15 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none transition focus:border-emerald-200/40 disabled:opacity-50">{ACTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><span className="mt-1 block text-[9px] normal-case tracking-normal text-white/35">{action.category} · allowed: {action.allowed.map((id) => ROLE_NAMES[id]).join(', ')}</span></label>
          </div>

          {action.body && <div className="mt-3 grid gap-3 rounded-xl border border-white/[0.07] bg-black/[0.1] p-3 sm:grid-cols-3"><label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Employee name<input value={employeeName} onChange={(event) => { setEmployeeName(event.target.value); setResponse(null) }} disabled={Boolean(run)} className="node-input mt-1 block min-h-9 w-full rounded-md border border-white/10 bg-black/20 px-2.5 text-xs font-medium normal-case tracking-normal text-white outline-none focus:border-emerald-200/40" /></label><label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Department<select value={department} onChange={(event) => { setDepartment(event.target.value); setResponse(null) }} disabled={Boolean(run)} className="node-select mt-1 block min-h-9 w-full rounded-md border border-white/10 bg-black/20 px-2.5 text-xs font-medium normal-case tracking-normal text-white outline-none focus:border-emerald-200/40">{DEPARTMENTS.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}</select></label><label className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Job title<input value={jobTitle} onChange={(event) => { setJobTitle(event.target.value); setResponse(null) }} disabled={Boolean(run)} className="node-input mt-1 block min-h-9 w-full rounded-md border border-white/10 bg-black/20 px-2.5 text-xs font-medium normal-case tracking-normal text-white outline-none focus:border-emerald-200/40" /></label></div>}

          <div className="node-request-preview mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#080d13]"><div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2"><span className="text-[9px] font-bold uppercase tracking-[0.13em] text-white/40">Outgoing HTTP request</span><span className="text-[9px] text-emerald-100/70">TLS 1.3 · JSON</span></div><div className="space-y-1.5 p-3 font-mono text-[10px] leading-5"><p className="text-emerald-100">{requestPreview.requestLine}</p><p className="text-white/45">Host: {requestPreview.host}</p><p className={role.id === 'guest' ? 'text-rose-200' : 'text-white/45'}>{requestPreview.authorization}</p>{requestPreview.body && <pre className="mt-2 overflow-x-auto rounded-md bg-white/[0.025] p-2 text-amber-100/80">{JSON.stringify(requestPreview.body, null, 2)}</pre>}</div></div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="min-h-8 text-xs" aria-live="polite">{feedback ? <motion.p key={feedback} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className={feedback.startsWith('Mission complete') ? 'font-semibold text-emerald-100' : feedback.startsWith('Not quite') ? 'text-amber-100' : 'text-white/55'}>{feedback}</motion.p> : <p className="text-white/40">Earn XP by completing the mission objective.</p>}</div><button type="button" onClick={sendRequest} disabled={Boolean(run)} className="node-send-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-200 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-100 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-55">{run ? <><span className="node-spinner" /> Sending packet…</> : <>Send HTTP request <span aria-hidden="true">↗</span></>}</button></div>

          <div className="node-rbac-hint mt-4 rounded-xl border border-violet-200/10 bg-violet-200/[0.035] p-3"><div className="flex items-center gap-2"><span className="rbac-shield">⬡</span><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-100">RBAC middleware</p><span className="ml-auto font-mono text-[9px] text-white/35">authorize(role, action)</span></div><p className="mt-1.5 text-[10px] leading-5 text-white/50">The server checks the signed-in role against the endpoint policy <em>before</em> the service reads or writes company data.</p><button type="button" onClick={() => setSelectedPermission((value) => value === 'policies' ? '' : 'policies')} className="mt-2 text-[10px] font-semibold text-violet-100/80 transition hover:text-violet-100">{selectedPermission === 'policies' ? 'Hide policy map ↑' : 'Inspect the policy map ↓'}</button>{selectedPermission === 'policies' && <div className="mt-3 grid gap-1.5 sm:grid-cols-2">{[['Directory', 'HR · Manager (team) · Admin'], ['Add employee', 'HR · Admin'], ['Own attendance', 'All signed-in roles'], ['Team attendance', 'HR · Manager · Admin'], ['Salary records', 'HR · Payroll · Admin']].map(([name, roles]) => <div key={name} className="flex justify-between gap-2 rounded-md border border-white/[0.06] bg-black/[0.12] px-2.5 py-2 text-[9px]"><b className="text-white/65">{name}</b><span className="text-right text-white/40">{roles}</span></div>)}</div>}</div>
        </section>

        <section className="min-w-0 rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-5" aria-label="Server response and company data">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sky-200">Response monitor</p><h2 className="mt-1 font-display text-lg font-bold text-white">What came back?</h2><p className="mt-1 text-xs leading-5 text-white/50">Inspect the status code, returned records, and the server’s explanation.</p></div>{response && <span className={`node-status-code ${response.status >= 400 ? 'status-error' : response.status === 201 ? 'status-created' : 'status-ok'}`}>{response.status} <small>{response.label}</small></span>}</div>

          <div className={`node-response-box mt-4 overflow-hidden rounded-xl border ${response ? response.status >= 400 ? 'border-rose-200/20' : 'border-emerald-200/15' : 'border-white/[0.07]'} bg-black/[0.12]`} aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>{response ? <motion.div key={`${response.status}-${response.actionId}-${activity.length}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="node-response-content">
              <div className={`flex items-start gap-3 border-b px-3.5 py-3 ${response.status >= 400 ? 'border-rose-200/10 bg-rose-200/[0.035]' : 'border-emerald-200/10 bg-emerald-200/[0.025]'}`}><span className={`node-response-icon ${response.status >= 400 ? 'response-deny' : 'response-ok'}`}>{response.status >= 400 ? '!' : '✓'}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-white/90">{response.message}</p><p className="mt-1 font-mono text-[9px] text-white/40">{response.actor} · {response.actionId} · {response.request.method} {response.request.path}</p></div><button type="button" onClick={() => setRawVisible((value) => !value)} className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[9px] text-white/50 hover:bg-white/[0.05]">{rawVisible ? 'Hide JSON' : 'View JSON'}</button></div>
              {response.data ? <div className="node-response-table"><div className="flex items-center justify-between px-3.5 pt-3"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">{responseRowsCount} record{responseRowsCount === 1 ? '' : 's'} returned</p>{response.actionId === 'payroll' && <span className="rounded bg-amber-200/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-amber-100">Confidential · RBAC protected</span>}</div><DataTable data={response.data} /></div> : <div className="p-4 text-xs text-white/55">Protected data was not read. The request stopped in middleware and returned {response.status}.</div>}
              {rawVisible && <pre className="max-h-48 overflow-auto border-t border-white/[0.07] bg-black/20 p-3 font-mono text-[9px] leading-5 text-emerald-100/80">{JSON.stringify({ status: response.status, data: response.data }, null, 2)}</pre>}
            </motion.div> : <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[210px] place-items-center p-5 text-center"><div><div className="node-response-placeholder">⇄</div><p className="mt-3 text-xs font-semibold text-white/65">Waiting for a request</p><p className="mt-1 max-w-xs text-[10px] leading-5 text-white/40">Send a request from the laptop. Authorized users see records; blocked users get a 401 or 403.</p></div></motion.div>}</AnimatePresence>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-4 sm:p-5" aria-label="Recent server traffic"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-200">Server access log</p><h2 className="mt-1 font-display text-base font-bold text-white">Recent traffic</h2></div><span className="font-mono text-[9px] text-white/35">GET · POST · {activity.length} logged</span></div>
          {activity.length ? <ol className="mt-3 divide-y divide-white/[0.05]">{activity.map((entry) => <motion.li key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-[44px_minmax(0,1fr)_40px] items-center gap-2 py-2.5"><span className={`rounded px-1.5 py-1 text-center font-mono text-[8px] font-bold ${entry.status >= 400 ? 'bg-rose-200/10 text-rose-100' : 'bg-emerald-200/10 text-emerald-100'}`}>{entry.status}</span><span className="min-w-0"><span className="block truncate font-mono text-[10px] text-white/65">{entry.method} {entry.path}</span><span className="mt-0.5 block truncate text-[9px] text-white/35">role: {entry.role} · {entry.message}</span></span><span className="text-right text-[9px] text-white/35">HTTP</span></motion.li>)}</ol> : <p className="mt-3 rounded-lg border border-dashed border-white/10 p-4 text-center text-[10px] text-white/40">Traffic will appear here after the first packet is sent.</p>}
        </section>

        <section className="rounded-2xl border border-violet-200/10 bg-violet-200/[0.025] p-4 sm:p-5" aria-label="RBAC learning notes"><div className="flex items-center gap-2"><span className="rbac-shield large-shield">⬡</span><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-100">The security lesson</p><h2 className="mt-0.5 font-display text-base font-bold text-white">Authentication ≠ authorization</h2></div></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-white/[0.06] bg-black/[0.1] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-sky-100">01 · Authentication</p><p className="mt-1 text-[10px] leading-5 text-white/50">“Who are you?” The server checks the session or token first. A guest receives 401.</p></div><div className="rounded-lg border border-white/[0.06] bg-black/[0.1] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-amber-100">02 · RBAC authorization</p><p className="mt-1 text-[10px] leading-5 text-white/50">“Can your role do this?” The middleware checks policy before the service touches protected data. A signed-in but unauthorized user receives 403.</p></div></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[9px] text-white/35">Training data only · no real employee information or server requests</p><Link to="/course/node-js/topic/node-17-middleware" className="text-[10px] font-semibold text-violet-100/80 transition hover:text-violet-100">Study middleware →</Link></div></section>
      </div>

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4 text-[10px] text-white/35"><span>Game simulation · request routing, middleware, status codes, access control, and data flows</span><Link to="/course/node-js" className="font-semibold text-white/50 transition hover:text-white">Back to Node.js course →</Link></footer>
    </div>
  </main>
}
