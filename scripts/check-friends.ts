// Explicit acceptance, private snapshots, atomic persistence and bounded requests.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FriendStore } from '../server/friendStore';

const folder = mkdtempSync(join(tmpdir(), 'uno-friends-'));
try {
  const path = join(folder, 'friends.json');
  let store = new FriendStore(path);
  store.register({
    friendCode: 'ALICE234',
    deviceId: 'alice-private-device',
    name: 'Alice',
    avatarId: 'portrait-1',
  });
  store.register({
    friendCode: 'BOBBY234',
    deviceId: 'bob-private-device',
    name: 'Bob',
  });
  store.register({
    friendCode: 'OTHER234',
    deviceId: 'other-private-device',
    name: 'Other',
  });
  assert.throws(() =>
    store.register({
      friendCode: 'ALICE234',
      deviceId: 'attacker',
      name: 'Stolen',
    }),
  );
  assert.throws(() => store.request('ALICE234', 'ALICE234'));
  assert.throws(() => store.request('ALICE234', 'UNKNOWN2'));
  const request = store.request('ALICE234', 'BOBBY234');
  assert.equal(
    store.request('ALICE234', 'BOBBY234').requestId,
    request.requestId,
  );
  assert.equal(store.isFriend('ALICE234', 'BOBBY234'), false);
  assert.throws(() => store.respond('OTHER234', request.requestId, true));
  store = new FriendStore(path);
  assert.equal(
    store.snapshot('BOBBY234', () => 'offline').incomingRequests.length,
    1,
    'Offline requests survive a server restart',
  );
  store.respond('BOBBY234', request.requestId, true);
  assert.equal(store.isFriend('ALICE234', 'BOBBY234'), true);
  assert.deepEqual(
    store.snapshot('ALICE234', () => 'online').friends.map((p) => p.name),
    ['Bob'],
  );
  assert.deepEqual(
    store.snapshot('BOBBY234', () => 'playing').friends.map((p) => p.name),
    ['Alice'],
  );
  assert.doesNotMatch(
    JSON.stringify(store.snapshot('ALICE234', () => 'offline')),
    /deviceId|private-device/,
  );
  assert.throws(
    () => store.respond('BOBBY234', request.requestId, true),
    'Consumed requests cannot be replayed',
  );
  store = new FriendStore(path);
  assert.equal(store.isFriend('ALICE234', 'BOBBY234'), true);
  store.remove('ALICE234', 'BOBBY234');
  assert.equal(new FriendStore(path).isFriend('ALICE234', 'BOBBY234'), false);
  const declined = store.request('BOBBY234', 'ALICE234');
  store.respond('ALICE234', declined.requestId, false);
  assert.equal(store.isFriend('ALICE234', 'BOBBY234'), false);
  const content = readFileSync(path, 'utf8');
  writeFileSync(path, '{broken');
  assert.throws(
    () => new FriendStore(path),
    'Damaged persistence is never silently overwritten',
  );
  assert.equal(readFileSync(path, 'utf8'), '{broken');
  writeFileSync(path, content);
  const bounded = new FriendStore();
  bounded.register({
    friendCode: 'TARGET23',
    deviceId: 'target',
    name: 'Target',
  });
  for (let i = 0; i < 33; i++) {
    const code = `USER${String(i).padStart(4, '0')}`;
    bounded.register({
      friendCode: code,
      deviceId: `device-${i}`,
      name: `Person ${i}`,
    });
    if (i < 32) bounded.request(code, 'TARGET23');
    else assert.throws(() => bounded.request(code, 'TARGET23'), /pending/);
  }
} finally {
  rmSync(folder, { recursive: true, force: true });
}
console.log(
  'Friendships passed: explicit acceptance, recipient ownership, offline requests, private views, persistence, removal and request limits.',
);
