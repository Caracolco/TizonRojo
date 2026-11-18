import { STORAGE_KEYS } from '../../config/game';

type Wave = OscillatorType;
const midi = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);

interface Prefs { music: boolean; sfx: boolean }

/**
 * Audio 100% sintetizado con Web Audio API (sin archivos): efectos y música original.
 * La música y los efectos se pueden silenciar de forma independiente.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private sfxGain!: GainNode;
  private noise!: AudioBuffer;
  prefs: Prefs = { music: true, sfx: true };

  private musicOn = false;
  private intensity = 0;
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.audio);
      if (raw) this.prefs = { ...this.prefs, ...JSON.parse(raw) };
    } catch { /* almacenamiento no disponible */ }
  }

  /** Debe llamarse dentro de un gesto del usuario (toque/click/tecla). */
  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.applyPrefs();
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private applyPrefs(): void {
    if (!this.ctx) return;
    this.musicGain.gain.value = this.prefs.music ? 0.32 : 0;
    this.sfxGain.gain.value = this.prefs.sfx ? 0.8 : 0;
    try { localStorage.setItem(STORAGE_KEYS.audio, JSON.stringify(this.prefs)); } catch { /* ignorar */ }
  }

  toggleMusic(): boolean { this.prefs.music = !this.prefs.music; this.applyPrefs(); this.persist(); return this.prefs.music; }
  toggleSfx(): boolean { this.prefs.sfx = !this.prefs.sfx; this.applyPrefs(); this.persist(); return this.prefs.sfx; }
  private persist(): void { try { localStorage.setItem(STORAGE_KEYS.audio, JSON.stringify(this.prefs)); } catch { /* ignorar */ } }

  suspend(): void { if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend(); }
  resume(): void { if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume(); }

  // ───────────────────────── primitivas ─────────────────────────
  private tone(freq: number, dur: number, opts: { type?: Wave; vol?: number; at?: number; slideTo?: number; dest?: AudioNode; attack?: number; detune?: number } = {}): void {
    if (!this.ctx) return;
    const t0 = opts.at ?? this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = opts.type ?? 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (opts.detune) o.detune.value = opts.detune;
    if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(opts.slideTo, 20), t0 + dur);
    const vol = opts.vol ?? 0.25;
    const a = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(opts.dest ?? this.sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private noiseHit(dur: number, vol: number, at: number, hp: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.02);
  }

  // ───────────────────────── efectos ─────────────────────────
  private fx(fn: () => void): void { if (this.ctx && this.prefs.sfx) fn(); }

  click(): void { this.fx(() => this.tone(660, 0.07, { type: 'square', vol: 0.18 })); }

  start(): void {
    this.fx(() => {
      const t = this.ctx!.currentTime;
      [57, 60, 64, 69, 72].forEach((n, i) => this.tone(midi(n), 0.16, { at: t + i * 0.07, vol: 0.22 }));
    });
  }

  countdown(last: boolean): void {
    this.fx(() => this.tone(last ? 880 : 520, last ? 0.35 : 0.14, { type: 'square', vol: 0.22 }));
  }

  private altCollect = false;
  collect(): void {
    this.fx(() => {
      this.altCollect = !this.altCollect;
      this.tone(this.altCollect ? 880 : 1175, 0.07, { type: 'triangle', vol: 0.2, slideTo: this.altCollect ? 990 : 1320 });
    });
  }

  regen(): void {
    this.fx(() => {
      const t = this.ctx!.currentTime;
      [72, 76, 79, 84].forEach((n, i) => this.tone(midi(n), 0.12, { at: t + i * 0.05, type: 'triangle', vol: 0.2 }));
    });
  }

  cookie(): void {
    this.fx(() => {
      const t = this.ctx!.currentTime;
      this.tone(220, 0.5, { type: 'sawtooth', vol: 0.18, slideTo: 880 });
      [64, 67, 71, 76, 79].forEach((n, i) => this.tone(midi(n), 0.2, { at: t + 0.05 + i * 0.06, type: 'square', vol: 0.16 }));
    });
  }

  neutralize(combo: number): void {
    this.fx(() => {
      const t = this.ctx!.currentTime;
      const base = 400 + combo * 120;
      this.tone(base, 0.22, { type: 'square', vol: 0.22, slideTo: base * 3 });
      this.noiseHit(0.12, 0.25, t, 2500, this.sfxGain);
      this.tone(base * 1.5, 0.16, { at: t + 0.1, type: 'triangle', vol: 0.2 });
    });
  }

  warning(): void { this.fx(() => this.tone(1500, 0.05, { type: 'square', vol: 0.1 })); }

  enemyBack(): void { this.fx(() => this.tone(300, 0.2, { type: 'triangle', vol: 0.12, slideTo: 600 })); }

  lose(): void {
    this.fx(() => {
      const t = this.ctx!.currentTime;
      this.tone(520, 1.1, { type: 'sawtooth', vol: 0.28, slideTo: 50 });
      this.tone(260, 1.1, { type: 'square', vol: 0.18, slideTo: 40, detune: 20 });
      this.noiseHit(0.5, 0.35, t, 600, this.sfxGain);
      this.noiseHit(0.8, 0.2, t + 0.4, 300, this.sfxGain);
    });
  }

  phase(): void {
    this.fx(() => {
      const t = this.ctx!.currentTime;
      this.tone(midi(69), 0.12, { at: t, vol: 0.24 });
      this.tone(midi(76), 0.12, { at: t + 0.14, vol: 0.24 });
      this.tone(midi(81), 0.24, { at: t + 0.28, vol: 0.24 });
    });
  }

  hell(): void {
    this.fx(() => {
      const t = this.ctx!.currentTime;
      this.tone(55, 1.6, { type: 'sawtooth', vol: 0.4, slideTo: 110 });
      this.tone(82, 1.6, { type: 'sawtooth', vol: 0.3, slideTo: 164, detune: 15 });
      for (let i = 0; i < 4; i++) this.tone(midi(69), 0.18, { at: t + i * 0.3, type: 'square', vol: 0.2, slideTo: midi(81) });
      this.noiseHit(1.2, 0.18, t, 200, this.sfxGain);
    });
  }

  win(): void {
    this.fx(() => {
      const t = this.ctx!.currentTime;
      const seq = [60, 64, 67, 72, 67, 72, 76, 79, 84];
      seq.forEach((n, i) => this.tone(midi(n), 0.2, { at: t + i * 0.1, type: 'square', vol: 0.22 }));
      [48, 55, 60].forEach((n) => this.tone(midi(n), 1.2, { at: t + 0.9, type: 'triangle', vol: 0.25 }));
      [72, 76, 79, 84].forEach((n) => this.tone(midi(n), 1.2, { at: t + 0.9, type: 'square', vol: 0.12 }));
    });
  }

  // ───────────────────────── música ─────────────────────────
  private static readonly ROOTS = [45, 41, 43, 40];
  private static readonly ARP = [[57, 60, 64, 60], [53, 57, 60, 57], [55, 59, 62, 59], [52, 56, 59, 56]];
  private static readonly LEAD = [
    [76, -1, 72, 76, 79, -1, 76, 72],
    [77, -1, 72, 77, 81, -1, 77, 72],
    [74, -1, 71, 74, 79, -1, 74, 71],
    [76, 75, 76, 80, 83, -1, 80, 76],
  ];

  startMusic(): void {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stopMusic(): void {
    this.musicOn = false;
    if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
  }

  /** 0: calma, 1: media, 2: alta, 3: infierno. */
  setIntensity(level: number): void { this.intensity = level; }

  private bpm(): number { return [108, 120, 132, 154][this.intensity] ?? 108; }

  private schedule(): void {
    if (!this.ctx || !this.musicOn) return;
    const stepDur = 60 / this.bpm() / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(step: number, at: number, dur: number): void {
    const bar = (step >> 4) & 3;
    const s = step & 15;
    const root = AudioManager.ROOTS[bar];
    const dest = this.musicGain;
    const lvl = this.intensity;

    // bajo
    if (s % 4 === 0 || (lvl >= 2 && s % 4 === 2)) {
      const n = lvl >= 3 && s % 8 === 6 ? root + 12 : root;
      this.tone(midi(n), dur * 3.2, { type: 'triangle', vol: 0.5, at, dest });
    }
    // arpegio
    if (s % 2 === 0 || lvl >= 2) {
      const chord = AudioManager.ARP[bar];
      this.tone(midi(chord[(s >> 1) % 4] + (lvl >= 3 ? 12 : 0)), dur * 1.6, { type: 'square', vol: lvl >= 1 ? 0.13 : 0.1, at, dest });
    }
    // percusión
    if (lvl >= 1 && s % 8 === 0) this.kick(at, dest);
    if (lvl >= 2 && s % 4 === 0) this.kick(at, dest);
    if (lvl >= 1 && s % 8 === 4) this.noiseHit(0.12, 0.3, at, 1500, dest);
    if (lvl >= 1 && s % 2 === 1) this.noiseHit(0.04, lvl >= 3 ? 0.2 : 0.1, at, 7000, dest);
    // melodía (solo fases altas)
    if (lvl >= 2 && s % 2 === 0) {
      const n = AudioManager.LEAD[bar][s >> 1];
      if (n > 0) this.tone(midi(n), dur * 3, { type: 'sawtooth', vol: lvl >= 3 ? 0.14 : 0.08, at, dest, detune: lvl >= 3 ? 8 : 0 });
    }
    // sirena de infierno
    if (lvl >= 3 && s === 0) this.tone(midi(81), dur * 14, { type: 'sawtooth', vol: 0.05, at, dest, slideTo: midi(75), attack: 0.3 });
  }

  private kick(at: number, dest: AudioNode): void {
    this.tone(150, 0.14, { type: 'sine', vol: 0.7, at, dest, slideTo: 40 });
  }
}

export const audio = new AudioManager();
