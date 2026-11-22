import { Component } from '@angular/core';
import { SpinWheelComponent } from '../components/spin-wheel.component';
import { TeamPickerComponent } from '../components/team-picker.component';

@Component({
  selector: 'app-wheel-page',
  imports: [SpinWheelComponent, TeamPickerComponent],
  template: `
    <section class="page">
      <div class="text-center mb-4">
        <span class="badge-pill">🎡 Wheel of Fate</span>
        <h1 class="page-title grad-text">Spin the Wheel</h1>
        <p class="muted" style="max-width:600px;margin:.5rem auto 0">Use the spinner whenever you can't decide what's next. Pick a tab below to change what the wheel decides!</p>
      </div>

      <!-- When to use guide -->
      <div class="guide-grid">
        <div class="guide-card">
          <div class="g-icon">👥</div>
          <div class="g-body">
            <div class="g-title">Pick a Team</div>
            <div class="g-desc">Spin this <b>between games</b> to randomly choose which team plays next. Fair and drama-filled!</div>
            <div class="g-when">📌 Use when: Starting a new round and you're not sure whose turn it is</div>
          </div>
        </div>
        <div class="guide-card">
          <div class="g-icon">🎮</div>
          <div class="g-body">
            <div class="g-title">Pick a Game</div>
            <div class="g-desc">Spin this <b>to pick the next game</b> from all 7 available games. Let fate decide the fun!</div>
            <div class="g-when">📌 Use when: You've finished a round and want to randomly choose the next activity</div>
          </div>
        </div>
        <div class="guide-card">
          <div class="g-icon">🎁</div>
          <div class="g-body">
            <div class="g-title">Bonus Challenge</div>
            <div class="g-desc">Spin for a <b>wild bonus task</b> — dance, joke, or tongue-twister. Win extra points!</div>
            <div class="g-when">📌 Use when: Anytime mid-game you want to add excitement or fill time</div>
          </div>
        </div>
      </div>

      <div class="glass glass-pad d-inline-block mt-4">
        <app-team-picker />
      </div>

      <div class="pt-4 pb-5"><app-spin-wheel [size]="wheelSize" /></div>
    </section>
  `,
  styles: `
    .guide-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .guide-card { display: flex; gap: 1rem; align-items: flex-start; padding: 1.2rem 1.4rem;
      background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 16px;
      transition: border-color .3s, box-shadow .3s; }
    .guide-card:hover { border-color: rgba(168,85,247,.4); box-shadow: 0 0 20px rgba(168,85,247,.15); }
    .g-icon { font-size: 2.4rem; flex: none; }
    .g-body { display: flex; flex-direction: column; gap: .3rem; }
    .g-title { font-weight: 800; font-size: 1.05rem; }
    .g-desc { color: var(--muted); font-size: .92rem; line-height: 1.5; }
    .g-when { font-size: .8rem; color: rgba(168,85,247,.85); border-left: 2px solid rgba(168,85,247,.4); padding-left: .5rem; margin-top: .2rem; }
  `,
})
export class WheelPageComponent {
  readonly wheelSize = Math.max(320, Math.min(680, Math.round(Math.min(window.innerWidth - 48, window.innerHeight - 330))));
}
