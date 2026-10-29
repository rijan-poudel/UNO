// Room guidance follows published rules and keeps the deal decision reachable.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type OnlineLobbyComponent from '../components/OnlineLobby';
import type SettingsModalComponent from '../components/SettingsModal';
import type TableScoreCardComponent from '../components/TableScoreCard';
import type RoundSummaryComponent from '../components/RoundSummary';
import type GameSetupComponent from '../components/GameSetup';
import type RematchStatusComponent from '../components/RematchStatus';
import type ChoiceDialogComponent from '../components/ChoiceDialog';
import type ColorPickerComponent from '../components/ColorPicker';
import type PlayerAvatarComponent from '../components/PlayerAvatar';
import type RulesSummaryComponent from '../components/RulesSummary';
import type HowToPlayModalComponent from '../components/HowToPlayModal';
import type CardPlayDialogComponent from '../components/CardPlayDialog';
import type FriendInvitePickerComponent from '../components/FriendInvitePicker';
import type FriendsPanelComponent from '../components/FriendsPanel';
import type UnoCardComponent from '../components/UnoCard';
import type CardSymbolGuideComponent from '../components/CardSymbolGuide';
import type OpponentSeatComponent from '../components/OpponentSeat';
import type PracticeHandComponent from '../components/PracticeHand';
import type { CardValue } from '../types/card';
import { defaultRules, NO_MERCY_RULES } from '../types/rules';
import { initializeGame } from '../lib/gameSetup';

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
const RoundSummary: typeof RoundSummaryComponent =
  require('../components/RoundSummary').default;
const GameSetup: typeof GameSetupComponent =
  require('../components/GameSetup').default;
const RematchStatus: typeof RematchStatusComponent =
  require('../components/RematchStatus').default;
const ChoiceDialog: typeof ChoiceDialogComponent =
  require('../components/ChoiceDialog').default;
const ColorPicker: typeof ColorPickerComponent =
  require('../components/ColorPicker').default;
const PlayerAvatar: typeof PlayerAvatarComponent =
  require('../components/PlayerAvatar').default;
const CardPlayDialog: typeof CardPlayDialogComponent =
  require('../components/CardPlayDialog').default;
const FriendInvitePicker: typeof FriendInvitePickerComponent =
  require('../components/FriendInvitePicker').default;
const FriendsPanel: typeof FriendsPanelComponent =
  require('../components/FriendsPanel').default;
const UnoCard: typeof UnoCardComponent =
  require('../components/UnoCard').default;
const CardSymbolGuide: typeof CardSymbolGuideComponent =
  require('../components/CardSymbolGuide').default;
const OpponentSeat: typeof OpponentSeatComponent =
  require('../components/OpponentSeat').default;
const PracticeHand: typeof PracticeHandComponent =
  require('../components/PracticeHand').default;
const RulesSummary: typeof RulesSummaryComponent =
  require('../components/RulesSummary').default;
const HowToPlayModal: typeof HowToPlayModalComponent =
  require('../components/HowToPlayModal').default;
if (cssLoader) require.extensions['.css'] = cssLoader;
else delete require.extensions['.css'];

for (const value of [
  'skip',
  'reverse',
  'draw2',
  'draw4',
  'wild4',
  'skipEveryone',
  'discardAll',
  'wildReverseDraw4',
  'wildDraw6',
  'wildDraw10',
  'wildColorRoulette',
  'wildSkip2',
  'wildTargetDraw2',
  'wildForcedSwap',
] satisfies CardValue[]) {
  const face = renderToStaticMarkup(
    <UnoCard card={{ id: `symbol-${value}`, color: 'wild', value }} />,
  );
  assert.match(
    face,
    new RegExp(`data-card-symbol="${value}"`),
    `${value} has a real printed symbol, not a blank center`,
  );
  assert.match(
    face,
    /role="img" aria-label="[^"]+"/,
    'Card names remain accessible independently of the symbol',
  );
}
const closedGuide = renderToStaticMarkup(<CardSymbolGuide mode="no_mercy" />);
assert.match(closedGuide, /Card symbols/);
assert.doesNotMatch(
  closedGuide,
  /data-card-symbol/,
  'The optional card reference does not mount card faces until opened',
);
const closedPractice = renderToStaticMarkup(<PracticeHand mode="all_wild" />);
assert.match(closedPractice, /Try a practice hand/);
assert.doesNotMatch(
  closedPractice,
  /Practice table|Your practice cards|data-card-symbol/,
  'Practice examples stay unmounted until requested',
);
const crowdedSeat: ComponentProps<typeof OpponentSeat> = {
  player: {
    id: 'seat',
    name: 'Cleo',
    isBot: true,
    saidUno: false,
    hand: Array.from({ length: 20 }, (_, i) => ({
      id: `held-${i}`,
      color: 'red',
      value: '1',
    })),
  },
  active: false,
  expression: 'neutral',
  position: 'seat-top',
  offline: false,
  canCatch: false,
  onCatch() {},
};
assert.doesNotMatch(
  renderToStaticMarkup(<OpponentSeat {...crowdedSeat} />),
  /seat-mercy-danger|Mercy Danger/,
  'A large hand has no knockout warning when the table has no Mercy rule',
);
assert.match(
  renderToStaticMarkup(<OpponentSeat {...crowdedSeat} mercyLimit={25} />),
  /seat-mercy-danger/,
  'The same hand warns near the actual configured knockout limit',
);
const targetSeat = renderToStaticMarkup(
  <OpponentSeat
    {...crowdedSeat}
    targetAction="Swap hands with"
    onTarget={() => {}}
  />,
);
assert.match(targetSeat, /<button[^>]*data-target="seat"/);
assert.match(targetSeat, /aria-label="Swap hands with Cleo, 20 cards"/);
assert.doesNotMatch(targetSeat, /Catch Cleo/);

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
assert.match(joinOnly, /focused-room mood-classic room-entry/);
const mercyEntry = renderToStaticMarkup(
  <OnlineLobby
    {...props}
    room={null}
    rules={{ ...defaultRules, gameMode: 'no_mercy' }}
  />,
);
assert.match(mercyEntry, /focused-room mood-no-mercy room-entry/);
assert.doesNotMatch(
  joinOnly,
  /id="online-name"|avatar-picker|Friends &amp; invitations|role="switch"/,
);
const offline = renderToStaticMarkup(
  <OnlineLobby {...props} connected={false} />,
);
const friend = {
  friendCode: 'FRIEND23',
  name: 'Cleo',
  status: 'online' as const,
};
const invitedFriends = renderToStaticMarkup(
  <FriendsPanel
    social={{ friends: [friend], incomingRequests: [], outgoingRequests: [] }}
    friendCode="PLAYER23"
    connected
    incomingInvites={[]}
    canInvite
    seatedCodes={[]}
    invitedCodes={[friend.friendCode]}
    onRequest={ok}
    onRespond={ok}
    onRemove={ok}
    onInvite={ok}
    onAcceptInvite={ok}
    onDeclineInvite={ok}
  />,
);
assert.match(
  invitedFriends,
  /<button[^>]*disabled=""[^>]*>Invited/,
  'The Friends task disables invitations that are already pending',
);
const inviteEmpty = renderToStaticMarkup(
  <FriendInvitePicker
    friends={[]}
    invitedCodes={[]}
    seatedCodes={[]}
    connected
    onInvite={ok}
    onClose={() => {}}
    onOpenFriends={() => {}}
  />,
);
assert.match(inviteEmpty, /settings-modal friend-picker-modal/);
assert.match(inviteEmpty, /Add a friend to invite them to your table/);
assert.match(
  inviteEmpty,
  /class="modal-footer"[\s\S]*Add friends/,
  'The invite empty state has a reachable next step in its fixed footer',
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
assert.match(scores, /role="img" aria-label="1 win"/);
assert.match(scores, /role="img" aria-label="2 wins"/);
assert.ok(
  scores.indexOf('Jo') < scores.indexOf('Alex'),
  'Actual win totals determine display order',
);
const mercyRound = initializeGame(['You', 'Cleo', 'Jules'], NO_MERCY_RULES);
const mercyFinish = renderToStaticMarkup(
  <RoundSummary
    game={{
      ...mercyRound,
      winnerId: mercyRound.players[0].id,
      players: mercyRound.players.map((player, index) =>
        index === 0 ? player : { ...player, hand: [], eliminated: true },
      ),
    }}
    localPlayerId={mercyRound.players[0].id}
  />,
);
assert.match(mercyFinish, /Last player standing/);
assert.equal(
  (mercyFinish.match(/role="img" aria-label="Knocked out"/g) ?? []).length,
  2,
);
assert.doesNotMatch(
  mercyFinish,
  /aria-label="0 cards left"/,
  'Cleared knockout hands must never look like empty-hand finishes',
);
const emptyHandFinish = renderToStaticMarkup(
  <RoundSummary
    game={{
      ...mercyRound,
      winnerId: mercyRound.players[0].id,
      players: mercyRound.players.map((player, index) =>
        index === 0 ? { ...player, hand: [] } : player,
      ),
    }}
    localPlayerId={mercyRound.players[0].id}
  />,
);
assert.match(emptyHandFinish, /aria-label="0 cards left"/);
assert.doesNotMatch(emptyHandFinish, /Last player standing|Knocked out/);
for (const limit of [0, 25]) {
  const setup = renderToStaticMarkup(
    <GameSetup
      rules={{ ...NO_MERCY_RULES, eliminationHandLimit: limit }}
      onStart={() => {}}
      onRulesChange={() => {}}
      onOpenRules={() => {}}
    />,
  );
  assert.equal(
    setup.includes('last player standing'),
    limit > 0,
    'Setup must describe the configured win condition',
  );
}
assert.ok(props.room);
const readiness = renderToStaticMarkup(
  <RematchStatus
    room={{
      ...props.room,
      players: [
        {
          playerId: 'host',
          name: 'Host',
          isBot: false,
          connected: true,
          ready: false,
        },
        {
          playerId: 'guest',
          name: 'Guest',
          isBot: false,
          connected: false,
          ready: true,
        },
        {
          playerId: 'bot',
          name: 'Bot',
          isBot: true,
          connected: false,
          ready: false,
        },
      ],
    }}
    playerId="host"
    starting={false}
    connected
  />,
);
assert.match(readiness, /<details[^>]*>/);
assert.match(
  readiness,
  /1 of 2 ready/,
  'Offline humans do not count as ready; bots do',
);
assert.match(readiness, /Offline/);
assert.doesNotMatch(readiness, /Waiting on players|Tap Ready|Guest<\/small>/);
const pendingChoice = renderToStaticMarkup(
  <ChoiceDialog
    title="Join the other table?"
    description="Leave this table?"
    actions={[
      {
        label: 'Stay here',
        variant: 'secondary',
        disabled: true,
        onClick() {},
      },
      {
        label: 'Joining…',
        variant: 'primary',
        disabled: true,
        busy: true,
        onClick() {},
      },
    ]}
  />,
);
assert.equal((pendingChoice.match(/disabled=""/g) ?? []).length, 2);
assert.match(pendingChoice, /aria-busy="true"/);
assert.doesNotMatch(
  pendingChoice,
  /aria-label="Close dialog"/,
  'Pending room transfer cannot be dismissed into another action',
);
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
const customMercyHelp = renderToStaticMarkup(
  <HowToPlayModal
    open
    inGame
    onClose={() => {}}
    rules={{
      ...NO_MERCY_RULES,
      mustDeclareUno: false,
      drawUntilPlayable: false,
      stackDraw2: false,
      stackWild4: false,
      sevenZero: false,
      allowDiscardAll: false,
      eliminationHandLimit: 0,
    }}
  />,
);
assert.match(customMercyHelp, /Rules at this table/);
assert.match(customMercyHelp, /One card per draw/);
assert.match(customMercyHelp, /Not required/);
assert.match(customMercyHelp, /Not in this deck/);
assert.doesNotMatch(
  customMercyHelp,
  /edition-guide|keep going until you can play|7 and 0|reach the table’s hand limit/,
  'Help must not contradict custom options with an unconditional original-edition rule list',
);
const colorChoice = renderToStaticMarkup(
  <ColorPicker playerName="Cleo" onSelect={() => {}} />,
);
assert.match(colorChoice, /<h2[^>]*>Choose a color<\/h2>/);
assert.match(colorChoice, /role="group" aria-label="Cleo’s color choice"/);
assert.doesNotMatch(
  colorChoice,
  /class="muted"/,
  'Normal color selection needs no repeated instruction paragraph',
);
const rouletteChoice = renderToStaticMarkup(
  <ColorPicker roulette onSelect={() => {}} />,
);
assert.match(
  rouletteChoice,
  /Draw until it appears, keep the cards, and miss this turn/,
);
const optionalRules = renderToStaticMarkup(
  <RulesSummary
    rules={{ startingHandSize: undefined, mustDeclareUno: undefined }}
  />,
);
assert.match(optionalRules, /7 each/);
assert.match(optionalRules, /Call with one card left/);
console.log(
  'Setup, knockout and empty-hand results, room recovery, published-only rule help, rule dependencies and native help naming passed.',
);
