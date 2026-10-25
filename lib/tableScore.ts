// Honest per-table wins. Controllers publish results; the engine owns the winner.
import type { GameState, TableScore } from '../types/game';

export function parseTableScore(
  value: unknown,
  players: ReadonlyArray<{ id: string }>,
): TableScore | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const score = value as Partial<TableScore>;
  if (
    !Number.isSafeInteger(score.completedRounds) ||
    (score.completedRounds ?? -1) < 0 ||
    !score.wins ||
    typeof score.wins !== 'object' ||
    Array.isArray(score.wins) ||
    Object.keys(score.wins).length !== players.length ||
    players.some(
      (player) =>
        !Object.hasOwn(score.wins ?? {}, player.id) ||
        !Number.isSafeInteger(score.wins?.[player.id]) ||
        (score.wins?.[player.id] ?? -1) < 0,
    ) ||
    (score.completedRounds === 0
      ? score.lastRoundId !== null
      : typeof score.lastRoundId !== 'string' ||
        !score.lastRoundId ||
        score.lastRoundId.length > 100)
  )
    return undefined;
  const wins = Object.fromEntries(
    players.map((player) => [player.id, score.wins?.[player.id] ?? 0]),
  );
  const total = Object.values(wins).reduce((sum, count) => sum + count, 0);
  if (total !== score.completedRounds || !Number.isSafeInteger(total))
    return undefined;
  return {
    completedRounds: total,
    wins,
    lastRoundId: score.lastRoundId ?? null,
  };
}

export function startTableRound(
  game: GameState,
  roundId: string,
  previous?: TableScore,
): GameState {
  if (!roundId || roundId.length > 100)
    throw new Error('A valid round identity is required.');
  return {
    ...game,
    roundId,
    tableScore: parseTableScore(previous, game.players) ?? {
      completedRounds: 0,
      wins: Object.fromEntries(game.players.map((player) => [player.id, 0])),
      lastRoundId: null,
    },
  };
}

export function recordTableWin(game: GameState): GameState {
  const score = game.tableScore;
  if (
    !score ||
    !game.roundId ||
    !game.winnerId ||
    score.lastRoundId === game.roundId ||
    game.players.find((player) => player.id === game.winnerId)?.hand.length !==
      0 ||
    !Object.hasOwn(score.wins, game.winnerId) ||
    !Number.isSafeInteger(score.completedRounds + 1)
  )
    return game;
  return {
    ...game,
    tableScore: {
      completedRounds: score.completedRounds + 1,
      wins: { ...score.wins, [game.winnerId]: score.wins[game.winnerId] + 1 },
      lastRoundId: game.roundId,
    },
  };
}
