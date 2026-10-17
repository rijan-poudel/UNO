# Playful continuation — validation

Owner direction: playful original graphics, new typography, fewer navigation icons, tactile card motion, responsive phones, satisfying immediate sound. Canonical direction is `../../playful-direction.md`.

## Completed checks

- Production `next build`: passed (Next.js 16.4.2, React 19).
- ESLint, strict TypeScript and Prettier checks: passed.
- `git diff --check`: passed.
- `check:game`: 60 complete simulated six-player rounds across Classic, Stack party, Wild table and draw-until-playable configuration. Checks conservation, unique cards, immutable input, serialization, legal wild colors, opening action effects and UNO penalties.
- Progress checks: immutable updates, duplicate result suppression, JSON persistence, streak reset and best streak, corrupt-storage fallback. Preset identity tolerates hand-size and seat-capacity changes.
- `check:multiplayer`: create/join/kick, six-seat limit, sparse identity mapping, 24 live opening deals with correct action effects, individual bot broadcasts, pacing, reconnect and last-human refresh passed.
- The socket watcher now explicitly includes engine and type files. Touching `lib/gameSetup.ts` caused a verified process restart.
- Browser: complete local round, result, recorded single round across a rerender, fresh rematch deal, sound preview/master mute, Menu/leave, preset switching, six seats with 12 cards, wild color with keyboard selection, online create/add-bot/start and refresh to same seat.
- Document width at 320px is 320px; the large hand scrolls independently. Desktop home document width is 1440px at a 1440px viewport.
- One static design detector pass on changed UI/presentation targets: no findings (`detector.json`). No stale first-pass design-system context was applied.
- One shipping raster asset, with prompt provenance, checked by embed-prompt scan: no missing prompt.

## Evidence

Required production captures: `home-desktop.png`, `home-mobile.png`, `desktop.png`, `mobile.png`, `user-688.png`, `narrow-320.png`, `setup-mobile.png`, `settings-mobile.png`, `settings-desktop.png`, `lobby-mobile.png`, `wild-mobile.png`.

Captures cover 1440px desktop, 688px intermediate, 390px phone and 320px narrow phone. Main game captures show six seats and a large hand. Screens were inspected together, fixed in one batch and recaptured. The independent finish review follows that bounded pass.

## Scope and limits

Browser checks verify interactions and visible state; they do not measure physical speaker latency. Audio uses an interactive Web Audio clock, preloaded optional voice, no action waits, no delayed queue, and cancellation on mute/hidden state. Reduced-motion travel suppression and CSS fallbacks were reviewed in source; no OS setting was changed for this pass.

Progress belongs to this device and is not an authenticated ranking. Rooms remain casual in-memory multiplayer; the existing full-snapshot protocol is not adversarial anti-cheat. No Mercy, Flip and Flex require their own deck/action implementations and are not represented as playable presets.

## Public deployment follow-up

The redesign was pushed to GitHub main and Vercel reported a successful production deployment. The new home was verified on `https://uno-wheat-ten.vercel.app/`. GitHub verification passed. The public multiplayer connection initially appeared unavailable, then connected after a delay; room creation and game start were verified. The subsequent connection fix makes public endpoint configuration explicit and offers local bot recovery. A persistent-service Dockerfile is prepared; the existing hosted service was reachable after waking. A refresh check exposed overlapping old/new transports, now covered by an atomic known-device seat handoff and revocation checks. The final public check passed: created room 75PAU9, added a bot, started a round, played blue 2, received the bot response, and refreshed back into the same room with the same six-card hand and turn 3. The test room was deliberately left afterward. The persistent-service Dockerfile is prepared; its image was not built because the local Docker daemon was unavailable. The existing public service was used for the live check.
