import { Injectable, computed } from '@angular/core';
import { persisted, uid } from '../core/store';
import { TeamService } from './team.service';

export interface ScoreEntry {
  id: string;
  teamId: string;
  game: string;
  points: number;
  reason: string;
  ts: number;
}

export interface Standing {
  teamId: string;
  total: number;
  byGame: Record<string, number>;
  rank: number;
}

export const GAME_LABELS: Record<string, string> = {
  describe: 'Describe It', director: 'Movie Director', guess: 'Guess the Movie',
  rapid: 'Rapid Fire', voting: 'Team Voting', puzzle: 'Picture Puzzle', person: 'Who Am I?', panic: 'Panic Defuse', nolaugh: 'Do Not Laugh',
  wheel: 'Bonus Wheel', tod: 'Truth or Dare', manual: 'Host Adjust',
};

@Injectable({ providedIn: 'root' })
export class ScoringService {
  readonly entries = persisted<ScoreEntry[]>('scores', []);
  readonly lastAward = persisted<{ teamId: string; points: number; ts: number } | null>('lastAward', null);

  constructor(private teams: TeamService) {}

  readonly standings = computed<Standing[]>(() => {
    const list = this.teams.teams().map((t) => {
      const byGame: Record<string, number> = {};
      let total = 0;
      for (const e of this.entries()) {
        if (e.teamId !== t.id) continue;
        total += e.points;
        byGame[e.game] = (byGame[e.game] ?? 0) + e.points;
      }
      return { teamId: t.id, total, byGame, rank: 0 };
    });
    list.sort((a, b) => b.total - a.total || this.teams.get(a.teamId)!.name.localeCompare(this.teams.get(b.teamId)!.name));
    let prev = Number.NaN, rank = 0;
    list.forEach((s, i) => { if (s.total !== prev) { rank = i + 1; prev = s.total; } s.rank = rank; });
    return list;
  });

  readonly recent = computed(() => [...this.entries()].reverse().slice(0, 12));

  total(teamId: string) { return this.standings().find((s) => s.teamId === teamId)?.total ?? 0; }

  award(teamId: string | null | undefined, points: number, game: string, reason = ''): boolean {
    const targetId = teamId || this.teams.activeTeam()?.id;
    if (!targetId || !this.teams.get(targetId) || !Number.isFinite(points) || points === 0) return false;
    const p = Math.max(-1000, Math.min(1000, Math.round(points)));
    this.entries.update((l) => [...l, { id: uid(), teamId: targetId, game, points: p, reason, ts: Date.now() }].slice(-500));
    this.lastAward.set({ teamId: targetId, points: p, ts: Date.now() });
    return true;
  }

  undoLast() { this.entries.update((l) => l.slice(0, -1)); }
  resetScores() { this.entries.set([]); this.lastAward.set(null); }
}
