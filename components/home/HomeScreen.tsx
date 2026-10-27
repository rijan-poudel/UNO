// A quiet game title screen: one immediate Play action and room choices.
"use client";
import {
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowRight, Users, LogIn } from "lucide-react";
import type { GameRules } from "../../types/rules";
import { getTableMood, matchesPreset } from "../../lib/rulePresets";
import {
  getFavoriteProfiles,
  getAllProfiles,
  subscribeRuleProfiles,
  setActiveProfileId,
  getRuleSetLabel,
  getActiveProfileId,
  getRuleProfilesRevision,
  getServerRuleProfilesRevision,
} from "../../lib/customRuleProfiles";
import UnoCard from "../UnoCard";
import type { Card } from "../../types/card";
import type { GameState } from "../../types/game";
import { getBotDifficultyLabel } from "../../lib/botSupport";

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
const TITLE_CARDS: Card[] = [
  { id: "title-blue", color: "blue", value: "5" },
  { id: "title-green", color: "green", value: "reverse" },
  { id: "title-yellow", color: "yellow", value: "7" },
  { id: "title-red", color: "red", value: "draw2" },
];
export default function HomeScreen(props: Props) {
  useSyncExternalStore(
    subscribeRuleProfiles,
    getRuleProfilesRevision,
    getServerRuleProfilesRevision,
  );
  const favorites = getFavoriteProfiles();
  const activeId = getActiveProfileId();
  const activeProfile =
    getAllProfiles().find(
      (p) => p.id === activeId && matchesPreset(props.rules, p.rules),
    ) ??
    getAllProfiles().find((p) => matchesPreset(props.rules, p.rules)) ??
    favorites[0];

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
            {TITLE_CARDS.map((card, index) => (
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
          <p className="launch-preset-description">
            {activeProfile?.description ??
              "Standard deck, seven cards each, matching color or number."}
          </p>
          <button
            className="button primary launch-primary"
            onClick={props.onQuickPlay}
          >
            <span>
              {props.savedGame ? "New round" : "Let’s play"}
              <small>
                {props.savedGame
                  ? "Replace your saved bot round"
                  : `${activeProfile?.name ?? getRuleSetLabel(props.rules)} · ${getBotDifficultyLabel(props.rules.botDifficulty).toLowerCase()} bots`}
              </small>
            </span>
            <ArrowRight size={25} aria-hidden="true" />
          </button>
          <div className="launch-rooms">
            <button className="button secondary" onClick={props.onCreateRoom}>
              <Users size={19} aria-hidden="true" />
              Create a room
            </button>
            <button className="button secondary" onClick={props.onJoin}>
              <LogIn size={19} aria-hidden="true" />
              Join a room
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
