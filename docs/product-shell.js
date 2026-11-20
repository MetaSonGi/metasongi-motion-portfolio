// Product-launch layer shared by every world except home:
// a floating product nav, a cinematic "model reveal" intro, a tech-spec sheet
// and colour swatches for the world lineup menu.
import { worldCatalog } from './world-catalog.js?v=experiments-1';
import { projects } from './content.js?v=ten-worlds-1';

const colors = {
  space:['#7b5cff','#4de2ff'], journey:['#ffd36b','#ff8a5c'], workspace:['#c9d1ff','#7b8cff'], gallery:['#f1efe8','#b9b4a8'],
  editorial:['#ff5c3a','#ffb199'], terminal:['#3aff8a','#0f6b3a'], atlas:['#4de2ff','#2a6bff'], bento:['#ff7ad9','#ffd36b'],
  noir:['#ffffff','#5a5a5a'], garden:['#9be15d','#00b37a'], afterimage:['#ff3d6e','#3d7bff'], prism:['#b8a6ff','#7af0ff'],
  signal:['#d4ff3a','#3affc5'], transit:['#5c6bff','#ff4dd2'], typepress:['#d4ff3a','#f1efe8'], assembly:['#ff9a3d','#ffe1b8'],
  cutroom:['#ff4d4d','#ffd0d0'], frequency:['#4dffdf','#7b5cff'], chromagrid:['#ff3df2','#3dffb0'], splitlight:['#f1efe8','#d4ff3a'],
};
const total = worldCatalog.length;
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const paint = (el, id) => { const [a, b] = colors[id] || colors.signal; el.style.setProperty('--pa', a); el.style.setProperty('--pb', b); };
const specList = world => String(world.interaction).split(/\s*·\s*/).filter(Boolean);

let current = '', api = null, nav, sheet, progressFrame = 0;

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
      <div><dt>시리즈</dt><dd>${index < 10 ? 'Worlds · 01–10' : 'Experiments · 11–20'}</dd></div>
      <div><dt>카테고리</dt><dd>${esc(world.kind)}</dd></div>
      <div><dt>인터랙션</dt><dd class="pn-chips">${specList(world).map(s => `<span>${esc(s)}</span>`).join('')}</dd></div>
      <div><dt>담긴 작업</dt><dd class="pn-works">${projects.map(p => `<a href="${esc(p.url)}" target="_blank" rel="noopener"><b>${esc(p.name)}</b><small>${esc(p.category)}</small><span>↗</span></a>`).join('')}</dd></div>
    </dl>
    <div class="pn-compare"><span class="pn-kicker">다른 모델과 비교</span><div>${card(prev, 'PREV')}${card(next, 'NEXT')}</div>
      <button type="button" class="pn-all" data-pn-lineup>스무 개 모델 전체 보기 ◈</button></div>
  </div>`;
  document.body.style.overflow = 'hidden';
  sheet.showModal();
}

function playIntro(world) {
  document.querySelector('.pn-intro')?.remove();
  const intro = document.createElement('div');
  intro.className = 'pn-intro';
  intro.setAttribute('aria-hidden', 'true');
  paint(intro, world.id);
  let i = 0;
  const name = world.name.split(' ').map(word => `<span class="pn-w">${[...word].map(ch => `<span class="pn-c" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  intro.innerHTML = `<i class="pn-orb"></i><i class="pn-ring"></i>
    <div class="pn-intro-top"><span>METASONGI · ${esc(world.kind)}</span><span>MODEL ${world.number} / ${total}</span></div>
    <div class="pn-intro-core"><span class="pn-intro-eyebrow">Introducing</span><h2>${name}</h2><p>${esc(world.label)}</p></div>
    <dl class="pn-intro-specs"><div><dt>KIND</dt><dd>${esc(world.kind)}</dd></div><div><dt>INTERACTION</dt><dd>${esc(world.interaction)}</dd></div><div><dt>SERIES</dt><dd>${Number(world.number) <= 10 ? 'WORLDS' : 'EXPERIMENTS'}</dd></div></dl>
    <span class="pn-intro-skip">CLICK TO ENTER ↘</span>`;
  document.body.append(intro);
  const leave = () => {
    if (intro.classList.contains('pn-out')) return;
    intro.classList.add('pn-out');
    setTimeout(() => intro.remove(), 900);
  };
  const timer = setTimeout(leave, 2300);
  const skip = () => { clearTimeout(timer); leave(); };
  intro.addEventListener('pointerdown', skip);
  addEventListener('keydown', skip, { once: true });
  addEventListener('wheel', skip, { once: true, passive: true });
  return () => { clearTimeout(timer); removeEventListener('keydown', skip); removeEventListener('wheel', skip); intro.remove(); };
}

export function paintLineup() {
  document.querySelectorAll('[data-world-choice]').forEach(button => paint(button, button.dataset.worldChoice));
}

export function mountProductShell(name, { navigate, openMenu, intro }) {
  current = name;
  api = { navigate, openMenu };
  if (!nav) buildNav();
  if (!sheet) buildSheet();
  const world = worldCatalog.find(w => w.id === name);
  paint(document.body, name);
  nav.querySelector('.pn-num').textContent = `${world.number}/${total}`;
  nav.querySelector('.pn-name').textContent = world.name;
  queueProgress();
  const stopIntro = intro ? playIntro(world) : () => {};
  return () => {
    stopIntro();
    if (sheet.open) sheet.close();
    document.body.style.removeProperty('--pa');
    document.body.style.removeProperty('--pb');
  };
}
