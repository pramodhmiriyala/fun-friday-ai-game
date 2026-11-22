import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'FUN FRIDAY – Game Time!', loadComponent: () => import('./pages/landing.component').then((m) => m.LandingComponent) },
  { path: 'teams', title: 'Teams – Fun Friday', loadComponent: () => import('./components/team-manager.component').then((m) => m.TeamManagerComponent) },
  { path: 'play/truth-or-dare', title: 'Truth or Dare – Fun Friday', loadComponent: () => import('./games/truth-or-dare.component').then((m) => m.TruthOrDareComponent) },
  { path: 'play/movie-director', title: 'AI Movie Director – Fun Friday', loadComponent: () => import('./games/movie-director.component').then((m) => m.MovieDirectorComponent) },
  { path: 'play/guess-movie', title: 'AI – Guess the Movie – Fun Friday', loadComponent: () => import('./games/guess-movie.component').then((m) => m.GuessMovieComponent) },
  { path: 'classic/:id', title: 'AI Game – Fun Friday', loadComponent: () => import('./games/classic-game.component').then((m) => m.ClassicGameComponent) },
  { path: 'wheel', title: 'Spin Wheel – Fun Friday', loadComponent: () => import('./pages/wheel.page').then((m) => m.WheelPageComponent) },
  { path: 'leaderboard', title: 'Leaderboard – Fun Friday', loadComponent: () => import('./pages/leaderboard.page').then((m) => m.LeaderboardPageComponent) },
  { path: 'winner', title: 'Winner! – Fun Friday', loadComponent: () => import('./pages/winner.page').then((m) => m.WinnerPageComponent) },
  { path: 'host', title: 'Host Dashboard – Fun Friday', loadComponent: () => import('./pages/host-dashboard.page').then((m) => m.HostDashboardComponent) },
  { path: '**', redirectTo: '' },
];
