'use client';

import { useEffect, useState } from 'react';
import type { GameRules } from '../types/rules';
import { useUnoGame } from '../hooks/useUnoGame';
import { useUnoOnlineGame } from '../hooks/useUnoOnlineGame';
import GameBoard from '../components/GameBoard';
import GameSetup from '../components/GameSetup';
import HomeScreen from '../components/home/HomeScreen';
import OnlineLobby from '../components/OnlineLobby';
import SettingsModal from '../components/SettingsModal';
import { SetupUtilityBar } from '../components/ui/PageChrome';
import { toast } from 'sonner';

const SHARED_RULES_KEY   = 'uno.shared.rules';
const PREFERRED_THEME_KEY = 'uno.preferred.theme';

type ThemeName = 'paper' | 'midnight' | 'forest' | 'sunset';

const THEMES: Record<ThemeName, { label: string; vars: Record<string, string> }> = {
  paper: {
    label: 'Light',
    vars: {
      '--ui-bg':           '#fafafa',
      '--ui-surface':      '#ffffff',
      '--ui-text':         '#212121',
      '--ui-muted':        'rgba(33,33,33,0.54)',
      '--ui-line':         'rgba(0,0,0,0.12)',
      '--ui-accent-red':   '#e53935',
      '--ui-accent-yellow':'#f9a825',
      '--ui-accent-green': '#43a047',
      '--ui-accent-blue':  '#1e88e5',
    },
  },
  midnight: {
    label: 'Dark',
    vars: {
      '--ui-bg':           '#121212',
      '--ui-surface':      '#1e1e1e',
      '--ui-text':         '#e0e0e0',
      '--ui-muted':        'rgba(224,224,224,0.6)',
      '--ui-line':         'rgba(255,255,255,0.12)',
      '--ui-accent-red':   '#ef5350',
      '--ui-accent-yellow':'#fdd835',
      '--ui-accent-green': '#66bb6a',
      '--ui-accent-blue':  '#42a5f5',
    },
  },
  forest: {
    label: 'Teal',
    vars: {
      '--ui-bg':           '#e0f2f1',
      '--ui-surface':      '#ffffff',
      '--ui-text':         '#004d40',
      '--ui-muted':        'rgba(0,77,64,0.6)',
      '--ui-line':         'rgba(0,77,64,0.15)',
      '--ui-accent-red':   '#e53935',
      '--ui-accent-yellow':'#f9a825',
      '--ui-accent-green': '#00897b',
      '--ui-accent-blue':  '#1e88e5',
    },
  },
  sunset: {
    label: 'Purple',
    vars: {
      '--ui-bg':           '#1a0033',
      '--ui-surface':      '#2d0057',
      '--ui-text':         '#ede7f6',
      '--ui-muted':        'rgba(237,231,246,0.65)',
      '--ui-line':         'rgba(237,231,246,0.18)',
      '--ui-accent-red':   '#ef9a9a',
      '--ui-accent-yellow':'#fff59d',
      '--ui-accent-green': '#a5d6a7',
      '--ui-accent-blue':  '#ce93d8',
    },
  },
};

const DEFAULT_RULES: Partial<GameRules> = {
  stackDraw2: false, stackWild4: false, allowWild4OnDraw2: false,
  drawUntilPlayable: false, reverseActsAsSkipInTwoPlayer: true,
  mustDeclareUno: true, allowStartingActionCard: true,
  allowDoublePlaySameNumber: false, maxPlayers: 4,
};

function getInitialRules(): Partial<GameRules> {
  if (typeof window === 'undefined') return DEFAULT_RULES;
  try {
    const raw = window.localStorage.getItem(SHARED_RULES_KEY);
    if (!raw) return DEFAULT_RULES;
    return { ...DEFAULT_RULES, ...(JSON.parse(raw) as Partial<GameRules>) };
  } catch { return DEFAULT_RULES; }
}

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'paper';
  try {
    const raw = window.localStorage.getItem(PREFERRED_THEME_KEY);
    return raw === 'midnight' || raw === 'forest' || raw === 'sunset' ? raw : 'paper';
  } catch { return 'paper'; }
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mode,  setMode]   = useState<'online' | 'computer'>('computer');
  const [view,  setView]   = useState<'home' | 'computer' | 'friends'>('home');
  const [panel, setPanel]  = useState<'create' | 'join'>('create');
  const [theme, setTheme]  = useState<ThemeName>(getInitialTheme);
  const [showS, setShowS]  = useState(false);
  const [rules, setRules]  = useState<Partial<GameRules>>(getInitialRules);

  const local  = useUnoGame();
  const online = useUnoOnlineGame();
  const api    = mode === 'computer' ? local : online;

  useEffect(() => { try { window.localStorage.setItem(SHARED_RULES_KEY, JSON.stringify(rules)); } catch {} }, [rules]);

  useEffect(() => {
    try { window.localStorage.setItem(PREFERRED_THEME_KEY, theme); } catch {}
    const root = document.documentElement;
    for (const [k, v] of Object.entries(THEMES[theme].vars)) root.style.setProperty(k, v);
  }, [theme]);

  const cycleTheme = () => {
    const order: ThemeName[] = ['paper', 'midnight', 'forest', 'sunset'];
    setTheme(p => order[(order.indexOf(p) + 1) % order.length]);
  };

  const copyCode = async () => {
    if (!online.friendCode) return;
    try { await navigator.clipboard.writeText(online.friendCode); toast.success('Friend code copied.'); }
    catch { toast.error('Could not copy friend code.'); }
  };

  const label = THEMES[theme].label;

  const settingsModal = (
    <SettingsModal
      open={showS} rules={rules}
      friendCode={online.friendCode}
      onCopyFriendCode={() => { void copyCode(); }}
      onChange={setRules} onClose={() => setShowS(false)}
    />
  );

  const topBar = (
    <SetupUtilityBar
      themeLabel={label} onTheme={cycleTheme}
      onSettings={() => setShowS(true)}
    />
  );

  // Active game
  if (api.game) {
    const currentGame = api.game;
    return (
      <>
        <GameBoard
          gameApi={api as ReturnType<typeof useUnoGame>}
          onReset={() => { api.resetGame(); setMode('computer'); setView('home'); }}
          onDealAgain={() => {
            if (mode === 'computer') {
              local.startGame(
                currentGame.players.map((player) => player.name),
                currentGame.rules,
                currentGame.players.map((player) => player.isBot),
              );
              return;
            }
            void online.startOnlineGame(currentGame.rules);
          }}
          onOpenSettings={() => setShowS(true)}
          onCycleTheme={cycleTheme}
          currentThemeLabel={label}
        />
        {settingsModal}
      </>
    );
  }

  if (view === 'home') {
    return (
      <>
        <HomeScreen
          themeLabel={label} onTheme={cycleTheme} onSettings={() => setShowS(true)}
          onComputer={() => { setMode('computer'); setView('computer'); }}
          onFriends={() => { setMode('online'); setPanel('create'); setView('friends'); }}
        />
        {settingsModal}
      </>
    );
  }

  if (view === 'computer') {
    return (
      <>
        <GameSetup
          controls={topBar}
          onBack={() => setView('home')}
          onStart={(names, botFlags) => { setMode('computer'); local.startGame(names, rules, botFlags); }}
        />
        {settingsModal}
      </>
    );
  }

  return (
    <>
      <OnlineLobby
        controls={topBar}
        onBack={() => setView('home')}
        initialPanel={panel}
        connected={online.connected}
        room={online.room}
        playerId={online.playerId}
        friendCode={online.friendCode}
        incomingInvites={online.incomingInvites}
        error={online.error}
        onSyncPresence={online.syncPresence}
        onCreateRoom={online.createRoom}
        onJoinRoom={online.joinRoom}
        onSendFriendInvite={online.sendFriendInvite}
        onAcceptFriendInvite={online.acceptFriendInvite}
        onDeclineFriendInvite={online.declineFriendInvite}
        onLeaveRoom={online.leaveRoom}
        onStartGame={() => { setMode('online'); return online.startOnlineGame(rules); }}
        onAddBotSeat={online.addBotToRoom}
        onKickPlayer={online.kickPlayer}
      />
      {settingsModal}
    </>
  );
}
