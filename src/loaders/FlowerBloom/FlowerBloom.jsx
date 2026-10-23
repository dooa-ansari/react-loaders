import { useEffect, useRef, useState } from 'react'
import './FlowerBloom.css'

const SEED_MS = 450 // button squeezes into a seed
const DROP_MS = 650 // seed falls and bounces onto the soil
const GROW_MS = 4800 // grass, stems, leaves, blooms, butterfly
const GROUND = 472 // horizon in the 420×600 scene

// x = position along the ground, h = stem height, lean = stem curve, d = start delay (ms)
const FLOWERS = [
  { x: 210, h: 230, lean: 0, d: 0, petals: 8, size: 26, color: '#f472b6', center: '#fde047' },
  { x: 120, h: 165, lean: -6, d: 350, petals: 12, size: 21, color: '#facc15', center: '#92400e' },
  { x: 300, h: 185, lean: 5, d: 600, petals: 6, size: 23, color: '#a78bfa', center: '#fef08a' },
  { x: 58, h: 110, lean: -4, d: 900, tulip: true, color: '#fb7185', shade: '#e11d48' },
  { x: 365, h: 122, lean: 6, d: 1100, tulip: true, color: '#fb923c', shade: '#ea580c' },
  { x: 165, h: 92, lean: -2, d: 1300, petals: 10, size: 14, color: '#ffffff', center: '#facc15', outline: '#e5e7eb' },
  { x: 258, h: 104, lean: 3, d: 1500, petals: 5, size: 15, color: '#38bdf8', center: '#ffffff' },
]

const LEAF = 'M0 0Q10-9 24-3Q12 5 0 0Z'

// Deterministic grass so it looks the same every time.
const blades = (count, step, minH, spread, seed) =>
  Array.from({ length: count }, (_, i) => {
    const x = i * step + ((i * seed) % 5)
    const h = minH + ((i * 37 + seed) % spread)
    const bend = ((i * 13 + seed) % 9) - 4
    const fill = ['#22c55e', '#16a34a', '#4ade80', '#15803d'][(i + seed) % 4]
    return { d: `M${x} ${GROUND + 2}Q${x + bend / 2} ${GROUND - h / 2} ${x + bend} ${GROUND - h}L${x + 5} ${GROUND + 2}Z`, fill }
  })
const BACK_GRASS = blades(72, 6, 14, 18, 3)
const FRONT_GRASS = blades(48, 9, 8, 10, 7)

function Grass({ items, front }) {
  return (
    <g className={`fl__grass ${front ? 'fl__grass--front' : ''}`}>
      {items.map((b, i) => (
        <path key={i} className="fl__blade" d={b.d} fill={b.fill} style={{ '--i': i * (front ? 1.5 : 1) }} />
      ))}
    </g>
  )
}

function Flower({ f, i }) {
  const hx = f.lean * 3
  const hy = -f.h
  const stem = `M0 0C${f.lean * 2} ${-f.h * 0.35} ${-f.lean * 1.5} ${-f.h * 0.7} ${hx} ${hy}`
  return (
    <g transform={`translate(${f.x} ${GROUND})`}>
      <g className="fl__flower" style={{ '--d': `${f.d}ms`, '--sw': `${3 + (i % 3) * 0.7}s` }}>
        <path className="fl__stem" d={stem} pathLength="1" />
        <g transform={`translate(${f.lean * 0.5} ${-f.h * 0.36}) rotate(-35)`}>
          <path className="fl__leaf" d={LEAF} />
        </g>
        <g transform={`translate(${-f.lean * 0.3} ${-f.h * 0.54}) rotate(-145)`}>
          <path className="fl__leaf fl__leaf--late" d={LEAF} />
        </g>
        <g transform={`translate(${hx} ${hy})`}>
          <g className="fl__nod">
          <g className="fl__head">
            {f.tulip ? (
              <>
                <g transform="rotate(-24)"><ellipse className="fl__petal" style={{ '--p': 0 }} cx="0" cy="-12" rx="8" ry="15" fill={f.shade} /></g>
                <g transform="rotate(24)"><ellipse className="fl__petal" style={{ '--p': 1 }} cx="0" cy="-12" rx="8" ry="15" fill={f.shade} /></g>
                <g><ellipse className="fl__petal" style={{ '--p': 2 }} cx="0" cy="-13" rx="9" ry="16" fill={f.color} /></g>
              </>
            ) : (
              <>
                {Array.from({ length: f.petals }, (_, i) => (
                  <g key={i} transform={`rotate(${(360 / f.petals) * i})`}>
                    <ellipse
                      className="fl__petal" style={{ '--p': i }}
                      cx="0" cy={-f.size * 0.55} rx={f.size * 0.3} ry={f.size * 0.58}
                      fill={f.color} stroke={f.outline ?? 'rgba(0,0,0,.06)'} strokeWidth="1"
                    />
                  </g>
                ))}
                <circle className="fl__center" r={f.size * 0.3} fill={f.center} />
              </>
            )}
          </g>
          </g>
        </g>
      </g>
    </g>
  )
}

function Butterfly({ flyRef }) {
  return (
    <g ref={flyRef} className="fl__butterfly">
      <g className="fl__wing">
        <path d="M0 0C-14-16-22-4-12 2C-20 8-10 16 0 2Z" fill="#f59e0b" />
        <path d="M0 0C14-16 22-4 12 2C20 8 10 16 0 2Z" fill="#fbbf24" />
      </g>
      <path d="M0-6V8" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

// A gentle sine-wave flight across the meadow, tilting into each turn.
function flightKeyframes(steps = 80) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const x = -30 + 490 * t
    const y = 300 - 70 * t + 38 * Math.sin(t * Math.PI * 3)
    const slope = (-70 + 38 * 3 * Math.PI * Math.cos(t * Math.PI * 3)) / 490
    const tilt = (Math.atan(slope) * 180) / Math.PI * 0.6
    return { transform: `translate(${x}px, ${y}px) rotate(${tilt}deg)`, opacity: 1 }
  })
}

const Cloud = ({ x, y, s, cls }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className={`fl__cloud ${cls}`}>
      <path d="M0 20Q0 6 14 8Q20-4 34 2Q46-2 50 10Q62 10 60 20Z" fill="#fff" opacity=".9" />
    </g>
  </g>
)

/**
 * A button that plants a seed and grows a meadow of flowers, then reveals `children`.
 * Fills its parent (give the parent a size and `position: relative`).
 * `children` can be a node or a function `(reset) => node`.
 */
export default function FlowerBloom({ label = 'Start', onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → seed → drop → grow → done
  const seedRef = useRef(null)
  const sceneRef = useRef(null)
  const flyRef = useRef(null)

  useEffect(() => {
    if (phase === 'seed') {
      const t = setTimeout(() => setPhase('drop'), SEED_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'drop') {
      // Fall exactly onto the soil line, wherever it is on this card size.
      const seed = seedRef.current.getBoundingClientRect()
      // The scene is a 420×600 viewBox drawn with "xMidYMax slice": scaled to cover, bottom-aligned.
      // Mapping it ourselves is reliable everywhere (Safari mis-reports zero-size SVG shapes).
      const sc = sceneRef.current.getBoundingClientRect()
      const scale = Math.max(sc.width / 420, sc.height / 600)
      const groundTop = sc.top + (sc.height - 600 * scale) + GROUND * scale
      const dy = groundTop - seed.bottom + 4
      const anim = seedRef.current.animate(
        [
          { transform: 'translateY(0)', easing: 'cubic-bezier(.55,0,1,.45)' }, // gravity
          { transform: `translateY(${dy}px) scale(1.2, .8)`, offset: 0.7, easing: 'ease-out' },
          { transform: `translateY(${dy - 10}px)`, offset: 0.85, easing: 'ease-in' }, // little bounce
          { transform: `translateY(${dy}px)` },
        ],
        { duration: DROP_MS, fill: 'forwards' },
      )
      anim.onfinish = () => setPhase('grow')
      return () => anim.playState !== 'finished' && anim.cancel()
    }
    if (phase === 'grow') {
      const fly = flyRef.current.animate(flightKeyframes(), { duration: 3000, delay: 1600, easing: 'ease-in-out', fill: 'both' })
      const t = setTimeout(() => setPhase('done'), GROW_MS)
      return () => {
        clearTimeout(t)
        if (fly.playState !== 'finished') fly.cancel()
      }
    }
    if (phase === 'done') onComplete?.()
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = phase === 'done'
  const reset = () => setPhase('idle')

  return (
    <div className={`fl fl--${phase}`}>
      <svg ref={sceneRef} className="fl__scene" viewBox="0 0 420 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <Cloud x={40} y={70} s={1} cls="fl__cloud--a" />
        <Cloud x={280} y={130} s={0.75} cls="fl__cloud--b" />

        <rect className="fl__soil" x="0" y={GROUND} width="420" height={600 - GROUND} />
        <rect className="fl__turf" x="0" y={GROUND} width="420" height={600 - GROUND} />

        <Grass items={BACK_GRASS} />
        {FLOWERS.map((f, i) => <Flower key={f.x} f={f} i={i} />)}
        <Grass items={FRONT_GRASS} front />
        <Butterfly flyRef={flyRef} />
      </svg>

      {!done && (
        <div ref={seedRef} className="fl__seedwrap">
          <button className="fl__btn" onClick={() => setPhase('seed')} disabled={phase !== 'idle'}>
            <span className="fl__label">{label}</span>
          </button>
        </div>
      )}

      {done && <div className="fl-result">{typeof children === 'function' ? children(reset) : children}</div>}
    </div>
  )
}
