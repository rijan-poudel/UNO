// Preferences use the same controls and typography as the rest of the club.
"use client";
import { useState } from "react";
import {
  AudioLines,
  Copy,
  RotateCcw,
  SlidersHorizontal,
  User,
  Palette,
  Check,
} from "lucide-react";
import { getPlayerName, savePlayerName } from "../lib/playerNames";
import type { GameRules } from "../types/rules";
import { defaultRules } from "../types/rules";
import {
  getAudioSettings,
  getMusicContextSettings,
  setAudioSettings,
  setMusicEnabledForContext,
  type AudioSettings,
} from "../lib/audioSettings";
import {
  primeTableAudioFromUserGesture,
  playTableChime,
} from "../lib/tableChimes";
import Modal from "./Modal";
import RulePresets from "./RulePresets";
interface Props {
  open: boolean;
  initialTab?: "profile" | "controls" | "audio";
  rules: Partial<GameRules>;
  friendCode?: string;
  themeLabel?: string;
  onSelectTheme?: (theme: string) => void;
  onCopyFriendCode?: () => void;
  onChange: (rules: Partial<GameRules>) => void;
  onClose: () => void;
}
const RULES: Array<{
  key: keyof GameRules;
  label: string;
  description: string;
}> = [
  {
    key: "stackDraw2",
    label: "Stack draw two",
    description: "Answer a +2 with another +2.",
  },
  {
    key: "stackWild4",
    label: "Stack draw four",
    description: "Pass a +4 along with another +4.",
  },
  {
    key: "allowWild4OnDraw2",
    label: "Four beats two",
    description: "Answer a +2 with a wild +4.",
  },
  {
    key: "drawUntilPlayable",
    label: "Draw until you can play",
    description: "Keep drawing until a card matches.",
  },
  {
    key: "mustDeclareUno",
    label: "Call UNO",
    description: "One card left? Say it before someone catches you.",
  },
  {
    key: "penalizeFalseCallOut",
    label: "False call-out penalty",
    description: "A wrong accusation costs two cards.",
  },
  {
    key: "allowJumpIn",
    label: "Jump in",
    description: "An exact matching card can interrupt another turn.",
  },
  {
    key: "allowDiscardAll",
    label: "Discard all cards",
    description: "Add a special card that clears one color from your hand.",
  },
  {
    key: "allowShuffleCard",
    label: "Shuffle hands",
    description: "Add a wild that redistributes everyone’s cards.",
  },
  {
    key: "reverseActsAsSkipInTwoPlayer",
    label: "Heads-up reverse",
    description: "Reverse acts as Skip with two players.",
  },
  {
    key: "allowStartingActionCard",
    label: "Start with an action",
    description: "Allow a special card to open the round.",
  },
  {
    key: "canFinishWithActionCard",
    label: "Finish on anything",
    description: "Win with a number, action, or wild card.",
  },
];
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`preference-row ${disabled ? "disabled" : ""}`}>
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true" />
    </label>
  );
}
export default function SettingsModal({
  open,
  initialTab = "controls",
  rules,
  friendCode,
  themeLabel,
  onSelectTheme,
  onCopyFriendCode,
  onChange,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"profile" | "controls" | "audio" | "look">(
    initialTab,
  );
  const [audio, setAudio] = useState(getAudioSettings);
  const [music, setMusic] = useState(getMusicContextSettings);
  const [name, setName] = useState(getPlayerName);
  const [saved, setSaved] = useState(false);
  const updateAudio = (partial: Partial<AudioSettings>) => {
    setAudioSettings(partial);
    setAudio(getAudioSettings());
  };
  const saveName = () => {
    const next = savePlayerName(name);
    setName(next);
    setSaved(true);
  };
  return (
    <Modal
      open={open}
      title="Make it your game."
      onClose={onClose}
      className="settings-modal"
    >
      <div
        className="settings-tabs"
        role="tablist"
        aria-label="Settings categories"
        onKeyDown={(e) => {
          const tabs = ["profile", "controls", "audio", "look"] as const;
          const offset =
            e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (offset || e.key === "Home" || e.key === "End") {
            e.preventDefault();
            const next =
              e.key === "Home"
                ? tabs[0]
                : e.key === "End"
                  ? tabs[3]
                  : tabs[
                      (tabs.indexOf(tab) + offset + tabs.length) % tabs.length
                    ];
            setTab(next);
            document.getElementById(`settings-${next}`)?.focus();
          }
        }}
      >
        {[
          { id: "profile", label: "Profile", Icon: User },
          { id: "controls", label: "Rules", Icon: SlidersHorizontal },
          { id: "audio", label: "Audio", Icon: AudioLines },
          { id: "look", label: "Look", Icon: Palette },
        ].map((t) => (
          <button
            id={`settings-${t.id}`}
            role="tab"
            tabIndex={tab === t.id ? 0 : -1}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
          >
            <t.Icon size={17} />
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`settings-${tab}`}
        className="settings-panel"
      >
        {tab === "look" && (
          <div className="theme-options">
            {[
              { key: "paper", label: "Daylight" },
              { key: "midnight", label: "After hours" },
              { key: "forest", label: "Club green" },
              { key: "sunset", label: "Clay" },
            ].map((t) => (
              <button
                className="theme-option"
                aria-pressed={themeLabel === t.label}
                key={t.key}
                onClick={() => onSelectTheme?.(t.key)}
              >
                <i data-swatch={t.key} />
                {t.label}
                {themeLabel === t.label && <Check size={17} />}
              </button>
            ))}
          </div>
        )}
        {tab === "profile" && (
          <>
            <p className="muted">
              The name your friends will see at the table.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
            >
              <label className="field-label" htmlFor="profile-name">
                Your name
              </label>
              <input
                id="profile-name"
                value={name}
                maxLength={18}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
              />
              <button className="button primary" style={{ marginTop: 16 }}>
                {saved ? "Name saved" : "Save name"}
              </button>
            </form>
            {friendCode && (
              <div className="friend-code-block">
                <span>Your friend code</span>
                <button
                  onClick={onCopyFriendCode}
                  className="code-button"
                  aria-label={`Copy friend code ${friendCode}`}
                >
                  {friendCode}
                  <Copy size={17} />
                </button>
                <p>Share it so friends can invite you to their table.</p>
              </div>
            )}
          </>
        )}
        {tab === "controls" && (
          <>
            <p className="muted">
              Changes apply when you set up your next table. Rematches keep the
              current table’s rules.
            </p>
            <RulePresets rules={rules} onChange={onChange} />
            <label className="preference-row">
              <span>
                <strong>Starting hand</strong>
                <small>Cards dealt to each player.</small>
              </span>
              <select
                aria-label="Starting hand size"
                value={rules.startingHandSize ?? defaultRules.startingHandSize}
                onChange={(e) =>
                  onChange({
                    ...rules,
                    startingHandSize: Number(e.target.value),
                  })
                }
              >
                {[5, 7, 9, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} cards
                  </option>
                ))}
              </select>
            </label>
            {RULES.map((r) => (
              <Toggle
                key={r.key}
                label={r.label}
                description={r.description}
                checked={Boolean(rules[r.key] ?? defaultRules[r.key])}
                onChange={(v) => onChange({ ...rules, [r.key]: v })}
              />
            ))}
            <button
              className="text-button"
              onClick={() => onChange({ ...defaultRules, maxPlayers: 6 })}
            >
              <RotateCcw size={16} />
              Reset to classic rules
            </button>
          </>
        )}
        {tab === "audio" && (
          <>
            <p className="muted">
              Quick card sounds by default. Music and the announcer are
              optional.
            </p>
            <Toggle
              label="Mute everything"
              checked={audio.muted}
              onChange={(v) => updateAudio({ muted: v })}
            />
            <Toggle
              label="Card sounds"
              description="Soft, immediate feedback for plays and draws."
              checked={audio.chimesEnabled}
              onChange={(v) => updateAudio({ chimesEnabled: v })}
            />
            <Toggle
              label="Voice announcer"
              description="Announce special cards. Never delays the next turn."
              checked={audio.voiceInGame}
              onChange={(v) => updateAudio({ voiceInGame: v })}
            />
            <div className="volume-row">
              <label htmlFor="sfx-volume">
                Effects & voice
                <output>{Math.round(audio.sfxVolume * 100)}%</output>
              </label>
              <input
                id="sfx-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audio.sfxVolume}
                onChange={(e) =>
                  updateAudio({ sfxVolume: Number(e.target.value) })
                }
              />
              <button
                className="text-button"
                disabled={
                  audio.muted || !audio.chimesEnabled || audio.sfxVolume <= 0
                }
                onClick={() => {
                  primeTableAudioFromUserGesture();
                  playTableChime("cardPlay");
                }}
              >
                {audio.muted
                  ? "Unmute to preview"
                  : !audio.chimesEnabled
                    ? "Enable card sounds to preview"
                    : audio.sfxVolume <= 0
                      ? "Raise volume to preview"
                      : "Preview card sound"}
              </button>
            </div>
            <Toggle
              label="Music in the lobby"
              checked={music.lobbyEnabled}
              onChange={(v) => {
                setMusicEnabledForContext("lobby", v);
                setMusic(getMusicContextSettings());
              }}
            />
            <Toggle
              label="Music at the table"
              checked={music.gameEnabled}
              onChange={(v) => {
                setMusicEnabledForContext("game", v);
                setMusic(getMusicContextSettings());
              }}
            />
            <div className="volume-row">
              <label htmlFor="music-volume">
                Music volume
                <output>{Math.round(audio.musicVolume * 100)}%</output>
              </label>
              <input
                id="music-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audio.musicVolume}
                onChange={(e) =>
                  updateAudio({ musicVolume: Number(e.target.value) })
                }
              />
            </div>
          </>
        )}
      </div>
      <div className="modal-footer">
        <span className="muted">Saved on this device</span>
        <button className="button secondary small" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
