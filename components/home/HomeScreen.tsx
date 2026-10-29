// A quiet game title screen: one immediate Play action and room choices.
"use client";
import {
  useSyncExternalStore,
  useId,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowRight, Info } from "lucide-react";
import type { GameRules } from "../../types/rules";
import { getTableMood, matchesPreset } from "../../lib/rulePresets";
import {
  getFavoriteProfiles,
  getAllProfiles,
  subscribeRuleProfiles,
  setActiveProfileId,
  getActiveProfileId,
  getRuleProfilesRevision,
  getServerRuleProfilesRevision,
  getRuleSetLabel,
} from "../../lib/customRuleProfiles";
import UnoCard from "../UnoCard";
import type { Card } from "../../types/card";
import type { GameState } from "../../types/game";

interface Props {
  savedGame?: GameState | null;
  onResume?: () => void;
  rules: Partial<GameRules>;
  controls: ReactNode;
  onQuickPlay: () => void;
  onJoin: () => void;
  onCreateRoom: () => void;
  onRulesChange?: (rules: Partial<GameRules>) => void;
}
const CLASSIC_TITLE_CARDS: Card[] = [
  { id: "title-blue", color: "blue", value: "5" },
  { id: "title-green", color: "green", value: "reverse" },
  { id: "title-yellow", color: "yellow", value: "7" },
  { id: "title-red", color: "red", value: "draw2" },
];
const NO_MERCY_TITLE_CARDS: Card[] = [
  { id: "nm-discard", color: "red", value: "discardAll" },
  { id: "nm-skip", color: "green", value: "skipEveryone" },
  { id: "nm-draw4", color: "yellow", value: "draw4" },
  { id: "nm-draw10", color: "wild", value: "wildDraw10" },
];
const ALL_WILD_TITLE_CARDS: Card[] = [
  { id: "wild-base", color: "wild", value: "wild" },
  { id: "wild-skip", color: "wild", value: "skip" },
  { id: "wild-swap", color: "wild", value: "wildForcedSwap" },
  { id: "wild-target", color: "wild", value: "wildTargetDraw2" },
];
export default function HomeScreen(props: Props) {
  const infoId = useId();
  useSyncExternalStore(
    subscribeRuleProfiles,
    getRuleProfilesRevision,
    getServerRuleProfilesRevision,
  );
  const favorites = getFavoriteProfiles();
  const activeId = getActiveProfileId();
  const profiles = getAllProfiles();
  const activeProfile =
    profiles.find(
      (p) => p.id === activeId && matchesPreset(props.rules, p.rules),
    ) ?? profiles.find((p) => matchesPreset(props.rules, p.rules));
  const currentMode = props.rules.gameMode ?? activeProfile?.rules.gameMode;
  const activeName = activeProfile?.name ?? getRuleSetLabel(props.rules);
  const titleCards =
    currentMode === "no_mercy"
      ? NO_MERCY_TITLE_CARDS
      : currentMode === "all_wild"
        ? ALL_WILD_TITLE_CARDS
        : CLASSIC_TITLE_CARDS;

  return (
    <div
      className={`launch-screen mood-${getTableMood(props.rules)}${props.savedGame ? " has-saved-round" : ""}`}
      data-design-contract="color-play"
    >
      <div className="launch-header">{props.controls}</div>
      <main className="launch-main">
        <div className="launch-heading">
          <h1>
            UNO<span aria-hidden="true">.</span>
          </h1>
          <p>Your table. Your rules.</p>
          <div className="title-card-fan" aria-hidden="true">
            {titleCards.map((card, index) => (
              <span
                key={card.id}
                style={{ "--title-i": index } as CSSProperties}
              >
                <UnoCard card={card} />
              </span>
            ))}
          </div>
        </div>
        <section className="launch-play" aria-label="Choose how to play">
          {props.savedGame && (
            <button className="launch-resume" onClick={props.onResume}>
              <span className="launch-resume-card" aria-hidden="true">
                <UnoCard
                  card={
                    props.savedGame.discardPile[
                      props.savedGame.discardPile.length - 1
                    ]
                  }
                  sizeMultiplier={0.32}
                />
              </span>
              <span>
                <strong>Resume your round</strong>
                <small>
                  {
                    props.savedGame.players.find((player) => !player.isBot)
                      ?.hand.length
                  }{" "}
                  cards in hand · {props.savedGame.players.length} players
                </small>
              </span>
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          )}
          <div className="launch-mode-picker">
            <div
              className="launch-presets"
              role="group"
              aria-label="Choose your game"
            >
              {favorites.map((item) => {
                const isSelected = activeProfile?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isSelected}
                    className="launch-preset-btn"
                    onClick={() => {
                      setActiveProfileId(item.id);
                      props.onRulesChange?.({
                        ...item.rules,
                        startingHandSize: item.rules.startingHandSize ?? 7,
                        maxPlayers:
                          item.rules.maxPlayers ??
                          (item.rules.gameMode === "no_mercy" ? 6 : 10),
                        botDifficulty: props.rules.botDifficulty ?? "standard",
                      });
                    }}
                  >
                    {item.isOriginal
                      ? item.id === "classic"
                        ? "Classic UNO"
                        : item.id === "no_mercy"
                          ? "No Mercy"
                          : "All Wild"
                      : item.name}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="launch-mode-info"
              popoverTarget={infoId}
              aria-label={`About ${activeName}`}
            >
              <Info size={18} aria-hidden="true" />
            </button>
            <div className="launch-mode-popover" id={infoId} popover="auto">
              <strong>{activeName}</strong>
              <p>{activeProfile?.description ?? "Your saved game rules."}</p>
            </div>
          </div>
          <button
            className="button primary launch-primary"
            onClick={props.onQuickPlay}
          >
            {props.savedGame ? "New round" : "Play"}
          </button>
          <div className="launch-rooms">
            <button className="button secondary" onClick={props.onCreateRoom}>
              Create a room
            </button>
            <button className="button secondary" onClick={props.onJoin}>
              Join a room
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
