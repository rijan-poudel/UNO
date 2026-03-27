"use client";

import { useEffect, useState, type ReactNode } from "react";
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
      "--ui-accent-red": "#ef5350",
      "--ui-accent-yellow": "#fdd835",
      "--ui-accent-green": "#66bb6a",
      "--ui-accent-blue": "#42a5f5",
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
      "--ui-accent-green": "#00897b",
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
      "--ui-accent-red": "#ef9a9a",
      "--ui-accent-yellow": "#fff59d",
      "--ui-accent-green": "#a5d6a7",
      "--ui-accent-blue": "#ce93d8",
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
  maxPlayers: 4,
};

function getInitialRules(): Partial<GameRules> {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    const raw = window.localStorage.getItem(SHARED_RULES_KEY);
    if (!raw) return DEFAULT_RULES;
    const parsed = JSON.parse(raw) as Partial<GameRules> & {
      shuffleHandsOnZero?: boolean;
    };
    return {
      ...DEFAULT_RULES,
      ...parsed,
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

function WelcomeOverlay({ fadingOut }: { fadingOut: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#121212",
        color: "#e0e0e0",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        zIndex: 120,
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? "scale(1.02)" : "scale(1)",
        transition: "opacity 560ms cubic-bezier(0.22,1,0.36,1), transform 560ms cubic-bezier(0.22,1,0.36,1)",
        pointerEvents: fadingOut ? "none" : "auto",
      }}
    >
      <style>{`
        @keyframes unoWelcomePulse {
          0%, 100% { transform: scale(1); opacity: 0.92; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes unoWelcomeSweep {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(140%); }
        }
        @keyframes unoWelcomeFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
      <div style={{ textAlign: "center", display: "grid", gap: 18, placeItems: "center", animation: "unoWelcomeFloat 2.2s ease-in-out infinite" }}>
        <div
          style={{
            position: "relative",
            fontFamily: "var(--font-monkeytype-mono), 'Roboto Mono', monospace",
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "clamp(68px, 14vw, 126px)",
            letterSpacing: "0.16em",
            lineHeight: 1,
            animation: "unoWelcomePulse 1.2s ease-in-out infinite",
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: "#ef5350" }}>U</span>
          <span style={{ color: "#fdd835" }}>N</span>
          <span style={{ color: "#66bb6a" }}>O</span>
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -10,
              height: 2,
              background: "linear-gradient(90deg, transparent, #42a5f5, transparent)",
              animation: "unoWelcomeSweep 1.4s ease-in-out infinite",
            }}
          />
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: "'Courier Prime', monospace",
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(224,224,224,0.7)",
          }}
        >
          Welcome to the table
        </p>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mode, setMode] = useState<"online" | "computer">("computer");
  const [view, setView] = useState<"home" | "computer" | "friends">("home");
  const [panel, setPanel] = useState<"create" | "join">("create");
  const [theme, setTheme] = useState<ThemeName>("midnight");
  const [showS, setShowS] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "controls" | "audio">("controls");
  const [rules, setRules] = useState<Partial<GameRules>>(DEFAULT_RULES);
  const [mounted, setMounted] = useState(false);
  const [welcomePhase, setWelcomePhase] = useState<"show" | "fade" | "done">("show");
  const { playMusic, setMusicContext } = useAudioManager();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTheme(getInitialTheme());
      setRules(getInitialRules());
      setMounted(true);
    }, 220);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fadeTimer = window.setTimeout(() => {
      setWelcomePhase("fade");
    }, 120);
    const doneTimer = window.setTimeout(() => {
      setWelcomePhase("done");
    }, 760);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [mounted]);

  const local = useUnoGame();
  const online = useUnoOnlineGame();
  const api = mode === "computer" ? local : online;

  useEffect(() => {
    if (mounted) {
      try {
        window.localStorage.setItem(SHARED_RULES_KEY, JSON.stringify(rules));
      } catch {}
    }
  }, [rules, mounted]);

  useEffect(() => {
    if (mounted) {
      try {
        window.localStorage.setItem(PREFERRED_THEME_KEY, theme);
      } catch {}
    }
    const root = document.documentElement;
    for (const [k, v] of Object.entries(THEMES[theme].vars))
      root.style.setProperty(k, v);
  }, [theme, mounted]);

  useEffect(() => {
    const activeContext = api.game ? "game" : "lobby";
    setMusicContext(activeContext);
    playMusic(activeContext);
  }, [api.game, playMusic, setMusicContext]);

  useEffect(() => {
    const startMusic = () => {
      const activeContext = api.game ? "game" : "lobby";
      setMusicContext(activeContext);
      playMusic(activeContext);
    };
    window.addEventListener("pointerdown", startMusic, { once: true });
    return () => window.removeEventListener("pointerdown", startMusic);
  }, [api.game, playMusic, setMusicContext]);

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
      incomingInviteCount={online.incomingInvites.length}
    />
  );

  let content: ReactNode = null;

  // Active game
  if (mounted && api.game) {
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
  } else if (mounted && view === "home") {
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
  } else if (mounted && view === "computer") {
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
  } else if (mounted) {
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
      {(welcomePhase === "show" || welcomePhase === "fade") && (
        <WelcomeOverlay fadingOut={welcomePhase === "fade"} />
      )}
    </>
  );
}
