// Optional, engine-backed examples. No clocks, bots, progress or persistence run here.
"use client";
import { useEffect, useRef, useState } from "react";
import type { Card, CardColor } from "../types/card";
import { playCard, chooseRouletteColor } from "../lib/gameActions";
import {
  canPlayCard,
  getCardPlayBlockReason,
  getStackResponseLabel,
} from "../lib/gameRules";
import {
  createPracticeRound,
  PRACTICE_LESSONS,
  type PracticeMode,
  type PracticeKind,
} from "../lib/practiceRounds";
import UnoCard from "./UnoCard";
import PlayerAvatar from "./PlayerAvatar";
import styles from "./PracticeHand.module.css";

function Example({
  mode,
  kind,
  prompt,
  onNext,
}: {
  mode: PracticeMode;
  kind: PracticeKind;
  prompt: string;
  onNext: () => void;
}) {
  const [game, setGame] = useState(() => createPracticeRound(mode, kind));
  const [selected, setSelected] = useState<Card | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const hand = useRef<HTMLDivElement>(null);
  const targets = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected)
      targets.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
  }, [selected]);
  const cancelTarget = () => {
    setSelected(null);
    setMessage("");
    if (selected)
      hand.current
        ?.querySelector<HTMLButtonElement>(
          `[data-practice-card="${selected.id}"] button`,
        )
        ?.focus({ preventScroll: true });
  };
  const reset = () => {
    setGame(createPracticeRound(mode, kind));
    setSelected(null);
    setMessage("");
    setDone(false);
  };
  const play = (card: Card, targetPlayerId?: string) => {
    if (done) return;
    if (
      kind !== "stack" &&
      card.value !==
        (kind === "swap"
          ? mode === "no_mercy"
            ? "7"
            : "wildForcedSwap"
          : kind === "target"
            ? "wildTargetDraw2"
            : "wildSkip2")
    ) {
      setMessage("Try the special card in this example.");
      return;
    }
    if (!canPlayCard(card, game, 0)) {
      setMessage(
        getCardPlayBlockReason(game, 0, card) ??
          "That card cannot answer this play.",
      );
      return;
    }
    if ((kind === "swap" || kind === "target") && !targetPlayerId) {
      setSelected(card);
      setMessage("Choose a player below.");
      return;
    }
    try {
      const next = playCard(
        game,
        0,
        card.id,
        mode === "no_mercy" && card.color === "wild" ? "red" : undefined,
        { targetPlayerId },
      );
      setGame(next);
      setSelected(null);
      setDone(true);
      const target = next.players.find(
        (player) => player.id === targetPlayerId,
      );
      setMessage(
        kind === "stack"
          ? `${next.pendingDraw} cards total. The next player needs ${getStackResponseLabel(next)}. This example keeps red active.`
          : kind === "swap"
            ? `You now have ${next.players[0].hand.length} cards. ${target?.name} has ${target?.hand.length}.`
            : kind === "target"
              ? `${target?.name} took two and keeps their next turn. Next: ${next.players[next.currentPlayerIndex].name}.`
              : `Both other players were skipped. It’s your turn again.`,
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  };
  const roulette = (color: CardColor) => {
    if (done) return;
    const next = chooseRouletteColor(game, 0, color);
    setGame(next);
    setDone(true);
    setMessage(
      `You took ${next.lastAction.type === "draw" ? next.lastAction.count : 0} cards, including the matching card. Next: ${next.players[next.currentPlayerIndex].name}.`,
    );
  };
  return (
    <div
      className={styles.example}
      onKeyDown={(event) => {
        if (selected && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          cancelTarget();
        }
      }}
    >
      <p>{prompt}</p>
      <div className={styles.table} aria-label="Practice table">
        <UnoCard
          card={game.discardPile[game.discardPile.length - 1]}
          sizeMultiplier={0.6}
        />
        <span>
          {kind === "stack"
            ? `${game.pendingDraw} cards waiting`
            : "Last played"}
        </span>
      </div>
      {kind === "roulette" && !done ? (
        <div
          className={styles.colors}
          role="group"
          aria-label="Choose your roulette color"
        >
          {(["red", "yellow", "green", "blue"] as const).map((color) => (
            <button
              key={color}
              className="button secondary"
              onClick={() => roulette(color)}
            >
              <i
                style={{ background: `var(--ui-accent-${color})` }}
                aria-hidden="true"
              />
              {color}
            </button>
          ))}
        </div>
      ) : (
        <div
          className={styles.hand}
          aria-label="Your practice cards"
          ref={hand}
        >
          {game.players[0].hand.map((card) => (
            <span key={card.id} data-practice-card={card.id}>
              <UnoCard
                card={card}
                sizeMultiplier={0.65}
                disabled={!!selected}
                onClick={done ? undefined : () => play(card)}
              />
            </span>
          ))}
        </div>
      )}
      {selected && !done && (
        <div
          className={styles.targets}
          ref={targets}
          role="group"
          aria-label="Choose a practice player"
        >
          {game.players.slice(1).map((player) => (
            <button
              className="button secondary"
              key={player.id}
              onClick={() => play(selected, player.id)}
            >
              <PlayerAvatar seed={player.id} isBot />{" "}
              <span>
                {player.name}
                <small>{player.hand.length} cards</small>
              </span>
            </button>
          ))}
          <button className="text-button" onClick={cancelTarget}>
            Cancel
          </button>
        </div>
      )}
      <p className={styles.result} role="status">
        {message || "Original edition practice. Your round stays unchanged."}
      </p>
      <div className={styles.actions}>
        <button className="button secondary small" onClick={reset}>
          Try again
        </button>
        {done && (
          <button className="button primary small" onClick={onNext} autoFocus>
            Next example
          </button>
        )}
      </div>
    </div>
  );
}

export default function PracticeHand({ mode }: { mode: PracticeMode }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const lessonButtons = useRef<HTMLDivElement>(null);
  const lessons = PRACTICE_LESSONS[mode];
  const lesson = lessons[index];
  return (
    <details
      className={styles.practice}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Try a practice hand</summary>
      {open && (
        <>
          <div
            className={styles.lessons}
            ref={lessonButtons}
            role="group"
            aria-label="Practice examples"
          >
            {lessons.map((item, i) => (
              <button
                key={item.kind}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              >
                {item.title}
              </button>
            ))}
          </div>
          <Example
            key={`${mode}-${lesson.kind}`}
            mode={mode}
            {...lesson}
            onNext={() => {
              const next = (index + 1) % lessons.length;
              setIndex(next);
              requestAnimationFrame(() =>
                lessonButtons.current
                  ?.querySelectorAll<HTMLButtonElement>("button")
                  [next]?.focus({ preventScroll: true }),
              );
            }}
          />
        </>
      )}
    </details>
  );
}
