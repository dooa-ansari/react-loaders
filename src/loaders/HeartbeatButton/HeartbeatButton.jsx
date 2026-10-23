import { useEffect, useId, useState } from 'react'
import './HeartbeatButton.css'

const MORPH_MS = 450 // button shrinks into a red circle
const POP_MS = 300 // circle pops into a heart
const BEAT_MS = 900 // one "lub-dub"
const BURST_MS = 700 // final beat bursts outward
const PARTICLES = 12

/**
 * A button that morphs into a beating heart, then reveals `children`.
 * `children` can be a node or a function `(reset) => node`.
 */
export default function HeartbeatButton({ label = 'Start', beats = 5, onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → morphing → beating → bursting → done
  const id = useId() // unique gradient ids so several loaders can live on one page

  useEffect(() => {
    const next = {
      morphing: ['beating', MORPH_MS],
      beating: ['bursting', POP_MS + beats * BEAT_MS],
      bursting: ['done', BURST_MS],
    }[phase]
    if (!next) return
    const t = setTimeout(() => setPhase(next[0]), next[1])
    return () => clearTimeout(t)
  }, [phase, beats])

  useEffect(() => {
    if (phase === 'done') onComplete?.()
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'done') {
    const reset = () => setPhase('idle')
    return <div className="hb-result">{typeof children === 'function' ? children(reset) : children}</div>
  }

  return (
    <div className={`hb hb--${phase}`} style={{ '--beats': beats, '--beat': `${BEAT_MS}ms` }}>
      <button className="hb__btn" onClick={() => setPhase('morphing')} disabled={phase !== 'idle'}>
        <span className="hb__label">{label}</span>
      </button>

      <span className="hb__pulse" />

      <svg className="hb__heart" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-heart`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff6b8b" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
        <path fill={`url(#${id}-heart)`} d="M12 21s-7.5-4.6-9.5-9.2C1 8.2 3.2 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.7 0 5.9 3.7 4.4 7.3C19.5 16.4 12 21 12 21z" />
        <ellipse className="hb__shine" cx="8" cy="8.5" rx="2.2" ry="1.3" transform="rotate(-35 8 8.5)" />
      </svg>

      <svg className="hb__ecg" viewBox="0 0 200 40" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-ecg`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        <polyline stroke={`url(#${id}-ecg)`} pathLength="100" points="0,20 20,20 28,6 36,34 44,12 50,20 200,20" />
      </svg>

      <span className="hb__ring" />
      {Array.from({ length: PARTICLES }, (_, i) => (
        <span key={i} className="hb__particle" style={{ '--a': `${(360 / PARTICLES) * i}deg`, '--d': `${100 + (i % 3) * 30}px` }} />
      ))}
    </div>
  )
}
