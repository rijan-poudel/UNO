/**
 * Client-side audio preferences (not synced across devices).
 * - Card effects: a cached recording with an immediate Web Audio fallback.
 * - Voice: clips in /public/audios/ (see lib/audiosRegistry.ts).
 */

export const AUDIO_SETTINGS_KEY = 'uno.settings.audio';
export const MUSIC_CONTEXT_SETTINGS_KEY = 'uno.settings.musicContext';

export type MusicContext = 'lobby' | 'game';

export interface MusicContextSettings {
  lobbyEnabled: boolean;
  gameEnabled: boolean;
}

export interface AudioSettings {
  /** Master mute, applied to effects, voice, and music. */
  muted: boolean;
  /** Immediate card texture and short tonal signatures for game events. */
  chimesEnabled: boolean;
  /** In-game board announcer (plays from game events). */
  voiceInGame: boolean;
  /** Volume for background music (0-1) */
  musicVolume: number;
  /** Volume for sound effects (0-1) */
  sfxVolume: number;
}

export const defaultAudioSettings: AudioSettings = {
  muted: false,
  chimesEnabled: true,
  voiceInGame: false,
  musicVolume: 0.24,
  sfxVolume: 0.55,
};

export const defaultMusicContextSettings: MusicContextSettings = {
  lobbyEnabled: false,
  gameEnabled: false,
};

function parseStored(raw: string | null): Partial<AudioSettings> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== 'object' || v === null) return {};
    const o = v as Record<string, unknown>;
    const next: Partial<AudioSettings> = {};
    if (typeof o.muted === 'boolean') next.muted = o.muted;
    if (typeof o.chimesEnabled === 'boolean')
      next.chimesEnabled = o.chimesEnabled;
    if (typeof o.voiceInGame === 'boolean') next.voiceInGame = o.voiceInGame;
    if (typeof o.musicVolume === 'number' && Number.isFinite(o.musicVolume))
      next.musicVolume = Math.max(0, Math.min(1, o.musicVolume));
    if (typeof o.sfxVolume === 'number' && Number.isFinite(o.sfxVolume))
      next.sfxVolume = Math.max(0, Math.min(1, o.sfxVolume));
    return next;
  } catch {
    return {};
  }
}

function parseMusicContextStored(
  raw: string | null,
): Partial<MusicContextSettings> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== 'object' || v === null) return {};
    const o = v as Record<string, unknown>;
    const next: Partial<MusicContextSettings> = {};
    if (typeof o.lobbyEnabled === 'boolean') next.lobbyEnabled = o.lobbyEnabled;
    if (typeof o.gameEnabled === 'boolean') next.gameEnabled = o.gameEnabled;
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
  if (typeof window === 'undefined') return { ...defaultAudioSettings };
  try {
    const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY);
    return { ...defaultAudioSettings, ...parseStored(raw) };
  } catch {
    return { ...defaultAudioSettings };
  }
}

export function setAudioSettings(partial: Partial<AudioSettings>): void {
  if (typeof window === 'undefined') return;
  const next = { ...getAudioSettings(), ...partial };
  try {
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('uno:audio-settings'));
  } catch {
    // Ignore storage errors.
  }
}

export function getMusicContextSettings(): MusicContextSettings {
  if (typeof window === 'undefined') return { ...defaultMusicContextSettings };
  try {
    const raw = window.localStorage.getItem(MUSIC_CONTEXT_SETTINGS_KEY);
    return { ...defaultMusicContextSettings, ...parseMusicContextStored(raw) };
  } catch {
    return { ...defaultMusicContextSettings };
  }
}

export function isMusicEnabledForContext(context: MusicContext): boolean {
  const settings = getMusicContextSettings();
  return context === 'game' ? settings.gameEnabled : settings.lobbyEnabled;
}

export function setMusicEnabledForContext(
  context: MusicContext,
  enabled: boolean,
): void {
  if (typeof window === 'undefined') return;
  const next = {
    ...getMusicContextSettings(),
    ...(context === 'game'
      ? { gameEnabled: enabled }
      : { lobbyEnabled: enabled }),
  };
  try {
    window.localStorage.setItem(
      MUSIC_CONTEXT_SETTINGS_KEY,
      JSON.stringify(next),
    );
    window.dispatchEvent(new CustomEvent('uno:audio-settings'));
  } catch {
    // Ignore storage errors.
  }
}
