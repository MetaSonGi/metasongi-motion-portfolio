// The Developer Cut — world `noir`.
// "The Edit": raw media bursts in, gets gathered into a bin, cut together on a
// timeline, rendered, and played back as a black & white final cut.
// Everything is driven by one scrubbed, pinned ScrollTrigger and one ticker.
import { projects, profileURL } from '../content.js?v=ten-worlds-1';

const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs',
};
const ART = { vrm: 'art/vrm.jpg', pixelle: 'art/glass.jpg', motion: 'art/orbit.jpg' };
const PIN_SCREENS = 10; // pinned scroll length in viewport heights

// Scroll beats (fractions of the pinned scroll).
const B = {
  coldE: .06,
  impS: .06, impE: .20,
  gatS: .20, gatE: .30,
  editS: .31, flyS: .355, razS: .45, razE: .48, scrS: .48, scrE: .56,
  renS: .56, renE: .62,
  expS: .62, expE: .65,
  seqS: .65, seqE: .89,
  credS: .89,
};
const CHAPS = [
  { at: 0, go: 0, sc: '00', label: 'COLD OPEN', cap: '필름 리더가 돌아갑니다. 스크롤로 편집을 시작하세요.' },
  { at: B.impS, go: .175, sc: '01', label: 'IMPORT', cap: '재료가 쏟아집니다 — 사진, 코드, 소리, 자막.' },
  { at: B.gatS, go: .305, sc: '02', label: 'GATHER', cap: '흩어진 재료를 빈(bin)에 종류별로 모읍니다.' },
  { at: B.editS, go: .5, sc: '03', label: 'EDIT', cap: '트랙에 올리고, 자르고, 이어 붙입니다.' },
  { at: B.renS, go: .6, sc: '04', label: 'RENDER', cap: '최종본을 한 프레임씩 굽는 중.' },
  { at: B.expS, go: .715, sc: '05', label: 'FINAL CUT', cap: '파이널 컷 — 세 개의 장면.' },
  { at: B.credS, go: 1, sc: '06', label: 'CREDITS', cap: '엔딩 크레딧.' },
];

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const eo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const e3 = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const back = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
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
const tc = (sec, fps = 24) => {
  const f = Math.max(0, Math.floor(sec * fps)), s = Math.floor(f / fps);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, f % fps].map(n => String(n).padStart(2, '0')).join(':');
};
// Letters wrapped per word so lines can still wrap between words.
function letters(text, from = 0) {
  let i = from;
  const html = text.split(' ').map(word => `<span class="es-w">${[...word].map(ch => `<span class="es-ch" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  return { html, n: i - from };
}

/* ------------------------------------------------------------------ media */
const SNIPPETS = [
  { file: 'avatar.ts', code: `<c>// lip-sync from mic level</c>\n<k>const</k> vrm = <k>await</k> loader.<f>loadAsync</f>(<s>'studio.vrm'</s>);\nvrm.expressionManager.<f>setValue</f>(<s>'aa'</s>, level);` },
  { file: 'bridge/main.py', code: `<f>@app.post</f>(<s>'/jobs'</s>)\n<k>async def</k> <f>create_job</f>(req: JobRequest):\n    <k>return await</k> pixelle.<f>submit</f>(req)` },
  { file: 'worlds.js', code: `<k>export function</k> <f>mount</f>(root, { isPaused }) {\n  <c>// ten worlds, one contract</c>\n  <k>return</k> dispose;\n}` },
  { file: 'renderer.ts', code: `renderer.<f>setPixelRatio</f>(Math.<f>min</f>(dpr, <n>2</n>));\nrenderer.toneMapping =\n  THREE.ACESFilmicToneMapping;` },
  { file: 'audio.ts', code: `<k>const</k> rms = Math.<f>sqrt</f>(sum / buf.length);\nmouth = <f>lerp</f>(mouth, rms * <n>8</n>, <n>.35</n>);` },
  { file: 'recorder.ts', code: `<k>const</k> rec = <k>new</k> <f>MediaRecorder</f>(stream, {\n  mimeType: <s>'video/webm'</s>\n});` },
];
const AUDIO = [
  { key: 'vo', name: 'VO_take_03.wav', len: '00:14', seed: 3 },
  { key: 'score', name: 'score_final.wav', len: '01:30', seed: 7 },
  { key: 'mic', name: 'mic_level.wav', len: '00:09', seed: 11 },
  { key: 'foley', name: 'foley_keys.wav', len: '00:21', seed: 19 },
  { key: 'room', name: 'room_tone.wav', len: '00:30', seed: 23 },
];
const SWATCH = [['#FFFFFF', 'PAPER WHITE'], ['#FF3347', 'REC RED'], ['#5A5A5A', 'SILVER 50'], ['#0B0B0B', 'CRUSHED BLACK']];
const SIZE = { photo: [220, 140], code: [282, 150], audio: [240, 96], title: [220, 124], swatch: [120, 150] };
const ROWS = ['VIDEO', 'AUDIO', 'CODE', 'TITLES'];

function buildItems(mob) {
  const out = [];
  const variants = [{ pos: '50% 35%', sc: 1 }, { pos: '28% 62%', sc: 1.7 }, { pos: '72% 38%', sc: 2.3 }];
  let clipNo = 1;
  (mob ? variants.slice(0, 2) : variants).forEach((v, vi) => projects.forEach(pr => {
    const name = `A001_C${String(clipNo++).padStart(3, '0')}`;
    out.push({ type: 'photo', row: 0, key: `photo-${pr.id}-${vi}`, html: `<img src="${ART[pr.id]}" alt="" draggable="false" style="object-position:${v.pos};transform:scale(${v.sc})"><span class="es-cap">${name} · ${ART[pr.id].slice(4)}</span><i class="es-badge">${tc(vi * 7 + clipNo * 3.4)}</i>` });
  }));
  (mob ? AUDIO.slice(0, 3) : AUDIO).forEach(a => out.push({ type: 'audio', row: 1, key: `audio-${a.key}`, seed: a.seed, html: `<header><b>A${a.key === 'score' ? 2 : 1}</b><span>${a.name}</span><em>${a.len}</em></header><canvas></canvas>` }));
  (mob ? SNIPPETS.slice(0, 3) : SNIPPETS).forEach((s, i) => out.push({ type: 'code', row: 2, key: `code-${i}`, html: `<header><i></i><i></i><i></i><span>${s.file}</span></header><pre>${s.code.replace(/<(\/?)([cksfn])>/g, (m, sl, t) => (sl ? '</em>' : `<em class="es-${t}">`))}</pre>` }));
  const titles = [
    ...projects.map((pr, i) => ({ key: `title-${i}`, small: `TITLE 0${i + 1}`, big: pr.name.toUpperCase() })),
    { key: 'title-fade', small: 'SLUG', big: 'FADE IN:', serif: true },
    { key: 'title-int', small: 'SLUG', big: 'INT. BROWSER — NIGHT' },
    { key: 'title-end', small: 'END CARD', big: 'THE END?', serif: true },
  ];
  (mob ? titles.slice(0, 3) : titles).forEach(t => out.push({ type: 'title', row: 3, key: t.key, html: `<small>${t.small}</small><b class="${t.serif ? 'es-serif' : ''}">${esc(t.big)}</b>` }));
  (mob ? SWATCH.slice(0, 2) : SWATCH).forEach(([hex, label]) => out.push({ type: 'swatch', row: 3, key: `sw-${hex}`, html: `<i style="background:${hex}"></i><span>${hex}<br>${label}</span>` }));

  const counts = [0, 0, 0, 0];
  out.forEach(it => { it.col = counts[it.row]++; });
  const maxCols = Math.max(...counts);
  const r = rng(1979);
  out.forEach((it, i) => {
    it.i = i;
    [it.w, it.h] = SIZE[it.type];
    it.rand = Array.from({ length: 12 }, r);
    it.d1 = it.rand[0];
    it.d2 = clamp((it.row * .22 + (it.col / maxCols) * .34) + it.rand[1] * .06);
    it.d3 = clamp(it.rand[2] * .55 + it.row * .1);
    it.ph = it.rand[3] * Math.PI * 2;
    it.px = 0; it.py = 0; it.tx = 0; it.ty = 0;
    it.A = {}; it.Bp = {}; it.C = {}; it.D = {}; it.cur = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 };
  });
  return { list: out, counts, maxCols };
}

/* ------------------------------------------------------------------ timeline */
function clipSpecs() {
  const P = projects;
  return [
    { id: 'c0', tr: 'V1', a: 0, b: .34, img: 0, name: `A001_C001 · vrm.jpg`, src: 'photo-vrm-0', f0: .355 },
    { id: 'c1', tr: 'V1', a: .34, b: .67, img: 1, name: `A001_C002 · glass.jpg`, src: 'photo-pixelle-0', f0: .362 },
    { id: 'c2a', tr: 'V1', a: .67, b: .84, img: 2, name: `A001_C003 · orbit.jpg`, src: 'photo-motion-0', f0: .369, joinR: true },
    { id: 'c2b', tr: 'V1', a: .84, b: 1, img: 2, name: `A001_C003 (2) · orbit.jpg`, src: 'photo-motion-0', f0: .369, alt: true, joinL: true },
    { id: 'm0', tr: 'A2', a: 0, b: .52, name: 'score_final.wav — I', src: 'audio-score', f0: .378, wave: 41 },
    { id: 'm1', tr: 'A2', a: .52, b: 1, name: 'score_final.wav — II', src: 'audio-score', f0: .384, wave: 42 },
    { id: 't0', tr: 'V2', a: .03, b: .27, title: 0, name: `TITLE · ${P[0].name}`, src: 'title-0', f0: .392 },
    { id: 't1', tr: 'V2', a: .37, b: .61, title: 1, name: `TITLE · ${P[1].name}`, src: 'title-1', f0: .398 },
    { id: 't2', tr: 'V2', a: .70, b: .95, title: 2, name: `TITLE · ${P[2].name}`, src: 'title-2', f0: .404 },
    { id: 'a0', tr: 'A1', a: .02, b: .30, name: 'VO_take_03.wav', src: 'audio-vo', f0: .412, wave: 51 },
    { id: 'a1', tr: 'A1', a: .36, b: .63, name: 'mic_level.wav', src: 'audio-mic', f0: .418, wave: 52 },
    { id: 'a2', tr: 'A1', a: .69, b: .97, name: 'foley_keys.wav', src: 'audio-foley', f0: .424, wave: 53 },
  ];
}
const FLY = .02; // scroll fraction for one clip flight
const TOTAL_SEC = 90;

function drawWave(canvas, w, h, seed, color = 'rgba(236,236,230,.88)') {
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const g = canvas.getContext('2d'); if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.fillStyle = color;
  const r = rng(seed); let env = .55;
  for (let x = 0; x < w; x += 3) {
    env = clamp(env + (r() - .5) * .22, .12, 1);
    const a = (Math.sin(x * .03 + seed) * .25 + .75) * env * (.3 + r() * .7);
    const bh = Math.max(1, a * h * .9);
    g.fillRect(x, (h - bh) / 2, 2, bh);
  }
}

/* ------------------------------------------------------------------ static storyboard */
function boardHTML(failed) {
  const shots = ['SLOW PUSH-IN · 35mm', 'RACK FOCUS · 50mm', 'ORBIT 360° · 24mm'];
  return `<div class="es-root es-boardroot" data-no-kx>
  <header class="es-bhead">
    <p class="es-kick">METASONGI PICTURES — STORYBOARD</p>
    <h1 class="es-btitle">The Developer Cut</h1>
    <p class="es-bsub"><em>a film in three projects</em> — 세 개의 프로젝트로 만든 한 편의 필름, 콘티 버전.</p>
    ${failed ? '<p class="es-bnote">모션 라이브러리를 불러오지 못해 정적인 콘티로 보여드립니다.</p>' : ''}
  </header>
  <ol class="es-board">
    ${projects.map((p, i) => `<li class="es-shot">
      <figure><img src="${ART[p.id]}" alt="${esc(p.name)} 대표 이미지" loading="lazy"><figcaption><span>SC 0${i + 1} · SHOT A</span><span>${tc(i * 30 + 1.5)}</span></figcaption></figure>
      <div class="es-shotcopy">
        <span class="es-slug">SCENE 0${i + 1} / 03 — ${esc(p.category)}</span>
        <h2>${esc(p.name)}</h2>
        <p class="es-sdesc">${esc(p.description)}</p>
        <p class="es-sbody">${esc(p.body)}</p>
        <ul class="es-stack">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <p class="es-dir">CAMERA: ${shots[i]}</p>
        <a class="es-btn" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">프로젝트 보기 ↗</a>
      </div>
    </li>`).join('')}
  </ol>
  <footer class="es-bfoot">
    <p>Directed, coded &amp; edited by <b>MetaSonGi</b></p>
    <p class="es-bstack">${[...new Set(projects.flatMap(p => p.stack))].map(esc).join(' · ')}</p>
    <a class="es-btn" href="${esc(profileURL)}" target="_blank" rel="noopener noreferrer">GitHub에서 계속 보기 ↗</a>
  </footer>
</div>`;
}

/* ------------------------------------------------------------------ reel markup */
function reelHTML(items, clips, mob) {
  const title1 = letters('THE DEVELOPER', 0), title2 = letters('CUT', title1.n);
  const titleN = title1.n + title2.n;
  const half = cls => `<div class="es-half ${cls}" aria-hidden="${cls === 'es-hb'}"><span class="es-tline">${title1.html}</span><span class="es-tline es-tcut">${title2.html}</span></div>`;
  const N = items.list.length;
  const tracks = ['V2', 'V1', 'A1', 'A2'];
  const ruler = Array.from({ length: 7 }, (_, i) => `<span style="left:${(i / 6) * 100}%">${tc(i * 15).slice(3, 8)}</span>`).join('');
  const clipEl = c => {
    const kind = c.tr[0] === 'V' ? (c.title !== undefined ? 'es-ct' : 'es-cv') : 'es-ca';
    const film = c.img !== undefined ? `<i class="es-film" style="background-image:url(${Object.values(ART)[c.img]})${c.alt ? ';background-position:-40px 0' : ''}"></i>` : '';
    const wave = c.wave ? '<i class="es-wave"></i>' : '';
    return `<div class="es-clip ${kind}${c.joinR ? ' es-jr' : ''}${c.joinL ? ' es-jl' : ''}" data-id="${c.id}" style="left:${c.a * 100}%;width:${(c.b - c.a) * 100}%">${film}${wave}<span>${esc(c.name)}</span>${c.id === 'c2b' ? '<i class="es-seam"></i>' : ''}</div>`;
  };
  const razor = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M9 4h11v11" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="6" cy="18" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  const scene = (p, i) => {
    const t = letters(p.name.toUpperCase());
    return `<section class="es-scene" data-i="${i}" aria-label="Scene ${i + 1}: ${esc(p.name)}">
      <div class="es-sbg"><img src="${ART[p.id]}" alt="" draggable="false"></div>
      <div class="es-shade"></div>
      <p class="es-slate"><b>SCENE 0${i + 1}</b> / 03 — ${esc(p.category)}<span>${tc(i * 30)}</span></p>
      <h2 class="es-sname" style="--n:${t.n}">${t.html}</h2>
      <div class="es-card">
        <p class="es-card-k">${esc(p.category)} · ${p.stack.map(esc).join(' / ')}</p>
        <p class="es-card-d">${esc(p.description)}</p>
        <p class="es-card-b">${esc(p.body)}</p>
        <div class="es-card-row"><ul class="es-stack">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul><a class="es-btn" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">프로젝트 보기 ↗</a></div>
      </div>
    </section>`;
  };
  const allStack = [...new Set(projects.flatMap(p => p.stack))];
  return `<div class="es-root" data-no-kx>
 <div class="es-sr">
   <h1>The Developer Cut — MetaSonGi</h1>
   <ul>${projects.map(p => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)} — ${esc(p.description)}</a></li>`).join('')}</ul>
 </div>
 <section class="es-reel" aria-label="The Developer Cut — 스크롤로 편집되는 필름">
  <div class="es-stage">
   <div class="es-frame">
    <div class="es-deskword" aria-hidden="true"><span>IMPORT</span><small>${N} FILES · RAW MATERIAL · 4.2 GB</small></div>
    <div class="es-bin" aria-hidden="true">
      <header><b>BIN</b><span>/Media/The Developer Cut</span><em class="es-bincount">0 / ${N}</em></header>
      <div class="es-rows">${ROWS.map((r, i) => `<div class="es-row"><span>${r}<i>${String(items.counts[i]).padStart(2, '0')}</i></span></div>`).join('')}</div>
    </div>
    <div class="es-desk" aria-hidden="true"><div class="es-items">${items.list.map(it => `<div class="es-it es-${it.type === 'title' ? 'tcard' : it.type}" style="width:${it.w}px;height:${it.h}px;margin:${-it.h / 2}px 0 0 ${-it.w / 2}px">${it.html}</div>`).join('')}</div></div>
    <div class="es-nle">
      <div class="es-viewer">
        <div class="es-vbar"><span><i class="es-dot"></i>PROGRAM · SEQ_01</span><span class="es-vtc">00:00:00:00</span></div>
        <div class="es-vscreen">
          <div class="es-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><span>SEQ 01 — NO CLIPS</span></div>
          ${projects.map(p => `<img class="es-vimg" src="${ART[p.id]}" alt="" draggable="false">`).join('')}
          <div class="es-vsafe" aria-hidden="true"></div>
          <div class="es-vtitle"><small></small><b></b><p></p></div>
        </div>
      </div>
      <div class="es-tl">
        <div class="es-tlbar"><b>SEQ 01 — THE DEVELOPER CUT</b><div class="es-tools"><i data-tool="select" class="is-on">▸</i><i data-tool="razor">${razor}</i><i data-tool="snap">⊓</i></div><span class="es-tltc">00:00:00:00</span></div>
        <div class="es-tlbody">
          <div class="es-trk es-rulerrow"><div class="es-hd"></div><div class="es-ruler">${ruler}<i class="es-rbar"></i></div></div>
          ${tracks.map(t => `<div class="es-trk" data-tr="${t}"><div class="es-hd"><b>${t}</b><i>${t[0] === 'V' ? '◉' : '♪'}</i></div><div class="es-lane">${clips.filter(c => c.tr === t).map(clipEl).join('')}${t === 'V1' ? `<div class="es-razor">${razor}</div><i class="es-cutline"></i>` : ''}</div></div>`).join('')}
          <div class="es-phl"><div class="es-ph"><i></i></div></div>
        </div>
      </div>
    </div>
    <div class="es-render" aria-hidden="true">
      <header><b>EXPORT</b><span>H.264 · 3840×1608 · 23.976 fps</span></header>
      <div class="es-rprev">${projects.map(p => `<img src="${ART[p.id]}" alt="" draggable="false">`).join('')}<span class="es-rframe">FRAME 0000 / 2160</span></div>
      <div class="es-rname">the_developer_cut_FINAL_v7.mp4</div>
      <div class="es-rprog"><i></i></div>
      <div class="es-rrow"><b class="es-rpct">0%</b><span class="es-reta">ETA 00:00:12</span></div>
      <div class="es-rthumbs">${Array.from({ length: 12 }, (_, i) => `<i style="background-image:url(${Object.values(ART)[Math.floor(i / 4)]});background-position:${(i % 4) * 33}% 50%"></i>`).join('')}</div>
    </div>
    <div class="es-cinema">
      ${projects.map(scene).join('')}
      <i class="es-lb es-lbt"></i><i class="es-lb es-lbb"></i>
    </div>
    <div class="es-cutto" aria-hidden="true"><em>Cut to:</em><b class="es-cutno">SCENE 02</b></div>
    <div class="es-credits">
      <div class="es-roll">
        <p class="es-cr-k">A METASONGI PICTURE</p>
        <h2 class="es-cr-title">The Developer Cut</h2>
        <dl>
          <dt>Directed, coded &amp; edited by</dt><dd>MetaSonGi</dd>
          <dt>Starring</dt>${projects.map(p => `<dd>${esc(p.name)} <small>as ${esc(p.category.toLowerCase())}</small></dd>`).join('')}
          <dt>Stack</dt>${projects.map(p => `<dd class="es-mono">${p.stack.map(esc).join(' · ')}</dd>`).join('')}
          <dt>Motion &amp; Picture</dt><dd class="es-mono">GSAP · ScrollTrigger · Lenis · Canvas 2D · CSS 3D</dd>
          <dt>Colour</dt><dd>Black, white &amp; one red light</dd>
          <dt>Languages</dt><dd class="es-mono">${allStack.filter(s => /Script|Python|CSS/.test(s)).map(esc).join(' · ')}</dd>
          <dt>Special thanks</dt><dd>모든 프레임은 브라우저 안에서 코드로 렌더링되었습니다.</dd>
        </dl>
        <div class="es-final">
          <p class="es-end">THE END</p>
          <p class="es-endsub"><em>…or the next commit.</em></p>
          <a class="es-btn es-btn-hi" href="${esc(profileURL)}" target="_blank" rel="noopener noreferrer">GitHub에서 계속 보기 ↗</a>
          <small>${esc(profileURL.replace(/^https?:\/\//, ''))}</small>
        </div>
      </div>
    </div>
    <div class="es-open">
      <canvas class="es-leader" aria-hidden="true"></canvas>
      <div class="es-titlewrap">
        <p class="es-kick">METASONGI PICTURES <span>—</span> PRESENTS</p>
        <div class="es-title" style="--n:${titleN}" role="img" aria-label="The Developer Cut">
          ${half('es-ha')}${half('es-hb')}
          <svg class="es-slice" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="-2" y1="64" x2="102" y2="50" pathLength="1"/></svg>
        </div>
        <p class="es-sub"><em>a film in three projects</em><span>세 개의 프로젝트로 만든 한 편의 필름</span></p>
      </div>
      <p class="es-hint"><span>SCROLL TO ROLL</span><i></i></p>
    </div>
   </div>
   <div class="es-grain" aria-hidden="true"></div><div class="es-scan" aria-hidden="true"></div><div class="es-vig" aria-hidden="true"></div><div class="es-flash" aria-hidden="true"></div>
   <div class="es-hud">
     <div class="es-hudl" aria-hidden="true"><span class="es-rec"><i></i>REC</span><span class="es-tc">00:00:00:00</span></div>
     <div class="es-hudr" aria-live="polite"><b class="es-beat">SC 00 · COLD OPEN</b><span class="es-capt">${CHAPS[0].cap}</span></div>
     <nav class="es-chap" aria-label="장면 이동"><div class="es-chaptrack"><i class="es-chapfill"></i></div>${CHAPS.map((c, i) => `<button type="button" data-c="${i}" style="left:${c.at * 100}%" aria-label="${c.label}"><span>${c.label}</span></button>`).join('')}</nav>
   </div>
   <div class="es-tip" role="tooltip"></div>
  </div>
 </section>
</div>`;
}

/* ------------------------------------------------------------------ mount */
export function mount(root, { isPaused = () => false } = {}) {
  let disposed = false;
  const ac = new AbortController(), { signal } = ac;
  const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  try { window.scrollTo(0, 0); } catch { /* noop */ }

  if (reducedMQ.matches) {
    root.innerHTML = boardHTML(false);
    return () => { disposed = true; ac.abort(); root.innerHTML = ''; };
  }

  const mob = innerWidth < 760;
  const items = buildItems(mob);
  const titleN = letters('THE DEVELOPER').n + letters('CUT').n;
  const clips = clipSpecs();
  root.innerHTML = reelHTML(items, clips, mob);

  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const stage = $('.es-stage'), frameEl = $('.es-frame');
  const desk = $('.es-desk'), itemsWrap = $('.es-items'), deskword = $('.es-deskword');
  const bin = $('.es-bin'), binCount = $('.es-bincount');
  const nle = $('.es-nle'), viewer = $('.es-viewer'), vscreen = $('.es-vscreen'), vbars = $('.es-bars');
  const vimgs = $$('.es-vimg'), vtitle = $('.es-vtitle'), vtc = $('.es-vtc');
  const tl = $('.es-tl'), tltc = $('.es-tltc'), ph = $('.es-ph'), rbar = $('.es-rbar');
  const razorEl = $('.es-razor'), cutline = $('.es-cutline'), tools = $$('.es-tools i');
  const renderEl = $('.es-render'), rimgs = $$('.es-rprev img'), rframe = $('.es-rframe'), rprog = $('.es-rprog i'), rpct = $('.es-rpct'), reta = $('.es-reta'), rthumbs = $$('.es-rthumbs i');
  const cinema = $('.es-cinema'), scenes = $$('.es-scene'), lbs = $$('.es-lb');
  const cutto = $('.es-cutto'), cutno = $('.es-cutno');
  const credits = $('.es-credits'), roll = $('.es-roll'), finalEl = $('.es-final');
  const open = $('.es-open'), leader = $('.es-leader'), titleEl = $('.es-title'), halfA = $('.es-ha'), halfB = $('.es-hb'), slice = $('.es-slice line');
  const kick = $('.es-open .es-kick'), sub = $('.es-sub'), hint = $('.es-hint');
  const grain = $('.es-grain'), flashEl = $('.es-flash');
  const tcEl = $('.es-tc'), beatEl = $('.es-beat'), captEl = $('.es-capt'), chapFill = $('.es-chapfill'), chapBtns = $$('.es-chap button'), rec = $('.es-rec');
  const tip = $('.es-tip');

  items.list.forEach((it, i) => { it.el = itemsWrap.children[i]; });
  const byKey = Object.fromEntries(items.list.map(it => [it.key, it]));
  clips.forEach(c => {
    c.el = root.querySelector(`.es-clip[data-id="${c.id}"]`);
    c.srcItem = byKey[c.src] || items.list.find(it => it.key.startsWith(c.src.split('-')[0])) || items.list[0];
    c.land = c.f0 + FLY;
    c.slot = { x: 0, y: 0, w: 1, h: 1 };
  });
  const v1 = clips.filter(c => c.tr === 'V1'), v2 = clips.filter(c => c.tr === 'V2');
  const c2b = clips.find(c => c.id === 'c2b');
  const sceneData = scenes.map(el => ({ el, bg: el.querySelector('.es-sbg'), name: el.querySelector('.es-sname'), card: el.querySelector('.es-card'), slate: el.querySelector('.es-slate'), shade: el.querySelector('.es-shade'), N: +el.querySelector('.es-sname').style.getPropertyValue('--n') || 12 }));

  // ---- one-time canvas art: waveforms + film grain tile
  items.list.filter(it => it.type === 'audio').forEach(it => drawWave(it.el.querySelector('canvas'), 220, 54, it.seed));
  clips.filter(c => c.wave).forEach(c => {
    const cv = document.createElement('canvas');
    drawWave(cv, 420, 40, c.wave, c.tr === 'A2' ? 'rgba(200,200,195,.75)' : 'rgba(240,240,236,.9)');
    try { c.el.querySelector('.es-wave').style.backgroundImage = `url(${cv.toDataURL()})`; } catch { /* noop */ }
  });
  try {
    const g = document.createElement('canvas'); g.width = g.height = 160;
    const gx = g.getContext('2d'), img = gx.createImageData(160, 160), r = rng(42);
    for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 34; }
    gx.putImageData(img, 0, 0);
    grain.style.backgroundImage = `url(${g.toDataURL()})`;
  } catch { /* noop */ }

  // ---- cached style writer (only touches the DOM when a value changes)
  const S = (el, prop, val) => {
    const c = el.__es || (el.__es = {});
    if (c[prop] === val) return;
    c[prop] = val;
    el.style.setProperty(prop, val);
  };
  const R = (el, prop) => { if (el.__es) delete el.__es[prop]; el.style.removeProperty(prop); };
  const show = (el, on) => S(el, 'visibility', on ? 'visible' : 'hidden');

  // ---- layout
  let W = 1, H = 1, small = false, TOP = 136;
  let gatherRect, binEditRect, viewerRect, tlRect, screenRect = { x: 0, y: 0, w: 1, h: 1 };
  let rollStart = 0, rollEnd = 0, leaderW = 0, leaderH = 0, leaderDpr = 1, lctx = null;
  const lw = { gather: 110, edit: 64 };

  function poses() {
    const N = items.list.length;
    const cols = small ? 3 : 6, rowsN = Math.ceil(N / cols);
    const deskScale = small ? .56 : clamp(W / 1440, .72, 1.05);
    const top = -H / 2 + TOP + 10, bottom = H / 2 - 80, left = -W * .45, right = W * .45;
    const cw = (right - left) / cols, ch = (bottom - top) / rowsN;
    const order = items.list.map((it, i) => ({ i, k: it.rand[4] })).sort((a, b) => a.k - b.k);
    order.forEach(({ i }, slot) => {
      const it = items.list[i], r = it.rand;
      const ang = r[5] * Math.PI * 2, rad = Math.max(W, H) * (.85 + r[6] * .6);
      Object.assign(it.A, { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad, z: -2200 + r[7] * 2900, rx: (r[8] - .5) * 300, ry: (r[9] - .5) * 300, rz: (r[10] - .5) * 160, s: deskScale });
      const c = slot % cols, rw = Math.floor(slot / cols);
      Object.assign(it.Bp, { x: left + (c + .5) * cw + (r[11] - .5) * cw * .55, y: top + (rw + .5) * ch + (r[1] - .5) * ch * .5, z: -460 + r[2] * 560, rx: (r[3] - .5) * 18, ry: (r[4] - .5) * 26, rz: (r[5] - .5) * 34, s: deskScale });
      grid(it, gatherRect, lw.gather, it.C);
      if (small) Object.assign(it.D, { x: viewerRect.x + viewerRect.w / 2 - W / 2 + (r[6] - .5) * 60, y: viewerRect.y + viewerRect.h / 2 - H / 2 + (r[7] - .5) * 40, z: -300, rx: 0, ry: 0, rz: (r[8] - .5) * 20, s: .12 });
      else grid(it, binEditRect, lw.edit, it.D);
    });
  }
  function grid(it, rect, lbl, out) {
    const hdr = 36, rowH = (rect.h - hdr - 8) / 4, cellW = (rect.w - lbl - 10) / items.maxCols;
    const s = Math.min((cellW - 6) / it.w, (rowH - 10) / it.h);
    Object.assign(out, { x: rect.x + lbl + cellW * (it.col + .5) - W / 2, y: rect.y + hdr + rowH * (it.row + .5) - H / 2, z: 0, rx: 0, ry: 0, rz: 0, s });
  }

  function layout() {
    if (disposed) return;
    W = stage.clientWidth || innerWidth; H = stage.clientHeight || innerHeight;
    small = W < 900;
    TOP = H < 620 ? 118 : 136;
    const gw = Math.min(W - 32, 1180), gh = Math.max(240, Math.min(H - TOP - 74, 600));
    gatherRect = { x: (W - gw) / 2, y: TOP + Math.max(0, (H - TOP - 74 - gh) / 2), w: gw, h: gh };
    if (!small) {
      const topEnd = Math.round(TOP + (H - TOP - 60) * .56);
      binEditRect = { x: 16, y: TOP, w: Math.round(W * .3), h: topEnd - TOP };
      const ax = binEditRect.x + binEditRect.w + 16, aw = W - 16 - ax, ah = topEnd - TOP;
      const vw = Math.min(aw, (ah - 26) * 16 / 9);
      viewerRect = { x: ax + (aw - vw) / 2, y: TOP, w: vw, h: vw * 9 / 16 + 26 };
      tlRect = { x: 16, y: topEnd + 14, w: W - 32, h: Math.max(150, H - topEnd - 14 - 58) };
    } else {
      const vw = W - 32, vh = Math.min(vw * 9 / 16, (H - TOP) * .34);
      viewerRect = { x: 16 + (vw - vh * 16 / 9 > 0 ? (vw - vh * 16 / 9) / 2 : 0), y: TOP, w: Math.min(vw, vh * 16 / 9), h: vh + 26 };
      binEditRect = viewerRect;
      tlRect = { x: 16, y: TOP + viewerRect.h + 14, w: W - 32, h: Math.max(150, H - (TOP + viewerRect.h + 14) - 60) };
    }
    const place = (el, r) => { el.style.left = r.x + 'px'; el.style.top = r.y + 'px'; el.style.width = r.w + 'px'; el.style.height = r.h + 'px'; };
    place(viewer, viewerRect); place(tl, tlRect);
    stage.style.setProperty('--hw', small ? '34px' : '56px');

    // measure with every transform neutralised
    [frameEl, viewer, tl, ...clips.map(c => c.el)].forEach(el => R(el, 'transform'));
    const sr = stage.getBoundingClientRect();
    const rel = el => { const r = el.getBoundingClientRect(); return { x: r.left - sr.left, y: r.top - sr.top, w: r.width || 1, h: r.height || 1 }; };
    clips.forEach(c => { c.slot = rel(c.el); });
    screenRect = rel(vscreen);
    poses();

    // credits roll: starts below the frame, ends with the final card centred
    rollStart = H + 10;
    rollEnd = H / 2 - (finalEl.offsetTop + finalEl.offsetHeight / 2);

    // leader canvas (4:3 film frame)
    leaderW = Math.round(Math.min(W * .8, (H - 200) * 4 / 3, 620)); leaderH = Math.round(leaderW * .75);
    leaderDpr = Math.min(small ? 1.5 : 2, devicePixelRatio || 1);
    leader.width = leaderW * leaderDpr; leader.height = leaderH * leaderDpr;
    leader.style.width = leaderW + 'px'; leader.style.height = leaderH + 'px';
    lctx = leader.getContext('2d');
    lastLeader = '';
  }

  // ---- film leader
  let lastLeader = '';
  function drawLeader(num, frac, flick) {
    if (!lctx) return;
    const key = num + ':' + Math.round(frac * 120) + ':' + Math.round(flick * 6);
    if (key === lastLeader) return; lastLeader = key;
    const c = lctx, w = leaderW, h = leaderH, cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * .42;
    c.setTransform(leaderDpr, 0, 0, leaderDpr, 0, 0);
    const base = 150 + flick * 26 | 0;
    c.fillStyle = `rgb(${base},${base},${base - 4})`; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(40,40,40,.62)';
    c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, Math.hypot(w, h), -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(12,12,12,.85)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(0, cy); c.lineTo(w, cy); c.moveTo(cx, 0); c.lineTo(cx, h); c.stroke();
    c.strokeStyle = '#f2f2ee'; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R0, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R0 * .8, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#0b0b0b'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${Math.round(R0 * 1.25)}px Archivo, 'Arial Narrow', sans-serif`;
    c.fillText(String(num), cx, cy + R0 * .06);
    // dust & a scratch
    const r = rng(num * 97 + Math.round(flick * 13));
    c.fillStyle = 'rgba(10,10,10,.55)';
    for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(r() * w, r() * h, r() * 2.2 + .3, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(250,250,245,.4)'; c.fillRect(w * (.15 + r() * .7), 0, 1, h);
    c.font = `500 ${Math.max(10, Math.round(w * .022))}px 'JetBrains Mono', monospace`; c.fillStyle = 'rgba(10,10,10,.75)'; c.textAlign = 'left';
    c.fillText('PICTURE START', 14, 18); c.textAlign = 'right'; c.fillText('SMPTE UNIVERSAL', w - 14, h - 16);
  }

  // ---- state
  let target = 0, p = 0, clock = 0, introT = 0, last = performance.now(), frameNo = 0;
  let mx = 1e5, my = 1e5, smx = 0, smy = 0, nmx = 0, nmy = 0, snx = 0, sny = 0;
  let curTitle = -1, curBeat = -1, cutState = false, chapActive = -1, curCut = '';
  if (isPaused()) introT = 4.6;

  addEventListener('pointermove', e => {
    const sr = stage.getBoundingClientRect();
    mx = e.clientX - sr.left - sr.width / 2; my = e.clientY - sr.top - sr.height / 2;
    nmx = clamp(mx / (sr.width / 2), -1, 1); nmy = clamp(my / (sr.height / 2), -1, 1);
  }, { signal, passive: true });
  document.addEventListener('pointerleave', () => { mx = my = 1e5; nmx = nmy = 0; }, { signal });
  addEventListener('resize', () => { layout(); }, { signal });

  // timeline clip tooltip
  tl.addEventListener('pointerover', e => {
    const el = e.target.closest?.('.es-clip'); if (!el) return;
    const c = clips.find(k => k.el === el); if (!c) return;
    const dur = (c.b - c.a) * TOTAL_SEC;
    tip.innerHTML = `<b>${esc(c.name)}</b><span>${c.tr} · IN ${tc(c.a * TOTAL_SEC)} · OUT ${tc(c.b * TOTAL_SEC)}</span><span>DUR ${tc(dur)}${c.id === 'c2b' && cutState ? ' · RAZOR SPLIT' : ''}</span>`;
    tip.classList.add('is-on');
  }, { signal });
  tl.addEventListener('pointermove', e => {
    if (!tip.classList.contains('is-on')) return;
    const sr = stage.getBoundingClientRect();
    const x = clamp(e.clientX - sr.left + 14, 8, W - 250), y = clamp(e.clientY - sr.top - 74, 90, H - 80);
    tip.style.transform = `translate(${x}px,${y}px)`;
  }, { signal });
  tl.addEventListener('pointerout', e => { if (!e.relatedTarget?.closest?.('.es-clip')) tip.classList.remove('is-on'); }, { signal });

  // chapter jumps (Lenis when available)
  let st = null, lenis = null;
  const scrollToProgress = v => {
    if (!st) return;
    const y = st.start + v * (st.end - st.start) + (v >= 1 ? 2 : 1);
    if (lenis) lenis.scrollTo(y, { duration: 1.6 }); else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  chapBtns.forEach(btn => btn.addEventListener('click', () => scrollToProgress(CHAPS[+btn.dataset.c].go), { signal }));

  /* ---------------------------------------------------------------- render */
  function render(dt) {
    const paused = isPaused();
    if (!paused) clock += dt;
    if (!paused || introT >= 3) introT += dt;
    if (target > .012 && introT < 3) introT = 3;
    const d = target - p; p = Math.abs(d) < 5e-5 ? target : p + d * .2;
    frameNo++;

    let flash = 0, jitter = 0;

    /* ---- 1. cold open */
    const k0 = clamp(p / B.coldE);
    show(open, k0 < 1);
    if (k0 < 1) {
      const io = introT;
      const leaderOn = io < 3.02;
      show(leader, leaderOn);
      if (leaderOn) {
        S(leader, 'opacity', String(r2(smooth(0, .35, io))));
        const ct = Math.max(0, io - .3), num = clamp(3 - Math.floor(ct / .9), 1, 3), frac = io < .3 ? 0 : clamp((ct % .9) / .9);
        drawLeader(num, ct >= 2.7 ? 1 : frac, paused ? 0 : Math.random());
      }
      if (io >= 3 && io < 3.3) flash = Math.max(flash, 1 - (io - 3) / .3);
      const tT = clamp((io - 3.1) / .9), slT = eo(clamp((io - 3.75) / .4));
      S(titleEl, '--k', String(r2(tT)));
      S(slice, 'stroke-dashoffset', String(r2(1 - slT)));
      S(slice, 'opacity', String(r2(slT * (1 - k0))));
      const off = slT * 10 + e3(k0) * 140;
      S(halfA, 'transform', `translate(${r2(off * .35)}px,${r2(-off * .18)}px)`);
      S(halfB, 'transform', `translate(${r2(-off)}px,${r2(off * .3)}px)`);
      S(titleEl, 'transform', `scale(${r2(1 + e3(k0) * .45)})`);
      S(titleEl, '--rgb', String(r2(tT > 0 && tT < 1 ? (1 - ((tT * (titleN + 3)) % 1)) * 5 : 0) + k0 * 12));
      const ui = smooth(4, 4.6, io) * (1 - smooth(0, .4, k0));
      S(kick, 'opacity', String(r2(smooth(3.2, 3.8, io) * (1 - k0))));
      S(sub, 'opacity', String(r2(ui)));
      S(hint, 'opacity', String(r2(ui)));
      S(titleEl, 'opacity', String(r2(1 - smooth(.55, 1, k0))));
      if (io > 3 && io < 3.5) jitter = Math.max(jitter, (3.5 - io) * 2);
    } else show(leader, false);

    /* ---- 2–4. desk, bin, NLE */
    const deskOn = p > B.impS - .005 && p < B.expE + .01;
    show(desk, deskOn);
    const wordO = smooth(B.impS + .02, B.impS + .07, p) * (1 - smooth(B.gatS - .02, B.gatS + .03, p));
    show(deskword, wordO > .001);
    if (wordO > .001) S(deskword, 'opacity', String(r2(wordO))), S(deskword, 'transform', `translate(-50%,-50%) scale(${r2(.9 + (p - B.impS) * .9)})`);

    const deskW = smooth(B.impS + .06, B.impE - .02, p) * (1 - smooth(B.gatS, B.gatS + .04, p));
    smx += (mx - smx) * .12; smy += (my - smy) * .12; snx += (nmx - snx) * .06; sny += (nmy - sny) * .06;
    if (deskOn) {
      S(itemsWrap, 'transform', deskW > .001 ? `rotateX(${r2(-sny * 5 * deskW)}deg) rotateY(${r2(snx * 7 * deskW)}deg)` : 'none');
      let sorted = 0;
      for (const it of items.list) {
        const k1 = eo(clamp((p - (B.impS + it.d1 * .085)) / .055));
        if (k1 <= 0) { show(it.el, false); continue; }
        const k2r = clamp((p - (B.gatS + it.d2 * .05)) / .05), k2 = back(k2r);
        const k3 = e3(clamp((p - (B.editS + it.d3 * .03)) / .04));
        if (k2r >= 1) sorted++;
        const c = it.cur, A = it.A, Bp = it.Bp;
        for (const key in Bp) c[key] = A[key] + (Bp[key] - A[key]) * k1;
        // idle float + cursor repel/tilt on the messy desk
        const w = k1 * (1 - smooth(0, .35, k2r));
        if (w > .001) {
          c.y += Math.sin(clock * .9 + it.ph) * 7 * w; c.rz += Math.sin(clock * .6 + it.ph) * 1.6 * w;
          const f = 1100 / (1100 - c.z), sx = c.x * f, sy = c.y * f, dx = sx - smx, dy = sy - smy, dist = Math.hypot(dx, dy) || 1, Rr = small ? 140 : 240;
          const fo = clamp(1 - dist / Rr);
          it.px += ((dx / dist) * fo * fo * 130 - it.px) * .12; it.py += ((dy / dist) * fo * fo * 130 - it.py) * .12;
          it.tx += (-(dy / Rr) * 34 * fo - it.tx) * .12; it.ty += ((dx / Rr) * 34 * fo - it.ty) * .12;
          c.x += it.px * w; c.y += it.py * w; c.rx += it.tx * w; c.ry += it.ty * w; c.z += fo * 60 * w;
        }
        if (k2r > 0) for (const key in it.C) c[key] = c[key] + (it.C[key] - c[key]) * k2;
        if (k3 > 0) for (const key in it.D) c[key] = c[key] + (it.D[key] - c[key]) * k3;
        let o = small ? 1 - smooth(.4, 1, k3) : 1;
        o *= 1 - smooth(B.renE - .01, B.expS + .02, p);
        show(it.el, o > .01);
        S(it.el, 'opacity', String(r2(o)));
        S(it.el, 'transform', `translate3d(${r2(c.x)}px,${r2(c.y)}px,${r2(c.z)}px) rotateX(${r2(c.rx)}deg) rotateY(${r2(c.ry)}deg) rotateZ(${r2(c.rz)}deg) scale(${r2(c.s)})`);
      }
      const sc = `${String(sorted).padStart(2, '0')} / ${items.list.length} SORTED`;
      if (binCount.textContent !== sc) binCount.textContent = sc;
    }

    // bin panel
    const binO = smooth(B.gatS - .005, B.gatS + .035, p) * (small ? 1 - smooth(B.editS, B.editS + .03, p) : 1) * (1 - smooth(B.renE - .01, B.expS + .02, p));
    show(bin, binO > .001);
    if (binO > .001) {
      const ke = e3(clamp((p - B.editS) / .045));
      const rr = small ? gatherRect : { x: lerp(gatherRect.x, binEditRect.x, ke), y: lerp(gatherRect.y, binEditRect.y, ke), w: lerp(gatherRect.w, binEditRect.w, ke), h: lerp(gatherRect.h, binEditRect.h, ke) };
      S(bin, 'opacity', String(r2(binO)));
      S(bin, 'left', r2(rr.x) + 'px'); S(bin, 'top', r2(rr.y) + 'px'); S(bin, 'width', r2(rr.w) + 'px'); S(bin, 'height', r2(rr.h) + 'px');
      S(bin, '--lw', r2(small ? lw.gather : lerp(lw.gather, lw.edit, ke)) + 'px');
      S(bin, 'transform', `scale(${r2(.96 + .04 * smooth(B.gatS - .005, B.gatS + .04, p))})`);
    }

    // NLE assembly
    const asm = e3(clamp((p - B.editS) / .05));
    const nleOn = asm > 0 && p < B.expE + .005;
    show(nle, nleOn);
    S(tl, 'pointer-events', nleOn && p < B.renS ? 'auto' : 'none');
    let t = 0, rP = clamp((p - B.renS) / (B.renE - B.renS));
    if (nleOn) {
      const dim = 1 - .55 * smooth(0, .1, rP) * (1 - smooth(.9, 1, rP));
      S(viewer, 'opacity', String(r2(asm * dim)));
      S(viewer, 'transform', `translateY(${r2((1 - asm) * -30)}px) scale(${r2(.94 + .06 * asm)})`);
      S(tl, 'opacity', String(r2(asm * dim)));
      S(tl, 'transform', `translateY(${r2((1 - asm) * 70)}px)`);

      // clips fly from the bin and snap onto the tracks
      for (const c of clips) {
        const k = clamp((p - c.f0) / FLY);
        if (k <= 0) { S(c.el, 'opacity', '0'); continue; }
        S(c.el, 'opacity', '1');
        if (k < 1) {
          const ke = e3(k), src = c.srcItem.cur, sw = c.srcItem.w * src.s, sh = c.srcItem.h * src.s;
          const scx = W / 2 + src.x, scy = H / 2 + src.y, dcx = c.slot.x + c.slot.w / 2, dcy = c.slot.y + c.slot.h / 2;
          const dx = (scx - dcx) * (1 - ke), dy = (scy - dcy) * (1 - ke) - Math.sin(ke * Math.PI) * 50;
          S(c.el, 'transform', `translate(${r2(dx)}px,${r2(dy)}px) scale(${r2(lerp(sw / c.slot.w, 1, ke))},${r2(lerp(sh / c.slot.h, 1, ke))})`);
        } else S(c.el, 'transform', 'none');
        const fl = p >= c.land ? clamp(1 - (p - c.land) / .012) : 0;
        S(c.el, '--fl', String(r2(fl)));
        flash = Math.max(flash, fl * .12); jitter = Math.max(jitter, fl * .35);
      }
      // razor
      const rz = clamp((p - B.razS) / (B.razE - B.razS));
      const razorOn = rz > 0 && rz < 1;
      S(razorEl, 'opacity', String(r2(smooth(0, .15, rz) * (1 - smooth(.8, 1, rz)))));
      S(razorEl, 'transform', `translate(-50%,${r2(lerp(-46, -2, eo(clamp(rz / .45))))}px) rotate(${r2(-20 + 20 * eo(clamp(rz / .5)))}deg)`);
      const cutNow = rz >= .5;
      if (cutNow !== cutState) { cutState = cutNow; c2b.el.classList.toggle('is-cut', cutNow); }
      const cf = cutNow ? clamp(1 - (rz - .5) / .25) : 0;
      S(cutline, 'opacity', String(r2(cf)));
      if (cf > 0) { flash = Math.max(flash, cf * .22); jitter = Math.max(jitter, cf * .8); }
      const tool = razorOn ? 'razor' : (p > B.razE && p < B.renS ? 'select' : 'snap');
      if (tool !== curCut) { curCut = tool; tools.forEach(i => i.classList.toggle('is-on', i.dataset.tool === tool)); }

      // playhead: scrubs with scroll, rewinds to zero for the render
      t = p < B.scrS ? 0 : p < B.scrE ? (p - B.scrS) / (B.scrE - B.scrS) : 1;
      if (rP > 0) t = 1 - e3(clamp(rP / .18));
      S(ph, 'left', r2(t * 100) + '%');
      S(rbar, 'width', r2(clamp((rP - .08) / .78) * 100) + '%');
      const secs = t * TOTAL_SEC;
      const tcs = `${tc(secs)} / ${tc(TOTAL_SEC)}`;
      if (vtc.textContent !== tcs) { vtc.textContent = tcs; tltc.textContent = tc(secs); }

      // viewer frame = image under the playhead
      let vc = null;
      for (const c of v1) if (p >= c.land && t >= c.a && (t < c.b || (c.b === 1 && t <= 1))) { vc = c; break; }
      S(vbars, 'opacity', p < clips[0].land ? '1' : '0');
      vimgs.forEach((img, i) => {
        const on = vc && vc.img === i;
        S(img, 'opacity', on ? '1' : '0');
        if (on) {
          const u = clamp((t - vc.a) / (vc.b - vc.a)), dir = i % 2 ? -1 : 1;
          const base = vc.alt && cutState ? 1.55 : 1.06;
          S(img, 'transform', `scale(${r2(base + .14 * u)}) translate(${r2(dir * (u - .5) * 4)}%,${r2((u - .5) * -2)}%)`);
          S(img, 'transform-origin', vc.alt && cutState ? '68% 40%' : '50% 50%');
        }
      });
      let ti = -1, tu = 0;
      for (const c of v2) if (p >= c.land && t >= c.a && t <= c.b) { ti = c.title; tu = (t - c.a) / (c.b - c.a); }
      if (ti !== curTitle) {
        curTitle = ti;
        if (ti >= 0) { const pr = projects[ti]; vtitle.querySelector('small').textContent = `${pr.category} · 0${ti + 1}`; vtitle.querySelector('b').textContent = pr.name; vtitle.querySelector('p').textContent = pr.description; }
      }
      const to = ti >= 0 ? smooth(0, .14, tu) * (1 - smooth(.86, 1, tu)) : 0;
      S(vtitle, 'opacity', String(r2(to)));
      S(vtitle, 'transform', `translateY(${r2((1 - to) * 10)}px)`);
    }

    /* ---- 5. render */
    const renOn = rP > 0 && rP < 1;
    show(renderEl, renOn);
    if (renOn) {
      const vis = smooth(0, .1, rP) * (1 - smooth(.88, 1, rP)), prog = clamp((rP - .08) / .78);
      S(renderEl, 'opacity', String(r2(vis)));
      S(renderEl, 'transform', `translate(-50%,-50%) scale(${r2(.94 + .06 * vis)})`);
      S(rprog, 'transform', `scaleX(${r2(prog)})`);
      const pct = Math.floor(prog * 100) + '%';
      if (rpct.textContent !== pct) {
        rpct.textContent = pct;
        const fr = Math.floor(prog * 2160);
        rframe.textContent = `FRAME ${String(fr).padStart(4, '0')} / 2160`;
        reta.textContent = prog >= 1 ? 'DONE — 0 DROPPED FRAMES' : `ETA ${tc((1 - prog) * 12).slice(0, 8)}`;
        const fi = Math.floor(prog * 47), rr = rng(fi + 3);
        rimgs.forEach((im, i) => {
          const on = fi % 3 === i;
          im.style.opacity = on ? '1' : '0';
          if (on) im.style.transform = `scale(${(1.1 + rr() * .6).toFixed(2)}) translate(${((rr() - .5) * 12).toFixed(1)}%,${((rr() - .5) * 8).toFixed(1)}%)`;
        });
        const lit = Math.floor(prog * 12);
        rthumbs.forEach((th, i) => th.classList.toggle('is-lit', i < lit));
      }
      if (prog > 0 && prog < 1) jitter = Math.max(jitter, .15);
    }

    /* ---- 6. final cut */
    const cinOn = p > B.renE - .006 && p < B.credS + .03;
    show(cinema, cinOn);
    show(cutto, false);
    if (cinOn) {
      const ex = e3(clamp((p - B.expS) / (B.expE - B.expS)));
      const fadeIn = smooth(B.renE - .006, B.renE + .004, p), fadeOut = 1 - smooth(B.seqE, B.seqE + .02, p);
      S(cinema, 'opacity', String(r2(fadeIn * fadeOut)));
      const sr = screenRect;
      S(cinema, 'clip-path', ex >= 1 ? 'none' : `inset(${r2(sr.y * (1 - ex))}px ${r2((W - sr.x - sr.w) * (1 - ex))}px ${r2((H - sr.y - sr.h) * (1 - ex))}px ${r2(sr.x * (1 - ex))}px round ${r2(4 * (1 - ex))}px)`);
      const lbH = (small ? .07 : .105) * H * ex;
      lbs.forEach(l => S(l, 'height', r2(lbH) + 'px'));
      S(cinema, '--lb', r2((small ? .07 : .105) * H) + 'px');
      const L = (B.seqE - B.seqS) / 3;
      const raw = (p - B.seqS) / L;
      const j = clamp(Math.floor(raw), 0, 2), s = clamp(raw - j);
      sceneData.forEach((sd, i) => {
        const on = i === j;
        show(sd.el, on);
        if (!on) { S(sd.card, 'pointer-events', 'none'); return; }
        const N = sd.N;
        const slam = clamp((s - .05) / .32);
        const sh = e3(clamp((s - .42) / .14));
        const cd = eo(clamp((s - .5) / .12));
        const imp = slam > 0 && slam < 1 ? (1 - ((slam * (N + 3)) % 1)) : 0;
        const dir = i % 2 ? -1 : 1;
        S(sd.bg, 'transform', `scale(${r2(1.26 - .2 * s)}) translate(${r2(dir * (s - .5) * 5)}%,${r2((s - .5) * -2)}%)`);
        S(sd.shade, 'opacity', String(r2(.55 + .35 * cd)));
        S(sd.name, '--k', String(r2(slam)));
        S(sd.name, '--rgb', String(r2(imp * 9 + (s < .08 && i > 0 ? (1 - s / .08) * 16 : 0))));
        const scTo = small ? .82 : .5;
        S(sd.name, 'transform', `translate(-50%,-50%) translateY(${r2(-sh * H * (small ? .17 : .2))}px) scale(${r2(1 - sh * (1 - scTo))})`);
        S(sd.slate, 'opacity', String(r2(smooth(.02, .08, s))));
        S(sd.card, 'opacity', String(r2(cd)));
        S(sd.card, 'transform', `translate(-50%,${r2((1 - cd) * 40)}px)`);
        S(sd.card, 'pointer-events', cd > .5 ? 'auto' : 'none');
        jitter = Math.max(jitter, imp * .5);
        // kinetic "CUT TO:" frame + white flash at the start of scenes 2 and 3
        if (i > 0 && s < .035) {
          show(cutto, true);
          const lbl = `SCENE 0${i + 1}`;
          if (cutno.textContent !== lbl) cutno.textContent = lbl;
          jitter = Math.max(jitter, 1);
        } else if (i > 0 && s < .085) {
          flash = Math.max(flash, (1 - (s - .035) / .05) * .85);
          jitter = Math.max(jitter, (1 - (s - .035) / .05) * 1.4);
        }
      });
    } else sceneData.forEach(sd => { show(sd.el, false); S(sd.card, 'pointer-events', 'none'); });

    /* ---- 7. credits */
    const crO = smooth(B.seqE + .004, B.seqE + .024, p);
    show(credits, crO > .001);
    if (crO > .001) {
      S(credits, 'opacity', String(r2(crO)));
      const cr = clamp((p - B.credS) / (1 - B.credS));
      const y = lerp(rollStart, rollEnd, 1 - Math.pow(1 - cr, 1.7));
      S(roll, 'transform', `translateY(${r2(y)}px)`);
      S(credits, 'pointer-events', cr > .6 ? 'auto' : 'none');
    }

    /* ---- HUD */
    let bi = 0; CHAPS.forEach((c, i) => { if (p >= c.at - 1e-4) bi = i; });
    if (bi !== curBeat) {
      curBeat = bi; const c = CHAPS[bi];
      beatEl.textContent = `SC ${c.sc} · ${c.label}`; captEl.textContent = c.cap;
      chapBtns.forEach((b, i) => b.classList.toggle('is-on', i === bi));
    }
    S(chapFill, 'transform', `scaleX(${r2(p)})`);
    const tcs = tc(clock + p * TOTAL_SEC);
    if (tcEl.textContent !== tcs) tcEl.textContent = tcs;
    S(rec, '--blink', paused ? '1' : (Math.floor(clock * 1.6) % 2 ? '.25' : '1'));

    /* ---- FX: grain, flash, jitter */
    if (!paused && frameNo % 2 === 0) S(grain, 'background-position', `${(Math.random() * 160) | 0}px ${(Math.random() * 160) | 0}px`);
    S(flashEl, 'opacity', String(r2(clamp(flash))));
    if (jitter > .02 && !paused) {
      const a = jitter * 4;
      S(frameEl, 'transform', `translate(${r2((Math.random() - .5) * a)}px,${r2((Math.random() - .5) * a * .7)}px)`);
    } else S(frameEl, 'transform', 'none');
  }

  // ---- loop (own rAF until GSAP arrives, then gsap.ticker)
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
    requestAnimationFrame(() => { if (!disposed) { ScrollTrigger.refresh(); } });
  }).catch(err => {
    if (disposed) return;
    console.warn('[noir] motion libraries unavailable, showing storyboard', err);
    cancelAnimationFrame(raf); raf = 0;
    ac.abort();
    root.innerHTML = boardHTML(true);
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
    root.innerHTML = '';
  };
}
