// Room guidance follows published rules and keeps the deal decision reachable.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type OnlineLobbyComponent from '../components/OnlineLobby';
import type SettingsModalComponent from '../components/SettingsModal';
import type TableScoreCardComponent from '../components/TableScoreCard';
import type PlayerAvatarComponent from '../components/PlayerAvatar';
import type RulesSummaryComponent from '../components/RulesSummary';
import type HowToPlayModalComponent from '../components/HowToPlayModal';
import type CardPlayDialogComponent from '../components/CardPlayDialog';
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
const PlayerAvatar: typeof PlayerAvatarComponent =
  require('../components/PlayerAvatar').default;
const CardPlayDialog: typeof CardPlayDialogComponent =
  require('../components/CardPlayDialog').default;
const RulesSummary: typeof RulesSummaryComponent =
  require('../components/RulesSummary').default;
const HowToPlayModal: typeof HowToPlayModalComponent =
  require('../components/HowToPlayModal').default;
if (cssLoader) require.extensions['.css'] = cssLoader;
else delete require.extensions['.css'];

const ok = async () => true;
const props: ComponentProps<typeof OnlineLobby> = {
  rules: defaultRules,
  onOpenRules() {},
  connected: true,
  playerId: 'host',
  error: null,
  social: { friends: [], incomingRequests: [], outgoingRequests: [] },
  invitedCodes: [],
  onRequestFriend: ok,
  onInviteFriend: ok,
  onOpenFriends() {},
  onCreateRoom: ok,
  onJoinRoom: ok,
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
assert.match(host, /<footer class="setup-footer">[\s\S]*Deal everyone in/);
assert.equal((host.match(/Deal everyone in/g) ?? []).length, 1);
assert.doesNotMatch(host, /You \(you\)/);
const guest = renderToStaticMarkup(<OnlineLobby {...props} playerId="guest" />);
assert.match(guest, /5 cards each/, 'The room summary follows published rules');
assert.match(guest, /aria-label="Reconnecting"/);
assert.doesNotMatch(
  guest,
  /class="rule-presets"|role="switch"|avatar-picker|online-name/,
);
const joinOnly = renderToStaticMarkup(
  <OnlineLobby {...props} room={null} initialPanel="join" />,
);
assert.match(joinOnly, /Join the room/);
assert.match(joinOnly, /id="room-code"/);
assert.doesNotMatch(
  joinOnly,
  /id="online-name"|avatar-picker|Friends &amp; invitations|role="switch"/,
);
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
  initialTab: 'controls' as const,
  rules: { ...defaultRules, stackDraw2: true },
  onChange() {},
  onClose() {},
};
const rulesPanel = renderToStaticMarkup(
  <SettingsModal {...settingsProps} initialTab="controls" />,
);
assert.match(rulesPanel, /Pin up to 3 to Home/);
assert.match(rulesPanel, /Classic UNO/);
assert.match(rulesPanel, /UNO Show ’Em No Mercy/);
assert.match(rulesPanel, /UNO All Wild/);
assert.equal(
  (rulesPanel.match(/role="switch"/g) ?? []).length,
  0,
  'House-rule controls stay unmounted until editing a custom copy',
);
const profile = renderToStaticMarkup(
  <SettingsModal {...settingsProps} initialTab="profile" />,
);
const liveRules = renderToStaticMarkup(
  <SettingsModal
    {...settingsProps}
    readOnlyRules
    rules={{ ...defaultRules, startingHandSize: 12 }}
  />,
);
assert.match(liveRules, /12 each/);
assert.match(liveRules, /Rules for this table/);
assert.doesNotMatch(
  liveRules,
  /role="switch"|Reset to classic rules|class="rule-presets"/,
);
const savingRules = renderToStaticMarkup(
  <SettingsModal {...settingsProps} editingRoom savingRules />,
);
assert.match(savingRules, /<fieldset[^>]*disabled=""[^>]*aria-busy="true"/);
assert.match(savingRules, /Saving room rules/);
assert.match(profile, /Your name/);
assert.equal(
  (profile.match(/aria-pressed=/g) ?? []).length,
  13,
  'Ready-made avatars are immediately available',
);
assert.doesNotMatch(
  profile,
  /Save name|avatar-customizer|Edit avatar|Saved on this device|Appearance/,
);
const overview = renderToStaticMarkup(
  <SettingsModal {...settingsProps} initialTab="overview" />,
);
assert.match(overview, /aria-label="Settings sections"/);
assert.doesNotMatch(
  overview,
  /avatar-options|role="switch"|Appearance|Saved on this device/,
);
const extendedPortrait = renderToStaticMarkup(
  <PlayerAvatar seed="portrait-check" avatarId="portrait-11" />,
);
assert.match(extendedPortrait, /player-portraits-extended.webp/);
assert.match(
  extendedPortrait,
  /background-position:100% 100%/,
  'Two-digit portrait IDs select the correct sheet cell',
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
assert.doesNotMatch(
  scoredLobby,
  /aria-label="Wins at this table"/,
  'Room setup stays focused on its seats',
);
assert.match(
  scoredLobby,
  /<footer class="setup-footer">[\s\S]*Deal everyone in/,
);
assert.match(
  tactical,
  /Saves wilds, builds color runs and watches hand counts/,
);
console.log(
  'Supporting UI checks passed: published room rules, settings groups, profile save state and audio value labels.',
);

// Duplicate physical lead cards must not create duplicate pair-only choices.
const bluePairCard = { id: 'blue-pair', color: 'blue', value: '8' } as const;
const pairOnly = renderToStaticMarkup(
  <CardPlayDialog
    card={bluePairCard}
    choices={['red-a', 'red-b'].map((id) => ({
      cards: [{ id, color: 'red' as const, value: '8' as const }, bluePairCard],
      remaining: 1,
      secondCardId: bluePairCard.id,
    }))}
    mustDeclareUno
    saidUno={false}
    onPlay={() => {}}
    onClose={() => {}}
  />,
);
assert.equal((pairOnly.match(/class="card-play-option"/g) ?? []).length, 1);
assert.equal(
  pairOnly.includes('Play just blue'),
  false,
  'A pair-only activation never offers an illegal single',
);
assert.ok(pairOnly.includes('blue is next'));

const publishedOnly = renderToStaticMarkup(
  <OnlineLobby
    {...props}
    playerId="guest"
    rules={{
      ...defaultRules,
      allowDoublePlaySameNumber: true,
      allowDiscardAll: true,
    }}
  />,
);
assert.match(publishedOnly, /5 cards each/);
assert.doesNotMatch(publishedOnly, /class="rule-presets"|role="switch"/);
const recovery = renderToStaticMarkup(
  <OnlineLobby
    {...props}
    room={null}
    connected={false}
    error={null}
    onPlayBots={() => {}}
  />,
);
assert.match(recovery, /Connecting to rooms/);
assert.match(recovery, /Play with bots/);
assert.match(recovery, /form="[^"]+"/);
const guide = renderToStaticMarkup(
  <HowToPlayModal
    open
    inGame
    rules={{
      startingHandSize: 12,
      allowDoublePlaySameNumber: true,
      allowDiscardAll: true,
      mustDeclareUno: false,
    }}
    onClose={() => {}}
  />,
);
assert.match(guide, /<h2[^>]*>How to play<\/h2>/);
assert.doesNotMatch(guide, /<h2[^>]*><\/h2>/);
assert.match(guide, /12 each/);
assert.match(guide, /Same number; either color/);
assert.match(guide, /Not required/);
assert.match(guide, /practice examples show basic play/);
assert.match(guide, /aria-current="step"/);
const optionalRules = renderToStaticMarkup(
  <RulesSummary
    rules={{ startingHandSize: undefined, mustDeclareUno: undefined }}
  />,
);
assert.match(optionalRules, /7 each/);
assert.match(optionalRules, /Call with one card left/);
console.log(
  'Setup, room recovery, published-only rule help, rule dependencies and native help naming passed.',
);
