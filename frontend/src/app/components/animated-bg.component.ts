import { Component } from '@angular/core';

@Component({
  selector: 'app-animated-bg',
  template: `
    <div class="bg" aria-hidden="true">
      <div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div>
      <div class="grid"></div>
      @for (p of particles; track $index) {
        <span class="p" [style.left.%]="p.x" [style.width.px]="p.s" [style.height.px]="p.s"
              [style.animation-duration.s]="p.d" [style.animation-delay.s]="p.delay" [style.background]="p.c"
              [style.box-shadow]="'0 0 ' + p.s * 3 + 'px ' + p.c"></span>
      }
    </div>
  `,
  styles: `
    .bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
      background: radial-gradient(ellipse at 50% -10%, #1b0b4d 0%, #0a0526 50%, #05020f 100%); }
    .orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: .5; animation: drift 22s ease-in-out infinite alternate; }
    .o1 { width: 620px; height: 620px; background: #7c3aed; top: -10%; left: -8%; }
    .o2 { width: 560px; height: 560px; background: #2563eb; bottom: -15%; right: -8%; animation-delay: -7s; }
    .o3 { width: 440px; height: 440px; background: #db2777; top: 35%; left: 45%; opacity: .32; animation-delay: -13s; }
    @keyframes drift { to { transform: translate(120px, 80px) scale(1.25); } }
    .grid { position: absolute; inset: 0; opacity: .12;
      background-image: linear-gradient(rgba(168,85,247,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,.5) 1px, transparent 1px);
      background-size: 70px 70px; mask-image: radial-gradient(ellipse at center, #000 0%, transparent 75%);
      animation: gridMove 12s linear infinite; }
    @keyframes gridMove { to { background-position: 0 70px; } }
    .p { position: absolute; bottom: -20px; border-radius: 50%; opacity: 0; animation: floatUp linear infinite; }
    @keyframes floatUp { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: .9; }
      90% { opacity: .7; } 100% { transform: translateY(-110vh) translateX(40px); opacity: 0; } }
  `,
})
export class AnimatedBgComponent {
  private colors = ['#a855f7', '#3b82f6', '#ec4899', '#22d3ee', '#f0abfc'];
  readonly particles = Array.from({ length: 36 }, (_, i) => ({
    x: Math.random() * 100, s: 2 + Math.random() * 5, d: 12 + Math.random() * 18,
    delay: -Math.random() * 30, c: this.colors[i % this.colors.length],
  }));
}
