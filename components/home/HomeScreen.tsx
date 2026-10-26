// A quiet game title screen: one immediate Play action and room choices.
"use client";
import { useState, type CSSProperties } from "react";
import { ArrowRight, Bot, BookOpen, Users, LogIn } from "lucide-react";
import type { FriendInvite } from "../../types/multiplayer";
import type { GameRules } from "../../types/rules";
import {
  RULE_PRESETS,
  getTableMood,
  matchesPreset,
} from "../../lib/rulePresets";
import NotificationPanel from "../NotificationPanel";
import PlayerProgress from "../PlayerProgress";
import UnoCard from "../UnoCard";
import HowToPlayModal from "../HowToPlayModal";
import type { Card } from "../../types/card";
import type { GameState } from "../../types/game";
import { getBotDifficultyLabel } from "../../lib/botSupport";

interface Props {
  savedGame?: GameState | null;
  onResume?: () => void;
  rules: Partial<GameRules>;
  onRulesChange: (rules: Partial<GameRules>) => void;
  themeLabel: string;
  onSelectTheme?: (themeName: string) => void;
  onOpenControlsSettings: () => void;
  onOpenAudioSettings: () => void;
  onOpenProfileSettings?: () => void;
  onComputer: () => void;
  onQuickPlay: () => void;
  onJoin: () => void;
  onFriends: () => void;
  incomingInvites: FriendInvite[];
  onAcceptFriendInvite?: (id: string) => Promise<boolean>;
  onDeclineFriendInvite?: (id: string) => Promise<boolean>;
}
const TITLE_CARDS: Card[] = [
  { id: "title-blue", color: "blue", value: "5" },
  { id: "title-green", color: "green", value: "reverse" },
  { id: "title-yellow", color: "yellow", value: "7" },
  { id: "title-red", color: "red", value: "draw2" },
];
export default function HomeScreen(props: Props) {
  const [help, setHelp] = useState(false);
  const preset = RULE_PRESETS.find((item) =>
    matchesPreset(props.rules, item.rules),
  );
  return (
    <div
      className={`launch-screen mood-${getTableMood(props.rules)}${props.savedGame ? " has-saved-round" : ""}`}
      data-design-contract="color-play"
    >
      <div className="launch-header">
        <NotificationPanel
          {...props}
          incomingInviteCount={props.incomingInvites.length}
        />
      </div>
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
            {RULE_PRESETS.map((item) => (
              <button
                key={item.id}
                aria-pressed={preset?.id === item.id}
                onClick={() =>
                  props.onRulesChange({
                    ...item.rules,
                    startingHandSize: props.rules.startingHandSize ?? 7,
                    maxPlayers: props.rules.maxPlayers ?? 6,
                    botDifficulty: props.rules.botDifficulty ?? "standard",
                  })
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="launch-preset-description">
            {preset?.description ??
              "Your own house rules. Make yourself at home."}
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
                  : `Jump in with ${getBotDifficultyLabel(props.rules.botDifficulty).toLowerCase()} bots`}
              </small>
            </span>
            <ArrowRight size={25} aria-hidden="true" />
          </button>
          <div className="launch-rooms">
            <button className="button secondary" onClick={props.onFriends}>
              <Users size={19} aria-hidden="true" />
              Create a room
            </button>
            <button className="button secondary" onClick={props.onJoin}>
              <LogIn size={19} aria-hidden="true" />
              Join a room
            </button>
          </div>
          <div className="launch-extras">
            <button className="launch-text-action" onClick={props.onComputer}>
              <Bot size={16} aria-hidden="true" />
              Set up bots
            </button>
            <button
              className="launch-text-action"
              onClick={() => setHelp(true)}
              aria-haspopup="dialog"
            >
              <BookOpen size={16} aria-hidden="true" />
              How to play
              <span className="launch-pill-hint">1 min</span>
            </button>
          </div>
          {help && (
            <HowToPlayModal
              open={help}
              rules={props.rules}
              onClose={() => setHelp(false)}
              onPracticeWithBots={() => {
                setHelp(false);
                props.onQuickPlay();
              }}
              onPlayWithFriends={() => {
                setHelp(false);
                props.onFriends();
              }}
            />
          )}
        </section>
        <div className="launch-progress">
          <PlayerProgress />
        </div>
      </main>
      <footer className="launch-footer">No signup. Just one more round.</footer>
    </div>
  );
}
