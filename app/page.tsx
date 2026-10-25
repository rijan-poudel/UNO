"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { GameRules } from "../types/rules";
import { usePhonePortrait } from "../hooks/usePhonePortrait";
import { useUnoGame } from "../hooks/useUnoGame";
import { useUnoOnlineGame } from "../hooks/useUnoOnlineGame";
import { useAudioManager } from "../hooks/useAudioManager";
import GameBoard from "../components/GameBoard";
import GameSetup from "../components/GameSetup";
import HomeScreen from "../components/home/HomeScreen";
import OnlineLobby from "../components/OnlineLobby";
import NotificationPanel from "../components/NotificationPanel";
import SettingsModal from "../components/SettingsModal";
import { UnoWordmark } from "../components/ui/PageChrome";
import { getSavedPlayerNames } from "../lib/playerNames";
import { toast } from "sonner";

import {
  DEFAULT_TABLE_RULES,
  parseRulePreferences,
  SHARED_RULES_KEY,
  RULES_VERSION_KEY,
  RULES_VERSION,
} from "../lib/rulePreferences";
const subscribeToClient = () => () => {};
const PREFERRED_THEME_KEY = "uno.preferred.theme";

const ONLINE_PLAYER_NAME_KEY = "uno.online.playerName";

type ThemeName = "paper" | "midnight" | "forest" | "sunset";

const THEMES: Record<ThemeName, { label: string }> = {
  paper: { label: "Daylight" },
  midnight: { label: "After hours" },
  forest: { label: "Club green" },
  sunset: { label: "Clay" },
};

function getInitialRules(): GameRules {
  if (typeof window === "undefined") return { ...DEFAULT_TABLE_RULES };
  try {
    return parseRulePreferences(
      window.localStorage.getItem(SHARED_RULES_KEY),
      window.localStorage.getItem(RULES_VERSION_KEY),
    );
  } catch {
    return { ...DEFAULT_TABLE_RULES };
  }
}

function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "paper";
  try {
    const value = localStorage.getItem(PREFERRED_THEME_KEY);
    return value === "paper" ||
      value === "midnight" ||
      value === "forest" ||
      value === "sunset"
      ? value
      : "paper";
  } catch {
    return "paper";
  }
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mode, setMode] = useState<"online" | "computer">(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("room")
      ? "online"
      : "computer",
  );
  const [view, setView] = useState<"home" | "computer" | "friends">(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("room")
      ? "friends"
      : "home",
  );
  const [panel, setPanel] = useState<"create" | "join">("create");
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);
  const [showS, setShowS] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "profile" | "controls" | "audio"
  >("controls");
  const [rules, setRules] = useState<Partial<GameRules>>(getInitialRules);
  // On client this is always true; on server it's false (SSR guard)
  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  const { playMusic, setMusicContext } = useAudioManager();

  const phonePortrait = usePhonePortrait();
  const local = useUnoGame(phonePortrait);
  const online = useUnoOnlineGame();
  const api = mode === "computer" ? local : online;

  useEffect(() => {
    if (!online.room || view !== "home") return;
    const timer = setTimeout(() => {
      setMode("online");
      setView("friends");
    }, 0);
    return () => clearTimeout(timer);
  }, [online.room, view]);

  // Derive gameContext directly from api.game to avoid setState-in-effect
  const gameContext = api.game !== null ? "game" : "lobby";

  useEffect(() => {
    if (mounted) {
      try {
        window.localStorage.setItem(SHARED_RULES_KEY, JSON.stringify(rules));
        window.localStorage.setItem(RULES_VERSION_KEY, RULES_VERSION);
      } catch {}
    }
  }, [rules, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(PREFERRED_THEME_KEY, theme);
    } catch {}
    document.documentElement.dataset.theme = theme;
  }, [theme, mounted]);

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

  const selectTheme = (themeName: string) => {
    if (
      themeName === "paper" ||
      themeName === "midnight" ||
      themeName === "forest" ||
      themeName === "sunset"
    ) {
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
  const editingRoom =
    mode === "online" &&
    !!online.room &&
    !online.room.started &&
    online.room.hostPlayerId === online.playerId;
  const lobbyRules = online.room?.rules ?? rules;
  const changeRules = (newRules: Partial<GameRules>) => {
    setRules(newRules);
    if (editingRoom) void online.updateRoomRules(newRules);
  };

  const openSettingsAt = (tab: "profile" | "controls" | "audio") => {
    setSettingsTab(tab);
    setShowS(true);
  };

  const settingsModal = (
    <SettingsModal
      key={`settings-${settingsTab}-${showS ? "open" : "closed"}`}
      open={showS}
      initialTab={settingsTab}
      themeLabel={label}
      onSelectTheme={selectTheme}
      rules={editingRoom ? lobbyRules : rules}
      editingRoom={editingRoom}
      friendCode={online.friendCode}
      onCopyFriendCode={() => {
        void copyCode();
      }}
      onChange={changeRules}
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
      incomingInvites={online.incomingInvites}
      onAcceptFriendInvite={async (id) => {
        let name = "You";
        try {
          name = localStorage.getItem(ONLINE_PLAYER_NAME_KEY)?.trim() || name;
        } catch {}
        const joined = await online.acceptFriendInvite(id, name);
        if (joined) {
          setMode("online");
          setView("friends");
        }
        return joined;
      }}
      onDeclineFriendInvite={online.declineFriendInvite}
    />
  );

  let content: ReactNode = (
    <main className="loading-screen">
      <UnoWordmark />
      <p>Getting the table ready…</p>
    </main>
  );

  // Active game
  if (mounted && api.game) {
    const currentGame = api.game;
    content = (
      <>
        <GameBoard
          gameApi={api}
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
              return true;
            }
            return online.startOnlineGame(currentGame.rules);
          }}
          onOpenSettings={(tab) => openSettingsAt(tab ?? "controls")}
        />
        {settingsModal}
      </>
    );
  } else if (mounted && view === "home") {
    content = (
      <>
        <HomeScreen
          savedGame={local.savedGame}
          onResume={() => {
            if (!local.resumeGame()) {
              toast.error(
                "This saved round is no longer available. Start a new one.",
              );
              return;
            }
            if (online.room) void online.leaveRoom();
            setMode("computer");
          }}
          rules={rules}
          onRulesChange={setRules}
          themeLabel={label}
          onSelectTheme={selectTheme}
          onOpenControlsSettings={() => openSettingsAt("controls")}
          onOpenAudioSettings={() => openSettingsAt("audio")}
          onOpenProfileSettings={() => openSettingsAt("profile")}
          onComputer={() => {
            if (online.room) void online.leaveRoom();
            setMode("computer");
            setView("computer");
          }}
          onFriends={() => {
            setMode("online");
            setPanel("create");
            setView("friends");
          }}
          incomingInvites={online.incomingInvites}
          onAcceptFriendInvite={async (id) => {
            let name = "You";
            try {
              name =
                localStorage.getItem(ONLINE_PLAYER_NAME_KEY)?.trim() || name;
            } catch {}
            const joined = await online.acceptFriendInvite(id, name);
            if (joined) {
              setMode("online");
              setView("friends");
            }
            return joined;
          }}
          onDeclineFriendInvite={online.declineFriendInvite}
          onQuickPlay={() => {
            if (online.room) void online.leaveRoom();
            const names = getSavedPlayerNames();
            setMode("computer");
            local.startGame(
              names,
              rules,
              names.map((_, i) => i > 0),
            );
          }}
          onJoin={() => {
            setMode("online");
            setPanel("join");
            setView("friends");
          }}
        />
        {settingsModal}
      </>
    );
  } else if (mounted && view === "computer") {
    content = (
      <>
        <GameSetup
          rules={rules}
          onRulesChange={setRules}
          onOpenRules={() => openSettingsAt("controls")}
          startingHandSize={rules.startingHandSize ?? 7}
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
          rules={lobbyRules}
          onRulesChange={changeRules}
          onOpenRules={() => openSettingsAt("controls")}
          onPlayBots={() => {
            setMode("computer");
            setView("computer");
          }}
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
          onCreateRoom={(name) => online.createRoom(name, rules)}
          onJoinRoom={online.joinRoom}
          onSendFriendInvite={online.sendFriendInvite}
          onAcceptFriendInvite={online.acceptFriendInvite}
          onDeclineFriendInvite={online.declineFriendInvite}
          onLeaveRoom={online.leaveRoom}
          onStartGame={() => {
            setMode("online");
            return online.startOnlineGame(lobbyRules);
          }}
          onAddBotSeat={online.addBotToRoom}
          onKickPlayer={online.kickPlayer}
          onCheckFriendOnline={online.checkFriendOnline}
        />
        {settingsModal}
      </>
    );
  }

  return <>{content}</>;
}
