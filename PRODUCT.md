# Product

## October 24 — Color play experience replacement (current authority)

The owner rejects the congested character/card title screen and sparse game board, then explicitly approves combining the three new previews and delegates continuation: Classic supplies the blue arena and vivid cards, Color court supplies illustrated human portraits, After-hours supplies amber turn cues and action feedback. The new title screen has one primary Play action with smaller Create/Join controls; no giant cast or painted card buttons. Shared components serve every mode, with supported presets changing mood: Classic blue, Stack party deeper blue, Wild table plum. No Mercy remains future work until its engine exists. This supersedes earlier comic-world and no-visible-turn-HUD guidance.

The owner confirms a real countdown with automatic draw/pass. Human turns last 30 seconds; drawing or metadata cannot restart that clock. Unavoidable penalties resolve automatically after a short reaction; legal stacking remains a choice. Online deadlines belong to the server. Bots publish a draw separately from the following play/pass, with 1.15-second pacing. Low music starts after interaction by default; saved mute/music preferences remain authoritative. Local phone portrait pauses its timer; online rounds continue.

## October 23 whole-site identity replacement

The owner rejected the Microsoft AI Copilot feeling across the entire site and selected **Comic-card showdown** in the direction chooser, with a comp-led build, then delegated continuation. This replaces the prior visual identity across home, bot setup, online rooms, preferences, notifications, progress, results and arena chrome. Use confident black ink, warm-white panels, the native four-color palette, condensed italic display lettering, a new original comic cast and drawn ink accents. Preserve the existing engine, native card faces, held hand, direct play, accessible state, phone landscape gameplay, honest device-local history and immediate sound. This visual replacement supersedes previous palette, home artwork style and display-lettering constraints; it does not authorize changing game rules or replacing card handling.

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People playing a casual UNO game alone with bots or remotely with friends. Phone and desktop browsers are equally important. The audience description is inferred from the existing product; the owner has delegated the redesign decisions.

## Product Purpose

Make multiplayer UNO feel playful, tactile, social, and satisfying, with graphics leading the experience, responsive card motion, reliable multiplayer, flexible house rules, and immediate sound.

## Operating Context

Local games have one human and up to five bots. Online games use a Socket.IO server, room codes, persistent device identities, friend codes, invitations, and reconnect support. No account signup is required.

## Capabilities and Constraints

- Preserve the immutable TypeScript game engine and server-authoritative online games.
- Preserve configurable rules, wild color selection, draw stacking, UNO declarations and call-outs, invitations, bot seats, and rematches.
- Sound must respond to the current action without delaying turns or playing stale events.
- Small screens need readable cards, accessible controls, and a hand that remains usable with many cards.
- No test framework is configured; do not install one without asking.

## Long-term Direction

Support a broad family of UNO variants, including No Mercy, Flip, Flex, and community rules. These variants are product intent, not implemented capabilities. Current work prioritizes the feeling of playing the existing Classic and house-rule game.

## Brand Commitments

UNO is the existing product name. The owner explicitly authorized replacement of the entire visual interface, interaction design, motion, and sound experience. The prior appearance is an anti-reference. The owner explicitly requested playful graphics over text-heavy presentation, a different font, and fewer navigation icons. Their October 18 correction rejects the toy-like clay/Fredoka treatment, flat card row, irrelevant persistent buttons, and inaudible feedback. The priority is a modern game arena with a hand that feels held, legible vivid card faces, context-sensitive actions, and sound that reliably starts. Their October 19 correction rejects the low-interaction table and delegates another replacement: direct card play over a material-led after-hours table, with paper/contact feedback instead of melodies on ordinary moves.

The owner’s October 20 reference is Duolingo: expressive original characters, satisfying pressed controls and encouraging reactions tied to real play. Carry that emotional quality into the existing native-card world; preserve Outfit/Barlow and avoid copied mascots, noisy navigation or a return to the rejected clay treatment.

The owner’s five October 20 browser corrections reject the home’s side-column play controls, plain paper field, floating card faces, decorative number7 and heavily rounded action tiles. Home becomes a centered game title screen with original illustrated card-night artwork, visibly primary play controls and sharper corners. These corrections supersede the prior home composition and its review; live table mechanics, deck lettering and materials remain pinned.

## Product Principles

- Graphics lead; words clarify actions rather than fill the screen.
- Playing comes first: no blocking splash or decorative waiting.
- Always make the current turn, active color, and legal actions clear.
- Keep cards and controls usable with touch and keyboard.
- Audio supports the action and never controls game timing.
- Keep implementation and project guidance straightforward for future contributors.

## Entry and Turn UX

The owner’s follow-up rejects unresolved friction across the whole journey. Returning bot players should deal immediately from saved settings, with a separate setup path. Creation and joining must be distinct choices; room links and room codes use the same input, while persistent friend codes remain secondary. Hosts need rule controls before dealing. The owner’s October 19 correction rejects the low-interaction table. A legal card plays on its first tap or keyboard activation; upward drag and flick are equal direct paths. Nonmatching cards remain inspectable. Draw lives on the physical deck; Pass and UNO appear when applicable. A pre-inspected card may retain an explicit Play fallback when it becomes legal. Keyboard users browse the hand with arrow keys.

## Earned Play

The owner asks to gamify the interface while keeping direct play central. Near-finish opponents, real draw stacks, the completed-round scorecard and optional milestone collection carry that energy. Milestones reward actual device-local completed rounds and wins; they do not grant XP for clicks, introduce daily pressure, infer official points or represent account-wide standing. A collected best-streak milestone remains collected after later losses. Home keeps the play choices ahead of collection details on phones.

## Phone orientation

The owner requires landscape-only gameplay on phones. Home and setup remain usable in portrait; entering or rotating a match upright shows clear rotate guidance and a leave action. Local bot rounds pause until landscape returns. Online prompts state that the shared round continues. Keep the match within the available viewport, with horizontal large-hand scrolling and no document scrolling. Verify at568×320 and844×390, six seats,20cards and keyboard focus; portrait verifies the orientation gate rather than a second gameplay layout.

## October 21 arena correction

The owner rejects the baize/leather arena as poker-like. Replace that live table world with an open vibrant UNO play field. Crop roughly the bottom quarter of the held fan at the viewport edge, center the upper play area, and communicate local turns through a modest card lift/growth. Remove redundant bot-round text, header sound status/control, the word Menu, deck remaining count, ordinary active-color label and visible Your move caption. Use one icon-only menu; sound and room copy remain available inside. Preserve accessible state announcements, explicit penalty/Pass decisions and a chosen-color marker when a wild discard alone cannot communicate it. This supersedes earlier pinned table materials; retain their provenance as historical assets.

## Background correction

The owner rejected the electric-blue orbit background. Background decoration must recede behind the vivid held cards. The initial working replacement was a quiet, softly lit midnight stage; the open layout, cropped hand, sparse header and graphical state cues remain. Do not restore the rejected large blue ovals or casino furniture.

## Selected illustrated room

The owner answered the background preference with “An illustrated game-room setting.” This supersedes the quiet-stage assumption. Use original lounge artwork as a static setting around the live cards, with warm furniture above a clear petrol tabletop, compact opaque player-name backings, and responsive crops checked on desktop and landscape phones. Preserve the cropped held hand, sparse controls, direct play and accessible state cues. No illustrated element should impersonate a live card or control, obscure a pile, or delay play.

## October 22 corrective game layout

The owner rejected the shipped illustrated-room UI. Keep the selected room and native cards while making the play itself a close shared composition: piles near the held fan, readable graphical opponents, normal landscape cards visible before focus, and a shallow phone fan that stays scrollable with20cards. Desktop crop already broadly meets the brief; the phone extremes need more hand space. Contextual Pass/inspection controls need their own lane clear of the piles. These are corrective layout findings, not a request for more decorative artwork or a routine status HUD.

## October 23 journey and handling correction

The owner prioritizes the UI and the feeling of playing together. Landscape home must expose all three centered start actions alongside the complete original cast. The game menu should fit core decisions and Close on short screens; Close returns to play and Leave remains distinct. Keep native cards and the selected room while bringing desktop piles closer to the hand, strengthening static legal-card distinction, and making compact identities readable. Eligible missed-UNO catches belong to the player's badge instead of floating over piles. Gestures must preserve measured rendered pose through pickup/return and never suppress a later keyboard activation. This extends the existing world; it does not authorize a new theme or more decorative HUD.

## October 23 arena background choice

The owner rejected the room-image/blue-table split and explicitly chose “A colorful UNO-style arena without a room.” This supersedes the illustrated-room requirement for the live game background. Use a cohesive colorful arena with clear space for live cards; preserve the home artwork and game mechanics.

### Default table and home correction

Normal new tables use same-type stacking: +2 on +2, +4 on +4. Cross-type +4-on-+2 remains an explicit house rule; Classic remains an explicit preset. Old untouched Classic defaults migrate once; later explicit Classic preferences persist. Active rounds keep their rules until a new table is set up.

The user rejected the centered cream-poster homepage after the first comic pass. The selected replacement is the opening-hand title screen (b866813a): the menu itself is a hand of native illustrated cards, Play forward, Create and Join alongside. Keep controls semantic and immediate. A prior review is not approval when user evidence contradicts it.
