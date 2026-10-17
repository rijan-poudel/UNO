/**
 * Maps game events to trimmed, normalized MP3 clips in public/audio/voice.
 * Regenerate from original recordings with node scripts/prepare-audio.mjs.
 */

export const AUDIOS_PUBLIC_PATH = '/audio/voice';

const EXTS = ['mp3'] as const;

/**
 * Each stem → one or more exact BaseNames as returned by the filesystem (no extension).
 */
export const STEM_TO_AUDIOS: Record<string, readonly string[]> = {
  // Base in-game action clips currently available in /public/audios
  skip: ['Skip'],
  reverse: ['Reverse'],
  plus_two: ['plustwo', 'Draw two!'],
  discard_all: ['Discard All'],
  uno: ['UNO!'],

  // Color-selected wild card clips
  color_change_red: ['Color change to red'],
  color_change_blue: ['Color change to blue'],
  color_change_yellow: ['Color change to Yellow'],
  color_change_green: ['Color change to Green'],

  plus_four_red: ['Plus four Red'],
  plus_four_blue: ['Plus four Blue'],
  plus_four_yellow: ['Plus four Yellow'],
  plus_four_green: ['Plus four Green'],

  // Incoming draw-count clips (prefer these for draw-pile resolutions)
  draw_two: ['Draw two!'],
  draw_four: ['Draw four'],
  draw_six: ['Draw Six'],
  draw_eight: ['Draw eight'],
  draw_ten: ['Draw ten'],
  draw_twelve: ['Draw twelve'],
  draw_fourteen: ['Draw fourteen'],
  draw_sixteen: ['Draw sixteen'],
  draw_eighteen: ['Draw eighteen'],
  draw_twenty: ['Draw twenty'],
  draw_twentytwo: ['Draw twentytwo'],
  draw_twenty_four: ['Draw twentyFour'],

  // Generic plus fallbacks still used when no draw-count clip exists.
  plus_four_generic: ['Draw four'],

  wild_shuffle_red: ['Wild shuffle red'],
  wild_shuffle_blue: ['Wild shuffle Blue'],
  wild_shuffle_yellow: ['Wild shuffle Yellow'],
  wild_shuffle_green: ['Wild shuffle Green'],
};

export function audioUrlsForStem(stem: string): string[] {
  const basenames = STEM_TO_AUDIOS[stem];
  if (!basenames?.length) return [];

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const base of basenames) {
    for (const ext of EXTS) {
      const path = `${AUDIOS_PUBLIC_PATH}/${encodeURIComponent(base)}.${ext}`;
      if (!seen.has(path)) {
        seen.add(path);
        urls.push(path);
      }
    }
  }
  return urls;
}

/** Stems referenced anywhere in voice rules (for type-safety checks in dev). */
export type KnownAudioStem = keyof typeof STEM_TO_AUDIOS;
