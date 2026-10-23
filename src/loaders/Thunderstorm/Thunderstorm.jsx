import { useEffect, useId, useRef, useState } from 'react'
import { createStorm } from './storm-engine'
import './Thunderstorm.css'

const GATHER_MS = 1000 // button floats up, clouds roll in, sky darkens
const STORM_MS = 5200 // rain + lightning
const CLEAR_MS = 1200 // rain eases off, clouds part, rainbow
const STRIKES = [900, 2500, 3900] // lightning, ms after the storm starts

const CLOUD = 'M20 104Q0 104 4 84Q8 62 34 66Q38 34 72 38Q90 8 130 18Q162 0 192 22Q230 14 242 44Q278 42 286 70Q300 98 272 106Z'

/**
 * A button that brews a thunderstorm, then reveals `children`.
 * Fills its parent (give the parent a size and `position: relative`).
 * `children` can be a node or a function `(reset) => node`.
 */
export default function Thunderstorm({ label = 'Start', onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → gathering → storm → clearing → done
  const stageRef = useRef(null)
  const cloudsRef = useRef(null)
  const canvasRef = useRef(null)
  const id = useId()
  const raining = phase === 'storm' || phase === 'clearing'

  useEffect(() => {
    const next = {
      gathering: ['storm', GATHER_MS],
      storm: ['clearing', STORM_MS],
      clearing: ['done', CLEAR_MS],
    }[phase]
    if (next) {
      const t = setTimeout(() => setPhase(next[0]), next[1])
      return () => clearTimeout(t)
    }
    if (phase === 'done') onComplete?.()
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // One rain engine for the whole storm + clearing.
  useEffect(() => {
    if (!raining) return
    return createStorm(canvasRef.current, {
      duration: STORM_MS + CLEAR_MS * 0.5,
      strikes: STRIKES,
      onStrike: () => {
        // clouds light up from inside + a short thunder shake
        cloudsRef.current?.animate(
          [{ filter: 'brightness(1)' }, { filter: 'brightness(2.3)', offset: 0.12 }, { filter: 'brightness(1.2)', offset: 0.25 },
           { filter: 'brightness(2)', offset: 0.38 }, { filter: 'brightness(1)' }],
          { duration: 600, easing: 'ease-out' },
        )
        stageRef.current?.animate(
          [{ transform: 'none' }, { transform: 'translate(-3px, 2px)' }, { transform: 'translate(3px, -2px)' },
           { transform: 'translate(-2px, 1px)' }, { transform: 'translate(1px, 0)' }, { transform: 'none' }],
          { duration: 380, delay: 120, easing: 'ease-out' },
        )
      },
    })
  }, [raining])

  const done = phase === 'done'
  const reset = () => setPhase('idle')

  return (
    <div className={`ts ts--${phase}`}>
      <div ref={stageRef} className="ts__stage">
        <div className="ts__dark" />
        <div className="ts__rainbow" />
        <canvas ref={canvasRef} className="ts__rain" aria-hidden="true" />

        <div ref={cloudsRef} className="ts__clouds" aria-hidden="true">
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6b7280" />
                <stop offset="100%" stopColor="#1f2937" />
              </linearGradient>
            </defs>
          </svg>
          {['a', 'b', 'c', 'd'].map((k) => (
            <svg key={k} className={`ts__cloud ts__cloud--${k}`} viewBox="0 0 300 110">
              <path d={CLOUD} fill={`url(#${id}-c)`} />
            </svg>
          ))}
        </div>

        <div className="ts__ground" />
      </div>

      {!done && (
        <button className="ts__btn" onClick={() => setPhase('gathering')} disabled={phase !== 'idle'}>
          <span className="ts__label">{label}</span>
        </button>
      )}

      {done && <div className="ts-result">{typeof children === 'function' ? children(reset) : children}</div>}
    </div>
  )
}
