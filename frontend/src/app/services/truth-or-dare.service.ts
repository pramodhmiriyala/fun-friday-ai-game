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
        "Send the funniest animal GIF you can find in the team chat right now!",
        "Talk in a posh British accent for the next 20 seconds on mic!",
        "Wear your glasses or sunglasses upside down on webcam with a serious face for 1 round!",
        "Say the entire English alphabet backwards from Z to P as fast as possible!",
        "Type a 4-word greeting in the team chat using only your elbow or nose!",
        "Give an emotional 15-second Oscar speech thanking Google, StackOverflow, and Ctrl+Z!",
        "Tell the team one ridiculous made-up fact and try to convince everyone it's 100% real!",
        "Mime drinking a cup of burning hot tea using only silent facial expressions on webcam!",
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
