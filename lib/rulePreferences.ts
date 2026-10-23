// Shared table defaults and validated device-local rule preferences.
import { defaultRules, type GameRules } from '../types/rules';
import { validateGameRules } from './validateGameRules';

export const SHARED_RULES_KEY = 'uno.shared.rules';
export const RULES_VERSION_KEY = 'uno.shared.rules.version';
export const RULES_VERSION = '2';
export const DEFAULT_TABLE_RULES: GameRules = {
  ...defaultRules,
  maxPlayers: 6,
  stackDraw2: true,
  stackWild4: true,
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
    // Upgrade the old default once. Explicit choices made after this version persist.
    const wasClassic = Object.entries(defaultRules).every(
      ([key, value]) => key === 'maxPlayers' || (saved[key] ?? value) === value,
    );
    return version !== RULES_VERSION && wasClassic
      ? { ...rules, stackDraw2: true, stackWild4: true }
      : rules;
  } catch {
    return { ...DEFAULT_TABLE_RULES };
  }
}
