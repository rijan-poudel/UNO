// Fixed original modes remain immutable; named custom profiles expose house-rule editing.
import type { GameRules } from '../types/rules';
import { validateGameRules } from './validateGameRules';
import { ORIGINAL_MODES, RULE_PRESETS, matchesPreset } from './rulePresets';

export interface RuleProfile {
  id: string;
  name: string;
  rules: GameRules;
  isOriginal?: boolean;
  description?: string;
  symbol?: string;
}

export const RULE_PROFILES_KEY = 'uno.customRuleProfiles.v1';
export const FAVORITE_PROFILES_KEY = 'uno.favoriteProfileIds.v1';
export const ACTIVE_PROFILE_KEY = 'uno.activeProfileId.v1';

export const DEFAULT_FAVORITES: readonly string[] = [
  'classic',
  'no_mercy',
  'all_wild',
];

const ORIGINAL_IDS = new Set(['classic', 'no_mercy', 'all_wild']);

let fallback: RuleProfile[] | null = null;
let fallbackFavorites: string[] | null = null;
let fallbackActive: string | null = null;

const listeners = new Set<() => void>();
let revision = 0;

// React snapshots must be referentially stable between actual store changes.
export function getRuleProfilesRevision(): number {
  return revision;
}
export function getServerRuleProfilesRevision(): number {
  return 0;
}

function notify(): void {
  revision += 1;
  for (const listener of listeners) {
    try {
      listener();
    } catch {}
  }
}

export function subscribeRuleProfiles(listener: () => void): () => void {
  listeners.add(listener);
  const syncStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      [RULE_PROFILES_KEY, FAVORITE_PROFILES_KEY, ACTIVE_PROFILE_KEY].includes(
        event.key,
      )
    ) {
      fallback = null;
      fallbackFavorites = null;
      fallbackActive = null;
      notify();
    }
  };
  if (typeof window !== 'undefined')
    window.addEventListener('storage', syncStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined')
      window.removeEventListener('storage', syncStorage);
  };
}

export function isOriginalModeId(id: string): boolean {
  return ORIGINAL_IDS.has(id);
}

export function getOriginalProfiles(): RuleProfile[] {
  return ORIGINAL_MODES.map((mode) => ({
    id: mode.id,
    name: mode.label,
    rules: { ...mode.rules },
    isOriginal: true,
    description: mode.description,
    symbol: mode.symbol,
  }));
}

export function getRuleProfiles(): RuleProfile[] {
  if (fallback)
    return fallback.map((profile) => ({
      ...profile,
      rules: { ...profile.rules },
    }));
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem(RULE_PROFILES_KEY) ?? '[]',
    );
    if (!Array.isArray(raw)) return [];
    const profiles: RuleProfile[] = [];
    for (const entry of raw.slice(0, 12)) {
      if (
        !entry ||
        typeof entry.id !== 'string' ||
        typeof entry.name !== 'string' ||
        !entry.name.trim() ||
        ORIGINAL_IDS.has(entry.id) ||
        profiles.some((profile) => profile.id === entry.id)
      )
        continue;
      try {
        profiles.push({
          id: entry.id.slice(0, 80),
          name: entry.name.trim().slice(0, 30),
          rules: validateGameRules(entry.rules),
          isOriginal: false,
        });
      } catch {}
    }
    return profiles;
  } catch {
    return [];
  }
}

export function getAllProfiles(): RuleProfile[] {
  return [...getOriginalProfiles(), ...getRuleProfiles()];
}

export function getProfileById(id: string): RuleProfile | undefined {
  const original = ORIGINAL_MODES.find((m) => m.id === id);
  if (original) {
    return {
      id: original.id,
      name: original.label,
      rules: { ...original.rules },
      isOriginal: true,
      description: original.description,
      symbol: original.symbol,
    };
  }
  return getRuleProfiles().find((p) => p.id === id);
}

function persist(profiles: RuleProfile[]): void {
  try {
    localStorage.setItem(RULE_PROFILES_KEY, JSON.stringify(profiles));
    fallback = null;
  } catch {
    fallback = profiles;
  }
  notify();
}

export function saveRuleProfile(
  name: string,
  rules: Partial<GameRules>,
  id?: string,
): RuleProfile {
  if (id && ORIGINAL_IDS.has(id)) {
    throw new Error(
      'Original game modes are immutable and cannot be modified. Copy to a custom profile instead.',
    );
  }
  const label = name.trim().slice(0, 30);
  if (!label) throw new Error('Give this rule profile a name.');
  const profiles = getRuleProfiles();
  if (!profiles.some((profile) => profile.id === id) && profiles.length >= 12)
    throw new Error('You can keep up to 12 custom profiles. Remove one first.');

  const profile: RuleProfile = {
    id:
      id ??
      globalThis.crypto?.randomUUID?.() ??
      `rules-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: label,
    rules: validateGameRules(rules),
    isOriginal: false,
  };
  persist([...profiles.filter((entry) => entry.id !== profile.id), profile]);
  return profile;
}

export function copyOriginalToCustom(
  originalId: string,
  customName?: string,
): RuleProfile {
  const original = ORIGINAL_MODES.find((m) => m.id === originalId);
  if (!original) throw new Error('Original mode not found.');
  const name = customName ?? `${original.shortLabel} Custom`;
  return saveRuleProfile(name, { ...original.rules });
}

export function duplicateProfile(id: string): RuleProfile {
  const existing = getProfileById(id);
  if (!existing) throw new Error('Profile not found.');
  return saveRuleProfile(`${existing.name} (Copy)`, { ...existing.rules });
}

export function deleteRuleProfile(id: string): void {
  if (ORIGINAL_IDS.has(id)) {
    throw new Error('Original game modes cannot be deleted.');
  }
  const favs = getFavoriteProfileIds();
  const wasActive = getActiveProfileId() === id;
  persist(getRuleProfiles().filter((profile) => profile.id !== id));
  // Keep persisted selections valid, not just their read-time fallbacks.
  if (favs.includes(id)) {
    const next = favs.filter((fav) => fav !== id);
    saveFavoriteProfileIds(next.length ? next : ['classic']);
  }
  if (wasActive) {
    setActiveProfileId('classic');
  }
}

// ── Favorites Management ──────────────────────────────────────────────────────

export function getFavoriteProfileIds(): string[] {
  if (fallbackFavorites) return [...fallbackFavorites];
  try {
    const raw = localStorage.getItem(FAVORITE_PROFILES_KEY);
    if (!raw) return [...DEFAULT_FAVORITES];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = [...new Set(parsed)]
        .filter(
          (id): id is string => typeof id === 'string' && !!getProfileById(id),
        )
        .slice(0, 3);
      return valid.length > 0 ? valid : [...DEFAULT_FAVORITES];
    }
    return [...DEFAULT_FAVORITES];
  } catch {
    return [...DEFAULT_FAVORITES];
  }
}

export function saveFavoriteProfileIds(ids: string[]): void {
  const sanitized = [...new Set(ids)]
    .filter((id) => !!getProfileById(id))
    .slice(0, 3);
  if (!sanitized.length) sanitized.push('classic');
  try {
    localStorage.setItem(FAVORITE_PROFILES_KEY, JSON.stringify(sanitized));
    fallbackFavorites = null;
  } catch {
    fallbackFavorites = sanitized;
  }
  notify();
}

export function replaceFavorite(oldId: string, newId: string): void {
  const current = getFavoriteProfileIds();
  const next = current.map((id) => (id === oldId ? newId : id));
  saveFavoriteProfileIds(next);
}

export function toggleFavorite(
  id: string,
  replaceOldId?: string,
): { success: boolean; needsReplacement?: boolean } {
  if (!getProfileById(id)) throw new Error('Profile not found.');
  const current = getFavoriteProfileIds();
  if (current.includes(id)) {
    if (current.length <= 1) {
      throw new Error(
        'You must keep at least one favorite profile for the home screen.',
      );
    }
    saveFavoriteProfileIds(current.filter((fav) => fav !== id));
    return { success: true };
  }

  if (current.length < 3) {
    saveFavoriteProfileIds([...current, id]);
    return { success: true };
  }

  if (replaceOldId && current.includes(replaceOldId)) {
    replaceFavorite(replaceOldId, id);
    return { success: true };
  }

  return { success: false, needsReplacement: true };
}

export function getFavoriteProfiles(): RuleProfile[] {
  const favIds = getFavoriteProfileIds();
  const profiles: RuleProfile[] = [];
  for (const id of favIds) {
    const profile = getProfileById(id);
    if (profile) profiles.push(profile);
  }
  return profiles.length ? profiles : getOriginalProfiles();
}

// ── Active Profile Management ─────────────────────────────────────────────────

export function getActiveProfileId(): string {
  if (fallbackActive) return fallbackActive;
  try {
    const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (id && getProfileById(id)) return id;
    return 'classic';
  } catch {
    return 'classic';
  }
}

export function setActiveProfileId(id: string): void {
  if (!getProfileById(id)) return;
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    fallbackActive = null;
  } catch {
    fallbackActive = id;
  }
  notify();
}

export function getActiveProfile(): RuleProfile {
  return getProfileById(getActiveProfileId()) ?? getOriginalProfiles()[0];
}

export function getRuleSetLabel(rules: Partial<GameRules>): string {
  return (
    RULE_PRESETS.find((preset) => matchesPreset(rules, preset.rules))?.label ??
    getRuleProfiles().find((profile) => matchesPreset(rules, profile.rules))
      ?.name ??
    'Custom rules'
  );
}

/** Send the actual selected profile identity without reclassifying an identical custom copy. */
export function getProfileIdForRules(
  rules?: Partial<GameRules>,
): string | undefined {
  if (!rules) return 'classic';
  const active = getActiveProfile();
  return matchesPreset(rules, active.rules)
    ? active.id
    : RULE_PRESETS.find((preset) => matchesPreset(rules, preset.rules))?.id;
}
