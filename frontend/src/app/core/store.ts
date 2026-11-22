import { WritableSignal, effect, signal } from '@angular/core';

/**
 * A signal that is persisted to localStorage and kept in sync across browser tabs.
 * This is what lets the Host Dashboard tab control the projector tab on the same laptop.
 * Must be called in an injection context (e.g. a service field initializer).
 */
export function persisted<T>(key: string, initial: T): WritableSignal<T> {
  const storageKey = 'funfriday.' + key;
  const merge = (parsed: unknown): T =>
    initial && typeof initial === 'object' && !Array.isArray(initial)
      ? ({ ...(initial as object), ...(parsed as object) } as T)
      : (parsed as T);

  let lastRaw: string | null = null;
  let start = initial;
  try {
    lastRaw = localStorage.getItem(storageKey);
    if (lastRaw) start = merge(JSON.parse(lastRaw));
  } catch {
    /* corrupted or unavailable storage: fall back to defaults */
  }

  const sig = signal<T>(start);

  effect(() => {
    const raw = JSON.stringify(sig());
    if (raw === lastRaw) return;
    lastRaw = raw;
    try {
      localStorage.setItem(storageKey, raw);
    } catch {
      /* storage full / blocked */
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key !== storageKey || !e.newValue || e.newValue === lastRaw) return;
    try {
      lastRaw = e.newValue;
      sig.set(merge(JSON.parse(e.newValue)));
    } catch {
      /* ignore */
    }
  });

  return sig;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Cryptographically fair random integer in [0, max). */
export function secureRandomInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}
