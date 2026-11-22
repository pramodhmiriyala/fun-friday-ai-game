import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameDef } from '../core/games.data';

/** Reusable game card for the AI Game Arena. */
@Component({
  selector: 'app-game-card',
  imports: [RouterLink],
  template: `
    @let g = game();
    <a class="card-x glass" [routerLink]="g.route" [style.--g]="g.gradient" [id]="'card-' + g.id">
      <div class="glow-edge"></div>
      <div class="shine"></div>
      <span class="tag">{{ g.tag }}</span>
      <div class="icon-wrap">
        <div class="icon">{{ g.icon }}</div>
      </div>
      <h3>{{ g.title }}</h3>
      <p>{{ g.desc }}</p>
      <div class="card-foot">
        <span class="play">Launch Game <span>→</span></span>
        <span class="ai-chip">🤖 AI Powered</span>
      </div>
    </a>
  `,
  styles: `
    .card-x {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 1.8rem 1.6rem;
      text-decoration: none;
      color: var(--text);
      height: 100%;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid var(--glass-border);
      background: linear-gradient(170deg, rgba(26, 18, 64, 0.75) 0%, rgba(14, 9, 38, 0.85) 100%);
      transition: transform .32s cubic-bezier(.2,.8,.2,1), box-shadow .32s, border-color .32s;
    }
    .card-x::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--g);
      opacity: .07;
      transition: opacity .35s;
      pointer-events: none;
    }
    .card-x:hover {
      transform: translateY(-8px) scale(1.02);
      border-color: rgba(255,255,255,.35);
      box-shadow: 0 24px 60px rgba(0,0,0,.6), 0 0 45px color-mix(in srgb, var(--purple) 40%, transparent);
    }
    .card-x:hover::before { opacity: .18; }

    .glow-edge {
      position: absolute;
      top: 0;
      left: 10%;
      right: 10%;
      height: 2px;
      background: var(--g);
      opacity: .6;
      filter: blur(1px);
      transition: opacity .3s, transform .3s;
    }
    .card-x:hover .glow-edge { opacity: 1; transform: scaleX(1.15); }

    .shine {
      position: absolute;
      top: 0;
      left: -120%;
      width: 60%;
      height: 100%;
      background: linear-gradient(100deg, transparent, rgba(255,255,255,.25), transparent);
      transform: skewX(-20deg);
      transition: left .85s;
    }
    .card-x:hover .shine { left: 140%; }

    .tag {
      position: absolute;
      top: 1.2rem;
      right: 1.2rem;
      font-size: .7rem;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
      padding: .28rem .75rem;
      border-radius: 99px;
      background: var(--g);
      color: #fff;
      box-shadow: 0 4px 14px rgba(0,0,0,.35);
    }

    .icon-wrap {
      width: 80px;
      height: 80px;
      display: grid;
      place-items: center;
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.03));
      border: 1px solid rgba(255,255,255,.15);
      margin-bottom: 1.2rem;
      box-shadow: 0 10px 24px rgba(0,0,0,.35);
      transition: transform .35s;
    }
    .card-x:hover .icon-wrap { transform: rotate(-6deg) scale(1.08); border-color: rgba(255,255,255,.4); }
    .icon { font-size: 3rem; filter: drop-shadow(0 6px 12px rgba(0,0,0,.4)); }

    h3 { font-size: 1.25rem; font-weight: 900; margin-bottom: .6rem; color: #fff; }
    p { color: #94a3b8; flex: 1; font-size: .95rem; line-height: 1.5; margin-bottom: 1.4rem; }

    .card-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .6rem;
      padding-top: .9rem;
      border-top: 1px solid rgba(255,255,255,.08);
    }
    .ai-chip {
      font-size: .72rem;
      font-weight: 800;
      padding: .24rem .7rem;
      border-radius: 99px;
      background: rgba(168,85,247,.16);
      border: 1px solid rgba(168,85,247,.4);
      color: #d8b4fe;
    }
    .play {
      font-weight: 800;
      font-size: .9rem;
      display: flex;
      align-items: center;
      gap: .35rem;
      background: var(--g);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .play span { transition: transform .3s; color: #fff; -webkit-text-fill-color: #fff; }
    .card-x:hover .play span { transform: translateX(6px); }
  `,
})
export class GameCardComponent {
  readonly game = input.required<GameDef>();
}
