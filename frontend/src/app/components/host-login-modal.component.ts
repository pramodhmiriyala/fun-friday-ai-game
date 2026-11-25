import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HostAuthService } from '../services/host-auth.service';

/** Global host-login popup (opened by HostAuthService.gate()). */
@Component({
  selector: 'app-host-login-modal',
  imports: [FormsModule],
  template: `
    @if (auth.loginOpen()) {
      <div class="backdrop" (click)="auth.closeLogin()">
        <div class="glass glass-pad box pop-in" (click)="$event.stopPropagation()">
          <div class="ic">🔐</div>
          <h2 class="h4 mb-1">Host login</h2>
          <p class="muted small">Enter the host password to continue.</p>
          <input class="form-control" type="password" placeholder="Host password" id="input-host-password"
                 [(ngModel)]="pw" (keyup.enter)="go()" (keyup.escape)="auth.closeLogin()" autofocus>
          @if (auth.error()) { <div class="alert-neon mt-2 py-1 small">{{ auth.error() }}</div> }
          <div class="d-flex gap-2 mt-3 justify-content-end">
            <button class="btn-ghost btn-sm-x" (click)="auth.closeLogin()" id="btn-host-cancel">Cancel</button>
            <button class="btn-neon btn-sm-x" (click)="go()" [disabled]="auth.busy() || !pw.trim()" id="btn-host-login">
              {{ auth.busy() ? 'Checking…' : 'Unlock' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .backdrop { position: fixed; inset: 0; z-index: 500; background: rgba(5,3,20,.7); backdrop-filter: blur(6px); display: grid; place-items: center; }
    .box { width: min(380px, 92vw); text-align: center; }
    .ic { font-size: 2.6rem; }
  `,
})
export class HostLoginModalComponent {
  readonly auth = inject(HostAuthService);
  pw = '';

  async go() {
    if (await this.auth.login(this.pw)) this.pw = '';
  }
}
