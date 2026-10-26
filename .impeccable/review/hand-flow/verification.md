# Hand flow verification — 2026-10-25

## Delivered

- Either matching-number card opens the legal pair choice; the valid lead goes first automatically. Illegal single-card plays remain rejected. Equivalent physical copies yield one visible pair outcome.
- Color / Number / Original display sorting is available in Game Menu and saved on the device. It never mutates authoritative hand or draw order.
- Blocked-card inspection explains turn, matching, stacking and finish restrictions in concise language.
- Explicit and atomic UNO calls have a distinct portrait reaction. Plays, penalties and wins use bounded decorative reactions; motion is media-gated and never blocks state.

## Checks

Passed format, lint, check:types, check:game, check:audio, production build and full check:multiplayer against the dedicated socket server on 3014. Engine checks cover pair-only legal lead resolution, invalid singles, exact-match restrictions, immutable sorting, storage failures, UNO and win handling. Network checks exercise real paired plays, atomic UNO, wins, avatars and private views. No new test framework or production fixture was added.

## Browser review

Used an isolated temporary copy on 3004 with the actual GameBoard, local game hook and valid deterministic full-deck states. Its preview used the project's cached Latin Outfit / Barlow Condensed font files because a fresh Google font fetch stalled; production font configuration was unchanged. Preview routes and servers were removed after review.

- Desktop 1280×720: activate blue 8 against a red pile with red 8 in hand; dialog offers only the valid pair. Enter commits both, declares UNO, leaves one card and returns focus to the hand.
- Landscape 568×320, six seats: blocked pair and finish explanations clear player names. Menu fits with a native sorting selector. Number preference survives a new 20-card hand; original restores raw dealing order.
- Actual UNO call: correct opponent displays UNO badge above its portrait without hiding the face.
- Actual six-card penalty: correct local portrait shows surprise and hand grows from three to nine.
- Actual final pair: two-card hand empties, one round win is recorded automatically and results open.

Screenshots: either-card-pair-desktop.png, blocked-pair-phone.png, finish-rule-phone.png, sorting-menu-phone.png, number-sorted-hand-phone.png, uno-reaction-phone.png, penalty-reaction-phone.png, pair-win-phone.png.

Reduced-motion behavior is covered by media-gated CSS and existing presentation checks; these static screenshots do not certify physical touch, animation timing or audible quality.
