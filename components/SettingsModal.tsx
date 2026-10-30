// Preferences use the same controls and typography as the rest of the club.
"use client";
import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  AudioLines,
  SlidersHorizontal,
  User,
  Users,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  Palette,
} from "lucide-react";
import {
  getPlayerName,
  savePlayerName,
  subscribePlayerName,
} from "../lib/playerNames";
import type { GameRules } from "../types/rules";
import { defaultRules } from "../types/rules";
import { getTableMood } from "../lib/rulePresets";
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
import {
  getCardStyleSetting,
  setCardStyleSetting,
  subscribeDisplaySettings,
} from "../lib/displaySettings";
import Modal from "./Modal";
import SettingSelect from "./ui/SettingSelect";
import RuleProfileManager from "./RuleProfileManager";
import BotDifficultyControl from "./BotDifficultyControl";
import AvatarPicker from "./AvatarPicker";
import RulesSummary from "./RulesSummary";
import PlayerProgress from "./PlayerProgress";
const HowToPlayModal = dynamic(() => import("./HowToPlayModal"), {
  loading: () => null,
});
export type SettingsSection =
  "overview" | "profile" | "friends" | "controls" | "appearance" | "audio";
const SECTIONS = [
  {
    id: "profile",
    label: "Profile",
    description: "Name & avatar",
    Icon: User,
  },
  {
    id: "friends",
    label: "Friends",
    description: "People & invitations",
    Icon: Users,
  },
  {
    id: "controls",
    label: "Game rules",
    description: "Modes & house rules",
    Icon: SlidersHorizontal,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Card style",
    Icon: Palette,
  },
  {
    id: "audio",
    label: "Audio",
    description: "Music, effects & voice",
    Icon: AudioLines,
  },
] as const;
interface Props {
  open: boolean;
  initialTab?: SettingsSection;
  friendsContent?: ReactNode;
  friendNotificationCount?: number;
  rules: Partial<GameRules>;
  editingRoom?: boolean;
  readOnlyRules?: boolean;
  savingRules?: boolean;
  onChange: (
    rules: Partial<GameRules>,
  ) => void | boolean | Promise<void | boolean>;
  onClose: () => void;
  onSetUpBots?: () => void;
}
const RULES: Array<{
  key: keyof GameRules;
  group: string;
  label: string;
  description: string;
}> = [
  {
    key: "sevenZero",
    group: "Special cards & moves",
    label: "Seven swap, zero pass",
    description:
      "Sevens swap with a chosen player; zeroes pass everyone’s hand.",
  },
  {
    key: "allowDoublePlaySameNumber",
    group: "Special cards & moves",
    label: "Play matching numbers together",
    description:
      "Tap either matching number to choose a legal pair. The card matching the pile goes first.",
  },
  {
    key: "allowDoublePlayExactMatchOnly",
    group: "Special cards & moves",
    label: "Pairs must match color too",
    description:
      "When matching-number play is enabled, both cards must also share a color.",
  },
  {
    key: "stackDraw2",
    group: "Drawing & stacking",
    label: "Stack draw two",
    description: "Answer a +2 with another +2.",
  },
  {
    key: "stackWild4",
    group: "Drawing & stacking",
    label: "Stack draw four",
    description: "Pass a +4 along with another +4.",
  },
  {
    key: "allowWild4OnDraw2",
    group: "Drawing & stacking",
    label: "Four beats two",
    description: "Answer a +2 with a wild +4.",
  },
  {
    key: "drawUntilPlayable",
    group: "Drawing & stacking",
    label: "Draw until you can play",
    description: "Keep drawing until a card matches.",
  },
  {
    key: "mustDeclareUno",
    group: "UNO & finishing",
    label: "Call UNO",
    description: "One card left? Say it before someone catches you.",
  },
  {
    key: "penalizeFalseCallOut",
    group: "UNO & finishing",
    label: "False call-out penalty",
    description: "A wrong accusation costs two cards.",
  },
  {
    key: "allowJumpIn",
    group: "Special cards & moves",
    label: "Jump in",
    description: "An exact matching card can interrupt another turn.",
  },
  {
    key: "allowDiscardAll",
    group: "Special cards & moves",
    label: "Discard all cards",
    description: "Add a special card that clears one color from your hand.",
  },
  {
    key: "allowShuffleCard",
    group: "Special cards & moves",
    label: "Shuffle hands",
    description: "Add a wild that redistributes everyone’s cards.",
  },
  {
    key: "reverseActsAsSkipInTwoPlayer",
    group: "Table flow",
    label: "Heads-up reverse",
    description: "Reverse acts as Skip with two players.",
  },
  {
    key: "allowStartingActionCard",
    group: "Table flow",
    label: "Start with an action",
    description: "Allow a special card to open the round.",
  },
  {
    key: "canFinishWithActionCard",
    group: "UNO & finishing",
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
        {...({ switch: "" } as Record<string, string>)}
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
  initialTab = "overview",
  rules,
  friendsContent,
  friendNotificationCount = 0,
  onChange,
  onClose,
  readOnlyRules = false,
  savingRules = false,
  onSetUpBots,
}: Props) {
  const [tab, setTab] = useState<SettingsSection>(initialTab);
  const [progressOpen, setProgressOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [audio, setAudio] = useState(getAudioSettings);
  const [music, setMusic] = useState(getMusicContextSettings);
  const cardStyle = useSyncExternalStore(
    subscribeDisplaySettings,
    getCardStyleSetting,
    () => "swiss",
  );
  const savedName = useSyncExternalStore(
    subscribePlayerName,
    getPlayerName,
    () => "You",
  );
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const name = nameDraft ?? savedName;
  const nameChanged = name.trim() !== savedName;
  useEffect(() => {
    const sync = () => {
      setAudio(getAudioSettings());
      setMusic(getMusicContextSettings());
    };
    window.addEventListener("uno:audio-settings", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("uno:audio-settings", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const updateAudio = (partial: Partial<AudioSettings>) => {
    setAudioSettings(partial);
    setAudio(getAudioSettings());
  };
  const saveName = () => {
    if (nameChanged) savePlayerName(name);
    setNameDraft(null);
  };
  const panel = useRef<HTMLDivElement>(null);
  const previousTab = useRef(tab);
  useEffect(() => {
    if (previousTab.current === tab) return;
    previousTab.current = tab;
    panel.current?.focus({ preventScroll: true });
  }, [tab]);
  const close = () => {
    if (nameChanged) saveName();
    onClose();
  };
  return (
    <Modal
      open={open}
      title={
        tab === "overview"
          ? "Settings"
          : (SECTIONS.find((section) => section.id === tab)?.label ??
            "Settings")
      }
      onClose={close}
      onBack={
        tab === "overview"
          ? undefined
          : () => {
              if (nameChanged) saveName();
              setTab("overview");
            }
      }
      className={`settings-modal settings-tone-${getTableMood(rules)}`}
    >
      <div
        key={tab}
        ref={panel}
        role="region"
        tabIndex={0}
        id={`panel-${tab}`}
        aria-label={
          tab === "overview"
            ? "Settings"
            : SECTIONS.find((section) => section.id === tab)?.label
        }
        className={`settings-panel settings-${tab}`}
      >
        {tab === "overview" && (
          <nav className="settings-choices" aria-label="Settings sections">
            {SECTIONS.map((section) => (
              <button key={section.id} onClick={() => setTab(section.id)}>
                <section.Icon size={22} aria-hidden="true" />
                <span>
                  <strong>{section.label}</strong>
                  <small>{section.description}</small>
                </span>
                {section.id === "friends" && friendNotificationCount > 0 && (
                  <span className="count-badge">{friendNotificationCount}</span>
                )}
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ))}
          </nav>
        )}
        {tab === "friends" && friendsContent}
        {tab === "profile" && (
          <>
            <form
              className="profile-name-form"
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
                autoComplete="nickname"
                value={name}
                maxLength={18}
                onBlur={saveName}
                onChange={(e) => {
                  setNameDraft(e.target.value);
                }}
              />
            </form>
            <AvatarPicker />
            <details
              className="settings-disclosure profile-history"
              open={progressOpen}
              onToggle={(e) => setProgressOpen(e.currentTarget.open)}
            >
              <summary>
                Your progress <ChevronDown size={16} aria-hidden="true" />
              </summary>
              {progressOpen && (
                <>
                  <PlayerProgress />
                </>
              )}
            </details>
          </>
        )}
        {tab === "controls" && (
          <>
            {readOnlyRules && <p className="muted">Rules for this table.</p>}
            {readOnlyRules ? (
              <RulesSummary rules={rules} includeBots />
            ) : (
              <fieldset
                className="settings-rule-controls"
                disabled={savingRules}
                aria-label="Table rules"
                aria-busy={savingRules}
              >
                <BotDifficultyControl
                  compact
                  rules={rules}
                  onChange={onChange}
                />
                <RuleProfileManager rules={rules} onChange={onChange}>
                  {(draft, changeDraft) => (
                    <>
                      <label className="preference-row">
                        <span>
                          <strong>Starting hand</strong>
                        </span>
                        <SettingSelect
                          aria-label="Starting hand size"
                          value={
                            draft.startingHandSize ??
                            defaultRules.startingHandSize
                          }
                          onChange={(e) =>
                            changeDraft({
                              ...draft,
                              startingHandSize: Number(e.target.value),
                            })
                          }
                        >
                          {[5, 7, 9, 12].map((n) => (
                            <option key={n} value={n}>
                              {n} cards
                            </option>
                          ))}
                        </SettingSelect>
                      </label>
                      <label className="preference-row">
                        <span>
                          <strong>Missed UNO</strong>
                        </span>
                        <SettingSelect
                          aria-label="Missed UNO penalty"
                          value={
                            draft.missedUnoDrawPenalty ??
                            defaultRules.missedUnoDrawPenalty
                          }
                          onChange={(e) =>
                            changeDraft({
                              ...draft,
                              missedUnoDrawPenalty: Number(e.target.value),
                            })
                          }
                        >
                          {[2, 4, 6, 8].map((n) => (
                            <option key={n} value={n}>
                              {n} cards
                            </option>
                          ))}
                        </SettingSelect>
                      </label>
                      {[...new Set(RULES.map((rule) => rule.group))].map(
                        (group) => (
                          <details
                            className="settings-disclosure settings-rule-group"
                            key={group}
                          >
                            <summary>
                              {group}
                              <ChevronDown size={16} aria-hidden="true" />
                            </summary>
                            <fieldset>
                              <legend className="sr-only">{group}</legend>
                              {RULES.filter(
                                (rule) =>
                                  rule.group === group &&
                                  !(
                                    draft.gameMode === "all_wild" &&
                                    [
                                      "allowDoublePlaySameNumber",
                                      "allowDoublePlayExactMatchOnly",
                                      "sevenZero",
                                      "allowDiscardAll",
                                      "allowShuffleCard",
                                      "drawUntilPlayable",
                                      "allowStartingActionCard",
                                      "canFinishWithActionCard",
                                    ].includes(rule.key)
                                  ) &&
                                  !(
                                    draft.gameMode === "no_mercy" &&
                                    rule.key === "allowStartingActionCard"
                                  ),
                              ).map((r) => (
                                <Toggle
                                  key={r.key}
                                  label={
                                    draft.gameMode === "no_mercy" &&
                                    r.key === "stackWild4"
                                      ? "Stack draw four and higher"
                                      : r.label
                                  }
                                  description={
                                    r.key === "allowDoublePlayExactMatchOnly" &&
                                    !(
                                      draft.allowDoublePlaySameNumber ??
                                      defaultRules.allowDoublePlaySameNumber
                                    )
                                      ? "Enable matching-number play to change this option."
                                      : draft.gameMode === "no_mercy" &&
                                          r.key === "stackWild4"
                                        ? "Respond with an equal or higher draw card, including +6 and +10."
                                        : r.description
                                  }
                                  disabled={
                                    r.key === "allowDoublePlayExactMatchOnly" &&
                                    !(
                                      draft.allowDoublePlaySameNumber ??
                                      defaultRules.allowDoublePlaySameNumber
                                    )
                                  }
                                  checked={Boolean(
                                    draft[r.key] ?? defaultRules[r.key],
                                  )}
                                  onChange={(v) =>
                                    changeDraft({ ...draft, [r.key]: v })
                                  }
                                />
                              ))}
                            </fieldset>
                          </details>
                        ),
                      )}
                    </>
                  )}
                </RuleProfileManager>
              </fieldset>
            )}
            <div className="settings-game-actions">
              {onSetUpBots && (
                <button className="settings-link" onClick={onSetUpBots}>
                  <Bot size={18} aria-hidden="true" /> Bot seats
                </button>
              )}
              <button
                className="settings-link"
                onClick={() => setHelp(true)}
                aria-haspopup="dialog"
              >
                <BookOpen size={18} aria-hidden="true" /> How to play
              </button>
            </div>
          </>
        )}
        {tab === "appearance" && (
          <label className="preference-row">
            <span>
              <strong>Card style</strong>
            </span>
            <SettingSelect
              aria-label="Card style"
              value={cardStyle}
              onChange={(e) =>
                setCardStyleSetting(
                  e.target.value === "nordic" ? "nordic" : "swiss",
                )
              }
            >
              <option value="swiss">Swiss Minimal</option>
              <option value="nordic">Nordic Frost</option>
            </SettingSelect>
          </label>
        )}
        {tab === "audio" && (
          <>
            <Toggle
              label="Mute everything"
              checked={audio.muted}
              onChange={(v) => updateAudio({ muted: v })}
            />
            {audio.muted && (
              <p className="audio-muted-note" role="status">
                Muted. Your preferences are kept.
              </p>
            )}
            <Toggle
              label="Card sounds"
              checked={audio.chimesEnabled}
              onChange={(v) => updateAudio({ chimesEnabled: v })}
            />
            <Toggle
              label="Invitation sounds"
              checked={audio.notificationsEnabled}
              onChange={(v) => updateAudio({ notificationsEnabled: v })}
            />
            <Toggle
              label="Voice announcer"
              checked={audio.voiceInGame}
              onChange={(v) => updateAudio({ voiceInGame: v })}
            />
            <div className="volume-row">
              <label htmlFor="sfx-volume">
                Effects & voice
                <output aria-hidden="true">
                  {Math.round(audio.sfxVolume * 100)}%
                </output>
              </label>
              <input
                id="sfx-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audio.sfxVolume}
                aria-valuetext={`${Math.round(audio.sfxVolume * 100)} percent`}
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
              label="Music"
              checked={music.lobbyEnabled || music.gameEnabled}
              onChange={(v) => {
                setMusicEnabledForContext("lobby", v);
                setMusicEnabledForContext("game", v);
                setMusic(getMusicContextSettings());
              }}
            />
            <div className="volume-row">
              <label htmlFor="music-volume">
                Music volume
                <output aria-hidden="true">
                  {Math.round(audio.musicVolume * 100)}%
                </output>
              </label>
              <input
                id="music-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audio.musicVolume}
                aria-valuetext={`${Math.round(audio.musicVolume * 100)} percent`}
                onChange={(e) =>
                  updateAudio({ musicVolume: Number(e.target.value) })
                }
              />
            </div>
          </>
        )}
      </div>
      <div className="modal-footer">
        {savingRules && (
          <span className="muted" role="status">
            Saving room rules…
          </span>
        )}
        <button className="button primary small" onClick={close}>
          Done
        </button>
      </div>
      {help && (
        <HowToPlayModal
          open
          rules={rules}
          onClose={() => setHelp(false)}
          onPracticeWithBots={onSetUpBots}
        />
      )}
    </Modal>
  );
}
