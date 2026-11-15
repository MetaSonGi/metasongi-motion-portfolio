export function mountProjectReel(root, scope) {
  const reel = root.querySelector('.project-reel');
  const stage = reel.querySelector('.project-stage');
  const chapters = [...reel.querySelectorAll('.landing-project')];
  const shots = [...reel.querySelectorAll('[data-shot]')];
  const previous = reel.querySelector('[data-previous]');
  const next = reel.querySelector('[data-next]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = -1;
  let frame = 0;

  function draw() {
    frame = 0;
    const range = Math.max(1, reel.offsetHeight - stage.offsetHeight);
    const stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
    const offset = stickyTop - reel.getBoundingClientRect().top;
    const progress = Math.max(0, Math.min(1, offset / range));
    const index = motion.matches ? -1 : Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
    reel.style.setProperty('--reel-progress', String(progress));
    if (index === active) return;

    for (const [chapterIndex, chapter] of chapters.entries()) {
      const isCurrent = chapterIndex === index;
      chapter.classList.toggle('current-shot', isCurrent);
      chapter.inert = index !== -1 && !isCurrent;
      shots[chapterIndex].setAttribute('aria-current', isCurrent ? 'step' : 'false');
    }
    active = index;
    previous.setAttribute('aria-disabled', String(index <= 0));
    next.setAttribute('aria-disabled', String(index >= chapters.length - 1));
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function seek(index) {
    if (index < 0 || index >= chapters.length || motion.matches) return;
    const range = reel.offsetHeight - stage.offsetHeight;
    const stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
    const start = reel.getBoundingClientRect().top + window.scrollY - stickyTop;
    const position = index === 0 ? 0 : (index + .12) / chapters.length;
    window.scrollTo({ top: start + position * range, behavior: 'instant' });
    draw();
  }

  shots.forEach((button, index) => scope.on(button, 'click', () => seek(index)));
  scope.on(previous, 'click', () => seek(active - 1));
  scope.on(next, 'click', () => seek(active + 1));
  scope.on(window, 'scroll', schedule, { passive: true });
  scope.on(window, 'resize', schedule);
  scope.on(motion, 'change', schedule);
  scope.add(() => cancelAnimationFrame(frame));
  reel.classList.add('reel-ready');
  draw();
}
