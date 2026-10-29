// A compact readiness summary; expand only to see individual seats.
"use client";
import { ChevronDown } from "lucide-react";
import type { RoomSnapshot } from "../types/multiplayer";
import PlayerAvatar from "./PlayerAvatar";

export default function RematchStatus({
  room,
  playerId,
  starting,
  connected,
}: {
  room: RoomSnapshot;
  playerId: string | null;
  starting: boolean;
  connected: boolean;
}) {
  const guests = room.players.filter(
    (player) => player.playerId !== room.hostPlayerId,
  );
  const ready = guests.filter(
    (player) => player.isBot || (player.ready && player.connected),
  );
  const status = !connected
    ? "Reconnecting…"
    : starting
      ? "Dealing…"
      : guests.length
        ? `${ready.length} of ${guests.length} ready`
        : "No other players";
  return (
    <details className="rematch-readiness-card">
      <summary className="rematch-card-header">
        <strong>Next round</strong>
        <span role="status">{status}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <ul className="rematch-seats-list" aria-label="Rematch readiness">
        {room.players.map((player) => {
          const state =
            !player.connected && !player.isBot
              ? "disconnected"
              : starting
                ? "starting"
                : player.playerId === room.hostPlayerId ||
                    player.ready ||
                    player.isBot
                  ? "ready"
                  : "waiting";
          const label =
            state === "disconnected"
              ? "Offline"
              : state === "starting"
                ? "Dealing…"
                : player.playerId === room.hostPlayerId
                  ? "Host"
                  : player.isBot
                    ? "Bot · Ready"
                    : player.ready
                      ? "Ready"
                      : "Not ready";
          return (
            <li
              className={`rematch-seat-item status-${state}`}
              key={player.playerId}
            >
              <PlayerAvatar
                seed={player.playerId}
                avatarId={player.avatarId}
                isBot={player.isBot}
              />
              <span className="rematch-seat-name" title={player.name}>
                <strong>{player.name}</strong>
                {player.playerId === playerId && <small>You</small>}
              </span>
              <span className={`rematch-status-badge status-${state}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
