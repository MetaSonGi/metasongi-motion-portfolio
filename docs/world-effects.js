const themes = {
  space:     { name:'하이퍼스페이스', color:'#a6c8ff', mode:'warp' },
  journey:   { name:'반딧불이', color:'#ddffaf', mode:'fireflies' },
  workspace: { name:'부트 시퀀스', color:'#c5abff', mode:'code', lines:['const app = document.createElement("section");','app.classList.add("project-window");','// Ready.'] },
  gallery:   { name:'전시 조명', color:'#ffd5a3', mode:'spotlight' },
  editorial: { name:'페이지 턴', color:'#ffc49f', mode:'page' },
  terminal:  { name:'콘솔 입력', color:'#9affad', mode:'code', lines:['> projects','> open vrm','> theme atlas'] },
  atlas:     { name:'노드 연결', color:'#80c8ff', mode:'network' },
  bento:     { name:'타이핑과 스파크', color:'#ffb37a', mode:'code', sparks:true, lines:['const ctx = canvas.getContext("2d");','ctx.fillStyle = "#ffb37a";','ctx.fillRect(x, y, 4, 4);'] },
  noir:      { name:'필름 번', color:'#fff1ce', mode:'film' },
  garden:    { name:'꽃가루 바람', color:'#d7f299', mode:'petals' },
};

const twoPi = Math.PI * 2;

function circle(context, x, y, radius) {
  context.beginPath();
  context.arc(x, y, radius, 0, twoPi);
  context.fill();
}

function line(context, x, y, endX, endY) {
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(endX, endY);
  context.stroke();
}

function paintParticles(context, state, mode) {
  const { width, height, progress, color } = state;
  const span = Math.min(width, height);
  context.strokeStyle = color;
  context.fillStyle = color;
  for (let index = 0; index < 67; index++) {
    const angle = index * 2.39996;
    const seed = ((index * 947) % 101) / 101;
    const travel = .16 + seed * .84;
    const opacity = Math.sin(progress * Math.PI) * (.24 + seed * .66);
    context.globalAlpha = opacity;
    if (mode === 'warp') {
      const length = span * travel * (progress ** 2 * .18 + .025);
      const distance = span * travel * (.1 + progress ** 2 * .82);
      const x = width * .56 + Math.cos(angle) * distance;
      const y = height * .48 + Math.sin(angle) * distance;
      context.lineWidth = .7 + seed * 1.4;
      line(context, x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    } else {
      const x = ((index * .617 + progress * (.1 + seed * .12)) % 1) * width;
      const y = height * (seed + (mode === 'fireflies' ? -.19 : .19) * progress) + Math.sin(angle + progress * 7) * 44;
      const size = 1.2 + seed * 4.8;
      if (mode === 'fireflies') {
        context.shadowColor = color;
        context.shadowBlur = 14;
        circle(context, x, y, size);
      } else {
        context.beginPath();
        context.ellipse(x, y, size * 1.9, size * .6, angle + progress * 7, 0, twoPi);
        context.fill();
      }
    }
  }
  context.shadowBlur = 0;
}

function paintNetwork(context, { width, height, progress, color }) {
  const points = Array.from({ length: 12 }, (_, index) => {
    const angle = index * twoPi / 12 - Math.PI / 2;
    const stretch = .35 + progress * .7;
    return [width * (.5 + Math.cos(angle) * .38 * stretch), height * (.51 + Math.sin(angle) * .28 * stretch)];
  });
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1.2;
  const head = progress * points.length;
  for (const [index, point] of points.entries()) {
    const from = points[(index + 8) % points.length];
    const reach = Math.max(0, Math.min(1, head - index + 1));
    context.globalAlpha = Math.sin(progress * Math.PI) * reach * .82;
    line(context, ...from, from[0] + (point[0] - from[0]) * reach, from[1] + (point[1] - from[1]) * reach);
    circle(context, ...point, 3 + Math.sin(progress * 11 + index) * 1.5);
  }
}

function paintLight(context, { width, height, progress, color }, mode) {
  const opacity = Math.sin(progress * Math.PI);
  context.globalAlpha = opacity * .65;
  if (mode === 'page') {
    const edge = width * (1.12 - progress * 1.28);
    const fold = context.createLinearGradient(edge - width * .12, 0, edge + width * .2, 0);
    fold.addColorStop(0, '#00000000');
    fold.addColorStop(.46, color);
    fold.addColorStop(.57, '#fffbecbb');
    fold.addColorStop(1, '#00000000');
    context.fillStyle = fold;
    context.fillRect(0, 0, width, height);
    return;
  }
  const x = width * (mode === 'film' ? -.15 + progress * 1.3 : .24 + progress * .52);
  const y = height * (mode === 'film' ? .78 : .52);
  const gradient = context.createRadialGradient(x, y, 0, x, y, Math.max(width, height) * .55);
  gradient.addColorStop(0, color);
  gradient.addColorStop(.14, color + '80');
  gradient.addColorStop(.48, color + '22');
  gradient.addColorStop(1, '#00000000');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function paintCode(context, state, lines) {
  const { width, height, progress, color } = state;
  const font = Math.max(13, Math.min(24, width * .031));
  const maxLine = Math.max(...lines.map(line => line.length));
  const unit = Math.min(font, (width - 48) / (maxLine * .65));
  const x = width * .5;
  const y = height * .48;
  const panelWidth = Math.min(width - 24, maxLine * unit * .63 + 48);
  context.globalAlpha = Math.min(1, progress * 10, (1 - progress) * 7);
  context.fillStyle = '#0a0e1c';
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(x - panelWidth / 2, y - 34, panelWidth, unit * 5.1 + 28, 16);
  context.fill();
  context.stroke();
  context.font = `600 ${unit}px "IBM Plex Mono",monospace`;
  context.textBaseline = 'middle';
  const merged = lines.join('\n');
  const typed = merged.slice(0, Math.floor(merged.length * Math.min(1, progress / .66))).split('\n');
  typed.forEach((line, index) => {
    context.fillStyle = index === typed.length - 1 ? color : '#e3ebff';
    context.fillText(line + (index === typed.length - 1 && Math.sin(progress * 65) > 0 ? ' ▍' : ''), x - panelWidth / 2 + 22, y + unit * (index * 1.48 + .35));
  });
}

export function createWorldEffect(button, announcement) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let canvas;
  let frame = 0;
  let current = null;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    canvas?.remove();
    canvas = undefined;
  }

  function replay() {
    stop();
    if (!current || motion.matches) return;
    canvas = document.createElement('canvas');
    canvas.className = 'world-effect-layer';
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    if (!context) { canvas = undefined; return; }
    document.body.append(canvas);
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const ratio = Math.min(1.5, devicePixelRatio);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const { color, mode, name, lines, sparks } = current;
    const start = performance.now();
    const duration = mode === 'code' ? 2850 : 1630;
    announcement.textContent = `${name} 효과 재생`;

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      if (progress === 1 || document.hidden || motion.matches) { stop(); return; }
      context.clearRect(0, 0, width, height);
      const state = { width, height, progress, color };
      if (mode === 'code') {
        if (sparks) paintParticles(context, state, 'fireflies');
        paintCode(context, state, lines);
      }
      else if (mode === 'network') paintNetwork(context, state);
      else if (['warp','fireflies','petals'].includes(mode)) paintParticles(context, state, mode);
      else paintLight(context, state, mode);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }

  function select(world) {
    stop();
    current = themes[world];
    button.hidden = !current || motion.matches;
    if (!current) return;
    button.title = `${current.name} 효과 재생`;
    button.setAttribute('aria-label', button.title);
    button.dataset.mode = current.mode;
    button.textContent = current.mode === 'code' ? '⌨ FX' : '✦ FX';
    button.style.setProperty('--world-fx-accent', current.color);
  }

  button.addEventListener('click', replay);
  window.addEventListener('resize', stop);
  motion.addEventListener('change', () => {
    stop();
    button.hidden = !current || motion.matches;
  });
  return { select, stop, replay };
}
