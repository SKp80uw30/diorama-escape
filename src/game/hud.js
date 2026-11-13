/** Page chrome: level title, hint, level list and the level-complete card. DOM only. */
const css = `
  .de { font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; color: #2c231e; }
  #de-top { position: fixed; top: max(10px, env(safe-area-inset-top)); left: 14px; right: 14px; display: flex; justify-content: space-between; gap: 12px; pointer-events: none; z-index: 5; }
  #de-title { font-weight: 700; }
  #de-hint { color: #857f74; max-width: 46ch; }
  .de button { font: inherit; color: inherit; background: #fff; border: 1px solid #2c231e; padding: 8px 12px; cursor: pointer; pointer-events: auto; }
  .de button:hover:not(:disabled), .de button:focus-visible { background: #2c231e; color: #fff; outline: none; }
  .de button:disabled { color: #a89c88; border-color: #c9bda9; cursor: default; }
  #de-btns { display: flex; gap: 6px; align-items: flex-start; }
  #de-list { position: fixed; top: 52px; right: 14px; z-index: 6; background: #fff; border: 1px solid #2c231e; padding: 6px; display: grid; gap: 4px; min-width: 210px; }
  #de-list[hidden], #de-win[hidden] { display: none; }
  #de-list button { text-align: left; border-color: transparent; }
  #de-win { position: fixed; left: 50%; bottom: max(28px, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 6; background: #fff; border: 1px solid #2c231e; padding: 14px 16px; text-align: center; width: min(340px, calc(100vw - 28px)); }
  #de-win p { margin: 0 0 10px; }
`;

export const BUILD = 'build 6';

export function createHud({ levels, onPick, onRestart }) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  const el = (tag, id, parent, text) => {
    const n = document.createElement(tag);
    if (id) n.id = id;
    n.classList.add('de');
    if (text) n.textContent = text;
    parent.append(n);
    return n;
  };
  const top = el('div', 'de-top', document.body);
  const left = el('div', null, top);
  const title = el('div', 'de-title', left);
  const hint = el('div', 'de-hint', left);
  const btns = el('div', 'de-btns', top);
  const restart = el('button', null, btns, 'Restart');
  const worlds = el('button', null, btns, 'Worlds');
  const list = el('div', 'de-list', document.body);
  list.hidden = true;
  const win = el('div', 'de-win', document.body);
  win.hidden = true;
  const winText = el('p', null, win);
  const winBtn = el('button', null, win);

  restart.onclick = () => onRestart();
  worlds.onclick = () => { list.hidden = !list.hidden; };

  function setProgress(progress, currentId) {
    list.replaceChildren();
    for (const l of levels) {
      const open = progress.unlocked.includes(l.id) && l.build;
      const mark = progress.solved.includes(l.id) ? '✓ ' : open ? '• ' : '  ';
      const b = el('button', null, list, `${mark}${l.title}${l.build ? '' : ' (soon)'}`);
      b.disabled = !open;
      if (l.id === currentId) b.style.fontWeight = '700';
      b.onclick = () => { list.hidden = true; onPick(l.id); };
    }
    const tag = el('div', null, list, BUILD);   // so a tester can tell which version is on screen
    tag.style.cssText = 'color:#a89c88;font-size:11px;padding:4px 12px 2px';
  }

  return {
    setLevel(level) { title.textContent = level.title; hint.textContent = level.hint || ''; win.hidden = true; },
    setHint(text) { hint.textContent = text; },
    setProgress,
    showWin(level, next) {
      win.hidden = false;
      winText.textContent = next ? `You escaped ${level.title}. Unlocked: ${next.title}.` : `You escaped ${level.title}.`;
      winBtn.textContent = next?.build ? `Enter ${next.title}` : next ? `${next.title} is coming soon` : 'Play again';
      winBtn.disabled = !!next && !next.build;
      winBtn.onclick = () => (next?.build ? onPick(next.id) : onRestart());
    },
  };
}
