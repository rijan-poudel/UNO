// ============================================================
// demo.ts
// A self-contained walkthrough of the UNO engine.
//
// Run from the project root (after ts-node or tsx is available):
//   npx tsx uno/demo.ts
//
// This script initialises a 3-player game (2 humans + 1 bot),
// runs the bot through several turns, and prints evolving state.
// ============================================================

import { initializeGame } from './lib/gameSetup';
import { canPlayCard, getPlayableCards } from './lib/gameRules';
import { playCard, drawOneCard, drawRequiredCards, passTurn, declareUno } from './lib/gameActions';
import { getBotMove, getBotPreferredColor } from './lib/botSupport';
import { getNextPlayerIndex } from './lib/turns';
import type { GameState } from './types/game';
import type { CardColor } from './types/card';

// ── Pretty-print helpers ──────────────────────────────────────────────────────

function colorize(color: string, text: string): string {
  // Only use ANSI colours when running in a real terminal.
  if (!process.stdout.isTTY) return text;
  const codes: Record<string, string> = {
    red: '\x1b[31m', yellow: '\x1b[33m',
    green: '\x1b[32m', blue: '\x1b[34m',
    wild: '\x1b[35m', reset: '\x1b[0m',
  };
  return `${codes[color] ?? ''}${text}${codes.reset}`;
}

function cardStr(card: { color: string; value: string }): string {
  return colorize(card.color, `[${card.color.toUpperCase()[0]} ${card.value}]`);
}

function printDivider(label?: string): void {
  const line = '─'.repeat(55);
  console.log(label ? `\n${line}\n  ${label}\n${line}` : `\n${line}`);
}

function printState(state: GameState): void {
  const top = state.discardPile[state.discardPile.length - 1];
  const current = state.players[state.currentPlayerIndex];

  console.log(`\nTurn ${state.turnCount}  ·  Direction: ${state.direction === 1 ? '→' : '←'}`);
  console.log(`Top card:     ${cardStr(top)}   Active color: ${state.activeColor ?? 'any'}`);
  if (state.pendingDraw > 0) {
    console.log(`⚠  Pending draw: +${state.pendingDraw} (${state.pendingDrawType})`);
  }
  console.log(`Current turn: ${current.name}`);
  console.log('');
  for (const p of state.players) {
    const uno = p.saidUno ? ' UNO' : '';
    const marker = p.id === current.id ? '▶' : ' ';
    const hand = p.hand.map(cardStr).join(' ') || '(no cards)';
    console.log(`  ${marker} ${p.name.padEnd(8)} (${p.hand.length} cards)${uno}`);
    console.log(`           ${hand}`);
  }
}

// ── One-turn execution helper ─────────────────────────────────────────────────

/**
 * Execute one full turn using bot logic for the current player.
 * Returns the updated state.
 */
function runBotTurn(state: GameState): GameState {
  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];
  const move = getBotMove(state, playerIndex);

  console.log(`\n  ${player.name} → ${JSON.stringify(move)}`);

  if (move.action === 'drawRequired') {
    state = drawRequiredCards(state, playerIndex);
    console.log(`  ${player.name} was forced to draw ${state.players[playerIndex].hand.length - player.hand.length + (state.players[playerIndex].hand.length)} card(s).`);
    return state;
  }

  if (move.action === 'pass') return passTurn(state, playerIndex);

  if (move.action === 'draw') {
    state = drawOneCard(state, playerIndex);
    // Check if the newly drawn card is playable — if so, the bot plays it.
    const updatedHand = state.players[playerIndex].hand;
    const drawnCard = updatedHand[updatedHand.length - 1];
    const playable = drawnCard && canPlayCard(drawnCard, state, playerIndex);
    if (playable) {
      const chosenColor: CardColor | undefined =
        drawnCard.color === 'wild'
          ? getBotPreferredColor(state.players[playerIndex].hand)
          : undefined;
      console.log(`  ${player.name} drew ${cardStr(drawnCard)} and immediately played it.`);
      state = playCard(state, playerIndex, drawnCard.id, chosenColor);
    } else {
      console.log(`  ${player.name} drew a card and passed.`);
      state = passTurn(state, playerIndex);
    }
    return state;
  }

  // move.action === 'play'
  const card = state.players[playerIndex].hand.find(c => c.id === move.cardId)!;
  console.log(`  ${player.name} plays ${cardStr(card)}${move.chosenColor ? ` → chooses ${move.chosenColor}` : ''}`);
  state = playCard(state, playerIndex, move.cardId, move.chosenColor);

  // Auto-declare UNO when the player reaches 1 card.
  if (!state.winnerId && state.players[playerIndex].hand.length === 1) {
    state = declareUno(state, playerIndex);
    console.log(`  ${player.name}: "UNO!"`);
  }

  return state;
}

// ── Main demo ─────────────────────────────────────────────────────────────────

function runDemo(): void {
  printDivider('UNO ENGINE DEMO');
  console.log('Rules: standard  |  3 players (all bots for demo purposes)\n');

  // ── Initialise ──────────────────────────────────────────────────────────
  let state = initializeGame(
    ['Alice', 'Bob', 'Carol'],
    { mustDeclareUno: true, stackDraw2: true, reverseActsAsSkipInTwoPlayer: true },
    [true, true, true], // all bots so the demo runs unattended
  );

  printDivider('Initial state');
  printState(state);

  // ── Show playable cards for Alice ────────────────────────────────────────
  printDivider('Playable cards for Alice on turn 0');
  const alice = state.players[0];
  const alicePlayable = getPlayableCards(alice.hand, state, 0);
  if (alicePlayable.length === 0) {
    console.log('  (no playable cards — Alice must draw)');
  } else {
    console.log(' ', alicePlayable.map(cardStr).join('  '));
  }

  // ── Next-player preview ──────────────────────────────────────────────────
  const nextIdx = getNextPlayerIndex(state);
  console.log(`\nNext player after Alice will be: ${state.players[nextIdx].name}`);

  // ── Run up to 30 turns or until someone wins ─────────────────────────────
  printDivider('Game play');

  const MAX_TURNS = 30;
  let turnNumber = 0;

  while (!state.winnerId && turnNumber < MAX_TURNS) {
    state = runBotTurn(state);
    turnNumber++;

    if (state.winnerId) break;

    // Print state every 5 turns to avoid flooding the console.
    if (turnNumber % 5 === 0) {
      printDivider(`State after ${turnNumber} turns`);
      printState(state);
    }
  }

  // ── Outcome ──────────────────────────────────────────────────────────────
  printDivider('Game over');
  if (state.winnerId) {
    const winner = state.players.find(p => p.id === state.winnerId);
    console.log(`\n🏆  ${winner?.name} wins after ${state.turnCount} turns!\n`);
  } else {
    console.log(`\nMax turn limit (${MAX_TURNS}) reached — no winner yet.\n`);
    printState(state);
  }
}

runDemo();
