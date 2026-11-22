import { Injectable, Signal, computed, signal } from '@angular/core';
import { WritableSignal } from '@angular/core';
import { persisted } from '../core/store';
import { SoundService } from './sound.service';

export interface TimerState {
  duration: number; // seconds
  endsAt: number | null; // epoch ms while running
  remainingMs: number; // value while paused/idle
}

/** A countdown whose state is persisted + synced across tabs (host tab can control projector tab). */
export class Countdown {
  readonly state: WritableSignal<TimerState>;
  readonly remainingMs: Signal<number>;
  readonly seconds: Signal<number>;
  readonly running: Signal<boolean>;
  readonly fraction: Signal<number>;
  readonly expired: Signal<boolean>;
  private expiryHandlers: (() => void)[] = [];

  constructor(key: string, defaultSeconds: number, private now: Signal<number>) {
    this.state = persisted<TimerState>('timer.' + key, {
      duration: defaultSeconds, endsAt: null, remainingMs: defaultSeconds * 1000,
    });
    this.remainingMs = computed(() => {
      const s = this.state();
      return s.endsAt ? Math.max(0, s.endsAt - this.now()) : s.remainingMs;
    });
    this.seconds = computed(() => Math.ceil(this.remainingMs() / 1000));
    this.running = computed(() => this.state().endsAt !== null);
    this.fraction = computed(() => this.remainingMs() / (this.state().duration * 1000));
    this.expired = computed(() => !this.running() && this.remainingMs() === 0);
  }

  onExpire(fn: () => void) { this.expiryHandlers.push(fn); }
  /** @internal */
  _check(now: number) {
    const s = this.state();
    if (s.endsAt && now >= s.endsAt) {
      this.state.set({ ...s, endsAt: null, remainingMs: 0 });
      this.expiryHandlers.forEach((h) => h());
    }
  }

  start(seconds?: number) {
    const d = seconds ?? this.state().duration;
    this.state.set({ duration: d, endsAt: Date.now() + d * 1000, remainingMs: d * 1000 });
  }
  pause() {
    const s = this.state();
    if (s.endsAt) this.state.set({ ...s, endsAt: null, remainingMs: Math.max(0, s.endsAt - Date.now()) });
  }
  resume() {
    const s = this.state();
    if (!s.endsAt && s.remainingMs > 0) this.state.set({ ...s, endsAt: Date.now() + s.remainingMs });
  }
  toggle() { this.running() ? this.pause() : this.resume(); }
  reset(seconds?: number) {
    const d = seconds ?? this.state().duration;
    this.state.set({ duration: d, endsAt: null, remainingMs: d * 1000 });
  }
  addSeconds(n: number) {
    const s = this.state();
    if (s.endsAt) this.state.set({ ...s, endsAt: s.endsAt + n * 1000 });
    else this.state.set({ ...s, remainingMs: Math.max(0, s.remainingMs + n * 1000) });
  }
}

@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly now = signal(Date.now());
  private timers: Countdown[] = [];
  private lastBeep = -1;

  constructor(private sound: SoundService) {
    setInterval(() => {
      const t = Date.now();
      this.now.set(t);
      this.timers.forEach((c) => {
        c._check(t);
        if (c.running()) {
          const s = c.seconds();
          if (s <= 5 && s !== this.lastBeep && s > 0) { this.lastBeep = s; this.sound.urgentTick(); }
        }
      });
    }, 100);
  }

  create(key: string, defaultSeconds: number): Countdown {
    const c = new Countdown(key, defaultSeconds, this.now);
    this.timers.push(c);
    return c;
  }
}
