import { Component, OnDestroy, effect, input, signal } from '@angular/core';

/** Animated number that counts up/down to its target. */
@Component({
  selector: 'app-count-up',
  template: `{{ shown() }}`,
})
export class CountUpComponent implements OnDestroy {
  readonly value = input.required<number>();
  readonly shown = signal(0);
  private raf = 0;

  constructor() {
    effect(() => {
      const target = this.value();
      const from = this.shown();
      if (from === target) return;
      cancelAnimationFrame(this.raf);
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 900);
        const e = 1 - Math.pow(1 - p, 3);
        this.shown.set(Math.round(from + (target - from) * e));
        if (p < 1) this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    });
  }
  ngOnDestroy() { cancelAnimationFrame(this.raf); }
}
