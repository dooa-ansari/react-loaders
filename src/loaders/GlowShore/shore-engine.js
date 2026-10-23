// Bioluminescent shore: waves break on a night beach with glowing foam,
// leave plankton sparkles on the wet sand, react to the pointer, then one
// big wave flushes the screen. No dependencies. Returns { stop, setPointer }.

const rand = (a, b) => a + Math.random() * (b - a)
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)
const easeOut = (t) => 1 - (1 - t) ** 3
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const MAX_SPARKS = 1600

function glowSprite(hue) {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, `hsla(${hue}, 100%, 88%, 1)`)
  grad.addColorStop(0.3, `hsla(${hue}, 100%, 62%, .55)`)
  grad.addColorStop(1, `hsla(${hue}, 100%, 55%, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, 32, 32)
  return c
}

export function createShore(canvas, { splash, waves = [0.17, 0.24], period = 2300, flushMs = 1600, onEnd } = {}) {
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const y0 = H * 0.48 // calm waterline
  const STEP = 6
  const xs = []
  for (let x = -STEP; x <= W + STEP; x += STEP) xs.push(x)
  const sprites = { cyan: glowSprite(186), blue: glowSprite(205), violet: glowSprite(265) }
  const glints = Array.from({ length: 40 }, () => ({ x: rand(0, W), y: rand(0, y0 * 0.95), ph: rand(0, 6.28) }))

  const SPLASH_MS = 450
  const wavesMs = waves.length * period
  const total = SPLASH_MS + wavesMs + flushMs

  let sparks = []
  let ripples = []
  let wet = 0
  let prevReach = 0
  let pointer = null
  let lastPoke = 0
  const start = performance.now()
  let last = start
  let raf = 0

  function reachAt(e) {
    const w = e - SPLASH_MS
    if (w < 0) return 0
    if (w < wavesMs) {
      const i = Math.floor(w / period)
      const p = (w % period) / period
      const peak = waves[i] * H
      return p < 0.38 ? peak * easeOut(p / 0.38) : peak * (1 - easeInOutSine((p - 0.38) / 0.62))
    }
    return easeInOut(clamp01((w - wavesMs) / (flushMs * 0.75))) * (H - y0 + 60) // the flush
  }

  const edgeY = (x, t, reach) =>
    y0 + 5 * Math.sin(x * 0.03 + t * 1.6) + reach * (1 + 0.12 * Math.sin(x * 0.021 + t * 0.8) + 0.07 * Math.sin(x * 0.057 - t * 1.3))

  function spark(x, y, o = {}) {
    if (sparks.length >= MAX_SPARKS) return
    const r = Math.random()
    sparks.push({
      x, y, vx: o.vx ?? rand(-10, 10), vy: o.vy ?? rand(-6, 6),
      life: o.life ?? rand(1.2, 3), max: 0, size: rand(0.8, 2),
      sprite: r < 0.12 ? (r < 0.02 ? 'violet' : r < 0.07 ? 'blue' : 'cyan') : null,
      ph: rand(0, 6.28), light: rand(55, 75), hue: Math.random() < 0.08 ? 265 : rand(178, 205),
    })
    sparks[sparks.length - 1].max = sparks[sparks.length - 1].life
  }
  const ripple = (x, y, delay = 0, big = false) => ripples.push({ x, y, age: -delay, life: big ? 1.6 : 1.1, max: big ? 90 : 55 })

  // splash where the button dropped in
  for (let i = 0; i < 3; i++) ripple(splash.x, splash.y, i * 0.18, true)
  for (let i = 0; i < 70; i++) {
    const a = rand(0, Math.PI * 2)
    const s = rand(30, 160)
    spark(splash.x, splash.y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, life: rand(0.8, 2) })
  }

  function edgePath(t, reach, dy = 0) {
    const p = new Path2D()
    xs.forEach((x, i) => (i ? p.lineTo(x, edgeY(x, t, reach) + dy) : p.moveTo(x, edgeY(x, t, reach) + dy)))
    return p
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    const e = now - start
    const t = e / 1000
    const reach = reachAt(e)
    const vel = (reach - prevReach) / Math.max(dt, 0.001) // px/s, + when surging
    prevReach = reach
    wet = Math.max(wet - 22 * dt, reach)
    const energy = clamp01(0.35 + vel / 160)
    const endFade = clamp01((e - SPLASH_MS - wavesMs - flushMs * 0.65) / (flushMs * 0.35))

    // plankton lights up along the surging foam edge
    if (vel > 5) {
      const n = Math.min(40, Math.floor(vel * dt * 2.4 + Math.random()))
      for (let i = 0; i < n; i++) {
        const x = rand(0, W)
        spark(x, edgeY(x, t, reach) + rand(-4, 8), { vy: vel * rand(0.25, 0.5) })
      }
    }

    // pointer: ripples in the water, glowing footprints on the sand
    if (pointer && e - lastPoke > 40 && endFade === 0) {
      lastPoke = e
      const inWater = pointer.y < edgeY(pointer.x, t, wet) + 4
      if (inWater) ripple(pointer.x, pointer.y)
      for (let i = 0; i < (inWater ? 7 : 4); i++) {
        spark(pointer.x + rand(-8, 8), pointer.y + rand(-8, 8), { vx: rand(-25, 25), vy: rand(-25, 25), life: rand(0.8, 2.2) })
      }
    }

    for (const s of sparks) {
      s.vx *= 0.96
      s.vy *= 0.95
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt
    }
    sparks = sparks.filter((s) => s.life > 0)
    for (const r of ripples) r.age += dt
    ripples = ripples.filter((r) => r.age < r.life)

    // ---------- draw ----------
    ctx.globalAlpha = 1 - endFade
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, W, H)

    const sea = ctx.createLinearGradient(0, 0, 0, y0 + reach)
    sea.addColorStop(0, '#010409')
    sea.addColorStop(1, '#073049')
    ctx.fillStyle = sea
    ctx.fillRect(0, 0, W, H)

    // sand below the water's edge
    const edge = edgePath(t, reach)
    const sandShape = new Path2D(edge)
    sandShape.lineTo(W + STEP, H + 10)
    sandShape.lineTo(-STEP, H + 10)
    sandShape.closePath()
    const sand = ctx.createLinearGradient(0, y0, 0, H)
    sand.addColorStop(0, '#2c2619')
    sand.addColorStop(1, '#16130d')
    ctx.fillStyle = sand
    ctx.fill(sandShape)

    // wet sand left behind by the last wave
    if (wet > reach + 1) {
      const wetShape = new Path2D()
      xs.forEach((x, i) => (i ? wetShape.lineTo(x, edgeY(x, t, reach)) : wetShape.moveTo(x, edgeY(x, t, reach))))
      for (let i = xs.length - 1; i >= 0; i--) wetShape.lineTo(xs[i], edgeY(xs[i], t * 0.2, wet))
      wetShape.closePath()
      ctx.fillStyle = 'rgba(8, 30, 42, .6)'
      ctx.fill(wetShape)
    }

    ctx.globalCompositeOperation = 'lighter'

    // incoming swells
    ctx.lineWidth = 1.4
    for (let i = 0; i < 4; i++) {
      const s = (t * 0.16 + i / 4) % 1
      const y = s * (y0 + reach * 0.6) * 0.95
      ctx.strokeStyle = `hsla(190, 100%, 60%, ${s * s * 0.28 * (1 - endFade)})`
      ctx.beginPath()
      for (let x = -10; x <= W + 10; x += 10) {
        const yy = y + 4 * Math.sin(x * 0.025 + t * 1.2 + i)
        x === -10 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy)
      }
      ctx.stroke()
    }

    // moonlight glints on the water
    for (const g of glints) {
      if (g.y > edgeY(g.x, t, reach) - 6) continue
      const a = Math.max(0, Math.sin(t * 2.2 + g.ph)) ** 6 * 0.7
      if (a < 0.02) continue
      ctx.fillStyle = `rgba(190, 240, 255, ${a})`
      ctx.fillRect(g.x, g.y, 1.6, 1.6)
    }

    // glowing foam: wide soft halo → bright core
    for (const [dy, width, alpha] of [[-10, 26, 0.07], [-4, 12, 0.16], [0, 5, 0.38], [0, 1.8, 0.95]]) {
      ctx.lineWidth = width
      ctx.strokeStyle = `hsla(186, 100%, ${dy ? 55 : 72}%, ${alpha * energy})`
      ctx.stroke(dy ? edgePath(t, reach, dy) : edge)
    }

    for (const r of ripples) {
      if (r.age < 0) continue
      const k = r.age / r.life
      ctx.lineWidth = 2 * (1 - k) + 0.5
      ctx.strokeStyle = `hsla(186, 100%, 65%, ${(1 - k) * 0.7})`
      ctx.beginPath()
      ctx.ellipse(r.x, r.y, 4 + k * r.max, (4 + k * r.max) * 0.62, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    // plankton
    for (const s of sparks) {
      const k = s.life / s.max
      const tw = 0.55 + 0.45 * Math.sin(t * 7 + s.ph)
      const a = Math.min(1, k * 2.5) * tw
      if (s.sprite) {
        ctx.globalAlpha = a * (1 - endFade)
        const sz = 8 + s.size * 6
        ctx.drawImage(sprites[s.sprite], s.x - sz / 2, s.y - sz / 2, sz, sz)
        ctx.globalAlpha = 1 - endFade
      } else {
        ctx.fillStyle = `hsla(${s.hue}, 100%, ${s.light}%, ${a})`
        ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size)
      }
    }

    // the flush wave lights up the whole card
    const flash = Math.sin(Math.PI * endFade) * 0.35
    if (flash > 0) {
      ctx.fillStyle = `rgba(110, 235, 255, ${flash})`
      ctx.fillRect(0, 0, W, H)
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
  return { stop: () => cancelAnimationFrame(raf), setPointer: (p) => (pointer = p) }
}
