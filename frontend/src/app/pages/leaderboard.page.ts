import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaderboardComponent } from '../components/leaderboard.component';

@Component({
  selector: 'app-leaderboard-page',
  imports: [LeaderboardComponent, RouterLink],
  template: `
    <section class="page">
      <div class="text-center mb-5">
        <span class="badge-pill">📊 Live</span>
        <h1 class="page-title grad-text" style="font-size: clamp(2.2rem,5vw,4.5rem)">LEADERBOARD</h1>
      </div>
      <div class="mx-auto" style="max-width: 1100px"><app-leaderboard /></div>
      <div class="text-center mt-5"><a routerLink="/winner" class="btn-neon btn-gold btn-lg-x text-decoration-none d-inline-block" id="btn-crown">🏆 Crown the Winner</a></div>
    </section>
  `,
})
export class LeaderboardPageComponent {}
