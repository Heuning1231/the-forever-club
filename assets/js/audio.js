/* The Forever Club — Procedural Web Audio SFX Engine (No external audio files required) */
export class RoyalAudio {
  constructor() {
    this.ctx = null;
    this.interacted = false;
    const unlock = (event) => {
      if (!event.isTrusted || event.key === 'Escape') return;
      this.interacted = true;
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      window.removeEventListener('pointerup', unlock, true);
      this._ensure();
    };
    window.addEventListener('click', unlock, true);
    window.addEventListener('keydown', unlock, true);
    window.addEventListener('pointerup', unlock, true);
    this.muted = false;
    try {
      this.muted = localStorage.getItem('fc-sound-muted') === '1';
    } catch (_) {}
  }

  _ensure() {
    if (this.muted || !this.interacted) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try {
        this.ctx = new Ctx();
      } catch (_) {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('fc-sound-muted', this.muted ? '1' : '0');
    } catch (_) {}
    if (!this.muted) this.playChime(660, 0.12);
    return this.muted;
  }

  playTone(freq = 528, duration = 0.16, type = 'sine', gainVal = 0.045, delay = 0) {
    const ctx = this._ensure();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (_) {}
  }

  playChime(base = 587.33, dur = 0.45) {
    this.playTone(base, dur, 'sine', 0.04, 0);
    this.playTone(base * 1.5, dur * 0.9, 'triangle', 0.022, 0.04);
  }

  playPrinterTick(step = 0) {
    const ctx = this._ensure();
    if (!ctx) return;
    this.playTone(190 + (step % 4) * 28, 0.045, 'triangle', 0.018);
    this.playTone(980 + (step % 3) * 110, 0.025, 'sine', 0.009, 0.01);
  }

  playTicketCollect() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.playTone(f, 0.55, 'sine', 0.032, i * 0.065);
    });
  }

  playPaperUnfold() {
    const ctx = this._ensure();
    if (!ctx) return;
    try {
      const len = Math.floor(ctx.sampleRate * 0.24);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.45));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 1.6;
      const gain = ctx.createGain();
      gain.gain.value = 0.045;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (_) {}
    this.playTone(440, 0.25, 'sine', 0.025, 0.05);
  }

  playCrystalRelease() {
    [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => {
      this.playTone(f, 0.65, 'sine', 0.026, i * 0.05);
    });
  }

  playWheelTick() {
    this.playTone(720, 0.035, 'triangle', 0.022);
  }

  playConstellationStar(index = 0) {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const f = notes[index % notes.length];
    this.playTone(f, 0.8, 'sine', 0.045);
    this.playTone(f * 2, 0.5, 'sine', 0.015, 0.05);
  }

  playFinaleChord() {
    [261.63, 392.0, 493.88, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.playTone(f, 1.6, 'sine', 0.03, i * 0.08);
    });
  }
}
