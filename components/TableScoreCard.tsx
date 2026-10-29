// Actual completed-round wins for the current crew; no card-point scoring.
import { Trophy } from "lucide-react";
import type { TableScore } from "../types/game";
import PlayerAvatar from "./PlayerAvatar";

export default function TableScoreCard({
  score,
  players,
  localPlayerId,
}: {
  score?: TableScore;
  players: ReadonlyArray<{
    id: string;
    name: string;
    avatarId?: string;
    isBot?: boolean;
  }>;
  localPlayerId?: string | null;
}) {
  if (!score?.completedRounds) return null;
  const ordered = [...players].sort(
    (a, b) => (score.wins[b.id] ?? 0) - (score.wins[a.id] ?? 0),
  );
  return (
    <section className="round-scorecard" aria-label="Wins at this table">
      <div className="scorecard-heading">
        <h3>At this table</h3>
        <span>Wins</span>
      </div>
      <p className="muted table-score-caption">
        {score.completedRounds} completed{" "}
        {score.completedRounds === 1 ? "round" : "rounds"} · Resets with a new
        crew
      </p>
      <ul>
        {ordered.map((player) => {
          const wins = score.wins[player.id] ?? 0;
          return (
            <li key={player.id}>
              <PlayerAvatar
                seed={player.id}
                avatarId={player.avatarId}
                isBot={player.isBot}
              />
              <span className="result-player-name">
                {player.name}
                {player.id === localPlayerId && player.name !== "You" && (
                  <small>You</small>
                )}
              </span>
              <span
                className="result-card-count"
                role="img"
                aria-label={`${wins} ${wins === 1 ? "win" : "wins"}`}
              >
                <Trophy size={16} aria-hidden="true" />
                <strong>{wins}</strong>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
