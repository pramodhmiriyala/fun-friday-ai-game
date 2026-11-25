import { Injectable, computed } from '@angular/core';
import { persisted, uid } from '../core/store';

export interface Team {
  id: string;
  name: string;
  color: string;
  emoji: string;
  members: string[];
}

const PALETTE = ['#a855f7', '#3b82f6', '#ec4899', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];
const EMOJIS = ['🦄', '🚀', '🔥', '⚡', '🐉', '🎯', '👾', '🦊'];
const DEFAULT_NAMES = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'];

@Injectable({ providedIn: 'root' })
export class TeamService {
  readonly teams = persisted<Team[]>('teams', []);
  readonly activeTeamId = persisted<string | null>('activeTeam', null);
  readonly activeTeam = computed(() => this.teams().find((t) => t.id === this.activeTeamId()) ?? null);

  add(name: string): string | null {
    const n = name.trim().slice(0, 30);
    if (!n) return 'Team name is required';
    if (this.teams().length >= 10) return 'Maximum of 10 teams';
    if (this.teams().some((t) => t.name.toLowerCase() === n.toLowerCase())) return 'That team name already exists';
    const i = this.teams().length;
    const team: Team = { id: uid(), name: n, color: PALETTE[i % 8], emoji: EMOJIS[i % 8], members: [] };
    this.teams.update((l) => [...l, team]);
    if (!this.activeTeamId()) this.activeTeamId.set(team.id);
    return null;
  }

  quickStart() {
    DEFAULT_NAMES.forEach((n) => this.add(n));
  }

  rename(id: string, name: string): string | null {
    const n = name.trim().slice(0, 30);
    if (!n) return 'Team name is required';
    if (this.teams().some((t) => t.id !== id && t.name.toLowerCase() === n.toLowerCase())) return 'That team name already exists';
    this.teams.update((l) => l.map((t) => (t.id === id ? { ...t, name: n } : t)));
    return null;
  }

  remove(id: string) {
    this.teams.update((l) => l.filter((t) => t.id !== id));
    if (this.activeTeamId() === id) this.activeTeamId.set(this.teams()[0]?.id ?? null);
  }

  addMember(id: string, name: string): string | null {
    const n = name.trim().slice(0, 30);
    if (!n) return 'Member name is required';
    const team = this.get(id);
    if (!team) return 'Team not found';
    if (team.members.length >= 20) return 'Maximum of 20 members per team';
    if (team.members.some((m) => m.toLowerCase() === n.toLowerCase())) return 'Member already in the team';
    this.teams.update((l) => l.map((t) => (t.id === id ? { ...t, members: [...t.members, n] } : t)));
    return null;
  }

  removeMember(id: string, name: string) {
    this.teams.update((l) => l.map((t) => (t.id === id ? { ...t, members: t.members.filter((m) => m !== name) } : t)));
  }

  renameMember(id: string, oldName: string, newName: string): string | null {
    const n = newName.trim().slice(0, 30);
    if (!n) return 'Member name is required';
    const team = this.get(id);
    if (!team) return 'Team not found';
    if (team.members.some((m) => m !== oldName && m.toLowerCase() === n.toLowerCase())) return 'Member already in the team';
    this.teams.update((l) => l.map((t) => (t.id === id ? { ...t, members: t.members.map((m) => (m === oldName ? n : m)) } : t)));
    return null;
  }

  setActive(id: string | null) { this.activeTeamId.set(id); }
  get(id: string) { return this.teams().find((t) => t.id === id); }
  clear() { this.teams.set([]); this.activeTeamId.set(null); }
}
