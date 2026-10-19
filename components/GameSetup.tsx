// Local play has one human; every additional seat is a bot.
"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import type { GameRules } from "../types/rules";
import PlayerAvatar from "./PlayerAvatar";
import SetupShell from "./SetupShell";
import { SetupIntro } from "./ui/PageChrome";
import {
  DEFAULT_PLAYER_NAMES as NAMES,
  getSavedPlayerNames,
  getPlayerName,
  savePlayerName,
  subscribePlayerName,
} from "../lib/playerNames";
import TableRules from "./TableRules";
export default function GameSetup({
  onStart,
  controls,
  onBack,
  startingHandSize = 7,
  rules,
  onRulesChange,
  onOpenRules,
}: {
  onStart: (names: string[], bots: boolean[]) => void;
  controls?: ReactNode;
  onBack?: () => void;
  startingHandSize?: number;
  rules: Partial<GameRules>;
  onRulesChange: (rules: Partial<GameRules>) => void;
  onOpenRules: () => void;
}) {
  const [names, setNames] = useState(getSavedPlayerNames);
  useEffect(
    () =>
      subscribePlayerName(() => {
        const name = getPlayerName();
        setNames((current) =>
          current[0] === name ? current : [name, ...current.slice(1)],
        );
      }),
    [],
  );
  useEffect(() => {
    try {
      localStorage.setItem("uno.local.playerNames", JSON.stringify(names));
    } catch {}
  }, [names]);
  return (
    <SetupShell
      subtitle="Play with bots"
      controls={controls}
      footer={
        <>
          <p className="muted">
            {startingHandSize} cards each. First to an empty hand wins.
          </p>
          <button
            className="button primary wide"
            onClick={() => {
              savePlayerName(names[0]);
              onStart(
                names.map((n, i) => n.trim() || NAMES[i]),
                names.map((_, i) => i > 0),
              );
            }}
          >
            Deal me in
            <ArrowRight size={20} />
          </button>
        </>
      }
    >
      <SetupIntro
        title="Take your seat."
        description="Pick your crew. Deal some trouble."
        onBack={onBack}
      />
      <div className="seat-count">
        <div>
          <h2>Seats at the table</h2>
          <p>
            You, plus {names.length - 1} {names.length === 2 ? "bot" : "bots"}.
          </p>
        </div>
        <div className="stepper">
          <button
            className="icon-button"
            aria-label="Remove a bot"
            disabled={names.length <= 2}
            onClick={() => setNames((n) => n.slice(0, -1))}
          >
            <Minus size={18} />
          </button>
          <output aria-live="polite">{names.length}</output>
          <button
            className="icon-button"
            aria-label="Add a bot"
            disabled={names.length >= 6}
            onClick={() => setNames((n) => [...n, NAMES[n.length]])}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      <div className="setup-name-field">
        <label className="field-label" htmlFor="local-player-name">
          Your name
        </label>
        <input
          id="local-player-name"
          value={names[0]}
          maxLength={18}
          autoComplete="nickname"
          onBlur={() => {
            const name = savePlayerName(names[0]);
            setNames((current) => [name, ...current.slice(1)]);
          }}
          onChange={(e) =>
            setNames((n) => n.map((v, i) => (i === 0 ? e.target.value : v)))
          }
        />
      </div>
      <div className="crew-line" aria-label="Your bot opponents">
        {names.slice(1).map((name, i) => (
          <div key={i}>
            <PlayerAvatar seed={String(i + 1)} />
            <span>{name || NAMES[i + 1]}</span>
          </div>
        ))}
      </div>
      <details className="setup-disclosure">
        <summary>Rename bots</summary>
        <div className="seat-list">
          {names.slice(1).map((name, i) => (
            <label className="bot-name-field" key={i}>
              Bot {i + 1}
              <input
                value={name}
                maxLength={18}
                onChange={(e) =>
                  setNames((n) =>
                    n.map((v, j) => (j === i + 1 ? e.target.value : v)),
                  )
                }
              />
            </label>
          ))}
        </div>
      </details>
      <TableRules
        rules={rules}
        onChange={onRulesChange}
        onOpenRules={onOpenRules}
      />
    </SetupShell>
  );
}
