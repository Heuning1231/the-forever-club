import { RoyalAudio } from './audio.js';
import { resolvePhotoSrc, resolvePosterSrc, mountMediaVideo } from './placeholders.js';
import { exportMembershipCardPNG, exportBlessingCardPNG, exportConstellationCardPNG, exportRoyalPactPNG } from './cards.js';
import { CelestialStarfield, mountMemoryOrbit, mountMemoryCrystal, mountConstellationCanvas, isReducedMotion } from './scenes3d.js';

const $ = id => document.getElementById(id);
const glyph = path => `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const icons = {
  star: glyph('M16 2l3 11 11 3-11 3-3 11-3-11-11-3 11-3z'),
  crown: glyph('M4 25l2-15 6 6 4-9 4 9 6-6 2 15zM6 28h20'),
  memories: glyph('M5 7h22v18H5zM7 22l7-7 5 5 3-4 4 5M21 12h.1'),
  destiny: glyph('M16 3v26M3 16h26M16 6a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM16 11l5 5-5 5-5-5z'),
  letters: glyph('M4 8h24v16H4zM5 9l11 9L27 9'),
  crystal: glyph('M16 3l9 7v12l-9 7-9-7V10zM16 3l4 13-4 13-4-13zM7 10l5 6m8 0l5 6'),
  pact: glyph('M8 5h16v18H8zM12 10h8m-8 4h8m-8 4h4m3 5v5l2-1 2 1v-5'),
  finale: glyph('M7 22l6-15 10 7 3 12zM5 22h4M13 5v4m8 5h4m1 10v4'),
  capsule: glyph('M11 5h10M11 27h10m-8-22v6l6 10v6m0-22v6l-6 10v6'),
  tea: glyph('M5 13h17v3a8.5 8.5 0 0 1-17 0zm17 1h3a3 3 0 0 1-3 6M4 27h21M11 9l2-4m4 4 2-4'),
  coin: glyph('M16 4a12 12 0 1 0 0 24 12 12 0 0 0 0-24zM16 9l2 5 5 2-5 2-2 5-2-5-5-2 5-2z')
};
const destinations = [
  ['memories', 'Memories', '#bda7df', 21, 21],
  ['destiny', 'Royal Destiny', '#e7c889', 79, 21],
  ['letters', 'Letters', '#e4adc5', 15, 50],
  ['crystal', 'Memory Crystal', '#b4a0dd', 85, 50],
  ['pact', 'Our Forever Pact', '#e8bd8e', 21, 80],
  ['finale', 'Final Constellation', '#b2b7e6', 79, 80]
];
const promises = [
  '毕业后可以不常见面，但不可以忘记彼此。',
  '无论谁先发财，都不可以假装不认识其他人。',
  'Mamak 聚会永久有效。',
  '八卦共享权限终身有效。',
  '不论未来去了哪里，四人会员资格永不过期。'
];
const memberPositions = [[14, 54], [36, 22], [64, 39], [85, 72]];
const batchSize = 8;

function readState(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}

function storeState(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be unavailable. */ }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function burst(container, count = 22, type = 'star') {
  const cloud = document.createElement('span');
  cloud.className = `particle-cloud ${type}`;
  cloud.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('i');
    const angle = i * 2.4;
    const radius = 32 + (i * 17) % 155;
    spark.style.setProperty('--dx', `${Math.cos(angle) * radius}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * radius}px`);
    spark.style.setProperty('--spin', `${i * 39}deg`);
    spark.style.animationDelay = `${i % 5 * 24}ms`;
    cloud.append(spark);
  }
  container.append(cloud);
  setTimeout(() => cloud.remove(), 1400);
}

class ForeverClub {
  constructor() {
    this.audio = new RoyalAudio();
    const saved = readState('fc-v6-state');
    this.state = { memberIndex: -1, stars: [], eggs: [], seals: [], ...saved };
    const previous = readState('fc-v4-state');
    if (!('memberIndex' in saved) && [1, 2, 3].includes(previous.memberIndex)) {
      this.state.memberIndex = previous.memberIndex;
    }
    this.cleanup = [];
    this.pendingStars = new Set();
    this.memoryPage = 0;
  }

  async init() {
    document.documentElement.classList.toggle('reduced-motion', readState('fc-reduced-motion') === 1);
    this.starfield = new CelestialStarfield($('bg-stars'));
    this.starfield.start();
    try {
      [this.config, this.media, this.letterConfig] = await Promise.all(['config.json', 'media.json', 'letters.json'].map(async name => {
        const response = await fetch(`./${name}`);
        if (!response.ok) throw new Error(name);
        return response.json();
      }));
    } catch {
      $('app').innerHTML = '<section class="scene-shell"><h1>The Forever Club</h1><p>The archive could not load. Refresh to try again.</p></section>';
      return;
    }
    this.memoryItems = [];
    const { photos, videos } = this.media;
    for (let i = 0; i < Math.max(photos.length, videos.length); i++) {
      if (photos[i]) this.memoryItems.push(photos[i]);
      if (videos[i]) this.memoryItems.push(videos[i]);
    }
    $('btn-home').onclick = () => this.universe();
    $('btn-sound').onclick = () => {
      this.audio.toggleMute();
      this.syncChrome();
    };
    $('btn-motion').onclick = () => {
      const root = document.documentElement;
      root.classList.toggle('reduced-motion');
      storeState('fc-reduced-motion', root.classList.contains('reduced-motion') ? 1 : 0);
      this.starfield.pause();
      this.starfield.start();
      this.syncChrome();
      $('club-menu').open = false;
      this[this.scene]();
    };
    $('btn-switch-member').onclick = () => this.identities();
    $('btn-replay-ticket').onclick = () => this.ticket();
    $('modal-close').onclick = () => this.closeMedia();
    $('media-modal').addEventListener('cancel', event => {
      event.preventDefault();
      this.closeMedia();
    });
    $('egg-close').onclick = () => $('egg-toast').classList.add('hidden');
    document.addEventListener('click', event => {
      if (!$('club-menu').contains(event.target)) $('club-menu').open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && $('club-menu').open) {
        $('club-menu').open = false;
        $('club-menu').querySelector('summary').focus();
      }
    });
    if (this.member) this.universe();
    else this.ticket();
  }

  get member() {
    return [1, 2, 3].includes(this.state.memberIndex) ? this.config.members[this.state.memberIndex] : null;
  }

  save() { storeState('fc-v6-state', this.state); }

  syncChrome() {
    $('nav-member-badge').textContent = this.member?.name || 'The Forever Club';
    $('btn-sound').textContent = this.audio.muted ? 'Sound Off' : 'Sound On';
    $('btn-sound').setAttribute('aria-pressed', String(!this.audio.muted));
    $('btn-motion').textContent = isReducedMotion() ? 'Motion: Reduced' : 'Motion: Full';
    $('btn-motion').setAttribute('aria-pressed', String(isReducedMotion()));
    $('btn-motion').disabled = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  render(scene, html, { chrome = true } = {}) {
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
    this.closeMedia();
    $('club-menu').open = false;
    $('egg-toast').classList.add('hidden');
    $('top-bar').classList.toggle('is-hidden', !chrome);
    this.syncChrome();
    this.scene = scene;
    $('app').innerHTML = html;
    window.scrollTo(0, 0);
    const heading = $('app').querySelector('h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  section(scene, title, html, eyebrow = '') {
    this.render(scene, `<section class="scene-shell v6-scene scene-${scene}">
      <div class="scene-heading">${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}<h1>${title}</h1></div>
      ${html}</section>`);
  }

  later(fn, ms) {
    const timer = setTimeout(fn, ms);
    this.cleanup.push(() => clearTimeout(timer));
  }

  award(id) {
    if (this.state.stars.includes(id)) return;
    this.state.stars.push(id);
    this.pendingStars.add(id);
    this.save();
  }

  egg(id, title, body, download = null) {
    if (!this.state.eggs.includes(id)) {
      this.state.eggs.push(id);
      this.award(`egg-${id}`);
      this.save();
    }
    if (!title) return;
    $('egg-count').textContent = `Celestial Secret · ${this.state.eggs.length} / 5`;
    $('egg-title').textContent = title;
    $('egg-body').textContent = body;
    $('egg-download').classList.toggle('hidden', !download);
    $('egg-download').onclick = download;
    $('egg-toast').classList.remove('hidden');
    this.audio.playCrystalRelease();
  }

  ticket() {
    const artwork = this.config.ticketArtwork;
    this.render('ticket', `<section class="scene-shell v6-admission">
      <div class="admission-edition"><span>The Forever Club · 2022–2026</span><button type="button" class="btn-link" id="skip-intro">Skip intro</button></div>
      <div class="scene-heading"><span class="eyebrow">A graduation invitation</span><h1>A universe <em>of us.</em></h1></div>
      <div class="v6-printer" id="printer">
        <div class="printer-face"><span class="printer-insignia">${icons.crown}</span><div class="printer-display"><small>Royal Admission</small><strong id="printer-status" role="status">Printing your invitation</strong></div></div>
        <div class="printer-mouth"></div>
        <div class="paper-track" id="paper-track">
          <div class="paper-feed" id="paper-feed">
            <span class="paper-stub"></span>
            <button type="button" id="pull-ticket" class="pull-ticket" aria-label="Collect your graduation ticket" disabled>
              <span class="ticket-artwork">
                ${artwork ? `<img src="${escapeHTML(artwork)}" alt="Original graduation ticket for The Forever Club">` : `<span class="ticket-placeholder">${icons.star}<small>Royal Admission · 2022–2026</small><strong>The Forever Club</strong><em>Four girls. One universe.</em><small>Temporary ticket artwork</small></span>`}
              </span>
            </button>
          </div>
        </div>
      </div>
      <button type="button" id="ticket-cue" class="ticket-cue" disabled><span aria-hidden="true"></span>Tap or Pull to Enter</button>
    </section>`, { chrome: Boolean(this.member) });
    const printer = $('printer');
    const paper = $('pull-ticket');
    const cue = $('ticket-cue');
    const feed = $('paper-feed');
    const reduced = isReducedMotion();
    let pulling = null;
    let detached = false;
    const begin = () => printer.classList.add('is-printing');
    const printed = () => {
      printer.classList.add('is-printed');
      paper.disabled = false;
      cue.disabled = false;
      $('printer-status').textContent = 'Your invitation awaits';
    };
    this.later(begin, reduced ? 0 : 80);
    this.later(printed, reduced ? 0 : 1950);
    const enter = () => {
      if (detached) return;
      detached = true;
      paper.disabled = true;
      cue.disabled = true;
      printer.classList.add('is-detached');
      $('printer-status').textContent = 'Royal admission granted';
      this.audio.playPaperUnfold();
      burst(feed, 13, 'paper');
      burst(feed, 28);
      this.award('ticket');
      this.later(() => this.invitation(), reduced ? 0 : 760);
    };
    const resetPull = () => {
      pulling = null;
      paper.style.removeProperty('--pull');
      paper.style.removeProperty('--tear');
      paper.classList.remove('is-pulling');
    };
    cue.onclick = enter;
    paper.onclick = enter;
    paper.onpointerdown = event => {
      if (!event.isPrimary || event.button !== 0) return;
      pulling = { id: event.pointerId, y: event.clientY, fragments: 0 };
      paper.setPointerCapture(event.pointerId);
      paper.classList.add('is-pulling');
    };
    paper.onpointermove = event => {
      if (pulling?.id !== event.pointerId) return;
      const pull = Math.min(105, Math.max(0, event.clientY - pulling.y));
      paper.style.setProperty('--pull', pull);
      paper.style.setProperty('--tear', Math.min(100, pull * 1.15));
      const fragments = Math.floor(pull / 29);
      if (fragments > pulling.fragments && !reduced) {
        pulling.fragments = fragments;
        burst(feed, 4, 'paper');
      }
    };
    paper.onpointerup = event => {
      if (pulling?.id !== event.pointerId) return;
      const travel = event.clientY - pulling.y;
      if (travel >= 46 || Math.abs(travel) < 10) enter();
      else resetPull();
    };
    paper.onpointercancel = resetPull;
    $('skip-intro').onclick = () => this.invitation();
  }

  invitation() {
    this.render('invitation', `<section class="scene-shell v6-scene">
      <div class="scene-heading"><span class="eyebrow">The Forever Club</span><h1>A Royal Invitation</h1></div>
      <button type="button" class="v6-envelope" id="open-invitation" aria-label="Open your invitation">
        <span class="envelope-sheet"><strong>The Forever Club</strong><em>2022–2026</em></span>
        <span class="envelope-pocket"></span><span class="envelope-flap"></span><span class="v6-seal">${icons.crown}</span>
      </button>
      <p class="invitation-caption">Open Your Invitation</p>
    </section>`, { chrome: Boolean(this.member) });
    $('open-invitation').onclick = event => {
      const envelope = event.currentTarget;
      envelope.disabled = true;
      envelope.classList.add('is-open');
      this.audio.playPaperUnfold();
      this.award('invitation');
      burst(envelope, 30);
      this.later(() => this.identities(), isReducedMotion() ? 0 : 860);
    };
  }

  identities() {
    const stars = this.config.members.map((member, index) => {
      const [x, y] = memberPositions[index];
      const body = `<span class="identity-light">${icons.star}</span><span>${member.name}</span>`;
      return index === 0
        ? `<div class="identity-point permanent-star" style="--x:${x}%;--y:${y}%">${body}</div>`
        : `<button type="button" class="identity-point" data-identity="${index}" style="--x:${x}%;--y:${y}%">${body}</button>`;
    }).join('');
    this.render('identities', `<section class="scene-shell v6-scene">
      <div class="scene-heading"><span class="eyebrow">Four stars, one sky</span><h1>Choose Your Star</h1></div>
      <div class="identity-sky">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M14 54L36 22 64 39 85 72 14 54" fill="none" vector-effect="non-scaling-stroke"/></svg>
        ${stars}
      </div>
    </section>`, { chrome: Boolean(this.member) });
    document.querySelectorAll('[data-identity]').forEach(btn => {
      btn.onclick = () => {
        this.state.memberIndex = Number(btn.dataset.identity);
        this.save();
        this.audio.playConstellationStar(this.state.memberIndex);
        this.membership();
      };
    });
  }

  membership() {
    const member = this.member;
    this.section('membership', `Welcome, ${member.name}`, `
      <div class="pass-perspective">
        <div class="v6-pass" id="member-pass">
          <div class="pass-trim"><header><span>The Forever Club</span>${icons.crown}</header>
          <div><span class="eyebrow">${member.constellation}</span><h2>${member.name}</h2><span>${member.cardCode}</span></div>
          <footer><span>Est. Forever</span><span>2022–2026</span></footer></div>
        </div>
      </div>
      <div class="action-row"><button type="button" class="btn-gold-outline" id="download-pass">Save Pass PNG</button><button type="button" class="btn-gold-primary" id="enter-universe">Enter Our Universe</button></div>`, 'Royal Membership Pass');
    const pass = $('member-pass');
    pass.onpointerdown = event => pass.setPointerCapture(event.pointerId);
    pass.onpointermove = event => {
      if (isReducedMotion()) return;
      const box = pass.parentElement.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
      const y = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
      pass.style.setProperty('--rx', `${(0.5 - y) * 24}deg`);
      pass.style.setProperty('--ry', `${(x - 0.5) * 26}deg`);
      pass.style.setProperty('--reflect', `${x * 100}%`);
    };
    const reset = () => ['--rx', '--ry', '--reflect'].forEach(key => pass.style.removeProperty(key));
    pass.onpointerup = pass.onpointerleave = pass.onpointercancel = reset;
    $('download-pass').onclick = () => exportMembershipCardPNG(member);
    $('enter-universe').onclick = () => {
      this.award(`pass-${member.id}`);
      this.universe();
    };
  }

  universe() {
    if (!this.member) return this.identities();
    const planets = destinations.map(([id, name, color, x, y]) => `
      <button type="button" class="celestial-destination" data-destination="${id}" style="--planet:${color};--x:${x}%;--y:${y}%">
        <span class="celestial-globe">${icons[id]}</span><span>${name}</span>
      </button>`).join('');
    this.section('universe', 'Our Little Universe', `
      <div class="universe-map" id="universe-map">
        <div class="map-ribbon ribbon-one"></div><div class="map-ribbon ribbon-two"></div>
        ${planets}
        <button type="button" id="universe-heart" class="universe-heart" aria-label="Royal crown"><span>${icons.crown}</span><small id="starlight-count">${this.state.stars.length} starlight</small></button>
      </div>
      <button type="button" class="capsule-entrance" data-destination="capsule">${icons.capsule}<span>Future Time Capsule</span></button>`, 'The Forever Club · 2022–2026');
    document.querySelectorAll('[data-destination]').forEach(button => {
      button.onclick = () => {
        this.audio.playChime();
        this[button.dataset.destination]();
      };
    });
    $('universe-heart').onclick = () => {
      this.egg('crown', 'Lifetime Friendship Membership', 'Your seat in The Forever Club is reserved for every era.');
      this.collectStarlight();
    };
    this.collectStarlight();
  }

  collectStarlight() {
    const map = $('universe-map');
    $('starlight-count').textContent = `${this.state.stars.length} starlight`;
    if (this.pendingStars.size && !isReducedMotion()) {
      const count = Math.min(this.pendingStars.size, 10);
      for (let i = 0; i < count; i++) {
        const star = document.createElement('i');
        star.className = 'returning-star';
        star.style.setProperty('--x', `${(i % 2 ? -1 : 1) * (65 + i * 13)}px`);
        star.style.setProperty('--y', `${-120 + i * 23}px`);
        star.style.animationDelay = `${i * 90}ms`;
        map.append(star);
        this.later(() => star.remove(), 2000);
      }
    }
    this.pendingStars.clear();
  }

  memories() {
    const count = Math.max(1, Math.ceil(this.memoryItems.length / batchSize));
    this.section('memories', 'Memory Waterfall', `
      <div class="memory-controls">
        <button type="button" class="btn-gold-primary" id="play-memories" ${this.memoryItems.length ? '' : 'disabled'}>Play Our Memories</button>
      </div>
      <div id="memory-space" class="orbit-container memory-space"></div>
      <div class="memory-pages"><button type="button" id="memory-prev" class="btn-gold-outline" aria-label="Previous memories">←</button>
        <output id="memory-page" aria-live="polite"></output><button type="button" id="memory-next" class="btn-gold-outline" aria-label="Next memories">→</button></div>`, 'Photos & Films');
    let orbit;
    const show = direction => {
      this.memoryPage = (this.memoryPage + direction + count) % count;
      $('memory-page').textContent = `${this.memoryPage + 1} / ${count}`;
      const start = this.memoryPage * batchSize;
      const items = this.memoryItems.slice(start, start + batchSize);
      orbit?.destroy();
      if (!items.length) {
        $('memory-space').textContent = 'No memories have been added.';
        return;
      }
      orbit = mountMemoryOrbit($('memory-space'), items, {
        onSelectPhoto: item => this.openMemory(item),
        onHiddenOrbitEgg: () => {
          this.egg('shooting-star');
          this.openMemory(this.randomMemory());
        },
        onSwipe: show
      });
    };
    show(0);
    this.cleanup.push(() => orbit?.destroy());
    $('memory-prev').onclick = () => show(-1);
    $('memory-next').onclick = () => show(1);
    $('play-memories').onclick = () => this.openMemory(this.memoryItems[this.memoryPage * batchSize], true);
  }

  randomMemory() {
    return this.memoryItems[Math.floor(Math.random() * this.memoryItems.length)];
  }

  openMemory(item, cinematic = false) {
    if (!item) return;
    this.closeMedia();
    const dialog = $('media-modal');
    const stage = $('modal-stage');
    const returnFocus = document.activeElement;
    let index = this.memoryItems.indexOf(item);
    let paused = isReducedMotion();
    let timer;
    let controller;
    stage.innerHTML = `<div id="memory-display" class="memory-display"></div><p id="memory-caption" class="memory-caption"></p>
      ${cinematic ? `<div class="action-row memory-player-controls"><button type="button" id="slide-prev" class="btn-gold-outline">Previous</button><button type="button" id="slide-pause" class="btn-gold-outline"></button><button type="button" id="slide-next" class="btn-gold-outline">Next</button></div>` : ''}`;
    const show = (step = 0) => {
      clearTimeout(timer);
      controller?.destroy();
      controller = null;
      index = (index + step + this.memoryItems.length) % this.memoryItems.length;
      const current = this.memoryItems[index];
      const display = $('memory-display');
      display.replaceChildren();
      $('memory-caption').textContent = current.label;
      this.award(`memory-${current.id}`);
      if (current.type === 'video') {
        controller = mountMediaVideo(display, current, {
          autoplay: cinematic ? !paused : Boolean(!current.isPlaceholder && current.src),
          onEnded: () => { if (cinematic && !paused) show(1); }
        });
      } else {
        const photo = document.createElement('img');
        photo.src = resolvePhotoSrc(current);
        photo.alt = current.label;
        if (cinematic && !paused && !isReducedMotion()) photo.className = 'cine-ken-burns';
        display.append(photo);
        if (cinematic && !paused) timer = setTimeout(() => show(1), 4500);
      }
    };
    if (cinematic) {
      $('slide-pause').textContent = paused ? 'Resume' : 'Pause';
      $('slide-pause').onclick = () => {
        paused = !paused;
        $('slide-pause').textContent = paused ? 'Resume' : 'Pause';
        clearTimeout(timer);
        if (controller) {
          if (paused) controller.pause();
          else Promise.resolve(controller.play()).catch(() => {});
        } else {
          $('memory-display').querySelector('img').style.animationPlayState = paused ? 'paused' : 'running';
          if (!paused) timer = setTimeout(() => show(1), 4500);
        }
      };
      $('slide-prev').onclick = () => show(-1);
      $('slide-next').onclick = () => show(1);
    }
    dialog.classList.remove('hidden');
    dialog.showModal();
    this.mediaCleanup = () => {
      clearTimeout(timer);
      controller?.destroy();
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
    show();
  }

  closeMedia() {
    const dialog = $('media-modal');
    if (!dialog.open) return;
    dialog.close();
    dialog.classList.add('hidden');
    this.mediaCleanup?.();
    this.mediaCleanup = null;
    $('modal-stage').replaceChildren();
  }

  letters() {
    if (!this.member) return this.identities();
    const member = this.member;
    const { sender, shared, personal } = this.letterConfig;
    this.section('letters', 'A Letter Across the Stars', `
      <button type="button" class="v6-envelope letter-envelope" id="open-letter" aria-label="Unseal your letter">
        <span class="envelope-sheet"><strong>For ${member.name}</strong><em>From ${escapeHTML(sender)}</em></span>
        <span class="envelope-pocket"></span><span class="envelope-flap"></span><span class="v6-seal">${icons.letters}</span>
      </button>
      <p class="invitation-caption" id="letter-prompt">Unseal Your Letter</p>
      <article id="graduation-letter" class="v6-stationery hidden" lang="zh">
        <span class="eyebrow">From ${escapeHTML(sender)}</span><h2>For ${member.name}</h2>
        <p id="letter-body" class="handwritten"></p><p class="letter-signature" lang="en">With love,<br>${escapeHTML(sender)}</p>
      </article>`, `For ${member.name}`);
    $('open-letter').onclick = event => {
      const envelope = event.currentTarget;
      envelope.disabled = true;
      envelope.classList.add('is-open');
      this.audio.playPaperUnfold();
      this.award(`letter-${member.id}`);
      const text = [shared, personal?.[member.id]].filter(Boolean).join('\n\n');
      this.later(() => {
        envelope.classList.add('hidden');
        $('letter-prompt').classList.add('hidden');
        $('graduation-letter').classList.remove('hidden');
        const body = $('letter-body');
        if (isReducedMotion()) {
          body.textContent = text;
          return;
        }
        let visible = 0;
        const timer = setInterval(() => {
          visible += 4;
          body.textContent = text.slice(0, visible);
          if (visible >= text.length) clearInterval(timer);
        }, 28);
        this.cleanup.push(() => clearInterval(timer));
      }, isReducedMotion() ? 0 : 690);
    };
  }

  pact() {
    if (!this.member) return this.identities();
    const member = this.member;
    const sealed = this.state.seals.includes(member.id);
    this.section('pact', 'Our Forever Pact', `
      <article class="v6-stationery pact-paper">
        <div class="pact-names">${this.config.members.map(m => `<span>${m.name}</span>`).join('')}</div>
        <ul class="pact-promises" lang="zh">${promises.map(p => `<li>${p}</li>`).join('')}</ul>
        <div id="pact-seal" class="personal-seal ${sealed ? '' : 'hidden'}"><span>${member.sealMonogram}</span><small>Sealed by ${member.name} on this device</small></div>
        <button type="button" id="seal-pact" class="btn-gold-primary ${sealed ? 'hidden' : ''}">Place My Royal Seal</button>
        <button type="button" id="download-pact" class="btn-gold-outline ${sealed ? '' : 'hidden'}">Save Pact PNG</button>
        <button type="button" class="discovery-glyph teacup" id="hidden-teacup" aria-label="Teacup ornament">${icons.tea}</button>
      </article>`, 'The Royal Friendship Contract');
    $('seal-pact').onclick = () => {
      if (this.state.seals.includes(member.id)) return;
      this.state.seals.push(member.id);
      this.save();
      this.award(`pact-${member.id}`);
      this.audio.playTicketCollect();
      $('pact-seal').classList.remove('hidden');
      $('pact-seal').classList.add('is-stamped');
      $('seal-pact').classList.add('hidden');
      $('download-pact').classList.remove('hidden');
      $('download-pact').focus({ preventScroll: true });
      burst($('pact-seal'));
    };
    $('download-pact').onclick = () => exportRoyalPactPNG(this.config.members, promises, member);
    $('hidden-teacup').onclick = () => this.egg('teacup', 'Lifetime Mamak Invitation', 'There will always be room for all four of us at the same table.');
  }

  destiny() {
    let taps = 0;
    let spins = 0;
    let start = null;
    let spinning = false;
    let blessing;
    this.section('destiny', 'Royal Destiny', `
      <div class="destiny-stage">
        <button type="button" class="destiny-wheel" id="spin-destiny" aria-label="Spin the destiny instrument">
          <span class="destiny-ring ring-gold"></span><span class="destiny-ring ring-hours"></span>
          <span class="destiny-ring ring-inner-gold"></span><span class="destiny-gem">${icons.star}</span>
        </button>
        <button type="button" class="discovery-glyph wealth-coin" id="wealth-coin" aria-label="Gold coin ornament">${icons.coin}</button>
      </div>
      <p id="destiny-result" class="destiny-result" role="status">Tap or spin the rings</p>
      <button type="button" id="save-destiny" class="btn-gold-outline hidden">Save Blessing PNG</button>`, 'The Celestial Astrolabe');
    const wheel = $('spin-destiny');
    const spin = direction => {
      if (spinning) return;
      spinning = true;
      blessing = this.config.blessings[Math.floor(Math.random() * this.config.blessings.length)];
      spins += direction * (720 + Math.floor(Math.random() * 310));
      wheel.style.setProperty('--turn', `${spins}deg`);
      $('destiny-result').textContent = 'The rings are aligning…';
      $('save-destiny').classList.add('hidden');
      this.audio.playWheelTick();
      this.later(() => {
        spinning = false;
        $('destiny-result').textContent = blessing;
        $('save-destiny').classList.remove('hidden');
        this.award(`destiny-${blessing}`);
        this.audio.playCrystalRelease();
        burst(wheel.parentElement, 28);
      }, isReducedMotion() ? 0 : 1600);
    };
    wheel.onclick = () => spin(1);
    wheel.onpointerdown = event => {
      if (!event.isPrimary || event.button !== 0 || spinning) return;
      start = event.clientX;
      wheel.setPointerCapture(event.pointerId);
    };
    wheel.onpointerup = event => {
      if (start !== null && Math.abs(event.clientX - start) > 22) spin(event.clientX > start ? 1 : -1);
      start = null;
    };
    wheel.onpointercancel = () => { start = null; };
    $('save-destiny').onclick = () => exportBlessingCardPNG(blessing, this.member?.name);
    $('wealth-coin').onclick = () => {
      if (++taps < 3) return;
      this.egg('wealth', 'Certified Rich Girl', 'Officially entitled to be rich in fortune, friendship, and Mamak receipts.',
        () => exportBlessingCardPNG('Certified Rich Girl', this.member?.name));
    };
  }

  crystal() {
    this.section('crystal', 'Memory Crystal', `<div id="crystal-mount"></div>
      <button type="button" class="btn-gold-primary" id="crystal-memory" ${this.memoryItems.length ? '' : 'disabled'}>Reveal a Memory</button>`, 'An Amethyst Keepsake');
    const reveal = () => {
      const item = this.randomMemory();
      if (!item) return;
      this.award('crystal');
      this.audio.playCrystalRelease();
      this.openMemory(item);
    };
    const crystal = mountMemoryCrystal($('crystal-mount'), { onReleaseMemory: reveal });
    this.cleanup.push(() => crystal.destroy());
    $('crystal-memory').onclick = reveal;
  }

  capsule() {
    const capsule = this.config.timeCapsule;
    this.section('capsule', 'Future Time Capsule', `
      <div class="capsule-dome v6-capsule">
        <div class="capsule-emblem">${icons.capsule}</div>
        <span class="eyebrow" id="capsule-state">Sealed for the future</span>
        <div class="capsule-countdown">${['days', 'hours', 'minutes', 'seconds'].map(unit => `<div><strong id="cd-${unit}">00</strong><span>${unit}</span></div>`).join('')}</div>
        <p class="muted">${escapeHTML(capsule.dateNote)}</p>
        <button type="button" id="preview-capsule" class="btn-gold-outline">Preview the Letter</button>
      </div>
      <article class="v6-stationery hidden" id="capsule-letter"><h2>${escapeHTML(capsule.letterTitle)}</h2><p class="handwritten">${escapeHTML(capsule.letterBody)}</p></article>`);
    const date = Date.parse(capsule.unlockDate);
    let preview = false;
    const reveal = () => $('capsule-letter').classList.remove('hidden');
    const update = () => {
      const remaining = Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1000)) : 0;
      const values = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
      ['days', 'hours', 'minutes', 'seconds'].forEach((unit, index) => {
        $('cd-' + unit).textContent = String(values[index]).padStart(2, '0');
      });
      if (Number.isFinite(date) && remaining === 0) {
        $('capsule-state').textContent = 'Unlocked';
        $('preview-capsule').classList.add('hidden');
        reveal();
      } else if (!preview && !Number.isFinite(date)) {
        $('capsule-state').textContent = 'Unlock date to be confirmed';
      }
    };
    update();
    const timer = setInterval(update, 1000);
    this.cleanup.push(() => clearInterval(timer));
    $('preview-capsule').onclick = () => {
      preview = true;
      $('capsule-state').textContent = 'Letter preview';
      this.audio.playPaperUnfold();
      this.award('capsule');
      reveal();
    };
  }

  finale() {
    this.section('finale', 'Our Forever Constellation', `
      <div class="finale-sky" id="finale-sky"><div id="finale-stars"></div></div>
      <p id="finale-instruction">Connect our four stars</p>
      <div id="finale-memories" class="finale-memories"></div>
      <div id="finale-message" class="finale-message hidden">${this.config.finale.poemLines.map(line => `<p>${escapeHTML(line)}</p>`).join('')}
        <button type="button" id="save-finale" class="btn-gold-outline">Save Constellation PNG</button>
      </div>`, 'The Forever Club · Est. Forever');
    const members = this.config.members.map((member, index) => ({
      ...member, starCoords: { x: memberPositions[index][0], y: memberPositions[index][1] }
    }));
    const ctrl = mountConstellationCanvas($('finale-stars'), members, {
      onStarLit: (index, count) => {
        this.audio.playConstellationStar(index);
        $('finale-instruction').textContent = `${count} / 4 stars connected`;
        if (index === 3) this.egg('fourth', 'Four Stars, One Sky', 'KAHEAN, Líng Lëé, Jia Qi and yimin_04. Wherever we go, there will always be four stars in this sky.');
      },
      onAllLit: () => {
        this.award('finale');
        this.audio.playFinaleChord();
        const sky = $('finale-sky');
        sky.classList.add('is-aligned');
        burst(sky, Math.min(42, 10 + this.state.stars.length * 2));
        const originals = this.memoryItems.filter(item => !item.isPlaceholder && item.src);
        const keepsakes = (originals.length ? originals : this.media.photos).slice(0, 4);
        keepsakes.forEach((item, index) => {
          this.later(() => {
            const frame = document.createElement('button');
            frame.type = 'button';
            frame.className = 'finale-frame';
            const photo = document.createElement('img');
            photo.loading = 'lazy';
            photo.src = item.type === 'video' ? resolvePosterSrc(item) : resolvePhotoSrc(item);
            photo.alt = item.label;
            frame.append(photo);
            frame.onclick = () => this.openMemory(item);
            $('finale-memories').append(frame);
          }, isReducedMotion() ? 0 : 330 + index * 170);
        });
        this.later(() => {
          $('finale-message').classList.remove('hidden');
        }, isReducedMotion() ? 0 : 940);
      }
    });
    this.cleanup.push(() => ctrl.destroy());
    $('save-finale').onclick = () => exportConstellationCardPNG(members, this.config.finale.poemLines);
  }
}

new ForeverClub().init();
