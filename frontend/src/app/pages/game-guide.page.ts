import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface GameRule {
  id: string;
  title: string;
  badge: string;
  icon: string;
  color: string;
  tagline: string;
  overview: string;
  howToPlay: string[];
  scoring: { rule: string; points: string }[];
  proTip: string;
}

@Component({
  selector: 'app-game-guide',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page guide-container fade-in">
      <!-- Header -->
      <header class="guide-header text-center">
        <div class="badge-pill mb-2">📖 Official Rulebook & Scoring</div>
        <h1 class="display grad-text">FUN CONNECT GAME GUIDE</h1>
        <p class="lead text-muted mx-auto" style="max-width: 680px">
          Everything you need to know about all 5 team games, rules, how points are calculated, and tips to win!
        </p>

        <!-- Quick Filter / Jump Tabs -->
        <div class="jump-tabs">
          <button class="jump-pill" [class.active]="selectedTab() === 'all'" (click)="setTab('all')">
            🌟 All Games & Rules
          </button>
          @for (g of games; track g.id) {
            <button class="jump-pill" [class.active]="selectedTab() === g.id" (click)="setTab(g.id)">
              {{ g.icon }} {{ g.title }}
            </button>
          }
          <button class="jump-pill" [class.active]="selectedTab() === 'wheel'" (click)="setTab('wheel')">
            🎡 Bonus Wheel
          </button>
        </div>
      </header>

      <!-- Quick Summary Card -->
      <section class="glass glass-pad summary-banner mb-4">
        <div class="summary-flex">
          <div class="summary-info">
            <h3 class="h4 mb-1 text-white">🏆 Quick Host & Team Overview</h3>
            <p class="muted mb-0">
              Teams take turns playing rounds. Scores update in real time on the <b>Leaderboard</b>. 
              The team with the most points at the end wins the Grand Championship!
            </p>
          </div>
          <div class="summary-actions">
            <a routerLink="/wheel" class="btn-neon btn-pink" id="btn-guide-wheel">🎡 Spin Wheel</a>
            <a routerLink="/" class="btn-neon" id="btn-guide-arena">🚀 Play Arena</a>
          </div>
        </div>
      </section>

      <!-- Games Grid / List -->
      <div class="rules-list">
        @for (g of filteredGames(); track g.id) {
          <article class="glass glass-pad rule-card mb-4" [style.--glow-color]="g.color">
            <div class="card-head">
              <div class="game-meta">
                <span class="game-icon">{{ g.icon }}</span>
                <div>
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <h2 class="game-title mb-0">{{ g.title }}</h2>
                    <span class="rule-badge" [style.background]="g.color + '22'" [style.color]="g.color" [style.borderColor]="g.color + '55'">
                      {{ g.badge }}
                    </span>
                  </div>
                  <p class="game-tagline text-muted mb-0">{{ g.tagline }}</p>
                </div>
              </div>
            </div>

            <div class="card-body-content mt-3">
              <!-- Overview -->
              <p class="overview-txt">{{ g.overview }}</p>

              <div class="row g-4">
                <!-- How to play -->
                <div class="col-12 col-lg-7">
                  <div class="sub-block h-100">
                    <h4 class="sub-title"><span class="sub-ic">🎮</span> How to Play</h4>
                    <ol class="steps-list">
                      @for (step of g.howToPlay; track $index) {
                        <li>
                          <span class="step-num">{{ $index + 1 }}</span>
                          <span class="step-txt">{{ step }}</span>
                        </li>
                      }
                    </ol>
                  </div>
                </div>

                <!-- Points Calculation -->
                <div class="col-12 col-lg-5">
                  <div class="sub-block scoring-block h-100">
                    <h4 class="sub-title"><span class="sub-ic">🧮</span> Points Calculation</h4>
                    <table class="scoring-table">
                      <tbody>
                        @for (sc of g.scoring; track $index) {
                          <tr>
                            <td class="rule-label">{{ sc.rule }}</td>
                            <td class="points-val text-end" [class.pos]="sc.points.includes('+')" [class.neg]="sc.points.includes('-')">
                              {{ sc.points }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Pro Tip -->
              <div class="pro-tip-box mt-3">
                <span class="tip-icon">💡</span>
                <span class="tip-text"><b>Pro Tip:</b> {{ g.proTip }}</span>
              </div>
            </div>
          </article>
        }

        <!-- Bonus Wheel Section -->
        @if (selectedTab() === 'all' || selectedTab() === 'wheel') {
          <article class="glass glass-pad rule-card mb-4" style="--glow-color: #ec4899">
            <div class="card-head">
              <div class="game-meta">
                <span class="game-icon">🎡</span>
                <div>
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <h2 class="game-title mb-0">Spinning Wheel of Fate & Bonus Challenges</h2>
                    <span class="rule-badge" style="background: rgba(236,72,153,0.15); color: #ec4899; border-color: rgba(236,72,153,0.3)">
                      Wheel Luck
                    </span>
                  </div>
                  <p class="game-tagline text-muted mb-0">Randomize teams, games, or land on hilarious webcam bonus points!</p>
                </div>
              </div>
            </div>

            <div class="card-body-content mt-3">
              <p class="overview-txt">
                Use the Wheel at the start of a round to pick which team plays next, which game to play, or spin for spontaneous <b>Bonus Challenges</b> that give teams instant extra points.
              </p>

              <div class="row g-4">
                <div class="col-12 col-lg-7">
                  <div class="sub-block h-100">
                    <h4 class="sub-title"><span class="sub-ic">🎯</span> 3 Wheel Modes</h4>
                    <ul class="wheel-modes-list mb-3">
                      <li><b>👥 Pick a Team:</b> Randomly spins across all registered active teams to decide who takes the stage.</li>
                      <li><b>🎮 Pick a Game:</b> Randomly selects one of the 5 arena games when teams can't decide what to play next.</li>
                      <li><b>🎁 Bonus Challenge:</b> Lands on instant chair/webcam mini-dares for instant leaderboard points!</li>
                    </ul>

                    <h4 class="sub-title mt-4"><span class="sub-ic">😂</span> Desk & Webcam Bonus Challenges</h4>
                    <p class="muted text-sm mb-2">100% sitting in chair · Zero physical dancing · Pure corporate fun:</p>
                    <div class="bonus-examples-grid">
                      <div class="bonus-chip">📢 <b>Naaptol Pitch:</b> Urgent 2 AM TV pitch for any desk item (+15 pts)</div>
                      <div class="bonus-chip">🏏 <b>IPL Commentary:</b> High-speed commentary on someone sipping water (+15 pts)</div>
                      <div class="bonus-chip">🎶 <b>Opera Singer:</b> "Twinkle Twinkle" in dramatic opera voice (+15 pts)</div>
                      <div class="bonus-chip">☕ <b>Slow-Mo Sip:</b> Take a sip of water/tea in extreme slow motion (+10 pts)</div>
                      <div class="bonus-chip">🔌 <b>Charger Apology:</b> Emotionally apologize to your 100% charger (+10 pts)</div>
                      <div class="bonus-chip">☀️ <b>Weather Anchor:</b> High-energy 15s weather report of room (+15 pts)</div>
                      <div class="bonus-chip">👅 <b>Nose Touch:</b> Try to touch nose with tongue for 6 seconds (+10 pts)</div>
                      <div class="bonus-chip">🗿 <b>Webcam Freeze:</b> Buffering video call expression for 15s (+10 pts)</div>
                      <div class="bonus-chip">🎁 <b>Lucky Jackpot:</b> Free instant team bonus (+20 pts)</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-lg-5">
                  <div class="sub-block scoring-block h-100">
                    <h4 class="sub-title"><span class="sub-ic">🧮</span> Bonus Points System</h4>
                    <table class="scoring-table">
                      <tbody>
                        <tr>
                          <td class="rule-label">Lucky Jackpot Bonus</td>
                          <td class="points-val pos text-end">+20 pts</td>
                        </tr>
                        <tr>
                          <td class="rule-label">15-Second Creative Pitch / Commentary</td>
                          <td class="points-val pos text-end">+15 pts</td>
                        </tr>
                        <tr>
                          <td class="rule-label">10-Second Webcam Facial / Voice Dare</td>
                          <td class="points-val pos text-end">+10 pts</td>
                        </tr>
                        <tr>
                          <td class="rule-label">Bonus Challenge Skipped</td>
                          <td class="points-val text-end">0 pts</td>
                        </tr>
                        <tr>
                          <td class="rule-label">Host Discretion / Effort Bonus</td>
                          <td class="points-val pos text-end">+5 to +15 pts</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div class="pro-tip-box mt-3">
                <span class="tip-icon">💡</span>
                <span class="tip-text"><b>Pro Tip:</b> 100% webcam-safe! No running or dancing required. Challenges take 10 to 15 seconds sitting comfortably at your desk.</span>
              </div>
            </div>
          </article>
        }
      </div>

      <!-- Footer CTA -->
      <div class="guide-footer text-center mt-5 mb-5">
        <h3 class="grad-text mb-2">Ready to Play?</h3>
        <p class="text-muted mb-4">Pick a team, spin the wheel, or jump straight into the Arena!</p>
        <div class="d-flex justify-content-center gap-3 flex-wrap">
          <a routerLink="/" class="btn-neon btn-lg-x">🚀 Enter Arena</a>
          <a routerLink="/teams" class="btn-ghost btn-lg-x">👥 Manage Teams</a>
          <a routerLink="/wheel" class="btn-neon btn-pink btn-lg-x">🎡 Spin Wheel</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .guide-container {
      max-width: 1100px;
      margin: 0 auto;
      padding-top: 1.5rem;
    }
    .guide-header h1 {
      font-size: clamp(2rem, 4vw, 3.2rem);
      font-weight: 900;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
    }
    .jump-tabs {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      margin-bottom: 2rem;
    }
    .jump-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--muted);
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .jump-pill:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      transform: translateY(-1px);
    }
    .jump-pill.active {
      background: var(--grad);
      color: #fff;
      border-color: transparent;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
    }
    .summary-banner {
      border-left: 4px solid var(--purple);
    }
    .summary-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .summary-info {
      flex: 1 1 500px;
    }
    .summary-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .summary-actions a,
    .guide-footer a {
      text-decoration: none !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }
    .bonus-examples-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 0.6rem;
    }
    .bonus-chip {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      color: #e2e8f0;
    }
    .bonus-chip b {
      color: #f472b6;
    }
    .rule-card {
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.09);
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .rule-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--glow-color, var(--purple));
      box-shadow: 0 0 12px var(--glow-color, var(--purple));
    }
    .game-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .game-icon {
      font-size: 2.5rem;
      line-height: 1;
      padding: 0.6rem;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .game-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
    }
    .rule-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      border: 1px solid;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .overview-txt {
      font-size: 1.02rem;
      color: #e2e8f0;
      line-height: 1.6;
      margin-bottom: 1.25rem;
    }
    .sub-block {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      padding: 1.25rem;
    }
    .sub-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .steps-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .steps-list li {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.95rem;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .step-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--purple);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .scoring-table {
      width: 100%;
      border-collapse: collapse;
    }
    .scoring-table tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .scoring-table tr:last-child {
      border-bottom: none;
    }
    .scoring-table td {
      padding: 0.65rem 0.2rem;
      font-size: 0.92rem;
    }
    .rule-label {
      color: #cbd5e1;
    }
    .points-val {
      font-weight: 800;
      white-space: nowrap;
    }
    .points-val.pos {
      color: #4ade80;
    }
    .points-val.neg {
      color: #f87171;
    }
    .pro-tip-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(234, 179, 8, 0.08);
      border: 1px solid rgba(234, 179, 8, 0.25);
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.92rem;
      color: #fde047;
    }
    .tip-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .wheel-modes-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      color: #cbd5e1;
      font-size: 0.95rem;
    }
    .wheel-modes-list b {
      color: #fff;
    }
  `]
})
export class GameGuidePageComponent {
  selectedTab = signal<string>('all');

  games: GameRule[] = [
    {
      id: 'rapid',
      title: 'Rapid Fire Quiz',
      badge: 'Speed MCQ',
      icon: '⚡',
      color: '#f59e0b',
      tagline: '60-Second multiple choice blitz testing speed and general knowledge!',
      overview: 'Teams face a rapid succession of multiple choice questions under a ticking 60-second timer. Test your team’s collective instincts across tech, pop culture, movies, and world trivia!',
      howToPlay: [
        'The nominated team starts their 60-second countdown.',
        'Read the question on screen and click one of the 4 multiple-choice options.',
        'Answer as many questions as possible before the buzzer sounds. Instant next question after every pick!'
      ],
      scoring: [
        { rule: 'Each Correct Answer', points: '+5 pts' },
        { rule: 'Incorrect Answer', points: '0 pts' },
        { rule: 'Skipped Question', points: '0 pts' }
      ],
      proTip: 'Speed is king! If the team doesn’t know the answer immediately, make an educated guess or pick quickly to unlock the next question.'
    },
    {
      id: 'whoami',
      title: 'Who Am I? (Mystery Clues)',
      badge: 'Deduction',
      icon: '🎯',
      color: '#06b6d4',
      tagline: '5 progressive clues. The earlier you guess, the more points you bank!',
      overview: 'Identify a mystery personality (tech pioneer, movie character, historic icon, or sports legend) from 5 progressive hints that go from cryptic to obvious.',
      howToPlay: [
        'Clue #1 is revealed. The team can choose to lock in a guess or ask for the next clue.',
        'Each additional clue makes the person easier to identify but lowers the reward tier.',
        'When confident, submit your final guess to see if you cracked the mystery!'
      ],
      scoring: [
        { rule: 'Guessed on Clue 1 (Cryptic)', points: '+10 pts' },
        { rule: 'Guessed on Clue 2 (Tricky)', points: '+8 pts' },
        { rule: 'Guessed on Clue 3 (Moderate)', points: '+6 pts' },
        { rule: 'Guessed on Clue 4 (Obvious)', points: '+4 pts' },
        { rule: 'Guessed on Clue 5 (Giveaway)', points: '+2 pts' },
        { rule: 'Wrong Guess', points: '0 pts' }
      ],
      proTip: 'Discuss with teammates before guessing! Clue 2 or 3 often gives away distinctive historical or pop-culture connections.'
    },
    {
      id: 'truth-or-dare',
      title: 'AI Truth or Dare (Virtual Edition)',
      badge: 'Social / Team Bonding',
      icon: '🎡',
      color: '#8b5cf6',
      tagline: '100% sitting-at-desk/webcam friendly Indian IT office humor & dares!',
      overview: 'Spin the wheel of fate to receive a punchy, 1-sentence truth question or hilarious webcam dare crafted specifically for online video calls (Teams/Zoom). Zero dancing or leaving your chair!',
      howToPlay: [
        'The active player spins the wheel to get TRUTH, DARE, or PASS +5.',
        'If landing on PASS +5: The team instantly wins 5 bonus points without having to do any task!',
        'If landing on TRUTH or DARE: The player answers the question or performs the 15-second dare on camera.',
        'Upon completion, the team confirms to receive +10 points!'
      ],
      scoring: [
        { rule: 'Wheel Lands on "PASS +5"', points: '+5 pts (Free!)' },
        { rule: 'Completed Truth or Dare', points: '+10 pts' },
        { rule: 'Skipped / Forfeited Challenge', points: '0 pts' }
      ],
      proTip: 'All dares are webcam/mic friendly (e.g. 15s Naaptol TV water bottle pitch, funny facial freeze, IPL tea-drinking commentary). Keep cameras ON for maximum laughs!'
    },
    {
      id: 'guess-movie',
      title: 'Guess the Movie (Plot & Dialogue)',
      badge: 'Plot Clues',
      icon: '🎬',
      color: '#ec4899',
      tagline: 'AI summarizes the plot without naming it. Ask clues or guess the title!',
      overview: 'The AI host generates a witty, spoiler-free plot summary of a famous movie. Ask interactive clue questions or guess the title directly to bank maximum points!',
      howToPlay: [
        'Read the AI plot summary on screen. You start each round with a 25-point bounty.',
        'Use the quick clue buttons (Hero/Heroine, Director, Release Year, Song/Dialogue) to get hints.',
        'Each clue asked reveals an iconic clue but costs 3 points from your bounty.',
        'Type your movie guess in chat or say it on mic to seal your victory!'
      ],
      scoring: [
        { rule: 'Base Starting Bounty', points: '25 pts' },
        { rule: 'Each Clue Asked (Deduction)', points: '-3 pts' },
        { rule: 'Guessed with 0 Clues (Instant)', points: '+25 pts' },
        { rule: 'Guessed with 1 Clue', points: '+22 pts' },
        { rule: 'Guessed with 2 Clues', points: '+19 pts' },
        { rule: 'Guessed with 3 Clues', points: '+16 pts' }
      ],
      proTip: 'Clicking "🎵 Song / Dialogue" gives an iconic dialogue or famous song line in the movie’s original language without revealing the title!'
    },
    {
      id: 'panic-defuse',
      title: 'Tongue Twister Defuse',
      badge: 'Mic Countdown',
      icon: '🌪️',
      color: '#10b981',
      tagline: 'Say the moderate-difficulty English tongue twister 3 times in 20 seconds!',
      overview: 'A high-pressure voice challenge! A famous tricky English tongue twister appears on screen with a ticking 20-second countdown. Clear articulation and fast speech will defuse the bomb.',
      howToPlay: [
        'A player from the active team is chosen to speak on microphone.',
        'Click "Start 20s Timer" to reveal the English tongue twister.',
        'The player must say the twister cleanly 3 TIMES consecutively before the countdown reaches zero.',
        'If completed cleanly, tap "Defused! (+10 pts)". If timer expires, the bomb explodes!'
      ],
      scoring: [
        { rule: 'Defused! (Said 3x within 20s)', points: '+10 pts' },
        { rule: 'Timer Expired / Stumbled', points: '0 pts' }
      ],
      proTip: 'Don’t mumble! Speak clearly and keep a steady rhythm. The other teams and host must verify all 3 full repetitions.'
    }
  ];

  filteredGames(): GameRule[] {
    const tab = this.selectedTab();
    if (tab === 'all') return this.games;
    return this.games.filter(g => g.id === tab);
  }

  setTab(tab: string) {
    this.selectedTab.set(tab);
  }
}
