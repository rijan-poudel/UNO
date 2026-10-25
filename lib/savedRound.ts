// Device-local recovery for unfinished bot rounds. Storage never gates play.
import type { Card } from '../types/card';
import { ACTION_VALUES, NUMBER_VALUES, STANDARD_COLORS } from '../types/card';
import type { GameState } from '../types/game';
import { validateGameRules } from './validateGameRules';
import { withTurnDeadline } from './turnFlow';

export const SAVED_ROUND_KEY = 'uno.localRound.v1';

function isCard(card: Card): boolean {
  return (
    !!card &&
    typeof card.id === 'string' &&
    card.id.length > 0 &&
    card.id.length <= 100 &&
    (card.color === 'wild'
      ? ['wild', 'wild4', 'shuffle'].includes(card.value)
      : STANDARD_COLORS.includes(card.color) &&
        [...NUMBER_VALUES, ...ACTION_VALUES].includes(card.value) &&
        !['wild', 'wild4', 'shuffle'].includes(card.value))
  );
}

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
      !STANDARD_COLORS.includes(game.activeColor) ||
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
          player.hand.length === 0,
      )
    )
      return null;

    const cards: Card[] = [
      ...game.drawPile,
      ...game.discardPile,
      ...players.flatMap((player) => player.hand),
    ];
    const expectedSize =
      108 + (rules.allowDiscardAll ? 8 : 0) + (rules.allowShuffleCard ? 4 : 0);
    if (
      cards.length !== expectedSize ||
      !cards.every(isCard) ||
      new Set(cards.map((card) => card.id)).size !== cards.length
    )
      return null;
    const counts = new Map<string, number>();
    for (const card of cards) {
      const key = `${card.color}:${card.value}`;
      const count = (counts.get(key) ?? 0) + 1;
      const expected =
        card.color === 'wild'
          ? card.value === 'shuffle' && !rules.allowShuffleCard
            ? 0
            : 4
          : card.value === 'discardAll' && !rules.allowDiscardAll
            ? 0
            : card.value === '0'
              ? 1
              : 2;
      if (count > expected) return null;
      counts.set(key, count);
    }
    const top: Card = game.discardPile.at(-1);
    if (top.color !== 'wild' && top.color !== game.activeColor) return null;

    // Transient presentation and an expired wall clock must not replay on return.
    return {
      players,
      rules,
      drawPile: game.drawPile,
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
  return withTurnDeadline(null, game, now);
}
