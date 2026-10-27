// A small collection earned from real, device-local completed rounds.
"use client";
import { useSyncExternalStore } from "react";
import {
  Check,
  ChevronDown,
  Flame,
  Layers,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  getProgressMilestones,
  parseProgress,
  readProgressSnapshot,
  subscribeProgress,
  type PlayerProgress as Progress,
} from "../lib/playerProgress";
const MARKS = [Trophy, Sparkles, Layers, Flame];
export default function PlayerProgress() {
  const progress = parseProgress(
    useSyncExternalStore(subscribeProgress, readProgressSnapshot, () => ""),
  );
  return <ProgressCollection progress={progress} />;
}
export function ProgressCollection({ progress }: { progress: Progress }) {
  if (!progress.rounds) {
    return (
      <div
        className="player-progress"
        aria-label="Your progress on this device"
      >
        <p
          className="muted"
          style={{ margin: "8px 0 12px", fontSize: "14px", lineHeight: 1.5 }}
        >
          Play a round to start tracking your record and earning milestones on
          this device.
        </p>
      </div>
    );
  }
  const milestones = getProgressMilestones(progress);
  const earned = milestones.filter((milestone) => milestone.earned).length;
  return (
    <div className="player-progress" aria-label="Your progress on this device">
      <div className="progress-record">
        <span>
          {progress.rounds} {progress.rounds === 1 ? "round" : "rounds"}
        </span>
        <span>
          <Trophy size={15} aria-hidden="true" />
          {progress.wins} {progress.wins === 1 ? "win" : "wins"}
        </span>
        {progress.streak > 1 && (
          <span>
            <Flame size={15} aria-hidden="true" />
            {progress.streak} in a row
          </span>
        )}
        <small>On this device</small>
      </div>
      <details className="milestone-collection">
        <summary>
          <span className="collection-fan" aria-hidden="true">
            {milestones.map((milestone, i) => (
              <i
                key={milestone.id}
                className={milestone.earned ? "collected" : ""}
                style={{ "--stamp-i": i } as React.CSSProperties}
              />
            ))}
          </span>
          <span>
            {earned} of {milestones.length} milestones
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="milestone-stamps">
          {milestones.map((milestone, i) => {
            const Mark = MARKS[i];
            return (
              <div
                className={`milestone-stamp ${milestone.earned ? "earned" : "unearned"}`}
                key={milestone.id}
                aria-label={`${milestone.title}: ${milestone.description}. ${milestone.earned ? "Collected" : `${milestone.current} of ${milestone.target}`}`}
              >
                <Mark size={25} aria-hidden="true" />
                <strong>{milestone.title}</strong>
                <span>
                  {milestone.earned ? (
                    <Check size={14} aria-label="Collected" />
                  ) : (
                    `${milestone.current}/${milestone.target}`
                  )}
                </span>
                <small>{milestone.description}</small>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
