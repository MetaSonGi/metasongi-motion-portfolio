// "A Little Journey" — world `journey` (02 · CHARACTER WORLD).
// A third-person toy-diorama: a little explorer walks a winding path across a floating archipelago.
// Scroll walks the path (with cinematic swings at three landmark islands, one per project);
// WASD / arrows / joystick take free control, Space jumps, E or a click waves.
import * as THREE from 'three';
import { projects, profileURL } from '../content.js?v=ten-worlds-1';

const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs'
};
const ART = { vrm: 'art/vrm.jpg', pixelle: 'art/glass.jpg', motion: 'art/orbit.jpg' };
const TRACK_VH = 900;
const TAU = Math.PI * 2;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const dampK = (rate, dt) => 1 - Math.exp(-rate * dt);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hexV3 = hex => { const n = parseInt(hex.slice(1), 16); return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
function mulberry(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ------------------------------------------------------------------ world data */

const ZONES = [
  { en: 'Hologram Bay', ko: '홀로그램 만', color: '#9b6bff', glow: '#7ee8ff', stop: [13.5, -24.5], build: [20.5, -28.5], r: 3.6 },
  { en: 'Crystal Workshop', ko: '크리스탈 공방', color: '#19a892', glow: '#9ff3e6', stop: [-3.8, -53], build: [-11.5, -56], r: 3.2 },
  { en: 'Orbit Observatory', ko: '궤도 관측소', color: '#ef7d2e', glow: '#ffd27a', stop: [14.3, -85], build: [21.5, -88.5], r: 2.4 }
];

const BIOMES = {
  meadow: { grass: ['#8fd16a', '#84c95f', '#9ad874', '#7fc25a'], tree: 'round', leaves: ['#5fb84f', '#6cc35a', '#4fa845', '#7fcf5c'], flowers: ['#fff3a3', '#ffffff', '#ffb3c7', '#ffd36e'] },
  holo: { grass: ['#a3df8c', '#96d77f', '#b1e69c'], tree: 'blossom', leaves: ['#f7a8d8', '#e3a6ff', '#ffc4e6', '#d59cf5'], flowers: ['#c79bff', '#ff9fd0', '#ffffff', '#9fe9ff'] },
  crystal: { grass: ['#7fd6b3', '#72cca8', '#8ddfbf'], tree: 'pine', leaves: ['#3f9e86', '#358f7a', '#4cae92', '#2f8573'], flowers: ['#a8f0ff', '#ffffff', '#c7b5ff'] },
  autumn: { grass: ['#d7cf6b', '#ccc25c', '#e1d97e'], tree: 'round', leaves: ['#ff9f43', '#f6c14a', '#ee7b3e', '#e8613a'], flowers: ['#ff6b6b', '#ffd166', '#ffffff'] },
  sunset: { grass: ['#a8d77c', '#9bcf70', '#b3de88'], tree: 'blossom', leaves: ['#ffb7c5', '#ff9eb5', '#ffd1dc', '#ffc2d1'], flowers: ['#ffffff', '#ffd6e0', '#ffe08a'] }
};

const ISLANDS = [
  { x: 0, z: 0, r: 9, h: 0, biome: 'meadow', banner: ['START', 'Sprout Meadow', '새싹 들판', '#5fb84f'] },
  { x: 16, z: -24, r: 11, h: .2, biome: 'holo', zone: 0 },
  { x: 6, z: -40, r: 4.6, h: 0, biome: 'meadow' },
  { x: -6, z: -54, r: 11, h: .1, biome: 'crystal', zone: 1 },
  { x: 4, z: -70, r: 4.6, h: 0, biome: 'crystal' },
  { x: 16, z: -84, r: 11, h: .2, biome: 'autumn', zone: 2 },
  { x: 8, z: -100, r: 4.2, h: 0, biome: 'autumn' },
  { x: -2, z: -114, r: 10, h: .1, biome: 'sunset', hill: 2.4, hillR: 7.5, banner: ['FINALE', 'Sunset Hill', '노을 언덕', '#ff8a6b'] }
];

const CTRL = [[0, 5], [.5, 0], [2.5, -5], [6, -10], [10, -15], [13, -20], [13.5, -25], [11, -31], [8, -36], [6, -40], [2, -44], [-2, -48], [-4, -53], [-3, -58], [-1, -63], [3, -68], [5, -71], [9, -76], [13, -80], [14.5, -85], [13, -91], [10, -96], [8, -100], [5, -104], [1, -108], [-1.5, -112]];

function islandH(I, x, z) {
  const d = Math.hypot(x - I.x, z - I.z);
  let h = I.h + (Math.sin(x * .55 + Math.sin(z * .4) * 1.3) * Math.cos(z * .47 - x * .21) * .16 + Math.sin(x * 1.3 + z * 1.1) * .05) * smooth(I.r, I.r * .6, d);
  if (I.hill) { const q = Math.max(0, 1 - (d / I.hillR) ** 2); h += I.hill * q * q; }
  return h;
}

/* ------------------------------------------------------------------ markup */

const TITLE_COLORS = ['#ff7a59', '#ffc23d', '#2ec4b6', '#9b6bff', '#ff8fc8'];
function titleLetters(txt) {
  let i = 0;
  return txt.split(' ').map(w => `<span class="cw-w">${[...w].map(ch => { const k = i++; return `<span class="cw-l" style="--i:${k};--c:${TITLE_COLORS[k % TITLE_COLORS.length]}">${esc(ch)}</span>`; }).join('')}</span>`).join(' ');
}

const HERO_SVG = `<svg class="cws-hero" viewBox="0 0 140 170" aria-hidden="true">
  <ellipse cx="70" cy="160" rx="34" ry="7" fill="#3a2e4f" opacity=".15"/>
  <rect x="50" y="118" width="15" height="34" rx="7" fill="#5466d6"/><rect x="75" y="118" width="15" height="34" rx="7" fill="#5466d6"/>
  <ellipse cx="57" cy="153" rx="12" ry="7" fill="#7a4b3a"/><ellipse cx="83" cy="153" rx="12" ry="7" fill="#7a4b3a"/>
  <rect x="34" y="82" width="20" height="40" rx="8" fill="#ffc23d"/>
  <rect x="42" y="78" width="56" height="52" rx="24" fill="#ff7a59"/>
  <rect x="94" y="40" width="12" height="40" rx="6" fill="#ff7a59" transform="rotate(18 100 80)"/><circle cx="111" cy="44" r="8" fill="#ffe2c2"/>
  <rect x="34" y="88" width="12" height="32" rx="6" fill="#ff7a59" transform="rotate(10 40 90)"/>
  <ellipse cx="70" cy="80" rx="26" ry="7" fill="#2ec4b6"/>
  <ellipse cx="70" cy="50" rx="36" ry="33" fill="#ffe2c2"/>
  <path d="M34 46a36 33 0 0 1 72 0z" fill="#ffd23f"/><rect x="33" y="42" width="74" height="9" rx="4.5" fill="#ff7a59"/>
  <circle cx="70" cy="14" r="6" fill="#ff7a59"/><path d="M70 9c0-6 2-9 4-11" stroke="#6fd36a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="78" cy="-2" rx="7" ry="3.5" fill="#6fd36a" transform="rotate(-25 78 -2)"/>
  <ellipse cx="58" cy="60" rx="4.5" ry="6" fill="#2d2440"/><ellipse cx="82" cy="60" rx="4.5" ry="6" fill="#2d2440"/>
  <circle cx="59.5" cy="58" r="1.6" fill="#fff"/><circle cx="83.5" cy="58" r="1.6" fill="#fff"/>
  <ellipse cx="48" cy="69" rx="6" ry="3.5" fill="#ff9aa8"/><ellipse cx="92" cy="69" rx="6" ry="3.5" fill="#ff9aa8"/>
  <path d="M65 70q5 5 10 0" stroke="#2d2440" stroke-width="2.4" fill="none" stroke-linecap="round"/>
</svg>`;

function liveMarkup(total) {
  return `
  <div class="cw" data-no-kx>
    <canvas class="cw-canvas" aria-label="작은 탐험가가 떠 있는 섬들을 여행하는 3D 장면. 스크롤하거나 WASD 키로 움직일 수 있습니다."></canvas>
    <div class="cw-vignette" aria-hidden="true"></div>
    <div class="cw-ui">
      <section class="cw-intro">
        <p class="cw-eyebrow"><span>WORLD 02</span><i></i><span>CHARACTER WORLD</span></p>
        <h1 class="cw-title" aria-label="A Little Journey">${titleLetters('A Little Journey')}</h1>
        <p class="cw-sub">작은 탐험가와 함께 떠 있는 섬들을 건너며<br>세 개의 작업을 만나 보세요.</p>
        <div class="cw-start"><span class="cw-mouse" aria-hidden="true"><i></i></span><span>스크롤하면 걷기 시작해요</span></div>
      </section>
      <div class="cw-count" title="반짝이 모으기"><b aria-hidden="true">✦</b><span class="cw-count-n">0</span><small>/ ${total}</small><span class="sr-only">개의 반짝이를 모았어요</span></div>
      <div class="cw-banner" aria-hidden="true"><small></small><strong></strong><em></em></div>
      <aside class="cw-dialog" aria-hidden="true" inert aria-labelledby="cw-dlg-title">
        <div class="cw-dlg-portrait"><img alt="" decoding="async"><span class="cw-dlg-num"></span></div>
        <div class="cw-dlg-main">
          <p class="cw-dlg-tag"><span class="cw-dlg-zone"></span><span class="cw-dlg-cat"></span></p>
          <h2 id="cw-dlg-title" class="cw-dlg-title"></h2>
          <p class="cw-dlg-text" aria-hidden="true"></p>
          <p class="cw-dlg-full sr-only"></p>
          <div class="cw-dlg-after">
            <ul class="cw-chips"></ul>
            <div class="cw-dlg-actions"><a class="cw-btn cw-btn--go" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a><button type="button" class="cw-btn cw-btn--ghost" data-close>닫기</button></div>
          </div>
        </div>
        <span class="cw-dlg-next" aria-hidden="true">▼</span>
      </aside>
      <section class="cw-fin" aria-hidden="true" inert>
        <p class="cw-eyebrow"><span>THE END</span><i></i><span>FOR NOW</span></p>
        <h2 class="cw-fin-title">Small steps,<br><em>big ideas.</em></h2>
        <p class="cw-fin-sub">작은 걸음이 모여 여기까지 왔어요.<br>다음 여정은 GitHub에서 이어집니다.</p>
        <p class="cw-fin-score"></p>
        <div class="cw-fin-actions"><a class="cw-btn cw-btn--go" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub 방문하기 <span aria-hidden="true">↗</span></a><button type="button" class="cw-btn cw-btn--ghost" data-top>처음부터 다시 <span aria-hidden="true">↑</span></button></div>
      </section>
      <button type="button" class="cw-return" aria-hidden="true" inert><span aria-hidden="true">↩</span> 경로로 돌아가기</button>
      <p class="cw-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 자유 이동</span><span><kbd>Space</kbd> 점프</span><span><kbd>E</kbd> 인사</span><span>드래그 시점 · 스크롤 여정</span></p>
      <div class="cw-mapbox" aria-hidden="true"><canvas class="cw-map"></canvas><span>MAP</span></div>
      <div class="cw-joy" aria-hidden="true"><i class="cw-joy-knob"></i></div>
      <div class="cw-pad"><button type="button" data-act="jump">점프</button><button type="button" data-act="wave">인사</button></div>
      <div class="cw-toast" role="status" aria-live="polite"></div>
      <p class="cw-loading" aria-live="polite"><i></i>섬을 띄우는 중…</p>
    </div>
    <div class="cw-track" style="height:${TRACK_VH}vh"></div>
  </div>`;
}

function staticMarkup() {
  return `
  <div class="cw cw--static" data-no-kx>
    <header class="cws-head">
      ${HERO_SVG}
      <p class="cw-eyebrow"><span>WORLD 02</span><i></i><span>CHARACTER WORLD</span></p>
      <h1 class="cws-title">A Little <em>Journey</em></h1>
      <p class="cw-sub">작은 탐험가가 세 개의 섬을 여행하며 만난 작업들을<br>그림책 한 권으로 엮었습니다.</p>
    </header>
    <ol class="cws-pages">
      ${projects.map((p, i) => `
      <li class="cws-page" style="--zc:${ZONES[i].color};--zg:${ZONES[i].glow}">
        <figure class="cws-art"><img src="${ART[p.id] || 'art/orbit.jpg'}" alt="${esc(p.name)} 대표 이미지" loading="lazy" decoding="async"><figcaption>CHAPTER 0${i + 1} · ${esc(ZONES[i].en)}</figcaption></figure>
        <div class="cws-copy">
          <p class="cw-dlg-tag"><span>${esc(ZONES[i].ko)}</span><span>${esc(p.category)}</span></p>
          <h2>${esc(p.name)}</h2>
          <p class="cws-desc">${esc(p.description)}</p>
          <p class="cws-body">${esc(p.body)}</p>
          <ul class="cw-chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          <a class="cw-btn cw-btn--go" href="${esc(p.url)}" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a>
        </div>
      </li>`).join('')}
    </ol>
    <footer class="cws-fin">
      <h2 class="cw-fin-title">Small steps, <em>big ideas.</em></h2>
      <p class="cw-fin-sub">다음 여정은 GitHub에서 이어집니다.</p>
      <a class="cw-btn cw-btn--go" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub 방문하기 <span aria-hidden="true">↗</span></a>
    </footer>
  </div>`;
}

/* ------------------------------------------------------------------ textures */

function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function softDot(inner = 'rgba(255,255,255,1)') {
  const c = cnv(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(.45, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function puffTex() {
  const c = cnv(128, 128), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(74, 54, 36, 0, TAU); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function heartTex() {
  const c = cnv(128, 128), g = c.getContext('2d');
  g.translate(64, 70); g.fillStyle = '#ff5c8a'; g.strokeStyle = '#fff'; g.lineWidth = 10; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(0, 34); g.bezierCurveTo(-60, -4, -30, -52, 0, -22); g.bezierCurveTo(30, -52, 60, -4, 0, 34); g.closePath(); g.stroke(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-18, -18, 9, 6, -.6, 0, TAU); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function signTex(title, sub, color) {
  const c = cnv(640, 220), g = c.getContext('2d');
  const r = 36; g.fillStyle = '#c98b52';
  g.beginPath(); g.roundRect ? g.roundRect(8, 8, 624, 204, r) : g.rect(8, 8, 624, 204); g.fill();
  g.fillStyle = '#e8b27a'; g.beginPath(); g.roundRect ? g.roundRect(22, 22, 596, 176, r - 12) : g.rect(22, 22, 596, 176); g.fill();
  g.strokeStyle = 'rgba(122,75,40,.25)'; g.lineWidth = 3;
  for (let y = 50; y < 200; y += 34) { g.beginPath(); g.moveTo(30, y); g.bezierCurveTo(200, y + 6, 420, y - 6, 610, y + 2); g.stroke(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#4a2e1c'; g.font = '800 64px Archivo, "Noto Sans KR", sans-serif';
  try { g.fontStretch = 'expanded'; } catch { /* ok */ }
  g.fillText(title, 320, 98);
  g.fillStyle = color; g.font = '700 36px "Noto Sans KR", sans-serif'; g.fillText(sub, 320, 160);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function fallbackArt(i) {
  const c = cnv(768, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 768, 512);
  gr.addColorStop(0, ZONES[i].color); gr.addColorStop(1, ZONES[i].glow);
  g.fillStyle = gr; g.fillRect(0, 0, 768, 512);
  g.fillStyle = '#fff'; g.font = '800 64px Archivo, sans-serif'; g.textAlign = 'center'; g.fillText(projects[i].name, 384, 270);
  return c;
}

/* ------------------------------------------------------------------ shaders */

const SKY_VS = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FS = `
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uSunCol; uniform vec3 uSunDir;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir); float h = d.y;
  vec3 c = mix(uHor, uMid, smoothstep(-0.02, 0.22, h));
  c = mix(c, uTop, smoothstep(0.22, 0.85, h));
  c = mix(c, uHor * 0.97, smoothstep(0.0, -0.25, h));
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  c += uSunCol * (smoothstep(0.9975, 0.9985, sd) * 0.9 + pow(sd, 14.0) * 0.32 + pow(sd, 3.0) * 0.08);
  gl_FragColor = vec4(c, 1.0);
}`;
const SEA_VS = `
uniform float uTime; varying vec3 vW; varying float vWave;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  float wv = sin(w.x * 0.08 + uTime * 0.8) * 1.1 + sin(w.z * 0.11 - uTime * 0.6) * 0.9 + sin((w.x + w.z) * 0.23 + uTime * 1.3) * 0.35;
  w.y += wv; vWave = wv; vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SEA_FS = `
uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFog; uniform vec3 uSun; uniform vec3 uCam;
uniform float uTime; uniform float uNear; uniform float uFar;
varying vec3 vW; varying float vWave;
void main(){
  float k = clamp(vWave * 0.22 + 0.5, 0.0, 1.0);
  vec3 c = mix(uDeep, uShallow, k);
  float s = sin(vW.x * 0.9 + uTime * 1.7) * sin(vW.z * 0.7 - uTime * 1.3);
  c += smoothstep(0.93, 1.0, s) * 0.45 * uSun;
  c = mix(c, vec3(1.0), smoothstep(1.75, 2.3, vWave) * 0.55);
  float f = smoothstep(uNear, uFar, distance(vW, uCam));
  gl_FragColor = vec4(mix(c, uFog, f), 1.0);
}`;
const HOLO_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HOLO_FS = `
uniform sampler2D map; uniform float uTime;
varying vec2 vUv;
void main(){
  vec2 uv = vUv;
  float g = step(0.975, fract(sin(floor(uTime * 7.0) * 43.17) * 1031.3));
  uv.x += g * sin(uv.y * 90.0 + uTime * 40.0) * 0.012;
  vec3 c = texture2D(map, uv).rgb;
  vec3 tint = mix(vec3(0.55, 0.92, 1.0), vec3(1.0, 0.62, 0.92), uv.y);
  float scan = 0.84 + 0.16 * sin(uv.y * 380.0 - uTime * 5.0);
  float band = 1.0 - smoothstep(0.0, 0.05, abs(fract(uv.y * 0.9 - uTime * 0.18) - 0.5));
  c = c * scan * mix(vec3(1.0), tint, 0.3) + tint * 0.06 + band * 0.18 * tint;
  float ex = max(smoothstep(0.03, 0.0, uv.x), smoothstep(0.97, 1.0, uv.x));
  float ey = max(smoothstep(0.035, 0.0, uv.y), smoothstep(0.965, 1.0, uv.y));
  c += tint * max(ex, ey) * 0.8;
  c *= 0.93 + 0.07 * sin(uTime * 23.0) * sin(uTime * 7.3);
  gl_FragColor = vec4(c, 0.93);
}`;
const GLASS_FS = `
uniform sampler2D map; uniform float uTime;
varying vec2 vUv;
void main(){
  vec3 c = texture2D(map, vUv).rgb;
  float s = smoothstep(0.09, 0.0, abs(vUv.x + vUv.y * 0.6 - fract(uTime * 0.18) * 2.6 + 0.4));
  vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vUv.x * 0.6 + vUv.y * 0.4 + uTime * 0.08 + vec3(0.0, 0.33, 0.67)));
  float edge = smoothstep(0.32, 0.5, length(vUv - 0.5));
  c = mix(c, c * irid * 1.35, 0.16 + edge * 0.4) + s * 0.4;
  gl_FragColor = vec4(c, 1.0);
}`;

/* ------------------------------------------------------------------ palettes */

const DAY = { top: '#4fa6f5', mid: '#9fd6ff', hor: '#fff0d6', sun: '#fff3d6', sunL: '#fff3e0', sunI: 1.9, hemiS: '#cfe6ff', hemiG: '#7d9460', hemiI: 1.0, deep: '#2f8fc4', shallow: '#62c9e6', exposure: 1 };
const DUSK = { top: '#4656b0', mid: '#f29fb4', hor: '#ffc27e', sun: '#ff9d5c', sunL: '#ffb07a', sunI: 1.6, hemiS: '#ffc9b6', hemiG: '#8a6a7a', hemiI: .95, deep: '#5e5aa6', shallow: '#e58fa6', exposure: 1 };

/* ------------------------------------------------------------------ mount */

export function mount(root, { isPaused = () => false } = {}) {
  let disposed = false;
  const ac = new AbortController(), signal = ac.signal;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let teardown = () => {};
  const goStatic = () => { root.innerHTML = staticMarkup(); };

  if (reduce) { goStatic(); return () => { disposed = true; ac.abort(); root.innerHTML = ''; }; }

  const HIDDEN_N = 8, PATH_N = 22, TOTAL = HIDDEN_N + PATH_N;
  root.innerHTML = liveMarkup(TOTAL);
  const el = root.querySelector('.cw');
  const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
  const canvas = $('.cw-canvas');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch {
    renderer = null; goStatic();
    return () => { disposed = true; ac.abort(); root.innerHTML = ''; };
  }

  init().catch(err => {
    console.warn('[character] falling back to storybook', err);
    if (!disposed) { try { teardown(); } catch { /* ignore */ } goStatic(); }
  });

  async function init() {
    const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    const touch = matchMedia('(pointer: coarse)').matches;
    el.classList.toggle('is-touch', touch);
    const loadImg = src => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const fontReady = Promise.race([Promise.all([document.fonts?.load?.('800 64px Archivo'), document.fonts?.load?.('700 36px "Noto Sans KR"', '홀로그램')]), new Promise(r => setTimeout(r, 1500))]).catch(() => {});
    const libsP = Promise.all([import(LIBS.gsap), import(LIBS.st), import(LIBS.lenis)]).catch(() => null);
    const [images, libs] = await Promise.all([Promise.all(projects.map(p => loadImg(ART[p.id] || 'art/orbit.jpg'))), libsP, fontReady]);
    if (disposed) return;

    /* ---------------- renderer / scene */
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 48, 175);
    const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 700);

    const owned = { textures: [], geos: [] };
    const tex = t => { owned.textures.push(t); return t; };
    const R = mulberry(20260202);
    const rand = (a, b) => a + R() * (b - a);
    const pick = arr => arr[Math.floor(R() * arr.length)];

    const grad = new THREE.DataTexture(new Uint8Array([105, 180, 255]), 3, 1, THREE.RedFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true; tex(grad);
    const matCache = new Map();
    const toon = (color, opts) => {
      const key = opts ? null : color;
      if (key && matCache.has(key)) return matCache.get(key);
      const m = new THREE.MeshToonMaterial({ color, gradientMap: grad, ...(opts || {}) });
      if (key) matCache.set(key, m);
      return m;
    };
    const basic = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });
    const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene, cast = true) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
    };

    const glowMap = tex(softDot()), puffMap = tex(puffTex()), heartMap = tex(heartTex());

    /* ---------------- lights */
    const hemi = new THREE.HemisphereLight('#d9eeff', '#8fa66a', 1.25); scene.add(hemi);
    const sun = new THREE.DirectionalLight('#fff3e0', 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 90 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
    scene.add(sun); scene.add(sun.target);
    const sunDir = new THREE.Vector3();

    /* ---------------- sky + sea */
    const skyU = { uTop: { value: hexV3(DAY.top) }, uMid: { value: hexV3(DAY.mid) }, uHor: { value: hexV3(DAY.hor) }, uSunCol: { value: hexV3(DAY.sun) }, uSunDir: { value: new THREE.Vector3(-.3, .45, -1) } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false }));
    sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
    const seaU = { uTime: { value: 0 }, uDeep: { value: hexV3(DAY.deep) }, uShallow: { value: hexV3(DAY.shallow) }, uFog: { value: hexV3(DAY.hor) }, uSun: { value: hexV3(DAY.sun) }, uCam: { value: new THREE.Vector3() }, uNear: { value: 48 }, uFar: { value: 175 } };
    const seaGeo = new THREE.PlaneGeometry(700, 700, coarse ? 70 : 110, coarse ? 70 : 110); seaGeo.rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(seaGeo, new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: SEA_VS, fragmentShader: SEA_FS }));
    sea.position.y = -22; sea.frustumCulled = false; scene.add(sea);

    /* ---------------- path */
    const curve = new THREE.CatmullRomCurve3(CTRL.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
    const L = curve.getLength();
    const NS = Math.ceil(L / .25);
    const islandAt = (x, z, m = 0) => ISLANDS.findIndex(I => Math.hypot(x - I.x, z - I.z) < I.r - m);
    const S = [];
    const tp = new THREE.Vector3(), tt = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) {
      const u = i / NS; curve.getPointAt(u, tp); curve.getTangentAt(u, tt);
      const isl = islandAt(tp.x, tp.z, .35);
      S.push({ x: tp.x, z: tp.z, u, tx: tt.x, tz: tt.z, isl, bridge: isl < 0, y: isl >= 0 ? islandH(ISLANDS[isl], tp.x, tp.z) : 0 });
    }
    for (let i = 0; i < S.length; i++) {
      if (!S[i].bridge) continue;
      let j = i; while (j + 1 < S.length && S[j + 1].bridge) j++;
      const yA = S[i - 1]?.y ?? 0, yB = S[j + 1]?.y ?? 0, n = j - i + 2;
      for (let k = i; k <= j; k++) { const t = (k - i + 1) / n; S[k].y = lerp(yA, yB, t) + Math.sin(Math.PI * t) * .32; }
      i = j;
    }
    const bridgeS = S.filter(s => s.bridge);
    const pathDist = (x, z) => { let b = Infinity; for (const s of S) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
    const nearestS = (x, z) => { let b = Infinity, bs = S[0]; for (const s of S) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < b) { b = d; bs = s; } } return bs; };
    const bridgeNear = (x, z, lim) => { let b = lim * lim, bs = null; for (const s of bridgeS) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < b) { b = d; bs = s; } } return bs; };
    function groundAt(x, z) {
      let best = -Infinity;
      for (const I of ISLANDS) if (Math.hypot(x - I.x, z - I.z) < I.r) best = Math.max(best, islandH(I, x, z));
      const b = bridgeNear(x, z, 1.05); if (b) best = Math.max(best, b.y);
      return best;
    }
    const obstacles = [];
    function walkable(x, z) {
      let ok = ISLANDS.some(I => Math.hypot(x - I.x, z - I.z) < I.r - .4) || !!bridgeNear(x, z, .72);
      if (!ok) return false;
      for (const o of obstacles) if ((x - o.x) ** 2 + (z - o.z) ** 2 < o.r * o.r) return false;
      return true;
    }
    const pointAt = (u, out) => { curve.getPointAt(clamp(u), out); out.y = groundAt(out.x, out.z); if (!isFinite(out.y)) out.y = 0; return out; };

    // zone stops on the path
    ZONES.forEach(Z => { const s = nearestS(Z.stop[0], Z.stop[1]); Z.u = s.u; Z.pos = new THREE.Vector3(s.x, s.y, s.z); Z.T = new THREE.Vector3(s.tx, 0, s.tz); });
    const endPos = pointAt(1, new THREE.Vector3());
    // scroll progress -> path u
    const PK = [[0, 0], [.045, 0], [.22, ZONES[0].u], [.3, ZONES[0].u], [.47, ZONES[1].u], [.55, ZONES[1].u], [.72, ZONES[2].u], [.8, ZONES[2].u], [.955, 1], [1, 1]];
    const pToU = p => { for (let i = 0; i < PK.length - 1; i++) { const [a, ua] = PK[i], [b, ub] = PK[i + 1]; if (p <= b) return lerp(ua, ub, clamp((p - a) / (b - a))); } return 1; };
    const uToP = u => { for (let i = 0; i < PK.length - 1; i++) { const [a, ua] = PK[i], [b, ub] = PK[i + 1]; if (u <= ub + 1e-6) return ub === ua ? (a + b) / 2 : lerp(a, b, clamp((u - ua) / (ub - ua))); } return 1; };

    /* ---------------- islands */
    const dirt = ['#a8744a', '#9b6b43', '#b58052'], rock = ['#8a6a5c', '#7d6253', '#94786a', '#6f5a55'];
    function islandGeo(I, rnd) {
      const pal = BIOMES[I.biome];
      const rings = Math.max(3, Math.round(I.r * 1.05)), segs = Math.max(16, Math.round(I.r * 4.2));
      const P = [], C = [], col = new THREE.Color();
      const ring = [];
      for (let ri = 0; ri <= rings; ri++) {
        const row = [], n = ri === 0 ? 1 : segs;
        for (let si = 0; si < n; si++) {
          const a = si / segs * TAU + (ri % 2) * Math.PI / segs;
          let rr = I.r * ri / rings; if (ri > 0 && ri < rings) rr += (rnd() - .5) * I.r / rings * .45;
          const x = I.x + Math.cos(a) * rr, z = I.z + Math.sin(a) * rr;
          row.push([x, islandH(I, x, z), z]);
        }
        ring.push(row);
      }
      const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nrm = new THREE.Vector3();
      const tri = (a, b, c, color, wantOut) => {
        e1.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); e2.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); nrm.crossVectors(e1, e2);
        const cx = (a[0] + b[0] + c[0]) / 3 - I.x, cz = (a[2] + b[2] + c[2]) / 3 - I.z;
        const dot = wantOut === 'up' ? nrm.y : nrm.x * cx + nrm.z * cz + (wantOut === 'down' ? -nrm.y * .5 : 0);
        if (dot < 0) { const t = b; b = c; c = t; }
        P.push(...a, ...b, ...c); col.set(color); col.offsetHSL(0, 0, (rnd() - .5) * .05);
        for (let k = 0; k < 3; k++) C.push(col.r, col.g, col.b);
      };
      for (let si = 0; si < segs; si++) tri(ring[0][0], ring[1][si], ring[1][(si + 1) % segs], pick(pal.grass), 'up');
      for (let ri = 1; ri < rings; ri++) {
        const A = ring[ri], B = ring[ri + 1], odd = (ri % 2) === 1;
        for (let si = 0; si < segs; si++) {
          const s1 = (si + 1) % segs;
          if (odd) { tri(A[si], B[s1], A[s1], pick(pal.grass), 'up'); tri(A[si], B[si], B[s1], pick(pal.grass), 'up'); }
          else { tri(A[si], B[si], A[s1], pick(pal.grass), 'up'); tri(A[s1], B[si], B[s1], pick(pal.grass), 'up'); }
        }
      }
      // grass lip + dirt band + rocky underside
      const outer = ring[rings], rOff = (rings % 2) * Math.PI / segs;
      const depth = I.r * .75 + 2.2;
      const layers = [[1.025, -.22], [1.0, -.6], [.9, -1.2], [.68, -depth * .45], [.4, -depth * .75], [.1, -depth]];
      let prev = outer;
      layers.forEach(([k, dy], li) => {
        const row = [];
        for (let si = 0; si < segs; si++) {
          const a = si / segs * TAU + rOff, j = li > 1 ? 1 + (rnd() - .5) * .22 : 1;
          row.push([I.x + Math.cos(a) * I.r * k * j, I.h + dy + (li > 1 ? (rnd() - .5) * .5 : 0), I.z + Math.sin(a) * I.r * k * j]);
        }
        const colr = li === 0 ? pal.grass[0] : li === 1 ? null : null;
        for (let si = 0; si < segs; si++) {
          const s1 = (si + 1) % segs;
          const c1 = li === 0 ? pick(pal.grass) : li < 3 ? pick(dirt) : pick(rock);
          tri(prev[si], row[si], prev[s1], colr || c1, 'out');
          tri(prev[s1], row[si], row[s1], colr || c1, 'out');
        }
        prev = row;
      });
      const tipY = I.h - depth - 1.2, tip = [I.x + (rnd() - .5), tipY, I.z + (rnd() - .5)];
      for (let si = 0; si < segs; si++) tri(prev[si], tip, prev[(si + 1) % segs], pick(rock), 'out');
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.computeVertexNormals();
      return g;
    }
    const islandMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad });
    ISLANDS.forEach(I => { const m = new THREE.Mesh(islandGeo(I, R), islandMat); m.receiveShadow = true; scene.add(m); });

    /* ---------------- bridges + stepping stones */
    const dummy = new THREE.Object3D();
    {
      const planks = bridgeS.filter((_, i) => i % 2 === 0);
      const plankIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, .12, .36), toon('#c98b52'), planks.length);
      const pc = new THREE.Color();
      planks.forEach((s, i) => {
        dummy.position.set(s.x, s.y - .07, s.z); dummy.rotation.set((R() - .5) * .04, Math.atan2(s.tx, s.tz), (R() - .5) * .05); dummy.scale.set(1 + (R() - .5) * .1, 1, 1); dummy.updateMatrix();
        plankIM.setMatrixAt(i, dummy.matrix); plankIM.setColorAt(i, pc.set(pick(['#c98b52', '#b97c46', '#d69a60'])));
      });
      plankIM.castShadow = true; plankIM.receiveShadow = true; scene.add(plankIM);
      // posts + rope rails
      const posts = [], rails = [];
      let runPrev = { '-1': null, '1': null };
      bridgeS.forEach((s, i) => {
        const brk = i > 0 && (Math.abs(bridgeS[i - 1].u - s.u) > .01);
        if (brk) runPrev = { '-1': null, '1': null };
        if (i % 6 !== 0 && !(i + 1 < bridgeS.length && Math.abs(bridgeS[i + 1].u - s.u) > .01) && !brk) return;
        for (const side of [-1, 1]) {
          const px = s.x + -s.tz * .78 * side, pz = s.z + s.tx * .78 * side;
          posts.push([px, s.y, pz]);
          const top = new THREE.Vector3(px, s.y + .72, pz);
          if (runPrev[side]) rails.push([runPrev[side], top]);
          runPrev[side] = top;
        }
      });
      const postIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .07, .9, 6), toon('#8a5a36'), posts.length);
      posts.forEach((p, i) => { dummy.position.set(p[0], p[1] + .3, p[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); postIM.setMatrixAt(i, dummy.matrix); });
      postIM.castShadow = true; scene.add(postIM);
      const railIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.025, .025, 1, 5).rotateX(Math.PI / 2), toon('#e8d3a8'), Math.max(1, rails.length));
      rails.forEach(([a, b], i) => { dummy.position.copy(a).add(b).multiplyScalar(.5); dummy.position.y -= .06; dummy.scale.set(1, 1, a.distanceTo(b)); dummy.lookAt(b.x, b.y - .06, b.z); dummy.updateMatrix(); railIM.setMatrixAt(i, dummy.matrix); });
      railIM.count = rails.length; scene.add(railIM);
      // stepping stones on islands
      const stones = S.filter((s, i) => !s.bridge && i % 4 === 0);
      const stoneIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.34, .38, .12, 7), toon('#efe2c6'), stones.length);
      stones.forEach((s, i) => {
        const side = i % 2 ? 1 : -1, off = .2 * side;
        const x = s.x - s.tz * off, z = s.z + s.tx * off;
        dummy.position.set(x, groundAt(x, z) + .015, z); dummy.rotation.set(0, R() * TAU, 0); const k = rand(.8, 1.15); dummy.scale.set(k, 1, k * rand(.8, 1)); dummy.updateMatrix();
        stoneIM.setMatrixAt(i, dummy.matrix); stoneIM.setColorAt(i, pc.set(pick(['#efe2c6', '#e6d6b6', '#f5ead3'])));
      });
      stoneIM.receiveShadow = true; scene.add(stoneIM);
    }

    /* ---------------- landmarks */
    const anim = { holo: null, cubes: [], antenna: null, gear: null, smoke: [], crystals: [], lens: null, planet: null, rings: [], twinkles: [], slit: null, lanterns: [] };
    const imgTex = (i) => { const src = images[i] || fallbackArt(i); const t = src instanceof HTMLCanvasElement ? new THREE.CanvasTexture(src) : new THREE.Texture(src); t.needsUpdate = true; t.anisotropy = 4; return tex(t); };
    const landmark = (Z) => {
      const g = new THREE.Group(); const [bx, bz] = Z.build;
      g.position.set(bx, groundAt(bx, bz), bz); g.rotation.y = Math.atan2(Z.pos.x - bx, Z.pos.z - bz); scene.add(g);
      obstacles.push({ x: bx, z: bz, r: Z.r });
      return g;
    };
    const localToWorld = (g, x, z) => { const v = new THREE.Vector3(x, 0, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y); return [g.position.x + v.x, g.position.z + v.z]; };

    // 01 — VR studio dome + holographic face billboard
    {
      const g = landmark(ZONES[0]);
      mesh(new THREE.CylinderGeometry(3.5, 3.7, .45, 30), toon('#e9e1ff'), 0, .2, 0, g);
      mesh(new THREE.SphereGeometry(3, 30, 14, 0, TAU, 0, Math.PI / 2), toon('#ffffff'), 0, .42, 0, g);
      for (const y of [.8, 1.7, 2.45]) { const rr = Math.sqrt(9 - y * y) + .02; const t = mesh(new THREE.TorusGeometry(rr, .06, 6, 48), toon('#b48cff'), 0, .42 + y, 0, g, false); t.rotation.x = Math.PI / 2; }
      mesh(new THREE.BoxGeometry(1.3, 1.8, 1.2), toon('#6b56a8'), 0, 1.3, 2.55, g);
      mesh(new THREE.BoxGeometry(.9, 1.4, .1), basic('#7ee8ff'), 0, 1.15, 3.16, g, false);
      mesh(new THREE.CylinderGeometry(.05, .07, 1.3, 6), toon('#b48cff'), 0, 4.0, 0, g);
      anim.antenna = mesh(new THREE.SphereGeometry(.17, 14, 10), basic('#ff8fc8'), 0, 4.7, 0, g, false);
      const W = 6.2, H = W / ((images[0]?.naturalWidth || 3) / (images[0]?.naturalHeight || 2));
      const by = 3.9 + H / 2 + .5, bz = -1.1;
      for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(.09, .12, by + H / 2, 8), toon('#c9b3ff'), s * (W / 2 + .2), (by + H / 2) / 2, bz, g);
      const hm = new THREE.ShaderMaterial({ uniforms: { map: { value: imgTex(0) }, uTime: { value: 0 } }, vertexShader: HOLO_VS, fragmentShader: HOLO_FS, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      anim.holo = hm;
      const board = mesh(new THREE.PlaneGeometry(W, H), hm, 0, by, bz, g, false); board.renderOrder = 3;
      const edge = basic('#7ee8ff');
      for (const [w, h, x, y] of [[W + .3, .08, 0, H / 2 + .1], [W + .3, .08, 0, -H / 2 - .1], [.08, H + .3, W / 2 + .1, 0], [.08, H + .3, -W / 2 - .1, 0]]) mesh(new THREE.BoxGeometry(w, h, .08), edge, x, by + y, bz, g, false);
      const beam = mesh(new THREE.ConeGeometry(2.2, by - H / 2 - 4.6, 24, 1, true), basic('#7ee8ff', { transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0, 4.6 + (by - H / 2 - 4.6) / 2, bz * .5, g, false);
      beam.rotation.x = Math.PI;
      const cubeGeo = new THREE.BoxGeometry(.22, .22, .22);
      for (let k = 0; k < 12; k++) {
        const c = mesh(cubeGeo, basic(k % 2 ? '#7ee8ff' : '#ff9fd8'), 0, 0, 0, g, false);
        c.userData = { a: k / 12 * TAU, r: W / 2 + 1.1, y: by, bz, sp: .35 + (k % 3) * .1 };
        anim.cubes.push(c);
      }
    }
    // 02 — crystal workshop + glass lens
    {
      const g = landmark(ZONES[1]);
      const cab = new THREE.Group(); cab.position.set(.9, 0, -.6); g.add(cab);
      mesh(new THREE.BoxGeometry(3.4, 2.4, 2.8), toon('#fff1db'), 0, 1.2, 0, cab);
      const roof = mesh(new THREE.CylinderGeometry(2.25, 2.25, 3.3, 3), toon('#3fb8a4'), 0, 2.95, 0, cab); roof.rotation.set(-Math.PI / 2, 0, 0); roof.rotation.order = 'XYZ'; roof.scale.set(1.08, 1, .62);
      mesh(new THREE.BoxGeometry(.9, 1.5, .12), toon('#8a5a36'), -.6, .75, 1.42, cab);
      mesh(new THREE.BoxGeometry(.7, .6, .1), basic('#ffe58a'), .8, 1.45, 1.42, cab, false);
      mesh(new THREE.BoxGeometry(.1, 1.0, .9), basic('#ffe58a'), 1.72, 1.3, 0, cab, false);
      mesh(new THREE.BoxGeometry(.5, 1.3, .5), toon('#c0634a'), .9, 3.4, -.5, cab);
      const gear = new THREE.Group(); gear.position.set(.8, 2.2, 1.48); cab.add(gear);
      mesh(new THREE.CylinderGeometry(.32, .32, .1, 12).rotateX(Math.PI / 2), toon('#e8b04a'), 0, 0, 0, gear, false);
      for (let k = 0; k < 8; k++) { const t = mesh(new THREE.BoxGeometry(.12, .16, .1), toon('#e8b04a'), Math.cos(k / 8 * TAU) * .38, Math.sin(k / 8 * TAU) * .38, 0, gear, false); t.rotation.z = k / 8 * TAU; }
      anim.gear = gear;
      const smokeMat = new THREE.SpriteMaterial({ map: puffMap, color: '#ffffff', transparent: true, depthWrite: false, opacity: .8 });
      for (let k = 0; k < 6; k++) { const sp = new THREE.Sprite(smokeMat.clone()); sp.userData.o = k / 6; cab.add(sp); sp.position.set(.9, 4.1, -.5); anim.smoke.push(sp); }
      // lens display
      const lens = new THREE.Group(); lens.position.set(-2.4, 2.9, 1.4); lens.rotation.y = .35; g.add(lens);
      mesh(new THREE.CylinderGeometry(.08, .1, 2.9, 8), toon('#6b56a8'), 0, -1.45, -.05, lens);
      const ring = mesh(new THREE.CylinderGeometry(1.75, 1.75, .18, 6).rotateX(Math.PI / 2), toon('#7a5cd6'), 0, 0, -.08, lens); ring.rotation.z = Math.PI / 6;
      const gm = new THREE.ShaderMaterial({ uniforms: { map: { value: imgTex(1) }, uTime: { value: 0 } }, vertexShader: HOLO_VS, fragmentShader: GLASS_FS });
      const face = mesh(new THREE.CircleGeometry(1.55, 6), gm, 0, 0, .03, lens, false); face.rotation.z = Math.PI / 6;
      anim.lens = { g: lens, gm };
      obstacles.push((() => { const [x, z] = localToWorld(g, -2.4, 1.4); return { x, z, r: .6 }; })());
      // crystals
      const crystalGeo = new THREE.OctahedronGeometry(1, 0);
      const cc = ['#7ef0ff', '#c9a7ff', '#ff9ed8', '#9ff3e6'];
      const spots = [[-3.2, -1.6, 1.3], [-2.4, -2.6, .9], [3.4, 1.2, 1.1], [3.0, -2.3, 1.5], [-.8, -3.1, .8], [2.2, 2.4, .7], [-3.6, .3, .6]];
      spots.forEach(([x, z, s], k) => {
        const col = cc[k % cc.length];
        const m = mesh(crystalGeo, toon(col, { emissive: col, emissiveIntensity: .35, transparent: true, opacity: .92 }), x, s * 1.2, z, g);
        m.scale.set(s * .45, s * 1.35, s * .45); m.rotation.set((R() - .5) * .5, R() * TAU, (R() - .5) * .5);
        m.userData = { y: s * 1.2, ph: R() * TAU };
        anim.crystals.push(m);
      });
    }
    // 03 — observatory + orbiting planet
    {
      const g = landmark(ZONES[2]);
      mesh(new THREE.CylinderGeometry(1.9, 2.15, 3.4, 22), toon('#f4ecdc'), 0, 1.7, 0, g);
      const band = mesh(new THREE.TorusGeometry(1.95, .1, 6, 40), toon('#c96a36'), 0, 3.4, 0, g); band.rotation.x = Math.PI / 2;
      const dome = new THREE.Group(); dome.position.y = 3.4; g.add(dome);
      mesh(new THREE.SphereGeometry(1.95, 24, 12, 0, TAU, 0, Math.PI / 2), toon('#ff9f5a'), 0, 0, 0, dome);
      mesh(new THREE.BoxGeometry(.6, 1.2, 2.1), toon('#3b2f5a'), 0, 1.25, .45, dome, false).rotation.x = -.45;
      const scope = mesh(new THREE.CylinderGeometry(.22, .3, 2.6, 12), toon('#ffd27a'), 0, 1.6, 1.0, dome); scope.rotation.x = .75;
      anim.slit = dome;
      mesh(new THREE.BoxGeometry(1.1, 1.7, .4), toon('#7a4b3a'), 0, .85, 1.95, g);
      const sky2 = new THREE.Group(); sky2.position.set(0, 9.8, 0); g.add(sky2);
      const pm = new THREE.MeshBasicMaterial({ map: (() => { const t = imgTex(2); t.colorSpace = THREE.SRGBColorSpace; return t; })() });
      anim.planet = mesh(new THREE.SphereGeometry(2.0, 40, 24), pm, 0, 0, 0, sky2, false);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: '#ffd27a', transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(8); sky2.add(halo);
      [[3.0, .5, .2, '#ffffff'], [3.7, -.35, .9, '#ffd27a'], [4.4, .2, -.6, '#ff9f5a']].forEach(([r, tx, tz, col], k) => {
        const holder = new THREE.Group(); holder.rotation.set(tx, 0, tz); sky2.add(holder);
        const spin = new THREE.Group(); holder.add(spin);
        const tor = mesh(new THREE.TorusGeometry(r, .045, 6, 90), basic(col), 0, 0, 0, spin, false); tor.rotation.x = Math.PI / 2;
        mesh(new THREE.SphereGeometry(.2 + k * .04, 14, 10), toon(['#9fd6ff', '#c9a7ff', '#ffe08a'][k]), r, 0, 0, spin);
        anim.rings.push({ spin, sp: [.5, -.35, .25][k] });
      });
      const twGeo = new THREE.OctahedronGeometry(.1, 0);
      for (let k = 0; k < 16; k++) { const t = mesh(twGeo, basic('#fff3a0'), rand(-5, 5), rand(-3, 4), rand(-4, 4), sky2, false); t.userData.ph = R() * TAU; anim.twinkles.push(t); }
    }

    /* ---------------- props: signposts, tent, finale */
    function signpost(title, sub, color, u, side, fwd = false, off = 1.7) {
      const p = pointAt(u, new THREE.Vector3()), T = curve.getTangentAt(clamp(u));
      const x = p.x - T.z * off * side, z = p.z + T.x * off * side;
      const g = new THREE.Group(); g.position.set(x, groundAt(x, z), z); g.rotation.y = fwd ? Math.atan2(T.x, T.z) - side * .5 : Math.atan2(-T.x, -T.z) + side * .35; scene.add(g);
      mesh(new THREE.CylinderGeometry(.07, .09, 2.1, 6), toon('#8a5a36'), 0, 1.05, 0, g);
      const bm = new THREE.MeshBasicMaterial({ map: tex(signTex(title, sub, color)), transparent: true });
      const board = mesh(new THREE.PlaneGeometry(2.2, .76), bm, 0, 1.8, .1, g, false);
      const back = mesh(new THREE.BoxGeometry(2.25, .8, .08), toon('#a8744a'), 0, 1.8, .04, g);
      void board; void back;
      obstacles.push({ x, z, r: .3 });
    }
    ZONES.forEach((Z, i) => signpost(Z.en, `${String(i + 1).padStart(2, '0')} · ${Z.ko}`, Z.color, Z.u - 7 / L, i % 2 ? -1 : 1));
    signpost('A Little Journey', '여정의 시작', '#ff7a59', 0, -1, true, 3.4);
    signpost('Sunset Hill', 'GitHub로 가는 길', '#ff7a59', 1 - 8 / L, 1);
    { // tent at the start
      const g = new THREE.Group(); g.position.set(-3.6, groundAt(-3.6, 3.2), 3.2); g.rotation.y = .9; scene.add(g);
      const t = mesh(new THREE.ConeGeometry(1.35, 1.8, 4), toon('#ff7a59'), 0, .9, 0, g); t.rotation.y = Math.PI / 4;
      mesh(new THREE.ConeGeometry(.55, 1.1, 3), toon('#5a3a2e'), 0, .55, .62, g, false).rotation.y = Math.PI;
      mesh(new THREE.SphereGeometry(.09, 8, 6), toon('#ffd23f'), 0, 1.85, 0, g);
      obstacles.push({ x: -3.6, z: 3.2, r: 1.3 });
      // campfire
      const f = new THREE.Group(); f.position.set(-1.6, groundAt(-1.6, 5.4), 5.4); scene.add(f);
      for (let k = 0; k < 5; k++) { const s = mesh(new THREE.DodecahedronGeometry(.16, 0), toon('#9a9aa8'), Math.cos(k / 5 * TAU) * .38, .08, Math.sin(k / 5 * TAU) * .38, f); s.scale.y = .6; }
      const flame = mesh(new THREE.ConeGeometry(.18, .5, 6), basic('#ffb03a'), 0, .3, 0, f, false);
      anim.flame = flame;
      obstacles.push({ x: -1.6, z: 5.4, r: .5 });
    }
    const bigTrees = [];
    { // finale props
      const tx = -4.6, tz = -117;
      const g = new THREE.Group(); g.position.set(tx, groundAt(tx, tz) - .1, tz); scene.add(g);
      mesh(new THREE.CylinderGeometry(.3, .5, 3.2, 8), toon('#8a5a36'), 0, 1.6, 0, g);
      const canopy = new THREE.Group(); canopy.position.y = 3.4; g.add(canopy);
      [[0, .6, 0, 1.9], [1.3, 0, .4, 1.3], [-1.2, .1, -.3, 1.4], [.2, -.2, 1.2, 1.2], [-.3, 1.4, -.4, 1.1]].forEach(([x, y, z, s], k) => { const m = mesh(new THREE.IcosahedronGeometry(s, 1), toon(['#ffb7c5', '#ff9eb5', '#ffd1dc'][k % 3]), x, y, z, canopy); m.scale.y = .85; });
      bigTrees.push(canopy);
      obstacles.push({ x: tx, z: tz, r: .7 });
      // bench
      const b = new THREE.Group(); b.position.set(-1.6, groundAt(-1.6, -115.4), -115.4); b.rotation.y = .55; scene.add(b);
      mesh(new THREE.BoxGeometry(1.6, .1, .5), toon('#c98b52'), 0, .5, 0, b); mesh(new THREE.BoxGeometry(1.6, .45, .08), toon('#b97c46'), 0, .85, -.22, b);
      for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(.1, .5, .45), toon('#8a5a36'), s * .7, .25, 0, b);
      obstacles.push({ x: -1.6, z: -115.4, r: .8 });
      // lanterns along the last stretch
      for (let k = 0; k < 4; k++) {
        const u = 1 - (3 + k * 3.2) / L, p = pointAt(u, new THREE.Vector3()), T = curve.getTangentAt(u), sd = k % 2 ? 1 : -1;
        const x = p.x - T.z * 1.1 * sd, z = p.z + T.x * 1.1 * sd, y = groundAt(x, z);
        mesh(new THREE.CylinderGeometry(.04, .05, 1.2, 6), toon('#5a3a2e'), x, y + .6, z);
        const lamp = mesh(new THREE.SphereGeometry(.14, 10, 8), basic('#ffe08a'), x, y + 1.3, z, scene, false);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: '#ffc46b', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        gl.position.set(x, y + 1.3, z); gl.scale.setScalar(1.4); scene.add(gl);
        anim.lanterns.push({ lamp, gl });
        obstacles.push({ x, z, r: .25 });
      }
    }

    /* ---------------- trees, grass, flowers, rocks */
    const blocked = (x, z, pathR) => {
      if (pathDist(x, z) < pathR) return true;
      for (const o of obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + 1.2) return true;
      for (const Z of ZONES) if (Math.hypot(x - Z.build[0], z - Z.build[1]) < Z.r + 1.8) return true;
      return false;
    };
    const randIn = (I, m) => { const a = R() * TAU, r = Math.sqrt(R()) * (I.r - m); return [I.x + Math.cos(a) * r, I.z + Math.sin(a) * r]; };
    const trees = [];
    const introClear = (() => { const p = pointAt(0, new THREE.Vector3()), t = curve.getTangentAt(0); return p.addScaledVector(t, 4.5); })();
    ISLANDS.forEach((I, ii) => {
      const want = Math.round(I.r * I.r * .11) + 1;
      let tries = 0, placed = 0;
      while (placed < want && tries++ < 260) {
        const [x, z] = randIn(I, 1.1);
        if (blocked(x, z, 2.8)) continue;
        if (trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.1)) continue;
        if (ii === 7 && Math.hypot(x - endPos.x, z - endPos.z) < 5) continue;
        if (ii === 0 && Math.hypot(x - introClear.x, z - introClear.z) < 5) continue;
        const B = BIOMES[I.biome];
        trees.push({ x, z, y: islandH(I, x, z), s: rand(.8, 1.3), type: B.tree, leaves: B.leaves, ph: R() * TAU });
        placed++;
      }
    });
    trees.forEach(t => obstacles.push({ x: t.x, z: t.z, r: .42 * t.s }));
    const trunkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.11, .17, 1, 6), toon('#8a5a36'), trees.length);
    const nCan = trees.reduce((n, t) => n + (t.type === 'pine' ? 0 : 2), 0), nCone = trees.reduce((n, t) => n + (t.type === 'pine' ? 3 : 0), 0);
    const canIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), toon('#ffffff'), Math.max(1, nCan));
    const coneIM = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), toon('#ffffff'), Math.max(1, nCone));
    const sway = [];
    {
      let ci = 0, ki = 0; const col = new THREE.Color();
      trees.forEach((t, i) => {
        const th = (t.type === 'pine' ? .9 : 1.3) * t.s;
        t.th = th; t.k = 1; t.kPrev = -1; t.i = i;
        if (t.type === 'pine') {
          [[1.0, 1.5, .0], [.78, 1.25, .8], [.52, 1.0, 1.5]].forEach(([r, h, y]) => {
            sway.push({ im: coneIM, i: ki, base: new THREE.Vector3(t.x, t.y, t.z), off: new THREE.Vector3(0, th + y * t.s + h * t.s / 2 - .1, 0), sc: new THREE.Vector3(r * t.s, h * t.s, r * t.s), ph: t.ph, ry: R() * TAU, t });
            coneIM.setColorAt(ki++, col.set(pick(t.leaves)));
          });
        } else {
          [[1.05, 0, .55, 0], [.72, .45, 1.3, .3]].forEach(([r, ox, oy, oz]) => {
            sway.push({ im: canIM, i: ci, base: new THREE.Vector3(t.x, t.y, t.z), off: new THREE.Vector3(ox * t.s, th + oy * t.s, oz * t.s), sc: new THREE.Vector3(r * t.s, r * t.s * .9, r * t.s), ph: t.ph, ry: R() * TAU, t });
            canIM.setColorAt(ci++, col.set(pick(t.leaves)));
          });
        }
      });
      canIM.count = ci; coneIM.count = ki;
      for (const im of [trunkIM, canIM, coneIM]) { im.castShadow = true; im.receiveShadow = true; scene.add(im); }
    }
    const swayQ = new THREE.Quaternion(), swayE = new THREE.Euler(), swayV = new THREE.Vector3(), swayM = new THREE.Matrix4();
    // trees near the camera duck out of the way so they never fill the lens
    const swayS = new THREE.Vector3();
    function updateSway(time, cp) {
      let trunkDirty = false;
      for (const t of trees) {
        if (cp) {
          // distance from the tree to the camera->hero sight line (xz)
          const ax = cp.x, az = cp.z, bx = H.pos.x - ax, bz = H.pos.z - az, l2 = bx * bx + bz * bz || 1;
          const tq = clamp(((t.x - ax) * bx + (t.z - az) * bz) / l2), dx = t.x - (ax + bx * tq), dz = t.z - (az + bz * tq);
          const dSeg = Math.hypot(dx, dz) - t.s * .8;
          t.k = Math.min(smooth(2.6, 5.2, Math.hypot(cp.x - t.x, cp.z - t.z) - t.s * .6), tq >= 1 ? smooth(1.2, 2.6, dSeg) : smooth(.6, 1.8, dSeg));
        } else t.k = 1;
        if (Math.abs(t.k - t.kPrev) > .01) {
          t.kPrev = t.k; trunkDirty = true; const kk = Math.max(.001, t.k);
          dummy.position.set(t.x, t.y + t.th * kk / 2 - .05, t.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(t.s * kk, t.th * kk, t.s * kk); dummy.updateMatrix(); trunkIM.setMatrixAt(t.i, dummy.matrix);
        }
      }
      if (trunkDirty) trunkIM.instanceMatrix.needsUpdate = true;
      for (const s of sway) {
        const a = Math.sin(time * 1.4 + s.ph) * .045, b = Math.cos(time * 1.1 + s.ph * 1.3) * .035, kk = Math.max(.001, s.t.k);
        swayE.set(a, s.ry, b); swayQ.setFromEuler(swayE);
        swayV.copy(s.off).multiplyScalar(kk).applyEuler(swayE.set(a, 0, b)).add(s.base);
        swayS.copy(s.sc).multiplyScalar(kk);
        swayM.compose(swayV, swayQ, swayS); s.im.setMatrixAt(s.i, swayM);
      }
      canIM.instanceMatrix.needsUpdate = true; coneIM.instanceMatrix.needsUpdate = true;
    }
    updateSway(0);

    // grass blades
    const grassUniform = { value: 0 };
    {
      const P = [];
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * Math.PI + .3, w = .07, h = .32 + k * .06, ox = Math.cos(a + 1) * .06, oz = Math.sin(a + 1) * .06;
        const dx = Math.cos(a) * w, dz = Math.sin(a) * w;
        P.push(ox - dx, 0, oz - dz, ox + dx, 0, oz + dz, ox + dx * .1 + .04, h, oz + .02);
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.computeVertexNormals();
      const gm = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: grad, side: THREE.DoubleSide });
      gm.onBeforeCompile = sh => {
        sh.uniforms.uTime = grassUniform;
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          #else
          vec3 ip = vec3(0.0);
          #endif
          float sw = sin(uTime * 2.1 + ip.x * 0.7 + ip.z * 0.45) * 0.2 * position.y / 0.4;
          transformed.x += sw; transformed.z += sw * 0.4;`);
      };
      gm.customProgramCacheKey = () => 'cw-grass';
      const N = coarse ? 520 : 1100, items = [];
      let tries = 0;
      while (items.length < N && tries++ < N * 6) {
        const I = ISLANDS[Math.floor(R() * ISLANDS.length)];
        if (R() > I.r * I.r / 121 + .05) continue;
        const [x, z] = randIn(I, .4);
        if (pathDist(x, z) < .85) continue;
        if (ZONES.some(Z => Math.hypot(x - Z.build[0], z - Z.build[1]) < Z.r + .2)) continue;
        items.push([x, islandH(I, x, z), z, I]);
      }
      const gIM = new THREE.InstancedMesh(bg, gm, items.length), col = new THREE.Color();
      items.forEach(([x, y, z, I], i) => {
        dummy.position.set(x, y - .02, z); dummy.rotation.set(0, R() * TAU, 0); const k = rand(.7, 1.4); dummy.scale.set(k, k * rand(.8, 1.3), k); dummy.updateMatrix();
        gIM.setMatrixAt(i, dummy.matrix); gIM.setColorAt(i, col.set(pick(BIOMES[I.biome].grass)).offsetHSL(0, .05, -.08));
      });
      gIM.receiveShadow = true; scene.add(gIM);
      // flowers + rocks
      const fItems = [];
      tries = 0;
      while (fItems.length < (coarse ? 160 : 280) && tries++ < 3000) {
        const I = ISLANDS[Math.floor(R() * ISLANDS.length)];
        const [x, z] = randIn(I, .6);
        if (blocked(x, z, 1.0)) continue;
        fItems.push([x, islandH(I, x, z), z, pick(BIOMES[I.biome].flowers)]);
      }
      const fIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.085, 0), toon('#ffffff'), fItems.length);
      fItems.forEach(([x, y, z, c], i) => { dummy.position.set(x, y + .14, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, .7, 1); dummy.updateMatrix(); fIM.setMatrixAt(i, dummy.matrix); fIM.setColorAt(i, col.set(c)); });
      scene.add(fIM);
      const rItems = [];
      tries = 0;
      while (rItems.length < 26 && tries++ < 900) {
        const I = ISLANDS[Math.floor(R() * ISLANDS.length)];
        const [x, z] = randIn(I, .8);
        if (blocked(x, z, 1.4)) continue;
        rItems.push([x, islandH(I, x, z), z, rand(.25, .55)]);
      }
      const rIM = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), toon('#b9b2c4'), rItems.length);
      rItems.forEach(([x, y, z, s], i) => { dummy.position.set(x, y + s * .3, z); dummy.rotation.set(R(), R() * 6, R()); dummy.scale.set(s, s * .7, s); dummy.updateMatrix(); rIM.setMatrixAt(i, dummy.matrix); obstacles.push({ x, z, r: s * .9 }); });
      rIM.castShadow = true; rIM.receiveShadow = true; scene.add(rIM);
    }

    /* ---------------- floating decor islets, clouds, butterflies, birds */
    const floaters = [];
    [[-16, -18, 4, 2.2, 'meadow'], [32, -46, -3, 2.6, 'holo'], [-22, -72, 2, 2.0, 'crystal'], [34, -104, 5, 2.4, 'autumn'], [-18, -100, -4, 1.8, 'sunset'], [24, 6, -2, 1.9, 'meadow'], [-24, -38, 7, 1.6, 'autumn']].forEach(([x, z, y, r, biome]) => {
      const I = { x: 0, z: 0, r, h: 0, biome };
      const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
      const m = new THREE.Mesh(islandGeo(I, R), islandMat); m.receiveShadow = true; g.add(m);
      const B = BIOMES[biome];
      mesh(new THREE.CylinderGeometry(.1, .15, 1, 6), toon('#8a5a36'), .2, .5, 0, g);
      if (B.tree === 'pine') mesh(new THREE.ConeGeometry(.8, 1.6, 7), toon(B.leaves[0]), .2, 1.6, 0, g);
      else mesh(new THREE.IcosahedronGeometry(.85, 0), toon(B.leaves[0]), .2, 1.5, 0, g);
      floaters.push({ g, y, ph: R() * TAU });
    });
    const clouds = [];
    {
      const cm = toon('#ffffff', { emissive: '#ffffff', emissiveIntensity: .35 });
      const cg = new THREE.IcosahedronGeometry(1, 1);
      for (let k = 0; k < 16; k++) {
        const g = new THREE.Group(); const low = k < 6;
        g.position.set(rand(-45, 55), low ? rand(-12, -6) : rand(9, 20), rand(-140, 30));
        const n = 3 + Math.floor(R() * 3);
        for (let j = 0; j < n; j++) { const m = mesh(cg, cm, (j - n / 2) * 1.3 + rand(-.3, .3), rand(-.2, .5), rand(-.6, .6), g, false); m.receiveShadow = false; m.scale.setScalar(rand(1, 1.9) * (j === Math.floor(n / 2) ? 1.3 : 1)); m.scale.y *= .75; }
        g.scale.setScalar(low ? rand(1.4, 2.4) : rand(1.1, 2)); scene.add(g); clouds.push({ g, sp: rand(.4, 1.0) });
      }
    }
    const butterflies = [];
    {
      const wg = new THREE.PlaneGeometry(.26, .2); wg.translate(.13, 0, 0);
      const wingCols = ['#ffd23f', '#ff9fd0', '#9fe9ff', '#ffffff', '#c79bff'];
      for (let k = 0; k < 12; k++) {
        const I = ISLANDS[[0, 1, 3, 5, 7, 1, 3, 5, 0, 7, 2, 4][k]];
        const mat = toon(wingCols[k % wingCols.length], { side: THREE.DoubleSide });
        const g = new THREE.Group(); scene.add(g);
        const l = mesh(wg, mat, 0, 0, 0, g, false), r = mesh(wg, mat, 0, 0, 0, g, false); r.scale.x = -1;
        butterflies.push({ g, l, r, I, ph: R() * TAU, a: rand(.25, .45), b: rand(.3, .5), R: rand(2, I.r * .65) });
      }
    }
    const birds = [];
    {
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.25, 0, 0, .25, .9, 0, -.05], 3)); wg.computeVertexNormals();
      const bm = basic('#ffffff', { side: THREE.DoubleSide });
      for (let k = 0; k < 7; k++) {
        const g = new THREE.Group(); scene.add(g);
        const l = new THREE.Mesh(wg, bm), r = new THREE.Mesh(wg, bm); r.scale.x = -1; g.add(l, r);
        birds.push({ g, l, r, ph: k * .55, rad: 34 + (k % 3) * 2, y: 17 + (k % 2) * 1.5, lag: k * .05 });
      }
    }

    /* ---------------- sparkles */
    const sparkles = [];
    {
      const sg = new THREE.OctahedronGeometry(.2, 0), sm = basic('#ffe066');
      const add = (x, y, z, hidden) => {
        const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
        const m = new THREE.Mesh(sg, sm); m.scale.y = 1.35; g.add(m);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: hidden ? '#ffd0f0' : '#fff2a0', transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending }));
        gl.scale.setScalar(hidden ? 1.6 : 1.2); g.add(gl);
        sparkles.push({ g, m, gl, y, hidden, got: false, t: 0, ph: R() * TAU });
      };
      for (let i = 0; i < PATH_N; i++) {
        const u = .065 + i * (.92 / (PATH_N - 1));
        if (ZONES.some(Z => Math.abs(Z.u - u) * L < 2.5)) continue;
        const s = S[Math.round(u * NS)], off = s.bridge ? 0 : (i % 2 ? .5 : -.5);
        const x = s.x - s.tz * off, z = s.z + s.tx * off;
        add(x, groundAt(x, z) + .95, z, false);
      }
      let extra = PATH_N - sparkles.length;
      for (let i = 0; extra > 0 && i < 200; i++) { // fill skipped ones further along walk stretches
        const u = rand(.06, .94); if (ZONES.some(Z => Math.abs(Z.u - u) * L < 3)) continue;
        if (sparkles.some(sp => Math.hypot(sp.g.position.x - S[Math.round(u * NS)].x, sp.g.position.z - S[Math.round(u * NS)].z) < 2)) continue;
        const s = S[Math.round(u * NS)]; add(s.x, s.y + .95, s.z, false); extra--;
      }
      const isl = [0, 1, 1, 3, 3, 5, 5, 7];
      for (const ii of isl) {
        const I = ISLANDS[ii];
        for (let t = 0; t < 200; t++) {
          const [x, z] = randIn(I, 1.6);
          if (blocked(x, z, 3) || !walkable(x, z)) continue;
          if (sparkles.some(sp => Math.hypot(sp.g.position.x - x, sp.g.position.z - z) < 3)) continue;
          add(x, islandH(I, x, z) + 2.05, z, true); break;
        }
      }
    }
    const SPARK_TOTAL = sparkles.length;
    $('.cw-count small').textContent = `/ ${SPARK_TOTAL}`;

    /* ---------------- hero */
    const HC = { coat: '#ff7a59', coatDark: '#e45a3c', skin: '#ffe2c2', ink: '#2d2440', pants: '#5466d6', shoe: '#7a4b3a', pack: '#ffc23d', packDark: '#e59f1f', scarf: '#2ec4b6', beanie: '#ffd23f', cheek: '#ff9aa8', leaf: '#6fd36a', white: '#ffffff', roll: '#9b6bff' };
    function buildHero() {
      const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
      const add = (geo, color, x, y, z, parent, sx = 1, sy = 1, sz = 1) => { const m = mesh(geo, toon(color), x, y, z, parent); m.scale.set(sx, sy, sz); return m; };
      const legs = [-1, 1].map(s => {
        const p = new THREE.Group(); p.position.set(s * .13, .42, 0); body.add(p);
        add(new THREE.CapsuleGeometry(.085, .16, 4, 10), HC.pants, 0, -.17, 0, p);
        add(new THREE.SphereGeometry(.11, 14, 10), HC.shoe, 0, -.36, .04, p, 1, .62, 1.35);
        return p;
      });
      add(new THREE.CapsuleGeometry(.27, .2, 6, 16), HC.coat, 0, .66, 0, body, 1, 1, .92);
      add(new THREE.BoxGeometry(.03, .3, .03), HC.coatDark, 0, .6, .245, body);
      for (const s of [-1, 1]) add(new THREE.SphereGeometry(.035, 8, 6), HC.white, s * .09, .5, .235, body);
      const pack = new THREE.Group(); pack.position.set(0, .68, -.25); body.add(pack);
      add(new THREE.CapsuleGeometry(.17, .14, 4, 12), HC.pack, 0, 0, -.06, pack, 1.25, 1, .7);
      add(new THREE.BoxGeometry(.4, .16, .2), HC.packDark, 0, .15, -.07, pack);
      add(new THREE.SphereGeometry(.05, 8, 6), HC.coat, 0, .06, -.2, pack);
      const roll = add(new THREE.CylinderGeometry(.085, .085, .48, 12), HC.roll, 0, .33, -.08, pack); roll.rotation.z = Math.PI / 2;
      const arms = [-1, 1].map(s => {
        const p = new THREE.Group(); p.position.set(s * .3, .88, 0); body.add(p);
        add(new THREE.CapsuleGeometry(.07, .17, 4, 10), HC.coat, 0, -.15, 0, p);
        add(new THREE.SphereGeometry(.085, 12, 10), HC.skin, 0, -.32, 0, p);
        return p;
      });
      const scarf = add(new THREE.TorusGeometry(.2, .065, 8, 20), HC.scarf, 0, 1.0, 0, body); scarf.rotation.x = Math.PI / 2;
      const tail = new THREE.Group(); tail.position.set(.1, .98, -.2); body.add(tail);
      add(new THREE.BoxGeometry(.12, .3, .05), HC.scarf, 0, -.14, 0, tail);
      const head = new THREE.Group(); head.position.set(0, 1.02, 0); body.add(head);
      add(new THREE.SphereGeometry(.42, 28, 20), HC.skin, 0, .38, 0, head, 1.06, .96, 1);
      add(new THREE.SphereGeometry(.445, 28, 14, 0, TAU, 0, Math.PI * .46), HC.beanie, 0, .4, 0, head, 1.06, .98, 1.02);
      const bandM = add(new THREE.TorusGeometry(.44, .055, 8, 30), HC.coat, 0, .46, 0, head, 1.06, 1.02, 1); bandM.rotation.x = Math.PI / 2;
      add(new THREE.SphereGeometry(.09, 12, 10), HC.coat, 0, .86, 0, head);
      const sprout = new THREE.Group(); sprout.position.set(0, .9, 0); head.add(sprout);
      add(new THREE.CylinderGeometry(.012, .016, .22, 6), HC.leaf, 0, .11, 0, sprout);
      for (const s of [-1, 1]) { const lf = add(new THREE.SphereGeometry(.08, 10, 8), HC.leaf, s * .07, .22, 0, sprout, 1, .35, .55); lf.rotation.z = s * -.5; }
      const eyes = [-1, 1].map(s => {
        const eg = new THREE.Group(); eg.position.set(s * .145, .36, .382); head.add(eg);
        add(new THREE.SphereGeometry(.062, 14, 12), HC.ink, 0, 0, 0, eg, .85, 1.2, .55);
        add(new THREE.SphereGeometry(.02, 8, 6), HC.white, .018, .028, .03, eg);
        return eg;
      });
      for (const s of [-1, 1]) add(new THREE.SphereGeometry(.06, 10, 8), HC.cheek, s * .25, .27, .325, head, 1, .6, .4);
      const mouth = add(new THREE.TorusGeometry(.045, .014, 6, 12, Math.PI), HC.ink, 0, .265, .398, head); mouth.rotation.z = Math.PI;
      return { root, body, legs, arms, head, eyes, sprout, tail, mouth };
    }
    const hero = buildHero(); scene.add(hero.root);
    const H = {
      pos: pointAt(0, new THREE.Vector3()), heading: 0, speed: 0, walk: 0, phase: 0, jumpY: 0, jumpV: 0, grounded: true,
      sq: 1, sqV: 0, wave: 0, waveClock: 0, blink: 0, blinkNext: 2, pop: -1, sprout: 0, sproutV: 0, lastSpeed: 0, visible: false
    };
    { const T0 = curve.getTangentAt(0); H.heading = Math.atan2(T0.x, T0.z); }
    hero.root.scale.setScalar(.001);

    // buddy "뭉치"
    const buddy = new THREE.Group(); scene.add(buddy);
    {
      const add = (geo, color, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = mesh(geo, toon(color), x, y, z, buddy); m.scale.set(sx, sy, sz); return m; };
      add(new THREE.SphereGeometry(.27, 20, 16), '#fff8ee', 0, 0, 0, 1, .9, 1);
      for (const s of [-1, 1]) { const e = add(new THREE.ConeGeometry(.09, .22, 8), '#fff8ee', s * .16, .22, 0); e.rotation.z = s * -.45; add(new THREE.SphereGeometry(.035, 8, 6), HC.ink, s * .09, .03, .235, 1, 1.3, .6); add(new THREE.SphereGeometry(.04, 8, 6), HC.cheek, s * .17, -.04, .2, 1, .6, .4); }
      const lf = add(new THREE.SphereGeometry(.07, 10, 8), '#6fd36a', .03, .3, 0, 1, .35, .6); lf.rotation.z = -.6;
      add(new THREE.SphereGeometry(.08, 10, 8), '#fff8ee', 0, -.06, -.26);
    }
    const B = { pos: H.pos.clone().add(new THREE.Vector3(-1, 1.5, 1)), spin: 0, vis: 0 };
    buddy.position.copy(B.pos); buddy.scale.setScalar(.001);

    /* ---------------- fx pools */
    const fx = [];
    for (let k = 0; k < 34; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffMap, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
      sp.visible = false; scene.add(sp); fx.push({ sp, life: 0, max: 1, vel: new THREE.Vector3(), s0: .3, s1: .8 });
    }
    let fxI = 0;
    function spawn(pos, n, { color = '#fff6e6', speed = 1.6, up = .6, s0 = .25, s1 = .7, life = .55, map = puffMap, add = false } = {}) {
      for (let k = 0; k < n; k++) {
        const f = fx[fxI++ % fx.length], a = k / n * TAU + Math.random() * .4;
        f.sp.material.map = map; f.sp.material.color.set(color); f.sp.material.blending = add ? THREE.AdditiveBlending : THREE.NormalBlending; f.sp.material.needsUpdate = true;
        f.sp.position.copy(pos); f.vel.set(Math.cos(a) * speed * (.6 + Math.random() * .6), up * (.5 + Math.random()), Math.sin(a) * speed * (.6 + Math.random() * .6));
        f.life = f.max = life * (.8 + Math.random() * .4); f.s0 = s0; f.s1 = s1; f.sp.visible = true;
      }
    }
    const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartMap, transparent: true, depthWrite: false, opacity: 0 }));
    heart.visible = false; scene.add(heart);
    let heartT = 0;

    /* ---------------- camera rig */
    const cam = { yaw: H.heading + .25, dist: 5.2, h: 1.5, look: new THREE.Vector3(), anchor: H.pos.clone(), init: false };
    const camT = { yaw: 0, dist: 0, h: 0, look: new THREE.Vector3() };
    let freeYaw = 0, dragYaw = 0;

    function resize() {
      const w = innerWidth, h = innerHeight, aspect = w / h;
      renderer.setSize(w, h, false);
      camera.aspect = aspect; camera.fov = aspect < .75 ? 62 : aspect < 1.1 ? 56 : 48; camera.updateProjectionMatrix();
    }
    resize();
    addEventListener('resize', resize, { signal });

    /* ---------------- scroll */
    const track = $('.cw-track');
    let target = 0, prog = 0, lenis = null, ctx = null, gsap = null, tickerFn = null, lenisFn = null, rafId = 0;
    const readNative = () => { const r = track.getBoundingClientRect(); target = clamp(-r.top / Math.max(1, r.height - innerHeight)); };
    const scrollYFor = p => { const r = track.getBoundingClientRect(); return scrollY + r.top + p * (r.height - innerHeight); };
    const scrollToP = (p, immediate = false) => {
      const y = scrollYFor(p);
      if (lenis) lenis.scrollTo(y, immediate ? { immediate: true, force: true } : { duration: 2.2, force: true });
      else scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
    };
    if (libs) {
      const [{ gsap: G }, { ScrollTrigger }, { default: Lenis }] = libs;
      gsap = G; gsap.registerPlugin(ScrollTrigger);
      lenis = new Lenis({ lerp: .1 });
      lenis.on('scroll', ScrollTrigger.update);
      lenisFn = t => lenis.raf(t * 1000);
      gsap.ticker.add(lenisFn); gsap.ticker.lagSmoothing(0);
      ctx = gsap.context(() => { ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: self => { target = self.progress; } }); }, el);
      ScrollTrigger.refresh();
      readNative();
    } else {
      addEventListener('scroll', readNative, { signal, passive: true });
      readNative();
    }
    prog = target;

    /* ---------------- UI */
    const ui = {
      intro: $('.cw-intro'), count: $('.cw-count'), countN: $('.cw-count-n'), banner: $('.cw-banner'), dialog: $('.cw-dialog'), fin: $('.cw-fin'), finScore: $('.cw-fin-score'),
      ret: $('.cw-return'), hint: $('.cw-hint'), map: $('.cw-map'), joy: $('.cw-joy'), knob: $('.cw-joy-knob'), toast: $('.cw-toast'), loading: $('.cw-loading'),
      dImg: $('.cw-dlg-portrait img'), dNum: $('.cw-dlg-num'), dZone: $('.cw-dlg-zone'), dCat: $('.cw-dlg-cat'), dTitle: $('.cw-dlg-title'), dText: $('.cw-dlg-text'), dFull: $('.cw-dlg-full'), dChips: $('.cw-chips'), dLink: $('.cw-btn--go')
    };
    ui.loading.remove();
    el.classList.add('is-live');
    const U = { dlg: -1, typed: 0, full: '', dismissed: [false, false, false], bannerT: 0, toastT: 0, island: -1, fin: false, ret: false, introOn: false, count: 0, scrollNag: 0, mode: 'path' };

    function setVis(node, on) { node.classList.toggle('is-on', on); node.inert = !on; node.setAttribute('aria-hidden', String(!on)); }
    function toast(msg, dur = 3) { ui.toast.textContent = msg; ui.toast.classList.add('is-on'); U.toastT = dur; }
    function banner(tag, en, ko, color) {
      ui.banner.querySelector('small').textContent = tag; ui.banner.querySelector('strong').textContent = en; ui.banner.querySelector('em').textContent = ko;
      ui.banner.style.setProperty('--zc', color); ui.banner.classList.remove('is-on'); void ui.banner.offsetWidth; ui.banner.classList.add('is-on'); U.bannerT = 2.9;
    }
    function openDialog(i) {
      const p = projects[i], Z = ZONES[i];
      U.dlg = i; U.typed = 0; U.full = `${p.description}\n${p.body}`;
      el.style.setProperty('--zc', Z.color); el.style.setProperty('--zg', Z.glow);
      ui.dImg.src = ART[p.id] || 'art/orbit.jpg'; ui.dImg.alt = `${p.name} 대표 이미지`;
      ui.dNum.textContent = `0${i + 1}`; ui.dZone.textContent = `ZONE 0${i + 1} · ${Z.ko}`; ui.dCat.textContent = p.category; ui.dTitle.textContent = p.name;
      ui.dText.textContent = ''; ui.dFull.textContent = U.full;
      ui.dChips.innerHTML = p.stack.map(s => `<li>${esc(s)}</li>`).join('');
      ui.dLink.href = p.url; ui.dialog.classList.remove('is-done');
      setVis(ui.dialog, true);
    }
    function closeDialog(user) {
      if (U.dlg < 0) return;
      if (user) U.dismissed[U.dlg] = true;
      U.dlg = -1; setVis(ui.dialog, false);
    }
    ui.dialog.querySelector('[data-close]').addEventListener('click', () => closeDialog(true), { signal });
    ui.dialog.addEventListener('click', e => { if (!e.target.closest('a,button')) U.typed = 1e6; }, { signal });
    $('[data-top]').addEventListener('click', () => { if (U.mode !== 'path') startReturn(); scrollToP(0); }, { signal });

    /* ---------------- input */
    const keys = new Set();
    const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    let jumpReq = false, run = false, introStarted = false, introDone = false, firstFree = true;
    const joyV = new THREE.Vector2();
    const isTyping = t => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    function doWave() { if (!introDone || H.wave > 0) return; H.wave = 1.6; H.waveClock = 0; heartT = 1.2; B.spin = 1; }
    addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || document.querySelector('dialog[open]')) return;
      const k = e.code;
      if (MOVE.has(k)) { keys.add(k); e.preventDefault(); }
      else if (k === 'Space') { if (e.target.closest?.('button,a,[role=button]')) return; e.preventDefault(); if (!e.repeat) jumpReq = true; }
      else if (k === 'KeyE') { if (!e.repeat) doWave(); }
      else if (k === 'KeyR') { if (U.mode === 'free') startReturn(); }
      else if (k === 'Escape') closeDialog(true);
      if (e.key === 'Shift') run = true;
    }, { signal });
    addEventListener('keyup', e => { keys.delete(e.code); if (e.key === 'Shift') run = false; }, { signal });
    addEventListener('blur', () => { keys.clear(); run = false; }, { signal });

    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, t: performance.now() }; el.classList.add('is-drag'); }, { signal });
    addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      const d = -dx * .0065;
      if (U.mode === 'free') freeYaw += d; else dragYaw = clamp(dragYaw + d, -2.4, 2.4);
    }, { signal });
    const endDrag = e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (e.type === 'pointerup' && drag.moved < 8 && performance.now() - drag.t < 450) doWave();
      drag = null; el.classList.remove('is-drag');
    };
    addEventListener('pointerup', endDrag, { signal }); addEventListener('pointercancel', endDrag, { signal });

    let joyId = null, joyRect = null;
    const joyUpd = e => {
      const cx = joyRect.left + joyRect.width / 2, cy = joyRect.top + joyRect.height / 2, R0 = joyRect.width * .36;
      let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy); if (l > R0) { dx *= R0 / l; dy *= R0 / l; }
      joyV.set(dx / R0, -dy / R0); ui.knob.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`;
    };
    ui.joy.addEventListener('pointerdown', e => { joyId = e.pointerId; joyRect = ui.joy.getBoundingClientRect(); ui.joy.setPointerCapture(e.pointerId); joyUpd(e); e.preventDefault(); }, { signal });
    ui.joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyUpd(e); }, { signal });
    const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; joyV.set(0, 0); ui.knob.style.transform = ''; };
    ui.joy.addEventListener('pointerup', joyEnd, { signal }); ui.joy.addEventListener('pointercancel', joyEnd, { signal });
    $$('.cw-pad button').forEach(b => b.addEventListener('click', () => { if (b.dataset.act === 'jump') jumpReq = true; else doWave(); }, { signal }));

    /* ---------------- modes */
    let curU = 0, retTarget = null, retU = 0;
    function enterFree() {
      U.mode = 'free'; freeYaw = cam.yaw; dragYaw = 0;
      setVis(ui.ret, true); el.classList.add('is-free');
      if (firstFree) { firstFree = false; toast('자유 탐험 모드! 스크롤 여정은 ‘경로로 돌아가기’로 이어져요.', 4.2); }
    }
    function startReturn() {
      if (U.mode !== 'free') return;
      const s = nearestS(H.pos.x, H.pos.z); retTarget = new THREE.Vector3(s.x, 0, s.z); retU = s.u;
      U.mode = 'return'; setVis(ui.ret, false); el.classList.remove('is-free');
    }
    ui.ret.addEventListener('click', startReturn, { signal });
    function finishReturn() {
      U.mode = 'path'; curU = retU;
      const p = uToP(retU); target = prog = p; scrollToP(p, true);
    }

    function startIntro() {
      introStarted = true; H.pop = 0; H.visible = true;
      ui.intro.classList.add('is-in');
      U.introOn = true;
    }

    /* ---------------- minimap */
    const MAPW = touch ? 150 : 232, MAPH = touch ? 62 : 96, mdpr = Math.min(2, devicePixelRatio || 1);
    ui.map.width = MAPW * mdpr; ui.map.height = MAPH * mdpr; ui.map.style.width = MAPW + 'px'; ui.map.style.height = MAPH + 'px';
    const mg = ui.map.getContext('2d');
    const bx0 = Math.min(...ISLANDS.map(I => I.x - I.r)), bx1 = Math.max(...ISLANDS.map(I => I.x + I.r));
    const bz0 = Math.min(...ISLANDS.map(I => I.z - I.r)), bz1 = Math.max(...ISLANDS.map(I => I.z + I.r));
    const msc = Math.min((MAPW - 12) / (bz1 - bz0), (MAPH - 10) / (bx1 - bx0));
    const mox = (MAPW - (bz1 - bz0) * msc) / 2, moy = (MAPH - (bx1 - bx0) * msc) / 2;
    const MX = (x, z) => [mox + (bz1 - z) * msc, moy + (x - bx0) * msc];
    const mapBase = cnv(MAPW * mdpr, MAPH * mdpr);
    {
      const g = mapBase.getContext('2d'); g.scale(mdpr, mdpr);
      ISLANDS.forEach(I => { const [x, y] = MX(I.x, I.z); g.beginPath(); g.arc(x, y, I.r * msc, 0, TAU); g.fillStyle = I.zone != null ? ZONES[I.zone].color + '55' : 'rgba(126,196,98,.4)'; g.fill(); });
      g.setLineDash([3, 3]); g.lineWidth = 1.6; g.strokeStyle = 'rgba(58,46,79,.55)'; g.beginPath();
      S.forEach((s, i) => { if (i % 4) return; const [x, y] = MX(s.x, s.z); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }); g.stroke(); g.setLineDash([]);
      ZONES.forEach((Z, i) => { const [x, y] = MX(Z.build[0], Z.build[1]); g.beginPath(); g.arc(x, y, 6.5, 0, TAU); g.fillStyle = Z.color; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = '#fff'; g.font = '700 8px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), x, y + .5); });
      const [ex, ey] = MX(endPos.x, endPos.z); g.fillStyle = '#ff7a59'; g.beginPath(); g.moveTo(ex, ey - 7); g.lineTo(ex + 7, ey - 4); g.lineTo(ex, ey - 1); g.fill(); g.fillRect(ex - .8, ey - 7, 1.6, 9);
    }
    let mapAcc = 1;
    function drawMap(dt) {
      mapAcc += dt; if (mapAcc < 1 / 24) return; mapAcc = 0;
      mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, ui.map.width, ui.map.height); mg.drawImage(mapBase, 0, 0); mg.scale(mdpr, mdpr);
      mg.fillStyle = '#ffcf33';
      sparkles.forEach(s => { if (s.got) return; const [x, y] = MX(s.g.position.x, s.g.position.z); mg.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); });
      const [hx, hy] = MX(H.pos.x, H.pos.z), dx = -Math.cos(H.heading), dy = Math.sin(H.heading);
      mg.fillStyle = 'rgba(255,122,89,.28)'; mg.beginPath(); mg.arc(hx, hy, 8, 0, TAU); mg.fill();
      mg.fillStyle = '#2d2440'; mg.beginPath(); mg.moveTo(hx + dx * 8, hy + dy * 8); mg.lineTo(hx - dy * 3.6, hy + dx * 3.6); mg.lineTo(hx + dy * 3.6, hy - dx * 3.6); mg.fill();
      mg.fillStyle = '#ff7a59'; mg.strokeStyle = '#fff'; mg.lineWidth = 1.6; mg.beginPath(); mg.arc(hx, hy, 3.6, 0, TAU); mg.fill(); mg.stroke();
    }

    /* ---------------- palette */
    const P = {};
    for (const k of ['top', 'mid', 'hor', 'sun', 'deep', 'shallow']) P[k] = [hexV3(DAY[k]), hexV3(DUSK[k])];
    const cA = new THREE.Color(), cB = new THREE.Color(), vTmp = new THREE.Vector3();
    function applyPalette(k) {
      skyU.uTop.value.lerpVectors(P.top[0], P.top[1], k); skyU.uMid.value.lerpVectors(P.mid[0], P.mid[1], k); skyU.uHor.value.lerpVectors(P.hor[0], P.hor[1], k); skyU.uSunCol.value.lerpVectors(P.sun[0], P.sun[1], k);
      seaU.uDeep.value.lerpVectors(P.deep[0], P.deep[1], k); seaU.uShallow.value.lerpVectors(P.shallow[0], P.shallow[1], k); seaU.uFog.value.copy(skyU.uHor.value); seaU.uSun.value.copy(skyU.uSunCol.value);
      const hv = skyU.uHor.value; scene.fog.color.setRGB(hv.x, hv.y, hv.z, THREE.SRGBColorSpace);
      sun.color.copy(cA.set(DAY.sunL).lerp(cB.set(DUSK.sunL), k)); sun.intensity = lerp(DAY.sunI, DUSK.sunI, k);
      hemi.color.copy(cA.set(DAY.hemiS).lerp(cB.set(DUSK.hemiS), k)); hemi.groundColor.copy(cA.set(DAY.hemiG).lerp(cB.set(DUSK.hemiG), k)); hemi.intensity = lerp(DAY.hemiI, DUSK.hemiI, k);
      sunDir.set(lerp(-.35, -.15, k), lerp(.55, .1, k), -1).normalize(); skyU.uSunDir.value.copy(sunDir);
    }

    /* ---------------- frame */
    const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), T = new THREE.Vector3(), lookTmp = new THREE.Vector3();
    let time = 0, last = performance.now(), firstFrame = true;
    let activeZone = -1, emoteDelay = -1;

    function heroUpdate(dt, now) {
      // intro pop
      if (H.pop >= 0 && H.pop < 2.4) {
        const t0 = H.pop; H.pop += dt;
        if (t0 < .05 && H.pop >= .05) { H.jumpV = 7.2; H.grounded = false; H.sqV += 5; spawn(v1.copy(H.pos).setY(H.pos.y + .1), 9, { speed: 2.6, up: .7, s0: .2, s1: .62, life: .5 }); }
        if (t0 < 1.0 && H.pop >= 1.0) doWaveForce();
        if (H.pop >= 2.4) introDone = true;
      }
      const sc = H.pop < 0 ? .001 : (() => { const t = clamp(H.pop / .55); return t >= 1 ? 1 : Math.max(.001, 1 - Math.pow(2, -9 * t) * Math.cos(t * 9.5)); })();
      hero.root.scale.setScalar(sc);
      // jump
      if (jumpReq && H.grounded && introDone) { H.jumpV = 6.3; H.grounded = false; H.sqV += 3.8; spawn(v1.copy(H.pos).setY(H.pos.y + .05), 5, { speed: 1.2, up: .3, s0: .2, s1: .55, life: .4 }); }
      jumpReq = false;
      if (!H.grounded) {
        H.jumpV -= 18 * dt; H.jumpY += H.jumpV * dt;
        if (H.jumpY <= 0) {
          const impact = Math.min(1, Math.abs(H.jumpV) / 7); H.jumpY = 0; H.jumpV = 0; H.grounded = true; H.sqV -= 5.5 * impact;
          spawn(v1.copy(H.pos).setY(H.pos.y + .08), 8, { speed: 2 * impact + .6, up: .35, s0: .25, s1: .8 * impact + .3, life: .5 });
        }
      }
      // squash spring
      const acc = -140 * (H.sq - 1) - 11 * H.sqV; H.sqV += acc * dt; H.sq += H.sqV * dt; H.sq = clamp(H.sq, .6, 1.5);
      hero.body.scale.set(1 / Math.sqrt(H.sq), H.sq, 1 / Math.sqrt(H.sq));
      // walk cycle
      const sp = H.speed, wk = clamp(sp / 4.4, 0, 1.6);
      H.walk += (wk - H.walk) * dampK(10, dt);
      const w = H.walk;
      H.phase += dt * (sp * 2.5 + (w > .02 ? 1 : 0));
      const s1 = Math.sin(H.phase), air = H.grounded ? 0 : 1;
      hero.legs[0].rotation.x = lerp(s1 * .8 * Math.min(w, 1.2), -.5, air); hero.legs[1].rotation.x = lerp(-s1 * .8 * Math.min(w, 1.2), .35, air);
      const armSwing = -s1 * .7 * Math.min(w, 1.2);
      hero.arms[0].rotation.x = lerp(armSwing, -.4, air); hero.arms[1].rotation.x = lerp(-armSwing, -.4, air);
      hero.arms[0].rotation.z = lerp(-.12, -1.2, air); hero.arms[1].rotation.z = lerp(.12, 1.2, air);
      const breathe = Math.sin(time * 2.6) * .018 * (1 - Math.min(1, w));
      hero.body.position.y = Math.abs(Math.cos(H.phase)) * .07 * Math.min(w, 1.3) + breathe;
      hero.body.rotation.x = .1 * Math.min(w, 1.5);
      hero.head.rotation.x = -.06 * Math.min(w, 1.5) + Math.sin(H.phase * 2) * .03 * w;
      hero.head.rotation.z = Math.sin(time * .8) * .05 * (1 - Math.min(1, w));
      hero.head.rotation.y = Math.sin(time * .45) * .25 * (1 - Math.min(1, w)) * (H.wave > 0 ? 0 : 1);
      hero.tail.rotation.x = .3 + w * .5 + Math.sin(time * 9 + H.phase) * .12 * (w + .2);
      // wave
      if (H.wave > 0) {
        H.wave -= dt; H.waveClock += dt;
        const e = smooth(0, .25, H.waveClock) * (1 - smooth(1.3, 1.6, H.waveClock));
        hero.arms[0].rotation.z = lerp(hero.arms[0].rotation.z, -2.6 + Math.sin(H.waveClock * 13) * .35, e);
        hero.arms[0].rotation.x = lerp(hero.arms[0].rotation.x, 0, e);
        hero.head.rotation.z += .14 * e;
        hero.mouth.scale.set(1 + .4 * e, 1 + .6 * e, 1);
      } else hero.mouth.scale.set(1, 1, 1);
      // blink
      H.blinkNext -= dt;
      if (H.blinkNext <= 0) { H.blink = .14; H.blinkNext = 1.8 + Math.random() * 3.2; }
      if (H.blink > 0) H.blink -= dt;
      const eb = H.blink > 0 ? .12 : (H.wave > 0 ? .75 : 1);
      hero.eyes.forEach(e => { e.scale.y += (eb - e.scale.y) * dampK(40, dt); });
      // sprout wobble from acceleration
      const a = (H.speed - H.lastSpeed) / Math.max(dt, 1e-3); H.lastSpeed = H.speed;
      H.sproutV += (-a * .02 - 60 * H.sprout - 5 * H.sproutV + (H.grounded ? 0 : -H.jumpV * .4)) * dt; H.sprout += H.sproutV * dt;
      hero.sprout.rotation.x = clamp(H.sprout, -.8, .8) + Math.sin(time * 3) * .05;
      // placement
      hero.root.position.set(H.pos.x, H.pos.y + H.jumpY, H.pos.z);
      hero.root.rotation.y = H.heading;
      void now;
    }
    function doWaveForce() { H.wave = 1.6; H.waveClock = 0; heartT = 1.2; B.spin = 1; }

    function frame(now) {
      if (disposed) return;
      const dtRaw = Math.min(.05, Math.max(.001, (now - last) / 1000)); last = now;
      if (document.hidden) return;
      const paused = isPaused();
      el.classList.toggle('is-paused', paused);
      const dt = dtRaw;
      if (!paused) time += dt;
      if (!introStarted && !document.querySelector('.pn-intro:not(.pn-out)')) startIntro();

      prog += (target - prog) * dampK(6, dt);
      if (Math.abs(target - prog) < 1e-5) prog = target;

      // ---- input vector
      let ix = 0, iy = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) iy += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) iy -= 1;
      ix += joyV.x; iy += joyV.y;
      let il = Math.hypot(ix, iy); if (il > 1) { ix /= il; iy /= il; il = 1; }
      if (il > .15 && introDone && U.mode !== 'free') enterFree();

      // ---- movement
      let moveSpeed = 0;
      if (U.mode === 'path') {
        const tU = pToU(prog), diff = tU - curU;
        const v = clamp(diff * L * 3.0, -15, 15);
        curU = clamp(curU + v * dt / L);
        if (Math.abs(diff * L) < .002) curU = tU;
        pointAt(curU, H.pos); curve.getTangentAt(curU, T);
        moveSpeed = Math.abs(v) < .05 ? 0 : Math.abs(v);
        if (moveSpeed > .3) H.heading += angDiff(H.heading, Math.atan2(T.x * Math.sign(v), T.z * Math.sign(v))) * dampK(9, dt);
        else if (activeZone >= 0) H.heading += angDiff(H.heading, Math.atan2(camera.position.x - H.pos.x, camera.position.z - H.pos.z)) * dampK(2.5, dt);
      } else if (U.mode === 'free') {
        const sy = Math.sin(freeYaw), cy = Math.cos(freeYaw);
        const fx_ = -sy, fz = -cy, rx = cy, rz = -sy;
        const dx = (fx_ * iy + rx * ix), dz = (fz * iy + rz * ix);
        const speed = (run ? 7.2 : 4.6) * il;
        if (il > .05) {
          const nx = H.pos.x + dx / il * speed * dt, nz = H.pos.z + dz / il * speed * dt;
          const ox = H.pos.x, oz = H.pos.z;
          if (walkable(nx, nz)) { H.pos.x = nx; H.pos.z = nz; }
          else if (walkable(nx, oz)) H.pos.x = nx;
          else if (walkable(ox, nz)) H.pos.z = nz;
          moveSpeed = Math.hypot(H.pos.x - ox, H.pos.z - oz) / dt;
          H.heading += angDiff(H.heading, Math.atan2(dx, dz)) * dampK(12, dt);
        }
        const gy = groundAt(H.pos.x, H.pos.z); if (isFinite(gy)) H.pos.y += (gy - H.pos.y) * dampK(25, dt);
        // scrolling while exploring nudges the return button
        if (Math.abs(target - (U.freeTarget ?? target)) > .004) { U.freeTarget = target; if (U.scrollNag <= 0) { toast('지금은 자유 탐험 중이에요 — ‘경로로 돌아가기’를 누르면 스크롤 여정으로 돌아가요.', 3.2); U.scrollNag = 6; ui.ret.classList.remove('is-nudge'); void ui.ret.offsetWidth; ui.ret.classList.add('is-nudge'); } }
        U.scrollNag -= dt;
      } else if (U.mode === 'return') {
        v1.set(retTarget.x - H.pos.x, 0, retTarget.z - H.pos.z); const d = v1.length();
        const step = Math.min(d, 6 * dt);
        if (d > .02) { H.pos.x += v1.x / d * step; H.pos.z += v1.z / d * step; H.heading += angDiff(H.heading, Math.atan2(v1.x, v1.z)) * dampK(10, dt); }
        moveSpeed = step / dt;
        const gy = groundAt(H.pos.x, H.pos.z); if (isFinite(gy)) H.pos.y += (gy - H.pos.y) * dampK(25, dt);
        if (d < .05) finishReturn();
      }
      if (U.mode !== 'free') U.freeTarget = target;
      H.speed += (moveSpeed - H.speed) * dampK(12, dt);
      if (H.speed > 6.2 && H.grounded && Math.random() < dt * 9) spawn(v1.copy(H.pos).setY(H.pos.y + .05), 1, { speed: .4, up: .4, s0: .2, s1: .5, life: .45 });
      heroUpdate(dt, now);

      // ---- zones / islands
      let az = -1;
      ZONES.forEach((Z, i) => { if (Math.hypot(H.pos.x - Z.pos.x, H.pos.z - Z.pos.z) < (U.mode === 'free' ? 4.2 : 3.2)) az = i; });
      if (az !== activeZone) {
        if (activeZone >= 0) { U.dismissed[activeZone] = false; if (U.dlg === activeZone) closeDialog(false); }
        activeZone = az;
        if (az >= 0) emoteDelay = .35;
      }
      if (emoteDelay > 0) { emoteDelay -= dt; if (emoteDelay <= 0 && activeZone >= 0) { if (!U.dismissed[activeZone]) openDialog(activeZone); if (H.grounded) { jumpReq = true; } setTimeout(() => { if (!disposed) doWaveForce(); }, 450); } }
      const isl = ISLANDS.findIndex(I => Math.hypot(H.pos.x - I.x, H.pos.z - I.z) < I.r - 1);
      if (isl >= 0 && isl !== U.island) {
        U.island = isl; const I = ISLANDS[isl];
        if (introDone || isl !== 0) {
          if (I.zone != null) { const Z = ZONES[I.zone]; banner(`ZONE 0${I.zone + 1}`, Z.en, Z.ko, Z.color); }
          else if (I.banner) banner(...I.banner);
        }
      }

      // ---- typewriter
      if (U.dlg >= 0) {
        if (paused) U.typed = 1e6;
        if (U.typed < U.full.length) {
          U.typed += dt * 38; const n = Math.min(U.full.length, Math.floor(U.typed));
          if (ui.dText.textContent.length !== n) ui.dText.textContent = U.full.slice(0, n);
        } else if (!ui.dialog.classList.contains('is-done')) { ui.dText.textContent = U.full; ui.dialog.classList.add('is-done'); }
      }

      // ---- sparkles
      for (const s of sparkles) {
        if (s.got) {
          if (s.t < 1) { s.t += dt * 2.6; const k = s.t; s.g.scale.setScalar(k < .3 ? 1 + k * 2.5 : Math.max(.001, (1 - k) * 2.5)); s.g.position.y += dt * 2; if (s.t >= 1) s.g.visible = false; }
          continue;
        }
        s.g.position.y = s.y + Math.sin(time * 2.2 + s.ph) * .12;
        s.m.rotation.y = time * 2 + s.ph;
        s.gl.material.opacity = .65 + Math.sin(time * 5 + s.ph) * .25;
        const dx = s.g.position.x - H.pos.x, dz = s.g.position.z - H.pos.z, dy = s.g.position.y - (H.pos.y + H.jumpY + .9);
        if (dx * dx + dz * dz < 1.1 && Math.abs(dy) < .85 && H.visible && hero.root.scale.x > .5) {
          s.got = true; s.t = 0; U.count++;
          spawn(s.g.position, 7, { color: '#ffe066', map: glowMap, speed: 2.2, up: 1.2, s0: .35, s1: .1, life: .6, add: true });
          ui.countN.textContent = String(U.count); ui.count.classList.remove('is-bump'); void ui.count.offsetWidth; ui.count.classList.add('is-bump');
          if (U.count === SPARK_TOTAL) { toast(`반짝이 ${SPARK_TOTAL}개를 모두 모았어요! 진짜 탐험가네요 ✦`, 4.5); doWaveForce(); }
          else if (s.hidden) toast('숨겨진 반짝이를 찾았어요!', 2.2);
        }
      }

      // ---- fx
      for (const f of fx) {
        if (f.life <= 0) continue;
        f.life -= dt; const k = 1 - f.life / f.max;
        if (f.life <= 0) { f.sp.visible = false; continue; }
        f.sp.position.addScaledVector(f.vel, dt); f.vel.multiplyScalar(Math.exp(-dt * 3));
        f.sp.scale.setScalar(lerp(f.s0, f.s1, Math.sqrt(k))); f.sp.material.opacity = (1 - k) * .75;
      }
      if (heartT > 0) {
        heartT -= dt; const k = 1 - heartT / 1.2; heart.visible = true;
        heart.position.set(H.pos.x, H.pos.y + H.jumpY + 2.35 + k * .5, H.pos.z);
        heart.scale.setScalar(.55 * (k < .2 ? smooth(0, .2, k) * 1.2 : 1));
        heart.material.opacity = 1 - smooth(.7, 1, k);
      } else heart.visible = false;

      // ---- buddy
      if (H.visible) B.vis = Math.min(1, B.vis + dt * (H.pop > .6 ? 1.6 : 0));
      buddy.scale.setScalar(Math.max(.001, B.vis < 1 ? 1 - Math.pow(1 - B.vis, 3) * Math.cos(B.vis * 6) : 1));
      {
        const sh = Math.sin(H.heading), ch = Math.cos(H.heading);
        const ox = .95, oz = -.7; // hero-local: to the left, slightly behind
        v1.set(H.pos.x + ch * ox + sh * oz, H.pos.y + 1.55 + Math.sin(time * 2.3) * .14, H.pos.z - sh * ox + ch * oz);
        B.pos.lerp(v1, dampK(3.2, dt));
        buddy.position.copy(B.pos);
        v2.set(camera.position.x - B.pos.x, 0, camera.position.z - B.pos.z);
        const faceCam = Math.atan2(v2.x, v2.z), faceH = H.heading;
        let yaw = H.speed > 1 ? faceH : faceCam;
        if (B.spin > 0) { B.spin = Math.max(0, B.spin - dt * 1.4); yaw += (1 - B.spin) * TAU; }
        buddy.rotation.y += angDiff(buddy.rotation.y, yaw) * dampK(6, dt);
        if (B.spin > 0) buddy.rotation.y = yaw;
        buddy.rotation.z = Math.sin(time * 1.7) * .08;
      }

      // ---- ambient world
      if (!paused) {
        grassUniform.value = time; seaU.uTime.value = time;
        clouds.forEach(c => { c.g.position.x += c.sp * dt; if (c.g.position.x > 75) c.g.position.x = -65; });
        floaters.forEach(f => { f.g.position.y = f.y + Math.sin(time * .5 + f.ph) * .5; f.g.rotation.y += dt * .05; });
        if (anim.holo) anim.holo.uniforms.uTime.value = time;
        anim.cubes.forEach(c => { const u = c.userData, a = u.a + time * u.sp; c.position.set(Math.cos(a) * u.r, u.y + Math.sin(a * 2) * .6, u.bz + Math.sin(a) * 1.2); c.rotation.set(time, time * 1.3, 0); });
        if (anim.antenna) anim.antenna.scale.setScalar(.8 + .4 * (Math.sin(time * 4) > .2 ? 1 : 0));
        if (anim.gear) anim.gear.rotation.z = -time * 1.2;
        anim.smoke.forEach(s => { const k = (time * .35 + s.userData.o) % 1; s.position.set(.9 + Math.sin(k * 6 + s.userData.o * 9) * .25, 4.1 + k * 2.6, -.5); s.scale.setScalar(.35 + k * 1.1); s.material.opacity = (1 - k) * .75; });
        anim.crystals.forEach(c => { c.position.y = c.userData.y + Math.sin(time * 1.2 + c.userData.ph) * .12; c.rotation.y += dt * .3; });
        if (anim.lens) { anim.lens.gm.uniforms.uTime.value = time; anim.lens.g.position.y = 2.9 + Math.sin(time * 1.1) * .1; }
        if (anim.planet) anim.planet.rotation.y = time * .25;
        anim.rings.forEach(r => { r.spin.rotation.y = time * r.sp; });
        anim.twinkles.forEach(t => { t.scale.setScalar(.5 + .7 * Math.abs(Math.sin(time * 2 + t.userData.ph))); });
        if (anim.slit) anim.slit.rotation.y = Math.sin(time * .2) * .6;
        if (anim.flame) { anim.flame.scale.set(1 + Math.sin(time * 17) * .1, 1 + Math.sin(time * 13) * .2, 1); }
        bigTrees.forEach(c => { c.rotation.z = Math.sin(time * .9) * .03; c.rotation.x = Math.cos(time * .7) * .02; });
        butterflies.forEach(b => {
          const t = time + b.ph, I = b.I;
          const x = I.x + Math.sin(t * b.a) * b.R, z = I.z + Math.cos(t * b.b) * b.R * .8;
          const gy = groundAt(x, z), y = (isFinite(gy) ? gy : I.h) + 1.1 + Math.sin(t * 1.9) * .35;
          const px = b.g.position.x, pz = b.g.position.z;
          b.g.position.set(x, y, z);
          if (Math.abs(x - px) + Math.abs(z - pz) > 1e-4) b.g.rotation.y = Math.atan2(x - px, z - pz) - Math.PI / 2;
          const f = Math.sin(t * 22) * 1.1; b.l.rotation.y = f; b.r.rotation.y = -f;
        });
        birds.forEach(b => {
          const a = time * .12 + b.ph, x = 8 + Math.cos(a) * b.rad, z = -55 + Math.sin(a) * b.rad * 1.6;
          b.g.position.set(x, b.y + Math.sin(time * .8 + b.ph) * .6, z);
          b.g.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a) * 1.6);
          const f = Math.sin(time * 6 + b.ph * 3) * .6; b.l.rotation.z = f; b.r.rotation.z = -f;
        });
      }

      // ---- palette (day -> sunset toward the end)
      const dusk = smooth(-76, -108, H.pos.z);
      applyPalette(dusk);
      anim.lanterns.forEach(l => { l.gl.material.opacity = .9 * dusk; });

      // ---- camera targets
      curve.getTangentAt(U.mode === 'path' ? curU : nearestS(H.pos.x, H.pos.z).u, T);
      const tYaw = Math.atan2(T.x, T.z);
      const narrow = innerWidth / innerHeight < .9;
      camT.yaw = tYaw + Math.PI + .38; camT.dist = narrow ? 10 : 8.6; camT.h = narrow ? 5 : 4.3;
      camT.look.set(H.pos.x + T.x * 2.4, H.pos.y + 1.2, H.pos.z + T.z * 2.4);
      if (U.mode === 'path') {
        // intro: in front of the hero
        const iB = 1 - smooth(.004, .05, prog);
        if (iB > 0) {
          const iy = tYaw + .3;
          camT.yaw += angDiff(camT.yaw, iy) * iB;
          camT.dist = lerp(camT.dist, narrow ? 8.2 : 7.0, iB); camT.h = lerp(camT.h, narrow ? 2.2 : 1.9, iB);
          v1.set(H.pos.x, H.pos.y + 1.45, H.pos.z);
          // offset so the hero sits right of the title (desktop) or below it (portrait)
          const ry = iy; const rx = Math.cos(ry), rz = -Math.sin(ry);
          if (narrow) v1.y += 1.1; else { v1.x -= rx * 1.7; v1.z -= rz * 1.7; }
          camT.look.lerp(v1, iB);
        }
        // landmark dwell: cinematic swing framing hero + building
        ZONES.forEach((Z, i) => {
          const d = Math.abs(curU - Z.u) * L, wgt = 1 - smooth(1.2, 7, d);
          if (wgt <= 0) return;
          const [bx, bz] = Z.build, pk = PK[2 + i * 2], pk2 = PK[3 + i * 2];
          const sw = clamp((prog - (pk[0] + pk2[0]) / 2) / ((pk2[0] - pk[0]) / 2 + .03), -1.3, 1.3);
          const b0 = Math.atan2(H.pos.x - bx, H.pos.z - bz);
          // pick the side that puts the hero screen-left of the landmark (dialog sits on the right)
          const side = ((H.pos.x - bx) * Math.cos(b0 + .55) - (H.pos.z - bz) * Math.sin(b0 + .55)) < 0 ? 1 : -1;
          const yaw = b0 + side * .55 + sw * .45;
          camT.yaw += angDiff(camT.yaw, yaw) * wgt;
          camT.dist = lerp(camT.dist, narrow ? 17 : 12, wgt); camT.h = lerp(camT.h, narrow ? 6.5 : 3.6, wgt);
          v1.set(lerp(H.pos.x, bx, narrow ? .42 : .5), H.pos.y + (i === 2 ? 4.2 : 3.0), lerp(H.pos.z, bz, narrow ? .42 : .5));
          if (!narrow) { const cy = Math.cos(yaw), sy = Math.sin(yaw); v1.x += cy * 2.6; v1.z -= sy * 2.6; } // push the subject left of the dialog
          else v1.y -= U.dlg >= 0 ? 4.6 : 2.2; // portrait: lift hero + landmark above the bottom sheet
          camT.look.lerp(v1, wgt);
        });
        // finale: pull back toward the sunset
        const fW = smooth(1 - 9 / L, 1, curU);
        if (fW > 0) {
          camT.yaw += angDiff(camT.yaw, tYaw + Math.PI + .75 + Math.sin(time * .1) * .1) * fW;
          camT.dist = lerp(camT.dist, narrow ? 15 : 12.5, fW); camT.h = lerp(camT.h, narrow ? 3.8 : 2.6, fW);
          v1.set(H.pos.x + T.x * 5, H.pos.y + (narrow ? 3.4 : 2.9), H.pos.z + T.z * 5); camT.look.lerp(v1, fW);
        }
        camT.yaw += dragYaw;
        if (!drag) dragYaw *= Math.exp(-dt * .9);
      } else {
        camT.yaw = freeYaw; camT.dist = narrow ? 10 : 8.4; camT.h = narrow ? 5 : 4.4;
        camT.look.set(H.pos.x, H.pos.y + 1.2, H.pos.z);
      }
      if (firstFrame || !cam.init) { cam.yaw = camT.yaw; cam.dist = camT.dist; cam.h = camT.h; cam.look.copy(camT.look); cam.anchor.copy(H.pos); cam.init = true; }
      const kc = dampK(3.2, dt);
      cam.yaw += angDiff(cam.yaw, camT.yaw) * dampK(drag ? 14 : 3, dt);
      cam.dist += (camT.dist - cam.dist) * kc; cam.h += (camT.h - cam.h) * kc;
      cam.look.lerp(camT.look, dampK(6, dt));
      cam.anchor.lerp(H.pos, dampK(8, dt));
      camera.position.set(cam.anchor.x + Math.sin(cam.yaw) * cam.dist, cam.anchor.y + cam.h, cam.anchor.z + Math.cos(cam.yaw) * cam.dist);
      camera.lookAt(cam.look);
      sky.position.copy(camera.position);
      sea.position.x = Math.round(camera.position.x / 10) * 10; sea.position.z = Math.round(camera.position.z / 10) * 10;
      seaU.uCam.value.copy(camera.position);
      updateSway(time, camera.position);
      sun.position.copy(H.pos).addScaledVector(sunDir, 45); sun.target.position.copy(H.pos); sun.target.updateMatrixWorld();

      // ---- UI
      const introV = U.introOn ? 1 - smooth(.008, .035, prog) : 0;
      el.style.setProperty('--intro', introV.toFixed(3));
      ui.intro.style.visibility = introV < .01 ? 'hidden' : '';
      const finOn = (U.mode === 'path' ? curU > 1 - 2.5 / L : Math.hypot(H.pos.x - endPos.x, H.pos.z - endPos.z) < 5) && introDone;
      if (finOn !== U.fin) {
        U.fin = finOn; setVis(ui.fin, finOn); el.classList.toggle('is-fin', finOn);
        if (finOn) { ui.finScore.textContent = `✦ 반짝이 ${U.count} / ${SPARK_TOTAL}개를 모았어요${U.count < SPARK_TOTAL ? ' — 자유 이동으로 숨겨진 반짝이를 찾아보세요!' : '!'}`; doWaveForce(); }
      }
      el.classList.toggle('has-dialog', U.dlg >= 0);
      el.style.setProperty('--hud', String(introDone ? 1 : 0));
      el.style.setProperty('--hud2', introDone ? (1 - introV).toFixed(3) : '0');
      if (U.bannerT > 0) { U.bannerT -= dt; if (U.bannerT <= 0) ui.banner.classList.remove('is-on'); }
      if (U.toastT > 0) { U.toastT -= dt; if (U.toastT <= 0) ui.toast.classList.remove('is-on'); }
      drawMap(dt);

      renderer.render(scene, camera);
      firstFrame = false;
    }

    if (gsap) { tickerFn = () => frame(performance.now()); gsap.ticker.add(tickerFn); }
    else { const loop = now => { rafId = requestAnimationFrame(loop); frame(now); }; rafId = requestAnimationFrame(loop); }
    if (touch) setTimeout(() => { if (!disposed) toast('조이스틱으로 자유롭게 걷고, 화면을 스와이프하면 여정이 이어져요.', 4); }, 4200);

    teardown = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (gsap) { if (tickerFn) gsap.ticker.remove(tickerFn); if (lenisFn) gsap.ticker.remove(lenisFn); gsap.ticker.lagSmoothing(500, 33); }
      ctx?.revert(); lenis?.destroy();
      const geos = new Set(), mats = new Set();
      scene.traverse(o => {
        if (o.geometry && !o.isSprite) geos.add(o.geometry);
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
        if (o.isInstancedMesh) o.dispose?.();
      });
      geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose());
      matCache.forEach(m => m.dispose());
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
