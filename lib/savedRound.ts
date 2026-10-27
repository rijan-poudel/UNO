// Device-local recovery for unfinished bot rounds. Storage never gates play.
import type { Card } from '../types/card';
import { STANDARD_COLORS } from '../types/card';
import { createGameDeck } from './gameSetup';
import type { GameState } from '../types/game';
import { validateGameRules } from './validateGameRules';
import { withTurnDeadline } from './turnFlow';
import { parseTableScore } from './tableScore';

export const SAVED_ROUND_KEY = 'uno.localRound.v1';

export function parseSavedRound(raw: string | null): GameState | null {
  if (!raw || raw.length > 64_000) return null;
  try {
    const { version, game } = JSON.parse(raw);
    if (
      version !== 1 ||
      !game ||
      game.winnerId !== null ||
      !Array.isArray(game.players) ||
      game.players.length < 2 ||
      game.players.length > 6 ||
      !Number.isInteger(game.currentPlayerIndex) ||
      game.currentPlayerIndex < 0 ||
      game.currentPlayerIndex >= game.players.length ||
      ![1, -1].includes(game.direction) ||
      !(
        game.activeColor === null || STANDARD_COLORS.includes(game.activeColor)
      ) ||
      !Number.isSafeInteger(game.turnCount) ||
      game.turnCount < 0 ||
      !Number.isSafeInteger(game.pendingDraw) ||
      game.pendingDraw < 0 ||
      game.pendingDraw % 2 !== 0 ||
      (game.pendingDraw === 0
        ? game.pendingDrawType !== null
        : !['draw2', 'wild4'].includes(game.pendingDrawType)) ||
      typeof game.drawnThisTurn !== 'boolean' ||
      !Array.isArray(game.drawPile) ||
      !Array.isArray(game.discardPile) ||
      game.discardPile.length === 0
    )
      return null;

    const rules = validateGameRules(game.rules);
    const players: GameState['players'] = game.players;
    if (
      players.length > rules.maxPlayers ||
      players.filter((player) => player?.isBot === false).length !== 1 ||
      new Set(players.map((player) => player?.id)).size !== players.length ||
      players.some(
        (player) =>
          !player ||
          typeof player.id !== 'string' ||
          !player.id ||
          typeof player.name !== 'string' ||
          player.name.length > 100 ||
          typeof player.isBot !== 'boolean' ||
          typeof player.saidUno !== 'boolean' ||
          !Array.isArray(player.hand) ||
          (player.hand.length === 0 && player.eliminated !== true) ||
          (player.eliminated !== undefined &&
            typeof player.eliminated !== 'boolean'),
      )
    )
      return null;

    const cards: Card[] = [
      ...game.drawPile,
      ...game.discardPile,
      ...players.flatMap((player) => player.hand),
      ...(game.outOfPlayPile ?? []),
    ];
    if (game.outOfPlayPile !== undefined && !Array.isArray(game.outOfPlayPile))
      return null;
    const deck = createGameDeck(rules);
    const expected = new Map<string, number>();
    for (const card of deck) {
      const key = `${card.color}:${card.value}`;
      expected.set(key, (expected.get(key) ?? 0) + 1);
    }
    if (
      cards.length !== deck.length ||
      new Set(cards.map((card) => card?.id)).size !== cards.length
    )
      return null;
    for (const card of cards) {
      if (
        !card ||
        typeof card.id !== 'string' ||
        !card.id ||
        card.id.length > 100
      )
        return null;
      const key = `${card.color}:${card.value}`;
      const remaining = expected.get(key) ?? 0;
      if (remaining <= 0) return null;
      expected.set(key, remaining - 1);
    }
    const top: Card = game.discardPile.at(-1);
    if (
      rules.gameMode !== 'all_wild' &&
      (!STANDARD_COLORS.includes(game.activeColor) ||
        (top.color !== 'wild' && top.color !== game.activeColor))
    )
      return null;
    if (players[game.currentPlayerIndex].eliminated) return null;
    if (
      game.pendingRoulette &&
      (game.pendingRoulette.playerId !== players[game.currentPlayerIndex].id ||
        top.value !== 'wildColorRoulette' ||
        game.pendingDraw !== 0)
    )
      return null;

    // Transient presentation and an expired wall clock must not replay on return.
    const roundId =
      typeof game.roundId === 'string' &&
      game.roundId.length > 0 &&
      game.roundId.length <= 100
        ? game.roundId
        : undefined;
    const tableScore = roundId
      ? parseTableScore(game.tableScore, players)
      : undefined;
    return {
      ...(roundId ? { roundId } : {}),
      ...(tableScore ? { tableScore } : {}),
      players,
      rules,
      drawPile: game.drawPile,
      ...(game.outOfPlayPile ? { outOfPlayPile: game.outOfPlayPile } : {}),
      ...(game.pendingRoulette
        ? { pendingRoulette: game.pendingRoulette }
        : {}),
      discardPile: game.discardPile,
      currentPlayerIndex: game.currentPlayerIndex,
      direction: game.direction,
      activeColor: game.activeColor,
      pendingDraw: game.pendingDraw,
      pendingDrawType: game.pendingDrawType,
      drawnThisTurn: game.drawnThisTurn,
      winnerId: null,
      turnCount: game.turnCount,
      lastAction: { type: 'init' },
    };
  } catch {
    return null;
  }
}

export function readSavedRound(): GameState | null {
  try {
    return parseSavedRound(localStorage.getItem(SAVED_ROUND_KEY));
  } catch {
    return null;
  }
}

export function saveRound(game: GameState | null): void {
  try {
    if (!game || game.winnerId) localStorage.removeItem(SAVED_ROUND_KEY);
    else
      localStorage.setItem(
        SAVED_ROUND_KEY,
        JSON.stringify({ version: 1, game }),
      );
  } catch {
    // Storage can be unavailable or full; the current round remains playable.
  }
}

export function resumeRound(game: GameState, now = Date.now()): GameState {
  return withTurnDeadline(
    null,
    { ...game, autoPlayPlayerIds: [], turnDeadlineAt: null },
    now,
  );
}
