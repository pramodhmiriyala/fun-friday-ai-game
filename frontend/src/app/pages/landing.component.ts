import { Component, OnInit, inject, signal } from '@angular/core';
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
    <!-- ═══════════ CINEMA THEATER CURTAIN OPENING OVERLAY ═══════════ -->
    @if (!curtainsDismissed()) {
      <div class="cinema-curtain-overlay" [class.opening]="curtainsOpen()" [class.gone]="curtainsDismissed()">
        <!-- Top Grand Theater Pelmet / Valance -->
        <div class="theater-pelmet">
          <div class="gold-fringe"></div>
        </div>

        <!-- Left Red Velvet Curtain -->
        <div class="curtain-panel left-curtain">
          <div class="curtain-folds"></div>
        </div>

        <!-- Right Red Velvet Curtain -->
        <div class="curtain-panel right-curtain">
          <div class="curtain-folds"></div>
        </div>

        <!-- Center Theater Marquee & Stage Light -->
        <div class="marquee-center" (click)="openCurtains()">
          <div class="spotlight-cone"></div>
          <div class="marquee-badge">🎬 PREMIERE SHOWCASE</div>
          <div class="welcome-txt">WELCOME TO</div>
          <h1 class="marquee-title grad-gold">FUN CONNECT</h1>
          <p class="marquee-sub">✦ Interactive Team Arena · Connect, Play & Win Together ✦</p>

          <button class="btn-cinema pulse" (click)="openCurtains()" id="btn-open-curtains">
            🍿 Open Curtains & Enter Arena ↵
          </button>
          <div class="auto-hint">✦ Click to open the grand curtains & reveal the arena ✦</div>
        </div>
      </div>
    }

    <!-- ═══════════ HERO ═══════════ -->
    <header class="hero">
      <div class="spots"><i></i><i></i><i></i></div>

      <div class="d-flex align-items-center gap-2 flex-wrap justify-content-center mb-2">
        <span class="badge-pill fade-in">🎉 Corporate Team Connect · Live Arena</span>
        <button class="btn-ghost btn-sm-x replay-pill" (click)="replayCurtain()" title="Replay the grand cinema curtain opening on the projector screen">
          🎬 Replay Curtain Call
        </button>
      </div>

      <h1 class="title display fade-in" style="animation-delay:.1s">
        <span class="grad-text glitch" data-t="FUN CONNECT">FUN CONNECT</span>
        <span class="sub">– Forget about the deadlines, it's game time! 🚀</span>
      </h1>
      <p class="lead muted fade-in" style="animation-delay:.25s">
        5 engaging team challenges · Spinning wheel of fate · Live leaderboard — all on one big screen.<br>
        <b class="text-white">Connect, play & win together — energized teamwork and unforgettable laughs!</b>
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

    <!-- ═══════════ AI GAME ARENA — 5 Games ═══════════ -->
    <section class="page sec" id="arena">
      <div class="sec-head">
        <span class="badge-pill ai-badge">⚡ Live Interactive Challenges</span>
        <h2 class="grad-text">Fun Connect Arena</h2>
        <p class="muted">5 high-energy team games. Fresh content every round. Click any game to begin!</p>
      </div>

      <!-- 5 Games Balanced Row -->
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
    /* Cinema Theater Curtain Animation Overlay */
    .cinema-curtain-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      background: #000;
      transition: opacity .8s ease;
    }
    .cinema-curtain-overlay.opening {
      pointer-events: none;
    }

    /* Top Theater Pelmet / Valance with gold trim */
    .theater-pelmet {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 75px;
      z-index: 10;
      background: repeating-linear-gradient(90deg, #42040c 0px, #780d19 30px, #961220 60px, #42040c 90px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.85);
      border-bottom: 4px solid #facc15;
    }
    .gold-fringe {
      position: absolute;
      bottom: -8px;
      left: 0;
      right: 0;
      height: 8px;
      background: repeating-linear-gradient(90deg, #ca8a04 0px, #fef08a 6px, #a16207 12px);
    }

    /* Red Velvet Theater Curtains */
    .curtain-panel {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 50.5%;
      z-index: 5;
      background: repeating-linear-gradient(
        90deg,
        #2d0207 0px,
        #600712 20px,
        #8b0f1d 40px,
        #b91c2c 60px,
        #8b0f1d 80px,
        #600712 100px,
        #2d0207 120px
      );
      box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.95);
      transition: transform 2.2s cubic-bezier(0.77, 0, 0.175, 1);
    }
    .left-curtain {
      left: 0;
      border-right: 3px solid rgba(250, 204, 21, 0.4);
    }
    .right-curtain {
      right: 0;
      border-left: 3px solid rgba(250, 204, 21, 0.4);
    }

    /* Curtain opening animation */
    .cinema-curtain-overlay.opening .left-curtain {
      transform: translateX(-102%);
    }
    .cinema-curtain-overlay.opening .right-curtain {
      transform: translateX(102%);
    }
    .cinema-curtain-overlay.opening .marquee-center {
      opacity: 0;
      transform: scale(1.15) translateY(-20px);
      transition: opacity .8s ease, transform .9s ease;
    }
    .cinema-curtain-overlay.opening .theater-pelmet {
      transform: translateY(-100%);
      transition: transform 1.8s cubic-bezier(0.77, 0, 0.175, 1);
    }

    /* Center Theater Marquee */
    .marquee-center {
      position: relative;
      z-index: 12;
      text-align: center;
      padding: 2.5rem 3rem;
      background: radial-gradient(circle, rgba(15, 7, 30, 0.92) 0%, rgba(5, 2, 10, 0.98) 100%);
      border: 2px solid rgba(250, 204, 21, 0.7);
      border-radius: 24px;
      box-shadow: 0 0 80px rgba(250, 204, 21, 0.35), inset 0 0 40px rgba(250, 204, 21, 0.15);
      cursor: pointer;
      max-width: 680px;
      margin: 1.5rem;
    }
    .marquee-badge {
      display: inline-block;
      font-size: .82rem;
      font-weight: 800;
      letter-spacing: .2em;
      color: #fde047;
      background: rgba(234, 179, 8, 0.18);
      border: 1px solid rgba(250, 204, 21, 0.5);
      padding: .35rem 1.1rem;
      border-radius: 999px;
      margin-bottom: .8rem;
    }
    .welcome-txt {
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: .3em;
      color: #cbd5e1;
      margin-bottom: .2rem;
    }
    .marquee-title {
      font-size: clamp(2.4rem, 6vw, 4.2rem);
      font-weight: 900;
      margin: .2rem 0;
      letter-spacing: .08em;
      text-shadow: 0 0 40px rgba(250, 204, 21, 0.6);
    }
    .grad-gold {
      background: linear-gradient(135deg, #fef08a 0%, #facc15 50%, #ca8a04 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .marquee-sub {
      color: #e2e8f0;
      font-size: 1rem;
      margin: .6rem 0 1.6rem;
      font-weight: 600;
    }
    .btn-cinema {
      background: linear-gradient(135deg, #facc15, #f59e0b);
      color: #000;
      font-weight: 900;
      font-size: 1.15rem;
      border: 0;
      border-radius: 999px;
      padding: .85rem 2.2rem;
      cursor: pointer;
      box-shadow: 0 0 35px rgba(250, 204, 21, 0.6);
      transition: .25s;
      font-family: var(--font);
    }
    .btn-cinema:hover {
      transform: scale(1.06);
      box-shadow: 0 0 50px rgba(250, 204, 21, 0.85);
    }
    .auto-hint {
      margin-top: .9rem;
      font-size: .8rem;
      color: var(--muted);
      letter-spacing: .03em;
    }

    /* Hero */
    .hero { position: relative; min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 5rem 1.5rem 2rem; z-index: 2; }
    .spots { position: absolute; inset: 0; overflow: hidden; pointer-events: none; contain: strict; }
    .spots i { position: absolute; top: -10%; width: 260px; height: 130%; background: radial-gradient(ellipse at 50% 0%, rgba(168,85,247,.32) 0%, rgba(168,85,247,.08) 45%, transparent 70%); transform-origin: top center; will-change: transform; animation: sweep 7s ease-in-out infinite alternate; }
    .spots i:nth-child(1) { left: 18%; }
    .spots i:nth-child(2) { left: 48%; background: radial-gradient(ellipse at 50% 0%, rgba(59,130,246,.32) 0%, rgba(59,130,246,.08) 45%, transparent 70%); animation-delay: -2s; }
    .spots i:nth-child(3) { right: 15%; background: radial-gradient(ellipse at 50% 0%, rgba(236,72,153,.32) 0%, rgba(236,72,153,.08) 45%, transparent 70%); animation-delay: -4s; }
    @keyframes sweep { from { transform: rotate(-22deg); } to { transform: rotate(22deg); } }
    .title { position: relative; font-weight: 900; margin: 1rem 0; line-height: 1.1; }
    .glitch { display: block; font-size: clamp(3rem, 9vw, 7.5rem); text-shadow: 0 0 35px rgba(168,85,247,.7); animation: gradMove 6s linear infinite; }
    .sub { display: block; font-size: clamp(1rem, 2.5vw, 2rem); color: #fff; font-weight: 700; margin-top: .5rem; text-shadow: 0 0 24px rgba(59,130,246,.9); }
    .lead { font-size: clamp(1rem, 1.4vw, 1.35rem); max-width: 760px; }
    .cta { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 1.8rem; }
    .cta a { text-decoration: none; }
    .replay-pill { background: rgba(250, 204, 21, 0.12); border: 1px solid rgba(250, 204, 21, 0.4); color: #fef08a; cursor: pointer; border-radius: 999px; padding: .25rem .75rem; font-size: .8rem; font-weight: 700; transition: .2s; }
    .replay-pill:hover { background: rgba(250, 204, 21, 0.25); transform: translateY(-1px); }

    /* Sections */
    .sec { padding-top: 2rem; padding-bottom: 3rem; }
    .sec-head { text-align: center; margin-bottom: 2.2rem; }
    .sec-head h2 { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 900; margin: .5rem 0 .2rem; }
    .ai-badge { background: linear-gradient(135deg, rgba(168,85,247,.3), rgba(59,130,246,.3)); border-color: rgba(168,85,247,.5); }

    /* 5 Games in a balanced, centered responsive flex grid */
    .games-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1.4rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .game-item {
      flex: 1 1 270px;
      max-width: 380px;
      min-width: 260px;
      display: flex;
      flex-direction: column;
    }

    /* Wheel box */
    .wheel-ic { font-size: 4rem; animation: spin 8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .wheelbox { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .spin-tips { display: flex; gap: .5rem; flex-wrap: wrap; justify-content: center; margin-top: .5rem; }
    .spin-tips span { font-size: .78rem; font-weight: 700; padding: .2rem .6rem; border-radius: 99px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); }
  `,
})
export class LandingComponent implements OnInit {
  readonly teams = inject(TeamService);
  readonly sound = inject(SoundService);
  readonly allGames = GAMES;

  readonly curtainsOpen = signal(false);
  readonly curtainsDismissed = signal(false);

  ngOnInit() {
    // Check if user already saw the curtain in this browser session
    const seen = sessionStorage.getItem('fun_connect_curtain_seen');
    if (seen === 'true') {
      this.curtainsDismissed.set(true);
      return;
    }
    // Curtains stay closed until user clicks to open them!
  }

  openCurtains() {
    if (this.curtainsOpen()) return;
    this.sound.fanfare();
    this.curtainsOpen.set(true);
    sessionStorage.setItem('fun_connect_curtain_seen', 'true');

    // Dismiss overlay completely after animation completes (2.4s)
    setTimeout(() => {
      this.curtainsDismissed.set(true);
    }, 2400);
  }

  replayCurtain() {
    this.curtainsDismissed.set(false);
    this.curtainsOpen.set(false);
  }
}
