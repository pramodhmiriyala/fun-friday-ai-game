import { Injectable, computed, signal } from '@angular/core';
import { persisted } from '../core/store';
import { AiApiService, AiSource, DescribeCard } from './ai-api.service';
import { ConfettiService } from './confetti.service';
import { ScoringService } from './scoring.service';
import { SoundService } from './sound.service';
import { TeamService } from './team.service';
import { TimerService } from './timer.service';

export const DESCRIBE_CATEGORIES = ['Mixed', 'Office & IT', 'Movies', 'Food', 'Technology', 'Places'];
const ROUND_SECONDS = 60;

interface DescribeState {
  cards: DescribeCard[];
  index: number;
  phase: 'idle' | 'live' | 'done';
  category: string;
  used: string[];
  source: AiSource | null;
  roundScore: number;
  solvedCount: number;
  penalties: number;
}

@Injectable({ providedIn: 'root' })
export class DescribeGameService {
  readonly state = persisted<DescribeState>('describe_v3', {
    cards: [],
    index: 0,
    phase: 'idle',
    category: 'Mixed',
    used: [],
    source: null,
    roundScore: 0,
    solvedCount: 0,
    penalties: 0,
  });

  readonly timer;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly current = computed(() => this.state().cards[this.state().index] ?? null);

  constructor(
    private api: AiApiService,
    timers: TimerService,
    private sound: SoundService,
    private team: TeamService,
    private scoring: ScoringService,
    private confetti: ConfettiService,
  ) {
    this.timer = timers.create('describe', ROUND_SECONDS);
    this.timer.onExpire(() => {
      if (this.state().phase === 'live') {
        this.sound.buzzer();
        this.confetti.burst(0.5, 0.45, 80);
        this.state.update((s) => ({ ...s, phase: 'done' }));
      }
    });
  }

  setCategory(c: string) {
    if (this.state().phase === 'live') return;
    this.state.update((s) => ({ ...s, category: c }));
  }

  async fetchCards(count = 6, append = false) {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const s = this.state();
      const r = await this.api.describeCards(s.category, count, s.used);
      if (append) {
        this.state.update((st) => ({
          ...st,
          cards: [...st.cards.slice(st.index), ...r.cards],
          index: 0,
          source: r.source,
        }));
      } else {
        this.state.update((st) => ({ ...st, cards: r.cards, index: 0, source: r.source }));
      }
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async startRound() {
    if (!this.current()) await this.fetchCards();
    if (!this.current()) return;
    this.sound.whoosh();
    this.state.update((s) => ({
      ...s,
      phase: 'live',
      roundScore: 0,
      solvedCount: 0,
      penalties: 0,
      used: [...s.used, this.current()!.word].slice(-60),
    }));
    this.timer.start(ROUND_SECONDS);
  }

  /** Player in hot seat guessed the word! Award +10 points to active team and move to next word. */
  correct() {
    if (this.state().phase !== 'live' || !this.current()) return;
    const word = this.current()!.word;
    this.scoring.award(this.team.activeTeamId(), 10, 'describe', `Hot Seat: Guessed "${word}"`);
    this.sound.correct();
    this.confetti.burst(0.5, 0.4, 60);

    const nextIndex = this.state().index + 1;
    this.state.update((s) => ({
      ...s,
      index: nextIndex,
      roundScore: s.roundScore + 10,
      solvedCount: s.solvedCount + 1,
    }));

    if (this.state().cards.length - nextIndex <= 2) {
      this.fetchCards(6, true);
    }
  }

  /** Team passes or skips to next word. */
  pass() {
    if (this.state().phase !== 'live') return;
    this.sound.whoosh();
    const nextIndex = this.state().index + 1;
    this.state.update((s) => ({ ...s, index: nextIndex }));
    if (this.state().cards.length - nextIndex <= 2) {
      this.fetchCards(6, true);
    }
  }

  /** Penalty: Teammate accidentally said a forbidden word! (-2 pts) */
  bannedWordPenalty() {
    if (this.state().phase !== 'live') return;
    this.sound.wrong();
    this.scoring.award(this.team.activeTeamId(), -2, 'describe', 'Used forbidden word (-2 pts)');
    this.state.update((s) => ({
      ...s,
      roundScore: s.roundScore - 2,
      penalties: s.penalties + 1,
    }));
  }

  stopRound() {
    this.timer.reset(ROUND_SECONDS);
    this.state.update((s) => ({ ...s, phase: 'idle' }));
  }

  resetGame() {
    this.timer.reset(ROUND_SECONDS);
    this.state.update((s) => ({
      ...s,
      cards: [],
      index: 0,
      phase: 'idle',
      roundScore: 0,
      solvedCount: 0,
      penalties: 0,
      used: [],
    }));
  }
}
