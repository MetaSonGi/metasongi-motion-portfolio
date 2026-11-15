const style = {
  space: ['#9daeff','#354cff','circle'],
  journey: ['#deffcb','#71bd80','circle'],
  workspace: ['#e0caff','#764eff','grid'],
  gallery: ['#ffe4b9','#d08f52','beam'],
  editorial: ['#ffd8a6','#da764b','beam'],
  terminal: ['#c1ffb8','#26d574','grid'],
  atlas: ['#c3f5ff','#4898ec','grid'],
  bento: ['#fff0b5','#ef9857','circle'],
  noir: ['#f8f7ff','#aaa6c0','beam'],
  garden: ['#e8ffbc','#85ad61','circle'],
  home: ['#d6eaff','#447bff','beam'],
};

export function playWorldCut(world, label) {
  document.querySelector('.world-cut')?.remove();
  const [highlight, tint, shape] = style[world] || style.home;
  const cut = document.createElement('div');
  cut.className = 'world-cut';
  cut.dataset.shape = shape;
  cut.setAttribute('aria-hidden', 'true');
  cut.style.setProperty('--cut-light', highlight);
  cut.style.setProperty('--cut-tint', tint);
  const beam = document.createElement('i');
  const ring = document.createElement('i');
  const title = document.createElement('span');
  title.textContent = label;
  cut.append(beam, ring, title);
  document.body.append(cut);
  cut.addEventListener('animationend', event => {
    if (event.target === cut) cut.remove();
  });
}
