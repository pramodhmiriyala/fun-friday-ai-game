import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TeamPickerComponent } from '../components/team-picker.component';
import { TruthOrDareService } from '../services/truth-or-dare.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-truth-or-dare',
  imports: [RouterLink, TeamPickerComponent],
  template: `
    <section [class.page]="!embedded" class="wrap">
      @if (!embedded) {
        <a routerLink="/" class="back">← Arena</a><br>
        <span class="badge-pill">🎭 AI Party Game · Just Fun!</span>
        <h1 class="page-title grad-text">AI Truth or Dare (Office Edition)</h1>
      }

      <div class="glass glass-pad mb-4">
        <app-team-picker />
      </div>

      @if (t.error()) { <div class="alert-neon mb-3">{{ t.error() }}</div> }

      <div class="stage glass" [class.truth-theme]="cur()?.type === 'truth'" [class.dare-theme]="cur()?.type === 'dare'">
        @if (!cur()) {
          <!-- Selection Screen -->
          <div class="choice-wrap text-center">
            <div class="stage-ic">🎭</div>
            <h2 class="display">Truth or Dare?</h2>
            <p class="muted max-w">
              Pick your poison for <b class="text-white">{{ teams.activeTeam()?.name ?? 'the player on stage' }}</b>!
              Hilarious, relatable office secrets and fun 20-second challenges. Pure fun, no stress!
            </p>

            <div class="btn-grid mt-4">
              <button class="choice-btn truth-btn" (click)="t.play('truth')" [disabled]="t.loading()" id="btn-pick-truth">
                <span class="btn-icon">😇</span>
                <span class="btn-title">TRUTH</span>
                <span class="btn-sub">Office secrets & funny confessions</span>
              </button>

              <button class="choice-btn dare-btn" (click)="t.play('dare')" [disabled]="t.loading()" id="btn-pick-dare">
                <span class="btn-icon">🔥</span>
                <span class="btn-title">DARE</span>
                <span class="btn-sub">Fun 20-second team challenges</span>
              </button>
            </div>

            @if (t.loading()) {
              <div class="loading-spin mt-4">
                <span class="spin-ic">🎲</span>
                <p class="muted mt-2">AI is brewing a juicy office challenge…</p>
              </div>
            }
          </div>
        } @else {
          <!-- Card Output Screen -->
          @let item = cur()!;
          <div class="card-wrap text-center pop-in">
            <div class="type-pill" [class.dare]="item.type === 'dare'">
              {{ item.type === 'truth' ? '😇 TRUTH' : '🔥 DARE' }} · {{ item.category }}
            </div>

            <div class="prompt-text display">
              "{{ item.prompt }}"
            </div>

            <div class="muted small mb-4">
              Player on stage: <b class="text-white">{{ teams.activeTeam()?.name ?? 'Player' }}</b>
            </div>

            <div class="actions">
              <button class="btn-neon btn-green btn-lg-x" (click)="t.applaud()" id="btn-tod-applaud">
                👏 Applaud & Celebrate!
              </button>
              <button class="btn-neon" (click)="t.next()" id="btn-tod-next">
                ➡ Next Player / Pick Again
              </button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .back { color: var(--muted); text-decoration: none; } .back:hover { color: #fff; }
    .stage { min-height: 480px; display: grid; place-items: center; padding: 2.4rem; transition: .4s; border-radius: 24px; }
    .stage.truth-theme { border-color: #38bdf8; box-shadow: 0 0 60px rgba(56,189,248,.3); }
    .stage.dare-theme  { border-color: #f43f5e; box-shadow: 0 0 60px rgba(244,63,94,.3); }

    .stage-ic { font-size: 5rem; animation: float 3s ease-in-out infinite; display: inline-block; }
    @keyframes float { 50% { transform: translateY(-10px); } }
    .max-w { max-width: 580px; margin: .6rem auto 0; font-size: 1.1rem; }

    .btn-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; max-width: 620px; margin: 1.5rem auto 0; }
    .choice-btn { display: flex; flex-direction: column; align-items: center; padding: 2rem 1.4rem; border-radius: 20px;
      cursor: pointer; transition: transform .2s, box-shadow .2s; border: 2px solid transparent; font-family: var(--font); color: #fff; }
    .choice-btn:hover:not(:disabled) { transform: translateY(-6px) scale(1.02); }
    .choice-btn:disabled { opacity: .5; cursor: not-allowed; }

    .truth-btn { background: linear-gradient(135deg, rgba(56,189,248,.2), rgba(59,130,246,.25)); border-color: #38bdf8; box-shadow: 0 10px 30px rgba(56,189,248,.2); }
    .truth-btn:hover:not(:disabled) { box-shadow: 0 16px 40px rgba(56,189,248,.45); }
    .dare-btn  { background: linear-gradient(135deg, rgba(244,63,94,.2), rgba(236,72,153,.25)); border-color: #f43f5e; box-shadow: 0 10px 30px rgba(244,63,94,.2); }
    .dare-btn:hover:not(:disabled)  { box-shadow: 0 16px 40px rgba(244,63,94,.45); }

    .btn-icon { font-size: 3.5rem; margin-bottom: .4rem; }
    .btn-title { font-size: 1.8rem; font-weight: 900; letter-spacing: .08em; }
    .btn-sub { font-size: .88rem; color: var(--muted); margin-top: .4rem; line-height: 1.3; }

    .type-pill { display: inline-block; padding: .35rem 1rem; border-radius: 999px; font-weight: 800; font-size: .85rem; letter-spacing: .08em;
      background: rgba(56,189,248,.2); border: 1px solid #38bdf8; color: #7dd3fc; margin-bottom: 1.5rem; }
    .type-pill.dare { background: rgba(244,63,94,.2); border-color: #f43f5e; color: #fda4af; }

    .prompt-text { font-size: clamp(1.8rem, 4.5vw, 3rem); font-weight: 900; line-height: 1.3; max-width: 820px; margin: 0 auto 1.5rem; color: #fff; }
    .actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem; }

    .spin-ic { font-size: 2.6rem; display: inline-block; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pop-in { animation: popIn .4s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes popIn { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: none; } }
  `,
})
export class TruthOrDareComponent {
  readonly t = inject(TruthOrDareService);
  readonly teams = inject(TeamService);
  @Input() embedded = false;
  readonly cur = () => this.t.state().current;
}
