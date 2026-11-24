import { Component, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TeamPickerComponent } from '../components/team-picker.component';
import { TruthOrDareService } from '../services/truth-or-dare.service';
import { TeamService } from '../services/team.service';
import { SoundService } from '../services/sound.service';

interface WheelSlice {
  label: string;
  icon: string;
  type: 'truth' | 'dare' | 'pass';
  color: string;
  textCol: string;
}

@Component({
  selector: 'app-truth-or-dare',
  imports: [RouterLink, TeamPickerComponent],
  template: `
    <section [class.page]="!embedded" class="wrap">
      @if (!embedded) {
        <a routerLink="/" class="back">← Arena</a><br>
        <span class="badge-pill">🎡 Spinner · Truth, Dare & Pass</span>
        <h1 class="page-title grad-text">AI Truth or Dare (Office Spinner)</h1>
      }

      <div class="glass glass-pad mb-4">
        <app-team-picker />
      </div>

      @if (t.error()) { <div class="alert-neon mb-3">{{ t.error() }}</div> }

      <div class="stage glass"
           [class.truth-theme]="cur()?.type === 'truth'"
           [class.dare-theme]="cur()?.type === 'dare'"
           [class.pass-theme]="cur()?.type === 'pass'">

        @if (!cur()) {
          <!-- Spinner Screen -->
          <div class="spinner-wrap text-center">
            <h2 class="display mb-1">Spin of Fate!</h2>
            <p class="muted max-w mb-4">
              Spin for <b class="text-white">{{ teams.activeTeam()?.name ?? 'the player on stage' }}</b>!
              Will fate hand you a <b>Truth</b>, a <b>Dare</b>, or a lucky <b>Pass</b>?
            </p>

            <div class="wheel-stage">
              <div class="pointer">▼</div>
              <div class="wheel-disc"
                   [style.transform]="'rotate(' + rotation() + 'deg)'"
                   [style.transition]="spinning() ? 'transform 3.5s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'none'">
                <svg viewBox="0 0 320 320" class="wheel-svg">
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#fff" flood-opacity="0.3"/>
                    </filter>
                  </defs>
                  @for (s of slices; track $index) {
                    <path [attr.d]="slicePath($index)" [attr.fill]="s.color" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
                    <g [attr.transform]="'rotate(' + ($index * 60 + 30) + ', 160, 160)'">
                      <text x="245" y="156" text-anchor="middle" font-size="22" font-weight="900" [attr.fill]="s.textCol" filter="url(#glow)">{{ s.icon }}</text>
                      <text x="245" y="174" text-anchor="middle" font-size="12" font-weight="900" letter-spacing="1.5" [attr.fill]="s.textCol">{{ s.label }}</text>
                    </g>
                  }
                </svg>
              </div>

              <!-- Center Spin Hub Button -->
              <button class="spin-hub" (click)="spinWheel()" [disabled]="spinning() || t.loading()" id="btn-spin-tod">
                <span class="hub-txt">{{ spinning() ? '🎲' : 'SPIN' }}</span>
              </button>
            </div>

            @if (spinning()) {
              <p class="spin-status mt-3">✨ The wheel is deciding your destiny…</p>
            } @else if (t.loading()) {
              <div class="loading-spin mt-3">
                <span class="spin-ic">🎲</span>
                <p class="muted mt-2">AI is drafting a spicy question…</p>
              </div>
            } @else {
              <p class="muted small mt-3">Tap <b>SPIN</b> to test your luck!</p>
            }
          </div>
        } @else {
          <!-- Card Output Screen -->
          @let item = cur()!;
          @if (item.type === 'pass') {
            <!-- Simple Pass Screen: Skips question with zero penalty -->
            <div class="card-wrap text-center pop-in">
              <div class="stage-ic mb-2">🛡️</div>
              <h2 class="display grad-text">PASS!</h2>
              <p class="fs-4 text-white mb-4">Question skipped. Zero penalty!</p>
              <div class="actions">
                <button class="btn-neon btn-lg-x pulse" (click)="t.next()" id="btn-tod-next">
                  ➡ Next Player
                </button>
              </div>
            </div>
          } @else {
            <!-- Truth / Dare Question Screen -->
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
                <button class="btn-neon btn-lg-x" (click)="t.next()" id="btn-tod-next">
                  🎡 Next Player
                </button>
              </div>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: `
    .back { color: var(--muted); text-decoration: none; } .back:hover { color: #fff; }
    .stage { min-height: 520px; display: grid; place-items: center; padding: 2.2rem; transition: .4s; border-radius: 24px; }
    .stage.truth-theme { border-color: #38bdf8; box-shadow: 0 0 60px rgba(56,189,248,.3); }
    .stage.dare-theme  { border-color: #f43f5e; box-shadow: 0 0 60px rgba(244,63,94,.3); }
    .stage.pass-theme  { border-color: #10b981; box-shadow: 0 0 60px rgba(16,185,129,.35); }

    .max-w { max-width: 580px; margin: .4rem auto 0; font-size: 1.05rem; }

    /* Spinner Wheel Stage */
    .wheel-stage { position: relative; width: 330px; height: 330px; margin: 1.2rem auto 0; }
    .pointer { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 2.5rem; color: var(--gold); z-index: 10; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8)); }
    .wheel-disc { width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 0 6px rgba(255,255,255,.1), 0 0 40px rgba(168,85,247,.45); }
    .wheel-svg { width: 100%; height: 100%; display: block; border-radius: 50%; }

    .spin-hub {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 78px; height: 78px; border-radius: 50%; border: 3px solid #fff;
      background: radial-gradient(circle, #ec4899, #7c3aed); color: #fff;
      display: grid; place-items: center; cursor: pointer; z-index: 5;
      box-shadow: 0 0 25px rgba(236,72,153,.8); transition: transform .2s, box-shadow .2s;
    }
    .spin-hub:hover:not(:disabled) { transform: translate(-50%, -50%) scale(1.08); box-shadow: 0 0 35px rgba(236,72,153,1); }
    .spin-hub:disabled { cursor: not-allowed; opacity: .85; }
    .hub-txt { font-weight: 900; font-size: 1.15rem; letter-spacing: .08em; }

    .spin-status { color: var(--gold); font-weight: 800; font-size: 1.05rem; animation: pulse 1s infinite alternate; }
    @keyframes pulse { to { transform: scale(1.04); opacity: .8; } }

    /* Result Card Styles */
    .type-pill {
      display: inline-block; padding: .4rem 1.2rem; border-radius: 999px; font-weight: 800; font-size: .9rem; letter-spacing: .08em;
      background: rgba(56,189,248,.2); border: 1px solid #38bdf8; color: #7dd3fc; margin-bottom: 1.5rem;
    }
    .type-pill.dare { background: rgba(244,63,94,.2); border-color: #f43f5e; color: #fda4af; }
    .type-pill.pass { background: rgba(16,185,129,.2); border-color: #10b981; color: #6ee7b7; }

    .prompt-text { font-size: clamp(1.8rem, 4.2vw, 2.8rem); font-weight: 900; line-height: 1.35; max-width: 820px; margin: 0 auto 1.5rem; color: #fff; }
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
  private sound = inject(SoundService);

  @Input() embedded = false;
  readonly cur = () => this.t.state().current;

  readonly spinning = signal(false);
  readonly rotation = signal(0);

  // 6 Alternating slices: Truth, Dare, Pass
  readonly slices: WheelSlice[] = [
    { label: 'TRUTH', icon: '😇', type: 'truth', color: '#0284c7', textCol: '#e0f2fe' },
    { label: 'DARE',  icon: '🔥', type: 'dare',  color: '#e11d48', textCol: '#ffe4e6' },
    { label: 'PASS',  icon: '🛡️', type: 'pass',  color: '#059669', textCol: '#d1fae5' },
    { label: 'TRUTH', icon: '😇', type: 'truth', color: '#0369a1', textCol: '#e0f2fe' },
    { label: 'DARE',  icon: '🔥', type: 'dare',  color: '#be123c', textCol: '#ffe4e6' },
    { label: 'PASS',  icon: '🛡️', type: 'pass',  color: '#047857', textCol: '#d1fae5' },
  ];

  slicePath(i: number): string {
    const r = 150;
    const cx = 160;
    const cy = 160;
    const a1 = (i * 60) * (Math.PI / 180);
    const a2 = ((i + 1) * 60) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
  }

  spinWheel() {
    if (this.spinning() || this.t.loading()) return;
    this.spinning.set(true);
    this.sound.whoosh();

    // Random choice among Truth (40%), Dare (40%), Pass (20%)
    const roll = Math.random();
    let targetSlice: number;
    if (roll < 0.40) {
      targetSlice = Math.random() < 0.5 ? 0 : 3; // Truth
    } else if (roll < 0.80) {
      targetSlice = Math.random() < 0.5 ? 1 : 4; // Dare
    } else {
      targetSlice = Math.random() < 0.5 ? 2 : 5; // Pass
    }

    // Pointer is at top (-90 deg / 270 deg)
    // Slice i center is at i * 60 + 30 deg
    // To land on slice i at top pointer:
    // targetRotation % 360 = (270 - (i * 60 + 30)) % 360
    const desiredAngle = (270 - (targetSlice * 60 + 30) + 360) % 360;
    const currentAngle = this.rotation();
    const currentNorm = ((currentAngle % 360) + 360) % 360;
    let delta = desiredAngle - currentNorm;
    if (delta < 0) delta += 360;

    // Full 5 to 7 spins + exact delta
    const extraSpins = (5 + Math.floor(Math.random() * 2)) * 360;
    const finalAngle = currentAngle + extraSpins + delta;

    this.rotation.set(finalAngle);

    // After 3.5s spin finishes, trigger outcome
    setTimeout(() => {
      this.spinning.set(false);
      const chosen = this.slices[targetSlice];
      if (chosen.type === 'pass') {
        this.t.pass();
      } else {
        this.t.play(chosen.type);
      }
    }, 3500);
  }
}