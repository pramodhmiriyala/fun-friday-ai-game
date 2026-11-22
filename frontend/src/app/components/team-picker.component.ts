import { Component, inject } from '@angular/core';
import { TeamService } from '../services/team.service';
import { SoundService } from '../services/sound.service';

/** Pick which team is currently "on stage". Shared by all games. */
@Component({
  selector: 'app-team-picker',
  template: `
    <div class="picker">
      <span class="lbl">Team on stage:</span>
      @for (t of teams.teams(); track t.id) {
        <button class="btn-ghost" [class.active]="t.id === teams.activeTeamId()" [style.--tc]="t.color"
                (click)="teams.setActive(t.id); sound.click()" [id]="'pick-' + t.id">{{ t.emoji }} {{ t.name }}</button>
      } @empty {
        <span class="muted">No teams yet — add some on the Teams page.</span>
      }
    </div>
  `,
  styles: `.picker { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; } .lbl { color: var(--muted); font-weight: 600; margin-right: .3rem; }`,
})
export class TeamPickerComponent {
  readonly teams = inject(TeamService);
  readonly sound = inject(SoundService);
}
