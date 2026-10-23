import { useEffect, useRef, useState } from 'react'
import { createSky } from './star-engine'
import './ShootingStar.css'

const SPARK_MS = 380 // button collapses into a star before launching

/**
 * A button that becomes a shooting star: a meteor shower follows (swipe to fling your own),
 * a ✓ constellation draws itself, then `children` show.
 * Fills its parent (give the parent a size and `position: relative`).
 * `children` can be a node or a function `(reset) => node`.
 */
export default function ShootingStar({ label = 'Start', onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → spark → show → done
  const rootRef = useRef(null)
  const btnRef = useRef(null)
  const canvasRef = useRef(null)
  const originRef = useRef(null)

  const start = () => {
    const root = rootRef.current.getBoundingClientRect()
    const b = btnRef.current.getBoundingClientRect()
    originRef.current = { x: b.left - root.left + b.width / 2, y: b.top - root.top + b.height / 2 }
    setPhase('spark')
  }

  useEffect(() => {
    if (phase === 'spark') {
      const t = setTimeout(() => setPhase('show'), SPARK_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'done') onComplete?.()
    if (phase !== 'show') return

    const root = rootRef.current
    const sky = createSky(canvasRef.current, { origin: originRef.current, onEnd: () => setPhase('done') })
    const pos = (e) => {
      const r = root.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    // while the sky is live, swipes fling stars instead of swiping the page/slider
    const move = (e) => sky.pointerMove(...pos(e))
    const down = (e) => { e.stopPropagation(); sky.pointerDown(...pos(e)) }
    const up = (e) => { e.stopPropagation(); sky.pointerUp() }
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerdown', down)
    root.addEventListener('pointerup', up)
    root.addEventListener('pointerleave', up)
    return () => {
      sky.stop()
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerdown', down)
      root.removeEventListener('pointerup', up)
      root.removeEventListener('pointerleave', up)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = phase === 'done'
  const reset = () => setPhase('idle')

  return (
    <div ref={rootRef} className={`ss ss--${phase}`}>
      <div className="ss__stars ss__stars--a" aria-hidden="true" />
      <div className="ss__stars ss__stars--b" aria-hidden="true" />
      <div className="ss__hills" aria-hidden="true" />
      <canvas ref={canvasRef} className="ss__canvas" aria-hidden="true" />

      {!done && (
        <button ref={btnRef} className="ss__btn" onClick={start} disabled={phase !== 'idle'}>
          <span className="ss__label">{label}</span>
        </button>
      )}

      {phase === 'show' && <p className="ss__hint">✦ swipe the sky</p>}

      {done && <div className="ss-result">{typeof children === 'function' ? children(reset) : children}</div>}
    </div>
  )
}
