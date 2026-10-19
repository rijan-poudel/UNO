// Entry screen: the two ways to play, an actual card fan, and saved friends.
"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { FriendInvite } from "../../types/multiplayer";
import type { CSSProperties } from "react";
import UnoCard from "../UnoCard";
import type { Card } from "../../types/card";
import NotificationPanel from "../NotificationPanel";
import PlayerProgress from "../PlayerProgress";
import PlayerAvatar from "../PlayerAvatar";

interface Props {
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
export default function HomeScreen(props: Props) {
  const [help, setHelp] = useState(false);
  return (
    <div className="home-page">
      <NotificationPanel
        {...props}
        incomingInviteCount={props.incomingInvites.length}
      />
      <main className="home-main">
        <section className="home-hero">
          <div className="home-copy">
            <h1>
              Small cards.
              <br />
              <span className="hero-color">Big rivalry.</span>
            </h1>
            <p>Bring your people. Bring your game face.</p>
            <PlayerProgress />
            <div className="play-choices">
              <button
                className="play-choice primary-choice"
                onClick={props.onQuickPlay}
              >
                <span className="choice-art" aria-hidden="true">
                  <PlayerAvatar seed="bot" />
                  <span className="mini-card">7</span>
                </span>
                <span>
                  <strong>Play with bots</strong>
                  <small>Your saved table, ready to deal</small>
                </span>
                <ArrowRight />
              </button>
              <button
                className="play-choice friends-choice"
                onClick={props.onFriends}
              >
                <span className="choice-art" aria-hidden="true">
                  <PlayerAvatar seed="friend" />
                  <PlayerAvatar seed="pal" />
                </span>
                <span>
                  <strong>Create a room</strong>
                  <small>Your room. Your rules.</small>
                </span>
                <ArrowRight />
              </button>
            </div>
            <div className="entry-shortcuts">
              <button className="text-button" onClick={props.onComputer}>
                Set up bots <ArrowRight size={16} />
              </button>
              <button className="text-button" onClick={props.onJoin}>
                Join a room <ArrowRight size={16} />
              </button>
            </div>
            <button
              className="text-button how-to"
              onClick={() => setHelp(!help)}
              aria-expanded={help}
            >
              {help ? "Got it, let’s play" : "First time at the table?"}
              <span>
                {help ? <Check size={16} /> : <ArrowRight size={16} />}
              </span>
            </button>
            {help && (
              <div className="quick-rules">
                <p>
                  Match the top card’s <strong>color or number</strong>. No
                  match? Draw a card. Wild cards let you choose the color.
                </p>
                <p>
                  Call <strong>UNO</strong> when you have one card left. Empty
                  your hand to win.
                </p>
              </div>
            )}
          </div>
          <div
            className="home-art"
            role="img"
            aria-label="A fan of red, blue, wild, green and yellow cards from your next game"
          >
            {(
              [
                { color: "red", value: "7" },
                { color: "blue", value: "reverse" },
                { color: "wild", value: "wild4" },
                { color: "green", value: "2" },
                { color: "yellow", value: "9" },
              ] as Pick<Card, "color" | "value">[]
            ).map((card, i) => (
              <span
                className="home-deck-card"
                key={card.color}
                aria-hidden="true"
                style={
                  {
                    "--preview-i": i - 2,
                    "--preview-y": Math.abs(i - 2) ** 2 * 12 + "px",
                  } as CSSProperties
                }
              >
                <UnoCard
                  card={{ ...card, id: `preview-${i}` }}
                  sizeMultiplier={2.25}
                />
              </span>
            ))}
          </div>
        </section>
      </main>
      <footer className="home-footer">
        <span>Made for one more round.</span>
        <span>No signup. Just shuffle.</span>
      </footer>
    </div>
  );
}
