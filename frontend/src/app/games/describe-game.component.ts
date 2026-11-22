import { Component, Input, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeamPickerComponent } from '../components/team-picker.component';
import { TimerComponent } from '../components/timer.component';
import { DESCRIBE_CATEGORIES, DescribeGameService } from '../services/describe-game.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-describe-game',
  imports: [RouterLink, FormsModule, TeamPickerComponent, TimerComponent],
  template: `
    <section [class.page]="!embedded" class="wrap">
      @if (!embedded) {
        <a routerLink="/" class="back">← Arena</a><br>
        <span class="badge-pill">🎙️ AI Hot Seat · Party Game</span>
        <h1 class="page-title grad-text">Describe It! (Hot Seat)</h1>
      }

      <!-- Top bar: Team Picker + Category -->
      <div class="glass glass-pad mb-4 top-bar">
        <app-team-picker />
        <div class="d-flex gap-2 flex-wrap align-items-center">
          <select class="form-select cat-select"
                  [ngModel]="g.state().category"
                  (ngModelChange)="g.setCategory($event)"
                  id="describe-category"
                  [disabled]="s().phase === 'live'">
            @for (c of categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
          <button class="btn-ghost" (click)="g.fetchCards(6)" [disabled]="g.loading() || s().phase === 'live'" id="btn-describe-generate">
            ✨ {{ g.loading() ? 'Generating…' : 'Fresh AI Words' }}
          </button>
        </div>
      </div>

      <!-- Hot seat rule banner -->
      <div class="hotseat-banner glass glass-pad mb-4">
        <span class="hs-icon">🪑</span>
        <div>
          <b>Hot Seat Rule:</b> Exactly <b>1 player</b> sits with their back to the screen (the guesser).
          <b>All their teammates</b> look at the screen and shout clues without saying any forbidden words!
        </div>
      </div>

      @if (g.error()) { <div class="alert-neon mb-3">{{ g.error() }}</div> }

      <div class="row g-4">
        <!-- Main Stage -->
        <div class="col-12 col-lg-8">
          <div class="stage glass" [class.live]="s().phase === 'live'">

            <!-- ══ IDLE ══ -->
            @if (s().phase === 'idle') {
              <div class="center text-center">
                <div class="big-icon">🎙️</div>
                <h2 class="display">{{ teams.activeTeam()?.name ?? 'Team' }} in the Hot Seat</h2>
                <p class="muted">
                  60 seconds on the clock. Shout clues as fast as you can.
                  <br>Each word solved = <b class="text-white">+10 points</b>!
                </p>
                <div class="d-flex gap-3 justify-content-center flex-wrap mt-3">
                  <button class="btn-neon btn-lg-x pulse" (click)="g.startRound()" [disabled]="g.loading()" id="btn-describe-start">
                    {{ g.loading() ? '🤖 Preparing AI Words…' : '▶ START HOT SEAT (60s)' }}
                  </button>
                </div>
              </div>
            }

            <!-- ══ LIVE — Word & Forbidden Words on Screen ══ -->
            @if (s().phase === 'live') {
              @if (g.current(); as card) {
                <div class="card-play text-center w-100">
                  <div class="lbl">TARGET WORD (Teammates describe this!)</div>
                  <div class="target-word display grad-text pop-in">{{ card.word }}</div>

                  <div class="lbl mt-3">🚫 FORBIDDEN WORDS (Do NOT say these!)</div>
                  <div class="forbidden-grid">
                    @for (w of card.restricted; track w) {
                      <span class="bad-pill">{{ w }}</span>
                    }
                  </div>

                  <!-- Quick Host Controls -->
                  <div class="host-controls mt-4">
                    <button class="btn-neon btn-green btn-lg-x" (click)="g.correct()" id="btn-describe-correct">
                      ✅ Guessed It! (+10 pts)
                    </button>
                    <button class="btn-neon btn-cyan" (click)="g.pass()" id="btn-describe-pass">
                      ⏭ Pass / Skip
                    </button>
                    <button class="btn-neon btn-pink" (click)="g.bannedWordPenalty()" id="btn-describe-penalty">
                      🚨 Said Banned Word! (−2 pts)
                    </button>
                  </div>
                </div>
              } @else {
                <div class="center text-center">
                  <div class="big-icon">🤖</div>
                  <h3 class="display">Loading more AI cards…</h3>
                </div>
              }
            }

            <!-- ══ DONE — Round Summary ══ -->
            @if (s().phase === 'done') {
              <div class="center text-center">
                <div class="big-icon">🏁</div>
                <h2 class="display grad-text">Time's Up!</h2>
                <p class="fs-4">
                  {{ teams.activeTeam()?.name }} scored <b>+{{ s().roundScore }} points</b>!
                </p>
                <div class="muted small mb-4">
                  🎉 {{ s().solvedCount }} words solved · ⚠️ {{ s().penalties }} penalties
                </div>
                <div class="d-flex gap-3 justify-content-center flex-wrap">
                  <button class="btn-neon btn-lg-x" (click)="g.startRound()" id="btn-describe-again">
                    ↺ Play Another Round
                  </button>
                  <button class="btn-ghost" (click)="g.stopRound()" id="btn-describe-done">
                    ✓ Done
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Bottom bar controls -->
          @if (s().phase === 'live') {
            <div class="d-flex justify-content-center mt-3">
              <button class="btn-ghost btn-sm-x" (click)="g.stopRound()" id="btn-describe-stop">
                ⏹ Stop Round Early
              </button>
            </div>
          }
        </div>

        <!-- Right Side Panel -->
        <div class="col-12 col-lg-4">
          <div class="glass glass-pad text-center mb-3">
            <app-timer [timer]="g.timer" [size]="210" />
            <div class="mt-3 fs-5">
              Round Score: <b class="text-white">+{{ s().roundScore }} pts</b>
            </div>
            <div class="muted small mt-1">
              {{ s().solvedCount }} solved · {{ s().penalties }} penalties
            </div>
          </div>

          <div class="glass glass-pad howto">
            <div class="ht-title">💡 Why Hot Seat Works Best</div>
            <ol class="ht-list muted">
              <li><b>1 guesser</b> sits facing the room with their back to the screen.</li>
              <li><b>All teammates</b> look at the screen and shout clues together!</li>
              <li>The guesser never sees the screen, so <b>zero spoilers</b>!</li>
              <li>Opposing teams watch the banned words to catch slips! 😉</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .back { color: var(--muted); text-decoration: none; } .back:hover { color: #fff; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .cat-select { max-width: 180px; }

    .hotseat-banner { display: flex; align-items: center; gap: 1rem; border-color: rgba(34,211,238,.35); background: rgba(34,211,238,.08); font-size: .95rem; line-height: 1.45; }
    .hs-icon { font-size: 2.2rem; flex: none; }

    .stage { min-height: 440px; display: grid; place-items: center; padding: 2.2rem; transition: .4s; position: relative; }
    .stage.live { box-shadow: 0 0 60px rgba(168,85,247,.45); border-color: var(--purple); }

    .big-icon { font-size: 5rem; animation: float 3s ease-in-out infinite; display: inline-block; }
    @keyframes float { 50% { transform: translateY(-10px); } }

    .lbl { letter-spacing: .25em; color: var(--muted); font-size: .82rem; font-weight: 700; }
    .target-word { font-size: clamp(2.4rem, 6vw, 4.4rem); font-weight: 900; margin: .5rem 0 1.2rem; line-height: 1.1; }

    .forbidden-grid { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: center; margin-top: .6rem; }
    .bad-pill { font-size: 1.15rem; font-weight: 800; padding: .45rem 1.1rem; border-radius: 999px;
      background: rgba(239,68,68,.16); border: 2px solid #ef4444; color: #fecaca; }

    .host-controls { display: flex; gap: .9rem; flex-wrap: wrap; justify-content: center; margin-top: 1.8rem; }

    .howto { text-align: left; }
    .ht-title { font-weight: 800; margin-bottom: .6rem; }
    .ht-list { padding-left: 1.2rem; display: flex; flex-direction: column; gap: .4rem; font-size: .9rem; }

    .pop-in { animation: popIn .35s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes popIn { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: none; } }
  `,
})
export class DescribeGameComponent implements OnInit {
  readonly g = inject(DescribeGameService);
  readonly teams = inject(TeamService);
  readonly categories = DESCRIBE_CATEGORIES;
  @Input() embedded = false;
  readonly s = this.g.state;

  ngOnInit() {
    if (!this.g.state().cards.length) this.g.fetchCards(6);
  }
}
