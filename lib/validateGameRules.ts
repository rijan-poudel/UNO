// Validate rules at the engine boundary: socket payloads and saved settings are untrusted.
import {
  defaultRules,
  NO_MERCY_RULES,
  ALL_WILD_RULES,
  type GameRules,
} from '../types/rules';
import { MIN_SUPPORTED_MAX_PLAYERS } from './gameLimits';

export function validateGameRules(input: unknown = {}): GameRules {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Game rules must be an object.');
  }
  const values = input as Record<string, unknown>;
  const result = {
    ...(values.gameMode === 'no_mercy'
      ? NO_MERCY_RULES
      : values.gameMode === 'all_wild'
        ? ALL_WILD_RULES
        : defaultRules),
  };
  for (const key of Object.keys(defaultRules) as Array<keyof GameRules>) {
    const value = values[key];
    if (value === undefined) continue;
    if (key === 'gameMode') {
      if (value !== 'classic' && value !== 'no_mercy' && value !== 'all_wild') {
        throw new Error('Game mode must be Classic, No Mercy, or All Wild.');
      }
      result.gameMode = value;
    } else if (key === 'botDifficulty') {
      if (value !== 'casual' && value !== 'standard' && value !== 'tactical') {
        throw new Error('Bot challenge must be Casual, Standard or Tactical.');
      }
      result.botDifficulty = value;
    } else if (key === 'startingHandSize') {
      if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < 1 ||
        value > 20
      ) {
        throw new Error('Starting hands must contain between 1 and 20 cards.');
      }
      result.startingHandSize = value;
    } else if (key === 'maxPlayers') {
      if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < 2 ||
        value > 10
      ) {
        throw new Error(
          'The player limit must be a whole number between 2 and 10.',
        );
      }
      result.maxPlayers = Math.max(MIN_SUPPORTED_MAX_PLAYERS, value);
    } else if (key === 'missedUnoDrawPenalty') {
      if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < 1 ||
        value > 10
      ) {
        throw new Error('Missed UNO penalty must be between 1 and 10 cards.');
      }
      result.missedUnoDrawPenalty = value;
    } else if (key === 'eliminationHandLimit') {
      if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < 0 ||
        value > 50
      ) {
        throw new Error(
          'Elimination hand limit must be between 0 and 50 cards.',
        );
      }
      result.eliminationHandLimit = value;
    } else {
      if (typeof value !== 'boolean')
        throw new Error(`Rule ${key} must be true or false.`);
      result[key] = value;
    }
  }
  if (result.gameMode === 'no_mercy')
    result.maxPlayers = Math.min(result.maxPlayers, 6);
  if (result.gameMode === 'all_wild' && !result.canFinishWithActionCard) {
    throw new Error(
      'All Wild needs action-card finishes because its deck has no numbers.',
    );
  }
  return result;
}
