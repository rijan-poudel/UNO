// Real server verification for multi-card moves, UNO and chosen portraits.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import { canPlayCard, getCardPlayChoices } from '../lib/gameRules';
import { getBotMove } from '../lib/botSupport';
import { toPresentationGame } from '../lib/gameView';
import type {
  Ack,
  MultiplayerAction,
  RoomSnapshot,
} from '../types/multiplayer';

const url = process.env.UNO_CHECK_SOCKET_URL ?? 'http://localhost:3001';
const sockets: Socket[] = [];
async function connect(avatarId: string) {
  const socket = io(url, {
    transports: ['websocket'],
    forceNew: true,
    auth: { protocolVersion: 2, avatarId },
  });
  sockets.push(socket);
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
    const host = await connect('portrait-3');
    const guest = await connect('initials');
    const created = await request(host, 'room:create', {
      playerName: 'Portrait host',
      deviceId: randomBytes(12).toString('hex'),
    });
    const roomId = created.room.roomId;
    const hostId = created.playerId;
    const joined = await request(guest, 'room:join', {
      roomId,
      playerName: 'Neutral guest',
      deviceId: randomBytes(12).toString('hex'),
    });
    assert.equal(
      joined.room.players.find((p) => p.playerId === hostId)?.avatarId,
      'portrait-3',
    );
    assert.equal(
      joined.room.players.find((p) => p.playerId === joined.playerId)?.avatarId,
      'initials',
    );
    let room = (
      await request(host, 'room:start', {
        roomId,
        rules: {
          startingHandSize: 20,
          allowStartingActionCard: false,
          allowDoublePlaySameNumber: true,
          allowDiscardAll: true,
        },
      })
    ).room;
    const initial = room.game;
    const avatarAck = (await host.timeout(5000).emitWithAck('profile:avatar', {
      avatarId: 'portrait-11',
    })) as Ack<unknown>;
    assert.equal(avatarAck.ok, true);
    room = (
      await request(guest, 'game:action', {
        roomId,
        action: { type: 'resumeControl' },
      })
    ).room;
    assert.equal(
      room.players.find((p) => p.playerId === hostId)?.avatarId,
      'portrait-11',
    );
    assert.equal(
      room.game?.players.find((p) => p.id === hostId)?.avatarId,
      'portrait-11',
    );
    assert.equal(
      room.game?.turnDeadlineAt,
      initial?.turnDeadlineAt,
      'Avatar updates preserve the live clock',
    );
    assert.equal(room.game?.turnCount, initial?.turnCount);
    assert.deepEqual(room.game?.discardPile, initial?.discardPile);
    const invalidAvatar = (await guest
      .timeout(5000)
      .emitWithAck('profile:avatar', {
        avatarId: 'portrait-99',
      })) as Ack<unknown>;
    assert.equal(invalidAvatar.ok, false);
    let paired = false;
    let called = false;
    // Exercise complete real rounds, with both humans driven immediately by this check.
    for (let round = 0; round < 4 && !(paired && called); round++) {
      if (round) room = (await request(host, 'room:start', { roomId })).room;
      for (let step = 0; step < 800 && !room.game?.winnerId; step++) {
        assert.ok(room.game);
        const currentId = room.game.players[room.game.currentPlayerIndex].id;
        const socket = currentId === hostId ? host : guest;
        room = (
          await request(socket, 'game:action', {
            roomId,
            action: { type: 'resumeControl' },
          })
        ).room;
        const game = toPresentationGame(room.game);
        assert.ok(game);
        const index = game.currentPlayerIndex;
        const player = game.players[index];
        const choices = player.hand.flatMap((card) =>
          getCardPlayChoices(game, index, card).map((choice) => ({
            card,
            choice,
          })),
        );
        const picked: (typeof choices)[number] | undefined =
          (!paired
            ? choices.find(
                ({ card, choice }) =>
                  choice.secondCardId && !canPlayCard(card, game, index),
              )
            : undefined) ??
          choices.find(({ choice }) => choice.remaining === 1) ??
          choices.find(({ choice }) => choice.secondCardId);
        let action: MultiplayerAction;
        if (picked) {
          const lead = picked.choice.secondCardId
            ? picked.choice.cards[0]
            : picked.card;
          action = {
            type: 'play',
            cardId: lead.id,
            secondCardId: picked.choice.secondCardId,
            declareUno: picked.choice.remaining === 1,
            ...(lead.color === 'wild' ? { chosenColor: 'red' as const } : {}),
          };
          const rejected = (await socket
            .timeout(5000)
            .emitWithAck('game:action', {
              roomId,
              action: { ...action, secondCardId: lead.id },
            })) as Ack<unknown>;
          assert.equal(
            rejected.ok,
            false,
            'A duplicate card ID cannot be played twice',
          );
        } else {
          const move = getBotMove(game, index);
          action =
            move.action === 'play'
              ? {
                  type: 'play',
                  cardId: move.cardId,
                  chosenColor: move.chosenColor,
                }
              : { type: move.action === 'drawRequired' ? 'draw' : move.action };
        }
        room = (await request(socket, 'game:action', { roomId, action })).room;
        if (picked) {
          const after = room.game?.players[index];
          assert.ok(after);
          assert.equal(after.handCount, picked.choice.remaining);
          if (picked.choice.secondCardId) {
            paired = true;
            assert.equal(
              room.game?.discardPile.at(-1)?.id,
              picked.choice.secondCardId,
            );
            assert.equal(
              room.game?.lastAction.type === 'play' &&
                room.game.lastAction.playedCards?.length,
              2,
            );
          }
          if (action.type === 'play' && action.declareUno) {
            called = true;
            assert.equal(
              after.saidUno,
              true,
              'The published one-card snapshot already contains the UNO call',
            );
          }
        }
      }
      assert.ok(
        room.game?.winnerId,
        'The round completes with multi-card play enabled',
      );
    }
    assert.ok(
      paired && called,
      'Real rounds exercised a pair and an atomic UNO call',
    );
    console.log(
      'Network card checks passed: matching pairs, atomic UNO, wins, validated avatar choices and live profile updates without resetting the turn.',
    );
  } finally {
    for (const socket of sockets) socket.disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
