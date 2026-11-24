import { Injectable, signal } from '@angular/core';
import { persisted } from '../core/store';
import { AiApiService, AiSource, Movie } from './ai-api.service';
import { SoundService } from './sound.service';
import { TeamService } from './team.service';

export const GENRES = [
  { name: 'Comedy',   icon: '😂', color: '#facc15' },
  { name: 'Action',   icon: '💥', color: '#f97316' },
  { name: 'Thriller', icon: '🕵️', color: '#6366f1' },
  { name: 'Horror',   icon: '👻', color: '#ef4444' },
  { name: 'Sci-Fi',   icon: '🛸', color: '#22d3ee' },
  { name: 'Drama',    icon: '🎭', color: '#ec4899' },
];

export interface Scene {
  id: number;
  situation: string;
  genre: string;
  movie: Movie;
  source: AiSource;
}

interface DirectorState {
  current: Scene | null;
  seq: number;
}

@Injectable({ providedIn: 'root' })
export class MovieDirectorService {
  readonly state = persisted<DirectorState>('director_v2', { current: null, seq: 0 });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private api: AiApiService,
    private team: TeamService,
    private sound: SoundService,
  ) {}

  validate(situation: string, genre: string | null): string | null {
    const s = situation.trim();
    if (s.length < 5) return 'Describe the situation in at least 5 characters.';
    if (s.length > 300) return 'Keep the situation under 300 characters.';
    if (!genre) return 'Pick a genre!';
    return null;
  }

  async generate(situation: string, genre: string) {
    const bad = this.validate(situation, genre);
    if (bad) { this.error.set(bad); return; }
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.sound.drumroll();
    try {
      const r = await this.api.directMovie(situation.trim(), genre);
      const scene: Scene = {
        id: this.state().seq + 1,
        situation: situation.trim(),
        genre,
        movie: r.movie,
        source: r.source,
      };
      this.state.update((s) => ({ ...s, current: scene, seq: scene.id }));
      this.sound.reveal();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  newScene() {
    this.sound.click();
    this.state.update((s) => ({ ...s, current: null }));
  }

  resetGame() {
    this.state.update(() => ({ current: null, seq: 0 }));
  }
}
