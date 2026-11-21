// "Digital Garden — ideas grow" — world `garden` (World 10).
// A living procedural garden in Three.js that grows with the scroll: a seed falls into the soil,
// a tree grows branch by branch, grass spreads, flowers open, and the day turns from dawn through
// spring, summer and autumn into a bioluminescent night. Three giant blossoms hold the projects.
// The pointer is a breeze (plants bend away, fireflies gather); clicking the ground plants a seed.
import * as THREE from 'three';
import { projects, profileURL } from '../content.js?v=ten-worlds-1';

const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs'
};
const ART = { vrm: 'art/vrm.jpg', pixelle: 'art/glass.jpg', motion: 'art/orbit.jpg' };
const ROMAN = ['I', 'II', 'III'];
const TRACK_VH = 1100;

// Giant project blossoms: ground position, head height, palette, scroll window [a, b]
const GIANTS = [
  { x: -9.5, z: 4.5, h: 5.2, outer: '#9be15d', glow: '#b8ff7a', win: [0.255, 0.315], latin: 'Humanus vocalis', season: 'SPRING' },
  { x: 10.5, z: -1.5, h: 6.2, outer: '#38e0b0', glow: '#5fffd6', win: [0.445, 0.505], latin: 'Pipeline luminosa', season: 'SUMMER' },
  { x: -2.5, z: -12.5, h: 5.7, outer: '#ffc35e', glow: '#ffd98a', win: [0.64, 0.70], latin: 'Mundi decem', season: 'AUTUMN' }
];
const VINES = [
  { id: 'v1', win: [0.075, 0.185], lines: [['Every idea'], ['starts as a', '*seed.']], ko: '작은 코드 한 줄이 뿌리가 됩니다.' },
  { id: 'v2', win: [0.335, 0.415], lines: [['Summer is'], ['for', '*building.']], ko: '햇볕 아래, 가지가 사방으로 뻗어 나갑니다.' },
  { id: 'v3', win: [0.53, 0.615], lines: [['Let the old'], ['leaves', '*fall.']], ko: '다듬고 덜어내며 더 단단해집니다.' },
  { id: 'v4', win: [0.745, 0.865], lines: [['At night,'], ['the garden', '*glows.']], ko: '어둠 속에서도 아이디어는 스스로 빛납니다.' }
];
const STOPS = [
  { p: 0, en: 'Seed', ko: '씨앗' }, { p: 0.12, en: 'Spring', ko: '봄' }, { p: 0.38, en: 'Summer', ko: '여름' },
  { p: 0.57, en: 'Autumn', ko: '가을' }, { p: 0.8, en: 'Night', ko: '밤' }
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const splitName = name => { const w = name.split(' '); const last = w.pop(); return `${esc(w.join(' '))} <em>${esc(last)}</em>`; };

/* ------------------------------------------------------------------ markup */

// Kinetic "vine" letters: words → letters with --i; '*' prefix = italic accent word.
function vineType(lines) {
  let i = 0;
  const html = lines.map(words => `<span class="gd-line">${words.map(w => {
    const em = w.startsWith('*'), word = em ? w.slice(1) : w;
    const chars = [...word].map(ch => `<span class="gd-ch" style="--i:${i++}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
    return em ? `<em class="gd-w">${chars}</em>` : `<span class="gd-w">${chars}</span>`;
  }).join('<span class="gd-sp"></span>')}</span>`).join('');
  return { html, n: i };
}
const vineSVG = () => `<svg class="gd-vine-svg" viewBox="0 0 600 70" preserveAspectRatio="none" aria-hidden="true">
  <path pathLength="1" d="M4 52 C70 52 90 18 150 30 S240 64 300 40 S400 6 460 26 S560 50 596 22"/>
  <g class="gd-vleaf" style="--k:.25"><ellipse cx="150" cy="22" rx="12" ry="5" transform="rotate(-35 150 22)"/></g>
  <g class="gd-vleaf" style="--k:.5"><ellipse cx="300" cy="50" rx="12" ry="5" transform="rotate(30 300 50)"/></g>
  <g class="gd-vleaf" style="--k:.75"><ellipse cx="460" cy="16" rx="12" ry="5" transform="rotate(-25 460 16)"/></g>
  <circle class="gd-vbud" cx="596" cy="22" r="5"/>
</svg>`;

function liveMarkup() {
  const intro = vineType([['Ideas grow'], ['in', '*public.']]);
  const fin = vineType([["Let's plant"], ['the next', '*idea.']]);
  const vines = VINES.map(v => {
    const t = vineType(v.lines);
    return `<section class="gd-vine" data-vine="${v.id}" style="--n:${t.n}" aria-hidden="true">
      <h2 class="gd-vine-title">${t.html}</h2>${vineSVG()}<p class="gd-vine-ko">${esc(v.ko)}</p></section>`;
  }).join('');
  const cards = projects.map((p, i) => `
    <article class="gd-card" data-card="${i}" style="--c:${GIANTS[i].outer}" aria-hidden="true" inert>
      <header class="gd-card-head"><span>BLOSSOM ${ROMAN[i]} · 0${i + 1}</span><span>${esc(p.category)}</span></header>
      <p class="gd-card-latin"><i>${esc(GIANTS[i].latin)}</i> — fig. ${i + 1}</p>
      <h2 class="gd-card-title">${splitName(p.name)}</h2>
      <p class="gd-card-desc">${esc(p.description)}</p>
      <p class="gd-card-body">${esc(p.body)}</p>
      <ul class="gd-chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <a class="gd-card-link" href="${esc(p.url)}" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a>
    </article>`).join('');
  const stops = STOPS.map((s, i) => `<li data-s="${i}"><button type="button" data-go="${s.p}" aria-label="${esc(s.ko)}(${esc(s.en)})로 이동"><i></i><span>${esc(s.en)}<small>${esc(s.ko)}</small></span></button></li>`).join('');
  return `
  <div class="gd" data-no-kx>
    <canvas class="gd-canvas" aria-hidden="true"></canvas>
    <div class="gd-veil" aria-hidden="true"></div>
    <svg class="gd-leaders" aria-hidden="true"><path class="gd-leader" d=""/><circle class="gd-leader-dot" r="4" cx="-20" cy="-20"/></svg>
    <div class="gd-ui">
      <section class="gd-intro" style="--n:${intro.n}">
        <p class="gd-eyebrow"><span>WORLD 10</span><i></i><span>A DIGITAL GARDEN</span></p>
        <h1 class="gd-title" aria-label="Ideas grow in public.">${intro.html}</h1>
        ${vineSVG()}
        <p class="gd-sub">스크롤하면 씨앗이 떨어지고, 정원이 자랍니다.<br>새벽에서 밤까지 — 세 송이의 작업이 피어납니다.</p>
        <div class="gd-hint"><span>SCROLL TO GROW</span><i></i></div>
      </section>
      ${vines}
      ${cards}
      <section class="gd-finale" style="--n:${fin.n}" aria-hidden="true" inert>
        <p class="gd-eyebrow"><span>FIN</span><i></i><span>THE GARDEN AT NIGHT</span></p>
        <h2 class="gd-fin-title" aria-label="Let's plant the next idea.">${fin.html}</h2>
        <p class="gd-sub">모든 정원은 씨앗 하나에서 시작합니다.<br>다음 아이디어는 GitHub에서 함께 심어요.</p>
        <p class="gd-fin-count" aria-live="polite"></p>
        <div class="gd-fin-actions"><a class="gd-btn gd-btn--bloom" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 더 보기 <span aria-hidden="true">↗</span></a><button type="button" class="gd-btn" data-top>처음으로 <span aria-hidden="true">↑</span></button></div>
      </section>
      <div class="gd-clock" aria-hidden="true"><b class="gd-clock-time">05:30</b><span class="gd-clock-season">DAWN · 새벽</span><i class="gd-clock-bar"><b></b></i></div>
      <nav class="gd-seasons" aria-label="정원의 계절"><ol>${stops}</ol></nav>
      <p class="gd-plant-hint" aria-live="polite"><span class="gd-plant-dot"></span><span class="gd-plant-text">땅을 클릭해 씨앗을 심어 보세요</span></p>
      <p class="gd-loading" aria-live="polite">정원에 물을 주는 중…</p>
    </div>
    <div class="gd-track" style="height:${TRACK_VH}vh"></div>
  </div>`;
}

const SPRIG = i => {
  const leaves = [[38, 150, -40], [62, 118, 35], [36, 92, -30], [64, 64, 40]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="6" transform="rotate(${r} ${x} ${y})"/>`).join('');
  return `<svg class="gds-sprig" viewBox="0 0 100 200" aria-hidden="true"><path d="M50 198 C46 150 56 110 50 40"/>${leaves}<circle cx="50" cy="32" r="${10 + i * 2}"/></svg>`;
};
function staticMarkup() {
  return `
  <div class="gd gd--static" data-no-kx>
    <header class="gds-intro">
      <p class="gd-eyebrow"><span>WORLD 10</span><i></i><span>A DIGITAL GARDEN</span></p>
      <h1 class="gds-title">Ideas grow <em>in public.</em></h1>
      <p class="gd-sub">세 송이의 작업을 식물 도감처럼 기록했습니다.</p>
    </header>
    <ol class="gds-list">
      ${projects.map((p, i) => `
      <li class="gds-plate" style="--c:${GIANTS[i].outer}">
        <p class="gds-plate-no">PLATE ${ROMAN[i]}</p>
        <figure class="gds-fig">${SPRIG(i)}<div class="gds-disc"><img src="${ART[p.id] || 'art/orbit.jpg'}" alt="${esc(p.name)} 대표 이미지" loading="lazy" decoding="async"></div>
          <figcaption><i>${esc(GIANTS[i].latin)}</i> — fig. ${i + 1}</figcaption></figure>
        <div class="gds-cap">
          <span class="gds-cat">${esc(p.category)}</span>
          <h2 class="gd-card-title">${splitName(p.name)}</h2>
          <p class="gd-card-desc">${esc(p.description)}</p>
          <p class="gd-card-body">${esc(p.body)}</p>
          <ul class="gd-chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          <a class="gd-card-link" href="${esc(p.url)}" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a>
        </div>
      </li>`).join('')}
    </ol>
    <footer class="gds-fin">
      <h2 class="gds-title">Let's plant <em>the next idea.</em></h2>
      <a class="gd-btn gd-btn--bloom" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 더 보기 <span aria-hidden="true">↗</span></a>
    </footer>
  </div>`;
}

/* ------------------------------------------------------- canvas textures */

function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function glowTexture() {
  const c = cnv(128, 128), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(255,255,255,.6)'); gr.addColorStop(.55, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function shaftTexture() {
  const c = cnv(128, 512), g = c.getContext('2d');
  const h = g.createLinearGradient(0, 0, 128, 0);
  h.addColorStop(0, 'rgba(255,255,255,0)'); h.addColorStop(.5, 'rgba(255,255,255,1)'); h.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = h; g.fillRect(0, 0, 128, 512);
  g.globalCompositeOperation = 'destination-in';
  const v = g.createLinearGradient(0, 0, 0, 512);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.15, 'rgba(0,0,0,1)'); v.addColorStop(.6, 'rgba(0,0,0,.5)'); v.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = v; g.fillRect(0, 0, 128, 512);
  return new THREE.CanvasTexture(c);
}
function fallbackArt(i) {
  const c = cnv(512, 512), g = c.getContext('2d');
  const gr = g.createRadialGradient(256, 256, 20, 256, 256, 300);
  gr.addColorStop(0, '#f6fff0'); gr.addColorStop(1, GIANTS[i].outer);
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  return c;
}

/* ------------------------------------------------------------ geometry */

// A tapered tube along points; every ring stores its spine point and birth time (for growth).
function pushTube(out, pts, r0, r1, t0, t1, radial) {
  const n = pts.length, base = out.pos.length / 3;
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), d = new THREE.Vector3();
  T.subVectors(pts[1], pts[0]).normalize();
  N.set(0, 0, 1); if (Math.abs(T.z) > .9) N.set(1, 0, 0);
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.subVectors(b, a).normalize();
    N.addScaledVector(T, -N.dot(T)).normalize();
    B.crossVectors(T, N);
    const s = i / (n - 1), r = r0 + (r1 - r0) * Math.pow(s, .9), t = t0 + (t1 - t0) * s, P = pts[i];
    for (let j = 0; j <= radial; j++) {
      const ang = j / radial * Math.PI * 2;
      d.copy(N).multiplyScalar(Math.cos(ang)).addScaledVector(B, Math.sin(ang));
      out.pos.push(P.x + d.x * r, P.y + d.y * r, P.z + d.z * r);
      out.nor.push(d.x, d.y, d.z);
      out.spine.push(P.x, P.y, P.z);
      out.t.push(t);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = base + i * (radial + 1) + j, b = a + radial + 1;
    out.idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
}
const newTubeOut = () => ({ pos: [], nor: [], spine: [], t: [], idx: [] });
function tubeGeometry(out) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(out.nor, 3));
  g.setAttribute('aSpine', new THREE.Float32BufferAttribute(out.spine, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(out.t, 1));
  g.setIndex(out.idx);
  g.computeBoundingSphere();
  return g;
}

// Stochastic L-system-like tree. Times are raw (per unit length) and remapped afterwards.
function growTree({ origin, trunkLen, r0, maxDepth, kids, leafPer, leafScale = 1 }) {
  const tube = newTubeOut(), leaves = [];
  const up = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3(), axis = new THREE.Vector3(), q = new THREE.Quaternion();
  let maxT = 0, phyllo = Math.random() * 6;
  const branch = (start, dir, len, rad, depth, t0) => {
    const segs = depth === 0 ? 12 : depth < 3 ? 7 : 5, step = len / segs;
    const pts = [start.clone()], d = dir.clone(), p = start.clone();
    for (let i = 1; i <= segs; i++) {
      d.x += rand(-.16, .16) * (depth + 1) * .5; d.z += rand(-.16, .16) * (depth + 1) * .5;
      d.y += depth < 2 ? .05 : depth > 3 ? -.04 : .01;
      d.normalize(); p.addScaledVector(d, step); pts.push(p.clone());
    }
    const dur = len * (depth === 0 ? .05 : depth === 1 ? .07 : .09), t1 = t0 + dur;
    const r1 = depth >= maxDepth ? rad * .2 : rad * .5;
    maxT = Math.max(maxT, t1);
    pushTube(tube, pts, rad, r1, t0, t1, depth === 0 ? 10 : depth < 3 ? 7 : 5);
    const at = f => { const x = f * segs, i = Math.min(segs - 1, Math.floor(x)); return tmp.copy(pts[i]).lerp(pts[i + 1], x - i).clone(); };
    if (depth >= maxDepth - 1 && leafPer) {
      const count = depth >= maxDepth ? leafPer : Math.ceil(leafPer * .6);
      for (let k = 0; k < count; k++) {
        const f = .25 + .75 * (k + Math.random() * .6) / count, P = at(f);
        leaves.push({ p: P, dir: d.clone(), t: t0 + dur * f + .02, s: rand(.7, 1.25) * leafScale });
      }
    }
    if (depth >= maxDepth) return;
    const n = kids[depth] + (Math.random() < .35 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const f = depth === 0 ? .5 + .5 * (k + rand(.1, .9)) / n : .3 + .65 * (k + Math.random()) / n;
      const P = at(f);
      phyllo += 2.39996;
      axis.set(Math.cos(phyllo), 0, Math.sin(phyllo));
      const cd = dir.clone();
      tmp.crossVectors(cd, axis); if (tmp.lengthSq() < 1e-4) tmp.set(1, 0, 0);
      q.setFromAxisAngle(tmp.normalize(), rand(.45, .95) * (depth === 0 ? 1 : 1.1));
      cd.applyQuaternion(q);
      cd.y = Math.max(cd.y, depth < 2 ? .15 : -.3); cd.normalize();
      const cr = (rad + (rad * .5 - rad) * f) * rand(.62, .78);
      branch(P, cd, len * rand(.6, .76), cr, depth + 1, t0 + dur * f);
    }
  };
  branch(origin.clone().add(new THREE.Vector3(0, -.25, 0)), up.clone().add(new THREE.Vector3(rand(-.08, .08), 0, rand(-.08, .08))).normalize(), trunkLen, r0, 0, 0);
  return { tube, leaves, maxT };
}
function remapTimes(tree, a, b) {
  const k = (b - a) / tree.maxT;
  for (let i = 0; i < tree.tube.t.length; i++) tree.tube.t[i] = a + tree.tube.t[i] * k;
  tree.leaves.forEach(l => { l.t = a + l.t * k; });
}
function mergeTubes(list) {
  const out = newTubeOut();
  for (const t of list) {
    const off = out.pos.length / 3;
    out.pos.push(...t.pos); out.nor.push(...t.nor); out.spine.push(...t.spine); out.t.push(...t.t);
    for (const i of t.idx) out.idx.push(i + off);
  }
  return out;
}

function leafGeometry() {
  const L = .46, rows = 8, pos = [], idx = [];
  for (let r = 0; r <= rows; r++) {
    const v = r / rows, w = L * .23 * Math.sin(Math.PI * Math.pow(v, .78));
    for (const u of [-1, 0, 1]) pos.push(u * w, v * L, Math.abs(u) * w * .45 + v * v * L * .18);
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++) { const a = r * 3 + c, b = a + 3; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Flower: petals in petal-space + stem ribbons + center. aP = (angleY, openAngle, closedAngle, kind)
function flowerGeometry(layers, { stem = true, center = .12 } = {}) {
  const pos = [], ap = [], uv = [], idx = [];
  const nx = 4, ny = 7;
  layers.forEach((L, li) => {
    for (let k = 0; k < L.n; k++) {
      const ay = k / L.n * Math.PI * 2 + li * .37, base = pos.length / 3;
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const v = j / ny, u = i / nx * 2 - 1;
        const w = L.wid * Math.pow(Math.sin(Math.PI * Math.pow(v, .62)), .7) * (1 - .1 * v) + .004;
        pos.push(u * w, v * L.len, -u * u * w * .55 + v * v * L.len * .2);
        ap.push(ay, L.open, L.closed, 1); uv.push(u * .5 + .5, v);
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = base + j * (nx + 1) + i, b = a + nx + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    }
  });
  if (center) {
    const base = pos.length / 3, seg = 12;
    pos.push(0, center * .55, 0); ap.push(0, 0, 0, 2); uv.push(.5, 0);
    for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; pos.push(Math.cos(a) * center, center * .1, Math.sin(a) * center); ap.push(0, 0, 0, 2); uv.push(.5, 1); }
    for (let i = 0; i < seg; i++) idx.push(base, base + i + 2, base + i + 1);
  }
  if (stem) {
    for (const rot of [0, Math.PI / 2]) {
      const base = pos.length / 3, c = Math.cos(rot), s = Math.sin(rot);
      for (let j = 0; j <= 4; j++) for (const u of [-1, 1]) { pos.push(u * .012 * c, j / 4, u * .012 * s); ap.push(0, 0, 0, 0); uv.push(u * .5 + .5, j / 4); }
      for (let j = 0; j < 4; j++) { const a = base + j * 2; idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); }
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(ap, 4));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/* ----------------------------------------------------------------- shaders */

const WIND = /* glsl */`
uniform float uTime; uniform vec3 uWindPos; uniform float uWindAmt; uniform float uWindR; uniform float uGust;
vec3 windOffset(vec3 wp, float flex){
  float s = sin(uTime*1.1 + wp.x*.31 + wp.z*.23) + .5*sin(uTime*2.3 + wp.x*.9 - wp.z*.6);
  vec3 off = vec3(.7, 0., .35) * s * (.05 + .09*uGust);
  vec2 d = wp.xz - uWindPos.xz;
  float d2 = dot(d, d);
  float push = uWindAmt * exp(-d2 / (uWindR*uWindR));
  off.xz += d / sqrt(d2 + .05) * push;
  return off * flex;
}`;
const FOG_U = 'uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform vec3 uAmb; uniform vec3 uSun; uniform float uNight;';
const OUT = '#include <tonemapping_fragment>\n#include <colorspace_fragment>';

const GRASS_VS = /* glsl */`
${WIND}
attribute vec4 aOff; attribute vec4 aRnd;
uniform float uGrass;
varying float vT; varying float vHue; varying float vFog; varying float vShade;
void main(){
  float t = position.y;
  float g = clamp((uGrass - aRnd.y) / .08, 0., 1.);
  float h = aOff.z * g * g * (3. - 2. * g);
  vec3 p = vec3(position.x * aOff.w * (1. - t * .88), t * h, 0.);
  float c = cos(aRnd.x), s = sin(aRnd.x);
  p = vec3(p.x * c, p.y, -p.x * s);
  vec3 base = vec3(aOff.x, 0., aOff.y);
  vec3 wp = base + p;
  vec3 w = windOffset(base, 1.);
  vec2 lean = vec2(cos(aRnd.z * 6.283), sin(aRnd.z * 6.283)) * .3 * h;
  vec2 o = (w.xz * 2.4 * h + lean) * t * t;
  float ol = length(o), mx = h * .85;
  if (ol > mx) { o *= mx / ol; ol = mx; }
  wp.xz += o; wp.y -= ol * .5 * t;
  vec4 mv = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mv;
  vT = t; vHue = aRnd.w; vFog = -mv.z; vShade = .72 + .28 * fract(aRnd.z * 37.1);
}`;
const GRASS_FS = /* glsl */`
${FOG_U}
uniform vec3 uBase; uniform vec3 uTip; uniform vec3 uDry; uniform float uDryAmt; uniform vec3 uGlow;
varying float vT; varying float vHue; varying float vFog; varying float vShade;
void main(){
  vec3 col = mix(uBase, uTip, vT) * vShade;
  col = mix(col, uDry * vShade, smoothstep(.35, 1., vHue) * uDryAmt);
  vec3 lit = col * (uAmb + uSun * (.25 + .75 * vT));
  lit += uGlow * uNight * pow(vT, 4.) * step(.86, vHue) * 1.6;
  gl_FragColor = vec4(mix(lit, uFogColor, smoothstep(uFogNear, uFogFar, vFog)), 1.);
  ${OUT}
}`;

const FLOWER_VS = /* glsl */`
${WIND}
attribute vec4 aP; attribute vec4 aI; attribute vec4 aJ;
uniform float uBloomT; uniform float uFlex;
varying vec2 vUv; varying float vHue; varying float vKind; varying float vFog; varying float vBloom;
vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y*c - p.z*s, p.y*s + p.z*c); }
vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x*c + p.z*s, p.y, -p.x*s + p.z*c); }
void main(){
  float grow = clamp((uBloomT - aJ.y + .07) / .07, 0., 1.);
  float bloom = clamp((uBloomT - aJ.y) / .09, 0., 1.);
  bloom = bloom * bloom * (3. - 2. * bloom);
  float stemH = aI.z * grow;
  float kind = aP.w;
  vec3 p;
  if (kind < .5) p = vec3(position.x, position.y * stemH, position.z);
  else if (kind < 1.5) {
    float a = mix(aP.z, aP.y, bloom) + sin(uTime * 1.7 + aJ.w * 9. + aP.x * 3.) * .04 * bloom;
    vec3 q = position * aI.w * (.3 + .7 * grow);
    p = vec3(0., stemH, 0.) + rotY(rotX(q, a), aP.x);
  } else p = vec3(0., stemH, 0.) + position * aI.w * bloom;
  p = rotY(p, aJ.x) + vec3(aI.x, 0., aI.y);
  vec4 wp = modelMatrix * vec4(p, 1.);
  float hk = clamp((p.y) / max(aI.z, .3), 0., 1.4);
  wp.xyz += windOffset(wp.xyz, hk * hk * uFlex);
  vec4 mv = viewMatrix * wp;
  gl_Position = projectionMatrix * mv;
  vUv = uv; vHue = aJ.z; vKind = kind; vFog = -mv.z; vBloom = bloom;
}`;
const FLOWER_FS = /* glsl */`
${FOG_U}
uniform vec3 uInner; uniform vec3 uOutA; uniform vec3 uOutB; uniform vec3 uOutC; uniform vec3 uStem; uniform vec3 uCenter; uniform vec3 uGlowC; uniform float uGlowK;
varying vec2 vUv; varying float vHue; varying float vKind; varying float vFog; varying float vBloom;
void main(){
  vec3 outer = vHue < .34 ? uOutA : vHue < .67 ? uOutB : uOutC;
  vec3 col; float glow = 0.;
  if (vKind < .5) col = uStem * (.6 + .4 * vUv.y);
  else if (vKind < 1.5) {
    col = mix(uInner, outer, smoothstep(.05, .85, vUv.y));
    col *= .82 + .18 * (1. - abs(vUv.x - .5) * 2.);
    col += .08 * sin(vUv.x * 40.) * vUv.y;
    glow = (.35 + vUv.y * .9) * vBloom;
  } else { col = uCenter; glow = vBloom * 1.4; }
  vec3 lit = col * (uAmb * 1.15 + uSun * .85);
  lit += mix(uGlowC, outer, .25) * glow * uNight * uGlowK;
  gl_FragColor = vec4(mix(lit, uFogColor, smoothstep(uFogNear, uFogFar, vFog)), 1.);
  ${OUT}
}`;

const GROUND_VS = /* glsl */`
varying vec3 vW; varying float vFog;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vFog = -mv.z; gl_Position = projectionMatrix * mv; }`;
const GROUND_FS = /* glsl */`
${FOG_U}
uniform float uCover; uniform vec3 uSoil; uniform vec3 uMoss; uniform vec3 uLitter; uniform float uLitterAmt; uniform float uSeedGlow; uniform vec3 uGlow;
varying vec3 vW; varying float vFog;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y); }
void main(){
  float d = length(vW.xz);
  float n = noise(vW.xz * .35) * .6 + noise(vW.xz * 1.7) * .4;
  float m = 1. - smoothstep(uCover - 2.5, uCover + 1., d + n * 3.5);
  vec3 col = mix(mix(uSoil * .6, uSoil, n), mix(uMoss * .65, uMoss, n), m);
  float lit = step(.55, noise(vW.xz * 2.6 + 3.)) * smoothstep(10., 2.5, d + n * 2.);
  col = mix(col, uLitter * (.65 + .7 * noise(vW.xz * 6.)), lit * uLitterAmt);
  vec3 c = col * (uAmb * 1.5 + uSun * 1.1);
  c += uGlow * uSeedGlow * exp(-d * d * 1.6);
  c += uGlow * uNight * .05 * m * noise(vW.xz * .8 + uNight);
  gl_FragColor = vec4(mix(c, uFogColor, smoothstep(uFogNear, uFogFar, vFog)), 1.);
  ${OUT}
}`;

const SKY_VS = /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`;
const SKY_FS = /* glsl */`
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uNight;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.);
  vec3 c = mix(uHorizon, uTop, pow(smoothstep(0., .6, h), .5));
  float s = max(dot(d, normalize(uSunDir)), 0.);
  c += uSunCol * (pow(s, 600.) * 6. + pow(s, 24.) * .35 + pow(s, 4.) * .12) * (1. - uNight * .6);
  if (d.y < 0.) c = uHorizon;
  gl_FragColor = vec4(c, 1.);
  ${OUT}
}`;

const POINTS_VS = /* glsl */`
attribute float aSeed;
uniform float uSize; uniform float uScale; uniform float uTime; uniform float uBlink;
varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  float b = mix(1., .25 + .75 * pow(.5 + .5 * sin(uTime * 2.3 + aSeed * 31.), 3.), uBlink);
  gl_PointSize = clamp(uSize * (.55 + .9 * fract(aSeed * 7.13)) * uScale / max(-mv.z, .1), 0., 40.);
  vA = b * smoothstep(.2, 1.4, -mv.z);
}`;
const POINTS_FS = /* glsl */`
uniform vec3 uColor; uniform float uAlpha;
varying float vA;
void main(){
  float d = length(gl_PointCoord - .5);
  if (d > .5) discard;
  float a = smoothstep(.5, 0., d); a *= a;
  gl_FragColor = vec4(uColor * (1. + 2. * smoothstep(.12, 0., d)), a * vA * uAlpha);
  #include <colorspace_fragment>
}`;

/* ------------------------------------------------------- time of day keys */

const SKY_KEYS = [
  { p: 0, top: '#1d2747', hor: '#f0a986', sun: '#ffae78', si: 1.6, el: .06, hs: '#a8b4d8', hg: '#4a3628', hi: 1.0, night: .12, fn: 14, ff: 70, exp: 1.0 },
  { p: .16, top: '#4f9be0', hor: '#e4f0d4', sun: '#fff0cf', si: 2.6, el: .5, hs: '#cfe4ff', hg: '#4a5a2a', hi: 1.0, night: 0, fn: 22, ff: 95, exp: 1.0 },
  { p: .4, top: '#2a7fd2', hor: '#cde9ee', sun: '#fff8ea', si: 3.1, el: .85, hs: '#d8ecff', hg: '#4d6a2c', hi: 1.05, night: 0, fn: 24, ff: 100, exp: 1.0 },
  { p: .6, top: '#41598f', hor: '#f3aa68', sun: '#ffa45a', si: 2.5, el: .22, hs: '#f2c8a0', hg: '#4a3020', hi: .85, night: 0, fn: 18, ff: 85, exp: 1.05 },
  { p: .73, top: '#1b1838', hor: '#c06478', sun: '#ff7562', si: 1.1, el: .03, hs: '#7a6cb0', hg: '#221a2a', hi: .55, night: .45, fn: 12, ff: 70, exp: 1.1 },
  { p: .83, top: '#02040b', hor: '#0b1a2b', sun: '#88a6ff', si: .55, el: .55, hs: '#2a3c6a', hg: '#06090c', hi: .45, night: 1, fn: 10, ff: 62, exp: 1.25 },
  { p: 1, top: '#010209', hor: '#0a1828', sun: '#88a6ff', si: .5, el: .6, hs: '#283a66', hg: '#05080a', hi: .42, night: 1, fn: 16, ff: 90, exp: 1.25 }
].map(k => ({ ...k, top: new THREE.Color(k.top), hor: new THREE.Color(k.hor), sun: new THREE.Color(k.sun), hs: new THREE.Color(k.hs), hg: new THREE.Color(k.hg) }));

/* ------------------------------------------------------------------- mount */

export function mount(root, { isPaused = () => false } = {}) {
  let disposed = false;
  const ac = new AbortController(), signal = ac.signal;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let teardown = () => {};
  const goStatic = () => { root.innerHTML = staticMarkup(); };
  if (reduce) { goStatic(); return () => { disposed = true; ac.abort(); root.innerHTML = ''; }; }

  root.innerHTML = liveMarkup();
  const el = root.querySelector('.gd');
  const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
  const canvas = $('.gd-canvas');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch {
    renderer = null; goStatic();
    return () => { disposed = true; ac.abort(); root.innerHTML = ''; };
  }

  init().catch(err => {
    console.warn('[garden] falling back to static plates', err);
    if (!disposed) { try { teardown(); } catch { /* ok */ } goStatic(); }
  });

  async function init() {
    const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    const loadImg = src => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const libsP = Promise.all([import(LIBS.gsap), import(LIBS.st), import(LIBS.lenis)]).catch(() => null);
    const [images, libs] = await Promise.all([Promise.all(projects.map(p => loadImg(ART[p.id] || 'art/orbit.jpg'))), libsP]);
    if (disposed) return;

    /* ---------------- renderer / scene */
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#e4f0d4', 20, 90);
    const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, .05, 400);
    const owned = { textures: [], geos: [], mats: [] };
    const tex = t => { owned.textures.push(t); return t; };
    const glowMap = tex(glowTexture()), shaftMap = tex(shaftTexture());

    const hemi = new THREE.HemisphereLight('#cfe4ff', '#4a5a2a', 1);
    const sun = new THREE.DirectionalLight('#fff0cf', 2.6);
    scene.add(hemi, sun, sun.target);

    // shared uniforms (same objects referenced by every material)
    const U = {
      uTime: { value: 0 }, uWindPos: { value: new THREE.Vector3(0, 0, 999) }, uWindAmt: { value: 0 }, uWindR: { value: 3.2 }, uGust: { value: .4 },
      uFogColor: { value: new THREE.Color() }, uFogNear: { value: 20 }, uFogFar: { value: 90 },
      uAmb: { value: new THREE.Color() }, uSun: { value: new THREE.Color() }, uNight: { value: 0 }, uGlow: { value: new THREE.Color('#7dffc9') }
    };
    const shared = ['uTime', 'uWindPos', 'uWindAmt', 'uWindR', 'uGust'];

    /* ---------------- sky + stars */
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, .5, -1) }, uSunCol: { value: new THREE.Color() }, uNight: U.uNight },
      vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

    const mkPoints = (n, fill, opts) => {
      const pos = new Float32Array(n * 3), seed = new Float32Array(n);
      for (let i = 0; i < n; i++) { fill(pos, i); seed[i] = Math.random(); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uSize: { value: opts.size }, uScale: { value: 800 }, uTime: U.uTime, uBlink: { value: opts.blink ?? 0 }, uColor: { value: new THREE.Color(opts.color) }, uAlpha: { value: 0 } },
        vertexShader: POINTS_VS, fragmentShader: POINTS_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
      });
      const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
      return pts;
    };
    const stars = mkPoints(coarse ? 900 : 1800, (a, i) => {
      const th = Math.random() * Math.PI * 2, y = Math.pow(Math.random(), .7) * .95 + .04, r = Math.sqrt(1 - y * y);
      a[i * 3] = Math.cos(th) * r * 250; a[i * 3 + 1] = y * 250; a[i * 3 + 2] = Math.sin(th) * r * 250;
    }, { size: 1.6, color: '#dfe8ff', blink: .6 });
    stars.renderOrder = -9;

    /* ---------------- ground + distant hills */
    const groundMat = new THREE.ShaderMaterial({
      uniforms: { ...pick(U, ['uFogColor', 'uFogNear', 'uFogFar', 'uAmb', 'uSun', 'uNight', 'uGlow']), uCover: { value: 0 }, uSoil: { value: new THREE.Color('#5e4129') }, uMoss: { value: new THREE.Color('#3f6a2a') }, uLitter: { value: new THREE.Color('#b0562a') }, uLitterAmt: { value: 0 }, uSeedGlow: { value: 0 } },
      vertexShader: GROUND_VS, fragmentShader: GROUND_FS
    });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 96), groundMat); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    {
      const seg = 160, pos = [], idx = [];
      for (let i = 0; i <= seg; i++) {
        const a = i / seg * Math.PI * 2, r = 92 + Math.sin(a * 3) * 6;
        const h = 6 + Math.sin(a * 5 + 1) * 4 + Math.sin(a * 11) * 2 + Math.sin(a * 23) * .8;
        pos.push(Math.cos(a) * r, -1, Math.sin(a) * r, Math.cos(a) * r, h, Math.sin(a) * r);
      }
      for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#2b4628', roughness: 1, side: THREE.DoubleSide })));
    }

    /* ---------------- bark material (growth + wind via onBeforeCompile) */
    const makeBark = (grow, flexH, color = '#4a3326') => {
      const m = new THREE.MeshStandardMaterial({ color, roughness: .92, metalness: 0 });
      m.userData.grow = grow;
      m.onBeforeCompile = sh => {
        shared.forEach(k => { sh.uniforms[k] = U[k]; });
        sh.uniforms.uGrow = grow; sh.uniforms.uFlexH = { value: flexH };
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>\n${WIND}\nattribute vec3 aSpine; attribute float aT; uniform float uGrow; uniform float uFlexH;`)
          .replace('#include <begin_vertex>', `
            float gr = clamp((uGrow - aT) / .03, 0., 1.);
            float thick = mix(.3, 1., clamp(uGrow * 1.25, 0., 1.));
            vec3 transformed = aSpine + (position - aSpine) * gr * thick;
            float fh = clamp(aSpine.y / uFlexH, 0., 1.6);
            transformed += windOffset(aSpine, fh * fh);`);
      };
      m.customProgramCacheKey = () => 'gd-bark';
      return m;
    };
    const makeLeafMat = (grow, fall) => {
      const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .7, side: THREE.DoubleSide });
      const lu = { uGrow: grow, uFall: fall, uLeafA: LEAF.a, uLeafB: LEAF.b, uTurn: LEAF.turn, uAutA: LEAF.autA, uAutB: LEAF.autB, uBrown: LEAF.brown };
      m.onBeforeCompile = sh => {
        shared.forEach(k => { sh.uniforms[k] = U[k]; });
        Object.assign(sh.uniforms, lu);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>\n${WIND}\nattribute vec4 aLeaf; uniform float uGrow; uniform float uFall; varying float vHue; varying float vFallen; varying float vSeed;
            mat3 rX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
            mat3 rY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
            mat3 rZ(float a){ float c=cos(a), s=sin(a); return mat3(c,s,0., -s,c,0., 0.,0.,1.); }`)
          .replace('#include <begin_vertex>', `
            float un = clamp((uGrow - aLeaf.x) / .05, 0., 1.);
            un = un * un * (3. - 2. * un);
            vec3 transformed = position * un;
            transformed.z += (1. - un) * un * position.y * 1.2;`)
          .replace('#include <project_vertex>', `
            vec3 B = instanceMatrix[3].xyz;
            mat3 IM = mat3(instanceMatrix);
            float sc = length(IM[0]);
            float f = clamp((uFall - aLeaf.y) / .28, 0., 1.);
            float fe = f * f * (3. - 2. * f);
            vec3 hang = IM * transformed;
            float sd = aLeaf.z * 6.283;
            mat3 R = rY(sd) * rX(mix(sin(f * 9. + sd) * 1.2, -1.5708, smoothstep(.86, 1., f))) * rZ(sin(f * 13. + sd) * .9 * (1. - f));
            vec3 drop = R * transformed * sc;
            vec3 local = mix(hang, drop, smoothstep(0., .08, f));
            vec3 wpos = B;
            vec2 drift = vec2(1., .45) * B.y * .55 * fe + vec2(sin(f * 7. + sd), cos(f * 5. + sd)) * 1.1 * sin(f * 3.1416);
            wpos.xz += drift;
            wpos.y = mix(B.y, .03 + aLeaf.w * .02, fe * fe * .35 + fe * .65);
            float fh = clamp(B.y / 10., 0., 1.5);
            wpos += windOffset(B, fh * fh * (1. - fe)) + vec3(sin(uTime * 3. + sd * 4.), 0., cos(uTime * 2.6 + sd * 3.)) * .025 * (1. - fe);
            vec4 mvPosition = modelViewMatrix * vec4(wpos + local, 1.);
            gl_Position = projectionMatrix * mvPosition;
            vHue = fract(aLeaf.z * 13.7); vFallen = fe; vSeed = aLeaf.z;`);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>\nuniform vec3 uLeafA; uniform vec3 uLeafB; uniform float uTurn; uniform vec3 uAutA; uniform vec3 uAutB; uniform vec3 uBrown; varying float vHue; varying float vFallen; varying float vSeed;`)
          .replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
            vec3 lc = mix(uLeafA, uLeafB, vHue);
            float tr = clamp((uTurn - vSeed) / .25, 0., 1.);
            lc = mix(lc, mix(uAutA, uAutB, vHue), tr);
            lc = mix(lc, uBrown, vFallen * .45);
            vec4 diffuseColor = vec4(lc, opacity);`);
      };
      m.customProgramCacheKey = () => 'gd-leaf';
      return m;
    };
    const LEAF = {
      a: { value: new THREE.Color() }, b: { value: new THREE.Color() }, turn: { value: 0 },
      autA: { value: new THREE.Color('#f5b434') }, autB: { value: new THREE.Color('#d5402a') }, brown: { value: new THREE.Color('#6e3c1c') }
    };
    const leafGeo = leafGeometry(); owned.geos.push(leafGeo);
    const buildLeaves = (list, mat, neverFall) => {
      const geo = leafGeo.clone();
      const n = list.length, data = new Float32Array(n * 4);
      const mesh = new THREE.InstancedMesh(geo, mat, n);
      const o = new THREE.Object3D(), Y = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
      list.forEach((l, i) => {
        dir.set(rand(-1, 1), rand(-.2, .9), rand(-1, 1)).addScaledVector(l.dir, .8).normalize();
        o.position.copy(l.p); o.quaternion.setFromUnitVectors(Y, dir);
        o.rotateY(rand(0, Math.PI * 2)); o.scale.setScalar(l.s); o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        data[i * 4] = l.t; data[i * 4 + 1] = neverFall || Math.random() < .06 ? 9 : Math.random() * .78; data[i * 4 + 2] = Math.random(); data[i * 4 + 3] = Math.random();
      });
      geo.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(data, 4));
      mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
      return mesh;
    };

    /* ---------------- the grove: one central tree + four younger trees */
    const treeGrow = { value: 0 }, leafFall = { value: 0 };
    const trees = [growTree({ origin: new THREE.Vector3(0, 0, 0), trunkLen: 4.3, r0: .38, maxDepth: coarse ? 4 : 5, kids: [4, 3, 3, 2, 2], leafPer: coarse ? 7 : 6 })];
    remapTimes(trees[0], 0, 1);
    [[-17, -16, .2], [19, -14, .3], [-22, 6, .35], [16, 15, .42], [4, -26, .3]].forEach(([x, z, a]) => {
      const t = growTree({ origin: new THREE.Vector3(x, 0, z), trunkLen: rand(2.4, 3.2), r0: .2, maxDepth: coarse ? 3 : 4, kids: [3, 3, 2, 2], leafPer: coarse ? 5 : 4, leafScale: 1.1 });
      remapTimes(t, a, Math.min(1, a + .75)); trees.push(t);
    });
    const barkMat = makeBark(treeGrow, 11);
    const barkGeo = tubeGeometry(mergeTubes(trees.map(t => t.tube)));
    scene.add(new THREE.Mesh(barkGeo, barkMat));
    const leafMat = makeLeafMat(treeGrow, leafFall);
    const leaves = buildLeaves(trees.flatMap(t => t.leaves), leafMat, false);
    scene.add(leaves);

    /* ---------------- grass */
    const grassN = coarse ? 7000 : 18000, GR = 30;
    const grassGeo = new THREE.InstancedBufferGeometry();
    {
      const pos = [], idx = [], rows = 6;
      for (let r = 0; r <= rows; r++) { const t = r / rows; pos.push(-.5, t, 0, .5, t, 0); }
      for (let r = 0; r < rows; r++) { const a = r * 2; idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); }
      grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); grassGeo.setIndex(idx);
      const off = new Float32Array(grassN * 4), rnd = new Float32Array(grassN * 4);
      for (let i = 0; i < grassN; i++) {
        const r = .7 + Math.pow(Math.random(), .62) * GR, a = Math.random() * Math.PI * 2;
        off[i * 4] = Math.cos(a) * r; off[i * 4 + 1] = Math.sin(a) * r; off[i * 4 + 2] = rand(.22, .62) * (r < 3 ? .7 : 1); off[i * 4 + 3] = rand(.05, .09);
        rnd[i * 4] = Math.random() * 6.28; rnd[i * 4 + 1] = Math.pow(r / GR, .85) * .82 + Math.random() * .06; rnd[i * 4 + 2] = Math.random(); rnd[i * 4 + 3] = Math.random();
      }
      grassGeo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
      grassGeo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
      grassGeo.instanceCount = grassN;
    }
    const grassMat = new THREE.ShaderMaterial({
      uniforms: { ...pick(U, [...shared, 'uFogColor', 'uFogNear', 'uFogFar', 'uAmb', 'uSun', 'uNight', 'uGlow']), uGrass: { value: 0 }, uBase: { value: new THREE.Color() }, uTip: { value: new THREE.Color() }, uDry: { value: new THREE.Color('#c99a4a') }, uDryAmt: { value: 0 } },
      vertexShader: GRASS_VS, fragmentShader: GRASS_FS, side: THREE.DoubleSide
    });
    const grass = new THREE.Mesh(grassGeo, grassMat); grass.frustumCulled = false; scene.add(grass);

    /* ---------------- meadow flowers + giant blossoms */
    const makeFlowerMat = (pal, flex) => new THREE.ShaderMaterial({
      uniforms: {
        ...pick(U, [...shared, 'uFogColor', 'uFogNear', 'uFogFar', 'uAmb', 'uSun', 'uNight']),
        uBloomT: { value: 0 }, uFlex: { value: flex },
        uInner: { value: new THREE.Color(pal.inner) }, uOutA: { value: new THREE.Color(pal.a) }, uOutB: { value: new THREE.Color(pal.b ?? pal.a) }, uOutC: { value: new THREE.Color(pal.c ?? pal.a) },
        uStem: { value: new THREE.Color('#3f7a2c') }, uCenter: { value: new THREE.Color(pal.center ?? '#ffd34d') }, uGlowC: { value: new THREE.Color(pal.glow) }, uGlowK: { value: pal.glowK ?? 1.4 }
      },
      vertexShader: FLOWER_VS, fragmentShader: FLOWER_FS, side: THREE.DoubleSide
    });
    const setInst = (geo, list) => {
      const I = new Float32Array(list.length * 4), J = new Float32Array(list.length * 4);
      list.forEach((f, i) => { I.set(f.I, i * 4); J.set(f.J, i * 4); });
      geo.setAttribute('aI', new THREE.InstancedBufferAttribute(I, 4));
      geo.setAttribute('aJ', new THREE.InstancedBufferAttribute(J, 4));
      geo.instanceCount = list.length;
    };
    const meadowGeo = flowerGeometry([{ n: 6, len: .2, wid: .085, open: 1.2, closed: .12 }, { n: 5, len: .13, wid: .06, open: .8, closed: .05 }], { center: .045 });
    const meadowN = coarse ? 300 : 650, meadowList = [], glowPos = [];
    for (let i = 0; i < meadowN; i++) {
      const r = 2.2 + Math.pow(Math.random(), .8) * 24, a = Math.random() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r, h = rand(.35, .85), s = rand(.6, 1.15);
      const birth = .12 + (r / 26) * .5 + Math.random() * .25;
      meadowList.push({ I: [x, z, h, s], J: [Math.random() * 6.28, birth, Math.random(), Math.random()] });
      glowPos.push(x, h + .04, z);
    }
    setInst(meadowGeo, meadowList);
    const meadowMat = makeFlowerMat({ inner: '#fff4e0', a: '#ff5d9e', b: '#8f6bff', c: '#ffd84a', glow: '#6dffd6', glowK: 1.8 }, .9);
    const meadow = new THREE.Mesh(meadowGeo, meadowMat); meadow.frustumCulled = false; scene.add(meadow);
    // night glow halos on every meadow flower
    const halos = mkPoints(meadowN, (a, i) => { a[i * 3] = glowPos[i * 3]; a[i * 3 + 1] = glowPos[i * 3 + 1]; a[i * 3 + 2] = glowPos[i * 3 + 2]; }, { size: .55, color: '#6dffd6', blink: .35 });

    const giantGeo = flowerGeometry([
      { n: 11, len: 1, wid: .3, open: 1.32, closed: .14 },
      { n: 9, len: .8, wid: .26, open: 1.0, closed: .1 },
      { n: 7, len: .55, wid: .2, open: .62, closed: .06 }
    ], { stem: false, center: .2 });
    setInst(giantGeo, [{ I: [0, 0, 0, 2.4], J: [0, 0, 0, 0] }]);
    const giants = GIANTS.map((G, i) => {
      const head = new THREE.Vector3(G.x, G.h, G.z);
      const stemGrow = { value: 0 };
      // a curved stem tube grown like the tree
      const pts = [];
      for (let k = 0; k <= 14; k++) { const s = k / 14; pts.push(new THREE.Vector3(G.x + Math.sin(s * 2.6 + i) * .45 * Math.sin(s * Math.PI), s * (G.h - .1), G.z + Math.cos(s * 2.1 + i) * .3 * Math.sin(s * Math.PI))); }
      const out = newTubeOut(); pushTube(out, pts, .16, .08, 0, 1, 8);
      const stemMat = makeBark(stemGrow, G.h * 5, '#3d6b2a');
      const stem = new THREE.Mesh(tubeGeometry(out), stemMat); scene.add(stem);
      // two broad leaves on the stem
      const sl = [.32, .55].map((f, k) => {
        const m = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: '#4e9a35', roughness: .65, side: THREE.DoubleSide }));
        const P = pts[Math.round(f * 14)]; m.position.copy(P);
        m.rotation.set(rand(-.3, .3), (k ? Math.PI : 0) + i, k ? 1.1 : -1.1); m.userData.s = 3.4 - k * .6; m.scale.setScalar(.001);
        scene.add(m); return m;
      });
      const mat = makeFlowerMat({ inner: '#f6fff0', a: G.outer, center: '#fff6c8', glow: G.glow, glowK: 1.1 }, .02);
      const flower = new THREE.Mesh(giantGeo, mat); flower.frustumCulled = false; flower.position.copy(head); scene.add(flower);
      // the project disc floating inside the petals
      const img = images[i];
      const t = tex(new THREE.CanvasTexture(img ? (() => { const c = cnv(512, 512), g = c.getContext('2d'); const s = Math.min(img.width, img.height); g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 512, 512); return c; })() : fallbackArt(i)));
      t.colorSpace = THREE.SRGBColorSpace;
      const discG = new THREE.Group(); discG.position.copy(head).add(new THREE.Vector3(0, 1.25, 0)); scene.add(discG);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6), new THREE.MeshBasicMaterial({ map: glowMap, color: G.glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
      halo.position.z = -.05; discG.add(halo);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.05, 64), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, toneMapped: false, fog: false }));
      discG.add(disc);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.14, 96), new THREE.MeshBasicMaterial({ color: G.glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
      discG.add(ring);
      const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.26, 1.27, 96, 1, 0, Math.PI * 1.4), ring.material);
      discG.add(ring2);
      return { G, i, head, stemGrow, sl, mat, flower, discG, disc, halo, ring, ring2, pts };
    });

    /* ---------------- seed, ripple, light shafts, fireflies */
    const seed = new THREE.Mesh(new THREE.SphereGeometry(.09, 24, 16), new THREE.MeshStandardMaterial({ color: '#7a5a2c', emissive: '#c9ff7a', emissiveIntensity: 1.6, roughness: .4 }));
    seed.scale.set(1, 1.35, 1); scene.add(seed);
    const seedGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: '#d6ff8a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    seedGlow.scale.setScalar(1.6); scene.add(seedGlow);
    const rippleMat = new THREE.MeshBasicMaterial({ color: '#d8ff9a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const rippleGeo = new THREE.RingGeometry(.94, 1, 96);
    const ripple = new THREE.Mesh(rippleGeo, rippleMat); ripple.rotation.x = -Math.PI / 2; ripple.position.y = .03; scene.add(ripple);

    const shaftMat = new THREE.MeshBasicMaterial({ map: shaftMap, color: '#fff2c8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
    const shafts = [[-2.5, 1.2, 3.2], [1.8, -.8, 2.4], [.3, 2.6, 4.2], [3.2, 1.8, 2.8]].map(([x, z, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 18), shaftMat); m.position.set(x, 7, z); m.renderOrder = 5; scene.add(m); return m;
    });

    const flyN = coarse ? 260 : 520;
    const fly = mkPoints(flyN, (a, i) => { a[i * 3] = rand(-18, 18); a[i * 3 + 1] = rand(.4, 6); a[i * 3 + 2] = rand(-18, 18); }, { size: .09, color: '#fff2a8', blink: 0 });
    const flyPos = fly.geometry.attributes.position.array;
    const flyHome = Float32Array.from(flyPos), flyPh = Float32Array.from({ length: flyN }, () => Math.random() * 6.28);

    /* ---------------- planted seeds (click the ground) */
    const planted = [];
    const plantAt = (pt, now) => {
      const t = growTree({ origin: pt, trunkLen: rand(.7, 1.15), r0: .05, maxDepth: 3, kids: [3, 2, 2], leafPer: 4, leafScale: .55 });
      remapTimes(t, 0, .8);
      const grow = { value: 0 }, bloom = { value: 0 };
      const bark = makeBark(grow, 2, '#5a3d27');
      const mesh = new THREE.Mesh(tubeGeometry(t.tube), bark);
      const lm = makeLeafMat(grow, { value: 0 });
      const lv = buildLeaves(t.leaves, lm, true);
      const fg = flowerGeometry([{ n: 6, len: .2, wid: .085, open: 1.2, closed: .12 }], { center: .05, stem: true });
      const fl = [];
      for (let k = 0; k < 4; k++) { const a = Math.random() * 6.28, r = rand(.25, .7); fl.push({ I: [pt.x + Math.cos(a) * r, pt.z + Math.sin(a) * r, rand(.3, .6), rand(1, 1.4)], J: [Math.random() * 6.28, k * .08, Math.random(), Math.random()] }); }
      setInst(fg, fl);
      const fm = makeFlowerMat({ inner: '#fffdf0', a: '#ffffff', b: '#9be15d', c: '#7af0d0', glow: '#9be15d', glowK: 2 }, .9);
      fm.uniforms.uBloomT = bloom;
      const fmesh = new THREE.Mesh(fg, fm); fmesh.frustumCulled = false;
      const rp = new THREE.Mesh(rippleGeo, rippleMat.clone()); rp.rotation.x = -Math.PI / 2; rp.position.set(pt.x, .04, pt.z);
      const group = new THREE.Group(); group.add(mesh, lv, fmesh, rp); scene.add(group);
      planted.push({ group, grow, bloom, rp, t0: now, mats: [bark, lm, fm, rp.material], geos: [mesh.geometry, lv.geometry, fg] });
      if (planted.length > 12) {
        const old = planted.shift(); scene.remove(old.group);
        old.mats.forEach(m => m.dispose()); old.geos.forEach(g => g.dispose()); old.group.children.forEach(c => c.isInstancedMesh && c.dispose());
      }
    };

    /* ---------------- camera path */
    const K = [];
    const kf = (p, pos, look) => K.push({ p, pos: new THREE.Vector3(...pos), look: new THREE.Vector3(...look) });
    kf(0, [.5, 1.35, 5.4], [0, 1.25, 0]);
    kf(.035, [1.1, .75, 3.9], [0, .45, 0]);
    kf(.09, [3.2, 2.2, 8.5], [0, 2.1, 0]);
    kf(.17, [8, 4.8, 14], [0, 4.6, 0]);
    const giantKeys = (gi, before, after) => {
      const g = giants[gi], H = g.head, [a, b] = g.G.win;
      const out = new THREE.Vector3(H.x, 0, H.z).normalize();
      const side = new THREE.Vector3(-out.z, 0, out.x);
      const cam = (dist, lift, sd) => H.clone().addScaledVector(out, dist).addScaledVector(side, sd).add(new THREE.Vector3(0, lift, 0));
      const narrow = innerWidth < 760;
      // frame the blossom right of centre (desktop, card on the left) or high (mobile, card below)
      const lookFrom = (c, k) => {
        const fwd = H.clone().sub(c).normalize(), right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
        const l = H.clone().add(new THREE.Vector3(0, .5, 0));
        return narrow ? l.add(new THREE.Vector3(0, -k * .9, 0)) : l.addScaledVector(right, -k);
      };
      const c0 = cam(15, 4, 4), c1 = cam(narrow ? 12.5 : 11.5, 2.6, 1.4), c2 = cam(narrow ? 11.5 : 10.6, 2.2, -.8), c3 = cam(13, 3.2, -3.4);
      kf(a - .035, c0.toArray(), lookFrom(c0, 1).toArray());
      kf(a, c1.toArray(), lookFrom(c1, 2.1).toArray());
      kf(b, c2.toArray(), lookFrom(c2, 1.9).toArray());
      if (after) kf(b + .03, c3.toArray(), lookFrom(c3, .5).toArray());
    };
    giantKeys(0, true, true);
    kf(.375, [3, 9.5, 21], [0, 6, 0]);
    giantKeys(1, true, true);
    kf(.565, [2.6, 1.7, 4.6], [-.3, 7.5, -1]);
    kf(.6, [-4, 2.4, 6], [0, 5, -2]);
    giantKeys(2, true, true);
    kf(.77, [-5, 3.2, 15], [0, 3.4, 0]);
    kf(.845, [5.2, 1.1, 6.6], [0, 1.1, 0]);
    kf(.92, [1, 10, 24], [0, 3.4, -3]);
    kf(1, [0, 17, 31], [0, 7.5, -12]);
    const posCurve = new THREE.CatmullRomCurve3(K.map(k => k.pos), false, 'centripetal');
    const lookCurve = new THREE.CatmullRomCurve3(K.map(k => k.look), false, 'centripetal');
    const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
    const sample = p => {
      let i = 0;
      while (i < K.length - 2 && p > K[i + 1].p) i++;
      const a = K[i], b = K[i + 1], t = clamp((p - a.p) / (b.p - a.p));
      const e = t * t * (3 - 2 * t), u = (i + (t + e) / 2) / (K.length - 1);
      posCurve.getPoint(u, cam.pos); lookCurve.getPoint(u, cam.look);
    };

    /* ---------------- palette over the scroll */
    const pal = { top: new THREE.Color(), hor: new THREE.Color(), sun: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color() };
    const palette = p => {
      let i = 0;
      while (i < SKY_KEYS.length - 2 && p > SKY_KEYS[i + 1].p) i++;
      const a = SKY_KEYS[i], b = SKY_KEYS[i + 1], t = smooth(a.p, b.p, p);
      for (const k of ['top', 'hor', 'sun', 'hs', 'hg']) pal[k].lerpColors(a[k], b[k], t);
      for (const k of ['si', 'el', 'hi', 'night', 'fn', 'ff', 'exp']) pal[k] = a[k] + (b[k] - a[k]) * t;
      return pal;
    };
    const C = s => new THREE.Color(s);
    const SEASON = {
      leafA: [C('#c8f58a'), C('#2f8a36'), C('#3d7a2c')], leafB: [C('#8fdc5a'), C('#57a83e'), C('#6b8f2a')],
      gBase: [C('#2c4a1c'), C('#1f4a1e'), C('#3a3a1a'), C('#0a1a14')], gTip: [C('#a9e86a'), C('#6cc04a'), C('#c9a44a'), C('#1f4a3a')]
    };
    const MOSS = [C('#3f6a2a'), C('#5a5a28')], NIGHT_FLY = C('#c9ff6e'), DAY_FLY = C('#fff2b0'), sunDir = new THREE.Vector3();
    const lerp3 =(arr, s, out) => { const i = Math.min(arr.length - 2, Math.floor(s)), t = clamp(s - i); return out.lerpColors(arr[i], arr[i + 1], t); };

    /* ---------------- resize */
    const dbs = new THREE.Vector2();
    let mobile = false;
    function resize() {
      const w = innerWidth, h = innerHeight, aspect = w / h;
      mobile = w < 760;
      renderer.setSize(w, h, false);
      camera.aspect = aspect; camera.fov = aspect < .8 ? 62 : aspect < 1.2 ? 54 : 46; camera.updateProjectionMatrix();
      renderer.getDrawingBufferSize(dbs);
      const sc = dbs.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      [stars, halos, fly].forEach(o => { o.material.uniforms.uScale.value = sc; });
      stars.material.uniforms.uSize.value = 2.6 * 250 / sc * (dbs.y / 900);
    }
    resize();
    addEventListener('resize', resize, { signal });

    /* ---------------- input: breeze + planting */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, nx: 0, ny: 0, active: false, vel: 0, lx: 0, ly: 0 };
    const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
    const groundPoint = (cx, cy, out) => {
      ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, out) && out.distanceTo(camera.position) < 60) return true;
      ray.ray.at(10, out); return false;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1;
      mouse.vel += Math.hypot(e.clientX - mouse.lx, e.clientY - mouse.ly); mouse.lx = e.clientX; mouse.ly = e.clientY;
      mouse.nx = e.clientX; mouse.ny = e.clientY; mouse.active = true;
    }, { signal, passive: true });
    document.addEventListener('pointerleave', () => { mouse.tx = 0; mouse.ty = 0; mouse.active = false; }, { signal });
    let down = null, plantedCount = 0, time = 0;
    const blocked = t => t.closest?.('a,button,input,select,textarea,.gd-card,.gd-seasons,header,dialog,.pn-intro,.gd-finale');
    addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { signal, passive: true });
    addEventListener('pointerup', e => {
      if (!down || e.button > 0) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
      if (moved > 8 || dt > 600 || blocked(e.target) || prog < .04 || document.querySelector('.pn-intro:not(.pn-out)')) return;
      const pt = new THREE.Vector3();
      if (!groundPoint(e.clientX, e.clientY, pt) || Math.hypot(pt.x, pt.z) > 34) return;
      plantAt(pt, time);
      plantedCount++;
      // a tap is also a gust at that spot
      mouse.nx = e.clientX; mouse.ny = e.clientY; mouse.vel += 160; mouse.active = true;
      ui.hintText.textContent = `아이디어 ${plantedCount}개를 심었어요 — 자라는 걸 지켜보세요`;
      ui.hint.classList.add('is-planted');
    }, { signal });

    /* ---------------- scroll */
    const track = $('.gd-track');
    let target = 0, prog = 0, lenis = null, ctx = null, gsap = null, tickerFn = null, lenisFn = null, rafId = 0;
    const readNative = () => { const r = track.getBoundingClientRect(); target = clamp(-r.top / Math.max(1, r.height - innerHeight)); };
    const scrollToP = p => {
      const r = track.getBoundingClientRect(), y = scrollY + r.top + p * (r.height - innerHeight);
      if (lenis) lenis.scrollTo(y, { duration: 2.6 }); else scrollTo({ top: y, behavior: 'smooth' });
    };
    if (libs) {
      const [{ gsap: G }, { ScrollTrigger }, { default: Lenis }] = libs;
      gsap = G; gsap.registerPlugin(ScrollTrigger);
      lenis = new Lenis({ lerp: .09 });
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
    $$('[data-go]').forEach(b => b.addEventListener('click', () => scrollToP(+b.dataset.go + (+b.dataset.go ? .01 : 0)), { signal }));
    $('[data-top]').addEventListener('click', () => scrollToP(0), { signal });

    /* ---------------- UI */
    const ui = {
      intro: $('.gd-intro'), vines: $$('.gd-vine'), cards: $$('.gd-card'), finale: $('.gd-finale'), stops: $$('.gd-seasons li'),
      clock: $('.gd-clock-time'), season: $('.gd-clock-season'), bar: $('.gd-clock-bar b'), hint: $('.gd-plant-hint'), hintText: $('.gd-plant-text'),
      leader: $('.gd-leader'), dot: $('.gd-leader-dot'), finCount: $('.gd-fin-count'), veil: $('.gd-veil')
    };
    $('.gd-loading').remove();
    el.classList.add('is-live');
    const state = { card: [false, false, false], fin: false, stop: -1, season: '' };
    let introT = 0, introGo = false;
    const proj = new THREE.Vector3();

    function updateUI(p) {
      if (!introGo && !document.querySelector('.pn-intro:not(.pn-out)')) introGo = true;
      if (introGo) introT = isPaused() ? 1 : Math.min(1, introT + .009);
      el.style.setProperty('--ig', (1 - Math.pow(1 - introT, 2.2)).toFixed(4));
      el.style.setProperty('--ix', smooth(.012, .045, p).toFixed(4));
      ui.intro.style.visibility = p > .05 ? 'hidden' : '';
      VINES.forEach((v, i) => {
        const [a, b] = v.win, g = smooth(a, a + .045, p), o = smooth(b - .03, b, p), node = ui.vines[i];
        node.style.setProperty('--g', g.toFixed(4)); node.style.setProperty('--o', o.toFixed(4));
        node.style.visibility = g <= 0 || o >= 1 ? 'hidden' : '';
      });
      // project cards + botanical leader line
      let leaderOn = false;
      giants.forEach((gt, i) => {
        const [a, b] = gt.G.win, v = smooth(a - .012, a + .012, p) * (1 - smooth(b - .004, b + .022, p));
        const card = ui.cards[i];
        card.style.setProperty('--v', v.toFixed(4));
        const vis = v > .5;
        if (vis !== state.card[i]) { state.card[i] = vis; card.inert = !vis; card.setAttribute('aria-hidden', String(!vis)); card.classList.toggle('is-on', vis); }
        if (v > .02) {
          proj.copy(gt.discG.position).project(camera);
          const sx = (proj.x * .5 + .5) * innerWidth, sy = (-proj.y * .5 + .5) * innerHeight, r = card.getBoundingClientRect();
          const ax = mobile ? r.left + r.width * .5 : r.right, ay = mobile ? r.top : r.top + 34;
          const mx = mobile ? ax : (ax + sx) / 2;
          ui.leader.setAttribute('d', mobile ? `M${ax.toFixed(1)} ${ay.toFixed(1)} C${ax.toFixed(1)} ${(ay - 60).toFixed(1)} ${sx.toFixed(1)} ${(sy + 80).toFixed(1)} ${sx.toFixed(1)} ${(sy + 40).toFixed(1)}`
            : `M${ax.toFixed(1)} ${ay.toFixed(1)} C${mx.toFixed(1)} ${ay.toFixed(1)} ${mx.toFixed(1)} ${sy.toFixed(1)} ${(sx - 70).toFixed(1)} ${sy.toFixed(1)}`);
          ui.dot.setAttribute('cx', (mobile ? sx : sx - 70).toFixed(1)); ui.dot.setAttribute('cy', (mobile ? sy + 40 : sy).toFixed(1));
          el.style.setProperty('--lv', v.toFixed(3)); el.style.setProperty('--lc', gt.G.glow);
          leaderOn = true;
        }
      });
      if (!leaderOn) el.style.setProperty('--lv', '0');
      // finale
      const f = smooth(.93, .975, p);
      el.style.setProperty('--f', f.toFixed(4));
      const fv = f > .5;
      if (fv !== state.fin) {
        state.fin = fv; ui.finale.inert = !fv; ui.finale.setAttribute('aria-hidden', String(!fv));
        ui.finCount.textContent = plantedCount ? `오늘 이 정원에 아이디어 ${plantedCount}개를 심었어요.` : '정원의 어느 곳이든 눌러 씨앗을 심을 수 있어요.';
      }
      // clock + seasons
      const hours = 5.5 + p * 17.5, hh = Math.floor(hours), mm = Math.floor((hours - hh) * 60);
      ui.clock.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      let s = 0; STOPS.forEach((st, i) => { if (p >= st.p - .005) s = i; });
      const label = p < .045 ? 'DAWN · 새벽' : `${STOPS[s].en.toUpperCase()} · ${STOPS[s].ko}`;
      if (label !== state.season) { state.season = label; ui.season.textContent = label; }
      if (s !== state.stop) { state.stop = s; ui.stops.forEach((li, i) => { li.classList.toggle('is-active', i === s); li.classList.toggle('is-past', i < s); }); }
      ui.bar.style.transform = `scaleX(${p.toFixed(4)})`;
      el.style.setProperty('--hud', (smooth(.035, .07, p) * (1 - smooth(.925, .95, p))).toFixed(3));
      el.style.setProperty('--night', pal.night.toFixed(3));
    }

    /* ---------------- frame */
    const tmpC = new THREE.Color(), wind = new THREE.Vector3(0, 0, 999), cur3 = new THREE.Vector3();
    let last = performance.now();
    function frame(now) {
      if (disposed) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (document.hidden) return;
      const paused = isPaused();
      el.classList.toggle('is-paused', paused);
      if (!paused) time += dt;
      prog += (target - prog) * (1 - Math.exp(-dt * 5.5));
      if (Math.abs(target - prog) < 1e-5) prog = target;
      const p = prog;

      // camera
      mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 2.6));
      mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 2.6));
      sample(p);
      const bob = paused ? 0 : Math.sin(time * .4) * .05;
      camera.position.set(cam.pos.x + mouse.x * .35, cam.pos.y - mouse.y * .18 + bob, cam.pos.z);
      camera.lookAt(cam.look.x + mouse.x * .9, cam.look.y - mouse.y * .55, cam.look.z);

      // time of day
      palette(p);
      const az = -.6 + p * 2.2, el2 = pal.el;
      sunDir.set(Math.sin(az) * Math.cos(el2), Math.sin(el2), -Math.cos(az) * Math.cos(el2));
      skyMat.uniforms.uTop.value.copy(pal.top); skyMat.uniforms.uHorizon.value.copy(pal.hor);
      skyMat.uniforms.uSunDir.value.copy(sunDir); skyMat.uniforms.uSunCol.value.copy(pal.sun);
      sky.position.copy(camera.position); stars.position.copy(camera.position);
      scene.fog.color.copy(pal.hor); scene.fog.near = pal.fn; scene.fog.far = pal.ff;
      U.uFogColor.value.copy(pal.hor); U.uFogNear.value = pal.fn; U.uFogFar.value = pal.ff;
      sun.color.copy(pal.sun); sun.intensity = pal.si; sun.position.copy(sunDir).multiplyScalar(40);
      hemi.color.copy(pal.hs); hemi.groundColor.copy(pal.hg); hemi.intensity = pal.hi;
      U.uAmb.value.copy(pal.hs).multiplyScalar(pal.hi * .8).add(tmpC.copy(pal.hg).multiplyScalar(pal.hi * .35));
      U.uSun.value.copy(pal.sun).multiplyScalar(pal.si * .34 * Math.max(.3, Math.sin(el2) + .4));
      U.uNight.value = pal.night;
      renderer.toneMappingExposure = pal.exp;
      stars.material.uniforms.uAlpha.value = smooth(.6, 1, pal.night);

      // growth
      treeGrow.value = Math.pow(clamp((p - .036) / .3), .85);
      const grassT = clamp((p - .03) / .3);
      grassMat.uniforms.uGrass.value = grassT; groundMat.uniforms.uCover.value = grassT * 36;
      meadowMat.uniforms.uBloomT.value = clamp((p - .06) / .3) * 1.12;
      const season = smooth(.1, .3, p) + smooth(.38, .5, p) * .0; // spring → summer for leaf colour
      lerp3(SEASON.leafA, season, LEAF.a.value); lerp3(SEASON.leafB, season, LEAF.b.value);
      LEAF.turn.value = smooth(.5, .66, p) * 1.3;
      leafFall.value = smooth(.575, .79, p) * 1.3;
      const gs = p < .4 ? smooth(.04, .3, p) : p < .62 ? 1 + smooth(.5, .62, p) : 2 + smooth(.7, .82, p);
      lerp3(SEASON.gBase, gs, grassMat.uniforms.uBase.value); lerp3(SEASON.gTip, gs, grassMat.uniforms.uTip.value);
      grassMat.uniforms.uDryAmt.value = smooth(.52, .64, p) * (1 - smooth(.8, .9, p) * .6);
      groundMat.uniforms.uLitterAmt.value = smooth(.62, .76, p);
      groundMat.uniforms.uMoss.value.lerpColors(MOSS[0], MOSS[1], smooth(.52, .66, p));
      barkMat.emissive.set('#0c3a2c').multiplyScalar(pal.night * .5);

      // seed
      const fall = smooth(.006, .035, p);
      const sy = 1.35 + (paused ? 0 : Math.sin(time * 1.6) * .06) * (1 - fall);
      seed.position.set(0, sy * (1 - fall * fall) + .02 - smooth(.035, .05, p) * .14, 0);
      seed.rotation.y = time * .8; seed.rotation.z = fall * .6;
      seed.visible = p < .06;
      seedGlow.position.copy(seed.position); seedGlow.material.opacity = (1 - smooth(.04, .065, p)) * (.85 + Math.sin(time * 3) * .1);
      const rp = smooth(.032, .085, p);
      ripple.scale.setScalar(.2 + rp * 7); rippleMat.opacity = Math.sin(rp * Math.PI) * .8;
      groundMat.uniforms.uSeedGlow.value = smooth(.02, .038, p) * (1 - smooth(.045, .1, p)) * 1.4;

      // giants
      giants.forEach(gt => {
        const [a, b] = gt.G.win;
        gt.stemGrow.value = smooth(a - .13, a - .035, p);
        const bl = smooth(a - .045, a + .008, p);
        gt.mat.uniforms.uBloomT.value = bl;
        const hs = smooth(.82, 1, gt.stemGrow.value);
        gt.flower.visible = hs > .001; gt.flower.scale.setScalar(Math.max(.001, hs));
        gt.sl.forEach((m, k) => m.scale.setScalar(Math.max(.001, smooth(a - .1 + k * .02, a - .05 + k * .02, p) * m.userData.s)));
        const d = smooth(a - .015, a + .012, p);
        gt.discG.position.y = gt.head.y + 1.25 + (paused ? 0 : Math.sin(time * 1.2 + gt.i) * .06);
        gt.discG.quaternion.copy(camera.quaternion);
        const s = .25 + .75 * d;
        gt.discG.scale.setScalar(s);
        gt.disc.material.opacity = d; gt.ring.material.opacity = d * .9;
        gt.halo.material.opacity = d * (.55 + pal.night * .45);
        gt.ring.rotation.z = time * .3; gt.ring2.rotation.z = -time * .45;
        gt.discG.visible = d > .002;
      });

      // light shafts (day only)
      const day = (1 - pal.night) * smooth(.1, .2, p) * clamp(treeGrow.value * 1.5);
      shaftMat.opacity = day * (.11 + (paused ? 0 : Math.sin(time * .6) * .02)); shaftMat.color.copy(pal.sun);
      shafts.forEach((m, i) => { m.visible = day > .01; m.rotation.set(0, Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z), 0); m.rotateZ(.38 + i * .05); });

      // breeze from the pointer
      mouse.vel *= Math.exp(-dt * 2.2);
      if (mouse.active && groundPoint(mouse.nx, mouse.ny, cur3)) wind.lerp(cur3, 1 - Math.exp(-dt * 10));
      else if (mouse.active) wind.lerp(cur3, 1 - Math.exp(-dt * 10));
      U.uWindPos.value.copy(wind);
      const want = mouse.active ? .38 + Math.min(.9, mouse.vel / 260) : 0;
      U.uWindAmt.value += (want - U.uWindAmt.value) * (1 - Math.exp(-dt * 4));
      U.uWindR.value = 2.6 + Math.min(3, camera.position.y * .12);
      U.uGust.value = .45 + .35 * Math.sin(time * .35) + smooth(.55, .7, p) * .6;
      U.uTime.value = time;

      // pollen by day, fireflies by night — they gather around the pointer
      const nightK = pal.night;
      fly.material.uniforms.uColor.value.lerpColors(DAY_FLY, NIGHT_FLY, smooth(.3, .7, nightK));
      fly.material.uniforms.uBlink.value = nightK;
      fly.material.uniforms.uSize.value = .07 + nightK * .09;
      fly.material.uniforms.uAlpha.value = (.45 + nightK * .9) * smooth(.06, .14, p);
      if (!paused) {
        const attract = mouse.active ? 1 : 0, cy = Math.max(.6, wind.y + 1.2);
        for (let i = 0; i < flyN; i++) {
          const k = i * 3, ph = flyPh[i] + time * (.25 + (i % 7) * .03);
          let tx = flyHome[k] + Math.sin(ph) * 1.6, ty = flyHome[k + 1] + Math.sin(ph * 1.3) * .6, tz = flyHome[k + 2] + Math.cos(ph * .8) * 1.6;
          if (attract) {
            const dx = wind.x - flyPos[k], dz = wind.z - flyPos[k + 2], d2 = dx * dx + dz * dz;
            if (d2 < 60) { const orb = 1.1 + (i % 5) * .35; tx = wind.x + Math.cos(ph * 2.2) * orb; ty = cy + Math.sin(ph * 1.7) * .7; tz = wind.z + Math.sin(ph * 2.2) * orb; }
          }
          const k2 = 1 - Math.exp(-dt * (attract ? 1.6 : .8));
          flyPos[k] += (tx - flyPos[k]) * k2; flyPos[k + 1] += (ty - flyPos[k + 1]) * k2; flyPos[k + 2] += (tz - flyPos[k + 2]) * k2;
        }
        fly.geometry.attributes.position.needsUpdate = true;
      }
      halos.material.uniforms.uAlpha.value = smooth(.7, .86, p) * .9;

      // planted seeds grow over a few seconds
      planted.forEach(pl => {
        const g = paused ? 1 : clamp((time - pl.t0) / 3.4);
        pl.grow.value = 1 - Math.pow(1 - g, 2); pl.bloom.value = clamp((g - .5) / .45) * 1.25;
        pl.rp.scale.setScalar(.2 + g * 2.6); pl.rp.material.opacity = (1 - g) * .9;
      });

      updateUI(p);
      renderer.render(scene, camera);
    }

    if (gsap) { tickerFn = () => frame(performance.now()); gsap.ticker.add(tickerFn); }
    else { const loop = now => { rafId = requestAnimationFrame(loop); frame(now); }; rafId = requestAnimationFrame(loop); }

    teardown = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (gsap) { if (tickerFn) gsap.ticker.remove(tickerFn); if (lenisFn) gsap.ticker.remove(lenisFn); gsap.ticker.lagSmoothing(500, 33); }
      ctx?.revert(); lenis?.destroy();
      const geos = new Set(owned.geos), mats = new Set(owned.mats);
      scene.traverse(o => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
        if (o.isInstancedMesh) o.dispose?.();
      });
      geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose());
      owned.textures.forEach(t => t.dispose());
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

function pick(o, keys) { const r = {}; keys.forEach(k => { r[k] = o[k]; }); return r; }
