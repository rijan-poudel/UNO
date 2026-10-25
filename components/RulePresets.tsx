// One preset picker for setup and preferences; every choice uses engine-supported rules.
"use client";
import { Check, ChevronsLeftRight } from "lucide-react";
import { RULE_PRESETS, matchesPreset } from "../lib/rulePresets";
import type { GameRules } from "../types/rules";
export default function RulePresets({
  rules,
  onChange,
}: {
  rules: Partial<GameRules>;
  onChange: (rules: Partial<GameRules>) => void;
}) {
  return (
    <div className="rule-presets" role="group" aria-label="Rule presets">
      {RULE_PRESETS.map((p) => (
        <button
          key={p.id}
          className={`rule-preset preset-${p.id}`}
          aria-pressed={matchesPreset(rules, p.rules)}
          onClick={() =>
            onChange({
              ...p.rules,
              startingHandSize: rules.startingHandSize ?? 7,
              botDifficulty: rules.botDifficulty ?? "standard",
            })
          }
        >
          <span className="preset-card" aria-hidden="true">
            {p.id === "wild" ? (
              <ChevronsLeftRight strokeWidth={2.5} />
            ) : (
              p.symbol
            )}
          </span>
          <strong>{p.label}</strong>
          <small>{p.description}</small>
          {matchesPreset(rules, p.rules) && (
            <Check className="preset-selected" size={20} aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  );
}
