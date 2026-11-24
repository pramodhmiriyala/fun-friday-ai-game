import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'FUN CONNECT – Team Arena', loadComponent: () => import('./pages/landing.component').then((m) => m.LandingComponent) },
  { path: 'teams', title: 'Teams – Fun Connect', loadComponent: () => import('./components/team-manager.component').then((m) => m.TeamManagerComponent) },
  { path: 'play/truth-or-dare', title: 'Truth or Dare – Fun Connect', loadComponent: () => import('./games/truth-or-dare.component').then((m) => m.TruthOrDareComponent) },
  { path: 'play/guess-movie', title: 'Guess the Movie – Fun Connect', loadComponent: () => import('./games/guess-movie.component').then((m) => m.GuessMovieComponent) },
  { path: 'play/panic-defuse', data: { game: 'panic' }, title: 'Tongue Twister Defuse – Fun Connect', loadComponent: () => import('./games/party-game.component').then((m) => m.PartyGameComponent) },
  { path: 'classic/:id', title: 'Team Challenge – Fun Connect', loadComponent: () => import('./games/classic-game.component').then((m) => m.ClassicGameComponent) },
  { path: 'wheel', title: 'Spin Wheel – Fun Connect', loadComponent: () => import('./pages/wheel.page').then((m) => m.WheelPageComponent) },
  { path: 'leaderboard', title: 'Leaderboard – Fun Connect', loadComponent: () => import('./pages/leaderboard.page').then((m) => m.LeaderboardPageComponent) },
  { path: 'winner', title: 'Winner! – Fun Connect', loadComponent: () => import('./pages/winner.page').then((m) => m.WinnerPageComponent) },
  { path: 'host', title: 'Host Dashboard – Fun Connect', loadComponent: () => import('./pages/host-dashboard.page').then((m) => m.HostDashboardComponent) },
  { path: '**', redirectTo: '' },
];
