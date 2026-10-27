// One native challenge selector for bot setup, room hosts and preferences.
"use client";
import { useId } from "react";
import SettingSelect from "./ui/SettingSelect";
import type { GameRules } from "../types/rules";
import { BOT_DIFFICULTY_OPTIONS } from "../lib/botSupport";

export default function BotDifficultyControl({
  rules,
  onChange,
  compact = false,
}: {
  compact?: boolean;
  rules: Partial<GameRules>;
  onChange: (rules: Partial<GameRules>) => void;
}) {
  const descriptionId = useId();
  const current =
    BOT_DIFFICULTY_OPTIONS.find(
      (option) => option.value === rules.botDifficulty,
    ) ?? BOT_DIFFICULTY_OPTIONS[1];
  return (
    <label className="preference-row">
      <span>
        <strong>Bot challenge</strong>
        <small id={descriptionId} className={compact ? "sr-only" : undefined}>
          {current.description}
        </small>
      </span>
      <SettingSelect
        className="bot-challenge-select"
        aria-label="Bot challenge"
        aria-describedby={descriptionId}
        value={current.value}
        onChange={(event) => {
          const option = BOT_DIFFICULTY_OPTIONS.find(
            (item) => item.value === event.target.value,
          );
          if (option) onChange({ ...rules, botDifficulty: option.value });
        }}
      >
        {BOT_DIFFICULTY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SettingSelect>
    </label>
  );
}
