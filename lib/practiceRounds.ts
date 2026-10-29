// Small, conserved original-edition hands. Practice uses the real engine, never a saved round.
import type { Card, CardValue } from '../types/card';
import type { GameState } from '../types/game';
import { ALL_WILD_RULES, NO_MERCY_RULES } from '../types/rules';
import { initializeGame } from './gameSetup';

export type PracticeMode = 'no_mercy' | 'all_wild';
export type PracticeKind = 'stack' | 'swap' | 'roulette' | 'target' | 'skip';
export const PRACTICE_LESSONS = {
  no_mercy: [
    {
      kind: 'stack',
      title: 'Stacking',
      prompt:
        'Ten cards are waiting. The last card was +6. Which card can answer it?',
    },
    {
      kind: 'swap',
      title: 'Swap hands',
      prompt: 'Play your 7, then choose a player to exchange hands with.',
    },
    {
      kind: 'roulette',
      title: 'Color Roulette',
      prompt:
        'You received Color Roulette. Pick a color and see how many cards you take.',
    },
  ],
  all_wild: [
    {
      kind: 'skip',
      title: 'Skip Two',
      prompt: 'Play Skip Two. With three players, who goes next?',
    },
    {
      kind: 'target',
      title: 'Targeted draw',
      prompt: 'Play Targeted Draw Two, then choose who takes the cards.',
    },
    {
      kind: 'swap',
      title: 'Swap hands',
      prompt: 'Play Forced Swap, then choose a player to exchange hands with.',
    },
  ],
} as const;

export function createPracticeRound(
  mode: PracticeMode,
  kind: PracticeKind,
): GameState {
  if (!PRACTICE_LESSONS[mode].some((lesson) => lesson.kind === kind))
    throw new Error('Practice example not available in this edition.');
  const base = initializeGame(
    ['You', 'Cleo', 'Jules'],
    mode === 'no_mercy' ? NO_MERCY_RULES : ALL_WILD_RULES,
    [false, true, true],
  );
  let pool = [
    ...base.drawPile,
    ...base.discardPile,
    ...base.players.flatMap((player) => player.hand),
  ];
  const take = (value?: CardValue, color?: Card['color']): Card => {
    const index = pool.findIndex(
      (card) =>
        (!value || card.value === value) && (!color || card.color === color),
    );
    if (index < 0)
      throw new Error('Practice card missing from the edition deck.');
    const card = pool[index];
    pool = pool.filter((entry) => entry.id !== card.id);
    return card;
  };
  const top =
    kind === 'stack'
      ? take('wildDraw6')
      : kind === 'roulette'
        ? take('wildColorRoulette')
        : mode === 'all_wild'
          ? take('wild')
          : take('5', 'red');
  const discardPile = kind === 'stack' ? [take('draw4'), top] : [top];
  const hand =
    mode === 'no_mercy'
      ? kind === 'stack'
        ? [take('draw4'), take('wildDraw6'), take('wildDraw10')]
        : [take('7', 'red'), take('2', 'blue'), take('3', 'green')]
      : [
          take(
            kind === 'skip'
              ? 'wildSkip2'
              : kind === 'target'
                ? 'wildTargetDraw2'
                : 'wildForcedSwap',
          ),
          take('wild'),
          take('reverse'),
        ];
  // Draw order is explicit, including a wild that does not satisfy a chosen color.
  const reveals =
    kind === 'roulette'
      ? [
          take('1', 'red'),
          take('wildDraw6'),
          take('2', 'blue'),
          take('4', 'green'),
          take('3', 'yellow'),
        ]
      : [];
  if (kind === 'swap')
    hand.push(mode === 'all_wild' ? take('skip') : take('4', 'blue'));
  const players = base.players.map((player, index) => ({
    ...player,
    hand:
      index === 0
        ? hand
        : Array.from({ length: index === 1 ? 2 : 5 }, () => take()),
  }));
  return {
    ...base,
    players,
    discardPile,
    drawPile: [...pool, ...reveals.reverse()],
    currentPlayerIndex: 0,
    direction: 1,
    activeColor: mode === 'all_wild' ? null : 'red',
    pendingDraw: kind === 'stack' ? 10 : 0,
    pendingDrawType: kind === 'stack' ? 'wild4' : null,
    pendingRoulette:
      kind === 'roulette' ? { playerId: players[0].id } : undefined,
    turnDeadlineAt: null,
  };
}
