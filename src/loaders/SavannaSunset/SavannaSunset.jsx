import { useEffect, useRef, useState } from 'react'
import './SavannaSunset.css'

const MORPH_MS = 600 // button swells into the sun
const ALIGN_MS = 1000 // sun sits behind the giraffe's head and flares

// Tapered legs drawn from the hip/shoulder down (0,0) → hoof (0,96).
const FRONT_LEG = 'M-6 0H6L4 48L5.5 54L3 92L4.5 96H-4.5L-3 92L-4.5 54L-4 48Z'
const BACK_LEG = 'M-8 0H7L5 38L1 56L3.5 92L4.5 96H-4L-2.5 92L-5 58L-7 38Z'

const Leg = ({ x, y, d, far }) => (
  <g transform={`translate(${x} ${y})`}>
    <path className={far ? 'sv__leg sv__leg--far' : 'sv__leg'} d={d} />
  </g>
)

// The sun lands on this point of the giraffe drawing (viewBox units).
const HEAD = { x: 184, y: 14 }
const VIEWBOX = { x: 0, y: -12, w: 206, h: 232 }

function Giraffe({ svgRef }) {
  return (
    <svg ref={svgRef} className="sv__giraffe" viewBox="0 -12 206 232" aria-hidden="true">
      {/* far-side legs (slightly lighter for depth) */}
      <Leg x={78} y={118} d={BACK_LEG} far />
      <Leg x={142} y={118} d={FRONT_LEG} far />

      <path className="sv__tail" d="M54 108C50 124 47 140 45 158" />

      {/* body: high withers sloping down to the rump */}
      <path className="sv__fill" d="M52 112C52 100 64 96 80 96L128 84C146 80 157 92 155 108C153 122 146 128 136 128L76 130C60 130 50 124 52 112Z" />

      <g>
        <path className="sv__fill" d="M126 88L169 12L184 19L154 112Z" />
        <path className="sv__fill" d="M126 88L169 12L166 10L122 90Z" /> {/* mane edge */}
        <path className="sv__fill" d="M167 10C171 2 181 0 188 6L202 21C203 27 197 30 190 28L178 26C169 24 164 17 167 10Z" />
        <ellipse className="sv__fill" cx="168" cy="9" rx="7" ry="2.6" transform="rotate(-25 168 9)" />
        <path className="sv__horn" d="M175 4L173-6M181 3L181-7" />
        <circle className="sv__fill" cx="173" cy="-6.5" r="2.2" />
        <circle className="sv__fill" cx="181" cy="-7.5" r="2.2" />
      </g>

      {/* near-side legs */}
      <Leg x={66} y={118} d={BACK_LEG} />
      <Leg x={132} y={120} d={FRONT_LEG} />
    </svg>
  )
}

function Acacia() {
  return (
    <svg className="sv__tree" viewBox="0 0 140 100" aria-hidden="true">
      <path d="M70 100L70 62M70 64L52 42M70 66L90 40M70 74L60 54" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M8 40Q20 22 46 24Q60 12 80 18Q104 14 120 26Q138 30 134 40Q100 46 70 44Q34 46 8 40Z" fill="currentColor" />
    </svg>
  )
}

// One smooth arc (quadratic Bézier) from the button up into the sky and down onto the head.
function arcKeyframes(dx, dy, lift, steps = 40) {
  const cx = dx * 0.45
  const cy = Math.min(0, dy) - lift
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const u = 1 - t
    const x = 2 * u * t * cx + t * t * dx
    const y = 2 * u * t * cy + t * t * dy
    return { transform: `translate(${x}px, ${y}px)` }
  })
}

const Bird = ({ i }) => (
  <svg className="sv__bird" style={{ '--i': i }} viewBox="0 0 20 8" aria-hidden="true">
    <path d="M0 6Q5 0 10 5Q15 0 20 6" />
  </svg>
)

/**
 * A button that becomes the sun and sets behind a giraffe's head, then reveals `children`.
 * Fills its parent (give the parent a size and `position: relative`).
 * `children` can be a node or a function `(reset) => node`.
 */
export default function SavannaSunset({ label = 'Start', setMs = 4200, onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → morphing → setting → aligned → done
  const rootRef = useRef(null)
  const sunRef = useRef(null)
  const giraffeRef = useRef(null)

  useEffect(() => {
    if (phase === 'morphing') {
      const t = setTimeout(() => setPhase('setting'), MORPH_MS)
      return () => clearTimeout(t)
    }

    if (phase === 'setting') {
      // Measure where the sun is and where the giraffe's head is, then fly along an arc.
      const sun = sunRef.current.getBoundingClientRect()
      // Measure the whole <svg> box (reliable in every browser; Safari mis-reports zero-size SVG shapes)
      // and map the head point through the viewBox.
      const g = giraffeRef.current.getBoundingClientRect()
      const head = {
        left: g.left + ((HEAD.x - VIEWBOX.x) / VIEWBOX.w) * g.width,
        top: g.top + ((HEAD.y - VIEWBOX.y) / VIEWBOX.h) * g.height,
      }
      const dx = head.left - (sun.left + sun.width / 2)
      const dy = head.top - (sun.top + sun.height / 2)
      const lift = rootRef.current.clientHeight * 0.32
      const anim = sunRef.current.animate(arcKeyframes(dx, dy, lift), {
        duration: setMs,
        easing: 'cubic-bezier(.35, 0, .25, 1)', // eases out of the button, glides, slows into sunset
        fill: 'forwards',
      })
      anim.onfinish = () => setPhase('aligned')
      return () => anim.playState !== 'finished' && anim.cancel()
    }

    if (phase === 'aligned') {
      const t = setTimeout(() => setPhase('done'), ALIGN_MS)
      return () => clearTimeout(t)
    }

    if (phase === 'done') onComplete?.()
  }, [phase, setMs]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = phase === 'done'
  const reset = () => setPhase('idle')

  return (
    <div ref={rootRef} className={`sv sv--${phase}`} style={{ '--set': `${setMs}ms` }}>
      <div className="sv__dusk" />

      <div className="sv__birds">{[0, 1, 2].map((i) => <Bird key={i} i={i} />)}</div>

      {!done && (
        <div ref={sunRef} className="sv__orbit">
          <button className="sv__sun" onClick={() => setPhase('morphing')} disabled={phase !== 'idle'}>
            <span className="sv__label">{label}</span>
          </button>
        </div>
      )}

      <div className="sv__stand"><Giraffe svgRef={giraffeRef} /></div>

      <div className="sv__ground">
        <Acacia />
      </div>

      {done && <div className="sv-result">{typeof children === 'function' ? children(reset) : children}</div>}
    </div>
  )
}
