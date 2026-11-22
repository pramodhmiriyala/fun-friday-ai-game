import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaderboardComponent } from '../components/leaderboard.component';
import { ScorePanelComponent } from '../components/score-panel.component';
import { SpinWheelComponent } from '../components/spin-wheel.component';
import { ClassicGameComponent } from '../games/classic-game.component';
import { TruthOrDareComponent } from '../games/truth-or-dare.component';
import { GuessMovieComponent } from '../games/guess-movie.component';
import { MovieDirectorComponent } from '../games/movie-director.component';
import { AiApiService } from '../services/ai-api.service';
import { ClassicGamesService } from '../services/classic-games.service';
import { TruthOrDareService } from '../services/truth-or-dare.service';
import { GuessMovieService } from '../services/guess-movie.service';
import { MovieDirectorService } from '../services/movie-director.service';
import { ScoringService } from '../services/scoring.service';
import { TeamService } from '../services/team.service';
import { TeamPickerComponent } from '../components/team-picker.component';

type Tab = 'truth-dare' | 'director' | 'guess' | 'rapid' | 'puzzle' | 'person' | 'wheel';

@Component({
  selector: 'app-host-dashboard',
  imports: [RouterLink, LeaderboardComponent, ScorePanelComponent, SpinWheelComponent, ClassicGameComponent,
    TruthOrDareComponent, GuessMovieComponent, MovieDirectorComponent, TeamPickerComponent],
  template: `
    <section class="page host">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <span class="badge-pill">🎛 Host only</span>
          <h1 class="page-title grad-text mb-0">Host Dashboard</h1>
          <div class="muted small">Tip: open the <b>Projector view</b> in a second window and drag it to the projector. Both stay in sync.</div>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn-neon btn-cyan" (click)="openProjector()" id="btn-projector">📽 Open Projector View</button>
          <a routerLink="/leaderboard" class="btn-neon btn-gold text-decoration-none" id="btn-host-board">📊 Show Leaderboard</a>
          <a routerLink="/winner" class="btn-neon btn-pink text-decoration-none" id="btn-host-winner">🏆 Final Winner</a>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-12 col-xl-8">
          <div class="tabs glass glass-pad mb-3">
            @for (t of tabs; track t.id) {
              <button class="btn-ghost" [class.active]="tab() === t.id" (click)="tab.set(t.id)" [id]="'host-tab-' + t.id">{{ t.icon }} {{ t.label }}</button>
            }
          </div>
          <div class="glass glass-pad panel">
            <!-- Per-game tip banner -->
            @switch (tab()) {
              @case ('guess') {
                <div class="tip-bar tip-ai">🎬 <b>AI Guess the Movie.</b> Pick Telugu, Hindi, English, Tamil, Malayalam, Pan-Indian or Pan-World. AI secretly chooses a movie, gives clues, and answers limited team questions live!</div>
              }
              @case ('rapid') {
                <div class="tip-bar tip-timer">⚡ <b>AI Rapid Fire MCQs.</b> Select the active team and press START. AI generates 4-option MCQs — click A/B/C/D for instant scoring (+5 pts each) in 60 seconds!</div>
              }
              @case ('person') {
                <div class="tip-bar tip-ai">🕵️ <b>AI Who Am I?</b> AI generates 5 progressive clues about a famous person. Reveal one by one — fewer clues = more points!</div>
              }
              @case ('truth-dare') {
                <div class="tip-bar tip-ai">🎭 <b>AI Truth or Dare.</b> Select player on stage → Pick Truth or Dare. Hilarious office questions & 20s team challenges. Pure fun, no points!</div>
              }
              @case ('director') {
                <div class="tip-bar tip-ai">🎥 <b>AI Movie Director.</b> Enter any office situation — AI writes a hilarious, dramatic movie scene with comedy punchlines!</div>
              }
              @case ('puzzle') {
                <div class="tip-bar tip-vote">🧩 <b>Bonus Round — Picture Puzzle.</b> Tiles peel away every few seconds. First team to shout the answer wins!</div>
              }
              @case ('wheel') {
                <div class="tip-bar tip-wheel">🎡 <b>Spinner.</b> Use <b>Pick a Team</b> between games, <b>Pick a Game</b> to randomly choose next activity, or <b>Bonus Challenge</b> anytime for extra fun!</div>
              }
            }
            @switch (tab()) {
              @case ('truth-dare') { <app-truth-or-dare [embedded]="true" /> }
              @case ('director') { <app-movie-director [embedded]="true" /> }
              @case ('guess') { <app-guess-movie [embedded]="true" /> }
              @case ('rapid') { <app-classic-game [embedded]="true" gameId="rapid" /> }
              @case ('puzzle') { <app-classic-game [embedded]="true" gameId="puzzle" /> }
              @case ('person') { <app-classic-game [embedded]="true" gameId="person" /> }
              @case ('wheel') { <app-spin-wheel [size]="460" /> }
            }
          </div>
        </div>
        <div class="col-12 col-xl-4">
          <div class="glass glass-pad mb-3">
            <h3 class="h5">📡 Status</h3>
            <div>Backend: <b [class.ok]="api.online()" [class.bad]="!api.online()">{{ api.online() ? 'online' : 'offline' }}</b></div>
            <div>AI: <b [class.ok]="api.aiEnabled()">{{ api.aiEnabled() ? 'GPT-4o-mini active' : 'built-in content (no API key)' }}</b></div>
            <button class="btn-ghost btn-sm-x mt-2" (click)="api.health()" id="btn-health">↻ Re-check</button>
          </div>
          <div class="glass glass-pad mb-3"><h3 class="h5">🎤 Team on stage</h3><app-team-picker /></div>
          <app-score-panel />
          <div class="glass glass-pad mt-3"><h3 class="h5">🏆 Standings</h3><app-leaderboard [compact]="true" /></div>
          <div class="glass glass-pad mt-3">
            <h3 class="h5">⚠ Danger zone</h3>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn-ghost btn-sm-x" (click)="confirmThen('Reset all scores?', resetScores)" id="btn-reset-scores">Reset scores</button>
              <button class="btn-ghost btn-sm-x" (click)="confirmThen('Reset all game progress (scores kept)?', resetGames)" id="btn-reset-games">Reset games</button>
              <button class="btn-ghost btn-sm-x" (click)="confirmThen('Delete EVERYTHING (teams + scores)?', resetAll)" id="btn-reset-all">New tournament</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .tabs { display: flex; gap: .5rem; flex-wrap: wrap; padding: .9rem; } .panel { min-height: 600px; }
    .ok { color: #4ade80; } .bad { color: #f87171; }
    .tip-bar { font-size: .9rem; padding: .7rem 1rem; border-radius: 10px; margin-bottom: 1rem; border-left: 4px solid; }
    .tip-buzzer { background: rgba(236,72,153,.1); border-color: #ec4899; color: #f9a8d4; }
    .tip-timer  { background: rgba(250,204,21,.08); border-color: #facc15; color: #fde68a; }
    .tip-ai     { background: rgba(168,85,247,.1); border-color: #a855f7; color: #d8b4fe; }
    .tip-vote   { background: rgba(59,130,246,.1); border-color: #3b82f6; color: #93c5fd; }
    .tip-wheel  { background: rgba(34,211,238,.08); border-color: #22d3ee; color: #67e8f9; }
  `,
})
export class HostDashboardComponent {
  readonly api = inject(AiApiService);
  private teams = inject(TeamService);
  private scoring = inject(ScoringService);
  private truthDare = inject(TruthOrDareService);
  private director = inject(MovieDirectorService);
  private guess = inject(GuessMovieService);
  private classic = inject(ClassicGamesService);
  readonly tab = signal<Tab>('truth-dare');
  readonly tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'truth-dare', label: 'Truth or Dare', icon: '🎭' }, { id: 'director', label: 'Movie Director', icon: '🎬' },
    { id: 'guess', label: 'Guess Movie', icon: '🎞️' }, { id: 'rapid', label: 'Rapid Fire', icon: '⚡' },
    { id: 'puzzle', label: 'Puzzle', icon: '🧩' },
    { id: 'person', label: 'Person', icon: '🕵️' }, { id: 'wheel', label: 'Wheel', icon: '🎡' },
  ];

  openProjector() { window.open('/', 'funfriday-projector', 'popup=no'); }
  confirmThen(msg: string, fn: () => void) { if (confirm(msg)) fn.call(this); }
  resetScores() { this.scoring.resetScores(); }
  resetGames() {
    this.truthDare.reset(); this.director.resetGame(); this.guess.resetGame();
    this.classic.rapidStop();
  }
  resetAll() { this.resetScores(); this.resetGames(); this.teams.clear(); }
}
