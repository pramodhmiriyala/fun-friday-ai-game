import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ScorePanelComponent } from '../components/score-panel.component';
import { AiApiService } from '../services/ai-api.service';
import { HostAuthService } from '../services/host-auth.service';
import { ScoringService } from '../services/scoring.service';
import { TeamService } from '../services/team.service';
import { ConfirmService } from '../services/confirm.service';

@Component({
  selector: 'app-host-dashboard',
  imports: [FormsModule, RouterLink, ScorePanelComponent],
  template: `
    @if (!auth.isHost()) {
      <!-- ───────── Host login ───────── -->
      <section class="page host">
        <div class="glass glass-pad login-card pop-in">
          <div class="lock">🔐</div>
          <h1 class="h3 grad-text mt-2">Host Dashboard</h1>
          <p class="muted">Sign in with the host password to manage scores and tournament controls.</p>
          <input class="form-control" type="password" placeholder="Host password" [(ngModel)]="pw"
                 (keyup.enter)="login()" id="dash-host-password" autofocus>
          @if (auth.error()) { <div class="alert-neon mt-2 py-1 small">{{ auth.error() }}</div> }
          <button class="btn-neon mt-3 w-100" (click)="login()" [disabled]="auth.busy() || !pw.trim()" id="dash-host-login">
            {{ auth.busy() ? 'Checking…' : '🔓 Sign in' }}
          </button>
        </div>
      </section>
    } @else {
      <section class="page host">
        <div class="host-container">
          <a routerLink="/" class="back mb-3 d-inline-block">← Back to Arena</a>

          <!-- ───────── Header ───────── -->
          <div class="glass glass-pad mb-4">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <span class="badge-pill mb-1">Host Controls</span>
                <h1 class="page-title grad-text mb-1">Host Dashboard</h1>
                <div class="muted small d-flex align-items-center gap-2">
                  <span class="dot" [class.ok]="api.online()" [class.bad]="!api.online()"></span>
                  <span>{{ api.online() ? 'Server online' : 'Server offline' }} · {{ api.aiEnabled() ? 'AI active' : 'built-in content' }}</span>
                  <button class="link-btn" (click)="api.health()" id="btn-health" title="Refresh server status">↻</button>
                </div>
              </div>
              <div class="d-flex gap-2 flex-wrap align-items-center">
                <a routerLink="/leaderboard" class="btn-neon btn-gold text-decoration-none" id="btn-host-board">📊 Leaderboard</a>
                <a routerLink="/winner" class="btn-neon btn-pink text-decoration-none" id="btn-host-winner">🏆 Crown Winner</a>
                <button class="btn-ghost" (click)="auth.logout()" id="btn-dash-logout">Log out</button>
              </div>
            </div>
          </div>

          <!-- ───────── Team Scores (Simple & Short) ───────── -->
          <div class="mb-4">
            <app-score-panel />
          </div>

          <!-- ───────── Danger Zone / Reset options ───────── -->
          <details class="glass glass-pad danger">
            <summary class="muted">⚠ Tournament Reset Options</summary>
            <div class="d-flex flex-wrap gap-2 mt-3 pt-2 border-top border-secondary border-opacity-25">
              <button class="btn-ghost btn-sm-x" (click)="confirmThen('Reset all team scores to zero?', resetScores)" id="btn-reset-scores">Reset scores</button>
              <button class="btn-ghost btn-sm-x text-danger" (click)="confirmThen('Delete EVERYTHING (teams + scores)?', resetAll)" id="btn-reset-all">New tournament</button>
            </div>
          </details>
        </div>
      </section>
    }
  `,
  styles: `
    .host-container { max-width: 900px; margin: 0 auto; }
    .back { font-size: .88rem; color: var(--muted); text-decoration: none; }
    .back:hover { color: var(--text); }
    .badge-pill { display: inline-block; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; padding: .15rem .6rem; border-radius: 99px; background: rgba(168,85,247,.2); color: #d8b4fe; border: 1px solid rgba(168,85,247,.4); }
    .login-card { max-width: 420px; margin: 12vh auto 0; text-align: center; }
    .lock { font-size: 3rem; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f87171; }
    .dot.ok { background: #4ade80; box-shadow: 0 0 8px #4ade80; }
    .link-btn { background: none; border: 0; color: var(--cyan); cursor: pointer; font-size: .85rem; padding: 0 4px; }
    details.danger summary { cursor: pointer; font-weight: 600; font-size: .9rem; }
  `,
})
export class HostDashboardComponent {
  readonly api = inject(AiApiService);
  readonly auth = inject(HostAuthService);
  private confirm = inject(ConfirmService);
  private teams = inject(TeamService);
  private scoring = inject(ScoringService);
  pw = '';

  async login() {
    if (await this.auth.login(this.pw)) this.pw = '';
  }

  async confirmThen(msg: string, fn: () => void) {
    const ok = await this.confirm.ask(msg, { title: 'Tournament Reset', confirmLabel: 'Proceed', icon: '⚠' });
    if (ok) fn.call(this);
  }

  resetScores() { this.scoring.resetScores(); }
  resetAll() { this.resetScores(); this.teams.clear(); }
}
