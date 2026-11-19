# Diorama Escape

A world of miniature dioramas. Each one is a small escape room: find the way out and the next diorama unlocks.

## Run

```bash
npm install
npm run build        # bundles to dist/ (add -- --minify for release)
npm run serve        # http://127.0.0.1:5300/
npm test             # every level built headlessly and played to the win from its own solution
npm run qa           # real browser, real input: drags, throws, taps, and the camera gestures on every level
node qa/levels.mjs   # renders every level's start and finished state to qa/shots/
```

`dist/diorama-escape.html` is the whole game in one file.

## Controls

The same on every level (defined once in `src/game/view.js`, checked on every level by `qa/controls.mjs`): one finger on empty space orbits, two fingers drag to move the view and pinch to zoom (mouse: left-drag orbits, right-drag moves, wheel zooms), `R` resets the view. Press on a loose object to pick it up and drag to carry it: it hovers just above whatever is under your finger, so you can set things on desks, towers and pedestals. Release to drop it; release while moving to throw it (fast throws lob upward). Tap switches, wheels, drawers and buttons to use them.

## Layout

| Folder | What it is |
|---|---|
| `src/engine/` | Rendering modules from the [diorama kit](https://github.com/sloemo01/diorama) (MIT): hero camera, orbit, lighting, pixel post-pass. Only `palette.js` is changed. |
| `src/game/` | The game layer: `physics.js` (cannon-es wrapper, per-level gravity), `grab.js` (pick up / carry / throw), `puzzle.js` (declarative rules + solver), `session.js` (one running level: routes events through the rules), `autoplay.js` (plays a level from its solution), `kit.js` (level building helpers, tappable switches), `particles.js`, `hud.js`, `save.js`, `registry.js`. |
| `src/levels/<id>/` | One folder per diorama: `puzzle.js` (rules as data), `scene.js` (geometry and behaviour), `level.js` (metadata). |

## Add a level

1. Create `src/levels/<id>/` with `puzzle.js`, `scene.js` and `level.js` (copy `tennis/`).
2. Add it to `LEVELS` in `src/game/registry.js`.
3. Run `npm test`: it builds the new level, solves its puzzle and plays the solution through the real scene, so a missing zone, switch, item or effect fails straight away.

A puzzle is a list of rules. Physical events (`an item entered a zone`) go in; state changes and named effects come out, and the scene reacts to the effects:

```js
{ on: 'enter', zone: 'hopper', tag: 'ball', do: [['fx', 'consume'], ['inc', 'balls']] },
{ when: { gte: ['balls', 3] },              do: [['set', 'fired'], ['fx', 'fire']] },
{ on: 'tap', target: 'wheel', when: { not: 'power' }, do: [['say', "It won't budge."]] },
```

## Levels

1. **Centre Court**: load three balls into the ball machine; it knocks the gate key off the floodlight.
2. **Underwater City**: drop the anchor on the giant clam, put its pearl in the beacon to power the city, turn the airlock wheel. Slow, floaty underwater physics.
3. **Cloud Castles**: ring the bell tower with a pebble to wake the sleepy cloud, then set the red, yellow and blue crystals on their pedestals. Drop something into the gaps between islands and it falls away.
4. **The Skyscraper**: paper from the filing cabinet, ink from behind the AC unit, the printer prints a keycard, the keycard opens the caged launch console, fireworks.
5. **Hot Air Balloons**: move three sandbags to the ballast pile, put the gas canister (behind the shed) in the basket, untie the tether once the balloon inflates.
6. **The Ancient Museum** (planned)
7. **The Jungle Temple** (planned)

## Credits

Rendering kit by Nehal Kanak / Sloemo01 (MIT, see `src/engine/LICENSE-diorama-kit`). Shell and level-registry structure inspired by AmirMushich's pixel-plays. Physics by cannon-es.
