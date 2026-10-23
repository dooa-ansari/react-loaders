import { useEffect, useRef, useState } from 'react'
import { createDust } from './dust-engine'
import './GlowDust.css'

/**
 * A button that dissolves into glowing, swirling dust (follows your pointer),
 * which gathers into a checkmark, then reveals `children`.
 * Fills its parent (give the parent a size and `position: relative`).
 * `children` can be a node or a function `(reset) => node`.
 */
export default function GlowDust({ label = 'Start', onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → show → done
  const rootRef = useRef(null)
  const btnRef = useRef(null)
  const canvasRef = useRef(null)
  const originRef = useRef(null)

  const start = () => {
    const root = rootRef.current.getBoundingClientRect()
    const b = btnRef.current.getBoundingClientRect()
    originRef.current = { x: b.left - root.left, y: b.top - root.top, w: b.width, h: b.height }
    setPhase('show')
  }

  useEffect(() => {
    if (phase === 'done') onComplete?.()
    if (phase !== 'show') return
    const root = rootRef.current
    const dust = createDust(canvasRef.current, { origin: originRef.current, onEnd: () => setPhase('done') })
    const move = (e) => {
      const r = root.getBoundingClientRect()
      dust.setPointer({ x: e.clientX - r.left, y: e.clientY - r.top })
    }
    const leave = () => dust.setPointer(null)
    // while the dust is live, drags stir the dust instead of swiping the page/slider
    const keep = (e) => e.stopPropagation()
    const down = (e) => { keep(e); move(e) }
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerdown', down)
    root.addEventListener('pointerup', keep)
    root.addEventListener('pointerleave', leave)
    return () => {
      dust.stop()
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerdown', down)
      root.removeEventListener('pointerup', keep)
      root.removeEventListener('pointerleave', leave)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = phase === 'done'
  const reset = () => setPhase('idle')

  return (
    <div ref={rootRef} className={`gd gd--${phase}`}>
      <div className="gd__motes" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ '--i': i, left: `${6 + i * 6.5}%`, top: `${12 + ((i * 37) % 76)}%` }} />
        ))}
      </div>

      <canvas ref={canvasRef} className="gd__canvas" aria-hidden="true" />

      {!done && (
        <button ref={btnRef} className="gd__btn" onClick={start} disabled={phase !== 'idle'}>
          <span className="gd__label">{label}</span>
        </button>
      )}

      {phase === 'show' && <p className="gd__hint">✦ move through the dust</p>}

      {done && <div className="gd-result">{typeof children === 'function' ? children(reset) : children}</div>}
    </div>
  )
}
