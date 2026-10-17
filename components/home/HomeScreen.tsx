// Entry screen: the two ways to play, an actual card fan, and saved friends.
"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Users } from "lucide-react";
import type {
  FriendInvite,
  FriendPresenceState,
} from "../../types/multiplayer";
import Image from "next/image";
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
  onFriends: () => void;
  onFriendQuickInvite: (code: string) => Promise<boolean>;
  onCheckFriendOnline: (
    codes: string[],
  ) => Promise<Record<string, FriendPresenceState>>;
  incomingInvites: FriendInvite[];
  onAcceptFriendInvite?: (id: string) => Promise<boolean>;
  onDeclineFriendInvite?: (id: string) => Promise<boolean>;
}
interface Friend {
  friendCode: string;
  name: string;
}
function loadFriends(): Friend[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("uno.online.friends") ?? "[]",
    );
    return Array.isArray(value)
      ? value
          .filter(
            (f): f is Friend =>
              f &&
              typeof f.friendCode === "string" &&
              typeof f.name === "string",
          )
          .slice(0, 4)
      : [];
  } catch {
    return [];
  }
}
export default function HomeScreen(props: Props) {
  const { onCheckFriendOnline } = props;
  const [friends] = useState(loadFriends);
  const [presence, setPresence] = useState<Record<string, FriendPresenceState>>(
    {},
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    if (!friends.length) return;
    let disposed = false;
    const refresh = async () => {
      try {
        const statuses = await onCheckFriendOnline(
          friends.map((f) => f.friendCode),
        );
        if (!disposed) setPresence(statuses);
      } catch {
        /* Socket errors are shown in the lobby. */
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [friends, onCheckFriendOnline]);
  const invite = async (friendCode: string) => {
    setBusy(true);
    try {
      if (await props.onFriendQuickInvite(friendCode)) setCode("");
    } finally {
      setBusy(false);
    }
  };
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
                onClick={props.onComputer}
              >
                <span className="choice-art" aria-hidden="true">
                  <PlayerAvatar seed="bot" />
                  <span className="mini-card">7</span>
                </span>
                <span>
                  <strong>Play with bots</strong>
                  <small>Jump straight in</small>
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
                  <strong>Play with friends</strong>
                  <small>Your room. Your rules.</small>
                </span>
                <ArrowRight />
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
          <div className="home-art">
            <div className="art-disc" aria-hidden="true" />
            <Image
              src="/art/card-pals.webp"
              alt="A red seven and a blue reverse card high-five, surrounded by colorful playing cards"
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 700px) 100vw, 58vw"
            />
            <span className="art-sticker" aria-hidden="true">
              One more
              <br />
              round?
            </span>
          </div>
        </section>
        <section className="home-friends">
          <div className="friends-intro">
            <Users size={21} />
            <div>
              <h2>Got a friend code?</h2>
              <p>
                {friends.length
                  ? "Your regulars. Invite them back for a round."
                  : "Invite them to play."}
              </p>
            </div>
          </div>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              void invite(code);
            }}
          >
            <label className="sr-only" htmlFor="home-friend-code">
              Friend code
            </label>
            <input
              id="home-friend-code"
              value={code}
              placeholder="Friend code"
              maxLength={8}
              autoCapitalize="characters"
              autoComplete="off"
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
            />
            <button
              className="button secondary"
              disabled={code.length < 4 || busy}
            >
              {busy ? "Inviting…" : "Invite"}
              <ArrowRight size={17} />
            </button>
          </form>
          {friends.length > 0 && (
            <div className="saved-friends">
              {friends.map((f) => (
                <button
                  className="saved-friend"
                  key={f.friendCode}
                  disabled={busy}
                  onClick={() => void invite(f.friendCode)}
                >
                  <span className="avatar">{f.name[0]?.toUpperCase()}</span>
                  <span>
                    <strong>{f.name}</strong>
                    <small>
                      <i
                        className={`presence-dot ${presence[f.friendCode] ?? "offline"}`}
                      />
                      {presence[f.friendCode] ?? "offline"}
                    </small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="home-footer">
        <span>Made for one more round.</span>
        <span>No signup. Just shuffle.</span>
      </footer>
    </div>
  );
}
