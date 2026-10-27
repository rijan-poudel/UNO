// Fixed official UNO modes and table mood derivation.
import {
  defaultRules,
  CLASSIC_RULES,
  NO_MERCY_RULES,
  ALL_WILD_RULES,
  type GameRules,
} from '../types/rules';

export const ORIGINAL_MODES = [
  {
    id: 'classic',
    label: 'Classic UNO',
    shortLabel: 'Classic',
    symbol: '7',
    description:
      'Standard 108-card deck, matching color or number, single draws.',
    rules: { ...CLASSIC_RULES },
  },
  {
    id: 'no_mercy',
    label: 'UNO Show ’Em No Mercy',
    shortLabel: 'No Mercy',
    symbol: '+10',
    description:
      '168-card deck, draw stacking, 7 swap, 0 pass, and 25-card Mercy elimination.',
    rules: { ...NO_MERCY_RULES },
  },
  {
    id: 'all_wild',
    label: 'UNO All Wild',
    shortLabel: 'All Wild',
    symbol: '✦',
    description:
      '112 all-wild cards, targeted draws, double skips, and forced hand swaps.',
    rules: { ...ALL_WILD_RULES },
  },
] as const;

export const RULE_PRESETS = ORIGINAL_MODES;

export function matchesPreset(
  rules: Partial<GameRules>,
  preset: GameRules,
): boolean {
  return Object.entries(preset).every(
    ([key, value]) =>
      key === 'maxPlayers' ||
      key === 'botDifficulty' ||
      (rules[key as keyof GameRules] ??
        defaultRules[key as keyof GameRules]) === value,
  );
}

export function getTableMood(
  rules: Partial<GameRules>,
): 'classic' | 'no-mercy' | 'all-wild' | 'stack' | 'wild' {
  if (rules.gameMode === 'no_mercy') return 'no-mercy';
  if (rules.gameMode === 'all_wild') return 'all-wild';
  if (rules.allowJumpIn || rules.allowShuffleCard || rules.allowDiscardAll)
    return 'wild';
  if (rules.stackDraw2 || rules.stackWild4 || rules.allowWild4OnDraw2)
    return 'stack';
  return 'classic';
}
