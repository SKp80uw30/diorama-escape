---
name: new-level
description: Design, build, test and publish a new Diorama Escape level (a miniature escape-room scene with a chain of puzzles). Use when the owner asks for a new level, diorama, world or theme, or to rework an existing level's puzzle.
---

# Making a Diorama Escape level

Read `CLAUDE.md` first. Navigation and input (`src/game/input.js`, `src/game/grab.js`, the input wiring in
`src/main.js`) are locked: a level never needs to touch them. Levels are three small files plus a few checks.

## The loop

1. **Design the chain on paper first.** Five or six steps is the sweet spot. Each step should look different from the
   last. Write it as: *thing → place → what changes → what that reveals.* Tell the owner the chain in a short list
   before building. Good chains end with a carried item going to one exit zone.
2. **Scaffold:** `node scripts/new-level.mjs <id> "<Title>"`. It creates `src/levels/<id>/` (a working one-step level),
   registers it last in `src/game/registry.js`, adds it to the solver test and bumps the build label in `hud.js`.
3. **Write `puzzle.js` first** (rules as data, see below), then `npm test`. The solver must find a winning order.
   Add one or two tests for the "wrong thing in the wrong place does nothing" cases (see `test/puzzle.test.mjs`).
4. **Write `scene.js`.** `node build.mjs && node qa/look.mjs <id>` saves a screenshot and prints where every loose item
   and trigger zone ended up. Look at it, fix, repeat. `--phone` shows the phone framing; extra args pick a camera
   angle (`node qa/look.mjs <id> 0 0.6`).
5. **Let the robot play it:** `node qa/bot.mjs <id>` solves the puzzle with real mouse drags from several camera angles.
6. **Add the level's hand-written steps to `qa/play.mjs`** (it plays every level in order through the win card; copy the
   previous level's block). This is where you assert the things the robot cannot: a hidden item is *not* grabbable from
   the front, a wrong drop is refused, "one of two is not enough". Add the level to the `unlocked` lists in that file.
7. **Update the README level list**, run `npm test`, `npm run qa` and `node qa/touchfuzz.mjs` (both slow, run them in
   the background; a full `qa` run takes several minutes).
8. **Publish a test build for the owner:** `node build.mjs --minify`, then publish `dist/diorama-escape.artifact.html`
   with the Artifact tool, to the same URL as before when one exists (read it first). Say which build label to look
   for in the Worlds menu. Do not call a level done until the owner has played it.
9. Commit and push the feature branch. `main` only changes when the owner asks.

## puzzle.js: rules as data

```js
export default {
  items: { key: { count: 1 }, gem: { count: 1, requires: 'boxOpen' } },   // everything carryable; requires = flag
  rules: [
    { on: 'enter', zone: 'lock', tag: 'key', do: [['fx', 'consume'], ['set', 'boxOpen'], ['fx', 'openBox']] },
    { on: 'enter', zone: 'door', tag: 'gem', when: { flag: 'boxOpen' }, do: [['fx', 'consume'], ['win']] },
    { when: { gte: ['balls', 3] }, do: [['fx', 'fire']] },        // no `on`: fires once as soon as `when` holds
  ],
};
```

- Events are only "item with tag T came to rest or fell into zone Z while not held". Nothing else exists.
- `when`: `{ flag }`, `{ not }`, `{ gte: [counter, n] }`. Actions: `set`, `inc`, `fx`, `win`.
- `fx` effects: `consume` (removes the dropped item) and `hint` (`['fx', 'hint', 'text']` changes the hint line) are
  built in. Any other name calls `fx.<name>(payload, state, event)` in the scene; `event.item` is the dropped item.
- Zone names are free text; put them in the rule and the scene, and keep them identical. A rule with the wrong tag or
  zone is silently refused, which is exactly what you want for "wrong thing" cases.
- Several "match this to that" rules read cleanly as a generated list (see `concert/puzzle.js`).
- Retag an item mid-level by assigning `ev.item.tag = 'flame'` in an fx handler (the torch in the jungle).
- Items that should not exist yet: give them `requires`, and in the scene create them (`item(...)`) only inside the fx
  that follows that flag. The solver and `qa/bot.mjs` both respect `requires`.

## scene.js: the kit (`ctx`)

| Call | Does |
|---|---|
| `ctx.slab(hx, hz, topColor, edgeColor)` | the board, ground collider and invisible walls. Call first. |
| `box(w,h,d,color,x,y,z,opts)` / `cyl(rTop,rBottom,h,color,x,y,z,opts)` | scenery. `{ solid: true }` adds a collider. `{ occlude: false }` lets you see and reach through it (rails, ropes, decals). `{ shadow: false }` for things lying flat. |
| `ctx.solid(w,h,d,x,y,z)` | invisible collider; returns the body. Remove with `physics.removeStatic(body)`. |
| `zone(id, [x0,y0,z0], [x1,y1,z1])` | trigger volume. Make it tall (top at least 2.5-3.5): the player releases items from carry height ≈ 2.8 and they must fall *into* it. |
| `item(mesh, { tag, shape, mass, soft, lift, upright, grabbable, velocity })` | a loose object. `shape` is `{ sphere: r }` or `{ box: [w,h,d] }`, and must roughly match the mesh. |
| `ball(r, color, x, y, z)` | convenience tennis-style ball. |
| `part(geometry, color, x, y, z, parent, { emissive })` | a bare mesh (item parts, moving props, glowing things). |
| `mat(color, { emissive })` | shared material. Swap `mesh.material = mat(...)` to light something up. |
| `tween(seconds, (eased, linear) => {}, done, delay)` | animate anything. Fire-and-forget. `tween(0, null, fn, delay)` is a timer. |
| `cage(x, y, z, w, h, color)` | bars around something visible but untouchable; `cage.open(done)` retracts them. |
| `burst(x, y, z, colors, count, reach)` | confetti / splinter puff. |
| `ctx.remove(obj)` | removes a mesh and its colliders and its line-of-sight blocking. |

`build(ctx)` returns `{ update(dt, t, state), fx: { name(payload, state, event) } }`. Everything (rules, items, zones)
is rebuilt on Restart; keep scene state in closure variables, never in module scope.

Item options worth knowing: `soft: true` for anything that is not a ball (no bouncing: a relic that bounces halfway across
the room is a bug report), `lift: 7` makes it float up (balloons; needs a ceiling collider, and `upright: true`),
`velocity` throws it on creation (a key knocked off a hook, a prize popping out of a chest).

## Rules of the world (learned the hard way)

- **The level opens viewed from the +x,+z corner** (azimuth 45°, elevation 0.576 rad). Tall walls belong on the −x and
  −z edges, or the player stares at the back of them. Test every level at that angle, and at 390x844 (`--phone`).
- **Hiding places are real.** A grab is refused if solid scenery is between the camera and the item (more than 0.35
  in front of it). So "behind the scoreboard" works by itself and the player turns the view. Put hidden things behind
  *solid* boxes, never behind `occlude: false` ones, and say in your test that it is refused from the front.
- **Pickability radius is about 42 px**, so two loose items closer than that on screen compete. Space them out.
- **Items leave the board** only through bugs: anything below y = −6 is put back at `item.home`. For a "washes back" rule
  (water, lava) check `y` in `update` and reset `body.position` to `home` yourself (the pirate ship does this).
- **Items are only grabbable at the world level**, never while inside a cage or under something you modelled as solid.
  For "covered by X" (the cone), spawn the item with `grabbable: false` and flip it in `update` once X has moved.
- **Carry bounds** keep items 0.3 inside the slab edge, so a zone hard against the edge needs to be reachable from there.
- **Colours must be palette colours** (`src/engine/palette.js`, 64 entries). Anything else is quantised to the nearest one,
  which is how a "red" ticket turns orange. Look up a hex in the file instead of inventing one.
- **Camera fit comes from `slab` and `tall`.** If the scene is clipped or tiny, those two numbers are wrong, not the camera.
- **Make state visible.** Every step should show a result: a lamp goes yellow, a tell-tale lights, a hint line changes,
  something moves. A silent success feels like a bug. Use `['fx', 'hint', 'text']` for the "what now?" line.
- **Make wrong attempts do something harmless** (a ticket falls to the ground, a ball bounces off). Never a dead end:
  anything the player can move must still be reachable and nothing can be lost permanently.
- **Distinct mechanics beat distinct decoration.** The existing set: carry-and-drop, two ingredients (pirate), floating
  things (party), creatures lured by food (dino), colour matching (concert), light switches by fitting a part (concert),
  hidden items and turning the view (all). Pick one new idea per level and keep the rest familiar.
- **Phone first.** Items under about 0.4 units are hard to hit on a phone. Make tickets and keys chunky.
- **Do not add pointer, touch or mouse listeners** and do not add on-screen buttons. The owner tried them and rejected them.

## Checks and what they do not prove

- `npm test`: the puzzle rules can be won, wrong things are refused. Fast. Run it constantly.
- `qa/bot.mjs`: the drops physically work from some camera angle. It does not prove hiding places hide or that a custom
  step (moving a cover, tilting the view low) is findable.
- `qa/play.mjs`: the full hand-written playthrough of every level in order. Slow (minutes). Run it in the background and
  read only the `FAIL` lines. A failing step is usually the test: check a screenshot before changing the game.
- `qa/touchfuzz.mjs`: random multi-finger input. Run it once at the end; it only fails if the locked input code changed.
- None of these tell you whether it feels good on a phone. The owner's play is the real test; ask what to look at.

## Publishing the game for other people

`node build.mjs --minify` produces `dist/index.html` + `dist/app.js` (a folder to upload anywhere that serves static files)
and `dist/diorama-escape.html` (the whole game as one file). Progress is saved per device in `localStorage`. Hosting
is a decision for the owner (it makes the game public): explain the options, and do not publish publicly unasked.
