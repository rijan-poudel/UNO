// Public visitors need a reachable host; local addresses belong only to previews.
import { isRoomCode } from './roomCodes';

export const ONLINE_UNAVAILABLE_MESSAGE =
  'Online tables are unavailable right now. You can still play with bots.';

function isLocalHost(hostname: string): boolean {
  return (
    ['localhost', '[::1]', '0.0.0.0'].includes(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)
  );
}

export function resolveSocketEndpoint(
  configured: string | undefined,
  location: { protocol: string; hostname: string; port: string },
  development = false,
): string | null {
  const localPreview = development || isLocalHost(location.hostname);
  const endpoint = configured?.trim();
  if (endpoint) {
    try {
      const url = new URL(endpoint);
      return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) &&
        (location.protocol !== 'https:' ||
          ['https:', 'wss:'].includes(url.protocol)) &&
        (localPreview || !isLocalHost(url.hostname))
        ? url.toString()
        : null;
    } catch {
      return null;
    }
  }
  return localPreview
    ? `${location.protocol}//${location.hostname}:3001`
    : null;
}

export interface RoomSession {
  roomId: string;
  playerName?: string;
}

/** A live session survives blocked storage; null explicitly suppresses recovery after leaving. */
export function readRoomSession(
  readStored: () => string | null,
  current: RoomSession | null | undefined = undefined,
): RoomSession | null {
  if (current !== undefined) return current;
  try {
    const saved = JSON.parse(readStored() ?? 'null');
    if (!saved || typeof saved.roomId !== 'string' || !isRoomCode(saved.roomId))
      return null;
    return {
      roomId: saved.roomId,
      ...(typeof saved.playerName === 'string'
        ? { playerName: saved.playerName.trim().slice(0, 18) }
        : {}),
    };
  } catch {
    return null;
  }
}
