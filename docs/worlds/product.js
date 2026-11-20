// Assembly Study — "Follow the Product".
// A product-reel world: one fixed WebGL stage, a tall scroll track and a single
// scrubbed GSAP timeline that drives a numeric state object `S`. The render loop
// reads `S` every frame and poses the hero device ("MetaSonGi Core"), its parts,
// the follow-camera, the lighting and the DOM overlays (callouts, kinetic type).
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { projects, profileURL } from '../content.js?v=ten-worlds-1';

const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs',
};
const ART = { vrm: 'art/vrm.jpg', pixelle: 'art/glass.jpg', motion: 'art/orbit.jpg' };
const SHORT = { vrm: 'Virtual Human', pixelle: 'AI Pipeline', motion: 'Ten Worlds' };
const TAU = Math.PI * 2;
const FLOOR = -1.45;
const W = 2.2, H = 1.4;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

const stackAll = [...new Set(projects.flatMap(p => p.stack))];

// Spec callouts for the 360° turntable — anchored to points on the chassis.
const SPECS = [
  // shown in pairs while the device turns, each anchored where it faces the camera
  { v: pad(projects.length), k: '실제로 만든 프로젝트', a: [-1.04, 0.5, 0.24], side: -1, y: 0.32 },
  { v: 'VRM 0.x · 1.0', k: '브라우저 가상 인물 로딩', a: [0, 0, 0.26], side: 1, y: 0.44 },
  { v: 'WebM', k: '영상 · 마이크 음성 녹화', a: [0, 0.85, -0.07], side: 1, y: 0.3 },
  { v: 'FastAPI', k: 'Python AI 영상 브리지', a: [0.6, -0.4, -0.22], side: -1, y: 0.58 },
  { v: String(stackAll.length), k: '다뤄 온 기술 스택', a: [1.12, 0.3, 0], side: 1, y: 0.34 },
  { v: 'Ten Worlds', k: '하나의 작업, 열 가지 방식', a: [1.12, -0.4, 0.12], side: 1, y: 0.6 },
];
// Exploded-view labels — every part is a capability.
const PARTS = [
  // sides match the exploded pose: front parts drift left on screen, rear parts right
  { key: 'glass', v: 'Three.js', k: '실시간 3D 렌더링 레이어', side: -1, y: 0.3 },
  { key: 'ring', v: 'Web Audio', k: '음량 기반 립싱크 링', side: -1, y: 0.52 },
  { key: 'core', v: 'VRM', k: '목소리에 반응하는 가상 인물', side: -1, y: 0.74, extra: true },
  { key: 'module', v: 'Pixelle-Video', k: 'AI 영상 파이프라인 모듈', side: 1, y: 0.24 },
  { key: 'back', v: 'FastAPI', k: 'Python 브리지 서버', side: 1, y: 0.46 },
  { key: 'frame', v: 'TypeScript', k: '타입으로 다진 섀시', side: 1, y: 0.68, extra: true },
];
// Timeline is 100 units long; chapter i starts travelling at 41 + 12i.
const CH0 = 41, CHL = 12;
const RAIL = [
  { name: 'Reveal', at: 0 },
  { name: '360°', at: 0.09 },
  { name: 'Exploded', at: 0.29 },
  ...projects.map((p, i) => ({ name: `${pad(i + 1)} ${SHORT[p.id] || p.name}`, at: (CH0 + i * CHL + 6.5) / 100 })),
  { name: 'Assembled', at: 0.9 },
];
const PALETTE = ['#060608', '#170c06', '#05121a', '#0d0919', '#0a0706'];
const RIMS = [null, null, '#7ad7ff', '#b58cff', null];

// Kinetic headline: words → letters, each letter clipped so it can rise.
function kin(text) {
  return text.split(' ').map(w => `<span class="as-wd">${[...w].map(c => `<span class="as-ch"><span class="as-in">${esc(c)}</span></span>`).join('')}</span>`).join(' ');
}
const ext = url => `href="${esc(url)}" target="_blank" rel="noopener noreferrer"`;

function staticMarkup() {
  return `<div class="as as-static" data-no-kx>
    <header class="as-s-hero">
      <span class="as-eyebrow">MetaSonGi Core — Model 07</span>
      <h1 class="as-s-title">Assembly Study</h1>
      <p class="as-tag">Take it apart. <em>Put it back.</em></p>
      <p class="as-lead">포트폴리오를 하나의 제품처럼 — 분해하고, 살펴보고, 다시 조립합니다.</p>
    </header>
    <dl class="as-s-specs">${SPECS.map(s => `<div><dt>${esc(s.k)}</dt><dd>${esc(s.v)}</dd></div>`).join('')}</dl>
    <section class="as-s-list" aria-label="프로젝트">${projects.map((p, i) => `
      <article class="as-s-card">
        <figure><img src="${ART[p.id]}" alt="${esc(p.name)} 대표 이미지" loading="lazy" width="1536" height="1024"></figure>
        <div class="as-s-copy">
          <span class="as-s-num" aria-hidden="true">${pad(i + 1)}</span>
          <span class="as-eyebrow">${esc(p.category)}</span>
          <h2>${esc(p.name)}</h2>
          <p class="as-desc">${esc(p.description)}</p>
          <p class="as-body">${esc(p.body)}</p>
          <ul class="as-stack">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          <a class="as-link" ${ext(p.url)}>프로젝트 보기 ↗</a>
        </div>
      </article>`).join('')}
    </section>
    <footer class="as-s-end"><span class="as-eyebrow">Fully assembled</span><h2>One developer. Fully assembled.</h2><a class="as-cta" ${ext(profileURL)}>GitHub에서 더 보기 ↗</a></footer>
  </div>`;
}

function cinematicMarkup() {
  const callout = (c, i, kind) => `<div class="as-co${c.extra ? ' as-co-extra' : ''}" data-kind="${kind}" data-i="${i}">
      <i class="as-co-line"></i><i class="as-co-dot"></i>
      <div class="as-co-label${c.side < 0 ? ' is-left' : ''}"><small>${kind === 'spec' ? 'S' : 'P'}/${pad(i + 1)}</small><b>${esc(c.v)}</b><span>${esc(c.k)}</span></div>
    </div>`;
  return `<div class="as as-pre" data-no-kx>
    <div class="as-bg" aria-hidden="true"></div>
    <div class="as-back">
      <h1 class="as-title" aria-label="Assembly Study"><span class="as-tl" aria-hidden="true">${kin('Assembly')}</span><span class="as-tl" aria-hidden="true">${kin('Study')}</span></h1>
      ${projects.map((p, i) => `<b class="as-num" data-i="${i}" aria-hidden="true">${pad(i + 1)}</b>`).join('')}
      <b class="as-endword" aria-hidden="true">${kin('Assembled')}</b>
      <section class="as-beat as-b-snap">
        <h2 class="as-h as-h-big" aria-label="Put it back.">${kin('Put it back.')}</h2>
      </section>
    </div>
    <canvas class="as-gl" aria-hidden="true"></canvas>
    <div class="as-hud">
      <div class="as-callouts" aria-hidden="true">${SPECS.map((c, i) => callout(c, i, 'spec')).join('')}${PARTS.map((c, i) => callout(c, i, 'part')).join('')}</div>
      <i class="as-sweep" aria-hidden="true"></i>
      <section class="as-beat as-b-reveal">
        <span class="as-eyebrow as-r">MetaSonGi Core — Model 07</span>
        <div class="as-r-foot">
          <p class="as-tag as-r">Take it apart. <em>Put it back.</em></p>
          <p class="as-lead as-r">포트폴리오를 하나의 제품처럼 — 분해하고, 살펴보고, 다시 조립합니다.</p>
          <span class="as-cue as-r" aria-hidden="true">SCROLL TO EXPLORE<i></i></span>
        </div>
      </section>
      <section class="as-beat as-b-turn">
        <h2 class="as-h" aria-label="Every angle, engineered.">${kin('Every angle, engineered.')}</h2>
        <p class="as-sub as-up">모든 각도에서 같은 완성도를. 드래그해서 직접 돌려 보세요.</p>
      </section>
      <section class="as-beat as-b-explode">
        <h2 class="as-h" aria-label="Built from capabilities.">${kin('Built from capabilities.')}</h2>
        <p class="as-sub as-up">부품 하나하나가 실제로 다뤄 온 기술입니다.</p>
      </section>
      ${projects.map((p, i) => `
      <article class="as-chap" data-i="${i}" aria-label="${esc(p.name)}">
        <div class="as-card">
          <span class="as-eyebrow as-up">Chapter ${pad(i + 1)} · ${esc(p.category)}</span>
          <h3 class="as-h as-h3" aria-label="${esc(p.name)}">${kin(p.name)}</h3>
          <p class="as-desc as-up">${esc(p.description)}</p>
          <p class="as-body as-up">${esc(p.body)}</p>
          <ul class="as-stack as-up">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          <a class="as-link as-up" ${ext(p.url)}>프로젝트 보기 ↗</a>
        </div>
      </article>`).join('')}
      <section class="as-beat as-b-final">
        <span class="as-eyebrow as-up">MetaSonGi Core · Fully assembled</span>
        <h2 class="as-h" aria-label="One developer. Fully assembled.">${kin('One developer. Fully assembled.')}</h2>
        <p class="as-sub as-up">세 개의 프로젝트와 ${stackAll.length}가지 기술이 하나의 결과물로 맞물립니다.</p>
        <a class="as-cta as-up" ${ext(profileURL)}>GitHub에서 더 보기 ↗</a>
      </section>
      <span class="as-hint" aria-hidden="true">DRAG TO SPIN</span>
    </div>
    <i class="as-flash" aria-hidden="true"></i>
    <nav class="as-rail" aria-label="챕터 이동">
      <i class="as-rail-bar"><b></b></i>
      ${RAIL.map((r, i) => `<button type="button" data-i="${i}"><span>${esc(r.name)}</span><i></i></button>`).join('')}
    </nav>
    <div class="as-track" aria-hidden="true"></div>
  </div>`;
}

// ---------- procedural helpers ----------
function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function slab(shape, depth, bevel, segs = 4) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: segs, curveSegments: 20 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function glowTexture() {
  return canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
}
function shadowTexture() {
  return canvasTex(256, 256, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(0,0,0,.92)'); r.addColorStop(0.45, 'rgba(0,0,0,.5)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
}
function boardTexture() {
  return canvasTex(1024, 640, (g, w, h) => {
    g.fillStyle = '#0c0d10'; g.fillRect(0, 0, w, h);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      let x = rnd() * w, y = rnd() * h;
      g.strokeStyle = `rgba(255,255,255,${0.18 + rnd() * 0.5})`; g.lineWidth = 1.5 + rnd() * 2.5;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        if (rnd() > 0.5) x += (rnd() - 0.5) * 360; else y += (rnd() - 0.5) * 240;
        g.lineTo(x, y);
      }
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x, y, 4 + rnd() * 3, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.strokeRect(w / 2 - 150, h / 2 - 150, 300, 300);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '600 26px "JetBrains Mono", monospace';
    g.fillText('MSG-CORE / MODEL 07', 40, h - 44); g.fillText('ASSEMBLY STUDY', w - 300, 56);
  });
}

// ---------- mount ----------
export function mount(root, { isPaused = () => false } = {}) {
  let disposed = false, torn = false;
  const ac = new AbortController();
  const on = (t, ev, fn, opt = {}) => t.addEventListener(ev, fn, { ...opt, signal: ac.signal });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { window.scrollTo(0, 0); } catch { /* noop */ }

  const showStatic = () => { root.innerHTML = staticMarkup(); };
  if (reduced) { showStatic(); return () => { disposed = true; ac.abort(); root.innerHTML = ''; }; }

  root.innerHTML = cinematicMarkup();
  const el = root.querySelector('.as');
  const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
  const canvas = $('.as-gl');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    showStatic();
    return () => { disposed = true; ac.abort(); root.innerHTML = ''; };
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const css = getComputedStyle(document.body);
  const PA = new THREE.Color((css.getPropertyValue('--pa') || '').trim() || '#ff9a3d');
  const PB = new THREE.Color((css.getPropertyValue('--pb') || '').trim() || '#ffe1b8');

  // ---------- scene ----------
  const scene = new THREE.Scene();
  const bg = new THREE.Color(PALETTE[0]);
  scene.fog = new THREE.Fog(bg.clone(), 10, 34);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 140);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0;
  const textures = [];
  const track = t => (textures.push(t), t);
  const glowTex = track(glowTexture());

  const rig = new THREE.Group(); scene.add(rig);
  const device = new THREE.Group(); rig.add(device);

  const chassisMat = new THREE.MeshPhysicalMaterial({ color: '#1b1c21', metalness: 0.88, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.16 });
  const backMat = new THREE.MeshPhysicalMaterial({ color: '#2b2a2e', metalness: 0.92, roughness: 0.42, clearcoat: 0.3 });
  const metalMat = new THREE.MeshPhysicalMaterial({ color: '#dcd6cc', metalness: 1, roughness: 0.2 });
  const accentMetal = new THREE.MeshPhysicalMaterial({ color: PA.clone().lerp(new THREE.Color('#ffffff'), 0.2), metalness: 1, roughness: 0.28, clearcoat: 0.5 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.3, ior: 1.46, clearcoat: 1, clearcoatRoughness: 0.04, attenuationColor: PB.clone(), attenuationDistance: 2.4, specularIntensity: 0.6, envMapIntensity: 0.55 });
  const coreMat = new THREE.MeshStandardMaterial({ color: PA, emissive: PA, emissiveIntensity: 2.2, roughness: 0.25, metalness: 0.1 });

  // chassis frame (rounded ring with bevels)
  const frameShape = roundedRect(W, H, 0.3); frameShape.holes.push(roundedRect(W - 0.26, H - 0.26, 0.19));
  const frameMesh = new THREE.Mesh(slab(frameShape, 0.36, 0.04, 5), chassisMat); device.add(frameMesh);
  // back plate
  const back = new THREE.Mesh(slab(roundedRect(W - 0.14, H - 0.14, 0.26), 0.035, 0.015), backMat); device.add(back);
  // circuit board
  const boardTex = track(boardTexture());
  const board = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.36, H - 0.36), new THREE.MeshStandardMaterial({ map: boardTex, emissiveMap: boardTex, emissive: PA, emissiveIntensity: 0.55, roughness: 0.5, metalness: 0.45 }));
  device.add(board);
  // core + cage + glow
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.24, 48, 32), coreMat); device.add(core);
  const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.31, 1), new THREE.MeshBasicMaterial({ color: PB, wireframe: true, transparent: true, opacity: 0.35, toneMapped: false }));
  core.add(cage);
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: PA, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
  coreGlow.scale.setScalar(1.5); core.add(coreGlow);
  const coreLight = new THREE.PointLight(PA, 0, 4, 2); core.add(coreLight);
  // gasket rings
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.032, 24, 120), metalMat); device.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.018, 16, 140), accentMetal); device.add(ring2);
  // glass top panel
  const glass = new THREE.Mesh(slab(roundedRect(W - 0.2, H - 0.2, 0.22), 0.025, 0.012), glassMat); device.add(glass);
  // screws
  const screwGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.025, 28).rotateX(Math.PI / 2);
  const slotGeo = new THREE.BoxGeometry(0.064, 0.012, 0.012);
  const screws = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(screwGeo, metalMat));
    const slot = new THREE.Mesh(slotGeo, backMat); slot.position.z = 0.01; g.add(slot);
    g.userData.base = new THREE.Vector2(sx * (W / 2 - 0.17), sy * (H / 2 - 0.17));
    device.add(g); return g;
  });

  // modules / cards: live in world space so they can dock inside the device or float as screens.
  const loader = new THREE.TextureLoader();
  const modBody = slab(roundedRect(0.56, 0.38, 0.045), 0.022, 0.008, 3);
  const modScreenGeo = new THREE.PlaneGeometry(0.52, 0.52 / 1.5);
  const stripGeo = new THREE.BoxGeometry(0.3, 0.012, 0.012);
  const stripMat = new THREE.MeshBasicMaterial({ color: PA, toneMapped: false });
  const modMat = new THREE.MeshPhysicalMaterial({ color: '#121317', metalness: 0.75, roughness: 0.32, clearcoat: 0.6 });
  const modules = projects.map((p, i) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(modBody, modMat));
    const tex = track(loader.load(ART[p.id] || ART.vrm, t => { t.needsUpdate = true; }));
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const screen = new THREE.Mesh(modScreenGeo, new THREE.MeshBasicMaterial({ map: tex, color: 0x444444, toneMapped: false }));
    screen.position.z = 0.0205; g.add(screen);
    const strip = new THREE.Mesh(stripGeo, stripMat); strip.position.set(0, 0.19, 0.008); g.add(strip);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: PA, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    glow.position.z = -0.06; glow.scale.set(1.3, 0.95, 1); g.add(glow);
    g.userData = { bx: (i - 1) * 0.62, screen, glow };
    scene.add(g); return g;
  });

  // anchors (Object3D markers) for callouts
  const anchorAt = (parent, [x, y, z]) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  const specAnchors = SPECS.map(s => anchorAt(device, s.a));
  const partAnchors = {
    glass: anchorAt(glass, [-0.82, 0.42, 0.02]), core: anchorAt(core, [0, 0.2, 0.1]), ring: anchorAt(ring1, [-0.42, 0, 0]),
    module: anchorAt(modules[2], [0.2, 0.15, 0]), back: anchorAt(back, [0.85, 0.42, -0.02]), frame: anchorAt(frameMesh, [1.08, -0.3, 0.1]),
  };

  // studio set (no opaque floor, so the title behind the canvas stays visible): grid, pillars, dust, contact shadow
  const grid = new THREE.GridHelper(240, 160, PB, 0x2a2a30);
  grid.material.transparent = true; grid.material.opacity = 0.16; grid.material.depthWrite = false;
  grid.position.set(20, FLOOR + 0.003, 0); scene.add(grid);
  const pillarGeo = new THREE.BoxGeometry(0.045, 7, 0.045);
  const pillarMat = new THREE.MeshBasicMaterial({ color: PB, transparent: true, opacity: 0.26, toneMapped: false });
  const pillarSpots = [];
  for (let x = -14; x <= 58; x += 3.2) { pillarSpots.push([x, -6.5]); pillarSpots.push([x + 1.6, -11]); }
  const pillars = new THREE.InstancedMesh(pillarGeo, pillarMat, pillarSpots.length);
  const mtx = new THREE.Matrix4();
  pillarSpots.forEach(([x, z], i) => { mtx.makeTranslation(x, FLOOR + 3.5, z); pillars.setMatrixAt(i, mtx); });
  scene.add(pillars);
  const DUST = 900, dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) { dustPos[i * 3] = -14 + Math.random() * 72; dustPos[i * 3 + 1] = FLOOR + Math.random() * 6; dustPos[i * 3 + 2] = -9 + Math.random() * 13; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: PB, size: 0.028, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true }));
  scene.add(dust);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.6), new THREE.MeshBasicMaterial({ map: track(shadowTexture()), transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = FLOOR + 0.006; scene.add(shadow);

  // lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x101014, 0.25); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff1e0, 0); key.target = rig; scene.add(key);
  const rim = new THREE.DirectionalLight(PA.clone(), 0); rim.target = rig; scene.add(rim);
  const sweepLight = new THREE.PointLight(0xfff4e6, 0, 7, 1.6); scene.add(sweepLight);

  // ---------- state ----------
  const S = {
    rise: 0, sweep: -1.6, introW: 62, titleOut: 0,
    turn: 0, travelSpin: 0, devYaw: 0, devPitch: 0.06,
    explode: 0, pulse: 0.25, travel: 0, lift: 0,
    camDist: 6.4, camAz: 0, camEl: 0.1, lookY: 0, focus: 0,
    mod0: 0, mod1: 0, mod2: 0, flash: 0, shake: 0, idle: 0,
  };
  const callouts = $$('.as-co').map(node => {
    const kind = node.dataset.kind, i = +node.dataset.i, d = kind === 'spec' ? SPECS[i] : PARTS[i];
    return { node, d, kind, draw: 0, lw: 0, lh: 0, dot: node.querySelector('.as-co-dot'), line: node.querySelector('.as-co-line'), label: node.querySelector('.as-co-label'),
      anchor: kind === 'spec' ? specAnchors[i] : partAnchors[d.key] };
  });
  const titleEl = $('.as-title'), bgEl = $('.as-bg'), flashEl = $('.as-flash'), hintEl = $('.as-hint');
  const railBtns = $$('.as-rail button'), railFill = $('.as-rail-bar b');

  // ---------- input: drag spin + hover lean ----------
  let dragging = false, lastX = 0, spin = 0, spinVel = 0, dragged = false;
  const lean = { x: 0, y: 0 }, leanT = { x: 0, y: 0 };
  on(window, 'pointerdown', e => {
    if (e.button !== 0 || e.target.closest?.('a,button,.as-card')) return;
    dragging = true; lastX = e.clientX; spinVel = 0; el.classList.add('is-grabbing');
  });
  on(window, 'pointermove', e => {
    if (e.pointerType === 'mouse') { leanT.x = (e.clientX / innerWidth) * 2 - 1; leanT.y = (e.clientY / innerHeight) * 2 - 1; }
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    const d = dx * 0.0085; spin += d; spinVel = d;
    if (!dragged && Math.abs(spin) > 0.4) { dragged = true; hintEl.classList.add('is-done'); }
  });
  const release = () => { dragging = false; el.classList.remove('is-grabbing'); };
  on(window, 'pointerup', release); on(window, 'pointercancel', release);
  on(document, 'pointerleave', () => { leanT.x = 0; leanT.y = 0; });

  // ---------- sizing ----------
  let vw = 1, vh = 1, narrow = false;
  const resize = () => {
    if (torn) return;
    vw = innerWidth; vh = innerHeight; narrow = vw < 760;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow ? 1.5 : 2));
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
    callouts.forEach(c => { c.lw = 0; });
  };
  resize();
  on(window, 'resize', resize);

  // ---------- render loop ----------
  const v = new THREE.Vector3(), v2 = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const lookT = new THREE.Vector3(), desired = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3();
  const mLocal = new THREE.Matrix4(), mDock = new THREE.Matrix4(), pD = new THREE.Vector3(), qD = new THREE.Quaternion(), sD = new THREE.Vector3();
  const pF = new THREE.Vector3(), qF = new THREE.Quaternion(), qTilt = new THREE.Quaternion(), eTilt = new THREE.Euler(), qId = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), lp = new THREE.Vector3();
  let raf = 0, last = performance.now(), time = 0, idleAng = 0, firstFrame = true, lastBg = '', railActive = -1, wasPaused = null;
  let gsapLib = null, introStarted = false;
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  function placeCallouts() {
    let cx = 0;
    v2.setFromMatrixPosition(device.matrixWorld); const centerDist = v2.distanceTo(camera.position);
    for (const c of callouts) {
      const d = c.draw;
      if (d < 0.005) { if (c.vis !== false) { c.node.style.visibility = 'hidden'; c.vis = false; } continue; }
      if (c.d.extra && narrow) { c.node.style.visibility = 'hidden'; c.vis = false; continue; }
      if (c.vis !== true) { c.node.style.visibility = 'visible'; c.vis = true; }
      if (!c.lw) { c.lw = c.label.offsetWidth; c.lh = c.label.offsetHeight; }
      v.setFromMatrixPosition(c.anchor.matrixWorld);
      const behind = v.distanceTo(camera.position) > centerDist + 0.12;
      v.project(camera);
      const ax = (v.x * 0.5 + 0.5) * vw, ay = (-v.y * 0.5 + 0.5) * vh;
      const side = c.d.side, lw = c.lw, lh = c.lh;
      const lx = side < 0 ? (narrow ? 12 : vw * 0.27 - lw) : (narrow ? vw - 34 - lw : vw * 0.73);
      const ly = c.d.y * vh;
      const ex = side < 0 ? lx + lw + 10 : lx - 10, ey = ly;
      const dx = ex - ax, dy = ey - ay, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      c.node.style.opacity = Math.min(1, d * 1.5).toFixed(3);
      c.dot.style.transform = `translate(${ax.toFixed(1)}px,${ay.toFixed(1)}px) scale(${(0.4 + 0.6 * smooth(d * 2)).toFixed(3)})`;
      c.dot.style.opacity = behind ? '0.35' : '1';
      c.line.style.transform = `translate(${ax.toFixed(1)}px,${ay.toFixed(1)}px) rotate(${ang.toFixed(4)}rad)`;
      c.line.style.width = `${(len * smooth(d)).toFixed(1)}px`;
      c.label.style.transform = `translate(${(lx + side * (1 - smooth(d)) * 24).toFixed(1)}px,${(ly - lh / 2).toFixed(1)}px)`;
      cx++;
    }
    return cx;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
    const paused = !!isPaused();
    if (paused !== wasPaused) { el.classList.toggle('is-paused', paused); wasPaused = paused; }
    if (!paused) time += dt;
    if (gsapLib && !introStarted && !document.querySelector('.pn-intro:not(.pn-out)')) startIntro();

    // input physics
    const kl = 1 - Math.exp(-dt * 4);
    lean.x += (leanT.x - lean.x) * kl; lean.y += (leanT.y - lean.y) * kl;
    if (!dragging) {
      spin += spinVel; spinVel *= Math.pow(0.93, dt * 60);
      if (Math.abs(spinVel) < 0.0008) { const tgt = Math.round(spin / TAU) * TAU; spin += (tgt - spin) * (1 - Math.exp(-dt * 0.9)); }
    }
    if (!paused) idleAng += dt * 0.32 * S.idle;

    // background / fog colour
    scene.fog.color.copy(bg);
    const hex = bg.getHexString();
    if (hex !== lastBg) { bgEl.style.backgroundColor = `#${hex}`; lastBg = hex; }

    // device pose
    const e = S.explode;
    const bob = paused ? 0 : Math.sin(time * 0.9) * 0.035;
    rig.position.set(S.travel, S.lift + (S.rise - 1) * 0.75 + bob, 0);
    device.rotation.set(S.devPitch + lean.y * 0.12, S.turn + S.travelSpin + S.devYaw + spin + idleAng + lean.x * 0.22, 0);
    device.scale.setScalar(0.9 + 0.1 * S.rise);
    back.position.z = -0.165 - 1.25 * e;
    board.position.z = -0.12 - 0.62 * e;
    const beat = paused ? 0.5 : Math.sin(time * 3.4) * 0.5 + 0.5;
    core.position.z = 0.1 * e;
    core.scale.setScalar(1 + S.pulse * 0.1 * beat + S.flash * 0.35);
    cage.rotation.set(time * 0.4, time * 0.6, 0);
    cage.scale.setScalar(1 + e * 0.35);
    coreMat.emissiveIntensity = (0.6 + 1.6 * S.rise) * (1 + S.pulse * 0.5 * beat) + S.flash * 4;
    coreGlow.material.opacity = 0.25 + 0.55 * S.rise * (0.6 + 0.4 * S.pulse * beat) + S.flash;
    coreLight.intensity = (1.2 + S.pulse * 2.4 * beat) * S.rise + S.flash * 6;
    ring1.position.z = 0.02 + 0.72 * e; ring1.rotation.set(e * 0.35, -e * 0.2, time * 0.25 + e * Math.PI);
    ring2.position.z = 0.03 + 1.02 * e; ring2.rotation.set(-e * 0.25, e * 0.3, -time * 0.18 - e * Math.PI * 0.6);
    glass.position.z = 0.205 + 1.48 * e;
    screws.forEach((s, i) => {
      const b = s.userData.base;
      s.position.set(b.x * (1 + 0.22 * e), b.y * (1 + 0.3 * e), 0.24 + 1.95 * e + (i % 2) * 0.12 * e);
      s.rotation.z = e * TAU * 1.5;
    });

    // lights
    key.position.set(rig.position.x + 3.5, 4.2, 5.2); key.intensity = 2.6 * S.rise;
    rim.position.set(rig.position.x - 4.2, 2.6, -3.6); rim.intensity = 3.4 * S.rise;
    scene.environmentIntensity = 0.62 * S.rise;
    const sw = Math.max(0, 1 - Math.abs(S.sweep) / 1.1);
    sweepLight.position.set(rig.position.x + S.sweep * 2.2, rig.position.y + 0.5, 1.3);
    sweepLight.intensity = 22 * sw * sw;

    // follow camera
    const aspect = vw / vh;
    const f = S.focus;
    const distMul = clamp(1.25 / aspect, 1, 2.7) * (narrow ? 1 - 0.22 * f : 1);
    const dist = S.camDist * distMul;
    const viewHL = 2 * dist * tanHalf, viewWL = viewHL * aspect;
    const az = S.camAz, el2 = S.camEl;
    right.set(Math.cos(az), 0, -Math.sin(az));
    lookT.set(rig.position.x, rig.position.y * 0.55 + S.lookY * (1 - f), 0);
    if (narrow) lookT.y += -0.08 * viewHL * f;
    else { lookT.addScaledVector(right, -0.13 * viewWL * f); lookT.y += 0.12 * viewHL * f; }
    desired.set(Math.sin(az) * Math.cos(el2), Math.sin(el2), Math.cos(az) * Math.cos(el2)).multiplyScalar(dist).add(lookT);
    if (firstFrame) { camPos.copy(desired); camLook.copy(lookT); firstFrame = false; }
    camPos.lerp(desired, 1 - Math.exp(-dt * 4.2));
    camLook.lerp(lookT, 1 - Math.exp(-dt * 5.5));
    camera.position.copy(camPos);
    if (!paused) camera.position.add(v.set(Math.sin(time * 0.7) * 0.03, Math.sin(time * 0.53 + 1) * 0.025, 0));
    if (S.shake > 0.001) camera.position.add(v.set((Math.random() - 0.5) * 0.12 * S.shake, (Math.random() - 0.5) * 0.12 * S.shake, 0));
    camera.lookAt(camLook);
    camera.updateMatrixWorld();
    scene.fog.near = dist + 3; scene.fog.far = dist + 26;
    rig.updateMatrixWorld(true);

    // modules: docked in the device ↔ floating screens facing the camera
    right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
    camera.getWorldDirection(fwd);
    const dS = Math.max(2, camPos.distanceTo(camLook) - 1.4);
    const viewH = 2 * dS * tanHalf, viewW = viewH * aspect;
    const sF = narrow ? Math.min(viewW * 0.84 / 0.56, viewH * 0.3 / 0.38) : Math.min(viewW * 0.34 / 0.56, viewH * 0.56 / 0.38);
    pF.copy(camera.position).addScaledVector(fwd, dS);
    if (narrow) pF.addScaledVector(up, viewH * 0.2);
    else pF.addScaledVector(right, viewW * 0.22).addScaledVector(up, viewH * 0.1);
    eTilt.set(-lean.y * 0.06, -lean.x * 0.1, 0); qTilt.setFromEuler(eTilt);
    qF.copy(camera.quaternion).multiply(qTilt);
    modules.forEach((m, i) => {
      const val = S['mod' + i], slide = smooth(val / 0.4), b = smooth((val - 0.3) / 0.7);
      lp.set(m.userData.bx * (1 + 0.45 * e), 0.62 + 0.52 * e + 0.95 * slide, -0.07 - 0.12 * e);
      mLocal.compose(lp, qId, one);
      mDock.multiplyMatrices(device.matrixWorld, mLocal); mDock.decompose(pD, qD, sD);
      if (b > 0.0001) {
        m.position.lerpVectors(pD, pF, b); m.position.addScaledVector(up, Math.sin(b * Math.PI) * 0.45);
        if (!paused) m.position.addScaledVector(up, Math.sin(time * 1.3 + i) * 0.03 * b);
        m.quaternion.slerpQuaternions(qD, qF, b);
        m.scale.setScalar(lerp(sD.x, sF, b));
      } else { m.position.copy(pD); m.quaternion.copy(qD); m.scale.copy(sD); }
      m.userData.screen.material.color.setScalar(0.27 + 0.73 * b + 0.15 * S.rise * (1 - b));
      m.userData.glow.material.opacity = 0.5 * b;
      m.updateMatrixWorld(true);
    });

    const setIn = smooth(S.titleOut * 1.4);
    pillarMat.opacity = 0.26 * setIn; grid.material.opacity = 0.05 + 0.12 * setIn; dust.material.opacity = 0.2 + 0.35 * setIn;
    shadow.position.x = rig.position.x;
    shadow.material.opacity = S.rise * clamp(1 - (rig.position.y + 0.2) * 0.55, 0.25, 1);
    shadow.scale.setScalar(1 + e * 0.35 + rig.position.y * 0.2);
    if (!paused) dust.rotation.y = Math.sin(time * 0.05) * 0.02, dust.position.y = Math.sin(time * 0.2) * 0.08;

    // DOM sync
    titleEl.style.setProperty('--tw', (S.introW + 13 * S.titleOut).toFixed(1));
    flashEl.style.opacity = S.flash.toFixed(3);
    placeCallouts();

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // ---------- GSAP + scroll ----------
  let ctx = null, lenis = null, lenisTick = null, introTl = null;

  function startIntro() {
    introStarted = true;
    const gsap = gsapLib;
    ctx.add(() => {
      const letters = $$('.as-title .as-in');
      introTl = gsap.timeline({ delay: 0.1 });
      introTl.to(S, { rise: 1, duration: 2.8, ease: 'expo.out' }, 0)
        .fromTo(letters, { yPercent: 118 }, { yPercent: 0, duration: 1.7, stagger: 0.05, ease: 'expo.out' }, 0.2)
        .to(S, { introW: 112, duration: 2.6, ease: 'expo.out' }, 0.2)
        .to(S, { sweep: 1.6, duration: 1.9, ease: 'power2.inOut' }, 0.7)
        .fromTo($('.as-sweep'), { x: () => -0.35 * innerWidth, autoAlpha: 1 }, { x: () => innerWidth * 1.05, duration: 1.9, ease: 'power2.inOut' }, 0.7)
        .set($('.as-sweep'), { autoAlpha: 0 })
        .fromTo($$('.as-b-reveal .as-r'), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.14, ease: 'power3.out' }, 1.1)
        .fromTo(hintEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 2.2);
      el.classList.remove('as-pre');
      if (isPaused()) introTl.progress(1);
    });
  }

  function buildTimeline(gsap) {
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
      trigger: $('.as-track'), start: 'top top', end: 'bottom bottom', scrub: 1.1,
      onUpdate: self => setRail(self.progress),
    } });
    tl.to({}, { duration: 100 }, 0);
    const beatIn = (node, t, dur = 2.4) => {
      tl.fromTo(node, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, t);
      tl.fromTo(node.querySelectorAll('.as-in'), { yPercent: 118, '--w': 62 }, { yPercent: 0, '--w': 100, duration: dur, stagger: 0.05, ease: 'power3.out' }, t);
      const ups = node.querySelectorAll('.as-up');
      if (ups.length) tl.fromTo(ups, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.5, stagger: 0.25, ease: 'power2.out' }, t + 0.9);
    };
    const beatOut = (node, t, dur = 2) => {
      tl.to(node.querySelectorAll('.as-in'), { yPercent: -118, '--w': 125, duration: dur, stagger: 0.025, ease: 'power2.in' }, t);
      const ups = node.querySelectorAll('.as-up');
      if (ups.length) tl.to(ups, { y: -20, autoAlpha: 0, duration: 1.2, ease: 'power1.in' }, t);
      tl.to(node, { autoAlpha: 0, duration: 0.4 }, t + dur + 0.1);
    };
    const paint = (i, t, d = 4) => {
      const c = new THREE.Color(PALETTE[i]);
      tl.to(bg, { r: c.r, g: c.g, b: c.b, duration: d, ease: 'power1.inOut' }, t);
      const rc = RIMS[i] ? new THREE.Color(RIMS[i]) : PA;
      tl.to(rim.color, { r: rc.r, g: rc.g, b: rc.b, duration: d, ease: 'power1.inOut' }, t);
    };
    const drawCallout = (c, tIn, tOut) => {
      tl.fromTo(c, { draw: 0 }, { draw: 1, duration: 2, ease: 'power2.out' }, tIn);
      tl.to(c, { draw: 0, duration: 1.2, ease: 'power1.in' }, tOut);
    };

    // 1. Reveal → scroll away the title
    tl.to(S, { titleOut: 1, duration: 6, ease: 'power1.in' }, 1);
    tl.to(titleEl, { scale: 1.22, yPercent: -12, autoAlpha: 0, duration: 5.5, ease: 'power2.in' }, 2);
    tl.to($('.as-b-reveal'), { autoAlpha: 0, y: -40, duration: 3, ease: 'power1.in' }, 0.8);
    tl.to(S, { camDist: 7, camEl: 0.2, lookY: -0.32, duration: 8, ease: 'power1.inOut' }, 0);

    // 2. 360° turntable with spec callouts
    tl.to(S, { turn: TAU, duration: 18, ease: 'power1.inOut' }, 8);
    tl.to(S, { camEl: 0.04, duration: 9, ease: 'sine.inOut' }, 8).to(S, { camEl: 0.24, duration: 9, ease: 'sine.inOut' }, 17);
    beatIn($('.as-b-turn'), 8.5); beatOut($('.as-b-turn'), 23);
    // spec callouts arrive in pairs, timed to the angle at which their anchors face the camera
    callouts.filter(c => c.kind === 'spec').forEach((c, i) => {
      const pair = Math.floor(i / 2), tIn = 9 + pair * 5 + (i % 2) * 0.5;
      drawCallout(c, tIn, tIn + 3.6 - (i % 2) * 0.3);
    });
    tl.to(hintEl, { autoAlpha: 0, duration: 2 }, 22);

    // 3. Exploded view
    tl.to(S, { devYaw: -0.62, devPitch: 0.3, duration: 4, ease: 'power2.inOut' }, 26);
    tl.to(S, { camDist: 8.6, camAz: 0.25, camEl: 0.16, lookY: -0.4, duration: 6, ease: 'power2.inOut' }, 26.5);
    tl.to(S, { explode: 1, duration: 6, ease: 'power3.inOut' }, 28);
    tl.to(S, { pulse: 1, duration: 3 }, 29);
    beatIn($('.as-b-explode'), 28.5); beatOut($('.as-b-explode'), 38.6);
    callouts.filter(c => c.kind === 'part').forEach((c, i) => drawCallout(c, 32 + i * 0.55, 38.8 + i * 0.15));

    // 4. Chapters — travel, module slides out to become a floating screen
    projects.forEach((p, i) => {
      const ts = CH0 + i * CHL;
      tl.to(S, { travel: 10 * (i + 1), duration: 5, ease: 'power2.inOut' }, ts);
      tl.to(S, { lift: 0.55, duration: 2.5, ease: 'sine.out' }, ts).to(S, { lift: 0, duration: 2.5, ease: 'sine.in' }, ts + 2.5);
      tl.to(S, { travelSpin: (i + 1) * TAU, duration: 5, ease: 'power2.inOut' }, ts);
      tl.to(S, { camAz: [-0.35, 0.3, -0.22][i], camEl: [0.12, 0.2, 0.08][i], camDist: 7.8, duration: 5, ease: 'power2.inOut' }, ts);
      if (i === 0) tl.to(S, { explode: 0.28, devYaw: 0.32, devPitch: 0.08, pulse: 0.45, duration: 5, ease: 'power2.inOut' }, ts);
      paint(i + 1, ts + 0.5);
      const c0 = ts + 4.5;
      tl.to(S, { ['mod' + i]: 1, duration: 3.2, ease: 'power3.inOut' }, c0);
      tl.to(S, { focus: 1, duration: 3, ease: 'power2.inOut' }, c0 - 0.5);
      const chap = $(`.as-chap[data-i="${i}"]`), num = $(`.as-num[data-i="${i}"]`);
      beatIn(chap, c0 + 0.8, 2.2);
      tl.fromTo(num, { autoAlpha: 0, xPercent: -14, '--w': 62 }, { autoAlpha: 1, xPercent: 0, '--w': 125, duration: 3, ease: 'power3.out' }, c0 + 0.5);
      tl.to(num, { autoAlpha: 0, xPercent: 10, duration: 2, ease: 'power1.in' }, ts + 9.6);
      beatOut(chap, ts + 9.3, 1.6);
      tl.to(S, { ['mod' + i]: 0, duration: 2.3, ease: 'power3.inOut' }, ts + 9.6);
      tl.to(S, { focus: 0, duration: 2.2, ease: 'power2.inOut' }, ts + 9.8);
    });

    // 5. Reassembly snap + flash, final hero shot
    const r0 = CH0 + projects.length * CHL; // 77
    tl.to(S, { travel: 10 * projects.length + 8, duration: 4, ease: 'power2.inOut' }, r0);
    tl.to(S, { travelSpin: (projects.length + 1) * TAU, duration: 4, ease: 'power2.inOut' }, r0);
    tl.to(S, { devYaw: 0, devPitch: 0.12, camAz: 0, camEl: 0.14, camDist: 7.4, lookY: -0.1, duration: 5, ease: 'power2.inOut' }, r0);
    paint(4, r0 + 0.5);
    tl.to(S, { explode: 0.9, pulse: 1, duration: 3, ease: 'power2.out' }, r0 + 1);
    tl.to(S, { explode: 0, duration: 1.2, ease: 'expo.in' }, r0 + 4.2);
    const snap = r0 + 5.4;
    tl.to(S, { flash: 1, duration: 0.25 }, snap - 0.1).to(S, { flash: 0, duration: 2.4, ease: 'power2.out' }, snap + 0.15);
    tl.to(S, { shake: 1, duration: 0.15 }, snap - 0.05).to(S, { shake: 0, duration: 1.6, ease: 'power2.out' }, snap + 0.1);
    tl.to(S, { pulse: 0.3, duration: 2.5 }, snap + 0.3);
    beatIn($('.as-b-snap'), r0 + 1.2, 2); beatOut($('.as-b-snap'), snap + 0.4, 1.6);
    tl.to(S, { idle: 1, duration: 4 }, snap + 1);
    tl.to(S, { camDist: 7.6, camEl: 0.1, lookY: -0.62, duration: 5, ease: 'power2.inOut' }, snap + 1.5);
    tl.to(S, { camDist: 7, duration: 8, ease: 'power1.inOut' }, snap + 6.5);
    beatIn($('.as-b-final'), snap + 2.4, 2.6);
    const endWord = $('.as-endword');
    tl.fromTo(endWord, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, snap + 2);
    tl.fromTo(endWord.querySelectorAll('.as-in'), { yPercent: 118, '--w': 62 }, { yPercent: 0, '--w': 125, duration: 4, stagger: 0.12, ease: 'power3.out' }, snap + 2);
    return tl;
  }

  function setRail(p) {
    railFill.style.transform = `scaleY(${p.toFixed(4)})`;
    let a = 0; RAIL.forEach((r, i) => { if (p >= r.at - 0.02) a = i; });
    if (a !== railActive) { railBtns.forEach((b, i) => { b.classList.toggle('is-on', i === a); b.setAttribute('aria-current', i === a ? 'step' : 'false'); }); railActive = a; }
  }
  setRail(0);
  railBtns.forEach((b, i) => on(b, 'click', () => {
    const trackEl = $('.as-track');
    const top = trackEl.getBoundingClientRect().top + scrollY;
    const y = top + RAIL[i].at * (trackEl.offsetHeight - innerHeight) + 2;
    if (lenis) lenis.scrollTo(y, { duration: 2.2 }); else window.scrollTo({ top: y, behavior: 'smooth' });
  }));

  Promise.all([import(LIBS.gsap), import(LIBS.st), import(LIBS.lenis)]).then(([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
    if (disposed) return;
    gsap.registerPlugin(ScrollTrigger);
    gsapLib = gsap;
    ctx = gsap.context(() => { buildTimeline(gsap); });
    try {
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on('scroll', ScrollTrigger.update);
      lenisTick = t => lenis.raf(t * 1000);
      gsap.ticker.add(lenisTick);
      gsap.ticker.lagSmoothing(0);
    } catch { lenis = null; }
    ScrollTrigger.refresh();
  }).catch(err => {
    if (disposed) return;
    console.warn('Assembly Study: motion libraries unavailable, showing static layout.', err);
    teardown3D();
    showStatic();
  });

  function teardown3D() {
    if (torn) return; torn = true;
    cancelAnimationFrame(raf);
    const mats = new Set(), geos = new Set();
    scene.traverse(o => {
      if (o.geometry) geos.add(o.geometry);
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
    });
    geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose());
    textures.forEach(t => t.dispose());
    envRT.dispose(); pmrem.dispose(); room.dispose?.();
    renderer.dispose(); renderer.forceContextLoss();
  }

  return function dispose() {
    disposed = true;
    ac.abort();
    try { introTl?.kill(); ctx?.revert(); } catch { /* noop */ }
    if (lenisTick && gsapLib) gsapLib.ticker.remove(lenisTick);
    try { lenis?.destroy(); } catch { /* noop */ }
    teardown3D();
    root.innerHTML = '';
  };
}
