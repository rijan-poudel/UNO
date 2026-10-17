// Honest, device-local round history. The finished state makes recording idempotent.
import type { GameState } from '../types/game';
export interface PlayerProgress {
  rounds: number;
  wins: number;
  streak: number;
  bestStreak: number;
  recent: string[];
}
const EMPTY: PlayerProgress = {
  rounds: 0,
  wins: 0,
  streak: 0,
  bestStreak: 0,
  recent: [],
};
const KEY = 'uno.progress.v1';
export function parseProgress(raw: string | null): PlayerProgress {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (
      !value ||
      ![value.rounds, value.wins, value.streak, value.bestStreak].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      ) ||
      value.wins > value.rounds ||
      value.streak > value.wins ||
      value.bestStreak > value.wins ||
      !Array.isArray(value.recent)
    )
      return { ...EMPTY, recent: [] };
    return {
      rounds: value.rounds,
      wins: value.wins,
      streak: value.streak,
      bestStreak: value.bestStreak,
      recent: value.recent
        .filter((id: unknown): id is string => typeof id === 'string')
        .slice(-100),
    };
  } catch {
    return { ...EMPTY, recent: [] };
  }
}
export function addRoundResult(
  progress: PlayerProgress,
  resultId: string,
  won: boolean,
): PlayerProgress {
  if (progress.recent.includes(resultId)) return progress;
  const streak = won ? progress.streak + 1 : 0;
  return {
    rounds: progress.rounds + 1,
    wins: progress.wins + Number(won),
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
    recent: [...progress.recent, resultId].slice(-100),
  };
}
export function readProgressSnapshot(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}
export function recordRound(game: GameState, playerId: string): void {
  if (!game.winnerId || !game.players.some((p) => p.id === playerId)) return;
  // A full terminal snapshot distinguishes rounds even when card counters restart.
  const id = JSON.stringify([
    game.winnerId,
    game.turnCount,
    game.players.map((p) => [p.id, p.hand.map((c) => c.id)]),
    game.discardPile.map((c) => c.id),
    game.drawPile.map((c) => c.id),
  ]);
  try {
    const previous = parseProgress(readProgressSnapshot());
    const next = addRoundResult(previous, id, game.winnerId === playerId);
    if (next !== previous) {
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('uno:progress'));
    }
  } catch {
    /* Private browsing must not interrupt a round. */
  }
}
export function subscribeProgress(listener: () => void): () => void {
  window.addEventListener('uno:progress', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('uno:progress', listener);
    window.removeEventListener('storage', listener);
  };
}
