import type { Player } from '../types/game';

export function resolvePlayerName(players: Player[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}
