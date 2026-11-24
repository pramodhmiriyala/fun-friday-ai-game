import { Injectable, computed, signal } from '@angular/core';
import { PUZZLES } from '../core/games.data';
import { persisted, secureRandomInt } from '../core/store';
import { AiApiService, PersonCard, RapidQuestion } from './ai-api.service';
import { ConfettiService } from './confetti.service';
import { ScoringService } from './scoring.service';
import { SoundService } from './sound.service';
import { TeamService } from './team.service';
import { TimerService } from './timer.service';

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = secureRandomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

interface ClassicState {
  rapid: {
    questions: RapidQuestion[];
    pos: number;
    phase: 'idle' | 'live' | 'done';
    correct: number;
    wrong: number;
    selected: number | null;
    usedQs: string[];
  };
  puzzle: { order: number[]; pos: number; phase: 'idle' | 'live' | 'revealed'; open: number[]; showHint: boolean; tick: number };
  person: { people: PersonCard[]; pos: number; clues: number; revealed: boolean; usedNames: string[] };
}

const RAPID_SECONDS = 60;
const PUZZLE_STEP_SECONDS = 4;

@Injectable({ providedIn: 'root' })
export class ClassicGamesService {
  readonly state = persisted<ClassicState>('classic_v3', {
    rapid:  { questions: [], pos: 0, phase: 'idle', correct: 0, wrong: 0, selected: null, usedQs: [] },
    puzzle: { order: shuffled(PUZZLES.length), pos: 0, phase: 'idle', open: [], showHint: false, tick: 0 },
    person: { people: [], pos: 0, clues: 1, revealed: false, usedNames: [] },
  });

  readonly rapidLoading  = signal(false);
  readonly personLoading = signal(false);
  readonly rapidError    = signal<string | null>(null);
  readonly personError   = signal<string | null>(null);

  readonly rapidTimer;
  readonly puzzleTimer;
  private puzzleLoop?: ReturnType<typeof setInterval>;
  private rapidNextTimeout?: ReturnType<typeof setTimeout>;

  readonly rapidQ = computed(() => {
    const r = this.state().rapid;
    const q = r.questions[r.pos];
    return q && Array.isArray(q.options) && q.options.length === 4 ? q : null;
  });
  readonly puzzle      = computed(() => PUZZLES[this.state().puzzle.order[this.state().puzzle.pos % PUZZLES.length]]);
  readonly person      = computed(() => this.state().person.people[this.state().person.pos] ?? null);
  readonly puzzlePrize = computed(() => Math.max(2, 18 - this.state().puzzle.open.length * 2) - (this.state().puzzle.showHint ? 2 : 0));
  readonly personPrize = computed(() => Math.max(2, 12 - this.state().person.clues * 2));

  constructor(
    timers: TimerService,
    private sound: SoundService,
    private team: TeamService,
    private scoring: ScoringService,
    private confetti: ConfettiService,
    private api: AiApiService,
  ) {
    this.rapidTimer  = timers.create('rapid', RAPID_SECONDS);
    this.puzzleTimer = timers.create('puzzle', 0);
    this.rapidTimer.onExpire(() => {
      if (this.state().rapid.phase === 'live') {
        clearTimeout(this.rapidNextTimeout);
        this.sound.buzzer();
        this.confetti.burst(0.5, 0.4, 80);
        this.patch('rapid', { phase: 'done', selected: null });
      }
    });
  }

  private patch<K extends keyof ClassicState>(k: K, v: Partial<ClassicState[K]>) {
    this.state.update(s => ({ ...s, [k]: { ...s[k], ...v } }));
  }

  /* ── AI fetch helpers ───────────────────────────────────────────────────── */

  async fetchRapidQuestions(append = false) {
    if (this.rapidLoading()) return;
    this.rapidLoading.set(true);
    this.rapidError.set(null);
    try {
      const rs = this.state().rapid;
      // exclude questions still queued + recently played so batches never overlap
      const upcoming = rs.questions.slice(rs.pos).map((q) => q.q);
      const r = await this.api.rapidQuestions(10, [...upcoming, ...rs.usedQs.slice(-20)]);
      if (append) {
        const cur = this.state().rapid;
        this.patch('rapid', { questions: [...cur.questions.slice(cur.pos), ...r.questions], pos: 0 });
      } else {
        this.patch('rapid', { questions: r.questions, pos: 0, selected: null });
      }
    } catch (e) { this.rapidError.set((e as Error).message); }
    finally {
      this.rapidLoading.set(false);
      // if the round was paused while waiting for questions, continue the clock
      if (this.state().rapid.phase === 'live' && this.rapidQ() && !this.rapidTimer.running() && this.rapidTimer.remainingMs() > 0) {
        this.rapidTimer.resume();
      }
    }
  }

  async fetchPersonCards() {
    if (this.personLoading()) return;
    this.personLoading.set(true);
    this.personError.set(null);
    try {
      const r = await this.api.personCards(this.state().person.usedNames);
      this.patch('person', { people: r.people, pos: 0, clues: 1, revealed: false });
    } catch (e) { this.personError.set((e as Error).message); }
    finally { this.personLoading.set(false); }
  }

  /* ── Rapid Fire MCQs ────────────────────────────────────────────────────── */

  async rapidStart() {
    if (!this.rapidQ()) await this.fetchRapidQuestions();
    if (!this.rapidQ()) return;
    clearTimeout(this.rapidNextTimeout);
    this.sound.whoosh();
    this.patch('rapid', { phase: 'live', correct: 0, wrong: 0, selected: null });
    this.rapidTimer.start(RAPID_SECONDS);
    this.fetchRapidQuestions(true); // warm the next batch right away so questions never run out
  }

  rapidChoose(optionIndex: number) {
    const r = this.state().rapid;
    const q = this.rapidQ();
    if (r.phase !== 'live' || !q || r.selected !== null) return;

    const isRight = optionIndex === q.correct;
    const usedQs = [...r.usedQs, q.q].slice(-40);

    if (isRight) {
      this.scoring.award(this.team.activeTeamId(), 5, 'rapid', q.q);
      this.sound.correct();
      this.patch('rapid', { selected: optionIndex, correct: r.correct + 1, usedQs });
    } else {
      this.sound.wrong();
      this.patch('rapid', { selected: optionIndex, wrong: r.wrong + 1, usedQs });
    }

    clearTimeout(this.rapidNextTimeout);
    this.rapidNextTimeout = setTimeout(() => {
      if (this.state().rapid.phase === 'live') {
        this.rapidNext();
      }
    }, isRight ? 650 : 1050);
  }

  rapidNext() {
    clearTimeout(this.rapidNextTimeout);
    const cur = this.rapidQ();
    if (cur && !this.state().rapid.usedQs.includes(cur.q)) {
      this.patch('rapid', { usedQs: [...this.state().rapid.usedQs, cur.q].slice(-40) }); // passed questions count as played too
    }
    const nextPos = this.state().rapid.pos + 1;
    this.patch('rapid', { pos: nextPos, selected: null });
    const remaining = this.state().rapid.questions.length - nextPos;
    if (remaining <= 5) this.fetchRapidQuestions(true); // prefetch early (AI takes ~10-15s)
    if (remaining <= 0 && this.state().rapid.phase === 'live') this.rapidTimer.pause(); // fair: clock waits for the AI
  }

  rapidStop() {
    clearTimeout(this.rapidNextTimeout);
    this.rapidTimer.reset(RAPID_SECONDS);
    this.patch('rapid', { phase: 'idle', selected: null });
  }

  /* ── Picture Puzzle ─────────────────────────────────────────────────────── */
  puzzleStart() {
    this.sound.whoosh();
    this.patch('puzzle', { phase: 'live', open: [], showHint: false });
    clearInterval(this.puzzleLoop);
    this.puzzleLoop = setInterval(() => {
      const p = this.state().puzzle;
      if (p.phase !== 'live' || p.open.length >= 8) { clearInterval(this.puzzleLoop); return; }
      this.puzzleOpenTile();
    }, PUZZLE_STEP_SECONDS * 1000);
    this.puzzleOpenTile();
  }
  puzzleOpenTile() {
    const p = this.state().puzzle;
    const closed = Array.from({ length: 9 }, (_, i) => i).filter(i => !p.open.includes(i));
    if (closed.length <= 1) return;
    this.sound.tick();
    this.patch('puzzle', { open: [...p.open, closed[secureRandomInt(closed.length)]] });
  }
  puzzleHint() { this.patch('puzzle', { showHint: true }); }
  puzzleSolve(teamId: string | null = this.team.activeTeamId()) {
    if (this.state().puzzle.phase !== 'live') return;
    clearInterval(this.puzzleLoop);
    this.scoring.award(teamId, this.puzzlePrize(), 'puzzle', this.puzzle().answer);
    this.sound.correct();
    this.confetti.burst(0.5, 0.5, 120);
    this.patch('puzzle', { phase: 'revealed' });
  }
  puzzleReveal() { clearInterval(this.puzzleLoop); this.sound.reveal(); this.patch('puzzle', { phase: 'revealed' }); }
  puzzleNext() { clearInterval(this.puzzleLoop); this.patch('puzzle', { pos: this.state().puzzle.pos + 1, phase: 'idle', open: [], showHint: false }); }

  private nextTeamCards: PersonCard[] = [];

  /* ── Guess the Person ───────────────────────────────────────────────────── */
  personClue() {
    const p = this.state().person;
    if (p.clues < 5 && !p.revealed) { this.sound.click(); this.patch('person', { clues: p.clues + 1 }); }
  }
  personSolve(teamId: string | null = this.team.activeTeamId()) {
    if (this.state().person.revealed) return;
    const name = this.person()?.name ?? '';
    this.scoring.award(teamId, this.personPrize(), 'person', name);
    this.sound.correct();
    this.confetti.burst(0.5, 0.5, 120);
    this.patch('person', {
      revealed: true,
      usedNames: name ? [...this.state().person.usedNames, name].slice(-30) : this.state().person.usedNames,
    });
  }
  personReveal() {
    this.sound.reveal();
    const name = this.person()?.name ?? '';
    this.patch('person', {
      revealed: true,
      usedNames: name ? [...this.state().person.usedNames, name].slice(-40) : this.state().person.usedNames,
    });
  }
  personNext() {
    const p = this.state().person;
    const nextPos = p.pos + 1;
    // Pre-fetch next team's riddles while current team is on Question 4 or 5:
    if (nextPos >= 3 && this.nextTeamCards.length === 0) {
      const allCurrent = p.people.map(x => x.name).filter(Boolean);
      const combinedExclude = Array.from(new Set([...p.usedNames, ...allCurrent])).slice(-40);
      this.api.personCards(combinedExclude).then(res => {
        this.nextTeamCards = res.people;
      }).catch(() => {});
    }

    if (nextPos >= p.people.length) {
      // 5 questions completed for this team! Swap to pre-fetched cards instantly (0s wait)
      if (this.nextTeamCards.length > 0) {
        const fresh = this.nextTeamCards;
        this.nextTeamCards = [];
        this.patch('person', { people: fresh, pos: 0, clues: 1, revealed: false });
      } else {
        this.fetchPersonCards();
      }
    } else {
      this.patch('person', { pos: nextPos, clues: 1, revealed: false });
    }
  }
}
