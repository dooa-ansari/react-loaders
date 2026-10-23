import './Dna.css'

export default function Dna() {
  return (
    <div className="dna">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} style={{ "--d": `${i * -0.15}s` }} />
      ))}
    </div>
  )
}
