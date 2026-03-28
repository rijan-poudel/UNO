"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import type { GameRules } from "../types/rules";
import { useUnoGame } from "../hooks/useUnoGame";
import { useUnoOnlineGame } from "../hooks/useUnoOnlineGame";
import { useAudioManager } from "../hooks/useAudioManager";
import GameBoard from "../components/GameBoard";
import GameSetup from "../components/GameSetup";
import HomeScreen from "../components/home/HomeScreen";
import OnlineLobby from "../components/OnlineLobby";
import NotificationPanel from "../components/NotificationPanel";
import SettingsModal from "../components/SettingsModal";
import { MIN_SUPPORTED_MAX_PLAYERS } from "../lib/gameLimits";
import { toast } from "sonner";

const SHARED_RULES_KEY = "uno.shared.rules";
const PREFERRED_THEME_KEY = "uno.preferred.theme";
const ONLINE_PREFILL_FRIEND_CODE_KEY = "uno.online.prefill.friendCode";
const ONLINE_PLAYER_NAME_KEY = "uno.online.playerName";

type ThemeName = "paper" | "midnight" | "forest" | "sunset";

const THEMES: Record<
  ThemeName,
  { label: string; vars: Record<string, string> }
> = {
  paper: {
    label: "Light",
    vars: {
      "--ui-bg": "#fafafa",
      "--ui-surface": "#ffffff",
      "--ui-text": "#212121",
      "--ui-muted": "rgba(33,33,33,0.54)",
      "--ui-line": "rgba(0,0,0,0.12)",
      "--ui-accent-red": "#e53935",
      "--ui-accent-yellow": "#f9a825",
      "--ui-accent-green": "#43a047",
      "--ui-accent-blue": "#1e88e5",
    },
  },
  midnight: {
    label: "Dark",
    vars: {
      "--ui-bg": "#121212",
      "--ui-surface": "#1e1e1e",
      "--ui-text": "#e0e0e0",
      "--ui-muted": "rgba(224,224,224,0.6)",
      "--ui-line": "rgba(255,255,255,0.12)",
      "--ui-accent-red": "#e53935",
      "--ui-accent-yellow": "#f9a825",
      "--ui-accent-green": "#43a047",
      "--ui-accent-blue": "#1e88e5",
    },
  },
  forest: {
    label: "Teal",
    vars: {
      "--ui-bg": "#e0f2f1",
      "--ui-surface": "#ffffff",
      "--ui-text": "#004d40",
      "--ui-muted": "rgba(0,77,64,0.6)",
      "--ui-line": "rgba(0,77,64,0.15)",
      "--ui-accent-red": "#e53935",
      "--ui-accent-yellow": "#f9a825",
      "--ui-accent-green": "#43a047",
      "--ui-accent-blue": "#1e88e5",
    },
  },
  sunset: {
    label: "Purple",
    vars: {
      "--ui-bg": "#1a0033",
      "--ui-surface": "#2d0057",
      "--ui-text": "#ede7f6",
      "--ui-muted": "rgba(237,231,246,0.65)",
      "--ui-line": "rgba(237,231,246,0.18)",
      "--ui-accent-red": "#e53935",
      "--ui-accent-yellow": "#f9a825",
      "--ui-accent-green": "#43a047",
      "--ui-accent-blue": "#1e88e5",
    },
  },
};

const DEFAULT_RULES: Partial<GameRules> = {
  stackDraw2: false,
  stackWild4: false,
  allowWild4OnDraw2: false,
  drawUntilPlayable: false,
  reverseActsAsSkipInTwoPlayer: true,
  mustDeclareUno: true,
  allowStartingActionCard: true,
  allowDiscardAll: false,
  allowShuffleCard: false,
  allowDoublePlaySameNumber: false,
  maxPlayers: MIN_SUPPORTED_MAX_PLAYERS,
};

function getInitialRules(): Partial<GameRules> {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    const raw = window.localStorage.getItem(SHARED_RULES_KEY);
    if (!raw) return DEFAULT_RULES;
    const parsed = JSON.parse(raw) as Partial<GameRules> & {
      shuffleHandsOnZero?: boolean;
    };
    const normalizedMaxPlayers = Math.max(
      MIN_SUPPORTED_MAX_PLAYERS,
      parsed.maxPlayers ?? DEFAULT_RULES.maxPlayers ?? MIN_SUPPORTED_MAX_PLAYERS,
    );

    return {
      ...DEFAULT_RULES,
      ...parsed,
      maxPlayers: normalizedMaxPlayers,
      allowShuffleCard:
        parsed.allowShuffleCard ??
        parsed.shuffleHandsOnZero ??
        DEFAULT_RULES.allowShuffleCard,
    };
  } catch {
    return DEFAULT_RULES;
  }
}

function getInitialTheme(): ThemeName {
  return "midnight";
}

function WelcomeOverlay({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void import("@dotlottie/player-component");
  }, []);

  useEffect(() => {
    const player = containerRef.current?.querySelector("dotlottie-player");
    if (!player) return;

    const handleComplete = () => {
      onComplete();
    };

    player.addEventListener("complete", handleComplete);
    return () => {
      player.removeEventListener("complete", handleComplete);
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--ui-bg)",
        color: "var(--ui-text)",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        zIndex: 120,
        pointerEvents: "auto",
      }}
    >
      <dotlottie-player
        src="/loadingPage/Welcome.lottie"
        background="transparent"
        speed="2.5"
        style={{ width: "min(460px, 76vw)", height: "min(460px, 76vw)" }}
        autoplay
      />
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mode, setMode] = useState<"online" | "computer">("computer");
  const [view, setView] = useState<"home" | "computer" | "friends">("home");
  const [panel, setPanel] = useState<"create" | "join">("create");
  const [theme, setTheme] = useState<ThemeName>(() => getInitialTheme());
  const [showS, setShowS] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "controls" | "audio">("controls");
  const [rules, setRules] = useState<Partial<GameRules>>(() => getInitialRules());
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(true);
  const { playMusic, setMusicContext } = useAudioManager();

  const local = useUnoGame();
  const online = useUnoOnlineGame();
  const api = mode === "computer" ? local : online;

  const gameContext: "lobby" | "game" = api.game ? "game" : "lobby";

  useEffect(() => {
    try {
      window.localStorage.setItem(SHARED_RULES_KEY, JSON.stringify(rules));
    } catch {}
  }, [rules]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFERRED_THEME_KEY, theme);
    } catch {}
    const root = document.documentElement;
    for (const [k, v] of Object.entries(THEMES[theme].vars))
      root.style.setProperty(k, v);
  }, [theme]);

  useEffect(() => {
    setMusicContext(gameContext);
    playMusic(gameContext);
  }, [gameContext, setMusicContext, playMusic]);

  useEffect(() => {
    const startMusic = () => {
      setMusicContext(gameContext);
      playMusic(gameContext);
    };
    window.addEventListener("pointerdown", startMusic, { once: true });
    return () => window.removeEventListener("pointerdown", startMusic);
  }, [gameContext, setMusicContext, playMusic]);

  const cycleTheme = () => {
    const order: ThemeName[] = ["paper", "midnight", "forest", "sunset"];
    setTheme((p) => order[(order.indexOf(p) + 1) % order.length]);
  };

  const selectTheme = (themeName: string) => {
    if (themeName === 'paper' || themeName === 'midnight' || themeName === 'forest' || themeName === 'sunset') {
      setTheme(themeName);
    }
  };

  const copyCode = async () => {
    if (!online.friendCode) return;
    try {
      await navigator.clipboard.writeText(online.friendCode);
      toast.success("Friend code copied.");
    } catch {
      toast.error("Could not copy friend code.");
    }
  };

  const label = THEMES[theme].label;

  const openSettingsAt = (tab: "profile" | "controls" | "audio") => {
    setSettingsTab(tab);
    setShowS(true);
  };

  const settingsModal = (
    <SettingsModal
      key={`settings-${settingsTab}-${showS ? "open" : "closed"}`}
      open={showS}
      initialTab={settingsTab}
      rules={rules}
      friendCode={online.friendCode}
      onCopyFriendCode={() => {
        void copyCode();
      }}
      onChange={setRules}
      onClose={() => setShowS(false)}
    />
  );

  const topBar = (
    <NotificationPanel
      themeLabel={label}
      onSelectTheme={selectTheme}
      onOpenProfileSettings={() => openSettingsAt("profile")}
      onOpenControlsSettings={() => openSettingsAt("controls")}
      onOpenAudioSettings={() => openSettingsAt("audio")}
      incomingInvites={online.incomingInvites}
      onAcceptFriendInvite={async (inviteId) => {
        let playerName = "Player 1";
        try {
          const stored = window.localStorage.getItem(ONLINE_PLAYER_NAME_KEY);
          if (stored && stored.trim()) {
            playerName = stored.trim().slice(0, 18);
          }
        } catch {
          // Ignore storage errors.
        }
        return online.acceptFriendInvite(inviteId, playerName);
      }}
      onDeclineFriendInvite={(inviteId) => online.declineFriendInvite(inviteId)}
      incomingInviteCount={online.incomingInvites.length}
    />
  );

  let content: ReactNode = null;

  // Active game
  if (api.game) {
    const currentGame = api.game;
    content = (
      <>
        <GameBoard
          gameApi={api as ReturnType<typeof useUnoGame>}
          onReset={() => {
            api.resetGame();
            setMode("computer");
            setView("home");
          }}
          onDealAgain={() => {
            if (mode === "computer") {
              local.startGame(
                currentGame.players.map((player) => player.name),
                currentGame.rules,
                currentGame.players.map((player) => player.isBot),
              );
              return;
            }
            void online.startOnlineGame(currentGame.rules);
          }}
          onOpenSettings={(tab) => openSettingsAt(tab ?? "controls")}
          onCycleTheme={cycleTheme}
          currentThemeLabel={label}
        />
        {settingsModal}
      </>
    );
  } else if (view === "home") {
    content = (
      <>
        <HomeScreen
          themeLabel={label}
          onSelectTheme={selectTheme}
          onOpenControlsSettings={() => openSettingsAt("controls")}
          onOpenAudioSettings={() => openSettingsAt("audio")}
          onOpenProfileSettings={() => openSettingsAt("profile")}
          onComputer={() => {
            setMode("computer");
            setView("computer");
          }}
          onFriends={() => {
            setMode("online");
            setPanel("create");
            setView("friends");
          }}
          incomingInvites={online.incomingInvites}
          onAcceptFriendInvite={async (inviteId) => {
            let playerName = "Player 1";
            try {
              const stored = window.localStorage.getItem(ONLINE_PLAYER_NAME_KEY);
              if (stored && stored.trim()) {
                playerName = stored.trim().slice(0, 18);
              }
            } catch {
              // Ignore storage errors.
            }
            return online.acceptFriendInvite(inviteId, playerName);
          }}
          onDeclineFriendInvite={(inviteId) => online.declineFriendInvite(inviteId)}
          onCheckFriendOnline={online.checkFriendOnline}
          onFriendQuickInvite={async (friendCode) => {
            let playerName = "Player 1";
            try {
              const stored = window.localStorage.getItem(
                ONLINE_PLAYER_NAME_KEY,
              );
              if (stored && stored.trim())
                playerName = stored.trim().slice(0, 18);
              window.localStorage.setItem(
                ONLINE_PREFILL_FRIEND_CODE_KEY,
                friendCode,
              );
            } catch {
              // Ignore storage issues and still continue.
            }

            const invited = await online.sendFriendInvite(
              friendCode,
              playerName,
            );
            if (!invited) {
              toast.error(online.error ?? "Could not send invite.");
              return false;
            }

            setMode("online");
            setPanel("create");
            setView("friends");
            return true;
          }}
        />
        {settingsModal}
      </>
    );
  } else if (view === "computer") {
    content = (
      <>
        <GameSetup
          controls={topBar}
          onBack={() => setView("home")}
          onStart={(names, botFlags) => {
            setMode("computer");
            local.startGame(names, rules, botFlags);
          }}
        />
        {settingsModal}
      </>
    );
  } else {
    content = (
      <>
        <OnlineLobby
          controls={topBar}
          onBack={() => setView("home")}
          initialPanel={panel}
          connected={online.connected}
          room={online.room}
          playerId={online.playerId}
          friendCode={online.friendCode}
          incomingInvites={online.incomingInvites}
          outgoingInvites={online.outgoingInvites}
          error={online.error}
          onSyncPresence={online.syncPresence}
          onCreateRoom={online.createRoom}
          onJoinRoom={online.joinRoom}
          onSendFriendInvite={online.sendFriendInvite}
          onAcceptFriendInvite={online.acceptFriendInvite}
          onDeclineFriendInvite={online.declineFriendInvite}
          onLeaveRoom={online.leaveRoom}
          onStartGame={() => {
            setMode("online");
            return online.startOnlineGame(rules);
          }}
          onAddBotSeat={online.addBotToRoom}
          onKickPlayer={online.kickPlayer}
          onCheckFriendOnline={online.checkFriendOnline}
        />
        {settingsModal}
      </>
    );
  }

  return (
    <>
      {content}
      {showWelcomeOverlay && (
        <WelcomeOverlay onComplete={() => setShowWelcomeOverlay(false)} />
      )}
    </>
  );
}
