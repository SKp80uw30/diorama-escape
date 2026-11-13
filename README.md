# Diorama Escape

A world of miniature dioramas. Each one is a small escape room: find the way out and the next diorama unlocks.

## Run

```bash
npm install
npm run build        # bundles to dist/ (add -- --minify for release)
npm run serve        # http://127.0.0.1:5300/
npm test             # puzzle rules + solver: proves every level can be finished
npm run qa           # plays every level in a real browser with pointer drags, saves qa/shots/
```

`dist/diorama-escape.html` is the whole game in one file.

## Controls

Drag empty space with one finger to turn the diorama, drag with two fingers to slide the view up, down, left or right, and pinch to zoom. With a mouse: left-drag turns, right-drag slides, the wheel zooms. `R` resets the view. Press on a loose object to pick it up, drag to carry it, release to drop it; release while moving to throw it.

## Layout

| Folder | What it is |
|---|---|
| `src/engine/` | Rendering modules from the [diorama kit](https://github.com/sloemo01/diorama) (MIT): hero camera, orbit, lighting, pixel post-pass. Only `palette.js` is changed. |
| `src/game/` | The game layer: `physics.js` (cannon-es wrapper), `grab.js` (pick up / carry / throw), `puzzle.js` (declarative rules + solver), `kit.js` (level building helpers), `hud.js`, `save.js`, `registry.js`. |
| `src/levels/<id>/` | One folder per diorama: `puzzle.js` (rules as data), `scene.js` (geometry and behaviour), `level.js` (metadata). |

## Add a level

1. Create `src/levels/<id>/` with `puzzle.js`, `scene.js` and `level.js` (copy `tennis/`).
2. Add it to `LEVELS` in `src/game/registry.js`.
3. Add its puzzle to `LEVEL_PUZZLES` in `test/puzzle.test.mjs` so the solver checks it.

A puzzle is a list of rules. Physical events (`an item entered a zone`) go in; state changes and named effects come out, and the scene reacts to the effects:

```js
{ on: 'enter', zone: 'hopper', tag: 'ball', do: [['fx', 'consume'], ['inc', 'balls']] },
{ when: { gte: ['balls', 3] },              do: [['set', 'fired'], ['fx', 'fire']] },
```

Two effects are built in: `consume` removes the item that triggered the rule and `['fx', 'hint', 'text']` changes the hint line. Every other effect name calls `fx.<name>(payload, state, event)` in the level's scene. The kit also gives scenes `tween`, `cage`, `part` and `remove` for moving props.

## Levels

1. **Centre Court** (playable): load three balls into the ball machine; it knocks the gate key off the floodlight.
2. **The Ancient Museum** (playable): each relic belongs on the plinth of its colour. Two relics open the display case, the scarab opens the sarcophagus, and the sun disc inside opens the door.
3. **The Jungle Temple** (playable): the stone face needs both jade eyes. Light the torch at the campfire and burn the vines for one; put the carved stone on the pressure plate to drop the cage for the other.

## Credits

Rendering kit by Nehal Kanak / Sloemo01 (MIT, see `src/engine/LICENSE-diorama-kit`). Shell and level-registry structure inspired by AmirMushich's pixel-plays. Physics by cannon-es.
