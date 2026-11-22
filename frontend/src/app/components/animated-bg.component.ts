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
      transform: translateZ(0);
    }
    /* Hardware-accelerated GPU orbs without heavy dynamic re-rendering */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: .35;
      will-change: transform;
      animation: drift 25s ease-in-out infinite alternate;
    }
    .o1 {
      width: 500px;
      height: 500px;
      background: #7c3aed;
      top: -15%;
      left: -10%;
    }
    .o2 {
      width: 450px;
      height: 450px;
      background: #ec4899;
      bottom: -15%;
      right: -10%;
      animation-delay: -10s;
    }
    @keyframes drift {
      from { transform: translate3d(0, 0, 0); }
      to   { transform: translate3d(60px, 40px, 0); }
    }
    .grid {
      position: absolute;
      inset: 0;
      opacity: .06;
      background-image:
        linear-gradient(rgba(168,85,247,.4) 1px, transparent 1px),
        linear-gradient(90deg, rgba(168,85,247,.4) 1px, transparent 1px);
      background-size: 80px 80px;
      mask-image: radial-gradient(ellipse at center, #000 0%, transparent 80%);
    }
  `,
})
export class AnimatedBgComponent {}
