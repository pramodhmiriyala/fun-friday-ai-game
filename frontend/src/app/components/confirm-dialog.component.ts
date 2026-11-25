import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../services/confirm.service';

/** Global themed confirmation dialog. */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (cs.request(); as r) {
      <div class="backdrop" (click)="cs.answer(false)">
        <div class="dlg pop-in" [class.danger]="r.danger" role="alertdialog" (click)="$event.stopPropagation()">
          <div class="ic">{{ r.icon }}</div>
          <h2>{{ r.title }}</h2>
          <p>{{ r.message }}</p>
          <div class="btns">
            <button class="btn-ghost" (click)="cs.answer(false)" id="btn-confirm-no">Cancel</button>
            <button class="btn-neon" [class.btn-pink]="r.danger" (click)="cs.answer(true)" id="btn-confirm-yes">{{ r.confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .backdrop { position: fixed; inset: 0; z-index: 600; display: grid; place-items: center;
      background: radial-gradient(circle at 50% 40%, rgba(124,58,237,.25), rgba(5,3,20,.82)); backdrop-filter: blur(8px); }
    .dlg { width: min(420px, 92vw); text-align: center; padding: 2rem 1.8rem 1.6rem; border-radius: 24px;
      background: linear-gradient(160deg, rgba(40,24,90,.95), rgba(16,10,44,.96));
      border: 1.5px solid rgba(168,85,247,.55); box-shadow: 0 0 60px rgba(168,85,247,.35), 0 20px 50px rgba(0,0,0,.5); }
    .dlg.danger { border-color: rgba(244,63,94,.6); box-shadow: 0 0 60px rgba(244,63,94,.3), 0 20px 50px rgba(0,0,0,.5); }
    .ic { font-size: 3rem; filter: drop-shadow(0 0 14px rgba(250,204,21,.6)); animation: bob 2.2s ease-in-out infinite; }
    @keyframes bob { 50% { transform: translateY(-5px) rotate(-4deg); } }
    h2 { font-size: 1.4rem; font-weight: 800; margin: .4rem 0 .3rem; }
    p { color: var(--muted); margin: 0 0 1.4rem; line-height: 1.45; }
    .btns { display: flex; gap: .8rem; justify-content: center; }
  `,
})
export class ConfirmDialogComponent {
  readonly cs = inject(ConfirmService);

  @HostListener('document:keydown.escape') onEsc() { if (this.cs.request()) this.cs.answer(false); }
}
