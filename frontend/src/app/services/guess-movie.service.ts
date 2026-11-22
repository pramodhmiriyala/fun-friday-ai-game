import { Injectable, computed, signal } from '@angular/core';
import { persisted } from '../core/store';
import { AiApiService, MovieInfo } from './ai-api.service';
import { ConfettiService } from './confetti.service';
import { ScoringService } from './scoring.service';
import { SoundService } from './sound.service';
import { TeamService } from './team.service';

export type MovieCategory = 'Telugu' | 'Hindi' | 'English' | 'Tamil' | 'Malayalam' | 'Pan-Indian' | 'Pan-World';

export const MOVIE_CATEGORIES: { id: MovieCategory; label: string; icon: string }[] = [
  { id: 'Telugu',     label: 'Telugu',     icon: '🔥' },
  { id: 'Hindi',      label: 'Hindi',      icon: '🎬' },
  { id: 'English',    label: 'English',    icon: '🌎' },
  { id: 'Tamil',      label: 'Tamil',      icon: '⚡' },
  { id: 'Malayalam',  label: 'Malayalam',  icon: '🌴' },
  { id: 'Pan-Indian', label: 'Pan-Indian', icon: '🇮🇳' },
  { id: 'Pan-World',  label: 'Pan-World',  icon: '🌍' },
];

export interface ChatTurn {
  role: 'ai' | 'user';
  kind: 'clue' | 'question' | 'reply' | 'win' | 'reveal';
  text: string;
  label?: string;
}

interface GuessHostState {
  category: MovieCategory;
  round: number;
  sessionId: string | null;
  phase: 'idle' | 'live' | 'solved' | 'revealed';
  messages: ChatTurn[];
  maxQuestions: number;
  questionsLeft: number;
  cluesCount: number;
  movie: MovieInfo | null;
  winner: string | null;
  used: string[];
}

const MAX_QUESTIONS = 5;

@Injectable({ providedIn: 'root' })
export class GuessMovieService {
  readonly state = persisted<GuessHostState>('guess_host_v2', {
    category: 'Hindi',
    round: 0,
    sessionId: null,
    phase: 'idle',
    messages: [],
    maxQuestions: MAX_QUESTIONS,
    questionsLeft: MAX_QUESTIONS,
    cluesCount: 0,
    movie: null,
    winner: null,
    used: [],
  });

  readonly loading = signal(false);
  readonly thinking = signal(false);
  readonly error = signal<string | null>(null);

  /** Starts at 25 pts, -3 per extra clue/question used (min 10 pts). */
  readonly prize = computed(() => {
    const s = this.state();
    const usedCount = Math.max(0, s.maxQuestions - s.questionsLeft);
    return Math.max(10, 25 - usedCount * 3);
  });

  constructor(
    private api: AiApiService,
    private sound: SoundService,
    private team: TeamService,
    private scoring: ScoringService,
    private confetti: ConfettiService,
  ) {}

  setCategory(cat: MovieCategory) {
    if (this.state().phase === 'live') return;
    this.sound.click();
    this.state.update(s => ({ ...s, category: cat }));
  }

  async startRound() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const s = this.state();
      const res = await this.api.guessMovieStart(s.category, s.used, MAX_QUESTIONS);
      this.sound.whoosh();
      this.state.update(st => ({
        ...st,
        round: st.round + 1,
        sessionId: res.session_id,
        phase: 'live',
        maxQuestions: res.max_questions,
        questionsLeft: res.questions_left,
        cluesCount: 1,
        movie: null,
        winner: null,
        messages: [
          { role: 'ai', kind: 'clue', label: 'Clue #1', text: res.clue },
        ],
      }));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async sendMessage(raw: string) {
    const text = raw.trim();
    const s = this.state();
    if (!text || s.phase !== 'live' || !s.sessionId || this.thinking()) return;

    this.thinking.set(true);
    this.error.set(null);
    this.sound.click();

    // Optimistically show participant's message
    const teamName = this.team.activeTeam()?.name ?? 'Team';
    this.state.update(st => ({
      ...st,
      messages: [...st.messages, { role: 'user', kind: 'question', label: teamName, text }],
    }));

    try {
      const res = await this.api.guessMovieInteract(s.sessionId, text, 'chat');
      if (res.is_correct && res.movie) {
        const winnerId = this.team.activeTeamId();
        this.scoring.award(winnerId, this.prize(), 'guess', `Guessed "${res.movie.title}"`);
        this.sound.correct();
        this.confetti.cannons(140);
        this.state.update(st => ({
          ...st,
          phase: 'solved',
          questionsLeft: res.questions_left,
          movie: res.movie ?? null,
          winner: winnerId,
          used: [...st.used, res.movie!.title].slice(-60),
          messages: [...st.messages, { role: 'ai', kind: 'win', label: '🤖 AI Host', text: res.reply }],
        }));
      } else {
        if (res.is_guess) this.sound.wrong();
        this.state.update(st => ({
          ...st,
          questionsLeft: res.questions_left,
          messages: [...st.messages, { role: 'ai', kind: 'reply', label: '🤖 AI Host', text: res.reply }],
        }));
      }
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.thinking.set(false);
    }
  }

  async askClue() {
    const s = this.state();
    if (s.phase !== 'live' || !s.sessionId || this.thinking()) return;
    this.thinking.set(true);
    this.error.set(null);
    this.sound.click();

    try {
      const res = await this.api.guessMovieInteract(s.sessionId, '', 'clue');
      const nextClueNum = s.cluesCount + 1;
      this.state.update(st => ({
        ...st,
        questionsLeft: res.questions_left,
        cluesCount: res.kind === 'clue' ? nextClueNum : st.cluesCount,
        messages: [
          ...st.messages,
          {
            role: 'ai',
            kind: res.kind === 'clue' ? 'clue' : 'reply',
            label: res.kind === 'clue' ? `Clue #${nextClueNum}` : '🤖 AI Host',
            text: res.reply,
          },
        ],
      }));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.thinking.set(false);
    }
  }

  async reveal() {
    const s = this.state();
    if (s.phase !== 'live' || !s.sessionId || this.thinking()) return;
    this.thinking.set(true);
    this.error.set(null);
    try {
      const res = await this.api.guessMovieReveal(s.sessionId);
      this.sound.reveal();
      this.state.update(st => ({
        ...st,
        phase: 'revealed',
        movie: res.movie,
        used: [...st.used, res.movie.title].slice(-60),
        messages: [...st.messages, { role: 'ai', kind: 'reveal', label: '🤖 AI Host', text: res.reply }],
      }));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.thinking.set(false);
    }
  }

  resetGame() {
    this.state.update(s => ({
      ...s,
      round: 0,
      sessionId: null,
      phase: 'idle',
      messages: [],
      questionsLeft: MAX_QUESTIONS,
      cluesCount: 0,
      movie: null,
      winner: null,
      used: [],
    }));
  }
}
