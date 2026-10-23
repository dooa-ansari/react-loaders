import { useEffect, useRef, useState } from 'react'
import './CatChase.css'

const POP_MS = 450 // button squashes, mouse pops out
const LAP_MS = 1300 // one run across the floor
const POUNCE_MS = 1700 // leap + landing + dust + "Gotcha!"
const LANE = 340 // lane width (px)
const MARGIN = 60 // runners wrap around off-screen by this much
const CAT_W = 100
const MOUSE_W = 50
const GAP_START = LANE / 2 + 70 // cat starts off-screen…
const GAP_END = 80 // …and closes in to pouncing distance

const place = (el, x, w) => el && (el.style.transform = `translateX(${x - w / 2}px)`)

function Cat() {
  return (
    <svg viewBox="0 0 120 72" width={CAT_W} aria-hidden="true">
      <path className="cc__tail" d="M22 34C10 30 6 18 12 8" />
      <g className="cc__legs cc__legs--cat">
        <line className="cc__leg cc__leg--a" x1="30" y1="44" x2="30" y2="64" />
        <line className="cc__leg cc__leg--b" x1="38" y1="44" x2="38" y2="64" />
        <line className="cc__leg cc__leg--b cc__leg--front" x1="70" y1="44" x2="70" y2="64" />
        <line className="cc__leg cc__leg--a cc__leg--front" x1="78" y1="44" x2="78" y2="64" />
      </g>
      <ellipse cx="52" cy="40" rx="32" ry="15" fill="#f59e0b" />
      <ellipse cx="54" cy="47" rx="22" ry="7" fill="#fcd34d" />
      <path d="M40 26q4 6 0 12M50 25q4 7 0 13M60 26q4 6 0 12" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g className="cc__head">
        <polygon points="78,22 80,5 91,17" fill="#f59e0b" />
        <polygon points="92,16 103,5 103,24" fill="#f59e0b" />
        <polygon points="81,18 82,10 87,16" fill="#fda4af" />
        <polygon points="95,15 101,9 101,19" fill="#fda4af" />
        <circle cx="90" cy="30" r="15" fill="#f59e0b" />
        <ellipse cx="100" cy="35" rx="6" ry="4.5" fill="#fde68a" />
        <ellipse cx="95" cy="27" rx="2.2" ry="3" fill="#111827" />
        <circle cx="95.8" cy="25.8" r=".8" fill="#fff" />
        <polygon points="103,31.5 107.5,31.5 105.2,34.5" fill="#f472b6" />
        <path d="M101 36l13-3M101 38l13 1" stroke="#78350f" strokeWidth=".8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

function Mouse() {
  return (
    <svg viewBox="0 0 64 40" width={MOUSE_W} aria-hidden="true">
      <path className="cc__tail cc__tail--mouse" d="M14 28C6 30 2 22 6 16" />
      <g className="cc__legs cc__legs--mouse">
        <line className="cc__leg cc__leg--a" x1="20" y1="30" x2="20" y2="38" />
        <line className="cc__leg cc__leg--b" x1="26" y1="30" x2="26" y2="38" />
        <line className="cc__leg cc__leg--b" x1="38" y1="30" x2="38" y2="38" />
        <line className="cc__leg cc__leg--a" x1="44" y1="30" x2="44" y2="38" />
      </g>
      <ellipse cx="28" cy="26" rx="15" ry="9" fill="#a1a1aa" />
      <path d="M35 18Q46 12 58 24Q48 31 35 30Z" fill="#a1a1aa" />
      <circle cx="40" cy="15" r="6" fill="#a1a1aa" />
      <circle cx="40" cy="15" r="3.5" fill="#f9a8d4" />
      <circle cx="47" cy="21" r="1.4" fill="#111827" />
      <circle cx="58" cy="24" r="1.8" fill="#f472b6" />
      <path d="M55 25l8-2M55 26.5l8 1" stroke="#52525b" strokeWidth=".6" strokeLinecap="round" />
    </svg>
  )
}

const Dust = () => (
  <span className="cc__dust"><i /><i /><i /></span>
)

/**
 * A button that releases a mouse for a cat to chase, then reveals `children`.
 * `children` can be a node or a function `(reset) => node`.
 */
export default function CatChase({ label = 'Start', laps = 3, onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → popping → chase → pounce → done
  const catRef = useRef(null)
  const mouseRef = useRef(null)

  useEffect(() => {
    if (phase === 'popping') {
      place(mouseRef.current, LANE / 2, MOUSE_W)
      place(catRef.current, LANE / 2 - GAP_START, CAT_W)
      const t = setTimeout(() => setPhase('chase'), POP_MS)
      return () => clearTimeout(t)
    }

    if (phase === 'chase') {
      const L = LANE + MARGIN * 2
      const total = laps * LAP_MS
      const wrap = (x) => ((((x + MARGIN) % L) + L) % L) - MARGIN
      let start
      let raf
      const frame = (now) => {
        start ??= now
        const t = Math.min((now - start) / total, 1)
        const mx = LANE / 2 + laps * L * t // after `laps` laps the mouse is back at center
        const gap = GAP_START + (GAP_END - GAP_START) * t
        place(mouseRef.current, wrap(mx), MOUSE_W)
        place(catRef.current, wrap(mx - gap), CAT_W)
        if (t < 1) raf = requestAnimationFrame(frame)
        else setPhase('pounce')
      }
      raf = requestAnimationFrame(frame)
      return () => cancelAnimationFrame(raf)
    }

    if (phase === 'pounce') {
      const t = setTimeout(() => setPhase('done'), POUNCE_MS)
      return () => clearTimeout(t)
    }

    if (phase === 'done') onComplete?.()
  }, [phase, laps]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'done') {
    const reset = () => setPhase('idle')
    return <div className="cc-result">{typeof children === 'function' ? children(reset) : children}</div>
  }

  return (
    <div className={`cc cc--${phase}`} style={{ '--leap': `${GAP_END}px`, '--lane': `${LANE}px` }}>
      <div className="cc__lane">
        <div ref={catRef} className="cc__runner cc__runner--cat">
          <Dust />
          <div className="cc__body"><Cat /></div>
        </div>
        <div ref={mouseRef} className="cc__runner cc__runner--mouse">
          <span className="cc__speed"><i /><i /><i /></span>
          <Dust />
          <span className="cc__alert">!</span>
          <span className="cc__sweat" />
          <div className="cc__body"><Mouse /></div>
        </div>
        <span className="cc__puff" />
        <span className="cc__stars"><i>✦</i><i>✦</i><i>✦</i></span>
        <span className="cc__gotcha">Gotcha!</span>
      </div>

      <button className="cc__btn" onClick={() => setPhase('popping')} disabled={phase !== 'idle'}>
        <span className="cc__label">{label}</span>
      </button>
    </div>
  )
}
