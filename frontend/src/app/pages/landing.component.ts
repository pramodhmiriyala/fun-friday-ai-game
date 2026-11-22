import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GAMES } from '../core/games.data';
import { GameCardComponent } from '../components/game-card.component';
import { LeaderboardComponent } from '../components/leaderboard.component';
import { TeamService } from '../services/team.service';
import { SoundService } from '../services/sound.service';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, GameCardComponent, LeaderboardComponent],
  template: `
    <!-- ═══════════ HERO ═══════════ -->
    <header class="hero">
      <div class="spots"><i></i><i></i><i></i></div>
      <span class="badge-pill fade-in">🤖 AI-Powered · Friday Edition · Live Game Show</span>
      <h1 class="title display fade-in" style="animation-delay:.1s">
        <span class="grad-text glitch" data-t="FUN FRIDAY">FUN FRIDAY</span>
        <span class="sub">– Forget the Deadlines, It's Game Time!</span>
      </h1>
      <p class="lead muted fade-in" style="animation-delay:.25s">
        5 AI-powered games · Spinning wheel of fate · Live leaderboard — all on one big screen.<br>
        <b class="text-white">Fresh content every Friday — no two games are the same!</b>
      </p>
      <div class="cta fade-in" style="animation-delay:.4s">
        @if (teams.teams().length < 2) {
          <a routerLink="/teams" class="btn-neon btn-lg-x pulse" id="cta-teams" (click)="sound.click()">👥 Create Teams to Begin</a>
        } @else {
          <a href="#arena" class="btn-neon btn-lg-x pulse" id="cta-play" (click)="sound.click()">🚀 Enter the Arena</a>
          <a routerLink="/wheel" class="btn-neon btn-pink btn-lg-x" id="cta-wheel">🎡 Spin the Wheel</a>
        }
        <a routerLink="/host" class="btn-ghost btn-lg-x" id="cta-host">🎛 Host Dashboard</a>
      </div>
    </header>

    <!-- ═══════════ AI GAME ARENA — all 5 games in a clean row ═══════════ -->
    <section class="page sec" id="arena">
      <div class="sec-head">
        <span class="badge-pill ai-badge">🤖 All Powered by GPT-4o-mini</span>
        <h2 class="grad-text">AI Game Arena</h2>
        <p class="muted">5 AI-powered games. Fresh content every round. Click any game to start!</p>
      </div>

      <!-- 5 Games Row -->
      <div class="games-row">
        @for (g of allGames; track g.id) {
          <div class="game-item fade-in" [style.animation-delay.s]="$index * 0.08">
            <app-game-card [game]="g" />
          </div>
        }
      </div>

      <!-- Leaderboard + Wheel Row -->
      <div class="row g-4 mt-5">
        <div class="col-12 col-lg-7">
          <div class="glass glass-pad h-100">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 class="h4 mb-0">🏆 Live Leaderboard</h3>
              <a routerLink="/leaderboard" class="btn-ghost btn-sm-x text-decoration-none" id="link-board">Full screen</a>
            </div>
            <app-leaderboard [compact]="true" />
          </div>
        </div>
        <div class="col-12 col-lg-5">
          <div class="glass glass-pad h-100 wheelbox text-center">
            <div class="wheel-ic">🎡</div>
            <h3>Can't decide what's next?</h3>
            <p class="muted">Use the <b>Spinner</b> to randomly pick the next team, game, or wild bonus challenge!</p>
            <div class="spin-tips">
              <span>👥 Pick a Team</span>
              <span>🎮 Pick a Game</span>
              <span>🎁 Bonus Challenge</span>
            </div>
            <a routerLink="/wheel" class="btn-neon btn-pink text-decoration-none d-inline-block mt-3" id="link-wheel">Spin the Wheel</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    /* Hero */
    .hero { position: relative; min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 5rem 1.5rem 2rem; z-index: 2; }
    .spots { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .spots i { position: absolute; top: -10%; width: 220px; height: 130%; background: linear-gradient(180deg, rgba(168,85,247,.45), transparent 70%); transform-origin: top center; filter: blur(22px); animation: sweep 7s ease-in-out infinite alternate; }
    .spots i:nth-child(1) { left: 18%; }
    .spots i:nth-child(2) { left: 48%; background: linear-gradient(180deg, rgba(59,130,246,.45), transparent 70%); animation-delay: -2s; }
    .spots i:nth-child(3) { right: 15%; background: linear-gradient(180deg, rgba(236,72,153,.45), transparent 70%); animation-delay: -4s; }
    @keyframes sweep { from { transform: rotate(-22deg); } to { transform: rotate(22deg); } }
    .title { position: relative; font-weight: 900; margin: 1rem 0; line-height: 1.1; }
    .glitch { display: block; font-size: clamp(3rem, 9vw, 7.5rem); filter: drop-shadow(0 0 30px rgba(168,85,247,.7)); animation: gradMove 6s linear infinite, titleGlow 3s ease-in-out infinite alternate; }
    @keyframes titleGlow { to { filter: drop-shadow(0 0 60px rgba(236,72,153,.9)); } }
    .sub { display: block; font-size: clamp(1rem, 2.5vw, 2rem); color: #fff; font-weight: 700; margin-top: .5rem; text-shadow: 0 0 24px rgba(59,130,246,.9); }
    .lead { font-size: clamp(1rem, 1.4vw, 1.35rem); max-width: 760px; }
    .cta { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 1.8rem; }
    .cta a { text-decoration: none; }

    /* Sections */
    .sec { padding-top: 2rem; padding-bottom: 3rem; }
    .sec-head { text-align: center; margin-bottom: 2rem; }
    .sec-head h2 { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 900; margin: .5rem 0 .2rem; }
    .ai-badge { background: linear-gradient(135deg, rgba(168,85,247,.3), rgba(59,130,246,.3)); border-color: rgba(168,85,247,.5); }

    /* 5 Games in a single clean row on desktop */
    .games-row {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 1.1rem;
      align-items: stretch;
    }
    @media (max-width: 1200px) {
      .games-row {
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1.2rem;
      }
    }
    .game-item { display: flex; flex-direction: column; }

    /* Wheel box */
    .wheel-ic { font-size: 4rem; animation: spin 8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .wheelbox { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .spin-tips { display: flex; gap: .5rem; flex-wrap: wrap; justify-content: center; margin-top: .5rem; }
    .spin-tips span { font-size: .78rem; font-weight: 700; padding: .2rem .6rem; border-radius: 99px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); }
  `,
})
export class LandingComponent {
  readonly teams = inject(TeamService);
  readonly sound = inject(SoundService);
  readonly allGames = GAMES;
}
