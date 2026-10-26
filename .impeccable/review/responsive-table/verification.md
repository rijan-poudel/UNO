# Centered responsive board verification — 2026-10-25

## Outcome

The owner approved rebuilding gameboard geometry for centered draw/discard piles, readable cards, consistent spacing and device adaptation. Confirmed phones remain landscape-only with the rotate prompt, and Duo means dual-screen/foldable devices.

The board now separates the central playing field, full-height hand, player identities and action lanes. Hand fitting changes overlap without shrinking faces; large hands keep a readable exposed strip and scroll independently. Paging gutters, full face clearance and keyboard focus remain available. Short panels reserve separate turn/actions positions, a bounded inspection lane and inset pile labels.

## Required project checks

Passed `npm run format`, `npm run lint`, `npm run check:types`, `npm run check:game`, `npm run check:audio`, `npm run build`, and `UNO_CHECK_SOCKET_URL=http://localhost:3014 npm run check:multiplayer` against the dedicated current socket server. No new dependencies or test framework were installed.

The new framework-free hand-layout check runs inside check:game: multiple viewport widths, 1/2/7/20/30/100-card hands and readable card sizes retain exposed strips; oversized hands overflow instead of shrinking; phone and panel orientation boundaries remain correct. Existing engine, motion, private-view, countdown, avatar and real multiplayer checks passed.

## Browser evidence

Used an isolated temporary copy on port 3004, actual GameBoard/useUnoGame/native dialogs and controlled valid deck states. Initial deals were allowed to finish before layout captures. The isolated preview uses cached production Latin Outfit and Barlow Condensed files to avoid an unrelated cold Google-font fetch; application font configuration was unchanged. No fixture route was added to the application or production build.

Final layout captures:

- desktop.png — 1440×900, six players, seven cards.
- mobile.png — 568×320, six players, seven cards.
- phone-large-hand.png — 844×390, six players, thirty cards.
- tablet.png — 768×1024, six players, twenty cards.
- laptop.png — 1024×600, four players, seven cards.
- foldable-panel.png — 720×540 usable-panel size, six players, twenty cards.
- three-seats.png — 960×600, three players, seven cards.
- five-seats.png — 1180×820, five players, thirty cards.
- large-display.png — 1800×1000, six players, thirty cards; recaptured below the provider's oversized screenshot cap and exact bitmap dimensions verified.
- two-seats.png — 844×390, two players, one card.

Every final-metrics.json layout has full vertical card-face clearance and document width equal to the viewport. Every player identity remains present. Keyboard End reveals and focuses the last card of thirty fully inside the scrollport; Home reveals the first. Native horizontal browsing remains independent of the document.

Interaction captures cover inspection, pair choice, wild-color choice, settled played-wild marker, Menu and portrait rotate gate. A real paired play removed both cards and set blue as the active color. A real wild play accepted blue; the complete color marker remains visible inside its pile. Rotation hides gameplay behind the existing prompt and restoring landscape preserves the hand. Existing controller checks establish timer/pause behavior; the paused browser fixture does not claim to test an elapsed live timer.

## Finish review

The independent finish review accepted the overall bounded layout and found two material 568×320 collisions: inspection against Cleo's badge, and Draw against Robin's badge. Both were corrected in one targeted review round. The inspection lane has 11.625px measured clearance below Cleo and retains its 44px Close target. The Draw label is inset into its own back. The chosen-wild marker is inset above its face with no identity intersection. See finish-review.md and verdict.md: the follow-up disposition is **ship**, covering both scored fixes, with no visible fix-induced regressions. This scoring verdict is not a second whole-surface audit.

The one source detector pass reported only three advisory color entries: two pre-existing deck material colors and a new scrollbar tone subsequently replaced by an existing tone. No second detector was run.

## Foldable scope and limits

When a browser reports two hardware segments, CSS environment values confine the board and game dialogs to the first uninterrupted panel. The portrait gate reads exact window.viewport.segments geometry where available and falls back to reported segment arrangement or the normal viewport. Container queries follow usable panel size.

Primary implementation references: [W3C CSS environment variables](https://www.w3.org/TR/css-env-1/) and [Chrome viewport-segments guidance](https://developer.chrome.com/blog/viewport-segments-api-shipped).

The foldable capture verifies panel-sized composition, not a physical hinge or browser posture emulation. Physical touch, actual hinge hardware, speakers and runtime OS reduced-motion execution still need device verification. Existing media-gated reduced-motion code and presentation checks remain intact; static screenshots do not certify them.

Temporary preview/socket services and the isolated fixture copy are removed after review. Main checkout sources, current fonts, existing artwork and unrelated user changes are preserved. No deployment or commit was performed.
