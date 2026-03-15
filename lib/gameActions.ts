// ============================================================
// lib/gameActions.ts
// All player actions as pure state-transition functions.
//
// Design principles:
//   - Every function accepts a GameState and returns a NEW GameState.
//   - No mutation of any input object.
//   - Throw on illegal inputs so callers can surface errors cleanly.
//   - State is always left in a valid, actionable shape.
// ============================================================

import type { GameState, Player, LastAction } from '../types/game';
import type { Card, CardColor } from '../types/card';
import { isWildCard } from '../types/card';
import { canPlayCard } from './gameRules';
import { advanceTurn } from './turns';
import { shuffleDeck } from './deck';

// ── Internal utilities ────────────────────────────────────────────────────────

/** Remove one card by id from a hand array. Returns the card and the new hand. */
function removeCardById(
  hand: Card[],
  cardId: string,
): { card: Card; newHand: Card[] } {
  const index = hand.findIndex((c) => c.id === cardId);
  if (index === -1) {
    throw new Error(`Card "${cardId}" not found in hand.`);
  }
  const card = hand[index];
  const newHand = hand.filter((_, i) => i !== index);
  return { card, newHand };
}

/**
 * When the draw pile is empty, shuffle the discard pile (minus the top card)
 * back into the draw pile. If the discard pile also has only one card, the
 * game is at an impasse — return state unchanged and let callers handle it.
 */
function replenishDrawPileIfNeeded(state: GameState): GameState {
  if (state.drawPile.length > 0) return state;
  if (state.discardPile.length <= 1) return state; // No cards to recycle

  const topCard = state.discardPile[state.discardPile.length - 1];
  const toReshuffle = state.discardPile.slice(0, -1);
  const newDrawPile = shuffleDeck(toReshuffle);

  return {
    ...state,
    drawPile: newDrawPile,
    discardPile: [topCard],
  };
}

/**
 * Draw `count` cards from the draw pile, reshuffling as needed.
 * Returns the drawn cards and the updated state (with draw pile shrunk).
 */
function drawCardsFromPile(
  state: GameState,
  count: number,
): { drawn: Card[]; state: GameState } {
  const drawn: Card[] = [];
  let current = state;

  for (let i = 0; i < count; i++) {
    current = replenishDrawPileIfNeeded(current);
    if (current.drawPile.length === 0) break; // Deck truly exhausted

    const topCard = current.drawPile[current.drawPile.length - 1];
    drawn.push(topCard);
    current = { ...current, drawPile: current.drawPile.slice(0, -1) };
  }

  return { drawn, state: current };
}

/** Update a single player immutably within the players array. */
function updatePlayer(
  state: GameState,
  playerIndex: number,
  changes: Partial<Player>,
): GameState {
  return {
    ...state,
    players: state.players.map((p, i) =>
      i === playerIndex ? { ...p, ...changes } : p,
    ),
  };
}

function shuffleHandsStartingFrom(
  state: GameState,
  startIndex: number,
): GameState {
  const counts = state.players.map((player) => player.hand.length);
  const pooled = shuffleDeck(state.players.flatMap((player) => player.hand));
  const totalToDeal = pooled.length;

  const dealtHands: Card[][] = state.players.map(() => []);
  const remainingBySeat = [...counts];
  let cursor = 0;
  let seat = startIndex;

  while (cursor < totalToDeal) {
    if (remainingBySeat[seat] > 0) {
      dealtHands[seat].push(pooled[cursor]);
      remainingBySeat[seat] -= 1;
      cursor += 1;
    }
    seat = (seat + state.direction + state.players.length) % state.players.length;
  }

  return {
    ...state,
    players: state.players.map((player, index) => ({
      ...player,
      hand: dealtHands[index],
      saidUno: false,
    })),
  };
}

// ── Card effect resolution ────────────────────────────────────────────────────

/**
 * Apply the game-effect of a just-played card and advance the turn.
 * Called by playCard() after the card has already been removed from hand
 * and placed on the discard pile.
 */
function resolveCardEffect(
  state: GameState,
  card: Card,
  playedByIndex: number,
  chosenColor?: CardColor,
): GameState {
  const { rules, players } = state;
  const playerCount = players.length;

  switch (card.value) {

    // ── Skip ────────────────────────────────────────────────────────────────
    case 'skip': {
      // Skip the very next player in the current direction.
      return advanceTurn(state, 2);
    }

    // ── Reverse ─────────────────────────────────────────────────────────────
    case 'reverse': {
      const flipped: 1 | -1 = state.direction === 1 ? -1 : 1;
      const stateFlipped = { ...state, direction: flipped };

      if (playerCount === 2 && rules.reverseActsAsSkipInTwoPlayer) {
        // In a 2-player game the reverse just skips the opponent — the same
        // player effectively plays again (skip semantics).
        return advanceTurn(stateFlipped, 2);
      }

      // In 3+ player games, reverse changes direction and passes the turn.
      return advanceTurn(stateFlipped, 1);
    }

    // ── Draw 2 ──────────────────────────────────────────────────────────────
    case 'draw2': {
      // Add 2 to the pending draw counter and move to the next player.
      // The next player must either stack (if rule enabled) or draw the total.
      const newPending = state.pendingDraw + 2;
      return advanceTurn({
        ...state,
        pendingDraw: newPending,
        pendingDrawType: 'draw2',
      });
    }

    // ── Wild 4 ──────────────────────────────────────────────────────────────
    case 'wild4': {
      // Add 4 to the pending draw counter and move to the next player.
      const newPending = state.pendingDraw + 4;
      return advanceTurn({
        ...state,
        pendingDraw: newPending,
        pendingDrawType: 'wild4',
        activeColor: chosenColor!, // chosenColor is validated before this runs
      });
    }

    // ── Wild ────────────────────────────────────────────────────────────────
    case 'wild': {
      // No draw penalty — just change the active color and pass the turn.
      return advanceTurn({
        ...state,
        activeColor: chosenColor!,
      });
    }

    case 'shuffle': {
      return advanceTurn({
        ...state,
        activeColor: chosenColor!,
      });
    }

    // ── Number cards ────────────────────────────────────────────────────────
    default: {
      // No special effect — advance to the next player normally.
      return advanceTurn(state);
    }
  }
}

// ── Public action functions ───────────────────────────────────────────────────

/**
 * Play a card from the current player's hand.
 *
 * @param state        The current game state.
 * @param playerIndex  Must equal state.currentPlayerIndex.
 * @param cardId       The id of the card to play.
 * @param chosenColor  Required when playing a wild or wild4; ignored otherwise.
 * @returns A new GameState after the play (and any triggered effects) resolves.
 */
export function playCard(
  state: GameState,
  playerIndex: number,
  cardId: string,
  chosenColor?: CardColor,
): GameState {
  if (state.winnerId) throw new Error('Game is already over.');

  const player = state.players[playerIndex];

  // Remove the card from hand — throws if not found.
  const { card, newHand } = removeCardById(player.hand, cardId);

  // Validate legality (also checks turn ownership).
  if (!canPlayCard(card, state, playerIndex)) {
    throw new Error(
      `Card "${card.color} ${card.value}" cannot be played in the current state.`,
    );
  }

  // Wild cards require a color choice.
  if (isWildCard(card) && (chosenColor === undefined || chosenColor === 'wild')) {
    throw new Error('You must choose a non-wild color when playing a wild or wild4 card.');
  }

  // Determine new active color (resolveCardEffect may override this for wild4).
  const newActiveColor: CardColor =
    isWildCard(card) ? chosenColor! : card.color;

  // When a player plays down to 1 card, reset their UNO declaration flag so
  // they need to declare UNO again (they didn't on this turn yet).
  // When they play down to 0, flag is irrelevant.
  const updatedPlayer: Player = {
    ...player,
    hand: newHand,
    // Playing a card resets the UNO flag unless they still have 1 card AND already said it.
    saidUno: newHand.length === 1 ? player.saidUno : false,
  };

  const lastAction: LastAction = {
    type: 'play',
    playerId: player.id,
    card,
    chosenColor,
  };

  let discardAllCount = 0;
  let postPlayHand = [...newHand];
  const discardExtra: Card[] = [];

  const isDiscardAllCard = card.value === 'discardAll' && card.color !== 'wild';
  if (state.rules.allowDiscardAll && isDiscardAllCard) {
    const kept: Card[] = [];
    for (const handCard of postPlayHand) {
      if (handCard.color === card.color) {
        discardExtra.push(handCard);
      } else {
        kept.push(handCard);
      }
    }
    postPlayHand = kept;
    discardAllCount = discardExtra.length;
  }

  const postPlayPlayer: Player = {
    ...updatedPlayer,
    hand: postPlayHand,
    saidUno: postPlayHand.length === 1 ? updatedPlayer.saidUno : false,
  };

  if (discardAllCount > 0) {
    lastAction.discardAllCount = discardAllCount;
  }

  // Apply the card to the discard pile and update active color.
  let newState: GameState = {
    ...state,
    players: state.players.map((p, i) => (i === playerIndex ? postPlayPlayer : p)),
    discardPile: [...state.discardPile, card, ...discardExtra],
    activeColor: newActiveColor,
    // Clear pending draw only for non-draw cards; draw cards add to it in resolveCardEffect.
    pendingDraw: card.value === 'draw2' || card.value === 'wild4' ? state.pendingDraw : 0,
    pendingDrawType: card.value === 'draw2' || card.value === 'wild4'
      ? state.pendingDrawType
      : null,
    lastAction,
  };

  // ── Win condition ────────────────────────────────────────────────────────
  if (postPlayHand.length === 0) {
    // Player is out of cards — they win! Turn is not advanced.
    return { ...newState, winnerId: player.id };
  }

  if (state.rules.allowShuffleCard && card.value === 'shuffle') {
    const nextSeat = (playerIndex + state.direction + state.players.length) % state.players.length;
    newState = shuffleHandsStartingFrom(newState, nextSeat);
    newState = {
      ...newState,
      lastAction: {
        ...(newState.lastAction.type === 'play' ? newState.lastAction : lastAction),
        shuffledHands: true,
      },
    };
  }

  // ── Apply card effects and advance turn ──────────────────────────────────
  newState = resolveCardEffect(newState, card, playerIndex, chosenColor);

  return newState;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw exactly one card from the draw pile (voluntary draw when no playable card).
 * The player does NOT automatically play the drawn card — the caller must
 * subsequently call passTurn() (or playCard if the drawn card is playable).
 *
 * Throws if there is a pendingDraw greater than zero (use drawRequiredCards instead).
 */
export function drawOneCard(
  state: GameState,
  playerIndex: number,
): GameState {
  if (state.winnerId) throw new Error('Game is already over.');
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error(`It is not player ${playerIndex}'s turn.`);
  }
  if (state.pendingDraw > 0) {
    throw new Error(
      `Player has ${state.pendingDraw} forced cards to draw. Call drawRequiredCards() instead.`,
    );
  }

  const player = state.players[playerIndex];
  const { drawn, state: afterDraw } = drawCardsFromPile(state, 1);

  if (drawn.length === 0) {
    // Edge case: no cards available anywhere. Pass the turn.
    return advanceTurn(
      { ...state, lastAction: { type: 'draw', playerId: player.id, count: 0 } },
    );
  }

  const newHand = [...player.hand, ...drawn];

  let updated = updatePlayer(afterDraw, playerIndex, { hand: newHand });
  updated = {
    ...updated,
    lastAction: { type: 'draw', playerId: player.id, count: drawn.length },
  };

  // TODO: if rules.drawUntilPlayable is true, check whether the drawn card is
  // playable. If not, recursively draw again until one is found or the deck
  // is exhausted. Currently draws exactly one card regardless of playability.

  return updated;
  // NOTE: The caller is responsible for calling passTurn() (or playCard())
  // once they decide what to do with the drawn card.
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Force the current player to draw all cards accumulated in pendingDraw
 * (triggered by an uncontested draw2 or wild4).
 * Clears pendingDraw/pendingDrawType and advances the turn.
 */
export function drawRequiredCards(
  state: GameState,
  playerIndex: number,
): GameState {
  if (state.winnerId) throw new Error('Game is already over.');
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error(`It is not player ${playerIndex}'s turn.`);
  }
  if (state.pendingDraw === 0) {
    throw new Error('No pending draw. Use drawOneCard() instead.');
  }

  const player = state.players[playerIndex];
  const { drawn, state: afterDraw } = drawCardsFromPile(state, state.pendingDraw);

  const newHand = [...player.hand, ...drawn];

  let updated = updatePlayer(afterDraw, playerIndex, { hand: newHand });
  updated = {
    ...updated,
    pendingDraw: 0,
    pendingDrawType: null,
    lastAction: { type: 'draw', playerId: player.id, count: drawn.length },
  };

  // Advance the turn after the forced draw resolves.
  return advanceTurn(updated);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pass the turn without playing a card.
 * Only valid after the player has already drawn their one voluntary card
 * (drawOneCard) and chosen not to play it.
 *
 * In most implementations the UI prevents calling passTurn() before drawing.
 * Here we trust the caller to enforce that sequencing.
 */
export function passTurn(
  state: GameState,
  playerIndex: number,
): GameState {
  if (state.winnerId) throw new Error('Game is already over.');
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error(`It is not player ${playerIndex}'s turn.`);
  }

  const player = state.players[playerIndex];
  const withAction: GameState = {
    ...state,
    lastAction: { type: 'pass', playerId: player.id },
  };

  return advanceTurn(withAction);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Declare "UNO!".
 *
 * This engine allows declaration when the player has 2 cards (pre-declare)
 * or 1 card (standard declare). Declaring at 2 lets players press UNO before
 * a play that will leave them with a single card.
 * If mustDeclareUno is true and the player fails to declare before an opponent
 * calls them out, they receive a penalty via callOutUno().
 *
 * Can be called by any player at any time (spectator declarations are ignored
 * in practice — callers only trigger this for the relevant player).
 */
export function declareUno(
  state: GameState,
  playerIndex: number,
): GameState {
  const player = state.players[playerIndex];

  if (player.hand.length > 2 || player.hand.length < 1) {
    // Only allow UNO declaration at 2 cards (pre-declare) or 1 card (standard).
    return state;
  }

  const updated = updatePlayer(state, playerIndex, { saidUno: true });
  return {
    ...updated,
    lastAction: { type: 'declareUno', playerId: player.id },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * One player (callerIndex) accuses another (targetIndex) of failing to declare UNO.
 *
 * Valid only when:
 *   - The target player has exactly 1 card.
 *   - The target player has NOT declared UNO (saidUno === false).
 *
 * On a valid call-out, the target draws 2 penalty cards.
 * On an invalid call-out, the caller draws 2 penalty cards (optional — disabled here;
 * add a `penaliseFalseCaller` rule flag to enable).
 */
export function callOutUno(
  state: GameState,
  callerIndex: number,
  targetIndex: number,
): GameState {
  const target = state.players[targetIndex];
  const caller = state.players[callerIndex];

  // Determine whether the call-out is valid.
  const isValidCallOut = target.hand.length === 1 && !target.saidUno;

  if (!isValidCallOut) {
    // Invalid call-out — no penalty applied in this version.
    // TODO: Optionally penalise the caller (add penaliseFalseCaller rule).
    return state;
  }

  const penalty = 2;
  const { drawn, state: afterDraw } = drawCardsFromPile(state, penalty);

  const updatedTarget: Partial<Player> = {
    hand: [...target.hand, ...drawn],
    saidUno: false, // reset flag after penalty
  };

  const updated = updatePlayer(afterDraw, targetIndex, updatedTarget);
  return {
    ...updated,
    lastAction: {
      type: 'callOut',
      callerId: caller.id,
      targetId: target.id,
      penalty,
    },
  };
}
