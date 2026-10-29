// Completed-round table wins, with actual terminal hand counts available.
"use client";
import { Layers, Trophy } from "lucide-react";
import type { GameState } from "../types/game";
import PlayerAvatar from "./PlayerAvatar";
import UnoCard from "./UnoCard";
import TableScoreCard from "./TableScoreCard";

export default function RoundSummary({
  game,
  localPlayerId,
}: {
  game: GameState;
  localPlayerId: string;
}) {
  const winner = game.players.find((player) => player.id === game.winnerId);
  if (!winner) return null;
  const players = [
    winner,
    ...game.players.filter((player) => player.id !== winner.id),
  ];
  const finish = (
    <div className="round-scorecard">
      <div className="scorecard-heading">
        <h3>At the finish</h3>
        <span>Cards left</span>
      </div>
      <ul>
        {players.map((player) => (
          <li
            className={player.id === winner.id ? "round-winner-row" : ""}
            key={player.id}
          >
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
              aria-label={
                player.eliminated
                  ? "Knocked out"
                  : `${player.hand.length} ${player.hand.length === 1 ? "card" : "cards"} left`
              }
            >
              {player.eliminated ? (
                <span className="result-player-out">Out</span>
              ) : (
                <>
                  {player.id === winner.id ? (
                    <Trophy size={16} aria-hidden="true" />
                  ) : (
                    <Layers size={16} aria-hidden="true" />
                  )}
                  <strong>{player.hand.length}</strong>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <>
      <div className="round-winner-art" aria-hidden="true">
        <span className="winner-card left">
          <UnoCard
            card={{ id: "result-left", color: "wild", value: "wild" }}
            faceDown
            sizeMultiplier={0.66}
          />
        </span>
        <span className="winner-card right">
          <UnoCard
            card={{ id: "result-right", color: "wild", value: "wild" }}
            faceDown
            sizeMultiplier={0.66}
          />
        </span>
        <PlayerAvatar
          seed={winner.id}
          avatarId={winner.avatarId}
          isBot={winner.isBot}
          large
          expression="celebrate"
        />
        <Trophy className="winner-crown" size={27} />
      </div>
      {winner.hand.length > 0 &&
        game.players.every(
          (player) => player.id === winner.id || player.eliminated,
        ) && <p className="muted round-finish-reason">Last player standing.</p>}
      {game.tableScore?.completedRounds ? (
        <>
          <TableScoreCard
            score={game.tableScore}
            players={game.players}
            localPlayerId={localPlayerId}
          />
          <details className="setup-disclosure">
            <summary>Cards left this round</summary>
            {finish}
          </details>
        </>
      ) : (
        finish
      )}
    </>
  );
}
