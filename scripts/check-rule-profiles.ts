import assert from 'node:assert/strict';
import {
  getRuleProfiles,
  saveRuleProfile,
  deleteRuleProfile,
  getRuleSetLabel,
  copyOriginalToCustom,
  duplicateProfile,
  getFavoriteProfileIds,
  saveFavoriteProfileIds,
  toggleFavorite,
  replaceFavorite,
  RULE_PROFILES_KEY,
  getRuleProfilesRevision,
  getServerRuleProfilesRevision,
  setActiveProfileId,
  subscribeRuleProfiles,
} from '../lib/customRuleProfiles';
import { RULE_PRESETS, matchesPreset } from '../lib/rulePresets';
import { defaultRules, NO_MERCY_RULES, ALL_WILD_RULES } from '../types/rules';
import { initializeGame } from '../lib/gameSetup';
import { canPlayCard } from '../lib/gameRules';
import { applyMercyRule } from '../lib/gameActions';
import {
  createStandardUnoDeck,
  createNoMercyDeck,
  createAllWildDeck,
} from '../lib/deck';
import type { GameState } from '../types/game';
const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const data = new Map<string, string>();
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const storageEvents = new EventTarget();
try {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: storageEvents,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    },
  });
  assert.deepEqual(
    RULE_PRESETS.map((p) => p.id),
    ['classic', 'no_mercy', 'all_wild'],
  );
  assert.equal(
    matchesPreset({ ...defaultRules, startingHandSize: 5 }, defaultRules),
    false,
  );
  // Immutability checks for all three original modes
  assert.throws(() =>
    saveRuleProfile('Cannot mutate Classic', defaultRules, 'classic'),
  );
  assert.throws(() =>
    saveRuleProfile('Cannot mutate No Mercy', NO_MERCY_RULES, 'no_mercy'),
  );
  assert.throws(() =>
    saveRuleProfile('Cannot mutate All Wild', ALL_WILD_RULES, 'all_wild'),
  );
  assert.throws(() => deleteRuleProfile('classic'));
  assert.throws(() => deleteRuleProfile('no_mercy'));
  assert.throws(() => deleteRuleProfile('all_wild'));

  const revision = getRuleProfilesRevision();
  assert.equal(
    getRuleProfilesRevision(),
    revision,
    'React snapshot stays stable between mutations',
  );
  assert.equal(getServerRuleProfilesRevision(), 0);
  let firstUpdates = 0;
  let secondUpdates = 0;
  const stopFirst = subscribeRuleProfiles(() => firstUpdates++);
  const stopSecond = subscribeRuleProfiles(() => secondUpdates++);
  const dispatchStorage = (key: string) =>
    storageEvents.dispatchEvent(Object.assign(new Event('storage'), { key }));
  const beforeStorage = getRuleProfilesRevision();
  dispatchStorage('another-setting');
  assert.equal(getRuleProfilesRevision(), beforeStorage);
  dispatchStorage(RULE_PROFILES_KEY);
  assert.equal(
    getRuleProfilesRevision(),
    beforeStorage + 1,
    'One storage event publishes one revision, regardless of subscriber count',
  );
  assert.equal(firstUpdates, 1);
  assert.equal(secondUpdates, 1);
  stopFirst();
  dispatchStorage(RULE_PROFILES_KEY);
  assert.equal(firstUpdates, 1);
  assert.equal(secondUpdates, 2);
  stopSecond();
  const afterUnsubscribe = getRuleProfilesRevision();
  dispatchStorage(RULE_PROFILES_KEY);
  assert.equal(
    getRuleProfilesRevision(),
    afterUnsubscribe,
    'The final unsubscribe removes the shared storage listener',
  );
  // Copying original modes to custom profiles
  const customNoMercy = copyOriginalToCustom('no_mercy', 'My Brutal No Mercy');
  assert.ok(
    getRuleProfilesRevision() > revision,
    'Profile writes publish a new primitive snapshot',
  );
  assert.equal(customNoMercy.rules.gameMode, 'no_mercy');
  assert.equal(customNoMercy.name, 'My Brutal No Mercy');
  setActiveProfileId(customNoMercy.id);
  assert.equal(
    getRuleSetLabel(customNoMercy.rules),
    'My Brutal No Mercy',
    'A selected custom copy keeps its name even when its rules match an original',
  );
  assert.equal(getRuleSetLabel(defaultRules), 'Classic UNO');
  setActiveProfileId('classic');

  // Duplicating custom profile
  const dup = duplicateProfile(customNoMercy.id);
  assert.equal(dup.name, 'My Brutal No Mercy (Copy)');
  assert.equal(dup.rules.gameMode, 'no_mercy');

  // Favorites management
  assert.deepEqual(getFavoriteProfileIds(), [
    'classic',
    'no_mercy',
    'all_wild',
  ]);
  // Cannot favorite a 4th without replacement
  const res = toggleFavorite(customNoMercy.id);
  assert.equal(res.needsReplacement, true);
  // Explicit replacement
  replaceFavorite('classic', customNoMercy.id);
  assert.deepEqual(getFavoriteProfileIds(), [
    customNoMercy.id,
    'no_mercy',
    'all_wild',
  ]);
  // Restore default favorites
  saveFavoriteProfileIds(['classic', 'no_mercy', 'all_wild']);

  const saved = saveRuleProfile('Friday night', {
    ...defaultRules,
    stackDraw2: true,
    allowDiscardAll: true,
  });
  assert.equal(getRuleSetLabel(saved.rules), 'Friday night');
  assert.equal(getRuleSetLabel(defaultRules), 'Classic UNO');
  saveRuleProfile(
    'Friday revised',
    { ...saved.rules, startingHandSize: 12 },
    saved.id,
  );
  assert.equal(getRuleProfiles().length, 3); // customNoMercy, dup, saved
  deleteRuleProfile(saved.id);
  deleteRuleProfile(customNoMercy.id);
  deleteRuleProfile(dup.id);
  assert.equal(getRuleProfiles().length, 0);

  assert.throws(() => saveRuleProfile(' ', defaultRules));
  assert.throws(() =>
    saveRuleProfile('Invalid', { ...defaultRules, startingHandSize: -1 }),
  );
  data.set(RULE_PROFILES_KEY, '{broken');
  assert.deepEqual(getRuleProfiles(), []);
} finally {
  if (originalWindow)
    Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else Reflect.deleteProperty(globalThis, 'localStorage');
}

// ── Deck composition checks ───────────────────────────────────────────────────
assert.equal(
  createStandardUnoDeck().filter(
    (c) => c.value !== 'discardAll' && c.value !== 'shuffle',
  ).length,
  108,
);
assert.equal(
  createNoMercyDeck().length,
  168,
  'No Mercy deck must be exactly 168 cards',
);
assert.equal(
  createAllWildDeck().length,
  112,
  'All Wild deck must be exactly 112 cards',
);

// ── Classic UNO rules checks ──────────────────────────────────────────────────
const game = initializeGame(['One', 'Two'], defaultRules, [false, true]);
const wild4 = { id: 'test-w4', color: 'wild', value: 'wild4' } as const;
const red = { id: 'test-red', color: 'red', value: '3' } as const;
const blue = { id: 'test-blue', color: 'blue', value: '4' } as const;
const classic: GameState = {
  ...game,
  currentPlayerIndex: 0,
  activeColor: 'red',
  pendingDraw: 0,
  discardPile: [{ id: 'top-red', color: 'red', value: '7' }],
  players: game.players.map((p, i) =>
    i ? p : { ...p, hand: [wild4, red, blue] },
  ),
};
assert.equal(
  canPlayCard(wild4, classic, 0),
  false,
  'Classic blocks a +4 while holding the active color',
);
assert.equal(canPlayCard(wild4, { ...classic, activeColor: 'green' }, 0), true);
assert.equal(
  canPlayCard(red, { ...classic, drawnThisTurn: true }, 0),
  false,
  'Classic cannot play an older card after drawing',
);
assert.equal(
  canPlayCard(
    blue,
    { ...classic, activeColor: 'blue', drawnThisTurn: true },
    0,
  ),
  true,
);

// ── UNO Show 'Em No Mercy checks ─────────────────────────────────────────────
const mercyGame = initializeGame(['One', 'Two', 'Three'], NO_MERCY_RULES, [
  false,
  true,
  true,
]);
assert.equal(mercyGame.rules.eliminationHandLimit, 25);
assert.equal(mercyGame.rules.gameMode, 'no_mercy');
// Stacking check: +2 can be stacked by +4, +6, +10
const draw2 = { id: 'm-d2', color: 'red', value: 'draw2' } as const;
const draw4 = { id: 'm-d4', color: 'green', value: 'draw4' } as const;
const draw6 = { id: 'm-d6', color: 'wild', value: 'wildDraw6' } as const;
const draw10 = { id: 'm-d10', color: 'wild', value: 'wildDraw10' } as const;
const mercyPending: GameState = {
  ...mercyGame,
  currentPlayerIndex: 0,
  activeColor: 'red',
  pendingDraw: 2,
  pendingDrawType: 'draw2',
  discardPile: [draw2],
  players: mercyGame.players.map((p, i) =>
    i === 0 ? { ...p, hand: [draw4, draw6, draw10] } : p,
  ),
};
assert.equal(
  canPlayCard(draw4, mercyPending, 0),
  true,
  'In No Mercy, +4 can stack on +2',
);
assert.equal(
  canPlayCard(draw6, mercyPending, 0),
  true,
  'In No Mercy, +6 can stack on +2',
);
assert.equal(
  canPlayCard(draw10, mercyPending, 0),
  true,
  'In No Mercy, +10 can stack on +2',
);

// Mercy rule elimination check
const bigHand = Array.from({ length: 25 }, (_, i) => ({
  id: `card-${i}`,
  color: 'red' as const,
  value: '1' as const,
}));
const eliminatedState = applyMercyRule({
  ...mercyGame,
  players: mercyGame.players.map((p, i) =>
    i === 1 ? { ...p, hand: bigHand } : p,
  ),
});
assert.equal(
  eliminatedState.players[1].eliminated,
  true,
  'Player with 25 cards is eliminated via Mercy Rule',
);
assert.equal(eliminatedState.players[1].hand.length, 0);

// ── UNO All Wild checks ───────────────────────────────────────────────────────
const wildGame = initializeGame(['One', 'Two'], ALL_WILD_RULES, [false, true]);
assert.equal(wildGame.rules.gameMode, 'all_wild');
const wildPlain = { id: 'w-plain', color: 'wild', value: 'wild' } as const;
const wildSkip = { id: 'w-skip', color: 'wild', value: 'skip' } as const;
const wildRev = { id: 'w-rev', color: 'wild', value: 'reverse' } as const;
const wildState: GameState = {
  ...wildGame,
  currentPlayerIndex: 0,
  discardPile: [{ id: 'w-top', color: 'wild', value: 'draw2' }],
  pendingDraw: 0,
  players: wildGame.players.map((p, i) =>
    i === 0 ? { ...p, hand: [wildPlain, wildSkip, wildRev] } : p,
  ),
};
assert.equal(
  canPlayCard(wildPlain, wildState, 0),
  true,
  'In All Wild, plain wild is playable',
);
assert.equal(
  canPlayCard(wildSkip, wildState, 0),
  true,
  'In All Wild, skip is playable',
);
assert.equal(
  canPlayCard(wildRev, wildState, 0),
  true,
  'In All Wild, reverse is playable',
);

console.log(
  'Rule profiles passed: Classic, No Mercy and All Wild modes, immutability, deck compositions, stacking, Mercy Rule, and favorites.',
);
