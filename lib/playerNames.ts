import type { Player } from '../types/game';

export function resolvePlayerName(players: Player[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}

// Profile name is shared by setup, quick play, and online rooms.
const PLAYER_NAME_KEY = 'uno.online.playerName';
const PLAYER_NAME_EVENT = 'uno:player-name-updated';
export function getPlayerName(fallback = 'You'): string {
  try {
    return (
      localStorage.getItem(PLAYER_NAME_KEY)?.trim().slice(0, 18) || fallback
    );
  } catch {
    return fallback;
  }
}
export function savePlayerName(value: string): string {
  const name = value.trim().slice(0, 18) || 'You';
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
    window.dispatchEvent(new Event(PLAYER_NAME_EVENT));
  } catch {
    /* Storage failure must not prevent starting a game. */
  }
  return name;
}
export function subscribePlayerName(onChange: () => void): () => void {
  window.addEventListener(PLAYER_NAME_EVENT, onChange);
  return () => window.removeEventListener(PLAYER_NAME_EVENT, onChange);
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
  let names = DEFAULT_PLAYER_NAMES.slice(0, 3);
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem('uno.local.playerNames') ?? 'null',
    );
    if (Array.isArray(stored)) {
      const valid = stored
        .filter((name): name is string => typeof name === 'string')
        .slice(0, 6);
      if (valid.length >= 2) names = valid;
    }
  } catch {
    /* Use the default crew if saved data is unavailable. */
  }
  names[0] = getPlayerName(names[0]);
  return names.map(
    (name, i) => name.trim().slice(0, 18) || DEFAULT_PLAYER_NAMES[i],
  );
}
