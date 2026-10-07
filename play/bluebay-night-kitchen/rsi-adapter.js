// Transport adapter only. Gameplay actions still come from real keyboard/mouse input.
// The entry sets actor=agent before this module (and game.js) execute.
import './game.js';

const game = window.GameAgentBridge;
if (!game || typeof game.reset !== 'function' || typeof game.observe !== 'function') {
  throw new Error('The source game did not publish its existing bridge');
}
if (game.observe().actor_type !== 'agent') {
  throw new Error('RSI entry must be explicitly isolated as actor=agent');
}
const fatal = document.querySelector('#fatal');
if (fatal && !fatal.hidden && fatal.textContent.trim()) {
  throw new Error('Source game renderer failed: ' + fatal.textContent.trim());
}

// Load the controller-owned implementation installed by AgentRSI, then register
// the existing game without replacing or patching its gameplay source.
await import('./game_agent_bridge.js');

function uiObservation() {
  const viewport = { width: innerWidth, height: innerHeight };
  const buttons = [];
  for (const element of document.querySelectorAll('#interface button, #interface input, #interface select, #interface textarea')) {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    if (!element.getClientRects().length || style.display === 'none' || style.visibility === 'hidden' || !box.width || !box.height) continue;
    // A partly visible button remains usable; clipping/occlusion is checked
    // against the element actually under the candidate screen point.
    const left = Math.max(0, box.left), right = Math.min(innerWidth - 1, box.right);
    const top = Math.max(0, box.top), bottom = Math.min(innerHeight - 1, box.bottom);
    const x = (left + right) / 2, y = (top + bottom) / 2;
    const hit = right > left && bottom > top ? document.elementFromPoint(x, y) : null;
    const inView = !!hit && (hit === element || element.contains(hit));
    buttons.push({
      id: element.id || null,
      tag: element.tagName.toLowerCase(),
      label: (element.innerText || element.getAttribute('aria-label') || element.value || '').trim().slice(0, 500),
      disabled: !!element.disabled,
      focused: document.activeElement === element,
      in_view: inView,
      point: inView ? { x: x / (innerWidth - 1), y: y / (innerHeight - 1) } : null,
      data: { ...element.dataset }
    });
  }
  const root = document.querySelector('#interface');
  return {
    viewport,
    text: (root?.innerText || '').slice(0, 16000),
    caption: document.querySelector('#caption')?.innerText || '',
    fatal_error: document.querySelector('#fatal')?.hidden === false ? document.querySelector('#fatal').innerText : '',
    buttons,
    focus_label: document.activeElement?.innerText?.trim().slice(0, 200) || '',
    scroll_help: 'Only point coordinates with in_view=true are clickable. Tab/Shift+Tab are real keyboard navigation and can scroll offscreen controls into view; observe again after navigation.'
  };
}

window.GameAgentBridge.register({
  reset(seed) {
    if (!Number.isSafeInteger(seed) || seed < 0) throw new Error('Expected a nonnegative integer seed');
    if (new URLSearchParams(location.search).get('actor') !== 'agent') throw new Error('RSI actor isolation lost');
    // Every trajectory starts at the first dive with zero persistent progress.
    // Later regions must be reached through the same player-visible flow.
    return game.reset({ seed, level: 0 });
  },
  observe() {
    const state = game.observe();
    if (state.actor_type !== 'agent') throw new Error('Human observations may not enter RSI automated trajectories');
    return {
      ...state,
      ui: uiObservation(),
      evaluation: {
        actor_type: 'agent',
        scope: 'automated functional/experience evidence; not human preference',
        observation_limit: 'Source game telemetry includes full map nodes/obstacles/fish positions. This legacy visibility is identical in baseline/candidates and must not be presented as human navigation difficulty evidence.'
      }
    };
  }
});
