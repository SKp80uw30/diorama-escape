/** Progress in localStorage. The game must run without it (private windows). */
const KEY = 'diorama-escape:v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function loadProgress(firstLevel) {
  const d = read();
  return { unlocked: d.unlocked?.length ? d.unlocked : [firstLevel], solved: d.solved || [] };
}
export function markSolved(progress, id, nextId) {
  if (!progress.solved.includes(id)) progress.solved.push(id);
  if (nextId && !progress.unlocked.includes(nextId)) progress.unlocked.push(nextId);
  write(progress);
}
export function resetProgress() { write({}); }
