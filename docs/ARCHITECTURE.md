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

`tableChimes` owns one interactive AudioContext, a decoded 280 ms recorded card sound, and an immediately available procedural fallback. Gesture unlock starts a one-frame silent buffer and resumes suspended/interrupted contexts. The latest action may survive an in-flight unlock for at most 160 ms; older actions and hidden-tab feedback are dropped. Playback never waits for fetching or decoding. The table subscribes to audio readiness and reflects effective card-sound preferences; enabling sound restores disabled effects/zero volume without changing optional voice or music. Volume, voice, card sounds, optional music, and master mute are independent preferences. `useAudioManager` owns only background music and gesture/settings subscriptions.

Voice assets are preloaded when enabled, use normalized compressed files, and expire if they cannot start promptly. A newer action, mute, hidden document, or leaving the board stops the old voice. Original WAVs remain source material, not runtime requests.

The presentation hook cancels animations and removes temporary flight nodes on unmount. Reduced motion uses state changes without travel. Do not animate `left`, `top`, or layout dimensions frame by frame.

## Reconnect and storage

The online hook keeps an active room in sessionStorage, with a persistent random device identity in localStorage. On reconnect it rejoins with that identity. New devices cannot join a started game. Rejoining restores the existing seat. If the previous transport still looks connected during a refresh, the known device takes over the seat atomically: its old socket loses membership before receiving a seat-moved notice. A delayed old disconnect cannot evict the new connection. Deliberate leave and kick clear the saved membership. Requests time out after six seconds; never leave a busy control waiting on an unbounded acknowledgement.

Rules, themes, names, friends, and audio preferences are local to the browser. Storage failure must not prevent play. The current casual-room protocol sends full game snapshots; UI concealment of opponent faces is not anti-cheat protection.

## Verification

Use `check:audio` for gesture-resume races, expired feedback, mute, hidden tabs, offline fallback and recorded-sample signal levels. Use `check:game` for immutable transitions, deck conservation, wild color validation, UNO penalties, and simulated completed rounds. Use `check:multiplayer` against a running socket server for the actual protocol. The socket watcher explicitly includes `lib/**/*.ts` and `types/**/*.ts`; engine edits must restart that process too. Live socket checks cover opening action penalties and direction, so a stale development server cannot silently pass. Run lint, type checks, and a production build. Browser checks should cover home, local setup, a six-seat table, a large hand, a wild picker, settings, room creation, and reconnect after refresh at desktop and phone widths.

For rare near-finish layouts, `.impeccable/review/play-feedback/fixture.mjs` provides explicitly seeded local states using the real engine and unique cards. Follow its README, restore the normal socket server afterward, and never deploy the fixture.

No formal test framework is installed. Keep the existing checks lightweight. Ask the owner before introducing a framework or a major architectural dependency.

## Playful presentation and growth

Home uses the original card-club illustration in public/artwork/card-night-flat.webp. Its centered title-screen layout and sharp controls live in app/home.css, imported after the incumbent sheets. HomeScreen owns semantic Play/Create/Join actions; the artwork is a separate preloaded, already-optimized asset and never blocks those controls. The old home fan/card-face markup is removed. Legacy home-* CSS is not authority for the new launch-* surface. Outfit is the interface face; Barlow Condensed is reserved for card indices and symbols. UnoCard.module.css owns the shared saturated card inks, laminate, thin physical edge and bounded CSS3D hover; app/table.css owns the underlying deck geometry and table texture sources; app/arena.css, imported afterward, owns the canonical viewport geometry. The table boundary is a direct child of game-main and extends behind both central play and the local hand. HandCard owns first-activation legal play, nonmatching-card inspection and upward drag. Its temporary fixed-position card escapes the hand scroller and is removed on cancellation, lost capture, legality changes or unmount. Large hands scroll without shrinking card faces. The home header has one Settings control, plus invitations when they exist. It keeps the card-club palette while dialogs and supporting pages retain the selected theme. The board keeps mute beside a compact Menu. Appearance, audio, profile and individual house rules live together in Settings.

Home quick play deals with the saved crew and shared rules; setup is a separate path. `getSavedPlayerNames` is the common crew reader. `savePlayerName` normalizes and publishes committed name edits; setup and lobby subscribe so a Profile save updates an already-open form. Name fields keep drafts while typing and commit on blur, while setup also commits before dealing. Storage failure never prevents starting a round. Setup folds optional bot naming behind native disclosure. `TableRules` shares presets, starting hand size and the custom-rule entry between bot setup and online hosts. Joining accepts a six-character code or a full invitation link through `lib/roomCodes.ts`; friend codes stay in a separate disclosure.

GameBoard derives the hand action dock from current legality: selected-card Play (named with its color/value), Draw or Pass on the local turn, and eligible UNO. Exact-match jump-ins expose Play out of turn. Hints follow the same local/waiting/drawn/pending/offline state. The selected card scrolls into view on selection and resize; manual scrolling never removes its identity from the action label. A local draw reveals the actual newly added card before arrival measurements, without selecting it or changing engine timing. Initial deals, opponent draws and shuffles preserve horizontal position. The existing move hint names a single draw and truthfully describes automatic passing. The redundant hand title/count row is removed visually (the hand region retains an accessible count); eligible UNO floats at the upper-right edge of the hand. The bottom dock holds contextual Play and Pass. Left/Right/Home/End move focus within the hand. The physical pile and deliberate upward dragging are equal direct actions.

`RulePresets` is shared by setup and Settings. `lib/rulePresets.ts` composes Classic, Stack party and Wild table using existing engine rules. Starting hand size and room capacity do not change a preset's identity. No Mercy, Flip and Flex are future deck/action systems, not aliases for current presets.

`GameFeedback` renders bounded special-card reactions and a short victory burst. The presentation hook uses distance-bounded 190–262 ms throws, 260 ms draw arrivals, capped deal stagger and 180 ms hand reordering. Opponent draws animate card backs, not whole seats. Reduced motion removes travel; hidden documents cancel active flight nodes. A rematch resets the presentation baseline and deals a new hand.

Card sounds combine an immediate paper swipe with a short landing tap scheduled on the same interactive Web Audio clock. Special cards retain paper/contact feedback; short tonal cues belong to UNO, call-outs and round results. Muting, disabling effects, setting effects volume to zero or hiding the page cancels scheduled feedback. No sound, voice or animation controls engine timing.

`lib/playerProgress.ts` records completed rounds, wins and streaks on this device. Terminal-state fingerprints prevent duplicate records on rerender/reconnect. `useSyncExternalStore` keeps home and results synchronized. Storage failures leave gameplay working. These are device-local achievements, not authenticated rankings or cross-device statistics.

## Public connection configuration

`lib/socketConnection.ts` resolves a neighboring port only for development and local/LAN previews. Public deployments need an explicit `NEXT_PUBLIC_SOCKET_URL`. Missing/invalid configuration and connection failures produce an honest unavailable state with a local-bot recovery action. A successful connection clears the error. `Dockerfile.socket` packages the persistent service; Vercel serves the frontend separately. Hosting credentials and a public backend URL are operational prerequisites, not something the UI can invent.

### Direct table interaction (October 19)

`HandCard` plays a legal card on one activation and inspects a nonmatching card. Pointer pickup primes audio synchronously and produces short paper feedback. Vertical drags clone the actual face; `lib/cardGesture.ts` determines deliberate upward release versus scrolling/cancel. Its small assertion check runs as part of `check:game`. `onDragChange` exposes landing feedback to `GameBoard`, while the immutable engine remains the only source of legal actions. The physical draw pile is the Draw control; the bottom dock holds contextual Pass and an explicit Play fallback for a card inspected before its turn. The discard retains two prior faces under the current card.

Review evidence in `.impeccable/review/direct-play/` uses the earlier loopback-only preview fixture, never a deployed multiplayer service. Native browser assertions and screenshots have separate scope from physical speaker quality.

### Earned table moments

`getProgressMilestones` derives four collectible milestones from existing device-local completed-round history. It uses best streak for the three-in-a-row collectible, so losing a later round does not remove an earned milestone. No new storage schema, XP, official point scoring or reward event queue is introduced. `PlayerProgress` reads the external store; its exported pure `ProgressCollection` view accepts a validated record for isolated previews without writing history.

`RoundSummary` renders the terminal winner and each player's actual cards left. Winner first and then seat order is presentation, not inferred finishing ranks. The native result dialog scrolls for six seats or expanded milestones; its real rematch/home actions remain reachable. The GameBoard routes online readiness and rematches as before. Opponent one-card markers belong to the physical hand, the compact Catch action has a full accessible name, and the deck displays the real pending draw count. A successful catch or resolved draw removes the corresponding state feedback.

Review fixtures in `.impeccable/review/table-rewards/` include a temporary server-rendered preview page. It renders terminal engine data and illustrative progress through pure UI; it never records a sample result. The preview route is removed before production builds and is not deployed.

## Presentation continuity and accessibility

`lib/cardMotion.ts` provides pure card-flight geometry and bounded timing. `useGamePresentation` captures the real source pose, renders a fixed-position card copy and temporarily hides its endpoint, then removes interrupted copies on each published snapshot, visibility loss, unmount or a reduced-motion change. Hand reflow retains each wrapper’s existing fan transform and compares layout positions rather than viewport scroll offsets. Flights never control game or bot timing; large local arrivals are capped at six representative cards.

The hand retains focus after a played card disappears. Modal cleanup returns focus to a connected opener unless another dialog is open. HandCard primes audio on contact, sounding pickup only for vertical lift or an actual tap/keyboard activation. Scrolling remains silent. Audio preferences fall back to session memory if persistence fails and still notify subscribers. Viewport sizing and landscape composition belong in `app/arena.css`; the fixed arena’s primary controls use the same lime/dark-ink pairing in all root themes.

Online room acquisition, invitation acceptance and automatic reconnect use a membership revision. Leaving or being kicked invalidates outstanding room work. A stale successful acquisition releases only its acknowledged server room. Broadcasts update an existing matching room only; late bot broadcasts and maintenance acknowledgements cannot re-open a departed table. Lobby Back also cancels a create/join still awaiting acknowledgement. The loopback race fixture in `.impeccable/review/interaction-audit/fixture.mjs` exercises both late broadcasts and delayed join cancellation.

## Expressive players

`lib/playerExpression.ts` derives decorative faces from the current published snapshot: thinking for the active player, surprise for pending or received penalties, delight for a play/UNO, and celebration for the winner. `PlayerAvatar` owns the original card-face grammar. Labels/counts remain the accessible source of game information; expressions are hidden from assistive technology and never modify state. One short reaction replaces idle animation loops, and reduced motion keeps static expressions.

The existing public Socket.IO service is `https://uno-411x.onrender.com`, supplied by the owner and verified with the full remote protocol suite on October 20. Vercel already points to it; the frontend was connected and created/left a room with the local socket process stopped. No authentication or environment change was required. `/health` reports service readiness; a successful check is not a guarantee of continuous uptime.

### Centered home composition

The owner rejected the side-column home, floating card faces, plain paper field, decorative7 and rounded action tiles, then rejected the cinematic furry artwork as boxed and over-rendered. Home now uses a simpler flat transparent character illustration above the central Play/Create/Join group with6px controls. The complete1729:910 cut-out fits820px desktop/740px tablet; phone frames230/184px contain the entire scene. The215.6KiB WebP retains true alpha. Exact built-in prompt and provenance live in `.impeccable/review/shared-table/art-prompt.txt` and the asset’s `.webp.json`; the rejected raster was removed. HTML controls never wait for image loading.

### Shared table and landscape phone play (October20)

`app/arena.css` is the geometry authority layered after legacy table styles: fixed100dvh flex page, zero-minimum flexible upper arena and bounded lower hand. No document scroll is needed for a match. `GameBoard` renders one table boundary behind opponents, piles, status and local hand. Raised cards have padding inside the horizontal scrollport; hovered cards layer above focused neighbors. `revealHandCard` scrolls only that container horizontally, and a resize observer re-reveals focus/inspection after window changes. Direction and next player are readable in Menu; no unexplained arrow remains on the felt.

Phone gameplay is landscape only. `usePhonePortrait` shares a portrait-and-max-width700px media query between the page and board. Portrait hides gameplay and presents a rotate screen with Leave. Local `useUnoGame(paused)` cancels bot/auto-pass timers and guards callbacks through a live ref; rotating back restarts the current turn. Keyboard play is blocked during the gate. An online table cannot pause other participants, so its prompt explicitly says the round continues. Home/setup remain usable in portrait; the gate does not request unsupported browser orientation locks.

Short landscape uses a single full-width felt, compact opponent identities across the top, central piles, status on the left and the hand below. Horizontal scrolling retains readable faces for20-card hands, and native dialogs keep their own scrolling. Verification packet `.impeccable/review/shared-table/` includes845×765 reference,568×320/844×390 landscape, portrait gate, hover/focus and transparent home captures. The loopback-only fixture runs3011 while preview runs3010; never deploy it.

### Vivid card materials

`components/UnoCard.module.css` travels with `UnoCard` into local hands, pile history and cloned flight cards. Four full-color overlapping cards identify Wild Draw Four, with the existing+4 indices and accessible label. Separate dark green/yellow index inks keep small phone corners readable. Material gradients stay shallow and a bounded laminate sweep accompanies a five-degree CSS perspective tilt only for hover-capable fine pointers with no reduced-motion preference. Contact settles the face before the gesture or flight captures its pose. There is no pointer tracking loop, per-hover React state or new graphics dependency.

`app/arena.css` retains the viewport layout and now selects richer felt/navy leather, directional contact shadows, bright turn/UNO accents and native color choices. `app/home.css` retains the title-screen layout and transparent artwork, while its primary/create/join buttons use saturated yellow/blue/crimson with press depth. `PlayerAvatar` supplies a stronger six-color palette. At568×320,28pxone-lineidentities and accessible-only pile captions clear the deck and its count chip; root overflow:clip prevents ancestor focus scrolling while the hand retains native horizontal scrolling. The prior portrait gate, local pause and online continuation remain unchanged. `.impeccable/review/vivid-depth/check-contrast.mjs` verifies small-card corner ink contrast at both laminate-gradient extremes and native control inks without a test framework.
