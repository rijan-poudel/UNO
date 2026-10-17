"use client";
import { useSyncExternalStore } from "react";
import { Flame, Trophy } from "lucide-react";
import {
  parseProgress,
  readProgressSnapshot,
  subscribeProgress,
} from "../lib/playerProgress";
export default function PlayerProgress() {
  const progress = parseProgress(
    useSyncExternalStore(subscribeProgress, readProgressSnapshot, () => ""),
  );
  if (!progress.rounds) return null;
  return (
    <div className="player-progress" aria-label="Your progress on this device">
      <span>
        {progress.rounds} {progress.rounds === 1 ? "round" : "rounds"} played
      </span>
      {progress.wins > 0 && (
        <span>
          <Trophy size={17} />
          {progress.wins} {progress.wins === 1 ? "win" : "wins"}
        </span>
      )}
      {progress.streak > 1 && (
        <span>
          <Flame size={17} />
          {progress.streak} win streak
        </span>
      )}
      <small>On this device</small>
    </div>
  );
}
