// "Beyond Gravity: Flight" — world `space` (world 01).
// Pilot a procedural starfighter: hangar power-up and countdown, launch burst, an asteroid-belt
// run through ring gates, three project planets with holographic mission panels, hyperspace warps
// between them, and a final approach to a black hole. Scroll = throttle, pointer/keys = stick.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { projects, profileURL } from '../content.js?v=ten-worlds-1';

const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs'
};
const ART = { vrm: 'art/vrm.jpg', pixelle: 'art/glass.jpg', motion: 'art/orbit.jpg' };
const PA = '#7b5cff', PB = '#4de2ff';
const PLANETS = [
  { code: 'VRM-01', world: 'Persona Prime', ko: '목소리로 깨어나는 행성', tint: '#8a63ff', atmo: '#b39bff', side: 1, ring: false },
  { code: 'PXL-02', world: 'Glass Forge', ko: '영상이 주조되는 유리 행성', tint: '#3fd8ff', atmo: '#8ff3ff', side: -1, ring: true },
  { code: 'TDW-03', world: 'Tenfold Orbit', ko: '열 개의 세계가 도는 궤도', tint: '#ff7ac8', atmo: '#ffb3dc', side: 1, ring: true }
];
const TRACK_VH = 1150;

// progress -> distance travelled (units along -Z)
const KEYS = [
  [0, 0], [.085, 0], [.10, 40], [.15, 420], [.29, 1500], [.31, 1600], [.40, 1720], [.41, 1760],
  [.47, 5560], [.48, 5600], [.57, 5720], [.58, 5760], [.64, 9560], [.65, 9600], [.74, 9720], [.75, 9760],
  [.82, 13560], [.84, 13700], [1, 14300]
];
const WARPS = [[.41, .47], [.58, .64], [.75, .82]];
const ORBITS = [[.31, .41], [.48, .58], [.65, .75]];
const PANEL_ON = [[.325, .405], [.495, .575], [.665, .745]];
const PLANET_D = [1700, 5700, 9700];
const GATES = [640, 940, 1240];
const BH_D = 14950;
const BELT = [450, 1450];
const STAGES = [
  { id: 'hangar', at: 0, go: 0, label: 'HANGAR', ko: '격납고', kick: 'BAY 07' },
  { id: 'launch', at: .095, go: .125, label: 'LAUNCH', ko: '발진', kick: 'IGNITION' },
  { id: 'belt', at: .16, go: .2, label: 'ASTEROID BELT', ko: '소행성대 돌파', kick: 'SECTOR 2' },
  { id: 'p0', at: .31, go: .36, planet: 0 },
  { id: 'p1', at: .48, go: .535, planet: 1 },
  { id: 'p2', at: .65, go: .705, planet: 2 },
  { id: 'end', at: .83, go: .985, label: 'SINGULARITY', ko: '특이점', kick: 'FINAL APPROACH' }
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n, l = 2) => String(n).padStart(l, '0');

function pchip(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), n = xs.length, h = [], dl = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; dl[i] = (ys[i + 1] - ys[i]) / h[i]; }
  m[0] = dl[0]; m[n - 1] = dl[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (dl[i - 1] * dl[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i]); }
  }
  return x => {
    x = clamp(x, xs[0], xs[n - 1]);
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}
const distAt = pchip(KEYS);
const beltEnv = d => smooth(380, 580, d) * (1 - smooth(1360, 1540, d));
const pathX = d => beltEnv(d) * (15 * Math.sin(d * .0062) + 5 * Math.sin(d * .017 + 1.3));
const pathY = d => beltEnv(d) * (5 * Math.sin(d * .0094 + .6));
const warpAt = p => WARPS.reduce((w, [a, b]) => Math.max(w, smooth(a, a + .014, p) * (1 - smooth(b - .014, b, p))), 0);
const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));

/* ------------------------------------------------------------------ markup */

const letters = (word, off = 0) => [...word].map((ch, i) => `<span class="fl-l" style="--i:${i + off};--rx:${rand(-40, 40).toFixed(0)}vw;--ry:${rand(-30, 30).toFixed(0)}vh;--rr:${rand(-90, 90).toFixed(0)}deg">${esc(ch)}</span>`).join('');

function liveMarkup() {
  const panels = projects.map((p, i) => {
    const pl = PLANETS[i];
    return `
    <article class="fl-panel" data-panel="${i}" data-side="${pl.side > 0 ? 'left' : 'right'}" style="--c:${pl.tint};--c2:${pl.atmo}" aria-hidden="true" inert>
      <i class="fl-corner fl-corner--tl"></i><i class="fl-corner fl-corner--tr"></i><i class="fl-corner fl-corner--bl"></i><i class="fl-corner fl-corner--br"></i>
      <header class="fl-panel-head"><span>WAYPOINT ${pad(i + 1)} · ${esc(pl.code)}</span><span class="fl-panel-st"><b></b>ORBIT LOCKED</span></header>
      <figure class="fl-panel-img"><img src="${ART[p.id] || 'art/orbit.jpg'}" alt="${esc(p.name)} 대표 이미지" decoding="async"><i class="fl-panel-sweep"></i><figcaption>${esc(pl.world)} — ${esc(pl.ko)}</figcaption></figure>
      <p class="fl-panel-cat">${esc(p.category)}</p>
      <h2 class="fl-panel-name">${esc(p.name)}</h2>
      <p class="fl-panel-desc">${esc(p.description)}</p>
      <p class="fl-panel-body">${esc(p.body)}</p>
      <ul class="fl-chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <a class="fl-panel-link" href="${esc(p.url)}" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a>
    </article>`;
  }).join('');
  const nav = STAGES.map((s, i) => {
    const name = s.planet != null ? PLANETS[s.planet].code : s.label;
    const ko = s.planet != null ? projects[s.planet].name : s.ko;
    return `<li data-n="${i}"><button type="button" data-go="${i}" aria-label="${esc(ko)}(으)로 이동"><i></i><span>${esc(name)}</span></button></li>`;
  }).join('');
  const tape = [];
  for (let a = -180; a <= 720; a += 15) tape.push(`<span style="left:${(a + 180) * 4}px">${a % 45 === 0 ? pad(((a % 360) + 360) % 360, 3) : '·'}</span>`);
  return `
  <div class="fl" data-no-kx>
    <canvas class="fl-canvas" aria-hidden="true"></canvas>
    <div class="fl-cockpit" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <path class="fl-ck-frame" d="M0 0H1600V900H0Z M140 900 L420 120 Q800 40 1180 120 L1460 900Z" fill-rule="evenodd"/>
        <path class="fl-ck-strut" d="M420 120 L140 900 M1180 120 L1460 900 M800 52 L800 0"/>
        <path class="fl-ck-dash" d="M0 900 L0 760 Q400 690 800 690 Q1200 690 1600 760 L1600 900Z"/>
        <g class="fl-ck-glow"><rect x="560" y="722" width="160" height="10" rx="5"/><rect x="880" y="722" width="160" height="10" rx="5"/><circle cx="800" cy="760" r="18"/></g>
      </svg>
    </div>
    <div class="fl-flash" aria-hidden="true"></div>
    <div class="fl-vignette" aria-hidden="true"></div>
    <div class="fl-ui">
      <section class="fl-title">
        <p class="fl-eyebrow"><span>WORLD 01</span><i></i><span>FLIGHT DECK · BAY 07</span></p>
        <h1 class="fl-h1" aria-label="Beyond Gravity"><span class="fl-row">${letters('BEYOND')}</span><span class="fl-row fl-row--b">${letters('GRAVITY', 6)}</span></h1>
        <p class="fl-sub">스크롤이 스로틀입니다. 포인터로 기체를 조종하고,<br>스페이스로 부스트하세요.</p>
        <div class="fl-hint"><span>SCROLL TO IGNITE</span><i></i></div>
      </section>
      <div class="fl-count" aria-hidden="true"><small>T-MINUS</small><b>3</b></div>
      <div class="fl-banner" aria-hidden="true"><span class="fl-banner-k"></span><b class="fl-banner-t"></b><small class="fl-banner-ko"></small></div>
      <div class="fl-hud" aria-hidden="true">
        <div class="fl-log"><p class="fl-log-h"><b></b>MISSION LOG</p><ol></ol></div>
        <svg class="fl-reticle" viewBox="-60 -60 120 120"><circle r="34"/><path d="M-52 0H-40M40 0H52M0 -52V-40M0 40V52"/><path class="fl-ret-in" d="M-12 0H-4M4 0H12M0 4V10"/><circle class="fl-ret-dot" r="1.6"/></svg>
        <div class="fl-lock"><i></i><i></i><i></i><i></i><span class="fl-lock-l"><b></b><em></em></span></div>
        <div class="fl-speed"><small>VELOCITY</small><b>0.0</b><span>km/s</span><i class="fl-throttle"><u></u></i><em class="fl-boost">BOOST</em></div>
        <div class="fl-tape"><div class="fl-tape-s">${tape.join('')}</div><i></i><span class="fl-hdg">000</span></div>
        <dl class="fl-read">
          <div><dt>ALT</dt><dd data-r="alt">—</dd></div>
          <div><dt>TGT</dt><dd data-r="dist">—</dd></div>
          <div><dt>G-LOAD</dt><dd data-r="g">1.00</dd></div>
          <div><dt>SECTOR</dt><dd data-r="stage">BAY 07</dd></div>
        </dl>
        <div class="fl-radar"><canvas></canvas><span>RADAR · 900</span></div>
        <div class="fl-warp"><b>HYPERSPACE</b><small></small></div>
      </div>
      ${panels}
      <section class="fl-fin" aria-hidden="true" inert>
        <p class="fl-eyebrow"><span>EVENT HORIZON</span><i></i><span>MISSION COMPLETE</span></p>
        <h2 class="fl-fin-t"><span>Code</span> <em>beyond gravity.</em></h2>
        <p class="fl-fin-sub">세 개의 행성, 하나의 조종사. 다음 궤도는 GitHub에서 이어집니다.</p>
        <div class="fl-fin-actions"><a class="fl-btn fl-btn--hot" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 더 보기 <span aria-hidden="true">↗</span></a><button type="button" class="fl-btn" data-top>격납고로 귀환 <span aria-hidden="true">↺</span></button></div>
      </section>
      <nav class="fl-nav" aria-label="비행 경로"><ol>${nav}</ol></nav>
      <div class="fl-ctrl"><button type="button" class="fl-view" data-view aria-pressed="false"><span>VIEW</span> <b>CHASE</b></button><span class="fl-keys"><kbd>WASD</kbd> 조종 · <kbd>SPACE</kbd> 부스트 · <kbd>C</kbd> 시점</span></div>
      <p class="fl-loading" aria-live="polite">비행 시스템 부팅 중…</p>
    </div>
    <div class="fl-track" style="height:${TRACK_VH}vh"></div>
  </div>`;
}

function staticMarkup() {
  return `
  <div class="fl fl--static" data-no-kx>
    <header class="fls-head">
      <p class="fl-eyebrow"><span>WORLD 01</span><i></i><span>MISSION BRIEFING</span></p>
      <h1 class="fls-title">Beyond <em>Gravity</em></h1>
      <p class="fl-sub">세 개의 행성을 경유하는 비행 계획서입니다. 각 행성은 하나의 프로젝트입니다.</p>
    </header>
    <ol class="fls-list">
      ${projects.map((p, i) => { const pl = PLANETS[i]; return `
      <li class="fls-item" style="--c:${pl.tint};--c2:${pl.atmo}">
        <div class="fls-planet" aria-hidden="true"><span style="background-image:url(${ART[p.id] || 'art/orbit.jpg'})"></span>${pl.ring ? '<i></i>' : ''}</div>
        <div class="fls-copy">
          <span class="fl-panel-head"><span>WAYPOINT ${pad(i + 1)} · ${esc(pl.code)} · ${esc(pl.world)}</span></span>
          <p class="fl-panel-cat">${esc(p.category)}</p>
          <h2 class="fl-panel-name">${esc(p.name)}</h2>
          <p class="fl-panel-desc">${esc(p.description)}</p>
          <p class="fl-panel-body">${esc(p.body)}</p>
          <ul class="fl-chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          <a class="fl-panel-link" href="${esc(p.url)}" target="_blank" rel="noopener">프로젝트 보기 <span aria-hidden="true">↗</span></a>
        </div>
      </li>`; }).join('')}
    </ol>
    <footer class="fls-fin">
      <h2 class="fl-fin-t"><span>Code</span> <em>beyond gravity.</em></h2>
      <a class="fl-btn fl-btn--hot" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 더 보기 <span aria-hidden="true">↗</span></a>
    </footer>
  </div>`;
}

/* ------------------------------------------------------- canvas textures */

function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function glowTexture() {
  const c = cnv(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)'); gr.addColorStop(.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function hullTexture() {
  const s = 512, c = cnv(s, s), g = c.getContext('2d');
  g.fillStyle = '#c9ced8'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '40,46,60'},${rand(.02, .06)})`; g.fillRect(rand(0, s), rand(0, s), rand(20, 120), rand(10, 60)); }
  g.strokeStyle = 'rgba(30,34,46,.55)'; g.lineWidth = 1.5;
  for (let y = 0; y < s; y += 64) { g.beginPath(); g.moveTo(0, y + rand(-4, 4)); g.lineTo(s, y + rand(-4, 4)); g.stroke(); }
  for (let i = 0; i < 26; i++) { const x = rand(0, s), y = Math.floor(rand(0, 8)) * 64; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); }
  g.fillStyle = 'rgba(30,34,46,.5)';
  for (let i = 0; i < 90; i++) { g.beginPath(); g.arc(rand(0, s), rand(0, s), 1.4, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function floorTexture() {
  const w = 512, h = 1024, c = cnv(w, h), g = c.getContext('2d');
  g.fillStyle = '#16181f'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${rand(0, .025)})`; g.fillRect(rand(0, w), rand(0, h), rand(4, 60), rand(2, 30)); }
  g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 3;
  for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = 'rgba(255,196,64,.5)';
  for (let y = 0; y < h; y += 48) { g.fillRect(w / 2 - 3, y, 6, 26); }
  for (const x of [40, w - 72]) for (let y = 0; y < h; y += 36) { g.save(); g.translate(x, y); g.fillStyle = 'rgba(255,190,40,.42)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(16, 0); g.lineTo(32, 18); g.lineTo(16, 18); g.fill(); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* --------------------------------------------------------------- shaders */

const NOISE = /* glsl */`
float hash3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm3(vec3 p){float a=.5,s=0.;for(int i=0;i<OCT;i++){s+=a*noise3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}`;

const STAR_VS = /* glsl */`
uniform vec3 uCam; uniform float uR, uMin, uOp, uStreak, uPx;
attribute float aSize; attribute vec3 aCol; attribute float aEnd;
varying vec3 vCol; varying float vA;
void main(){
  vec3 p = mod(position - uCam + uR, 2. * uR) - uR;
  float dist = length(p);
  #ifdef LINES
  p.z -= aEnd * uStreak;
  #endif
  vec4 mv = viewMatrix * vec4(p + uCam, 1.);
  gl_Position = projectionMatrix * mv;
  vA = uOp * smoothstep(uMin, uMin + 60., dist) * (1. - smoothstep(uR * .72, uR, dist));
  #ifdef LINES
  vA *= 1. - aEnd;
  #else
  gl_PointSize = clamp(aSize * uPx * 320. / -mv.z, .7, 9.);
  #endif
  vCol = aCol;
}`;
const STAR_FS = /* glsl */`
varying vec3 vCol; varying float vA;
void main(){
  #ifdef LINES
  gl_FragColor = vec4(vCol, vA);
  #else
  float d = length(gl_PointCoord - .5);
  gl_FragColor = vec4(vCol, vA * smoothstep(.5, .05, d));
  #endif
}`;

const NEB_VS = /* glsl */`
varying vec3 vDir;
void main(){ vDir = normalize(position); vec4 wp = modelMatrix * vec4(position, 1.); gl_Position = projectionMatrix * viewMatrix * wp; gl_Position.z = gl_Position.w * .99999; }`;
const NEB_FS = /* glsl */`
uniform vec3 uA, uB, uC; uniform float uT, uI;
varying vec3 vDir;
${NOISE}
void main(){
  vec3 d = normalize(vDir);
  float n = fbm3(d * 1.8 + vec3(0., 0., uT * .006));
  float n2 = fbm3(d * 3.4 + n * 1.8 + 4.);
  float cloud = smoothstep(.38, .95, n2);
  float band = exp(-pow(d.y * 2.4 - sin(d.x * 2.2 + d.z) * .45, 2.));
  vec3 col = mix(uA, uB, smoothstep(.32, .78, n)) * cloud * (.18 + band * .95);
  col += uC * pow(cloud, 3.) * band * .55;
  col *= .45 + .55 * smoothstep(.3, .62, fbm3(d * 7. + 9.));
  col += vec3(.004, .004, .012);
  gl_FragColor = vec4(col * uI, 1.);
}`;

const PLANET_VS = /* glsl */`
varying vec2 vUv; varying vec3 vN; varying vec3 vWP;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vWP = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vWP, 1.); }`;
const PLANET_FS = /* glsl */`
uniform sampler2D uMap; uniform vec3 uTint, uAtmo, uSun, uCam; uniform float uT;
varying vec2 vUv; varying vec3 vN; varying vec3 vWP;
${NOISE}
void main(){
  vec2 uv = vec2(vUv.x * 2. + uT * .004, clamp(vUv.y * 1.3 - .15, 0., 1.));
  vec3 img = texture2D(uMap, uv).rgb;
  float lum = dot(img, vec3(.299, .587, .114));
  float band = fbm3(vec3(vUv.y * 16., vUv.x * 4. + uT * .01, 1.7));
  float swirl = fbm3(vec3(vUv * vec2(10., 5.), uT * .02));
  vec3 base = mix(img * 1.25, uTint * (.3 + 1.1 * band), .22 + .16 * swirl);
  vec3 N = normalize(vN), L = normalize(uSun), V = normalize(uCam - vWP);
  float ndl = dot(N, L), dif = max(ndl, 0.), term = smoothstep(-.18, .3, ndl);
  vec3 col = base * (dif * 1.35 + .02);
  col += uTint * pow(1. - term, 2.) * smoothstep(.5, .85, lum) * .9;
  vec3 H = normalize(L + V); col += vec3(1.) * pow(max(dot(N, H), 0.), 60.) * .25 * term;
  float fr = pow(1. - max(dot(N, V), 0.), 2.6);
  col += uAtmo * fr * (term * 1.2 + .1);
  gl_FragColor = vec4(col, 1.);
}`;
const ATMO_VS = /* glsl */`
varying vec3 vN; varying vec3 vWP;
void main(){ vN = normalize(mat3(modelMatrix) * normal); vWP = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vWP, 1.); }`;
const ATMO_FS = /* glsl */`
uniform vec3 uAtmo, uSun, uCam; varying vec3 vN; varying vec3 vWP;
void main(){
  vec3 V = normalize(uCam - vWP), N = normalize(vN);
  float rim = pow(clamp(1. + dot(N, V) * 1.15, 0., 1.), 3.);
  float lit = .2 + .8 * smoothstep(-.4, .6, dot(-N, normalize(uSun)) * -1.);
  gl_FragColor = vec4(uAtmo * 1.6, rim * lit);
}`;
const RING_VS = /* glsl */`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const RING_FS = /* glsl */`
uniform vec3 uTint; uniform float uR0, uR1;
varying vec3 vP;
float h1(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  float t = (length(vP.xy) - uR0) / (uR1 - uR0);
  float b = floor(t * 70.); float band = .35 + .65 * h1(b) ; band *= .6 + .4 * h1(floor(t * 240.));
  float a = band * smoothstep(0., .06, t) * smoothstep(1., .82, t) * (1. - .7 * step(.55, t) * step(t, .6));
  gl_FragColor = vec4(mix(uTint, vec3(1.), .35) * 1.1, a * .7);
}`;

const DISK_VS = RING_VS;
const DISK_FS = /* glsl */`
uniform float uT, uR0, uR1, uI; uniform vec3 uA, uB;
varying vec3 vP;
${NOISE}
void main(){
  float r = length(vP.xy), t = clamp((r - uR0) / (uR1 - uR0), 0., 1.);
  float ang = atan(vP.y, vP.x) + uT * (.9 / (t + .22));
  float sw = fbm3(vec3(cos(ang) * 2.6, sin(ang) * 2.6, t * 7. - uT * .25));
  sw = pow(sw, 1.6) * 2.2;
  vec3 hot = mix(vec3(1., .93, .85) * 3.2, uB * 2.2, smoothstep(0., .3, t));
  hot = mix(hot, uA * 1.5, smoothstep(.3, .85, t));
  float a = smoothstep(0., .03, t) * pow(1. - t, 1.6) * (.3 + sw);
  float dop = 1. + .7 * sin(atan(vP.y, vP.x));
  gl_FragColor = vec4(hot * dop * uI, a);
}`;
const HALO_FS = /* glsl */`
uniform float uR0, uR1, uT, uI; uniform vec3 uA, uB;
varying vec3 vP;
void main(){
  float r = length(vP.xy), t = (r - uR0) / (uR1 - uR0);
  float ring = exp(-pow(t * 9., 2.)) * 3. + exp(-t * 3.2) * .55;
  float ang = atan(vP.y, vP.x);
  float flick = .8 + .2 * sin(ang * 7. + uT * 2.) * sin(ang * 3. - uT * 1.3);
  vec3 c = mix(vec3(1., .95, .9) * 2., mix(uB, uA, clamp(t * 1.6, 0., 1.)), clamp(t * 3., 0., 1.));
  gl_FragColor = vec4(c * uI, clamp(ring * flick, 0., 1.) * smoothstep(1., .55, t));
}`;

const PLUME_VS = /* glsl */`
uniform float uLen; varying float vT; varying vec3 vN; varying vec3 vV;
void main(){ vT = position.z / uLen; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const PLUME_FS = /* glsl */`
uniform float uT, uI; uniform vec3 uA, uB; varying float vT; varying vec3 vN; varying vec3 vV;
void main(){
  float core = pow(abs(dot(normalize(vN), normalize(vV))), 1.4);
  float fl = .78 + .22 * sin(uT * 70. + vT * 24.) * sin(uT * 37. - vT * 9.);
  float a = pow(clamp(1. - vT, 0., 1.), 1.7) * core * fl * uI;
  vec3 c = mix(vec3(1.), uB, smoothstep(0., .35, vT)); c = mix(c, uA, smoothstep(.35, .9, vT));
  gl_FragColor = vec4(c * 1.7, a);
}`;
const TRAIL_VS = /* glsl */`
uniform float uPx; attribute float aLife; varying float vL;
void main(){ vL = aLife; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = aLife >= 1. ? 0. : clamp((1. - aLife) * uPx * 90. / -mv.z, 0., 40.); }`;
const TRAIL_FS = /* glsl */`
uniform vec3 uA, uB; varying float vL;
void main(){ if (vL >= 1.) discard; float d = length(gl_PointCoord - .5); vec3 c = mix(uB * 2., uA, vL); gl_FragColor = vec4(c, smoothstep(.5, 0., d) * pow(1. - vL, 2.) * .8); }`;
const TUNNEL_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const TUNNEL_FS = /* glsl */`
uniform float uT, uW; uniform vec3 uA, uB; varying vec2 vUv;
float h1(float n){ return fract(sin(n * 91.17) * 43758.5453); }
void main(){
  float cols = 110.; float id = floor(vUv.x * cols); float r = h1(id);
  float y = fract(vUv.y * (1.2 + r) + uT * (1.4 + r * 2.6) + r * 7.);
  float s = smoothstep(0., .015, y) * (1. - smoothstep(.02, .3 + r * .5, y));
  float lane = pow(1. - abs(fract(vUv.x * cols) - .5) * 2., 3.);
  vec3 c = mix(uA, uB, h1(id + 3.)); c = mix(c, vec3(1.), step(.82, r) * .7);
  float a = s * lane * uW * (.35 + .65 * r) * smoothstep(0., .25, vUv.y) * smoothstep(1., .55, vUv.y);
  gl_FragColor = vec4(c * 2.2, a);
}`;
const POST_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const POST_FS = /* glsl */`
uniform sampler2D tDiffuse; uniform float uCA, uWarp, uFlash, uT, uGrain; uniform vec3 uFlashC;
varying vec2 vUv;
float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 c = vUv - .5; float r2 = dot(c, c);
  vec2 uv = .5 + c * (1. - uWarp * .16 * r2 * 4.);
  vec2 off = c * (uCA + r2 * uCA * 2.);
  vec3 col;
  col.r = texture2D(tDiffuse, uv + off).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - off).b;
  col += uFlashC * uFlash;
  col *= 1. - smoothstep(.18, .85, r2 * 1.6) * .55;
  col += (h2(vUv * 913. + fract(uT) * 37.) - .5) * uGrain;
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/* ---------------------------------------------------------------- mount */

export function mount(root, { isPaused = () => false } = {}) {
  let disposed = false;
  const ac = new AbortController(), signal = ac.signal;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let teardown = () => {};
  const goStatic = () => { root.innerHTML = staticMarkup(); };
  const quit = () => { disposed = true; ac.abort(); root.innerHTML = ''; };

  if (reduce) { goStatic(); return quit; }

  root.innerHTML = liveMarkup();
  const el = root.querySelector('.fl');
  const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
  const canvas = $('.fl-canvas');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch {
    renderer = null; goStatic(); return quit;
  }

  init().catch(err => {
    console.warn('[flight] falling back to mission briefing', err);
    if (!disposed) { teardown(); goStatic(); }
  });

  async function init() {
    const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    const loadImg = src => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const libsP = Promise.all([import(LIBS.gsap), import(LIBS.st), import(LIBS.lenis)]).catch(() => null);
    const fontP = Promise.race([document.fonts?.load?.('800 80px "Archivo"') ?? Promise.resolve(), new Promise(r => setTimeout(r, 1500))]).catch(() => {});
    const [images, libs] = await Promise.all([Promise.all(projects.map(p => loadImg(ART[p.id] || 'art/orbit.jpg'))), libsP, fontP]);
    if (disposed) return;

    /* ---------------- renderer / post */
    const DPR = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
    renderer.setPixelRatio(DPR);
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    const rt = new THREE.WebGLRenderTarget(Math.floor(innerWidth * DPR), Math.floor(innerHeight * DPR), { type: THREE.HalfFloatType, samples: coarse ? 2 : 4 });
    const postMat = new THREE.ShaderMaterial({
      vertexShader: POST_VS, fragmentShader: POST_FS, depthTest: false, depthWrite: false,
      uniforms: { tDiffuse: { value: rt.texture }, uCA: { value: .0015 }, uWarp: { value: 0 }, uFlash: { value: 0 }, uFlashC: { value: new THREE.Color('#dfe8ff') }, uT: { value: 0 }, uGrain: { value: .035 } }
    });
    const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat); postQuad.frustumCulled = false; postScene.add(postQuad);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#010104');
    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, .1, 5200);
    scene.add(camera);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmrem.fromScene(roomEnv, .04).texture;
    scene.environment = envTex; scene.environmentIntensity = .45;

    const owned = { textures: [envTex], disposables: [pmrem, rt] };
    const own = t => { owned.textures.push(t); return t; };
    const glowMap = own(glowTexture());
    const cA = new THREE.Color(PA), cB = new THREE.Color(PB);
    const hdr = (c, k) => new THREE.Color(c).multiplyScalar(k);
    const OCT = coarse ? 3 : 5;

    /* ---------------- lights */
    const hemi = new THREE.HemisphereLight('#9aa8ff', '#0a0612', .35); scene.add(hemi);
    const sun = new THREE.DirectionalLight('#fff1e6', 2.4); sun.position.set(-1, .7, .5); scene.add(sun); scene.add(sun.target);
    const rim = new THREE.DirectionalLight(PB, 1.4); scene.add(rim); scene.add(rim.target);
    const bayA = new THREE.PointLight('#cfe0ff', 0, 0, 2), bayB = new THREE.PointLight('#cfe0ff', 0, 0, 2);
    bayA.position.set(0, 9, 4); bayB.position.set(0, 9, -40); scene.add(bayA, bayB);
    const engLight = new THREE.PointLight(PB, 0, 0, 2); scene.add(engLight);

    /* ---------------- nebula + stars */
    const nebMat = new THREE.ShaderMaterial({
      vertexShader: NEB_VS, fragmentShader: NEB_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, defines: { OCT },
      uniforms: { uA: { value: cA.clone() }, uB: { value: cB.clone() }, uC: { value: new THREE.Color('#ff7ac8') }, uT: { value: 0 }, uI: { value: 1 } }
    });
    const nebula = new THREE.Mesh(new THREE.SphereGeometry(2400, 48, 32), nebMat); nebula.renderOrder = -10; nebula.frustumCulled = false; scene.add(nebula);

    const R = 900;
    const starCols = [new THREE.Color('#ffffff'), new THREE.Color('#cfd9ff'), new THREE.Color('#ffe6c8'), cB, new THREE.Color('#b9a6ff')];
    const mkStars = (n, lines) => {
      const k = lines ? 2 : 1, pos = new Float32Array(n * 3 * k), col = new Float32Array(n * 3 * k), size = new Float32Array(n * k), end = new Float32Array(n * k);
      for (let i = 0; i < n; i++) {
        const x = rand(-R, R), y = rand(-R, R), z = rand(-R, R), c = starCols[Math.random() < .7 ? 0 : 1 + Math.floor(Math.random() * 4)], b = rand(.6, 2.6), s = Math.random() < .04 ? rand(2.4, 3.6) : rand(.8, 1.8);
        for (let j = 0; j < k; j++) { const v = i * k + j; pos.set([x, y, z], v * 3); col.set([c.r * b, c.g * b, c.b * b], v * 3); size[v] = s; end[v] = j; }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
      g.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
      const m = new THREE.ShaderMaterial({
        vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, defines: lines ? { LINES: 1 } : {},
        uniforms: { uCam: { value: new THREE.Vector3() }, uR: { value: R }, uMin: { value: 0 }, uOp: { value: 1 }, uStreak: { value: 0 }, uPx: { value: DPR } }
      });
      const o = lines ? new THREE.LineSegments(g, m) : new THREE.Points(g, m); o.frustumCulled = false; scene.add(o); return o;
    };
    const stars = mkStars(coarse ? 3500 : 7000, false);
    const streaks = mkStars(coarse ? 1100 : 2200, true);

    /* ---------------- hangar */
    const hangar = new THREE.Group(); scene.add(hangar);
    const HW = 15, HFLOOR = -1.9, HTOP = 12, HBACK = 40, HDOOR = -90;
    const floorMap = own(floorTexture()); floorMap.repeat.set(1, 3);
    const darkMetal = new THREE.MeshStandardMaterial({ color: '#191c25', metalness: .75, roughness: .5 });
    const wallMat = new THREE.MeshStandardMaterial({ color: '#232733', metalness: .5, roughness: .6 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, HBACK - HDOOR), new THREE.MeshStandardMaterial({ map: floorMap, metalness: .55, roughness: .38 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, HFLOOR, (HBACK + HDOOR) / 2); hangar.add(floor);
    const wallGeo = new THREE.BoxGeometry(1, HTOP - HFLOOR, HBACK - HDOOR);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(wallGeo, wallMat); w.position.set(sx * (HW + .5), (HTOP + HFLOOR) / 2, (HBACK + HDOOR) / 2); hangar.add(w); }
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(HW * 2 + 2, 1, HBACK - HDOOR), wallMat); ceil.position.set(0, HTOP + .5, (HBACK + HDOOR) / 2); hangar.add(ceil);
    const back = new THREE.Mesh(new THREE.BoxGeometry(HW * 2 + 2, HTOP - HFLOOR, 1), wallMat); back.position.set(0, (HTOP + HFLOOR) / 2, HBACK); hangar.add(back);
    // ribs (instanced) — the arches every 10 units
    const ribZ = []; for (let z = HBACK - 6; z > HDOOR + 4; z -= 10) ribZ.push(z);
    const ribGeo = new THREE.BoxGeometry(1, 1, 1);
    const ribs = new THREE.InstancedMesh(ribGeo, darkMetal, ribZ.length * 3);
    const strips = new THREE.InstancedMesh(ribGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), ribZ.length * 3 + 24);
    const dm = new THREE.Object3D(); let ri = 0, si = 0;
    const stripInfo = [];
    ribZ.forEach((z, k) => {
      for (const sx of [-1, 1]) { dm.position.set(sx * (HW - .6), (HTOP + HFLOOR) / 2, z); dm.scale.set(1.4, HTOP - HFLOOR, 1.6); dm.rotation.set(0, 0, 0); dm.updateMatrix(); ribs.setMatrixAt(ri++, dm.matrix); }
      dm.position.set(0, HTOP - .4, z); dm.scale.set(HW * 2, 1.2, 1.6); dm.updateMatrix(); ribs.setMatrixAt(ri++, dm.matrix);
      dm.position.set(0, HTOP - 1.05, z); dm.scale.set(HW * 1.6, .12, .3); dm.updateMatrix(); strips.setMatrixAt(si, dm.matrix); stripInfo.push({ order: k * .7, kind: 0 }); si++;
      for (const sx of [-1, 1]) { dm.position.set(sx * (HW - 1.35), 5, z); dm.scale.set(.12, 8, .3); dm.updateMatrix(); strips.setMatrixAt(si, dm.matrix); stripInfo.push({ order: k * .7 + .3, kind: 1 }); si++; }
    });
    for (let k = 0; k < 12; k++) for (const sx of [-1, 1]) { // runway lights
      dm.position.set(sx * 4.2, HFLOOR + .03, 8 - k * 8.4); dm.scale.set(.5, .06, 1.6); dm.updateMatrix(); strips.setMatrixAt(si, dm.matrix); stripInfo.push({ order: 99, kind: 2, k }); si++;
    }
    strips.count = si; ribs.count = ri;
    strips.instanceMatrix.needsUpdate = true; ribs.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < si; i++) strips.setColorAt(i, new THREE.Color(0, 0, 0));
    hangar.add(ribs, strips);
    // launch pad
    const pad3 = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.8, .3, 64), darkMetal); pad3.position.set(0, HFLOOR + .1, 0); hangar.add(pad3);
    const padRingMat = new THREE.MeshBasicMaterial({ color: hdr(PB, 0), toneMapped: false });
    const padRing = new THREE.Mesh(new THREE.TorusGeometry(5.1, .07, 8, 96), padRingMat); padRing.rotation.x = Math.PI / 2; padRing.position.set(0, HFLOOR + .28, 0); hangar.add(padRing);
    // clamps / gantry
    const clampGeo = new THREE.BoxGeometry(.6, 3.2, .6);
    const clamps = [-1, 1].map(sx => { const c = new THREE.Mesh(clampGeo, darkMetal); c.position.set(sx * 3.4, HFLOOR + 1.6, 1.2); hangar.add(c); return c; });
    // doors
    const doorMat = new THREE.MeshStandardMaterial({ color: '#2a2f3c', metalness: .7, roughness: .45 });
    const doorGeo = new THREE.BoxGeometry(HW, HTOP - HFLOOR, 1.2);
    const doors = [-1, 1].map(sx => { const d = new THREE.Mesh(doorGeo, doorMat); d.position.set(sx * HW / 2, (HTOP + HFLOOR) / 2, HDOOR); hangar.add(d); return d; });
    const doorSeamMat = new THREE.MeshBasicMaterial({ color: hdr('#ff6a3d', 0), toneMapped: false });
    const seams = [-1, 1].map(sx => { const s = new THREE.Mesh(new THREE.BoxGeometry(.18, HTOP - HFLOOR - 1, .2), doorSeamMat); s.position.set(sx * .12, 0, .62); doors[sx < 0 ? 0 : 1].add(s); return s; });
    seams.forEach((s, i) => { s.position.x = i === 0 ? HW / 2 - .15 : -HW / 2 + .15; });

    /* ---------------- ship */
    const ship = new THREE.Group(); scene.add(ship);
    const body = new THREE.Group(); ship.add(body);
    const hullMap = own(hullTexture()); hullMap.repeat.set(2, 1);
    const M = {
      hull: new THREE.MeshPhysicalMaterial({ color: '#e7eaf1', map: hullMap, metalness: .55, roughness: .3, clearcoat: .7, clearcoatRoughness: .2 }),
      dark: new THREE.MeshPhysicalMaterial({ color: '#1b1e28', metalness: .8, roughness: .38, clearcoat: .4 }),
      canopy: new THREE.MeshPhysicalMaterial({ color: '#0b1430', metalness: .3, roughness: .04, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 2.6, emissive: new THREE.Color(PB), emissiveIntensity: .08, transparent: true, opacity: .92 }),
      accent: new THREE.MeshBasicMaterial({ color: hdr(PA, 2.2), toneMapped: false }),
      accentB: new THREE.MeshBasicMaterial({ color: hdr(PB, 2.4), toneMapped: false }),
      nozzle: new THREE.MeshBasicMaterial({ color: hdr(PB, 0), toneMapped: false })
    };
    // fuselage
    const prof = [[0, -.15], [.5, 0], [.78, .5], [.9, 1.8], [.86, 3.2], [.66, 4.6], [.4, 5.8], [.14, 6.8], [0, 7.05]].map(([x, y]) => new THREE.Vector2(x, y));
    const fusGeo = new THREE.LatheGeometry(prof, 28); fusGeo.rotateX(-Math.PI / 2); fusGeo.scale(1, .6, 1); fusGeo.translate(0, 0, 3.4);
    body.add(new THREE.Mesh(fusGeo, M.hull));
    // spine
    const spine = new THREE.Mesh(new THREE.BoxGeometry(.34, .3, 4.2), M.dark); spine.position.set(0, .48, 1.2); body.add(spine);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(.06, .04, 4.6), M.accent); stripe.position.set(0, .64, .9); body.add(stripe);
    // canopy
    const canGeo = new THREE.SphereGeometry(.5, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2); canGeo.scale(1, .75, 2.5);
    const canopy = new THREE.Mesh(canGeo, M.canopy); canopy.position.set(0, .28, -1.3); body.add(canopy);
    // wings
    const wShape = new THREE.Shape(); wShape.moveTo(.5, 1.6); wShape.lineTo(4.4, -1.3); wShape.lineTo(4.75, -2.3); wShape.lineTo(3.9, -2.45); wShape.lineTo(.5, -2.9); wShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wShape, { depth: .1, bevelEnabled: true, bevelThickness: .04, bevelSize: .05, bevelSegments: 2 });
    wingGeo.rotateX(-Math.PI / 2); wingGeo.translate(0, -.12, .4);
    const edgeGeo = new THREE.BoxGeometry(.05, .05, 1); // glowing wing edge
    const navLights = [];
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(wingGeo, M.hull); w.scale.x = sx; w.rotation.z = sx * -.06; body.add(w);
      const e = new THREE.Mesh(edgeGeo, M.accentB); e.scale.z = 4.8; e.position.set(sx * 2.45, -.02, .25); e.rotation.y = sx * .93; body.add(e);
      // wingtip pod
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(.11, .14, 2.2, 10), M.dark); pod.rotation.x = Math.PI / 2; pod.position.set(sx * 4.62, -.07, 2.25); body.add(pod);
      const nl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: sx < 0 ? '#ff3b4a' : '#38ff8a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
      nl.position.set(sx * 4.62, -.07, 1.05); nl.scale.setScalar(.9); body.add(nl); navLights.push(nl);
      // tail fins
      const fShape = new THREE.Shape(); fShape.moveTo(0, 0); fShape.lineTo(1.9, 0); fShape.lineTo(2.3, 1.5); fShape.lineTo(1.7, 1.55); fShape.closePath();
      const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(fShape, { depth: .07, bevelEnabled: false }), M.dark);
      const finG = new THREE.Group(); finG.position.set(sx * .5, .22, 0); finG.rotation.z = sx * -.38; body.add(finG);
      fin.rotation.y = -Math.PI / 2; fin.position.z = .95; finG.add(fin);
      // engines
      const nac = new THREE.Mesh(new THREE.CylinderGeometry(.36, .42, 2.8, 20), M.dark); nac.rotation.x = Math.PI / 2; nac.position.set(sx * .78, -.08, 2.2); body.add(nac);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.4, .06, 10, 32), M.hull); ring.position.set(sx * .78, -.08, 3.6); body.add(ring);
      const core = new THREE.Mesh(new THREE.CircleGeometry(.34, 24), M.nozzle); core.position.set(sx * .78, -.08, 3.62); body.add(core);
      const under = new THREE.Mesh(new THREE.BoxGeometry(.04, .03, 2.2), M.accent); under.position.set(sx * 1.6, -.2, -.3); body.add(under);
    }
    const tailLight = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: '#ffffff', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
    tailLight.position.set(0, .7, 3.4); tailLight.scale.setScalar(.6); body.add(tailLight); navLights.push(tailLight);
    // exhaust plumes
    const PLEN = 1;
    const plumeGeo = new THREE.ConeGeometry(.36, PLEN, 24, 6, true); plumeGeo.rotateX(Math.PI / 2); plumeGeo.translate(0, 0, PLEN / 2);
    // after rotateX(+90) the cone tip (+y) points to +z (backwards): base at z=0
    const plumeMat = new THREE.ShaderMaterial({ vertexShader: PLUME_VS, fragmentShader: PLUME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uT: { value: 0 }, uI: { value: 0 }, uLen: { value: PLEN }, uA: { value: cA }, uB: { value: cB } } });
    const plumes = [], glows = [];
    for (const sx of [-1, 1]) {
      const pl = new THREE.Mesh(plumeGeo, plumeMat); pl.position.set(sx * .78, -.08, 3.62); pl.frustumCulled = false; body.add(pl); plumes.push(pl);
      const inner = new THREE.Mesh(plumeGeo, plumeMat); inner.position.copy(pl.position); inner.scale.set(.45, .45, 1); inner.frustumCulled = false; body.add(inner); plumes.push(inner);
      const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: PB, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
      g.position.set(sx * .78, -.08, 3.9); body.add(g); glows.push(g);
    }
    engLight.position.set(0, 0, 0); ship.add(engLight); engLight.position.set(0, .2, 5);
    // trail particles (world space)
    const TN = coarse ? 360 : 700;
    const tPos = new Float32Array(TN * 3), tLife = new Float32Array(TN).fill(1), tVel = new Float32Array(TN * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3)); trailGeo.setAttribute('aLife', new THREE.BufferAttribute(tLife, 1));
    const trailMat = new THREE.ShaderMaterial({ vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPx: { value: DPR }, uA: { value: cA }, uB: { value: cB } } });
    const trail = new THREE.Points(trailGeo, trailMat); trail.frustumCulled = false; scene.add(trail);
    let tHead = 0;

    /* ---------------- asteroid belt + gates */
    const rockGeo = new THREE.IcosahedronGeometry(1, coarse ? 1 : 2);
    { const p = rockGeo.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); const k = 1 + .28 * Math.sin(n.x * 4.1 + n.y * 2.3) * Math.cos(n.z * 3.7 - n.x) + .12 * Math.sin(n.y * 9.3 + n.z * 7.1); v.copy(n).multiplyScalar(k); p.setXYZ(i, v.x, v.y, v.z); }
      rockGeo.computeVertexNormals(); }
    const rockMat = new THREE.MeshStandardMaterial({ color: '#8a8494', roughness: .92, metalness: .08, flatShading: true });
    const RN = coarse ? 260 : 520;
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, RN);
    const rockData = [];
    for (let i = 0; i < RN; i++) {
      const d = rand(BELT[0], BELT[1]), big = Math.random() < .07;
      const a = Math.random() * Math.PI * 2, r = big ? rand(70, 210) : 10 + Math.pow(Math.random(), 1.5) * 150;
      const s = big ? rand(12, 30) : rand(.5, 3.2) * (r > 60 ? 2.2 : 1);
      rockData.push({ pos: new THREE.Vector3(pathX(d) + Math.cos(a) * r, pathY(d) + Math.sin(a) * r * .7, -d), s, sc: new THREE.Vector3(rand(.7, 1.3), rand(.6, 1.1), rand(.7, 1.4)), rot: new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6)), spin: new THREE.Vector3(rand(-.5, .5), rand(-.5, .5), rand(-.3, .3)) });
      const c = new THREE.Color('#a39cab').multiplyScalar(rand(.45, 1.05)); if (Math.random() < .12) c.lerp(new THREE.Color('#c68a5a'), .5);
      rocks.setColorAt(i, c);
      const rd = rockData[i]; dm.position.copy(rd.pos); dm.rotation.copy(rd.rot); dm.scale.copy(rd.sc).multiplyScalar(rd.s); dm.updateMatrix(); rocks.setMatrixAt(i, dm.matrix);
    }
    scene.add(rocks);
    const gates = GATES.map((gd, i) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.TorusGeometry(13, .7, 14, 96), M.dark));
      const glow = new THREE.Mesh(new THREE.TorusGeometry(12.2, .14, 8, 128), new THREE.MeshBasicMaterial({ color: hdr(i % 2 ? PB : PA, 2.4), toneMapped: false })); g.add(glow);
      const pods = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 2.4, 1.6), M.hull, 8);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; dm.position.set(Math.cos(a) * 13.3, Math.sin(a) * 13.3, 0); dm.rotation.set(0, 0, a); dm.scale.set(1, 1, 1); dm.updateMatrix(); pods.setMatrixAt(k, dm.matrix); }
      g.add(pods);
      const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .5, .5), new THREE.MeshBasicMaterial({ color: hdr('#ffffff', 3), toneMapped: false }), 8);
      for (let k = 0; k < 8; k++) { const a = (k + .5) / 8 * Math.PI * 2; dm.position.set(Math.cos(a) * 13.3, Math.sin(a) * 13.3, .8); dm.rotation.set(0, 0, 0); dm.updateMatrix(); lights.setMatrixAt(k, dm.matrix); }
      g.add(lights);
      g.position.set(pathX(gd), pathY(gd), -gd);
      g.lookAt(pathX(gd + 10), pathY(gd + 10), -gd - 10);
      scene.add(g);
      return { g, glow, d: gd, flash: 0 };
    });

    /* ---------------- planets */
    const planetGeo = new THREE.SphereGeometry(1, coarse ? 64 : 96, coarse ? 48 : 64);
    const sunDir = new THREE.Vector3(-1, .55, .7).normalize();
    const planets = PLANETS.map((pl, i) => {
      const img = images[i];
      const t = img ? new THREE.Texture(img) : new THREE.DataTexture(new Uint8Array([90, 80, 140, 255]), 1, 1);
      t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.MirroredRepeatWrapping; t.needsUpdate = true; own(t);
      const Rp = 110;
      const g = new THREE.Group(); g.position.set(pl.side * 250, -30, -(PLANET_D[i] + 200)); scene.add(g);
      const mat = new THREE.ShaderMaterial({ vertexShader: PLANET_VS, fragmentShader: PLANET_FS, defines: { OCT: 4 },
        uniforms: { uMap: { value: t }, uTint: { value: new THREE.Color(pl.tint) }, uAtmo: { value: new THREE.Color(pl.atmo) }, uSun: { value: sunDir }, uCam: { value: new THREE.Vector3() }, uT: { value: 0 } } });
      const sphere = new THREE.Mesh(planetGeo, mat); sphere.scale.setScalar(Rp); sphere.rotation.z = .25 * pl.side; g.add(sphere);
      const atmo = new THREE.Mesh(planetGeo, new THREE.ShaderMaterial({ vertexShader: ATMO_VS, fragmentShader: ATMO_FS, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uAtmo: { value: new THREE.Color(pl.atmo) }, uSun: { value: sunDir }, uCam: { value: new THREE.Vector3() } } }));
      atmo.scale.setScalar(Rp * 1.14); g.add(atmo);
      let ring = null;
      if (pl.ring) {
        ring = new THREE.Mesh(new THREE.RingGeometry(Rp * 1.35, Rp * 2.25, 160, 1), new THREE.ShaderMaterial({ vertexShader: RING_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
          uniforms: { uTint: { value: new THREE.Color(pl.tint) }, uR0: { value: Rp * 1.35 }, uR1: { value: Rp * 2.25 } } }));
        ring.rotation.set(-Math.PI / 2 + .32, 0, .3 * pl.side); g.add(ring);
      }
      // orbital station ring around the planet
      const halo = new THREE.Mesh(new THREE.TorusGeometry(Rp * 1.08, .5, 6, 180), new THREE.MeshBasicMaterial({ color: hdr(pl.atmo, 1.6), toneMapped: false, transparent: true, opacity: .7 }));
      halo.rotation.set(Math.PI / 2 - .18, .2, 0); g.add(halo);
      return { g, sphere, atmo, ring, halo, mat, d: PLANET_D[i], pl };
    });

    /* ---------------- black hole */
    const bh = new THREE.Group(); bh.position.set(0, 70, -BH_D); scene.add(bh);
    const RH = 62;
    bh.add(new THREE.Mesh(new THREE.SphereGeometry(RH, 48, 32), new THREE.MeshBasicMaterial({ color: '#000000' })));
    const diskU = { uT: { value: 0 }, uR0: { value: RH * 1.25 }, uR1: { value: RH * 4.2 }, uI: { value: 1 }, uA: { value: cA }, uB: { value: cB } };
    const disk = new THREE.Mesh(new THREE.RingGeometry(RH * 1.25, RH * 4.2, 200, 4), new THREE.ShaderMaterial({ vertexShader: DISK_VS, fragmentShader: DISK_FS, defines: { OCT: 4 }, uniforms: diskU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    disk.rotation.set(-Math.PI / 2 + .3, 0, .12); bh.add(disk);
    const haloU = { uT: diskU.uT, uR0: { value: RH * 1.02 }, uR1: { value: RH * 2.1 }, uI: { value: 1 }, uA: { value: cA }, uB: { value: cB } };
    const photon = new THREE.Mesh(new THREE.RingGeometry(RH * 1.02, RH * 2.1, 160, 2), new THREE.ShaderMaterial({ vertexShader: RING_VS, fragmentShader: HALO_FS, uniforms: haloU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    bh.add(photon);
    const bhGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: hdr(PA, 1.4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
    bhGlow.scale.setScalar(RH * 11); bhGlow.renderOrder = -1; bh.add(bhGlow);

    /* ---------------- hyperspace tunnel (camera child) */
    const tunnelMat = new THREE.ShaderMaterial({ vertexShader: TUNNEL_VS, fragmentShader: TUNNEL_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uW: { value: 0 }, uA: { value: cA }, uB: { value: cB } } });
    const tunnelGeo = new THREE.CylinderGeometry(26, 9, 900, 64, 1, true); tunnelGeo.rotateX(Math.PI / 2);
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat); tunnel.position.set(0, 0, -440); tunnel.frustumCulled = false; tunnel.renderOrder = 5; camera.add(tunnel);

    /* ---------------- input */
    const steer = { px: 0, py: 0, kx: 0, ky: 0, x: 0, y: 0 };
    const keys = new Set();
    let boostHeld = false, cockpit = false;
    addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; steer.px = e.clientX / innerWidth * 2 - 1; steer.py = e.clientY / innerHeight * 2 - 1; }, { signal, passive: true });
    document.addEventListener('pointerleave', () => { steer.px = 0; steer.py = 0; }, { signal });
    addEventListener('touchmove', e => { const t = e.touches[0]; if (t) steer.px = (t.clientX / innerWidth * 2 - 1) * .9; }, { signal, passive: true });
    addEventListener('touchend', () => { steer.px = 0; }, { signal, passive: true });
    const isField = t => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const steerKeys = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1 };
    addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey || isField(e.target) || document.querySelector('dialog[open]')) return;
      if (steerKeys[e.code]) { keys.add(e.code); e.preventDefault(); }
      else if (e.code === 'Space') { if (e.target?.closest?.('a,button')) return; boostHeld = true; e.preventDefault(); }
      else if (e.code === 'KeyC' || e.code === 'KeyV') { if (!e.repeat) setView(!cockpit); }
    }, { signal });
    addEventListener('keyup', e => { keys.delete(e.code); if (e.code === 'Space') boostHeld = false; }, { signal });
    addEventListener('blur', () => { keys.clear(); boostHeld = false; }, { signal });
    const viewBtn = $('[data-view]');
    function setView(on) { cockpit = on; viewBtn.setAttribute('aria-pressed', String(on)); viewBtn.querySelector('b').textContent = on ? 'COCKPIT' : 'CHASE'; }
    viewBtn.addEventListener('click', () => setView(!cockpit), { signal });

    /* ---------------- scroll */
    const track = $('.fl-track');
    let target = 0, prog = 0, lenis = null, ctx = null, gsap = null, tickerFn = null, lenisFn = null, rafId = 0;
    const readNative = () => { const r = track.getBoundingClientRect(); target = clamp(-r.top / Math.max(1, r.height - innerHeight)); };
    const trackY = p => { const r = track.getBoundingClientRect(); return scrollY + r.top + p * (r.height - innerHeight); };
    const scrollToP = p => { const y = trackY(p); if (lenis) lenis.scrollTo(y, { duration: 2.6 }); else scrollTo({ top: y, behavior: 'smooth' }); };
    if (libs) {
      const [{ gsap: G }, { ScrollTrigger }, { default: Lenis }] = libs;
      gsap = G; gsap.registerPlugin(ScrollTrigger);
      lenis = new Lenis({ lerp: .09 });
      lenis.on('scroll', ScrollTrigger.update);
      lenisFn = t => lenis.raf(t * 1000);
      gsap.ticker.add(lenisFn); gsap.ticker.lagSmoothing(0);
      ctx = gsap.context(() => { ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: s => { target = s.progress; } }); }, el);
      ScrollTrigger.refresh();
    }
    addEventListener('scroll', readNative, { signal, passive: true });
    readNative(); prog = target;
    $$('[data-go]').forEach(b => b.addEventListener('click', () => scrollToP(STAGES[+b.dataset.go].go), { signal }));
    $('[data-top]').addEventListener('click', () => scrollToP(0), { signal });

    /* ---------------- resize */
    const onResize = () => {
      renderer.setSize(innerWidth, innerHeight, false);
      rt.setSize(Math.floor(innerWidth * DPR), Math.floor(innerHeight * DPR));
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      radarSize();
    };
    addEventListener('resize', onResize, { signal });

    /* ---------------- UI */
    const ui = {
      title: $('.fl-title'), count: $('.fl-count'), countB: $('.fl-count b'), countS: $('.fl-count small'),
      banner: $('.fl-banner'), bK: $('.fl-banner-k'), bT: $('.fl-banner-t'), bKo: $('.fl-banner-ko'),
      log: $('.fl-log ol'), lock: $('.fl-lock'), lockB: $('.fl-lock-l b'), lockE: $('.fl-lock-l em'), reticle: $('.fl-reticle'),
      speed: $('.fl-speed b'), unit: $('.fl-speed span'), throttle: $('.fl-throttle u'), boost: $('.fl-boost'), tape: $('.fl-tape-s'), hdg: $('.fl-hdg'),
      alt: $('[data-r=alt]'), dist: $('[data-r=dist]'), g: $('[data-r=g]'), stage: $('[data-r=stage]'),
      warp: $('.fl-warp'), warpS: $('.fl-warp small'), panels: $$('.fl-panel'), fin: $('.fl-fin'), nav: $$('.fl-nav li'),
      flash: $('.fl-flash'), radar: $('.fl-radar canvas'), cockpit: $('.fl-cockpit')
    };
    $('.fl-loading').remove();
    el.classList.add('is-live');
    const rctx = ui.radar.getContext('2d');
    let RS = 120;
    function radarSize() { RS = ui.radar.clientWidth || 120; ui.radar.width = ui.radar.height = Math.round(RS * Math.min(2, DPR)); }
    radarSize();

    // mission log (typed)
    const logLines = [];
    const pushLog = txt => { logLines.push({ txt, n: 0, li: null }); while (logLines.length > 5) { const o = logLines.shift(); o.li?.remove(); } };
    function tickLog(dt, paused) {
      for (const L of logLines) {
        if (!L.li) { L.li = document.createElement('li'); ui.log.append(L.li); }
        if (L.n < L.txt.length) {
          L.n = paused ? L.txt.length : Math.min(L.txt.length, L.n + dt * 64);
          L.li.textContent = L.txt.slice(0, Math.ceil(L.n)) + (L.n < L.txt.length ? '▌' : '');
          break; // type one line at a time
        }
      }
    }

    const state = { stage: -1, panel: [false, false, false], fin: false, warpIdx: -1, d: 0, booted: false, countN: '', lockName: '' };
    let time = 0, last = performance.now(), bootT = -1, boost = 0, vel = 0, cockpitT = 0, lastD = 0, launchKick = 0, frameN = 0;
    const sv = { x: 0, y: 0, vx: 0, vy: 0 };            // ship lateral offset
    const camOff = new THREE.Vector3(0, 2.8, 13), camLook = new THREE.Vector3();
    const camSteer = { x: 0, y: 0 };
    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), fwd = new THREE.Vector3(), proj = new THREE.Vector3();
    const nozzleL = new THREE.Vector3(), nozzleR = new THREE.Vector3();
    const neb = { a: cA.clone(), b: cB.clone() };
    const bootLines = ['SYS// 반응로 점화 준비 · CORE 98.4%', 'NAV// 항로 3 WAYPOINTS 로드 완료', 'FCS// 스틱 입력 확인 — 포인터 / WASD', 'BAY// 발진 허가 대기 · 스크롤로 스로틀'];

    function setStage(i, p) {
      state.stage = i;
      const s = STAGES[i];
      const pl = s.planet != null ? PLANETS[s.planet] : null;
      const k = pl ? `WAYPOINT ${pad(s.planet + 1)} · ${pl.code}` : s.kick;
      const t = pl ? pl.world : s.label;
      const ko = pl ? `${projects[s.planet].name} — ${pl.ko}` : s.ko;
      ui.bK.textContent = k; ui.bKo.textContent = ko;
      ui.bT.innerHTML = [...t].map((ch, j) => `<span style="--j:${j}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
      ui.banner.classList.remove('is-on'); void ui.banner.offsetWidth; ui.banner.classList.add('is-on');
      ui.banner.style.setProperty('--c', pl ? pl.atmo : PB);
      ui.banner.dataset.align = pl ? (pl.side > 0 ? 'right' : 'left') : 'center';
      ui.stage.textContent = pl ? pl.code : s.label;
      ui.nav.forEach((li, j) => { li.classList.toggle('is-active', j === i); li.classList.toggle('is-past', j < i); });
      if (state.booted && p > .02) {
        if (s.id === 'launch') pushLog('FCS// 발진! 애프터버너 최대 출력');
        else if (s.id === 'belt') pushLog('NAV// 소행성대 진입 — 회피 기동 개시');
        else if (pl) pushLog(`ORB// ${pl.code} 궤도 진입 · ${projects[s.planet].name}`);
        else if (s.id === 'end') pushLog('GRV// 중력 특이점 접근 — 사건의 지평선까지 600km');
      }
    }

    function updateUI(p, dt, paused, info) {
      const { warp, speedKms, thrust, target: tgt, tgtName, tgtDist, gLoad, heading, alt } = info;
      // boot
      if (!state.booted && bootT >= 0) { state.booted = true; el.classList.add('is-boot'); bootLines.forEach(pushLog); }
      // title & countdown
      const x = smooth(.03, .075, p);
      el.style.setProperty('--x', x.toFixed(4));
      ui.title.style.visibility = x > .995 ? 'hidden' : '';
      let cn = '', cs = 'T-MINUS';
      if (p > .04 && p < .095) cn = String(3 - Math.min(2, Math.floor((p - .04) / (.055 / 3))));
      else if (p >= .095 && p < .125) { cn = 'LAUNCH'; cs = 'ALL SYSTEMS GO'; }
      if (cn !== state.countN) {
        state.countN = cn; ui.countB.textContent = cn; ui.countS.textContent = cs;
        ui.count.classList.toggle('is-word', cn === 'LAUNCH');
        ui.count.classList.remove('is-tick'); void ui.count.offsetWidth; if (cn) ui.count.classList.add('is-tick');
        if (cn && cn !== 'LAUNCH' && state.booted) pushLog(`T-${cn} · 점화 시퀀스`);
      }
      ui.count.style.opacity = cn ? '1' : '0';
      // stage
      let si = 0; STAGES.forEach((s, i) => { if (p >= s.at) si = i; });
      if (warp > .5) si = state.stage; // hold during jump
      if (si !== state.stage && si >= 0) setStage(si, p);
      // warp
      const wi = WARPS.findIndex(([a, b]) => p > a && p < b);
      if (wi !== state.warpIdx) {
        state.warpIdx = wi;
        if (wi >= 0) { const nx = wi < 2 ? PLANETS[wi + 1].code : 'SINGULARITY'; ui.warpS.textContent = `JUMP → ${nx}`; if (state.booted) pushLog(`HYP// 하이퍼스페이스 점프 → ${nx}`); }
      }
      el.style.setProperty('--warp', warp.toFixed(3));
      // panels
      PANEL_ON.forEach(([a, b], i) => {
        const v = smooth(a, a + .012, p) * (1 - smooth(b - .01, b, p));
        const panel = ui.panels[i];
        panel.style.setProperty('--v', v.toFixed(3));
        const vis = v > .5;
        if (vis !== state.panel[i]) { state.panel[i] = vis; panel.inert = !vis; panel.setAttribute('aria-hidden', String(!vis)); panel.classList.toggle('is-on', vis); }
      });
      // finale
      const f = smooth(.9, .955, p);
      el.style.setProperty('--f', f.toFixed(3));
      const fv = f > .5;
      if (fv !== state.fin) { state.fin = fv; ui.fin.inert = !fv; ui.fin.setAttribute('aria-hidden', String(!fv)); }
      el.style.setProperty('--hud', (1 - smooth(.88, .93, p)).toFixed(3));
      // readouts
      ui.speed.textContent = warp > .35 ? `${(9 + warp * .97).toFixed(2)}` : speedKms.toFixed(1);
      const isW = warp > .35;
      if (isW !== state.isW) { state.isW = isW; ui.speed.parentElement.classList.toggle('is-warp', isW); ui.unit.textContent = isW ? 'WARP' : 'km/s'; }
      ui.throttle.style.transform = `scaleX(${clamp(thrust / 1.6).toFixed(3)})`;
      ui.boost.style.opacity = (boost * .9 + .1 * (boost > .05)).toFixed(2);
      ui.tape.style.transform = `translate3d(${(-(heading + 180) * 4).toFixed(1)}px,0,0)`;
      ui.hdg.textContent = pad(Math.round(((heading % 360) + 360) % 360), 3);
      ui.alt.textContent = `${alt.toFixed(1)} km`;
      ui.dist.textContent = tgtDist != null ? `${Math.round(tgtDist).toLocaleString('en-US')} km` : '—';
      ui.g.textContent = gLoad.toFixed(2);
      // target lock
      if (tgt) {
        proj.copy(tgt).project(camera);
        const behind = proj.z > 1;
        let sx = (proj.x * .5 + .5) * innerWidth, sy = (-proj.y * .5 + .5) * innerHeight;
        if (behind) { sx = innerWidth - sx; sy = innerHeight - 40; }
        const m = 54, inside = !behind && sx > m && sx < innerWidth - m && sy > 100 && sy < innerHeight - m;
        sx = clamp(sx, m, innerWidth - m); sy = clamp(sy, 100, innerHeight - m);
        ui.lock.style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`;
        const centred = inside && Math.hypot(sx - innerWidth / 2, sy - innerHeight / 2) < Math.min(innerWidth, innerHeight) * .28;
        ui.lock.classList.toggle('is-locked', centred);
        ui.lock.classList.toggle('is-edge', !inside);
        ui.lock.style.opacity = '';
        if (tgtName !== state.lockName) { state.lockName = tgtName; ui.lockB.textContent = tgtName; }
        ui.lockE.textContent = centred ? 'LOCKED' : 'TRACKING';
      } else ui.lock.style.opacity = '0';
      ui.reticle.style.transform = `translate3d(${(camSteer.x * 26).toFixed(1)}px,${(camSteer.y * 18).toFixed(1)}px,0)`;
      ui.flash.style.opacity = clamp(info.flash).toFixed(3);
      ui.cockpit.style.opacity = cockpitT.toFixed(3);
      tickLog(dt, paused);
    }

    function drawRadar(sp, d) {
      const W = ui.radar.width, c = W / 2, s = W / RS, range = 900, k = (W / 2 - 4) / range;
      rctx.clearRect(0, 0, W, W);
      rctx.save(); rctx.translate(c, c);
      rctx.strokeStyle = 'rgba(77,226,255,.22)'; rctx.lineWidth = 1 * s;
      for (const r of [.33, .66, 1]) { rctx.beginPath(); rctx.arc(0, 0, (W / 2 - 4) * r, 0, 7); rctx.stroke(); }
      rctx.beginPath(); rctx.moveTo(-c, 0); rctx.lineTo(c, 0); rctx.moveTo(0, -c); rctx.lineTo(0, c); rctx.stroke();
      const a = time * 1.6;
      const gr = rctx.createConicGradient ? rctx.createConicGradient(a, 0, 0) : null;
      if (gr) { gr.addColorStop(0, 'rgba(77,226,255,.35)'); gr.addColorStop(.12, 'rgba(77,226,255,0)'); gr.addColorStop(1, 'rgba(77,226,255,0)'); rctx.fillStyle = gr; rctx.beginPath(); rctx.arc(0, 0, W / 2 - 4, 0, 7); rctx.fill(); }
      const dot = (x, z, r, col) => { const X = x * k, Y = z * k; if (X * X + Y * Y > (W / 2 - 4) ** 2) return; rctx.fillStyle = col; rctx.beginPath(); rctx.arc(X, Y, r * s, 0, 7); rctx.fill(); };
      if (d > BELT[0] - 900 && d < BELT[1] + 200) for (let i = 0; i < rockData.length; i += 2) { const r = rockData[i]; dot(r.pos.x - sp.x, r.pos.z - sp.z, r.s > 8 ? 2.6 : 1.1, 'rgba(220,214,235,.75)'); }
      gates.forEach(g => { const z = g.g.position.z - sp.z; if (z < 40) { rctx.fillStyle = '#ffd36b'; rctx.fillRect((g.g.position.x - sp.x) * k - 5 * s, z * k - 1 * s, 10 * s, 2 * s); } });
      planets.forEach(P => { const z = P.g.position.z - sp.z; if (Math.abs(z) < range * 1.4) { rctx.strokeStyle = P.pl.atmo; rctx.lineWidth = 1.5 * s; rctx.beginPath(); rctx.arc((P.g.position.x - sp.x) * k, z * k, 110 * k, 0, 7); rctx.stroke(); } });
      { const z = bh.position.z - sp.z; if (Math.abs(z) < range * 1.4) { rctx.strokeStyle = '#ffffff'; rctx.lineWidth = 2 * s; rctx.beginPath(); rctx.arc(0, z * k, 26 * s * .4, 0, 7); rctx.stroke(); } }
      rctx.fillStyle = '#4de2ff'; rctx.beginPath(); rctx.moveTo(0, -5 * s); rctx.lineTo(3.5 * s, 4 * s); rctx.lineTo(-3.5 * s, 4 * s); rctx.closePath(); rctx.fill();
      rctx.restore();
    }

    function emitTrail(n, wpos, wvel) {
      for (let i = 0; i < n; i++) {
        const j = tHead; tHead = (tHead + 1) % TN;
        tPos[j * 3] = wpos.x + rand(-.12, .12); tPos[j * 3 + 1] = wpos.y + rand(-.12, .12); tPos[j * 3 + 2] = wpos.z + rand(-.2, .2);
        tVel[j * 3] = wvel.x + rand(-.6, .6); tVel[j * 3 + 1] = wvel.y + rand(-.6, .6); tVel[j * 3 + 2] = wvel.z;
        tLife[j] = rand(0, .15);
      }
    }

    const shake = new THREE.Vector3();
    function frame(now) {
      if (disposed) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (document.hidden) return;
      const paused = isPaused();
      el.classList.toggle('is-paused', paused);
      if (!paused) time += dt;
      frameN++;
      if (bootT < 0 && !document.querySelector('.pn-intro:not(.pn-out)')) bootT = 0;
      if (bootT >= 0) bootT = paused ? 3 : Math.min(3, bootT + dt);
      const boot = clamp(bootT / 2.6);

      prog += (target - prog) * damp(6, dt);
      if (Math.abs(target - prog) < 1e-5) prog = target;
      const p = prog;

      // boost: advance throttle (scroll) while held
      boost += ((boostHeld ? 1 : 0) - boost) * damp(boostHeld ? 5 : 3, dt);
      if (boostHeld && p < .995) {
        const px = 1100 * dt;
        if (lenis) lenis.scrollTo((lenis.targetScroll ?? scrollY) + px, { lerp: .08 }); else scrollBy(0, px);
      }

      // distance + velocity
      const d = distAt(p);
      const rawV = (d - lastD) / Math.max(dt, 1e-3); lastD = d;
      vel += (clamp(rawV, 0, 60000) - vel) * damp(4, dt);
      const warp = warpAt(p);
      const inSpace = smooth(.1, .14, p);

      // steering
      const kx = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
      const ky = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
      steer.kx += (kx - steer.kx) * damp(4, dt); steer.ky += (ky - steer.ky) * damp(4, dt);
      steer.x = clamp(steer.px + steer.kx, -1, 1); steer.y = clamp(steer.py + steer.ky, -1, 1);
      const belt = beltEnv(d);
      const ampX = lerp(4.5, 9, belt) * inSpace * (1 - warp * .7), ampY = lerp(2.6, 4.5, belt) * inSpace * (1 - warp * .7);
      const pvx = sv.x, pvy = sv.y;
      sv.x += (steer.x * ampX - sv.x) * damp(2.6, dt); sv.y += (-steer.y * ampY - sv.y) * damp(2.6, dt);
      const svx = (sv.x - pvx) / Math.max(dt, 1e-3), svy = (sv.y - pvy) / Math.max(dt, 1e-3);
      sv.vx += (svx - sv.vx) * damp(6, dt); sv.vy += (svy - sv.vy) * damp(6, dt);
      camSteer.x += (steer.x - camSteer.x) * damp(1.6, dt); camSteer.y += (steer.y - camSteer.y) * damp(1.6, dt);

      // ship pose
      const bob = paused ? 0 : Math.sin(time * 1.3) * .08 * (1 - warp);
      const sp = tmp.set(pathX(d) + sv.x, pathY(d) + sv.y + bob, -d);
      ship.position.copy(sp);
      const dxdd = (pathX(d + 4) - pathX(d - 4)) / 8, dydd = (pathY(d + 4) - pathY(d - 4)) / 8;
      const fv = Math.max(vel, 40);
      const yaw = -Math.atan(dxdd + sv.vx / fv) * .9 - steer.x * .1 * inSpace;
      const pitch = Math.atan(dydd + sv.vy / fv) * .9 - steer.y * .06 * inSpace;
      const orbitBank = ORBITS.reduce((s, [a, b], i) => s + (smooth(a, a + .03, p) * (1 - smooth(b - .03, b, p))) * PLANETS[i].side, 0);
      const roll = clamp(-sv.vx * .07 - steer.x * .42 * inSpace - dxdd * 1.6 - orbitBank * .22, -1.2, 1.2) + (paused ? 0 : Math.sin(time * .6) * .03);
      ship.rotation.set(pitch, yaw, roll, 'YXZ');
      ship.updateMatrixWorld();

      // engines
      const preSpool = smooth(.03, .095, p) * .55;
      const thrust = (.12 + .25 * boot) * (1 - inSpace) + preSpool * (1 - inSpace) + inSpace * clamp(.32 + vel / 340, 0, 1.3) + boost * .8 + warp * .6;
      launchKick = bump(p, .108, .014);
      const tI = clamp(thrust, 0, 2);
      plumes.forEach((pl, i) => { const inner = i % 2 === 1; pl.scale.z = (inner ? 1.4 : 2.2) + tI * (inner ? 3 : 6.5) + launchKick * 6; const w = .85 + tI * .15; if (!inner) pl.scale.set(w, w, pl.scale.z); });
      plumeMat.uniforms.uI.value = clamp(.15 + tI * .7, 0, 1.4) * boot; plumeMat.uniforms.uT.value = time;
      M.nozzle.color.copy(cB).multiplyScalar(.4 + tI * 3.2 * boot);
      glows.forEach(g => { g.scale.setScalar((.9 + tI * 1.5) * (.4 + .6 * boot)); g.material.opacity = clamp(.25 + tI * .35); });
      engLight.intensity = (8 + tI * 60) * boot;
      const blink = paused ? 1 : (Math.sin(time * 5.5) > .55 ? 1 : .08);
      navLights.forEach((n, i) => { n.material.opacity = boot * (i === 2 ? (Math.sin(time * 5.5 + 1.6) > .7 ? 1 : .05) : blink); });

      // trail
      if (!paused) {
        body.localToWorld(nozzleL.set(-.78, -.08, 3.8)); body.localToWorld(nozzleR.set(.78, -.08, 3.8));
        if (warp < .1 && inSpace > .2 && rawV < 4000) {
          fwd.set(0, 0, 1).applyQuaternion(ship.quaternion).multiplyScalar(4 + tI * 9);
          const n = Math.ceil(tI * 4 * inSpace);
          emitTrail(n, nozzleL, fwd); emitTrail(n, nozzleR, fwd);
        }
        for (let i = 0; i < TN; i++) {
          if (tLife[i] >= 1) continue;
          tLife[i] = Math.min(1, tLife[i] + dt / .85);
          tPos[i * 3] += tVel[i * 3] * dt; tPos[i * 3 + 1] += tVel[i * 3 + 1] * dt; tPos[i * 3 + 2] += tVel[i * 3 + 2] * dt;
        }
        trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.aLife.needsUpdate = true;
      }

      // camera
      cockpitT += ((cockpit ? 1 : 0) - cockpitT) * damp(4, dt);
      const hero = 1 - smooth(.035, .1, p);
      const portrait = innerWidth < innerHeight ? 1 : 0;
      const theta = lerp(0, 2.45 + (paused ? 0 : Math.sin(time * .15) * .22), hero);
      const rr = lerp(13 + portrait * 5, 17 + portrait * 8, hero), hh = lerp(2.9, 2.4, hero);
      const orbitF = ORBITS.map(([a, b]) => smooth(a, a + .035, p) * (1 - smooth(b - .03, b, p)));
      const fin = smooth(.83, .97, p);
      let ox = Math.sin(theta) * rr, oy = hh, oz = Math.cos(theta) * rr;
      let lookMix = 0; const lookAt = tmp2;
      orbitF.forEach((o, i) => { ox += -PLANETS[i].side * 2 * o; oy += 1.6 * o; oz += 5 * o; });
      oy += fin * 5; oz += fin * 14;
      oz += (vel > 300 ? Math.min(6, (vel - 300) / 180) : 0) * (1 - warp) + boost * 2.5 - warp * 3;
      camOff.x += (ox - camOff.x) * damp(3, dt); camOff.y += (oy - camOff.y) * damp(3, dt); camOff.z += (oz - camOff.z) * damp(3, dt);
      const chasePos = new THREE.Vector3(sp.x + camOff.x - camSteer.x * 1.6 * inSpace, sp.y + camOff.y + camSteer.y * .9 * inSpace, sp.z + camOff.z);
      // look target
      const ch = (1 - hero) ** 2;
      const ahead = new THREE.Vector3(sp.x + camSteer.x * 2 * inSpace, sp.y + lerp(.2, 1.7, ch), sp.z - lerp(0, 22, ch));
      lookAt.copy(ahead);
      orbitF.forEach((o, i) => { if (o > 0) { lookAt.lerp(planets[i].g.position, .12 * o); lookMix = Math.max(lookMix, o); } });
      if (fin > 0) lookAt.lerp(bh.position, .45 * fin);
      // cockpit
      const ckPos = ship.localToWorld(new THREE.Vector3(0, .78, -1.5));
      const ckLook = ship.localToWorld(new THREE.Vector3(0, .6, -40));
      camera.position.lerpVectors(chasePos, ckPos, cockpitT);
      camLook.lerpVectors(lookAt, ckLook, cockpitT);
      // shake
      const sk = (warp * .22 + boost * .1 + launchKick * .55 + belt * Math.min(1, vel / 900) * .05) * (paused ? 0 : 1);
      shake.set(Math.sin(time * 41) * Math.sin(time * 17.3), Math.sin(time * 37.7 + 1) * Math.cos(time * 13.1), 0).multiplyScalar(sk);
      camera.position.add(shake);
      camera.up.set(0, 1, 0);
      camera.lookAt(camLook);
      if (cockpitT > .01) camera.rotateZ(ship.rotation.z * cockpitT * .9);
      else camera.rotateZ(-camSteer.x * .05 * inSpace);
      body.visible = cockpitT < .6;
      const fov = 52 + portrait * 10 + Math.min(14, vel / 90) * (1 - warp) + warp * 36 + boost * 9 + launchKick * 14 - lookMix * 4;
      if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld();

      // world
      const camP = camera.position;
      nebula.position.copy(camP);
      nebMat.uniforms.uT.value = time;
      // nebula tint follows the current planet
      let tA = cA, tB = cB;
      const near = planets.findIndex(P => Math.abs(P.d - d) < 900);
      if (near >= 0) { tA = new THREE.Color(PLANETS[near].tint); tB = cB; }
      if (d > 13000) { tA = new THREE.Color('#5a2dff'); tB = new THREE.Color('#ff7a3d'); }
      neb.a.lerp(tA, damp(1.2, dt)); neb.b.lerp(tB, damp(1.2, dt));
      nebMat.uniforms.uA.value.copy(neb.a); nebMat.uniforms.uB.value.copy(neb.b);
      nebMat.uniforms.uI.value = lerp(1, 1.5, warp);
      const sMin = d < 120 ? 140 : 0;
      for (const S of [stars, streaks]) { const u = S.material.uniforms; u.uCam.value.copy(camP); u.uMin.value = sMin; }
      const streakLen = Math.min(260, vel * .045 + warp * 420 + boost * 30);
      streaks.material.uniforms.uStreak.value = streakLen;
      streaks.material.uniforms.uOp.value = clamp(streakLen / 12) * (1 - cockpitT * .3);
      stars.material.uniforms.uOp.value = 1 - warp * .5;
      tunnelMat.uniforms.uW.value = warp; tunnelMat.uniforms.uT.value = time;
      tunnel.visible = warp > .01;

      // hangar
      hangar.visible = d < 700;
      if (hangar.visible) {
        const open = smooth(.075, .102, p);
        doors[0].position.x = -HW / 2 - open * (HW + 1); doors[1].position.x = HW / 2 + open * (HW + 1);
        doorSeamMat.color.set('#ff6a3d').multiplyScalar((1 - open) * (smooth(.04, .06, p) * (paused ? 1 : .6 + .4 * Math.sin(time * 9)) + .2 * boot));
        clamps.forEach((c, i) => { c.position.y = HFLOOR + 1.6 - smooth(.06, .085, p) * 3.4; });
        padRingMat.color.set(PB).multiplyScalar(boot * (1.2 + smooth(.04, .09, p) * 3) * (paused ? 1 : .8 + .2 * Math.sin(time * 3)));
        const lit = bootT >= 0 ? bootT * 6 : -1;
        const alarm = smooth(.04, .06, p) * (1 - smooth(.1, .12, p));
        const col = new THREE.Color();
        for (let i = 0; i < si; i++) {
          const info = stripInfo[i];
          if (info.kind === 2) {
            const run = paused ? 1 : ((time * 14 - info.k) % 12 + 12) % 12 < 2 ? 1 : .12;
            col.set(alarm > .1 ? '#ff5a3d' : PB).multiplyScalar(boot * (alarm > .1 ? run * 4 : 1.4));
          } else {
            const on = clamp(lit - info.order) ;
            col.set(alarm > .1 && info.kind === 1 ? '#ff6a4d' : '#e3ecff').multiplyScalar(on * (info.kind === 1 ? 2.2 : 3.2) * (alarm > .1 && !paused && info.kind === 1 ? (.5 + .5 * Math.sin(time * 8)) : 1));
          }
          strips.setColorAt(i, col);
        }
        strips.instanceColor.needsUpdate = true;
        const bayI = 70 * boot;
        bayA.intensity = bayI; bayB.intensity = bayI;
      } else { bayA.intensity = 0; bayB.intensity = 0; }

      // belt
      rocks.visible = d > BELT[0] - 1100 && d < BELT[1] + 300;
      if (rocks.visible && !paused) {
        for (let i = 0; i < RN; i++) {
          const r = rockData[i];
          dm.position.copy(r.pos);
          dm.rotation.set(r.rot.x + time * r.spin.x, r.rot.y + time * r.spin.y, r.rot.z + time * r.spin.z);
          dm.scale.copy(r.sc).multiplyScalar(r.s); dm.updateMatrix(); rocks.setMatrixAt(i, dm.matrix);
        }
        rocks.instanceMatrix.needsUpdate = true;
      }
      let gateFlash = 0;
      gates.forEach((G, i) => {
        G.g.visible = d < G.d + 60 && d > G.d - 1600;
        if (state.d < G.d && d >= G.d && state.booted) { G.flash = 1; pushLog(`NAV// GATE ${pad(i + 1)}/03 통과 · 궤적 양호`); }
        G.flash = Math.max(0, G.flash - dt * 1.6);
        gateFlash = Math.max(gateFlash, G.flash);
        G.glow.material.color.set(i % 2 ? PB : PA).multiplyScalar(2.2 + G.flash * 8 + (paused ? 0 : Math.sin(time * 4 + i) * .4));
        G.g.rotation.z += paused ? 0 : dt * .15 * (i % 2 ? 1 : -1);
      });
      state.d = d;

      // planets
      planets.forEach((P, i) => {
        P.g.visible = Math.abs(P.d - d) < 2600 && (i === 0 ? d < 3000 : d > PLANET_D[i] - 1600);
        if (!P.g.visible) return;
        P.mat.uniforms.uT.value = time; P.mat.uniforms.uCam.value.copy(camP);
        P.atmo.material.uniforms.uCam.value.copy(camP);
        P.sphere.rotation.y = time * .03;
        P.halo.rotation.z = time * .05;
      });

      // black hole
      bh.visible = d > 12500;
      if (bh.visible) {
        diskU.uT.value = time;
        photon.lookAt(camP);
        const k = smooth(13400, 14300, d);
        diskU.uI.value = .6 + k * .7; haloU.uI.value = .6 + k * .7;
      }

      // lights
      rim.position.copy(sp).add(new THREE.Vector3(4, 5, -8)); rim.target.position.copy(sp);
      sun.position.copy(sp).addScaledVector(sunDir, 50); sun.target.position.copy(sp);
      hemi.intensity = .35 + (1 - inSpace) * .25;

      // post
      const flash = bump(p, .106, .006) * .55 + WARPS.reduce((s, [a, b]) => s + bump(p, a + .008, .006) * .8 + bump(p, b - .006, .005) * 1.1, 0) + gateFlash * .25;
      postMat.uniforms.uFlash.value = flash * .9;
      postMat.uniforms.uCA.value = .0012 + warp * .014 + boost * .004 + launchKick * .01;
      postMat.uniforms.uWarp.value = warp;
      postMat.uniforms.uT.value = time;
      renderer.toneMappingExposure = lerp(.4, 1.05, boot) + flash * .4;

      // HUD info
      let tgt = null, tgtName = '', tgtDist = null;
      if (p < .1) { tgt = new THREE.Vector3(0, 5, HDOOR); tgtName = 'BAY DOOR'; }
      else {
        const g = gates.find(G => G.d > d + 5);
        if (g && d > 300) { tgt = g.g.position; tgtName = `GATE ${pad(gates.indexOf(g) + 1)}`; }
        else {
          const P = planets.find(P => P.d > d - 60);
          if (P && P.d - d < 1800) { tgt = P.g.position; tgtName = P.pl.code; }
          else if (d > 12500) { tgt = bh.position; tgtName = 'SINGULARITY'; }
        }
      }
      if (tgt) tgtDist = tgt.distanceTo(sp) * 10;
      const info = {
        warp, thrust: tI, target: warp > .3 ? null : tgt, tgtName, tgtDist,
        speedKms: inSpace < .01 ? vel * .1 : 7.9 + vel * .012 + boost * 3,
        gLoad: 1 + Math.min(8, Math.hypot(sv.vx, sv.vy) * .05 + launchKick * 3.4 + boost * .6),
        heading: 312 + d * .006 - yaw * 57.3, alt: 402 + sp.y * .4 + d * .002, flash
      };
      updateUI(p, dt, paused, info);
      if (frameN % 2 === 0) drawRadar(sp, d);

      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
    }

    if (gsap) { tickerFn = () => frame(performance.now()); gsap.ticker.add(tickerFn); }
    else { const loop = now => { rafId = requestAnimationFrame(loop); frame(now); }; rafId = requestAnimationFrame(loop); }

    teardown = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (gsap) { if (tickerFn) gsap.ticker.remove(tickerFn); if (lenisFn) gsap.ticker.remove(lenisFn); gsap.ticker.lagSmoothing(500, 33); }
      ctx?.revert(); lenis?.destroy();
      const geos = new Set(), mats = new Set();
      const collect = o => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
        if (o.isInstancedMesh) o.dispose?.();
      };
      scene.traverse(collect); postScene.traverse(collect);
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
    if (renderer) { renderer.setRenderTarget(null); renderer.dispose(); renderer.forceContextLoss(); }
    root.innerHTML = '';
  };
}
