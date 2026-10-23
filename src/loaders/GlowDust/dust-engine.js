// Glowing dust in a flow field: additive light, rainbow hues, silky trails,
// pointer swirl, and a finale where the dust gathers into a ring + checkmark.
// No dependencies. createDust() returns { stop, setPointer }.

const rand = (a, b) => a + Math.random() * (b - a)
const smooth = (t) => t * t * (3 - 2 * t)
const BUCKETS = 24 // hues are batched into buckets → one stroke() per bucket

function glowSprites() {
  return Array.from({ length: BUCKETS }, (_, i) => {
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    const hue = (i / BUCKETS) * 360
    grad.addColorStop(0, `hsla(${hue}, 100%, 85%, 1)`)
    grad.addColorStop(0.25, `hsla(${hue}, 100%, 65%, .6)`)
    grad.addColorStop(1, `hsla(${hue}, 100%, 60%, 0)`)
    g.fillStyle = grad
    g.fillRect(0, 0, 32, 32)
    return c
  })
}

// Smooth, ever-changing wind directions.
const flowAngle = (x, y, t) =>
  (Math.sin(x * 0.011 + t * 0.5) + Math.cos(y * 0.013 - t * 0.37) + Math.sin((x - y) * 0.006 + t * 0.21)) * Math.PI * 0.9

export function createDust(canvas, { origin, swirlMs = 4200, gatherMs = 1800, fadeMs = 600, onEnd } = {}) {
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.lineCap = 'round'

  const sprites = glowSprites()
  const N = Math.round(Math.min(1100, (W * H) / 220))
  const cx = W / 2
  const cy = H / 2
  const R = Math.min(W, H) * 0.17

  // finale shape: 65% ring, 35% checkmark
  const check = [[cx - 0.45 * R, cy + 0.02 * R], [cx - 0.12 * R, cy + 0.34 * R], [cx + 0.5 * R, cy - 0.32 * R]]
  const onCheck = (u) => {
    const [a, b, c] = check
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1])
    const l2 = Math.hypot(c[0] - b[0], c[1] - b[1])
    const d = u * (l1 + l2)
    if (d < l1) return [a[0] + ((b[0] - a[0]) * d) / l1, a[1] + ((b[1] - a[1]) * d) / l1]
    const k = (d - l1) / l2
    return [b[0] + (c[0] - b[0]) * k, b[1] + (c[1] - b[1]) * k]
  }

  const particles = Array.from({ length: N }, (_, i) => {
    // born inside the button, bursting outward
    const x = rand(origin.x, origin.x + origin.w)
    const y = rand(origin.y, origin.y + origin.h)
    const a = rand(0, Math.PI * 2)
    const sp = rand(40, 280)
    const ring = i < N * 0.65
    const ang = rand(0, Math.PI * 2)
    const [tx, ty] = ring ? [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R] : onCheck(Math.random())
    return {
      x, y, px: x, py: y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      speed: rand(60, 115),
      hue: rand(0, 360),
      size: rand(0.8, 2.1),
      spark: Math.random() < 0.07,
      tx: tx + rand(-3, 3), ty: ty + rand(-3, 3),
    }
  })

  let pointer = null
  const start = performance.now()
  let last = start
  let raf = 0
  const total = swirlMs + gatherMs + fadeMs

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    const e = now - start
    const t = e / 1000
    const gather = smooth(Math.min(Math.max((e - swirlMs) / gatherMs, 0), 1))
    const fade = Math.min(Math.max((e - swirlMs - gatherMs) / fadeMs, 0), 1)
    const steer = Math.min(1, dt * 1.8)

    for (const p of particles) {
      p.px = p.x
      p.py = p.y
      const a = flowAngle(p.x, p.y, t)
      let ax = (Math.cos(a) * p.speed - p.vx) * steer
      let ay = (Math.sin(a) * p.speed - p.vy) * steer

      if (pointer && gather < 0.05) {
        const dx = p.x - pointer.x
        const dy = p.y - pointer.y
        const d = Math.hypot(dx, dy)
        if (d < 130 && d > 1) {
          const f = (1 - d / 130) * 900 * dt
          ax += (-dy / d) * f - (dx / d) * f * 0.35 // swirl around + pull in
          ay += (dx / d) * f - (dy / d) * f * 0.35
        }
      }

      if (gather > 0) {
        // spring toward the finale shape, gradually overriding the wind
        const sx = (p.tx - p.x) * 7 - p.vx
        const sy = (p.ty - p.y) * 7 - p.vy
        ax = ax * (1 - gather) + sx * Math.min(1, dt * 5) * gather
        ay = ay * (1 - gather) + sy * Math.min(1, dt * 5) * gather
      }

      p.vx += ax
      p.vy += ay
      p.x += p.vx * dt
      p.y += p.vy * dt

      if (gather < 0.3) {
        // wrap around the edges while swirling (no trail across the jump)
        if (p.x < -10) p.x = p.px = W + 10
        else if (p.x > W + 10) p.x = p.px = -10
        if (p.y < -10) p.y = p.py = H + 10
        else if (p.y > H + 10) p.y = p.py = -10
      }
    }

    // fade old trails (works on a transparent canvas, so the card background shows through)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = `rgba(0,0,0,${0.13 + fade * 0.25})`
    ctx.fillRect(0, 0, W, H)

    ctx.globalCompositeOperation = 'lighter'
    const alpha = 0.75 * (1 - fade)
    const paths = Array.from({ length: BUCKETS }, () => new Path2D())
    const shift = t * 35
    for (const p of particles) {
      const hue = (p.hue + shift + p.x * 0.25) % 360
      const b = Math.floor((hue / 360) * BUCKETS) % BUCKETS
      paths[b].moveTo(p.px, p.py)
      paths[b].lineTo(p.x, p.y)
      p.b = b
    }
    ctx.lineWidth = 1.6
    for (let i = 0; i < BUCKETS; i++) {
      ctx.strokeStyle = `hsla(${(i / BUCKETS) * 360}, 95%, 62%, ${alpha})`
      ctx.stroke(paths[i])
    }
    for (const p of particles) {
      if (!p.spark) continue
      const tw = 0.5 + 0.5 * Math.sin(t * 6 + p.hue)
      ctx.globalAlpha = (0.4 + 0.6 * tw) * (1 - fade)
      const s = 10 + p.size * 6
      ctx.drawImage(sprites[p.b], p.x - s / 2, p.y - s / 2, s, s)
    }
    ctx.globalAlpha = 1

    if (e >= total) {
      ctx.clearRect(0, 0, W, H)
      onEnd?.()
      return
    }
    raf = requestAnimationFrame(frame)
  }

  raf = requestAnimationFrame(frame)
  return {
    stop: () => cancelAnimationFrame(raf),
    setPointer: (p) => (pointer = p),
  }
}
