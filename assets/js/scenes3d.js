/* The Forever Club — 3D Visual Systems:
   1) Celestial Starfield Background
   2) Scene 04 Memory Orbit (3D Z-depth Polaroids + Front/Back Champagne-Gold Splines + Touch Parallax)
   3) The Memory Crystal (Interactive 3D Faceted Amethyst Polyhedron)
   4) Final Constellation (Interactive 4-Star Connection Canvas)
*/
import { resolveThumbSrc } from './placeholders.js';

export function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduced-motion');
}

export function isLowPowerDevice() {
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  return mem <= 2 || cores <= 2;
}

/* ---------------- 1. CELESTIAL AMBIENT STARFIELD ---------------- */
export class CelestialStarfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.rafId = 0;
    this.running = false;
    this.resizeHandler = () => this.resize();
    this.visHandler = () => {
      if (document.hidden) this.pause();
      else this.start();
    };
    window.addEventListener('resize', this.resizeHandler, { passive: true });
    document.addEventListener('visibilitychange', this.visHandler);
    this.resize();
    this.initStars();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  initStars() {
    const count = isLowPowerDevice() ? 45 : (this.w < 640 ? 68 : 110);
    this.stars = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      r: i % 8 === 0 ? 1.9 : (i % 3 === 0 ? 1.2 : 0.75),
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
      gold: i % 7 === 0
    }));
  }

  renderFrame(t) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const sec = t * 0.001;
    for (const s of this.stars) {
      const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(sec * s.speed + s.phase));
      ctx.fillStyle = s.gold
        ? `rgba(174, 132, 76, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  start() {
    if (this.running) return;
    if (isReducedMotion()) {
      this.renderFrame(0);
      return;
    }
    this.running = true;
    const loop = (t) => {
      if (!this.running) return;
      this.renderFrame(t);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  pause() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }
}

/* ---------------- 2. SCENE 04 MEMORY ORBIT (3D Z-INTERLEAVED POLAROIDS + SPLINES) ---------------- */
export function mountMemoryOrbit(container, photos, { onSelectPhoto, onHiddenOrbitEgg }) {
  container.replaceChildren();

  const stage = document.createElement('div');
  stage.className = 'orbit-stage';

  const backCanvas = document.createElement('canvas');
  backCanvas.className = 'orbit-spline-layer orbit-spline-back';

  const cardsLayer = document.createElement('div');
  cardsLayer.className = 'orbit-cards-layer';

  const frontCanvas = document.createElement('canvas');
  frontCanvas.className = 'orbit-spline-layer orbit-spline-front';

  const hiddenStarBtn = document.createElement('button');
  hiddenStarBtn.type = 'button';
  hiddenStarBtn.className = 'orbit-hidden-node';
  hiddenStarBtn.setAttribute('aria-label', 'Hidden golden orbital resonance node');
  hiddenStarBtn.title = 'Celestial resonance node';
  hiddenStarBtn.innerHTML = '<span class="orbit-node-dot"></span>';
  hiddenStarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onHiddenOrbitEgg) onHiddenOrbitEgg();
  });

  stage.append(backCanvas, cardsLayer, frontCanvas, hiddenStarBtn);
  container.appendChild(stage);

  // Pick 9 curated archive plates placed across true Z depths (foreground, midground, background)
  const sampleIndices = [0, 3, 7, 10, 18, 20, 24, 32, 34];
  const nodes = sampleIndices.map((pIdx, i) => {
    const item = photos[pIdx] || photos[i % photos.length];
    // Spread across elliptical 3D cosmos
    const angle = (i / sampleIndices.length) * Math.PI * 2 + 0.3;
    const rx = 0.36;
    const ry = 0.32;
    const zDepth = (i % 3 === 0) ? 140 : (i % 3 === 1 ? 0 : -130); // Foreground / Mid / Background
    return {
      item,
      nx: 0.5 + Math.cos(angle) * rx,
      ny: 0.5 + Math.sin(angle) * ry,
      z: zDepth,
      rot: ((i % 2 === 0 ? -1 : 1) * (4 + (i % 4) * 2.5)),
      parallaxFactor: zDepth > 0 ? 1.35 : (zDepth < 0 ? 0.55 : 0.95)
    };
  });

  const cardEls = nodes.map((n, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'orbit-polaroid';
    btn.style.zIndex = String(n.z > 0 ? 30 + idx : (n.z < 0 ? 10 + idx : 20 + idx));
    btn.innerHTML = `
      <span class="polaroid-frame">
        <img loading="lazy" src="${resolveThumbSrc(n.item)}" alt="${n.item.label}">
        <span class="polaroid-caption">${n.item.label}</span>
      </span>
    `;
    btn.addEventListener('click', () => onSelectPhoto(n.item));
    cardsLayer.appendChild(btn);
    return btn;
  });

  let yaw = 0;
  let pitch = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let moved = false;
  let rafId = 0;
  let destroyed = false;

  function onPointerDown(e) {
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
  }

  function onPointerMove(e) {
    const rect = stage.getBoundingClientRect();
    if (dragging) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      targetYaw = Math.max(-1, Math.min(1, targetYaw + dx * 0.004));
      targetPitch = Math.max(-0.7, Math.min(0.7, targetPitch + dy * 0.004));
      startX = e.clientX;
      startY = e.clientY;
    } else if (e.pointerType === 'mouse') {
      const rx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ry = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetYaw = rx * 0.55;
      targetPitch = ry * 0.35;
    }
  }

  function onPointerUp() {
    dragging = false;
  }

  stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });

  // Prevent accidental click after drag
  cardsLayer.addEventListener('click', (e) => {
    if (moved) {
      e.stopPropagation();
      e.preventDefault();
      moved = false;
    }
  }, true);

  function drawSplines(ctx, w, h, sec, frontPass) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2 + yaw * 24;
    const cy = h / 2 + pitch * 18;
    const rx = Math.min(w * 0.44, 420);
    const ry = Math.min(h * 0.39, 250);

    const ribbons = [
      { tilt: -0.28 + pitch * 0.14, phase: 0, speed: 0.25, radiusScale: 1.0 },
      { tilt: 0.42 - pitch * 0.12, phase: 2.1, speed: -0.19, radiusScale: 0.84 }
    ];

    ribbons.forEach((rib, rIdx) => {
      const steps = 84;
      for (let i = 0; i < steps; i++) {
        const a0 = (i / steps) * Math.PI * 2;
        const a1 = ((i + 1) / steps) * Math.PI * 2;
        const mid = (a0 + a1) * 0.5;
        // Sin(mid) > 0 means front arc; < 0 means back arc behind mid-plane Polaroids
        const isFrontArc = Math.sin(mid + yaw * 0.6) > 0;
        if (isFrontArc !== frontPass) continue;

        const cosT = Math.cos(rib.tilt);
        const sinT = Math.sin(rib.tilt);

        const lx0 = Math.cos(a0) * rx * rib.radiusScale;
        const ly0 = Math.sin(a0) * ry * rib.radiusScale * 0.58;
        const lx1 = Math.cos(a1) * rx * rib.radiusScale;
        const ly1 = Math.sin(a1) * ry * rib.radiusScale * 0.58;

        const x0 = cx + lx0 * cosT - ly0 * sinT;
        const y0 = cy + lx0 * sinT + ly0 * cosT;
        const x1 = cx + lx1 * cosT - ly1 * sinT;
        const y1 = cy + lx1 * sinT + ly1 * cosT;

        ctx.strokeStyle = frontPass
          ? `rgba(220, 196, 154, ${0.42 + 0.28 * Math.sin(mid)})`
          : `rgba(203, 181, 217, ${0.18 + 0.12 * Math.abs(Math.sin(mid))})`;
        ctx.lineWidth = frontPass ? 2.1 : 1.15;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      // Moving luminous beads along the spline
      const beadCount = 3;
      for (let b = 0; b < beadCount; b++) {
        const a = ((sec * rib.speed + b * (Math.PI * 2 / beadCount) + rib.phase) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const isFrontBead = Math.sin(a + yaw * 0.6) > 0;
        if (isFrontBead !== frontPass) continue;

        const cosT = Math.cos(rib.tilt);
        const sinT = Math.sin(rib.tilt);
        const lx = Math.cos(a) * rx * rib.radiusScale;
        const ly = Math.sin(a) * ry * rib.radiusScale * 0.58;
        const bx = cx + lx * cosT - ly * sinT;
        const by = cy + lx * sinT + ly * cosT;

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, 12 + rIdx * 2);
        grad.addColorStop(0, 'rgba(245, 239, 230, 0.95)');
        grad.addColorStop(0.45, 'rgba(220, 196, 154, 0.72)');
        grad.addColorStop(1, 'rgba(220, 196, 154, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    [backCanvas, frontCanvas].forEach((c) => {
      c.width = Math.max(1, Math.round(rect.width * dpr));
      c.height = Math.max(1, Math.round(rect.height * dpr));
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    return rect;
  }

  let rect = resize();
  const onResize = () => { rect = resize(); };
  window.addEventListener('resize', onResize, { passive: true });

  function frame(ts) {
    if (destroyed) return;
    const reduced = isReducedMotion();
    yaw += (targetYaw - yaw) * 0.08;
    pitch += (targetPitch - pitch) * 0.08;
    const sec = reduced ? 0 : ts * 0.001;

    // Position Polaroids with 3D perspective & depth scale
    nodes.forEach((n, idx) => {
      const floatY = reduced ? 0 : Math.sin(sec * 0.8 + idx * 0.9) * 5;
      const px = n.nx * rect.width - yaw * 38 * n.parallaxFactor;
      const py = n.ny * rect.height - pitch * 26 * n.parallaxFactor + floatY;
      const scale = n.z > 0 ? 1.07 : (n.z < 0 ? 0.84 : 0.96);
      const blur = n.z < 0 ? '0.4px' : '0px';
      const el = cardEls[idx];
      el.style.transform = `translate3d(${px}px, ${py}px, ${n.z}px) translate(-50%, -50%) rotate(${n.rot + yaw * 4}deg) scale(${scale})`;
      el.style.filter = `blur(${blur})`;
      el.style.opacity = n.z < 0 ? '0.84' : '1';
    });

    drawSplines(backCanvas.getContext('2d'), rect.width, rect.height, sec, false);
    drawSplines(frontCanvas.getContext('2d'), rect.width, rect.height, sec, true);

    if (!reduced && !document.hidden) {
      rafId = requestAnimationFrame(frame);
    }
  }

  rafId = requestAnimationFrame(frame);

  return {
    destroy() {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', onResize);
    }
  };
}

/* ---------------- 3. THE MEMORY CRYSTAL (3D FACETED AMETHYST POLYHEDRON) ---------------- */
export function mountMemoryCrystal(container, { onReleaseMemory }) {
  container.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'crystal-stage';

  const canvas = document.createElement('canvas');
  canvas.className = 'crystal-canvas';
  canvas.setAttribute('role', 'button');
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', 'Rotate or tap the amethyst memory crystal to release a memory');

  const hint = document.createElement('p');
  hint.className = 'muted crystal-hint';
  hint.textContent = 'Drag to rotate the facets · Tap crystal to release a memory';

  wrap.append(canvas, hint);
  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  let rotY = 0.4;
  let rotX = 0.25;
  let velY = 0.0055;
  let dragging = false;
  let moved = false;
  let sx = 0;
  let sy = 0;
  let destroyed = false;
  let rafId = 0;

  // Octahedral-bipyramid crystal vertices
  const verts = [
    [0, -1.45, 0],     // 0: top apex
    [0, 1.45, 0],      // 1: bottom apex
    [0.85, -0.35, 0],  // 2
    [0, -0.35, 0.85],  // 3
    [-0.85, -0.35, 0], // 4
    [0, -0.35, -0.85], // 5
    [0.72, 0.45, 0.42],// 6
    [-0.72, 0.45, 0.42],//7
    [-0.72, 0.45, -0.42],//8
    [0.72, 0.45, -0.42]// 9
  ];

  const faces = [
    [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 2],
    [2, 6, 3], [3, 6, 7], [3, 7, 4], [4, 7, 8], [4, 8, 5], [5, 8, 9], [5, 9, 2], [2, 9, 6],
    [1, 6, 7], [1, 7, 8], [1, 8, 9], [1, 9, 6]
  ];

  function resize() {
    const size = Math.min(container.clientWidth || 340, 380);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return size;
  }

  let size = resize();
  const onResize = () => { size = resize(); };
  window.addEventListener('resize', onResize, { passive: true });

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = false;
    sx = e.clientX;
    sy = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
    rotY += dx * 0.012;
    rotX = Math.max(-0.9, Math.min(0.9, rotX + dy * 0.01));
    velY = dx * 0.0025;
    sx = e.clientX;
    sy = e.clientY;
  });

  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('pointerup', () => {
    dragging = false;
    if (!moved && onReleaseMemory) onReleaseMemory();
  });

  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onReleaseMemory) onReleaseMemory();
    }
  });

  function project(v) {
    const cy = Math.cos(rotY);
    const sy = Math.sin(rotY);
    const cx = Math.cos(rotX);
    const sx = Math.sin(rotX);

    const x1 = v[0] * cy - v[2] * sy;
    const z1 = v[0] * sy + v[2] * cy;
    const y2 = v[1] * cx - z1 * sx;
    const z2 = v[1] * sx + z1 * cx;

    const fov = 4.2;
    const scale = (fov / (fov + z2)) * (size * 0.25);
    return [size / 2 + x1 * scale, size / 2 + y2 * scale, z2];
  }

  function render(ts) {
    if (destroyed) return;
    const reduced = isReducedMotion();
    if (!dragging && !reduced) {
      rotY += velY;
      velY = velY * 0.96 + 0.0055 * 0.04;
    }

    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;

    // Ambient amethyst aura
    const aura = ctx.createRadialGradient(cx, cy, 12, cx, cy, size * 0.46);
    aura.addColorStop(0, 'rgba(203, 181, 217, 0.34)');
    aura.addColorStop(0.55, 'rgba(129, 113, 143, 0.14)');
    aura.addColorStop(1, 'rgba(23, 18, 35, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
    ctx.fill();

    // Back golden orbital ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(220, 196, 154, 0.32)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.38, size * 0.13, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const projected = verts.map(project);
    const sortedFaces = faces.map((f) => {
      const p0 = projected[f[0]];
      const p1 = projected[f[1]];
      const p2 = projected[f[2]];
      const zAvg = (p0[2] + p1[2] + p2[2]) / 3;
      // Normal for specular lighting
      const ax = p1[0] - p0[0], ay = p1[1] - p0[1];
      const bx = p2[0] - p0[0], by = p2[1] - p0[1];
      const cross = ax * by - ay * bx;
      return { f, p0, p1, p2, zAvg, cross };
    }).sort((a, b) => a.zAvg - b.zAvg);

    // Draw crystal facets (back-to-front translucent refraction)
    sortedFaces.forEach(({ p0, p1, p2, cross }, idx) => {
      const facing = cross > 0;
      const spec = Math.max(0.15, Math.min(0.95, 0.45 + Math.sin(idx * 1.1 + rotY * 2) * 0.35));
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.closePath();

      if (facing) {
        ctx.fillStyle = `rgba(${Math.round(170 + spec * 45)}, ${Math.round(135 + spec * 48)}, ${Math.round(215 + spec * 25)}, ${0.28 + spec * 0.28})`;
      } else {
        ctx.fillStyle = `rgba(92, 68, 118, 0.22)`;
      }
      ctx.fill();
      ctx.strokeStyle = facing ? 'rgba(245, 239, 230, 0.48)' : 'rgba(203, 181, 217, 0.2)';
      ctx.lineWidth = facing ? 1.1 : 0.7;
      ctx.stroke();
    });

    // Floating internal memory core spark
    const pulse = reduced ? 1 : 0.85 + 0.2 * Math.sin(ts * 0.003);
    const core = ctx.createRadialGradient(cx, cy, 1, cx, cy, 24 * pulse);
    core.addColorStop(0, 'rgba(245, 239, 230, 0.92)');
    core.addColorStop(0.5, 'rgba(220, 196, 154, 0.55)');
    core.addColorStop(1, 'rgba(220, 196, 154, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 24 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Front golden orbital ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(220, 196, 154, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.38, size * 0.13, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    if (!reduced && !document.hidden) {
      rafId = requestAnimationFrame(render);
    }
  }

  rafId = requestAnimationFrame(render);

  return {
    destroy() {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    }
  };
}

/* ---------------- 4. FINAL CONSTELLATION INTERACTIVE CANVAS ---------------- */
export function mountConstellationCanvas(container, members, { onStarLit, onAllLit }) {
  container.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'constellation-stage';

  const canvas = document.createElement('canvas');
  canvas.className = 'constellation-canvas';
  wrap.appendChild(canvas);

  const buttonsLayer = document.createElement('div');
  buttonsLayer.className = 'constellation-buttons';
  wrap.appendChild(buttonsLayer);

  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  const lit = [false, false, false, false];
  let cameraZoom = 1.0;
  let targetZoom = 1.0;
  let rafId = 0;
  let destroyed = false;
  const reduced = isReducedMotion();

  const starBtns = members.map((m, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'constellation-star-btn';
    btn.style.left = `${m.starCoords.x}%`;
    btn.style.top = `${m.starCoords.y}%`;
    btn.innerHTML = `<span class="star-core-glyph"></span><span class="star-label">${m.name}</span>`;
    btn.addEventListener('click', () => {
      if (lit[idx]) return;
      lit[idx] = true;
      btn.classList.add('is-lit');
      if (onStarLit) onStarLit(idx, lit.filter(Boolean).length);
      if (lit.every(Boolean)) {
        targetZoom = 0.88; // Slow cinematic camera pull-back
        if (onAllLit) onAllLit();
      }
      if (reduced) render(performance.now());
    });
    buttonsLayer.appendChild(btn);
    return btn;
  });

  function resize() {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return rect;
  }

  let rect = resize();
  const onResize = () => {
    rect = resize();
    if (reduced) render(performance.now());
  };
  window.addEventListener('resize', onResize, { passive: true });

  function render(ts) {
    if (destroyed) return;
    const sec = ts * 0.001;
    if (!reduced) cameraZoom += (targetZoom - cameraZoom) * 0.03;
    buttonsLayer.style.transform = `scale(${cameraZoom})`;

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-w / 2, -h / 2);

    const pts = members.map((m) => ({
      x: (m.starCoords.x / 100) * w,
      y: (m.starCoords.y / 100) * h
    }));

    // Draw connecting golden lines between lit stars
    const pairs = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]];
    pairs.forEach(([a, b], pIdx) => {
      if (lit[a] && lit[b]) {
        const pa = pts[a];
        const pb = pts[b];
        const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
        grad.addColorStop(0, 'rgba(220, 196, 154, 0.92)');
        grad.addColorStop(0.5, 'rgba(245, 239, 230, 0.95)');
        grad.addColorStop(1, 'rgba(220, 196, 154, 0.92)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = pIdx === 4 ? 1.0 : 2.1;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();

        // Flowing gold particle along edge
        if (!isReducedMotion()) {
          const u = (sec * 0.35 + pIdx * 0.21) % 1;
          const px = pa.x + (pb.x - pa.x) * u;
          const py = pa.y + (pb.y - pa.y) * u;
          ctx.fillStyle = '#F5EFE6';
          ctx.beginPath();
          ctx.arc(px, py, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Gathering stardust halo when all 4 lit
    if (lit.every(Boolean)) {
      const aura = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.46);
      aura.addColorStop(0, 'rgba(220, 196, 154, 0.14)');
      aura.addColorStop(1, 'rgba(23, 18, 35, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();

    if (!isReducedMotion() && !document.hidden) {
      rafId = requestAnimationFrame(render);
    }
  }

  rafId = requestAnimationFrame(render);

  return {
    reset() {
      lit.fill(false);
      cameraZoom = 1.0;
      targetZoom = 1.0;
      starBtns.forEach((b) => b.classList.remove('is-lit'));
      if (reduced) render(performance.now());
    },
    destroy() {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    }
  };
}
