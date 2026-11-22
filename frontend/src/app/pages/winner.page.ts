import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfettiService } from '../services/confetti.service';
import { ScoringService } from '../services/scoring.service';
import { SoundService } from '../services/sound.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-winner-page',
  imports: [RouterLink],
  template: `
    <section class="page">
      @if (!podium().length) {
        <div class="empty-state"><div class="big">🏆</div>No teams yet.</div>
      } @else {
        <div class="text-center">
          <div class="kicker fade-in">AND THE WINNER IS…</div>
          @if (!revealed()) {
            <div class="drum display">🥁 …</div>
            <button class="btn-neon btn-gold btn-lg-x mt-3" (click)="reveal()" id="btn-reveal-winner">Reveal the Champion</button>
          } @else {
            <div class="trophy">🏆</div>
            <h1 class="champ display grad-text pop-in">{{ winners() }}</h1>
            <div class="score display">{{ podium()[0].total }} POINTS</div>
            @if (tie()) { <div class="muted">It's a tie! Co-champions!</div> }
            <div class="podium">
              @for (p of podiumOrder(); track p.team.id) {
                <div class="step" [class]="'s' + p.rank" [style.--tc]="p.team.color">
                  <div class="pe">{{ p.team.emoji }}</div><div class="pn">{{ p.team.name }}</div>
                  <div class="pp display">{{ p.total }}</div>
                  <div class="pb"><span>{{ p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉' }}</span></div>
                </div>
              }
            </div>
            <div class="d-flex gap-2 justify-content-center mt-4 flex-wrap">
              <button class="btn-neon btn-pink" (click)="party()" id="btn-more-confetti">🎉 More confetti!</button>
              <a routerLink="/leaderboard" class="btn-ghost text-decoration-none">Full leaderboard</a>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .kicker { letter-spacing: .5em; color: var(--muted); font-weight: 700; margin-bottom: 1rem; }
    .drum { font-size: 5rem; animation: pulseGlow 1s infinite; }
    .trophy { font-size: clamp(6rem, 14vw, 11rem); animation: trophy 1.4s cubic-bezier(.2,1.4,.4,1) both, glowT 2s 1.4s infinite alternate; }
    @keyframes trophy { from { transform: scale(0) rotate(-200deg); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes glowT { to { filter: drop-shadow(0 0 50px #facc15); transform: scale(1.06); } } .trophy { filter: drop-shadow(0 0 30px #facc15); }
    .champ { font-size: clamp(2rem, 7vw, 5.5rem); font-weight: 900; animation-delay: .6s; } .score { font-size: 1.8rem; color: var(--gold); text-shadow: 0 0 24px var(--gold); }
    .podium { display: flex; justify-content: center; align-items: flex-end; gap: 1rem; margin-top: 2.5rem; }
    .step { width: min(240px, 30vw); text-align: center; border-radius: 18px 18px 0 0; padding: 1rem .5rem 0; background: linear-gradient(180deg, color-mix(in srgb, var(--tc) 55%, transparent), rgba(255,255,255,.04)); border: 1px solid var(--tc); border-bottom: 0; animation: rise 1s both cubic-bezier(.2,1,.3,1); box-shadow: 0 0 40px color-mix(in srgb, var(--tc) 40%, transparent); }
    .s1 { order: 2; } .s2 { order: 1; animation-delay: .3s; } .s3 { order: 3; animation-delay: .6s; }
    .s1 .pb { height: 150px; } .s2 .pb { height: 105px; } .s3 .pb { height: 70px; }
    @keyframes rise { from { transform: translateY(120%); opacity: 0; } to { transform: none; opacity: 1; } }
    .pe { font-size: 2.6rem; } .pn { font-weight: 800; } .pp { font-size: 1.6rem; font-weight: 900; } .pb { display: grid; place-items: center; font-size: 2.5rem; }
  `,
})
export class WinnerPageComponent implements OnInit, OnDestroy {
  private scoring = inject(ScoringService);
  private teams = inject(TeamService);
  private confetti = inject(ConfettiService);
  private sound = inject(SoundService);
  readonly revealed = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  readonly podium = computed(() =>
    this.scoring.standings().map((s) => ({ team: this.teams.get(s.teamId)!, total: s.total, rank: s.rank })));
  readonly top = computed(() => this.podium().filter((p) => p.rank === 1));
  readonly tie = computed(() => this.top().length > 1);
  readonly winners = computed(() => this.top().map((t) => t.team.name).join(' & '));
  readonly podiumOrder = computed(() => this.podium().slice(0, 3));

  ngOnInit() {}

  reveal() {
    this.sound.drumroll();
    setTimeout(() => {
      this.revealed.set(true);
      this.sound.win();
      this.confetti.cannons(200);
      this.confetti.rain(8000);
      this.timer = setInterval(() => this.confetti.burst(Math.random(), Math.random() * 0.5, 90), 2200);
      setTimeout(() => clearInterval(this.timer), 12000);
    }, 1400);
  }
  party() { this.confetti.cannons(200); this.confetti.rain(5000); }
  ngOnDestroy() { clearInterval(this.timer); }
}
