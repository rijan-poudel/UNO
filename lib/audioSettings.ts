/**
 * Client-side audio preferences (not synced across devices).
 * - Chimes: Web Audio beeps in the browser (no files).
 * - Voice: clips in /public/audios/ (see lib/audiosRegistry.ts).
 */

export const AUDIO_SETTINGS_KEY = "uno.settings.audio";

export interface AudioSettings {
  /** Short synthetic beeps for plays, draws, UNO, etc. */
  chimesEnabled: boolean;
  /** In-game board announcer (plays from game events). */
  voiceInGame: boolean;
  /** Volume for background music (0-1) */
  musicVolume: number;
  /** Volume for sound effects (0-1) */
  sfxVolume: number;
}

export const defaultAudioSettings: AudioSettings = {
  chimesEnabled: true,
  voiceInGame: true,
  musicVolume: 0.7,
  sfxVolume: 0.8,
};

function parseStored(raw: string | null): Partial<AudioSettings> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== "object" || v === null) return {};
    const o = v as Record<string, unknown>;
    const next: Partial<AudioSettings> = {};
    if (typeof o.chimesEnabled === "boolean")
      next.chimesEnabled = o.chimesEnabled;
    if (typeof o.voiceInGame === "boolean") next.voiceInGame = o.voiceInGame;
    if (typeof o.musicVolume === "number") next.musicVolume = o.musicVolume;
    if (typeof o.sfxVolume === "number") next.sfxVolume = o.sfxVolume;
    return next;
  } catch {
    return {};
  }
}

export function uiToStoredVolume(uiValue: number): number {
  const CAP = 0.6;
  const clamped = Math.max(0, Math.min(1, uiValue));
  return CAP * Math.pow(clamped, 2.3);
}

export function storedToUiVolume(stored: number): number {
  const CAP = 0.6;
  const clamped = Math.max(0, Math.min(CAP, stored));
  return Math.pow(clamped / CAP, 1 / 2.3);
}

export function getAudioSettings(): AudioSettings {
  if (typeof window === "undefined") return { ...defaultAudioSettings };
  try {
    const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY);
    return { ...defaultAudioSettings, ...parseStored(raw) };
  } catch {
    return { ...defaultAudioSettings };
  }
}

export function setAudioSettings(partial: Partial<AudioSettings>): void {
  if (typeof window === "undefined") return;
  const next = { ...getAudioSettings(), ...partial };
  try {
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("uno:audio-settings"));
  } catch {
    // Ignore storage errors.
  }
}
