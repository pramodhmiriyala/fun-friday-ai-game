import { Component, ElementRef, OnDestroy, effect, inject, input, signal, viewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { WheelItem, WheelMode, WheelService } from '../services/wheel.service';
import { ScoringService } from '../services/scoring.service';
import { SoundService } from '../services/sound.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-spin-wheel',
  template: `
    <div class="tabs">
      @for (m of modes; track m.id) {
        <button class="btn-ghost" [class.active]="mode() === m.id" [disabled]="wheel.spinning()" (click)="setMode(m.id)" [id]="'wheel-tab-' + m.id">{{ m.icon }} {{ m.label }}</button>
      }
    </div>

    <div class="stage" [style.--size.px]="size()">
      <div class="pointer">▼</div>
      <canvas #cv class="cv" [class.spinning]="wheel.spinning()"></canvas>
      <button class="hub display" (click)="spin()" [disabled]="wheel.spinning() || items().length < 2" id="btn-spin">{{ wheel.spinning() ? '…' : 'SPIN' }}</button>
    </div>
    @if (items().length < 2) { <p class="text-center muted mt-3">Add at least 2 teams to spin the team wheel.</p> }

    @if (result(); as r) {
      <div class="overlay" (click)="close()">
        <div class="res glass pop-in" (click)="$event.stopPropagation()" [style.--rc]="r.color">
          <div class="burst"></div>
          <div class="ic">{{ r.icon }}</div>
          <div class="kicker">{{ mode() === 'teams' ? 'The chosen team is' : mode() === 'games' ? 'Next game is' : 'Bonus challenge!' }}</div>
          <h2 class="display name" [class.grad-text]="mode() !== 'bonus'" [class.bonus-text]="mode() === 'bonus'">
            {{ mode() === 'bonus' ? r.ref : r.label }}
          </h2>
          @if (mode() === 'bonus') {
            <div class="pts display">+{{ r.pts }} pts</div>
            <div class="d-flex gap-2 justify-content-center flex-wrap mt-3">
              <button class="btn-neon btn-green" (click)="awardBonus(r.pts!)" id="btn-bonus-award">✅ Completed — award {{ r.pts }}</button>
              <button class="btn-ghost" (click)="close()">Skip</button>
            </div>
          } @else if (mode() === 'games') {
            <div class="d-flex gap-2 justify-content-center mt-3">
              <button class="btn-neon" (click)="goGame(r.ref!)" id="btn-go-game">▶ Play it!</button>
              <button class="btn-ghost" (click)="close()">Close</button>
            </div>
          } @else {
            <p class="muted">is now the active team on stage.</p>
            <button class="btn-neon mt-2" (click)="close()" id="btn-wheel-ok">Let's go!</button>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .tabs { display: flex; gap: .6rem; justify-content: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .stage { position: relative; width: var(--size); height: var(--size); margin: 0 auto; max-width: 100%; }
    .cv { width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 0 8px rgba(255,255,255,.08), 0 0 60px rgba(168,85,247,.6), 0 0 120px rgba(59,130,246,.3); }
    .cv.spinning { box-shadow: 0 0 0 8px rgba(255,255,255,.12), 0 0 90px rgba(236,72,153,.8), 0 0 160px rgba(168,85,247,.5); }
    .pointer { position: absolute; top: -26px; left: 50%; transform: translateX(-50%); font-size: 3rem; color: var(--gold); z-index: 3;
      text-shadow: 0 0 20px var(--gold), 0 4px 6px #000; line-height: 1; }
    .hub { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 22%; aspect-ratio: 1; border-radius: 50%; border: 4px solid #fff;
      background: var(--grad); color: #fff; font-weight: 900; font-size: clamp(.8rem, 2vw, 1.4rem); cursor: pointer; box-shadow: 0 0 30px var(--pink); z-index: 2; transition: transform .2s; }
    .hub:hover:not(:disabled) { transform: translate(-50%, -50%) scale(1.1); } .hub:disabled { cursor: not-allowed; opacity: .85; }
    .overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(3,0,15,.8); backdrop-filter: blur(8px); display: grid; place-items: center; animation: fadeUp .3s; padding: 1rem; }
    .res { position: relative; text-align: center; padding: 3rem 4rem; max-width: 720px; overflow: hidden; border: 2px solid var(--rc); box-shadow: 0 0 80px var(--rc); }
    .burst { position: absolute; inset: -50%; background: conic-gradient(from 0deg, transparent 0 10deg, color-mix(in srgb, var(--rc) 35%, transparent) 10deg 20deg, transparent 20deg 30deg); background-size: 100% 100%; animation: spinSlow 14s linear infinite; z-index: 0; opacity: .6; }
    @keyframes spinSlow { to { transform: rotate(360deg); } }
    .res > *:not(.burst) { position: relative; z-index: 1; }
    .ic { font-size: 6rem; animation: bounce 1s infinite alternate; } @keyframes bounce { to { transform: translateY(-14px) scale(1.1); } }
    .kicker { text-transform: uppercase; letter-spacing: .25em; color: var(--muted); font-weight: 700; }
    .name { font-size: clamp(1.6rem, 4vw, 3rem); font-weight: 900; margin: .5rem 0; }
    .pts { font-size: 2.4rem; color: var(--gold); text-shadow: 0 0 20px var(--gold); }
  `,
})
export class SpinWheelComponent implements AfterViewInit, OnDestroy {
  readonly wheel = inject(WheelService);
  private teams = inject(TeamService);
  private scoring = inject(ScoringService);
  private sound = inject(SoundService);
  private router = inject(Router);
  readonly size = input(560);
  readonly mode = signal<WheelMode>('teams');
  readonly modes: { id: WheelMode; label: string; icon: string }[] = [
    { id: 'teams', label: 'Pick a Team', icon: '👥' },
    { id: 'games', label: 'Pick a Game', icon: '🎮' },
    { id: 'bonus', label: 'Bonus Challenge', icon: '🎁' },
  ];
  readonly result = signal<WheelItem | null>(null);
  readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private rot = 0;
  private raf = 0;
  private ready = false;

  items() { return this.wheel.items(this.mode()); }

  constructor() {
    effect(() => {
      this.mode(); this.teams.teams(); this.size();
      if (this.ready) queueMicrotask(() => this.draw());
    });
  }

  ngAfterViewInit() { this.ready = true; this.draw(); }
  ngOnDestroy() { cancelAnimationFrame(this.raf); this.wheel.spinning.set(false); }

  setMode(m: WheelMode) { this.mode.set(m); }

  private draw() {
    const canvas = this.cv().nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(this.size() * dpr);
    canvas.width = px; canvas.height = px;
    const ctx = canvas.getContext('2d')!;
    const items = this.items();
    const c = px / 2;
    ctx.clearRect(0, 0, px, px);
    if (!items.length) {
      ctx.fillStyle = '#1b1040'; ctx.beginPath(); ctx.arc(c, c, c - 4, 0, 7); ctx.fill();
      return;
    }
    const seg = (Math.PI * 2) / items.length;
    items.forEach((it, i) => {
      const a0 = this.rot + i * seg;
      const g = ctx.createRadialGradient(c, c, c * 0.15, c, c, c);
      g.addColorStop(0, it.color); g.addColorStop(1, shade(it.color, -0.35));
      ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, c - 6, a0, a0 + seg); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2 * dpr; ctx.stroke();
      ctx.save();
      ctx.translate(c, c); ctx.rotate(a0 + seg / 2);
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6 * dpr;
      const fs = Math.min(px * 0.052, (px * 0.5 * seg) * 0.5);
      const edge = c - px * 0.06;
      ctx.font = `${fs * 1.3}px sans-serif`;
      ctx.fillText(it.icon ?? '', edge, fs * 0.45);
      ctx.font = `800 ${fs}px Outfit, sans-serif`;
      ctx.fillText(truncate(it.label, 14), edge - fs * 1.9, fs * 0.35);
      ctx.restore();

    });
    // rim lights
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(c + Math.cos(a) * (c - 3 * dpr), c + Math.sin(a) * (c - 3 * dpr), 3 * dpr, 0, 7);
      ctx.fillStyle = i % 2 ? '#facc15' : '#fff'; ctx.shadowColor = '#facc15'; ctx.shadowBlur = 8 * dpr; ctx.fill();
    }
  }

  spin() {
    if (this.wheel.spinning()) return;
    const mode = this.mode();
    const items = this.items();
    const idx = this.wheel.pick(mode);
    if (idx < 0 || items.length < 2) return;
    const seg = (Math.PI * 2) / items.length;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const target = Math.PI * 1.5 - (idx + 0.5) * seg + jitter;
    const TAU = Math.PI * 2;
    const delta = (((target - this.rot) % TAU) + TAU) % TAU + TAU * (6 + Math.floor(Math.random() * 3));
    const start = this.rot, t0 = performance.now(), dur = 6200;
    let lastSlice = -1;
    this.wheel.spinning.set(true);
    this.result.set(null);
    this.sound.whoosh();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      this.rot = start + delta * e;
      const slice = Math.floor((((Math.PI * 1.5 - this.rot) % TAU) + TAU) % TAU / seg);
      if (slice !== lastSlice) { lastSlice = slice; this.sound.wheelTick(); }
      this.draw();
      if (p < 1) this.raf = requestAnimationFrame(step);
      else {
        this.rot = ((this.rot % TAU) + TAU) % TAU;
        this.wheel.spinning.set(false);
        setTimeout(() => { this.wheel.finish(mode, items[idx]); this.result.set(items[idx]); }, 350);
      }
    };
    this.raf = requestAnimationFrame(step);
  }

  awardBonus(pts: number) {
    this.scoring.award(this.teams.activeTeamId(), pts, 'wheel', 'Bonus challenge');
    this.sound.correct();
    this.close();
  }
  goGame(route: string) { this.close(); this.router.navigateByUrl(route); }
  close() { this.result.set(null); }
}

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + amt))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
