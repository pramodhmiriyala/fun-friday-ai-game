import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TeamPickerComponent } from '../components/team-picker.component';
import { TimerComponent } from '../components/timer.component';
import { AiApiService, PanicTask } from '../services/ai-api.service';
import { ConfettiService } from '../services/confetti.service';
import { ScoringService } from '../services/scoring.service';
import { SoundService } from '../services/sound.service';
import { TeamService } from '../services/team.service';
import { TimerService } from '../services/timer.service';

const PANIC_SECONDS = 20;
const PANIC_PTS = 10;

@Component({
  selector: 'app-party-game',
  imports: [RouterLink, TeamPickerComponent, TimerComponent],
  template: `
    <section class="page wrap">
      <div class="defuse-wrap">
        <a routerLink="/" class="back">← Arena</a>
        <div class="mt-2">
          <span class="badge-pill">🌪️ 20-Second Tongue Twister</span>
        </div>
        <h1 class="page-title grad-text">Tongue Twister Defuse</h1>
        <p class="muted sub-info">A player on stage must repeat the famous tongue twister <b>3 TIMES FAST</b> before the 20-second timer runs out!</p>

        <div class="glass glass-pad mb-4"><app-team-picker /></div>
        @if (error()) { <div class="alert-neon mb-3">{{ error() }}</div> }

        <div class="row g-4 align-items-stretch">
          <div class="col-12 col-lg-8">
            <div class="stage glass" [class.ready]="phase() === 'ready'" [class.live]="phase() === 'live'" [class.boom]="phase() === 'boom'" [class.defused]="phase() === 'defused'">
              @if (phase() === 'idle') {
                <div class="text-center py-4">
                  <div class="ic">🌪️</div>
                  <h2 class="display">Say it 3 Times Fast!</h2>
                  <p class="muted max-w mt-2">
                    Player from <b class="text-white">{{ teams.activeTeam()?.name ?? 'active team' }}</b> takes the mic.
                    First, reveal the tongue twister so they can read the words. When they say <b>START</b>, launch the 20-second countdown!
                  </p>
                  <button class="btn-neon btn-lg-x pulse mt-3" (click)="revealTwister()" [disabled]="loading()" id="btn-panic-reveal">
                    {{ loading() ? '🤖 Loading twisters…' : '👀 REVEAL TONGUE TWISTER' }}
                  </button>
                </div>
              } @else if (phase() === 'ready' && panicCur()) {
                @let t = panicCur()!;
                <div class="live-stage text-center w-100">
                  <div class="lbl">{{ t.emoji }} {{ t.type.toUpperCase() }}</div>
                  <div class="twister-box">
                    <div class="q display grad-text">{{ t.task }}</div>
                  </div>

                  <div class="ready-banner mt-3">
                    <span class="badge-ready">👀 PREVIEW READY — Take 5 seconds to read the words!</span>
                    <p class="muted mt-2 mb-0">Player on mic: Take a breath and say <b>"START"</b> when ready!</p>
                  </div>

                  <div class="actions mt-4">
                    <button class="btn-neon btn-green btn-lg-x pulse" (click)="startCountdown()" id="btn-start-countdown">
                      ⏱️ START 20-SECOND TIMER (Player Ready!) [Space]
                    </button>
                    <button class="btn-ghost" (click)="revealTwister()" [disabled]="loading()" id="btn-swap-twister">
                      🔄 Swap Twister
                    </button>
                  </div>
                </div>
              } @else if (phase() === 'live' && panicCur()) {
                @let t = panicCur()!;
                <div class="live-stage text-center w-100">
                  <div class="lbl">{{ t.emoji }} {{ t.type.toUpperCase() }} · 🔴 TIMER RUNNING</div>
                  <div class="twister-box twister-box-live">
                    <div class="q display grad-text">{{ t.task }}</div>
                  </div>

                  <!-- 3x Repetition Tracker -->
                  <div class="rep-tracker mt-3">
                    <span class="rep-lbl">Repeat 3 Times:</span>
                    <div class="rep-pills">
                      <button class="rep-pill" [class.done]="repsDone() >= 1" (click)="toggleRep(1)">
                        {{ repsDone() >= 1 ? '✓ 1st Done' : '1st Time' }}
                      </button>
                      <button class="rep-pill" [class.done]="repsDone() >= 2" (click)="toggleRep(2)">
                        {{ repsDone() >= 2 ? '✓ 2nd Done' : '2nd Time' }}
                      </button>
                      <button class="rep-pill" [class.done]="repsDone() >= 3" (click)="toggleRep(3)">
                        {{ repsDone() >= 3 ? '✓ 3rd Done' : '3rd Time' }}
                      </button>
                    </div>
                  </div>

                  <div class="actions mt-4">
                    <button class="btn-neon btn-green btn-lg-x" [class.pulse]="repsDone() >= 3" (click)="panicDefused()" id="btn-panic-defused">
                      ✂️ DEFUSED! (3x Done) +{{ pts }} pts
                    </button>
                    <button class="btn-neon btn-pink" (click)="panicBoom()" id="btn-panic-boom">
                      💥 Tongue Twisted / Failed
                    </button>
                  </div>
                </div>
              } @else if (phase() === 'defused') {
                <div class="text-center py-4">
                  <div class="ic">😎</div>
                  <h2 class="display grad-text">BOOM PREVENTED! +{{ pts }} pts</h2>
                  <p class="text-white mt-1">Flawless diction! {{ teams.activeTeam()?.name ?? 'The team' }} scores +{{ pts }} points.</p>
                  <button class="btn-neon btn-lg-x mt-3" (click)="revealTwister()" id="btn-panic-next">➡ Next Twister</button>
                </div>
              } @else {
                <div class="text-center py-4">
                  <div class="ic">💥</div>
                  <h2 class="display text-danger">BOOM! Tongue Got Twisted!</h2>
                  <p class="muted mt-1">Time ran out or words tripped up! Better luck on the next round.</p>
                  <button class="btn-neon mt-3" (click)="revealTwister()" id="btn-panic-retry">➡ Next Twister</button>
                </div>
              }
            </div>
          </div>
          <div class="col-12 col-lg-4">
            <div class="glass glass-pad text-center h-100 d-flex flex-column align-items-center justify-content-center">
              <div class="timer-lbl mb-2">⏱ 20-SECOND COUNTDOWN</div>
              <app-timer [timer]="timer" [size]="210" [controls]="false" />
              <div class="muted small mt-3">Watch the clock! When it hits 0, the bomb detonates!</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .defuse-wrap { max-width: 1040px; margin: 0 auto; width: 100%; }
    .back { color: var(--muted); text-decoration: none; font-weight: 700; font-size: .95rem; }
    .back:hover { color: #fff; }
    .sub-info { font-size: 1.05rem; margin-top: .3rem; }
    .stage { min-height: 440px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2.2rem; transition: .4s; border-radius: 24px; }
    .stage.ready { box-shadow: 0 0 50px rgba(59,130,246,.35); border-color: #3b82f6; }
    .stage.live { box-shadow: 0 0 60px rgba(168,85,247,.45); border-color: var(--purple); }
    .stage.defused { box-shadow: 0 0 70px rgba(34,197,94,.5); border-color: #22c55e; }
    .stage.boom { box-shadow: 0 0 70px rgba(239,68,68,.7); border-color: #ef4444; }
    .ic { font-size: 5rem; animation: float 3s ease-in-out infinite; }
    @keyframes float { 50% { transform: translateY(-10px); } }
    .lbl { letter-spacing: .25em; font-size: .85rem; color: #facc15; font-weight: 800; margin-bottom: .6rem; }
    .twister-box { background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.12); border-radius: 18px; padding: 1.6rem 2rem; margin: .5rem 0; width: 100%; }
    .twister-box-live { box-shadow: 0 0 35px rgba(239,68,68,.3); border-color: rgba(239,68,68,.4); }
    .q { font-size: clamp(1.4rem, 3.2vw, 2.2rem); font-weight: 900; line-height: 1.35; margin: 0; color: #fff; }
    .ready-banner { background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.3); border-radius: 14px; padding: 1rem 1.4rem; max-width: 640px; margin: 0 auto; }
    .badge-ready { display: inline-block; background: rgba(59,130,246,.25); border: 1px solid #3b82f6; color: #93c5fd; font-weight: 800; font-size: .82rem; letter-spacing: .08em; padding: .25rem .75rem; border-radius: 999px; }
    .rep-tracker { display: flex; align-items: center; justify-content: center; gap: .8rem; flex-wrap: wrap; }
    .rep-lbl { font-size: .88rem; font-weight: 800; color: var(--muted); letter-spacing: .06em; }
    .rep-pills { display: flex; gap: .6rem; flex-wrap: wrap; }
    .rep-pill { background: rgba(255,255,255,.07); border: 2px solid var(--glass-border); color: var(--text); padding: .4rem .9rem; border-radius: 999px; font-weight: 800; font-size: .9rem; cursor: pointer; transition: .2s; font-family: var(--font); }
    .rep-pill:hover { border-color: var(--cyan); }
    .rep-pill.done { background: rgba(34,197,94,.25); border-color: #22c55e; color: #86efac; box-shadow: 0 0 15px rgba(34,197,94,.4); transform: scale(1.05); }
    .actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
    .timer-lbl { font-weight: 800; font-size: .85rem; letter-spacing: .12em; color: var(--muted); }
    .max-w { max-width: 580px; margin: 0 auto; }
  `,
})
export class PartyGameComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AiApiService);
  private sound = inject(SoundService);
  private confetti = inject(ConfettiService);
  private scoring = inject(ScoringService);
  readonly teams = inject(TeamService);

  readonly pts = PANIC_PTS;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly phase = signal<'idle' | 'ready' | 'live' | 'defused' | 'boom'>('idle');
  readonly panicCur = signal<PanicTask | null>(null);
  readonly repsDone = signal<number>(0);
  readonly timer;

  private panicQ: PanicTask[] = [];
  private usedPanic: string[] = [];

  constructor() {
    this.timer = inject(TimerService).create('panic-defuse', PANIC_SECONDS);
    this.timer.onExpire(() => {
      if (this.phase() === 'live') {
        this.sound.buzzer();
        this.confetti.burst(0.5, 0.4, 60);
        this.phase.set('boom');
      }
    });
  }

  ngOnInit() {
    if (this.panicQ.length === 0) {
      this.refill(this.panicQ, async () => (await this.api.panicTasks(this.usedPanic)).tasks).then(q => this.panicQ = q);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (this.phase() === 'ready' && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      this.startCountdown();
    }
  }

  private async refill<T>(q: T[], fetch: () => Promise<T[]>): Promise<T[]> {
    if (q.length > 0) return q;
    this.loading.set(true);
    this.error.set(null);
    try {
      return await fetch();
    } catch (e) {
      this.error.set((e as Error).message);
      return q;
    } finally {
      this.loading.set(false);
    }
  }

  toggleRep(num: number) {
    if (this.phase() !== 'live') return;
    this.sound.click();
    this.repsDone.update(cur => (cur === num ? num - 1 : num));
  }

  async revealTwister() {
    this.repsDone.set(0);
    this.timer.reset(PANIC_SECONDS);
    this.panicQ = await this.refill(this.panicQ, async () => (await this.api.panicTasks(this.usedPanic)).tasks);
    const t = this.panicQ.shift();
    if (!t) return;
    this.usedPanic = [...this.usedPanic, t.task].slice(-30);
    this.panicCur.set(t);
    this.phase.set('ready');
    this.sound.whoosh();

    // Pre-fetch in background so next twister is instant
    if (this.panicQ.length <= 2) {
      this.api.panicTasks(this.usedPanic).then(res => {
        this.panicQ = [...this.panicQ, ...res.tasks];
      }).catch(() => {});
    }
  }

  startCountdown() {
    if (this.phase() !== 'ready' || !this.panicCur()) return;
    this.repsDone.set(0);
    this.phase.set('live');
    this.sound.click();
    this.timer.start(PANIC_SECONDS);
  }

  panicDefused() {
    if (this.phase() !== 'live') return;
    this.timer.reset(PANIC_SECONDS);
    this.scoring.award(this.teams.activeTeamId(), PANIC_PTS, 'panic', this.panicCur()?.task ?? '');
    this.sound.correct();
    this.confetti.burst(0.5, 0.45, 120);
    this.phase.set('defused');
  }

  panicBoom() {
    if (this.phase() !== 'live') return;
    this.timer.reset(PANIC_SECONDS);
    this.sound.buzzer();
    this.phase.set('boom');
  }
}
