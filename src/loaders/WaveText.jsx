import './WaveText.css'

export default function WaveText() {
  return (
    <div className="wtext">
      {"LOADING".split("").map((c, i) => (
        <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>{c}</span>
      ))}
    </div>
  )
}
