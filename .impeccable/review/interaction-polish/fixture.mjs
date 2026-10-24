// Loopback-only audit fixture. Extends table-rewards with stale broadcast/join races.
// Run: npx tsx .impeccable/review/interaction-audit/fixture.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import setup from '../../../lib/gameSetup.ts';
const { initializeGame } = setup;
import actions from '../../../lib/gameActions.ts';
const { drawOneCard, drawRequiredCards, passTurn, declareUno, playCard, callOutUno } = actions;

function fixture(roomId) {
  const names = roomId === 'LNG234' ? ['Preview', 'Alexandria', 'Maximilian', 'Robin', 'Frankie', 'Lou'] : roomId === 'THREE3' ? ['Preview', 'Cleo', 'Jules'] : ['Preview', 'Cleo', 'Jules', 'Robin', 'Frankie', 'Lou'];
  const base = initializeGame(names, { maxPlayers: 6, allowStartingActionCard: false, allowDiscardAll: true }, names.map((_, i) => i > 0 && !(roomId === 'LNG234' && i === 2)));
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
  const hand = roomId === 'HAND22' ? [take(c => c.value === 'wild4'), take(c => c.color === 'green' && c.value === '5'), ...Array.from({length:18}, () => take(c => c.color !== 'green' && c.color !== 'wild' && c.value !== '2'))] : ['THREE3', 'SEVEN7', 'LNG234', 'ANGLE7'].includes(roomId)
    ? [take(c => c.color === 'green' && c.value === 'discardAll'), take(c => c.value === 'wild4'), ...Array.from({length:5}, () => take(c => roomId === 'ANGLE7' ? c.color === 'blue' && c.value !== '2' : c.color !== 'green' && c.value !== '2'))]
    : roomId === 'ABC234'
    ? [take(c => c.color === 'green' && c.value === 'discardAll'), take(c => c.value === 'wild4')]
    : Array.from({ length: 12 }, () => take(c => c.color !== 'green' && c.color !== 'wild' && c.value !== '2'));
  const players = base.players.map((p, i) => ({ ...p, saidUno: i === 3, hand: i === 0 ? hand : Array.from({length: i === 1 || i === 3 ? 1 : 7}, () => take(() => true)) }));
  const game = { ...base, players, discardPile: [top], drawPile: [...pool, nextDraw], currentPlayerIndex: 0, pendingDraw: roomId === 'DRAW23' ? 8 : 0, pendingDrawType: roomId === 'DRAW23' ? 'draw2' : null, activeColor: 'green', direction: 1, lastAction: {type: 'init'} };
  assert.equal(new Set([...game.drawPile, ...game.discardPile, ...players.flatMap(p => p.hand)].map(c => c.id)).size, total);
  return { roomId, hostPlayerId: players[0].id, players: players.map(p => ({playerId: p.id, name: p.name, connected: !(roomId === 'LNG234' && p.name === 'Maximilian'), isBot: p.isBot, ready: true})), started: true, game, pendingColorChoice: null };
}
const http = createServer((_req, res) => res.end('Local table fixture only'));
const io = new Server(http, { cors: {origin: 'http://localhost:3012'} });
io.on('connection', socket => {
  let room;
  socket.on('presence:update', (payload, ack) => ack({ok: true, data: {friendCode: payload.friendCode || 'TEST2345'}}));
  socket.on('friend:status', (_payload, ack) => ack({ok: true, data: {statuses: {}}}));
  socket.on('room:join', (payload, ack) => {
    if (!['HAND22', 'ABC234', 'DRAW23', 'RACE23', 'THREE3', 'SEVEN7', 'LNG234', 'ANGLE7'].includes(payload.roomId)) return ack({ok: false, error: 'Fixture codes: ABC234 or DRAW23'});
    room = fixture(payload.roomId);
    const joined = room;
    const finishJoin = () => {
      ack({ok: true, data: {room: joined, playerId: joined.hostPlayerId}});
      console.log('Join acknowledgement:', joined.roomId);
    };
    if (payload.roomId === 'RACE23') setTimeout(finishJoin, 1500);
    else finishJoin();
  });
  socket.on('game:action', async (payload, ack) => {
    try {
      assert.ok(room);
      const action = payload.action;
      if (action.type === 'draw') await new Promise(resolve => setTimeout(resolve, 1200));
      if (action.type === 'draw') room.game = room.game.pendingDraw ? drawRequiredCards(room.game, 0) : drawOneCard(room.game, 0);
      else if (action.type === 'pass') room.game = passTurn(room.game, 0);
      else if (action.type === 'callOut') room.game = callOutUno(room.game, 0, room.game.players.findIndex(p => p.id === action.targetPlayerId));
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
  socket.on('room:leave', (_payload, ack) => {
    const departed = room;
    room = null;
    ack?.({ok: true, data: {left: true}});
    if (departed) setTimeout(() => {
      socket.emit('room:update', departed);
      console.log('Delivered stale broadcast after leave:', departed.roomId);
    }, 100);
  });
});
http.listen(3013, '127.0.0.1', () => console.log('LOCAL FIXTURE on 3013. Join ABC234/DRAW23 for table checks; RACE23 delays join by 1500ms. Leaving emits a stale snapshot after 100ms. Bots stay still.'));
