// ============================================================
// hooks/useUnoGame.ts
// React state hook that wraps the pure game engine.
// Manages derived UI state (pending wild, drawn-this-turn, log)
// alongside the serializable GameState.
// ============================================================
'use client';

import {
  useReducer,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useState,
} from 'react';
import type { GameState } from '../types/game';
import type { Card, CardColor } from '../types/card';
import type { GameRules } from '../types/rules';
import { initializeGame } from '../lib/gameSetup';
import {
  playCard as enginePlayCard,
  drawOneCard,
  chooseRouletteColor,
  drawRequiredCards,
  passTurn,
  declareUno,
  callOutUno,
  type PlayOptions,
} from '../lib/gameActions';
import { canPlayCard, getPlayableCards } from '../lib/gameRules';
import { playBotStep } from '../lib/botSupport';
import { usePlayerActivity } from './usePlayerActivity';
import {
  getPlayerName,
  resolvePlayerName,
  subscribePlayerName,
} from '../lib/playerNames';
import { getPlayerAvatar, subscribePlayerAvatar } from '../lib/playerAvatars';
import { readSavedRound, saveRound, resumeRound } from '../lib/savedRound';
import { recordTableWin, startTableRound } from '../lib/tableScore';
import {
  BOT_TURN_MS,
  FORCED_DRAW_DELAY_MS,
  expireTurn,
  hasForcedPenalty,
  resumePlayerControl,
  withTurnDeadline,
} from '../lib/turnFlow';

const BOT_ACTION_DELAY_MS = BOT_TURN_MS;
const AUTO_PASS_AFTER_DRAW_MS = 650;
const POST_ACTION_HANDOFF_DELAY_MS = 180;

function withLocalProfile(game: GameState): GameState {
  return {
    ...game,
    players: game.players.map((player) =>
      player.isBot
        ? player
        : {
            ...player,
            name: getPlayerName(player.name),
            avatarId: getPlayerAvatar(),
          },
    ),
  };
}

function localRoundId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function reportHookError(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[useUnoGame] ${context}`, error);
  }
}

function getActionPresentationDelay(game: GameState): number {
  const action = game.lastAction;

  if (action.type === 'init') return 260;
  if (action.type === 'declareUno') return 300;
  if (action.type === 'callOut') return 420;
  if (action.type === 'draw') return Math.min(950, 360 + action.count * 110);
  if (action.type === 'pass') return 200;

  if (action.type === 'play') {
    if (action.card.value === 'shuffle') return 460;
    if (action.card.value === 'discardAll') return 400;
    if (action.card.value === 'wild4' || action.card.value === 'draw2')
      return 360;
    if (
      action.card.value === 'reverse' ||
      action.card.value === 'skip' ||
      action.card.value === 'wild'
    )
      return 340;
    return 240;
  }

  return 240;
}

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
  | { type: 'RESTORE'; game: GameState }
  | { type: 'PLAY'; game: GameState } // turn-advancing action (play / pass / forced-draw)
  | { type: 'META'; game: GameState }
  | { type: 'CLOCK'; game: GameState }
  | { type: 'DRAW_ONE'; game: GameState } // voluntary draw: turn stays with current player
  | { type: 'SELECT_WILD'; card: Card }
  | { type: 'CANCEL_WILD' }
  | { type: 'BOT_THINKING'; value: boolean }
  | { type: 'RESET' };

// ── Action → log string ───────────────────────────────────────────────────────

function describeAction(game: GameState): string {
  const a = game.lastAction;

  switch (a.type) {
    case 'play': {
      const extras: string[] = [];
      if (a.playedCards) extras.push('played both matching numbers');
      if (a.declaredUno) extras.push('called UNO');
      if (a.discardAllCount && a.discardAllCount > 0) {
        extras.push(`discarded ${a.discardAllCount} extra`);
      }
      if (a.shuffledHands) {
        extras.push('shuffled all hands');
      }
      return `${resolvePlayerName(game.players, a.playerId)} played ${a.card.color} ${a.card.value}${
        a.chosenColor ? ` -> chose ${a.chosenColor}` : ''
      }${extras.length ? ` (${extras.join(', ')})` : ''}`;
    }
    case 'draw':
      return `${resolvePlayerName(game.players, a.playerId)} drew ${a.count} card${a.count !== 1 ? 's' : ''}`;
    case 'pass':
      return `${resolvePlayerName(game.players, a.playerId)} passed`;
    case 'declareUno':
      return `${resolvePlayerName(game.players, a.playerId)} said UNO!`;
    case 'callOut':
      return `${resolvePlayerName(game.players, a.callerId)} caught ${resolvePlayerName(game.players, a.targetId)} (+${a.penalty} cards)`;
    default:
      return 'Game started';
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: UnoUIState, action: UIAction): UnoUIState {
  switch (action.type) {
    case 'RESTORE':
      return {
        game: resumeRound(action.game),
        pendingWild: null,
        drawnThisTurn: action.game.drawnThisTurn,
        botThinking: false,
        log: ['Round resumed.'],
      };
    case 'INIT':
      return {
        game: withTurnDeadline(null, recordTableWin(action.game)),
        pendingWild: null,
        drawnThisTurn: false,
        botThinking: false,
        log: ['Game started!'],
      };

    case 'PLAY': {
      const entry = describeAction(action.game);
      return {
        ...state,
        game: withTurnDeadline(state.game, recordTableWin(action.game)),
        pendingWild: null,
        drawnThisTurn: action.game.drawnThisTurn,
        botThinking: false,
        log: [entry, ...state.log].slice(0, 30),
      };
    }

    case 'CLOCK':
      return { ...state, game: action.game };

    case 'META':
      return {
        ...state,
        game: withTurnDeadline(state.game, recordTableWin(action.game)),
        log: [describeAction(action.game), ...state.log].slice(0, 30),
      };

    case 'DRAW_ONE': {
      const entry = describeAction(action.game);
      return {
        ...state,
        game: withTurnDeadline(state.game, recordTableWin(action.game)),
        pendingWild: null,
        drawnThisTurn: true, // keeps turn on the current player
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

export function useUnoGame(paused = false) {
  const [localPlayerIndex, setLocalPlayerIndex] = useState<number>(0);
  const [savedGame, setSavedGame] = useState(readSavedRound);

  const [state, dispatch] = useReducer(reducer, {
    game: null,
    pendingWild: null,
    drawnThisTurn: false,
    botThinking: false,
    log: [],
  });

  const { game, pendingWild, drawnThisTurn, botThinking, log } = state;

  useEffect(() => {
    // The empty home state must not erase a round waiting to be resumed.
    if (game) saveRound(game);
  }, [game]);

  // Ref to always access latest game state in async callbacks
  const gameRef = useRef<GameState | null>(game);
  useEffect(() => {
    const sync = () => {
      const live = gameRef.current;
      if (!live) return;
      const next = withLocalProfile(live);
      gameRef.current = next;
      dispatch({ type: 'CLOCK', game: next });
    };
    const unsubscribeAvatar = subscribePlayerAvatar(sync);
    const unsubscribeName = subscribePlayerName(sync);
    return () => {
      unsubscribeAvatar();
      unsubscribeName();
    };
  }, []);
  const pausedRef = useRef(paused);
  const pendingWildRef = useRef(pendingWild);
  const pausedAt = useRef<number | null>(null);
  useLayoutEffect(() => {
    gameRef.current = game;
    pausedRef.current = paused;
    pendingWildRef.current = pendingWild;
  }, [game, paused, pendingWild]);

  const resumeControl = useCallback(() => {
    const live = gameRef.current;
    if (!live) return;
    const next = resumePlayerControl(live, live.players[localPlayerIndex].id);
    if (next === live) return;
    gameRef.current = next;
    dispatch({ type: 'CLOCK', game: next });
  }, [localPlayerIndex]);

  usePlayerActivity(
    !!game?.autoPlayPlayerIds?.includes(game.players[localPlayerIndex].id),
    resumeControl,
  );

  // Human actions can also arrive directly, without a preceding browser event.
  const dispatchHuman = useCallback(
    (action: UIAction) => {
      if ('game' in action) {
        dispatch({
          ...action,
          game: resumePlayerControl(
            action.game,
            action.game.players[localPlayerIndex].id,
          ),
        });
      } else {
        resumeControl();
        dispatch(action);
      }
    },
    [localPlayerIndex, resumeControl],
  );

  // ── Start ─────────────────────────────────────────────────────────────────

  const startGame = useCallback(
    (playerNames: string[], rules: Partial<GameRules>, botFlags: boolean[]) => {
      const newGame = startTableRound(
        withLocalProfile(initializeGame(playerNames, rules, botFlags)),
        localRoundId(),
      );
      const firstHuman = newGame.players.findIndex((p) => !p.isBot);
      setLocalPlayerIndex(firstHuman >= 0 ? firstHuman : 0);
      setSavedGame(null);
      dispatch({ type: 'INIT', game: newGame });
    },
    [],
  );

  const startRematch = useCallback(() => {
    const current = gameRef.current;
    if (!current?.winnerId) return false;
    const finished = recordTableWin(current);
    const next = initializeGame(
      finished.players.map((player) => player.name),
      finished.rules,
      finished.players.map((player) => player.isBot),
    );
    dispatch({
      type: 'INIT',
      game: startTableRound(
        withLocalProfile(next),
        localRoundId(),
        finished.tableScore,
      ),
    });
    return true;
  }, []);

  const resumeGame = useCallback(() => {
    const saved = readSavedRound();
    if (!saved) {
      setSavedGame(null);
      return false;
    }
    setLocalPlayerIndex(saved.players.findIndex((player) => !player.isBot));
    setSavedGame(null);
    dispatch({
      type: 'RESTORE',
      game: withLocalProfile(
        saved.tableScore
          ? saved
          : startTableRound(saved, saved.roundId ?? localRoundId()),
      ),
    });
    return true;
  }, []);

  // ── Human: select card to play ────────────────────────────────────────────

  const selectCard = useCallback(
    (card: Card, options: PlayOptions = {}) => {
      if (!game || !canPlayCard(card, game, localPlayerIndex)) return;
      if (
        card.color === 'wild' &&
        game.rules.gameMode !== 'all_wild' &&
        card.value !== 'wildColorRoulette'
      ) {
        // Wild cards need a color choice first — open the picker
        dispatchHuman({ type: 'SELECT_WILD', card });
      } else {
        try {
          const next = enginePlayCard(
            game,
            localPlayerIndex,
            card.id,
            undefined,
            options,
          );
          dispatchHuman({ type: 'PLAY', game: next });
        } catch (e) {
          reportHookError('playCard error', e);
        }
      }
    },
    [game, localPlayerIndex, dispatchHuman],
  );

  // ── Human: confirm wild color selection ───────────────────────────────────

  const confirmWildColor = useCallback(
    (color: CardColor) => {
      if (!game) return;
      if (
        game.pendingRoulette?.playerId === game.players[localPlayerIndex].id
      ) {
        dispatchHuman({
          type: 'PLAY',
          game: chooseRouletteColor(game, localPlayerIndex, color),
        });
        return;
      }
      if (!pendingWild) return;
      try {
        const next = enginePlayCard(
          game,
          localPlayerIndex,
          pendingWild.id,
          color,
        );
        dispatchHuman({ type: 'PLAY', game: next });
      } catch (e) {
        reportHookError('confirmWildColor error', e);
      }
    },
    [game, pendingWild, localPlayerIndex, dispatchHuman],
  );

  const cancelWild = useCallback(
    () => dispatchHuman({ type: 'CANCEL_WILD' }),
    [dispatchHuman],
  );

  // ── Human: draw card(s) ───────────────────────────────────────────────────

  const drawCard = useCallback(() => {
    if (!game) return;
    const idx = game.currentPlayerIndex;

    if (game.pendingDraw > 0) {
      // Forced draw — draws all pending and advances turn
      try {
        const next = drawRequiredCards(game, idx);
        dispatchHuman({ type: 'PLAY', game: next });
      } catch (e) {
        reportHookError('drawRequiredCards error', e);
      }
    } else {
      // Voluntary draw. The board decides whether to offer play/pass or
      // auto-pass after a short delay once the drawn card is visible.
      try {
        const afterDraw = drawOneCard(game, idx);
        dispatchHuman({
          type: afterDraw.currentPlayerIndex === idx ? 'DRAW_ONE' : 'PLAY',
          game: afterDraw,
        });
      } catch (e) {
        reportHookError('drawOneCard error', e);
      }
    }
  }, [game, dispatchHuman]);

  // ── Human: pass after drawing ─────────────────────────────────────────────

  const pass = useCallback(() => {
    if (!game) return;
    try {
      const next = passTurn(game, game.currentPlayerIndex);
      dispatchHuman({ type: 'PLAY', game: next });
    } catch (e) {
      reportHookError('passTurn error', e);
    }
  }, [game, dispatchHuman]);

  // ── UNO declaration & call-out ────────────────────────────────────────────

  const sayUno = useCallback(
    (playerIndex: number) => {
      if (!game) return;
      const next = declareUno(game, playerIndex);
      dispatchHuman({ type: 'META', game: next });
    },
    [game, dispatchHuman],
  );

  const callOut = useCallback(
    (callerIndex: number, targetIndex: number) => {
      if (!game) return;
      const next = callOutUno(game, callerIndex, targetIndex);
      dispatchHuman({ type: 'META', game: next });
    },
    [game, dispatchHuman],
  );

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetGame = useCallback(() => {
    saveRound(null);
    setSavedGame(null);
    dispatch({ type: 'RESET' });
  }, []);

  // ── Bot auto-play ─────────────────────────────────────────────────────────
  // Triggered whenever the current player changes or a turn completes.
  // Uses a delay so the UI can animate before the bot moves.

  useEffect(() => {
    if (paused || pendingWild || !game || game.winnerId) return;
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer.isBot) return;

    dispatch({ type: 'BOT_THINKING', value: true });

    const coordinatedDelay = Math.max(
      BOT_ACTION_DELAY_MS,
      getActionPresentationDelay(game) + POST_ACTION_HANDOFF_DELAY_MS,
    );

    const timer = setTimeout(() => {
      try {
        // Read from ref to get the latest state, avoiding stale closure
        const currentGame = gameRef.current;
        if (
          pausedRef.current ||
          pendingWildRef.current ||
          !currentGame ||
          currentGame.winnerId
        )
          return;
        const current = currentGame.players[currentGame.currentPlayerIndex];
        if (!current.isBot) return;

        dispatch({ type: 'PLAY', game: playBotStep(currentGame) });
      } catch (e) {
        reportHookError('bot action error', e);
        dispatch({ type: 'BOT_THINKING', value: false });
      }
    }, coordinatedDelay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    game?.currentPlayerIndex,
    game?.turnCount,
    game?.winnerId,
    game?.drawnThisTurn,
    paused,
    pendingWild,
  ]);

  // ── Derived values ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!game || game.winnerId) {
      pausedAt.current = null;
      return;
    }
    if (paused) {
      pausedAt.current ??= Date.now();
      return;
    }
    if (pausedAt.current !== null) {
      const held = Date.now() - pausedAt.current;
      pausedAt.current = null;
      const resume = setTimeout(() => {
        const live = gameRef.current;
        if (live?.turnDeadlineAt)
          dispatch({
            type: 'CLOCK',
            game: { ...live, turnDeadlineAt: live.turnDeadlineAt + held },
          });
      }, 0);
      return () => clearTimeout(resume);
    }
    if (game.players[game.currentPlayerIndex].isBot) return;
    const forced = !pendingWild && hasForcedPenalty(game);
    const delay = forced
      ? FORCED_DRAW_DELAY_MS
      : Math.max(0, (game.turnDeadlineAt ?? Date.now() + 30_000) - Date.now());
    const timer = setTimeout(() => {
      const live = gameRef.current;
      if (
        !live ||
        live.winnerId ||
        pausedRef.current ||
        live.currentPlayerIndex !== game.currentPlayerIndex ||
        live.turnCount !== game.turnCount ||
        live.turnDeadlineAt !== game.turnDeadlineAt
      )
        return;
      if (forced && (pendingWildRef.current || !hasForcedPenalty(live))) return;
      try {
        dispatch({
          type: 'PLAY',
          game: forced
            ? drawRequiredCards(live, live.currentPlayerIndex)
            : expireTurn(live),
        });
      } catch (error) {
        reportHookError('automatic turn', error);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [game, paused, pendingWild]);

  const currentPlayer = game?.players[game.currentPlayerIndex] ?? null;
  const localPlayer = game?.players[localPlayerIndex] ?? null;
  const isLocalTurn = !!game && game.currentPlayerIndex === localPlayerIndex;

  const playableCardIds = new Set(
    game && localPlayer && !localPlayer.isBot
      ? getPlayableCards(localPlayer.hand, game, localPlayerIndex).map(
          (c) => c.id,
        )
      : [],
  );

  const canPass =
    drawnThisTurn &&
    !game?.pendingRoulette &&
    (game?.pendingDraw ?? 0) === 0 &&
    !(
      game?.rules.gameMode === 'no_mercy' &&
      game.rules.drawUntilPlayable &&
      playableCardIds.size > 0
    );
  const hasPendingStackOption = !!(
    game &&
    localPlayer &&
    isLocalTurn &&
    !localPlayer.isBot &&
    game.pendingDraw > 0 &&
    getPlayableCards(localPlayer.hand, game, localPlayerIndex).length > 0
  );

  // After a voluntary draw, auto-pass after a short delay if the drawn card
  // still leaves no playable option.
  useEffect(() => {
    if (paused || pendingWild || !game || game.winnerId) return;
    if (game.currentPlayerIndex !== localPlayerIndex) return;

    const player = game.players[localPlayerIndex];
    if (player.isBot) return;
    if (game.autoPlayPlayerIds?.includes(player.id)) return;
    if (!drawnThisTurn) return;
    if ((game.pendingDraw ?? 0) > 0) return;

    const playable = getPlayableCards(player.hand, game, localPlayerIndex);
    if (playable.length > 0) return;

    const coordinatedAutoPassDelay = Math.max(AUTO_PASS_AFTER_DRAW_MS);

    const timer = window.setTimeout(() => {
      try {
        if (pausedRef.current) return;
        const next = passTurn(game, localPlayerIndex);
        dispatch({ type: 'PLAY', game: next });
      } catch (e) {
        reportHookError('auto passTurn error', e);
      }
    }, coordinatedAutoPassDelay);

    return () => window.clearTimeout(timer);
  }, [game, localPlayerIndex, drawnThisTurn, paused, pendingWild]);

  return {
    game,
    localPlayerIndex,
    pendingWild:
      game &&
      game.pendingRoulette?.playerId === game.players[localPlayerIndex]?.id
        ? (game.discardPile.at(-1) ?? null)
        : pendingWild,
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
    startRematch,
    savedGame,
    resumeGame,
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
