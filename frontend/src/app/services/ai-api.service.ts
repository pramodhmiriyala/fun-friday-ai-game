import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface DescribeCard { word: string; restricted: string[]; }
export interface TruthOrDareItem {
  prompt: string;
  category: string;
  type: 'truth' | 'dare';
}
export interface JudgeResult { team_id: string; score: number; verdict: string; }
export interface Movie {
  title: string;
  tagline: string;
  scene: string;
  punchline?: string;
}

export interface MovieInfo {
  title: string;
  year: number | null;
  language: string;
}

export interface GuessStartResponse {
  session_id: string;
  category: string;
  clue: string;
  max_questions: number;
  questions_left: number;
  source: AiSource;
}

export interface GuessInteractResponse {
  is_correct: boolean;
  is_guess: boolean;
  kind?: 'clue' | 'reply' | 'win';
  reply: string;
  questions_left: number;
  movie?: MovieInfo;
}

export interface GuessRevealResponse {
  movie: MovieInfo;
  reply: string;
}

export interface RapidQuestion {
  q: string;
  options: string[];
  correct: number;
}

export interface PersonCard { name: string; clues: string[]; }

export type AiSource = 'ai' | 'fallback' | 'cache';

/** The ONLY place the frontend talks to the Flask backend. No API keys live here. */
@Injectable({ providedIn: 'root' })
export class AiApiService {
  private readonly base = '/api';
  readonly online = signal<boolean | null>(null);
  readonly aiEnabled = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  async health() {
    try {
      const r = await firstValueFrom(this.http.get<{ ai: boolean }>(`${this.base}/health`));
      this.online.set(true);
      this.aiEnabled.set(r.ai);
    } catch {
      this.online.set(false);
      this.aiEnabled.set(false);
    }
  }

  describeCards(category: string, count: number, exclude: string[]) {
    return this.post<{ cards: DescribeCard[]; source: AiSource }>('/describe/generate', { category, count, exclude });
  }
  truthOrDare(type: 'truth' | 'dare', exclude: string[]) {
    return this.post<{ item: TruthOrDareItem; source: AiSource }>('/truth-or-dare/generate', { type, exclude });
  }
  judgeAnswers(secretWord: string, teamAnswers: { team_id: string; answer: string }[]) {
    return this.post<{ results: JudgeResult[] }>('/describe/judge', { secret_word: secretWord, team_answers: teamAnswers });
  }
  directMovie(situation: string, genre: string) {
    return this.post<{ movie: Movie; source: AiSource }>('/movie-director/generate', { situation, genre });
  }
  guessMovieStart(category: string, exclude: string[], maxQuestions = 5) {
    return this.post<GuessStartResponse>('/guess-movie/start', { category, exclude, max_questions: maxQuestions });
  }
  guessMovieInteract(sessionId: string, message: string, mode: 'chat' | 'clue' = 'chat') {
    return this.post<GuessInteractResponse>('/guess-movie/interact', { session_id: sessionId, message, mode });
  }
  guessMovieReveal(sessionId: string) {
    return this.post<GuessRevealResponse>('/guess-movie/reveal', { session_id: sessionId });
  }
  rapidQuestions(count: number, exclude: string[]) {
    return this.post<{ questions: RapidQuestion[]; source: AiSource }>('/rapid-fire/generate', { count, exclude });
  }
  votingPrompts(exclude: string[]) {
    return this.post<{ prompts: string[]; source: AiSource }>('/voting/generate', { exclude });
  }
  personCards(exclude: string[]) {
    return this.post<{ people: PersonCard[]; source: AiSource }>('/person/generate', { exclude });
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.http.post<T>(this.base + path, body));
    } catch (e) {
      const err = e as HttpErrorResponse;
      if (err.status === 0) throw new Error('Cannot reach the game server. Is the Flask backend running on port 5000?');
      if (err.status === 429) throw new Error('Slow down! Too many AI requests. Try again in a minute.');
      if (err.status === 503) throw new Error(err.error?.error ?? 'AI service unavailable. Check your OpenAI API key.');
      throw new Error(err.error?.error ?? 'The AI hiccuped. Please try again.');
    }
  }
}
