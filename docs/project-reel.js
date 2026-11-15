import { mountReelEffects } from './reel-effects.js?v=fx-1';
import { createCutAudio } from './landing-sfx.js?v=cut-1';

export function mountProjectReel(root, scope) {
  const reel = root.querySelector('.project-reel');
  const stage = reel.querySelector('.project-stage');
  const light = stage.querySelector('.reel-cut-light');
  const chapters = [...reel.querySelectorAll('.landing-project')];
  const shots = [...reel.querySelectorAll('[data-shot]')];
  const previous = reel.querySelector('[data-previous]');
  const next = reel.querySelector('[data-next]');
  const replay = reel.querySelector('[data-replay-fx]');
  const playback = reel.querySelector('[data-play-reel]');
  const sound = reel.querySelector('[data-cut-audio]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const playEffect = mountReelEffects(stage, scope);
  const audio = createCutAudio();
  let active = -1;
  let frame = 0;
  let timer = 0;
  let playing = false;
  let soundEnabled = false;
  let requestingSound = false;
  let cutAnimations = [];

  function clearCut() {
    for (const animation of cutAnimations) animation.cancel();
    cutAnimations = [];
    chapters.forEach(chapter => chapter.classList.remove('previous-shot'));
  }

  function cut(from, to) {
    clearCut();
    if (from < 0 || to < 0 || document.body.classList.contains('motion-paused')) return;
    const reverse = to < from;
    const direction = reverse ? -1 : 1;
    const outgoing = chapters[from];
    const incoming = chapters[to];
    outgoing.classList.add('previous-shot');

    const timing = { duration: 700, easing: 'cubic-bezier(.25,.65,.29,1)' };
    const oldFrame = outgoing.animate([
      { transform: 'translateX(0) scale(1)', filter: 'blur(0)', opacity: 1 },
      { transform: `translateX(${-6 * direction}%) scale(1.11)`, filter: 'blur(8px) brightness(1.15)', opacity: .7, offset: .46 },
      { transform: `translateX(${-10 * direction}%) scale(1.2)`, filter: 'blur(13px)', opacity: 0 },
    ], timing);
    const newFrame = incoming.animate([
      { transform: `translateX(${11 * direction}%) scale(1.16)`, filter: 'blur(12px)', opacity: 0 },
      { opacity: .42, filter: 'blur(5px)', offset: .32 },
      { transform: 'translateX(0) scale(1)', filter: 'blur(0)', opacity: 1 },
    ], timing);
    cutAnimations = [oldFrame, newFrame, light.animate([
      { transform: `translateX(${-70 * direction}%) skewX(-18deg)`, opacity: 0 },
      { opacity: .85, offset: .34 },
      { transform: `translateX(${75 * direction}%) skewX(-18deg)`, opacity: 0 },
    ], timing)];
    void oldFrame.finished.then(() => outgoing.classList.remove('previous-shot')).catch(() => {});
    audio.play(to, reverse);
  }

  function draw() {
    frame = 0;
    const range = Math.max(1, reel.offsetHeight - stage.offsetHeight);
    const stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
    const offset = stickyTop - reel.getBoundingClientRect().top;
    const progress = Math.max(0, Math.min(1, offset / range));
    const index = motion.matches ? -1 : Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
    const local = index < 0 ? 0 : progress * chapters.length - index;
    reel.style.setProperty('--reel-progress', String(progress));
    reel.style.setProperty('--cut-drift', String(local));
    if (index === active) return;

    for (const [chapterIndex, chapter] of chapters.entries()) {
      const isCurrent = chapterIndex === index;
      chapter.classList.toggle('current-shot', isCurrent);
      chapter.inert = index !== -1 && !isCurrent;
      shots[chapterIndex].setAttribute('aria-current', isCurrent ? 'step' : 'false');
    }
    cut(active, index);
    active = index;
    if (index >= 0) playEffect(index);
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

  function stopPlayback() {
    clearTimeout(timer);
    playing = false;
    playback.setAttribute('aria-pressed', 'false');
    playback.textContent = '▶';
  }

  function advance() {
    if (!playing || document.hidden || motion.matches || document.body.classList.contains('motion-paused') ||
        document.querySelector('.case-viewer[open]') || active >= chapters.length - 1) {
      stopPlayback();
      return;
    }
    seek(active + 1);
    timer = setTimeout(advance, 2400);
  }

  shots.forEach((button, index) => scope.on(button, 'click', () => { stopPlayback(); seek(index); }));
  scope.on(replay, 'click', () => {
    if (active < 0) return;
    playEffect(active);
    audio.play(active, false);
  });
  scope.on(previous, 'click', () => { stopPlayback(); seek(active - 1); });
  scope.on(next, 'click', () => { stopPlayback(); seek(active + 1); });
  scope.on(playback, 'click', () => {
    if (playing) { stopPlayback(); return; }
    seek(0);
    playing = true;
    playback.textContent = 'Ⅱ';
    playback.setAttribute('aria-pressed', 'true');
    timer = setTimeout(advance, 2400);
  });
  scope.on(sound, 'click', async () => {
    if (requestingSound) return;
    if (soundEnabled) {
      audio.disable();
      soundEnabled = false;
    } else {
      requestingSound = true;
      try { soundEnabled = await audio.enable(); } catch { soundEnabled = false; }
      requestingSound = false;
      if (scope.signal.aborted) return;
      if (soundEnabled) audio.play(Math.max(0, active), false);
    }
    sound.setAttribute('aria-pressed', String(soundEnabled));
    sound.textContent = soundEnabled ? '소리 켜짐' : '소리 꺼짐';
  });
  scope.on(window, 'wheel', stopPlayback, { passive: true });
  scope.on(window, 'touchmove', stopPlayback, { passive: true });
  scope.on(window, 'scroll', schedule, { passive: true });
  scope.on(window, 'resize', schedule);
  scope.on(motion, 'change', schedule);
  scope.on(document, 'visibilitychange', () => { if (document.hidden) stopPlayback(); });
  scope.add(() => {
    cancelAnimationFrame(frame);
    stopPlayback();
    clearCut();
    audio.dispose();
  });
  reel.classList.add('reel-ready');
  draw();
}
