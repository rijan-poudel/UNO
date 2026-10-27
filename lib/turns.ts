// ============================================================
// lib/turns.ts
// Turn-order management helpers.
// These are kept separate so both game actions and the UI can
// query turn information without pulling in action side-effects.
// ============================================================

import type { GameState } from '../types/game';

/**
 * Returns the player index that is `steps` turns away from the current player,
 * respecting the current direction of play and wrapping around the player array.
 *
 * @param state   Current game state.
 * @param steps   How many seats to advance. Default is 1 (the very next player).
 *                Pass 2 to skip one seat (e.g., after a Skip or 2-player Reverse).
 */
export function getNextPlayerIndex(state: GameState, steps = 1): number {
  const { players, currentPlayerIndex, direction } = state;
  const n = players.length;
  if (steps === 0) return currentPlayerIndex;

  if (!players.some((p) => p.eliminated)) {
    return (((currentPlayerIndex + direction * steps) % n) + n) % n;
  }

  const activeCount = players.filter((p) => !p.eliminated).length;
  if (activeCount === 0) return currentPlayerIndex;

  let current = currentPlayerIndex;
  let remainingSteps = Math.abs(steps);
  const stepDirection = direction * Math.sign(steps);
  while (remainingSteps > 0) {
    current = (((current + stepDirection) % n) + n) % n;
    if (!players[current].eliminated) remainingSteps--;
  }
  return current;
}

/**
 * Returns a new GameState with `currentPlayerIndex` advanced by `steps` seats
 * and `turnCount` incremented by 1.
 *
 * Does NOT apply any card effects — that is the responsibility of the callers
 * in gameActions.ts.
 */
export function advanceTurn(state: GameState, steps = 1): GameState {
  return {
    ...state,
    currentPlayerIndex: getNextPlayerIndex(state, steps),
    turnCount: state.turnCount + 1,
    drawnThisTurn: false,
  };
}
