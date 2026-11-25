import { Injectable, signal } from '@angular/core';
import { persisted } from '../core/store';

/**
 * Procedural Background Music & Synthesized Game Show Sound Effects.
 * 100% Web Audio API — zero external mp3 files required, works offline anywhere.
 *
 * Music styles (host can cycle them with the 🎶 button):
 *   groove – upbeat Party Groove (kick, claps, hats, bassline, chord stabs, plucky arpeggio)
 *   arcade – Retro Arcade chiptune (square-wave lead + bouncy bass)
 *   chill  – the original soft Chill Lounge pads
 */
export type BgmStyle = 'groove' | 'arcade' | 'chill';
export const BGM_STYLES: { id: BgmStyle; label: string; icon: string }[] = [
  { id: 'groove', label: 'Party Groove', icon: '🪩' },
  { id: 'arcade', label: 'Retro Arcade', icon: '🕹️' },
  { id: 'chill', label: 'Chill Lounge', icon: '🌴' },
];

@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly muted = persisted<boolean>('muted', false);
  readonly bgmMuted = persisted<boolean>('bgmMuted', false);
  readonly bgmStyle = persisted<BgmStyle>('bgmStyle', 'groove');
  private ctx?: AudioContext;
  readonly unlocked = signal(false);
  readonly bgmPlaying = signal(false);

  // Background music audio nodes
  private bgmGain?: GainNode;
  private bgmTimer?: ReturnType<typeof setInterval>;
  private step = 0;
  private nextTime = 0;
  private noise?: AudioBuffer;

  // Chill Lounge pads
  private readonly CHORDS = [
    [185.00, 277.18, 369.99, 440.00], // F#sus2/A
    [146.83, 220.00, 293.66, 369.99], // Dmaj7
    [164.81, 246.94, 329.63, 392.00], // Em7
    [196.00, 293.66, 369.99, 440.00], // Gmaj9
  ];
  private readonly MELODY = [369.99, 440.00, 493.88, 554.37, 659.25, 739.99];

  // Groove/Arcade: Am – F – C – G (feel-good pop progression). bass root + chord tones.
  private readonly PROG = [
    { bass: 110.00, chord: [220.00, 261.63, 329.63] },
    { bass: 87.31, chord: [174.61, 220.00, 261.63] },
    { bass: 130.81, chord: [261.63, 329.63, 392.00] },
    { bass: 98.00, chord: [196.00, 246.94, 293.66] },
  ];

  toggle() {
    this.muted.update((m) => !m);
    if (this.muted()) {
      this.stopBgm();
    }
  }

  toggleBgm() {
    this.bgmMuted.update((m) => !m);
    if (this.bgmMuted()) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  /** Switch to the next music style (and restart it if music is currently playing). */
  cycleBgmStyle() {
    const i = BGM_STYLES.findIndex((s) => s.id === this.bgmStyle());
    this.bgmStyle.set(BGM_STYLES[(i + 1) % BGM_STYLES.length].id);
    if (this.bgmPlaying()) {
      this.stopBgm();
      setTimeout(() => this.startBgm(), 120);
    }
    this.click();
  }

  styleInfo() { return BGM_STYLES.find((s) => s.id === this.bgmStyle()) ?? BGM_STYLES[0]; }

  private ac(): AudioContext | null {
    if (this.muted()) return null;
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.unlocked.set(true);
      return this.ctx;
    } catch {
      return null;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     BACKGROUND MUSIC GENERATOR
     ══════════════════════════════════════════════════════════════════ */
  startBgm() {
    if (this.muted() || this.bgmMuted() || this.bgmPlaying()) return;
    const c = this.ac();
    if (!c) return;

    const style = this.bgmStyle();
    this.bgmGain = c.createGain();
    // chill pads are very quiet by design; groove/arcade have their own per-voice levels
    this.bgmGain.gain.setValueAtTime(style === 'chill' ? 0.045 : 0.2, c.currentTime);
    this.bgmGain.connect(c.destination);
    this.bgmPlaying.set(true);

    this.step = 0;
    clearInterval(this.bgmTimer);
    if (style === 'chill') {
      this.playBgmBeat();
      this.bgmTimer = setInterval(() => this.playBgmBeat(), 1800); // 1.8s ambient pulse
    } else {
      // look-ahead step sequencer: stays in time even if the browser throttles timers
      this.nextTime = c.currentTime + 0.08;
      this.schedule();
      this.bgmTimer = setInterval(() => this.schedule(), 100);
    }
  }

  stopBgm() {
    clearInterval(this.bgmTimer);
    if (this.bgmGain && this.ctx) {
      try {
        this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.bgmGain.gain.setValueAtTime(Math.max(this.bgmGain.gain.value, 0.0002), this.ctx.currentTime);
        this.bgmGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
      } catch {}
    }
    this.bgmPlaying.set(false);
  }

  private schedule() {
    const c = this.ac();
    if (!c || !this.bgmGain || this.bgmMuted()) return;
    const arcade = this.bgmStyle() === 'arcade';
    const bpm = arcade ? 148 : 108;
    const stepDur = 60 / bpm / 4; // 16th note
    if (this.nextTime < c.currentTime) this.nextTime = c.currentTime + 0.05; // recover after a stall
    while (this.nextTime < c.currentTime + 1.0) {
      arcade ? this.arcadeStep(c, this.step, this.nextTime) : this.grooveStep(c, this.step, this.nextTime);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  private noiseBuf(c: AudioContext): AudioBuffer {
    if (!this.noise) {
      this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  private kick(c: AudioContext, t: number, vol = 0.9) {
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g).connect(this.bgmGain!);
    o.start(t); o.stop(t + 0.3);
  }

  private hit(c: AudioContext, t: number, type: 'hat' | 'open' | 'clap', vol = 0.3) {
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf(c);
    f.type = type === 'clap' ? 'bandpass' : 'highpass';
    f.frequency.value = type === 'clap' ? 1600 : 7500;
    const dur = type === 'open' ? 0.18 : type === 'clap' ? 0.14 : 0.045;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(this.bgmGain!);
    s.start(t); s.stop(t + dur + 0.02);
  }

  private note(c: AudioContext, t: number, freq: number, dur: number, type: OscillatorType, vol: number, lp = 0) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out: AudioNode = o;
    if (lp) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = lp;
      o.connect(f); out = f;
    }
    out.connect(g).connect(this.bgmGain!);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /** Party Groove – 16 steps per bar, one chord per bar. */
  private grooveStep(c: AudioContext, n: number, t: number) {
    const s = n % 16;
    const p = this.PROG[Math.floor(n / 16) % this.PROG.length];
    if (s % 4 === 0) this.kick(c, t);                       // four-on-the-floor
    if (s === 4 || s === 12) this.hit(c, t, 'clap', 0.35);  // backbeat clap
    if (s % 2 === 1) this.hit(c, t, 'hat', 0.16);           // off-beat hats
    if (s === 14) this.hit(c, t, 'open', 0.2);
    if ([0, 3, 6, 8, 11, 14].includes(s)) {                // syncopated bass
      const f = s === 11 ? p.bass * 1.5 : s === 14 ? p.bass * 2 : p.bass;
      this.note(c, t, f, 0.22, 'sawtooth', 0.5, 420);
    }
    if ([2, 7, 10].includes(s)) p.chord.forEach((f) => this.note(c, t, f, 0.2, 'square', 0.07, 1900)); // stabs
    if (s % 2 === 0) {                                      // plucky arpeggio melody
      const order = [0, 1, 2, 1, 2, 1, 0, 2];
      const f = p.chord[order[(s / 2) % order.length]] * 2;
      this.note(c, t, f, 0.18, 'triangle', 0.16);
    }
  }

  /** Retro Arcade chiptune – square lead + octave-bouncing bass. */
  private arcadeStep(c: AudioContext, n: number, t: number) {
    const s = n % 16;
    const p = this.PROG[Math.floor(n / 16) % this.PROG.length];
    if (s === 0 || s === 8) this.kick(c, t, 0.7);
    if (s === 4 || s === 12) this.hit(c, t, 'clap', 0.28);
    if (s % 2 === 0) this.hit(c, t, 'hat', 0.1);
    if (s % 2 === 0) this.note(c, t, s % 4 === 0 ? p.bass * 2 : p.bass * 4, 0.12, 'square', 0.16, 900); // bouncing bass
    const arp = [0, 1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 1, 0, 2, 1, 2];
    this.note(c, t, p.chord[arp[s]] * 2, 0.1, 'square', 0.09, 3500); // chiptune arpeggio
    if (s === 0 || s === 6 || s === 10) this.note(c, t, p.chord[2] * 4, 0.22, 'square', 0.07, 4000); // lead sparkle
  }

  /** Chill Lounge – the original soft pads. */
  private playBgmBeat() {
    const c = this.ac();
    if (!c || !this.bgmGain || this.bgmMuted()) return;

    const chordIndex = Math.floor(this.step / 4) % this.CHORDS.length;
    const chord = this.CHORDS[chordIndex];
    const now = c.currentTime;

    // Soft warm pad tone for each chord note
    chord.forEach((freq, idx) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.018 - idx * 0.002, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc.connect(gain).connect(this.bgmGain!);
      osc.start(now);
      osc.stop(now + 2.5);
    });

    // Gentle high sparkle note every other beat
    if (this.step % 2 === 0) {
      const mFreq = this.MELODY[(this.step * 2) % this.MELODY.length];
      const mOsc = c.createOscillator();
      const mGain = c.createGain();
      mOsc.type = 'triangle';
      mOsc.frequency.setValueAtTime(mFreq, now + 0.3);

      mGain.gain.setValueAtTime(0.0001, now + 0.3);
      mGain.gain.exponentialRampToValueAtTime(0.012, now + 0.4);
      mGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      mOsc.connect(mGain).connect(this.bgmGain);
      mOsc.start(now + 0.3);
      mOsc.stop(now + 1.3);
    }

    this.step++;
  }

  /* ══════════════════════════════════════════════════════════════════
     WARM, POLISHED SFX SYNTHESIZERS
     ══════════════════════════════════════════════════════════════════ */
  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, delay = 0, slideTo?: number) {
    const c = this.ac();
    if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  tick() { this.tone(880, 0.04, 'sine', 0.06); }
  urgentTick() { this.tone(1320, 0.06, 'triangle', 0.09); }
  click() { this.tone(587.33, 0.05, 'triangle', 0.08); }
  wheelTick() { this.tone(987.77, 0.03, 'sine', 0.07); }
  whoosh() { this.tone(180, 0.45, 'sine', 0.06, 0, 950); }
  buzzer() { this.tone(160, 0.5, 'sawtooth', 0.2); this.tone(165, 0.5, 'square', 0.12); }
  wrong() { this.tone(280, 0.2, 'sawtooth', 0.16); this.tone(210, 0.3, 'sawtooth', 0.16, 0.15); }
  correct() {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.16, i * 0.09));
  }
  reveal() {
    this.tone(130.81, 0.6, 'sine', 0.1, 0, 523.25);
    this.tone(659.25, 0.45, 'triangle', 0.12, 0.5);
  }
  drumroll() {
    for (let i = 0; i < 16; i++) {
      this.tone(130 + i * 5, 0.06, 'triangle', 0.04 + i * 0.003, i * 0.065);
    }
  }
  fanfare() {
    [523.25, 523.25, 523.25, 659.25, 783.99, 1046.50].forEach((f, i) =>
      this.tone(f, 0.32, 'triangle', 0.18, i * 0.14)
    );
  }
  win() {
    this.fanfare();
    [261.63, 329.63, 392.00, 523.25].forEach((f, i) =>
      this.tone(f, 1.4, 'sine', 0.1, 1.1 + i * 0.03)
    );
  }
}
