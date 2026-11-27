import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeamPickerComponent } from '../components/team-picker.component';
import { GuessMovieService, MOVIE_CATEGORIES } from '../services/guess-movie.service';
import { TeamService } from '../services/team.service';
import { HostAuthService } from '../services/host-auth.service';

@Component({
  selector: 'app-guess-movie',
  imports: [FormsModule, RouterLink, TeamPickerComponent],
  template: `
    <section [class.page]="!embedded" class="wrap">
      @if (!embedded) {
        <a routerLink="/" class="back">← Arena</a><br>
        <span class="badge-pill">🎬 Cinema Host · Interactive</span>
        <h1 class="page-title grad-text">AI – Guess the Movie</h1>
      }

      <!-- Active team picker -->
      <div class="glass glass-pad mb-3">
        <app-team-picker />
      </div>

      <!-- Language category bar -->
      <div class="glass glass-pad mb-4 cat-bar">
        <span class="cat-lbl">🎬 Choose Movie Category:</span>
        <div class="cat-pills">
          @for (cat of categories; track cat.id) {
            <button class="cat-pill"
                    [class.active]="s().category === cat.id"
                    [disabled]="s().phase === 'live' || g.loading()"
                    (click)="g.setCategory(cat.id)"
                    [id]="'cat-' + cat.id">
              {{ cat.icon }} {{ cat.label }}
            </button>
          }
        </div>
      </div>

      @if (g.error()) { <div class="alert-neon mb-3">{{ g.error() }}</div> }

      <div class="row g-4">
        <!-- Main Interactive AI Host Stage -->
        <div class="col-12 col-lg-8">
          <div class="stage glass" [class.live]="s().phase === 'live'" [class.won]="s().phase === 'solved'">

            <!-- IDLE -->
            @if (s().phase === 'idle') {
              <div class="idle-wrap text-center">
                <div class="idle-ic">🎬</div>
                <h2 class="display">Cinema Host is Ready!</h2>
                <p class="muted mt-2">
                  Pick a language above (<b class="text-white">{{ s().category }}</b> selected).
                  AI secretly picks a movie, drops a clue, and answers up to <b>5 questions or extra clues</b> live!
                </p>
                <button class="btn-neon btn-lg-x pulse mt-3"
                        (click)="g.startRound()"
                        [disabled]="g.loading()"
                        id="btn-guess-start">
                  {{ g.loading() ? '🎬 Picking a movie…' : '🎬 Start Round (' + s().category + ')' }}
                </button>
              </div>
            }

            <!-- LIVE / SOLVED / REVEALED -->
            @if (s().phase !== 'idle') {
              <div class="host-stage w-100">
                <!-- Round header -->
                <div class="stage-head">
                  <div class="round-title">
                    🎬 Round {{ s().round }} · <span class="lang-pill">{{ s().category }}</span>
                  </div>
                  <div class="q-badge" [class.low]="s().questionsLeft <= 1">
                    💬 {{ s().questionsLeft }} / {{ s().maxQuestions }} left
                  </div>
                </div>

                <!-- Conversation / Clues Feed -->
                <div class="chat-feed">
                  @for (m of s().messages; track $index) {
                    <div class="msg pop-in" [class.ai]="m.role === 'ai'" [class.user]="m.role === 'user'"
                         [class.clue]="m.kind === 'clue'" [class.win]="m.kind === 'win'">
                      <div class="msg-lbl">{{ m.label }}</div>
                      <div class="msg-txt">{{ m.text }}</div>
                    </div>
                  }
                  @if (g.thinking()) {
                    <div class="msg ai typing">
                      <div class="msg-lbl">🎬 Movie Host</div>
                      <div class="msg-txt">Thinking… 😏</div>
                    </div>
                  }
                </div>

                <!-- Solved / Revealed Banner -->
                @if ((s().phase === 'solved' || s().phase === 'revealed') && s().movie; as mv) {
                  <div class="reveal-card pop-in" [class.won]="s().phase === 'solved'">
                    <div class="ans-lbl">THE SECRET MOVIE WAS</div>
                    <div class="ans-title grad-text">{{ mv.title }}</div>
                    <div class="muted">
                      @if (mv.year) { {{ mv.year }} · } {{ mv.language }}
                    </div>
                    @if (s().phase === 'solved') {
                      <div class="verdict">
                        🎉 {{ teams.get(s().winner || '')?.name || teams.activeTeam()?.name }} scores +{{ s().awardedPrize || g.prize() }} pts!
                      </div>
                    } @else if (s().phase === 'revealed') {
                      <div class="verdict text-muted mt-2">
                        ❌ Not guessed · 0 pts awarded this round
                      </div>
                    }
                  </div>
                }

                <!-- Live Quick-Ask Chips + Input Bar -->
                @if (s().phase === 'live') {
                  @if (s().questionsLeft > 0) {
                    <div class="quick-chips">
                      <span class="qc-lbl">Quick ask:</span>
                      @for (chip of quickHints; track chip.label) {
                        <button class="qc-btn" (click)="g.sendMessage(chip.prompt)" [disabled]="g.thinking()">
                          {{ chip.icon }} {{ chip.label }}
                        </button>
                      }
                    </div>
                  }
                  <div class="input-bar">
                    <input class="form-control chat-input"
                           [(ngModel)]="inputText"
                           (keyup.enter)="send()"
                           [disabled]="g.thinking()"
                           maxlength="200"
                           [placeholder]="s().questionsLeft > 0
                             ? 'Ask AI a question (e.g. Is it a college movie?) or guess the movie…'
                             : 'Out of questions! Type your final movie guess…'"
                           id="input-guess-chat" />
                    <button class="btn-neon" (click)="send()" [disabled]="g.thinking() || !inputText.trim()" id="btn-guess-send">
                      Send ↵
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Action buttons -->
          <div class="actions">
            @if (s().phase === 'live') {
              <button class="btn-neon btn-gold"
                      (click)="g.askClue()"
                      [disabled]="g.thinking() || s().questionsLeft <= 0"
                      id="btn-guess-clue">
                💡 Ask AI for Another Clue
              </button>
              <button class="btn-neon btn-green"
                      (click)="g.openHostVerdict()"
                      [disabled]="g.thinking()"
                      id="btn-guess-verdict">
                ✅ Team Guessed It
              </button>
              <button class="btn-neon btn-pink"
                      (click)="g.openHostVerdict()"
                      [disabled]="g.thinking()"
                      id="btn-guess-reveal">
                {{ auth.isHost() ? '👁 Reveal Movie' : '🔒 Reveal Movie (host)' }}
              </button>
            }
            @if (s().phase === 'solved' || s().phase === 'revealed') {
              <button class="btn-neon btn-lg-x"
                      (click)="g.startRound()"
                      [disabled]="g.loading()"
                      id="btn-guess-next">
                {{ g.loading() ? '🎬 Picking next movie…' : '➡ Next Round (' + s().category + ')' }}
              </button>
            }
            <button class="btn-ghost" (click)="g.resetGame()" id="btn-guess-reset">↺ Reset</button>
          </div>
        </div>

        <!-- Side Info Panel -->
        <div class="col-12 col-lg-4">
          <div class="glass glass-pad text-center mb-3">
            <div class="lbl">CURRENT PRIZE</div>
            <div class="prize-val display grad-text">{{ g.prize() }} pts</div>
            <div class="muted small mt-1">Starts at 25 pts · −3 pts per question/clue used</div>
            <div class="meter mt-3">
              @for (i of slots; track i) {
                <span class="dot-slot" [class.used]="i >= s().questionsLeft"></span>
              }
            </div>
            <div class="muted small mt-2">{{ s().questionsLeft }} of {{ s().maxQuestions }} AI interactions left</div>
          </div>

          <div class="glass glass-pad howto">
            <div class="ht-title">🎬 How to Play</div>
            <ol class="ht-list muted">
              <li>Pick a language: <b>Telugu, Tamil, Hindi, Kannada, Marathi, Bengali, Odia, English, etc.</b></li>
              <li>AI secretly picks a popular movie & reveals <b>Clue #1: The Story / Plot</b>!</li>
              <li>Try to guess the movie name from its plot!</li>
              <li>Tap <b>Quick ask</b> for Hero/Heroine, Director, Release Year, or famous Song/Dialogue in original language</li>
              <li>Click <b>💡 Ask AI for Another Clue</b> for more hints!</li>
              <li>Guess early to win maximum points! 🏆</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Host Movie Verdict Confirmation Modal -->
      @if (g.pendingVerdict(); as pv) {
        <div class="modal-backdrop pop-in" (click)="g.closeHostVerdict()">
          <div class="modal-card glass-pad" (click)="$event.stopPropagation()">
            <div class="vm-badge">🎬 HOST CONFIRMATION · GUESS THE MOVIE</div>
            <h3 class="vm-title">Secret Movie Solution</h3>

            <div class="vm-secret-card">
              <div class="vm-secret-lbl">SECRET MOVIE</div>
              <div class="vm-secret-title grad-text">{{ pv.movie.title }}</div>
              <div class="vm-secret-meta">
                @if (pv.movie.year) { <span>📅 {{ pv.movie.year }}</span> · }
                <span>🗣 {{ pv.movie.language }}</span>
              </div>
            </div>

            <div class="vm-body">
              <div class="vm-team-row">
                Active Team: <b class="text-white">{{ teams.activeTeam()?.name ?? 'Active Team' }}</b>
              </div>
              <div class="vm-prize-row">
                Bounty Prize: <b class="text-gold">{{ pv.prize }} pts</b>
                <span class="muted small ms-1">({{ s().questionsLeft }} questions left)</span>
              </div>
              <p class="vm-question">
                Did <b>{{ teams.activeTeam()?.name ?? 'the active team' }}</b> guess the movie correctly?
              </p>
            </div>

            <div class="vm-actions">
              <button class="btn-neon btn-green vm-btn" (click)="g.confirmVerdict(true)" id="btn-vm-movie-yes">
                ✅ Yes, Team Guessed It! (+{{ pv.prize }} pts)
              </button>
              <button class="btn-neon btn-pink vm-btn" (click)="g.confirmVerdict(false)" id="btn-vm-movie-no">
                ❌ No / Did Not Guess (0 pts)
              </button>
              <button class="btn-ghost vm-btn-cancel" (click)="g.closeHostVerdict()" id="btn-vm-movie-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .back { color: var(--muted); text-decoration: none; } .back:hover { color: #fff; }
    .cat-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .cat-lbl { font-weight: 800; font-size: .95rem; }
    .cat-pills { display: flex; gap: .5rem; flex-wrap: wrap; }
    .cat-pill { background: rgba(255,255,255,.06); border: 2px solid var(--glass-border); color: var(--text);
      padding: .45rem 1rem; border-radius: 999px; font-weight: 700; font-size: .92rem; cursor: pointer; transition: .2s; font-family: var(--font); }
    .cat-pill:hover:not(:disabled) { border-color: var(--cyan); transform: translateY(-2px); }
    .cat-pill.active { background: var(--grad); border-color: transparent; color: #fff; box-shadow: 0 0 20px rgba(168,85,247,.5); }
    .cat-pill:disabled { opacity: .55; cursor: not-allowed; }

    .stage { min-height: 480px; display: flex; flex-direction: column; justify-content: center; padding: 1.6rem; transition: .4s; }
    .stage.live { border-color: var(--cyan); box-shadow: 0 0 50px rgba(34,211,238,.25); justify-content: flex-start; }
    .stage.won  { border-color: var(--gold); box-shadow: 0 0 60px rgba(250,204,21,.35); justify-content: flex-start; }

    .idle-wrap { max-width: 540px; margin: 0 auto; padding: 1.5rem 0; }
    .idle-ic { font-size: 5rem; animation: float 3s ease-in-out infinite; }
    @keyframes float { 50% { transform: translateY(-10px); } }

    .host-stage { display: flex; flex-direction: column; gap: 1rem; height: 100%; }
    .stage-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .6rem;
      padding-bottom: .8rem; border-bottom: 1px solid rgba(255,255,255,.1); }
    .round-title { font-weight: 800; font-size: 1.05rem; display: flex; align-items: center; gap: .5rem; }
    .lang-pill { background: rgba(168,85,247,.25); border: 1px solid rgba(168,85,247,.5); color: #e9d5ff;
      padding: .15rem .65rem; border-radius: 999px; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
    .q-badge { font-weight: 800; font-size: .85rem; padding: .28rem .8rem; border-radius: 999px;
      background: rgba(34,211,238,.15); border: 1px solid rgba(34,211,238,.4); color: #67e8f9; }
    .q-badge.low { background: rgba(239,68,68,.2); border-color: rgba(239,68,68,.5); color: #fca5a5; }

    .chat-feed { display: flex; flex-direction: column; gap: .75rem; max-height: 360px; overflow-y: auto; padding-right: .3rem; }
    .msg { padding: .85rem 1.1rem; border-radius: 16px; max-width: 88%; line-height: 1.45; }
    .msg.ai { align-self: flex-start; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); }
    .msg.ai.clue { background: linear-gradient(135deg, rgba(168,85,247,.22), rgba(59,130,246,.18)); border-color: rgba(168,85,247,.5); }
    .msg.ai.win  { background: linear-gradient(135deg, rgba(34,197,94,.24), rgba(250,204,21,.18)); border-color: rgba(34,197,94,.6); }
    .msg.user { align-self: flex-end; background: rgba(34,211,238,.16); border: 1px solid rgba(34,211,238,.4); text-align: right; }
    .msg-lbl { font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: .2rem; }
    .msg.clue .msg-lbl { color: #d8b4fe; }
    .msg.win  .msg-lbl { color: #86efac; }
    .msg-txt { font-size: 1.05rem; color: #fff; }
    .typing { opacity: .75; font-style: italic; }

    .reveal-card { text-align: center; padding: 1.2rem; border-radius: 16px; background: rgba(255,255,255,.06); border: 2px solid rgba(255,255,255,.18); }
    .reveal-card.won { border-color: var(--gold); background: rgba(250,204,21,.08); }
    .ans-lbl { letter-spacing: .25em; font-size: .78rem; color: var(--muted); font-weight: 700; }
    .ans-title { font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 900; margin: .25rem 0; }
    .verdict { font-size: 1.2rem; font-weight: 800; color: var(--gold); margin-top: .5rem; }

    .quick-chips { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; padding-top: .4rem; }
    .qc-lbl { font-size: .78rem; color: var(--muted); font-weight: 700; margin-right: .2rem; }
    .qc-btn { background: rgba(168,85,247,.14); border: 1px solid rgba(168,85,247,.38); color: #e9d5ff;
      border-radius: 999px; padding: .28rem .75rem; font-size: .8rem; font-weight: 700; cursor: pointer; transition: .2s; font-family: var(--font); }
    .qc-btn:hover:not(:disabled) { background: rgba(168,85,247,.3); border-color: var(--cyan); color: #fff; transform: translateY(-1px); }
    .qc-btn:disabled { opacity: .45; cursor: not-allowed; }
    .input-bar { display: flex; gap: .6rem; margin-top: auto; padding-top: .6rem; border-top: 1px solid rgba(255,255,255,.08); }
    .chat-input { flex: 1; font-size: 1rem; }

    .actions { display: flex; gap: .8rem; flex-wrap: wrap; justify-content: center; margin-top: 1.3rem; }
    .lbl { letter-spacing: .2em; font-size: .78rem; color: var(--muted); font-weight: 700; }
    .prize-val { font-size: 3rem; font-weight: 900; line-height: 1.1; margin-top: .3rem; }
    .meter { display: flex; justify-content: center; gap: .5rem; }
    .dot-slot { width: 18px; height: 18px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 10px var(--cyan); transition: .25s; }
    .dot-slot.used { background: rgba(255,255,255,.14); box-shadow: none; }

    .howto { text-align: left; }
    .ht-title { font-weight: 800; margin-bottom: .6rem; }
    .ht-list { padding-left: 1.2rem; display: flex; flex-direction: column; gap: .4rem; font-size: .9rem; }
    .pop-in { animation: popIn .35s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes popIn { from { opacity:0; transform: scale(.92) translateY(8px); } to { opacity:1; transform:none; } }

    /* Host Movie Verdict Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(7, 4, 26, 0.84); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 9999; display: grid; place-items: center; padding: 1.2rem; }
    .modal-card { width: 100%; max-width: 540px; background: rgba(18, 12, 46, 0.95); border: 2px solid var(--purple); border-radius: 24px; box-shadow: 0 0 50px rgba(168, 85, 247, 0.45); text-align: center; }
    .vm-badge { display: inline-block; font-size: .78rem; font-weight: 800; letter-spacing: .15em; color: var(--cyan); background: rgba(34, 211, 238, 0.12); border: 1px solid rgba(34, 211, 238, 0.3); padding: .3rem .9rem; border-radius: 999px; margin-bottom: .8rem; }
    .vm-title { font-size: 1.45rem; font-weight: 900; margin-bottom: 1rem; color: #fff; }
    .vm-secret-card { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 18px; padding: 1.2rem; margin-bottom: 1.2rem; }
    .vm-secret-lbl { font-size: .75rem; letter-spacing: .2em; font-weight: 800; color: var(--muted); }
    .vm-secret-title { font-size: clamp(1.6rem, 3.5vw, 2.3rem); font-weight: 900; margin: .3rem 0; }
    .vm-secret-meta { font-size: .95rem; color: #cbd5e1; font-weight: 700; margin-top: .3rem; }
    .vm-body { margin-bottom: 1.4rem; }
    .vm-team-row { font-size: 1.1rem; margin-bottom: .3rem; }
    .vm-prize-row { font-size: 1.15rem; margin-bottom: .8rem; }
    .text-gold { color: var(--gold); }
    .vm-question { font-size: 1.18rem; font-weight: 700; color: #fff; margin: .8rem 0 0; }
    .vm-actions { display: flex; flex-direction: column; gap: .75rem; }
    .vm-btn { width: 100%; padding: .9rem 1.4rem; font-size: 1.05rem; }
    .vm-btn-cancel { width: 100%; margin-top: .2rem; }
  `,
})
export class GuessMovieComponent {
  readonly g = inject(GuessMovieService);
  readonly teams = inject(TeamService);
  readonly auth = inject(HostAuthService);
  readonly s = this.g.state;
  readonly categories = MOVIE_CATEGORIES;
  readonly slots = [0, 1, 2, 3, 4];
  readonly quickHints = [
    { icon: '🎭', label: 'Hero / Heroine', prompt: 'Who is the hero or heroine in this movie?' },
    { icon: '🎬', label: 'Director / Crew', prompt: 'Who directed this movie or who is a key crew member?' },
    { icon: '📅', label: 'Release Year',    prompt: 'Which year or era was this movie released in?' },
    { icon: '🎵', label: 'Song / Dialogue', prompt: 'Give a famous song line or iconic dialogue from this movie in its original language.' },
  ];
  @Input() embedded = false;
  inputText = '';

  send() {
    const t = this.inputText.trim();
    if (!t) return;
    this.inputText = '';
    this.g.sendMessage(t);
  }
}
