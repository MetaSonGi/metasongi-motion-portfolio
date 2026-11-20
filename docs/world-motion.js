// In-world motion layer (every world except home): kinetic headlines that
// assemble and react to the cursor, scroll reveals, a blend-mode cursor with
// context labels, magnetic buttons, 3D card tilt with glare, click bursts in
// the world's colours and a soft cursor spotlight.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(pointer: fine)').matches;

const HEADLINES = 'h1:not(#noir-title), .journal-story h2, .garden-entry h2';
const SKIP_HEADLINE = '.os-window *, .desktop *, .window *';
const REVEAL = '.pc-card, .journal-story, .garden-entry, .bento-grid > *, .exhibit, .atlas-inspector, .atlas-sidebar, .experiment-stage, .noir-transport, .story-project';

function splitHeadline(el, offset = 0) {
  if (el.dataset.kx) return 0;
  el.dataset.kx = '1';
  let i = offset;
  const walk = node => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.append(part); continue; }
          const word = document.createElement('span');
          word.className = 'kx-w';
          for (const ch of part) {
            const c = document.createElement('span');
            c.className = 'kx-c';
            c.style.setProperty('--k', i++);
            c.textContent = ch;
            word.append(c);
          }
          frag.append(word);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && !/^(BR|SVG|IMG|CANVAS)$/.test(child.tagName)) walk(child);
    }
  };
  // gradient text (background-clip: text) must be re-applied to the new letter boxes
  for (const n of [el, ...el.querySelectorAll('*:not(.kx-w):not(.kx-c)')]) {
    const cs = getComputedStyle(n);
    if ((cs.webkitBackgroundClip || cs.backgroundClip) === 'text') n.dataset.kxClip = '';
  }
  walk(el);
  return i;
}

export function mountMotion(root) {
  const ac = new AbortController(), { signal } = ac;
  const on = (t, e, f, o = {}) => t.addEventListener(e, f, { ...o, signal });
  const cleanups = [];
  const calm = reduced();

  // ---- kinetic headlines + scroll reveals
  const seen = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('kx-in');
      seen.unobserve(entry.target);
    }
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  cleanups.push(() => seen.disconnect());
  const scan = () => {
    root.querySelectorAll(HEADLINES).forEach(h => {
      if (h.closest(SKIP_HEADLINE) || h.closest('[data-no-kx]') || h.dataset.kx) return;
      splitHeadline(h);
      h.classList.add('kx-head');
      seen.observe(h);
    });
    root.querySelectorAll(REVEAL).forEach((el, n) => {
      if (el.classList.contains('kx-r') || el.closest('[data-no-kx]') || getComputedStyle(el).position === 'fixed') return;
      el.classList.add('kx-r');
      el.style.setProperty('--kd', (n % 6) * 70 + 'ms');
      seen.observe(el);
    });
  };
  scan();
  let queued = 0;
  const mo = new MutationObserver(() => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; scan(); }); });
  mo.observe(root, { childList: true, subtree: true });
  cleanups.push(() => { mo.disconnect(); cancelAnimationFrame(queued); });
  if (calm) return () => { ac.abort(); cleanups.forEach(f => f()); };

  // ---- cursor proximity on headlines (letters lift and stretch near the pointer)
  let hot = null, px = -1e4, py = -1e4;
  on(root, 'pointermove', event => {
    px = event.clientX; py = event.clientY;
    const next = event.target.closest?.('.kx-head') || null;
    if (hot && hot !== next) hot.querySelectorAll('.kx-c').forEach(c => c.style.removeProperty('--px'));
    hot = next;
  }, { passive: true });

  // ---- overlay layers: cursor, spotlight, burst canvas
  const layer = document.createElement('div');
  layer.className = 'kx-layer';
  layer.innerHTML = '<i class="kx-spot"></i><canvas class="kx-burst"></canvas><div class="kx-cursor"><i></i><span></span></div>';
  document.body.append(layer);
  cleanups.push(() => layer.remove());
  const cursor = layer.querySelector('.kx-cursor'), label = cursor.querySelector('span');
  const spot = layer.querySelector('.kx-spot');
  const canvas = layer.querySelector('.kx-burst'), ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; };
  size(); on(window, 'resize', size);
  const showCursor = fine();
  layer.classList.toggle('kx-has-cursor', showCursor);

  let cx = innerWidth / 2, cy = innerHeight / 2, mx = cx, my = cy;
  on(window, 'pointermove', event => { mx = event.clientX; my = event.clientY; }, { passive: true });
  on(document, 'pointerover', event => {
    const t = event.target;
    const range = t.closest?.('input[type=range]'), card = t.closest?.('.pc-card'), cta = t.closest?.('.pc-cta, a[href]');
    const btn = t.closest?.('.pc-btn, button, select, summary, [role=button]');
    const text = range ? 'DRAG' : card ? 'VIEW' : cta ? 'OPEN' : btn ? '' : null;
    cursor.classList.toggle('is-hover', text !== null);
    cursor.classList.toggle('has-label', !!text);
    label.textContent = text || '';
  });
  on(document, 'pointerdown', () => cursor.classList.add('is-down'));
  on(document, 'pointerup', () => cursor.classList.remove('is-down'));

  // ---- magnetic controls + card tilt
  let magnet = null, tilt = null;
  on(root, 'pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const m = event.target.closest?.('.pc-btn, .pc-cta');
    if (magnet && magnet !== m) magnet.style.translate = '';
    magnet = m;
    if (m) {
      const r = m.getBoundingClientRect();
      m.style.translate = `${(event.clientX - r.left - r.width / 2) * .25}px ${(event.clientY - r.top - r.height / 2) * .35}px`;
    }
    const c = event.target.closest?.('.pc-card:not(.exhibit-art)');
    if (tilt && tilt !== c) resetTilt(tilt);
    tilt = c;
    if (c) {
      const r = c.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - .5, y = (event.clientY - r.top) / r.height - .5;
      c.style.rotate = `${-y} ${x} 0 ${Math.hypot(x, y) * 14}deg`;
      c.style.setProperty('--gx', (x + .5) * 100 + '%');
      c.style.setProperty('--gy', (y + .5) * 100 + '%');
      if (!c.querySelector(':scope > .kx-glare')) {
        if (getComputedStyle(c).position === 'static') c.style.position = 'relative';
        if (c.parentElement && getComputedStyle(c.parentElement).perspective === 'none') c.parentElement.style.perspective = '1100px';
        c.insertAdjacentHTML('beforeend', '<i class="kx-glare" aria-hidden="true"></i>');
      }
      c.classList.add('kx-tilting');
    }
  }, { passive: true });
  const resetTilt = c => { c.style.rotate = ''; c.classList.remove('kx-tilting'); };
  on(root, 'pointerleave', () => { if (magnet) magnet.style.translate = ''; if (tilt) resetTilt(tilt); magnet = tilt = null; });

  // ---- click bursts in the world's colours
  const parts = [];
  const css = getComputedStyle(document.body);
  on(root, 'pointerdown', event => {
    const a = css.getPropertyValue('--pa').trim() || '#d4ff3a', b = css.getPropertyValue('--pb').trim() || '#3affc5';
    for (let k = 0; k < 22; k++) {
      const ang = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
      parts.push({ x: event.clientX, y: event.clientY, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.5, life: 1, r: 1.5 + Math.random() * 3, c: k % 2 ? a : b, ring: false });
    }
    parts.push({ x: event.clientX, y: event.clientY, life: 1, r: 4, c: a, ring: true });
  });

  // ---- one rAF loop for everything
  let raf = requestAnimationFrame(function frame() {
    cx += (mx - cx) * .2; cy += (my - cy) * .2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    spot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    if (hot) {
      for (const c of hot.querySelectorAll('.kx-c')) {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const f = Math.max(0, 1 - d / 160);
        c.style.setProperty('--px', f.toFixed(3));
      }
    }
    if (parts.length) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let k = parts.length - 1; k >= 0; k--) {
        const p = parts[k];
        p.life -= p.ring ? .035 : .022;
        if (p.life <= 0) { parts.splice(k, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life);
        if (p.ring) {
          ctx.strokeStyle = p.c; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, (1 - p.life) * 90 + 4, 0, Math.PI * 2); ctx.stroke();
        } else {
          p.x += p.vx; p.y += p.vy; p.vy += .18; p.vx *= .97;
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (!parts.length) ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
    raf = requestAnimationFrame(frame);
  });
  cleanups.push(() => cancelAnimationFrame(raf));

  return () => {
    ac.abort();
    if (hot) hot.querySelectorAll('.kx-c').forEach(c => c.style.removeProperty('--px'));
    cleanups.forEach(f => f());
  };
}
