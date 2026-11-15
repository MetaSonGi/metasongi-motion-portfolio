import { projects, profileURL, tags } from './content.js?v=ten-worlds-1';
import { createScope, mountProjectViewer } from './world-utils.js?v=ten-worlds-1';

export function mountLanding(root, { openMenu, isPaused }) {
  const scope = createScope();
  root.innerHTML = `
    <div class="landing">
      <section class="landing-hero" aria-labelledby="landing-title">
        <div class="landing-copy">
          <p class="landing-kicker">CREATIVE DEVELOPER</p>
          <h1 id="landing-title">Interfaces<br><em>in motion.</em></h1>
          <p>목소리를 움직임으로, 코드를 탐험할 수 있는 공간으로.<br>MetaSonGi의 웹 인터랙션과 AI 영상 실험.</p>
          <div class="landing-actions">
            <a href="#selected-work">프로젝트 보기 ↓</a>
            <button data-landing-worlds>10개 세계 탐험 ↗</button>
          </div>
        </div>
        <div class="landing-visual">
          <div class="landing-orbit" aria-hidden="true"></div>
          <canvas aria-hidden="true"></canvas>
        </div>
      </section>
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

  const visual = root.querySelector('.landing-visual');
  const canvas = visual.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return () => scope.dispose();

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const particles = Array.from({ length: 3100 }, (_, index) => {
    const y = 1 - 2 * (index + .5) / 3100;
    const ring = Math.sqrt(1 - y * y);
    const angle = index * goldenAngle;
    return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring, angle };
  });
  let width = 0;
  let height = 0;
  let frame = 0;
  let yaw = .35;
  let pitch = -.13;
  let pointerX = 0;
  let pointerY = 0;
  let last = 0;
  let progress = 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  function draw(phase) {
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";
    const radius = Math.min(width, height) * (.348 + phase * .04);
    const cx = Math.cos(pitch);
    const sx = Math.sin(pitch);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const colors = ['#a2adff', '#829aff', '#c2caff', '#65daff', '#e1edff', '#fff0c6'];
    for (const point of particles) {
      const ripple = 1 + .07 * Math.sin(point.y * 17 + point.angle * .09 + yaw * 3);
      const x = (point.x * cy - point.z * sy) * ripple;
      const z = (point.x * sy + point.z * cy) * ripple;
      const y = point.y * ripple;
      const depth = z * cx + y * sx;
      const perspective = 3.5 / (3.5 - depth);
      const spread = 1 + phase * (.3 + .3 * Math.sin(point.angle));
      const px = width / 2 + x * radius * perspective * spread;
      const py = height / 2 + (y * cx - z * sx) * radius * perspective;
      const light = (Math.sin(point.y * 12 + point.x * 4 + yaw * 4) + 1) / 2;
      const size = .65 + Math.max(0, depth) * 1.15 + light * .9;
      context.globalAlpha = .16 + (.2 + .55 * light) * perspective / 1.4;
      context.fillStyle = colors[Math.min(5, Math.floor(light * 6))];
      context.fillRect(px, py, size, size);
    }
    context.globalAlpha = 1;
  }

  function resize() {
    const bounds = visual.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(progress);
  }

  function tick(now) {
    const dt = Math.min((now - last) / 1000, .04);
    last = now;
    if (!isPaused() && !motion.matches && !document.hidden && visual.getBoundingClientRect().bottom > 0) {
      const target = Math.min(1, scrollY / Math.max(1, visual.offsetHeight));
      progress += (target - progress) * Math.min(1, dt * 5);
      yaw += dt * (.22 + pointerX * .5 + progress * .4);
      pitch += (pointerY * .38 - .13 - pitch) * Math.min(1, dt * 4);
      draw(progress);
    }
    frame = requestAnimationFrame(tick);
  }

  scope.on(visual, 'pointermove', event => {
    const rect = visual.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  }, { passive: true });
  scope.on(visual, 'pointerleave', () => { pointerX = 0; pointerY = 0; });
  const observer = new ResizeObserver(resize);
  observer.observe(visual);
  resize();
  frame = requestAnimationFrame(tick);
  scope.add(() => {
    observer.disconnect();
    cancelAnimationFrame(frame);
  });
  return () => scope.dispose();
}
