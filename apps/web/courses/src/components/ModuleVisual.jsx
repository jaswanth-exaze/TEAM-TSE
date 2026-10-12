import { motion, useReducedMotion } from 'framer-motion'
import { MODULE_SCENES } from '../data/module-scenes'

export default function ModuleVisual({ moduleId }) {
  const scene = MODULE_SCENES[moduleId]
  const reduceMotion = useReducedMotion()
  if (!scene) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.25]"
    >
      <svg viewBox="0 0 1000 560" preserveAspectRatio="none" className="h-full w-full">
        <g transform="translate(42 54)" opacity="0.8">
          <rect width="350" height="66" rx="8" fill="var(--visual-node)" fillOpacity="0.82" stroke={scene.accent} strokeOpacity="0.35" />
          <circle cx="16" cy="15" r="3" fill={scene.accent} fillOpacity="0.7" />
          <circle cx="27" cy="15" r="3" fill="#ffffff" fillOpacity="0.2" />
          <text x="14" y="38" fill={scene.accent} fontFamily="ui-monospace, monospace" fontSize="11">{scene.commands[0]}</text>
          <text x="14" y="55" fill="var(--visual-caption-text)" fillOpacity="0.9" fontFamily="ui-monospace, monospace" fontSize="10">{scene.commands[1]}</text>
        </g>

        {scene.edges.map(([fromIndex, toIndex], index) => {
          const from = scene.nodes[fromIndex]
          const to = scene.nodes[toIndex]
          const duration = 3.4 + (index % 3) * 0.7
          return (
            <g key={`${from.label}-${to.label}`}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={scene.accent} strokeOpacity="0.45" strokeWidth="1.5" />
              {!reduceMotion && (
                <motion.line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={scene.accent}
                  strokeOpacity="0.8"
                  strokeWidth="1.5"
                  strokeDasharray="5 18"
                  animate={{ strokeDashoffset: [0, -46] }}
                  transition={{ duration, repeat: Infinity, ease: 'linear', delay: index * 0.35 }}
                />
              )}
              {reduceMotion ? (
                <circle cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2} r="4" fill={scene.accent} />
              ) : (
                <motion.circle
                  r="3.5"
                  fill={scene.accent}
                  initial={{ cx: from.x, cy: from.y }}
                  animate={{ cx: [from.x, to.x, from.x], cy: [from.y, to.y, from.y] }}
                  transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay: index * 0.45 }}
                />
              )}
            </g>
          )
        })}

        {scene.nodes.map((node) => (
          <g key={node.label}>
            {node.fields ? (
              <>
                <rect x={node.x - 70} y={node.y - 43} width="140" height="86" rx="7" fill="var(--visual-node)" fillOpacity="0.82" stroke={scene.accent} strokeOpacity="0.68" />
                <path d={`M ${node.x - 70} ${node.y - 18} H ${node.x + 70}`} stroke={scene.accent} strokeOpacity="0.45" />
                <text x={node.x - 57} y={node.y - 26} fill={scene.accent} fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="600">{node.label}</text>
                {node.fields.map((field, index) => (
                  <text key={field} x={node.x - 57} y={node.y + index * 16} fill="var(--visual-node-text)" fillOpacity="0.9" fontFamily="ui-monospace, monospace" fontSize="10">{field}</text>
                ))}
              </>
            ) : (
              <>
                <rect x={node.x - 63} y={node.y - 22} width="126" height="44" rx="22" fill="var(--visual-node)" fillOpacity="0.84" stroke={scene.accent} strokeOpacity="0.58" />
                <circle cx={node.x - 45} cy={node.y} r="3" fill={scene.accent} />
                <text x={node.x + 4} y={node.y + 4} textAnchor="middle" fill="var(--visual-node-text)" fillOpacity="0.94" fontFamily="ui-monospace, monospace" fontSize="11">{node.label}</text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
