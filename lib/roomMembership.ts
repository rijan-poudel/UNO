// ── Room Membership & Snapshot Reconciliation ──────────────────────────────
import type { RoomSnapshot } from '../types/multiplayer';

/**
 * Determines whether an incoming room snapshot is newer than the current client snapshot.
 * Rejects out-of-order broadcasts and stale transitions while allowing legitimate transitions:
 * - Finished round -> lobby (Edit table)
 * - Lobby -> active game (Deal)
 * - Finished round -> rematch (Deal again)
 */
export function isNewerRoomSnapshot(
  current: RoomSnapshot | null,
  incoming: RoomSnapshot,
): boolean {
  if (!current) return true;
  if (current.roomId !== incoming.roomId) return true;

  const isCurrentActiveGame = Boolean(
    current.started && current.game && !current.game.winnerId,
  );

  // An active (unfinished) game should not be overwritten by a lobby snapshot.
  if (isCurrentActiveGame && !incoming.started) return false;

  // A returned-to-lobby room should not be overwritten by an old finished game.
  if (!current.started && incoming.started && incoming.game?.winnerId)
    return false;

  if (current.game && incoming.game) {
    if (current.game.roundId === incoming.game.roundId) {
      if (current.game.winnerId && !incoming.game.winnerId) return false;
      const currentTurn = current.game.turnCount ?? 0;
      const incomingTurn = incoming.game.turnCount ?? 0;
      if (currentTurn > incomingTurn) return false;
    } else {
      // Rematch dealt: incoming is an old results screen if it has winnerId and current is active.
      if (incoming.game.winnerId && !current.game.winnerId) return false;
      const currentRounds = current.tableScore?.completedRounds ?? 0;
      const incomingRounds = incoming.tableScore?.completedRounds ?? 0;
      if (currentRounds > incomingRounds) return false;
    }
  }

  return true;
}

/**
 * Manages client-side room membership lifecycle and guards against race conditions.
 * Prevents late operation replies and broadcast updates from reopening a table after leaving.
 */
export class RoomMembershipManager {
  private revision = 0;
  private room: RoomSnapshot | null = null;

  get currentRevision(): number {
    return this.revision;
  }

  get currentRoom(): RoomSnapshot | null {
    return this.room;
  }

  setRoom(room: RoomSnapshot | null): void {
    this.room = room;
  }

  beginOperation(): number {
    return ++this.revision;
  }

  markOperationStarted(): number {
    return this.revision;
  }

  leaveRoom(): void {
    this.revision++;
    this.room = null;
  }

  isStale(revision: number): boolean {
    return revision !== this.revision;
  }

  discardStaleMembership(
    revision: number,
    room?: RoomSnapshot,
    onEmitLeave?: (roomId: string) => void,
  ): boolean {
    if (revision === this.revision) return false;
    if (room && onEmitLeave) {
      onEmitLeave(room.roomId);
    }
    return true;
  }

  applyOperationAck(
    revision: number,
    ackRoom: RoomSnapshot,
    onEmitLeaveIfStale?: (roomId: string) => void,
  ): RoomSnapshot | null {
    if (this.discardStaleMembership(revision, ackRoom, onEmitLeaveIfStale)) {
      return null;
    }
    if (this.room && this.room.roomId === ackRoom.roomId) {
      if (!isNewerRoomSnapshot(this.room, ackRoom)) return null;
    }
    this.room = ackRoom;
    return ackRoom;
  }

  applyRoomUpdate(incomingRoom: RoomSnapshot): RoomSnapshot | null {
    // Late bot/action broadcasts cannot re-open a table after leaving.
    if (!this.room || this.room.roomId !== incomingRoom.roomId) return null;
    if (!isNewerRoomSnapshot(this.room, incomingRoom)) return null;
    this.room = incomingRoom;
    return incomingRoom;
  }
}
