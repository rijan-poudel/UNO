// House-rule combinations belong to engine checks, never the preset menu.
import { defaultRules, type GameRules } from '../types/rules';
export const RULE_SCENARIOS = [
  {
    id: 'classic',
    label: 'Classic',
    symbol: '7',
    description: 'Standard deck, seven cards each, no draw stacking.',
    rules: { ...defaultRules },
  },
  {
    id: 'stack',
    label: 'Stacking house rules',
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
    label: 'Special-card house rules',
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
