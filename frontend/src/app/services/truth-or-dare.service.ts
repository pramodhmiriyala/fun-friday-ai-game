import { Injectable, signal } from '@angular/core';
import { persisted } from '../core/store';
import { AiApiService, TruthOrDareItem } from './ai-api.service';
import { ConfettiService } from './confetti.service';
import { SoundService } from './sound.service';
import { TeamService } from './team.service';

interface TruthOrDareState {
  current: TruthOrDareItem | null;
  history: string[];
  totalPlayed: number;
}

@Injectable({ providedIn: 'root' })
export class TruthOrDareService {
  readonly state = persisted<TruthOrDareState>('truth_or_dare', {
    current: null,
    history: [],
    totalPlayed: 0,
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private preloadedPromise: Promise<any> | null = null;

  constructor(
    private api: AiApiService,
    private sound: SoundService,
    private team: TeamService,
    private confetti: ConfettiService,
  ) {}

  preload(type: 'truth' | 'dare') {
    this.preloadedPromise = this.api.truthOrDare(type, this.state().history);
  }

  async play(type: 'truth' | 'dare') {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.sound.drumroll();

    try {
      const fetchPromise = this.preloadedPromise
        ? this.preloadedPromise
        : this.api.truthOrDare(type, this.state().history);
      this.preloadedPromise = null;

      // 4.5s race timeout so the game NEVER hangs or stays stuck on loading
      const timeoutPromise = new Promise<{ item: TruthOrDareItem; source: any }>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 4500)
      );

      const res = await Promise.race([fetchPromise, timeoutPromise]);
      this.sound.reveal();
      this.state.update((s) => ({
        ...s,
        current: res.item,
        totalPlayed: s.totalPlayed + 1,
        history: [...s.history, res.item.prompt].slice(-40),
      }));
    } catch {
      // Guaranteed instant fallback - never stuck on loading spinner!
      this.sound.reveal();
      const defaultTruths = [
        "Have you ever claimed your mic is broken just to dodge giving an update?",
        "What's the funniest lie you gave when you overslept a morning standup?",
        "Have you ever attended a virtual call from bed while pretending you're at your desk?",
        "Have you ever said 'Can you hear me?' solely to buy 15 seconds to think?",
        "What is one buzzword you constantly use without knowing what it actually means?",
        "Have you ever nodded intensely on camera while having zero clue what was discussed?",
      ];
      const defaultDares = [
        "Pitch your office water bottle like an urgent 2 AM Naaptol TV host in 15 seconds!",
        "Give high-energy Hindi IPL commentary on someone in this call sipping tea or water!",
        "Sing 'Twinkle Twinkle Little Star' like an intense dramatic opera singer for 10 seconds!",
        "Apologize emotionally to your laptop charger for 100% battery overworking in 15 seconds!",
        "Take a sip of water in extreme slow motion on webcam like a luxury TV commercial!",
        "Imitate the Google Maps GPS voice saying 'In 100 meters, take a sharp left' on mic!",
      ];
      const pool = type === 'truth' ? defaultTruths : defaultDares;
      const history = this.state().history;
      const unplayed = pool.filter(p => !history.includes(p));
      const chosen = unplayed.length ? unplayed[Math.floor(Math.random() * unplayed.length)] : pool[0];

      this.state.update((s) => ({
        ...s,
        current: {
          prompt: chosen,
          category: type === 'truth' ? 'Truth' : 'Dare',
          type,
        },
        totalPlayed: s.totalPlayed + 1,
        history: [...s.history, chosen].slice(-40),
      }));
    } finally {
      this.loading.set(false);
      this.preloadedPromise = null;
    }
  }

  pass() {
    this.sound.fanfare();
    this.confetti.burst(0.5, 0.45, 80);
    this.state.update((s) => ({
      ...s,
      current: {
        prompt: "PASS! Turn skipped with zero penalty.",
        category: "Pass",
        type: "pass",
      },
      totalPlayed: s.totalPlayed + 1,
    }));
  }

  applaud() {
    this.sound.fanfare();
    this.confetti.burst(0.5, 0.45, 120);
  }

  next() {
    this.sound.click();
    this.state.update((s) => ({ ...s, current: null }));
  }

  reset() {
    this.state.update(() => ({ current: null, history: [], totalPlayed: 0 }));
  }
}
