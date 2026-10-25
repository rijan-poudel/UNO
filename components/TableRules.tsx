// The same pre-game rule controls for local tables and room hosts.
"use client";
import type { GameRules } from "../types/rules";
import RulePresets from "./RulePresets";
import BotDifficultyControl from "./BotDifficultyControl";
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
  return (
    <section className="setup-rules">
      <div className="section-heading">
        <h2>Table rules</h2>
        <button className="text-button" onClick={onOpenRules}>
          Custom rules
        </button>
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
    </section>
  );
}
