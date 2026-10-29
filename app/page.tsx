"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
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
import AppHeader from "../components/AppHeader";
import ProfileMenu from "../components/ProfileMenu";
import InvitationNotifications from "../components/InvitationNotifications";
import ChoiceDialog from "../components/ChoiceDialog";
import type { SettingsSection } from "../components/SettingsModal";
const SettingsModal = dynamic(() => import("../components/SettingsModal"), {
  loading: () => null,
});
const FriendsPanel = dynamic(() => import("../components/FriendsPanel"), {
  loading: () => (
    <p className="muted" role="status">
      Opening friends…
    </p>
  ),
});
import { UnoWordmark } from "../components/ui/PageChrome";
import { getPlayerName, getSavedPlayerNames } from "../lib/playerNames";
import { toast } from "sonner";
import {
  getReducedMotionSetting,
  subscribeDisplaySettings,
} from "../lib/displaySettings";

import {
  DEFAULT_TABLE_RULES,
  parseRulePreferences,
  SHARED_RULES_KEY,
  RULES_VERSION_KEY,
  RULES_VERSION,
} from "../lib/rulePreferences";
const subscribeToClient = () => () => {};
const PREFERRED_THEME_KEY = "uno.preferred.theme";

type ThemeName = "paper" | "midnight" | "forest" | "sunset";

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
  const [view, setView] = useState<"home" | "computer" | "room">(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("room")
      ? "room"
      : "home",
  );
  const [panel, setPanel] = useState<"create" | "join">(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("room")
      ? "join"
      : "create",
  );
  const [theme] = useState<ThemeName>(getInitialTheme);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsSection>("profile");
  const [inviteToJoin, setInviteToJoin] = useState<string | null>(null);
  const joiningInvite = useRef(false);
  const [joiningInvitation, setJoiningInvitation] = useState(false);
  const [rules, setRules] = useState<Partial<GameRules>>(getInitialRules);
  const [savingRules, setSavingRules] = useState(false);
  // On client this is always true; on server it's false (SSR guard)
  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );

  const phonePortrait = usePhonePortrait();
  const local = useUnoGame(phonePortrait || mode === "online");
  const online = useUnoOnlineGame();
  const api = mode === "computer" ? local : online;

  useEffect(() => {
    if (!online.room || view !== "home") return;
    const timer = setTimeout(() => {
      setMode("online");
      setView("room");
    }, 0);
    return () => clearTimeout(timer);
  }, [online.room, view]);

  // Derive gameContext directly from api.game to avoid setState-in-effect
  const gameContext = api.game !== null ? "game" : "lobby";
  useAudioManager(gameContext);
  useEffect(() => {
    const sync = () => {
      document.documentElement.dataset.reducedMotion = String(
        getReducedMotionSetting(),
      );
    };
    sync();
    return subscribeDisplaySettings(sync);
  }, []);

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

  const editingRoom =
    mode === "online" &&
    !!online.room &&
    !online.room.started &&
    online.room.hostPlayerId === online.playerId;
  const lobbyRules = online.room?.rules ?? rules;
  const changeRules = async (newRules: Partial<GameRules>) => {
    if (savingRules) return false;
    if (editingRoom) {
      setSavingRules(true);
      try {
        if (!(await online.updateRoomRules(newRules))) {
          toast.error(
            "Couldn’t save the room rules. Check your connection and try again.",
          );
          return false;
        }
      } finally {
        setSavingRules(false);
      }
    }
    setRules(newRules);
    return true;
  };

  const openSettingsAt = (tab: SettingsSection) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const joinFromInvite = async (id: string) => {
    if (joiningInvite.current) return false;
    joiningInvite.current = true;
    setJoiningInvitation(true);
    try {
      const invite = online.incomingInvites.find(
        (item) => item.inviteId === id,
      );
      if (!invite) {
        toast.error("This invitation has expired.");
        setInviteToJoin(null);
        return false;
      }
      const joined = await online.acceptFriendInvite(id, getPlayerName());
      if (joined) {
        if (local.game) local.resetGame();
        setMode("online");
        setView("room");
        setSettingsOpen(false);
      } else toast.error("Couldn’t join that invitation. It may have expired.");
      return joined;
    } catch {
      toast.error("Couldn’t join. Try again.");
      return false;
    } finally {
      joiningInvite.current = false;
      setJoiningInvitation(false);
    }
  };
  const acceptInvitation = async (id: string) => {
    if (joiningInvite.current) return false;
    const invite = online.incomingInvites.find((item) => item.inviteId === id);
    if (api.game || (online.room && online.room.roomId !== invite?.roomId)) {
      if (!invite) return false;
      setInviteToJoin(id);
      return false;
    }
    return joinFromInvite(id);
  };
  const sendRoomInvite = async (code: string) => {
    if (!online.room && !(await online.createRoom(getPlayerName(), rules)))
      return false;
    const ok = await online.sendFriendInvite(code, getPlayerName());
    if (ok) {
      setMode("online");
      setView("room");
      setSettingsOpen(false);
    }
    return ok;
  };
  const profileMenuProps = {
    onOpenProfile: () => openSettingsAt("profile"),
    onOpenFriends: () => openSettingsAt("friends"),
    onOpenSettings: () => openSettingsAt("overview"),
    notificationCount:
      online.incomingInvites.length + online.social.incomingRequests.length,
  };
  const startLocalGame = (names: string[], bots: boolean[]) => {
    try {
      local.startGame(names, rules, bots);
      if (online.room) void online.leaveRoom();
      setMode("computer");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn’t deal. Try fewer cards or players.",
      );
      setMode("computer");
      setView("computer");
    }
  };

  const settingsModal = settingsOpen ? (
    <SettingsModal
      key={settingsTab}
      open
      initialTab={settingsTab}
      rules={
        api.game?.rules ??
        (online.room && mode === "online" ? lobbyRules : rules)
      }
      editingRoom={editingRoom}
      readOnlyRules={
        !!api.game || (mode === "online" && !!online.room && !editingRoom)
      }
      savingRules={savingRules}
      friendNotificationCount={
        online.incomingInvites.length + online.social.incomingRequests.length
      }
      friendsContent={
        <FriendsPanel
          social={online.social}
          friendCode={online.friendCode}
          connected={online.connected}
          incomingInvites={online.incomingInvites}
          canInvite={!api.game && !online.room?.started}
          seatedCodes={
            online.room?.players.flatMap((player) =>
              player.friendCode ? [player.friendCode] : [],
            ) ?? []
          }
          invitedCodes={online.outgoingInvites.map(
            (invite) => invite.targetFriendCode,
          )}
          onRequest={online.sendFriendRequest}
          onRespond={online.respondToFriendRequest}
          onRemove={online.removeFriend}
          onInvite={sendRoomInvite}
          onAcceptInvite={acceptInvitation}
          onDeclineInvite={online.declineFriendInvite}
        />
      }
      onSetUpBots={
        !api.game && !online.room
          ? () => {
              setSettingsOpen(false);
              setMode("computer");
              setView("computer");
            }
          : undefined
      }
      onChange={changeRules}
      onClose={() => setSettingsOpen(false)}
    />
  ) : null;

  const topBar = <AppHeader {...profileMenuProps} />;

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
          profileMenu={<ProfileMenu {...profileMenuProps} />}
          onReset={() => {
            api.resetGame();
            setMode("computer");
            setView("home");
          }}
          onDealAgain={() => {
            if (mode === "computer") {
              return local.startRematch();
            }
            return online.startOnlineGame(currentGame.rules);
          }}
        />
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
          onRulesChange={changeRules}
          controls={topBar}
          onCreateRoom={() => {
            setMode("online");
            setPanel("create");
            setView("room");
          }}
          onQuickPlay={() => {
            const names = getSavedPlayerNames();
            startLocalGame(
              names,
              names.map((_, i) => i > 0),
            );
          }}
          onJoin={() => {
            setMode("online");
            setPanel("join");
            setView("room");
          }}
        />
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
            startLocalGame(names, botFlags);
          }}
        />
      </>
    );
  } else if (mounted) {
    content = (
      <>
        <OnlineLobby
          savingRules={savingRules}
          rules={lobbyRules}
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
          social={online.social}
          invitedCodes={online.outgoingInvites.map(
            (invite) => invite.targetFriendCode,
          )}
          onRequestFriend={online.sendFriendRequest}
          onInviteFriend={sendRoomInvite}
          onOpenFriends={() => openSettingsAt("friends")}
          error={online.error}
          onCreateRoom={(name) => online.createRoom(name, rules)}
          onJoinRoom={online.joinRoom}
          onLeaveRoom={online.leaveRoom}
          onStartGame={() => {
            setMode("online");
            return online.startOnlineGame(lobbyRules);
          }}
          onAddBotSeat={online.addBotToRoom}
          onKickPlayer={online.kickPlayer}
        />
      </>
    );
  }

  return (
    <>
      {content}
      {settingsModal}
      <InvitationNotifications
        suspended={Boolean(inviteToJoin)}
        invites={online.incomingInvites}
        requests={online.social.incomingRequests}
        connected={online.connected}
        onAccept={acceptInvitation}
        onDecline={online.declineFriendInvite}
        onOpenFriends={() => openSettingsAt("friends")}
      />
      {inviteToJoin && (
        <ChoiceDialog
          title="Join the other table?"
          description="You’ll leave your current table to accept this invitation."
          actions={[
            {
              label: "Stay here",
              variant: "secondary",
              onClick: () => setInviteToJoin(null),
              disabled: joiningInvitation,
            },
            {
              label: joiningInvitation ? "Joining…" : "Leave and join",
              variant: "primary",
              disabled: joiningInvitation,
              busy: joiningInvitation,
              onClick: async () => {
                if (await joinFromInvite(inviteToJoin)) setInviteToJoin(null);
              },
            },
          ]}
        />
      )}
    </>
  );
}
