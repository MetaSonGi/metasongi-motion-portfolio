// "The Build Journal" — world `editorial` (05). A living magazine.
// A real magazine lies on a lamp-lit desk. Scroll lifts it toward the camera, the cover curls open
// (CPU-bent page mesh, two-sided, casting soft shadows), the camera dives into each spread where a
// DOM layout takes over: kinetic serif headline, masked duotone imagery, flying pull quote,
// ink-bleed body columns and a specs box. Between features a contents ribbon scrolls sideways,
// ink floods the screen and tears away, the next page turns. Finale: the magazine closes onto its
// back cover with a colophon.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { projects, profileURL, about } from '../content.js?v=ten-worlds-1';

const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs'
};
const ART = { vrm: 'art/vrm.jpg', pixelle: 'art/glass.jpg', motion: 'art/orbit.jpg' };
const PAGES = [['04', '05'], ['10', '11'], ['16', '17']];
const INK = '#1c1310', PAPER = '#f3ebdd', ACC = '#ff5c3a';
const COLOPHON = [
  ['Editor & Code', 'MetaSonGi'],
  ['Typefaces', 'Instrument Serif · Archivo · JetBrains Mono · Noto Sans KR'],
  ['Printed with', 'Three.js r180 · GSAP · Lenis · Canvas 2D'],
  ['Inks', '아이보리 페이퍼 · 잉크 #1C1310 · 레드 오렌지 #FF5C3A'],
  ['Issue', 'No. 05 — The Build Journal, 2026']
];

/* ---------------------------------------------------------------- timeline (scroll vh) */
const TRACK_VH = 1180;           // 1080vh of travel
const END = 1080;
const FOV = 32;
const PW = 1, PH = 1.3, NS = 5, GAP = .0035, LZ = .18;
const SX = 40, SY = 10;
const TURN = [[110, 175], [420, 475], [715, 770], [950, 995], [985, 1030]];
const READ = [[215, 325], [510, 620], [805, 915]];
const SPREAD_IN = [[200, 215], [498, 510], [793, 805]];
const SPREAD_OUT = [395, 690, null];
const RIBBON = [[318, 392], [613, 687]];
const FLOOD = [[355, 395], [650, 690]];
const TEAR = [[396, 430], [691, 725]];
const FIN_DOM = [1042, 1072];
const STOPS = [0, 252, 547, 842, END];
const KEYS = [
  [0, 'DESK'], [30, 'DESK'], [110, 'HERO'], [175, 'OPEN'], [215, 'READ'],
  [395, 'READ'], [396, 'NEAR'], [430, 'OPEN'], [475, 'OPEN'], [510, 'READ'],
  [690, 'READ'], [691, 'NEAR'], [725, 'OPEN'], [770, 'OPEN'], [805, 'READ'],
  [915, 'READ'], [955, 'OPEN'], [1020, 'OPEN'], [1062, 'CLOSED'], [END + 1, 'CLOSED']
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (u, a, b) => clamp((u - a) / (b - a));
const ease = t => t * t * t * (t * (t * 6 - 15) + 10);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const sentences = t => String(t).split(/(?<=[.!?])\s+/).filter(Boolean);

/* ------------------------------------------------------------------------ markup */

function hlMarkup(name, cls = 'bj-hl') {
  const words = name.split(' ');
  return `<h2 class="${cls}" aria-label="${esc(name)}">${words.map((w, wi) =>
    `<span class="bj-w${wi === words.length - 1 ? ' is-it' : ''}" aria-hidden="true">${[...w].map(ch => `<span class="bj-c">${esc(ch)}</span>`).join('')}</span>`).join(' ')}</h2>`;
}

function bodyMarkup(p) {
  const s = sentences(p.body);
  const first = s[0] || '';
  const drop = [...first][0] || '';
  const rest = first.slice(drop.length);
  return `<p class="bj-body"><span class="bj-drop" aria-hidden="true">${esc(drop)}</span><span class="bj-s" style="--k:0"><span class="bj-sr">${esc(drop)}</span>${esc(rest)}</span> ${s.slice(1).map(x => `<span class="bj-s" style="--k:0">${esc(x)}</span>`).join(' ')}</p>
    <p class="bj-note"><b>편집자 주</b> ${esc(p.note)}</p>`;
}

function specsMarkup(p, i) {
  const rows = [['Section', p.category], ['Feature', `No. ${pad(i + 1)} / 03`], ...p.stack.map((s, k) => [k ? '' : 'Stack', s]), ['Pages', `p.${PAGES[i][0]}—${PAGES[i][1]}`]];
  return `<aside class="bj-specs" aria-label="사양"><h3><span>Specs</span><i>사양</i></h3><ul>${rows.map((r, k) => `<li style="--i:${k}"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></li>`).join('')}</ul>
    <a class="bj-link" href="${esc(p.url)}" target="_blank" rel="noopener" style="--i:${rows.length}">프로젝트 보기 <span aria-hidden="true">↗</span></a></aside>`;
}

function spreadMarkup(p, i) {
  return `
  <section class="bj-spread" data-s="${i}" aria-label="${esc(p.name)}" inert>
    <div class="bj-sp-inner">
      <figure class="bj-fig">
        <div class="bj-fig-wipe"></div>
        <div class="bj-fig-mask"><img src="${ART[p.id] || 'art/orbit.jpg'}" alt="${esc(p.name)} 대표 이미지" decoding="async"><i class="bj-duo"></i></div>
        <figcaption><span>FIG. ${pad(i + 1)}</span> ${esc(p.category)}</figcaption>
        <b class="bj-fig-num" aria-hidden="true">${pad(i + 1)}</b>
      </figure>
      <div class="bj-sp-text">
        <header class="bj-folio"><span>The Build Journal</span><span>Feature No. ${pad(i + 1)}</span><span>p.${PAGES[i][1]}</span></header>
        <p class="bj-kicker">${esc(p.category)} <i>—</i> Feature ${pad(i + 1)} of 03</p>
        ${hlMarkup(p.name)}
        <blockquote class="bj-pq"><span class="bj-q" aria-hidden="true">“</span>${esc(p.description)}<span class="bj-q bj-q--end" aria-hidden="true">”</span></blockquote>
        <div class="bj-cols">${bodyMarkup(p)}</div>
        ${specsMarkup(p, i)}
      </div>
    </div>
    <i class="bj-gutter" aria-hidden="true"></i>
  </section>`;
}

function tocRun(next) {
  const items = projects.map((p, j) => `<span class="bj-toc${j === next ? ' is-next' : ''}"><b>No.${pad(j + 1)}</b> ${esc(p.name)} <i>p.${PAGES[j][0]}</i></span>`);
  items.push(`<span class="bj-toc${next >= projects.length ? ' is-next' : ''}"><b>Fin</b> Colophon <i>p.24</i></span>`);
  return items.join('<em aria-hidden="true">✶</em>');
}

function ribbonMarkup(i) {
  const next = i + 1, p = projects[next];
  const mono = `CONTENTS · 차례 · NEXT → No.${pad(next + 1)} ${esc(p.category)} · TURN TO p.${PAGES[next][0]} · `;
  return `
  <div class="bj-ribbon" data-r="${i}" aria-hidden="true">
    <div class="bj-band bj-band--a"><div class="bj-band-track">${tocRun(next)}<em>✶</em>${tocRun(next)}<em>✶</em></div></div>
    <div class="bj-band bj-band--b"><div class="bj-band-track">${mono.repeat(6)}</div></div>
  </div>`;
}

function liveMarkup() {
  return `
  <div class="bj" data-no-kx>
    <canvas class="bj-gl" aria-hidden="true"></canvas>
    <div class="bj-vignette" aria-hidden="true"></div>
    <section class="bj-intro" aria-label="The Build Journal 표지">
      <p class="bj-mono bj-intro-kick"><span>World 05</span><i></i><span>A living magazine</span></p>
      <h1 class="bj-sr">The Build Journal — 페이지를 넘기며 읽는 개발 매거진</h1>
      <p class="bj-intro-side">책상 위에 이번 호가 놓여 있습니다.<br>스크롤해서 표지를 들어 올리고, 펼쳐 읽어 보세요.</p>
      <div class="bj-hint"><span>Scroll to open the issue</span><i></i></div>
    </section>
    ${projects.map(spreadMarkup).join('')}
    ${ribbonMarkup(0)}${ribbonMarkup(1)}
    <canvas class="bj-ink" aria-hidden="true"></canvas>
    <section class="bj-fin" aria-label="뒷표지와 판권" inert>
      <p class="bj-mono bj-fin-kick"><span>Back cover</span><i></i><span>Colophon · p.24</span></p>
      ${hlMarkup('Read the build, line by line.', 'bj-fin-title')}
      <p class="bj-fin-sub">${esc(about)}</p>
      <dl class="bj-colo">${COLOPHON.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <div class="bj-fin-actions">
        <a class="bj-btn bj-btn--ink" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 전체 코드 읽기 <span aria-hidden="true">↗</span></a>
        <button type="button" class="bj-btn" data-top>처음부터 다시 읽기 <span aria-hidden="true">↑</span></button>
      </div>
    </section>
    <div class="bj-grain" aria-hidden="true"></div>
    <canvas class="bj-trail" aria-hidden="true"></canvas>
    <div class="bj-hud">
      <p class="bj-mono bj-folio-hud" aria-live="polite"><b>p.01</b> <span>Cover — 표지</span></p>
      <div class="bj-bookmark" aria-hidden="true"><span>No.01</span></div>
      <button type="button" class="bj-corner" aria-label="다음 페이지로 넘기기"><i></i><span>Next ↗</span></button>
    </div>
    <svg class="bj-nib" viewBox="0 0 24 42" aria-hidden="true"><path d="M12 41 3.4 17.5C3.4 8 7 3.5 12 1c5 2.5 8.6 7 8.6 16.5Z"/><path class="bj-nib-slit" d="M12 40V19"/><circle cx="12" cy="17.5" r="2.2"/></svg>
    <p class="bj-loading bj-mono" aria-live="polite">인쇄소에서 이번 호를 찍는 중…</p>
    <div class="bj-track" style="height:${TRACK_VH}vh"></div>
  </div>`;
}

function staticMarkup() {
  return `
  <div class="bj bj--static" data-no-kx>
    <header class="bjs-cover">
      <p class="bj-mono bj-intro-kick"><span>World 05</span><i></i><span>Issue 05 · 2026</span></p>
      <h1 class="bjs-mast">The Build <em>Journal</em></h1>
      <p class="bjs-about">${esc(about)}</p>
      <ol class="bjs-toc">${projects.map((p, i) => `<li><b>No.${pad(i + 1)}</b> ${esc(p.name)} <i>p.${PAGES[i][0]}</i></li>`).join('')}<li><b>Fin</b> Colophon <i>p.24</i></li></ol>
    </header>
    ${projects.map((p, i) => `
    <article class="bjs-spread">
      <figure class="bj-fig"><div class="bj-fig-mask"><img src="${ART[p.id] || 'art/orbit.jpg'}" alt="${esc(p.name)} 대표 이미지" loading="lazy" decoding="async"><i class="bj-duo"></i></div><figcaption><span>FIG. ${pad(i + 1)}</span> ${esc(p.category)}</figcaption></figure>
      <div class="bj-sp-text">
        <header class="bj-folio"><span>The Build Journal</span><span>Feature No. ${pad(i + 1)}</span><span>p.${PAGES[i][1]}</span></header>
        <h2 class="bj-hl">${esc(p.name.split(' ').slice(0, -1).join(' '))} <em>${esc(p.name.split(' ').pop())}</em></h2>
        <blockquote class="bj-pq"><span class="bj-q" aria-hidden="true">“</span>${esc(p.description)}</blockquote>
        <div class="bj-cols">${bodyMarkup(p)}</div>
        ${specsMarkup(p, i)}
      </div>
    </article>`).join('')}
    <footer class="bjs-back">
      <h2 class="bj-fin-title">Read the build, <em>line by line.</em></h2>
      <dl class="bj-colo">${COLOPHON.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <a class="bj-btn bj-btn--ink" href="${esc(profileURL)}" target="_blank" rel="noopener">GitHub에서 전체 코드 읽기 <span aria-hidden="true">↗</span></a>
    </footer>
  </div>`;
}

/* ------------------------------------------------------------- canvas painters */

function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function paper(g, w, h, tone = PAPER) {
  g.fillStyle = tone; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 520; i++) {
    g.fillStyle = Math.random() < .5 ? `rgba(90,62,40,${rand(.02, .07)})` : `rgba(255,255,255,${rand(.03, .09)})`;
    g.fillRect(Math.random() * w, Math.random() * h, rand(.6, 1.8), rand(.6, 1.8));
  }
  g.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * w, y = Math.random() * h, a = Math.random() * Math.PI;
    g.strokeStyle = `rgba(110,80,50,${rand(.03, .07)})`;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12 + 4, x + Math.cos(a) * 26, y + Math.sin(a) * 26); g.stroke();
  }
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,60,30,.12)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}

const hex3 = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

function duotone(img, w, h, stops = ['#1a0e0a', '#c7401f', '#ffb48f', '#fbeee0']) {
  const c = cnv(w, h), g = c.getContext('2d', { willReadFrequently: true });
  if (!img) { g.fillStyle = '#c7401f'; g.fillRect(0, 0, w, h); return c; }
  const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
  g.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  const d = g.getImageData(0, 0, w, h), a = d.data, S = stops.map(hex3), n = S.length - 1;
  for (let i = 0; i < a.length; i += 4) {
    let l = (a[i] * .299 + a[i + 1] * .587 + a[i + 2] * .114) / 255;
    l = clamp((l - .08) * 1.18);
    const f = l * n, k = Math.min(n - 1, Math.floor(f)), t = f - k, A = S[k], B = S[k + 1];
    a[i] = A[0] + (B[0] - A[0]) * t; a[i + 1] = A[1] + (B[1] - A[1]) * t; a[i + 2] = A[2] + (B[2] - A[2]) * t;
  }
  g.putImageData(d, 0, 0);
  return c;
}

function fitFont(g, text, font, maxW, start) {
  let size = start;
  g.font = font.replace('{s}', size);
  const w = g.measureText(text).width;
  if (w > maxW) { size = Math.floor(size * maxW / w); g.font = font.replace('{s}', size); }
  return size;
}

function wrap(g, text, x, y, maxW, lh, maxLines = 99) {
  const tokens = String(text).split(/(\s+)/);
  let line = '', lines = [];
  const push = () => { lines.push(line.trimEnd()); line = ''; };
  for (const tk of tokens) {
    if (g.measureText(line + tk).width <= maxW) { line += tk; continue; }
    if (line.trim()) push();
    if (g.measureText(tk).width > maxW) {
      for (const ch of tk) { if (g.measureText(line + ch).width > maxW) push(); line += ch; }
    } else line = tk.trimStart();
  }
  if (line.trim()) push();
  lines = lines.slice(0, maxLines);
  lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
  return y + lines.length * lh;
}

function mono(g, text, x, y, size, color, spacing = .18, align = 'left') {
  g.font = `500 ${size}px "JetBrains Mono", monospace`; g.fillStyle = color;
  const chars = [...String(text).toUpperCase()];
  const sp = size * spacing, total = chars.reduce((s, c) => s + g.measureText(c).width + sp, 0) - sp;
  let cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  for (const c of chars) { g.fillText(c, cx, y); cx += g.measureText(c).width + sp; }
}

function barcode(g, x, y, w, h, fg = INK, bg = PAPER) {
  g.fillStyle = bg; g.fillRect(x - 10, y - 10, w + 20, h + 40);
  let cx = x; g.fillStyle = fg;
  while (cx < x + w) { const bw = [2, 2, 3, 5][Math.floor(Math.random() * 4)]; if (Math.random() > .35) g.fillRect(cx, y, bw, h); cx += bw + 2; }
  mono(g, '9 772384 105004', x + w / 2, y + h + 22, 14, fg, .12, 'center');
}

function paintCover(c, img) {
  const w = c.width, h = c.height, g = c.getContext('2d'), u = w / 1024;
  paper(g, w, h, '#f4ecdf');
  mono(g, 'Issue 05 — Winter 2026', 44 * u, 58 * u, 15 * u, INK);
  mono(g, 'MetaSonGi Editions', w - 44 * u, 58 * u, 15 * u, INK, .18, 'right');
  g.fillStyle = INK; g.fillRect(44 * u, 74 * u, w - 88 * u, 2 * u);
  // masthead
  g.textBaseline = 'alphabetic'; g.fillStyle = INK;
  const ms = fitFont(g, 'The Build', '400 {s}px "Instrument Serif", Georgia, serif', w - 70 * u, 330 * u);
  g.fillText('The Build', 32 * u, 76 * u + ms * .82);
  // photo with arch
  const px = 300 * u, py = 300 * u, pw = w - px - 44 * u, ph = h - py - 150 * u;
  const duo = duotone(img, Math.round(pw), Math.round(ph));
  g.save(); g.beginPath();
  g.moveTo(px, py + pw / 2); g.arc(px + pw / 2, py + pw / 2, pw / 2, Math.PI, 0); g.lineTo(px + pw, py + ph); g.lineTo(px, py + ph); g.closePath(); g.clip();
  g.drawImage(duo, px, py); g.restore();
  // journal italic over the photo
  g.fillStyle = ACC;
  const js = fitFont(g, 'Journal', 'italic 400 {s}px "Instrument Serif", Georgia, serif', w * .74, 300 * u);
  g.save(); g.shadowColor = 'rgba(40,10,0,.25)'; g.shadowBlur = 30 * u; g.fillText('Journal', 170 * u, py + js * .62); g.restore();
  // cover lines
  const lines = [['No.01', 'A face that\nlistens.', 'p.04'], ['No.02', 'Pipelines for\nsynthetic actors.', 'p.10'], ['No.03', 'Ten worlds,\none developer.', 'p.16']];
  let ly = py + 330 * u;
  for (const [n, t, pg] of lines) {
    mono(g, n + ' · ' + pg, 44 * u, ly, 14 * u, ACC);
    g.fillStyle = INK; g.font = `400 ${40 * u}px "Instrument Serif", Georgia, serif`;
    t.split('\n').forEach((s, k) => g.fillText(s, 44 * u, ly + 46 * u + k * 40 * u));
    ly += 168 * u;
  }
  // big cover line bottom
  g.fillStyle = PAPER; g.font = `italic 400 ${66 * u}px "Instrument Serif", Georgia, serif`;
  g.save(); g.shadowColor = 'rgba(20,6,0,.5)'; g.shadowBlur = 24 * u;
  g.fillText('Read the build,', px + 36 * u, py + ph - 110 * u); g.fillText('line by line.', px + 36 * u, py + ph - 46 * u); g.restore();
  barcode(g, 44 * u, h - 118 * u, 170 * u, 56 * u);
  mono(g, 'Ten worlds, one developer', w - 44 * u, h - 74 * u, 14 * u, INK, .2, 'right');
  mono(g, '₩0 — Read online, free', w - 44 * u, h - 48 * u, 14 * u, ACC, .2, 'right');
}

function paintImagePage(c, img, p, i) {
  const w = c.width, h = c.height, g = c.getContext('2d'), u = w / 1024;
  g.drawImage(duotone(img, w, h), 0, 0);
  const gr = g.createLinearGradient(0, h * .55, 0, h); gr.addColorStop(0, 'rgba(20,8,4,0)'); gr.addColorStop(1, 'rgba(20,8,4,.7)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(251,238,224,.92)'; g.font = `italic 400 ${300 * u}px "Instrument Serif", Georgia, serif`;
  g.fillText(pad(i + 1), 40 * u, 300 * u);
  mono(g, `Fig. ${pad(i + 1)} — ${p.category}`, 44 * u, h - 90 * u, 15 * u, PAPER);
  mono(g, `p.${PAGES[i][0]}`, 44 * u, h - 52 * u, 15 * u, PAPER);
  const sh = g.createLinearGradient(w - 90 * u, 0, w, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)');
  g.fillStyle = sh; g.fillRect(w - 90 * u, 0, 90 * u, h);
}

function paintTextPage(c, p, i) {
  const w = c.width, h = c.height, g = c.getContext('2d'), u = w / 1024, m = 72 * u;
  paper(g, w, h);
  const sh = g.createLinearGradient(0, 0, 90 * u, 0); sh.addColorStop(0, 'rgba(60,30,10,.22)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(0, 0, 90 * u, h);
  mono(g, 'The Build Journal', m, 70 * u, 13 * u, INK);
  mono(g, `Feature No. ${pad(i + 1)}`, w - m, 70 * u, 13 * u, INK, .18, 'right');
  g.fillStyle = INK; g.fillRect(m, 86 * u, w - 2 * m, 1.5 * u);
  mono(g, p.category, m, 150 * u, 15 * u, ACC);
  const words = p.name.split(' '), last = words.pop();
  g.fillStyle = INK; g.font = `400 ${118 * u}px "Instrument Serif", Georgia, serif`;
  let y = 262 * u;
  y = wrap(g, words.join(' '), m, y, w - 2 * m, 104 * u);
  g.fillStyle = ACC; g.font = `italic 400 ${118 * u}px "Instrument Serif", Georgia, serif`;
  g.fillText(last, m, y); y += 70 * u;
  g.fillStyle = ACC; g.font = `400 ${120 * u}px "Instrument Serif", Georgia, serif`; g.fillText('“', m - 6 * u, y + 64 * u);
  g.fillStyle = INK; g.font = `500 ${34 * u}px "Noto Sans KR", sans-serif`;
  y = wrap(g, p.description, m + 70 * u, y + 30 * u, w - 2 * m - 70 * u, 50 * u, 3) + 30 * u;
  g.fillStyle = 'rgba(28,19,16,.25)'; g.fillRect(m, y, w - 2 * m, 1 * u); y += 50 * u;
  // two columns with drop cap
  const colW = (w - 2 * m - 40 * u) / 2, body = p.body + ' ' + p.note;
  g.fillStyle = ACC; g.font = `400 ${118 * u}px "Instrument Serif", "Noto Sans KR", serif`;
  const drop = [...body][0]; g.fillText(drop, m, y + 72 * u);
  const dw = g.measureText(drop).width + 14 * u;
  g.fillStyle = 'rgba(28,19,16,.82)'; g.font = `400 ${21 * u}px "Noto Sans KR", sans-serif`;
  const lh = 35 * u, rest = body.slice(drop.length);
  // simple char-flow: first 3 lines indented for the drop cap, then flow into columns
  const lines = []; let line = '', lineIdx = 0;
  const maxFor = k => (k < 3 ? colW - dw : colW);
  for (const ch of rest) { if (g.measureText(line + ch).width > maxFor(lineIdx)) { lines.push(line); line = ''; lineIdx++; } line += ch; }
  if (line) lines.push(line);
  const perCol = Math.max(4, Math.floor((h - y - 330 * u) / lh));
  lines.slice(0, perCol * 2).forEach((l, k) => {
    const col = k < perCol ? 0 : 1, row = col ? k - perCol : k;
    const x = m + col * (colW + 40 * u) + (k < 3 ? dw : 0);
    g.fillText(l, x, y + 22 * u + row * lh);
  });
  g.fillStyle = 'rgba(28,19,16,.18)'; g.fillRect(m + colW + 20 * u, y, 1 * u, perCol * lh);
  // specs box
  const by = h - 270 * u, bh = 170 * u;
  g.strokeStyle = INK; g.lineWidth = 2 * u; g.strokeRect(m, by, w - 2 * m, bh);
  g.fillStyle = INK; g.font = `italic 400 ${44 * u}px "Instrument Serif", serif`; g.fillText('Specs', m + 26 * u, by + 58 * u);
  p.stack.forEach((s, k) => mono(g, s, m + 26 * u + (k % 2) * 300 * u, by + 100 * u + Math.floor(k / 2) * 34 * u, 15 * u, INK));
  g.fillStyle = ACC; g.font = `500 ${24 * u}px "Noto Sans KR", sans-serif`; g.textAlign = 'right';
  g.fillText('프로젝트 보기 ↗', w - m - 26 * u, by + 58 * u); g.textAlign = 'left';
  mono(g, `p.${PAGES[i][1]}`, w - m, h - 52 * u, 15 * u, INK, .18, 'right');
}

function paintColophon(c) {
  const w = c.width, h = c.height, g = c.getContext('2d'), u = w / 1024, m = 80 * u;
  paper(g, w, h);
  mono(g, 'Colophon · 판권', m, 110 * u, 15 * u, ACC);
  g.fillStyle = INK; g.font = `400 ${150 * u}px "Instrument Serif", serif`; g.fillText('Colophon', m, 270 * u);
  let y = 380 * u;
  for (const [k, v] of COLOPHON) {
    g.fillStyle = 'rgba(28,19,16,.3)'; g.fillRect(m, y - 40 * u, w - 2 * m, 1 * u);
    mono(g, k, m, y, 13 * u, ACC);
    g.fillStyle = INK; g.font = `400 ${26 * u}px "Noto Sans KR", sans-serif`; wrap(g, v, m, y + 44 * u, w - 2 * m, 36 * u, 2);
    y += 150 * u;
  }
  g.fillStyle = INK; g.font = `italic 400 ${54 * u}px "Instrument Serif", serif`; g.fillText('Read the build, line by line.', m, h - 120 * u);
  mono(g, 'p.23', m, h - 52 * u, 15 * u, INK);
}

function paintInsideBack(c) {
  const w = c.width, h = c.height, g = c.getContext('2d'), u = w / 1024, m = 72 * u;
  paper(g, w, h, '#efe4d2');
  g.fillStyle = INK; g.fillRect(m, m, w - 2 * m, h - 2 * m);
  g.fillStyle = ACC; g.font = `italic 400 ${230 * u}px "Instrument Serif", serif`;
  g.fillText('Keep', m + 50 * u, 420 * u); g.fillText('building.', m + 50 * u, 620 * u);
  g.fillStyle = PAPER; g.font = `500 ${30 * u}px "Noto Sans KR", sans-serif`;
  wrap(g, '모든 작업의 코드는 GitHub에 열려 있습니다. 다음 호는 커밋 로그에서 이어집니다.', m + 54 * u, 760 * u, w - 2 * m - 108 * u, 48 * u, 4);
  mono(g, 'github.com/MetaSonGi', m + 54 * u, h - m - 60 * u, 18 * u, PAPER);
}

function paintBackCover(c) {
  const w = c.width, h = c.height, g = c.getContext('2d'), u = w / 1024, m = 60 * u;
  paper(g, w, h, ACC);
  g.fillStyle = 'rgba(28,19,16,.08)';
  for (let i = 0; i < 26; i++) g.fillRect(0, i * h / 26, w, 1 * u);
  mono(g, 'The Build Journal — Issue 05', m, 80 * u, 15 * u, INK);
  g.fillStyle = INK;
  const s = fitFont(g, 'Read the build,', '400 {s}px "Instrument Serif", serif', w - 2 * m, 190 * u);
  g.fillText('Read the build,', m, 420 * u);
  g.fillStyle = PAPER; g.font = `italic 400 ${s}px "Instrument Serif", serif`; g.fillText('line by line.', m, 420 * u + s * .95);
  g.fillStyle = INK; g.font = `500 ${26 * u}px "Noto Sans KR", sans-serif`;
  wrap(g, '코드로 동작을 만들고, 인터랙션으로 경험을 만듭니다.', m, 820 * u, w * .6, 40 * u, 3);
  barcode(g, w - m - 220 * u, h - 190 * u, 220 * u, 80 * u, INK, PAPER);
  mono(g, 'MetaSonGi — 2026', m, h - 70 * u, 15 * u, INK);
}

function paintDesk(c) {
  const w = c.width, h = c.height, g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a271c'); gr.addColorStop(1, '#2a1b13');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    const y = Math.random() * h, amp = rand(2, 9), f = rand(.004, .012), ph = Math.random() * 6;
    g.strokeStyle = Math.random() < .5 ? `rgba(20,10,5,${rand(.08, .22)})` : `rgba(120,80,50,${rand(.04, .12)})`;
    g.lineWidth = rand(.6, 2.6); g.beginPath();
    for (let x = 0; x <= w; x += 16) { const yy = y + Math.sin(x * f + ph) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
    g.stroke();
  }
  for (let i = 0; i < w * h / 300; i++) { g.fillStyle = `rgba(0,0,0,${rand(.03, .1)})`; g.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2); }
}

function paintRing(c) {
  const w = c.width, g = c.getContext('2d');
  g.clearRect(0, 0, w, w);
  for (let k = 0; k < 3; k++) {
    g.strokeStyle = `rgba(30,12,4,${.22 - k * .06})`; g.lineWidth = w * (.03 + k * .015);
    g.beginPath(); g.arc(w / 2 + k * 3, w / 2 - k * 2, w * (.38 - k * .01), rand(0, .6), Math.PI * rand(1.6, 2)); g.stroke();
  }
}

function paintNotes(c, lines) {
  const w = c.width, h = c.height, g = c.getContext('2d'), u = w / 512;
  paper(g, w, h, '#efe7d6');
  g.strokeStyle = 'rgba(80,120,170,.25)'; g.lineWidth = 1;
  for (let y = 70 * u; y < h; y += 34 * u) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = 'rgba(28,19,16,.78)';
  lines.forEach((l, k) => {
    g.font = `italic 400 ${30 * u}px "Instrument Serif", serif`;
    g.save(); g.translate(40 * u, 100 * u + k * 68 * u); g.rotate(rand(-.03, .03)); g.fillText(l, 0, 0); g.restore();
  });
  g.strokeStyle = ACC; g.lineWidth = 3 * u; g.beginPath(); g.ellipse(w * .62, h * .76, 120 * u, 44 * u, -.1, 0, Math.PI * 1.9); g.stroke();
}

function grainURL() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .12  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* ------------------------------------------------------------------------- mount */

export function mount(root, { isPaused = () => false } = {}) {
  let disposed = false;
  const ac = new AbortController(), signal = ac.signal;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let teardown = () => {};
  const goStatic = () => { root.innerHTML = staticMarkup(); };

  if (reduce) { goStatic(); return () => { disposed = true; ac.abort(); root.innerHTML = ''; }; }

  root.innerHTML = liveMarkup();
  const el = root.querySelector('.bj');
  const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
  $('.bj-grain').style.backgroundImage = grainURL();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('.bj-gl'), antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch {
    renderer = null; goStatic();
    return () => { disposed = true; ac.abort(); root.innerHTML = ''; };
  }

  init().catch(err => {
    console.warn('[journal] falling back to static magazine', err);
    if (!disposed) { try { teardown(); } catch { /* noop */ } teardown = () => {}; goStatic(); }
  });

  async function init() {
    const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    const finePointer = matchMedia('(pointer: fine)').matches;
    const loadImg = src => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const fonts = ['400 100px "Instrument Serif"', 'italic 400 100px "Instrument Serif"', '500 20px "JetBrains Mono"', '400 20px "Noto Sans KR"', '500 20px "Noto Sans KR"', '800 60px Archivo'];
    const fontReady = Promise.race([Promise.all(fonts.map(f => document.fonts?.load?.(f, 'Ab가'))), new Promise(r => setTimeout(r, 2500))]).catch(() => {});
    const libsP = Promise.all([import(LIBS.gsap), import(LIBS.st), import(LIBS.lenis)]).catch(() => null);
    const [images, libs] = await Promise.all([Promise.all(projects.map(p => loadImg(ART[p.id] || 'art/orbit.jpg'))), libsP, fontReady]);
    if (disposed) return;

    /* ---------------- renderer / scene */
    const DPR = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
    renderer.setPixelRatio(DPR);
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#160e0a');
    const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, .02, 60);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, .04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = .28;

    const owned = { tex: [], geo: [], mat: [] };
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const mkTex = (c, back = false) => {
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
      if (back) { t.repeat.x = -1; t.offset.x = 1; }
      owned.tex.push(t); return t;
    };

    // lights
    const hemi = new THREE.HemisphereLight('#fff1df', '#2a1810', .55); scene.add(hemi);
    const spot = new THREE.SpotLight('#ffe3c2', 3.2, 0, .62, .85, 0);
    spot.position.set(-1.4, 1.5, 4.6); spot.target.position.set(.15, -.1, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
    spot.shadow.bias = -.0004; spot.shadow.normalBias = .012; spot.shadow.camera.near = 1; spot.shadow.camera.far = 12; spot.shadow.radius = 6;
    scene.add(spot, spot.target);
    const fill = new THREE.DirectionalLight('#ffd6b0', .35); fill.position.set(2, -2, 3); scene.add(fill);

    // desk
    const deskC = cnv(1024, 1024); paintDesk(deskC);
    const deskT = mkTex(deskC); deskT.wrapS = deskT.wrapT = THREE.RepeatWrapping; deskT.repeat.set(3, 3);
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: deskT, roughness: .62, metalness: 0 }));
    desk.receiveShadow = true; scene.add(desk);
    const ringC = cnv(256, 256); paintRing(ringC);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), new THREE.MeshBasicMaterial({ map: mkTex(ringC), transparent: true, depthWrite: false }));
    ring.position.set(1.25, .82, .001); scene.add(ring);
    // loose notes
    const noteData = [
      { lines: ['ideas — line by line', 'VRM lipsync → volume', 'ten worlds? ✓', 'ship the issue'], pos: [-1.18, .42, .003], rot: .34 },
      { lines: ['p.04  face', 'p.10  pipeline', 'p.16  worlds', 'colophon …'], pos: [1.02, -.62, .005], rot: -.3 }
    ];
    for (const n of noteData) {
      const c = cnv(512, 660); paintNotes(c, n.lines);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.78, 1.0), new THREE.MeshStandardMaterial({ map: mkTex(c), roughness: .9 }));
      m.position.set(...n.pos); m.rotation.z = n.rot; m.receiveShadow = true; m.castShadow = true; scene.add(m);
    }
    // fountain pen
    const pen = new THREE.Group();
    const lacquer = new THREE.MeshStandardMaterial({ color: '#120c0a', roughness: .22, metalness: .1 });
    const gold = new THREE.MeshStandardMaterial({ color: '#d9a35a', roughness: .28, metalness: 1 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.024, .021, .46, 28), lacquer);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.026, .026, .2, 28), lacquer); cap.position.y = .3;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.0268, .0268, .018, 28), gold); band.position.y = .21;
    const clip = new THREE.Mesh(new THREE.BoxGeometry(.008, .15, .01), gold); clip.position.set(0, .31, .028);
    const nib = new THREE.Mesh(new THREE.ConeGeometry(.017, .085, 24), gold); nib.position.y = -.27; nib.rotation.x = Math.PI; nib.scale.z = .45;
    pen.add(body, cap, band, clip, nib);
    pen.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    pen.rotation.set(0, 0, -.6); pen.position.set(1.12, .08, .027);
    scene.add(pen);

    /* ---------------- the magazine */
    const TW = coarse ? 640 : 1024, TH = Math.round(TW * PH);
    const faceC = () => cnv(TW, TH);
    const cCover = faceC(); paintCover(cCover, images[0]);
    const cImg = projects.map((p, i) => { const c = faceC(); paintImagePage(c, images[i], p, i); return c; });
    const cTxt = projects.map((p, i) => { const c = faceC(); paintTextPage(c, p, i); return c; });
    const cCol = faceC(); paintColophon(cCol);
    const cIB = faceC(); paintInsideBack(cIB);
    const cBack = faceC(); paintBackCover(cBack);
    const faces = [[cCover, cImg[0]], [cTxt[0], cImg[1]], [cTxt[1], cImg[2]], [cTxt[2], cCol], [cIB, cBack]];

    const holder = new THREE.Group(); scene.add(holder);       // positioned at magazine centre
    const book = new THREE.Group(); holder.add(book);          // offset by pivot so spine is local x=0
    const edgeMat = new THREE.MeshStandardMaterial({ color: '#e7dcc8', roughness: .95 });
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const blockR = new THREE.Mesh(boxGeo, edgeMat), blockL = new THREE.Mesh(boxGeo, edgeMat);
    [blockR, blockL].forEach(b => { b.castShadow = true; b.receiveShadow = true; book.add(b); });
    const sheets = faces.map(([f, b], k) => {
      const geo = new THREE.PlaneGeometry(PW, PH, SX, SY); geo.translate(PW / 2, 0, 0);
      const fm = new THREE.MeshStandardMaterial({ map: mkTex(f), roughness: .86, metalness: 0, side: THREE.FrontSide });
      fm.shadowSide = THREE.DoubleSide;
      const bm = new THREE.MeshStandardMaterial({ map: mkTex(b, true), roughness: .86, metalness: 0, side: THREE.BackSide });
      const front = new THREE.Mesh(geo, fm), back = new THREE.Mesh(geo, bm);
      front.castShadow = true; front.receiveShadow = true; back.receiveShadow = true;
      book.add(front, back);
      owned.geo.push(geo); owned.mat.push(fm, bm);
      return { k, geo, front, back, lastT: -1, lastZ: -1 };
    });
    // soft contact shadow
    const blobC = cnv(256, 256); { const g = blobC.getContext('2d'); const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(.55, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: mkTex(blobC), transparent: true, depthWrite: false, opacity: .6 }));
    blob.position.z = .0015; scene.add(blob);

    const C_BEND = 1.35, DG = .55;
    function bend(S, T, zh) {
      if (Math.abs(S.lastT - T) < 1e-5 && Math.abs(S.lastZ - zh) < 1e-6) return;
      S.lastT = T; S.lastZ = zh;
      const attr = S.geo.attributes.position, a = attr.array, cols = SX + 1, ds = PW / SX;
      for (let j = 0; j <= SY; j++) {
        const yn = 1 - j / SY;
        let x = 0, z = 0, aPrev = 0;
        for (let i = 0; i <= SX; i++) {
          const s = i / SX;
          const e = (1 + C_BEND * (1 - s)) * (1 + DG * (yn - .5) * s);
          const ang = T <= 0 ? 0 : T >= 1 ? Math.PI : Math.PI * Math.pow(T, e);
          if (i > 0) { const am = (ang + aPrev) / 2; x += ds * Math.cos(am); z += ds * Math.sin(am); }
          aPrev = ang;
          const idx = (j * cols + i) * 3; a[idx] = x; a[idx + 2] = z + zh;
        }
      }
      attr.needsUpdate = true; S.geo.computeVertexNormals(); S.geo.computeBoundingSphere();
    }

    /* ---------------- poses */
    let poses;
    const TANH = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    function computePoses() {
      const asp = innerWidth / innerHeight, mobile = asp < .8;
      const fit = (w, h, m) => Math.max(h * m / TANH, w * m / (TANH * asp));
      const cover = (w, h) => Math.min(h / TANH, w / (TANH * asp));
      const hero = fit(PW, PH, mobile ? 1.18 : 1.32), open = fit(2 * PW, PH, mobile ? 1.06 : 1.14);
      const read = mobile ? cover(PW, PH) * .985 : cover(2 * PW, PH) * .985, rx = mobile ? .5 : 0;
      const P = (cam, look, up, ctr, pivot, yaw = 0, tilt = 0) => ({ v: [...cam, ...look, ...up, ...ctr, pivot, yaw, tilt] });
      const dk = hero * 1.12;
      const out = {
        DESK: P([.38, -dk * .78, dk * .62], [.08, .02, 0], [0, 0, 1], [.06, .02, .021], .5, -.2, 0),
        HERO: P([0, 0, LZ + hero], [0, 0, LZ], [0, 1, 0], [0, 0, LZ], .5),
        OPEN: P([0, 0, LZ + open], [0, 0, LZ], [0, 1, 0], [0, 0, LZ], 0),
        READ: P([rx, 0, LZ + read], [rx, 0, LZ], [0, 1, 0], [0, 0, LZ], 0)
      };
      out.NEAR = { v: out.READ.v.map((x, i) => lerp(x, out.OPEN.v[i], .42)) };
      let cd, lx = 0, ly = 0;
      if (mobile) {
        const visH = Math.max(PH * 1.1 / .5, PW * 1.14 / asp); cd = visH / TANH; ly = -visH * (.5 - .29);
      } else {
        const visH = PH * 1.42; cd = visH / TANH; lx = visH * asp * (.5 - .31);
      }
      out.CLOSED = P([lx, ly, LZ * .6 + cd], [lx, ly, LZ * .6], [0, 1, 0], [0, 0, LZ * .6], -.5, .06, 0);
      return out;
    }
    poses = computePoses();
    const poseV = new Float32Array(15);
    function samplePose(u) {
      let k = 0;
      while (k < KEYS.length - 2 && u > KEYS[k + 1][0]) k++;
      const [u0, a] = KEYS[k], [u1, b] = KEYS[k + 1];
      const t = eio(seg(u, u0, u1)), A = poses[a].v, B = poses[b].v;
      for (let i = 0; i < 15; i++) poseV[i] = lerp(A[i], B[i], t);
      return poseV;
    }

    /* ---------------- DOM refs */
    const track = $('.bj-track');
    const ui = {
      intro: $('.bj-intro'), loading: $('.bj-loading'), ink: $('.bj-ink'), trail: $('.bj-trail'), fin: $('.bj-fin'),
      folio: $('.bj-folio-hud'), folioB: $('.bj-folio-hud b'), folioS: $('.bj-folio-hud span'),
      bookmark: $('.bj-bookmark'), bookmarkL: $('.bj-bookmark span'), corner: $('.bj-corner'), nib: $('.bj-nib'), vignette: $('.bj-vignette'),
      ribbons: $$('.bj-ribbon').map(r => ({ el: r, bands: [...r.querySelectorAll('.bj-band')], tracks: [...r.querySelectorAll('.bj-band-track')] }))
    };
    const spreads = $$('.bj-spread').map((s, i) => ({
      i, el: s, inner: s.querySelector('.bj-sp-inner'), fig: s.querySelector('.bj-fig'), img: s.querySelector('.bj-fig-mask img'),
      hl: s.querySelector('.bj-hl'), pq: s.querySelector('.bj-pq'), drop: s.querySelector('.bj-drop'), specs: s.querySelector('.bj-specs'),
      sents: [...s.querySelectorAll('.bj-s')], kicker: s.querySelector('.bj-kicker'), folio: s.querySelector('.bj-folio'),
      words: [...s.querySelectorAll('.bj-hl .bj-w')].map(w => ({ el: w, dx: 0, dy: 0, S: 1 })),
      letters: [...s.querySelectorAll('.bj-hl .bj-c')].map(c => ({ el: c, serif: null, sw: 0, cx: 0, cy: 0, r: 40 })),
      over: 0, op: -1, vis: false
    }));
    spreads.forEach(S => { const n = S.letters.length; S.letters.forEach((c, j) => { c.f0 = .13 + (j / n) * .13; c.e0 = j / n * .06; }); });
    const finLetters = [...ui.fin.querySelectorAll('.bj-c')].map(c => ({ el: c, sw: 0, cx: 0, cy: 0, r: 40 }));

    /* ---------------- 2D overlay canvases */
    const inkG = ui.ink.getContext('2d'), trailG = ui.trail.getContext('2d');
    const CDPR = Math.min(devicePixelRatio || 1, 1.5);
    let VW = innerWidth, VH = innerHeight, blots = [[], []], tearJag = [], inkState = '';
    function makeBlots() {
      const diag = Math.hypot(VW, VH);
      blots = [0, 1].map(() => {
        const list = [];
        for (let b = 0; b < 15; b++) {
          const acc = b % 5 === 2;
          list.push({ x: rand(.05, .95) * VW, y: rand(.08, .92) * VH, R: diag * rand(.12, .34), s0: rand(0, .55), acc, ph: [rand(0, 6), rand(0, 6), rand(0, 6)],
            drops: Array.from({ length: 7 }, () => ({ a: rand(0, 6.28), d: rand(1.1, 1.7), r: rand(.03, .09) })) });
        }
        list.sort((a, b) => a.s0 - b.s0);
        list.push({ x: VW / 2, y: VH / 2, R: diag * .82, s0: .5, acc: false, ph: [1, 2, 3], drops: [] });
        return list;
      });
      tearJag = Array.from({ length: Math.ceil(VH / 6) + 2 }, (_, k) => Math.sin(k * .21) * 18 + Math.sin(k * .07 + 1) * 34 + rand(-9, 9));
    }
    function sizeOverlays() {
      VW = innerWidth; VH = innerHeight;
      for (const c of [ui.ink, ui.trail]) { c.width = Math.round(VW * CDPR); c.height = Math.round(VH * CDPR); }
      inkG.setTransform(CDPR, 0, 0, CDPR, 0, 0); trailG.setTransform(CDPR, 0, 0, CDPR, 0, 0);
      makeBlots(); inkState = '';
    }
    sizeOverlays();

    function blotPath(g, b, R) {
      const n = 84; g.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = i / n * Math.PI * 2;
        const r = R * (1 + .16 * Math.sin(3 * a + b.ph[0]) + .09 * Math.sin(7 * a + b.ph[1]) + .05 * Math.sin(13 * a + b.ph[2]));
        const x = b.x + Math.cos(a) * r, y = b.y + Math.sin(a) * r;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
    }
    function inkText(g, i, alpha) {
      if (alpha <= 0) return;
      const p = projects[i + 1];
      g.save(); g.globalAlpha = alpha; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = ACC; g.font = `500 ${Math.max(11, VW * .009)}px "JetBrains Mono", monospace`;
      g.fillText(`TURNING TO p.${PAGES[i + 1][0]}  ·  FEATURE No.${pad(i + 2)}`, VW / 2, VH * .36);
      let fs = Math.min(VW * .12, VH * .2, 190);
      g.font = `italic 400 ${fs}px "Instrument Serif", Georgia, serif`;
      const words = p.name.split(' ');
      let lines = [p.name];
      if (g.measureText(p.name).width > VW * .9) lines = [words.slice(0, -1).join(' '), words.at(-1)];
      g.fillStyle = PAPER;
      lines.forEach((l, k) => g.fillText(l, VW / 2, VH * .36 + fs * (.95 + k * .92)));
      g.font = `500 ${Math.max(13, Math.min(18, VW * .012))}px "Noto Sans KR", sans-serif`; g.fillStyle = 'rgba(243,235,221,.72)';
      g.fillText(p.description, VW / 2, VH * .36 + fs * (.95 + lines.length * .92) + 16);
      g.restore();
    }
    function drawInk(i, k, r) {
      const key = `${i}|${k.toFixed(4)}|${r.toFixed(4)}`;
      if (key === inkState) return; inkState = key;
      const g = inkG; g.clearRect(0, 0, VW, VH);
      if (k <= 0 || r >= 1) { ui.ink.style.visibility = 'hidden'; return; }
      ui.ink.style.visibility = 'visible';
      g.save();
      if (r > 0) {
        const ex = y => lerp(VW + 120, -160, eio(r)) + tearJag[Math.floor(y / 6)];
        g.beginPath(); g.moveTo(0, 0);
        for (let y = 0; y <= VH + 6; y += 6) g.lineTo(ex(y), y);
        g.lineTo(0, VH + 6); g.closePath();
        // torn paper fibres
        g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16; g.shadowOffsetX = 6;
        g.fillStyle = '#efe4d1'; g.beginPath(); g.moveTo(0, 0);
        for (let y = 0; y <= VH + 6; y += 6) g.lineTo(ex(y) + 7 + Math.abs(tearJag[Math.floor(y / 6) + 1] % 9), y);
        g.lineTo(0, VH + 6); g.closePath(); g.fill(); g.restore();
        g.beginPath(); g.moveTo(0, 0);
        for (let y = 0; y <= VH + 6; y += 6) g.lineTo(ex(y), y);
        g.lineTo(0, VH + 6); g.closePath(); g.clip();
      }
      for (const b of blots[i]) {
        const t = seg(k, b.s0, Math.min(1, b.s0 + .5));
        if (t <= 0) continue;
        const R = b.R * eio(t);
        g.fillStyle = b.acc ? ACC : INK;
        blotPath(g, b, R); g.fill();
        if (t > .15 && t < 1) for (const d of b.drops) {
          g.beginPath(); g.arc(b.x + Math.cos(d.a) * R * d.d, b.y + Math.sin(d.a) * R * d.d, b.R * d.r * Math.min(1, t * 2), 0, 6.283); g.fill();
        }
      }
      inkText(g, i, seg(k, .78, 1));
      g.restore();
    }

    /* ---------------- measuring */
    function measure() {
      for (const S of spreads) {
        S.inner.style.transform = 'none';
        S.words.forEach(w => { w.el.style.transform = 'none'; });
        S.letters.forEach(c => { c.el.style.transform = 'none'; c.el.classList.remove('is-sans'); c.serif = null; });
        S.over = Math.max(0, S.inner.offsetHeight - VH);
        const rects = S.words.map(w => w.el.getBoundingClientRect()), n = rects.length;
        let Sc = Infinity;
        rects.forEach(r => { Sc = Math.min(Sc, VW * .88 / r.width, VH * .64 / (n * r.height)); });
        Sc = clamp(Sc, 1, 4.5);
        const lh = rects[0].height * Sc * .84, top = VH * .5 - lh * n / 2;
        S.words.forEach((w, i) => {
          const r = rects[i], line = n - 1 - i;
          w.dx = VW / 2 - (r.left + r.width / 2); w.dy = top + lh * (line + .5) - (r.top + r.height / 2); w.S = Sc;
        });
        S.letters.forEach(c => { const r = c.el.getBoundingClientRect(); c.cx = r.left + r.width / 2; c.cy = r.top + r.height / 2; c.r = r.height * .9; });
        S.op = -1;
      }
      ui.fin.style.transform = 'none';
      finLetters.forEach(c => { c.el.style.transform = 'none'; const r = c.el.getBoundingClientRect(); c.cx = r.left + r.width / 2; c.cy = r.top + r.height / 2; c.r = r.height * .9; });
      ui.fin.style.transform = '';
    }

    /* ---------------- scroll */
    let target = 0, prog = 0, lenis = null, ctx = null, gsap = null, tickerFn = null, lenisFn = null, rafId = 0;
    const readNative = () => { const r = track.getBoundingClientRect(); target = clamp(-r.top / Math.max(1, r.height - innerHeight)); };
    const scrollToU = u => {
      const r = track.getBoundingClientRect(), y = scrollY + r.top + (u / END) * (r.height - innerHeight);
      if (lenis) lenis.scrollTo(y, { duration: 2.2 }); else scrollTo({ top: y, behavior: 'smooth' });
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
    }
    addEventListener('scroll', readNative, { signal, passive: true });
    readNative(); prog = target;

    const curU = () => prog * END;
    const nextStop = dir => {
      const u = curU();
      if (dir > 0) return STOPS.find(s => s > u + 8) ?? END;
      return [...STOPS].reverse().find(s => s < u - 8) ?? 0;
    };
    ui.corner.addEventListener('click', () => scrollToU(nextStop(1)), { signal });
    $('[data-top]').addEventListener('click', () => scrollToU(0), { signal });
    addEventListener('keydown', e => {
      if (e.target.closest?.('input,textarea,[contenteditable]') || document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollToU(nextStop(1)); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToU(nextStop(-1)); }
    }, { signal });

    /* ---------------- pointer: nib, trail, swell */
    const ptr = { x: -999, y: -999, nx: 0, ny: 0, tx: 0, ty: 0, in: false };
    const trail = [];
    let time = 0, last = performance.now(), cornerHover = 0, cornerTarget = 0;
    if (finePointer) el.classList.add('has-nib');
    addEventListener('pointermove', e => {
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.in = true;
      ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1;
      if (!finePointer || e.pointerType !== 'mouse') return;
      const lp = trail[trail.length - 1];
      if (!lp || Math.hypot(lp.x - ptr.x, lp.y - ptr.y) > 2.5) {
        const sp = lp ? Math.hypot(lp.x - ptr.x, lp.y - ptr.y) : 0;
        trail.push({ x: ptr.x, y: ptr.y, t: time, w: clamp(3.4 - sp * .05, .7, 3.4) });
        if (trail.length > 160) trail.shift();
      }
      const hot = e.target.closest?.('a,button');
      ui.nib.classList.toggle('is-hover', !!hot);
    }, { signal, passive: true });
    document.addEventListener('pointerleave', () => { ptr.in = false; }, { signal });
    addEventListener('pointerdown', () => ui.nib.classList.add('is-down'), { signal });
    addEventListener('pointerup', () => ui.nib.classList.remove('is-down'), { signal });
    ui.corner.addEventListener('pointerenter', () => { cornerTarget = 1; }, { signal });
    ui.corner.addEventListener('pointerleave', () => { cornerTarget = 0; }, { signal });

    let resizeT = 0;
    addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        if (disposed) return;
        renderer.setSize(innerWidth, innerHeight, false);
        camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
        poses = computePoses(); sizeOverlays(); measure(); lenis?.resize?.(); readNative();
      }, 120);
    }, { signal });

    /* ---------------- intro landing */
    let introK = 0, introStart = -1;
    const introGone = () => !document.querySelector('.pn-intro:not(.pn-out)');
    const t0 = performance.now();

    measure();
    ui.loading.classList.add('is-done');
    el.classList.add('is-ready');

    /* ---------------- per-frame helpers */
    let lastFolio = '';
    function folioFor(u) {
      if (u < 110) return ['p.01', 'Cover — 표지'];
      if (u < 200) return ['p.02', 'Opening — 표지를 펼치는 중'];
      for (let i = 0; i < 3; i++) {
        const r0 = SPREAD_IN[i][0], r1 = i < 2 ? RIBBON[i][0] : 915;
        if (u >= r0 && u < r1) return [`p.${PAGES[i][0]}—${PAGES[i][1]}`, `No.${pad(i + 1)} — ${projects[i].name}`];
        if (i < 2 && u >= r1 && u < SPREAD_IN[i + 1][0]) return [`p.${PAGES[i + 1][0]}`, 'Contents — 차례 · 다음 기사로'];
      }
      if (u < FIN_DOM[0]) return ['p.23', 'Closing the issue — 책을 덮는 중'];
      return ['p.24', 'Back cover — 판권'];
    }

    function updateSpread(S, u) {
      let op = seg(u, SPREAD_IN[S.i][0], SPREAD_IN[S.i][1]);
      if (S.i < 2) { if (u >= SPREAD_OUT[S.i]) op = 0; } else op *= 1 - seg(u, 915, 930);
      const vis = op > .001;
      if (vis !== S.vis) {
        S.vis = vis; S.el.style.visibility = vis ? 'visible' : 'hidden';
        if (vis) S.el.removeAttribute('inert'); else S.el.setAttribute('inert', '');
      }
      if (Math.abs(op - S.op) > .0005) { S.op = op; S.el.style.opacity = op.toFixed(3); S.el.classList.toggle('is-live', op > .6); }
      if (!vis) return 0;
      const L = seg(u, READ[S.i][0] - 14, READ[S.i][1]);
      const st = S.hl.style;
      st.setProperty('--wd', lerp(125, 62, ease(seg(L, 0, .14))).toFixed(1));
      st.setProperty('--wg', lerp(900, 640, ease(seg(L, .04, .16))).toFixed(0));
      const m = ease(seg(L, .12, .36)), k = 1 - m;
      for (const w of S.words) w.el.style.transform = k > .0005 ? `translate3d(${(w.dx * k).toFixed(1)}px,${(w.dy * k).toFixed(1)}px,0) scale(${(1 + (w.S - 1) * k).toFixed(4)})` : '';
      const settled = m > .995, ty = -S.over * ease(seg(L, .42, .95));
      for (const c of S.letters) {
        const en = ease(seg(L, c.e0, c.e0 + .09));
        const ang = 180 * eio(seg(L, c.f0, c.f0 + .075));
        const serif = ang >= 90;
        if (serif !== c.serif) { c.serif = serif; c.el.classList.toggle('is-sans', !serif); }
        let tgt = 0;
        if (settled && ptr.in) { const d = Math.hypot(ptr.x - c.cx, ptr.y - (c.cy + ty)); tgt = Math.exp(-((d / (c.r * 1.25)) ** 2)); }
        c.sw += (tgt - c.sw) * .16;
        if (c.sw < .002) c.sw = 0;
        c.el.classList.toggle('is-sw', c.sw > .42);
        const rot = serif ? ang - 180 : ang;
        c.el.style.transform = `translate3d(0,${((1 - en) * .85 - c.sw * .1).toFixed(3)}em,0) rotateX(${rot.toFixed(1)}deg) scale(${(1 + c.sw * .42).toFixed(3)})`;
        c.el.style.opacity = en.toFixed(3);
      }
      const rv = ease(seg(L, .1, .44)), rw = ease(seg(L, .06, .38));
      S.fig.style.setProperty('--rv', rv.toFixed(4)); S.fig.style.setProperty('--rw', rw.toFixed(4));
      S.img.style.transform = `translate3d(0,${((L - .5) * -7).toFixed(2)}%,0) scale(${(1.24 - .14 * rv).toFixed(4)})`;
      const q = ease(seg(L, .28, .5));
      S.pq.style.transform = `translate3d(${((1 - q) * 46).toFixed(2)}vw,${((1 - q) * -6).toFixed(2)}vh,0) rotate(${((1 - q) * -9).toFixed(2)}deg)`;
      S.pq.style.opacity = q.toFixed(3); S.pq.style.filter = q < .99 ? `blur(${((1 - q) * 8).toFixed(1)}px)` : '';
      S.kicker.style.opacity = seg(L, .3, .42).toFixed(3); S.folio.style.setProperty('--k', seg(L, .02, .2).toFixed(3));
      S.drop.style.setProperty('--k', ease(seg(L, .36, .5)).toFixed(3));
      S.sents.forEach((s, j) => s.style.setProperty('--k', ease(seg(L, .4 + j * .08, .54 + j * .08)).toFixed(3)));
      S.specs.style.setProperty('--k', seg(L, .52, .78).toFixed(3));
      S.inner.style.transform = ty ? `translate3d(0,${ty.toFixed(1)}px,0)` : '';
      return op;
    }

    function updateRibbon(i, u) {
      const R = ui.ribbons[i], [a, b] = RIBBON[i];
      const k = seg(u, a, b), on = k > 0 && u < FLOOD[i][1] + 1;
      R.el.style.visibility = on ? 'visible' : 'hidden';
      if (!on) return;
      const o = ease(seg(k, 0, .22));
      R.el.style.setProperty('--o', o.toFixed(3));
      R.tracks[0].style.transform = `translate3d(${(-8 - k * 42).toFixed(2)}%,0,0)`;
      R.tracks[1].style.transform = `translate3d(${(-50 + k * 42).toFixed(2)}%,0,0)`;
    }

    function drawTrail(dark) {
      const g = trailG;
      g.clearRect(0, 0, VW, VH);
      while (trail.length && time - trail[0].t > 1.25) trail.shift();
      if (trail.length < 2) return;
      g.lineCap = 'round'; g.lineJoin = 'round';
      const col = dark ? '255,92,58' : '34,20,14';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i], age = (time - b.t) / 1.25;
        const al = (1 - age) ** 1.6 * .85;
        if (al <= 0) continue;
        g.strokeStyle = `rgba(${col},${al.toFixed(3)})`;
        g.lineWidth = b.w * (1 + age * 1.6);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
      const h = trail[trail.length - 1], age = (time - h.t);
      if (age < .4) { g.fillStyle = `rgba(${col},${(.35 * (1 - age / .4)).toFixed(3)})`; g.beginPath(); g.arc(h.x, h.y, 3 + age * 14, 0, 6.283); g.fill(); }
    }

    /* ---------------- frame */
    let glCovered = false;
    function frame(now) {
      if (disposed) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (document.hidden) return;
      const paused = isPaused();
      el.classList.toggle('is-paused', paused);
      if (!paused) time += dt;
      prog += (target - prog) * (1 - Math.exp(-dt * 8));
      if (Math.abs(target - prog) < 1e-6) prog = target;
      const u = prog * END;

      // intro landing once the shell overlay is gone
      if (introStart < 0 && (introGone() || now - t0 > 5000)) { introStart = now; el.classList.add('is-in'); }
      if (introStart >= 0) introK = paused ? 1 : clamp((now - introStart) / 1700);
      const land = ease(introK);

      // spreads, ribbons, ink, finale
      let paperOp = 0;
      for (const S of spreads) paperOp = Math.max(paperOp, updateSpread(S, u));
      updateRibbon(0, u); updateRibbon(1, u);
      let floodFull = false, inkDrawn = false;
      for (let i = 0; i < 2; i++) {
        if (u >= FLOOD[i][0] - 1 && u <= TEAR[i][1] + 1) {
          const k = seg(u, FLOOD[i][0], FLOOD[i][1]), r = seg(u, TEAR[i][0], TEAR[i][1]);
          drawInk(i, k, r); inkDrawn = true;
          if (k >= 1 && r <= 0) floodFull = true;
        }
      }
      if (!inkDrawn) drawInk(0, 0, 1);
      const fo = ease(seg(u, FIN_DOM[0], FIN_DOM[1]));
      ui.fin.style.opacity = fo.toFixed(3);
      ui.fin.style.setProperty('--k', fo.toFixed(3));
      ui.fin.style.visibility = fo > .001 ? 'visible' : 'hidden';
      if (fo > .5) ui.fin.removeAttribute('inert'); else ui.fin.setAttribute('inert', '');
      if (fo > .98) for (const c of finLetters) {
        let tgt = 0;
        if (ptr.in) { const d = Math.hypot(ptr.x - c.cx, ptr.y - c.cy); tgt = Math.exp(-((d / (c.r * 1.25)) ** 2)); }
        c.sw += (tgt - c.sw) * .16; if (c.sw < .002) c.sw = 0;
        c.el.classList.toggle('is-sw', c.sw > .42);
        c.el.style.transform = c.sw ? `translate3d(0,${(-c.sw * .1).toFixed(3)}em,0) scale(${(1 + c.sw * .4).toFixed(3)})` : '';
      }

      // intro copy + HUD
      const introO = (1 - seg(u, 20, 70));
      ui.intro.style.opacity = introO.toFixed(3);
      ui.intro.style.visibility = introO > .001 ? 'visible' : 'hidden';
      const dark = paperOp < .5;
      el.classList.toggle('is-dark', dark || floodFull);
      const [pg, label] = folioFor(u), fk = pg + label;
      if (fk !== lastFolio) { lastFolio = fk; ui.folioB.textContent = pg; ui.folioS.textContent = label; }
      el.style.setProperty('--bp', prog.toFixed(4));
      const chap = u < 200 ? 'Cover' : u < 498 ? 'No.01' : u < 793 ? 'No.02' : u < 1000 ? 'No.03' : 'Fin';
      if (ui.bookmarkL.textContent !== chap) ui.bookmarkL.textContent = chap;
      el.classList.toggle('is-end', u > END - 40);
      cornerHover += (cornerTarget - cornerHover) * .12;

      // nib + trail
      if (finePointer) {
        ui.nib.style.transform = `translate3d(${(ptr.x - 12).toFixed(1)}px,${(ptr.y - 41).toFixed(1)}px,0)`;
        ui.nib.style.opacity = ptr.in ? '1' : '0';
        drawTrail(dark || floodFull);
      }

      // GL
      glCovered = paperOp >= .999 || floodFull;
      ui.vignette.style.opacity = glCovered ? '0' : '1';
      if (glCovered) return;

      const v = samplePose(u);
      ptr.nx += (ptr.tx - ptr.nx) * (1 - Math.exp(-dt * 3)); ptr.ny += (ptr.ty - ptr.ny) * (1 - Math.exp(-dt * 3));
      const camD = Math.abs(v[2] - v[5]) + Math.abs(v[1] - v[4]);
      const par = camD * .035;
      camera.position.set(v[0] + ptr.nx * par, v[1] - ptr.ny * par, v[2]);
      camera.up.set(v[6], v[7], v[8]).normalize();
      camera.lookAt(v[3] + ptr.nx * par * .3, v[4] - ptr.ny * par * .3, v[5]);

      // magazine transform
      const lift = seg(u, 30, 110), bump = Math.sin(Math.PI * lift);
      const drop = 1 - land;
      holder.position.set(v[9], v[10], v[11] + drop * .9 + bump * .12);
      holder.rotation.set(v[14] + bump * .5 + drop * .25, bump * -.16, v[13] + drop * .6 + (paused ? 0 : Math.sin(time * .5) * .004 * (1 - lift)));
      book.position.x = -v[12];

      // sheets
      let firstUnturned = -1, turned = 0;
      sheets.forEach((S, k) => {
        let T = ease(seg(u, TURN[k][0], TURN[k][1]));
        if (T <= 0 && firstUnturned < 0) firstUnturned = k;
        if (T >= 1) turned++;
        S.T = T;
      });
      // breathing corner + hover peek on the next page to turn
      const breath = (paused ? .5 : .5 + .5 * Math.sin(time * 1.4)) * .012;
      const peek = (u > 175 ? breath : 0) + cornerHover * .085;
      sheets.forEach((S, k) => {
        let T = S.T;
        if (k === firstUnturned && k > 0) T = Math.max(T, peek);
        else if (k === 0 && u < 110) T = Math.max(T, cornerHover * .07);
        const zr = (NS - 1 - k) * GAP + .0015, zl = k * GAP + .0015;
        bend(S, T, lerp(zr, zl, S.T));
      });
      const nR = NS - turned - (firstUnturned >= 0 && sheets[firstUnturned].T > 0 ? 1 : 0), nL = turned;
      const thR = .004 + .014 * nR / NS, thL = .004 + .014 * nL / NS;
      blockR.scale.set(PW * .994, PH * .994, thR); blockR.position.set(PW / 2, 0, -thR / 2); blockR.visible = nR > 0;
      blockL.scale.set(PW * .994, PH * .994, thL); blockL.position.set(-PW / 2, 0, -thL / 2); blockL.visible = nL > 0;
      // contact shadow follows the visible footprint
      const minX = nL > 0 || sheets[0].T > .5 ? -PW : 0, maxX = nR > 0 ? PW : 0;
      const lc = (minX + maxX) / 2 - v[12], hz = holder.position.z;
      const yaw = holder.rotation.z;
      blob.position.set(holder.position.x + Math.cos(yaw) * lc, holder.position.y + Math.sin(yaw) * lc, .0015);
      blob.rotation.z = yaw;
      blob.scale.set((maxX - minX) * (1.25 + hz * 1.6), PH * (1.22 + hz * 1.6), 1);
      blob.material.opacity = clamp(.72 - hz * 1.4, .28, .72);

      renderer.render(scene, camera);
    }

    if (gsap) { tickerFn = () => frame(performance.now()); gsap.ticker.add(tickerFn); }
    else { const loop = now => { rafId = requestAnimationFrame(loop); frame(now); }; rafId = requestAnimationFrame(loop); }

    teardown = () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(resizeT);
      if (gsap) { if (tickerFn) gsap.ticker.remove(tickerFn); if (lenisFn) gsap.ticker.remove(lenisFn); gsap.ticker.lagSmoothing(500, 33); }
      ctx?.revert(); lenis?.destroy();
      const geos = new Set(owned.geo), mats = new Set(owned.mat);
      scene.traverse(o => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
      });
      geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose());
      owned.tex.forEach(t => t.dispose());
      envRT.dispose(); pmrem.dispose();
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
