// Local play has one human; every additional seat is a bot.
"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import type { GameRules } from "../types/rules";
import RulePresets from "./RulePresets";
import PlayerAvatar from "./PlayerAvatar";
import SetupShell from "./SetupShell";
import { SetupIntro } from "./ui/PageChrome";
const NAMES = ["You", "Cleo", "Jules", "Robin", "Frankie", "Lou"];
function getNames(): string[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem("uno.local.playerNames") ?? "null",
    );
    const profile = localStorage.getItem("uno.online.playerName");
    const names = Array.isArray(stored)
      ? stored.filter((n): n is string => typeof n === "string").slice(0, 6)
      : NAMES.slice(0, 3);
    if (profile) names[0] = profile;
    return names.length >= 2 ? names : NAMES.slice(0, 3);
  } catch {
    return NAMES.slice(0, 3);
  }
}
export default function GameSetup({
  onStart,
  controls,
  onBack,
  startingHandSize = 7,
  rules,
  onRulesChange,
}: {
  onStart: (names: string[], bots: boolean[]) => void;
  controls?: ReactNode;
  onBack?: () => void;
  startingHandSize?: number;
  rules: Partial<GameRules>;
  onRulesChange: (rules: Partial<GameRules>) => void;
}) {
  const [names, setNames] = useState(getNames);
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
            onClick={() =>
              onStart(
                names.map((n, i) => n.trim() || NAMES[i]),
                names.map((_, i) => i > 0),
              )
            }
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
      <div className="seat-list">
        {names.map((name, i) => (
          <div className="seat-row" key={i}>
            <PlayerAvatar seed={String(i)} large />
            <label className="seat-name">
              <span>{i === 0 ? "Your name" : `Bot ${i}`}</span>
              <input
                aria-label={i === 0 ? "Your name" : `Bot ${i} name`}
                value={name}
                maxLength={18}
                onChange={(e) =>
                  setNames((n) =>
                    n.map((v, j) => (j === i ? e.target.value : v)),
                  )
                }
              />
            </label>
            <span className="seat-type">{i === 0 ? "You" : "Bot"}</span>
          </div>
        ))}
      </div>
      <section className="setup-rules">
        <h2>Pick your rules.</h2>
        <RulePresets rules={rules} onChange={onRulesChange} />
        <p className="muted">Fine-tune any rule in Settings.</p>
      </section>
    </SetupShell>
  );
}
