# Quarter-hand verification — 2026-10-25

## Owner correction

The owner explicitly requested hiding just the lower quarter of the local player's cards behind the screen edge, to preserve the held-hand look and save space above. This supersedes the previous fully visible-bottom requirement. Landscape-only phones, foldable panel handling, centered piles and native card artwork remain.

## Implementation

`getHandFan` supplies the same angle/drop to the card component and crop calculation. `getHandCropMargin` includes the resting outer corner's rotation about 50% 120%, bounding the deepest cut to about one quarter rather than cutting tilted edge cards more deeply. The inner cards naturally expose more. The actual scrollport still contains each full face and extends below the clipped page through a measured negative bottom margin. Large hands continue to fit by overlap and scroll without shrinking.

Focused/inspected cards use proportional headroom and lift to show the complete face; their extra mouse-hover lift is suppressed. Hidden portrait measurement retains the previous crop until landscape returns. At usable heights <=300px, pile/seat spacing and ordinary deck bobbing are adjusted to retain clear player identities and inspection.

## Resting capture measurements

- desktop: 1440×900, 7 cards, deepest crop 25.00%.
- mobile: 568×320, 7 cards, deepest crop 24.96%.
- mobile-your-turn: 568×320, 7 cards, deepest crop 18.40%.
- phone-large-hand: 844×390, 30 cards, deepest crop 24.99%.
- tablet: 768×1024, 20 cards, deepest crop 25.01%.
- foldable-panel: 720×540, 20 cards, deepest crop 24.99%.
- short-browser: 844×280, 30 cards, deepest crop 24.96%.
- short-mobile: 568×280, 7 cards, deepest crop 18.40%.
- single-card: 844×390, 1 cards, deepest crop 25.04%.

Every recorded resting layout has zero document and vertical hand scrolling, viewport-matching document width and a maximum resting crop within 25.5% (the tolerance absorbs native pixel rounding; observed maxima are approximately 25%). Legal and inner-fan cards show more, not less. See final-metrics.json.

## Interaction checks

- Keyboard End on thirty cards reveals the entire focused final card inside the scrollport and viewport; Home reveals the first. Root, main, hand and document scrollTop all remain 0 after settled focus.
- Single-card focus reveals the full face with its outline visible.
- At 568×320 inspection, the full face bounds are y209.86–305.01 and vertical scrolling remains0.
- At 568×280 inspection, the full face bounds are y169.86–265.01 and the nearest player badge has 18.22px clearance from inspection.
- Portrait hides play behind the existing rotate prompt; landscape restores the same thirty-card hand and crop without resetting it.

The preview uses the actual GameBoard and useUnoGame with controlled valid decks and a paused controller in an isolated temporary copy on 3004. Cached production Latin Outfit/Barlow font files avoid unrelated cold font fetching; application font configuration is unchanged. Initial deals and interaction transitions were settled before final captures. No fixture route was added to the application. Panel screenshots establish composition, not physical hinge/touch behavior.

## Checks

Passed format, lint, check:types, check:game, check:audio, production build and full check:multiplayer against the dedicated 3014 socket service. The game checks include new shared-fan/crop assertions plus prior gesture, turn, engine, privacy, progress and motion coverage. No dependencies or test framework were added.

One source detector run reported only two pre-existing advisory rgba deck-material colors; no blocking findings. Independent finish review in finish-review.md returned **ship** for this bounded quarter-crop correction, with no material fixes. All thirteen required captures were accepted. Temporary services and preview copy are removed after review. No commit or deployment was performed.
