// "Through the Frames" — world `gallery` (Object Room).
// A scroll-scrubbed flight through a procedural Greco-Roman marble hall. The camera dollies down
// a colonnade, pushes INTO a gilded frame, the picture dissolves into a 3D field of its own pixels,
// and the camera passes out through the back of the canvas into the next hall.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { projects, profileURL } from '../content.js?v=ten-worlds-1';

const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs'
};
const ART = { vrm: 'art/vrm.jpg', pixelle: 'art/glass.jpg', motion: 'art/orbit.jpg' };
const ROMAN = ['I', 'II', 'III'];
const MOODS = [
  { hall: { fog: '#1c140c', light: '#ffd29a' }, era: { fog: '#03101a', light: '#7fd6ff', tint: '#a8ecff' },
    hallName: 'Hall of Amber', hallKo: '호박빛 회랑', eraName: 'The Living Likeness', eraKo: '살아 있는 얼굴의 시대' },
  { hall: { fog: '#0b1018', light: '#b8cdff' }, era: { fog: '#0d0721', light: '#c39cff', tint: '#e2c9ff' },
    hallName: 'Hall of Moonlight', hallKo: '달빛 회랑', eraName: 'The Glass Age', eraKo: '유리의 시대' },
  { hall: { fog: '#180c0f', light: '#ffb3a0' }, era: { fog: '#170803', light: '#ff9a55', tint: '#ffbe80' },
    hallName: 'Hall of Dusk', hallKo: '황혼의 회랑', eraName: 'The Orbit Age', eraKo: '궤도의 시대' }
];
const FIN_MOOD = { fog: '#1e160b', light: '#ffdc93' };

// World layout (camera travels along -Z)
const FY = 6.2;                    // frame centre height
const SEC = [
  { z0: 12, wall: -40, veil: -68, p: [0.07, 0.37] },
  { z0: -71, wall: -102, veil: -130, p: [0.37, 0.62] },
  { z0: -133, wall: -164, veil: -192, p: [0.62, 0.87] }
];
const FIN = { z0: -195, wall: -228, dist: 27 };
const TRACK_VH = 1100;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hexV3 = hex => { const n = parseInt(hex.slice(1), 16); return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
const splitName = name => { const w = name.split(' '); const last = w.pop(); return `${esc(w.join(' '))} <em>${esc(last)}</em>`; };

/* ------------------------------------------------------------------ markup */

function letters(word, spread) {
  return [...word].map((ch, i) => {
    const dx = rand(-spread, spread).toFixed(1), dy = rand(-26, 26).toFixed(1), r = rand(-70, 70).toFixed(0), z = rand(.4, 1.8).toFixed(2);
    return `<span class="fr-l" style="--dx:${dx}vw;--dy:${dy}vh;--r:${r}deg;--s:${z};--d:${(i * .13).toFixed(2)}s">${esc(ch)}</span>`;
  }).join('');
}

function liveMarkup() {
  const cards = projects.map((p, i) => `
    <article class="fr-card" data-card="${i}" style="--mood:${MOODS[i].era.light}" aria-hidden="true" inert>
      <header class="fr-card-head"><span class="fr-card-num">ERA ${ROMAN[i]} · 0${i + 1}</span><span class="fr-card-cat">${esc(p.category)}</span></header>
      <p class="fr-card-era">${esc(MOODS[i].eraName)} — ${esc(MOODS[i].eraKo)}</p>
      <h2 class="fr-card-title">${splitName(p.name)}</h2>
      <p class="fr-card-desc">${esc(p.description)}</p>
      <p class="fr-card-body">${esc(p.body)}</p>
      <ul class="fr-chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <a class="fr-card-link" href="${esc(p.url)}" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a>
    </article>`).join('');
  const nav = projects.map((p, i) => `<li data-n="${i}"><button type="button" data-go="${i}" aria-label="${ROMAN[i]}. ${esc(p.name)}로 이동">${ROMAN[i]}</button><span>${esc(p.name)}</span></li>`).join('');
  return `
  <div class="fr" data-no-kx>
    <canvas class="fr-canvas" aria-hidden="true"></canvas>
    <div class="fr-dof" aria-hidden="true"></div>
    <div class="fr-bars" aria-hidden="true"></div>
    <div class="fr-flash" aria-hidden="true"></div>
    <div class="fr-vignette" aria-hidden="true"></div>
    <div class="fr-grain" aria-hidden="true"></div>
    <div class="fr-ui">
      <section class="fr-intro">
        <p class="fr-eyebrow"><span>WORLD 04</span><i></i><span>THROUGH THE FRAMES</span></p>
        <h1 class="fr-title" aria-label="Object Room"><span class="fr-word">${letters('Object', 46)}</span><em class="fr-word">${letters('Room', 40)}</em></h1>
        <p class="fr-sub">세 개의 액자, 세 개의 시대.<br>그림 속으로 걸어 들어가 작업을 만나세요.</p>
        <div class="fr-hint"><span>SCROLL TO ENTER</span><i></i></div>
      </section>
      <div class="fr-chapter" aria-hidden="true"><b class="fr-chapter-num">I</b><span class="fr-chapter-label"></span><small class="fr-chapter-ko"></small></div>
      <div class="fr-ghost" aria-hidden="true"><span></span></div>
      ${cards}
      <section class="fr-finale" aria-hidden="true" inert>
        <p class="fr-eyebrow"><span>FIN</span><i></i><span>THREE ERAS, ONE ROOM</span></p>
        <h2 class="fr-fin-title"><span>Every era,</span> <em>one maker.</em></h2>
        <p class="fr-fin-sub">얼굴, 유리, 궤도 — 시대는 달라도 만드는 손은 하나입니다.<br>모든 작업의 코드는 GitHub에 열려 있습니다.</p>
        <div class="fr-fin-actions"><a class="fr-btn fr-btn--gold" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 더 보기 <span aria-hidden="true">↗</span></a><button type="button" class="fr-btn" data-top>처음으로 <span aria-hidden="true">↑</span></button></div>
      </section>
      <nav class="fr-progress" aria-label="전시 진행"><ol>${nav}</ol><i class="fr-progress-bar"><b></b></i></nav>
      <p class="fr-loading" aria-live="polite">전시실을 조명하는 중…</p>
    </div>
    <div class="fr-track" style="height:${TRACK_VH}vh"></div>
  </div>`;
}

function staticMarkup() {
  return `
  <div class="fr fr--static" data-no-kx>
    <header class="frs-intro">
      <p class="fr-eyebrow"><span>WORLD 04</span><i></i><span>THROUGH THE FRAMES</span></p>
      <h1 class="frs-title">Object <em>Room</em></h1>
      <p class="fr-sub">세 개의 액자, 세 개의 시대.<br>작업을 하나의 작품처럼 걸어 두었습니다.</p>
    </header>
    <ol class="frs-list">
      ${projects.map((p, i) => `
      <li class="frs-item" style="--mood:${MOODS[i].era.light}">
        <figure class="frs-frame"><div class="frs-mat"><img src="${ART[p.id] || 'art/orbit.jpg'}" alt="${esc(p.name)} 대표 이미지" loading="lazy" decoding="async"></div></figure>
        <div class="frs-cap">
          <span class="fr-card-num">ERA ${ROMAN[i]} · 0${i + 1} — ${esc(p.category)}</span>
          <h2 class="fr-card-title">${splitName(p.name)}</h2>
          <p class="fr-card-desc">${esc(p.description)}</p>
          <p class="fr-card-body">${esc(p.body)}</p>
          <ul class="fr-chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          <a class="fr-card-link" href="${esc(p.url)}" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a>
        </div>
      </li>`).join('')}
    </ol>
    <footer class="frs-fin">
      <h2 class="fr-fin-title"><span>Every era,</span> <em>one maker.</em></h2>
      <a class="fr-btn fr-btn--gold" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 더 보기 <span aria-hidden="true">↗</span></a>
    </footer>
  </div>`;
}

/* ------------------------------------------------------- procedural textures */

function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function paintMarble(g, size, base, veinRGB, strength) {
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * size, y = Math.random() * size, r = size * rand(.05, .3);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, Math.random() < .55 ? `rgba(120,106,90,${rand(0, .07)})` : `rgba(255,250,240,${rand(0, .08)})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
  }
  const vein = (n, wMin, wMax, aMin, aMax, len) => {
    for (let i = 0; i < n; i++) {
      let x = Math.random() * size, y = Math.random() * size, a = Math.random() * Math.PI * 2;
      g.beginPath(); g.moveTo(x, y);
      const steps = len * rand(.5, 1.2);
      for (let s = 0; s < steps; s++) { a += rand(-.45, .45); x += Math.cos(a) * size * .007; y += Math.sin(a) * size * .007; g.lineTo(x, y); }
      g.strokeStyle = `rgba(${veinRGB},${rand(aMin, aMax) * strength})`;
      g.lineWidth = rand(wMin, wMax); g.stroke();
    }
  };
  try { g.filter = 'blur(1.4px)'; } catch { /* unsupported */ }
  vein(14, 2, 5, .12, .3, 160);
  try { g.filter = 'none'; } catch { /* unsupported */ }
  vein(36, .6, 1.6, .15, .45, 120);
  vein(10, .5, 1, .25, .5, 60);
  g.globalCompositeOperation = 'source-over';
  const d = g.getImageData(0, 0, size, size), px = d.data;
  for (let i = 0; i < px.length; i += 4) { const n = (Math.random() - .5) * 10; px[i] += n; px[i + 1] += n; px[i + 2] += n; }
  g.putImageData(d, 0, 0);
}

function marbleTexture(size, base, veinRGB, strength = 1) {
  const c = cnv(size, size), g = c.getContext('2d', { willReadFrequently: true });
  paintMarble(g, size, base, veinRGB, strength);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function floorTexture(size) {
  const c = cnv(size, size), g = c.getContext('2d', { willReadFrequently: true });
  paintMarble(g, size, '#e6dfd2', '86,74,62', 1);
  const h = size / 2;
  // opus sectile: alternating tinted slabs, inlaid diagonal lozenge, grout
  g.fillStyle = 'rgba(46,36,26,.16)'; g.fillRect(0, 0, h, h); g.fillRect(h, h, h, h);
  g.strokeStyle = 'rgba(150,112,58,.32)'; g.lineWidth = size * .006;
  for (const [ox, oy] of [[0, 0], [h, 0], [0, h], [h, h]]) {
    g.beginPath(); g.moveTo(ox + h / 2, oy + h * .16); g.lineTo(ox + h * .84, oy + h / 2); g.lineTo(ox + h / 2, oy + h * .84); g.lineTo(ox + h * .16, oy + h / 2); g.closePath(); g.stroke();
  }
  g.strokeStyle = 'rgba(28,20,14,.55)'; g.lineWidth = size * .004;
  g.strokeRect(0, 0, size, size); g.beginPath(); g.moveTo(h, 0); g.lineTo(h, size); g.moveTo(0, h); g.lineTo(size, h); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function noiseTexture(size) {
  const c = cnv(size, size), g = c.getContext('2d');
  const d = g.createImageData(size, size);
  for (let i = 0; i < d.data.length; i += 4) { const v = 110 + Math.random() * 145; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0);
  try { g.filter = 'blur(1px)'; g.drawImage(c, 0, 0); } catch { /* ok */ }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function glowTexture() {
  const c = cnv(256, 256), g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function shaftTexture() {
  const c = cnv(128, 512), g = c.getContext('2d');
  const h = g.createLinearGradient(0, 0, 128, 0);
  h.addColorStop(0, 'rgba(255,255,255,0)'); h.addColorStop(.5, 'rgba(255,255,255,1)'); h.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = h; g.fillRect(0, 0, 128, 512);
  g.globalCompositeOperation = 'destination-in';
  const v = g.createLinearGradient(0, 0, 0, 512);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.1, 'rgba(0,0,0,1)'); v.addColorStop(.55, 'rgba(0,0,0,.55)'); v.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = v; g.fillRect(0, 0, 128, 512);
  return new THREE.CanvasTexture(c);
}

function plaqueTexture(text) {
  const c = cnv(1024, 128), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 20, 0, 108);
  gr.addColorStop(0, '#fff1c4'); gr.addColorStop(.5, '#d6a04a'); gr.addColorStop(1, '#8a5a1c');
  g.fillStyle = gr; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '400 62px "Instrument Serif", Georgia, "Times New Roman", serif';
  try { g.letterSpacing = '10px'; } catch { /* ok */ }
  g.fillText(text, 512, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function grainURL() {
  const c = cnv(140, 140), g = c.getContext('2d'), d = g.createImageData(140, 140);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0);
  return c.toDataURL('image/png');
}

function fallbackArt(p, i) {
  const c = cnv(600, 760), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 600, 760);
  gr.addColorStop(0, MOODS[i].era.fog); gr.addColorStop(1, MOODS[i].era.light);
  g.fillStyle = gr; g.fillRect(0, 0, 600, 760);
  g.fillStyle = 'rgba(255,255,255,.85)'; g.font = 'italic 64px Georgia, serif'; g.textAlign = 'center';
  g.fillText(p.name.split(' ').pop(), 300, 400);
  return c;
}

/* ------------------------------------------------------------ geometry */

function uvScale(geo, sx, sy) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
  return geo;
}

function flute(geo, flutes, depth) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    if (Math.hypot(x, z) < 1e-4) continue;
    const a = Math.atan2(z, x), k = 1 - depth * Math.pow(.5 + .5 * Math.cos(a * flutes), 1.6);
    pos.setX(i, x * k); pos.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

function rectShape(w, h) {
  const s = new THREE.Shape();
  s.moveTo(-w, -h); s.lineTo(w, -h); s.lineTo(w, h); s.lineTo(-w, h); s.lineTo(-w, -h);
  return s;
}

function ringGeo(ow, oh, iw, ih, depth, bevel, segs) {
  const s = rectShape(ow, oh), hole = new THREE.Path();
  hole.moveTo(-iw, -ih); hole.lineTo(-iw, ih); hole.lineTo(iw, ih); hole.lineTo(iw, -ih); hole.lineTo(-iw, -ih);
  s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .85, bevelSegments: segs, curveSegments: 1 });
}

/* ----------------------------------------------------------------- shaders */

const POINTS_VS = /* glsl */`
uniform float uE; uniform float uTime; uniform float uScale; uniform float uSize; uniform float uAlpha; uniform vec3 uTint;
attribute vec3 aColor; attribute vec4 aRnd;
varying vec3 vColor; varying float vA;
void main(){
  vec3 p = position;
  float e = uE;
  float lum = dot(aColor, vec3(.299,.587,.114));
  float depth = (0.3 + lum * 0.7) * (0.5 + aRnd.x);
  p.z -= depth * 25.0 * e;
  p.xy *= 1.0 + e * (0.35 + aRnd.y * 1.9);
  float t = uTime * 0.55 + aRnd.z * 6.2831;
  p += vec3(sin(t), cos(t * 1.3), sin(t * 0.7)) * 0.3 * e;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(-mv.z, 0.05);
  float sz = uSize * mix(1.0, 0.25 + aRnd.w * 0.75, smoothstep(0.0, 0.35, e));
  gl_PointSize = clamp(sz * uScale / dist, 0.0, 22.0);
  vColor = mix(aColor, aColor * 0.55 + uTint * 0.75 * (0.4 + lum), e * 0.65);
  float keep = mix(1.0, 0.06 + smoothstep(0.12, 0.7, lum) * 1.1, smoothstep(0.0, 0.4, e));
  vA = uAlpha * smoothstep(0.3, 2.2, dist) * (1.0 - smoothstep(34.0, 58.0, dist)) * keep * mix(1.0, 0.7, e);
}`;
const POINTS_FS = /* glsl */`
varying vec3 vColor; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(vColor, a * vA);
}`;
const DUST_VS = /* glsl */`
uniform float uTime; uniform float uScale;
attribute vec4 aRnd;
varying float vA;
void main(){
  vec3 p = position;
  float t = uTime * (0.15 + aRnd.x * 0.25) + aRnd.y * 6.2831;
  p += vec3(sin(t) * 0.5, sin(t * 0.7 + aRnd.z * 4.0) * 0.6, cos(t * 0.8) * 0.4);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(-mv.z, 0.05);
  gl_PointSize = clamp((0.035 + aRnd.w * 0.05) * uScale / dist, 0.0, 10.0);
  vA = (0.35 + 0.65 * sin(t * 3.0 + aRnd.w * 9.0) * 0.5 + 0.325) * smoothstep(0.4, 2.0, dist) * (1.0 - smoothstep(16.0, 34.0, dist));
}`;
const DUST_FS = /* glsl */`
uniform vec3 uColor; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vA * 0.8);
}`;

/* ------------------------------------------------------------------- mount */

export function mount(root, { isPaused = () => false } = {}) {
  let disposed = false;
  const ac = new AbortController(), signal = ac.signal;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let teardown = () => {};

  const goStatic = () => { root.innerHTML = staticMarkup(); };

  if (reduce) { goStatic(); return () => { disposed = true; ac.abort(); root.innerHTML = ''; }; }

  root.innerHTML = liveMarkup();
  const el = root.querySelector('.fr');
  const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
  const canvas = $('.fr-canvas');
  $('.fr-grain').style.backgroundImage = `url(${grainURL()})`;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch {
    renderer = null;
    goStatic();
    return () => { disposed = true; ac.abort(); root.innerHTML = ''; };
  }

  init().catch(err => {
    console.warn('[frames] falling back to static gallery', err);
    if (!disposed) { teardown(); goStatic(); }
  });

  async function init() {
    const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    const loadImg = src => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const fontReady = Promise.race([document.fonts?.load?.('62px "Instrument Serif"') ?? Promise.resolve(), new Promise(r => setTimeout(r, 1500))]).catch(() => {});
    const libsP = Promise.all([import(LIBS.gsap), import(LIBS.st), import(LIBS.lenis)]).catch(() => null);
    const [images, libs] = await Promise.all([Promise.all(projects.map(p => loadImg(ART[p.id] || 'art/orbit.jpg'))), libsP, fontReady]);
    if (disposed) return;

    /* ---------------- renderer / scene */
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .5;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050403');
    scene.fog = new THREE.Fog('#050403', 6, 44);
    const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .05, 150);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmrem.fromScene(roomEnv, .04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = .32;
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const owned = { textures: [envTex], disposables: [pmrem] };
    const tex = t => { t.anisotropy = Math.max(t.anisotropy, aniso); owned.textures.push(t); return t; };

    const marbleMap = tex(marbleTexture(1024, '#ebe5da', '92,80,66'));
    const wallMap = tex(marbleTexture(1024, '#cfc7b8', '70,58,46', 1.2));
    const floorMap = tex(floorTexture(1024));
    const goldBump = tex(noiseTexture(256));
    const glowMap = tex(glowTexture());
    const shaftMap = tex(shaftTexture());

    const M = {
      marble: new THREE.MeshStandardMaterial({ map: marbleMap, roughness: .42, metalness: 0, color: '#f2ede4' }),
      wall: new THREE.MeshStandardMaterial({ map: wallMap, roughness: .55, color: '#5e564b' }),
      floor: new THREE.MeshStandardMaterial({ map: floorMap, roughness: .16, metalness: 0, transparent: true, opacity: .84, color: '#d9d2c4' }),
      gold: new THREE.MeshPhysicalMaterial({ color: '#d6a24a', metalness: 1, roughness: .27, clearcoat: .5, clearcoatRoughness: .25, bumpMap: goldBump, bumpScale: .6, envMap: envTex, envMapIntensity: 1.5 }),
      goldDark: new THREE.MeshPhysicalMaterial({ color: '#8c5d22', metalness: 1, roughness: .4, bumpMap: goldBump, bumpScale: .8, envMap: envTex, envMapIntensity: 1.1 }),
      wood: new THREE.MeshStandardMaterial({ color: '#4a3524', roughness: .8 }),
      shaft: new THREE.MeshBasicMaterial({ map: shaftMap, color: '#ffd29a', transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
      pool: new THREE.MeshBasicMaterial({ map: glowMap, color: '#ffd29a', transparent: true, opacity: .2, blending: THREE.AdditiveBlending, depthWrite: false }),
      backdrop: new THREE.MeshBasicMaterial({ color: '#000000', fog: false })
    };
    goldBump.repeat.set(.6, .6);

    const world = new THREE.Group(); scene.add(world);
    const mirror = new THREE.Group(); mirror.scale.y = -1; scene.add(mirror);

    /* ---------------- lights */
    const hemi = new THREE.HemisphereLight('#ffd29a', '#140f0a', .7); scene.add(hemi);
    const key = new THREE.DirectionalLight('#ffd29a', 1.5); key.position.set(6, 14, 8); scene.add(key); scene.add(key.target);
    const camLight = new THREE.PointLight('#ffd29a', 22, 30, 2); scene.add(camLight);
    const spot = new THREE.SpotLight('#fff0d8', 220, 42, .42, .65, 2); scene.add(spot); scene.add(spot.target);

    /* ---------------- column parts (instanced) */
    const parts = {
      shaft: flute(new THREE.CylinderGeometry(.5, .58, 8, 80, 1, true), 20, .07),
      plinth: new THREE.BoxGeometry(1.5, .36, 1.5),
      torus: new THREE.TorusGeometry(.6, .13, 10, 40).rotateX(Math.PI / 2),
      echinus: new THREE.CylinderGeometry(.82, .54, .42, 40, 1),
      abacus: new THREE.BoxGeometry(1.8, .3, 1.8),
      volute: new THREE.TorusGeometry(.2, .075, 8, 22).rotateY(Math.PI / 2),
      arcade: null, transverse: new THREE.TorusGeometry(5, .32, 10, 56, Math.PI)
    };
    const SPACING = 5.5;
    parts.arcade = new THREE.TorusGeometry(SPACING / 2 - .05, .26, 8, 36, Math.PI).rotateY(Math.PI / 2);
    const inst = { shaft: [], plinth: [], torus: [], echinus: [], abacus: [], volute: [], arcade: [], transverse: [] };
    const mtx = (x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
    function addColumn(x, z, s = 1) {
      inst.plinth.push(mtx(x, .18 * s, z, s, s, s));
      inst.torus.push(mtx(x, .46 * s, z, s, s, s));
      inst.shaft.push(mtx(x, 4.5 * s, z, s, s, s));
      inst.echinus.push(mtx(x, 8.71 * s, z, s, s, s));
      inst.abacus.push(mtx(x, 9.07 * s, z, s, s, s));
      inst.volute.push(mtx(x, 8.82 * s, z - .66 * s, s, s, s), mtx(x, 8.82 * s, z + .66 * s, s, s, s));
    }

    const shafts = [], pools = [], spinners = [];
    function addMesh(geo, mat, x, y, z, parent = world, reflect = true) {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m);
      if (reflect && parent === world) { const r = m.clone(); mirror.add(r); m.userData.mirror = r; }
      return m;
    }

    function buildHall(z0, wallZ, { halfW = 5, wallX = 10.5, floorFrom = z0 + 1, transverse = true, colEnd = wallZ + 4, seed = 0 } = {}) {
      const zs = [];
      for (let z = z0; z >= colEnd; z -= SPACING) zs.push(z);
      zs.forEach((z, i) => {
        for (const sx of [-1, 1]) addColumn(sx * halfW, z);
        if (i < zs.length - 1) for (const sx of [-1, 1]) inst.arcade.push(mtx(sx * halfW, 9.22, z - SPACING / 2));
        if (transverse && i % 2 === 0) inst.transverse.push(mtx(0, 9.22, z, halfW / 5, 1, 1));
      });
      const len = floorFrom - wallZ, mid = (floorFrom + wallZ) / 2;
      // beams above the arcades
      const beamLen = zs[0] - zs[zs.length - 1] + 1.8;
      for (const sx of [-1, 1]) {
        const bm = addMesh(uvScale(new THREE.BoxGeometry(1.7, .9, beamLen), beamLen / 6, .3), M.marble, sx * halfW, 12.5, (zs[0] + zs[zs.length - 1]) / 2);
        bm.userData.arch = true;
      }
      // floor
      const floor = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(wallX * 2, len), wallX * 2 / 7, len / 7), M.floor);
      floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, mid); floor.renderOrder = -1; world.add(floor);
      // side walls
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(len, 17), len / 8, 17 / 8), M.wall);
        w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * wallX, 8.5, mid); world.add(w);
      }
      // light shafts + pools on the floor
      let k = 0;
      for (let z = z0 - 3; z > wallZ + 7; z -= 8.5, k++) {
        const sx = (k + seed) % 2 ? -1 : 1, x = sx * rand(1.6, 3.6), tilt = sx * rand(.22, .34);
        for (const ry of [0, Math.PI / 2]) {
          const s = new THREE.Mesh(new THREE.PlaneGeometry(rand(2.6, 3.8), 22), M.shaft);
          s.position.set(x + Math.sin(tilt) * 8, 10, z); s.rotation.set(0, ry, tilt, 'YXZ'); s.renderOrder = 2;
          world.add(s); shafts.push(s);
        }
        const p = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), M.pool);
        p.rotation.x = -Math.PI / 2; p.position.set(x - Math.sin(tilt) * 1.5, .03, z); p.renderOrder = 1; world.add(p); pools.push(p);
      }
      // pedestals with small objects ("objects" of the Object Room)
      const peds = [];
      for (let z = z0 - 6; z > wallZ + 8; z -= 13) peds.push(z);
      peds.forEach((z, i) => {
        const sx = (i + seed) % 2 ? 1 : -1, x = sx * (halfW + 2.7);
        addMesh(uvScale(new THREE.BoxGeometry(1.1, 1.9, 1.1), .3, .5), M.marble, x, .95, z);
        addMesh(new THREE.BoxGeometry(1.4, .16, 1.4), M.marble, x, 1.98, z);
        const kind = (i + seed) % 3;
        const geo = kind === 0 ? new THREE.TorusKnotGeometry(.42, .13, 140, 16) : kind === 1 ? new THREE.IcosahedronGeometry(.62, 0) : new THREE.TorusGeometry(.5, .16, 16, 60);
        const obj = addMesh(geo, kind === 1 ? M.marble : M.gold, x, 2.85, z);
        spinners.push(obj);
      });
    }

    /* ---------------- frames */
    function buildFrame(W, H, label) {
      const g = new THREE.Group(), w = W / 2, h = H / 2;
      const add = (geo, mat, z = 0, x = 0, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
      add(ringGeo(w + 1.28, h + 1.28, w + .98, h + .98, .1, .12, 3), M.gold, .12);
      add(ringGeo(w + 1.02, h + 1.02, w + .5, h + .5, .26, .3, 6), M.gold, .32);
      add(ringGeo(w + .52, h + .52, w + .26, h + .26, .14, .1, 3), M.gold, .3);
      add(ringGeo(w + .27, h + .27, w + .06, h + .06, .05, .04, 2), M.goldDark, .16);
      const ros = new THREE.TorusGeometry(.32, .1, 10, 28), knob = new THREE.SphereGeometry(.21, 18, 12), bead = new THREE.SphereGeometry(.15, 14, 10);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        add(ros, M.gold, .78, sx * (w + .76), sy * (h + .76));
        add(knob, M.gold, .86, sx * (w + .76), sy * (h + .76));
      }
      for (const sx of [-1, 1]) add(bead, M.gold, .8, sx * (w + .76), 0);
      add(bead, M.gold, .8, 0, -(h + .76));
      const cart = add(new THREE.SphereGeometry(.5, 24, 14), M.gold, .78, 0, h + .8); cart.scale.set(1.35, .62, .38);
      const cartRing = add(new THREE.TorusGeometry(.62, .08, 8, 36), M.gold, .82, 0, h + .8); cartRing.scale.set(1.25, .75, 1);
      if (label) {
        const pt = tex(plaqueTexture(label));
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(W + 2.4, (W + 2.4) / 8), new THREE.MeshBasicMaterial({ map: pt, transparent: true, depthWrite: false, toneMapped: false, color: '#e7d3ad' }));
        pl.position.set(0, h + 2.25, .2); g.add(pl);
      }
      return g;
    }

    function imageSize(img) {
      const a = img ? (img.naturalWidth || img.width) / (img.naturalHeight || img.height) : .8;
      let H = 7.6, W = H * a;
      if (W > 7.2) { W = 7.2; H = W / a; }
      return { W, H, a };
    }

    function imageTexture(src) {
      const t = src instanceof HTMLCanvasElement ? new THREE.CanvasTexture(src) : new THREE.Texture(src);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.needsUpdate = true; owned.textures.push(t);
      return t;
    }

    function imagePoints(src, W, H, tint) {
      const cols = coarse ? 110 : 170, a = W / H, rows = Math.max(8, Math.round(cols / a));
      let data = null;
      try {
        const c = cnv(cols, rows), g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(src, 0, 0, cols, rows); data = g.getImageData(0, 0, cols, rows).data;
      } catch { data = null; }
      const n = cols * rows, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), rnd = new Float32Array(n * 4);
      for (let y = 0, i = 0; y < rows; y++) for (let x = 0; x < cols; x++, i++) {
        pos[i * 3] = (x / (cols - 1) - .5) * W; pos[i * 3 + 1] = (.5 - y / (rows - 1)) * H; pos[i * 3 + 2] = 0;
        if (data) { col[i * 3] = data[i * 4] / 255; col[i * 3 + 1] = data[i * 4 + 1] / 255; col[i * 3 + 2] = data[i * 4 + 2] / 255; }
        else { col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = Math.random(); }
        rnd[i * 4] = Math.random(); rnd[i * 4 + 1] = Math.pow(Math.random(), 1.6); rnd[i * 4 + 2] = Math.random(); rnd[i * 4 + 3] = Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uE: { value: 0 }, uTime: { value: 0 }, uScale: { value: 800 }, uSize: { value: (W / cols) * 1.55 }, uAlpha: { value: 1 }, uTint: { value: hexV3(tint) } },
        vertexShader: POINTS_VS, fragmentShader: POINTS_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
      return pts;
    }

    const drumGeo = flute(new THREE.CylinderGeometry(.6, .6, 1.3, 60, 1, false), 20, .08);
    const blockGeo = new THREE.BoxGeometry(1.2, .5, 1.2);
    const ringGeoBig = new THREE.TorusGeometry(6.6, .07, 8, 140);

    /* ---------------- build sections */
    buildHall(SEC[0].z0, SEC[0].wall, { floorFrom: 27, seed: 0 });
    buildHall(SEC[1].z0, SEC[1].wall, { seed: 1 });
    buildHall(SEC[2].z0, SEC[2].wall, { seed: 2 });
    buildHall(FIN.z0, FIN.wall, { halfW: 13, wallX: 16.5, transverse: false, colEnd: FIN.wall + 7, seed: 1 });

    const sections = SEC.map((s, i) => {
      const p = projects[i], mood = MOODS[i], img = images[i] || fallbackArt(p, i);
      const { W, H } = imageSize(img);
      const map = imageTexture(img);
      const iw = W / 2 + .06, ih = H / 2 + .06, wallX = 10.5, top = 26;
      // wall with an opening the size of the picture
      const box = (w, h, x, y) => addMesh(uvScale(new THREE.BoxGeometry(w, h, 1), w / 7, h / 7), M.wall, x, y, s.wall - .5);
      box(wallX - iw, top, -(wallX + iw) / 2, top / 2);
      box(wallX - iw, top, (wallX + iw) / 2, top / 2);
      box(iw * 2, top - (FY + ih), 0, (top + FY + ih) / 2);
      box(iw * 2, FY - ih, 0, (FY - ih) / 2);
      // cornice + pediment
      addMesh(uvScale(new THREE.BoxGeometry(W + 4.4, .9, 1.1), 1, .12), M.marble, 0, FY + H / 2 + 2.1, s.wall + .1);
      const ped = new THREE.Shape(); const pw = W / 2 + 2.1;
      ped.moveTo(-pw, 0); ped.lineTo(pw, 0); ped.lineTo(0, 1.75); ped.lineTo(-pw, 0);
      const pedGeo = new THREE.ExtrudeGeometry(ped, { depth: .6, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2 });
      uvScale(pedGeo, .12, .12);
      addMesh(pedGeo, M.marble, 0, FY + H / 2 + 2.55, s.wall - .1);
      const plq = new THREE.Mesh(new THREE.PlaneGeometry(7.2, .9), new THREE.MeshBasicMaterial({ map: tex(plaqueTexture(`${ROMAN[i]} · ${p.name.toUpperCase()}`)), transparent: true, depthWrite: false, toneMapped: false, color: '#f1dcb2' }));
      plq.position.set(0, FY + H / 2 + 2.1, s.wall + .67); world.add(plq);

      // the frame itself (tilts toward the cursor)
      const frameHolder = new THREE.Group(); frameHolder.position.set(0, FY, s.wall + .02); world.add(frameHolder);
      const frame = buildFrame(W, H); frameHolder.add(frame);
      const image = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, color: '#ece6dc' }));
      image.position.z = .05; frame.add(image);
      const mFrame = frameHolder.clone(); mirror.add(mFrame);

      // the era beyond
      const points = imagePoints(img, W, H, mood.era.tint);
      points.position.set(0, FY, s.wall + .03); points.visible = false; scene.add(points);
      const era = new THREE.Group(); era.visible = false; scene.add(era);
      const nFrag = coarse ? 22 : 36;
      const frags = new THREE.InstancedMesh(drumGeo, M.marble, nFrag), blocks = new THREE.InstancedMesh(blockGeo, M.marble, Math.round(nFrag / 2));
      const fragData = [];
      const placeFrag = () => {
        const z = s.wall - 3 - Math.random() * 23, a = Math.random() * Math.PI * 2, r = rand(3.2, 9.5);
        return { pos: new THREE.Vector3(Math.cos(a) * r, FY + Math.sin(a) * r * .7, z), rot: new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6)), spin: new THREE.Vector3(rand(-.3, .3), rand(-.4, .4), rand(-.2, .2)), s: rand(.45, 1.35), bob: rand(0, 6) };
      };
      for (let k = 0; k < nFrag; k++) fragData.push({ mesh: frags, idx: k, ...placeFrag() });
      for (let k = 0; k < blocks.count; k++) fragData.push({ mesh: blocks, idx: k, ...placeFrag() });
      era.add(frags, blocks);
      const rings = [];
      for (let k = 0; k < 5; k++) {
        const r = new THREE.Mesh(ringGeoBig, M.gold); r.position.set(0, FY, s.wall - 4 - k * 4.6);
        r.userData.base = new THREE.Euler(rand(-.25, .25), rand(-.25, .25), rand(0, 6)); r.scale.setScalar(1 + k * .07);
        era.add(r); rings.push(r);
      }
      // the back of the canvas: back-lit painting, stretcher bars, light beyond
      const back = new THREE.Group(); back.position.set(0, FY, s.veil + .5); era.add(back);
      const BW = W * 2.6, BH = H * 2.6;
      const backImg = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: mood.era.tint }));
      backImg.scale.x = -1; backImg.position.z = -.1; back.add(backImg);
      const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .35), M.wood); m.position.set(x, y, .15); back.add(m); };
      bar(BW + .9, .7, 0, BH / 2 + .1); bar(BW + .9, .7, 0, -BH / 2 - .1); bar(.7, BH, -BW / 2 - .1, 0); bar(.7, BH, BW / 2 + .1, 0);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshBasicMaterial({ map: glowMap, color: mood.era.light, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      glow.position.set(0, FY, s.veil + .25); era.add(glow);
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), M.backdrop); backdrop.position.set(0, FY, s.veil); scene.add(backdrop);
      // a shaft of light falling on the frame
      const fs = new THREE.Mesh(new THREE.PlaneGeometry(W + 3, 20), M.shaft); fs.position.set(0, FY + 7, s.wall + 4.5); fs.rotation.x = -.42; fs.renderOrder = 2; world.add(fs);
      return { s, i, W, H, frameHolder, mFrame, image, points, era, fragData, frags, blocks, rings, backImg };
    });

    /* ---------------- finale: the grand wall */
    const fin = { holders: [] };
    {
      const wz = FIN.wall, wallX = 16.5;
      addMesh(uvScale(new THREE.BoxGeometry(wallX * 2, 22, 1), 4, 3), M.wall, 0, 11, wz - .5);
      addMesh(uvScale(new THREE.BoxGeometry(wallX * 2, .6, 1.3), 4, .1), M.marble, 0, 14.6, wz + .2);
      addMesh(uvScale(new THREE.BoxGeometry(wallX * 2, .35, 1.0), 4, .1), M.marble, 0, .9, wz + .1);
      const ped = new THREE.Shape(); ped.moveTo(-11, 0); ped.lineTo(11, 0); ped.lineTo(0, 3.6); ped.lineTo(-11, 0);
      const pg = new THREE.ExtrudeGeometry(ped, { depth: .8, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 2 }); uvScale(pg, .06, .06);
      addMesh(pg, M.marble, 0, 14.9, wz - .2);
      const inner = new THREE.Shape(); inner.moveTo(-8.6, .55); inner.lineTo(8.6, .55); inner.lineTo(0, 2.95); inner.lineTo(-8.6, .55);
      addMesh(new THREE.ExtrudeGeometry(inner, { depth: .12, bevelEnabled: false }), M.gold, 0, 14.9, wz + .62);
      const plq = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.75), new THREE.MeshBasicMaterial({ map: tex(plaqueTexture('OMNIA · TEMPORA · VNVS · FABER')), transparent: true, depthWrite: false, toneMapped: false, color: '#f3dfb6' }));
      plq.position.set(0, 13.35, wz + .1); world.add(plq);
      const group = new THREE.Group(); group.position.set(0, FY, wz + .02); world.add(group);
      sections.forEach((S, i) => {
        const h = new THREE.Group(); h.position.x = (i - 1) * 10.4; group.add(h);
        const f = buildFrame(S.W, S.H, `${ROMAN[i]} · ${projects[i].name.toUpperCase()}`); h.add(f);
        const im = new THREE.Mesh(new THREE.PlaneGeometry(S.W, S.H), new THREE.MeshBasicMaterial({ map: S.image.material.map, toneMapped: false, color: '#ece6dc' }));
        im.position.z = .05; f.add(im);
        fin.holders.push(h);
      });
      fin.group = group;
      const mg = group.clone(); mirror.add(mg); fin.mirror = mg;
      const fs = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), M.shaft); fs.position.set(0, FY + 7, wz + 5); fs.rotation.x = -.42; fs.renderOrder = 2; world.add(fs);
    }

    /* ---------------- instanced architecture */
    const instMeshes = [];
    for (const [k, list] of Object.entries(inst)) {
      if (!list.length) continue;
      const mat = k === 'volute' ? M.gold : M.marble;
      const im = new THREE.InstancedMesh(parts[k], mat, list.length);
      list.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
      world.add(im); instMeshes.push(im);
      const r = new THREE.InstancedMesh(parts[k], mat, list.length);
      list.forEach((m, i) => r.setMatrixAt(i, m));
      r.instanceMatrix.needsUpdate = true; r.computeBoundingSphere(); mirror.add(r);
    }

    /* ---------------- dust */
    const dustN = coarse ? 2200 : 4200;
    const dpos = new Float32Array(dustN * 3), drnd = new Float32Array(dustN * 4);
    for (let i = 0; i < dustN; i++) {
      dpos[i * 3] = rand(-9.5, 9.5); dpos[i * 3 + 1] = rand(.2, 15); dpos[i * 3 + 2] = rand(FIN.wall, 26);
      for (let k = 0; k < 4; k++) drnd[i * 4 + k] = Math.random();
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    dustGeo.setAttribute('aRnd', new THREE.BufferAttribute(drnd, 4));
    const dustMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uScale: { value: 800 }, uColor: { value: hexV3('#ffd29a') } }, vertexShader: DUST_VS, fragmentShader: DUST_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; scene.add(dust);

    /* ---------------- palette along Z */
    const P = [];
    const pk = (z, mood, exp, near, far) => P.push({ z, fog: new THREE.Color(mood.fog), light: new THREE.Color(mood.light), exp, near, far });
    pk(30, { fog: '#030202', light: '#d9a46a' }, .32, 4, 34);
    pk(6, MOODS[0].hall, 1, 8, 62);
    SEC.forEach((s, i) => {
      pk(s.wall + 3, MOODS[i].hall, 1.08, 8, 62);
      pk(s.wall - 5, MOODS[i].era, 1.15, 3, 48);
      pk(s.veil + 1.5, MOODS[i].era, 1.3, 3, 48);
      const next = MOODS[i + 1]?.hall ?? FIN_MOOD;
      pk(s.veil - 3.5, next, 1.05, 8, i === 2 ? 90 : 62);
    });
    pk(FIN.wall, FIN_MOOD, 1.08, 10, 95);
    const pal = { fog: new THREE.Color(), light: new THREE.Color(), exp: 1, near: 8, far: 60 };
    function palette(z) {
      let i = 0;
      while (i < P.length - 2 && z < P[i + 1].z) i++;
      const a = P[i], b = P[i + 1], t = smooth(a.z, b.z, z);
      pal.fog.lerpColors(a.fog, b.fog, t); pal.light.lerpColors(a.light, b.light, t);
      pal.exp = a.exp + (b.exp - a.exp) * t; pal.near = a.near + (b.near - a.near) * t; pal.far = a.far + (b.far - a.far) * t;
      return pal;
    }

    /* ---------------- camera path */
    const K = [];
    const kf = (p, pos, look, roll = 0) => K.push({ p, pos: new THREE.Vector3(...pos), look: new THREE.Vector3(...look), roll });
    kf(0, [0, 1.05, 24], [0, 8.2, -6]);
    kf(.06, [.6, 2.2, 17], [0, 4.6, -18]);
    SEC.forEach((s, i) => {
      const [a, b] = s.p, T = t => a + (b - a) * t, side = i % 2 ? -1 : 1;
      const faceZ = s.wall + 15, entry = i === 0 ? 4 : s.z0 - 3;
      kf(T(.12), [side * 2.6, 2.6, entry], [-side * 3.2, 4.2, entry - 16], -side * .03);
      kf(T(.32), [-side * 1.5, 3.8, (faceZ + entry) / 2], [side * 1.4, 5.6, s.wall], side * .02);
      kf(T(.45), [0, 5.3, faceZ], [0, FY, s.wall]);
      kf(T(.57), [0, FY, s.wall + 6.4], [0, FY, s.wall]);
      kf(T(.65), [0, FY, s.wall - 2], [0, FY, s.wall - 22], side * .14);
      kf(T(.78), [side * 1.0, FY + .5, s.wall - 11], [-side * .8, FY, s.wall - 32], side * .035);
      kf(T(.91), [-side * .7, FY - .3, s.wall - 21], [0, FY - .4, s.veil - 14], -side * .03);
      kf(T(1), [0, FY - .4, s.veil - 1.6], [0, FY - .6, s.veil - 20]);
    });
    kf(.905, [0, FY, FIN.wall + 8], [0, FY, FIN.wall]);
    kf(.97, [0, FY - .6, FIN.wall + FIN.dist], [0, FY - 3, FIN.wall]);
    kf(1, [0, FY - .7, FIN.wall + FIN.dist + .8], [0, FY - 3.1, FIN.wall]);
    const posCurve = new THREE.CatmullRomCurve3(K.map(k => k.pos), false, 'centripetal');
    const lookCurve = new THREE.CatmullRomCurve3(K.map(k => k.look), false, 'centripetal');
    const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), roll: 0 };
    function sample(p) {
      let i = 0;
      while (i < K.length - 2 && p > K[i + 1].p) i++;
      const a = K[i], b = K[i + 1], t = clamp((p - a.p) / (b.p - a.p));
      const u = (i + t) / (K.length - 1);
      posCurve.getPoint(u, cam.pos); lookCurve.getPoint(u, cam.look);
      cam.roll = a.roll + (b.roll - a.roll) * smooth(0, 1, t);
      return cam;
    }

    /* ---------------- resize */
    const dbs = new THREE.Vector2();
    function resize() {
      const w = innerWidth, h = innerHeight, aspect = w / h;
      renderer.setSize(w, h, false);
      camera.aspect = aspect; camera.fov = aspect < .8 ? 64 : aspect < 1.2 ? 56 : 48; camera.updateProjectionMatrix();
      renderer.getDrawingBufferSize(dbs);
      const sc = dbs.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      sections.forEach(S => { S.points.material.uniforms.uScale.value = sc; });
      dustMat.uniforms.uScale.value = sc;
      const visW = 2 * FIN.dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * aspect;
      const s = clamp(visW * .9 / 31, .3, 1);
      fin.group.scale.setScalar(s); fin.mirror.scale.setScalar(s);
      fin.group.position.y = FY + (aspect < .8 ? 2.4 : .6); fin.mirror.position.y = fin.group.position.y;
    }
    resize();
    addEventListener('resize', resize, { signal });

    /* ---------------- input */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1;
    }, { signal, passive: true });
    document.addEventListener('pointerleave', () => { mouse.tx = 0; mouse.ty = 0; }, { signal });

    /* ---------------- scroll */
    const track = $('.fr-track');
    let target = 0, prog = 0, lenis = null, ctx = null, gsap = null, tickerFn = null, lenisFn = null, rafId = 0;
    const readNative = () => { const r = track.getBoundingClientRect(); target = clamp(-r.top / Math.max(1, r.height - innerHeight)); };
    const scrollToP = p => {
      const r = track.getBoundingClientRect(), y = scrollY + r.top + p * (r.height - innerHeight);
      if (lenis) lenis.scrollTo(y, { duration: 2.4 }); else scrollTo({ top: y, behavior: 'smooth' });
    };
    if (libs) {
      const [{ gsap: G }, { ScrollTrigger }, { default: Lenis }] = libs;
      gsap = G; gsap.registerPlugin(ScrollTrigger);
      lenis = new Lenis({ lerp: .1 });
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

    $$('[data-go]').forEach(b => b.addEventListener('click', () => { const s = SEC[+b.dataset.go]; scrollToP(s.p[0] + (s.p[1] - s.p[0]) * .47); }, { signal }));
    $('[data-top]').addEventListener('click', () => scrollToP(0), { signal });

    /* ---------------- UI refs */
    const ui = {
      intro: $('.fr-intro'), title: $('.fr-title'), chapter: $('.fr-chapter'), chNum: $('.fr-chapter-num'), chLabel: $('.fr-chapter-label'), chKo: $('.fr-chapter-ko'),
      ghost: $('.fr-ghost'), ghostSpan: $('.fr-ghost span'), cards: $$('.fr-card'), finale: $('.fr-finale'), navItems: $$('.fr-progress li'), bar: $('.fr-progress-bar b'),
      flash: $('.fr-flash'), dof: $('.fr-dof'), bars: $('.fr-bars'), loading: $('.fr-loading')
    };
    ui.loading.remove();
    el.classList.add('is-live');
    const state = { chapter: -1, ghost: -1, cardVis: [false, false, false], finVis: false, blur: -1, nav: -2 };

    const dummy = new THREE.Object3D();
    let time = 0, last = performance.now(), introT = 0;

    function updateUI(p, cz, flash, blur, bars) {
      // intro
      introT = isPaused() ? 1 : Math.min(1, introT + .012);
      const auto = .55 * (1 - Math.pow(1 - introT, 3));
      const a = Math.max(auto, smooth(0, .032, p)), x = smooth(.036, .075, p);
      el.style.setProperty('--a', a.toFixed(4));
      el.style.setProperty('--x', x.toFixed(4));
      ui.intro.style.visibility = x >= .999 ? 'hidden' : '';
      // chapter label + cards + ghost word
      let ch = -1, chV = 0, ghostV = 0, ghostT = 0, ghostI = -1;
      SEC.forEach((s, i) => {
        const t = (p - s.p[0]) / (s.p[1] - s.p[0]);
        if (t >= 0 && t < .45) { ch = i; chV = smooth(.02, .09, t) * (1 - smooth(.3, .42, t)); }
        const v = smooth(.6, .68, t) * (1 - smooth(.93, .99, t));
        const card = ui.cards[i];
        card.style.opacity = v.toFixed(3);
        card.style.transform = `translate3d(0, ${((1 - v) * 40).toFixed(1)}px, 0) scale(${(.96 + v * .04).toFixed(4)})`;
        const vis = v > .5;
        if (vis !== state.cardVis[i]) { state.cardVis[i] = vis; card.inert = !vis; card.setAttribute('aria-hidden', String(!vis)); card.classList.toggle('is-on', vis); }
        if (t > .58 && t < 1) { ghostI = i; ghostT = (t - .58) / .42; ghostV = smooth(0, .12, ghostT) * (1 - smooth(.85, 1, ghostT)); }
      });
      if (ch !== -1 && ch !== state.chapter) {
        state.chapter = ch; ui.chNum.textContent = ROMAN[ch]; ui.chLabel.textContent = `Gallery ${ROMAN[ch]} — ${MOODS[ch].hallName}`; ui.chKo.textContent = MOODS[ch].hallKo;
      }
      ui.chapter.style.opacity = chV.toFixed(3);
      ui.chapter.style.transform = `translate3d(${((1 - chV) * -24).toFixed(1)}px,0,0)`;
      if (ghostI !== -1 && ghostI !== state.ghost) { state.ghost = ghostI; ui.ghostSpan.textContent = projects[ghostI].name; ui.ghost.style.setProperty('--mood', MOODS[ghostI].era.light); }
      ui.ghost.style.opacity = ghostV.toFixed(3);
      ui.ghostSpan.style.transform = `translate3d(${(30 - ghostT * 90).toFixed(2)}vw,0,0)`;
      // finale
      const f = smooth(.925, .975, p);
      el.style.setProperty('--f', f.toFixed(4));
      const fv = f > .5;
      if (fv !== state.finVis) { state.finVis = fv; ui.finale.inert = !fv; ui.finale.setAttribute('aria-hidden', String(!fv)); }
      // progress
      let n = -1;
      SEC.forEach((s, i) => { if (p >= s.p[0] - .02) n = i; });
      if (p >= .88) n = 3;
      if (n !== state.nav) { state.nav = n; ui.navItems.forEach((li, i) => { li.classList.toggle('is-active', i === n); li.classList.toggle('is-past', n > i); }); }
      ui.bar.style.transform = `scaleY(${p.toFixed(4)})`;
      el.style.setProperty('--hud', (smooth(.05, .09, p) * (1 - smooth(.9, .95, p))).toFixed(3));
      // transition overlays
      ui.flash.style.opacity = Math.min(1, flash).toFixed(3);
      const b = Math.round(blur * 2) / 2;
      if (b !== state.blur) { state.blur = b; const v = b > .4 ? `blur(${b}px)` : 'none'; ui.dof.style.backdropFilter = v; ui.dof.style.webkitBackdropFilter = v; }
      el.style.setProperty('--bars', bars.toFixed(3));
    }

    function frame(now) {
      if (disposed) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (document.hidden) return;
      const paused = isPaused();
      el.classList.toggle('is-paused', paused);
      if (!paused) time += dt;
      prog += (target - prog) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - prog) < 1e-5) prog = target;
      const p = prog;

      // camera
      mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 3.2));
      mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 3.2));
      sample(p);
      const sway = paused ? 0 : Math.sin(time * .35) * .06;
      camera.position.set(cam.pos.x + mouse.x * .45, cam.pos.y - mouse.y * .25 + sway, cam.pos.z);
      camera.up.set(0, 1, 0);
      camera.lookAt(cam.look.x + mouse.x * 1.5, cam.look.y - mouse.y * .95, cam.look.z);
      camera.rotateZ(cam.roll);
      const cz = camera.position.z;

      // light & atmosphere
      palette(cz);
      scene.fog.color.copy(pal.fog); scene.background.copy(pal.fog); M.backdrop.color.copy(pal.fog);
      scene.fog.near = pal.near; scene.fog.far = pal.far;
      hemi.color.copy(pal.light); key.color.copy(pal.light); camLight.color.copy(pal.light);
      M.shaft.color.copy(pal.light); M.pool.color.copy(pal.light);
      dustMat.uniforms.uColor.value.set(pal.light.r, pal.light.g, pal.light.b);
      dustMat.uniforms.uTime.value = time;
      camLight.position.set(camera.position.x, camera.position.y + .6, cz - 2.5);
      M.shaft.opacity = .12 + (paused ? 0 : Math.sin(time * .7) * .02);

      let flash = 0, blur = 0, bars = 0, wallAhead = FIN.wall;
      for (const S of sections) {
        const s = S.s;
        if (cz > s.wall - .5 && wallAhead === FIN.wall) wallAhead = s.wall;
        const e = smooth(s.wall + 3.5, s.wall - 20, cz);
        S.points.visible = cz < s.wall + 8 && cz > s.veil - 2;
        const u = S.points.material.uniforms;
        u.uE.value = e; u.uTime.value = time; u.uAlpha.value = smooth(s.veil - .5, s.veil + 6, cz);
        const op = smooth(s.wall + 2, s.wall + 6, cz);
        S.image.material.opacity = op; S.image.visible = op > .002;
        S.era.visible = cz < s.wall + 28 && cz > s.veil - 2.5;
        if (S.era.visible) {
          for (const d of S.fragData) {
            dummy.position.copy(d.pos); dummy.position.y += Math.sin(time * .6 + d.bob) * .3;
            dummy.rotation.set(d.rot.x + time * d.spin.x, d.rot.y + time * d.spin.y, d.rot.z + time * d.spin.z);
            dummy.scale.setScalar(d.s * (.4 + .6 * e)); dummy.updateMatrix();
            d.mesh.setMatrixAt(d.idx, dummy.matrix);
          }
          S.frags.instanceMatrix.needsUpdate = true; S.blocks.instanceMatrix.needsUpdate = true;
          S.rings.forEach((r, k) => { const b = r.userData.base; r.rotation.set(b.x + Math.sin(time * .3 + k) * .12, b.y + Math.cos(time * .25 + k) * .12, b.z + time * (k % 2 ? .08 : -.06)); });
          S.backImg.material.opacity = .25 + .45 * smooth(s.veil + 22, s.veil + 2, cz);
        }
        flash += Math.exp(-(((cz - s.wall) / 1.3) ** 2)) * .42 + Math.exp(-(((cz - s.veil) / 2.1) ** 2));
        blur += Math.exp(-(((cz - s.wall) / 2.4) ** 2)) * 9 + Math.exp(-(((cz - s.veil) / 2.8) ** 2)) * 14;
        bars = Math.max(bars, smooth(s.wall + 5, s.wall - 1, cz) * smooth(s.veil - 1, s.veil + 4, cz));
        // frame leans toward the cursor when near
        const d = cz - s.wall, near = d > 0 ? 1 - clamp((d - 6) / 22) : 0;
        const fh = S.frameHolder;
        fh.rotation.y += (mouse.x * .07 * near - fh.rotation.y) * .08;
        fh.rotation.x += (mouse.y * .05 * near - fh.rotation.x) * .08;
        S.mFrame.rotation.copy(fh.rotation);
      }
      // finale frames
      const fNear = cz < SEC[2].veil - 2 ? 1 : 0;
      fin.holders.forEach((h, i) => {
        const tx = mouse.x * .09 * fNear - (i - 1) * .05 * fNear, ty = mouse.y * .06 * fNear;
        h.rotation.y += (tx - h.rotation.y) * .07; h.rotation.x += (ty - h.rotation.x) * .07;
        fin.mirror.children[i].rotation.copy(h.rotation);
      });
      spinners.forEach((o, i) => { if (!paused) { o.rotation.y += dt * (.35 + (i % 3) * .1); o.rotation.x += dt * .12; o.userData.mirror?.rotation.copy(o.rotation); } });
      spot.position.set(0, FY + 8.5, wallAhead + 9); spot.target.position.set(0, FY, wallAhead);

      renderer.toneMappingExposure = pal.exp + Math.min(1.2, flash) * 1.4;
      updateUI(p, cz, flash, blur, bars);
      renderer.render(scene, camera);
    }

    if (gsap) { tickerFn = () => frame(performance.now()); gsap.ticker.add(tickerFn); }
    else { const loop = now => { rafId = requestAnimationFrame(loop); frame(now); }; rafId = requestAnimationFrame(loop); }

    teardown = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (gsap) { if (tickerFn) gsap.ticker.remove(tickerFn); if (lenisFn) gsap.ticker.remove(lenisFn); gsap.ticker.lagSmoothing(500, 33); }
      ctx?.revert(); lenis?.destroy();
      const geos = new Set(), mats = new Set();
      scene.traverse(o => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
        if (o.isInstancedMesh) o.dispose?.();
      });
      Object.values(parts).forEach(g => g && geos.add(g));
      geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose());
      Object.values(M).forEach(m => m.dispose());
      owned.textures.forEach(t => t.dispose());
      owned.disposables.forEach(d => d.dispose());
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
