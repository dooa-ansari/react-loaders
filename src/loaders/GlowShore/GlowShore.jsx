import { useEffect, useRef, useState } from 'react'
import { createShore } from './shore-engine'
import './GlowShore.css'

const DROP_MS = 420 // button shrinks into a glowing droplet and falls in

/**
 * A button that drops into a bioluminescent sea: glowing waves break on the shore
 * (touch the water!), then a final wave flushes the screen and `children` show.
 * Fills its parent (give the parent a size and `position: relative`).
 * `children` can be a node or a function `(reset) => node`.
 */
export default function GlowShore({ label = 'Start', onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → drop → show → done
  const rootRef = useRef(null)
  const btnRef = useRef(null)
  const canvasRef = useRef(null)
  const splashRef = useRef(null)

  const start = () => {
    const root = rootRef.current.getBoundingClientRect()
    const b = btnRef.current.getBoundingClientRect()
    splashRef.current = { x: b.left - root.left + b.width / 2, y: b.top - root.top + b.height / 2 - 36 } // just past the waterline, in the sea
    setPhase('drop')
  }

  useEffect(() => {
    if (phase === 'drop') {
      const t = setTimeout(() => setPhase('show'), DROP_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'done') onComplete?.()
    if (phase !== 'show') return

    const root = rootRef.current
    const shore = createShore(canvasRef.current, { splash: splashRef.current, onEnd: () => setPhase('done') })
    const move = (e) => {
      const r = root.getBoundingClientRect()
      shore.setPointer({ x: e.clientX - r.left, y: e.clientY - r.top })
    }
    const leave = () => shore.setPointer(null)
    // while the sea is live, drags play with the water instead of swiping the page/slider
    const keep = (e) => e.stopPropagation()
    const down = (e) => { keep(e); move(e) }
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerdown', down)
    root.addEventListener('pointerup', keep)
    root.addEventListener('pointerleave', leave)
    return () => {
      shore.stop()
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerdown', down)
      root.removeEventListener('pointerup', keep)
      root.removeEventListener('pointerleave', leave)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = phase === 'done'
  const reset = () => setPhase('idle')

  return (
    <div ref={rootRef} className={`gs gs--${phase}`}>
      <div className="gs__calm" aria-hidden="true" />
      <canvas ref={canvasRef} className="gs__canvas" aria-hidden="true" />

      {!done && (
        <button ref={btnRef} className="gs__btn" onClick={start} disabled={phase !== 'idle'}>
          <span className="gs__label">{label}</span>
        </button>
      )}

      {phase === 'show' && <p className="gs__hint">✦ touch the water</p>}

      {done && <div className="gs-result">{typeof children === 'function' ? children(reset) : children}</div>}
    </div>
  )
}
