import { Injectable, computed, signal } from '@angular/core';
import { persisted } from '../core/store';
import { AiApiService, MovieInfo } from './ai-api.service';
import { ConfettiService } from './confetti.service';
import { ScoringService } from './scoring.service';
import { SoundService } from './sound.service';
import { TeamService } from './team.service';
import { HostAuthService } from './host-auth.service';

export type MovieCategory =
  | 'Telugu'
  | 'Tamil'
  | 'Hindi'
  | 'Kannada'
  | 'Marathi'
  | 'Bengali'
  | 'Odia'
  | 'English'
  | 'Malayalam'
  | 'Pan-Indian';

export const MOVIE_CATEGORIES: { id: MovieCategory; label: string; icon: string }[] = [
  { id: 'Telugu',     label: 'Telugu',     icon: '🔥' },
  { id: 'Tamil',      label: 'Tamil',      icon: '⚡' },
  { id: 'Hindi',      label: 'Hindi',      icon: '🎬' },
  { id: 'Kannada',    label: 'Kannada',    icon: '👑' },
  { id: 'Marathi',    label: 'Marathi',    icon: '🚩' },
  { id: 'Bengali',    label: 'Bengali',    icon: '🎭' },
  { id: 'Odia',       label: 'Odia',       icon: '🛕' },
  { id: 'English',    label: 'English',    icon: '🌎' },
  { id: 'Malayalam',  label: 'Malayalam',  icon: '🌴' },
  { id: 'Pan-Indian', label: 'Pan-Indian', icon: '🇮🇳' },
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
  awardedPrize?: number;
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
    awardedPrize: 0,
    used: [],
  });

  readonly loading = signal(false);
  readonly thinking = signal(false);
  readonly error = signal<string | null>(null);
  readonly pendingVerdict = signal<{ movie: MovieInfo; prize: number; reply: string } | null>(null);

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
    private auth: HostAuthService,
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
        awardedPrize: 0,
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
      if ((res as any).expired) {
        this.state.update(st => ({
          ...st,
          phase: 'idle',
          messages: [...st.messages, { role: 'ai', kind: 'reply', label: '🎬 Movie Host', text: res.reply }],
        }));
        return;
      }
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
          awardedPrize: this.prize(),
          used: [...st.used, res.movie!.title].slice(-60),
          messages: [...st.messages, { role: 'ai', kind: 'win', label: '🎬 Movie Host', text: res.reply }],
        }));
      } else {
        if (res.is_guess) this.sound.wrong();
        this.state.update(st => ({
          ...st,
          questionsLeft: res.questions_left,
          messages: [...st.messages, { role: 'ai', kind: 'reply', label: '🎬 Movie Host', text: res.reply }],
        }));
      }
    } catch (e) {
      const errMsg = (e as Error).message || 'Connection glitch. Please try again.';
      this.error.set(errMsg);
      this.state.update(st => ({
        ...st,
        messages: [...st.messages, { role: 'ai', kind: 'reply', label: '🎬 Movie Host', text: `⚠️ ${errMsg} (Click 'Start Round' if session expired)` }],
      }));
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

  /** Open Host Verdict Modal (gates for host password if needed). */
  openHostVerdict() {
    const s = this.state();
    if (s.phase !== 'live' || !s.sessionId || this.thinking()) return;
    this.auth.gate(async () => {
      this.thinking.set(true);
      this.error.set(null);
      try {
        const res = await this.api.guessMovieReveal(s.sessionId!, this.auth.token());
        this.pendingVerdict.set({
          movie: res.movie,
          prize: this.prize(),
          reply: res.reply,
        });
      } catch (e) {
        this.error.set((e as Error).message);
      } finally {
        this.thinking.set(false);
      }
    });
  }

  closeHostVerdict() {
    this.pendingVerdict.set(null);
  }

  confirmVerdict(guessed: boolean) {
    const pv = this.pendingVerdict();
    if (!pv) return;
    this.pendingVerdict.set(null);

    const teamId = this.team.activeTeamId();
    const teamName = this.team.activeTeam()?.name ?? 'Active Team';

    if (guessed) {
      this.scoring.award(teamId, pv.prize, 'guess', `Guessed "${pv.movie.title}"`);
      this.sound.correct();
      this.confetti.cannons(140);
      this.state.update(st => ({
        ...st,
        phase: 'solved',
        movie: pv.movie,
        winner: teamId,
        awardedPrize: pv.prize,
        used: [...st.used, pv.movie.title].slice(-60),
        messages: [
          ...st.messages,
          {
            role: 'ai',
            kind: 'win',
            label: '🎬 Movie Host',
            text: `🎉 Correct! ${teamName} guessed "${pv.movie.title}" (${pv.movie.year || ''}) and scores +${pv.prize} pts! 🏆`,
          },
        ],
      }));
    } else {
      this.sound.reveal();
      this.state.update(st => ({
        ...st,
        phase: 'revealed',
        movie: pv.movie,
        winner: null,
        awardedPrize: 0,
        used: [...st.used, pv.movie.title].slice(-60),
        messages: [
          ...st.messages,
          {
            role: 'ai',
            kind: 'reveal',
            label: '🤖 AI Host',
            text: pv.reply || `🎬 The secret movie was "${pv.movie.title}"! 0 pts awarded this round. Better luck next time! 🍿`,
          },
        ],
      }));
    }
  }

  /** Backwards compatibility: trigger host verdict popup. */
  reveal() {
    this.openHostVerdict();
  }

  resetGame() {
    this.pendingVerdict.set(null);
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
      awardedPrize: 0,
      used: [],
    }));
  }
}
