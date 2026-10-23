// Game title screen: the picture sets the scene; playing owns the foreground.
"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Bot, ChevronDown, BookOpen } from "lucide-react";
import type { FriendInvite } from "../../types/multiplayer";
import NotificationPanel from "../NotificationPanel";
import PlayerProgress from "../PlayerProgress";
import { UnoMenuCard } from "../UnoCard";

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
    <div className="launch-screen" data-design-contract="comic-card-showdown">
      <div className="launch-header">
        <NotificationPanel
          {...props}
          incomingInviteCount={props.incomingInvites.length}
        />
      </div>
      <main className="launch-main">
        <div className="launch-heading">
          <h1 aria-label="UNO — Deal yourself in.">UNO</h1>
          <p>Your table. Your rules.</p>
        </div>
        <section className="launch-stage" aria-label="Choose how to play">
          <figure className="launch-cast" aria-hidden="true">
            <Image
              src="/artwork/opening-hand-cast.webp"
              width={2200}
              height={700}
              alt=""
              sizes="100vw"
              unoptimized
              preload
            />
          </figure>
          <div className="launch-hand">
            <div className="launch-card launch-card-main">
              <UnoMenuCard
                color="yellow"
                label="Play with bots"
                onClick={props.onQuickPlay}
              >
                <span>
                  Play
                  <br />
                  with bots
                </span>
                <ArrowRight aria-hidden="true" />
              </UnoMenuCard>
            </div>
            <div className="launch-card launch-card-create">
              <UnoMenuCard
                color="red"
                label="Create a room"
                onClick={props.onFriends}
              >
                <span>
                  Create
                  <br />a room
                </span>
              </UnoMenuCard>
            </div>
            <div className="launch-card launch-card-join">
              <UnoMenuCard
                color="blue"
                label="Join a room"
                onClick={props.onJoin}
              >
                <span>
                  Join
                  <br />a room
                </span>
              </UnoMenuCard>
            </div>
          </div>
        </section>
        <section className="launch-play" aria-label="More ways to play">
          <div className="launch-extras">
            <button className="launch-text-action" onClick={props.onComputer}>
              <Bot size={18} aria-hidden="true" /> Set up bots
            </button>
            <button
              className="launch-text-action"
              onClick={() => setHelp(!help)}
              aria-expanded={help}
              aria-controls="launch-quick-rules"
            >
              <BookOpen size={18} aria-hidden="true" /> How to play{" "}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>
          {help && (
            <div className="launch-rules" id="launch-quick-rules">
              <p>
                Match the top card’s <strong>color or number</strong>. No match?
                Draw a card. Wild cards let you choose the color.
              </p>
              <p>
                Call <strong>UNO</strong> when you have one card left. Empty
                your hand to win.
              </p>
            </div>
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
