// Visible guidance must describe the real decision, including waiting states.
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import TurnCue from '../components/TurnCue';
import { initializeGame } from '../lib/gameSetup';
import type { GameState } from '../types/game';

const base = initializeGame(['You', 'Cleo'], {
  allowStartingActionCard: false,
});
function cue(
  game: GameState,
  playableCount = 0,
  local = true,
  connected = true,
) {
  return renderToStaticMarkup(
    <TurnCue
      game={game}
      local={local}
      choosing={false}
      playableCount={playableCount}
      connected={connected}
    />,
  );
}
assert.match(cue(base), /No match · Tap the deck to draw/);
assert.match(
  cue({ ...base, drawnThisTurn: true }),
  /No match · Passing automatically/,
);
assert.match(
  cue({ ...base, drawnThisTurn: true }, 1),
  /Play a lifted card or pass/,
);
const penalty = { ...base, pendingDraw: 4, pendingDrawType: 'wild4' as const };
assert.match(cue(penalty, 0, false), /Get your next card ready/);
assert.match(cue(penalty, 0, true, false), /Reconnecting to the table/);
assert.match(
  cue(
    { ...base, discardPile: [{ id: 'skip', color: 'red', value: 'skip' }] },
    1,
  ),
  / or Skip/,
);
assert.equal(cue({ ...base, winnerId: base.players[0].id }), '');
console.log('Turn cue checks passed');
