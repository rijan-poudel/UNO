// Game title screen: the picture sets the scene; playing owns the foreground.
"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { FriendInvite } from "../../types/multiplayer";
import NotificationPanel from "../NotificationPanel";
import PlayerProgress from "../PlayerProgress";

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
    <div
      className="launch-screen"
      data-design-contract="centered-home-2e1e4271"
    >
      <div className="launch-header">
        <NotificationPanel
          {...props}
          incomingInviteCount={props.incomingInvites.length}
        />
      </div>
      <main className="launch-main">
        <div className="launch-heading">
          <h1>Deal yourself in.</h1>
          <p>Your table. Your rules.</p>
        </div>
        <figure className="launch-scene">
          <Image
            src="/artwork/card-night-flat.webp"
            width={1729}
            height={910}
            alt="A laughing red panda slaps down a reverse card while a blue rabbit and green crocodile hold their cards around the table."
            sizes="(max-width: 700px) 100vw, (max-width: 1250px) 740px, 820px"
            unoptimized
            preload
          />
        </figure>
        <section className="launch-play" aria-label="Choose how to play">
          <button
            className="launch-action launch-action-main"
            onClick={props.onQuickPlay}
          >
            Play with bots <ArrowRight size={23} aria-hidden="true" />
          </button>
          <div className="launch-online">
            <button className="launch-action" onClick={props.onFriends}>
              Create a room
            </button>
            <button className="launch-action" onClick={props.onJoin}>
              Join a room
            </button>
          </div>
          <div className="launch-extras">
            <button className="launch-text-action" onClick={props.onComputer}>
              Set up bots
            </button>
            <button
              className="launch-text-action"
              onClick={() => setHelp(!help)}
              aria-expanded={help}
              aria-controls="launch-quick-rules"
            >
              How to play <ChevronDown size={16} aria-hidden="true" />
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
