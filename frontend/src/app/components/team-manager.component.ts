import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SoundService } from '../services/sound.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-team-manager',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <span class="badge-pill">Step 1</span>
      <h1 class="page-title grad-text">Build Your Teams</h1>
      <p class="muted">Add up to 8 teams and their members. Everything is saved on this laptop automatically.</p>

      <div class="glass glass-pad add fade-in">
        <input class="form-control" id="input-team-name" placeholder="Team name (e.g. Byte Me)" maxlength="30" [(ngModel)]="newName" (keyup.enter)="addTeam()">
        <button class="btn-neon" id="btn-add-team" (click)="addTeam()">＋ Create Team</button>
        @if (teams.teams().length === 0) {
          <button class="btn-neon btn-cyan" id="btn-quick-teams" (click)="teams.quickStart(); sound.correct()">⚡ Quick start with 4 teams</button>
        }
      </div>
      @if (error()) { <div class="alert-neon mt-3 shake">{{ error() }}</div> }

      <div class="row g-4 mt-1">
        @for (t of teams.teams(); track t.id) {
          <div class="col-12 col-md-6 col-xl-4 col-xxl-3">
            <div class="glass glass-pad team pop-in" [style.--tc]="t.color">
              <div class="head">
                <span class="emoji">{{ t.emoji }}</span>
                @if (editing() === t.id) {
                  <input class="form-control" [(ngModel)]="editName" maxlength="30" (keyup.enter)="saveName(t.id)" (blur)="saveName(t.id)" autofocus>
                } @else {
                  <h3 (dblclick)="startEdit(t.id, t.name)" title="Double-click to rename">{{ t.name }}</h3>
                }
                <button class="x" (click)="teams.remove(t.id)" [attr.aria-label]="'Remove ' + t.name">🗑</button>
              </div>
              <ul class="members">
                @for (m of t.members; track m) {
                  <li>{{ m }}<button (click)="teams.removeMember(t.id, m)" aria-label="Remove member">×</button></li>
                } @empty { <li class="muted none">No members yet</li> }
              </ul>
              <div class="addm">
                <input class="form-control" placeholder="Add member" maxlength="30" [ngModel]="memberInputs()[t.id] ?? ''"
                       (ngModelChange)="setMember(t.id, $event)" (keyup.enter)="addMember(t.id)">
                <button class="btn-ghost" (click)="addMember(t.id)">Add</button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state"><div class="big">👥</div>No teams yet. Create your first one above!</div>
        }
      </div>

      @if (teams.teams().length > 1) {
        <div class="text-center mt-5"><a routerLink="/" class="btn-neon btn-lg-x text-decoration-none d-inline-block" id="btn-start-games">🎮 Let's Play!</a></div>
      }
    </section>
  `,
  styles: `
    .add { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem; } .add input { flex: 1; min-width: 240px; }
    .team { border-top: 4px solid var(--tc); box-shadow: 0 0 30px color-mix(in srgb, var(--tc) 25%, transparent); height: 100%; }
    .head { display: flex; align-items: center; gap: .7rem; } .head h3 { flex: 1; font-size: 1.2rem; margin: 0; cursor: text; }
    .emoji { font-size: 2rem; } .x { background: none; border: 0; color: #fff; opacity: .5; cursor: pointer; } .x:hover { opacity: 1; }
    .members { list-style: none; padding: 0; margin: 1rem 0; display: flex; flex-wrap: wrap; gap: .5rem; min-height: 36px; }
    .members li { background: color-mix(in srgb, var(--tc) 22%, transparent); border: 1px solid var(--tc); border-radius: 99px; padding: .2rem .4rem .2rem .8rem; font-size: .9rem; display: flex; gap: .4rem; align-items: center; }
    .members li button { background: none; border: 0; color: #fff; cursor: pointer; opacity: .6; } .members li button:hover { opacity: 1; }
    .members li.none { border: 0; background: none; padding: 0; }
    .addm { display: flex; gap: .5rem; }
  `,
})
export class TeamManagerComponent {
  readonly teams = inject(TeamService);
  readonly sound = inject(SoundService);
  newName = '';
  editName = '';
  readonly error = signal('');
  readonly editing = signal<string | null>(null);
  readonly memberInputs = signal<Record<string, string>>({});

  addTeam() {
    const err = this.teams.add(this.newName);
    this.error.set(err ?? '');
    if (!err) { this.newName = ''; this.sound.correct(); }
  }
  startEdit(id: string, name: string) { this.editing.set(id); this.editName = name; }
  saveName(id: string) {
    if (this.editing() !== id) return;
    this.error.set(this.teams.rename(id, this.editName) ?? '');
    this.editing.set(null);
  }
  setMember(id: string, v: string) { this.memberInputs.update((m) => ({ ...m, [id]: v })); }
  addMember(id: string) {
    const err = this.teams.addMember(id, this.memberInputs()[id] ?? '');
    this.error.set(err ?? '');
    if (!err) { this.setMember(id, ''); this.sound.click(); }
  }
}
