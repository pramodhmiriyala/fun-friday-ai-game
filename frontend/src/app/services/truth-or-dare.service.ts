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

  constructor(
    private api: AiApiService,
    private sound: SoundService,
    private team: TeamService,
    private confetti: ConfettiService,
  ) {}

  async play(type: 'truth' | 'dare') {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.sound.drumroll();

    try {
      const res = await this.api.truthOrDare(type, this.state().history);
      this.sound.reveal();
      this.state.update((s) => ({
        ...s,
        current: res.item,
        totalPlayed: s.totalPlayed + 1,
        history: [...s.history, res.item.prompt].slice(-40),
      }));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
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
