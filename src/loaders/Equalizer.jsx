import './Equalizer.css'

export default function Equalizer() {
  return (
    <div className="eq">
      {Array.from({ length: 7 }).map((_, i) => (
        <span key={i} style={{ animationDelay: `${i * -0.13}s` }} />
      ))}
    </div>
  )
}
