import * as THREE from 'three';
import { ribbonVertex, ribbonFragment } from './shaders.js';

const canvas = document.querySelector('#waterfall-canvas');
const status = document.querySelector('#render-status');
const viewer = document.querySelector('#archive-viewer');
const media = document.querySelector('#archive-media');
const motion = document.querySelector('#motion-toggle');
const cinematic = document.querySelector('#cinematic');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const asset = (name) => './waterfall-preview/' + name;
const plate = (item) => asset('plate-' + ((item.index + (item.type === 'video' ? 4 : 0)) % 6 + 1) + '.webp');
const preview = (item) => (item.type === 'video' ? item.poster : item.thumb || item.src) || plate(item);
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;

function openMemory(item) {
  const video = item.type === 'video';
  const element = document.createElement(video ? 'video' : 'img');
  if (video) {
    element.controls = true;
    element.playsInline = true;
    element.poster = preview(item);
    element.src = item.src || asset('sample-reel.webm');
  } else {
    element.src = item.src || plate(item);
    element.alt = item.src ? item.label : 'Neutral placeholder photograph';
  }
  const caption = document.createElement('figcaption');
  caption.textContent = item.label + (item.src ? '' : video ? ' · Sample reel' : ' · Placeholder photograph');
  media.replaceChildren(element, caption);
  viewer.showModal();
  if (video) element.play().catch(() => {});
}

viewer.addEventListener('close', () => {
  const video = media.querySelector('video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
  media.replaceChildren();
});

function fallback(items, message) {
  status.textContent = message;
  status.hidden = false;
  document.querySelector('.controls').hidden = true;
  document.querySelector('#gesture').hidden = true;
  const list = document.querySelector('#fallback');
  list.replaceChildren(...items.map(item => {
    const button = document.createElement('button');
    button.textContent = item.label;
    button.onclick = () => openMemory(item);
    return button;
  }));
  list.hidden = false;
}

function paperTexture() {
  const image = document.createElement('canvas');
  image.width = image.height = 128;
  const context = image.getContext('2d');
  const pixels = context.createImageData(128, 128);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grain = Math.floor(Math.random() * 19);
    pixels.data.set([253 - grain, 242 - grain, 223 - grain, 255], i);
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowTexture() {
  const image = document.createElement('canvas');
  image.width = image.height = 64;
  const context = image.getContext('2d');
  const light = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  light.addColorStop(0, '#fff');
  light.addColorStop(.12, '#ffeed4');
  light.addColorStop(.32, '#ffc99365');
  light.addColorStop(1, '#ffc99300');
  context.fillStyle = light;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(image);
}

function drawRibbon(scene, curve, index) {
  const uniforms = [];
  for (const halo of [0, 1]) {
    const position = [], uv = [], faces = [];
    for (let i = 0; i <= 144; i++) {
      const t = i / 144;
      const p = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const across = new THREE.Vector3(0, 0, 1).cross(tangent).normalize();
      across.applyAxisAngle(tangent, Math.sin(t * 15 + index) * 1.05);
      const width = (.085 + .23 * Math.sin(Math.PI * t) ** 2) * (halo ? 3.8 : 1);
      for (const direction of [-1, 1]) {
        p.clone().addScaledVector(across, width * direction).toArray(position, position.length);
        uv.push((direction + 1) / 2, t);
      }
      const j = i * 2;
      if (i) faces.push(j - 2, j - 1, j, j, j - 1, j + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(faces);
    const values = { time: { value: 0 }, phase: { value: index * 2.5 }, halo: { value: halo } };
    uniforms.push(values);
    scene.add(new THREE.Mesh(geometry, new THREE.ShaderMaterial({
      vertexShader: ribbonVertex, fragmentShader: ribbonFragment, uniforms: values,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    })));
  }
  return uniforms;
}

function setup(renderer, photos, videos) {
  const items = photos.flatMap((photo, i) => i % 3 === 1 && videos.length
    ? [photo, videos[Math.floor(i / 3) % videos.length]]
    : [photo]);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#634b78', .028);
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 90);
  const loader = new THREE.TextureLoader();
  const cache = new Map();
  function texture(url) {
    if (!cache.has(url)) {
      const image = loader.load(url, undefined, undefined, () => {
        const placeholder = texture(asset('plate-1.webp'));
        if (placeholder !== image && placeholder.image) {
          image.image = placeholder.image;
          image.needsUpdate = true;
        }
      });
      image.colorSpace = THREE.SRGBColorSpace;
      image.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      cache.set(url, image);
    }
    return cache.get(url);
  }

  const skyMap = texture(asset('cloud-canyon.webp'));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
    map: skyMap, color: '#eee1f8', fog: false, depthWrite: false
  }));
  sky.position.z = -37;
  sky.renderOrder = -10;
  scene.add(sky);

  scene.add(new THREE.HemisphereLight('#ffefff', '#7e507b', 2.0));
  const sun = new THREE.DirectionalLight('#ffdfb1', 2.05);
  sun.position.set(-3, 8, 5);
  scene.add(sun);
  const movingLight = new THREE.PointLight('#e2b6ff', 28, 18, 2);
  scene.add(movingLight);

  const pulse = glowTexture();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: pulse, color: '#ffdbb9', opacity: .35, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false
  }));
  halo.position.set(.4, 5.4, -18);
  halo.scale.set(15, 15, 1);
  scene.add(halo);

  const streams = Array.from({ length: 5 }, (_, lane) => {
    const shift = (lane - 2) * 1.25;
    return new THREE.CatmullRomCurve3([
      [shift * .38, 10.2, -19 - lane * .5],
      [shift * .75 + Math.sin(lane) * 1.2, 5.8, -12 - lane * .7],
      [shift + Math.sin(lane + .5) * 1.45, 2.3, -7.4 - lane * .7],
      [shift * 1.06 - Math.cos(lane) * 1.16, -.3, -3.1 - lane * .78],
      [shift * 1.22 + Math.sin(lane + 1) * 1.12, -2.9, 1.3 - lane * .8],
      [shift * 1.5 - Math.sin(lane) * 1.1, -6.8, 6.4 - lane * .85]
    ].map(coords => new THREE.Vector3(...coords)));
  });
  const ribbons = streams.flatMap((curve, i) => {
    const points = curve.points.map((p, j) => p.clone().add(new THREE.Vector3(
      Math.cos(j * 1.45 + i) * .77, Math.sin(j * 2 + i) * .23, Math.sin(j + i) * .69
    )));
    return drawRibbon(scene, new THREE.CatmullRomCurve3(points), i);
  });

  const paper = new THREE.MeshStandardMaterial({ map: paperTexture(), roughness: .86 });
  const edge = new THREE.MeshStandardMaterial({ color: '#a69186', roughness: .98 });
  const recess = new THREE.MeshStandardMaterial({ color: '#312330', roughness: 1 });
  const frame = new THREE.BoxGeometry(1, 1, .063);
  const plane = new THREE.PlaneGeometry(1, 1);
  const cardCount = 34;
  const hits = [];
  const cards = Array.from({ length: cardCount }, (_, i) => {
    const card = new THREE.Group();
    const body = new THREE.Mesh(frame, [edge, edge, edge, edge, paper, paper]);
    const lip = new THREE.Mesh(plane, recess);
    lip.position.set(0, .057, .033);
    card.add(body, lip);
    const image = new THREE.Mesh(plane, new THREE.MeshStandardMaterial({ roughness: .83 }));
    image.position.set(0, .057, .034);
    card.add(image);
    const label = document.createElement('canvas');
    label.width = 128;
    label.height = 32;
    const ink = label.getContext('2d');
    ink.fillStyle = '#675064';
    ink.font = 'italic 18px Georgia';
    ink.textAlign = 'center';
    const labelTexture = new THREE.CanvasTexture(label);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    const mark = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({
      map: labelTexture, transparent: true, depthWrite: false
    }));
    mark.position.set(0, -.445, .035);
    mark.scale.set(.65, .16, 1);
    card.add(mark);
    function updateItem(item) {
      const aspect = clamp(Number(item.aspectRatio) || 1, .68, 1.42);
      const width = Math.sqrt(aspect) * .83;
      const height = .83 / Math.sqrt(aspect);
      body.scale.set(width + .16, height + .27, 1);
      lip.position.y = image.position.y = .058;
      lip.scale.set(width + .018, height + .018, 1);
      image.scale.set(width, height, 1);
      image.material.map = texture(preview(item));
      image.material.needsUpdate = true;
      mark.position.y = -height * .5 - .04;
      ink.clearRect(0, 0, 128, 32);
      ink.fillText(item.type === 'video' ? 'Play reel' : String(item.index + 1).padStart(2, '0'), 64, 21);
      labelTexture.needsUpdate = true;
      body.userData.item = item;
    }
    updateItem(items[i % items.length]);
    scene.add(card);
    hits.push(body);
    return { card, updateItem, itemIndex: i % items.length, previous: 0 };
  });

  const dustCount = 1150;
  const seeds = new Float32Array(dustCount * 4);
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    for (let j = 0; j < 4; j++) seeds[i * 4 + j] = Math.random();
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
    map: pulse, color: '#ffe0b2', size: .071, transparent: true, opacity: .83,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false
  }));
  dust.frustumCulled = false;
  scene.add(dust);

  let paused = reduced.matches;
  let automatic = false;
  let time = 0;
  let last;
  let loop;
  let drag;
  let frameAverage = 16.7;
  let resolution = 1;
  const aim = new THREE.Vector2();
  const offset = new THREE.Vector2();
  const target = new THREE.Vector3();
  const sample = new THREE.Vector3();
  const ray = new THREE.Raycaster();

  function resize() {
    camera.aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    camera.updateProjectionMatrix();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7, Math.sqrt(1100000 / (width * height))) * resolution);
    renderer.setSize(width, height, false);
    const skyHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 52 * 1.10;
    const skyWidth = Math.max(skyHeight * .68, skyHeight * camera.aspect);
    sky.scale.set(skyWidth, Math.max(skyHeight, skyWidth / .68), 1);
  }

  function controls() {
    motion.textContent = paused ? 'Resume flow' : 'Pause flow';
    cinematic.setAttribute('aria-pressed', String(automatic));
  }

  function render(now) {
    loop = requestAnimationFrame(render);
    const elapsed = now - (last ?? now);
    last = now;
    const delta = Math.min(elapsed / 1000, .055);
    if (!paused && !viewer.open && !document.hidden) {
      time += delta;
      frameAverage = mix(frameAverage, elapsed, .025);
      if (time > 2 && frameAverage > 29 && resolution > .76) {
        resolution -= .12;
        frameAverage = 19;
        resize();
      }
    }
    if (automatic && !paused && !viewer.open) {
      aim.set(Math.sin(time * .33) * 1.27, Math.cos(time * .23) * .53);
    }
    offset.lerp(aim, reduced.matches ? 1 : 1 - Math.exp(-delta * 6));
    const portrait = camera.aspect < .8;
    camera.position.set(offset.x * .55, .1 + offset.y * .4, portrait ? 12.9 : 12.1);
    target.set(-offset.x * .46, .13 - offset.y * .51, -5);
    camera.lookAt(target);
    sky.position.x = offset.x * .31;
    sky.position.y = offset.y * .22;
    movingLight.position.set(Math.sin(time * .64) * 3, 2.2, 4);
    ribbons.forEach(values => { values.time.value = time; });
    cards.forEach(({ card, updateItem }, i) => {
      const state = cards[i];
      const lane = i % streams.length;
      const t = (time * (.039 + lane * .0019) + i * .129 + lane * .048 + Math.sin(i * 2.54) * .026 + 1) % 1;
      if (t < state.previous) {
        state.itemIndex = (state.itemIndex + cardCount) % items.length;
        updateItem(items[state.itemIndex]);
      }
      state.previous = t;
      streams[lane].getPoint(t, card.position);
      card.position.x += Math.sin(i * 2.3 + t * 8.3) * .36;
      card.rotation.set(Math.sin(i * 1.3 + t * 8) * .24, Math.sin(i * 2.1 + t * 7) * .44,
        Math.sin(i * 2.8 + t * 9) * .45);
      const appear = Math.min(1, t * 24, (1 - t) * 28);
      card.scale.setScalar((.72 + (i % 6) * .095) * appear);
    });
    for (let i = 0; i < dustCount; i++) {
      const seed = i * 4;
      const a = seeds[seed], b = seeds[seed + 1], c = seeds[seed + 2], d = seeds[seed + 3];
      if (i < 540) {
        const t = (a + time * (.035 + b * .045)) % 1;
        streams[i % streams.length].getPoint(t, sample);
        sample.x += (c - .5) * (1 + d * 2.8);
        sample.y += (d - .5) * 1.75;
        sample.z += (b - .5) * 2.2;
      } else {
        sample.set((a - .5) * 24, (b + time * -.009 + 1e4) % 1 * 23 - 11, -25 + c * 33);
      }
      sample.toArray(positions, i * 3);
    }
    dustGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }

  motion.onclick = () => { paused = !paused; controls(); };
  cinematic.onclick = () => {
    automatic = !automatic;
    if (automatic && !reduced.matches) paused = false;
    if (!automatic) aim.set(0, 0);
    controls();
  };
  reduced.addEventListener('change', () => {
    paused = reduced.matches;
    automatic = false;
    controls();
  });

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    drag = { x: event.clientX, y: event.clientY, start: aim.clone(), moved: false };
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || !event.isPrimary) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    if (Math.hypot(x, y) < 7 && !drag.moved) return;
    drag.moved = true;
    automatic = false;
    controls();
    aim.set(clamp(drag.start.x + x * .013, -2, 2), clamp(drag.start.y - y * .011, -1.45, 1.45));
  });
  canvas.addEventListener('pointerup', event => {
    if (!drag || !event.isPrimary) return;
    if (!drag.moved) {
      ray.setFromCamera(new THREE.Vector2(event.clientX / canvas.clientWidth * 2 - 1,
        1 - event.clientY / canvas.clientHeight * 2), camera);
      const hit = ray.intersectObjects(hits, false)[0];
      if (hit) openMemory(hit.object.userData.item);
    }
    drag = undefined;
  });
  canvas.addEventListener('lostpointercapture', () => { drag = undefined; });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    cancelAnimationFrame(loop);
    fallback([...photos.slice(0, 4), ...videos.slice(0, 2)], 'Graphics disconnected. Reload to restore the waterfall, or open a memory below.');
  });
  addEventListener('resize', resize);
  resize();
  controls();
  document.querySelector('.controls').hidden = false;
  status.hidden = true;
  canvas.dataset.renderer = 'Three.js WebGL';
  loop = requestAnimationFrame(render);
}

async function start() {
  let manifest;
  try {
    const response = await fetch('./media.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    manifest = await response.json();
    if (!manifest.photos?.length) throw new Error('Empty photo manifest');
  } catch (error) {
    fallback([], 'The memory archive could not load. Open this page through an HTTP server.');
    console.error(error);
    return;
  }
  const videos = manifest.videos ?? [];
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    fallback([...manifest.photos.slice(0, 4), ...videos.slice(0, 2)], 'WebGL 2 is unavailable. Open a memory below.');
    return;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  setup(renderer, manifest.photos, videos);
}

start();
