// Developer OS — world `workspace`.
// "Live Coding": scroll drives a developer writing the three portfolio projects
// live in a cinematic 3D IDE. Editor → terminal → browser (Cmd+Tab style),
// each project ends with RUN; the finale pushes to main and ships.
// One pinned, scrubbed ScrollTrigger + one ticker. DOM + one 2D FX canvas.
import { projects, profileURL } from '../content.js?v=ten-worlds-1';

const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs',
};
const ART = { vrm: 'art/vrm.jpg', pixelle: 'art/glass.jpg', motion: 'art/orbit.jpg' };
const PIN_SCREENS = 10.5;
const P0 = .06, LEN = .265, FIN = P0 + LEN * 3; // project k spans [P0+k*LEN, P0+(k+1)*LEN]
// local beats inside one project (fractions of LEN)
const U = { typeS: .04, typeE: .56, toTermE: .62, termE: .80, toBrowE: .85, fullE: .90 };

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const e3 = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const bump = t => (t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t));
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ================================================================== source files
   Markers:  «word:alt1,alt2»   → autocomplete (2 chars typed, popup, accept)
             ⟨typo|fix|message⟩ → error squiggle + diagnostic, then fixed      */
const FILES = [
  {
    id: 'vrm', lang: 'ts', langName: 'TypeScript', file: 'lipSync.ts', dir: ['src', 'avatar'],
    repo: 'web-virtual-human-studio', branch: 'feat/lip-sync', symbol: 'createLipSync',
    url: 'localhost:4173', errCode: 'ts(2551)',
    src: `import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, type VRM } from '@pixiv/three-vrm';

// 목소리 크기로 입을 움직이는 립싱크
export async function loadAvatar(url: string): Promise<VRM> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const gltf = await loader.«loadAsync:load,parse,setPath»(url);
  const vrm: VRM = gltf.userData.vrm;
  vrm.scene.rotation.y = Math.PI;
  return vrm;
}

export function createLipSync(vrm: VRM, stream: MediaStream) {
  const audio = new AudioContext();
  const analyser = audio.«createAnalyser:createGain,createBuffer,createOscillator»();
  analyser.fftSize = 1024;
  audio.createMediaStreamSource(stream).connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  let mouth = 0;

  return (dt: number) => {
    analyser.«getFloatTimeDomainData:getByteFrequencyData,getFloatFrequencyData,getByteTimeDomainData»(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    const rms = Math.sqrt(sum / buf.length);
    mouth = THREE.MathUtils.damp(mouth, Math.min(1, rms * 9), 18, dt);
    vrm.⟨expresionManager|expressionManager|Property 'expresionManager' does not exist on type 'VRM'. Did you mean 'expressionManager'?⟩?.setValue('aa', mouth);
    vrm.update(dt);
  };
}`,
    term: [
      { k: 'cmd', t: 'npm run build' },
      { k: 'out', t: '> vhs@1.4.0 build', c: 'dim' },
      { k: 'out', t: '> tsc --noEmit && vite build', c: 'dim' },
      { k: 'out', t: 'vite v5.4.2 building for production...', c: 'acc' },
      { k: 'spin', t: 'transforming modules', done: '✓ 214 modules transformed.' },
      { k: 'bar', t: 'rendering chunks' },
      { k: 'out', t: 'dist/index.html                  0.62 kB │ gzip:   0.38 kB', c: 'dim' },
      { k: 'out', t: 'dist/assets/three-vrm-9c1e.js  498.12 kB │ gzip: 121.40 kB', c: 'dim' },
      { k: 'out', t: 'dist/assets/index-4f1c2a.js    114.28 kB │ gzip:  36.71 kB', c: 'dim' },
      { k: 'out', t: '✓ built in 2.84s', c: 'ok' },
      { k: 'cmd', t: 'git commit -am "feat: volume-based lip-sync (Web Audio)"', commit: '3e1a9c2 feat: volume-based lip-sync' },
      { k: 'out', t: '[feat/lip-sync 3e1a9c2] feat: volume-based lip-sync (Web Audio)', c: 'txt' },
      { k: 'out', t: ' 1 file changed, 34 insertions(+)', c: 'ok' },
      { k: 'cmd', t: 'npm run preview' },
      { k: 'out', t: '  ➜  Local:   http://localhost:4173/', c: 'acc' },
    ],
  },
  {
    id: 'pixelle', lang: 'py', langName: 'Python', file: 'main.py', dir: ['bridge'],
    repo: 'web-virtual-human-studio', branch: 'feat/bridge-jobs', symbol: 'create_job',
    url: '127.0.0.1:8787/studio', errCode: 'Pylance',
    src: `from fastapi import FastAPI, Form, HTTPException, UploadFile
from pydantic import BaseModel
import httpx, uuid

app = FastAPI(title="vhs-bridge")
PIXELLE = "http://127.0.0.1:8000/api/digital-human"
jobs: dict[str, dict] = {}


class Job(BaseModel):
    id: str
    status: str = "queued"
    progress: float = 0.0
    video_url: str | None = None


@app.post("/jobs", status_code=202)
async def create_job(image: UploadFile, script: str = Form(...),
                     voice: str = Form("ko-KR-SunHiNeural")) -> Job:
    job = Job(id=uuid.uuid4().hex[:8])
    jobs[job.id] = job.«model_dump:model_copy,model_dump_json,model_validate»()
    async with httpx.«AsyncClient:AsyncHTTPTransport,Client,Response»(timeout=30) as client:
        res = await client.post(PIXELLE, data={"script": script, "voice": voice},
                                files={"image": await image.read()})
    res.«raise_for_status:read,json,is_success»()
    jobs[job.id]["task"] = res.json()["task_id"]
    return job


@app.get("/jobs/{job_id}")
async def get_job(job_id: str) -> Job:
    if job_id not in jobs:
        raise ⟨HTTPExeption|HTTPException|"HTTPExeption" is not defined (reportUndefinedVariable)⟩(404, "job not found")
    return Job(**jobs[job_id])


@app.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    jobs.pop(job_id, None)
    return {"cancelled": job_id}`,
    term: [
      { k: 'cmd', t: 'pytest -q bridge/tests' },
      { k: 'dots', n: 24 },
      { k: 'out', t: '24 passed in 1.38s', c: 'ok' },
      { k: 'cmd', t: 'git commit -am "feat(bridge): Pixelle-Video job endpoints"', commit: 'a91f04d feat(bridge): job endpoints' },
      { k: 'out', t: '[feat/bridge-jobs a91f04d] feat(bridge): Pixelle-Video job endpoints', c: 'txt' },
      { k: 'cmd', t: 'uvicorn bridge.main:app --port 8787' },
      { k: 'out', t: 'INFO:     Started server process [4182]', c: 'dim' },
      { k: 'spin', t: 'Waiting for application startup', done: 'INFO:     Application startup complete.' },
      { k: 'out', t: 'INFO:     Uvicorn running on http://127.0.0.1:8787', c: 'acc' },
      { k: 'cmd', t: 'curl -s -X POST :8787/jobs -F image=@avatar.png -F script=안녕하세요' },
      { k: 'out', t: '{"id":"8f2a91c4","status":"queued","progress":0.0,"video_url":null}', c: 'str' },
    ],
  },
  {
    id: 'motion', lang: 'js', langName: 'JavaScript', file: 'router.js', dir: ['docs', 'worlds'],
    repo: 'metasongi-motion-portfolio', branch: 'feat/worlds', symbol: 'mount',
    url: 'localhost:5531/?world=workspace', errCode: 'ts(2551)',
    multi: /\b(ctx|lenis)(?=\.(revert|destroy)\(\))|\brenderer(?=\.dispose\(\))/g,
    src: `// 세계 전환: 이전 세계를 완전히 정리한 뒤 새 세계를 마운트
const worlds = {
  space: () => import('./flight.js'),
  workspace: () => import('./coding.js'),
  noir: () => import('./editsuite.js'),
};
let dispose = () => {};

export async function switchWorld(name, root) {
  dispose();
  document.body.dataset.world = name;
  root.«replaceChildren:replaceWith,removeChild,remove»();
  const { mount } = await worlds[name]();
  dispose = mount(root, { isPaused: () => paused });
}

export function mount(root, { isPaused }) {
  const ac = new «AbortController:AbortSignal,AnimationEvent,ArrayBuffer»();
  const ctx = gsap.context(() => buildTimeline(root, isPaused));
  const lenis = new Lenis({ lerp: 0.1 });
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  addEventListener('resize', onResize, { signal: ac.signal });

  return () => {
    ac.⟨abrot|abort|Property 'abrot' does not exist on type 'AbortController'. Did you mean 'abort'?⟩();
    ctx.revert();
    lenis.destroy();
    renderer.dispose();
    renderer.«forceContextLoss:forceContextRestore,getContext,dispose»();
    root.innerHTML = '';
  };
}`,
    term: [
      { k: 'cmd', t: 'node --check worlds/*.mjs && npm run lint' },
      { k: 'out', t: '✓ 0 problems (0 errors, 0 warnings)', c: 'ok' },
      { k: 'spin', t: 'auditing dispose() across 10 worlds', done: '✓ 10/10 worlds clean up — rAF · listeners · WebGL · Lenis' },
      { k: 'cmd', t: 'git commit -am "feat: mount/dispose contract for ten worlds"', commit: 'f3a8d12 feat: mount/dispose contract' },
      { k: 'out', t: '[feat/worlds f3a8d12] feat: mount/dispose contract for ten worlds', c: 'txt' },
      { k: 'cmd', t: 'npx serve docs -l 5531' },
      { k: 'out', t: '   ┌──────────────────────────────────────┐', c: 'acc' },
      { k: 'out', t: '   │  Serving!   http://localhost:5531    │', c: 'acc' },
      { k: 'out', t: '   └──────────────────────────────────────┘', c: 'acc' },
    ],
  },
];
const FINALE_TERM = [
  { k: 'cmd', t: 'git checkout main && git merge --no-ff feat/worlds' },
  { k: 'out', t: "Merge made by the 'ort' strategy.", c: 'dim' },
  { k: 'cmd', t: 'git push origin main', commit: 'b7d20e5 merge: ten worlds → main' },
  { k: 'out', t: 'Enumerating objects: 128, done.', c: 'dim' },
  { k: 'out', t: 'Counting objects: 100% (128/128), done.', c: 'dim' },
  { k: 'out', t: 'Delta compression using up to 8 threads', c: 'dim' },
  { k: 'bar', t: 'Writing objects' },
  { k: 'out', t: 'To github.com:MetaSonGi/metasongi-motion-portfolio.git', c: 'txt' },
  { k: 'out', t: '   9c41e07..b7d20e5  main -> main', c: 'ok' },
  { k: 'spin', t: 'Deploying to GitHub Pages', done: '✓ Deployed — pages build and deployment' },
  { k: 'out', t: '★ Shipped.', c: 'acc' },
];
const TREE = [
  [0, 'dir', 'docs'], [1, 'dir', 'worlds'], [2, 'file', 'router.js', 'motion', 'js'], [2, 'file', 'coding.js', null, 'js'],
  [0, 'dir', 'bridge'], [1, 'file', 'main.py', 'pixelle', 'py'], [1, 'file', 'test_jobs.py', null, 'py'],
  [0, 'dir', 'src'], [1, 'dir', 'avatar'], [2, 'file', 'lipSync.ts', 'vrm', 'ts'], [2, 'file', 'camera.ts', null, 'ts'],
  [1, 'file', 'main.ts', null, 'ts'], [0, 'file', 'package.json', null, 'json'], [0, 'file', 'README.md', null, 'md'],
];

/* ================================================================== tokenizer */
const KW = {
  js: new Set('const let var function return async await import from export new if else for of in while do class extends type interface as typeof instanceof true false null undefined this try catch finally throw default switch case break continue void delete yield static readonly'.split(' ')),
  py: new Set('from import def async await return class if elif else not and or in is raise with as for while None True False pass lambda try except finally yield global del assert break continue'.split(' ')),
};
const BUILTIN = {
  js: new Set('Math Promise Object Array JSON document window console Number String Set Map addEventListener string number boolean'.split(' ')),
  py: new Set('dict str float int list print len self bool'.split(' ')),
};
function tokenize(src, lang) {
  const py = lang === 'py', kw = py ? KW.py : KW.js, bi = py ? BUILTIN.py : BUILTIN.js;
  const out = []; let i = 0, prev = ''; const L = src.length;
  const nextCh = j => { while (j < L && src[j] === ' ') j++; return src[j]; };
  while (i < L) {
    const c = src[i], s = i; let t;
    if (c === ' ' || c === '\n' || c === '\t') { while (i < L && (src[i] === ' ' || src[i] === '\n' || src[i] === '\t')) i++; out.push(['', src.slice(s, i)]); continue; }
    if ((!py && c === '/' && src[i + 1] === '/') || (py && c === '#')) { while (i < L && src[i] !== '\n') i++; t = 'c'; }
    else if (c === '"' || c === "'" || c === '`') { i++; while (i < L && src[i] !== c && src[i] !== '\n') { if (src[i] === '\\') i++; i++; } if (src[i] === c) i++; t = 's'; }
    else if (/[0-9]/.test(c)) { i++; while (i < L && /[0-9a-fA-FxX._]/.test(src[i])) i++; t = 'n'; }
    else if (py && c === '@') { i++; while (i < L && /[\w.]/.test(src[i])) i++; t = 'd'; }
    else if (/[A-Za-z_$]/.test(c)) {
      while (i < L && /[\w$]/.test(src[i])) i++;
      const w = src.slice(s, i), call = nextCh(i) === '(';
      if (kw.has(w)) t = 'k';
      else if (prev === '.') t = call ? 'f' : 'pr';
      else if (call && !/^[A-Z]/.test(w)) t = 'f';
      else if (bi.has(w)) t = 'b';
      else if (/^[A-Z]/.test(w)) t = 'ty';
      else t = 'v';
    } else { i++; t = /[=+\-*/<>!&|?:%^~]/.test(c) ? 'o' : 'p'; }
    const text = src.slice(s, i); out.push([t, text]); prev = text;
  }
  return out;
}
const CARET = '<i class="lc-caret"></i>', CARET_M = '<i class="lc-caret lc-caret--m"></i>';
// Paint text into highlighted HTML. carets: positions → caret markup. err: [a,b) squiggle.
function paint(text, lang, carets = [], err = null, multi = false) {
  const cls = new Array(text.length); let p = 0;
  for (const [t, s] of tokenize(text, lang)) for (let j = 0; j < s.length; j++) cls[p++] = t;
  const cs = new Map(); carets.forEach((c, i) => cs.set(c, multi && i > 0 ? CARET_M : CARET));
  let html = '', run = '', rc = '';
  const flush = () => { if (run) { html += rc ? `<span class="${rc}">${esc(run)}</span>` : esc(run); run = ''; } };
  for (let i = 0; i <= text.length; i++) {
    if (cs.has(i)) { flush(); html += cs.get(i); }
    if (i === text.length) break;
    let c = cls[i] ? 'lc-' + cls[i] : '';
    if (err && i >= err[0] && i < err[1]) c += ' lc-err';
    if (c !== rc) { flush(); rc = c; }
    run += text[i];
  }
  flush();
  return html;
}

/* ================================================================== typing script */
function compile(f, seed) {
  const R = rng(seed), src = f.src, steps = [];
  const typeCh = (ch, prevCh, atIndent) => {
    let cost = .85 + R() * .55;
    if (ch === ' ') cost = atIndent ? .04 : .5;
    else if (ch === '\n') cost = 2.4 + R() * 1.6;
    else if (/[;{}:,]/.test(prevCh)) cost += .7;
    else if (/[A-Z(.'"]/.test(ch)) cost += .25;
    if (R() < .04) cost += 2.2; // a thinking pause
    steps.push({ k: 'i', ch, cost });
  };
  let i = 0, prevCh = '\n', indent = true;
  while (i < src.length) {
    const c = src[i];
    if (c === '«') {
      const j = src.indexOf('»', i), [word, alts] = src.slice(i + 1, j).split(':');
      typeCh(word[0], prevCh, false); typeCh(word[1], word[0], false);
      steps.push({ k: 'ins', s: word.slice(2), cost: 34, ac: { word, alts: alts.split(',') } });
      prevCh = word[word.length - 1]; indent = false; i = j + 1; continue;
    }
    if (c === '⟨') {
      const j = src.indexOf('⟩', i), [typo, fix, msg] = src.slice(i + 1, j).split('|');
      let cp = 0; while (cp < typo.length && typo[cp] === fix[cp]) cp++;
      const errStart = steps.length;
      let pc = prevCh; for (const ch of typo) { typeCh(ch, pc, false); pc = ch; }
      const id = steps.length;
      steps.push({ k: 'err', cost: 95, msg, len: typo.length });
      for (let b = 0; b < typo.length - cp; b++) steps.push({ k: 'b', cost: .55, errOf: id });
      for (const ch of fix.slice(cp)) { steps.push({ k: 'i', ch, cost: .9, errOf: id }); }
      steps[id].start = errStart; steps[id].cp = cp;
      prevCh = fix[fix.length - 1]; indent = false; i = j + 1; continue;
    }
    typeCh(c, prevCh, indent && c === ' ');
    if (c === '\n') indent = true; else if (c !== ' ') indent = false;
    prevCh = c; i++;
  }
  if (f.multi) {
    const text = replay(steps, steps.length).text, pos = [];
    f.multi.lastIndex = 0; let m;
    while ((m = f.multi.exec(text))) pos.push(m.index + m[0].length);
    steps.push({ k: 'mc', cost: 50, pos });
    steps.push({ k: 'mi', cost: 8, pos, ch: '?' });
    steps.push({ k: 'mhold', cost: 30, pos });
  }
  steps.push({ k: 'save', cost: 14 });
  const ends = []; let acc = 0; for (const s of steps) { acc += s.cost; ends.push(acc); }
  return { steps, ends, total: acc };
}
function replay(steps, n) {
  let text = ''; const mod = new Set();
  for (let i = 0; i < n && i < steps.length; i++) {
    const s = steps[i];
    if (s.k === 'i') text += s.ch;
    else if (s.k === 'ins') text += s.s;
    else if (s.k === 'b') text = text.slice(0, -1);
    else if (s.k === 'mi') {
      for (let j = s.pos.length - 1; j >= 0; j--) text = text.slice(0, s.pos[j]) + s.ch + text.slice(s.pos[j]);
      s.pos.forEach((p, j) => mod.add(text.slice(0, p + j).split('\n').length - 1));
    }
    if (s.errOf != null) mod.add(text.split('\n').length - 1); // line touched by an error fix
  }
  return { text, mod };
}
function stepsAt(sc, u) { // number of steps fully applied at fraction u
  const target = u * sc.total; let lo = 0, hi = sc.ends.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sc.ends[mid] <= target) lo = mid + 1; else hi = mid; }
  return lo;
}

/* ================================================================== terminal */
const SPIN = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
function termCost(e) {
  if (e.k === 'cmd') return e.t.length * .45 + 3;
  if (e.k === 'out') return 1.1;
  if (e.k === 'spin') return 7;
  if (e.k === 'bar') return 9;
  if (e.k === 'dots') return e.n * .3 + 1.5;
  return 1;
}
function prepTerm(list) { let acc = 0; list.forEach(e => { e.s0 = acc; e.cost = termCost(e); acc += e.cost; }); return acc; }
function promptHTML(f) {
  return `<span class="lc-t-pr">➜</span> <span class="lc-t-dir">${esc(f.repo)}</span> <span class="lc-t-br">git:(<em>${esc(f.branch)}</em>)</span> `;
}
function cmdHTML(t) {
  const sp = t.indexOf(' '); const head = sp < 0 ? t : t.slice(0, sp), rest = sp < 0 ? '' : t.slice(sp);
  return `<span class="lc-t-cmd">${esc(head)}</span>${esc(rest).replace(/(&quot;[^&]*(?:&quot;|$))/g, '<span class="lc-t-str">$1</span>').replace(/(\s)(--?[\w-]+)/g, '$1<span class="lc-t-flag">$2</span>')}`;
}
function termHTML(f, list, total, c, clock, paused) {
  let html = `<span class="lc-t-dim">Last login: Fri Nov 20 09:41 on ttys003</span>\n`;
  let fin = true;
  for (const e of list) {
    if (c < e.s0) { fin = false; break; }
    const pr = clamp((c - e.s0) / e.cost), done = pr >= 1;
    if (e.k === 'cmd') {
      const n = Math.min(e.t.length, Math.floor((c - e.s0) / .45));
      html += promptHTML(f) + cmdHTML(e.t.slice(0, n)) + (done ? '' : '<i class="lc-tcaret"></i>') + '\n';
      if (!done) { fin = false; break; }
    } else if (e.k === 'out') html += `<span class="lc-t-${e.c || 'txt'}">${esc(e.t)}</span>\n`;
    else if (e.k === 'spin') {
      html += done ? `<span class="lc-t-ok">${esc(e.done)}</span>\n`
        : `<span class="lc-t-acc">${SPIN[paused ? 0 : Math.floor(clock * 12) % SPIN.length]}</span> ${esc(e.t)}<span class="lc-t-dim">${'.'.repeat(1 + Math.floor(clock * 3) % 3)}</span>\n`;
      if (!done) { fin = false; break; }
    } else if (e.k === 'bar') {
      const w = 24, k = Math.round(pr * w);
      html += `${esc(e.t)} <span class="lc-t-acc">${'█'.repeat(k)}</span><span class="lc-t-dim">${'░'.repeat(w - k)}</span> ${String(Math.round(pr * 100)).padStart(3)}%${done ? ' <span class="lc-t-ok">done</span>' : ''}\n`;
      if (!done) { fin = false; break; }
    } else if (e.k === 'dots') {
      const k = Math.floor(pr * e.n);
      html += `<span class="lc-t-ok">${'.'.repeat(k)}</span>${done ? `<span class="lc-t-dim">${' '.repeat(Math.max(1, 34 - e.n))}[100%]</span>` : '<i class="lc-tcaret"></i>'}\n`;
      if (!done) { fin = false; break; }
    }
  }
  if (fin && c >= total) html += promptHTML(f) + '<i class="lc-tcaret lc-tcaret--blink"></i>';
  return `<div class="lc-tin">${html}</div>`;
}

/* ================================================================== markup */
const ICON = { ts: 'TS', js: 'JS', py: 'PY', json: '{}', md: 'M↓' };
function treeHTML() {
  return TREE.map(([d, kind, name, pid, lang]) => kind === 'dir'
    ? `<li style="--d:${d}" class="lc-tdir"><i>▾</i>${esc(name)}</li>`
    : `<li style="--d:${d}" class="lc-tfile${pid ? ' is-proj' : ''}" ${pid ? `data-pid="${pid}"` : ''}><b class="lc-ic lc-ic--${lang}">${ICON[lang]}</b>${esc(name)}${pid ? '<em class="lc-gitst">U</em>' : ''}</li>`).join('');
}
function overlayHTML(id) {
  if (id === 'vrm') return `<div class="lc-ov lc-ov--vrm"><span class="lc-ovpill"><b class="lc-recdot"></b>REC 00:12</span>
    <div class="lc-ovmeter">${Array.from({ length: 16 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}<span>MIC · RMS → mouth 'aa'</span></div>
    <div class="lc-ovside"><span>표정</span><span>카메라</span><span class="is-on">립싱크</span><span>녹화</span></div></div>`;
  if (id === 'pixelle') return `<div class="lc-ov lc-ov--px"><div class="lc-ovjob"><small>JOB 8f2a91c4 · Pixelle-Video</small><b>rendering digital human</b><div class="lc-ovbar"><i></i></div>
    <div class="lc-ovsteps"><span class="is-done">queued</span><span class="is-done">uploaded</span><span class="is-on">rendering</span><span>mp4</span></div></div></div>`;
  return `<div class="lc-ov lc-ov--mo"><div class="lc-ovworlds">${Array.from({ length: 10 }, (_, i) => `<i class="${i === 2 ? 'is-on' : ''}">${String(i + 1).padStart(2, '0')}</i>`).join('')}</div><span class="lc-ovpill">mount() → dispose() · 0 leaks</span></div>`;
}
function cardHTML(p, i) {
  return `<article class="lc-card" data-i="${i}">
    <header><span class="lc-card-n">0${i + 1} / 03</span><span class="lc-card-cat">${esc(p.category)}</span></header>
    <h3>${esc(p.name)}</h3>
    <p class="lc-card-desc">${esc(p.description)}</p>
    <p class="lc-card-body">${esc(p.body)}</p>
    <ul class="lc-stack">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    <a class="lc-btn" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">프로젝트 보기 ↗</a>
  </article>`;
}
function liveHTML(mob) {
  const graph = commitGraphSVG();
  return `<div class="lc-root" data-no-kx>
  <div class="lc-sr"><h1>MetaSonGi — Developer OS: Live Coding</h1><p>스크롤하면 개발자가 세 개의 프로젝트를 실시간으로 코딩하고 실행합니다.</p>
    <ul>${projects.map(p => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)} — ${esc(p.description)}</a></li>`).join('')}</ul></div>
  <section class="lc-stage" aria-label="라이브 코딩 시퀀스">
    <div class="lc-bg"><i class="lc-glow lc-glow--a"></i><i class="lc-glow lc-glow--b"></i><i class="lc-grid"></i></div>
    <div class="lc-scene"><div class="lc-rig">
      <div class="lc-win lc-term" aria-hidden="true">
        <div class="lc-bar"><span class="lc-dots"><i></i><i></i><i></i></span><span class="lc-wtitle">zsh — <b class="lc-term-title"></b></span><span class="lc-wmeta">⌥⌘T</span></div>
        <pre class="lc-tbody"></pre>
      </div>
      <div class="lc-win lc-brow" aria-hidden="true">
        <div class="lc-bbar"><span class="lc-dots"><i></i><i></i><i></i></span><span class="lc-nav">‹ › ↻</span>
          <span class="lc-url"><b>⌂</b><span class="lc-urltext"></span><i class="lc-urlcaret"></i></span><span class="lc-wmeta">⌘R</span></div>
        <div class="lc-load"><i></i></div>
        <div class="lc-view">
          <div class="lc-blank"><b>⌘</b><span>New Tab</span></div>
          <div class="lc-shot"><img class="lc-img" alt="" draggable="false"><img class="lc-gl lc-gl--r" alt="" draggable="false"><img class="lc-gl lc-gl--c" alt="" draggable="false"></div>
          ${projects.map(p => overlayHTML(p.id)).join('')}
          <pre class="lc-boot-log"></pre>
          <i class="lc-scan"></i>
        </div>
      </div>
      <div class="lc-win lc-ide" aria-hidden="true">
        <div class="lc-bar lc-ide-bar"><span class="lc-dots"><i></i><i></i><i></i></span><span class="lc-wtitle lc-ide-title"></span><span class="lc-wmeta lc-live">● Live Share · <b>2</b></span></div>
        <div class="lc-ide-body">
          <nav class="lc-act"><i class="is-on">⧉</i><i>⌕</i><i class="lc-act-git">⑂<b class="lc-gitbadge">0</b></i><i>▷</i><i>⊞</i></nav>
          <aside class="lc-side"><h4>EXPLORER</h4><p class="lc-repo"></p><ul class="lc-tree">${treeHTML()}</ul>
            <h4 class="lc-side-h2">TIMELINE</h4><p class="lc-side-commit"></p></aside>
          <div class="lc-main">
            <div class="lc-tabs">${FILES.map((f, i) => `<span class="lc-tab" data-i="${i}"><b class="lc-ic lc-ic--${f.lang}">${ICON[f.lang]}</b>${esc(f.file)}<em class="lc-dirty">●</em></span>`).join('')}</div>
            <div class="lc-crumbs"></div>
            <div class="lc-editor">
              <div class="lc-gutter"><pre class="lc-lines"></pre><div class="lc-diff"></div></div>
              <div class="lc-codewrap"><div class="lc-scroll"><div class="lc-curline"></div><pre class="lc-code"></pre>
                <div class="lc-ac" hidden></div><div class="lc-diag" hidden></div></div></div>
              <div class="lc-mini"><pre class="lc-mini-code"></pre><i class="lc-mini-view"></i></div>
            </div>
          </div>
        </div>
        <footer class="lc-status"><span class="lc-st-br"></span><span class="lc-st-sync">⟳ 0↓ 1↑</span><span class="lc-st-err">⊗ 0 ⚠ 0</span><span class="lc-st-sp"></span>
          <span class="lc-st-pos"></span><span class="lc-st-hide">Spaces: 2</span><span class="lc-st-hide">UTF-8</span><span class="lc-st-lang"></span><span class="lc-st-wpm"></span><span class="lc-st-save"></span></footer>
      </div>
    </div></div>
    <canvas class="lc-fx"></canvas>
    <div class="lc-switch" aria-hidden="true"><div class="lc-switch-in">
      <span data-app="ide"><b>{ }</b><small>Code</small></span><span data-app="term"><b>&gt;_</b><small>Terminal</small></span><span data-app="brow"><b>◎</b><small>Browser</small></span><span data-app="git"><b>⑂</b><small>GitHub</small></span>
    </div><p><kbd>⌘</kbd> + <kbd>⇥</kbd></p></div>
    <div class="lc-hero">
      <p class="lc-kick"><span>03 / BUILD</span> — DEVELOPER OS</p>
      <h2 class="lc-htitle"><span class="lc-hl">Watch me</span><span class="lc-hl"><em>build it.</em></span></h2>
      <p class="lc-hcopy">스크롤하면 코드가 한 글자씩 쓰여지고, 실행되고, 배포됩니다.<br><span>⌨ 키보드를 두드리면 함께 코딩할 수 있어요.</span></p>
      <p class="lc-hint">SCROLL TO TYPE <i>↓</i></p>
    </div>
    <div class="lc-cards">${projects.map(cardHTML).join('')}</div>
    <div class="lc-ship">
      <p class="lc-ship-k">DEPLOYED · main → GitHub Pages</p>
      <h2 class="lc-ship-t"><em>Shipped.</em></h2>
      <p class="lc-ship-stats"></p>
      <a class="lc-btn lc-btn--big" href="${esc(profileURL)}" target="_blank" rel="noopener noreferrer">GitHub에서 전체 코드 보기 ↗</a>
    </div>
    <div class="lc-hud">
      <div class="lc-hud-tl"><b class="lc-step"></b><span class="lc-substep"></span></div>
      <nav class="lc-rail" aria-label="장면 이동"></nav>
      <div class="lc-hud-bl"><div class="lc-keys">${'<span class="lc-key"><b></b></span>'.repeat(mob ? 4 : 6)}</div><p class="lc-wpm"><b>0</b> WPM · <span class="lc-kcount">0</span> keys</p></div>
      <div class="lc-hud-br"><p>⑂ COMMIT GRAPH</p>${graph}<p class="lc-lastc"></p></div>
    </div>
    <div class="lc-boot"><pre class="lc-boot-t"></pre></div>
  </section>
</div>`;
}
function commitGraphSVG() {
  // main lane y=40, feature lane y=14
  let s = `<svg class="lc-graph" viewBox="0 0 230 54" aria-hidden="true"><path class="lc-g-main" pathLength="1" d="M8 40 H222"/>`;
  for (let k = 0; k < 3; k++) {
    const x0 = 22 + k * 64, x1 = x0 + 16, x2 = x0 + 44;
    s += `<path class="lc-g-br" data-c="${k}" pathLength="1" d="M${x0} 40 C${x0 + 8} 40 ${x0 + 6} 14 ${x1} 14 H${x2 - 12} C${x2 - 4} 14 ${x2 - 6} 40 ${x2} 40"/>`;
    s += `<circle class="lc-g-n lc-g-f" data-c="${k}" cx="${x1 + 10}" cy="14" r="3.6"/>`;
    s += `<circle class="lc-g-n lc-g-m" data-m="${k}" cx="${x2}" cy="40" r="3.2"/>`;
  }
  s += `<circle class="lc-g-n lc-g-init is-on" cx="8" cy="40" r="3.2"/><circle class="lc-g-n lc-g-push" cx="222" cy="40" r="4.6"/></svg>`;
  return s;
}
function staticHTML(failed) {
  return `<div class="lc-root lc-static" data-no-kx>
  <header class="lc-s-head">
    <p class="lc-kick"><span>03 / BUILD</span> — DEVELOPER OS</p>
    <pre class="lc-s-who"><span class="lc-t-pr">&gt;</span> whoami\nMetaSonGi — creative developer</pre>
    <h1 class="lc-htitle"><span class="lc-hl">Watch me</span> <span class="lc-hl"><em>build it.</em></span></h1>
    <p class="lc-hcopy">세 개의 프로젝트를 코드로 읽는 정적 케이스 스터디.</p>
    ${failed ? '<p class="lc-s-note">모션 라이브러리를 불러오지 못해 정적인 버전으로 보여드립니다.</p>' : ''}
  </header>
  ${FILES.map((f, i) => {
    const p = projects[i], sc = compile(f, 11 + i), { text } = replay(sc.steps, sc.steps.length);
    const list = f.term, tot = prepTerm(list);
    return `<section class="lc-s-case">
      <div class="lc-s-code"><div class="lc-s-bar"><span class="lc-dots"><i></i><i></i><i></i></span><span>${esc([...f.dir, f.file].join(' / '))}</span><em>${f.langName}</em></div>
        <pre class="lc-code">${paint(text, f.lang)}</pre>
        <pre class="lc-tbody lc-s-term">${termHTML(f, list, tot, tot + 1, 0, true)}</pre></div>
      <div class="lc-s-run"><figure><img src="${ART[p.id]}" alt="${esc(p.name)} 실행 화면" loading="lazy"><figcaption>${esc(f.url)}</figcaption></figure>${cardHTML(p, i)}</div>
    </section>`;
  }).join('')}
  <footer class="lc-s-foot"><h2 class="lc-ship-t"><em>Shipped.</em></h2><p>git push origin main — ${[...new Set(projects.flatMap(p => p.stack))].map(esc).join(' · ')}</p>
    <a class="lc-btn lc-btn--big" href="${esc(profileURL)}" target="_blank" rel="noopener noreferrer">GitHub에서 전체 코드 보기 ↗</a></footer>
</div>`;
}

/* ================================================================== mount */
export function mount(root, { isPaused = () => false } = {}) {
  let disposed = false;
  const ac = new AbortController(), { signal } = ac;
  try { window.scrollTo(0, 0); } catch { /* noop */ }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.innerHTML = staticHTML(false);
    return () => { disposed = true; ac.abort(); root.innerHTML = ''; };
  }

  let mob = innerWidth < 760;
  const scripts = FILES.map((f, i) => compile(f, 11 + i));
  const termTotals = FILES.map(f => prepTerm(f.term));
  const finTotal = prepTerm(FINALE_TERM);
  root.innerHTML = liveHTML(mob);

  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const S = (el, k, v) => { if (el._s?.[k] !== v) { (el._s ??= {})[k] = v; k.startsWith('--') ? el.style.setProperty(k, v) : (el.style[k] = v); } };
  const show = (el, on) => S(el, 'visibility', on ? 'visible' : 'hidden');
  const stage = $('.lc-stage'), rig = $('.lc-rig');
  const ide = $('.lc-ide'), term = $('.lc-term'), brow = $('.lc-brow');
  const codeEl = $('.lc-code'), scrollEl = $('.lc-scroll'), linesEl = $('.lc-lines'), diffEl = $('.lc-diff'), curLine = $('.lc-curline');
  const miniCode = $('.lc-mini-code'), miniView = $('.lc-mini-view'), acEl = $('.lc-ac'), diagEl = $('.lc-diag');
  const tabs = $$('.lc-tab'), treeFiles = $$('.lc-tfile.is-proj'), crumbs = $('.lc-crumbs'), ideTitle = $('.lc-ide-title'), repoEl = $('.lc-repo');
  const stBr = $('.lc-st-br'), stErr = $('.lc-st-err'), stPos = $('.lc-st-pos'), stLang = $('.lc-st-lang'), stWpm = $('.lc-st-wpm'), stSave = $('.lc-st-save');
  const gitBadge = $('.lc-gitbadge'), sideCommit = $('.lc-side-commit'), liveEl = $('.lc-live');
  const tbody = $('.lc-tbody'), termTitle = $('.lc-term-title');
  const urlText = $('.lc-urltext'), urlCaret = $('.lc-urlcaret'), loadBar = $('.lc-load i'), view = $('.lc-view'), blank = $('.lc-blank');
  const shot = $('.lc-shot'), imgs = $$('.lc-shot img'), glR = $('.lc-gl--r'), glC = $('.lc-gl--c'), bootLog = $('.lc-boot-log'), ovs = $$('.lc-ov');
  const fx = $('.lc-fx'), g = fx.getContext('2d');
  const sw = $('.lc-switch'), swApps = $$('.lc-switch span');
  const hero = $('.lc-hero'), cards = $$('.lc-card'), ship = $('.lc-ship'), shipStats = $('.lc-ship-stats');
  const stepEl = $('.lc-step'), subEl = $('.lc-substep'), rail = $('.lc-rail'), keys = $$('.lc-key'), wpmEl = $('.lc-wpm b'), kcountEl = $('.lc-kcount');
  const gBr = $$('.lc-g-br'), gF = $$('.lc-g-f'), gM = $$('.lc-g-m'), gPush = $('.lc-g-push'), lastC = $('.lc-lastc');
  const boot = $('.lc-boot'), bootT = $('.lc-boot-t'), hud = $('.lc-hud');
  const hudTL = $('.lc-hud-tl'), hudBL = $('.lc-hud-bl'), hudBR = $('.lc-hud-br');

  // commit thresholds in global p
  const commitAt = FILES.map((f, k) => {
    const e = f.term.find(x => x.commit), tot = termTotals[k];
    return P0 + LEN * (k + U.toTermE + (U.termE - U.toTermE) * ((e.s0 + e.cost) / (tot / .92)));
  });
  const finE = FINALE_TERM.find(x => x.commit);
  const finBar = FINALE_TERM.find(x => x.k === 'bar');
  const pushAt = FIN + (1 - FIN) * (.08 + .58 * ((finBar.s0 + finBar.cost) / (finTotal / .95)));
  const mergeAt = FILES.map((_, k) => P0 + LEN * (k + U.fullE));

  // chapter rail
  const CHAPS = [
    { l: 'BOOT', go: 0 },
    ...FILES.map((f, k) => ({ l: `0${k + 1} ${f.file}`, go: P0 + LEN * (k + .3) })),
    { l: 'SHIP', go: 1 },
  ];
  rail.innerHTML = CHAPS.map((c, i) => `<button type="button" data-c="${i}"><i></i><span>${esc(c.l)}</span></button>`).join('');
  const railBtns = [...rail.children];

  // ---- layout
  let W = 0, H = 0, iw = 0, ih = 0, tw = 0, th = 0, dpr = 1, lh = 20;
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight; mob = W < 760;
    iw = mob ? W * .94 : Math.min(1180, W * .84); ih = mob ? Math.min(H * .6, 540) : Math.min(700, H * .7);
    tw = mob ? W * .94 : Math.min(860, W * .6); th = mob ? Math.min(H * .5, 420) : Math.min(480, H * .56);
    const size = (el, w, h) => Object.assign(el.style, { width: w + 'px', height: h + 'px', margin: `${-h / 2}px 0 0 ${-w / 2}px` });
    size(ide, iw, ih); size(term, tw, th); size(brow, W, H);
    dpr = Math.min(devicePixelRatio || 1, mob ? 1.5 : 2);
    fx.width = Math.round(W * dpr); fx.height = Math.round(H * dpr);
    lh = parseFloat(getComputedStyle(codeEl).lineHeight) || 20;
    edKey = ''; rainCols = null;
  }

  /* ---------------------------------------------------------------- poses */
  // [x, y, z, rx, ry, s, o]
  function poses(mode) {
    const X = mob ? .5 : 1, bs = Math.min(iw * .94 / W, ih * 1.02 / H), hide = mob ? 0 : 1;
    switch (mode) {
      case 'H': return { ide: [0, H * .36, -300, 28, 0, .86, .7], term: [W * .32 * X, H * .3, -600, 14, -20, .78, .3 * hide], brow: [-W * .33 * X, H * .12, -760, 8, 22, bs * .82, .26 * hide] };
      case 'E': return { ide: [0, 30, 0, 0, 0, 1, 1], term: [W * .3 * X, H * .24, -420, 0, -16, .82, .5 * hide], brow: [-W * .3 * X, H * .02, -620, 0, 18, bs * .85, .4 * hide] };
      case 'T': return { ide: [-W * .17 * X, 10, -380, 0, 14, .9, mob ? .22 : .5], term: [0, 34, 60, 0, 0, mob ? 1 : 1.08, 1], brow: [W * .32 * X, -H * .04, -620, 0, -18, bs * .85, .4 * hide] };
      case 'B': return { ide: [-W * .3 * X, 14, -560, 0, 20, .85, .32 * hide], term: [W * .3 * X, H * .2, -520, 0, -18, .8, .32 * hide], brow: [0, 30, 0, 0, 0, bs * 1.04, 1] };
      case 'F': return { ide: [-W * .2, 0, -1200, 0, 26, .8, 0], term: [W * .2, H * .1, -1200, 0, -26, .8, 0], brow: [0, mob ? 44 : 36, 0, 0, 0, mob ? .92 : .9, 1] };
      default: return { ide: [0, -H * .02, -900, 8, 0, .9, .16], term: [0, 34, 80, 0, 0, mob ? 1 : 1.16, 1], brow: [0, 0, -1300, 0, 0, bs, 0] }; // TF
    }
  }
  const KF = [[0, 'H'], [.05, 'E']];
  FILES.forEach((_, k) => {
    const s = P0 + k * LEN;
    if (k > 0) KF.push([s, 'F'], [s + LEN * U.typeS, 'E']);
    KF.push([s + LEN * U.typeE, 'E'], [s + LEN * U.toTermE, 'T'], [s + LEN * U.termE, 'T'], [s + LEN * U.toBrowE, 'B'], [s + LEN * U.fullE, 'F']);
  });
  KF.push([FIN, 'F'], [FIN + (1 - FIN) * .08, 'TF']);
  function blendPoses(p) {
    let i = 0; while (i < KF.length - 1 && KF[i + 1][0] <= p) i++;
    const a = KF[i], b = KF[Math.min(i + 1, KF.length - 1)];
    const t = b[0] > a[0] ? e3(clamp((p - a[0]) / (b[0] - a[0]))) : 0;
    const A = poses(a[1]), B = poses(b[1]), out = {};
    for (const k of ['ide', 'term', 'brow']) out[k] = A[k].map((v, j) => lerp(v, B[k][j], t));
    return { out, from: a[1], to: b[1], t };
  }
  const poseCSS = q => `translate3d(${r2(q[0])}px,${r2(q[1])}px,${r2(q[2])}px) rotateX(${r2(q[3])}deg) rotateY(${r2(q[4])}deg) scale(${q[5].toFixed(4)})`;

  /* ---------------------------------------------------------------- state */
  let target = 0, p = 0, clock = 0, last = performance.now();
  let introStarted = false, introT = 0, introWait = 0, introDone = false;
  let mxN = 0, myN = 0, tiltX = 0, tiltY = 0;
  let edKey = '', curFile = -1, lastN = [0, 0, 0], userText = '', userFile = -1, lastUserKey = -1e9, editorFocus = false;
  let wpmEvents = [], wpmDisp = 0, keyCount = 0, keyQueue = [], keyPressT = -1, scrollSY = 0;
  let termKey = '', curStep = '', shipped = false, curRail = -1, curUrl = '', curShotId = '';
  const parts = []; let rainCols = null;
  if (isPaused()) { introStarted = true; introT = 5; }

  // pointer tilt
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    mxN = clamp((e.clientX / innerWidth) * 2 - 1, -1, 1); myN = clamp((e.clientY / innerHeight) * 2 - 1, -1, 1);
  }, { signal, passive: true });
  document.addEventListener('pointerleave', () => { mxN = myN = 0; }, { signal });
  addEventListener('resize', () => layout(), { signal });
  stage.addEventListener('pointerdown', e => { editorFocus = !!e.target.closest('.lc-ide'); }, { signal });

  // user typing easter egg (Live Share "YOU" cursor) — never touches the scripted text
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || !introDone) return;
    if (document.querySelector('dialog[open]')) return;
    const tg = e.target;
    if (tg?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    const r = stage.getBoundingClientRect(); if (r.bottom < innerHeight * .5 || r.top > innerHeight * .5) return;
    const now = performance.now(), streak = now - lastUserKey < 2500, k = e.key;
    if (k.length === 1) {
      if (k === ' ') { if (!(streak || editorFocus) || tg?.closest?.('a,button')) return; e.preventDefault(); }
      userText += k; pushKey(k === ' ' ? 'SPACE' : k.toUpperCase()); wpmEvents.push([now, 1]);
    } else if (k === 'Backspace' && userText) { userText = userText.slice(0, -1); pushKey('⌫'); }
    else if (k === 'Enter' && userText && (streak || editorFocus)) { userText += '\n'; pushKey('⏎'); }
    else if (k === 'Tab' && userText && editorFocus) { e.preventDefault(); userText += '  '; pushKey('⇥'); }
    else return;
    const ls = userText.split('\n'); if (ls.length > 6) userText = ls.slice(-6).join('\n');
    if (userText.length > 260) userText = userText.slice(-260);
    lastUserKey = now; keyCount++; userKeys++;
    youSpark = 1;
  }, { signal });
  let youSpark = 0, userKeys = 0;

  function pushKey(label) { keyQueue.push(label); if (keyQueue.length > keys.length) keyQueue.shift(); keyPressT = clock; keysDirty = true; }
  let keysDirty = true;

  // chapter jumps
  let st = null, lenis = null;
  const scrollToProgress = v => {
    if (!st) return;
    const y = st.start + v * (st.end - st.start) + (v >= 1 ? -2 : 1);
    if (lenis) lenis.scrollTo(y, { duration: 1.8 }); else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  railBtns.forEach(b => b.addEventListener('click', () => scrollToProgress(CHAPS[+b.dataset.c].go), { signal }));

  /* ---------------------------------------------------------------- particles */
  function emit(x, y, n, power = 1, burst = false) {
    for (let i = 0; i < n && parts.length < 420; i++) {
      const a = burst ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - .5) * 2.2;
      const v = (burst ? 220 + Math.random() * 520 : 60 + Math.random() * 190) * power;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, dec: .9 + Math.random() * 1.4, sz: 1 + Math.random() * 2.2,
        hue: Math.random() < .55 ? 0 : Math.random() < .5 ? 1 : 2, ch: Math.random() < .16 ? ';{}()=<>/*'[Math.floor(Math.random() * 10)] : '' });
    }
  }
  const HUES = ['#9fb0ff', '#ffffff', '#7fffd4'];
  function drawFx(dt, rain, paused) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (rain > .01) {
      const cw = mob ? 14 : 16, cols = Math.ceil(W / cw), rows = Math.ceil(H / cw) + 1;
      if (!rainCols || rainCols.length !== cols) rainCols = Array.from({ length: cols }, () => ({ y: Math.random() * rows, v: 9 + Math.random() * 22 }));
      g.fillStyle = `rgba(3,4,8,${r2(rain * .6)})`; g.fillRect(0, 0, W, H);
      g.font = `500 ${cw - 2}px 'JetBrains Mono', monospace`; g.textAlign = 'center';
      const glyphs = '01{}<>=;:/()[]#$*+abcdef';
      for (let c = 0; c < cols; c++) {
        const col = rainCols[c]; if (!paused) col.y += col.v * dt; if (col.y - 18 > rows) col.y = -Math.random() * 10;
        const h = Math.floor(col.y);
        for (let j = 0; j < 16; j++) {
          const r = h - j; if (r < 0 || r > rows) continue;
          const a = (1 - j / 16) * rain;
          g.fillStyle = j === 0 ? `rgba(235,240,255,${r2(a)})` : `rgba(123,140,255,${r2(a * .8)})`;
          const hsh = Math.imul(c + 1, 73856093) ^ Math.imul(r + 7, 19349663) ^ (j === 0 && !paused ? Math.floor(clock * 9) : 0);
          g.fillText(glyphs[(hsh >>> 3) % glyphs.length], c * cw + cw / 2, r * cw);
        }
      }
    }
    if (!parts.length) return;
    g.globalCompositeOperation = 'lighter'; g.font = "600 11px 'JetBrains Mono', monospace";
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i];
      if (!paused) { q.vy += 420 * dt; q.vx *= .985; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= q.dec * dt; }
      if (q.life <= 0) { parts.splice(i, 1); continue; }
      g.globalAlpha = clamp(q.life);
      g.strokeStyle = g.fillStyle = HUES[q.hue];
      if (q.ch) g.fillText(q.ch, q.x, q.y);
      else { g.lineWidth = q.sz; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x - q.vx * .03, q.y - q.vy * .03); g.stroke(); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  /* ---------------------------------------------------------------- editor */
  function renderEditor(fi, n, uFrac) {
    const f = FILES[fi], sc = scripts[fi], steps = sc.steps;
    const pend = steps[n];
    const userOn = userText.length > 0 && userFile === fi;
    const key = `${fi}|${n}|${userOn ? userText : ''}|${mob}`;
    if (key === edKey) return;
    edKey = key;
    const { text, mod } = replay(steps, n);
    let carets = [text.length], multi = false, err = null;
    if (pend && (pend.k === 'mc' || pend.k === 'mi' || pend.k === 'mhold')) {
      const shift = pend.k === 'mhold' ? 1 : 0; // after insert, carets sit after '?'
      carets = pend.pos.map((q, j) => q + (shift ? j + 1 : 0)); multi = true;
    }
    let errMsg = null;
    if (pend && (pend.k === 'err' || pend.errOf != null)) {
      const e = pend.k === 'err' ? pend : steps[pend.errOf];
      const typoStart = text.length - (pend.k === 'err' ? e.len : 0);
      if (pend.k === 'err') { err = [typoStart, text.length]; errMsg = e.msg; }
    }
    let html = paint(text, f.lang, carets, err, multi);
    let total = text;
    if (userOn) {
      html += `\n<span class="lc-you">${paint(userText, f.lang, [userText.length])}</span>`;
      html = html.replace(/<i class="lc-caret"><\/i><\/span>$/, '<i class="lc-caret lc-caret--you"><em>YOU</em></i></span>');
      total += '\n' + userText;
    }
    codeEl.innerHTML = html;
    miniCode.innerHTML = html.replace(/<i class="lc-caret[^"]*">(<em>YOU<\/em>)?<\/i>/g, '');
    const nl = total.split('\n').length, scriptLines = text.split('\n').length;
    let ln = '', df = '';
    for (let i = 1; i <= nl; i++) {
      ln += i + '\n';
      const cls = i > scriptLines ? 'y' : mod.has(i - 1) ? 'm' : (text.length ? 'a' : '');
      df += `<b class="${cls}"></b>`;
    }
    linesEl.textContent = ln; diffEl.innerHTML = df;
    // caret position (main)
    const caret = userOn ? codeEl.querySelector('.lc-caret--you') : codeEl.querySelector('.lc-caret');
    const cy = caret ? caret.offsetTop : 0, cx = caret ? caret.offsetLeft : 0;
    const viewH = scrollEl.parentElement.clientHeight;
    const want = Math.max(0, cy - viewH * .55);
    scrollSY = want; // scroll-beyond-last-line keeps the caret near the middle
    S(scrollEl, 'transform', `translateY(${-Math.round(scrollSY)}px)`);
    S(curLine, 'transform', `translateY(${Math.round(cy - 2)}px)`);
    S(linesEl, 'transform', `translateY(${-Math.round(scrollSY)}px)`);
    S(diffEl, 'transform', `translateY(${-Math.round(scrollSY)}px)`);
    const miniScale = 4 / lh;
    S(miniView, 'transform', `translateY(${r2(scrollSY * miniScale)}px)`);
    S(miniView, 'height', `${r2(viewH * miniScale)}px`);
    // autocomplete
    if (pend && pend.k === 'ins' && pend.ac) {
      const typed = pend.ac.word.slice(0, 2);
      acEl.innerHTML = [pend.ac.word, ...pend.ac.alts].slice(0, 4).map((w, i) => {
        const hit = w.startsWith(typed), label = hit ? `<u>${esc(typed)}</u>${esc(w.slice(2))}` : esc(w);
        return `<span class="${i === 0 ? 'is-on' : ''}"><b class="lc-ack">${/^[A-Z]/.test(w) ? '⬡' : 'ƒ'}</b><i>${label}</i>${i === 0 ? '<em>↵ Tab</em>' : `<em>${/^[A-Z]/.test(w) ? 'class' : 'method'}</em>`}</span>`;
      }).join('');
      acEl.hidden = false;
      const maxX = scrollEl.parentElement.clientWidth - acEl.offsetWidth - 8;
      acEl.style.transform = `translate(${Math.round(Math.max(0, Math.min(cx - 18, maxX)))}px,${Math.round(cy + lh + 2)}px)`;
    } else acEl.hidden = true;
    if (errMsg) {
      diagEl.innerHTML = `<b>⊗</b><span>${esc(errMsg)}<small> ${esc(f.errCode)}</small></span><em>Quick Fix… ⌘.</em>`;
      diagEl.hidden = false;
      const maxX = scrollEl.parentElement.clientWidth - diagEl.offsetWidth - 8;
      diagEl.style.transform = `translate(${Math.round(Math.max(0, Math.min(cx - 160, maxX)))}px,${Math.round(cy + lh + 4)}px)`;
    } else diagEl.hidden = true;
    // status
    const lineNo = text.slice(0, carets[0]).split('\n').length, col = carets[0] - text.lastIndexOf('\n', carets[0] - 1);
    stPos.textContent = multi ? `${carets.length} selections` : `Ln ${lineNo}, Col ${col}`;
    stErr.textContent = errMsg ? '⊗ 1 ⚠ 0' : '⊗ 0 ⚠ 0';
    stErr.classList.toggle('is-err', !!errMsg);
    const done = n >= steps.length;
    tabs[fi].classList.toggle('is-dirty', n > 0 && !done);
    stSave.textContent = done ? '✓ Saved · Prettier' : n > 0 ? '● Unsaved' : '';
    gitBadge.textContent = String(text ? scriptLines : 0);
    const fnHit = text.includes(f.symbol) ? ` › ${f.symbol}` : '';
    crumbs.textContent = `${[...f.dir, f.file].join(' › ')}${fnHit}`;
  }

  function setFile(fi) {
    if (fi === curFile) return;
    curFile = fi; edKey = ''; if (userFile !== fi) { userText = ''; userFile = fi; }
    const f = FILES[fi];
    tabs.forEach((t, i) => { t.classList.toggle('is-on', i === fi); t.classList.toggle('is-open', i <= fi); });
    treeFiles.forEach(t => t.classList.toggle('is-on', t.dataset.pid === f.id));
    treeFiles.forEach(t => { const idx = FILES.findIndex(x => x.id === t.dataset.pid); t.classList.toggle('is-seen', idx <= fi); });
    ideTitle.textContent = `${f.file} — ${f.repo}`;
    repoEl.textContent = f.repo.toUpperCase();
    stBr.textContent = `⑂ ${f.branch}`; stLang.textContent = f.langName;
    termTitle.textContent = `~/${f.repo}`;
  }

  /* ---------------------------------------------------------------- render */
  function render(dt) {
    const paused = isPaused();
    if (!paused) clock += dt;
    // intro waits for the world intro overlay
    if (!introStarted) {
      introWait += dt;
      if (!document.querySelector('.pn-intro:not(.pn-out)') || introWait > 6) introStarted = true;
    }
    if (introStarted && (!paused || introT > 0)) introT += dt;
    if (target > .008 && introT < 4.4) introT = 4.4;
    if (paused && introStarted && introT < 4.4) introT = 4.4;
    introDone = introT >= 4.3;
    const d = target - p; p = Math.abs(d) < 4e-5 ? target : p + d * .14;

    // ---- which project / phase
    const fin = p >= FIN ? (p - FIN) / (1 - FIN) : -1;
    const ki = fin >= 0 ? 2 : clamp(Math.floor((p - P0) / LEN), 0, 2);
    const u = fin >= 0 ? 1 : clamp((p - P0) / LEN - ki);
    setFile(ki);

    // ---- editor typing
    const sc = scripts[ki];
    const uType = p < P0 ? 0 : fin >= 0 ? 1 : clamp((u - U.typeS) / (U.typeE - U.typeS));
    const n = stepsAt(sc, uType);
    const prevN = lastN[ki];
    if (n !== prevN) {
      const now = performance.now();
      if (n > prevN) {
        const add = n - prevN; wpmEvents.push([now, add]); keyCount += add;
        for (let j = Math.max(prevN, n - 3); j < n; j++) {
          const s = sc.steps[j];
          const lbl = s.k === 'i' ? (s.ch === ' ' ? 'SPACE' : s.ch === '\n' ? '⏎' : s.ch.toUpperCase()) : s.k === 'b' ? '⌫' : s.k === 'ins' ? '⇥' : s.k === 'save' ? '⌘S' : s.k === 'mc' ? '⌥' : s.k === 'mi' ? '?' : null;
          if (lbl) pushKey(lbl);
        }
        typedSpark = Math.min(6, add);
      } else { pushKey('⌫'); typedSpark = 0; }
      lastN[ki] = n;
    }
    renderEditor(ki, n, uType);

    // ---- intro
    const io = introT;
    show(boot, io < 3.2);
    if (io < 3.2) {
      const who = 'whoami', code = 'code .';
      const a = clamp(Math.floor((io - .7) / .11), 0, who.length);
      const outN = clamp(Math.floor((io - 1.45) * 46), 0, 99);
      const b = clamp(Math.floor((io - 2.05) / .09), 0, code.length);
      const out = 'MetaSonGi — creative developer';
      const blink = paused || Math.floor(io * 2.4) % 2 === 0;
      let t = `<span class="lc-t-pr">&gt;</span> ${who.slice(0, a)}${a < who.length || io < 1.45 ? (blink ? '<i class="lc-bcaret"></i>' : '<i class="lc-bcaret is-off"></i>') : ''}`;
      if (io >= 1.45) t += `\n<span class="lc-boot-out">${esc(out.slice(0, outN))}</span>`;
      if (io >= 1.95) t += `\n<span class="lc-t-pr">&gt;</span> ${code.slice(0, b)}${b < code.length || io < 2.6 ? '<i class="lc-bcaret"></i>' : ''}`;
      if (bootT._h !== t) { bootT._h = t; bootT.innerHTML = t; }
      const fo = smooth(2.55, 3.15, io);
      S(boot, 'opacity', String(r2(1 - fo)));
      S(bootT, 'transform', `scale(${r2(1 + fo * .5)})`);
      S(bootT, 'filter', `blur(${r2(fo * 6)}px)`);
      if (!paused && (a !== bootA || b !== bootB)) { const rr = bootT.getBoundingClientRect(); emit(rr.left + rr.width * .5 + (Math.random() - .5) * 60, rr.top + rr.height * .5, 4, .8); }
      bootA = a; bootB = b;
    }
    const asm = k => eo(clamp((io - 2.55 - k * .22) / 1.15));
    const aI = asm(0), aT = asm(1), aB = asm(1.6);
    S(ide, '--a1', String(r2(eo(clamp((io - 3.0) / .9)))));
    S(ide, '--a2', String(r2(eo(clamp((io - 3.15) / .9)))));
    S(ide, '--a3', String(r2(eo(clamp((io - 3.3) / .9)))));
    S(ide, '--a4', String(r2(eo(clamp((io - 3.45) / .9)))));

    // ---- window poses
    const { out: P, from, to, t: kt } = blendPoses(p);
    const fly = (q, a, dir) => { q = q.slice(); q[2] -= (1 - a) * 1500; q[3] += (1 - a) * 40; q[4] += (1 - a) * 30 * dir; q[1] += (1 - a) * H * .25; q[6] *= a; return q; };
    const qI = fly(P.ide, aI, 0), qT = fly(P.term, aT, -1), qB = fly(P.brow, aB, 1);
    const shipBack = fin >= 0 ? e3(smooth(.7, .82, fin)) : 0;
    qT[2] -= shipBack * 420; qT[1] -= shipBack * H * .12; qT[3] += shipBack * 14; qT[6] *= 1 - shipBack * .55;
    S(ide, 'transform', poseCSS(qI)); S(ide, 'opacity', String(r2(qI[6]))); show(ide, qI[6] > .01);
    S(term, 'transform', poseCSS(qT)); S(term, 'opacity', String(r2(qT[6]))); show(term, qT[6] > .01);
    S(brow, 'transform', poseCSS(qB)); S(brow, 'opacity', String(r2(qB[6]))); show(brow, qB[6] > .01);
    const focus = { H: 'ide', E: 'ide', T: 'term', TF: 'term', B: 'brow', F: 'brow' }[kt > .5 ? to : from];
    ide.classList.toggle('is-focus', focus === 'ide'); term.classList.toggle('is-focus', focus === 'term'); brow.classList.toggle('is-focus', focus === 'brow');
    // tilt (reduced when browser fullscreen)
    const fullW = (to === 'F' ? kt : from === 'F' ? 1 - kt : 0);
    const amp = 1 - fullW * .85;
    tiltX = lerp(tiltX, mxN * 7 * amp, .06); tiltY = lerp(tiltY, -myN * 5 * amp, .06);
    const fl = paused ? 0 : Math.sin(clock * .5) * .6 * amp;
    S(rig, 'transform', `rotateX(${r2(tiltY + fl * .5)}deg) rotateY(${r2(tiltX + fl)}deg)`);

    // ---- terminal
    let tf = FILES[ki], tlist = tf.term, ttot = termTotals[ki], tc = 0;
    if (fin >= 0) { tlist = FINALE_TERM; ttot = finTotal; tc = clamp((fin - .08) / .58) * ttot / .95; tf = { repo: 'metasongi-motion-portfolio', branch: 'main' }; }
    else if (p >= P0) tc = clamp((u - U.toTermE) / (U.termE - U.toTermE)) * ttot / .92;
    const spinF = paused ? 0 : Math.floor(clock * 12);
    const tKey = `${fin >= 0 ? 'F' : ki}|${r2(tc)}|${spinF}`;
    if (tKey !== termKey && (qT[6] > .01)) {
      termKey = tKey;
      const h = termHTML(tf, tlist, ttot, tc, clock, paused);
      if (tbody._h !== h) { tbody._h = h; tbody.innerHTML = h; }
    }

    // ---- browser: url, load, glitch, overlay
    const bu = fin >= 0 ? 1 : u;
    const urlT = clamp((bu - U.termE) / .035), url = FILES[ki].url;
    const urlS = (p < P0 ? '' : url.slice(0, Math.round(urlT * url.length)));
    if (urlS !== curUrl) { curUrl = urlS; urlText.textContent = urlS; }
    S(urlCaret, 'opacity', urlT > 0 && urlT < 1 ? '1' : '0');
    const ld = clamp((bu - (U.termE + .03)) / .06);
    S(loadBar, 'transform', `scaleX(${r2(ld)})`); S(loadBar, 'opacity', ld > 0 && ld < 1 ? '1' : '0');
    const shotOn = p >= P0 && bu >= U.toBrowE - .005;
    const pid = FILES[ki].id;
    if (pid !== curShotId) { curShotId = pid; imgs.forEach(im => { im.src = ART[pid]; }); }
    show(blank, !shotOn); show(shot, shotOn);
    const gl = fin >= 0 ? 0 : bump(clamp((bu - (U.toBrowE - .005)) / .075));
    if (shotOn) {
      if (gl > .02 && !paused) {
        const r = Math.random;
        const y1 = r() * 80, y2 = Math.min(100, y1 + 4 + r() * 18);
        S(glR, 'clipPath', `inset(${r2(y1)}% 0 ${r2(100 - y2)}% 0)`); S(glR, 'transform', `translateX(${r2((r() - .5) * 60 * gl)}px)`); S(glR, 'opacity', String(r2(gl)));
        const y3 = r() * 85, y4 = Math.min(100, y3 + 3 + r() * 12);
        S(glC, 'clipPath', `inset(${r2(y3)}% 0 ${r2(100 - y4)}% 0)`); S(glC, 'transform', `translateX(${r2((r() - .5) * 80 * gl)}px)`); S(glC, 'opacity', String(r2(gl)));
        S(imgs[0], 'filter', `saturate(${r2(1 + gl * 2)}) contrast(${r2(1 + gl * .6)}) brightness(${r2(1 + (r() < .2 ? gl * .8 : 0))})`);
        S(imgs[0], 'transform', `scale(${r2(1.04 + gl * .05)}) translateX(${r2((r() - .5) * 10 * gl)}px)`);
      } else {
        S(glR, 'opacity', '0'); S(glC, 'opacity', '0'); S(imgs[0], 'filter', 'none');
        const kb = fin >= 0 ? 1 : clamp((bu - U.toBrowE) / (1 - U.toBrowE));
        S(imgs[0], 'transform', `scale(${r2(1.04 + kb * .06)})`);
      }
    }
    const bootLogT = clamp((bu - (U.termE + .035)) / .05);
    const bl = shotOn ? gl : bootLogT;
    show(bootLog, p >= P0 && fin < 0 && bootLogT > 0 && bl > .05);
    if (bootLogT > 0 && fin < 0) {
      const lines = ['> mounting app', '> hydrating components', '> WebGL context ✓', '> audio graph ✓', '> ready ▌'];
      const nlines = Math.ceil(bootLogT * lines.length);
      const s2 = lines.slice(0, nlines).join('\n');
      if (bootLog._t !== s2) { bootLog._t = s2; bootLog.textContent = s2; }
      S(bootLog, 'opacity', String(r2(shotOn ? gl : 1)));
    }
    const ovA = fin >= 0 ? 1 - smooth(.0, .06, fin) : smooth(U.fullE - .03, U.fullE + .02, u);
    ovs.forEach((o, i) => { const on = i === ki ? ovA : 0; S(o, 'opacity', String(r2(on))); show(o, on > .01); });
    S(view, '--scan', String(r2(gl)));

    // ---- Cmd+Tab switcher
    let swA = 0, swTo = 'ide';
    if (from !== to && kt > 0 && kt < 1) {
      swA = bump(kt) * 1.6;
      const map = { E: 'ide', T: 'term', B: 'brow', F: 'brow', TF: 'term', H: 'ide' };
      swTo = kt < .35 ? map[from] : map[to];
      if ((from === 'B' && to === 'F') || from === 'H') swA = 0;
    }
    S(sw, 'opacity', String(r2(clamp(swA)))); show(sw, swA > .01);
    S(sw, 'transform', `translate(-50%,-50%) scale(${r2(.92 + clamp(swA) * .08)})`);
    swApps.forEach(a => a.classList.toggle('is-on', a.dataset.app === swTo));

    // ---- code rain in transitions (F → next)
    let rain = 0;
    if ((from === 'F' && (to === 'E' || to === 'TF'))) rain = bump(kt) * 1.1;
    rain = clamp(rain);

    // ---- hero
    const heroA = smooth(3.4, 4.3, io) * (1 - smooth(.004, .04, p));
    S(hero, 'opacity', String(r2(heroA))); show(hero, heroA > .01);
    S(hero, '--k', String(r2(smooth(3.3, 4.4, io))));
    S(hero, 'transform', `translateY(${r2(-p * 1400)}px)`);

    // ---- cards
    cards.forEach((c, k) => {
      const endK = P0 + LEN * (k + 1);
      const inA = smooth(P0 + LEN * (k + U.fullE - .01), P0 + LEN * (k + U.fullE + .03), p);
      const outA = 1 - smooth(endK + .001, endK + LEN * .03, p);
      const a = inA * outA;
      S(c, 'opacity', String(r2(a))); show(c, a > .01);
      S(c, 'transform', `translate3d(0,${r2((1 - inA) * 50 - (1 - outA) * 30)}px,0)`);
      S(c, 'pointerEvents', a > .6 ? 'auto' : 'none');
    });

    // ---- ship
    const shipA = fin >= 0 ? smooth(.72, .8, fin) : 0;
    S(ship, 'opacity', String(r2(shipA))); show(ship, shipA > .01);
    S(ship, '--k', String(r2(smooth(.72, .86, fin))));
    S(ship, 'pointerEvents', shipA > .6 ? 'auto' : 'none');
    if (fin >= .74 && !shipped) {
      shipped = true;
      if (!paused) { emit(W / 2, H * .46, 140, 1, true); emit(W * .3, H * .5, 40, .8, true); emit(W * .7, H * .5, 40, .8, true); }
      const strokes = scripts.reduce((a, s) => a + s.steps.length, 0) + userKeys;
      const lines = scripts.reduce((a, s) => a + replay(s.steps, s.steps.length).text.split('\n').length, 0);
      shipStats.textContent = `3 projects · ${lines} lines · ${strokes.toLocaleString("en-US")} keystrokes · 4 commits`;
    }
    if (fin < .7) shipped = false;

    // ---- commit graph
    gBr.forEach((b, k) => b.classList.toggle('is-on', p >= commitAt[k] - LEN * .02));
    gF.forEach((c, k) => c.classList.toggle('is-on', p >= commitAt[k]));
    gM.forEach((c, k) => c.classList.toggle('is-on', p >= mergeAt[k]));
    gPush.classList.toggle('is-on', p >= pushAt);
    let lc = 'init: ten worlds, one developer';
    FILES.forEach((f, k) => { if (p >= commitAt[k]) lc = f.term.find(x => x.commit).commit; });
    if (p >= pushAt) lc = finE.commit;
    if (lastC._t !== lc) { lastC._t = lc; lastC.textContent = lc; sideCommit.textContent = lc; }

    // ---- HUD
    let step = 'BOOT', sub = '> whoami';
    if (introDone && p < P0) { step = 'READY'; sub = '스크롤해서 타이핑 시작'; }
    if (p >= P0 && fin < 0) {
      const f = FILES[ki];
      if (u < U.typeE + .01) { step = `0${ki + 1} · TYPING`; sub = [...f.dir, f.file].join('/'); }
      else if (u < U.termE) { step = `0${ki + 1} · TERMINAL`; sub = f.term[0].t; }
      else if (u < U.fullE) { step = `0${ki + 1} · RUN`; sub = f.url; }
      else { step = `0${ki + 1} · LIVE`; sub = projects[ki].name; }
    } else if (fin >= 0) { step = fin < .72 ? 'SHIP · PUSH' : 'SHIPPED'; sub = 'git push origin main'; }
    const stp = step + '|' + sub;
    if (stp !== curStep) { curStep = stp; stepEl.textContent = step; subEl.textContent = sub; }
    let ri = 0; CHAPS.forEach((c, i) => { if (i > 0 && i < 4 && p >= P0 + LEN * (i - 1) - .002) ri = i; });
    if (fin >= 0) ri = 4;
    if (ri !== curRail) { curRail = ri; railBtns.forEach((b, i) => b.classList.toggle('is-on', i === ri)); }
    S(rail, '--p', String(r2(p)));
    liveEl.classList.toggle('is-you', userText.length > 0);

    // WPM
    const now = performance.now();
    while (wpmEvents.length && now - wpmEvents[0][0] > 2500) wpmEvents.shift();
    const chars = wpmEvents.reduce((a, e) => a + e[1], 0), wpm = Math.min(480, chars / 5 * 24);
    wpmDisp += (wpm - wpmDisp) * .08;
    const wtxt = String(Math.round(wpmDisp));
    if (wpmEl.textContent !== wtxt) { wpmEl.textContent = wtxt; stWpm.textContent = `${wtxt} WPM`; }
    const kc = keyCount.toLocaleString('en-US'); if (kcountEl.textContent !== kc) kcountEl.textContent = kc;
    // keycaps
    if (keysDirty) {
      keysDirty = false;
      keys.forEach((k, i) => { const lbl = keyQueue[keyQueue.length - keys.length + i] ?? ''; const b = k.firstChild; if (b.textContent !== lbl) b.textContent = lbl; k.classList.toggle('is-wide', lbl.length > 1); });
    }
    const press = clamp(1 - (clock - keyPressT) / .16);
    S(keys[keys.length - 1], '--press', String(r2(press)));

    // sparks from caret
    if (!paused && (typedSpark > 0 || youSpark > 0) && qI[6] > .5) {
      const c = youSpark ? codeEl.querySelector('.lc-caret--you') : codeEl.querySelector('.lc-caret');
      if (c) { const r = c.getBoundingClientRect(), sr = stage.getBoundingClientRect(); emit(r.left - sr.left + 1, r.top - sr.top + r.height * .5, 3 + typedSpark * 2 + youSpark * 5, youSpark ? 1.1 : .8); }
    }
    typedSpark = 0; youSpark = 0;
    drawFx(dt, rain, paused);
    root.classList.toggle('is-paused', paused);
    S(hud, 'opacity', String(r2(smooth(3.6, 4.4, io))));
    const hudF = String(r2(1 - fullW * .92));
    S(hudTL, 'opacity', hudF); S(hudBL, 'opacity', hudF); S(hudBR, 'opacity', hudF);
  }
  let typedSpark = 0, bootA = -1, bootB = -1;

  // ---- loop
  let raf = 0, gsapRef = null, tickFn = null, ctx = null, lenisTick = null;
  const tick = () => {
    if (disposed || document.hidden) { last = performance.now(); return; }
    const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
    render(dt);
  };
  const loop = () => { raf = requestAnimationFrame(loop); tick(); };
  layout();
  raf = requestAnimationFrame(loop);
  document.fonts?.ready?.then(() => { if (!disposed) layout(); });

  Promise.all([import(LIBS.gsap), import(LIBS.st), import(LIBS.lenis)]).then(([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
    if (disposed) return;
    gsap.registerPlugin(ScrollTrigger);
    gsapRef = gsap;
    lenis = new Lenis({ lerp: .1 });
    lenis.on('scroll', ScrollTrigger.update);
    lenisTick = time => lenis.raf(time * 1000);
    gsap.ticker.add(lenisTick);
    gsap.ticker.lagSmoothing(0);
    ctx = gsap.context(() => {
      st = ScrollTrigger.create({
        trigger: stage, start: 'top top', end: () => '+=' + Math.round(innerHeight * PIN_SCREENS),
        pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: self => { target = self.progress; },
        onRefresh: self => { target = self.progress; layout(); },
      });
    }, root);
    cancelAnimationFrame(raf); raf = 0;
    tickFn = () => tick();
    gsap.ticker.add(tickFn);
    requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
  }).catch(err => {
    if (disposed) return;
    console.warn('[workspace] motion libraries unavailable, showing static case studies', err);
    cancelAnimationFrame(raf); raf = 0;
    ac.abort();
    root.innerHTML = staticHTML(true);
  });

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    ac.abort();
    if (gsapRef) {
      if (tickFn) gsapRef.ticker.remove(tickFn);
      if (lenisTick) gsapRef.ticker.remove(lenisTick);
    }
    try { ctx?.revert(); } catch { /* noop */ }
    try { lenis?.destroy(); } catch { /* noop */ }
    parts.length = 0;
    root.innerHTML = '';
  };
}
