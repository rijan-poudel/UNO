// ============================================================
// hooks/useUnoGame.ts
// React state hook that wraps the pure game engine.
// Manages derived UI state (pending wild, drawn-this-turn, log)
// alongside the serializable GameState.
// ============================================================
'use client';

import { useReducer, useEffect, useCallback, useState } from 'react';
import type { GameState } from '../types/game';
import type { Card, CardColor } from '../types/card';
import type { GameRules } from '../types/rules';
import { initializeGame } from '../lib/gameSetup';
import {
  playCard as enginePlayCard,
  drawOneCard,
  drawRequiredCards,
  passTurn,
  declareUno,
  callOutUno,
} from '../lib/gameActions';
import { canPlayCard, getPlayableCards } from '../lib/gameRules';
import { getBotMove, getBotPreferredColor } from '../lib/botSupport';

const HUMAN_IDLE_TIMEOUT_MS = 12000;
const HUMAN_IDLE_AFTER_DRAW_TIMEOUT_MS = 4500;
const HUMAN_IDLE_WILD_PICK_TIMEOUT_MS = 3500;

// ── UI-layer state ────────────────────────────────────────────────────────────

export interface UnoUIState {
  /** The full serializable game state; null before the game starts. */
  game: GameState | null;
  /** Wild card awaiting color selection from the current player. */
  pendingWild: Card | null;
  /** True after a voluntary draw; enables the Pass button. */
  drawnThisTurn: boolean;
  /** True while an animated bot delay is running. */
  botThinking: boolean;
  /** Rolling action log (newest first). */
  log: string[];
}

type UIAction =
  | { type: 'INIT'; game: GameState }
  | { type: 'PLAY'; game: GameState }       // turn-advancing action (play / pass / forced-draw)
  | { type: 'DRAW_ONE'; game: GameState }   // voluntary draw: turn stays with current player
  | { type: 'SELECT_WILD'; card: Card }
  | { type: 'CANCEL_WILD' }
  | { type: 'BOT_THINKING'; value: boolean }
  | { type: 'RESET' };

// ── Action → log string ───────────────────────────────────────────────────────

function describeAction(game: GameState): string {
  const a = game.lastAction;
  const name = (id: string) => game.players.find((p) => p.id === id)?.name ?? id;

  switch (a.type) {
    case 'play':
      return `${name(a.playerId)} played ${a.card.color} ${a.card.value}${
        a.chosenColor ? ` → chose ${a.chosenColor}` : ''
      }`;
    case 'draw':
      return `${name(a.playerId)} drew ${a.count} card${a.count !== 1 ? 's' : ''}`;
    case 'pass':
      return `${name(a.playerId)} passed`;
    case 'declareUno':
      return `🔴 ${name(a.playerId)} said UNO!`;
    case 'callOut':
      return `😤 ${name(a.callerId)} caught ${name(a.targetId)} (+${a.penalty} cards)`;
    default:
      return 'Game started';
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: UnoUIState, action: UIAction): UnoUIState {
  switch (action.type) {
    case 'INIT':
      return {
        game: action.game,
        pendingWild: null,
        drawnThisTurn: false,
        botThinking: false,
        log: ['Game started!'],
      };

    case 'PLAY': {
      const entry = describeAction(action.game);
      return {
        ...state,
        game: action.game,
        pendingWild: null,
        drawnThisTurn: false,
        botThinking: false,
        log: [entry, ...state.log].slice(0, 30),
      };
    }

    case 'DRAW_ONE': {
      const entry = describeAction(action.game);
      return {
        ...state,
        game: action.game,
        pendingWild: null,
        drawnThisTurn: true,   // keeps turn on the current player
        botThinking: false,
        log: [entry, ...state.log].slice(0, 30),
      };
    }

    case 'SELECT_WILD':
      return { ...state, pendingWild: action.card };

    case 'CANCEL_WILD':
      return { ...state, pendingWild: null };

    case 'BOT_THINKING':
      return { ...state, botThinking: action.value };

    case 'RESET':
      return {
        game: null,
        pendingWild: null,
        drawnThisTurn: false,
        botThinking: false,
        log: [],
      };

    default:
      return state;
  }
}

// ── Public hook ───────────────────────────────────────────────────────────────

export function useUnoGame() {
  const [localPlayerIndex, setLocalPlayerIndex] = useState<number>(0);

  const [state, dispatch] = useReducer(reducer, {
    game: null,
    pendingWild: null,
    drawnThisTurn: false,
    botThinking: false,
    log: [],
  });

  const { game, pendingWild, drawnThisTurn, botThinking, log } = state;

  // ── Start ─────────────────────────────────────────────────────────────────

  const startGame = useCallback(
    (playerNames: string[], rules: Partial<GameRules>, botFlags: boolean[]) => {
      const newGame = initializeGame(playerNames, rules, botFlags);
      const firstHuman = newGame.players.findIndex((p) => !p.isBot);
      setLocalPlayerIndex(firstHuman >= 0 ? firstHuman : 0);
      dispatch({ type: 'INIT', game: newGame });
    },
    [],
  );

  // ── Human: select card to play ────────────────────────────────────────────

  const selectCard = useCallback(
    (card: Card) => {
      if (!game) return;
      if (card.color === 'wild') {
        // Wild cards need a color choice first — open the picker
        dispatch({ type: 'SELECT_WILD', card });
      } else {
        try {
          const next = enginePlayCard(game, game.currentPlayerIndex, card.id);
          dispatch({ type: 'PLAY', game: next });
        } catch (e) {
          console.error('playCard error:', e);
        }
      }
    },
    [game],
  );

  // ── Human: confirm wild color selection ───────────────────────────────────

  const confirmWildColor = useCallback(
    (color: CardColor) => {
      if (!game || !pendingWild) return;
      try {
        const next = enginePlayCard(game, game.currentPlayerIndex, pendingWild.id, color);
        dispatch({ type: 'PLAY', game: next });
      } catch (e) {
        console.error('confirmWildColor error:', e);
      }
    },
    [game, pendingWild],
  );

  const cancelWild = useCallback(() => dispatch({ type: 'CANCEL_WILD' }), []);

  // ── Human: draw card(s) ───────────────────────────────────────────────────

  const drawCard = useCallback(() => {
    if (!game) return;
    const idx = game.currentPlayerIndex;

    if (game.pendingDraw > 0) {
      // Forced draw — draws all pending and advances turn
      try {
        const next = drawRequiredCards(game, idx);
        dispatch({ type: 'PLAY', game: next });
      } catch (e) {
        console.error('drawRequiredCards error:', e);
      }
    } else {
      // Voluntary draw. If no playable cards remain after drawing,
      // auto-pass immediately so the player doesn't need an extra click.
      try {
        const afterDraw = drawOneCard(game, idx);
        const playerAfterDraw = afterDraw.players[idx];
        const playableAfterDraw = getPlayableCards(playerAfterDraw.hand, afterDraw, idx);

        if (playableAfterDraw.length === 0) {
          const autoPassed = passTurn(afterDraw, idx);
          dispatch({ type: 'PLAY', game: autoPassed });
          return;
        }

        dispatch({ type: 'DRAW_ONE', game: afterDraw });
      } catch (e) {
        console.error('drawOneCard error:', e);
      }
    }
  }, [game]);

  // ── Human: pass after drawing ─────────────────────────────────────────────

  const pass = useCallback(() => {
    if (!game) return;
    try {
      const next = passTurn(game, game.currentPlayerIndex);
      dispatch({ type: 'PLAY', game: next });
    } catch (e) {
      console.error('passTurn error:', e);
    }
  }, [game]);

  // ── UNO declaration & call-out ────────────────────────────────────────────

  const sayUno = useCallback(
    (playerIndex: number) => {
      if (!game) return;
      const next = declareUno(game, playerIndex);
      dispatch({ type: 'PLAY', game: next });
    },
    [game],
  );

  const callOut = useCallback(
    (callerIndex: number, targetIndex: number) => {
      if (!game) return;
      const next = callOutUno(game, callerIndex, targetIndex);
      dispatch({ type: 'PLAY', game: next });
    },
    [game],
  );

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), []);

  // ── Bot auto-play ─────────────────────────────────────────────────────────
  // Triggered whenever the current player changes or a turn completes.
  // Uses a delay so the UI can animate before the bot moves.

  useEffect(() => {
    if (!game || game.winnerId) return;
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer.isBot) return;

    dispatch({ type: 'BOT_THINKING', value: true });

    const timer = setTimeout(() => {
      try {
        const move = getBotMove(game, game.currentPlayerIndex);
        let next: GameState;

        if (move.action === 'drawRequired') {
          next = drawRequiredCards(game, game.currentPlayerIndex);
        } else if (move.action === 'draw') {
          const afterDraw = drawOneCard(game, game.currentPlayerIndex);
          const updatedHand = afterDraw.players[game.currentPlayerIndex].hand;
          const drawnCard = updatedHand[updatedHand.length - 1];

          if (drawnCard && canPlayCard(drawnCard, afterDraw, game.currentPlayerIndex)) {
            const color =
              drawnCard.color === 'wild'
                ? (move as { chosenColor?: CardColor }).chosenColor ?? 'red'
                : undefined;
            next = enginePlayCard(afterDraw, game.currentPlayerIndex, drawnCard.id, color);
          } else {
            next = passTurn(afterDraw, game.currentPlayerIndex);
          }
        } else {
          next = enginePlayCard(game, game.currentPlayerIndex, move.cardId, move.chosenColor);
        }

        // Auto-declare UNO for bot when hand drops to 1 card
        if (!next.winnerId && next.players[game.currentPlayerIndex].hand.length === 1) {
          next = declareUno(next, game.currentPlayerIndex);
        }

        dispatch({ type: 'PLAY', game: next });
      } catch (e) {
        console.error('Bot error:', e);
        dispatch({ type: 'BOT_THINKING', value: false });
      }
    }, 800);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.currentPlayerIndex, game?.turnCount, game?.winnerId]);

  // ── Human idle auto-play ────────────────────────────────────────────────
  // If the local human does not act in time, the turn is auto-resolved
  // using the same action heuristics as bots.

  useEffect(() => {
    if (!game || game.winnerId) return;
    if (game.currentPlayerIndex !== localPlayerIndex) return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.isBot) return;

    const timeoutMs = pendingWild
      ? HUMAN_IDLE_WILD_PICK_TIMEOUT_MS
      : drawnThisTurn
        ? HUMAN_IDLE_AFTER_DRAW_TIMEOUT_MS
        : HUMAN_IDLE_TIMEOUT_MS;

    const timer = setTimeout(() => {
      try {
        // If a wild card is waiting for color choice, auto-pick best color.
        if (pendingWild) {
          const color = getBotPreferredColor(currentPlayer.hand);
          const next = enginePlayCard(game, game.currentPlayerIndex, pendingWild.id, color);
          dispatch({ type: 'PLAY', game: next });
          return;
        }

        // After drawing one card, either play if possible or pass.
        if (drawnThisTurn) {
          const move = getBotMove(game, game.currentPlayerIndex);

          if (move.action === 'play') {
            const next = enginePlayCard(game, game.currentPlayerIndex, move.cardId, move.chosenColor);
            dispatch({ type: 'PLAY', game: next });
            return;
          }

          const next = passTurn(game, game.currentPlayerIndex);
          dispatch({ type: 'PLAY', game: next });
          return;
        }

        // Normal turn resolution.
        const move = getBotMove(game, game.currentPlayerIndex);
        let next: GameState;

        if (move.action === 'drawRequired') {
          next = drawRequiredCards(game, game.currentPlayerIndex);
        } else if (move.action === 'draw') {
          const afterDraw = drawOneCard(game, game.currentPlayerIndex);
          const updatedHand = afterDraw.players[game.currentPlayerIndex].hand;
          const drawnCard = updatedHand[updatedHand.length - 1];

          if (drawnCard && canPlayCard(drawnCard, afterDraw, game.currentPlayerIndex)) {
            const color =
              drawnCard.color === 'wild'
                ? (move as { chosenColor?: CardColor }).chosenColor ?? 'red'
                : undefined;
            next = enginePlayCard(afterDraw, game.currentPlayerIndex, drawnCard.id, color);
          } else {
            next = passTurn(afterDraw, game.currentPlayerIndex);
          }
        } else {
          next = enginePlayCard(game, game.currentPlayerIndex, move.cardId, move.chosenColor);
        }

        if (!next.winnerId && next.players[game.currentPlayerIndex].hand.length === 1) {
          next = declareUno(next, game.currentPlayerIndex);
        }

        dispatch({ type: 'PLAY', game: next });
      } catch (e) {
        console.error('Human idle auto-play error:', e);
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [
    game,
    localPlayerIndex,
    pendingWild,
    drawnThisTurn,
  ]);

  // ── Derived values ────────────────────────────────────────────────────────

  const currentPlayer = game?.players[game.currentPlayerIndex] ?? null;
  const localPlayer = game?.players[localPlayerIndex] ?? null;
  const isLocalTurn = !!game && game.currentPlayerIndex === localPlayerIndex;

  const playableCardIds = new Set(
    game && localPlayer && isLocalTurn && !localPlayer.isBot
      ? getPlayableCards(localPlayer.hand, game, localPlayerIndex).map((c) => c.id)
      : [],
  );

  const canPass = drawnThisTurn && (game?.pendingDraw ?? 0) === 0;
  const hasPendingStackOption = !!(
    game &&
    localPlayer &&
    isLocalTurn &&
    !localPlayer.isBot &&
    game.pendingDraw > 0 &&
    getPlayableCards(localPlayer.hand, game, localPlayerIndex).length > 0
  );

  // Auto-resolve forced draws for humans if they cannot stack a response card.
  useEffect(() => {
    if (!game || game.winnerId) return;
    if (game.currentPlayerIndex !== localPlayerIndex) return;

    const player = game.players[localPlayerIndex];
    if (player.isBot) return;
    if (game.pendingDraw <= 0) return;

    const playable = getPlayableCards(player.hand, game, localPlayerIndex);
    if (playable.length > 0) return;

    try {
      const next = drawRequiredCards(game, localPlayerIndex);
      dispatch({ type: 'PLAY', game: next });
    } catch (e) {
      console.error('auto drawRequiredCards error:', e);
    }
  }, [game, localPlayerIndex]);

  return {
    game,
    localPlayerIndex,
    pendingWild,
    drawnThisTurn,
    botThinking,
    log,
    currentPlayer,
    localPlayer,
    isLocalTurn,
    playableCardIds,
    canPass,
    hasPendingStackOption,
    // Actions
    startGame,
    selectCard,
    confirmWildColor,
    cancelWild,
    drawCard,
    pass,
    sayUno,
    callOut,
    resetGame,
  };
}
