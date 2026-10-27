// Exercise each real edition over private authoritative socket snapshots.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import type {
  Ack,
  MultiplayerAction,
  RoomSnapshot,
} from '../types/multiplayer';
import { RULE_PRESETS } from '../lib/rulePresets';
import { toPresentationGame } from '../lib/gameView';
import { getBotMove } from '../lib/botSupport';
import { getCardPlayChoices } from '../lib/gameRules';
const url = process.env.UNO_CHECK_SOCKET_URL ?? 'http://localhost:3001';
const clients: Socket[] = [];
async function connect() {
  const socket = io(url, {
    transports: ['websocket'],
    forceNew: true,
    auth: { protocolVersion: 2 },
  });
  clients.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}
async function request(socket: Socket, event: string, payload: unknown) {
  const ack = (await socket.timeout(5000).emitWithAck(event, payload)) as Ack<{
    room: RoomSnapshot;
    playerId: string;
  }>;
  assert.equal(ack.ok, true, ack.ok ? '' : ack.error);
  return ack.data;
}
async function main() {
  try {
    const sockets = await Promise.all([connect(), connect(), connect()]);
    for (const preset of RULE_PRESETS) {
      const created = await request(sockets[0], 'room:create', {
        playerName: 'Edition host',
        deviceId: randomBytes(12).toString('hex'),
        profileId: preset.id,
        rules: {
          ...preset.rules,
          startingHandSize: 1,
          missedUnoDrawPenalty: 8,
        },
      });
      const roomId = created.room.roomId;
      assert.equal(
        created.room.rules?.startingHandSize,
        7,
        'Original rules are canonical on create',
      );
      assert.equal(created.room.rules?.missedUnoDrawPenalty, 2);
      const ids = [created.playerId];
      for (let index = 1; index < sockets.length; index++) {
        ids.push(
          (
            await request(sockets[index], 'room:join', {
              roomId,
              playerName: `Player ${index}`,
              deviceId: randomBytes(12).toString('hex'),
            })
          ).playerId,
        );
      }
      let room = (await request(sockets[0], 'room:start', { roomId })).room;
      const invalidChange = (await sockets[0]
        .timeout(5000)
        .emitWithAck('room:set-rules', {
          roomId,
          rules: { startingHandSize: 12 },
        })) as Ack<unknown>;
      assert.equal(
        invalidChange.ok,
        false,
        'Active tables cannot change rules',
      );
      let rouletteSeen = false;
      for (let step = 0; step < 1500 && !room.game?.winnerId; step++) {
        assert.ok(room.game);
        const actorId = room.game.players[room.game.currentPlayerIndex].id;
        const socket = sockets[ids.indexOf(actorId)];
        room = (
          await request(socket, 'game:action', {
            roomId,
            action: { type: 'resumeControl' },
          })
        ).room;
        const game = toPresentationGame(room.game);
        assert.ok(game);
        assert.equal(game.rules.gameMode, preset.id);
        assert.ok(!game.players[game.currentPlayerIndex].eliminated);
        for (const player of room.game!.players) {
          assert.equal(
            player.hand !== undefined,
            player.id === actorId,
            'Only the actor receives their own faces',
          );
        }
        let action: MultiplayerAction;
        if (game.pendingRoulette) {
          rouletteSeen = true;
          const outsider = sockets.find((candidate) => candidate !== socket)!;
          const rejected = (await outsider
            .timeout(5000)
            .emitWithAck('game:action', {
              roomId,
              action: { type: 'chooseRouletteColor', color: 'blue' },
            })) as Ack<unknown>;
          assert.equal(
            rejected.ok,
            false,
            'Roulette belongs only to its recipient',
          );
          action = { type: 'chooseRouletteColor', color: 'blue' };
        } else {
          const move = getBotMove(game, game.currentPlayerIndex);
          if (move.action === 'play') {
            const card = game.players[game.currentPlayerIndex].hand.find(
              (c) => c.id === move.cardId,
            )!;
            const remaining = getCardPlayChoices(
              game,
              game.currentPlayerIndex,
              card,
            )[0]?.remaining;
            action = {
              type: 'play',
              cardId: move.cardId,
              chosenColor: move.chosenColor,
              targetPlayerId: move.targetPlayerId,
              declareUno: remaining === 1,
            };
          } else
            action = {
              type: move.action === 'drawRequired' ? 'draw' : move.action,
            };
        }
        room = (await request(socket, 'game:action', { roomId, action })).room;
      }
      assert.ok(room.game?.winnerId, `${preset.label} completes online`);
      assert.equal(
        room.tableScore?.completedRounds,
        1,
        'Both empty-hand and Mercy wins count',
      );
      console.log(
        `${preset.label} online passed${rouletteSeen ? ', including recipient-owned roulette' : ''}.`,
      );
      for (const socket of sockets)
        await request(socket, 'room:leave', { roomId });
    }
  } finally {
    clients.forEach((socket) => socket.disconnect());
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
