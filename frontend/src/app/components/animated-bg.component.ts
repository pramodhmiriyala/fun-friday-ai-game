import { Component } from '@angular/core';

@Component({
  selector: 'app-animated-bg',
  template: `
    <div class="bg" aria-hidden="true">
      <div class="orb o1"></div>
      <div class="orb o2"></div>
      <div class="grid"></div>
    </div>
  `,
  styles: `
    .bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
      background: radial-gradient(ellipse at 50% 0%, #160c38 0%, #07041a 70%);
      contain: strict;
    }
    /* GPU-accelerated gradient orbs: ultra-smooth, zero blur calculation overhead */
    .orb {
      position: absolute;
      border-radius: 50%;
      opacity: .45;
      pointer-events: none;
      will-change: transform;
      animation: drift 25s ease-in-out infinite alternate;
    }
    .o1 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(124, 58, 237, 0.08) 50%, transparent 70%);
      top: -15%;
      left: -10%;
    }
    .o2 {
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0.06) 50%, transparent 70%);
      bottom: -15%;
      right: -10%;
      animation-delay: -10s;
    }
    @keyframes drift {
      from { transform: translate3d(0, 0, 0); }
      to   { transform: translate3d(50px, 30px, 0); }
    }
    .grid {
      position: absolute;
      inset: 0;
      opacity: .04;
      background-image:
        linear-gradient(rgba(168,85,247,.4) 1px, transparent 1px),
        linear-gradient(90deg, rgba(168,85,247,.4) 1px, transparent 1px);
      background-size: 80px 80px;
    }
  `,
})
export class AnimatedBgComponent {}
