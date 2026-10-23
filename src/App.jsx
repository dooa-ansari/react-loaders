import { useEffect, useState } from 'react'
import { loaders } from './loaders'

const REPO_URL = 'https://github.com/YOUR_USERNAME/react-loaders'

function CopyButton({ label, text }) {
  const [copied, setCopied] = useState(false)
  const copy = async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return (
    <button className="btn" onClick={copy}>
      {copied ? 'Copied ✓' : label}
    </button>
  )
}

function Card({ loader, index, onOpen }) {
  const { Component, title, jsx, css } = loader
  return (
    <article className="card" onClick={onOpen}>
      <span className="card__num">#{String(index + 1).padStart(2, '0')}</span>
      <div className="card__stage">
        <Component />
      </div>
      <footer className="card__footer">
        <h3>{title}</h3>
        <div className="card__actions">
          <CopyButton label="JSX" text={jsx} />
          <CopyButton label="CSS" text={css} />
        </div>
      </footer>
    </article>
  )
}

function Spotlight({ loader, onClose, onStep }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onStep(1)
      if (e.key === 'ArrowLeft') onStep(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onStep])

  const { Component, title } = loader
  return (
    <div className="spotlight" onClick={onClose}>
      <div className="spotlight__stage">
        <Component />
      </div>
      <p className="spotlight__title">{title}</p>
      <p className="spotlight__hint">← → to browse · Esc to close</p>
    </div>
  )
}

export default function App() {
  const [open, setOpen] = useState(null)
  const step = (d) => setOpen((i) => (i + d + loaders.length) % loaders.length)

  return (
    <>
      <header className="hero">
        <h1>
          <span className="grad">{loaders.length}</span> React Loaders
        </h1>
        <p>Pure CSS. Zero dependencies. Click a card to go fullscreen, or copy the code straight into your app.</p>
        <a className="star" href={REPO_URL} target="_blank" rel="noreferrer">
          ★ Star on GitHub
        </a>
      </header>

      <main className="grid">
        {loaders.map((l, i) => (
          <Card key={l.name} loader={l} index={i} onOpen={() => setOpen(i)} />
        ))}
      </main>

      <footer className="foot">Made with React + CSS keyframes · MIT</footer>

      {open !== null && (
        <Spotlight loader={loaders[open]} onClose={() => setOpen(null)} onStep={step} />
      )}
    </>
  )
}
