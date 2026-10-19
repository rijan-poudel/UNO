// Local-only browser fixture. Never run this instead of the production server.
// Run: npx tsx .impeccable/review/play-feedback/fixture.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import setup from '../../../lib/gameSetup.ts';
const { initializeGame } = setup;
import actions from '../../../lib/gameActions.ts';
const { drawOneCard, passTurn, declareUno, playCard } = actions;

function fixture(roomId) {
  const names = ['Preview', 'Cleo', 'Jules', 'Robin', 'Frankie', 'Lou'];
  const base = initializeGame(names, { maxPlayers: 6, allowStartingActionCard: false, allowDiscardAll: true }, names.map((_, i) => i > 0));
  let pool = [...base.drawPile, ...base.discardPile, ...base.players.flatMap(p => p.hand)];
  const total = pool.length;
  function take(predicate) {
    const card = pool.find(predicate);
    assert.ok(card, 'Fixture card must exist');
    pool = pool.filter(c => c.id !== card.id);
    return card;
  }
  const top = take(c => c.color === 'green' && c.value === '2');
  const nextDraw = take(c => c.color === 'green' && c.value === 'reverse');
  const hand = roomId === 'ABC234'
    ? [take(c => c.color === 'green' && c.value === 'discardAll'), take(c => c.value === 'wild4')]
    : Array.from({ length: 12 }, () => take(c => c.color !== 'green' && c.color !== 'wild' && c.value !== '2'));
  const players = base.players.map((p, i) => ({ ...p, hand: i === 0 ? hand : Array.from({length: 7}, () => take(() => true)) }));
  const game = { ...base, players, discardPile: [top], drawPile: [...pool, nextDraw], currentPlayerIndex: 0, pendingDraw: 0, pendingDrawType: null, activeColor: 'green', direction: 1, lastAction: {type: 'init'} };
  assert.equal(new Set([...game.drawPile, ...game.discardPile, ...players.flatMap(p => p.hand)].map(c => c.id)).size, total);
  return { roomId, hostPlayerId: players[0].id, players: players.map(p => ({playerId: p.id, name: p.name, connected: true, isBot: p.isBot, ready: true})), started: true, game, pendingColorChoice: null };
}
const http = createServer((_req, res) => res.end('Local table fixture only'));
const io = new Server(http, { cors: {origin: 'http://localhost:3000'} });
io.on('connection', socket => {
  let room;
  socket.on('presence:update', (payload, ack) => ack({ok: true, data: {friendCode: payload.friendCode || 'TEST2345'}}));
  socket.on('friend:status', (_payload, ack) => ack({ok: true, data: {statuses: {}}}));
  socket.on('room:join', (payload, ack) => {
    if (!['ABC234', 'DRAW23'].includes(payload.roomId)) return ack({ok: false, error: 'Fixture codes: ABC234 or DRAW23'});
    room = fixture(payload.roomId);
    ack({ok: true, data: {room, playerId: room.hostPlayerId}});
  });
  socket.on('game:action', async (payload, ack) => {
    try {
      assert.ok(room);
      const action = payload.action;
      if (action.type === 'draw') await new Promise(resolve => setTimeout(resolve, 1200));
      if (action.type === 'draw') room.game = drawOneCard(room.game, 0);
      else if (action.type === 'pass') room.game = passTurn(room.game, 0);
      else if (action.type === 'sayUno') room.game = declareUno(room.game, 0);
      else if (action.type === 'prepareWild') {
        const card = room.game.players[0].hand.find(c => c.id === action.cardId);
        assert.equal(card?.color, 'wild');
        room.pendingColorChoice = { playerId: room.hostPlayerId, cardId: card.id, cardValue: card.value };
      }
      else if (action.type === 'cancelWildChoice') room.pendingColorChoice = null;
      else if (action.type === 'play') { room.game = playCard(room.game, 0, action.cardId, action.chosenColor); room.pendingColorChoice = null; }
      else throw new Error('Unsupported fixture action.');
      io.emit('room:update', room);
      ack({ok: true, data: {room}});
    } catch (error) { ack({ok: false, error: error.message}); }
  });
  socket.on('room:leave', (_payload, ack) => { room = null; ack({ok: true, data: {left: true}}); });
});
http.listen(3001, '127.0.0.1', () => console.log('LOCAL FIXTURE on 3001. Join ABC234 (near finish) or DRAW23 (large hand). Bots stay still.'));
