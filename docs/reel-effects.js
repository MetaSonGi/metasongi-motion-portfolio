const colors = ['#8ed2ff', '#b5a4ff', '#73eafa'];
const tau = Math.PI * 2;

export function mountReelEffects(stage, scope) {
  const canvas = stage.querySelector('.reel-fx');
  const context = canvas.getContext('2d');
  if (!context) return () => {};

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const particles = Array.from({ length: 72 }, (_, index) => ({
    angle: index * 2.399963,
    radius: .32 + (index % 13) / 20,
    phase: (index * .173) % 1,
    depth: .35 + (index % 19) / 23,
  }));
  let width = 1;
  let height = 1;
  let mode = 0;
  let visible = false;
  let frame = 0;
  let burstAt = -Infinity;
  let aimX = 0;
  let aimY = 0;
  let cameraX = 0;
  let cameraY = 0;

  function paint(now) {
    frame = 0;
    context.clearRect(0, 0, width, height);
    if (!visible || motion.matches || document.hidden || document.body.classList.contains('motion-paused')) {
      if (visible && !motion.matches && !document.hidden) frame = requestAnimationFrame(paint);
      return;
    }

    cameraX += (aimX - cameraX) * .055;
    cameraY += (aimY - cameraY) * .055;
    const compact = width < 700;
    const x = width * (compact ? .63 : .71) + cameraX * 25;
    const y = height * (compact ? .37 : .46) + cameraY * 25;
    const size = Math.min(width, height);
    const t = now / 1000;
    const age = Math.max(0, (now - burstAt) / 1000);
    const burst = Math.max(0, 1 - age / .92);
    const travel = 1 - burst ** 3;
    context.globalCompositeOperation = 'lighter';
    context.fillStyle = colors[mode];
    context.strokeStyle = colors[mode];

    for (const [index, point] of particles.entries()) {
      const angle = point.angle + t * (.28 + point.depth * .17);
      const spread = point.radius * size * (.38 + travel * .94);
      context.globalAlpha = .12 + point.depth * .24 + burst * .38;
      if (mode === 0) {
        const px = x + Math.cos(angle) * spread;
        const py = y + Math.sin(angle) * spread * .7;
        const edge = (1.1 + point.depth * 3.7) * (1 + burst * 1.4);
        context.beginPath();
        context.moveTo(px, py);
        context.lineTo(px + Math.cos(angle + 1.2) * edge, py + Math.sin(angle + 1.2) * edge);
        context.lineTo(px - Math.cos(angle) * edge * 1.7, py - Math.sin(angle) * edge * 1.7);
        context.fill();
      } else if (mode === 1) {
        const lane = (point.phase + t * (.14 + point.depth * .25)) % 1;
        const px = width * (.32 + lane * .79);
        const py = y + Math.sin(point.angle) * height * .67 - lane * height * .19;
        context.lineWidth = .45 + point.depth * 1.35;
        context.beginPath();
        context.moveTo(px, py);
        context.lineTo(px - (12 + point.depth * 50) * (1 + burst), py + 4 + point.depth * 9);
        context.stroke();
      } else {
        const ring = index % 3;
        const radius = size * (.21 + ring * .093) * (1 + travel * .25);
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius * (.23 + ring * .12) + (px - x) * (ring * .27 - .25);
        context.beginPath();
        context.arc(px, py, .7 + point.depth * 1.55 + burst * 1.1, 0, tau);
        context.fill();
      }
    }

    if (burst > 0) {
      context.globalAlpha = burst ** 2 * .6;
      context.lineWidth = 1.6;
      context.beginPath();
      context.ellipse(x, y, 2 + size * travel * .68, 2 + size * travel * .27, -.23, 0, tau);
      context.stroke();

      const glow = context.createRadialGradient(x, y, 1, x, y, size * .48);
      glow.addColorStop(0, '#edf9ffb0');
      glow.addColorStop(.23, colors[mode] + '60');
      glow.addColorStop(1, '#00000000');
      context.globalAlpha = burst ** 2 * .55;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    frame = requestAnimationFrame(paint);
  }

  function schedule() {
    if (visible && !motion.matches && !document.hidden && !frame) frame = requestAnimationFrame(paint);
  }

  const resize = new ResizeObserver(() => {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    const ratio = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    schedule();
  });
  const view = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !visible) burstAt = performance.now();
    visible = entry.isIntersecting;
    if (!visible) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    schedule();
  });
  resize.observe(canvas);
  view.observe(canvas);

  scope.on(canvas.parentElement, 'pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = canvas.getBoundingClientRect();
    aimX = (event.clientX - rect.left) / width - .5;
    aimY = (event.clientY - rect.top) / height - .5;
  }, { passive: true });
  scope.on(canvas.parentElement, 'pointerleave', () => { aimX = 0; aimY = 0; });
  scope.on(motion, 'change', schedule);
  scope.on(document, 'visibilitychange', schedule);
  scope.add(() => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    view.disconnect();
  });

  return index => {
    mode = index;
    burstAt = performance.now();
    schedule();
  };
}
