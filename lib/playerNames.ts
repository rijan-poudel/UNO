import type { Player } from '../types/game';

export function resolvePlayerName(players: Player[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}

// Shared saved crew for quick play and the setup editor.
export const DEFAULT_PLAYER_NAMES = [
  'You',
  'Cleo',
  'Jules',
  'Robin',
  'Frankie',
  'Lou',
];
export function getSavedPlayerNames(): string[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem('uno.local.playerNames') ?? 'null',
    );
    const profile = localStorage.getItem('uno.online.playerName');
    const names = Array.isArray(stored)
      ? stored
          .filter((name): name is string => typeof name === 'string')
          .slice(0, 6)
      : DEFAULT_PLAYER_NAMES.slice(0, 3);
    if (profile?.trim()) names[0] = profile;
    return names.length >= 2
      ? names.map(
          (name, i) => name.trim().slice(0, 18) || DEFAULT_PLAYER_NAMES[i],
        )
      : DEFAULT_PLAYER_NAMES.slice(0, 3);
  } catch {
    return DEFAULT_PLAYER_NAMES.slice(0, 3);
  }
}
