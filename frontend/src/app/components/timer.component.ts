import { Component, computed, input } from '@angular/core';
import { Countdown } from '../services/timer.service';

/** Circular glowing countdown with host controls. */
@Component({
  selector: 'app-timer',
  template: `
    @let t = timer();
    <div class="wrap">
      <div class="ring" [class.urgent]="t.seconds() <= 5 && t.running()" [style.--size.px]="size()">
        <svg viewBox="0 0 120 120">
          <defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#a855f7"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
          <circle cx="60" cy="60" r="52" class="bg" />
          <circle cx="60" cy="60" r="52" class="fg" [style.stroke-dashoffset]="offset()" />
        </svg>
        <div class="num display">{{ t.seconds() }}</div>
      </div>
      @if (controls()) {
        <div class="ctl">
          <button class="btn-ghost btn-sm-x" (click)="t.toggle()" [disabled]="t.seconds() === 0" id="timer-toggle">{{ t.running() ? '⏸ Pause' : '▶ Resume' }}</button>
          <button class="btn-ghost btn-sm-x" (click)="t.addSeconds(10)" id="timer-plus">+10s</button>
          <button class="btn-ghost btn-sm-x" (click)="t.reset()" id="timer-reset">↺ Reset</button>
        </div>
      }
    </div>
  `,
  styles: `
    .wrap { display: flex; flex-direction: column; align-items: center; gap: .8rem; }
    .ring { position: relative; width: var(--size); height: var(--size); filter: drop-shadow(0 0 16px rgba(168,85,247,.7)); }
    svg { transform: rotate(-90deg); width: 100%; height: 100%; }
    circle { fill: none; stroke-width: 8; }
    .bg { stroke: rgba(255,255,255,.1); }
    .fg { stroke: url(#tg); stroke-linecap: round; stroke-dasharray: 327; transition: stroke-dashoffset .15s linear; }
    .num { position: absolute; inset: 0; display: grid; place-items: center; font-size: calc(var(--size) * .36); font-weight: 900; }
    .urgent { animation: urgent .5s ease-in-out infinite; filter: drop-shadow(0 0 24px #ef4444); }
    .urgent .fg { stroke: #ef4444; }
    .urgent .num { color: #fecaca; }
    @keyframes urgent { 50% { transform: scale(1.08); } }
    .ctl { display: flex; gap: .5rem; flex-wrap: wrap; justify-content: center; }
  `,
})
export class TimerComponent {
  readonly timer = input.required<Countdown>();
  readonly size = input(180);
  readonly controls = input(true);
  readonly offset = computed(() => 327 * (1 - Math.max(0, Math.min(1, this.timer().fraction() || 0))));
}
