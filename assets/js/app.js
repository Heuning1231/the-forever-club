import { RoyalAudio } from './audio.js';
import {
  resolvePhotoSrc,
  resolveThumbSrc,
  resolvePosterSrc,
  mountMediaVideo
} from './placeholders.js';
import {
  exportMembershipCardPNG,
  exportBlessingCardPNG,
  exportConstellationCardPNG
} from './cards.js';
import {
  CelestialStarfield,
  mountMemoryOrbit,
  mountMemoryCrystal,
  mountConstellationCanvas,
  isReducedMotion
} from './scenes3d.js';

const $ = (id) => document.getElementById(id);

const SVG_ICONS = {
  crown: `<svg viewBox="0 0 48 32" class="svg-glyph" aria-hidden="true"><path d="M4 26L8 10L17 18L24 5L31 18L40 10L44 26Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 29H42" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="24" cy="4" r="1.8" fill="currentColor"/><circle cx="8" cy="9" r="1.5" fill="currentColor"/><circle cx="40" cy="9" r="1.5" fill="currentColor"/></svg>`,
  star: `<svg viewBox="0 0 32 32" class="svg-glyph" aria-hidden="true"><path d="M16 2L19 13L30 16L19 19L16 30L13 19L2 16L13 13Z" fill="currentColor"/></svg>`,
  soundOn: `<svg viewBox="0 0 24 24" class="svg-icon" aria-hidden="true"><path d="M4 9H8L13 4V20L8 15H4V9Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M16.5 8.5C17.8 9.8 17.8 14.2 16.5 15.5M19 6C21.5 9 21.5 15 19 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="0 0 24 24" class="svg-icon" aria-hidden="true"><path d="M4 9H8L13 4V20L8 15H4V9Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M17 9L21 15M21 9L17 15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  planetMuseum: `<svg viewBox="0 0 36 36" class="svg-glyph" aria-hidden="true"><rect x="7" y="9" width="22" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="10.5" y="12.5" width="15" height="11" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="15" cy="16.5" r="1.5" fill="currentColor"/><path d="M11 22L16 17.5L20 21L22.5 18.5L25 22" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>`,
  planetArchives: `<svg viewBox="0 0 36 36" class="svg-glyph" aria-hidden="true"><path d="M8 7H24L28 11V29H8Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 14H24M12 19H24M12 24H19" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  planetCinema: `<svg viewBox="0 0 36 36" class="svg-glyph" aria-hidden="true"><circle cx="18" cy="18" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><polygon points="15,13 24,18 15,23" fill="currentColor"/></svg>`,
  planetBallroom: `<svg viewBox="0 0 36 36" class="svg-glyph" aria-hidden="true"><circle cx="18" cy="18" r="11" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="18" cy="18" r="6.5" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/><path d="M18 4V9M18 27V32M4 18H9M27 18H32" stroke="currentColor" stroke-width="1.4"/></svg>`,
  planetChallenge: `<svg viewBox="0 0 36 36" class="svg-glyph" aria-hidden="true"><rect x="9" y="6" width="18" height="24" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M18 12L20 16.5L24.5 18L20 19.5L18 24L16 19.5L11.5 18L16 16.5Z" fill="currentColor"/></svg>`,
  planetLetters: `<svg viewBox="0 0 36 36" class="svg-glyph" aria-hidden="true"><rect x="6" y="9" width="24" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 10L18 19L29 10" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="18" cy="19" r="2.6" fill="currentColor"/></svg>`
};

const WORLD_ICONS = {
  museum: SVG_ICONS.planetMuseum,
  archives: SVG_ICONS.planetArchives,
  cinema: SVG_ICONS.planetCinema,
  ballroom: SVG_ICONS.planetBallroom,
  challenge: SVG_ICONS.planetChallenge,
  letters: SVG_ICONS.planetLetters
};

class ForeverClubApp {
  constructor() {
    this.config = null;
    this.media = null;
    this.audio = new RoyalAudio();
    this.starfield = null;
    this.activeCleanup = [];
    this.activeVideoController = null;
    this.cineTimer = null;
    this.countdownTimer = null;

    this.state = {
      admitted: false,
      memberIndex: -1,
      visitedWorlds: [],
      viewedMediaIds: [],
      drawnBlessings: [],
      blessingHistory: [],
      eggsFound: [],
      reducedMotionPref: false
    };

    this.quizState = { index: 0, score: 0, answered: false };
    this.magazineIndex = 0;
    this.exhibitIndex = 0;
  }

  async init() {
    this.starfield = new CelestialStarfield($('bg-stars'));
    this.starfield.start();

    try {
      const [cfgRes, medRes] = await Promise.all([
        fetch('./config.json'),
        fetch('./media.json')
      ]);
      this.config = await cfgRes.json();
      this.media = await medRes.json();
    } catch (err) {
      $('app').innerHTML = `
        <section class="scene-shell">
          <div class="royal-panel">
            <span class="eyebrow">Archive Recovery</span>
            <h1>The Forever Club</h1>
            <p class="muted">Unable to load local configuration via fetch. Please serve this folder through a local HTTP server or GitHub Pages.</p>
          </div>
        </section>`;
      return;
    }

    this.loadState();
    this.bindChrome();
    this.starfield.pause();
    this.starfield.start();
    this.syncControls();

    // Start at Scene 00 Ticket Printer unless already admitted in this session
    if (this.state.admitted && this.state.memberIndex >= 0) {
      this.renderUniverse();
    } else {
      this.renderTicketPrinter();
    }
  }

  loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem('fc-v4-state') || 'null');
      if (saved && typeof saved === 'object') {
        Object.assign(this.state, saved);
      }
      if (localStorage.getItem('fc-reduced-motion') === '1') {
        this.state.reducedMotionPref = true;
        document.documentElement.classList.add('reduced-motion');
      }
    } catch (_) {}
  }

  saveState() {
    try {
      localStorage.setItem('fc-v4-state', JSON.stringify(this.state));
    } catch (_) {}
  }

  bindChrome() {
    const menu = $('club-menu');
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!$('media-modal').classList.contains('hidden')) this.closeModal();
      else if (menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
      } else if ($('cine-exit')) this.renderUniverse();
    });
    $('btn-home').addEventListener('click', () => {
      this.audio.playChime(587, 0.25);
      this.renderUniverse();
    });
    $('btn-sound').addEventListener('click', () => {
      this.audio.toggleMute();
      this.syncControls();
    });
    $('btn-motion').addEventListener('click', () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.state.reducedMotionPref = !this.state.reducedMotionPref;
      try {
        localStorage.setItem('fc-reduced-motion', this.state.reducedMotionPref ? '1' : '0');
      } catch (_) {}
      document.documentElement.classList.toggle('reduced-motion', this.state.reducedMotionPref);
      this.starfield.pause();
      this.starfield.start();
      this.syncControls();
    });
    $('btn-switch-member').addEventListener('click', () => {
      this.audio.playChime(523, 0.25);
      this.renderIdentitySelection();
    });
    $('btn-replay-ticket').addEventListener('click', () => {
      this.state.admitted = false;
      this.saveState();
      this.renderTicketPrinter();
    });
    $('modal-close').addEventListener('click', () => this.closeModal());
    $('media-modal').addEventListener('click', (e) => {
      if (e.target === $('media-modal')) this.closeModal();
    });
    $('egg-close').addEventListener('click', () => $('egg-toast').classList.add('hidden'));
  }

  syncControls() {
    const soundBtn = $('btn-sound');
    soundBtn.innerHTML = this.audio.muted
      ? `${SVG_ICONS.soundOff}<span>Sound Off</span>`
      : `${SVG_ICONS.soundOn}<span>Sound On</span>`;
    soundBtn.setAttribute('aria-pressed', String(!this.audio.muted));

    const motionBtn = $('btn-motion');
    motionBtn.textContent = isReducedMotion() ? 'Motion: Reduced' : 'Motion: Full';
    motionBtn.setAttribute('aria-pressed', String(isReducedMotion()));
    motionBtn.disabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const member = this.config.members[this.state.memberIndex];
    $('nav-member-badge').textContent = member ? `${member.name} · ${member.cardCode}` : 'Private Collection';
  }

  clearScene() {
    $('club-menu').open = false;
    this.activeCleanup.forEach((fn) => {
      try { fn(); } catch (_) {}
    });
    this.activeCleanup = [];
    if (this.activeVideoController) {
      this.activeVideoController.destroy();
      this.activeVideoController = null;
    }
    if (this.cineTimer) {
      clearInterval(this.cineTimer);
      this.cineTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  setChromeVisible(visible) {
    $('top-bar').classList.toggle('is-hidden', !visible);
  }

  markMediaViewed(id) {
    if (!id) return;
    if (!this.state.viewedMediaIds.includes(id)) {
      this.state.viewedMediaIds.push(id);
      this.saveState();
    }
  }

  unlockEgg(eggId, title, message) {
    if (!this.state.eggsFound.includes(eggId)) {
      this.state.eggsFound.push(eggId);
      this.saveState();
    }
    this.audio.playCrystalRelease();
    $('egg-title').textContent = title;
    $('egg-body').textContent = message;
    $('egg-count').textContent = `${this.state.eggsFound.length} / 4 Celestial Secrets Discovered`;
    $('egg-toast').classList.remove('hidden');
  }

  /* ---------------- MODAL: LIGHTBOX WITH FRONT/BACK FLIP ---------------- */
  openPhotoModal(photoItem, captionOverride = null) {
    this.markMediaViewed(photoItem.id);
    const modal = $('media-modal');
    const stage = $('modal-stage');
    stage.replaceChildren();

    const card = document.createElement('div');
    card.className = 'lightbox-flip-card';
    card.innerHTML = `
      <div class="lightbox-flip-inner">
        <div class="lightbox-face lightbox-front">
          <img src="${resolvePhotoSrc(photoItem)}" alt="${photoItem.label}">
          <div class="lightbox-meta">
            <span>${captionOverride || photoItem.label}</span>
            <button type="button" class="btn-gold-outline flip-toggle-btn">Turn Photo Over</button>
          </div>
        </div>
        <div class="lightbox-face lightbox-back">
          <div class="polaroid-back-paper">
            <span class="eyebrow">The Forever Club · Archive Verso</span>
            <h3>${photoItem.label}</h3>
            <p class="muted">Original Reference: ${photoItem.originalName}</p>
            <p class="verso-note">${captionOverride || 'Preserved in the 2022–2026 Private Collection. No unverified story attached.'}</p>
            <span class="verso-stamp">EST. FOREVER</span>
            <button type="button" class="btn-gold-outline flip-toggle-btn">Return to Front</button>
          </div>
        </div>
      </div>
    `;
    card.querySelectorAll('.flip-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.playPaperUnfold();
        card.classList.toggle('is-flipped');
      });
    });

    stage.appendChild(card);
    modal.classList.remove('hidden');
  }

  openVideoModal(videoItem) {
    this.markMediaViewed(videoItem.id);
    const modal = $('media-modal');
    const stage = $('modal-stage');
    stage.replaceChildren();

    const box = document.createElement('div');
    box.className = 'modal-video-box';
    const playerSlot = document.createElement('div');
    const meta = document.createElement('p');
    meta.className = 'muted';
    meta.textContent = `${videoItem.label} · ${videoItem.originalName}`;
    box.append(playerSlot, meta);
    stage.appendChild(box);

    this.activeVideoController = mountMediaVideo(playerSlot, videoItem, { autoplay: false });
    modal.classList.remove('hidden');
  }

  closeModal() {
    if (this.activeVideoController) {
      this.activeVideoController.destroy();
      this.activeVideoController = null;
    }
    $('media-modal').classList.add('hidden');
    $('modal-stage').replaceChildren();
  }

  /* ---------------- SCENE 00: ROYAL ADMISSION PRINTER ---------------- */
  renderTicketPrinter() {
    this.clearScene();
    this.setChromeVisible(false);

    const app = $('app');
    app.innerHTML = `
      <section class="scene-shell scene-printer">
        <div class="printer-ambient-ring"></div>
        <div class="printer-header">
          <div class="admission-edition"><span>The Forever Club · 2022–2026</span><button type="button" class="btn-link skip-intro-btn" id="skip-intro">Skip Intro</button></div>
          <div class="admission-intro">
            <span class="eyebrow">A graduation invitation</span>
            <h1>Our little <em>universe.</em></h1>
            <p class="subtitle">Four girls, one universe, infinite memories.</p>
          </div>
        </div>

        <div class="royal-printer-stage" id="printer-stage">
          <div class="royal-printer-chassis">
            <div class="printer-crown-crest">${SVG_ICONS.crown}</div>
            <div class="printer-bevel-top"></div>
            <div class="printer-glass-screen">
              <div class="screen-specular"></div>
              <span class="screen-tag">ROYAL PRIVATE COLLECTION</span>
              <p class="screen-status" id="printer-status">Private Invitation</p>
              <div class="screen-progress-track"><span id="printer-progress-fill"></span></div>
            </div>
            <div class="printer-seam"></div>
            <div class="printer-slot-assembly">
              <div class="printer-slot-mouth"></div>
              <div class="printer-slot-glow"></div>
              <div class="ticket-extrude-mask">
                <div class="royal-ticket" id="royal-ticket" role="button" tabindex="0" aria-label="Swipe up or click to collect your royal ticket">
                  <div class="ticket-foil-border">
                    <div class="ticket-top-row">
                      <span>THE FOREVER CLUB</span>
                      <span>2022 — 2026</span>
                    </div>
                    <div class="ticket-center">
                      <span class="ticket-kicker">ROYAL ADMISSION</span>
                      <h2>The Forever Club</h2>
                      <p>Four Girls. One Universe. Infinite Memories.</p>
                    </div>
                    <div class="ticket-perf-line"></div>
                    <div class="ticket-stub">
                      <span>PRIVATE COLLECTION · EST. FOREVER</span>
                      <small>Admission granted to our little universe.</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="printer-contact-shadow"></div>
          </div>

          <div class="ticket-collect-actions is-waiting" id="ticket-actions">
            <p class="muted swipe-cue" id="swipe-cue">Swipe up on the ticket or tap below</p>
            <button type="button" class="btn-gold-primary" id="collect-ticket-btn">Collect Your Ticket</button>
          </div>
        </div>
      </section>
    `;

    const statusEl = $('printer-status');
    const fillEl = $('printer-progress-fill');
    const ticketEl = $('royal-ticket');
    const actionsEl = $('ticket-actions');
    const collectBtn = $('collect-ticket-btn');
    const stageEl = $('printer-stage');

    const reduced = isReducedMotion();
    let readyToCollect = false;
    let collected = false;
    const timers = [];

    const setPhase = (pct, text, step) => {
      if (statusEl) statusEl.textContent = text;
      if (fillEl) fillEl.style.width = `${pct}%`;
      if (step >= 0) this.audio.playPrinterTick(step);
    };

    if (reduced) {
      stageEl.classList.add('is-awake', 'is-printing', 'is-printed');
      setPhase(100, 'Your invitation awaits.', -1);
      actionsEl.classList.remove('is-waiting');
      readyToCollect = true;
    } else {
      timers.push(setTimeout(() => {
        stageEl.classList.add('is-awake');
        setPhase(25, 'Preparing your admission...', 0);
      }, 650));

      timers.push(setTimeout(() => {
        stageEl.classList.add('is-printing');
        setPhase(62, 'Printing your royal ticket...', 1);
      }, 1900));

      timers.push(setTimeout(() => {
        this.audio.playPrinterTick(2);
        setPhase(85, 'Printing your royal ticket...', 2);
      }, 3200));

      timers.push(setTimeout(() => {
        stageEl.classList.add('is-printed');
        setPhase(100, 'Your invitation awaits.', 3);
        actionsEl.classList.remove('is-waiting');
        readyToCollect = true;
      }, 4700));
    }

    const collectTicket = () => {
      if (collected) return;
      collected = true;
      readyToCollect = true;
      this.audio.playTicketCollect();
      stageEl.classList.add('is-collecting');
      timers.push(setTimeout(() => {
        this.state.admitted = true;
        this.saveState();
        this.renderRoyalInvitation();
      }, reduced ? 50 : 720));
    };

    // Swipe-up gesture on the ticket
    let touchStartY = null;
    ticketEl.addEventListener('pointerdown', (e) => {
      if (!readyToCollect || !e.isPrimary) return;
      touchStartY = e.clientY;
      ticketEl.setPointerCapture(e.pointerId);
    });
    ticketEl.addEventListener('pointerup', (e) => {
      if (touchStartY === null || !e.isPrimary) return;
      const travel = touchStartY - e.clientY;
      touchStartY = null;
      if (travel > 28 || Math.abs(travel) < 10) collectTicket();
    });
    ticketEl.addEventListener('pointercancel', () => { touchStartY = null; });
    ticketEl.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && readyToCollect) {
        e.preventDefault();
        collectTicket();
      }
    });
    collectBtn.addEventListener('click', collectTicket);
    $('skip-intro').addEventListener('click', () => {
      this.state.admitted = true;
      this.saveState();
      this.renderRoyalInvitation();
    });

    this.activeCleanup.push(() => timers.forEach(clearTimeout));
  }

  /* ---------------- SCENE 01: ROYAL INVITATION ---------------- */
  renderRoyalInvitation() {
    this.clearScene();
    this.setChromeVisible(false);

    $('app').innerHTML = `
      <section class="scene-shell scene-invitation">
        <span class="eyebrow">Royal Invitation</span>
        <h1 class="display-title">The Forever <em>Club</em></h1>
        <p class="subtitle">Four Girls. One Universe. Infinite Memories.</p>

        <div class="envelope-stage" id="envelope-stage">
          <div class="royal-envelope" id="royal-envelope">
            <div class="env-back"></div>
            <div class="env-letter-card" id="env-letter-card">
              <span class="eyebrow">Royal Charter</span>
              <p>You are cordially invited to</p>
              <h2>The Forever Club</h2>
              <span class="gold-rule"></span>
              <small>Est. Forever · 2022–2026</small>
            </div>
            <div class="env-pocket-left"></div>
            <div class="env-pocket-right"></div>
            <div class="env-pocket-bottom"></div>
            <div class="env-flap"></div>
            <button type="button" class="royal-wax-seal" id="wax-seal-btn" aria-label="Tap royal wax seal to open invitation">
              <span class="wax-rim"></span>
              <span class="wax-glyph">${SVG_ICONS.star}</span>
            </button>
          </div>
          <p class="muted" id="seal-hint">Tap the champagne wax seal to unseal · Hold for a hidden gleam</p>
        </div>

        <button type="button" class="btn-gold-primary hidden" id="enter-identity-btn">Proceed to Identity Stars</button>
      </section>
    `;

    const env = $('royal-envelope');
    const sealBtn = $('wax-seal-btn');
    const proceedBtn = $('enter-identity-btn');
    let opened = false;
    let pressTimer = 0;
    let revealTimer;

    sealBtn.addEventListener('pointerdown', () => {
      pressTimer = setTimeout(() => {
        this.unlockEgg(
          'seal-hold',
          'Secret I: The Royal Seal',
          'You held the champagne wax seal. Four friends, one unspoken promise: no matter the year, the invitation never expires.'
        );
      }, 900);
    });
    const clearPress = () => { if (pressTimer) clearTimeout(pressTimer); };
    sealBtn.addEventListener('pointerup', clearPress);
    sealBtn.addEventListener('pointerleave', clearPress);
    sealBtn.addEventListener('pointercancel', clearPress);

    sealBtn.addEventListener('click', () => {
      if (opened) return;
      opened = true;
      this.audio.playPaperUnfold();
      env.classList.add('is-open');
      $('seal-hint').textContent = 'Invitation unsealed.';
      revealTimer = setTimeout(() => {
        proceedBtn.classList.remove('hidden');
      }, isReducedMotion() ? 50 : 750);
    });

    proceedBtn.addEventListener('click', () => {
      this.audio.playChime(659, 0.3);
      if (this.state.memberIndex >= 0) {
        this.renderMembershipCard(this.state.memberIndex);
      } else {
        this.renderIdentitySelection();
      }
    });

    this.activeCleanup.push(() => {
      clearPress();
      clearTimeout(revealTimer);
    });
  }

  /* ---------------- SCENE 02: IDENTITY SELECTION ---------------- */
  renderIdentitySelection() {
    this.clearScene();
    this.setChromeVisible(this.state.memberIndex >= 0);

    const membersHtml = this.config.members.map((m, idx) => `
      <button type="button" class="identity-star-card" data-member="${idx}">
        <span class="star-orb-badge">${SVG_ICONS.star}</span>
        <strong>${m.name}</strong>
        <small>${m.cardCode} · ${m.constellation}</small>
      </button>
    `).join('');

    $('app').innerHTML = `
      <section class="scene-shell scene-identity">
        <span class="eyebrow">Royal Membership</span>
        <h1>Choose Your Star</h1>
        <p class="subtitle">Select your star to personalize your membership card and cosmic pass.</p>
        <div class="identity-grid">${membersHtml}</div>
        <div id="identity-welcome" class="identity-welcome hidden">
          <h2 id="welcome-line"></h2>
          <p class="muted">Your universe awaits.</p>
          <button type="button" class="btn-gold-primary" id="view-member-card-btn">Reveal Royal Membership Card</button>
        </div>
      </section>
    `;

    let chosenIdx = this.state.memberIndex;
    document.querySelectorAll('.identity-star-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        chosenIdx = Number(btn.dataset.member);
        this.state.memberIndex = chosenIdx;
        this.saveState();
        this.syncControls();
        this.audio.playConstellationStar(chosenIdx);

        document.querySelectorAll('.identity-star-card').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        $('welcome-line').textContent = `Welcome, ${this.config.members[chosenIdx].name}.`;
        $('identity-welcome').classList.remove('hidden');
      });
    });

    $('view-member-card-btn').addEventListener('click', () => {
      this.audio.playChime(784, 0.35);
      this.renderMembershipCard(chosenIdx >= 0 ? chosenIdx : 0);
    });
  }

  /* ---------------- SCENE 03: ROYAL MEMBERSHIP CARD ---------------- */
  renderMembershipCard(memberIdx) {
    this.clearScene();
    this.setChromeVisible(true);
    const member = this.config.members[memberIdx] || this.config.members[0];

    $('app').innerHTML = `
      <section class="scene-shell scene-card">
        <span class="eyebrow">Royal Membership Pass</span>
        <h1>${member.name}</h1>
        <p class="subtitle">Move your finger or cursor across the card to tilt the pearlescent champagne foil.</p>

        <div class="membership-stage">
          <div class="membership-card-3d" id="membership-card">
            <div class="card-foil-sheen" id="card-sheen"></div>
            <div class="card-inner-frame">
              <div class="card-top">
                <span class="card-brand">THE FOREVER CLUB</span>
                <span class="card-crest">${SVG_ICONS.crown}</span>
              </div>
              <div class="card-mid">
                <span class="eyebrow">${member.constellation}</span>
                <h2>${member.name}</h2>
                <span class="card-code">${member.cardCode}</span>
              </div>
              <div class="card-bottom">
                <span>EST. FOREVER</span>
                <span>2022 — 2026</span>
              </div>
            </div>
          </div>
        </div>

        <div class="action-row">
          <button type="button" class="btn-gold-outline" id="download-member-card">Save Card as PNG</button>
          <button type="button" class="btn-gold-primary" id="enter-universe-btn">Enter Memory Orbit</button>
        </div>
      </section>
    `;

    const card = $('membership-card');
    const sheen = $('card-sheen');
    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const rx = (0.5 - py) * 18;
      const ry = (px - 0.5) * 22;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      sheen.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(245,239,230,0.34), rgba(220,196,154,0.14) 35%, transparent 72%)`;
    };
    const onLeave = () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    card.addEventListener('pointercancel', onLeave);
    card.addEventListener('pointerup', onLeave);

    $('download-member-card').addEventListener('click', () => {
      this.audio.playChime(880, 0.28);
      exportMembershipCardPNG(member);
    });
    $('enter-universe-btn').addEventListener('click', () => {
      this.audio.playChime(659, 0.35);
      this.renderUniverse();
    });
  }

  /* ---------------- SCENE 04: MEMORY ORBIT + SIX WORLDS + SPECIAL PORTALS ---------------- */
  renderUniverse() {
    this.clearScene();
    this.setChromeVisible(true);
    this.syncControls();

    const visitedCount = this.state.visitedWorlds.length;
    const totalMedia = this.media.photos.length + this.media.videos.length;
    const viewedCount = this.state.viewedMediaIds.length;
    const allWorldsDone = visitedCount >= 6;

    const planetsHtml = this.config.worlds.map((w) => {
      const done = this.state.visitedWorlds.includes(w.id);
      return `
        <button type="button" class="planet-btn ${done ? 'is-visited' : ''}" data-world="${w.id}" style="left:${w.pos.x}%;top:${w.pos.y}%;--planet-accent:${w.accent}">
          <span class="planet-orb">
            <span class="planet-halo"></span>
            ${WORLD_ICONS[w.id]}
          </span>
          <span class="planet-numeral">${done ? 'Explored' : `World ${w.numeral}`}</span>
          <span class="planet-title">${w.title}</span>
        </button>
      `;
    }).join('');

    $('app').innerHTML = `
      <section class="scene-shell scene-universe">
        <div class="universe-hero-head">
          <span class="eyebrow">The Forever Club · 2022–2026</span>
          <h1>Our Little Universe</h1>
          <p class="subtitle">Follow the memories we made and the stories we’ll take with us.</p>
          <div class="universe-jumps">
            <a href="#worlds">Explore six worlds</a>
            <a href="#keepsakes">More experiences</a>
          </div>
        </div>

        <div class="orbit-container" id="orbit-container" aria-label="3D Memory Orbit with floating Polaroids and champagne gold trails"></div>

        <div class="universe-telemetry">
          <div class="telemetry-pill">
            <span>Worlds Explored</span>
            <strong>${visitedCount} / 6</strong>
          </div>
          <div class="telemetry-pill">
            <span>Archive Plates Viewed</span>
            <strong>${viewedCount} / ${totalMedia}</strong>
          </div>
          <button type="button" class="telemetry-pill telemetry-btn" id="egg-star-tap-btn" title="Tap repeatedly to test starlight resonance">
            <span>Secrets Found</span>
            <strong>${this.state.eggsFound.length} / 4</strong>
          </button>
        </div>

        <div class="worlds-map-section" id="worlds">
          <div class="section-heading">
            <span class="eyebrow">The Six Celestial Worlds</span>
            <h2>Choose Your Orbit</h2>
          </div>
          <div class="planets-map">
            <div class="map-orbit-ring ring-outer"></div>
            <div class="map-orbit-ring ring-inner"></div>
            <button type="button" class="map-core-crest" id="hidden-crown-egg" aria-label="Central Royal Crest">
              ${SVG_ICONS.crown}
              <span>FOREVER</span>
            </button>
            ${planetsHtml}
          </div>
        </div>

        <div class="section-heading" id="keepsakes">
          <h2>Beyond the Six Worlds</h2>
        </div>
        <div class="sanctuary-portals">
          <button type="button" class="portal-card" id="open-crystal-btn">
            <span class="eyebrow">Celestial Artifact</span>
            <h3>The Memory Crystal</h3>
            <p class="muted">Rotate the amethyst facets and draw an unviewed memory from its core.</p>
          </button>
          <button type="button" class="portal-card" id="open-capsule-btn">
            <span class="eyebrow">Locked Until 2030</span>
            <h3>The Time Capsule</h3>
            <p class="muted">Our sealed letter to the future, guarded by a live countdown.</p>
          </button>
          <button type="button" class="portal-card" id="open-cinematic-btn">
            <span class="eyebrow">Fullscreen Exhibition</span>
            <h3>Cinematic Memory Mode</h3>
            <p class="muted">Slow Ken Burns gallery playback across our curated collection.</p>
          </button>
          <button type="button" class="portal-card ${allWorldsDone ? 'is-unlocked' : 'is-locked-preview'}" id="open-constellation-btn">
            <span class="eyebrow">${allWorldsDone ? 'Unlocked · Grand Finale' : `Explore ${6 - visitedCount} more worlds to unlock`}</span>
            <h3>Final Constellation</h3>
            <p class="muted">Connect Kahean, Líng Lëé, Jia Qi & yimin_04 under one timeless sky.</p>
          </button>
        </div>
      </section>
    `;

    const orbitCtrl = mountMemoryOrbit($('orbit-container'), this.media.photos, {
      onSelectPhoto: (photo) => {
        this.audio.playChime(698, 0.25);
        this.openPhotoModal(photo);
      },
      onHiddenOrbitEgg: () => {
        this.unlockEgg(
          'orbit-node',
          'Secret II: The Golden Orbit Node',
          'You noticed the quiet golden bead drifting through our Polaroid orbit — a reminder that small moments shine brightest in hindsight.'
        );
      }
    });
    this.activeCleanup.push(() => orbitCtrl.destroy());

    // Hidden Easter Egg: 5 rapid taps on the star counter
    let starTaps = 0;
    let tapReset = 0;
    $('egg-star-tap-btn').addEventListener('click', () => {
      starTaps++;
      clearTimeout(tapReset);
      tapReset = setTimeout(() => { starTaps = 0; }, 1800);
      this.audio.playConstellationStar(starTaps);
      if (starTaps >= 5) {
        starTaps = 0;
        this.unlockEgg(
          'star-resonance',
          'Secret III: Starlight Resonance',
          'Five taps awakened the archive harmonic: "Four members. One lifetime membership. Absolutely no resignations allowed."'
        );
      }
    });

    // Hidden Easter Egg: central royal crown crest
    let crownTaps = 0;
    $('hidden-crown-egg').addEventListener('click', () => {
      crownTaps++;
      this.audio.playChime(880, 0.25);
      if (crownTaps >= 3) {
        this.unlockEgg(
          'royal-crest',
          'Secret IV: The Hidden Crown Relief',
          'Beneath the central crest lies our permanent motto: Est. 2022 — Forever in Every Era.'
        );
      }
    });

    document.querySelectorAll('.planet-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.enterWorld(btn.dataset.world));
    });

    $('open-crystal-btn').addEventListener('click', () => this.renderMemoryCrystal());
    $('open-capsule-btn').addEventListener('click', () => this.renderTimeCapsule());
    $('open-cinematic-btn').addEventListener('click', () => this.renderCinematicMode());
    $('open-constellation-btn').addEventListener('click', () => {
      if (this.state.visitedWorlds.length < 6) {
        this.audio.playTone(320, 0.2, 'triangle', 0.03);
        const rem = 6 - this.state.visitedWorlds.length;
        $('open-constellation-btn').querySelector('.eyebrow').textContent = `Visit ${rem} more world${rem > 1 ? 's' : ''} first`;
        return;
      }
      this.renderFinalConstellation();
    });
  }

  enterWorld(worldId) {
    if (!this.state.visitedWorlds.includes(worldId)) {
      this.state.visitedWorlds.push(worldId);
      this.saveState();
    }
    this.audio.playChime(587, 0.3);
    const handlers = {
      museum: () => this.renderMemoryMuseum(),
      archives: () => this.renderChaosArchives(),
      cinema: () => this.renderMemoryCinema(),
      ballroom: () => this.renderRoyalBallroom(),
      challenge: () => this.renderFriendshipChallenge(),
      letters: () => this.renderSecretLetters()
    };
    if (handlers[worldId]) handlers[worldId]();
  }

  /* ---------------- WORLD I: MEMORY MUSEUM + INFINITY GALLERY ---------------- */
  renderMemoryMuseum(mode = 'museum') {
    this.clearScene();
    this.setChromeVisible(true);
    const exhibit = this.config.exhibits[this.exhibitIndex] || this.config.exhibits[0];
    const items = exhibit.photoIndices.map((idx) => this.media.photos[idx]).filter(Boolean);

    $('app').innerHTML = `
      <section class="scene-shell scene-museum">
        <div class="world-topbar">
          <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
          <span class="eyebrow">World I · Memory Museum</span>
        </div>
        <h1>Memory Museum</h1>
        <p class="subtitle">${this.config.worlds[0].subtitle}</p>

        <div class="mode-switch-bar">
          <button type="button" class="tab-pill ${mode === 'museum' ? 'is-active' : ''}" id="mode-museum-btn">Royal Exhibition Hall</button>
          <button type="button" class="tab-pill ${mode === 'infinity' ? 'is-active' : ''}" id="mode-infinity-btn">Infinity Gallery (3D Corridor)</button>
        </div>

        <div id="museum-body"></div>
      </section>
    `;

    document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());
    $('mode-museum-btn').addEventListener('click', () => this.renderMemoryMuseum('museum'));
    $('mode-infinity-btn').addEventListener('click', () => this.renderMemoryMuseum('infinity'));

    const body = $('museum-body');
    if (mode === 'museum') {
      const tabs = this.config.exhibits.map((ex, i) => `
        <button type="button" class="tab-pill ${i === this.exhibitIndex ? 'is-active' : ''}" data-ex="${i}">${ex.label}</button>
      `).join('');

      const frames = items.map((p, i) => `
        <button type="button" class="museum-frame ${i % 3 === 0 ? 'frame-tall' : i % 3 === 1 ? 'frame-wide' : 'frame-square'}" data-pid="${p.index}">
          <span class="museum-spotlight"></span>
          <span class="frame-bevel">
            <img loading="lazy" src="${resolveThumbSrc(p)}" alt="${p.label}">
          </span>
          <span class="frame-plaque">EXHIBIT ${String(i + 1).padStart(2, '0')} · ${p.label}</span>
        </button>
      `).join('');

      body.innerHTML = `
        <div class="exhibit-tabs">${tabs}</div>
        <div class="museum-wall">${frames}</div>
      `;

      body.querySelectorAll('[data-ex]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.exhibitIndex = Number(btn.dataset.ex);
          this.audio.playChime(659, 0.2);
          this.renderMemoryMuseum('museum');
        });
      });

      body.querySelectorAll('[data-pid]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = this.media.photos[Number(btn.dataset.pid)];
          if (item) {
            this.audio.playPaperUnfold();
            this.openPhotoModal(item);
          }
        });
      });
    } else {
      // INFINITY GALLERY: Curved 3D Depth Corridor
      const allPhotos = this.media.photos;
      body.innerHTML = `
        <div class="infinity-controls">
          <p class="muted">Swipe or drag horizontally to glide through the curved infinity corridor. Tap any floating frame to step forward.</p>
          <div class="action-row">
            <button type="button" class="btn-gold-outline" id="inf-prev">← Drift Back</button>
            <span class="eyebrow" id="inf-counter">Plate 01 / ${allPhotos.length}</span>
            <button type="button" class="btn-gold-outline" id="inf-next">Drift Forward →</button>
          </div>
        </div>
        <div class="infinity-stage" id="infinity-stage"></div>
      `;

      const stage = $('infinity-stage');
      let focusFloat = 0;
      let targetFloat = 0;
      let dragging = false;
      let moved = false;
      let startX = 0;
      let rafId = 0;
      let destroyed = false;

      const cards = allPhotos.map((p, idx) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'infinity-card';
        el.innerHTML = `
          <span class="infinity-card-bevel">
            <img loading="lazy" src="${resolveThumbSrc(p)}" alt="${p.label}">
            <span class="infinity-plate-label">${p.label}</span>
          </span>
        `;
        el.addEventListener('click', () => {
          if (moved) return;
          if (Math.abs(idx - Math.round(targetFloat)) < 0.6) {
            this.openPhotoModal(p);
          } else {
            targetFloat = idx;
          }
        });
        stage.appendChild(el);
        return el;
      });

      const updateFocusLabel = () => {
        const clamped = ((Math.round(targetFloat) % allPhotos.length) + allPhotos.length) % allPhotos.length;
        const counter = $('inf-counter');
        if (counter) counter.textContent = `Plate ${String(clamped + 1).padStart(2, '0')} / ${allPhotos.length}`;
      };

      stage.addEventListener('pointerdown', (e) => {
        dragging = true;
        moved = false;
        startX = e.clientX;
      });
      const onMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        targetFloat -= dx * 0.014;
        startX = e.clientX;
        updateFocusLabel();
      };
      const onUp = () => {
        dragging = false;
        setTimeout(() => { moved = false; }, 50);
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });

      $('inf-prev').addEventListener('click', () => { targetFloat -= 1; updateFocusLabel(); });
      $('inf-next').addEventListener('click', () => { targetFloat += 1; updateFocusLabel(); });

      const renderLoop = () => {
        if (destroyed) return;
        focusFloat += (targetFloat - focusFloat) * 0.12;
        const total = allPhotos.length;

        cards.forEach((el, idx) => {
          // Wrap circular distance into [-total/2, total/2]
          let delta = ((idx - focusFloat) % total + total) % total;
          if (delta > total / 2) delta -= total;

          const absD = Math.abs(delta);
          if (absD > 5.5) {
            el.style.display = 'none';
            return;
          }
          el.style.display = 'block';
          // Curved spatial corridor math
          const x = Math.sin(delta * 0.42) * 260;
          const z = -absD * 145;
          const y = Math.pow(absD, 1.3) * 8;
          const rotY = -delta * 16;
          const scale = Math.max(0.45, 1 - absD * 0.11);
          const opacity = Math.max(0, 1 - absD * 0.19);
          el.style.zIndex = String(Math.round(100 - absD * 10));
          el.style.opacity = String(opacity);
          el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) scale(${scale})`;
        });

        if (!isReducedMotion() && !document.hidden) {
          rafId = requestAnimationFrame(renderLoop);
        } else {
          setTimeout(() => { if (!destroyed) rafId = requestAnimationFrame(renderLoop); }, 80);
        }
      };

      rafId = requestAnimationFrame(renderLoop);
      this.activeCleanup.push(() => {
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      });
    }
  }

  /* ---------------- WORLD II: CHAOS ARCHIVES (THE FOREVER TIMES) ---------------- */
  renderChaosArchives() {
    this.clearScene();
    this.setChromeVisible(true);
    const stories = this.config.stories;
    const story = stories[this.magazineIndex] || stories[0];
    const photo = this.media.photos[story.photoIndex] || this.media.photos[0];

    $('app').innerHTML = `
      <section class="scene-shell scene-archives">
        <div class="world-topbar">
          <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
          <span class="eyebrow">World II · Chaos Archives</span>
        </div>
        <h1>THE FOREVER TIMES</h1>
        <p class="subtitle">Confidential Edition · Vintage Editorial Spread</p>

        <div class="magazine-spread-stage" id="mag-stage">
          <article class="magazine-page" id="mag-page">
            <div class="mag-masthead">
              <span>THE FOREVER TIMES</span>
              <span>ISSUE ${story.issue} / ${String(stories.length).padStart(2, '0')}</span>
              <span>CONFIDENTIAL</span>
            </div>
            <div class="mag-rule"></div>
            <h2 class="mag-headline">${story.headline}</h2>
            <p class="mag-dek">${story.dek}</p>
            <button type="button" class="mag-photo-btn" id="mag-photo-btn">
              <img src="${resolvePhotoSrc(photo)}" alt="${story.headline}">
              <span class="mag-photo-cap">${photo.label} · Tap to inspect</span>
            </button>
            <div class="mag-footer">
              <span>PRIVATE CIRCULATION · 2022–2026</span>
              <span>PAGE ${Number(story.issue)}</span>
            </div>
            ${!story.mappingConfirmed ? `<p class="mag-verify-note">${story.note}</p>` : ''}
          </article>
        </div>

        <div class="action-row">
          <button type="button" class="btn-gold-outline" id="mag-prev">← Previous Page</button>
          <button type="button" class="btn-gold-outline" id="mag-next">Next Page →</button>
        </div>
      </section>
    `;

    document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());
    $('mag-photo-btn').addEventListener('click', () => {
      this.audio.playPaperUnfold();
      this.openPhotoModal(photo, `${story.headline} — ${story.dek}`);
    });

    let turnTimer;
    const turnPage = (dir) => {
      if (turnTimer) return;
      this.audio.playPaperUnfold();
      const pageEl = $('mag-page');
      pageEl.classList.add(dir > 0 ? 'turning-next' : 'turning-prev');
      turnTimer = setTimeout(() => {
        this.magazineIndex = (this.magazineIndex + dir + stories.length) % stories.length;
        this.renderChaosArchives();
      }, isReducedMotion() ? 20 : 360);
    };

    $('mag-prev').addEventListener('click', () => turnPage(-1));
    $('mag-next').addEventListener('click', () => turnPage(1));

    const stage = $('mag-stage');
    let swipeStart;
    let swiped = false;
    stage.addEventListener('pointerdown', (event) => {
      swipeStart = { x: event.clientX, y: event.clientY };
      swiped = false;
    });
    stage.addEventListener('pointercancel', () => { swipeStart = null; });
    stage.addEventListener('pointerup', (event) => {
      if (!swipeStart) return;
      const dx = event.clientX - swipeStart.x;
      const dy = event.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(dx) <= 45 || Math.abs(dx) <= Math.abs(dy)) return;
      swiped = true;
      turnPage(dx < 0 ? 1 : -1);
    });
    stage.addEventListener('click', (event) => {
      if (swiped && event.detail > 0) event.stopImmediatePropagation();
      swiped = false;
    }, true);
    this.activeCleanup.push(() => clearTimeout(turnTimer));
  }

  /* ---------------- WORLD III: MEMORY CINEMA ---------------- */
  renderMemoryCinema(selectedVideoIdx = -1) {
    this.clearScene();
    this.setChromeVisible(true);
    const videos = this.media.videos;
    const activeVid = selectedVideoIdx >= 0 ? videos[selectedVideoIdx] : null;

    const stubsHtml = videos.map((v, i) => `
      <button type="button" class="cinema-stub ${i === selectedVideoIdx ? 'is-active' : ''}" data-vid="${i}">
        <span class="stub-perf"></span>
        <span class="stub-num">FILM ${String(i + 1).padStart(2, '0')}</span>
        <span class="stub-dur">${v.duration || '00:15'}</span>
      </button>
    `).join('');

    $('app').innerHTML = `
      <section class="scene-shell scene-cinema">
        <div class="world-topbar">
          <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
          <span class="eyebrow">World III · Memory Cinema</span>
        </div>
        <h1>Memory Cinema</h1>
        <p class="subtitle">${this.config.worlds[2].subtitle}</p>

        <div class="cinema-proscenium ${activeVid ? 'curtains-open' : 'curtains-idle'}" id="cinema-proscenium">
          <div class="velvet-curtain curtain-left"></div>
          <div class="velvet-curtain curtain-right"></div>
          <div class="cinema-screen-frame">
            <div id="cinema-player-slot" class="cinema-player-slot">
              ${activeVid ? '' : `
                <div class="cinema-idle-prompt">
                  <span class="eyebrow">Private Screening Room</span>
                  <h2>Select a ticket stub below</h2>
                  <p class="muted">The velvet curtains will part for your chosen reel. Videos load on demand only.</p>
                </div>
              `}
            </div>
          </div>
        </div>

        ${activeVid ? `<p class="cinema-now-showing">Now Screening: ${activeVid.label} · ${activeVid.originalName}</p>` : ''}

        <div class="cinema-stubs-grid">${stubsHtml}</div>
      </section>
    `;

    document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());

    if (activeVid) {
      this.markMediaViewed(activeVid.id);
      this.activeVideoController = mountMediaVideo($('cinema-player-slot'), activeVid, { autoplay: false });
    }

    document.querySelectorAll('[data-vid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.playPaperUnfold();
        this.renderMemoryCinema(Number(btn.dataset.vid));
      });
    });
  }

  /* ---------------- WORLD IV: ROYAL BALLROOM (DESTINY WHEEL ASTROLABE) ---------------- */
  renderRoyalBallroom() {
    this.clearScene();
    this.setChromeVisible(true);
    const blessings = this.config.blessings;
    const remaining = blessings.filter((b) => !this.state.drawnBlessings.includes(b));
    const lastBlessing = this.state.blessingHistory[this.state.blessingHistory.length - 1] || null;
    const member = this.config.members[this.state.memberIndex] || this.config.members[0];

    $('app').innerHTML = `
      <section class="scene-shell scene-ballroom">
        <div class="world-topbar">
          <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
          <span class="eyebrow">World IV · Royal Ballroom</span>
        </div>
        <h1>The Destiny Wheel</h1>
        <p class="subtitle">A precision celestial astrolabe conferring four royal blessings without repetition per round.</p>

        <div class="astrolabe-stage" id="astrolabe-stage">
          <div class="ballroom-spotlight"></div>
          <div class="astrolabe-instrument" id="astrolabe-wheel">
            <div class="astro-ring astro-ring-outer"></div>
            <div class="astro-ring astro-ring-mid"></div>
            <div class="astro-ring astro-ring-inner"></div>
            <div class="astro-ticks"></div>
            <div class="astro-center-gem" id="astro-gem">${SVG_ICONS.crown}</div>
          </div>
          <div class="astro-pointer"></div>
        </div>

        <div class="blessing-reveal-panel">
          <span class="eyebrow">Conferred Blessing</span>
          <h2 id="blessing-result">${lastBlessing || 'Your destiny awaits'}</h2>
          <p class="muted" id="blessing-remaining">${remaining.length} of ${blessings.length} blessings remaining this round</p>
          <div class="action-row">
            <button type="button" class="btn-gold-primary" id="spin-wheel-btn">${remaining.length ? 'Consult the Astrolabe' : 'Round Complete'}</button>
            <button type="button" class="btn-gold-outline" id="reset-wheel-btn">New Round</button>
            <button type="button" class="btn-gold-outline ${lastBlessing ? '' : 'hidden'}" id="export-blessing-btn">Save Blessing PNG</button>
          </div>
          ${this.state.blessingHistory.length ? `
            <div class="blessing-log">
              <span class="eyebrow">Recorded Blessings</span>
              <ul>${this.state.blessingHistory.map((b) => `<li>${b}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
      </section>
    `;

    document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());

    let spinning = false;
    let currentDeg = 0;
    let spinTimer;
    let tickInt;
    this.activeCleanup.push(() => {
      clearInterval(tickInt);
      clearTimeout(spinTimer);
    });

    $('spin-wheel-btn').addEventListener('click', () => {
      if (spinning) return;
      const pool = blessings.filter((b) => !this.state.drawnBlessings.includes(b));
      if (!pool.length) {
        $('blessing-result').textContent = 'All four blessings revealed. Begin a new round below.';
        return;
      }

      spinning = true;
      $('spin-wheel-btn').disabled = true;
      $('blessing-result').textContent = 'Aligning the celestial rings...';

      const rand = new Uint32Array(1);
      crypto.getRandomValues(rand);
      const picked = pool[rand[0] % pool.length];

      const wheel = $('astrolabe-wheel');
      currentDeg += 1080 + (rand[0] % 360);
      wheel.style.transform = `rotate(${currentDeg}deg)`;

      let tickCount = 0;
      tickInt = setInterval(() => {
        tickCount++;
        this.audio.playWheelTick();
        if (tickCount >= 9) clearInterval(tickInt);
      }, 180);

      spinTimer = setTimeout(() => {
        clearInterval(tickInt);
        this.state.drawnBlessings.push(picked);
        this.state.blessingHistory.push(picked);
        this.saveState();
        this.audio.playConstellationStar(2);
        spinning = false;
        this.renderRoyalBallroom();
      }, isReducedMotion() ? 220 : 2100);
    });

    $('reset-wheel-btn').addEventListener('click', () => {
      this.state.drawnBlessings = [];
      this.saveState();
      this.audio.playChime(523, 0.25);
      this.renderRoyalBallroom();
    });

    $('export-blessing-btn').addEventListener('click', () => {
      const target = this.state.blessingHistory[this.state.blessingHistory.length - 1];
      if (target) {
        this.audio.playChime(880, 0.28);
        exportBlessingCardPNG(target, member.name);
      }
    });
  }

  /* ---------------- WORLD V: FRIENDSHIP CHALLENGE ---------------- */
  renderFriendshipChallenge() {
    this.clearScene();
    this.setChromeVisible(true);
    const qs = this.config.quiz;

    if (this.quizState.index >= qs.length) {
      $('app').innerHTML = `
        <section class="scene-shell scene-challenge">
          <div class="world-topbar">
            <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
            <span class="eyebrow">World V · Friendship Challenge</span>
          </div>
          <div class="royal-panel">
            <span class="eyebrow">Oracle Summary</span>
            <h1>${this.quizState.score} / ${qs.length}</h1>
            <p class="subtitle">Different answers, the exact same four-person universe.</p>
            <button type="button" class="btn-gold-primary" id="quiz-retry-btn">Shuffle & Play Again</button>
          </div>
        </section>
      `;
      document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());
      $('quiz-retry-btn').addEventListener('click', () => {
        this.quizState = { index: 0, score: 0, answered: false };
        this.audio.playPaperUnfold();
        this.renderFriendshipChallenge();
      });
      return;
    }

    const q = qs[this.quizState.index];
    const photo = this.media.photos[q.photoIndex] || this.media.photos[0];
    this.quizState.answered = false;

    $('app').innerHTML = `
      <section class="scene-shell scene-challenge">
        <div class="world-topbar">
          <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
          <span class="eyebrow">World V · Friendship Challenge</span>
        </div>
        <h1>Friendship Challenge</h1>
        <p class="subtitle">Card ${this.quizState.index + 1} of ${qs.length} · Score: ${this.quizState.score}</p>

        <div class="oracle-deck-wrap">
          <div class="oracle-card-3d" id="oracle-card">
            <div class="oracle-card-inner">
              <div class="oracle-face oracle-front">
                <span class="eyebrow">Memory Card 0${this.quizState.index + 1}</span>
                <h2>${q.question}</h2>
                <div class="quiz-options">
                  ${q.options.map((opt, idx) => `<button type="button" class="quiz-opt-btn" data-opt="${idx}">${opt}</button>`).join('')}
                </div>
                ${!q.confirmed ? `<p class="muted quiz-verify-note">${q.verificationNote}</p>` : ''}
              </div>
              <div class="oracle-face oracle-back" inert>
                <span class="eyebrow" id="oracle-verdict">Revealed</span>
                <h3 id="oracle-answer"></h3>
                <img src="${resolvePhotoSrc(photo)}" alt="${photo.label}" class="quiz-reveal-img">
                <button type="button" class="btn-gold-primary" id="quiz-next-btn">Next Card →</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());

    document.querySelectorAll('.quiz-opt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.quizState.answered) return;
        this.quizState.answered = true;
        const pick = Number(btn.dataset.opt);
        const correct = pick === q.correctIndex;
        if (correct) {
          this.quizState.score++;
          this.audio.playConstellationStar(3);
        } else {
          this.audio.playPaperUnfold();
        }
        this.markMediaViewed(photo.id);
        $('oracle-verdict').textContent = correct ? 'Aligned · Correct' : 'Archive Answer';
        $('oracle-answer').textContent = q.options[q.correctIndex];
        $('oracle-card').classList.add('is-flipped');
        document.querySelector('.oracle-front').inert = true;
        document.querySelector('.oracle-back').inert = false;
        $('quiz-next-btn').focus({ preventScroll: true });
      });
    });

    $('quiz-next-btn').addEventListener('click', () => {
      this.quizState.index++;
      this.renderFriendshipChallenge();
    });
  }

  /* ---------------- WORLD VI: SECRET LETTERS ---------------- */
  renderSecretLetters(openIdx = -1) {
    this.clearScene();
    this.setChromeVisible(true);
    const letters = this.config.secretLetters;

    if (openIdx >= 0 && letters[openIdx]) {
      const ltr = letters[openIdx];
      const photo = this.media.photos[ltr.photoIndex] || this.media.photos[0];
      this.markMediaViewed(photo.id);

      $('app').innerHTML = `
        <section class="scene-shell scene-letters">
          <div class="world-topbar">
            <button type="button" class="btn-link" id="seal-letter-back">← Seal Letter</button>
            <span class="eyebrow">World VI · Secret Letters</span>
          </div>

          <article class="letter-parchment">
            <div class="parchment-head">
              <span class="eyebrow">Private Seal · To ${ltr.recipientName}</span>
              <span class="parchment-monogram">${ltr.monogram}</span>
            </div>
            <p class="letter-typewriter" id="letter-typewriter"></p>
            <div class="letter-attached-photo">
              <img src="${resolvePhotoSrc(photo)}" alt="${photo.label}">
              <span class="muted">${photo.label}</span>
            </div>
            ${ltr.isDraft ? `<p class="muted draft-notice">${ltr.draftLabel}</p>` : ''}
          </article>
        </section>
      `;

      $('seal-letter-back').addEventListener('click', () => {
        this.audio.playPaperUnfold();
        this.renderSecretLetters(-1);
      });

      const targetEl = $('letter-typewriter');
      if (isReducedMotion()) {
        targetEl.textContent = ltr.body;
      } else {
        let pos = 0;
        const iv = setInterval(() => {
          pos += 4;
          targetEl.textContent = ltr.body.slice(0, pos);
          if (pos >= ltr.body.length) clearInterval(iv);
        }, 16);
        this.activeCleanup.push(() => clearInterval(iv));
      }
      return;
    }

    const envelopes = letters.map((l, idx) => `
      <button type="button" class="letter-envelope-card" data-ltr="${idx}">
        <span class="mini-wax-seal">${l.monogram}</span>
        <strong>For ${l.recipientName}</strong>
        <small>${l.draftLabel}</small>
      </button>
    `).join('');

    $('app').innerHTML = `
      <section class="scene-shell scene-letters">
        <div class="world-topbar">
          <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
          <span class="eyebrow">World VI · Secret Letters</span>
        </div>
        <h1>Secret Letters</h1>
        <p class="subtitle">Three wax-sealed letters prepared for Líng Lëé, Jia Qi, and yimin_04.</p>
        <div class="letters-trio-grid">${envelopes}</div>
      </section>
    `;

    document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());
    document.querySelectorAll('[data-ltr]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.playPaperUnfold();
        this.renderSecretLetters(Number(btn.dataset.ltr));
      });
    });
  }

  /* ---------------- THE MEMORY CRYSTAL ---------------- */
  renderMemoryCrystal() {
    this.clearScene();
    this.setChromeVisible(true);

    const releaseMemory = () => {
      this.audio.playCrystalRelease();
      const pool = [
        ...this.media.photos.map((p) => ({ kind: 'photo', item: p })),
        ...this.media.videos.map((v) => ({ kind: 'video', item: v }))
      ];
      const unviewed = pool.filter((entry) => !this.state.viewedMediaIds.includes(entry.item.id));
      const candidates = unviewed.length ? unviewed : pool;
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      if (!chosen) return;

      const slot = $('crystal-release-slot');
      slot.classList.remove('hidden');
      slot.classList.add('is-emerging');
      if (chosen.kind === 'photo') {
        this.markMediaViewed(chosen.item.id);
        slot.innerHTML = `
          <span class="eyebrow">Released From the Amethyst Core</span>
          <div class="crystal-memory-frame">
            <img src="${resolvePhotoSrc(chosen.item)}" alt="${chosen.item.label}">
            <p>${chosen.item.label}</p>
          </div>
          <div class="action-row">
            <button type="button" class="btn-gold-outline" id="crystal-inspect-btn">Inspect Fullscreen</button>
            <button type="button" class="btn-gold-primary" id="crystal-next-btn">Release Another Memory</button>
          </div>
        `;
        $('crystal-inspect-btn').addEventListener('click', () => this.openPhotoModal(chosen.item));
        $('crystal-next-btn').addEventListener('click', releaseMemory);
      } else {
        this.markMediaViewed(chosen.item.id);
        slot.innerHTML = `
          <span class="eyebrow">Film Reel Released From Core</span>
          <div class="crystal-memory-frame">
            <img src="${resolvePosterSrc(chosen.item)}" alt="${chosen.item.label}">
            <p>${chosen.item.label} (${chosen.item.duration})</p>
          </div>
          <div class="action-row">
            <button type="button" class="btn-gold-outline" id="crystal-play-btn">Play Film</button>
            <button type="button" class="btn-gold-primary" id="crystal-next-btn">Release Another Memory</button>
          </div>
        `;
        $('crystal-play-btn').addEventListener('click', () => this.openVideoModal(chosen.item));
        $('crystal-next-btn').addEventListener('click', releaseMemory);
      }
    };

    $('app').innerHTML = `
      <section class="scene-shell scene-crystal">
        <div class="world-topbar">
          <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
          <span class="eyebrow">Celestial Artifact</span>
        </div>
        <h1>The Memory Crystal</h1>
        <p class="subtitle">An interactive amethyst prism cradling unviewed moments inside its core.</p>
        <div id="crystal-mount"></div>
        <button type="button" class="btn-gold-primary" id="crystal-draw-btn">Draw a Memory</button>
        <div id="crystal-release-slot" class="crystal-release-slot hidden"></div>
      </section>
    `;

    document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());
    $('crystal-draw-btn').addEventListener('click', releaseMemory);
    const ctrl = mountMemoryCrystal($('crystal-mount'), { onReleaseMemory: releaseMemory });
    this.activeCleanup.push(() => ctrl.destroy());
  }

  /* ---------------- THE TIME CAPSULE ---------------- */
  renderTimeCapsule() {
    this.clearScene();
    this.setChromeVisible(true);
    const cap = this.config.timeCapsule;

    $('app').innerHTML = `
      <section class="scene-shell scene-capsule">
        <div class="world-topbar">
          <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
          <span class="eyebrow">Future Time Capsule</span>
        </div>
        <h1>The Royal Time Capsule</h1>
        <p class="subtitle">Sealed in crystal glass with a ceremonial champagne-gold lock.</p>

        <div class="capsule-vessel" id="capsule-vessel">
          <div class="capsule-dome">
            <div class="capsule-lock-crest">${SVG_ICONS.crown}</div>
            <span class="eyebrow" id="capsule-status-tag">SEALED ARCHIVE</span>
            <div class="countdown-grid" id="countdown-grid">
              <div><strong id="cd-days">0</strong><span>Days</span></div>
              <div><strong id="cd-hours">00</strong><span>Hours</span></div>
              <div><strong id="cd-mins">00</strong><span>Mins</span></div>
              <div><strong id="cd-secs">00</strong><span>Secs</span></div>
            </div>
            <p class="muted">${cap.dateNote}</p>
            <button type="button" class="btn-gold-outline" id="preview-unlock-btn">Preview Unlock Ceremony</button>
          </div>

          <article class="capsule-letter hidden" id="capsule-letter">
            <span class="eyebrow">Joint Letter · Unlocked</span>
            <h2>${cap.letterTitle}</h2>
            <p class="letter-body">${cap.letterBody}</p>
          </article>
        </div>
      </section>
    `;

    document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());

    const targetMs = new Date(cap.unlockDate).getTime();
    const updateCountdown = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        $('capsule-status-tag').textContent = 'UNLOCKED';
        $('capsule-vessel').classList.add('is-unlocked');
        $('capsule-letter').classList.remove('hidden');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      $('cd-days').textContent = String(d);
      $('cd-hours').textContent = String(h).padStart(2, '0');
      $('cd-mins').textContent = String(m).padStart(2, '0');
      $('cd-secs').textContent = String(s).padStart(2, '0');
    };
    updateCountdown();
    this.countdownTimer = setInterval(updateCountdown, 1000);

    $('preview-unlock-btn').addEventListener('click', () => {
      this.audio.playCrystalRelease();
      $('capsule-status-tag').textContent = 'CEREMONIAL PREVIEW UNLOCKED';
      $('capsule-vessel').classList.add('is-unlocked');
      $('capsule-letter').classList.remove('hidden');
    });
  }

  /* ---------------- CINEMATIC MEMORY MODE (KEN BURNS) ---------------- */
  renderCinematicMode() {
    this.clearScene();
    this.setChromeVisible(false);
    const items = this.media.photos;
    let idx = 0;
    let paused = isReducedMotion();

    $('app').innerHTML = `
      <section class="cinematic-overlay">
        <div class="cinematic-frame">
          <img id="cine-img" class="cine-ken-burns" src="" alt="Cinematic memory">
          <div class="cinematic-vignette"></div>
          <div class="cinematic-caption">
            <span class="eyebrow">Cinematic Memory Mode · The Forever Club</span>
            <h2 id="cine-title"></h2>
          </div>
        </div>
        <div class="cinematic-bar">
          <button type="button" class="btn-gold-outline" id="cine-prev">← Previous</button>
          <button type="button" class="btn-gold-outline" id="cine-toggle">${paused ? 'Resume' : 'Pause'}</button>
          <button type="button" class="btn-gold-outline" id="cine-next">Next →</button>
          <button type="button" class="btn-gold-primary" id="cine-exit">Exit Cinema</button>
        </div>
      </section>
    `;

    const showSlide = (i) => {
      idx = ((i % items.length) + items.length) % items.length;
      const item = items[idx];
      this.markMediaViewed(item.id);
      const img = $('cine-img');
      img.classList.remove('cine-ken-burns');
      void img.offsetWidth;
      img.src = resolvePhotoSrc(item);
      if (!isReducedMotion()) img.classList.add('cine-ken-burns');
      $('cine-title').textContent = `${item.label} (${idx + 1} / ${items.length})`;
    };

    showSlide(0);
    this.cineTimer = setInterval(() => {
      if (!paused) showSlide(idx + 1);
    }, 4500);

    $('cine-prev').addEventListener('click', () => showSlide(idx - 1));
    $('cine-next').addEventListener('click', () => showSlide(idx + 1));
    $('cine-toggle').addEventListener('click', () => {
      paused = !paused;
      $('cine-toggle').textContent = paused ? 'Resume' : 'Pause';
    });
    $('cine-exit').addEventListener('click', () => this.renderUniverse());
  }

  /* ---------------- FINAL CONSTELLATION ---------------- */
  renderFinalConstellation() {
    this.clearScene();
    this.setChromeVisible(true);

    $('app').innerHTML = `
      <section class="scene-shell scene-constellation">
        <div class="world-topbar">
          <button type="button" class="btn-link back-orbit-btn">← Return to Universe</button>
          <span class="eyebrow">Graduation Finale</span>
        </div>
        <h1>Our Forever Constellation</h1>
        <p class="subtitle" id="constellation-prompt">Tap each of the four stars to weave our constellation.</p>

        <div id="constellation-mount"></div>

        <div class="constellation-epilogue hidden" id="constellation-epilogue">
          <div class="epilogue-poem">
            ${this.config.finale.poemLines.map((l, i) => `<p class="${i === 4 ? 'poem-signature' : ''}">${l}</p>`).join('')}
          </div>
          <div class="action-row">
            <button type="button" class="btn-gold-primary" id="save-constellation-png">Save Constellation PNG</button>
            <button type="button" class="btn-gold-outline" id="replay-constellation-btn">Replay Constellation</button>
            <button type="button" class="btn-gold-outline" id="constellation-return-btn">Return to Universe</button>
          </div>
        </div>
      </section>
    `;

    document.querySelector('.back-orbit-btn').addEventListener('click', () => this.renderUniverse());
    let epilogueTimer;
    const ctrl = mountConstellationCanvas($('constellation-mount'), this.config.members, {
      onStarLit: (idx, count) => {
        this.audio.playConstellationStar(idx);
        $('constellation-prompt').textContent = count < 4
          ? `${count} / 4 stars ignited — tap the remaining stars.`
          : 'All four stars aligned under one sky.';
      },
      onAllLit: () => {
        this.audio.playFinaleChord();
        epilogueTimer = setTimeout(() => {
          $('constellation-epilogue').classList.remove('hidden');
        }, isReducedMotion() ? 0 : 450);
      }
    });
    this.activeCleanup.push(() => {
      clearTimeout(epilogueTimer);
      ctrl.destroy();
    });

    $('save-constellation-png').addEventListener('click', () => {
      this.audio.playChime(880, 0.3);
      exportConstellationCardPNG(this.config.members, this.config.finale.poemLines);
    });
    $('replay-constellation-btn').addEventListener('click', () => {
      $('constellation-epilogue').classList.add('hidden');
      $('constellation-prompt').textContent = 'Tap each of the four stars to weave our constellation.';
      ctrl.reset();
    });
    $('constellation-return-btn').addEventListener('click', () => this.renderUniverse());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new ForeverClubApp();
  app.init();
});
