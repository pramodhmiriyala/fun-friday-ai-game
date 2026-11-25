import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SoundService } from '../services/sound.service';
import { TeamService } from '../services/team.service';
import { ConfirmService } from '../services/confirm.service';

@Component({
  selector: 'app-team-manager',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <div class="team-container">
        <a routerLink="/" class="back">← Arena</a>
        <div class="mt-2">
          <span class="badge-pill">Step 1</span>
        </div>
        <h1 class="page-title grad-text">Manage Your Teams</h1>
        <p class="muted">Create, edit, or delete teams and add their members. All data is saved automatically on this device.</p>

        <!-- Create Team Card -->
        <div class="glass glass-pad add fade-in mt-3">
          <input class="form-control" id="input-team-name" placeholder="Team name (e.g. Code Ninjas)" maxlength="30" [(ngModel)]="newName" (keyup.enter)="addTeam()">
          <button class="btn-neon" id="btn-add-team" (click)="addTeam()">＋ Create Team</button>
          @if (teams.teams().length === 0) {
            <button class="btn-neon btn-cyan" id="btn-quick-teams" (click)="teams.quickStart(); sound.correct()">⚡ Quick start with 4 teams</button>
          }
        </div>
        @if (error()) { <div class="alert-neon mt-3 shake">{{ error() }}</div> }

        <!-- Teams Grid -->
        <div class="row g-4 mt-2">
          @for (t of teams.teams(); track t.id) {
            <div class="col-12 col-md-6 col-xl-4 col-xxl-3">
              <div class="glass glass-pad team pop-in" [style.--tc]="t.color">
                <div class="head">
                  <span class="emoji">{{ t.emoji }}</span>

                  @if (editing() === t.id) {
                    <!-- Edit Team Name Input Mode -->
                    <div class="edit-box">
                      <input class="form-control form-control-sm" [(ngModel)]="editName" maxlength="30" (keyup.enter)="saveName(t.id)" (keyup.escape)="cancelEdit()" autofocus placeholder="New name">
                      <div class="edit-btns">
                        <button class="btn-tool btn-save" (click)="saveName(t.id)" title="Save changes">✓</button>
                        <button class="btn-tool btn-cancel" (click)="cancelEdit()" title="Cancel">✕</button>
                      </div>
                    </div>
                  } @else {
                    <!-- Normal Display Mode with Edit & Delete Buttons -->
                    <div class="name-display">
                      <h3 class="team-title" (dblclick)="startEdit(t.id, t.name)" title="Double click to edit">{{ t.name }}</h3>
                      <div class="team-actions">
                        <button class="btn-icon" (click)="startEdit(t.id, t.name)" title="Edit / Rename Team">✏️</button>
                        <button class="btn-icon text-danger" (click)="deleteTeam(t.id, t.name)" title="Delete Team">🗑️</button>
                      </div>
                    </div>
                  }
                </div>

                <div class="members-head mt-3">
                  <span class="small muted font-bold">MEMBERS ({{ t.members.length }})</span>
                </div>

                <!-- Member list -->
                <ul class="members">
                  @for (m of t.members; track m) {
                    @if (editingMember() === t.id + '|' + m) {
                      <li class="editing">
                        <input class="form-control form-control-sm" [(ngModel)]="editMemberName" maxlength="30" autofocus
                               (keyup.enter)="saveMember(t.id, m)" (keyup.escape)="cancelMember()">
                        <button (click)="saveMember(t.id, m)" aria-label="Save member name" title="Save">✓</button>
                        <button (click)="cancelMember()" aria-label="Cancel" title="Cancel">✕</button>
                      </li>
                    } @else {
                      <li><span (dblclick)="startMember(t.id, m)" title="Double click to edit">{{ m }}</span>
                        <button (click)="startMember(t.id, m)" aria-label="Edit member name" title="Edit name">✏️</button>
                        <button (click)="teams.removeMember(t.id, m)" aria-label="Remove member" title="Remove">×</button></li>
                    }
                  } @empty {
                    <li class="muted none">No members yet</li>
                  }
                </ul>

                <!-- Add member input -->
                <div class="addm mt-auto">
                  <input class="form-control form-control-sm" placeholder="Add member name" maxlength="30" [ngModel]="memberInputs()[t.id] ?? ''"
                         (ngModelChange)="setMember(t.id, $event)" (keyup.enter)="addMember(t.id)">
                  <button class="btn-ghost btn-sm-x" (click)="addMember(t.id)">＋ Add</button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state text-center py-5">
              <div class="big">👥</div>
              <h3 class="mt-2">No teams created yet</h3>
              <p class="muted">Type a team name above or use <b>Quick start</b> to jump right into the games!</p>
            </div>
          }
        </div>

        @if (teams.teams().length > 1) {
          <div class="text-center mt-5">
            <a routerLink="/" class="btn-neon btn-lg-x text-decoration-none d-inline-block" id="btn-start-games">🎮 Enter Arena with {{ teams.teams().length }} Teams!</a>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .team-container { max-width: 1400px; margin: 0 auto; width: 100%; }
    .back { color: var(--muted); text-decoration: none; font-weight: 700; font-size: .95rem; }
    .back:hover { color: #fff; }
    .add { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem; align-items: center; }
    .add input { flex: 1; min-width: 240px; }
    .team { border-top: 4px solid var(--tc); box-shadow: 0 0 30px color-mix(in srgb, var(--tc) 22%, transparent); height: 100%; display: flex; flex-direction: column; border-radius: 18px; }
    .head { display: flex; align-items: center; gap: .7rem; }
    .emoji { font-size: 2rem; flex: none; }
    .name-display { display: flex; align-items: center; justify-content: space-between; flex: 1; min-width: 0; gap: .4rem; }
    .team-title { font-size: 1.25rem; font-weight: 800; margin: 0; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .team-actions { display: flex; gap: .3rem; flex: none; }
    .btn-icon { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); border-radius: 8px; color: #fff; padding: .25rem .5rem; font-size: .85rem; cursor: pointer; transition: .2s; }
    .btn-icon:hover { background: rgba(255,255,255,.2); transform: scale(1.08); }
    .btn-icon.text-danger:hover { background: rgba(239,68,68,.3); border-color: #ef4444; }
    .edit-box { display: flex; align-items: center; gap: .4rem; flex: 1; }
    .edit-btns { display: flex; gap: .2rem; }
    .btn-tool { border: 0; border-radius: 6px; padding: .25rem .55rem; font-weight: 800; cursor: pointer; font-size: .85rem; }
    .btn-save { background: #22c55e; color: #000; }
    .btn-save:hover { background: #16a34a; }
    .btn-cancel { background: rgba(255,255,255,.2); color: #fff; }
    .btn-cancel:hover { background: rgba(255,255,255,.3); }
    .members-head { font-size: .75rem; letter-spacing: .08em; }
    .members { list-style: none; padding: 0; margin: .6rem 0 1rem; display: flex; flex-wrap: wrap; gap: .45rem; min-height: 38px; }
    .members li { background: color-mix(in srgb, var(--tc) 22%, transparent); border: 1px solid var(--tc); border-radius: 99px; padding: .2rem .4rem .2rem .8rem; font-size: .88rem; display: flex; gap: .4rem; align-items: center; font-weight: 600; }
    .members li button { background: none; border: 0; color: #fff; cursor: pointer; opacity: .6; font-size: 1rem; }
    .members li button:hover { opacity: 1; color: #f87171; }
    .members li.none { border: 0; background: none; padding: 0; font-style: italic; opacity: .7; }
    .members li.editing { padding: .1rem .3rem; } .members li.editing input { width: 130px; }
    .members li button { font-size: .8rem; }
    .addm { display: flex; gap: .5rem; }
  `,
})
export class TeamManagerComponent {
  readonly teams = inject(TeamService);
  readonly sound = inject(SoundService);
  readonly confirm = inject(ConfirmService);
  newName = '';
  editing = signal<string | null>(null);
  editName = '';
  error = signal<string | null>(null);
  memberInputs = signal<Record<string, string>>({});
  editingMember = signal<string | null>(null);
  editMemberName = '';

  startMember(id: string, name: string) {
    this.sound.click();
    this.error.set(null);
    this.editingMember.set(id + '|' + name);
    this.editMemberName = name;
  }

  cancelMember() { this.editingMember.set(null); this.editMemberName = ''; this.error.set(null); }

  saveMember(id: string, oldName: string) {
    const err = this.teams.renameMember(id, oldName, this.editMemberName);
    if (err) { this.error.set(err); this.sound.wrong(); return; }
    this.cancelMember();
    this.sound.correct();
  }

  addTeam() {
    this.error.set(null);
    const err = this.teams.add(this.newName);
    if (err) {
      this.error.set(err);
      this.sound.wrong();
    } else {
      this.newName = '';
      this.sound.click();
    }
  }

  startEdit(id: string, name: string) {
    this.sound.click();
    this.error.set(null);
    this.editing.set(id);
    this.editName = name;
  }

  cancelEdit() {
    this.editing.set(null);
    this.editName = '';
    this.error.set(null);
  }

  saveName(id: string) {
    if (!this.editing()) return;
    const err = this.teams.rename(id, this.editName);
    if (err) {
      this.error.set(err);
      this.sound.wrong();
    } else {
      this.editing.set(null);
      this.editName = '';
      this.sound.correct();
    }
  }

  async deleteTeam(id: string, name: string) {
    const ok = await this.confirm.ask(`"${name}" and its members will be removed.`, {
      title: 'Delete this team?', confirmLabel: '🗑️ Delete', icon: '🗑️',
    });
    if (ok) {
      this.teams.remove(id);
      this.sound.click();
      if (this.editing() === id) {
        this.cancelEdit();
      }
    }
  }

  setMember(id: string, val: string) {
    this.memberInputs.update((m) => ({ ...m, [id]: val }));
  }

  addMember(id: string) {
    this.error.set(null);
    const name = this.memberInputs()[id] ?? '';
    const err = this.teams.addMember(id, name);
    if (err) {
      this.error.set(err);
      this.sound.wrong();
    } else {
      this.setMember(id, '');
      this.sound.click();
    }
  }
}
