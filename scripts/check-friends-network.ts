// Real two-party friendship and room invitation flow; no UI-only fake friends.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import type {
  Ack,
  FriendInvite,
  RoomSnapshot,
  SocialSnapshot,
} from '../types/multiplayer';
const url = process.env.UNO_CHECK_SOCKET_URL ?? 'http://localhost:3001';
const sockets: Socket[] = [];
async function connect() {
  const socket = io(url, {
    transports: ['websocket'],
    forceNew: true,
    auth: { protocolVersion: 2 },
  });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}
async function request<T>(
  socket: Socket,
  event: string,
  payload: object,
): Promise<T> {
  const ack = (await socket
    .timeout(5000)
    .emitWithAck(event, payload)) as Ack<T>;
  assert.equal(ack.ok, true, ack.ok ? '' : ack.error);
  return ack.data;
}
function event<T>(socket: Socket, name: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(name, receive);
      reject(new Error(`Missing ${name}`));
    }, 5000);
    const receive = (value: T) => {
      clearTimeout(timer);
      resolve(value);
    };
    socket.once(name, receive);
  });
}
async function main() {
  try {
    const alice = await connect(),
      bob = await connect(),
      outsider = await connect();
    const a = {
      playerName: 'Alice',
      deviceId: randomBytes(16).toString('hex'),
      friendCode: randomBytes(4).toString('hex').toUpperCase(),
    };
    const b = {
      playerName: 'Bob',
      deviceId: randomBytes(16).toString('hex'),
      friendCode: randomBytes(4).toString('hex').toUpperCase(),
    };
    for (const [socket, profile] of [
      [alice, a],
      [bob, b],
    ] as const)
      await request(socket, 'presence:update', profile);
    const created = await request<{ room: RoomSnapshot }>(
      alice,
      'room:create',
      a,
    );
    const roomId = created.room.roomId;
    const joined = await request<{ room: RoomSnapshot }>(bob, 'room:join', {
      ...b,
      roomId,
    });
    assert.equal(
      joined.room.players.find((p) => p.name === 'Alice')?.friendCode,
      a.friendCode,
    );
    const premature = (await alice.timeout(5000).emitWithAck('friend:invite', {
      ...a,
      targetFriendCode: b.friendCode,
    })) as Ack<unknown>;
    assert.equal(
      premature.ok,
      false,
      'Unaccepted contacts never enter the invite list',
    );
    const notified = event<SocialSnapshot>(bob, 'social:update');
    const sent = await request<{ requestId: string }>(alice, 'social:request', {
      targetFriendCode: b.friendCode,
    });
    assert.equal(
      (await notified).incomingRequests[0].requestId,
      sent.requestId,
    );
    const rejected = (await outsider
      .timeout(5000)
      .emitWithAck('social:respond', {
        requestId: sent.requestId,
        accept: true,
      })) as Ack<unknown>;
    assert.equal(rejected.ok, false);
    const forged = (await bob.timeout(5000).emitWithAck('presence:update', {
      ...a,
      playerName: 'Forged',
    })) as Ack<unknown>;
    assert.equal(
      forged.ok,
      false,
      'Friend codes cannot be claimed by another device',
    );
    await request(bob, 'social:respond', {
      requestId: sent.requestId,
      accept: true,
    });
    const accepted = await request<SocialSnapshot>(alice, 'social:sync', {});
    assert.equal(accepted.friends[0]?.friendCode, b.friendCode);
    assert.equal(
      (await request<SocialSnapshot>(bob, 'social:sync', {})).friends[0]
        ?.friendCode,
      a.friendCode,
    );
    assert.doesNotMatch(JSON.stringify(accepted), /deviceId/);
    await request(bob, 'room:leave', { roomId });
    const arriving = event<FriendInvite>(bob, 'friend:invite');
    const invitation = await request<{ invite: FriendInvite }>(
      alice,
      'friend:invite',
      { ...a, targetFriendCode: b.friendCode },
    );
    assert.equal((await arriving).roomId, roomId);
    bob.disconnect();
    const returning = await connect();
    const recovered = event<FriendInvite>(returning, 'friend:invite');
    await request(returning, 'presence:update', b);
    assert.equal(
      (await recovered).inviteId,
      invitation.invite.inviteId,
      'Unanswered invitations replay after reconnect',
    );
    assert.equal(
      (await request<SocialSnapshot>(returning, 'social:sync', {})).friends[0]
        ?.friendCode,
      a.friendCode,
    );
    const joinedNotice = event<{ targetName: string }>(
      alice,
      'friend:invite:accepted',
    );
    const invitedRoom = await request<{ room: RoomSnapshot }>(
      returning,
      'friend:invite:accept',
      { ...b, inviteId: invitation.invite.inviteId },
    );
    assert.equal(invitedRoom.room.players.length, 2);
    assert.equal((await joinedNotice).targetName, 'Bob');
    await request(alice, 'social:remove', { friendCode: b.friendCode });
    assert.equal(
      (await request<SocialSnapshot>(returning, 'social:sync', {})).friends
        .length,
      0,
    );
    console.log(
      'Social network passed: room contacts, owned requests, reciprocal acceptance, reconnect recovery, actionable invitations and shared removal.',
    );
  } finally {
    sockets.forEach((socket) => socket.disconnect());
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
