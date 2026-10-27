// Accepted friendships and requests belong to devices, not temporary room seats.
import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { isAvatarId } from '../lib/playerAvatars';
import type { FriendPresenceState, SocialSnapshot } from '../types/multiplayer';

interface Profile {
  friendCode: string;
  deviceId: string;
  name: string;
  avatarId?: string;
}
interface Request {
  requestId: string;
  from: string;
  to: string;
  createdAt: number;
}
interface Data {
  version: 1;
  profiles: Profile[];
  links: [string, string][];
  requests: Request[];
}
const MAX_FRIENDS = 64;
const MAX_REQUESTS = 32;
const REQUEST_TTL_MS = 30 * 24 * 60 * 60_000;
const validCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Z0-9]{4,8}$/.test(value);

export class FriendStore {
  // ponytail: one socket process; use a shared database before scaling to multiple processes.
  private data: Data = { version: 1, profiles: [], links: [], requests: [] };

  constructor(private readonly path?: string) {
    if (!path || !existsSync(path)) return;
    const data = JSON.parse(readFileSync(path, 'utf8')) as Data;
    if (
      data?.version !== 1 ||
      !Array.isArray(data.profiles) ||
      !Array.isArray(data.links) ||
      !Array.isArray(data.requests)
    )
      throw new Error(
        'Friend data is invalid. Restore the saved friends file before starting.',
      );
    if (
      !data.profiles.every(
        (p) =>
          p &&
          validCode(p.friendCode) &&
          typeof p.deviceId === 'string' &&
          p.deviceId.length > 0 &&
          typeof p.name === 'string' &&
          (!p.avatarId || isAvatarId(p.avatarId)),
      )
    )
      throw new Error('Saved friend profiles are invalid.');
    const codes = new Set(data.profiles.map((p) => p.friendCode));
    if (
      codes.size !== data.profiles.length ||
      !data.links.every(
        (link) =>
          Array.isArray(link) &&
          link.length === 2 &&
          link[0] !== link[1] &&
          link.every((code) => codes.has(code)),
      ) ||
      !data.requests.every(
        (r) =>
          r &&
          typeof r.requestId === 'string' &&
          codes.has(r.from) &&
          codes.has(r.to) &&
          r.from !== r.to &&
          Number.isFinite(r.createdAt),
      )
    )
      throw new Error('Saved friend relationships are invalid.');
    this.data = data;
  }

  private commit(data: Data): void {
    if (this.path) {
      mkdirSync(dirname(this.path), { recursive: true });
      const temp = `${this.path}.tmp`;
      writeFileSync(temp, JSON.stringify(data), { mode: 0o600 });
      renameSync(temp, this.path);
    }
    this.data = data;
  }

  register(profile: Profile): void {
    if (
      !validCode(profile.friendCode) ||
      typeof profile.deviceId !== 'string' ||
      !profile.deviceId.trim() ||
      profile.deviceId.length > 128 ||
      typeof profile.name !== 'string' ||
      !profile.name.trim()
    )
      throw new Error('A valid device, name and friend code are required.');
    if (profile.avatarId !== undefined && !isAvatarId(profile.avatarId))
      throw new Error('Choose a valid avatar.');
    const existing = this.data.profiles.find(
      (p) => p.friendCode === profile.friendCode,
    );
    if (existing && existing.deviceId !== profile.deviceId)
      throw new Error('That friend code belongs to another device.');
    const next = { ...profile, name: profile.name.trim().slice(0, 18) };
    if (
      existing &&
      existing.name === next.name &&
      existing.avatarId === next.avatarId
    )
      return;
    this.commit({
      ...this.data,
      profiles: [
        ...this.data.profiles.filter((p) => p.friendCode !== next.friendCode),
        next,
      ],
    });
  }

  isFriend(a: string, b: string): boolean {
    return this.data.links.some((link) => link.includes(a) && link.includes(b));
  }

  friendCodes(code: string): string[] {
    return this.data.links
      .filter((link) => link.includes(code))
      .map((link) => (link[0] === code ? link[1] : link[0]));
  }

  request(from: string, to: string): Request {
    if (from === to) throw new Error('You cannot add yourself.');
    for (const code of [from, to])
      if (!this.data.profiles.some((p) => p.friendCode === code))
        throw new Error(
          'That player is not known yet. Ask them to open UNO and share their friend code.',
        );
    if (this.isFriend(from, to)) throw new Error('You are already friends.');
    if ([from, to].some((code) => this.friendCodes(code).length >= MAX_FRIENDS))
      throw new Error('This friend list is full.');
    const requests = this.data.requests.filter(
      (r) => Date.now() - r.createdAt < REQUEST_TTL_MS,
    );
    const existing = requests.find((r) => r.from === from && r.to === to);
    if (existing) return existing;
    if (requests.some((r) => r.from === to && r.to === from))
      throw new Error('They already sent you a request. Accept it in Friends.');
    if (
      [from, to].some(
        (code) =>
          requests.filter((r) => r.from === code || r.to === code).length >=
          MAX_REQUESTS,
      )
    )
      throw new Error(
        'Too many pending friend requests. Resolve some requests first.',
      );
    const request = {
      requestId: `friend_${randomBytes(12).toString('hex')}`,
      from,
      to,
      createdAt: Date.now(),
    };
    this.commit({ ...this.data, requests: [...requests, request] });
    return request;
  }

  respond(code: string, requestId: string, accept: boolean): string[] {
    const request = this.data.requests.find(
      (r) =>
        r.requestId === requestId && Date.now() - r.createdAt < REQUEST_TTL_MS,
    );
    if (!request) throw new Error('That friend request has expired.');
    if (request.to !== code)
      throw new Error('Only the recipient can answer this friend request.');
    if (
      accept &&
      [code, request.from].some(
        (c) => this.friendCodes(c).length >= MAX_FRIENDS,
      )
    )
      throw new Error('This friend list is full.');
    this.commit({
      ...this.data,
      requests: this.data.requests.filter((r) => r.requestId !== requestId),
      links:
        accept && !this.isFriend(code, request.from)
          ? [...this.data.links, [request.from, code]]
          : this.data.links,
    });
    return [request.from, code];
  }

  remove(code: string, target: string): void {
    this.commit({
      ...this.data,
      links: this.data.links.filter(
        (link) => !(link.includes(code) && link.includes(target)),
      ),
      requests: this.data.requests.filter(
        (r) =>
          !([r.from, r.to].includes(code) && [r.from, r.to].includes(target)),
      ),
    });
  }

  snapshot(
    code: string,
    status: (code: string) => FriendPresenceState,
  ): SocialSnapshot {
    const profile = (friendCode: string) => {
      const saved = this.data.profiles.find((p) => p.friendCode === friendCode);
      if (!saved) throw new Error('Friend profile is missing.');
      return {
        friendCode,
        name: saved.name,
        avatarId: saved.avatarId,
        status: status(friendCode),
      };
    };
    const requests = this.data.requests.filter(
      (r) => Date.now() - r.createdAt < REQUEST_TTL_MS,
    );
    const view = (request: Request) => ({
      requestId: request.requestId,
      from: profile(request.from),
      to: profile(request.to),
      createdAt: request.createdAt,
    });
    return {
      friends: this.friendCodes(code)
        .map(profile)
        .sort((a, b) => a.name.localeCompare(b.name)),
      incomingRequests: requests.filter((r) => r.to === code).map(view),
      outgoingRequests: requests.filter((r) => r.from === code).map(view),
    };
  }
}
