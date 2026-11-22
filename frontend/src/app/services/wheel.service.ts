import { Injectable, signal } from '@angular/core';
import { BONUS_CHALLENGES, GAMES } from '../core/games.data';
import { persisted, secureRandomInt } from '../core/store';
import { ConfettiService } from './confetti.service';
import { SoundService } from './sound.service';
import { TeamService } from './team.service';

export type WheelMode = 'teams' | 'games' | 'bonus';
export interface WheelItem { label: string; color: string; icon?: string; ref?: string; pts?: number; }
export interface WheelResult { mode: WheelMode; item: WheelItem; ts: number; }

const COLORS = ['#a855f7', '#3b82f6', '#ec4899', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#6366f1', '#14b8a6'];

@Injectable({ providedIn: 'root' })
export class WheelService {
  readonly lastResult = persisted<WheelResult | null>('wheelResult', null);
  readonly spinning = signal(false);

  constructor(private teams: TeamService, private sound: SoundService, private confetti: ConfettiService) {}

  items(mode: WheelMode): WheelItem[] {
    if (mode === 'teams')
      return this.teams.teams().map((t) => ({ label: t.name, color: t.color, icon: t.emoji, ref: t.id }));
    if (mode === 'games')
      return GAMES.map((g, i) => ({ label: g.title.replace('Describe It Without Saying It', 'Describe It'), color: COLORS[i % COLORS.length], icon: g.icon, ref: g.route }));
    return BONUS_CHALLENGES.map((b, i) => ({ label: `${b.pts} pts`, color: COLORS[i % COLORS.length], icon: b.icon, ref: b.text, pts: b.pts }));
  }

  /** Pick the winner with crypto randomness BEFORE animating, so the result is fair. */
  pick(mode: WheelMode): number {
    const n = this.items(mode).length;
    return n ? secureRandomInt(n) : -1;
  }

  finish(mode: WheelMode, item: WheelItem) {
    this.lastResult.set({ mode, item, ts: Date.now() });
    if (mode === 'teams' && item.ref) this.teams.setActive(item.ref);
    this.sound.win();
    this.confetti.burst(0.5, 0.45, 180);
  }
}
