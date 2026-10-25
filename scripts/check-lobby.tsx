// Room guidance follows published rules and keeps the deal decision reachable.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type OnlineLobbyComponent from '../components/OnlineLobby';
import type SettingsModalComponent from '../components/SettingsModal';
import type TableScoreCardComponent from '../components/TableScoreCard';
import { defaultRules } from '../types/rules';

// The assertions inspect rendered content; Next owns CSS module compilation.
const require = createRequire(import.meta.url);
const cssLoader = require.extensions['.css'];
require.extensions['.css'] = () => {};
const OnlineLobby: typeof OnlineLobbyComponent =
  require('../components/OnlineLobby').default;
const SettingsModal: typeof SettingsModalComponent =
  require('../components/SettingsModal').default;
const TableScoreCard: typeof TableScoreCardComponent =
  require('../components/TableScoreCard').default;
if (cssLoader) require.extensions['.css'] = cssLoader;
else delete require.extensions['.css'];

const ok = async () => true;
const props: ComponentProps<typeof OnlineLobby> = {
  rules: defaultRules,
  onRulesChange() {},
  onOpenRules() {},
  connected: true,
  playerId: 'host',
  friendCode: 'ABCD2345',
  incomingInvites: [],
  outgoingInvites: [],
  error: null,
  onSyncPresence: ok,
  onCheckFriendOnline: async () => ({}),
  onCreateRoom: ok,
  onJoinRoom: ok,
  onSendFriendInvite: ok,
  onAcceptFriendInvite: ok,
  onDeclineFriendInvite: ok,
  onLeaveRoom: ok,
  onStartGame: ok,
  onAddBotSeat: ok,
  onKickPlayer: ok,
  room: {
    roomId: 'ABC234',
    hostPlayerId: 'host',
    started: false,
    game: null,
    pendingColorChoice: null,
    players: [
      {
        playerId: 'host',
        name: 'You',
        connected: true,
        isBot: false,
        ready: false,
      },
      {
        playerId: 'guest',
        name: 'Guest',
        connected: false,
        isBot: false,
        ready: false,
      },
    ],
    rules: {
      startingHandSize: 5,
      canFinishWithActionCard: false,
      mustDeclareUno: false,
    },
  },
};
const host = renderToStaticMarkup(<OnlineLobby {...props} />);
assert.ok(host.indexOf('Deal everyone in') < host.indexOf('Table rules'));
assert.doesNotMatch(host, /You \(you\)/);
const guest = renderToStaticMarkup(<OnlineLobby {...props} playerId="guest" />);
assert.match(
  guest,
  /5 each/,
  'Published room rules take priority over saved preferences',
);
assert.match(guest, /Finish with a number/);
assert.match(guest, /Not required/);
assert.match(guest, /aria-label="Reconnecting"/);
assert.match(
  guest,
  /One card per draw/,
  'Unspecified settings retain engine defaults',
);
assert.doesNotMatch(guest, /guest-rules-card|Double-play/);
const offline = renderToStaticMarkup(
  <OnlineLobby {...props} connected={false} />,
);
assert.match(
  offline,
  /disabled=""[^>]*aria-label="Remove Guest"|aria-label="Remove Guest"[^>]*disabled=""/,
);
assert.match(
  offline,
  /disabled=""[^>]*>[^<]*<svg[^>]*class="lucide lucide-plus/,
);
const settingsProps = {
  open: true,
  rules: defaultRules,
  onChange() {},
  onClose() {},
};
const rulesPanel = renderToStaticMarkup(<SettingsModal {...settingsProps} />);
for (const group of [
  'Drawing &amp; stacking',
  'UNO &amp; finishing',
  'Special cards &amp; moves',
  'Table flow',
]) {
  assert.ok(rulesPanel.includes(`<legend>${group}</legend>`));
}
assert.equal(
  (rulesPanel.match(/role="switch"/g) ?? []).length,
  12,
  'Every supported rule remains configurable',
);
const profile = renderToStaticMarkup(
  <SettingsModal {...settingsProps} initialTab="profile" />,
);
assert.match(
  profile,
  /disabled=""[^>]*>Save name/,
  'An unchanged name is already saved',
);
const audio = renderToStaticMarkup(
  <SettingsModal {...settingsProps} initialTab="audio" />,
);
assert.match(audio, /aria-valuetext="55 percent"/);
assert.match(audio, /aria-valuetext="24 percent"/);
assert.match(rulesPanel, /aria-label="Bot challenge"/);
assert.match(rulesPanel, /value="standard" selected=""/);
const tactical = renderToStaticMarkup(
  <SettingsModal
    {...settingsProps}
    rules={{ ...defaultRules, botDifficulty: 'tactical' }}
  />,
);
assert.match(tactical, /value="tactical" selected=""/);
const scorePlayers = [
  { id: 'one', name: 'Alex' },
  { id: 'two', name: 'Jo' },
];
assert.equal(
  renderToStaticMarkup(<TableScoreCard players={scorePlayers} />),
  '',
);
const scores = renderToStaticMarkup(
  <TableScoreCard
    players={scorePlayers}
    localPlayerId="one"
    score={{ completedRounds: 3, wins: { one: 1, two: 2 }, lastRoundId: 'r3' }}
  />,
);
assert.match(scores, /3 completed rounds/);
assert.match(scores, /aria-label="1 win"/);
assert.match(scores, /aria-label="2 wins"/);
assert.ok(
  scores.indexOf('Jo') < scores.indexOf('Alex'),
  'Actual win totals determine display order',
);
assert.ok(props.room);
const scoredLobby = renderToStaticMarkup(
  <OnlineLobby
    {...props}
    room={{
      ...props.room,
      tableScore: {
        completedRounds: 1,
        wins: { host: 1, guest: 0 },
        lastRoundId: 'lobby-round',
      },
    }}
  />,
);
assert.match(scoredLobby, /aria-label="Wins at this table"/);
assert.ok(
  scoredLobby.indexOf('Deal everyone in') <
    scoredLobby.indexOf('Wins at this table'),
  'Dealing remains ahead of the score in the lobby',
);
assert.match(
  tactical,
  /Saves wilds, builds color runs and watches hand counts/,
);
console.log(
  'Supporting UI checks passed: published room rules, settings groups, profile save state and audio value labels.',
);
