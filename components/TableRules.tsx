// The same pre-game rule controls for local tables and room hosts.
"use client";
import { useState } from "react";
import type { GameRules } from "../types/rules";
import RulePresets from "./RulePresets";
import BotDifficultyControl from "./BotDifficultyControl";
import HowToPlayModal from "./HowToPlayModal";

export default function TableRules({
  rules,
  onChange,
  onOpenRules,
  showBotChallenge = true,
}: {
  rules: Partial<GameRules>;
  onChange: (rules: Partial<GameRules>) => void;
  onOpenRules: () => void;
  showBotChallenge?: boolean;
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <section className="setup-rules">
      <div className="section-heading">
        <h2>Table rules</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="text-button"
            onClick={() => setShowHelp(true)}
          >
            How to play
          </button>
          <button type="button" className="text-button" onClick={onOpenRules}>
            Custom rules
          </button>
        </div>
      </div>
      <RulePresets rules={rules} onChange={onChange} />
      <label className="starting-hand">
        Cards each
        <select
          aria-label="Cards each"
          value={rules.startingHandSize ?? 7}
          onChange={(e) =>
            onChange({ ...rules, startingHandSize: Number(e.target.value) })
          }
        >
          {[5, 7, 9, 12].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      {showBotChallenge && (
        <BotDifficultyControl rules={rules} onChange={onChange} />
      )}
      {showHelp && (
        <HowToPlayModal
          open={showHelp}
          rules={rules}
          onClose={() => setShowHelp(false)}
          inGame={true}
        />
      )}
    </section>
  );
}
