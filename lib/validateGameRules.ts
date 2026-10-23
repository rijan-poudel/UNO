// Validate rules at the engine boundary: socket payloads and saved settings are untrusted.
import { defaultRules, type GameRules } from '../types/rules';
import { MIN_SUPPORTED_MAX_PLAYERS } from './gameLimits';

export function validateGameRules(input: unknown = {}): GameRules {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Game rules must be an object.');
  }
  const values = input as Record<string, unknown>;
  const result = { ...defaultRules };
  for (const key of Object.keys(defaultRules) as Array<keyof GameRules>) {
    const value = values[key];
    if (value === undefined) continue;
    if (key === 'startingHandSize') {
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
    } else {
      if (typeof value !== 'boolean')
        throw new Error(`Rule ${key} must be true or false.`);
      result[key] = value;
    }
  }
  return result;
}
