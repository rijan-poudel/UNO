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

UNO is the existing product name. The owner explicitly authorized replacement of the entire visual interface, interaction design, motion, and sound experience. The prior appearance is an anti-reference. The owner explicitly requested playful graphics over text-heavy presentation, a different font, and fewer navigation icons. Their October 18 correction rejects the toy-like clay/Fredoka treatment, flat card row, irrelevant persistent buttons, and inaudible feedback. The priority is a modern game arena with a hand that feels held, legible vivid card faces, context-sensitive actions, and sound that reliably starts.

## Product Principles

- Graphics lead; words clarify actions rather than fill the screen.
- Playing comes first: no blocking splash or decorative waiting.
- Always make the current turn, active color, and legal actions clear.
- Keep cards and controls usable with touch and keyboard.
- Audio supports the action and never controls game timing.
- Keep implementation and project guidance straightforward for future contributors.
