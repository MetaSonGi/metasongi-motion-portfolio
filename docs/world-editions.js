import { createScope } from './world-utils.js?v=ten-worlds-1';

function control(scope, host, id, text, change) {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = id;
  button.className = 'edition-control';
  button.textContent = text;
  button.setAttribute('aria-pressed', 'false');
  host.append(button);
  scope.on(button, 'click', () => {
    const active = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(active));
    change(active, button);
  });
}

function mountOrbit(scope, root) {
  const stage = root.querySelector('.story-stage');
  const ui = document.createElement('div');
  ui.className = 'orbital-matte';
  ui.setAttribute('aria-hidden', 'true');
  stage.append(ui);
  control(scope, stage, 'orbit-frame', '와이드 프레임', active => stage.classList.toggle('wide-frame', active));
}

function mountJourneyMood(scope, root) {
  const stage = root.querySelector('.story-stage');
  control(scope, stage, 'journey-dusk', '노을 보기', (active, button) => {
    stage.classList.toggle('at-dusk', active);
    button.textContent = active ? '낮으로 돌아가기' : '노을 보기';
  });
}

function mountGalleryLight(scope, root) {
  root.querySelectorAll('.exhibit-art').forEach(art => {
    scope.on(art, 'pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const rect = art.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      art.style.setProperty('--light-x', x * 100 + '%');
      art.style.setProperty('--light-y', y * 100 + '%');
      art.style.setProperty('--tilt-x', (x - .5) * 38 + 'deg');
      art.style.setProperty('--tilt-y', (.5 - y) * 30 + 'deg');
    }, { passive: true });
    scope.on(art, 'pointerleave', () => {
      for (const name of ['--light-x', '--light-y', '--tilt-x', '--tilt-y']) art.style.removeProperty(name);
    });
  });
}

function mountJournalIndex(scope, root) {
  const nav = document.createElement('nav');
  nav.className = 'journal-index';
  nav.setAttribute('aria-label', '이번 호 목차');
  const articles = [...root.querySelectorAll('.journal-story')];
  const links = articles.map((article, index) => {
    article.id = 'journal-story-' + (index + 1);
    article.tabIndex = -1;
    const link = document.createElement('a');
    link.href = '#' + article.id;
    link.textContent = article.querySelector('h2').textContent;
    scope.on(link, 'click', () => {
      article.querySelector('details').open = true;
      article.focus({ preventScroll: true });
    });
    nav.append(link);
    return link;
  });
  const stories = root.querySelector('.journal-stories');
  stories.before(nav);
  const deepLink = articles.find(article => location.hash === '#' + article.id);
  if (deepLink) {
    deepLink.querySelector('details').open = true;
    requestAnimationFrame(() => {
      if (!scope.signal.aborted) deepLink.scrollIntoView();
    });
  }
  function update() {
    let current = 0;
    for (let index = 0; index < articles.length; index++) {
      if (articles[index].getBoundingClientRect().top <= innerHeight * .48) current = index;
    }
    links.forEach((link, index) => link.setAttribute('aria-current', index === current ? 'location' : 'false'));
  }
  scope.on(window, 'scroll', update, { passive: true });
  scope.on(window, 'resize', update);
  update();
}

function mountPhosphor(scope, root) {
  const world = root.querySelector('.console-world');
  const button = root.querySelector('#console-palette');
  button.setAttribute('aria-pressed', 'false');
  scope.on(button, 'click', () => {
    const amber = world.dataset.phosphor !== 'amber';
    world.dataset.phosphor = amber ? 'amber' : 'green';
    button.textContent = amber ? 'PHOSPHOR: AMBER' : 'PHOSPHOR: GREEN';
    button.setAttribute('aria-pressed', String(amber));
  });
}

function mountGardenSeason(scope, root) {
  const world = root.querySelector('.garden-world');
  const plant = root.querySelector('#garden-plant');
  const host = document.createElement('div');
  host.className = 'garden-actions';
  plant.before(host);
  host.append(plant);
  control(scope, host, 'garden-season', '가을빛으로', (active, button) => {
    world.classList.toggle('in-autumn', active);
    button.textContent = active ? '봄빛으로' : '가을빛으로';
  });
}

const editions = {
  space: mountOrbit,
  journey: mountJourneyMood,
  gallery: mountGalleryLight,
  editorial: mountJournalIndex,
  terminal: mountPhosphor,
  garden: mountGardenSeason,
};

export function mountWorldEdition(root, name) {
  const scope = createScope();
  editions[name]?.(scope, root);
  return () => scope.dispose();
}
