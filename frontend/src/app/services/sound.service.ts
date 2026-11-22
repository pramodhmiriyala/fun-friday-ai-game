import { Injectable, signal } from '@angular/core';
import { persisted } from '../core/store';

/**
 * Procedural Pleasant Ambient Music & Synthesized Game Show Sound Effects.
 * 100% Web Audio API — zero external mp3 files required, works offline anywhere.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly muted = persisted<boolean>('muted', false);
  readonly bgmMuted = persisted<boolean>('bgmMuted', false);
  private ctx?: AudioContext;
  readonly unlocked = signal(false);
  readonly bgmPlaying = signal(false);

  // Background music audio nodes
  private bgmGain?: GainNode;
  private bgmTimer?: ReturnType<typeof setInterval>;
  private step = 0;

  // Pleasant, relaxing pentatonic chord progression (F# major / D# minor warm game-show chill lounge)
  private readonly CHORDS = [
    [185.00, 277.18, 369.99, 440.00], // F#sus2/A
    [146.83, 220.00, 293.66, 369.99], // Dmaj7
    [164.81, 246.94, 329.63, 392.00], // Em7
    [196.00, 293.66, 369.99, 440.00], // Gmaj9
  ];
  private readonly MELODY = [369.99, 440.00, 493.88, 554.37, 659.25, 739.99];

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
     PLEASANT AMBIENT BACKGROUND MUSIC GENERATOR
     ══════════════════════════════════════════════════════════════════ */
  startBgm() {
    if (this.muted() || this.bgmMuted() || this.bgmPlaying()) return;
    const c = this.ac();
    if (!c) return;

    this.bgmGain = c.createGain();
    this.bgmGain.gain.setValueAtTime(0.045, c.currentTime); // gentle, soft lounge volume
    this.bgmGain.connect(c.destination);
    this.bgmPlaying.set(true);

    this.step = 0;
    this.playBgmBeat();
    clearInterval(this.bgmTimer);
    this.bgmTimer = setInterval(() => this.playBgmBeat(), 1800); // 1.8s ambient pulse
  }

  stopBgm() {
    clearInterval(this.bgmTimer);
    if (this.bgmGain && this.ctx) {
      try {
        this.bgmGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
      } catch {}
    }
    this.bgmPlaying.set(false);
  }

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
