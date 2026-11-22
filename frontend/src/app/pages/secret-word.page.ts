import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface SecretPayload {
  w: string;
  r: string[];
}

/** Private describer-only view opened from a copied link so the main shared screen stays spoiler-free. */
@Component({
  selector: 'app-secret-word',
  template: `
    <section class="page secret-wrap">
      <div class="glass glass-pad secret-card text-center">
        <span class="badge-pill secret-pill">🤫 TOP SECRET · DESCRIBER ONLY</span>
        @if (card(); as c) {
          <p class="muted mt-3 mb-1">Describe this word to the team without saying any forbidden words!</p>
          <div class="lbl mt-4">YOUR SECRET WORD</div>
          <div class="word display grad-text">{{ c.w }}</div>
          <div class="lbl mt-4">🚫 FORBIDDEN WORDS (DO NOT SAY!)</div>
          <div class="forb">
            @for (bw of c.r; track bw) {
              <span class="bad">{{ bw }}</span>
            }
          </div>
          <p class="muted small mt-4">Don't share this tab! Close it when your round ends.</p>
        } @else {
          <h2 class="display mt-3">Invalid or expired secret link</h2>
          <p class="muted">Ask the host to copy a fresh Private Describer Link from Describe It!</p>
        }
      </div>
    </section>
  `,
  styles: `
    .secret-wrap { min-height: 85vh; display: grid; place-items: center; }
    .secret-card { max-width: 640px; width: 100%; border-color: rgba(168,85,247,.5); box-shadow: 0 0 60px rgba(168,85,247,.3); }
    .secret-pill { background: rgba(236,72,153,.2); border-color: rgba(236,72,153,.5); }
    .lbl { letter-spacing: .25em; color: var(--muted); font-size: .82rem; font-weight: 700; margin-bottom: .5rem; }
    .word { font-size: clamp(2.4rem, 7vw, 4.6rem); font-weight: 900; line-height: 1.15; }
    .forb { display: flex; flex-wrap: wrap; gap: .7rem; justify-content: center; margin-top: .6rem; }
    .bad { font-size: 1.15rem; font-weight: 700; padding: .4rem 1rem; border-radius: 99px;
      background: rgba(239,68,68,.16); border: 2px solid #ef4444; color: #fecaca;
      text-decoration: line-through; text-decoration-color: rgba(239,68,68,.7); }
  `,
})
export class SecretWordPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly card = signal<SecretPayload | null>(null);

  ngOnInit() {
    const raw = this.route.snapshot.queryParamMap.get('d');
    if (!raw) return;
    try {
      const json = decodeURIComponent(escape(atob(raw)));
      const parsed = JSON.parse(json) as SecretPayload;
      if (parsed && typeof parsed.w === 'string' && Array.isArray(parsed.r)) {
        this.card.set(parsed);
      }
    } catch {
      this.card.set(null);
    }
  }
}
