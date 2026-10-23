import HeartbeatButton from './loaders/HeartbeatButton/HeartbeatButton'
import Fireworks from './loaders/Fireworks/Fireworks'
import CatChase from './loaders/CatChase/CatChase'
import SavannaSunset from './loaders/SavannaSunset/SavannaSunset'
import FlowerBloom from './loaders/FlowerBloom/FlowerBloom'
import Thunderstorm from './loaders/Thunderstorm/Thunderstorm'
import CoinRush from './loaders/CoinRush/CoinRush'
import GlowDust from './loaders/GlowDust/GlowDust'
import GlowShore from './loaders/GlowShore/GlowShore'
import ShootingStar from './loaders/ShootingStar/ShootingStar'
import Slider from './Slider'

function ResultCard({ title, rows, onReplay }) {
  return (
    <div className="result">
      <div className="result__head">
        <span className="result__check">✓</span>
        <h2>{title}</h2>
      </div>
      <dl className="result__rows">
        {rows.map(([k, v, ok]) => (
          <div key={k} className="result__row">
            <dt>{k}</dt>
            <dd className={ok ? 'ok' : undefined}>{v}</dd>
          </div>
        ))}
      </dl>
      <button className="replay" onClick={onReplay}>↻ Replay</button>
    </div>
  )
}

const DEMOS = [
  {
    name: 'Glow Dust',
    theme: 'dark',
    bg: 'bg-cosmos',
    render: () => (
      <GlowDust label="Train model">
        {(reset) => (
          <ResultCard
            title="Model trained"
            rows={[['accuracy', '98.7%', true], ['epochs', '12'], ['loss', '0.031'], ['params', '1.2M']]}
            onReplay={reset}
          />
        )}
      </GlowDust>
    ),
  },
  {
    name: 'Glow Shore',
    theme: 'dark',
    bg: 'bg-shore',
    render: () => (
      <GlowShore label="Flush cache">
        {(reset) => (
          <ResultCard
            title="Cache flushed"
            rows={[['keys purged', '48,211', true], ['edge nodes', '312'], ['hit rate', 'warming up'], ['time', '1.4s']]}
            onReplay={reset}
          />
        )}
      </GlowShore>
    ),
  },
  {
    name: 'Shooting Star',
    theme: 'dark',
    bg: 'bg-starry',
    render: () => (
      <ShootingStar label="Ship release">
        {(reset) => (
          <ResultCard
            title="Released v2.0.0"
            rows={[['github stars', '+1,024 ⭐', true], ['commits', '37'], ['contributors', '6'], ['status', 'live', true]]}
            onReplay={reset}
          />
        )}
      </ShootingStar>
    ),
  },  {
    name: 'Heartbeat',
    theme: 'light',
    bg: 'bg-rose',
    render: () => (
      <HeartbeatButton label="Fetch data" beats={5}>
        {(reset) => (
          <ResultCard
            title="Loaded successfully"
            rows={[['GET /api/user', '200 OK', true], ['time', '4.8s'], ['payload', '12.4 kB'], ['cache', 'miss → stored']]}
            onReplay={reset}
          />
        )}
      </HeartbeatButton>
    ),
  },
  {
    name: 'Fireworks',
    theme: 'dark',
    bg: 'bg-night',
    render: () => (
      <Fireworks label="Deploy" shells={5} dark>
        {(reset) => (
          <ResultCard
            title="Deployed to production"
            rows={[['build', 'passed', true], ['tests', '128 / 128', true], ['bundle', '48.2 kB'], ['url', 'app.example.com']]}
            onReplay={reset}
          />
        )}
      </Fireworks>
    ),
  },
  {
    name: 'Cat & Mouse',
    theme: 'light',
    bg: 'bg-cream',
    render: () => (
      <CatChase label="Catch bugs" laps={3}>
        {(reset) => (
          <ResultCard
            title="All bugs caught"
            rows={[['tests', '128 passed', true], ['bugs caught', '1 🐭', true], ['flaky', '0'], ['coverage', '94%']]}
            onReplay={reset}
          />
        )}
      </CatChase>
    ),
  },
  {
    name: 'Savanna Sunset',
    theme: 'warm',
    bg: 'bg-sunset',
    render: () => (
      <SavannaSunset label="Run migration" setMs={4200}>
        {(reset) => (
          <ResultCard
            title="Migration complete"
            rows={[['tables', '42 migrated', true], ['rows', '1.2M'], ['duration', '6.8s'], ['downtime', '0s', true]]}
            onReplay={reset}
          />
        )}
      </SavannaSunset>
    ),
  },
  {
    name: 'Flower Bloom',
    theme: 'light',
    bg: 'bg-meadow',
    render: () => (
      <FlowerBloom label="npm install">
        {(reset) => (
          <ResultCard
            title="Dependencies installed"
            rows={[['added', '248 packages', true], ['vulnerabilities', '0', true], ['time', '5.9s'], ['size', '38.6 MB']]}
            onReplay={reset}
          />
        )}
      </FlowerBloom>
    ),
  },
  {
    name: 'Thunderstorm',
    theme: 'dark',
    bg: 'bg-storm',
    render: () => (
      <Thunderstorm label="Run load test">
        {(reset) => (
          <ResultCard
            title="Load test passed"
            rows={[['requests', '1,000,000', true], ['peak', '12.4k req/s'], ['p99 latency', '118 ms'], ['errors', '0', true]]}
            onReplay={reset}
          />
        )}
      </Thunderstorm>
    ),
  },
  {
    name: 'Coin Rush',
    theme: 'light',
    bg: 'bg-retro',
    render: () => (
      <CoinRush label="Press Start">
        {(reset) => (
          <ResultCard
            title="Sync complete"
            rows={[['files synced', '22 / 22', true], ['score', '2,200'], ['conflicts', '0', true], ['time', '4.9s']]}
            onReplay={reset}
          />
        )}
      </CoinRush>
    ),
  },
]

export default function App() {
  return (
    <main className="page">
      <Slider slides={DEMOS} />
    </main>
  )
}
