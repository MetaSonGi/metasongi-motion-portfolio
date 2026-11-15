import { mountProjectReel } from './project-reel.js?v=cut-1';
import { playIntroSound } from './landing-sfx.js?v=cut-1';
import { createLandingScene } from './landing-scene.js?v=motion-4';
import { worldCatalog } from './world-catalog.js?v=ten-worlds-1';
import { projects, profileURL } from './content.js?v=ten-worlds-1';
import { createScope, mountProjectViewer } from './world-utils.js?v=ten-worlds-1';

const projectArt = { vrm: 'vrm', pixelle: 'glass', motion: 'orbit' };

export function mountLanding(root, { isPaused }) {
  const scope = createScope();
  root.innerHTML = `
    <div class="landing" id="portfolio-top">
      <div class="landing-flight"><section class="landing-hero" aria-labelledby="landing-title">
        <div class="landing-copy">
          <h1 id="landing-title">Interfaces<br><em>in motion.</em></h1>
          <div class="landing-actions">
            <a href="#selected-work">프로젝트 보기 ↓</a>
            <a class="landing-secondary" href="#portfolio-worlds">10개 세계 탐험 ↓</a>
          </div>
        </div>
        <button class="landing-preview" type="button" aria-pressed="false">▶ 인트로 · 사운드</button>
        <span class="sr-only" role="status" data-intro-status></span>
        <div class="landing-visual">
          <div class="landing-orbit" aria-hidden="true"></div>
          <canvas aria-hidden="true"></canvas>
        </div>
      </section></div>
      <section id="selected-work" class="landing-work film-work" aria-labelledby="work-title">
        <div class="landing-section-head" data-scene-reveal>
          <h2 id="work-title">Works.</h2>
          <p>스크롤로 장면 전환 ↓</p>
        </div>
        <div class="project-reel"><div class="project-stage"><div class="landing-projects">${projects.map(project => `
          <article class="landing-project scene-${project.id}">
            <div class="project-frame" aria-hidden="true"><img src="art/${projectArt[project.id]}.jpg" alt="" decoding="async"></div>
            <div class="landing-project-copy">
              <h3>${project.name}</h3>
              <div class="project-ctas">
                <button type="button" data-case="${project.id}">프로젝트 상세 ↗</button>
                <a href="${project.url}" target="_blank" rel="noopener">소스 코드 ↗</a>
              </div>
            </div>
          </article>`).join('')}
            <canvas class="reel-fx" aria-hidden="true"></canvas>
            <div class="reel-cut-light" aria-hidden="true"></div>
          </div>
          <div class="reel-controls" role="group" aria-label="프로젝트 장면 선택">
            <button type="button" data-play-reel aria-label="연속 재생" aria-pressed="false" title="세 장면 연속 재생">▶</button>
            <button type="button" data-previous aria-label="이전 장면">←</button>
            <div class="reel-shots">
              ${['가상 인물','AI 영상','10개 세계'].map((label,index) => `<button type="button" data-shot="${index}"><span>${label}</span></button>`).join('')}
            </div>
            <button type="button" data-next aria-label="다음 장면">→</button>
            <button type="button" data-replay-fx aria-label="장면 효과 다시 재생" title="효과 다시 재생">⟲</button>
            <button type="button" data-cut-audio aria-label="장면 효과음" aria-pressed="false">소리 꺼짐</button>
          </div>
        </div></div>
      </section>
      <section id="portfolio-worlds" class="landing-worlds" aria-labelledby="worlds-title">
        <div class="landing-section-head" data-scene-reveal>
          <h2 id="worlds-title">Ten<br><em>worlds.</em></h2>
          <p>각 세계는 레이아웃과 탐색 방식이 다릅니다.</p>
        </div>
        <div class="landing-world-grid" data-scene-reveal>${worldCatalog.map(world => `
          <a href="?world=${world.id}" class="landing-world-link">
            <span class="world-glyph" aria-hidden="true">${world.icon}</span>
            <span><strong>${world.name}</strong><small>${world.label}</small></span>
            <span aria-hidden="true">↗</span>
          </a>`).join('')}</div>
      </section>
      <footer class="landing-footer" data-scene-reveal>
        <h2>MetaSonGi</h2>
        <div><a href="${profileURL}">GitHub ↗</a><a href="#portfolio-top">맨 위로 ↑</a></div>
      </footer>
    </div>`;
  mountProjectViewer(root, scope);
  mountProjectReel(root, scope);

  const reveals = root.querySelectorAll('[data-scene-reveal]');
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('scene-arrived');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: .13 });
  reveals.forEach(element => revealObserver.observe(element));
  scope.add(() => revealObserver.disconnect());
  const flight = root.querySelector('.landing-flight');
  const hero = flight.querySelector('.landing-hero');
  const visual = hero.querySelector('.landing-visual');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const preview = hero.querySelector('.landing-preview');
  const status = hero.querySelector('[data-intro-status]');
  let audio;
  let started = null;

  function stopIntro() {
    started = null;
    preview.textContent = '▶ 인트로 · 사운드';
    preview.setAttribute('aria-pressed', 'false');
    hero.style.setProperty('--impact', '0');
    if (audio) {
      void audio.close().catch(() => {});
      audio = undefined;
    }
  }

  scope.on(preview, 'click', () => {
    if (started !== null) {
      stopIntro();
      status.textContent = '인트로를 정지했습니다.';
      return;
    }
    started = performance.now();
    preview.textContent = '■ 인트로 정지';
    preview.setAttribute('aria-pressed', 'true');
    status.textContent = '인트로 재생 중입니다.';
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      audio = new Audio();
      void playIntroSound(audio).catch(() => {
        if (started !== null) status.textContent = '효과음을 재생할 수 없어 화면만 재생합니다.';
      });
    } catch {
      status.textContent = '효과음을 재생할 수 없어 화면만 재생합니다.';
    }
  });
  scope.on(document, 'visibilitychange', () => {
    if (document.hidden && started !== null) stopIntro();
  });
  scope.add(stopIntro);

  let scene;
  try {
    scene = createLandingScene(visual.querySelector('canvas'));
    visual.classList.add('has-scene');
  } catch {
    flight.classList.add('static-flight');
    preview.hidden = true;
    return () => scope.dispose();
  }

  let frame = 0;
  let last = performance.now();
  let pointerX = 0;
  let pointerY = 0;
  let smoothX = 0;
  let smoothY = 0;
  let progress = 0;

  function resize() {
    scene.resize(hero.clientWidth, hero.clientHeight);
    scene.render(progress, 0, smoothX, smoothY);
  }

  function render(now) {
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    const elapsed = started === null ? 0 : (now - started) / 1000;
    if (elapsed > 2.85) {
      stopIntro();
      status.textContent = '인트로 재생이 끝났습니다.';
    }
    const rect = flight.getBoundingClientRect();
    if (!motion.matches && rect.bottom > 0 && !document.hidden) {
      const scrollRange = Math.max(1, flight.offsetHeight - hero.offsetHeight);
      const paused = isPaused();
      progress = paused ? 0 : Math.max(0, Math.min(1, -rect.top / scrollRange));
      const movement = paused ? 0 : dt;
      smoothX += (pointerX - smoothX) * movement * 5;
      smoothY += (pointerY - smoothY) * movement * 5;
      hero.style.setProperty('--travel', String(progress));
      const playing = started !== null && !paused;
      const impact = playing ? Math.exp(-Math.max(0, elapsed - 1.1) * 4.2) * Math.min(1, elapsed ** 3 / 1.1 ** 3) : 0;
      const scrollImpact = Math.max(0, 1 - Math.abs(progress - .76) * 5) * .32;
      const push = playing ? Math.sin(Math.PI * Math.min(1, elapsed / 2.85)) * .63 : 0;
      hero.style.setProperty('--impact', String(Math.max(impact, scrollImpact)));
      scene.render(Math.max(progress, push), movement, smoothX, smoothY, Math.max(impact, scrollImpact));
    }
    frame = requestAnimationFrame(render);
  }

  scope.on(hero, 'pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  }, { passive: true });
  scope.on(hero, 'pointerleave', () => { pointerX = 0; pointerY = 0; });
  scope.on(motion, 'change', () => {
    if (!motion.matches) return;
    progress = 0;
    hero.style.setProperty('--travel', '0');
    scene.render(0, 0, 0, 0);
  });
  const observer = new ResizeObserver(resize);
  observer.observe(hero);
  resize();
  frame = requestAnimationFrame(render);
  scope.add(() => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    scene.dispose();
  });
  return () => scope.dispose();
}
