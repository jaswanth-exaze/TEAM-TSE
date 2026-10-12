import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import ModuleVisual from './ModuleVisual'

const FONT_SIZE = 14
const COLUMN_GAP = 22

export default function AmbientEffects({ moduleId }) {
  const layerRef = useRef(null)
  const canvasRef = useRef(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const layer = layerRef.current
    if (!layer || !window.matchMedia('(pointer: fine)').matches) return undefined

    const updatePosition = (event) => {
      layer.style.setProperty('--pointer-x', `${event.clientX}px`)
      layer.style.setProperty('--pointer-y', `${event.clientY}px`)
    }

    window.addEventListener('pointermove', updatePosition, { passive: true })
    return () => window.removeEventListener('pointermove', updatePosition)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || moduleId || reduceMotion) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    let width = 0
    let height = 0
    let previousFrame = 0
    let animationFrame
    let streams = []
    let isLightTheme = document.documentElement.dataset.theme === 'light'

    // The canvas paints its own colors, so CSS theme colors cannot reach the
    // binary rain. Watch the existing theme attribute and switch to a darker,
    // higher-contrast green when the page background is light.
    const themeObserver = new MutationObserver(() => {
      isLightTheme = document.documentElement.dataset.theme === 'light'
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const columns = Math.ceil(width / COLUMN_GAP)
      streams = Array.from({ length: columns }, (_, index) => ({
        x: index * COLUMN_GAP + Math.random() * 8,
        y: Math.random() * height - height,
        speed: 36 + Math.random() * 74,
        length: 7 + Math.floor(Math.random() * 17),
        bits: Array.from({ length: 24 }, () => (Math.random() < 0.5 ? '0' : '1')),
      }))
    }

    const draw = (timestamp) => {
      const elapsed = previousFrame ? Math.min((timestamp - previousFrame) / 1000, 0.05) : 0
      previousFrame = timestamp
      context.clearRect(0, 0, width, height)
      context.font = `${FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`
      context.textAlign = 'center'

      streams.forEach((stream) => {
        stream.y += stream.speed * elapsed
        stream.bits = stream.bits.map((bit) => Math.random() < 0.004 ? (bit === '0' ? '1' : '0') : bit)

        for (let index = 0; index < stream.length; index += 1) {
          const y = stream.y - index * FONT_SIZE
          if (y < -FONT_SIZE || y > height + FONT_SIZE) continue

          if (index === 0) {
            context.fillStyle = isLightTheme
              ? 'rgba(18, 110, 77, 0.72)'
              : 'rgba(119, 255, 198, 0.38)'
          } else {
            const progress = 1 - index / stream.length
            if (isLightTheme) {
              const opacity = 0.08 + progress * 0.16
              context.fillStyle = `rgba(20, 111, 80, ${opacity})`
            } else {
              const opacity = 0.025 + progress * 0.12
              context.fillStyle = `rgba(55, 205, 144, ${opacity})`
            }
          }
          context.fillText(stream.bits[index % stream.bits.length], stream.x, y)
        }

        if (stream.y - stream.length * FONT_SIZE > height) {
          stream.y = -Math.random() * height * 0.45 - FONT_SIZE
          stream.speed = 36 + Math.random() * 74
          stream.length = 7 + Math.floor(Math.random() * 17)
        }
      })

      animationFrame = window.requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    animationFrame = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      themeObserver.disconnect()
      context.clearRect(0, 0, width, height)
    }
  }, [moduleId, reduceMotion])

  return (
    <div ref={layerRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="pointer-spotlight absolute inset-0" />
      {moduleId ? (
        <ModuleVisual moduleId={moduleId} />
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  )
}
