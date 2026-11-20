// Product-launch layer shared by every world except home:
// a floating product nav, a cinematic "model reveal" intro, a tech-spec sheet
// and colour swatches for the world lineup menu.
import { worldCatalog } from './world-catalog.js?v=ten-1';
import { projects } from './content.js?v=ten-worlds-1';
import { mountMotion } from './world-motion.js?v=2';

const colors = {
  space:['#7b5cff','#4de2ff'], journey:['#ffd36b','#ff8a5c'], workspace:['#c9d1ff','#7b8cff'], gallery:['#f1efe8','#b9b4a8'],
  editorial:['#ff5c3a','#ffb199'], terminal:['#3aff8a','#0f6b3a'], atlas:['#4de2ff','#2a6bff'], bento:['#ff7ad9','#ffd36b'],
  noir:['#ffffff','#5a5a5a'], garden:['#9be15d','#00b37a'], afterimage:['#ff3d6e','#3d7bff'], prism:['#b8a6ff','#7af0ff'],
  signal:['#d4ff3a','#3affc5'], transit:['#5c6bff','#ff4dd2'], typepress:['#d4ff3a','#f1efe8'], assembly:['#ff9a3d','#ffe1b8'],
  cutroom:['#ff4d4d','#ffd0d0'], frequency:['#4dffdf','#7b5cff'], chromagrid:['#ff3df2','#3dffb0'], splitlight:['#f1efe8','#d4ff3a'],
};
const total = worldCatalog.length;
// Each world's personality: a type voice for its reveal and a one-line motto.
const persona = {
  space:{style:'cosmic',motto:'Scroll is the engine.'},
  journey:{style:'soft',motto:'Small steps, big ideas.'},
  workspace:{style:'mono',motto:'Everything is a window.'},
  gallery:{style:'serif',motto:'Work, framed as objects.'},
  editorial:{style:'serif',motto:'Read the build, line by line.'},
  atlas:{style:'mono',motto:'Every idea is a node.'},
  assembly:{style:'product',motto:'Take it apart. Put it back.'},
  bento:{style:'soft',motto:'Play is a build tool.'},
  noir:{style:'film',motto:'Every frame is a decision.'},
  garden:{style:'serif',motto:'Ideas grow in public.'},
};
const personaOf = id => persona[id] || { style:'cosmic', motto:'' };
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const paint = (el, id) => { const [a, b] = colors[id] || colors.signal; el.style.setProperty('--pa', a); el.style.setProperty('--pb', b); };
const specList = world => String(world.interaction).split(/\s*·\s*/).filter(Boolean);

let current = '', api = null, nav, sheet, progressFrame = 0;

// In-world controls: tag the choice/command elements of every world so
// product-shell.css can give them one product-grade look and feel.
const CONTROL = [
  '.experiment-tools button:not(.chroma-ink)', '.scene-effects button', '.character-controls button', '.route-label button',
  '.noir-transport button', '.noir-scene>button', '.console-shortcuts button', '.console-top-actions button', '.atlas-map-controls button',
  '.bento-pad-actions button', '.bento-stack button', '.garden-actions button', '.edition-control', '.other-world',
  '.world-footer button', '.journal-footer button', '.gallery-bottom button', '.atlas-inspector a', '.journal-editor a',
].join(',');
const CTA = '.experiment-footer a, .story-link, .bento-footer a, .garden-footer a, .journal-footer a, .sidebar-github';
const CARD = '.bento-project, .garden-card, .finder-project, .exhibit-art';
const SWATCH = '.chroma-ink, .pad-colors button';

function syncRange(input) {
  const min = Number(input.min || 0), max = Number(input.max || 100);
  input.style.setProperty('--v', ((Number(input.value) - min) / ((max - min) || 1)) * 100 + '%');
}

function enhance(root) {
  const tag = (selector, cls) => root.querySelectorAll(selector).forEach(el => el.classList.add(cls));
  tag(CONTROL, 'pc-btn');
  tag(CTA, 'pc-cta');
  tag(CARD, 'pc-card');
  tag(SWATCH, 'pc-swatch');
  tag('select', 'pc-select');
  root.querySelectorAll('.chapter-nav').forEach(el => el.classList.add('pc-steps'));
  root.querySelectorAll('input[type=range]').forEach(input => { input.classList.add('pc-range'); syncRange(input); });
  root.querySelectorAll('.experiment-tools, .scene-effects, .character-controls, .noir-transport, .console-shortcuts, .atlas-map-controls, .bento-pad-actions')
    .forEach(group => group.classList.add('pc-group'));
}

function mountControls(root) {
  const controller = new AbortController(), { signal } = controller;
  enhance(root);
  let queued = 0;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = requestAnimationFrame(() => { queued = 0; enhance(root); });
  });
  observer.observe(root, { childList: true, subtree: true });
  root.addEventListener('input', event => { if (event.target.matches?.('input[type=range]')) syncRange(event.target); }, { signal });
  // programmatic value changes (scroll-driven sliders) don't fire input
  const poll = setInterval(() => root.querySelectorAll('.pc-range').forEach(syncRange), 120);
  root.addEventListener('pointerdown', event => {
    const el = event.target.closest('.pc-btn,.pc-cta');
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect(), dot = document.createElement('i');
    dot.className = 'pc-ripple';
    dot.style.left = event.clientX - r.left + 'px';
    dot.style.top = event.clientY - r.top + 'px';
    el.append(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }, { signal });
  const stopMotion = mountMotion(root);
  return () => { stopMotion(); controller.abort(); observer.disconnect(); clearInterval(poll); cancelAnimationFrame(queued); };
}

function at(offset) {
  const index = worldCatalog.findIndex(w => w.id === current);
  return worldCatalog[(index + offset + total) % total];
}

function buildNav() {
  const header = document.querySelector('.world-header');
  nav = document.createElement('nav');
  nav.className = 'pn-mid';
  nav.setAttribute('aria-label', '세계 내비게이션');
  nav.innerHTML = `<button type="button" class="pn-step" data-pn="prev" aria-label="이전 세계">←</button>
    <div class="pn-id"><i class="pn-dot" aria-hidden="true"></i><span class="pn-num"></span><b class="pn-name"></b></div>
    <button type="button" class="pn-step" data-pn="next" aria-label="다음 세계">→</button>
    <span class="pn-sep" aria-hidden="true"></span>
    <button type="button" class="pn-link" data-pn="specs">스펙</button>
    <button type="button" class="pn-link" data-pn="lineup">라인업</button>
    <i class="pn-progress" aria-hidden="true"></i>`;
  header.querySelector('.header-actions').before(nav);
  nav.addEventListener('click', event => {
    const action = event.target.closest('[data-pn]')?.dataset.pn;
    if (action === 'prev' || action === 'next') api?.navigate(at(action === 'prev' ? -1 : 1).id);
    else if (action === 'specs') openSpecs();
    else if (action === 'lineup') api?.openMenu();
  });
  addEventListener('scroll', queueProgress, { passive: true });
  addEventListener('resize', queueProgress);
}

function queueProgress() {
  if (progressFrame) return;
  progressFrame = requestAnimationFrame(() => {
    progressFrame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav?.style.setProperty('--pp', max > 4 ? String(Math.min(1, scrollY / max)) : '0');
  });
}

function buildSheet() {
  sheet = document.createElement('dialog');
  sheet.className = 'pn-specs';
  sheet.setAttribute('aria-labelledby', 'pn-specs-title');
  document.body.append(sheet);
  sheet.addEventListener('click', event => {
    const r = sheet.querySelector('.pn-sheet').getBoundingClientRect();
    if (event.clientY < r.top || event.target.closest('[data-pn-close]')) return sheet.close();
    const go = event.target.closest('[data-pn-go]');
    if (go) { sheet.close(); api?.navigate(go.dataset.pnGo); }
    if (event.target.closest('[data-pn-lineup]')) { sheet.close(); api?.openMenu(); }
  });
  sheet.addEventListener('close', () => { document.body.style.overflow = ''; });
}

function openSpecs() {
  const index = worldCatalog.findIndex(w => w.id === current), world = worldCatalog[index];
  if (!world) return;
  const prev = at(-1), next = at(1);
  paint(sheet, current);
  const card = (w, dir) => `<button type="button" class="pn-model" data-pn-go="${w.id}" style="--pa:${colors[w.id][0]};--pb:${colors[w.id][1]}">
      <i aria-hidden="true"></i><span>${dir} · MODEL ${w.number}</span><b>${esc(w.name)}</b><small>${esc(w.label)}</small></button>`;
  sheet.innerHTML = `<div class="pn-sheet">
    <button type="button" class="pn-close" data-pn-close aria-label="스펙 닫기">×</button>
    <div class="pn-sheet-hero"><i class="pn-orb" aria-hidden="true"></i>
      <span class="pn-kicker">TECH SPECS · MODEL ${world.number} / ${total}</span>
      <h2 id="pn-specs-title">${esc(world.name)}</h2>
      <p>${esc(world.label)} — ${esc(world.description)}</p></div>
    <dl class="pn-table">
      <div><dt>모델</dt><dd><b>${world.number}</b> / ${total}</dd></div>
      <div><dt>시그니처</dt><dd class="pn-motto" data-persona="${personaOf(current).style}">${esc(personaOf(current).motto)}</dd></div>
      <div><dt>카테고리</dt><dd>${esc(world.kind)}</dd></div>
      <div><dt>인터랙션</dt><dd class="pn-chips">${specList(world).map(s => `<span>${esc(s)}</span>`).join('')}</dd></div>
      <div><dt>담긴 작업</dt><dd class="pn-works">${projects.map(p => `<a href="${esc(p.url)}" target="_blank" rel="noopener"><b>${esc(p.name)}</b><small>${esc(p.category)}</small><span>↗</span></a>`).join('')}</dd></div>
    </dl>
    <div class="pn-compare"><span class="pn-kicker">다른 모델과 비교</span><div>${card(prev, 'PREV')}${card(next, 'NEXT')}</div>
      <button type="button" class="pn-all" data-pn-lineup>열 개의 세계 전체 보기 ◈</button></div>
  </div>`;
  document.body.style.overflow = 'hidden';
  sheet.showModal();
}

// "Edit cut" transition: a full-screen edit-suite reveal of the next world.
// REC HUD + running timecode, kinetic name with an RGB-split glitch, a
// timeline of all twenty clips with the playhead cutting from the previous
// world to this one, then a venetian-blind slice wipe out to the live world.
function playIntro(world, from) {
  document.querySelector('.pn-intro')?.remove();
  const intro = document.createElement('div');
  intro.className = 'pn-intro';
  intro.dataset.persona = personaOf(world.id).style;
  intro.setAttribute('aria-hidden', 'true');
  paint(intro, world.id);
  const to = worldCatalog.indexOf(world);
  const start = from >= 0 ? from : to;
  let i = 0;
  const name = world.name.split(' ').map(word => `<span class="pn-w">${[...word].map(ch => `<span class="pn-c" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  const clips = worldCatalog.map((w, k) => `<i class="${k === to ? 'is-on' : ''}" style="--c:${colors[w.id][0]}"></i>`).join('');
  const fromName = from >= 0 && from !== to ? worldCatalog[from].name : 'COLD OPEN';
  intro.innerHTML = `<i class="pn-orb"></i><i class="pn-ring"></i><i class="pn-flash"></i><i class="pn-scan"></i>
    <div class="pn-intro-top"><span class="pn-rec"><b></b>REC</span><span class="pn-tc">00:00:00:00</span><span>CUT ${pad(start + 1)} → ${pad(to + 1)}</span><span>MODEL ${world.number} / ${total}</span></div>
    <i class="pn-frame" aria-hidden="true"></i>
    <div class="pn-intro-core"><span class="pn-intro-eyebrow">${esc(fromName)} <em>→</em> Introducing</span><h2 data-text="${esc(world.name)}">${name}</h2><p class="pn-intro-motto">${esc(personaOf(world.id).motto)}</p><p>${esc(world.label)}</p></div>
    <div class="pn-intro-foot">
      <dl class="pn-intro-specs"><div><dt>KIND</dt><dd>${esc(world.kind)}</dd></div><div><dt>INTERACTION</dt><dd>${esc(world.interaction)}</dd></div><div><dt>WORLD</dt><dd>${world.number} OF ${pad(total)}</dd></div></dl>
      <div class="pn-timeline" style="--from:${start};--to:${to};--n:${total}"><div class="pn-clips">${clips}</div><i class="pn-head"><span>${world.number}</span></i></div>
    </div>
    <span class="pn-intro-skip">CLICK TO ENTER ↘</span>`;
  document.body.append(intro);
  const tc = intro.querySelector('.pn-tc'), t0 = performance.now();
  let raf = requestAnimationFrame(function tick(now) {
    const f = Math.floor((now - t0) / (1000 / 24)), sec = Math.floor(f / 24);
    tc.textContent = `00:00:${pad(sec)}:${pad(f % 24)}`;
    raf = requestAnimationFrame(tick);
  });
  const leave = () => {
    if (intro.classList.contains('pn-out')) return;
    intro.classList.add('pn-out');
    setTimeout(() => { cancelAnimationFrame(raf); intro.remove(); }, 950);
  };
  const timer = setTimeout(leave, 2500);
  const skip = () => { clearTimeout(timer); leave(); };
  intro.addEventListener('pointerdown', skip);
  addEventListener('keydown', skip, { once: true });
  addEventListener('wheel', skip, { once: true, passive: true });
  return () => { clearTimeout(timer); cancelAnimationFrame(raf); removeEventListener('keydown', skip); removeEventListener('wheel', skip); intro.remove(); };
}

// Lineup: a kinetic list of all twenty worlds with a live preview pane.
export function paintLineup() {
  const menu = document.querySelector('#world-menu');
  const choices = [...menu.querySelectorAll('[data-world-choice]')];
  choices.forEach((button, index) => {
    paint(button, button.dataset.worldChoice);
    button.dataset.persona = personaOf(button.dataset.worldChoice).style;
    button.style.setProperty('--i', index);
    button.dataset.num = pad(index + 1);
  });
  const preview = document.createElement('aside');
  preview.className = 'lineup-preview';
  preview.setAttribute('aria-hidden', 'true');
  menu.querySelector('.world-options').after(preview);
  const show = id => {
    const world = worldCatalog.find(w => w.id === id);
    if (!world || preview.dataset.id === id) return;
    preview.dataset.id = id;
    paint(preview, id);
    preview.dataset.persona = personaOf(id).style;
    preview.innerHTML = `<i class="lp-orb"></i><span class="lp-num">${world.number}</span>
      <div class="lp-copy"><span class="lp-kind">${esc(world.kind)} · WORLD ${world.number}</span>
      <b>${esc(world.name)}</b><em class="lp-motto">${esc(personaOf(id).motto)}</em><p>${esc(world.label)} — ${esc(world.description)}</p>
      <div class="lp-chips">${specList(world).map(x => `<span>${esc(x)}</span>`).join('')}</div>
      <span class="lp-enter">ENTER WORLD ↗</span></div>`;
  };
  const pick = event => { const id = event.target.closest?.('[data-world-choice]')?.dataset.worldChoice; if (id) show(id); };
  menu.addEventListener('pointerover', pick);
  menu.addEventListener('focusin', pick);
  new MutationObserver(() => {
    if (!menu.open) return;
    const active = menu.querySelector('[data-world-choice][aria-pressed=true]') || choices[0];
    preview.dataset.id = '';
    show(active.dataset.worldChoice);
  }).observe(menu, { attributes: true, attributeFilter: ['open'] });
}

export function mountProductShell(name, { root, navigate, openMenu, intro }) {
  const from = worldCatalog.findIndex(w => w.id === current);
  current = name;
  api = { navigate, openMenu };
  if (!nav) buildNav();
  if (!sheet) buildSheet();
  const world = worldCatalog.find(w => w.id === name);
  paint(document.body, name);
  nav.querySelector('.pn-num').textContent = `${world.number}/${total}`;
  nav.querySelector('.pn-name').textContent = world.name;
  queueProgress();
  const stopIntro = intro ? playIntro(world, from) : () => {};
  const stopControls = root ? mountControls(root) : () => {};
  return () => {
    stopIntro();
    stopControls();
    if (sheet.open) sheet.close();
    document.body.style.removeProperty('--pa');
    document.body.style.removeProperty('--pb');
  };
}
