# Diorama Escape: notes for Claude

## Navigation and input are locked

The owner tested the navigation on a real phone and approved it as final (build 6).
**Do not change it unless the owner explicitly asks for a change to navigation or input.**
This covers:

- `src/game/input.js`: the single finger and mouse handler (pick up, turn, slide, zoom)
- `src/game/grab.js`: pick up, carry, throw
- the input wiring in `src/main.js` (`createInput`, and `orbit.controls.disconnect()`,
  which keeps the camera library's own pointer handling switched off)

The approved behaviour:

- one finger on an object picks it up; one finger on empty space turns the diorama
- two fingers dragged together slide the view; pinch zooms
- mouse: left-drag turns or carries, right-drag slides, wheel zooms
- no on-screen view buttons (a move pad, turn orb and zoom buttons were tried and rejected)

Things not to reintroduce: a second input listener on the canvas, the camera
library's built-in touch handling, or finger counting that is not rebuilt from
`TouchEvent.targetTouches`. New levels and features should work through the
existing handler without editing these files. If a task seems to need a change
here, stop and ask the owner first.

After any change, `npm run qa` and `node qa/touchfuzz.mjs` must both pass.

## Adding levels

Use the `new-level` skill (`.claude/skills/new-level/SKILL.md`): it has the scaffolder, the rules grammar,
the kit reference, the gotchas and the checks. `node scripts/new-level.mjs <id> "<Title>"` starts a level.

- There is no tap or click input (the approved handler only picks up, turns, slides and zooms):
  every puzzle step must be carrying an item into a zone. Items are carried at a fixed height (2.8),
  so a zone that has to be reached by hand must include that height or lie below the drop.
- `npm test` builds every registered level headlessly and plays it to the win from its own rules
  (`src/game/autoplay.js`), so a missing zone, item or effect fails without a browser.

## Working with the owner

- Publish a playable test build for the owner to try before treating work as done.
- Work on a feature branch; `main` is only updated when the owner asks.
