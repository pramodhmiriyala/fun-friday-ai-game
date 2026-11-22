import { Component, Input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GENRES, MovieDirectorService } from '../services/movie-director.service';

const SAMPLES = [
  'The Wi-Fi goes down during the client demo',
  'Someone pushed to production on Friday at 5:59 PM',
  'A meeting that could have easily been an email',
  'The coffee machine runs out of beans on Monday 9 AM',
  'The intern accidentally dropped the production database',
  'The manager announces an unexpected Saturday sprint review',
];

@Component({
  selector: 'app-movie-director',
  imports: [RouterLink, FormsModule],
  template: `
    <section [class.page]="!embedded" class="wrap">
      @if (!embedded) {
        <a routerLink="/" class="back">← Arena</a><br>
        <span class="badge-pill">🎥 AI Movie Director</span>
        <h1 class="page-title grad-text">Turn Office Chaos into a Movie</h1>
      }

      @if (!cur()) {
        <div class="glass glass-pad form fade-in">
          <label class="form-label" for="director-situation">Enter any office / IT situation</label>
          <textarea class="form-control" id="director-situation" rows="3" maxlength="300" [(ngModel)]="situation"
                    placeholder="e.g. Someone pushed code directly to production on Friday at 5:59 PM…"></textarea>
          <div class="d-flex justify-content-between muted small mt-2 flex-wrap gap-2">
            <span>Quick ideas:
              @for (s of samples; track s) {
                <button type="button" class="sample" (click)="situation = s">💡 {{ s }}</button>
              }
            </span>
            <span>{{ situation.length }}/300</span>
          </div>

          <div class="form-label mt-4">Choose a genre</div>
          <div class="genres">
            @for (gn of genres; track gn.name) {
              <button class="genre" [class.on]="genre === gn.name" [style.--gc]="gn.color" (click)="genre = gn.name" [id]="'genre-' + gn.name">
                <span>{{ gn.icon }}</span>{{ gn.name }}
              </button>
            }
          </div>

          @if (d.error()) { <div class="alert-neon mt-3">{{ d.error() }}</div> }

          <button class="btn-neon btn-pink btn-lg-x mt-4 w-100"
                  (click)="d.generate(situation, genre ?? 'Comedy')"
                  [disabled]="d.loading()"
                  id="btn-director-generate">
            {{ d.loading() ? '🎬 Rolling cameras… writing comedy…' : '🎬 ACTION! Create Funny Scene' }}
          </button>
        </div>

        @if (d.loading()) {
          <div class="loading glass mt-4">
            <div class="reel">🎞️</div>
            <div class="display mt-2">Directing your blockbuster…</div>
            <p class="muted">Turning your office drama into cinematic comedy!</p>
          </div>
        }
      } @else {
        @let m = cur()!.movie;
        <div class="scene-card glass pop-in" [style.--gc]="gcolor()">
          <div class="card-top">
            <div class="genre-tag">{{ genreIcon() }} {{ cur()!.genre.toUpperCase() }}</div>
            <div class="based-on muted small">Based on: <i>"{{ cur()!.situation }}"</i></div>
          </div>

          <h2 class="scene-title grad-text">{{ m.title }}</h2>
          <div class="scene-tagline">"{{ m.tagline }}"</div>

          <div class="scene-body">
            <p class="scene-text">{{ m.scene }}</p>

            @if (m.punchline) {
              <div class="punchline-box">
                <span class="pl-lbl">💥 THE PUNCHLINE:</span>
                <p class="pl-text">{{ m.punchline }}</p>
              </div>
            }
          </div>

          <div class="card-actions">
            <button class="btn-neon btn-lg-x" (click)="d.generate(cur()!.situation, cur()!.genre)" [disabled]="d.loading()" id="btn-director-reroll">
              {{ d.loading() ? '🎬 Writing…' : '🎲 Direct Another Take' }}
            </button>
            <button class="btn-ghost" (click)="d.newScene()" id="btn-director-new">
              ↺ Change Situation
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .back { color: var(--muted); text-decoration: none; } .back:hover { color: #fff; }
    .form { max-width: 860px; margin: 0 auto; }
    textarea { resize: vertical; font-size: 1.05rem; }
    .sample { color: #d8b4fe; margin-right: .5rem; margin-top: .2rem; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
      padding: .2rem .55rem; border-radius: 6px; font-size: .8rem; cursor: pointer; display: inline-block; }
    .sample:hover { background: rgba(168,85,247,.25); border-color: var(--purple); color: #fff; }
    .genres { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: .7rem; }
    .genre { background: var(--glass); border: 2px solid var(--glass-border); color: #fff; border-radius: 14px; padding: .8rem .4rem; font-weight: 700; cursor: pointer; transition: .2s; font-family: var(--font); }
    .genre span { display: block; font-size: 1.8rem; margin-bottom: .2rem; }
    .genre:hover { transform: translateY(-3px); border-color: var(--gc); }
    .genre.on { background: color-mix(in srgb, var(--gc) 25%, transparent); border-color: var(--gc); box-shadow: 0 0 20px var(--gc); }
    .loading { text-align: center; padding: 3rem 1.5rem; max-width: 860px; margin: 0 auto; }
    .reel { font-size: 4rem; animation: spin 1.2s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Scene Card */
    .scene-card { max-width: 900px; margin: 0 auto; padding: 2.2rem; border-color: var(--gc); box-shadow: 0 0 50px color-mix(in srgb, var(--gc) 30%, transparent); border-radius: 24px; position: relative; overflow: hidden; }
    .card-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .8rem; margin-bottom: 1rem; }
    .genre-tag { font-weight: 800; font-size: .8rem; letter-spacing: .1em; padding: .3rem .85rem; border-radius: 999px; background: color-mix(in srgb, var(--gc) 25%, transparent); border: 1px solid var(--gc); color: #fff; }
    .scene-title { font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 900; margin: .3rem 0; text-transform: uppercase; line-height: 1.15; }
    .scene-tagline { font-size: 1.2rem; font-style: italic; color: #fde047; margin-bottom: 1.6rem; opacity: .95; }
    .scene-body { background: rgba(0,0,0,.25); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 1.6rem; margin-bottom: 1.8rem; }
    .scene-text { font-size: 1.2rem; line-height: 1.7; color: #f1f5f9; margin: 0; white-space: pre-line; }
    .punchline-box { margin-top: 1.4rem; padding: 1rem 1.2rem; border-radius: 12px; background: rgba(234,179,8,.12); border-left: 4px solid #facc15; }
    .pl-lbl { font-weight: 900; font-size: .82rem; letter-spacing: .08em; color: #facc15; }
    .pl-text { font-size: 1.15rem; font-weight: 700; color: #fff; margin: .3rem 0 0; }
    .card-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .pop-in { animation: popIn .4s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes popIn { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: none; } }
  `,
})
export class MovieDirectorComponent {
  readonly d = inject(MovieDirectorService);
  readonly genres = GENRES;
  readonly samples = SAMPLES;
  @Input() embedded = false;
  situation = '';
  genre: string | null = 'Comedy';
  readonly cur = computed(() => this.d.state().current);
  gcolor = computed(() => GENRES.find((g) => g.name === this.cur()?.genre)?.color ?? '#facc15');
  genreIcon = computed(() => GENRES.find((g) => g.name === this.cur()?.genre)?.icon ?? '😂');
}
