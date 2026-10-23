// Shooting stars: a hero star launches from the button, a meteor shower builds,
// the pointer can fling its own stars, and a ✓ constellation draws itself.
// No dependencies. createSky() returns { stop, pointerMove, pointerDown, pointerUp }.

const rand = (a, b) => a + Math.random() * (b - a)
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)
const HUES = [195, 210, 280, 320, 45] // cyan, blue, violet, pink, gold tails

function sprite(inner, outer) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, inner)
  grad.addColorStop(0.18, outer)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return c
}

export function createSky(canvas, { origin, onEnd } = {}) {
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.lineCap = 'round'

  const glow = sprite('rgba(255,255,255,1)', 'rgba(190,220,255,.55)')
  const T = { hero: 0, showerFrom: 500, showerTo: 4600, constFrom: 4400, end: 6900 }

  // ✓ constellation, relative to the card center
  const cx = W / 2
  const cy = H * 0.42
  const s = Math.min(W / 420, H / 600)
  const NODES = [[-78, -8], [-50, 20], [-22, 48], [14, 8], [50, -34], [88, -82]].map(([x, y]) => [cx + x * s, cy + y * s])
  const EXTRA = [[-110, -60], [120, -20], [-20, -90]].map(([x, y]) => [cx + x * s, cy + y * s])

  let meteors = []
  let dust = []
  let nextSpawn = T.showerFrom
  let ptr = null
  let lastFling = 0
  const start = performance.now()
  let last = start
  let raf = 0
  let e = 0

  function meteor(x, y, vx, vy, o = {}) {
    meteors.push({
      x, y, vx, vy, ax: o.ax ?? 0, ay: o.ay ?? 0,
      hue: o.hue ?? HUES[Math.floor(Math.random() * HUES.length)],
      width: o.width ?? rand(1.6, 2.8), tail: o.tail ?? rand(0.16, 0.3), // seconds of history
      trail: [], hero: !!o.hero, age: 0,
    })
  }

  // the hero: launches from the button and curves up and away
  meteor(origin.x, origin.y, 140, -260, { ax: 900, ay: -420, hue: 200, width: 4, tail: 0.42, hero: true })

  function spawnShower() {
    // enter from the top or the right edge, falling down-left
    const fromTop = Math.random() < 0.6
    const x = fromTop ? rand(W * 0.25, W * 1.15) : W + 20
    const y = fromTop ? -20 : rand(-20, H * 0.45)
    const sp = rand(520, 900)
    const a = rand(2.25, 2.6) // ~130–150°
    meteor(x, y, Math.cos(a) * sp, Math.sin(a) * sp)
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    e = now - start

    // shower density rises then falls
    if (e >= nextSpawn && e < T.showerTo) {
      spawnShower()
      const k = Math.sin(Math.PI * clamp01((e - T.showerFrom) / (T.showerTo - T.showerFrom)))
      nextSpawn = e + rand(90, 160) + (1 - k) * 380
    }

    for (const m of meteors) {
      m.age += dt
      m.vx += m.ax * dt
      m.vy += m.ay * dt
      m.x += m.vx * dt
      m.y += m.vy * dt
      m.trail.push({ x: m.x, y: m.y, t: e })
      while (m.trail.length && e - m.trail[0].t > m.tail * 1000) m.trail.shift()
      // stardust shed from the head
      if (Math.random() < (m.hero ? 0.9 : 0.45)) {
        dust.push({ x: m.x, y: m.y, vx: rand(-20, 20) - m.vx * 0.04, vy: rand(-10, 25) - m.vy * 0.04, life: rand(0.5, 1.2), max: 1.2, hue: m.hue, ph: rand(0, 6) })
      }
    }
    meteors = meteors.filter((m) => m.x > -200 && m.x < W + 200 && m.y > -200 && m.y < H + 200)
    for (const d of dust) {
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.vy += 12 * dt
      d.life -= dt
    }
    dust = dust.filter((d) => d.life > 0)

    // ---------- draw ----------
    const fade = 1 - clamp01((e - (T.end - 600)) / 600)
    ctx.clearRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = fade

    for (const d of dust) {
      const a = (d.life / d.max) * (0.5 + 0.5 * Math.sin(e / 70 + d.ph))
      ctx.fillStyle = `hsla(${d.hue}, 100%, 80%, ${a})`
      ctx.fillRect(d.x - 0.7, d.y - 0.7, 1.4, 1.4)
    }

    for (const m of meteors) {
      const n = m.trail.length
      if (n < 2) continue
      // tapered tail: thin + faint at the end → thick + bright at the head
      // (butt caps: round caps would overlap at every joint and add up into bright beads)
      ctx.lineCap = 'butt'
      for (let i = 1; i < n; i++) {
        const k = i / (n - 1)
        ctx.strokeStyle = `hsla(${m.hue}, 100%, ${60 + k * 30}%, ${k * k * 0.9})`
        ctx.lineWidth = m.width * (0.15 + 0.85 * k)
        ctx.beginPath()
        ctx.moveTo(m.trail[i - 1].x, m.trail[i - 1].y)
        ctx.lineTo(m.trail[i].x, m.trail[i].y)
        ctx.stroke()
      }
      const size = m.width * (m.hero ? 9 : 7)
      ctx.drawImage(glow, m.x - size / 2, m.y - size / 2, size, size)
    }

    // ✓ constellation: stars pop in, then lines connect them
    if (e > T.constFrom) {
      const ce = e - T.constFrom
      EXTRA.forEach(([x, y], i) => {
        const a = clamp01((ce - 200 - i * 150) / 400) * (0.6 + 0.4 * Math.sin(e / 300 + i))
        const sz = 16 * a
        ctx.globalAlpha = fade * a * 0.7
        ctx.drawImage(glow, x - sz / 2, y - sz / 2, sz, sz)
      })
      ctx.globalAlpha = fade
      ctx.lineWidth = 1.6
      for (let i = 0; i < NODES.length - 1; i++) {
        const p = clamp01((ce - 250 - i * 170) / 260)
        if (p <= 0) continue
        const [x1, y1] = NODES[i]
        const [x2, y2] = NODES[i + 1]
        ctx.strokeStyle = 'rgba(170, 215, 255, .75)'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p)
        ctx.stroke()
      }
      NODES.forEach(([x, y], i) => {
        const p = clamp01((ce - i * 170) / 300)
        if (p <= 0) return
        const pop = p < 1 ? 1 + Math.sin(p * Math.PI) * 0.8 : 1 + 0.15 * Math.sin(e / 220 + i) // pop, then twinkle
        const sz = 30 * pop
        ctx.drawImage(glow, x - sz / 2, y - sz / 2, sz, sz)
      })
    }
    ctx.globalAlpha = 1

    if (e >= T.end) {
      ctx.clearRect(0, 0, W, H)
      onEnd?.()
      return
    }
    raf = requestAnimationFrame(frame)
  }

  raf = requestAnimationFrame(frame)

  return {
    stop: () => cancelAnimationFrame(raf),
    // swipe across the sky to fling your own shooting stars
    pointerMove(x, y) {
      const now = performance.now()
      if (ptr) {
        const dtp = Math.max((now - ptr.t) / 1000, 0.001)
        const vx = (x - ptr.x) / dtp
        const vy = (y - ptr.y) / dtp
        const speed = Math.hypot(vx, vy)
        if (speed > 300 && now - lastFling > 80 && e < T.end - 700) {
          lastFling = now
          const sp = Math.min(Math.max(speed * 0.9, 450), 1200)
          meteor(x, y, (vx / speed) * sp, (vy / speed) * sp, { width: 3, tail: 0.28 })
        }
      }
      ptr = { x, y, t: now }
    },
    pointerDown(x, y) {
      ptr = { x, y, t: performance.now() }
      for (let i = 0; i < 24; i++) {
        const a = rand(0, Math.PI * 2)
        const sp = rand(30, 140)
        dust.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 1.1), max: 1.1, hue: HUES[i % HUES.length], ph: rand(0, 6) })
      }
    },
    pointerUp: () => (ptr = null),
  }
}
