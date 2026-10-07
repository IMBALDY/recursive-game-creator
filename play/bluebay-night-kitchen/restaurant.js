import { EVENINGS } from './content.js';
import { recipeTier, fishPrice, SEASONS } from './progression.js';
import { CHARACTERS, characterPortrait } from './relationships.js';
import { HUNT_STORIES, HUNT_REWARDS } from './hunt-progress.js';

/* A self-contained, local restaurant shift. Inventory is committed only via its result. */
export function startRestaurant(container, options = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('餐馆需要一个有效的界面容器。');
  if (!document.querySelector('link[data-tide-restaurant-style]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = new URL('./restaurant.css', import.meta.url).href;
    link.dataset.tideRestaurantStyle = ''; document.head.appendChild(link);
  }
  let sceneStyle=document.querySelector('link[data-tide-restaurant-v6-style],link[href$="restaurant-v6.css"]');
  if(!sceneStyle){sceneStyle=document.createElement('link');sceneStyle.rel='stylesheet';sceneStyle.href=new URL('./restaurant-v6.css',import.meta.url).href;sceneStyle.dataset.tideRestaurantV6Style='';}
  document.head.appendChild(sceneStyle);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n, low, high) => Math.max(low, Math.min(high, Number(n) || 0));
  const level = Math.floor(clamp(options.level, 0, EVENINGS.length - 1));
  const evening = EVENINGS[Math.floor(level)];
  const kitchenLevel = Math.floor(clamp(options.buildings?.kitchen, 0, 3));
  const diningLevel = Math.floor(clamp(options.buildings?.dining, 0, 3));
  const patienceCap = 28 + diningLevel * 3;
  const season = typeof options.season === 'object' ? options.season : SEASONS[clamp(options.season, 0, SEASONS.length - 1)];
  // Atlas cells are presentation only; stock, timing, and earnings remain independent.
  const dishIcon = (index, extra = '') => `<span class="rs-item-icon ${extra}" style="--rs-icon-x:${index % 4 * 100 / 3}%;--rs-icon-y:${Math.floor(index / 4) * 100 / 3}%" aria-hidden="true"></span>`;
  const portrait = (index, extra = '') => `<span class="rs-portrait ${extra}" style="--rs-portrait-x:${index * 100 / 3}%" aria-hidden="true"></span>`;
  const smallIcon=name=>`<svg class="rs-line-icon" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${({pause:'<path d="M15 11v18m10-18v18"/>',tea:'<path d="M8 17h22v8a9 9 0 0 1-9 8h-4a9 9 0 0 1-9-8zm22 1h3a5 5 0 0 1 0 10h-4M5 35h30M14 12c-5-4 4-6 0-10m9 10c-5-4 4-6 0-10"/>',order:'<path d="M11 5h19v30H9V7m5 7h11m-11 6h11m-11 6h7M14 4h11v4H14z"/>',serve:'<path d="M6 28h28M9 26a11 11 0 0 1 22 0M20 11v3m-3-3h6M9 33h22"/>',flame:'<path d="M21 4c2 8-4 8 1 14 4-1 5-5 5-5 13 14 4 23-6 23S4 25 13 17c-1 7 4 7 5 5s-3-10 3-18z"/>'})[name]||''}</svg>`;
  const stove=(lit=false)=>`<div class="rs-stove ${lit?'is-lit':''}" aria-hidden="true"><div class="rs-steam"><i></i><i></i><i></i></div><div class="rs-pot-lid"></div><div class="rs-pot"><i></i></div><div class="rs-burner"><span>${smallIcon('flame')}</span></div><div class="rs-stove-feet"></div></div>`;
  const seen = new Set();
  const pantry = (Array.isArray(options.pantry) ? options.pantry : []).filter(item => {
    if (!item || item.id == null || (item.kind && item.kind !== 'fish') || seen.has(String(item.id))) return false;
    seen.add(String(item.id)); return true;
  }).map(item => ({ ...item, key: String(item.id), speciesKey: String(item.species?.id ?? item.species ?? item.name ?? '鲜鱼'), name: String(item.name || '鲜鱼'), value: Math.max(1, Number(item.value) || 10) }));
  const groups = new Map();
  pantry.forEach(item => { if (!groups.has(item.speciesKey)) groups.set(item.speciesKey, []); groups.get(item.speciesKey).push(item); });
  const methods = evening.methodNames;
  const recipes = Array.from(groups, ([species, items], index) => {
    const supplied = (Array.isArray(options.recipes) ? options.recipes : []).find(recipe => String(recipe.species ?? recipe.speciesId ?? '') === species);
    const huntId = items[0].huntId || (species.startsWith('hunt_') ? species.slice(5) : null), hunt = HUNT_REWARDS[huntId];
    const caught = hunt ? 0 : Math.max(0, Number(options.mastery?.[species]) || 0);
    const tier = hunt ? {level:2,title:'大物限定料理',nextAt:null} : recipeTier(caught);
    const suppliedPrice = Number(supplied?.price) || (hunt ? hunt.recipePrice : 0) || null;
    const baseValue = Math.max(8, suppliedPrice || items[0].value * 1.8 + 8);
    const prices = items.map(fish => fishPrice(fish, Math.max(8, suppliedPrice || fish.value * 1.8 + 8), caught, kitchenLevel));
    const method = tier.level === 2 ? '蓝湾传家宴 · ' : tier.level === 1 ? '主厨秘制 · ' : methods[index % methods.length];
    return {id: `dish-${index}`, species, huntId:hunt?huntId:null, name: String(supplied?.name || hunt?.recipeName || `${method}${items[0].name}`), baseValue, suppliedPrice, minPrice:Math.min(...prices), maxPrice:Math.max(...prices), caught, tier, stock: items.length, icon: hunt?.recipeIcon ?? evening.methodIcons[index % 4]};
  });
  const selected = new Set(recipes.slice(0, Math.min(3, recipes.length)).map(recipe => recipe.id));
  const consumed = new Set(), guests = [], events = [], servedMeals = [];
  const arrivalTimes = [0, 9, 18, 29, 40, 53];
  const roster = [
    ['xiaoman','xiaxia','zhou','lizi','voyager','nannan'],
    ['lin','nannan','zhou','xiaxia','voyager','mo'],
    ['yun','zhou','lizi','xiaoman','voyager','lin'],
    ['mo','lizi','zhou','yun','xiaxia','nannan'],
    ['su','voyager','yun','lin','mo','xiaxia'],
  ][level];
  const specialCharacter = level === 3 ? 'xiaxia' : level === 4 ? 'su' : 'voyager';
  const people = roster.map(id => ({...CHARACTERS[id], characterId:id, special:id === specialCharacter, ...(id === specialCharacter ? {line:evening.guestLine,after:evening.guestAfter} : {})}));
  const state = {phase:'menu', elapsed:0, remaining:75, nextArrival:0, earned:0, served:0, missed:0, satisfaction:0, cooking:null, teaReady:0, paused:false, called:false, frame:0, last:performance.now(), message:evening.greeting, messageUntil:0, result:null};
  const root = document.createElement('section'); root.className = 'tide-restaurant rs-v6'; root.setAttribute('aria-label', '蓝湾夜食');root.dataset.phase='menu';
  root.innerHTML = `
    <div class="rs-room-backdrop" aria-hidden="true"></div><div class="rs-lantern rs-lantern-one" aria-hidden="true"></div><div class="rs-lantern rs-lantern-two" aria-hidden="true"></div>
    <header class="rs-header"><div class="rs-brand"><span class="rs-small-cap">BLUE BAY · 日落开席</span><h1>蓝湾夜食</h1><span class="rs-evening-name">${escape(evening.title)}</span></div><div class="rs-top-stats"><div class="rs-clock-medallion"><small>营业剩余</small><strong data-rs-clock>准备中</strong><span class="rs-shift-progress" aria-label="营业进度"><i data-rs-shift-bar></i></span></div><div class="rs-cash-tag"><small>今晚收入</small><strong data-rs-earned>0 贝币</strong></div><button class="rs-button rs-pause-shell" data-rs-action="pause">${smallIcon('pause')}<span>歇一会 <kbd>Esc</kbd></span></button></div></header>
    <div class="rs-scene"><div class="rs-scene-label"><span>把海风，煮进晚饭里。</span><strong>${escape(evening.subtitle)}</strong><p>${escape(evening.note)}</p></div></div>
    <main class="rs-workspace"><div class="rs-counter-rail" aria-hidden="true"></div><aside class="rs-panel rs-menu-panel"><div class="rs-panel-heading"><div><span class="rs-small-cap">从鱼篓到陶盘</span><h2>今夜吃什么</h2></div><span class="rs-chip" data-rs-stock></span></div><div class="rs-menu-list" data-rs-menu aria-label="今晚的可选料理"></div><p class="rs-footnote" data-rs-menu-note>最多选三道菜，每份用一条鱼。</p><div class="rs-menu-actions" data-rs-menu-actions></div></aside><section class="rs-panel rs-service-panel"><div class="rs-panel-heading"><div><span class="rs-small-cap">留三个位置，等熟悉的人</span><h2>晚饭就在这里</h2></div><span class="rs-chip" data-rs-guest-count>今晚六位</span></div><div class="rs-guests" data-rs-guests></div><div class="rs-service-footer"><button class="rs-button rs-tea" data-rs-action="tea">${smallIcon('tea')}<span>续一壶海风茶</span></button><span data-rs-tea-note>一杯茶，让等待慢一点。</span></div></section><aside class="rs-panel rs-kitchen-panel"><div class="rs-panel-heading"><div><span class="rs-small-cap">阿禾的炉边</span><h2>慢火，正好</h2></div></div><div data-rs-kitchen></div><div class="rs-shift-totals"><span>已招待 <b data-rs-served>0</b> 位</span><span>食材 <b data-rs-remaining-stock>${pantry.length}</b> 条</span></div><button class="rs-button rs-end" data-rs-action="end">收好厨房 · 提前打烊</button></aside></main>
    <div class="rs-guide">${portrait(0, 'rs-guide-portrait')}<p data-rs-message role="status" aria-live="polite"></p></div><footer class="rs-bottom"><span>接待记单 → 夹单下锅 → 端菜给客人</span><span>未下锅的鲜鱼，留到明天</span></footer><div class="rs-modal-host" data-rs-modal></div>`;
  container.appendChild(root);
  const query = selector => root.querySelector(selector);
  const recipeById = id => recipes.find(recipe => recipe.id === id);
  function emit(type, data = {}) {
    const event = {type, at: Number(state.elapsed.toFixed(2)), data}; events.push(event);
    try { options.log?.(`restaurant.${type}`, data); } catch (_) { /* telemetry never interrupts a meal */ }
  }
  function say(text, seconds = 5) { state.message = text; state.messageUntil = seconds > 0 ? state.elapsed + seconds : 0; query('[data-rs-message]').textContent = text; }
  function activeGuests() { return guests.filter(guest => !['served','left'].includes(guest.status)); }
  function availableFish(recipe) {
    const reservations = new Set(activeGuests().map(guest => guest.fish.key));
    return pantry.filter(fish => fish.speciesKey === recipe.species && !consumed.has(fish.key) && !reservations.has(fish.key));
  }
  function remainingStock() { return pantry.filter(fish => !consumed.has(fish.key)).length; }
  function anyAvailable() { return recipes.some(recipe => selected.has(recipe.id) && availableFish(recipe).length); }
  function priceFor(fish, recipe) { return fishPrice(fish, Math.max(8, recipe.suppliedPrice || fish.value * 1.8 + 8), recipe.caught, kitchenLevel); }
  function recipeProgress(recipe) { if(recipe.huntId)return '狩猎限定食材 · 每份切料只下锅一次';return recipe.tier.nextAt ? `累计捕获 ${recipe.caught}/${recipe.tier.nextAt} · 再捕 ${Math.max(0,recipe.tier.nextAt-recipe.caught)} 条解锁${recipe.tier.level ? '传奇' : '拿手'}料理` : `累计捕获 ${recipe.caught} 条 · 传奇料理已解锁`; }
  function renderMenu() {
    root.dataset.phase=state.phase;
    query('[data-rs-stock]').textContent = `${remainingStock()} ${recipes.some(recipe=>recipe.huntId)?'份鲜料':'条鲜鱼'}`;
    query('[data-rs-menu]').innerHTML = recipes.length ? recipes.map(recipe => {
      const count = pantry.filter(fish => fish.speciesKey === recipe.species && !consumed.has(fish.key)).length;
      return `<button class="rs-dish rs-tier-${recipe.tier.level} ${selected.has(recipe.id) ? 'rs-selected' : ''}" data-rs-action="menu" data-recipe="${recipe.id}" ${state.phase !== 'menu' ? 'disabled' : ''} aria-pressed="${selected.has(recipe.id)}" aria-label="${escape(recipe.name)}，${count}份食材，${recipe.minPrice}至${recipe.maxPrice}贝币。${escape(recipeProgress(recipe))}" title="${escape(recipeProgress(recipe))}"><span class="rs-plate-face">${dishIcon(recipe.icon, 'rs-menu-icon')}<span class="rs-dish-check">${selected.has(recipe.id) ? '✓' : '+'}</span><span class="rs-price-pin">${recipe.minPrice === recipe.maxPrice ? recipe.minPrice : `${recipe.minPrice}–${recipe.maxPrice}`} <small>贝币</small></span></span><span class="rs-dish-copy"><span class="rs-tier-label">${escape(recipe.tier.title)}</span><strong>${escape(recipe.name)}</strong><small>${count} 份鲜料</small><span class="rs-mastery">${recipeProgress(recipe)}</span></span></button>`;
    }).join('') : `<div class="rs-empty-basket">${dishIcon(2)}<strong>鱼篓还是空的</strong><p>下次出海带些鲜鱼回来，小馆就能开张了。</p></div>`;
    query('[data-rs-menu-note]').textContent = state.phase === 'menu' ? `最多选三道菜，已选 ${selected.size} 道。普通鱼按个头计价，大物按精选切份计价。` : '菜单已挂好；备菜才会取出一份食材，未下锅的可以留到明天。';
    query('[data-rs-menu-actions]').innerHTML = state.phase === 'menu' ? `<button class="rs-button rs-primary rs-open" data-rs-action="start" ${!selected.size ? 'disabled' : ''}>挂起牌子 · 开始营业</button><button class="rs-text-button" data-rs-action="exit">先回船上</button>` : '<div class="rs-open-sign"><span></span> 小馆营业中</div>';
  }
  function renderGuests() {
    const current = activeGuests();
    const empty = `<div class="rs-empty-seat"><div class="rs-empty-chair"></div><strong>${state.phase === 'menu' ? '等一阵晚风' : '给下一位客人留个座'}</strong><small>${state.phase === 'menu' ? '开门后，邻居们就会过来。' : '海风吹着，热茶温着。'}</small></div>`;
    query('[data-rs-guests]').innerHTML = [0,1,2].map(slot => {
      const guest = current.find(person => person.slot === slot);
      if (!guest) return empty;
      const recipe = recipeById(guest.recipeId);
      const text = guest.status === 'waiting' ? '接待 · 记下订单' : guest.status === 'accepted' ? '已记单 · 去料理台备菜' : guest.status === 'cooking' ? '锅里正香着…' : '端上这份晚饭';
      return `<article class="rs-guest ${guest.special ? 'rs-special-guest' : ''} rs-guest-${guest.status}" data-guest-id="${guest.id}"><div class="rs-guest-speech">${escape(guest.line)}</div><div class="rs-guest-portrait-wrap">${characterPortrait(guest.characterId, 'rs-portrait')}<span class="rs-guest-badge">${guest.special ? (guest.characterId === 'voyager' ? '旧餐券' : '今夜的故事') : ['waiting','accepted'].includes(guest.status) ? '等一口鲜' : guest.status === 'ready' ? '可以上菜' : '香气正好'}</span></div><div class="rs-guest-info"><div class="rs-guest-name"><strong>${escape(guest.name)}</strong><small>${escape(guest.role)}</small></div><p class="rs-guest-dish">${dishIcon(recipe.icon)}<span>${escape(recipe.name)}<small class="rs-fish-price">${Number(guest.fish.sizeFactor || 1).toFixed(2)} 倍个头 · ${guest.price} 贝币</small></span></p><div class="rs-patience" aria-label="${escape(guest.name)}的耐心"><i data-patience="${guest.id}" style="width:${Math.min(100, guest.patience/patienceCap*100)}%"></i></div><button class="rs-button rs-order-action ${guest.status === 'ready' ? 'rs-primary rs-serve-action' : ''}" data-rs-action="guest" data-guest="${guest.id}" ${['accepted','cooking'].includes(guest.status) ? 'disabled' : ''}>${smallIcon(guest.status==='ready'?'serve':'order')}<span>${text}</span></button></div></article>`;
    }).join('');
    query('[data-rs-guest-count]').textContent = state.phase === 'menu' ? '今晚约六位' : `${state.served} 位已用餐 · ${Math.max(0, 6 - state.nextArrival)} 位还在路上`;
  }
  function renderKitchen() {
    let content = '';
    if (state.cooking) {
      const guest = guests.find(person => person.id === state.cooking.guestId);
      const ready = guest?.status === 'ready';
      content = `<div class="rs-cooking ${ready ? 'rs-ready' : ''}"><div class="rs-pot-scene">${stove(!ready)}${dishIcon(recipeById(guest.recipeId).icon, 'rs-cooking-icon')}</div><div class="rs-fire-dial" role="img" aria-label="${ready?'火候完成，可以上菜':'正在烹饪，约1.5秒'}"><span>慢火</span><i data-rs-fire-hand style="transform:rotate(${ready?65:-65+state.cooking.progress/1.5*130}deg)"></i><b>${ready?'出锅':'火候'}</b><span>刚好</span></div><strong>${escape(recipeById(guest.recipeId).name)}</strong><p>${ready ? `给${escape(guest.name)}的晚饭好了。<br>点击这位客人，把热菜端过去。` : '海盐撒一点，翻面，再等一小会儿。'}</p><div class="rs-cook-bar"><i data-rs-cook-progress style="width:${ready ? 100 : state.cooking.progress/1.5*100}%"></i></div><small>${ready ? '✓ 可以上菜了' : '正在料理 · 约 1.5 秒'}</small></div>`;
    } else {
      const tickets = activeGuests().filter(guest => guest.status === 'accepted');
      content = `<div class="rs-kitchen-idle">${stove(false)}<p>${state.phase === 'menu' ? '先挑好菜单，再迎接今晚的客人。' : tickets.length ? '订单夹好了，挑一份开始料理。' : '客人落座后，先替他们记下订单。'}</p></div><div class="rs-ticket-rope" aria-hidden="true"></div><div class="rs-tickets">${tickets.map(guest => `<button class="rs-ticket" data-rs-action="cook" data-guest="${guest.id}"><i class="rs-ticket-clip" aria-hidden="true"></i><span>${escape(guest.name)}的订单</span>${dishIcon(recipeById(guest.recipeId).icon)}<strong>${escape(recipeById(guest.recipeId).name)}</strong><small>${smallIcon('flame')} 夹单下锅 →</small></button>`).join('')}</div>`;
    }
    query('[data-rs-kitchen]').innerHTML = content;
    query('[data-rs-remaining-stock]').textContent = remainingStock();
    query('[data-rs-served]').textContent = state.served;
    query('[data-rs-earned]').textContent = `${state.earned} 贝币`;
    query('[data-rs-action="end"]').disabled = state.phase !== 'service';
    query('[data-rs-action="tea"]').disabled = state.phase !== 'service' || !activeGuests().length || state.elapsed < state.teaReady;
  }
  function renderAll() { renderMenu(); renderGuests(); renderKitchen(); query('[data-rs-message]').textContent = state.message; }
  function arrive() {
    if (state.nextArrival >= 6 || state.elapsed < arrivalTimes[state.nextArrival] || activeGuests().length >= 3) return;
    const choices = recipes.filter(recipe => selected.has(recipe.id) && availableFish(recipe).length);
    if (!choices.length) return;
    const index = state.nextArrival++;
    const recipe = choices[index % choices.length];
    const slot = [0,1,2].find(candidate => !activeGuests().some(guest => guest.slot === candidate));
    const guest = {...people[index], id:`guest-${index}`, slot, recipeId:recipe.id, fish:availableFish(recipe)[0], status:'waiting', patience:25 + diningLevel * 3, teaCount:0};
    guest.price = priceFor(guest.fish, recipe);
    guests.push(guest); emit('arrival', {guest:guest.name, characterId:guest.characterId, guestId:guest.id, recipe:recipe.name, special:!!guest.special, ingredientId:guest.fish.id, sizeFactor:guest.fish.sizeFactor || 1, price:guest.price});
    say(`${guest.name}来了，先替客人记下想吃的菜。`); renderGuests(); renderKitchen();
  }
  function depart(guest, reason) {
    if (['left','served'].includes(guest.status)) return;
    guest.status = 'left'; state.missed++;
    if (state.cooking?.guestId === guest.id) state.cooking = null;
    emit('departure', {guestId:guest.id, guest:guest.name, reason, ingredientUsed:consumed.has(guest.fish.key)});
    say(`${guest.name}先去忙了：“下回再来吃，别着急。”`);
  }
  function finish(reason) {
    if (state.phase !== 'service') return;
    state.phase = 'summary'; state.paused = false; cancelAnimationFrame(state.frame);
    root.dataset.phase='summary';root.dataset.paused='false';
    activeGuests().forEach(guest => depart(guest, reason === 'time' ? 'closing_time' : 'early_close'));
    const rating = state.served ? Math.round(clamp(state.satisfaction / state.served - state.missed * .12, 1, 5) * 10) / 10 : 0;
    emit('shift_end', {reason, served:state.served, missed:state.missed, earned:state.earned, rating});
    state.result = {consumedIds:pantry.filter(fish => consumed.has(fish.key)).map(fish => fish.id), earned:state.earned, served:state.served, missed:state.missed, rating, servedGuestIds:[...new Set(servedMeals.map(meal => meal.characterId))], servedMeals:servedMeals.map(meal => ({...meal})), events:events.slice()};
    query('[data-rs-clock]').textContent = '已打烊';
    const heading = reason === 'sold_out' ? '今晚的鲜鱼，卖完啦。' : '灯还亮着，晚饭收工了。';
    const nightClue = events.some(event => event.type === 'night_guest_clue');
    const huntFeasts = [...new Set(servedMeals.map(meal=>meal.huntId).filter(Boolean))].map(id=>HUNT_STORIES[id]?.feastScene).filter(Boolean);
    query('[data-rs-modal]').innerHTML = `<div class="rs-modal-shade"><section class="rs-receipt" role="dialog" aria-modal="true" aria-label="今晚的账本">${characterPortrait(nightClue ? specialCharacter : 'ahe', 'rs-portrait rs-receipt-portrait')}<span class="rs-small-cap">${escape(evening.title)} · 今晚的账本</span><h2>${heading}</h2><p>${state.served ? escape(evening.closing) : '今天先熟悉一下小馆，明天再慢慢来。'}</p><div class="rs-receipt-stats"><div><strong>${state.earned}</strong><small>贝币收入</small></div><div><strong>${state.served}</strong><small>位客人吃到晚饭</small></div><div><strong>${rating ? rating.toFixed(1) : '—'}</strong><small>晚餐评价 / 5</small></div></div><p class="rs-receipt-note">用了 ${consumed.size} 条鱼，剩下 ${remainingStock()} 条留在鱼篓。${state.missed ? `<br>${state.missed} 位客人先离开了，下次还有机会好好招待。` : ''}</p>${nightClue ? `<blockquote>${escape(evening.servedClue)}</blockquote>` : ''}<button class="rs-button rs-primary" data-rs-action="complete">收好账本 · 回到船上</button></section></div>`;
    query('[data-rs-action="complete"]').focus();
    if(huntFeasts.length){const supper=document.createElement('div');supper.className='rs-hunt-supper';supper.innerHTML=huntFeasts.map(scene=>`<blockquote><strong>${escape(scene.title)} · ${escape(scene.speaker)}</strong><p style="white-space:pre-line">${escape(scene.text)}</p></blockquote>`).join('');query('.rs-receipt').appendChild(supper);}
  }
  function conclude(exitBeforeStart = false) {
    if (state.called) return;
    state.called = true; cancelAnimationFrame(state.frame); document.removeEventListener('keydown', onKey, true); root.removeEventListener('click', onClick); root.remove();
    if (exitBeforeStart) options.onExit?.();
    else options.onComplete?.(state.result);
  }
  function pause() {
    if (state.phase !== 'service' || state.paused) return;
    state.paused = true; emit('pause');
    root.dataset.paused='true';
    query('[data-rs-modal]').innerHTML = `<div class="rs-modal-shade"><section class="rs-pause-card" role="dialog" aria-modal="true" aria-label="营业暂停"><div class="rs-rest-cup" aria-hidden="true">${smallIcon('tea')}</div><span class="rs-small-cap">先歇一小会儿</span><h2>茶还温着，客人会等你。</h2><p>营业时间和客人的等待都已暂停。</p><button class="rs-button rs-primary" data-rs-action="resume">继续营业</button><button class="rs-text-button" data-rs-action="end">提前收摊，结好今晚的账</button></section></div>`;
    query('[data-rs-action="resume"]').focus();
  }
  function resume() {
    if (!state.paused || state.phase !== 'service') return;
    state.paused = false; state.last = performance.now(); emit('resume'); query('[data-rs-modal]').innerHTML = '';
    root.dataset.paused='false';
  }
  function tick(now) {
    if (state.called || state.phase !== 'service') return;
    const delta = Math.min(.25, Math.max(0, (now - state.last) / 1000)); state.last = now;
    if (!state.paused) {
      state.elapsed += delta; state.remaining = Math.max(0, 75 - state.elapsed);
      let changed = false;
      activeGuests().forEach(guest => { guest.patience -= delta; if (guest.patience <= 0) { depart(guest, 'patience'); changed = true; } });
      if (state.cooking) {
        const guest = guests.find(person => person.id === state.cooking.guestId);
        if (guest.status === 'cooking') {
          state.cooking.progress += delta;
          if (state.cooking.progress >= 1.5) { guest.status = 'ready'; emit('dish_ready', {guestId:guest.id, recipe:recipeById(guest.recipeId).name}); say(`${guest.name}的晚饭好了，点击客人上菜。`); changed = true; }
        }
      }
      if (changed) renderAll();
      arrive();
      if (state.remaining <= 0) { finish('time'); return; }
      if (!activeGuests().length && (!anyAvailable() || state.nextArrival >= 6)) { finish(anyAvailable() ? 'all_served' : 'sold_out'); return; }
      query('[data-rs-clock]').textContent = `${Math.ceil(state.remaining)} 秒`;
      query('[data-rs-shift-bar]').style.width = `${state.remaining / 75 * 100}%`;
      activeGuests().forEach(guest => { const bar = query(`[data-patience="${guest.id}"]`); if (bar) {bar.style.width = `${clamp(guest.patience / patienceCap * 100, 0, 100)}%`; bar.classList.toggle('rs-low-patience', guest.patience < 7); } });
      const cookingBar = query('[data-rs-cook-progress]'); if (cookingBar && state.cooking) cookingBar.style.width = `${clamp(state.cooking.progress / 1.5 * 100, 0, 100)}%`;
      const fireHand=query('[data-rs-fire-hand]');if(fireHand&&state.cooking)fireHand.style.transform=`rotate(${-65+clamp(state.cooking.progress/1.5,0,1)*130}deg)`;
      const teaButton = query('[data-rs-action="tea"]'); teaButton.disabled = !activeGuests().length || state.elapsed < state.teaReady;
      query('[data-rs-tea-note]').textContent = state.elapsed < state.teaReady ? `茶水再焖 ${Math.ceil(state.teaReady - state.elapsed)} 秒。` : '免费续茶 · 客人多一点耐心，也可能多留一点小费。';
      if (state.messageUntil && state.elapsed > state.messageUntil) {state.messageUntil = 0; say('记下订单，在料理台备菜，再把热乎的晚饭送到客人面前。', 0);}
    }
    state.frame = requestAnimationFrame(tick);
  }
  function onClick(event) {
    const button = event.target.closest('[data-rs-action]'); if (!button || !root.contains(button) || button.disabled) return;
    event.stopPropagation(); const action = button.dataset.rsAction;
    if (action === 'complete') { conclude(); return; }
    if (action === 'exit') { if (state.phase === 'menu') {emit('exit_before_service'); conclude(true);} return; }
    if (action === 'pause') { if (state.phase === 'menu') {emit('exit_before_service'); conclude(true);} else pause(); return; }
    if (action === 'resume') { resume(); return; }
    if (action === 'end') { finish('early_close'); return; }
    if (state.paused || state.phase === 'summary') return;
    if (action === 'menu' && state.phase === 'menu') {
      const id = button.dataset.recipe;
      if (selected.has(id)) selected.delete(id); else if (selected.size < 3) selected.add(id); else {say('小馆的灶台不大，今晚先选三道拿手菜。'); return;}
      emit('menu_selection', {recipe:recipeById(id).name, selected:selected.has(id), menu:Array.from(selected).map(item => recipeById(item).name)}); renderMenu(); return;
    }
    if (action === 'start' && state.phase === 'menu' && selected.size) {
      state.phase = 'service'; state.last = performance.now(); emit('shift_start', {duration:75, menu:Array.from(selected).map(id => recipeById(id).name), pantry:pantry.length, level});
      say('小馆开张了！客人落座后，点击“接待”记下订单。'); renderAll(); arrive(); state.frame = requestAnimationFrame(tick); return;
    }
    if (state.phase !== 'service') return;
    if (action === 'tea' && state.elapsed >= state.teaReady && activeGuests().length) {
      state.teaReady = state.elapsed + 8;
      const ids = activeGuests().map(guest => {guest.patience = Math.min(patienceCap, guest.patience + 7); guest.teaCount++; return guest.id;});
      emit('tea', {guests:ids, patienceRestored:7}); say('茶香散开了。客人们捧起杯子，慢慢等这一顿晚饭。'); renderKitchen(); return;
    }
    const guest = guests.find(person => person.id === button.dataset.guest); if (!guest) return;
    if (action === 'guest' && guest.status === 'waiting') {
      guest.status = 'accepted'; guest.line = `“${recipeById(guest.recipeId).name}，听起来不错。”`;
      emit('order_accepted', {guestId:guest.id, guest:guest.name, recipe:recipeById(guest.recipeId).name}); say(`记好了，去料理台为${guest.name}备菜。`); renderGuests(); renderKitchen(); return;
    }
    if (action === 'cook' && guest.status === 'accepted') {
      if (state.cooking) {say('先把手边这份做好，再开始下一道。'); return;}
      if (consumed.has(guest.fish.key)) {say('这份食材已经下锅了。'); return;}
      consumed.add(guest.fish.key); guest.status = 'cooking'; state.cooking = {guestId:guest.id, progress:0};
      emit('cooking_start', {guestId:guest.id, recipe:recipeById(guest.recipeId).name, ingredientId:guest.fish.id}); say('锅里滋啦一声，晚饭的香味飘出来了。'); renderAll(); return;
    }
    if (action === 'guest' && guest.status === 'ready' && state.cooking?.guestId === guest.id) {
      const recipe = recipeById(guest.recipeId); const tip = Math.max(0, Math.round(guest.patience / patienceCap * 5 + Math.min(2, guest.teaCount) + clamp(options.trust, 0, 6) / 3));
      guest.status = 'served'; state.cooking = null; state.served++; state.earned += guest.price + tip; state.satisfaction += clamp(3.6 + guest.patience / patienceCap * 1.2 + (guest.teaCount ? .2 : 0), 1, 5);
      const meal = {characterId:guest.characterId, ingredientId:guest.fish.id, species:guest.fish.speciesKey, huntId:recipe.huntId, sizeFactor:guest.fish.sizeFactor || 1, price:guest.price, tip, tier:recipe.tier.title};
      servedMeals.push(meal);
      emit('served', {guestId:guest.id, guest:guest.name, recipe:recipe.name, ...meal, patienceRemaining:Number(guest.patience.toFixed(2))});
      if(recipe.huntId&&!events.some(event=>event.type==='hunt_dish_served'&&event.data.huntId===recipe.huntId))emit('hunt_dish_served',{huntId:recipe.huntId,recipe:recipe.name,ingredientId:guest.fish.id,sceneId:HUNT_STORIES[recipe.huntId].feastScene.id});
      if (guest.special) emit('night_guest_clue', {characterId:guest.characterId,clue:evening.servedClue});
      emit('departure', {guestId:guest.id, guest:guest.name, reason:'satisfied'}); say(`${guest.name}：“${guest.after}” +${guest.price + tip} 贝币`); renderAll();
      if (!activeGuests().length && (!anyAvailable() || state.nextArrival >= 6)) finish(anyAvailable() ? 'all_served' : 'sold_out');
    }
  }
  function onKey(event) {
    if (state.called) return;
    if (event.key === 'Escape') {event.preventDefault(); event.stopImmediatePropagation(); if (state.phase === 'service') state.paused ? resume() : pause(); return;}
    if (root.contains(event.target)) event.stopPropagation();
  }
  root.addEventListener('click', onClick); document.addEventListener('keydown', onKey, true);
  const workshopNote = document.createElement('div'); workshopNote.className = 'rs-workshop-note';
  workshopNote.textContent = `${season?.name || '当季'}鲜味 · 厨房 ${kitchenLevel} 级，料理售价 +${kitchenLevel * 8}% · 食堂 ${diningLevel} 级，客人耐心 +${diningLevel * 3} 秒`;
  query('.rs-guide').after(workshopNote);
  renderAll(); emit('opened', {pantry:pantry.length, distinctFish:recipes.length, level, kitchenLevel, diningLevel, season:season?.name});
  return {
    pause, resume,
    end() { if (state.phase === 'service') finish('early_close'); else if (state.phase === 'menu') conclude(true); },
    destroy() { if (state.phase === 'service') finish('external_close'); if (state.phase === 'menu') conclude(true); else conclude(); },
    getState() { return {phase:state.phase, paused:state.paused, remaining:state.remaining, served:state.served, earned:state.earned, consumedIds:pantry.filter(fish => consumed.has(fish.key)).map(fish => fish.id)}; }
  };
}
