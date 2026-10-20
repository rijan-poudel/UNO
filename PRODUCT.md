# Product

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
