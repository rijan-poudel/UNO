// One readable action history for local tables, online tables and live announcements.
import { getCardLabel } from '../types/card';
import type { GameState, Player } from '../types/game';

export function describeGameAction(
  game: Pick<GameState, 'lastAction'> & {
    players: ReadonlyArray<Pick<Player, 'id' | 'name'>>;
  },
): string {
  const action = game.lastAction;
  const name = (id: string) =>
    game.players.find((player) => player.id === id)?.name ?? 'A player';
  switch (action.type) {
    case 'init':
      return 'Cards dealt. Let’s play.';
    case 'play': {
      let text = `${name(action.playerId)} ${action.declaredUno ? 'called UNO and ' : ''}played ${(action.playedCards ?? [action.card]).map(getCardLabel).join(' and ')}`;
      if (action.discardAllCount)
        text += `, clearing ${action.discardAllCount + 1} cards`;
      if (action.shuffledHands) text += ' · shuffled all hands';
      if (action.targetId)
        text +=
          action.card.value === 'wildTargetDraw2'
            ? ` · ${name(action.targetId)} draws two`
            : ` · swapped with ${name(action.targetId)}`;
      if (action.chosenColor) text += ` · ${action.chosenColor} is up`;
      return text;
    }
    case 'draw':
      return `${name(action.playerId)} drew ${action.count} ${action.count === 1 ? 'card' : 'cards'}`;
    case 'pass':
      return `${name(action.playerId)} passed`;
    case 'declareUno':
      return `${name(action.playerId)} called UNO!`;
    case 'callOut':
      return `${name(action.callerId)} caught ${name(action.targetId)} · +${action.penalty} ${action.penalty === 1 ? 'card' : 'cards'}`;
    case 'mercyElimination':
      return `${name(action.playerId)} was knocked out by the Mercy Rule.`;
  }
}
