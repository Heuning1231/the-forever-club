/* The Forever Club — Architectural Grey/Celestial Placeholder Generator & On-Demand Video Player */

const svgCache = new Map();

/**
 * Generates an editorial architectural-grey & champagne-gold placeholder SVG data URI.
 * Never pretends to be real photography; preserves aspect ratio and archive index.
 */
export function getPlaceholderPhotoSrc(item) {
  const key = `${item.id}_${item.aspectRatio}`;
  if (svgCache.has(key)) return svgCache.get(key);

  const ratio = item.aspectRatio || 1;
  const w = 640;
  const h = Math.round(w / ratio);
  const plate = String((item.index ?? 0) + 1).padStart(3, '0');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3a3345"/>
      <stop offset="55%" stop-color="#2b2533"/>
      <stop offset="100%" stop-color="#1e1925"/>
    </linearGradient>
    <radialGradient id="sheen" cx="30%" cy="22%" r="70%">
      <stop offset="0%" stop-color="#cbb5d9" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#171223" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#sheen)"/>
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#dcc49a" stroke-opacity="0.28" stroke-width="1.2"/>
  <rect x="34" y="34" width="${w - 68}" height="${h - 68}" fill="none" stroke="#81718f" stroke-opacity="0.22" stroke-width="0.75"/>
  <g transform="translate(${w / 2}, ${h / 2 - 14})" fill="none" stroke="#dcc49a" stroke-opacity="0.55">
    <circle r="44" stroke-width="1"/>
    <circle r="60" stroke-width="0.6" stroke-dasharray="3 5"/>
    <path d="M0 -30 L6 -6 L30 0 L6 6 L0 30 L-6 6 L-30 0 L-6 -6 Z" fill="#dcc49a" fill-opacity="0.18" stroke-width="1"/>
  </g>
  <text x="${w / 2}" y="${h / 2 + 76}" text-anchor="middle" fill="#f5efe6" fill-opacity="0.82" font-family="Georgia, serif" font-size="22" letter-spacing="4">PLATE ${plate}</text>
  <text x="${w / 2}" y="${h / 2 + 102}" text-anchor="middle" fill="#dcc49a" fill-opacity="0.62" font-family="sans-serif" font-size="11" letter-spacing="3">ARCHIVAL PLACEHOLDER · THE FOREVER CLUB</text>
</svg>`.trim();

  const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  svgCache.set(key, uri);
  return uri;
}

export function resolvePhotoSrc(item) {
  if (!item) return '';
  if (!item.isPlaceholder && item.src) return item.src;
  return getPlaceholderPhotoSrc(item);
}

export function resolveThumbSrc(item) {
  if (!item) return '';
  if (!item.isPlaceholder && (item.thumb || item.src)) return item.thumb || item.src;
  return getPlaceholderPhotoSrc(item);
}

export function resolvePosterSrc(videoItem) {
  if (!videoItem) return '';
  if (!videoItem.isPlaceholder && videoItem.poster) return videoItem.poster;
  return getPlaceholderPhotoSrc({
    id: videoItem.id,
    index: videoItem.index,
    aspectRatio: videoItem.aspectRatio || 1.33
  });
}

/**
 * Renders either a real <video> element or a fully interactive placeholder film reel
 * (play/pause, scrub bar, time display, fullscreen) with zero network/console errors.
 */
export function mountMediaVideo(container, videoItem, { autoplay = false, onEnded = null } = {}) {
  container.replaceChildren();

  if (!videoItem.isPlaceholder && videoItem.src) {
    const vid = document.createElement('video');
    vid.className = 'cinema-video-el';
    vid.controls = true;
    vid.playsInline = true;
    vid.preload = 'metadata';
    if (videoItem.poster) vid.poster = videoItem.poster;
    vid.src = videoItem.src;
    if (onEnded) vid.addEventListener('ended', onEnded);
    container.appendChild(vid);
    if (autoplay) {
      vid.play().catch(() => {});
    }
    return {
      destroy() {
        try {
          vid.pause();
          vid.removeAttribute('src');
          vid.load();
        } catch (_) {}
      },
      pause() {
        try { vid.pause(); } catch (_) {}
      },
      play() {
        return vid.play();
      }
    };
  }

  // Interactive simulated archival reel for placeholder mode
  const wrap = document.createElement('div');
  wrap.className = 'sim-video-player';
  wrap.innerHTML = `
    <div class="sim-video-stage">
      <canvas class="sim-video-canvas" width="640" height="360"></canvas>
      <div class="sim-video-overlay">
        <span class="eyebrow">Archival Reel Placeholder</span>
        <strong>${videoItem.label || `Film ${String((videoItem.index ?? 0) + 1).padStart(2, '0')}`}</strong>
        <span class="muted">Real H.264 stream attaches automatically after media processing</span>
      </div>
    </div>
    <div class="sim-video-controls">
      <button type="button" class="btn-ghost sim-play-btn" aria-label="Play or pause reel">Play</button>
      <input type="range" class="sim-scrub" min="0" max="100" value="0" aria-label="Seek timeline">
      <span class="sim-time">00:00 / ${videoItem.duration || '00:15'}</span>
      <button type="button" class="btn-ghost sim-fs-btn" aria-label="Fullscreen">Fullscreen</button>
    </div>
  `;
  container.appendChild(wrap);

  const canvas = wrap.querySelector('.sim-video-canvas');
  const ctx = canvas.getContext('2d');
  const playBtn = wrap.querySelector('.sim-play-btn');
  const scrub = wrap.querySelector('.sim-scrub');
  const timeEl = wrap.querySelector('.sim-time');
  const fsBtn = wrap.querySelector('.sim-fs-btn');

  let playing = Boolean(autoplay);
  let progress = 0; // 0..100
  let rafId = 0;
  let lastTs = 0;
  const totalSec = 15;

  function formatTime(sec) {
    const s = Math.floor(sec);
    return `00:${String(s).padStart(2, '0')}`;
  }

  function drawFrame(t) {
    const w = canvas.width;
    const h = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#2a2334');
    grad.addColorStop(0.5, '#1d1826');
    grad.addColorStop(1, '#15101d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle film dust & orbital rings
    ctx.strokeStyle = 'rgba(220, 196, 154, 0.24)';
    ctx.lineWidth = 1;
    const cx = w / 2;
    const cy = h / 2;
    const phase = (progress / 100) * Math.PI * 2 + t * 0.0005;
    for (let r = 46; r <= 120; r += 26) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.4, r * 0.72, Math.sin(phase * 0.5) * 0.25, 0, Math.PI * 2);
      ctx.stroke();
    }
    const px = cx + Math.cos(phase) * 90;
    const py = cy + Math.sin(phase) * 45;
    ctx.fillStyle = 'rgba(220, 196, 154, 0.85)';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Film gate frame
    ctx.strokeStyle = 'rgba(203, 181, 217, 0.25)';
    ctx.strokeRect(18, 18, w - 36, h - 36);
  }

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.1, (ts - lastTs) / 1000);
    lastTs = ts;
    if (playing) {
      progress += (dt / totalSec) * 100;
      if (progress >= 100) {
        progress = 100;
        playing = false;
        playBtn.textContent = 'Replay';
        if (onEnded) onEnded();
      }
      scrub.value = String(Math.round(progress));
      timeEl.textContent = `${formatTime((progress / 100) * totalSec)} / ${videoItem.duration || '00:15'}`;
    }
    drawFrame(ts);
    if (playing) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = 0;
    }
  }

  drawFrame(0);
  if (playing) {
    playBtn.textContent = 'Pause';
    rafId = requestAnimationFrame(tick);
  }

  playBtn.addEventListener('click', () => {
    if (progress >= 100) progress = 0;
    playing = !playing;
    playBtn.textContent = playing ? 'Pause' : 'Play';
    lastTs = 0;
    if (playing && !rafId) rafId = requestAnimationFrame(tick);
  });

  scrub.addEventListener('input', () => {
    progress = Number(scrub.value);
    timeEl.textContent = `${formatTime((progress / 100) * totalSec)} / ${videoItem.duration || '00:15'}`;
    drawFrame(performance.now());
  });

  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (wrap.requestFullscreen) {
      wrap.requestFullscreen().catch(() => {});
    }
  });

  return {
    destroy() {
      playing = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
    pause() {
      playing = false;
      playBtn.textContent = 'Play';
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
    play() {
      playing = true;
      playBtn.textContent = 'Pause';
      lastTs = 0;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }
  };
}
