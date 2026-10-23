import { useEffect, useRef, useState } from 'react'
import './CoinRush.css'

const MORPH_MS = 550 // button → { } block, robot runs in
const CLEAR_MS = 1500 // victory jump + LEVEL CLEAR!
const SPEED = 165 // scroll speed, px/s
const HERO_W = 36
const HERO_H = 42
const BONK_H = 78 // jump height that reaches the block

// ---------- pixel art (original designs) ----------
const PALETTE = {
  r: '#ef4444', g: '#9ca3af', w: '#f3f4f6', k: '#1f2937', c: '#22d3ee',
  b: '#3b82f6', y: '#facc15', d: '#374151',
  o: '#b45309', Y: '#fbbf24', h: '#fef3c7',
}
const HEAD = [
  '.....r......',
  '.....g......',
  '..wwwwwwww..',
  '.wwwwwwwwww.',
  '.wwwkckkckw.',
  '.wwwkkkkkkw.',
  '.wwwwwwwwww.',
  '..gggggggg..',
  '.gbbbbbbbbg.',
  '.gbbyybbbbg.',
  '..bbbbbbbb..',
]
const ROBOT = {
  a: [...HEAD, '..dd....dd..', '.dd......dd.', '.dd......dd.'],
  b: [...HEAD, '...dd..dd...', '...dd..dd...', '..ddd.ddd...'],
  jump: [...HEAD, '..dd...dd...', '..ddd.ddd...', '............'],
}
const COIN = ['..oooo..', '.oYYYYo.', 'oYYhYYYo', 'oYYhYYYo', 'oYYhYYYo', 'oYYhYYYo', '.oYYYYo.', '..oooo..']

function Pixels({ map, scale, className }) {
  return (
    <svg className={className} width={map[0].length * scale} height={map.length * scale}
      viewBox={`0 0 ${map[0].length} ${map.length}`} shapeRendering="crispEdges" aria-hidden="true">
      {map.flatMap((row, y) => [...row].map((ch, x) =>
        ch === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={PALETTE[ch]} />))}
    </svg>
  )
}

// ---------- level layout (built from the card's real size) ----------
function buildLevel(W, H) {
  const ground = Math.round(H * 0.82)
  const heroX = Math.round(W * 0.24)
  const heroCx0 = heroX + HERO_W / 2 // hero center in world space at scroll 0
  const bx = W / 2 // block center
  const block = { x: bx - 16, y: ground - HERO_H - BONK_H - 32 }

  const jumps = []
  const jump = (apexX, h, dur = 0.56) => jumps.push({ from: apexX - (SPEED * dur) / 2, to: apexX + (SPEED * dur) / 2, h })
  jump(bx, BONK_H)
  jump(bx + 220, 72)
  jump(bx + 410, 92)
  jump(bx + 590, 64)
  const lift = (cx) => {
    for (const j of jumps) if (cx >= j.from && cx <= j.to) { const p = (cx - j.from) / (j.to - j.from); return j.h * 4 * p * (1 - p) }
    return 0
  }

  // Coins sit on the robot's path → straight rows while running, arcs while jumping.
  const coins = []
  for (let cx = bx + 70; cx <= bx + 690; cx += 30) coins.push({ cx, x: cx - 10, y: ground - HERO_H / 2 - lift(cx) - 10 })
  const end = coins[coins.length - 1].cx + 40 - heroCx0

  return { W, H, ground, heroX, heroCx0, block, coins, lift, end, total: coins.length + 1 }
}

const pad = (n) => String(n).padStart(2, '0')

/**
 * A button that becomes a block in a tiny retro platformer; a robot collects coins, then `children` show.
 * Fills its parent (give the parent a size and `position: relative`).
 * `children` can be a node or a function `(reset) => node`.
 */
export default function CoinRush({ label = 'Start', onComplete, children }) {
  const [phase, setPhase] = useState('idle') // idle → morph → play → clear → done
  const [level, setLevel] = useState(null)
  const rootRef = useRef(null)
  const worldRef = useRef(null)
  const heroRef = useRef(null)
  const blockRef = useRef(null)
  const countRef = useRef(null)
  const pctRef = useRef(null)

  const start = () => {
    const el = rootRef.current
    setLevel(buildLevel(el.clientWidth, el.clientHeight))
    setPhase('morph')
  }

  useEffect(() => {
    if (phase === 'morph') {
      const t = setTimeout(() => setPhase('play'), MORPH_MS)
      return () => clearTimeout(t)
    }

    if (phase === 'play') {
      const L = level
      const root = rootRef.current
      const hero = heroRef.current
      const coinEls = worldRef.current.querySelectorAll('.cr__coin')
      let got = 0
      let next = 0
      let bonked = false
      let t0
      let raf

      const score = () => {
        got++
        countRef.current.textContent = pad(got)
        pctRef.current.textContent = `${pad(Math.round((got / L.total) * 100))}%`
      }

      const frame = (now) => {
        t0 ??= now
        const t = (now - t0) / 1000
        const scroll = Math.min(SPEED * t, L.end)
        const cx = L.heroCx0 + scroll
        const lift = L.lift(cx)

        worldRef.current.style.transform = `translateX(${-scroll}px)`
        root.style.setProperty('--scroll', scroll)
        hero.style.transform = `translate(${L.heroX}px, ${L.ground - HERO_H - lift}px)`
        hero.dataset.frame = lift > 0 ? 'jump' : Math.floor(t * 9) % 2 ? 'b' : 'a'

        if (!bonked && cx >= L.block.x + 16) {
          bonked = true
          blockRef.current.classList.add('is-hit')
          score()
        }
        while (next < L.coins.length && cx >= L.coins[next].cx) {
          coinEls[next].classList.add('is-got')
          score()
          next++
        }

        if (scroll >= L.end) {
          hero.dataset.frame = 'jump'
          setPhase('clear')
          return
        }
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
      return () => cancelAnimationFrame(raf)
    }

    if (phase === 'clear') {
      const t = setTimeout(() => setPhase('done'), CLEAR_MS)
      return () => clearTimeout(t)
    }

    if (phase === 'done') onComplete?.()
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    rootRef.current.style.setProperty('--scroll', 0)
    setLevel(null)
    setPhase('idle')
  }
  const done = phase === 'done'
  const playing = level && !done

  return (
    <div
      ref={rootRef}
      className={`cr cr--${phase}`}
      style={level ? { '--block-dy': `${level.block.y + 16 - level.H / 2}px`, '--hx': `${level.heroX}px` } : undefined}
    >
      <div className="cr__scene" aria-hidden="true">
        <div className="cr__clouds" />
        <div className="cr__hills" />
        <div className="cr__ground" />
      </div>

      {playing && (
        <div className="cr__play" aria-hidden="true">
          <div ref={worldRef} className="cr__world">
            <div ref={blockRef} className="cr__block" style={{ left: level.block.x, top: level.block.y }}>
              <span className="cr__brace">{'{}'}</span>
              <Pixels map={COIN} scale={2.5} className="cr__pop" />
            </div>
            {level.coins.map((c, i) => (
              <div key={i} className="cr__coin" style={{ left: c.x, top: c.y, animationDelay: `${(i % 4) * -0.15}s` }}>
                <Pixels map={COIN} scale={2.5} />
              </div>
            ))}
          </div>

          <div
            ref={heroRef}
            className="cr__hero"
            data-frame="a"
            style={{ transform: `translate(${level.heroX}px, ${level.ground - HERO_H}px)` }}
          >
            <div className="cr__hero-inner">
              {Object.entries(ROBOT).map(([k, map]) => (
                <Pixels key={k} map={map} scale={3} className={`cr__frame cr__frame--${k}`} />
              ))}
            </div>
          </div>

          <div className="cr__hud">
            <span className="cr__hud-coins"><Pixels map={COIN} scale={2} /> × <b ref={countRef}>00</b><small>/{level.total}</small></span>
            <span>LOADING <b ref={pctRef}>00%</b></span>
          </div>

          <div className="cr__clear">LEVEL CLEAR!</div>
        </div>
      )}

      {!done && (
        <button className="cr__btn" onClick={start} disabled={phase !== 'idle'}>
          <span className="cr__label">{label}</span>
        </button>
      )}

      {done && <div className="cr-result">{typeof children === 'function' ? children(reset) : children}</div>}
    </div>
  )
}
