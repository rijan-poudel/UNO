// Presets compose supported rules; they do not impersonate separate UNO editions.
import { defaultRules, type GameRules } from '../types/rules';
export const RULE_PRESETS = [
  {
    id: 'classic',
    label: 'Classic',
    symbol: '7',
    description: 'The familiar four-color game.',
    rules: { ...defaultRules },
  },
  {
    id: 'stack',
    label: 'Stack party',
    symbol: '+2',
    description: 'Stack +2 on +2 and +4 on +4. Pass the trouble.',
    rules: {
      ...defaultRules,
      stackDraw2: true,
      stackWild4: true,
      allowWild4OnDraw2: false,
    },
  },
  {
    id: 'wild',
    label: 'Wild table',
    symbol: 'reverse',
    description: 'Stacks, jump-ins, shuffle hands and discard all.',
    rules: {
      ...defaultRules,
      stackDraw2: true,
      stackWild4: true,
      allowWild4OnDraw2: true,
      allowJumpIn: true,
      allowShuffleCard: true,
      allowDiscardAll: true,
    },
  },
] satisfies Array<{
  id: string;
  label: string;
  symbol: string;
  description: string;
  rules: GameRules;
}>;
export function matchesPreset(
  rules: Partial<GameRules>,
  preset: GameRules,
): boolean {
  return Object.entries(preset).every(
    ([key, value]) =>
      key === 'startingHandSize' ||
      key === 'maxPlayers' ||
      key === 'botDifficulty' ||
      (rules[key as keyof GameRules] ??
        defaultRules[key as keyof GameRules]) === value,
  );
}

export function getTableMood(
  rules: Partial<GameRules>,
): 'classic' | 'stack' | 'wild' {
  if (rules.allowJumpIn || rules.allowShuffleCard || rules.allowDiscardAll)
    return 'wild';
  return rules.stackDraw2 || rules.stackWild4 || rules.allowWild4OnDraw2
    ? 'stack'
    : 'classic';
}
