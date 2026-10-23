// Tiny canvas rain + lightning engine. No dependencies.
// Rain ramps up, holds, then eases off by `duration` ms. Bolts strike at the `strikes` times (ms).
// createStorm() returns a stop() function.

const WIND = 0.2 // horizontal drift as a fraction of fall speed
const rand = (a, b) => a + Math.random() * (b - a)
const smooth = (t) => t * t * (3 - 2 * t)

// Midpoint displacement → a jagged, natural-looking bolt.
function boltPath(x0, y0, x1, y1, disp, depth) {
  let pts = [[x0, y0], [x1, y1]]
  for (let i = 0; i < depth; i++) {
    const next = []
    for (let j = 0; j < pts.length - 1; j++) {
      const [ax, ay] = pts[j]
      const [bx, by] = pts[j + 1]
      next.push(pts[j], [(ax + bx) / 2 + rand(-disp, disp), (ay + by) / 2 + rand(-disp * 0.3, disp * 0.3)])
    }
    next.push(pts[pts.length - 1])
    pts = next
    disp /= 2
  }
  return pts
}

export function createStorm(canvas, { duration = 6000, strikes = [], onStrike } = {}) {
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const groundY = H * 0.84
  const MAX = Math.round((W * H) / 1100)
  let drops = []
  let splashes = []
  let ripples = []
  let bolts = []
  let nextStrike = 0
  const start = performance.now()
  let last = start
  let raf = 0

  const intensity = (e) => smooth(Math.min(e / 1000, 1)) * smooth(Math.min(Math.max((duration - e) / 1300, 0), 1))

  function spawnDrop(anywhere) {
    const r = Math.random()
    const layer = r < 0.45 ? 0 : r < 0.8 ? 1 : 2 // far, mid, near
    const speed = [520, 700, 920][layer] * rand(0.9, 1.1)
    return {
      x: rand(-80, W + 10),
      y: anywhere ? rand(H * 0.1, groundY) : rand(H * 0.04, H * 0.14), // born under the cloud base
      len: [9, 14, 22][layer] * rand(0.8, 1.2),
      speed, layer,
      stopY: groundY - [16, 7, 0][layer] + rand(-3, 3), // far drops land higher → depth
      a: [0.22, 0.38, 0.6][layer],
    }
  }

  function strike() {
    const x0 = rand(W * 0.2, W * 0.8)
    const x1 = x0 + rand(-70, 70)
    const main = boltPath(x0, H * 0.17, x1, groundY, 55, 6)
    const branches = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => {
      const k = Math.floor(rand(main.length * 0.2, main.length * 0.6))
      const [bx, by] = main[k]
      return boltPath(bx, by, bx + rand(-90, 90), by + rand(60, 130), 22, 4)
    })
    bolts.push({ main, branches, x: x1, age: 0 })
    onStrike?.()
  }

  // flicker: flash, dip, flash again, then fade
  const boltAlpha = (age) => (age < 0.06 ? 1 : age < 0.1 ? 0.25 : age < 0.17 ? 1 : Math.max(0, 1 - (age - 0.17) / 0.3))

  function line(pts) {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.stroke()
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    const e = now - start
    const target = MAX * intensity(e)

    // spawn gradually so the rain builds instead of appearing at once
    for (let n = 0; drops.length < target && n < 10; n++) drops.push(spawnDrop(drops.length === 0 && e < 50))

    while (nextStrike < strikes.length && e >= strikes[nextStrike]) {
      strike()
      nextStrike++
    }

    const kept = []
    for (const d of drops) {
      d.y += d.speed * dt
      d.x += d.speed * WIND * dt
      if (d.y >= d.stopY) {
        if (d.layer > 0) {
          for (let i = 0; i < d.layer + 1; i++) {
            splashes.push({ x: d.x, y: d.stopY, vx: rand(-55, 55), vy: rand(-150, -60), life: 0.3, a: d.a })
          }
          if (d.layer === 2 || Math.random() < 0.3) ripples.push({ x: d.x, y: d.stopY + 2, life: 0.5, max: d.layer === 2 ? 10 : 6 })
        }
        if (kept.length < target) kept.push(spawnDrop(false)) // recycle while the storm is strong
      } else kept.push(d)
    }
    drops = kept

    for (const s of splashes) {
      s.vy += 600 * dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt
    }
    splashes = splashes.filter((s) => s.life > 0)
    for (const r of ripples) r.life -= dt
    ripples = ripples.filter((r) => r.life > 0)
    for (const b of bolts) b.age += dt
    bolts = bolts.filter((b) => b.age < 0.5)

    // ---- draw ----
    ctx.clearRect(0, 0, W, H)

    ctx.lineCap = 'round'
    for (const d of drops) {
      ctx.strokeStyle = `rgba(185, 205, 240, ${d.a})`
      ctx.lineWidth = d.layer === 2 ? 1.6 : d.layer === 1 ? 1.1 : 0.8
      ctx.beginPath()
      ctx.moveTo(d.x, d.y)
      ctx.lineTo(d.x - d.len * WIND, d.y - d.len)
      ctx.stroke()
    }

    ctx.fillStyle = 'rgba(200, 215, 245, .7)'
    for (const s of splashes) {
      ctx.globalAlpha = Math.max(0, s.life / 0.3) * s.a * 1.4
      ctx.fillRect(s.x - 0.8, s.y - 0.8, 1.6, 1.6)
    }
    ctx.globalAlpha = 1

    ctx.lineWidth = 1
    for (const r of ripples) {
      const t = 1 - r.life / 0.5
      ctx.strokeStyle = `rgba(190, 210, 245, ${(1 - t) * 0.45})`
      ctx.beginPath()
      ctx.ellipse(r.x, r.y, 1 + t * r.max, 0.4 + t * r.max * 0.28, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    for (const b of bolts) {
      const a = boltAlpha(b.age)
      // sky flash + glow where it hits the ground
      ctx.fillStyle = `rgba(205, 215, 255, ${a * 0.32})`
      ctx.fillRect(0, 0, W, H)
      const g = ctx.createRadialGradient(b.x, groundY, 0, b.x, groundY, 90)
      g.addColorStop(0, `rgba(210, 220, 255, ${a * 0.55})`)
      g.addColorStop(1, 'rgba(210, 220, 255, 0)')
      ctx.fillStyle = g
      ctx.fillRect(b.x - 90, groundY - 90, 180, 180)

      ctx.save()
      ctx.shadowBlur = 18
      ctx.shadowColor = 'rgba(165, 180, 252, 1)'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = `rgba(255, 255, 255, ${a})`
      ctx.lineWidth = 2.6
      line(b.main)
      ctx.lineWidth = 1.2
      ctx.strokeStyle = `rgba(230, 235, 255, ${a * 0.85})`
      b.branches.forEach(line)
      ctx.restore()
    }

    const finished = e > duration && !drops.length && !splashes.length && !ripples.length && !bolts.length
    if (finished) {
      ctx.clearRect(0, 0, W, H)
      return
    }
    raf = requestAnimationFrame(frame)
  }

  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}
