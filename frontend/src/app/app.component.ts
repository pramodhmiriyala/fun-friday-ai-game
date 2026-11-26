import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AnimatedBgComponent } from './components/animated-bg.component';
import { AiApiService } from './services/ai-api.service';
import { SoundService } from './services/sound.service';
import { TeamService } from './services/team.service';
import { HostAuthService } from './services/host-auth.service';
import { HostLoginModalComponent } from './components/host-login-modal.component';
import { ConfirmDialogComponent } from './components/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AnimatedBgComponent, HostLoginModalComponent, ConfirmDialogComponent],
  template: `
    <app-animated-bg />
    <nav class="nav glass" aria-label="Main">
      <a routerLink="/" class="brand" id="nav-brand"><span class="logo">🎮</span><span class="display grad-text">FUN CONNECT</span></a>
      <div class="links">
        <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }" id="nav-home">Home</a>
        <a routerLink="/teams" routerLinkActive="on" id="nav-teams">Teams</a>
        <a routerLink="/guide" routerLinkActive="on" id="nav-guide">📖 Game Guide</a>
        <a routerLink="/wheel" routerLinkActive="on" id="nav-wheel">Spin Wheel</a>
        <a routerLink="/leaderboard" routerLinkActive="on" id="nav-leaderboard">Leaderboard</a>
        <a routerLink="/host" routerLinkActive="on" id="nav-host">Host</a>
      </div>
      <div class="right">
        @if (team.activeTeam(); as t) {
          <span class="team-chip" [style.--tc]="t.color" title="Active team">{{ t.emoji }} {{ t.name }}</span>
        }
        <button class="btn-ghost sound-btn"
                [class.active]="sound.bgmPlaying()"
                (click)="sound.toggleBgm()"
                [title]="sound.bgmPlaying() ? 'Mute Background Music' : 'Play Background Music'">
          {{ sound.bgmPlaying() ? '🎵 Music On' : '🔇 Music Off' }}
        </button>
        <button class="btn-ghost sound-btn" id="btn-music-style" (click)="sound.cycleBgmStyle()"
                title="Change music style">{{ sound.styleInfo().icon }} {{ sound.styleInfo().label }}</button>
        @if (auth.isHost()) {
          <button class="btn-ghost sound-btn" id="btn-host-logout" (click)="auth.logout()" title="Host logged in – click to log out">🔓 Host</button>
        }
        <button class="btn-ghost sound-btn" id="btn-sound" (click)="sound.toggle(); sound.click()" [attr.aria-label]="sound.muted() ? 'Unmute' : 'Mute'" title="Sound Effects">
          {{ sound.muted() ? '🔇 SFX Off' : '🔊 SFX' }}
        </button>
        <span class="dot" [class.ok]="api.online()" [class.bad]="api.online() === false"
              [title]="api.online() ? (api.aiEnabled() ? 'Server online · AI ready' : 'Server online · using built-in content (no API key)') : 'Backend offline'"></span>
      </div>
    </nav>
    <main><router-outlet /></main>
    <app-host-login-modal />
    <app-confirm-dialog />
  `,
  styles: `
    .nav { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); width: min(1500px, calc(100% - 28px));
      z-index: 100; display: flex; align-items: center; gap: 1.5rem; padding: .6rem 1.2rem; border-radius: 18px; }
    .brand { display: flex; align-items: center; gap: .6rem; text-decoration: none; font-size: 1.25rem; font-weight: 900; }
    .logo { font-size: 1.6rem; filter: drop-shadow(0 0 10px var(--purple)); }
    .links { display: flex; gap: .3rem; flex: 1; }
    .links a { color: var(--muted); text-decoration: none; padding: .45rem .95rem; border-radius: 10px; font-weight: 600; transition: .25s; }
    .links a:hover { color: #fff; background: rgba(255,255,255,.08); }
    .links a.on { color: #fff; background: var(--grad); box-shadow: 0 0 16px rgba(168,85,247,.6); }
    .right { display: flex; align-items: center; gap: .6rem; }
    .sound-btn { font-size: .8rem; padding: .35rem .75rem; border-radius: 999px; }
    .team-chip { font-size: .85rem; font-weight: 800; padding: .35rem .85rem; border-radius: 999px;
      background: color-mix(in srgb, var(--tc) 20%, transparent); border: 1.5px solid var(--tc); color: #fff; }
    .dot { width: 11px; height: 11px; border-radius: 50%; background: #64748b; }
    .dot.ok { background: #22c55e; box-shadow: 0 0 10px #22c55e; }
    .dot.bad { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
    @media (max-width: 900px) { .links { display: none; } .nav { justify-content: space-between; } }
  `,
})
export class AppComponent implements OnInit {
  readonly api = inject(AiApiService);
  readonly sound = inject(SoundService);
  readonly team = inject(TeamService);
  readonly auth = inject(HostAuthService);

  ngOnInit() {
    this.api.health();
  }
}
