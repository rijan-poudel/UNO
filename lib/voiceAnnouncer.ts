/**
 * Arcade-style voice announcer for UNO.
 *
 * Uses your clips in `public/audios/` — exact filenames are mapped in `audiosRegistry.ts`.
 *
 * Audience:
 * - `room` — every client that has the game open (synced by shared game state + same seed).
 * - `players` — only clients whose local seat id is in the list.
 *
 * Cooldowns + probabilistic lines reduce fatigue. Extend POOLS as you add modes/rules.
 */

import type { GameState } from '../types/game';
import { getAudioSettings } from './audioSettings';
import { audioUrlsForStem, STEM_TO_AUDIOS } from './audiosRegistry';

export type VoiceCategory = 'board' | 'outside';

type VoiceAudience =
  { type: 'room' } | { type: 'players'; ids: readonly string[] };

function hashSeed(
  parts: (string | number | boolean | null | undefined)[],
): number {
  let h = 2166136261;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h | 0;
}

function pickStem(pool: readonly string[], seed: number): string {
  if (!pool.length) return '';
  const idx = Math.abs(seed) % pool.length;
  return pool[idx] ?? pool[0] ?? '';
}

const lastChannelAt = new Map<string, number>();
const audioCache: Record<string, HTMLAudioElement> = {};
let activeBoardVoice: HTMLAudioElement | null = null;
let voiceRequest = 0;
let voiceExpiry: number | null = null;

function audienceAllows(
  audience: VoiceAudience,
  localPlayerId: string | null,
): boolean {
  if (audience.type === 'room') return true;
  if (!localPlayerId) return false;
  return audience.ids.includes(localPlayerId);
}

function channelOk(channel: string, minGapMs: number): boolean {
  const now = Date.now();
  const last = lastChannelAt.get(channel) ?? 0;
  if (now - last < minGapMs) {
    lastChannelAt.set(channel, now);
    return false;
  }
  lastChannelAt.set(channel, now);
  return true;
}

function categoryEnabled(category: VoiceCategory): boolean {
  const s = getAudioSettings();
  if (s.muted) return false;
  if (category === 'board') return s.voiceInGame;
  return false;
}

function tryPlayPath(path: string, volume: number, onFail: () => void): void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

  const s = getAudioSettings();
  const effectiveVolume = volume * (s.sfxVolume ?? 0.8);

  let audio = audioCache[path];
  if (!audio) {
    audio = new Audio(path);
    audio.preload = 'auto';
    audioCache[path] = audio;
  }

  audio.volume = Math.min(1, Math.max(0, effectiveVolume));
  audio.currentTime = 0;

  const onErr = () => {
    audio.removeEventListener('error', onErr);
    onFail();
  };
  audio.addEventListener('error', onErr, { once: true });

  const clearErr = () => audio.removeEventListener('error', onErr);
  audio.addEventListener('playing', clearErr, { once: true });

  const result = audio.play();
  if (result && typeof result.then === 'function') {
    void result.catch(() => {
      clearErr();
      onFail();
    });
  }
}

/** Warm the clips while the user is setting up, never on a card's critical path. */
export function preloadBoardVoiceovers(): void {
  if (typeof Audio === 'undefined' || !getAudioSettings().voiceInGame) return;
  for (const stem of Object.keys(STEM_TO_AUDIOS)) {
    const path = audioUrlsForStem(stem)[0];
    if (!path || audioCache[path]) continue;
    const audio = new Audio(path);
    audio.preload = 'auto';
    audioCache[path] = audio;
    audio.load();
  }
}

function playBoardVoicePath(paths: string[], volume: number): void {
  if (typeof Audio === 'undefined' || document.hidden) return;
  stopBoardVoiceover();
  const request = voiceRequest;
  const path = paths[0];
  if (!path) return;
  const audio = audioCache[path] ?? new Audio(path);
  audioCache[path] = audio;
  // A clip that cannot start promptly is dropped, never queued behind the next play.
  activeBoardVoice = audio;
  audio.volume = Math.max(
    0,
    Math.min(1, volume * getAudioSettings().sfxVolume),
  );
  audio.currentTime = 0;
  let started = false;
  const expiry = window.setTimeout(() => {
    if (voiceRequest === request && activeBoardVoice === audio && !started)
      stopBoardVoiceover();
  }, 180);
  voiceExpiry = expiry;
  audio.onplaying = () => {
    started = true;
    window.clearTimeout(expiry);
  };
  audio.onended = () => {
    if (voiceRequest === request && activeBoardVoice === audio)
      activeBoardVoice = null;
  };
  audio.onerror = () => {
    window.clearTimeout(expiry);
    if (voiceRequest === request && activeBoardVoice === audio)
      activeBoardVoice = null;
  };
  void audio.play().catch(() => {
    window.clearTimeout(expiry);
    if (voiceRequest === request && activeBoardVoice === audio)
      activeBoardVoice = null;
  });
}

export function stopBoardVoiceover(): void {
  voiceRequest++;
  if (voiceExpiry) clearTimeout(voiceExpiry);
  voiceExpiry = null;
  const audio = activeBoardVoice;
  activeBoardVoice = null;
  if (!audio) return;
  audio.onplaying = null;
  audio.onended = null;
  audio.onerror = null;
  audio.pause();
  audio.currentTime = 0;
}

/**
 * Play a single voice stem (first readable extension wins).
 */
export function playVoiceStem(
  stem: string,
  opts: {
    category: VoiceCategory;
    audience: VoiceAudience;
    localPlayerId: string | null;
    channel: string;
    minGapMs: number;
    volume?: number;
    probability?: number;
  },
): void {
  if (!stem) return;
  if (!categoryEnabled(opts.category)) return;
  if (!audienceAllows(opts.audience, opts.localPlayerId)) return;

  const p = opts.probability ?? 1;
  if (p < 1) {
    const roll = Math.random();
    if (roll > p) return;
  }

  if (!channelOk(opts.channel, opts.minGapMs)) return;

  const volume = opts.volume ?? 0.92;
  const candidates = audioUrlsForStem(stem);
  if (!candidates.length) return;

  if (opts.category === 'board') {
    playBoardVoicePath(candidates, volume);
    return;
  }

  const path = candidates[0]!;
  tryPlayPath(path, volume, () => {});
}

// ── Semantic pools (stems ↔ your spoken lines) ───────────────────────────────

const POOLS = {
  skip: ['skip'] as const,
  reverse: ['reverse'] as const,
  draw2: ['plus_two'] as const,
  discardAll: ['discard_all'] as const,
  unoDeclare: ['uno'] as const,
  plusFourByColor: {
    red: 'plus_four_red',
    blue: 'plus_four_blue',
    yellow: 'plus_four_yellow',
    green: 'plus_four_green',
  } as const,
  plusByCount: {
    2: 'plus_two',
    4: 'plus_four_generic',
    6: 'plus_six',
    8: 'plus_eight',
    10: 'plus_ten',
    12: 'plus_twelve',
    14: 'plus_fourteen',
    16: 'plus_sixteen',
    18: 'plus_eighteen',
    20: 'plus_twenty',
    22: 'plus_twentytwo',
    24: 'plus_twenty_four',
    28: 'plus_twenty_eight',
    32: 'plus_thirty_two',
  } as const,
  drawByCount: {
    2: 'draw_two',
    4: 'draw_four',
    6: 'draw_six',
    8: 'draw_eight',
    10: 'draw_ten',
    12: 'draw_twelve',
    14: 'draw_fourteen',
    16: 'draw_sixteen',
    18: 'draw_eighteen',
    20: 'draw_twenty',
    22: 'draw_twentytwo',
    24: 'draw_twenty_four',
  } as const,
  colorChangeByColor: {
    red: 'color_change_red',
    blue: 'color_change_blue',
    yellow: 'color_change_yellow',
    green: 'color_change_green',
  } as const,
  wildShuffleByColor: {
    red: 'wild_shuffle_red',
    blue: 'wild_shuffle_blue',
    yellow: 'wild_shuffle_yellow',
    green: 'wild_shuffle_green',
  } as const,
} as const;

function stemForPlusCount(count: number): string | null {
  return POOLS.plusByCount[count as keyof typeof POOLS.plusByCount] ?? null;
}

function stemForDrawCount(count: number): string | null {
  return POOLS.drawByCount[count as keyof typeof POOLS.drawByCount] ?? null;
}

function resolveForcedDrawStem(count: number): string | null {
  const drawStem = stemForDrawCount(count);
  if (drawStem && audioUrlsForStem(drawStem).length > 0) {
    return drawStem;
  }

  // Fallback policy requested: otherwise use plus two / plus four.
  if (count <= 2) {
    return stemForPlusCount(2);
  }
  return stemForPlusCount(4);
}

function normalizeActionColor(
  color: string | null | undefined,
): 'red' | 'blue' | 'yellow' | 'green' | null {
  if (!color || color === 'wild') return null;
  if (
    color === 'red' ||
    color === 'blue' ||
    color === 'yellow' ||
    color === 'green'
  ) {
    return color;
  }
  return null;
}

/**
 * Call once per new `lastAction` (dedupe with the same key you use for SFX).
 */
export function announceBoardFromTransition(
  prev: GameState | null,
  next: GameState,
  localPlayerId: string | null,
  actionKey: string,
): void {
  stopBoardVoiceover();
  if (next.winnerId) {
    stopBoardVoiceover();
    return;
  }

  const action = next.lastAction;
  const seed = hashSeed([actionKey, next.turnCount, action.type]);

  switch (action.type) {
    case 'init': {
      break;
    }

    case 'play': {
      const { card, chosenColor, discardAllCount, shuffledHands } = action;
      if (action.declaredUno) {
        playVoiceStem(pickStem(POOLS.unoDeclare, seed), {
          category: 'board',
          audience: { type: 'room' },
          localPlayerId,
          channel: 'board:uno',
          minGapMs: 4500,
        });
        return;
      }

      if (shuffledHands) {
        const mapped = normalizeActionColor(chosenColor);
        if (mapped) {
          playVoiceStem(POOLS.wildShuffleByColor[mapped], {
            category: 'board',
            audience: { type: 'room' },
            localPlayerId,
            channel: 'board:shuffle',
            minGapMs: 2200,
          });
        }
        return;
      }

      if (discardAllCount && discardAllCount > 0) {
        const stem = pickStem(POOLS.discardAll, seed);
        playVoiceStem(stem, {
          category: 'board',
          audience: { type: 'room' },
          localPlayerId,
          channel: 'board:discard_all',
          minGapMs: 5000,
        });
      }

      if (card.value === 'skip') {
        const stem = pickStem(POOLS.skip, seed);
        playVoiceStem(stem, {
          category: 'board',
          audience: { type: 'room' },
          localPlayerId,
          channel: 'board:skip',
          minGapMs: 2000,
        });
        return;
      }

      if (card.value === 'reverse') {
        const stem = pickStem(POOLS.reverse, seed);
        playVoiceStem(stem, {
          category: 'board',
          audience: { type: 'room' },
          localPlayerId,
          channel: 'board:reverse',
          minGapMs: 2000,
        });
        return;
      }

      if (card.value === 'draw2') {
        playVoiceStem(pickStem(POOLS.draw2, seed), {
          category: 'board',
          audience: { type: 'room' },
          localPlayerId,
          channel: 'board:draw2',
          minGapMs: 2200,
        });
        return;
      }

      if (card.value === 'wild4') {
        const mapped = normalizeActionColor(chosenColor);
        const stem = mapped
          ? POOLS.plusFourByColor[mapped]
          : (stemForPlusCount(4) ??
            pickStem(Object.values(POOLS.plusFourByColor), seed));
        playVoiceStem(stem, {
          category: 'board',
          audience: { type: 'room' },
          localPlayerId,
          channel: 'board:wild4',
          minGapMs: 2200,
        });
        return;
      }

      if (card.value === 'wild') {
        const mapped = normalizeActionColor(chosenColor);
        if (mapped) {
          playVoiceStem(POOLS.colorChangeByColor[mapped], {
            category: 'board',
            audience: { type: 'room' },
            localPlayerId,
            channel: 'board:wild',
            minGapMs: 2200,
          });
        }
        return;
      }

      if (card.value === 'shuffle') {
        const mapped = normalizeActionColor(chosenColor);
        if (mapped) {
          playVoiceStem(POOLS.wildShuffleByColor[mapped], {
            category: 'board',
            audience: { type: 'room' },
            localPlayerId,
            channel: 'board:shuffle_card',
            minGapMs: 2200,
          });
        }
        return;
      }
      break;
    }

    case 'draw': {
      const { count } = action;
      if (count <= 0) return;

      const pendingBeforeDraw = prev?.pendingDraw ?? 0;
      const forcedCount = Math.max(pendingBeforeDraw, count);

      if (forcedCount >= 2) {
        const forcedStem = resolveForcedDrawStem(forcedCount);
        if (forcedStem) {
          playVoiceStem(forcedStem, {
            category: 'board',
            audience: { type: 'room' },
            localPlayerId,
            channel: `board:forced_draw_${forcedCount}`,
            minGapMs: 1000,
          });
        }
        return;
      }

      break;
    }

    case 'declareUno': {
      const stem = pickStem(POOLS.unoDeclare, seed);
      playVoiceStem(stem, {
        category: 'board',
        audience: { type: 'room' },
        localPlayerId,
        channel: 'board:uno',
        minGapMs: 4500,
      });
      break;
    }

    case 'callOut': {
      const stem = pickStem(POOLS.unoDeclare, seed);
      playVoiceStem(stem, {
        category: 'board',
        audience: { type: 'room' },
        localPlayerId,
        channel: 'board:uno_callout',
        minGapMs: 1200,
      });
      break;
    }

    case 'pass':
    default:
      break;
  }
}

export function announceBoardWinner(
  winnerId: string,
  localPlayerId: string | null,
  _seed: number,
): void {
  void winnerId;
  void localPlayerId;
  void _seed;
  stopBoardVoiceover();
}

/** Lobby / socket / menus — respects "voice outside game" setting. */
export function announceOutside(
  pool: readonly string[],
  channel: string,
  minGapMs: number,
  seed?: number,
  probability = 1,
): void {
  if (!categoryEnabled('outside')) return;
  const stem = pickStem(pool, seed ?? Date.now());
  if (!stem) return;
  if (!channelOk(channel, minGapMs)) return;
  if (probability < 1 && Math.random() > probability) return;

  const volume = 0.88;
  const candidates = audioUrlsForStem(stem);
  let index = 0;
  const tryNext = () => {
    if (index >= candidates.length) return;
    const path = candidates[index]!;
    index += 1;
    tryPlayPath(path, volume, tryNext);
  };
  tryNext();
}

// Outside-game voice clips were removed from the asset set.
const UI_CONNECT = [] as const;
const UI_DISCONNECT = [] as const;
const UI_ROOM = [] as const;

export function voiceUiConnected(): void {
  announceOutside(
    UI_CONNECT,
    'ui:socket_connect',
    14000,
    hashSeed(['connect', Date.now()]),
    0.55,
  );
}

export function voiceUiDisconnected(): void {
  announceOutside(
    UI_DISCONNECT,
    'ui:socket_disconnect',
    14000,
    hashSeed(['disconnect', Date.now()]),
    0.4,
  );
}

export function voiceUiRoomJoined(): void {
  announceOutside(
    UI_ROOM,
    'ui:room_join',
    10000,
    hashSeed(['room', Date.now()]),
    0.35,
  );
}
