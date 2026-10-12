const paths = {
  database: 'M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3Zm0 0v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3',
  terminal: 'm5 7 5 5-5 5M12 17h7',
  git: 'M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0-12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0a9 9 0 0 1-9 9',
  code: 'm8 6-6 6 6 6M16 6l6 6-6 6M13 4l-2 16',
  node: 'M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 0v20',
  test: 'M9 3v5.5L4 18a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3l-5-9.5V3M9 3h6M7 15h10',
  toggle: 'M7 12a5 5 0 1 1 5 5H7a5 5 0 0 1 0-10h10a5 5 0 0 1 0 10',
  api: 'M4 17V7a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z',
  lock: 'M6 11V7a6 6 0 1 1 12 0v4M5 11h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9Z',
  coffee: 'M18 8h1a4 4 0 1 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8ZM6 1v3M10 1v3M14 1v3',
  react: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M12 3c4.5 0 9 3 9 9s-4.5 9-9 9-9-3-9-9 4.5-9 9-9Zm0 0c2.5 3 2.5 15 0 18M4.5 7.5c3-1.5 12-1.5 15 0M4.5 16.5c3 1.5 12 1.5 15 0',
  angular: 'm12 2 9 4-1.5 12L12 22l-7.5-4L3 6l9-4Zm0 3 5 12M12 5 7 17M9 13h6',
  mobile: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm5 16h.01',
  flutter: 'M14 3 4 13l4 4M14 3l6 6-10 10-4-4 8-8',
  brain: 'M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5.5A3 3 0 0 0 6 18a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Zm6 0a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5.5A3 3 0 0 1 18 18a3 3 0 0 1-3 3 3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z',
  trophy: 'M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Zm-3 0H2v2a3 3 0 0 0 3 3M17 4h3v2a3 3 0 0 1-3 3',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  arrowRight: 'M5 12h14M13 5l7 7-7 7',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5v5l3 3',
  lightbulb: 'M9 18h6m-5 3h4m-5.8-7.1A6 6 0 1 1 15.8 14c-.9.7-1.3 1.2-1.5 2h-4.6c-.2-.8-.6-1.3-1.5-2.1ZM12 2v1m8.2 3.8-.7.7M4.5 5.8l-.7-.7M21 12h-1M4 12H3',
  play: 'm8 5 12 7-12 7V5Z',
  refresh: 'M4 4v6h6M20 20v-6h-6M4.5 15a8 8 0 0 0 14.5 3.4M19.5 9A8 8 0 0 0 5 5.6',
  sun: 'M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M3 12h2m14 0h2M5.64 18.36l1.42-1.42m9.88-9.88 1.42-1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  moon: 'M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z',
}

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.8 }) {
  const d = paths[name] || paths.code
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {d.split(/(?= M)/).map((seg, i) => (
        <path key={i} d={seg} />
      ))}
    </svg>
  )
}
