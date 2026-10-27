// Shared table defaults and validated device-local rule preferences.
import { defaultRules, type GameRules } from '../types/rules';
import { validateGameRules } from './validateGameRules';

export const SHARED_RULES_KEY = 'uno.shared.rules';
export const RULES_VERSION_KEY = 'uno.shared.rules.version';
export const RULES_VERSION = '3';
export const DEFAULT_TABLE_RULES: GameRules = {
  ...defaultRules,
  maxPlayers: 6,
};

export function parseRulePreferences(
  raw: string | null,
  version: string | null,
): GameRules {
  if (!raw) return { ...DEFAULT_TABLE_RULES };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return { ...DEFAULT_TABLE_RULES };
    const saved = parsed as Record<string, unknown>;
    const rules = validateGameRules({
      ...DEFAULT_TABLE_RULES,
      ...saved,
      allowShuffleCard:
        saved.allowShuffleCard ?? saved.shuffleHandsOnZero ?? false,
    });
    // Retire the former stacking default without rewriting actual custom rules.
    const wasStackingDefault = Object.entries({
      ...defaultRules,
      stackDraw2: true,
      stackWild4: true,
    }).every(
      ([key, value]) =>
        key === 'maxPlayers' ||
        key === 'botDifficulty' ||
        (saved[key] ?? value) === value,
    );
    return version !== RULES_VERSION && wasStackingDefault
      ? { ...rules, stackDraw2: false, stackWild4: false }
      : rules;
  } catch {
    return { ...DEFAULT_TABLE_RULES };
  }
}
