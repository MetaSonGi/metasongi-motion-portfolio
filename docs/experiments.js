import { experimentCatalog } from './experiment-catalog.js?v=1';
import { createExperimentScene } from './experiment-scene.js?v=1';
import { projects } from './content.js?v=ten-worlds-1';
import { worldCatalog } from './world-catalog.js?v=ten-2';
import { createScope, mountProjectViewer } from './world-utils.js?v=ten-worlds-1';

const art = ['vrm', 'glass', 'orbit'].map(name => 'art/' + name + '.jpg');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const webgl = {
  prism: ['회전 각도', 25],
  signal: ['파동 보내기', 0],
  transit: ['통과 지점', 0],
  assembly: ['부품 간격', 8],
  frequency: ['주파수', 45],
};

function slider(label, value) {
  return `<label class="experiment-range"><span>${label}</span><input type="range" min="0" max="100" value="${value}"></label>`;
}

function mountWebGL(scope, world, host, isPaused) {
  const [label, initial] = webgl[world];
  host.innerHTML = `<div class="experiment-render"><div class="experiment-fallback" aria-hidden="true"></div><canvas aria-hidden="true"></canvas></div>
    <div class="experiment-tools">${world === 'signal' ? `<button type="button">${label}</button>` : slider(label, initial)}</div>`;
  const canvas = host.querySelector('canvas');
  const frame = canvas.parentElement;
  const input = host.querySelector('input');
  let engine;
  try {
    engine = createExperimentScene(canvas, world);
    frame.classList.add('webgl-ready');
  } catch {
    const note = document.createElement('p');
    note.className = 'experiment-fallback-note';
    note.textContent = '이 환경에서는 3D 대신 정지 화면이 표시됩니다.';
    host.querySelector('.experiment-tools').replaceChildren(note);
    return;
  }

  let x = 0;
  let y = 0;
  let stamp = 0;
  let previous = performance.now();
  let time = 0;
  let burst = 0;
  let dirty = true;
  const shell = host.closest('.experiment');
  const isTransit = world === 'transit';
  if (isTransit) shell.classList.add('experiment-scroll');
  const state = { time: 0, x: 0, y: 0, travel: 0, value: initial / 100, pulse: 1 };
  function loseContext(event) {
    event.preventDefault();
    frame.classList.remove('webgl-ready');
  }
  scope.on(canvas, 'webglcontextlost', loseContext);
  scope.on(canvas, 'webglcontextrestored', () => {
    frame.classList.add('webgl-ready');
    dirty = true;
  });

  function resize() {
    engine.resize(frame.clientWidth, frame.clientHeight);
    dirty = true;
  }

  function loop(now) {
    const dt = Math.min((now - previous) / 1000, .05);
    previous = now;
    const animate = !motion.matches && !isPaused();
    const scroll = isTransit && animate ? Math.max(0, Math.min(1, -shell.getBoundingClientRect().top / Math.max(1, shell.clientHeight - host.parentElement.clientHeight))) : 0;
    const travel = Math.max(scroll, isTransit ? Number(input.value) / 100 : 0);
    if (isTransit) {
      host.style.setProperty('--travel', travel);
    }
    const ringActive = burst > 0 && now - burst < 1250;
    if ((dirty || animate || ringActive) && !document.hidden && frame.classList.contains('webgl-ready')) {
      time += animate ? dt : 0;
      state.time = time;
      state.x = animate ? x : 0;
      state.y = animate ? y : 0;
      state.travel = travel;
      state.value = input ? Number(input.value) / 100 : 0;
      state.pulse = ringActive && animate ? (now - burst) / 1250 : ringActive ? .35 : 1;
      engine.render(state);
      dirty = false;
    }
    stamp = requestAnimationFrame(loop);
  }

  scope.on(frame, 'pointermove', event => {
    const rect = frame.getBoundingClientRect();
    x = (event.clientX - rect.left) / rect.width - .5;
    y = (event.clientY - rect.top) / rect.height - .5;
  }, { passive: true });
  scope.on(frame, 'pointerleave', () => { x = y = 0; });
  scope.on(motion, 'change', () => { dirty = true; });
  scope.on(document.querySelector('#pause'), 'click', () => { dirty = true; });
  if (input) scope.on(input, 'input', () => { dirty = true; });
  if (world === 'signal') {
    const pulse = () => { burst = performance.now(); dirty = true; };
    scope.on(host.querySelector('button'), 'click', pulse);
    scope.on(frame, 'pointerdown', pulse);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(frame);
  resize();
  stamp = requestAnimationFrame(loop);
  scope.add(() => { observer.disconnect(); cancelAnimationFrame(stamp); engine.dispose(); });
}

function mountAfterimage(scope, host) {
  host.innerHTML = `<div class="afterimage-sheet">
    <div class="afterimage-traces" aria-hidden="true"></div>
    <strong>HERE<br><em>AGAIN.</em></strong>
    <span>탭을 떠났다가 돌아오면 이 포스터에 흔적이 남습니다.</span>
  </div><div class="experiment-tools"><button type="button">흔적 남기기</button><button type="button" data-reset>초기화</button><output aria-live="polite">흔적 0개</output></div>`;
  const traces = host.querySelector('.afterimage-traces');
  const output = host.querySelector('output');
  let visits = 0;
  function printTrace() {
    visits++;
    const mark = document.createElement('i');
    mark.style.setProperty('--mark-x', 12 + (visits * 29) % 78 + '%');
    mark.style.setProperty('--mark-y', 14 + (visits * 47) % 70 + '%');
    mark.style.setProperty('--angle', (visits * 137.5) % 360 + 'deg');
    traces.append(mark);
    if (traces.childElementCount > 16) traces.firstElementChild.remove();
    output.value = '흔적 ' + visits + '개';
  }
  scope.on(document, 'visibilitychange', () => { if (!document.hidden) printTrace(); });
  scope.on(host.querySelector('button'), 'click', printTrace);
  scope.on(host.querySelector('[data-reset]'), 'click', () => {
    visits = 0;
    traces.replaceChildren();
    output.value = '흔적 0개';
  });
}

function mountType(scope, host) {
  host.innerHTML = `<div class="typepress-print"><strong>FORM</strong><strong>FOLLOWS</strong><strong>PLAY.</strong></div>
    <div class="experiment-tools">${slider('압력', 25)}<button type="button">줄 순서 바꾸기</button></div>`;
  const print = host.querySelector('.typepress-print');
  const control = host.querySelector('input');
  function compress() { print.style.setProperty('--pressure', control.value / 100); }
  scope.on(control, 'input', compress);
  scope.on(host.querySelector('button'), 'click', () => print.append(print.firstElementChild));
  compress();
}

function mountCuts(scope, host) {
  host.innerHTML = `<div class="cutroom-screen">${projects.map((project, index) => `<article class="cutroom-shot" ${index ? 'hidden' : ''}>
    <img src="${art[index]}" alt=""><div><h2>${project.name}</h2><button type="button" data-case="${project.id}">작품 상세 ↗</button></div>
  </article>`).join('')}</div><div class="experiment-tools" role="group" aria-label="장면 선택">${projects.map((project, index) =>
    `<button type="button" aria-pressed="${index === 0}" aria-label="${project.name} 장면">0${index + 1}</button>`).join('')}</div>`;
  const buttons = [...host.querySelectorAll('.experiment-tools button')];
  const shots = [...host.querySelectorAll('.cutroom-shot')];
  for (const [index, button] of buttons.entries()) {
    scope.on(button, 'click', () => {
      shots.forEach((shot, position) => { shot.hidden = position !== index; });
      buttons.forEach((item, position) => item.setAttribute('aria-pressed', String(position === index)));
    });
  }
  mountProjectViewer(host, scope);
}

function mountGrid(scope, host) {
  const inks = ['#ff62a5', '#d8ff42', '#61e7ed', '#aa8bff'];
  const colors = ['분홍', '라임', '민트', '보라'];
  host.innerHTML = `<div class="chroma-board" role="group" aria-label="칠할 격자">${Array.from({ length: 64 }, (_, index) => `<button type="button" aria-label="${Math.floor(index / 8) + 1}행 ${index % 8 + 1}열" aria-pressed="false" tabindex="${index === 0 ? 0 : -1}"></button>`).join('')}</div>
    <div class="experiment-tools" role="group" aria-label="색상 선택">${inks.map((ink, index) => `<button class="chroma-ink" style="--ink-color:${ink}" aria-pressed="${index === 0}">${colors[index]}</button>`).join('')}<button type="button" data-reset>지우기</button></div>`;
  const board = host.querySelector('.chroma-board');
  const tiles = [...board.children];
  const palette = [...host.querySelectorAll('.chroma-ink')];
  let color = inks[0];
  for (const [index, button] of palette.entries()) {
    scope.on(button, 'click', () => {
      color = inks[index];
      palette.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    });
  }
  function paint(tile) {
    tile.style.setProperty('--tile-ink', color);
    tile.setAttribute('aria-pressed', 'true');
  }
  scope.on(board, 'click', event => { if (tiles.includes(event.target)) paint(event.target); });
  scope.on(board, 'pointerover', event => { if (event.buttons === 1 && tiles.includes(event.target)) paint(event.target); });
  scope.on(board, 'keydown', event => {
    const index = tiles.indexOf(event.target);
    const offset = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -8, ArrowDown: 8 }[event.key];
    if (index < 0 || !offset) return;
    event.preventDefault();
    const next = tiles[(index + offset + tiles.length) % tiles.length];
    event.target.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  });
  scope.on(host.querySelector('[data-reset]'), 'click', () => {
    tiles.forEach(tile => {
      tile.style.removeProperty('--tile-ink');
      tile.setAttribute('aria-pressed', 'false');
    });
  });
}

function mountSplit(scope, host) {
  host.innerHTML = `<div class="splitlight-frame">
    <img src="${art[0]}" alt="Virtual Human Studio의 금속 인물">
    <img src="${art[1]}" alt="AI 영상 프로젝트의 반투명 오브젝트">
    <i aria-hidden="true"></i>
  </div><div class="experiment-tools">${slider('이미지 경계', 50)}<button type="button" data-case="vrm">가상 인물 ↗</button><button type="button" data-case="pixelle">AI 영상 ↗</button></div>`;
  const input = host.querySelector('input');
  const frame = host.querySelector('.splitlight-frame');
  scope.on(input, 'input', () => frame.style.setProperty('--split', input.value + '%'));
  mountProjectViewer(host, scope);
}

const interfaces = { afterimage: mountAfterimage, typepress: mountType, cutroom: mountCuts, chromagrid: mountGrid, splitlight: mountSplit };

export function mountExperiment(root, world, isPaused) {
  const scope = createScope();
  const index = experimentCatalog.findIndex(item => item.id === world);
  const item = experimentCatalog[index];
  const at = worldCatalog.findIndex(w => w.id === world);
  const next = worldCatalog[(at + 1) % worldCatalog.length];
  root.innerHTML = `<div class="experiment" data-experiment="${world}">
    <section class="experiment-stage" aria-labelledby="experiment-title">
      <header class="experiment-copy"><p>EXPERIMENT ${item.number}</p><h1 id="experiment-title">${item.name}</h1><p>${item.label}</p></header>
      <div class="experiment-body"></div>
    </section>
    <footer class="experiment-footer"><a href="./#portfolio-worlds">← 모든 세계</a><a class="experiment-next" href="?world=${next.id}">${next.name} →</a></footer>
  </div>`;
  const host = root.querySelector('.experiment-body');
  if (webgl[world]) mountWebGL(scope, world, host, isPaused);
  else interfaces[world](scope, host);
  return () => scope.dispose();
}
