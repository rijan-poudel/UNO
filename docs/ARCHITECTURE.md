# Working on the card club

## Start here

Read PRODUCT.md for intent and DESIGN.md for the shipped visual language. Keep rule decisions in the engine, turn ownership in the hooks/server, and presentation in components. Don’t restart the project to change its look.

## State and actions

`lib/gameActions.ts` accepts and returns serializable, immutable `GameState` snapshots. Local games use `useUnoGame`; online games use `useUnoOnlineGame`, backed by server acknowledgements and `room:update` events. GameBoard accepts their shared API union without pretending the online API is local.

Opening discards always have a real color; rejected wilds return to the deck. Colored opening actions apply their skip, reverse, or draw effect. A local game has one human. The online server checks room membership and turn ownership. Jump-in is validated against an exact matching card. A wild must receive one of the four real colors, including when it is a winning card. UNO declarations and call-outs are metadata actions; they must not clear the local voluntary-draw/pass state.

Online room seat IDs can differ from array positions after kicking/replacing players. Initialization explicitly maps game players back to room IDs. Never assume `player_1` is array index 1.

## Timing

Local and online bots wait about 760 ms. The online server publishes the triggering human action before scheduling one automated turn; it does not run a synchronous chain that hides intermediate actions. A pending callback rechecks current state and connection status before acting.

Human turns are not driven by a UI idle timer. A voluntary draw with no playable option automatically passes after a short delay. A playable draw leaves the choice to the player. Online disconnected seats are temporarily driven by bots while other humans remain. If no humans are connected, bot progression stops and the room has a 45-second reconnect window.

## Audio and motion

`useGamePresentation` compares snapshots, animates transforms using the Web Animations API, and plays feedback during the same transition. Nothing awaits an animation or audio duration before changing game state. Never bring back `getBoardVoiceRemainingMs()` or queue narration behind old actions.

`tableChimes` owns one interactive AudioContext and a cached paper-noise buffer. Browsers unlock it on a real user gesture. Locked/hidden-tab feedback is dropped. Volume, voice, card sounds, optional music, and master mute are independent preferences. `useAudioManager` owns only background music and gesture/settings subscriptions.

Voice assets are preloaded when enabled, use normalized compressed files, and expire if they cannot start promptly. A newer action, mute, hidden document, or leaving the board stops the old voice. Original WAVs remain source material, not runtime requests.

The presentation hook cancels animations and removes temporary flight nodes on unmount. Reduced motion uses state changes without travel. Do not animate `left`, `top`, or layout dimensions frame by frame.

## Reconnect and storage

The online hook keeps an active room in sessionStorage, with a persistent random device identity in localStorage. On reconnect it rejoins with that identity. New devices cannot join a started game. Rejoining restores the existing seat. Deliberate leave and kick clear the saved membership. Requests time out after six seconds; never leave a busy control waiting on an unbounded acknowledgement.

Rules, themes, names, friends, and audio preferences are local to the browser. Storage failure must not prevent play. The current casual-room protocol sends full game snapshots; UI concealment of opponent faces is not anti-cheat protection.

## Verification

Use `check:game` for immutable transitions, deck conservation, wild color validation, UNO penalties, and simulated completed rounds. Use `check:multiplayer` against a running socket server for the actual protocol. The socket watcher explicitly includes `lib/**/*.ts` and `types/**/*.ts`; engine edits must restart that process too. Live socket checks cover opening action penalties and direction, so a stale development server cannot silently pass. Run lint, type checks, and a production build. Browser checks should cover home, local setup, a six-seat table, a large hand, a wild picker, settings, room creation, and reconnect after refresh at desktop and phone widths.

No formal test framework is installed. Keep the existing checks lightweight. Ask the owner before introducing a framework or a major architectural dependency.

## Playful presentation and growth

Original clay card art lives in `public/art/card-pals.webp`, with its generation prompt alongside it. Fredoka is the display face; Nunito Sans is used for controls. The home header has one Settings control, plus invitations when they exist. The board keeps mute beside a compact Menu. Appearance, audio, profile and individual house rules live together in Settings.

`RulePresets` is shared by setup and Settings. `lib/rulePresets.ts` composes Classic, Stack party and Wild table using existing engine rules. Starting hand size and room capacity do not change a preset's identity. No Mercy, Flip and Flex are future deck/action systems, not aliases for current presets.

`GameFeedback` renders bounded special-card reactions and a short victory burst. The presentation hook uses 280 ms arcing throws, 260 ms draw arrivals, capped deal stagger and 180 ms hand reordering. Opponent draws animate card backs, not whole seats. Reduced motion removes travel; hidden documents cancel active flight nodes. A rematch resets the presentation baseline and deals a new hand.

Card sounds combine an immediate paper swipe with a short landing tap scheduled on the same interactive Web Audio clock. Special cards have distinct brief tonal signatures. Muting, disabling effects, setting effects volume to zero or hiding the page cancels scheduled feedback. No sound, voice or animation controls engine timing.

`lib/playerProgress.ts` records completed rounds, wins and streaks on this device. Terminal-state fingerprints prevent duplicate records on rerender/reconnect. `useSyncExternalStore` keeps home and results synchronized. Storage failures leave gameplay working. These are device-local achievements, not authenticated rankings or cross-device statistics.

## Public connection configuration

`lib/socketConnection.ts` resolves a neighboring port only for development and local port-3000 previews. Public deployments need an explicit `NEXT_PUBLIC_SOCKET_URL`. Missing/invalid configuration and connection failures produce an honest unavailable state with a local-bot recovery action. A successful connection clears the error. `Dockerfile.socket` packages the persistent service; Vercel serves the frontend separately. Hosting credentials and a public backend URL are operational prerequisites, not something the UI can invent.
