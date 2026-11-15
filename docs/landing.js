import { playIntroSound } from './landing-sfx.js?v=motion-3';
import { createLandingScene } from './landing-scene.js?v=motion-3';
import { projects, profileURL, tags } from './content.js?v=ten-worlds-1';
import { createScope, mountProjectViewer } from './world-utils.js?v=ten-worlds-1';

export function mountLanding(root, { openMenu, isPaused }) {
  const scope = createScope();
  root.innerHTML = `
    <div class="landing">
      <div class="landing-flight"><section class="landing-hero" aria-labelledby="landing-title">
        <div class="landing-copy">
          <p class="landing-kicker">CREATIVE DEVELOPER</p>
          <h1 id="landing-title">Interfaces<br><em>in motion.</em></h1>
          <p>목소리를 움직임으로, 코드를 탐험할 수 있는 공간으로.<br>MetaSonGi의 웹 인터랙션과 AI 영상 실험.</p>
          <div class="landing-actions">
            <a href="#selected-work">프로젝트 보기 ↓</a>
            <button data-landing-worlds>10개 세계 탐험 ↗</button>
          </div>
        </div>
        <button class="landing-preview" type="button" aria-pressed="false">▶ 인트로 · 사운드</button>
        <span class="sr-only" role="status" data-intro-status></span>
        <div class="landing-visual">
          <div class="landing-orbit" aria-hidden="true"></div>
          <canvas aria-hidden="true"></canvas>
        </div>
      </section></div>
      <section id="selected-work" class="landing-work" aria-labelledby="work-title">
        <h2 id="work-title">Selected work</h2>
        <div class="landing-projects">${projects.map(project => `
          <button class="landing-project" data-case="${project.id}">
            <span class="landing-project-art art-${project.id}" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="landing-kicker">${project.category}</span>
            <strong>${project.name} <span aria-hidden="true">↗</span></strong>
            <span>${project.description}</span>
            <span class="tag-list">${tags(project.stack)}</span>
          </button>`).join('')}</div>
      </section>
      <footer class="landing-footer">
        <button data-landing-worlds>10개 세계 탐험 ↗</button>
        <a href="${profileURL}">GitHub ↗</a>
      </footer>
    </div>`;
  root.querySelectorAll('[data-landing-worlds]').forEach(button => scope.on(button, 'click', openMenu));
  mountProjectViewer(root, scope);

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
