import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  icon: string;
}

/** Styled replacement for window.confirm(). `ask()` resolves true/false. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request = signal<ConfirmRequest | null>(null);
  private resolver: ((v: boolean) => void) | null = null;

  ask(message: string, opts: Partial<ConfirmRequest> = {}): Promise<boolean> {
    this.resolver?.(false);
    this.request.set({ title: 'Are you sure?', confirmLabel: 'Yes, do it', danger: true, icon: '⚠️', message, ...opts });
    return new Promise((res) => (this.resolver = res));
  }

  answer(v: boolean) {
    this.request.set(null);
    this.resolver?.(v);
    this.resolver = null;
  }
}
