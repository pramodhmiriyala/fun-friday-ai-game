import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GAMES } from '../core/games.data';
import { TeamPickerComponent } from '../components/team-picker.component';
import { TimerComponent } from '../components/timer.component';
import { ClassicGamesService } from '../services/classic-games.service';
import { TeamService } from '../services/team.service';
import { HostAuthService } from '../services/host-auth.service';

/** Reusable AI-powered component for Rapid Fire MCQs, Who Am I?, Team Voting, and Picture Puzzle. */
@Component({
  selector: 'app-classic-game',
  imports: [RouterLink, TeamPickerComponent, TimerComponent],
  template: `
    <section [class.page]="!embedded" class="wrap">
      @if (!embedded) {
        <a routerLink="/" class="back">← Arena</a><br>
        <span class="badge-pill">{{ def()?.icon ?? '🤖' }} AI Powered</span>
        <h1 class="page-title grad-text">{{ def()?.title ?? 'AI Game' }}</h1>
      }
      <div class="glass glass-pad mb-4"><app-team-picker /></div>

      @switch (id()) {
        <!-- ═══════════ RAPID FIRE MCQs ═══════════ -->
        @case ('rapid') {
          @let r = c.state().rapid;
          @if (c.rapidError()) { <div class="alert-neon mb-3">{{ c.rapidError() }}</div> }
          <div class="row g-4">
            <div class="col-12 col-lg-8">
              <div class="stage glass" [class.live]="r.phase === 'live'">
                @if (r.phase === 'idle') {
                  <div class="text-center">
                    <div class="ic">⚡</div>
                    <h2 class="display">60 Seconds · AI MCQ Blitz</h2>
                    <p class="muted">Pick A, B, C, or D as fast as you can! <b>+5 points</b> for every correct answer.</p>
                    <div class="d-flex gap-2 justify-content-center flex-wrap mt-3">
                      <button class="btn-neon btn-lg-x pulse" (click)="c.rapidStart()" [disabled]="c.rapidLoading()" id="btn-rapid-start">
                        {{ c.rapidLoading() ? '🤖 Loading MCQs…' : '▶ START' }}
                      </button>
                      <button class="btn-ghost" (click)="c.fetchRapidQuestions()" [disabled]="c.rapidLoading()" id="btn-rapid-gen">
                        ✨ {{ c.rapidLoading() ? 'Generating…' : 'Fresh AI MCQs' }}
                      </button>
                    </div>
                  </div>
                } @else if (r.phase === 'live') {
                  @if (c.rapidQ(); as q) {
                    <div class="text-center w-100">
                      <div class="lbl">MCQ {{ r.pos + 1 }} · PICK THE RIGHT OPTION</div>
                      <div class="q display">{{ q.q }}</div>
                      <div class="mcq-grid mt-4">
                        @for (opt of q.options; track $index) {
                          <button class="mcq-opt glass"
                                  [class.correct]="r.selected !== null && $index === q.correct"
                                  [class.wrong]="r.selected === $index && $index !== q.correct"
                                  [disabled]="r.selected !== null"
                                  (click)="c.rapidChoose($index)"
                                  [id]="'mcq-opt-' + $index">
                            <span class="opt-key">{{ letters[$index] }}</span>
                            <span class="opt-txt">{{ opt }}</span>
                          </button>
                        }
                      </div>
                      <div class="d-flex gap-2 justify-content-center flex-wrap mt-4">
                        <button class="btn-ghost" (click)="c.rapidNext()" [disabled]="r.selected !== null" id="btn-rapid-pass">⏭ Pass</button>
                        <button class="btn-ghost" (click)="c.rapidStop()" id="btn-rapid-stop">⏹ End Round</button>
                      </div>
                    </div>
                  } @else {
                    <div class="text-center">
                      <div class="ic">🤖</div>
                      <h3 class="display">Fetching more AI MCQs…</h3>
                    </div>
                  }
                } @else {
                  <div class="text-center">
                    <div class="ic">🏁</div>
                    <h2 class="display grad-text">Time's up!</h2>
                    <p class="fs-4">{{ r.correct }} correct · {{ r.wrong }} wrong → <b>{{ r.correct * 5 }} points</b></p>
                    <button class="btn-neon" (click)="c.rapidStop()" id="btn-rapid-again">↺ Play again</button>
                  </div>
                }
              </div>
            </div>
            <div class="col-12 col-lg-4">
              <div class="glass glass-pad text-center">
                <app-timer [timer]="c.rapidTimer" [size]="210" />
                <div class="mt-3 fs-5">Round score: <b class="text-white">{{ r.correct * 5 }} pts</b></div>
                <div class="muted small mt-1">✅ {{ r.correct }} right · ❌ {{ r.wrong }} wrong</div>
              </div>
            </div>
          </div>
        }

        <!-- ═══════════ PICTURE PUZZLE ═══════════ -->
        @case ('puzzle') {
          @let p = c.state().puzzle;
          <div class="row g-4">
            <div class="col-12 col-lg-8">
              <div class="stage glass" [class.live]="p.phase === 'live'">
                @if (p.phase === 'idle') {
                  <div class="text-center"><div class="ic">🧩</div><h2 class="display">Picture Puzzle</h2><p class="muted">A tile peels off every 4 seconds. Guess early for more points!</p>
                    <button class="btn-neon btn-lg-x pulse" (click)="c.puzzleStart()" id="btn-puzzle-start">▶ START</button></div>
                } @else {
                  <div class="text-center w-100">
                    <div class="pic">
                      <div class="emo">{{ c.puzzle().emoji }}</div>
                      <div class="tiles">
                        @for (i of nine; track i) { <div class="tile" [class.gone]="p.open.includes(i) || p.phase === 'revealed'"></div> }
                      </div>
                    </div>
                    @if (p.showHint && p.phase === 'live') { <div class="hint pop-in">💡 {{ c.puzzle().hint }}</div> }
                    @if (p.phase === 'revealed') { <div class="a pop-in display">{{ c.puzzle().answer }}</div> }
                    <div class="mt-2 muted">Prize now: <b class="text-white">{{ c.puzzlePrize() }} pts</b></div>
                  </div>
                }
              </div>
              <div class="actions">
                @if (p.phase === 'live') {
                  <button class="btn-neon btn-green" (click)="c.puzzleSolve()" id="btn-puzzle-solve">✅ Team solved it</button>
                  <button class="btn-neon btn-gold" (click)="c.puzzleHint()" [disabled]="p.showHint" id="btn-puzzle-hint">💡 Hint (−2)</button>
                  <button class="btn-neon btn-cyan" (click)="c.puzzleOpenTile()" id="btn-puzzle-tile">🔓 Open tile</button>
                  <button class="btn-neon btn-pink" (click)="c.puzzleReveal()" id="btn-puzzle-reveal">{{ auth.isHost() ? '👁 Reveal' : '🔒 Reveal (host)' }}</button>
                }
                @if (p.phase === 'revealed') { <button class="btn-neon btn-lg-x" (click)="c.puzzleNext()" id="btn-puzzle-next">➡ Next puzzle</button> }
              </div>
            </div>
          </div>
        }

        <!-- ═══════════ WHO AM I? ═══════════ -->
        @case ('person') {
          @let pr = c.state().person;
          @if (c.personError()) { <div class="alert-neon mb-3">{{ c.personError() }}</div> }
          <div class="stage glass">
            <div class="text-center w-100">
              @if (c.person(); as person) {
                <div class="category-pill-wrap mb-2">
                  <span class="category-pill pop-in">{{ person.category || '💡 Riddle Challenge' }}</span>
                </div>
                <div class="lbl">🎯 RIDDLE {{ pr.pos + 1 }} OF {{ c.state().person.people.length || 5 }} · CLUE {{ pr.clues }} OF {{ person.clues.length }}</div>
                <div class="clues">
                  @for (cl of person.clues.slice(0, pr.clues); track $index) {
                    <div class="clue pop-in glass"><span class="cn">{{ $index + 1 }}</span>{{ cl }}</div>
                  }
                </div>
                @if (pr.revealed) {
                  <div class="a pop-in display grad-text">{{ person.name }}</div>
                  @if (person.funny_reveal) { <div class="muted mt-2 pop-in">😂 {{ person.funny_reveal }}</div> }
                } @else { <div class="ic sil">🕵️</div> }
                <div class="muted">Prize now: <b class="text-white">{{ c.personPrize() }} pts</b></div>
                <div class="actions">
                  @if (!pr.revealed) {
                    <button class="btn-neon btn-cyan" (click)="c.personClue()" [disabled]="pr.clues >= person.clues.length" id="btn-person-clue">➕ Next clue</button>
                    <button class="btn-neon btn-green" (click)="c.personSolve()" id="btn-person-solve">✅ Team guessed it</button>
                    <button class="btn-neon btn-pink" (click)="c.personReveal()" id="btn-person-reveal">{{ auth.isHost() ? '👁 Reveal' : '🔒 Reveal (host)' }}</button>
                  } @else {
                    @if (pr.pos + 1 >= (c.state().person.people.length || 5)) {
                      <div class="badge-pill my-3">🎉 5 Riddles completed for {{ teams.activeTeam()?.name ?? 'this team' }}! Select the next team above, then start:</div>
                      <button class="btn-neon btn-lg-x pulse" (click)="c.personNext()" id="btn-person-next">➡ Next Team's Turn (5 Fresh Riddles)</button>
                    } @else {
                      <button class="btn-neon btn-lg-x" (click)="c.personNext()" id="btn-person-next">➡ Next Riddle ({{ pr.pos + 2 }} of 5)</button>
                    }
                  }
                  <button class="btn-ghost" (click)="c.fetchPersonCards()" [disabled]="c.personLoading()" id="btn-person-gen">✨ Fresh AI Cards</button>
                </div>
              } @else {
                <div class="ic">🕵️</div>
                <h3 class="display">{{ c.personLoading() ? '🤖 AI is picking a celebrity…' : 'Ready to play Who Am I?' }}</h3>
                <button class="btn-neon mt-3" (click)="c.fetchPersonCards()" [disabled]="c.personLoading()" id="btn-person-load">✨ Generate AI Clues</button>
              }
            </div>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .back { color: var(--muted); text-decoration: none; } .back:hover { color: #fff; }
    .stage { min-height: 420px; display: grid; place-items: center; padding: 2rem; transition: .4s; } .stage.live { box-shadow: 0 0 60px rgba(168,85,247,.5); border-color: var(--purple); }
    .ic { font-size: 5rem; animation: float 3s ease-in-out infinite; } @keyframes float { 50% { transform: translateY(-12px); } } .sil { font-size: 3.5rem; opacity: .6; }
    .lbl { letter-spacing: .25em; font-size: .82rem; color: var(--muted); font-weight: 700; margin-bottom: .6rem; }
    .q { font-size: clamp(1.35rem, 2.8vw, 2.3rem); font-weight: 800; line-height: 1.3; }
    .a { font-size: clamp(1.6rem, 4vw, 3rem); color: var(--gold); margin-top: 1rem; font-weight: 800; text-shadow: 0 0 20px rgba(250,204,21,.5); }
    .hint { font-size: 1.3rem; color: var(--gold); margin-top: .8rem; }
    .actions { display: flex; gap: .8rem; flex-wrap: wrap; justify-content: center; margin-top: 1.5rem; }

    /* Rapid Fire MCQ Grid */
    .mcq-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: .9rem; width: 100%; max-width: 760px; margin: 0 auto; }
    .mcq-opt { display: flex; align-items: center; gap: .85rem; padding: 1rem 1.2rem; text-align: left; color: #fff; font-size: 1.05rem; font-weight: 700;
      cursor: pointer; border: 2px solid var(--glass-border); transition: transform .18s, border-color .2s, background .2s, box-shadow .2s; font-family: var(--font); }
    .mcq-opt:hover:not(:disabled) { transform: translateY(-3px); border-color: var(--purple); background: rgba(168,85,247,.16); box-shadow: 0 8px 24px rgba(168,85,247,.25); }
    .mcq-opt:disabled { cursor: default; }
    .mcq-opt.correct { background: rgba(34,197,94,.24); border-color: #22c55e; box-shadow: 0 0 28px rgba(34,197,94,.45); }
    .mcq-opt.wrong   { background: rgba(239,68,68,.24); border-color: #ef4444; box-shadow: 0 0 24px rgba(239,68,68,.4); }
    .opt-key { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,.12); display: grid; place-items: center; font-weight: 900; flex: none; font-size: .95rem; }
    .mcq-opt.correct .opt-key { background: #22c55e; color: #052e16; }
    .mcq-opt.wrong   .opt-key { background: #ef4444; color: #fff; }
    .opt-txt { flex: 1; line-height: 1.3; }

    .vstage { padding: 2rem; } .votegrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .vote-card { padding: 1.2rem; border-top: 4px solid var(--tc); } .vote-card.lead { box-shadow: 0 0 40px var(--tc); transform: scale(1.05); }
    .vi { font-size: 2.6rem; } .vn { font-weight: 800; } .vc { font-size: 2.6rem; font-weight: 900; color: var(--tc); }
    .voters { display: flex; gap: .3rem; justify-content: center; flex-wrap: wrap; margin-top: .4rem; }
    .vb { width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--glass-border); background: var(--glass); font-size: 1.1rem; cursor: pointer; transition: .2s; }
    .vb:hover:not(:disabled) { transform: scale(1.2); } .vb.on { border-color: var(--gold); background: rgba(250,204,21,.25); box-shadow: 0 0 14px var(--gold); }
    .pic { position: relative; width: min(340px, 70vw); aspect-ratio: 1; margin: 0 auto; border-radius: 20px; overflow: hidden; background: #140a3a; border: 2px solid var(--glass-border); }
    .emo { position: absolute; inset: 0; display: grid; place-items: center; font-size: min(14rem, 45vw); }
    .tiles { position: absolute; inset: 0; display: grid; grid-template: repeat(3, 1fr) / repeat(3, 1fr); }
    .tile { background: linear-gradient(135deg, #3b1d8f, #7c3aed); border: 1px solid rgba(255,255,255,.2); transition: opacity .6s, transform .6s; } .tile.gone { opacity: 0; transform: scale(.4) rotate(40deg); }
    .category-pill-wrap { display: flex; justify-content: center; }
    .category-pill { display: inline-flex; align-items: center; gap: .4rem; padding: .4rem 1.2rem; border-radius: 999px; font-size: 1.05rem; font-weight: 800; background: linear-gradient(135deg, rgba(168,85,247,.35), rgba(34,211,238,.35)); border: 1.5px solid rgba(168,85,247,.6); color: #fff; box-shadow: 0 0 18px rgba(168,85,247,.4); letter-spacing: .02em; }
    .clues { display: grid; gap: .7rem; max-width: 760px; margin: 1rem auto; }
    .clue { padding: .9rem 1.2rem; text-align: left; font-size: 1.2rem; display: flex; gap: 1rem; align-items: center; }
    .cn { width: 34px; height: 34px; border-radius: 50%; background: var(--grad); display: grid; place-items: center; font-weight: 800; flex: none; }
  `,
})
export class ClassicGameComponent implements OnInit {
  readonly c = inject(ClassicGamesService);
  readonly teams = inject(TeamService);
  readonly auth = inject(HostAuthService);
  private route = inject(ActivatedRoute);
  readonly id = signal('rapid');
  readonly nine = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  readonly letters = ['A', 'B', 'C', 'D'];
  @Input() embedded = false;
  @Input() set gameId(v: string) {
    this.id.set(v);
    this.ensureLoaded(v);
  }

  def() { return GAMES.find((g) => g.id === this.id()); }

  ngOnInit() {
    if (!this.embedded) {
      this.route.paramMap.subscribe((p) => {
        const gid = p.get('id') ?? 'rapid';
        this.id.set(gid);
        this.ensureLoaded(gid);
      });
    } else {
      this.ensureLoaded(this.id());
    }
  }

  private ensureLoaded(gid: string) {
    if (gid === 'rapid' && !this.c.rapidQ()) this.c.fetchRapidQuestions();
    if (gid === 'person' && !this.c.person()) this.c.fetchPersonCards();
  }
}
