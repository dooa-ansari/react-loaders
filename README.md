# ✨ React Loaders

**10 loading animations where the button *becomes* the animation.**
Click it and it turns into glowing dust, a shooting star, a beating heart, a thunderstorm… then shows your result.

Zero dependencies. Just React + CSS (and a tiny canvas engine for the glowing ones). Copy a folder, use it.

## 🎬 The loaders

| # | Loader | What happens |
|---|--------|--------------|
| 01 | **Glow Dust** | The button dissolves into ~1,100 rainbow particles that swirl in the wind, **follow your cursor/finger**, then gather into a glowing ✓ |
| 02 | **Glow Shore** | A droplet falls into a bioluminescent sea; glowing waves break on the beach, **touch the water** to make ripples, then a wave flushes the screen |
| 03 | **Shooting Star** | The button becomes a star and launches; a meteor shower follows, **swipe to fling your own stars**, then a ✓ constellation draws itself |
| 04 | **Heartbeat** | The button morphs into a heart that beats lub-dub with a color-cycling ECG line, then bursts into particles |
| 05 | **Fireworks** | Rockets launch from the button: peonies, rings, willows, crackles and a rainbow finale, with real physics |
| 06 | **Cat & Mouse** | A mouse pops out of the button and a cat chases it for a few laps… then pounces. *Gotcha!* |
| 07 | **Savanna Sunset** | The button becomes the sun and sets right behind a giraffe's head |
| 08 | **Flower Bloom** | The button becomes a seed; grass grows and seven flowers bloom while a butterfly flies by |
| 09 | **Thunderstorm** | The button floats up into storm clouds: rain, lightning, thunder shake, then a rainbow |
| 10 | **Coin Rush** | A retro platformer: a pixel robot bonks a `{ }` block and runs through a level collecting coins |

## 🚀 Run the gallery

```bash
npm install
npm run dev
```

Swipe between cards (or use ← → keys), click a button, and play with the interactive ones.

## 📦 Use one in your app

Every loader lives in its own folder in [`src/loaders/`](src/loaders). Copy the folder into your project and import it:

```jsx
import GlowDust from './GlowDust/GlowDust'

export default function TrainButton() {
  return (
    <div style={{ position: 'relative', width: 420, height: 600, background: '#0b0720' }}>
      <GlowDust label="Train model" onComplete={() => console.log('done!')}>
        {(reset) => (
          <div>
            Model trained ✓ <button onClick={reset}>Replay</button>
          </div>
        )}
      </GlowDust>
    </div>
  )
}
```

**Shared props (every loader)**

| Prop | Type | What it does |
|------|------|--------------|
| `label` | `string` | The button text |
| `onComplete` | `() => void` | Called when the animation finishes |
| `children` | `node` or `(reset) => node` | What to show when it's done. Use the function form to get a `reset()` for a replay button |

**Extra props**

| Loader | Prop | Default |
|--------|------|---------|
| Heartbeat | `beats`: number of heartbeats | `5` |
| Fireworks | `shells`: rockets before the finale (1–6) | `5` |
| Fireworks | `dark`: additive glow for dark backgrounds | `false` |
| Cat & Mouse | `laps`: laps before the pounce | `3` |
| Savanna Sunset | `setMs`: how long the sun takes to set | `4200` |

**Sizing:** Heartbeat, Fireworks and Cat & Mouse have a fixed size. All the others are full scenes that **fill their parent**, so give the parent a size and `position: relative`.

## ➕ Add your own

1. Create `src/loaders/MyLoader/MyLoader.jsx` + `MyLoader.css`
2. Add an entry to the `DEMOS` list in [`src/App.jsx`](src/App.jsx) (name, theme, background, render)

PRs with new loaders are very welcome!

## ⭐ Like it?

If one of these made you smile, **star the repo**. It really helps more people find it.

## License

[MIT](LICENSE)
