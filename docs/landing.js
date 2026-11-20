import * as THREE from 'three';
import { worldCatalog } from './world-catalog.js?v=experiments-1';
import { projects, profileURL } from './content.js?v=ten-worlds-1';
import { createScope, mountProjectViewer } from './world-utils.js?v=ten-worlds-1';

// Cinematic home: noise-displaced WebGL object, scroll-scrubbed camera path, pinned project reel,
// variable-font kinetic type. GSAP/Lenis load only here, so the twenty worlds stay untouched.
const LIBS = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js',
  st: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs',
};
const projectArt = { vrm: 'vrm', pixelle: 'glass', motion: 'orbit' };
const worldColors = {
  space:['#7b5cff','#4de2ff'], journey:['#ffd36b','#ff8a5c'], workspace:['#c9d1ff','#7b8cff'], gallery:['#f1efe8','#b9b4a8'],
  editorial:['#ff5c3a','#ffb199'], terminal:['#3aff8a','#0f6b3a'], atlas:['#4de2ff','#2a6bff'], bento:['#ff7ad9','#ffd36b'],
  noir:['#ffffff','#5a5a5a'], garden:['#9be15d','#00b37a'], afterimage:['#ff3d6e','#3d7bff'], prism:['#b8a6ff','#7af0ff'],
  signal:['#d4ff3a','#3affc5'], transit:['#5c6bff','#ff4dd2'], typepress:['#d4ff3a','#f1efe8'], assembly:['#ff9a3d','#ffe1b8'],
  cutroom:['#ff4d4d','#ffd0d0'], frequency:['#4dffdf','#7b5cff'], chromagrid:['#ff3df2','#3dffb0'], splitlight:['#f1efe8','#d4ff3a'],
};
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

function template() {
  const reel = projects.map((p, i) => `
    <article class="cine-panel">
      <span class="num" aria-hidden="true">${pad(i + 1)}</span>
      <div class="frame"><img src="art/${projectArt[p.id] ?? 'orbit'}.jpg" alt="" decoding="async"></div>
      <div class="cap">
        <div>
          <p class="cat">${esc(p.category)}</p>
          <h3>${esc(p.name)}</h3>
          <p class="desc">${esc(p.description)}</p>
          <div class="tags">${p.stack.slice(0, 3).map(t => `<span>${esc(t)}</span>`).join('')}<a href="${p.url}" target="_blank" rel="noopener" data-cursor="CODE">소스 ↗</a></div>
        </div>
        <button class="go" type="button" data-case="${p.id}" data-cursor="VIEW" aria-label="${esc(p.name)} 상세 보기">↗</button>
      </div>
    </article>`).join('');
  const worlds = worldCatalog.map((w, i) => {
    const [c1] = worldColors[w.id] ?? ['#d4ff3a'];
    return `<li><a href="?world=${w.id}" data-world-link="${w.id}" data-i="${i}" style="--wc:${c1}" data-cursor="ENTER">
      <span class="n">W—${pad(i + 1)}</span><span class="g" aria-hidden="true">${esc(w.icon)}</span><span class="t">${esc(w.name)}</span><span class="d">${esc(w.label)}</span><span class="ar" aria-hidden="true">↗</span></a></li>`;
  }).join('');
  return `
  <div class="cine" id="portfolio-top">
    <canvas class="cine-gl" aria-hidden="true"></canvas>
    <div class="cine-vignette" aria-hidden="true"></div>
    <div class="cine-grain" aria-hidden="true"></div>
    <div class="cine-cursor-el" aria-hidden="true"><div class="ring"><span>OPEN</span></div><div class="dot"></div></div>
    <div class="cine-loader" aria-hidden="true">
      <div class="top"><span>MetaSonGi®</span><span>Loading ${worldCatalog.length} worlds</span></div>
      <div class="count"><span data-cnt>000</span></div>
      <div class="bot"><span>Creative development</span><span>Seoul — 37.56°N</span></div>
      <div class="bar"></div>
    </div>
    <div class="cine-preview" aria-hidden="true"><div class="bg"></div><div class="gl">◌</div><div class="lb">world</div></div>

    <div class="cine-hud">
      <div class="row">
        <a class="cine-logo" href="#portfolio-top" data-scroll><i aria-hidden="true">✳</i>MetaSonGi</a>
        <nav class="cine-nav" aria-label="홈 내비게이션">
          <a href="#selected-work" data-scroll><span>Work</span><span aria-hidden="true">Work</span></a>
          <a href="#portfolio-worlds" data-scroll><span>${worldCatalog.length} Worlds</span><span aria-hidden="true">${worldCatalog.length} Worlds</span></a>
          <button type="button" data-open-menu><span>세계 바꾸기</span><span aria-hidden="true">세계 바꾸기</span></button>
        </nav>
        <span class="hide-s" data-clock>SEL 00:00:00</span>
      </div>
      <div></div>
      <div class="row">
        <span class="cine-chapter"><span data-chap>01 / Intro</span><span class="track"><span class="fill" data-prog></span></span></span>
        <span class="hide-s">Scroll ↓ to travel</span>
      </div>
    </div>

    <div class="cine-content">
      <section class="cine-hero" data-chap-name="01 / Intro" aria-labelledby="landing-title">
        <p class="kicker" style="margin-bottom:28px"><b>●</b>&nbsp; Creative development · Motion portfolio</p>
        <h1 class="disp" id="landing-title" aria-label="Interfaces in motion.">
          <span class="line" aria-hidden="true">Interfaces</span>
          <span class="line accent" aria-hidden="true">in motion.</span>
        </h1>
        <div class="meta">
          <p>WebGL, 스크롤 시네마틱, 키네틱 타이포그래피로 만드는 ${worldCatalog.length}개의 서로 다른 웹 세계.</p>
          <p class="mid kicker">Three.js · GLSL · GSAP<br>Interaction · Type · Sound</p>
          <div class="r"><a class="cine-cta" href="#selected-work" data-scroll data-cursor="GO">Enter the reel <span aria-hidden="true">↓</span></a></div>
        </div>
      </section>

      <section class="cine-mani" data-chap-name="02 / Manifesto">
        <p class="kicker"><b>02</b> — Manifesto</p>
        <p class="big" data-mani>Every screen is a <em>stage.</em> Every scroll is a <em>cut.</em> I build interfaces that breathe, bend and react — ${worldCatalog.length} worlds, one obsession.</p>
        <p class="ko">화면은 무대이고 스크롤은 컷 전환입니다. 마우스에 반응하는 3D, 장면처럼 넘어가는 스크롤, 늘어나고 튀는 타이포 — 같은 포트폴리오를 ${worldCatalog.length}가지 방식으로 다시 설계했습니다.</p>
      </section>

      <section class="cine-work" id="selected-work" data-chap-name="03 / Selected work" aria-labelledby="work-title">
        <div class="head kicker"><span><b>03</b> — Selected work</span><span data-work-idx>01 / ${pad(projects.length)}</span></div>
        <div class="cine-track" data-track>
          <div class="intro">
            <h2 class="disp" id="work-title"><span>Selected</span><span>Work.</span></h2>
            <p class="kicker" style="margin-top:24px">Keep scrolling → scene by scene</p>
          </div>
          ${reel}
          <div class="end"><p class="kicker"><b>→</b> Next — ${worldCatalog.length} different worlds</p></div>
        </div>
      </section>

      <section class="cine-worlds" id="portfolio-worlds" data-chap-name="04 / ${worldCatalog.length} worlds" aria-labelledby="worlds-title">
        <div class="head">
          <h2 class="disp" id="worlds-title"><span class="line">${worldCatalog.length === 20 ? 'Twenty' : worldCatalog.length}</span><span class="line o">Worlds.</span></h2>
          <p>각 세계는 레이아웃도, 탐색 방식도, 감정도 다릅니다. 하나를 골라 들어가 보세요.</p>
        </div>
        <ul class="cine-wlist" data-wlist>${worlds}</ul>
      </section>

      <section class="cine-marq" aria-hidden="true">
        <div class="mrow a">${'<span>Interfaces <i>✳</i> in motion <i>✳</i></span>'.repeat(3)}</div>
        <div class="mrow b">${'<span>Different worlds <i>✳</i> one obsession <i>✳</i></span>'.repeat(3)}</div>
      </section>

      <footer class="cine-foot" data-chap-name="05 / Contact">
        <div class="top">
          <p class="lead">Let's build the<br>next <em>world.</em></p>
          <div><h4>Elsewhere</h4><a href="${profileURL}" target="_blank" rel="noopener" data-cursor="OPEN">GitHub ↗</a><button type="button" data-open-menu>세계 바꾸기 ↗</button></div>
          <div><h4>Navigate</h4><a href="#selected-work" data-scroll>Selected work</a><a href="#portfolio-worlds" data-scroll>${worldCatalog.length} worlds</a><a href="#portfolio-top" data-scroll>Back to top ↑</a></div>
        </div>
        <div>
          <div class="cine-wordmark" data-wordmark aria-label="MetaSonGi">MetaSonGi</div>
          <div class="bot"><span>© 2026 MetaSonGi</span><span>Built with WebGL + GSAP</span></div>
        </div>
      </footer>
    </div>
  </div>`;
}

function splitChars(el) {
  const walk = node => [...node.childNodes].forEach(ch => {
    if (ch.nodeType === 3) {
      const frag = document.createDocumentFragment();
      [...ch.textContent].forEach(t => {
        if (!t.trim()) return frag.append(document.createTextNode(t));
        const s = document.createElement('span'); s.className = 'c'; s.textContent = t; s.setAttribute('aria-hidden', 'true'); frag.append(s);
      });
      ch.replaceWith(frag);
    } else if (ch.nodeType === 1) walk(ch);
  });
  walk(el);
  return [...el.querySelectorAll('.c')];
}
function splitWords(el) {
  [...el.childNodes].forEach(ch => {
    if (ch.nodeType === 3) {
      const frag = document.createDocumentFragment();
      ch.textContent.split(/\s+/).filter(Boolean).forEach(w => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.append(s, ' '); });
      ch.replaceWith(frag);
    } else if (ch.nodeType === 1) ch.classList.add('w');
  });
}

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

function createStage(canvas, fine) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
  camera.position.set(0, 0, 7);
  const uniforms = { uTime:{value:0}, uAmp:{value:.55}, uFreq:{value:.9}, uMouse:{value:new THREE.Vector2()}, uHue:{value:0}, uGlow:{value:1}, uSpeed:{value:1} };
  const blobGeo = new THREE.IcosahedronGeometry(1.5, fine ? 160 : 90);
  const blobMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `${NOISE}
    uniform float uTime,uAmp,uFreq,uSpeed; uniform vec2 uMouse;
    varying vec3 vPos; varying float vNoise;
    void main(){
      vec3 p=position; float t=uTime*uSpeed;
      float n=snoise(p*uFreq+vec3(t*.22,t*.17,-t*.12));
      float n2=snoise(p*uFreq*2.4-vec3(t*.35));
      vec3 m=normalize(vec3(uMouse*1.4,1.));
      float md=smoothstep(1.3,0.,distance(normalize(p),m));
      float d=n*.65+n2*.22+md*.45;
      vNoise=d; p+=normal*d*uAmp;
      vec4 mv=modelViewMatrix*vec4(p,1.); vPos=mv.xyz;
      gl_Position=projectionMatrix*mv;
    }`,
    fragmentShader: `
    uniform float uTime,uHue,uGlow; varying vec3 vPos; varying float vNoise;
    vec3 pal(float t){return .5+.5*cos(6.28318*(t+vec3(0.,.33,.67)+uHue));}
    void main(){
      vec3 n=normalize(cross(dFdx(vPos),dFdy(vPos)));
      vec3 v=normalize(-vPos);
      float fr=pow(1.-abs(dot(n,v)),2.2);
      vec3 irid=pal(fr*.8+vNoise*.55+uTime*.025);
      vec3 acid=vec3(.83,1.,.23);
      vec3 col=mix(vec3(.012,.012,.02),irid*.95,fr);
      col+=acid*pow(fr,5.)*.9*uGlow;
      vec3 L=normalize(vec3(.6,.9,1.));
      col+=vec3(pow(max(dot(reflect(-L,n),v),0.),48.))*.85;
      col+=acid*smoothstep(0.,.35,vNoise)*.08;
      gl_FragColor=vec4(col,1.);
    }`,
  });
  const group = new THREE.Group();
  const blob = new THREE.Mesh(blobGeo, blobMat); group.add(blob);
  const ringGeo = new THREE.TorusGeometry(2.55, .004, 8, 240), ringGeo2 = new THREE.TorusGeometry(3.1, .003, 8, 240);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4ff3a, transparent: true, opacity: .55 });
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .18 });
  const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.x = 1.25; group.add(ring);
  const ring2 = new THREE.Mesh(ringGeo2, ringMat2); ring2.rotation.set(1.1, .4, 0); group.add(ring2);
  scene.add(group);

  const PN = fine ? 2600 : 1200, pPos = new Float32Array(PN * 3), pSeed = new Float32Array(PN);
  for (let i = 0; i < PN; i++) {
    const r = 3.2 + Math.random() * 9, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pPos[i*3] = r*Math.sin(ph)*Math.cos(th); pPos[i*3+1] = r*Math.sin(ph)*Math.sin(th)*.7; pPos[i*3+2] = r*Math.cos(ph) - 2; pSeed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: uniforms.uTime, uPx: { value: renderer.getPixelRatio() }, uWarp: { value: 0 } },
    vertexShader: `uniform float uTime,uPx,uWarp; attribute float aSeed; varying float vA;
      void main(){ vec3 p=position; float a=uTime*.05*(.4+aSeed);
        p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz; p.y+=sin(uTime*.6+aSeed*20.)*.08; p.z+=uWarp*aSeed*6.;
        vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
        gl_PointSize=(1.2+aSeed*2.6)*uPx*(9./-mv.z)*(1.+uWarp*2.); vA=.25+aSeed*.6; }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); if(d>.5)discard;
        vec3 c=mix(vec3(.83,1.,.23),vec3(1.),step(.5,vA)); gl_FragColor=vec4(c,(1.-d*2.)*vA); }`,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  const resize = () => {
    const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w < 760 ? 9.5 : 7; camera.updateProjectionMatrix();
  };
  resize();
  return {
    uniforms, group, blob, ring, ring2, camera, pMat, resize,
    render() { renderer.render(scene, camera); },
    dispose() {
      [blobGeo, ringGeo, ringGeo2, pGeo, blobMat, ringMat, ringMat2, pMat].forEach(o => o.dispose());
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}

function proximity(chars, mouse, { base, max, gBase, gMax, radius }) {
  const st = chars.map(c => ({ c, w: base, g: gBase, r: null }));
  return {
    measure() { st.forEach(s => { const b = s.c.getBoundingClientRect(); s.r = { x: b.left + b.width / 2, y: b.top + b.height / 2 + scrollY }; }); },
    tick(active) {
      st.forEach(s => {
        if (!s.r) return;
        let f = 0;
        if (active) { const d = Math.hypot(mouse.x - s.r.x, mouse.y - (s.r.y - scrollY)); f = Math.max(0, 1 - d / radius); f = f * f * (3 - 2 * f); }
        s.w += (base + (max - base) * f - s.w) * .12; s.g += (gBase + (gMax - gBase) * f - s.g) * .12;
        s.c.style.setProperty('--w', s.w.toFixed(1)); s.c.style.setProperty('--g', s.g.toFixed(0));
      });
    },
  };
}

export function mountLanding(root, { isPaused }) {
  const scope = createScope();
  let disposed = false;
  root.innerHTML = template();
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  document.body.classList.add('cine-loading');
  if (fine) document.body.classList.add('cine-cursor');

  mountProjectViewer(root, scope);
  $$('[data-open-menu]').forEach(b => scope.on(b, 'click', () => document.querySelector('#choose-world')?.click()));

  const heroChars = splitChars($('#landing-title'));
  const markChars = splitChars($('[data-wordmark]'));
  splitWords($('[data-mani]'));

  const clockEl = $('[data-clock]');
  const tickClock = () => { clockEl.textContent = 'SEL ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Seoul' }); };
  tickClock(); const clockTimer = setInterval(tickClock, 1000); scope.add(() => clearInterval(clockTimer));

  const reveal = () => {
    $('.cine-loader')?.remove();
    $$('[data-mani] .w').forEach(w => { w.style.opacity = 1; });
    document.body.classList.remove('cine-loading');
  };

  const cleanups = [];
  Promise.all([import(LIBS.gsap), import(LIBS.st), import(LIBS.lenis)])
    .then(([g, s, l]) => { if (!disposed) cleanups.push(run(g.gsap, s.ScrollTrigger, l.default)); })
    .catch(err => { console.warn('[home] motion libraries unavailable, showing static home', err); if (!disposed) reveal(); });

  function run(gsap, ScrollTrigger, Lenis) {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {}, root);
    const stage = createStage($('.cine-gl'), fine);
    const mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 }, sm = { nx: 0, ny: 0 };
    const S = { x:0, y:0, z:0, s:1, amp:.55, hue:0, glow:1, rz:0, intro: reduce ? 1 : .01, burst: reduce ? 0 : 1.6 };

    // smooth scroll
    const lenis = new Lenis({ lerp: reduce ? 1 : .085, smoothWheel: !reduce });
    lenis.stop();
    lenis.on('scroll', ScrollTrigger.update);
    const raf = t => lenis.raf(t * 1000);
    gsap.ticker.add(raf); gsap.ticker.lagSmoothing(0);
    $$('[data-scroll]').forEach(a => scope.on(a, 'click', e => {
      const id = a.getAttribute('href'); e.preventDefault();
      lenis.scrollTo(id === '#portfolio-top' ? 0 : root.querySelector(id), { duration: 1.8, easing: t => 1 - Math.pow(1 - t, 4) });
    }));
    // world links: stay inside the SPA (history + world cut) instead of a full reload
    $$('[data-world-link]').forEach(a => scope.on(a, 'click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      const url = new URL(location.href); url.searchParams.set('world', a.dataset.worldLink); url.hash = '';
      history.pushState({ world: a.dataset.worldLink }, '', url);
      dispatchEvent(new PopStateEvent('popstate', { state: { world: a.dataset.worldLink } }));
    }));

    // pointer + cursor
    const cur = $('.cine-cursor-el'), ring = cur.querySelector('.ring'), dot = cur.querySelector('.dot'), label = ring.querySelector('span');
    const rx = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' });
    const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    scope.on(window, 'pointermove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.nx = e.clientX / innerWidth * 2 - 1; mouse.ny = -(e.clientY / innerHeight * 2 - 1);
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
    });
    scope.on(root, 'pointerover', e => { const a = e.target.closest('a,button'); if (a) { cur.classList.add('hover'); label.textContent = a.dataset.cursor || 'OPEN'; } });
    scope.on(root, 'pointerout', e => { const a = e.target.closest('a,button'); if (a && !a.contains(e.relatedTarget)) cur.classList.remove('hover'); });

    // kinetic type
    const heroK = proximity(heroChars, mouse, { base: 80, max: 125, gBase: 800, gMax: 900, radius: 320 });
    const markK = proximity(markChars, mouse, { base: 62, max: 125, gBase: 900, gMax: 300, radius: 260 });
    let mTimer; const remeasure = () => { clearTimeout(mTimer); mTimer = setTimeout(() => { heroK.measure(); markK.measure(); }, 120); };
    scope.on(window, 'resize', () => { stage?.resize(); remeasure(); });

    // world preview card
    if (fine) {
      const pv = $('.cine-preview'), pvBg = pv.querySelector('.bg'), pvG = pv.querySelector('.gl'), pvL = pv.querySelector('.lb');
      const px = gsap.quickTo(pv, 'x', { duration: .6, ease: 'power3' }), py = gsap.quickTo(pv, 'y', { duration: .6, ease: 'power3' }), pr = gsap.quickTo(pv, 'rotation', { duration: .6, ease: 'power3' });
      let lastX = 0;
      scope.on(window, 'pointermove', e => { px(e.clientX + 150); py(e.clientY); pr(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * .8)); lastX = e.clientX; });
      const list = $('[data-wlist]');
      scope.on(list, 'pointerover', e => {
        const a = e.target.closest('a'); if (!a) return; const w = worldCatalog[+a.dataset.i], [c1, c2] = worldColors[w.id] ?? ['#d4ff3a', '#7b5cff'];
        pvBg.style.setProperty('--c1', c1); pvBg.style.setProperty('--c2', c2);
        pvG.textContent = w.icon; pvL.textContent = `W—${pad(+a.dataset.i + 1)} · ${w.kind ?? w.id}`;
        gsap.to(pv, { scale: 1, opacity: 1, duration: .5, ease: 'expo.out', overwrite: 'auto' });
        gsap.fromTo(pvG, { scale: .4, rotation: -30 }, { scale: 1, rotation: 0, duration: .7, ease: 'back.out(2)' });
      });
      const hide = () => gsap.to(pv, { scale: 0, opacity: 0, duration: .4, ease: 'power3.in', overwrite: 'auto' });
      scope.on(list, 'pointerleave', hide);
      lenis.on('scroll', () => { const el = document.elementFromPoint(mouse.x, mouse.y); if (!el || !el.closest('[data-wlist]')) hide(); });
      gsap.to(pvBg, { '--a': '360deg', duration: 6, repeat: -1, ease: 'none' });
    }

    // frame loop
    const marqA = $('.cine-marq .a'), marqB = $('.cine-marq .b');
    let mxA = 0, mxB = -33.333, vel = 0, time = 0, last = performance.now(), frame = 0;
    const loop = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const paused = isPaused?.() || reduce;
      if (!paused) time += dt;
      sm.nx += (mouse.nx - sm.nx) * .05; sm.ny += (mouse.ny - sm.ny) * .05;
      vel += ((lenis.velocity || 0) - vel) * .1;
      if (stage) {
        const u = stage.uniforms;
        u.uTime.value = time; u.uMouse.value.set(sm.nx, sm.ny);
        stage.blob.rotation.y = time * .08 + sm.nx * .4; stage.blob.rotation.x = -sm.ny * .3;
        stage.ring.rotation.z = time * .15; stage.ring2.rotation.z = -time * .1;
        const cam = stage.camera;
        cam.position.x += (sm.nx * .35 - cam.position.x) * .05; cam.position.y += (sm.ny * .25 - cam.position.y) * .05; cam.lookAt(0, 0, 0);
        stage.pMat.uniforms.uWarp.value = Math.min(Math.abs(vel) * .02, 1);
        u.uSpeed.value = 1 + Math.min(Math.abs(vel) * .03, 2);
        stage.group.position.set(S.x, S.y, S.z); stage.group.scale.setScalar(S.s * S.intro); stage.group.rotation.z = S.rz;
        u.uAmp.value = S.amp + S.burst; u.uHue.value = S.hue; u.uGlow.value = S.glow;
        stage.render();
      }
      if (fine && !reduce) {
        if (scrollY < innerHeight * 1.2) heroK.tick(true);
        if (scrollY + innerHeight > document.documentElement.scrollHeight - innerHeight * 1.3) markK.tick(true);
      }
      if (!paused) {
        const sp = .04 + Math.abs(vel) * .012; mxA -= sp; mxB += sp;
        if (mxA < -33.333) mxA += 33.333; if (mxB > 0) mxB -= 33.333;
      }
      const sk = reduce ? 0 : gsap.utils.clamp(-14, 14, vel * .6);
      marqA.style.transform = `translate3d(${mxA}%,0,0) skewX(${-sk}deg)`;
      marqB.style.transform = `translate3d(${mxB}%,0,0) skewX(${sk}deg)`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    // scroll choreography
    ctx.add(() => {
      const isS = innerWidth < 760;
      gsap.to('.cine-hero h1', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.cine-hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.cine-hero .meta', { yPercent: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.cine-hero', start: '30% top', end: 'bottom top', scrub: true } });
      gsap.to('[data-mani] .w', { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: '.cine-mani', start: 'top 70%', end: 'bottom 70%', scrub: true } });
      gsap.from('.cine-mani .ko', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.cine-mani .ko', start: 'top 85%' } });

      const track = $('[data-track]'), dist = () => track.scrollWidth - innerWidth, n = projects.length;
      const hz = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.cine-work', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
        onToggle: self => { if (self.isActive) $('[data-chap]').textContent = $('.cine-work').dataset.chapName; },
        onUpdate: self => { $('[data-work-idx]').textContent = `${pad(Math.min(n, 1 + Math.floor(self.progress * (n + .2))))} / ${pad(n)}`; } } });
      $$('.cine-panel').forEach(p => {
        const sub = { containerAnimation: hz, trigger: p, scrub: true };
        gsap.to(p.querySelector('.frame'), { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none', scrollTrigger: { ...sub, start: 'left 95%', end: 'left 35%' } });
        gsap.fromTo(p.querySelector('img'), { xPercent: -6, scale: 1.15 }, { xPercent: 6, scale: 1, ease: 'none', scrollTrigger: { ...sub, start: 'left right', end: 'right left' } });
        gsap.fromTo(p.querySelector('.num'), { xPercent: 60 }, { xPercent: -40, ease: 'none', scrollTrigger: { ...sub, start: 'left right', end: 'right left' } });
        gsap.from(p.querySelector('h3'), { yPercent: 100, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { containerAnimation: hz, trigger: p, start: 'left 60%' } });
      });

      // object path: one keyframe per section; created after the pin so trigger positions include its spacer
      const K = [
        { x:0, y:0, z:0, s:1, amp:.55, hue:0, glow:1, rz:0 },
        { x:isS?0:2.2, y:isS?1.4:0, z:-.5, s:.75, amp:.95, hue:.35, glow:1, rz:.6 },
        { x:0, y:0, z:-5, s:.8, amp:.9, hue:.7, glow:.25, rz:1.2 },
        { x:isS?1.2:-3.4, y:isS?-2.2:-.6, z:-1.5, s:.5, amp:1.1, hue:1.1, glow:1, rz:1.8 },
        { x:isS?0:2.6, y:isS?1.6:.9, z:-1, s:.85, amp:.45, hue:1.5, glow:1, rz:2.4 },
      ];
      Object.assign(S, K[0]);
      [['.cine-mani','top bottom','top 20%'], ['.cine-work','top bottom','top top'], ['.cine-worlds','top 90%','top 10%'], ['.cine-foot','top bottom','top 20%']]
        .forEach(([trigger, start, end], i) => gsap.fromTo(S, { ...K[i] }, { ...K[i + 1], ease: 'power1.inOut', immediateRender: false, scrollTrigger: { trigger, start, end, scrub: 1.4 } }));

      gsap.from('.cine-worlds .head .line', { yPercent: 100, opacity: 0, stagger: .12, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.cine-worlds .head', start: 'top 80%' } });
      $$('.cine-wlist li').forEach(r => gsap.from(r, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 92%' } }));
      gsap.from(markChars, { yPercent: 110, stagger: .04, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '[data-wordmark]', start: 'top 95%' } });
      gsap.from('.cine-foot .top > *', { y: 50, opacity: 0, stagger: .1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.cine-foot .top', start: 'top 85%' } });

      const chap = $('[data-chap]'), prog = $('[data-prog]');
      $$('[data-chap-name]').forEach(sec => ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: self => { if (self.isActive) chap.textContent = sec.dataset.chapName; } }));
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => gsap.set(prog, { scaleX: s.progress }) });
      ScrollTrigger.addEventListener('refresh', remeasure);
    });

    // intro
    const finish = () => { document.body.classList.remove('cine-loading'); lenis.start(); remeasure(); ScrollTrigger.refresh(); };
    if (reduce) { reveal(); finish(); }
    else ctx.add(() => {
      gsap.set(heroChars, { yPercent: 120 });
      gsap.set('.cine-loader', { clipPath: 'inset(0 0 0% 0)' });
      const cnt = { v: 0 }, cEl = $('[data-cnt]');
      gsap.timeline({ onComplete: finish })
        .to(cnt, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { cEl.textContent = String(Math.round(cnt.v)).padStart(3, '0'); } })
        .to('.cine-loader .bar', { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
        .to('.cine-loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '+=.1')
        .to(S, { intro: 1, duration: 2.2, ease: 'expo.out' }, '-=.6')
        .to(S, { burst: 0, duration: 2.4, ease: 'expo.out' }, '<')
        .to(heroChars, { yPercent: 0, duration: 1.3, stagger: .035, ease: 'expo.out' }, '<+.1')
        .from('.cine-hero .kicker, .cine-hero .meta > *', { y: 30, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out' }, '<+.4')
        .from('.cine-hud', { opacity: 0, duration: 1 }, '<')
        .set('.cine-loader', { display: 'none' });
    });

    return () => {
      cancelAnimationFrame(frame); clearTimeout(mTimer);
      ScrollTrigger.removeEventListener('refresh', remeasure);
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
      stage?.dispose();
    };
  }

  return () => {
    disposed = true;
    cleanups.forEach(fn => fn());
    scope.dispose();
    document.body.classList.remove('cine-loading', 'cine-cursor');
  };
}
