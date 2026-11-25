import { Injectable, computed, signal } from '@angular/core';
import { AiApiService } from './ai-api.service';

const KEY = 'funconnect.hostToken';
const readToken = () => { try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; } };

/**
 * Host login. The token is issued/verified by the backend (shared HOST_PASSWORD).
 * `gate(fn)` runs fn right away for a logged-in host, otherwise opens the login popup first.
 */
@Injectable({ providedIn: 'root' })
export class HostAuthService {
  readonly token = signal<string>(readToken());
  readonly isHost = computed(() => {
    const t = this.token();
    const exp = Number(t.split('.')[0]);
    return !!t && exp * 1000 > Date.now();
  });

  readonly loginOpen = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  private pending: (() => void) | null = null;

  constructor(private api: AiApiService) {}

  async login(password: string): Promise<boolean> {
    if (!password.trim() || this.busy()) return false;
    this.busy.set(true);
    this.error.set(null);
    try {
      const r = await this.api.hostLogin(password.trim());
      this.setToken(r.token);
      this.loginOpen.set(false);
      const fn = this.pending;
      this.pending = null;
      fn?.();
      return true;
    } catch (e) {
      this.error.set((e as Error).message);
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  private setToken(t: string) {
    this.token.set(t);
    try { t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
  }

  logout() { this.setToken(''); }

  gate(fn: () => void) {
    if (this.isHost()) { fn(); return; }
    this.pending = fn;
    this.error.set(null);
    this.loginOpen.set(true);
  }

  closeLogin() { this.loginOpen.set(false); this.pending = null; }
}
