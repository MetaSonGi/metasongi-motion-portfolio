// "Play / Build — the toy box" — world `bento` (08).
// A tactile Three.js playground. A tiny home-made physics engine (compound-sphere rigid bodies with
// impulse resolution + verlet noodles + a spring-mesh blob) drives every toy. Scroll opens the box,
// chunky 3D letters burst out and hop into "PLAY/BUILD"; the camera springs between toy stations:
// a tech-stack block tower, a gachapon that dispenses the three projects, a doodle pad whose strokes
// fall as 3D noodles, and a squishy blob. The finale sweeps every toy back into the box.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { projects, profileURL } from '../content.js?v=ten-worlds-1';

const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs'
};
const ART = { vrm: 'art/vrm.jpg', pixelle: 'art/glass.jpg', motion: 'art/orbit.jpg' };
const TRACK_VH = 1000;
const COL = { pink: '#ff7ad9', yellow: '#ffd36b', mint: '#5fe0bf', blue: '#7aa2ff', orange: '#ff9257', lilac: '#b58cff', ink: '#2a1838' };
const PALETTE = [COL.pink, COL.yellow, COL.mint, COL.blue, COL.orange, COL.lilac];
const CAP_COL = [COL.pink, COL.yellow, COL.mint];
const CARD_TINT = ['#ffd6f1', '#fff0bd', '#c9f5e8'];
const STACK = [...new Set(projects.flatMap(p => p.stack))];
const X = { box: 0, blocks: 14, gacha: 28, pad: 42, blob: 56 };
const BOX_Z = -2.6;
const BOUNDS = { x0: -10, x1: 64, z0: -6.5, z1: 7.5 };
const G = 22;
const LR = 0.21;              // letter stroke radius
const PAD = { x: 42, y: 3.1, z: -1.4, w: 7.2, h: 4.4, dz: -0.95 };
const BLOB = { x: 56, R: 1.6, plate: 0.3 };
const WORD = ['P', 'L', 'A', 'Y', '/', 'B', 'U', 'I', 'L', 'D'];

const ST = [
  { id: 'intro', num: '00', title: 'The Toy Box', ko: '스크롤해서 상자를 열고, 튀어나온 글자를 잡아 던져 보세요.' },
  { id: 'blocks', num: '01', title: 'Building Blocks', ko: '실제로 쓰는 기술 스택으로 탑을 쌓았습니다. 블록을 눌러 무너뜨려 보세요.' },
  { id: 'gacha', num: '02', title: 'Capsule Toys', ko: '스크롤하거나 손잡이를 돌리면 프로젝트 캡슐이 하나씩 나옵니다.' },
  { id: 'pad', num: '03', title: 'Doodle Pad', ko: '보드 위에 그려 보세요. 선이 말랑한 3D 국수가 되어 떨어집니다.' },
  { id: 'blob', num: '04', title: 'Squishy', ko: '콕 찔러 보세요. 아주, 아주 말랑합니다.' },
  { id: 'fin', num: '05', title: 'Tidy Up', ko: '' }
];
const GO = [0.09, 0.2, 0.362, 0.67, 0.82, 0.99];
const BOINGS = ['BOING!', 'SQUISH!', 'BOP!', '말랑!', '뽀잉!', 'WOBBLE!', 'BLOOP!'];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const V3 = THREE.Vector3;

/* ------------------------------------------------------------------ glyphs */
const D2R = Math.PI / 180;
function arc(cx, cy, r, a0, a1, n = 7) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D2R; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return out;
}
const GLYPHS = {
  P: { w: 0.85, s: [[[0, 0], [0, 1.6]], [[0, 1.6], [0.45, 1.6], ...arc(0.45, 1.2, 0.4, 90, -90), [0, 0.8]]] },
  L: { w: 0.8, s: [[[0, 1.6], [0, 0], [0.8, 0]]] },
  A: { w: 0.95, s: [[[0, 0], [0.475, 1.6], [0.95, 0]], [[0.21, 0.62], [0.74, 0.62]]] },
  Y: { w: 0.95, s: [[[0, 1.6], [0.475, 0.8], [0.95, 1.6]], [[0.475, 0.8], [0.475, 0]]] },
  '/': { w: 0.75, s: [[[0, 0], [0.75, 1.6]]] },
  B: { w: 0.9, s: [[[0, 0], [0, 1.6]], [[0, 1.6], [0.42, 1.6], ...arc(0.42, 1.21, 0.39, 90, -90), [0, 0.82]], [[0, 0.82], [0.48, 0.82], ...arc(0.48, 0.41, 0.41, 90, -90), [0, 0]]] },
  U: { w: 0.9, s: [[[0, 1.6], [0, 0.45], ...arc(0.45, 0.45, 0.45, 180, 360), [0.9, 1.6]]] },
  I: { w: 0, s: [[[0, 0], [0, 1.6]]] },
  D: { w: 0.95, s: [[[0, 0], [0, 1.6]], [[0, 1.6], [0.15, 1.6], ...arc(0.15, 0.8, 0.8, 90, -90), [0, 0]]] }
};

/* ------------------------------------------------------------------ markup */
function cardMarkup(p, i) {
  const last = i === projects.length - 1;
  return `
    <article class="tb-card" data-card="${i}" style="--c:${CARD_TINT[i]};--k:${CAP_COL[i]}" aria-hidden="true" inert>
      <div class="tb-card-img"><img src="${ART[p.id] || 'art/orbit.jpg'}" alt="${esc(p.name)} 대표 이미지" decoding="async"><span class="tb-card-sticker">0${i + 1}</span></div>
      <p class="tb-card-cat">${esc(p.category)}</p>
      <h3 class="tb-card-name">${esc(p.name)}</h3>
      <p class="tb-card-desc">${esc(p.description)}</p>
      <ul class="tb-chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <div class="tb-card-actions">
        <a class="tb-btn tb-btn--ink" href="${esc(p.url)}" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a>
        <button type="button" class="tb-btn" data-next="${i}">${last ? '다음 장난감 →' : '캡슐 하나 더 ⟳'}</button>
      </div>
    </article>`;
}

function liveMarkup() {
  const nav = ['상자', '블록', '캡슐', '낙서', '말랑', '정리'].map((n, i) => `<li><button type="button" data-go="${i}" aria-label="${n}로 이동"><i></i><span>${n}</span></button></li>`).join('');
  const sw = PALETTE.map((c, i) => `<button type="button" class="tb-swatch${i === 0 ? ' is-on' : ''}" data-ink="${c}" style="--sw:${c}" aria-label="${c} 색으로 그리기"></button>`).join('');
  return `
  <div class="tb" data-no-kx data-st="intro">
    <canvas class="tb-gl" aria-label="잡고 던질 수 있는 3D 장난감 놀이터"></canvas>
    <div class="tb-hud">
      <section class="tb-intro">
        <p class="tb-eyebrow"><span>WORLD 08</span><i></i><span>THE TOY BOX</span></p>
        <h1 class="tb-sr">Play / Build</h1>
        <p class="tb-intro-sub">만지고, 던지고, 쌓으면서 만듭니다.<br>상자 안에 무언가 들어 있어요.</p>
        <button type="button" class="tb-open" data-open>상자 열기 <span aria-hidden="true">↓</span></button>
      </section>
      <p class="tb-tip" aria-hidden="true"><b>✋</b> 글자를 잡아서 던져 보세요</p>
      <aside class="tb-station" aria-live="polite"><b class="tb-st-num">00</b><div><h2 class="tb-st-title">The Toy Box</h2><p class="tb-st-ko"></p></div></aside>
      <div class="tb-tools tb-tools--blocks"><button type="button" class="tb-btn" data-rebuild>다시 쌓기 ↺</button></div>
      <div class="tb-tools tb-tools--pad">${sw}<button type="button" class="tb-btn" data-clear>지우기</button></div>
      <div class="tb-padzone" aria-label="드래그해서 그리기"></div>
      ${projects.map(cardMarkup).join('')}
      <section class="tb-finale" aria-hidden="true" inert>
        <p class="tb-eyebrow"><span>ALL TIDIED UP</span><i></i><span>08 / 10</span></p>
        <h2 class="tb-fin-title">Play is a <em>build</em> tool.</h2>
        <p class="tb-fin-sub">놀이처럼 만들고, 만든 것으로 다시 놉니다.<br>장난감 상자 속 모든 코드는 GitHub에 열려 있어요.</p>
        <div class="tb-fin-actions"><a class="tb-btn tb-btn--ink tb-btn--big" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 보기 <span aria-hidden="true">↗</span></a><button type="button" class="tb-btn tb-btn--big" data-go="0">다시 열기 ↑</button></div>
      </section>
      <nav class="tb-nav" aria-label="장난감 정거장"><ol>${nav}</ol><i class="tb-nav-bar"><b></b></i></nav>
      <div class="tb-boings" aria-hidden="true"></div>
      <p class="tb-loading" aria-live="polite">장난감을 꺼내는 중…</p>
    </div>
    <div class="tb-track" style="height:${TRACK_VH}vh"></div>
  </div>`;
}

function staticMarkup() {
  let ci = 0;
  const word = ['PLAY/', 'BUILD'].map(w => `<b>${[...w].map(c => `<span style="--c:${PALETTE[ci++ % PALETTE.length]}">${c}</span>`).join('')}</b>`).join('');
  return `
  <div class="tb tb--static" data-no-kx>
    <div class="tbs-grid">
      <header class="tbs-tile tbs-hero">
        <p class="tb-eyebrow"><span>WORLD 08</span><i></i><span>THE TOY BOX</span></p>
        <h1 class="tbs-word" aria-label="Play / Build">${word}</h1>
        <p class="tb-intro-sub">만지고, 던지고, 쌓으면서 만듭니다.</p>
      </header>
      <section class="tbs-tile tbs-stack"><p class="tb-eyebrow"><span>01</span><i></i><span>BUILDING BLOCKS</span></p>
        <ul class="tbs-blocks">${STACK.map((s, i) => `<li style="--c:${PALETTE[i % PALETTE.length]}">${esc(s)}</li>`).join('')}</ul></section>
      ${projects.map((p, i) => `
      <article class="tbs-tile tbs-proj" style="--c:${CARD_TINT[i]};--k:${CAP_COL[i]}">
        <img src="${ART[p.id] || 'art/orbit.jpg'}" alt="${esc(p.name)} 대표 이미지" loading="lazy" decoding="async">
        <p class="tb-card-cat">0${i + 1} · ${esc(p.category)}</p>
        <h2 class="tb-card-name">${esc(p.name)}</h2>
        <p class="tb-card-desc">${esc(p.description)}</p>
        <p class="tbs-body">${esc(p.body)}</p>
        <ul class="tb-chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <a class="tb-btn tb-btn--ink" href="${esc(p.url)}" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a>
      </article>`).join('')}
      <footer class="tbs-tile tbs-fin">
        <h2 class="tb-fin-title">Play is a <em>build</em> tool.</h2>
        <a class="tb-btn tb-btn--ink tb-btn--big" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 보기 <span aria-hidden="true">↗</span></a>
      </footer>
    </div>
  </div>`;
}

/* --------------------------------------------------------------- helpers */
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function roundedBox(w, h, d, r, seg = 4) {
  const N = seg * 2 + 2;
  const g = new THREE.BoxGeometry(1, 1, 1, N, N, N);
  const H = [w / 2, h / 2, d / 2], inner = H.map(x => Math.max(0.0001, x - r)), a = 0.5 - seg / N;
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  const v = new V3(), c = new V3(), n = new V3(), o = [0, 0, 0], m = [0, 0, 0];
  const UVAX = [[2, 1], [0, 2], [0, 1]];
  const map = (u, k) => { const s = Math.sign(u), m = Math.abs(u); return s * (m <= a ? m / a * inner[k] : inner[k] + (m - a) / (0.5 - a) * r); };
  for (let i = 0; i < pos.count; i++) {
    o[0] = pos.getX(i); o[1] = pos.getY(i); o[2] = pos.getZ(i);
    for (let k = 0; k < 3; k++) m[k] = map(o[k], k);
    const fa = Math.abs(nor.getX(i)) > 0.5 ? 0 : Math.abs(nor.getY(i)) > 0.5 ? 1 : 2, [ua, va] = UVAX[fa];
    const ratio = k => Math.abs(o[k]) < 1e-6 ? 1 : (m[k] / (2 * H[k])) / o[k];
    uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * ratio(ua), 0.5 + (uv.getY(i) - 0.5) * ratio(va));
    v.set(m[0], m[1], m[2]);
    c.set(clamp(v.x, -inner[0], inner[0]), clamp(v.y, -inner[1], inner[1]), clamp(v.z, -inner[2], inner[2]));
    n.subVectors(v, c);
    if (n.lengthSq() < 1e-10) n.set(nor.getX(i), nor.getY(i), nor.getZ(i));
    n.normalize();
    v.copy(c).addScaledVector(n, r);
    pos.setXYZ(i, v.x, v.y, v.z); nor.setXYZ(i, n.x, n.y, n.z);
  }
  g.computeBoundingSphere();
  return g;
}

function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; }
    else { for (let i = 0; i < c; i++) idx[io + i] = vo + i; io += c; }
    vo += c; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

function floorTexture() {
  const s = 512, c = cnv(s, s), g = c.getContext('2d');
  g.fillStyle = '#fff2e6'; g.fillRect(0, 0, s, s);
  const h = s / 2;
  g.fillStyle = '#ffe4f1'; g.fillRect(0, 0, h, h); g.fillRect(h, h, h, h);
  g.fillStyle = '#fff4d4'; g.fillRect(h, 0, h, h); g.fillRect(0, h, h, h);
  g.fillStyle = 'rgba(214,150,190,.35)';
  for (let x = 16; x < s; x += 32) for (let y = 16; y < s; y += 32) { g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.strokeRect(0, 0, s, s); g.beginPath(); g.moveTo(h, 0); g.lineTo(h, s); g.moveTo(0, h); g.lineTo(s, h); g.stroke();
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function matTexture(color) {
  const s = 512, c = cnv(s, s), g = c.getContext('2d');
  g.fillStyle = color; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 7; g.setLineDash([22, 16]);
  g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 30, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function labelTexture(text, bg, w, h) {
  const W = 512, H = Math.max(64, Math.round(512 * h / w)), c = cnv(W, H), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(80,20,60,.08)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = COL.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = Math.round(H * 0.5);
  const font = () => { g.font = `800 ${fs}px Archivo, "Noto Sans KR", system-ui, sans-serif`; };
  font();
  while (g.measureText(text).width > W * 0.84 && fs > 20) { fs -= 2; font(); }
  g.fillText(text, W / 2, H * 0.54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function stickerTexture() {
  const s = 256, c = cnv(s, s), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
  g.fillStyle = COL.yellow; g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.fill();
  g.fillStyle = COL.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 44px Archivo, system-ui, sans-serif'; g.fillText('TOY', 128, 104); g.fillText('BOX', 128, 150);
  g.font = '500 16px "JetBrains Mono", monospace'; g.fillText('NO. 08', 128, 196);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function gachaLabelTexture() {
  const W = 512, H = 128, c = cnv(W, H), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 56); g.fill();
  g.fillStyle = COL.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 54px Archivo, system-ui, sans-serif'; g.fillText('GACHA ★ 3', W / 2, H / 2 + 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function beachTexture() {
  const W = 512, H = 256, c = cnv(W, H), g = c.getContext('2d');
  const cols = [COL.pink, '#ffffff', COL.yellow, '#ffffff', COL.blue, '#ffffff'];
  cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(i * W / 6, 0, W / 6 + 1, H); });
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, 18); g.fillRect(0, H - 18, W, 18);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function starShape(r1, r2, n = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? r2 : r1; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  return s;
}

/* ------------------------------------------------------------------- mount */
export function mount(root, { isPaused = () => false } = {}) {
  let disposed = false;
  const ac = new AbortController(), signal = ac.signal;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let teardown = () => {};
  const goStatic = () => { root.innerHTML = staticMarkup(); };

  if (reduce) { goStatic(); return () => { disposed = true; ac.abort(); root.innerHTML = ''; }; }

  root.innerHTML = liveMarkup();
  const el = root.querySelector('.tb');
  const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
  const canvas = $('.tb-gl');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch {
    renderer = null;
    goStatic();
    return () => { disposed = true; ac.abort(); root.innerHTML = ''; };
  }

  init().catch(err => {
    console.warn('[toybox] falling back to static toy shelf', err);
    if (!disposed) { try { teardown(); } catch { /* ignore */ } goStatic(); }
  });

  async function init() {
    const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    const timeout = ms => new Promise(r => setTimeout(r, ms));
    const fontP = Promise.race([Promise.all([document.fonts?.load?.('800 64px Archivo'), document.fonts?.load?.('900 44px Archivo')]), timeout(1500)]).catch(() => {});
    const libsP = Promise.all([import(LIBS.gsap), import(LIBS.st), import(LIBS.lenis)]).catch(() => null);
    const [libs] = await Promise.all([libsP, fontP]);
    if (disposed) return;

    /* ---------------- renderer / scene */
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const BG = new THREE.Color('#ffe3f0');
    const scene = new THREE.Scene();
    scene.background = BG.clone();
    scene.fog = new THREE.Fog(BG.clone(), 18, 70);
    const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 260);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmrem.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.4;
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const owned = { textures: [envTex], geos: [], mats: [] };
    const tex = t => { t.anisotropy = aniso; owned.textures.push(t); return t; };

    const MAT = new Map();
    const plastic = (color, o = {}) => { const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.34, metalness: 0, clearcoat: 0.75, clearcoatRoughness: 0.22, ...o }); owned.mats.push(m); return m; };
    const mat = color => { if (!MAT.has(color)) MAT.set(color, plastic(color)); return MAT.get(color); };
    const shade = m => { m.castShadow = true; m.receiveShadow = true; return m; };

    /* ---------------- lights */
    const hemi = new THREE.HemisphereLight('#fff6ee', '#ffb3d9', 0.9); scene.add(hemi);
    const key = new THREE.DirectionalLight('#fff0dc', 2.2);
    key.castShadow = true;
    key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 4;
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight('#c7d6ff', 0.7); fill.position.set(-10, 6, 6); scene.add(fill);

    /* ---------------- ground + station mats */
    const floorMap = tex(floorTexture()); floorMap.repeat.set(55, 15);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(220, 60), new THREE.MeshStandardMaterial({ map: floorMap, roughness: 0.85 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(27, 0, 0); floor.receiveShadow = true; scene.add(floor);
    [[X.box, 0.8, '#ffc6ea'], [X.blocks, 0, '#cdeffd'], [X.gacha, 1.2, '#fff0b0'], [X.pad, 0.6, '#d9fbe9'], [X.blob, 0.4, '#ead7ff']].forEach(([x, z, c]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ map: tex(matTexture(c)), transparent: true, alphaTest: 0.05, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); m.receiveShadow = true; scene.add(m);
    });

    /* ---------------- static colliders */
    const AABBS = [], SPHERES = [];
    const addAABB = (x0, y0, z0, x1, y1, z1, kind = '') => { const b = { min: new V3(x0, y0, z0), max: new V3(x1, y1, z1), kind, on: true }; AABBS.push(b); return b; };

    /* ---------------- the toy box */
    const box = { g: new THREE.Group(), lid: new THREE.Group(), open: 0, hop: 0, hopV: 0, rattle: 0, nextRattle: 2, closedFx: false };
    const BW = 4.4, BH = 2.3, BD = 4.0, T = 0.32;
    box.g.position.set(X.box, 0, BOX_Z); scene.add(box.g);
    const boxParts = [];
    const wall = (w, h, d, x, y, z, color) => {
      const m = shade(new THREE.Mesh(roundedBox(w, h, d, 0.12, 3), mat(color)));
      m.position.set(x, y, z); m.userData.kind = 'box'; box.g.add(m); boxParts.push(m);
      addAABB(X.box + x - w / 2, y - h / 2, BOX_Z + z - d / 2, X.box + x + w / 2, y + h / 2, BOX_Z + z + d / 2, 'box');
      return m;
    };
    wall(BW, T, BD, 0, T / 2, 0, COL.lilac);
    wall(BW, BH, T, 0, BH / 2, BD / 2 - T / 2, COL.pink);
    wall(BW, BH, T, 0, BH / 2, -BD / 2 + T / 2, COL.pink);
    wall(T, BH, BD - 2 * T + 0.04, -BW / 2 + T / 2, BH / 2, 0, COL.pink);
    wall(T, BH, BD - 2 * T + 0.04, BW / 2 - T / 2, BH / 2, 0, COL.pink);
    // yellow trim
    const trim = shade(new THREE.Mesh(roundedBox(BW + 0.12, 0.3, 0.14, 0.07, 2), mat(COL.yellow))); trim.position.set(0, 0.5, BD / 2 + 0.02); box.g.add(trim);
    const sticker = new THREE.Mesh(new THREE.CircleGeometry(0.72, 48), new THREE.MeshStandardMaterial({ map: tex(stickerTexture()), roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
    sticker.position.set(0, 1.35, BD / 2 + 0.005); sticker.rotation.z = 0.12; box.g.add(sticker);
    box.lid.position.set(0, BH, -BD / 2); box.g.add(box.lid);
    const lidMesh = shade(new THREE.Mesh(roundedBox(BW + 0.24, 0.36, BD + 0.24, 0.16, 3), mat(COL.yellow)));
    lidMesh.position.set(0, 0.18, BD / 2); lidMesh.userData.kind = 'box'; box.lid.add(lidMesh); boxParts.push(lidMesh);
    const knob = shade(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.11, 12, 28), mat(COL.pink)));
    knob.position.set(0, 0.42, BD / 2 + 0.6); knob.rotation.x = Math.PI / 2; box.lid.add(knob);
    const BOX_IN = new V3(X.box, 1.3, BOX_Z);

    /* ---------------- physics core */
    const bodies = [];
    class Body {
      constructor(o) {
        this.kind = o.kind; this.mesh = o.mesh; this.spheres = o.spheres;
        this.wp = this.spheres.map(() => new V3());
        this.R = Math.max(...this.spheres.map(s => s.p.length() + s.r));
        this.mass = o.mass ?? 1; this.invMass = 1 / this.mass;
        this.invI = 1 / (this.mass * Math.max(0.04, this.R * this.R * 0.3));
        this.pos = new V3(); this.q = new THREE.Quaternion(); this.vel = new V3(); this.w = new V3();
        this.e = o.e ?? 0.3; this.mu = o.mu ?? 0.55;
        this.active = false; this.kin = false;
        this.sq = 0; this.sqv = 0; this.scale = 1;
        this.grab = null; this.form = null; this.formDelay = 0; this.sweep = null; this.ghost = 0;
        this.mesh.userData.body = this;
        bodies.push(this);
      }
      sync() { for (let i = 0; i < this.spheres.length; i++) this.wp[i].copy(this.spheres[i].p).applyQuaternion(this.q).add(this.pos); }
    }
    const dyn = b => b && b.active && !b.kin;
    const _rA = new V3(), _rB = new V3(), _v = new V3(), _t = new V3(), _tmp = new V3(), _tmp2 = new V3(), _q = new THREE.Quaternion(), _n = new V3(), _pt = new V3();
    const pointVel = (b, r, out) => out.copy(b.w).cross(r).add(b.vel);
    const applyImp = (b, J, r) => { b.vel.addScaledVector(J, b.invMass); _tmp2.copy(r).cross(J); b.w.addScaledVector(_tmp2, b.invI); };
    const _J = new V3();
    let impactHook = null;

    function resolve(A, B, point, n, depth) {
      const imA = dyn(A) ? A.invMass : 0, imB = dyn(B) ? B.invMass : 0;
      const iA = imA ? A.invI : 0, iB = imB ? B.invI : 0;
      _rA.subVectors(point, A.pos); pointVel(A, _rA, _v);
      if (B) { _rB.subVectors(point, B.pos); pointVel(B, _rB, _t); _v.sub(_t); }
      const vn = _v.dot(n);
      if (vn < 0) {
        let kn = imA + _tmp.copy(_rA).cross(n).lengthSq() * iA;
        if (B) kn += imB + _tmp.copy(_rB).cross(n).lengthSq() * iB;
        if (kn > 0) {
          const e = vn < -1.4 ? Math.max(A.e, B ? B.e : 0.25) : 0;
          const j = -(1 + e) * vn / kn;
          _J.copy(n).multiplyScalar(j);
          if (imA) applyImp(A, _J, _rA);
          if (imB) { _J.negate(); applyImp(B, _J, _rB); }
          _t.copy(_v).addScaledVector(n, -vn);
          const tl = _t.length();
          if (tl > 1e-4) {
            _t.multiplyScalar(1 / tl);
            let kt = imA + _tmp.copy(_rA).cross(_t).lengthSq() * iA;
            if (B) kt += imB + _tmp.copy(_rB).cross(_t).lengthSq() * iB;
            const mu = Math.max(A.mu, B ? B.mu : 0.5);
            const jt = Math.min(tl / kt, mu * j);
            _J.copy(_t).multiplyScalar(-jt);
            if (imA) applyImp(A, _J, _rA);
            if (imB) { _J.negate(); applyImp(B, _J, _rB); }
          }
          if (vn < -2.5) {
            const k = Math.min(7, -vn * 0.55);
            if (imA) A.sqv += k; if (imB) B.sqv += k;
            impactHook?.(A, B, point, -vn);
          }
        }
      }
      const tot = imA + imB;
      if (tot > 0 && depth > 0.003) {
        const c = (depth - 0.003) * 0.75 / tot;
        if (imA) A.pos.addScaledVector(n, c * imA);
        if (imB) B.pos.addScaledVector(n, -c * imB);
      }
    }

    const PLANES = [
      { n: new V3(0, 1, 0), d: 0 }, { n: new V3(1, 0, 0), d: BOUNDS.x0 }, { n: new V3(-1, 0, 0), d: -BOUNDS.x1 },
      { n: new V3(0, 0, 1), d: BOUNDS.z0 }, { n: new V3(0, 0, -1), d: -BOUNDS.z1 }
    ];
    const _acc = new V3(), _nAcc = new V3(), _cp = new V3(), _d = new V3();
    function collideStatic(b) {
      for (const pl of PLANES) {
        let cnt = 0, maxD = 0; _acc.set(0, 0, 0);
        for (let i = 0; i < b.wp.length; i++) {
          const w = b.wp[i], dist = w.dot(pl.n) - pl.d, pen = b.spheres[i].r - dist;
          if (pen > 0) { cnt++; maxD = Math.max(maxD, pen); _acc.addScaledVector(w, 1).addScaledVector(pl.n, -dist); }
        }
        if (cnt) {
          _pt.copy(_acc).multiplyScalar(1 / cnt);
          resolve(b, null, _pt, pl.n, maxD);
          if (pl.d === 0 && pl.n.y === 1) b.w.multiplyScalar(0.992);
          b.sync();
        }
      }
      for (const box of AABBS) {
        if (!box.on || (b.ghost > 0 && box.kind === 'box')) continue;
        if (b.pos.x + b.R < box.min.x || b.pos.x - b.R > box.max.x || b.pos.y - b.R > box.max.y || b.pos.z + b.R < box.min.z || b.pos.z - b.R > box.max.z) continue;
        let cnt = 0, maxD = 0; _acc.set(0, 0, 0); _nAcc.set(0, 0, 0);
        for (let i = 0; i < b.wp.length; i++) {
          const w = b.wp[i], r = b.spheres[i].r;
          _cp.set(clamp(w.x, box.min.x, box.max.x), clamp(w.y, box.min.y, box.max.y), clamp(w.z, box.min.z, box.max.z));
          _d.subVectors(w, _cp);
          let dist = _d.length();
          if (dist >= r) continue;
          if (dist < 1e-6) { // centre inside: push along the shallowest axis
            const dx0 = w.x - box.min.x, dx1 = box.max.x - w.x, dy1 = box.max.y - w.y, dz0 = w.z - box.min.z, dz1 = box.max.z - w.z;
            const m = Math.min(dx0, dx1, dy1, dz0, dz1);
            _d.set(m === dx0 ? -1 : m === dx1 ? 1 : 0, m === dy1 ? 1 : 0, m === dz0 ? -1 : m === dz1 ? 1 : 0);
            dist = -m;
          } else _d.multiplyScalar(1 / dist);
          const pen = r - dist; cnt++; maxD = Math.max(maxD, pen);
          _acc.add(_cp); _nAcc.addScaledVector(_d, pen);
        }
        if (cnt && _nAcc.lengthSq() > 1e-12) {
          _pt.copy(_acc).multiplyScalar(1 / cnt); _n.copy(_nAcc).normalize();
          resolve(b, null, _pt, _n, Math.min(maxD, 0.5)); b.sync();
        }
      }
      for (const s of SPHERES) {
        if (b.pos.distanceTo(s.c) > b.R + s.r) continue;
        let cnt = 0, maxD = 0; _acc.set(0, 0, 0); _nAcc.set(0, 0, 0);
        for (let i = 0; i < b.wp.length; i++) {
          _d.subVectors(b.wp[i], s.c); const dist = _d.length(), pen = b.spheres[i].r + s.r - dist;
          if (pen <= 0 || dist < 1e-6) continue;
          _d.multiplyScalar(1 / dist); cnt++; maxD = Math.max(maxD, pen);
          _nAcc.addScaledVector(_d, pen);
        }
        if (cnt) {
          _n.copy(_nAcc).normalize(); _pt.copy(s.c).addScaledVector(_n, s.r);
          if (s.onHit) { _rA.subVectors(_pt, b.pos); const sp = -pointVel(b, _rA, _v).dot(_n); if (sp > 1.5) s.onHit(_pt, sp, _n); }
          resolve(b, null, _pt, _n, maxD); b.sync();
        }
      }
    }

    function collidePair(A, B) {
      if (A.pos.distanceTo(B.pos) > A.R + B.R) return;
      let cnt = 0, maxD = 0; _acc.set(0, 0, 0); _nAcc.set(0, 0, 0);
      for (let i = 0; i < A.wp.length; i++) {
        const a = A.wp[i], ra = A.spheres[i].r;
        if (a.distanceTo(B.pos) > ra + B.R) continue;
        for (let k = 0; k < B.wp.length; k++) {
          const rr = ra + B.spheres[k].r;
          _d.subVectors(a, B.wp[k]); const d2 = _d.lengthSq();
          if (d2 >= rr * rr || d2 < 1e-10) continue;
          const dist = Math.sqrt(d2), pen = rr - dist;
          _d.multiplyScalar(1 / dist); cnt++; maxD = Math.max(maxD, pen);
          _acc.add(B.wp[k]).addScaledVector(_d, B.spheres[k].r);
          _nAcc.addScaledVector(_d, pen);
        }
      }
      if (!cnt || _nAcc.lengthSq() < 1e-12) return;
      _pt.copy(_acc).multiplyScalar(1 / cnt); _n.copy(_nAcc).normalize();
      resolve(A, B, _pt, _n, Math.min(maxD, 0.4));
      A.sync(); B.sync();
    }

    function applyGrab(b, h) {
      const g = b.grab;
      _rA.copy(g.local).applyQuaternion(b.q);
      _tmp.copy(_rA).add(b.pos);
      _v.subVectors(g.target, _tmp).multiplyScalar(16);
      if (_v.length() > 30) _v.setLength(30);
      pointVel(b, _rA, _t); _v.sub(_t);
      const k = b.invMass + b.invI * _rA.lengthSq();
      _v.multiplyScalar(0.3 / k);
      applyImp(b, _v, _rA);
      b.vel.y += G * h;
      b.w.multiplyScalar(0.97);
    }

    function applyForm(b, h) {
      const f = b.form, K = 26, C = 6.5, KR = 70, CR = 10;
      b.vel.x += ((f.x - b.pos.x) * K - b.vel.x * C) * h;
      b.vel.z += ((f.z - b.pos.z) * K - b.vel.z * C) * h;
      _q.copy(b.q).invert().premultiply(f.q);
      if (_q.w < 0) { _q.x = -_q.x; _q.y = -_q.y; _q.z = -_q.z; _q.w = -_q.w; }
      const s = Math.sqrt(Math.max(0, 1 - _q.w * _q.w)), ang = 2 * Math.acos(Math.min(1, _q.w));
      if (s > 1e-4) _tmp.set(_q.x / s, _q.y / s, _q.z / s).multiplyScalar(ang); else _tmp.set(0, 0, 0);
      if (ang > 0.3 && b.pos.y < 2.2) b.vel.y += G * h * Math.min(1.15, ang * 1.2);
      b.w.x += (_tmp.x * KR - b.w.x * CR) * h;
      b.w.y += (_tmp.y * KR - b.w.y * CR) * h;
      b.w.z += (_tmp.z * KR - b.w.z * CR) * h;
    }

    function integrate(b, h) {
      if (!dyn(b)) return;
      if (b.grab) applyGrab(b, h);
      else if (b.form && b.formDelay <= 0) applyForm(b, h);
      b.vel.y -= G * h;
      b.vel.multiplyScalar(Math.exp(-0.08 * h));
      b.w.multiplyScalar(Math.exp(-0.9 * h));
      if (b.vel.lengthSq() > 900) b.vel.setLength(30);
      if (b.w.lengthSq() > 400) b.w.setLength(20);
      b.pos.addScaledVector(b.vel, h);
      const q = b.q, wx = b.w.x, wy = b.w.y, wz = b.w.z, qx = q.x, qy = q.y, qz = q.z, qw = q.w, k = 0.5 * h;
      q.set(qx + k * (wx * qw + wy * qz - wz * qy), qy + k * (wy * qw + wz * qx - wx * qz), qz + k * (wz * qw + wx * qy - wy * qx), qw + k * (-wx * qx - wy * qy - wz * qz)).normalize();
    }

    /* ---------------- confetti */
    const CONF_N = coarse ? 280 : 520;
    const confMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.55 }); owned.mats.push(confMat);
    const conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.11, 0.19), confMat, CONF_N);
    conf.frustumCulled = false; scene.add(conf);
    const cf = Array.from({ length: CONF_N }, () => ({ p: new V3(), v: new V3(), r: new THREE.Euler(), s: new V3(), life: 0, max: 1, seed: Math.random() * 10 }));
    const _col = new THREE.Color(), dummy = new THREE.Object3D();
    for (let i = 0; i < CONF_N; i++) { dummy.scale.setScalar(0); dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix); conf.setColorAt(i, _col.set('#fff')); }
    let confHead = 0;
    function confetti(at, n = 60, power = 6, up = 6) {
      for (let k = 0; k < n; k++) {
        const c = cf[confHead]; confHead = (confHead + 1) % CONF_N;
        c.p.copy(at).add(_tmp.set(rand(-0.3, 0.3), rand(-0.1, 0.3), rand(-0.3, 0.3)));
        const a = Math.random() * Math.PI * 2, s = rand(0.3, 1) * power;
        c.v.set(Math.cos(a) * s, rand(0.6, 1.2) * up, Math.sin(a) * s);
        c.r.set(rand(0, 6), rand(0, 6), rand(0, 6)); c.s.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
        c.life = c.max = rand(2.2, 3.6);
        conf.setColorAt(confHead === 0 ? CONF_N - 1 : confHead - 1, _col.set(PALETTE[(Math.random() * PALETTE.length) | 0]));
      }
      conf.instanceColor.needsUpdate = true;
    }
    function updateConfetti(dt, t) {
      for (let i = 0; i < CONF_N; i++) {
        const c = cf[i];
        if (c.life <= 0) continue;
        c.life -= dt;
        if (c.p.y > 0.03) {
          c.v.y -= 9 * dt; c.v.multiplyScalar(Math.exp(-1.7 * dt));
          c.v.x += Math.sin(t * 6 + c.seed) * 3 * dt; c.v.z += Math.cos(t * 5 + c.seed) * 3 * dt;
          c.p.addScaledVector(c.v, dt);
          c.r.x += c.s.x * dt; c.r.y += c.s.y * dt; c.r.z += c.s.z * dt;
        } else { c.p.y = 0.03; c.r.set(-Math.PI / 2, 0, c.r.z); }
        dummy.position.copy(c.p); dummy.rotation.copy(c.r);
        dummy.scale.setScalar(c.life <= 0 ? 0 : Math.min(1, c.life / 0.6));
        dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix);
      }
      conf.instanceMatrix.needsUpdate = true;
    }

    /* ---------------- letters */
    const letters = WORD.map((ch, i) => {
      const gl = GLYPHS[ch], geos = [], pts = [];
      for (const s of gl.s) for (let k = 0; k < s.length - 1; k++) {
        const a = new V3(s[k][0], s[k][1], 0), b = new V3(s[k + 1][0], s[k + 1][1], 0), len = a.distanceTo(b);
        if (len < 1e-3) continue;
        const cg = new THREE.CapsuleGeometry(LR, len, 5, 14);
        cg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize()));
        const mid = a.clone().add(b).multiplyScalar(0.5); cg.translate(mid.x, mid.y, mid.z);
        geos.push(cg);
        const n = Math.max(1, Math.round(len / LR));
        for (let j = 0; j <= n; j++) pts.push(a.clone().lerp(b, j / n));
      }
      const sp = [];
      for (const p of pts) if (!sp.some(q => q.distanceTo(p) < LR * 0.7)) sp.push(p);
      const com = sp.reduce((acc, p) => acc.add(p), new V3()).multiplyScalar(1 / sp.length);
      const geo = mergeGeos(geos); geo.translate(-com.x, -com.y, -com.z);
      const color = PALETTE[i % PALETTE.length];
      const mesh = shade(new THREE.Mesh(geo, mat(color)));
      mesh.visible = false; mesh.userData.kind = 'letter'; scene.add(mesh);
      const body = new Body({ kind: 'letter', mesh, spheres: sp.map(p => ({ p: p.clone().sub(com), r: LR })), mass: 1, e: 0.32, mu: 0.6 });
      body.ch = ch; body.com = com; body.gw = gl.w; body.idx = i;
      body.form = { x: 0, z: 0, q: new THREE.Quaternion() };
      return body;
    });
    let lettersOut = false, layoutRowW = 10;
    function layoutLetters(portrait) {
      const gap = 0.34, adv = b => b.gw + LR * 2 + gap;
      const rows = portrait ? [letters.slice(0, 5), letters.slice(5)] : [letters];
      layoutRowW = 0;
      rows.forEach((row, ri) => {
        const total = row.reduce((s, b) => s + adv(b), 0) - gap;
        layoutRowW = Math.max(layoutRowW, total);
        let x = -total / 2 + LR;
        const z = portrait ? (ri === 0 ? 0.9 : 3.5) : 2.1;
        for (const b of row) { b.form.x = X.box + x + b.com.x; b.form.z = z; x += adv(b); }
      });
    }
    function spawnLetters() {
      lettersOut = true;
      letters.forEach((b, i) => {
        b.active = true; b.kin = false; b.mesh.visible = true;
        b.pos.set(X.box + rand(-1.1, 1.1), rand(0.9, 1.6), BOX_Z + rand(-0.9, 0.9));
        b.q.setFromEuler(new THREE.Euler(rand(-0.6, 0.6), rand(-0.6, 0.6), rand(-0.6, 0.6)));
        const vy = rand(11, 14), tf = 2 * vy / G;
        b.vel.set((b.form.x - b.pos.x) / tf + rand(-0.8, 0.8), vy, (b.form.z - b.pos.z) / tf + rand(-0.4, 0.6));
        b.w.set(rand(-7, 7), rand(-7, 7), rand(-7, 7));
        b.formDelay = 0.9 + i * 0.07; b.hopped = false; b.ghost = 0.45;
        b.sync();
      });
      confetti(new V3(X.box, 2.2, BOX_Z), coarse ? 90 : 150, 7, 9);
      shake(0.35);
      boingAt(new V3(X.box, 3.2, BOX_Z), 'POP!');
    }

    /* ---------------- building blocks */
    const towerQ = [];
    const blocks = STACK.map((name, i) => {
      const w = clamp(1.3 + name.length * 0.1, 1.55, 2.6), h = 0.62, d = 1.0;
      const color = PALETTE[i % PALETTE.length];
      const label = plastic('#ffffff', { map: tex(labelTexture(name, color, w, h)) });
      const side = mat(color);
      const mesh = shade(new THREE.Mesh(roundedBox(w, h, d, 0.1, 3), [side, side, side, side, label, label]));
      const studs = [], nx = Math.max(2, Math.floor((w - 0.3) / 0.45));
      for (let k = 0; k < nx; k++) for (const z of [-0.24, 0.24]) {
        const c = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 18); c.translate(-w / 2 + 0.3 + k * ((w - 0.6) / Math.max(1, nx - 1)), h / 2 + 0.05, z); studs.push(c);
      }
      const studMesh = shade(new THREE.Mesh(mergeGeos(studs), side)); mesh.add(studMesh);
      mesh.visible = false; mesh.userData.kind = 'block'; scene.add(mesh);
      const sp = [], r = 0.15, n = Math.max(2, Math.ceil((w - 2 * r) / 0.3));
      for (let k = 0; k <= n; k++) for (const y of [-(h / 2 - r), h / 2 - r]) for (const z of [-(d / 2 - r), 0, d / 2 - r]) sp.push({ p: new V3(-(w / 2 - r) + k * (w - 2 * r) / n, y, z), r });
      const body = new Body({ kind: 'block', mesh, spheres: sp, mass: 1.2, e: 0.2, mu: 0.6 });
      body.target = new V3(X.blocks + rand(-0.12, 0.12), h / 2 + i * h, rand(-0.08, 0.08));
      body.tq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand(-0.14, 0.14), 0));
      body.script = null; body.idx = i; body.h = h;
      towerQ.push(body.tq);
      return body;
    });
    const tower = { state: 'hidden', t: 0, idle: 0 };
    function buildTower(fromCurrent) {
      tower.state = 'building'; tower.t = 0;
      blocks.forEach((b, i) => {
        b.grab = null; b.active = true; b.kin = true; b.vel.set(0, 0, 0); b.w.set(0, 0, 0);
        if (fromCurrent && b.mesh.visible) b.script = { mode: 'lift', t: -i * 0.07, from: b.pos.clone(), q0: b.q.clone() };
        else { b.mesh.visible = false; b.script = { mode: 'drop', t: -i * 0.17, y: b.target.y + 7 + i * 0.25, vy: 0 }; b.pos.set(b.target.x, b.script.y, b.target.z); b.q.copy(b.tq); b.sync(); }
      });
    }
    function knockTower(hitBody, point, dir) {
      if (tower.state !== 'tower') return;
      tower.state = 'fallen'; tower.idle = 0;
      blocks.forEach(b => { b.script = null; b.kin = false; b.vel.set(rand(-0.4, 0.4), rand(0, 0.5), rand(-0.4, 0.4)); b.w.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)); });
      if (hitBody) {
        _J.copy(dir).setY(Math.max(0.15, dir.y)).normalize().multiplyScalar(9);
        _rA.subVectors(point, hitBody.pos); applyImp(hitBody, _J, _rA);
      }
      confetti(point, 50, 5, 5); shake(0.3);
      boingAt(point, 'CRASH!');
    }
    function updateBlocks(dt) {
      if (tower.state === 'fallen') { tower.idle += dt; if (tower.idle > 10 && !blocks.some(b => b.grab)) buildTower(true); }
      if (tower.state !== 'building') return;
      let done = true;
      for (const b of blocks) {
        const s = b.script; if (!s) continue;
        s.t += dt;
        if (s.t < 0) { done = false; continue; }
        if (s.mode === 'lift') {
          done = false;
          const e = smooth(0, 1, s.t / 0.5);
          _tmp.set(b.target.x, b.target.y + 4.5 + b.idx * 0.2, b.target.z);
          b.pos.lerpVectors(s.from, _tmp, e); b.pos.y += Math.sin(e * Math.PI) * 2.5;
          b.q.slerpQuaternions(s.q0, b.tq, e);
          if (s.t >= 0.5) b.script = { mode: 'drop', t: 0, y: b.pos.y, vy: 0 };
        } else if (s.mode === 'drop') {
          b.mesh.visible = true;
          s.vy -= 34 * dt; s.y += s.vy * dt;
          if (s.y <= b.target.y) {
            s.y = b.target.y;
            if (s.vy < -1.5) { b.sqv += Math.min(9, -s.vy * 0.5); s.vy = -s.vy * 0.3; }
            else { s.vy = 0; b.script = null; }
          }
          if (b.script) done = false;
          b.pos.set(b.target.x, s.y, b.target.z); b.q.copy(b.tq);
        }
        b.sync();
      }
      if (done) {
        tower.state = 'tower';
        confetti(new V3(X.blocks, blocks.length * 0.62 + 0.4, 0), 40, 4, 6);
      }
    }

    /* ---------------- beach balls (free toys) */
    const beachMap = tex(beachTexture());
    const ballMat = plastic('#ffffff', { map: beachMap });
    const balls = [[9, 4.6], [20, 3.6], [34.5, 3.4], [49, 3.6]].map(([x, z]) => {
      const mesh = shade(new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 20), ballMat));
      mesh.userData.kind = 'ball'; scene.add(mesh);
      const b = new Body({ kind: 'ball', mesh, spheres: [{ p: new V3(), r: 0.5 }], mass: 0.45, e: 0.62, mu: 0.4 });
      b.active = true; b.pos.set(x, 0.5, z); b.q.setFromEuler(new THREE.Euler(rand(0, 3), rand(0, 3), 0)); b.sync();
      return b;
    });

    /* ---------------- gachapon */
    const gacha = { g: new THREE.Group(), crank: new THREE.Group(), angle: 0, prevAngle: 0, spin: 0, inner: [], slots: projects.map(() => ({ disp: false, crack: false, cap: null, halves: [] })) };
    gacha.g.position.set(X.gacha, 0, 0); scene.add(gacha.g);
    const cab = shade(new THREE.Mesh(roundedBox(2.8, 2.7, 2.4, 0.3, 4), mat(COL.yellow))); cab.position.y = 1.35; gacha.g.add(cab);
    const collar = shade(new THREE.Mesh(roundedBox(2.95, 0.42, 2.55, 0.2, 3), mat(COL.pink))); collar.position.y = 2.72; gacha.g.add(collar);
    const footG = new THREE.CylinderGeometry(0.22, 0.26, 0.2, 20);
    for (const [fx, fz] of [[-1.1, -0.9], [1.1, -0.9], [-1.1, 0.9], [1.1, 0.9]]) { const f = shade(new THREE.Mesh(footG, mat(COL.pink))); f.position.set(fx, 0.06, fz); gacha.g.add(f); }
    const glass = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, envMapIntensity: 1.6 });
    owned.mats.push(glass);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 32), glass); dome.position.y = 4.15; dome.renderOrder = 3; gacha.g.add(dome);
    const ring = shade(new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.14, 14, 48), mat(COL.pink))); ring.rotation.x = Math.PI / 2; ring.position.y = 3.0; gacha.g.add(ring);
    const cap = shade(new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(COL.pink))); cap.position.y = 5.42; gacha.g.add(cap);
    const capBall = shade(new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), mat(COL.yellow))); capBall.position.y = 6.12; gacha.g.add(capBall);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshStandardMaterial({ map: tex(gachaLabelTexture()), transparent: true, roughness: 0.5 }));
    label.position.set(0, 2.25, 1.215); gacha.g.add(label);
    gacha.crank.position.set(0, 1.5, 1.25); gacha.g.add(gacha.crank);
    const disc = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 36), mat('#ffffff'))); disc.rotation.x = Math.PI / 2; gacha.crank.add(disc);
    const bar = shade(new THREE.Mesh(roundedBox(0.95, 0.24, 0.2, 0.1, 2), mat(COL.pink))); bar.position.set(0, 0, 0.17); gacha.crank.add(bar);
    const handle = shade(new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), mat(COL.blue))); handle.position.set(0.42, 0, 0.36); gacha.crank.add(handle);
    gacha.crank.traverse(o => { if (o.isMesh) o.userData.kind = 'crank'; });
    const chute = new THREE.Mesh(roundedBox(0.95, 0.7, 0.2, 0.12, 2), mat('#4a2a5e')); chute.position.set(0, 0.62, 1.16); gacha.g.add(chute);
    const flap = new THREE.Group(); flap.position.set(0, 0.95, 1.3); gacha.g.add(flap);
    const flapM = shade(new THREE.Mesh(roundedBox(0.9, 0.6, 0.08, 0.04, 2), mat(COL.mint))); flapM.position.y = -0.3; flap.add(flapM);
    addAABB(X.gacha - 1.4, 0, -1.2, X.gacha + 1.4, 2.95, 1.2, 'gacha');
    SPHERES.push({ c: new V3(X.gacha, 4.15, 0), r: 1.5 });
    const hemiTop = new THREE.SphereGeometry(0.42, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const hemiBot = new THREE.SphereGeometry(0.42, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const capWhite = plastic('#fff8fc', { side: THREE.DoubleSide });
    const capColMat = CAP_COL.map(c => plastic(c, { side: THREE.DoubleSide }));
    const smallTop = new THREE.SphereGeometry(0.3, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), smallBot = new THREE.SphereGeometry(0.3, 18, 9, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    for (let k = 0; k < 15; k++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(smallTop, k % 4 === 3 ? mat(COL.blue) : capColMat[k % 3]), new THREE.Mesh(smallBot, capWhite));
      const a = rand(0, Math.PI * 2), r = rand(0.2, 0.95);
      const base = new V3(Math.cos(a) * r, rand(-1.05, 0.15), Math.sin(a) * r);
      g.position.copy(base).add(new V3(0, 4.15, 0)); g.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
      g.userData = { base, rot: g.rotation.clone(), ph: rand(0, 6) };
      gacha.g.add(g); gacha.inner.push(g);
    }
    function dispense(k) {
      const s = gacha.slots[k]; s.disp = true;
      const g = new THREE.Group();
      g.add(shade(new THREE.Mesh(hemiTop, capColMat[k])), shade(new THREE.Mesh(hemiBot, capWhite)));
      g.userData.kind = 'capsule'; g.children.forEach(c => { c.userData.owner = g; });
      scene.add(g);
      const b = new Body({ kind: 'capsule', mesh: g, spheres: [{ p: new V3(), r: 0.42 }], mass: 0.6, e: 0.5, mu: 0.4 });
      b.active = true; b.pos.set(X.gacha + rand(-0.15, 0.15), 0.7, 1.75); b.vel.set(rand(-0.8, 0.8), 2.5, 2.4); b.w.set(rand(-4, 4), 0, rand(-3, 3)); b.sync();
      s.cap = b; flapKick = 1;
      gacha.spin += 4;
    }
    function removeBody(b) {
      const i = bodies.indexOf(b); if (i >= 0) bodies.splice(i, 1);
      scene.remove(b.mesh);
      if (grab.body === b) endGrab();
    }
    function crack(k) {
      const s = gacha.slots[k]; if (!s.cap) return; s.crack = true;
      const c = s.cap, at = c.pos.clone();
      removeBody(c); s.cap = null;
      const make = (geo, m, up) => {
        const g = new THREE.Group(); const hm = shade(new THREE.Mesh(geo, m)); hm.position.y = up ? -0.16 : 0.16; g.add(hm);
        g.userData.kind = 'capsule'; hm.userData.owner = g; scene.add(g);
        const b = new Body({ kind: 'capsule', mesh: g, spheres: [{ p: new V3(0, up ? -0.02 : 0.02, 0), r: 0.3 }], mass: 0.3, e: 0.45, mu: 0.5 });
        b.active = true; b.pos.copy(at).add(new V3(0, up ? 0.16 : -0.16, 0).applyQuaternion(c.q)); b.q.copy(c.q);
        b.vel.copy(c.vel).add(new V3(rand(-1.5, 1.5), up ? 8 : 2.5, up ? rand(0.5, 2) : rand(-0.5, 0.5))); b.w.set(rand(-9, 9), rand(-4, 4), rand(-9, 9)); b.sync();
        return b;
      };
      s.halves = [make(hemiTop, capColMat[k], true), make(hemiBot, capWhite, false)];
      confetti(at.add(new V3(0, 0.3, 0)), coarse ? 70 : 110, 6, 8);
      shake(0.25);
      boingAt(at, ['TA-DA!', 'NICE!', 'YAY!'][k]);
    }
    function undoSlot(k) {
      const s = gacha.slots[k];
      if (s.cap) removeBody(s.cap);
      s.halves.forEach(removeBody);
      s.cap = null; s.halves = []; s.disp = false; s.crack = false;
    }
    let flapKick = 0, flapV = 0, flapA = 0;

    /* ---------------- doodle pad + noodles */
    const padG = new THREE.Group(); padG.position.set(PAD.x, PAD.y, PAD.z); scene.add(padG);
    const padFrame = shade(new THREE.Mesh(roundedBox(PAD.w + 0.7, PAD.h + 0.7, 0.5, 0.22, 4), mat(COL.orange))); padG.add(padFrame);
    const screenMat = new THREE.MeshStandardMaterial({ color: '#f4f0ff', roughness: 0.9 }); owned.mats.push(screenMat);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(PAD.w, PAD.h), screenMat); screen.position.z = 0.256; screen.receiveShadow = true; padG.add(screen);
    for (const sx of [-1, 1]) {
      const knobM = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 28), mat('#ffffff'))); knobM.rotation.x = Math.PI / 2; knobM.position.set(sx * (PAD.w / 2 - 0.25), -PAD.h / 2 - 0.05, 0.32); padG.add(knobM);
      const leg = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, PAD.y - PAD.h / 2, 16), mat(COL.lilac))); leg.position.set(sx * (PAD.w / 2 - 0.6), -(PAD.h / 2) - (PAD.y - PAD.h / 2) / 2, -0.05); padG.add(leg);
      const foot = shade(new THREE.Mesh(roundedBox(0.5, 0.18, 1.6, 0.08, 2), mat(COL.lilac))); foot.position.set(sx * (PAD.w / 2 - 0.6), -PAD.y + 0.09, 0); padG.add(foot);
    }
    addAABB(PAD.x - PAD.w / 2 - 0.4, 0.35, PAD.z - 0.26, PAD.x + PAD.w / 2 + 0.4, PAD.y + PAD.h / 2 + 0.35, PAD.z + 0.26, 'pad');
    const NR = 0.13, RS = 9, MAXP = 72, SPACING = 0.15;
    const noodles = [];
    let inkColor = PALETTE[0];
    function makeNoodle(color) {
      const vc = MAXP * RS + 2;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vc * 3), 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(vc * 3), 3).setUsage(THREE.DynamicDrawUsage));
      geo.setIndex(new THREE.BufferAttribute(new Uint16Array(RS * 6 + (MAXP - 1) * RS * 6), 1));
      const m = new THREE.Mesh(geo, plastic(color, { side: THREE.DoubleSide }));
      m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
      const nd = { mesh: m, geo, n: 0, p: new Float32Array(MAXP * 3), pp: new Float32Array(MAXP * 3), rest: [], rest2: [], free: false, sweep: null, builtN: -1 };
      noodles.push(nd);
      return nd;
    }
    function noodleIndex(nd) {
      const n = nd.n, idx = nd.geo.index.array; let o = 0;
      const tip0 = MAXP * RS, tip1 = MAXP * RS + 1;
      for (let k = 0; k < RS; k++) { idx[o++] = tip0; idx[o++] = (k + 1) % RS; idx[o++] = k; }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < RS; k++) {
        const a = i * RS + k, b = i * RS + (k + 1) % RS, c = a + RS, d = b + RS;
        idx[o++] = a; idx[o++] = b; idx[o++] = c; idx[o++] = b; idx[o++] = d; idx[o++] = c;
      }
      const L = (n - 1) * RS;
      for (let k = 0; k < RS; k++) { idx[o++] = tip1; idx[o++] = L + k; idx[o++] = L + (k + 1) % RS; }
      nd.geo.index.needsUpdate = true; nd.geo.setDrawRange(0, o); nd.builtN = n;
    }
    const _T = new V3(), _N = new V3(), _B = new V3(), _P = new V3(), _dir = new V3();
    function updateTube(nd) {
      const n = nd.n; if (n < 2) { nd.mesh.visible = false; return; }
      nd.mesh.visible = true;
      if (nd.builtN !== n) noodleIndex(nd);
      const P = nd.p, pos = nd.geo.attributes.position.array, nor = nd.geo.attributes.normal.array;
      const sc = nd.sweep ? 1 - 0.5 * (nd.sweepE || 0) : 1;
      _N.set(0, 0, 0);
      for (let i = 0; i < n; i++) {
        const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
        _T.set(P[i1 * 3] - P[i0 * 3], P[i1 * 3 + 1] - P[i0 * 3 + 1], P[i1 * 3 + 2] - P[i0 * 3 + 2]);
        if (_T.lengthSq() < 1e-10) _T.set(1, 0, 0); _T.normalize();
        if (i === 0) { _N.set(0, 0, 1); if (Math.abs(_T.z) > 0.9) _N.set(0, 1, 0); }
        _N.addScaledVector(_T, -_N.dot(_T)); if (_N.lengthSq() < 1e-8) _N.set(-_T.y, _T.x, 0); _N.normalize();
        _B.crossVectors(_T, _N);
        const e = Math.min(i, n - 1 - i), r = NR * sc * (e === 0 ? 0.55 : e === 1 ? 0.88 : 1);
        _P.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
        for (let k = 0; k < RS; k++) {
          const a = k / RS * Math.PI * 2;
          _dir.copy(_N).multiplyScalar(Math.cos(a)).addScaledVector(_B, Math.sin(a));
          const v = (i * RS + k) * 3;
          pos[v] = _P.x + _dir.x * r; pos[v + 1] = _P.y + _dir.y * r; pos[v + 2] = _P.z + _dir.z * r;
          nor[v] = _dir.x; nor[v + 1] = _dir.y; nor[v + 2] = _dir.z;
        }
        if (i === 0 || i === n - 1) {
          const t = (MAXP * RS + (i === 0 ? 0 : 1)) * 3, s = i === 0 ? -1 : 1;
          pos[t] = _P.x + _T.x * s * r * 0.9; pos[t + 1] = _P.y + _T.y * s * r * 0.9; pos[t + 2] = _P.z + _T.z * s * r * 0.9;
          nor[t] = _T.x * s; nor[t + 1] = _T.y * s; nor[t + 2] = _T.z * s;
        }
      }
      nd.geo.attributes.position.needsUpdate = true; nd.geo.attributes.normal.needsUpdate = true;
    }
    function noodlePush(nd, x, y, z) {
      if (nd.n >= MAXP) return false;
      const n = nd.n;
      if (n > 0) { const dx = x - nd.p[(n - 1) * 3], dy = y - nd.p[(n - 1) * 3 + 1], dz = z - nd.p[(n - 1) * 3 + 2]; if (dx * dx + dy * dy + dz * dz < SPACING * SPACING) return true; }
      nd.p[n * 3] = x; nd.p[n * 3 + 1] = y; nd.p[n * 3 + 2] = z; nd.n++;
      return nd.n < MAXP;
    }
    function freeNoodle(nd) {
      if (nd.n < 3) { killNoodle(nd); return; }
      const P = nd.p; nd.rest = []; nd.rest2 = [];
      const dist = (i, j) => Math.hypot(P[i * 3] - P[j * 3], P[i * 3 + 1] - P[j * 3 + 1], P[i * 3 + 2] - P[j * 3 + 2]);
      for (let i = 0; i < nd.n - 1; i++) nd.rest.push(dist(i, i + 1));
      for (let i = 0; i < nd.n - 2; i++) nd.rest2.push(dist(i, i + 2));
      nd.pp.set(P);
      for (let i = 0; i < nd.n; i++) nd.pp[i * 3 + 2] -= 0.012;
      nd.free = true;
      const alive = noodles.filter(o => o.free);
      if (alive.length > 14) killNoodle(alive[0], true);
    }
    function killNoodle(nd, fx) {
      const i = noodles.indexOf(nd); if (i >= 0) noodles.splice(i, 1);
      if (fx && nd.n) confetti(new V3(nd.p[0], nd.p[1] + 0.3, nd.p[2]), 24, 3, 4);
      scene.remove(nd.mesh); nd.geo.dispose(); nd.mesh.material.dispose();
    }
    const hash = new Map();
    function stepNoodles(h) {
      const g = 18 * h * h;
      for (const nd of noodles) {
        if (!nd.free || nd.sweep) continue;
        const P = nd.p, PP = nd.pp, n = nd.n;
        for (let i = 0; i < n * 3; i += 3) {
          const vx = (P[i] - PP[i]) * 0.996, vy = (P[i + 1] - PP[i + 1]) * 0.996, vz = (P[i + 2] - PP[i + 2]) * 0.996;
          PP[i] = P[i]; PP[i + 1] = P[i + 1]; PP[i + 2] = P[i + 2];
          P[i] += vx; P[i + 1] += vy - g; P[i + 2] += vz;
        }
        for (let it = 0; it < 4; it++) {
          for (let i = 0; i < n - 1; i++) satisfy(P, i, i + 1, nd.rest[i], 1);
          for (let i = 0; i < n - 2; i++) satisfy(P, i, i + 2, nd.rest2[i], 0.22);
        }
        for (let i = 0; i < n; i++) noodleCollide(P, PP, i * 3);
      }
      // noodle ↔ noodle (spatial hash)
      hash.clear();
      const cs = NR * 2.2, key = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791));
      noodles.forEach((nd, ni) => { if (!nd.free || nd.sweep) return; for (let i = 0; i < nd.n; i++) { const k = key(Math.floor(nd.p[i * 3] / cs), Math.floor(nd.p[i * 3 + 1] / cs), Math.floor(nd.p[i * 3 + 2] / cs)); let a = hash.get(k); if (!a) hash.set(k, a = []); a.push(ni, i); } });
      const md = NR * 2, md2 = md * md;
      noodles.forEach((nd, ni) => {
        if (!nd.free || nd.sweep) return;
        const P = nd.p;
        for (let i = 0; i < nd.n; i++) {
          const cx = Math.floor(P[i * 3] / cs), cy = Math.floor(P[i * 3 + 1] / cs), cz = Math.floor(P[i * 3 + 2] / cs);
          for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
            const a = hash.get(key(cx + dx, cy + dy, cz + dz)); if (!a) continue;
            for (let m = 0; m < a.length; m += 2) {
              const oj = a[m], j = a[m + 1];
              if (oj < ni || (oj === ni && Math.abs(j - i) < 3) || (oj === ni && j < i)) continue;
              const Q = noodles[oj].p;
              const ex = P[i * 3] - Q[j * 3], ey = P[i * 3 + 1] - Q[j * 3 + 1], ez = P[i * 3 + 2] - Q[j * 3 + 2], d2 = ex * ex + ey * ey + ez * ez;
              if (d2 >= md2 || d2 < 1e-10) continue;
              const d = Math.sqrt(d2), c = (md - d) / d * 0.5;
              P[i * 3] += ex * c; P[i * 3 + 1] += ey * c; P[i * 3 + 2] += ez * c;
              Q[j * 3] -= ex * c; Q[j * 3 + 1] -= ey * c; Q[j * 3 + 2] -= ez * c;
            }
          }
        }
      });
    }
    function satisfy(P, i, j, rest, k) {
      const a = i * 3, b = j * 3, dx = P[b] - P[a], dy = P[b + 1] - P[a + 1], dz = P[b + 2] - P[a + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, c = (d - rest) / d * 0.5 * k;
      P[a] += dx * c; P[a + 1] += dy * c; P[a + 2] += dz * c;
      P[b] -= dx * c; P[b + 1] -= dy * c; P[b + 2] -= dz * c;
    }
    function noodleCollide(P, PP, i) {
      if (P[i + 1] < NR) { const vy = P[i + 1] - PP[i + 1]; P[i + 1] = NR; PP[i + 1] = NR + vy * 0.3; PP[i] = P[i] - (P[i] - PP[i]) * 0.7; PP[i + 2] = P[i + 2] - (P[i + 2] - PP[i + 2]) * 0.7; }
      P[i] = clamp(P[i], BOUNDS.x0 + NR, BOUNDS.x1 - NR); P[i + 2] = clamp(P[i + 2], BOUNDS.z0 + NR, BOUNDS.z1 - NR);
      for (const bx of AABBS) {
        if (!bx.on) continue;
        const x = P[i], y = P[i + 1], z = P[i + 2];
        const cx = clamp(x, bx.min.x, bx.max.x), cy = clamp(y, bx.min.y, bx.max.y), cz = clamp(z, bx.min.z, bx.max.z);
        const dx = x - cx, dy = y - cy, dz = z - cz, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= NR * NR) continue;
        if (d2 > 1e-10) { const d = Math.sqrt(d2), c = (NR - d) / d; P[i] += dx * c; P[i + 1] += dy * c; P[i + 2] += dz * c; }
        else { const up = bx.max.y - y, fr = bx.max.z - z, bk = z - bx.min.z, m = Math.min(up, fr, bk); if (m === up) P[i + 1] = bx.max.y + NR; else if (m === fr) P[i + 2] = bx.max.z + NR; else P[i + 2] = bx.min.z - NR; }
      }
      for (const s of SPHERES) {
        const dx = P[i] - s.c.x, dy = P[i + 1] - s.c.y, dz = P[i + 2] - s.c.z, d2 = dx * dx + dy * dy + dz * dz, rr = s.r + NR;
        if (d2 >= rr * rr || d2 < 1e-10) continue;
        const d = Math.sqrt(d2), c = (rr - d) / d; P[i] += dx * c; P[i + 1] += dy * c; P[i + 2] += dz * c;
      }
    }
    let drawing = null, demo = null, demoDone = false;
    function startDemo() {
      demoDone = true;
      const pts = [];
      for (let k = 0; k <= 64; k++) {
        const t = k / 64 * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        pts.push([PAD.x + x * 0.085, PAD.y + 0.25 + y * 0.085]);
      }
      demo = { pts, i: 0, nd: makeNoodle(COL.pink) };
    }

    /* ---------------- squishy blob */
    const blob = { g: new THREE.Group(), S: 0, Sv: 0, y: 0, yv: 0, blink: 0, nextBlink: 2, squint: 0, greeted: false };
    const plate = shade(new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, BLOB.plate, 48), mat(COL.mint))); plate.position.set(BLOB.x, BLOB.plate / 2, 0); scene.add(plate);
    addAABB(BLOB.x - 2.0, 0, -2.0, BLOB.x + 2.0, BLOB.plate, 2.0, 'plate');
    blob.g.position.set(BLOB.x, BLOB.plate, 0); scene.add(blob.g);
    const blobGeo = new THREE.SphereGeometry(BLOB.R, coarse ? 56 : 80, coarse ? 40 : 56); blobGeo.rotateY(-Math.PI / 2);
    const blobMat = new THREE.MeshPhysicalMaterial({ color: '#ff8fd8', roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 1, sheenColor: new THREE.Color('#ffe3a6'), sheenRoughness: 0.5 }); owned.mats.push(blobMat);
    const blobMesh = shade(new THREE.Mesh(blobGeo, blobMat)); blobMesh.userData.kind = 'blob'; blobMesh.position.y = BLOB.R; blob.g.add(blobMesh);
    blobGeo.boundingSphere = new THREE.Sphere(new V3(), BLOB.R * 1.5);
    const bvN = blobGeo.attributes.position.count, bDir = new Float32Array(bvN * 3), bD = new Float32Array(bvN), bV = new Float32Array(bvN);
    for (let i = 0; i < bvN; i++) { _tmp.fromBufferAttribute(blobGeo.attributes.position, i).normalize(); bDir[i * 3] = _tmp.x; bDir[i * 3 + 1] = _tmp.y; bDir[i * 3 + 2] = _tmp.z; }
    const nearestV = d => { let best = 0, bd = -2; for (let i = 0; i < bvN; i++) { const dt = bDir[i * 3] * d.x + bDir[i * 3 + 1] * d.y + bDir[i * 3 + 2] * d.z; if (dt > bd) { bd = dt; best = i; } } return best; };
    const feats = [];
    const addFeat = (obj, dir, out = 0) => { const d = dir.clone().normalize(); obj.quaternion.setFromUnitVectors(new V3(0, 0, 1), d); blobMesh.add(obj); feats.push({ obj, d, idx: nearestV(d), out }); return obj; };
    const eyeMat = plastic('#1e1430', { roughness: 0.15 }), whiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' }); owned.mats.push(whiteMat);
    const eyes = [-1, 1].map(s => {
      const e = new THREE.Group();
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 14), eyeMat); ball.scale.set(1, 1.18, 0.5); e.add(ball);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), whiteMat); hl.position.set(-0.06, 0.08, 0.09); e.add(hl);
      return addFeat(e, new V3(s * 0.34, 0.3, 0.9), 0.02);
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 10, 28, Math.PI), eyeMat); smile.rotation.z = Math.PI;
    const smileG = new THREE.Group(); smileG.add(smile); addFeat(smileG, new V3(0, -0.08, 1), 0.01);
    const ohMouth = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.055, 10, 24), eyeMat); ohMouth.visible = false; smileG.add(ohMouth); ohMouth.position.y = -0.12;
    const cheekMat = new THREE.MeshStandardMaterial({ color: '#ff5fb4', roughness: 0.8, transparent: true, opacity: 0.6 }); owned.mats.push(cheekMat);
    [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), cheekMat); c.scale.set(1.2, 0.7, 0.25); addFeat(c, new V3(s * 0.6, -0.04, 0.8), -0.01); });
    const blobSphere = { c: new V3(BLOB.x, BLOB.plate + BLOB.R, 0), r: BLOB.R * 0.96, onHit: (pt, sp) => { pokeBlob(pt, Math.min(2.6, sp * 0.22)); if (sp > 5) boingAt(pt); } };
    SPHERES.push(blobSphere);
    const _loc = new V3();
    function pokeBlob(worldPt, strength) {
      _loc.copy(worldPt).sub(blobSphere.c).normalize();
      for (let i = 0; i < bvN; i++) {
        const dt = bDir[i * 3] * _loc.x + bDir[i * 3 + 1] * _loc.y + bDir[i * 3 + 2] * _loc.z, x = 1 - dt;
        bV[i] += strength * (-Math.exp(-x / 0.05) * 1.1 + 0.32 * Math.exp(-x / 0.35));
      }
      blob.Sv += strength * 1.6 * Math.max(0.3, _loc.y);
      blob.squint = 0.45;
      if (strength > 1.6 && blob.y < 0.01) blob.yv = strength * 2.2;
    }
    function updateBlob(dt, t) {
      const K = 150, C = 3.0;
      for (let i = 0; i < bvN; i++) { bV[i] += (-K * bD[i] - C * bV[i]) * dt; bD[i] += bV[i] * dt; if (bD[i] < -0.45) bD[i] = -0.45; }
      const pos = blobGeo.attributes.position.array;
      for (let i = 0; i < bvN; i++) {
        const dx = bDir[i * 3], dy = bDir[i * 3 + 1], dz = bDir[i * 3 + 2];
        const r = BLOB.R * (1 + bD[i] + Math.sin(t * 2.3 + dy * 4 + dx * 2) * 0.012 + (dy < -0.6 ? (dy + 0.6) * 0.18 : 0));
        pos[i * 3] = dx * r; pos[i * 3 + 1] = dy * r; pos[i * 3 + 2] = dz * r;
      }
      blobGeo.attributes.position.needsUpdate = true; blobGeo.computeVertexNormals();
      blob.Sv += (-90 * blob.S - 4.5 * blob.Sv) * dt; blob.S += blob.Sv * dt; blob.S = clamp(blob.S, -0.35, 0.45);
      blob.yv -= 30 * dt; blob.y += blob.yv * dt;
      if (blob.y < 0) { if (blob.yv < -3) blob.Sv += -blob.yv * 0.5; blob.y = 0; blob.yv = 0; }
      blobMesh.scale.set(1 + blob.S * 0.45, 1 - blob.S, 1 + blob.S * 0.45);
      blobMesh.position.y = BLOB.R * (1 - blob.S) + blob.y;
      blobSphere.c.set(BLOB.x, BLOB.plate + BLOB.R * (1 - blob.S) + blob.y, 0);
      blob.squint = Math.max(0, blob.squint - dt);
      blob.nextBlink -= dt; if (blob.nextBlink < 0) { blob.blink = 0.16; blob.nextBlink = rand(2, 5); }
      blob.blink = Math.max(0, blob.blink - dt);
      const eyeY = blob.squint > 0 ? 0.22 : blob.blink > 0 ? 0.12 : 1;
      for (const f of feats) {
        const r = BLOB.R * (1 + bD[f.idx]) + f.out;
        f.obj.position.copy(f.d).multiplyScalar(r);
      }
      eyes.forEach(e => { e.scale.y += (eyeY - e.scale.y) * Math.min(1, dt * 30); e.position.x += mouse.x * 0.07; e.position.y -= mouse.y * 0.06; });
      ohMouth.visible = blob.squint > 0; smile.visible = !ohMouth.visible;
    }

    /* ---------------- background decoration */
    const starGeo = new THREE.ExtrudeGeometry(starShape(0.9, 0.42), { depth: 0.3, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 4, curveSegments: 4 }); starGeo.center();
    const stars = [];
    for (let k = 0; k < 13; k++) {
      const s = shade(new THREE.Mesh(starGeo, mat(PALETTE[k % PALETTE.length])));
      s.position.set(-6 + k * 5.4 + rand(-1, 1), rand(4.5, 9), rand(-12, -9)); s.scale.setScalar(rand(0.7, 1.4));
      s.userData = { ph: rand(0, 6), sp: rand(0.2, 0.6) }; s.castShadow = false; scene.add(s); stars.push(s);
    }
    [[-6.5, -3.6], [21, -4.2], [48.5, -4.2], [35, -4.4]].forEach(([x, z], k) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      const base = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.3, 32), mat(COL.lilac))); base.position.y = 0.15; g.add(base);
      const pole = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 16), mat(COL.yellow))); pole.position.y = 1.4; g.add(pole);
      [COL.pink, COL.orange, COL.yellow, COL.mint, COL.blue].forEach((c, i) => { const r = shade(new THREE.Mesh(new THREE.TorusGeometry(0.62 - i * 0.09, 0.19 - i * 0.015, 14, 32), mat(c))); r.rotation.x = Math.PI / 2; r.position.y = 0.5 + i * 0.36; g.add(r); });
      const top = shade(new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 12), mat(PALETTE[k % 6]))); top.position.y = 2.8; g.add(top);
      addAABB(x - 0.8, 0, z - 0.8, x + 0.8, 2.9, z + 0.8, 'deco');
    });

    /* ---------------- camera views */
    const V = {};
    let portrait = false;
    function makeView(look, dir, W, H, o = {}) {
      const { fx = 0.5, fy = 0.5, fw = 1, fh = 1 } = o;
      const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
      const d = Math.max((W / fw / 2) / Math.tan(hf / 2), (H / fh / 2) / Math.tan(vf / 2));
      const visW = 2 * d * Math.tan(hf / 2), visH = 2 * d * Math.tan(vf / 2);
      const l = new V3(...look); l.x += (0.5 - fx) * visW; l.y -= (0.5 - fy) * visH;
      return { look: l, pos: l.clone().addScaledVector(new V3(...dir).normalize(), d) };
    }
    function computeViews() {
      portrait = camera.aspect < 0.9;
      layoutLetters(portrait);
      V.boxClosed = makeView([X.box, 1.25, BOX_Z], [0, 0.42, 1], 6.4, 4.2, { fy: 0.4, fh: portrait ? 0.42 : 0.52 });
      V.intro = portrait ? makeView([X.box, 0.9, 2.0], [0, 0.95, 1], layoutRowW + 1.8, 6.4, { fy: 0.5, fh: 0.8 })
        : makeView([X.box, 1.15, 0.5], [0, 0.36, 1], layoutRowW + 3.2, 5.4, { fy: 0.56, fh: 0.8 });
      V.blocks = makeView([X.blocks, 3.25, 0], [0, 0.18, 1], 6.5, 7.6, portrait ? { fy: 0.56, fh: 0.74 } : { fx: 0.56, fh: 0.84, fy: 0.54 });
      V.gacha = portrait ? makeView([X.gacha, 2.8, 0.8], [0, 0.22, 1], 5.4, 6.6, { fy: 0.33, fh: 0.42 })
        : makeView([X.gacha, 2.9, 0.8], [0, 0.2, 1], 6.2, 6.8, { fx: 0.3, fw: 0.55, fh: 0.84, fy: 0.54 });
      V.pad = makeView([X.pad, 2.5, -0.6], [0, 0.2, 1], 8.4, 5.8, portrait ? { fy: 0.46, fh: 0.6 } : { fh: 0.74, fy: 0.5 });
      V.blob = makeView([X.blob, 1.9, 0], [0, 0.22, 1], 5.4, 4.6, portrait ? { fy: 0.5, fh: 0.6 } : { fh: 0.74, fy: 0.56 });
      V.overview = makeView([28, 0.5, 0], [0, 0.8, 1], 62, 16);
      V.fin = makeView([X.box, 1.3, BOX_Z], [0, 0.55, 1], 7.2, 4.4, { fy: portrait ? 0.74 : 0.75, fh: portrait ? 0.36 : 0.38 });
    }
    const KF = [[0, 'boxClosed'], [0.02, 'boxClosed'], [0.075, 'intro'], [0.108, 'intro'], [0.15, 'blocks'], [0.285, 'blocks'], [0.325, 'gacha'], [0.585, 'gacha'], [0.63, 'pad'], [0.745, 'pad'], [0.79, 'blob'], [0.872, 'blob'], [0.905, 'overview'], [0.94, 'fin'], [1, 'fin']];
    const camT = { pos: new V3(), look: new V3() };
    function sampleCam(p) {
      let i = 0;
      while (i < KF.length - 2 && p > KF[i + 1][0]) i++;
      const [pa, a] = KF[i], [pb, b] = KF[i + 1];
      const t = smooth(0, 1, (p - pa) / Math.max(1e-6, pb - pa));
      const A = V[a], B = V[b];
      camT.pos.lerpVectors(A.pos, B.pos, t); camT.look.lerpVectors(A.look, B.look, t);
      const dist = A.look.distanceTo(B.look);
      if (dist > 6 && b !== 'overview' && a !== 'overview') { const bump = Math.sin(Math.PI * t); camT.pos.y += bump * Math.min(3, dist * 0.09); camT.pos.z += bump * Math.min(4, dist * 0.12); }
      return camT;
    }

    /* ---------------- resize */
    function resize() {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.fov = camera.aspect < 0.8 ? 58 : camera.aspect < 1.2 ? 50 : 40; camera.updateProjectionMatrix();
      computeViews();
    }
    resize();
    addEventListener('resize', resize, { signal });

    /* ---------------- scroll */
    const track = $('.tb-track');
    let target = 0, prog = 0, lenis = null, ctx = null, gsap = null, tickerFn = null, lenisFn = null, rafId = 0;
    const readNative = () => { const r = track.getBoundingClientRect(); target = clamp(-r.top / Math.max(1, r.height - innerHeight)); };
    const pToY = p => { const r = track.getBoundingClientRect(); return scrollY + r.top + p * (r.height - innerHeight); };
    const scrollToP = (p, dur = 1.8) => { const y = pToY(p); if (lenis) lenis.scrollTo(y, { duration: dur }); else scrollTo({ top: y, behavior: 'smooth' }); };
    const scrollByPx = dy => { if (lenis) lenis.scrollTo(lenis.scroll + dy, { immediate: true }); else scrollBy(0, dy); };
    if (libs) {
      const [{ gsap: Gs }, { ScrollTrigger }, { default: Lenis }] = libs;
      gsap = Gs; gsap.registerPlugin(ScrollTrigger);
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on('scroll', ScrollTrigger.update);
      lenisFn = t => lenis.raf(t * 1000);
      gsap.ticker.add(lenisFn); gsap.ticker.lagSmoothing(0);
      ctx = gsap.context(() => {
        ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: self => { target = self.progress; } });
      }, el);
      ScrollTrigger.refresh();
      readNative();
    } else {
      addEventListener('scroll', readNative, { signal, passive: true });
      readNative();
    }
    prog = target;

    /* ---------------- UI */
    const ui = {
      st: $('.tb-station'), stNum: $('.tb-st-num'), stTitle: $('.tb-st-title'), stKo: $('.tb-st-ko'),
      cards: $$('.tb-card'), fin: $('.tb-finale'), nav: $$('.tb-nav li'), bar: $('.tb-nav-bar b'), boings: $('.tb-boings'), zone: $('.tb-padzone')
    };
    $('.tb-loading').remove();
    el.classList.add('is-live');
    const state = { st: '', card: -2, fin: false, nav: -1, zone: '' };
    $$('[data-go]').forEach(b => b.addEventListener('click', () => scrollToP(GO[+b.dataset.go], 2.2), { signal }));
    $('[data-open]').addEventListener('click', () => scrollToP(0.09, 1.6), { signal });
    $('[data-rebuild]').addEventListener('click', () => { if (tower.state !== 'building') buildTower(true); }, { signal });
    $('[data-clear]').addEventListener('click', () => { [...noodles].forEach(nd => killNoodle(nd, true)); drawing = null; demo = null; }, { signal });
    $$('[data-ink]').forEach(b => b.addEventListener('click', () => { inkColor = b.dataset.ink; $$('[data-ink]').forEach(o => o.classList.toggle('is-on', o === b)); }, { signal }));
    $$('[data-next]').forEach(b => b.addEventListener('click', () => { const k = +b.dataset.next; scrollToP(k >= 2 ? 0.67 : 0.3 + (k + 1 + 0.62) / 3 * 0.3, 1.6); }, { signal }));

    function boingAt(world, word) {
      _tmp.copy(world).project(camera);
      if (_tmp.z > 1 || Math.abs(_tmp.x) > 1.1 || Math.abs(_tmp.y) > 1.1) return;
      boing((_tmp.x * 0.5 + 0.5) * innerWidth, (-_tmp.y * 0.5 + 0.5) * innerHeight, word);
    }
    let boingCount = 0;
    function boing(x, y, word) {
      if (ui.boings.childElementCount > 10) return;
      const s = document.createElement('span');
      s.textContent = word || BOINGS[(Math.random() * BOINGS.length) | 0];
      s.style.left = `${x}px`; s.style.top = `${y}px`;
      s.style.setProperty('--r', `${rand(-16, 16).toFixed(1)}deg`);
      s.style.setProperty('--c', PALETTE[boingCount++ % PALETTE.length]);
      s.addEventListener('animationend', () => s.remove(), { once: true });
      ui.boings.appendChild(s);
    }

    /* ---------------- camera fx */
    const cam = { pos: new V3(), look: new V3(), pv: new V3(), lv: new V3(), shake: 0, init: false };
    function shake(a) { cam.shake = Math.min(0.6, cam.shake + a); }

    /* ---------------- pointer */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, moved: false, cx: 0, cy: 0 };
    const grab = { body: null, plane: new THREE.Plane(), mode: '', id: -1, lastA: 0, crankC: new THREE.Vector2(), lastPoke: new V3() };
    const pickables = () => {
      const list = [blobMesh, gacha.crank, ...boxParts];
      for (const b of bodies) if (b.active && b.mesh.visible) list.push(b.mesh);
      return list;
    };
    const setRay = (x, y) => { ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); };
    const owner = o => { while (o && !o.userData.kind && o.parent) o = o.userData.owner || o.parent; return o; };
    function pick(x, y) {
      setRay(x, y);
      const hits = ray.intersectObjects(pickables(), true);
      for (const h of hits) { const o = owner(h.object); if (o && o.userData.kind) return { o, h }; }
      return null;
    }
    function endGrab() {
      if (grab.body) { grab.body.grab = null; if (grab.body.kind === 'letter') grab.body.formDelay = 2.2; }
      grab.body = null; grab.mode = ''; el.classList.remove('is-grabbing');
    }
    canvas.addEventListener('pointerdown', e => {
      if (e.button) return;
      const r = pick(e.clientX, e.clientY);
      if (!r) return;
      const { o, h } = r, kind = o.userData.kind, b = o.userData.body;
      if (kind === 'blob') {
        pokeBlob(h.point, 2.4); boing(e.clientX, e.clientY); grab.mode = 'poke'; grab.lastPoke.copy(h.point);
      } else if (b && kind === 'block' && b.kin && tower.state === 'tower') {
        _tmp.subVectors(h.point, camera.position).normalize(); knockTower(b, h.point, _tmp); return;
      } else if (b && dyn(b)) {
        grab.body = b; grab.mode = 'body'; b.grab = { local: h.point.clone().sub(b.pos).applyQuaternion(b.q.clone().invert()), target: h.point.clone() };
        camera.getWorldDirection(_tmp); grab.plane.setFromNormalAndCoplanarPoint(_tmp.negate(), h.point);
        b.sqv += 3; el.classList.add('is-grabbing');
        if (b.kind === 'block' && tower.state === 'fallen') tower.idle = 0;
      } else if (kind === 'crank') {
        grab.mode = 'crank'; _tmp.setFromMatrixPosition(gacha.crank.matrixWorld).project(camera);
        grab.crankC.set((_tmp.x * 0.5 + 0.5) * innerWidth, (-_tmp.y * 0.5 + 0.5) * innerHeight);
        grab.lastA = Math.atan2(e.clientY - grab.crankC.y, e.clientX - grab.crankC.x);
        el.classList.add('is-grabbing');
      } else if (kind === 'box') {
        if (box.open < 0.3) scrollToP(0.09, 1.6); else { box.hopV = 5; confetti(new V3(X.box, 2.4, BOX_Z), 30, 4, 6); }
        return;
      } else return;
      grab.id = e.pointerId;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      e.preventDefault();
    }, { signal });
    const _hit = new V3();
    addEventListener('pointermove', e => {
      mouse.cx = e.clientX; mouse.cy = e.clientY;
      if (e.pointerType === 'mouse') { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; mouse.moved = true; }
      if (e.pointerId !== grab.id) return;
      if (grab.mode === 'body' && grab.body) {
        setRay(e.clientX, e.clientY);
        if (ray.ray.intersectPlane(grab.plane, _hit)) { _hit.y = Math.max(0.35, _hit.y); _hit.z = clamp(_hit.z, BOUNDS.z0 + 0.5, BOUNDS.z1 - 0.5); grab.body.grab.target.copy(_hit); }
      } else if (grab.mode === 'crank') {
        const a = Math.atan2(e.clientY - grab.crankC.y, e.clientX - grab.crankC.x);
        let da = a - grab.lastA; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
        grab.lastA = a;
        const r = track.getBoundingClientRect(), range = r.height - innerHeight;
        scrollByPx(da / (Math.PI * 2) * 0.3 * 0.1 * range);
      } else if (grab.mode === 'poke') {
        setRay(e.clientX, e.clientY);
        const hits = ray.intersectObject(blobMesh, false);
        if (hits[0] && hits[0].point.distanceTo(grab.lastPoke) > 0.25) { pokeBlob(hits[0].point, 0.7); grab.lastPoke.copy(hits[0].point); }
      }
    }, { signal, passive: true });
    const up = e => { if (e.pointerId !== grab.id) return; grab.id = -1; endGrab(); };
    addEventListener('pointerup', up, { signal });
    addEventListener('pointercancel', up, { signal });
    document.addEventListener('pointerleave', () => { mouse.tx = 0; mouse.ty = 0; }, { signal });

    // drawing zone
    let drawId = -1;
    const zonePoint = e => {
      setRay(e.clientX, e.clientY);
      const pl = new THREE.Plane(new V3(0, 0, 1), -PAD.dz);
      if (!ray.ray.intersectPlane(pl, _hit)) return null;
      return [clamp(_hit.x, PAD.x - PAD.w / 2 + 0.2, PAD.x + PAD.w / 2 - 0.2), clamp(_hit.y, PAD.y - PAD.h / 2 + 0.2, PAD.y + PAD.h / 2 - 0.2)];
    };
    ui.zone.addEventListener('pointerdown', e => {
      if (e.button) return;
      const pt = zonePoint(e); if (!pt) return;
      if (demo) { while (demo.i < demo.pts.length) { const q = demo.pts[demo.i++]; noodlePush(demo.nd, q[0], q[1], PAD.dz); } freeNoodle(demo.nd); demo = null; }
      drawing = makeNoodle(inkColor); noodlePush(drawing, pt[0], pt[1], PAD.dz);
      drawId = e.pointerId; try { ui.zone.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      e.preventDefault();
    }, { signal });
    ui.zone.addEventListener('pointermove', e => {
      if (e.pointerId !== drawId || !drawing) return;
      const pt = zonePoint(e); if (!pt) return;
      if (!noodlePush(drawing, pt[0], pt[1], PAD.dz)) { freeNoodle(drawing); drawing = null; drawId = -1; }
    }, { signal });
    const drawEnd = e => { if (e.pointerId !== drawId) return; drawId = -1; if (drawing) { freeNoodle(drawing); drawing = null; } };
    ui.zone.addEventListener('pointerup', drawEnd, { signal });
    ui.zone.addEventListener('pointercancel', drawEnd, { signal });

    /* ---------------- impacts */
    impactHook = (A, B, point, speed) => {
      if (B && B.kind === 'block' && B.kin && tower.state === 'tower' && A.kind !== 'block' && speed > 3.5) knockTower(B, point.clone(), A.vel.clone().normalize());
      else if (A.kind === 'block' && A.kin && B && tower.state === 'tower' && speed > 3.5) knockTower(A, point.clone(), B.vel.clone().normalize());
      if (speed > 10) shake(0.08);
    };

    /* ---------------- sweep (finale) */
    let sweeping = false;
    function startSweep() {
      sweeping = true;
      endGrab(); if (drawing) { freeNoodle(drawing); drawing = null; }
      let k = 0;
      for (const b of bodies) {
        if (!b.active || !b.mesh.visible) continue;
        b.sweep = { from: b.pos.clone(), q0: b.q.clone(), d: Math.min(0.35, (k++ % 14) * 0.025), to: BOX_IN.clone().add(new V3(rand(-1.2, 1.2), rand(-0.4, 0.3), rand(-1.1, 1.1))), e: 0 };
        b.kin = true; b.grab = null; b.script = null;
      }
      noodles.forEach((nd, i) => { if (!nd.free || !nd.n) return; nd.sweep = { from: nd.p.slice(0, nd.n * 3), d: Math.min(0.35, i * 0.03), to: BOX_IN.clone().add(new V3(rand(-1, 1), 0, rand(-1, 1))) }; });
    }
    function updateSweep(s) {
      for (const b of bodies) {
        const w = b.sweep; if (!w) continue;
        const e = smooth(w.d, w.d + 0.62, s); w.e = e;
        b.pos.lerpVectors(w.from, w.to, e); b.pos.y += Math.sin(Math.PI * e) * (3 + w.from.distanceTo(w.to) * 0.1);
        b.q.slerpQuaternions(w.q0, _q.identity(), e);
        b.scale = 1 - 0.5 * e; b.sync();
      }
      for (const nd of noodles) {
        const w = nd.sweep; if (!w) continue;
        const e = smooth(w.d, w.d + 0.62, s); nd.sweepE = e;
        let cx = 0, cy = 0, cz = 0; const n = nd.n;
        for (let i = 0; i < n; i++) { cx += w.from[i * 3]; cy += w.from[i * 3 + 1]; cz += w.from[i * 3 + 2]; }
        cx /= n; cy /= n; cz /= n;
        const arcY = Math.sin(Math.PI * e) * 4;
        for (let i = 0; i < n * 3; i += 3) {
          const tx = w.to.x + (w.from[i] - cx) * 0.22, ty = w.to.y + (w.from[i + 1] - cy) * 0.22, tz = w.to.z + (w.from[i + 2] - cz) * 0.22;
          nd.p[i] = w.from[i] + (tx - w.from[i]) * e; nd.p[i + 1] = w.from[i + 1] + (ty - w.from[i + 1]) * e + arcY; nd.p[i + 2] = w.from[i + 2] + (tz - w.from[i + 2]) * e;
          nd.pp[i] = nd.p[i]; nd.pp[i + 1] = nd.p[i + 1]; nd.pp[i + 2] = nd.p[i + 2];
        }
      }
    }
    function endSweep() {
      sweeping = false;
      let popped = false;
      for (const b of bodies) {
        const w = b.sweep; if (!w) continue;
        b.sweep = null; b.scale = 1;
        const inBox = w.e > 0.98;
        if (b.kind === 'block') { b.kin = true; continue; }
        b.kin = false;
        if (inBox) { b.ghost = 0.45; b.vel.set(rand(-2.5, 2.5), rand(10, 13), rand(2, 4.5)); b.w.set(rand(-6, 6), rand(-6, 6), rand(-6, 6)); popped = true; }
        else b.vel.set(0, 2, 0);
        if (b.kind === 'letter') b.formDelay = 1 + b.idx * 0.06;
      }
      if (tower.state !== 'hidden') buildTower(true);
      for (const nd of noodles) {
        const w = nd.sweep; if (!w) continue;
        nd.sweep = null; nd.sweepE = 0;
        const vx = rand(-2, 2) / 120, vy = rand(8, 11) / 120, vz = rand(1, 3) / 120;
        for (let i = 0; i < nd.n * 3; i += 3) { nd.pp[i] = nd.p[i] - vx; nd.pp[i + 1] = nd.p[i + 1] - vy; nd.pp[i + 2] = nd.p[i + 2] - vz; }
      }
      if (popped) { confetti(new V3(X.box, 2.3, BOX_Z), 80, 6, 8); box.hopV = 4; }
    }

    /* ---------------- main loop */
    updateBlob(0, 0);
    let time = 0, last = performance.now(), acc = 0, introReady = false, stIdx = -1;
    const H = 1 / 120;
    const _cam = new V3(), _look = new V3();

    function stationOf(p) { return p < 0.115 ? 0 : p < 0.3 ? 1 : p < 0.6 ? 2 : p < 0.76 ? 3 : p < 0.885 ? 4 : 5; }

    function updateUI(p, dt) {
      const si = stationOf(p);
      if (si !== stIdx) {
        stIdx = si; const s = ST[si];
        el.dataset.st = s.id;
        ui.stNum.textContent = s.num; ui.stTitle.textContent = s.title; ui.stKo.textContent = s.ko;
        ui.st.classList.remove('is-pop'); void ui.st.offsetWidth; ui.st.classList.add('is-pop');
      }
      el.classList.toggle('is-top', p < 0.035);
      el.classList.toggle('has-letters', lettersOut && p > 0.06 && p < 0.115);
      // gacha card
      const t = (p - 0.3) / 0.3;
      let card = -1;
      if (t > 0 && t < 1.02) for (let k = 0; k < 3; k++) { const uk = t * 3 - k, un = t * 3 - k - 1; if (uk >= 0.5 && (k === 2 || un < 0.3)) card = k; }
      if (card !== state.card) {
        state.card = card;
        ui.cards.forEach((c, i) => { const on = i === card; c.classList.toggle('is-on', on); c.inert = !on; c.setAttribute('aria-hidden', String(!on)); });
      }
      const fin = p > 0.955;
      if (fin !== state.fin) { state.fin = fin; ui.fin.classList.toggle('is-on', fin); ui.fin.inert = !fin; ui.fin.setAttribute('aria-hidden', String(!fin)); }
      if (si !== state.nav) { state.nav = si; ui.nav.forEach((li, i) => { li.classList.toggle('is-active', i === si); li.classList.toggle('is-past', i < si); }); }
      ui.bar.style.transform = `scaleX(${p.toFixed(4)})`;
      // drawing zone placement
      if (si === 3) {
        const pts = [[PAD.x - PAD.w / 2, PAD.y + PAD.h / 2], [PAD.x + PAD.w / 2, PAD.y - PAD.h / 2]].map(([x, y]) => { _tmp.set(x, y, PAD.dz).project(camera); return [(_tmp.x * 0.5 + 0.5) * innerWidth, (-_tmp.y * 0.5 + 0.5) * innerHeight]; });
        const z = `${Math.round(pts[0][0])},${Math.round(pts[0][1])},${Math.round(pts[1][0] - pts[0][0])},${Math.round(pts[1][1] - pts[0][1])}`;
        if (z !== state.zone) { state.zone = z; const [l, tp, w, h] = z.split(',').map(Number); Object.assign(ui.zone.style, { left: `${l}px`, top: `${tp}px`, width: `${Math.max(0, w)}px`, height: `${Math.max(0, h)}px` }); }
      }
    }

    function frame(now) {
      if (disposed) return;
      const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
      if (document.hidden) return;
      if (!introReady && !document.querySelector('.pn-intro:not(.pn-out)')) { introReady = true; el.classList.add('is-ready'); }
      readNative();
      const paused = isPaused();
      el.classList.toggle('is-paused', paused);
      prog += (target - prog) * (1 - Math.exp(-dt * 8));
      if (Math.abs(target - prog) < 1e-5) prog = target;
      const p = prog;

      /* -- scroll-driven state */
      const lidOpen = smooth(0.018, 0.062, p) * (1 - smooth(0.95, 0.975, p));
      if (!lettersOut && lidOpen > 0.55) spawnLetters();
      if (tower.state === 'hidden' && p > 0.11) buildTower(false);
      if (!demoDone && p > 0.625 && p < 0.76) startDemo();
      if (!blob.greeted && p > 0.79 && p < 0.885) { blob.greeted = true; blob.yv = 6; setTimeout(() => { if (!disposed) boingAt(blobSphere.c.clone().add(new V3(0, 1.4, 0)), 'HI!'); }, 250); }
      // gacha slots
      const gt = (p - 0.3) / 0.3;
      let crankTarget = 0;
      for (let k = 0; k < 3; k++) {
        const uk = clamp(gt * 3 - k, -1, 2);
        crankTarget += smooth(0, 0.3, uk) * Math.PI * 2;
        const s = gacha.slots[k];
        if (uk >= 0.3 && !s.disp && !sweeping) dispense(k);
        if (uk < 0.22 && s.disp) undoSlot(k);
        if (uk >= 0.5 && s.disp && !s.crack && !sweeping) crack(k);
      }
      gacha.angle += (crankTarget - gacha.angle) * (1 - Math.exp(-dt * 10));
      const crankSpeed = Math.abs(gacha.angle - gacha.prevAngle) / Math.max(dt, 1e-3); gacha.prevAngle = gacha.angle;
      gacha.crank.rotation.z = -gacha.angle;
      // sweep
      const sw = smooth(0.888, 0.945, p);
      if (sw > 0.001 && !sweeping) startSweep();
      if (sweeping) { updateSweep(sw); if (sw <= 0.001) endSweep(); }

      /* -- simulation */
      if (!paused) {
        time += dt;
        acc = Math.min(acc + dt, H * 5);
        while (acc >= H) {
          acc -= H;
          for (const b of bodies) { integrate(b, H); if (b.formDelay > 0) b.formDelay -= H; if (b.ghost > 0) b.ghost -= H; }
          for (const b of bodies) if (b.active) b.sync();
          for (let it = 0; it < 2; it++) {
            for (const b of bodies) if (dyn(b)) collideStatic(b);
            for (let i = 0; i < bodies.length; i++) {
              const A = bodies[i]; if (!A.active || A.sweep) continue;
              for (let j = i + 1; j < bodies.length; j++) {
                const B = bodies[j]; if (!B.active || B.sweep || (A.ghost > 0 && B.kind === A.kind) || B.ghost > 0 && B.kind === A.kind) continue;
                if (!dyn(A) && !dyn(B)) continue;
                if (dyn(A)) collidePair(A, B); else collidePair(B, A);
              }
            }
          }
          stepNoodles(H);
        }
        // letters: hop into formation
        for (const b of letters) if (b.active && !b.kin && b.formDelay <= 0 && !b.hopped) {
          b.hopped = true; b.sqv += 3;
          const inBox = Math.abs(b.pos.x - X.box) < 2.4 && Math.abs(b.pos.z - BOX_Z) < 2.2 && b.pos.y < 3;
          if (inBox) { b.ghost = 0.5; b.vel.set((b.form.x - b.pos.x) * 0.9, 12, (b.form.z - b.pos.z) * 0.9); } else b.vel.y += 6.5;
        }
        for (const b of letters) if (b.formDelay > 0.5) b.hopped = false;
        updateBlocks(dt);
        updateConfetti(dt, time);
        if (camera.position.x > 44 || blob.S !== 0) updateBlob(dt, time);
        // demo heart
        if (demo) {
          for (let k = 0; k < 2 && demo.i < demo.pts.length; k++) { const q = demo.pts[demo.i++]; noodlePush(demo.nd, q[0], q[1], PAD.dz); }
          if (demo.i >= demo.pts.length) { freeNoodle(demo.nd); demo = null; }
        }
        // gacha inner capsules + flap
        gacha.spin = Math.max(0, gacha.spin - dt * 3);
        const jig = Math.min(1.2, crankSpeed * 0.08 + gacha.spin * 0.12);
        gacha.inner.forEach((c, i) => {
          const u = c.userData;
          c.position.set(u.base.x + Math.sin(time * 9 + u.ph) * 0.12 * jig, 4.15 + u.base.y + Math.abs(Math.sin(time * 11 + u.ph * 2)) * 0.3 * jig, u.base.z + Math.cos(time * 8 + u.ph) * 0.12 * jig);
          c.rotation.set(u.rot.x + time * jig * 2, u.rot.y + time * 0.2, u.rot.z);
        });
        flapV += (flapKick * 9 - flapA * 60 - flapV * 6) * dt; flapA += flapV * dt; flapKick = 0;
        flap.rotation.x = -Math.max(0, flapA) * 0.9;
        // box rattle (before opening), hop
        if (introReady && lidOpen < 0.05 && p < 0.02) {
          box.nextRattle -= dt;
          if (box.nextRattle < 0) { box.nextRattle = rand(1.6, 2.8); box.rattle = 0.5; box.hopV = 2.6; }
        }
        box.rattle = Math.max(0, box.rattle - dt);
        box.hopV -= 28 * dt; box.hop += box.hopV * dt; if (box.hop < 0) { box.hop = 0; box.hopV = 0; }
        stars.forEach(s => { const u = s.userData; s.rotation.y = time * u.sp + u.ph; s.position.y += Math.sin(time * 0.8 + u.ph) * 0.004; });
      }
      // lid
      const peek = box.rattle > 0 ? Math.sin(box.rattle * 40) * 0.06 + 0.1 : 0;
      box.lid.rotation.x = -(lidOpen * 1.95 + peek);
      box.g.rotation.z = box.rattle > 0 ? Math.sin(box.rattle * 55) * 0.03 : 0;
      box.g.position.y = box.hop;
      const closed = smooth(0.95, 0.975, p);
      if (closed > 0.98 && !box.closedFx) { box.closedFx = true; box.hopV = 5; confetti(new V3(X.box, 3, BOX_Z), coarse ? 100 : 170, 6, 9); shake(0.25); boingAt(new V3(X.box, 3.6, BOX_Z), 'TIDY!'); }
      if (closed < 0.5) box.closedFx = false;

      /* -- mesh sync + squash */
      for (const b of bodies) {
        if (!b.active) continue;
        if (!paused) { b.sqv += (-70 * b.sq - 8 * b.sqv) * dt; b.sq = clamp(b.sq + b.sqv * dt, -0.4, 0.45); }
        b.mesh.position.copy(b.pos); b.mesh.quaternion.copy(b.q);
        const s = b.scale;
        b.mesh.scale.set(s * (1 + b.sq * 0.28), s * (1 - b.sq * 0.38), s * (1 + b.sq * 0.28));
      }
      for (const nd of noodles) updateTube(nd);

      /* -- camera */
      sampleCam(p);
      mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 3)); mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 3));
      _cam.copy(camT.pos); _look.copy(camT.look);
      _cam.x += mouse.x * 0.55; _cam.y -= mouse.y * 0.3;
      if (!cam.init) { cam.init = true; cam.pos.copy(_cam); cam.look.copy(_look); }
      const K = 70, D = 12.5;
      cam.pv.addScaledVector(_tmp.subVectors(_cam, cam.pos), K * dt).multiplyScalar(Math.exp(-D * dt)); cam.pos.addScaledVector(cam.pv, dt);
      cam.lv.addScaledVector(_tmp.subVectors(_look, cam.look), K * dt).multiplyScalar(Math.exp(-D * dt)); cam.look.addScaledVector(cam.lv, dt);
      cam.shake *= Math.exp(-dt * 6);
      const sh = paused ? 0 : cam.shake;
      camera.position.set(cam.pos.x + rand(-1, 1) * sh * 0.25, cam.pos.y + rand(-1, 1) * sh * 0.25, cam.pos.z);
      camera.lookAt(cam.look);
      camera.rotateZ(clamp(-cam.pv.x * 0.003, -0.05, 0.05) + (paused ? 0 : Math.sin(time * 0.6) * 0.004));
      const cd = cam.pos.distanceTo(cam.look);
      scene.fog.near = cd * 0.9 + 4; scene.fog.far = cd * 3 + 26;
      key.position.set(cam.look.x + 7, 14, cam.look.z + 9); key.target.position.set(cam.look.x, 0, cam.look.z - 1);

      // hover cursor
      if (mouse.moved && !grab.mode) {
        mouse.moved = false;
        const r = pick(mouse.cx, mouse.cy);
        const k = r ? (r.o.userData.kind === 'block' && tower.state === 'tower' ? 'knock' : r.o.userData.kind === 'box' ? 'knock' : r.o.userData.kind === 'blob' ? 'poke' : 'grab') : '';
        if (el.dataset.hover !== k) el.dataset.hover = k;
      }

      updateUI(p, dt);
      renderer.render(scene, camera);
    }

    if (gsap) { tickerFn = () => frame(performance.now()); gsap.ticker.add(tickerFn); }
    else { const loop = now => { rafId = requestAnimationFrame(loop); frame(now); }; rafId = requestAnimationFrame(loop); }

    teardown = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (gsap) { if (tickerFn) gsap.ticker.remove(tickerFn); if (lenisFn) gsap.ticker.remove(lenisFn); gsap.ticker.lagSmoothing(500, 33); }
      ctx?.revert(); lenis?.destroy();
      const geos = new Set(), mats = new Set(owned.mats);
      [hemiTop, hemiBot, smallTop, smallBot, starGeo, footG].forEach(g => geos.add(g));
      scene.traverse(o => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
        if (o.isInstancedMesh) o.dispose?.();
      });
      for (const b of bodies) b.mesh.traverse(o => { if (o.geometry) geos.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); });
      geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose());
      owned.textures.forEach(t => t.dispose());
      pmrem.dispose();
      roomEnv.traverse?.(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
    };
    if (disposed) teardown();
  }

  return () => {
    if (disposed) return;
    disposed = true;
    ac.abort();
    try { teardown(); } catch { /* already gone */ }
    if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
    root.innerHTML = '';
  };
}
