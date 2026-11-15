import * as THREE from 'three';

export function createLandingScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, .08, 100);
  const sculpture = new THREE.Group();
  scene.add(sculpture);
  const geometry = new THREE.TorusKnotGeometry(1.76, .46, 210, 18, 2, 3);
  const surface = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, travel: { value: 0 } },
    vertexShader: `
      varying vec3 normalView, positionView, point;
      void main() {
        point = position;
        normalView = normalize(normalMatrix * normal);
        vec4 local = modelViewMatrix * vec4(position, 1.);
        positionView = local.xyz;
        gl_Position = projectionMatrix * local;
      }`,
    fragmentShader: `
      uniform float time, travel;
      varying vec3 normalView, positionView, point;
      void main() {
        vec3 n = normalize(normalView);
        vec3 view = normalize(-positionView);
        vec3 mirror = reflect(-view, n);
        float rim = pow(1. - max(0., dot(n, view)), 2.0);
        float sheet = pow(max(0., dot(mirror, normalize(vec3(-.65,.65,.55)))), 12.);
        float blue = pow(max(0., dot(mirror, normalize(vec3(.85,-.25,.48)))), 4.);
        float gold = pow(max(0., dot(mirror, normalize(vec3(.2,-.85,.45)))), 22.);
        float stripes = pow(.5 + .5 * sin(20. * point.y + 8. * point.x - time * 1.4), 12.);
        vec3 color = vec3(.025,.045,.13) + rim * vec3(.14,.36,.9);
        color += sheet * vec3(.72,.88,1.) + blue * vec3(.12,.37,.95);
        color += gold * vec3(.95,.48,.17) + stripes * (.1 + travel * .42) * vec3(.22,.63,1.);
        gl_FragColor = vec4(color, 1.);
      }`,
  });
  sculpture.add(new THREE.Mesh(geometry, surface));

  const rings = new THREE.Group();
  sculpture.add(rings);
  const ringGeometry = new THREE.TorusGeometry(3.45, .011, 5, 180);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x70a4ff, transparent: true, opacity: .42 });
  for (let index = 0; index < 3; index++) {
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.set(.45 + index * .47, .2 + index * .82, .3);
    rings.add(ring);
  }

  const debris = new THREE.Group();
  scene.add(debris);
  const shardGeometry = new THREE.OctahedronGeometry(1);
  const shardMaterials = [0x4d8dff, 0xaed5ff, 0x192454, 0xffbc79].map(color =>
    new THREE.MeshStandardMaterial({ color, metalness: .72, roughness: .27, flatShading: true }));
  const debrisPositions = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < 86; index++) {
    const angle = index * goldenAngle;
    const radius = 3.3 + (index % 11) * .43;
    const shard = new THREE.Mesh(shardGeometry, shardMaterials[index % shardMaterials.length]);
    const size = .034 + (index % 7) * .026;
    shard.scale.set(size * (1 + index % 3), size, size * .72);
    shard.rotation.set(angle, angle / 2, index);
    debris.add(shard);
    debrisPositions.push({ angle, radius, z: Math.sin(index * 12.47) * 5 });
  }
  scene.add(new THREE.HemisphereLight(0xabcfff, 0x272447, 2));
  const key = new THREE.PointLight(0x5599ff, 130, 23);
  key.position.set(2, 4, 5);
  scene.add(key);

  const starlight = new Float32Array(1500 * 3);
  for (let index = 0; index < 1500; index++) {
    starlight[index * 3] = Math.sin(index * 93.21) * 23;
    starlight[index * 3 + 1] = Math.cos(index * 52.41) * 15;
    starlight[index * 3 + 2] = -Math.abs(Math.sin(index * 1.426)) * 40 + 2;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starlight, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0x9abfff, size: .047, transparent: true, opacity: .62 });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  let compact = false;
  let time = 0;

  return {
    resize(width, height) {
      compact = width < 740;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },
    render(progress, dt, pointerX, pointerY) {
      time += dt;
      const approach = progress * progress * (3 - 2 * progress);
      sculpture.position.set(compact ? 0 : 2.75 * (1 - approach * .8), compact ? -1.65 : .04, 0);
      sculpture.scale.setScalar(compact ? .63 : 1);
      sculpture.rotation.set(.22 + time * .14 + pointerY * .2, -.32 + time * .23 + pointerX * .4, -.36 + approach * 1.35);
      rings.rotation.y = time * -.24;
      surface.uniforms.time.value = time;
      surface.uniforms.travel.value = approach;
      debris.children.forEach((shard, index) => {
        const { angle, radius, z } = debrisPositions[index];
        const orbit = angle + time * (.14 - index % 4 * .017) + approach * .5;
        const expansion = radius * (1 + approach * .65);
        shard.position.set(sculpture.position.x + Math.cos(orbit) * expansion, sculpture.position.y + Math.sin(orbit) * expansion * .8, z + approach * (5 + index % 8));
        shard.rotation.x += dt * .32;
        shard.rotation.y += dt * .28;
      });
      stars.rotation.z = time * .013 + approach * .19;
      camera.position.set(pointerX * .7 + approach * sculpture.position.x, pointerY * -.47 + approach * sculpture.position.y, (compact ? 12.4 : 11.4) - approach * 10.6);
      camera.lookAt(camera.position.x * .78, camera.position.y * .84, -7);
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      surface.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      shardGeometry.dispose();
      shardMaterials.forEach(material => material.dispose());
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
