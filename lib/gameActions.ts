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
import { isWildCard, isDrawCard, STANDARD_COLORS } from '../types/card';
import {
  canDeclareUno,
  canJumpInPlay,
  canPlayCard,
  getCardPlayChoices,
} from './gameRules';
import { advanceTurn, getNextPlayerIndex } from './turns';
import { shuffleDeck } from './deck';

const MAX_DRAW_UNTIL_PLAYABLE = 200;

export interface PlayOptions {
  secondCardId?: string;
  declareUno?: boolean;
  targetPlayerId?: string;
}

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
  if (state.discardPile.length <= 1 && !state.outOfPlayPile?.length)
    return state;

  const topCard = state.discardPile[state.discardPile.length - 1];
  const toReshuffle = [
    ...state.discardPile.slice(0, -1),
    ...(state.outOfPlayPile ?? []),
  ];
  const newDrawPile = shuffleDeck(toReshuffle);

  return {
    ...state,
    drawPile: newDrawPile,
    discardPile: [topCard],
    outOfPlayPile: [],
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
  const originalHandsSignature = state.players.map((player) =>
    player.hand
      .map((card) => card.id)
      .sort()
      .join('|'),
  );

  let dealtHands: Card[][] = state.players.map(() => []);

  const dealFromPooled = (pooled: Card[]): Card[][] => {
    const nextHands: Card[][] = state.players.map(() => []);
    let seat = startIndex;
    for (const card of pooled) {
      nextHands[seat].push(card);
      seat = getNextPlayerIndex({ ...state, currentPlayerIndex: seat });
    }
    return nextHands;
  };

  const handsChanged = (candidateHands: Card[][]): boolean =>
    candidateHands.some(
      (hand, index) =>
        hand
          .map((card) => card.id)
          .sort()
          .join('|') !== originalHandsSignature[index],
    );

  // True shuffle-hands behavior: pool every hand and deal one-by-one in turn order
  // starting from the next player after the shuffle card is played.
  // Retry a few times if RNG happens to produce effectively unchanged hands.
  const MAX_SHUFFLE_RETRIES = 5;
  for (let attempt = 0; attempt <= MAX_SHUFFLE_RETRIES; attempt += 1) {
    const pooled = shuffleDeck(state.players.flatMap((player) => player.hand));
    dealtHands = dealFromPooled(pooled);
    if (handsChanged(dealtHands)) {
      break;
    }
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

function getEffectiveTargetIndex(
  state: GameState,
  playedByIndex: number,
  targetPlayerId?: string,
): number {
  const index = state.players.findIndex(
    (player) => player.id === targetPlayerId,
  );
  if (index < 0 || index === playedByIndex || state.players[index].eliminated) {
    throw new Error('Choose another active player.');
  }
  return index;
}

function swapHands(
  state: GameState,
  indexA: number,
  indexB: number,
): GameState {
  const handA = state.players[indexA].hand;
  const handB = state.players[indexB].hand;
  return {
    ...state,
    players: state.players.map((p, i) => {
      if (i === indexA) return { ...p, hand: handB, saidUno: false };
      if (i === indexB) return { ...p, hand: handA, saidUno: false };
      return p;
    }),
  };
}

function rotateHands(state: GameState, direction: 1 | -1): GameState {
  const active = state.players
    .map((p, i) => (p.eliminated ? -1 : i))
    .filter((i) => i >= 0);
  return {
    ...state,
    players: state.players.map((p, i) => {
      if (p.eliminated) return p;
      const position = active.indexOf(i);
      const fromIndex =
        active[(position - direction + active.length) % active.length];
      return { ...p, hand: state.players[fromIndex].hand, saidUno: false };
    }),
  };
}

export function applyMercyRule(state: GameState): GameState {
  if (
    !state.rules.eliminationHandLimit ||
    state.rules.eliminationHandLimit <= 0
  ) {
    return state;
  }
  const limit = state.rules.eliminationHandLimit;
  let playersChanged = false;
  const outOfPlayPile = [...(state.outOfPlayPile ?? [])];
  const players = state.players.map((p) => {
    if (!p.eliminated && p.hand.length >= limit) {
      playersChanged = true;
      outOfPlayPile.push(...p.hand);
      return { ...p, hand: [], eliminated: true };
    }
    return p;
  });
  if (!playersChanged) return state;

  const activePlayers = players.filter((p) => !p.eliminated);
  if (activePlayers.length <= 1) {
    const winnerId = activePlayers[0]?.id ?? null;
    return { ...state, players, outOfPlayPile, winnerId };
  }
  const updated = { ...state, players, outOfPlayPile };
  return players[state.currentPlayerIndex].eliminated
    ? advanceTurn(updated)
    : updated;
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
  targetPlayerId?: string,
): GameState {
  const { rules, players } = state;
  const playerCount = players.filter((player) => !player.eliminated).length;

  const requireChosenColor = (): CardColor => {
    if (rules.gameMode === 'all_wild') {
      return chosenColor && chosenColor !== 'wild' ? chosenColor : 'red';
    }
    if (!chosenColor || chosenColor === 'wild') {
      throw new Error('A valid non-wild color must be chosen for wild cards.');
    }
    return chosenColor;
  };

  switch (card.value) {
    // ── Skip ────────────────────────────────────────────────────────────────
    case 'skip': {
      return advanceTurn(state, 2);
    }

    case 'skipEveryone': {
      // Skips all other players so current player plays again
      return advanceTurn(state, 0);
    }

    case 'wildSkip2': {
      // Skips the next two players
      return advanceTurn(state, 3);
    }

    // ── Reverse ─────────────────────────────────────────────────────────────
    case 'reverse': {
      const flipped: 1 | -1 = state.direction === 1 ? -1 : 1;
      const stateFlipped = { ...state, direction: flipped };

      if (playerCount === 2 && rules.reverseActsAsSkipInTwoPlayer) {
        return advanceTurn(stateFlipped, 2);
      }
      return advanceTurn(stateFlipped, 1);
    }

    case 'wildReverseDraw4': {
      const flipped: 1 | -1 = state.direction === 1 ? -1 : 1;
      const newPending = state.pendingDraw + 4;
      const stateFlipped = {
        ...state,
        direction: flipped,
        pendingDraw: newPending,
        pendingDrawType: 'wild4' as const,
        activeColor: requireChosenColor(),
      };
      return advanceTurn(stateFlipped, playerCount === 2 ? 2 : 1);
    }

    // ── Draw Cards ──────────────────────────────────────────────────────────
    case 'draw2': {
      const newPending = state.pendingDraw + 2;
      return advanceTurn({
        ...state,
        pendingDraw: newPending,
        pendingDrawType: 'draw2',
      });
    }

    case 'draw4': {
      const newPending = state.pendingDraw + 4;
      return advanceTurn({
        ...state,
        pendingDraw: newPending,
        pendingDrawType: 'wild4',
      });
    }

    case 'wild4': {
      const newPending = state.pendingDraw + 4;
      return advanceTurn({
        ...state,
        pendingDraw: newPending,
        pendingDrawType: 'wild4',
        activeColor: requireChosenColor(),
      });
    }

    case 'wildDraw6': {
      const newPending = state.pendingDraw + 6;
      return advanceTurn({
        ...state,
        pendingDraw: newPending,
        pendingDrawType: 'wild4',
        activeColor: requireChosenColor(),
      });
    }

    case 'wildDraw10': {
      const newPending = state.pendingDraw + 10;
      return advanceTurn({
        ...state,
        pendingDraw: newPending,
        pendingDrawType: 'wild4',
        activeColor: requireChosenColor(),
      });
    }

    // ── Wild ────────────────────────────────────────────────────────────────
    case 'wild': {
      return advanceTurn({
        ...state,
        activeColor:
          rules.gameMode === 'all_wild'
            ? state.activeColor
            : requireChosenColor(),
      });
    }

    case 'wildColorRoulette': {
      const next = advanceTurn(state);
      return {
        ...next,
        pendingRoulette: { playerId: next.players[next.currentPlayerIndex].id },
      };
    }

    case 'wildTargetDraw2': {
      const targetIdx = getEffectiveTargetIndex(
        state,
        playedByIndex,
        targetPlayerId,
      );
      const { drawn, state: afterDraw } = drawCardsFromPile(state, 2);
      const target = afterDraw.players[targetIdx];
      let updated = updatePlayer(afterDraw, targetIdx, {
        hand: [...target.hand, ...drawn],
        saidUno: false,
      });
      updated = applyMercyRule(updated);
      if (updated.winnerId) return updated;
      return advanceTurn(updated, 1);
    }

    case 'wildForcedSwap': {
      const targetIdx = getEffectiveTargetIndex(
        state,
        playedByIndex,
        targetPlayerId,
      );
      const swapped = swapHands(state, playedByIndex, targetIdx);
      return advanceTurn(swapped, 1);
    }

    case '7': {
      if (rules.sevenZero) {
        const targetIdx = getEffectiveTargetIndex(
          state,
          playedByIndex,
          targetPlayerId,
        );
        const swapped = swapHands(state, playedByIndex, targetIdx);
        return advanceTurn(swapped, 1);
      }
      return advanceTurn(state);
    }

    case '0': {
      if (rules.sevenZero) {
        const rotated = rotateHands(state, state.direction);
        return advanceTurn(rotated, 1);
      }
      return advanceTurn(state);
    }

    case 'shuffle': {
      let result = advanceTurn({
        ...state,
        activeColor: requireChosenColor(),
      });
      const nextSeat =
        (playedByIndex + state.direction + state.players.length) %
        state.players.length;
      result = shuffleHandsStartingFrom(result, nextSeat);
      const prevAction = result.lastAction;
      return {
        ...result,
        lastAction:
          prevAction.type === 'play'
            ? { ...prevAction, shuffledHands: true }
            : prevAction,
      };
    }

    // ── Number cards ────────────────────────────────────────────────────────
    default: {
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
  options: PlayOptions = {},
): GameState {
  if (state.winnerId) throw new Error('Game is already over.');
  if (state.pendingRoulette)
    throw new Error('Choose a color for Color Roulette first.');

  const isJumpIn = playerIndex !== state.currentPlayerIndex;
  const effectiveState = isJumpIn
    ? { ...state, currentPlayerIndex: playerIndex }
    : state;

  const player = state.players[playerIndex];
  if (!player || player.eliminated) throw new Error('Player is not active.');
  if (chosenColor !== undefined && !STANDARD_COLORS.includes(chosenColor))
    throw new Error('Choose a valid card color.');

  // Remove the card from hand — throws if not found.
  const { card, newHand } = removeCardById(player.hand, cardId);
  if (
    options.declareUno !== undefined &&
    typeof options.declareUno !== 'boolean'
  ) {
    throw new Error('UNO declaration must be a boolean.');
  }
  const choice = getCardPlayChoices(state, playerIndex, card).find(
    (entry) => entry.secondCardId === options.secondCardId,
  );
  if (!choice)
    throw new Error(
      'That card or matching-number pair cannot be played in the current state.',
    );
  if (
    options.declareUno &&
    (!state.rules.mustDeclareUno || choice.remaining !== 1)
  ) {
    throw new Error('Call UNO with a play that leaves exactly one card.');
  }
  const second = options.secondCardId ? choice.cards[1] : undefined;

  // Validate legality (also checks turn ownership).
  if (!canPlayCard(card, effectiveState, playerIndex)) {
    throw new Error(
      `Card "${card.color} ${card.value}" cannot be played in the current state.`,
    );
  }

  if (isJumpIn && !canJumpInPlay(card, state)) {
    throw new Error(
      'Jump-in is only allowed with an exact match to the top discard.',
    );
  }

  // Wild cards require a color choice, unless in All Wild mode or action cards with built-in effects.
  if (
    isWildCard(card) &&
    state.rules.gameMode !== 'all_wild' &&
    card.value !== 'wildColorRoulette' &&
    card.value !== 'wildSkip2' &&
    card.value !== 'wildTargetDraw2' &&
    card.value !== 'wildForcedSwap' &&
    !(['red', 'yellow', 'green', 'blue'] as readonly unknown[]).includes(
      chosenColor,
    )
  ) {
    throw new Error(
      'You must choose a non-wild color when playing a wild or wild4 card.',
    );
  }

  // Determine new active color (resolveCardEffect may override this for wild4).
  const newActiveColor: CardColor = isWildCard(card)
    ? (chosenColor ??
      (state.rules.gameMode === 'all_wild' || card.value === 'wildColorRoulette'
        ? (state.activeColor ?? 'red')
        : card.color))
    : (second ?? card).color;

  const lastAction: LastAction = {
    type: 'play',
    playerId: player.id,
    card: second ?? card,
    chosenColor,
    ...(second ? { playedCards: [card, second] } : {}),
    ...(options.declareUno ? { declaredUno: true } : {}),
    ...(options.targetPlayerId ? { targetId: options.targetPlayerId } : {}),
  };

  let discardAllCount = 0;
  let postPlayHand = newHand.filter((entry) => entry.id !== second?.id);
  const discardExtra: Card[] = [];

  const isDiscardAllCard = card.value === 'discardAll' && card.color !== 'wild';
  if (effectiveState.rules.allowDiscardAll && isDiscardAllCard) {
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
    ...player,
    hand: postPlayHand,
    saidUno:
      postPlayHand.length === 1
        ? player.saidUno || options.declareUno === true
        : false,
  };

  if (discardAllCount > 0) {
    lastAction.discardAllCount = discardAllCount;
  }

  // Apply the card to the discard pile and update active color.
  let newState: GameState = {
    ...effectiveState,
    players: effectiveState.players.map((p, i) =>
      i === playerIndex ? postPlayPlayer : p,
    ),
    discardPile: [
      ...effectiveState.discardPile,
      ...discardExtra,
      card,
      ...(second ? [second] : []),
    ],
    activeColor: newActiveColor,
    // Clear pending draw only for non-draw cards; draw cards add to it in resolveCardEffect.
    pendingDraw: isDrawCard(card) ? effectiveState.pendingDraw : 0,
    pendingDrawType: isDrawCard(card) ? effectiveState.pendingDrawType : null,
    lastAction,
  };

  // ── Win condition ────────────────────────────────────────────────────────
  if (
    postPlayHand.length === 0 &&
    !(state.rules.sevenZero && (card.value === '7' || card.value === '0')) &&
    card.value !== 'wildForcedSwap' &&
    card.value !== 'shuffle'
  ) {
    // Player is out of cards — they win! Turn is not advanced.
    return { ...newState, winnerId: player.id };
  }

  // ── Apply card effects and advance turn ──────────────────────────────────
  newState = resolveCardEffect(
    newState,
    card,
    playerIndex,
    chosenColor,
    options.targetPlayerId,
  );
  newState = applyMercyRule(newState);
  const empty = newState.players.find(
    (entry) => !entry.eliminated && entry.hand.length === 0,
  );
  return empty ? { ...newState, winnerId: empty.id } : newState;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw exactly one card from the draw pile (voluntary draw when no playable card).
 * With drawUntilPlayable enabled, this draws until a playable card appears or
 * the deck is exhausted.
 *
 * Throws if there is a pendingDraw greater than zero (use drawRequiredCards instead).
 */
export function drawOneCard(state: GameState, playerIndex: number): GameState {
  if (state.winnerId) throw new Error('Game is already over.');
  if (state.pendingRoulette)
    throw new Error('Choose a color for Color Roulette first.');
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error(`It is not player ${playerIndex}'s turn.`);
  }
  if (state.pendingDraw > 0) {
    throw new Error(
      `Player has ${state.pendingDraw} forced cards to draw. Call drawRequiredCards() instead.`,
    );
  }

  const player = state.players[playerIndex];
  if (!player) throw new Error('Player not found.');
  if (state.drawnThisTurn)
    throw new Error('You have already drawn. Play a card or pass.');
  const drawn: Card[] = [];
  let afterDraw = state;

  const drawOnce = () => {
    const result = drawCardsFromPile(afterDraw, 1);
    afterDraw = result.state;
    if (result.drawn.length > 0) {
      drawn.push(result.drawn[0]);
    }
  };

  drawOnce();

  if (state.rules.drawUntilPlayable) {
    let draws = 0;
    while (drawn.length > 0 && draws < MAX_DRAW_UNTIL_PLAYABLE) {
      if (
        state.rules.eliminationHandLimit > 0 &&
        player.hand.length + drawn.length >= state.rules.eliminationHandLimit
      )
        break;
      draws++;
      const latestCard = drawn[drawn.length - 1];
      if (
        canPlayCard(
          latestCard,
          updatePlayer(afterDraw, playerIndex, {
            hand: [...player.hand, ...drawn],
          }),
          playerIndex,
        )
      ) {
        break;
      }
      const beforeCount = drawn.length;
      drawOnce();
      if (drawn.length === beforeCount) {
        break;
      }
    }
  }

  if (drawn.length === 0) {
    // Edge case: no cards available anywhere. Pass the turn.
    return advanceTurn({
      ...state,
      lastAction: { type: 'draw', playerId: player.id, count: 0 },
    });
  }

  const newHand = [...player.hand, ...drawn];

  let updated = updatePlayer(afterDraw, playerIndex, {
    hand: newHand,
    saidUno: false,
  });
  updated = {
    ...updated,
    lastAction: { type: 'draw', playerId: player.id, count: drawn.length },
    drawnThisTurn: true,
  };

  return applyMercyRule(updated);
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
  if (state.pendingRoulette)
    throw new Error('Choose a color for Color Roulette first.');
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error(`It is not player ${playerIndex}'s turn.`);
  }
  if (state.pendingDraw === 0) {
    throw new Error('No pending draw. Use drawOneCard() instead.');
  }

  const player = state.players[playerIndex];
  if (!player) throw new Error('Player not found.');
  const { drawn, state: afterDraw } = drawCardsFromPile(
    state,
    state.pendingDraw,
  );

  const newHand = [...player.hand, ...drawn];

  let updated = updatePlayer(afterDraw, playerIndex, {
    hand: newHand,
    saidUno: false,
  });
  updated = {
    ...updated,
    pendingDraw: 0,
    pendingDrawType: null,
    lastAction: { type: 'draw', playerId: player.id, count: drawn.length },
  };

  // Advance the turn after the forced draw resolves.
  return applyMercyRule(advanceTurn(updated));
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pass the turn without playing a card.
 * Only valid after the player has already drawn their one voluntary card
 * (drawOneCard) and chosen not to play it.
 *
 * The snapshot tracks voluntary draws so this is enforced for every caller.
 */
export function passTurn(state: GameState, playerIndex: number): GameState {
  if (state.winnerId) throw new Error('Game is already over.');
  if (state.pendingRoulette)
    throw new Error('Choose a color for Color Roulette first.');
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error(`It is not player ${playerIndex}'s turn.`);
  }

  if (state.pendingDraw > 0 || !state.drawnThisTurn) {
    throw new Error('Draw before passing your turn.');
  }
  if (
    state.rules.gameMode === 'no_mercy' &&
    state.rules.drawUntilPlayable &&
    state.players[playerIndex].hand.some((card) =>
      canPlayCard(card, state, playerIndex),
    )
  ) {
    throw new Error('Play the card you just drew.');
  }

  const player = state.players[playerIndex];
  if (!player) throw new Error('Player not found.');
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
 * Allows declaration at one or two cards, or before a legal pair / Discard All
 * that leaves one card. Plays can also declare atomically via PlayOptions.
 * If mustDeclareUno is true and the player fails to declare before an opponent
 * calls them out, they receive a penalty via callOutUno().
 *
 * Can be called by any player at any time (spectator declarations are ignored
 * in practice — callers only trigger this for the relevant player).
 */
export function declareUno(state: GameState, playerIndex: number): GameState {
  if (state.winnerId) throw new Error('Game is already over.');
  const player = state.players[playerIndex];
  if (!player) throw new Error('Player not found.');

  if (!canDeclareUno(state, playerIndex)) return state;

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
 * On an invalid call-out, the caller optionally draws 2 cards when
 * rules.penalizeFalseCallOut is enabled.
 */
export function callOutUno(
  state: GameState,
  callerIndex: number,
  targetIndex: number,
): GameState {
  if (!state.rules.mustDeclareUno) return state;
  if (state.winnerId) throw new Error('Game is already over.');
  const target = state.players[targetIndex];
  const caller = state.players[callerIndex];
  if (!target || !caller) throw new Error('Player not found.');
  if (callerIndex === targetIndex)
    throw new Error('You cannot call yourself out.');
  if (caller.eliminated || target.eliminated)
    throw new Error(
      'Knocked-out players cannot make or receive UNO call-outs.',
    );

  // Determine whether the call-out is valid.
  const isValidCallOut = target.hand.length === 1 && !target.saidUno;

  if (!isValidCallOut) {
    if (!state.rules.penalizeFalseCallOut) return state;

    const penalty = 2;
    const { drawn, state: afterDraw } = drawCardsFromPile(state, penalty);
    const updatedCaller = updatePlayer(afterDraw, callerIndex, {
      hand: [...caller.hand, ...drawn],
      saidUno: false,
    });

    return applyMercyRule({
      ...updatedCaller,
      lastAction: {
        type: 'callOut',
        callerId: caller.id,
        targetId: target.id,
        penalty,
      },
    });
  }

  const penalty = state.rules.missedUnoDrawPenalty ?? 2;
  const { drawn, state: afterDraw } = drawCardsFromPile(state, penalty);

  const updatedTarget: Partial<Player> = {
    hand: [...target.hand, ...drawn],
    saidUno: false, // reset flag after penalty
  };

  const updated = updatePlayer(afterDraw, targetIndex, updatedTarget);
  return applyMercyRule({
    ...updated,
    lastAction: {
      type: 'callOut',
      callerId: caller.id,
      targetId: target.id,
      penalty,
    },
  });
}

/** The roulette recipient chooses; revealed cards stay in the resulting hand. */
export function chooseRouletteColor(
  state: GameState,
  playerIndex: number,
  color: CardColor,
): GameState {
  const player = state.players[playerIndex];
  if (
    state.winnerId ||
    !player ||
    state.currentPlayerIndex !== playerIndex ||
    state.pendingRoulette?.playerId !== player.id
  ) {
    throw new Error('It is not your Color Roulette choice.');
  }
  if (!STANDARD_COLORS.includes(color))
    throw new Error('Choose red, yellow, green, or blue.');
  let next: GameState = {
    ...state,
    pendingRoulette: undefined,
    activeColor: color,
  };
  const drawn: Card[] = [];
  for (let count = 0; count < MAX_DRAW_UNTIL_PLAYABLE; count++) {
    const result = drawCardsFromPile(next, 1);
    next = result.state;
    const card = result.drawn[0];
    if (!card) break;
    drawn.push(card);
    if (card.color === color) break;
  }
  next = updatePlayer(next, playerIndex, {
    hand: [...player.hand, ...drawn],
    saidUno: false,
  });
  return applyMercyRule(
    advanceTurn({
      ...next,
      lastAction: { type: 'draw', playerId: player.id, count: drawn.length },
    }),
  );
}
