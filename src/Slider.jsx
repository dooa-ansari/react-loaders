import { useEffect, useRef, useState } from 'react'

/** Center-focused card carousel: arrows, dots, ← → keys and swipe. */
export default function Slider({ slides }) {
  const [index, setIndex] = useState(0)
  const drag = useRef(null)
  const go = (i) => setIndex(Math.max(0, Math.min(slides.length - 1, i)))

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(slides.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  const onPointerDown = (e) => (drag.current = e.clientX)
  const onPointerUp = (e) => {
    if (drag.current == null) return
    const dx = e.clientX - drag.current
    drag.current = null
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
  }

  return (
    <div className="slider">
      <div className="slider__viewport" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div className="slider__track" style={{ '--i': index }}>
          {slides.map((s, i) => (
            <section
              key={s.name}
              className={`slide slide--${s.theme} ${s.bg} ${i === index ? 'is-active' : ''}`}
              onClick={i === index ? undefined : () => go(i)}
              aria-hidden={i !== index}
            >
              <header className="slide__tag">
                #{String(i + 1).padStart(2, '0')} · {s.name}
              </header>
              <div className="slide__stage">{s.render()}</div>
            </section>
          ))}
        </div>
      </div>

      <nav className="slider__nav">
        <button className="slider__arrow" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous">←</button>
        <div className="slider__dots">
          {slides.map((s, i) => (
            <button key={s.name} className={`slider__dot ${i === index ? 'is-active' : ''}`} onClick={() => go(i)} aria-label={s.name} />
          ))}
        </div>
        <button className="slider__arrow" onClick={() => go(index + 1)} disabled={index === slides.length - 1} aria-label="Next">→</button>
      </nav>
    </div>
  )
}
