// Tiny canvas fireworks engine: rockets with ember trails, shells with
// gravity + air drag, tapered spark trails, flash, flicker and crackle.
// No dependencies. createShow() returns a stop() function.

const ROCKET_GRAVITY = 320 // px/s²
const STAGGER_MS = 480

const rand = (a, b) => a + Math.random() * (b - a)

// Burst points relative to the launch point (px), plus shell type and hue.
const SHELLS = [
  { x: -80, y: -150, type: 'peony', hue: 340 },
  { x: 75, y: -185, type: 'ring', hue: 200 },
  { x: -15, y: -110, type: 'willow', hue: 42 },
  { x: 95, y: -105, type: 'crackle', hue: 280 },
  { x: -95, y: -80, type: 'peony', hue: 150, core: 50 },
  { x: 30, y: -160, type: 'peony', hue: 10, core: 200 },
]

const FINALE = [
  { x: -90, y: -175, type: 'peony', hue: 320, core: 45 },
  { x: 90, y: -175, type: 'peony', hue: 190, core: 330 },
  { x: 0, y: -205, type: 'willow', hue: 42, big: true },
  { x: 0, y: -140, type: 'crackle', hue: 260 },
]

export function createShow(canvas, { shells = 5, dark = false, onEnd } = {}) {
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  // On a dark sky, overlapping light adds up like the real thing; on white it would wash out.
  const blend = dark ? 'lighter' : 'source-over'
  const lift = dark ? 10 : 0

  // Launch point = the button's center (the canvas is positioned so it lands here).
  const origin = { x: W / 2, y: H * 0.69 }

  const count = Math.min(shells, SHELLS.length)
  const schedule = [
    ...SHELLS.slice(0, count).map((s, i) => ({ ...s, at: i * STAGGER_MS })),
    ...FINALE.map((s, i) => ({ ...s, at: count * STAGGER_MS + 250 + i * 90 })),
  ]
  const lastLaunch = schedule[schedule.length - 1].at

  let rockets = []
  let sparks = []
  let flashes = []
  let elapsed = 0
  let next = 0
  let last = performance.now()
  let raf = 0

  function launch(s) {
    const h = -s.y
    const vy = -Math.sqrt(2 * ROCKET_GRAVITY * h)
    const t = -vy / ROCKET_GRAVITY
    rockets.push({ x: origin.x, y: origin.y, vx: s.x / t, vy, shell: s, wobble: rand(0, Math.PI * 2) })
  }

  function spark(x, y, angle, speed, o) {
    sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: o.life, maxLife: o.life,
      hue: o.hue + rand(-8, 8), sat: o.sat ?? 95, light: o.light ?? 55,
      drag: o.drag ?? 0.968, gravity: o.gravity ?? 90,
      size: o.size ?? 2, trail: [], trailLen: o.trailLen ?? 6,
      flicker: o.flicker ?? false, crackle: o.crackle ?? false,
    })
  }

  function explode(r) {
    const { x, y } = r
    const s = r.shell
    flashes.push({ x, y, life: 0.28, maxLife: 0.28, hue: s.hue, r: s.big ? 70 : 50 })

    if (s.type === 'willow') {
      const n = s.big ? 110 : 70
      for (let i = 0; i < n; i++) {
        spark(x, y, rand(0, Math.PI * 2), rand(60, s.big ? 240 : 190), {
          hue: s.hue, sat: 90, light: 52, life: rand(1.6, 2.2), drag: 0.95, gravity: 70,
          size: 1.6, trailLen: 14, flicker: true,
        })
      }
      return
    }

    if (s.type === 'ring') {
      const n = 60
      const tilt = rand(0.35, 0.6) // flattened ring looks like it's seen at an angle
      const rot = rand(0, Math.PI)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const sp = 150
        const lx = Math.cos(a) * sp
        const ly = Math.sin(a) * sp * tilt
        const vx = lx * Math.cos(rot) - ly * Math.sin(rot)
        const vy = lx * Math.sin(rot) + ly * Math.cos(rot)
        spark(x, y, Math.atan2(vy, vx), Math.hypot(vx, vy), { hue: s.hue, life: rand(1.1, 1.4), size: 2.2 })
      }
      return
    }

    // peony / crackle: points on a sphere projected to 2D → dense edge, filled center
    const n = s.type === 'crackle' ? 80 : 100
    for (let i = 0; i < n; i++) {
      const u = rand(-1, 1)
      const sp = 150 * Math.sqrt(1 - u * u) * rand(0.9, 1.08)
      spark(x, y, rand(0, Math.PI * 2), sp, {
        hue: s.hue, life: rand(1.1, 1.5), size: 2, trailLen: 8,
        crackle: s.type === 'crackle', flicker: s.type === 'crackle',
      })
    }
    if (s.core != null) {
      for (let i = 0; i < 35; i++) {
        spark(x, y, rand(0, Math.PI * 2), rand(25, 65), { hue: s.core, life: rand(0.8, 1.1), size: 1.8, trailLen: 4 })
      }
    }
  }

  function update(dt) {
    elapsed += dt * 1000
    while (next < schedule.length && elapsed >= schedule[next].at) launch(schedule[next++])

    for (const r of rockets) {
      r.vy += ROCKET_GRAVITY * dt
      r.wobble += dt * 20
      r.x += (r.vx + Math.sin(r.wobble) * 8) * dt
      r.y += r.vy * dt
      // ember trail
      spark(r.x, r.y, rand(0, Math.PI * 2), rand(5, 25), {
        hue: 38, sat: 95, light: 55, life: rand(0.25, 0.45), drag: 0.9, gravity: 60, size: 1.4, trailLen: 2,
      })
      if (r.vy >= -15) {
        r.done = true
        explode(r)
      }
    }
    rockets = rockets.filter((r) => !r.done)

    const born = []
    for (const p of sparks) {
      p.trail.push(p.x, p.y)
      if (p.trail.length > p.trailLen * 2) p.trail.splice(0, 2)
      const k = Math.pow(p.drag, dt * 60)
      p.vx *= k
      p.vy = p.vy * k + p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      if (p.crackle && p.life <= 0) {
        // glitter pops at the end of a crackle spark
        for (let i = 0; i < 3; i++) {
          born.push({
            x: p.x, y: p.y, vx: rand(-60, 60), vy: rand(-60, 60), life: 0.18, maxLife: 0.18,
            hue: 45, sat: 100, light: 60, drag: 0.85, gravity: 0, size: 1.4, trail: [], trailLen: 1,
          })
        }
      }
    }
    sparks = sparks.filter((p) => p.life > 0).concat(born)

    for (const f of flashes) f.life -= dt
    flashes = flashes.filter((f) => f.life > 0)
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)
    ctx.globalCompositeOperation = blend

    for (const f of flashes) {
      const t = f.life / f.maxLife
      const r = f.r * (1.6 - t)
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r)
      g.addColorStop(0, `hsla(${f.hue}, 100%, 85%, ${(dark ? 0.5 : 0.3) * t})`)
      g.addColorStop(1, `hsla(${f.hue}, 100%, 70%, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.lineCap = 'round'
    for (const p of sparks) {
      const t = p.life / p.maxLife // 1 → 0
      let a = t < 0.35 ? t / 0.35 : 1
      if (p.flicker && t < 0.5 && Math.random() < 0.45) a *= 0.15
      // freshly-burst sparks are lighter, then settle into their color
      const light = p.light + lift + Math.max(0, t - 0.8) * 60
      const color = `hsla(${p.hue}, ${p.sat}%, ${light}%, `

      const tr = p.trail
      if (tr.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(tr[0], tr[1])
        for (let i = 2; i < tr.length; i += 2) ctx.lineTo(tr[i], tr[i + 1])
        ctx.lineTo(p.x, p.y)
        ctx.strokeStyle = color + a * 0.35 + ')'
        ctx.lineWidth = p.size * 0.7
        ctx.stroke()
        // brighter, thicker half near the head → tapered trail
        const mid = Math.max(0, tr.length - Math.ceil(tr.length / 2 / 2) * 2)
        ctx.beginPath()
        ctx.moveTo(tr[mid], tr[mid + 1])
        ctx.lineTo(p.x, p.y)
        ctx.strokeStyle = color + a * 0.8 + ')'
        ctx.lineWidth = p.size
        ctx.stroke()
      }
      ctx.fillStyle = color + a + ')'
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 0.75, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05) // clamp so a background tab doesn't explode the sim
    last = now
    update(dt)
    draw()
    const finished = next >= schedule.length && elapsed > lastLaunch && !rockets.length && !sparks.length && !flashes.length
    if (finished) {
      onEnd?.()
      return
    }
    raf = requestAnimationFrame(frame)
  }

  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}
