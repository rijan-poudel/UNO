// Loopback-only reproducible player→pile and pile→player motion sequence.
// npx tsx .impeccable/review/card-continuity/fixture.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import setup from '../../../lib/gameSetup.ts';
import actions from '../../../lib/gameActions.ts';
const { initializeGame } = setup;
const { playCard, drawOneCard, passTurn } = actions;

function fixture() {
  const base = initializeGame(['Preview', 'Cleo', 'Jules'], { maxPlayers: 6, allowStartingActionCard: false }, [false, true, true]);
  let pool = [...base.drawPile, ...base.discardPile, ...base.players.flatMap(p => p.hand)];
  const total = pool.length;
  const take = (color, value) => {
    const card = pool.find(c => c.color === color && c.value === value);
    assert.ok(card, `${color} ${value} must exist`);
    pool = pool.filter(c => c.id !== card.id);
    return card;
  };
  const top = take('green', '3');
  const hands = [
    [take('green', '2'), take('yellow', '7'), take('wild', 'wild4')],
    [take('green', '4'), take('red', '8'), take('blue', '8')],
    [take('red', '7'), take('yellow', '8'), take('blue', '9')],
  ];
  const nextDraw = take('red', '3');
  const players = base.players.map((p, i) => ({ ...p, hand: hands[i] }));
  const game = { ...base, players, discardPile: [top], drawPile: [...pool, nextDraw], currentPlayerIndex: 0, pendingDraw: 0, pendingDrawType: null, activeColor: 'green', direction: 1, lastAction: { type: 'init' } };
  assert.equal(new Set([...game.drawPile, ...game.discardPile, ...players.flatMap(p => p.hand)].map(c => c.id)).size, total);
  return { roomId: 'ABC234', hostPlayerId: players[0].id, players: players.map(p => ({ playerId: p.id, name: p.name, connected: true, isBot: p.isBot, ready: true })), started: true, game, pendingColorChoice: null };
}
const http = createServer((_req, res) => res.end('Loopback motion fixture only'));
const io = new Server(http, { cors: { origin: 'http://localhost:3010' } });
io.on('connection', socket => {
  let room;
  const timers = new Set();
  const clear = () => { timers.forEach(clearTimeout); timers.clear(); room = null; };
  const later = (delay, update) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (room) { room.game = update(room.game); socket.emit('room:update', room); }
    }, delay);
    timers.add(timer);
  };
  socket.on('presence:update', (payload, ack) => ack({ ok: true, data: { friendCode: payload.friendCode || 'TEST2345' } }));
  socket.on('friend:status', (_payload, ack) => ack({ ok: true, data: { statuses: {} } }));
  socket.on('room:join', (_payload, ack) => {
    clear(); room = fixture();
    ack({ ok: true, data: { room, playerId: room.hostPlayerId } });
  });
  socket.on('game:action', (payload, ack) => {
    try {
      assert.ok(room);
      assert.equal(payload.action.type, 'play');
      room.game = playCard(room.game, 0, payload.action.cardId);
      socket.emit('room:update', room);
      ack({ ok: true, data: { room } });
      // Observation delays belong only to this fixture, never production turns.
      later(500, game => playCard(game, 1, game.players[1].hand.find(c => c.color === 'green').id));
      later(1100, game => drawOneCard(game, 2));
      later(1550, game => passTurn(game, 2));
    } catch (error) { ack({ ok: false, error: error.message }); }
  });
  socket.on('room:leave', (_payload, ack) => { clear(); ack?.({ ok: true, data: { left: true } }); });
  socket.on('disconnect', clear);
});
http.listen(3011, '127.0.0.1', () => console.log('Motion fixture on 3011: join ABC234; play green2.'));
