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

import type { GameState } from "../types/game";
import { getAudioSettings } from "./audioSettings";
import { audioUrlsForStem } from "./audiosRegistry";

export type VoiceCategory = "board" | "outside";

type VoiceAudience =
  | { type: "room" }
  | { type: "players"; ids: readonly string[] };

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
  if (!pool.length) return "";
  const idx = Math.abs(seed) % pool.length;
  return pool[idx] ?? pool[0] ?? "";
}

const lastChannelAt = new Map<string, number>();
const audioCache: Record<string, HTMLAudioElement> = {};

function audienceAllows(
  audience: VoiceAudience,
  localPlayerId: string | null,
): boolean {
  if (audience.type === "room") return true;
  if (!localPlayerId) return false;
  return audience.ids.includes(localPlayerId);
}

function channelOk(channel: string, minGapMs: number): boolean {
  const now = Date.now();
  const last = lastChannelAt.get(channel) ?? 0;
  if (now - last < minGapMs) return false;
  lastChannelAt.set(channel, now);
  return true;
}

function categoryEnabled(category: VoiceCategory): boolean {
  const s = getAudioSettings();
  if (category === "board") return s.voiceInGame;
  return false;
}

function tryPlayPath(path: string, volume: number, onFail: () => void): void {
  if (typeof window === "undefined" || typeof Audio === "undefined") return;

  let audio = audioCache[path];
  if (!audio) {
    audio = new Audio(path);
    audio.preload = "auto";
    audioCache[path] = audio;
  }

  audio.volume = Math.min(1, Math.max(0, volume));
  audio.currentTime = 0;

  const onErr = () => {
    audio.removeEventListener("error", onErr);
    onFail();
  };
  audio.addEventListener("error", onErr, { once: true });

  const clearErr = () => audio.removeEventListener("error", onErr);
  audio.addEventListener("playing", clearErr, { once: true });

  const result = audio.play();
  if (result && typeof result.then === "function") {
    void result.catch(() => {
      clearErr();
      onFail();
    });
  }
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
  let index = 0;

  const tryNext = () => {
    if (index >= candidates.length) return;
    const path = candidates[index]!;
    index += 1;
    tryPlayPath(path, volume, tryNext);
  };

  tryNext();
}

// ── Semantic pools (stems ↔ your spoken lines) ───────────────────────────────

const POOLS = {
  gameStart: [
    "shuffle_time",
    "new_hand",
    "switch_up",
    "lets_play",
    "game_on",
    "uno_time",
    "cards_out",
    "lets_go",
  ] as const,
  skip: [
    "skipped",
    "sit_down",
    "nope",
    "bye_bye",
    "not_you",
    "all_skipped",
  ] as const,
  reverse: [
    "reversed",
    "other_way",
    "flip_it",
    "turn_around",
    "switchback",
  ] as const,
  draw2Play: [
    "draw_two",
    "pick_up",
    "two_cards",
    "ouch",
    "sorry_not_sorry",
  ] as const,
  wild4Play: [
    "draw_four",
    "plus_four",
    "oh_no",
    "big_trouble",
    "take_that",
    "yikes",
  ] as const,
  stack: [
    "stack_it",
    "plus_two_more",
    "keep_going",
    "whos_brave",
    "stack_of_four",
    "double_trouble",
    "its_piling_up",
    "no_escape",
  ] as const,
  wild: [
    "wild_card",
    "color_change",
    "pick_one",
    "your_call",
    "wild_out",
  ] as const,
  shuffle: [
    "who_got_what",
    "bye_cards",
    "shuffle_time",
    "switch_decks",
    "flipped",
    "dark_side",
    "light_side",
    "flipped_back",
    "back",
  ] as const,
  discardAll: [
    "dump_them",
    "all_gone",
    "color_purge",
    "out_they_go",
    "table_cleared",
    "everyone_out",
  ] as const,
  nicePlay: ["nice_one", "smooth", "clean_play"] as const,
  unoDeclare: [
    "uno",
    "one_card",
    "almost_out",
    "so_close",
    "watch_out",
  ] as const,
  calloutFalse: ["bad_call", "its_legal", "nope"] as const,
  calloutCaller: ["gotcha"] as const,
  calloutTarget: ["caught"] as const,
  color: ["red", "blue", "yellow", "green"] as const,
  drawVoluntary: ["drawing", "go_fish", "pick_one", "cross_fingers"] as const,
  drawForcedSmall: ["ouch", "pick_up", "two_cards", "yikes"] as const,
  drawForcedBig: [
    "oh_no",
    "big_trouble",
    "buried",
    "stacked_out",
    "too_many_cards",
    "brutal_stack",
  ] as const,
  winSelf: [
    "you_won",
    "winner",
    "first_place",
    "champion",
    "unstoppable",
    "too_easy",
  ] as const,
  loseSelf: [
    "last_place",
    "rough_one",
    "try_again",
    "next_time",
    "shake_it_off",
    "comeback_time",
  ] as const,
} as const;

/**
 * Call once per new `lastAction` (dedupe with the same key you use for SFX).
 */
export function announceBoardFromTransition(
  prev: GameState | null,
  next: GameState,
  localPlayerId: string | null,
  actionKey: string,
): void {
  const action = next.lastAction;
  const seed = hashSeed([actionKey, next.turnCount, action.type]);

  switch (action.type) {
    case "init": {
      const stem = pickStem(POOLS.gameStart, seed);
      playVoiceStem(stem, {
        category: "board",
        audience: { type: "room" },
        localPlayerId,
        channel: "board:game_start",
        minGapMs: 9000,
      });
      break;
    }

    case "play": {
      const { card, playerId, chosenColor, discardAllCount, shuffledHands } =
        action;

      if (shuffledHands) {
        const stem = pickStem(POOLS.shuffle, seed);
        playVoiceStem(stem, {
          category: "board",
          audience: { type: "room" },
          localPlayerId,
          channel: "board:shuffle",
          minGapMs: 6500,
        });
        return;
      }

      if (discardAllCount && discardAllCount > 0) {
        const stem = pickStem(POOLS.discardAll, seed);
        playVoiceStem(stem, {
          category: "board",
          audience: { type: "room" },
          localPlayerId,
          channel: "board:discard_all",
          minGapMs: 5000,
        });
      }

      if (card.value === "skip") {
        const stem = pickStem(POOLS.skip, seed);
        playVoiceStem(stem, {
          category: "board",
          audience: { type: "room" },
          localPlayerId,
          channel: "board:skip",
          minGapMs: 3500,
        });
        return;
      }

      if (card.value === "reverse") {
        const stem = pickStem(POOLS.reverse, seed);
        playVoiceStem(stem, {
          category: "board",
          audience: { type: "room" },
          localPlayerId,
          channel: "board:reverse",
          minGapMs: 3500,
        });
        return;
      }

      if (card.value === "draw2") {
        const stacked = (prev?.pendingDraw ?? 0) > 0;
        const pool = stacked ? POOLS.stack : POOLS.draw2Play;
        const stem = pickStem(pool, seed);
        playVoiceStem(stem, {
          category: "board",
          audience: { type: "room" },
          localPlayerId,
          channel: stacked ? "board:stack" : "board:draw2",
          minGapMs: stacked ? 2800 : 4000,
        });
        return;
      }

      if (card.value === "wild4") {
        const stacked = (prev?.pendingDraw ?? 0) > 0;
        const pool = stacked ? POOLS.stack : POOLS.wild4Play;
        const stem = pickStem(pool, seed);
        playVoiceStem(stem, {
          category: "board",
          audience: { type: "room" },
          localPlayerId,
          channel: stacked ? "board:stack_wild" : "board:wild4",
          minGapMs: stacked ? 2800 : 4500,
        });
        if (chosenColor && chosenColor !== "wild") {
          const colorStem = chosenColor as (typeof POOLS.color)[number];
          if ((POOLS.color as readonly string[]).includes(colorStem)) {
            playVoiceStem(colorStem, {
              category: "board",
              audience: { type: "room" },
              localPlayerId,
              channel: "board:color",
              minGapMs: 1200,
              volume: 0.85,
            });
          }
        }
        return;
      }

      if (card.value === "wild") {
        const stem = pickStem(POOLS.wild, seed);
        playVoiceStem(stem, {
          category: "board",
          audience: { type: "room" },
          localPlayerId,
          channel: "board:wild",
          minGapMs: 4000,
        });
        if (chosenColor && chosenColor !== "wild") {
          const colorStem = chosenColor as (typeof POOLS.color)[number];
          if ((POOLS.color as readonly string[]).includes(colorStem)) {
            playVoiceStem(colorStem, {
              category: "board",
              audience: { type: "room" },
              localPlayerId,
              channel: "board:color",
              minGapMs: 1200,
              volume: 0.85,
            });
          }
        }
        return;
      }

      if (card.value === "shuffle") {
        const stem = pickStem(POOLS.shuffle, seed);
        playVoiceStem(stem, {
          category: "board",
          audience: { type: "room" },
          localPlayerId,
          channel: "board:shuffle_card",
          minGapMs: 6500,
        });
        return;
      }

      // Number / default — occasional praise, only actor hears to avoid spam.
      playVoiceStem(pickStem(POOLS.nicePlay, seed), {
        category: "board",
        audience: { type: "players", ids: [playerId] },
        localPlayerId,
        channel: "board:nice_play",
        minGapMs: 12000,
        probability: 0.22,
        volume: 0.78,
      });
      break;
    }

    case "draw": {
      const { playerId, count } = action;
      if (count <= 0) return;

      const wasForced = (prev?.pendingDraw ?? 0) > 0;
      if (wasForced || count >= 2) {
        const pool = count >= 5 ? POOLS.drawForcedBig : POOLS.drawForcedSmall;
        const stem = pickStem(pool, seed);
        const audience =
          count >= 4
            ? ({ type: "room" } as const)
            : ({ type: "players", ids: [playerId] } as const);
        playVoiceStem(stem, {
          category: "board",
          audience,
          localPlayerId,
          channel: "board:forced_draw",
          minGapMs: 3200,
        });
        return;
      }

      playVoiceStem(pickStem(POOLS.drawVoluntary, seed), {
        category: "board",
        audience: { type: "players", ids: [playerId] },
        localPlayerId,
        channel: "board:voluntary_draw",
        minGapMs: 5000,
        probability: 0.24,
        volume: 0.8,
      });
      break;
    }

    case "declareUno": {
      const stem = pickStem(POOLS.unoDeclare, seed);
      playVoiceStem(stem, {
        category: "board",
        audience: { type: "room" },
        localPlayerId,
        channel: "board:uno",
        minGapMs: 4500,
      });
      break;
    }

    case "callOut": {
      const { callerId, targetId, penalty } = action;
      if (callerId === targetId) {
        const stem = pickStem(POOLS.calloutFalse, seed);
        playVoiceStem(stem, {
          category: "board",
          audience: { type: "players", ids: [callerId] },
          localPlayerId,
          channel: "board:false_call",
          minGapMs: 5000,
        });
        return;
      }

      playVoiceStem(pickStem(POOLS.calloutCaller, seed + 1), {
        category: "board",
        audience: { type: "players", ids: [callerId] },
        localPlayerId,
        channel: "board:callout_caller",
        minGapMs: 2000,
        volume: 0.88,
      });

      playVoiceStem(pickStem(POOLS.calloutTarget, seed + 2), {
        category: "board",
        audience: { type: "players", ids: [targetId] },
        localPlayerId,
        channel: "board:callout_target",
        minGapMs: 2000,
        volume: 0.9,
      });

      if (penalty >= 4) {
        playVoiceStem(pickStem(POOLS.drawForcedBig, seed + 3), {
          category: "board",
          audience: { type: "room" },
          localPlayerId,
          channel: "board:callout_big",
          minGapMs: 6000,
          probability: 0.45,
        });
      }
      break;
    }

    case "pass":
    default:
      break;
  }
}

export function announceBoardWinner(
  winnerId: string,
  localPlayerId: string | null,
  seed: number,
): void {
  if (!localPlayerId) return;
  if (localPlayerId === winnerId) {
    playVoiceStem(pickStem(POOLS.winSelf, seed), {
      category: "board",
      audience: { type: "players", ids: [winnerId] },
      localPlayerId,
      channel: "board:win",
      minGapMs: 8000,
    });
  } else {
    playVoiceStem(pickStem(POOLS.loseSelf, seed), {
      category: "board",
      audience: { type: "players", ids: [localPlayerId] },
      localPlayerId,
      channel: "board:lose",
      minGapMs: 8000,
    });
  }
}

/** Lobby / socket / menus — respects "voice outside game" setting. */
export function announceOutside(
  pool: readonly string[],
  channel: string,
  minGapMs: number,
  seed?: number,
  probability = 1,
): void {
  if (!categoryEnabled("outside")) return;
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

// Fixed pools for UI (stems you listed for non-board contexts)
const UI_CONNECT = ["connecting", "almost_ready", "starting_soon"] as const;
const UI_DISCONNECT = ["disconnected", "waiting"] as const;
const UI_ROOM = ["player_joined", "lets_go", "game_on"] as const;

export function voiceUiConnected(): void {
  announceOutside(
    UI_CONNECT,
    "ui:socket_connect",
    14000,
    hashSeed(["connect", Date.now()]),
    0.55,
  );
}

export function voiceUiDisconnected(): void {
  announceOutside(
    UI_DISCONNECT,
    "ui:socket_disconnect",
    14000,
    hashSeed(["disconnect", Date.now()]),
    0.4,
  );
}

export function voiceUiRoomJoined(): void {
  announceOutside(
    UI_ROOM,
    "ui:room_join",
    10000,
    hashSeed(["room", Date.now()]),
    0.35,
  );
}
