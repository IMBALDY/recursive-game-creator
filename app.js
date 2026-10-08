'use strict';

const games = {
  meme: {
    name: 'Meme Arena', extension: 'png',
    note: 'Selected development snapshots; scenes and gameplay states may differ. Meme Arena V1/V2 are restored snapshots; V1 uses the earliest retained compatible character models.',
    versions: [
      {title: 'A playable foundation.', description: 'A rooftop arena, a three-character roster, and simple combat effects establish the core fighting loop.', features: ['Basic rooftop arena', 'Simple ring effects', 'Three-character selection'], detail: 'A closer look at skill effects'},
      {title: 'A world with more character.', description: 'A detailed night-market arena and layered effects make the same cast feel more grounded in its surroundings.', features: ['Detailed night-market arena', 'Layered skill effects', 'Clearer combat feedback'], detail: 'Layered skill effects'},
      {title: 'Every action reads differently.', description: 'Revised combat stances, character-specific effects, and focused finisher lighting distinguish actions and their impact.', features: ['Revised combat stances', 'Character-specific effects', 'Focused finisher presentation'], detail: 'Character-specific skill effects'},
    ],
  },
  novel: {
    name: 'Visual Novel', extension: 'jpeg',
    note: 'Selected dialogue and choice views from the manuscript. Scenes and gameplay states may differ across development versions.',
    versions: [
      {title: 'The story takes shape.', description: 'Early dialogue and goal-based choices establish the narrative, with much of the action and scene detail conveyed through text.', features: ['Exposition-heavy dialogue', 'Goal-based player choices', 'Basic reading support'], detail: 'Early player choices'},
      {title: 'Let the scene do the talking.', description: 'More conversational exchanges and immersive choices accompany illustrated events and more detailed reading settings.', features: ['More conversational dialogue', 'More immersive choices', 'Illustrated story events'], detail: 'More immersive choices'},
      {title: 'Choices belong to the moment.', description: 'Dialogue becomes more natural, choices become more contextual, and richer scene presentation strengthens the emotional tone.', features: ['More natural dialogue', 'Contextual player choices', 'Richer scene presentation'], detail: 'Contextual player choices'},
    ],
  },
  racing: {
    name: 'KAZE Racing',
    note: 'Selected KAZE development views from the manuscript: V1 circuit racing, V2 race conditions and driving guides, and V3 garage and career. These are different feature views, not identical driving states.',
    versions: [
      {title: 'Start with the circuit.', description: 'The initial circuit race establishes the driving loop, track, and race interface.', features: ['Circuit racing', 'Track and race interface', 'A foundation for progression'], scene: 'racing_1.png'},
      {title: 'Give the race new conditions.', description: 'Snow changes the scene while driving guides make the route more legible. Vehicle presentation develops alongside the track experience.', features: ['Snowy race conditions', 'Visible driving guides', 'Expanded vehicle presentation'], scene: 'racing_2.png'},
      {title: 'Build around the race.', description: 'A garage and career interface extend the experience beyond a single circuit and give vehicles a dedicated presentation space.', features: ['Garage presentation', 'Career interface', 'A broader racing experience'], scene: 'racing_3.png'},
    ],
  },
};

let selectedGame = 'meme';
let selectedVersion = 0;
let comparing = false;
const query = selector => document.querySelector(selector);
const all = selector => Array.from(document.querySelectorAll(selector));
const sceneFor = (key, index) => `assets/${games[key].versions[index].scene || `${key}-v${index + 1}-scene.${games[key].extension}`}${key === 'meme' ? '?rev=naiwa-zh-20261008' : ''}`;
const detailFor = (key, index) => `assets/${key}-v${index + 1}-detail.${games[key].extension}${key === 'meme' ? '?rev=naiwa-zh-20261008' : ''}`;

function setImage(selector, source, alt) {
  const image = query(selector);
  image.src = source;
  image.alt = alt;
}

function renderGame() {
  const game = games[selectedGame];
  const stage = game.versions[selectedVersion];
  const name = `${game.name} · V${selectedVersion + 1}`;
  const source = sceneFor(selectedGame, selectedVersion);
  setImage('#stage-image', source, `${name}: ${stage.description}`);
  query('#stage-zoom').dataset.zoom = source;
  query('#stage-zoom').dataset.caption = `${name} — ${stage.title}`;
  query('#stage-version').textContent = `VERSION 0${selectedVersion + 1}`;
  query('#stage-kicker').textContent = ['THE STARTING POINT', 'DEVELOPING THE EXPERIENCE', 'REFINING THE DETAILS'][selectedVersion];
  query('#stage-title').textContent = stage.title;
  query('#stage-description').textContent = stage.description;
  query('#stage-features').replaceChildren(...stage.features.map(text => {
    const li = document.createElement('li'); li.textContent = text; return li;
  }));
  query('#detail-zoom').hidden = selectedGame === 'racing';
  if (selectedGame !== 'racing') {
    const detail = detailFor(selectedGame, selectedVersion);
    setImage('#detail-image', detail, `${name}: ${stage.detail}`);
    query('#detail-caption').textContent = `${stage.detail} ↗`;
    query('#detail-zoom').dataset.zoom = detail;
    query('#detail-zoom').dataset.caption = `${name} — ${stage.detail}`;
  }
  query('#evolution-note').textContent = game.note;
  query('#game-panel').setAttribute('aria-labelledby', `tab-${selectedGame}`);
  all('[data-game]').forEach(button => {
    const active = button.dataset.game === selectedGame;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  all('[data-version]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.version) === selectedVersion)));
  query('#comparison-grid').replaceChildren(...game.versions.map((version, index) => {
    const article = document.createElement('article'); article.className = 'comparison-card';
    const button = document.createElement('button'); button.dataset.zoom = sceneFor(selectedGame, index);
    button.dataset.caption = `${game.name} · V${index + 1} — ${version.title}`;
    button.setAttribute('aria-label', `Enlarge ${game.name} V${index + 1}`);
    const image = new Image(); image.src = sceneFor(selectedGame, index); image.alt = `${game.name} V${index + 1}: ${version.description}`; image.loading = 'lazy'; image.width = 1280; image.height = 800; button.append(image);
    const h3 = document.createElement('h3'); const badge = document.createElement('small'); badge.textContent = `V${index + 1}`; h3.append(badge, document.createTextNode(version.title));
    const p = document.createElement('p'); p.textContent = version.description;
    article.append(button, h3, p); return article;
  }));
}

all('[data-game]').forEach(button => button.addEventListener('click', () => {
  selectedGame = button.dataset.game; renderGame();
}));

query('.game-tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = all('[data-game]'); const current = tabs.indexOf(document.activeElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].click(); tabs[next].focus();
});

all('[data-version]').forEach(button => button.addEventListener('click', () => {
  selectedVersion = Number(button.dataset.version); renderGame();
}));

query('#compare-toggle').addEventListener('click', () => {
  comparing = !comparing;
  query('#compare-toggle').setAttribute('aria-pressed', String(comparing));
  query('#compare-toggle').replaceChildren(document.createTextNode(comparing ? 'Explore one version ' : 'Compare all versions '));
  const arrow = document.createElement('span'); arrow.textContent = comparing ? '↙' : '↗'; query('#compare-toggle').append(arrow);
  query('#stage-view').hidden = comparing;
  query('#comparison-grid').hidden = !comparing;
  query('#game-panel').classList.toggle('comparing', comparing);
});

const categories = ['Action', 'Timing', 'Strategy', 'Simulation', 'Adventure'];
const resultRows = [
  [67.96, 68.76, 72.10, 77.72, 76.95],
  [70.33, 73.19, 72.96, 80.57, 79.69],
  [77.62, 74.41, 74.46, 82.94, 80.00],
];

function setupChart() {
  categories.forEach((category, index) => {
    const row = document.createElement('div'); row.className = 'chart-row';
    const label = document.createElement('span'); label.className = 'chart-label'; label.textContent = category;
    const track = document.createElement('div'); track.className = 'bar-track'; track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('div'); fill.className = 'bar-fill'; fill.style.width = `${resultRows[2][index]}%`;
    const reference = document.createElement('div'); reference.className = 'bar-reference'; reference.style.left = `${resultRows[0][index]}%`;
    const value = document.createElement('span'); value.className = 'chart-value'; value.textContent = resultRows[2][index].toFixed(2);
    track.append(fill, reference); row.append(label, track, value); query('#category-chart').append(row);
  });
}

all('[data-round]').forEach(button => button.addEventListener('click', () => {
  const round = Number(button.dataset.round);
  all('[data-round]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  all('.chart-row').forEach((row, index) => {
    row.querySelector('.bar-fill').style.width = `${resultRows[round][index]}%`;
    row.querySelector('.chart-value').textContent = resultRows[round][index].toFixed(2);
  });
  query('#chart-legend-text').textContent = `Round ${round + 1}`;
  query('#category-chart').setAttribute('aria-label', `Round ${round + 1} category scores`);
}));

const dialog = query('#image-dialog');
const evolutionVideo = query('#evolution-video');
const filmPlay = query('#film-play');
filmPlay.addEventListener('click', async () => {
  query('#film-status').textContent = '';
  if (!evolutionVideo.paused) { evolutionVideo.pause(); return; }
  try { await evolutionVideo.play(); }
  catch { query('#film-status').textContent = 'Playback could not start. Use the video controls or download the MP4 below.'; }
});
function updateFilmControl() {
  filmPlay.textContent = evolutionVideo.ended ? '↻ Replay film' : evolutionVideo.paused ? '▶ Play film' : 'Ⅱ Pause film';
}
['play', 'pause', 'ended', 'emptied'].forEach(event => evolutionVideo.addEventListener(event, updateFilmControl));

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-zoom]');
  if (!trigger) return;
  query('#dialog-image').src = trigger.dataset.zoom;
  query('#dialog-image').alt = trigger.dataset.caption || 'Game screenshot from the manuscript';
  query('#dialog-caption').textContent = trigger.dataset.caption || '';
  dialog.showModal();
});
query('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

query('#copy-citation').addEventListener('click', async () => {
  const text = query('#bibtex').textContent;
  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); copied = true; } catch { /* Fall back for local file previews. */ }
  }
  if (!copied) {
    const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.append(area); area.select();
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    area.remove();
  }
  query('#copy-citation span').textContent = copied ? 'Copied!' : 'Select text to copy';
  query('#copy-status').textContent = copied ? 'BibTeX citation copied to clipboard.' : 'Copy is unavailable. Select the citation text to copy it manually.';
  window.setTimeout(() => { query('#copy-citation span').textContent = 'Copy citation'; }, 2500);
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      all('.site-header nav a[href^="#"]').forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    }
  }, {rootMargin: '-15% 0px -55% 0px'});
  ['overview', 'method', 'evolution', 'results', 'citation'].forEach(id => observer.observe(document.getElementById(id)));
}

renderGame();
setupChart();

// Keep the responsive animation in its own document and pause it offscreen.
const explorationFrame = query('#exploration-frame');
let explorationVisible = false;
const syncExplorationVisibility = () => {
  explorationFrame.contentWindow?.postMessage({
    type: 'exploration-visibility', visible: explorationVisible && !document.hidden
  }, location.origin);
};
window.addEventListener('message', event => {
  if (event.source !== explorationFrame.contentWindow || event.origin !== location.origin) return;
  if (event.data?.type === 'exploration-height' && Number.isFinite(event.data.height)) {
    explorationFrame.style.height = `${Math.max(300, Math.min(2400, event.data.height))}px`;
  }
  if (event.data?.type === 'exploration-ready') syncExplorationVisibility();
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    explorationVisible = entries[0].isIntersecting;
    syncExplorationVisibility();
  }).observe(explorationFrame);
} else explorationVisible = true;
explorationFrame.addEventListener('load', syncExplorationVisibility);
document.addEventListener('visibilitychange', syncExplorationVisibility);
