"use client";

import { useEffect, useState } from "react";
import type { GameRules } from "../types/rules";
import { defaultRules } from "../types/rules";
import {
  defaultAudioSettings,
  getAudioSettings,
  setAudioSettings,
  type AudioSettings,
  uiToStoredVolume,
  storedToUiVolume,
} from "../lib/audioSettings";
import {
  Blend,
  Crown,
  Equal,
  Gamepad2,
  Hand,
  Layers,
  ListChecks,
  Palette,
  ShieldPlus,
  Shuffle,
  SkipForward,
  User,
  Volume2,
  AudioLines,
  Mic,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const safeStoredToUi = (v: number) =>
  typeof storedToUiVolume === "function" ? storedToUiVolume(v) : v;

const ONLINE_PLAYER_NAME_KEY = "uno.online.playerName";
const READABLE_MUTED = "color-mix(in oklab, var(--ui-text) 72%, transparent)";
const MONKEYTYPE_MONO = "var(--font-monkeytype-mono), 'Roboto Mono', monospace";

function getStoredProfileName(): string {
  if (typeof window === "undefined") return "Player 1";
  try {
    const stored = window.localStorage.getItem(ONLINE_PLAYER_NAME_KEY);
    return stored && stored.trim() ? stored.trim().slice(0, 18) : "Player 1";
  } catch {
    return "Player 1";
  }
}

interface SettingsModalProps {
  open: boolean;
  initialTab?: "profile" | "controls" | "audio";
  rules: Partial<GameRules>;
  friendCode?: string;
  onCopyFriendCode?: () => void;
  onChange: (rules: Partial<GameRules>) => void;
  onClose: () => void;
}

interface RuleToggle {
  key: keyof GameRules;
  label: string;
  description: string;
}

const RULE_TOGGLES: RuleToggle[] = [
  {
    key: "stackDraw2",
    label: "Stack +2",
    description: "Chain draw-two cards together.",
  },
  {
    key: "stackWild4",
    label: "Stack +4",
    description: "Chain wild-four cards together.",
  },
  {
    key: "allowWild4OnDraw2",
    label: "+4 counters +2",
    description: "Wild four can answer a draw two.",
  },
  {
    key: "allowDiscardAll",
    label: "Discard All card",
    description:
      "Enable the Discard All card that drops all cards in that card color.",
  },
  {
    key: "allowShuffleCard",
    label: "Shuffle Hands card",
    description:
      "Enable the wild shuffle card (choose color after shuffling all hands).",
  },
  {
    key: "allowJumpIn",
    label: "Jump-in",
    description: "Play an exact top-card match out of turn.",
  },
  {
    key: "drawUntilPlayable",
    label: "Draw until playable",
    description: "Keep drawing until a card matches.",
  },
  {
    key: "reverseActsAsSkipInTwoPlayer",
    label: "Reverse = Skip (2p)",
    description: "Reverse skips in heads-up.",
  },
  {
    key: "mustDeclareUno",
    label: "Must call UNO",
    description: "Missed UNO can be penalised.",
  },
  {
    key: "penalizeFalseCallOut",
    label: "False call-out penalty",
    description: "Invalid UNO call-out gives the caller +2 cards.",
  },
  {
    key: "allowStartingActionCard",
    label: "Action start card",
    description: "Action card can open the game.",
  },
  {
    key: "allowDoublePlaySameNumber",
    label: "Double play",
    description: "Play two same-number cards at once.",
  },
  {
    key: "canFinishWithActionCard",
    label: "Finish with action card",
    description: "Players can go out on skip, reverse, +2 or wilds.",
  },
];

const RETRO_ICON_BADGE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 14,
  height: 14,
  color: "var(--ui-text)",
  flexShrink: 0,
} as const;

const CONTROL_RULE_ICONS: Partial<Record<keyof GameRules, LucideIcon>> = {
  stackDraw2: Layers,
  stackWild4: ShieldPlus,
  allowWild4OnDraw2: Equal,
  allowDiscardAll: SkipForward,
  allowShuffleCard: Shuffle,
  allowJumpIn: Hand,
  drawUntilPlayable: ListChecks,
  reverseActsAsSkipInTwoPlayer: SkipForward,
  mustDeclareUno: Crown,
  penalizeFalseCallOut: ShieldPlus,
  allowStartingActionCard: Gamepad2,
  allowDoublePlaySameNumber: Layers,
  canFinishWithActionCard: Blend,
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-checked={on}
      role="switch"
      style={{
        width: 40,
        height: 24,
        border: `1.5px solid ${on ? "var(--ui-text)" : "var(--ui-line)"}`,
        background: on ? "var(--ui-text)" : "transparent",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 20 : 3,
          width: 14,
          height: 14,
          background: on ? "var(--ui-bg)" : "var(--ui-muted)",
          transition:
            "left 0.15s cubic-bezier(0.22,1,0.36,1), background 0.15s",
        }}
      />
    </button>
  );
}

export default function SettingsModal({
  open,
  initialTab = "controls",
  rules,
  friendCode,
  onCopyFriendCode,
  onChange,
  onClose,
}: SettingsModalProps) {
  const [tab, setTab] = useState<"profile" | "controls" | "audio">(initialTab);
  const [profileName, setProfileName] = useState(getStoredProfileName);
  const [audio, setAudio] = useState<AudioSettings>(() => ({
    ...defaultAudioSettings,
  }));

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const musicUi = safeStoredToUi(audio.musicVolume);
  const sfxUi = safeStoredToUi(audio.sfxVolume);

  const adjustMusicVolume = (deltaUi: number) => {
    const nextUi = clamp01(Math.round((musicUi + deltaUi) * 10) / 10);
    setAudioSettings({ musicVolume: uiToStoredVolume(nextUi) });
    setAudio(getAudioSettings());
  };

  const adjustSfxVolume = (deltaUi: number) => {
    const nextUi = clamp01(Math.round((sfxUi + deltaUi) * 10) / 10);
    setAudioSettings({ sfxVolume: uiToStoredVolume(nextUi) });
    setAudio(getAudioSettings());
  };

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setAudio(getAudioSettings()), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    try {
      const value = profileName.trim() || "Player 1";
      window.localStorage.setItem(ONLINE_PLAYER_NAME_KEY, value);
    } catch {
      // Ignore storage issues.
    }
  }, [profileName, open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        background: "color-mix(in srgb, var(--ui-bg) 58%, #000 42%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(860px, 100%)",
          height: "min(760px, 90dvh)",
          maxHeight: "90dvh",
          overflow: "hidden",
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-line)",
          padding: 22,
          display: "grid",
          gap: 16,
          gridTemplateRows: "auto auto minmax(0, 1fr)",
          fontFamily: MONKEYTYPE_MONO,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: MONKEYTYPE_MONO,
              fontSize: 34,
              letterSpacing: "0.05em",
              color: "var(--ui-text)",
            }}
          >
            Settings
          </p>
          <button
            onClick={onClose}
            style={{
              border: "1px solid var(--ui-line)",
              background: "transparent",
              color: "var(--ui-muted)",
              padding: "8px 10px",
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Close
          </button>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: READABLE_MUTED,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.5,
          }}
        >
          Grouped by task to keep setup clear
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(170px, 220px) minmax(0, 1fr)",
            gap: 18,
            alignItems: "stretch",
            minHeight: 0,
          }}
        >
          <aside
            style={{
              border: "1px solid var(--ui-line)",
              background: "color-mix(in oklab, var(--ui-bg) 92%, transparent)",
              display: "grid",
              alignContent: "start",
            }}
          >
            <button
              type="button"
              onClick={() => setTab("profile")}
              style={{
                border: "none",
                borderBottom: "1px solid var(--ui-line)",
                background: tab === "profile" ? "var(--ui-text)" : "transparent",
                color: tab === "profile" ? "var(--ui-bg)" : "var(--ui-text)",
                padding: "14px 12px",
                fontFamily: MONKEYTYPE_MONO,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <User size={14} strokeWidth={2.5} />
              Profile
            </button>
            <button
              type="button"
              onClick={() => setTab("controls")}
              style={{
                border: "none",
                borderBottom: "1px solid var(--ui-line)",
                background: tab === "controls" ? "var(--ui-text)" : "transparent",
                color: tab === "controls" ? "var(--ui-bg)" : "var(--ui-text)",
                padding: "14px 12px",
                fontFamily: MONKEYTYPE_MONO,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Gamepad2 size={14} strokeWidth={2.5} />
              Controls
            </button>
            <button
              type="button"
              onClick={() => setTab("audio")}
              style={{
                border: "none",
                background: tab === "audio" ? "var(--ui-text)" : "transparent",
                color: tab === "audio" ? "var(--ui-bg)" : "var(--ui-text)",
                padding: "14px 12px",
                fontFamily: MONKEYTYPE_MONO,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Volume2 size={14} strokeWidth={2.5} />
              Audio
            </button>
          </aside>

          <section
            style={{
              border: "1px solid var(--ui-line)",
              padding: 18,
              display: "grid",
              gap: 14,
              minHeight: 0,
              overflowY: "auto",
            }}
          >

        {tab === "profile" ? (
          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ui-muted)",
              }}
            >
              Player name
            </p>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value.slice(0, 18))}
              maxLength={18}
              placeholder="Player 1"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--ui-line)",
                fontFamily: MONKEYTYPE_MONO,
                fontSize: 15,
                fontWeight: 700,
                color: "var(--ui-text)",
                padding: "4px 0",
                width: "100%",
              }}
            />

            <div style={{ height: 1, background: "var(--ui-line)" }} />

            <p
              style={{
                margin: 0,
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ui-muted)",
              }}
            >
              Friend code
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
              }}
            >
              <div
                style={{
                  border: "1px solid var(--ui-line)",
                  padding: "10px 12px",
                  fontFamily: MONKEYTYPE_MONO,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "var(--ui-text)",
                }}
              >
                {friendCode || "Syncing..."}
              </div>
              <button
                type="button"
                onClick={onCopyFriendCode}
                style={{
                  border: "1px solid var(--ui-line)",
                  background: "transparent",
                  color: "var(--ui-text)",
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Copy
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ui-muted)" }}>
              Share this code with friends so they can send room invites.
            </p>
          </div>
        ) : tab === "audio" ? (
          <div style={{ display: "grid", gap: 12, minWidth: 260 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 16,
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--ui-line)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    fontFamily: MONKEYTYPE_MONO,
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AudioLines size={13} strokeWidth={2.5} />
                  Music volume
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 11,
                    fontFamily: MONKEYTYPE_MONO,
                    color: "var(--ui-muted)",
                    lineHeight: 1.45,
                  }}
                >
                  Controls the background music volume.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => adjustMusicVolume(-0.1)}
                  style={{
                    width: 32,
                    height: 32,
                    border: "1px solid var(--ui-line)",
                    background: "transparent",
                    color: "var(--ui-text)",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  −
                </button>
                <div
                  style={{
                    width: 20,
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                  }}
                >
                  {Math.round(musicUi * 10)}
                </div>
                <button
                  type="button"
                  onClick={() => adjustMusicVolume(0.1)}
                  style={{
                    width: 32,
                    height: 32,
                    border: "1px solid var(--ui-line)",
                    background: "transparent",
                    color: "var(--ui-text)",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 16,
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--ui-line)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    fontFamily: MONKEYTYPE_MONO,
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Volume2 size={13} strokeWidth={2.5} />
                  In-game voice & effects volume
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 11,
                    fontFamily: MONKEYTYPE_MONO,
                    color: "var(--ui-muted)",
                    lineHeight: 1.45,
                  }}
                >
                  Controls voice announcer and card sounds.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => adjustSfxVolume(-0.1)}
                  style={{
                    width: 32,
                    height: 32,
                    border: "1px solid var(--ui-line)",
                    background: "transparent",
                    color: "var(--ui-text)",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  −
                </button>
                <div
                  style={{
                    width: 20,
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                  }}
                >
                  {Math.round(sfxUi * 10)}
                </div>
                <button
                  type="button"
                  onClick={() => adjustSfxVolume(0.1)}
                  style={{
                    width: 32,
                    height: 32,
                    border: "1px solid var(--ui-line)",
                    background: "transparent",
                    color: "var(--ui-text)",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontFamily: MONKEYTYPE_MONO,
                color: "var(--ui-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AudioLines size={13} strokeWidth={2.5} />
              Table chimes
            </p>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 12,
                fontFamily: MONKEYTYPE_MONO,
                color: "var(--ui-muted)",
                lineHeight: 1.45,
              }}
            >
              Short beeps for plays, draws, and special cards — generated in the
              browser, no files needed. Click the board once if you don&apos;t
              hear anything (some browsers block audio until you interact).
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 16,
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--ui-line)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    fontFamily: MONKEYTYPE_MONO,
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AudioLines size={13} strokeWidth={2.5} />
                  Chimes during play
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 11,
                    fontFamily: MONKEYTYPE_MONO,
                    color: "var(--ui-muted)",
                    lineHeight: 1.45,
                  }}
                >
                  Beeps when cards move, UNO is called, someone wins, etc.
                </p>
              </div>
              <Toggle
                on={audio.chimesEnabled}
                onClick={() => {
                  setAudioSettings({ chimesEnabled: !audio.chimesEnabled });
                  setAudio(getAudioSettings());
                }}
              />
            </div>

            <p
              style={{
                margin: "14px 0 0",
                fontSize: 11,
                fontFamily: MONKEYTYPE_MONO,
                color: "var(--ui-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Mic size={13} strokeWidth={2.5} />
              Voice announcer
            </p>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 12,
                fontFamily: MONKEYTYPE_MONO,
                color: "var(--ui-muted)",
                lineHeight: 1.45,
              }}
            >
              Uses your files in{" "}
              <span style={{ fontFamily: MONKEYTYPE_MONO }}>
                /public/audios/
              </span>{" "}
              (exact names are wired in code — you don&apos;t need to rename
              them). Chimes stay very quiet while this is on.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 16,
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--ui-line)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    fontFamily: MONKEYTYPE_MONO,
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Mic size={13} strokeWidth={2.5} />
                  In-game voice
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 11,
                    fontFamily: MONKEYTYPE_MONO,
                    color: "var(--ui-muted)",
                    lineHeight: 1.45,
                  }}
                >
                  During the match (plays, UNO, call-outs, wins). Per device.
                </p>
              </div>
              <Toggle
                on={audio.voiceInGame}
                onClick={() => {
                  setAudioSettings({ voiceInGame: !audio.voiceInGame });
                  setAudio(getAudioSettings());
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontFamily: MONKEYTYPE_MONO,
                color: "var(--ui-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <span style={RETRO_ICON_BADGE_STYLE}>
                  <Gamepad2 size={12} strokeWidth={2.6} />
                </span>
                Controls / House Rules (shared by local and online)
              </span>
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 16,
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--ui-line)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    fontFamily: MONKEYTYPE_MONO,
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={RETRO_ICON_BADGE_STYLE}>
                    <Palette size={12} strokeWidth={2.6} />
                  </span>
                  Starting hand size
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 11,
                    fontFamily: MONKEYTYPE_MONO,
                    color: "var(--ui-muted)",
                    lineHeight: 1.45,
                  }}
                >
                  How many cards each player is dealt at the start.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const cur =
                      rules.startingHandSize ?? defaultRules.startingHandSize;
                    if (cur > 1)
                      onChange({ ...rules, startingHandSize: cur - 1 });
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    border: "1.5px solid var(--ui-line)",
                    background: "transparent",
                    color: "var(--ui-text)",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    fontFamily: MONKEYTYPE_MONO,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    minWidth: 24,
                    textAlign: "center",
                  }}
                >
                  {rules.startingHandSize ?? defaultRules.startingHandSize}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const cur =
                      rules.startingHandSize ?? defaultRules.startingHandSize;
                    if (cur < 15)
                      onChange({ ...rules, startingHandSize: cur + 1 });
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    border: "1.5px solid var(--ui-line)",
                    background: "transparent",
                    color: "var(--ui-text)",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: "grid" }}>
              {RULE_TOGGLES.map(({ key, label, description }, i) => {
                const isOn = !!(
                  rules[key as keyof typeof rules] ?? defaultRules[key]
                );
                const RuleIcon = CONTROL_RULE_ICONS[key] ?? ListChecks;
                return (
                  <div
                    key={key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 16,
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom:
                        i < RULE_TOGGLES.length - 1
                          ? "1px solid var(--ui-line)"
                          : "none",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--ui-text)",
                          fontFamily: MONKEYTYPE_MONO,
                          letterSpacing: "0.04em",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={RETRO_ICON_BADGE_STYLE}>
                          <RuleIcon size={12} strokeWidth={2.6} />
                        </span>
                        {label}
                      </p>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 11,
                          fontFamily: MONKEYTYPE_MONO,
                          color: "var(--ui-muted)",
                          lineHeight: 1.45,
                        }}
                      >
                        {description}
                      </p>
                    </div>
                    <Toggle
                      on={isOn}
                      onClick={() => onChange({ ...rules, [key]: !isOn })}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
          </section>
        </div>
      </div>
    </div>
  );
}

