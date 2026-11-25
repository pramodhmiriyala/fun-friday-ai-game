import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScoringService } from '../services/scoring.service';
import { SoundService } from '../services/sound.service';
import { TeamService } from '../services/team.service';

/** Minimal, clear team name + score management component for the Host. */
@Component({
  selector: 'app-score-panel',
  imports: [RouterLink],
  template: `
    <div class="glass glass-pad scores-card">
      <div class="d-flex justify-content-between align-items-center mb-3 pb-2 score-head">
        <div>
          <h2 class="h4 mb-0 grad-text">🎯 Team Scores</h2>
          <p class="muted small mb-0">Live team scores — click + / - to adjust points.</p>
        </div>
        <a routerLink="/teams" class="btn-ghost btn-sm-x text-decoration-none" title="Add or edit teams">👥 Manage Teams</a>
      </div>

      @for (t of teams.teams(); track t.id) {
        <div class="line" [style.--tc]="t.color">
          <div class="n">
            <span class="emoji">{{ t.emoji }}</span>
            <span class="team-name">{{ t.name }}</span>
            @if (t.members.length) {
              <span class="muted small d-none d-md-inline">({{ t.members.length }} members)</span>
            }
          </div>
          <div class="score-actions">
            <b class="score-num">{{ scoring.total(t.id) }} <span class="pts-unit">pts</span></b>
            <div class="b">
              @for (p of [-10, -5, 5, 10]; track p) {
                <button class="btn-ghost btn-sm-x" [class.neg]="p < 0" (click)="give(t.id, p)" [id]="'score-' + t.id + '-' + p">
                  {{ p > 0 ? '+' : '' }}{{ p }}
                </button>
              }
            </div>
          </div>
        </div>
      } @empty {
        <div class="text-center py-4">
          <p class="muted mb-2">No teams created yet.</p>
          <a routerLink="/teams" class="btn-neon btn-sm text-decoration-none">＋ Create Teams</a>
        </div>
      }
    </div>
  `,
  styles: `
    .scores-card { border-radius: 16px; }
    .score-head { border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
    .line { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .75rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); flex-wrap: wrap; }
    .line:last-child { border-bottom: none; }
    .n { display: flex; align-items: center; gap: .6rem; font-size: 1.05rem; }
    .emoji { font-size: 1.3rem; }
    .team-name { font-weight: 700; color: #fff; }
    .score-actions { display: flex; align-items: center; gap: .9rem; }
    .score-num { color: var(--tc, #38bdf8); font-size: 1.25rem; font-weight: 800; min-width: 70px; text-align: right; }
    .pts-unit { font-size: .8rem; font-weight: 500; opacity: .75; }
    .b { display: flex; gap: .35rem; }
    .btn-sm-x { padding: .25rem .55rem; font-size: .82rem; min-width: 36px; border-radius: 8px; font-weight: 600; }
    .neg { color: #fca5a5; }
    .neg:hover { background: rgba(239, 68, 68, 0.25); color: #fecaca; }
  `,
})
export class ScorePanelComponent {
  readonly teams = inject(TeamService);
  readonly scoring = inject(ScoringService);
  readonly sound = inject(SoundService);

  give(id: string, p: number) {
    this.scoring.award(id, p, 'manual', 'Host adjustment');
    p > 0 ? this.sound.correct() : this.sound.wrong();
  }
}
