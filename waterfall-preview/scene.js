import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { skyVertex, skyFragment, ribbonVertex, ribbonFragment, dustVertex, dustFragment } from './shaders.js';

const canvas = document.querySelector('#waterfall-canvas');
const status = document.querySelector('#render-status');
const motionButton = document.querySelector('#motion-toggle');
const viewer = document.querySelector('#archive-viewer');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const imageLoader = new THREE.ImageLoader();
const faces = new Map();
const width = 1.55;
const height = 1.96;
const depth = .094;

function randomFrom(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function roundedPaper() {
  const shape = new THREE.Shape();
  const x = width / 2;
  const y = height / 2;
  const radius = .039;
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + radius);
  shape.lineTo(x, y - radius);
  shape.quadraticCurveTo(x, y, x - radius, y);
  shape.lineTo(-x + radius, y);
  shape.quadraticCurveTo(-x, y, -x, y - radius);
  shape.lineTo(-x, -y + radius);
  shape.quadraticCurveTo(-x, -y, -x + radius, -y);
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments: 4,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: .02,
    bevelThickness: .016
  });
}

function paintPlate(context, tools, item) {
  const { w, h } = tools;
  const random = randomFrom(item.index + 91);
  const colors = [
    ['#1c152f', '#a877ad', '#f6cdc4'],
    ['#211830', '#6b74b3', '#f3c7df'],
    ['#371e39', '#b97092', '#f8ddb3'],
    ['#22233f', '#8474ad', '#a7d4dd'],
    ['#291632', '#9c77b8', '#ffe4bd']
  ];
  const [ink, middle, light] = colors[item.index % colors.length];
  const background = context.createLinearGradient(0, h, w, 0);
  background.addColorStop(0, ink);
  background.addColorStop(.57, middle);
  background.addColorStop(1, ink);
  context.fillStyle = background;
  context.fillRect(0, 0, w, h);
  context.globalCompositeOperation = 'screen';
  for (let i = 0; i < 24; i++) {
    const x = w * (.07 + random() * .85);
    const y = h * (.18 + random() * .66);
    const radius = w * (.11 + random() * .35);
    const fog = context.createRadialGradient(x, y, 0, x, y, radius);
    fog.addColorStop(0, i % 2 ? middle + '68' : light + '38');
    fog.addColorStop(1, middle + '00');
    context.fillStyle = fog;
    context.fillRect(0, 0, w, h);
  }
  context.save();
  context.translate(w * .54, h * .49);
  context.rotate((item.index % 5 - 2) * .13 - .4);
  for (let i = 0; i < 6; i++) {
    context.lineWidth = i % 3 === 0 ? .85 : .35;
    context.strokeStyle = light + (i % 3 === 0 ? 'b0' : '64');
    context.beginPath();
    context.ellipse(0, 0, w * (.22 + i * .035), h * (.10 + i * .024), -.15, .18, Math.PI * 1.96);
    context.stroke();
  }
  context.restore();
  for (let i = 0; i < 90; i++) {
    context.fillStyle = light + (i % 6 === 0 ? 'ef' : '75');
    const size = i % 9 === 0 ? 1.7 : .7;
    context.fillRect(random() * w, random() * h, size, size);
  }
  const cx = w * .55;
  const cy = h * .47;
  context.fillStyle = '#fff2d3';
  context.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const r = i % 2 ? 2 : 11;
    context.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  context.fill();
  context.globalCompositeOperation = 'source-over';
}

function drawPhoto(context, image, x, y, w, h) {
  const scale = Math.max(w / image.width, h / image.height);
  const sourceWidth = w / scale;
  const sourceHeight = h / scale;
  context.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, w, h);
}

function faceFor(item, invalidate) {
  if (faces.has(item.id)) return faces.get(item.id);
  const plate = document.createElement('canvas');
  plate.width = 384;
  plate.height = 480;
  const context = plate.getContext('2d');
  const texture = new THREE.CanvasTexture(plate);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const w = 348;
  const h = 366;
  const draw = image => {
    const paper = context.createLinearGradient(0, 0, 384, 480);
    paper.addColorStop(0, '#fff3d9');
    paper.addColorStop(1, '#dcbb9d');
    context.fillStyle = paper;
    context.fillRect(0, 0, 384, 480);
    context.fillStyle = '#966f64';
    context.fillRect(17, 17, w + 2, h + 2);
    context.save();
    context.translate(18, 18);
    if (image) drawPhoto(context, image, 0, 0, w, h);
    else paintPlate(context, { w, h }, item);
    context.restore();
    context.textAlign = 'center';
    context.fillStyle = '#69485f';
    context.font = 'italic 24px Georgia';
    context.fillText(item.label || 'The Forever Club', 192, 421, 346);
    context.font = '12px system-ui';
    context.fillText(image ? 'T H E   F O R E V E R   C L U B' : 'A B S T R A C T   A R C H I V E   P L A T E', 192, 449);
    texture.needsUpdate = true;
  };
  draw(null);
  const photo = !item.isPlaceholder && (item.thumb || item.src);
  if (photo) imageLoader.load(photo, image => {
    draw(image);
    invalidate();
  }, undefined, () => {
    document.querySelector('#archive-note').hidden = false;
  });
  faces.set(item.id, texture);
  return texture;
}

function descentCurve(lane) {
  const points = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const weave = Math.sin(t * Math.PI * 2 + lane.phase) * lane.sway;
    const z = lane.z + Math.sin(t * Math.PI * 2.7 + lane.phase) * lane.depth;
    points.push(new THREE.Vector3(lane.x + weave + (t - .5) * .92, 10.7 - t * 21.4, z));
  }
  return new THREE.CatmullRomCurve3(points);
}

function makeRibbon(curve, width, phase, glow) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const length = 144;
  const across = new THREE.Vector3();
  const towardsCamera = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i <= length; i++) {
    const t = i / length;
    const center = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    across.crossVectors(tangent, towardsCamera).normalize().applyAxisAngle(tangent, Math.sin(t * 13 + phase) * .85);
    const half = width * (.42 + .58 * Math.sin(t * Math.PI)) * (.8 + .2 * Math.cos(t * 16 + phase));
    for (const side of [-1, 1]) {
      const point = center.clone().addScaledVector(across, side * half);
      positions.push(point.x, point.y, point.z);
      uvs.push((side + 1) / 2, t);
    }
    const a = i * 2;
    if (i < length) indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, phase: { value: phase }, glow: { value: glow } },
    vertexShader: ribbonVertex,
    fragmentShader: ribbonFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  return new THREE.Mesh(geometry, material);
}

function makeDust() {
  const random = randomFrom(1428);
  const particles = 1050;
  const positions = new Float32Array(particles * 3);
  const seeds = new Float32Array(particles);
  for (let i = 0; i < particles; i++) {
    positions.set([(random() - .5) * 25, (random() - .5) * 24, random() * 21 - 13], i * 3);
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, pixelRatio: { value: 1 } },
    vertexShader: dustVertex,
    fragmentShader: dustFragment,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  return new THREE.Points(geometry, material);
}

function boot(renderer, items) {
  const scene = new THREE.Scene();
  const cascade = new THREE.Group();
  scene.add(cascade);
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.11;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .65, .67, .80);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.addPass(new FXAAPass());

  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { offset: { value: new THREE.Vector2() }, aspect: { value: 1 }, time: { value: 0 } },
    vertexShader: skyVertex, fragmentShader: skyFragment, depthTest: false, depthWrite: false
  }));
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  scene.add(sky);
  scene.add(new THREE.HemisphereLight('#ffefe2', '#7453a3', 1.65));
  const key = new THREE.DirectionalLight('#fff3dc', 2.35);
  key.position.set(-5, 8, 10);
  scene.add(key);
  const rim = new THREE.PointLight('#cd91ff', 59, 25);
  rim.position.set(3, -1, -2);
  scene.add(rim);
  const champagne = new THREE.PointLight('#ffba78', 34, 18);
  champagne.position.set(-3, -3, 4);
  scene.add(champagne);

  const lanes = [
    { x: -.46, z: 1.1, phase: .94, sway: 1.35, depth: 1.6, scale: .98, count: 4, offset: .04, speed: .032 },
    { x: .52, z: -1.4, phase: 3.35, sway: 1.74, depth: 2.0, scale: .79, count: 4, offset: .12, speed: .027 },
    { x: -1.7, z: -5.0, phase: 4.1, sway: 1.82, depth: 1.65, scale: .76, count: 5, offset: .075, speed: .024 },
    { x: 2.12, z: 3.15, phase: 1.5, sway: 1.77, depth: 1.4, scale: 1.18, count: 3, offset: .015, speed: .034 },
    { x: -2.42, z: 2.0, phase: 3.6, sway: 1.5, depth: 2.2, scale: 1.12, count: 3, offset: .17, speed: .031 }
  ];
  const ribbons = [
    { x: .23, z: 1.65, phase: 1.72, sway: 2.12, depth: 1.6, width: .35, glow: 1.05 },
    { x: -.68, z: -.8, phase: 2.27, sway: 2.02, depth: 1.8, width: .22, glow: .99 },
    { x: .84, z: -3.4, phase: 4, sway: 2.36, depth: 1.65, width: .28, glow: .8 },
    { x: -1.28, z: 3.1, phase: 5.18, sway: 2.25, depth: .98, width: .15, glow: .75 },
    { x: .52, z: -1.95, phase: 1.45, sway: 2.66, depth: 1.16, width: .07, glow: .9 }
  ].map(({ width: band, phase, glow, ...lane }) => {
    const ribbon = makeRibbon(descentCurve({ ...lane, phase }), band, phase, glow);
    cascade.add(ribbon);
    return ribbon;
  });
  const dust = makeDust();
  cascade.add(dust);

  const paper = roundedPaper();
  const faceGeometry = new THREE.PlaneGeometry(width, height);
  const paperBack = new THREE.MeshStandardMaterial({ color: '#ddbaa5', roughness: .76 });
  const paperEdge = new THREE.MeshStandardMaterial({ color: '#ab7c73', roughness: .46, metalness: .2 });
  let next = 0;
  const cards = lanes.flatMap(lane => {
    const curve = descentCurve(lane);
    return Array.from({ length: lane.count }, (_, i) => {
      const group = new THREE.Group();
      const base = new THREE.Mesh(paper, [paperBack, paperEdge]);
      const face = new THREE.Mesh(faceGeometry, new THREE.MeshStandardMaterial({
        color: '#ffffff', roughness: .62, emissive: '#86596f', emissiveIntensity: .12
      }));
      face.position.z = depth + .02;
      group.add(base, face);
      group.scale.setScalar(lane.scale);
      cascade.add(group);
      return { group, face, lane, curve, start: i / lane.count + lane.offset, cycle: 0 };
    });
  });
  const assign = card => {
    const item = items[next++ % items.length];
    card.face.material.map = faceFor(item, queueFrame);
    card.face.material.emissiveMap = card.face.material.map;
    card.face.userData.item = item;
    card.face.material.needsUpdate = true;
  };
  cards.forEach(assign);

  const pointer = new THREE.Vector2();
  const aim = new THREE.Vector2();
  const click = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const facesInScene = cards.map(card => card.face);
  const position = new THREE.Vector3();
  let drag;
  let elapsed = 0;
  let previous = 0;
  let frame = 0;
  let paused = reducedMotion.matches;
  let stopped = false;

  function queueFrame() {
    if (!stopped && !frame) frame = requestAnimationFrame(render);
  }
  const updateMotion = () => {
    motionButton.textContent = paused ? 'Resume flow' : 'Pause flow';
    queueFrame();
  };
  const resize = () => {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    // Bloom stays crisp without rendering four times as many pixels on high-DPI phones.
    const pixelRatio = Math.min(devicePixelRatio || 1, w < 600 ? 1.35 : 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    sky.material.uniforms.aspect.value = camera.aspect;
    dust.material.uniforms.pixelRatio.value = pixelRatio;
    cascade.scale.x = Math.min(1, Math.max(.72, camera.aspect * 1.76));
    queueFrame();
  };

  function render(timestamp) {
    frame = 0;
    if (stopped) return;
    const delta = Math.min(.05, (timestamp - (previous || timestamp)) / 1000);
    previous = timestamp;
    if (!paused && !viewer.open) elapsed += delta;
    pointer.lerp(aim, 1 - Math.exp(-delta * 5));
    const desktop = THREE.MathUtils.smoothstep(camera.aspect, .80, 1.38);
    const auto = paused ? 0 : Math.sin(elapsed * .28) * .27;
    const framing = -2.6 * desktop;
    camera.position.set(framing + pointer.x * .75 + auto, pointer.y * .42, 13.5);
    camera.lookAt(framing, pointer.y * .17, 0);
    sky.material.uniforms.offset.value.copy(pointer);
    sky.material.uniforms.time.value = elapsed;
    dust.material.uniforms.time.value = elapsed;
    for (const ribbon of ribbons) ribbon.material.uniforms.time.value = elapsed;
    for (const card of cards) {
      const { lane, start, group, curve } = card;
      const travel = start + elapsed * lane.speed;
      const cycle = Math.floor(travel);
      if (cycle !== card.cycle) {
        if (card.cycle !== 0 || elapsed > 0) assign(card);
        card.cycle = cycle;
      }
      const t = travel - cycle;
      curve.getPoint(t, position);
      group.position.copy(position);
      const sway = elapsed * .52 + start * 11 + lane.phase;
      const tilt = Math.sin(t * 7.6 + lane.phase);
      group.rotation.set(.16 * Math.cos(sway) + tilt * .16,
        .38 * Math.sin(sway * .72) + tilt * .23,
        .22 * Math.cos(t * 7.5 + lane.phase) + .14 * Math.sin(sway));
    }
    composer.render();
    if ((!paused && !viewer.open) || pointer.distanceToSquared(aim) > .00001) queueFrame();
    else previous = 0;
  }

  const track = event => {
    const box = canvas.getBoundingClientRect();
    aim.set((event.clientX - box.left) / box.width * 2 - 1, 1 - (event.clientY - box.top) / box.height * 2);
    queueFrame();
  };
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || stopped) return;
    track(event);
    drag = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (event.isPrimary && (drag || event.pointerType === 'mouse')) track(event);
  });
  canvas.addEventListener('pointerup', event => {
    if (!drag || !event.isPrimary) return;
    const distance = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
    drag = null;
    if (distance > 9 || viewer.open) return;
    track(event);
    click.copy(aim);
    raycaster.setFromCamera(click, camera);
    const hit = raycaster.intersectObjects(facesInScene, false)[0];
    if (!hit) return;
    const item = hit.object.userData.item;
    const image = document.querySelector('#archive-image');
    image.src = !item.isPlaceholder && item.src ? item.src : hit.object.material.map.image.toDataURL();
    image.alt = item.isPlaceholder ? 'Abstract artwork standing in for an unavailable photograph' : item.label;
    document.querySelector('#archive-caption').textContent = item.label;
    viewer.showModal();
  });
  function centerPointer() {
    drag = null;
    aim.set(0, 0);
    queueFrame();
  }
  canvas.addEventListener('pointercancel', centerPointer);
  canvas.addEventListener('pointerleave', () => { if (!drag) centerPointer(); });
  viewer.addEventListener('close', centerPointer);
  document.querySelector('#close-archive').onclick = () => viewer.close();
  motionButton.onclick = () => {
    paused = !paused;
    updateMotion();
  };
  reducedMotion.addEventListener('change', event => {
    paused = event.matches;
    centerPointer();
    updateMotion();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    stopped = true;
    cancelAnimationFrame(frame);
    motionButton.disabled = true;
    status.textContent = 'The WebGL context was lost. Reload to reopen the Waterfall.';
    status.hidden = false;
  });
  window.addEventListener('resize', resize);
  resize();
  updateMotion();
  motionButton.disabled = false;
  status.hidden = true;
  canvas.dataset.renderer = 'Three.js WebGL';
}

async function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (error) {
    console.error(error);
    status.textContent = 'WebGL 2 is unavailable in this browser. The Memory Waterfall needs hardware-accelerated graphics.';
    return;
  }
  try {
    const embeddedManifest = document.querySelector('#archive-manifest');
    let manifest;
    if (embeddedManifest) {
      manifest = JSON.parse(embeddedManifest.textContent);
    } else {
      const response = await fetch('./media.json');
      if (!response.ok) throw new Error(`Media manifest HTTP ${response.status}`);
      manifest = await response.json();
    }
    const { photos } = manifest;
    if (!photos?.length) throw new Error('No archive plates in the manifest');
    document.querySelector('#archive-note').hidden = !photos.some(item => item.isPlaceholder || !item.src);
    boot(renderer, photos);
  } catch (error) {
    console.error(error);
    status.textContent = 'The Memory Waterfall could not load. Open the preview from its HTTP server and reload.';
  }
}

start();
