import './InfinityLoop.css'

const PATH = 'M20 30C20 8 48 8 60 30S100 52 100 30 72 8 60 30 20 52 20 30Z'

export default function InfinityLoop() {
  return (
    <svg className="inf" viewBox="0 0 120 60">
      <path className="inf__track" d={PATH} />
      <path className="inf__snake" d={PATH} pathLength="100" />
    </svg>
  )
}
