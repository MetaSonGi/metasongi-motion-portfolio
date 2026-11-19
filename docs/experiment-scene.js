import * as THREE from 'three';

const shapes = {
  prism: new THREE.Color('#b8a1ff'),
  signal: new THREE.Color('#83ffd0'),
  transit: new THREE.Color('#ff6948'),
  assembly: new THREE.Color('#abc9de'),
  frequency: new THREE.Color('#caff52'),
};

export function createExperimentScene(canvas, mode) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 90);
  const group = new THREE.Group();
  scene.add(group);
  const color = shapes[mode];
  const material = new THREE.MeshStandardMaterial({ color, metalness: .38, roughness: .24, flatShading: true });
  const wire = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: .45 });
  const rim = new THREE.DirectionalLight(color, 4);
  rim.position.set(4, 2, -3);
  const front = new THREE.DirectionalLight('#ffffff', 3.4);
  front.position.set(-4, 3, 5);
  scene.add(front, rim, new THREE.HemisphereLight('#e7e4ff', '#27293c', 1.7));

  function add(geometry, surface = material) {
    const mesh = new THREE.Mesh(geometry, surface);
    group.add(mesh);
    return mesh;
  }

  let points;
  if (mode === 'prism') {
    const core = add(new THREE.IcosahedronGeometry(2.15, 0));
    const shell = new THREE.MeshStandardMaterial({
      color, transparent: true, opacity: .19, metalness: .24, roughness: .15,
      flatShading: true, depthWrite: false, side: THREE.DoubleSide,
    });
    core.scale.set(1.1, 1.35, .83);
    add(new THREE.IcosahedronGeometry(3.25, 0), shell).scale.y = 1.2;
    add(new THREE.IcosahedronGeometry(3.28, 0), wire).scale.y = 1.2;
  } else if (mode === 'signal' || mode === 'frequency') {
    const count = mode === 'signal' ? 52 * 52 : 180 * 12;
    points = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    const geometry = new THREE.BufferGeometry().setAttribute('position', points);
    group.add(new THREE.Points(geometry, new THREE.PointsMaterial({
      color, size: mode === 'signal' ? .059 : .078, transparent: true, opacity: .85,
    })));
    group.frustumCulled = false;
    group.children[0].frustumCulled = false;
  } else if (mode === 'transit') {
    for (let index = 0; index < 20; index++) {
      const ring = add(new THREE.TorusGeometry(3.6, .043, 4, index % 2 ? 4 : 6));
      ring.rotation.z = index * .17;
      ring.position.z = -index * 2.1;
    }
  } else {
    for (let index = 0; index < 7; index++) {
      add(new THREE.CylinderGeometry(1.65 - index * .09, 1.65 - index * .09, .24, 8, 1, index % 2 === 1));
    }
  }

  return {
    resize(width, height) {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },
    render({ time, x, y, travel, value, pulse }) {
      camera.position.set(x * .55, y * -.35, mode === 'transit' ? 5 - travel * 34 : camera.aspect < 1 ? 15 : 11);
      camera.lookAt(0, 0, mode === 'transit' ? camera.position.z - 8 : 0);
      group.rotation.set(.11 + y * .38, x * .62, 0);
      if (mode === 'prism') {
        group.rotation.y += time * .24 + value * Math.PI * 2;
        group.rotation.z = travel * 1.5;
        group.scale.setScalar(1 + travel * .24);
      } else if (mode === 'signal') {
        group.rotation.x = -.9 + y * .18;
        for (let index = 0; index < points.count; index++) {
          const px = (index % 52 - 25.5) * .2;
          const py = (Math.floor(index / 52) - 25.5) * .2;
          const distance = Math.hypot(px - x * 4, py + y * 4);
          const wave = Math.sin(distance * 2.5 - time * 3.1);
          const ring = Math.exp(-Math.abs(distance - pulse * 7) * 1.9) * (1 - pulse);
          points.setXYZ(index, px, py, wave * .24 + ring * 1.75);
        }
        points.needsUpdate = true;
      } else if (mode === 'frequency') {
        for (let index = 0; index < points.count; index++) {
          const px = (index % 180 - 89.5) * .054;
          const band = Math.floor(index / 180);
          const phase = px * (1 + value * 4) - time * 2 + band * .24;
          points.setXYZ(index, px, Math.sin(phase) * (1.27 - band * .048), (band - 5) * .24 + Math.cos(phase) * .74);
        }
        points.needsUpdate = true;
        group.rotation.y += travel * .28;
      } else if (mode === 'transit') {
        group.rotation.set(0, 0, travel * 2.4 + time * .065);
      } else {
        group.rotation.set(.58 + y * .4, time * .21 + x * .7 + travel * 1.4, -.29);
        group.children.forEach((part, index) => {
          part.position.y = (index - 3) * (.28 + value * .66);
          part.rotation.y = index * value * .32;
        });
      }
      renderer.render(scene, camera);
    },
    dispose() {
      const materials = new Set([material, wire]);
      for (const mesh of group.children) {
        mesh.geometry.dispose();
        materials.add(mesh.material);
      }
      materials.forEach(surface => surface.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
