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
 * Pure room update reconciliation function.
 * Returns the reconciled RoomSnapshot if accepted, or null if rejected.
 * Rejects late broadcasts when outside a room (currentRoom is null), room ID mismatches,
 * and stale snapshots.
 */
export function reconcileRoomUpdate(
  currentRoom: RoomSnapshot | null,
  incomingRoom: RoomSnapshot,
): RoomSnapshot | null {
  // Late bot/action broadcasts cannot re-open a table after leaving.
  if (!currentRoom || currentRoom.roomId !== incomingRoom.roomId) return null;
  if (!isNewerRoomSnapshot(currentRoom, incomingRoom)) return null;
  return incomingRoom;
}

/**
 * Pure operation acknowledgment reconciliation function.
 * Returns the acknowledged RoomSnapshot if accepted, or null if discarded (stale revision,
 * room ID mismatch, or stale snapshot).
 */
export function reconcileAcquisitionAck(
  opRevision: number,
  currentRevision: number,
  ackRoom: RoomSnapshot,
  currentRoom: RoomSnapshot | null = null,
): RoomSnapshot | null {
  if (opRevision !== currentRevision) return null;
  if (currentRoom && currentRoom.roomId === ackRoom.roomId) {
    if (!isNewerRoomSnapshot(currentRoom, ackRoom)) return null;
  }
  return ackRoom;
}

/**
 * Checks whether an operation revision is stale and triggers server leave cleanup if needed.
 */
export function shouldDiscardStaleMembership(
  opRevision: number,
  currentRevision: number,
  room?: RoomSnapshot,
  onEmitLeave?: (roomId: string) => void,
): boolean {
  if (opRevision === currentRevision) return false;
  if (room && onEmitLeave) {
    onEmitLeave(room.roomId);
  }
  return true;
}
