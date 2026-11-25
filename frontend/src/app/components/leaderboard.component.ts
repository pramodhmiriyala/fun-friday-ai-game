import { Component, computed, inject, input } from '@angular/core';
import { GAME_LABELS, ScoringService } from '../services/scoring.service';
import { TeamService } from '../services/team.service';
import { CountUpComponent } from './count-up.component';

/** Live animated leaderboard: rows slide to their new rank when scores change. */
@Component({
  selector: 'app-leaderboard',
  imports: [CountUpComponent],
  template: `
    <div class="board" [style.height.px]="rows().length * pitch() || 120">
      @for (r of rows(); track r.team.id) {
        <div class="lb-row glass" [style.transform]="'translateY(' + $index * pitch() + 'px)'" [style.--tc]="r.team.color"
             [class.top]="r.rank === 1 && r.total > 0" [class.flash]="flashId() === r.team.id" [class.compact]="compact()">
          <div class="rank display">{{ r.rank === 1 && r.total > 0 ? '👑' : r.rank }}</div>
          <div class="emoji">{{ r.team.emoji }}</div>
          <div class="info">
            <div class="name">{{ r.team.name }}</div>
            @if (!compact()) {
              <div class="chips">
                @for (g of r.games; track g.key) { <span class="chip">{{ g.label }} <b>{{ g.pts }}</b></span> }
              </div>
            }
          </div>
          <div class="pts display"><app-count-up [value]="r.total" /><small>pts</small></div>
          <div class="bar" [style.width.%]="r.pct"></div>
        </div>
      } @empty {
        <div class="empty-state"><div class="big">🏆</div>Create teams to start the race!</div>
      }
    </div>
  `,
  styles: `
    .board { position: relative; transition: height .4s; }
    .lb-row { position: absolute; left: 0; right: 0; height: 76px; display: flex; flex-wrap: nowrap; align-items: center; gap: 1rem; padding: 0 1.3rem; margin: 0;
      transition: transform .9s cubic-bezier(.3,1.2,.4,1), box-shadow .4s; overflow: hidden; border-left: 5px solid var(--tc); }
    .lb-row > * { width: auto; max-width: none; flex-shrink: 0; padding: 0; }
    .lb-row > .info { flex: 1 1 0; min-width: 0; flex-shrink: 1; }
    .lb-row > .bar { position: absolute; }
    .lb-row.compact { height: 58px; gap: .7rem; padding: 0 1rem; }
    .lb-row.top { box-shadow: 0 0 36px rgba(250,204,21,.45); border-color: rgba(250,204,21,.6); }
    .lb-row.flash { animation: flash 1.2s; }
    @keyframes flash { 30% { box-shadow: 0 0 50px var(--tc); background: color-mix(in srgb, var(--tc) 35%, transparent); } }
    .rank { font-size: 1.5rem; font-weight: 900; width: 44px; text-align: center; }
    .emoji { font-size: 1.9rem; }
    .compact .emoji { font-size: 1.4rem; } .compact .rank { font-size: 1.1rem; width: 32px; }
    .info { flex: 1; min-width: 0; }
    .name { font-weight: 800; font-size: 1.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .compact .name { font-size: 1rem; }
    .chips { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: 2px; }
    .chip { font-size: .72rem; color: var(--muted); background: rgba(255,255,255,.07); padding: 1px 8px; border-radius: 99px; }
    .chip b { color: #fff; }
    .pts { font-size: 1.9rem; font-weight: 900; color: #fff; text-shadow: 0 0 18px var(--tc); }
    .compact .pts { font-size: 1.3rem; }
    .pts small { font-size: .75rem; color: var(--muted); margin-left: 4px; }
    .bar { position: absolute; bottom: 0; left: 0; height: 4px; background: var(--tc); box-shadow: 0 0 12px var(--tc); transition: width 1s; }
  `,
})
export class LeaderboardComponent {
  private scoring = inject(ScoringService);
  private teams = inject(TeamService);
  readonly compact = input(false);
  readonly pitch = computed(() => (this.compact() ? 66 : 88));

  readonly flashId = computed(() => {
    const a = this.scoring.lastAward();
    return a && Date.now() - a.ts < 2500 ? a.teamId : null;
  });

  readonly rows = computed(() => {
    const st = this.scoring.standings();
    const max = Math.max(1, ...st.map((s) => s.total));
    return st.map((s) => ({
      team: this.teams.get(s.teamId)!, total: s.total, rank: s.rank, pct: Math.max(0, (s.total / max) * 100),
      games: Object.entries(s.byGame).filter(([, v]) => v !== 0).map(([k, v]) => ({ key: k, label: GAME_LABELS[k] ?? k, pts: v })),
    }));
  });
}
