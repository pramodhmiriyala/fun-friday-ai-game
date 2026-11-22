import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GAME_LABELS, ScoringService } from '../services/scoring.service';
import { SoundService } from '../services/sound.service';
import { TeamService } from '../services/team.service';

/** Award / deduct points manually (host tool). */
@Component({
  selector: 'app-score-panel',
  imports: [FormsModule],
  template: `
    <div class="glass glass-pad">
      <h3 class="h5">🎯 Score Control</h3>
      @for (t of teams.teams(); track t.id) {
        <div class="line" [style.--tc]="t.color">
          <span class="n">{{ t.emoji }} {{ t.name }} <b>{{ scoring.total(t.id) }}</b></span>
          <span class="b">
            @for (p of [-10, -5, 5, 10]; track p) {
              <button class="btn-ghost btn-sm-x" [class.neg]="p < 0" (click)="give(t.id, p)" [id]="'score-' + t.id + '-' + p">{{ p > 0 ? '+' : '' }}{{ p }}</button>
            }
          </span>
        </div>
      } @empty { <p class="muted mb-0">Add teams to manage scores.</p> }
      @if (teams.teams().length) {
        <div class="custom mt-3">
          <select class="form-select" [(ngModel)]="customTeam" id="score-custom-team">
            <option [ngValue]="''">Team…</option>
            @for (t of teams.teams(); track t.id) { <option [ngValue]="t.id">{{ t.name }}</option> }
          </select>
          <input class="form-control" type="number" [(ngModel)]="customPts" min="-1000" max="1000" placeholder="± pts" id="score-custom-pts">
          <button class="btn-neon btn-sm-x" (click)="giveCustom()" id="score-custom-go">Apply</button>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn-ghost btn-sm-x" (click)="scoring.undoLast(); sound.click()" [disabled]="!scoring.entries().length" id="score-undo">↩ Undo last</button>
        </div>
        @if (scoring.recent().length) {
          <ul class="log">
            @for (e of scoring.recent().slice(0, 5); track e.id) {
              <li><b [class.neg]="e.points < 0">{{ e.points > 0 ? '+' : '' }}{{ e.points }}</b> {{ teams.get(e.teamId)?.name }} · {{ label(e.game) }}</li>
            }
          </ul>
        }
      }
    </div>
  `,
  styles: `
    .line { display: flex; justify-content: space-between; align-items: center; gap: .5rem; padding: .5rem 0; border-bottom: 1px solid rgba(255,255,255,.08); flex-wrap: wrap; }
    .n b { color: var(--tc); margin-left: .4rem; } .b { display: flex; gap: .3rem; }
    .neg { color: #fca5a5; } .custom { display: grid; grid-template-columns: 1fr 100px auto; gap: .5rem; }
    .log { list-style: none; padding: 0; margin: .8rem 0 0; font-size: .85rem; color: var(--muted); } .log b { color: #86efac; } .log b.neg { color: #fca5a5; }
  `,
})
export class ScorePanelComponent {
  readonly teams = inject(TeamService);
  readonly scoring = inject(ScoringService);
  readonly sound = inject(SoundService);
  customTeam = '';
  customPts: number | null = null;
  readonly err = signal('');

  label(k: string) { return GAME_LABELS[k] ?? k; }
  give(id: string, p: number) {
    this.scoring.award(id, p, 'manual', 'Host adjustment');
    p > 0 ? this.sound.correct() : this.sound.wrong();
  }
  giveCustom() {
    if (!this.customTeam || !this.customPts) return;
    this.give(this.customTeam, Number(this.customPts));
    this.customPts = null;
  }
}
