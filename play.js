'use strict';
const games = {
  'whitebird': {
    title: 'Whitebird · Nightfall Rite',
    meta: 'Action roguelite · English',
    controls: 'WASD / arrows: move · Space: dash · F / R: techniques · Q: awakening · E: interact · Esc: pause',
    note: 'Keyboard + mouse · Saves stay in this browser.'
  },
  'racing-rocket-trials': {
    title: 'Racing Rocket Trials',
    meta: 'Physics racing · English',
    controls: '→: throttle · ←: brake · ↑ / ↓: lean · R: recover at checkpoint · Esc: pause',
    note: 'Keyboard · 24 courses'
  },
  'see-you-tomorrow': {
    title: 'See You Tomorrow · 明天见',
    meta: 'Visual novel · Chinese',
    controls: 'Click / Enter / Space: advance · 1–3: choose · 存档: save · 读档: load',
    note: 'Chinese story text · Saves stay in this browser.'
  },
  'bluebay-night-kitchen': {
    title: 'Bluebay Night Kitchen · 蓝湾夜食',
    meta: 'Exploration & simulation · Chinese',
    controls: 'WASD / arrows: swim · Space: catch · E: interact · Shift: swim faster · Q: sonar · M: map · Esc: pause',
    note: 'Keyboard + mouse · Saves stay in this browser.'
  }
};
const key = new URLSearchParams(location.search).get('game');
const game = Object.hasOwn(games, key) ? games[key] : null;
const stage = document.querySelector('#player-stage');
const loader = document.querySelector('#game-loading');
const full = document.querySelector('#fullscreen');
document.querySelector('#exit-fullscreen').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
});
if (game) {
  const url = `play/${key}/index.html?v=public-20261007`;
  document.title = `${game.title} · Play`;
  document.querySelector('#game-title').textContent = game.title;
  document.querySelector('#game-meta').textContent = game.meta;
  document.querySelector('#game-controls').textContent = game.controls;
  document.querySelector('#game-note').textContent = game.note;
  document.querySelector('#loading-title').textContent = 'Loading your game…';
  document.querySelector('#loading-detail').textContent = 'The first visit may take a moment while the artwork and game files load.';
  document.querySelector('#loading-back').hidden = true;
  const standalone = document.querySelector('#standalone');
  standalone.href = url;
  standalone.hidden = false;
  const frame = document.createElement('iframe');
  frame.title = game.title;
  frame.allow = 'autoplay; fullscreen; gamepad';
  frame.allowFullscreen = true;
  frame.addEventListener('load', () => { loader.hidden = true; frame.focus(); });
  frame.addEventListener('error', () => {
    document.querySelector('#loading-title').textContent = 'The game could not load.';
    document.querySelector('#loading-detail').textContent = 'Try refreshing, or open the game separately above.';
    document.querySelector('#loading-back').hidden = false;
  });
  frame.src = url;
  stage.append(frame);
  if (stage.requestFullscreen) {
    full.hidden = false;
    full.addEventListener('click', async () => {
      try { await stage.requestFullscreen(); frame.focus(); }
      catch { standalone.focus(); }
    });
  }
}
