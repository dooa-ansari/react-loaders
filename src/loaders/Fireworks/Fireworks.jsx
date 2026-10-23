import { useEffect, useRef, useState } from 'react'
import { createShow } from './fireworks-engine'
import './Fireworks.css'

const MORPH_MS = 400 // button squeezes into a glowing spark

/**
 * A button that launches a fireworks show, then reveals `children`.
 * `children` can be a node or a function `(reset) => node`.
 */
export default function Fireworks({ label = 'Start', shells = 5, dark = false, onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → charging → show → done
  const canvasRef = useRef(null)

  useEffect(() => {
    if (phase === 'charging') {
      const t = setTimeout(() => setPhase('show'), MORPH_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'show') {
      return createShow(canvasRef.current, { shells, dark, onEnd: () => setPhase('done') })
    }
    if (phase === 'done') onComplete?.()
  }, [phase, shells, dark]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'done') {
    const reset = () => setPhase('idle')
    return <div className="fw-result">{typeof children === 'function' ? children(reset) : children}</div>
  }

  return (
    <div className={`fw fw--${phase}`}>
      <button className="fw__btn" onClick={() => setPhase('charging')} disabled={phase !== 'idle'}>
        <span className="fw__label">{label}</span>
      </button>
      {phase === 'show' && <canvas ref={canvasRef} className="fw__sky" aria-hidden="true" />}
    </div>
  )
}
