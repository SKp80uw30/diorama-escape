/**
 * Declarative puzzle engine. Pure: no DOM, no three.js, no physics.
 *
 * A puzzle is data:
 *   { initial?: { flags, counters },
 *     items:   { tag: { count, requires?: flag } },   // what the player can carry
 *     rules:   [ { on?, ...match, when?, do } ] }
 *
 * Event rules have `on` and fire when an event matches every other plain field
 * (e.g. { on:'enter', zone:'hopper', tag:'ball' }). Rules without `on` are
 * derived: they fire once, as soon as `when` holds.
 *
 * Taps on switches arrive as { on:'tap', target:'wheel' }.
 *
 * when: { flag, not, gte:[counter, n] }  (all must hold; flag/not may be arrays)
 * do:   ['set', flag] | ['inc', counter] | ['fx', name, payload?] | ['say', text] | ['win']
 */
const RESERVED = new Set(['on', 'when', 'do']);

export function createState(puzzle) {
  return {
    flags: { ...(puzzle.initial?.flags || {}) },
    counters: { ...(puzzle.initial?.counters || {}) },
    fired: {},
    won: false,
  };
}

function holds(when, s) {
  if (!when) return true;
  if ([].concat(when.flag ?? []).some((f) => !s.flags[f])) return false;
  if ([].concat(when.not ?? []).some((f) => s.flags[f])) return false;
  if (when.gte && (s.counters[when.gte[0]] || 0) < when.gte[1]) return false;
  return true;
}

function matches(rule, event) {
  if (rule.on !== event.type) return false;
  for (const k of Object.keys(rule)) {
    if (!RESERVED.has(k) && rule[k] !== event[k]) return false;
  }
  return true;
}

function run(actions, s, effects) {
  for (const [op, a, b] of actions) {
    if (op === 'set') s.flags[a] = true;
    else if (op === 'inc') s.counters[a] = (s.counters[a] || 0) + 1;
    else if (op === 'fx') effects.push({ name: a, payload: b });
    else if (op === 'say') effects.push({ name: 'say', payload: a });
    else if (op === 'win') s.won = true;
    else throw new Error(`puzzle: unknown action ${op}`);
  }
}

/** Returns { state, effects, accepted }. Never mutates the input state. */
export function applyEvent(puzzle, state, event) {
  const s = structuredClone(state);
  const effects = [];
  const rule = puzzle.rules.find((r) => r.on && matches(r, event) && holds(r.when, s));
  if (!rule) return { state, effects, accepted: false };
  run(rule.do, s, effects);
  for (let again = true; again; ) {
    again = false;
    puzzle.rules.forEach((r, i) => {
      if (r.on || s.fired[i] || !holds(r.when, s)) return;
      s.fired[i] = true;
      run(r.do, s, effects);
      again = true;
    });
  }
  return { state: s, effects, accepted: true };
}

/**
 * Breadth-first search over "put item X in zone Y" and "tap switch Z" moves. Returns the shortest
 * list of moves that wins, or null if the level cannot be finished.
 */
export function solve(puzzle, maxDepth = 40) {
  const zones = [...new Set(puzzle.rules.filter((r) => r.zone).map((r) => r.zone))];
  const taps = [...new Set(puzzle.rules.filter((r) => r.on === 'tap').map((r) => r.target))];
  const start = { state: createState(puzzle), used: {}, path: [] };
  const seen = new Set();
  let frontier = [start];
  for (let depth = 0; depth <= maxDepth && frontier.length; depth++) {
    const next = [];
    for (const node of frontier) {
      if (node.state.won) return node.path;
      for (const [tag, item] of Object.entries(puzzle.items || {})) {
        if ((node.used[tag] || 0) >= item.count) continue;
        if (item.requires && !node.state.flags[item.requires]) continue;
        for (const zone of zones) {
          const r = applyEvent(puzzle, node.state, { type: 'enter', zone, tag });
          if (!r.accepted) continue;
          const used = { ...node.used, [tag]: (node.used[tag] || 0) + 1 };
          const key = JSON.stringify([r.state.flags, r.state.counters, r.state.won, used]);
          if (seen.has(key)) continue;
          seen.add(key);
          next.push({ state: r.state, used, path: [...node.path, { tag, zone }] });
        }
      }
      for (const target of taps) {
        const r = applyEvent(puzzle, node.state, { type: 'tap', target });
        if (!r.accepted) continue;
        const key = JSON.stringify([r.state.flags, r.state.counters, r.state.won, node.used]);
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ state: r.state, used: node.used, path: [...node.path, { tap: target }] });
      }
    }
    frontier = next;
  }
  return null;
}
